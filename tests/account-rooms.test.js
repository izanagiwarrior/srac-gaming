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
