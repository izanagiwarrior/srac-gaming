'use strict';
(function () {
  const KEY = 'mejakita.theme';
  const root = document.documentElement;
  let current = 'dark', controls;
  function read() {
    try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  }
  function apply(value, remember = false) {
    current = value === 'light' ? 'light' : 'dark';
    root.dataset.theme = current;
    root.dataset.mkGame = location.pathname.split('/')[1] || 'hub';
    if (remember) try { localStorage.setItem(KEY, current); } catch { /* Theme still works for this page. */ }
    let tint = document.querySelector('meta[name="theme-color"]');
    if (!tint) { tint = document.createElement('meta'); tint.name = 'theme-color'; document.head.append(tint); }
    tint.content = current === 'light' ? '#edf1e9' : '#102e25';
    for (const button of controls?.querySelectorAll('[data-mk-theme]') || []) {
      button.setAttribute('aria-pressed', String(button.dataset.mkTheme === current));
    }
    document.dispatchEvent(new CustomEvent('meja-theme', { detail: { theme: current } }));
  }
  function mount() {
    const toolbar = document.querySelector('.mk-room-tools');
    if (!toolbar) return;
    controls = document.createElement('div');
    controls.className = 'mk-theme-switch';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Tema tampilan');
    controls.innerHTML = '<button type="button" data-mk-theme="dark" aria-pressed="false" title="Tema gelap">Dark</button><button type="button" data-mk-theme="light" aria-pressed="false" title="Tema terang">Light</button>';
    controls.addEventListener('click', event => {
      const button = event.target.closest('[data-mk-theme]');
      if (button) apply(button.dataset.mkTheme, true);
    });
    toolbar.prepend(controls);
    apply(current);
  }
  // Run in the head before paint; the device's light preference is not the default.
  apply(read());
  document.addEventListener('DOMContentLoaded', mount);
  addEventListener('storage', event => { if (event.key === KEY || event.key === null) apply(read()); });
  window.MejaTheme = { set: value => apply(value, true), get: () => current };
})();
