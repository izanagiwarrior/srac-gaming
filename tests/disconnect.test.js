'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createPresence,automated}=require('../games/shared/connection');
const {installRoomService,snapshotRoom}=require('../games/shared/room-service');
const factories={capsa:()=>require('../games/capsa/server').createApp(),mahjong:()=>require('../games/mahjong/server').createMahjongServer(),poker:()=>require('../games/poker/server').createPokerServer({managed:true,dataDir:null}),catur:()=>require('../games/chess/server').createChessServer(),domino:()=>require('../games/domino/server').createDominoServer(),blackjack:()=>require('../games/blackjack/server').createBlackjackServer()};
const games=Object.keys(factories);
async function tick(t,ms){t.mock.timers.tick(ms);for(let i=0;i<30;i++)await Promise.resolve();}
function clock(t){t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:2000000000000});}
function socket(app){const ws=new EventEmitter();ws.readyState=1;ws.messages=[];ws.send=raw=>ws.messages.push(JSON.parse(raw));ws.close=()=>{if(ws.readyState!==1)return;ws.readyState=3;app.wss.clients.delete(ws);ws.emit('close');};ws.terminate=ws.close;ws.ping=()=>ws.emit('pong');ws.post=msg=>{ws.emit('message',JSON.stringify({v:12,...msg}));const errors=ws.messages.filter(m=>m.type==='error');if(errors.length)throw Error(errors.at(-1).message||errors.at(-1).msg);};ws.last=type=>ws.messages.filter(m=>m.type===type).at(-1);app.wss.clients.add(ws);app.wss.emit('connection',ws);return ws;}
async function table(t,game,settings={}){
 clock(t);const app=factories[game]();let data=null;
 const service=installRoomService(app,{slug:game,persistence:{read:()=>null,write:b=>{data=b;},savedAt:()=>Date.now()},saveInterval:0});
 t.after(async()=>{service.close();await app.close();});
 const n=['capsa','mahjong'].includes(game)?4:2,peers=[];let room;
 for(let i=0;i<n;i++){const ws=socket(app);peers.push(ws);ws.post({type:i?'join':'create',name:'Player '+i,...(i?{code:room.code}:{seats:2,fillBots:false,settings:{bots:0,seats:2,maxPlayers:2,...settings}})});room=app.rooms.get(ws.last('joined').code);}
 peers[0].post({type:'start',settings:{bots:0,tablePreset:'custom',animateDeal:false,...settings}});await tick(t,0);
 assert.equal(room.phase||room.state,game==='blackjack'?'betting':'playing');
 const player=game==='mahjong'?room.players[room.G.current]:game==='capsa'||game==='poker'?room.players[room.game.turn]:game==='catur'?room.players.find(p=>p.color===room.chess.turn()):game==='domino'?room.players[room.turn]:room.players[0];
 assert(player&&!player.bot);return {app,room,player,peers,service,data:()=>data};
}
function progress(game,r){if(game==='capsa')return r.game.actionNo;if(game==='mahjong')return JSON.stringify([r.G.gen,r.G.phase,r.players.map(p=>p.hand.length),r.G.over]);if(game==='poker')return r.game.version;if(game==='catur')return r.chess.history().length;if(game==='domino')return r.revision;return JSON.stringify(r.players.map(p=>p.bet));}
function funds(game,r){if(game==='poker')return r.players.reduce((n,p)=>n+p.stack+(r.game.over?0:p.contributed),0);if(game==='blackjack')return r.house+r.players.reduce((n,p)=>n+p.stack+(r.phase==='finished'?0:p.hands.reduce((v,h)=>v+h.bet,0)),0);return r.players.reduce((n,p)=>n+p.score,0);}
function hand(game,r,p){return JSON.stringify(game==='capsa'?r.game.hands[r.players.indexOf(p)]:game==='mahjong'?p.hand:game==='poker'?p.hole:game==='domino'?p.hand:game==='blackjack'?p.hands:r.chess.fen());}
function reconnect(game,f){const {app,room,player}=f,ws=socket(app);ws.post({type:['capsa','mahjong'].includes(game)?'rejoin':'resume',code:room.code,token:player.token});assert(ws.last('joined'));return ws;}
for(const game of games){
 test(game+': no action before15s, proxy AI then reconnect preserves seat and funds',async t=>{
  const f=await table(t,game),{room:r,player:p}=f,token=p.token,id=p.id,ws=p.ws,before=progress(game,r),money=funds(game,r);ws.close();
  assert(!p.connected);assert.equal(p.disconnectDeadline-Date.now(),15000);assert(!p.disconnectBot);
  const publicRow=f.peers.find(x=>x.readyState===1).messages.filter(m=>m.hub).at(-1).hub.presence.find(x=>x.id===id);assert.equal(publicRow.deadline,Date.now()+15000);assert.equal(publicRow.proxy,false);
  await tick(t,14999);assert.equal(progress(game,r),before);assert(!p.disconnectBot);
  await tick(t,1);assert.equal(p.disconnectBot,true);assert.equal(p.bot,false);assert.equal(p.token,token);
  await tick(t,3000);await tick(t,2500);assert.notEqual(progress(game,r),before,'native bot must actually act, not just change a badge');assert.equal(funds(game,r),money);
  const cards=hand(game,r,p),after=progress(game,r),newWs=reconnect(game,f);assert.equal(p.ws,newWs);assert.equal(p.connected,true);assert.equal(p.disconnectBot,false);assert.equal(p.token,token);assert.equal(p.id,id);assert.equal(hand(game,r,p),cards);assert.equal(funds(game,r),money);
  await tick(t,4000);assert.equal(progress(game,r),after,'no stale proxy action after reconnect');
 });
 test(game+': reconnect at14999ms cancels takeover and old timer',async t=>{
  const f=await table(t,game),{room:r,player:p}=f,before=progress(game,r),cards=hand(game,r,p);p.ws.close();await tick(t,14999);reconnect(game,f);await tick(t,7000);assert.equal(p.disconnectBot,false);assert.equal(progress(game,r),before);assert.equal(hand(game,r,p),cards);
 });
}
test('shared lifecycle: stale/disposed/explicit/spectator/closed timers cannot acquire control',t=>{
 clock(t);for(const mode of ['reconnect','dispose','deleted','explicit','spectator','close']){let changes=0;const p={connected:false,bot:false,token:'keep'},r={players:mode==='spectator'?[]:[p]};let exists=true;const presence=createPresence({exists:()=>exists,changed:()=>changes++});presence.disconnect(r,p,mode==='explicit');if(mode==='reconnect'){p.connected=true;presence.connect(p);}if(mode==='dispose')presence.dispose(r);if(mode==='deleted')exists=false;if(mode==='close')presence.close();t.mock.timers.tick(20000);assert.equal(changes,0,mode);assert(!automated(p),mode);assert.equal(p.token,'keep');presence.close();}
});
test('connection grace is transient: cold saves contain cards/account but no active proxy/deadline',()=>{const s=snapshotRoom({players:[{id:'seat',accountId:'account',token:'keep',connected:false,bot:false,disconnectBot:true,disconnectedAt:1,disconnectDeadline:2,hand:['private']} ]});const p=s.players[0];assert(!('disconnectBot'in p));assert(!('disconnectDeadline'in p));assert.deepEqual(p.hand,['private']);assert.equal(p.accountId,'account');assert.equal(p.token,'keep');});
test('Chess blitz pauses during grace and resumes with original remaining time',async t=>{
 const f=await table(t,'catur',{clockMode:'blitz5'}),r=f.room,p=f.player;await tick(t,2000);p.ws.close();const left=r.clock.remaining[p.color];await tick(t,14999);assert.equal(r.clock.remaining[p.color],left);assert.equal(r.clock.active,null);await tick(t,1);assert.equal(r.clock.active,p.color);await tick(t,1000);reconnect('catur',f);assert.equal(r.clock.remaining[p.color],left-1000);assert.equal(r.chess.history().length,0);await tick(t,2500);assert.equal(r.chess.history().length,0);
});
test('Mahjong disconnect retains a live manual claim until reconnect or grace expiry',async t=>{
 const f=await table(t,'mahjong',{claimMode:'manual'}),r=f.room,G=r.G,actor=r.players[G.current];
 actor.ws.post({type:'action',action:'discard',id:actor.drawn?.id??actor.hand[0].id});await tick(t,2500);
 assert(G.pending?.waiting.size,'manual mode must actually offer claims');const seat=[...G.pending.waiting][0],p=r.players[seat],claimId=G.pending.id;
 p.ws.close();assert(G.pending.waiting.has(seat),'disconnect must not instantly pass');await tick(t,14999);assert(G.pending.waiting.has(seat));reconnect('mahjong',{...f,player:p});assert.equal(G.pending.id,claimId);assert(G.pending.waiting.has(seat));
 p.ws.close();await tick(t,15000);assert(!G.pending?.waiting.has(seat),'native proxy must resolve its claim after grace');assert.equal(p.bot,false);
});
test('Capsa ordinary turn deadline cannot bypass a newer15second disconnect grace',async t=>{
 const f=await table(t,'capsa'),r=f.room,p=f.player;await tick(t,59000);const before=r.game.actionNo;p.ws.close();await tick(t,14999);assert.equal(r.game.actionNo,before);await tick(t,1);await tick(t,0);assert(r.game.actionNo>before);assert(!p.bot);
});
for(const game of games)test(game+': proxy-completed round conserves points/chips and reconnect never settles twice',async t=>{
 const f=await table(t,game),r=f.room,p=f.player;
 if(game==='catur')r.chess.load('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1');
 // A connected spectator keeps normal broadcast/storage behavior while seated humans disconnect.
 const spectator=socket(f.app);spectator.post({type:'join',name:'Observer',code:r.code});assert(!r.players.some(q=>q.ws===spectator));
 const initial=funds(game,r),ids=r.players.map(q=>[q.id,q.token]);for(const q of r.players)q.ws.close();await tick(t,15000);
 const finished=()=>game==='mahjong'?r.G.over:game==='poker'?r.game.over:['finished','result'].includes(r.phase);
 let steps=0;while(!finished()&&steps++<400)await tick(t,3000);
 assert(finished(),'native proxies must complete a round');assert.equal(funds(game,r),initial,'zero-sum score/chips including pot/dealer');assert.deepEqual(r.players.map(q=>[q.id,q.token]),ids);assert(r.players.every(q=>!q.bot));
 const history=()=>JSON.stringify([r.ledger,r.history,r.players.map(q=>[q.score,q.stack,q.totalBuyIn]),r.house]);const before=history();reconnect(game,f);await tick(t,7000);assert.equal(history(),before,'reconnect cannot duplicate result/payout');
});
