'use strict';
fetch('/health',{ cache:'no-store' }).then(response => {
  if (!response.ok) throw new Error('Server unavailable');
  return response.json();
}).then(data => {
  const games = [...document.querySelectorAll('.game-card')].map(link => new URL(link.href).pathname.split('/')[1]);
  if (!data.ok || !Array.isArray(data.games) || !games.every(game => data.games.includes(game))) throw new Error('Tables unavailable');
  const status = document.getElementById('server-status'); status.classList.add('online');
  status.replaceChildren(Object.assign(document.createElement('i'),{}),document.createTextNode('Mejanya siap'));
}).catch(() => { document.getElementById('server-status').textContent = 'Coba muat ulang halaman'; });

(function(){
  const names={capsa:'Capsa Banting',mahjong:'Mahjong',poker:'Poker',catur:'Catur',domino:'Domino Gaple',blackjack:'Blackjack'},M=window.MejaRoom;
  const input=document.getElementById('mk-nickname'),notice=document.getElementById('mk-profile-status'),list=document.getElementById('mk-directory-list'),file=document.getElementById('mk-recovery-file');
  input.value=M.name();if(input.value)notice.textContent='Halo, '+input.value+'. Namamu dipakai di semua game pada browser ini.';
  document.getElementById('mk-profile-form').addEventListener('submit',event=>{event.preventDefault();if(!input.reportValidity())return;const name=M.remember(input.value);input.value=name;notice.textContent=name?'Tersimpan. Pilih game atau gabung ke meja teman.':'Isi nama panggilan dulu.';});
  document.getElementById('mk-import').addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{const selected=file.files[0];if(!selected)return;
    try{
      if(selected.size>8192)throw Error('File pemulihan terlalu besar.');
      const data=JSON.parse(await selected.text());
      if(data.format!==1||!Object.hasOwn(names,data.game)||typeof data.code!=='string'||!/^[A-Z0-9]{4,8}$/.test(data.code)||typeof data.token!=='string'||!/^[a-zA-Z0-9-]{16,128}$/.test(data.token))throw Error('File pemulihan Meja Kita tidak valid.');
      const seat={format:1,game:data.game,code:data.code,token:data.token,time:Date.now(),name:M.remember(data.name||input.value)};
      let seats;try{seats=JSON.parse(localStorage.getItem('mejakita.saved-seats'))||{};}catch{seats={};}
      seats[data.game]||={};seats[data.game][data.code]=seat;localStorage.setItem('mejakita.saved-seats',JSON.stringify(seats));
      if(data.game==='capsa')localStorage.setItem('mejakita.capsa.session',JSON.stringify(seat));
      else if(data.game==='mahjong'){localStorage.setItem('mejakita.mahjong.room',data.code);localStorage.setItem('mejakita.mahjong.token',data.token);}
      else{sessionStorage.setItem('mejakita.'+data.game+'.seat',JSON.stringify(seat));if(data.game==='poker')localStorage.setItem('mejakita.poker.last-seat',JSON.stringify(seat));}
      location.assign('/'+data.game+'/?room='+encodeURIComponent(data.code));
    }catch(error){notice.textContent=error.message||'File tidak dapat dibaca.';}finally{file.value='';}
  });
  document.addEventListener('click',event=>{const link=event.target.closest('a.game-card,a.mk-join-link');if(!link)return;if(input.value.trim()){M.remember(input.value);return;}if(!M.name()){event.preventDefault();input.focus();notice.textContent='Isi nama panggilan sekali untuk semua game, lalu pilih mejamu.';}});
  let loading=false;
  async function refresh(){if(loading||document.hidden)return;loading=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
    try{const response=await fetch('/api/lobby',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Lobby tidak tersedia');const data=await response.json();const rooms=data.rooms.filter(r=>Object.hasOwn(names,r.game));
      if(!rooms.length)list.innerHTML='<p class="mk-directory-empty">Belum ada room terbuka yang sedang online. Pilih game di bawah, buat room, lalu undang teman. Room akan muncul di sini saat ada pemain online.</p>';
      else list.innerHTML='<div class="mk-directory-grid">'+rooms.map(r=>`<article class="mk-room-card"><h3>${M.esc(names[r.game])} · ${M.esc(r.code)}</h3><small>${({lobby:'Menunggu pemain',playing:'Sedang bermain',between:'Antar ronde',paused:'Sesi dipulihkan · dijeda'})[r.phase]||'Meja terbuka'} · ${r.seats}/${r.capacity} kursi</small><p>${r.players.map(M.esc).join(', ')||'Menunggu pemain kembali'}</p><small>${r.spectators} penonton${r.queued?' · '+r.queued+' antre':''}</small><a class="mk-join-link" href="/${r.game}/?room=${encodeURIComponent(r.code)}">${r.phase==='lobby'?'Gabung meja':'Tonton / kembali ke kursi'} ↗</a></article>`).join('')+'</div>';
      document.getElementById('mk-refresh').textContent='Segarkan daftar';
    }catch{document.getElementById('mk-refresh').textContent='Koneksi daftar terputus · coba lagi';if(!list.querySelector('.mk-directory-grid'))list.textContent='Daftar room belum dapat dimuat. Kamu tetap bisa memilih game dan memakai kode room.';}finally{clearTimeout(timeout);loading=false;}
  }
  document.getElementById('mk-refresh').addEventListener('click',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();setInterval(refresh,5000);
})();
