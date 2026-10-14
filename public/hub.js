'use strict';
fetch('/health',{ cache:'no-store' }).then(response => {
  if (!response.ok) throw new Error('Server unavailable');
  return response.json();
}).then(data => {
  if (!data.ok || data.games.length !== 3) throw new Error('Tables unavailable');
  const status = document.getElementById('server-status'); status.classList.add('online');
  status.replaceChildren(Object.assign(document.createElement('i'),{}),document.createTextNode('Mejanya siap'));
}).catch(() => { document.getElementById('server-status').textContent = 'Coba muat ulang halaman'; });
