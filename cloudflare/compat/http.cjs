const {EventEmitter}=require('node:events');
// Factories register their existing game handlers; assets are served by Workers.
exports.createServer=handler=>{const server=new EventEmitter();if(handler)server.on('request',handler);server.address=()=>null;server.close=callback=>callback?.();server.closeIdleConnections=()=>{};server.listen=()=>{throw Error('Cloud game factories must not listen on TCP.');};return server;};
