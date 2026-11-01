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

for(const accept of [false,true])test('Monopoli native proxy trade waits for human '+(accept?'acceptance':'rejection')+' and uses 3-second bot delay',async t=>{
 const f=await table(t,'monopoli'),r=f.room,[p,q]=r.players;r.turn=0;r.stage='end';r.assets[1].owner=p.id;r.assets[3].owner=q.id;
 const before=[p.cash,q.cash];p.ws.close();await tick(t,15000);assert.equal(r.trade,null);await tick(t,2999);assert.equal(r.trade,null);await tick(t,1);assert(r.trade);assert.equal(r.trade.target,q.id);assert.equal(r.assets[3].owner,q.id);const count=r.revision;
 await tick(t,6000);assert.equal(r.revision,count,'connected human is not auto-accepted');assert.equal(r.assets[3].owner,q.id);
 q.ws.post({type:'tradeReply',accept,matchId:r.matchId,revision:r.revision});assert.equal(r.trade,null);
 if(accept){assert.equal(r.assets[3].owner,p.id);assert.equal(p.cash+q.cash,before[0]+before[1]);await tick(t,3000);assert(r.assets.some(a=>a.owner===p.id&&a.buildings));}
 else{assert.deepEqual([p.cash,q.cash],before);await tick(t,3000);assert.equal(r.turn,1);assert.equal(r.trade,null);}
});

for(const level of ['easy','normal','hard'])for(const mode of ['quick','standard'])for(const seats of [2,4,6])test('Monopoli native full '+mode+' '+level+' '+seats+' seats settles once after proxy takeover',async t=>{
 clock(t);const app=factories.monopoli();let saved;
 const service=installRoomService(app,{slug:'monopoli',persistence:{read:()=>null,write:b=>{saved=b;}},saveInterval:0});t.after(async()=>{service.close();await app.close();});
 const human=socket(app);human.post({type:'create',name:'QA host',seats,fillBots:true});const r=app.rooms.get(human.last('joined').code),token=r.players[0].token;
 human.post({type:'start',settings:{playMode:mode,botLevel:level,pointValue:0}});const watcher=socket(app);watcher.post({type:'join',name:'QA observer',code:r.code});human.close();await tick(t,15000);
 let steps=0;while(r.phase==='playing'&&steps++<10000)await tick(t,3000);
 assert.equal(r.phase,'finished','native timers/proxies must complete');assert.equal(r.ledger.length,1);assert.equal(r.ledger[0].players.reduce((n,p)=>n+p.delta,0),0);assert(saved);
 const ledger=JSON.stringify(r.ledger),back=socket(app);back.post({type:'resume',code:r.code,token});assert(back.last('joined'));await tick(t,6000);assert.equal(JSON.stringify(r.ledger),ledger,'reconnect must not settle again');
});
