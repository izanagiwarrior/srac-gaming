import {problem,response} from './security.js';
const SIZE=20;
const CATEGORIES=['auth','game','shop','avatar','admin','cosmetic','appearance','profile','account','preview','gacha'];
export function initReadIndexes(store){
 const statements=[
  'CREATE INDEX IF NOT EXISTS events_page ON events(time DESC,id DESC)',
  'CREATE INDEX IF NOT EXISTS events_user_page ON events(user_id,time DESC,id DESC)',
  "CREATE INDEX IF NOT EXISTS events_category_page ON events(substr(kind,1,instr(kind,'.')-1),time DESC,id DESC)",
  'CREATE INDEX IF NOT EXISTS events_game_page ON events(game,time DESC,id DESC)',
  "CREATE INDEX IF NOT EXISTS events_category_game_page ON events(substr(kind,1,instr(kind,'.')-1),game,time DESC,id DESC)",
  'CREATE INDEX IF NOT EXISTS users_created_page ON users(created DESC,id DESC)',
  'CREATE INDEX IF NOT EXISTS users_name_page ON users(name COLLATE NOCASE,id)',
  'CREATE INDEX IF NOT EXISTS users_email_page ON users(email COLLATE NOCASE,id)',
  'CREATE INDEX IF NOT EXISTS users_seen ON users(last_seen)',
  'CREATE INDEX IF NOT EXISTS rewards_time ON rewards(time)',
  'CREATE INDEX IF NOT EXISTS roles_page ON roles(created DESC,email DESC)'];
 for(const q of statements)store.sql.exec(q);
}
function cursor(url,scope){const raw=url.searchParams.get('page');if(!raw)return null;try{if(raw.length>1500)throw Error();const c=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(raw),c=>c.charCodeAt(0))));if(c.scope!==scope||!Array.isArray(c.key)||c.key.length!==2||!c.key.every(v=>typeof v==='string'||Number.isSafeInteger(v)))throw Error();return c.key;}catch{problem('Halaman tidak cocok. Mulai lagi dari halaman pertama.');}}
function page(rows,scope,key){const more=rows.length>SIZE,items=rows.slice(0,SIZE);return {items,next:more?btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({scope,key:key(items.at(-1))})))):null,pageSize:SIZE};}
export function eventPage(store,url,user,admin=false){
 const category=(url.searchParams.get('kind')||'').replace(/\.$/,'');if(category&&!CATEGORIES.includes(category))problem('Kategori tidak valid.');
 if(!admin&&category)problem('Gunakan filter kategori di audit admin.');
 const game=admin?url.searchParams.get('game')||'':'';if(game&&!['mahjong','capsa','poker','catur','domino','blackjack','uno','ludo','monopoli','reversi','dam','tangga','empat'].includes(game))problem('Game tidak valid.');
 const days=Number(url.searchParams.get('days')||7);if(![1,7,30,90].includes(days))problem('Rentang waktu tidak valid.');
 // The selected window is cursor-scoped; paging never expands into older history.
 const scope=JSON.stringify([admin?'admin':user.id,category,game,days]);const key=cursor(url,scope);
 const where=['e.time>=?'],args=[Date.now()-days*86400000];
 if(!admin){where.push('e.user_id=?');args.push(user.id);}
 if(category){where.push("substr(e.kind,1,instr(e.kind,'.')-1)=?");args.push(category);}
 if(game){where.push('e.game=?');args.push(game);}
 if(key){where.push('(e.time,e.id)<(?,?)');args.push(...key);}
 // User history intentionally has no category filter, keeping one index-aligned path.
 const index=!admin?'events_user_page':category&&game?'events_category_game_page':category?'events_category_page':game?'events_game_page':'events_page';
 const rows=store.rows(`SELECT e.id,e.time,e.user_id,e.kind,e.game,e.room,e.detail${admin?',u.name':''} FROM events e INDEXED BY ${index} ${admin?'LEFT JOIN users u ON u.id=e.user_id':''} WHERE ${where.join(' AND ')} ORDER BY e.time DESC,e.id DESC LIMIT ${SIZE+1}`,...args);
 const result=page(rows,scope,r=>[r.time,r.id]);return response({events:result.items,next:result.next,pageSize:SIZE,days});
}
const asciiLower=s=>s.replace(/[A-Z]/g,c=>c.toLowerCase());
function prefixEnd(value){const chars=Array.from(value);while(chars.length){const c=chars.pop().codePointAt(0);if(c<0x10ffff){let next=c+1;if(next>=65&&next<=90)next=91;if(next>=0xd800&&next<=0xdfff)next=0xe000;return chars.join('')+String.fromCodePoint(next);}}return null;}
export function usersPage(store,url){
 const q=String(url.searchParams.get('q')||'').trim().slice(0,100),field=url.searchParams.get('field')||'name';if(!['name','email'].includes(field))problem('Kolom pencarian tidak valid.');
 const scope=JSON.stringify(['users',q,field]),key=cursor(url,scope);let rows;
 const columns='u.*,EXISTS(SELECT 1 FROM roles WHERE email=u.email) AS role_admin';
 if(q){
  const prefix=asciiLower(q),upper=prefixEnd(prefix),index=field==='name'?'users_name_page':'users_email_page';
  if(key&&(typeof key[0]!=='string'||typeof key[1]!=='string'||!asciiLower(key[0]).startsWith(prefix)))problem('Halaman pencarian tidak cocok.');
  // Separate the equal-name tail from later names. Both use direct index seeks,
  // even when thousands of users share exactly the same display name.
  rows=key?store.rows(`SELECT ${columns} FROM users u INDEXED BY ${index} WHERE u.${field}=? COLLATE NOCASE AND u.id>? ORDER BY u.id ASC LIMIT ${SIZE+1}`,...key):[];
  if(rows.length<SIZE+1){const args=[key?key[0]:prefix];if(upper!==null)args.push(upper);
   rows.push(...store.rows(`SELECT ${columns} FROM users u INDEXED BY ${index} WHERE u.${field}${key?'>':'>='}? COLLATE NOCASE ${upper!==null?`AND u.${field}<? COLLATE NOCASE`:''} ORDER BY u.${field} COLLATE NOCASE ASC,u.id ASC LIMIT ${SIZE+1-rows.length}`,...args));}
 }else rows=store.rows(`SELECT ${columns} FROM users u INDEXED BY users_created_page ${key?'WHERE (u.created,u.id)<(?,?)':''} ORDER BY u.created DESC,u.id DESC LIMIT ${SIZE+1}`,...(key||[]));
 const result=page(rows,scope,r=>[q?r[field]:r.created,r.id]);return response({users:result.items.map(v=>({...store.publicUser(v,!!v.verified&&!!v.role_admin),lastSeen:v.last_seen})),next:result.next,pageSize:SIZE});
}
export function rolesPage(store,url){const scope='roles',key=cursor(url,scope),result=page(store.rows(`SELECT r.email,r.created,r.protected,u.name,u.verified FROM roles r LEFT JOIN users u ON u.email=r.email ${key?'WHERE (r.created,r.email)<(?,?)':''} ORDER BY r.created DESC,r.email DESC LIMIT ${SIZE+1}`,...(key||[])),scope,r=>[r.created,r.email]);return response({roles:result.items,next:result.next,pageSize:SIZE});}
