(function(){
  'use strict';
  const E=ThinkEngine,bank=ThinkContent,main=document.getElementById('main'),owl=document.querySelector('.brand img').src;
  const paths={
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M9 8l3 5m0-5-3 5"/>',
    leaf:'<path d="M20 4C8 2 2 9 6 16s15 3 14-12ZM4 21 16 9M9 16v-5m4 1h5"/>',
    puzzle:'<path d="M4 4h6c-2 5 6 5 4 0h6v6c-5-2-5 6 0 4v6h-6c2-5-6-5-4 0H4v-6c5 2 5-6 0-4Z"/>',
    mountain:'<path d="m2 21 7-12 5 8 3-5 5 9H2ZM9 9V3m0 0h6l-2 2 2 2H9m-3 7 3 2 2-2"/>',
    check:'<path d="m7 12 3 3 7-7"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
    chat:'<path d="M21 11c0 5-4 8-9 8H5l-3 3V11c0-5 4-8 10-8s9 3 9 8Z"/><path d="M7 10h.01M12 10h.01M17 10h.01"/>',
    bulb:'<path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8ZM9 20h6M10 23h4M9 8c0-2 1-3 3-3"/>',
    sign:'<path d="M12 3v19M3 5h14l4 4-4 4H3V5Zm18 10H7l-4 3 4 3h14v-6Z"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
    shuffle:'<path d="m3 5 4 0 10 14h4m-4-4 4 4-4 4M3 19h4L17 5h4m-4-4 4 4-4 4"/>',
    heart:'<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1s-2 6 0 8l8 8 8-8c2-2 3-5 0-8Z"/>',
    tick:'<path d="m4 12 5 5L20 6"/>',circheck:'<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>'
  };
  function icon(name){return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.search}</svg>`;}
  const levels=[{id:1,name:'Lagani zadaci',desc:'Uoči jednu važnu stvar.',icon:'leaf'},{id:2,name:'Teži zadaci',desc:'Poveži dvije informacije.',icon:'puzzle'},{id:3,name:'Teški zadaci',desc:'Provjeri svoj zaključak.',icon:'mountain'}];
  const categories=[{id:'error',name:'Pronađi pogrešku',icon:'search'},{id:'missing',name:'Što nedostaje?',icon:'puzzle'},{id:'claim',name:'Provjeri tvrdnju',icon:'check'},{id:'fact',name:'Činjenica ili mišljenje?',icon:'chat'},{id:'alternative',name:'Drugo objašnjenje',icon:'bulb'},{id:'decision',name:'Odluči prema uvjetima',icon:'sign'}];
  let level=1,view='home',round=null,pendingCategory=null,lastMixed=[];
  const storageKey = 'mislim-i-otkrivam-round-v1';

  function saveRound() {
    if (!round) return;
    const { questions, ...state } = round;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ ...state, ids: questions.map(q => q.id), lastMixed }));
    } catch { /* Practice still works when this tab cannot store a round. */ }
  }

  function validOrder(order, count) {
    return Array.isArray(order) && order.length === count && new Set(order).size === count &&
      order.every(value => Number.isInteger(value) && value >= 0 && value < count);
  }

  function restoreRound() {
    try {
      const record = JSON.parse(sessionStorage.getItem(storageKey));
      if (!record) return;
      const { ids, lastMixed: previousMixed, ...state } = record;
      const { level, category, index, phase, attempts, solved, answerOrder, reasonOrder, answer, reason } = state;
      if (!levels.some(item => item.id === level) || !Array.isArray(ids) || new Set(ids).size !== ids.length) return;

      const pool = bank.filter(q => q.level === level && (category === 'mix' || q.cat === category));
      const count = category === 'mix' ? categories.length : pool.length;
      if (!count || ids.length !== count || !Number.isInteger(index) || index < 0 || index >= count) return;
      const questions = ids.map(id => pool.find(q => q.id === id));
      if (questions.some(q => !q)) return;
      if (category === 'mix' && new Set(questions.map(q => q.cat)).size !== count) return;
      if (![attempts, solved, answerOrder, reasonOrder].every(list => Array.isArray(list) && list.length === count)) return;
      if (!attempts.every(n => Number.isSafeInteger(n) && n >= 0)) return;
      if (!questions.every((q, i) => validOrder(answerOrder[i], q.answers.length) && validOrder(reasonOrder[i], q.reasons.length))) return;

      if (!['answer', 'reason', 'incorrect', 'correct', 'complete'].includes(phase)) return;
      const feedback = ['incorrect', 'correct', 'complete'].includes(phase);
      const correct = phase === 'correct' || phase === 'complete';
      if ((answer !== null && !answerOrder[index].includes(answer)) || (reason !== null && !reasonOrder[index].includes(reason))) return;
      if ((phase !== 'answer' && answer === null) || (feedback && reason === null)) return;
      const validPair = questions[index].validPairs.some(pair => pair[0] === answer && pair[1] === reason);
      if (feedback && (attempts[index] === 0 || validPair !== correct)) return;
      if (solved.some((done, i) => done !== (i < index || (i === index && correct)))) return;
      if (phase === 'complete' && index !== count - 1) return;

      round = { ...state, questions };
      const mixed = Array.isArray(previousMixed) ? bank.filter(q => previousMixed.includes(q.id)) : [];
      if (mixed.length === categories.length && new Set(mixed.map(q => q.cat)).size === categories.length) {
        lastMixed = mixed.map(q => q.id);
      }
    } catch { /* Ignore inaccessible, incomplete, or outdated round data. */ }
  }
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label=()=>levels.find(l=>l.id===level).name;
  const pill=()=>`<span class="pill level-pill l${level}">${label()}</span>`;
  const action=(act,text,cls='button',extra='')=>`<button class="${cls}" data-action="${act}" ${extra}>${text}</button>`;
  const activeRound=()=>round&&round.phase!=='complete';
  function resume(){return activeRound()?`<aside class="resume"><p><strong>Vježba te čeka.</strong><br>${levels.find(l=>l.id===round.level).name} · ${E.stats(round).completed} od ${round.questions.length} dovršeno</p>${action('resume','Nastavi vježbu '+icon('arrow'),'button secondary')}</aside>`:'';}
  function home(){return `<section class="view"><div class="hero"><div><p class="eyebrow">Mali istraživači · Velike ideje</p><h1>Svaki odgovor<br>ima svoj <span>zašto.</span></h1><p>Pogledaj, razmisli i objasni.</p></div><div class="hero-art" aria-hidden="true"><span class="spark one">✦</span><span class="spark two">✧</span><img src="${owl}" alt="" width="253" height="253"></div></div><div class="levels">${levels.map(l=>`<article class="level-card l${l.id}"><span class="level-number">0${l.id}</span><div class="icon-well">${icon(l.icon)}</div><h3>${l.name}</h3><p>${l.desc}</p>${action('level','Odaberi '+icon('arrow'),'button',`data-level="${l.id}" aria-label="Odaberi: ${l.name}"`)}</article>`).join('')}</div><div class="under-levels"><span>${icon('puzzle')}6 područja</span><span>${icon('chat')}Odgovor + razlog</span><span>${icon('heart')}Bez žurbe</span></div>${resume()}</section>`;}
  function areas(){return `<section class="view"><div class="topline">${action('home',icon('back')+'Težina','text-button')}${pill()}</div><div class="section-heading"><p class="eyebrow">Slijedi svoju znatiželju</p><h1>Što ćemo istražiti?</h1><p>Odaberi jedno područje ili isprobaj pomalo od svega.</p></div><div class="topics">${categories.map(c=>`<button class="topic" data-action="start" data-category="${c.id}"><span class="icon-well">${icon(c.icon)}</span><span><strong>${c.name}</strong><small>2 zadatka</small></span></button>`).join('')}</div><div class="mix-wrap">${action('start',icon('shuffle')+'Pomiješaj sve · 6 zadataka','button','data-category="mix"')}</div>${resume()}</section>`;}
  function progress(){return `<div class="topline">${action('areas',icon('back')+'Područja','text-button')}${pill()}</div><div class="progress-wrap"><div class="progress" role="progressbar" aria-label="Dovršeni zadaci" aria-valuemin="0" aria-valuemax="${round.questions.length}" aria-valuenow="${E.stats(round).completed}">${round.questions.map((q,i)=>`<span class="${round.solved[i]?'filled':i===round.index?'current':''}"></span>`).join('')}</div><span class="progress-text">Zadatak ${round.index+1} od ${round.questions.length}</span></div>`;}
  function head(q){const cat=categories.find(c=>c.id===q.cat);return `<div class="question-head"><div class="icon-well">${icon(cat.icon)}</div><div><p class="eyebrow">${cat.name}</p><h1>${esc(q.title)}</h1></div></div>`;}
  function choices(q,type){const key=type==='answer'?'answers':'reasons',order=type==='answer'?round.answerOrder[round.index]:round.reasonOrder[round.index];return `<fieldset class="options"><legend>${type==='answer'?'Odaberi odgovor':'Odaberi razlog'}</legend>${order.map(i=>`<label class="option"><input type="radio" name="${type}" value="${i}" ${round[type]===i?'checked':''}><span>${esc(q[key][i])}</span></label>`).join('')}</fieldset>`;}
  function selection(title,text){return `<div class="selection"><small>${title}</small><strong>${esc(text)}</strong></div>`;}
  function exercise(){
    if(round.phase==='complete')return results();
    const q=round.questions[round.index],phase=round.phase;
    let body='';
    if(phase==='answer'||phase==='reason'){
      const isAnswer=phase==='answer';
      body=`${head(q)}<p class="story">${esc(q.story)}</p><p class="step"><span class="step-dot">${isAnswer?1:2}</span>${isAnswer?'Odaberi odgovor':'Odaberi razlog'}</p><p class="prompt">${isAnswer?esc(q.prompt):'Zašto tako misliš?'}</p>${isAnswer?'':selection('Tvoj odgovor',q.answers[round.answer])}${choices(q,isAnswer?'answer':'reason')}<div class="actions">${isAnswer?'':action('change-answer',icon('back')+'Promijeni odgovor','text-button')}${action(isAnswer?'reason':'submit',isAnswer?'Odaberi razlog '+icon('arrow'):'Provjeri odgovor i razlog','button',round[isAnswer?'answer':'reason']===null?'disabled':'')}</div>`;
    }else{
      const correct=phase==='correct';
      body=`<div class="feedback-hero ${phase}" role="status">${icon(correct?'circheck':'chat')}<div><h1>${correct?'Točno! Dobro si zaključila.':'Nije još sve točno.'}</h1><p>${correct?'Odgovor i razlog se slažu.':'Pogledaj ponovno odgovor i razlog.'}</p></div><img src="${owl}" alt="" width="112" height="112">${correct?`<div class="celebrate" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`:''}</div><div class="answer-review">${selection('Tvoj odgovor',q.answers[round.answer])}${selection('Tvoj razlog',q.reasons[round.reason])}</div><div class="actions">${action(correct?'next':'retry',correct?(round.index===round.questions.length-1?'Pogledaj završetak':'Sljedeći zadatak')+' '+icon('arrow'):'Pokušaj ponovno')}</div>`;
    }
    return `<section class="exercise view">${progress()}<div class="question-card">${body}</div></section>`;
  }
  function results(){const s=E.stats(round);return `<section class="results view"><div class="topline">${action('areas',icon('back')+'Područja','text-button')}${pill()}</div><div class="results-hero"><img src="${owl}" alt="" width="160" height="160"><div><p class="eyebrow">Vježba je dovršena</p><h1>Bravo, istraživačice!</h1><p>Dovršila si ${round.questions.length===6?'svih 6 zadataka':'oba zadatka'}.</p></div></div><div class="stats"><div class="stat"><strong>${s.firstTry}</strong><span>Iz prvog pokušaja</span></div><div class="stat"><strong>${s.retried}</strong><span>Uz ponovni pokušaj</span></div></div><p class="encouragement">Dobri istraživači provjeravaju svoje zaključke.</p><div class="actions">${action('again','Nova vježba '+icon('arrow'))}${action('home','Promijeni težinu','button secondary')}</div><div class="completed-topics">${[...new Set(round.questions.map(q=>q.cat))].map(cat=>`<span>${icon('tick')}${categories.find(c=>c.id===cat).name}</span>`).join('')}</div></section>`;}
  function render(focus=true){saveRound();main.innerHTML=view==='home'?home():view==='areas'?areas():round?exercise():home();if(focus){main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}}
  function navigate(next){view=next;render();}
  function start(category){
    let source=bank;
    if(category==='mix'&&lastMixed.length)source=bank.filter(q=>!lastMixed.includes(q.id));
    round=E.createRound(source,level,category);
    if(category==='mix')lastMixed=round.questions.map(q=>q.id);
    navigate('play');
  }
  function requestStart(category){if(activeRound()){pendingCategory=category;document.getElementById('new-round-dialog').showModal();}else start(category);}
  main.addEventListener('change',event=>{
    const input=event.target;if(!input.matches('input[type="radio"]')||!round)return;
    const type=input.name;if(type!==round.phase)return;
    round[type]=Number(input.value);saveRound();
    const button=main.querySelector(`[data-action="${type==='answer'?'reason':'submit'}"]`);if(button)button.disabled=false;
  });
  main.addEventListener('click',event=>{
    const button=event.target.closest('button[data-action]');if(!button||button.disabled)return;
    const act=button.dataset.action;
    if(act==='home')return navigate('home');
    if(act==='areas')return navigate('areas');
    if(act==='level'){level=Number(button.dataset.level);return navigate('areas');}
    if(act==='start')return requestStart(button.dataset.category);
    if(act==='resume'){level=round.level;return navigate('play');}
    if(!round)return;
    if(act==='reason'&&round.phase==='answer'&&round.answer!==null){round.phase='reason';render();}
    if(act==='change-answer'&&round.phase==='reason'){round.phase='answer';round.reason=null;render();}
    if(act==='submit'){const r=E.submit(round,round.answer,round.reason);if(r.accepted)render();}
    if(act==='retry'&&E.retry(round))render();
    if(act==='next'&&E.advance(round))render();
    if(act==='again'&&round.phase==='complete')start(round.category);
  });
  document.getElementById('brand').addEventListener('click',()=>navigate('home'));
  document.getElementById('continue-round').addEventListener('click',()=>{document.getElementById('new-round-dialog').close();level=round.level;navigate('play');});
  document.getElementById('confirm-new').addEventListener('click',()=>{document.getElementById('new-round-dialog').close();start(pendingCategory);});
  restoreRound();render(false);
})();
