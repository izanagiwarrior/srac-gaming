'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const cards=[...html.matchAll(/<a href="\/([a-z]+)\/" class="game-card[^"]*"[\s\S]*?<img class="cast-portrait" src="([^"]+)"/g)].map(m=>({slug:m[1],src:m[2]}));
test('landing has a card for every game with its own existing character image',()=>{
  const games=['mahjong','blackjack','capsa','catur','dam','domino','empat','ludo','monopoli','poker','reversi','tangga','uno'];
  assert.deepEqual(cards.map(c=>c.slug).sort(),games.slice().sort());
  const sources=cards.map(c=>c.src);
  assert.equal(new Set(sources).size,sources.length,'duplicate card art: '+sources.filter((s,i)=>sources.indexOf(s)!==i).join(', '));
  for(const c of cards)assert(fs.existsSync(path.join(root,'public',c.src)),c.slug+' image missing: '+c.src);
});
