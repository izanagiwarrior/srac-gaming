/* Mahjong P2P server: ruang tunggu, kode ruangan, dan jalannya permainan. */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { WebSocketServer } = require('ws');
const { randomInt, randomBytes } = require('node:crypto');
const E = require('./engine');
const {tableSettings}=require('../shared/table-settings');
const BUILD = '2026-10-14-six-games-1', CLIENT_VERSION = 6;

function createMahjongServer() {
const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const BOT_NAMES = ['Mei', 'Raka', 'Sinta', 'Bima'];
const AUTO_NEXT_MS = 30000, OFFLINE_ACT_MS = 4000, UNDO_MS = parseInt(process.env.UNDO_MS || '2000', 10);

const SPEED = parseFloat(process.env.SPEED || '1');
const sleep = ms => new Promise(r => setTimeout(r, ms * SPEED));
const rooms = new Map();

function makeCode() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; for (let len = 4; len <= 8; len++) for (let tries = 0; tries < 200; tries++) { let c = ''; for (let i = 0; i < len; i++) c += a[randomInt(a.length)]; if (!rooms.has(c)) return c; } return 'R' + Date.now().toString(36).toUpperCase(); }
function token() { return randomBytes(24).toString('hex'); }
function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function cleanName(n) { return String(n || '').replace(/[<>&"]/g, '').trim().slice(0, 16) || 'Pemain'; }
function hasClaimChoice(o) { return !!(o && (o.win || o.pung || o.kong || (o.chows && o.chows.length))); }

class Room {
  constructor(code) {
    this.code = code; this.players = []; this.spectators = []; this.chat = []; this.history = []; this.ledger = []; this.state = 'lobby'; this.settings = { rounds: 4, turnSeconds: 0, claimSeconds: 0, botLevel: 'normal', pointValue:0, autoPass: false, highlightSets: true }; this.G = null; this.timers = {}; this.lastActivity = Date.now();
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
    if (p.ws && p.ws !== ws && p.ws.readyState === 1) { p.ws.roomPlayer = null; try { p.ws.close(); } catch (e) { } }
    p.ws = ws; p.connected = true; return p;
  }
  disconnect(p) {
    p.connected = false; p.ws = null; this.lastActivity = Date.now();
    if (p.spectator) { this.spectators = this.spectators.filter(x => x !== p); this.addChat(null, `${p.name} berhenti menonton.`); if (this.state === 'lobby') this.broadcastLobby(); else this.broadcastState(); return; }
    if (this.state === 'lobby') {
      this.players = this.players.filter(x => x !== p); this.players.forEach((x, i) => x.seat = i); this.broadcastLobby();
    } else {
      this.broadcastState();
      const G = this.G; if (G && !G.over) {
        if (G.pending && G.pending.waiting.has(p.seat)) this.humanClaim(p.seat, { claim: 'pass' });
        else if (G.current === p.seat && G.phase === 'discard') this.scheduleOfflineAct(p.seat);
      }
    }
  }
  broadcastLobby() {
    const base = { type: 'lobby', v: CLIENT_VERSION, build: BUILD, code: this.code, hostSeat: this.hostSeat(), settings: this.settings,ledger:this.ledger, players: this.players.map(p => ({ seat: p.seat, name: p.name, score:p.score,connected: p.connected, bot: p.bot })), spectators: this.spectators.map(s => s.name), chat: this.chat.slice(-50) };
    for (const p of this.everyone()) send(p.ws, { ...base, spectator: !!p.spectator });
  }
  start(seat, settings) {
    if (this.state !== 'lobby') return; if (seat !== this.hostSeat()) return;
    if(this.updateSettings(seat, settings, false)===false)return;
    let k = 0; while (this.players.length < 4) { let n; do { n = BOT_NAMES[k++ % BOT_NAMES.length]; } while (this.players.some(p => p.name.toLowerCase() === n.toLowerCase()) && k < 20); this.players.push({ seat: this.players.length, name: n, bot: true, connected: true, hand: [], melds: [], discards: [], drawn: null, score: 0 }); }
    this.state = 'playing'; this.newMatch();
  }
  updateSettings(seat, settings, notify = true) {
    if (seat !== this.hostSeat() || !settings || typeof settings !== 'object') return false;
    if (this.state !== 'lobby'){send(this.players[seat]?.ws,{type:'error',msg:'Pengaturan dikunci sejak permainan dimulai. Buat ruangan baru untuk memilih mode lain.'});return false;}
    try{this.settings=tableSettings(settings,this.settings);}catch(error){send(this.players[seat]?.ws,{type:'error',msg:error.message});return false;}
    if ([4, 8, 12].includes(+settings.rounds)) this.settings.rounds = +settings.rounds;
    if (['easy', 'normal', 'hard'].includes(settings.botLevel)) this.settings.botLevel = settings.botLevel;
    if (typeof settings.autoPass === 'boolean') this.settings.autoPass = settings.autoPass;
    if (typeof settings.highlightSets === 'boolean') this.settings.highlightSets = settings.highlightSets;
    this.lastActivity = Date.now();
    if (notify) this.broadcastLobby();return true;
  }
  newMatch() {
    this.ledger=[];for (const p of this.players) p.score = 0;
    this.G = { dealer: 0, hand: 1, maxHands: this.settings.rounds, wall: [], current: 0, phase: 'idle', last: null, pending: null, over: false, result: null, log: '', gen: 0, final: false, turnDeadline: null };
    const first = this.players[Math.floor(Math.random() * 4)];
    this.startHand(first);
  }
  wind(i) { return (i - this.G.dealer + 4) % 4; }
  log(s) { this.G.log = s; this.history.push({ h: this.G.hand, t: s }); if (this.history.length > 200) this.history.splice(0, this.history.length - 200); }
  addChat(p, text, emoji) {
    const m = { from: p ? p.name : null, seat: p && !p.spectator ? p.seat : -1, text, emoji: !!emoji, ts: Date.now() };
    this.chat.push(m); if (this.chat.length > 100) this.chat.shift();
    for (const q of this.everyone()) send(q.ws, { type: 'chat', msg: m });
  }
  bump() { this.G.gen++; clearTimeout(this.timers.offline); clearTimeout(this.timers.turn); this.G.turnDeadline = null; }
  // Giliran manusia: pasang batas waktu berpikir; kalau habis, bot bertindak untuknya.
  armTurn(p) {
    const P = this.players[p]; this.G.turnDeadline = null;
    if (!P.connected) this.scheduleOfflineAct(p); // satu-satunya otomatisasi: pemain yang putus koneksi
  }

  // ---------- Jalannya ronde ----------
  // Acak posisi duduk setiap ronde supaya sumber Chow (pemain di kiri) selalu berganti.
  shuffleSeats(dealerPlayer) {
    E.shuffle(this.players); this.players.forEach((p, i) => p.seat = i);
    this.G.dealer = this.players.indexOf(dealerPlayer);
  }
  startHand(dealerPlayer) {
    const G = this.G;
    if (dealerPlayer) this.shuffleSeats(dealerPlayer);
    G.wall = E.shuffle(E.buildWall()); G.over = false; G.result = null; G.pending = null; G.last = null; G.final = false;
    for (const P of this.players) { P.hand = G.wall.splice(0, 13).sort(E.byIdx); P.melds = []; P.discards = []; P.drawn = null; }
    this.log(`Ronde ${G.hand}: posisi duduk diacak, ${this.players[G.dealer].name} jadi dealer (Timur).`);
    this.startTurn(G.dealer);
  }
  async startTurn(p) {
    const G = this.G; if (G.over) return;
    if (G.wall.length === 0) return this.endHand(null);
    const P = this.players[p]; const t = G.wall.shift(); P.hand.push(t); P.drawn = t; G.current = p; G.phase = 'discard'; G.pending = null; this.bump();
    this.log(`${P.name} mengambil ubin.`);
    if (!P.bot) { this.armTurn(p); this.broadcastState(); return; }
    this.broadcastState();
    await sleep(3000); return this.botAct(p, true);
  }
  scheduleOfflineAct(p) {
    const G = this.G; const gen = G.gen; clearTimeout(this.timers.offline);
    this.timers.offline = setTimeout(() => { const P = this.players[p]; if (G.gen === gen && !G.over && G.current === p && G.phase === 'discard' && !P.connected) this.botAct(p, !!P.drawn); }, OFFLINE_ACT_MS);
  }
  async botAct(p, canWin) {
    const G = this.G; if (G.over) return; const P = this.players[p];
    if (canWin && P.drawn) { const w = E.findWin(P.hand, P.melds); if (w) return this.endHand(p, P.drawn, true, w); }
    const k = E.botKong(P.hand, P.melds); if (k) return this.doKong(p, k.kind, k.arg);
    return this.discardTile(p, E.botChooseDiscardLevel(P.hand, P.melds, this.settings.botLevel, this.botContext(p)));
  }
  botContext(p) {
    const visible = new Array(34).fill(0);
    for (const Q of this.players) { for (const t of Q.discards) visible[E.idxOf(t)]++; for (const m of Q.melds) if (m.open) for (const t of m.tiles) visible[E.idxOf(t)]++; }
    const threats = this.players.filter((Q, i) => i !== p && (Q.melds.length >= 2 || (this.G.wall.length < 20 && Q.melds.length >= 1))).map(Q => ({ discards: new Set(Q.discards.map(E.idxOf)), melds: Q.melds.length }));
    return { visible, threats, wall: this.G.wall.length };
  }
  async doKong(p, kind, arg) {
    const G = this.G; const P = this.players[p]; let tiles;
    if (kind === 'conc') { tiles = P.hand.filter(t => E.idxOf(t) === arg); if (tiles.length !== 4) return; P.hand = P.hand.filter(t => E.idxOf(t) !== arg); P.melds.push({ type: 'kong', tiles, open: false }); }
    else { const m = P.melds[arg]; if (!m || m.type !== 'pung') return; const i = E.idxOf(m.tiles[0]); const k = P.hand.findIndex(t => E.idxOf(t) === i); if (k < 0) return; m.tiles.push(P.hand.splice(k, 1)[0]); m.type = 'kong'; tiles = m.tiles; }
    P.drawn = null; G.phase = 'kong'; this.bump(); this.log(`${P.name} Kong ${E.tileName(tiles[0])}!`); this.broadcastState(); await sleep(600);
    if (!G.wall.length) return this.endHand(null);
    const r = G.wall.pop(); P.hand.push(r); P.drawn = r; G.phase = 'discard'; this.bump();
    if (!P.bot) { this.armTurn(p); this.broadcastState(); return; }
    this.broadcastState();
    await sleep(3000); return this.botAct(p, true);
  }
  async discardTile(p, t) {
    const G = this.G; const P = this.players[p]; const k = P.hand.indexOf(t); if (k < 0) return;
    const claimAutoPass = this.settings.autoPass; // Mode dipilih di lobby dan dikunci selama permainan.
    const prevLast = G.last; const hadDrawn = P.drawn;
    P.hand.splice(k, 1); P.drawn = null; P.discards.push(t); G.last = { tile: t, from: p }; G.phase = 'claim'; G.pending = null; this.bump(); const gen = G.gen;
    this.log(`${G.autoNote || ''}${P.name} membuang ${E.tileName(t)}.`); G.autoNote = null;
    if (!P.bot && P.connected) { G.undo = { seat: p, until: Date.now() + UNDO_MS, tile: t, prevLast, hadDrawn, claimed: false }; }
    this.broadcastState();
    await sleep(!P.bot && P.connected ? Math.max(500, UNDO_MS / SPEED) : 500); // beri jeda 2 detik agar pemain bisa membatalkan
    if (G.gen !== gen) return; // dibatalkan atau keadaan berubah
    if (G.undo && G.undo.seat === p) G.undo = null;
    const claims = []; const opts = {}; const waiting = new Set();
    for (let q = 0; q < 4; q++) {
      if (q === p) continue; const Q = this.players[q]; const o = E.computeOptions(Q.hand, Q.melds, t, q === (p + 1) % 4);
      if (Q.bot) { const d = E.botDecideLevel(Q.hand, Q.melds, o, t, this.settings.botLevel); if (d) claims.push({ p: q, ...d }); continue; }
      opts[q] = o;
      const hasOption = hasClaimChoice(o);
      if (Q.connected && (!claimAutoPass || hasOption)) waiting.add(q);
    }
    if (waiting.size) {
      G.pending = { claims, opts, waiting, deadline: null, autoPass: claimAutoPass }; this.broadcastState();
      return; // menunggu semua pemain menekan Klaim atau Lewat
    }
    return this.resolveClaims(claims);
  }
  humanClaim(seat, msg) {
    const G = this.G; const pend = G.pending; if (!pend || !pend.waiting.has(seat)) return; const o = pend.opts[seat];
    const c = msg.claim; const P = this.players[seat];
    if (!['win', 'set', 'pass'].includes(c)) return send(P.ws, { type: 'error', msg: 'Pilih Klaim, Hu, atau Lewat.' });
    if (c === 'win') { if (!o.win) return send(P.ws, { type: 'error', msg: 'Ubin ini tidak membuat tanganmu menang.' }); pend.claims.push({ p: seat, type: 'win', win: o.win }); }
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
    const tiles = []; for (const id of ids) { const x = P.hand.find(h => h.id === id); if (!x || tiles.includes(x)) return { error: 'Ubin tidak valid.' }; tiles.push(x); }
    const idx = tiles.map(E.idxOf);
    if (tiles.length === 3) { if (idx.every(i => i === ti)) return { claim: { type: 'kong' } }; return { error: 'Kong butuh 3 ubin yang sama dengan buangan.' }; }
    if (tiles.length !== 2) return { error: 'Pilih 2 ubin (Pung/Chow) atau 3 ubin (Kong) dari tanganmu.' };
    if (idx.every(i => i === ti)) return { claim: { type: 'pung' } };
    if (!E.isSuit(ti)) return { error: 'Ubin huruf hanya bisa Pung atau Kong.' };
    if (seat !== (G.last.from + 1) % 4) return { error: 'Chow hanya boleh dari pemain di sebelah kirimu.' };
    const all = [...idx, ti].sort((a, b) => a - b);
    const sameSuit = all.every(i => Math.floor(i / 9) === Math.floor(ti / 9));
    if (sameSuit && all[1] === all[0] + 1 && all[2] === all[1] + 1) return { claim: { type: 'chow', combo: idx } };
    return { error: 'Kombinasi itu bukan Pung, Kong, atau Chow.' };
  }
  async resolveClaims(claims) {
    const G = this.G; if (G.over) return; G.pending = null; G.undo = null; this.bump(); const from = G.last.from; const order = q => (q - from + 4) % 4;
    if(claims.some(c=>this.players[c.p].bot)){const gen=G.gen;await sleep(3000);if(G.gen!==gen||G.over)return;}
    const wins = claims.filter(c => c.type === 'win').sort((a, b) => order(a.p) - order(b.p));
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
    G.current = cl.p; G.phase = 'discard'; P.drawn = null; this.bump();
    const label = cl.type === 'chow' ? 'Chow' : cl.type === 'pung' ? 'Pung' : 'Kong';
    this.log(`${P.name} ${label} ${E.tileName(t)} dari ${this.players[G.last.from].name}!`); this.broadcastState(); await sleep(650);
    if (cl.type === 'kong') { if (!G.wall.length) return this.endHand(null); const r = G.wall.pop(); P.hand.push(r); P.drawn = r; this.bump(); if (!P.bot) { this.armTurn(cl.p); this.broadcastState(); return; } this.broadcastState(); await sleep(3000); return this.botAct(cl.p, true); }
    if (!P.bot) { this.armTurn(cl.p); this.broadcastState(); return; }
    await sleep(3000);return this.botAct(cl.p, false);
  }
  endHand(winner, tile, zimo, win, from) {
    const G = this.G; G.over = true; G.phase = 'end'; G.pending = null; this.bump(); clearTimeout(this.timers.claim);
    let r;
    if (winner === null) { r = { draw: true }; this.log('Dinding habis. Ronde seri.'); }
    else {
      const P = this.players[winner]; const sc = E.scoreHand(P.hand, P.melds, win, zimo, this.wind(winner)); const pts = 10 * sc.total; const delta = [0, 0, 0, 0];
      if (zimo) { for (let q = 0; q < 4; q++) if (q !== winner) delta[q] -= pts; delta[winner] += 3 * pts; } else { delta[from] -= 3 * pts; delta[winner] += 3 * pts; }
      this.players.forEach((Q, i) => Q.score += delta[i]);
      r = { winner, zimo, from, tile, fans: sc.fans, total: sc.total, delta };
      this.log(`${P.name} menang${zimo ? ' (Zimo)' : ' dari buangan ' + this.players[from].name}!`);
    }
    r.compare = this.players.map((P, i) => {
      let status; const isW = !r.draw && r.winner === i;
      if (isW) status = { kind: 'win', total: r.total };
      else { const w = E.waitsOf(P.hand, P.melds); if (w.length) status = { kind: 'tenpai', waits: w }; else status = { kind: 'far', shanten: E.shanten(E.counts(P.hand), P.melds.length) }; }
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
    const nextDealer = this.players[(G.dealer + 1) % 4]; // giliran dealer berpindah ke pemain berikutnya, lalu kursi diacak
    G.hand++; this.startHand(nextDealer);
  }
  again(seat) { const G = this.G; if (!G || !G.over) return; if (seat !== this.hostSeat()) return; clearTimeout(this.timers.next); this.newMatch(); }

  // ---------- Aksi dari klien ----------
  onAction(seat, msg) {
    const G = this.G; if (!G || G.over) return; const P = this.players[seat]; if (!P) return; this.lastActivity = Date.now();
    if (msg.action === 'claim') return this.humanClaim(seat, msg);
    if (msg.action === 'undo') return this.undoDiscard(seat);
    if (G.pending) return;
    if (G.current !== seat || G.phase !== 'discard') return;
    if (msg.action === 'discard') { const t = P.hand.find(x => x.id === msg.id); if (t) this.discardTile(seat, t); }
    else if (msg.action === 'win') { if (P.drawn) { const w = E.findWin(P.hand, P.melds); if (w) this.endHand(seat, P.drawn, true, w); } }
    else if (msg.action === 'kong') { this.doKong(seat, msg.kind === 'add' ? 'add' : 'conc', msg.arg | 0); }
  }

  undoDiscard(seat) {
    const G = this.G; const u = G.undo; const P = this.players[seat];
    if (!u || u.seat !== seat) return send(P.ws, { type: 'error', msg: 'Tidak ada buangan yang bisa dibatalkan.' });
    if (Date.now() > u.until) return send(P.ws, { type: 'error', msg: 'Waktu pembatalan (2 detik) sudah lewat.' });
    if (u.claimed) return send(P.ws, { type: 'error', msg: 'Sudah ada pemain yang mengklaim ubin itu.' });
    if (G.phase !== 'claim' || !G.last || G.last.tile !== u.tile) return;
    P.discards.pop(); P.hand.push(u.tile); P.drawn = u.hadDrawn ? u.tile : null;
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
      hostSeat: this.hostSeat(),settings:this.settings,ledger:this.ledger,
      players: this.players.map((P, i) => ({
        name: P.name, bot: P.bot, connected: P.connected, score: P.score, wind: this.wind(i), handCount: P.hand.length,
        hand: (!spec && i === v || reveal) ? P.hand : null, drawn: !spec && i === v && P.drawn ? P.drawn.id : null,
        melds: P.melds.map(m => (m.type === 'kong' && !m.open && i !== v && !reveal) ? { type: 'kong', open: false, hidden: true, tiles: [m.tiles[1], m.tiles[2]] } : m),
        discards: P.discards
      })),
      spectator: spec, spectators: this.spectators.map(s => s.name), history: this.history.slice(-60), botLevel: this.settings.botLevel,
      undoUntil: !spec && G.undo && G.undo.seat === v && !G.undo.claimed ? G.undo.until : null,
      options: !spec && G.pending && G.pending.waiting.has(v) ? G.pending.opts[v] : null,
      claimDeadline: G.pending ? G.pending.deadline : null,
      claimOpen: !!G.pending,
      autoPass: this.settings.autoPass,
      highlightSets: this.settings.highlightSets,
      claimAutoPass: G.pending ? G.pending.autoPass : this.settings.autoPass,
      claimWaiting: G.pending ? [...G.pending.waiting] : [],
      autoPassed: !!(!spec && G.pending && G.pending.autoPass && G.last.from !== v && G.pending.opts[v] && !hasClaimChoice(G.pending.opts[v])),
      turnDeadline: G.turnDeadline, turnSeconds: this.settings.turnSeconds, claimSeconds: this.settings.claimSeconds,
      result: G.result
    };
  }
  broadcastState() { for (const p of this.players) if (!p.bot && p.connected) send(p.ws, this.personal(p.seat)); for (const s of this.spectators) if (s.connected) send(s.ws, this.personal(-1)); }
}

// ---------- HTTP statis ----------
const assets = { '/':'public/index.html', '/index.html':'public/index.html', '/engine.js':'engine.js', '/client.js':'public/client.js', '/tiles.js':'public/tiles.js', '/hand-help.js':'public/hand-help.js' };
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
    const rp = ws.roomPlayer;
    if (rp && ['create','join','rejoin'].includes(msg.type)) return send(ws,{ type:'error',msg:'Keluar dari room ini sebelum pindah.' });
    if (['create','join','rejoin'].includes(msg.type) && msg.v !== CLIENT_VERSION) return send(ws,{ type:'error',msg:'Mahjong sudah diperbarui. Muat ulang halaman untuk menggunakan warna set dan mode lewat terbaru.',fatal:true });
    if (msg.type === 'create') {
      if (rooms.size >= 200) return send(ws,{ type:'error',msg:'Server penuh. Coba lagi nanti.' });
      const room = new Room(makeCode()); rooms.set(room.code, room);
      const { player } = room.addHuman(ws, cleanName(msg.name)); ws.roomPlayer = { room, player };
      send(ws, { type: 'joined', code: room.code, token: player.token, seat: player.seat }); room.broadcastLobby(); return;
    }
    if (msg.type === 'join') {
      const room = rooms.get(String(msg.code || '').toUpperCase().trim()); if (!room) return send(ws, { type: 'error', msg: 'Kode ruangan tidak ditemukan.' });
      if (room.spectators.length >= 24 && (room.state !== 'lobby' || room.players.length >= 4)) return send(ws,{ type:'error',msg:'Kursi penonton penuh.' });
      const r = room.addHuman(ws, cleanName(msg.name)); if (r.error) return send(ws, { type: 'error', msg: r.error });
      const who = r.player || r.spectator; ws.roomPlayer = { room, player: who };
      send(ws, { type: 'joined', code: room.code, token: who.token, seat: r.player ? r.player.seat : -1, spectator: !r.player });
      if (r.spectator) { send(ws, { type: 'chat_history', chat: room.chat.slice(-50) }); room.addChat(null, `${who.name} masuk sebagai penonton.`); if (room.state === 'lobby') room.broadcastLobby(); else { send(ws, room.personal(-1)); } }
      else room.broadcastLobby();
      return;
    }
    if (msg.type === 'rejoin') {
      const room = rooms.get(String(msg.code || '').toUpperCase()); if (!room) return send(ws, { type: 'error', msg: 'Ruangan sudah tidak ada.', fatal: true });
      const p = room.rejoin(ws, msg.token); if (!p) return send(ws, { type: 'error', msg: 'Sesi tidak dikenal.', fatal: true });
      ws.roomPlayer = { room, player: p }; send(ws, { type: 'joined', code: room.code, token: p.token, seat: p.spectator ? -1 : p.seat, spectator: !!p.spectator });
      send(ws, { type: 'chat_history', chat: room.chat.slice(-50) });
      if (room.state === 'lobby') room.broadcastLobby(); else room.broadcastState(); return;
    }
    if (!rp) return;
    const { room, player } = rp;
    if (msg.type === 'chat') { const text = String(msg.text || '').trim().slice(0, 200); if (!text) return; room.lastActivity = Date.now(); return room.addChat(player, text, !!msg.emoji); }
    if (msg.type === 'leave') { ws.roomPlayer = null; room.disconnect(player); send(ws, { type: 'left' }); return; }
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
    if (!alive && Date.now() - room.lastActivity > 10 * 60 * 1000) { Object.values(room.timers).forEach(clearTimeout); rooms.delete(code); }
  }
}, 60 * 1000);

maintenance.unref();
async function close() {
  clearInterval(maintenance);
  for (const room of rooms.values()) Object.values(room.timers).forEach(clearTimeout);
  for (const ws of wss.clients) { ws.roomPlayer = null; ws.terminate(); }
  await new Promise(resolve => wss.close(resolve));
  await new Promise(resolve => server.close(resolve));
}
return { server,wss,rooms,close };
}
if (require.main === module) {
  const app = createMahjongServer(); const port = Number(process.env.PORT || 3000);
  app.server.listen(port,process.env.HOST || '0.0.0.0',() => console.log('Mahjong: http://localhost:' + port));
  process.on('SIGINT',() => app.close().then(() => process.exit(0)));
  process.on('SIGTERM',() => app.close().then(() => process.exit(0)));
}
module.exports = { createMahjongServer };
