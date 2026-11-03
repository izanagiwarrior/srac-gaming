'use strict';
// Every card (Mahjong included) shows its props in a same-sized box (bottom-left corner of the square art, 40% of its width).
// The box is designed at 200px and scaled to the art; the props inside are scaled to fill it.
(()=>{
  const grid=document.querySelector('.game-grid');if(!grid)return;
  const sets=[...grid.querySelectorAll('.game-card .game-prop-set')];
  for(const set of sets){const wrap=document.createElement('div');wrap.className='prop-fit';wrap.append(...set.childNodes);set.append(wrap);}
  const fit=()=>{
    for(const set of sets){
      const art=set.closest('.game-art'),side=art.clientWidth;if(!side)continue;
      art.style.setProperty('--ps',((side*0.4)/200).toFixed(3));
      const wrap=set.firstElementChild,w=wrap.offsetWidth,h=wrap.offsetHeight;
      if(w&&h)set.style.setProperty('--pi',Math.min(150/w,150/h,2.4).toFixed(3));
    }
  };
  fit();addEventListener('resize',fit);addEventListener('load',fit);
  if(window.ResizeObserver)new ResizeObserver(fit).observe(grid);
})();
