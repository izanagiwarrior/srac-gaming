'use strict';
// Category of the best five cards. Rank/suit counts avoid enumerating 21 hands per sample.
function straight(ranks){for(let high=14;high>=5;high--){let valid=true;for(let i=0;i<5;i++)if(!ranks[high-i===1?14:high-i]){valid=false;break;}if(valid)return high;}return 0;}
function category(cards){const ranks=Array(15).fill(0),suits={s:[],h:[],d:[],c:[]};for(const c of cards){ranks[c.r]++;suits[c.s].push(c.r);}const flush=Object.values(suits).find(s=>s.length>=5);if(flush){const r=Array(15).fill(0);for(const n of flush)r[n]++;const sf=straight(r);if(sf)return sf===14?9:8;}const groups=ranks.filter(n=>n>0).sort((a,b)=>b-a);if(groups[0]===4)return 7;if(groups[0]>=3&&groups[1]>=2)return 6;if(flush)return 5;if(straight(ranks))return 4;if(groups[0]>=3)return 3;const pairs=groups.filter(n=>n>=2).length;return pairs>=2?2:pairs?1:0;}
function randomInt(n){const cutoff=4294967296-4294967296%n,buf=new Uint32Array(1);do{crypto.getRandomValues(buf);}while(buf[0]>=cutoff);return buf[0]%n;}
onmessage=event=>{const {id,hole,board}=event.data;if(hole?.length!==2||board?.length>5)return;const seen=new Set([...hole,...board].map(c=>c.r+c.s));if(seen.size!==hole.length+board.length)return;const deck=['s','h','d','c'].flatMap(s=>Array.from({length:13},(_,i)=>({r:i+2,s}))).filter(c=>!seen.has(c.r+c.s)),missing=5-board.length,counts=Array(10).fill(0);let total=0;
  const count=extra=>{counts[category([...hole,...board,...extra])]++;total++;};
  if(missing<=2){if(!missing)count([]);else if(missing===1)for(const c of deck)count([c]);else for(let i=0;i<deck.length-1;i++)for(let j=i+1;j<deck.length;j++)count([deck[i],deck[j]]);}
  else for(let sample=0;sample<10000;sample++){const copy=deck.slice(),draw=[];for(let j=0;j<missing;j++){const k=randomInt(copy.length);draw.push(copy[k]);copy[k]=copy.at(-1);copy.pop();}count(draw);}
  postMessage({id,counts,total,exact:missing<=2,missing});
};
