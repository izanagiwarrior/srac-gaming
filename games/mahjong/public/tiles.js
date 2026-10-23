/* Gambar muka ubin mahjong tradisional (SVG inline). */
(function (root) {
  const GREEN = '#2e8b57', BLUE = '#2b5a9c', RED = '#c8322b', INK = '#1d1f1a', FACE = '#f8f3e5';
  const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const WINDS = ['東', '南', '西', '北'];
  const dotPos = {
    1: [[30, 42, 17]], 2: [[30, 24, 11], [30, 60, 11]], 3: [[16, 22, 10], [30, 42, 10], [44, 62, 10]],
    4: [[17, 24, 9.5], [43, 24, 9.5], [17, 60, 9.5], [43, 60, 9.5]], 5: [[17, 22, 9], [43, 22, 9], [30, 42, 9], [17, 62, 9], [43, 62, 9]],
    6: [[17, 20, 9], [43, 20, 9], [17, 42, 9], [43, 42, 9], [17, 64, 9], [43, 64, 9]],
    7: [[13, 16, 7.5], [30, 23, 7.5], [47, 30, 7.5], [17, 52, 7.5], [43, 52, 7.5], [17, 70, 7.5], [43, 70, 7.5]],
    8: [[17, 14, 7.5], [43, 14, 7.5], [17, 33, 7.5], [43, 33, 7.5], [17, 51, 7.5], [43, 51, 7.5], [17, 70, 7.5], [43, 70, 7.5]],
    9: [[15, 18, 7.5], [30, 18, 7.5], [45, 18, 7.5], [15, 42, 7.5], [30, 42, 7.5], [45, 42, 7.5], [15, 66, 7.5], [30, 66, 7.5], [45, 66, 7.5]]
  };
  const dotColor = (n, k) => n === 1 ? GREEN : n === 9 ? [GREEN, RED, BLUE][Math.floor(k / 3)] : n === 5 && k === 2 ? RED : (k % 2 ? BLUE : GREEN);
  function dot(x, y, r, c) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${(r * .62).toFixed(1)}" fill="${FACE}"/><circle cx="${x}" cy="${y}" r="${(r * .3).toFixed(1)}" fill="${c}"/>` +
      (r >= 15 ? `<circle cx="${x}" cy="${y}" r="${(r * .82).toFixed(1)}" fill="none" stroke="${RED}" stroke-width="1.6" stroke-dasharray="3 2.2"/>` : '');
  }
  const stickPos = {
    2: [[30, 24, 28], [30, 60, 28]], 3: [[30, 22, 26], [17, 60, 26], [43, 60, 26]],
    4: [[17, 24, 28], [43, 24, 28], [17, 60, 28], [43, 60, 28]], 5: [[17, 20, 24], [43, 20, 24], [30, 42, 24], [17, 64, 24], [43, 64, 24]],
    6: [[17, 18, 20], [43, 18, 20], [17, 42, 20], [43, 42, 20], [17, 66, 20], [43, 66, 20]],
    7: [[30, 16, 20], [17, 42, 20], [43, 42, 20], [17, 66, 20], [43, 66, 20], [30, 42, 20], [30, 66, 20]],
    8: [[17, 14, 16], [43, 14, 16], [17, 33, 16], [43, 33, 16], [17, 51, 16], [43, 51, 16], [17, 70, 16], [43, 70, 16]],
    9: [[15, 18, 20], [30, 18, 20], [45, 18, 20], [15, 42, 20], [30, 42, 20], [45, 42, 20], [15, 66, 20], [30, 66, 20], [45, 66, 20]]
  };
  const stickColor = (n, k) => n === 9 ? [GREEN, RED, BLUE][Math.floor(k / 3)] : (n === 5 && k === 2) || (n === 7 && k === 0) ? RED : (n === 8 && k % 2) ? BLUE : GREEN;
  function stick(x, y, h, c) {
    const w = 9, t = y - h / 2;
    return `<rect x="${x - w / 2}" y="${t}" width="${w}" height="${h}" rx="3" fill="${c}"/><rect x="${x - 1}" y="${t + 2}" width="2" height="${h - 4}" fill="${FACE}" opacity=".55"/>` +
      `<rect x="${x - w / 2}" y="${(y - 1.2).toFixed(1)}" width="${w}" height="2.4" fill="${FACE}" opacity=".85"/>`;
  }
  function bird() {
    return `<g transform="translate(30 40)"><rect x="-3" y="12" width="6" height="30" rx="2" fill="${GREEN}"/>
      <ellipse cx="0" cy="2" rx="12" ry="9" fill="${BLUE}"/><path d="M-10 -1 L-24 -10 L-16 4 Z" fill="${BLUE}"/>
      <circle cx="10" cy="-6" r="6.5" fill="${BLUE}"/><path d="M15 -6 L23 -4 L15 -2 Z" fill="${RED}"/><circle cx="11.5" cy="-7" r="1.4" fill="${FACE}"/>
      <path d="M-4 10 L-6 18 M3 10 L5 18" stroke="${RED}" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  function face(t) {
    if (t.s === 'd') { return dotPos[t.n].map((p, k) => dot(p[0], p[1], p[2], dotColor(t.n, k))).join(''); }
    if (t.s === 'b') { return t.n === 1 ? bird() : stickPos[t.n].map((p, k) => stick(p[0], p[1], p[2], stickColor(t.n, k))).join(''); }
    const txt = (s, y, size, fill, weight = 700) => `<text x="30" y="${y}" text-anchor="middle" font-family="'Songti SC','STSong','SimSun','Noto Serif CJK SC','Noto Serif SC',serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${s}</text>`;
    if (t.s === 'c') return txt(NUM[t.n - 1], 36, 30, t.n === 5 ? RED : INK) + txt('萬', 74, 31, RED);
    if(t.s==='j')return txt('百',40,31,'#75509f')+txt('搭',72,28,'#75509f');
    if(t.s==='f'){const labels=['梅','蘭','菊','竹','春','夏','秋','冬'];const color=t.n<=4?'#ae426a':'#277a63';return txt(labels[t.n-1],44,34,color)+txt(String((t.n-1)%4+1),72,18,color);}
    if (t.s === 'w') return txt(WINDS[t.n - 1], 59, 48, INK);
    if (t.n === 1) return txt('中', 59, 48, RED);
    if (t.n === 2) return txt('發', 59, 48, GREEN);
    return `<rect x="11" y="11" width="38" height="62" rx="3" fill="none" stroke="${BLUE}" stroke-width="4"/><rect x="18" y="18" width="24" height="48" rx="2" fill="none" stroke="${BLUE}" stroke-width="2"/>`;
  }
  const CORNER = ['E', 'S', 'W', 'N'];
  function corner(t) {
    const lbl = (t.s === 'd' || t.s === 'b' || t.s === 'c') ? String(t.n) : t.s === 'w' ? CORNER[t.n - 1] : '';
    if (!lbl) return '';
    return `<text x="5" y="12" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="700" fill="#5d6560">${lbl}</text>`;
  }
  root.tileFaceSVG = function (t) {
    const art = t.s === 'w' || t.s === 'g' ? face(t) : `<g transform="translate(30 46) scale(.86) translate(-30 -42)">${face(t)}</g>`;
    return `<svg viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${corner(t)}${art}</svg>`;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
