/* Presentation only: settlement and legality stay on the server. */
(() => {
  let active=null;
  function cancel(){if(!active)return;clearTimeout(active.timer);active.node.remove();active=null;}
  function play(result,done){
    cancel();
    if(document.hidden){done();return;}
    const reduced=window.MejaRoom?.preferences().reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node=document.createElement('section');node.className='mj-hu'+(reduced?' mj-hu-reduced':'');
    node.setAttribute('role','dialog');node.setAttribute('aria-label','Hu! Tangan menang');node.setAttribute('aria-modal','true');
    const rays=document.createElement('div');rays.className='mj-hu-rays';rays.setAttribute('aria-hidden','true');node.append(rays);
    const burst=document.createElement('div');burst.className='mj-hu-burst';burst.setAttribute('aria-hidden','true');
    if(!reduced)for(let i=0;i<(Number(result.fan)>=7?48:32);i++){
      const dot=document.createElement('i'),angle=i*2.39996;
      dot.style.setProperty('--x',Math.cos(angle)*(190+i%7*28)+'px');dot.style.setProperty('--y',Math.sin(angle)*(160+i%5*30)+'px');
      dot.style.setProperty('--delay',(i%6)*.055+'s');dot.style.setProperty('--spin',(i%2?1:-1)*(180+i*11)+'deg');burst.append(dot);
    }
    node.append(burst);
    const card=document.createElement('div');card.className='mj-hu-card';
    const mark=document.createElement('div');mark.className='mj-hu-mark';mark.textContent='胡';mark.setAttribute('aria-hidden','true');
    const title=document.createElement('h2');title.textContent=result.zimo?'ZIMO · HU!':'HU!';
    const name=document.createElement('p');name.className='mj-hu-name';name.textContent=result.name+' menang';
    const fan=document.createElement('p');fan.className='mj-hu-fan';fan.textContent=String(result.fan)+' fan'+(Number.isFinite(result.points)?' · +'+result.points+' poin':'');
    const button=document.createElement('button');button.type='button';button.className='btn mj-hu-skip';button.textContent='Lihat hasil';
    card.append(mark,title,name,fan,button);node.append(card);document.body.append(node);
    const previous=document.activeElement;
    const finish=()=>{if(active?.node!==node)return;cancel();if(previous?.isConnected)previous.focus({preventScroll:true});done();};
    active={node,timer:setTimeout(finish,reduced?450:2700),finish};
    button.addEventListener('click',finish);
    node.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();finish();}if(event.key==='Tab'){event.preventDefault();button.focus();}});
    button.focus({preventScroll:true});
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)active?.finish();});
  document.addEventListener('meja-preferences',()=>active?.finish());
  window.MahjongHu={play,cancel};
})();
