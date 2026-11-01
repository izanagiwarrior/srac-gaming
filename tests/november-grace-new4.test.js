'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createPresence,automated}=require('../games/shared/connection');
const {installRoomService,snapshotRoom}=require('../games/shared/room-service');
const factories={uno:()=>require('../games/uno/server').createUnoServer(),ludo:()=>require('../games/ludo/server').createLudoServer(),monopoli:()=>require('../games/monopoli/server').createMonopoliServer(),reversi:()=>require('../games/reversi/server').createReversiServer()};
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
 const player=room.players[room.turn];
 assert(player&&!player.bot);return {app,room,player,peers,service,data:()=>data};
}
function progress(game,r){return r.revision;}
function funds(game,r){return r.players.reduce((n,p)=>n+p.score,0);}
function hand(game,r,p){return JSON.stringify({hand:p.hand,pawns:p.pawns,position:p.position,cash:p.cash,board:r.board,assets:r.assets});}
function reconnect(game,f){const {app,room,player}=f,ws=socket(app);ws.post({type:'resume',code:room.code,token:player.token});assert(ws.last('joined'));return ws;}
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
