/* Klien Mahjong P2P */
const CLIENT_VERSION = 6, HAND_HELP = window.MahjongHandHelp;
const { SUITS, WINDS, WIND_ID, DRAG, DRAG_ID, T, idxOf, fromIdx, isSuit, tileName, byIdx, counts, shanten, findWin, acceptance } = Engine;
const $ = id => document.getElementById(id);
const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };

// ---------- Render ubin ----------
function tileHTML(t, cls = '', attrs = '', help = null) {
  if (!t) return `<div class="tile back ${cls}"></div>`;
  const c = t.s === 'g' ? 'g' + t.n : t.s;
  return `<div class="tile ${c} ${cls}" ${attrs} title="${esc(tileName(t) + (help ? ' · ' + help.description : ''))}">${tileFaceSVG(t)}${help ? `<span class="set-badge" aria-hidden="true">${help.badge}</span>` : ''}</div>`;
}
const ts = (...arr) => arr.map(t => tileHTML(t)).join('');
const ht = i => tileHTML(fromIdx(i));
function meldHTML(m) { const t = m.tiles; if (m.type === 'kong' && !m.open) { const a = m.hidden ? t : [t[1], t[2]]; return `<div class="meld">${tileHTML(null)}${tileHTML(a[0])}${tileHTML(a[1])}${tileHTML(null)}</div>`; } return `<div class="meld">${t.map(x => tileHTML(x)).join('')}</div>`; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Koneksi ----------
let ws = null, S = null, lobby = null, myCode = null, myToken = null, screen = 'landing', reconnectTimer = null, pendingRejoin = false, isSpectator = false, chatLog = [];
const UI = { sound: ls.get('mejakita.mahjong.sound', '1') !== '0', bubbles: {}, wasMyTurn: false, prev: null, big: ls.get('mejakita.mahjong.big', '0') === '1', poolMode: ls.get('mejakita.mahjong.pool', 'tile'), autoSort: ls.get('mejakita.mahjong.autosort', '1') !== '0', cheatOpen: ls.get('mejakita.mahjong.cheat', '1') !== '0', sel: null, drag: null, clue: null, order: [], resultShown: null, countdown: null, pick: [], pickKey: null };
function connect() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'; ws = new WebSocket(`${proto}://${location.host}/mahjong/ws`);
  ws.onopen = () => { setConn(true); if (myCode && myToken) { pendingRejoin = true; sendMsg({ type: 'rejoin', code: myCode, token: myToken }); } };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } onMsg(m); };
  ws.onclose = () => { setConn(false); clearTimeout(reconnectTimer); reconnectTimer = setTimeout(connect, 1500); };
  ws.onerror = () => { try { ws.close(); } catch (e) { } };
}
function sendMsg(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify({ ...o, v: CLIENT_VERSION })); else toast('Belum terhubung ke server. Mencoba lagi...'); }
function setConn(on) { const el = $('conn'); if (el) { el.textContent = on ? '' : 'Terputus dari server, menyambung ulang...'; el.style.display = on ? 'none' : 'block'; } }
let toastT; function toast(msg) { const t = $('toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 3500); }

function onMsg(m) {
  if (m.type === 'error') { toast(m.msg); if (m.fatal) { leaveLocal(); } return; }
  if (m.type === 'joined') { mySeat = m.seat; isSpectator = !!m.spectator; myCode = m.code; myToken = m.token; ls.set('mejakita.mahjong.room', m.code); ls.set('mejakita.mahjong.token', m.token); pendingRejoin = false; history.replaceState(null, '', '?room=' + m.code); if (isSpectator) toast('Meja sudah penuh atau sedang berjalan, kamu masuk sebagai penonton.'); return; }
  if (m.type === 'lobby') { if (m.v !== CLIENT_VERSION && !UI.warnedLobby) { UI.warnedLobby = true; alert('Versi halaman dan server berbeda. Muat ulang halaman Mahjong. Jika masih sama, beri tahu host.'); } lobby = m; S = null; isSpectator = !!m.spectator; if (m.chat) { chatLog = m.chat; renderChat(); } show('lobby'); renderLobby(); return; }
  if (m.type === 'chat') { chatLog.push(m.msg); if (chatLog.length > 100) chatLog.shift(); if (m.msg.emoji && m.msg.seat >= 0) { UI.bubbles[m.msg.seat] = { text: m.msg.text, until: Date.now() + 2600 }; if (S) renderGame(); setTimeout(() => { if (S) renderGame(); }, 2700); } renderChat(); return; }
  if (m.type === 'chat_history') { chatLog = m.chat || []; renderChat(); return; }
  if (m.type === 'state') {
    UI.stale = m.v !== CLIENT_VERSION;
    const prev = S; S = m; isSpectator = !!S.spectator;
    if (screen !== 'game') show('game');
    reconcileOrder();
    if (!prev || prev.hand !== S.hand || prev.current !== S.current || prev.phase !== S.phase || (prev.last && S.last && prev.last.tile.id !== S.last.tile.id)) UI.clue = null;
    UI.prev = prev; renderGame(); renderHistory(); notifyTurn(); flashFromLog(prev); handleResult(); return;
  }
  if (m.type === 'left') { leaveLocal(); return; }
}
function leaveLocal() { stopBlink(); chatLog = []; isSpectator = false; myCode = null; myToken = null; S = null; lobby = null; ls.del('mejakita.mahjong.room'); ls.del('mejakita.mahjong.token'); history.replaceState(null, '', location.pathname); $('overlay').style.display = 'none'; show('landing'); }
function show(name) { screen = name; for (const s of ['landing', 'lobby', 'game']) $(s).style.display = s === name ? '' : 'none'; const box = $('chatbox'); const slot = name === 'game' ? $('chatslot') : name === 'lobby' ? $('lobbychat') : null; if (box && slot && box.parentNode !== slot) slot.appendChild(box); if (name !== 'game') stopBlink(); }

// ---------- Landing ----------
function doCreate() { const name = $('name').value.trim(); if (!name) return toast('Isi nama dulu.'); ls.set('mejakita.mahjong.name', name); sendMsg({ type: 'create', name }); }
function doJoin() { const name = $('name').value.trim(); const code = $('joincode').value.trim().toUpperCase(); if (!name) return toast('Isi nama dulu.'); if (code.length < 4) return toast('Masukkan kode ruangan 4 huruf.'); ls.set('mejakita.mahjong.name', name); sendMsg({ type: 'join', name, code }); }
function doLeave() { sendMsg({ type: 'leave' }); leaveLocal(); }

// ---------- Ruang tunggu ----------
function renderLobby() {
  if (!lobby) return; buildGuide(); const isHost = lobby.hostSeat === mySeatLobby();
  $('bigcode').textContent = lobby.code;
  const link = `${location.origin}${location.pathname}?room=${lobby.code}`; $('invite').textContent = link;
  $('seats').innerHTML = [0, 1, 2, 3].map(i => { const p = lobby.players[i]; if (!p) return `<div class="seat empty"><span>Kursi ${i + 1}: kosong, akan diisi bot</span></div>`; const canGive = isHost && !isSpectator && p.seat !== mySeatLobby() && !p.bot && p.connected; return `<div class="seat"><span class="who"><span class="dot ${p.connected ? '' : 'off'}"></span>${esc(p.name)}${p.seat === lobby.hostSeat ? ' <span class="tag">Host</span>' : ''}${p.seat === mySeatLobby() ? ' (kamu)' : ''}${canGive ? `<button class="hostbtn" onclick="makeHost(${p.seat},'${esc(p.name).replace(/'/g, '')}')">Jadikan host</button>` : ''}</span><span class="cap">${WIND_ID[i]}</span></div>`; }).join('');
  $('rounds').value = String(lobby.settings.rounds); $('rounds').disabled = !isHost || isSpectator; $('botlevel').value = lobby.settings.botLevel || 'normal'; $('botlevel').disabled = !isHost || isSpectator;
  $('fastplay').checked = lobby.settings.autoPass === true; $('fastplay').disabled = !isHost || isSpectator;
  $('fastplay-copy').textContent = lobby.settings.autoPass ? 'Aktif: tanpa pilihan Hu/Pung/Kong/Chow yang sah, lewat otomatis. Pemain yang punya pilihan tetap menjawab sendiri.' : 'Nonaktif: setiap pemain manusia menekan Klaim atau Lewat sendiri, termasuk ketika tidak punya klaim sah.';
  $('handhighlight').checked = lobby.settings.highlightSets !== false; $('handhighlight').disabled = !isHost || isSpectator;
  $('handhighlight-copy').textContent = lobby.settings.highlightSets !== false ? 'Aktif: tandai Chow/Pung yang sudah lengkap di tangan sendiri, serta ubin yang bisa menjadi keduanya.' : 'Nonaktif: ubin di tangan tampil tanpa warna dan label bantuan set.';
  $('mahjong-point-value').value=lobby.settings.pointValue || 0;$('mahjong-point-value').disabled=!isHost||isSpectator;renderMahjongSidebar();
  $('spect').innerHTML = lobby.spectators && lobby.spectators.length ? `Penonton: ${lobby.spectators.map(esc).join(', ')}` : '';
  $('startbtn').style.display = isHost && !isSpectator ? '' : 'none'; $('waitmsg').style.display = isHost && !isSpectator ? 'none' : '';
  $('waitmsg').textContent = isSpectator ? 'Kamu menonton. Menunggu host memulai permainan...' : `Menunggu ${esc(lobby.players.find(p => p.seat === lobby.hostSeat)?.name || 'host')} memulai permainan...`;
}
let mySeat = -1; function mySeatLobby() { return mySeat; }
// Mock meja untuk panduan di ruang tunggu.
function guideMockHTML() {
  const C = n => `<span class="callout" style="top:-8px;left:-8px">${n}</span>`;
  const hand = [T('d', 2), T('d', 3), T('d', 4), T('b', 4), T('b', 5), T('b', 5), T('b', 5), T('b', 6), T('c', 8), T('c', 8), T('c', 8), T('w', 2), T('g', 1)].map((t, i) => ({ ...t, id: 900 + i }));
  const drawn = { ...T('w', 4), id: 950 };
  const highlight = lobby?.settings.highlightSets !== false;
  const marks = highlight ? HAND_HELP.analyze([...hand, drawn]) : new Map();
  const markedTile = (t, cls = '') => { const help = marks.get(t.id); return tileHTML(t, cls + (help ? ' ' + help.className : ''), '', help); };
  const pills = ['Kamu', 'Mei', 'Raka', 'Sinta'].map((n, i) => `<div class="pill ${i === 0 ? 'turn' : ''}"><span>${n}</span><span class="w">${WIND_ID[i]}</span><b>0</b></div>`).join('');
  const opp = (n, w, melds) => `<div class="opp"><div class="nm"><span>${n} <span class="cap" style="color:rgba(255,255,255,.6)">bot</span></span><span>${w}</span></div><div class="cnt">${tileHTML(null)}<span>× 13</span></div><div class="melds">${melds}</div></div>`;
  const vis = {}; [[0, 1], [1, 2], [9, 1], [17, 3], [27, 2], [31, 4], [4, 1]].forEach(([i, v]) => vis[i] = v);
  const row = idxs => `<div class="cnt-row">${idxs.map(i => `<div class="cnt ${vis[i] ? '' : 'zero'} ${vis[i] >= 4 ? 'gone' : ''}">${tileHTML(fromIdx(i), i === 1 ? 'last' : '')}${vis[i] ? `<span class="badge ${vis[i] >= 4 ? 'full' : ''}">${vis[i]}</span>` : ''}</div>`).join('')}</div>`;
  const r = k => Array.from({ length: 9 }, (_, j) => k * 9 + j);
  return `<div class="table mock">
  <div class="anch">${C(1)}<div class="scores">${pills}</div></div>
  <div class="anch">${C(2)}<div class="opps">${opp('Sinta', 'Utara', '')}${opp('Raka', 'Barat', '')}${opp('Mei', 'Selatan', `<div class="meld">${ts(T('c', 7), T('c', 8), T('c', 9))}</div>`)}</div></div>
  <div class="anch">${C(3)}<div class="pool"><div class="cnt-grid">${row(r(0))}${row(r(1))}${row(r(2))}${row([27, 28, 29, 30, 31, 32, 33])}</div></div></div>
  <div class="anch">${C(4)}<div class="turnbar mine"><span>GILIRANMU</span></div></div>
  <div class="anch">${C(5)}<div class="claimbox"><div class="hd"><span>Contoh kotak klaim · muncul setelah lawan membuang ubin</span></div><div class="zone">${tileHTML(T('d', 8), 'last')}<span style="opacity:.6">+</span>${ts(T('d', 7), T('d', 9))}<span class="lbl">Chow 7-8-9 Lingkaran</span></div><div class="btns"><button class="act">Klaim</button><button class="act pass">Lewat</button></div></div></div>
  <div class="anch">${C(6)}<div class="hand-example-note">Contoh tangan · ${highlight ? 'warna untuk set yang sudah lengkap, tanpa buangan lawan' : 'highlight set nonaktif'}</div><div class="hand myturn">${hand.map(t => markedTile(t)).join('')}${markedTile(drawn, 'drawn')}</div>${highlight ? HAND_HELP.legend() : ''}</div>
  <div class="anch">${C(7)}<div class="tools"><button class="tool on">Urutkan otomatis</button><button class="tool">Atur manual</button><button class="tool">Petunjuk</button></div></div>
 </div>`;
}
const GUIDE_LEGEND = [
  ['Skor dan giliran', 'Pil yang bergaris emas adalah pemain yang sedang jalan. Angin di sebelah nama menentukan siapa dealer (Timur) dan bonus angin sendiri.'],
  ['Lawan', 'Jumlah ubin di tangan mereka dan set yang sudah mereka buka. Posisi duduk diacak tiap ronde, jadi pemain di sebelah kirimu (sumber Chow) berganti-ganti.'],
  ['Papan hitung', 'Berapa lembar tiap ubin sudah terlihat di meja (buangan + set terbuka). Garis emas = buangan terakhir. Dari sini kamu bisa menghitung ubin yang masih tersisa.'],
  ['Bar GILIRANMU', 'Muncul saat giliranmu. Kamu otomatis mengambil 1 ubin, lalu harus membuang 1. Tidak ada batas waktu, jadi pikirkan dengan tenang.'],
  ['Kotak klaim', 'Fast mode aktif: tanpa pilihan klaim, lewat otomatis. Nonaktif: semua pemain manusia menjawab Klaim atau Lewat sendiri. Host memilih di lobby; mode dikunci saat permainan mulai. Untuk Pung/Chow pilih 2 ubin, untuk Kong pilih 3.'],
  ['Tanganmu', 'Jika Highlight set aktif: toska C = Chow lengkap di tangan, emas P = Pung/Kong lengkap, ungu C/P = bisa keduanya. Tidak memakai buangan lawan. Satu ubin bisa masuk beberapa set alternatif. Ubin ambilan baru agak terpisah di kanan.'],
  ['Alat bantu', 'Urutkan otomatis atau atur sendiri susunan ubin. Petunjuk menyarankan buangan paling efisien dan memperingatkan ubin berbahaya. Contekan aturan ada di panel kanan.'],
];
let guideHighlight = null;
function buildGuide() { const highlight = lobby?.settings.highlightSets !== false; if (guideHighlight === highlight) return; guideHighlight = highlight; $('guide').innerHTML = guideMockHTML(); $('guidelegend').innerHTML = GUIDE_LEGEND.map((g, i) => `<div><span class="tag">${i + 1}</span><div><b>${g[0]}.</b> ${g[1]}</div></div>`).join(''); }
function lobbySettings() { return { rounds: +$('rounds').value, botLevel: $('botlevel').value, pointValue:Number($('mahjong-point-value').value),autoPass: $('fastplay').checked, highlightSets: $('handhighlight').checked, turnSeconds: 0, claimSeconds: 0 }; }
function updateLobbySettings() { if (lobby && !isSpectator && lobby.hostSeat === mySeatLobby()) sendMsg({ type: 'settings', settings: lobbySettings() }); }
function doStart() { sendMsg({ type: 'start', settings: lobbySettings() }); }
function makeHost(seat, name) { if (confirm(`Jadikan ${name} sebagai host? Kamu tidak lagi bisa memulai ronde.`)) sendMsg({ type: 'host', seat }); }
function undoDiscard() { sendMsg({ type: 'action', action: 'undo' }); }
function copyInvite() { const t = $('invite').textContent; if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Link undangan disalin.'), () => toast(t)); else toast(t); }

// ---------- Meja ----------
const view = () => (S.spectator ? 0 : S.you);
const me = () => S.players[view()];
const myHand = () => me().hand || [];
const rel = k => (view() + k) % 4; // 1 = kanan (jalan setelah kamu), 2 = atas, 3 = kiri (jalan sebelum kamu)
function hasSetClaimOption(options) { return !!(options && (options.pung || options.kong || (options.chows && options.chows.length))); }
function hasClaimOption(options) { return !!(options && (options.win || hasSetClaimOption(options))); }
function canDiscard() { return S && !S.spectator && !S.over && !S.options && S.current === S.you && S.phase === 'discard'; }
function reconcileOrder() { const ids = myHand().map(t => t.id); UI.order = UI.order.filter(id => ids.includes(id)); for (const id of ids) if (!UI.order.includes(id)) UI.order.push(id); if (UI.sel !== null && !ids.includes(UI.sel)) UI.sel = null; }
function displayOrder() { const h = myHand(); const d = me().drawn; if (UI.autoSort) return h.filter(t => t.id !== d).sort(byIdx).concat(h.filter(t => t.id === d)); return UI.order.map(id => h.find(t => t.id === id)); }
function tapTile(id) {
  if (!S || S.over || S.spectator) return; const t = myHand().find(x => x.id === id); if (!t) return;
  if (hasSetClaimOption(S.options)) return togglePick(id);
  if (UI.autoSort) { if (canDiscard()) sendMsg({ type: 'action', action: 'discard', id }); return; }
  if (UI.sel === null) UI.sel = id; else if (UI.sel === id) UI.sel = null; else { moveTile(UI.sel, id); UI.sel = null; }
  renderGame();
}
function moveTile(a, b) { const fi = UI.order.indexOf(a), ti = UI.order.indexOf(b); if (fi < 0 || ti < 0 || fi === ti) return; UI.order.splice(fi, 1); UI.order.splice(ti, 0, a); }
function dragStart(e, id) { UI.drag = id; try { e.dataTransfer.setData('text/plain', String(id)); } catch (err) { } }
function dropOn(e, id) { e.preventDefault(); if (UI.drag === null) return; if (hasSetClaimOption(S.options)) { if (!UI.pick.includes(UI.drag) && UI.pick.length < 3) UI.pick.push(UI.drag); UI.drag = null; renderGame(); return; } if (!UI.autoSort) moveTile(UI.drag, id); UI.drag = null; UI.sel = null; renderGame(); }
function discardSel() { if (!canDiscard() || UI.sel === null) return; sendMsg({ type: 'action', action: 'discard', id: UI.sel }); }
function setSound(on) { UI.sound = on; ls.set('mejakita.mahjong.sound', on ? '1' : '0'); if (on) beep(); renderGame(); }
function setAutoSort(on) { if (!on && UI.autoSort) UI.order = displayOrder().map(t => t.id); UI.autoSort = on; UI.sel = null; ls.set('mejakita.mahjong.autosort', on ? '1' : '0'); renderGame(); }
function sortOnce() { const d = me().drawn; UI.order = myHand().filter(t => t.id !== d).sort(byIdx).concat(myHand().filter(t => t.id === d)).map(t => t.id); UI.sel = null; renderGame(); }
function act(a) { sendMsg({ type: 'action', ...a }); }
function claim(c) { if (c === 'set') sendMsg({ type: 'action', action: 'claim', claim: 'set', tiles: UI.pick.slice() }); else sendMsg({ type: 'action', action: 'claim', claim: c }); UI.pick = []; }
// Pilihan ubin untuk membentuk set dengan buangan.
function togglePick(id) { const i = UI.pick.indexOf(id); if (i >= 0) UI.pick.splice(i, 1); else if (UI.pick.length < 3) UI.pick.push(id); renderGame(); }
function dropPick(e) { e.preventDefault(); if (UI.drag !== null && !UI.pick.includes(UI.drag) && UI.pick.length < 3) UI.pick.push(UI.drag); UI.drag = null; renderGame(); }
function pickSet() {
  if (!hasSetClaimOption(S.options) || !S.last) return null; const t = S.last.tile; const ti = idxOf(t); const tiles = UI.pick.map(id => myHand().find(h => h.id === id)).filter(Boolean); const idx = tiles.map(idxOf);
  if (tiles.length === 3) return idx.every(i => i === ti) ? { ok: true, label: 'Kong ' + tileName(t) } : { ok: false, label: 'Kong butuh 3 ubin yang sama' };
  if (tiles.length !== 2) return { ok: false, label: tiles.length === 0 ? 'Pilih 2 ubin (Pung/Chow) atau 3 ubin (Kong)' : 'Pilih 1 ubin lagi' };
  if (idx.every(i => i === ti)) return { ok: true, label: 'Pung ' + tileName(t) };
  if (!isSuit(ti)) return { ok: false, label: 'Ubin huruf hanya bisa Pung/Kong' };
  if (S.last.from !== rel(3)) return { ok: false, label: 'Chow hanya dari pemain di kirimu' };
  const all = [...idx, ti].sort((a, b) => a - b); const same = all.every(i => Math.floor(i / 9) === Math.floor(ti / 9));
  if (same && all[1] === all[0] + 1 && all[2] === all[1] + 1) return { ok: true, label: 'Chow ' + all.map(i => fromIdx(i).n).join('-') + ' ' + SUITS[t.s].name };
  return { ok: false, label: 'Bukan Pung, Kong, atau Chow' };
}
function toggleCheat(el) { UI.cheatOpen = el.open; ls.set('mejakita.mahjong.cheat', el.open ? '1' : '0'); }
function setPool(m) { UI.poolMode = m; ls.set('mejakita.mahjong.pool', m); renderGame(); }
function setBig(on) { UI.big = on; ls.set('mejakita.mahjong.big', on ? '1' : '0'); document.body.classList.toggle('big', on); renderGame(); }
// Papan hitung: berapa lembar tiap jenis ubin yang sudah terlihat di meja (buangan + set terbuka).
function poolCountsHTML() {
  const vis = new Array(34).fill(0), mine = new Array(34).fill(0);
  for (const P of S.players) { for (const t of P.discards) vis[idxOf(t)]++; for (const m of P.melds) { if (m.hidden) continue; for (const t of m.tiles) vis[idxOf(t)]++; } }
  for (const t of myHand()) mine[idxOf(t)]++;
  const lastI = S.last ? idxOf(S.last.tile) : -1;
  const row = idxs => `<div class="cnt-row">${idxs.map(i => { const v = vis[i], gone = v + mine[i] >= 4; return `<div class="cnt ${v === 0 ? 'zero' : ''} ${gone ? 'gone' : ''}" title="${tileName(fromIdx(i))}: ${v} terlihat di meja${mine[i] ? ', ' + mine[i] + ' di tanganmu' : ''}">${tileHTML(fromIdx(i), i === lastI ? 'last' : '')}${v ? `<span class="badge ${v >= 4 ? 'full' : ''}">${v}</span>` : ''}${mine[i] ? `<span class="mine">${'<i></i>'.repeat(mine[i])}</span>` : ''}</div>`; }).join('')}</div>`;
  const r = k => Array.from({ length: 9 }, (_, j) => k * 9 + j);
  return `<div class="cnt-grid">${row(r(0))}${row(r(1))}${row(r(2))}${row([27, 28, 29, 30, 31, 32, 33])}</div>`;
}

function renderGame() {
  if (!S) return; const app = $('app'); const M = me(); const left = S.players[rel(3)]; const spec = !!S.spectator; const prev = UI.prev;
  const now = Date.now(); const bubble = i => { const b = UI.bubbles[i]; return b && b.until > now ? `<span class="bubble">${esc(b.text)}</span>` : ''; };
  const pills = S.players.map((P, i) => `<div class="pill ${S.current === i && !S.over ? 'turn' : ''}">${P.bot ? '' : `<span class="st ${P.connected ? '' : 'off'}"></span>`}<span>${esc(P.name)}${!spec && i === S.you ? ' (kamu)' : ''}</span><span class="w">${WIND_ID[P.wind]}</span><b>${P.score}</b></div>`).join('');
  const newMeld = i => prev && prev.players[i] && prev.hand === S.hand && S.players[i].melds.length > prev.players[i].melds.length;
  const meldsHTML = i => S.players[i].melds.map((m, k, arr) => (k === arr.length - 1 && newMeld(i)) ? meldHTML(m).replace('class="meld"', 'class="meld anim-new"') : meldHTML(m)).join('');
  const iAmHost = !spec && S.hostSeat === S.you;
  const opp = i => { const P = S.players[i]; const reveal = S.over && P.hand; const canGive = iAmHost && !P.bot && P.connected; return `<div class="opp ${S.current === i && !S.over ? 'turn' : ''}">${bubble(i)}<div class="nm"><span>${esc(P.name)}${P.bot ? ' <span class="cap" style="color:rgba(255,255,255,.6)">bot</span>' : ''}${!P.bot && !P.connected ? ' <span class="off">offline</span>' : ''}${S.hostSeat === i ? ' <span class="cap" style="color:var(--gold)">host</span>' : ''}${canGive ? `<button class="hostbtn" onclick="makeHost(${i},'${esc(P.name).replace(/'/g, '')}')">Jadikan host</button>` : ''}</span><span>${WIND_ID[P.wind]}</span></div><div class="cnt">${reveal ? P.hand.slice().sort(byIdx).map(t => tileHTML(t)).join('') : tileHTML(null) + `<span>× ${P.handCount}</span>`}</div><div class="melds">${meldsHTML(i)}</div></div>`; };
  const lastNew = S.last && (!prev || !prev.last || prev.last.tile.id !== S.last.tile.id || prev.hand !== S.hand);
  const prow = i => { const P = S.players[i]; return `<div class="prow"><div class="lbl">${esc(P.name)}</div><div class="tiles">${P.discards.map(t => tileHTML(t, S.last && S.last.tile.id === t.id ? 'last' + (lastNew ? ' anim-pop' : '') : '')).join('')}</div></div>`; };
  let actions = '', hint = '', claimbox = '';
  const pkey = S.claimOpen && S.last ? S.last.tile.id + ':' + S.last.from : null; if (pkey !== UI.pickKey) { UI.pick = []; UI.pickKey = pkey; }
  if (!S.over && !spec) {
    if (S.options) {
      const o = S.options, t = S.last.tile, canSet = hasSetClaimOption(o), ps = canSet ? pickSet() : null;
      const zoneTiles = UI.pick.map(id => myHand().find(h => h.id === id)).filter(Boolean).map(x => tileHTML(x, 'click', `onclick="togglePick(${x.id})"`)).join('') + '<div class="slot"></div>'.repeat(Math.max(0, 2 - UI.pick.length));
      const zone = canSet ? `<div class="zone">${tileHTML(t, 'last')}<span style="opacity:.6">+</span>${zoneTiles}<span class="lbl">${ps ? esc(ps.label) : ''}</span></div>` : '';
      claimbox = `<div class="claimbox" ${canSet ? 'ondragover="event.preventDefault()" ondrop="dropPick(event)"' : ''}><div class="hd"><span>${esc(S.players[S.last.from].name)} membuang ${tileName(t)}. ${hasClaimOption(o) ? 'Mau diambil?' : 'Belum ada klaim yang sah.'}</span></div>${zone}${!hasClaimOption(o) ? '<p class="manual-pass-copy">Mode manual: tekan Lewat untuk melanjutkan. Pemain lain juga perlu menjawab sendiri.</p>' : ''}
       <div class="btns">${o.win ? `<button class="act win" onclick="claim('win')">Hu! Menang</button>` : ''}${canSet ? `<button class="act" onclick="claim('set')" ${ps && ps.ok ? '' : 'disabled'}>Klaim</button>` : ''}<button class="act pass" onclick="claim('pass')">Lewat</button></div></div>`;
      hint = canSet ? 'Ketuk atau seret ubin ke kotak, lalu tekan Klaim.' : o.win ? 'Kamu bisa menekan Hu! Menang atau Lewat.' : 'Fast mode nonaktif. Tidak ada set yang dapat diklaim; tekan Lewat sendiri.';
    } else if (S.claimOpen) {
      const waiting = (S.claimWaiting || []).map(i => esc(S.players[i].name)).join(', ');
      hint = (S.autoPassed ? 'Tidak ada klaim yang sah untukmu; sudah lewat otomatis. ' : '') + (waiting ? 'Menunggu ' + waiting + ' menekan Klaim atau Lewat...' : 'Menunggu keputusan pemain lain...');
    }
    if (S.undoUntil && S.undoUntil > Date.now() && S.last && S.last.from === S.you) {
      const left = Math.max(0, (S.undoUntil - Date.now()) / 1000);
      actions += `<button class="act undo" onclick="undoDiscard()">Batalkan buangan ${tileHTML(S.last.tile)} <span class="cd" id="undocd">${left.toFixed(1)}s</span></button>`;
      clearTimeout(UI.undoT); UI.undoT = setTimeout(() => renderGame(), (S.undoUntil - Date.now()) + 50);
      clearInterval(UI.undoI); UI.undoI = setInterval(() => { const el = $('undocd'); if (!el) return clearInterval(UI.undoI); el.textContent = Math.max(0, (S.undoUntil - Date.now()) / 1000).toFixed(1) + 's'; }, 100);
      if (!S.options) hint = 'Salah buang? Kamu punya 2 detik untuk membatalkan.';
    } else if (canDiscard()) {
      if (M.drawn !== null && findWin(M.hand, M.melds)) actions += `<button class="act win" onclick="act({action:'win'})">Hu! Menang (Zimo)</button>`;
      const c = counts(M.hand);
      for (let i = 0; i < 34; i++) if (c[i] === 4) actions += `<button class="act" onclick="act({action:'kong',kind:'conc',arg:${i}})">Kong tertutup ${ht(i)}</button>`;
      M.melds.forEach((m, k) => { if (m.type === 'pung' && c[idxOf(m.tiles[0])] === 1) actions += `<button class="act" onclick="act({action:'kong',kind:'add',arg:${k}})">Kong tambah ${tileHTML(m.tiles[0])}</button>`; });
      hint = UI.autoSort ? 'Klik satu ubin untuk membuang.' : (UI.sel === null ? 'Ketuk ubin untuk memilih, lalu tekan Buang. Ketuk ubin lain untuk memindahkannya.' : 'Tekan Buang, atau ketuk ubin lain untuk memindahkan ubin terpilih.');
    }
  }
  let turnbar = '';
  if (!S.over && !S.claimOpen) {
    const mine = !spec && S.current === S.you && S.phase === 'discard'; const who = mine ? 'GILIRANMU' : `Giliran ${esc(S.players[S.current].name)}`;
    turnbar = `<div class="turnbar ${mine ? 'mine' : ''}" id="turnbar"><span>${who}</span><span class="t">${mine ? 'Ambil keputusan dengan tenang' : ''}</span></div>`;
  } else if (!S.over && S.claimOpen && spec) turnbar = `<div class="turnbar"><span>Kotak klaim terbuka untuk ${esc(S.players[S.last.from].name)} punya buangan</span></div>`;
  const cd = canDiscard(); const order = displayOrder(); const picking = hasSetClaimOption(S.options); const interactive = !S.over && !spec && (picking || (UI.autoSort ? cd : true)); const cl = UI.clue || {};
  const helpMarks = spec || !S.highlightSets ? new Map() : HAND_HELP.analyze(M.hand);
  const drawnNew = M.drawn !== null && (!prev || prev.players[view()].drawn !== M.drawn);
  const th = (t, k) => { const help = helpMarks.get(t.id); const sep = t.id === M.drawn && k === order.length - 1; const mark = (cl.good || []).includes(t.id) ? 'ok ' : (cl.alt || []).includes(t.id) ? 'alt ' : ''; const cls = (interactive ? 'click ' : '') + (sep ? 'drawn ' : '') + (sep && drawnNew ? 'anim-draw ' : '') + mark + (UI.sel === t.id ? 'sel ' : '') + (picking && UI.pick.includes(t.id) ? 'pick ' : '') + (help ? help.className : ''); const dnd = (UI.autoSort && !picking) ? '' : `draggable="true" ondragstart="dragStart(event,${t.id})" ondragover="event.preventDefault()" ondrop="dropOn(event,${t.id})"`; return tileHTML(t, cls, `onclick="tapTile(${t.id})" ${dnd} ${interactive ? 'aria-label="' + esc(tileName(t) + (help ? ' · ' + help.description : '')) + '" tabindex="0" role="button" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();tapTile(' + t.id + ')}"' : ''}`, help); };
  if (!UI.autoSort && cd && UI.sel !== null) { const st = M.hand.find(x => x.id === UI.sel); if (st) actions += `<button class="act" onclick="discardSel()">Buang ${tileHTML(st)}</button>`; }
  const soundBtn = `<button class="tool ${UI.sound ? 'on' : ''}" onclick="setSound(${UI.sound ? 'false' : 'true'})" title="Bunyi saat giliranmu">${UI.sound ? '🔔 Suara' : '🔕 Suara'}</button>`;
  const tools = spec
    ? `<div class="tools"><button class="tool ${UI.big ? 'on' : ''}" onclick="setBig(${UI.big ? 'false' : 'true'})">${UI.big ? 'Ubin besar: aktif' : 'Ubin besar'}</button></div>`
    : `<div class="tools"><button class="tool ${UI.autoSort ? 'on' : ''}" onclick="setAutoSort(true)">Urutkan otomatis</button><button class="tool ${UI.autoSort ? '' : 'on'}" onclick="setAutoSort(false)">Atur manual</button>${UI.autoSort ? '' : '<button class="tool" onclick="sortOnce()">Urutkan sekali</button>'}${!S.over ? `<button class="tool ${UI.clue ? 'on' : ''}" onclick="toggleClue()">${UI.clue ? 'Tutup petunjuk' : 'Petunjuk'}</button>` : ''}<button class="tool ${UI.big ? 'on' : ''}" onclick="setBig(${UI.big ? 'false' : 'true'})">${UI.big ? 'Ubin besar: aktif' : 'Ubin besar'}</button>${soundBtn}</div>${UI.clue ? `<div class="clue">${UI.clue.html}</div>` : ''}`;
  const meArea = spec
    ? `<div class="me"><div class="specbar">Kamu menonton. Tangan pemain disembunyikan sampai ronde selesai.${S.spectators.length ? ' Penonton: ' + S.spectators.map(esc).join(', ') : ''}</div>${tools}</div>`
    : `<div class="me">${bubble(S.you)}<div class="melds">${meldsHTML(S.you)}</div><div class="hand ${cd ? 'myturn' : ''}">${order.map(th).join('')}</div>${S.highlightSets ? HAND_HELP.legend() : ''}${tools}</div>`;
  app.innerHTML = `
 ${UI.stale ? '<div class="turnbar mine low" style="animation:none">Versi halaman dan server berbeda. Muat ulang halaman Mahjong; hubungi host jika masih muncul.</div>' : ''}
 <div class="scores">${pills}${S.spectators && S.spectators.length ? `<div class="pill"><span class="w">👁 ${S.spectators.length} penonton</span></div>` : ''}</div>
 <div class="table">
  <div class="opps">${opp(rel(3))}${opp(rel(2))}${opp(rel(1))}</div>
  <div class="pool"><div class="ph"><span>${UI.poolMode === 'tile' ? 'Ubin yang sudah terlihat di meja (angka = jumlah lembar, titik emas = di tanganmu)' : 'Buangan per pemain'}</span><span class="sw"><button class="tool ${UI.poolMode === 'tile' ? 'on' : ''}" onclick="setPool('tile')">Per ubin</button><button class="tool ${UI.poolMode === 'player' ? 'on' : ''}" onclick="setPool('player')">Per pemain</button></span></div>
  ${UI.poolMode === 'tile' ? poolCountsHTML() : [view(), rel(1), rel(2), rel(3)].map(prow).join('')}
  ${S.last ? `<div class="lastd"><span style="font-size:12px;opacity:.85">Buangan terakhir:</span>${tileHTML(S.last.tile, 'last' + (lastNew ? ' anim-pop' : ''))}<span style="font-size:12px">${esc(S.players[S.last.from].name)}</span></div>` : ''}</div>
  <div class="status"><span>${esc(S.log)}</span><span>Dinding: ${S.wall}</span></div>
  ${turnbar}${claimbox}
  <div class="actions">${actions}</div>
  <div class="hint">${hint}</div>
  ${meArea}
 </div>`;
  const matchModes = `<div class="match-modes" aria-label="Mode meja terkunci"><div class="mode-badges"><span class="pace-mode">Fast mode: ${S.autoPass ? 'ON' : 'OFF'}</span><span class="pace-mode">Highlight set: ${S.highlightSets ? 'ON' : 'OFF'}</span></div><small>Dipilih di lobby · terkunci</small></div>`;
  $('gtitle').innerHTML = `<div><h1>Mahjong</h1><div class="sub">Ruangan ${S.code} · Ronde ${S.hand} dari ${S.maxHands}, dealer ${esc(S.players[S.dealer].name)}${spec ? ' · mode penonton' : ''}</div></div><div class="game-setting-row">${matchModes}<div style="display:flex;gap:6px"><button class="iconbtn" onclick="openTutorial(false)" title="Panduan" aria-label="Panduan">?</button><button class="iconbtn" onclick="confirmLeave()" title="Keluar" aria-label="Keluar">⎋</button></div></div>`;
  renderMahjongSidebar();
}
// ---------- Riwayat aksi ----------
function renderMahjongSidebar(){const data=S || lobby;if(!data)return;const target=$(S?'mahjong-sidebar':'mahjong-lobby-sidebar');if(!target)return;const active=document.activeElement,focused=active?.id==='mk-chat-input',cursor=active?.selectionStart;const old=target.querySelector('.mk-chat'),atBottom=!old||old.scrollHeight-old.scrollTop-old.clientHeight<30,top=old?.scrollTop||0;
 target.innerHTML=MejaTools.sidebar('mahjong',{chat:chatLog.map(m=>({name:m.from,text:m.text})),log:S?.history || [],players:data.players,rate:data.settings.pointValue || 0,ledger:data.ledger || [],cheat:cheatHTML(S?S.players[rel(3)]:{name:'pemain di sebelah kiri'}),settings:S?data.settings:null,host:S?S.hostSeat===S.you&&!S.spectator:false,lobby:false,formula:'1 fan = 10 poin per pembayar. Zimo: 3 lawan membayar; Hu dari buangan: pembuang membayar 3×.',onChat:text=>{sendMsg({type:'chat',text});return true;}});
 const next=target.querySelector('.mk-chat');if(next)next.scrollTop=atBottom?next.scrollHeight:top;if(focused&&$('mk-chat-input')){$('mk-chat-input').focus({preventScroll:true});if(typeof cursor==='number')$('mk-chat-input').setSelectionRange(cursor,cursor);}
}
function renderHistory(){renderMahjongSidebar();}
// ---------- Chat ----------
function renderChat() {
  const el = $('chatlist'); if (!el) return;
  el.innerHTML = chatLog.map(m => m.from === null ? `<div class="cm sys">${esc(m.text)}</div>` : `<div class="cm ${m.emoji ? 'em' : ''}"><b>${esc(m.from)}</b> ${esc(m.text)}</div>`).join('');
  el.scrollTop = el.scrollHeight;renderMahjongSidebar();
}
function sendChat() { const inp = $('chatinput'); const text = inp.value.trim(); if (!text) return; sendMsg({ type: 'chat', text }); inp.value = ''; inp.focus(); }
function sendEmoji(e) { sendMsg({ type: 'chat', text: e, emoji: true }); }
// ---------- Notifikasi giliran ----------
let audioCtx = null, blinkT = null; const baseTitle = document.title;
function beep() {
  if (!UI.sound) return;
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime; [[880, 0], [1175, .12]].forEach(([f, d]) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + .02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + .25); o.connect(g).connect(audioCtx.destination); o.start(t + d); o.stop(t + d + .3); });
  } catch (e) { }
}
function startBlink(msg) { stopBlink(); let on = false; blinkT = setInterval(() => { on = !on; document.title = on ? msg : baseTitle; }, 900); }
function stopBlink() { if (blinkT) { clearInterval(blinkT); blinkT = null; } document.title = baseTitle; }
function notifyTurn() {
  if (!S || S.spectator) return;
  const mine = canDiscard() || hasClaimOption(S.options);
  if (mine && !UI.wasMyTurn) { beep(); startBlink(hasClaimOption(S.options) ? '🀄 Ada buangan, mau klaim?' : '🀄 Giliranmu!'); }
  if (!mine) stopBlink();
  UI.wasMyTurn = mine;
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && !(S && (canDiscard() || hasClaimOption(S.options)))) stopBlink(); });
// ---------- Kilatan aksi (Pung/Chow/Kong/Hu) ----------
function flashFromLog(prev) {
  if (!S || (prev && prev.log === S.log)) return; const L = S.log;
  let word = null; if (/menang/i.test(L)) word = 'HU!'; else if (/\bKong\b/.test(L)) word = 'KONG!'; else if (/\bPung\b/.test(L)) word = 'PUNG!'; else if (/\bChow\b/.test(L)) word = 'CHOW!';
  if (!word) return; const f = $('flash'); if (!f) return; f.textContent = word; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
function confirmLeave() { if (confirm(isSpectator ? 'Berhenti menonton?' : 'Keluar dari ruangan? Kursimu akan dimainkan bot sampai kamu kembali lewat kode yang sama.')) doLeave(); }

// ---------- Petunjuk ----------
function visibleCounts() { const c = new Array(34).fill(0); for (const P of S.players) { for (const t of P.discards) c[idxOf(t)]++; for (const m of P.melds) { if (m.hidden) continue; for (const t of m.tiles) c[idxOf(t)]++; } } for (const t of myHand()) c[idxOf(t)]++; return c; }
function threats() { return S.players.filter((P, i) => i !== S.you && (P.melds.length >= 2 || (S.wall < 20 && P.melds.length >= 1))); }
const stepTxt = s => s <= 0 ? 'tenpai' : `masih ${s} langkah dari tenpai`; const numTxt = s => s <= 0 ? 'tenpai' : `${s} langkah dari tenpai`;
function toggleClue() { if (UI.clue) { UI.clue = null; renderGame(); return; } UI.clue = computeClue(); renderGame(); }
function computeClue() {
  const M = me(); const vis = visibleCounts(); const th = threats(); const ml = M.melds.length;
  if (hasClaimOption(S.options)) {
    const o = S.options, t = S.last.tile, i = idxOf(t); const c = counts(M.hand); const Sx = shanten(c, ml);
    if (o.win) return { html: `<p><b>Tekan Hu!</b> ${tileName(t)} melengkapi tanganmu.</p>` };
    const opts = [];
    if (o.kong) { c[i] -= 3; opts.push({ label: 'Kong', s: shanten(c, ml + 1) }); c[i] += 3; }
    if (o.pung) { c[i] -= 2; opts.push({ label: 'Pung', s: shanten(c, ml + 1) }); c[i] += 2; }
    o.chows.forEach(cb => { c[cb[0]]--; c[cb[1]]--; opts.push({ label: 'Chow ' + [cb[0], cb[1], i].sort((a, b) => a - b).map(x => fromIdx(x).n).join('-'), s: shanten(c, ml + 1) }); c[cb[0]]++; c[cb[1]]++; });
    opts.sort((a, b) => a.s - b.s); const b = opts[0];
    if (b.s < Sx) { const extra = ml === 0 && Sx >= 3 ? ' Catatan: ini set terbuka pertamamu, bonus tangan tertutup hilang, tapi tanganmu masih jauh jadi percepatan lebih berharga.' : ''; return { html: `<p><b>Saran: ambil ${b.label}.</b> Tanganmu dari ${numTxt(Sx)} jadi ${numTxt(b.s)}.${extra}</p>` }; }
    return { html: `<p><b>Saran: Lewat.</b> Klaim tidak mempercepat tanganmu (tetap ${numTxt(Sx)}), dan set terbuka membuat tangan kaku serta menghilangkan bonus tangan tertutup.</p>` };
  }
  if (!canDiscard()) return { html: '<p>Petunjuk tersedia saat giliranmu membuang atau saat kamu bisa mengambil buangan.</p>' };
  if (M.drawn !== null && findWin(M.hand, M.melds)) return { html: '<p><b>Kamu bisa menang sekarang.</b> Tekan tombol Hu!</p>' };
  const c = counts(M.hand); const cands = []; const seen = new Set();
  for (const t of M.hand) { const i = idxOf(t); if (seen.has(i)) continue; seen.add(i); c[i]--; const s = shanten(c, ml); const acc = acceptance(c, ml, s, vis); c[i]++; const safe = th.filter(B => B.discards.some(x => idxOf(x) === i) || vis[i] >= 4); cands.push({ t, i, s, acc, safeAll: safe.length === th.length, unsafeVs: th.filter(B => !safe.includes(B)) }); }
  cands.sort((a, b) => a.s - b.s || b.acc.n - a.acc.n);
  const best = cands[0]; let html = ''; const good = [best.t.id]; const alt = []; const waits = best.s === 0 ? best.acc.types : null;
  html += `<p><span class="k" style="background:var(--green)"></span><b>Saran: buang ${ht(best.i)} ${tileName(best.t)}.</b> Setelah itu tanganmu ${stepTxt(best.s)}`;
  if (waits) html += `, menunggu ${waits.map(ht).join('')} (${best.acc.n} lembar tersisa di luar).`; else html += `, dengan ${best.acc.n} lembar ubin (${best.acc.types.length} jenis) yang bisa memajukan tangan.`;
  html += '</p>';
  const far = best.s >= 3 && S.wall < 24;
  if (th.length && (!best.safeAll || far)) {
    html += `<p><b>Waspada:</b> ${th.map(B => `${esc(B.name)} (${B.melds.length} set terbuka)`).join(', ')}.`;
    if (!best.safeAll) html += ` ${tileName(best.t)} belum pernah dibuang ${best.unsafeVs.map(B => esc(B.name)).join(' dan ')}, jadi bisa jadi ubin yang mereka tunggu.`;
    if (far) html += ` Tanganmu masih jauh dan dinding tinggal ${S.wall}; utamakan ubin aman daripada menyerang.`;
    const safeC = cands.filter(x => x.safeAll && x.t.id !== best.t.id);
    if (safeC.length) { const a = safeC[0]; alt.push(a.t.id); html += ` <span class="k" style="background:var(--blue)"></span>Pilihan aman: ${ht(a.i)} ${tileName(a.t)} (sudah pernah dibuang mereka atau 4 lembarnya sudah terlihat), tanganmu ${stepTxt(a.s)}.`; }
    else if (!best.safeAll) html += ' Tidak ada ubin di tanganmu yang aman terhadap semua ancaman; buang yang jumlah lembarnya paling banyak sudah terlihat di meja.';
    html += '</p>';
  }
  if (ml === 0 && best.s >= 2) { const honors = M.hand.filter(t => !isSuit(idxOf(t)) && c[idxOf(t)] === 1).length; if (honors >= 2) html += `<p>Kamu masih memegang ${honors} ubin huruf tunggal. Biasanya itu yang dibuang lebih dulu.</p>`; }
  return { html, good, alt };
}

// ---------- Contekan ----------
const chow = (s, n) => ts(T(s, n), T(s, n + 1), T(s, n + 2)); const pung = (s, n) => ts(T(s, n), T(s, n), T(s, n));
const gap = '<span class="gap"></span>', plus = '<span class="plus">+</span>';
function cheatHTML(left) {
  return `<details class="cheat" ${UI.cheatOpen ? 'open' : ''} ontoggle="toggleCheat(this)"><summary>Contekan cepat</summary><div class="cgrid">
<div class="cbox"><h3>Bentuk set</h3>
<div class="crow"><div class="tiles">${ts(T('c', 3), T('c', 3))}</div><span><b>Pasang</b>: 2 identik. Butuh tepat 1 untuk menang.</span></div>
<div class="crow"><div class="tiles">${pung('b', 8)}</div><span><b>Pung</b>: 3 identik, angka atau huruf.</span></div>
<div class="crow"><div class="tiles">${chow('d', 4)}</div><span><b>Chow</b>: 3 berurutan satu jenis. Bukan huruf, bukan 8-9-1.</span></div>
<div class="crow"><div class="tiles">${ts(T('g', 1), T('g', 1), T('g', 1), T('g', 1))}</div><span><b>Kong</b>: 4 identik, dihitung 1 set, dapat 1 ubin pengganti.</span></div>
<div class="crow"><span><b>Menang (Hu)</b>: 4 set + 1 pasang, atau 7 pasang berbeda tanpa klaim.</span></div></div>
<div class="cbox"><h3>Mengambil buangan</h3>
<table class="fan"><tr><td>Hu, Pung, Kong</td><td>dari siapa saja</td></tr><tr><td>Chow</td><td>hanya dari ${esc(left.name)} (kiri)</td></tr><tr><td>Prioritas</td><td>Hu, lalu Pung/Kong, lalu Chow</td></tr><tr><td>Setelah klaim</td><td>set terbuka, giliranmu, buang 1 ubin</td></tr></table>
<h3 style="margin-top:8px">Fan (1 fan = 10 poin per pembayar)</h3>
<table class="fan"><tr><td>Menang dasar</td><td>1</td></tr><tr><td>Zimo / tangan tertutup</td><td>+1 tiap</td></tr><tr><td>Pung naga, angin sendiri, angin Timur</td><td>+1 tiap set</td></tr><tr><td>Semua Pung / campur satu warna</td><td>+2</td></tr><tr><td>Tujuh Pasang</td><td>+3</td></tr><tr><td>Satu warna penuh / semua huruf</td><td>+5</td></tr><tr><td>Zimo: 3 lawan bayar. Dari buangan: pembuang bayar 3x</td><td></td></tr></table></div>
</div></details>`;
}

// ---------- Hasil ----------
function handleResult() {
  const ov = $('overlay');
  if (!S.over || !S.result) { if (UI.resultShown !== null && !tutOpen) { ov.style.display = 'none'; UI.resultShown = null; } return; }
  const key = S.hand + ':' + (S.final ? 'f' : 'r'); if (UI.resultShown === key || tutOpen) return; UI.resultShown = key;
  if (S.final) return showFinal();
  const r = S.result; let body;
  if (r.draw) body = `<h2>Seri</h2><p>Dinding ubin habis tanpa pemenang. Skor tidak berubah.</p>`;
  else {
    const P = S.players[r.winner];
    body = `<h2>${!S.spectator && r.winner === S.you ? 'Kamu menang!' : esc(P.name) + ' menang'}</h2><p class="cap">${r.zimo ? 'Zimo (ubin ke-14 dari ambilan sendiri)' : 'Dari buangan ' + esc(S.players[r.from].name)}</p>
  <table class="fan">${r.fans.map(f => `<tr><td>${f[0]}</td><td>${f[1]} fan</td></tr>`).join('')}<tr><td><b>Total</b></td><td>${r.total} fan = ${r.total * 10} poin per pembayar</td></tr></table>
  <div class="delta">${S.players.map((Q, i) => `<div><span>${esc(Q.name)}</span><span class="${r.delta[i] >= 0 ? 'pos' : 'neg'}">${r.delta[i] >= 0 ? '+' : ''}${r.delta[i]}</span></div>`).join('')}</div>`;
  }
  body += `<div class="cmp"><h3>Perbandingan tangan</h3>${r.compare.map(cp => { const P = S.players[cp.seat]; const isW = cp.status.kind === 'win'; let st; if (isW) st = `Menang, ${cp.status.total} fan`; else if (cp.status.kind === 'tenpai') st = `<div class="wait">Tenpai, menunggu: ${cp.status.waits.map(ht).join('')}</div>`; else st = cp.status.shanten <= 0 ? 'Tenpai' : `Masih ${cp.status.shanten} ubin dari tenpai`; return `<div class="crow2 ${isW ? 'win' : ''}"><div class="hd"><span>${esc(P.name)}${!S.spectator && cp.seat === S.you ? ' (kamu)' : ''}</span><span>${WIND_ID[P.wind]}${!r.draw && r.from === cp.seat && !r.zimo ? ', membuang ubin pemenang' : ''}</span></div><div class="ex">${cp.melds.map(meldHTML).join('')}${cp.hand.map(t => tileHTML(t, isW && r.tile && t.id === r.tile.id ? 'last' : '')).join('')}</div><div>${st}</div></div>`; }).join('')}</div>`;
  const isHost = !S.spectator && S.hostSeat === S.you; const hostName = S.players[S.hostSeat] ? esc(S.players[S.hostSeat].name) : 'host';
  const nav = isHost ? `<button class="btn primary" onclick="sendMsg({type:'next'})">${r.final ? 'Lihat hasil akhir' : 'Ronde berikutnya'}</button>` : `<span class="cap">Menunggu <b>${hostName}</b> (host) ${r.final ? 'membuka hasil akhir' : 'memulai ronde berikutnya'}...</span>`;
  ov.innerHTML = `<div class="modal res">${body}<div class="nav"><span class="cap">Ronde ${r.round} dari ${r.maxHands}.${r.final ? '' : ' Posisi duduk diacak lagi di ronde berikutnya.'}</span>${nav}</div></div>`; ov.style.display = 'flex';
}
function showFinal() {
  const ov = $('overlay'); const r = S.result; const you = r.ranking.findIndex(x => x.seat === S.you) + 1; const isHost = !S.spectator && S.hostSeat === S.you;
  ov.innerHTML = `<div class="modal res"><h2>Hasil akhir</h2><p>${S.spectator ? `Pertandingan ${S.maxHands} ronde selesai.` : `Kamu finis di peringkat ${you} dari 4 setelah ${S.maxHands} ronde.`}</p><div class="delta" style="grid-template-columns:1fr">${r.ranking.map((x, k) => `<div><span>${k + 1}. ${esc(x.name)}${!S.spectator && x.seat === S.you ? ' (kamu)' : ''}</span><b>${x.score}</b></div>`).join('')}</div><div class="nav"><button class="btn ghost" onclick="doLeave()">Keluar ruangan</button>${isHost ? `<button class="btn primary" onclick="sendMsg({type:'again'})">Main lagi</button>` : '<span class="cap">Menunggu host memulai pertandingan baru...</span>'}</div></div>`; ov.style.display = 'flex';
}

// ---------- Panduan ----------
const STEPS = [
  { t: 'Selamat datang di meja mahjong', h: `<p>Mahjong dimainkan 4 orang. Di versi ini kamu bermain melawan teman di room yang sama; kursi yang kosong diisi bot.</p><p><b>Tujuannya:</b> jadi yang pertama menyusun 14 ubin menjadi <b>4 set + 1 pasang</b>. Contoh tangan yang menang:</p><div class="ex">${chow('d', 2)}${plus}${pung('b', 7)}${plus}${chow('c', 4)}${plus}${pung('w', 1)}${plus}${ts(T('g', 1), T('g', 1))}</div><p class="cap">Empat set (berurutan atau identik) ditambah satu pasang di akhir.</p>` },
  { t: 'Ubin angka', h: `<p>Ada 3 jenis ubin angka, masing-masing bernomor 1 sampai 9 dan tersedia 4 lembar tiap nomor.</p><div class="ex">${ts(T('d', 1), T('d', 5), T('d', 9))}<span class="plus">筒 Bulatan</span></div><div class="ex">${ts(T('b', 1), T('b', 5), T('b', 9))}<span class="plus">索 Bambu</span></div><div class="ex">${ts(T('c', 1), T('c', 5), T('c', 9))}<span class="plus">萬 Karakter</span></div><p class="cap">Bulatan digambar lingkaran, Bambu digambar batang (angka 1 digambar burung), Karakter memakai angka Tionghoa di atas 萬. Ubin berurutan hanya bisa dibentuk dari jenis yang sama.</p>` },
  { t: 'Ubin huruf', h: `<p>Ubin huruf tidak punya urutan angka, jadi hanya bisa dipakai sebagai pasang, Pung, atau Kong.</p><div class="ex">${ts(T('w', 1), T('w', 2), T('w', 3), T('w', 4))}<span class="plus">Angin: 東 Timur, 南 Selatan, 西 Barat, 北 Utara</span></div><div class="ex">${ts(T('g', 1), T('g', 2), T('g', 3))}<span class="plus">Naga: 中 Merah, 發 Hijau, Putih (bingkai biru)</span></div><p class="cap">Total 136 ubin: 108 ubin angka, 16 angin, 12 naga. Pung angin sendiri, angin Timur, atau naga memberi bonus skor.</p>` },
  { t: 'Pasang dan Pung', h: `<p><b>Pasang</b> adalah 2 ubin identik. Setiap tangan menang butuh tepat 1 pasang.</p><div class="ex">${ts(T('g', 2), T('g', 2))}${gap}${ts(T('c', 3), T('c', 3))}</div><p><b>Pung</b> adalah 3 ubin identik, boleh ubin angka maupun huruf.</p><div class="ex">${pung('b', 8)}${gap}${pung('w', 3)}</div>` },
  { t: 'Chow dan Kong', h: `<p><b>Chow</b> adalah 3 ubin berurutan dari jenis yang sama, misalnya 4-5-6 Karakter. Angin dan naga tidak bisa di-Chow, dan 8-9-1 tidak sah.</p><div class="ex">${chow('c', 4)}${gap}${chow('d', 1)}</div><p><b>Kong</b> adalah 4 ubin identik. Dihitung sebagai 1 set seperti Pung. Setelah Kong, kamu mengambil 1 ubin pengganti dari ujung dinding.</p><div class="ex">${ts(T('d', 6), T('d', 6), T('d', 6), T('d', 6))}</div>` },
  { t: 'Alur giliran', h: `<p>Setiap pemain mulai dengan 13 ubin. Dealer (Timur) jalan duluan, lalu giliran berputar ke pemain di sebelah kananmu, atas, kiri, lalu kembali ke kamu.</p><p>Di giliranmu: <span class="tag">1</span>ambil 1 ubin dari dinding, <span class="tag">2</span>cek apakah bisa menang atau Kong, <span class="tag">3</span>buang 1 ubin. Saat giliranmu, bar kuning <b>GILIRANMU</b> muncul. Tidak ada batas waktu.</p><p><b>Klik ubin di tanganmu untuk membuangnya.</b> Ubin yang baru diambil ditaruh agak terpisah di paling kanan. Salah pencet? Ada tombol <b>Batalkan buangan</b> selama 2 detik setelah membuang, selama belum ada yang mengklaim.</p><p>Susunan ubin bebas kamu atur karena lawan tidak melihatnya. Pilih <b>Atur manual</b> di bawah tangan untuk menyusun sendiri: ketuk ubin lalu ketuk ubin lain untuk memindahkannya, dan buang lewat tombol <b>Buang</b>.</p>` },
  { t: 'Mengambil buangan lawan', h: `<p>Ubin yang dibuang lawan boleh kamu ambil kalau melengkapi set di tanganmu:</p><table class="fan"><tr><td><b>Hu</b> (menang)</td><td>dari siapa saja</td></tr><tr><td><b>Pung</b> atau <b>Kong</b></td><td>dari siapa saja</td></tr><tr><td><b>Chow</b></td><td>hanya dari pemain di sebelah kirimu</td></tr></table><p>Kalau beberapa pemain mau mengambil ubin yang sama, prioritasnya: <b>Hu, lalu Pung/Kong, lalu Chow</b>.</p><p>Set hasil klaim dibuka di meja dan tidak bisa diubah lagi. Setelah klaim, giliran langsung pindah ke kamu dan kamu harus membuang 1 ubin.</p><p class="cap">Host memilih <b>Fast mode</b> di lobby sebelum permainan dimulai. Saat aktif, kotak klaim hanya muncul jika ada pilihan sah; tanpa pilihan, server otomatis lewat. Saat nonaktif, setiap pemain manusia menekan <b>Klaim</b> atau <b>Lewat</b> sendiri. Mode dikunci selama permainan, termasuk ronde berikutnya dan main lagi; buat ruangan baru untuk mengganti mode. Untuk set, ketuk atau seret 2 ubin (3 untuk Kong) sampai labelnya sah, lalu tekan <b>Klaim</b> atau <b>Lewat</b>. Tombol <b>Hu!</b> muncul kalau buangan itu membuatmu menang.</p>` },
  { t: 'Menang (Hu)', h: `<p>Kamu <b>Hu</b> saat 14 ubinmu membentuk 4 set + 1 pasang. Set yang sudah diklaim ikut dihitung.</p><p><span class="tag">Zimo</span> ubin ke-14 datang dari ambilanmu sendiri. Ketiga lawan membayar.<br><span class="tag">Dari buangan</span> lawan membuang ubin yang kamu butuhkan. Si pembuang membayar 3 kali lipat sendirian.</p><p>Bentuk khusus: <b>Tujuh Pasang</b> (7 pasang berbeda, tanpa klaim) juga dianggap menang.</p><p><b>Latihan:</b> tangan ini tinggal butuh 1 ubin. Ubin mana yang membuatnya menang?</p><div class="ex" style="--tw:28px">${chow('d', 2)}${gap}${chow('b', 5)}${gap}${pung('c', 8)}${gap}${pung('w', 1)}${gap}${ts(T('d', 9))}</div><div class="quiz">${tileHTML(T('d', 9), '', `onclick="quizPick(this,true)"`)}${tileHTML(T('b', 1), '', `onclick="quizPick(this,false)"`)}${tileHTML(T('g', 1), '', `onclick="quizPick(this,false)"`)}</div><p class="cap" id="quizmsg">Klik salah satu ubin di atas.</p>` },
  { t: 'Skor', h: `<p>Setiap kemenangan dihitung dalam <b>fan</b>. 1 fan bernilai 10 poin per pembayar.</p><table class="fan"><tr><td>Menang (Hu)</td><td>1 fan</td></tr><tr><td>Zimo</td><td>+1</td></tr><tr><td>Tangan tertutup (menang tanpa klaim)</td><td>+1</td></tr><tr><td>Pung naga, angin sendiri, atau angin Timur</td><td>+1 tiap set</td></tr><tr><td>Semua Pung (tidak ada Chow)</td><td>+2</td></tr><tr><td>Campur satu warna (1 jenis angka + huruf)</td><td>+2</td></tr><tr><td>Tujuh Pasang</td><td>+3</td></tr><tr><td>Satu warna penuh / semua huruf</td><td>+5</td></tr></table><p class="cap">Zimo: 3 lawan masing-masing membayar. Dari buangan: pembuang membayar 3x sendirian. Total yang diterima pemenang sama besar.</p>` },
  { t: 'Siap main', h: `<p>Beberapa tips: buang dulu ubin huruf yang cuma 1 lembar dan ubin 1 atau 9 yang sendirian. Simpan ubin tengah (3 sampai 7). Jangan terlalu rajin klaim. Perhatikan buangan lawan, terutama yang sudah membuka 2 set.</p><p>Jika host menyalakan <b>Highlight set di tangan</b> di lobby, warna membantu mengenali set yang sudah lengkap dalam tanganmu sendiri: toska <b>C</b> untuk Chow, emas <b>P</b> untuk Pung/Kong, dan ungu <b>C/P</b> kalau ubin bisa menjadi keduanya. Bantuan ini tidak memakai buangan lawan dan tidak menandai calon klaim. Set dapat berbagi ubin yang sama, jadi tidak semua kemungkinan bisa dipakai sekaligus. Pilihan highlight dikunci selama permainan.</p><p>Kalau bingung, tekan <b>Petunjuk</b> di bawah tangan: buangan paling efisien ditandai hijau, pilihan aman ditandai biru.</p><p>Kalau koneksimu putus, buka lagi alamat yang sama di perangkat yang sama dan kamu otomatis kembali ke kursimu. Selama kamu offline, bot memainkan kursimu.</p><p>Selamat bermain!</p>` }
];
let step = 0, tutReview = false, tutOpen = false;
function openTutorial(first) { tutReview = !first; step = 0; tutOpen = true; renderTut(); }
function renderTut() {
  const ov = $('overlay'); const s = STEPS[step]; const lastS = step === STEPS.length - 1;
  ov.innerHTML = `<div class="modal"><div class="cap">Panduan ${step + 1} dari ${STEPS.length}</div><h2>${s.t}</h2>${s.h}<div class="steps">${STEPS.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
 <div class="nav"><button class="btn ghost" onclick="${step === 0 ? 'closeTut()' : 'tutStep(-1)'}">${step === 0 ? (tutReview ? 'Tutup' : 'Lewati panduan') : 'Sebelumnya'}</button><button class="btn ${lastS ? 'primary' : ''}" onclick="${lastS ? 'closeTut()' : 'tutStep(1)'}">${lastS ? 'Tutup' : 'Berikutnya'}</button></div></div>`;
  ov.style.display = 'flex'; ov.scrollTop = 0;
}
function tutStep(d) { step = Math.max(0, Math.min(STEPS.length - 1, step + d)); renderTut(); }
function closeTut() { tutOpen = false; ls.set('mejakita.mahjong.tut', '1'); $('overlay').style.display = 'none'; UI.resultShown = null; if (S) handleResult(); }
function quizPick(el, ok) { document.querySelectorAll('.quiz .tile').forEach(x => x.classList.remove('ok', 'bad')); el.classList.add(ok ? 'ok' : 'bad'); $('quizmsg').textContent = ok ? 'Benar! 9 Bulatan melengkapi pasangan, jadi 4 set + 1 pasang. Hu!' : 'Belum tepat. Keempat set sudah lengkap; yang kurang hanya pasangan untuk 9 Bulatan.'; }

// ---------- Mulai ----------
(function init() {
  $('name').value = ls.get('mejakita.mahjong.name', '');
  const q = new URLSearchParams(location.search); const roomQ = (q.get('room') || '').toUpperCase();
  const savedRoom = ls.get('mejakita.mahjong.room', null), savedTok = ls.get('mejakita.mahjong.token', null);
  if (savedRoom && savedTok && (!roomQ || roomQ === savedRoom)) { myCode = savedRoom; myToken = savedTok; }
  if (roomQ) $('joincode').value = roomQ;
  $('addr').textContent = location.host;
  document.body.classList.toggle('big', UI.big);
  document.addEventListener('pointerdown', () => { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }, { once: true });
  const ci = $('chatinput'); if (ci) ci.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } });
  show('landing'); connect();
  if (ls.get('mejakita.mahjong.tut', '0') !== '1') openTutorial(true);
})();
