'use strict';
// HKMA English rulebook: Score Calculation / List of Faan Items / Faan to Score Table.
// Expected values below are fixtures from the rules, not obtained from the scorer.
const test=require('node:test'),assert=require('node:assert/strict');
const HK=require('../games/mahjong/hong-kong');
const E=require('../games/mahjong/engine');
const {createMahjongServer}=require('../games/mahjong/server');
let serial=0;
function tiles(text){return text.trim().split(/\s+/).filter(Boolean).flatMap(group=>{const suit=group.at(-1);return [...group.slice(0,-1)].map(n=>({...E.T(suit,+n),id:serial++}));});}
const meld=(text,type='pung',open=true)=>({type,open,tiles:tiles(text)});
function score(text,melds=[],ctx={}){const hand=tiles(text);return HK.evaluate(hand,melds,{seat:1,roundWind:0,winningIndex:E.idxOf(hand.at(-1)),...ctx});}
const has=(result,label,n)=>assert(result?.score.fans.some(([name,fan])=>name.includes(label)&&(n===undefined||fan===n)),JSON.stringify(result?.score));
const absent=(result,label)=>assert(!result?.score.fans.some(([name])=>name.includes(label)),JSON.stringify(result?.score));
function total(result,n){assert(result);assert.equal(result.score.total,n);assert.equal(result.score.qualified,n>=3);}
const base='123d 456d 123b 456c 55b';
test('closed all sequences is 2 fan on discard: not qualified',()=>{const r=score(base);total(r,2);has(r,'Semua Chow',1);has(r,'Tangan tertutup',1);});
test('closed all sequences self-draw is 3 fan',()=>total(score(base,[],{zimo:true}),3));
test('no automatic basic winning fan',()=>total(score('123d 456b 789c 55d',[meld('222b')]),0));
test('open all sequences is 1 fan',()=>total(score('456d 123b 456c 55b',[meld('123d','chow')]),1));
for(const [name,key] of [['rob Kong','robbedKong'],['Kong replacement','afterKong'],['last wall','lastWall']])test(name+' adds one fan',()=>total(score(base,[],{[key]:true}),3));
test('three circumstances stack with self-draw, no implicit exclusion',()=>total(score(base,[],{zimo:true,afterKong:true,lastWall:true}),5));
test('closed Kong is a meld: no Closed Hand fan',()=>{const r=score('123d 456b 789c 55d',[meld('2222b','kong',false)]);total(r,0);absent(r,'Tangan tertutup');});
for(let n=1;n<=3;n++)test('dragon triplet '+n+' adds 1 fan',()=>total(score('123d 456b 789c 55d',[meld(`${n}${n}${n}g`)]),1));
test('unrelated wind gives no fan',()=>total(score('123d 456b 789c 55d',[meld('444w')]),0));
test('seat wind gives 1 fan',()=>total(score('123d 456b 789c 55d',[meld('222w')]),1));
test('prevailing wind gives 1 fan',()=>total(score('123d 456b 789c 55d',[meld('111w')]),1));
test('overlapping seat/prevailing wind gives 2 fan',()=>total(score('123d 456b 789c 55d',[meld('111w')],{seat:0}),2));
test('open All Triplets = 3 fan',()=>total(score('444b 666c 888d 55b',[meld('222d')]),3));
test('semi-flush = 3 fan',()=>total(score('123d 456d 55d',[meld('789d','chow'),meld('444w')]),3));
test('small dragons includes 3 + 1 + 1 = 5 fan',()=>{const r=score('456b 33g',[meld('111g'),meld('222g'),meld('123d','chow')]);total(r,5);has(r,'Naga kecil',3);});
test('big dragons includes 5 + 1 + 1 + 1 = 8 fan',()=>{const r=score('55b',[meld('111g'),meld('222g'),meld('333g'),meld('123d','chow')]);total(r,8);has(r,'Naga besar',5);});
test('flush = 7 fan',()=>total(score('456d 789d 22d',[meld('111d'),meld('345d','chow')]),7));
test('all terminals and honours adds 1, All Triplets adds 3',()=>{const r=score('999b 444w 22g',[meld('111d'),meld('999c')]);total(r,4);has(r,'Semua terminal dan huruf',1);});
test('all honours reaches ceiling',()=>total(score('333w 444w 22g',[meld('111w'),meld('222w')]),10));
test('small winds reaches ceiling',()=>{const r=score('123d 44w',[meld('111w'),meld('222w'),meld('333w')]);total(r,10);has(r,'Angin kecil',10);});
test('big winds reaches ceiling',()=>{const r=score('22d',[meld('111w'),meld('222w'),meld('333w'),meld('444w')]);total(r,10);has(r,'Angin besar',10);});
test('all concealed triplets, self drawn, reaches ceiling',()=>has(score('222d 444b 666c 888d 55b',[],{zimo:true}),'Empat Pung tertutup',10));
test('all concealed triplets, discard completing pair, reaches ceiling',()=>has(score('222d 444b 666c 888d 55b'),'Empat Pung tertutup',10));
test('discard completing triplet cannot score all concealed triplets',()=>{const r=score('222d 444b 666c 888d 55b',[],{winningIndex:E.idxOf(E.T('d',8))});total(r,4);absent(r,'Empat Pung tertutup');});
test('a concealed Kong disqualifies all concealed triplets',()=>absent(score('444b 666c 888d 55b',[meld('2222d','kong',false)],{zimo:true}),'Empat Pung tertutup'));
test('four quads reaches ceiling',()=>has(score('55b',[meld('2222d','kong'),meld('4444b','kong'),meld('6666c','kong'),meld('8888d','kong')]),'Empat Kong',10));
test('all terminals reaches ceiling',()=>has(score('999b 999c 11c',[meld('111d'),meld('999d')]),'Semua terminal',10));
test('Thirteen Orphans reaches ceiling',()=>{const r=score('19d 19b 19c 1234w 123g 1d');total(r,10);assert.equal(r.win.type,'orphans');});
test('concealed Kong can be robbed only by Thirteen Orphans',()=>{assert(score('19d 19b 19c 1234w 123g 1d',[],{concealedRob:true}));assert.equal(score(base,[],{concealedRob:true}),null);});
test('Seven Pairs alone is not a Hong Kong winning pattern',()=>assert.equal(score('11d 44d 77d 22b 55b 88b 33c'),null));
test('nine gates nine-sided wait wins on discard',()=>has(score('11123456789995d'),'Sembilan gerbang',10));
test('nine gates non-nine-sided wait does not earn limit on discard',()=>{const r=score('11123456789995d',[],{winningIndex:E.idxOf(E.T('d',1))});absent(r,'Sembilan gerbang');total(r,8);});
test('nine gates non-nine-sided wait earns limit on self-draw',()=>has(score('11123456789995d',[],{winningIndex:E.idxOf(E.T('d',1)),zimo:true}),'Sembilan gerbang',10));
for(const [key,label] of [['heaven','Berkah langit'],['earth','Berkah bumi']])test(label+' reaches ceiling',()=>has(score(base,[],{[key]:true}),label,10));
test('consecutive Kong self-draw reaches ceiling',()=>has(score(base,[],{zimo:true,kongChain:2}),'Kong beruntun',10));
test('consecutive Kong limit does not apply to discard Hu',()=>absent(score(base,[],{kongChain:2}),'Kong beruntun'));
test('best decomposition chosen: 111222333 as triplets beats sequences',()=>{const r=score('111222333d 666b 55c',[],{winningIndex:0});has(r,'Semua Pung',3);total(r,4);});
test('flower tiles cannot be used as part of a winning hand',()=>assert.equal(score('123d 456d 123b 456c 5b 1f'),null));
test('unreplaced hand size rejected',()=>{assert.equal(score('123d 456d 123b 456c 5b'),null);assert.equal(score(base+' 1d'),null);});
test('five identical concealed tiles rejected',()=>assert.equal(score('11111d 234b 567c 111g'),null));
test('HKMA flowers add zero fan, regardless of collection',()=>{total(score(base,[],{zimo:true,flowers:tiles('12345678f')}),3);assert.deepEqual(HK.flowerFans([],0,false),[]);});
test('house bonus: no flowers 1 fan; seat flowers/matching seasons 1 each',()=>{assert.equal(HK.flowerFans([],0,true)[0][1],1);assert.equal(HK.flowerFans(tiles('15f'),0,true).reduce((n,f)=>n+f[1],0),2);});
test('house bonus complete group replaces matching seat bonus',()=>assert.equal(HK.flowerFans(tiles('12345678f'),0,true).reduce((n,f)=>n+f[1],0),4));
test('joker OFF rejects a joker hand; ON can complete pair',()=>{assert.equal(score('123d 456d 123b 456c 5b 1j'),null);total(score('123d 456d 123b 456c 5b 1j',[],{jokers:true,zimo:true}),3);});
test('joker can complete a sequence or triplet',()=>{assert(score('12d 123b 456b 789c 55d 1j',[],{jokers:true}));assert(score('11d 222b 444c 888d 55b 1j',[],{jokers:true}));});
test('joker cannot manufacture concealed triplets or heavenly limit',()=>{const r=score('11d 222b 444c 888d 55b 1j',[],{jokers:true,zimo:true,heaven:true});absent(r,'Empat Pung tertutup');absent(r,'Berkah langit');});
const expected=[32,64,96,128,192,256,384,512];
for(let fan=3;fan<=10;fan++)for(const mode of ['discard','self','pao'])test(`${fan} fan ${mode}: exact payer amounts / zero sum`,()=>{
  const points=expected[fan-3];assert.equal(HK.PAYMENT[fan],points);
  const s={qualified:true,total:fan,chuck:HK.PAYMENT[fan],selfEach:HK.PAYMENT[fan]/2};
  for(let winner=0;winner<4;winner++)for(let payer=0;payer<4;payer++)if(payer!==winner){
    const out=HK.settlement(s,winner,payer,mode!=='discard',mode==='pao'?payer:null);const want=[0,0,0,0];
    if(mode==='self'){for(let i=0;i<4;i++)if(i!==winner)want[i]=-points/2;want[winner]=3*points/2;}
    else{const value=mode==='pao'?3*points/2:points;want[payer]=-value;want[winner]=value;}
    assert.deepEqual(out.delta,want);assert.equal(out.delta.reduce((a,b)=>a+b,0),0);assert.equal(out.payments.reduce((a,p)=>a+p.points,0),want[winner]);
  }
});
test('discarder still pays when another person had Pao',()=>assert.deepEqual(HK.settlement({qualified:true,chuck:32,selfEach:16},0,1,false,2).delta,[32,-32,0,0]));
test('under-threshold settlement rejected; wrong discarder rejected',()=>{assert.throws(()=>HK.settlement({qualified:false},0,1,false));assert.throws(()=>HK.settlement({qualified:true},0,0,false));});

function fixture(t,overrides={}){
  const app=createMahjongServer();t.after(()=>app.close());
  const players=Array.from({length:4},(_,i)=>({seat:i,name:'Fixture '+i,token:'fixture-'+i,connected:true,bot:false,hand:[],melds:[],flowers:[],discards:[],drawn:null,score:0}));
  const room=app.restoreRoom({code:'VALIDATE',players,spectators:[],chat:[],history:[],ledger:[],state:'playing',hostToken:'fixture-0',settings:{ruleset:'hkma',rounds:4,pointValue:1000,claimMode:'assisted',flowers:true,jokers:false,flowerBonus:false,animateDeal:false},G:{dealer:0,dealerRotations:0,hand:1,maxHands:4,wall:tiles('123d'),gen:0,over:false,current:0,phase:'discard',discardCount:8,kongDeclarations:0,hadMeld:false,drawKind:'wall',kongChain:0,...overrides}});
  app.rooms.set(room.code,room);return room;
}
test('server settlement uses 3 fan exact score, rupiah and is idempotent',t=>{
  const r=fixture(t);r.players[0].hand=tiles(base);const tile=r.players[0].hand.at(-1);r.players[0].drawn=tile;
  r.endHand(0,tile,true);assert.deepEqual(r.G.result.delta,[48,-16,-16,-16]);assert.deepEqual(r.players.map(p=>p.score),[48,-16,-16,-16]);assert.equal(r.ledger[0].players[0].amount,48000);
  r.endHand(0,tile,true);assert.equal(r.ledger.length,1);assert.equal(r.players[0].score,48);
});
test('server rejects under-threshold Hu without changing balances',t=>{const r=fixture(t);r.players[0].hand=tiles(base);r.endHand(0,r.players[0].hand.at(-1),false,null,1);assert.equal(r.G.over,false);assert.equal(r.ledger.length,0);});
test('server computes seat and round wind independently after rotations',t=>{const r=fixture(t,{dealer:1,dealerRotations:4});r.players[2].melds=[meld('222w')];const hand=tiles('123d 456b 789c 55d');const result=r.evaluateHongKong(2,hand,false,hand.at(-1));total(result,2);});
test('server flower replacement comes from tail and never enters hand as flower',t=>{const r=fixture(t);r.G.wall=tiles('1f 2d 3d 2f');const first=r.G.wall[0],replacement=r.G.wall[2];const drawn=r.drawHongKong(0,false);assert.equal(drawn,replacement);assert.equal(r.players[0].flowers.length,2);assert(r.players[0].flowers.includes(first));assert.equal(r.G.wall.length,1);});
test('server opening conserves 144 tiles, 13/14 counts, replaces every initial flower',t=>{const r=fixture(t);r.recovering=true;r.startHongKongHand(r.players[0]);const all=[...r.G.wall,...r.players.flatMap(p=>[...p.hand,...p.flowers])];assert.equal(all.length,144);assert.equal(new Set(all.map(t=>t.id)).size,144);assert.deepEqual(r.players.map(p=>p.hand.length),[14,13,13,13]);assert(r.players.every(p=>!p.hand.some(HK.isFlower)));assert.equal(all.filter(HK.isFlower).length,8);});

test('server Pao fourth meld includes an earlier concealed Kong',async t=>{
  const r=fixture(t);r.players[0].melds=[meld('1111d','kong',false),meld('333b'),meld('555c')];r.players[0].hand=tiles('22d 55b');
  const tile=tiles('2d')[0];r.players[2].discards=[tile];r.G.last={tile,from:2};await r.applyClaim({p:0,type:'pung'});assert.equal(r.players[0].pao,2);
});
test('server Pao third dragon is set, later fourth meld replaces it',async t=>{
  const r=fixture(t);r.players[0].melds=[meld('111g'),meld('222g')];r.players[0].hand=tiles('33g 44b 55c');
  let tile=tiles('3g')[0];r.players[1].discards=[tile];r.G.last={tile,from:1};await r.applyClaim({p:0,type:'pung'});assert.equal(r.players[0].pao,1);
  tile=tiles('4b')[0];r.players[2].discards=[tile];r.G.last={tile,from:2};await r.applyClaim({p:0,type:'pung'});assert.equal(r.players[0].pao,2);
});
test('server fourth concealed Kong creates no new Pao',async t=>{
  const r=fixture(t);r.players[0].melds=[meld('1111d','kong'),meld('3333b','kong'),meld('5555c','kong')];r.players[0].hand=tiles('7777d 55b');r.players[0].pao=2;
  await r.doKong(0,'conc',E.idxOf(E.T('d',7)),true);assert.equal(r.players[0].pao,2);
});
test('server Pao self draw pays all, discard winner uses current discarder',t=>{
  const r=fixture(t);r.players[0].hand=tiles(base);r.players[0].pao=2;r.endHand(0,r.players[0].hand.at(-1),true);assert.deepEqual(r.G.result.delta,[48,0,-48,0]);
  const q=fixture(t);q.players[0].hand=tiles(base);q.G.robbedKong=true;q.players[0].pao=2;q.endHand(0,q.players[0].hand.at(-1),false,null,1);assert.deepEqual(q.G.result.delta,[32,-32,0,0]);
});
test('server first dealer discard counts Earth, normal later discard does not',t=>{
  const r=fixture(t,{discardCount:1,last:{from:0}});r.players[1].hand=tiles(base);has(r.evaluateHongKong(1,r.players[1].hand,false,r.players[1].hand.at(-1)),'Berkah bumi',10);
  r.G.discardCount=2;absent(r.evaluateHongKong(1,r.players[1].hand,false,r.players[1].hand.at(-1)),'Berkah bumi');
  r.G.discardCount=1;r.G.kongDeclarations=1;absent(r.evaluateHongKong(1,r.players[1].hand,false,r.players[1].hand.at(-1)),'Berkah bumi');
});
test('server initial dealer Hu counts Heaven only before Kong/discard',t=>{
  const r=fixture(t,{discardCount:0});r.players[0].hand=tiles(base);has(r.evaluateHongKong(0,r.players[0].hand,true,r.players[0].hand.at(-1)),'Berkah langit',10);
  r.G.kongDeclarations=1;absent(r.evaluateHongKong(0,r.players[0].hand,true,r.players[0].hand.at(-1)),'Berkah langit');
});
test('server ordinary draw resets Kong-chain bonuses',async t=>{
  const r=fixture(t,{kongChain:2,drawKind:'kong',robbedKong:true});await r.startTurn(0);assert.equal(r.G.kongChain,0);assert.equal(r.G.drawKind,'wall');assert.equal(r.G.robbedKong,false);
});
test('wall options conserve standard / flowers / joker tile inventories',()=>{
  for(const [options,count] of [[{},136],[{flowers:true},144],[{flowers:true,jokers:true},148]]){const w=E.buildWall(options);assert.equal(w.length,count);assert.equal(new Set(w.map(t=>t.id)).size,count);assert.equal(w.filter(HK.isFlower).length,options.flowers?8:0);assert.equal(w.filter(HK.isJoker).length,options.jokers?4:0);}
});
test('1000 seeded natural standard hands agree with separate engine decomposition',()=>{
  let seed=0x23a10;const next=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};let accepted=0;
  while(accepted<1000){const indices=[];for(let k=0;k<4;k++){if(next(2)){const i=next(34);indices.push(i,i,i);}else{const i=next(3)*9+next(7);indices.push(i,i+1,i+2);}}const pair=next(34);indices.push(pair,pair);const hand=indices.map(E.fromIdx);if(E.counts(hand).some(n=>n>4))continue;
    assert(E.findWin(hand,[]));const r=HK.evaluate(hand,[],{seat:1,roundWind:0,winningIndex:pair,zimo:true});assert(r);assert(r.score.total>=0&&r.score.total<=10);assert.equal(r.score.total,Math.min(10,r.score.fans.reduce((n,f)=>n+f[1],0)));accepted++;
  }
});
for(const [count,hand] of [[2,'123d 456b 789c 11g 1d 11j'],[3,'123d 456b 789c 11g 111j'],[4,'123d 456b 789c 1g 1111j']])test(count+' jokers complete only a normal concealed hand',()=>{const r=score(hand,[],{jokers:true,zimo:true});assert(r);assert.equal(r.win.jokers,count);assert.equal(r.win.type,'std');});
test('all-wild meld may choose a scoring representation without limit patterns',()=>{const r=score('123d 456b 789c 1g 1111j',[],{jokers:true,zimo:true});assert(r);assert(r.score.total<10);});
