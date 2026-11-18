(function(root,factory){
  const E=typeof module==='object'&&module.exports?require('./engine.js'):root.WorldEngine;
  const api=factory(E);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.WorldLessons=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';

  const lessons=[
    ['dogovor','school','Razredni dogovor','🤝',8],['stablo','home','Obiteljsko stablo','🌳',12],
    ['lisce','autumn','Jesenski dnevnik','🍂',12],['tragovi','winter','Tragovi u snijegu','🐾',12],
    ['pupoljci','spring','Od pupa do cvijeta','🌷',12],['vrijeme','summer','Ljetna mjerenja','🌤️',12],
    ['sat','spacetime','Sat','🕒',12],['kalendar','spacetime','Kalendar','📅',24],
    ['skica','spacetime','Skica puta','🗺️',24],['uredaji','energy','Uređaji u našoj učionici','💡',12],
    ['ruke','health','Čiste ruke u školi','🧼',8],['pokus','nature','Što pluta, a što tone?','🔬',12],
    ['ustanove','place','Ustanove u mjestu','🏘️',12]
  ].map(([id,world,name,icon,cases])=>({id,world,name,icon,cases}));

  const days=['ponedjeljak','utorak','srijeda','četvrtak','petak','subota','nedjelja'];
  const months=['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'];
  const activities=['čitanje priče','glazbena igra','izrada plakata','rad u vrtu','sat crtanja','posjet knjižnici'];
  const girls=['Mia','Ema','Rita','Iva','Nika','Dora','Eva','Lana','Nora','Una','Tena','Klara'];
  const boys=['Tin','Borna','Luka','Fran','Jan','Roko'];
  const arrows=E.directions;
  const unique=values=>[...new Set(values)];
  const timeLabel=(hour,minute)=>String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
  const table=(caption,headers,rows)=>({kind:'table',caption,headers,rows});
  function choice(prompt,answer,distractors,rng,visual){
    const options=E.shuffle(unique(distractors).filter(option=>option!==answer),rng).slice(0,3);
    return {type:'observe',prompt,answer,options:E.shuffle([answer,...options],rng),visual};
  }

  function clock(level,n,rng){
    const h=1+n%12,m=level==='easy'?0:level==='medium'?(n%2?0:30):[30,45,15,0][n%4];
    const visual={kind:'clock',h,m};
    if(level==='easy') return choice('Koliko je sati na uri?',timeLabel(h,0),[timeLabel(h%12+1,0),timeLabel((h+9)%12+1,0),timeLabel(h,30)],rng,visual);
    // A morning timetable keeps the 12-hour clock unambiguous.
    const hour=7+n%5,minute=level==='medium'?(n%2?30:0):m;
    visual.h=hour;visual.m=minute;
    if(level==='medium'){
      const slot=n%3,start=hour*60+minute-30*slot;
      const labels=E.shuffle(activities,rng).slice(0,3);
      const rows=labels.map((label,i)=>{const minutes=start+30*i;return [timeLabel(Math.floor(minutes/60),minutes%60),label];});
      visual.detail=table('Jutarnji raspored',['Vrijeme','Aktivnost'],rows);
      return choice('Pogledaj uru i raspored. Što upravo počinje?',labels[slot],labels,rng,visual);
    }
    const duration=[15,30,45,60][(n+Math.floor(n/4))%4],departure=hour*60+minute+duration;
    const answer=duration+' min';
    return choice('Ura pokazuje sadašnje vrijeme. Autobus polazi u '+timeLabel(Math.floor(departure/60),departure%60)+'. Koliko još čekaš?',answer,['15 min','30 min','45 min','60 min'],rng,visual);
  }

  function calendar(level,n,rng){
    const year=2027+Math.floor(n/12),month=n%12,day=6+(n*7)%16;
    const first=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
    const count=new Date(Date.UTC(year,month+1,0)).getUTCDate(),weekday=(first+day-1)%7;
    const visual={kind:'calendar',year,month:months[month],first,count,day};
    const dateLabel=d=>d+'. '+String(month+1)+'.';
    if(level==='easy') return choice('Dan izleta označen je zvjezdicom. Kojega je datuma izlet?',dateLabel(day),[day-2,day+1,day+4].map(dateLabel),rng,visual);
    if(level==='medium') return choice('Kojeg je dana u tjednu izlet označen zvjezdicom?',days[weekday],[1,2,6].map(i=>days[(weekday+i)%7]),rng,visual);
    const delta=2+n%4,after=n%2===0;
    return choice('Radionica je '+delta+' dana '+(after?'nakon izleta':'prije izleta')+'. Kojega je datuma radionica?',dateLabel(day+(after?delta:-delta)),[day,day+(after?delta:-delta)+1,day+(after?delta:-delta)-1,day+(after?-1:1)].filter(d=>d>0&&d<=count).map(dateLabel),rng,visual);
  }

  function pathOptions(start,end,blocked){
    const queue=[[start,[]]],visited=new Set([start]);
    for(let i=0;i<queue.length;i++){
      const [at,steps]=queue[i];
      if(at===end)return steps;
      for(const [name,[dx,dy]] of Object.entries(arrows)){
        const x=at%3+dx,y=Math.floor(at/3)+dy,to=3*y+x;
        if(x<0||x>2||y<0||y>2||blocked.includes(to)||visited.has(to))continue;
        visited.add(to);queue.push([to,[...steps,name]]);
      }
    }
    return null;
  }
  function route(level,n){
    const length=level==='easy'?1:level==='medium'?2:3;
    const layouts=[];
    for(let start=0;start<9;start++)for(let end=0;end<9;end++){
      if(start===end)continue;
      const openPath=pathOptions(start,end,[]);
      if(openPath.length!==length)continue;
      if(level!=='hard'){layouts.push({start,end,blocked:[],path:openPath});continue;}
      for(let rock=0;rock<9;rock++){
        if(rock===start||rock===end)continue;
        const path=pathOptions(start,end,[rock]);
        if(path&&path.length===length)layouts.push({start,end,blocked:[rock],path});
      }
    }
    const {start,end,blocked,path}=layouts[(n*7)%layouts.length];
    return {type:'route',prompt:'Kreni od škole do parka u '+length+(length===1?' potezu.':' poteza.')+' Svaka strelica pomiče te za jedno polje.'+(blocked.length?' Zaobiđi radove.':''),
      visual:{kind:'map',start,end,blocked},answer:path,items:Object.keys(arrows)};
  }

  function family(level,n,rng){
    const [grand,a,b,kid]=[0,3,5,8].map(i=>girls[(n+i)%girls.length]),other=boys[n%boys.length];
    const visual={kind:'family',grand,adults:[a,b],children:[kid,other]};
    if(level==='easy')return choice('Tko je na stablu dijete osobe po imenu '+a+'?',kid,[b,other,grand],rng,visual);
    if(level==='medium')return choice(kid+' pita: „Kako se zove sestra moje mame?”',b,[a,grand,other],rng,visual);
    return choice(other+' kaže: „Tražim dijete s kojim dijelim baku, a imamo različite mame.” Koga traži?',kid,[grand,a,b],rng,visual);
  }
  function autumn(level,n,rng){
    const firstDay=1+n,lastDay=firstDay+7,a=9+n%5,b=a-(2+n%4);
    const visual=table('Ista grana u listopadu',['Datum','Listovi na grani'],[[firstDay+'. 10.','🍃 '+a],[lastDay+'. 10.','🍂 '+b]]);
    visual.leaves=[a,b];
    if(level==='easy')return choice('Koliko je listova na grani pri drugom opažanju?',String(b),[a,b+1,b-1].map(String),rng,visual);
    if(level==='medium')return choice('Što se vidi iz obaju zapisa?','Na grani je manje listova.',['Na grani je više listova.','Broj listova ostao je isti.'],rng,visual);
    return choice('Koliko je manje listova na grani tjedan dana poslije?',String(a-b),[a-b+1,a-b-1,a].map(String),rng,visual);
  }
  function winter(level,n,rng){
    const spots=['kod bora','kod klupe','uz ogradu','kraj kućice'],more=spots[n%4],less=spots[(n+1)%4];
    const a=4+n%3,b=a-1-(Math.floor(n/3)%3);
    const rows=E.shuffle([[more,'🐾'.repeat(a)],[less,'🐾'.repeat(b)]],rng);
    const visual=table('Otisci u snijegu · svaki znak označuje jedan otisak',['Mjesto','Otisci'],rows);
    visual.readable=rows.map(([spot,icons])=>spot+' — '+Array.from(icons).length+' otisaka').join('. ');
    if(level==='easy')return choice('Gdje vidiš više otisaka?',more,[less,'Na oba mjesta jednako.'],rng,visual);
    if(level==='medium')return choice('Koliko je otisaka više '+more+' nego '+less+'?',String(a-b),[a-b+1,a-b+2,0].map(String),rng,visual);
    if(n%2)return choice('Jedan otisak ne znači nužno jednu životinju. Što sigurno možeš usporediti?','Broj vidljivih otisaka na svakom mjestu.',['Točnu dob životinja.','Broj različitih životinja.','Vrijeme prolaska svake životinje.'],rng,visual);
    return choice('Koji zaključak podupiru tragovi u snijegu?','Na oba mjesta vide se tragovi prolaska.',['Točno znamo koliko je različitih životinja prošlo.','Znamo u koliko su sati životinje prošle.','Sve je otiske ostavila ista životinja.'],rng,visual);
  }
  function spring(level,n,rng){
    const first=1+n,opened=1+n%2,states=['🌱 zatvoren pup','🌷 otvoren cvijet','🌷 otvoren cvijet','🥀 ocvali cvijet'];
    if(opened===2)states[1]='🌱 zatvoren pup';
    const dates=states.map((_,i)=>(first+i*3)+'. 4.');
    const visual=table('Ista grančica u travnju',['Datum','Što vidim'],dates.map((d,i)=>[d,states[i]]));
    if(level==='easy')return choice('Na kojem je zapisu prvi put otvoren cvijet?',dates[opened],dates,rng,visual);
    if(level==='medium')return choice('Koliko je dana prošlo od prvog zapisa do prvog prikaza otvorenog cvijeta?',String(3*opened),['3','6','9','12'],rng,visual);
    return choice('Koji zaključak možeš donijeti iz dnevnika?', 'Cvijet se otvorio između opažanja označenih datumima '+dates[opened-1]+' i '+dates[opened],['Cvijet se otvorio točno u podne.','Cvijet je bio otvoren već pri prvom opažanju.','Svaki je pup u vrtu procvjetao istoga dana.'],rng,visual);
  }
  function summer(level,n,rng){
    const temps=[18+n%5,29+n%4,23+n%3],times=['8:00','13:00','18:00'];
    if(n%2)[temps[0],temps[2]]=[temps[2],temps[0]];
    const visual=table('Mjerenje temperature u hladu',['Ura','Temperatura'],times.map((t,i)=>[t,temps[i]+' °C']));
    if(level==='easy')return choice('Kolika je temperatura izmjerena u 13 sati?',temps[1]+' °C',temps.filter((_,i)=>i!==1).map(t=>t+' °C'),rng,visual);
    if(level==='medium')return choice('Želiš prošetati s odraslom osobom kada je najsvježije. Koji termin biraš prema mjerenjima?',times[temps.indexOf(Math.min(...temps))],times,rng,visual);
    const diff=Math.max(...temps)-Math.min(...temps);
    return choice('Za koliko je stupnjeva najtoplije mjerenje više od najhladnijeg?',diff+' °C',[diff-1,diff+1,diff+2].map(t=>t+' °C'),rng,visual);
  }
  function energy(level,n,rng){
    const devices=['stropna svjetiljka','stolna svjetiljka','računalo','projektor'],on=n%4,second=(on+1+Math.floor(n/4))%4;
    const after=level==='easy'?[]:[second];
    const visual=table('Prazna učionica nakon nastave',['Uređaj','Prvi prizor','Drugi prizor'],devices.map((d,i)=>[d,i===on||after.includes(i)?'radi':'ugašeno',after.includes(i)?'radi':'ugašeno']));
    if(level==='easy')return choice('Koji uređaj radi u prvom prizoru?',devices[on],devices,rng,visual);
    if(level==='medium')return choice('Usporedi dva prizora. Koji je uređaj u međuvremenu netko ugasio?',devices[on],devices,rng,visual);
    return choice('U drugom prizoru nastava je gotova i učionica je prazna. Koji se uređaj još može ugasiti?',devices[second],devices,rng,visual);
  }
  const hygiene=[
    ['uzimam užinu','prije jela'],['sjedam za ručak','prije jela'],['uzimam komad voća za užinu','prije jela'],['idem doručkovati','prije jela'],
    ['vraćam se iz zahoda','nakon aktivnosti'],['završavam rad sa zemljom','nakon aktivnosti'],['upravo sam obrisala nos','nakon aktivnosti'],['upravo sam iznijela otpad','nakon aktivnosti']
  ];
  function cleanHands(level,n,rng){
    const count=level==='easy'?2:level==='medium'?3:4,zones=['prije jela','nakon aktivnosti'];
    const answer=Object.fromEntries(zones.map((zone,i)=>[zone,Array.from({length:count},(_,j)=>hygiene[i*4+(n+j+i*Math.floor(n/4))%4][0])]));
    return {type:'sort',prompt:'Kada pereš ruke? Razvrstaj kartice prema tome što prikazuju.',items:E.shuffle(Object.values(answer).flat(),rng),zones,answer};
  }
  const floating=[['pluteni čep','list','komadić stiropora','suha grančica'],['kamenčić','kovanica','čelična žličica','staklena pikula']];
  function experiment(level,n,rng){
    const a=floating[0][n%4],b=floating[1][(n+Math.floor(n/4))%4],guess=n%2===0?'na površini':'na dnu';
    const rows=E.shuffle([[a,guess,'na površini'],[b,guess,'na dnu']],rng);
    const visual=table('Pokus s posudom vode',['Predmet','Predviđam','Opažam'],rows);
    visual.water=rows.map(([name,,position])=>({name,surface:position==='na površini'}));
    if(level==='easy')return choice('Koji je predmet u ovom pokusu ostao na površini vode?',a,[b,'oba predmeta'],rng,visual);
    if(level==='medium')return choice('Za koji se predmet predviđanje poklapa s opažanjem?',guess==='na površini'?a:b,[a,b,'za oba predmeta'],rng,visual);
    return choice('Za koji je predmet rezultat pokusa bio drukčiji od predviđanja?',guess==='na površini'?b:a,[a,b,'za oba predmeta'],rng,visual);
  }
  const needs=[['posuditi knjigu','knjižnica'],['poslati paket','pošta'],['razgledati zbirku starih predmeta','muzej'],['doći na pregled kod liječnika','dom zdravlja'],['pogledati predstavu s glumcima na pozornici','kazalište'],['pogledati film na velikom platnu','kino']];
  function places(level,n,rng){
    const size={easy:2,medium:3,hard:4}[level],pairs=Array.from({length:size},(_,i)=>needs[(n%6+(n<6?i:-i)+6)%6]);
    return {type:'match',prompt:'Kamo bi išla? Spoji svaku potrebu s ustanovom koja je može ispuniti.',left:E.shuffle(pairs.map(p=>p[0]),rng),right:E.shuffle(pairs.map(p=>p[1]),rng),answer:pairs};
  }
  const classScenes=[
    ['uzeti riječ','dogovore se tko će prva govoriti pa zamijene uloge'],['koristiti isto povećalo','svaka promatra jedan list pa predaje povećalo drugoj'],['odabrati pjesmu','poslušaju oba prijedloga i dogovore redoslijed pjesama'],['nacrtati naslov','podijele crtanje i bojanje naslova'],
    ['koristiti istu knjigu','sjednu zajedno i naizmjence okreću stranice'],['voditi igru','dogovore se da svaka vodi jedan krug'],['predstaviti plakat','svaka predstavi dio koji je pripremila'],['zaliti razrednu biljku','dogovore različite dane za zalijevanje']
  ];
  function agreement(level,n,rng){
    const [wish,best]=classScenes[n],a=girls[n],b=girls[n+1];
    const visual=table('Prijedlozi učenica',['Tko','Želja'],[[a,wish],[b,wish]]);
    if(level==='easy')return choice('Obje učenice žele '+wish+'. Kako mogu surađivati?',best,['odlučuje ona koja je glasnija','jedna sve napravi sama'],rng,visual);
    if(level==='medium')return choice('Koji dogovor daje priliku objema učenicama?',best,['svaki put prednost ima ista učenica','prijedlog druge učenice ostaje neizrečen','obje odustanu od dogovora'],rng,visual);
    if(n%2)return choice('Obje žele '+wish+'. Učiteljica traži dogovor u kojem svaka sudjeluje. Koji prijedlog to omogućuje?',best,['obje govore u isto vrijeme i ne slušaju se','o svemu odluči jedna učenica','svaki put izaberu samo bržu učenicu'],rng,visual);
    return choice('Učenice predlažu da '+best+'. Kako mogu provjeriti je li njihov dogovor uspio?','Obje opišu kako su sudjelovale.',['Samo prva kaže što je radila.','Prebroje stvari na stolu.','Odluku prepuste najglasnijoj učenici.'],rng,visual);
  }
  const generators={dogovor:agreement,stablo:family,lisce:autumn,tragovi:winter,pupoljci:spring,vrijeme:summer,sat:clock,kalendar:calendar,skica:route,uredaji:energy,ruke:cleanHands,pokus:experiment,ustanove:places};
  function make(lesson,level,n,rng){
    return {...generators[lesson.id](level,n,rng),title:lesson.name,world:lesson.world,level,lesson:lesson.id,id:lesson.world+'-'+level+'-'+lesson.id+'-'+n};
  }
  return {lessons,make,days};
});
