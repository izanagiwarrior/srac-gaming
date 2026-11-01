'use strict';
// Cosmetic titles derive from the server-supplied level; they grant no permissions.
(()=>{
 const tiers=Object.freeze([
  {level:1,name:'Initiate',mark:'I'},
  {level:5,name:'Silver Vanguard',mark:'II'},
  {level:10,name:'Jade Sentinel',mark:'III'},
  {level:15,name:'Golden Sovereign',mark:'IV'},
  {level:20,name:'Astral Legend',mark:'V'},
  {level:30,name:'Celestial Dragon',mark:'VI'}
 ].map((tier,i)=>Object.freeze({...tier,tier:i+1,xp:(tier.level-1)**2*100})));
 function get(value){const n=Number(value),level=Number.isFinite(n)?Math.max(1,Math.floor(n)):1;const current=tiers.findLast(t=>level>=t.level);return {...current,level,next:tiers[current.tier]||null};}
 function badge(value){const t=get(value);return `<span class="mk-player-title mk-player-title-${t.tier}"><span class="mk-title-shield" aria-hidden="true">${t.mark}</span><span>${t.name}</span></span>`;}
 window.MejaTitles=Object.freeze({tiers,get,badge});
})();
