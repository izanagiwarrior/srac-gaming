'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {randomInt, randomBytes} = require('node:crypto');
const {WebSocketServer} = require('ws');
const {Game, evaluate} = require('./engine');
const DEFAULTS = {chipValue: 100, buyIn: 1000, smallBlind: 5, bigBlind: 10, maxPlayers: 6, bots: 0, allowRebuy: true, botLevel:'normal'};
const BOT_NAMES = ['Mei', 'Raka', 'Sinta', 'Bima', 'Ayu', 'Dimas', 'Nina'];
const uid = () => randomBytes(24).toString('hex');
function cleanName(value) {
  if (typeof value !== 'string') throw new Error('Enter your name.');
  const name = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0,24);
  if (!name) throw new Error('Enter your name.'); return name;
}
function settingsFor(input = {}) {
  const s = {...DEFAULTS};
  for (const [key, min, max] of [['chipValue',0,1000000],['buyIn',20,1000000],['smallBlind',1,50000],['bigBlind',2,100000],['maxPlayers',2,8],['bots',0,7]]) {
    if (input[key] !== undefined) s[key] = input[key];
    if (!Number.isSafeInteger(s[key]) || s[key] < min || s[key] > max) throw new Error(`${key} must be a whole number between ${min} and ${max}.`);
  }
  if (input.allowRebuy !== undefined) { if (typeof input.allowRebuy !== 'boolean') throw new Error('Invalid rebuy setting.'); s.allowRebuy = input.allowRebuy; }
  if (s.bigBlind < 2 * s.smallBlind) throw new Error('Big blind must be at least twice the small blind.');
  if (s.buyIn < 20 * s.bigBlind) throw new Error('Starting buy-in must be at least 20 big blinds.');
  if (s.bots >= s.maxPlayers) throw new Error('Leave at least one seat for a person.');
  if (input.botLevel !== undefined) s.botLevel=input.botLevel;
  if (!['easy','normal','hard'].includes(s.botLevel)) throw new Error('Choose Easy, Normal, or Hard bots.');
  return s;
}
function settlement(players, rate) {
  const balances = players.map(p => ({id:p.id, name:p.name, amount:(p.stack-p.totalBuyIn)*rate}));
  if (balances.reduce((sum,p) => sum+p.amount,0) !== 0) throw new Error('Balances do not reconcile.');
  const debtors = balances.filter(p => p.amount < 0).map(p => ({...p, remaining:-p.amount})).sort((a,b) => b.remaining-a.remaining);
  const creditors = balances.filter(p => p.amount > 0).map(p => ({...p, remaining:p.amount})).sort((a,b) => b.remaining-a.remaining);
  const payments = []; let i=0,j=0;
  while (i<debtors.length && j<creditors.length) {
    const amount = Math.min(debtors[i].remaining,creditors[j].remaining);
    payments.push({from:debtors[i].id,fromName:debtors[i].name,to:creditors[j].id,toName:creditors[j].name,amount});
    debtors[i].remaining-=amount; creditors[j].remaining-=amount;
    if (!debtors[i].remaining) i++; if (!creditors[j].remaining) j++;
  }
  return payments;
}
function createPokerServer({dataDir = path.join(__dirname,'data'), botDelay = 3000, offlineDelay = 15000, minCycles = 3, timers = true, getAddresses = null, managed = false} = {}) {
  const rooms = new Map();let hub=null;
  const stateFile = dataDir && path.join(dataDir,'sessions.json');
  function persist() {
    if (!stateFile || managed) return;
    fs.mkdirSync(dataDir,{recursive:true});
    const snapshots = [...rooms.values()].map(r => r.snapshot());
    fs.writeFileSync(stateFile+'.tmp',JSON.stringify({format:1,rooms:snapshots}),{mode:0o600});
    fs.renameSync(stateFile+'.tmp',stateFile);
  }
  function send(ws,data) { if (ws && ws.readyState===1) ws.send(JSON.stringify(hub?hub.enrich(ws,data):data)); }
  class Room {
    constructor(code, saved) {
      this.code=code; this.players=[]; this.settings={...DEFAULTS}; this.phase='lobby'; this.hostId=null;
      this.spectators=[];this.social={locked:false,queue:[],yielding:[]};
      this.game=null; this.history=[]; this.ledger=[]; this.chat=[]; this.createdAt=Date.now(); this.endedAt=null;
      this.revision=0; this.actionTimer=null; this.hostTimer=null;
      if (saved) {
        Object.assign(this,saved); this.settings={...DEFAULTS,...this.settings}; this.players=saved.players.map(p=>({...p,ws:null,connected:!!p.bot}));this.spectators=(saved.spectators||[]).map(p=>({...p,ws:null,connected:false}));
        this.game=saved.game ? Game.restore(this.players,this.settings,saved.game,randomInt) : null;
      }
    }
    snapshot() {
      return {code:this.code, settings:this.settings, phase:this.phase, hostId:this.hostId,
        spectators:this.spectators.map(({ws,...p})=>({...p,connected:false})),social:this.social,players:this.players.map(({ws,...p})=>({...p,connected:!!p.bot})), game:this.game?.serialize() || null,
        history:this.history,ledger:this.ledger,chat:this.chat,createdAt:this.createdAt,endedAt:this.endedAt,revision:this.revision};
    }
    host() { return this.players.find(p=>p.id===this.hostId); }
    requireHost(p) { if (p.id!==this.hostId) throw new Error('Only the host can do this.'); }
    add(ws,name) {
      const spectator=this.phase!=='lobby'||this.players.length+this.settings.bots>=this.settings.maxPlayers;
      if(spectator&&this.spectators.filter(p=>!p.bot&&p.connected).length>=24)throw new Error('Kursi penonton penuh.');
      if (this.players.length+this.settings.bots>=this.settings.maxPlayers&&!spectator) throw new Error('This room is full.');
      if (this.players.some(p=>p.name.toLowerCase()===name.toLowerCase())) throw new Error('That name is already at the table. Please choose another.');
      const p={id:uid().slice(0,12),token:uid(),name,ws,connected:true,bot:false,spectator,stack:0,totalBuyIn:0,buyIns:0,
        sittingOut:false,rebuyPending:false,rebuyDeclined:false,handsPlayed:0,dealerRounds:0};
      (spectator?this.spectators:this.players).push(p); if (!this.hostId&&!spectator) this.hostId=p.id; this.attach(ws,p); this.changed();
    }
    attach(ws,p) {
      const old=p.ws; if (old && old!==ws) {old.player=null;old.room=null;send(old,{type:'replaced'});old.close();}
      p.ws=ws;p.connected=true;ws.room=this;ws.player=p;
      if (!p.spectator&&!this.host()?.connected) this.hostId=p.id;
      send(ws,{type:'joined',code:this.code,token:p.token,id:p.id});
    }
    resume(ws,token) {
      const p=[...this.players,...this.spectators].find(p=>!p.bot&&p.token===token); if (!p) throw Object.assign(new Error('Seat could not be restored. Check your saved room on the original browser.'),{sessionUnavailable:true});
      this.attach(ws,p);p.sittingOut=p.stack===0&&p.rebuyDeclined;this.changed();
    }
    disconnect(p) {
      p.connected=false;p.ws=null;
      if (this.hostId===p.id) {
        clearTimeout(this.hostTimer);
        this.hostTimer=setTimeout(()=>{if(!this.host()?.connected){const next=this.players.find(q=>!q.bot&&q.connected);if(next){this.hostId=next.id;this.changed();}}},offlineDelay);
      }
      this.changed();
    }
    endGate() {
      // A funded player must have completed three turns as dealer. Busts may opt out.
      const required=this.players.filter(p=>p.stack>0 || p.rebuyPending || !p.rebuyDeclined);
      const waiting=required.filter(p=>p.dealerRounds<minCycles).map(p=>({name:p.name,rounds:p.dealerRounds}));
      const pending=this.players.some(p=>p.rebuyPending);
      const earlyFinish=this.players.filter(p=>p.stack>0).length===1 && this.players.filter(p=>p.stack===0).every(p=>p.rebuyDeclined) && !pending;
      return {allowed:this.phase==='playing' && !!this.game?.over && !pending && (waiting.length===0 || earlyFinish),earlyFinish,
        cycles:minCycles,waiting,pending,handActive:!!this.game&&!this.game.over};
    }
    view(viewer) {
      const g=this.game; const idx=this.players.indexOf(viewer);
      return {type:'state',code:this.code,you:viewer.id,spectator:!!viewer.spectator,hostId:this.hostId,phase:this.phase,settings:this.settings,revision:this.revision,
        accounts:[...this.players,...this.spectators.filter(p=>p.hasAccount)].map(p=>({id:p.id,name:p.name,bot:p.bot,stack:p.stack,totalBuyIn:p.totalBuyIn,buyIns:p.buyIns,handsPlayed:p.handsPlayed,dealerRounds:p.dealerRounds,contributed:this.players.includes(p)?p.contributed||0:0,outside:!this.players.includes(p)})),
        players:this.players.map((p,i)=>({id:p.id,name:p.name,connected:p.connected,bot:p.bot,stack:p.stack,totalBuyIn:p.totalBuyIn,buyIns:p.buyIns,
          sittingOut:p.sittingOut,rebuyPending:p.rebuyPending,rebuyDeclined:p.rebuyDeclined,handsPlayed:p.handsPlayed,dealerRounds:p.dealerRounds,
          inHand:!!p.inHand,folded:!!p.folded,bet:p.bet||0,contributed:p.contributed||0,lastAction:p.lastAction||'',
          hole:p.id===viewer.id || (g?.over && g.result?.showdown && p.inHand && !p.folded) ? p.hole||[] : (p.hole||[]).map(()=>null)})),
        game:g ? {handNo:g.handNo,dealer:g.dealer,smallBlind:g.smallBlind,bigBlind:g.bigBlind,board:g.board,over:g.over,
          phase:g.phase,turn:g.turn,currentBet:g.currentBet,pot:g.over?0:g.pot(),options:g.options(idx),version:g.version,
          result:g.result,log:g.log} : null,
        simulation:[...this.players,...this.spectators].some(p=>p.bot)||this.settings.bots>0,chat:this.chat.slice(-70),endGate:this.endGate(),history:this.history.slice(-20),ledger:this.ledger,
        payments:this.phase==='ended' && this.settings.chipValue>0 && !this.players.some(p=>p.bot) ? settlement([...this.players,...this.spectators.filter(p=>p.hasAccount)],this.settings.chipValue):[],endedAt:this.endedAt};
    }
    changed() {
      this.revision++;persist();hub?.changed(this);
      for (const p of [...this.players,...this.spectators]) if (!p.bot) send(p.ws,this.view(p));
      this.schedule();
    }
    book(p,kind) {
      if (p.totalBuyIn+this.settings.buyIn>1000000000) throw new Error('This session has reached the buy-in limit.');
      p.stack+=this.settings.buyIn;p.totalBuyIn+=this.settings.buyIn;p.buyIns++;
      p.sittingOut=false;p.rebuyPending=false;p.rebuyDeclined=false;
      this.ledger.push({id:uid().slice(0,12),playerId:p.id,name:p.name,kind,chips:this.settings.buyIn,idr:this.settings.buyIn*this.settings.chipValue,time:Date.now()});
    }
    afterAction(wasOver) {
      if (!wasOver && this.game.over) {
        for (const p of this.players) if (p.inHand) p.handsPlayed++;
        this.players[this.game.dealer].dealerRounds++;
        this.history.push({handNo:this.game.handNo,board:this.game.board,result:this.game.result,names:this.players.map(p=>p.name),time:Date.now()});
        // Keep the latest 200 full hand summaries; all buy-in entries are retained.
        this.history=this.history.slice(-200);
        for (const p of this.players) if (p.bot && p.stack===0) this.book(p,'Practice rebuy');
      }
    }
    command(p,msg) {
      if (msg.type==='chat') {
        const text=String(msg.text||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,200);
        if(text){this.chat.push({name:p.name,text});this.chat=this.chat.slice(-70);}
      } else if(p.spectator&&msg.type!=='leave') {throw new Error('Penonton tidak dapat bermain.');
      } else if (msg.type==='settings') {
        this.requireHost(p);if(this.phase!=='lobby')throw new Error('Table settings are locked once play starts.');
        const next=settingsFor(msg.settings);if(this.players.length+next.bots>next.maxPlayers)throw new Error('Not enough seats for these players and bots.');
        this.settings=next;
      } else if(msg.type==='remove') {
        this.requireHost(p);if(this.phase!=='lobby')throw new Error('Seats are fixed after the session starts.');
        const q=this.players.find(q=>q.id===msg.id);if(!q||q===p)throw new Error('Choose another seat.');
        if(q.connected)throw new Error('Only disconnected seats can be removed.');this.players=this.players.filter(x=>x!==q);
      } else if(msg.type==='start') {
        this.requireHost(p);if(this.phase!=='lobby')throw new Error('This session has already started.');
        if(msg.settings){const next=settingsFor(msg.settings);if(this.players.length+next.bots>next.maxPlayers)throw new Error('Not enough seats.');this.settings=next;}
        if(this.players.some(p=>!p.connected))throw new Error('Wait for disconnected players or remove their empty seats.');
        if(this.players.length+this.settings.bots<2)throw new Error('Invite a friend or add a practice bot in settings.');
        for(let i=0;i<this.settings.bots;i++)this.players.push({id:uid().slice(0,12),name:BOT_NAMES[i]+' (bot)',bot:true,connected:true,stack:0,totalBuyIn:0,buyIns:0,handsPlayed:0,dealerRounds:0});
        for(const q of this.players)this.book(q,'Initial buy-in');
        this.phase='playing';this.game=new Game(this.players,this.settings,randomInt);this.game.start();this.afterAction(false);
      } else if(msg.type==='action') {
        if(this.phase!=='playing'||!this.game||this.game.over)throw new Error('There is no active hand.');
        if(msg.version!==this.game.version)throw new Error('The table has moved on. Please choose your action again.');
        this.game.act(this.players.indexOf(p),msg.action,msg.amount);this.afterAction(false);
      } else if(msg.type==='next') {
        this.requireHost(p);if(this.phase!=='playing'||!this.game?.over)throw new Error('Finish the current hand first.');
        if(this.players.some(q=>q.rebuyPending))throw new Error('Resolve rebuy requests before dealing.');
        if(this.players.some(q=>!q.bot&&q.connected&&q.stack===0&&!q.rebuyDeclined))throw new Error('Wait for busted players to choose rebuy or sit out.');
        this.game.start();this.afterAction(false);
      } else if(msg.type==='rebuy') {
        if(this.phase!=='playing'||!this.game?.over)throw new Error('Rebuys are only available between hands.');
        if(!this.settings.allowRebuy)throw new Error('Rebuys are disabled for this table.');
        if(p.stack!==0||p.rebuyPending)throw new Error('A rebuy requires an empty stack and no pending request.');
        p.rebuyPending=true;p.rebuyDeclined=false;
      } else if(msg.type==='rebuyDecision') {
        this.requireHost(p);if(this.phase!=='playing'||!this.game?.over)throw new Error('Rebuys can only be approved between hands.');
        const q=this.players.find(q=>q.id===msg.id);if(!q?.rebuyPending)throw new Error('That rebuy request is no longer pending.');
        if(msg.approve===true)this.book(q,'Rebuy');else{q.rebuyPending=false;q.rebuyDeclined=true;q.sittingOut=true;}
      } else if(msg.type==='sitout') {
        if(this.phase!=='playing'||!this.game?.over||p.stack!==0)throw new Error('You can decline a rebuy after losing your stack.');
        p.rebuyPending=false;p.rebuyDeclined=true;p.sittingOut=true;
      } else if(msg.type==='end') {
        this.requireHost(p);if(msg.confirm!==true)throw new Error('Confirm ending this session.');
        if(!this.endGate().allowed)throw new Error(`Finish the hand, resolve rebuys, and complete ${minCycles} dealer rotations per funded player first.`);
        this.phase='ended';this.endedAt=Date.now();
      } else if(msg.type==='leave') {
        if(p.spectator){this.spectators=this.spectators.filter(q=>q!==p||q.hasAccount);p.connected=false;}else if(this.phase==='lobby') {
          this.players=this.players.filter(q=>q!==p);if(this.hostId===p.id)this.hostId=this.players.find(q=>q.connected)?.id||this.players[0]?.id||null;
        } else {p.connected=false;p.sittingOut=true;p.ws=null;const next=this.players.find(q=>!q.bot&&q.connected);if(this.hostId===p.id&&next)this.hostId=next.id;}
        p.ws=null;msg._ws.room=null;msg._ws.player=null;send(msg._ws,{type:'left'});
      } else throw new Error('Unknown request.');
      this.changed();
    }
    schedule() {
      clearTimeout(this.actionTimer);if(!timers||this.recovering||this.phase!=='playing'||this.game?.over)return;
      const p=this.players[this.game.turn];if(!p||(!p.bot&&p.connected))return;
      const version=this.game.version;
      this.actionTimer=setTimeout(()=>{
        if(this.phase!=='playing'||this.game.over||this.game.version!==version||(!p.bot&&p.connected))return;
        try {
          const o=this.game.options(this.players.indexOf(p));let action=o.check?'check':'fold',amount;
          if(p.bot){
            // Bots use only their own cards, the board and public betting information.
            const visible=[...p.hole,...this.game.board];
            const power=visible.length>=5?evaluate(visible).score[0]:(p.hole[0].r===p.hole[1].r?2:(Math.max(...p.hole.map(c=>c.r))>=12?1:0));
            const level=this.settings.botLevel || 'normal';
            if(level==='easy'){
              if(!o.check&&randomInt(4)!==0)action='call';
              if(o.canRaise&&o.maxTo>=o.minTo&&randomInt(12)===0){action='raise';amount=o.minTo;}
            }else if(level==='normal'){
              if(!o.check&&(o.call<=this.settings.bigBlind*3||power>=2||randomInt(5)===0))action='call';
              if(o.canRaise&&o.maxTo>=o.minTo&&power>=2&&randomInt(4)===0){action='raise';amount=o.minTo;}
            }else{
              const suited=Math.max(...['s','h','d','c'].map(s=>visible.filter(c=>c.s===s).length));
              const draw=this.game.board.length<5&&suited>=4;
              const strength=Math.min(.92,.16+power*.15+(draw?.18:0));
              const cost=o.call/(this.game.pot()+o.call || 1);
              if(!o.check&&(strength>cost+.05||o.call<=this.settings.bigBlind*2))action='call';
              if(o.canRaise&&o.maxTo>=o.minTo&&power>=2&&randomInt(3)!==0){action='raise';amount=Math.min(o.maxTo,Math.max(o.minTo,this.game.currentBet+Math.floor(this.game.pot()*.5)));}
            }
          }
          this.game.act(this.players.indexOf(p),action,amount);this.afterAction(false);this.changed();
        }catch(err){console.error('Table action failed:',err.message);}
      },p.bot?botDelay:offlineDelay);
    }
  }
  if(stateFile&&fs.existsSync(stateFile)) {
    const saved=JSON.parse(fs.readFileSync(stateFile,'utf8'));if(saved.format!==1)throw new Error('Unsupported session file format.');
    for(const r of saved.rooms)rooms.set(r.code,new Room(r.code,r));
  }
  function newCode() {const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ';let code;do{code=Array.from({length:4},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));return code;}
  function addresses() {
    if (getAddresses) return getAddresses();
    const port=server.address()?.port||3001;const urls=[];
    for(const entries of Object.values(os.networkInterfaces()))for(const a of entries||[])if(a.family==='IPv4'&&!a.internal)urls.push(`http://${a.address}:${port}`);
    return urls;
  }
  const files={'/odds.js':['public/odds.js','text/javascript; charset=utf-8'],'/odds-worker.js':['public/odds-worker.js','text/javascript; charset=utf-8'],'/':['public/index.html','text/html; charset=utf-8'],'/client.js':['public/client.js','text/javascript; charset=utf-8'],'/style.css':['public/style.css','text/css; charset=utf-8'],'/engine.js':['engine.js','text/javascript; charset=utf-8'],'/favicon.svg':['public/favicon.svg','image/svg+xml']};
  const server=http.createServer((req,res)=>{
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
    const url=new URL(req.url,'http://localhost');
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if(url.pathname==='/api/info'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({addresses:addresses(),port:server.address()?.port}));}
    const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':file[1]});if(req.method==='HEAD')return res.end();fs.createReadStream(path.join(__dirname,file[0])).pipe(res);
  });
  const wss=new WebSocketServer({server,maxPayload:16384,verifyClient:info=>{if(!info.origin)return true;try{return new URL(info.origin).host===info.req.headers.host;}catch{return false;}}});
  wss.on('error',err=>{console.error('WebSocket server:',err.message);});
  wss.on('connection',ws=>{
    ws.alive=true;ws.count=0;ws.window=Date.now();ws.on('pong',()=>ws.alive=true);send(ws,{type:'hello'});
    ws.on('message',raw=>{
      if(Date.now()-ws.window>1000){ws.window=Date.now();ws.count=0;}if(++ws.count>40)return ws.close(1008,'Too many requests');
      let requestId;
      try {
        const msg=JSON.parse(raw.toString());requestId=msg?.requestId;if(!msg||typeof msg!=='object')throw new Error('Invalid request.');
        if(hub?.handle(ws,msg))return;
        if(['create','join','resume'].includes(msg.type)){
          if(ws.player)throw new Error('Leave your current room first.');
          if(msg.type==='create'){
            if(rooms.size>=200)throw new Error('The server has reached its room limit. Archive old sessions before restarting.');
            const name=cleanName(msg.name),r=new Room(newCode());r.settings=settingsFor(msg.settings);rooms.set(r.code,r);r.add(ws,name);
          }else{
            const code=String(msg.code||'').toUpperCase().trim();const r=rooms.get(code);if(!r)throw Object.assign(new Error('Room not found. Check the code and make sure you are using the same server.'),{sessionUnavailable:msg.type==='resume'});
            if(msg.type==='resume')r.resume(ws,msg.token);else r.add(ws,cleanName(msg.name));
          }
        }else{
          if(!ws.room||!ws.player)throw new Error('Join a room first.');msg._ws=ws;ws.room.command(ws.player,msg);
        }
        if(requestId!==undefined)send(ws,{type:'ack',requestId});
      }catch(err){send(ws,{type:'error',message:err.message,requestId,sessionUnavailable:!!err.sessionUnavailable});}
    });
    ws.on('close',()=>{if(ws.room&&ws.player&&ws.player.ws===ws)ws.room.disconnect(ws.player);});
    ws.on('error',()=>{});
  });
  const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);heartbeat.unref();
  async function close() {clearInterval(heartbeat);for(const r of rooms.values()){clearTimeout(r.actionTimer);clearTimeout(r.hostTimer);}for(const ws of wss.clients){ws.room=null;ws.player=null;ws.terminate();}await new Promise(resolve=>wss.close(resolve));await new Promise(resolve=>server.close(resolve));}
  return {server,wss,rooms,close,addresses,
    setRoomService(value){hub=value;},capacity:r=>r.settings.maxPlayers,
    exportRoom:r=>r.snapshot(),restoreRoom:saved=>new Room(saved.code,saved),setSpectator(p,value){p.spectator=value;},
    admit(r,p){p.spectator=false;p.hole=[];p.folded=false;p.inHand=false;p.contributed=0;p.bet=0;p.handsPlayed??=0;p.dealerRounds??=0;p.rebuyPending=false;p.rebuyDeclined=false;p.sittingOut=false;if(!p.totalBuyIn){p.stack=0;p.totalBuyIn=0;p.buyIns=0;r.book(p,'Initial buy-in');}},
    checkNext(r,projected){if(r.players.some(p=>p.rebuyPending))throw Error('Selesaikan permintaan rebuy dahulu.');if(projected.filter(p=>(!p.totalBuyIn?r.settings.buyIn:p.stack)>0&&!p.sittingOut&&(p.bot||p.connected)).length<2)throw Error('Perlu dua pemain aktif dengan chip. Selesaikan rebuy atau antre pemain baru.');},
    onRotation(r){if(!r.players.some(p=>p.id===r.hostId&&!p.bot))r.hostId=r.players.find(p=>!p.bot&&p.connected)?.id;},
    broadcastRoom(r){r.changed();},resumeRoom:r=>r.schedule(),
    nextRound(r){if(r.phase==='ended'){r.phase='playing';r.endedAt=null;}r.game.start();r.afterAction(false);r.changed();}
  };
}
if(require.main===module){
  const app=createPokerServer();const port=Number(process.env.PORT||3001);
  app.server.on('error',err=>{console.error(err.code==='EADDRINUSE'?`Port ${port} is busy. Set PORT to another number.`:err.message);process.exitCode=1;});
  app.server.listen(port,'0.0.0.0',()=>{console.log(`\nPoker P2P · Texas Hold'em\nThis computer: http://localhost:${port}\nFriends on the same WiFi:\n${app.addresses().map(a=>'  '+a).join('\n')}\n\nKeep this window open while playing. Press Ctrl+C to stop.\n`);});
  process.on('SIGINT',async()=>{await app.close();process.exit(0);});
}
module.exports={createPokerServer,settingsFor,settlement};
