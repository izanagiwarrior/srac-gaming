'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const root=path.resolve(__dirname,'..'),origin='http://localhost';
function fixture(store){return new Miniflare({...convertV4MiniflareOptions({name:'full-account-rooms',modules:true,script:fs.readFileSync(path.join(root,'dist/cloudflare/worker.js'),'utf8'),compatibilityDate:'2026-10-23',compatibilityFlags:['nodejs_compat'],durableObjects:{ACCOUNTS:{className:'AccountStore',useSQLite:true,unsafeUniqueKey:'test-account-store'},GAMING_HUB:{className:'GamingHub',useSQLite:true,unsafeUniqueKey:'test-game-hub'}},durableObjectsPersist:store,bindings:{ACCOUNT_PREVIEW:'1'},serviceBindings:{ASSETS:()=>new Response('fixture')}}),resourcePersistencePath:store});}
async function api(mf,route,session,data,method='POST'){const r=await mf.dispatchFetch(origin+'/api/account/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session}:{})},body:method==='GET'?undefined:JSON.stringify(data||{})});const b=await r.json();return {status:r.status,body:b,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function peer(mf,game,cookie){const r=await mf.dispatchFetch(origin+'/'+game+'/ws',{headers:{Upgrade:'websocket',Origin:origin,Cookie:cookie}});assert.equal(r.status,101);const ws=r.webSocket,q=[],waiters=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const index=waiters.findIndex(w=>(Array.isArray(w.type)?w.type.includes(m.type):w.type===m.type)&&w.matches(m));if(index>=0){const w=waiters.splice(index,1)[0];clearTimeout(w.timer);w.resolve(m);}else q.push(m);});ws.accept();return {ws,q,send(m){ws.send(JSON.stringify({...m,v:12}));},next(type,matches=()=>true){const i=q.findIndex(m=>(Array.isArray(type)?type.includes(m.type):m.type===type)&&matches(m));if(i>=0)return Promise.resolve(q.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={type,matches,resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Timed out waiting for '+game+' '+type+'; received types '+q.map(m=>m.type).join(',')));},6000)};waiters.push(w);});},close(){try{ws.close(1000,'Test complete');}catch{}}};}

test('Cloud SQLite six-game account ownership and two-device handoff',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-account-rooms-'));let mf=fixture(store);t.after(async()=>{await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 let a1=(await api(mf,'preview',null,{role:'admin'})).cookie,a2=(await api(mf,'preview',null,{role:'admin'})).cookie,b=(await api(mf,'preview',null,{role:'player'})).cookie;
 for(const game of ['capsa','mahjong','poker','catur','domino','blackjack'])await t.test(game+' rejects theft/duplicates and transfers the same seat',async()=>{
  const first=await peer(mf,game,a1),second=await peer(mf,game,a2),third=await peer(mf,game,a1),intruder=await peer(mf,game,b);const all=[first,second,third,intruder];
  try{
   first.send({type:'create',name:'Ignored name',seats:2,fillBots:true});const original=await first.next('joined');
   second.send({type:'join',name:'Another seat',code:original.code});const offer=await second.next('account-room-offer');assert.equal(offer.seats.length,1);assert.equal(offer.seats[0].code,original.code);assert(!JSON.stringify(offer).includes(original.token));
   intruder.send({type:['capsa','mahjong'].includes(game)?'rejoin':'resume',code:original.code,token:original.token});assert.equal((await intruder.next('error')).accountConflict,true);assert(!intruder.q.some(m=>m.type==='joined'));
   third.send({type:'hub-account-list'});const stale=await third.next('account-room-offer');
   second.send({type:'hub-account-claim',handoffId:offer.handoffId,roomId:offer.seats[0].roomId});const moved=await second.next('joined');assert.equal(moved.code,original.code);assert.notEqual(moved.token,original.token);await first.next('replaced');
   third.send({type:'hub-account-claim',handoffId:stale.handoffId,roomId:stale.seats[0].roomId});const fresh=await third.next('account-room-offer');assert.notEqual(fresh.handoffId,stale.handoffId);assert(!third.q.some(m=>m.type==='joined'));
   third.send({type:'create',name:'Duplicate room',seats:2});const blocked=await third.next('account-room-offer');assert.equal(blocked.seats[0].code,original.code);
   const movedState=await second.next(game==='mahjong'?'lobby':'state');assert.equal(movedState.players.filter(p=>!p.bot).length,1);assert.equal(movedState.hub.host,true);
   second.send({type:'leave'});await second.next('left');third.send({type:'hub-account-list'});assert.equal((await third.next('account-room-offer')).seats.length,0);
   third.send({type:'create',name:'Fresh room',seats:2,fillBots:true});await third.next('joined');third.send({type:'leave'});await third.next('left');
  }finally{all.forEach(p=>p.close());}
 });
 for(const game of ['capsa','mahjong','poker','catur','domino','blackjack'])await t.test(game+' keeps in-progress cards/board, balances and host on handoff',async()=>{
  const address='active-'+game+'@example.invalid',pass='isolated-device-test-password';const one=await api(mf,'signup',null,{name:'Device '+game,email:address,password:pass}),two=await api(mf,'login',null,{email:address,password:pass});
  const first=await peer(mf,game,one.cookie),second=await peer(mf,game,two.cookie);
  try{
   first.send({type:'create',name:'A',seats:2,fillBots:true,practice:true,settings:{bots:game==='blackjack'?0:1}});const j=await first.next('joined');await first.next(game==='mahjong'?'lobby':'state');first.q.length=0;
   first.send({type:'start',settings:{tablePreset:'custom',animateDeal:false,bots:game==='blackjack'?0:1}});let state=await first.next('state',m=>m.phase!=='lobby');
   if(game==='blackjack'){first.q.length=0;first.send({type:'bet',amount:10,revision:state.revision});state=await first.next('state',m=>m.phase!=='betting');}
   const privateState=s=>({cards:game==='mahjong'?s.players[s.you].hand:game==='poker'?s.players.find(p=>p.id===s.you).hole:game==='blackjack'?s.players.find(p=>p.id===s.you).hands:s.hand,board:s.board||s.fen||s.game?.board,chain:s.chain,phase:s.phase,turn:s.turn??s.current??s.turnId??s.game?.turn,match:s.matchId,hand:s.game?.handNo,round:s.round,points:s.players.map(p=>[p.score,p.stack,p.totalBuyIn])});
   second.send({type:'hub-account-list'});const offer=await second.next('account-room-offer');second.send({type:'hub-account-claim',handoffId:offer.handoffId,roomId:offer.seats[0].roomId});const moved=await second.next('joined');const after=await second.next('state');assert.equal(moved.code,j.code);assert.deepEqual(privateState(after),privateState(state));assert(after.hub.host);await first.next('replaced');
   second.send({type:'hub-dissolve',confirm:true,code:after.code,roomId:after.hub.roomId});await second.next('room-dissolved');
  }finally{first.close();second.close();}
 });
 await t.test('one account cannot create a second game while holding a room',async()=>{
  const chess=await peer(mf,'catur',a1),domino=await peer(mf,'domino',a2);try{chess.send({type:'create',name:'A'});const j=await chess.next('joined');domino.send({type:'create',name:'A',seats:2});const offer=await domino.next('account-room-offer');assert.equal(offer.seats[0].game,'catur');assert.equal(offer.seats[0].code,j.code);chess.send({type:'leave'});await chess.next('left');}finally{chess.close();domino.close();}
 });
 await t.test('two simultaneous handoffs grant only one new controller',async()=>{
  const old=await peer(mf,'catur',a1),one=await peer(mf,'catur',a2),two=await peer(mf,'catur',a2);try{
   old.send({type:'create',name:'A'});await old.next('joined');one.send({type:'hub-account-list'});two.send({type:'hub-account-list'});const x=await one.next('account-room-offer'),y=await two.next('account-room-offer');
   one.send({type:'hub-account-claim',handoffId:x.handoffId,roomId:x.seats[0].roomId});two.send({type:'hub-account-claim',handoffId:y.handoffId,roomId:y.seats[0].roomId});
   const results=await Promise.all([one.next(['joined','account-room-offer']),two.next(['joined','account-room-offer'])]);assert.equal(results.filter(r=>r.type==='joined').length,1);assert.equal(results.filter(r=>r.type==='account-room-offer').length,1);
   const winner=results[0].type==='joined'?one:two;winner.send({type:'leave'});await winner.next('left');
  }finally{old.close();one.close();two.close();}
 });
 await t.test('account socket cap prevents idle tabs exhausting every seat',async()=>{
  const peers=[];try{for(let i=0;i<8;i++)peers.push(await peer(mf,'blackjack',a1));const r=await mf.dispatchFetch(origin+'/blackjack/ws',{headers:{Upgrade:'websocket',Origin:origin,Cookie:a1}});assert.equal(r.status,429);await r.text();}finally{peers.forEach(p=>p.close());}
 });
 await t.test('different accounts with the same display name can join Poker safely',async()=>{
  assert.equal((await api(mf,'profile',a2,{name:'Same friend'},'PATCH')).status,200);assert.equal((await api(mf,'profile',b,{name:'Same friend'},'PATCH')).status,200);
  const one=await peer(mf,'poker',a2),two=await peer(mf,'poker',b);try{
   one.send({type:'create',name:'Spoofed profile'});const j=await one.next('joined');two.send({type:'join',name:'Spoofed profile',code:j.code});await two.next('joined');const state=await two.next('state');assert.equal(state.players.length,2);assert.notEqual(state.players[0].name,state.players[1].name);assert.equal(state.players[0].name,'Same friend');assert.equal(state.players[1].name,'Same friend · 2');assert.equal((await api(mf,'me',b,{},'GET')).body.user.name,'Same friend');
   two.send({type:'leave'});await two.next('left');one.send({type:'leave'});await one.next('left');
  }finally{one.close();two.close();}
 });
 await t.test('logout immediately closes its game socket, preserves other device session and account seat',async()=>{
  const first=await peer(mf,'blackjack',a1);first.send({type:'create',name:'A'});const j=await first.next('joined');assert.equal((await api(mf,'logout',a1,{})).status,200);await first.next('account-session-ended');assert.equal((await api(mf,'me',a1,{},'GET')).body.user,null);assert((await api(mf,'me',a2,{},'GET')).body.user);
  const other=await peer(mf,'blackjack',a2);other.send({type:'hub-account-list'});const offer=await other.next('account-room-offer');assert.equal(offer.seats[0].code,j.code);other.send({type:'hub-account-claim',handoffId:offer.handoffId,roomId:offer.seats[0].roomId});await other.next('joined');other.send({type:'leave'});await other.next('left');other.close();first.close();
 });
 await t.test('logout-other-devices closes the other socket and retains the caller',async()=>{
  a1=(await api(mf,'preview',null,{role:'admin'})).cookie;const first=await peer(mf,'catur',a1);assert.equal((await api(mf,'logout-others',a2,{})).status,200);await first.next('account-session-ended');assert.equal((await api(mf,'me',a1,{},'GET')).body.user,null);assert((await api(mf,'me',a2,{},'GET')).body.user);first.close();
 });
 await t.test('cold runtime recovery discovers the account seat without a local token',async()=>{
  const a=await peer(mf,'poker',a2);a.send({type:'create',name:'A'});const j=await a.next('joined');a.close();await mf.dispose();mf=fixture(store);
  const other=await peer(mf,'poker',a2);other.send({type:'hub-account-list'});const offer=await other.next('account-room-offer');assert.equal(offer.seats[0].code,j.code);other.send({type:'hub-account-claim',handoffId:offer.handoffId,roomId:offer.seats[0].roomId});const recovered=await other.next('joined');assert.equal(recovered.code,j.code);other.send({type:'leave'});await other.next('left');other.close();
 });
});

test('Cloud SQLite real-time disconnect grace and account reconnect keep the same active Chess seat',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-cloud-grace-')),mf=fixture(store),peers=[];
 t.after(async()=>{peers.forEach(p=>p.close());await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 const cookies=[];for(let i=0;i<2;i++)cookies.push((await api(mf,'signup',null,{name:'Grace '+i,email:'grace'+i+'@example.invalid',password:'private-grace-test-password'})).cookie);
 const first=await peer(mf,'catur',cookies[0]),observer=await peer(mf,'catur',cookies[1]);peers.push(first,observer);
 first.send({type:'create',name:'Grace 0',settings:{bots:0}});const j=await first.next('joined');observer.send({type:'join',code:j.code,name:'Grace 1'});await observer.next('joined');
 first.send({type:'start',settings:{bots:0,clockMode:'blitz5'}});const initial=await observer.next('state',s=>s.phase==='playing'),id=initial.players.find(p=>p.name==='Grace 0').id;
 const claim=async()=>{const p=await peer(mf,'catur',cookies[0]);peers.push(p);p.send({type:'hub-account-list'});const o=await p.next('account-room-offer');p.send({type:'hub-account-claim',handoffId:o.handoffId,roomId:o.seats[0].roomId});await p.next('joined');return p;};
 const row=s=>s.hub.presence.find(p=>p.id===id);
 first.close();const gone=await observer.next('state',s=>row(s)?.connected===false);assert.equal(row(gone).proxy,false);assert(row(gone).deadline>Date.now());
 const resumed=await claim();const back=await observer.next('state',s=>row(s)?.connected===true);assert.equal(back.fen,initial.fen);assert.equal(row(back).proxy,false);
 observer.q.length=0;resumed.close();const waiting=await observer.next('state',s=>row(s)?.connected===false),deadline=row(waiting).deadline;
 await new Promise(r=>setTimeout(r,Math.max(0,deadline-Date.now()-250)));
 assert(!observer.q.some(s=>s.type==='state'&&row(s)?.proxy),'no early takeover in the actual Workers timer adapter');
 const proxy=await observer.next('state',s=>row(s)?.proxy===true);assert(Date.now()>=deadline);assert.equal(proxy.players.find(p=>p.id===id).bot,false);
 const finalPeer=await claim(),after=await finalPeer.next('state');assert.equal(after.fen,initial.fen);assert.equal(row(after).proxy,false);assert.deepEqual(after.players.map(p=>p.score),initial.players.map(p=>p.score));
 finalPeer.send({type:'hub-dissolve',confirm:true,code:after.code,roomId:after.hub.roomId});await finalPeer.next('room-dissolved');
});

test('Cloud SQLite cold active recovery preserves all six games and closed room tombstones',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-cold-active-'));let mf=fixture(store);const peers=[],saved=[];
 t.after(async()=>{peers.forEach(p=>p.close());await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 const stable=(game,s)=>({cards:game==='mahjong'?s.players[s.you].hand:game==='poker'?s.players.find(p=>p.id===s.you).hole:game==='blackjack'?s.players.find(p=>p.id===s.you).hands:s.hand,board:s.board||s.fen||s.game?.board,chain:s.chain,phase:s.phase,turn:s.turn??s.current??s.turnId??s.game?.turn,match:s.matchId,hand:s.game?.handNo,round:s.round,points:s.players.map(p=>[p.id,p.score,p.stack,p.totalBuyIn]),dealer:s.dealer,wall:s.wallCount});
 for(const game of ['capsa','mahjong','poker','catur','domino','blackjack']){
  const signup=await api(mf,'signup',null,{name:'Cold '+game,email:'cold-'+game+'@example.invalid',password:'private-cold-runtime-test'});assert.equal(signup.status,201);
  const p=await peer(mf,game,signup.cookie);peers.push(p);p.send({type:'create',name:'Ignored',seats:2,fillBots:true,practice:true,settings:{bots:game==='blackjack'?0:1}});const j=await p.next('joined');await p.next(game==='mahjong'?'lobby':'state');p.q.length=0;
  p.send({type:'start',settings:{tablePreset:'custom',animateDeal:false,bots:game==='blackjack'?0:1,clockMode:'blitz5'}});const state=await p.next('state',s=>s.phase!=='lobby');
  saved.push({game,cookie:signup.cookie,code:j.code,token:j.token,state});
 }
 // Kill the private runtime with live sockets, as opposed to orderly native Leave.
 await mf.dispose();mf=fixture(store);
 for(const f of saved)await t.test(f.game+' resumes its DB-owned active seat only after host continuation',async()=>{
  const p=await peer(mf,f.game,f.cookie);peers.push(p);p.send({type:'hub-account-list'});const offer=await p.next('account-room-offer');assert.equal(offer.seats.length,1);assert.equal(offer.seats[0].code,f.code);
  p.send({type:'hub-account-claim',handoffId:offer.handoffId,roomId:offer.seats[0].roomId});const j=await p.next('joined'),s=await p.next('state');assert.notEqual(j.token,f.token);assert.deepEqual(stable(f.game,s),stable(f.game,f.state));assert.equal(s.hub.host,true);assert.equal(s.hub.recovering,true);assert(s.hub.presence.every(row=>!row.proxy&&!row.deadline));
  p.send({type:'start'});assert.match((await p.next('error')).message,/jeda|dipulihkan/i);
  p.q.length=0;await new Promise(r=>setTimeout(r,3100));assert(!p.q.some(m=>m.type==='state'&&JSON.stringify(stable(f.game,m))!==JSON.stringify(stable(f.game,s))),'paused bots must not move during cold recovery');
  p.send({type:'hub-resume'});await p.next('state',m=>m.hub?.recovering===false);
  p.send({type:'hub-dissolve',confirm:true,code:f.code,roomId:s.hub.roomId});await p.next('room-dissolved');p.close();
 });
 await mf.dispose();mf=fixture(store);
 for(const f of saved)await t.test(f.game+' dissolved code stays unavailable after another cold start',async()=>{
  const p=await peer(mf,f.game,f.cookie);peers.push(p);p.send({type:'hub-account-list'});assert.equal((await p.next('account-room-offer')).seats.length,0);p.send({type:'join',code:f.code,name:'Ignored'});const e=await p.next('error');assert(!p.q.some(m=>m.type==='joined'));assert.match(e.message||e.msg,/tidak ditemukan/i);p.close();
 });
});

test('Cloud SQLite Mahjong opening and pending claims survive cold recovery',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 for(const mode of ['opening','claim','undo'])await t.test(mode,async st=>{
  const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-mahjong-phase-'));let mf=fixture(store);const peers=[],cookies=[];st.after(async()=>{peers.forEach(p=>p.close());await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
  const n=mode==='opening'?1:4;
  for(let i=0;i<n;i++){cookies.push((await api(mf,'signup',null,{name:'Phase '+i,email:'phase'+i+'@example.invalid',password:'private-phase-test-password'})).cookie);peers.push(await peer(mf,'mahjong',cookies[i]));}
  peers[0].send({type:'create',name:'Ignored'});const j=await peers[0].next('joined');await peers[0].next('lobby');
  for(let i=1;i<n;i++){peers[i].send({type:'join',name:'Ignored',code:j.code});await peers[i].next('joined');}
  for(const p of peers)p.q.length=0;
  peers[0].send({type:'start',settings:{tablePreset:'custom',animateDeal:mode==='opening',claimMode:'manual'}});
  let before=await Promise.all(peers.map(p=>p.next('state',s=>s.phase===(mode==='opening'?'opening':'discard'))));
  if(mode!=='opening'){
   for(const p of peers)p.q.length=0;const s=before[0],actor=peers[s.current],own=before[s.current].players[s.current];actor.send({type:'action',action:'discard',id:own.drawn||own.hand[0].id});before=await Promise.all(peers.map(p=>p.next('state',s=>mode==='claim'?s.claimOpen:s.phase==='claim'&&!s.claimOpen)));if(mode==='claim')assert.equal(before[0].claimWaiting.length,3);else assert(before[s.current].undoUntil>Date.now());
  }
  await mf.dispose();mf=fixture(store);const fresh=[],after=[];
  for(let i=0;i<n;i++){const p=await peer(mf,'mahjong',cookies[i]);peers.push(p);fresh.push(p);p.send({type:'hub-account-list'});const o=await p.next('account-room-offer');p.send({type:'hub-account-claim',handoffId:o.handoffId,roomId:o.seats[0].roomId});await p.next('joined');after.push(await p.next('state'));}
  if(mode==='undo')assert(after.every(s=>s.undoUntil===null),'old undo window expires on cold recovery');
  const projection=s=>({phase:s.phase,current:s.current,wall:s.wall,opening:s.opening,layout:s.wallLayout,last:s.last,claimId:s.claimId,waiting:s.claimWaiting,options:s.options,hand:s.players[s.you].hand,flowers:s.players.map(p=>p.flowers),melds:s.players.map(p=>p.melds),discards:s.players.map(p=>p.discards),scores:s.players.map(p=>p.score)});
  for(let i=0;i<n;i++){assert.equal(after[i].hub.recovering,true);assert.deepEqual(projection(after[i]),projection(before[i]));fresh[i].q.length=0;}
  await new Promise(r=>setTimeout(r,1100));assert(!fresh[0].q.some(s=>s.type==='state'&&JSON.stringify(projection(s))!==JSON.stringify(projection(after[0]))));
  fresh[0].send({type:'hub-resume'});const continued=await Promise.all(fresh.map(p=>p.next('state',s=>s.hub?.recovering===false)));
  if(mode==='opening'){
   fresh[0].send({type:'action',action:'skip-opening',openingId:continued[0].opening.id});const done=await fresh[0].next('state',s=>s.phase==='discard');assert.equal(done.players.reduce((n,p)=>n+p.handCount,0),53);assert.equal(done.wall,before[0].wall);assert(done.players[done.you].hand.length>=13);
  }else{
   const s=continued[0];for(const seat of s.claimWaiting)fresh[seat].send({type:'action',action:'claim',claim:'pass',claimId:s.claimId});const next=await fresh[0].next('state',s=>s.phase==='discard'&&!s.claimOpen);assert.equal(next.current,(s.last.from+1)%4);assert(next.wall<s.wall);assert.equal(next.players.reduce((n,p)=>n+p.handCount,0),53);
  }
  fresh[0].send({type:'hub-dissolve',confirm:true,code:j.code,roomId:after[0].hub.roomId});await fresh[0].next('room-dissolved');
 });
});

test('Cloud SQLite Blackjack dealt wagers survive restart without duplicate debit or payout',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-blackjack-dealt-'));let mf=fixture(store);const peers=[];t.after(async()=>{peers.forEach(p=>p.close());await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 const signup=await api(mf,'signup',null,{name:'Dealt player',email:'dealt@example.invalid',password:'private-dealt-test-password'}),p=await peer(mf,'blackjack',signup.cookie);peers.push(p);p.send({type:'create',name:'Ignored',settings:{bots:0}});await p.next('joined');await p.next('state');p.q.length=0;p.send({type:'start',settings:{bots:0}});let before=await p.next('state',s=>s.phase==='betting');
 for(let attempt=0;attempt<10;attempt++){
  p.q.length=0;p.send({type:'bet',amount:10,revision:before.revision});before=await p.next('state',s=>s.phase!=='betting');if(before.phase==='playing')break;
  while(before.phase==='dealer')before=await p.next('state');assert.equal(before.phase,'finished');p.send({type:'next'});before=await p.next('state',s=>s.phase==='betting');
 }
 assert.equal(before.phase,'playing','bounded fixture needs a non-natural player hand');assert(before.players[0].hands[0].cards.length===2);assert.equal(before.players[0].hands[0].bet,10);
 const stable=s=>({phase:s.phase,round:s.round,turn:s.turnId,dealer:s.dealer,players:s.players.map(p=>[p.id,p.stack,p.totalBuyIn,p.bet,p.hands,p.handIndex,p.score]),house:s.house,ledger:s.ledger});
 await mf.dispose();mf=fixture(store);const q=await peer(mf,'blackjack',signup.cookie);peers.push(q);q.send({type:'hub-account-list'});const o=await q.next('account-room-offer');q.send({type:'hub-account-claim',handoffId:o.handoffId,roomId:o.seats[0].roomId});await q.next('joined');const restored=await q.next('state');assert(restored.hub.recovering);assert.deepEqual(stable(restored),stable(before));
 q.send({type:'stand',revision:restored.revision});assert.match((await q.next('error')).message,/jeda|dipulihkan/i);q.send({type:'hub-resume'});const resumed=await q.next('state',s=>!s.hub.recovering);assert.deepEqual(stable(resumed),stable(before));
 q.q.length=0;q.send({type:'stand',revision:resumed.revision});const dealerCheckpoint=await q.next('state',s=>s.phase==='dealer');await mf.dispose();mf=fixture(store);
 const dealerPeer=await peer(mf,'blackjack',signup.cookie);peers.push(dealerPeer);dealerPeer.send({type:'hub-account-list'});const dealerOffer=await dealerPeer.next('account-room-offer');dealerPeer.send({type:'hub-account-claim',handoffId:dealerOffer.handoffId,roomId:dealerOffer.seats[0].roomId});await dealerPeer.next('joined');const dealerRestored=await dealerPeer.next('state');assert(dealerRestored.hub.recovering);assert.deepEqual(stable(dealerRestored),stable(dealerCheckpoint));dealerPeer.send({type:'hub-resume'});await dealerPeer.next('state',s=>!s.hub.recovering);
 let done;for(let i=0;i<12;i++){done=await dealerPeer.next('state');if(done.phase==='finished')break;}assert.equal(done.phase,'finished');assert.equal(done.house+done.players.reduce((sum,p)=>sum+p.stack,0),done.players.reduce((sum,p)=>sum+p.totalBuyIn,0));
 const settled=stable(done);await mf.dispose();mf=fixture(store);const last=await peer(mf,'blackjack',signup.cookie);peers.push(last);last.send({type:'hub-account-list'});const own=await last.next('account-room-offer');last.send({type:'hub-account-claim',handoffId:own.handoffId,roomId:own.seats[0].roomId});await last.next('joined');const final=await last.next('state');assert.equal(final.hub.recovering,false);assert.deepEqual(stable(final),settled);assert.equal(final.ledger.length,done.ledger.length);last.send({type:'hub-dissolve',confirm:true,code:final.code,roomId:final.hub.roomId});await last.next('room-dissolved');
});
