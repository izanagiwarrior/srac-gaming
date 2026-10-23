const {EventEmitter}=require('node:events');
const {Buffer}=require('node:buffer');
class Socket extends EventEmitter {
  constructor(server,raw,run){super();this.owner=server;this.raw=raw;this.run=run;this.readyState=1;}
  send(text){
    if(this.readyState!==1||this.owner.disabled)return;
    try{this.owner.beforeSend?.();}catch(error){this.owner.onFailure?.(error);throw error;}
    try{this.raw.send(text);}catch{this.finish();}
  }
  // Cloudflare owns protocol ping/pong; surface pong to the native liveness check.
  ping(){if(this.readyState===1)this.emit('pong');}
  close(code=1000,reason=''){if(this.readyState!==1)return;try{this.raw.close(code,reason);}catch{}this.finish();}
  abort(){if(this.readyState===3)return;this.readyState=3;this.owner.clients.delete(this);try{this.raw.close(1011,'Penyimpanan gagal; sesi dijeda.');}catch{}}
  terminate(){this.close(1012,'Sesi dijeda; hubungkan kembali.');}
  finish(){
    if(this.readyState===3)return;this.readyState=3;this.owner.clients.delete(this);
    try{this.run(()=>this.emit('close'));this.owner.afterEvent?.();}catch(error){this.owner.onFailure?.(error);}finally{this.owner.onDisconnect?.(this);}
  }
  receive(data){
    if(this.readyState!==1||this.owner.disabled)return;
    if(typeof data!=='string'){this.close(1003,'Text messages required');return;}
    if(Buffer.byteLength(data)>this.owner.options.maxPayload){this.close(1009,'Message too large');return;}
    try{this.run(()=>{if(this.owner.beforeMessage?.(this,data)!==false)this.emit('message',data);});this.owner.afterEvent?.();}catch(error){this.owner.onFailure?.(error);}
  }
}
class WebSocketServer extends EventEmitter {
  constructor(options={}){super();this.options=options;this.clients=new Set();}
  accept(raw,request,run){
    const socket=new Socket(this,raw,run);this.clients.add(socket);
    // Durable Object class callbacks feed receive()/finish(); no raw listeners.
    try{run(()=>this.emit('connection',socket,{url:'/ws',headers:{host:new URL(request.url).host,origin:request.headers.get('Origin')}}));}catch(error){this.onFailure?.(error);throw error;}
    return socket;
  }
  close(callback){for(const socket of [...this.clients])socket.terminate();callback?.();}
}
module.exports={WebSocketServer};
