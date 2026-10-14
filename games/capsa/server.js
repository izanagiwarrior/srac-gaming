'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { WebSocketServer } = require('ws');
const E = require('./engine');
const Money = require('./money');
const BUILD_VERSION = '2026-10-13-easy-room-1';

function createApp(options = {}) {
  const rooms = new Map(), timers = new Set();
  const botDelay = options.botDelay ?? 3000, offlineDelay = options.offlineDelay ?? 8000;
  const turnLimit = options.turnLimit ?? 60000;
  const undoLimit = 2;
  let closing = false;
  const addresses = process.env.NODE_ENV === 'production' ? [] : [...new Set(Object.values(os.networkInterfaces()).flat().filter(n => n && n.family === 'IPv4' && !n.internal && !n.address.startsWith('169.254.')).map(n => n.address))];
  const files = new Map([
    ['/', ['public/index.html', 'text/html; charset=utf-8']], ['/index.html', ['public/index.html', 'text/html; charset=utf-8']],
    ['/styles.css', ['public/styles.css', 'text/css; charset=utf-8']], ['/client.js', ['public/client.js', 'application/javascript; charset=utf-8']],
    ['/engine.js', ['engine.js', 'application/javascript; charset=utf-8']]
  ]);
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
    if (pathname === '/health') { res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ ok:true, app:'capsa-banting', version:BUILD_VERSION })); }
    if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    const entry = files.get(pathname);
    if (!entry || !['GET','HEAD'].includes(req.method)) { res.writeHead(404); return res.end('Not found'); }
    fs.readFile(path.join(__dirname, entry[0]), (error, data) => {
      if (error) { res.writeHead(500); return res.end('Cannot load app'); }
      res.writeHead(200, { 'Content-Type':entry[1], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
  const wss = new WebSocketServer({ server, maxPayload:8192, verifyClient:info => {
    if (!info.origin) return true;
    try { return new URL(info.origin).host === info.req.headers.host; } catch { return false; }
  } });
  const cleanName = value => String(value || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0,20) || 'Pemain';
  const send = (ws, data) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(data)); };
  const fail = (ws, message, fatal = false) => send(ws, { type:'error', message, fatal });
  function later(room, delay, action) {
    const timer = setTimeout(() => { timers.delete(timer); room.timers.delete(timer); if (!closing) action(); }, delay);
    timers.add(timer); room.timers.add(timer); return timer;
  }
  function clearTimer(room, timer) { clearTimeout(timer); timers.delete(timer); room.timers.delete(timer); }
  function clearRoomTimers(room) {
    for (const timer of room.timers) clearTimer(room, timer);
    room.turnTimer = null; room.deadlineTimer = null; room.turnKey = null;
    room.turnStartedAt = null; room.turnDeadline = null;
  }
  function hostIndex(room) {
    let i = room.players.findIndex(p => p.token === room.hostToken && p.connected && !p.bot);
    if (i < 0) { i = room.players.findIndex(p => p.connected && !p.bot); if (i >= 0) room.hostToken = room.players[i].token; }
    return i;
  }
  function snapshot(room, entity) {
    const you = room.players.indexOf(entity), g = room.game;
    return {
      type:'state', build:BUILD_VERSION, code:room.code, phase:room.phase, round:room.round, matchId:room.matchId, settings:room.settings, addresses,
      you, hostSeat:hostIndex(room), spectator:you < 0,
      serverNow:Date.now(), turnDeadline:room.turnDeadline, turnLimit, botDelay, revision:room.revision,
      capacity:room.settings.mode === 'casual' ? 8 : 4,
      players:room.players.map((p, i) => ({ seat:i, name:p.name, bot:p.bot, connected:p.connected, score:p.score, net:p.score * room.settings.pointValue, initialCount:g ? g.initialCounts[i] : 0, handCount:g ? g.hands[i].length : 0, passed:g ? g.passed.includes(i) : false, autoOffline:!!p.autoOffline })),
      spectators:room.spectators.filter(p => p.connected).length,
      hand:you >= 0 && room.phase === 'playing' ? g.hands[you] : [],
      turn:g ? g.turn : null, table:g ? g.table : null, lastTable:g ? g.lastTable : null,
      requiredCard:g ? g.requiredCard : null, actionNo:g ? g.actionNo : 0,
      events:g ? g.events.slice(-35) : [], lastAction:g ? g.lastAction : null,
      result:room.result, chat:room.chat.slice(-45), history:room.history.slice(-12),
      undo:{ limit:undoLimit, used:room.undoUses[you] || 0, remaining:Math.max(0,undoLimit - (room.undoUses[you] || 0)), available:canUndo(room,you), targetActionNo:room.undoPoints[you]?.game.actionNo ?? null },
      lastUndo:room.lastUndo,
      money:Money.recap(room.players,room.history,room.settings,room.phase,room.practice)
    };
  }
  function broadcast(room) { for (const p of [...room.players, ...room.spectators]) if (p.connected && !p.bot) send(p.ws, snapshot(room, p)); }
  function say(room, p, text) {
    room.chat.push({ id:crypto.randomUUID(), name:p ? p.name : null, text, time:Date.now() });
    if (room.chat.length > 70) room.chat.shift(); room.active = Date.now();
  }
  // Game checkpoints never retain sockets, credentials, or connection/host state.
  function turnCheckpoint(room) {
    return structuredClone({ game:room.game, round:room.round, matchId:room.matchId, history:room.history, chat:room.chat,
      scores:room.players.map(p => p.score), previousWinner:room.previousWinner });
  }
  function canUndo(room, seat) {
    const point = room.undoPoints[seat];
    return seat >= 0 && room.settings.easyMode && ['playing','result','finished'].includes(room.phase) &&
      (room.undoUses[seat] || 0) < undoLimit && !!point && point.round === room.round && point.matchId === room.matchId;
  }
  function undoTurn(room, seat, ws) {
    if (!canUndo(room,seat)) return fail(ws, !room.settings.easyMode ? 'Undo hanya tersedia saat Easy Mode aktif.' :
      (room.undoUses[seat] || 0) >= undoLimit ? 'Jatah undo habis: maksimal 2 kali per pemain per ronde.' : 'Belum ada langkahmu yang bisa dikembalikan pada ronde ini.');
    const point = structuredClone(room.undoPoints[seat]);
    clearRoomTimers(room);
    room.undoUses[seat] = (room.undoUses[seat] || 0) + 1;
    // Discard every checkpoint from the abandoned future, including this move.
    room.undoPoints = room.undoPoints.map(saved => saved && saved.game.actionNo < point.game.actionNo ? saved : null);
    room.game = point.game; room.round = point.round; room.history = point.history; room.chat = point.chat;
    room.previousWinner = point.previousWinner; room.result = null; room.phase = 'playing';
    room.players.forEach((player,i) => {
      player.score = point.scores[i]; player.offlineTimer = null;
      if (!player.connected && !player.bot && !player.autoOffline) player.offlineTimer = later(room,offlineDelay,() => {
        player.autoOffline = true; scheduleTurn(room); broadcast(room);
      });
    });
    room.game.settings = { ...room.settings };
    room.revision++; room.active = Date.now();
    room.lastUndo = { id:crypto.randomUUID(), seat, name:room.players[seat].name, round:room.round, actionNo:room.game.actionNo,
      used:room.undoUses[seat], time:Date.now() };
    say(room,null,room.players[seat].name + ' memakai undo (' + room.undoUses[seat] + '/2). Seluruh meja kembali ke awal giliran terakhirnya; langkah dan riwayat sesudahnya dibatalkan.');
    scheduleTurn(room); broadcast(room);
  }
  function finish(room) {
    clearRoomTimers(room);
    room.result = E.score(room.game);
    room.result.moneyDelta = room.result.delta.map(n => n * room.settings.pointValue);
    room.players.forEach((p, i) => { p.score += room.result.delta[i]; });
    room.previousWinner = room.game.winner;
    room.phase = room.round >= room.settings.rounds ? 'finished' : 'result';
    room.history.push({ round:room.round, winner:room.game.winner, delta:room.result.delta, moneyDelta:room.result.moneyDelta, pointValue:room.settings.pointValue, dealt:room.game.initialCounts, remaining:room.game.hands.map(hand => hand.length) });
    say(room, null, room.players[room.game.winner].name + ' habis kartu dan menang ronde ' + room.round + '!');
    broadcast(room);
  }
  function scheduleTurn(room) {
    if (room.phase !== 'playing') return;
    const seat = room.game.turn, p = room.players[seat], sequence = room.game.actionNo;
    const key = room.matchId + ':' + room.round + ':' + room.revision + ':' + sequence;
    const stillCurrent = () => room.phase === 'playing' && room.turnKey === key && room.game.turn === seat && room.game.actionNo === sequence;
    // Each action gets one deadline. Rejoining, chatting, and settings never renew it.
    if (room.turnKey !== key) {
      if (room.turnTimer) clearTimer(room, room.turnTimer);
      if (room.deadlineTimer) clearTimer(room, room.deadlineTimer);
      room.turnTimer = null; room.turnKey = key;
      room.currentTurnCheckpoint = turnCheckpoint(room);
      room.turnStartedAt = Date.now(); room.turnDeadline = room.turnStartedAt + turnLimit;
      room.deadlineTimer = later(room, turnLimit, () => {
        room.deadlineTimer = null;
        if (!stillCurrent()) return;
        if (room.game.table) perform(room, seat, { type:'pass' }, null, 'timeout');
        else {
          // Passing an empty table is illegal. Open with the lowest legal single.
          const hand = room.game.hands[seat];
          const card = room.game.requiredCard === null ? E.sortCards(hand)[0] : hand.find(c => c.id === room.game.requiredCard);
          if (card) perform(room, seat, { type:'play', ids:[card.id] }, null, 'timeout');
        }
      });
    }
    if (!p.bot && !p.autoOffline) {
      if (room.turnTimer) clearTimer(room, room.turnTimer);
      room.turnTimer = null; return;
    }
    if (room.turnTimer) return;
    room.turnTimer = later(room, Math.max(0, botDelay - (Date.now() - room.turnStartedAt)), () => {
      room.turnTimer = null;
      if (!stillCurrent() || (!p.bot && !p.autoOffline)) return;
      const next = (seat + 1) % room.players.length;
      const move = E.chooseMove(room.game.hands[seat], { table:room.game.table, requiredCard:room.game.requiredCard, settings:room.settings, nextCount:room.game.hands[next].length });
      perform(room, seat, move ? { type:'play', ids:move.ids } : { type:'pass' });
    });
  }
  function perform(room, seat, action, ws, automatic) {
    const checkpoint = room.currentTurnCheckpoint;
    const result = E.step(room.game, seat, action);
    if (!result.ok) { if (ws) fail(ws, result.reason); return; }
    if (checkpoint) room.undoPoints[seat] = checkpoint;
    if (automatic) result.action.automatic = automatic;
    room.active = Date.now();
    if (room.game.status === 'over') return finish(room);
    scheduleTurn(room); broadcast(room);
  }
  function beginRound(room) {
    clearRoomTimers(room);
    room.round++; room.phase = 'playing'; room.result = null;
    const deck = Array.from({ length:52 }, (_, i) => E.card(i));
    for (let i = 51; i > 0; i--) { const j = crypto.randomInt(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    const count = room.players.length, hands = Array.from({ length:count }, () => []);
    // Deal every card. Rotate who receives the extra cards each round.
    const offset = (room.round - 1) % count;
    deck.forEach((c,i) => hands[(i + offset) % count].push(c));
    room.game = E.createGame(hands,room.settings);
    room.undoUses = Array(count).fill(0); room.undoPoints = Array(count).fill(null); room.lastUndo = null;
    room.players.forEach(p => { p.autoOffline = !p.connected; p.offlineTimer = null; });
    say(room, null, 'Ronde ' + room.round + ' dimulai dengan ' + count + ' pemain. ' + room.players[room.game.turn].name + ' membuka dengan kartu atau kombinasi yang menyertakan 3♦.');
    scheduleTurn(room); broadcast(room);
  }
  function updateSettings(room, msg) {
    if (msg.mode !== undefined && !['official','casual'].includes(msg.mode)) return 'Mode meja tidak valid.';
    if (msg.mode !== undefined && msg.mode !== room.settings.mode) return 'Mode meja dipilih saat membuat ruangan dan tidak dapat diganti. Buat ruangan baru untuk mode lain.';
    if (msg.pointValue !== undefined && (!Number.isSafeInteger(msg.pointValue) || msg.pointValue < 0 || msg.pointValue > 1000000)) return 'Nilai 1 poin harus rupiah bulat antara 0 dan 1.000.000.';
    if (msg.easyMode !== undefined && typeof msg.easyMode !== 'boolean') return 'Pilihan Easy Mode tidak valid.';
    if (msg.easyMode === true && !room.settings.easyMode && msg.easyAcknowledged !== true) return 'Baca peringatan bantuan curang sebelum mengaktifkan Easy Mode.';
    if (msg.pointValue !== undefined) room.settings.pointValue = msg.pointValue;
    if ([1,4,8,10].includes(Number(msg.rounds))) room.settings.rounds = Number(msg.rounds);
    if (['indonesia','linear'].includes(msg.straightRule)) room.settings.straightRule = msg.straightRule;
    if (typeof msg.lockPass === 'boolean') room.settings.lockPass = msg.lockPass;
    if (E.BOT_LEVELS.includes(msg.botLevel)) {
      room.settings.botLevel = msg.botLevel;
      if (room.game) room.game.settings.botLevel = msg.botLevel;
    }
    if (typeof msg.easyMode === 'boolean') {
      const changed = room.settings.easyMode !== msg.easyMode;
      room.settings.easyMode = msg.easyMode;
      if (room.game) room.game.settings.easyMode = msg.easyMode;
      if (changed) say(room,null,msg.easyMode ? 'Host mengaktifkan Easy Mode: bantuan curang untuk semua pemain, dengan saran langkah dan undo 2 kali per pemain per ronde.' : 'Host mematikan Easy Mode. Saran langkah dan undo dinonaktifkan.');
    }
  }
  function attach(ws, room, p) {
    const previous = p.ws;
    p.ws = ws; p.connected = true; p.autoOffline = false;
    if (p.offlineTimer) { clearTimer(room, p.offlineTimer); p.offlineTimer = null; }
    ws.room = room; ws.entity = p;
    if (previous && previous !== ws) { previous.room = null; previous.entity = null; previous.close(1000, 'Session moved'); }
    send(ws, { type:'joined', code:room.code, token:p.token }); scheduleTurn(room); broadcast(room);
  }
  function detach(ws, explicit) {
    const room = ws.room, p = ws.entity; ws.room = null; ws.entity = null;
    if (closing || !room || !p || p.ws !== ws) return;
    p.connected = false; p.ws = null; room.active = Date.now();
    const seat = room.players.indexOf(p);
    if (seat < 0 && explicit) room.spectators = room.spectators.filter(x => x !== p);
    else if (seat >= 0 && explicit && room.phase === 'lobby') room.players.splice(seat,1);
    else if (seat >= 0 && explicit) { p.bot = true; p.token = null; p.autoOffline = true; }
    if (seat >= 0 && !explicit && room.phase === 'playing') p.offlineTimer = later(room, offlineDelay, () => { p.autoOffline = true; scheduleTurn(room); broadcast(room); });
    say(room, null, p.name + (explicit ? ' keluar dari meja.' : ' terputus. Bot mengambil alih setelah 8 detik.'));
    hostIndex(room); scheduleTurn(room); broadcast(room);
  }
  wss.on('connection', ws => {
    ws.alive = true; ws.count = 0; ws.window = Date.now();
    ws.on('pong', () => { ws.alive = true; }); ws.on('error', () => {});
    ws.on('message', raw => {
      if (Date.now() - ws.window > 1000) { ws.window = Date.now(); ws.count = 0; }
      if (++ws.count > 45) return;
      let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (!msg || typeof msg !== 'object') return;
      let room = ws.room, p = ws.entity;
      if (['create','join','rejoin'].includes(msg.type)) {
        if (room) return fail(ws, 'Keluar dari ruangan ini sebelum pindah.');
        if (msg.type === 'create') {
          if (rooms.size >= 200) return fail(ws, 'Server sedang penuh.');
          if (msg.mode !== undefined && !['official','casual'].includes(msg.mode)) return fail(ws,'Pilih mode Official atau Non-official saat membuat ruangan.');
          let code; do { code = Array.from({ length:4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[crypto.randomInt(24)]).join(''); } while (rooms.has(code));
          room = { code, players:[], spectators:[], hostToken:null, phase:'lobby', round:0, matchId:1, settings:{ rounds:4, ...E.DEFAULTS, mode:msg.mode || E.DEFAULTS.mode }, practice:false, game:null, result:null, previousWinner:null, chat:[], history:[], active:Date.now(), timers:new Set(), turnTimer:null, deadlineTimer:null, turnKey:null, turnStartedAt:null, turnDeadline:null,
            revision:0, undoUses:[], undoPoints:[], currentTurnCheckpoint:null, lastUndo:null };
          rooms.set(code,room);
        } else {
          room = rooms.get(String(msg.code || '').toUpperCase().trim());
          if (!room) return fail(ws, 'Ruangan tidak ditemukan. Cek kode atau buat ruangan baru.', msg.type === 'rejoin');
        }
        if (msg.type === 'rejoin') {
          p = [...room.players, ...room.spectators].find(x => x.token && x.token === msg.token);
          if (!p) return fail(ws, 'Sesi sudah berakhir. Silakan gabung kembali.', true);
          attach(ws,room,p); return;
        }
        const spectator = room.phase !== 'lobby' || room.players.length >= (room.settings.mode === 'casual' ? 8 : 4);
        if (spectator && room.spectators.length >= 24) return fail(ws, 'Kursi penonton penuh.');
        p = { name:cleanName(msg.name), token:crypto.randomUUID(), ws:null, connected:false, bot:false, score:0, autoOffline:false };
        (spectator ? room.spectators : room.players).push(p);
        if (!room.hostToken && !spectator) room.hostToken = p.token;
        say(room,null,p.name + (spectator ? ' menonton meja.' : ' duduk di meja.')); attach(ws,room,p); return;
      }
      if (!room || !p) return;
      const you = room.players.indexOf(p), host = hostIndex(room); room.active = Date.now();
      if (msg.type === 'leave') { detach(ws,true); send(ws,{ type:'left' }); return; }
      if (msg.type === 'chat') {
        const text = String(msg.text || '').replace(/[\u0000-\u001f]/g,'').trim().slice(0,200);
        if (text && (!p.lastChat || Date.now() - p.lastChat > 400)) { p.lastChat = Date.now(); say(room,p,text); broadcast(room); } return;
      }
      if (msg.type === 'seat' && you < 0) {
        const capacity = room.settings.mode === 'casual' ? 8 : 4;
        if (room.phase !== 'lobby' || room.players.length >= capacity) return fail(ws,'Kursi belum tersedia.');
        room.spectators = room.spectators.filter(x => x !== p); room.players.push(p);
        if (host < 0) room.hostToken = p.token;
        say(room,null,p.name + ' duduk di meja.'); broadcast(room); return;
      }
      if (you < 0) return fail(ws,'Penonton tidak bisa memainkan kartu.');
      if (['play','pass','hint','undo'].includes(msg.type) && ((msg.revision ?? 0) !== room.revision ||
        ['matchId','round'].some(key => msg[key] !== undefined && msg[key] !== room[key]) ||
        (msg.actionNo !== undefined && msg.actionNo !== room.game?.actionNo))) return fail(ws,'Keadaan meja sudah berubah. Pilih ulang langkah dari giliran terbaru.');
      if (msg.type === 'settings') {
        if (you !== host) return fail(ws,'Hanya host yang dapat mengatur meja.');
        if (msg.botLevel !== undefined && !E.BOT_LEVELS.includes(msg.botLevel)) return fail(ws,'Tingkat bot tidak valid. Pilih Bego, Normal, atau Hard.');
        if (room.phase !== 'lobby' && Object.keys(msg).some(key => !['type','botLevel','easyMode','easyAcknowledged'].includes(key))) return fail(ws,'Aturan ronde dan rupiah terkunci. Tingkat bot dan Easy Mode dapat diubah host kapan saja.');
        const settingsError = updateSettings(room,msg);
        if (settingsError) return fail(ws,settingsError);
        broadcast(room); return;
      }
      if (msg.type === 'host') {
        const target = room.players[Number(msg.seat)];
        if (you !== host || !target || !target.connected || target.bot) return fail(ws,'Pemindahan host tidak valid.');
        room.hostToken = target.token; broadcast(room); return;
      }
      if (msg.type === 'start') {
        if (you !== host || room.phase !== 'lobby') return fail(ws,'Hanya host yang dapat memulai.');
        const settingsError = updateSettings(room,msg);
        if (settingsError) return fail(ws,settingsError);
        const minimum = room.settings.mode === 'casual' ? 3 : 4;
        while (room.players.length < minimum) {
          const name = ['Mei','Raka','Sinta','Bima'].find(n => !room.players.some(x => x.name === n)) || 'Bot';
          room.players.push({ name, token:null, ws:null, connected:true, bot:true, score:0, autoOffline:false });
        }
        room.practice = room.players.some(player => player.bot);
        if (room.practice && room.settings.pointValue) say(room,null,'Meja memakai bot. Nilai rupiah pilihan host tetap dipakai untuk simulasi saldo.');
        beginRound(room); return;
      }
      if (msg.type === 'play' || msg.type === 'pass') {
        if (room.phase !== 'playing') return fail(ws,'Ronde belum berjalan atau sudah selesai.');
        perform(room,you,{ type:msg.type, ids:msg.ids },ws); return;
      }
      if (msg.type === 'hint') {
        if (!room.settings.easyMode) return fail(ws,'Saran langkah hanya tersedia saat Easy Mode aktif.');
        if (room.phase !== 'playing' || room.game.turn !== you) return fail(ws,'Saran langkah tersedia saat giliranmu.');
        const key = room.matchId + ':' + room.round + ':' + room.revision + ':' + room.game.actionNo;
        if (p.hintCache?.key !== key) {
          const next = (you + 1) % room.players.length;
          const move = E.chooseMove(room.game.hands[you],{ table:room.game.table, requiredCard:room.game.requiredCard,
            settings:room.settings, botLevel:'hard', nextCount:room.game.hands[next].length });
          p.hintCache = { key, message:{ type:'hint', code:room.code, matchId:room.matchId, round:room.round, revision:room.revision,
            actionNo:room.game.actionNo, action:move ? 'play' : 'pass', ids:move?.ids || [], label:move?.evaluation.label || 'Lewat' } };
        }
        send(ws,p.hintCache.message); return;
      }
      if (msg.type === 'undo') {
        if (msg.targetActionNo !== undefined && msg.targetActionNo !== room.undoPoints[you]?.game.actionNo) return fail(ws,'Titik undo berubah. Buka kembali konfirmasi undo.');
        undoTurn(room,you,ws); return;
      }
      if (msg.type === 'next' || msg.type === 'again') {
        if (you !== host) return fail(ws,'Hanya host yang dapat melanjutkan.');
        if (msg.type === 'next' && room.phase === 'result') { beginRound(room); return; }
        if (msg.type === 'again' && room.phase === 'finished') {
          room.round = 0; room.matchId++; room.history = []; room.previousWinner = null;
          room.players.forEach(x => { x.score = 0; });
          room.practice = room.players.some(player => player.bot);
          beginRound(room); return;
        }
        return fail(ws,'Selesaikan ronde ini dahulu.');
      }
    });
    ws.on('close', () => detach(ws,false));
  });
  const maintenance = setInterval(() => {
    for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
    for (const [code, room] of rooms) if (![...room.players,...room.spectators].some(p => p.connected && !p.bot) && Date.now() - room.active > 600000) { clearRoomTimers(room); rooms.delete(code); }
  },30000); maintenance.unref();
  function close() {
    closing = true; clearInterval(maintenance); for (const timer of timers) clearTimeout(timer);
    for (const ws of wss.clients) ws.terminate();
    return new Promise(resolve => wss.close(() => server.close(resolve)));
  }
  return { server,wss,rooms,close };
}
if (require.main === module) {
  const app = createApp(), port = Number(process.env.PORT || 3002), host = process.env.HOST || '0.0.0.0';
  app.server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port ' + port + ' terpakai. Pilih PORT lain.' : error.message); process.exit(1); });
  app.server.listen(port,host,() => {
    console.log('Capsa Banting berjalan: http://localhost:' + port);
    if (host === '0.0.0.0') for (const list of Object.values(os.networkInterfaces())) for (const n of list) if (n.family === 'IPv4' && !n.internal) console.log('Wi-Fi yang sama: http://' + n.address + ':' + port);
    console.log('Ctrl+C untuk berhenti.');
  });
  process.on('SIGTERM', () => app.close().then(() => process.exit(0))); process.on('SIGINT', () => app.close().then(() => process.exit(0)));
}
module.exports = { createApp };
