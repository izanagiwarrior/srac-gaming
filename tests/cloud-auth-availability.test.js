const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../cloudflare/worker.js'),'utf8'),start=source.indexOf('  async fetch(request){'),end=source.indexOf('\n}\n\nexport default',start),method=source.slice(start,end).replace('  async fetch(request){','return async function(request){');
const games=['capsa','mahjong','poker','catur','domino','blackjack','uno','ludo','monopoli','reversi'];
const handler=new Function('GAMES','json','failed','WebSocketPair',method)(games,(v,s=200)=>new Response(JSON.stringify(v),{status:s}),()=>new Response(JSON.stringify({error:'Server belum dapat memproses sesi. Coba hubungkan kembali.'}),{status:503}),()=>{throw Error('Unexpected socket allocation');});
const cases=[
 ['transport',()=>{throw Error('private-transport-detail');},503],
 ['http500html',()=>new Response('<private-provider-error>',{status:500}),503],
 ['http503json',()=>new Response(JSON.stringify({id:'not-authorized',private:'must-not-leak'}),{status:503}),503],
 ['malformedJSON',()=>new Response('{'),503],
 ['array',()=>Response.json([]),503],
 ['errorObject',()=>Response.json({error:'private-detail'}),503],
 ['missingSession',()=>Response.json({id:'account',expires:Date.now()+10000}),503],
 ['invalidExpiry',()=>Response.json({id:'account',sessionId:'session',expires:'tomorrow'}),503],
 ['nullAnonymous',()=>Response.json(null),401],
 ['expired',()=>Response.json({id:'account',sessionId:'session',expires:1}),401]
];
for(const game of games)for(const [kind,reply,status]of cases)test(game+' '+kind+' rejects before game initialization',async()=>{
 let factories=0,reads=0;const hub={env:{ACCOUNTS:{idFromName:n=>n,get:()=>({fetch:async()=>{reads++;return reply();}})}},init(){factories++;throw Error('No factory may start');}};
 const r=await handler.call(hub,new Request('https://game.invalid/'+game+'/ws',{headers:{Upgrade:'websocket',Origin:'https://game.invalid'}}));assert.equal(r.status,status);assert.equal(factories,0);assert.equal(reads,1);assert(!r.headers.has('set-cookie'));assert(!JSON.stringify(await r.json()).includes('private'));
});
test('valid session still reaches native initialization',async()=>{let factories=0;const hub={env:{ACCOUNTS:{idFromName:n=>n,get:()=>({fetch:async()=>Response.json({id:'account',sessionId:'session',expires:Date.now()+60000})})}},init(){factories++;throw Error('stop before factory test');}};assert.equal((await handler.call(hub,new Request('https://game.invalid/uno/ws',{headers:{Upgrade:'websocket',Origin:'https://game.invalid'}}))).status,503);assert.equal(factories,1);});
test('cross-origin rejection still precedes account read',async()=>{const hub={env:{ACCOUNTS:{get(){throw Error('No account read');}}}};assert.equal((await handler.call(hub,new Request('https://game.invalid/uno/ws',{headers:{Upgrade:'websocket',Origin:'https://evil.invalid'}}))).status,403);});
