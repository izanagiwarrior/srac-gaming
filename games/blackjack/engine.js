'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Blackjack=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const value=cards=>{let total=0,aces=0;for(const c of cards){if(c.r===14){aces++;total+=11;}else total+=Math.min(10,c.r);}while(total>21&&aces){total-=10;aces--;}return {total,soft:aces>0,bust:total>21,natural:cards.length===2&&total===21};};
  const deck=()=>Array.from({length:6},(_,d)=>['s','h','d','c'].flatMap(s=>Array.from({length:13},(_,i)=>({r:i+2,s,id:d+'-'+s+'-'+(i+2)})))).flat();
  function botAction(hand,up,level,options,randomInt){
    const v=value(hand.cards),dealer=up.r===14?11:Math.min(10,up.r);
    if(level==='easy')return randomInt(4)===0?(v.total<20?'hit':'stand'):(v.total<15?'hit':'stand');
    if(level==='hard'){
      if(options.split&&[14,8].includes(hand.cards[0].r))return 'split';
      if(options.double&&(v.total===11||v.total===10&&dealer<10||v.total===9&&dealer>=3&&dealer<=6||v.soft&&v.total>=16&&v.total<=18&&dealer>=3&&dealer<=6))return 'double';
      if(v.soft)return v.total>=19||v.total===18&&dealer<9?'stand':'hit';
      if(v.total>=17||v.total>=13&&dealer<=6||v.total===12&&dealer>=4&&dealer<=6)return 'stand';
      return 'hit';
    }
    if(options.double&&v.total===11)return 'double';
    return v.total>=17||!v.soft&&v.total>=13&&dealer<=6?'stand':'hit';
  }
  return {value,deck,botAction};
});
