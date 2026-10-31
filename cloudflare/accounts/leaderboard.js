import {problem,response} from './security.js';
import {CATALOG,canUseCosmetic} from './catalog.js';
export const GAMES=['capsa','mahjong','poker','catur','domino','blackjack','uno','ludo','monopoli','reversi'];
const MAX=9000000000000000;
export function initLeaderboard(store){
 const sql=store.sql;
 sql.exec('CREATE TABLE IF NOT EXISTS game_stats(user_id TEXT NOT NULL,game TEXT NOT NULL,rounds INTEGER NOT NULL DEFAULT 0,wins INTEGER NOT NULL DEFAULT 0,xp INTEGER NOT NULL DEFAULT 0,points INTEGER NOT NULL DEFAULT 0,money INTEGER NOT NULL DEFAULT 0,measured INTEGER NOT NULL DEFAULT 0,updated INTEGER NOT NULL,PRIMARY KEY(user_id,game))');
 sql.exec('CREATE TABLE IF NOT EXISTS game_result_receipts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,game TEXT NOT NULL,time INTEGER NOT NULL,points INTEGER,money INTEGER,xp INTEGER NOT NULL,won INTEGER NOT NULL)');
 for(const key of ['money','points','xp'])sql.exec(`CREATE INDEX IF NOT EXISTS stats_rank_${key} ON game_stats(game,${key} DESC,wins DESC,rounds DESC,user_id)`);
 sql.exec('CREATE INDEX IF NOT EXISTS users_rank_xp ON users(xp DESC,id)');
 if(!store.one("SELECT key FROM metadata WHERE key='leaderboard-v1'"))store.ctx.storage.transactionSync(()=>{
  // Old reward records contain XP/outcome, not per-account settlement amounts.
  sql.exec("INSERT OR IGNORE INTO game_stats(user_id,game,rounds,wins,xp,updated) SELECT user_id,game,COUNT(*),SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END),SUM(xp),MAX(time) FROM rewards GROUP BY user_id,game");
  sql.exec("INSERT OR IGNORE INTO game_stats(user_id,game,rounds,wins,xp,updated) SELECT user_id,'all',COUNT(*),SUM(CASE WHEN outcome='win' THEN 1 ELSE 0 END),SUM(xp),MAX(time) FROM rewards GROUP BY user_id");
  sql.exec("INSERT INTO metadata VALUES('leaderboard-v1',?)",String(Date.now()));
 });
 store.leaderboardCache=new Map();
}
export function recordStanding(store,b,p,id,xp){
 const measured=b.scoreVersion===1&&Number.isSafeInteger(p.points)&&Number.isSafeInteger(p.money),points=measured?p.points:0,money=measured?p.money:0,time=Date.now();
 const inserted=store.sql.exec('INSERT OR IGNORE INTO game_result_receipts VALUES(?,?,?,?,?,?,?,?)',id,p.userId,b.game,time,measured?points:null,measured?money:null,xp,p.won?1:0);
 if(!inserted.rowsWritten)return;
 for(const game of [b.game,'all'])store.sql.exec(`INSERT INTO game_stats VALUES(?,?,1,?,?,?,?,?,?) ON CONFLICT(user_id,game) DO UPDATE SET rounds=rounds+1,wins=wins+excluded.wins,xp=MIN(1000000000,xp+excluded.xp),points=MAX(-${MAX},MIN(${MAX},points+excluded.points)),money=MAX(-${MAX},MIN(${MAX},money+excluded.money)),measured=measured+excluded.measured,updated=excluded.updated`,p.userId,game,p.won?1:0,xp,points,money,measured?1:0,time);
 store.leaderboardCache.clear();
}
function portrait(row){const admin=!!row.verified&&!!row.admin,item=CATALOG.find(i=>i.id===row.skin);return canUseCosmetic(item,row,admin)?item.image:'/avatar-starter-buddy.webp';}
export function leaderboard(store,url,user){
 const game=url.searchParams.get('game')||'all',sort=url.searchParams.get('sort')||'money';
 if(!['all',...GAMES].includes(game)||!['money','points','level'].includes(sort))problem('Pilihan leaderboard tidak valid.');
 const key=game+':'+sort,now=Date.now();let cached=store.leaderboardCache.get(key);
 const score=sort==='level'?(game==='all'?'u.xp':'s.xp'):'s.'+sort;
 if(!cached||now-cached.time>30000){
  const rows=store.rows(`SELECT s.*,u.name,u.skin,u.email,u.verified,u.xp AS lifetime_xp,EXISTS(SELECT 1 FROM roles WHERE email=u.email) AS admin,${score} AS value FROM game_stats s JOIN users u ON u.id=s.user_id WHERE s.game=? AND s.rounds>0 ORDER BY ${score} DESC,s.wins DESC,s.rounds DESC,s.user_id ASC LIMIT 50`,game);
  let rank=0,previous=null;const entries=rows.map((r,i)=>{if(r.value!==previous)rank=i+1;previous=r.value;return {owner:r.user_id,rank,name:r.name,avatar:portrait(r),money:r.money,points:r.points,rounds:r.rounds,wins:r.wins,measuredRounds:r.measured,xp:game==='all'?r.lifetime_xp:r.xp,level:Math.floor(Math.sqrt((game==='all'?r.lifetime_xp:r.xp)/100))+1,value:r.value};});
  cached={time:now,entries};store.leaderboardCache.set(key,cached);
 }
 const ranked=cached.entries.find(r=>r.owner===user.id),own=store.one('SELECT * FROM game_stats WHERE user_id=? AND game=?',user.id,game);
 const me=own?{rank:ranked?.rank??null,money:own.money,points:own.points,rounds:own.rounds,wins:own.wins,measuredRounds:own.measured,xp:game==='all'?user.xp:own.xp,level:Math.floor(Math.sqrt((game==='all'?user.xp:own.xp)/100))+1}:null;
 return response({game,sort,entries:cached.entries.map(({owner,...r})=>({...r,you:owner===user.id})),me,generatedAt:cached.time,limit:50,accountLevel:game==='all',trackingSince:Number(store.one("SELECT value FROM metadata WHERE key='leaderboard-v1'").value),currency:'IDR',meaning:'Net hasil ronde selesai, bukan saldo yang bisa ditarik. Poin/chip dan nominal mengikuti aturan meja, termasuk bot dan variasi. Koreksi admin/buy-in tidak menambah hasil leaderboard. Level gabungan memakai XP akun; level per game memakai XP yang diperoleh pada game itu.'});
}
