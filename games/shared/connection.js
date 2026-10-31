'use strict';
const GRACE_MS=15000;
const automated=p=>!!p&&(p.bot||!p.connected&&!!p.disconnectBot);
const waiting=p=>!!p&&!p.bot&&!p.connected&&!p.disconnectBot&&Number.isFinite(p.disconnectDeadline)&&p.disconnectDeadline>Date.now();
const actionDelay=(p,thinkMs=3000)=>automated(p)?thinkMs:Math.max(0,(p.disconnectDeadline||Date.now()+GRACE_MS)-Date.now());
// Temporary automation never changes bot/account/token ownership. Native attach
// cancels the grace before broadcasting private state; stale socket closes do not.
function createPresence({exists,changed}){
 const pending=new Map();let stopped=false;
 function cancel(p){const item=pending.get(p);if(item)clearTimeout(item.timer);pending.delete(p);}
 function connect(p){cancel(p);delete p.disconnectedAt;delete p.disconnectDeadline;p.disconnectBot=false;}
 function disconnect(room,p,explicit=false){
  cancel(p);p.disconnectBot=false;delete p.disconnectDeadline;delete p.disconnectedAt;
  if(stopped||explicit||p.bot||!room.players.includes(p)||p.left||p.accountReleased)return;
  p.disconnectedAt=Date.now();p.disconnectDeadline=p.disconnectedAt+GRACE_MS;
  const timer=setTimeout(()=>{
   pending.delete(p);
   if(stopped||!exists(room)||p.connected||p.ws||p.bot||p.left||p.accountReleased||!room.players.includes(p))return;
   p.disconnectDeadline=null;p.disconnectBot=!room.recovering;
   changed(room,p);
  },GRACE_MS);
  pending.set(p,{room,timer});
 }
 function dispose(room){for(const [p,item]of pending)if(item.room===room)cancel(p);}
 function close(){stopped=true;for(const p of pending.keys())cancel(p);}
 return {connect,disconnect,dispose,close};
}
module.exports={GRACE_MS,automated,waiting,actionDelay,createPresence};
