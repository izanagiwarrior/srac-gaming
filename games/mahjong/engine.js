/* Mahjong engine: logika murni yang dipakai server (Node) dan browser. */
(function (root) {
  const SUITS = { d: { g: '筒', name: 'Bulatan' }, b: { g: '索', name: 'Bambu' }, c: { g: '萬', name: 'Karakter' } };
  const WINDS = ['東', '南', '西', '北'], WIND_ID = ['Timur', 'Selatan', 'Barat', 'Utara'];
  const DRAG = ['中', '發', '白'], DRAG_ID = ['Naga Merah', 'Naga Hijau', 'Naga Putih'];
  const T = (s, n) => ({ s, n });
  const idxOf = t => t.s === 'd' ? t.n - 1 : t.s === 'b' ? 8 + t.n : t.s === 'c' ? 17 + t.n : t.s === 'w' ? 26 + t.n : 30 + t.n;
  const fromIdx = i => i < 9 ? T('d', i + 1) : i < 18 ? T('b', i - 8) : i < 27 ? T('c', i - 17) : i < 31 ? T('w', i - 26) : T('g', i - 30);
  const isSuit = i => i < 27;
  function tileName(t) { if (SUITS[t.s]) return t.n + ' ' + SUITS[t.s].name; if (t.s === 'w') return 'Angin ' + WIND_ID[t.n - 1]; return DRAG_ID[t.n - 1]; }
  const byIdx = (a, b) => idxOf(a) - idxOf(b) || a.id - b.id;
  function counts(hand) { const c = new Array(34).fill(0); for (const t of hand) c[idxOf(t)]++; return c; }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildWall() { const w = []; let id = 0; for (let i = 0; i < 34; i++) for (let k = 0; k < 4; k++) w.push({ ...fromIdx(i), id: id++ }); return w; }

  function shantenStd(c0, melds) {
    const cnt = c0.slice(); let best = 8, m = melds, t = 0;
    function rec(i, pair) {
      while (i < 34 && cnt[i] === 0) i++;
      if (i >= 34) { let tt = t; if (m + tt > 4) tt = 4 - m; const s = 8 - 2 * m - tt - (pair ? 1 : 0); if (s < best) best = s; return; }
      let rem = 0; for (let k = i; k < 34; k++) rem += cnt[k];
      const pot = Math.min(8, 2 * m + t + Math.ceil(2 * rem / 3)) + (pair ? 1 : 0);
      if (8 - pot >= best) return;
      if (cnt[i] >= 3) { cnt[i] -= 3; m++; rec(i, pair); m--; cnt[i] += 3; }
      if (isSuit(i) && i % 9 <= 6 && cnt[i + 1] > 0 && cnt[i + 2] > 0) { cnt[i]--; cnt[i + 1]--; cnt[i + 2]--; m++; rec(i, pair); m--; cnt[i]++; cnt[i + 1]++; cnt[i + 2]++; }
      if (m + t < 4) {
        if (cnt[i] >= 2) { cnt[i] -= 2; t++; rec(i, pair); t--; cnt[i] += 2; }
        if (isSuit(i) && i % 9 <= 7 && cnt[i + 1] > 0) { cnt[i]--; cnt[i + 1]--; t++; rec(i, pair); t--; cnt[i]++; cnt[i + 1]++; }
        if (isSuit(i) && i % 9 <= 6 && cnt[i + 2] > 0) { cnt[i]--; cnt[i + 2]--; t++; rec(i, pair); t--; cnt[i]++; cnt[i + 2]++; }
      }
      cnt[i]--; rec(i, pair); cnt[i]++;
    }
    for (let p = 0; p < 34; p++) if (cnt[p] >= 2) { cnt[p] -= 2; rec(0, true); cnt[p] += 2; }
    rec(0, false);
    return best;
  }
  function shanten(c, melds) {
    let s = shantenStd(c, melds);
    if (melds === 0) { let pairs = 0, kinds = 0; for (const x of c) { if (x >= 2) pairs++; if (x > 0) kinds++; } const s7 = 6 - pairs + Math.max(0, 7 - kinds); if (s7 < s) s = s7; }
    return s;
  }
  function decompose(c0, need) {
    const cnt = c0.slice();
    function sets(i, need, acc) {
      while (i < 34 && cnt[i] === 0) i++;
      if (i >= 34) return need === 0 ? acc.slice() : null;
      if (need === 0) return null;
      if (cnt[i] >= 3) { cnt[i] -= 3; acc.push({ type: 'pung', i }); const r = sets(i, need - 1, acc); acc.pop(); cnt[i] += 3; if (r) return r; }
      if (isSuit(i) && i % 9 <= 6 && cnt[i + 1] > 0 && cnt[i + 2] > 0) { cnt[i]--; cnt[i + 1]--; cnt[i + 2]--; acc.push({ type: 'chow', i }); const r = sets(i, need - 1, acc); acc.pop(); cnt[i]++; cnt[i + 1]++; cnt[i + 2]++; if (r) return r; }
      return null;
    }
    for (let p = 0; p < 34; p++) if (cnt[p] >= 2) { cnt[p] -= 2; const r = sets(0, need, []); cnt[p] += 2; if (r) return { pair: p, sets: r }; }
    return null;
  }
  function findWin(hand, melds) {
    if (hand.length + 3 * melds.length !== 14) return null;
    const c = counts(hand); const r = decompose(c, 4 - melds.length);
    if (r) return { type: 'std', pair: r.pair, sets: r.sets };
    if (melds.length === 0 && c.filter(x => x === 2).length === 7) return { type: '7' };
    return null;
  }
  function scoreHand(hand, melds, win, zimo, seat) {
    const fans = [['Menang (Hu)', 1]];
    if (zimo) fans.push(['Zimo: menang dari ambilan sendiri', 1]);
    if (melds.every(m => !m.open)) fans.push(['Tangan tertutup (tanpa klaim)', 1]);
    const all = [...hand, ...melds.flatMap(m => m.tiles)];
    if (win.type === '7') fans.push(['Tujuh Pasang', 3]);
    else {
      const sets = [...melds.map(m => ({ type: m.type === 'chow' ? 'chow' : 'pung', i: idxOf(m.tiles[0]) })), ...win.sets];
      if (sets.every(s => s.type === 'pung')) fans.push(['Semua Pung', 2]);
      for (const s of sets) {
        if (s.type !== 'pung') continue;
        if (s.i >= 31) fans.push(['Pung ' + DRAG_ID[s.i - 31], 1]);
        else if (s.i >= 27) { if (s.i - 27 === seat) fans.push(['Pung angin sendiri (' + WIND_ID[seat] + ')', 1]); if (s.i === 27) fans.push(['Pung angin ronde (Timur)', 1]); }
      }
    }
    const suits = new Set(all.filter(t => SUITS[t.s]).map(t => t.s)); const honor = all.some(t => !SUITS[t.s]);
    if (suits.size === 1 && !honor) fans.push(['Satu Warna Penuh', 5]); else if (suits.size === 1) fans.push(['Campur Satu Warna', 2]); else if (suits.size === 0) fans.push(['Semua Huruf', 5]);
    return { fans, total: fans.reduce((a, f) => a + f[1], 0) };
  }
  function computeOptions(hand, melds, t, canChow) {
    const c = counts(hand); const i = idxOf(t); const o = { win: null, pung: false, kong: false, chows: [] };
    const w = findWin([...hand, t], melds); if (w) o.win = w;
    if (c[i] >= 2) o.pung = true; if (c[i] >= 3) o.kong = true;
    if (canChow && isSuit(i)) { const n = i % 9; for (const [a, b] of [[-2, -1], [-1, 1], [1, 2]]) { if (n + a >= 0 && n + b <= 8 && c[i + a] > 0 && c[i + b] > 0) o.chows.push([i + a, i + b]); } }
    return o;
  }
  function botChooseDiscard(hand, melds) {
    const c = counts(hand); let best = null, bestScore = Infinity; const tried = new Set();
    for (const t of hand) {
      const i = idxOf(t); if (tried.has(i)) continue; tried.add(i);
      c[i]--; const s = shanten(c, melds.length); c[i]++;
      let rel = c[i] - 1; if (isSuit(i)) { const n = i % 9; if (n > 0) rel += c[i - 1]; if (n < 8) rel += c[i + 1]; if (n > 1) rel += c[i - 2] * .5; if (n < 7) rel += c[i + 2] * .5; }
      const edge = isSuit(i) ? ((i % 9 === 0 || i % 9 === 8) ? 1 : 2) : 0;
      const score = s * 100 + rel * 10 + edge + Math.random();
      if (score < bestScore) { bestScore = score; best = t; }
    }
    return best;
  }
  function botDecide(hand, melds, o, t) {
    if (o.win) return { type: 'win', win: o.win };
    const c = counts(hand); const i = idxOf(t); const ml = melds.length; const S = shanten(c, ml);
    if (o.kong) return { type: 'kong' };
    if (o.pung) { c[i] -= 2; const S2 = shanten(c, ml + 1); c[i] += 2; if (S2 < S) return { type: 'pung' }; }
    if (o.chows.length) { let best = null, bs = S; for (const cb of o.chows) { c[cb[0]]--; c[cb[1]]--; const S2 = shanten(c, ml + 1); c[cb[0]]++; c[cb[1]]++; if (S2 < bs) { bs = S2; best = cb; } } if (best) return { type: 'chow', combo: best }; }
    return null;
  }
  function botKong(hand, melds) {
    const c = counts(hand); const cur = shanten(c, melds.length);
    for (let i = 0; i < 34; i++) if (c[i] === 4) { c[i] -= 4; const s = shanten(c, melds.length + 1); c[i] += 4; if (s <= cur) return { kind: 'conc', arg: i }; }
    for (let k = 0; k < melds.length; k++) { const m = melds[k]; const i = idxOf(m.tiles[0]); if (m.type === 'pung' && c[i] === 1) { c[i]--; const s = shanten(c, melds.length); c[i]++; if (s <= cur) return { kind: 'add', arg: k }; } }
    return null;
  }
  function waitsOf(hand, melds) { const w = []; if (hand.length + 3 * melds.length !== 13) return w; for (let i = 0; i < 34; i++) { if (findWin([...hand, fromIdx(i)], melds)) w.push(i); } return w; }
  function acceptance(c, melds, s, vis) { let n = 0; const types = []; for (let i = 0; i < 34; i++) { const left = 4 - vis[i]; if (left <= 0) continue; c[i]++; const s2 = shanten(c, melds); c[i]--; if (s2 < s) { n += left; types.push(i); } } return { n, types }; }

  // Bot berjenjang. level: 'easy' | 'normal' | 'hard'. ctx (opsional): { threats: [{discards:Set<idx>, melds:number}], visible: counts[34] }
  function botChooseDiscardLevel(hand, melds, level, ctx) {
    if (level === 'easy' && Math.random() < 0.35) {
      // Pemula: kadang asal membuang ubin yang kelihatan "sendirian" tanpa menghitung.
      const c = counts(hand); const lonely = hand.filter(t => c[idxOf(t)] === 1);
      const pool = lonely.length ? lonely : hand; return pool[Math.floor(Math.random() * pool.length)];
    }
    if (level !== 'hard' || !ctx || !ctx.threats || !ctx.threats.length) return botChooseDiscard(hand, melds);
    // Sulit: seperti normal, tapi saat ada lawan yang mengancam, pilih ubin aman kalau biayanya kecil.
    const c = counts(hand); const cands = []; const seen = new Set();
    for (const t of hand) { const i = idxOf(t); if (seen.has(i)) continue; seen.add(i); c[i]--; const s = shanten(c, melds.length); c[i]++;
      const safe = ctx.threats.every(th => th.discards.has(i) || (ctx.visible && ctx.visible[i] + c[i] >= 4));
      let rel = c[i] - 1; if (isSuit(i)) { const n = i % 9; if (n > 0) rel += c[i - 1]; if (n < 8) rel += c[i + 1]; }
      cands.push({ t, i, s, safe, rel }); }
    cands.sort((a, b) => a.s - b.s || a.rel - b.rel);
    const best = cands[0]; const myFar = best.s >= 2;
    const danger = ctx.threats.some(th => th.melds >= 2) || (ctx.wall !== undefined && ctx.wall < 20);
    if (danger) { const safeC = cands.find(x => x.safe && (x.s <= best.s + (myFar ? 2 : 1))); if (safeC) return safeC.t; }
    return best.t;
  }
  function botDecideLevel(hand, melds, o, t, level) {
    if (o.win) return { type: 'win', win: o.win };
    if (level === 'easy') { if (o.kong) return { type: 'kong' }; if (o.pung && Math.random() < 0.5) return { type: 'pung' }; return null; }
    return botDecide(hand, melds, o, t);
  }
  const E = { botChooseDiscardLevel, botDecideLevel, SUITS, WINDS, WIND_ID, DRAG, DRAG_ID, T, idxOf, fromIdx, isSuit, tileName, byIdx, counts, shuffle, buildWall, shanten, findWin, scoreHand, computeOptions, botChooseDiscard, botDecide, botKong, waitsOf, acceptance };
  if (typeof module !== 'undefined' && module.exports) module.exports = E; else root.Engine = E;
})(typeof globalThis !== 'undefined' ? globalThis : this);
