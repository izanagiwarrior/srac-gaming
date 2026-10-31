'use strict';
const {randomInt}=require('node:crypto');
const colors=['red','yellow','green','blue'];
const value=c=>['wild','draw4'].includes(c.value)?50:['skip','reverse','draw2'].includes(c.value)?20:Number(c.value);
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function deck(){let id=0,a=[];for(const color of colors)for(let n=0;n<=12;n++)for(let k=0;k<(n===0?1:2);k++)a.push({id:String(id++),color,value:n<10?String(n):['skip','reverse','draw2'][n-10]});for(const v of ['wild','draw4'])for(let k=0;k<4;k++)a.push({id:String(id++),color:'wild',value:v});return shuffle(a);}
function take(r,p,n){for(let i=0;i<n;i++){if(!r.stock.length&&r.discard.length>1){const top=r.discard.pop();r.stock=shuffle(r.discard);r.discard=[top];}if(!r.stock.length)break;p.hand.push(r.stock.pop());}}
function next(r,n=1){r.turn=(r.turn+r.direction*n+r.players.length*n)%r.players.length;r.drawn=null;}
function legal(r,p){const top=r.discard.at(-1);return p.hand.filter(c=>(!r.drawn||c.id===r.drawn)&&(c.value==='draw4'?!p.hand.some(x=>x.color===r.color):c.color==='wild'||c.color===r.color||c.value===top.value)).map(c=>c.id);}
function start(r){r.stock=deck();r.discard=[];r.direction=1;r.drawn=null;for(const p of r.players){p.hand=[];take(r,p,7);}let at=r.stock.findIndex(c=>c.color!=='wild'&&/^\d$/.test(c.value));const first=r.stock.splice(at,1)[0];r.discard=[first];r.color=first.color;r.turn=(r.round-1)%r.players.length;}
function act(r,p,msg){
 if(msg.type==='draw'){if(r.drawn)throw Error('Kartu sudah diambil. Mainkan kartu itu atau lewat.');const before=p.hand.length;take(r,p,1);if(p.hand.length===before){next(r);return {text:p.name+' lewat; stok kosong.'};}r.drawn=p.hand.at(-1).id;if(!legal(r,p).length)next(r);return {text:p.name+' mengambil satu kartu.'};}
 if(msg.type==='pass'){if(!r.drawn)throw Error('Ambil satu kartu dahulu.');next(r);return {text:p.name+' menyimpan kartu dan lewat.'};}
 if(msg.type!=='play')throw Error('Pilih kartu atau ambil.');
 const i=p.hand.findIndex(c=>c.id===msg.id),card=p.hand[i];if(!card||!legal(r,p).includes(card.id))throw Error('Kartu tidak cocok warna/angka/simbol, atau +4 masih terlarang.');
 if(card.color==='wild'&&!colors.includes(msg.color))throw Error('Pilih warna berikutnya.');
 p.hand.splice(i,1);r.discard.push(card);r.color=card.color==='wild'?msg.color:card.color;
 let text=p.name+' memainkan '+card.value+'.';
 if(card.value==='reverse'){r.direction*=-1;next(r,r.players.length===2?2:1);}
 else if(card.value==='skip')next(r,2);
 else if(['draw2','draw4'].includes(card.value)){next(r);const victim=r.players[r.turn],n=card.value==='draw2'?2:4;take(r,victim,n);text+=' '+victim.name+' ambil '+n+' dan dilewati.';next(r);}
 else next(r);
 if(p.hand.length===1)text+=' UNO!';
 return {text,winner:p.hand.length===0?p:null};
}
function view(r,p,can){return {hand:p.hand,top:r.discard?.at(-1)||null,color:r.color,direction:r.direction,stock:r.stock.length,legal:can?legal(r,p):[],drawn:can?r.drawn:null};}
function bot(r,p,level){const moves=legal(r,p).map(id=>p.hand.find(c=>c.id===id));if(!moves.length)return {type:r.drawn?'pass':'draw'};let card=moves[randomInt(moves.length)];if(level!=='easy'){const count=color=>p.hand.filter(c=>c.color===color).length;const score=c=>value(c)+(c.color==='wild'?-35:count(c.color)*(level==='hard'?5:1));card=moves.sort((a,b)=>score(b)-score(a))[0];}const color=colors.slice().sort((a,b)=>p.hand.filter(c=>c.color===b).length-p.hand.filter(c=>c.color===a).length)[0];return {type:'play',id:card.id,color};}
function deltas(r,w){return r.players.map(p=>p===w?r.players.filter(x=>x!==w).reduce((n,x)=>n+x.hand.reduce((s,c)=>s+value(c),0),0):-p.hand.reduce((n,c)=>n+value(c),0));}
module.exports={start,act,view,bot,deltas};
