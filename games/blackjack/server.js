'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomInt,randomUUID}=require('node:crypto');
const {WebSocketServer}=require('ws');
const E=require('./engine'),{tableSettings}=require('../shared/table-settings');
function createBlackjackServer({getAddresses=()=>[]}={}){
  const rooms=new Map();let closing=false,hub=null;
  const files={'/':['public/index.html','text/html; charset=utf-8'],'/client.js':['public/client.js','application/javascript; charset=utf-8'],'/engine.js':['engine.js','application/javascript; charset=utf-8'],'/style.css':['public/style.css','text/css; charset=utf-8']};
  const server=http.createServer((req,res)=>{let url;try{url=new URL(req.url,'http://localhost').pathname;}catch{res.writeHead(400);return res.end();}const f=files[url];if(!f||!['GET','HEAD'].includes(req.method)){res.writeHead(404);return res.end();}fs.readFile(path.join(__dirname,f[0]),(err,data)=>{if(err){res.writeHead(500);return res.end();}res.writeHead(200,{'Content-Type':f[1],'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:data);});});
  const send=(ws,data)=>{if(ws?.readyState===1)ws.send(JSON.stringify(hub?hub.enrich(ws,data):data));};
  const clean=n=>String(n||'Pemain').replace(/[<>"\u0000-\u001f]/g,'').trim().slice(0,24)||'Pemain';
  const all=r=>[...r.players,...r.spectators];
  const host=r=>r.players.find(p=>!p.bot&&p.connected)||r.players.find(p=>!p.bot);
  function person(name,bot=false,spectator=false){return {id:randomUUID(),token:bot?null:randomUUID(),name:clean(name),bot,spectator,connected:bot,ws:null,stack:0,totalBuyIn:0,bet:null,hands:[],handIndex:0};}
  function code(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ';for(let i=0;i<200;i++){let s='';for(let j=0;j<4;j++)s+=chars[randomInt(chars.length)];if(!(rooms.has(s)||hub?.hasCode(s)))return s;}throw Error('Room penuh.');}
  function config(input={},previous={pointValue:0,botLevel:'normal',playMode:'standard',seats:4,bots:1,buyIn:1000,minBet:10}){
    const s=tableSettings(input,previous);
    for(const [key,min,max] of [['seats',1,7],['bots',0,6],['buyIn',20,1000000],['minBet',2,100000]]){if(input[key]!==undefined)s[key]=input[key];if(!Number.isSafeInteger(s[key])||s[key]<min||s[key]>max)throw Error('Pengaturan '+key+' tidak valid.');}
    if(s.bots>=s.seats||s.minBet>s.buyIn||s.minBet%2||s.buyIn%2)throw Error('Sisakan satu kursi manusia; chip dan taruhan minimum harus genap, minimum tidak melebihi buy-in.');return s;
  }
  function note(r,text){r.events.push({text,time:Date.now()});r.events=r.events.slice(-100);}
  function options(r,p){const h=p.hands[p.handIndex];if(r.phase!=='playing'||r.players[r.turn]?.id!==p.id||!h||h.done)return {};return {hit:true,stand:true,double:h.cards.length===2&&!h.splitAce&&p.stack>=h.bet,split:p.hands.length===1&&h.cards.length===2&&h.cards[0].r===h.cards[1].r&&p.stack>=h.bet};}
  function view(r,p){const reveal=['dealer','finished'].includes(r.phase);return {type:'state',code:r.code,you:p.id,spectator:p.spectator,hostId:host(r)?.id,phase:r.phase,round:r.round,quickComplete:r.settings.playMode==='quick'&&r.phase==='finished',revision:r.revision,settings:r.settings,turnId:r.players[r.turn]?.id,
    players:r.players.map(q=>({id:q.id,name:q.name,bot:q.bot,connected:q.connected,stack:q.stack,totalBuyIn:q.totalBuyIn,bet:q.bet,hands:q.hands.map(h=>({...h,value:E.value(h.cards)})),handIndex:q.handIndex,score:q.stack+q.hands.reduce((n,h)=>n+(r.phase!=='finished'?h.bet:0),0)-q.totalBuyIn})),
    dealer:r.dealer.map((c,i)=>i===0||reveal?c:null),dealerValue:reveal?E.value(r.dealer):null,options:p.spectator?{}:options(r,p),chat:r.chat,events:r.events,ledger:r.ledger,house:r.house,spectators:r.spectators.filter(q=>q.connected).length,addresses:getAddresses()};}
  function broadcast(r){if(closing)return;hub?.changed(r);for(const p of all(r))if(p.connected&&!p.bot)send(p.ws,view(r,p));}
  function change(r){r.revision++;r.active=Date.now();broadcast(r);arm(r);}
  function take(r){if(!r.shoe.length)throw Error('Shoe habis.');return r.shoe.pop();}
  function round(r){clearTimeout(r.timer);r.round++;r.phase='betting';r.dealer=[];r.turn=0;for(const p of r.players){if(p.bot&&p.stack<r.settings.minBet&&p.totalBuyIn+r.settings.buyIn<=1000000000){p.stack+=r.settings.buyIn;p.totalBuyIn+=r.settings.buyIn;note(r,p.name+' mendapat rebuy chip latihan.');}p.bet=null;p.hands=[];p.handIndex=0;if(p.stack<r.settings.minBet)p.bet=0;}note(r,'Ronde '+r.round+' · pilih taruhan chip genap.');if(r.players.every(p=>p.bet!==null))return deal(r);change(r);}
  function bet(r,p,n){if(r.phase!=='betting'||p.bet!==null)throw Error('Taruhan ronde ini sudah dikunci.');if(!Number.isSafeInteger(n)||n%2||n<r.settings.minBet||n>p.stack)throw Error('Taruhan harus genap, minimal '+r.settings.minBet+', tidak melebihi stack.');p.bet=n;note(r,p.name+' siap dengan '+n+' chip.');if(r.players.every(q=>q.bet!==null))deal(r);else change(r);}
  function deal(r){const active=r.players.filter(p=>p.bet>0);if(!active.length){r.phase='finished';note(r,'Semua stack di bawah minimum. Rebuy untuk melanjutkan.');return change(r);}r.shoe=E.deck();for(let i=r.shoe.length-1;i>0;i--){const j=randomInt(i+1);[r.shoe[i],r.shoe[j]]=[r.shoe[j],r.shoe[i]];}for(const p of active){p.stack-=p.bet;p.hands=[{cards:[take(r),take(r)],bet:p.bet,done:false,fromSplit:false}];p.hands[0].done=E.value(p.hands[0].cards).natural;}
    r.dealer=[take(r),take(r)];note(r,'Kartu dibagikan. Dealer menyimpan satu kartu tertutup.');if(E.value(r.dealer).natural){r.phase='dealer';return settle(r);}r.phase='playing';r.turn=0;advance(r);}
  function advance(r){while(r.turn<r.players.length){const p=r.players[r.turn];while(p.handIndex<p.hands.length&&p.hands[p.handIndex].done)p.handIndex++;if(p.handIndex<p.hands.length)return change(r);r.turn++;}r.phase='dealer';note(r,'Dealer membuka kartu.');change(r);}
  function action(r,p,type){const o=options(r,p),h=p.hands[p.handIndex];if(!o[type])throw Error('Aksi tidak tersedia atau belum giliranmu.');
    if(type==='stand')h.done=true;
    if(type==='hit'){h.cards.push(take(r));if(E.value(h.cards).total>=21)h.done=true;}
    if(type==='double'){p.stack-=h.bet;h.bet*=2;h.cards.push(take(r));h.done=true;}
    if(type==='split'){p.stack-=h.bet;const [a,b]=h.cards;const ace=a.r===14;p.hands=[a,b].map(c=>({cards:[c,take(r)],bet:h.bet,fromSplit:true,splitAce:ace,done:ace}));for(const hand of p.hands)if(E.value(hand.cards).total===21)hand.done=true;p.handIndex=0;}
    note(r,p.name+' · '+type+'.');advance(r);
  }
  function settle(r){const dealer=E.value(r.dealer),rows=[];for(const p of r.players){let delta=0;for(const h of p.hands){const v=E.value(h.cards),natural=v.natural&&!h.fromSplit;let pay=0,label;
      if(v.bust)label='Bust';else if(dealer.natural){pay=natural?h.bet:0;label=natural?'Push':'Dealer Blackjack';}else if(natural){pay=h.bet*2.5;label='Blackjack 3:2';}else if(dealer.bust||v.total>dealer.total){pay=h.bet*2;label='Menang';}else if(v.total===dealer.total){pay=h.bet;label='Push';}else label='Kalah';
      p.stack+=pay;h.outcome=label;h.delta=pay-h.bet;h.done=true;delta+=h.delta;}
      rows.push({name:p.name,delta,amount:delta*r.settings.pointValue});}
    r.house-=rows.reduce((n,p)=>n+p.delta,0);r.ledger.push({label:'Ronde '+r.round,time:Date.now(),rate:r.settings.pointValue,players:rows});r.ledger=r.ledger.slice(-200);r.phase='finished';note(r,'Hasil ronde dicatat. Dealer '+dealer.total+(dealer.bust?' · bust':'')+'.');change(r);
  }
  function arm(r){clearTimeout(r.timer);if(closing||r.recovering)return;const rev=r.revision;
    if(r.phase==='dealer'){r.timer=setTimeout(()=>{if(r.revision!==rev||r.phase!=='dealer')return;if(E.value(r.dealer).total<17){r.dealer.push(take(r));note(r,'Dealer mengambil kartu.');change(r);}else settle(r);},3000);return;}
    const p=r.phase==='betting'?r.players.find(q=>q.bet===null&&(q.bot||!q.connected)):r.phase==='playing'?r.players[r.turn]:null;
    if(!p||!p.bot&&p.connected)return;r.timer=setTimeout(()=>{if(r.revision!==rev)return;try{if(r.phase==='betting')bet(r,p,r.settings.minBet);else action(r,p,p.bot?E.botAction(p.hands[p.handIndex],r.dealer[0],r.settings.botLevel,options(r,p),randomInt):'stand');}catch(error){note(r,error.message);broadcast(r);}},p.bot?3000:15000);
  }
  function attach(ws,r,p){if(p.ws&&p.ws!==ws){p.ws.room=null;p.ws.person=null;send(p.ws,{type:'replaced'});p.ws.close();}p.ws=ws;p.connected=true;ws.room=r;ws.person=p;r.active=Date.now();send(ws,{type:'joined',code:r.code,id:p.id,token:p.token});broadcast(r);arm(r);}
  function detach(ws,explicit=false){const r=ws.room,p=ws.person;ws.room=null;ws.person=null;if(!r||!p||p.ws!==ws)return;p.ws=null;p.connected=false;r.active=Date.now();if(p.spectator){if(!p.hasAccount)r.spectators=r.spectators.filter(q=>q!==p);}else if(explicit){if(r.phase==='lobby')r.players=r.players.filter(q=>q!==p);else {p.bot=true;p.connected=true;p.token=null;note(r,p.name+' keluar; bot melanjutkan kursi.');}}broadcast(r);arm(r);}
  const wss=new WebSocketServer({server,maxPayload:8192,verifyClient:info=>{if(!info.origin)return true;try{return new URL(info.origin).host===info.req.headers.host;}catch{return false;}}});
  wss.on('connection',ws=>{ws.alive=true;ws.window=Date.now();ws.count=0;ws.on('pong',()=>ws.alive=true);ws.on('error',()=>{});ws.on('message',raw=>{if(closing)return;try{if(Date.now()-ws.window>1000){ws.window=Date.now();ws.count=0;}if(++ws.count>30)return ws.close(1008,'Too many requests');const m=JSON.parse(raw);if(!m||typeof m!=='object')throw Error('Pesan tidak valid.');if(hub?.handle(ws,m))return;
    if(['create','join','resume'].includes(m.type)){if(ws.person)throw Error('Keluar dari room dulu.');if(m.type==='create'){if(rooms.size>=200)throw Error('Server penuh.');const p=person(m.name),r={code:code(),players:[p],spectators:[],settings:config(m.settings),phase:'lobby',round:0,revision:0,turn:0,dealer:[],shoe:[],house:0,ledger:[],chat:[],events:[],active:Date.now(),timer:null};rooms.set(r.code,r);return attach(ws,r,p);}const r=rooms.get(String(m.code||'').toUpperCase());if(!r)return send(ws,{type:'error',message:'Room tidak ditemukan.',sessionUnavailable:m.type==='resume',fatal:m.type==='resume'});if(m.type==='resume'){const p=all(r).find(q=>q.token&&q.token===m.token);if(!p)return send(ws,{type:'error',message:'Sesi tidak dikenal.',fatal:true,sessionUnavailable:true});return attach(ws,r,p);}const spec=r.phase!=='lobby'||r.players.length+r.settings.bots>=r.settings.seats;if(spec&&r.spectators.filter(p=>p.connected&&!p.bot).length>=16)throw Error('Penonton penuh.');const p=person(m.name,false,spec);(spec?r.spectators:r.players).push(p);return attach(ws,r,p);}
    const r=ws.room,p=ws.person;if(!r||!p)throw Error('Masuk room dulu.');if(m.type==='leave'){detach(ws,true);return send(ws,{type:'left'});}if(m.type==='chat'){const text=String(m.text||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,200);if(text){r.chat.push({id:randomUUID(),name:p.name,text,emoji:m.emoji===true,time:Date.now()});r.chat=r.chat.slice(-70);broadcast(r);}return;}if(p.spectator)throw Error('Penonton tidak dapat bermain.');
    if(m.type==='settings'){if(r.phase!=='lobby'||host(r)?.id!==p.id)throw Error('Pengaturan hanya untuk host di lobby.');const s=config(m.settings,r.settings);if(r.players.length+s.bots>s.seats)throw Error('Kursi kurang.');r.settings=s;return change(r);}
    if(m.type==='start'){if(r.phase!=='lobby'||host(r)?.id!==p.id)throw Error('Hanya host di lobby yang boleh mulai.');if(m.settings){const next=config(m.settings,r.settings);if(r.players.length+next.bots>next.seats)throw Error('Kursi kurang.');r.settings=next;}if(r.players.some(q=>!q.connected))throw Error('Tunggu pemain terhubung.');for(let i=0;i<r.settings.bots;i++)r.players.push(person(['Mei','Raka','Sinta','Bima','Ayu','Doni'][i]+' · bot',true));for(const q of r.players){q.stack=r.settings.buyIn;q.totalBuyIn=r.settings.buyIn;}return round(r);}
    if(m.type==='rebuy'){if(!['finished','betting'].includes(r.phase)||p.hands.length&&r.phase==='betting')throw Error('Rebuy di antara ronde.');if(p.totalBuyIn+r.settings.buyIn>1000000000)throw Error('Batas chip tercapai.');p.stack+=r.settings.buyIn;p.totalBuyIn+=r.settings.buyIn;if(r.phase==='betting'&&p.bet===0)p.bet=null;note(r,p.name+' menambah '+r.settings.buyIn+' chip simulasi.');return change(r);}
    if(m.type==='next'){if(r.phase!=='finished'||host(r)?.id!==p.id)throw Error('Hanya host setelah ronde selesai.');return round(r);}
    if(m.revision!==r.revision)throw Error('Meja sudah berubah. Coba lagi.');if(m.type==='bet')return bet(r,p,m.amount);if(['hit','stand','double','split'].includes(m.type))return action(r,p,m.type);throw Error('Aksi tidak dikenal.');
  }catch(error){send(ws,{type:'error',message:error.message});}});ws.on('close',()=>detach(ws));});
  wss.on('error',error=>console.error('Blackjack:',error.message));
  const maintenance=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}for(const [c,r]of rooms)if(!all(r).some(p=>!p.bot&&p.connected)&&Date.now()-r.active>7*86400000){clearTimeout(r.timer);rooms.delete(c);}},30000);maintenance.unref();
  async function close(){closing=true;clearInterval(maintenance);for(const r of rooms.values())clearTimeout(r.timer);for(const ws of wss.clients){ws.room=null;ws.person=null;ws.terminate();}await new Promise(resolve=>wss.close(resolve));await new Promise(resolve=>server.close(resolve));}
  return {server,wss,rooms,close,
    setRoomService(value){hub=value;},capacity:r=>r.settings.seats,
    restoreRoom:saved=>({...saved,timer:null}),setSpectator(p,value){p.spectator=value;},
    admit(r,p){p.hands=[];p.handIndex=0;p.bet=null;if(p.totalBuyIn===undefined||p.totalBuyIn===0){p.stack=r.settings.buyIn;p.totalBuyIn=r.settings.buyIn;}},
    broadcastRoom:broadcast,resumeRoom:arm,nextRound:round
  };
}
module.exports={createBlackjackServer};
