import {amount,reason,requestId,MAX_BALANCE} from './admin.js';
import {problem} from './security.js';
const people=r=>[...r.players,...(r.spectators||[]).filter(p=>p.hasAccount)];
export function isChipGame(game){return ['poker','blackjack'].includes(game);}
function boundary(game,r){if(game==='mahjong')return !!r.G?.over;if(game==='poker')return r.phase==='lobby'||!!r.game?.over;return isChipGame(game)?r.phase==='lobby'||r.phase==='finished':['result','finished'].includes(r.phase);}
function values(game,p){return isChipGame(game)?{stack:p.stack||0,bought:p.totalBuyIn||0}:{points:p.score||0};}
export function balanceSnapshot(game,room){
 const players=people(room).map(p=>({id:p.id,name:p.name,bot:!!p.bot,outside:!room.players.includes(p),...values(game,p)}));
 const version=JSON.stringify([room.social.id,room.adminRevision||0,room.revision,room.phase,room.state,room.G?.over,room.G?.hand,room.game?.version,players.map(p=>[p.id,p.points,p.stack,p.bought]),room.house]);
 return {game,code:room.code,roomId:room.social.id,version,phase:room.phase||room.state,editable:boundary(game,room),unit:isChipGame(game)?'chip':'poin',rate:room.settings?.chipValue??room.settings?.pointValue??0,players,house:game==='blackjack'?room.house||0:null,adjustments:(room.adminAdjustments||[]).slice(-30)};
}
const valid=(n,min)=>Number.isSafeInteger(n)&&n>=min&&n<=MAX_BALANCE;
export function adjustGame({game,room,service,app,body,actor}){
 const id=requestId(body.requestId),why=reason(body.reason),signature=JSON.stringify(body);
 const prior=(room.adminRequests||[]).find(r=>r.id===id);
 if(prior){if(prior.actor!==actor.id||prior.signature!==signature)problem('ID perubahan sudah dipakai.',409);return {...prior.result,replayed:true};}
 if(body.roomId!==room.social.id||body.version!==balanceSnapshot(game,room).version)problem('Meja sudah berubah. Segarkan saldo sebelum mengubahnya.',409);
 if(!boundary(game,room))problem('Ronde sedang berjalan. Ubah saldo setelah ronde selesai.',409);
 const all=people(room),p=all.find(p=>p.id===body.playerId);if(!p)problem('Pemain meja tidak ditemukan.',404);
 const chip=isChipGame(game),before=values(game,p),current=chip?before.stack:before.points,next=amount(current,body.amount,chip?0:-MAX_BALANCE),delta=next-current;
 if(!delta)problem('Tidak ada saldo yang berubah.');
 let other=null,changes=[{playerId:p.id,name:p.name,before,after:chip?{stack:next,bought:before.bought}:{points:next}}],mode=body.mode;
 if(chip&&mode==='funding'){
  const bought=before.bought+delta;if(!valid(bought,0))problem('Penarikan modal melebihi modal tercatat. Gunakan transfer chip bila perlu mengoreksi hasil.');changes[0].after.bought=bought;
 }else if(mode==='transfer'){
  if(body.counterparty==='dealer'&&game==='blackjack'){
   const afterHouse=(room.house||0)-delta;if(!valid(afterHouse,-MAX_BALANCE))problem('Saldo dealer di luar batas.');changes.push({playerId:'dealer',name:'Dealer',before:{points:room.house||0},after:{points:afterHouse}});
  }else{
   other=all.find(q=>q.id===body.counterparty&&q!==p);if(!other)problem('Pilih akun lawan koreksi agar total meja tetap seimbang.');const beforeOther=values(game,other),otherValue=(chip?beforeOther.stack:beforeOther.points)-delta;if(!valid(otherValue,chip?0:-MAX_BALANCE))problem('Saldo lawan koreksi tidak mencukupi atau di luar batas.');changes.push({playerId:other.id,name:other.name,before:beforeOther,after:chip?{stack:otherValue,bought:beforeOther.bought}:{points:otherValue}});
  }
 }else problem(chip?'Pilih koreksi modal atau transfer chip.':'Koreksi poin memerlukan lawan koreksi.');
 const old={adminRevision:room.adminRevision,adminAdjustments:room.adminAdjustments,adminRequests:room.adminRequests,accountActivity:room.accountActivity,ledger:room.ledger,house:room.house};
 const playerCopies=new Map([p,other].filter(Boolean).map(q=>[q,{score:q.score,stack:q.stack,totalBuyIn:q.totalBuyIn,adminInitialFunding:q.adminInitialFunding}]));
 const record={id,time:Date.now(),actor:actor.name,reason:why,mode,unit:chip?'chip':'poin',changes};
 try{
  for(const c of changes){if(c.playerId==='dealer'){room.house=c.after.points;continue;}const target=all.find(q=>q.id===c.playerId);if(chip){target.stack=c.after.stack;target.totalBuyIn=c.after.bought;if(room.phase==='lobby')target.adminInitialFunding=true;}else target.score=c.after.points;}
  room.adminRevision=(room.adminRevision||0)+1;room.adminAdjustments=[...(room.adminAdjustments||[]),record].slice(-200);
  const result={ok:true,adjustment:record};
  room.adminRequests=[...(room.adminRequests||[]),{id,actor:actor.id,signature,result}].slice(-200);
  const detail={actorId:actor.id,actorName:actor.name,reason:why,changes,mode,requestId:id};
  room.accountActivity=[...(room.accountActivity||[]),{id,userId:actor.id,kind:'admin.game_balance',game,room:room.code,detail,recipients:[p.accountId,other?.accountId].filter(Boolean)}].slice(-100);
  if(game!=='poker'&&game!=='capsa')room.ledger=[...(room.ledger||[]),{label:'Koreksi admin · '+why,time:record.time,rate:room.settings.pointValue||0,kind:'admin-adjustment',players:changes.filter(c=>c.playerId!=='dealer').map(c=>({name:c.name,delta:chip?mode==='funding'?0:c.after.stack-c.before.stack:c.after.points-c.before.points,amount:(chip?mode==='funding'?0:c.after.stack-c.before.stack:c.after.points-c.before.points)*(room.settings.pointValue||0)}))}].slice(-200);
  if(game==='poker')room.ledger=[...(room.ledger||[]),...changes.filter(c=>c.playerId!=='dealer').map(c=>({id:id+':'+c.playerId,playerId:c.playerId,name:c.name,kind:'Koreksi admin · '+(mode==='funding'?'modal':'transfer')+' · '+why,chips:c.after.stack-c.before.stack,idr:(c.after.stack-c.before.stack)*(room.settings.chipValue||0),time:record.time}))];
  if(!service.save())problem('Koreksi gagal disimpan. Saldo lama dipertahankan.',503);
  return result;
 }catch(error){for(const [q,v]of playerCopies)Object.assign(q,v);Object.assign(room,old);throw error;}
}
