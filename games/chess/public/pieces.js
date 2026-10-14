'use strict';
window.ChessPieces = (() => {
  const names = { p:'Pion', n:'Kuda', b:'Gajah', r:'Benteng', q:'Menteri', k:'Raja' };
  const shapes = {
    p:'<circle cx="24" cy="14" r="6"/><path d="M20 20h8l-1 8 6 9H15l6-9z"/><path d="M14 37h20v4H14z"/>',
    n:'<path d="M15 37c-1-8 3-14 9-19l-8 2-3-4 8-9 9 3 5 10c4 8 1 13-1 17z"/><path d="M15 37h22v4H15z"/><path d="M22 9l-1-5 7 5z"/><circle cx="27" cy="15" r="1.5" fill="currentColor" stroke="none"/>',
    b:'<path d="M24 6c3 4 10 9 10 15 0 4-4 7-7 8l1 4 6 4H14l6-4 1-4c-4-1-7-4-7-8 0-6 7-11 10-15z"/><path d="M15 37h18v4H15z"/><path d="M27 13l-6 9" fill="none"/>',
    r:'<path d="M13 8h6v5h4V8h4v5h4V8h5v11H13z"/><path d="M17 19h15l-2 15 6 3H13l6-3z"/><path d="M13 37h23v4H13z"/><path d="M16 23h17" fill="none"/>',
    q:'<circle cx="10" cy="12" r="2.5"/><circle cx="24" cy="8" r="2.5"/><circle cx="38" cy="12" r="2.5"/><path d="M11 14l7 7 6-11 6 11 7-7-5 15H16z"/><path d="M17 29h14l1 5 5 3H11l5-3z"/><path d="M11 37h26v4H11z"/>',
    k:'<path d="M24 3v9m-4-5h8" fill="none" stroke-width="3"/><path d="M24 15c-6-7-14-3-13 4 0 4 6 9 7 11h12c1-2 7-7 7-11 1-7-7-11-13-4z"/><path d="M18 30h12l1 4 6 3H11l6-3z"/><path d="M11 37h26v4H11z"/><path d="M24 15v11" fill="none"/>'
  };
  function svg(type,color) {
    return `<svg class="piece ${color === 'w' ? 'white-piece' : 'black-piece'}" viewBox="0 0 48 48" aria-hidden="true"><g fill="${color === 'w' ? '#fff7e2' : '#15362c'}" stroke="${color === 'w' ? '#344739' : '#aabb96'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${shapes[type] || ''}</g></svg>`;
  }
  return { names,svg };
})();
