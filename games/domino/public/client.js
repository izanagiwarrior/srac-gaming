'use strict';
const $ = id => document.getElementById(id), T = window.DominoTiles;
const safe = { get(key,fallback = null) { try { return JSON.parse(sessionStorage.getItem('mejakita.domino.' + key)) ?? fallback; } catch { return fallback; } }, set(key,value) { try { if (value === null) sessionStorage.removeItem('mejakita.domino.' + key); else sessionStorage.setItem('mejakita.domino.' + key,JSON.stringify(value)); } catch {} } };
const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let saved = safe.get('seat') || window.MejaRoom.saved('domino'), S = null, ws, connected = false, replaced = false, pending = false, selected = null, toastTimer;
let enteredName = '', enteredCode = new URLSearchParams(location.search).get('room') || '', seats = 4, fillBots = true, chatDraft = '';
try { enteredName = window.MejaRoom.name(localStorage.getItem('mejakita.domino.name') || ''); } catch {}
const mine = () => connected && S?.phase === 'playing' && S.ready && S.turnId === S.you && !S.spectator && !pending;
function toast(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'),4500); }
function send(msg) { if(!window.MejaRoom.outgoing(msg))return false; if (ws?.readyState !== 1) { toast('Koneksi belum siap. Tunggu sebentar.'); return false; } ws.send(JSON.stringify(msg)); return true; }
function connect() {
  ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/domino/ws');
  ws.onopen = () => {
    connected = true; render();
    window.MejaRoom.connected(saved,send,target => { enteredCode=target; render(); });
  };
  ws.onmessage = event => {
    let msg; try { msg = JSON.parse(event.data); } catch { return; }
    if(window.MejaRoom.receive(msg,send))return;
    if (msg.type === 'joined') { saved = { code:msg.code,token:msg.token,id:msg.id }; safe.set('seat',saved); history.replaceState(null,'','/domino/?room=' + msg.code); }
    if (msg.type === 'state') {
      if (!S || S.matchId !== msg.matchId || S.revision !== msg.revision || S.phase !== msg.phase) selected = null;
      S = msg; pending = false; render();
    }
    if (msg.type === 'error') { pending = false; if (msg.fatal) leaveLocal(); else render(); toast(msg.message); }
    if (msg.type === 'left') leaveLocal();
    if (msg.type === 'replaced') { replaced = true; S = null; saved = null; safe.set('seat',null); pending = false; render(); toast('Sesi dibuka di tab lain.'); }
  };
  ws.onclose = () => { window.MejaRoom.disconnected(); connected = false; pending = false; render(); if (!replaced) setTimeout(connect,1800); };
  ws.onerror = () => ws.close();
}
function leaveLocal() { S = null; saved = null; selected = null; pending = false; chatDraft = ''; safe.set('seat',null); history.replaceState(null,'','/domino/'); if ($('leave-dialog').open) $('leave-dialog').close(); render(); }
function button(text,action,kind = '',disabled = false) { return `<button type="button" class="button ${kind}" data-action="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`; }
function landing() {
  return `<section class="welcome"><div><span class="eyebrow">DOMINO GAPLE · MEJA KITA</span><h1>Satu batu.<br><em>Nyambung terus.</em></h1><p>Balak enam turun, obrolan jalan. Sambung angka di ujung meja dan habiskan batumu sebelum temanmu.</p><form id="entry-form" class="panel entry-panel"><label for="name">Nama panggilan</label><input id="name" maxlength="24" autocomplete="nickname" placeholder="Kamu mau dipanggil siapa?" value="${esc(enteredName)}" required><div class="settings-row"><div><label for="seats">Jumlah kursi</label><select id="seats">${[2,3,4].map(n => `<option value="${n}" ${seats === n ? 'selected' : ''}>${n} pemain</option>`).join('')}</select></div><div><label for="bots">Kursi kosong</label><select id="bots"><option value="true" ${fillBots ? 'selected' : ''}>Isi bot saat mulai</option><option value="false" ${!fillBots ? 'selected' : ''}>Tunggu teman</option></select></div></div>${button('Buat room Gaple ↗','create','primary full',!connected || pending)}<div class="divider"><span>sudah punya room?</span></div><label for="code">Kode room</label><div class="join-row"><input id="code" maxlength="6" autocomplete="off" placeholder="ABCD" value="${esc(enteredCode)}">${button('Gabung →','join','',!connected || pending)}</div><small>Bot mengisi kursi yang kosong ketika host mulai. Teman tetap bisa masuk sebelum ronde dimulai.</small></form></div><div class="welcome-art"><div class="art-label"><span>28 BATU. BANYAK CERITA.</span><span>DOUBLE-SIX</span></div><div class="tile-still-life"><div class="art-tile art-one">${T.svg(6,6)}</div><div class="art-tile art-two">${T.svg(6,3)}</div><div class="art-tile art-three">${T.svg(3,1)}</div><span class="orbit"></span></div><div class="art-bottom"><span class="rule-line"></span> KIRI COCOK. KANAN COCOK. GAS.</div></div></section><section class="features"><div><b>01</b><h3>Tujuh batu di tangan.</h3><p>28 batu double-six, dibagikan untuk 2–4 orang.</p></div><div><b>02</b><h3>Pilih ujungmu.</h3><p>Klik batu, lalu sambung di kiri atau kanan.</p></div><div><b>03</b><h3>Habis duluan, menang.</h3><p>Meja buntu? Sisa titik paling sedikit menang.</p></div></section>`;
}
function inviteURL() {
  const local = ['localhost','127.0.0.1','[::1]'].includes(location.hostname), origin = local && S.addresses?.[0] ? S.addresses[0] : location.origin;
  return origin + '/domino/?room=' + S.code;
}
function seatsHTML() {
  return Array.from({ length:S.seats },(_,i) => {
    const p = S.players[i], active = S.phase === 'playing' && p?.id === S.turnId;
    return `<div class="player ${active ? 'active' : ''} ${p?.id === S.you ? 'you' : ''}"><span class="avatar">${p ? p.bot ? '⠿' : esc(p.name[0].toUpperCase()) : '+'}</span><div><strong>${p ? esc(p.name) + (p.id === S.you ? ' · kamu' : '') : 'Kursi ' + (i+1)}</strong><small>${p ? p.bot ? 'BOT' : p.connected ? 'PEMAIN' : 'TERPUTUS' : S.fillBots ? 'BOT JIKA KOSONG' : 'MENUNGGU TEMAN'}</small></div><span class="tile-count">${p && S.phase !== 'lobby' ? p.count : '—'}<small>BATU</small></span><div class="player-bottom"><span>${active ? '● Giliran' : p ? p.wins + ' kemenangan' : 'Bagikan link room'}</span>${p && S.phase !== 'lobby' ? '<i class="tile-back"></i><i class="tile-back"></i><i class="tile-back"></i>' : ''}</div></div>`;
  }).join('');
}
function chainHTML() {
  if (!S.chain.length) {
    const opener = S.starter?.split('-').map(Number), current = S.players.find(p => p.id === S.turnId);
    return `<div class="empty-table">${opener ? `<span class="opening-tile">${T.svg(...opener)}</span><h2>Buka dengan ${opener.join('–')}.</h2><p>${esc(current?.name)} memegang pembuka ronde ini.</p>` : `<div class="table-symbol">⠿</div><h2>${S.players.length === S.seats || S.fillBots ? 'Mejanya menunggu.' : 'Panggil teman dulu.'}</h2><p>Setiap pemain mendapat 7 batu.<br>Balak tertinggi yang dibagikan membuka ronde.</p>`}</div>`;
  }
  return `<div class="ends"><span>UJUNG KIRI <b>${S.chain[0].left}</b></span><small>Rantai dibaca kiri → kanan, lalu baris berikutnya</small><span>UJUNG KANAN <b>${S.chain.at(-1).right}</b></span></div><div class="chain" role="list" aria-label="Batu di meja, berurutan kiri ke kanan">${S.chain.map((t,i) => `<div class="laid-tile ${t.left === t.right ? 'double' : ''}" role="listitem" title="${esc(t.name)} · ${t.left}–${t.right}"><span class="chain-number">${i+1}</span>${T.svg(t.left,t.right,true)}</div>`).join('')}</div>`;
}
function statusHTML() {
  const current = S.players.find(p => p.id === S.turnId);
  let title,copy;
  if (S.phase === 'lobby') {
    title = 'Tinggal mulai.';
    copy = S.fillBots ? 'Host mulai saat siap. Bot mengisi kursi yang masih kosong.' : 'Mulai setelah semua kursi terisi dan terhubung.';
  } else if (S.result) { title = S.result.names.map(esc).join(' & ') + ' menang!'; copy = esc(S.result.reason) + '. Satu ronde lagi?'; }
  else if (!connected || !S.ready) { title = 'Meja dijeda.'; copy = 'Menunggu pemain yang terputus kembali. Batu tetap tersimpan.'; }
  else { title = mine() ? 'Giliranmu.' : 'Giliran ' + esc(current?.name) + '.'; copy = pending ? 'Mengirim aksi…' : current?.bot ? 'Bot berpikir sebentar · jeda 3 detik.' : mine() ? !S.chain.length ? 'Pilih batu pembuka yang ditunjukkan di meja.' : S.canDraw ? 'Belum ada batu cocok. Ambil dari stok.' : S.canPass ? 'Tidak ada batu cocok dan stok habis. Kamu boleh lewat.' : 'Pilih batu, lalu sambung ke ujung kiri atau kanan.' : 'Sambil menunggu, lihat angka di kedua ujung meja.'; }
  return `<div class="status ${mine() ? 'mine' : ''} ${S.result ? 'result' : ''}"><span class="status-icon">${S.result ? '✦' : !S.ready && S.phase === 'playing' ? '⏸' : '⠿'}</span><div><h2>${title}</h2><p>${copy}</p></div><span class="stock-count">${S.stock}<small>STOK</small></span></div>`;
}
function handHTML() {
  if (S.spectator) return '<section class="panel hand-panel"><h3>Kamu menonton meja ini.</h3><p class="muted">Batu pemain tetap tertutup sampai ronde selesai.</p></section>';
  if (S.phase === 'lobby') return `<section class="panel hand-panel"><h3>${S.seats} kursi · ${S.fillBots ? 'bot mengisi kursi kosong' : 'main bersama teman'}</h3><p class="muted">Tujuh batu dibagikan saat mulai. ${S.seats < 4 ? 'Batu sisanya menjadi stok untuk diambil.' : 'Semua 28 batu dibagikan, tanpa stok.'}</p>${S.hostId === S.you ? button('Mulai ronde →','start','primary',!connected || pending || !S.players.every(p => p.connected) || !S.fillBots && S.players.length !== S.seats) : '<small>Menunggu host memulai.</small>'}<p class="invite-note">Teman buka <b>${esc(inviteURL().split('/domino/')[0])}</b>, pilih Domino, lalu masukkan kode <b>${S.code}</b>.</p></section>`;
  const tile = S.hand.find(t => t.id === selected), sides = S.legal.filter(m => m.id === selected).map(m => m.side);
  const mySides = mine() ? sides : [];
  return `<section class="panel hand-panel"><div class="panel-title"><h3>Batumu <span>· ${S.hand.length} tersisa</span></h3><small>${selected ? tile.a + '–' + tile.b + ' dipilih' : 'Klik untuk memilih'}</small></div><div class="hand">${S.hand.map(t => `<button type="button" class="hand-tile ${t.id === selected ? 'selected' : ''} ${mine() && S.legal.some(m => m.id === t.id) ? 'playable' : ''}" data-tile="${t.id}" aria-label="Batu ${t.a} dan ${t.b}" aria-pressed="${t.id === selected}">${T.svg(t.a,t.b)}<span>${t.a}–${t.b}</span></button>`).join('') || '<p class="muted">Semua batu sudah turun.</p>'}</div>${S.phase === 'playing' ? `<div class="hand-actions"><span class="selection-note">${tile ? sides.length ? !S.chain.length ? 'Batu pembuka siap turun.' : 'Pilih ujung yang cocok.' : 'Batu ini belum cocok di ujung meja.' : 'Balak atau biasa, yang penting angkanya cocok.'}</span><div class="button-row">${!S.chain.length ? button('Turunkan pembuka ↑','play-right','primary',!mySides.includes('right')) : button('← Sambung kiri','play-left','primary',!mySides.includes('left')) + button('Sambung kanan →','play-right','primary',!mySides.includes('right'))}${S.stock > 0 ? button('Ambil stok','draw','ghost',!mine() || !S.canDraw) : button('Lewat','pass','ghost',!mine() || !S.canPass)}</div></div>` : button(S.rematch.includes(S.you) ? 'Menunggu pemain lain…' : S.quickComplete?'Quick Play baru · 1 ronde ↻':'Main ronde berikutnya ↻','rematch','primary',!connected || pending || !S.ready || S.rematch.includes(S.you))}</section>`;
}
function recapHTML() {
  return `<section class="panel recap"><div class="panel-title"><h3>Rekap meja</h3><span>${S.round} ronde</span></div>${S.players.map(p => `<div class="recap-row"><div><strong>${esc(p.name)}</strong><small>${S.phase === 'finished' ? p.count + ' batu · ' + p.pips + ' titik tersisa' : p.bot ? 'Bot latihan' : 'Pemain'}</small></div><b>${p.wins}<small>MENANG</small></b></div>${S.phase === 'finished' && p.hand.length ? `<div class="revealed-hand">${p.hand.map(t => `<span title="${t.a}–${t.b}">${T.svg(t.a,t.b)}</span>`).join('')}</div>` : ''}`).join('')}<small>Rekap poin bernilai sesuai pengaturan rupiah lobby. Seri buntu: kemenangan bersama.</small></section>`;
}
function roomHTML() {
  return `<section class="room-heading"><div><span class="eyebrow">DOMINO GAPLE · ${S.spectator ? 'PENONTON' : S.seats + ' PEMAIN'}</span><h1>${S.round ? 'Ronde ' + S.round + '.' : 'Meja sudah dibuka.'}</h1>${S.settings.playMode==='quick'?'<p class="mk-note">Quick Play · satu ronde'+(S.quickComplete?' selesai. Mulai lagi untuk sesi baru.':'.')+'</p>':''}</div><div class="button-row">${button(S.code + ' ↗','copy-link','small')}${button('Keluar','leave','small ghost',!connected)}</div></section><div class="game-layout"><section class="table-area">${S.phase==='lobby'?MejaTools.settings({slug:'domino',settings:S.settings,host:S.hostId===S.you&&!S.spectator,lobby:true}):''}<div class="players">${seatsHTML()}</div><div class="domino-table">${chainHTML()}<div class="table-foot"><span>${S.chain.length} batu di meja</span><span>GILIRAN SESUAI URUTAN KURSI ↻</span></div></div>${statusHTML()}${handHTML()}</section>${tableSidebar()}</div>`;
}
function tableSidebar(){return MejaTools.sidebar('domino',{
 connected,chat:S.chat,log:S.events,players:S.players,rate:S.settings.pointValue,ledger:S.ledger,cheat:'<div class="mk-domino-visual">'+T.svg(6,6,true)+T.svg(6,3,true)+T.svg(3,1,true)+'</div>'+MejaTools.cheat('domino'),
 recapExtra:S.phase==='finished'?S.players.map(p=>'<p class="mk-note">'+esc(p.name)+' · '+p.wins+' kemenangan · '+p.pips+' titik tersisa</p><div class="mk-domino-visual">'+(p.hand || []).map(t=>T.svg(t.a,t.b,true)).join('')+'</div>').join(''):'',settings:S.settings,host:S.hostId===S.you&&!S.spectator,lobby:S.phase==='lobby',formula:'Yang kalah kehilangan poin sesuai titik tersisa. Jumlahnya diterima pemenang; seri dibagi rata, sisa 1 poin menurut urutan kursi. Total meja nol.',
 onChat:text=>send({type:'chat',text}),onSettings:settings=>send({type:'settings',settings})
});}
function render() {
  const focused = document.activeElement?.id, cursor = document.activeElement?.selectionStart;
  const chat = document.querySelector('.chat-list'), chatTop = chat?.scrollTop, chatBottom = chat ? chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 25 : true;
  $('connection').textContent = replaced ? 'Sesi berpindah tab' : connected ? '● Terhubung' : 'Menghubungkan kembali…';
  $('view').innerHTML = S ? roomHTML() : landing();
  const nextChat = document.querySelector('.chat-list'); if (nextChat) nextChat.scrollTop = chatBottom ? nextChat.scrollHeight : chatTop || 0;
  if (focused && $(focused)) { $(focused).focus({preventScroll:true}); if (typeof cursor === 'number' && $(focused).setSelectionRange) $(focused).setSelectionRange(cursor,cursor); }
  document.title = S ? `Gaple · ${S.code} · Meja Kita` : 'Domino Gaple · Meja Kita';
}
function entry(create) {
  if (!enteredName.trim()) { $('name').reportValidity(); $('name').focus(); return; }
  if (!create && !enteredCode.trim()) { toast('Isi kode room temanmu.'); $('code').focus(); return; }
  try { localStorage.setItem('mejakita.domino.name',enteredName.trim()); } catch {}
  pending = send(create ? { type:'create',name:enteredName,seats,fillBots } : { type:'join',name:enteredName,code:enteredCode }); render();
}
function act(type,extra = {}) {
  if (!S || pending) return;
  pending = send({ type,matchId:S.matchId,revision:S.revision,...(type==='start'?{settings:MejaTools.readSettings()}:{}),...extra }); render();
}
document.addEventListener('input',event => {
  if (event.target.id === 'name') enteredName = event.target.value;
  if (event.target.id === 'code') enteredCode = event.target.value.toUpperCase();
  if (event.target.id === 'chat-input') chatDraft = event.target.value;
});
document.addEventListener('change',event => {
  if (event.target.id === 'seats') seats = Number(event.target.value);
  if (event.target.id === 'bots') fillBots = event.target.value === 'true';
});
document.addEventListener('submit',event => {
  if (event.target.id === 'entry-form') { event.preventDefault(); entry(true); }
  if (event.target.id === 'chat-form') { event.preventDefault(); if (chatDraft.trim() && send({ type:'chat',text:chatDraft })) { chatDraft = ''; $('chat-input').value = ''; } }
});
$('view').addEventListener('click',async event => {
  const tile = event.target.closest('[data-tile]');
  if (tile) { selected = selected === tile.dataset.tile ? null : tile.dataset.tile; render(); return; }
  const action = event.target.closest('[data-action]')?.dataset.action; if (!action) return;
  if (action === 'create' || action === 'join') return entry(action === 'create');
  if (action === 'copy-link') { try { await navigator.clipboard.writeText(inviteURL()); toast('Link room tersalin. Bagikan ke teman.'); } catch { toast(inviteURL()); } return; }
  if (action === 'leave') { $('leave-copy').textContent = S.spectator || S.phase === 'lobby' ? 'Kamu bisa membuat room baru atau bergabung kembali.' : 'Kursimu dan batu yang tersisa akan dilanjutkan bot. Pemain lain tetap bermain.'; $('leave-dialog').showModal(); return; }
  if (action === 'play-left' || action === 'play-right') { if (!mine()) return; return act('play',{id:selected,side:action === 'play-left' ? 'left' : 'right'}); }
  if (['draw','pass'].includes(action) && !mine()) return;
  if (['start','rematch','draw','pass'].includes(action)) act(action);
});
$('leave-confirm').addEventListener('click',() => { $('leave-dialog').close(); act('leave'); });
$('rules-button').addEventListener('click',() => $('rules-dialog').showModal());
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click',() => button.closest('dialog').close()));
$('rules-example').innerHTML = T.svg(6,6,true) + T.svg(6,3,true) + T.svg(3,1,true);
render(); connect();
