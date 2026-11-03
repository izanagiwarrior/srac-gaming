'use strict';
const {randomInt}=require('node:crypto');
// Empat Berturut: 7×6 (Quick Play 6×5). Jatuhkan keping ke kolom; empat berurutan menang.
const dims=r=>r.settings?.playMode==='quick'?{cols:6,rows:5}:{cols:7,rows:6};
const dirs=[[0,1],[1,0],[1,1],[1,-1]];
function drop(b,cols,rows,col){
  if(!Number.isInteger(col)||col<0||col>=cols)return -1;
  for(let r=rows-1;r>=0;r--)if(!b[r*cols+col])return r*cols+col;
  return -1;
}
function line(b,cols,rows,at,side){
  const r0=Math.floor(at/cols),c0=at%cols;
  for(const [dr,dc]of dirs){
    const cells=[at];
    for(const k of [1,-1]){let r=r0+dr*k,c=c0+dc*k;while(r>=0&&r<rows&&c>=0&&c<cols&&b[r*cols+c]===side){cells.push(r*cols+c);r+=dr*k;c+=dc*k;}}
    if(cells.length>=4)return cells;
  }
  return null;
}
const legalCols=(b,cols)=>Array.from({length:cols},(_,c)=>c).filter(c=>!b[c]);
function start(r){
  const {cols,rows}=dims(r);
  r.cols=cols;r.rows=rows;r.board=Array(cols*rows).fill(0);r.turn=0;r.lastMove=null;r.winLine=null;
  r.players.forEach((p,i)=>{p.hand=[];p.side=i===0?1:-1;});
}
function act(r,p,msg){
  if(msg.type!=='place')throw Error('Pilih kolom untuk menjatuhkan keping.');
  const at=drop(r.board,r.cols,r.rows,msg.at);
  if(at<0)throw Error('Kolom penuh atau tidak valid.');
  r.board[at]=p.side;r.lastMove={at,col:at%r.cols,id:r.revision+1};
  const cells=line(r.board,r.cols,r.rows,at,p.side);
  if(cells){r.winLine=cells;return {text:p.name+' menyusun empat berturut-turut!',winner:p};}
  if(!legalCols(r.board,r.cols).length)return {text:'Papan penuh; seri.',finished:true,winners:r.players};
  r.turn=1-r.turn;
  return {text:p.name+' menjatuhkan keping di kolom '+(at%r.cols+1)+'.'};
}
function view(r,p,can){
  const {cols,rows}=r.cols?{cols:r.cols,rows:r.rows}:dims(r),board=r.board?.length?r.board:Array(cols*rows).fill(0);
  const side=p.side??(p.spectator?0:r.players.indexOf(p)===0?1:-1);
  return {board,cols,rows,side,legal:can?legalCols(board,cols):[],counts:[1,-1].map(s=>board.filter(v=>v===s).length),lastMove:r.lastMove,winLine:r.winLine||null};
}
// Heuristik jendela empat petak: lebih banyak keping tanpa gangguan lawan = lebih baik.
function windows(cols,rows){
  const out=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)for(const [dr,dc]of dirs){
    const er=r+dr*3,ec=c+dc*3;if(er<0||er>=rows||ec<0||ec>=cols)continue;
    out.push([0,1,2,3].map(k=>(r+dr*k)*cols+c+dc*k));
  }
  return out;
}
const cache=new Map();
const windowsFor=(cols,rows)=>{const key=cols+'x'+rows;if(!cache.has(key))cache.set(key,windows(cols,rows));return cache.get(key);};
function evaluate(b,cols,rows,side){
  let t=0;const weight=[0,1,6,40];
  for(const w of windowsFor(cols,rows)){let m=0,o=0;for(const i of w){if(b[i]===side)m++;else if(b[i]===-side)o++;}if(m&&!o)t+=weight[m];else if(o&&!m)t-=weight[o]*1.1;}
  const mid=(cols-1)/2;
  for(let i=0;i<b.length;i++)if(b[i])t+=b[i]*side*(3-Math.abs(i%cols-mid));
  return t;
}
function order(cols){const mid=(cols-1)/2;return Array.from({length:cols},(_,c)=>c).sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid));}
function negamax(b,cols,rows,side,depth,alpha,beta,box){
  let any=false;
  for(const c of order(cols)){
    const at=drop(b,cols,rows,c);if(at<0)continue;any=true;
    b[at]=side;
    let s;
    if(line(b,cols,rows,at,side))s=100000+depth;
    else if(depth===0||++box.nodes>20000)s=evaluate(b,cols,rows,side);
    else s=-negamax(b,cols,rows,-side,depth-1,-beta,-alpha,box);
    b[at]=0;
    if(s>alpha)alpha=s;if(alpha>=beta)break;
  }
  return any?alpha:0;
}
function bot(r,p,level){
  const cols=r.cols,rows=r.rows,b=r.board.slice(),side=p.side,moves=legalCols(b,cols);
  const wins=s=>moves.find(c=>{const at=drop(b,cols,rows,c);b[at]=s;const w=!!line(b,cols,rows,at,s);b[at]=0;return w;});
  if(level==='easy'){const w=wins(side);return {type:'place',at:w!==undefined&&randomInt(2)?w:moves[randomInt(moves.length)]};}
  const w=wins(side);if(w!==undefined)return {type:'place',at:w};
  const block=wins(-side);if(block!==undefined)return {type:'place',at:block};
  const depth=level==='hard'?6:3,box={nodes:0};let best=-Infinity,chosen=[];
  for(const c of order(cols)){
    if(!moves.includes(c))continue;
    const at=drop(b,cols,rows,c);b[at]=side;const s=-negamax(b,cols,rows,-side,depth-1,-Infinity,Infinity,box);b[at]=0;
    if(s>best){best=s;chosen=[c];}else if(s===best)chosen.push(c);
  }
  return {type:'place',at:chosen[randomInt(chosen.length)]};
}
const deltas=(r,w)=>Array.isArray(w)?r.players.map(()=>0):r.players.map(p=>p===w?10:-10);
const resultReason=r=>r.winLine?'Empat keping berurutan':'Papan penuh; seri';
module.exports={start,act,view,bot,deltas,resultReason,drop,line,playerView:(r,p)=>({side:p.side??(r.players.indexOf(p)===0?1:-1)})};
