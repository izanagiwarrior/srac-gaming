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
