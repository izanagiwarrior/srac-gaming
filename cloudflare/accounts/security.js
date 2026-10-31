const encoder=new TextEncoder();
export const uid=()=>crypto.randomUUID();
export const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export const hash=async value=>b64(await crypto.subtle.digest('SHA-256',encoder.encode(value)));
export const cookies=req=>Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(s=>s.trim().split(/=(.*)/s)).filter(p=>p.length>1).map(([k,v])=>[k,v]));
export const cookie=(name,value,seconds,req)=>`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
export const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export function problem(message,status=400){const e=new Error(message);e.status=status;throw e;}
export function email(value){const s=String(value||'').trim().toLowerCase();if(s.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(s))problem('Alamat email tidak valid.');return s;}
export function displayName(value){const s=String(value||'').replace(/[\u0000-\u001f\u007f<>]/g,'').trim();if(s.length<1||s.length>24)problem('Nama harus 1–24 karakter.');return s;}
export async function body(req){
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))problem('Gunakan JSON.',415);
 if(Number(req.headers.get('Content-Length'))>8192)problem('Permintaan terlalu besar.',413);
 const reader=req.body?.getReader(),chunks=[];let size=0;
 if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();problem('Permintaan terlalu besar.',413);}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let parsed;try{parsed=JSON.parse(new TextDecoder().decode(bytes));}catch{problem('JSON tidak valid.');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))problem('Objek JSON diperlukan.');return parsed;
}
export function safeReturn(value,origin){try{const u=new URL(value||'/account/',origin);return u.origin===origin&&/^\/(capsa|mahjong|poker|catur|domino|blackjack)\//.test(u.pathname)?u.pathname+u.search:'/account/';}catch{return '/account/';}}

export async function passwordHash(password,salt=random()){
 if(typeof password!=='string'||password.length<1||password.length>128)problem('Isi password (maksimal 128 karakter).');
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return {salt,hash:b64(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256))};
}
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;let result=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)result|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return result===0;}
function decode(s){return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));}
let jwks;
export async function verifyGoogle(token,clientId,nonce){
 try{
 const parts=token.split('.');if(parts.length!==3)throw Error();const header=JSON.parse(new TextDecoder().decode(decode(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode(parts[1])));
 if(header.alg!=='RS256'||!header.kid)throw Error();
 if(!jwks||jwks.until<Date.now()||!jwks.keys.some(k=>k.kid===header.kid)){const r=await fetch('https://www.googleapis.com/oauth2/v3/certs');if(!r.ok)throw Error();jwks={keys:(await r.json()).keys,until:Date.now()+3600000};}
 const keyData=jwks.keys.find(k=>k.kid===header.kid);if(!keyData)throw Error();
 const key=await crypto.subtle.importKey('jwk',keyData,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),encoder.encode(parts[0]+'.'+parts[1])))throw Error();
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||claims.aud!==clientId||!Number.isFinite(claims.exp)||!Number.isFinite(claims.iat)||claims.exp<=Date.now()/1000||claims.iat>Date.now()/1000+60||claims.nonce!==nonce||!claims.sub||claims.email_verified!==true)throw Error();
 return {sub:claims.sub,email:email(claims.email),name:displayName(String(claims.name||claims.email.split('@')[0]).slice(0,24))};
 }catch{problem('Identitas Google tidak dapat diverifikasi. Silakan login ulang.',401);}
}
