(() => {
  'use strict';
  const {BookState, geometry, smooth} = window.CardMath;
  const $ = id => document.getElementById(id);
  const pages = [
    {sprite:'assets/pochacco-1.png', title:'Для тебя', text:'Пусть каждый день приносит немного тепла и маленькое чудо.', note:'С теплом,', label:'Приветствие'},
    {sprite:'assets/pochacco-2.png', title:'Вкусного счастья!', text:'Иногда для хорошего дня нужен всего один очень вкусный бургер.', note:'Не забудь поесть', label:'Почакко ест бургер'},
    {sprite:'assets/pochacco-3.png', title:'Сладких моментов', text:'Пусть радость тает на языке, а заботы — где-то далеко.', note:'Лови сладкий момент', label:'Почакко с мороженым'},
    {sprite:'assets/pochacco-4.png', title:'Я чуть-чуть злюсь…', text:'Но всё равно очень хочу, чтобы ты улыбнулся. Вот так!', note:'Даже когда сердитый,', label:'Милая сердитая мордочка'}
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = new BookState({duration:reduced ? 340 : 2900, turnDuration:reduced ? 180 : 850});
  let width = 200, raf = 0, last = null, sound = true, pointer = null, announced = -1;
  const openingAudio=$('openingAudio'); let audioEpoch=0, suppressPageClickUntil=0;
  const leafNodes = [];
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function half(side, page) { const h = el('div','popup-half popup-'+side); h.dataset.popup = side+'-'+page; h.setAttribute('aria-hidden','true'); h.style.setProperty('--sprite',`url("${pages[page].sprite}")`); h.append(el('span','join-marker')); return h; }
  function texture(face, file) { const image = el('img','texture'); image.src = file; image.alt = ''; image.draggable = false; face.append(image); }
  function pageZone(side,page){const button=el('button','page-zone');button.type='button';button.dataset.zone=side;button.dataset.zonePage=String(page);button.setAttribute('aria-label',side==='left'?(page===0?'Закрыть открытку':'Предыдущая страница'):(page===3?'Закрыть открытку':'Следующая страница'));button.addEventListener('click',event=>{if(event.detail&&performance.now()<suppressPageClickUntil)return;if(state.progress!==1||!state.target||state.flip)return;const direction=side==='left'?-1:1;if(state.page+direction<0||state.page+direction>3)toggle();else turn(direction);});return button;}
  function face(page, back = false) {
    const f = el('div','face '+(back ? 'inside' : 'page-front'));
    texture(f,back ? 'assets/inside-left.png' : 'assets/inside-right.png');
    f.append(half(back ? 'left' : 'right',page));
    f.append(el('div','paper-tab tab-'+(back ? 'left' : 'right')));
    if (back) { const caption = el('div','left-caption'); caption.append(el('span','',pages[page].note),el('b','','Почакко'),el('i','','✦')); f.append(caption); }
    else {
      const bow = el('img','page-bow'); bow.src = 'assets/bow.png'; bow.alt = ''; f.append(bow,el('span','page-number',['I','II','III','IV'][page]));
      const greeting = el('div','greeting'); greeting.dataset.greeting = String(page); greeting.append(el('span','tiny','POCHACCO · FOR YOU'),el('h2','',pages[page].title),el('p','',pages[page].text)); f.append(greeting);
    }
    f.append(pageZone(back?'left':'right',page));return f;
  }
  for (let i=0;i<3;i++) { const leaf=el('div','leaf'); leaf.dataset.leaf=String(i); leaf.append(face(i),face(i+1,true)); $('leaves').append(leaf); leafNodes.push(leaf); }
  const lastPage = el('div','last-page'); lastPage.append(face(3)); $('leaves').prepend(lastPage);
  const firstLeft = document.querySelector('[data-popup="left-0"]'); firstLeft.style.setProperty('--sprite',`url("${pages[0].sprite}")`);
  $('coverInside').append(pageZone('left',0));
  for (let i=0;i<4;i++) { const dot=el('button'); dot.type='button'; dot.setAttribute('aria-label','Страница '+(i+1)+': '+pages[i].label); dot.dataset.page=String(i); dot.addEventListener('click',()=>{ if (Math.abs(i-state.page)===1) turn(i-state.page); }); $('pageDots').append(dot); }
  function size() {
    const available = Math.min(innerWidth-48,720);
    width = Math.max(105,Math.min(available/2.12,Math.max(110,(innerHeight-280)/1.8),270));
    document.documentElement.style.setProperty('--page-w',width+'px'); document.documentElement.style.setProperty('--page-h',width*1.5+'px'); render();
  }
  function stopOpeningSound(){ audioEpoch++; openingAudio.pause(); try{openingAudio.currentTime=0;}catch{} }
  function playOpeningSound(){
    stopOpeningSound(); if(!sound)return;
    const epoch=audioEpoch; openingAudio.volume=.8;
    try{const promise=openingAudio.play();promise?.catch(error=>{if(epoch===audioEpoch&&error.name!=='AbortError')$('sound').textContent='♪ Звук недоступен';});}
    catch{$('sound').textContent='♪ Звук недоступен';}
  }
  function wake() { if (!raf && !document.hidden) { last=null; raf=requestAnimationFrame(frame); } }
  function frame(now) { raf=0; if(document.hidden)return; state.tick(last===null ? 0 : now-last); last=now; render(); if(state.moving)raf=requestAnimationFrame(frame); }
  function render() {
    const g=geometry(state.progress,width,state.flip ? 0 : state.reveal),root=document.documentElement;
    for (const [key,value] of Object.entries({'--angle':g.angle+'deg','--lift':g.lift+'px','--seam':g.seam+'px','--popup':g.popup,'--greeting':g.greeting,'--glow':g.glow,'--shift':g.shift+'px','--book-scale':g.scale}))root.style.setProperty(key,String(value));
    const f=state.flip, current=state.page;
    const oldLeftVisible=!f || f.t<.54;
    $('coverInside').style.visibility=(current===0&&oldLeftVisible) ? 'visible' : 'hidden';
    lastPage.style.visibility=(current===3||f?.to===3) ? 'visible' : 'hidden';
    for (let i=0;i<3;i++) {
      // Already turned leaves close together with the cover, rather than staying open at 158deg.
      let angle=i<current ? g.angle : 0, visible=i===current || (i===current-1&&oldLeftVisible);
      if(f) { visible ||= i===f.leaf || i===f.to || i===f.to-1; if(i===f.leaf)angle=f.to>f.from ? 158*smooth(.06,.94,f.t) : 158*(1-smooth(.06,.94,f.t)); }
      leafNodes[i].style.visibility=visible ? 'visible' : 'hidden'; leafNodes[i].style.transform=`rotateY(${-angle}deg)`;
    }
    const activePage=f ? -1 : current;
    document.querySelectorAll('[data-popup]').forEach(node=>node.style.visibility=Number(node.dataset.popup.split('-').pop())===activePage ? 'visible' : 'hidden');
    const open=state.progress===1&&state.target===1, closed=state.progress===0&&state.target===0;
    $('book').classList.toggle('moving',state.moving);
    $('seal').setAttribute('aria-expanded',String(!!state.target));
    $('toggle').textContent=state.target ? 'Закрыть открытку ↙' : 'Открыть открытку ↗';
    $('pageNav').classList.toggle('visible',open);
    $('previous').disabled=!open||!!f||current===0; $('next').disabled=!open||!!f||current===3;
    document.querySelectorAll('[data-zone]').forEach(button=>{button.disabled=!open||!!f||Number(button.dataset.zonePage)!==current;button.setAttribute('aria-hidden',String(button.disabled));});
    $('hint').textContent=closed ? 'Коснись обложки' : open&&!f ? 'Слева — назад, справа — вперёд' : '';
    $('message').hidden=!open||!!f; $('message').textContent=pages[current].text;
    document.querySelectorAll('[data-page]').forEach(dot=>{dot.setAttribute('aria-current',String(Number(dot.dataset.page)===current));dot.disabled=!open||!!f||Math.abs(Number(dot.dataset.page)-current)>1;});
    if(open&&!f&&state.reveal===1&&announced!==current){announced=current;$('reading').textContent=pages[current].label+'. '+pages[current].title+'. '+pages[current].text;}
    // Small read-only diagnostics used by browser geometry tests.
    $('book').dataset.progress=state.progress.toFixed(5); $('book').dataset.page=String(current); $('book').dataset.flipping=String(!!f);
  }
  function toggle() { state.toggle(); announced=-1; if(state.target){playOpeningSound();try{navigator.vibrate?.(12);}catch{}}else stopOpeningSound();render();wake(); }
  function turn(direction) { if(state.turn(direction)){announced=-1;render();wake();} }
  $('seal').addEventListener('click',event=>{if(!event.detail||performance.now()>=suppressPageClickUntil)toggle();}); $('toggle').addEventListener('click',toggle);
  $('next').addEventListener('click',()=>turn(1));$('previous').addEventListener('click',()=>turn(-1));
  $('reset').addEventListener('click',()=>{stopOpeningSound();cancelAnimationFrame(raf);raf=0;last=null;state.reset();announced=-1;render();});
  $('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'♪ Звук включён':'♪ Звук выключен';if(!sound)stopOpeningSound();});
  $('stage').addEventListener('pointerdown',e=>{if(e.button===0)pointer={x:e.clientX,y:e.clientY};});
  $('stage').addEventListener('pointercancel',()=>pointer=null);
  $('stage').addEventListener('pointerup',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.hypot(dx,dy)>=8)suppressPageClickUntil=performance.now()+450;if(Math.abs(dx)>55&&Math.abs(dy)<50)turn(dx<0?1:-1);});
  document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')turn(1);if(e.key==='ArrowLeft')turn(-1);if(e.key==='Escape'&&state.target){stopOpeningSound();state.setOpen(false);render();wake();}});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=null;if(document.hidden)stopOpeningSound();else if(state.moving)wake();});
  addEventListener('pagehide',stopOpeningSound);
  addEventListener('resize',size); size();
  if(!CSS.supports('transform-style','preserve-3d')){$('assetError').hidden=false;$('assetError').textContent='Для объёмной открытки нужно обновить Android System WebView.';}
  const files=['assets/cover.png','assets/inside-left.png','assets/inside-right.png','assets/bow.png',...pages.map(p=>p.sprite)];
  Promise.all(files.map(file=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=file;}))).then(results=>{document.body.dataset.assetsReady=String(results.every(Boolean));if(results.includes(false))$('assetError').hidden=false;});
})();
