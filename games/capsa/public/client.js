'use strict';
const E = CapsaBanting;
const CLIENT_VERSION = '2026-10-15-dissolve-room-1';
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const storage = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k,v) { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} }, remove(k) { try { localStorage.removeItem(k); } catch {} } };
const signed = n => n > 0 ? '+' + n : String(n);
const tone = n => n > 0 ? 'positive' : n < 0 ? 'negative' : '';
const idr = n => 'Rp' + new Intl.NumberFormat('id-ID',{ maximumFractionDigits:0 }).format(n);
const signedMoney = n => (n > 0 ? '+' : n < 0 ? '−' : '') + idr(Math.abs(n));
const modeName = () => S?.settings.mode === 'casual' ? 'Non-official' : 'Official';
const BOT_OPTIONS = [
  { value:'easy', label:'Easy', description:'Sering lewat, suka buang kartu acak, dan kurang menjaga kombinasi.' },
  { value:'normal', label:'Normal', description:'Main lebih santai, sesekali melewatkan peluang atau salah prioritas.' },
  { value:'hard', label:'Hard', description:'Strategi lama: utamakan kombinasi besar dan tahan lawan yang tinggal satu kartu.' }
];
const botOption = () => BOT_OPTIONS.find(option => option.value === S?.settings.botLevel) || BOT_OPTIONS[1];
function botControls(host) {
  const chosen = botOption();
  return '<div class="segments bot-levels" role="group" aria-label="Tingkat bot">' + BOT_OPTIONS.map(option => '<button type="button" data-bot-level="' + option.value + '" class="' + (chosen.value === option.value ? 'active' : '') + '" aria-pressed="' + (chosen.value === option.value) + '"' + (!host ? ' disabled' : '') + '>' + option.label + '</button>').join('') + '</div><p class="bot-level-note">' + chosen.description + '</p>';
}
let ws, S = null, connected = false, replaced = false, session = storage.get('mejakita.capsa.session',null) || window.MejaRoom.saved('capsa'), selected = new Set(), pending = false;
let sortBy = 'rank', toastTimer, lastChatId = '', sound = window.MejaRoom.preferences().sound, audio;
let serverOffset = 0, effectTimer, awaitingSnapshot = true;
let updateCheckRunning = false, updateAvailable = false;
let moneyDraft = null, moneySaveTimer, hintPending = false, undoTarget = null, easyPrompt = null, easyConsentCode = null;
let roomModeDraft = storage.get('mejakita.capsa.roomMode','official');
if (!['official','casual'].includes(roomModeDraft)) roomModeDraft = 'official';
const turnContext = () => ({ matchId:S.matchId, round:S.round, revision:S.revision, actionNo:S.actionNo });
function parsePointValue(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const amount = Number(text);
  return Number.isSafeInteger(amount) && amount <= 1000000 ? amount : null;
}
function moneyInputValue() { return moneyDraft?.code === S.code ? moneyDraft.value : String(S.settings.pointValue); }
function updateMoneyDraftUI() {
  const status = $('money-save-status'), example = $('money-example-value'), input = $('point-value');
  if (!input || !S) return;
  const amount = parsePointValue(input.value);
  input.setAttribute('aria-invalid',String(amount === null));
  if (status) {
    status.textContent = amount === null ? 'Isi rupiah bulat 0–1.000.000.' : amount === S.settings.pointValue ? 'Tersimpan otomatis · ' + idr(amount) + ' / poin' : connected ? 'Menyimpan otomatis…' : 'Menunggu koneksi untuk menyimpan…';
    status.classList.toggle('invalid',amount === null);
  }
  if (example && amount !== null) example.textContent = '5 kartu tersisa = −5 poin = ' + signedMoney(-5 * amount);
}
function queueMoneySave(restart = false) {
  if (restart) { clearTimeout(moneySaveTimer); moneySaveTimer = null; }
  if (moneySaveTimer || !moneyDraft) return;
  moneySaveTimer = setTimeout(() => {
    moneySaveTimer = null;
    if (!S || S.phase !== 'lobby' || S.you !== S.hostSeat || moneyDraft?.code !== S.code) return;
    const amount = parsePointValue(moneyDraft.value);
    if (amount !== null && amount !== S.settings.pointValue && connected) send({ type:'settings',pointValue:amount });
  },250);
}
function easyControls(host) {
  return '<div class="settings-line easy-setting"><label class="setting-label" for="easy-toggle"><b>Easy Mode · bantuan curang 😅</b><small>Saran langkah + undo 2× per pemain per ronde. Berlaku untuk semua pemain.</small></label><input id="easy-toggle" class="toggle" type="checkbox"' + (S.settings.easyMode ? ' checked' : '') + (!host ? ' disabled' : '') + '></div>';
}
function undoControls() {
  if (!S.settings.easyMode || S.you < 0) return '';
  const available = S.undo?.available && connected && !pending;
  return '<div class="easy-tools"><div><b>Easy Mode aktif · bantuan curang</b><p>Undo mengembalikan seluruh meja ke awal giliran terakhirmu. Maksimal 2× per ronde.</p></div><button class="button secondary tiny" data-action="undo" data-needs-connection data-blocked="' + !available + '"' + (!available ? ' disabled' : '') + '>Undo ↶ · sisa ' + (S.undo?.remaining ?? 2) + '/2</button></div>';
}
function openEasyWarning(enable) {
  easyPrompt = enable ? 'enable' : 'notice';
  $('easy-confirm').textContent = enable ? 'Aktifkan untuk semua pemain' : 'Oke, aku paham';
  $('easy-cancel').hidden = !enable;
  if (!$('easy-dialog').open) $('easy-dialog').showModal();
}
const COMBO_EXAMPLES = [
  { category:7, note:'5 urut, satu simbol', cards:[[8,3],[9,3],[10,3],[11,3],[12,3]], flair:'ROYAL ENERGY', mark:'♛' },
  { category:6, note:'4 angka sama + 1 kartu bebas', cards:[[7,0],[7,1],[7,2],[7,3],[13,0]], flair:'QUAD POWER', mark:'✦' },
  { category:5, note:'Triple + pair', cards:[[6,0],[6,1],[6,2],[9,0],[9,1]], flair:'FULL HOUSE!', mark:'♦' },
  { category:4, note:'5 kartu dengan simbol sama', cards:[[3,2],[5,2],[8,2],[11,2],[14,2]], flair:'ALL IN ONE SUIT', mark:'♥' },
  { category:3, note:'5 angka berurutan', cards:[[4,0],[5,1],[6,2],[7,3],[8,0]], flair:'ON A ROLL', mark:'↗' }
];
let urlRoom = (new URLSearchParams(location.search).get('room') || '').toUpperCase().slice(0,4);
const myTurn = () => !!S && S.phase === 'playing' && S.you >= 0 && S.turn === S.you;
function cardHTML(c, decorative = false, mini = false) {
  const red = c.suit === 0 || c.suit === 2;
  const classes = 'playing-card' + (red ? ' red' : '') + (c.rank > 10 && c.rank < 14 ? ' court' : '') + (!decorative && selected.has(c.id) ? ' selected' : '') + (!decorative && S?.requiredCard === c.id ? ' opening-card' : '');
  const tag = decorative ? 'div' : 'button';
  return '<' + tag + ' class="' + classes + '"' + (decorative ? '' : ' data-card="' + c.id + '" aria-pressed="' + selected.has(c.id) + '"') + ' aria-label="' + E.rankName(c.rank) + ' ' + E.SUITS[c.suit] + '"><span class="card-corner">' + E.rankName(c.rank) + '<small>' + E.SUITS[c.suit] + '</small></span><span class="card-center" aria-hidden="true">' + E.SUITS[c.suit] + '</span>' + (mini ? '' : '<span class="card-corner bottom" aria-hidden="true">' + E.rankName(c.rank) + '<small>' + E.SUITS[c.suit] + '</small></span>') + '</' + tag + '>';
}
function renderComboExamples() {
  $('combo-ranking').innerHTML = COMBO_EXAMPLES.map(example => '<li><div class="combo-example-info"><div class="combo-example-heading"><b>' + E.LABELS[example.category] + '</b><button type="button" class="combo-preview" data-combo-preview="' + example.category + '" aria-label="Lihat animasi ' + E.LABELS[example.category] + '" title="Lihat animasi">✧</button></div><small>' + example.note + '</small><div class="combo-example-cards" aria-label="Contoh ' + E.LABELS[example.category] + '">' + example.cards.map(([rank,suit]) => cardHTML(E.card(suit * 13 + rank - 2),true,true)).join('') + '</div></div></li>').join('');
}
function comboEffect(evaluation, name, preview = false) {
  const example = COMBO_EXAMPLES.find(c => c.category === evaluation.category);
  if (!example) return;
  const layer = $('combo-effects'), reduceMotion = window.MejaRoom.preferences().reduced;
  clearTimeout(effectTimer); layer.replaceChildren();
  if (reduceMotion) { toast((preview ? 'Contoh · ' : name + ' · ') + evaluation.label); return; }
  const tier = evaluation.category, particles = [0,0,0,8,12,18,24,36][tier];
  const target = document.querySelector('.bt-table') || $('view'), bounds = target.getBoundingClientRect();
  layer.style.setProperty('--fx-x',Math.max(100,Math.min(innerWidth - 100,bounds.left + bounds.width / 2)) + 'px');
  layer.style.setProperty('--fx-y',Math.max(160,Math.min(innerHeight - 140,bounds.top + bounds.height * .52)) + 'px');
  const stage = document.createElement('div'); stage.className = 'fx-stage fx-tier-' + tier;
  stage.innerHTML = '<div class="fx-aura"></div><div class="fx-rays"></div><div class="fx-ring ring-1"></div><div class="fx-ring ring-2"></div><div class="fx-ring ring-3"></div><div class="fx-streak"></div><div class="fx-particles">' + Array.from({ length:particles }, (_,i) => '<i class="fx-particle particle-' + i + '"></i>').join('') + '</div><div class="fx-banner"><span class="fx-mark">' + example.mark + '</span><span class="fx-kicker">' + (preview ? 'PRATINJAU ANIMASI' : esc(name) + ' MEMBANTING') + '</span><strong class="fx-title">' + evaluation.label.replace(' + 1','') + '</strong><span class="fx-flair">' + example.flair + '</span></div>';
  layer.appendChild(stage);
  effectTimer = setTimeout(() => layer.replaceChildren(), tier === 7 ? 2700 : tier === 6 ? 2350 : 2000);
}
function updateTurnClock() {
  const clock = $('turn-clock');
  if (!clock || S?.phase !== 'playing' || !S.turnDeadline) return;
  const remaining = Math.max(0,S.turnDeadline - (Date.now() + serverOffset));
  const seconds = Math.ceil(remaining / 1000);
  $('turn-seconds').textContent = seconds;
  $('turn-progress').value = remaining;
  clock.classList.toggle('urgent',remaining <= 5000);
  clock.classList.toggle('expired',remaining === 0);
  clock.setAttribute('aria-label', 'Sisa waktu giliran ' + seconds + ' detik');
}
function turnClockHTML() {
  return '<div id="turn-clock" class="turn-clock" role="timer"><div class="turn-clock-number"><strong id="turn-seconds">' + Math.ceil(S.turnLimit / 1000) + '</strong><span>DETIK</span></div><progress id="turn-progress" max="' + S.turnLimit + '" value="' + S.turnLimit + '" aria-label="Sisa waktu giliran"></progress><small>' + (S.table ? '0 detik → lewat otomatis' : '0 detik → kartu terkecil') + '</small></div>';
}
function avatar(p) { return '<span class="avatar' + (p.bot ? ' bot' : '') + '">' + (p.bot ? '♟' : esc(p.name.slice(0,1).toUpperCase())) + '</span>'; }
function renderUpdateNotice() { $('update-notice').hidden = !updateAvailable; }
async function checkForClientUpdate() {
  if (updateCheckRunning) return;
  updateCheckRunning = true;
  try {
    const response = await fetch('/capsa/index.html',{ cache:'no-store' });
    if (!response.ok) return;
    const page = new DOMParser().parseFromString(await response.text(),'text/html');
    const version = page.querySelector('meta[name="capsa-build"]')?.content;
    if (version) { updateAvailable = version !== CLIENT_VERSION; renderUpdateNotice(); }
  } catch {} finally { updateCheckRunning = false; }
}
function connect() {
  awaitingSnapshot = true;
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/capsa/ws');
  ws.onopen = () => { setConnection(true); window.MejaRoom.connected(session,send,target => { urlRoom=target; render(); }); checkForClientUpdate(); };
  ws.onmessage = event => {
    let m; try { m = JSON.parse(event.data); } catch { return; }
    if(window.MejaRoom.receive(m,send))return;
    if(m.type==='replaced'){replaced=true;session=null;S=null;toast('Sesi dibuka di tab lain. Muat ulang untuk mengambil alih.');render();return;}
    if (m.type === 'joined') { session = { code:m.code, token:m.token }; storage.set('mejakita.capsa.session',session); history.replaceState(null,'','?room=' + m.code); }
    if (m.type === 'left') leaveLocal();
    if (m.type === 'error') { pending = false; hintPending = false; toast(m.message); if (m.fatal) leaveLocal(); else render(); }
    if (m.type === 'hint') {
      hintPending = false;
      if (!S || !S.settings.easyMode || !myTurn() || m.code !== S.code || Object.keys(turnContext()).some(key => m[key] !== S[key])) return;
      const valid = m.action === 'play' ? E.validatePlay(S.hand,m.ids,{ table:S.table,requiredCard:S.requiredCard,settings:S.settings }) : null;
      if (m.action === 'play' && valid?.ok) { selected = new Set(m.ids); toast('Saran: ' + m.label + '. Kartu dipilih; kamu tetap menekan Mainkan sendiri.'); }
      else { selected.clear(); toast('Tidak ada bantingan yang sah. Sarannya: lewat.'); }
      render();
    }
    if (m.type === 'state') {
      const previous = S; S = m; pending = false;
      if (moneyDraft && (S.code !== moneyDraft.code || S.phase !== 'lobby' || S.you !== S.hostSeat || parsePointValue(moneyDraft.value) === S.settings.pointValue)) { moneyDraft = null; clearTimeout(moneySaveTimer); moneySaveTimer = null; }
      if (moneyDraft) queueMoneySave();
      serverOffset = m.serverNow - Date.now();
      const owned = new Set(S.hand.map(c => c.id)); selected = new Set([...selected].filter(id => owned.has(id)));
      const rolledBack = previous?.code === S.code && previous.revision !== S.revision;
      if (previous?.round !== S.round || previous?.matchId !== S.matchId || previous?.code !== S.code || rolledBack) selected.clear();
      if (!S.settings.easyMode || rolledBack || previous?.actionNo !== S.actionNo) hintPending = false;
      if (rolledBack) { clearTimeout(effectTimer); $('combo-effects').replaceChildren(); if ($('undo-dialog').open) $('undo-dialog').close(); }
      if (myTurn() && (previous?.turn !== S.you || previous?.round !== S.round)) { beep(); toast(S.table ? 'Giliranmu. Lawan kartu di meja atau lewat.' : 'Giliranmu membuka meja.'); }
      document.title = S.phase === 'playing' ? (myTurn() ? 'Giliranmu' : 'Giliran ' + S.players[S.turn].name) + ' · Capsa Banting' : 'Capsa Banting · Capsa Club';
      render(); renderChat();
      // An existing table, chat update, or reconnect must not replay an old effect.
      const sameRound = previous?.code === S.code && previous?.matchId === S.matchId && previous?.round === S.round && previous?.revision === S.revision;
      const newAction = !awaitingSnapshot && sameRound && S.actionNo > previous.actionNo;
      awaitingSnapshot = false;
      if (newAction && S.lastAction?.type === 'play' && S.lastAction.evaluation.category >= 3) comboEffect(S.lastAction.evaluation,S.players[S.lastAction.seat].name);
      if (newAction && S.lastAction?.automatic === 'timeout') toast(S.players[S.lastAction.seat].name + (S.lastAction.type === 'pass' ? ' kehabisan waktu. Otomatis lewat.' : ' kehabisan waktu. Kartu terkecil dimainkan otomatis.'));
      if (S.settings.easyMode && (!previous?.settings.easyMode || previous.code !== S.code)) {
        if (easyConsentCode === S.code) { easyConsentCode = null; toast('Easy Mode aktif untuk semua pemain. Bantuan curang dinyalakan.'); }
        else openEasyWarning(false);
      }
      if (!S.settings.easyMode && easyPrompt === 'notice' && $('easy-dialog').open) $('easy-dialog').close();
      if (rolledBack && S.lastUndo) toast(S.lastUndo.name + ' memakai undo. Semua kartu, saldo, chat, dan riwayat kembali ke awal giliran terakhirnya.');
    }
  };
  ws.onclose = () => { window.MejaRoom.disconnected(); setConnection(false); if(!replaced)setTimeout(connect,1800); }; ws.onerror = () => ws.close();
}
function setConnection(value) {
  connected = value; $('connection').classList.toggle('online',value); $('connection').innerHTML = '<i></i>' + (value ? 'Terhubung' : 'Menyambungkan…');
  document.querySelectorAll('[data-needs-connection]').forEach(b => { b.disabled = !value || b.dataset.blocked === 'true'; });
  document.querySelectorAll('[data-mk-emoji],[data-mk-emoji-toggle]').forEach(b=>b.disabled=!value);
  $('chat-input').disabled = !value; $('chat-form').querySelector('[type="submit"]').disabled = !value;
  if (S?.phase === 'lobby') updateMoneyDraftUI();
}
function send(message) { if(!window.MejaRoom.outgoing(message))return false; if (ws?.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(message)); return true; } toast('Koneksi sedang tersambung ulang.'); return false; }
function leaveLocal() {
  S = null; session = null; selected.clear(); pending = false; storage.remove('mejakita.capsa.session'); lastChatId = '';
  history.replaceState(null,'',location.pathname); document.title = 'Capsa Banting · Capsa Club'; render();
  clearTimeout(effectTimer); $('combo-effects').replaceChildren();
  clearTimeout(moneySaveTimer); moneySaveTimer = null; moneyDraft = null; hintPending = false; undoTarget = null;
  for (const id of ['easy-dialog','undo-dialog']) if ($(id).open) $(id).close();
}
function toast(text) { $('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'),3200); }
function warmAudio() { window.MejaRoom.unlock(); }
function beep() { /* Shared room feedback owns the turn sound. */ }
function inviteUrl() {
  const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  const host = local && S?.addresses?.length ? S.addresses[0] + (location.port ? ':' + location.port : '') : location.host;
  return location.protocol + '//' + host + '/capsa/?room=' + S.code;
}
async function copy(text, message) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else { const input = document.createElement('textarea'); input.value = text; input.className = 'sr-only'; document.body.appendChild(input); input.select(); const ok = document.execCommand('copy'); input.remove(); if (!ok) throw new Error('clipboard'); }
    toast(message);
  } catch { toast('Salin alamat ini: ' + text); }
}
function renderLanding() {
  return '<div class="hero"><div class="hero-copy"><div class="eyebrow">CAPSA BANTING · BIG TWO</div><h1>Giliranmu.<br>Banting kartumu.<br><em>Habiskan duluan.</em></h1><p>Lawan kartu dengan yang lebih tinggi, atau lewat dan tunggu kesempatan. Main bergiliran bareng teman atau bot.</p><div class="hero-meta"><span><i></i>3 TERENDAH</span><span><i></i>2 TERTINGGI</span><span><i></i>3–8 PEMAIN</span></div><div class="card-fan" aria-hidden="true">' + [1,15,29,43,39].map(id => cardHTML(E.card(id),true)).join('') + '</div></div><form class="join-card" id="entry-form"><div class="eyebrow">MEJAMU MENUNGGU</div><h2>Siapa habis duluan?</h2><p class="sub">Buat ruangan atau ikut giliran di meja teman.</p><label class="field" for="name-input">Nama panggilan</label><input class="field-input" id="name-input" value="' + esc(window.MejaRoom.name(storage.get('mejakita.capsa.name',''))) + '" maxlength="20" placeholder="Kamu mau dipanggil siapa?" required autocomplete="nickname"><label class="field" for="create-mode">Mode ruangan baru</label><select class="field-input create-mode" id="create-mode"><option value="official"' + (roomModeDraft === 'official' ? ' selected' : '') + '>Official · 4 pemain</option><option value="casual"' + (roomModeDraft === 'casual' ? ' selected' : '') + '>Non-official · 3–8 pemain</option></select><p class="creation-note">Mode dipilih sekali saat room dibuat. Tidak berubah saat teman masuk.</p><button class="button primary full" type="submit" data-needs-connection>Buat ruangan baru ↗</button><div class="form-divider">atau sudah punya kode?</div><label class="field" for="room-input">Kode ruangan</label><div class="join-inputs"><input class="field-input code" id="room-input" value="' + esc(urlRoom) + '" maxlength="4" placeholder="ABCD" autocomplete="off" aria-label="Kode ruangan"><button class="button secondary" type="button" data-action="join" data-needs-connection>Gabung →</button></div><p class="fine-print">Single, pair, triple, atau kombinasi 5 kartu.<br>Bot melengkapi jumlah minimum pemain.</p></form></div><div class="feature-strip"><div class="feature"><span class="feature-icon">↻</span><div><h3>Giliran benar-benar berputar</h3><p>Lawan bantingan sebelumnya. Semua lawan lewat? Pemenang meja buka bebas.</p></div></div><div class="feature"><span class="feature-icon">♟</span><div><h3>Sendiri atau bareng teman</h3><p>Teman masuk ke meja yang sama lewat link dan kode ruangan.</p></div></div><div class="feature"><span class="feature-icon">2</span><div><h3>3 kecil, 2 paling besar</h3><p>Urutan yang kamu kenal: 3, 4, 5, …, K, A, 2. Simbol memecahkan seri.</p></div></div></div>';
}
function renderLobby() {
  const host = S.you >= 0 && S.you === S.hostSeat, casual = S.settings.mode === 'casual';
  const capacity = casual ? 8 : 4, minimum = casual ? 3 : 4;
  const count = Math.max(minimum,S.players.length), base = Math.floor(52 / count), extras = 52 % count;
  const distribution = extras ? extras + ' pemain mendapat ' + (base + 1) + ' kartu; ' + (count - extras) + ' pemain mendapat ' + base + ' kartu.' : count + ' pemain × ' + base + ' kartu.';
  const missing = Math.max(0,minimum - S.players.length);
  const seats = Array.from({ length:capacity },(_,i) => {
    const player = S.players[i];
    if (!player) return '<div class="seat empty"><span class="avatar bot">+</span><div><div class="seat-name">Kursi ' + (i + 1) + ' kosong</div><div class="seat-note">' + (i < minimum ? 'Bot jika belum terisi saat mulai' : 'Opsional · isi dengan teman') + '</div></div></div>';
    return '<div class="seat">' + avatar(player) + '<div><div class="seat-name">' + esc(player.name) + (i === S.you ? '<span class="tag">KAMU</span>' : '') + '</div><div class="seat-note">' + (i === S.hostSeat ? 'Host meja' : player.connected ? 'Siap di meja' : 'Offline') + '</div></div>' + (host && i !== S.you && player.connected ? '<button data-action="host" data-seat="' + i + '">Jadikan host</button>' : '') + '</div>';
  }).join('');
  const disabled = host ? '' : ' disabled';
  return `<div class="view-heading"><div><span class="eyebrow">CAPSA BANTING · RUANG TUNGGU</span><h1>Siap saling banting?</h1><p class="sub">${modeName()} · ${S.players.length}/${capacity} kursi · pembuka setiap ronde menyertakan 3♦.</p></div><button class="button ghost tiny" data-action="leave">Keluar ↗</button></div>
  <div class="room-card"><div><span class="eyebrow">KODE RUANGAN</span><div class="room-code">${S.code}</div><p>Teman buka link undangan ini:</p><p class="room-link">${esc(inviteUrl())}</p></div><div class="button-row"><button class="button primary" data-action="copy-link">Bagikan link ↗</button><button class="button ghost" data-action="copy-code">Salin kode</button></div></div>
  <div class="settings-card mode-settings"><div class="settings-line"><div class="setting-label"><b>Mode meja · ${modeName()}</b><small>Ditetapkan saat room dibuat. ${casual ? '3–8 pemain; orang kelima sampai kedelapan tetap ikut.' : '4 pemain; buat room Non-official untuk lebih banyak pemain.'}</small></div><span class="mode-locked">${casual ? '3–8 KURSI' : '4 KURSI'} · TETAP</span></div><div class="deal-preview"><b>52 kartu dibagikan semua</b><p>${distribution}</p><small>${missing ? missing + ' bot akan melengkapi minimum ' + minimum + ' pemain.' : 'Semua kursi yang terisi ikut. Kursi kosong opsional tidak diisi bot.'} Jatah kartu ekstra bergilir tiap ronde.</small></div></div>
  <div class="seats">${seats}</div>
  <div class="settings-card"><div class="settings-line"><div class="setting-label"><b>Durasi permainan</b><small>Quick Play: 1 ronde sampai rekap akhir. 1 poin untuk setiap kartu tersisa.</small></div><div class="segments">${[1,4,8,10].map(n => '<button data-action="rounds" data-rounds="' + n + '" class="' + (S.settings.rounds === n ? 'active' : '') + '"' + disabled + '>' + (n===1?'Quick · 1':n) + '</button>').join('')}</div></div>
  <div class="settings-line money-setting"><label class="setting-label" for="point-value"><b>Nilai 1 poin dalam rupiah</b><small>Langsung tersimpan saat diketik. 0 = latihan; terkunci saat mulai.</small></label><div class="money-input-wrap"><input id="point-value" type="text" inputmode="numeric" maxlength="7" pattern="[0-9]*" value="${esc(moneyInputValue())}" aria-describedby="money-save-status"${disabled}><span>IDR / kartu</span></div></div>
  <p id="money-save-status" class="money-save-status" role="status">Tersimpan otomatis · ${idr(S.settings.pointValue)} / poin</p><div class="money-example"><span class="eyebrow">CARA HITUNG</span><b id="money-example-value">5 kartu tersisa = −5 poin = ${signedMoney(-5 * S.settings.pointValue)}</b><p>Setiap lawan membayar sisa kartunya kepada pemenang ronde. Saldo seluruh meja berjumlah nol.</p><small>${missing ? 'Meja ini akan memakai bot. Nilai rupiah pilihanmu tetap dipakai untuk simulasi saldo.' : 'Nilai rupiah tetap dipakai saat mulai. Saldo berubah setelah ronde selesai; saldo bot adalah simulasi.'}</small></div>
  <div class="settings-line bot-lobby-setting"><div class="setting-label"><b>Tingkat bot</b><small>Semua tingkat menunggu 3 detik.</small></div><div class="bot-lobby-controls">${botControls(host)}</div></div>
  <p class="sub">Aturan terpasang: ${S.settings.straightRule==='indonesia'?'Straight Indonesia':'Straight urut 3 → 2'} · ${S.settings.lockPass?'sekali lewat menunggu meja baru':'bisa ikut lagi setelah lewat'} · Easy Mode ${S.settings.easyMode?'ON':'OFF'}.</p>
  ${MejaRoom.customize('capsa-rules','Customize · bantuan dan aturan meja',`${easyControls(host)}  <div class="settings-line"><label class="setting-label" for="straight-mode"><b>Aturan straight</b><small>${S.settings.straightRule === 'indonesia' ? 'JQKA2, A2345, dan 23456 sah; bandingkan kartu 2.' : '34567 terendah; JQKA2 tertinggi, tanpa putaran.'}</small></label><select id="straight-mode" class="setting-select"${disabled}><option value="indonesia"${S.settings.straightRule === 'indonesia' ? ' selected' : ''}>Indonesia · straight 2 tinggi</option><option value="linear"${S.settings.straightRule === 'linear' ? ' selected' : ''}>Urut 3 → 2 · JQKA2 tinggi</option></select></div>
  <div class="settings-line"><label class="setting-label" for="pass-toggle"><b>Sekali lewat, tunggu meja baru</b><small>Meja dibersihkan setelah semua lawan lewat.</small></label><input id="pass-toggle" class="toggle" type="checkbox"${S.settings.lockPass ? ' checked' : ''}${disabled}></div>`)} </div>
  <div class="lobby-start"><p>${S.spectator ? 'Kamu menonton meja.' : host ? 'Pembuka wajib menyertakan 3♦. ' + (missing ? missing + ' bot melengkapi meja.' : count + ' pemain ikut ronde ini.') : 'Menunggu ' + esc(S.players[S.hostSeat]?.name || 'host') + ' mulai.'}</p>${host ? '<button class="button primary" data-action="start" data-needs-connection>Mulai Capsa Banting →</button>' : S.spectator && S.players.length < capacity ? '<button class="button primary" data-action="seat" data-needs-connection>Ambil kursi →</button>' : ''}</div>`;
}
function renderMoneyRecap() {
  if (!S) return;
  const m = S.money;
  const rows = m.rows.map(p => '<tr><td><b>' + esc(p.name) + '</b><small>' + (p.bot ? 'Bot' : 'Pemain') + '</small></td><td class="' + tone(p.points) + '">' + signed(p.points) + '</td><td class="' + tone(p.net) + '">' + signedMoney(p.net) + '</td></tr>').join('');
  const transfers = m.final && !m.simulation && m.transfers.length ? '<div class="money-transfers"><h3>Saran pembayaran akhir</h3>' + m.transfers.map(t => '<div><span>' + esc(t.fromName) + ' <i>→</i> ' + esc(t.toName) + '</span><b>' + idr(t.amount) + '</b></div>').join('') + '<p>Gunakan jika saldo antar pemain belum diselesaikan. Aplikasi mencatat saldo; pembayaran dilakukan di luar game.</p></div>' : '<p class="money-status-note">' + (m.simulation ? 'Saldo meja dengan bot adalah simulasi. Tidak ada saran pembayaran ke atau dari bot.' : m.final ? 'Semua saldo sudah nol. Tidak ada pembayaran.' : 'Saran pembayaran muncul setelah pertandingan selesai. Ronde yang masih berjalan belum masuk saldo.') + '</p>';
  const rounds = S.history.length ? '<details class="round-money-details"><summary>Rincian ' + S.history.length + ' ronde selesai</summary>' + S.history.map(h => '<div class="money-round"><b>Ronde ' + h.round + ' · ' + esc(h.people?.[h.winner]?.name || h.names?.[h.winner] || S.players[h.winner]?.name || 'Pemain') + ' menang</b><div class="money-table-wrap"><table class="money-table"><thead><tr><th>Pemain</th><th>Awal / sisa</th><th>Poin</th><th>Rupiah</th></tr></thead><tbody>' + (h.people || S.players).map((p,i) => '<tr><td>' + esc(p.name) + '</td><td>' + h.dealt[i] + ' / ' + h.remaining[i] + '</td><td>' + signed(h.delta[i]) + '</td><td class="' + tone(h.moneyDelta[i]) + '">' + signedMoney(h.moneyDelta[i]) + '</td></tr>').join('') + '</tbody></table></div></div>').join('') + '</details>' : '';
  $('money-recap-content').innerHTML = '<h2>' + (m.final ? 'Rekap akhir meja.' : 'Setiap poin tercatat.') + '</h2><p class="money-recap-sub">Room ' + S.code + ' · ' + modeName() + ' · 1 poin = ' + idr(m.rate) + ' · ' + m.rounds + '/' + S.settings.rounds + ' ronde selesai</p>' + (m.practice ? '<p class="practice-note">Mode latihan · nilai 1 poin Rp0.</p>' : m.simulation ? '<p class="practice-note">Simulasi saldo dengan bot · nilai 1 poin tetap ' + idr(m.rate) + '.</p>' : '') + '<div class="money-table-wrap"><table class="money-table"><thead><tr><th>Pemain</th><th>Total poin</th><th>Saldo rupiah</th></tr></thead><tbody>' + rows + '<tr class="money-total"><td>Total meja</td><td>' + signed(m.rows.reduce((sum,p) => sum + p.points,0)) + '</td><td>' + idr(m.total) + '</td></tr></tbody></table></div><div class="money-totals"><span>Total menerima <b>' + idr(m.totalReceive) + '</b></span><span>Total membayar <b>' + idr(m.totalPay) + '</b></span></div><p class="money-status-note">1 kartu tersisa = 1 poin. Pemenang menerima total poin dari semua lawan. Hanya ronde selesai yang dihitung.</p>' + transfers + rounds;
}
function openMoneyRecap() { if (!S) return; renderMoneyRecap(); if (!$('money-dialog').open) $('money-dialog').showModal(); }
function downloadMoneyCSV() {
  if (!S) return;
  const status = S.money.simulation ? 'Simulasi dengan bot - hanya ronde selesai' : S.money.final ? 'Final' : 'Sementara - hanya ronde selesai';
  const rows = [['Jenis','Room','Pertandingan','Ronde','Pemain','Bot','Kartu awal','Kartu sisa','Poin','Rp per poin','Rupiah','Dari','Ke','Jumlah transfer','Status']];
  S.money.rows.forEach(p => rows.push(['saldo',S.code,S.matchId,'',p.name,p.bot ? 'Ya' : 'Tidak','','',p.points,S.money.rate,p.net,'','','',status]));
  S.history.forEach(h => (h.people || S.players).forEach((p,i) => rows.push(['ronde',S.code,h.matchId ?? S.matchId,h.round,p.name,p.bot ? 'Ya' : 'Tidak',h.dealt[i],h.remaining[i],h.delta[i],h.pointValue,h.moneyDelta[i],'','','','Selesai'])));
  if (S.money.final && !S.money.simulation) S.money.transfers.forEach(t => rows.push(['pembayaran',S.code,S.matchId,'','','','','','','','',t.fromName,t.toName,t.amount,'Saran pembayaran akhir']));
  const cell = value => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^\s*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  };
  const blob = new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')],{ type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = 'capsa-' + S.code + '-match-' + S.matchId + '-rekap.csv';
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),2000);
}
function heading() {
  return '<div class="table-heading"><div><div class="eyebrow">CAPSA BANTING · BIG TWO' + (S.spectator ? ' · PENONTON' : '') + '</div><h1>Ronde ' + S.round + ' <span class="muted">/ ' + S.settings.rounds + '</span></h1><p>3 → 4 → … → K → A → 2 · ' + modeName() + ' · ' + S.players.length + ' pemain' + (S.settings.easyMode ? ' <span class="easy-badge">EASY · BANTUAN CURANG</span>' : '') + '</p></div><div class="table-meta"><button class="code-chip" data-action="copy-link" title="Salin link undangan">' + S.code + ' ↗</button><button class="exit-button" data-action="leave">Keluar</button></div></div>';
}
function tableSeat(seat, position, order) {
  const p = S.players[seat];
  return '<div class="table-seat seat-' + position + (seat === S.turn ? ' current' : '') + (p.passed ? ' passed' : '') + (p.handCount === 1 ? ' last-card' : '') + '"><div class="table-seat-head">' + avatar(p) + '<div class="table-seat-name"><b>' + (order ? order + '. ' : '') + esc(p.name) + '</b><small>' + (p.bot ? 'BOT · ' + botOption().label.toUpperCase() : !p.connected ? 'OFFLINE' : 'PEMAIN') + '</small></div><span class="table-seat-count">' + p.handCount + '</span></div><div class="table-seat-status"><span>' + (p.passed ? 'Lewat' : seat === S.turn ? '● Giliran' : p.handCount === 1 ? 'Kartu terakhir!' : 'Menunggu') + '</span><div class="mini-backs" aria-label="Kartu tersembunyi"><i></i><i></i><i></i></div></div>' + (S.money.rate ? '<div class="seat-money ' + tone(p.net) + '">' + signedMoney(p.net) + '</div>' : '') + '</div>';
}
function tableLayout(view, center) {
  const count = S.players.length, own = S.players[view];
  const marker = '<div class="own-seat-marker' + (view === S.turn ? ' current' : '') + '">' + esc(own.name) + (S.you >= 0 ? ' · kamu' : '') + ' · ' + own.handCount + ' kartu · ' + signed(own.score) + ' poin' + (S.money.rate ? ' · ' + signedMoney(own.net) : '') + '</div>';
  if (count === 4) return '<div class="bt-table">' + tableSeat((view + 1) % count,'left') + tableSeat((view + 2) % count,'top') + tableSeat((view + 3) % count,'right') + '<div class="bt-center">' + center + '</div>' + marker + '</div>';
  const seats = Array.from({ length:count - 1 },(_,i) => tableSeat((view + i + 1) % count,'flow',i + 1)).join('');
  return '<div class="bt-table multi-table"><div class="multi-turn-order">↻ URUTAN GILIRAN SETELAH ' + esc(own.name.toUpperCase()) + '</div><div class="bt-opponents opponents-count-' + (count - 1) + '">' + seats + '</div><div class="bt-center">' + center + '</div>' + marker + '</div>';
}
function gameHTML() {
  const view = S.you >= 0 ? S.you : 0, own = S.players[view], active = S.players[S.turn], mine = myTurn();
  const center = S.table ? '<div class="table-play-label">' + esc(S.players[S.table.seat].name) + ' membanting</div><div class="table-cards">' + S.table.cards.map(c => cardHTML(c,true)).join('') + '</div><div class="table-play-type">' + S.table.evaluation.label + '</div><p class="table-play-detail">' + S.table.evaluation.detail + ' · lawan dengan ' + S.table.cards.length + ' kartu</p>' : '<div class="empty-table"><div class="empty-table-suit">' + (S.requiredCard === 1 ? '♦' : '♠') + '</div><h2>' + (S.requiredCard === 1 ? 'Mulai dari 3♦' : 'Meja baru, buka bebas.') + '</h2><p>' + esc(active.name) + (S.requiredCard === 1 ? ' membuka dengan kartu atau kombinasi yang menyertakan 3♦.' : ' menentukan kombinasi berikutnya.') + '</p>' + (S.lastTable ? '<p>Semua lawan lewat. Bantingan terakhir menang.</p>' : '') + '<div class="clockwise-note">↻ GILIRAN SEARAH JARUM JAM</div></div>';
  const table = tableLayout(view,center);
  const status = S.you >= 0 && S.players[S.you].passed ? 'Kamu sudah lewat. Tunggu meja baru.' : mine ? S.requiredCard === 1 ? 'Pembukaan ronde wajib menyertakan 3♦ dalam kartu atau kombinasi yang sah.' : S.table ? 'Lawan ' + S.table.evaluation.label + ' lebih tinggi, atau lewat.' : 'Mainkan single, pair, triple, atau kombinasi 5 kartu.' : 'Kamu bisa memilih kartu sambil menunggu giliran.';
  const banner = '<div class="turn-banner' + (mine ? ' mine' : '') + '"><div class="turn-banner-copy"><b>' + (mine ? '● GILIRANMU' : 'Giliran ' + esc(active.name)) + '</b><p>' + (S.spectator ? 'Kartu pemain tetap tersembunyi sampai ronde selesai.' : status) + '</p><span class="turn-status">' + (S.table ? S.table.cards.length + ' KARTU' : 'BUKA MEJA') + '</span></div>' + turnClockHTML() + '</div>';
  if (S.spectator) return table + banner;
  const cards = S.hand.slice().sort((a,b) => sortBy === 'suit' ? a.suit - b.suit || E.cardValue(a) - E.cardValue(b) : E.cardValue(a) - E.cardValue(b));
  const valid = selected.size ? E.validatePlay(S.hand,[...selected],{ table:S.table, requiredCard:S.requiredCard, settings:S.settings }) : null;
  const evaluation = selected.size ? E.evaluate(S.hand.filter(c => selected.has(c.id)),S.settings) : null;
  const line = !selected.size ? 'Pilih kartu yang ingin dibanting.' : valid.ok ? evaluation.label + ' · ' + evaluation.detail + (mine ? ' — siap dimainkan.' : ' — menunggu giliranmu.') : valid.reason;
  const blocked = !mine || !valid?.ok || pending;
  return table + banner + '<div class="bt-hand"><div class="bt-hand-header"><h2>Kartumu · <b>' + S.hand.length + '</b> tersisa</h2><span>' + (selected.size ? selected.size + ' dipilih' : 'Urut rendah → tinggi') + '</span></div><div class="hand-spread">' + cards.map(c => cardHTML(c)).join('') + '</div><div class="selection-line ' + (valid ? valid.ok ? 'valid' : 'invalid' : '') + '" role="status">' + esc(line) + '</div><div class="play-controls"><div class="control-tools"><button class="button ghost tiny" data-action="clear"' + (!selected.size ? ' disabled' : '') + '>Batal pilih</button><button class="button ghost tiny" data-action="sort">Urut ' + (sortBy === 'rank' ? 'simbol' : 'angka') + '</button>' + (S.settings.easyMode ? '<button class="button secondary tiny hint-button" data-action="hint" data-needs-connection data-blocked="' + (!mine || pending || hintPending) + '"' + (!mine || pending || hintPending ? ' disabled' : '') + '>' + (hintPending ? 'Mencari…' : 'Saran langkah ✦') + '</button>' : '') + '</div><div class="control-actions"><button class="button secondary" data-action="pass" data-needs-connection data-blocked="' + (!mine || !S.table || pending) + '"' + (!mine || !S.table || pending ? ' disabled' : '') + '>Lewat</button><button class="button primary" data-action="play" data-needs-connection data-blocked="' + blocked + '"' + (blocked ? ' disabled' : '') + '>' + (pending ? 'Mengirim…' : !mine ? 'Tunggu giliran' : 'Mainkan ' + (selected.size || '') + ' kartu ↑') + '</button></div></div></div>' + undoControls();
}
function resultHTML() {
  const r = S.result, winner = S.players[r.winner], delta = S.you >= 0 ? r.delta[S.you] : null, host = S.you >= 0 && S.you === S.hostSeat;
  const final = S.phase === 'finished' ? '<div class="rankings"><span class="eyebrow">SELESAI · ' + S.settings.rounds + ' RONDE</span><h2>Hasil akhir</h2>' + S.players.map((p,i) => ({ ...p,seat:i })).sort((a,b) => b.score - a.score).map((p,i,all) => '<div class="ranking-row"><span class="place">' + (all.findIndex(x => x.score === p.score) + 1) + '</span>' + avatar(p) + '<span class="name">' + esc(p.name) + (p.seat === S.you ? '<span class="tag">KAMU</span>' : '') + '</span><strong class="' + tone(p.score) + '">' + signed(p.score) + '</strong><small>POIN' + (S.money.rate ? '<b class="' + tone(p.net) + '">' + signedMoney(p.net) + '</b>' : '') + '</small></div>').join('') + '</div>' : '';
  const hands = r.remaining.map((cards,i) => '<article class="revealed-player' + (i === S.you ? ' you' : '') + '"><div class="reveal-heading"><span>' + esc(S.players[i].name) + (i === r.winner ? '<span class="tag">MENANG</span>' : i === S.you ? '<span class="tag">KAMU</span>' : '') + '</span><strong class="' + tone(r.delta[i]) + '">' + signed(r.delta[i]) + '</strong></div><p class="end-hand-label">' + (i === r.winner ? 'Semua kartu habis.' : cards.length + ' kartu tersisa × 1 poin') + (S.money.rate ? ' · ' + signedMoney(r.moneyDelta[i]) : '') + '</p><div class="remaining-row">' + cards.map(c => cardHTML(c,true,true)).join('') + '</div></article>').join('');
  return '<div class="result-banner"><div><span class="eyebrow">HABIS KARTU DULUAN</span><h2>' + (r.winner === S.you ? 'Kamu menang!' : esc(winner.name) + ' menang ronde ini.') + '</h2><p>Ronde berhenti saat kartu ' + esc(winner.name) + ' habis.</p></div>' + (delta !== null ? '<div class="round-delta ' + tone(delta) + '">' + signed(delta) + '<small>POIN RONDE INI</small>' + (S.money.rate ? '<span class="round-money">' + signedMoney(r.moneyDelta[S.you]) + '</span>' : '') + '</div>' : '') + '</div>' + final + '<div class="round-money-callout"><p>' + (S.phase === 'finished' ? 'Saldo akhir siap. Unduh rekap sebelum memulai pertandingan baru.' : 'Ronde selesai dicatat. Setiap ronde berikutnya dibuka pemegang 3♦.') + '</p><button class="button secondary" data-action="recap">Rekap poin & rupiah ↗</button></div><div class="finish-last-play"><p>Bantingan terakhir · ' + esc(winner.name) + ' · ' + r.lastPlay.evaluation.label + '</p><div class="table-cards">' + r.lastPlay.cards.map(c => cardHTML(c,true)).join('') + '</div></div><div class="reveal-grid">' + hands + '</div>' + undoControls() + '<div class="result-actions"><p>' + (host ? S.phase === 'finished' ? 'Pertandingan selesai. Main lagi?' : 'Pemegang 3♦ membuka ronde berikutnya.' : 'Menunggu ' + esc(S.players[S.hostSeat]?.name || 'host') + ' melanjutkan.') + '</p>' + (host ? '<button class="button primary" data-action="' + (S.phase === 'finished' ? 'again' : 'next') + '" data-needs-connection>' + (S.phase === 'finished' ? 'Main lagi ↗' : 'Ronde berikutnya →') + '</button>' : '') + '</div>';
}
function render() {
  const moneyFocus = document.activeElement?.id === 'point-value' ? { value:document.activeElement.value, start:document.activeElement.selectionStart, end:document.activeElement.selectionEnd } : null;
  $('app').classList.toggle('in-room',!!S); $('chat-panel').hidden = !S;
  $('money-button').hidden = !S; $('money-summary').hidden = !S;
  if (S) { const ownMoney = S.you >= 0 ? S.players[S.you].net : 0; $('money-summary').innerHTML = '<div class="panel-heading"><h2>Rekap poin & rupiah</h2><span>' + (S.money.rate ? S.money.simulation ? 'SIMULASI' : 'IDR' : 'LATIHAN') + '</span></div><div class="money-summary-body"><p>1 poin = ' + idr(S.money.rate) + '</p><strong class="' + tone(ownMoney) + '">' + signedMoney(ownMoney) + '</strong><small>' + (S.you >= 0 ? 'Saldo kamu · dari ' : 'Saldo meja · dari ') + S.money.rounds + ' ronde selesai</small><button class="button secondary tiny" data-open-money>Rekap meja ↗</button></div>'; }
  if ($('money-dialog').open) { if (S) renderMoneyRecap(); else $('money-dialog').close(); }
  $('view').innerHTML = !S ? renderLanding() : S.phase === 'lobby' ? renderLobby() : heading() + (S.phase === 'playing' ? gameHTML() : resultHTML());
  $('bot-settings-panel').hidden = !S || S.phase === 'lobby';
  if (S && S.phase !== 'lobby') $('bot-settings-panel').innerHTML = '<div class="panel-heading"><h2>Bot & bantuan pemula</h2><span>' + botOption().label.toUpperCase() + '</span></div><div class="bot-control-body">' + botControls(S.you >= 0 && S.you === S.hostSeat) + '<p class="bot-control-help">Semua tingkat bot menunggu 3 detik per giliran. ' + (S.you === S.hostSeat ? 'Tingkat bisa diganti kapan saja.' : 'Host mengatur tingkat bot.') + '</p>' + easyControls(S.you >= 0 && S.you === S.hostSeat) + '</div>';
  setConnection(connected);
  $('straight-rule-description').textContent = S?.settings.straightRule === 'linear' ? 'Mode urut 3 → 2: 3–4–5–6–7 paling kecil; J–Q–K–A–2 paling besar. Tidak ada putaran, jadi A–2–3–4–5 dan 2–3–4–5–6 tidak sah.' : 'Mode Indonesia: A–2–3–4–5 dan 2–3–4–5–6 lebih tinggi dari straight biasa, ditentukan simbol kartu 2. J–Q–K–A–2 juga sah dan memakai kartu 2 sebagai puncak. Host bisa memilih mode urut 3 → 2 di ruang tunggu.';
  $('pass-rule-description').textContent = S && !S.settings.lockPass ? 'Kamu boleh ikut lagi saat giliran kembali, walaupun sebelumnya sudah lewat.' : 'Sekali lewat, kamu menunggu sampai meja baru sebelum bisa bermain lagi.';
  const linearStraight = S?.settings.straightRule === 'linear';
  $('cheatsheet-mode').textContent = linearStraight ? 'STRAIGHT · URUT 3 → 2' : 'STRAIGHT · INDONESIA';
  $('cheatsheet-straight').textContent = linearStraight ? 'JQKA2 → 10JQKA → … → 34567. A2345 dan 23456 tidak sah; tidak ada putaran.' : 'JQKA2, A2345, dan 23456 memakai puncak 2; bandingkan simbol 2. Lalu 10JQKA → … → 34567.';
  if (S) {
    $('action-log').innerHTML = S.events.length ? S.events.slice().reverse().map(e => '<div class="action-line"><b>' + esc(S.players[e.seat].name) + '</b> ' + (e.type === 'pass' ? 'lewat.' : 'membanting ' + e.evaluation.label + '.<small>' + e.cards.map(E.cardName).join(' · ') + '</small>') + (e.automatic === 'timeout' ? '<small class="timeout-note">' + Math.ceil(S.turnLimit / 1000) + ' detik habis · ' + (e.type === 'pass' ? 'lewat otomatis' : 'kartu terkecil otomatis') + '</small>' : '') + (e.reset ? '<small class="positive">Semua lawan lewat. ' + esc(S.players[e.leader].name) + ' buka meja baru.</small>' : '') + '</div>').join('') : '<p class="action-empty">Bantingan dan giliran setiap pemain dicatat di sini.</p>';
    $('round-history').innerHTML = S.history.length ? S.history.slice(-5).reverse().map(h => '<div class="history-line"><span>Ronde ' + h.round + ' · ' + esc(h.people?.[h.winner]?.name || h.names?.[h.winner] || S.players[h.winner]?.name || 'Pemain') + '</span>' + (S.you >= 0 ? '<b class="' + tone(historyDelta(h)) + '">' + signed(historyDelta(h)) + '</b>' : '') + '</div>').join('') : '<p class="history-empty">Belum ada ronde selesai.</p>';
  }
  updateTurnClock();
  if (moneyFocus && $('point-value') && !$('point-value').disabled) {
    const input = $('point-value'); input.value = moneyFocus.value; input.focus({ preventScroll:true });
    if (moneyFocus.start !== null) input.setSelectionRange(moneyFocus.start,moneyFocus.end);
  }
  if (S?.phase === 'lobby') updateMoneyDraftUI();
}
function renderChat() {
  $('spectator-count').textContent = S.spectators ? S.spectators + ' penonton' : '';
  const last = S.chat.at(-1)?.id; if (last === lastChatId) return;
  const box = $('messages'), bottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = S.chat.map(m => '<div class="chat-message ' + (m.name === null ? 'system' : S.players[S.you]?.name === m.name ? 'mine' : '') + '">' + (m.name === null ? '' : '<b>' + esc(m.name) + '</b>') + esc(m.text) + '</div>').join('');
  if (bottom || !lastChatId) box.scrollTop = box.scrollHeight; lastChatId = last;
}
function enterRoom(type) {
  const name = $('name-input').value.trim(), code = $('room-input').value.trim().toUpperCase();
  if (!name) { $('name-input').focus(); return toast('Isi nama panggilan dulu.'); }
  if (type === 'join' && !/^[A-Z]{4}$/.test(code)) { $('room-input').focus(); return toast('Kode ruangan terdiri dari 4 huruf.'); }
  storage.set('mejakita.capsa.name',name); send({ type,name,code,...(type === 'create' ? { mode:roomModeDraft } : {}) });
}
function play() {
  if (!myTurn() || pending) return;
  const valid = E.validatePlay(S.hand,[...selected],{ table:S.table,requiredCard:S.requiredCard,settings:S.settings });
  if (!valid.ok) return toast(valid.reason);
  pending = true; if (!send({ type:'play',ids:[...selected],...turnContext() })) pending = false; render();
}
$('view').addEventListener('click',event => {
  const card = event.target.closest('[data-card]');
  if (card && S?.phase === 'playing') { warmAudio(); const id = Number(card.dataset.card); selected.has(id) ? selected.delete(id) : selected.add(id); render(); return; }
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return; warmAudio();
  const action = button.dataset.action;
  if (action === 'join') return enterRoom('join');
  if (action === 'leave') return $('leave-dialog').showModal();
  if (action === 'copy-link') return copy(inviteUrl(),'Link undangan tersalin. Bagikan ke teman.');
  if (action === 'copy-code') return copy(S.code,'Kode ' + S.code + ' tersalin.');
  if (action === 'recap') return openMoneyRecap();
  if (action === 'seat') return send({ type:'seat' });
  if (action === 'rounds') return send({ type:'settings',rounds:Number(button.dataset.rounds) });
  if (action === 'host') return send({ type:'host',seat:Number(button.dataset.seat) });
  if (action === 'start') { const amount = parsePointValue($('point-value').value); if (amount === null) { $('point-value').focus(); return toast('Masukkan rupiah bulat antara 0 dan 1.000.000.'); } clearTimeout(moneySaveTimer); moneySaveTimer = null; return send({ type:'start',pointValue:amount }); }
  if (['next','again'].includes(action)) return send({ type:action });
  if (action === 'clear') { selected.clear(); render(); return; }
  if (action === 'sort') { sortBy = sortBy === 'rank' ? 'suit' : 'rank'; render(); return; }
  if (action === 'hint' && S.settings.easyMode && myTurn() && !pending) { hintPending = true; if (!send({ type:'hint',...turnContext() })) hintPending = false; render(); return; }
  if (action === 'undo' && S.settings.easyMode && S.undo?.available && !pending) { undoTarget = { code:S.code, targetActionNo:S.undo.targetActionNo, matchId:S.matchId, round:S.round, revision:S.revision }; $('undo-remaining').textContent = S.undo.remaining + '/2'; $('undo-round').textContent = 'Ronde ' + S.round + ' · awal giliran terakhirmu'; $('undo-dialog').showModal(); return; }
  if (action === 'play') return play();
  if (action === 'pass' && myTurn() && S.table) { pending = true; if (!send({ type:'pass',...turnContext() })) pending = false; selected.clear(); render(); }
});
$('view').addEventListener('submit',event => { if (event.target.id === 'entry-form') { event.preventDefault(); warmAudio(); enterRoom('create'); } });
document.addEventListener('click',event => {
  if (event.target.closest('[data-open-money]')) return openMoneyRecap();
  if (event.target.closest('[data-money-csv]')) return downloadMoneyCSV();
  const preview = event.target.closest('[data-combo-preview]');
  if (preview) { const category = Number(preview.dataset.comboPreview); comboEffect({ category,label:E.LABELS[category] },'',true); return; }
  const button = event.target.closest('[data-bot-level]');
  if (!button || button.disabled || !S || S.you !== S.hostSeat) return;
  send({ type:'settings',botLevel:button.dataset.botLevel });
});
$('view').addEventListener('input',event => { if (event.target.id === 'point-value' && S?.phase === 'lobby' && S.you === S.hostSeat) { moneyDraft = { code:S.code,value:event.target.value }; updateMoneyDraftUI(); queueMoneySave(true); } });
$('view').addEventListener('change',event => {
  if (event.target.id === 'create-mode') { roomModeDraft = event.target.value; storage.set('mejakita.capsa.roomMode',roomModeDraft); }
  if (event.target.id === 'straight-mode') send({ type:'settings',straightRule:event.target.value });
  if (event.target.id === 'pass-toggle') send({ type:'settings',lockPass:event.target.checked });
});
document.addEventListener('change',event => {
  if (event.target.id !== 'easy-toggle' || !S || S.you !== S.hostSeat) return;
  const enable = event.target.checked;
  event.target.checked = !!S.settings.easyMode;
  if (enable) openEasyWarning(true);
  else send({ type:'settings',easyMode:false });
});
$('view').addEventListener('keydown',event => { if (event.target.id === 'room-input' && event.key === 'Enter') { event.preventDefault(); enterRoom('join'); } });
$('chat-form').addEventListener('submit',event => { event.preventDefault(); const input = $('chat-input'), text = input.value.trim(); if (text && send({ type:'chat',text })) input.value = ''; });
$('chat-form').querySelector('[data-mk-emoji-slot]').innerHTML=MejaTools.emojiPicker({connected:false});
document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click',() => b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click',event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } }));
$('rules-button').addEventListener('click',() => $('rules-dialog').showModal());
$('refresh-client').addEventListener('click',() => location.reload());
document.addEventListener('visibilitychange',() => { if (!document.hidden) checkForClientUpdate(); });
$('money-button').addEventListener('click',openMoneyRecap);
$('leave-confirm').addEventListener('click',() => { $('leave-dialog').close(); send({ type:'leave' }); });
$('easy-confirm').addEventListener('click',() => {
  $('easy-dialog').close();
  if (easyPrompt === 'enable' && S && S.you === S.hostSeat) {
    easyConsentCode = S.code;
    if (!send({ type:'settings',easyMode:true,easyAcknowledged:true })) easyConsentCode = null;
  }
  easyPrompt = null;
});
$('undo-confirm').addEventListener('click',() => {
  $('undo-dialog').close();
  if (!undoTarget || !S || !S.settings.easyMode || !S.undo?.available || undoTarget.code !== S.code ||
    ['matchId','round','revision'].some(key => undoTarget[key] !== S[key]) || undoTarget.targetActionNo !== S.undo.targetActionNo) {
    undoTarget = null; return toast('Titik undo sudah berubah. Pilih Undo lagi.');
  }
  pending = true;
  if (!send({ type:'undo',...turnContext(),targetActionNo:undoTarget.targetActionNo })) pending = false;
  undoTarget = null; render();
});
function renderSound() { $('sound-button').textContent = sound ? '♪' : '♩'; $('sound-button').title = sound ? 'Suara aktif' : 'Suara mati'; $('sound-button').setAttribute('aria-label',sound ? 'Matikan suara' : 'Aktifkan suara'); }
$('sound-button').addEventListener('click',() => { sound = !sound; window.MejaRoom.setPrefs({sound}); storage.set('mejakita.capsa.sound',sound); warmAudio(); renderSound(); });
document.querySelector('.brand').addEventListener('click',event => { if (S) { event.preventDefault(); $('leave-dialog').showModal(); } });
document.addEventListener('keydown',event => {
  if (['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName) || document.querySelector('dialog[open]')) return;
  if (event.key === 'Escape') { selected.clear(); render(); }
  if (event.key === 'Enter' && myTurn() && selected.size) { event.preventDefault(); play(); }
});
renderComboExamples(); renderSound(); render(); connect();
setInterval(updateTurnClock,100);
setInterval(checkForClientUpdate,60000);
const pageVersion = document.querySelector('meta[name="capsa-build"]')?.content;
updateAvailable = !!pageVersion && pageVersion !== CLIENT_VERSION;
renderUpdateNotice();

document.addEventListener('meja-preferences',e=>{sound=e.detail.sound;renderSound();});

function historyDelta(row){const id=S.players[S.you]?.id;const index=row.people?row.people.findIndex(p=>p.id===id):S.you;return index>=0?row.delta[index]||0:0;}
