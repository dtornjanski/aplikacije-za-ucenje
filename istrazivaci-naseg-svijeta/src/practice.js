(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=node?factory(require('./engine.js'),require('./content.js'),require('./lessons.js'),require('./activities.js'),require('./book.js')):factory(root.WorldEngine,root.WorldContent,root.WorldLessons,root.WorldActivities,root.WorldBook);
  if(node)module.exports=api;else root.WorldPractice=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E,C,L,A,B){
  'use strict';
  const {levels,worlds,banks}=C,{lessons}=L;
  const direct=[0,4,5,7,10,11];
  // Each pair is another valid answer to the original question and a related misconception.
  const claims={
    school:[
      ['pričekamo da druga osoba dovrši misao','samo najbrži učenici smiju pitati'],
      ['čujemo upute od početka','sat počinje kad posljednja osoba stigne'],
      ['svatko radi dogovoreni dio zajedničkog zadatka','najglasnija osoba sama podijeli sve zasluge'],
      ['pitamo je kako želi sudjelovati','uvijek je pustimo da sama radi izvan skupine'],
      ['da svi dobiju priliku za učenje','da prednost uvijek ima najbrža osoba'],
      ['izmjenjujemo se u igri prema dogovoru','u svakoj igri prva igra ista osoba']],
    home:[
      ['majčina sestra','igralište u ulici'],
      ['svatko pomaže koliko može','jedna osoba zato mora obaviti sav posao'],
      ['više obitelji ima odvojene stanove iza istog ulaza','jedan šator ima dvije vreće za spavanje'],
      ['složiti svoje knjige na policu','samo mijenjati oštećenu utičnicu'],
      ['da ljudi mogu proći do svojih vrata','da u njemu možemo ostavljati sve igračke'],
      ['ljudi u oba prostora brinu o zajedničkim stvarima','u oba prostora svatko ima svoju spavaću sobu']],
    autumn:[
      ['opada lišće mnogih stabala','svaki dan ima više sati svjetla nego prethodni'],
      ['ranije se smrači','ujesen mrak uvijek pada tek iza ponoći'],
      ['jutro može biti hladno i maglovito','svakog jesenskog dana pada snijeg'],
      ['pripremaju zalihe za hladne dane','sve se životinje sele u toplije krajeve'],
      ['na hladnoći je manje kukaca kojima se neke ptice hrane','zato što sve ptice moraju napustiti svoje gnijezdo u isto vrijeme'],
      ['datum i boja lišća na označenoj grani','samo naziv promatračeve škole']],
    winter:[
      ['kiša','suhi list koji pada s grane'],
      ['u jesen su odbacila lišće','sva stabla svake zime izgube baš sve listove'],
      ['oko početka zime kasnije sviće nego ljeti','početkom zime imamo najdulje dane'],
      ['mnoge biljke miruju do toplijih dana','sve biljke uginu svake zime'],
      ['u toplijoj okolini snijeg prelazi u vodu','snijeg se može otopiti samo ako ga netko dodirne'],
      ['na snijegu je zabilježen put kojim je prošla životinja','iz tragova uvijek znamo točan sat prolaska']],
    spring:[
      ['na mnogim se granama otvaraju pupovi','sva stabla u proljeće odmah daju zrele plodove'],
      ['dulji dani biljkama daju više svjetlosti','svakoj biljci treba isključivo hlad za rast'],
      ['iz njega može izrasti cvijet','u njemu nastane zrno pijeska'],
      ['neke ptice grade gnijezda','sve ptice napuštaju gnijezda prije polaganja jaja'],
      ['u toplije doba ponovno mogu pronaći više kukaca','vraćaju se jer u proljeće nestaje sva hrana'],
      ['odjeća u slojevima i zaštita za kišu','za cijeli je dan dovoljan samo kupaći kostim']],
    summer:[
      ['mnogo toplih, sunčanih dana','najkraće je razdoblje dnevnog svjetla'],
      ['nema dovoljno vode za biljku kad je tlo suho','vrućina zamjenjuje vodu potrebnu korijenu'],
      ['svjetlo je veći dio dana nego zimi','na početku ljeta noć traje dulje nego dan'],
      ['sjenovito mjesto za odmor','što toplije mjesto na suncu bez vode'],
      ['manje se vode izgubi isparavanjem','voda se može upiti samo po noći'],
      ['na vrućini se osjećaš vrlo slabo i vrti ti se','u torbi nosiš šešir']],
    spacetime:[
      ['stol je viši od lopte koja je točno pod njim','stol je ispod te lopte'],
      ['na tom mjestu vozači trebaju osobito paziti na pješake','pješak ondje uvijek može prijeći bez provjere'],
      ['od škole ideš prema desnoj strani skice','od škole ideš prema lijevoj strani skice'],
      ['osam sati','pola devet'],
      ['poznati nam objekti služe za snalaženje','svaki predmet na skici mora biti u prirodnoj veličini'],
      ['tjedan ima sedam dana','veljača uvijek ima trideset dana']],
    energy:[
      ['Sunce koje obasjava Zemlju','ugašena svjetiljka'],
      ['toplina iz čaja prelazi na hladniji metal','hladna žlica sama zagrijava topliji čaj'],
      ['električni kabel priključenog uređaja','plastična polica ispod uređaja'],
      ['ugasiti rasvjetu koja više nikomu ne treba','ostaviti svjetlo upaljeno dok su svi vani'],
      ['zatvaranjem vrata čuvamo hladnoću u hladnjaku','otvorena vrata pomažu hladnjaku da troši manje'],
      ['rasvjeta praznog parkirališta nepotrebno svijetli jako cijelu noć','svjetiljka osvjetljuje put dok njime netko prolazi']],
    health:[
      ['redovito se kretati i odmarati','zamijeniti sav odmor igrom na zaslonu'],
      ['pomaže nam da imamo snage za jutarnje aktivnosti','nakon doručka tijelu nikad više toga dana ne treba hrana'],
      ['varivo od graha i povrća uz kruh','samo jedna vrsta keksa'],
      ['čist papir za spremnik za papir','sve pomiješano i ostavljeno u travi'],
      ['tijekom stanke možemo protegnuti tijelo i pogledati u daljinu','zaslon se nakon svake stanke sam očisti'],
      ['preglasan zvučnik noću ometa susjede','tihi šapat u knjižnici']],
    nature:[
      ['mrav','komadić stakla'],
      ['nedostaje joj svjetlost za stvaranje hrane','svjetlost je biljkama potrebna samo za boju posude'],
      ['kroz staklo se jasno vidi ono što je iza njega','staklo je neprozirno'],
      ['osjetilom njuha u nosu','osjetilom sluha u uhu'],
      ['u tom opažanju nije potonuo na dno','svi predmeti iste boje zato će plutati'],
      ['mlada biljka graha','staklena čaša']],
    place:[
      ['trg','zvijezda na nebu'],
      ['različiti poslovi omogućuju ljudima da jedni drugima pomognu','svako zanimanje služi samo onome tko ga obavlja'],
      ['staza vodi preko brda','u redu stoje samo tri klupe'],
      ['sačuvati stare običaje i prirodne ljepote','sve vrijedne stare predmete treba baciti'],
      ['otpaci mogu onečistiti stanište biljaka i životinja','voda odmah ukloni svaku vrstu otpada']]
  };
  const fairEdges={
    'school-3':[[0,1],[0,2],[1,3],[2,3],[3,4]],
    'home-3':[[0,1],[1,2],[1,3],[2,4],[3,4]],
    'home-6':[[0,1],[0,2],[0,3],[1,4],[2,4],[3,4]],
    'winter-3':[[0,3],[1,3],[2,3],[3,4]],'spring-3':[[0,1],[1,2],[2,3],[2,4]],
    'summer-3':[[0,1],[0,2],[1,3],[2,3],[3,4]],
    'health-6':[[0,1],[0,2],[0,3],[0,4]],
    'place-3':[[0,1],[0,2],[1,3],[2,3],[3,4]],'place-6':[[0,1],[0,2],[2,3],[1,4],[3,4]]
  };
  const sequential=[[0,1],[1,2],[2,3],[3,4]];
  function sequence(def,world,key,level,rng){
    const edges=fairEdges[world+'-'+key]||sequential;
    const groups=level==='hard'?[[0],[1],[2],[3],[4]]:level==='easy'?[[0,1],[2,3],[4]]:
      world==='home'&&key===3?[[0,1],[2],[3],[4]]:[[0],[1],[2,3],[4]];
    const cards=groups.map(g=>g.length===1?def.steps[g[0]]:def.steps[g[0]]+(edges.some(([a,b])=>a===g[0]&&b===g[1])?', zatim ':' i ')+def.steps[g[1]]);
    const groupOf=i=>groups.findIndex(group=>group.includes(i));
    const constraints=edges.map(([a,b])=>[groupOf(a),groupOf(b)]).filter(([a,b])=>a!==b);
    return {type:def.type,prompt:def.prompt,items:E.shuffle(cards,rng),answer:cards,constraints};
  }
  function definition(world,key){
    if(world==='spacetime'&&key===2)return {...banks[world][key],zones:{kopno:['bicikl','vlak','autobus'],voda:['brod','trajekt','jedrilica s jedrom'],zrak:['zrakoplov','helikopter','zrakoplovna jedrilica']}};
    if(world==='home'&&key===0)return {...banks[world][key],prompt:'Koji naziv označuje rodbinski odnos?'};
    if(world==='home'&&key===2)return {...banks[world][key],zones:{dom:['obiteljska kuhinja','moja spavaća soba kod kuće','obiteljski dnevni boravak'],škola:banks.home[key].zones.škola}};
    if(world==='home'&&key===6)return {...banks[world][key],prompt:'Ovo jutro sve pripreme obavljaš nakon buđenja, prije polaska u školu. Složi jedan moguć redoslijed.'};
    if(world==='winter'&&key===3)return {...banks[world][key],prompt:'Pripremate se za izlazak. Prije izlaska provjerite put i odjenite se za hladnoću.'};
    if(world==='winter'&&key===6)return {...banks[world][key],prompt:'Prati što se dogodilo na školskom igralištu od prve pahulje do lokve.',steps:['prva pahulja padne na prazno igralište','snijeg se počne skupljati na tlu','djeca ostave tragove u novom snijegu','sunce zagrije snijeg s tragovima','na mjestu tragova ostane lokva']};
    if(world==='autumn'&&key===6)return {...banks[world][key],prompt:'Prati jedan označeni list na stablu.',steps:['na označenoj grani raste zeleni list','rubovi toga lista počinju žutjeti','cijeli označeni list postane žut','odvoji se od grane','padne na tlo']};
    if(world==='health'&&key===6)return {...banks[world][key],prompt:'Završavaš s vježbanjem. Složi jedan moguć redoslijed odmora i brige o sebi.'};
    if(world==='energy'&&key===3)return {...banks[world][key],title:'Spremam punjivu svjetiljku',prompt:'Posudila si napunjenu ručnu svjetiljku. Poredaj događaje iz ove priče.',steps:['odaberi knjigu koju želiš čitati','upali svjetiljku kako bi vidjela tekst','pročitaj priču do kraja','ugasi svjetiljku nakon čitanja','vrati ugašenu svjetiljku na policu']};
    if(world==='place'&&key===6)return {...banks[world][key],steps:[...banks.place[key].steps.slice(0,4),'kupi odabrani predmet kada skupiš dovoljno']};
    return banks[world][key];
  }
  function decision(base,prompt,truth,falsehood,rng){
    const right=E.shuffle(truth,rng),wrong=E.shuffle(falsehood,rng),pattern=Math.floor(rng()*4);
    const clues=['Lara','Bitko'].map((name,i)=>name+' kaže: „'+((pattern&(1<<i))?right.pop():wrong.pop())+'”.');
    const options=['Nijedan zapis nije točan.','Samo je Lara u pravu.','Samo je Bitko u pravu.','Oba su zapisa točna.'];
    return {...base,prompt:prompt+' Procijeni oba odgovora.',clues,reasoning:'evidence',options:E.shuffle(options,rng),answer:options[pattern]};
  }
  function spatialQuestion(base,key,level,rng,legacy){
    const id={5:'skica',7:'sat',11:'kalendar'}[key],lesson=lessonById.get(id),example=Math.floor(rng()*lesson.cases);
    const q=L.make(lesson,key===5?'easy':level,example,rng,legacy);
    const info={...base,type:key===7?'single':'observe',visual:q.visual,title:key===5?'Čitam skicu':key===7?'Čitam sat':'Čitam kalendar'};
    if(key===5){
      const dir=q.answer[0],opposite={gore:'dolje',dolje:'gore',lijevo:'desno',desno:'lijevo'},pos={gore:'iznad',dolje:'ispod',desno:'desno od',lijevo:'lijevo od'};
      const prompt='Pogledaj skicu. U kojem je smjeru park gledano od škole?';
      if(level==='hard')return decision(info,prompt,['Od škole idem jedno polje '+dir+'.','Park je '+pos[dir]+' škole.'],['Park je '+pos[opposite[dir]]+' škole.','Od škole idem jedno polje '+opposite[dir]+'.'],rng);
      return {...info,prompt,options:E.shuffle(Object.keys(opposite),rng),answer:dir};
    }
    if(level!=='hard')return {...info,prompt:q.prompt,answer:q.answer,options:q.options};
    const distractors=q.options.filter(v=>v!==q.answer);
    if(key===7){
      const mins=parseInt(q.answer),word={15:'četvrt sata',30:'pola sata',45:'tri četvrtine sata',60:'jedan sat'};
      return decision(info,q.prompt,['Čekanje traje '+mins+' minuta.','Do polaska imamo '+word[mins]+'.'],distractors.map(v=>'Autobus polazi za '+parseInt(v)+' minuta.'),rng);
    }
    const day=parseInt(q.answer),month=q.visual.month.toLocaleLowerCase('hr');
    return decision(info,q.prompt,['Datum radionice je '+q.answer,'Trebam pronaći broj '+day+' u kalendaru za mjesec '+month+'.'],distractors.map(v=>'Radionica je na datum '+v),rng);
  }
  function reading(base,task,level,rng,review){
    if(task.visual)base.visual=task.visual;
    if(level==='hard')return decision(base,task.prompt,task.right,task.wrong,rng);
    const answer=task.right[review?1:0],others=E.shuffle(task.wrong,rng).slice(0,level==='easy'?2:3);
    return {...base,prompt:task.prompt,answer,options:E.shuffle([answer,...others],rng)};
  }
  function makeBase(world,level,key,rng,review,legacy){
    const extra=B.extraNames[key],def=extra?null:definition(world,key);
    const base={id:world+'-'+level+'-'+key,world,level,title:extra||def.title};
    if(extra)return reading({...base,type:'single'},B.extra(key,level,rng),level,rng,review);
    if(world==='spacetime'&&[5,7,11].includes(key))return spatialQuestion(base,key,level,rng,legacy);
    if(!legacy&&world==='autumn'&&key===4)return reading({...base,type:'cause',title:'Dva jesenska zalaska Sunca'},A.sunset(level,rng),level,rng,review);
    if(!legacy&&A.cases[world][key])return reading({...base,type:def.type},A.cases[world][key],level,rng,review);
    if(['single','cause','observe'].includes(def.type)){
      const [secondTrue,secondFalse]=claims[world][direct.indexOf(key)],wrong=E.shuffle(def.wrong,rng);
      if(level==='hard'){
        return decision({...base,type:def.type},def.prompt,[def.correct,secondTrue],[secondFalse,wrong[0],wrong[1]],rng);
      }
      const answer=review?secondTrue:def.correct,others=review?[secondFalse,...wrong]:wrong;
      return {...base,type:def.type,prompt:def.prompt,answer,options:E.shuffle([answer,...others.slice(0,level==='easy'?2:3)],rng)};
    }
    if(['order','timeline'].includes(def.type)){
      const q=sequence(def,world,key,level,rng);
      if(review){
        const edges=E.shuffle(fairEdges[world+'-'+key]||sequential,rng);
        const pair=(a,b)=>def.steps[a]+' → '+def.steps[b];
        const [before,after]=edges[0],answer=pair(before,after);
        const distractors=edges.slice(1,level==='easy'?2:3).map(([a,b])=>pair(b,a));
        return {...base,type:'single',prompt:'Pogledaj parove iz ovog zadatka. U kojem je paru redoslijed točan?',
          options:E.shuffle([answer,...distractors],rng),answer};
      }
      return {...base,...q};
    }
    if(def.type==='match'){
      const pairs=E.shuffle(def.pairs,rng).slice(0,{easy:2,medium:3,hard:4}[level]);
      if(review)return {...base,type:'single',prompt:'Koji pojam iz vježbe „'+def.title+'” odgovara opisu „'+pairs[0][1]+'”?',
        answer:pairs[0][0],options:E.shuffle(pairs.map(p=>p[0]),rng)};
      return {...base,type:'match',prompt:def.prompt,left:E.shuffle(pairs.map(p=>p[0]),rng),right:E.shuffle(pairs.map(p=>p[1]),rng),answer:pairs};
    }
    const zones=Object.keys(def.zones),answer=Object.fromEntries(zones.map(zone=>[zone,E.shuffle(def.zones[zone],rng).slice(0,{easy:1,medium:2,hard:3}[level])]));
    if(review){
      const zone=E.shuffle(zones,rng)[0],item=answer[zone][0];
      return {...base,type:'single',prompt:'U koju skupinu pripada kartica „'+item+'”?',answer:zone.replaceAll('_',' '),options:E.shuffle(zones.map(z=>z.replaceAll('_',' ')),rng)};
    }
    return {...base,type:'sort',prompt:def.prompt,zones,items:E.shuffle(Object.values(answer).flat(),rng),answer};
  }

  const keys=Object.fromEntries(worlds.map(w=>{
    const extra=B.units.filter(u=>u.world===w.id).flatMap(u=>u.keys).filter(k=>Object.hasOwn(B.extraNames,k));
    return [w.id,[...new Set([...banks[w.id].keys(),...lessons.filter(l=>l.world===w.id).map(l=>l.id),...extra])]];
  }));
  const lessonById=new Map([...lessons,...B.units].map(l=>[l.id,l]));
  function bucket(level,world,lesson){return [level,world,lesson].filter(Boolean).join('/');}
  function remember(list,value){return [...list.filter(entry=>entry!==value),value];}
  function record(history,level,refs){
    for(const ref of refs){
      const group=bucket(level,ref.world);
      history[group]=remember(history[group]||[],ref.key);
      if(lessonById.has(ref.key)){
        const subgroup=bucket(level,ref.world,ref.key);
        history[subgroup]=remember(history[subgroup]||[],ref.example);
      }
    }
  }
  function pick(candidates,recent,rng){
    return E.shuffle(candidates,rng).sort((a,b)=>recent.indexOf(a)-recent.indexOf(b))[0];
  }
  function makePlan(level,world,seed,history={},lesson=null,repeat=null){
    if(!levels.some(l=>l.id===level)||world!=='mix'&&!Object.hasOwn(keys,world))throw new Error('Nepoznata vježba.');
    if(lesson&&lessonById.get(lesson)?.world!==world)throw new Error('Nepoznata lekcija.');
    const local={...history},rng=E.makeRng(seed),plan=[];
    const unit=B.unitById.get(lesson),seenReviewMaps=new Set();
    if(repeat)for(const p of repeat)if(p.key==='skica')seenReviewMaps.add(routeKey(L.routeCard(level,p.example,p.legacy)));
    function add(w,key,previous){
      const ref={world:w,key,seed:Math.floor(rng()*0x100000000)};
      if(unit)ref.unit=unit.id;
      const l=lessonById.get(key);
      if(l){
        const recent=local[bucket(level,w,key)]||[];
        let candidates=Array.from({length:l.cases},(_,i)=>i).filter(i=>i!==previous?.example);
        if(previous&&key==='skica'){
          const before=L.routeCard(level,previous.example,previous.legacy);
          const fresh=candidates.filter(i=>!seenReviewMaps.has(routeKey(L.routeCard(level,i))));
          const previousPaths=[before.path,previous.previousMoves].filter(Array.isArray);
          const changed=fresh.filter(i=>{const card=L.routeCard(level,i);return previousPaths.every(path=>E.walk(card,path)!==card.end);});
          candidates=changed.length?changed:fresh;
        }
        ref.example=pick(candidates,recent,rng);
        if(previous&&key==='skica')seenReviewMaps.add(routeKey(L.routeCard(level,ref.example)));
      }else if(previous){
        ref.review=!previous.review;
        if(ref.seed===previous.seed)ref.seed=(ref.seed+1)>>>0;
      }
      record(local,level,[ref]);plan.push(ref);
    }
    if(repeat){for(const ref of repeat)add(ref.world,ref.key,ref);return plan;}
    if(unit){
      const pool=unit.keys.slice();
      for(let i=0;i<Math.min(5,unit.keys.length);i++){
        const key=pick(pool,local[bucket(level,world)]||[],rng);
        add(world,key);pool.splice(pool.indexOf(key),1);
      }
      return plan;
    }
    if(world==='mix'){for(const w of E.shuffle(worlds,rng))add(w.id,pick(keys[w.id],local[bucket(level,w.id)]||[],rng));}
    else for(let i=0;i<5;i++)add(world,lesson||pick(keys[world],local[bucket(level,world)]||[],rng));
    return plan;
  }
  function buildRound(level,world,seed,plan){
    if(!levels.some(l=>l.id===level)||world!=='mix'&&!Object.hasOwn(keys,world))throw new Error('Nepoznata vježba.');
    const refs=plan||makePlan(level,world,seed);
    if(!Array.isArray(refs)||!refs.length||refs.length>11)throw new Error('Neispravan broj zadataka.');
    return refs.map(ref=>{
      if(!ref||!Array.isArray(keys[ref.world])||!keys[ref.world].includes(ref.key)||(world!=='mix'&&ref.world!==world)||!Number.isInteger(ref.seed)||ref.seed<0||ref.seed>0xffffffff)throw new Error('Nepoznat zadatak.');
      const rng=E.makeRng(ref.seed),lesson=lessonById.get(ref.key);
      if(lesson&&(!Number.isInteger(ref.example)||ref.example<0||ref.example>=lesson.cases))throw new Error('Nepoznat primjer.');
      if(ref.unit){
        const unit=B.unitById.get(ref.unit);
        if(!unit||unit.world!==ref.world||!unit.keys.includes(ref.key))throw new Error('Zadatak ne pripada ovoj temi.');
      }
      const q=lesson?L.make(lesson,level,ref.example,rng,ref.legacy):makeBase(ref.world,level,ref.key,rng,ref.review===true,ref.legacy);
      return {...q,...(ref.unit?{lesson:ref.unit}:{}),ref:{...ref}};
    });
  }
  function migrateRefs(old){
    const rng=E.makeRng(old.seed);
    return old.questions.map(q=>({world:q.world,key:Number(q.id.split('-').pop()),seed:Math.floor(rng()*0x100000000)}));
  }
  function routeKey(card){return [card.start,card.end,...card.blocked].join('/');}
  function restore(saved){
    if(!saved||saved.contentRevision||!Array.isArray(saved.plan))return E.restore(saved,buildRound);
    try{
      const seen=new Set(),old=E.restore({...saved,plan:saved.plan.map(r=>({...r,legacy:true}))},buildRound);
      if(!old)return null;
      const currentStarted=old.attempts[old.index]>0||old.pending!==null||
        !E.sameResponse(old.questions[old.index],old.draft,E.emptyDraft(old.questions[old.index]));
      const plan=saved.plan.map((r,i)=>{
        const pinned=i<old.index||(i===old.index&&currentStarted);
        const ref={...r,...(pinned?{legacy:true}:{})};
        if(r.key==='skica'){
          const card=n=>L.routeCard(old.level,n,pinned);
          if(!pinned&&seen.has(routeKey(card(ref.example)))){
            ref.example=Array.from({length:24},(_,n)=>(n+r.example+1)%24).find(n=>!seen.has(routeKey(card(n))));
          }
          seen.add(routeKey(card(ref.example)));
        }
        return ref;
      });
      return E.restore({...saved,plan},buildRound);
    }catch{return null;}
  }
  return {levels,worlds,lessons,lessonById,units:B.units,unitById:B.unitById,bookGroups:B.groups,keys,makePlan,record,buildRound,migrateRefs,restore};
});
