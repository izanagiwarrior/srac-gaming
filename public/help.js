/* Shared optional help: hover, focus, or tap. No game actions or account changes. */
'use strict';
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const selector='.features p,.feature p,[data-mk-help-note],.setting-label>small,.mk-primary-settings>small,.mk-primary-settings>.mk-note,#settings-form .field>small,#settings-form>p.small.muted,#lobby .cap,#landing .cap,#lobby .fast-toggle small,#hk-rules-copy,#handhighlight-copy,#mj-preset-copy,.ac-auth-foot';
 const protectedArea='dialog,[role="alert"],[role="status"],[role="timer"],.status,.turn-clock,.error,.ac-error,.mk-session-notice,.mk-session-health';
 const records=new WeakMap(),groups=new WeakMap(),sources=new WeakMap();let active=null,pop=null,pinned=false,leaveTimer=null,frame=null,queued=false,focusOpened=false;
 const icon=(text,label='Detail')=>`<span class="mk-help-trigger" role="button" tabindex="0" data-mk-help="${esc(text)}" data-mk-help-key="${esc(label+':'+text)}" aria-label="Bantuan: ${esc(label)}" aria-expanded="false">?</span>`;
 // Keep content as text: help strings never become executable HTML.
 function renderHelp(node,value){
  const text=String(value??'').trim();
  node.dataset.helpSource=text;
  const blocks=text.split(/\n+/).map(x=>x.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean);
  const items=blocks.flatMap(block=>block.length>120?block.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/).map(x=>x.trim()).filter(Boolean):[block]);
  node.replaceChildren();
  if(items.length>1){const list=document.createElement('ul');for(const item of items){const row=document.createElement('li');row.textContent=item;list.append(row);}node.append(list);}
  else{const paragraph=document.createElement('p');paragraph.textContent=text;node.append(paragraph);}
 }
 function described(el,on){const ids=(el.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&x!=='mk-help-popover');if(on)ids.push('mk-help-popover');if(ids.length)el.setAttribute('aria-describedby',ids.join(' '));else el.removeAttribute('aria-describedby');el.setAttribute('aria-expanded',String(on));}
 function close(){clearTimeout(leaveTimer);if(frame!==null)cancelAnimationFrame(frame);frame=null;if(active)described(active,false);pop?.remove();active=pop=null;pinned=false;focusOpened=false;}
 function place(){frame=null;if(!pop||!active?.isConnected)return;const r=active.getBoundingClientRect(),pad=12,gap=8;pop.style.maxWidth=Math.max(100,Math.min(340,innerWidth-pad*2))+'px';pop.style.maxHeight=Math.max(100,innerHeight-pad*2)+'px';const b=pop.getBoundingClientRect(),below=r.bottom+gap;pop.style.left=Math.max(pad,Math.min(r.left,innerWidth-b.width-pad))+'px';pop.style.top=Math.max(pad,Math.min(below+b.height<=innerHeight-pad?below:r.top-gap-b.height,innerHeight-b.height-pad))+'px';}
 function layout(){if(pop&&frame===null)frame=requestAnimationFrame(place);}
 function open(el,focus=false){clearTimeout(leaveTimer);if(active===el){focusOpened ||= focus;return;}close();active=el;focusOpened=focus;pop=document.createElement('div');pop.id='mk-help-popover';pop.className='mk-help-popover';pop.setAttribute('role','tooltip');renderHelp(pop,el.dataset.mkHelp);(el.closest('dialog[open]')||document.body).append(pop);described(el,true);place();}
 function later(){clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{if(!pinned&&!active?.matches(':focus')&&!pop?.matches(':hover'))close();},160);}
 function trigger(e){return e.target.closest?.('[data-mk-help]');}
 document.addEventListener('pointerover',e=>{const el=trigger(e);if(el){if(!pinned||active===el)open(el);}else if(pop?.contains(e.target))clearTimeout(leaveTimer);});
 document.addEventListener('pointerout',e=>{if(trigger(e)||pop?.contains(e.target))later();});
 document.addEventListener('focusin',e=>{const el=trigger(e);if(el)open(el,true);else if(!pinned)close();});
 document.addEventListener('focusout',e=>{if(trigger(e))later();});
 document.addEventListener('click',e=>{const el=trigger(e);if(el){e.preventDefault();e.stopPropagation();if(active===el&&pinned){close();return;}open(el);pinned=true;}else if(!pop?.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();close();return;}const el=trigger(e);if(el&&['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();el.click();}});
 addEventListener('resize',layout);addEventListener('scroll',layout,{capture:true,passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
 function sync(el){const text=[...(sources.get(el)||[])].filter(n=>n.isConnected).map(n=>n.textContent.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n\n');el.dataset.mkHelp=text;if(active===el&&pop&&pop.dataset.helpSource!==text){renderHelp(pop,text);layout();}}
 function enhance(){queued=false;
  const lost=active&&!active.isConnected?{key:active.dataset.mkHelpKey,pinned,focus:focusOpened}:null;
  for(const note of document.querySelectorAll(selector)){
   if(note.id==='spect'||note.closest(protectedArea)||note.querySelector('a,button,input,select,textarea,table,img,[data-mk-help],[role="alert"]'))continue;
   const text=note.textContent.replace(/\s+/g,' ').trim();if(text.length<24)continue;
   let r=records.get(note);
   if(r?.trigger.isConnected){sync(r.trigger);continue;}
   const previous=note.previousElementSibling;
   const group=note.closest('label,.setting-label,.field')||(previous?.querySelector('[data-mk-play-mode],[data-mk-clock-mode]')?previous:null)||(note.parentElement?.matches('.mk-primary-settings')?note.parentElement.querySelector('[data-mk-rate]')?.closest('label'):null)||(previous?.matches('label')?previous:null);
   const heading=group?.querySelector('b,strong')||(!group&&previous?.matches('h1,h2,h3,h4,b,strong')?previous:null),legend=note.closest('fieldset')?.querySelector('legend');
   const fieldText=[...(group?.childNodes||[])].find(n=>n.nodeType===3&&n.textContent.trim())?.textContent?.trim();
   const named={'mj-preset-copy':'Gaya bermain','claim-mode-copy':'Mode klaim','hk-rules-copy':'Aturan Hu','handhighlight-copy':'Highlight set'};
   const headingText=heading?[...heading.childNodes].filter(n=>n.nodeType!==1||!n.matches('[data-mk-help]')).map(n=>n.textContent).join('').trim():'';
   const label=note.dataset.mkHelpNote||named[note.id]||headingText||fieldText||(note.matches('.ac-auth-foot')?'Keamanan akun':note.closest('.mk-primary-settings')?'Pengaturan meja':'Detail');
   const anchor=heading||legend||group,old=(anchor&&groups.get(anchor))||records.get(previous)?.trigger;let button=old?.isConnected?old:null;
   const insertLabeledHelp=()=>{const row=document.createElement('span');row.className='mk-help-label mk-help-standalone';const caption=document.createElement('span');caption.className='mk-help-label-text';caption.textContent=label;row.append(caption,button);note.before(row);};
   if(!button){const box=document.createElement('span');box.innerHTML=icon(text,label);button=box.firstElementChild;button.dataset.mkHelpKey=note.id||label+':'+text;sources.set(button,new Set());if(anchor)groups.set(anchor,button);
   const control=group?.querySelector('input,select,textarea');if(control&&!control.hasAttribute('aria-label')&&!control.hasAttribute('aria-labelledby')&&(headingText||fieldText))control.setAttribute('aria-label',headingText||fieldText);
   if(heading)heading.append(button);else if(legend)legend.append(button);else if(group){const control=group.querySelector('input,select,textarea');if(control&&fieldText){const row=document.createElement('span');row.className='mk-help-label';for(const n of [...group.childNodes]){if(n===control)break;if(n.nodeType===3&&n.textContent.trim())row.append(n);}const text=document.createElement('span');text.className='mk-help-label-text';while(row.firstChild)text.append(row.firstChild);row.append(text,button);group.insertBefore(row,control);}else if(control)group.insertBefore(button,control);else insertLabeledHelp();}else insertLabeledHelp();
   }
   sources.get(button).add(note);sync(button);
   note.classList.add('mk-help-source');note.setAttribute('aria-hidden','true');records.set(note,{trigger:button});
  }
  for(const button of document.querySelectorAll('[data-mk-help]')){
   const parent=button.parentElement;if(!parent||parent.classList.contains('mk-help-label'))continue;
   if(!parent.matches('h1,h2,h3,h4,b,strong,legend,p,.ac-login-access')||parent.querySelector('input,select,textarea,a,button'))continue;
   if([...parent.children].some(el=>el!==button&&el.matches('[data-mk-help],.mk-help-label-text')))continue;
   const text=document.createElement('span');text.className='mk-help-label-text';
   for(const n of [...parent.childNodes])if(n!==button)text.append(n);
   parent.prepend(text);parent.classList.add('mk-help-label');
  }
  if(lost){const next=[...document.querySelectorAll('[data-mk-help]')].find(el=>el.dataset.mkHelpKey===lost.key&&el.getClientRects().length);if(next){open(next,lost.focus);pinned=lost.pinned;if(lost.focus&&document.activeElement===document.body)next.focus({preventScroll:true});}else close();}
 }
 function queue(){if(queued)return;queued=true;queueMicrotask(enhance);}
 function start(){enhance();new MutationObserver(rows=>{if(rows.some(r=>!r.target.closest?.('.mk-help-popover')))queue();}).observe(document.body,{childList:true,characterData:true,subtree:true});}
 window.MejaHelp={icon,refresh:queue,close};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
