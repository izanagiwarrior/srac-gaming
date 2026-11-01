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
  const names={capsa:'Capsa Banting',mahjong:'Mahjong',poker:'Poker',catur:'Catur',domino:'Domino Gaple',blackjack:'Blackjack',uno:'UNO',ludo:'Ludo',monopoli:'Monopoli',reversi:'Reversi / Othello'},M=window.MejaRoom;
  const list=document.getElementById('mk-directory-list');
  let loading=false,rooms=[],page=0,search='',game='',visible=false,lastLoaded=0;
  const controls=document.createElement('form');controls.className='mk-directory-controls';controls.innerHTML='<label>Cari meja<input name="q" placeholder="Kode atau nama pemain" maxlength="100"></label><label>Game<select name="game"><option value="">Semua game</option>'+Object.entries(names).map(([id,n])=>`<option value="${id}">${M.esc(n)}</option>`).join('')+'</select></label><button type="submit" class="secondary">Cari</button>';
  list.before(controls);
  const paging=document.createElement('div');paging.className='mk-directory-controls';list.after(paging);
  function render(){const found=rooms.filter(r=>(!game||r.game===game)&&(r.code+' '+r.players.join(' ')).toLocaleLowerCase().includes(search));page=Math.min(page,Math.max(0,Math.ceil(found.length/6)-1));
   list.innerHTML=!found.length?'<p class="mk-directory-empty">Belum ada room yang cocok. Pilih game atau masukkan kode room.</p>':'<div class="mk-directory-grid">'+found.slice(page*6,(page+1)*6).map(r=>`<article class="mk-room-card"><h3>${M.esc(names[r.game])} · ${M.esc(r.code)}</h3><small>${({lobby:'Menunggu pemain',playing:'Sedang bermain',between:'Antar ronde',paused:'Permainan dijeda'})[r.phase]||'Meja terbuka'} · ${r.seats}/${r.capacity} kursi</small><p>${r.players.map(M.esc).join(', ')||'Menunggu pemain kembali'}</p><small>${r.spectators} penonton${r.queued?' · '+r.queued+' antre':''}</small><a class="mk-join-link" href="/${r.game}/?room=${encodeURIComponent(r.code)}">${r.phase==='lobby'?'Gabung meja':'Tonton / kembali ke kursi'} ↗</a></article>`).join('')+'</div>';
   paging.innerHTML=`<button class="secondary" data-directory-step="-1" ${page===0?'disabled':''}>← Sebelumnya</button><span>Halaman ${page+1}</span><button class="secondary" data-directory-step="1" ${(page+1)*6>=found.length?'disabled':''}>Berikutnya →</button>`;
  }
  controls.addEventListener('submit',e=>{e.preventDefault();const values=new FormData(controls);search=String(values.get('q')||'').trim().toLocaleLowerCase();game=String(values.get('game')||'');page=0;render();});
  paging.addEventListener('click',e=>{const b=e.target.closest('[data-directory-step]');if(b){page=Math.max(0,page+Number(b.dataset.directoryStep));render();}});
  async function refresh(force=false){if(loading||document.hidden||!force&&(!visible||Date.now()-lastLoaded<30000))return;loading=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
   try{const response=await fetch('/api/lobby',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('Lobby tidak tersedia');const data=await response.json();rooms=data.rooms.filter(r=>Object.hasOwn(names,r.game));lastLoaded=Date.now();render();document.getElementById('mk-refresh').textContent='Segarkan daftar';}
   catch{document.getElementById('mk-refresh').textContent='Koneksi daftar terputus · coba lagi';if(!list.querySelector('.mk-directory-grid'))list.textContent='Daftar room belum dapat dimuat. Kamu tetap bisa memilih game dan memakai kode room.';}finally{clearTimeout(timeout);loading=false;}
  }
  document.getElementById('mk-refresh').addEventListener('click',()=>refresh(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)refresh();});observer.observe(list.closest('.mk-directory'));
  setInterval(()=>refresh(),30000);
})();
