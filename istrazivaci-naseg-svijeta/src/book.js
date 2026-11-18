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
  const extraNames={osobine:'Moji interesi',ucenje:'Što već znam',mjeseci:'Susjedni mjeseci',duljina:'Koliko dana ima mjesec?',doba:'Mjesec i godišnje doba',smjena:'Kotač godišnjih doba',trajanje:'Koliko je trajala aktivnost?','vremenska-crta':'Događaji na vremenskoj crti',tijelo:'Kako mi služe dijelovi tijela?',zglobovi:'Pokret i zglob',stednja:'Moj plan štednje',zivo:'Kako prepoznati rast?',staniste:'Gdje smo opazili životinju?',neovisnost:'Dan neovisnosti',datumi:'Dva važna datuma',kruh:'Od zrna do kruha',zrno:'Tko sudjeluje u izradi kruha?',prosinac:'Blagdani na kalendaru','nova-godina':'Prvi dan godine',uskrs:'Uskrs i proljeće',pisanice:'Uskrsni običaji'};
  return {units,unitById,groups,extraNames,extra};
});
