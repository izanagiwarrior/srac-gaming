'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {buildSync}=require('esbuild'),{Miniflare,convertV4MiniflareOptions}=require('miniflare');
const root=path.resolve(__dirname,'..');
function bundle(source){return buildSync({stdin:{contents:source,resolveDir:root,sourcefile:'account-test-worker.js'},bundle:true,write:false,format:'esm',platform:'neutral',external:['cloudflare:workers']}).outputFiles[0].text;}
test('AccountStore authentication, permissions, purchases, audit and reward invariants',async t=>{
 const script=bundle("export {AccountStore} from './cloudflare/accounts/store.js'; export default {fetch(r,e){return e.ACCOUNTS.get(e.ACCOUNTS.idFromName('accounts-v1')).fetch(r)}}");
 const mf=new Miniflare(convertV4MiniflareOptions({name:'account-tests',modules:true,script,compatibilityDate:'2026-10-23',durableObjects:{ACCOUNTS:{className:'AccountStore',useSQLite:true}},bindings:{ACCOUNT_PREVIEW:'1'}}));t.after(()=>mf.dispose());
 const origin='http://localhost';
 async function call(route,{method='GET',data,session,originHeader=origin}={}){const headers={};if(method!=='GET'){headers.Origin=originHeader;headers['Content-Type']='application/json';}if(session)headers.Cookie=session;const r=await mf.dispatchFetch(origin+route,{method,headers,body:data===undefined?undefined:JSON.stringify(data),redirect:'manual'});const text=await r.text();let body;try{body=JSON.parse(text);}catch{body=text;}return {status:r.status,body,cookie:r.headers.get('set-cookie')?.split(';')[0],location:r.headers.get('location')};}
 let admin,player,target,signup;
 await t.test('unauthenticated protected APIs are denied',async()=>{for(const route of ['/api/account/admin/overview','/api/account/admin/users','/api/account/history'])assert.equal((await call(route)).status,401);});
 await t.test('missing Google configuration and callback state fail safely',async()=>{assert.equal((await call('/auth/google')).location,origin+'/account/?error=google_setup');assert.equal((await call('/auth/google/callback?code=invalid')).status,401);});
 await t.test('bootstrap admin cannot be claimed using a password',async()=>{assert.equal((await call('/api/account/signup',{method:'POST',data:{name:'Spoof',email:'faiz.triputra@shopee.com',password:'long-test-password-only'}})).status,403);});
 await t.test('local demo login requires loopback as well as preview flag',async()=>{const r=await mf.dispatchFetch('https://example.com/api/account/preview',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({role:'admin'})});assert.equal(r.status,404);admin=await call('/api/account/preview',{method:'POST',data:{role:'admin'}});player=await call('/api/account/preview',{method:'POST',data:{role:'player'}});assert.equal(admin.body.user.admin,true);assert.equal(player.body.user.admin,false);target=player.body.user;});
 await t.test('ordinary players and cross-origin mutation are denied',async()=>{assert.equal((await call('/api/account/admin/users',{session:player.cookie})).status,403);assert.equal((await call('/api/account/profile',{method:'PATCH',session:admin.cookie,originHeader:'https://evil.invalid',data:{name:'X'}})).status,403);});
 await t.test('password signup/login/logout preserve session privacy',async()=>{signup=await call('/api/account/signup',{method:'POST',data:{name:'Password QA',email:'qa@example.invalid',password:'unique-long-test-password'}});assert.equal(signup.status,201);assert.equal(signup.body.user.verified,false);assert(!JSON.stringify(signup.body).includes('password'));assert(signup.cookie.startsWith('mk_session='));const wrong=await call('/api/account/login',{method:'POST',data:{email:'qa@example.invalid',password:'incorrect-long-test-password'}});assert.equal(wrong.status,401);const ok=await call('/api/account/login',{method:'POST',data:{email:'qa@example.invalid',password:'unique-long-test-password'}});assert.equal(ok.status,200);assert.equal((await call('/api/account/logout',{method:'POST',session:ok.cookie,data:{}})).status,200);assert.equal((await call('/api/account/me',{session:ok.cookie})).body.user,null);});
 let edit;
 await t.test('versioned admin changes are atomic and idempotent',async()=>{edit={requestId:crypto.randomUUID(),version:target.version,name:target.name,xp:{mode:'add',value:20},coins:{mode:'set',value:1000},inventory:['jade','fox'],skin:'fox',accessory:null,reason:'Isolated account validation'};const r=await call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:edit});assert.equal(r.status,200);assert.equal(r.body.user.xp,target.xp+20);assert.equal(r.body.user.coins,1000);const replay=await call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:edit});assert.deepEqual(replay.body,r.body);const conflict=await call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:{...edit,name:'Different'}});assert.equal(conflict.status,409);});
 await t.test('stale admin requests and invalid inventory are rejected',async()=>{assert.equal((await call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:{...edit,requestId:crypto.randomUUID()}})).status,409);const current=(await call('/api/account/me',{session:player.cookie})).body.user;assert.equal((await call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:{...edit,requestId:crypto.randomUUID(),version:current.version,inventory:[],skin:'jade'}})).status,400);});
 await t.test('purchase charges once and equipment must be owned',async()=>{for(let i=0;i<2;i++)assert.equal((await call('/api/account/buy',{method:'POST',session:player.cookie,data:{item:'crane'}})).status,200);let me=(await call('/api/account/me',{session:player.cookie})).body;assert.equal(me.user.coins,500);assert.equal((await call('/api/account/equip',{method:'POST',session:player.cookie,data:{item:'gold-frame'}})).status,403);assert.equal((await call('/api/account/equip',{method:'POST',session:player.cookie,data:{item:'crane'}})).status,200);});
 await t.test('admin bootstrap and self-removal protection hold',async()=>{assert.equal((await call('/api/account/admin/roles',{method:'DELETE',session:admin.cookie,data:{email:'hendy.wijaya@shopee.com'}})).status,403);assert.equal((await call('/api/account/admin/roles',{method:'DELETE',session:admin.cookie,data:{email:'admin@example.invalid'}})).status,403);assert.equal((await call('/api/account/admin/roles',{method:'POST',session:admin.cookie,data:{email:'qa@example.invalid'}})).status,200);assert.equal((await call('/api/account/admin/overview',{session:signup.cookie})).status,403);});
 await t.test('reward threshold, win bonus, duplicate delivery and daily cap',async()=>{const ns=await mf.getDurableObjectNamespace('ACCOUNTS','account-tests'),stub=ns.get(ns.idFromName('accounts-v1'));const before=(await call('/api/account/me',{session:player.cookie})).body.user;async function reward(id,seconds,won){const r=await stub.fetch(new Request('https://internal/internal/reward',{method:'POST',body:JSON.stringify({id,game:'mahjong',room:'QA',players:[{userId:target.id,seconds,won}]})}));assert.equal(r.status,200);await r.text();}await reward('short',59,true);assert.equal((await call('/api/account/me',{session:player.cookie})).body.user.xp,before.xp);await reward('first',60,true);await reward('first',60,true);assert.equal((await call('/api/account/me',{session:player.cookie})).body.user.xp,before.xp+50);for(let i=0;i<24;i++)await reward('cap-'+i,61,true);const after=(await call('/api/account/me',{session:player.cookie})).body.user;assert.equal(after.xp,before.xp+1000);assert.equal(after.coins,before.coins+1000);});
 await t.test('actor and recipient audit survive normal profile views',async()=>{const logs=(await call('/api/account/admin/logs',{session:admin.cookie})).body.events;assert(logs.some(e=>e.kind==='admin.user_adjusted'));const history=(await call('/api/account/history',{session:player.cookie})).body.events;assert(history.some(e=>e.kind==='account.adjusted'));assert(!JSON.stringify(logs).includes('unique-long-test-password'));});
 await t.test('JSON primitives and oversized bodies fail explicitly',async()=>{
  for(const body of ['null','[]','"text"']){const r=await mf.dispatchFetch(origin+'/api/account/profile',{method:'PATCH',headers:{Origin:origin,'Content-Type':'application/json',Cookie:player.cookie},body});assert.equal(r.status,400);}
  const large=await mf.dispatchFetch(origin+'/api/account/profile',{method:'PATCH',headers:{Origin:origin,'Content-Type':'application/json',Cookie:player.cookie},body:JSON.stringify({name:'x'.repeat(9000)})});assert.equal(large.status,413);
 });
 await t.test('parallel purchases charge once and parallel edits do not overwrite',async()=>{
  const before=(await call('/api/account/me',{session:player.cookie})).body.user;
  await Promise.all([1,2].map(()=>call('/api/account/buy',{method:'POST',session:player.cookie,data:{item:'gold-frame'}})));
  const after=(await call('/api/account/me',{session:player.cookie})).body.user;assert.equal(after.coins,before.coins-150);
  const edits=await Promise.all(['One','Two'].map(name=>call('/api/account/admin/users/'+target.id,{method:'PATCH',session:admin.cookie,data:{...edit,requestId:crypto.randomUUID(),version:after.version,name,inventory:['jade','fox','crane','gold-frame'],skin:'crane',accessory:null}})));
  assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);
 });
 await t.test('password-change/login race never leaves an old-password session alive',async()=>{
  const p1='old-device-validation-password',p2='new-device-validation-password',email='race@example.invalid';
  const created=await call('/api/account/signup',{method:'POST',data:{email,name:'Race QA',password:p1}});const cookie=created.cookie;
  const [changed,login]=await Promise.all([call('/api/account/password',{method:'POST',session:cookie,data:{current:p1,password:p2}}),call('/api/account/login',{method:'POST',data:{email,password:p1}})]);
  assert.equal(changed.status,200);if(login.status===200)assert.equal((await call('/api/account/me',{session:login.cookie})).body.user,null);else assert.equal(login.status,401);
  assert((await call('/api/account/me',{session:cookie})).body.user);assert.equal((await call('/api/account/login',{method:'POST',data:{email,password:p1}})).status,401);assert.equal((await call('/api/account/login',{method:'POST',data:{email,password:p2}})).status,200);
 });
 await t.test('login caps the account at ten active devices',async()=>{
  const logins=[];for(let i=0;i<12;i++)logins.push(await call('/api/account/preview',{method:'POST',data:{role:'admin'}}));
  let valid=0;for(const r of logins)if((await call('/api/account/me',{session:r.cookie})).body.user)valid++;assert.equal(valid,10);
 });

});

test('Six-game balance correction fixtures preserve totals, boundaries and rollback',async t=>{
 const code=buildSync({entryPoints:[path.join(root,'cloudflare/accounts/game-admin.js')],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
 const {adjustGame,balanceSnapshot}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 for(const game of ['capsa','mahjong','poker','catur','domino','blackjack'])await t.test(game,()=>{
  const chip=['poker','blackjack'].includes(game),players=[{id:'a',name:'A',score:0,stack:1000,totalBuyIn:1000,accountId:'account-a'},{id:'b',name:'B',score:0,stack:1000,totalBuyIn:1000,accountId:'account-b'}];
  const room={code:'TEST',social:{id:'room-test'},phase:chip?'lobby':'result',G:game==='mahjong'?{over:true}:undefined,players,spectators:[],settings:{pointValue:1000,chipValue:100},ledger:[],house:0};
  const actor={id:'admin',name:'Admin'},service={save:()=>true};
  const request=()=>({requestId:crypto.randomUUID(),roomId:room.social.id,version:balanceSnapshot(game,room).version,playerId:'a',counterparty:'b',mode:'transfer',amount:{mode:'add',value:100},reason:'Isolated balance validation'});
  const b=request();const r=adjustGame({game,room,service,body:b,actor});assert(r.ok);assert.equal(chip?players[0].stack+players[1].stack:players[0].score+players[1].score,chip?2000:0);assert.equal(adjustGame({game,room,service,body:b,actor}).replayed,true);
  assert.throws(()=>adjustGame({game,room,service,body:{...b,requestId:crypto.randomUUID()},actor}),e=>e.status===409);
  const before=JSON.stringify(room);assert.throws(()=>adjustGame({game,room,service:{save:()=>false},body:request(),actor}),e=>e.status===503);assert.equal(JSON.stringify(room),before);
  if(chip){const net=players[0].stack-players[0].totalBuyIn;adjustGame({game,room,service,body:{...request(),mode:'funding',amount:{mode:'add',value:500}},actor});assert.equal(players[0].stack-players[0].totalBuyIn,net);assert.equal(players[0].adminInitialFunding,true);}
  const oldRequest=request();room.phase='playing';if(room.G)room.G.over=false;if(game==='poker')room.game={over:false};assert.throws(()=>adjustGame({game,room,service,body:{...oldRequest,version:balanceSnapshot(game,room).version},actor}),e=>e.status===409);
 });
});

test('Google ID token requires signed identity, audience, nonce, expiry and verified email',async t=>{
 const code=buildSync({entryPoints:[path.join(root,'cloudflare/accounts/security.js')],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
 const {verifyGoogle,b64}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='fixture-key';
 const oldFetch=global.fetch;global.fetch=async url=>{assert.equal(url,'https://www.googleapis.com/oauth2/v3/certs');return new Response(JSON.stringify({keys:[jwk]}));};t.after(()=>{global.fetch=oldFetch;});
 const claims={iss:'https://accounts.google.com',aud:'client-fixture',sub:'google-subject',nonce:'nonce-fixture',email:'owner@example.invalid',email_verified:true,exp:Date.now()/1000+3600,iat:Date.now()/1000,name:'A deliberately long Google display name'};
 async function token(changes={}){const head=b64(new TextEncoder().encode(JSON.stringify({alg:'RS256',kid:'fixture-key'}))),body=b64(new TextEncoder().encode(JSON.stringify({...claims,...changes}))),data=head+'.'+body;return data+'.'+b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(data)));}
 const result=await verifyGoogle(await token(),'client-fixture','nonce-fixture');assert.equal(result.email,claims.email);assert.equal(result.name.length,24);
 for(const change of [{aud:'another-client'},{nonce:'wrong'},{exp:0},{exp:undefined},{iat:undefined},{email_verified:false},{iss:'https://evil.invalid'}])await assert.rejects(()=>token(change).then(v=>verifyGoogle(v,'client-fixture','nonce-fixture')),e=>e.status===401);
 const signed=await token();await assert.rejects(()=>verifyGoogle(signed.slice(0,-10)+'corrupted','client-fixture','nonce-fixture'),e=>e.status===401);
});

test('Anonymous game sockets are rejected before factories/timers initialize',async t=>{
 const src=require('node:fs').readFileSync(path.join(root,'cloudflare/worker.js'),'utf8');
 // Execute the actual GamingHub fetch body with stub dependencies; no runtime/code replacement.
 const start=src.indexOf('  async fetch(request){'),end=src.indexOf('\n}\n\nexport default',start);
 const method=src.slice(start,end).replace('  async fetch(request){','return async function(request){');
 const handler=new Function('GAMES','json','failed','WebSocketPair',method)(['capsa','mahjong','poker','catur','domino','blackjack'],(v,s=200)=>new Response(JSON.stringify(v),{status:s}),()=>new Response(null,{status:503}),()=>{throw Error('Unexpected socket allocation');});
 for(const game of ['capsa','mahjong','poker','catur','domino','blackjack']){
  const hub={env:{ACCOUNTS:{idFromName:n=>n,get:()=>({fetch:async()=>new Response('null')})}},init(){throw Error('Anonymous request started game factories');}};
  const r=await handler.call(hub,new Request('https://game.invalid/'+game+'/ws',{headers:{Upgrade:'websocket',Origin:'https://game.invalid'}}));assert.equal(r.status,401);
 }
});


test('Google return paths are same-origin game routes only',async()=>{
 const code=buildSync({entryPoints:[path.join(root,'cloudflare/accounts/security.js')],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
 const {safeReturn}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 for(const input of ['https://evil.invalid/mahjong/','//evil.invalid/poker/','javascript:alert(1)','/admin/','/api/account/me'])assert.equal(safeReturn(input,'https://game.invalid'),'/account/');
 assert.equal(safeReturn('/mahjong/?room=TEST','https://game.invalid'),'/mahjong/?room=TEST');
});

test('Socket does not send private output after its pre-send guard closes it',()=>{
 const {WebSocketServer}=require('../cloudflare/compat/ws.cjs'),server=new WebSocketServer(),sent=[];
 const socket=server.accept({send:m=>sent.push(m),close(){}},new Request('https://game.invalid/mahjong/ws'),fn=>fn());server.beforeSend=s=>s.close(1008,'Expired');socket.send('private hand');assert.equal(sent.length,0);
});

test('Cloud entry ignores a stale browser seat when the database has no owned seat',async()=>{
 const vm=require('node:vm'),fs=require('node:fs'),writes=new Map(),sent=[],entries=[];
 const doc={documentElement:{dataset:{}},addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;}};
 const context={window:{},document:doc,localStorage:{getItem:k=>writes.get(k)||null,setItem:(k,v)=>writes.set(k,v)},location:{pathname:'/blackjack/',search:'?room=NEWROOM',origin:'https://game.invalid'},matchMedia:()=>({matches:false}),URL,URLSearchParams,Intl,setTimeout,clearTimeout,setInterval:()=>0,queueMicrotask,history:{replaceState(){}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'public/room-client.js'),'utf8'),context);
 context.window.MejaRoom.connected({code:'OTHER',token:'another-account-browser-cache'},m=>{sent.push(m);return true;},target=>entries.push(target));
 assert.equal(sent[0].type,'hub-account-list');const message={type:'account-room-offer',seats:[]};context.window.MejaRoom.receive(message,m=>{sent.push(m);return true;});await new Promise(r=>queueMicrotask(r));assert.equal(message.type,'left');assert.equal(sent.filter(m=>['resume','rejoin'].includes(m.type)).length,0);assert.deepEqual(entries,['NEWROOM']);
});

test('Legacy bearer recovery is offered only for a matching unbound seat',async()=>{
 const code=buildSync({entryPoints:[path.join(root,'cloudflare/accounts/room-access.js')],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
 const {AccountRooms}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const room={code:'TEST',social:{id:'legacy'},players:[{token:'legacy-secret',name:'Legacy',connected:false}],spectators:[]},messages=[];
 const hub={apps:new Map([['blackjack',{rooms:new Map([['TEST',room]])}]]),services:new Map([['blackjack',{roomFor:()=>({})}]])},guard=new AccountRooms(hub),socket={account:{id:'owner'},send:t=>messages.push(JSON.parse(t))};
 guard.before(socket,{type:'hub-account-list',code:'TEST',token:'wrong'},'blackjack');assert.equal(messages.pop().legacyResume,false);
 guard.before(socket,{type:'hub-account-list',code:'TEST',token:'legacy-secret'},'blackjack');assert.equal(messages.pop().legacyResume,true);
 room.players[0].accountId='another-account';guard.before(socket,{type:'hub-account-list',code:'TEST',token:'legacy-secret'},'blackjack');assert.equal(messages.pop().legacyResume,false);
});

test('Failed handoff checkpoint preserves old seat token and host',async()=>{
 const code=buildSync({entryPoints:[path.join(root,'cloudflare/accounts/room-access.js')],bundle:true,write:false,format:'esm',platform:'node'}).outputFiles[0].text;
 const {AccountRooms}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const person={accountId:'owner',token:'original',name:'Owner'},room={code:'TEST',social:{id:'room-id'},hostToken:'original',players:[person],spectators:[]},messages=[];
 const hub={apps:new Map([['mahjong',{rooms:new Map([['TEST',room]])}]]),services:new Map([['mahjong',{roomFor:()=>({}),save:()=>false}]])};const guard=new AccountRooms(hub),socket={account:{id:'owner'},send:text=>messages.push(JSON.parse(text))};
 guard.before(socket,{type:'hub-account-list'},'mahjong');const offer=messages.pop();assert.equal(guard.before(socket,{type:'hub-account-claim',roomId:'room-id',handoffId:offer.handoffId},'mahjong'),false);assert.equal(person.token,'original');assert.equal(room.hostToken,'original');assert.equal(messages.pop().type,'error');
});

test('Cloud entry automatically claims its DB seat and redirects to an owned game',()=>{
 const vm=require('node:vm'),fs=require('node:fs');
 for(const game of ['blackjack','mahjong']){
  const sent=[],redirects=[],doc={documentElement:{dataset:{}},addEventListener(){},querySelectorAll(){return [];},querySelector(){return null;}};
  const context={window:{},document:doc,localStorage:{getItem:()=>null,setItem(){}},location:{pathname:'/blackjack/',search:'',origin:'https://game.invalid',assign:p=>redirects.push(p)},matchMedia:()=>({matches:false}),URL,URLSearchParams,Intl,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,queueMicrotask,history:{replaceState(){}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'public/room-client.js'),'utf8'),context);
  const send=m=>{sent.push(m);return true;};context.window.MejaRoom.connected(null,send,()=>{});
  context.window.MejaRoom.receive({type:'account-room-offer',handoffId:'challenge',seats:[{game,code:'OWNED',roomId:'db-seat'}]},send);
  if(game==='blackjack'){assert.equal(sent.at(-1).type,'hub-account-claim');assert.equal(sent.at(-1).handoffId,'challenge');assert.equal(sent.at(-1).roomId,'db-seat');assert.equal(redirects.length,0);}
  else {assert.deepEqual(redirects,['/mahjong/?room=OWNED']);assert.equal(sent.length,1);}
 }
});
