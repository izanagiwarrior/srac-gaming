// Transient handoff challenges; durable seat ownership remains in each game's SQLite snapshot.
const people=r=>[...r.players,...(r.spectators||[])];
const eligible=p=>p.accountId&&!p.bot&&!p.left&&!p.accountReleased&&!!p.token;
export class AccountRooms {
 constructor(hub){this.hub=hub;}
 seats(accountId){return [...this.hub.apps].flatMap(([game,app])=>[...app.rooms.values()].flatMap(room=>people(room).filter(p=>eligible(p)&&p.accountId===accountId).map(person=>({game,room,person}))));}
 name(socket,msg,game){
  const max=game==='mahjong'?16:game==='capsa'?20:24;
  const base=String(socket.account.name||'Pemain').replace(game==='mahjong'?/[<>&"\u0000-\u001f\u007f]/g:game==='poker'?/[\u0000-\u001f\u007f]/g:/[<>"\\\u0000-\u001f\u007f]/g,'').trim().slice(0,max)||'Pemain';
  const room=this.hub.apps.get(game).rooms.get(String(msg.code||'').trim().toUpperCase()),used=new Set((room?people(room):[]).map(p=>String(p.name).toLowerCase()));
  let candidate=base;for(let i=2;used.has(candidate.toLowerCase());i++){const suffix=' · '+i;candidate=base.slice(0,max-suffix.length)+suffix;}return candidate;
 }
 send(socket,data){socket.send(JSON.stringify(data));}
 error(socket,message){this.send(socket,{type:'error',message,msg:message,accountConflict:true});return false;}
 offer(socket,legacyResume=false){
  const seats=this.seats(socket.account.id),id=crypto.randomUUID();
  socket.accountOffer={id,until:Date.now()+90000,seats:seats.map(s=>({...s,token:s.person.token}))};
  this.send(socket,{type:'account-room-offer',handoffId:id,legacyResume,seats:seats.map(s=>({game:s.game,code:s.room.code,roomId:s.room.social.id,connected:!!s.person.connected,spectator:!s.room.players.includes(s.person)}))});return false;
 }
 rotate(socket,seat,msg){
  const {game,room,person}=seat,old=person.token,oldHost=room.hostToken;person.token=crypto.randomUUID();if(room.hostToken===old)room.hostToken=person.token;
  // Checkpoint the new lease before any private cards can be emitted to its new controller.
  if(!this.hub.services.get(game).save()){person.token=old;room.hostToken=oldHost;return this.error(socket,'Pemindahan belum dapat disimpan. Kursi lama tetap dipertahankan.');}
  const prior=person.ws;
  // Use native resume to replace its socket without resign/fold/bot takeover or settlement.
  const next={...msg,type:['capsa','mahjong'].includes(game)?'rejoin':'resume',code:room.code,token:person.token};
  socket.accountOffer=null;
  for(const other of this.seats(socket.account.id))if(other.person.ws&&other.person.ws!==prior&&other.person.ws!==socket){this.send(other.person.ws,{type:'replaced',message:'Akun dilanjutkan di perangkat lain.'});other.person.ws.close(1000,'Account moved');}
  return next;
 }
 before(socket,msg,game){
  const service=this.hub.services.get(game),attached=service.roomFor(socket),p=attached.person;
  if(p&&(p.ws!==socket||p.accountId&&p.accountId!==socket.account.id||p.accountReleased)){
   this.send(socket,{type:'replaced',message:'Kursi sudah berpindah. Perangkat ini berhenti mengontrol.'});socket.close(1000,'Seat moved');return false;
  }
  if(msg.type==='hub-account-list'){const room=this.hub.apps.get(game).rooms.get(String(msg.code||'').trim().toUpperCase()),legacy=room&&people(room).find(q=>!q.accountId&&!q.bot&&!q.left&&!q.accountReleased&&q.token&&q.token===msg.token);return this.offer(socket,!!legacy);}
  if(msg.type==='hub-account-claim'){
   if(p)return this.error(socket,'Keluar dari kursi saat ini sebelum memindahkan akun.');
   const offer=socket.accountOffer,seat=offer?.seats.find(s=>s.game===game&&s.room.social.id===msg.roomId);
   if(!offer||offer.id!==msg.handoffId||offer.until<Date.now()||!seat||!this.hub.apps.get(game).rooms.has(seat.room.code)||!eligible(seat.person)||seat.person.accountId!==socket.account.id||seat.person.token!==seat.token)return this.offer(socket);
   return this.rotate(socket,seat,msg);
  }
  if(['create','join','resume','rejoin'].includes(msg.type)&&!p){
   const all=this.seats(socket.account.id),room=this.hub.apps.get(game).rooms.get(String(msg.code||'').trim().toUpperCase()),owner=room&&people(room).find(q=>q.token&&q.token===msg.token);
   if(owner?.accountId&&owner.accountId!==socket.account.id)return this.error(socket,'Kursi ini milik akun lain. Masuk dengan akun pemiliknya.');
   if(['resume','rejoin'].includes(msg.type)&&owner&&!owner.left&&!owner.bot&&!owner.accountReleased){
    if(owner.accountId&&owner.connected&&owner.ws!==socket||all.some(s=>s.person!==owner&&s.person.connected))return this.offer(socket);
    return this.rotate(socket,{game,room,person:owner},msg);
   }
   if(all.length)return this.offer(socket);
  }
  if(msg.type==='leave'&&p){p.accountReleased=true;p.token=null;socket.accountOffer=null;}
  return msg;
 }
}
