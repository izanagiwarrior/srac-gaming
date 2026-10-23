/* Mahjong P2P server: ruang tunggu, kode ruangan, dan jalannya permainan. */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { WebSocketServer } = require('ws');
const { randomInt, randomBytes } = require('node:crypto');
const E = require('./engine');
const HK = require('./hong-kong');
const {tableSettings}=require('../shared/table-settings');
const BUILD = '2026-10-23-lobby-consistency-1', CLIENT_VERSION = 12;
const TABLE_PRESETS = {
  easy: {ruleset:'hkma',winMode:'casual',highlightSets:true,botLevel:'easy'},
  normal: {ruleset:'hkma',winMode:'casual',highlightSets:false,botLevel:'normal'},
  hard: {ruleset:'hkma',winMode:'hkma',highlightSets:false,botLevel:'hard'}
};
const PRESET_COMMON = {casualZero:true,claimMode:'assisted',autoPass:false,flowers:true,flowerBonus:false,jokers:false,animateDeal:true};
const CLAIM_MODES = ['manual','assisted','fast'];
const claimMode = settings => CLAIM_MODES.includes(settings.claimMode) ? settings.claimMode : settings.autoPass === true ? 'fast' : 'assisted';

function createMahjongServer() {
let hub=null,closing=false;
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const BOT_NAMES = ['Mei', 'Raka', 'Sinta', 'Bima'];
const AUTO_NEXT_MS = 30000, OFFLINE_ACT_MS = 4000, UNDO_MS = parseInt(process.env.UNDO_MS || '2000', 10);

const SPEED = parseFloat(process.env.SPEED || '1');
const sleep = ms => new Promise(r => setTimeout(r, ms * SPEED));
const rooms = new Map();

function makeCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; for (let len = 4; len <= 8; len++) for (let tries = 0; tries < 200; tries++) { let c = ''; for (let i = 0; i < len; i++) c += a[randomInt(a.length)]; if (!(rooms.has(c)||hub?.hasCode(c))) return c; } throw Error('Kode room sedang penuh. Coba lagi.'); }
function token() { return randomBytes(24).toString('hex'); }
function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(hub?hub.enrich(ws,obj):obj)); }
function cleanName(n) { return String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 16) || 'Pemain'; }
function hasClaimChoice(o) { return !!(o && (o.win || o.pung || o.kong || (o.chows && o.chows.length))); }

class Room {
  constructor(code) {
    this.code = code; this.players = []; this.spectators = []; this.chat = []; this.history = []; this.ledger = []; this.state = 'lobby'; this.settings = { rounds: 4, turnSeconds: 0, claimSeconds: 0, botLevel: 'easy', tablePreset:'easy', casualZero:true, pointValue:0, claimMode:'assisted', autoPass: false, highlightSets: true, ruleset:'hkma', winMode:'casual', flowers:true, flowerBonus:false, jokers:false, animateDeal:true }; this.G = null; this.timers = {}; this.lastActivity = Date.now();
  }
  humans() { return this.players.filter(p => !p.bot); }
  hostSeat() { const h = this.players.find(p => !p.bot && p.connected && p.token === this.hostToken) || this.players.find(p => !p.bot && p.connected) || this.players.find(p => !p.bot); return h ? h.seat : -1; }
  addSpectator(ws, name) {
    const sp = { name, token: token(), ws, connected: true, spectator: true };
    this.spectators.push(sp); return sp;
  }
  everyone() { return [...this.players.filter(p => !p.bot), ...this.spectators]; }
  addHuman(ws, name) {
    if (this.state !== 'lobby' || this.players.length >= 4) return { spectator: this.addSpectator(ws, name) };
    const p = { seat: this.players.length, name, token: token(), ws, bot: false, connected: true, hand: [], melds: [], discards: [], drawn: null, score: 0 };
    if (!this.hostToken) this.hostToken = p.token;
    this.players.push(p); this.addChat(null, `${name} bergabung.`); return { player: p };
  }
  rejoin(ws, tok) {
    const p = this.players.find(x => x.token === tok) || this.spectators.find(x => x.token === tok); if (!p) return null;
    if (p.ws && p.ws !== ws && p.ws.readyState === 1) { p.ws.roomPlayer = null; send(p.ws,{type:'replaced'});try { p.ws.close(); } catch (e) { } }
    p.ws = ws; p.connected = true; return p;
  }
  disconnect(p,explicit=false) {
    p.connected = false; p.ws = null; this.lastActivity = Date.now();
    if (p.spectator) { if(!p.hasAccount)this.spectators = this.spectators.filter(x => x !== p); this.addChat(null, `${p.name} berhenti menonton.`); if (this.state === 'lobby') this.broadcastLobby(); else this.broadcastState(); return; }
    if (this.state === 'lobby') {
      if(explicit){this.players = this.players.filter(x => x !== p); this.players.forEach((x, i) => x.seat = i);} this.broadcastLobby();
    } else {
      if(explicit){p.bot=true;p.connected=true;p.token=null;this.addChat(null,p.name+' keluar; bot melanjutkan kursi.');}
      this.broadcastState();
      const G = this.G; if (G && !G.over) {
        if (G.pending && G.pending.waiting.has(p.seat)) this.humanClaim(p.seat, { claim: 'pass',claimId:G.pending.id });
        else if (G.current === p.seat && G.phase === 'discard') {if(explicit){const gen=G.gen;this.timers.offline=setTimeout(()=>{if(!this.recovering&&!G.over&&G.gen===gen)this.botAct(p.seat,!!p.drawn);},3000);}else this.scheduleOfflineAct(p.seat);}
      }
    }
  }
  broadcastLobby() {
    hub?.changed(this);
    const base = { type: 'lobby', v: CLIENT_VERSION, build: BUILD, code: this.code, hostSeat: this.hostSeat(), settings: this.settings,ledger:this.ledger, players: this.players.map(p => ({ seat: p.seat, name: p.name, score:p.score,connected: p.connected, bot: p.bot })), spectators: this.spectators.map(s => s.name), chat: this.chat.slice(-50) };
    for (const p of this.everyone()) send(p.ws, { ...base, spectator: !!p.spectator });
  }
  start(seat, settings) {
    if (this.state !== 'lobby') return; if (seat !== this.hostSeat()) return;
    if(this.players.some(p=>!p.bot&&!p.connected)){send(this.players[seat]?.ws,{type:'error',msg:'Tunggu semua pemain terhubung.'});return;}
    if(this.updateSettings(seat, settings, false)===false)return;
    let k = 0; while (this.players.length < 4) { let n; do { n = BOT_NAMES[k++ % BOT_NAMES.length]; } while (this.players.some(p => p.name.toLowerCase() === n.toLowerCase()) && k < 20); this.players.push({ seat: this.players.length, name: n, bot: true, connected: true, hand: [], melds: [], discards: [], drawn: null, score: 0 }); }
    this.state = 'playing'; this.newMatch();
  }
  updateSettings(seat, settings, notify = true) {
    if (seat !== this.hostSeat() || !settings || typeof settings !== 'object') return false;
    if (this.state !== 'lobby'){send(this.players[seat]?.ws,{type:'error',msg:'Pengaturan dikunci sejak permainan dimulai. Buat ruangan baru untuk memilih mode lain.'});return false;}
    try{
      const preset=settings.tablePreset ?? this.settings.tablePreset ?? 'custom';
      if(!['easy','normal','hard','custom'].includes(preset))throw Error('Pilih Easy, Normal, Hard, atau Customize.');
      settings={...settings,...(TABLE_PRESETS[preset]?{...PRESET_COMMON,...TABLE_PRESETS[preset]}:{})};
      const next=tableSettings(settings,this.settings);next.tablePreset=preset;
      if(typeof settings.casualZero==='boolean')next.casualZero=settings.casualZero;
      if(settings.claimMode!==undefined&&!CLAIM_MODES.includes(settings.claimMode))throw Error('Pilih Manual bebas, Manual terbantu, atau Fast.');
      if(settings.claimMode===undefined&&settings.autoPass!==undefined&&typeof settings.autoPass!=='boolean')throw Error('Mode lewat tidak valid.');
      next.claimMode=settings.claimMode ?? (typeof settings.autoPass==='boolean' ? settings.autoPass?'fast':'assisted' : claimMode(this.settings));
      next.autoPass=next.claimMode==='fast';
      if(settings.rounds!==undefined){if(![1,4,8,12].includes(Number(settings.rounds)))throw Error('Pilih Quick Play 1 ronde, 4, 8, atau 12 ronde.');next.rounds=Number(settings.rounds);}
      if (typeof settings.highlightSets === 'boolean') next.highlightSets = settings.highlightSets;
      if(settings.ruleset!==undefined){if(!['hkma','legacy'].includes(settings.ruleset))throw Error('Pilih acuan HKMA atau aturan lama.');next.ruleset=settings.ruleset;}
      if(settings.winMode!==undefined){if(!['casual','hkma'].includes(settings.winMode))throw Error('Pilih Santai atau Hong Kong HKMA untuk aturan menang.');next.winMode=settings.winMode;}
      for(const key of ['flowers','flowerBonus','jokers','animateDeal'])if(settings[key]!==undefined){if(typeof settings[key]!=='boolean')throw Error('Pilihan '+key+' tidak valid.');next[key]=settings[key];}
      if(!next.flowers)next.flowerBonus=false;
      this.settings=next;
    }catch(error){send(this.players[seat]?.ws,{type:'error',msg:error.message});return false;}
    this.lastActivity = Date.now();
    if (notify) this.broadcastLobby();return true;
  }
  newMatch(keepScore=false) {
    if(!keepScore){this.ledger=[];for (const p of this.players) p.score = 0;}
    this.G = { dealer: 0, hand: 1, maxHands: this.settings.rounds, wall: [], current: 0, phase: 'idle', last: null, pending: null, over: false, result: null, log: '', gen: 0, final: false, turnDeadline: null, dealerRotations:0 };
    const first = this.players[Math.floor(Math.random() * 4)];
    this.startHand(first);
  }
  wind(i) { return (i - this.G.dealer + 4) % 4; }
  log(s) { this.G.log = s; this.history.push({ h: this.G.hand, t: s }); if (this.history.length > 200) this.history.splice(0, this.history.length - 200); }
  addChat(p, text, emoji) {
    const m = { id:randomBytes(16).toString('hex'),from: p ? p.name : null, seat: p && !p.spectator ? p.seat : -1, text, emoji: !!emoji, ts: Date.now() };
    this.chat.push(m); if (this.chat.length > 100) this.chat.shift();
    hub?.changed(this);for (const q of this.everyone()) send(q.ws, { type: 'chat', msg: m });
  }
  bump() { this.G.gen++; clearTimeout(this.timers.offline); clearTimeout(this.timers.turn); this.G.turnDeadline = null; }
  // Giliran manusia: pasang batas waktu berpikir; kalau habis, bot bertindak untuknya.
  armTurn(p) {
    const P = this.players[p]; this.G.turnDeadline = null;
    if (!this.recovering&&!P.connected) this.scheduleOfflineAct(p); // satu-satunya otomatisasi: pemain yang putus koneksi
  }

  // ---------- Jalannya ronde ----------
  // Acak posisi duduk setiap ronde supaya sumber Chow (pemain di kiri) selalu berganti.
  shuffleSeats(dealerPlayer) {
    E.shuffle(this.players); this.players.forEach((p, i) => p.seat = i);
    this.G.dealer = this.players.indexOf(dealerPlayer);
  }
  evaluateHongKong(p,hand,zimo,tile) {
    const G=this.G,P=this.players[p];
    return HK.evaluate(hand,P.melds,{seat:this.wind(p),roundWind:Math.floor((G.dealerRotations||0)/4)%4,zimo,
      winMode:this.settings.winMode||'hkma',casualZero:this.settings.casualZero!==false,winningIndex:tile?E.idxOf(tile):-1,jokers:this.settings.jokers,flowers:P.flowers||[],flowerBonus:this.settings.flowerBonus,
      afterKong:zimo&&G.drawKind==='kong',kongChain:zimo?G.kongChain||0:0,lastWall:zimo&&G.wall.length===0,
      robbedKong:!!(G.robKong||G.robbedKong),concealedRob:G.robKong?.kind==='conc',
      heaven:zimo&&p===G.dealer&&!G.discardCount&&!G.kongDeclarations,
      earth:!zimo&&p!==G.dealer&&G.discardCount===1&&G.last?.from===G.dealer&&!G.hadMeld&&!G.kongDeclarations});
  }
  winningHand(p,hand,zimo,tile) {
    if(this.settings.ruleset!=='hkma')return E.findWin(hand,this.players[p].melds);
    if(!zimo&&HK.isJoker(tile))return null;
    const result=this.evaluateHongKong(p,hand,zimo,tile);
    return result?.score.qualified?result.win:null;
  }
  claimOptions(p,tile,canChow) {
    if(HK.isJoker(tile))return {win:null,pung:false,kong:false,chows:[]};
    const P=this.players[p],o=E.computeOptions(P.hand,P.melds,tile,canChow);
    o.win=this.winningHand(p,[...P.hand,tile],false,tile);
    if(!this.G.wall.length)o.kong=false;
    return o;
  }
  drawHongKong(p,tail) {
    const P=this.players[p],G=this.G;
    let tile=tail?G.wall.pop():G.wall.shift();
    while(tile&&HK.isFlower(tile)){
      P.flowers.push(tile);this.log(P.name+' membuka '+E.tileName(tile)+' dan mengambil pengganti dari ujung tembok.');
      tile=G.wall.pop();
    }
    return tile;
  }
  startHongKongHand(dealerPlayer) {
    const G=this.G;
    for(const value of Object.values(this.timers))clearTimeout(value);this.timers={};
    if(dealerPlayer)G.dealer=this.players.indexOf(dealerPlayer);
    G.over=false;G.result=null;G.pending=null;G.last=null;G.final=false;G.undo=null;G.robKong=null;G.robbedKong=false;
    G.discardCount=0;G.hadMeld=false;G.kongDeclarations=0;G.kongChain=0;G.drawKind='initial';
    const shuffled=E.shuffle(E.buildWall({flowers:this.settings.flowers,jokers:this.settings.jokers}));
    G.wallOriginal=shuffled.map(t=>t.id);G.wallTotal=shuffled.length;
    const stacks=shuffled.length/2,small=Math.floor(stacks/4),extra=stacks%4;
    G.wallSides=Array.from({length:4},(_,i)=>2*(small+(i<extra?1:0)));
    const dice=Array.from({length:3},()=>randomInt(1,7)),sum=dice.reduce((a,b)=>a+b,0),breaker=(G.dealer+sum-1)%4;
    const physicalSide=(4-breaker)%4,sideStart=G.wallSides.slice(0,physicalSide).reduce((a,b)=>a+b,0);
    G.wallHead=(sideStart+sum*2)%shuffled.length;
    G.wall=shuffled.slice(G.wallHead).concat(shuffled.slice(0,G.wallHead));
    const dealt=[0,0,0,0],steps=[{stage:'build',label:'Susun empat sisi tembok',ms:900,dealt:dealt.slice(),drawn:0},
      {stage:'dice',label:'Dealer melempar tiga dadu',ms:1400,dealt:dealt.slice(),drawn:0},
      {stage:'break',label:'Buka tembok di depan '+this.players[breaker].name+', setelah tumpuk '+sum,ms:900,dealt:dealt.slice(),drawn:0}];
    for(const P of this.players){P.hand=[];P.melds=[];P.discards=[];P.flowers=[];P.drawn=null;P.pao=null;}
    let drawn=0;
    for(let round=0;round<3;round++)for(let offset=0;offset<4;offset++){
      const seat=(G.dealer+offset)%4;this.players[seat].hand.push(...G.wall.splice(0,4));dealt[seat]+=4;drawn+=4;
      steps.push({stage:'deal',seat,label:'Bagikan empat ubin ke '+this.players[seat].name,ms:180,dealt:dealt.slice(),drawn});
    }
    // The dealer's second jumping tile is the fifth tile after the 48-tile deal.
    for(let offset=0;offset<5;offset++){
      const seat=(G.dealer+offset%4)%4,tile=G.wall.shift();this.players[seat].hand.push(tile);dealt[seat]++;drawn++;
      if(offset===4)this.players[seat].drawn=tile;
      steps.push({stage:'deal',seat,label:offset===4?'Dealer mengambil ubin ke-14':'Bagikan ubin ke-13',ms:180,dealt:dealt.slice(),drawn});
    }
    // Initial flowers are replaced in rounds, dealer first. A new flower from
    // replacement waits for the next sweep, as in the initial HKMA procedure.
    let replacing=true;
    while(replacing){replacing=false;for(let offset=0;offset<4;offset++){
      const P=this.players[(G.dealer+offset)%4],flowers=P.hand.filter(HK.isFlower);
      if(!flowers.length)continue;replacing=true;P.hand=P.hand.filter(t=>!HK.isFlower(t));P.flowers.push(...flowers);
      for(let n=0;n<flowers.length;n++){if(!G.wall.length)return this.endHand(null);P.hand.push(G.wall.pop());}
    }}
    for(const P of this.players)P.hand.sort(E.byIdx);
    const dealer=this.players[G.dealer];if(!dealer.hand.includes(dealer.drawn))dealer.drawn=dealer.hand[dealer.hand.length-1];
    steps.push({stage:'flowers',label:'Buka bunga dan musim; ambil ubin pengganti',ms:1000,dealt:dealt.slice(),drawn,final:true});
    G.opening={id:randomBytes(12).toString('hex'),dice,sum,breaker,breakStack:sum,steps,index:0};G.current=G.dealer;G.phase='opening';this.bump();
    this.log('Ronde '+G.hand+': '+dealer.name+' menjadi Timur. Dadu '+dice.join(' + ')+' = '+sum+'.');
    if(!this.settings.animateDeal)return this.finishOpening();
    this.advanceOpening();
  }
  advanceOpening() {
    const G=this.G;if(G.over||G.phase!=='opening'||closing||this.recovering)return;
    clearTimeout(this.timers.opening);this.broadcastState();
    const gen=G.gen,step=G.opening.steps[G.opening.index];
    this.timers.opening=setTimeout(()=>{
      if(this.G!==G||G.gen!==gen||G.over||this.recovering||closing||G.phase!=='opening')return;
      G.opening.index++;if(G.opening.index>=G.opening.steps.length)this.finishOpening();else this.advanceOpening();
    },step.ms);
  }
  finishOpening() {
    const G=this.G;if(G.over||G.phase!=='opening'||closing||this.recovering)return;
    clearTimeout(this.timers.opening);G.phase='discard';G.current=G.dealer;this.bump();
    this.log(this.players[G.dealer].name+' membuka ronde dengan 14 ubin. Pilih satu buangan.');this.armTurn(G.dealer);this.broadcastState();
    if(this.players[G.dealer].bot){const gen=G.gen;this.timers.bot=setTimeout(()=>{if(G.gen===gen&&!G.over&&!this.recovering)this.botAct(G.dealer,true);},3000);}
  }
  publicOpening() {
    const G=this.G;if(G.phase!=='opening'||!G.opening)return null;
    const o=G.opening,step=o.steps[o.index];
    return {id:o.id,stage:step.stage,label:step.label,seat:step.seat,dealt:step.dealt,dice:step.stage==='build'?[]:o.dice,
      sum:o.sum,breaker:o.breaker,breakStack:o.breakStack,progress:(o.index+1)/o.steps.length};
  }
  wallLayout() {
    const G=this.G;if(!G.wallOriginal)return null;
    let occupied;
    if(G.phase==='opening'&&!G.opening.steps[G.opening.index].final){
      const drawn=G.opening.steps[G.opening.index].drawn;occupied=Array(G.wallTotal).fill(true);
      for(let k=0;k<drawn;k++)occupied[(G.wallHead+k)%G.wallTotal]=false;
    }else{const ids=new Set(G.wall.map(t=>t.id));occupied=G.wallOriginal.map(id=>ids.has(id));}
    return {sides:G.wallSides,occupied,head:G.wallHead,total:G.wallTotal};
  }
  offerRobKong(seat,kind,arg,tile) {
    const G=this.G,claims=[],opts={},waiting=new Set(),mode=claimMode(this.settings);
    G.robKong={seat,kind,arg,tileId:tile.id,previousLast:G.last};G.last={tile,from:seat};G.phase='claim';this.bump();
    for(let q=0;q<4;q++)if(q!==seat){
      const P=this.players[q],o=mode==='manual'&&!P.bot?{manual:true,robOnly:true}:{win:this.winningHand(q,[...P.hand,tile],false,tile),pung:false,kong:false,chows:[],robOnly:true};
      if(P.bot){if(o.win)claims.push({p:q,type:'win',win:o.win});continue;}
      opts[q]=o;if(P.connected&&(mode!=='fast'||o.win))waiting.add(q);
    }
    this.log(this.players[seat].name+' menyatakan Kong. Kesempatan merebut untuk Hu.');
    if(waiting.size){G.pending={id:randomBytes(12).toString('hex'),claims,opts,waiting,deadline:null,autoPass:mode==='fast',claimMode:mode};this.broadcastState();}
    else this.resolveClaims(claims);
  }
  startHand(dealerPlayer) {
    const G = this.G;
    if(this.settings.ruleset==='hkma')return this.startHongKongHand(dealerPlayer);
    if (dealerPlayer) this.shuffleSeats(dealerPlayer);
    G.wall = E.shuffle(E.buildWall()); G.over = false; G.result = null; G.pending = null; G.last = null; G.final = false;
    for (const P of this.players) { P.hand = G.wall.splice(0, 13).sort(E.byIdx); P.melds = []; P.discards = []; P.drawn = null; }
    this.log(`Ronde ${G.hand}: posisi duduk diacak, ${this.players[G.dealer].name} jadi dealer (Timur).`);
    this.startTurn(G.dealer);
  }
  async startTurn(p) {
    const G = this.G; if (G.over||this.recovering||closing) return;
    if (G.wall.length === 0) return this.endHand(null);
    const P = this.players[p]; const t = this.settings.ruleset==='hkma'?this.drawHongKong(p,false):G.wall.shift();if(!t)return this.endHand(null); P.hand.push(t); P.drawn = t; G.current = p; G.phase = 'discard'; G.pending = null; G.drawKind='wall';G.kongChain=0;G.robbedKong=false;this.bump();
    this.log(`${P.name} mengambil ubin.`);
    if (!P.bot) { this.armTurn(p); this.broadcastState(); return; }
    this.broadcastState();
    const gen=G.gen;await sleep(3000);if(G.gen!==gen||G.over||closing||this.recovering)return;return this.botAct(p, true);
  }
  scheduleOfflineAct(p) {
    const G = this.G; const gen = G.gen; clearTimeout(this.timers.offline);
    this.timers.offline = setTimeout(() => { const P = this.players[p]; if (G.gen === gen && !G.over && G.current === p && G.phase === 'discard' && !P.connected) this.botAct(p, !!P.drawn); }, OFFLINE_ACT_MS);
  }
  async botAct(p, canWin) {
    const G = this.G; if (G.over||this.recovering||closing||G.current!==p||G.phase!=='discard') return; const P = this.players[p];
    if (canWin && P.drawn) { const w = this.winningHand(p,P.hand,true,P.drawn); if (w) return this.endHand(p, P.drawn, true, w); }
    const k = E.botKong(P.hand, P.melds); if (k && (this.settings.ruleset!=='hkma'||G.wall.length)) return this.doKong(p, k.kind, k.arg);
    return this.discardTile(p, E.botChooseDiscardLevel(P.hand, P.melds, this.settings.botLevel, this.botContext(p)));
  }
  botContext(p) {
    const visible = new Array(34).fill(0);
    for (const Q of this.players) { for (const t of Q.discards) visible[E.idxOf(t)]++; for (const m of Q.melds) if (m.open) for (const t of m.tiles) visible[E.idxOf(t)]++; }
    const threats = this.players.filter((Q, i) => i !== p && (Q.melds.length >= 2 || (this.G.wall.length < 20 && Q.melds.length >= 1))).map(Q => ({ discards: new Set(Q.discards.map(E.idxOf)), melds: Q.melds.length }));
    return { visible, threats, wall: this.G.wall.length };
  }
  async doKong(p, kind, arg, checkedRob=false) {
    const G = this.G; const P = this.players[p]; let tiles;
    if(this.settings.ruleset==='hkma'&&!checkedRob){
      const tile=kind==='conc'?P.hand.find(t=>E.idxOf(t)===arg):P.hand.find(t=>P.melds[arg]?.type==='pung'&&E.idxOf(t)===E.idxOf(P.melds[arg].tiles[0]));
      if(!tile||HK.isJoker(tile)||!G.wall.length)return;
      if(kind==='conc'&&P.hand.filter(t=>E.idxOf(t)===arg).length!==4)return;
      return this.offerRobKong(p,kind,arg,tile);
    }
    if (kind === 'conc') { tiles = P.hand.filter(t => E.idxOf(t) === arg); if (tiles.length !== 4) return; P.hand = P.hand.filter(t => E.idxOf(t) !== arg); P.melds.push({ type: 'kong', tiles, open: false }); }
    else { const m = P.melds[arg]; if (!m || m.type !== 'pung') return; const i = E.idxOf(m.tiles[0]); const k = P.hand.findIndex(t => E.idxOf(t) === i); if (k < 0) return; m.tiles.push(P.hand.splice(k, 1)[0]); m.type = 'kong'; tiles = m.tiles; }
    G.kongDeclarations=(G.kongDeclarations||0)+1; P.drawn = null; G.phase = 'kong'; this.bump(); this.log(`${P.name} Kong ${E.tileName(tiles[0])}!`); this.broadcastState();
    const gen=G.gen;await sleep(600);if(G.gen!==gen||G.over||closing||this.recovering)return;
    return this.finishKong(p);
  }
  async finishKong(p) {
    const G=this.G,P=this.players[p];if(G.over||closing||this.recovering)return;
    if(!G.wall.length)return this.endHand(null);
    const tile=this.settings.ruleset==='hkma'?this.drawHongKong(p,true):G.wall.pop();if(!tile)return this.endHand(null);P.hand.push(tile);P.drawn=tile;G.drawKind='kong';G.kongChain=(G.kongChain||0)+1;G.phase='discard';this.bump();
    if(!P.bot){this.armTurn(p);this.broadcastState();return;}
    this.broadcastState();const gen=G.gen;await sleep(3000);if(G.gen!==gen||closing||this.recovering)return;return this.botAct(p,true);
  }
  async discardTile(p, t) {
    const G = this.G; const P = this.players[p]; const k = P.hand.indexOf(t); if (k < 0) return;
    const prevLast = G.last; const hadDrawn = P.drawn;
    if(this.settings.ruleset==='hkma'){G.discardCount=(G.discardCount||0)+1;G.robbedKong=false;}
    P.hand.splice(k, 1); P.drawn = null; P.discards.push(t); G.last = { tile: t, from: p }; G.phase = 'claim'; G.pending = null; this.bump(); const gen = G.gen;
    this.log(`${G.autoNote || ''}${P.name} membuang ${E.tileName(t)}.`); G.autoNote = null;
    if (!P.bot && P.connected) { G.undo = { seat: p, until: Date.now() + UNDO_MS, tile: t, prevLast, hadDrawn, claimed: false }; }
    this.broadcastState();
    await sleep(!P.bot && P.connected ? Math.max(500, UNDO_MS / SPEED) : 500); // beri jeda 2 detik agar pemain bisa membatalkan
    if (G.gen !== gen) return; // dibatalkan atau keadaan berubah
    if (G.undo && G.undo.seat === p) G.undo = null;
    return this.offerClaims();
  }
  offerClaims() {
    const G=this.G;if(G.over||!G.last||closing||this.recovering)return;const p=G.last.from,t=G.last.tile,mode=claimMode(this.settings),claimAutoPass=mode==='fast';
    const claims = []; const opts = {}; const waiting = new Set();
    for (let q = 0; q < 4; q++) {
      if (q === p) continue; const Q = this.players[q];
      // Manual bebas does not precompute or disclose a human's available claims.
      // Bots retain their normal rule-based decisions in all three modes.
      const o=mode==='manual'&&!Q.bot?{manual:true}:this.claimOptions(q,t,q===(p+1)%4);
      if (Q.bot) { const d = E.botDecideLevel(Q.hand, Q.melds, o, t, this.settings.botLevel); if (d) claims.push({ p: q, ...d }); continue; }
      opts[q] = o;
      const hasOption = hasClaimChoice(o);
      if (Q.connected && (!claimAutoPass || hasOption)) waiting.add(q);
    }
    if (waiting.size) {
      G.pending = { id:randomBytes(12).toString('hex'),claims, opts, waiting, deadline: null, autoPass: claimAutoPass,claimMode:mode }; this.broadcastState();
      return; // menunggu semua pemain menekan Klaim atau Lewat
    }
    return this.resolveClaims(claims);
  }
  humanClaim(seat, msg) {
    const G = this.G; const pend = G.pending; if (!pend || !pend.waiting.has(seat)) return; const o = pend.opts[seat];
    const c = msg.claim; const P = this.players[seat];
    if(msg.claimId!==pend.id)return send(P.ws,{type:'error',msg:'Buangan sudah berubah. Pilih klaim untuk buangan yang sedang tampil.'});
    if (!['win', 'set', 'pass'].includes(c)) return send(P.ws, { type: 'error', msg: 'Pilih Klaim, Hu, atau Lewat.' });
    if (c === 'win') { const win=this.winningHand(seat,[...P.hand,G.last.tile],false,G.last.tile);if (!win) return send(P.ws, { type: 'error', msg: this.settings.ruleset==='hkma'?'Hu belum sah untuk aturan meja ini. Santai perlu bentuk lengkap; HKMA juga perlu 3 fan. Kamu masih bisa klaim lain atau Lewat.':'Ubin ini tidak membuat tanganmu menang. Kamu masih bisa memilih klaim lain atau Lewat.' }); pend.claims.push({ p: seat, type: 'win', win }); }
    else if (c === 'set') {
      const v = this.validateSet(seat, msg.tiles || []); if (v.error) return send(P.ws, { type: 'error', msg: v.error });
      pend.claims.push({ p: seat, ...v.claim });
    }
    if (c === 'win' || c === 'set') { if (G.undo) G.undo.claimed = true; }
    pend.waiting.delete(seat);
    if (pend.waiting.size) { this.broadcastState(); return; }
    clearTimeout(this.timers.claim); this.resolveClaims(pend.claims);
  }
  // Cek apakah ubin pilihan pemain + ubin buangan membentuk Pung, Kong, atau Chow yang sah.
  validateSet(seat, ids) {
    const G = this.G; const P = this.players[seat]; const t = G.last.tile; const ti = E.idxOf(t);
    if(!Array.isArray(ids)||![2,3].includes(ids.length))return {error:'Pilih 2 ubin (Pung/Chow) atau 3 ubin (Kong) dari tanganmu.'};
    const tiles = []; for (const id of ids) { const x = P.hand.find(h => h.id === id); if (!x || tiles.includes(x)) return { error: 'Ubin tidak valid.' }; tiles.push(x); }
    if(G.robKong)return {error:'Saat merebut Kong hanya boleh Hu atau Lewat.'};
    if(HK.isJoker(t)||tiles.some(HK.isJoker))return {error:'Joker hanya melengkapi tangan tertutup, tidak untuk klaim terbuka.'};
    const idx = tiles.map(E.idxOf);
    if (tiles.length === 3) { if(this.settings.ruleset==='hkma'&&!G.wall.length)return {error:'Tembok habis; Kong memerlukan ubin pengganti.'}; if (idx.every(i => i === ti)) return { claim: { type: 'kong' } }; return { error: 'Kong butuh 3 ubin yang sama dengan buangan.' }; }
    if (idx.every(i => i === ti)) return { claim: { type: 'pung' } };
    if (!E.isSuit(ti)) return { error: 'Ubin huruf hanya bisa Pung atau Kong.' };
    if (seat !== (G.last.from + 1) % 4) return { error: 'Chow hanya boleh dari pemain di sebelah kirimu.' };
    const all = [...idx, ti].sort((a, b) => a - b);
    const sameSuit = all.every(i => Math.floor(i / 9) === Math.floor(ti / 9));
    if (sameSuit && all[1] === all[0] + 1 && all[2] === all[1] + 1) return { claim: { type: 'chow', combo: idx } };
    return { error: 'Kombinasi itu bukan Pung, Kong, atau Chow.' };
  }
  async resolveClaims(claims) {
    const G = this.G; if (G.over||closing||this.recovering) return; G.resolvingClaims=claims;G.pending = null; G.undo = null; this.bump(); const from = G.last.from; const order = q => (q - from + 4) % 4;
    if(claims.some(c=>this.players[c.p].bot)){const gen=G.gen;this.broadcastState();await sleep(3000);if(G.gen!==gen||G.over||closing||this.recovering)return;}
    G.resolvingClaims=null;
    const wins = claims.filter(c => c.type === 'win').sort((a, b) => order(a.p) - order(b.p));
    if(G.robKong){const rob=G.robKong;G.robKong=null;if(wins.length){const w=wins[0],P=this.players[w.p],owner=this.players[rob.seat],index=owner.hand.findIndex(t=>t.id===rob.tileId);if(index<0)return;P.hand.push(owner.hand.splice(index,1)[0]);G.robbedKong=true;return this.endHand(w.p,G.last.tile,false,w.win,rob.seat);}G.last=rob.previousLast;G.current=rob.seat;return this.doKong(rob.seat,rob.kind,rob.arg,true);}
    if (wins.length) { const w = wins[0]; const P = this.players[w.p]; P.hand.push(G.last.tile); this.players[from].discards.pop(); return this.endHand(w.p, G.last.tile, false, w.win, from); }
    const pk = claims.find(c => c.type === 'kong') || claims.find(c => c.type === 'pung');
    if (pk) return this.applyClaim(pk);
    const ch = claims.find(c => c.type === 'chow'); if (ch) return this.applyClaim(ch);
    return this.startTurn((from + 1) % 4);
  }
  async applyClaim(cl) {
    const G = this.G; const P = this.players[cl.p]; const t = G.last.tile; const i = E.idxOf(t); this.players[G.last.from].discards.pop();
    const taken = [];
    if (cl.type === 'chow') { for (const j of cl.combo) { const k = P.hand.findIndex(x => E.idxOf(x) === j); taken.push(P.hand.splice(k, 1)[0]); } }
    else { const n = cl.type === 'kong' ? 3 : 2; for (let k = 0; k < n; k++) { const idx = P.hand.findIndex(x => E.idxOf(x) === i); taken.push(P.hand.splice(idx, 1)[0]); } }
    const tiles = [...taken, t].sort(E.byIdx); P.melds.push({ type: cl.type, tiles, open: true, from: G.last.from });
    if(this.settings.ruleset==='hkma'){if(cl.type==='kong')G.kongDeclarations=(G.kongDeclarations||0)+1;const dragons=P.melds.filter(m=>m.type!=='chow'&&m.tiles[0].s==='g').length;if(P.melds.length===4||t.s==='g'&&dragons===3)P.pao=G.last.from;G.hadMeld=true;G.kongChain=0;}
    G.current = cl.p; G.phase = cl.type==='kong'?'kong':'discard'; P.drawn = null; this.bump();
    const label = cl.type === 'chow' ? 'Chow' : cl.type === 'pung' ? 'Pung' : 'Kong';
    this.log(`${P.name} ${label} ${E.tileName(t)} dari ${this.players[G.last.from].name}!`); this.broadcastState(); const gen=G.gen;await sleep(650);if(G.gen!==gen||G.over||closing||this.recovering)return;
    if (cl.type === 'kong') return this.finishKong(cl.p);
    if (!P.bot) { this.armTurn(cl.p); this.broadcastState(); return; }
    await sleep(3000);if(G.gen!==gen||G.over||closing||this.recovering)return;return this.botAct(cl.p, false);
  }
  endHand(winner, tile, zimo, win, from) {
    const G = this.G;if(G.over)return;
    const evaluated=winner!==null&&this.settings.ruleset==='hkma'?this.evaluateHongKong(winner,this.players[winner].hand,zimo,tile):null;
    if(winner!==null&&this.settings.ruleset==='hkma'&&!evaluated?.score.qualified)return;
    G.over = true; G.phase = 'end'; G.pending = null; this.bump(); clearTimeout(this.timers.claim);
    let r;
    if (winner === null) { r = { draw: true }; this.log('Dinding habis. Ronde seri.'); }
    else {
      const P = this.players[winner]; const sc = evaluated?.score||E.scoreHand(P.hand, P.melds, win, zimo, this.wind(winner)); const pts = 10 * sc.total; const delta = [0, 0, 0, 0];
      const settlement=evaluated?HK.settlement(sc,winner,from,zimo,P.pao):null;
      if(settlement)delta.splice(0,4,...settlement.delta);
      else if (zimo) { for (let q = 0; q < 4; q++) if (q !== winner) delta[q] -= pts; delta[winner] += 3 * pts; } else { delta[from] -= 3 * pts; delta[winner] += 3 * pts; }
      this.players.forEach((Q, i) => Q.score += delta[i]);
      r = { winner, zimo, from, tile, fans: sc.fans, total: sc.total, rawTotal:sc.rawTotal,delta,payments:settlement?.payments,chuck:sc.chuck,selfEach:sc.selfEach,ruleset:this.settings.ruleset,winMode:sc.winMode||'hkma',pao:P.pao,flowers:P.flowers||[],jokers:this.settings.jokers };
      this.log(`${P.name} menang${zimo ? ' (Zimo)' : ' dari buangan ' + this.players[from].name}!`);
    }
    r.compare = this.players.map((P, i) => {
      let status; const isW = !r.draw && r.winner === i;
      if (isW) status = { kind: 'win', total: r.total };
      else { const w = this.settings.ruleset==='hkma' ? Array.from({length:34},(_,n)=>n).filter(n=>this.winningHand(i,[...P.hand,E.fromIdx(n)],false,E.fromIdx(n))) : E.waitsOf(P.hand, P.melds); if (w.length) status = { kind: 'tenpai', waits: w }; else status = { kind: 'far', shanten: E.shanten(E.counts(P.hand), P.melds.length) }; }
      return { seat: i, hand: P.hand.slice().sort(E.byIdx), melds: P.melds, status };
    });
    r.round = G.hand; r.maxHands = G.maxHands; r.final = G.hand >= G.maxHands;
    if (r.final) r.ranking = this.players.map((P, i) => ({ seat: i, name: P.name, score: P.score })).sort((a, b) => b.score - a.score);
    this.ledger.push({label:'Ronde '+G.hand,time:Date.now(),rate:this.settings.pointValue,players:this.players.map((P,i)=>({name:P.name,delta:r.delta?.[i]||0,amount:(r.delta?.[i]||0)*this.settings.pointValue}))});this.ledger=this.ledger.slice(-200);
    G.result = r; this.broadcastState();
  }
  next(seat) {
    const G = this.G; if (!G || !G.over || !G.result) return; if (seat !== this.hostSeat()) return;
    if (G.result.final) { G.final = true; this.broadcastState(); return; }
    if(this.settings.ruleset==='hkma'){if(G.result.winner!==G.dealer){G.dealer=(G.dealer+1)%4;G.dealerRotations=(G.dealerRotations||0)+1;}G.hand++;return this.startHand();}
    const nextDealer = this.players[(G.dealer + 1) % 4]; // aturan lama mempertahankan pengacakan
    G.hand++; this.startHand(nextDealer);
  }
  again(seat) { const G = this.G; if (!G || !G.over) return; if (seat !== this.hostSeat()) return; clearTimeout(this.timers.next); this.newMatch(true); }

  // ---------- Aksi dari klien ----------
  onAction(seat, msg) {
    const G = this.G; if (!G || G.over) return; const P = this.players[seat]; if (!P) return; this.lastActivity = Date.now();
    if(G.phase==='opening'){if(msg.action==='skip-opening'&&seat===this.hostSeat()&&msg.openingId===G.opening?.id&&!this.recovering)this.finishOpening();return;}
    if (msg.action === 'claim') return this.humanClaim(seat, msg);
    if (msg.action === 'undo') return this.undoDiscard(seat);
    if (G.pending) return;
    if (G.current !== seat || G.phase !== 'discard') return;
    if (msg.action === 'discard') { const t = P.hand.find(x => x.id === msg.id); if (t) this.discardTile(seat, t); }
    else if (msg.action === 'win') { if (P.drawn) { const w = this.winningHand(seat,P.hand,true,P.drawn); if (w) this.endHand(seat, P.drawn, true, w);else send(P.ws,{type:'error',msg:'Hu belum sah untuk aturan meja ini. Santai perlu bentuk lengkap; HKMA juga perlu 3 fan.'}); } }
    else if (msg.action === 'kong') { this.doKong(seat, msg.kind === 'add' ? 'add' : 'conc', msg.arg | 0); }
  }

  undoDiscard(seat) {
    const G = this.G; const u = G.undo; const P = this.players[seat];
    if (!u || u.seat !== seat) return send(P.ws, { type: 'error', msg: 'Tidak ada buangan yang bisa dibatalkan.' });
    if (Date.now() > u.until) return send(P.ws, { type: 'error', msg: 'Waktu pembatalan (2 detik) sudah lewat.' });
    if (u.claimed) return send(P.ws, { type: 'error', msg: 'Sudah ada pemain yang mengklaim ubin itu.' });
    if (G.phase !== 'claim' || !G.last || G.last.tile !== u.tile) return;
    P.discards.pop(); P.hand.push(u.tile); P.drawn = u.hadDrawn ? u.tile : null;
    if(this.settings.ruleset==='hkma')G.discardCount=Math.max(0,(G.discardCount||0)-1);
    G.last = u.prevLast; G.pending = null; G.undo = null; G.current = seat; G.phase = 'discard'; this.bump();
    this.armTurn(seat); this.log(`${P.name} membatalkan buangan.`); this.broadcastState();
  }
  makeHost(fromSeat, toSeat) {
    if (fromSeat !== this.hostSeat()) return; const T = this.players[toSeat]; if (!T || T.bot) return;
    this.hostToken = T.token; this.addChat(null, `${T.name} sekarang jadi host.`);
    if (this.state === 'lobby') this.broadcastLobby(); else this.broadcastState();
  }
  // ---------- Pengiriman state ----------
  personal(v) {
    const G = this.G; const reveal = G.over; const spec = v < 0;
    return {
      type: 'state', v: CLIENT_VERSION, build: BUILD, code: this.code, you: v, hand: G.hand, maxHands: G.maxHands, dealer: G.dealer, current: G.current, phase: G.phase, wall: G.wall.length, log: G.log, over: G.over, final: G.final,
      last: G.last ? { tile: G.last.tile, from: G.last.from } : null,
      roundWind:Math.floor((G.dealerRotations||0)/4)%4,opening:this.publicOpening(),wallLayout:this.wallLayout(),
      hostSeat: this.hostSeat(),settings:this.settings,ledger:this.ledger,
      players: this.players.map((P, i) => ({
        name: P.name, bot: P.bot, connected: P.connected, score: P.score, wind: this.wind(i), handCount: P.hand.length,
        hand: G.phase!=='opening'&&(!spec && i === v || reveal) ? P.hand : null, drawn: G.phase!=='opening'&&!spec && i === v && P.drawn ? P.drawn.id : null,
        flowers:G.phase==='opening'?[]:P.flowers||[],pao:P.pao,
        melds: P.melds.map(m => (m.type === 'kong' && !m.open && i !== v && !reveal) ? { type: 'kong', open: false, hidden: true, tiles: [m.tiles[1], m.tiles[2]] } : m),
        discards: P.discards
      })),
      spectator: spec, spectators: this.spectators.map(s => s.name), history: this.history.slice(-60), botLevel: this.settings.botLevel,
      undoUntil: !spec && G.undo && G.undo.seat === v && !G.undo.claimed ? G.undo.until : null,
      options: !spec && G.pending && G.pending.waiting.has(v) ? G.pending.opts[v] : null,
      claimDeadline: G.pending ? G.pending.deadline : null,
      claimOpen: !!G.pending,
      claimId: G.pending ? G.pending.id : null,
      claimMode: claimMode(this.settings),
      autoPass: this.settings.autoPass,
      highlightSets: this.settings.highlightSets,
      claimAutoPass: G.pending ? G.pending.autoPass : this.settings.autoPass,
      claimWaiting: G.pending ? [...G.pending.waiting] : [],
      autoPassed: !!(!spec && G.pending && G.pending.autoPass && G.last.from !== v && G.pending.opts[v] && !hasClaimChoice(G.pending.opts[v])),
      turnDeadline: G.turnDeadline, turnSeconds: this.settings.turnSeconds, claimSeconds: this.settings.claimSeconds,
      result: G.result
      ,canHu:!spec&&G.phase==='discard'&&G.current===v&&!!this.players[v].drawn?!!this.winningHand(v,this.players[v].hand,true,this.players[v].drawn):false
    };
  }
  broadcastState() { if(closing)return;hub?.changed(this);for (const p of this.players) if (!p.bot && p.connected) send(p.ws, this.personal(p.seat)); for (const s of this.spectators) if (s.connected) send(s.ws, this.personal(-1)); }
}

// ---------- HTTP statis ----------
const assets = { '/':'public/index.html', '/index.html':'public/index.html', '/engine.js':'engine.js', '/hong-kong.js':'hong-kong.js', '/hu.js':'public/hu.js', '/hu.css':'public/hu.css', '/opening.js':'public/opening.js', '/hong-kong.css':'public/hong-kong.css', '/client.js':'public/client.js', '/tiles.js':'public/tiles.js', '/hand-help.js':'public/hand-help.js' };
const server = http.createServer((req, res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  let url;
  try { url = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  const name = assets[url];
  if (!name) { res.writeHead(404); return res.end('Not found'); }
  const file = path.join(__dirname,name);
  fs.readFile(file,(err,data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200,{ 'Content-Type':MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
});

// ---------- WebSocket ----------
const wss = new WebSocketServer({ server, maxPayload:16384, verifyClient:info => { if (!info.origin) return true; try { return new URL(info.origin).host === info.req.headers.host; } catch { return false; } } });
wss.on('error',error => console.error('Mahjong WebSocket:',error.message));
wss.on('connection', ws => {
  ws.roomPlayer = null; ws.alive = true; ws.count = 0; ws.window = Date.now();
  ws.on('pong',() => { ws.alive = true; }); ws.on('error',() => {});
  ws.on('message', raw => {
    if (Date.now() - ws.window > 1000) { ws.window = Date.now(); ws.count = 0; }
    if (++ws.count > 45) return;
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;
    if(hub?.handle(ws,msg))return;
    const rp = ws.roomPlayer;
    if (rp && ['create','join','rejoin'].includes(msg.type)) return send(ws,{ type:'error',msg:'Keluar dari room ini sebelum pindah.' });
    if (['create','join','rejoin'].includes(msg.type) && msg.v !== CLIENT_VERSION) return send(ws,{ type:'error',msg:'Mahjong sudah diperbarui: preset Easy, Normal, Hard, dan Customize. Muat ulang halaman Mahjong.',versionMismatch:true,build:BUILD,expectedVersion:CLIENT_VERSION });
    if (msg.type === 'create') {
      if (rooms.size >= 200) return send(ws,{ type:'error',msg:'Server penuh. Coba lagi nanti.' });
      const room = new Room(makeCode()); rooms.set(room.code, room);
      const { player } = room.addHuman(ws, cleanName(msg.name)); ws.roomPlayer = { room, player };
      send(ws, { type: 'joined', code: room.code, token: player.token, seat: player.seat }); room.broadcastLobby(); return;
    }
    if (msg.type === 'join') {
      const room = rooms.get(String(msg.code || '').toUpperCase().trim()); if (!room) return send(ws, { type: 'error', msg: 'Kode ruangan tidak ditemukan.' });
      if (room.spectators.filter(p=>p.connected&&!p.bot).length >= 24 && (room.state !== 'lobby' || room.players.length >= 4)) return send(ws,{ type:'error',msg:'Kursi penonton penuh.' });
      const r = room.addHuman(ws, cleanName(msg.name)); if (r.error) return send(ws, { type: 'error', msg: r.error });
      const who = r.player || r.spectator; ws.roomPlayer = { room, player: who };
      send(ws, { type: 'joined', code: room.code, token: who.token, seat: r.player ? r.player.seat : -1, spectator: !r.player });
      if (r.spectator) { send(ws, { type: 'chat_history', chat: room.chat.slice(-50) }); room.addChat(null, `${who.name} masuk sebagai penonton.`); if (room.state === 'lobby') room.broadcastLobby(); else { send(ws, room.personal(-1)); } }
      else room.broadcastLobby();
      return;
    }
    if (msg.type === 'rejoin') {
      const room = rooms.get(String(msg.code || '').toUpperCase()); if (!room) return send(ws, { type: 'error', msg: 'Ruangan sudah tidak ada.', fatal: true, sessionUnavailable:true });
      const p = room.rejoin(ws, msg.token); if (!p) return send(ws, { type: 'error', msg: 'Sesi tidak dikenal.', fatal: true, sessionUnavailable:true });
      ws.roomPlayer = { room, player: p }; send(ws, { type: 'joined', code: room.code, token: p.token, seat: p.spectator ? -1 : p.seat, spectator: !!p.spectator });
      send(ws, { type: 'chat_history', chat: room.chat.slice(-50) });
      if (room.state === 'lobby') room.broadcastLobby(); else room.broadcastState(); return;
    }
    if (!rp) return;
    const { room, player } = rp;
    if (msg.type === 'chat') { const text = String(msg.text || '').trim().slice(0, 200); if (!text) return; room.lastActivity = Date.now(); return room.addChat(player, text, !!msg.emoji); }
    if (msg.type === 'leave') { ws.roomPlayer = null; room.disconnect(player,true); send(ws, { type: 'left' }); return; }
    if (player.spectator) return;
    if (msg.type === 'start') return room.start(player.seat, msg.settings);
    if (msg.type === 'settings') return room.updateSettings(player.seat, msg.settings);
    if (msg.type === 'host') return room.makeHost(player.seat, msg.seat | 0);
    if (msg.type === 'action') return room.onAction(player.seat, msg);
    if (msg.type === 'next') return room.next(player.seat);
    if (msg.type === 'again') return room.again(player.seat);
  });
  ws.on('close', () => { const rp = ws.roomPlayer; if (rp) { ws.roomPlayer = null; rp.room.disconnect(rp.player); } });
});

// Bersihkan ruangan yang ditinggal semua pemain.
const maintenance = setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  for (const [code, room] of rooms) {
    const alive = room.everyone().some(p => p.connected);
    if (!alive && Date.now() - room.lastActivity > 7 * 86400000) { Object.values(room.timers).forEach(clearTimeout); rooms.delete(code); }
  }
}, 60 * 1000);

maintenance.unref();
async function close() {
  closing=true;clearInterval(maintenance);
  for (const room of rooms.values()) {if(room.G){room.G.over=true;room.G.gen++;}Object.values(room.timers).forEach(clearTimeout);}
  for (const ws of wss.clients) { ws.roomPlayer = null; ws.terminate(); }
  await new Promise(resolve => wss.close(resolve));
  await new Promise(resolve => server.close(resolve));
}
return { server,wss,rooms,close,
  setRoomService(value){hub=value;},capacity:()=>4,
  restoreRoom(saved){const room=Object.assign(new Room(saved.code),saved);room.settings.ruleset ||= 'legacy';room.settings.winMode ||= 'hkma';room.settings.tablePreset ||= 'custom';if(room.settings.casualZero===undefined)room.settings.casualZero=false;for(const p of room.players)p.flowers ||= [];room.settings.claimMode=claimMode(room.settings);room.settings.autoPass=room.settings.claimMode==='fast';room.timers={};if(room.G){room.G.gen++;room.G.undo=null;room.G.turnDeadline=null;if(room.G.pending&&!room.G.pending.id)room.G.pending.id=randomBytes(12).toString('hex');}return room;},
  setSpectator(p,value){p.spectator=value;if(value)p.seat=-1;},
  admit(room,p,index){p.seat=index;p.hand=[];p.melds=[];p.discards=[];p.drawn=null;p.score??=0;},
  broadcastRoom(room){if(room.state==='lobby')room.broadcastLobby();else room.broadcastState();},
  resumeRoom(room){const G=room.G;if(!G||G.over)return;G.gen++;if(G.phase==='opening')return room.advanceOpening();if(G.phase==='kong')return room.finishKong(G.current);if(G.phase==='claim'){if(G.pending)return room.broadcastState();return G.resolvingClaims?room.resolveClaims(G.resolvingClaims):room.offerClaims();}if(G.phase==='discard'){const p=room.players[G.current];if(p.bot){const gen=G.gen;room.timers.recovery=setTimeout(()=>{if(G.gen===gen&&!G.over&&!room.recovering)room.botAct(p.seat,!!p.drawn);},3000);}else room.armTurn(p.seat);}},
  disposeRoom(room){if(room.G){room.G.over=true;room.G.gen++;}Object.values(room.timers).forEach(clearTimeout);},
  nextRound(room){if(room.G.result.final)room.again(room.hostSeat());else room.next(room.hostSeat());}
};
}
if (require.main === module) {
  const app = createMahjongServer(); const port = Number(process.env.PORT || 3000);
  app.server.listen(port,process.env.HOST || '0.0.0.0',() => console.log('Mahjong: http://localhost:' + port));
  process.on('SIGINT',() => app.close().then(() => process.exit(0)));
  process.on('SIGTERM',() => app.close().then(() => process.exit(0)));
}
module.exports = { createMahjongServer };
