'use strict';
const {randomInt}=require('node:crypto');
const colors=['red','green','yellow','blue'],safe=[0,8,13,21,26,34,39,47];
const absolute=(seat,progress)=>(seat*13+progress)%52;
function destinations(r,p,index){const n=p.pawns[index],d=r.dice;if(n===56||!d)return false;if(n===-1)return d===6;if(n+d>56)return false;return true;}
function legal(r,p){return p.pawns.flatMap((_,i)=>destinations(r,p,i)?[i]:[]);}
function next(r){r.turn=(r.turn+1)%r.players.length;r.dice=null;r.sixes=0;}
function start(r){r.pawnCount=r.settings.playMode==='quick'?1:4;r.players.forEach((p,i)=>{p.hand=[];p.color=colors[i];p.pawns=Array(r.pawnCount).fill(-1);});r.turn=(r.round-1)%r.players.length;r.dice=null;r.sixes=0;r.lastMove=null;}
function act(r,p,msg){
 if(msg.type==='roll'){if(r.dice)throw Error('Pindahkan pion dahulu.');r.dice=randomInt(1,7);r.rollId=(r.rollId||0)+1;const d=r.dice;r.sixes=d===6?r.sixes+1:0;
  if(r.sixes===3){next(r);return {text:p.name+' mendapat tiga 6 berturut-turut; giliran selesai.'};}
  if(!legal(r,p).length){if(d===6)r.dice=null;else next(r);return {text:p.name+' melempar '+d+'; tidak ada langkah.'};}return {text:p.name+' melempar '+d+'.'};
 }
 if(msg.type!=='move'||!Number.isInteger(msg.pawn)||!legal(r,p).includes(msg.pawn))throw Error('Pilih pion yang bisa bergerak.');
 const d=r.dice,old=p.pawns[msg.pawn],to=old===-1?0:old+d,seat=r.players.indexOf(p);p.pawns[msg.pawn]=to;r.lastMove={playerId:p.id,pawn:msg.pawn,from:old,to,id:r.revision+1};let capture=0;
 if(to<=50&&!safe.includes(absolute(seat,to)))for(let j=0;j<r.players.length;j++)if(j!==seat)for(let k=0;k<r.players[j].pawns.length;k++){const at=r.players[j].pawns[k];if(at>=0&&at<=50&&absolute(j,at)===absolute(seat,to)){r.players[j].pawns[k]=-1;capture++;}}
 const win=p.pawns.every(n=>n===56);let text=p.name+' memindahkan pion '+(msg.pawn+1)+(capture?' · menangkap '+capture+' pion':'')+(to===56?' · masuk rumah':'')+'.';
 if(d===6||capture||to===56)r.dice=null;else next(r);
 return {text,winner:win?p:null};
}
function view(r,p,can){return {pawns:p.pawns||[],pawnCount:r.pawnCount||4,dice:r.dice,rollId:r.rollId||0,lastMove:r.lastMove,legal:can?legal(r,p):[],canRoll:can&&!r.dice};}
function bot(r,p,level){if(!r.dice)return {type:'roll'};const choices=legal(r,p);let pawn=choices[randomInt(choices.length)];if(level!=='easy'){const seat=r.players.indexOf(p),score=i=>{const to=p.pawns[i]===-1?0:p.pawns[i]+r.dice;let n=to===56?100:to+10;if(level==='hard'&&to<=50&&!safe.includes(absolute(seat,to)))for(let j=0;j<r.players.length;j++)if(j!==seat)for(const at of r.players[j].pawns)if(at>=0&&at<=50&&absolute(j,at)===absolute(seat,to))n+=80;return n;};pawn=choices.sort((a,b)=>score(b)-score(a))[0];}return {type:'move',pawn};}
const deltas=(r,w)=>r.players.map(p=>p===w?10*(r.players.length-1):-10);
module.exports={start,act,view,bot,deltas};
