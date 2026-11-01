'use strict';
(()=>{
 const themes=new Set(['nightfall','bloom','vanguard','jade','sovereign','astral','celestial','ember','lantern','observatory','comet','tide','petal','aurora','prism','thunder','eclipse','phoenix','nova','nebula','chrono']);let catalog=new Map(),banner=null,timer;
 const particleThemes=new Set(['comet','tide','petal','aurora','prism','thunder','phoenix','nova']);
 const kindName={skin:'Skin',accessory:'Bingkai',decoration:'Dekorasi profil',entrance:'Efek masuk',aura:'Aura bermain'};
 function configure(items){catalog=new Map((items||[]).map(i=>[i.id,i]));}
 function effect(id,kind){const i=catalog.get(id);return i?.kind===kind&&themes.has(i.effect)?i.effect:null;}
 function classes(user,slot){const value=effect(user?.[slot],slot);return value?'mk-cosmetic-'+slot+' mk-style-'+value:'';}
 function reduced(){return matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.mkReduced==='true';}
 function clear(){clearTimeout(timer);banner?.remove();banner=null;}
 function entrance(user,avatar,label){clear();const theme=effect(user.entrance,'entrance');if(!theme||reduced())return;banner=document.createElement('div');banner.className='mk-arrival mk-style-'+theme;banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');if(avatar)banner.append(avatar);const text=document.createElement('span');text.textContent=label||user.name+' memasuki meja';banner.append(text);if(particleThemes.has(theme)){const particles=document.createElement('span');particles.className='mk-arrival-particles';particles.setAttribute('aria-hidden','true');for(let i=0;i<6;i++){const dot=document.createElement('i');dot.style.setProperty('--i',i);particles.append(dot);}banner.append(particles);}document.body.append(banner);timer=setTimeout(()=>{banner?.remove();banner=null;},2800);}
 function preview(id,user){const item=catalog.get(id);if(!item||!['entrance','aura'].includes(item.kind))return false;if(item.kind==='entrance'){entrance({...user,entrance:id},null,'Pratinjau · '+item.name);return !reduced();}clear();banner=document.createElement('div');banner.className='mk-effect-preview';banner.setAttribute('role','status');const orb=document.createElement('span');orb.className='mk-effect-preview-orb '+classes({aura:id},'aura');orb.setAttribute('aria-hidden','true');orb.textContent='✦';const text=document.createElement('span');text.textContent='Pratinjau · '+item.name;banner.append(orb,text);document.body.append(banner);timer=setTimeout(clear,3600);return true;}
 function decorate(node,user){for(const c of [...node.classList])if(c==='mk-cosmetic-aura'||c.startsWith('mk-style-'))node.classList.remove(c);const cl=classes(user,'aura');if(cl)node.classList.add(...cl.split(' '));}
 window.addEventListener('pagehide',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 function syncMotion(){try{const value=window.MejaRoom?.preferences?.()||JSON.parse(localStorage.getItem('mejakita.preferences')||'null');if(typeof value?.reduced==='boolean')document.documentElement.dataset.mkReduced=String(value.reduced);}catch{}if(reduced())clear();}
 document.addEventListener('meja-preferences',syncMotion);
 window.addEventListener('storage',event=>{if(event.key==='mejakita.preferences'||event.key===null)syncMotion();});
 syncMotion();

 window.MejaCosmetics=Object.freeze({configure,effect,classes,entrance,decorate,kindName,clear,preview,reduced});
})();
