'use strict';
const {createPresence,automated}=require('./connection');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomInt, randomUUID } = require('node:crypto');
const { WebSocketServer } = require('ws');
const { tableSettings,record }=require('./table-settings');
const {snapshotRoom}=require('./room-service');

function createPartyServer({slug,title,engine,maxSeats,getAddresses = () => []}) {
  const rooms = new Map();
  let closing = false, hub = null;
  const presence=createPresence({exists:r=>rooms.get(r.code)===r,changed(r){broadcast(r);armBot(r);}});
  const files = new Map([['/', ['../'+slug+'/public/index.html','text/html; charset=utf-8']]]);
  const server = http.createServer((req,res) => {
    let pathname;
    try { pathname = new URL(req.url,'http://localhost').pathname; } catch { res.writeHead(400); return res.end(); }
    const entry = files.get(pathname);
    if (!entry || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname,entry[0]),(error,data) => {
      if (error) { res.writeHead(500); return res.end('Cannot load game'); }
      res.writeHead(200,{ 'Content-Type':entry[1], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
  const send = (ws,data) => { if (ws?.readyState === 1) ws.send(JSON.stringify(hub ? hub.enrich(ws,data) : data)); };
  const nameFor = value => String(value || '').replace(/[\u0000-\u001f\u007f<>"\\]/g,'').trim().slice(0,24) || 'Pemain';
  const allEntities = room => [...room.players,...room.spectators];
  const ready = room => room.players.length >= 2 && room.players.every(p => p.connected||p.bankrupt||room.phase==='playing'&&automated(p));
  const hostFor = room => room.players.find(p => !p.bot && p.connected) || room.players.find(p => !p.bot);
  function person(name,bot = false,spectator = false) {
    return { id:randomUUID(), token:bot ? null : randomUUID(), name:nameFor(name), bot, spectator, connected:bot, ws:null, hand:[], wins:0, score:0 };
  }
  function codeFor() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let length = 4; length <= 6; length++) for (let attempt = 0; attempt < 200; attempt++) {
      let code = ''; for (let i = 0; i < length; i++) code += alphabet[randomInt(alphabet.length)];
      if (!(rooms.has(code)||hub?.hasCode(code))) return code;
    }
    throw new Error('Kode room sedang penuh. Coba lagi.');
  }
  function event(room,text) { room.events.push({ id:randomUUID(), text, time:Date.now() }); room.events = room.events.slice(-80); }
  function publicState(room,entity) {
    const current=engine.actor?.(room)||room.players[room.turn],canAct=room.phase==='playing'&&ready(room)&&!room.recovering&&!entity.spectator&&current?.id===entity.id;
    return {type:'state',game:slug,code:room.code,settings:room.settings,ledger:room.ledger,phase:room.phase,quickComplete:room.settings.playMode==='quick'&&room.phase==='finished',seats:room.seats,fillBots:room.fillBots,round:room.round,matchId:room.matchId,revision:room.revision,you:entity.id,spectator:entity.spectator,hostId:hostFor(room)?.id||null,ready:ready(room),turnId:current?.id||null,
      players:room.players.map(p=>({id:p.id,name:p.name,bot:p.bot,connected:p.connected,count:p.hand.length,wins:p.wins,score:p.score,pawns:slug==='ludo'?p.pawns:undefined,color:p.color,...engine.playerView?.(room,p)})),
      ...engine.view(room,entity,canAct),result:room.result,rematch:[...room.rematch],events:room.events.slice(-60),chat:room.chat.slice(-60),spectators:room.spectators.filter(p=>p.connected).length,addresses:getAddresses(),botDelay:3000};
  }
  function broadcast(room) {
    if (closing) return;
    hub?.changed(room);
    for (const entity of allEntities(room)) if (entity.connected && !entity.bot) send(entity.ws,publicState(room,entity));
  }
  function finish(room,winner) {
    if(room.phase!=='playing')return;
    const winners=Array.isArray(winner)?winner:[winner],draw=winners.length===room.players.length;
    record(room,engine.deltas(room,winners.length===1?winners[0]:winners),'Ronde '+room.round+' · '+(draw?'Seri':winners.map(p=>p.name).join(' & ')+' menang'));
    clearTimeout(room.botTimer);room.botTimer=null;room.phase='finished';room.rematch.clear();if(!draw)for(const p of winners)p.wins++;
    room.result={names:winners.map(p=>p.name),winners:winners.map(p=>p.id),draw,reason:engine.resultReason?engine.resultReason(room):slug==='uno'?'Kartu habis':slug==='ludo'?'Semua pion tiba di rumah':slug==='reversi'?'Tidak ada langkah sah; keping terbanyak menang':'Pemain terakhir atau aset Quick Play tertinggi'};
    hub?.recordResult(room,room.players.map(p=>!draw&&winners.includes(p)),room.matchId+':'+room.round);
    event(room,draw?'Ronde seri.':winners.map(p=>p.name).join(' & ')+' menang!');
  }
  function action(room,player,msg){
    const result=engine.act(room,player,msg);room.revision++;room.active=Date.now();
    event(room,result.text);if(result.winner||result.finished)finish(room,result.winner||result.winners);broadcast(room);armBot(room);
  }
  function armBot(room){
    clearTimeout(room.botTimer);room.botTimer=null;
    const p=engine.actor?.(room)||room.players[room.turn];
    if(closing||room.recovering||room.phase!=='playing'||!ready(room)||!automated(p))return;
    const match=room.matchId,revision=room.revision;
    room.botTimer=setTimeout(()=>{room.botTimer=null;if(closing||rooms.get(room.code)!==room||room.recovering||room.phase!=='playing'||!ready(room)||match!==room.matchId||revision!==room.revision||(engine.actor?.(room)||room.players[room.turn])!==p)return;
      try{action(room,p,engine.bot(room,p,room.settings.botLevel));}catch(error){console.error(title+' bot:',error.message);event(room,'Bot berhenti sementara. Host dapat membubarkan room.');broadcast(room);}
    },3000);
  }
  function start(room){
    if(room.phase==='lobby'&&(!room.players.every(p=>p.connected)||!room.fillBots&&room.players.length!==room.seats))throw Error('Tunggu semua kursi terisi dan terhubung.');
    if(room.phase==='lobby'&&room.fillBots)while(room.players.length<room.seats)room.players.push(person(['Mei','Raka','Sinta','Bima','Nadia','Arka','Rio'][room.players.length-1]+' · bot',true));
    if(!ready(room)||room.players.length!==room.seats)throw Error('Semua kursi harus terisi dan siap.');
    clearTimeout(room.botTimer);room.round++;room.matchId++;room.revision=0;room.phase='playing';room.result=null;room.rematch.clear();room.active=Date.now();engine.start(room);
    event(room,'Ronde '+room.round+' dimulai.');broadcast(room);armBot(room);
  }
  function attach(ws,room,entity) {
    const previous = entity.ws;
    if (previous && previous !== ws) { previous.room = null; previous.entity = null; send(previous,{ type:'replaced' }); previous.close(1000,'Session moved'); }
    presence.connect(entity);entity.ws = ws; entity.connected = true; ws.room = room; ws.entity = entity; room.active = Date.now();
    send(ws,{ type:'joined',code:room.code,token:entity.token,id:entity.id }); broadcast(room); armBot(room);
  }
  function detach(ws,explicit = false) {
    const room = ws.room, entity = ws.entity; ws.room = null; ws.entity = null;
    if (!room || !entity || entity.ws !== ws) return;
    entity.ws = null; entity.connected = false; room.active = Date.now();presence.disconnect(room,entity,explicit);
    if (entity.spectator) {if(!entity.hasAccount)room.spectators = room.spectators.filter(p => p !== entity);}
    else if (explicit) {
      if (room.phase === 'lobby') room.players = room.players.filter(p => p !== entity);
      else { entity.bot = true; entity.connected = true; entity.token = null; room.rematch.add(entity.id); }
      event(room,`${entity.name} keluar.${room.phase === 'lobby' ? '' : ' Kursinya dilanjutkan bot.'}`);
    }
    // A disconnect pauses through the grace; temporary automation preserves the original seat.
    if (explicit && room.phase === 'finished' && room.players.some(p => !p.bot) && ready(room) && room.players.every(p => room.rematch.has(p.id))) { start(room); return; }
    broadcast(room); armBot(room);
  }
  const wss = new WebSocketServer({ server,maxPayload:8192,verifyClient:info => {
    if (!info.origin) return true;
    try { return new URL(info.origin).host === info.req.headers.host; } catch { return false; }
  } });
  wss.on('error',error => console.error('Party WebSocket:',error.message));
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
            if(!Number.isInteger(msg.seats)||msg.seats<2||msg.seats>maxSeats)throw Error('Pilih 2–'+maxSeats+' kursi.');
            const entity = person(msg.name), room = { code:codeFor(), seats:msg.seats, fillBots:msg.fillBots === true,
              players:[entity], spectators:[], phase:'lobby', round:0, matchId:0, revision:0, turn:0, stock:[],chain:[],starter:null,
              passes:0, settings:tableSettings(msg.settings),ledger:[],result:null, rematch:new Set(), events:[], chat:[], active:Date.now(), botTimer:null };
            rooms.set(room.code,room); event(room,`${entity.name} membuka meja ${title} ${room.seats} pemain.`); attach(ws,room,entity); return;
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
        if(engine.canAct?!engine.canAct(room,entity,msg):room.players[room.turn]?.id!==entity.id)throw new Error('Belum giliranmu.');
        if (msg.matchId !== room.matchId || msg.revision !== room.revision) throw new Error('Meja sudah berubah. Pilih langkah lagi.');
        if(['play','draw','pass','roll','move','place','buy','auction','bid','auctionPass','mortgage','redeem','build','sell','bail','pay','bankrupt','trade','tradeReply','cancelTrade','end'].includes(msg.type))return action(room,entity,msg);
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
    closing = true; presence.close();clearInterval(maintenance);
    for (const room of rooms.values()) clearTimeout(room.botTimer);
    for (const ws of wss.clients) { ws.room = null; ws.entity = null; ws.terminate(); }
    await new Promise(resolve => wss.close(resolve)); await new Promise(resolve => server.close(resolve));
  }
  return { server,wss,rooms,close,
    setRoomService(value){hub=value;},capacity:r=>r.seats,disposeRoom(r){presence.dispose(r);clearTimeout(r.botTimer);},
    restoreRoom:saved=>({...saved,botTimer:null}),setSpectator(p,value){p.spectator=value;},
    admit(room,p){p.hand=[];p.score??=0;p.wins??=0;},
    broadcastRoom:broadcast,resumeRoom:armBot,nextRound:start
  };
}
module.exports = { createPartyServer };
