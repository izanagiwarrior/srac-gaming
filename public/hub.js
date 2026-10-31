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
  const list=document.getElementById('mk-directory-list');
  let loading=false;
  async function refresh(){if(loading||document.hidden)return;loading=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
    try{const response=await fetch('/api/lobby',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Lobby tidak tersedia');const data=await response.json();const rooms=data.rooms.filter(r=>Object.hasOwn(names,r.game));
      if(!rooms.length)list.innerHTML='<p class="mk-directory-empty">Belum ada room terbuka yang sedang online. Pilih game di bawah, buat room, lalu undang teman. Room akan muncul di sini saat ada pemain online.</p>';
      else list.innerHTML='<div class="mk-directory-grid">'+rooms.map(r=>`<article class="mk-room-card"><h3>${M.esc(names[r.game])} · ${M.esc(r.code)}</h3><small>${({lobby:'Menunggu pemain',playing:'Sedang bermain',between:'Antar ronde',paused:'Permainan dijeda'})[r.phase]||'Meja terbuka'} · ${r.seats}/${r.capacity} kursi</small><p>${r.players.map(M.esc).join(', ')||'Menunggu pemain kembali'}</p><small>${r.spectators} penonton${r.queued?' · '+r.queued+' antre':''}</small><a class="mk-join-link" href="/${r.game}/?room=${encodeURIComponent(r.code)}">${r.phase==='lobby'?'Gabung meja':'Tonton / kembali ke kursi'} ↗</a></article>`).join('')+'</div>';
      document.getElementById('mk-refresh').textContent='Segarkan daftar';
    }catch{document.getElementById('mk-refresh').textContent='Koneksi daftar terputus · coba lagi';if(!list.querySelector('.mk-directory-grid'))list.textContent='Daftar room belum dapat dimuat. Kamu tetap bisa memilih game dan memakai kode room.';}finally{clearTimeout(timeout);loading=false;}
  }
  document.getElementById('mk-refresh').addEventListener('click',refresh);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});refresh();setInterval(refresh,5000);
})();
