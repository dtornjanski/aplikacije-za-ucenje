(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WorldBook=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Page references are from the 2020/21 Croatian teaching plan for this title.
  // Labels below name the skills practised; they are not a transcription of the book.
  const rows=[
    [6,7,'Što volim i što učim','school',['osobine','ucenje']],
    [8,9,'Rodbinske veze','home',[0,1,'stablo']],
    [10,11,'Kako surađujemo u razredu','school',[5,7,11,'dogovor']],
    [12,13,'Moja prava i obveze','school',[0,1,2,8,10]],
    [14,15,'Odgovornost u zajednici','school',[3,6,9,11]],
    [16,19,'Jesensko vrijeme, biljke i životinje','autumn',[4,5,7,10,'lisce']],
    [20,21,'Ljudi i jesenski poslovi','autumn',[8,9]],
    [22,25,'Zimska opažanja u prirodi','winter',[1,4,5,7,'tragovi']],
    [26,27,'Život ljudi zimi','winter',[2,3,8]],
    [28,31,'Proljetna opažanja u prirodi','spring',[0,5,7,10,'pupoljci']],
    [32,33,'Ljudi i proljetni poslovi','spring',[3,8,11]],
    [34,37,'Ljetno vrijeme i živi svijet','summer',[0,4,5,7,'vrijeme']],
    [38,39,'Život ljudi ljeti','summer',[1,2,3,8,10]],
    [40,41,'Položaj i čitanje skice puta','spacetime',[0,5,10,'skica']],
    [42,43,'Kako putuju ljudi i roba','spacetime',[1,2]],
    [44,45,'Pješaci i prometni znakovi','spacetime',[3,4,8]],
    [46,49,'Očitavanje i mjerenje vremena','spacetime',[7,'sat','trajanje']],
    [50,51,'Redoslijed i duljina mjeseci','spacetime',['mjeseci','duljina']],
    [52,53,'Mjeseci i izmjena godišnjih doba','spacetime',['doba','smjena']],
    [54,55,'Snalaženje na kalendaru','spacetime',['kalendar',11]],
    [56,57,'Jučer, danas i sutra','spacetime',[9,'vremenska-crta']],
    [58,59,'Dijelovi tijela i njihove uloge','health',['tijelo','zglobovi']],
    [60,63,'Navike koje čuvaju zdravlje','health',[0,1,3,6,'ruke']],
    [64,65,'Raznolikost u prehrani','health',[2,4,5]],
    [66,67,'Kako se snalazim u svome mjestu','place',[0,1,'ustanove']],
    [68,69,'Prirodno i izgrađeno u krajoliku','place',[2,3,5]],
    [70,71,'Što rade ljudi u mjestu','place',[4,8]],
    [72,73,'Rad, novac i štednja','place',[6,'stednja']],
    [74,75,'Što čuvamo za buduće naraštaje','place',[7,9]],
    [76,77,'Kako prepoznati živo biće','nature',[0,2,'zivo']],
    [78,79,'Dijelovi i rast biljke','nature',[1,3,4,11]],
    [80,81,'Životinje, kretanje i staništa','nature',[8,'staniste']],
    [82,85,'Ispitujemo svojstva tvari','nature',[5,6,9,10,'pokus']],
    [86,87,'Otpad i briga za okoliš','health',[7,8,9,11]],
    [88,91,'Izvori i oblici energije','energy',[0,1,4,5,9]],
    [92,93,'Gdje upotrebljavamo energiju','energy',[1,2,3,8]],
    [94,95,'Štednja energije','energy',[7,10,11,'uredaji']],
    [96,96,'Dan neovisnosti u Hrvatskoj','place',['neovisnost','datumi']],
    [97,97,'Od zrna do kruha','place',['kruh','zrno']],
    [98,98,'Božić i početak nove godine','place',['prosinac','nova-godina']],
    [99,99,'Uskrs i uskrsni običaji','place',['uskrs','pisanice']]
  ];
  const units=rows.map(([from,to,name,world,keys])=>({id:'str-'+from,from,to,name,world,keys}));
  const groups=[[6,'Ja, obitelj i škola'],[16,'Priroda kroz godišnja doba'],[40,'Prostor, promet i vrijeme'],[58,'Tijelo i zdravlje'],[66,'Moje mjesto'],[76,'Priroda i okoliš'],[88,'Energija'],[96,'Dani koje obilježavamo']];
  const unitById=new Map(units.map(u=>[u.id,u]));

  const month=['siječanj','veljača','ožujak','travanj','svibanj','lipanj','srpanj','kolovoz','rujan','listopad','studeni','prosinac'];
  const seasons=['zima','proljeće','ljeto','jesen'];
  const names=['Mia','Ema','Rita','Iva','Nika','Dora','Eva','Lana'];
  const interests=['crtanje','čitanje priča','pjevanje','ples','plivanje','vrtlarenje'];
  function t(prompt,a,b,x,y,z,visual){return {prompt,right:[a,b],wrong:[x,y,z],visual};}
  function extra(key,level,rng){
    const n=Math.floor(rng()*120),i=n%4,name=names[n%8],a=n%12,m=month[a],next=month[(a+1)%12],prev=month[(a+11)%12];
    const visual=(caption,headers,rows)=>({kind:'table',caption,headers,rows});
    switch(key){
      case 'osobine':{
        const like=interests[n%6],learn=interests[(n+2)%6];
        return t(name+' piše „'+like+' mi je omiljena aktivnost. '+learn+' upravo učim.” Što znamo o njoj?', 'najviše voli '+like,'trenutačno uči '+learn,'najviše voli '+learn,'prestala je učiti '+learn,'rekla je da je '+like+' ne zanima');
      }
      case 'ucenje':
        return t(name+' piše „Sama složim slagalicu. Još vježbam vezanje vezica.” Koja izjava odgovara njezinu opisu?','slaganje slagalice već joj ide samostalno','vezanje vezica vještina je koju još uvježbava','ni slagalicu ne zna složiti bez pomoći','vezanje vezica opisuje kao vještinu koju je već svladala','napisala je da više nema što naučiti');
      case 'mjeseci':
        return t('Na vremenskoj crti označen je mjesec '+m+'. Koja tvrdnja o susjednim mjesecima vrijedi?', 'sljedeći je mjesec '+next,'prethodni je mjesec '+prev,'sljedeći je mjesec '+prev,'neposredno prije njega dolazi '+next,'odmah nakon njega dolazi '+month[(a+2)%12]);
      case 'duljina':{
        const year=2027+n%2,counts=[31,year===2028?29:28,31],v=visual('Kalendar za '+year+'.',['Mjesec','Broj dana'],[['siječanj',31],['veljača',counts[1]],['ožujak',31]]);
        return t('Usporedi tri mjeseca iz kalendara. Koji je zaključak točan?','veljača ovdje ima '+counts[1]+' dana','siječanj i ožujak imaju isti broj dana','sva tri mjeseca imaju jednako dana','veljača je ovdje dulja od ožujka','siječanj ima manje dana od veljače',v);
      }
      case 'doba':{
        const anchor=[0,3,6,9][i]+(Math.floor(n/4)%2);
        return t('U Hrvatskoj je sredina mjeseca. Ime mjeseca na kalendaru je '+month[anchor]+'. Koje je godišnje doba?',seasons[i],'isto godišnje doba kao i sredinom mjeseca '+month[[0,3,6,9][i]+(anchor%3===0?1:0)],...seasons.filter(s=>s!==seasons[i]));
      }
      case 'smjena':
        return t('Na kotaču godišnjih doba označeno je doba „'+seasons[i]+'”. Koja tvrdnja opisuje slijed u Hrvatskoj?','sljedeće je doba '+seasons[(i+1)%4],'prethodno je doba '+seasons[(i+3)%4],'sljedeće je doba '+seasons[(i+3)%4],'odmah prije njega dolazi '+seasons[(i+1)%4],'odmah nakon njega dolazi '+seasons[(i+2)%4]);
      case 'trajanje':{
        const h=8+i,d=[10,15,20,30][i],shown=(h+':00'),end=h+':'+d;
        return t('Čitanje je počelo u '+shown+', a završilo u '+end+'. Što vrijedi?','trajalo je '+d+' minuta','završilo je prije '+(h+1)+':00','trajalo je '+(60-d+(d===30?5:0))+' minuta','završilo je u '+(h+1)+':'+d,'trajalo je cijeli sat');
      }
      case 'vremenska-crta':{
        const d=['ponedjeljak','utorak','srijeda','četvrtak','petak','subota'];
        return t('U dnevniku piše: jučer — crtanje, danas — čitanje, sutra — izlet. Danas je '+d[i+1]+'. Koja tvrdnja prati dnevnik?','izlet će biti u danu poslije čitanja','crtanje je već bilo','izlet je prije crtanja','čitanje je planirano tek za sutra','sve tri aktivnosti bile su jučer');
      }
      case 'tijelo':
        return [
          t('Svaku od dvije kutije ispitaš zatvorenih očiju. Jedna zvecka kad je protreseš, a druga ima hrapav poklopac. Što si mogla doznati?', 'sluhom mogu prepoznati kutiju koja zvecka','dodirom mogu prepoznati hrapav poklopac','iz samog zveckanja mogu znati boju poklopca','po hrapavosti znam koja kutija glasnije zvecka','po zvuku znam je li na kutiji nacrtana zvijezda'),
          t('Držiš loptu objema rukama. Najprije je pustiš, zatim je udariš stopalom. Što se dogodilo?', 'prije udarca loptu su držale ruke','stopalo je promijenilo smjer lopte','loptu si najprije udarila pa je pustila','loptu si držala dok si je udarala','lopta je napustila ruke tek nakon udarca'),
          t('Jedan je kamen gladak, a drugi hrapav. Oba su siva. Koja bi ti provjera pomogla pronaći hrapavi kamen?', 'prijeći jagodicama prstiju preko površine','dodirnuti oba kamena i usporediti ih','odabrati kamen samo po sivoj boji','izvagati ih i zaključiti da je teži uvijek hrapav','izmjeriti duljinu i zaključiti da je kraći uvijek hrapav'),
          t('U ogledalu promatraš kako se krećeš. Najprije kimneš glavom pa podigneš ramena. Koji opis odgovara tim pokretima?', 'pri kimanju pomičem glavu u odnosu na trup','ramena podižem poslije kimanja','ramena sam podigla prije kimanja','u prvom sam pokretu samo podigla ramena','drugi je pokret bilo okretanje glave u stranu')][i];
      case 'zglobovi':{
        const leg=n%2===1;
        const part=leg?'nogu':'ruku',end=leg?'stopalo':'šaku',towards=leg?'stražnjoj strani natkoljenice':'ramenu',joint=leg?'koljeno':'lakat';
        return t('Dijete savija '+part+' tako da '+end+' približava '+towards+'. Koji opis odgovara pokretu?', 'zglob koji se savija jest '+joint,'nakon savijanja '+(leg?'stopalo':'šaka')+' je bliže tijelu','dijete ispruža '+part,'razmak između kraja uda i tijela postaje veći','pokret se događa samo u '+(leg?'gležnju':'ručnom zglobu'));
      }
      case 'stednja':{
        const have=3+i,price=have+2+i;
        return t(name+' ima '+have+' eura. Knjiga koju želi kupiti stoji '+price+' eura. Što vrijedi?','treba uštedjeti još '+(price-have)+' eura','knjiga stoji više od iznosa koji sada ima','već ima točan iznos za kupnju','knjiga stoji manje nego što je uštedjela','nakon kupnje odmah bi joj ostala još dva eura');
      }
      case 'zivo':
        return t('Na istom prozoru promatraš mladicu, lončić i povećalo. Koju promjenu možeš zabilježiti kao znak života mladice?','raste i razvija se','iz sjemenke nastaju novi dijelovi biljke','netko je pomaknuo lončić na drugo mjesto','na povećalu se vidi odraz lista','na lončiću se osušila kap vode');
      case 'staniste':
        return t('Učenici su najprije opazili leptira na livadi. Potom su kraj potoka opazili žabu. Koji zapis odgovara bilješkama?','leptir je opažen na livadi','žaba je opažena kraj potoka','žabu su opazili prije leptira','obje su životinje zapisali kao opažanja s livade','leptira su opazili nakon dolaska do potoka');
      case 'neovisnost':
        return t('U hrvatskom kalendaru usporedi Dan neovisnosti i Novu godinu. Koja tvrdnja vrijedi za Dan neovisnosti?','obilježava se 25. lipnja','u Hrvatskoj je spomendan u lipnju','obilježava se 1. siječnja','obilježava se 25. prosinca','obilježava se posljednjeg dana svibnja');
      case 'datumi':{
        const v=visual('Dio hrvatskog kalendara',['Datum','Dan'],[['30. svibnja','Dan državnosti'],['25. lipnja','Dan neovisnosti']]);
        return t('Usporedi ova dva datuma iz iste godine. Što pokazuje kalendar?','Dan državnosti dolazi prije Dana neovisnosti','Dan neovisnosti obilježava se u kasnijem mjesecu','oba su dana u istom mjesecu','Dan neovisnosti dolazi u svibnju','Dan državnosti dolazi poslije Dana neovisnosti',v);
      }
      case 'kruh':
        return t('Za Dane kruha razred prati kako od zrna pšenice nastaje kruh. Koji je par poredan od ranije radnje prema kasnijoj?','samljeti zrno pa zamijesiti tijesto','zamijesiti tijesto pa ispeći kruh','ispeći kruh pa od istog kruha zamijesiti prvotno tijesto','zamijesiti tijesto pa tek samljeti zrno za to isto tijesto','ispeći kruh pa tek požeti pšenicu za taj kruh');
      case 'zrno':
        return t('Na izložbi za Dane kruha prva slika prikazuje žetvu, druga mljevenje, a treća pekaricu kraj peći. Koje su uloge točno povezane?','mlinar melje zrno u brašno','pekarica oblikuje i peče kruh','na ovoj slici pekarica žanje pšenicu na polju','uz prikaz mljevenja zrna ide slika žetve','uz prikaz pečenja kruha ide slika rada u mlinu');
      case 'prosinac':
        return t('Na kalendaru su označeni Božić i prvi dan sljedeće godine. Koja tvrdnja vrijedi?','Božić se obilježava 25. prosinca','Nova godina počinje 1. siječnja','oba su dana u prosincu iste godine','Nova godina počinje zadnjeg dana prosinca','Božić se obilježava prvog dana siječnja');
      case 'nova-godina':
        return t('Posljednji je dan prosinca. Što se u kalendaru promijeni na početku sljedećeg dana?','počinje siječanj','počinje nova kalendarska godina','počinje veljača','počinje ponovo 1. prosinca','mjesec se mijenja, a godina zadržava stari broj');
      case 'uskrs':
        return t('Ove godine obitelj slavi Uskrs u nedjelju. Koja tvrdnja odgovara tom blagdanu?','Uskrs se obilježava u proljeće','Uskrsni ponedjeljak slijedi dan nakon Uskrsa','Uskrsni ponedjeljak pada dan prije Uskrsa','Uskrs je uvijek 1. siječnja','Uskrs i Božić uvijek su u istom mjesecu');
      case 'pisanice':
        return t('Jedna obitelj za Uskrs ukrašava jaja, a druga ima drukčiji običaj. Što možeš zaključiti?','ukrašena uskrsna jaja zovemo pisanice','obitelji mogu imati različite uskrsne običaje','druga je obitelj prema opisu ukrasila ista jaja','iz jednog primjera znamo običaje svih obitelji','pisanica je naziv za ukras na novogodišnjem drvcu');
      default:throw new Error('Nepoznata nastavna vježba.');
    }
  }
  function choice(prompt,answer,...wrong){return {prompt,answer,wrong};}
  function table(caption,headers,rows){return {kind:'table',caption,headers,rows};}

  const hardExamples={
    osobine:[
      choice('Iva voli crtati, a želi naučiti plesati. Koja joj radionica pomaže ostvariti tu želju?',
        'Plesna radionica.','Likovna radionica.','Glazbena radionica.','Dramska radionica.'),
      choice('Tin rado pliva, a tek želi naučiti svirati. Koju će aktivnost izabrati ako danas želi raditi ono što već voli?',
        'Otići na bazen.','Poći na prvi sat klavira.','Pridružiti se crtačkoj skupini.','Otići na plesnu probu.')],
    ucenje:[
      choice('Mia sama složi slagalicu, ali kod vezanja vezica traži pomoć. Što treba vježbati da bi to mogla sama?',
        'Vezanje vezica.','Slaganje slagalice.','Obje vještine već izvodi sama.','Obje vještine prvi put tek treba pokušati.'),
      choice('Tin sam vozi bicikl, a čvor na užetu još veže uz pomoć. Što bi pokazalo da je svladao novu vještinu?',
        'Sam zaveže čvor.','Opet sam odveze bicikl.','Promatra kako odrasla osoba veže čvor.','Netko umjesto njega zaveže čvor.')],
    zivo:[
      choice('Uz mladicu stoje lončić i olovka. Što pokazuje da se mladica razvija?',
        'Na stabljici je izrastao novi list.','Netko je premjestio lončić.','Na olovku je pala sjena lista.','Na rubu lončića osušila se voda.'),
      choice('Na prvom crtežu je sjeme, na drugom iz njega viri korjenčić. Što možeš zaključiti?',
        'Sjeme je počelo klijati.','Netko je samo premjestio sjeme.','Narastao je samo lončić.','Razlikuje se samo boja podloge.')],
    staniste:[
      {...choice('Gdje bi razred prema oba zapisa ponovno potražio žabu?',
        'Pokraj bare.','Na livadi.','Kod obližnje škole.','Samo uz grm na livadi.'),
        visual:table('Bilješke s izleta',['Mjesto','U ponedjeljak','U utorak'],[['bara','žaba','žaba'],['livada','leptir','skakavac']])},
      {...choice('Koju su životinju učenici vidjeli na oba mjesta?',
        'Leptira.','Žabu.','Skakavca.','Žabu i skakavca.'),
        visual:table('Bilješke s izleta',['Mjesto','Životinje'],[['livada','leptir, skakavac'],['uz potok','leptir, žaba']])}],
    neovisnost:[
      {...choice('Koji hrvatski spomendan iz kalendara dolazi dan nakon 24. lipnja?',
        'Dan neovisnosti.','Dan državnosti.','Nova godina.','Božić.'),
        visual:table('Dio hrvatskog kalendara',['Datum','Dan'],[['30. svibnja','Dan državnosti'],['25. lipnja','Dan neovisnosti']])},
      {...choice('Dan prije Dana neovisnosti razred priprema izložbu. Kojeg datuma priprema izložbu?',
        '24. lipnja.','25. lipnja.','26. lipnja.','24. svibnja.'),
        visual:table('Dio hrvatskog kalendara',['Datum','Dan'],[['25. lipnja','Dan neovisnosti']])}],
    datumi:[
      {...choice('Koji se od ova dva dana prvi obilježava u istoj godini?',
        'Dan državnosti.','Dan neovisnosti.','Oba su istoga dana.','Redoslijed se iz tablice ne vidi.'),
        visual:table('Dio hrvatskog kalendara',['Datum','Dan'],[['25. lipnja','Dan neovisnosti'],['30. svibnja','Dan državnosti']])},
      {...choice('Danas je 1. lipnja. Koji od ova dva dana u istoj godini tek dolazi?',
        'Dan neovisnosti.','Dan državnosti.','Oba dana tek dolaze.','Oba su već prošla.'),
        visual:table('Dio hrvatskog kalendara',['Datum','Dan'],[['30. svibnja','Dan državnosti'],['25. lipnja','Dan neovisnosti']])}],
    kruh:[
      choice('Pšenica je požnjevena, a pekarica treba brašno za tijesto. Što još treba učiniti sa zrnom?',
        'Samljeti ga u brašno.','Ispeći već gotov kruh.','Ohladiti tek ispečeni kruh.','Narezati kruh na kriške.'),
      choice('Brašno je već u zdjeli, a tijesto još nije umiješeno. Koji koraci sada idu redom?',
        'Zamijesiti tijesto pa ispeći kruh.','Ispeći kruh pa zamijesiti tijesto.','Narezati kruh pa samljeti zrno.','Samljeti zrno pa tek požeti pšenicu.')],
    zrno:[
      choice('Poljoprivrednica je donijela zrno, a pekar treba brašno. Tko će ih povezati svojim poslom?',
        'Mlinar koji melje zrno.','Prodavač koji naplaćuje kruh.','Pekar koji hladi gotov kruh.','Traktorist koji tek sije pšenicu.'),
      choice('Mlinar je pripremio brašno. Kome ga treba poslati da nastane kruh?',
        'Pekarici koja mijesi i peče.','Poljoprivrednici da ga požanje.','Prodavaču da ga nareže na kriške.','Mlinaru da ga pretvori natrag u zrno.')],
    prosinac:[
      choice('Božić je 25. prosinca. Koji datum pripada istom mjesecu, ali dolazi poslije Božića?',
        '31. prosinca.','24. prosinca.','1. siječnja.','1. prosinca.'),
      choice('Čestitke su označene datumima 25. prosinca i 1. siječnja iduće godine. Kojim redom stižu blagdani?',
        'Božić pa Nova godina.','Nova godina pa Božić.','Oba su istoga dana.','Oba su u siječnju.')],
    uskrs:[
      choice('U kalendaru je Uskrs u nedjelju 5. travnja. Kojeg je datuma Uskrsni ponedjeljak?',
        '6. travnja.','4. travnja.','5. travnja.','12. travnja.'),
      choice('Na kalendaru piše Uskrsni ponedjeljak, 29. ožujka. Kojeg je datuma bio Uskrs?',
        '28. ožujka.','29. ožujka.','30. ožujka.','22. ožujka.')],
    pisanice:[
      choice('Jedna obitelj jaja oboji lukovinom, druga iscrta uzorke voskom. Što je zajedničko njihovu uskrsnom običaju?',
        'Obje ukrašavaju jaja i izrađuju pisanice.','Obje upotrebljavaju samo vosak.','Obje upotrebljavaju samo lukovinu.','Obje izrađuju jednake uzorke.'),
      choice('Ema je opisala kako njezina obitelj izrađuje pisanice. Kako će saznati ima li druga obitelj isti običaj?',
        'Pitat će kako ta obitelj slavi Uskrs.','Prepisat će svoj opis i za drugu obitelj.','Prebrojit će samo svoje pisanice.','Pogledat će jedino datum Uskrsa.')],
  };
  const body=[
    [
      choice('Vrećice izgledaju isto. Samo je u jednoj zvonce. Kako ćeš ga naći bez gledanja?',
        'Protresti vrećice i slušati.','Usporediti im boje.','Izmjeriti im duljinu.','Opipati šav na svakoj vrećici.'),
      choice('Oba su kamena siva, ali samo je jedan hrapav. Kako ćeš ga prepoznati zatvorenih očiju?',
        'Prstima prijeći preko površine.','Slušati kako kamen zvuči.','Usporediti težinu kamenja.','Izmjeriti im duljinu.'),
      choice('Držiš zdjelu objema rukama. Kako možeš pokazati da se slažeš, a da je ne ispustiš?',
        'Kimnuti glavom.','Pljesnuti dlanovima.','Mahnuti objema rukama.','Prekrižiti ruke na prsima.'),
      choice('Držiš loptu objema rukama. Želiš je zakotrljati nogom po podu. Što trebaš učiniti prvo?',
        'Spustiti je pred stopalo.','Podignuti je iznad glave.','Prisloniti je uz rame.','Držati je uz prsa.'),
    ],[
      choice('Dva su jastučića jednake boje i veličine. Kako ćeš bez gledanja pronaći mekši?',
        'Pritisnuti oba dlanom.','Slušati iznad kojega je tiše.','Pomirisati oba jastučića.','Izmjeriti im širinu.'),
      choice('Metvica i riža su u jednakim platnenim vrećicama. Kako ćeš bez otvaranja potražiti metvicu?',
        'Pomirisati obje vrećice.','Izmjeriti im vrpce.','Opipati samo šavove.','Usporediti boju platna.'),
      choice('Knjiga se zatvara čim je pustiš. Jednom rukom držiš korice. Čime okrećeš samo jedan list?',
        'Prstima druge ruke.','Laktom kojim držiš knjigu.','Ramenom ispod knjige.','Dlanom koji drži korice.'),
      choice('Prvo čučneš pa posegneš za loptom na polici. Kojim je pokretom možeš dohvatiti?',
        'Uspraviti se i ispružiti ruke.','Ostati nisko i saviti laktove.','Spustiti ruke uz tijelo.','Spustiti se u dublji čučanj.'),
    ],
  ];
  const joints=[
    [
      choice('Približiš šaku ramenu, a nadlaktica miruje. Koji se zglob savija?','Lakat.','Rame.','Ručni zglob.','Koljeno.'),
      choice('Stojiš i podižeš petu prema stražnjici, a natkoljenica miruje. Koji se zglob savija?',
        'Koljeno.','Gležanj.','Kuk.','Lakat.'),
    ],[
      choice('Podlaktica miruje na stolu. Podižeš samo šaku. Koji se zglob pomiče?','Ručni zglob.','Lakat.','Rame.','Koljeno.'),
      choice('Peta ostaje na podu dok podižeš prednji dio stopala. Koji se zglob pomiče?','Gležanj.','Koljeno.','Kuk.','Rame.'),
    ],
  ];

  function hardExtra(key,rng,review){
    const n=Math.floor(rng()*120),i=n%4,version=review?1:0;
    if(hardExamples[key])return hardExamples[key][version];
    if(key==='tijelo')return body[version][i];
    if(key==='zglobovi')return joints[version][n%2];
    const genitive=['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenoga','prosinca'];
    switch(key){
      case 'mjeseci':{
        const a=n%12,at=offset=>month[(a+12+offset)%12],pair=(x,y)=>at(x)+' i '+at(y);
        return review?choice('Na kalendaru piše „'+at(0)+'”. Koja su dva mjeseca neposredno prije njega, redom?',
          pair(-2,-1),pair(-1,-2),pair(1,2),pair(-3,-2)):
          choice('Na kalendaru piše „'+at(0)+'”. Koja dva mjeseca slijede, redom?',pair(1,2),pair(-2,-1),pair(2,1),pair(2,3));
      }
      case 'duljina':{
        if(review)return {...choice('Koja dva mjeseca iz tablice imaju jednak broj dana?',
          'Travanj i lipanj.','Travanj i svibanj.','Svibanj i lipanj.','Sva tri mjeseca.'),
          visual:table('Duljina mjeseci',['Mjesec','Broj dana'],[['travanj',30],['svibanj',31],['lipanj',30]])};
        const year=2027+n%2,feb=year===2028?29:28,correct=31-feb,days=['Za 1 dan.','Za 2 dana.','Za 3 dana.','Za 4 dana.'];
        return {...choice('Za koliko je dana veljača kraća od ožujka?',days[correct-1],...days.filter((_,j)=>j!==correct-1)),
          visual:table('Kalendar za '+year+'.',['Mjesec','Broj dana'],[['siječanj',31],['veljača',feb],['ožujak',31]])};
      }
      case 'doba':{
        const start=i*3,labels=['Zima.','Proljeće.','Ljeto.','Jesen.'];
        if(review){
          const dates=[1,4,7,10].map(m=>'15. '+genitive[m]+'.');
          return choice('Izlet je 12. '+genitive[start]+'. Koji je još datum u Hrvatskoj u istom godišnjem dobu?',
            dates[i],...dates.filter((_,j)=>j!==i));
        }
        return choice('Izlet je 12. '+genitive[start]+', a priredba 15. '+genitive[start+1]+'. U koje godišnje doba u Hrvatskoj padaju oba događaja?',
          labels[i],...labels.filter((_,j)=>j!==i));
      }
      case 'smjena':{
        const at=d=>seasons[(i+d+4)%4],pair=(a,b)=>at(a)+' pa '+at(b);
        return review?choice('Na kotaču piše „'+at(0)+'”. Pomakni se jedno doba unatrag pa još jedno. Koje je to doba?',
          at(-2),at(-1),at(0),at(1)):
          choice('Sada je '+at(0)+'. Koja dva godišnja doba slijede, redom?',pair(1,2),pair(2,1),pair(-1,0),pair(1,-1));
      }
      case 'trajanje':{
        const h=8+i,d=[20,25,30,35][i],minute=45+d-60;
        const end=(h+1)+':'+String(minute).padStart(2,'0');
        if(review)return choice('Igra počinje u '+h+':45 i traje '+d+' minuta. Kada završava?',
          end,h+':'+String(minute).padStart(2,'0'),(h+1)+':45',(h+1)+':'+String(minute+5).padStart(2,'0'));
        const options=[20,25,30,35].map(v=>v+' minuta.');
        return choice('Čitanje počinje u '+h+':45, a završava u '+end+'. Koliko traje?',options[i],...options.filter((_,j)=>j!==i));
      }
      case 'vremenska-crta':{
        const days=['ponedjeljak','utorak','srijeda','četvrtak','petak','subota','nedjelja'],at=d=>days[(n+d+7)%7];
        return review?choice('Danas je '+at(0)+'. Jučer smo pjevali, a dan prije toga crtali. Koji smo dan crtali?',at(-2),at(-1),at(0),at(1)):
          choice('Danas je '+at(0)+'. Sutra je izlet, a dan poslije izleta predstava. Koji je dan predstava?',at(2),at(-1),at(0),at(1));
      }
      case 'stednja':{
        const have=3+i,price=have+2+i,amount=v=>v+' €';
        return review?choice('Knjiga košta '+amount(price)+'. Imaš '+amount(have)+' pa uštediš još 1 €. Koliko ti još nedostaje?',
          amount(price-have-1),amount(price-have),amount(price-have+1),amount(price)):
          choice('Imaš '+amount(have)+', a knjiga košta '+amount(price)+'. Koliko još trebaš uštedjeti?',
            amount(price-have),amount(price-have+1),amount(price),amount(price+have));
      }
      case 'nova-godina':{
        const year=2027+i;
        return review?choice('Danas je 1. siječnja '+(year+1)+'. Koji je datum bio jučer?',
          '31. prosinca '+year+'.','31. prosinca '+(year+1)+'.','1. prosinca '+year+'.','2. siječnja '+(year+1)+'.'):
          choice('Danas je 31. prosinca '+year+'. Koji će datum biti sutra?',
            '1. siječnja '+(year+1)+'.','1. siječnja '+year+'.','31. siječnja '+(year+1)+'.','1. prosinca '+(year+1)+'.');
      }
      default:throw new Error('Nepoznata nastavna vježba.');
    }
  }
  const extraNames={osobine:'Moji interesi',ucenje:'Što već znam',mjeseci:'Susjedni mjeseci',duljina:'Koliko dana ima mjesec?',doba:'Mjesec i godišnje doba',smjena:'Kotač godišnjih doba',trajanje:'Koliko je trajala aktivnost?','vremenska-crta':'Događaji na vremenskoj crti',tijelo:'Kako mi služe dijelovi tijela?',zglobovi:'Pokret i zglob',stednja:'Moj plan štednje',zivo:'Kako prepoznati rast?',staniste:'Gdje smo opazili životinju?',neovisnost:'Dan neovisnosti',datumi:'Dva važna datuma',kruh:'Od zrna do kruha',zrno:'Tko sudjeluje u izradi kruha?',prosinac:'Blagdani na kalendaru','nova-godina':'Prvi dan godine',uskrs:'Uskrs i proljeće',pisanice:'Uskrsni običaji'};
  return {units,unitById,groups,extraNames,extra,hardExtra};
});
