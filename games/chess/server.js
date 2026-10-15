'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomInt, randomUUID } = require('node:crypto');
const { WebSocketServer } = require('ws');
const { Chess } = require('chess.js');
const { tableSettings,record }=require('../shared/table-settings');
const {snapshotRoom}=require('../shared/room-service');
const CLOCKS = {
  casual:null,
  blitz5:{initialMs:300000,incrementMs:0,label:'Quick Play · Blitz 5+0'},
  blitz3plus2:{initialMs:180000,incrementMs:2000,label:'Blitz 3+2'}
};
function chessSettings(input={},previous) {
  const next=tableSettings(input,previous);
  next.clockMode=input.clockMode??previous?.clockMode??'casual';
  if(!Object.hasOwn(CLOCKS,next.clockMode))throw Error('Pilih Santai, Blitz 5+0, atau Blitz 3+2.');
  return next;
}

function createChessServer({ getAddresses = () => [] } = {}) {
  const rooms = new Map();
  let closing = false, hub = null;
  const files = new Map([
    ['/', ['public/index.html','text/html; charset=utf-8']],
    ['/client.js', ['public/client.js','application/javascript; charset=utf-8']],
    ['/pieces.js', ['public/pieces.js','application/javascript; charset=utf-8']],
    ['/style.css', ['public/style.css','text/css; charset=utf-8']]
  ]);
  const server = http.createServer((req,res) => {
    let pathname;
    try { pathname = new URL(req.url,'http://localhost').pathname; } catch { res.writeHead(400); return res.end(); }
    const entry = files.get(pathname);
    if (!entry || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname,entry[0]),(error,data) => {
      if (error) { res.writeHead(500); return res.end('Cannot load chess'); }
      res.writeHead(200,{ 'Content-Type':entry[1], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
  const send = (ws,data) => { if (ws?.readyState === 1) ws.send(JSON.stringify(hub ? hub.enrich(ws,data) : data)); };
  const nameFor = value => String(value || '').replace(/[\u0000-\u001f\u007f<>"\\]/g,'').trim().slice(0,24) || 'Pemain';
  const opposite = color => color === 'w' ? 'b' : 'w';
  function codeFor() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let length = 4; length <= 6; length++) for (let attempt = 0; attempt < 200; attempt++) {
      let code = ''; for (let i = 0; i < length; i++) code += alphabet[randomInt(alphabet.length)];
      if (!(rooms.has(code)||hub?.hasCode(code))) return code;
    }
    throw new Error('Kode room sedang penuh. Coba lagi.');
  }
  function playerFor(name,color,bot = false) { return { id:randomUUID(), token:bot ? null : randomUUID(), name:nameFor(name), color, bot, score:0, connected:bot, left:false, ws:null }; }
  function hostFor(room) { return room.players.find(p => !p.bot && !p.left && p.connected) || room.players.find(p => !p.bot && !p.left); }
  const ready = room => room.players.length === 2 && room.players.every(p => p.connected && !p.left);
  function clockView(room,now=Date.now()) {
    const control=CLOCKS[room.settings.clockMode||'casual'];if(!control)return null;
    const c=room.clock,remaining={w:c?.remaining?.w??control.initialMs,b:c?.remaining?.b??control.initialMs};
    if(c?.active&&c.startedAt!==null)remaining[c.active]=Math.max(0,remaining[c.active]-Math.max(0,now-c.startedAt));
    return {...control,remaining,active:room.phase==='playing'&&!room.recovering?c?.active||null:null,sampledAt:now};
  }
  function consumeClock(room,now=Date.now()) {
    if(!room.clock)return;
    room.clock.remaining=clockView(room,now).remaining;room.clock.active=null;room.clock.startedAt=null;
  }
  function finishOnTime(room,color) {
    const opponent=opposite(color),canMate=room.chess.board().flat().some(p=>p?.color===opponent&&p.type!=='k')&&!room.chess.isInsufficientMaterial();
    finish(room,canMate?'waktu habis':'waktu habis · lawan tidak memiliki materi untuk mat',canMate?opponent:null);
  }
  function clockExpired(room,now=Date.now()) {
    const color=room.clock?.active;
    if(room.phase==='playing'&&color&&clockView(room,now).remaining[color]<=0){finishOnTime(room,color);return true;}
    return false;
  }
  function armClock(room) {
    clearTimeout(room.clockTimer);room.clockTimer=null;
    if(clockExpired(room))return true;
    consumeClock(room);
    if(closing||room.recovering||room.phase!=='playing'||!ready(room)||!room.clock)return false;
    const color=room.chess.turn();
    if(room.clock.remaining[color]<=0){finishOnTime(room,color);return true;}
    room.clock.active=color;room.clock.startedAt=Date.now();
    const match=room.matchId,ply=room.chess.history().length;
    room.clockTimer=setTimeout(()=>{
      room.clockTimer=null;
      if(closing||room.recovering||room.phase!=='playing'||match!==room.matchId||ply!==room.chess.history().length)return;
      if(clockExpired(room)||armClock(room))broadcast(room);
    },room.clock.remaining[color]);
    return false;
  }
  function note(room,text) { room.chat.push({ id:randomUUID(), name:null, text, time:Date.now() }); room.chat = room.chat.slice(-70); }
  function publicState(room,entity) {
    const game = room.chess, ply = game.history().length;
    return { type:'state', code:room.code, settings:room.settings,clock:clockView(room),ledger:room.ledger,phase:room.phase, practice:room.practice, matchId:room.matchId, ply,
      you:entity.id, yourColor:entity.color, spectator:entity.color === null, hostId:hostFor(room)?.id || null,
      players:room.players.map(p => ({ id:p.id, name:p.name, score:p.score, color:p.color, bot:p.bot, connected:p.connected, left:p.left })),
      board:game.board().flat().filter(Boolean), turn:game.turn(), check:game.isCheck(), ready:ready(room),
      legalMoves:room.phase === 'playing' && ready(room) && entity.color === game.turn() ? game.moves({ verbose:true }).map(m => ({ from:m.from, to:m.to, promotion:m.promotion || null })) : [],
      history:game.history(), lastMove:room.lastMove, result:room.result, drawOffer:room.drawOffer,
      rematch:[...room.rematch], chat:room.chat.slice(-60), spectators:room.spectators.filter(p => p.connected).length,
      pgn:game.pgn(), botDelay:3000, addresses:getAddresses() };
  }
  function broadcast(room) {
    if (closing) return;
    hub?.changed(room);
    for (const entity of [...room.players,...room.spectators]) if (entity.connected && !entity.bot) send(entity.ws,publicState(room,entity));
  }
  function finish(room,reason,winner = null) {
    if(room.phase!=='playing')return;
    consumeClock(room);clearTimeout(room.clockTimer);room.clockTimer=null;
    record(room,room.players.map(p=>winner?(p.color===winner?1:-1):0),'Pertandingan '+room.matchId+' · '+reason);
    clearTimeout(room.botTimer); room.botTimer = null; room.phase = 'finished'; room.drawOffer = null;
    room.result = { reason, winner, name:winner ? room.players.find(p => p.color === winner)?.name : null };
    room.chess.setHeader('Result',winner === 'w' ? '1-0' : winner === 'b' ? '0-1' : '1/2-1/2');
    note(room,winner ? `${room.result.name} menang — ${reason}.` : `Remis — ${reason}.`);
  }
  function detectResult(room) {
    const game = room.chess;
    if (game.isCheckmate()) finish(room,'skakmat',opposite(game.turn()));
    else if (game.isStalemate()) finish(room,'stalemate');
    else if (game.isInsufficientMaterial()) finish(room,'materi tidak cukup');
    else if (game.isThreefoldRepetition()) finish(room,'posisi berulang tiga kali');
    else if (game.isDrawByFiftyMoves()) finish(room,'aturan 50 langkah');
  }
  // A modest practice opponent: prefer captures, development, and safe destinations.
  function chooseBotMove(game,level) {
    const values = { p:100, n:320, b:330, r:500, q:900, k:20000 };
    const candidates = game.moves({ verbose:true }), ranked = [];
    if(level==='easy')return candidates[randomInt(candidates.length)];
    const perspective=game.turn();
    const material=()=>game.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===perspective?1:-1)*values[p.type],0);
    for (const candidate of candidates) {
      game.move({ from:candidate.from, to:candidate.to, promotion:candidate.promotion });
      let score = (values[candidate.captured] || 0) * 10 + (candidate.promotion ? (values[candidate.promotion] - 100) * 10 : 0);
      if (game.isCheckmate()) score = 1000000;
      else {
        const replies = game.moves({ verbose:true });
        if (replies.some(m => m.to === candidate.to && m.captured)) score -= values[candidate.promotion || candidate.piece] * 8;
        if (replies.some(m => m.san.endsWith('#'))) score -= 200000;
        const center = 7 - Math.abs(candidate.to.charCodeAt(0) - 100.5) - Math.abs(Number(candidate.to[1]) - 4.5);
        score += center * (['n','b'].includes(candidate.piece) ? 5 : 1);
        if (candidate.piece === 'p') score += (candidate.color === 'w' ? Number(candidate.to[1]) - 2 : 7 - Number(candidate.to[1])) * 2;
        if (candidate.flags.includes('k') || candidate.flags.includes('q')) score += 35;
        if (game.isCheck()) score += 6;
      }
      if(level==='hard'&&!game.isCheckmate()){
        const replies=game.moves({verbose:true});let worst=Infinity;
        for(const reply of replies){game.move({from:reply.from,to:reply.to,promotion:reply.promotion});const v=game.isCheckmate()?-1000000:material();worst=Math.min(worst,v);game.undo();}
        score+=(Number.isFinite(worst)?worst:material())*5;
      }
      game.undo(); ranked.push({ candidate,score });
    }
    const best = Math.max(...ranked.map(r => r.score)), options = ranked.filter(r => r.score >= best - 8);
    return options[randomInt(options.length)].candidate;
  }
  function armBot(room) {
    clearTimeout(room.botTimer); room.botTimer = null;
    if(armClock(room))broadcast(room);
    if (closing || room.recovering || room.phase !== 'playing' || !ready(room) || !room.players.find(p => p.color === room.chess.turn())?.bot) return;
    const match = room.matchId, ply = room.chess.history().length;
    room.botTimer = setTimeout(() => {
      room.botTimer = null;
      if (closing || room.phase !== 'playing' || !ready(room) || match !== room.matchId || ply !== room.chess.history().length) return;
      try {
        const move = chooseBotMove(room.chess,room.settings.botLevel);
        applyMove(room,{ from:move.from, to:move.to, promotion:move.promotion });
      } catch (error) { console.error('Chess bot:',error.message); note(room,'Bot berhenti sementara. Buat room latihan baru jika diperlukan.'); broadcast(room); }
    },3000);
  }
  function applyMove(room,input) {
    const acceptedAt=Date.now();
    if(clockExpired(room,acceptedAt)){broadcast(room);return;}
    const move = room.chess.move(input);
    consumeClock(room,acceptedAt);
    if(room.clock)room.clock.remaining[move.color]+=room.clock.incrementMs;
    room.lastMove = { from:move.from, to:move.to, san:move.san, color:move.color };
    room.active = Date.now();
    if (room.drawOffer?.color !== move.color) room.drawOffer = null;
    detectResult(room); armClock(room); broadcast(room); armBot(room);
  }
  function start(room,swap = false) {
    if (!ready(room)) throw new Error('Tunggu kedua pemain terhubung sebelum mulai.');
    clearTimeout(room.botTimer);
    if (swap) for (const p of room.players) p.color = opposite(p.color);
    room.chess = new Chess(); room.phase = 'playing'; room.result = null; room.lastMove = null;
    room.drawOffer = null; room.rematch.clear(); room.matchId++; room.active = Date.now();
    const control=CLOCKS[room.settings.clockMode||'casual'];
    room.clock=control?{remaining:{w:control.initialMs,b:control.initialMs},incrementMs:control.incrementMs,active:null,startedAt:null}:null;
    armClock(room);
    for (const [key,value] of Object.entries({ Event:'Meja Kita · Catur', White:room.players.find(p => p.color === 'w').name, Black:room.players.find(p => p.color === 'b').name, TimeControl:control?`${control.initialMs/1000}+${control.incrementMs/1000}`:'-', Result:'*' })) room.chess.setHeader(key,value);
    note(room,'Permainan dimulai. Putih melangkah lebih dulu.'); broadcast(room); armBot(room);
  }
  function attach(ws,room,entity) {
    const previous = entity.ws;
    if (previous && previous !== ws) { previous.room = null; previous.entity = null; send(previous,{ type:'replaced' }); previous.close(1000,'Session moved'); }
    entity.ws = ws; entity.connected = true; ws.room = room; ws.entity = entity; room.active = Date.now();
    armClock(room);send(ws,{ type:'joined', code:room.code, token:entity.token, id:entity.id }); broadcast(room); armBot(room);
  }
  function detach(ws,explicit = false) {
    const room = ws.room, entity = ws.entity;
    ws.room = null; ws.entity = null;
    if (!room || !entity || entity.ws !== ws) return;
    clockExpired(room);consumeClock(room);
    entity.ws = null; entity.connected = false; room.active = Date.now();
    if (entity.color === null) {if(!entity.hasAccount)room.spectators = room.spectators.filter(p => p !== entity);}
    else if (explicit) {
      note(room,`${entity.name} keluar dari room.`);
      if (room.phase === 'lobby') { room.players = room.players.filter(p => p !== entity); room.players.forEach((p,i) => p.color = i === 0 ? 'w' : 'b'); }
      else { if (room.phase === 'playing') finish(room,'lawan meninggalkan meja',opposite(entity.color)); entity.left = true; entity.token = null; }
    }
    broadcast(room); armBot(room);
  }
  const wss = new WebSocketServer({ server, maxPayload:8192, verifyClient:info => {
    if (!info.origin) return true;
    try { return new URL(info.origin).host === info.req.headers.host; } catch { return false; }
  } });
  wss.on('error',error => console.error('Chess WebSocket:',error.message));
  wss.on('connection',ws => {
    ws.alive = true; ws.count = 0; ws.window = Date.now(); ws.room = null; ws.entity = null;
    ws.on('error',() => {}); ws.on('pong',() => { ws.alive = true; });
    ws.on('message',raw => {
      if (closing) return;
      if (Date.now() - ws.window > 1000) { ws.window = Date.now(); ws.count = 0; }
      if (++ws.count > 30) return ws.close(1008,'Too many requests');
      try {
        const msg = JSON.parse(raw.toString());
        if (!msg || typeof msg !== 'object') throw new Error('Pesan tidak valid.');
        if (hub?.handle(ws,msg)) return;
        if (['create','join','resume'].includes(msg.type)) {
          if (ws.entity) throw new Error('Keluar dari room sekarang sebelum pindah.');
          if (msg.type === 'create') {
            if (rooms.size >= 200) throw new Error('Server penuh. Coba lagi nanti.');
            const entity = playerFor(msg.name,'w'), room = { code:codeFor(), practice:msg.practice === true,
              players:[entity], spectators:[], settings:chessSettings(msg.settings),ledger:[],phase:'lobby', chess:new Chess(), result:null, lastMove:null,
              drawOffer:null, rematch:new Set(), chat:[], matchId:0, active:Date.now(), botTimer:null,clock:null,clockTimer:null };
            if (room.practice) room.players.push(playerFor('Meja Bot','b',true));
            rooms.set(room.code,room); note(room,`${entity.name} membuka meja catur.`); attach(ws,room,entity); return;
          }
          const code = String(msg.code || '').trim().toUpperCase(), room = rooms.get(code);
          if (!room) { send(ws,{ type:'error', message:'Room tidak ditemukan. Buat room baru atau cek kode.', sessionUnavailable:msg.type === 'resume',fatal:msg.type === 'resume' }); return; }
          if (msg.type === 'resume') {
            const entity = [...room.players,...room.spectators].find(p => !p.left && p.token && p.token === msg.token);
            if (!entity) { send(ws,{ type:'error', message:'Sesi sudah berakhir. Gabung dengan kode room.', fatal:true,sessionUnavailable:true }); return; }
            attach(ws,room,entity); return;
          }
          const spectator = room.phase !== 'lobby' || room.players.length >= 2;
          if (spectator && room.spectators.filter(p=>p.connected&&!p.bot).length >= 16) throw new Error('Kursi penonton penuh.');
          const entity = playerFor(msg.name,spectator ? null : room.players.length === 0 ? 'w' : 'b');
          (spectator ? room.spectators : room.players).push(entity); note(room,`${entity.name} ${spectator ? 'menonton' : 'bergabung'}.`); attach(ws,room,entity); return;
        }
        const room = ws.room, entity = ws.entity;
        if (!room || !entity) throw new Error('Gabung ke room dulu.');
        if(clockExpired(room)){broadcast(room);if(!['chat','leave'].includes(msg.type))throw Error('Waktu habis. Hasil sudah dicatat server.');}
        room.active = Date.now();
        if (msg.type === 'leave') { detach(ws,true); send(ws,{ type:'left' }); return; }
        if (msg.type === 'chat') {
          const text = String(msg.text || '').replace(/[\u0000-\u001f]/g,'').trim().slice(0,240);
          if (text) { room.chat.push({ id:randomUUID(), name:entity.name, text, emoji:msg.emoji===true, time:Date.now() }); room.chat = room.chat.slice(-70); broadcast(room); }
          return;
        }
        if (entity.color === null || entity.left) throw new Error('Penonton tidak bisa menggerakkan bidak.');
        if(msg.type==='settings'){
          if(room.phase!=='lobby'||entity.id!==hostFor(room)?.id)throw new Error('Pengaturan dikunci setelah mulai; hanya host di lobby.');
          room.settings=chessSettings(msg.settings,room.settings);broadcast(room);return;
        }
        if (msg.type === 'start') {
          if (room.phase !== 'lobby' || entity.id !== hostFor(room)?.id) throw new Error('Hanya host yang bisa mulai.');
          room.settings=chessSettings(msg.settings,room.settings);return start(room);
        }
        if (msg.type === 'rematch') {
          if (room.phase !== 'finished') throw new Error('Selesaikan permainan dulu.');
          if (!ready(room)) throw new Error('Kedua pemain harus kembali. Jika lawan sudah keluar, buat room baru.');
          room.rematch.add(entity.id); for (const p of room.players) if (p.bot) room.rematch.add(p.id);
          if (room.players.every(p => room.rematch.has(p.id))) return start(room,true);
          broadcast(room); return;
        }
        if (room.phase !== 'playing') throw new Error('Permainan belum berjalan atau sudah selesai.');
        if (msg.type === 'resign') { finish(room,'menyerah',opposite(entity.color)); broadcast(room); return; }
        if (!ready(room)) throw new Error('Permainan dijeda sampai kedua pemain terhubung.');
        if (msg.type === 'draw') {
          if (room.practice) throw new Error('Latihan bot menggunakan aturan remis otomatis.');
          if (room.drawOffer) throw new Error('Masih ada tawaran remis.');
          room.drawOffer = { color:entity.color, name:entity.name }; broadcast(room); return;
        }
        if (msg.type === 'accept-draw') {
          if (!room.drawOffer || room.drawOffer.color === entity.color) throw new Error('Tidak ada tawaran remis dari lawan.');
          finish(room,'kesepakatan pemain'); broadcast(room); return;
        }
        if (msg.type === 'decline-draw' || msg.type === 'withdraw-draw') {
          if (!room.drawOffer || (msg.type === 'withdraw-draw') !== (room.drawOffer.color === entity.color)) throw new Error('Tidak ada tawaran remis untuk aksi itu.');
          room.drawOffer = null; broadcast(room); return;
        }
        if (msg.type !== 'move') throw new Error('Aksi tidak dikenal.');
        if (entity.color !== room.chess.turn()) throw new Error('Belum giliranmu.');
        if (msg.matchId !== room.matchId || msg.ply !== room.chess.history().length) throw new Error('Papan sudah berubah. Pilih langkah lagi.');
        if (!/^[a-h][1-8]$/.test(msg.from || '') || !/^[a-h][1-8]$/.test(msg.to || '') || msg.promotion && !['q','r','b','n'].includes(msg.promotion)) throw new Error('Langkah tidak valid.');
        applyMove(room,{ from:msg.from, to:msg.to, promotion:msg.promotion || 'q' });
      } catch (error) { send(ws,{ type:'error', message:error.message.startsWith('Invalid move') ? 'Langkah itu tidak sah. Raja tidak boleh dibiarkan dalam skak.' : error.message }); }
    });
    ws.on('close',() => detach(ws));
  });
  const maintenance = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
    for (const [code,room] of rooms) if (![...room.players,...room.spectators].some(p => !p.bot && p.connected) && Date.now() - room.active > 7 * 86400000) { clearTimeout(room.botTimer);clearTimeout(room.clockTimer); rooms.delete(code); }
  },30000); maintenance.unref();
  async function close() {
    closing = true; clearInterval(maintenance);
    for (const room of rooms.values()) {clearTimeout(room.botTimer);clearTimeout(room.clockTimer);consumeClock(room);}
    for (const ws of wss.clients) { ws.room = null; ws.entity = null; ws.terminate(); }
    await new Promise(resolve => wss.close(resolve)); await new Promise(resolve => server.close(resolve));
  }
  return { server,wss,rooms,close,
    setRoomService(value){hub=value;},capacity:()=>2,
    exportRoom(room){const clock=room.clock?{...room.clock,remaining:clockView(room).remaining,active:null,startedAt:null}:null;return {...snapshotRoom({...room,chess:null,clock}),chessPgn:room.chess.pgn()};},
    restoreRoom(saved){const room={...saved,settings:chessSettings(saved.settings),chess:new Chess(),botTimer:null,clockTimer:null,clock:saved.clock?{...saved.clock,active:null,startedAt:null}:null};if(saved.chessPgn)room.chess.loadPgn(saved.chessPgn);return room;},
    setSpectator(p,value){if(value)p.color=null;},
    admit(room,p){p.score??=0;p.left=false;},
    onRotation(room){room.practice=room.players.some(p=>p.bot);},
    broadcastRoom:broadcast,resumeRoom:armBot,nextRound(room){start(room,true);}
  };
}
module.exports = { createChessServer };
