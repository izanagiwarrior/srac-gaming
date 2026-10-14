/* Warna set yang sudah lengkap di tangan sendiri, tanpa memakai buangan lawan. */
(function (root) {
  const { counts, idxOf, tileName } = root.Engine;
  function analyze(hand) {
    const count = counts(hand), chow = new Set(), pung = new Set();
    for (let i = 0; i < 34; i++) if (count[i] >= 3) pung.add(i);
    // Ubin huruf tidak berurutan; urutan tidak boleh melintasi jenis atau 9 → 1.
    for (let suit = 0; suit < 3; suit++) for (let rank = 0; rank < 7; rank++) {
      const i = suit * 9 + rank;
      if (count[i] && count[i + 1] && count[i + 2]) { chow.add(i); chow.add(i + 1); chow.add(i + 2); }
    }
    const marks = new Map();
    for (const tile of hand) {
      const i = idxOf(tile), canChow = chow.has(i), canPung = pung.has(i);
      if (!canChow && !canPung) continue;
      const details = [];
      if (chow.has(i)) details.push('bagian dari Chow lengkap di tangan');
      if (pung.has(i)) details.push(count[i] === 4 ? '4 identik, dapat Pung atau Kong' : '3 identik, Pung lengkap di tangan');
      marks.set(tile.id, { className:canChow && canPung ? 'set-both' : canChow ? 'set-chow' : 'set-pung',
        badge:canChow && canPung ? 'C/P' : canChow ? 'C' : 'P', description:details.join('; '), name:tileName(tile) });
    }
    return marks;
  }
  function legend() {
    return `<div class="set-legend" aria-label="Set lengkap di tangan"><span class="set-key chow"><b>C</b> Chow</span><span class="set-key pung"><b>P</b> Pung / Kong</span><span class="set-key both"><b>C/P</b> Bisa keduanya</span><small>Set sudah lengkap di tanganmu. Set bisa memakai ubin yang sama; warna tidak berarti semua set dapat dipakai sekaligus.</small></div>`;
  }
  root.MahjongHandHelp = { analyze,legend };
})(typeof globalThis !== 'undefined' ? globalThis : this);
