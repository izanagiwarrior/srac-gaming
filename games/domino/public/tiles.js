'use strict';
window.DominoTiles = (() => {
  const positions = {
    0:[], 1:[[18,18]], 2:[[9,9],[27,27]], 3:[[9,9],[18,18],[27,27]],
    4:[[9,9],[27,9],[9,27],[27,27]], 5:[[9,9],[27,9],[18,18],[9,27],[27,27]],
    6:[[9,8],[27,8],[9,18],[27,18],[9,28],[27,28]]
  };
  function half(value,x,y) {
    return `<g transform="translate(${x} ${y})">${(positions[value] || []).map(([cx,cy]) => `<circle cx="${cx}" cy="${cy}" r="3.25"/>`).join('')}</g>`;
  }
  function svg(a,b,horizontal = false) {
    const width = horizontal ? 88 : 44, height = horizontal ? 44 : 88;
    return `<svg class="tile-face" viewBox="0 0 ${width} ${height}" aria-hidden="true"><rect x="1" y="1" width="${width-2}" height="${height-2}" rx="6" fill="#f6efde" stroke="#ccbea1" stroke-width="1.5"/><g fill="#173c30">${half(a,4,4)}${half(b,horizontal ? 48 : 4,horizontal ? 4 : 48)}</g><path d="${horizontal ? 'M44 6v32' : 'M6 44h32'}" stroke="#b4ab95" stroke-width="1.3"/><circle cx="${horizontal ? 44 : 22}" cy="${horizontal ? 22 : 44}" r="1.9" fill="#d2b879"/></svg>`;
  }
  return { svg };
})();
