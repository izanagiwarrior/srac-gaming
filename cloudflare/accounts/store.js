import {initLeaderboard,recordStanding,leaderboard,GAMES} from './leaderboard.js';
import {DurableObject} from 'cloudflare:workers';
import {uid,random,hash,cookies,cookie,response,problem,email,displayName,body,passwordHash,equal,verifyGoogle,safeReturn} from './security.js';
import {applyUserEdit,possessions} from './admin.js';
import {CATALOG,PUBLIC_CATALOG,canUseCosmetic,allowedCosmetics,BOOTSTRAP,REWARDS} from './catalog.js';
const DAY=86400000,SESSION=7*DAY;
function confirmPassword(b,required=false){if((required||b.confirmPassword!==undefined)&&(typeof b.confirmPassword!=='string'||b.password!==b.confirmPassword))problem('Konfirmasi password tidak sama.');}
// Separate SQLite namespace: never stores or migrates private game snapshots.
export class AccountStore extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.ctx=ctx;this.env=env;this.sql=ctx.storage.sql;
  this.sql.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0,password TEXT,salt TEXT,google_sub TEXT UNIQUE,xp INTEGER NOT NULL DEFAULT 0,coins INTEGER NOT NULL DEFAULT 0,skin TEXT NOT NULL DEFAULT 'jade',accessory TEXT,created INTEGER NOT NULL,last_seen INTEGER NOT NULL)`);
  if(!this.rows('PRAGMA table_info(users)').some(c=>c.name==='revision'))this.sql.exec('ALTER TABLE users ADD COLUMN revision INTEGER NOT NULL DEFAULT 0');
  this.sql.exec('CREATE TABLE IF NOT EXISTS admin_operations(id TEXT PRIMARY KEY,actor TEXT NOT NULL,signature TEXT NOT NULL,result TEXT NOT NULL,time INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS roles(email TEXT PRIMARY KEY,created INTEGER NOT NULL,actor TEXT,protected INTEGER NOT NULL DEFAULT 0)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS inventory(user_id TEXT NOT NULL,item TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,item))');
  this.sql.exec('CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,time INTEGER NOT NULL,user_id TEXT,kind TEXT NOT NULL,game TEXT,room TEXT,detail TEXT NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS events_time ON events(time)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS events_user ON events(user_id,time)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS rewards(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,time INTEGER NOT NULL,xp INTEGER NOT NULL,coins INTEGER NOT NULL,game TEXT NOT NULL,outcome TEXT NOT NULL,seconds INTEGER NOT NULL)');
  this.sql.exec('CREATE INDEX IF NOT EXISTS rewards_user ON rewards(user_id,time)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS oauth(state TEXT PRIMARY KEY,browser TEXT NOT NULL,verifier TEXT NOT NULL,nonce TEXT NOT NULL,expires INTEGER NOT NULL,link_user TEXT)');
  if(!this.rows('PRAGMA table_info(oauth)').some(c=>c.name==='return_to'))this.sql.exec('ALTER TABLE oauth ADD COLUMN return_to TEXT');
  this.sql.exec('CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL)');
  this.sql.exec('CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)');
  this.sql.exec("INSERT OR IGNORE INTO metadata VALUES('rate_salt',?)",random());
  initLeaderboard(this);
  for(const address of BOOTSTRAP)this.sql.exec('INSERT OR IGNORE INTO roles VALUES(?,?,NULL,1)',address,Date.now());
 }
 rows(q,...p){return this.sql.exec(q,...p).toArray();} one(q,...p){return this.rows(q,...p)[0];}
 log(kind,userId=null,detail={},game=null,room=null,id=uid()){this.sql.exec('INSERT OR IGNORE INTO events VALUES(?,?,?,?,?,?,?)',id,Date.now(),userId,kind,game,room,JSON.stringify(detail));}
 isAdmin(u){return !!u?.verified&&!!this.one('SELECT email FROM roles WHERE email=?',u.email);}
 publicUser(u){const admin=this.isAdmin(u),skin=canUseCosmetic(CATALOG.find(i=>i.id===u.skin),u,admin)?u.skin:'jade';return {id:u.id,name:u.name,email:u.email,verified:!!u.verified,admin:this.isAdmin(u),xp:u.xp,coins:u.coins,level:Math.floor(Math.sqrt(u.xp/100))+1,skin,accessory:u.accessory,created:u.created,version:u.revision||0};}
 syncAdminCosmetics(user){
  if(!this.isAdmin(user))return;
  const items=allowedCosmetics(user,true).filter(i=>i.adminOnly),owned=new Set(this.rows('SELECT item FROM inventory WHERE user_id=?',user.id).map(r=>r.item));
  const missing=items.filter(i=>!owned.has(i.id)),key='admin-avatar-default:'+user.id,first=!this.one('SELECT key FROM metadata WHERE key=?',key);
  if(!missing.length&&!first)return;
  this.ctx.storage.transactionSync(()=>{
   for(const item of missing)this.sql.exec('INSERT OR IGNORE INTO inventory VALUES(?,?,?)',user.id,item.id,Date.now());
   if(first){const initial=items.find(i=>i.ownerEmail===user.email)||items[0];this.sql.exec('UPDATE users SET skin=?,revision=revision+1 WHERE id=?',initial.id,user.id);user.skin=initial.id;user.revision=(user.revision||0)+1;this.sql.exec('INSERT OR IGNORE INTO metadata VALUES(?,?)',key,initial.id);}
   else {this.sql.exec('UPDATE users SET revision=revision+1 WHERE id=?',user.id);user.revision=(user.revision||0)+1;}
   this.log('avatar.admin_granted',user.id,{items:missing.map(i=>i.id),automaticDefault:first});
  });
 }
 async session(req){const token=cookies(req).mk_session;if(!token)return null;const u=this.one('SELECT u.*,s.created AS session_created,s.hash AS session_hash,s.expires AS session_expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?',await hash(token),Date.now());if(u&&u.last_seen<Date.now()-300000)this.sql.exec('UPDATE users SET last_seen=? WHERE id=?',Date.now(),u.id);if(u){this.syncAdminCosmetics(u);if(!canUseCosmetic(CATALOG.find(i=>i.id===u.skin),u,this.isAdmin(u)))u.skin='jade';}return u;}
 async notifySessions(data){
  if(!this.env.GAMING_HUB)return;
  try{const r=await this.env.GAMING_HUB.get(this.env.GAMING_HUB.idFromName('office-hub-v1')).fetch(new Request('https://internal/internal/account-revoke',{method:'POST',body:JSON.stringify(data)}));if(!r.ok)throw Error();}catch{console.error('Session disconnected notification pending; subsequent actions still require a valid session.');}
 }
 async login(u,req,expectedPassword){
  const token=random(),now=Date.now(),digest=await hash(token);
  // Hashing yields: a password may have changed since the earlier verification.
  const fresh=this.one('SELECT * FROM users WHERE id=?',u.id);if(!fresh||expectedPassword!==undefined&&fresh.password!==expectedPassword)problem('Kredensial berubah. Masuk ulang.',401);
  this.sql.exec('INSERT INTO sessions VALUES(?,?,?,?)',digest,u.id,now,now+SESSION);
  const old=this.rows('SELECT hash FROM sessions WHERE user_id=? AND hash<>? ORDER BY created DESC,hash DESC LIMIT -1 OFFSET 9',u.id,digest);
  for(const row of old)this.sql.exec('DELETE FROM sessions WHERE hash=?',row.hash);
  this.sql.exec('UPDATE users SET last_seen=? WHERE id=?',now,u.id);this.log('auth.login',u.id,{provider:expectedPassword===undefined?'google':'password'});
  if(old.length)await this.notifySessions({userId:u.id,sessionIds:old.map(r=>r.hash)});
  return cookie('mk_session',token,SESSION/1000,req);
 }

 limit(key,max=8,window=600000){const now=Date.now(),r=this.one('SELECT * FROM limits WHERE key=?',key);if(r&&r.until>now){if(r.count>=max)problem('Terlalu banyak percobaan. Coba lagi beberapa menit.',429);this.sql.exec('UPDATE limits SET count=count+1 WHERE key=?',key);}else this.sql.exec('INSERT OR REPLACE INTO limits VALUES(?,1,?)',key,now+window);}
 cleanup(){const now=Date.now();this.sql.exec('DELETE FROM sessions WHERE expires<?',now);this.sql.exec('DELETE FROM oauth WHERE expires<?',now);this.sql.exec('DELETE FROM limits WHERE until<?',now);this.sql.exec('DELETE FROM events WHERE time<?',now-90*DAY);}
 async fetch(req){try{return await this.route(req);}catch(e){if(!e.status)console.error('Account operation failed');return response({error:e.status?e.message:'Layanan akun belum tersedia. Coba lagi.'},e.status||503);}}
 async route(req){const url=new URL(req.url),path=url.pathname,method=req.method;
  // Internal routes are reachable only through an explicit Worker dispatch, never public routing.
  if(path==='/internal/session'){const u=await this.session(req);return response(u?{id:u.id,name:u.name,skin:u.skin,accessory:u.accessory,sessionId:u.session_hash,expires:u.session_expires}:null);}
  if(path==='/internal/reward')return this.reward(await req.json());
  if(path==='/internal/activity'){const b=await req.json();if(!['game.joined','game.reconnected','game.started','admin.game_balance'].includes(b.kind)||typeof b.id!=='string'||typeof b.userId!=='string')problem('Aktivitas tidak valid.');if(this.one('SELECT id FROM users WHERE id=?',b.userId))this.log(b.kind,b.userId,b.kind==='admin.game_balance'?b.detail||{}:{},b.game,b.room,b.id);if(b.kind==='admin.game_balance')for(const id of new Set(b.recipients||[]))if(this.one('SELECT id FROM users WHERE id=?',id))this.log('account.game_adjusted',id,b.detail||{},b.game,b.room,b.id+':'+id);return response({ok:true});}
  let parsed;
  if(['POST','PATCH','DELETE'].includes(method)){if(req.headers.get('Origin')!==url.origin||req.headers.get('Sec-Fetch-Site')==='cross-site')problem('Asal permintaan tidak diizinkan.',403);parsed=await body(req);}
  const u=await this.session(req);
  if(path==='/api/account/me'&&method==='GET')return response({user:u?this.publicUser(u):null,catalog:PUBLIC_CATALOG,availableItems:allowedCosmetics(u,this.isAdmin(u)).map(i=>i.id),inventory:u?this.rows('SELECT item FROM inventory WHERE user_id=?',u.id).map(r=>r.item):[],googleConfigured:!!(this.env.GOOGLE_CLIENT_ID&&this.env.GOOGLE_CLIENT_SECRET),rewards:REWARDS,preview:this.env.ACCOUNT_PREVIEW==='1'&&['localhost','127.0.0.1'].includes(url.hostname)});
  if(path==='/auth/google'&&method==='GET'){
   if(!this.env.GOOGLE_CLIENT_ID||!this.env.GOOGLE_CLIENT_SECRET)return Response.redirect(url.origin+'/account/?error=google_setup',303);
   await this.throttle(req,'oauth');const state=random(),browser=random(),verifier=random(),nonce=random();
   if(url.searchParams.get('link')==='1'&&!u)problem('Masuk dahulu untuk menghubungkan Google.',401);
   this.sql.exec('INSERT INTO oauth(state,browser,verifier,nonce,expires,link_user,return_to) VALUES(?,?,?,?,?,?,?)',await hash(state),await hash(browser),verifier,nonce,Date.now()+600000,url.searchParams.get('link')==='1'?u.id:null,safeReturn(url.searchParams.get('next'),url.origin));
   const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');target.search=new URLSearchParams({client_id:this.env.GOOGLE_CLIENT_ID,redirect_uri:url.origin+'/auth/google/callback',response_type:'code',scope:'openid email profile',state,nonce,code_challenge:await hash(verifier),code_challenge_method:'S256',prompt:'select_account'});
   return new Response(null,{status:303,headers:{Location:target.href,'Set-Cookie':cookie('mk_oauth',browser,600,req),'Cache-Control':'no-store'}});
  }
  if(path==='/auth/google/callback'&&method==='GET'){
   const state=url.searchParams.get('state'),browser=cookies(req).mk_oauth;if(!state||!browser)problem('Sesi login kedaluwarsa. Mulai lagi.',401);
   const entry=this.one('SELECT * FROM oauth WHERE state=?',await hash(state));if(!entry||entry.expires<Date.now()||!equal(entry.browser,await hash(browser)))problem('Sesi login tidak cocok. Mulai lagi.',401);
   this.sql.exec('DELETE FROM oauth WHERE state=?',await hash(state));
   if(!url.searchParams.get('code'))return Response.redirect(url.origin+'/account/?error=google_cancelled',303);
   const exchange=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code:url.searchParams.get('code'),client_id:this.env.GOOGLE_CLIENT_ID,client_secret:this.env.GOOGLE_CLIENT_SECRET,redirect_uri:url.origin+'/auth/google/callback',grant_type:'authorization_code',code_verifier:entry.verifier})});
   if(!exchange.ok)problem('Login Google gagal. Coba lagi.',401);const tokens=await exchange.json();const identity=await verifyGoogle(tokens.id_token,this.env.GOOGLE_CLIENT_ID,entry.nonce);
   let revokeGoogle=false;let user=this.one('SELECT * FROM users WHERE google_sub=?',identity.sub),existing=this.one('SELECT * FROM users WHERE email=?',identity.email);
   if(entry.link_user){
    if(!u||!await this.session(req)||u.id!==entry.link_user||u.email!==identity.email||(user&&user.id!==u.id))problem('Akun Google harus cocok dengan akun yang sedang masuk.',403);
    this.ctx.storage.transactionSync(()=>{this.sql.exec('UPDATE users SET google_sub=?,verified=1 WHERE id=?',identity.sub,u.id);this.sql.exec('DELETE FROM sessions WHERE user_id=?',u.id);this.log('auth.google_linked',u.id);});
    revokeGoogle=true;user=this.one('SELECT * FROM users WHERE id=?',u.id);
   }
   if(!user&&existing){
    if(existing.google_sub||existing.verified)problem('Email sudah terhubung ke identitas lain. Hubungkan dari pengaturan akun.',409);
    // Verified Google proves ownership of an unverified signup address. Revoke every
    // old credential/session so an email squatter cannot retain access after claim.
    this.ctx.storage.transactionSync(()=>{this.sql.exec('UPDATE users SET google_sub=?,verified=1,password=NULL,salt=NULL,name=?,revision=revision+1 WHERE id=?',identity.sub,identity.name,existing.id);this.sql.exec('DELETE FROM sessions WHERE user_id=?',existing.id);this.log('auth.email_claimed',existing.id,{provider:'google'});});
    revokeGoogle=true;user=this.one('SELECT * FROM users WHERE id=?',existing.id);
   }
   if(!user){const id=uid(),now=Date.now();this.ctx.storage.transactionSync(()=>{this.sql.exec('INSERT INTO users(id,email,name,verified,google_sub,created,last_seen) VALUES(?,?,?,1,?,?,?)',id,identity.email,identity.name,identity.sub,now,now);this.sql.exec('INSERT INTO inventory VALUES(?,?,?)',id,'jade',now);this.log('auth.signup',id,{provider:'google'});});user=this.one('SELECT * FROM users WHERE id=?',id);}
   // Subject is the durable identity; never transfer roles based on an unverified email.
   if(user.email!==identity.email)problem('Email Google berubah. Hubungi admin untuk pemulihan akun.',409);
   const signedCookie=await this.login(user,req);if(revokeGoogle)await this.notifySessions({userId:user.id,all:true,keep:await hash(signedCookie.split(';')[0].split('=')[1])});const headers=new Headers({Location:url.origin+safeReturn(entry.return_to,url.origin),'Cache-Control':'no-store'});headers.append('Set-Cookie',signedCookie);headers.append('Set-Cookie',cookie('mk_oauth','',0,req));return new Response(null,{status:303,headers});
  }
  if(!['POST','PATCH','DELETE'].includes(method)&&!path.startsWith('/api/account/admin')&&!['/api/account/history','/api/account/leaderboard'].includes(path))problem('Tidak ditemukan.',404);
  if(['POST','PATCH','DELETE'].includes(method)){
   if(req.headers.get('Origin')!==url.origin)problem('Asal permintaan tidak diizinkan.',403);
   if(req.headers.get('Sec-Fetch-Site')==='cross-site')problem('Permintaan lintas situs ditolak.',403);
  }
  if(path==='/api/account/signup'&&method==='POST'){
   await this.throttle(req,'signup',30);const b=parsed,address=email(b.email),name=displayName(b.name);
   if(BOOTSTRAP.includes(address))problem('Admin awal harus masuk dengan Google yang terverifikasi.',403);
   confirmPassword(b);const pw=await passwordHash(b.password);if(this.one('SELECT id FROM users WHERE email=?',address))problem('Tidak dapat membuat akun dengan email ini. Coba masuk.',409);
   const id=uid(),now=Date.now();this.ctx.storage.transactionSync(()=>{this.sql.exec('INSERT INTO users(id,email,name,password,salt,created,last_seen) VALUES(?,?,?,?,?,?,?)',id,address,name,pw.hash,pw.salt,now,now);this.sql.exec('INSERT INTO inventory VALUES(?,?,?)',id,'jade',now);this.log('auth.signup',id,{provider:'password'});});const user=this.one('SELECT * FROM users WHERE id=?',id);return response({user:this.publicUser(user)},201,{'Set-Cookie':await this.login(user,req,user.password)});
  }
  if(path==='/api/account/login'&&method==='POST'){
   await this.throttle(req,'login',40);const b=parsed,address=email(b.email);this.limit('email:'+await hash(address),12);
   const user=this.one('SELECT * FROM users WHERE email=?',address);const pw=await passwordHash(b.password,user?.salt||'dummy-salt-constant-for-negative-login');
   if(!user?.password||!equal(user.password,pw.hash)){this.log('auth.login_failed',null,{});problem('Email atau password tidak cocok.',401);}return response({user:this.publicUser(user)},200,{'Set-Cookie':await this.login(user,req,user.password)});
  }
  if(path==='/api/account/preview'&&method==='POST'){
   if(this.env.ACCOUNT_PREVIEW!=='1'||!['127.0.0.1','localhost'].includes(url.hostname))problem('Tidak ditemukan.',404);
   const b=parsed,role=b.role==='admin'?'admin':'player',address=role==='admin'?'admin@example.invalid':'player@example.invalid';let user=this.one('SELECT * FROM users WHERE email=?',address);
   if(!user){const id=uid(),now=Date.now();this.sql.exec('INSERT INTO users(id,email,name,verified,xp,coins,created,last_seen) VALUES(?,?,?,1,640,480,?,?)',id,address,role==='admin'?'Faiz · Preview':'Teman · Preview',now,now);this.sql.exec('INSERT INTO inventory VALUES(?,?,?)',id,'jade',now);if(role==='admin')this.sql.exec('INSERT OR IGNORE INTO roles VALUES(?,?,NULL,0)',address,now);user=this.one('SELECT * FROM users WHERE id=?',id);this.log('preview.created',id,{demo:true});}
   return response({user:this.publicUser(user)},200,{'Set-Cookie':await this.login(user,req)});
  }
  if(!u)problem('Masuk ke akun dahulu.',401);
  if(path==='/api/account/leaderboard'&&method==='GET')return leaderboard(this,url,u);
  if(path==='/api/account/logout'&&method==='POST'){this.sql.exec('DELETE FROM sessions WHERE hash=?',u.session_hash);this.log('auth.logout',u.id);await this.notifySessions({userId:u.id,sessionIds:[u.session_hash]});return response({ok:true},200,{'Set-Cookie':cookie('mk_session','',0,req)});}
  if(path==='/api/account/logout-others'&&method==='POST'){if(Date.now()-u.session_created>1800000)problem('Masuk ulang untuk mengakhiri perangkat lain.',401);this.sql.exec('DELETE FROM sessions WHERE user_id=? AND hash<>?',u.id,u.session_hash);this.log('auth.sessions_revoked',u.id);await this.notifySessions({userId:u.id,all:true,keep:u.session_hash});return response({ok:true});}
  if(path==='/api/account/profile'&&method==='PATCH'){const b=parsed;const name=displayName(b.name);this.sql.exec('UPDATE users SET name=?,revision=revision+1 WHERE id=?',name,u.id);this.log('profile.updated',u.id);return response({ok:true});}
  if(path==='/api/account/password'&&method==='POST'){
   await this.throttle(req,'password',8);const b=parsed;confirmPassword(b);if(u.password){const old=await passwordHash(b.current,u.salt);if(!equal(old.hash,u.password))problem('Password saat ini tidak cocok.',401);}else if(Date.now()-u.session_created>1800000)problem('Masuk ulang sebelum membuat password.',401);
   const pw=await passwordHash(b.password);if(!await this.session(req))problem('Sesi akun berakhir.',401);this.ctx.storage.transactionSync(()=>{const fresh=this.one('SELECT password FROM users WHERE id=?',u.id);if(fresh.password!==u.password)problem('Password sudah berubah. Masuk ulang.',409);this.sql.exec('UPDATE users SET password=?,salt=?,revision=revision+1 WHERE id=?',pw.hash,pw.salt,u.id);this.sql.exec('DELETE FROM sessions WHERE user_id=? AND hash<>?',u.id,u.session_hash);this.log('auth.password_changed',u.id);});await this.notifySessions({userId:u.id,all:true,keep:u.session_hash});return response({ok:true});
  }
  if(path==='/api/account/buy'&&method==='POST'){
   const b=parsed,item=CATALOG.find(i=>i.id===b.item);if(!item)problem('Item tidak ditemukan.',404);if(item.adminOnly)problem('Avatar admin tidak dijual.',403);
   this.ctx.storage.transactionSync(()=>{if(this.one('SELECT item FROM inventory WHERE user_id=? AND item=?',u.id,item.id))return;const fresh=this.one('SELECT coins FROM users WHERE id=?',u.id);if(fresh.coins<item.price)problem('Koin belum cukup.',409);this.sql.exec('UPDATE users SET coins=coins-?,revision=revision+1 WHERE id=?',item.price,u.id);this.sql.exec('INSERT INTO inventory VALUES(?,?,?)',u.id,item.id,Date.now());this.log('shop.purchase',u.id,{item:item.id,coins:-item.price});});return response({ok:true});
  }
  if(path==='/api/account/equip'&&method==='POST'){
   const b=parsed;if(b.item===null){this.sql.exec('UPDATE users SET accessory=NULL,revision=revision+1 WHERE id=?',u.id);return response({ok:true});}
   const item=CATALOG.find(i=>i.id===b.item);if(!canUseCosmetic(item,u,this.isAdmin(u))||!this.one('SELECT item FROM inventory WHERE user_id=? AND item=?',u.id,item.id))problem('Item belum dimiliki.',403);
   this.sql.exec(item.kind==='skin'?'UPDATE users SET skin=?,revision=revision+1 WHERE id=?':'UPDATE users SET accessory=?,revision=revision+1 WHERE id=?',item.id,u.id);this.log('avatar.equipped',u.id,{item:item.id});return response({ok:true});
  }
  if(path==='/api/account/history'&&method==='GET')return response({events:this.rows('SELECT id,time,kind,game,detail FROM events WHERE user_id=? ORDER BY time DESC LIMIT 50',u.id),rewards:this.rows('SELECT * FROM rewards WHERE user_id=? ORDER BY time DESC LIMIT 50',u.id)});
  if(path.startsWith('/api/account/admin')){
   if(!this.isAdmin(u))problem('Akses admin diperlukan.',403);
   const resetTarget=/^\/api\/account\/admin\/users\/([a-zA-Z0-9-]{16,80})\/password$/.exec(path);
   if(resetTarget&&method==='POST'){
    if(Date.now()-u.session_created>1800000)problem('Masuk ulang untuk mereset password pemain.',401);
    await this.throttle(req,'admin-password',12);const b=parsed;confirmPassword(b,true);
    const reason=typeof b.reason==='string'?b.reason.trim():'';if(reason.length<10||reason.length>240)problem('Alasan harus 10–240 karakter.');
    if(!Number.isSafeInteger(b.version)||b.version<0)problem('Versi pemain tidak valid.');
    const target=this.one('SELECT * FROM users WHERE id=?',resetTarget[1]);if(!target)problem('Pemain tidak ditemukan.',404);
    if(target.revision!==b.version)problem('Data pemain berubah. Muat ulang sebelum reset.',409);
    const pw=await passwordHash(b.password),actor=await this.session(req);let revokedSessions=[];
    if(!actor||!this.isAdmin(actor)||Date.now()-actor.session_created>1800000)problem('Masuk ulang sebagai admin sebelum reset.',401);
    this.ctx.storage.transactionSync(()=>{
     const fresh=this.one('SELECT * FROM users WHERE id=?',target.id);if(!fresh||fresh.revision!==b.version)problem('Data pemain berubah. Muat ulang sebelum reset.',409);
     this.sql.exec('UPDATE users SET password=?,salt=?,revision=revision+1 WHERE id=?',pw.hash,pw.salt,target.id);
     revokedSessions=this.rows('SELECT hash FROM sessions WHERE user_id=?',target.id).map(row=>row.hash);this.sql.exec('DELETE FROM sessions WHERE user_id=?',target.id);
     this.log('admin.password_reset',actor.id,{targetId:target.id,targetName:target.name,reason,sessionsRevoked:true});
     this.log('auth.password_reset_by_admin',target.id,{actorId:actor.id,actorName:actor.name,reason,sessionsRevoked:true});
    });
    await this.notifySessions({userId:target.id,sessionIds:revokedSessions});return response({ok:true});
   }
   const target=/^\/api\/account\/admin\/users\/([a-zA-Z0-9-]{16,80})$/.exec(path);
   if(target&&method==='GET'){const user=this.one('SELECT * FROM users WHERE id=?',target[1]);if(!user)problem('Pemain tidak ditemukan.',404);return response({user:this.publicUser(user),possessions:possessions(this,user),catalog:PUBLIC_CATALOG.filter(i=>canUseCosmetic(CATALOG.find(c=>c.id===i.id),user,this.isAdmin(user)))});}
   if(target&&method==='PATCH'){if(Date.now()-u.session_created>1800000)problem('Masuk ulang untuk mengubah milik pemain.',401);return response(applyUserEdit(this,u,parsed,target[1]));}
   if(path==='/api/account/admin/authorize'&&method==='GET'){if(Date.now()-u.session_created>1800000)problem('Masuk ulang untuk mengubah saldo meja.',401);return response({id:u.id,name:u.name});}
   if(path==='/api/account/admin/overview'&&method==='GET')return this.overview();
   if(path==='/api/account/admin/users'&&method==='GET'){
    const offset=Math.max(0,Math.min(100000,Number(url.searchParams.get('offset'))||0)),search=String(url.searchParams.get('q')||'').slice(0,100);
    const users=this.rows('SELECT * FROM users WHERE email LIKE ? OR name LIKE ? ORDER BY created DESC LIMIT 50 OFFSET ?','%'+search+'%','%'+search+'%',offset).map(v=>({...this.publicUser(v),lastSeen:v.last_seen}));return response({users,offset});
   }
   if(path==='/api/account/admin/logs'&&method==='GET'){
    const before=Number(url.searchParams.get('before'))||Date.now()+1,cursor=String(url.searchParams.get('cursor')||'').slice(0,100),kind=String(url.searchParams.get('kind')||'').slice(0,60);
    return response({events:this.rows('SELECT e.id,e.time,e.user_id,e.kind,e.game,e.room,e.detail,u.name FROM events e LEFT JOIN users u ON u.id=e.user_id WHERE (e.time<? OR (e.time=? AND e.id<?)) AND e.kind LIKE ? ORDER BY e.time DESC,e.id DESC LIMIT 100',before,before,cursor,kind+'%')});
   }
   if(path==='/api/account/admin/roles'&&method==='GET')return response({roles:this.rows('SELECT r.email,r.created,r.protected,u.name,u.verified FROM roles r LEFT JOIN users u ON u.email=r.email ORDER BY r.protected DESC,r.created')});
   if(path==='/api/account/admin/roles'&&['POST','PATCH','DELETE'].includes(method)){
    if(Date.now()-u.session_created>1800000)problem('Masuk ulang untuk mengelola admin.',401);
    const b=parsed,address=email(b.email);this.ctx.storage.transactionSync(()=>{const existing=this.one('SELECT * FROM roles WHERE email=?',address);if(method==='DELETE'){if(existing?.protected||address===u.email)problem('Admin awal dan akses sendiri dilindungi.',403);this.sql.exec('DELETE FROM roles WHERE email=?',address);this.log('admin.revoked',u.id,{email:address});}else{if(method==='PATCH'){const from=email(b.from),old=this.one('SELECT * FROM roles WHERE email=?',from);if(!old||old.protected||from===u.email)problem('Admin ini tidak dapat diubah.',403);if(this.one('SELECT email FROM roles WHERE email=?',address))problem('Email sudah menjadi admin.',409);this.sql.exec('DELETE FROM roles WHERE email=?',from);this.log('admin.updated',u.id,{from,email:address});}this.sql.exec('INSERT OR IGNORE INTO roles VALUES(?,?,?,0)',address,Date.now(),u.id);this.log('admin.granted',u.id,{email:address,activation:'verified-google-only'});}});return response({ok:true});
   }
  }
  problem('Tidak ditemukan.',404);
 }
 async throttle(req,action,max=8){const salt=this.one("SELECT value FROM metadata WHERE key='rate_salt'").value;const fingerprint=await hash(salt+':'+(req.headers.get('CF-Connecting-IP')||'local'));this.limit(action+':'+fingerprint,max);if(Math.random()<.02)this.cleanup();}
 overview(){const now=Date.now(),since=now-7*DAY;return response({totals:this.one('SELECT COUNT(*) users,COALESCE(SUM(xp),0) xp,COALESCE(SUM(coins),0) coins FROM users'),activeToday:this.one('SELECT COUNT(*) n FROM users WHERE last_seen>?',now-DAY).n,play:this.one('SELECT COUNT(*) rounds,COUNT(DISTINCT user_id) players,COALESCE(SUM(seconds),0) seconds,COALESCE(SUM(xp),0) xp FROM rewards WHERE time>?',since),daily:this.rows("SELECT strftime('%Y-%m-%d',time/1000,'unixepoch') day,COUNT(*) rounds,COUNT(DISTINCT user_id) players,SUM(xp) xp FROM rewards WHERE time>? GROUP BY day ORDER BY day",since),games:this.rows('SELECT game,COUNT(*) rounds,COUNT(DISTINCT user_id) players,SUM(seconds) seconds FROM rewards WHERE time>? GROUP BY game',since),retentionDays:90,measurement:'Participant-rounds, not unique table rounds. Playtime sums eligible connected-player time; not a billing estimate.',generatedAt:now});}
 reward(b){
  if(!b||typeof b.id!=='string'||b.id.length>200||!Array.isArray(b.players)||b.players.length>8||!GAMES.includes(b.game))problem('Reward tidak valid.');
  const seen=new Set();for(const p of b.players){if(!p||typeof p.userId!=='string'||p.userId.length>80||seen.has(p.userId)||!Number.isFinite(p.seconds)||p.seconds<0)problem('Peserta hasil tidak valid.');seen.add(p.userId);if(b.scoreVersion===1&&!(p.points===null&&p.money===null)&&(!Number.isSafeInteger(p.points)||!Number.isSafeInteger(p.money)||Math.abs(p.points)>1000000000000000||Math.abs(p.money)>1000000000000000))problem('Hasil poin tidak valid.');}
  this.ctx.storage.transactionSync(()=>{const today=Math.floor(Date.now()/DAY)*DAY;for(const p of b.players){
   const id=b.id+':'+p.userId;if(this.one('SELECT id FROM rewards WHERE id=?',id)||this.one('SELECT id FROM game_result_receipts WHERE id=?',id))continue;
   const u=this.one('SELECT id,xp,coins FROM users WHERE id=?',p.userId);if(!u)continue;let xp=0;
   if(p.seconds>=REWARDS.minSeconds){const earned=this.one('SELECT COALESCE(SUM(xp),0) n FROM rewards WHERE user_id=? AND time>=?',p.userId,today).n;xp=Math.max(0,Math.min(1000000000-u.xp,1000000000-u.coins,REWARDS.dailyCap-earned,REWARDS.play+(p.won?REWARDS.winBonus:0)));const seconds=Math.min(7200,Math.floor(p.seconds));
    this.sql.exec('INSERT INTO rewards VALUES(?,?,?,?,?,?,?,?)',id,p.userId,Date.now(),xp,xp,b.game,p.won?'win':'played',seconds);this.sql.exec('UPDATE users SET xp=xp+?,coins=coins+?,last_seen=?,revision=revision+1 WHERE id=?',xp,xp,Date.now(),p.userId);this.log('game.completed',p.userId,{xp,coins:xp,seconds,outcome:p.won?'win':'played',eventId:b.id},b.game,b.room,id);
   }
   if(b.scoreVersion===1||p.seconds>=REWARDS.minSeconds)recordStanding(this,b,p,id,xp);
  }});return response({ok:true});
 }
}
