import {DurableObject} from 'cloudflare:workers';
import {createApp as createCapsa} from '../games/capsa/server.js';
import {createMahjongServer} from '../games/mahjong/server.js';
import {createPokerServer} from '../games/poker/server.js';
import {createChessServer} from '../games/chess/server.js';
import {createMonopoliServer} from '../games/monopoli/server.js';
import {createReversiServer} from '../games/reversi/server.js';
import {createUnoServer} from '../games/uno/server.js';
import {createLudoServer} from '../games/ludo/server.js';
import {createDominoServer} from '../games/domino/server.js';
import {createBlackjackServer} from '../games/blackjack/server.js';
import {installRoomService} from '../games/shared/room-service.js';
import {prepareStorage,gameStorage} from './storage.js';
import {timerScope,clearScope} from './compat/globals.js';

import {balanceSnapshot,adjustGame} from './accounts/game-admin.js';
import {body as readBody,response as accountResponse} from './accounts/security.js';
import {AccountStore} from './accounts/store.js';
import {AccountRooms} from './accounts/room-access.js';
export {AccountStore};
const VERSION=__SRAC_BUILD__;
const GAMES=['capsa','mahjong','poker','catur','domino','blackjack','uno','ludo','monopoli','reversi'];
const JSON_HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:JSON_HEADERS});
const failed=()=>json({error:'Server belum dapat memproses sesi. Coba hubungkan kembali.'},503);

// One small shared actor for office game nights; not one billed actor per room.
// Durable Object callbacks carry sockets; native game timers prevent hibernation while connected.
export class GamingHub extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.apps=null;this.services=null;this.resources=new Set();this.sessions=new Map();this.stopping=false;this.rewardSeen=new Set();this.accountRooms=new AccountRooms(this);prepareStorage(ctx.storage.sql);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS account_outbox(id TEXT PRIMARY KEY,payload TEXT NOT NULL)');
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS account_delivery_meta(name TEXT PRIMARY KEY,value INTEGER NOT NULL)');
    ctx.storage.sql.exec("INSERT OR IGNORE INTO account_delivery_meta VALUES('retries',0)");
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
        ['catur',createChessServer({getAddresses:()=>[]})],['domino',createDominoServer({getAddresses:()=>[]})],['blackjack',createBlackjackServer({getAddresses:()=>[]})],['uno',createUnoServer()],['ludo',createLudoServer()],['monopoli',createMonopoliServer()],['reversi',createReversiServer()]
      ]);
      this.services=new Map();
      try{
        for(const [slug,app]of this.apps){
          const service=installRoomService(app,{slug,persistence:gameStorage(this.ctx,slug,()=>!app.wss.disabled),saveInterval:0,accountMode:!!this.env.ACCOUNTS});
          this.services.set(slug,service);
          app.wss.beforeSend=socket=>{if(socket?.account?.expires<=Date.now()){try{socket.raw.send(JSON.stringify({type:'account-session-ended'}));}catch{}socket.close(1008,'Sesi akun berakhir. Masuk ulang.');return;}if(!this.stopping&&!app.wss.disabled){this.track(app,slug);if(!service.save())throw Error('Durable storage unavailable');this.collect(app);}};
          app.wss.afterEvent=()=>{if(!this.stopping&&!app.wss.disabled){this.track(app,slug);if(!service.save())this.fail();else this.collect(app);}};
          app.wss.onFailure=()=>this.fail();app.wss.onDisconnect=socket=>{this.sessions.delete(socket.raw);this.idle();};
          app.wss.beforeMessage=(socket,raw)=>{let msg;try{msg=JSON.parse(raw);}catch{return true;}if(!msg||typeof msg!=='object'||Array.isArray(msg))return false;if(socket.account){const checked=this.accountRooms.before(socket,msg,slug);if(checked===false)return false;msg=checked;}if(msg?.type==='create'&&[...this.apps.values()].reduce((n,a)=>n+a.rooms.size,0)>=24){socket.send(JSON.stringify({type:'error',message:'Batas 24 room tercapai. Bubarkan room lama dahulu.',msg:'Batas 24 room tercapai. Bubarkan room lama dahulu.'}));return false;}return JSON.stringify(['create','join'].includes(msg?.type)&&socket.account?{...msg,name:this.accountRooms.name(socket,msg,slug)}:msg);};
        }
      }catch(error){clearScope(this.resources);this.apps=null;this.services=null;throw error;}
    });
  }
  track(app,slug){
    const now=Date.now();
    for(const room of app.rooms.values()){
      const playing=slug==='mahjong'?room.G&&!room.G.over:slug==='poker'?room.game&&!room.game.over:['playing','betting','dealer'].includes(room.phase);
      if(!playing||room.recovering)continue;
      if(!room.progressionActive){room.progressionActive=true;room.progressionRoundToken=crypto.randomUUID();room.progressionTracking={};room.accountActivity||=[];for(const p of room.players)if(p.accountId&&!p.bot)room.accountActivity.push({id:crypto.randomUUID(),kind:'game.started',userId:p.accountId,game:slug,room:room.code});room.accountActivity=room.accountActivity.slice(-100);}
      room.progressionTracking||={};
      for(const p of room.players){if(!p.accountId||p.bot)continue;const t=room.progressionTracking[p.id]||={ms:0,last:null};if(t.last&&p.connected)t.ms+=Math.max(0,Math.min(120000,now-t.last));t.last=p.connected?now:null;}
    }
  }
  collect(app){
    if(!this.env.ACCOUNTS)return;
    for(const room of app.rooms.values())for(const event of [...(room.progressionEvents||[]),...(room.accountActivity||[])]){if(this.rewardSeen.has(event.id))continue;const inserted=this.ctx.storage.sql.exec('INSERT OR IGNORE INTO account_outbox VALUES(?,?)',event.id,JSON.stringify(event));if(inserted.rowsWritten)this.ctx.storage.sql.exec("UPDATE account_delivery_meta SET value=0 WHERE name='retries'");this.rewardSeen.add(event.id);}
    if(this.flushing)return;
    if(!this.ctx.storage.sql.exec("SELECT id FROM account_outbox WHERE payload<>'' LIMIT 1").toArray().length)return;
    this.ctx.waitUntil(this.ctx.storage.setAlarm(Date.now()+60000));
    this.flushing=true;
    this.ctx.waitUntil(this.flush().catch(()=>{console.error('Account delivery pending');}).finally(()=>{this.flushing=false;}));
  }
  async flush(){
    const stub=this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName('accounts-v1'));
    for(const row of this.ctx.storage.sql.exec("SELECT * FROM account_outbox WHERE payload<>'' LIMIT 200").toArray()){
      const result=await stub.fetch(new Request('https://internal/internal/'+(JSON.parse(row.payload).kind?'activity':'reward'),{method:'POST',body:row.payload}));
      if(!result.ok)break;
      // Keep a receipt rather than re-inserting acknowledged source events on every broadcast.
      this.ctx.storage.sql.exec("UPDATE account_outbox SET payload='' WHERE id=?",row.id);
    }
  }
  async alarm(){
    if(!this.env.ACCOUNTS)return;
    try{await this.flush();}catch{console.error('Account retry pending');}
    const pending=this.ctx.storage.sql.exec("SELECT id FROM account_outbox WHERE payload<>'' LIMIT 1").toArray().length;
    if(pending){const retries=this.ctx.storage.sql.exec("SELECT value FROM account_delivery_meta WHERE name='retries'").toArray()[0].value+1;this.ctx.storage.sql.exec("UPDATE account_delivery_meta SET value=? WHERE name='retries'",retries);if(retries<=5)await this.ctx.storage.setAlarm(Date.now()+Math.min(3600000,60000*2**retries));}else this.ctx.storage.sql.exec("UPDATE account_delivery_meta SET value=0 WHERE name='retries'");
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
  async webSocketMessage(ws,data){
    const socket=this.sessions.get(ws);if(!socket){try{ws.close(1012,'Hubungkan kembali ke sesi tersimpan.');}catch{}return;}
    if(typeof data!=='string'||new TextEncoder().encode(data).byteLength>16384){socket.close(1009,'Pesan terlalu besar.');return;}
    const now=Date.now();if(!socket.accessWindow||now-socket.accessWindow>1000){socket.accessWindow=now;socket.accessCount=0;}if(++socket.accessCount>45){socket.close(1008,'Terlalu banyak pesan.');return;}
    if((socket.pendingMessages||0)>=16){socket.close(1008,'Terlalu banyak pesan.');return;}
    socket.pendingMessages=(socket.pendingMessages||0)+1;
    const work=async()=>{
      if(socket.readyState!==1)return;
      if(this.env.ACCOUNTS){
        try{const r=await this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName('accounts-v1')).fetch(socket.authRequest.clone()),identity=await r.json();if(!identity||identity.id!==socket.account?.id){socket.send(JSON.stringify({type:'account-session-ended'}));socket.close(1008,'Sesi akun berakhir. Masuk ulang.');return;}socket.account=identity;}catch{socket.close(1013,'Akun belum dapat diverifikasi.');return;}
      }
      socket.receive(data);
    };
    socket.accountQueue=(socket.accountQueue||Promise.resolve()).then(work).catch(()=>{socket.close(1011,'Sesi belum dapat diproses.');}).finally(()=>{socket.pendingMessages--;});
    await socket.accountQueue;
  }
  webSocketClose(ws){this.sessions.get(ws)?.finish();this.sessions.delete(ws);}
  webSocketError(ws){this.sessions.get(ws)?.finish();this.sessions.delete(ws);}
  async fetch(request){
    const url=new URL(request.url);
    if(url.pathname==='/internal/account-appearance'){
      const b=await request.json();if(!this.apps)return json({ok:true});
      const fields={skin:b.skin,accessory:b.accessory,decoration:b.decoration,entrance:b.entrance,aura:b.aura};
      for(const socket of this.sessions.values())if(socket.account?.id===b.userId)Object.assign(socket.account,fields);
      this.run(()=>{for(const [game,app] of this.apps){for(const room of app.rooms.values()){let changed=false;for(const p of [...room.players,...(room.spectators||[])])if(p.accountId===b.userId){p.accountSkin=b.skin;p.accountAccessory=b.accessory;p.accountDecoration=b.decoration;p.accountEntrance=b.entrance;p.accountAura=b.aura;changed=true;}if(changed){this.services.get(game).save();app.broadcastRoom(room);}}}});return json({ok:true});
    }
    if(url.pathname==='/internal/account-revoke'){
      const b=await request.json();for(const socket of [...this.sessions.values()])if(socket.account?.id===b.userId&&(b.all?socket.account.sessionId!==b.keep:b.sessionIds?.includes(socket.account.sessionId))){socket.send(JSON.stringify({type:'account-session-ended'}));socket.close(1008,'Sesi akun berakhir. Masuk ulang.');}return json({ok:true});
    }
    if(url.pathname==='/internal/admin-balances'){
      try{
        this.init();
        if(request.method==='GET'){const rooms=[...this.apps.entries()].flatMap(([game,app])=>[...app.rooms.values()].map(r=>balanceSnapshot(game,r)));this.idle();return json({rooms});}
        const input=await request.json(),app=this.apps.get(input.game),room=app?.rooms.get(input.code),service=this.services.get(input.game);
        if(!room)return json({error:'Meja tidak ditemukan.'},404);
        const result=this.run(()=>adjustGame({game:input.game,room,service,app,body:input.body,actor:input.actor}));
        this.collect(app);
        if(!result.replayed)this.run(()=>app.broadcastRoom(room));
        this.idle();return json(result);
      }catch(e){this.idle();return json({error:e.status?e.message:'Koreksi saldo belum dapat diproses.'},e.status||503);}
    }
    if(url.pathname==='/internal/admin-live')return json({rooms:this.services?[...this.services.entries()].flatMap(([game,service])=>[...this.apps.get(game).rooms.values()].map(room=>({game,code:room.code,phase:room.recovering?'paused':room.phase||room.state,players:room.players.filter(p=>!p.bot&&p.connected).map(p=>p.name)}))).filter(r=>r.players.length):[]});
    if(url.pathname==='/api/lobby')return json({version:VERSION,rooms:this.services?[...this.services.values()].flatMap(service=>service.summary()).slice(0,100):[]});
    const slug=url.pathname.split('/')[1];
    if(!GAMES.includes(slug)||url.pathname!=='/'+slug+'/ws')return json({error:'Not found'},404);
    if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'WebSocket required'},426);
    // Do not accept a cross-site browser socket. Native clients may omit Origin.
    const origin=request.headers.get('Origin');if(origin&&origin!==url.origin)return json({error:'Origin mismatch'},403);
    if(this.stopping)return failed();
    // Reject anonymous connections before restoring factories or starting native timers.
    let principal=null;
    if(this.env.ACCOUNTS){
      try{
        const verified=await this.env.ACCOUNTS.get(this.env.ACCOUNTS.idFromName('accounts-v1')).fetch(new Request(new URL('/internal/session',request.url),request));
        if(!verified.ok)return failed();
        principal=await verified.json();
      }catch{return failed();}
      // Only the private session contract can authorize game initialization.
      if(principal!==null&&(typeof principal!=='object'||Array.isArray(principal)||typeof principal.id!=='string'||!principal.id||typeof principal.sessionId!=='string'||!principal.sessionId||!Number.isFinite(principal.expires)))return failed();
      if(principal&&principal.expires<=Date.now())return json({error:'Sesi akun berakhir. Masuk ulang.'},401);
    }
    if(this.env.ACCOUNTS&&!principal)return json({error:'Masuk ke akun dahulu.'},401);
    try{this.init();}catch(error){console.error('Cloud storage restore failed');return failed();}
    if([...this.sessions.values()].filter(s=>s.account?.id===principal?.id).length>=8)return json({error:'Terlalu banyak tab akun. Tutup tab game yang tidak dipakai.'},429);
    if(this.connections()>=64)return json({error:'Meja sedang penuh. Coba lagi nanti.'},503);
    const app=this.apps.get(slug),pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
    // Client protocol and private views remain owned by each native factory.
    try{const socket=app.wss.accept(server,request,fn=>this.run(fn),principal);if(socket.readyState===1){socket.authRequest=new Request(new URL('/internal/session',request.url),request);this.sessions.set(server,socket);}app.wss.afterEvent();}catch{try{server.close(1011,'Sesi belum dapat dipulihkan.');}catch{}}
    return new Response(null,{status:101,webSocket:client});
  }
}

export default {
  async fetch(request,env){
    const url=new URL(request.url),path=url.pathname;
    if(path.startsWith('/api/account/')||path==='/auth/google'||path==='/auth/google/callback'){
      if(!env.ACCOUNTS)return json({error:'Layanan akun belum dikonfigurasi.'},503);
      if(path==='/api/account/admin/balances'){
        if(!['GET','PATCH'].includes(request.method))return json({error:'Method not allowed'},405);
        let balanceInput;if(request.method==='PATCH'){if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Asal permintaan tidak diizinkan.'},403);try{balanceInput=await readBody(request);}catch(e){return accountResponse({error:e.message},e.status||400);}}
        const authPath=request.method==='GET'?'/api/account/admin/overview':'/api/account/admin/authorize';
        const verified=await env.ACCOUNTS.get(env.ACCOUNTS.idFromName('accounts-v1')).fetch(new Request(new URL(authPath,url),{headers:request.headers,method:'GET'}));
        if(!verified.ok)return verified;
        const hub=env.GAMING_HUB.get(env.GAMING_HUB.idFromName('office-hub-v1'));
        if(request.method==='GET')return hub.fetch(new Request(new URL('/internal/admin-balances',url),{method:'GET'}));
        if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Asal permintaan tidak diizinkan.'},403);
        try{const input=balanceInput,actor=await verified.json();return hub.fetch(new Request(new URL('/internal/admin-balances',url),{method:'PATCH',body:JSON.stringify({game:input.game,code:input.code,body:input,actor})}));}catch(e){return accountResponse({error:e.status?e.message:'Permintaan tidak valid.'},e.status||400);}
      }
      if(path==='/api/account/admin/live'){
        const auth=await env.ACCOUNTS.get(env.ACCOUNTS.idFromName('accounts-v1')).fetch(new Request(new URL('/api/account/admin/overview',url),request));
        if(!auth.ok)return auth;
        return env.GAMING_HUB.get(env.GAMING_HUB.idFromName('office-hub-v1')).fetch(new Request(new URL('/internal/admin-live',url),request));
      }
      return env.ACCOUNTS.get(env.ACCOUNTS.idFromName('accounts-v1')).fetch(request);
    }
    if(['/account','/admin'].includes(path))return Response.redirect(url.origin+path+'/'+url.search,308);
    if(['/account/','/admin/'].includes(path))return env.ASSETS.fetch(new Request(new URL('/account/'+url.search,url),request));
    if(path==='/favicon.ico')return new Response(null,{status:204});
    if(path==='/health')return json({ok:true,version:VERSION,games:GAMES,hosting:'cloudflare-workers'});
    if(path==='/api/lobby'||/^\/(capsa|mahjong|poker|catur|domino|blackjack|uno|ludo|monopoli|reversi)\/ws$/.test(path)){
      if(path==='/api/lobby'&&!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
      return env.GAMING_HUB.get(env.GAMING_HUB.idFromName('office-hub-v1')).fetch(request);
    }
    if(/^\/(capsa|mahjong|poker|catur|domino|blackjack|uno|ludo|monopoli|reversi)\/api\/info$/.test(path))return json({addresses:[],hosting:'cloudflare-workers'});
    const bare=/^\/(capsa|mahjong|poker|catur|domino|blackjack|uno|ludo|monopoli|reversi)$/.exec(path);
    if(bare)return Response.redirect(url.origin+path+'/'+url.search,308);
    if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
    return env.ASSETS.fetch(request);
  }
};
