'use strict';
const $ = id => document.getElementById(id), P = window.ChessPieces;
const safe = { get(key,backup = null) { try { return JSON.parse(sessionStorage.getItem('mejakita.catur.' + key)) ?? backup; } catch { return backup; } }, set(key,value) { try { if (value === null) sessionStorage.removeItem('mejakita.catur.' + key); else sessionStorage.setItem('mejakita.catur.' + key,JSON.stringify(value)); } catch {} } };
let saved = safe.get('seat') || window.MejaRoom.saved('catur'), S = null, ws, connected = false, replaced = false, selected = null, flipped = false, pending = false, promotionMove = null, confirmAction = null, toastTimer, clockReceivedAt = performance.now();
let enteredName = '', enteredCode = new URLSearchParams(location.search).get('room') || '', practice = false, chatDraft = '';
try { enteredName = window.MejaRoom.name(localStorage.getItem('mejakita.catur.name') || ''); } catch {}
const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const colorName = color => color === 'w' ? 'Putih' : 'Hitam';
const me = () => S?.players.find(p => p.id === S.you);
const mine = () => connected && S?.phase === 'playing' && S.ready && !S.spectator && S.turn === S.yourColor && !pending;
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'),4000); }
function send(msg) { if(!window.MejaRoom.outgoing(msg))return false; if (ws?.readyState !== 1) { toast('Koneksi belum siap. Tunggu sebentar.'); return false; } ws.send(JSON.stringify(msg)); return true; }
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/catur/ws');
  ws.onopen = () => {
    connected = true; render();
    window.MejaRoom.connected(saved,send,target => { enteredCode=target; render(); });
  };
  ws.onmessage = event => {
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if(window.MejaRoom.receive(msg,send))return;
    if (msg.type === 'joined') { saved = { code:msg.code, token:msg.token, id:msg.id }; safe.set('seat',saved); history.replaceState(null,'','/catur/?room=' + msg.code); }
    if (msg.type === 'state') {
      if (!S || S.ply !== msg.ply || S.matchId !== msg.matchId || S.phase !== msg.phase) { selected = null; promotionMove = null; if ($('promotion').open) $('promotion').close(); }
      if (!S || S.yourColor !== msg.yourColor) flipped = msg.yourColor === 'b';
      S = msg; clockReceivedAt = performance.now(); pending = false; render();
    }
    if (msg.type === 'error') { pending = false; if (msg.fatal) leaveLocal(); else render(); toast(msg.message); }
    if (msg.type === 'left') leaveLocal();
    if (msg.type === 'replaced') { replaced = true; saved = null; safe.set('seat',null); S = null; toast('Sesi dibuka di tab lain.'); render(); }
  };
  ws.onclose = () => { window.MejaRoom.disconnected(); if(S?.clock){S.clock.remaining={w:clockMs('w'),b:clockMs('b')};S.clock.active=null;} connected = false; pending = false; if ($('promotion').open) $('promotion').close(); render(); if (!replaced) setTimeout(connect,1800); };
  ws.onerror = () => ws.close();
}
function leaveLocal() { S = null; selected = null; saved = null; pending = false; promotionMove = null; chatDraft = ''; safe.set('seat',null); history.replaceState(null,'','/catur/'); for (const id of ['promotion','confirm-dialog']) if ($(id).open) $(id).close(); render(); }
function button(text,action,kind = '',disabled = false) { return `<button class="button ${kind}" data-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`; }
function samplePieces() {
  return 'rnbqkbnr'.split('').map((type,i) => ({ square:'abcdefgh'[i] + '8', type, color:'b' })).concat('abcdefgh'.split('').map(f => ({ square:f+'7',type:'p',color:'b' })), 'abcdefgh'.split('').map(f => ({ square:f+'2',type:'p',color:'w' })), 'rnbqkbnr'.split('').map((type,i) => ({ square:'abcdefgh'[i] + '1',type,color:'w' })));
}
function boardHTML(sample = false) {
  const pieces = sample ? samplePieces() : S.board, squares = [];
  const legal = sample || !selected ? [] : S.legalMoves.filter(m => m.from === selected);
  const files = flipped && !sample ? 'hgfedcba' : 'abcdefgh';
  const ranks = flipped && !sample ? '12345678' : '87654321';
  for (let ri = 0; ri < 8; ri++) for (let fi = 0; fi < 8; fi++) {
    const square = files[fi] + ranks[ri], piece = pieces.find(p => p.square === square);
    const isLegal = legal.some(m => m.to === square), last = !sample && (S.lastMove?.from === square || S.lastMove?.to === square);
    const check = !sample && S.phase === 'playing' && S.check && piece?.type === 'k' && piece.color === S.turn;
    const label = square + (piece ? ', ' + P.names[piece.type] + ' ' + colorName(piece.color) : ', kosong') + (isLegal ? ', tujuan sah' : '');
    const attrs = sample ? 'tabindex="-1" disabled' : `data-square="${square}" aria-pressed="${selected === square}"`;
    squares.push(`<button class="square ${(ri+fi)%2 ? 'dark' : 'light'} ${last ? 'last' : ''} ${selected === square && !sample ? 'selected' : ''} ${check ? 'checked' : ''}" ${attrs} aria-label="${label}">${piece ? P.svg(piece.type,piece.color) : ''}${isLegal ? `<span class="${piece ? 'capture-ring' : 'move-dot'}"></span>` : ''}${fi === 0 ? `<span class="rank-label">${ranks[ri]}</span>` : ''}${ri === 7 ? `<span class="file-label">${files[fi]}</span>` : ''}</button>`);
  }
  return `<div class="board ${sample ? 'sample-board' : ''}" role="group" aria-label="Papan catur${sample ? ' contoh' : ''}">${squares.join('')}</div>`;
}
function landing() {
  return `<section class="welcome"><div><span class="eyebrow">CATUR · MEJA KITA</span><h1>Satu langkah.<br><em>Seribu kemungkinan.</em></h1><p>Panggil teman, pilih bidak, dan pikirkan langkah berikutnya. Main berdua atau pemanasan melawan bot.</p><form id="entry-form" class="panel entry-panel"><label for="name">Nama panggilan</label><input id="name" maxlength="24" autocomplete="nickname" placeholder="Kamu mau dipanggil siapa?" value="${esc(enteredName)}" required><label for="practice">Meja baru</label><select id="practice"><option value="false" ${!practice ? 'selected' : ''}>Main berdua · undang teman</option><option value="true" ${practice ? 'selected' : ''}>Latihan · lawan bot</option></select>${button('Buat room catur ↗','create','primary full',!connected || pending)}<div class="divider"><span>sudah punya room?</span></div><label for="code">Kode room</label><div class="join-row"><input id="code" value="${esc(enteredCode)}" maxlength="6" autocomplete="off" placeholder="ABCD">${button('Gabung →','join','',!connected || pending)}</div><small>Room penuh atau sedang berjalan? Kamu bisa menonton.</small></form></div><div class="welcome-board"><div class="board-caption"><span>PUTIH MULAI DULU</span><span>♔</span></div>${boardHTML(true)}<div class="sample-caption">64 petak. Giliranmu menentukan ceritanya.</div></div></section><section class="features"><div><b>01</b><h3>Bidak, lalu tujuan.</h3><p>Petak bertanda titik menunjukkan langkah yang sah.</p></div><div><b>02</b><h3>Santai atau Blitz.</h3><p>Pilih tanpa jam, Blitz 5+0, atau 3+2. Bot tetap menunggu 3 detik tiap giliran.</p></div><div><b>03</b><h3>Sampai skakmat.</h3><p>Rokade, en passant, promosi, dan remis tersedia.</p></div></section>`;
}
function inviteURL() {
  const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname), origin = local && S.addresses?.[0] ? S.addresses[0] : location.origin;
  return origin + '/catur/?room=' + S.code;
}
function clockMs(color) {
  if(!S?.clock)return 0;
  const elapsed=S.clock.active===color&&connected?Math.max(0,performance.now()-clockReceivedAt):0;
  return Math.max(0,S.clock.remaining[color]-elapsed);
}
function clockText(ms) {
  const seconds=Math.ceil(ms/1000);
  return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function updateClocks() {
  for(const node of document.querySelectorAll('[data-chess-clock]')) {
    const color=node.dataset.chessClock,ms=clockMs(color);
    node.textContent=clockText(ms);
    node.dataset.active=String(!!connected&&S.clock.active===color);
    node.dataset.low=String(ms<=30000);
  }
}
setInterval(updateClocks,200);
function playerHTML(color) {
  const player = S.players.find(p => p.color === color), active = S.phase === 'playing' && S.turn === color;
  return `<div class="player-strip ${active ? 'active' : ''}"><span class="player-icon">${P.svg('k',color)}</span><div><strong>${player ? esc(player.name) + (player.id === S.you ? ' · kamu' : '') : 'Kursi ' + colorName(color)}</strong><small>${colorName(color)} · ${player ? player.left ? 'Sudah keluar' : player.bot ? 'Bot latihan' : player.connected ? 'Terhubung' : 'Terputus · menunggu kembali' : 'Menunggu teman'}</small></div>${active ? '<span class="turn-pill">Giliran</span>' : ''}${S.clock?`<time class="chess-clock" data-chess-clock="${color}" data-active="${connected&&S.clock.active===color}" data-low="${clockMs(color)<=30000}" aria-label="Sisa waktu ${colorName(color)}" aria-live="off">${clockText(clockMs(color))}</time>`:''}</div>`;
}
function statusHTML() {
  if (S.result) return `<div class="status result"><span class="status-icon">${S.result.winner ? '♔' : '½'}</span><div><h2>${S.result.winner ? esc(S.result.name) + ' menang.' : 'Berakhir remis.'}</h2><p>${esc(S.result.reason)}. ${S.rematch.length ? 'Menunggu persetujuan main lagi.' : 'Satu pertandingan lagi?'}</p></div></div>`;
  if (S.phase === 'lobby') return `<div class="status"><span class="status-icon">♟</span><div><h2>${S.ready ? 'Mejanya siap.' : 'Menunggu lawan.'}</h2><p>${S.ready ? 'Host dapat memulai. Putih melangkah dulu.' : 'Bagikan link room, lalu mulai saat teman sudah masuk.'}</p></div></div>`;
  if (!connected || !S.ready) return '<div class="status offline"><span class="status-icon">⏸</span><div><h2>Papan dijeda.</h2><p>Menunggu kedua pemain terhubung kembali. Posisi tetap tersimpan di server.</p></div></div>';
  const current = S.players.find(p => p.color === S.turn);
  return `<div class="status ${mine() ? 'mine' : ''} ${S.check ? 'check' : ''}"><span class="status-icon">${S.check ? '!' : '♟'}</span><div><h2>${S.check ? 'Skak! ' : ''}${mine() ? 'Giliranmu.' : 'Giliran ' + esc(current.name) + '.'}</h2><p>${pending ? 'Mengirim langkah…' : current.bot ? 'Bot berpikir sebentar · jeda 3 detik.' : mine() ? selected ? 'Pilih petak tujuan bertanda titik.' : 'Klik bidakmu untuk memilih langkah.' : S.spectator ? 'Kamu menonton. Semua langkah muncul langsung.' : 'Sambil menunggu, lihat rencana di papan.'}</p></div></div>`;
}
function historyHTML() {
  if (!S.history.length) return '<p class="muted empty-history">Belum ada langkah. Putih membuka permainan.</p>';
  let html = ''; for (let i = 0; i < S.history.length; i += 2) html += `<div class="move-row"><span>${Math.floor(i/2)+1}.</span><b>${esc(S.history[i])}</b><b>${esc(S.history[i+1] || '—')}</b></div>`;
  return html;
}
function capturedHTML() {
  const taken = { w:[], b:[] }, initial = { p:8,n:2,b:2,r:2,q:1,k:1 };
  // PGN moves are authoritative; the board material is only a compact visual summary.
  for (const color of ['w','b']) for (const [type,count] of Object.entries(initial)) {
    const remaining = S.board.filter(p => p.color === color && p.type === type).length;
    for (let i = 0; i < Math.max(0,count - remaining); i++) taken[color].push(P.svg(type,color));
  }
  return `<div class="material"><span>Bidak yang tidak ada di papan</span><div>${taken.w.join('') || '—'}</div><div>${taken.b.join('') || '—'}</div><small>Promosi dapat mengubah jumlah bidak.</small></div>`;
}
function roomHTML() {
  let controls = '';
  if (S.phase === 'lobby') controls = S.hostId === S.you ? button('Mulai permainan →','start','primary full',!connected || !S.ready) : '<p class="muted">Menunggu host memulai permainan.</p>';
  else if (S.phase === 'finished' && !S.spectator) controls = button(S.rematch.includes(S.you) ? 'Menunggu lawan…' : 'Main lagi · tukar warna ↻','rematch','primary full',!connected || !S.ready || S.rematch.includes(S.you));
  else if (S.phase === 'playing' && !S.spectator) controls = `<div class="button-row">${!S.practice ? button(S.drawOffer?.color === S.yourColor ? 'Batalkan remis' : 'Tawarkan remis',S.drawOffer?.color === S.yourColor ? 'withdraw-draw' : 'draw','ghost',!connected || !S.ready || !!S.drawOffer && S.drawOffer.color !== S.yourColor) : ''}${button('Menyerah','resign','ghost',!connected)}</div>`;
  const offer = S.drawOffer ? S.drawOffer.color === S.yourColor ? '<div class="draw-offer">Tawaran remis dikirim. Menunggu jawaban lawan.</div>' : `<div class="draw-offer"><p>${esc(S.drawOffer.name)} menawarkan remis.</p>${!S.spectator ? `<div class="button-row">${button('Terima','accept-draw','primary',!connected)}${button('Lanjut main','decline-draw','ghost',!connected)}</div>` : ''}</div>` : '';
  return `<section class="room-heading"><div><span class="eyebrow">MEJA CATUR · ${S.spectator ? 'PENONTON' : S.practice ? 'LATIHAN' : 'MAIN BERDUA'}</span><h1>Langkah berikutnya.</h1><p class="clock-mode-note">${esc(S.clock?.label||'Santai · tanpa jam')}${S.clock?' · jam dijeda saat pemain terputus':''}</p></div><div class="button-row">${button(S.code + ' ↗','copy-link','small')}${button('Keluar','leave','small ghost',!connected)}</div></section><div class="game-layout"><section class="board-area">${S.phase==='lobby'?MejaTools.settings({slug:'catur',settings:S.settings,host:S.hostId===S.you&&!S.spectator,lobby:true}):''}${statusHTML()}<section class="panel action-panel mk-lobby-settings">${controls}${offer}</section>${playerHTML(flipped ? 'w' : 'b')}${boardHTML()}${playerHTML(flipped ? 'b' : 'w')}<div class="board-tools"><span>${S.spectator ? 'Menonton' : 'Kamu memegang ' + colorName(S.yourColor)} · ${S.spectators} penonton</span>${button('Putar papan ↻','flip','small ghost')}</div>${S.history.length?capturedHTML():''}</section>${tableSidebar()}</div>`;
}
function tableSidebar(){return MejaTools.sidebar('catur',{
 connected,chat:S.chat,log:S.history.map((m,i)=>(Math.floor(i/2)+1)+(i%2?'… ':'. ')+m),players:S.players,rate:S.settings.pointValue,ledger:S.ledger,
 settings:S.settings,host:S.hostId===S.you&&!S.spectator,lobby:S.phase==='lobby',formula:'Menang +1 poin, kalah −1 poin, remis 0. Menyerah/keluar saat bermain dihitung kalah. Rekap berlanjut saat main lagi.',
 recapExtra:button('PGN ↓','pgn','small ghost',!S.history.length),onChat:text=>send({type:'chat',text}),onSettings:settings=>send({type:'settings',settings})
});}
function render() {
  const active = document.activeElement?.id, cursor = active === 'chat-input' ? document.activeElement.selectionStart : null;
  const oldChat = document.querySelector('.chat-list'), oldMoves = document.querySelector('.move-list');
  const chatBottom = !oldChat || oldChat.scrollHeight - oldChat.clientHeight - oldChat.scrollTop < 40, chatScroll = oldChat?.scrollTop || 0, moveScroll = oldMoves?.scrollTop || 0, moveBottom = !oldMoves || oldMoves.scrollHeight - oldMoves.clientHeight - oldMoves.scrollTop < 40;
  $('connection').textContent = replaced ? 'Sesi dibuka di tab lain' : connected ? '● Terhubung' : 'Menyambungkan…';
  $('connection').classList.toggle('online',connected);
  $('view').innerHTML = S ? roomHTML() : landing();
  const chat = document.querySelector('.chat-list'), moves = document.querySelector('.move-list');
  if (chat) chat.scrollTop = chatBottom ? chat.scrollHeight : chatScroll;
  if (moves) moves.scrollTop = moveBottom ? moves.scrollHeight : moveScroll;
  if (active === 'chat-input' && $('chat-input')) { $('chat-input').focus(); if (cursor !== null) $('chat-input').setSelectionRange(cursor,cursor); }
  document.title = S ? `Catur · ${S.code} · Meja Kita` : 'Catur · Meja Kita';
}
function confirm(title,copy,action) { confirmAction = action; $('confirm-title').textContent = title; $('confirm-copy').textContent = copy; $('confirm-action').textContent = action === 'resign' ? 'Ya, menyerah' : 'Keluar room'; $('confirm-dialog').showModal(); }
function moveTo(from,to,promotion) { if (!mine()) return; pending = true; selected = null; send({ type:'move', from,to,promotion,matchId:S.matchId,ply:S.ply }); render(); }
function chooseSquare(square) {
  if (!mine()) { toast(S?.spectator ? 'Kamu sedang menonton.' : S?.phase === 'lobby' ? 'Mulai permainan dulu.' : 'Tunggu giliranmu.'); return; }
  const piece = S.board.find(p => p.square === square);
  if (selected === square) { selected = null; render(); return; }
  if (selected) {
    const choices = S.legalMoves.filter(m => m.from === selected && m.to === square);
    if (choices.length) {
      if (choices.some(m => m.promotion)) {
        promotionMove = { from:selected,to:square,matchId:S.matchId,ply:S.ply };
        $('promotion-choices').innerHTML = ['q','r','b','n'].map(type => `<button data-promote="${type}" aria-label="Promosi menjadi ${P.names[type]}">${P.svg(type,S.yourColor)}<span>${P.names[type]}</span></button>`).join(''); $('promotion').showModal();
      } else moveTo(selected,square);
      return;
    }
  }
  selected = piece?.color === S.yourColor ? square : null; render();
}
async function copyLink() { try { await navigator.clipboard.writeText(inviteURL()); toast('Link room tersalin. Bagikan ke teman.'); } catch { toast(inviteURL()); } }
function downloadPGN() { const blob = new Blob([S.pgn + '\n'],{type:'application/x-chess-pgn'}), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'catur-' + S.code + '.pgn'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000); }
function entry(create) {
  if (!enteredName.trim()) { $('name').reportValidity(); $('name').focus(); return; }
  try { localStorage.setItem('mejakita.catur.name',enteredName.trim()); } catch {}
  if (!create && !enteredCode.trim()) { toast('Isi kode room temanmu.'); $('code').focus(); return; }
  pending = send(create ? { type:'create',name:enteredName,practice } : { type:'join',name:enteredName,code:enteredCode }); render();
}
document.addEventListener('input',event => {
  if (event.target.id === 'name') enteredName = event.target.value;
  if (event.target.id === 'code') enteredCode = event.target.value.toUpperCase();
  if (event.target.id === 'chat-input') chatDraft = event.target.value;
});
document.addEventListener('change',event => { if (event.target.id === 'practice') practice = event.target.value === 'true'; });
document.addEventListener('submit',event => {
  if (event.target.id === 'entry-form') { event.preventDefault(); entry(true); }
  if (event.target.id === 'chat-form') { event.preventDefault(); if (chatDraft.trim() && send({ type:'chat',text:chatDraft })) { chatDraft = ''; $('chat-input').value = ''; } }
});
$('view').addEventListener('click',event => {
  const square = event.target.closest('[data-square]'); if (square) return chooseSquare(square.dataset.square);
  const action = event.target.closest('[data-action]')?.dataset.action; if (!action) return;
  if (action === 'create') return; // handled by the entry form submit
  if (action === 'join') { event.preventDefault(); return entry(false); }
  if (action === 'flip') { flipped = !flipped; return render(); }
  if (action === 'copy-link') return copyLink();
  if (action === 'pgn') return downloadPGN();
  if (action === 'resign') return confirm('Menyerah sekarang?','Lawanmu akan dinyatakan menang.','resign');
  if (action === 'leave') return confirm('Keluar dari meja?',S.phase === 'playing' && !S.spectator ? 'Keluar saat bermain berarti menyerah. Lawanmu akan menang.' : 'Kamu bisa membuat room baru setelah keluar.','leave');
  send({ type:action,...(action==='start'?{settings:MejaTools.readSettings()}: {}) });
});
$('promotion-choices').addEventListener('click',event => {
  const type = event.target.closest('[data-promote]')?.dataset.promote, move = promotionMove;
  if (!type || !move) return;
  $('promotion').close(); promotionMove = null;
  if (S.matchId === move.matchId && S.ply === move.ply) moveTo(move.from,move.to,type);
});
$('confirm-action').addEventListener('click',() => { $('confirm-dialog').close(); if (confirmAction) send({ type:confirmAction }); confirmAction = null; });
document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click',() => b.closest('dialog').close()));
$('rules-button').addEventListener('click',() => $('rules-dialog').showModal());
$('piece-guide').innerHTML = Object.entries({ p:'Maju satu; dari awal boleh dua. Mengambil diagonal.',n:'Melangkah bentuk L dan bisa melompati bidak.',b:'Diagonal sejauh jalur kosong.',r:'Lurus sejauh jalur kosong.',q:'Lurus atau diagonal sejauh jalur kosong.',k:'Satu petak ke arah mana saja, tanpa masuk skak.' }).map(([type,text]) => `<div>${P.svg(type,'w')}<p><strong>${P.names[type]}</strong><span>${text}</span></p></div>`).join('');
render(); connect();
