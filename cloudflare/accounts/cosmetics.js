import {CATALOG,canUseCosmetic} from './catalog.js';
import {problem} from './security.js';
export const STYLE_SLOTS=Object.freeze(['decoration','entrance','aura']);
export const ALL_SLOTS=Object.freeze(['skin','accessory',...STYLE_SLOTS]);
export function initCosmetics(store){
 const columns=new Set(store.rows('PRAGMA table_info(users)').map(c=>c.name));
 for(const slot of STYLE_SLOTS)if(!columns.has(slot))store.sql.exec(`ALTER TABLE users ADD COLUMN ${slot} TEXT`);
 store.sql.exec('CREATE TABLE IF NOT EXISTS cosmetic_unlocks(user_id TEXT NOT NULL,item TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,item))');
}
export function syncRankCosmetics(store,user){
 const level=Math.floor(Math.sqrt(user.xp/100))+1;if(level<5)return;
 if((store.rankGrantCache.get(user.id)||0)>=level)return;
 // Bump this key if a future release adds rewards to already-existing tiers.
 const key='rank-cosmetics-v1:'+user.id,last=Number(store.one('SELECT value FROM metadata WHERE key=?',key)?.value||0);
 if(last>=level){rememberRank(store,user.id,level);return;}
 store.ctx.storage.transactionSync(()=>{
  const owned=new Set(store.rows('SELECT item FROM inventory WHERE user_id=?',user.id).map(r=>r.item));let changed=false;
  for(const item of CATALOG.filter(i=>i.unlockLevel&&i.unlockLevel<=level)){
   if(store.one('SELECT item FROM cosmetic_unlocks WHERE user_id=? AND item=?',user.id,item.id))continue;
   store.sql.exec('INSERT INTO cosmetic_unlocks VALUES(?,?,?)',user.id,item.id,Date.now());
   if(!owned.has(item.id)){store.sql.exec('INSERT OR IGNORE INTO inventory VALUES(?,?,?)',user.id,item.id,Date.now());store.log('cosmetic.rank_unlocked',user.id,{item:item.id,level:item.unlockLevel});changed=true;}
  }
  store.sql.exec('INSERT OR REPLACE INTO metadata VALUES(?,?)',key,String(level));
  if(changed){store.sql.exec('UPDATE users SET revision=revision+1 WHERE id=?',user.id);user.revision=(user.revision||0)+1;}
 });
 rememberRank(store,user.id,level);
}
function rememberRank(store,id,level){if(store.rankGrantCache.size>=256)store.rankGrantCache.clear();store.rankGrantCache.set(id,level);}
export function equippedStyle(store,user,admin=store.isAdmin(user)){
 return Object.fromEntries(STYLE_SLOTS.map(slot=>{const item=CATALOG.find(i=>i.id===user[slot]&&i.kind===slot);return [slot,canUseCosmetic(item,user,admin)?item.id:null];}));
}
export function validateSelection(store,user,slot,id){
 if(!ALL_SLOTS.includes(slot))problem('Pilihan penampilan tidak valid.');
 if(id===null&&slot!=='skin')return null;
 const item=CATALOG.find(i=>i.id===id&&i.kind===slot);
 if(!canUseCosmetic(item,user,store.isAdmin(user))||!store.one('SELECT item FROM inventory WHERE user_id=? AND item=?',user.id,id))problem('Item belum dimiliki.',403);
 return item.id;
}
