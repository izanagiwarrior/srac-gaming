'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomInt, randomUUID } = require('node:crypto');
const { WebSocketServer } = require('ws');
const { tableSettings,record }=require('../shared/table-settings');
const {snapshotRoom}=require('../shared/room-service');

function createDominoServer({ getAddresses = () => [] } = {}) {
  const rooms = new Map();
  let closing = false, hub = null;
  const files = new Map([
    ['/', ['public/index.html','text/html; charset=utf-8']],
    ['/client.js', ['public/client.js','application/javascript; charset=utf-8']],
    ['/tiles.js', ['public/tiles.js','application/javascript; charset=utf-8']],
    ['/style.css', ['public/style.css','text/css; charset=utf-8']]
  ]);
  const server = http.createServer((req,res) => {
    let pathname;
    try { pathname = new URL(req.url,'http://localhost').pathname; } catch { res.writeHead(400); return res.end(); }
    const entry = files.get(pathname);
    if (!entry || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname,entry[0]),(error,data) => {
      if (error) { res.writeHead(500); return res.end('Cannot load domino'); }
      res.writeHead(200,{ 'Content-Type':entry[1], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
  const send = (ws,data) => { if (ws?.readyState === 1) ws.send(JSON.stringify(hub ? hub.enrich(ws,data) : data)); };
  const nameFor = value => String(value || '').replace(/[\u0000-\u001f\u007f<>"\\]/g,'').trim().slice(0,24) || 'Pemain';
  const pips = tiles => tiles.reduce((sum,t) => sum + t.a + t.b,0);
  const allEntities = room => [...room.players,...room.spectators];
  const ready = room => room.players.length >= 2 && room.players.every(p => p.connected);
  const hostFor = room => room.players.find(p => !p.bot && p.connected) || room.players.find(p => !p.bot);
  function person(name,bot = false,spectator = false) {
    return { id:randomUUID(), token:bot ? null : randomUUID(), name:nameFor(name), bot, spectator, connected:bot, ws:null, hand:[], wins:0, score:0 };
  }
  function codeFor() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let length = 4; length <= 6; length++) for (let attempt = 0; attempt < 200; attempt++) {
      let code = ''; for (let i = 0; i < length; i++) code += alphabet[randomInt(alphabet.length)];
      if (!rooms.has(code)) return code;
    }
    throw new Error('Kode room sedang penuh. Coba lagi.');
  }
  function event(room,text) { room.events.push({ id:randomUUID(), text, time:Date.now() }); room.events = room.events.slice(-80); }
  function sides(room,tile) {
    if (!room.chain.length) return tile.id === room.starter ? ['right'] : [];
    const left = room.chain[0].left, right = room.chain.at(-1).right, result = [];
    if (tile.a === left || tile.b === left) result.push('left');
    if (tile.a === right || tile.b === right) result.push('right');
    return result;
  }
  const choices = (room,player) => player.hand.flatMap(tile => sides(room,tile).map(side => ({ tile,side })));
  function publicState(room,entity) {
    const current = room.players[room.turn], canAct = room.phase === 'playing' && ready(room) && !entity.spectator && current?.id === entity.id;
    return { type:'state', code:room.code,settings:room.settings,ledger:room.ledger,phase:room.phase, seats:room.seats, fillBots:room.fillBots, round:room.round,
      matchId:room.matchId, revision:room.revision, you:entity.id, spectator:entity.spectator,
      hostId:hostFor(room)?.id || null, ready:ready(room), turnId:current?.id || null,
      players:room.players.map(p => ({ id:p.id, name:p.name, bot:p.bot, connected:p.connected, count:p.hand.length, wins:p.wins,score:p.score,
        hand:room.phase === 'finished' ? p.hand : undefined, pips:room.phase === 'finished' ? pips(p.hand) : undefined })),
      hand:entity.hand, legal:canAct ? choices(room,entity).map(c => ({ id:c.tile.id,side:c.side })) : [],
      chain:room.chain, starter:room.chain.length ? null : room.starter, stock:room.stock.length, passes:room.passes,
      canDraw:canAct && room.chain.length > 0 && !choices(room,entity).length && room.stock.length > 0,
      canPass:canAct && room.chain.length > 0 && !choices(room,entity).length && room.stock.length === 0,
      result:room.result, rematch:[...room.rematch], events:room.events.slice(-60), chat:room.chat.slice(-60),
      spectators:room.spectators.filter(p => p.connected).length, addresses:getAddresses(), botDelay:3000 };
  }
  function broadcast(room) {
    if (closing) return;
    hub?.changed(room);
    for (const entity of allEntities(room)) if (entity.connected && !entity.bot) send(entity.ws,publicState(room,entity));
  }
  function finish(room,reason,winners) {
    if(room.phase!=='playing')return;
    const losers=room.players.filter(p=>!winners.includes(p)),pool=losers.reduce((n,p)=>n+pips(p.hand),0),base=Math.floor(pool/winners.length),extra=pool%winners.length;
    record(room,room.players.map(p=>winners.includes(p)?base+(winners.indexOf(p)<extra?1:0):-pips(p.hand)),'Ronde '+room.round+' · '+reason);
    clearTimeout(room.botTimer); room.botTimer = null; room.phase = 'finished'; room.rematch.clear();
    for (const p of winners) p.wins++;
    room.result = { reason, winners:winners.map(p => p.id), names:winners.map(p => p.name),
      remaining:room.players.map(p => ({ id:p.id,name:p.name,count:p.hand.length,pips:pips(p.hand) })) };
    event(room,`${winners.map(p => p.name).join(' & ')} ${winners.length > 1 ? 'menang bersama' : 'menang'} — ${reason}.`);
  }
  function nextTurn(room) { room.turn = (room.turn + 1) % room.players.length; }
  function play(room,player,id,side) {
    const index = player.hand.findIndex(t => t.id === id), tile = player.hand[index];
    if (!tile || !sides(room,tile).includes(side)) throw new Error('Batu itu tidak cocok di ujung yang dipilih.');
    let left = tile.a, right = tile.b;
    if (room.chain.length) {
      if (side === 'left' && right !== room.chain[0].left || side === 'right' && left !== room.chain.at(-1).right) [left,right] = [right,left];
    }
    const laid = { id:tile.id,left,right,playerId:player.id,name:player.name };
    if (side === 'left') room.chain.unshift(laid); else room.chain.push(laid);
    player.hand.splice(index,1); room.passes = 0; room.revision++; room.active = Date.now();
    event(room,`${player.name} memasang ${tile.a}–${tile.b}${room.chain.length === 1 ? ' sebagai pembuka' : side === 'left' ? ' di kiri' : ' di kanan'}.`);
    if (!player.hand.length) finish(room,'semua batu habis',[player]); else nextTurn(room);
    broadcast(room); armBot(room);
  }
  function draw(room,player) {
    if (!room.chain.length || choices(room,player).length || !room.stock.length) throw new Error('Ambil hanya ketika tidak punya batu yang cocok dan stok masih ada.');
    let count = 0;
    do { player.hand.push(room.stock.pop()); count++; } while (room.stock.length && !choices(room,player).length);
    player.hand.sort((a,b) => a.a - b.a || a.b - b.b); room.revision++;
    event(room,`${player.name} mengambil ${count} batu dari stok.`);
    // Drawing does not end the turn: play the matching tile, or pass if the stock is empty.
    broadcast(room); armBot(room);
  }
  function pass(room,player) {
    if (!room.chain.length || choices(room,player).length || room.stock.length) throw new Error('Lewat hanya jika tidak ada batu cocok dan stok kosong.');
    room.passes++; room.revision++; event(room,`${player.name} lewat.`);
    if (room.passes >= room.players.length) {
      const least = Math.min(...room.players.map(p => pips(p.hand)));
      finish(room,'meja buntu · sisa angka paling sedikit',room.players.filter(p => pips(p.hand) === least));
    } else nextTurn(room);
    broadcast(room); armBot(room);
  }
  function armBot(room) {
    clearTimeout(room.botTimer); room.botTimer = null;
    const player = room.players[room.turn];
    if (closing || room.recovering || room.phase !== 'playing' || !ready(room) || !player?.bot) return;
    const match = room.matchId, revision = room.revision;
    room.botTimer = setTimeout(() => {
      room.botTimer = null;
      if (closing || room.phase !== 'playing' || !ready(room) || match !== room.matchId || revision !== room.revision) return;
      try {
        const moves = choices(room,player);
        if (moves.length) {
          const level=room.settings.botLevel;
          let options=moves;
          if(level!=='easy'){
            const score=m=>m.tile.a+m.tile.b+(level==='hard'?(m.tile.a===m.tile.b?5:0)+player.hand.filter(t=>t.id!==m.tile.id&&(t.a===m.tile.a||t.b===m.tile.a||t.a===m.tile.b||t.b===m.tile.b)).length*2:0);
            const best=Math.max(...moves.map(score));options=moves.filter(m=>score(m)>=best-(level==='hard'?0:2));
          }
          const move=options[randomInt(options.length)];
          play(room,player,move.tile.id,move.side);
        } else if (room.stock.length) draw(room,player);
        else pass(room,player);
      } catch (error) { console.error('Domino bot:',error.message); event(room,'Bot berhenti sementara. Buat room baru jika diperlukan.'); broadcast(room); }
    },3000);
  }
  function start(room) {
    if (room.phase === 'lobby' && (!room.players.every(p => p.connected) || !room.fillBots && room.players.length !== room.seats)) throw new Error('Semua kursi harus terisi dan terhubung.');
    if (room.phase === 'lobby' && room.fillBots) {
      const names = ['Mei','Raka','Sinta'];
      while (room.players.length < room.seats) room.players.push(person(names[(room.players.length - 1) % names.length] + ' · bot',true));
    }
    if (!ready(room) || room.players.length !== room.seats) throw new Error('Semua kursi harus terisi dan terhubung.');
    clearTimeout(room.botTimer);
    const deck = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) deck.push({ id:a + '-' + b,a,b });
    for (let i = deck.length - 1; i > 0; i--) { const j = randomInt(i + 1); [deck[i],deck[j]] = [deck[j],deck[i]]; }
    for (const player of room.players) player.hand = deck.splice(0,7).sort((a,b) => a.a - b.a || a.b - b.b);
    room.stock = deck; room.chain = []; room.passes = 0; room.result = null; room.rematch.clear();
    room.round++; room.matchId++; room.revision = 0; room.phase = 'playing'; room.active = Date.now();
    // The highest double actually dealt opens; undealt tiles never decide the starting seat.
    const dealt = room.players.flatMap(p => p.hand.map(tile => ({ player:p,tile })));
    const doubles = dealt.filter(c => c.tile.a === c.tile.b);
    const opening = (doubles.length ? doubles : dealt).sort((a,b) => b.tile.a + b.tile.b - a.tile.a - a.tile.b || b.tile.b - a.tile.b)[0];
    room.starter = opening.tile.id; room.turn = room.players.indexOf(opening.player);
    event(room,`Ronde ${room.round} dimulai. ${opening.player.name} membuka dengan ${opening.tile.a}–${opening.tile.b}.`);
    broadcast(room); armBot(room);
  }
  function attach(ws,room,entity) {
    const previous = entity.ws;
    if (previous && previous !== ws) { previous.room = null; previous.entity = null; send(previous,{ type:'replaced' }); previous.close(1000,'Session moved'); }
    entity.ws = ws; entity.connected = true; ws.room = room; ws.entity = entity; room.active = Date.now();
    send(ws,{ type:'joined',code:room.code,token:entity.token,id:entity.id }); broadcast(room); armBot(room);
  }
  function detach(ws,explicit = false) {
    const room = ws.room, entity = ws.entity; ws.room = null; ws.entity = null;
    if (!room || !entity || entity.ws !== ws) return;
    entity.ws = null; entity.connected = false; room.active = Date.now();
    if (entity.spectator) {if(!entity.hasAccount)room.spectators = room.spectators.filter(p => p !== entity);}
    else if (explicit) {
      if (room.phase === 'lobby') room.players = room.players.filter(p => p !== entity);
      else { entity.bot = true; entity.connected = true; entity.token = null; room.rematch.add(entity.id); }
      event(room,`${entity.name} keluar.${room.phase === 'lobby' ? '' : ' Kursinya dilanjutkan bot.'}`);
    }
    // A dropped connection pauses the round; only an explicit leave hands a seat to a bot.
    if (explicit && room.phase === 'finished' && room.players.some(p => !p.bot) && ready(room) && room.players.every(p => room.rematch.has(p.id))) { start(room); return; }
    broadcast(room); armBot(room);
  }
  const wss = new WebSocketServer({ server,maxPayload:8192,verifyClient:info => {
    if (!info.origin) return true;
    try { return new URL(info.origin).host === info.req.headers.host; } catch { return false; }
  } });
  wss.on('error',error => console.error('Domino WebSocket:',error.message));
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
            if (![2,3,4].includes(msg.seats)) throw new Error('Pilih 2–4 kursi.');
            const entity = person(msg.name), room = { code:codeFor(), seats:msg.seats, fillBots:msg.fillBots === true,
              players:[entity], spectators:[], phase:'lobby', round:0, matchId:0, revision:0, turn:0, stock:[],chain:[],starter:null,
              passes:0, settings:tableSettings(msg.settings),ledger:[],result:null, rematch:new Set(), events:[], chat:[], active:Date.now(), botTimer:null };
            rooms.set(room.code,room); event(room,`${entity.name} membuka meja Gaple ${room.seats} pemain.`); attach(ws,room,entity); return;
          }
          const room = rooms.get(String(msg.code || '').trim().toUpperCase());
          if (!room) { send(ws,{ type:'error',message:'Room tidak ditemukan. Cek kode atau buat room baru.',sessionUnavailable:msg.type === 'resume',fatal:msg.type === 'resume' }); return; }
          if (msg.type === 'resume') {
            const entity = allEntities(room).find(p => p.token && p.token === msg.token);
            if (!entity) { send(ws,{ type:'error',message:'Sesi sudah berakhir. Gabung lagi dengan kode room.',fatal:true,sessionUnavailable:true }); return; }
            attach(ws,room,entity); return;
          }
          const spectator = room.phase !== 'lobby' || room.players.length >= room.seats;
          if (spectator && room.spectators.filter(p=>p.connected&&!p.bot).length >= 16) throw new Error('Kursi penonton penuh.');
          const entity = person(msg.name,false,spectator);
          (spectator ? room.spectators : room.players).push(entity);
          event(room,`${entity.name} ${spectator ? 'menonton' : 'bergabung'}.`); attach(ws,room,entity); return;
        }
        const room = ws.room, entity = ws.entity;
        if (!room || !entity) throw new Error('Gabung ke room dulu.');
        room.active = Date.now();
        if (msg.type === 'leave') { detach(ws,true); send(ws,{ type:'left' }); return; }
        if (msg.type === 'chat') {
          const text = String(msg.text || '').replace(/[\u0000-\u001f]/g,'').trim().slice(0,240);
          if (text) { room.chat.push({ id:randomUUID(),name:entity.name,text,emoji:msg.emoji===true,time:Date.now() }); room.chat = room.chat.slice(-70); broadcast(room); }
          return;
        }
        if (entity.spectator) throw new Error('Penonton tidak dapat bermain.');
        if(msg.type==='settings'){if(room.phase!=='lobby'||entity.id!==hostFor(room)?.id)throw new Error('Pengaturan dikunci setelah mulai; hanya host di lobby.');room.settings=tableSettings(msg.settings,room.settings);broadcast(room);return;}
        if (msg.type === 'start') {
          if (room.phase !== 'lobby' || entity.id !== hostFor(room)?.id) throw new Error('Hanya host dapat memulai meja.');
          room.settings=tableSettings(msg.settings,room.settings);return start(room);
        }
        if (msg.type === 'rematch') {
          if (room.phase !== 'finished' || !ready(room)) throw new Error('Selesaikan ronde dan tunggu semua pemain terhubung.');
          room.rematch.add(entity.id); for (const p of room.players) if (p.bot) room.rematch.add(p.id);
          if (room.players.every(p => room.rematch.has(p.id))) return start(room);
          broadcast(room); return;
        }
        if (room.phase !== 'playing' || !ready(room)) throw new Error('Ronde belum berjalan, selesai, atau dijeda karena koneksi pemain.');
        if (room.players[room.turn]?.id !== entity.id) throw new Error('Belum giliranmu.');
        if (msg.matchId !== room.matchId || msg.revision !== room.revision) throw new Error('Meja sudah berubah. Pilih batu lagi.');
        if (msg.type === 'play') return play(room,entity,msg.id,msg.side);
        if (msg.type === 'draw') return draw(room,entity);
        if (msg.type === 'pass') return pass(room,entity);
        throw new Error('Aksi tidak dikenal.');
      } catch (error) { send(ws,{ type:'error',message:error.message }); }
    });
    ws.on('close',() => detach(ws));
  });
  const maintenance = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
    for (const [code,room] of rooms) if (!allEntities(room).some(p => !p.bot && p.connected) && Date.now() - room.active > 7 * 86400000) { clearTimeout(room.botTimer); rooms.delete(code); }
  },30000); maintenance.unref();
  async function close() {
    closing = true; clearInterval(maintenance);
    for (const room of rooms.values()) clearTimeout(room.botTimer);
    for (const ws of wss.clients) { ws.room = null; ws.entity = null; ws.terminate(); }
    await new Promise(resolve => wss.close(resolve)); await new Promise(resolve => server.close(resolve));
  }
  return { server,wss,rooms,close,
    setRoomService(value){hub=value;},capacity:r=>r.seats,
    restoreRoom:saved=>({...saved,botTimer:null}),setSpectator(p,value){p.spectator=value;},
    admit(room,p){p.hand=[];p.score??=0;p.wins??=0;},
    broadcastRoom:broadcast,resumeRoom:armBot,nextRound:start
  };
}
module.exports = { createDominoServer };
