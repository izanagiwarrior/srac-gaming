'use strict';
document.querySelector('[data-hub-home]')?.addEventListener('click',event => {
  if (new URLSearchParams(location.search).has('room') && !window.confirm('Kembali ke pilihan game? Kamu meninggalkan halaman meja ini dan bisa kembali dari browser yang sama.')) event.preventDefault();
});
