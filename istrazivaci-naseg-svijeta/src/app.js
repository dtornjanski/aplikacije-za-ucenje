(function(){
  'use strict';
  const E=window.WorldEngine,C=window.WorldContent,P=window.WorldPractice;
  const app=document.getElementById('app'),announcer=document.getElementById('announcer');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const button=(label,action,classes='button',attrs='')=>`<button type="button" class="${classes}" data-action="${action}" ${attrs}>${label}</button>`;
  const lumi=(className='')=>`<svg class="lumi ${className}" viewBox="0 0 190 190" role="img" aria-label="Lumi, znatiželjna krijesnica"><ellipse cx="61" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(-28 61 79)"/><ellipse cx="129" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(28 129 79)"/><ellipse cx="95" cy="103" rx="34" ry="58" fill="#f6c84b" stroke="#163d31" stroke-width="6"/><path d="M68 105h54M70 128h50" stroke="#163d31" stroke-width="7"/><circle cx="84" cy="76" r="6" fill="#163d31"/><circle cx="106" cy="76" r="6" fill="#163d31"/><path d="M83 91c7 6 17 6 24 0" fill="none" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><path d="M79 49 65 31m46 18 14-18" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="29" r="5" fill="#c9484b"/><circle cx="126" cy="29" r="5" fill="#c9484b"/><circle cx="95" cy="157" r="23" fill="#fff4ad" opacity=".8"/></svg>`;
  const prefix='world-explorers-v2/',runPrefix=prefix+'run/';
  const runs=new Map();
  let history={},session=null,level='easy',view='home',chosenWorld=null,lastSeed=0;
  const current=()=>session.questions[session.index];
  const worldName=id=>P.worlds.find(w=>w.id===id)?.name||'Miješana ekspedicija';
  const levelName=id=>P.levels.find(l=>l.id===id).name;
  const scope=(level,world,lesson,review)=>[level,world,lesson||'sve',review?'ponavljanje':'vjezba'].join('/');
  const scopeOf=s=>scope(s.level,s.world,s.lesson,s.review);
  const titleOf=s=>(s.review?'Ponavljanje · ':'')+(s.lesson?P.lessonById.get(s.lesson).name:worldName(s.world));
  function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function write(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch{/* Practice also works in memory. */}}
  function remember(newRound=false){
    const key=scopeOf(session),disk=read(runPrefix+key),previous=runs.get(key);
    if(!newRound&&disk?.state&&previous&&disk.updated>previous.updated){
      const concurrent=E.restore(disk.state,P.buildRound);
      if(concurrent&&scopeOf(concurrent)===key){
        const ahead=concurrent.index>session.index||concurrent.index===session.index&&concurrent.solved[session.index]&&!session.solved[session.index];
        if(concurrent.seed!==session.seed||ahead||concurrent.phase==='complete')session=concurrent;
      }
    }
    const entry={updated:Math.max(Date.now(),(previous?.updated||0)+1,(disk?.updated||0)+1),state:JSON.parse(E.serialize(session))};
    runs.set(key,entry);write(runPrefix+key,entry);
  }
  function loadEntry(key){
    const disk=read(runPrefix+key),local=runs.get(key);
    const entry=disk&&(!local||disk.updated>local.updated)?disk:local;
    if(!entry)return null;
    const restored=E.restore(entry.state,P.buildRound);
    return restored&&scopeOf(restored)===key?restored:null;
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
        const entry=read(key),id=key.slice(runPrefix.length),restored=entry&&E.restore(entry.state,P.buildRound);
        if(restored&&scopeOf(restored)===id)runs.set(id,entry);
      }
    }catch{/* Storage is optional. */}
    const stored=read(prefix+'history');
    if(stored&&typeof stored==='object')for(const [key,value] of Object.entries(stored))if(Array.isArray(value))history[key]=value;
    if(!runs.size){
      const old=E.restore(read('world-explorers-session-v1'),C.buildRound);
      if(old){
        const plan=P.migrateRefs(old);
        session=E.migrate(old,P.buildRound(old.level,old.world,old.seed,plan));remember();record(plan);
      }
    }
  }
  function seed(){
    const values=new Uint32Array(1);
    try{crypto.getRandomValues(values);}catch{values[0]=Math.floor(Math.random()*0x100000000);}
    let next=values[0];if(next===lastSeed)next=(next+1)>>>0;
    lastSeed=next;return next;
  }
  function announce(text){announcer.textContent='';setTimeout(()=>{announcer.textContent=text;},0);}
  const eqAttr=(selector,attr,value)=>[...app.querySelectorAll(selector)].find(node=>node.dataset[attr]===String(value));
  function render(focus){
    app.innerHTML=view==='home'?home():view==='worlds'?worlds():view==='lessons'?lessonMenu():play();
    const target=focus?.()||app;
    try{target.focus({preventScroll:true});}catch{target.focus();}
    if(focus&&target!==app)target.scrollIntoView?.({block:'nearest',inline:'nearest'});
    else window.scrollTo(0,0);
  }
  function navigate(next){view=next;render();}
  function resume(key){
    const saved=loadEntry(key);
    if(!saved)return;
    session=saved;level=session.level;chosenWorld=session.world;remember();navigate('play');
  }
  function start(world,lesson=null,repeat=null){
    const id=scope(level,world,lesson,!!repeat),saved=loadEntry(id);
    if(!repeat&&saved&&saved.phase!=='complete'){resume(id);return;}
    const value=seed(),plan=P.makePlan(level,world,value,history,lesson,repeat);
    session=E.createSession(level,world,value,P.buildRound(level,world,value,plan));
    session.lesson=lesson;session.review=!!repeat;chosenWorld=world;
    record(plan);remember(true);navigate('play');
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
    const resume=saved.length?`<section class="resume-list" aria-label="Nedovršene vježbe">${resumeCard(saved[0])}${saved.length>1?`<details><summary>Ostale nedovršene vježbe (${saved.length-1})</summary>${saved.slice(1).map(resumeCard).join('')}</details>`:''}</section>`:'';
    return `<section class="home-view"><div class="hero"><div><h1>Istraži svijet uz krijesnicu <span>Lumi.</span></h1></div><div class="hero-art" aria-hidden="true">${lumi('hero-lumi')}<span class="spark one">✦</span></div></div>${resume}<h2 class="section-title">Odaberi razinu</h2><div class="level-grid">${P.levels.map((item,i)=>`<article class="level-card l${i+1}"><span class="level-icon" aria-hidden="true">${item.icon}</span><p>${item.desc}</p>${button(item.name+' →','level','button',`data-level="${item.id}"`)}</article>`).join('')}</div></section>`;
  }
  const back=(label,action)=>button(label,action,'text-button');
  function worlds(){
    const mixed=button('<span class="world-icon" aria-hidden="true">🎒</span><span><strong>Miješana ekspedicija</strong><small>Po jedan zadatak iz svakog svijeta</small></span><b aria-hidden="true">→</b>','start','world-card mixed','data-world="mix"');
    return `<section><div class="topline">${back('← Početna','home')}<span class="pill">${levelName(level)}</span></div><div class="section-heading"><h1>Što želiš istraživati?</h1></div>${mixed}<div class="world-grid">${P.worlds.map(w=>`<article class="world-tile">${button(`<span class="world-icon" aria-hidden="true">${w.icon}</span><span><strong>${w.name}</strong><small>${w.desc}</small></span><b aria-hidden="true">→</b>`,'start','world-card',`data-world="${w.id}" aria-label="Vježbaj temu: ${w.name}"`)}${button('Odaberi lekciju','lessons','lesson-link',`data-lessons="${w.id}" aria-label="Odaberi lekciju: ${w.name}"`)}</article>`).join('')}</div></section>`;
  }
  function lessonMenu(){
    const w=P.worlds.find(w=>w.id===chosenWorld);
    return `<section class="lesson-menu"><div class="topline">${back('← Svjetovi','worlds')}<span class="pill">${levelName(level)}</span></div><p class="eyebrow">${w.name}</p><h1>Odaberi lekciju</h1><p class="lesson-intro">Pet zadataka iz lekcije koju odabereš.</p><div class="lesson-grid">${P.lessons.filter(l=>l.world===chosenWorld).map(l=>{
      const s=runs.get(scope(level,chosenWorld,l.id,false))?.state,info=s&&s.phase!=='complete'?'Nastavi · zadatak '+(s.index+1)+' od '+s.attempts.length:'Započni vježbu';
      return button(`<span class="world-icon" aria-hidden="true">${l.icon}</span><span><strong>${l.name}</strong><small>${info}</small></span><b aria-hidden="true">→</b>`,'lesson','world-card',`data-lesson="${l.id}"`);
    }).join('')}</div>${button('Vježbaj cijelu temu →','start','button secondary',`data-world="${w.id}"`)}</section>`;
  }
  function progress(){
    const total=session.questions.length,done=E.summarize(session).solved;
    return `<div class="topline">${back(session.lesson?'← Lekcije':'← Svjetovi',session.lesson?'back-lessons':'worlds')}<span class="pill">${levelName(level)}</span></div><div class="progress-row"><div class="progress" role="progressbar" aria-label="Riješeni zadaci" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">${session.questions.map((_,i)=>`<span class="${session.solved[i]?'done':i===session.index?'current':''}"></span>`).join('')}</div><span class="progress-text">Zadatak ${session.index+1} od ${total}</span></div>`;
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
      const pos=E.walk(v,session.draft.items||[]);
      const rows=Array.from({length:3},(_,r)=>`<tr>${Array.from({length:3},(_,c)=>{const i=3*r+c;const [icon,name]=i===v.start?['🏫','Škola']:i===v.end?['🌳','Park']:v.blocked.includes(i)?['🚧','Radovi']:['·','Put'];
        return `<td class="${i===pos?'map-current':''}"><span aria-hidden="true">${icon}</span><small>${name}</small>${i===pos?'<b aria-label="Tvoj položaj">●</b>':''}</td>`;}).join('')}</tr>`).join('');
      return `<table class="route-map"><caption>Skica puta</caption><tbody>${rows}</tbody></table>`;
    }
    if(v.kind==='family'){
      return `<figure class="family-tree" aria-label="Obiteljsko stablo"><figcaption>Obiteljsko stablo</figcaption><div class="grand">${esc(v.grand)} <small>baka</small></div><div class="branches">${v.adults.map((name,i)=>`<div class="branch"><div>${esc(name)} <small>kći</small></div><div>${esc(v.children[i])} <small>dijete</small></div></div>`).join('')}</div><p class="sr-only">Baka ${esc(v.grand)} ima dvije kćeri, ${esc(v.adults.join(' i '))}. ${v.adults.map((name,i)=>esc(name)+' ima dijete koje se zove '+esc(v.children[i])+'.').join(' ')}</p></figure>`;
    }
    return '';
  }
  function choices(q){
    const clues=q.clues?`<div class="evidence-grid" aria-label="Tvrdnje učenika">${q.clues.map(c=>`<p class="evidence-clue">${esc(c)}</p>`).join('')}</div>`:'';
    return `${clues}<div class="choices">${q.options.map(v=>`<button type="button" class="choice ${session.draft.selected===v?'selected':''}" aria-pressed="${session.draft.selected===v}" data-choice data-value="${esc(v)}"><span class="radio" aria-hidden="true"></span>${esc(v)}</button>`).join('')}</div>`;
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
  function sequence(q){
    const route=q.type==='route',selected=session.draft.items,remaining=q.items.slice();
    if(!route)for(const v of selected){const i=remaining.indexOf(v);if(i!==-1)remaining.splice(i,1);}
    const picked=selected.map((v,i)=>`<div class="step-row"><button type="button" data-remove-sequence="${i}" aria-label="Ukloni korak ${i+1}: ${esc(v)}"><b>${i+1}</b><span>${esc(v)}</span><i aria-hidden="true">×</i></button>${!route&&selected.length>1?`<button type="button" class="move" data-move="${i}" data-delta="-1" aria-label="Pomakni ranije: ${esc(v)}" ${i===0?'disabled':''}>↑</button><button type="button" class="move" data-move="${i}" data-delta="1" aria-label="Pomakni kasnije: ${esc(v)}" ${i===selected.length-1?'disabled':''}>↓</button>`:''}</div>`).join('');
    const tray=route?`<div class="direction-pad">${q.items.map(v=>`<button type="button" class="tile" data-route data-value="${v}" ${selected.length===q.answer.length?'disabled':''}><b aria-hidden="true">${direction[v]}</b> ${v}</button>`).join('')}</div>`:`<div class="item-tray">${remaining.map(v=>tile('sequence-item',v)).join('')}</div>`;
    return `${route?'':'<p class="instruction">Dodirni kartice željenim redom. Strelicama možeš premjestiti korak.</p>'}${route?tray:''}<div class="sequence-answer ${q.type==='timeline'?'time-line':''}">${picked||'<p>'+(route?'Ovdje će se pojaviti tvoje strelice.':'Ovdje će se pojaviti tvoj redoslijed.')+'</p>'}</div>${route?'':tray}`;
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
    const failed=session.phase==='incorrect',ready=E.complete(q,session.draft)&&!E.sameResponse(q,session.draft,session.responses[session.index]);
    return `<section class="exercise">${progress()}<div class="question-card"><div class="question-head"><span class="question-icon" aria-hidden="true">${w.icon}</span><div><p class="eyebrow">${w.name}</p><h1>${esc(q.title)}</h1></div></div><p class="prompt">${esc(q.prompt)}</p>${picture(q.visual)}${answer}<div class="check-area">${failed?'<p class="inline-feedback" tabindex="-1"><b>Još nije točno.</b> Promijeni svoj odgovor pa provjeri ponovno.</p>':''}<div class="actions">${button('Provjeri','check','button',`id="check-button" ${ready?'':'disabled'}`)}</div></div></div></section>`;
  }
  function edit(focus){
    if(session.phase==='incorrect'&&!E.sameResponse(current(),session.draft,session.responses[session.index]))session.phase='answer';
    remember();render(focus);
  }
  const first=selector=>()=>app.querySelector(selector);
  const byValue=(selector,value)=>()=>eqAttr(selector,'value',value);
  document.addEventListener('click',event=>{
    const t=event.target.closest('button');if(!t||t.disabled)return;
    const d=t.dataset,action=d.action;
    if(action==='home'){navigate('home');return;}
    if(action==='level'){level=d.level;navigate('worlds');return;}
    if(action==='worlds'){navigate('worlds');return;}
    if(action==='lessons'||action==='back-lessons'){chosenWorld=d.lessons||session.world;navigate('lessons');return;}
    if(action==='start'){start(d.world);return;}
    if(action==='lesson'){start(chosenWorld,d.lesson);return;}
    if(action==='resume'){resume(d.run);return;}
    if(!session||view!=='play')return;
    if(action==='next'){if(E.advance(session)){remember();render();}return;}
    if(action==='new-round'){start(session.world,session.lesson);return;}
    if(action==='review'){const refs=session.questions.filter((_,i)=>session.attempts[i]>1).map(q=>q.ref);if(refs.length)start(session.world,session.lesson,refs);return;}
    if(session.solved[session.index])return;
    const draft=session.draft,v=d.value;
    if(action==='check'){
      const result=E.submit(session,draft);
      if(result==='correct'){remember();render(first('[data-action="next"]'));announce('Točno!');}
      if(result==='incorrect'){remember();render(first('.inline-feedback'));announce('Još nije točno. Možeš promijeniti svoj odgovor.');}
    }else if('choice' in d){draft.selected=v;edit(byValue('[data-choice]',v));}
    else if('matchLeft' in d){session.pending=v;edit(first('[data-match-right]:not(:disabled)'));}
    else if('matchRight' in d&&session.pending){draft.pairs.push([session.pending,v]);session.pending=null;edit(first('[data-match-left], #check-button:not(:disabled)'));}
    else if('removePair' in d){const [pair]=draft.pairs.splice(Number(d.removePair),1);session.pending=pair[0];edit(first('[data-match-right]:not(:disabled)'));}
    else if('sortItem' in d){session.pending=session.pending===v?null:v;edit(session.pending?first('[data-sort-zone]'):byValue('[data-sort-item]',v));}
    else if('sortZone' in d&&session.pending){draft.zones[v].push(session.pending);session.pending=null;edit(first('[data-sort-item], #check-button:not(:disabled)'));}
    else if('removeSort' in d){const [item]=draft.zones[d.zone].splice(Number(d.removeSort),1);session.pending=item;edit(first('[data-sort-zone]'));}
    else if('sequenceItem' in d||'route' in d){draft.items.push(v);edit(first('button[data-route]:not(:disabled), [data-sequence-item], #check-button:not(:disabled)'));}
    else if('removeSequence' in d){const [removed]=draft.items.splice(Number(d.removeSequence),1);edit(byValue('[data-sequence-item], [data-route]',removed));}
    else if('move' in d){const i=Number(d.move),j=i+Number(d.delta);[draft.items[i],draft.items[j]]=[draft.items[j],draft.items[i]];edit(()=>app.querySelector('[data-remove-sequence="'+j+'"]'));}
  });
  load();render();
})();
