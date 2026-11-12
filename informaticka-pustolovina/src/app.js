(function(){
  'use strict';
  const E=window.InfoEngine,C=window.InfoContent;
  const app=document.getElementById('app'),announcer=document.getElementById('announcer');
  const storageKey='info-adventure-session-v1';
  let view='home',level='easy',session=load(),draft=null,pending=null,lastSeed=0;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const button=(label,action,className='button',extra='')=>`<button type="button" class="${className}" data-action="${action}" ${extra}>${label}</button>`;
  const bitko=(className='')=>`<svg class="bitko ${className}" viewBox="0 0 180 180" role="img" aria-label="Bitko, mali robot vodič"><path d="M42 65c0-24 19-43 43-43h10c24 0 43 19 43 43v19H42V65Z" fill="#dff7f2" stroke="#12364a" stroke-width="6"/><rect x="27" y="74" width="126" height="82" rx="30" fill="#fff" stroke="#12364a" stroke-width="6"/><circle cx="67" cy="106" r="11" fill="#0c6e78"/><circle cx="113" cy="106" r="11" fill="#0c6e78"/><path d="M66 133c14 11 34 11 48 0" fill="none" stroke="#12364a" stroke-width="6" stroke-linecap="round"/><path d="M90 22V9" stroke="#12364a" stroke-width="6" stroke-linecap="round"/><circle cx="90" cy="7" r="6" fill="#f2b544"/><path d="M27 100H12m141 0h15" stroke="#12364a" stroke-width="7" stroke-linecap="round"/></svg>`;

  function load(){try{return E.restore(localStorage.getItem(storageKey),C.buildRound);}catch(error){return null;}}
  function save(){if(!session)return;try{localStorage.setItem(storageKey,E.serialize(session));}catch(error){}}
  function seed(){const values=new Uint32Array(1);crypto.getRandomValues(values);let next=values[0]||Date.now();if(next===lastSeed)next=(next+1)>>>0;lastSeed=next;return next;}
  function emptyDraft(q){if(['single','debug','sim'].includes(q.type))return{selected:''};if(q.type==='match')return{pairs:[]};if(q.type==='sort')return{zones:Object.fromEntries(q.zones.map(zone=>[zone,[]]))};return{items:[]};}
  function current(){return session?.questions?.[session.index]||null;}
  function announce(text){announcer.textContent='';setTimeout(()=>{announcer.textContent=text;},0);}
  function focusMain(){try{app.focus({preventScroll:true});}catch(error){app.focus();}}

  function home(){
    const resume=session&&session.phase!=='complete'?`<aside class="resume"><div><strong>Bitko čuva tvoju vježbu.</strong><p>${C.levels.find(l=>l.id===session.level).name} · ${E.summarize(session).solved} od ${session.questions.length} riješeno</p></div>${button('Nastavi vježbu →','resume','button secondary')}</aside>`:'';
    return `<section class="home-view"><div class="hero"><div><p class="eyebrow">Digitalni svijet · Velike ideje</p><h1>Upoznaj računalo<br>uz prijatelja <span>Bitka.</span></h1><p>Bitko te vodi kroz osam svjetova znanja. Odaberi razinu i uči kroz igru.</p></div><div class="hero-art">${bitko('hero-bitko')}<span class="spark one">✦</span><span class="spark two">✧</span></div></div><h2 class="section-title">Odaberi razinu</h2><div class="level-grid">${C.levels.map((item,index)=>`<article class="level-card l${index+1}"><span class="level-index">0${index+1}</span><span class="level-icon" aria-hidden="true">${item.icon}</span><h3>${item.name}</h3><p>${item.desc}</p>${button('Odaberi →','level','button',`data-level="${item.id}"`)}</article>`).join('')}</div>${resume}</section>`;
  }

  function worlds(){
    const selected=C.levels.find(item=>item.id===level);
    return `<section><div class="topline">${button('← Početna','home','text-button')}<span class="pill">${selected.name}</span></div><div class="section-heading"><p class="eyebrow">Osam svjetova znanja</p><h1>Što želiš vježbati?</h1><p>Svaki svijet ima pet novih zadataka.</p></div><div class="world-grid">${C.worlds.map(world=>`<button type="button" class="world-card" data-world="${world.id}"><span class="world-icon" aria-hidden="true">${world.icon}</span><span><strong>${world.name}</strong><small>${world.desc}</small></span><b aria-hidden="true">→</b></button>`).join('')}<button type="button" class="world-card mixed" data-world="mix"><span class="world-icon" aria-hidden="true">🎲</span><span><strong>Miješana vježba</strong><small>Po jedan zadatak iz svakog svijeta</small></span><b aria-hidden="true">→</b></button></div></section>`;
  }

  function progress(){
    const total=session.questions.length,done=E.summarize(session).solved;
    return `<div class="topline">${button('← Svjetovi','worlds','text-button')}<span class="pill">${C.levels.find(item=>item.id===session.level).name}</span></div><div class="progress-row"><div class="progress" role="progressbar" aria-label="Napredak" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">${session.questions.map((q,index)=>`<span class="${session.solved[index]?'done':index===session.index?'current':''}"></span>`).join('')}</div><span class="progress-text">Zadatak ${session.index+1} od ${total}</span></div>`;
  }

  function optionButton(value,selected){return `<button type="button" class="choice ${selected?'selected':''}" data-choice data-value="${esc(value)}" aria-pressed="${selected?'true':'false'}"><span class="radio" aria-hidden="true"></span>${esc(value)}</button>`;}
  function single(q){return `<div class="choices">${q.options.map(value=>optionButton(value,draft.selected===value)).join('')}</div>`;}
  function match(q){
    const usedLeft=new Set(draft.pairs.map(pair=>pair[0])),usedRight=new Set(draft.pairs.map(pair=>pair[1]));
    return `<p class="instruction">Prvo odaberi pojam lijevo, zatim njegov par desno.</p><div class="match-grid"><div>${q.left.filter(value=>!usedLeft.has(value)).map(value=>`<button type="button" class="tile ${pending===value?'selected':''}" data-match-left data-value="${esc(value)}">${esc(value)}</button>`).join('')||'<p class="empty-note">Svi pojmovi su spojeni.</p>'}</div><div>${q.right.filter(value=>!usedRight.has(value)).map(value=>`<button type="button" class="tile" data-match-right data-value="${esc(value)}">${esc(value)}</button>`).join('')}</div></div><div class="pair-list">${draft.pairs.map((pair,index)=>`<button type="button" data-remove-pair="${index}" aria-label="Ukloni par ${esc(pair.join(' i '))}"><span>${esc(pair[0])}</span><b>↔</b><span>${esc(pair[1])}</span><i aria-hidden="true">×</i></button>`).join('')}</div>`;
  }
  function sort(q){
    const assigned=new Set(Object.values(draft.zones).flat());
    return `<p class="instruction">Odaberi karticu, zatim polje u koje pripada.</p><div class="item-tray">${q.items.filter(item=>!assigned.has(item)).map(item=>`<button type="button" class="tile ${pending===item?'selected':''}" data-sort-item data-value="${esc(item)}">${esc(item)}</button>`).join('')||'<p class="empty-note">Sve kartice su razvrstane.</p>'}</div><div class="zone-grid">${q.zones.map(zone=>`<button type="button" class="zone" data-sort-zone data-value="${esc(zone)}"><strong>${esc(zone.replaceAll('_',' '))}</strong><span>${draft.zones[zone].map((item,index)=>`<i data-remove-sort="${esc(zone)}:${index}">${esc(item)}</i>`).join('')}</span></button>`).join('')}</div>`;
  }
  function remainingItems(q){const used=new Map();draft.items.forEach(item=>used.set(item,(used.get(item)||0)+1));return q.items.filter(item=>{const count=used.get(item)||0;if(count){used.set(item,count-1);return false;}return true;});}
  function order(q){return `<p class="instruction">Odabiri kartice redom kojim se radnje trebaju dogoditi.</p><div class="order-answer">${draft.items.map((item,index)=>`<button type="button" data-remove-order="${index}" aria-label="Ukloni korak ${index+1}"><b>${index+1}</b>${esc(item)}<i aria-hidden="true">×</i></button>`).join('')||'<p>Ovdje će se pojaviti tvoj redoslijed.</p>'}</div><div class="item-tray">${remainingItems(q).map(item=>`<button type="button" class="tile" data-order-item data-value="${esc(item)}">${esc(item)}</button>`).join('')}</div>`;}
  function answerArea(q){if(['single','debug','sim'].includes(q.type))return single(q);if(q.type==='match')return match(q);if(q.type==='sort')return sort(q);return order(q);}

  function play(){
    const q=current(),world=C.worlds.find(item=>item.id===q.world);
    if(session.phase==='complete')return results();
    if(session.phase==='incorrect')return `<section class="exercise">${progress()}<div class="question-card"><div class="feedback incorrect"><span aria-hidden="true">↻</span><div><p class="eyebrow">Pokušaj ponovno</p><h1>Pogledaj još jednom.</h1><p>Odgovor još nije točan. Mirno provjeri svoj izbor.</p></div>${bitko('feedback-bitko')}</div><div class="actions">${button('Pokušaj ponovno','retry')}</div></div></section>`;
    if(session.phase==='correct')return `<section class="exercise">${progress()}<div class="question-card"><div class="feedback correct"><span aria-hidden="true">✓</span><div><p class="eyebrow">Zadatak riješen</p><h1>Točno!</h1><p>Dobro si povezala informacije.</p></div>${bitko('feedback-bitko')}</div><div class="actions">${button(session.index===session.questions.length-1?'Pogledaj rezultat →':'Sljedeći zadatak →','next')}</div></div></section>`;
    if(!draft)draft=emptyDraft(q);
    return `<section class="exercise">${progress()}<div class="question-card"><div class="question-head"><span class="question-icon" aria-hidden="true">${world.icon}</span><div><p class="eyebrow">${world.name}</p><h1>${esc(q.title)}</h1></div></div><p class="prompt">${esc(q.prompt)}</p>${answerArea(q)}<div class="actions"><button id="check-button" class="button" type="button" data-action="check" ${E.complete(q,draft)?'':'disabled'}>Provjeri</button></div></div></section>`;
  }

  function results(){
    const stats=E.summarize(session);
    return `<section class="results"><div class="results-hero">${bitko('results-bitko')}<div><p class="eyebrow">Vježba je dovršena</p><h1>Bravo, digitalna istraživačice!</h1><p>Riješila si svih ${stats.total} zadataka.</p></div></div><div class="stats"><article class="stat"><strong>${stats.firstTry}</strong><span>Iz prvog pokušaja</span></article><article class="stat warm"><strong>${stats.retried}</strong><span>Uz ponovni pokušaj</span></article></div><p class="encouragement">Bitko kaže: pogreška je samo novi trag do rješenja.</p><div class="actions centered">${button('Nova vježba →','new-round')}${button('Promijeni svijet','worlds','button secondary')}</div></section>`;
  }

  function render(){app.innerHTML=view==='home'?home():view==='worlds'?worlds():play();focusMain();}
  function start(world){const newSeed=seed();session=E.createSession(level,world,newSeed,C.buildRound(level,world,newSeed));draft=null;pending=null;save();view='play';render();}
  function choose(value){draft.selected=value;render();}
  function matchLeft(value){pending=value;render();}
  function matchRight(value){if(!pending)return;draft.pairs.push([pending,value]);pending=null;render();}
  function sortItem(value){pending=value;render();}
  function sortZone(zone){if(!pending)return;draft.zones[zone].push(pending);pending=null;render();}

  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.level){level=target.dataset.level;view='worlds';render();return;}
    if(target.dataset.world){start(target.dataset.world);return;}
    if(target.hasAttribute('data-choice')){choose(target.dataset.value);return;}
    if(target.hasAttribute('data-match-left')){matchLeft(target.dataset.value);return;}
    if(target.hasAttribute('data-match-right')){matchRight(target.dataset.value);return;}
    if(target.hasAttribute('data-sort-item')){sortItem(target.dataset.value);return;}
    if(target.hasAttribute('data-sort-zone')){sortZone(target.dataset.value);return;}
    if(target.hasAttribute('data-order-item')){draft.items.push(target.dataset.value);render();return;}
    if(target.dataset.removePair!==undefined){draft.pairs.splice(Number(target.dataset.removePair),1);render();return;}
    if(target.dataset.removeSort!==undefined){const [zone,index]=target.dataset.removeSort.split(':');draft.zones[zone].splice(Number(index),1);render();return;}
    if(target.dataset.removeOrder!==undefined){draft.items.splice(Number(target.dataset.removeOrder),1);render();return;}
    const action=target.dataset.action;
    if(action==='home'){view='home';render();}
    if(action==='worlds'){level=session?.level||level;view='worlds';render();}
    if(action==='resume'){level=session.level;draft=session.responses[session.index]||null;view='play';render();}
    if(action==='check'){const result=E.submit(session,draft);save();if(result==='incorrect')announce('Pogledaj još jednom.');if(result==='correct')announce('Točno!');render();}
    if(action==='retry'){session.phase='answer';session.responses[session.index]=null;draft=null;pending=null;save();render();}
    if(action==='next'){E.advance(session);draft=null;pending=null;save();render();}
    if(action==='new-round')start(session.world);
  });

  render();
})();
