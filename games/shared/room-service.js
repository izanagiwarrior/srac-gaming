'use strict';
const fs = require('node:fs');
const path = require('node:path');
const v8 = require('node:v8');
const { randomUUID } = require('node:crypto');

// These are process resources, never recoverable game state. v8 keeps Sets and
// shared tile references intact; each game explicitly restores its own class.
const transient = new Set(['ws','timers','timer','turnTimer','deadlineTimer','botTimer','clockTimer','actionTimer','hostTimer','offlineTimer','hintCache','turnKey','turnStartedAt','turnDeadline','currentTurnCheckpoint']);
function snapshotRoom(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return typeof value === 'function' ? undefined : value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Set) { const out=new Set();seen.set(value,out);for(const item of value)out.add(snapshotRoom(item,seen));return out; }
  const out=Array.isArray(value)?[]:{};seen.set(value,out);
  for(const [key,item] of Object.entries(value))if(!transient.has(key)&&typeof item!=='function')out[key]=snapshotRoom(item,seen);
  if ('connected' in value) out.connected=!!value.bot;
  return out;
}
const everyone = room => [...room.players,...(room.spectators || [])];
const keyFor = p => p.id || p.token;
function ensurePeople(room) {
  room.spectators ||= [];
  room.social ||= { locked:false, queue:[], yielding:[] };
  for(const p of everyone(room))p.id ||= randomUUID();
  room.social.id ||= randomUUID();
  room.social.queue=room.social.queue.filter(id=>room.spectators.some(p=>keyFor(p)===id&&!p.bot));
  room.social.yielding=room.social.yielding.filter(id=>room.players.some(p=>keyFor(p)===id&&!p.bot));
}
function hostFor(room) {
  return room.players.find(p=>!p.bot&&p.connected&&!p.left&&(p.id===room.hostId||p.token===room.hostToken)) || room.players.find(p=>!p.bot&&p.connected&&!p.left);
}
function settled(slug,r) {
  if(slug==='mahjong')return !!r.G?.over;
  if(slug==='poker')return r.phase==='ended'||r.phase==='playing'&&!!r.game?.over;
  return ['result','finished'].includes(r.phase);
}
function active(slug,r){return (r.state||r.phase)!=='lobby'&&!settled(slug,r);}
function installRoomService(app,{slug,dataDir}) {
  const filename=path.join(dataDir,slug+'.v8');let stopped=false,lastBuffer=null,savedAt=null,saveError=false;
  const closedCodes=new Set();let archives=[];
  const entityFor=ws=>ws.roomPlayer?{room:ws.roomPlayer.room,person:ws.roomPlayer.player}:{room:ws.room,person:ws.entity||ws.player||ws.person};
  function save({exclude=null,closed=closedCodes,history=archives}={}) {
    if(stopped)return false;
    try {
      const rooms=[...app.rooms.values()].filter(r=>r!==exclude&&!closed.has(r.code)).map(r=>{ensurePeople(r);return app.exportRoom?app.exportRoom(r):snapshotRoom(r);});
      const buffer=v8.serialize({format:1,game:slug,rooms,closedCodes:[...closed],archives:history});
      if(lastBuffer?.equals(buffer))return true;
      fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
      const temp=filename+'.tmp';let fd;
      try {fd=fs.openSync(temp,'w',0o600);fs.fchmodSync(fd,0o600);fs.writeFileSync(fd,buffer);fs.fsyncSync(fd);}finally{if(fd!==undefined)fs.closeSync(fd);}
      fs.renameSync(temp,filename);lastBuffer=buffer;savedAt=Date.now();saveError=false;return true;
    }catch(error){saveError=true;console.error('Room save failed ('+slug+'):',error.message);return false;}
  }
  function meta(room,p) {
    ensurePeople(room);const isHost=hostFor(room)===p,spectator=!room.players.includes(p),queue=room.social.queue;
    const rate=room.settings?.pointValue??room.settings?.chipValue??0;
    return {boundary:JSON.stringify([room.matchId,room.round,room.revision,room.phase,room.G?.hand,room.G?.gen,room.game?.handNo,room.game?.version]),version:2,code:room.code,roomId:room.social.id,game:slug,locked:room.social.locked,host:isHost,spectator,recovering:!!room.recovering,
      missing:room.players.filter(q=>!q.bot&&!q.connected&&!q.left).map(q=>q.name),savedAt,saveError,
      queue:queue.map(id=>room.spectators.find(q=>keyFor(q)===id)).filter(Boolean).map(q=>({name:q.name,you:q===p,connected:q.connected})),
      queued:queue.includes(keyFor(p)),yielding:room.social.yielding.includes(keyFor(p)),canNext:isHost&&settled(slug,room)&&!room.recovering,
      bank:room.spectators.filter(q=>q.hasAccount).map(q=>({id:q.id,name:q.name,bot:!!q.bot,stack:q.totalBuyIn!==undefined?q.stack:undefined,totalBuyIn:q.totalBuyIn,points:q.totalBuyIn!==undefined?q.stack-q.totalBuyIn:q.score||0,net:(q.totalBuyIn!==undefined?q.stack-q.totalBuyIn:q.score||0)*rate})),
      recoveryFile:true};
  }
  function enrich(ws,data) {
    if(!['state','lobby','joined'].includes(data.type))return data;
    const {room,person}=entityFor(ws);if(!room||!person)return data;
    return {...data,hub:meta(room,person)};
  }
  function publish(room){ensurePeople(room);save();app.broadcastRoom(room);}
  function error(ws,message,action){ws.send(JSON.stringify({type:'error',message,msg:message,action}));}
  function dissolve(room,person,ws,msg) {
    if(app.rooms.get(room.code)!==room||person.ws!==ws||!person.connected||person.bot||hostFor(room)!==person)throw Error('Hanya host yang sedang terhubung dapat membubarkan ruang.');
    if(msg.confirm!==true||msg.code!==room.code||msg.roomId!==room.social.id)throw Error('Konfirmasi pembubaran room terbaru diperlukan.');
    const nextClosed=new Set(closedCodes);nextClosed.add(room.code);
    // Keep only settled/public accounting summaries, not a resumable room or private hands.
    const archived={code:room.code,time:Date.now(),unfinished:active(slug,room),rate:room.settings?.pointValue??room.settings?.chipValue??0,
      accounts:everyone(room).map(p=>({name:p.name,bot:!!p.bot,score:p.score,stack:p.stack,totalBuyIn:p.totalBuyIn,contributed:p.contributed})),ledger:snapshotRoom(room.ledger||(slug==='capsa'?room.history.map(({round,matchId,names,delta,moneyDelta,pointValue,remaining})=>({round,matchId,names,delta,moneyDelta,pointValue,remaining})):[]))};
    const nextHistory=[...archives,archived].slice(-200);
    // Persist the deletion and permanent code reservation before changing live state.
    if(!save({exclude:room,closed:nextClosed,history:nextHistory}))throw Error('Room belum dibubarkan karena penyimpanan gagal. Coba lagi setelah penyimpanan pulih.');
    closedCodes.add(room.code);archives=nextHistory;app.rooms.delete(room.code);
    room.dissolved=true;room.recovering=true;
    try{app.disposeRoom?.(room);}catch(error){console.error('Room timer cleanup ('+slug+'):',error.message);}
    for(const key of transient)if(key==='timer'||key.endsWith('Timer')){clearTimeout(room[key]);room[key]=null;}
    if(room.timers instanceof Set){for(const timer of room.timers)clearTimeout(timer);room.timers.clear();}
    else if(room.timers){Object.values(room.timers).forEach(clearTimeout);room.timers={};}
    if(room.G){room.G.gen++;room.G.over=true;room.G.pending=null;}
    if(room.game)room.game.over=true;
    room.phase='dissolved';if('state'in room)room.state='dissolved';room.rematch?.clear();
    const notice=JSON.stringify({type:'room-dissolved',code:room.code,message:'Room '+room.code+' dibubarkan oleh host. Silakan buat atau gabung room lain.'});
    // Detach without native leave: no resignation, fold, bot takeover or new payout.
    for(const socket of app.wss.clients)if(entityFor(socket).room===room){
      socket.room=null;socket.roomPlayer=null;socket.player=null;socket.entity=null;socket.person=null;
      if(socket.readyState===1)try{socket.send(notice);}catch(error){console.error('Room close notice ('+slug+'):',error.message);}
    }
    for(const p of everyone(room)){p.ws=null;p.connected=false;p.token=null;}
  }
  function rotate(room) {
    ensurePeople(room);
    // Same-index replacements keep dealer/turn indices valid. Only settled
    // accounts can move; retired balances remain attached to their owners.
    let rotated=false;
    for(const id of [...room.social.queue]) {
      const incoming=room.spectators.find(p=>keyFor(p)===id&&p.connected&&!p.bot);if(!incoming)continue;
      const index=room.players.findIndex(p=>p.bot||room.social.yielding.includes(keyFor(p))||p.left);
      const capacity=app.capacity(room);
      if(index<0&&room.players.length>=capacity)break;
      if(index>=0){const outgoing=room.players[index],seatColor=outgoing.color;outgoing.hasAccount=true;app.setSpectator(outgoing,true);outgoing.hand=[];outgoing.hands=[];outgoing.hole=[];outgoing.melds=[];outgoing.discards=[];outgoing.drawn=null;room.spectators.push(outgoing);room.players[index]=incoming;if(slug==='catur')incoming.color=seatColor;room.social.yielding=room.social.yielding.filter(q=>q!==keyFor(outgoing));}
      else room.players.push(incoming);
      room.spectators=room.spectators.filter(p=>p!==incoming);app.setSpectator(incoming,false);app.admit?.(room,incoming,index<0?room.players.length-1:index);
      incoming.hasAccount=true;room.social.queue=room.social.queue.filter(q=>q!==id);rotated=true;
    }
    if(rotated){for(const [index,p]of room.players.entries())if('seat'in p)p.seat=index;room.rematch?.clear();app.onRotation?.(room);}
    return rotated;
  }
  function notifyRoles(room){for(const p of everyone(room))if(p.connected&&!p.bot&&p.ws)p.ws.send(JSON.stringify({type:'joined',code:room.code,token:p.token,id:p.id,seat:room.players.indexOf(p),spectator:!room.players.includes(p)}));}
  function handle(ws,msg) {
    if(typeof msg.type!=='string')return false;
    const {room,person}=entityFor(ws);
    if((!room||!person)&&['join','resume','rejoin'].includes(msg.type)&&closedCodes.has(String(msg.code||'').trim().toUpperCase())){
      const resume=['resume','rejoin'].includes(msg.type);
      ws.send(JSON.stringify({type:'error',message:'Room tidak ditemukan. Buat room baru atau cek kode.',msg:'Room tidak ditemukan. Buat room baru atau cek kode.',code:String(msg.code).trim().toUpperCase(),sessionUnavailable:resume,fatal:resume,dissolved:resume}));return true;
    }
    if(msg.type==='join') {
      const target=app.rooms.get(String(msg.code||'').trim().toUpperCase());
      if(target&&everyone(target).length>=128){error(ws,'Batas akun room tercapai. Simpan rekap lalu buat room baru.');return true;}
      if(target?.social?.locked){error(ws,'Room dikunci. Minta host membuka akses sebelum bergabung.');return true;}
    }
    if(!room||!person){if(msg.type==='hub-dissolve'){error(ws,'Gabung ke room sebagai host dahulu.',msg.type);return true;}return false;}
    ensurePeople(room);
    if(msg.type?.startsWith('hub-')) {
      try {
        if(msg.type==='hub-dissolve'){dissolve(room,person,ws,msg);return true;}
        if(msg.type==='hub-lock'){if(hostFor(room)!==person)throw Error('Hanya host dapat mengunci room.');if(typeof msg.locked!=='boolean')throw Error('Pilihan kunci tidak valid.');room.social.locked=msg.locked;}
        else if(msg.type==='hub-queue'){
          if(room.players.includes(person))throw Error('Kamu sudah memiliki kursi.');if(typeof msg.enabled!=='boolean')throw Error('Pilihan antrean tidak valid.');
          if(msg.enabled){if(!room.social.queue.includes(keyFor(person)))room.social.queue.push(keyFor(person));}else room.social.queue=room.social.queue.filter(id=>id!==keyFor(person));
        }else if(msg.type==='hub-yield'){
          if(!room.players.includes(person)||person.bot)throw Error('Hanya pemain dapat memberi kursi.');if(typeof msg.enabled!=='boolean')throw Error('Pilihan kursi tidak valid.');
          room.social.yielding=room.social.yielding.filter(id=>id!==keyFor(person));if(msg.enabled)room.social.yielding.push(keyFor(person));
        }else if(msg.type==='hub-resume'){
          if(!room.recovering||hostFor(room)!==person)throw Error('Pemulihan hanya dapat dilanjutkan host.');
          if(room.players.some(p=>!p.bot&&!p.connected&&!p.left))throw Error('Tunggu semua pemain kembali sebelum melanjutkan sesi tersimpan.');
          room.recovering=false;app.resumeRoom(room);
        }else if(msg.type==='hub-next'){
          if(hostFor(room)!==person||!settled(slug,room)||room.recovering)throw Error('Hanya host setelah ronde selesai.');
          if(msg.boundary!==meta(room,person).boundary)throw Error('Ronde sudah berubah. Pilih Main lagi dari keadaan terbaru.');
          if(room.players.some(p=>!p.bot&&!p.connected&&!p.left))throw Error('Tunggu pemain kembali sebelum ronde berikutnya.');
          const projected=[...room.players];for(const id of room.social.queue){const p=room.spectators.find(q=>keyFor(q)===id&&q.connected);if(!p)continue;const index=projected.findIndex(q=>q.bot||room.social.yielding.includes(keyFor(q))||q.left);if(index>=0)projected[index]=p;else if(projected.length<app.capacity(room))projected.push(p);}
          app.checkNext?.(room,projected);rotate(room);app.nextRound(room,person);notifyRoles(room);
        }else throw Error('Aksi room tidak dikenal.');
        publish(room);
      }catch(e){error(ws,e.message,msg.type);}return true;
    }
    if(room.recovering&&!['chat','leave','resume','rejoin'].includes(msg.type)){error(ws,'Sesi dipulihkan dalam keadaan jeda. Host perlu menekan Lanjutkan sesi.');return true;}
    // Native rematch buttons defer to the shared host control when a queue
    // exists; an unvalidated gameplay command never moves a seat.
    if(['next','again','rematch'].includes(msg.type)&&room.social.queue.length){error(ws,'Ada antrean pemain. Host dapat memakai Main lagi & rotasi di panel Meja.');return true;}
    return false;
  }
  if(fs.existsSync(filename)) {
    const loaded=v8.deserialize(fs.readFileSync(filename));
    if(loaded.format!==1||loaded.game!==slug||!Array.isArray(loaded.rooms))throw Error('Format save '+slug+' tidak valid; file asli dipertahankan.');
    if(loaded.closedCodes!==undefined&&(!Array.isArray(loaded.closedCodes)||loaded.closedCodes.some(c=>typeof c!=='string'||!/^[A-Z0-9]{4,16}$/.test(c))))throw Error('Daftar kode room tertutup tidak valid; file asli dipertahankan.');
    for(const code of loaded.closedCodes||[])closedCodes.add(code);
    archives=Array.isArray(loaded.archives)?loaded.archives.slice(-200):[];
    app.rooms.clear();
    for(const saved of loaded.rooms){if(closedCodes.has(saved.code))continue;const r=app.restoreRoom(saved);ensurePeople(r);for(const p of everyone(r)){p.ws=null;p.connected=!!p.bot;}r.recovering=active(slug,r);app.rooms.set(r.code,r);}
    savedAt=fs.statSync(filename).mtimeMs;
  }else for(const r of app.rooms.values()){ensurePeople(r);r.recovering=active(slug,r);}
  const service={handle,enrich,changed:()=>save(),save,meta,hasCode:code=>closedCodes.has(code)||app.rooms.has(code),roomFor:entityFor,summary(){return [...app.rooms.values()].filter(r=>!r.social?.locked&&everyone(r).some(p=>p.connected&&!p.bot)).map(r=>({game:slug,code:r.code,phase:r.recovering?'paused':settled(slug,r)?'between':r.state==='lobby'||r.phase==='lobby'?'lobby':'playing',capacity:app.capacity(r),players:r.players.filter(p=>!p.bot&&p.connected).map(p=>p.name),seats:r.players.length,spectators:r.spectators.filter(p=>!p.bot&&p.connected).length,queued:r.social?.queue.length||0}));},close(){save();stopped=true;clearInterval(interval);}};
  app.setRoomService(service);
  const interval=setInterval(()=>save(),5000);interval.unref();
  return service;
}
module.exports={installRoomService,snapshotRoom};
