'use strict';
(function () {
  const creators = { capsa:'Faiz T',mahjong:'Hendy W',poker:'Hendy W',catur:'Faiz T',domino:'Faiz T',blackjack:'Faiz T' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const idr = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n || 0);
  const SUITS = {s:'♠',h:'♥',d:'♦',c:'♣'};
  const CHAT_EMOJIS=[['👍','Jempol'],['😂','Tertawa'],['😭','Menangis'],['🔥','Api'],['😱','Kaget'],['🙏','Terima kasih'],['🀄','Mahjong'],['☕','Kopi'],['👋','Sapaan'],['👏','Tepuk tangan'],['😅','Senyum'],['❤️','Hati']];
  const isEmote = text => CHAT_EMOJIS.some(([symbol])=>symbol===text);
  function emojiBar(data={}){return data.emojiChat!==false?`<div class="mk-emoji-bar" role="group" aria-label="Emoji chat">${CHAT_EMOJIS.map(([symbol,label])=>`<button type="button" data-mk-emoji="${symbol}" aria-label="Kirim emoji ${label}" title="${label}" ${data.connected===false?'disabled':''}>${symbol}</button>`).join('')}</div>`:'';}
  let emojiMenu=null,emojiFrame=null;
  function emojiPicker(data={}){
    return data.emojiChat!==false?`<button type="button" class="mk-emoji-toggle" data-mk-emoji-toggle aria-label="Menu emoji" title="${emojiMenu?'Tutup':'Buka'} menu emoji" aria-expanded="${!!emojiMenu}" aria-controls="mk-emoji-menu" ${data.connected===false?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8 14c1 4 7 4 8 0M8 9h.01M16 9h.01"></path></svg></button>`:'';
  }
  function visibleEmojiToggle(){return [...document.querySelectorAll('[data-mk-emoji-toggle]')].find(el=>el.getClientRects().length);}
  function syncEmojiToggle(){for(const el of document.querySelectorAll('[data-mk-emoji-toggle]')){el.setAttribute('aria-expanded',String(!!emojiMenu));el.title=(emojiMenu?'Tutup':'Buka')+' menu emoji';}}
  function closeEmojiMenu(focus='none'){
    if(emojiFrame!==null)cancelAnimationFrame(emojiFrame);emojiFrame=null;
    const wasOpen=!!emojiMenu;emojiMenu?.remove();emojiMenu=null;syncEmojiToggle();
    const toggle=visibleEmojiToggle(),target=focus==='input'?toggle?.closest('form')?.querySelector('input'):focus==='toggle'?toggle:null;
    if(wasOpen&&target&&!target.disabled)target.focus({preventScroll:true});
  }
  function placeEmojiMenu(){
    emojiFrame=null;if(!emojiMenu)return;
    const toggle=visibleEmojiToggle();if(!toggle||toggle.disabled){closeEmojiMenu();return;}
    const gap=8,pad=12,r=toggle.getBoundingClientRect();
    emojiMenu.style.maxHeight=Math.max(100,innerHeight-pad*2)+'px';
    const box=emojiMenu.getBoundingClientRect(),above=r.top-gap-box.height,below=r.bottom+gap;
    const top=above>=pad?above:below+box.height<=innerHeight-pad?below:Math.max(pad,Math.min(above,innerHeight-box.height-pad));
    emojiMenu.style.top=top+'px';emojiMenu.style.left=Math.max(pad,Math.min(r.right-box.width,innerWidth-box.width-pad))+'px';
    syncEmojiToggle();
  }
  function queueEmojiMenu(){if(emojiMenu&&emojiFrame===null)emojiFrame=requestAnimationFrame(placeEmojiMenu);}
  function openEmojiMenu(){
    if(emojiMenu){closeEmojiMenu();return;}
    emojiMenu=document.createElement('div');emojiMenu.id='mk-emoji-menu';emojiMenu.className='mk-emoji-popover';emojiMenu.setAttribute('role','group');emojiMenu.setAttribute('aria-label','Pilihan emoji');
    emojiMenu.innerHTML='<div class="mk-emoji-popover-heading"><b>Pilih emoji</b><button type="button" data-mk-emoji-close aria-label="Tutup pilihan emoji">×</button></div>'+emojiBar();
    document.body.append(emojiMenu);placeEmojiMenu();emojiMenu?.querySelector('[data-mk-emoji]')?.focus({preventScroll:true});
  }
  const EMOTE_STAGES={capsa:'.bt-table',mahjong:'#game .table',poker:'.table-shell',catur:'.board-area .board',domino:'.domino-table',blackjack:'.bj-table'};
  const FEEDBACK_COLUMNS={capsa:'#view',mahjong:'#lobby .lcol',poker:'.mk-layout > div',catur:'.board-area',domino:'.table-area',blackjack:'.mk-layout > section'};
  let emoteRoom=null,emotesReady=false,emoteLayer=null,emoteFrame=null,emoteUndo=null;
  const seenEmotes=new Set(),bursts=new Map();
  let floatingLayer=null,floatingFrame=null;
  const floatingChats=new Map();
  function clearFloatingChats(){
    if(floatingFrame!==null)cancelAnimationFrame(floatingFrame);floatingFrame=null;
    for(const timer of floatingChats.values())clearTimeout(timer);floatingChats.clear();
    floatingLayer?.remove();floatingLayer=null;
  }
  function clearFeedback(reset=false){clearEmotes(reset);clearFloatingChats();closeEmojiMenu();}
  function clearEmotes(reset=false){
    if(emoteFrame!==null)cancelAnimationFrame(emoteFrame);emoteFrame=null;
    for(const timer of bursts.values())clearTimeout(timer);bursts.clear();
    emoteLayer?.remove();emoteLayer=null;
    if(reset){seenEmotes.clear();emotesReady=false;emoteRoom=null;emoteUndo=null;clearFloatingChats();closeEmojiMenu();}
  }
  function rememberEmote(message){
    if(typeof message?.id!=='string'||!message.id||message.id.length>100)return false;
    if(seenEmotes.has(message.id))return false;
    seenEmotes.add(message.id);
    while(seenEmotes.size>256)seenEmotes.delete(seenEmotes.values().next().value);
    return true;
  }
  function emoteBounds(){
    const slug=location.pathname.split('/')[1];
    const visible=selector=>[...document.querySelectorAll(selector)].find(el=>el.getClientRects().length);
    const stage=visible(EMOTE_STAGES[slug]||'[data-mk-emote-stage]')||visible(FEEDBACK_COLUMNS[slug]||'[data-mk-feedback-column]');
    const r=stage?.getBoundingClientRect();
    const left=r?Math.max(0,r.left):0,right=r?Math.min(innerWidth,r.right):innerWidth;
    let top=r?Math.max(0,r.top):Math.min(110,innerHeight*.16),bottom=r?Math.min(innerHeight,r.bottom):innerHeight;
    // Keep the table's horizontal column when its board has scrolled above the chat.
    if(bottom-top<Math.min(200,innerHeight*.4)){top=Math.min(110,innerHeight*.16);bottom=innerHeight-20;}
    if(right-left<80||bottom-top<80)return null;
    return {left,top,width:right-left,height:bottom-top};
  }
  function placeEmotes(){
    emoteFrame=null;if(!emoteLayer)return;
    const bounds=emoteBounds();if(!bounds){clearEmotes();return;}
    for(const [key,value] of Object.entries(bounds))emoteLayer.style[key]=value+'px';
  }
  function queueEmotePosition(){if(emoteLayer&&emoteFrame===null)emoteFrame=requestAnimationFrame(placeEmotes);}
  function placeFloatingChats(){
    floatingFrame=null;if(!floatingLayer)return;
    const bounds=emoteBounds();if(!bounds){clearFloatingChats();return;}
    for(const [key,value] of Object.entries(bounds))floatingLayer.style[key]=value+'px';
    const limit=bounds.height<360?2:3;
    while(floatingChats.size>limit){const old=floatingChats.keys().next().value;clearTimeout(floatingChats.get(old));floatingChats.delete(old);old.remove();}
    const occupied=new Set([...floatingChats.keys()].map(b=>Number(b.dataset.slot)).filter(slot=>slot<limit));
    for(const bubble of floatingChats.keys()){
      let slot=Number(bubble.dataset.slot);
      if(slot>=limit){slot=[0,1,2].find(n=>n<limit&&!occupied.has(n));bubble.dataset.slot=String(slot);occupied.add(slot);}
      const height=bubble.getBoundingClientRect().height;
      const y=bounds.height*(limit === 2 ? .76-slot*.4 : .78-slot*.29)-height/2;
      bubble.style.top=Math.max(38,Math.min(bounds.height-height-10,y))+'px';
    }
  }
  function queueFloatingPosition(){if(floatingLayer&&floatingFrame===null)floatingFrame=requestAnimationFrame(placeFloatingChats);}
  function showFloatingChat(message){
    const author=message.name??message.from,text=String(message.text||'').trim();
    if(document.hidden||typeof author!=='string'||!author.trim()||!text)return;
    const reduced=window.MejaRoom?.preferences().reduced??matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!floatingLayer){floatingLayer=document.createElement('div');floatingLayer.className='mk-floating-chat-layer';floatingLayer.setAttribute('aria-hidden','true');document.body.append(floatingLayer);}
    while(floatingChats.size>=(reduced?1:3)){const old=floatingChats.keys().next().value;clearTimeout(floatingChats.get(old));floatingChats.delete(old);old.remove();}
    const bubble=document.createElement('div');bubble.className='mk-floating-chat'+(reduced?' mk-floating-chat-still':'');bubble.dir='auto';
    const occupied=new Set([...floatingChats.keys()].map(b=>Number(b.dataset.slot)));bubble.dataset.slot=String([0,1,2].find(n=>!occupied.has(n)));
    const name=document.createElement('b');name.textContent=author.slice(0,24);
    const body=document.createElement('span');body.textContent=text.slice(0,240);
    bubble.append(name,body);floatingLayer.append(bubble);
    floatingChats.set(bubble,setTimeout(()=>{floatingChats.delete(bubble);bubble.remove();if(!floatingChats.size)clearFloatingChats();},reduced?4000:5000));
    queueFloatingPosition();
  }
  function showMessageFeedback(message){
    if(message.emoji&&isEmote(message.text))showEmote(message);
    else showFloatingChat(message);
  }
  function showEmote(message){
    if(document.hidden||!isEmote(message.text))return;
    const reduced=window.MejaRoom?.preferences().reduced??matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!emoteLayer){emoteLayer=document.createElement('div');emoteLayer.className='mk-emote-layer';emoteLayer.setAttribute('aria-hidden','true');document.body.append(emoteLayer);}
    const limit=reduced?1:3;
    while(bursts.size>=limit){const old=bursts.keys().next().value;clearTimeout(bursts.get(old));bursts.delete(old);old.remove();}
    const burst=document.createElement('div');burst.className='mk-emote-burst'+(reduced?' mk-emote-still':'');
    const main=document.createElement('span');main.className='mk-emote-main';main.textContent=message.text;burst.append(main);
    for(const old of bursts.keys())old.querySelector('.mk-emote-sender')?.remove();
    const name=document.createElement('span');name.className='mk-emote-sender';name.textContent=String(message.name||message.from||'Pemain').slice(0,24);burst.append(name);
    if(!reduced){
      for(let i=0;i<2;i++){const ring=document.createElement('i');ring.className='mk-emote-ring';ring.style.setProperty('--emote-delay',i*180+'ms');burst.append(ring);}
      for(let i=0;i<12;i++){
        const particle=document.createElement('span'),angle=i*Math.PI/6;
        particle.className='mk-emote-particle';particle.textContent=i%3===0?'✦':message.text;
        particle.style.setProperty('--emote-x',Math.cos(angle)*(30+i%3*8)+'%');
        particle.style.setProperty('--emote-y',Math.sin(angle)*(29+i%4*5)+'%');
        particle.style.setProperty('--emote-spin',(i%2?1:-1)*(12+i*6)+'deg');
        particle.style.setProperty('--emote-delay',i%4*65+'ms');burst.append(particle);
      }
    }
    emoteLayer.append(burst);queueEmotePosition();
    bursts.set(burst,setTimeout(()=>{bursts.delete(burst);burst.remove();if(!bursts.size)clearEmotes();},reduced?1500:3100));
  }
  function receiveEmotes(message){
    if(['left','replaced'].includes(message.type)){clearEmotes(true);return;}
    if(message.type==='joined'){clearEmotes(true);emoteRoom=message.code;return;}
    if(message.type==='chat_history'){
      for(const m of message.chat||[])rememberEmote(m);emotesReady=true;return;
    }
    if(message.type==='chat'){
      const m=message.msg;
      if(emotesReady&&rememberEmote(m))showMessageFeedback(m);
      return;
    }
    if(!['lobby','state'].includes(message.type))return;
    if(message.code!==emoteRoom){clearEmotes(true);emoteRoom=message.code;}
    const undo=location.pathname.startsWith('/capsa/')?JSON.stringify(message.lastUndo||null):null;
    const rollback=undo!==null&&emoteUndo!==null&&undo!==emoteUndo;
    const first=!emotesReady||rollback;emotesReady=true;emoteUndo=undo;
    if(rollback)clearFeedback();
    for(const m of message.chat||[]){const fresh=rememberEmote(m);if(!first&&fresh)showMessageFeedback(m);}
    queueEmotePosition();queueFloatingPosition();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearFeedback();});
  document.addEventListener('meja-preferences',()=>clearFeedback());
  document.addEventListener('meja-theme',()=>clearFeedback());
  addEventListener('resize',()=>{queueEmotePosition();queueFloatingPosition();queueEmojiMenu();});
  addEventListener('scroll',()=>{queueEmotePosition();queueFloatingPosition();queueEmojiMenu();},{passive:true,capture:true});
  let current = {}, draft = '';
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
  function durationSettings(slug,s,disabled) {
    if(slug==='catur')return `<label>Mode main<select data-mk-clock-mode ${disabled}>${[['casual','Santai · tanpa jam'],['blitz5','Quick Play · Blitz 5+0'],['blitz3plus2','Blitz 3+2 · tambah 2 detik/langkah']].map(([value,label])=>`<option value="${value}" ${(s.clockMode||'casual')===value?'selected':''}>${label}</option>`).join('')}</select></label><p class="mk-note">Blitz: waktu per pemain, dihitung server. Jam dijeda saat pemain terputus atau sesi dipulihkan. Pilihan terkunci sejak mulai.</p>`;
    if(['domino','blackjack'].includes(slug))return `<label>Durasi permainan<select data-mk-play-mode ${disabled}>${[['standard','Santai · ronde bebas'],['quick','Quick Play · 1 ronde']].map(([value,label])=>`<option value="${value}" ${(s.playMode||'standard')===value?'selected':''}>${label}</option>`).join('')}</select></label><p class="mk-note">${s.playMode==='quick'?'Satu ronde lalu tampil rekap selesai. Quick Play baru harus dimulai lagi secara eksplisit; saldo tetap tercatat.':'Setiap ronde selesai sebelum host/pemain memilih main lagi.'}</p>`;
    return '';
  }
  function settings(data) {
    const s=data.settings || {}, disabled=data.host && data.lobby ? '' : 'disabled';
    return `<section class="mk-panel"><h3>Pengaturan meja</h3>${durationSettings(data.slug,s,disabled)}<label>Nilai 1 ${data.unit || 'poin'} dalam rupiah<input data-mk-rate type="number" min="0" max="1000000" step="1" value="${s.pointValue || 0}" ${disabled}></label><label>Tingkat bot<select data-mk-level ${disabled}>${[['easy','Easy'],['normal','Normal'],['hard','Hard']].map(([value,name])=>`<option value="${value}" ${s.botLevel===value?'selected':''}>${name}</option>`).join('')}</select></label><small>0 = latihan. Otomatis tersimpan sebelum mulai; terkunci saat permainan berjalan. Semua bot jeda minimal 3 detik.</small>${data.formula ? `<p class="mk-note">${esc(data.formula)}</p>` : ''}</section>`;
  }
  function recap(data) {
    return `<section class="mk-panel" data-mk-recap><div class="mk-heading"><h3>Rekap poin & rupiah</h3><button type="button" data-mk-csv>CSV ↓</button></div><p class="mk-note">1 ${data.unit || 'poin'} = ${idr(data.rate)} · nilai simulasi</p><div class="mk-balances">${(data.players || []).map(p=>`<div><span>${esc(p.name)}${p.outside?' · di luar kursi':''}${p.bot&&!/(?:[·(]\s*bot\)?)$/i.test(String(p.name))?' · bot':''}${p.totalBuyIn!==undefined?'<small>Stack '+Number(p.stack).toLocaleString('id-ID')+' · bought '+Number(p.totalBuyIn).toLocaleString('id-ID')+'</small>':''}</span><b>${Number(p.score || 0).toLocaleString('id-ID')}<small>${idr(p.net ?? (p.score || 0)*data.rate)}</small></b></div>`).join('')}</div>${data.recapExtra || ''}</section>`;
  }
  function sidebar(slug,data) {
    const bank=window.MejaRoom?.bank()||[];data={...data,players:[...(data.players||[]),...bank.filter(p=>!(data.players||[]).some(q=>q.id===p.id)).map(p=>({...p,score:p.points,outside:true}))]};
    const visibleSidebar=()=>[...document.querySelectorAll('.mk-sidebar')].find(el=>el.getClientRects().length);
    const previous=visibleSidebar(),active=document.activeElement;
    const old=previous?.querySelector('.mk-chat'),top=old?.scrollTop||0,bottom=!old||old.scrollHeight-old.scrollTop-old.clientHeight<30;
    const scrolls={sidebar:previous?.scrollTop||0,cheat:previous?.querySelector('.mk-cheat')?.scrollTop||0,log:previous?.querySelector('.mk-log')?.scrollTop||0};
    const focusSelector=active?.matches('#mk-chat-input')?'#mk-chat-input':active?.matches('[data-mk-rate]')?'[data-mk-rate]':active?.matches('[data-mk-level]')?'[data-mk-level]':active?.matches('[data-mk-play-mode]')?'[data-mk-play-mode]':active?.matches('[data-mk-clock-mode]')?'[data-mk-clock-mode]':null;
    const focus=focusSelector?{selector:focusSelector,value:active.value,start:active.selectionStart,end:active.selectionEnd}:null;
    queueMicrotask(()=>{
      const next=visibleSidebar();if(!next)return;
      queueEmojiMenu();
      next.scrollTop=scrolls.sidebar;
      const chat=next.querySelector('.mk-chat');if(chat)chat.scrollTop=bottom?chat.scrollHeight:top;
      const cheatPanel=next.querySelector('.mk-cheat'),log=next.querySelector('.mk-log');
      if(cheatPanel)cheatPanel.scrollTop=scrolls.cheat;if(log)log.scrollTop=scrolls.log;
      const input=focus&&next.querySelector(focus.selector);
      if(input&&!input.disabled){input.value=focus.value;input.focus({preventScroll:true});if(typeof focus.start==='number')try{input.setSelectionRange(focus.start,focus.end);}catch{}}
    });
    current={...data,slug};
    return `<aside class="mk-sidebar" aria-label="Panel meja"><section class="mk-panel"><h3>Chat meja</h3><div class="mk-chat" role="log">${(data.chat || []).map(m=>`<p${m.emoji?' class="mk-chat-emoji"':''}>${m.name ? `<b>${esc(m.name)}</b> ` : ''}${esc(m.text)}</p>`).join('') || '<p class="mk-note">Sapa temanmu di meja.</p>'}</div><form data-mk-chat><input id="mk-chat-input" aria-label="Pesan chat" maxlength="200" placeholder="Ngobrol dulu…" value="${esc(draft)}" ${data.connected===false?'disabled':''}>${emojiPicker(data)}<button type="submit">Kirim</button></form></section><section class="mk-panel"><h3>Cheat sheet</h3><div class="mk-cheat">${data.cheat || cheat(slug)}</div></section>${data.extra || ''}${recap(data)}<section class="mk-panel"><h3>Log permainan</h3><div class="mk-log" role="log">${(data.log || []).slice(-80).reverse().map(m=>`<p>${esc(typeof m==='string'?m:m.text || m.t)}</p>`).join('') || '<p class="mk-note">Belum ada langkah.</p>'}</div></section>${data.settings ? settings({...data,slug}) : ''}</aside>`;
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
  document.addEventListener('change',event=>{if(event.target.matches('[data-mk-rate],[data-mk-level],[data-mk-play-mode],[data-mk-clock-mode]')){current.onSettings?.(readSettings(event.target.closest('.mk-panel')));}});
  document.addEventListener('click',event=>{
    const toggle=event.target.closest('[data-mk-emoji-toggle]');if(toggle){if(!toggle.disabled)openEmojiMenu();return;}
    if(event.target.closest('[data-mk-emoji-close]')){closeEmojiMenu('toggle');return;}
    const emoji=event.target.closest('[data-mk-emoji]');if(emoji){if(!emoji.disabled&&isEmote(emoji.dataset.mkEmoji)){window.MejaRoom?.emote(emoji.dataset.mkEmoji);closeEmojiMenu('input');}return;}
    if(emojiMenu&&!emojiMenu.contains(event.target))closeEmojiMenu();
    if(event.target.closest('[data-mk-csv]'))exportCSV();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&emojiMenu){event.preventDefault();event.stopImmediatePropagation();closeEmojiMenu('toggle');}});
  document.addEventListener('focusin',event=>{if(emojiMenu&&!emojiMenu.contains(event.target)&&!event.target.closest('[data-mk-emoji-toggle]'))closeEmojiMenu();});
  document.addEventListener('DOMContentLoaded',()=>{const slug=location.pathname.split('/')[1];const credit=document.querySelector('.hubbar>span');if(credit&&creators[slug])credit.textContent='Creator: '+creators[slug]+' · MEJA KITA';});
  function readSettings(scope=document){const rate=scope.querySelector('[data-mk-rate]'),level=scope.querySelector('[data-mk-level]'),play=scope.querySelector('[data-mk-play-mode]'),clock=scope.querySelector('[data-mk-clock-mode]');return rate&&level?{pointValue:Number(rate.value),botLevel:level.value,...(play?{playMode:play.value}:{}),...(clock?{clockMode:clock.value}:{})}:{};}
  window.MejaTools={emojiBar,emojiPicker,isEmote,receiveEmotes,clearEmotes:clearFeedback,sidebar,settings,recap,cheat,card,esc,idr,creators,exportCSV,readSettings};
})();
