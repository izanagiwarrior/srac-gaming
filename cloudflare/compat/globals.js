import {Buffer} from 'node:buffer';
import {AsyncLocalStorage} from 'node:async_hooks';
export {Buffer};
export const timerScope=new AsyncLocalStorage();
function schedule(repeat,fn,ms,...args){
  const scope=timerScope.getStore();
  const handle={id:null,unref(){return this;},ref(){return this;}};
  if(scope?.cancelled)return handle;
  const callback=()=>{if(scope?.cancelled)return;if(!repeat)scope?.delete(handle);timerScope.run(scope,()=>fn(...args));};
  handle.id=(repeat?globalThis.setInterval:globalThis.setTimeout)(callback,ms);scope?.add(handle);return handle;
}
export function setTimeout(fn,ms,...args){return schedule(false,fn,ms,...args);}
export function setInterval(fn,ms,...args){return schedule(true,fn,ms,...args);}
export function clearTimeout(handle){if(handle){globalThis.clearTimeout(handle.id??handle);timerScope.getStore()?.delete(handle);}}
export function clearInterval(handle){if(handle){globalThis.clearInterval(handle.id??handle);timerScope.getStore()?.delete(handle);}}
export function clearScope(scope){scope.cancelled=true;for(const handle of scope){globalThis.clearTimeout(handle.id);globalThis.clearInterval(handle.id);}scope.clear();}
