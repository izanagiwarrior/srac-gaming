import {Buffer} from 'node:buffer';
const CHUNK=128*1024,MAX_SAVE=2*1024*1024;
export function prepareStorage(sql){
  sql.exec('CREATE TABLE IF NOT EXISTS game_save (game TEXT PRIMARY KEY, updated INTEGER NOT NULL, chunks INTEGER NOT NULL)');
  sql.exec('CREATE TABLE IF NOT EXISTS game_chunk (game TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(game,part))');
}
export function gameStorage(ctx,game,writeEnabled=()=>true){
  let updated=null;
  return {
    savedAt:()=>updated,
    read(){const row=ctx.storage.sql.exec('SELECT updated,chunks FROM game_save WHERE game=?',game).toArray()[0];if(!row)return null;
      if(row.chunks<1||row.chunks>MAX_SAVE/CHUNK)throw Error('Cloud save exceeds supported size; original preserved.');
      const chunks=ctx.storage.sql.exec('SELECT part,data FROM game_chunk WHERE game=? ORDER BY part',game).toArray();
      if(chunks.length!==row.chunks||chunks.some((r,i)=>r.part!==i))throw Error('Incomplete cloud save; original preserved.');
      updated=row.updated;return Buffer.concat(chunks.map(row=>Buffer.from(row.data)));
    },
    write(buffer){
      if(!writeEnabled())throw Error('Adapter is paused after a failed save.');
      if(buffer.length>MAX_SAVE)throw Error('Save game mencapai batas 2 MiB. Simpan rekap dan bubarkan room lama.');
      const count=Math.max(1,Math.ceil(buffer.length/CHUNK)),now=Date.now();
      ctx.storage.transactionSync(()=>{
        for(let i=0;i<count;i++)ctx.storage.sql.exec('INSERT INTO game_chunk(game,part,data) VALUES(?,?,?) ON CONFLICT(game,part) DO UPDATE SET data=excluded.data',game,i,new Uint8Array(buffer.subarray(i*CHUNK,(i+1)*CHUNK)));
        ctx.storage.sql.exec('DELETE FROM game_chunk WHERE game=? AND part>=?',game,count);
        ctx.storage.sql.exec('INSERT INTO game_save(game,updated,chunks) VALUES(?,?,?) ON CONFLICT(game) DO UPDATE SET updated=excluded.updated,chunks=excluded.chunks',game,now,count);
      });updated=now;
    }
  };
}
