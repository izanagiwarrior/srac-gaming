import {problem,response} from './security.js';
const POOL='first-light-v2',COST=100,MAX=1000000000;
export const LIMITED=['limited-eclipse','limited-phoenix','limited-nova','limited-nebula','limited-chrono'];
const ODDS=[{kind:'zonk',chance:50,payout:0},{kind:'refund',chance:30,payout:100},{kind:'onehalf',chance:10,payout:150},{kind:'double',chance:9,payout:200},{kind:'asset',chance:1,payout:0}];
export function initGacha(store){store.sql.exec('CREATE TABLE IF NOT EXISTS gacha_draws(user_id TEXT NOT NULL,request_id TEXT NOT NULL,pool TEXT NOT NULL,result TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,request_id))');store.sql.exec('CREATE INDEX IF NOT EXISTS gacha_user_time ON gacha_draws(user_id,created DESC,request_id DESC)');}
function owned(store,id){return store.rows('SELECT item FROM inventory WHERE user_id=? AND item IN (?,?,?,?,?)',id,...LIMITED).map(r=>r.item);}
function randomInt(max){const bytes=new Uint32Array(1),bound=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(bytes);}while(bytes[0]>=bound);return bytes[0]%max;}
export function gachaStatus(store,user,url){const items=owned(store,user.id),last=store.one('SELECT result FROM gacha_draws WHERE user_id=? ORDER BY created DESC,request_id DESC LIMIT 1',user.id);const requested=url.searchParams.get('requestId');if(requested&&!/^[a-zA-Z0-9_-]{16,80}$/.test(requested))problem('ID tarikan tidak valid.');const pending=requested?store.one('SELECT result FROM gacha_draws WHERE user_id=? AND request_id=?',user.id,requested):null;return response({pending:pending?JSON.parse(pending.result):null,userId:user.id,version:user.revision||0,pool:POOL,cost:COST,odds:ODDS,limited:LIMITED,owned:items,complete:items.length===LIMITED.length,coins:user.coins,last:last?JSON.parse(last.result):null,rateLimit:10});}
export function drawGacha(store,user,b){
 if(typeof b.requestId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(b.requestId))problem('ID tarikan tidak valid.');
 let result;
 store.ctx.storage.transactionSync(()=>{
  const old=store.one('SELECT pool,result FROM gacha_draws WHERE user_id=? AND request_id=?',user.id,b.requestId);
  if(old){if(b.pool!==old.pool)problem('ID tarikan sudah digunakan untuk banner lain.',409);result=JSON.parse(old.result);return;}
  if(b.pool!==POOL)problem('Banner berubah. Muat ulang peluang sebelum menarik.',409);
  const fresh=store.one('SELECT coins FROM users WHERE id=?',user.id);if(!fresh)problem('Akun tidak ditemukan.',401);
  if(fresh.coins<COST)problem('Koin belum cukup. Satu tarikan membutuhkan 100 koin.',409);
  if(fresh.coins>MAX-COST)problem('Saldo terlalu dekat batas akun. Gunakan koin di toko terlebih dahulu.',409);
  const collection=owned(store,user.id),complete=collection.length===LIMITED.length;
  if(complete&&b.ackComplete!==true)problem('Kelima limited sudah dimiliki. Semua hasil aset akan menjadi duplikat tanpa hadiah; konfirmasi sebelum lanjut.',409);
  store.limit('gacha:'+user.id,10,60000);
  const roll=randomInt(10000);let end=0,outcome;
  for(const row of ODDS){end+=row.chance*100;if(roll<end){outcome=row;break;}}
  const missing=LIMITED.filter(id=>!collection.includes(id)),choices=missing.length?missing:LIMITED;
  const assetId=outcome.kind==='asset'?choices[randomInt(choices.length)]:null,duplicate=!!assetId&&collection.includes(assetId),time=Date.now();
  const coinsAfter=fresh.coins-COST+outcome.payout;
  store.sql.exec('UPDATE users SET coins=?,revision=revision+1 WHERE id=?',coinsAfter,user.id);
  if(assetId&&!duplicate)store.sql.exec('INSERT INTO inventory VALUES(?,?,?)',user.id,assetId,time);
  result={requestId:b.requestId,pool:POOL,time,cost:COST,kind:outcome.kind,payout:outcome.payout,net:outcome.payout-COST,assetId,duplicate,newAsset:!!assetId&&!duplicate,coinsAfter,collectionComplete:collection.length+(assetId&&!duplicate?1:0)===LIMITED.length};
  store.sql.exec('INSERT INTO gacha_draws VALUES(?,?,?,?,?)',user.id,b.requestId,POOL,JSON.stringify(result),time);
  store.log('gacha.drawn',user.id,result,null,null,'gacha:'+user.id+':'+b.requestId);
 });
 return response(result);
}
