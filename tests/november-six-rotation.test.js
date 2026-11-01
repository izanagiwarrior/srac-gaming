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

function rejected(ws,msg,pattern){ws.messages=[];ws.emit('message',JSON.stringify({v:12,...msg}));const e=ws.last('error');assert(e,'expected rejection');assert.match(e.message||e.msg,pattern);ws.messages=[];}
for(const game of games)for(const yieldHost of [false,true])test(game+': lock, spectator queue, completed boundary and '+(yieldHost?'host':'player')+' seat rotation',async t=>{
 const f=await table(t,game),r=f.room,original=[...r.players];
 const host=original[0],outgoing=original[yieldHost?0:1],observer=socket(f.app);
 host.ws.post({type:'hub-lock',locked:true});rejected(observer,{type:'join',name:'Observer',code:r.code},/dikunci/);
 host.ws.post({type:'hub-lock',locked:false});observer.post({type:'join',name:'Observer',code:r.code});
 const incoming=r.spectators.find(p=>p.ws===observer);assert(incoming);assert(!r.players.includes(incoming));
 observer.post({type:'hub-queue',enabled:true});observer.post({type:'hub-queue',enabled:true});assert.equal(r.social.queue.length,1);
 outgoing.ws.post({type:'hub-yield',enabled:true});assert(r.social.yielding.includes(outgoing.id));
 rejected(observer,{type:'hub-next',boundary:observer.last('state')?.hub.boundary},/host/);
 if(game==='domino')assert.deepEqual(observer.last('state')?.hand||incoming.hand,[]);
 if(game==='catur')r.chess.load('7k/5Q2/6K1/8/8/8/8/8 w - - 0 1');
 for(const p of original)p.ws.close();await tick(t,15000);
 const finished=()=>game==='mahjong'?r.G.over:game==='poker'?r.game.over:['finished','result'].includes(r.phase);
 let steps=0;while(!finished()&&steps++<400)await tick(t,3000);assert(finished(),'proxy round completion');
 const resumed=original.map(player=>reconnect(game,{...f,player}));
 if(game==='poker')for(let i=0;i<original.length;i++)if(original[i].stack===0){resumed[i].post({type:'rebuy'});resumed[0].post({type:'rebuyDecision',id:original[i].id,approve:true});}
 const before=JSON.stringify(r.ledger),oldColor=outgoing.color,boundary=observer.last('state').hub.boundary;
 rejected(resumed[0],{type:'hub-next',boundary:'stale'},/berubah/);assert.equal(JSON.stringify(r.ledger),before);
 resumed[0].post({type:'hub-next',boundary});
 assert(r.players.includes(incoming));assert(!r.players.includes(outgoing));assert(r.spectators.includes(outgoing));assert(!r.spectators.includes(incoming));
 assert.equal(r.social.queue.length,0);assert(!r.social.yielding.includes(outgoing.id));
 const fresh=observer.last('state');assert.equal(fresh.hub.spectator,false);assert.equal(resumed[yieldHost?0:1].last('state').hub.spectator,true);const controller=yieldHost?observer:resumed[0];assert(controller.last('state').hub.host);assert(!resumed[yieldHost?0:1].last('state').hub.host);
 assert.deepEqual(outgoing.hand,[]);assert.deepEqual(outgoing.hole,[]);assert.deepEqual(outgoing.hands,[]);
 if(game==='catur'){assert.equal(incoming.color,oldColor==='w'?'b':'w');assert.equal(new Set(r.players.map(p=>p.color)).size,2);assert.equal(outgoing.color,null);assert.equal(r.chess.history().length,0);}
 if(game==='domino'){assert.deepEqual(resumed[yieldHost?0:1].last('state').hand,[]);assert(incoming.hand.length);}
 if(game==='mahjong'){assert.equal(incoming.seat,yieldHost?0:1);assert.equal(outgoing.seat,-1);assert(incoming.hand.length);}
 controller.post({type:'hub-dissolve',confirm:true,code:r.code,roomId:fresh.hub.roomId});assert(!f.app.rooms.has(r.code));assert(observer.last('room-dissolved'));
 rejected(observer,{type:'join',name:'Observer',code:r.code},/tidak ditemukan/);
});
