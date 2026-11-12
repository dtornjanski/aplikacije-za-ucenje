(function(){
  'use strict';
  const E=window.WorldEngine,C=window.WorldContent,app=document.getElementById('app'),announcer=document.getElementById('announcer');
  const storageKey='world-explorers-session-v1';
  let view='home',level='easy',session=load(),draft=null,pending=null,lastSeed=0;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const button=(label,action,className='button',extra='')=>`<button type="button" class="${className}" data-action="${action}" ${extra}>${label}</button>`;
  const lumi=(className='')=>`<svg class="lumi ${className}" viewBox="0 0 190 190" role="img" aria-label="Lumi, znatiželjna krijesnica"><ellipse cx="61" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(-28 61 79)"/><ellipse cx="129" cy="79" rx="34" ry="48" fill="#dff3ff" stroke="#163d31" stroke-width="6" transform="rotate(28 129 79)"/><ellipse cx="95" cy="103" rx="34" ry="58" fill="#f6c84b" stroke="#163d31" stroke-width="6"/><path d="M68 105h54M70 128h50" stroke="#163d31" stroke-width="7"/><circle cx="84" cy="76" r="6" fill="#163d31"/><circle cx="106" cy="76" r="6" fill="#163d31"/><path d="M83 91c7 6 17 6 24 0" fill="none" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><path d="M79 49 65 31m46 18 14-18" stroke="#163d31" stroke-width="5" stroke-linecap="round"/><circle cx="64" cy="29" r="5" fill="#c9484b"/><circle cx="126" cy="29" r="5" fill="#c9484b"/><circle cx="95" cy="157" r="23" fill="#fff4ad" opacity=".8"/></svg>`;

  function load(){try{return E.restore(localStorage.getItem(storageKey),C.buildRound);}catch(error){return null;}}
  function save(){if(!session)return;try{localStorage.setItem(storageKey,E.serialize(session));}catch(error){}}
  function seed(){const values=new Uint32Array(1);crypto.getRandomValues(values);let next=values[0]||Date.now();if(next===lastSeed)next=(next+1)>>>0;lastSeed=next;return next;}
  function current(){return session?.questions?.[session.index]||null;}
  function emptyDraft(question){
    if(['single','cause','observe'].includes(question.type))return{selected:''};
    if(question.type==='match')return{pairs:[]};
    if(question.type==='sort')return{zones:Object.fromEntries(question.zones.map(zone=>[zone,[]]))};
    return{items:[]};
  }
  function announce(message){announcer.textContent='';setTimeout(()=>{announcer.textContent=message;},0);}
  function focusMain(){try{app.focus({preventScroll:true});}catch(error){app.focus();}}

  function home(){
    const resume=session&&session.phase!=='complete'?`<aside class="resume"><div><strong>Lumi čuva tvoju ekspediciju.</strong><p>${C.levels.find(item=>item.id===session.level).name} · ${E.summarize(session).solved} od ${session.questions.length} riješeno</p></div>${button('Nastavi ekspediciju →','resume','button secondary')}</aside>`:'';
    return `<section class="home-view"><div class="hero"><div><p class="eyebrow">Priroda · Društvo · Velika otkrića</p><h1>Istraži svijet<br>uz krijesnicu <span>Lumi.</span></h1><p>Jedanaest svjetova vodi te kroz cijelu školsku godinu. Odaberi razinu i kreni tragom znanja.</p></div><div class="hero-art">${lumi('hero-lumi')}<span class="spark one">✦</span><span class="spark two">✧</span></div></div><h2 class="section-title">Odaberi razinu</h2><div class="level-grid">${C.levels.map((item,index)=>`<article class="level-card l${index+1}"><span class="level-index">0${index+1}</span><span class="level-icon" aria-hidden="true">${item.icon}</span><h3>${item.name}</h3><p>${item.desc}</p>${button('Odaberi →','level','button',`data-level="${item.id}"`)}</article>`).join('')}</div>${resume}</section>`;
  }

  function worlds(){
    const selected=C.levels.find(item=>item.id===level);
    return `<section><div class="topline">${button('← Početna','home','text-button')}<span class="pill">${selected.name}</span></div><div class="section-heading"><p class="eyebrow">Jedanaest svjetova znanja</p><h1>Što želiš istraživati?</h1><p>Svaki svijet donosi pet novih zadataka.</p></div><div class="world-grid">${C.worlds.map(world=>`<button type="button" class="world-card" data-world="${world.id}"><span class="world-icon" aria-hidden="true">${world.icon}</span><span><strong>${world.name}</strong><small>${world.desc}</small></span><b aria-hidden="true">→</b></button>`).join('')}<button type="button" class="world-card mixed" data-world="mix"><span class="world-icon" aria-hidden="true">🎒</span><span><strong>Miješana ekspedicija</strong><small>Po jedan zadatak iz svih jedanaest svjetova</small></span><b aria-hidden="true">→</b></button></div></section>`;
  }

  function progress(){
    const total=session.questions.length,done=E.summarize(session).solved;
    return `<div class="topline">${button('← Svjetovi','worlds','text-button')}<span class="pill">${C.levels.find(item=>item.id===session.level).name}</span></div><div class="progress-row"><div class="progress" role="progressbar" aria-label="Napredak" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">${session.questions.map((question,index)=>`<span class="${session.solved[index]?'done':index===session.index?'current':''}"></span>`).join('')}</div><span class="progress-text">Zadatak ${session.index+1} od ${total}</span></div>`;
  }

  function optionButton(value,selected){return `<button type="button" class="choice ${selected?'selected':''}" data-choice data-value="${esc(value)}" aria-pressed="${selected?'true':'false'}"><span class="radio" aria-hidden="true"></span>${esc(value)}</button>`;}
  function choices(question){const clues=question.clues?`<div class="evidence-grid" aria-label="Zapisi za procjenu">${question.clues.map(clue=>`<p class="evidence-clue">${esc(clue)}</p>`).join('')}</div>`:'';return `${clues}<div class="choices">${question.options.map(value=>optionButton(value,draft.selected===value)).join('')}</div>`;}
  function observation(question){const scene=question.scene||['🔎','Opažanje'];return `<div class="observation"><div class="observation-scene"><span aria-hidden="true">${esc(scene[0])}</span><strong>${esc(scene[1])}</strong><small>Promotri tragove u opisu i odaberi zaključak.</small></div><div class="observation-options">${question.options.map(value=>optionButton(value,draft.selected===value)).join('')}</div></div>`;}
  function match(question){
    const usedLeft=new Set(draft.pairs.map(pair=>pair[0])),usedRight=new Set(draft.pairs.map(pair=>pair[1]));
    return `<p class="instruction">Odaberi pojam iz prve skupine, zatim njegov par iz druge.</p><div class="match-grid"><div>${question.left.filter(value=>!usedLeft.has(value)).map(value=>`<button type="button" class="tile ${pending===value?'selected':''}" data-match-left data-value="${esc(value)}" aria-pressed="${pending===value?'true':'false'}">${esc(value)}</button>`).join('')||'<p class="empty-note">Svi pojmovi su spojeni.</p>'}</div><div>${question.right.filter(value=>!usedRight.has(value)).map(value=>`<button type="button" class="tile" data-match-right data-value="${esc(value)}">${esc(value)}</button>`).join('')}</div></div><div class="pair-list">${draft.pairs.map((pair,index)=>`<button type="button" data-remove-pair="${index}" aria-label="Ukloni par ${esc(pair.join(' i '))}"><span>${esc(pair[0])}</span><b>↔</b><span>${esc(pair[1])}</span><i aria-hidden="true">×</i></button>`).join('')}</div>`;
  }
  function sort(question){
    const assigned=new Set(Object.values(draft.zones).flat());
    return `<p class="instruction">Odaberi karticu, zatim polje u koje pripada.</p><div class="item-tray">${question.items.filter(item=>!assigned.has(item)).map(item=>`<button type="button" class="tile ${pending===item?'selected':''}" data-sort-item data-value="${esc(item)}" aria-pressed="${pending===item?'true':'false'}">${esc(item)}</button>`).join('')||'<p class="empty-note">Sve kartice su razvrstane.</p>'}</div><div class="zone-grid">${question.zones.map(zone=>`<div class="zone"><button type="button" class="zone-target" data-sort-zone data-value="${esc(zone)}"><strong>${esc(zone.replaceAll('_',' '))}</strong><small>Dodaj odabranu karticu</small></button><div class="zone-items">${draft.zones[zone].map((item,index)=>`<button type="button" data-remove-sort="${esc(zone)}:${index}" aria-label="Ukloni ${esc(item)} iz polja ${esc(zone.replaceAll('_',' '))}"><span>${esc(item)}</span><i aria-hidden="true">×</i></button>`).join('')}</div></div>`).join('')}</div>`;
  }
  function remaining(question){const used=new Map();draft.items.forEach(item=>used.set(item,(used.get(item)||0)+1));return question.items.filter(item=>{const count=used.get(item)||0;if(count){used.set(item,count-1);return false;}return true;});}
  function sequence(question){const timeline=question.type==='timeline';return `<p class="instruction">${timeline?'Poredaj događaje od ranijega prema kasnijemu.':'Odaberi kartice redom kojim se radnje trebaju dogoditi.'}</p><div class="sequence-answer ${timeline?'time-line':''}">${draft.items.map((item,index)=>`<button type="button" data-remove-sequence="${index}" aria-label="Ukloni korak ${index+1}"><b>${index+1}</b><span>${esc(item)}</span><i aria-hidden="true">×</i></button>`).join('')||'<p>Ovdje će se pojaviti tvoj redoslijed.</p>'}</div><div class="item-tray">${remaining(question).map(item=>`<button type="button" class="tile" data-sequence-item data-value="${esc(item)}">${esc(item)}</button>`).join('')}</div>`;}
  function answerArea(question){if(question.type==='observe')return observation(question);if(['single','cause'].includes(question.type))return choices(question);if(question.type==='match')return match(question);if(question.type==='sort')return sort(question);return sequence(question);}

  function results(){const stats=E.summarize(session);return `<section class="results"><div class="results-hero">${lumi('results-lumi')}<div><p class="eyebrow">Ekspedicija je dovršena</p><h1>Bravo, istraživačice!</h1><p>Riješila si svih ${stats.total} zadataka.</p></div></div><div class="stats"><article class="stat"><strong>${stats.firstTry}</strong><span>Iz prvog pokušaja</span></article><article class="stat warm"><strong>${stats.retried}</strong><span>Uz ponovni pokušaj</span></article></div><p class="encouragement">Lumi kaže: svako dobro pitanje vodi prema novom otkriću.</p><div class="actions centered">${button('Nova ekspedicija →','new-round')}${button('Promijeni svijet','worlds','button secondary')}</div></section>`;}

  function play(){
    if(session.phase==='complete')return results();
    const question=current(),world=C.worlds.find(item=>item.id===question.world);
    if(session.phase==='incorrect')return `<section class="exercise">${progress()}<div class="question-card"><div class="feedback incorrect"><span aria-hidden="true">↻</span><div><p class="eyebrow">Pokušaj ponovno</p><h1>Pogledaj još jednom.</h1><p>Odgovor još nije točan. Mirno provjeri tragove i svoj izbor.</p></div>${lumi('feedback-lumi')}</div><div class="actions">${button('Pokušaj ponovno','retry')}</div></div></section>`;
    if(session.phase==='correct')return `<section class="exercise">${progress()}<div class="question-card"><div class="feedback correct"><span aria-hidden="true">✓</span><div><p class="eyebrow">Zadatak riješen</p><h1>Točno!</h1><p>Dobro si povezala tragove.</p></div>${lumi('feedback-lumi')}</div><div class="actions">${button(session.index===session.questions.length-1?'Pogledaj rezultat →':'Sljedeći zadatak →','next')}</div></div></section>`;
    if(!draft)draft=emptyDraft(question);
    return `<section class="exercise">${progress()}<div class="question-card"><div class="question-head"><span class="question-icon" aria-hidden="true">${world.icon}</span><div><p class="eyebrow">${world.name}</p><h1>${esc(question.title)}</h1></div></div><p class="prompt">${esc(question.prompt)}</p>${answerArea(question)}<div class="actions"><button id="check-button" class="button" type="button" data-action="check" ${E.complete(question,draft)?'':'disabled'}>Provjeri</button></div></div></section>`;
  }

  function render(focusPicker){app.innerHTML=view==='home'?home():view==='worlds'?worlds():play();const node=typeof focusPicker==='function'?focusPicker():null;if(node)node.focus();else focusMain();}
  const focusValue=(selector,value)=>()=>[...app.querySelectorAll(selector)].find(node=>node.dataset.value===value)||null;
  const focusFirst=selector=>()=>app.querySelector(selector);
  function start(world){
    const previous=session&&session.level===level&&session.world===world?new Set(session.questions.map(question=>question.id)):new Set();
    const baseSeed=seed();let selected=null,best=null,bestOverlap=Infinity;
    for(let attempt=0;attempt<64;attempt++){
      const trialSeed=(baseSeed+Math.imul(attempt,0x9e3779b1))>>>0,questions=C.buildRound(level,world,trialSeed);
      const overlap=questions.reduce((total,question)=>total+(previous.has(question.id)?1:0),0);
      if(overlap<bestOverlap){best={seed:trialSeed,questions};bestOverlap=overlap;}
      if(overlap===0){selected=best;break;}
    }
    selected=selected||best;session=E.createSession(level,world,selected.seed,selected.questions);draft=null;pending=null;save();view='play';render();
  }
  function choose(value){draft.selected=value;render(focusValue('[data-choice]',value));}
  function matchLeft(value){pending=value;render(focusValue('[data-match-left]',value));}
  function matchRight(value){if(!pending)return;draft.pairs.push([pending,value]);pending=null;render(focusFirst('[data-match-left], [data-remove-pair]'));}
  function sortItem(value){pending=value;render(focusValue('[data-sort-item]',value));}
  function sortZone(zone){if(!pending)return;draft.zones[zone].push(pending);pending=null;render(focusFirst('[data-sort-item], [data-remove-sort]'));}

  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.level){level=target.dataset.level;view='worlds';render();return;}
    if(target.dataset.world){start(target.dataset.world);return;}
    if(target.hasAttribute('data-choice')){choose(target.dataset.value);return;}
    if(target.hasAttribute('data-match-left')){matchLeft(target.dataset.value);return;}
    if(target.hasAttribute('data-match-right')){matchRight(target.dataset.value);return;}
    if(target.hasAttribute('data-sort-item')){sortItem(target.dataset.value);return;}
    if(target.hasAttribute('data-sort-zone')){sortZone(target.dataset.value);return;}
    if(target.hasAttribute('data-sequence-item')){draft.items.push(target.dataset.value);render(focusFirst('[data-sequence-item], [data-remove-sequence]'));return;}
    if(target.dataset.removePair!==undefined){draft.pairs.splice(Number(target.dataset.removePair),1);render(focusFirst('[data-match-left]'));return;}
    if(target.dataset.removeSort!==undefined){const [zone,index]=target.dataset.removeSort.split(':'),item=draft.zones[zone][Number(index)];draft.zones[zone].splice(Number(index),1);render(focusValue('[data-sort-item]',item));return;}
    if(target.dataset.removeSequence!==undefined){const [item]=draft.items.splice(Number(target.dataset.removeSequence),1);render(focusValue('[data-sequence-item]',item));return;}
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
