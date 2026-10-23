/* Public wall positions and opening ceremony. Never contains tile identities. */
(function(root){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pipSlots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
  function die(n){return `<span class="hk-die" aria-label="Dadu ${n}">${Array.from({length:9},(_,i)=>`<i class="${pipSlots[n].includes(i)?'pip':''}"></i>`).join('')}</span>`;}
  function wall(state,compact=false){
    const layout=state.wallLayout;if(!layout)return '';
    const viewer=state.spectator?0:state.you,o=state.opening;let start=0;
    const sides=layout.sides.map((size,side)=>{
      const seat=(4-side)%4,relative=(seat-viewer+4)%4,positions=['bottom','right','top','left'];
      let tiles='';for(let k=0;k<size;k+=2){const index=start+k;tiles+=`<span class="hk-stack ${layout.head===index?'break-point':''}"><i class="${layout.occupied[index]?'present':''}"></i><i class="${layout.occupied[index+1]?'present':''}"></i></span>`;}
      start+=size;
      return `<div class="hk-wall hk-wall-${positions[relative]}"><span class="hk-seat-label">${esc(state.players[seat].name)} · ${root.Engine.WIND_ID[state.players[seat].wind]}${o?' · '+o.dealt[seat]+' ubin':''}</span><div class="hk-stacks">${tiles}</div></div>`;
    }).join('');
    const label=o?o.label:'Empat sisi tembok';
    const center=compact?`<b>${state.wall}</b><span>ubin tersisa</span>`:`<span class="hk-eyebrow">PEMBUKAAN RONDE ${state.hand}</span><h2>${esc(label)}</h2><div class="hk-dice ${o?.stage==='dice'?'rolling':''}">${(o?.dice||[]).map(die).join('')}</div><p>${o?.dice.length?'Jumlah '+o.sum+' · potong setelah tumpuk '+o.breakStack:'Ubin dua tingkat; muka ubin tetap tersembunyi.'}</p>${o?.stage==='deal'?`<div class="hk-packet" aria-hidden="true">▰ ▰ ▰ ▰</div>`:''}`;
    return `<div class="hk-arena ${compact?'compact':''} stage-${esc(o?.stage||'play')}">${sides}<div class="hk-center">${center}</div></div>`;
  }
  function opening(state){
    const host=!state.spectator&&state.hostSeat===state.you;
    return `<section class="hk-opening" aria-label="Persiapan meja Mahjong"><div class="hk-opening-heading"><span class="tag">${state.settings.jokers||state.settings.flowerBonus?'Hong Kong · variasi meja':'Acuan HKMA'}</span><span>4 sisi · 3 dadu · bagi ubin</span></div>${wall(state)}<progress max="1" value="${state.opening.progress}" aria-label="Progres pembagian"></progress><div class="hk-opening-controls"><p>Giliran dimulai setelah pembagian selesai. ${host?'Skip melewati animasi untuk seluruh meja.':'Host dapat melewati animasi.'}</p>${host?'<button class="btn primary" id="skip-mahjong-opening">Skip & mulai</button>':''}</div></section>`;
  }
  root.MahjongOpening={wall,opening};
})(typeof globalThis!=='undefined'?globalThis:this);
