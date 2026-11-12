(function(root,factory){
  const engine=typeof module==='object'&&module.exports?require('./engine.js'):root.WorldEngine;
  const api=factory(engine);
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.WorldContent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';

  const levels=[
    {id:'easy',name:'Lagani zadaci',desc:'Prepoznaj i odaberi jednu važnu stvar.',icon:'🌱'},
    {id:'medium',name:'Teži zadaci',desc:'Poveži više tragova i odnosa.',icon:'🔎'},
    {id:'hard',name:'Teški zadaci',desc:'Zaključi iz cijele situacije.',icon:'🧭'}
  ];
  const worlds=[
    {id:'school',name:'Škola, prava i zajednica',desc:'Pravila, dužnosti, prava i suradnja',icon:'🏫'},
    {id:'home',name:'Obitelj i dom',desc:'Obitelj, stanovanje i odgovornosti',icon:'🏠'},
    {id:'autumn',name:'Jesen oko nas',desc:'Vrijeme, biljke, životinje i ljudi',icon:'🍂'},
    {id:'winter',name:'Zima oko nas',desc:'Promjene, prilagodbe i sigurnost',icon:'❄️'},
    {id:'spring',name:'Proljeće oko nas',desc:'Buđenje prirode i rast',icon:'🌷'},
    {id:'summer',name:'Ljeto oko nas',desc:'Sunce, priroda i odgovorno ponašanje',icon:'☀️'},
    {id:'spacetime',name:'Prostor, promet i vrijeme',desc:'Skice, promet, ura i vremenski odnosi',icon:'🗺️'},
    {id:'energy',name:'Energija u životu',desc:'Izvori, uređaji, oprez i štednja',icon:'⚡'},
    {id:'health',name:'Zdravlje i okoliš',desc:'Tijelo, prehrana, higijena i otpad',icon:'💚'},
    {id:'nature',name:'Istražujem prirodu',desc:'Živo, neživo, tvari, biljke i životinje',icon:'🔬'},
    {id:'place',name:'Mjesto, rad i baština',desc:'Krajolik, zanimanja, ustanove i blagdani',icon:'🏘️'}
  ];

  const S=(title,prompt,correct,wrong)=>({type:'single',title,prompt,correct,wrong});
  const M=(title,prompt,pairs)=>({type:'match',title,prompt,pairs});
  const Z=(title,prompt,zones)=>({type:'sort',title,prompt,zones});
  const O=(title,prompt,steps)=>({type:'order',title,prompt,steps});
  const C=(title,prompt,correct,wrong)=>({type:'cause',title,prompt,correct,wrong});
  const V=(title,prompt,correct,wrong)=>({type:'observe',title,prompt,correct,wrong});
  const T=(title,prompt,steps)=>({type:'timeline',title,prompt,steps});

  const banks={
    school:[
      S('Dogovor razreda','Što pomaže da svi mogu učiti?','poštujemo dogovorena pravila',['govorimo svi odjednom','skrivamo pribor drugima','prekidamo rad bez razloga']),
      M('Pravo i primjer','Spoji pravo s primjerom.',[['pravo na učenje','mogu postavljati pitanja'],['pravo na zaštitu','odrasli me štite od nasilja'],['pravo na igru','imam vrijeme za odmor'],['pravo na mišljenje','smijem pristojno reći što mislim']]),
      Z('Pravo ili dužnost','Razvrstaj primjere.',{pravo:['učiti','biti siguran','izraziti mišljenje'],dužnost:['čuvati školske stvari','poštovati druge','izvršiti dogovoreni zadatak']}),
      O('Mirno rješavamo problem','Složi Bitkov postupak.',['zaustavi se','saslušaj drugu osobu','mirno reci što te smeta','predložite pravedno rješenje','zatražite pomoć ako ne uspijete']),
      C('Posljedica kašnjenja','Zašto je korisno doći na nastavu na vrijeme?','ne propuštamo početak rada',['brže potrošimo pribor','učionica postaje veća','dan postaje kraći']),
      V('Suradnja u skupini','Koji prizor pokazuje dobru suradnju?','djeca dijele zadatke i slušaju se',['jedno dijete radi sve','svi se prepiru','nitko ne prati dogovor']),
      T('Razredni zadatak','Poredaj događaje od početka do završetka.',['dogovorimo cilj','podijelimo zadatke','svatko obavi svoj dio','spojimo dijelove','zajedno provjerimo rad']),
      S('Različiti i ravnopravni','Kako se odnosimo prema osobi koja nešto radi drukčije?','uvažavamo je i uključujemo',['ismijavamo je','ne dopuštamo joj sudjelovanje','odlučujemo bez nje']),
      M('Dužnost i mjesto','Spoji dužnost s mjestom.',[['pospremiti pribor','učionica'],['vratiti knjigu','knjižnica'],['hodati mirno','hodnik'],['čuvati biljke','školski vrt']]),
      Z('Odgovorno ili neodgovorno','Razvrstaj ponašanja.',{odgovorno:['priznam pogrešku','pomognem novom učeniku','slušam dogovor'],neodgovorno:['okrivim drugoga','vrijeđam','namjerno kršim pravilo']}),
      C('Zašto imamo pravila','Koji je glavni razlog razrednih pravila?','da zajednica bude sigurna i pravedna',['da samo jedna osoba odlučuje','da nema igre ni razgovora','da su svi potpuno jednaki u svemu']),
      V('Prepoznajem pravednost','Koja je odluka pravedna?','svatko dobije priliku govoriti',['govori samo najglasniji','uvijek bira ista osoba','ne slušamo tuđe ideje'])
    ],
    home:[
      S('Tko je rodbina?','Tko može pripadati široj obitelji?','baka',['susjedov pas','prometni policajac','prodavaonica']),
      M('Član i odnos','Spoji osobu i rodbinski odnos.',[['majčina majka','baka'],['očev brat','stric'],['sestrin sin','nećak'],['roditelji moje majke','djed i baka']]),
      Z('Dom ili škola','Razvrstaj što najčešće pripada kojem prostoru.',{dom:['kuhinja','spavaća soba','dnevni boravak'],škola:['učionica','zbornica','školska knjižnica']}),
      O('Brinem o svojoj sobi','Predmeti su ostali na podu i najprije treba osloboditi prolaz. Složi postupak.',['makni stvari s prolaza','razvrstaj ih na igračke, knjige i otpad','vrati igračke i knjige na njihova mjesta','odvoji otpad u odgovarajuće spremnike','provjeri je li prolaz siguran']),
      C('Zajedničke dužnosti','Zašto svi članovi doma trebaju pomagati?','poslovi se pravednije dijele',['kuća dobiva više katova','vrijeme prestaje prolaziti','nitko ne treba odmarati']),
      V('Kuća ili zgrada','Što najjasnije pokazuje stambenu zgradu?','više stanova i zajednički ulaz',['jedna obitelj i vrt','šator u kampu','učionica s pločom']),
      T('Od jutra do škole','Poredaj događaje.',['probudim se','obavim higijenu','doručkujem','pripremim torbu','krenem u školu']),
      S('Odgovornost u domu','Što dijete može učiniti samostalno?','pospremiti svoj pribor',['popravljati električne vodove','paliti vatru bez odraslih','koristiti opasan alat']),
      M('Prostorija i namjena','Spoji prostoriju s uobičajenom namjenom.',[['kuhinja','priprema hrane'],['kupaonica','osobna higijena'],['spavaća soba','odmor'],['dnevni boravak','zajedničko vrijeme']]),
      Z('Moje ili zajedničko','Razvrstaj primjere.',{osobno:['moja četkica za zube','moja bilježnica','moja pidžama'],zajedničko:['stol za objedovanje','hodnik zgrade','obiteljski hladnjak']}),
      C('Čuvamo zajednički prostor','Zašto hodnik zgrade treba ostati prohodan?','da se svi mogu sigurno kretati',['da bude tamniji','da se vrata ne vide','da nitko ne razgovara']),
      V('Sličnost doma i škole','Što je zajedničko domu i školi?','u njima postoje pravila i dužnosti',['u oba prostora spavamo','u oba prostora kuhamo ručak','u oba prostora živi samo jedna obitelj'])
    ],
    autumn:[
      S('Jesenji znak','Koja je promjena česta ujesen?','lišće mijenja boju',['dan postaje najdulji','sve biljke cvatu','sunce nikada ne zalazi']),
      M('Plod i biljka','Spoji plod s biljkom.',[['žir','hrast'],['kesten','kesten'],['orah','orah'],['jabuka','jabuka']]),
      Z('Jesen ili nije jesen','Razvrstaj pojave.',{jesen:['opadanje lišća','berba grožđa','češća magla'],nije_jesen:['cvjetanje visibaba','najveće ljetne vrućine','dugotrajan snijeg']}),
      O('Pratim stablo ujesen','Želiš usporediti istu granu u razmaku od tjedan dana. Složi istraživanje.',['označi jednu granu stabla','fotografiraj označenu granu','pričekaj jedan tjedan','ponovno fotografiraj istu granu','usporedi dvije fotografije']),
      C('Kraći dani','Zašto ujesen ranije palimo svjetlo?','dan postaje kraći',['lišće postaje teže','vjetar zaustavlja sat','oblaci gase žarulje']),
      V('Jesenje vrijeme','Koji zapis najbolje opisuje tipičan jesenski dan?','svježije je i može biti maglovito',['vrlo je vruće cijelu noć','stalno pada snijeg','svaki dan je bez oblaka']),
      T('Od zelena lista do tla','Poredaj promjene lista.',['list je zelen','vrijeme postaje hladnije','list mijenja boju','list se odvaja od grane','list pada na tlo']),
      S('Životinje ujesen','Što neke životinje rade prije zime?','skupljaju hranu',['grade prometnice','sade pšenicu strojevima','sele se u kuće ljudi']),
      M('Rad ljudi i razlog','Spoji rad s razlogom.',[['berba voća','plodovi su zreli'],['spremanje drva','priprema za hladnoću'],['sjetva ozimih žitarica','rast počinje prije zime'],['čišćenje lišća','staze ostaju prohodne']]),
      Z('Biljke ili ljudi','Razvrstaj jesenske aktivnosti.',{biljke:['mijenjaju boju lišća','rasipaju sjeme','usporavaju rast'],ljudi:['beru plodove','pripremaju topliju odjeću','spremaju zimnicu']}),
      C('Ptice selice','Zašto neke ptice odlaze u toplije krajeve?','teže pronalaze hranu kada zahladi',['ne vole boju lišća','žele vidjeti više kuća','sunce ih poziva imenom']),
      V('Kalendar prirode','Koji podatak pripada jesenskom opažanju?','datum, vrijeme i promjena na stablu',['samo ime promatrača','samo boja olovke','broj stranica u knjizi'])
    ],
    winter:[
      S('Zimska prilika','Koja je oborina moguća zimi?','snijeg',['pelud','lišće','pijesak']),
      M('Životinja i prilagodba','Spoji životinju s ponašanjem.',[['medvjed','miruje u brlogu'],['vjeverica','koristi spremljenu hranu'],['ptica stanarica','traži hranu u okolini'],['zec','ima gušće krzno']]),
      Z('Sigurno ili nesigurno zimi','Razvrstaj ponašanja.',{sigurno:['nosim slojevitu odjeću','hodam oprezno po ledu','sušim mokre rukavice'],nesigurno:['trčim po zaleđenim stubama','izlazim mokre kose na hladnoću','diram ledenicu iznad prolaza']}),
      O('Siguran zimski put','Nakon snijega izlaziš s odraslom osobom. Složi događaje.',['odrasla osoba provjeri je li put siguran','odjeni toplu odjeću','obuj obuću koja ne kliže','izađi s odraslom osobom','hodaj očišćenim dijelom puta']),
      C('Gola stabla','Zašto mnoga listopadna stabla zimi nemaju lišće?','prilagodila su se hladnoći i manjku svjetla',['lišće se skriva u deblu','snijeg ga pretvara u kamen','grane ga pojedu']),
      V('Duljina dana','Koje opažanje odgovara zimi?','dan je kraći od noći',['dan je uvijek jednak noći','sunce ne izlazi cijelu zimu','dan je najdulji u godini']),
      T('Snježni dan','Poredaj događaje.',['temperatura se spusti','oblaci donesu oborinu','pada snijeg','snijeg prekrije tlo','zatopljenje ga počne topiti']),
      S('Biljke zimi','Što se događa s rastom mnogih biljaka?','rast se usporava',['rast se uvijek ubrzava','sve odmah cvjetaju','korijen nestaje']),
      M('Zimski posao i svrha','Spoji radnju i svrhu.',[['čistiti snijeg','osloboditi prolaz'],['posipati led','smanjiti klizanje'],['hraniti ptice primjereno','pomoći kada je hrana oskudna'],['zatvoriti prozor','čuvati toplinu']]),
      Z('Voda ili led','Razvrstaj svojstva.',{voda:['teče','poprima oblik posude','može se proliti'],led:['čvrst je','zadržava oblik','može se otopiti']}),
      C('Topljenje snijega','Zašto se snijeg topi kada zatopli?','prima toplinu iz okoline',['postaje umoran','vjetar ga boji','tlo ga gura']),
      V('Tragovi u snijegu','Što možemo zaključiti iz niza životinjskih tragova?','životinja se kretala tim putem',['koliko je stara svaka grana','koje je boje nebo sutra','koliko ima vode u moru'])
    ],
    spring:[
      S('Proljetna promjena','Što se često događa u proljeće?','pojavljuju se novi listovi',['rijeke se uvijek zalede','dan postaje sve kraći','svi plodovi odmah dozriju']),
      M('Biljka i proljetni znak','Spoji biljku i opažanje.',[['visibaba','rani cvijet'],['voćka','pupovi i cvjetovi'],['trava','novi zeleni izdanci'],['maslačak','žuti cvijet']]),
      Z('Proljeće ili drugo doba','Razvrstaj pojave.',{proljeće:['povratak nekih ptica','češći rast biljaka','promjenjivo vrijeme'],drugo_doba:['berba grožđa','dugotrajan mraz i snijeg','najveće ljetne vrućine']}),
      O('Sadim sjeme','Složi postupak.',['pripremi posudu i zemlju','stavi sjeme u zemlju','lagano prekrij sjeme','zalij umjereno','postavi na primjereno svijetlo mjesto']),
      C('Biljke brže rastu','Zašto mnoge biljke u proljeće brže rastu?','ima više topline i svjetla',['mjeseci imaju više slova','vjetar ih vuče prema gore','ptice ih oboje']),
      V('Pupoljak na grani','Što pupoljak može postati?','list ili cvijet',['kamen','prometni znak','kap kiše']),
      T('Od pupoljka do ploda','Poredaj promjene.',['na grani je pupoljak','otvara se cvijet','cvijet se mijenja','nastaje mali plod','plod raste i dozrijeva']),
      S('Životinje u proljeće','Koja je pojava česta?','mnoge životinje dobivaju mlade',['sve životinje spavaju','ptice prestaju graditi gnijezda','kukci potpuno nestaju']),
      M('Proljetni rad i rezultat','Spoji rad s rezultatom.',[['sjetva','nove biljke'],['orezivanje','uredniji rast'],['zalijevanje','voda za biljku'],['promatranje gnijezda izdaleka','ne uznemiravamo ptice']]),
      Z('Pomaže rastu ili ne','Razvrstaj uvjete.',{pomaže:['voda','svjetlost','primjerena toplina'],ne_pomaže:['gaženje mladice','potpuni nedostatak vode','čupanje korijena']}),
      C('Povratak ptica','Zašto se neke ptice vraćaju u proljeće?','ponovno ima više hrane i topline',['žele vidjeti snjegovića','dan postaje kraći','sva stabla su bez lišća']),
      V('Proljetna prognoza','Koja odjeća odgovara promjenjivom proljetnom danu?','slojevita odjeća i lagana kabanica',['samo kupaći kostim','teške skijaške čizme cijeli dan','bez ikakve zaštite od kiše'])
    ],
    summer:[
      S('Ljetna prilika','Što je često ljeti?','visoke temperature',['najkraći dani','dugotrajan snijeg','zamrznuto tlo']),
      M('Zaštita i svrha','Spoji predmet sa svrhom.',[['šešir','štiti glavu od sunca'],['voda','nadoknađuje tekućinu'],['krema za sunce','štiti kožu'],['hlad','pomaže izbjeći jako sunce']]),
      Z('Odgovorno ili neodgovorno ljeti','Razvrstaj ponašanja.',{odgovorno:['pijem vodu','izbjegavam podnevno sunce','nosim laganu zaštitnu odjeću'],neodgovorno:['dugo sam na suncu bez zaštite','ostavljam otpad u prirodi','ulazim u vodu bez nadzora']}),
      O('Sigurno kupanje','Na kupalište dolaziš s odraslom osobom. Složi događaje.',['dođi do kupališta s odraslom osobom','pročitajte oznake i upozorenja','odrasla osoba provjeri mjesto za kupanje','pričekaj dopuštenje odrasle osobe','uđi u vodu uz nadzor']),
      C('Biljke venu','Zašto biljka može venuti tijekom vrućine?','gubi vodu brže nego što je prima',['sunce joj promijeni ime','korijen postaje zrak','lišće zaboravi rasti']),
      V('Najdulji dani','Koje opažanje odgovara početku ljeta?','dan je vrlo dug',['noć traje cijeli dan','dan je najkraći u godini','sunce izlazi samo jednom tjedno']),
      T('Od cvijeta do ljetnog ploda','Poredaj promjene.',['biljka cvjeta','cvijet se opraši','nastane mali plod','plod raste','zreo plod se bere']),
      S('Životinje na vrućini','Što mnoge životinje traže za velikih vrućina?','vodu i hlad',['zaleđeno jezero','toplu peć','debelu zimsku odjeću']),
      M('Ljetni rad i razlog','Spoji radnju i razlog.',[['zalijevanje rano ujutro','manje vode ispari'],['žetva','žitarice su zrele'],['skupljanje otpada','čuvamo okoliš'],['provjera vode za kupanje','brinemo o sigurnosti']]),
      Z('Na kopnu ili u vodi','Razvrstaj životinje prema staništu.',{kopno:['gušter','mrav','jež'],voda:['riba','školjka','hobotnica']}),
      C('Rano zalijevanje','Zašto biljke zalijevamo rano ujutro ili navečer?','tada manje vode brzo ispari',['tada korijen spava','sunce ne vidi biljku','voda postane slađa']),
      V('Znak pregrijavanja','Koji znak znači da treba odmah u hlad i reći odrasloj osobi?','vrtoglavica i jaka slabost',['čiste tenisice','uredno vezane vezice','hladna boca u torbi'])
    ],
    spacetime:[
      S('Položaj predmeta','Ako je lopta ispod stola, gdje je stol u odnosu na loptu?','iznad lopte',['iza lopte','unutar lopte','lijevo od svake stvari']),
      M('Promet i primjer','Spoji vrstu prometa i sredstvo.',[['cestovni','autobus'],['željeznički','vlak'],['zračni','zrakoplov'],['vodeni','brod']]),
      Z('Prometno sredstvo prema prostoru','Razvrstaj sredstva.',{kopno:['bicikl','vlak','autobus'],voda:['brod','trajekt','čamac'],zrak:['zrakoplov','helikopter','jedrilica']}),
      O('Sigurno prelazim cestu','Složi postupak.',['stani uz rub kolnika','pogledaj lijevo','pogledaj desno pa opet lijevo','provjeri da su vozila stala','prijeđi mirno najkraćim putem']),
      C('Pješački prijelaz','Zašto prelazimo na označenom prijelazu?','vozači ondje očekuju pješake',['cesta je ondje mekša','semafor ubrzava hodanje','automobili ondje nestaju']),
      V('Čitam skicu','Na skici je park desno od škole. Kamo ideš od škole do parka?','udesno',['ulijevo','ravno unatrag bez skretanja','gore u zrak']),
      T('Dani školskog tjedna','Poredaj dane od početka školskog tjedna.',['ponedjeljak','utorak','srijeda','četvrtak','petak']),
      S('Čitam puni sat','Velika kazaljka je na 12, a mala na 8. Koliko je sati?','8 sati',['12 sati','6 sati','4 sata']),
      M('Prometni znak i poruka','Spoji znak i značenje.',[['STOP','obvezno zaustavljanje'],['pješački prijelaz','mjesto prelaska pješaka'],['biciklistička staza','prostor za bicikle'],['semafor crveno','čekaj']]),
      Z('Prošlost, sadašnjost ili budućnost','Razvrstaj događaje.',{prošlost:['jučer sam čitao','prošli mjesec bio je izlet','jutros sam doručkovao'],sadašnjost:['sada rješavam zadatak','trenutačno sjedim','upravo slušam'],budućnost:['sutra ću vježbati','sljedeći tjedan je priredba','kasnije ću ručati']}),
      C('Skica kretanja','Zašto na skici označavamo važne objekte?','pomažu nam provjeriti put',['čine papir težim','zaustavljaju promet','mijenjaju strane svijeta']),
      V('Mjeseci i godina','Koji je zapis o kalendaru točan?','godina ima 12 mjeseci',['godina ima 7 mjeseci','svaki mjesec ima jednako dana','siječanj uvijek dolazi nakon prosinca iste godine'])
    ],
    energy:[
      S('Izvor energije','Što je prirodni izvor svjetlosti i topline?','Sunce',['hladnjak','olovka','stolac']),
      M('Uređaj i pretvorba','Spoji uređaj s glavnim učinkom.',[['svjetiljka','električna u svjetlosnu energiju'],['grijalica','električna u toplinsku energiju'],['zvučnik','električna u zvuk'],['ventilator','električna u gibanje']]),
      Z('Koristi energiju ili ne','Razvrstaj predmete.',{koristi_električnu:['hladnjak','svjetiljka','televizor'],ne_koristi_električnu:['drvena žlica','papirnata knjiga','ručna metla']}),
      O('Sigurno gasim uređaj','Složi postupak.',['završi korištenje','isključi uređaj njegovom tipkom','odspoji samo ako odrasli kažu','provjeri da nije vruć','pospremi kabel bez povlačenja']),
      C('Topla žlica','Zašto se metalna žlica u toplom čaju zagrije?','toplina prelazi s toplijeg čaja na žlicu',['žlica stvara Sunce','čaj postaje električan','zrak oboji metal']),
      V('Put električne energije','Što prenosi električnu energiju do kućanskog uređaja?','vodovi i kabeli',['staklene čaše','papirnate vrećice','drvene police']),
      T('Od izvora do svjetla','Poredaj pojednostavljeni put energije.',['energija se proizvede','prenosi se vodovima','dolazi do kuće','uključimo svjetiljku','žarulja daje svjetlost']),
      S('Štedimo energiju','Što učiniti pri izlasku iz prazne sobe?','ugasiti svjetlo',['otvoriti hladnjak','uključiti sve uređaje','pojačati grijanje']),
      M('Opasnost i oprez','Spoji situaciju s pravilnim postupkom.',[['mokre ruke','ne diraj električni uređaj'],['oštećen kabel','reci odrasloj osobi'],['vruća ploča','ne dodiruj'],['grmljavina','postupi prema uputi odraslih']]),
      Z('Obnovljivo ili uređaj','Razvrstaj pojmove.',{izvor:['Sunce','vjetar','voda u kretanju'],uređaj:['sušilo','perilica','računalo']}),
      C('Zatvaramo hladnjak','Zašto vrata hladnjaka ne držimo dugo otvorena?','uređaj tada troši više energije za hlađenje',['hrana postaje glasnija','svjetlo u kuhinji nestane','vrata postaju lakša']),
      V('Svjetlosno onečišćenje','Koji primjer nepotrebno troši energiju i stvara previše svjetla?','jaka rasvjeta praznog igrališta cijelu noć',['svjetlo dok čitamo','semafor koji upravlja prometom','mala svjetiljka pri nestanku struje'])
    ],
    health:[
      S('Zdrava navika','Što pomaže zdravlju svaki dan?','kretanje i dovoljno sna',['preskakanje svih obroka','cijeli dan bez vode','stalno sjedenje bez odmora']),
      M('Navika i korist','Spoji naviku s koristi.',[['pranje ruku','uklanja nečistoću'],['spavanje','tijelo se odmara'],['kretanje','jača tijelo'],['raznolika prehrana','daje različite hranjive tvari']]),
      Z('Češće ili rjeđe','Razvrstaj izbor hrane.',{češće:['povrće','voće','voda'],rjeđe:['slatki napitak','puno slatkiša','vrlo slane grickalice']}),
      O('Pravilno perem ruke','Složi postupak.',['smoči ruke','nanesi sapun','istrljaj dlanove i među prstima','isperi vodom','obriši čistim ručnikom']),
      C('Doručak prije škole','Zašto je koristan uravnotežen doručak?','daje tijelu energiju za početak dana',['zamjenjuje sav san','uklanja potrebu za vodom','čini torbu lakšom']),
      V('Tanjur raznolike hrane','Koji obrok je najraznolikiji?','povrće, žitarice i izvor bjelančevina',['samo bomboni','samo gazirani napitak','samo jedna slana grickalica']),
      T('Nakon tjelesne aktivnosti','Vježbanje je završilo. Poredaj brigu o sebi.',['zaustavi vježbanje','smiri disanje','popij vodu','presvuci mokru odjeću','odmori se']),
      S('Otpad ili smeće','Što je otpad koji se može pravilno odvojiti?','čista papirnata kutija',['mješavina svega bačena na tlo','razbijeno nepoznato sredstvo','prljava tekućina u parku']),
      M('Otpad i spremnik','Spoji otpad s uobičajenom skupinom.',[['novine','papir'],['staklenka','staklo'],['kora banane','biootpad'],['plastična boca','plastika']]),
      Z('Čuvamo ili onečišćujemo','Razvrstaj postupke.',{čuvamo:['gasimo nepotrebno svjetlo','odvajamo otpad','hodamo ili vozimo bicikl kada možemo'],onečišćujemo:['bacamo otpad u prirodu','stvaramo nepotrebnu buku','ostavljamo jaka svjetla bez potrebe']}),
      C('Odmor od zaslona','Zašto radimo stanke pri uporabi digitalne tehnologije?','odmaramo oči i tijelo',['uređaj zaboravi podatke','vrijeme se zaustavi','stol postane viši']),
      V('Zvučno onečišćenje','Koji primjer pokazuje nepotrebnu jaku buku?','glasna glazba noću uz otvorene prozore',['tihi razgovor','zvono za opasnost','ptičji pjev u parku'])
    ],
    nature:[
      S('Živo ili neživo','Što je živo biće?','maslačak',['kamen','lokva','oblak']),
      M('Dio biljke i uloga','Spoji dio i ulogu.',[['korijen','upija vodu'],['stabljika','drži biljku'],['list','prima svjetlost'],['cvijet','sudjeluje u nastanku ploda']]),
      Z('Živo ili neživo','Razvrstaj primjere.',{živo:['hrast','mrav','gljiva'],neživo:['kamen','voda','zrak']}),
      O('Od sjemena do biljke','Složi promjene.',['sjeme je u vlažnoj zemlji','iz sjemena izlazi klica','razvijaju se korijen i stabljika','pojavljuju se novi listovi','nastaje nova biljka']),
      C('Biljka bez svjetla','Zašto biljka dugo bez svjetla slabi?','ne dobiva uvjet potreban za zdrav rast',['zemlja postane metal','listovi prestanu imati dijelove','posuda izgubi oblik']),
      V('Svojstvo tvari','Čaša propušta pogled na predmet iza nje. Koje svojstvo opažamo?','prozirnost',['hrapavost','miris','glasnoću']),
      T('Jednostavno istraživanje','Poredaj korake.',['postavi pitanje','predvidi što će se dogoditi','izvedi sigurno opažanje','zapiši rezultat','usporedi rezultat s predviđanjem']),
      S('Osjetilo za miris','Kojim osjetilom prepoznajemo miris?','njuhom',['sluhom','vidom','dodirom']),
      M('Životinja i kretanje','Spoji životinju i način kretanja.',[['riba','pliva'],['ptica','leti'],['zmija','gmiže'],['zec','skače']]),
      Z('Svojstvo čvrste ili tekuće tvari','Razvrstaj opažanja.',{čvrsto:['zadržava vlastiti oblik','može biti tvrdo','može biti savitljivo'],tekuće:['teče','poprima oblik posude','može se preliti']}),
      C('Predmet pluta','Što možemo zaključiti kada predmet ostane na površini vode?','u tom pokusu pluta',['sigurno je od metala','nema nikakvu masu','mora biti proziran']),
      V('Cjelina i dijelovi','Koja je cjelina sastavljena od korijena, stabljike i listova?','biljka',['oblak','kamen','lokva'])
    ],
    place:[
      S('Mjesto u kojem živim','Što može biti dio naselja?','ulica',['ocean na Mjesecu','nevidljivi grad','oblak kao kuća']),
      M('Ustanova i uloga','Spoji ustanovu s ulogom.',[['dom zdravlja','briga o zdravlju'],['knjižnica','posudba knjiga'],['vatrogasna postaja','pomoć pri požaru'],['pošta','slanje pošiljaka']]),
      Z('Prirodno ili izgrađeno','Razvrstaj obilježja mjesta.',{prirodno:['rijeka','brdo','šuma'],izgrađeno:['most','škola','cesta']}),
      O('Istražujem svoje mjesto','Složi postupak.',['odaberi što želiš saznati','pronađi siguran izvor','promatraj uz odraslu osobu','zapiši važne podatke','predstavi što si otkrio']),
      C('Zanimanja u mjestu','Zašto su različita zanimanja važna?','zadovoljavaju različite potrebe zajednice',['sva rade isti posao','uklanjaju sva pravila','čine da nitko ne surađuje']),
      V('Krajolik mjesta','Koji opis sadrži i prirodno i izgrađeno obilježje?','rijeka prolazi pokraj mosta',['samo tri kuće','samo šumsko drveće','samo parkirani automobili']),
      T('Od cilja do ušteđevine','Želiš uštedjeti za odabrani cilj. Poredaj korake.',['odaberi cilj štednje','saznaj koliko cilj košta','odvoji dio dobivenog novca','bilježi koliko si uštedio','kupi cilj tek kada imaš dovoljno']),
      S('Baština','Što znači čuvati baštinu?','brinuti o vrijednim prirodnim i kulturnim obilježjima',['uništiti stare predmete','sakriti sve od zajednice','mijenjati bez istraživanja']),
      M('Zanimanje i posao','Spoji zanimanje s poslom.',[['liječnik','pomaže bolesnima'],['učitelj','poučava'],['poljoprivrednik','uzgaja biljke ili životinje'],['graditelj','gradi i popravlja građevine']]),
      Z('Kulturno ili prirodno','Razvrstaj baštinu.',{kulturno:['stara gradska jezgra','narodna nošnja','tradicijska pjesma'],prirodno:['zaštićena šuma','rijetka biljka','poseban slap']}),
      C('Čuvamo vodu','Zašto ne bacamo otpad u potok ili rijeku?','štetimo vodi i živim bićima',['voda postane viša samo taj dan','most promijeni boju','ribe nauče letjeti']),
      M('Blagdani kroz godinu','Spoji blagdan ili svečanost s opisom.',[['Dani kruha','zahvaljujemo za kruh i plodove zemlje'],['Božić','kršćanski blagdan koji se slavi u prosincu'],['Nova godina','počinje nova kalendarska godina'],['Uskrs','kršćanski blagdan koji se slavi u proljeće']])
    ]
  };

  const take={easy:2,medium:3,hard:4};
  const sortTake={easy:1,medium:2,hard:3};
  const prefix={easy:'',medium:'Poveži više tragova. ',hard:'Promisli o cijeloj situaciji. '};

  function groupedSteps(steps,level){
    if(level==='hard') return steps.slice();
    if(level==='medium') return [steps[0],steps[1],`${steps[2]}, zatim ${steps[3]}`,steps[4]];
    return [`${steps[0]}, zatim ${steps[1]}`,`${steps[2]}, zatim ${steps[3]}`,steps[4]];
  }

  function hardDecision(base,def,wrong,rng){
    const names=['Lara','Bitko'],correctFirst=rng()<.5;
    const claims=correctFirst?[[names[0],def.correct],[names[1],wrong[0]]]:[[names[0],wrong[0]],[names[1],def.correct]];
    const correctName=correctFirst?names[0]:names[1],wrongName=correctFirst?names[1]:names[0];
    const answer=`${correctName} je u pravu, a ${wrongName} nije.`;
    const options=[answer,`${wrongName} je u pravu, a ${correctName} nije.`,'Oba su zapisa točna.','Nijedan zapis nije točan.'];
    return {...base,reasoning:'evidence',clues:claims.map(([name,claim])=>`${name} je zapisao/la: „${claim}”.`),prompt:`Procijeni dva zapisa kao dokaz. ${def.prompt} Tko je zaključio u skladu s činjenicama?`,options:E.shuffle(options,rng),answer};
  }

  function makeQuestion(world,level,def,index,rng){
    const meta=worlds.find(item=>item.id===world);
    const base={id:`${world}-${level}-${index}`,world,level,type:def.type,title:def.title,prompt:prefix[level]+def.prompt};
    if(['single','cause','observe'].includes(def.type)){
      const wrong=E.shuffle(def.wrong,rng);
      const question=level==='hard'?hardDecision(base,def,wrong,rng):{...base,options:E.shuffle([def.correct,...wrong.slice(0,level==='easy'?2:3)],rng),answer:def.correct};
      return def.type==='observe'?{...question,scene:[meta.icon,meta.name]}:question;
    }
    if(def.type==='match'){
      const pairs=E.shuffle(def.pairs,rng).slice(0,take[level]);
      return {...base,left:E.shuffle(pairs.map(pair=>pair[0]),rng),right:E.shuffle(pairs.map(pair=>pair[1]),rng),answer:pairs.map(pair=>pair.slice())};
    }
    if(def.type==='sort'){
      const answer={};
      for(const [name,items] of Object.entries(def.zones)) answer[name]=E.shuffle(items,rng).slice(0,sortTake[level]);
      return {...base,zones:Object.keys(answer),items:E.shuffle(Object.values(answer).flat(),rng),answer};
    }
    const answer=groupedSteps(def.steps,level);
    return {...base,prompt:`${prefix[level]}Složi cjelovit predloženi redoslijed. ${def.prompt}`,items:E.shuffle(answer,rng),answer};
  }

  const templates={};
  for(const world of worlds){
    templates[world.id]={};
    for(const level of levels) templates[world.id][level.id]=banks[world.id].map((definition,index)=>(rng)=>makeQuestion(world.id,level.id,definition,index,rng));
  }

  function templateCount(){return worlds.reduce((sum,world)=>sum+levels.reduce((total,level)=>total+templates[world.id][level.id].length,0),0);}

  function buildRound(level,world,seed){
    if(!levels.some(item=>item.id===level)) throw new Error('Nepoznata razina.');
    const rng=E.makeRng(seed);
    const half=Number(seed)&1;
    if(world==='mix') return E.shuffle(worlds.map(item=>{const list=templates[item.id][level].slice(half*6,half*6+6);return list[Math.floor(rng()*list.length)](rng);}),rng);
    if(!templates[world]) throw new Error('Nepoznati svijet.');
    return E.shuffle(templates[world][level].slice(half*6,half*6+6),rng).slice(0,5).map(factory=>factory(rng));
  }

  return {levels,worlds,templates,templateCount,buildRound};
});
