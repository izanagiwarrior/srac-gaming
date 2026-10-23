'use strict';
// Private graph format, not a browser message: preserves Sets and shared references.
function encode(value) {
  const seen=new Map(),nodes=[];
  function visit(v){
    if(v===undefined)return {u:1};
    if(typeof v==='number'&&!Number.isFinite(v))return {n:String(v)};
    if(v===null||typeof v!=='object')return v;
    if(seen.has(v))return {r:seen.get(v)};
    const id=nodes.length;seen.set(v,id);nodes.push(null);
    nodes[id]=v instanceof Set?['set',[...v].map(visit)]:v instanceof Map?['map',[...v].map(([k,w])=>[visit(k),visit(w)])]:Array.isArray(v)?['array',v.map(visit)]:['object',Object.entries(v).map(([k,w])=>[k,visit(w)])];
    return {r:id};
  }
  return JSON.stringify({format:1,root:visit(value),nodes});
}
function decode(text){
  const data=JSON.parse(text);if(data.format!==1||!Array.isArray(data.nodes))throw Error('Unsupported cloud save.');
  const out=data.nodes.map(([kind])=>kind==='set'?new Set():kind==='map'?new Map():kind==='array'?[]:Object.create(null));
  function read(v){if(v&&typeof v==='object'){if('r'in v){if(!Number.isInteger(v.r)||!out[v.r])throw Error('Invalid save reference.');return out[v.r];}if(v.u)return undefined;if(v.n)return Number(v.n);throw Error('Invalid save value.');}return v;}
  data.nodes.forEach(([kind,items],i)=>{if(kind==='set')items.forEach(v=>out[i].add(read(v)));else if(kind==='map')items.forEach(([k,v])=>out[i].set(read(k),read(v)));else if(kind==='array')items.forEach(v=>out[i].push(read(v)));else for(const [k,v]of items)Object.defineProperty(out[i],k,{value:read(v),enumerable:true,writable:true,configurable:true});});
  return read(data.root);
}
module.exports={encode,decode};
