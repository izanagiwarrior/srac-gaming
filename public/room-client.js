'use strict';
(function(){
  const games=['capsa','mahjong','poker','catur','domino','blackjack'];
  const slug=location.pathname.split('/')[1],read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defaults={sound:false,volume:.35,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  let prefs={...defaults,...read('mejakita.preferences',{})},profile=read('mejakita.profile',{name:''}),seats=read('mejakita.saved-seats',{}),meta=null,sender=null,ownSeat=null,previous=null,context=null,unlocked=false;
  let toolbar,details,body,status,quickActions,sessionHealth,refreshRequired=false,refreshMessage='',tickQueued=false,lastMotion=false,folds=read('mejakita.panel-folds',{});
  let dissolveDialog=null,dissolveChoice=null,dissolveBusy=false,dissolveWait=null;
  const initialRoom=(new URLSearchParams(location.search).get('room')||'').trim().toUpperCase();
  let sessionSeat=null,sessionOnline=false,sessionAttached=false,sessionOpened=false,sessionEntry=null,sessionChoice=null,sessionDialog=null,sessionNotice=null,resuming=false,sessionWait=null;
  const money=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n||0);
  // A different invitation must not hide the seat that still belongs to this browser.
  function saved(game){seats=read('mejakita.saved-seats',{});return Object.values(seats[game]||{}).filter(p=>typeof p?.code==='string'&&typeof p?.token==='string'&&p.code&&p.token).sort((a,b)=>b.time-a.time)[0]||null;}
  function forgetSeat(seat){if(!seat)return;seats=read('mejakita.saved-seats',{});if(seats[slug]?.[seat.code]?.token===seat.token)delete seats[slug][seat.code];write('mejakita.saved-seats',seats);}
  function sessionConnected(seat,send,onEntry){
    sender=send;sessionEntry=onEntry;sessionOnline=true;sessionAttached=false;
    if(typeof seat?.code==='string'&&typeof seat?.token==='string'&&seat.code&&seat.token)sessionSeat={...seat,code:seat.code.toUpperCase()};
    if(!sessionOpened){sessionOpened=true;if(sessionSeat){if(initialRoom&&initialRoom===sessionSeat.code)resumeSession();else askSession(initialRoom);return;}}
    if(sessionChoice&&!sessionChoice.action){renderSession();return;}
    if(sessionSeat)resumeSession();else renderSession();
  }
  function sessionDisconnected(){if(dissolveBusy){dissolveBusy=false;clearTimeout(dissolveWait);dissolveFeedback('Koneksi terputus. Menunggu status room saat tersambung kembali.');}window.MejaTools?.clearEmotes(true);sessionOnline=false;sessionAttached=false;resuming=false;clearTimeout(sessionWait);renderSession();}
  function askSession(target=''){
    if(!sessionSeat)return;
    sessionChoice={code:sessionSeat.code,target:String(target||'').trim().toUpperCase(),action:null,phase:'prompt',error:''};
    mountSession();renderSession();if(!sessionDialog.open)sessionDialog.showModal();
  }
  function mountSession(){
    if(sessionDialog)return;
    sessionDialog=document.createElement('dialog');sessionDialog.className='mk-session-dialog';sessionDialog.setAttribute('aria-labelledby','mk-session-title');sessionDialog.setAttribute('aria-describedby','mk-session-description');
    sessionDialog.innerHTML='<div class="mk-session-kicker">SESI SEBELUMNYA</div><h2 id="mk-session-title">Lanjutkan atau ganti room?</h2><p id="mk-session-description"></p><p class="mk-session-explain">Kalau hanya terputus, lanjutkan sesi yang sama. Untuk pindah room, keluar dari sesi lama dulu.</p><p class="mk-session-warning"></p><p class="mk-session-progress" role="status" aria-live="polite"></p><div class="mk-session-actions"><button type="button" data-mk-session="continue"></button><button type="button" data-mk-session="leave"></button></div><button type="button" class="mk-session-refresh" data-mk-session="refresh" hidden>Refresh halaman & coba lagi</button><button type="button" class="mk-session-later" data-mk-session="later">Tutup dulu</button>';
    document.body.append(sessionDialog);
    sessionNotice=document.createElement('div');sessionNotice.className='mk-session-notice';sessionNotice.hidden=true;sessionNotice.innerHTML='<span></span><button type="button">Pilih sesi</button>';sessionNotice.querySelector('button').onclick=()=>{renderSession();sessionDialog.showModal();};
    (toolbar||document.body).append(sessionNotice);
    sessionDialog.addEventListener('click',e=>{const action=e.target.closest('[data-mk-session]')?.dataset.mkSession;if(!action)return;if(action==='refresh'){reloadSession();return;}if(action==='later'){sessionDialog.close();return;}if(!sessionOnline||!sessionChoice||['resume','leave'].includes(sessionChoice.phase))return;
      sessionChoice.action=action;sessionChoice.error='';
      if(action==='continue'&&sessionAttached){finishChoice();return;}
      if(action==='leave'&&sessionAttached)leaveSession();else resumeSession();
    });
    // Escape only dismisses the popup. It never releases or forgets the seat.
    sessionDialog.addEventListener('close',renderSession);
  }
  function renderSession(){
    if(!sessionDialog)return;
    if(!sessionChoice){sessionNotice.hidden=true;if(sessionDialog.open)sessionDialog.close();return;}
    sessionDialog.querySelector('[data-mk-session="refresh"]').hidden=!refreshRequired&&sessionChoice.phase!=='error';
    const {code,target,phase,error}=sessionChoice,busy=['resume','leave'].includes(phase),other=target&&target!==code;
    sessionDialog.querySelector('#mk-session-description').textContent=other?`Kamu membuka room ${target}, tetapi ada sesi tersimpan di room ${code}.`:`Ada sesi tersimpan di room ${code}. Mau melanjutkan sesi ini?`;
    sessionDialog.querySelector('.mk-session-warning').textContent=meta?.spectator?'Keluar akan mengakhiri sesi menontonmu.':slug==='catur'?'Jika partai masih berjalan, keluar dihitung menyerah.':slug==='poker'?'Jika tangan masih berjalan, kartu akan check/fold saat kamu keluar. Stack dan buy-in tetap tercatat di rekap.':'Jika ronde masih berjalan, kursimu diteruskan bot saat keluar. Hasil dan saldo yang sudah tercatat tetap ada di rekap.';
    const note=!sessionOnline?'Koneksi terputus. Sesi tetap disimpan; menunggu tersambung kembali.':error|| (phase==='resume'?`Menyambung ke room ${code}…`:phase==='leave'?'Menunggu konfirmasi keluar dari server…':'Belum ada room yang ditinggalkan.');
    sessionDialog.querySelector('.mk-session-progress').textContent=note;
    const stay=sessionDialog.querySelector('[data-mk-session="continue"]'),leave=sessionDialog.querySelector('[data-mk-session="leave"]');
    stay.textContent='Lanjutkan room '+code;leave.textContent=other?'Keluar dulu & pindah ke '+target:'Keluar dari sesi lama';stay.disabled=leave.disabled=!sessionOnline||busy;
    sessionNotice.hidden=false;sessionNotice.querySelector('span').textContent=`Sesi room ${code} ${busy?'sedang diproses.':'masih tersimpan.'}`;sessionNotice.querySelector('button').textContent=busy?'Lihat proses':'Pilih sesi';
  }
  function waitForSession(){clearTimeout(sessionWait);sessionWait=setTimeout(()=>{resuming=false;sessionError('Belum ada balasan server. Sesi tetap disimpan. Klik Lanjutkan untuk mencoba lagi, atau Refresh halaman.');},10000);}
  function resumeSession(){
    if(!sessionSeat||!sessionOnline)return;
    if(sessionChoice)sessionChoice.phase='resume';
    resuming=true;renderSession();
    if(sender({type:['capsa','mahjong'].includes(slug)?'rejoin':'resume',code:sessionSeat.code,token:sessionSeat.token})===false){resuming=false;sessionError('Tunggu aksi sebelumnya selesai, lalu pilih lagi.');return;}
    waitForSession();
  }
  function leaveSession(){
    if(!sessionOnline||!sessionAttached)return;
    sessionChoice.phase='leave';renderSession();
    if(sender({type:'leave'})===false){sessionError('Belum bisa keluar. Tunggu koneksi atau aksi sebelumnya selesai, lalu pilih lagi.');return;}
    waitForSession();
  }
  function sessionError(text){clearTimeout(sessionWait);if(!sessionChoice&&sessionSeat)askSession('');if(sessionChoice){sessionChoice.phase='error';sessionChoice.error=text;renderSession();}}
  function finishChoice(){clearTimeout(sessionWait);sessionChoice=null;renderSession();}
  function returnToEntry(target,note){
    // Native clients clear their state on the same message. Restore the destination afterwards.
    queueMicrotask(()=>{history.replaceState(null,'','/'+slug+'/'+(target?'?room='+encodeURIComponent(target):''));sessionEntry?.(target);announce(note);});
  }
  function sessionMessage(message){
    if(message.type==='joined'&&message.token){
      announce('');refreshRequired=false;refreshMessage='';renderSessionHealth();sessionSeat={code:message.code,token:message.token};sessionAttached=true;resuming=false;clearTimeout(sessionWait);
      if(sessionChoice?.action==='leave'){queueMicrotask(leaveSession);}else finishChoice();
    }
    if(message.type==='left'){
      const target=sessionChoice?.target||'',switched=sessionChoice?.action==='leave';
      forgetSeat(sessionSeat||ownSeat);sessionSeat=null;sessionAttached=false;resuming=false;finishChoice();
      if(message.dissolved)returnToEntry(target&&target!==message.code?target:'',message.message||'Room dibubarkan oleh host. Silakan buat atau gabung room lain.');
      else if(switched)returnToEntry(target,target?'Sudah keluar dari room lama. Klik Gabung untuk masuk room '+target+'.':'Sudah keluar dari sesi lama. Kamu bisa bergabung atau membuat room baru.');
    }
    if(message.type==='replaced'){
      // A second tab now owns the socket. Do not send a delayed leave from this tab.
      sessionOnline=false;sessionAttached=false;resuming=false;sessionSeat=null;finishChoice();meta=null;ownSeat=null;previous=null;renderControls();
    }
    if(message.type==='error'&&(resuming||sessionChoice?.phase==='leave')){
      resuming=false;
      if(message.sessionUnavailable){
        const target=message.dissolved?(sessionChoice?.target&&sessionChoice.target!==message.code?sessionChoice.target:''):sessionChoice?.target||initialRoom;forgetSeat(sessionSeat);sessionSeat=null;sessionAttached=false;finishChoice();meta=null;ownSeat=null;previous=null;renderControls();returnToEntry(target,'Sesi lama sudah tidak tersedia. Masukkan kode room untuk bergabung kembali.');
      }else{
        // Rate limits, version errors and transient failures do not prove the seat expired.
        sessionError(message.message||message.msg||'Sesi belum bisa dibuka. Coba lagi.');return true;
      }
    }
    return false;
  }
  function outgoing(message){
    if(message.name)remember(message.name);
    if(['create','join'].includes(message.type)&&sessionSeat){if(sessionChoice&&['resume','leave'].includes(sessionChoice.phase)){sessionDialog.showModal();return false;}askSession(message.type==='join'?message.code:'');return false;}
    if(['resume','rejoin'].includes(message.type)){sessionSeat={code:message.code,token:message.token};resuming=true;return true;}
    if(sessionChoice&&!['leave'].includes(message.type))return false;
    return true;
  }
  function dissolveFeedback(text){
    if(!dissolveDialog)return;
    dissolveDialog.querySelector('[data-mk-dissolve-status]').textContent=text;
    for(const button of dissolveDialog.querySelectorAll('button'))button.disabled=dissolveBusy;
  }
  function closeDissolve(){clearTimeout(dissolveWait);dissolveBusy=false;dissolveChoice=null;if(dissolveDialog?.open)dissolveDialog.close();}
  function openDissolve(){
    if(!meta?.host||!sessionOnline||!sessionAttached)return announce('Hanya host yang terhubung dapat membubarkan ruang.');
    if(!dissolveDialog){
      dissolveDialog=document.createElement('dialog');dissolveDialog.className='mk-session-dialog mk-dissolve-dialog';dissolveDialog.setAttribute('aria-labelledby','mk-dissolve-title');
      dissolveDialog.innerHTML='<div class="mk-session-kicker">KONTROL HOST</div><h2 id="mk-dissolve-title">Bubarkan ruang?</h2><p data-mk-dissolve-room></p><p>Semua pemain dan penonton akan kembali ke halaman masuk. Kode dan file pemulihan room ini tidak bisa dipakai lagi.</p><p class="mk-session-warning">Ronde yang masih berjalan dibatalkan tanpa menghitung hasil baru. Unduh rekap yang kamu perlukan sebelum membubarkan ruang.</p><p data-mk-dissolve-status role="status" aria-live="polite"></p><div class="mk-session-actions"><button type="button" data-mk-dissolve="cancel" autofocus>Batal · tetap main</button><button type="button" class="mk-danger" data-mk-dissolve="confirm">Ya, bubarkan ruang</button></div>';
      document.body.append(dissolveDialog);
      dissolveDialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
      dissolveDialog.addEventListener('cancel',e=>{e.stopPropagation();if(dissolveBusy)e.preventDefault();else closeDissolve();});
      dissolveDialog.addEventListener('close',()=>{if(!dissolveBusy)dissolveChoice=null;});
      dissolveDialog.addEventListener('click',e=>{const action=e.target.closest('[data-mk-dissolve]')?.dataset.mkDissolve;if(!action||dissolveBusy)return;
        if(action==='cancel'){closeDissolve();body?.querySelector('[data-mk-room="dissolve"]')?.focus({preventScroll:true});return;}
        if(!meta?.host||!sessionAttached||!sessionOnline||meta.code!==dissolveChoice?.code||meta.roomId!==dissolveChoice?.roomId){closeDissolve();announce('Room atau hak host sudah berubah. Buka kembali kontrol terbaru.');return;}
        if(command({type:'hub-dissolve',confirm:true,...dissolveChoice})===false){dissolveFeedback('Belum terkirim. Tunggu koneksi atau aksi sebelumnya selesai, lalu coba lagi.');return;}
        dissolveBusy=true;dissolveFeedback('Menunggu konfirmasi pembubaran dari server…');
        dissolveWait=setTimeout(()=>{dissolveBusy=false;dissolveFeedback('Belum ada balasan. Sesi belum dihapus di perangkat ini. Tunggu koneksi atau coba lagi.');},10000);
      });
    }
    dissolveChoice={code:meta.code,roomId:meta.roomId};dissolveBusy=false;dissolveDialog.querySelector('[data-mk-dissolve-room]').textContent='Room '+meta.code+' akan dibubarkan untuk semua orang.';dissolveFeedback('Tindakan ini tidak dapat dibatalkan.');
    if(!dissolveDialog.open)dissolveDialog.showModal();
  }
  function name(fallback=''){return profile.name||fallback;}
  function remember(value){const clean=String(value||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,24);if(clean){profile={name:clean};write('mejakita.profile',profile);}return clean;}
  function setPrefs(input){prefs={...prefs,...input};prefs.volume=Math.max(0,Math.min(1,Number(prefs.volume)||0));prefs.sound=!!prefs.sound;prefs.reduced=!!prefs.reduced;write('mejakita.preferences',prefs);applyPrefs();document.dispatchEvent(new CustomEvent('meja-preferences',{detail:{...prefs}}));}
  function applyPrefs(){document.documentElement.dataset.mkReduced=String(prefs.reduced);if(toolbar){toolbar.querySelector('[data-mk-sound]').checked=prefs.sound;toolbar.querySelector('[data-mk-volume]').value=Math.round(prefs.volume*100);toolbar.querySelector('[data-mk-motion]').checked=prefs.reduced;}}
  function unlock(){if(!prefs.sound)return;try{context ||= new (window.AudioContext||window.webkitAudioContext)();context.resume().then(()=>unlocked=true).catch(()=>{});}catch{}}
  function tone(kind){if(!prefs.sound||!unlocked||document.hidden||!context||context.state!=='running')return;
    const sequence=kind==='turn'?[660,880]:kind==='result'?[523,659,784]:kind==='chat'?[940]:[260];
    sequence.forEach((frequency,index)=>{const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+index*.09;oscillator.type=kind==='play'?'sine':'triangle';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(prefs.volume*.12,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.09);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(at);oscillator.stop(at+.1);});
  }
  function mount(){if(toolbar)return;toolbar=document.createElement('section');toolbar.className='mk-room-tools';toolbar.setAttribute('aria-label','Meja dan preferensi');toolbar.innerHTML='<div class="mk-quick-actions" hidden></div><div class="mk-session-health" hidden></div><details><summary><span data-mk-summary>Preferensi perangkat</span><span class="mk-tools-hint">Suara · animasi · pengelolaan</span></summary><div class="mk-room-controls"></div><fieldset class="mk-preferences"><legend>Preferensi perangkatmu</legend><label><input type="checkbox" data-mk-sound> Suara permainan</label><label>Volume <input type="range" min="0" max="100" step="5" data-mk-volume aria-label="Volume permainan"></label><label><input type="checkbox" data-mk-motion> Kurangi animasi</label><small>Suara mulai setelah interaksi. Semua pengaturan ini hanya berlaku di perangkatmu.</small></fieldset></details><p class="mk-tools-status" role="status"></p>';
    const anchor=document.querySelector('.hubbar')||document.querySelector('.header');if(anchor)anchor.after(toolbar);else document.body.prepend(toolbar);details=toolbar.querySelector('details');body=toolbar.querySelector('.mk-room-controls');status=toolbar.querySelector('[role="status"]');sessionHealth=toolbar.querySelector('.mk-session-health');quickActions=toolbar.querySelector('.mk-quick-actions');if(sessionNotice)toolbar.append(sessionNotice);applyPrefs();renderControls();
    toolbar.addEventListener('change',e=>{if(e.target.matches('[data-mk-sound]')){setPrefs({sound:e.target.checked});unlock();tone('turn');}if(e.target.matches('[data-mk-motion]'))setPrefs({reduced:e.target.checked});});
    toolbar.addEventListener('input',e=>{if(e.target.matches('[data-mk-volume]'))setPrefs({volume:Number(e.target.value)/100});});
    toolbar.addEventListener('click',e=>{const action=e.target.closest('[data-mk-room]')?.dataset.mkRoom;if(action==='refresh'){reloadSession();return;}if(!action||!meta)return;
      if(action==='copy'||action==='copy-code'){const value=action==='copy-code'?meta.code:location.origin+'/'+slug+'/?room='+encodeURIComponent(meta.code);if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>announce(action==='copy-code'?'Kode room tersalin.':'Link undangan tersalin.')).catch(()=>announce('Salin ini: '+value));else announce('Salin ini: '+value);return;}
      if(action==='backup'){downloadRecovery();return;}
      if(action==='switch'){askSession('');return;}
      if(action==='dissolve'){openDissolve();return;}
      if(action==='lock')command({type:'hub-lock',locked:!meta.locked});
      if(action==='queue')command({type:'hub-queue',enabled:!meta.queued});
      if(action==='yield')command({type:'hub-yield',enabled:!meta.yielding});
      if(action==='resume')command({type:'hub-resume'});
      if(action==='next')command({type:'hub-next',boundary:meta.boundary});
    });
  }
  function reloadSession(){
    // Keep the same room URL and all seat tokens. A cache-busting document URL is not a new room.
    const url=new URL(location.href);url.searchParams.set('_mk_refresh',String(Date.now()));location.replace(url.href);
  }
  function requireRefresh(message){
    refreshRequired=true;refreshMessage=message||'Halaman ini memakai versi lama. Refresh untuk menyambung lagi ke room yang sama; kursi dan saldo tetap disimpan.';
    resuming=false;clearTimeout(sessionWait);if(sessionChoice)sessionError(refreshMessage);renderSessionHealth();
  }
  function renderSessionHealth(){
    if(!sessionHealth)return;
    const focused=sessionHealth.querySelector(':focus')?.dataset.mkRoom;
    sessionHealth.hidden=!refreshRequired&&!meta?.recovering;
    if(refreshRequired)sessionHealth.innerHTML=`<div class="mk-recovery" role="status"><b>Game sudah diperbarui · halaman perlu refresh</b><p>${esc(refreshMessage)}</p><button type="button" data-mk-room="refresh">Refresh & sambung ke room yang sama</button><p>Kursi tidak dihapus. Setelah tersambung, host mungkin perlu melanjutkan sesi yang dijeda.</p></div>`;
    else if(meta?.recovering){
      const missing=meta.missing||[];
      sessionHealth.innerHTML=`<div class="mk-recovery" role="status"><b>Room ${esc(meta.code)} tersambung · permainan sedang dijeda</b><p>Sesi disimpan setelah koneksi server dipulihkan. Refresh tidak otomatis melanjutkan permainan.</p><p>${missing.length?'Menunggu pemain menyambung kembali: '+esc(missing.join(', '))+'.':'Semua pemain sudah kembali.'}</p>${meta.host?`<button type="button" data-mk-room="resume" ${missing.length?'disabled':''}>Lanjutkan permainan</button><p>${missing.length?'Minta pemain di atas membuka link room dan menyambung kembali.':'Klik Lanjutkan permainan untuk meneruskan kartu, giliran, dan saldo yang tersimpan.'}</p>`:'<p>Minta host menekan Lanjutkan permainan setelah semua pemain kembali.</p>'}<button type="button" data-mk-room="switch">Keluar / ganti room</button></div>`;
    }else sessionHealth.replaceChildren();
    if(focused)sessionHealth.querySelector('[data-mk-room="'+CSS.escape(focused)+'"]')?.focus({preventScroll:true});
  }
  const customViews=new Map();
  const customKey=key=>[slug,meta?.roomId||meta?.code||'entry',key].join(':');
  function customize(key,label,content){return `<details class="mk-customize" data-mk-custom="${esc(key)}" ${customViews.get(customKey(key))?'open':''}><summary>${esc(label)}</summary><div class="mk-customize-body">${content}</div></details>`;}
  document.addEventListener('toggle',event=>{const panel=event.target;if(panel.matches?.('[data-mk-custom]')&&panel.isConnected)customViews.set(customKey(panel.dataset.mkCustom),panel.open);},true);
  function announce(text){if(status)status.textContent=text;}
  function command(message){if(!sender||sender(message)===false){announce('Tunggu koneksi atau aksi sebelumnya selesai.');return false;}return true;}
  function renderControls(){if(!toolbar)return;toolbar.querySelector('[data-mk-summary]').textContent=meta?'Preferensi & pengelolaan room':'Preferensi perangkat';
    const quickFocus=quickActions.querySelector(':focus')?.dataset.mkRoom;quickActions.hidden=!meta;
    quickActions.innerHTML=meta?`<div class="mk-room-identity"><small>ROOM ${esc(slug==='catur'?'CATUR':slug.toUpperCase())}</small><strong>${esc(meta.code)}</strong><span>${meta.locked?'Akses terkunci':'Bagikan undangan untuk bermain bersama'}</span></div><div class="mk-quick-buttons"><button type="button" data-mk-room="copy">Salin link undangan</button><button type="button" data-mk-room="copy-code">Salin kode</button><button type="button" data-mk-room="switch">Keluar / ganti room</button></div>`:'';
    if(quickFocus)quickActions.querySelector('[data-mk-room="'+CSS.escape(quickFocus)+'"]')?.focus({preventScroll:true});
    document.documentElement.dataset.mkRecovering=String(!!meta?.recovering);renderSessionHealth();
    if(dissolveChoice&&(!meta?.host||meta.code!==dissolveChoice.code||meta.roomId!==dissolveChoice.roomId))closeDissolve();
    if(!meta){body.replaceChildren();return;}
    const preserved=body.querySelector(':focus')?.dataset.mkRoom;
    body.innerHTML=`<div class="mk-room-row"><span>${meta.spectator?'Kamu menonton':'Kamu punya kursi'} · ${meta.saveError?'⚠ Penyimpanan bermasalah, hubungi host':meta.savedAt?'Tersimpan '+new Date(meta.savedAt).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'Menyiapkan save…'}</span><button data-mk-room="backup">Simpan file pemulihan ↓</button>${meta.host?`<button data-mk-room="lock">${meta.locked?'Buka akses room':'Kunci room'}</button><button type="button" class="mk-danger" data-mk-room="dissolve">Bubarkan ruang</button>`:''}</div><p class="mk-room-note">File pemulihan bersifat pribadi untuk mengambil kembali kursimu, termasuk jika link Cloudflare berubah. Bagikan link undangan untuk teman.</p><div class="mk-room-row">${meta.spectator?`<button data-mk-room="queue">${meta.queued?'Batalkan antrean':'Antre kursi ronde berikutnya'}</button>`:`<button data-mk-room="yield">${meta.yielding?'Tetap pegang kursi':'Beri kursi ronde berikutnya'}</button>`}${meta.canNext?'<button class="mk-next" data-mk-room="next">Main lagi & rotasi ↻</button>':''}</div><p class="mk-room-note">${meta.yielding?'Kamu memberi kursi bila ada penonton yang antre. Saldo tetap tercatat. ':''}${meta.queue.length?'Antrean: '+meta.queue.map((p,i)=>`${i+1}. ${esc(p.name)}${p.you?' (kamu)':''}${!p.connected?' · offline':''}`).join(' · '):'Belum ada antrean.'} Penonton menggantikan bot atau kursi yang diberikan saat ronde selesai.</p>${meta.bank.length?`<details class="mk-retired"><summary>Saldo pemain di luar kursi (${meta.bank.length})</summary>${meta.bank.map(p=>`<p>${esc(p.name)}${p.bot?' · bot':''} <b>${p.points>0?'+':''}${p.points} · ${money(p.net)}</b></p>`).join('')}</details>`:''}`;
    if(preserved)body.querySelector('[data-mk-room="'+CSS.escape(preserved)+'"]')?.focus({preventScroll:true});
    if(meta.canNext||meta.queued||meta.saveError)details.open=true;
    toolbar.classList.toggle('mk-save-error',!!meta.saveError);
  }
  let lastEmoteAt=0;
  function emote(text){if(!sender||!sessionOnline||!meta?.code||sessionChoice||!window.MejaTools?.isEmote(text)||Date.now()-lastEmoteAt<900)return false;const sent=sender({type:'chat',text,emoji:true});if(sent!==false)lastEmoteAt=Date.now();return sent;}
  function receive(message,send){sender=send;
    if(message.type==='error'&&message.versionMismatch){requireRefresh(message.message||message.msg);return true;}
    if(message.type==='room-dissolved'||message.type==='error'&&message.dissolved&&message.sessionUnavailable){
      const code=meta?.code||sessionSeat?.code||ownSeat?.code;
      if(message.code!==code)return true;
      closeDissolve();window.MejaTools?.clearEmotes(true);
      for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
      seats=read('mejakita.saved-seats',{});if(seats[slug])delete seats[slug][message.code];write('mejakita.saved-seats',seats);
      message.type='left';message.dissolved=true;
    }
    if(message.type==='error'&&message.action==='hub-dissolve'){clearTimeout(dissolveWait);dissolveBusy=false;dissolveFeedback(message.message||message.msg||'Room belum dibubarkan.');}
    window.MejaTools?.receiveEmotes(message);if(sessionMessage(message))return true;if(message.type==='joined'&&message.token){ownSeat={format:1,game:slug,code:message.code,token:message.token,name:profile.name,time:Date.now()};seats=read('mejakita.saved-seats',{});seats[slug]||={};seats[slug][message.code]=ownSeat;write('mejakita.saved-seats',seats);}
    if(message.type==='left'){meta=null;ownSeat=null;previous=null;renderControls();return;}
    if(message.hub){const changed=JSON.stringify(meta)!==JSON.stringify(message.hub);meta=message.hub;if(changed)renderControls();}
    if(message.type==='chat'){const m=message.msg;if(previous&&m?.from&&m.from!==profile.name)tone('chat');return;}
    if(message.type!=='state'&&message.type!=='lobby')return;
    let turn=false,play='',round='',done=false;
    if(slug==='capsa'){turn=message.phase==='playing'&&message.you>=0&&message.you===message.turn;play=message.actionNo;round=message.matchId+':'+message.round;done=['result','finished'].includes(message.phase);}
    if(slug==='mahjong'){turn=!message.over&&!message.spectator&&(message.phase==='discard'&&message.you===message.current||message.claimWaiting?.includes(message.you));play=message.last?.tile?.id;round=message.hand;done=message.over;}
    if(slug==='poker'){turn=!!message.game?.options&&!message.spectator;play=message.game?.version;round=message.game?.handNo;done=message.game?.over||message.phase==='ended';}
    if(slug==='catur'){turn=message.ready&&!message.spectator&&message.phase==='playing'&&message.turn===message.yourColor;play=message.ply;round=message.matchId;done=message.phase==='finished';}
    if(slug==='domino'){turn=message.ready&&!message.spectator&&message.phase==='playing'&&message.turnId===message.you;play=message.revision;round=message.matchId;done=message.phase==='finished';}
    if(slug==='blackjack'){turn=!message.spectator&&(message.phase==='playing'&&message.turnId===message.you||message.phase==='betting'&&message.players?.find(p=>p.id===message.you)?.bet===null);play=message.events?.at(-1)?.text;round=message.round;done=message.phase==='finished';}
    const chat=JSON.stringify(message.chat?.at(-1)||null),room=message.code;
    if(previous&&previous.room===room&&!meta?.recovering){if(done&&!previous.done)tone('result');else if(turn&&(!previous.turn||round!==previous.round))tone('turn');else if(play!==previous.play&&round===previous.round)tone('play');else if(chat!==previous.chat&&message.chat?.at(-1)?.name!==profile.name)tone('chat');}
    previous={room,turn,play,round,done,chat};
    if(turn&&!lastMotion&&!prefs.reduced){toolbar?.classList.add('mk-your-turn');setTimeout(()=>toolbar?.classList.remove('mk-your-turn'),900);}lastMotion=turn;
    queueEnhance();
  }
  function downloadRecovery(){const file=ownSeat||seats[slug]?.[meta.code];if(!file)return announce('Tunggu sesi terhubung sebelum menyimpan file.');const blob=new Blob([JSON.stringify(file,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='meja-kita-'+slug+'-'+file.code+'-pribadi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('File pemulihan diunduh. Simpan sendiri.');}
  function queueEnhance(){if(tickQueued)return;tickQueued=true;queueMicrotask(()=>{tickQueued=false;enhancePanels();});}
  function applyFold(panel,key,titleText){
    const collapsed=!!folds[key],button=panel.querySelector('[data-mk-fold]');panel.dataset.mkCollapsed=String(collapsed);
    if(!button)return;const label=collapsed?'Buka':'Lipat';
    // Do not generate another child-list mutation when nothing changed.
    if(button.textContent!==label)button.textContent=label;
    button.setAttribute('aria-expanded',String(!collapsed));button.setAttribute('aria-label',label+' '+titleText);
  }
  function enhancePanels(){if(!document.body)return;
    for(const panel of document.querySelectorAll('.mk-sidebar>.mk-panel,.sidebar>section')){
      const title=panel.querySelector(':scope>h2,:scope>h3,:scope>.mk-heading>h3,:scope>.panel-heading>h2,:scope>.panel-heading>h3');if(!title)continue;
      const text=[...title.childNodes].filter(n=>n.nodeType!==1||!n.matches('[data-mk-fold]')).map(n=>n.textContent).join('').trim(),key=slug+':'+text;
      panel.dataset.mkPanel=key;panel.dataset.mkTitle=text;
      let header=title;while(header.parentElement!==panel)header=header.parentElement;header.dataset.mkPanelHeader='';
      if(!title.querySelector('[data-mk-fold]')){const button=document.createElement('button');button.type='button';button.dataset.mkFold=key;button.className='mk-fold';title.append(button);}
      applyFold(panel,key,text);
    }
  }
  document.addEventListener('click',e=>{const button=e.target.closest('[data-mk-fold]');if(!button)return;e.preventDefault();const key=button.dataset.mkFold;folds[key]=!folds[key];write('mejakita.panel-folds',folds);for(const panel of document.querySelectorAll('[data-mk-panel]'))if(panel.dataset.mkPanel===key)applyFold(panel,key,panel.dataset.mkTitle);});

  document.addEventListener('pointerdown',unlock,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend().catch(()=>{});else if(unlocked&&prefs.sound)context?.resume().catch(()=>{});});
  document.addEventListener('DOMContentLoaded',()=>{mount();queueEnhance();const observer=new MutationObserver(changes=>{if(changes.some(c=>!toolbar.contains(c.target)))queueEnhance();});observer.observe(document.body,{childList:true,subtree:true});});
  applyPrefs();
  window.MejaRoom={customize,requireRefresh,emote,bank:()=>meta?.bank||[],receive,name,saved,remember,outgoing,connected:sessionConnected,disconnected:sessionDisconnected,preferences:()=>({...prefs}),setPrefs,unlock,tone,esc};
})();
