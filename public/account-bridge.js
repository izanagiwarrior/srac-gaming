'use strict';
// Account data is read from SQLite through HttpOnly sessions; never cached as browser identity.
(()=>{
 let cosmeticsReady=false,latestCosmeticFrame=null,arrivalRoom=null,arrivals=new Map();
 const skins={jade:'/avatar-starter-buddy.webp',fox:'/avatar-fox.webp',crane:'/avatar-crane.webp'},accessories={'gold-frame':'/accessory-gold.webp'};
 function makeAvatar(user){const span=document.createElement('span');span.className='mk-account-avatar';const img=document.createElement('img');img.src=skins[user.skin]||skins.jade;img.alt='';span.append(img);MejaCosmetics.decorate(span,user);if(accessories[user.accessory]){const frame=document.createElement('img');frame.src=accessories[user.accessory];frame.className='mk-account-frame';frame.alt='';span.append(frame);}return span;}
 async function init(){
  let data;try{const r=await fetch('/api/account/me',{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;data=await r.json();}catch{return;}
  MejaCosmetics.configure(data.catalog);cosmeticsReady=true;
  for(const item of data.catalog||[])if(item.kind==='skin'&&/^\/avatar-[a-z-]+\.webp$/.test(item.image))skins[item.id]=item.image;
  for(const item of data.catalog||[])if(item.kind==='accessory'&&/^\/accessory-[a-z-]+\.webp$/.test(item.image))accessories[item.id]=item.image;
  const user=data.user,game=/^\/(capsa|mahjong|poker|catur|domino|blackjack|uno|ludo|monopoli|reversi|dam|tangga|empat)\//.test(location.pathname);
  const link=document.createElement('a');link.href='/account/';link.className='mk-account-link';link.setAttribute('aria-label',user?'Profil '+user.name:'Masuk akun');
  if(user){const title=MejaTitles.get(user.level).name;link.title=title+' · Level '+user.level;link.setAttribute('aria-label','Profil '+user.name+' · '+title+' · Level '+user.level);link.append(makeAvatar(user),document.createTextNode(user.name+' · Lv '+user.level));}else link.textContent='Masuk / Buat akun';
  const bar=game?document.querySelector('.hubbar'):null;const nav=document.querySelector('.header nav');if(bar){bar.classList.add('mk-game-topbar');bar.append(link);}else if(nav)nav.append(link);else{const box=document.createElement('div');box.className='mk-account-strip';box.append(link);document.body.prepend(box);}
  if(user){
   if(game){
    const fill=()=>{for(const input of document.querySelectorAll('input[autocomplete=nickname]')){if(input.dataset.accountName===user.name)continue;input.value=user.name.slice(0,input.maxLength>0?input.maxLength:24);input.readOnly=true;input.hidden=true;input.dataset.accountName=user.name;input.parentNode.querySelectorAll(':scope > .mk-name-chip').forEach(n=>n.remove());const chip=document.createElement('div');chip.className='mk-name-chip';const text=document.createElement('strong');text.textContent=input.value;const edit=document.createElement('a');edit.className='mk-name-edit';edit.href='/account/#profile';edit.textContent='✎';edit.title='Ubah nama di Profil';edit.setAttribute('aria-label','Ubah nama di Profil');chip.append(text,edit);input.after(chip);}};
    fill();const observer=new MutationObserver(fill);observer.observe(document.body,{childList:true,subtree:true});
   }
   if(latestCosmeticFrame)renderProfiles(latestCosmeticFrame.profiles||[],latestCosmeticFrame);
  }else if(game){
   const dialog=document.createElement('dialog');dialog.className='mk-account-gate';const title=document.createElement('h2');title.textContent='Satu akun untuk setiap meja.';const p=document.createElement('p');p.textContent='Masuk akun untuk lanjut ke meja.';
   const signin=document.createElement('a');signin.href='/account/?next='+encodeURIComponent(location.pathname+location.search);signin.textContent='Masuk / Buat akun';signin.autofocus=true;signin.className='mk-account-gate-primary';const home=document.createElement('a');home.href='/';home.textContent='Kembali ke beranda';const access=document.createElement('p');access.className='mk-gate-access';access.textContent='Google kantor · @shopee.com ';const info=document.createElement('span');info.innerHTML=MejaHelp.icon('Google hanya menerima akun kantor yang diizinkan organisasi. Email pribadi tetap bisa lewat daftar email dan password. Undangan ini akan dibuka kembali setelah masuk.','Akses akun');access.append(info.firstElementChild);dialog.append(title,p,access,signin,home);dialog.addEventListener('cancel',ev=>{ev.preventDefault();location.assign('/');});document.body.append(dialog);dialog.showModal();
  }
 }
 function renderAdjustments(rows){
  let panel=document.querySelector('.mk-account-adjustments');if(!rows.length){panel?.remove();return;}
  if(!panel){const bar=document.querySelector('.mk-room-tools');if(!bar)return;panel=document.createElement('details');panel.className='mk-account-adjustments';bar.append(panel);}
  const wasOpen=panel.open;panel.replaceChildren();const summary=document.createElement('summary');summary.textContent='Koreksi saldo oleh admin · '+rows.length+' catatan terakhir';panel.append(summary);
  for(const row of rows.slice(-10).reverse()){const p=document.createElement('p');p.textContent=row.actor+' · '+row.reason+' · '+new Date(row.time).toLocaleString('id-ID')+' — '+row.changes.map(c=>c.name+': '+(c.before.stack??c.before.points)+' → '+(c.after.stack??c.after.points)+' '+row.unit).join('; ');panel.append(p);}panel.open=wasOpen;
 }
 function renderProfiles(profiles,meta){
  let host=document.querySelector('.mk-account-profiles');if(!host){const bar=document.querySelector('.mk-room-quickbar,.mk-room-tools');if(!bar)return;host=document.createElement('div');host.className='mk-account-profiles';bar.append(host);}
  const signature=JSON.stringify(profiles);if(host.dataset.signature!==signature){host.dataset.signature=signature;host.replaceChildren();for(const p of profiles){const span=document.createElement('span');span.title=p.name;const cl=MejaCosmetics.classes(p,'decoration');if(cl)span.classList.add(...cl.split(' '));span.append(makeAvatar(p),document.createTextNode(p.name));host.append(span);}}
  for(const node of document.querySelectorAll('[data-mk-player-name]')){const player=profiles.find(p=>p.name===node.dataset.mkPlayerName);MejaCosmetics.decorate(node,player||{});}
  const first=arrivalRoom!==meta.roomId;if(first){arrivalRoom=meta.roomId;arrivals=new Map();}
  const self=meta.presence?.find(p=>p.you)?.id;
  for(const p of profiles){const old=arrivals.get(p.id);if(p.arrival&&p.arrival!==old&&(!first||p.id===self))MejaCosmetics.entrance(p,makeAvatar(p));arrivals.set(p.id,p.arrival);}
  for(const id of arrivals.keys())if(!profiles.some(p=>p.id===id))arrivals.delete(id);
 }
 if(window.MejaRoom?.receive){const original=window.MejaRoom.receive;window.MejaRoom.receive=function(...args){const result=original.apply(this,args),meta=args[0]?.hub;if(['left','room-dissolved','replaced','account-session-ended'].includes(args[0]?.type)){document.querySelector('.mk-account-profiles')?.remove();arrivalRoom=null;arrivals.clear();latestCosmeticFrame=null;MejaCosmetics.clear();}if(meta){latestCosmeticFrame=meta;queueMicrotask(()=>{if(cosmeticsReady&&meta.profiles)renderProfiles(meta.profiles,meta);renderAdjustments(meta.adjustments||[]);});}return result;};}
 function refreshLatestStyles(){const frame=latestCosmeticFrame;if(cosmeticsReady&&frame)queueMicrotask(()=>{if(frame===latestCosmeticFrame)renderProfiles(frame.profiles||[],frame);});}
 document.addEventListener('DOMContentLoaded',refreshLatestStyles,{once:true});window.addEventListener('load',refreshLatestStyles,{once:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
