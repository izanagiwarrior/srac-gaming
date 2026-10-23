import {DurableObject} from 'cloudflare:workers';
import {createApp as createCapsa} from '../games/capsa/server.js';
import {createMahjongServer} from '../games/mahjong/server.js';
import {createPokerServer} from '../games/poker/server.js';
import {createChessServer} from '../games/chess/server.js';
import {createDominoServer} from '../games/domino/server.js';
import {createBlackjackServer} from '../games/blackjack/server.js';
import {installRoomService} from '../games/shared/room-service.js';
import {prepareStorage,gameStorage} from './storage.js';
import {timerScope,clearScope} from './compat/globals.js';

const VERSION=__SRAC_BUILD__;
const GAMES=['capsa','mahjong','poker','catur','domino','blackjack'];
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:JSON_HEADERS});
const failed=()=>json({error:'Server belum dapat memproses sesi. Coba hubungkan kembali.'},503);

// One small shared actor for office game nights; not one billed actor per room.
// Durable Object callbacks carry sockets; native game timers prevent hibernation while connected.
export class GamingHub extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.apps=null;this.services=null;this.resources=new Set();this.sessions=new Map();this.stopping=false;prepareStorage(ctx.storage.sql);
    // A cold actor never guesses an old seat: ask retained sockets to rejoin.
    for(const ws of ctx.getWebSockets()){try{ws.close(1012,'Sesi dipulihkan; hubungkan kembali.');}catch{}}}
  run(fn){return timerScope.run(this.resources,fn);}
  init(){
    if(this.apps)return;
    this.stopping=false;this.resources=new Set();
    this.run(()=>{
      this.apps=new Map([
        ['capsa',createCapsa()],['mahjong',createMahjongServer()],
        ['poker',createPokerServer({dataDir:null,managed:true,getAddresses:()=>[]})],
        ['catur',createChessServer({getAddresses:()=>[]})],['domino',createDominoServer({getAddresses:()=>[]})],['blackjack',createBlackjackServer({getAddresses:()=>[]})]
      ]);
      this.services=new Map();
      try{
        for(const [slug,app]of this.apps){
          const service=installRoomService(app,{slug,persistence:gameStorage(this.ctx,slug,()=>!app.wss.disabled),saveInterval:0});
          this.services.set(slug,service);
          app.wss.beforeSend=()=>{if(!this.stopping&&!app.wss.disabled&&!service.save())throw Error('Durable storage unavailable');};
          app.wss.afterEvent=()=>{if(!this.stopping&&!app.wss.disabled&&!service.save())this.fail();};
          app.wss.onFailure=()=>this.fail();app.wss.onDisconnect=socket=>{this.sessions.delete(socket.raw);this.idle();};
          app.wss.beforeMessage=(socket,raw)=>{let msg;try{msg=JSON.parse(raw);}catch{return true;}if(msg?.type==='create'&&[...this.apps.values()].reduce((n,a)=>n+a.rooms.size,0)>=24){socket.send(JSON.stringify({type:'error',message:'Batas 24 room tercapai. Bubarkan room lama dahulu.',msg:'Batas 24 room tercapai. Bubarkan room lama dahulu.'}));return false;}return true;};
        }
      }catch(error){clearScope(this.resources);this.apps=null;this.services=null;throw error;}
    });
  }
  connections(){return this.apps?[...this.apps.values()].reduce((n,app)=>n+app.wss.clients.size,0):0;}
  fail(){
    if(this.stopping)return;this.stopping=true;
    // No successful gameplay reply may be published after a failed checkpoint.
    for(const app of this.apps?.values()||[]){app.wss.disabled=true;for(const socket of [...app.wss.clients])socket.abort();}
    clearScope(this.resources);this.sessions.clear();this.apps=null;this.services=null;this.stopping=false;
  }
  idle(){
    if(this.stopping||this.connections())return;
    this.ctx.blockConcurrencyWhile(async()=>{
      if(!this.apps||this.connections())return;
      this.stopping=true;
      this.run(()=>{for(const service of this.services.values())service.close();clearScope(this.resources);});
      await this.run(()=>Promise.all([...this.apps.values()].map(app=>app.close())));
      this.apps=null;this.services=null;this.stopping=false;
    });
  }
  webSocketMessage(ws,data){const socket=this.sessions.get(ws);if(socket)socket.receive(data);else{try{ws.close(1012,'Hubungkan kembali ke sesi tersimpan.');}catch{}}}
  webSocketClose(ws){this.sessions.get(ws)?.finish();this.sessions.delete(ws);}
  webSocketError(ws){this.sessions.get(ws)?.finish();this.sessions.delete(ws);}
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==='/api/lobby')return json({version:VERSION,rooms:this.services?[...this.services.values()].flatMap(service=>service.summary()).slice(0,100):[]});
    const slug=url.pathname.split('/')[1];
    if(!GAMES.includes(slug)||url.pathname!=='/'+slug+'/ws')return json({error:'Not found'},404);
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'WebSocket required'},426);
    // Do not accept a cross-site browser socket. Native clients may omit Origin.
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Origin mismatch'},403);
    if(this.stopping)return failed();
    try{this.init();}catch(error){console.error('Cloud storage restore failed');return failed();}
    if(this.connections()>=64)return json({error:'Meja sedang penuh. Coba lagi nanti.'},503);
    const app=this.apps.get(slug),pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
    // Client protocol and private views remain owned by each native factory.
    try{const socket=app.wss.accept(server,request,fn=>this.run(fn));if(socket.readyState===1)this.sessions.set(server,socket);app.wss.afterEvent();}catch{try{server.close(1011,'Sesi belum dapat dipulihkan.');}catch{}}
    return new Response(null,{status:101,webSocket:client});
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(path==='/favicon.ico')return new Response(null,{status:204});
    if(path==='/health')return json({ok:true,version:VERSION,games:GAMES,hosting:'cloudflare-workers'});
    if(path==='/api/lobby'||/^\/(capsa|mahjong|poker|catur|domino|blackjack)\/ws$/.test(path)){
      if(path==='/api/lobby'&&!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
      return env.GAMING_HUB.get(env.GAMING_HUB.idFromName('office-hub-v1')).fetch(request);
    }
    if(/^\/(capsa|mahjong|poker|catur|domino|blackjack)\/api\/info$/.test(path))return json({addresses:[],hosting:'cloudflare-workers'});
    const bare=/^\/(capsa|mahjong|poker|catur|domino|blackjack)$/.exec(path);
    if(bare)return Response.redirect(url.origin+path+'/'+url.search,308);
    if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
    return env.ASSETS.fetch(request);
  }
};
