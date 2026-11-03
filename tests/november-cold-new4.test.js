'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const root=path.resolve(__dirname,'..'),origin='http://localhost';
function fixture(store){return new Miniflare({...convertV4MiniflareOptions({name:'full-account-rooms',modules:true,script:fs.readFileSync(path.join(root,'dist/cloudflare/worker.js'),'utf8'),compatibilityDate:'2026-10-23',compatibilityFlags:['nodejs_compat'],durableObjects:{ACCOUNTS:{className:'AccountStore',useSQLite:true,unsafeUniqueKey:'test-account-store'},GAMING_HUB:{className:'GamingHub',useSQLite:true,unsafeUniqueKey:'test-game-hub'}},durableObjectsPersist:store,bindings:{ACCOUNT_PREVIEW:'1'},serviceBindings:{ASSETS:()=>new Response('fixture')}}),resourcePersistencePath:store});}
async function api(mf,route,session,data,method='POST'){const r=await mf.dispatchFetch(origin+'/api/account/'+route,{method,headers:{Origin:origin,'Content-Type':'application/json',...(session?{Cookie:session}:{})},body:method==='GET'?undefined:JSON.stringify(data||{})});const b=await r.json();return {status:r.status,body:b,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function peer(mf,game,cookie){const r=await mf.dispatchFetch(origin+'/'+game+'/ws',{headers:{Upgrade:'websocket',Origin:origin,Cookie:cookie}});assert.equal(r.status,101);const ws=r.webSocket,q=[],waiters=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);const index=waiters.findIndex(w=>(Array.isArray(w.type)?w.type.includes(m.type):w.type===m.type)&&w.matches(m));if(index>=0){const w=waiters.splice(index,1)[0];clearTimeout(w.timer);w.resolve(m);}else q.push(m);});ws.accept();return {ws,q,send(m){ws.send(JSON.stringify({...m,v:12}));},next(type,matches=()=>true){const i=q.findIndex(m=>(Array.isArray(type)?type.includes(m.type):m.type===type)&&matches(m));if(i>=0)return Promise.resolve(q.splice(i,1)[0]);return new Promise((resolve,reject)=>{const w={type,matches,resolve,timer:setTimeout(()=>{waiters.splice(waiters.indexOf(w),1);reject(Error('Timed out waiting for '+game+' '+type+'; received types '+q.map(m=>m.type).join(',')));},6000)};waiters.push(w);});},close(){try{ws.close(1000,'Test complete');}catch{}}};}

test('Cloud SQLite cold active recovery preserves all four new games and closed room tombstones',async t=>{
 execFileSync(process.execPath,['scripts/build-cloudflare.mjs'],{cwd:root,stdio:'pipe'});
 const store=fs.mkdtempSync(path.join(os.tmpdir(),'srac-cold-active-'));let mf=fixture(store);const peers=[],saved=[];
 t.after(async()=>{peers.forEach(p=>p.close());await mf.dispose();fs.rmSync(store,{recursive:true,force:true});});
 const stable=(game,s)=>({hand:s.hand,board:s.board,assets:s.assets,turn:s.turnId,round:s.round,match:s.matchId,revision:s.revision,stage:s.stage,stock:s.stock,discard:s.discard,players:s.players.map(p=>({id:p.id,count:p.count,pawns:p.pawns,position:p.position,cash:p.cash,score:p.score,wins:p.wins})),ledger:s.ledger});
 for(const game of ['uno','ludo','monopoli','reversi','dam','tangga','empat']){
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

