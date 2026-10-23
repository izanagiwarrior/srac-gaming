/* Hong Kong hand evaluation and HKMA payment ladder. No private table state. */
(function (root) {
  'use strict';
  const E = typeof module !== 'undefined' && module.exports ? require('./engine') : root.Engine;
  const PAYMENT = [0, 0, 0, 32, 64, 96, 128, 192, 256, 384, 512];
  // House extension below the official 3-fan threshold, used only in Casual.
  const CASUAL_PAYMENT = [0, 8, 16, ...PAYMENT.slice(3)];
  const ORPHANS = [0,8,9,17,18,26,27,28,29,30,31,32,33];
  const FLOWERS = ['Plum','Orchid','Chrysanthemum','Bamboo','Spring','Summer','Autumn','Winter'];
  const isFlower = t => t?.s === 'f';
  const isJoker = t => t?.s === 'j';
  const terminal = i => i >= 27 || i % 9 === 0 || i % 9 === 8;
  function flowerFans(flowers, seat, enabled) {
    if (!enabled) return [];
    if (!flowers.length) return [['Tanpa bunga / musim · variasi meja',1]];
    const result=[];
    for (let group=0;group<2;group++) {
      const set=new Set(flowers.filter(t=>Math.floor((t.n-1)/4)===group).map(t=>(t.n-1)%4));
      if (set.size===4) result.push([group?'Empat musim · variasi meja':'Empat bunga · variasi meja',2]);
      else if (set.has(seat)) result.push([group?'Musim sesuai angin kursi · variasi meja':'Bunga sesuai angin kursi · variasi meja',1]);
    }
    return result;
  }
  function scoreCandidate(win, melds, ctx) {
    const fans=[], add=(name,n)=>fans.push([name,n]);
    const sets=[...melds.map(m=>({type:m.type==='chow'?'chow':'pung',i:E.idxOf(m.tiles[0])})),...(win.sets||[])];
    const resolved=win.type==='orphans' ? ORPHANS.concat(win.pair) : [win.pair,win.pair,...sets.flatMap(s=>s.type==='chow'?[s.i,s.i+1,s.i+2]:[s.i,s.i,s.i])];
    const suits=new Set(resolved.filter(i=>i<27).map(i=>Math.floor(i/9))),honors=resolved.some(i=>i>=27);
    const pungs=sets.filter(s=>s.type==='pung').map(s=>s.i), dragons=pungs.filter(i=>i>=31),winds=pungs.filter(i=>i>=27&&i<31);
    if (win.type==='orphans') add('Tiga belas yatim (Thirteen Orphans)',10);
    else {
      if (sets.every(s=>s.type==='chow')) add('Semua Chow',1);
      if (sets.every(s=>s.type==='pung')) add('Semua Pung',3);
      if (resolved.every(terminal)) add('Semua terminal dan huruf',1);
      for (const i of dragons) add('Pung '+E.DRAG_ID[i-31],1);
      for (const i of winds) {
        if (i-27===ctx.seat) add('Pung angin kursi '+E.WIND_ID[ctx.seat],1);
        if (i-27===ctx.roundWind) add('Pung angin ronde '+E.WIND_ID[ctx.roundWind],1);
      }
      if (dragons.length===2&&win.pair>=31) add('Naga kecil (Small Dragons)',3);
      if (dragons.length===3) add('Naga besar (Big Dragons)',5);
      if (!win.jokers&&winds.length===3&&win.pair>=27&&win.pair<31) add('Angin kecil (Small Winds)',10);
      if (!win.jokers&&winds.length===4) add('Angin besar (Big Winds)',10);
      if (!win.jokers&&melds.filter(m=>m.type==='kong').length===4) add('Empat Kong',10);
      if (!win.jokers && !melds.length && sets.every(s=>s.type==='pung') && (ctx.zimo||win.pair===ctx.winningIndex)) add('Empat Pung tertutup',10);
      if (!win.jokers && resolved.every(i=>i<27&&terminal(i))) add('Semua terminal',10);
      if (!win.jokers && suits.size===1&&!honors&&!melds.length) {
        const c=Array(9).fill(0);for(const i of resolved)c[i%9]++;
        const base=[3,1,1,1,1,1,1,1,3];
        const nine=c.every((n,i)=>n>=base[i]);
        const before=c.slice();if(ctx.winningIndex<27)before[ctx.winningIndex%9]--;
        if(nine&&(ctx.zimo||before.every((n,i)=>n===base[i])))add('Sembilan gerbang (Nine Gates)',10);
      }
    }
    if (suits.size===1) add(honors?'Campur satu warna':'Satu warna penuh',honors?3:7);
    if (!win.jokers&&suits.size===0) add('Semua huruf',10);
    // HKMA explicitly treats a concealed Kong as a meld for Closed Hand.
    if (!melds.length) add('Tangan tertutup',1);
    if (ctx.zimo) add('Zimo',1);
    if (ctx.robbedKong) add('Merebut Kong',1);
    if (ctx.afterKong) add('Hu dari pengganti Kong',1);
    if (ctx.lastWall) add('Hu dari ubin terakhir tembok',1);
    if (!win.jokers&&ctx.heaven) add('Berkah langit (Heaven)',10);
    if (!win.jokers&&ctx.earth) add('Berkah bumi (Earth)',10);
    if (!win.jokers&&ctx.kongChain>=2&&ctx.zimo) add('Hu setelah Kong beruntun',10);
    fans.push(...flowerFans(ctx.flowers||[],ctx.seat,ctx.flowerBonus===true));
    const rawTotal=fans.reduce((sum,f)=>sum+f[1],0),total=Math.min(10,rawTotal);
    const casual=ctx.winMode==='casual',minimum=casual?0:3,ladder=casual?CASUAL_PAYMENT:PAYMENT;
    const chuck=casual&&total===0&&ctx.casualZero===false?4:(ladder[total]||0);
    return {fans,rawTotal,total,minimum,winMode:casual?'casual':'hkma',qualified:total>=minimum,chuck,selfEach:chuck/2};
  }
  // Enumerate distinct standard decompositions; scoring chooses the highest,
  // rather than accepting the first possible split of an ambiguous hand.
  function evaluate(hand,melds,context={}) {
    if(hand.length+melds.length*3!==14||hand.some(isFlower))return null;
    const ctx={seat:0,roundWind:0,...context},c=E.counts(hand),j=hand.filter(isJoker).length;
    if(j&&!ctx.jokers)return null;
    if(j>4||c.some(n=>n>4))return null;
    let best=null;const scored=new Set();
    function consider(win) {
      const key=win.type+':'+win.pair+':'+(win.sets||[]).map(s=>s.type+s.i).sort().join(',');if(scored.has(key))return;scored.add(key);
      if(ctx.concealedRob&&win.type!=='orphans')return;
      const score=scoreCandidate(win,melds,ctx);
      if(!best||score.total>best.score.total||score.total===best.score.total&&score.rawTotal>best.score.rawTotal)best={win,score};
    }
    // Joker house rule does not manufacture a limit/special hand.
    if(!melds.length&&!j&&c.every((n,i)=>ORPHANS.includes(i)||!n)&&ORPHANS.every(i=>c[i]>=1))consider({type:'orphans',pair:ORPHANS.find(i=>c[i]===2),jokers:0});
    function sets(need,wild,acc,pair) {
      const i=c.findIndex(n=>n>0);
      if(i<0){if(wild===need*3){
        // With four jokers at most one all-wild set is possible.
        if(need===0)consider({type:'std',pair,sets:acc.slice(),jokers:j});
        else if(need===1)for(let k=0;k<34;k++){consider({type:'std',pair,sets:[...acc,{type:'pung',i:k}],jokers:j});if(k<27&&k%9<=6)consider({type:'std',pair,sets:[...acc,{type:'chow',i:k}],jokers:j});}
      }return;}
      if(need<=0)return;
      for(let n=Math.min(3,c[i]);n>=1;n--){const used=3-n;if(used>wild)continue;c[i]-=n;acc.push({type:'pung',i});sets(need-1,wild-used,acc,pair);acc.pop();c[i]+=n;}
      if(i>=27)return;
      for(let start=Math.max(Math.floor(i/9)*9,i-2);start<=i&&start%9<=6;start++) {
        const ranks=[start,start+1,start+2];
        function sequence(k,left,used) {
          if(k===3){acc.push({type:'chow',i:start});sets(need-1,left,acc,pair);acc.pop();return;}
          const rank=ranks[k];
          if(c[rank]){c[rank]--;sequence(k+1,left,used);c[rank]++;}
          if(left&&rank!==i)sequence(k+1,left-1,used+1);
        }
        sequence(0,wild,0);
      }
    }
    for(let pair=0;pair<34;pair++)for(let n=Math.min(2,c[pair]);n>=0;n--){const used=2-n;if(used>j)continue;c[pair]-=n;sets(4-melds.length,j-used,[],pair);c[pair]+=n;}
    return best;
  }
  function settlement(score,winner,from,zimo,pao=null) {
    if(!score?.qualified)throw Error('Hu belum memenuhi syarat aturan menang meja.');
    const delta=[0,0,0,0],payments=[];
    if(zimo){
      if(Number.isInteger(pao)&&pao>=0&&pao<4&&pao!==winner){const points=score.selfEach*3;delta[pao]-=points;delta[winner]+=points;payments.push({from:pao,to:winner,points,reason:'Pao: seluruh pembayaran Zimo'});}
      else for(let seat=0;seat<4;seat++)if(seat!==winner){delta[seat]-=score.selfEach;delta[winner]+=score.selfEach;payments.push({from:seat,to:winner,points:score.selfEach,reason:'Zimo'});}
    }else{
      if(!Number.isInteger(from)||from<0||from>3||from===winner)throw Error('Pembuang ubin pemenang tidak valid.');
      delta[from]-=score.chuck;delta[winner]+=score.chuck;payments.push({from,to:winner,points:score.chuck,reason:'Hu dari buangan'});
    }
    return {delta,payments};
  }
  const HK={PAYMENT,CASUAL_PAYMENT,FLOWERS,isFlower,isJoker,evaluate,settlement,flowerFans};
  if(typeof module!=='undefined'&&module.exports)module.exports=HK;else root.HongKong=HK;
})(typeof globalThis!=='undefined'?globalThis:this);
