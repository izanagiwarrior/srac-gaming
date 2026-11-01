'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const root=path.resolve(__dirname,'..'),origin='http://localhost';
function fixture(store){return new Miniflare({...convertV4MiniflareOptions({name:'full-account-rooms',modules:true,script:fs.readFileSync(path.join(root,'dist/cloudflare/worker.js'),'utf8'),compatibilityDate:'2026-10-23',compatibilityFlags:['nodejs_compat'],durableObjects:{ACCOUNTS:{className:'AccountStore',useSQLite:true,unsafeUniqueKey:'test-account-store'},GAMING_HUB:{className:'GamingHub',useSQLite:true,unsafeUniqueKey:'test-game-hub'}},durableObjectsPersist:store,bindings:{ACCOUNT_PREVIEW:'1'},serviceBindings:{ASSETS:()=>new Response('fixture')}}),resourcePersistencePath:store});}
async function api(mf,route,session,data,method='POST'){const r=await mf.dispatchFetch(origin+'/api/account/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session}:{})},body:method==='GET'?undefined:JSON.stringify(data||{})});const b=await r.json();return {status:r.status,body:b,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function peer(mf,game,cookie){const r=await mf.dispatchFetch(origin+'/'+game+'/ws',{headers:{Upgrade:'websocket',Origin:origin,Cookie:cookie}});assert.equal(r.status,101);const ws=r.webSocket,q=[],waiters=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const index=waiters.findIndex(w=>(Array.isArray(w.type)?w.type.includes(m.type):w.type===m.type)&&w.matches(m));if(index>=0){const w=waiters.splice(index,1)[0];clearTimeout(w.timer);w.resolve(m);}else q.push(m);});ws.accept();return {ws,q,send(m){ws.send(JSON.stringify({...m,v:12}));},next(type,matches=()=>true){const i=q.findIndex(m=>(Array.isArray(type)?type.includes(m.type):m.type===type)&&matches(m));if(i>=0)return Promise.resolve(q.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={type,matches,resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Timed out waiting for '+game+' '+type+'; received types '+q.map(m=>m.type).join(',')));},6000)};waiters.push(w);});},close(){try{ws.close(1000,'Test complete');}catch{}}};}


test('Four new games: spectator privacy, lock, queue, boundary and seat rotation',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-native-results-'));const mf=fixture(store);t.after(async()=>{await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 
 for(const game of ['uno','ludo','monopoli','reversi'])await t.test(game,async()=>{
  const cc=(await api(mf,'preview',null,{role:'player'})).cookie;const ca=(await api(mf,'signup',null,{name:'QA A',email:game+'-a@example.invalid',password:'qa-fixture-password'})).cookie,cb=(await api(mf,'signup',null,{name:'QA B',email:game+'-b@example.invalid',password:'qa-fixture-password'})).cookie;assert(ca&&cb);const peers=[await peer(mf,game,ca),await peer(mf,game,cb)];
  try{
   peers[0].send({type:'create',name:'QA A',seats:2,fillBots:false});const j=await peers[0].next('joined');await peers[0].next('state');
   peers[1].send({type:'join',name:'QA B',code:j.code});await peers[1].next('joined');await peers[1].next('state');await peers[0].next('state',s=>s.players.length===2);
   const spectator=await peer(mf,game,cc);peers.push(spectator);
   peers[0].send({type:'hub-lock',locked:true});await peers[0].next('state',s=>s.hub.locked);spectator.send({type:'join',code:j.code});assert.match((await spectator.next('error')).message,/dikunci/);
   peers[0].send({type:'hub-lock',locked:false});await peers[0].next('state',s=>!s.hub.locked);spectator.send({type:'join',code:j.code});await spectator.next('joined');const watching=await spectator.next('state');assert.equal(watching.spectator,true);
   spectator.send({type:'hub-queue',enabled:true});await spectator.next('state',s=>s.hub.queued);spectator.send({type:'hub-queue',enabled:true});assert.equal((await spectator.next('state',s=>s.hub.queued)).hub.queue.length,1);
   peers[1].send({type:'hub-yield',enabled:true});await peers[1].next('state',s=>s.hub.yielding);
   peers[0].send({type:'start',settings:{playMode:'quick',pointValue:1000}});
   const watchPlay=await spectator.next('state',s=>s.phase==='playing');assert.equal(watchPlay.spectator,true);if(game==='uno'){assert.deepEqual(watchPlay.hand,[]);assert.deepEqual(watchPlay.legal,[]);assert(watchPlay.players.every(p=>!p.hand));}
   let states=await Promise.all(peers.slice(0,2).map(p=>p.next('state',s=>s.phase==='playing'))),steps=0;
   for(;steps<5000&&states[0].phase==='playing';steps++){
    const seat=states.findIndex(s=>s.you===s.turnId);assert(seat>=0);const s=states[seat];let msg;
    if(game==='uno')msg=s.legal.length?{type:'play',id:s.legal[0],color:'red'}:{type:s.drawn?'pass':'draw'};
    if(game==='ludo')msg=s.canRoll?{type:'roll'}:{type:'move',pawn:s.legal[0]};
    if(game==='reversi')msg={type:'place',at:s.legal[0]};
    if(game==='monopoli'){
     const me=s.players.find(p=>p.id===s.you);
     msg=s.stage==='roll'?{type:'roll'}:s.stage==='end'?{type:'end'}:s.stage==='buy'?{type:me.cash>=s.board[me.position].price?'buy':'auction'}:s.stage==='auction'?{type:'auctionPass'}:s.stage==='debt'?me.cash>=s.debt.amount?{type:'pay'}:s.manage.mortgage.length?{type:'mortgage',asset:s.manage.mortgage[0]}:{type:'bankrupt'}:null;
    }
    assert(msg);await new Promise(r=>setTimeout(r,50));peers[seat].send({...msg,matchId:s.matchId,revision:s.revision});
    states=await Promise.all(peers.slice(0,2).map(p=>p.next(['state','error'],m=>m.type==='error'||m.revision>s.revision)));
    for(const m of states)assert.equal(m.type,'state',m.message);
   }
   assert(steps<5000);assert.equal(states[0].phase,'finished');assert.equal(states[0].ledger.length,1);
   const delta=states[0].ledger[0].players.map(p=>p.delta);assert.equal(delta.reduce((a,b)=>a+b,0),0);
   let boards;
   for(let i=0;i<60;i++){boards=await Promise.all([ca,cb].map(c=>api(mf,'leaderboard?game='+game,c,null,'GET')));if(boards.every(b=>b.body.me?.rounds===1))break;await new Promise(r=>setTimeout(r,20));}
   for(let i=0;i<2;i++){assert.equal(boards[i].body.me.rounds,1);assert.equal(boards[i].body.me.points,delta[i]);assert.equal(boards[i].body.me.money,delta[i]*1000);}
   const end=states[0];
   spectator.send({type:'hub-next',boundary:end.hub.boundary});assert.match((await spectator.next('error')).message,/host/);
   peers[0].send({type:'hub-next',boundary:'stale'});assert.match((await peers[0].next('error')).message,/berubah/);
   peers[0].send({type:'hub-next',boundary:end.hub.boundary});
   const rotated=await Promise.all(peers.map(p=>p.next('state',s=>s.matchId>end.matchId)));
   assert.equal(rotated[0].phase,'playing');assert.equal(rotated[0].hub.host,true);assert.equal(rotated[1].spectator,true);assert.equal(rotated[2].spectator,false);assert.equal(rotated[2].hub.queued,false);assert.equal(rotated[0].hub.queue.length,0);
   if(game==='uno'){assert.deepEqual(rotated[1].hand,[]);assert.deepEqual(rotated[1].legal,[]);assert.equal(rotated[2].hand.length,7);}
   peers[0].send({type:'hub-dissolve',confirm:true,code:end.code,roomId:end.hub.roomId});await Promise.all(peers.map(p=>p.next('room-dissolved')));
   spectator.send({type:'join',code:end.code});assert.match((await spectator.next('error')).message,/tidak|dibubarkan|ditemukan/i);
   for(const c of [ca,cb])assert.equal((await api(mf,'leaderboard?game='+game,c,null,'GET')).body.me.rounds,1);
  }finally{peers.forEach(p=>p.close());}
 });
});
