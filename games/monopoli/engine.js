'use strict';
const {randomInt}=require('node:crypto');
const property=(name,price,rent,group,build)=>({name,kind:'property',price:price*1000,rents:[rent,rent*5,rent*15,rent*45,rent*70,rent*100].map(n=>n*1000),group,build:build*1000});
const station=name=>({name,kind:'station',price:200000}),utility=name=>({name,kind:'utility',price:150000});
const BOARD=[{name:'Mulai',kind:'go'},property('Sabang',60,2,'brown',50),{name:'Dana Kampung',kind:'chest'},property('Banda Aceh',60,4,'brown',50),{name:'Pajak Penghasilan',kind:'tax',amount:200000},station('Stasiun Gambir'),property('Medan',100,6,'cyan',50),{name:'Kabar Nusantara',kind:'chance'},property('Padang',100,6,'cyan',50),property('Pekanbaru',120,8,'cyan',50),{name:'Rumah Tahanan',kind:'jail'},property('Palembang',140,10,'purple',100),utility('PLN'),property('Bandar Lampung',140,10,'purple',100),property('Bengkulu',160,12,'purple',100),station('Stasiun Tugu'),property('Jakarta',180,14,'orange',100),{name:'Dana Kampung',kind:'chest'},property('Bandung',180,14,'orange',100),property('Bogor',200,16,'orange',100),{name:'Warung Kopi',kind:'park'},property('Semarang',220,18,'red',150),{name:'Kabar Nusantara',kind:'chance'},property('Solo',220,18,'red',150),property('Yogyakarta',240,20,'red',150),station('Stasiun Gubeng'),property('Surabaya',260,22,'yellow',150),property('Malang',260,22,'yellow',150),utility('PDAM'),property('Denpasar',280,24,'yellow',150),{name:'Kena Tilang!',kind:'gojail'},property('Mataram',300,26,'green',200),property('Makassar',300,26,'green',200),{name:'Dana Kampung',kind:'chest'},property('Manado',320,28,'green',200),station('Stasiun Kiaracondong'),{name:'Kabar Nusantara',kind:'chance'},property('Balikpapan',350,35,'blue',200),{name:'Pajak Mewah',kind:'tax',amount:100000},property('Jayapura',400,50,'blue',200)];
const tokens=['🛵','🛺','🚲','🚌','🚕','⛵'];
const alive=r=>r.players.filter(p=>!p.bankrupt),owner=(r,a)=>r.players.find(p=>p.id===a.owner),group=(r,id)=>r.assets.filter(a=>BOARD[a.at].group&&BOARD[a.at].group===BOARD[id].group);
const worth=(r,p)=>p.cash+r.assets.filter(a=>a.owner===p.id).reduce((n,a)=>n+BOARD[a.at].price*(a.mortgaged?.5:1)+(BOARD[a.at].build||0)*a.buildings,0);
const supply=r=>({houses:32-r.assets.reduce((n,a)=>n+(a.buildings<5?a.buildings:0),0),hotels:12-r.assets.filter(a=>a.buildings===5).length});
function next(r){do{r.turn=(r.turn+1)%r.players.length;}while(r.players[r.turn].bankrupt);r.stage='roll';r.doubles=0;r.debt=null;r.auction=null;r.trade=null;}
function ending(r){const live=alive(r);if(live.length===1)return {finished:true,winners:live};if(r.settings.playMode==='quick'&&live.every(p=>(r.turnCounts?.[p.id]||0)>=8)){const max=Math.max(...live.map(p=>worth(r,p)));return {finished:true,winners:live.filter(p=>worth(r,p)===max)};}return {};}
function jail(r,p){p.position=10;p.jail=3;r.doubles=0;r.stage='end';r.lastCard='Kena tilang. Istirahat di tahanan!';}
function pay(r,p,amount,creditor=null,after=null){if(amount<=p.cash){p.cash-=amount;const q=r.players.find(x=>x.id===creditor);if(q)q.cash+=amount;return true;}r.stage='debt';r.debt={amount,creditor,after};return false;}
function move(r,p,steps){const from=p.position,to=(from+steps+40)%40;if(steps>0&&from+steps>=40)p.cash+=200000;p.position=to;r.lastMove={playerId:p.id,from,to,steps,id:r.revision+1};}
function rent(r,a,dice){const tile=BOARD[a.at];if(a.mortgaged)return 0;if(tile.kind==='station')return 25000*2**(r.assets.filter(x=>x.owner===a.owner&&BOARD[x.at].kind==='station'&&!x.mortgaged).length-1);if(tile.kind==='utility')return dice*1000*(r.assets.filter(x=>x.owner===a.owner&&BOARD[x.at].kind==='utility'&&!x.mortgaged).length===2?10:4);return a.buildings?tile.rents[a.buildings]:tile.rents[0]*(group(r,a.at).every(x=>x.owner===a.owner&&!x.mortgaged)?2:1);}
function card(r,p,depth){const i=randomInt(8);if(i===0){p.cash+=100000;r.lastCard='Dagangan laris! Terima Rp100.000.';}else if(i===1){r.lastCard='Servis kendaraan: bayar Rp50.000.';pay(r,p,50000);}else if(i===2){r.lastCard='Pulang kampung lewat Mulai. Terima Rp200.000.';p.position=0;p.cash+=200000;}else if(i===3){jail(r,p);}else if(i===4){r.lastCard='Bonus gotong royong Rp50.000.';p.cash+=50000;}else if(i===5){const amount=r.assets.filter(a=>a.owner===p.id).reduce((n,a)=>n+(a.buildings===5?100000:a.buildings*25000),0);r.lastCard='Renovasi kampung: Rp'+amount.toLocaleString('id-ID')+'.';pay(r,p,amount);}else if(i===6&&depth<2){r.lastCard='Macet! Mundur tiga petak.';move(r,p,-3);land(r,p,depth+1);}else{p.cash+=25000;r.lastCard='Menang lomba tujuh belasan! Rp25.000.';}}
function land(r,p,depth=0){r.stage='end';const tile=BOARD[p.position],a=r.assets[p.position];r.lastCard=p.name+' tiba di '+tile.name+'.';if(tile.price){if(!a.owner)r.stage='buy';else if(a.owner!==p.id)pay(r,p,rent(r,a,r.dice.reduce((n,x)=>n+x,0)),a.owner);}else if(tile.kind==='tax')pay(r,p,tile.amount);else if(tile.kind==='gojail')jail(r,p);else if(['chest','chance'].includes(tile.kind))card(r,p,depth);}
function start(r){r.assets=BOARD.map((_,at)=>({at,owner:null,buildings:0,mortgaged:false}));r.players.forEach((p,i)=>{p.hand=[];p.cash=1500000;p.position=0;p.jail=0;p.bankrupt=false;p.tokenIcon=tokens[i];});r.turn=(r.round-1)%r.players.length;r.stage='roll';r.doubles=0;r.dice=[1,1];r.rollId=0;r.turns=0;r.turnCounts=Object.fromEntries(r.players.map(p=>[p.id,0]));r.debt=null;r.auction=null;r.trade=null;r.tradeOfferTurns={};r.lastMove=null;r.lastBuild=null;r.lastCard='Selamat datang di Nusantara!';}
function canBuild(r,p,id){const t=BOARD[id],a=r.assets[id];if(!t||t.kind!=='property'||a.owner!==p.id||a.mortgaged||a.buildings>=5||p.cash<t.build)return false;const all=group(r,id),stock=supply(r);return all.every(x=>x.owner===p.id&&!x.mortgaged)&&a.buildings===Math.min(...all.map(x=>x.buildings))&&(a.buildings===4?stock.hotels>0:stock.houses>0);}
function canSell(r,p,id){const a=r.assets[id],t=BOARD[id];return !!a&&a.owner===p.id&&a.buildings>0&&a.buildings===Math.max(...group(r,id).map(x=>x.buildings))&&(a.buildings!==5||supply(r).houses>=4);}
function canMortgage(r,p,id){const a=r.assets[id];return !!a&&!!BOARD[id].price&&a.owner===p.id&&!a.mortgaged&&!group(r,id).some(x=>x.buildings);}
function auctionNext(r){const a=r.auction,eligible=r.players.filter(p=>!p.bankrupt&&!a.passed.includes(p.id)&&p.id!==a.leader&&p.cash>=a.bid+10000);if(!eligible.length){if(a.leader){r.assets[a.at].owner=a.leader;r.players.find(p=>p.id===a.leader).cash-=a.bid;r.lastCard='Lelang '+BOARD[a.at].name+' laku Rp'+a.bid.toLocaleString('id-ID')+'.';}else r.lastCard='Tidak ada penawar. Properti tetap di bank.';r.turn=a.mover;r.auction=null;r.stage='end';return;}for(let step=1;step<=r.players.length;step++){const i=(r.turn+step)%r.players.length;if(eligible.includes(r.players[i])){r.turn=i;break;}}}
function tradeAllowed(r,p,a){return a&&a.owner===p.id&&!group(r,a.at).some(x=>x.buildings);}
function act(r,p,msg){
 const basic=text=>({text,...ending(r)}),id=msg.asset;
 if(r.trade){const t=r.trade;if(msg.type==='cancelTrade'||msg.type==='end'){r.trade=null;return basic(p.name+' membatalkan tawaran.');}if(msg.type!=='tradeReply')throw Error('Jawab tawaran terlebih dahulu.');if(msg.accept===true){const from=r.players.find(x=>x.id===t.from),to=p,a=t.giveAsset===null?null:r.assets[t.giveAsset],b=t.takeAsset===null?null:r.assets[t.takeAsset];if(from.cash<t.giveCash||to.cash<t.takeCash||a&&!tradeAllowed(r,from,a)||b&&!tradeAllowed(r,to,b))throw Error('Aset atau kas berubah. Tolak tawaran ini.');from.cash+=t.takeCash-t.giveCash;to.cash+=t.giveCash-t.takeCash;if(a)a.owner=to.id;if(b)b.owner=from.id;}r.trade=null;return basic(p.name+(msg.accept===true?' menerima':' menolak')+' barter.');}
 if(r.stage==='auction'){if(msg.type==='bid'){const bid=msg.amount;if(!Number.isSafeInteger(bid)||bid<r.auction.bid+10000||bid>p.cash)throw Error('Tawaran minimal naik Rp10.000 dan tidak melebihi kas.');r.auction.bid=bid;r.auction.leader=p.id;}else if(msg.type==='auctionPass')r.auction.passed.push(p.id);else throw Error('Tawar atau lewat lelang.');auctionNext(r);return basic(p.name+(msg.type==='bid'?' menawar Rp'+msg.amount.toLocaleString('id-ID'):' lewat lelang')+'.');}
 if(msg.type==='mortgage'){if(!canMortgage(r,p,id))throw Error('Jual semua bangunan di kelompok ini dahulu.');r.assets[id].mortgaged=true;p.cash+=BOARD[id].price/2;return basic(p.name+' menghipotek '+BOARD[id].name+'.');}
 if(msg.type==='sell'){if(!canSell(r,p,id))throw Error('Jual bangunan secara merata; bank perlu empat rumah untuk mengganti hotel.');r.assets[id].buildings--;p.cash+=BOARD[id].build/2;return basic(p.name+' menjual bangunan '+BOARD[id].name+'.');}
 if(r.stage==='debt'){
  if(msg.type==='pay'){const d=r.debt;if(p.cash<d.amount)throw Error('Kas belum cukup. Jual bangunan atau hipotek.');p.cash-=d.amount;const q=r.players.find(x=>x.id===d.creditor);if(q)q.cash+=d.amount;r.debt=null;r.stage='end';if(d.after?.move){move(r,p,d.after.move);land(r,p);}return basic(p.name+' melunasi kewajiban.');}
  if(msg.type==='bankrupt'){const creditor=r.players.find(x=>x.id===r.debt.creditor);if(creditor)creditor.cash+=p.cash;p.cash=0;p.bankrupt=true;for(const a of r.assets.filter(a=>a.owner===p.id)){a.owner=creditor?.id||null;a.buildings=0;if(!creditor)a.mortgaged=false;}r.debt=null;const end=ending(r);if(!end.finished)next(r);return {text:p.name+' bangkrut.',...end};}throw Error('Lunasi kewajiban atau nyatakan bangkrut.');
 }
 if(msg.type==='build'){if(!canBuild(r,p,id))throw Error('Butuh satu kelompok lengkap, kas dan stok bangunan; bangun merata.');p.cash-=BOARD[id].build;r.assets[id].buildings++;r.lastBuild={at:id,id:r.revision+1};return basic(p.name+' membangun di '+BOARD[id].name+'.');}
 if(msg.type==='redeem'){const a=r.assets[id],cost=Math.round((BOARD[id]?.price||0)*55/100);if(!a||a.owner!==p.id||!a.mortgaged||p.cash<cost)throw Error('Hipotek tidak bisa ditebus.');p.cash-=cost;a.mortgaged=false;return basic(p.name+' menebus '+BOARD[id].name+'.');}
 if(msg.type==='trade'){
  if(!['roll','end'].includes(r.stage))throw Error('Selesaikan aksi petak dahulu.');const to=r.players.find(x=>x.id===msg.target&&!x.bankrupt&&x!==p),ga=msg.giveAsset===null?null:r.assets[msg.giveAsset],ta=msg.takeAsset===null?null:r.assets[msg.takeAsset],gc=msg.giveCash,tc=msg.takeCash;
  if(!to||msg.giveAsset!==null&&!tradeAllowed(r,p,ga)||msg.takeAsset!==null&&!tradeAllowed(r,to,ta)||!Number.isSafeInteger(gc)||!Number.isSafeInteger(tc)||gc<0||tc<0||gc>p.cash||tc>to.cash||!ga&&!ta&&gc===tc)throw Error('Pilih barter sah dengan aset tanpa bangunan dan kas yang tersedia.');r.trade={from:p.id,target:to.id,giveAsset:ga?.at??null,takeAsset:ta?.at??null,giveCash:gc,takeCash:tc};r.tradeOfferTurns||={};r.tradeOfferTurns[p.id]=r.turns;return basic(p.name+' mengirim tawaran barter ke '+to.name+'.');
 }
 if(r.stage==='buy'){if(msg.type==='buy'){const t=BOARD[p.position];if(p.cash<t.price)throw Error('Kas tidak cukup. Pilih lelang.');p.cash-=t.price;r.assets[p.position].owner=p.id;r.stage='end';return basic(p.name+' membeli '+t.name+'.');}if(msg.type==='auction'){r.auction={at:p.position,mover:r.turn,bid:0,leader:null,passed:[]};r.stage='auction';r.turn=(r.turn+r.players.length-1)%r.players.length;auctionNext(r);return basic('Lelang '+BOARD[p.position].name+' dibuka.');}throw Error('Beli properti atau buka lelang.');}
 if(msg.type==='bail'){if(r.stage!=='roll'||!p.jail)throw Error('Tidak sedang ditahan.');if(p.cash<50000)throw Error('Kas perlu Rp50.000.');p.cash-=50000;p.jail=0;return basic(p.name+' membayar jaminan.');}
 if(msg.type==='roll'){if(r.stage!=='roll')throw Error('Selesaikan giliran terlebih dahulu.');r.dice=[randomInt(1,7),randomInt(1,7)];r.rollId++;const sum=r.dice[0]+r.dice[1],double=r.dice[0]===r.dice[1];if(p.jail){p.jail--;if(double){p.jail=0;r.doubles=0;}else if(p.jail===0){if(!pay(r,p,50000,null,{move:sum}))return basic(p.name+' wajib membayar jaminan sebelum bergerak.');}else{r.stage='end';r.doubles=0;return basic(p.name+' belum mendapat dadu kembar.');}}else r.doubles=double?r.doubles+1:0;if(r.doubles===3){jail(r,p);return basic(p.name+' tiga kali kembar, kena tilang!');}move(r,p,sum);land(r,p);return basic(p.name+' naik '+p.tokenIcon+' ke '+BOARD[p.position].name+'.');}
 if(msg.type==='end'){if(r.stage!=='end')throw Error('Selesaikan aksi sebelum mengakhiri giliran.');if(r.doubles>0&&!p.jail){r.stage='roll';return basic(p.name+' mendapat lemparan tambahan.');}r.turns++;r.turnCounts[p.id]=(r.turnCounts[p.id]||0)+1;const end=ending(r);if(!end.finished)next(r);return {text:p.name+' menyelesaikan giliran.',...end};}
 throw Error('Aksi tidak dikenal.');
}
function canAct(r,p,msg){if(p.bankrupt)return false;if(r.trade)return msg.type==='tradeReply'?p.id===r.trade.target:p.id===r.trade.from&&['cancelTrade','end'].includes(msg.type);return r.players[r.turn]===p;}
const actor=r=>r.trade?r.players.find(p=>p.id===r.trade.target):r.players[r.turn];
function view(r,p,can){return {board:BOARD,assets:r.assets||[],stage:r.stage||'roll',dice:r.dice||[1,1],rollId:r.rollId||0,turns:r.turns||0,lastMove:r.lastMove,lastBuild:r.lastBuild,lastCard:r.lastCard||'Keliling Indonesia!',auction:r.auction,trade:r.trade,debt:r.players[r.turn]===p?r.debt:null,stock:r.assets?supply(r):{houses:32,hotels:12},manage:can?{build:r.assets.filter(a=>canBuild(r,p,a.at)).map(a=>a.at),sell:r.assets.filter(a=>canSell(r,p,a.at)).map(a=>a.at),mortgage:r.assets.filter(a=>canMortgage(r,p,a.at)).map(a=>a.at)}:{build:[],sell:[],mortgage:[]}};}
// Bot valuations use only public ownership, mortgages and cash, never dice or future cards.
function portfolio(r,p,offer=null){
 const held=a=>offer&&a.at===offer.giveAsset?offer.target:offer&&a.at===offer.takeAsset?offer.from:a.owner;
 let value=p.cash;
 if(offer)value+=p.id===offer.from?offer.takeCash-offer.giveCash:offer.giveCash-offer.takeCash;
 for(const a of r.assets)if(held(a)===p.id)value+=(BOARD[a.at].price||0)*(a.mortgaged?.5:1);
 for(const name of new Set(BOARD.map(t=>t.group).filter(Boolean))){const set=r.assets.filter(a=>BOARD[a.at].group===name);if(set.every(a=>held(a)===p.id&&!a.mortgaged))value+=set.reduce((n,a)=>n+BOARD[a.at].price,0)*1.5;}
 return value;
}
function offerTrade(r,p,level,reserve){
 if(r.tradeOfferTurns?.[p.id]===r.turns)return null;
 let best=null,bestGain=0;
 for(const take of r.assets){
  const tile=BOARD[take.at],to=owner(r,take),set=group(r,take.at);
  if(tile.kind!=='property'||!to||to===p||to.bankrupt||take.mortgaged||!tradeAllowed(r,to,take)||set.filter(a=>a.owner===p.id).length!==set.length-1)continue;
  const options=[null,...(level==='easy'?[]:r.assets.filter(a=>a.owner===p.id&&!a.mortgaged&&tradeAllowed(r,p,a)&&!group(r,a.at).every(x=>x.owner===p.id)))];
  for(const give of options){
   const giveCash=Math.max(0,Math.ceil((tile.price*(give?1.25:1.5)-(give?BOARD[give.at].price:0))/1000)*1000);
   if(p.cash-giveCash<reserve)continue;
   const offer={from:p.id,target:to.id,giveAsset:give?.at??null,takeAsset:take.at,giveCash,takeCash:0};
   const gain=portfolio(r,p,offer)-portfolio(r,p),theirs=portfolio(r,to,offer)-portfolio(r,to);
   if(gain>bestGain&&theirs>=0){bestGain=gain;best={type:'trade',target:to.id,giveAsset:offer.giveAsset,takeAsset:offer.takeAsset,giveCash,takeCash:0};}
  }
 }
 return best;
}
function bot(r,p,level){
 if(r.trade)return {type:'tradeReply',accept:level==='easy'?randomInt(2)===0:portfolio(r,p,r.trade)>=portfolio(r,p)};
 if(r.stage==='auction'){const at=r.auction.at,cap=Math.min(p.cash-(level==='hard'?100000:50000),BOARD[at].price*(level==='easy'?.65:level==='hard'?1.15:1));return r.auction.bid+10000<=cap?{type:'bid',amount:r.auction.bid+10000}:{type:'auctionPass'};}
 if(r.stage==='debt'){if(p.cash>=r.debt.amount)return {type:'pay'};const sell=r.assets.find(a=>canSell(r,p,a.at));if(sell)return {type:'sell',asset:sell.at};const mortgage=r.assets.find(a=>canMortgage(r,p,a.at));return mortgage?{type:'mortgage',asset:mortgage.at}:{type:'bankrupt'};}
 if(r.stage==='buy')return p.cash-BOARD[p.position].price>50000&&(level!=='easy'||randomInt(3)!==0)?{type:'buy'}:{type:'auction'};
 if(r.stage==='roll')return {type:'roll'};
 const reserve=level==='easy'?350000:level==='hard'?150000:250000;
 const redeem=r.assets.find(a=>a.owner===p.id&&a.mortgaged&&group(r,a.at).every(x=>x.owner===p.id)&&p.cash-Math.round(BOARD[a.at].price*.55)>=reserve);
 if(redeem)return {type:'redeem',asset:redeem.at};
 const build=r.assets.find(a=>canBuild(r,p,a.at)&&p.cash-BOARD[a.at].build>=reserve);
 if(build)return {type:'build',asset:build.at};
 return offerTrade(r,p,level,reserve)||{type:'end'};
}
function deltas(r,w){const winners=Array.isArray(w)?w:[w],losers=r.players.filter(p=>!winners.includes(p)),total=losers.length*10;return r.players.map(p=>winners.includes(p)?Math.floor(total/winners.length)+(winners.indexOf(p)<total%winners.length?1:0):-10);}
const playerView=(r,p)=>({cash:p.cash??1500000,position:p.position||0,jail:p.jail||0,bankrupt:!!p.bankrupt,tokenIcon:p.tokenIcon,turnsPlayed:r.turnCounts?.[p.id]||0,netWorth:r.assets?worth(r,p):0});
module.exports={start,act,view,bot,deltas,playerView,actor,canAct};
