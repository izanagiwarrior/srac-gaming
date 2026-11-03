'use strict';
const {randomInt}=require('node:crypto');
// Dam (Checkers): 8×8, Quick Play 6×6. Merah (+1) mulai dari bawah, Putih (−1) dari atas.
// Wajib makan, lompatan beruntun, bidak biasa hanya makan ke depan, Raja bergerak satu petak.
const sizeFor=r=>r.settings?.playMode==='quick'?6:8;
const sign=v=>v>0?1:v<0?-1:0,isKing=v=>Math.abs(v)===2;
function initial(n){const b=Array(n*n).fill(0),k=n===6?2:3;for(let r=0;r<n;r++)for(let c=0;c<n;c++)if((r+c)%2===1){if(r<k)b[r*n+c]=-1;else if(r>=n-k)b[r*n+c]=1;}return b;}
const steps=v=>isKing(v)?[[-1,-1],[-1,1],[1,-1],[1,1]]:[[sign(v)>0?-1:1,-1],[sign(v)>0?-1:1,1]];
// Setiap langkah tunggal; lompatan menggantikan langkah biasa. `chain` mengunci bidak yang sedang lompat beruntun.
function gen(b,n,side,chain=null){
  const jumps=[],plain=[];
  for(let i=0;i<b.length;i++){
    const v=b[i];if(sign(v)!==side||chain!==null&&i!==chain)continue;
    const r=Math.floor(i/n),c=i%n;
    for(const [dr,dc]of steps(v)){
      const r1=r+dr,c1=c+dc;if(r1<0||r1>=n||c1<0||c1>=n)continue;
      const j=r1*n+c1;
      if(b[j]===0){plain.push({from:i,to:j,cap:-1});continue;}
      if(sign(b[j])===-side){const r2=r1+dr,c2=c1+dc;if(r2>=0&&r2<n&&c2>=0&&c2<n&&b[r2*n+c2]===0)jumps.push({from:i,to:r2*n+c2,cap:j});}
    }
  }
  return jumps.length?jumps:chain!==null?[]:plain;
}
function apply(b,n,m){
  const next=b.slice(),v=next[m.from],side=sign(v);
  next[m.from]=0;if(m.cap>=0)next[m.cap]=0;
  const row=Math.floor(m.to/n);let piece=v,promoted=false;
  if(!isKing(v)&&(side>0&&row===0||side<0&&row===n-1)){piece=side*2;promoted=true;}
  next[m.to]=piece;
  return {board:next,promoted,more:m.cap>=0&&!promoted&&gen(next,n,side,m.to).length>0};
}
function start(r){
  r.size=sizeFor(r);r.board=initial(r.size);r.turn=0;r.chain=null;r.quiet=0;r.lastMove=null;
  r.players.forEach((p,i)=>{p.hand=[];p.side=i===0?1:-1;});
}
function act(r,p,msg){
  if(msg.type!=='move')throw Error('Pilih bidak lalu petak tujuan.');
  const list=gen(r.board,r.size,p.side,r.chain),m=list.find(x=>x.from===msg.from&&x.to===msg.to);
  if(!m)throw Error(list.some(x=>x.cap>=0)?'Wajib makan: pilih langkah yang menangkap.':'Langkah tidak sah.');
  const wasKing=isKing(r.board[m.from]),res=apply(r.board,r.size,m);
  r.board=res.board;r.lastMove={from:m.from,to:m.to,cap:m.cap,king:res.promoted,id:r.revision+1};
  r.quiet=m.cap>=0||!wasKing?0:(r.quiet||0)+1;
  const text=p.name+(m.cap>=0?' memakan satu bidak':' melangkah')+(res.promoted?' dan menjadi Raja':'')+'.';
  if(res.more){r.chain=m.to;return {text:text+' Wajib lanjut makan.'};}
  r.chain=null;r.turn=1-r.turn;
  if(!gen(r.board,r.size,-p.side).length)return {text:text+' Lawan tidak bisa bergerak.',winner:p};
  if(r.quiet>=80)return {text:text+' 40 langkah penuh tanpa tangkapan atau bidak biasa; seri.',finished:true,winners:r.players};
  return {text};
}
function view(r,p,can){
  const n=r.size||sizeFor(r),board=r.board?.length?r.board:initial(n),side=p.side??(p.spectator?0:r.players.indexOf(p)===0?1:-1);
  const legal=can?gen(board,n,side,r.chain??null):[];
  return {board,size:n,side,legal,mandatory:legal.some(m=>m.cap>=0),chain:r.chain??null,counts:[1,-1].map(s=>board.filter(v=>sign(v)===s).length),lastMove:r.lastMove};
}
function evaluate(b,n,side){
  let t=0;
  for(let i=0;i<b.length;i++){const v=b[i];if(!v)continue;const s=sign(v),r=Math.floor(i/n),c=i%n,adv=s>0?n-1-r:r;let w=isKing(v)?190:100+adv*4;if(c===0||c===n-1)w+=3;t+=s*side*w;}
  return t;
}
// Negamax dengan batas simpul; `more` menjaga lompatan beruntun tetap milik pemain yang sama.
function search(b,n,side,chain,depth,box){
  const ms=gen(b,n,side,chain);
  if(!ms.length)return -10000-depth;
  if(depth===0||++box.nodes>1500)return evaluate(b,n,side);
  let best=-Infinity;
  for(const m of ms){const a=apply(b,n,m),s=a.more?search(a.board,n,side,m.to,depth-1,box):-search(a.board,n,-side,null,depth-1,box);if(s>best)best=s;}
  return best;
}
function bot(r,p,level){
  const ms=gen(r.board,r.size,p.side,r.chain);
  if(level==='easy'){const m=ms[randomInt(ms.length)];return {type:'move',from:m.from,to:m.to};}
  const depth=level==='hard'?4:2,box={nodes:0};let best=-Infinity,chosen=[];
  for(const m of ms){const a=apply(r.board,r.size,m),s=a.more?search(a.board,r.size,p.side,m.to,depth-1,box):-search(a.board,r.size,-p.side,null,depth-1,box);if(s>best){best=s;chosen=[m];}else if(s===best)chosen.push(m);}
  const m=chosen[randomInt(chosen.length)];
  return {type:'move',from:m.from,to:m.to};
}
const deltas=(r,w)=>Array.isArray(w)?r.players.map(()=>0):r.players.map(p=>p===w?10:-10);
const resultReason=r=>r.quiet>=80?'40 langkah tanpa tangkapan atau bidak biasa; seri':'Lawan kehabisan bidak atau langkah';
module.exports={start,act,view,bot,deltas,resultReason,gen,apply,initial,playerView:(r,p)=>({side:p.side??(r.players.indexOf(p)===0?1:-1)})};
