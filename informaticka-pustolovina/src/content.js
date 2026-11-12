(function(root,factory){
  const engine=typeof module==='object'&&module.exports?require('./engine.js'):root.InfoEngine;
  const api=factory(engine);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.InfoContent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';

  const levels=[
    {id:'easy',name:'Lagani zadaci',desc:'Prepoznaj jednu važnu stvar.',icon:'🌱'},
    {id:'medium',name:'Teži zadaci',desc:'Poveži nekoliko informacija.',icon:'🧩'},
    {id:'hard',name:'Teški zadaci',desc:'Pronađi najbolji postupak.',icon:'🚀'}
  ];
  const worlds=[
    {id:'computer',name:'Moje računalo',desc:'Dijelovi, uređaji i zdrave navike',icon:'🖥️'},
    {id:'programs',name:'Programi i dokumenti',desc:'Programi, mape, datoteke i spremanje',icon:'📁'},
    {id:'internet',name:'Internet i pretraživanje',desc:'Preglednik, tražilica i obrazovni sadržaji',icon:'🌐'},
    {id:'safety',name:'Sigurna mreža',desc:'Osobni podatci i traženje pomoći',icon:'🛡️'},
    {id:'traces',name:'Digitalni tragovi',desc:'Objave, dopuštenje i digitalni ugled',icon:'👣'},
    {id:'algorithm',name:'Mislim kao programer',desc:'Koraci, pogreške i ponavljanje',icon:'🧠'},
    {id:'scratch',name:'Scratch radionica',desc:'Lik, pozornica i blokovi naredbi',icon:'🐱'},
    {id:'create',name:'Stvaram i surađujem',desc:'Digitalni radovi, e-usluge i zanimanja',icon:'🎨'}
  ];

  const S=(title,prompt,correct,wrong)=>({type:'single',title,prompt,correct,wrong});
  const M=(title,prompt,pairs)=>({type:'match',title,prompt,pairs});
  const Z=(title,prompt,zones)=>({type:'sort',title,prompt,zones});
  const O=(title,prompt,steps)=>({type:'order',title,prompt,steps});
  const D=(title,prompt,correct,wrong)=>({type:'debug',title,prompt,correct,wrong});
  const X=(title,prompt,correct,wrong)=>({type:'sim',title,prompt,correct,wrong});

  const banks={
    computer:[
      S('Pišem na računalu','Koji uređaj najčešće koristimo za unos slova?','tipkovnica',['zaslon','zvučnici','pisač']),
      M('Uređaj i njegova zadaća','Spoji svaki uređaj s onime što radi.',[['miš','odabire'],['zaslon','prikazuje'],['mikrofon','snima zvuk'],['pisač','ispisuje'],['zvučnici','reproduciraju zvuk']]),
      Z('Ulaz ili izlaz','Razvrstaj uređaje prema smjeru podataka.',{ulaz:['tipkovnica','miš','mikrofon','kamera'],izlaz:['zaslon','pisač','zvučnici','projektor']}),
      O('Priprema za rad','Složi zdrave korake prije rada na računalu.',['namjesti stolicu','sjedni uspravno','odmakni se od zaslona','pripremi kratku pauzu','započni rad']),
      D('Pazi na opremu','Koji je korak pogrešan?','prskam sredstvo izravno po tipkovnici',['ugasim uređaj prije čišćenja','zamolim odraslu osobu za pomoć','koristim mekanu suhu krpu']),
      X('Želim čuti priču','Koji uređaj treba odabrati?','zvučnici',['mikrofon','tipkovnica','kamera']),
      S('Snimamo glas','Koji uređaj prima naš glas?','mikrofon',['pisač','zaslon','zvučnici']),
      M('Pronađi par','Poveži dio računala i radnju.',[['kamera','snima sliku'],['tipkovnica','unosi tekst'],['projektor','prikazuje velikoj skupini'],['miš','pomiče pokazivač'],['pisač','stvara ispis na papiru']]),
      Z('Primamo ili šaljemo','Razvrstaj prema tome prima li računalo podatke ili ih prikazuje.',{prima:['miš','kamera','tipkovnica','mikrofon'],prikazuje:['zaslon','projektor','zvučnici','pisač']}),
      O('Završavam rad','Složi siguran završetak rada.',['spremi dokument','zatvori program','odaberi isključivanje','pričekaj da se računalo ugasi','pospremi radno mjesto']),
      D('Vrijeme je za pauzu','Koja navika nije dobra?','ostajem za zaslonom bez prekida',['trepćem i odmaram oči','protegnem ruke i leđa','nakon rada se krećem']),
      X('Želim ispis','Koji uređaj šalje rad na papir?','pisač',['zaslon','mikrofon','miš'])
    ],
    programs:[
      S('Što radi program?','Zašto na računalu koristimo programe?','pomažu nam obaviti različite zadatke',['služe samo za ukras','zamjenjuju sve uređaje','rade bez naših naredbi']),
      M('Program za zadatak','Spoji zadatak s prikladnom vrstom programa.',[['pisanje priče','program za tekst'],['crtanje slike','program za crtanje'],['računanje','kalkulator'],['gledanje mrežnih stranica','preglednik'],['slušanje snimke','program za zvuk']]),
      Z('Mapa ili datoteka','Razvrstaj primjere.',{mapa:['Moji radovi','Fotografije','Škola','Glazba'],datoteka:['priča.txt','crtež.png','zadatak.pdf','pjesma.mp3']}),
      O('Spremam priču','Složi korake spremanja dokumenta.',['odaberi Spremi','odaberi mapu','upiši naziv datoteke','potvrdi spremanje','provjeri nalazi li se datoteka u mapi']),
      D('Naziv datoteke','Koji je korak loš?','ostavim naziv Nova datoteka za sve radove',['upišem kratak jasan naziv','odaberem odgovarajuću mapu','provjerim naziv prije spremanja']),
      X('Spremam crtež','U koju ga mapu ima najviše smisla spremiti?','Moji crteži',['Glazba','Videozapisi','Preuzimanja bez reda']),
      S('Uređujem rečenice','Koju vrstu programa biram?','program za tekst',['kalkulator','program za zvuk','mrežna kamera']),
      M('Dokument i sadržaj','Spoji datoteku s onime što najvjerojatnije sadrži.',[['priča','tekst'],['portret','sliku'],['pjesma','zvuk'],['pokus','video'],['tablica bodova','brojeve']]),
      Z('Program ili dokument','Razvrstaj pojmove.',{program:['preglednik','kalkulator','program za crtanje','program za tekst'],dokument:['priča','fotografija','tablica','snimka']}),
      O('Otvaram spremljeni rad','Složi korake.',['otvori mapu','pronađi naziv datoteke','odaberi datoteku','otvori datoteku','provjeri je li to pravi rad']),
      D('Tražim svoj rad','Što otežava pronalazak?','sve datoteke spremam bez naziva u istu mapu',['koristim jasne nazive','odvajam radove u mape','povremeno pospremim datoteke']),
      X('Crtam plakat','Koju vrstu programa biram?','program za crtanje',['kalkulator','program za zvuk','upravitelj datoteka'])
    ],
    internet:[
      S('Prozor prema mreži','Čime otvaramo mrežne stranice?','mrežnim preglednikom',['kalkulatorom','pisačem','mapom']),
      M('Naredbe preglednika','Spoji naredbu i učinak.',[['Natrag','prethodna stranica'],['Naprijed','sljedeća već posjećena stranica'],['Osvježi','ponovno učita stranicu'],['Početna','otvara početnu stranicu'],['Nova kartica','otvara dodatnu stranicu']]),
      Z('Preglednik ili tražilica','Razvrstaj pojmove prema njihovoj ulozi.',{preglednik:['otvara mrežne stranice','prikazuje kartice','ima gumb Natrag','pamti posjećene stranice'],tražilica:['pronalazi sadržaje po riječima','prikazuje rezultate pretraživanja','koristi ključne riječi','pomaže pronaći mrežnu stranicu']}),
      O('Tražim podatak','Složi korake odgovornog pretraživanja.',['otvori preglednik','otvori tražilicu','upiši jasne ključne riječi','odaberi primjeren rezultat','provjeri podatak s odraslom osobom ili drugim izvorom']),
      D('Ključne riječi','Koji je način pretraživanja najslabiji?','upišem samo riječ stvar',['upišem što točno tražim','koristim dvije ili tri važne riječi','pregledam više primjerenih rezultata']),
      X('Vraćam se','Koju naredbu preglednika odabirem za prethodnu stranicu?','Natrag',['Osvježi','Nova kartica','Ispis']),
      S('Što je poveznica?','Što se dogodi kada odaberemo poveznicu?','otvara drugi sadržaj ili mjesto',['gasi računalo','briše tipkovnicu','sprema sve datoteke']),
      M('Mrežna usluga i namjena','Spoji primjer i namjenu.',[['mrežna učionica','učenje'],['videopoziv','razgovor na daljinu'],['mrežna karta','pronalaženje puta'],['prognoza vremena','provjera vremena'],['digitalna knjižnica','čitanje sadržaja']]),
      Z('Može ili ne može internet','Razvrstaj radnje.',{može:['pronaći obrazovni video','otvoriti mrežnu kartu','razgovarati na daljinu','čitati digitalnu knjigu'],ne_može:['sam provjeriti je li sve istina','zamijeniti odmor','popraviti pokvaren zaslon','čuvati tajnu lozinku umjesto nas']}),
      O('Otvaram obrazovni portal','Složi korake.',['otvori preglednik','upiši poznatu adresu ili naziv portala','provjeri naziv stranice','odaberi školski sadržaj','zatvori stranicu nakon rada']),
      D('Provjeravam izvor','Koja je pogreška?','vjerujem prvom rezultatu bez čitanja',['provjerim tko je objavio sadržaj','usporedim dva izvora','pitam učitelja ili odraslu osobu']),
      X('Stranica se nije obnovila','Koju naredbu pokušavam?','Osvježi',['Natrag','Ispis','Povećaj glasnoću'])
    ],
    safety:[
      S('Neobična poruka','Što učiniti kada nepoznata osoba traži tvoju fotografiju?','ne odgovoriti i pokazati odrasloj osobi',['poslati fotografiju','nastaviti razgovor u tajnosti','dati adresu škole']),
      M('Situacija i reakcija','Spoji situaciju s najboljom reakcijom.',[['nepoznata poveznica','ne otvaram i pitam odraslu osobu'],['ružna poruka','spremim dokaz i tražim pomoć'],['traži se lozinka','ne dijelim je'],['čudan sadržaj','zatvorim i kažem odrasloj osobi'],['poznata učiteljica šalje zadatak','provjerim u sigurnoj učionici']]),
      Z('Sigurno ili nesigurno','Razvrstaj ponašanja.',{sigurno:['pitam odraslu osobu','koristim nadimak po dogovoru','zaključam uređaj','odjavim se nakon rada'],nesigurno:['dijelim lozinku','otvaram nepoznat privitak','objavim kućnu adresu','tajim ružnu poruku']}),
      O('Sumnjiva poruka','Složi korake.',['ne odgovaraj','ne otvaraj poveznicu','pokaži poruku odrasloj osobi','blokiraj po dogovoru','sačuvaj dokaz ako odrasla osoba kaže']),
      D('Čuvam lozinku','Koji je postupak pogrešan?','pošaljem lozinku prijatelju',['koristim lozinku koju nije lako pogoditi','odjavim se na tuđem uređaju','zamolim odraslu osobu za pomoć']),
      X('Iskočio je čudan prozor','Što odabrati?','zatvori i reci odrasloj osobi',['upiši svoje ime','pritisni svaku tipku','pošalji prijatelju']),
      S('Dobra lozinka','Koja je lozinka sigurnija?','riječi i znakovi koje drugi ne mogu lako pogoditi',['moje ime','1234','datum rođenja']),
      M('Podatak i zaštita','Spoji podatak s pravilnim postupkom.',[['lozinka','čuvam za sebe'],['fotografija prijatelja','tražim dopuštenje'],['adresa doma','ne objavljujem'],['školski rad','dijelim samo na dogovorenome mjestu'],['nadimak','dogovorim s odraslom osobom']]),
      Z('Osobno ili javno','Razvrstaj podatke.',{osobno:['puno ime','kućna adresa','lozinka','broj telefona'],javno:['omiljena boja','najdraže godišnje doba','omiljena životinja','hobi bez mjesta i rasporeda']}),
      O('Netko je ružan na mreži','Složi korake.',['ne uzvraćaj ružno','sačuvaj poruku','reci odrasloj osobi','blokiraj po dogovoru','nastavi koristiti samo sigurno mjesto']),
      D('Novi mrežni prijatelj','Koji je korak pogrešan?','dogovorim susret bez znanja odraslih',['ne otkrivam osobne podatke','razgovor pokažem odrasloj osobi','ne vjerujem svemu što osoba kaže']),
      X('Aplikacija traži kameru','Što učiniti prije dopuštenja?','pitati odraslu osobu',['odmah dopustiti','upisati adresu','ugasiti zaštitu uređaja'])
    ],
    traces:[
      S('Trag nakon objave','Što je digitalni trag?','podatak koji ostaje nakon aktivnosti na mreži',['otisak cipele na podu','tipka na tipkovnici','boja zaslona']),
      M('Radnja i trag','Spoji aktivnost s tragom koji može ostati.',[['objavim komentar','tekst uz moje ime ili nadimak'],['pošaljem fotografiju','kopija fotografije'],['označim sviđa mi se','zapis odabira'],['pretražujem','povijest pretraživanja'],['otvorim račun','podatci računa']]),
      Z('Dobar ili loš trag','Razvrstaj primjere.',{dobar:['ljubazan komentar','pohvala tuđem radu','vlastiti kreativni rad','zahvala za pomoć'],loš:['vrijeđanje','objava tuđe slike bez pitanja','širenje glasine','otkrivanje tuđe tajne']}),
      O('Prije objave fotografije','Složi korake.',['zaustavi se i pogledaj fotografiju','provjeri ima li osobnih podataka','pitaj osobe na fotografiji','pitaj odraslu osobu','objavi samo na dogovorenom sigurnom mjestu']),
      D('Objava prijateljeve slike','Koja je pogreška?','objavim bez pitanja jer mi je slika smiješna',['pitam prijatelja','pitam odraslu osobu','provjerim vidi li se osobni podatak']),
      X('Komentar ostaje zapisan','Koji komentar je najbolji izbor?','Sviđa mi se kako si nacrtala pozadinu.',['Ovo je glupo.','Reći ću svima tvoju tajnu.','Pošalji mi svoju lozinku.']),
      S('Digitalni ugled','Od čega nastaje digitalni ugled?','od tragova našeg ponašanja na mreži',['od veličine zaslona','od brzine tipkanja','od boje uređaja']),
      M('Promisli prije objave','Spoji pitanje s razlogom.',[['Je li istinito?','ne širimo netočne podatke'],['Je li ljubazno?','poštujemo druge'],['Je li osobno?','štitimo privatnost'],['Imam li dopuštenje?','poštujemo tuđi izbor'],['Treba li ostati tajno?','čuvamo povjerenje']]),
      Z('Ostavlja trag ili ne','Razvrstaj aktivnosti.',{ostavlja:['objava fotografije','komentar','otvaranje računa','slanje poruke'],ne_ostavlja_na_mreži:['crtanje na papiru bez fotografiranja','razgovor licem u lice','slaganje kockica','čitanje tiskane knjige']}),
      O('Ispravljam loš trag','Složi korake.',['zaustavi daljnje dijeljenje','reci odrasloj osobi','ukloni objavu ako možeš','ispričaj se osobi','ubuduće provjeri prije objave']),
      D('Brisanje nije čarolija','Koja tvrdnja je pogrešna?','kad izbrišem objavu, sigurno više nigdje ne postoji',['netko je mogao spremiti kopiju','objava je mogla biti proslijeđena','treba promisliti prije objave']),
      X('Želim podijeliti školski rad','Gdje je najprimjerenije?','u dogovorenoj mrežnoj učionici',['na nepoznatoj javnoj stranici','u poruci nepoznatoj osobi','na računu bez zaštite'])
    ],
    algorithm:[
      S('Korak po korak','Što je niz uputa?','uređen redoslijed koraka za zadatak',['popis bez reda','slučajan crtež','samo posljednji korak']),
      M('Zadatak i prvi korak','Spoji zadatak s dobrim početkom.',[['operi ruke','otvori vodu'],['nacrtaj kuću','pripremi papir i olovku'],['spremi knjige','otvori torbu'],['napravi sendvič','pripremi sastojke'],['pokreni program','uključi uređaj i prijavi se po dogovoru']]),
      Z('Uputa ili cilj','Razvrstaj rečenice.',{uputa:['otvori mapu','odaberi datoteku','upiši riječ','ponovi tri puta'],cilj:['napisana priča','spremljen crtež','složena torba','gotov uzorak']}),
      O('Perem ruke','Složi korake.',['otvori vodu','smoči ruke','uzmi sapun','isperi ruke','obriši ruke']),
      D('Sendvič nije gotov','Koji je korak na pogrešnome mjestu?','pojedem sendvič prije nego dodam nadjev',['pripremim kruh','dodam nadjev','zatvorim sendvič']),
      X('Lik ide do zvijezde','Koju naredbu odabrati ako je zvijezda desno?','pomakni se desno',['pomakni se lijevo','čekaj','vrati se na početak']),
      S('Ponavljanje','Zašto koristimo ponavljanje u uputama?','da kraće zapišemo radnju koja se ponavlja',['da izbrišemo cilj','da preskočimo sve korake','da promijenimo uređaj']),
      M('Uputa i broj ponavljanja','Spoji cilj s ponavljanjem.',[['tri pljeska','pljesni 3 puta'],['četiri koraka','idi naprijed 4 puta'],['dva kvadrata','nacrtaj kvadrat 2 puta'],['pet slova A','upiši A 5 puta'],['tri skoka','skoči 3 puta']]),
      Z('Jednom ili ponovi','Razvrstaj upute.',{jednom:['otvori vrata','spremi dokument','uključi svjetlo','zatvori program'],ponovi:['nacrtaj 4 zvijezde','napravi 3 koraka','pljesni 5 puta','upiši riječ 2 puta']}),
      O('Crtam kvadrat','Složi jedan puni krug uputa.',['idi ravno','okreni se desno','idi ravno','okreni se desno','nastavi isti uzorak još dva puta']),
      D('Robot je zalutao','Koja uputa kvari put ravno naprijed?','okreni se lijevo',['idi naprijed','idi naprijed još jednom','stani na cilju']),
      X('Tri jednaka koraka','Koja je najkraća uputa?','ponovi 3 puta: idi naprijed',['idi naprijed jednom','okreni se 3 puta','čekaj 3 puta'])
    ],
    scratch:[
      S('Lik na pozornici','Kako zovemo objekt koji izvodi naredbe?','lik',['mapa','pisač','lozinka']),
      M('Dio projekta i uloga','Spoji pojam s ulogom.',[['lik','izvodi naredbe'],['pozornica','mjesto radnje'],['blok','predstavlja naredbu'],['zastavica','pokreće projekt'],['pozadina','izgled pozornice']]),
      Z('Kretanje ili izgled','Razvrstaj blokove prema namjeni.',{kretanje:['idi naprijed','okreni se desno','klizi do mjesta','promijeni položaj'],izgled:['reci Pozdrav','promijeni kostim','povećaj lik','sakrij lik']}),
      O('Lik pozdravlja','Složi blokove.',['kada se projekt pokrene','idi naprijed','reci Pozdrav','čekaj jednu sekundu','okreni se']),
      D('Mačka ne govori','Koji blok ne pripada programu za pozdrav?','sakrij lik prije poruke',['pokreni program','reci Bok','čekaj kratko']),
      X('Lik gleda na krivu stranu','Koji blok pomaže?','okreni se desno',['promijeni pozadinu','pusti zvuk','sakrij se']),
      S('Pokretanje projekta','Što najčešće pokreće niz blokova?','odabrani događaj pokretanja',['naziv datoteke','mapa Slike','boja zaslona']),
      M('Blok i rezultat','Spoji blok s rezultatom.',[['idi 10 koraka','lik se pomakne'],['reci Bok','pojavi se poruka'],['čekaj','napravi stanku'],['ponovi','ponavlja blokove'],['promijeni pozadinu','mijenja izgled pozornice']]),
      Z('Događaj ili radnja','Razvrstaj blokove.',{događaj:['kada se pokrene','kada se pritisne tipka','kada lik primi poruku','kada se lik odabere'],radnja:['idi naprijed','reci Bok','pusti zvuk','promijeni kostim']}),
      O('Mali ples','Složi program.',['kada se projekt pokrene','okreni se desno','čekaj kratko','okreni se lijevo','ponovi ples 3 puta']),
      D('Redoslijed blokova','Koji blok je na lošem mjestu ako lik prvo treba doći pa pozdraviti?','reci Stigao sam prije kretanja',['pokreni program','idi do cilja','reci Stigao sam nakon kretanja']),
      X('Lik radi isto četiri puta','Koji blok skraćuje program?','ponovi 4 puta',['čekaj 4 sekunde','sakrij lik','promijeni pozadinu'])
    ],
    create:[
      S('Digitalni rad','Što možemo kombinirati u digitalnom radu?','tekst i slike',['samo jednu tipku','samo naziv mape','samo lozinku']),
      M('Uređaj ili program za zadatak','Spoji zadatak s prikladnim izborom.',[['upiši rečenicu','tipkovnica i program za tekst'],['snimi glas','mikrofon i program za zvuk'],['prikaži razredu','projektor i prezentacija'],['nacrtaj znak','program za crtanje'],['razgovaraj na daljinu','kamera i program za videosastanak']]),
      Z('Digitalni rad ili komunikacija','Razvrstaj aktivnosti.',{stvaranje:['pišem priču','crtam plakat','slažem prezentaciju','uređujem fotografiju'],komunikacija:['videosastanak','poruka učitelju u učionici','razgovor s razredom na mreži','dijeljenje rada u dogovorenoj grupi']}),
      O('Izrađujem plakat','Složi korake.',['odredi temu','napiši kratak naslov','dodaj vlastitu ili dopuštenu sliku','provjeri čitljivost','spremi u odgovarajuću mapu']),
      D('Prezentacija za razred','Koji je postupak loš?','stavim vrlo sitan tekst preko cijelog slajda',['koristim kratak naslov','odaberem čitljive boje','provjerim rad prije prikazivanja']),
      X('Videosastanak počinje','Što prvo provjeriti?','jesu li kamera i mikrofon uključeni samo kada trebaju',['je li lozinka javno objavljena','mogu li govoriti svi odjednom','mogu li poslati adresu doma']),
      S('Mrežna učionica','Čemu služi sigurna mrežna učionica?','učenju i razmjeni školskih radova',['razgovoru s nepoznatima','objavi osobnih podataka','isključivanju računala']),
      M('Zanimanje i tehnologija','Spoji zanimanje s primjerom uporabe tehnologije.',[['liječnik','pregledava zdravstvene podatke u sigurnom sustavu'],['arhitekt','izrađuje nacrt'],['učitelj','priprema digitalni zadatak'],['vozač','koristi kartu za put'],['dizajner','stvara vizualni rad']]),
      Z('Prije ili tijekom videosastanka','Razvrstaj ponašanja.',{primjereno:['čekam svoj red','utišam mikrofon kada ne govorim','koristim dogovoreno ime','pratim upute učitelja'],neprimjereno:['prekidam druge','dijelim poveznicu nepoznatima','snimam bez dopuštenja','pokazujem osobne podatke']}),
      O('Predajem školski rad','Složi korake.',['dovrši rad','spremi jasnim nazivom','otvori sigurnu mrežnu učionicu','odaberi dogovoreno mjesto za predaju','provjeri je li datoteka poslana']),
      D('Zajednički rad','Koja radnja ometa suradnju?','izbrišem tuđi dio bez pitanja',['dogovorim zadatke','slušam prijedlog druge osobe','pitam prije promjene tuđeg dijela']),
      X('Priča treba sliku','Koji je najbolji izbor?','dodati vlastiti crtež ili dopuštenu sliku',['uzeti bilo koju tuđu sliku bez pitanja','objaviti osobnu fotografiju prijatelja','upisati lozinku u dokument'])
    ]
  };

  const takeCount={easy:2,medium:3,hard:4};
  const orderCount={easy:3,medium:4,hard:5};
  const prefix={easy:'',medium:'Poveži više informacija. ',hard:'Promisli o cijeloj situaciji. '};

  function makeQuestion(world,level,def,index,rng){
    const base={id:`${world}-${level}-${index}`,world,level,type:def.type,title:def.title,prompt:prefix[level]+def.prompt};
    if(['single','debug','sim'].includes(def.type)){
      const wrong=E.shuffle(def.wrong,rng).slice(0,level==='easy'?2:3);
      return {...base,options:E.shuffle([def.correct,...wrong],rng),answer:def.correct};
    }
    if(def.type==='match'){
      const pairs=E.shuffle(def.pairs,rng).slice(0,takeCount[level]);
      return {...base,left:E.shuffle(pairs.map(p=>p[0]),rng),right:E.shuffle(pairs.map(p=>p[1]),rng),answer:pairs.map(p=>p.slice())};
    }
    if(def.type==='sort'){
      const answer={};
      for(const [name,items] of Object.entries(def.zones)) answer[name]=E.shuffle(items,rng).slice(0,takeCount[level]);
      return {...base,zones:Object.keys(answer),items:E.shuffle(Object.values(answer).flat(),rng),answer};
    }
    const answer=def.steps.slice(0,orderCount[level]);
    return {...base,items:E.shuffle(answer,rng),answer};
  }

  const templates={};
  for(const world of worlds){
    templates[world.id]={};
    for(const level of levels){
      templates[world.id][level.id]=banks[world.id].map((def,index)=>(rng)=>makeQuestion(world.id,level.id,def,index,rng));
    }
  }

  function templateCount(){
    return worlds.reduce((sum,world)=>sum+levels.reduce((n,level)=>n+templates[world.id][level.id].length,0),0);
  }

  function buildRound(level,world,seed){
    if(!levels.some(item=>item.id===level)) throw new Error('Nepoznata razina.');
    const rng=E.makeRng(seed);
    if(world==='mix'){
      return E.shuffle(worlds.map(item=>{
        const list=templates[item.id][level];
        return list[Math.floor(rng()*list.length)](rng);
      }),rng);
    }
    if(!templates[world]) throw new Error('Nepoznati svijet.');
    return E.shuffle(templates[world][level],rng).slice(0,5).map(factory=>factory(rng));
  }

  return {levels,worlds,templates,templateCount,buildRound};
});
