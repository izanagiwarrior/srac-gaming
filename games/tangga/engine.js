'use strict';
const {randomInt}=require('node:crypto');
// Ular Tangga: 10×10 (Quick Play 6×6). Lempar dadu; tangga naik, ular turun.
// Harus tepat di kotak akhir (kelebihan angka = diam). Angka 6 memberi lemparan tambahan; 6 ketiga berturut-turut hangus.
const colors=['red','green','yellow','blue'];
const boards={
  standard:{size:10,ladders:{4:14,9:31,20:38,28:84,40:59,51:67,63:81,71:91},snakes:{17:7,54:34,62:19,64:60,87:24,93:73,95:75,99:78}},
  quick:{size:6,ladders:{3:13,8:22,15:27},snakes:{17:6,24:11,33:19,35:21}}
};
const layout=r=>boards[r.settings?.playMode==='quick'?'quick':'standard'];
const last=l=>l.size*l.size;
function start(r){
  const l=layout(r);r.size=l.size;r.ladders=l.ladders;r.snakes=l.snakes;
  r.players.forEach((p,i)=>{p.hand=[];p.pos=0;p.color=colors[i];});
  r.turn=(r.round-1)%r.players.length;r.dice=null;r.rollId=0;r.sixes=0;r.lastMove=null;
}
const next=r=>{r.turn=(r.turn+1)%r.players.length;r.sixes=0;};
function act(r,p,msg){
  if(msg.type!=='roll')throw Error('Lempar dadu untuk melangkah.');
  const d=randomInt(1,7),from=p.pos,end=last(layout(r));
  r.dice=d;r.rollId=(r.rollId||0)+1;r.sixes=d===6?r.sixes+1:0;
  let landed=from,jump=null,text=p.name+' melempar '+d;
  if(r.sixes===3){r.lastMove={playerId:p.id,from,to:from,roll:d,jump:null,id:r.revision+1};next(r);return {text:text+'; tiga 6 berturut-turut, giliran hangus.'};}
  if(from+d<=end){landed=from+d;if(r.ladders[landed]){jump='ladder';text+=' · naik tangga '+landed+'→'+r.ladders[landed];landed=r.ladders[landed];}else if(r.snakes[landed]){jump='snake';text+=' · digigit ular '+landed+'→'+r.snakes[landed];landed=r.snakes[landed];}}
  else text+='; butuh angka pas, tetap di '+from;
  p.pos=landed;r.lastMove={playerId:p.id,from,to:landed,via:from+d<=end?from+d:from,roll:d,jump,id:r.revision+1};
  if(landed===end)return {text:text+' · sampai di akhir!',winner:p};
  if(d===6)return {text:text+' · lemparan tambahan.'};
  next(r);return {text:text+'.'};
}
function view(r,p,can){
  const l=r.size?{size:r.size,ladders:r.ladders,snakes:r.snakes}:layout(r);
  return {size:l.size,ladders:l.ladders,snakes:l.snakes,dice:r.dice??null,rollId:r.rollId||0,lastMove:r.lastMove,canRoll:!!can,counts:r.players.map(x=>x.pos||0)};
}
const bot=()=>({type:'roll'});
const deltas=(r,w)=>r.players.map(p=>p===w?10*(r.players.length-1):-10);
const resultReason=()=>'Tiba tepat di kotak akhir';
module.exports={start,act,view,bot,deltas,resultReason,boards,playerView:(r,p)=>({pos:p.pos||0,color:p.color})};
