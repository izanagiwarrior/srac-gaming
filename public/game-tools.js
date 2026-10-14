'use strict';
(function () {
  const creators = { capsa:'Faiz T',mahjong:'Hendy W',poker:'Hendy W',catur:'Faiz T',domino:'Faiz T',blackjack:'Faiz T' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const idr = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n || 0);
  const SUITS = {s:'♠',h:'♥',d:'♦',c:'♣'};
  let current = {}, draft = '', logScroll = 0, chatScroll = 0;
  function card(c) {
    if (!c) return '<span class="mk-card back" aria-label="Kartu tertutup">✦</span>';
    const rank = ({11:'J',12:'Q',13:'K',14:'A'}[c.r] || c.r);
    return `<span class="mk-card ${'hd'.includes(c.s) ? 'red' : ''}" aria-label="${rank}${SUITS[c.s]}"><b>${rank}</b><i>${SUITS[c.s]}</i></span>`;
  }
  const parseCards = s => s.split(' ').map(c => ({r:'23456789TJQKA'.indexOf(c[0])+2,s:c[1]}));
  const pokerRanks = [
    ['Royal flush','Th Jh Qh Kh Ah','Straight flush tertinggi'],['Straight flush','8s 9s Ts Js Qs','5 urut, satu simbol'],
    ['Four of a kind','7d 7c 7h 7s Kd','4 angka sama + 1'],['Full house','6d 6c 6h 9s 9d','Three of a kind + pair'],
    ['Flush','3h 6h 8h Jh Kh','5 satu simbol'],['Straight','4d 5c 6h 7s 8d','5 urut'],
    ['Three of a kind','8d 8c 8h Ks 2d','3 angka sama'],['Two pair','Jd Jc 4h 4s Ad','Dua pair'],
    ['One pair','Qd Qc 3h 6s 9d','Satu pair'],['High card','Ad Jc 8h 6s 3d','Bandingkan angka tertinggi']
  ];
  function cheat(slug) {
    if (slug === 'poker') return pokerRanks.map((r,i) => `<div class="mk-rank"><b>${i+1}. ${r[0]}</b><small>${r[2]}</small><div class="mk-cards">${parseCards(r[1]).map(card).join('')}</div></div>`).join('') + '<p class="mk-note">Tinggi → rendah. Ambil 5 terbaik dari 7 kartu. Simbol setara; A2345 straight terendah. Kicker memecah seri.</p>';
    if (slug === 'catur') return `<div class="mk-piece-grid">${[['♔','Raja','1 petak'],['♕','Menteri','Lurus + diagonal'],['♖','Benteng','Lurus'],['♗','Gajah','Diagonal'],['♘','Kuda','Bentuk L, melompat'],['♙','Pion','Maju, makan diagonal']].map(p => `<div><span>${p[0]}</span><b>${p[1]}</b><small>${p[2]}</small></div>`).join('')}</div><p class="mk-note">Skak: lindungi raja. Skakmat: tidak ada jalan keluar. Rokade membutuhkan jalur aman; en passant hanya langsung setelah pion maju dua petak. Promosi di baris terakhir.</p>`;
    if (slug === 'domino') return '<div class="mk-domino-example">[ 6 | 6 ] → [ 6 | 3 ] → [ 3 | 1 ]</div><p class="mk-note">Cocokkan angka ujung. Pembuka: balak tertinggi yang dibagikan. Tidak cocok: ambil stok; lewat jika stok habis. Habis batu menang; buntu: sisa titik paling sedikit. Yang kalah kehilangan poin sesuai titik tersisa; pemenang menerima jumlahnya.</p>';
    if (slug === 'blackjack') return `<div class="mk-cards">${parseCards('As Kh').map(card).join('')}<strong>= 21</strong></div><div class="mk-rule-list"><p><b>A</b> = 1 atau 11 · <b>J/Q/K</b> = 10</p><p><b>Hit</b> ambil · <b>Stand</b> cukup</p><p><b>Double</b> gandakan taruhan chip, ambil 1 kartu</p><p><b>Split</b> pisahkan pair menjadi 2 tangan</p></div><p class="mk-note">Semua melawan dealer. Dealer stand pada 17 termasuk soft 17. Blackjack 2 kartu membayar 3:2; menang biasa 1:1; seri kembali. Split sekali; split A hanya 1 tambahan. Chip dan rupiah hanya pencatatan permainan.</p>`;
    return '';
  }
  function settings(data) {
    const s=data.settings || {}, disabled=data.host && data.lobby ? '' : 'disabled';
    return `<section class="mk-panel"><h3>Pengaturan meja</h3><label>Nilai 1 ${data.unit || 'poin'} dalam rupiah<input data-mk-rate type="number" min="0" max="1000000" step="1" value="${s.pointValue || 0}" ${disabled}></label><label>Tingkat bot<select data-mk-level ${disabled}>${[['easy','Easy'],['normal','Normal'],['hard','Hard']].map(([value,name])=>`<option value="${value}" ${s.botLevel===value?'selected':''}>${name}</option>`).join('')}</select></label><small>0 = latihan. Otomatis tersimpan sebelum mulai; terkunci saat permainan berjalan. Semua bot jeda minimal 3 detik.</small>${data.formula ? `<p class="mk-note">${esc(data.formula)}</p>` : ''}</section>`;
  }
  function recap(data) {
    return `<section class="mk-panel" data-mk-recap><div class="mk-heading"><h3>Rekap poin & rupiah</h3><button type="button" data-mk-csv>CSV ↓</button></div><p class="mk-note">1 ${data.unit || 'poin'} = ${idr(data.rate)} · nilai simulasi</p><div class="mk-balances">${(data.players || []).map(p=>`<div><span>${esc(p.name)}${p.bot?' · bot':''}${p.totalBuyIn!==undefined?'<small>Stack '+Number(p.stack).toLocaleString('id-ID')+' · bought '+Number(p.totalBuyIn).toLocaleString('id-ID')+'</small>':''}</span><b>${Number(p.score || 0).toLocaleString('id-ID')}<small>${idr(p.net ?? (p.score || 0)*data.rate)}</small></b></div>`).join('')}</div>${data.recapExtra || ''}</section>`;
  }
  function sidebar(slug,data) {
    const active=document.activeElement,focused=active?.id==='mk-chat-input',cursor=active?.selectionStart,old=document.querySelector('.mk-chat'),top=old?.scrollTop||0,bottom=!old||old.scrollHeight-old.scrollTop-old.clientHeight<30;
    queueMicrotask(()=>{const next=document.querySelector('.mk-chat');if(next)next.scrollTop=bottom?next.scrollHeight:top;const input=document.getElementById('mk-chat-input');if(focused&&input){input.focus({preventScroll:true});if(typeof cursor==='number')input.setSelectionRange(cursor,cursor);}});
    current={...data,slug};
    return `<aside class="mk-sidebar" aria-label="Panel meja"><section class="mk-panel"><h3>Chat meja</h3><div class="mk-chat" role="log">${(data.chat || []).map(m=>`<p>${m.name ? `<b>${esc(m.name)}</b> ` : ''}${esc(m.text)}</p>`).join('') || '<p class="mk-note">Sapa temanmu di meja.</p>'}</div><form data-mk-chat><input id="mk-chat-input" aria-label="Pesan chat" maxlength="200" placeholder="Ngobrol dulu…" value="${esc(draft)}" ${data.connected===false?'disabled':''}><button>Kirim</button></form></section><section class="mk-panel"><h3>Cheat sheet</h3><div class="mk-cheat">${data.cheat || cheat(slug)}</div></section>${data.extra || ''}${recap(data)}<section class="mk-panel"><h3>Log permainan</h3><div class="mk-log" role="log">${(data.log || []).slice(-80).reverse().map(m=>`<p>${esc(typeof m==='string'?m:m.text || m.t)}</p>`).join('') || '<p class="mk-note">Belum ada langkah.</p>'}</div></section>${data.settings ? settings(data) : ''}</aside>`;
  }
  function exportCSV(data=current) {
    const rows=[['Game',data.slug],['IDR per '+(data.unit || 'poin'),data.rate],[],['Pemain','Poin / chip net','Rupiah simulasi','Stack chip','Bought chips','Dalam pot'],...(data.players || []).map(p=>[p.name,p.score || 0,p.net ?? (p.score || 0)*data.rate,p.stack ?? '',p.totalBuyIn ?? '',p.contributed ?? ''])];
    if (data.ledger?.length) { rows.push([],['Riwayat hasil'],['Ronde','Pemain','Delta poin','Nilai rupiah']); for(const r of data.ledger) for(const p of r.players || [])rows.push([r.label,p.name,p.delta,p.amount]); }
    const cell=v=>{let s=String(v??'');if(typeof v==='string'&&/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));
    const a=document.createElement('a');a.href=url;a.download=(data.slug || 'meja')+'-rekap.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.addEventListener('input',event=>{if(event.target.id==='mk-chat-input')draft=event.target.value;});
  document.addEventListener('submit',event=>{if(!event.target.matches('[data-mk-chat]'))return;event.preventDefault();if(draft.trim()&&current.onChat?.(draft.trim())!==false){draft='';event.target.querySelector('input').value='';}});
  document.addEventListener('change',event=>{if(event.target.matches('[data-mk-rate],[data-mk-level]')){const panel=event.target.closest('.mk-panel');current.onSettings?.({pointValue:Number(panel.querySelector('[data-mk-rate]').value),botLevel:panel.querySelector('[data-mk-level]').value});}});
  document.addEventListener('click',event=>{if(event.target.closest('[data-mk-csv]'))exportCSV();});
  document.addEventListener('DOMContentLoaded',()=>{const slug=location.pathname.split('/')[1];const credit=document.querySelector('.hubbar>span');if(credit&&creators[slug])credit.textContent='Creator: '+creators[slug]+' · MEJA KITA';});
  function readSettings(){const rate=document.querySelector('[data-mk-rate]'),level=document.querySelector('[data-mk-level]');return rate&&level?{pointValue:Number(rate.value),botLevel:level.value}:{};}
  window.MejaTools={sidebar,settings,recap,cheat,card,esc,idr,creators,exportCSV,readSettings};
})();
