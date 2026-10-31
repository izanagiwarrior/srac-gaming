'use strict';
// Account data is read from SQLite through HttpOnly sessions; never cached as browser identity.
(()=>{
 const skins={jade:'/avatar-jade.png',fox:'/avatar-fox.png',crane:'/avatar-crane.png'};
 function makeAvatar(user){const span=document.createElement('span');span.className='mk-account-avatar';const img=document.createElement('img');img.src=skins[user.skin]||skins.jade;img.alt='';span.append(img);if(user.accessory==='gold-frame'){const frame=document.createElement('img');frame.src='/accessory-gold.png';frame.className='mk-account-frame';frame.alt='';span.append(frame);}return span;}
 async function init(){
  let data;try{const r=await fetch('/api/account/me',{cache:'no-store',credentials:'same-origin'});if(!r.ok)return;data=await r.json();}catch{return;}
  const user=data.user,game=/^\/(capsa|mahjong|poker|catur|domino|blackjack)\//.test(location.pathname);
  const link=document.createElement('a');link.href='/account/';link.className='mk-account-link';link.setAttribute('aria-label',user?'Profil '+user.name:'Masuk akun');
  if(user){link.append(makeAvatar(user),document.createTextNode(user.name+' · Lv '+user.level));}else link.textContent='Masuk / Buat akun';
  const nav=document.querySelector('.header nav');if(nav)nav.append(link);else{const box=document.createElement('div');box.className='mk-account-strip';box.append(link);document.body.prepend(box);}
  if(user){
   if(game){
    const fill=()=>{for(const input of document.querySelectorAll('input[autocomplete=nickname]')){if(input.dataset.accountName===user.name)continue;input.value=user.name.slice(0,input.maxLength>0?input.maxLength:24);input.readOnly=true;input.dataset.accountName=user.name;input.title='Ubah nama melalui Profil → Pengaturan';}};
    fill();const observer=new MutationObserver(fill);observer.observe(document.body,{childList:true,subtree:true});
   }
   if(window.MejaRoom?.receive){const original=window.MejaRoom.receive;window.MejaRoom.receive=function(...args){const result=original.apply(this,args);const meta=args[0]?.hub;if(meta)queueMicrotask(()=>{if(meta.profiles)renderProfiles(meta.profiles);renderAdjustments(meta.adjustments||[]);});return result;};}
  }else if(game){
   const dialog=document.createElement('dialog');dialog.className='mk-account-gate';const title=document.createElement('h2');title.textContent='Satu akun untuk setiap meja.';const p=document.createElement('p');p.textContent='Masuk untuk menyimpan avatar, XP, dan koleksimu di database. Setelah masuk, kamu bisa kembali ke undangan ini.';
   const signin=document.createElement('a');signin.href='/account/?next='+encodeURIComponent(location.pathname+location.search);signin.textContent='Masuk / Buat akun';signin.className='mk-account-gate-primary';const home=document.createElement('a');home.href='/';home.textContent='Kembali ke beranda';dialog.append(title,p,signin,home);dialog.addEventListener('cancel',ev=>{ev.preventDefault();location.assign('/');});document.body.append(dialog);dialog.showModal();
  }
 }
 function renderAdjustments(rows){
  let panel=document.querySelector('.mk-account-adjustments');if(!rows.length){panel?.remove();return;}
  if(!panel){const bar=document.querySelector('.mk-room-tools');if(!bar)return;panel=document.createElement('details');panel.className='mk-account-adjustments';bar.append(panel);}
  const wasOpen=panel.open;panel.replaceChildren();const summary=document.createElement('summary');summary.textContent='Koreksi saldo oleh admin · '+rows.length+' catatan terakhir';panel.append(summary);
  for(const row of rows.slice(-10).reverse()){const p=document.createElement('p');p.textContent=row.actor+' · '+row.reason+' · '+new Date(row.time).toLocaleString('id-ID')+' — '+row.changes.map(c=>c.name+': '+(c.before.stack??c.before.points)+' → '+(c.after.stack??c.after.points)+' '+row.unit).join('; ');panel.append(p);}panel.open=wasOpen;
 }
 function renderProfiles(profiles){let host=document.querySelector('.mk-account-profiles');if(!host){const bar=document.querySelector('.mk-room-quickbar,.mk-room-tools');if(!bar)return;host=document.createElement('div');host.className='mk-account-profiles';bar.append(host);}host.replaceChildren();for(const p of profiles){const span=document.createElement('span');span.title=p.name;span.append(makeAvatar(p),document.createTextNode(p.name));host.append(span);}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
