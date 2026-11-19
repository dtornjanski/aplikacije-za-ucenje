(function(){
  'use strict';
  const E=window.WorldEngine,P=window.WorldPractice;
  const app=document.getElementById('app'),announcer=document.getElementById('announcer');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const button=(label,action,classes='button',attrs='')=>`<button type="button" class="${classes}" data-action="${action}" ${attrs}>${label}</button>`;
  const lumi=(className='')=>`<svg class="lumi ${className}" viewBox="0 0 190 190" role="img" aria-label="Lumi, znatiželjna krijesnica"><ellipse cx="61" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(-28 61 79)"/><ellipse cx="129" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(28 129 79)"/><ellipse cx="95" cy="103" rx="34" ry="58" fill="#f6c84b" stroke="#163d31" stroke-width="6"/><path d="M68 105h54M70 128h50" stroke="#163d31" stroke-width="7"/><circle cx="84" cy="76" r="6" fill="#163d31"/><circle cx="106" cy="76" r="6" fill="#163d31"/><path d="M83 91c7 6 17 6 24 0" fill="none" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><path d="M79 49 65 31m46 18 14-18" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="29" r="5" fill="#c9484b"/><circle cx="126" cy="29" r="5" fill="#c9484b"/><circle cx="95" cy="157" r="23" fill="#fff4ad" opacity=".8"/></svg>`;
  const prefix='world-explorers-v2/',runPrefix=prefix+'run/';
  const runs=new Map(),memoryOnly=new Set(),unavailable=Symbol();
  let history={},session=null,level='easy',view='home',chosenWorld=null,lastSeed=0;
  const current=()=>session.questions[session.index];
  const worldName=id=>P.worlds.find(w=>w.id===id)?.name||'Miješana ekspedicija';
  const levelName=id=>P.levels.find(l=>l.id===id).name;
  const scope=(level,world,lesson,review)=>[level,world,lesson||'sve',review?'ponavljanje':'vjezba'].join('/');
  const scopeOf=s=>scope(s.level,s.world,s.lesson,s.review);
  const titleOf=s=>(s.review?'Ponavljanje · ':'')+(s.lesson?P.lessonById.get(s.lesson).name:worldName(s.world));
  function read(key,fallback=null){
    let raw;
    try{raw=localStorage.getItem(key);}catch{return fallback;}
    try{return JSON.parse(raw);}catch{return null;}
  }
  function write(key,data){try{localStorage.setItem(key,JSON.stringify(data));return true;}catch{return false;}}
  function remember(newRound=false){
    const key=scopeOf(session),disk=read(runPrefix+key),previous=runs.get(key);
    if(!newRound&&disk?.state&&previous&&disk.updated>previous.updated){
      const concurrent=P.restore(disk.state);
      if(concurrent&&scopeOf(concurrent)===key){
        const ahead=concurrent.index>session.index||concurrent.index===session.index&&concurrent.solved[session.index]&&!session.solved[session.index];
        if(concurrent.seed!==session.seed||ahead||concurrent.phase==='complete')session=concurrent;
      }
    }
    const entry={updated:Math.max(Date.now(),(previous?.updated||0)+1,(disk?.updated||0)+1),state:JSON.parse(E.serialize(session))};
    runs.set(key,entry);
    if(write(runPrefix+key,entry))memoryOnly.delete(key);else memoryOnly.add(key);
  }
  function loadEntry(key){
    const disk=read(runPrefix+key,unavailable),local=runs.get(key);
    let entry=local;
    if(disk!==unavailable){
      if(!disk&&!memoryOnly.has(key))entry=null;
      if(disk&&(!local||disk.updated>local.updated))entry=disk;
    }
    const restored=entry&&P.restore(entry.state);
    if(!restored||scopeOf(restored)!==key){runs.delete(key);return null;}
    runs.set(key,entry);return restored;
  }
  function record(refs){
    const stored=read(prefix+'history')||{};
    for(const key of Object.keys(stored))if(Array.isArray(stored[key]))history[key]=stored[key];
    P.record(history,session.level,refs);write(prefix+'history',history);
  }
  function load(){
    try{
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);if(!key?.startsWith(runPrefix))continue;
        const entry=read(key),id=key.slice(runPrefix.length),restored=entry&&P.restore(entry.state);
        if(restored&&scopeOf(restored)===id)runs.set(id,entry);
      }
    }catch{/* Storage is optional. */}
    const stored=read(prefix+'history');
    if(stored&&typeof stored==='object')for(const [key,value] of Object.entries(stored))if(Array.isArray(value))history[key]=value;
    if(!runs.size){
      const old=P.restore(read('world-explorers-session-v1'));
      if(old){session=old;remember();record(old.questions.map(q=>q.ref));}
    }
  }
  function seed(){
    const values=new Uint32Array(1);
    try{crypto.getRandomValues(values);}catch{values[0]=Math.floor(Math.random()*0x100000000);}
    let next=values[0];if(next===lastSeed)next=(next+1)>>>0;
    lastSeed=next;return next;
  }
  let announcementTimer;
  function announce(text,delay=0){
    clearTimeout(announcementTimer);
    announcer.textContent='';
    announcementTimer=setTimeout(()=>{announcer.textContent=text;},delay);
  }
  const eqAttr=(selector,attr,value)=>[...app.querySelectorAll(selector)].find(node=>node.dataset[attr]===String(value));
  const browserHistory=window.history,pageKey='worldExplorersScreen',pages=new Map();
  const controls='button,select,input,a[href],summary,[tabindex]',appPath=location.pathname;
  let page,timer,renderedURL;
  function focusKey(node,index){
    if(!node||node===app||!app.contains(node))return null;
    if(node.id)return 'id/'+node.id;
    if(node.tagName==='SUMMARY')return 'group/'+node.parentElement.dataset.group;
    for(const key of ['unit','lesson','lessons','world','level','run','action']){
      if(node.dataset[key])return key+'/'+node.dataset[key];
    }
    return 'control/'+(index??[...app.querySelectorAll(controls)].indexOf(node));
  }
  function render(focus,position){
    app.innerHTML=view==='home'?home():view==='worlds'?worlds():view==='lessons'?lessonMenu():view==='book'?bookMenu():play();
    if(view==='book')updatePageLookup();
    if(position)for(const details of app.querySelectorAll('details[data-group]')){
      details.open=position.opened.includes(details.dataset.group);
    }
    const remembered=position?.focus&&[...app.querySelectorAll(controls)].find((node,i)=>!node.disabled&&!node.closest('[hidden]')&&focusKey(node,i)===position.focus);
    if(remembered&&remembered.tagName!=='SUMMARY'){
      const details=remembered.closest('details');
      if(details)details.open=true;
    }
    const target=remembered||focus?.()||app;
    try{target.focus({preventScroll:true});}catch{target.focus();}
    if(Array.isArray(position?.scroll)&&position.scroll.length===2)window.scrollTo(...position.scroll);
    else if(target!==app)target.scrollIntoView?.({block:'nearest',inline:'nearest'});
    else window.scrollTo(0,0);
  }
  function browserPage(){
    try{
      const entry=browserHistory.state?.[pageKey];
      if(entry?.id&&['home','worlds','lessons','book','play'].includes(entry.view)&&
        P.levels.some(item=>item.id===entry.level)&&Array.isArray(entry.opened))return entry;
    }catch{/* The catalogue and exercises can also run offline. */}
    return null;
  }
  function storePage(method,entry,changeURL=false){
    try{
      const state={...browserHistory.state,[pageKey]:entry};
      if(changeURL){
        const url=new URL(location.href);
        url.hash=entry.view==='book'?'gradivo':'';
        if(entry.view==='play'&&P.unitById.has(entry.lesson))url.hash=unitHash(entry.lesson,entry.level);
        try{browserHistory[method](state,'',url.href);return;}catch{/* Some file readers only accept state changes. */}
      }
      browserHistory[method](state,'');
    }catch{/* Same-tab navigation can still restore screens from memory. */}
  }
  function newPage(next,previous){
    return {id:window.crypto?.randomUUID?.()||Math.random().toString(36).slice(2),view:next,previous,level,world:chosenWorld,
      run:next==='play'?scopeOf(session):null,lesson:next==='play'?session.lesson:null,opened:[],focus:null,scroll:[0,0]};
  }
  function checkpoint(node=document.activeElement,save=true){
    clearTimeout(timer);
    if(!page)return;
    page.opened=[...app.querySelectorAll('details[data-group][open]')].map(details=>details.dataset.group);
    page.focus=focusKey(node);
    page.scroll=[window.scrollX,window.scrollY];
    if(save&&browserPage()?.id===page.id)storePage('replaceState',page);
  }
  function scheduleCheckpoint(){
    clearTimeout(timer);timer=setTimeout(()=>checkpoint(),120);
  }
  function parentPage(next,child){
    const previous=child.previous?.view===next&&pages.get(child.previous.id);
    if(previous)return {...previous,id:child.id,previous:child.previous};
    const parent={...child,view:next,run:null,lesson:null,opened:[],scroll:null,focus:null};
    const unit=P.unitById.get(child.lesson);
    if(next==='book'&&unit){
      const group=P.bookGroups.filter(([start])=>start<=unit.from).at(-1);
      parent.opened=[String(group[0])];parent.focus='unit/'+unit.id;
    }else if(next==='lessons')parent.focus='lesson/'+child.lesson;
    else if(next==='worlds'&&child.world)parent.focus='world/'+child.world;
    return parent;
  }
  function show(entry,saved){
    clearTimeout(timer);
    if(entry.view==='play'){
      session=saved||loadEntry(entry.run);
      if(!session){
        const parent=P.unitById.has(entry.lesson)?'book':P.lessons.some(l=>l.id===entry.lesson)?'lessons':'worlds';
        entry=parentPage(parent,entry);storePage('replaceState',entry,true);
      }
    }
    if(entry.view==='lessons'&&!P.worlds.some(w=>w.id===entry.world)){
      entry=parentPage('worlds',entry);storePage('replaceState',entry,true);
    }
    page=entry;pages.set(page.id,page);view=page.view;level=page.level;chosenWorld=page.world;
    renderedURL=location.href;render(null,page);
  }
  function navigate(next,button){
    checkpoint(button);
    const same=next===view;
    if(same&&next!=='play')return;
    const entry=newPage(next,same?page.previous:{id:page.id,view});
    if(same)entry.id=page.id;
    storePage(same?'replaceState':'pushState',entry,true);
    show(entry,session);
  }
  function goParent(next,button){
    checkpoint(button);
    if(page.previous?.view===next){
      if(browserPage()?.id===page.id){
        try{browserHistory.back();return;}catch{/* Restore the parent in memory if traversal is unavailable. */}
      }
      const previous=pages.get(page.previous.id);
      if(previous){show(previous);return;}
    }
    const entry=parentPage(next,page);
    storePage('replaceState',entry,true);show(entry);
  }
  const unitHash=(id,difficulty)=>'#vjezba/'+id+'/'+difficulty;
  function linkedPage(existing,previous){
    if(location.hash!=='#vjezba'&&!location.hash.startsWith('#vjezba/'))return null;
    const parts=location.hash.split('/');
    const unit=P.unitById.get(parts[1]),difficulty=parts[2];
    if(parts.length!==3||!unit||!P.levels.some(item=>item.id===difficulty)){
      return {...newPage('book',previous),invalidLink:true};
    }
    if(existing?.view==='play'&&existing.lesson===unit.id&&existing.level===difficulty)return existing;
    level=difficulty;
    selectPractice(unit.world,unit.id);
    return newPage('play',previous);
  }
  function locationChanged(){
    if(location.pathname!==appPath)return;
    const incoming=browserPage();
    if(renderedURL===location.href&&(!incoming||incoming.id===page.id))return;
    checkpoint(document.activeElement,false);
    const previous={id:page.id,view};
    const stored=incoming&&(pages.get(incoming.id)||incoming);
    let entry=linkedPage(stored,previous)||stored;
    if(!entry){
      const anchor=location.hash&&location.hash!=='#gradivo';
      const next=anchor?view:location.hash==='#gradivo'?'book':'home';
      entry=newPage(next,previous);
      if(anchor)Object.assign(entry,{opened:page.opened,focus:page.focus,scroll:page.scroll,lookup:page.lookup});
    }
    storePage('replaceState',entry,!!entry.invalidLink);show(entry);
  }
  function resume(button,key){
    const saved=loadEntry(key);
    if(!saved){render(null,page);return;}
    session=saved;level=session.level;chosenWorld=session.world;remember();navigate('play',button);
  }
  function selectPractice(world,lesson,repeat){
    const id=scope(level,world,lesson,!!repeat),saved=loadEntry(id);
    if(!repeat&&saved&&saved.phase!=='complete'){
      session=saved;chosenWorld=world;remember();return;
    }
    const value=seed(),plan=P.makePlan(level,world,value,history,lesson,repeat);
    session=E.createSession(level,world,value,P.buildRound(level,world,value,plan));
    session.lesson=lesson;session.review=!!repeat;chosenWorld=world;
    record(plan);remember(true);
  }
  function start(button,world,lesson=null,repeat=null){
    selectPractice(world,lesson,repeat);navigate('play',button);
  }
  function active(){
    return [...runs.entries()].filter(([,entry])=>entry.state.phase!=='complete').sort((a,b)=>b[1].updated-a[1].updated);
  }
  function resumeCard([id,entry]){
    const s=entry.state,total=s.attempts.length;
    return `<article class="resume"><div><strong>${esc(titleOf(s))}</strong><p>${levelName(s.level)} · Zadatak ${s.index+1} od ${total}</p></div>${button('Nastavi →','resume','button',`data-run="${esc(id)}" aria-label="Nastavi: ${esc(titleOf(s))}, ${levelName(s.level)}, zadatak ${s.index+1} od ${total}"`)}</article>`;
  }
  function home(){
    const saved=active();
    const resume=saved.length?`<section class="resume-list" aria-label="Nedovršene vježbe">${resumeCard(saved[0])}${saved.length>1?`<details data-group="other-runs"><summary>Ostale nedovršene vježbe (${saved.length-1})</summary>${saved.slice(1).map(resumeCard).join('')}</details>`:''}</section>`:'';
    return `<section class="home-view"><div class="hero"><div><h1>Istraži svijet uz krijesnicu <span>Lumi.</span></h1></div><div class="hero-art" aria-hidden="true">${lumi('hero-lumi')}<span class="spark one">✦</span></div></div>${resume}<h2 class="section-title">Odaberi razinu</h2><div class="level-grid">${P.levels.map((item,i)=>`<article class="level-card l${i+1}"><span class="level-icon" aria-hidden="true">${item.icon}</span><p>${item.desc}</p>${button(item.name+' →','level','button',`data-level="${item.id}"`)}</article>`).join('')}</div>${button('Pronađi vježbu po stranici udžbenika →','book','book-link')}</section>`;
  }
  const back=(label,action)=>button(label,action,'text-button');
  function worlds(){
    const mixed=button('<span class="world-icon" aria-hidden="true">🎒</span><span><strong>Miješana ekspedicija</strong><small>Po jedan zadatak iz svakog svijeta</small></span><b aria-hidden="true">→</b>','start','world-card mixed','data-world="mix"');
    return `<section><div class="topline">${back('← Početna','home')}<span class="pill">${levelName(level)}</span></div><div class="section-heading"><h1>Što želiš istraživati?</h1></div>${mixed}${button('Pronađi vježbu po stranici udžbenika →','book','book-link')}<div class="world-grid">${P.worlds.map(w=>`<article class="world-tile">${button(`<span class="world-icon" aria-hidden="true">${w.icon}</span><span><strong>${w.name}</strong><small>${w.desc}</small></span><b aria-hidden="true">→</b>`,'start','world-card',`data-world="${w.id}" aria-label="Vježbaj temu: ${w.name}"`)}${button('Odaberi lekciju','lessons','lesson-link',`data-lessons="${w.id}" aria-label="Odaberi lekciju: ${w.name}"`)}</article>`).join('')}</div></section>`;
  }
  function lessonMenu(){
    const w=P.worlds.find(w=>w.id===chosenWorld);
    return `<section class="lesson-menu"><div class="topline">${back('← Svjetovi','worlds')}<span class="pill">${levelName(level)}</span></div><p class="eyebrow">${w.name}</p><h1>Odaberi lekciju</h1><p class="lesson-intro">Pet zadataka iz lekcije koju odabereš.</p><div class="lesson-grid">${P.lessons.filter(l=>l.world===chosenWorld).map(l=>{
      const s=runs.get(scope(level,chosenWorld,l.id,false))?.state,info=s&&s.phase!=='complete'?'Nastavi · zadatak '+(s.index+1)+' od '+s.attempts.length:'Započni vježbu';
      return button(`<span class="world-icon" aria-hidden="true">${l.icon}</span><span><strong>${l.name}</strong><small>${info}</small></span><b aria-hidden="true">→</b>`,'lesson','world-card',`data-lesson="${l.id}"`);
    }).join('')}</div>${button('Vježbaj cijelu temu →','start','button secondary',`data-world="${w.id}"`)}</section>`;
  }
  const pageRange=unit=>unit.from===unit.to?String(unit.from):unit.from+'–'+unit.to;
  const publicApp='https://aplikacije-za-ucenje.onrender.com/istrazivaci-naseg-svijeta/index.html';
  function pageLookupForm(){
    const options=P.levels.map(item=>`<option value="${item.id}" ${item.id===level?'selected':''}>${item.name}</option>`).join('');
    return `<section class="page-finder"><form id="page-lookup" role="search" aria-label="Traženje vježbe po stranici">
      <div class="lookup-fields">
        <label for="book-page">Broj stranice<input id="book-page" type="text" inputmode="numeric" enterkeyhint="search" autocomplete="off" placeholder="npr. 59" value="${esc(page.lookup||'')}"></label>
        <label for="book-level">Razina<select id="book-level">${options}</select></label>
      </div>
      </form>
      <p id="page-lookup-status" role="status" aria-atomic="true"></p>
      <div id="page-match" hidden>
        <div class="lookup-actions"><a id="found-unit" class="button" aria-describedby="page-lookup-status">Vježbaj</a>${button('Kopiraj poveznicu','share-unit','button secondary','id="share-unit"')}</div>
        <p id="share-feedback" role="status" aria-atomic="true"></p>
        <label id="share-manual" for="share-url" hidden>Poveznica za ovu vježbu<input id="share-url" type="text" readonly></label>
      </div>
    </section>`;
  }
  function updatePageLookup(){
    const query=app.querySelector('#book-page').value.trim();
    const number=/^\d+$/.test(query)?Number(query):0;
    const unit=P.units.find(item=>item.from<=number&&number<=item.to);
    const status=app.querySelector('#page-lookup-status'),link=app.querySelector('#found-unit');
    app.querySelector('#page-match').hidden=!unit;
    app.querySelector('#share-manual').hidden=true;
    app.querySelector('#share-feedback').textContent='';
    let message='';
    if(unit){
      message=unit.name+' · str. '+pageRange(unit);
      link.dataset.foundUnit=unit.id;
      link.href=unitHash(unit.id,level);
    }else{
      delete link.dataset.foundUnit;link.removeAttribute('href');
      if(query)message=Number.isSafeInteger(number)&&number>0
        ?'Za stranicu '+number+' još nema vježbe. Odaberi cjelinu ispod.'
        :'Upiši cijeli broj stranice veći od nule.';
      else if(page.invalidLink)message='Poveznica nije prepoznata. Pronađi vježbu po stranici ili cjelini.';
    }
    if(status.textContent!==message)status.textContent=message;
  }
  async function copyUnitLink(){
    const link=app.querySelector('#found-unit');
    if(!link?.dataset.foundUnit)return;
    const hash=link.hash;
    const url=new URL(location.protocol==='http:'||location.protocol==='https:'?location.href:publicApp);
    url.username='';url.password='';url.search='';url.hash=hash;
    const status=app.querySelector('#share-feedback'),manual=app.querySelector('#share-manual');
    manual.hidden=true;
    try{
      await navigator.clipboard.writeText(url.href);
      if(link.isConnected&&link.hash===hash)status.textContent='Poveznica je kopirana.';
    }catch{
      if(!link.isConnected||link.hash!==hash)return;
      manual.hidden=false;
      const field=app.querySelector('#share-url');
      field.value=url.href;field.focus();field.select();
      status.textContent='Kopiraj označenu poveznicu.';
    }
  }
  function bookMenu(){
    const groups=P.bookGroups.map(([start,name],i)=>{
      const finish=P.bookGroups[i+1]?.[0]||Infinity;
      const units=P.units.filter(u=>u.from>=start&&u.from<finish);
      const rows=units.map(u=>{
        const pages=pageRange(u);
        return button('<span>'+esc(u.name)+'</span><small>str. '+pages+'</small>','unit','unit-link','data-unit="'+u.id+'"');
      }).join('');
      return '<details class="book-group" data-group="'+start+'"><summary>'+esc(name)+'</summary><div>'+rows+'</div></details>';
    }).join('');
    const parent={worlds:['← Svjetovi','worlds'],lessons:['← Lekcije','back-lessons'],play:['← Vježba','back-play']}[page.previous?.view]||['← Početna','home'];
    return `<section class="lesson-menu book-menu"><div class="topline">${back(...parent)}</div><h1>Gradivo prema udžbeniku</h1><p class="lesson-intro">Upiši broj stranice ili otvori cjelinu.</p>${pageLookupForm()}${groups}<details class="book-source" data-group="source"><summary>Odakle su brojevi stranica?</summary><p>Uz vježbe su navedene stranice iz tjednog nastavnog plana za Istražujemo naš svijet 2 iz školske godine 2020./21. Plan povezuje gradivo sa stranicama 6–99. Brojevi se mogu razlikovati u tvojem primjerku.</p></details></section>`;
  }
  function progress(){
    const total=session.questions.length,done=E.summarize(session).solved;
    const lessons=session.lesson||page.previous?.view==='lessons';
    return `<div class="topline">${P.unitById.has(session.lesson)?back('← Gradivo','book'):back(lessons?'← Lekcije':'← Svjetovi',lessons?'back-lessons':'worlds')}<span class="pill">${levelName(level)}</span></div><div class="progress-row"><div class="progress" role="progressbar" aria-label="Riješeni zadaci" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">${session.questions.map((_,i)=>`<span class="${session.solved[i]?'done':i===session.index?'current':''}"></span>`).join('')}</div><span class="progress-text">Zadatak ${session.index+1} od ${total}</span></div>`;
  }
  const direction={gore:'↑',desno:'→',dolje:'↓',lijevo:'←'};
  function picture(v){
    if(!v)return '';
    if(v.kind==='table'){
      const water=v.water?`<div class="beakers" aria-hidden="true">${v.water.map(item=>`<div><div class="beaker"><i class="${item.surface?'floating':'sunk'}"></i></div><small>${esc(item.name)}</small></div>`).join('')}</div>`:'';
      function cellContent(cell,row,column){
        if(v.leaves&&column===1)return `<span class="leaf-branch ${row?'late':''}" aria-hidden="true">${'<i></i>'.repeat(v.leaves[row])}</span><span>${v.leaves[row]}</span>`;
        return esc(cell);
      }
      const rows=v.rows.map((row,r)=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${esc(cell)}</th>`:`<td>${cellContent(cell,r,i)}</td>`).join('')}</tr>`).join('');
      return `<figure class="data-figure">${water}<table class="data-table" ${v.readable?'aria-label="'+esc(v.caption+'. '+v.readable)+'"':''}><caption>${esc(v.caption)}</caption><thead><tr>${v.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></figure>`;
    }
    if(v.kind==='clock'){
      const position=m=>m===0?'na 12':'na '+(m/5),hour=v.m?'između '+v.h+' i '+(v.h%12+1):'na '+v.h;
      const numbers=Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6;return `<span class="clock-number" style="left:${50+40*Math.sin(angle)}%;top:${50-40*Math.cos(angle)}%">${i||12}</span>`;}).join('');
      return `<div class="clock-layout"><div class="clock-face" role="img" aria-label="Ura. Kratka kazaljka je ${hour}, a duga ${position(v.m)}.">${numbers}<i class="hand hour" style="transform:rotate(${v.h*30+v.m/2}deg)"></i><i class="hand minute" style="transform:rotate(${v.m*6}deg)"></i><b class="pin"></b></div>${picture(v.detail)}</div>`;
    }
    if(v.kind==='calendar'){
      const names=['Pon','Uto','Sri','Čet','Pet','Sub','Ned'],days=window.WorldLessons.days;
      const weeks=Array.from({length:Math.ceil((v.first+v.count)/7)},(_,w)=>`<tr>${names.map((_,d)=>{const day=w*7+d-v.first+1;if(day<1||day>v.count)return '<td></td>';return `<td class="${day===v.day?'trip':''}">${day===v.day?'<span aria-label="Izlet">★</span>':''}${day}</td>`;}).join('')}</tr>`).join('');
      return `<figure class="data-figure"><table class="calendar"><caption>${v.month} ${v.year}.</caption><thead><tr>${names.map((day,i)=>`<th scope="col" abbr="${days[i]}">${day}</th>`).join('')}</tr></thead><tbody>${weeks}</tbody></table><figcaption>★ Dan izleta</figcaption></figure>`;
    }
    if(v.kind==='map'){
      const {position,lastMoveInvalid}=E.traceRoute(v,session.draft.items||[]);
      const rows=Array.from({length:3},(_,row)=>{
        const cells=Array.from({length:3},(_,column)=>{
          const index=3*row+column;
          const [icon,name]=index===v.start?['🏫','Škola']:index===v.end?['🌳','Park']:v.blocked.includes(index)?['🚧','Radovi']:['·','Put'];
          const here=index===position;
          const marker=here?` class="map-current" aria-current="location" aria-label="Tvoj položaj. ${name}, ${row+1}. red, ${column+1}. stupac."`:'';
          return `<td${marker}><span aria-hidden="true">${icon}</span><small>${name}</small>${here?'<b aria-hidden="true">●</b>':''}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      const note=lastMoveInvalid?'<p class="route-note">Potez je upisan. Položaj se nije promijenio.</p>':'';
      return `<table class="route-map"><caption>Skica puta</caption><tbody>${rows}</tbody></table>${note}`;
    }
    if(v.kind==='family'){
      return `<figure class="family-tree" aria-label="Obiteljsko stablo"><figcaption>Obiteljsko stablo</figcaption><div class="grand">${esc(v.grand)} <small>baka</small></div><div class="branches">${v.adults.map((name,i)=>`<div class="branch"><div>${esc(name)} <small>kći</small></div><div>${esc(v.children[i])} <small>dijete</small></div></div>`).join('')}</div><p class="sr-only">Baka ${esc(v.grand)} ima dvije kćeri, ${esc(v.adults.join(' i '))}. ${v.adults.map((name,i)=>esc(name)+' ima dijete koje se zove '+esc(v.children[i])+'.').join(' ')}</p></figure>`;
    }
    return '';
  }
  function choices(q){
    const clues=q.clues?`<div class="evidence-grid" aria-label="Tvrdnje učenika">${q.clues.map(c=>`<p class="evidence-clue">${esc(c)}</p>`).join('')}</div>`:'';
    const options=q.options.map(value=>{
      const selected=session.draft.selected===value;
      const wrong=selected&&session.phase==='incorrect';
      const classes=['choice',selected?'selected':'',wrong?'choice-incorrect':''].filter(Boolean).join(' ');
      const feedback=wrong?'<p id="choice-feedback" class="inline-feedback choice-feedback"><b>Još nije točno.</b> Odaberi drugi odgovor.</p>':'';
      const description=wrong?' aria-describedby="choice-feedback"':'';
      return `<button type="button" class="${classes}" aria-pressed="${selected}"${description} data-choice data-value="${esc(value)}"><span class="radio" aria-hidden="true"></span>${esc(value)}</button>${feedback}`;
    });
    return `${clues}<div class="choices">${options.join('')}</div>`;
  }
  function tile(attr,label,active=false,disabled=false){
    return `<button type="button" class="tile ${active?'selected':''}" data-${attr} data-value="${esc(label)}" ${active?'aria-pressed="true"':''} ${disabled?'disabled':''}>${esc(label)}</button>`;
  }
  function match(q){
    const pairs=session.draft.pairs,usedLeft=pairs.map(p=>p[0]),usedRight=pairs.map(p=>p[1]);
    return `<p class="instruction">Odaberi pojam, zatim njegov par. Spojeni par možeš dodirnuti za izmjenu.</p><div class="match-grid"><div>${q.left.filter(v=>!usedLeft.includes(v)).map(v=>tile('match-left',v,session.pending===v)).join('')}</div><div>${q.right.filter(v=>!usedRight.includes(v)).map(v=>tile('match-right',v,false,!session.pending)).join('')}</div></div><div class="pair-list">${pairs.map(([a,b],i)=>`<button type="button" data-remove-pair="${i}" aria-label="Ukloni par: ${esc(a)} i ${esc(b)}"><span>${esc(a)}</span><b aria-hidden="true">↔</b><span>${esc(b)}</span><i aria-hidden="true">×</i></button>`).join('')}</div>`;
  }
  function sort(q){
    const assigned=Object.values(session.draft.zones).flat(),zoneName=z=>esc(z.replaceAll('_',' '));
    const unassigned=q.items.filter(v=>!assigned.includes(v)).map(v=>{
      const selected=v===session.pending;
      const picker=selected?`<div class="zone-picker" role="group" aria-label="Odaberi skupinu za ${esc(v)}">${q.zones.map(z=>`<button type="button" data-sort-zone data-value="${esc(z)}">${zoneName(z)}</button>`).join('')}</div>`:'';
      return `<div class="sort-unit">${tile('sort-item',v,selected)}${picker}</div>`;
    }).join('');
    return `<p class="instruction">Dodirni karticu i odaberi skupinu. Dodir na razvrstanu karticu vraća je u izbor.</p><div class="item-tray sort-tray">${unassigned||'<p class="empty-note">Sve su kartice razvrstane.</p>'}</div><div class="zone-grid">${q.zones.map(z=>`<section class="zone"><h2>${zoneName(z)}</h2><div class="zone-items">${session.draft.zones[z].map((v,i)=>`<button type="button" data-remove-sort="${i}" data-zone="${esc(z)}" aria-label="Ukloni ${esc(v)} iz skupine ${zoneName(z)}">${esc(v)} <i aria-hidden="true">×</i></button>`).join('')}</div></section>`).join('')}</div>`;
  }
  function routeSequence(q,selected){
    const full=selected.length===q.answer.length;
    const pad=q.items.map(move=>`<button type="button" class="tile" data-route data-value="${esc(move)}" ${full?'disabled':''}>
      <b aria-hidden="true">${direction[move]}</b> ${esc(move)}</button>`).join('');
    const picked=selected.map((move,i)=>`<li><button type="button" data-remove-sequence="${i}" aria-label="Ukloni ${i+1}. potez, ${esc(move)}">
      <span aria-hidden="true">${direction[move]}</span> ${esc(move)} <i aria-hidden="true">×</i></button></li>`).join('');
    return `<div class="direction-pad">${pad}</div>
      <div class="route-controls">
        <p class="route-count">Upisani potezi <strong>${selected.length} od ${q.answer.length}</strong></p>
        ${button('Vrati potez','undo-route','button secondary',selected.length?'':'disabled')}
      </div>
      <ol class="sequence-answer route-steps" aria-label="Odabrane strelice">${picked}</ol>`;
  }
  function sequence(q){
    const selected=session.draft.items;
    if(q.type==='route')return routeSequence(q,selected);
    const remaining=q.items.slice();
    for(const v of selected){const i=remaining.indexOf(v);if(i!==-1)remaining.splice(i,1);}
    const picked=selected.map((v,i)=>`<div class="step-row"><button type="button" data-remove-sequence="${i}" aria-label="Ukloni korak ${i+1}: ${esc(v)}"><b>${i+1}</b><span>${esc(v)}</span><i aria-hidden="true">×</i></button>${selected.length>1?`<button type="button" class="move" data-move="${i}" data-delta="-1" aria-label="Pomakni ranije: ${esc(v)}" ${i===0?'disabled':''}>↑</button><button type="button" class="move" data-move="${i}" data-delta="1" aria-label="Pomakni kasnije: ${esc(v)}" ${i===selected.length-1?'disabled':''}>↓</button>`:''}</div>`).join('');
    return `<p class="instruction">Dodirni kartice željenim redom. Strelicama možeš premjestiti korak.</p><div class="sequence-answer ${q.type==='timeline'?'time-line':''}">${picked||'<p>Ovdje će se pojaviti tvoj redoslijed.</p>'}</div><div class="item-tray">${remaining.map(v=>tile('sequence-item',v)).join('')}</div>`;
  }
  function editRoute(focus,removed=false){
    edit(focus);
    const count=app.querySelector('.route-count');
    if(count){
      const position=app.querySelector('.map-current').getAttribute('aria-label');
      const message=removed?'Potez je uklonjen. '+position:app.querySelector('.route-note')?.textContent||position;
      announce(count.textContent+'. '+message);
    }
  }
  function results(){
    const s=E.summarize(session);
    return `<section class="results"><div class="results-hero">${lumi('results-lumi')}<div><p class="eyebrow">${esc(titleOf(session))}</p><h1>Bravo, istraživačice!</h1><p>Riješeni zadaci: ${s.solved} od ${s.total}.</p></div></div><div class="stats"><article class="stat"><strong>${s.firstTry}</strong><span>Iz prvog pokušaja</span></article><article class="stat warm"><strong>${s.retried}</strong><span>Uz ponovni pokušaj</span></article></div><div class="actions centered">${s.retried?button('Ponovi ono što mi je bilo teško','review'):''}${button('Nova vježba →','new-round',s.retried?'button secondary':'button')}${button('Promijeni svijet','worlds','text-button')}</div></section>`;
  }
  function play(){
    if(session.phase==='complete')return results();
    const q=current(),w=P.worlds.find(w=>w.id===q.world);
    if(session.phase==='correct')return `<section class="exercise">${progress()}<div class="question-card"><div class="feedback correct"><span aria-hidden="true">✓</span><div><h1>Točno!</h1><p>Riješila si zadatak „${esc(q.title)}”.</p></div>${lumi('feedback-lumi')}</div><div class="actions">${button(session.index===session.questions.length-1?'Pogledaj rezultat →':'Sljedeći zadatak →','next')}</div></div></section>`;
    const answer=q.options?choices(q):q.type==='match'?match(q):q.type==='sort'?sort(q):sequence(q);
    const failed=session.phase==='incorrect'&&!q.options,ready=session.phase==='answer'&&E.complete(q,session.draft);
    return `<section class="exercise">${progress()}<div class="question-card"><div class="question-head"><span class="question-icon" aria-hidden="true">${w.icon}</span><div><p class="eyebrow">${w.name}</p><h1>${esc(q.title)}</h1></div></div><p class="prompt">${esc(q.prompt)}</p>${picture(q.visual)}<div id="answer-editor" role="group" aria-label="Tvoj odgovor" tabindex="-1">${answer}</div><div class="check-area">${failed?'<p class="inline-feedback"><b>Još nije točno.</b> Promijeni svoj odgovor pa provjeri ponovno.</p>':''}<div class="actions">${button('Provjeri','check','button',`id="check-button" ${ready?'':'disabled'}`)}</div></div></div></section>`;
  }
  function edit(focus){
    if(session.phase==='incorrect'&&!E.sameResponse(current(),session.draft,session.responses[session.index]))session.phase='answer';
    remember();render(focus);
  }
  const first=selector=>()=>app.querySelector(selector);
  const byValue=(selector,value)=>()=>eqAttr(selector,'value',value);
  document.addEventListener('click',event=>{
    const t=event.target.closest('button,a[data-found-unit]');if(!t||t.disabled)return;
    if(t.dataset.foundUnit){
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
      event.preventDefault();
      const unit=P.unitById.get(t.dataset.foundUnit);
      start(t,unit.world,unit.id);return;
    }
    if(t.id==='share-unit'){copyUnitLink();return;}
    const d=t.dataset,action=d.action;
    if(action==='book'){if(view==='play')goParent('book',t);else navigate('book',t);return;}
    if(action==='unit'){const unit=P.unitById.get(d.unit);if(unit)start(t,unit.world,unit.id);return;}
    if(action==='home'){if(t.classList.contains('brand'))navigate('home',t);else goParent('home',t);return;}
    if(action==='level'){level=d.level;page.level=level;navigate('worlds',t);return;}
    if(action==='worlds'){goParent('worlds',t);return;}
    if(action==='back-lessons'){goParent('lessons',t);return;}
    if(action==='back-play'){goParent('play',t);return;}
    if(action==='lessons'){chosenWorld=d.lessons;navigate('lessons',t);return;}
    if(action==='start'){start(t,d.world);return;}
    if(action==='lesson'){start(t,chosenWorld,d.lesson);return;}
    if(action==='resume'){resume(t,d.run);return;}
    if(!session||view!=='play')return;
    if(action==='next'){if(E.advance(session)){remember();render();}return;}
    if(action==='new-round'){start(t,session.world,session.lesson);return;}
    if(action==='review'){const refs=session.questions.flatMap((q,i)=>session.attempts[i]>1?[q.type==='route'?{...q.ref,previousMoves:session.responses[i]?.items}:q.ref]:[]);if(refs.length)start(t,session.world,session.lesson,refs);return;}
    if(session.solved[session.index])return;
    const draft=session.draft,v=d.value;
    if(action==='check'){
      const result=E.submit(session,draft);
      if(result==='correct'){remember();render(first('[data-action="next"]'));announce('Točno!',80);}
      if(result==='incorrect'||result==='unchanged'){
        session.phase='incorrect';
        remember();render(first('#answer-editor'));
        const message=app.querySelector('.inline-feedback');
        message.scrollIntoView?.({block:'nearest',inline:'nearest'});
        announce(message.textContent,80);
      }
    }else if('choice' in d){draft.selected=v;edit(byValue('[data-choice]',v));}
    else if('matchLeft' in d){session.pending=v;edit(first('[data-match-right]:not(:disabled)'));}
    else if('matchRight' in d&&session.pending){draft.pairs.push([session.pending,v]);session.pending=null;edit(first('[data-match-left], #check-button:not(:disabled)'));}
    else if('removePair' in d){const [pair]=draft.pairs.splice(Number(d.removePair),1);session.pending=pair[0];edit(first('[data-match-right]:not(:disabled)'));}
    else if('sortItem' in d){session.pending=session.pending===v?null:v;edit(session.pending?first('[data-sort-zone]'):byValue('[data-sort-item]',v));}
    else if('sortZone' in d&&session.pending){draft.zones[v].push(session.pending);session.pending=null;edit(first('[data-sort-item], #check-button:not(:disabled)'));}
    else if('removeSort' in d){const [item]=draft.zones[d.zone].splice(Number(d.removeSort),1);session.pending=item;edit(first('[data-sort-zone]'));}
    else if('route' in d){
      draft.items.push(v);
      editRoute(()=>eqAttr('[data-route]:not(:disabled)','value',v)
        ||app.querySelector('#check-button:not(:disabled)')
        ||app.querySelector('[data-action="undo-route"]'));
    }else if(action==='undo-route'){
      const removed=draft.items.pop();
      editRoute(draft.items.length?first('[data-action="undo-route"]'):byValue('[data-route]',removed),true);
    }else if('sequenceItem' in d){draft.items.push(v);edit(first('[data-sequence-item], #check-button:not(:disabled)'));}
    else if('removeSequence' in d){
      const [removed]=draft.items.splice(Number(d.removeSequence),1);
      if(current().type==='route')editRoute(byValue('[data-route]',removed),true);
      else edit(byValue('[data-sequence-item]',removed));
    }
    else if('move' in d){const i=Number(d.move),j=i+Number(d.delta);[draft.items[i],draft.items[j]]=[draft.items[j],draft.items[i]];edit(()=>app.querySelector('[data-remove-sequence="'+j+'"]'));}
  });
  app.addEventListener('input',event=>{
    if(event.target.id!=='book-page')return;
    page.lookup=event.target.value;delete page.invalidLink;
    updatePageLookup();checkpoint(event.target);
  });
  app.addEventListener('submit',event=>{
    if(event.target.id!=='page-lookup')return;
    event.preventDefault();
    const link=app.querySelector('[data-found-unit]');
    if(link)link.focus();
    else app.querySelector('#book-page').focus();
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='book-level'){
      level=event.target.value;page.level=level;updatePageLookup();checkpoint(event.target);
    }
  });
  app.addEventListener('toggle',scheduleCheckpoint,true);
  app.addEventListener('focusin',scheduleCheckpoint);
  window.addEventListener('scroll',scheduleCheckpoint,{passive:true});
  window.addEventListener('pagehide',()=>checkpoint());
  window.addEventListener('popstate',locationChanged);
  window.addEventListener('hashchange',locationChanged);
  load();
  try{browserHistory.scrollRestoration='manual';}catch{/* Optional in offline readers. */}
  const savedPage=browserPage();
  const initial=linkedPage(savedPage,null)||savedPage||newPage(location.hash==='#gradivo'?'book':'home',null);
  storePage('replaceState',initial,!!initial.invalidLink);show(initial);
})();
