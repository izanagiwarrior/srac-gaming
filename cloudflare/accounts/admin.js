import {STYLE_SLOTS} from './cosmetics.js';
import {problem,displayName} from './security.js';
import {CATALOG,canUseCosmetic} from './catalog.js';
export const MAX_BALANCE=1000000000;
export function reason(value){const text=String(value||'').replace(/[\u0000-\u001f]/g,'').trim();if(text.length<10||text.length>240)problem('Isi alasan perubahan, 10–240 karakter.');return text;}
export function requestId(value){if(typeof value!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(value))problem('ID permintaan tidak valid.');return value;}
export function amount(current,operation,minimum=0){
 if(!operation||!['add','subtract','set'].includes(operation.mode)||!Number.isSafeInteger(operation.value)||(operation.mode==='set'?operation.value<minimum:operation.value<0)||Math.abs(operation.value)>MAX_BALANCE)problem('Jumlah atau jenis perubahan tidak valid.');
 const value=operation.mode==='set'?operation.value:current+(operation.mode==='subtract'?-operation.value:operation.value);
 if(!Number.isSafeInteger(value)||value<minimum||value>MAX_BALANCE)problem('Saldo hasil perubahan di luar batas.');return value;
}
export function possessions(store,user){return {name:user.name,xp:user.xp,coins:user.coins,skin:user.skin,accessory:user.accessory,...Object.fromEntries(STYLE_SLOTS.map(k=>[k,user[k]||null])),inventory:store.rows('SELECT item FROM inventory WHERE user_id=? ORDER BY item',user.id).map(r=>r.item),version:user.revision||0};}
export function applyUserEdit(store,actor,body,targetId){
 const id=requestId(body.requestId),why=reason(body.reason),signature=JSON.stringify({...body,targetId,requestId:id});
 let result;
 store.ctx.storage.transactionSync(()=>{
  if(!store.isAdmin(store.one('SELECT * FROM users WHERE id=?',actor.id)))problem('Akses admin telah berubah.',403);
  const old=store.one('SELECT * FROM admin_operations WHERE id=?',id);
  if(old){if(old.actor!==actor.id||old.signature!==signature)problem('ID perubahan sudah dipakai untuk permintaan lain.',409);result=JSON.parse(old.result);return;}
  const user=store.one('SELECT * FROM users WHERE id=?',targetId);if(!user)problem('Pemain tidak ditemukan.',404);
  if(!Number.isSafeInteger(body.version)||body.version!==(user.revision||0))problem('Data pemain sudah berubah. Muat ulang sebelum menyimpan.',409);
  const before=possessions(store,user),name=displayName(body.name),xp=amount(user.xp,body.xp),coins=amount(user.coins,body.coins);
  if(!Array.isArray(body.inventory)||body.inventory.length>CATALOG.length||new Set(body.inventory).size!==body.inventory.length||body.inventory.some(i=>!canUseCosmetic(CATALOG.find(c=>c.id===i),user,store.isAdmin(user))))problem('Koleksi tidak valid.');
  const skin=CATALOG.find(i=>i.id===body.skin&&i.kind==='skin'),accessory=body.accessory===null?null:CATALOG.find(i=>i.id===body.accessory&&i.kind==='accessory');
  if(!skin||!body.inventory.includes(skin.id)||body.accessory!==null&&(!accessory||!body.inventory.includes(accessory.id)))problem('Avatar aktif harus dimiliki pemain; sisakan setidaknya satu skin.');
  store.sql.exec('UPDATE users SET name=?,xp=?,coins=?,skin=?,accessory=?,revision=revision+1 WHERE id=?',name,xp,coins,skin.id,accessory?.id||null,targetId);
  for(const slot of STYLE_SLOTS){const selected=body[slot]===undefined?(body.inventory.includes(user[slot])?user[slot]:null):body[slot];const item=CATALOG.find(i=>i.id===selected&&i.kind===slot);if(selected!==null&&(!item||!body.inventory.includes(selected)))problem('Efek aktif harus dimiliki pemain; pilih jenis yang sesuai.');store.sql.exec(`UPDATE users SET ${slot}=? WHERE id=?`,selected,targetId);}
  for(const item of before.inventory)if(!body.inventory.includes(item))store.sql.exec('DELETE FROM inventory WHERE user_id=? AND item=?',targetId,item);
  for(const item of body.inventory)store.sql.exec('INSERT OR IGNORE INTO inventory VALUES(?,?,?)',targetId,item,Date.now());
  const after=possessions(store,store.one('SELECT * FROM users WHERE id=?',targetId)),detail={actorId:actor.id,actorName:actor.name,targetId,targetName:name,reason:why,before,after};
  store.log('admin.user_adjusted',actor.id,detail,null,null,id);
  store.log('account.adjusted',targetId,detail,null,null,id+':recipient');
  result={ok:true,user:store.publicUser(store.one('SELECT * FROM users WHERE id=?',targetId)),inventory:after.inventory};
  store.sql.exec('INSERT INTO admin_operations VALUES(?,?,?,?,?)',id,actor.id,signature,JSON.stringify(result),Date.now());
 });return result;
}
