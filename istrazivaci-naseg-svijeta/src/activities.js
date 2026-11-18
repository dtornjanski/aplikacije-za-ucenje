(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WorldActivities=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // The two valid readings are offered together only in two-speaker questions.
  function task(prompt,a,b,x,y,z){return {prompt,right:[a,b],wrong:[x,y,z]};}
  const cases={
    school:{
      0:task('U paru imate jednu lupu. Dogovor je da oboje pregledate svoj list. Koji postupak poštuje dogovor?','nakon promatranja predam lupu paru','dogovorimo kada ćemo zamijeniti uloge','zadržim lupu i opišem paru njegov list','oba lista pregleda onaj tko je prvi sjeo','drugo dijete svoj list samo nacrta bez promatranja'),
      4:task('Učiteljica je na početku sata objasnila igru. Tin je došao kad je počeo drugi krug. Što je Tin propustio?','objašnjenje igre','prvi krug igre','objašnjenje koje će učiteljica dati na kraju','sve preostale krugove','razgovor o igri nakon sata'),
      5:task('Četiri učenice izrađuju razredni plakat. Svaka treba pridonijeti radu. Koji plan to omogućuje?','svaka pripremi jedan dio pa zajedno slože plakat','podijele crtanje, pisanje, lijepljenje i provjeru','jedna učenica izradi plakat i potpiše sve četiri','tri učenice rade dok četvrta samo čeka odmor','samo najbrža učenica dovršava sve dijelove'),
      7:task('Nova učenica želi sudjelovati u igri koju još ne poznaje. Kako je uključiti?','prije igre objasniti joj pravila','prvi krug odigrati s njom u paru','ostaviti joj ulogu gledateljice za cijelu igru','podijeliti ekipe prije nego što je itko pita','nastaviti igru dok sama ne pogodi pravila'),
      10:task('Pravilo razgovora glasi „Govori jedan po jedan”. Čemu ono služi?','lakše čujemo što svatko želi reći','i tiša djeca mogu doći na red','uvijek prvo govori ista osoba','svatko treba imati isto mišljenje','smije se javiti samo onaj tko je prvi podigao ruku'),
      11:task('Ema je jučer prva birala igru. Danas i Nika želi predložiti igru. Koja odluka daje priliku objema?','danas saslušamo i Nikin prijedlog','dogovorimo da djeca naizmjence biraju igru','svaki dan bira jučerašnja pobjednica','Nika čeka dok Ema više nema nijedan prijedlog','glasniji prijedlog uvijek ima prednost')},
    home:{
      0:task('Ana kaže „Luka je brat moje mame.” Što iz toga znamo o Luki?','Luka je Anin ujak','Ana i Luka su rodbina','Luka je Anin stric','Luka je brat Anina oca','Luka je Anin brat'),
      4:task('Mila stavlja tanjure, tata čaše, a baka pribor na stol. Što pokazuje ovaj primjer?','posao oko stola podijelili su među sobom','svatko obavlja svoj dio zajedničkog posla','Mila je sama pripremila cijeli stol','svatko je donio po jedan isti predmet','baka je bila zadužena za čaše'),
      5:task('Na zajedničkom ulazu su zvona za četiri stana. Što možeš zaključiti iz toga podatka?','isti ulaz vodi do više stanova','stanari tih stanova dijele ulaz','iza svakog zvona nalazi se druga kuća','svi stanari žive u jednoj istoj sobi','broj zvona pokazuje broj katova'),
      7:task('Razbacane su Ivanove bojice. Na popisu kućnih poslova uz njegovo ime piše „složi svoj pribor”. Što je njegov zadatak?','vratiti bojice u pernicu','prikupiti vlastiti pribor sa stola','premjestiti bojice na sestrin stol i ostaviti ih tamo','složiti samo tuđe knjige umjesto svoga pribora','upisati sestrino ime umjesto svojega'),
      10:task('Kutija stoji nasred zajedničkog hodnika. Susjeda prolazi s dječjim kolicima. Zašto je dobro osloboditi prolaz?','kolica mogu nesmetano proći','hodnik služi svim stanarima za kretanje','tako hodnik postaje dio samo jednoga stana','tada se hodnikom mogu koristiti samo kolica','kutija na sredini bolje označuje slobodan put'),
      11:task('U čitaonici vratimo knjigu na policu. Kod kuće vratimo pribor u ladicu. Što je zajedničko tim postupcima?','vraćamo stvari na dogovoreno mjesto','drugoj osobi olakšavamo da pronađe stvar','obje su stvari pohranjene u školsku torbu','oba se postupka odvijaju u istoj prostoriji','i knjiga i pribor vraćaju se u ladicu')},
    autumn:{
      0:task('U rujnu je na označenoj grani bilo zeleno lišće. U listopadu su rubovi tih listova žuti. Što pokazuju zapisi?','promijenila se boja dijela lišća','ista je grana promatrana u dva mjeseca','promatrači su odabrali dvije različite grane','u rujnu su rubovi već bili žuti','svi su listovi do listopada pali'),
      5:task('Ujutro su uz stazu vidjeli maglu, a poslijepodne vedro nebo. Koja bilješka odgovara opažanju?','magla je zabilježena ujutro','nebo je poslijepodne bilo vedro','magla je bila vidljiva pri oba promatranja','magla se pojavila tek poslijepodne','jutarnje i poslijepodnevno nebo izgledali su jednako'),
      7:task('Vjeverica odnosi lješnjake i skriva ih na nekoliko mjesta. Što opažanje podupire?','sprema dio hrane za poslije','hranu je odnijela na više mjesta','odmah je pojela sve lješnjake','svaki je lješnjak ostavila gdje je pronađen','sve je lješnjake odnijela na samo jedno mjesto'),
      10:task('Lastavice se hrane letećim kukcima. Kada zahladi, takvih je kukaca manje. Što im pomaže pronaći hranu?','odlazak u područje s više letećih kukaca','pronalaženje kraja u kojem kukci još lete','boravak tamo gdje više nema letećih kukaca','traženje isključivo sjemenki umjesto kukaca','ostanak na istom mjestu zato što hladnoća povećava broj letećih kukaca'),
      11:task('Želiš idući tjedan usporediti boju lišća istog javora. Što treba sadržavati prvi zapis?','datum i boju lišća toga javora','oznaku stabla i crtež njegovih listova s datumom','samo datum budućeg opažanja','boju lišća susjednog hrasta bez podataka o javoru','samo boju korica bilježnice')},
    winter:{
      0:task('Na rukavu vidiš bijele pahulje koje upravo padaju iz oblaka. Što opažaš?','pada snijeg','iz oblaka padaju pahulje','na rukavu se pojavila samo rosa','iz oblaka padaju kapi kiše','pahulje su se podigle s tla umjesto da padaju iz oblaka'),
      4:task('Zimi na hrastu vidiš gole grane, a na boru zelene iglice. Koji zaključak podupire taj prizor?','hrast je izgubio lišće, a bor ima iglice','ta dva stabla zimi izgledaju različito','oba stabla ostala su bez svih listova ili iglica','hrast i zimi nosi zelene iglice','bor u opažanju ima gole grane bez iglica'),
      5:task('U zimskom zapisu piše „svitanje oko 7 sati, mrak oko 17 sati”. Što možeš zaključiti za taj dan?','u 8 sati već je bilo danje svjetlo','u 18 sati već je pao mrak','svitanje je bilo nakon 8 sati','u 16 sati već je bio noćni mrak','u 18 sati tek je počelo svitati'),
      7:task('Luka je više dana promatrao isto stablo zimi. Pupovi su bili zatvoreni i pri posljednjem opažanju. Što može zapisati?','nije opazio otvaranje pupova u tim danima','pupovi su pri posljednjem promatranju bili zatvoreni','do zadnjeg opažanja razvio se otvoren cvijet','na svakoj je grani već vidio nove listove','stablo više nikada neće imati lišće'),
      10:task('Kocka leda bila je na tanjuru u toploj sobi. Poslije je na tanjuru bila voda. Što se dogodilo?','led se otopio','voda je prešla iz čvrstog u tekuće stanje','tekuća se voda zaledila','voda je ostala u istom stanju','od vode je nastao novi sloj leda'),
      11:task('Vidljivi otisci vode od grma do ograde. Što možeš zaključiti samo iz tih tragova?','na snijegu se vidi put između grma i ograde','životinja je prošla barem dijelom tog prostora','znaš točan sat svakog koraka','broj otisaka jednak je broju životinja','znaš da se životinja sada nalazi kod ograde')},
    spring:{
      0:task('Na istoj grani prije tjedan dana bili su pupovi. Danas iz njih vire mladi listovi. Što se promijenilo?','pojavili su se mladi listovi','neki su se pupovi počeli otvarati','listovi su otpali i ostavili golu granu','svi su se cvjetovi već pretvorili u zrele plodove','pupovi su danas zatvoreniji nego prije'),
      4:task('Dvije su biljke iste vrste zalivene jednako. Jedna je u toploj, svijetloj sobi, a druga u hladnijoj i tamnijoj. Po čemu se razlikuju njihovi uvjeti?','po količini svjetlosti i toplini','po tome koliko je na njihovu mjestu toplo i svijetlo','samo po količini vode','po vrsti biljke koju promatramo','samo po broju zalijevanja'),
      5:task('Na jednoj označenoj grančici iz pupa je izašao list, na drugoj cvijet. Što pokazuju ta dva primjera?','iz pupa se može razviti list ili cvijet','oba se pupa nisu razvila u isti dio biljke','svaki se pup razvije samo u list','oba su se pupa razvila u cvijet','iz svakog pupa odmah nastane zreo plod'),
      7:task('U proljeće je ptica više puta nosila travke na isto mjesto među granama. Koji je zaključak u skladu s opažanjem?','na to mjesto donosila je materijal','moguće je da ondje gradi gnijezdo','iz opažanja se zna koliko ima jaja','viđeno je kako mladi već lete','ptica je svaki put nosila travke na različito mjesto'),
      10:task('U proljeće opet ima više letećih kukaca. Što to znači za pticu koja ih lovi?','na tom području lakše dolazi do hrane','povratkom ondje može pronaći više svojega plijena','može se hraniti samo ondje gdje nema kukaca','kukci joj tada služe samo za građenje gnijezda','manje kukaca znači više hrane za tu pticu'),
      11:task('Za izlet je najavljeno svježe jutro, toplije podne i moguć pljusak. Što najbolje odgovara tom planu?','odjeća u slojevima i lagana kabanica','majica, sloj koji se može skinuti i zaštita od kiše','samo debela jakna za cijeli dan bez zaštite od kiše','samo kratki rukavi iako jutro počinje hladno','obuća za kišu bez ikakvog toplijeg sloja za jutro')},
    summer:{
      0:task('U hladu je u 8 sati izmjereno 20 stupnjeva, a u 13 sati 30. Što pokazuju mjerenja?','u 13 sati bilo je toplije','jutarnja temperatura bila je niža','u 8 sati bilo je toplije','pri oba mjerenja bilo je 30 stupnjeva','temperatura se između dvaju mjerenja snizila'),
      4:task('Biljci se zemlja osušila, a u toplom su danu listovi klonuli. Koje je objašnjenje moguće?','biljka je izgubila više vode nego što je primila','iz suhe zemlje nije dobila dovoljno vode','suha je zemlja biljci dala više vode nego vlažna','iz listova voda može izlaziti samo zimi','toplina biljkama posve zamjenjuje vodu'),
      5:task('U istom mjestu oko početka ljeta u 20 sati još je svijetlo. Oko početka zime u isto je vrijeme mrak. Što podupiru zapisi?','u ljetnom zapisu još ima večernjeg svjetla','u tom zimskom zapisu mrak je pao prije 20 sati','u oba je zapisa u 20 sati mrak','zimi je prema zapisu u 20 sati svjetlije','ljetni zapis pokazuje da je Sunce već zašlo prije 20 sati i da je mrak'),
      7:task('U dvorištu je vruće. Pas se s osunčane staze pomaknuo pod drvo pokraj zdjelice vode. Što se može zaključiti?','premjestio se u hlad','na novom je mjestu u blizini vode','izabrao je osunčano mjesto','iz opažanja znamo koliko je vode popio','iz opažanja znamo koliko će dugo ostati pod drvetom'),
      10:task('U dva jednaka plitka tanjurića bilo je jednako vode. Stajali su na istom dvorištu, jedan na suncu, drugi u hladu. Na suncu je ostalo manje vode. Što opažaš?','u tanjuriću na suncu nestalo je više vode','u hladu je na kraju ostalo više vode','na početku je na suncu bilo manje vode','na kraju je u oba bilo jednako vode','u hladu je nestalo više vode nego na suncu'),
      11:task('Na vrućem igralištu Ena kaže da joj se vrti i da je jako slaba. Koji je prikladan sljedeći postupak?','prekinuti igru i odmah reći odrasloj osobi','uz odraslu osobu skloniti se u hlad','pričekati kraj utakmice prije nego što ikomu kaže','nastaviti trčati dok je još na suncu','otići sama dalje od odraslih i ne reći gdje je')},
    spacetime:{
      0:task('Na crtežu je kutija na klupi, a lopta je točno ispod sjedala. Koji opis odgovara crtežu?','klupa je iznad lopte','lopta je niže od kutije','lopta je na sjedalu','kutija je ispod lopte','lopta i kutija nalaze se na istoj visini'),
      4:task('Luka i odrasla osoba stigli su do obilježenoga pješačkog prijelaza. Što označuju bijele crte?','mjesto namijenjeno prelasku pješaka','mjesto na kojem vozači trebaju očekivati pješake','da je cesta zatvorena za sva vozila','da pješaci ondje trebaju čekati autobus','da bijele crte služe za parkiranje bicikala'),
      10:task('Na skici puta do igrališta nacrtani su škola, most i knjižnica. Zašto su ti objekti korisni?','mogu ih prepoznati na putu','pomažu mi provjeriti idem li pravim smjerom','njihova veličina na papiru pokazuje broj koraka do cilja','potrebno je ući u svaku nacrtanu zgradu','redoslijed objekata mogu zanemariti i stići istim putem')},
    energy:{
      0:task('Na klupi je sunčeva svjetlost. Pod nadstrešnicom učiteljica je upalila baterijsku svjetiljku. Koji opis vrijedi?','Sunce je prirodni izvor svjetlosti','svjetiljka za rad koristi energiju iz baterije','sunčana klupa svjetlost dobiva iz baterije','ugašena svjetiljka jednako jako osvjetljuje klupu','nadstrešnica proizvodi svjetlost koju vidimo od svjetiljke'),
      4:task('Hladnija metalna žličica stavljena je u topliji čaj. Nakon nekog vremena i drška je toplija. Kako to objasniti?','toplina prelazi s toplijeg čaja na žličicu','toplina se prenosi metalom do drške','hladna žličica daje toplinu toplijem čaju','drška se može zagrijati samo ako je uronjena u čaj','toplina se prenosi samo kroz vodu, a ne kroz metal'),
      5:task('Svjetiljka na stolu ima utikač i kabel. U kojem dijelu njezina puta struja dolazi do uređaja?','kroz priključeni kabel','od utičnice do svjetiljke kroz vodiče','kroz sjenilo iz kojeg svjetlost pada na stol','od osvijetljenoga stola natrag do žarulje kroz zrak','kroz prekidač i kada je kabel izvučen iz utičnice'),
      7:task('Čitanje je gotovo, svi napuštaju učionicu, a dvije svjetiljke još rade. Koji postupak štedi energiju?','ugasiti obje nepotrebne svjetiljke','ostaviti rasvjetu ugašenu dok nikome ne treba','ugasiti jednu i upaliti treću jednake snage','ostaviti obje upaljene cijeli odmor','premjestiti obje upaljene svjetiljke u drugu praznu sobu'),
      10:task('Uzela si mlijeko iz hladnjaka. Zašto je dobro odmah zatvoriti vrata?','manje toplog zraka ulazi u hladnjak','hladnjak troši manje energije na ponovno hlađenje','kroz otvorena vrata unutra ulazi hladniji zrak iz tople kuhinje','otvorena vrata pomažu da uređaj manje hladi','zatvaranjem vrata prestaje potreba da se hrana drži hladnom'),
      11:task('Usporedi rasvjetu. Koji primjer pokazuje jako svjetlo koje noću nikomu ne treba?','jaki reflektori svijetle na zatvorenom, praznom igralištu','prazno zaključano dvorište cijelu noć osvjetljuju upaljeni reflektori','svjetiljka kod stuba svijetli dok njima netko prolazi','radna lampa svijetli dok netko čita','signalno svjetlo pokazuje prometu kada treba stati')},
    health:{
      0:task('Leo je dugo sjedio i pisao. Sada ima kratku stanku prije sljedećeg zadatka. Koji plan uključuje kretanje?','prošetati do kraja hodnika i natrag','ustati i lagano se razgibati','ostati sjediti i listati drugu bilježnicu','ostati na istom stolcu i prijeći na igru na zaslonu','nastaviti pisati bez prekida'),
      4:task('Mia doručkuje prije škole. Koja je uloga hrane u njezinu jutru?','hrana tijelu daje energiju','tijelo dobiva hranjive tvari','doručak može zamijeniti cijelu noć sna','jedan obrok uklanja potrebu za vodom tijekom dana','nakon doručka tijelu više ne treba nijedan obrok toga dana'),
      5:task('Zadatak je složiti obrok koji sadrži povrće, žitaricu i hranu bogatu bjelančevinama. Koji tanjur ispunjava sva tri uvjeta?','mrkva, riža i grah','rajčica, kruh i jaje','riža, kruh i tjestenina','mrkva, krastavac i paprika','jaje, sir i jogurt'),
      7:task('Tražiš suhu, čistu papirnatu ambalažu za spremnik za papir. Koji predmet odgovara?','prazna suha kartonska kutijica','čista papirnata vrećica','masna papirnata vrećica s ostacima hrane','staklenka s papirnatom naljepnicom','plastična kutijica u obliku kartonske'),
      10:task('Poslije čitanja na zaslonu razred ima stanku. Što omogućuje odmor od gledanja izbliza i sjedenja?','ustati i pogledati kroz prozor u daljinu','prošetati prostorijom i odmaknuti pogled od zaslona','ostati sjediti i približiti drugi zaslon očima','samo povećati glasnoću i nastaviti istu igru','sjedeći nastaviti čitati sitna slova na mobitelu'),
      11:task('Koji se zvuk može stišati kako buka uvečer ne bi smetala ljudima koji se odmaraju?','preglasna glazba iz zvučnika kraj otvorenog prozora','nepotrebno pojačan televizor u kasnim satima','zvučni znak hitne službe dok žuri pomoći','alarm koji upravo upozorava na opasnost','zvuk kojim netko upravo zove u pomoć')},
    nature:{
      0:task('Na ploči su crteži mrava, maslačka, kamena, lokve i oblaka. Koji prikazuje živo biće?','mrav','maslačak','kamen','lokva','oblak'),
      4:task('Dvije biljke graha iste su vrste, imaju jednako vode i toplo im je. Jedna je danima u tami, a druga na svjetlu. Koji se uvjet razlikuje?','koliko svjetla dobivaju','je li mjesto osvijetljeno','količina vode koju dobivaju','vrsta biljke koju promatramo','toplina mjesta, ako je u obje sobe jednako toplo'),
      5:task('Kroz zatvoreno staklo jasno vidiš list s druge strane. Koje svojstvo si tako provjerila?','prozirnost stakla','prolazi li svjetlost tako da se vidi predmet iza stakla','savija li se staklo pod prstima','upija li staklo kap vode','koliko je staklo teško'),
      7:task('Zatvorenih očiju prepoznaješ miris metvice, bez dodirivanja i kušanja. Koje si osjetilo upotrijebila?','njuh','osjetilo mirisa','okus','sluh','dodir'),
      10:task('U pokusu je čep ostao na površini vode, a kamenčić se spustio na dno. Koji zapis odgovara opažanju?','čep je u ovom pokusu plutao','kamenčić je u ovom pokusu potonuo','oba su predmeta završila na dnu','kamenčić je plutao, a čep je potonuo','oba su predmeta ostala na površini'),
      11:task('Na crtežu su zajedno korijen, stabljika i listovi jedne mlade biljke. Koji opis obuhvaća cijeli crtež?','prikazana je biljka s nekoliko dijelova','korijen, stabljika i listovi dijelovi su iste biljke','prikazan je samo korijen','svaki list na tom crtežu zasebna je cijela biljka','na crtežu je samo stabljika bez drugih dijelova')},
    place:{
      0:task('Ulica vodi od pošte do trga. Ondje počinje jedina staza do parka. Koja tvrdnja opisuje taj put?','od pošte do trga možemo ići ulicom','na trgu skrećemo na stazu prema parku','staza od pošte do parka zaobilazi trg','staza počinje kod pošte i završava na trgu','od trga do parka ostajemo na istoj ulici'),
      4:task('Pekar peče kruh, a vozač ga dostavlja trgovini. Što pokazuje ovaj primjer?','različiti poslovi povezuju ljude','oba posla pomažu da kruh stigne kupcima','vozač je ispekao kruh samom vožnjom','pekar je pečenjem već obavio i dostavu do trgovine','trgovina je u ovom primjeru primila kruh prije pečenja'),
      5:task('Koji opis spaja jedno prirodno i jedno izgrađeno obilježje mjesta?','most prelazi preko rijeke','uz brdo je izgrađena cesta','most povezuje dvije ulice','rijeka teče ispod brda','između dviju kuća stoji klupa'),
      7:task('U mjestu žele sačuvati stari običaj. Koji im postupak u tome pomaže?','zapisati kako se običaj provodi','naučiti mlađe sudionike tradicijskoj pjesmi','zamijeniti stari zapis praznom stranicom','sačuvati samo datum događaja i izbrisati njegov opis','organizirati susret, a zanemariti to kako se običaj izvodi'),
      10:task('Pokraj potoka ostale su vrećice koje vjetar može odnijeti u vodu. Zašto ih s odraslom osobom spremamo u spremnik?','tako sprečavamo da vrećice dospiju u vodu','čuvamo prostor u kojem žive vodene životinje','vrećice u vodi postaju hrana za sve ribe','pomicanjem otpada nizvodno potok se posve očisti','vrećica u vodi odmah nestane bez traga')}
  };
  function sunset(level,rng){
    const offset=Math.floor(rng()*3)*10,minute=String(offset).padStart(2,'0');
    const rows=[['rujan','7:'+minute,'19:'+minute,'vedro'],['studeni','7:'+minute,'17:'+minute,'vedro']];
    const visual={kind:'table',caption:'Primjer dvaju opažanja na istome mjestu',headers:['Mjesec','Izlazak','Zalazak','Nebo'],rows};
    if(level==='easy')return {...task('U kojem je mjesecu u ovom primjeru Sunce zašlo ranije?','u studenome','u mjesecu u drugom retku','u rujnu','u oba mjeseca u isti sat','iz zapisa se ne vidi kada Sunce zalazi'),visual};
    if(level==='medium')return {...task('Za koliko je u ovom primjeru razdoblje od izlaska do zalaska Sunca kraće u studenome?','za 2 sata','za 120 minuta','za 1 sat','za 3 sata','jednako je dugo'),visual};
    return {...task('Pročitaj oba zapisa. Koje zaključke možeš potvrditi?','u studenome je razdoblje dnevnog svjetla kraće','nebo je pri obama opažanjima bilo vedro','u rujnu je Sunce zašlo ranije','kraći se studeni dan u ovom zapisu može objasniti oblačnim nebom','Sunce je u studenome izašlo dva sata kasnije'),visual};
  }
  function choice(prompt,answer,...wrong){return {prompt,answer,wrong};}
  function comparison(prompt,truth,wrong,visual){return {prompt,truth,wrong,visual};}
  function sunsetTable(prompt,answer,months,times,wrong){
    const visual={kind:'table',caption:'Zalazak Sunca na istome mjestu',headers:['Mjesec','Zalazak'],
      rows:months.map((month,i)=>[month,times[i]])};
    return {...choice(prompt,answer,...wrong),visual};
  }
  // Each pair has an initial situation and a different situation for targeted review.
  const hardCases={
    school:{
      0:[
        choice('Imate jednu lupu i po jedan list. Kako oboje možete pregledati svoj list?',
          'Nakon pregleda zamijenimo se za lupu.','Ja pogledam oba lista.','Svaki pregleda samo pola istog lista.','Drugi učenik samo sluša moj opis.'),
        choice('Oboje želite voditi igru. Imate dva kruga. Kako ćete podijeliti posao?',
          'Svatko vodi po jedan krug.','Oba kruga vodi prvi dobitnik.','Voditelj se bira samo za prvi krug.','Oba kruga vodi onaj tko prvi počne.')],
      4:[
        choice('Upute su bile prije igre. Tin je stigao na početku drugog kruga. Što je sve propustio?',
          'Upute i prvi krug.','Samo upute.','Prvi i drugi krug.','Drugi krug i kraj igre.'),
        choice('Iva dolazi nakon podjele uloga, a prije pokusa. Što treba saznati da bi se uključila?',
          'Koja je njezina uloga u pokusu.','Kako je pokus završio.','Tko je pospremio nakon pokusa.','Koji je rezultat već zapisan.')],
      5:[
        choice('Četvero djece radi plakat. Troje crta, piše i lijepi. Kako može pridonijeti četvrto dijete?',
          'Provjeriti jesu li svi naslovi uz prave slike.','Samo potpisati gotov plakat.','Otići prije završetka i prepustiti provjeru drugima.','Pričekati da ostali sve provjere.'),
        choice('Za razrednu izložbu trebaju slike i opisi. Kako će dva para podijeliti posao?',
          'Jedan par crta, a drugi piše opise.','Oba para crtaju i ostavljaju slike bez opisa.','Oba para pišu, a slike ostave za drugi put.','Jedan par radi oboje, a drugi samo gleda.')],
      7:[
        choice('Nova učenica još ne zna pravila. Što joj omogućuje da već u prvom krugu igra s vama?',
          'Objasnimo pravila i odigramo prvi krug s njom.','Damo joj bilježnicu da zapisuje naš rezultat.','Zamolimo je da samo broji igrače.','Neka gleda do kraja igre.'),
        choice('Tin želi igrati, ali još ne zna kako dodati loptu. Kako ga uključiti u ekipu?',
          'Pokažemo dodavanje pa mu dodamo loptu.','Zamolimo ga da do kraja sjedi na klupi.','Povjerimo mu samo čuvanje torbi.','Dodajemo loptu samo iskusnim igračima.')],
      10:[
        choice('Svi pričaju u isti glas pa se Nikin prijedlog ne čuje. Koje pravilo pomaže?',
          'Govori jedna osoba, a ostali slušaju.','Tko govori najglasnije, završava prvi.','Svi ponove svoj prijedlog istodobno.','Uvijek govori samo jedan isti učenik.'),
        choice('U skupini nitko nije čuo Tinovo pitanje. Što mu omogućuje da ga svi čuju?',
          'Ostali pričekaju dok Tin postavi pitanje.','Svatko odmah predloži svoj odgovor.','Parovi nastave razgovarati dok Tin pita.','Tin pitanje prepusti onome tko je glasniji.')],
      11:[
        choice('Ema je jučer birala igru. Dogovor je da se izmjenjuje s Nikom. Što će biti danas?',
          'Nika bira igru.','Ema bira i danas.','Bira jučerašnja pobjednica.','Bira ona koja prva vikne.'),
        choice('Tin i Leo naizmjence vode krugove. Leo je vodio prvi krug, Tin drugi. Tko vodi treći?',
          'Leo.','Tin.','Pobjednik drugog kruga.','Onaj tko prvi podigne ruku.') ]},
    home:{
      0:[
        choice('Luka je brat Anine mame. Kako će ga Ana predstaviti prijateljici?',
          'Moj ujak.','Moj stric.','Moj djed.','Moj brat.'),
        choice('Iva je sestra Tinova tate. Kako su Iva i Tin povezani?',
          'Iva je Tinova teta.','Iva je Tinova baka.','Iva je Tinova sestra.','Iva je Tinova majka.')],
      4:[
        choice('Mila je postavila tanjure, tata čaše, a baka pribor. Kojim su dogovorom pripremili stol?',
          'Svatko je preuzeo drugi dio posla.','Svatko je postavio samo svoj pribor.','Svatko je postavio cijeli stol za sebe.','Svi su donijeli iste predmete.'),
        choice('Za objed još nedostaju čaše i pribor. Kako dva člana obitelji mogu podijeliti preostali posao?',
          'Jedan stavi čaše, drugi pribor.','Oboje donesu samo pribor.','Oboje donesu samo čaše.','Jedan donese tanjure, drugi ih složi.')],
      5:[
        choice('Na istom su ulazu četiri zvona s brojevima stanova. Što sigurno znaš o stanovima?',
          'Sva četiri imaju zajednički ulaz.','Sva četiri su na istom katu.','U svakom žive četiri osobe.','U zgradi su četiri kata.'),
        choice('Ema i Leo otključaju ista ulazna vrata, a zatim svaki svoja vrata stana. Što dijele?',
          'Ulaz u zgradu.','Dnevnu sobu.','Svoju kuhinju.','Ključ svakoga stana.')],
      7:[
        choice('Na popisu uz Ivana piše „spremi svoj pribor”. Njegove su bojice na stolu. Kamo ih treba vratiti?',
          'U svoju pernicu.','U sestrinu školsku torbu.','Na rub istog stola.','Na stolicu pokraj stola.'),
        choice('Uz Niku piše „spremi svoje knjige”. Koji posao odgovara njezinu dijelu dogovora?',
          'Vratiti svoje knjige na policu.','Složiti samo bratove bojice.','Ostaviti svoje knjige na podu.','Prenijeti knjige na slobodnu stolicu.')],
      10:[
        choice('Kutija je nasred ulaza kojim prolaze dječja kolica. Kada će svi stanari imati slobodan prolaz?',
          'Kad kutiju spremimo u stan.','Kad je stavimo pred susjedova vrata.','Kad je pomaknemo na sredinu stuba.','Kad na nju stavimo natpis.'),
        choice('Na zajedničkim stubama stoji romobil. Što pomaže i susjedu koji nosi vrećice?',
          'Spremiti romobil na mjesto izvan prolaza.','Okrenuti ga poprijeko na stubi.','Prekriti ga jaknom.','Ostaviti ga na stubi i upaliti svjetlo.')],
      11:[
        choice('Knjigu vratiš na označenu policu, a škare u ladicu za pribor. Kako pomažeš sljedećoj osobi?',
          'Može ih pronaći na dogovorenom mjestu.','Oba će predmeta naći u ladici.','Znat će tko se njima zadnji služio.','Može ih odmah naći u istoj prostoriji.'),
        choice('Nakon igre lopta ide u košaru, a kocke u kutiju s oznakom. Što je zajedničko tom pospremanju?',
          'Svaku igračku vraćamo na njezino mjesto.','Obje igračke moraju stati u istu kutiju.','Igračke slažemo prema težini.','Sve igračke pripadaju samo jednoj osobi.')]},
    autumn:{
      0:[
        choice('U rujnu je list bio zelen. U listopadu na istom listu vidiš žuti rub. Što se promijenilo?',
          'Boja dijela lista.','Položaj označene grane.','Broj stabala u drvoredu.','Mjesto na kojem raste stablo.'),
        choice('U ponedjeljak je na grani bilo osam listova, a u petak pet. Što se promijenilo na grani?',
          'Ima tri lista manje.','Ima tri lista više.','Ostalo je osam listova.','Ostala su samo tri lista.')],
      4:[
        sunsetTable('U kojem će mjesecu u 18 sati Sunce već zaći?','U studenome.',['rujan','studeni'],['19:00','17:00'],['U rujnu.','U oba mjeseca.','Ni u jednom mjesecu.']),
        sunsetTable('U kojem će mjesecu u 17 sati Sunce još biti iznad obzora?','U listopadu.',['listopad','prosinac'],['18:00','16:00'],['U prosincu.','U oba mjeseca.','Ni u jednom mjesecu.'])],
      5:[
        choice('Ujutro se klupa na kraju staze nije vidjela od magle. Poslijepodne se vidjela. Što se promijenilo?',
          'Poslijepodne se vidjelo dalje.','Ujutro se vidjelo dalje.','Oba se puta vidjelo jednako daleko.','Klupa je poslijepodne nestala.'),
        choice('U 8 sati vrh brda skrila je magla. U 12 sati vidio se. Koji zapis možeš unijeti uz 8 sati?',
          'Vrh se nije vidio od magle.','Vrh se vidio bez magle.','Vrh se vidio pri oba opažanja.','Magla se pojavila tek poslije podne.')],
      7:[
        choice('Vjeverica jedan lješnjak pojede, a tri zakopa. Čemu mogu poslužiti zakopani lješnjaci?',
          'Kao zaliha hrane za poslije.','Kao obrok koji je upravo pojela.','Kao dokaz da više ne traži hranu.','Kao trag da ne jede lješnjake.'),
        choice('Vjeverica zimi otkopa orahe koje je sakrila u jesen. Kako joj je jesenski posao pomogao?',
          'Sada može jesti spremljenu hranu.','Sada više ne mora otvarati orahe.','U jesen je već pojela sve te orahe.','Orah je pod zemljom ostao samo kao oznaka.')],
      10:[
        choice('Lastavica lovi leteće kukce. U hladnoj ih je dolini sve manje. Gdje će lakše naći hranu?',
          'U toplijem kraju u kojem kukci još lete.','U kraju u kojem su nestali svi kukci.','Na mjestu gdje ima samo sjemenki.','Na hladnijem mjestu s još manje kukaca.'),
        choice('U jednom se polju roje mušice, a u drugom ih nakon zahlađenja nema. Gdje će lastavica lakše loviti?',
          'Nad poljem s mušicama.','Nad poljem bez mušica.','U oba jednako, jer su polja iste veličine.','U polju bez kukaca, ako ima više zrnja.')],
      11:[
        choice('Za tjedan dana želiš provjeriti je li isti list promijenio boju. Koji ti zapis treba danas?',
          'Datum, oznaka lista i njegova boja.','Samo datum sljedećeg obilaska.','Boja bilo kojeg lista u parku.','Broj stabala uz školu.'),
        choice('Danas brojiš listove na jednoj grani. Kako ćeš za tjedan dana moći usporediti broj?',
          'Označim granu i uz datum zapišem broj.','Zapišem boju najbliže klupe.','Sutra prebrojim listove drugog stabla.','Označim stablo, ali preskočim brojanje.')]},
    winter:{
      0:[
        choice('Na tamni rukav padaju pahulje. U toplom razredu ostanu kapljice. Što je vani padalo?',
          'Snijeg.','Kiša.','Tuča u tvrdim kuglicama.','Rosa.'),
        choice('Na prozor padaju prozirne kapi. Ne vidiš pahulje ni zrnca leda. Koju ćeš oborinu zapisati?',
          'Kišu.','Snijeg.','Tuču.','Susnježicu s pahuljama.')],
      4:[
        choice('Usred zime jedno stablo ima gole grane, a drugo zelene iglice. Koje bolje odgovara opisu bora?',
          'Stablo sa zelenim iglicama.','Stablo s golim granama.','Oba, jer je zima.','Nijedno, jer zimi nema zelenila.'),
        choice('Na hrastu su ujesen bili široki listovi, a zimi ih nema. Bor je i dalje zelen. Što vrijedi za hrast?',
          'Do zime je ostao bez listova.','Listovi su mu se pretvorili u iglice.','Zimi ima isto lišće kao bor.','Podaci pokazuju da ni ljeti nema listova.')],
      5:[
        choice('Toga je dana svanulo u 7 sati, a smračilo se u 17. U koje su doba oba izlaska bila po danu?',
          'U 8 i u 16 sati.','U 6 i u 16 sati.','U 8 i u 18 sati.','U 6 i u 18 sati.'),
        choice('U 8 sati već je svanulo, a u 17 se smračilo. Šetnja traje od 16 do 18 sati. Kada se smračilo?',
          'Za vrijeme šetnje.','Prije početka šetnje.','Tek nakon završetka šetnje.','Točno na početku šetnje.')],
      7:[
        choice('U ponedjeljak i petak pup na označenoj grani bio je zatvoren. Što znaš iz ta dva opažanja?',
          'Oba je puta bio zatvoren.','U srijedu se sigurno otvorio.','U petak je na njegovu mjestu bio cvijet.','Taj se pup neće nikada otvoriti.'),
        choice('Na istoj grančici tri si jutra nacrtala zatvoren pup. Što bi na idućem crtežu pokazalo promjenu?',
          'Iz pupa viri listić.','Pup je i dalje zatvoren.','Na papiru je novi datum.','Grančica je nacrtana većom olovkom.')],
      10:[
        choice('Na tanjuru je bila kocka leda. U toploj sobi na istome mjestu vidiš lokvicu. Odakle voda?',
          'Nastala je otapanjem leda.','Nastala je smrzavanjem lokvice.','Led je ostao čitav u lokvici.','Lokvica je ondje bila prije leda.'),
        choice('Na toplom prozoru grudica snijega postala je manja, a ispod nje je voda. Što se s njom događa?',
          'Dio snijega otapa se u vodu.','Voda se pretvara u sve više snijega.','Sav je snijeg ostao nepromijenjen.','Snijeg iz lokvice prelazi u novu pahulju.')],
      11:[
        comparison('U snijegu su otisci između grma i ograde. Čiji zapis podupiru tragovi?',
          ['Između grma i ograde vide se otisci.','Tuda je prošla životinja.'],
          ['Životinja je prošla točno u podne.','Životinja je još kod ograde.','Svaki je otisak druge životinje.']),
        comparison('Jedan trag u snijegu prolazi pokraj bora i klupe. Čiji zapis podupire taj trag?',
          ['Otisci se vide pokraj klupe.','Životinja je prošla pokraj bora.'],
          ['Životinja sada sjedi na klupi.','Trag je nastao točno u osam sati.','Otisci dokazuju da su prošle tri životinje.'])]},
    spring:{
      0:[
        choice('Prošli je tjedan na grani bio zatvoren pup. Danas iz njega viri listić. Što se dogodilo?',
          'Pup se počeo otvarati.','Listić je otpao s grane.','Na mjestu lista sazrio je plod.','Pup je danas zatvoren kao prije.'),
        choice('Na označenoj grančici u utorak je bio pup, a u petak otvoren cvijet. Koja dva crteža idu redom?',
          'Zatvoren pup pa otvoren cvijet.','Otvoren cvijet pa zatvoren pup.','Zreo plod pa zatvoren pup.','Gola grana pa zreo plod.')],
      4:[
        choice('Obje biljke dobivaju jednako vode. Jedna je na toplom i svijetlom, druga na hladnom i tamnom. Što se razlikuje?',
          'Svjetlost i toplina.','Samo količina vode.','Samo svjetlost.','Samo toplina.'),
        choice('Želiš provjeriti utječe li svjetlost na dvije jednake biljke. Kako ćeš ih smjestiti?',
          'Jednu na svjetlo, drugu u tamu, uz jednaku toplinu i vodu.','Obje u tamu, jednu na toplije mjesto.','Obje na svjetlo, jednu zalijevati češće.','Jednu na svjetlo i toplinu, drugu u hladnoću i tamu.')],
      5:[
        choice('Iz jednog si pupa vidjela list, a iz drugoga cvijet. Što ti pokazuju oba primjera?',
          'Iz pupa se može razviti list ili cvijet.','Svaki se pup razvije samo u list.','Svaki se pup razvije samo u cvijet.','Iz svakog pupa odmah nastane plod.'),
        choice('Na dvije su grančice različiti pupovi. Kako ćeš doznati iz kojega će izrasti cvijet?',
          'Označim ih i pratim što se iz svakoga razvije.','Oba upišem kao cvjetove prije otvaranja.','Promatram samo boju kore stabla.','Pogledam list na drugom stablu.')],
      7:[
        comparison('Ptica nosi travke u istu rašlju na stablu. Čiju tvrdnju podupire opažanje?',
          ['Ptica na isto mjesto donosi travke.','Možda ondje gradi gnijezdo.'],
          ['U gnijezdu su već tri jaja.','Mladi su već poletjeli.','Svaku je travku odnijela na drugo stablo.']),
        comparison('Sjenica nosi gusjenice u istu kućicu. Čiju tvrdnju podupire opažanje?',
          ['Sjenica nosi hranu u kućicu.','Možda u kućici hrani mlade.'],
          ['U kućici je točno pet mladih.','Mladi su već odletjeli iz kućice.','Sjenica u kućicu nosi travke.'])],
      10:[
        choice('Nad livadom u proljeće opet lete kukci. Koja će ptica ondje lakše naći svoj obrok?',
          'Lastavica koja lovi kukce.','Čaplja koja traži ribu.','Djetlić koji u kori traži ličinke.','Ptica koja pod snijegom traži sjeme.'),
        choice('Nakon zatopljenja lastavice su se vratile nad ribnjak. Koja im promjena pomaže pri hranjenju?',
          'Iznad vode opet lete mušice.','U daljoj su šumi sazreli češeri.','Ispod vode ima više kamenja.','Na dnu ribnjaka ima više mulja.')],
      11:[
        choice('Za izlet je najavljeno hladno jutro, toplo podne i pljusak. Što pokriva sva tri uvjeta?',
          'Majica, vesta i lagana kabanica.','Samo majica i sunčane naočale.','Kaput bez sloja koji se može skinuti.','Kratke hlače i samo kišobran.'),
        choice('Ujutro nosiš vestu preko majice i kabanicu u torbi. U podne je vruće i suho. Kako se prilagoditi?',
          'Skinuti vestu, a kabanicu ostaviti za kišu.','Preko veste odmah odjenuti kabanicu.','Ostaviti vestu i kabanicu kod prve klupe.','Zakopčati sve slojeve dok je najtoplije.')]},
    summer:{
      0:[
        choice('U hladu je u 8 sati bilo 20 °C, a u 13 sati 30 °C. Za koliko je bilo toplije u 13 sati?',
          'Za 10 °C.','Za 5 °C.','Za 20 °C.','Za 30 °C.'),
        choice('U podne je bilo 29 °C, a predvečer 24 °C. Kako se promijenila temperatura?',
          'Snizila se za 5 °C.','Porasla je za 5 °C.','Snizila se za 3 °C.','Ostala je jednaka.')],
      4:[
        choice('Na vruć dan listovi su klonuli, a zemlja je suha. Što biljci prvo treba nadoknaditi?',
          'Vodu koju gubi.','Još topline.','Još jače sunce.','Još suhe zemlje umjesto vode.'),
        choice('Nakon zalijevanja klonuli listovi opet su se uspravili. Koja je promjena tome mogla pomoći?',
          'Korijen je ponovno dobio vodu.','Zemlja je nakon zalijevanja ostala suha.','Listovi su prestali trebati vodu.','Biljka je nakon zalijevanja dobila više sunca.')],
      5:[
        choice('Na istome je mjestu u lipnju u 20 sati svijetlo, a u prosincu mrak. U kojem mjesecu šetnju u 20 sati završavaš po danu?',
          'U lipnju.','U prosincu.','U oba mjeseca jednako dugo.','Samo u mjesecu u kojem je u 20 sati mrak.'),
        choice('Ljeti Sunce zađe u 21 sat, a zimi u 16 sati. Koja šetnja od 17 do 18 sati završava prije zalaska?',
          'Ljetna šetnja.','Zimska šetnja.','Obje šetnje.','Nijedna šetnja.')],
      7:[
        choice('Pas je na vrućini prešao pod drvo. Ondje je i zdjelica vode. Što mu novo mjesto nudi?',
          'Hlad i vodu.','Više izravnog sunca i vodu.','Hlad, ali nema vode.','Samo topliju podlogu za ležanje.'),
        choice('U dvorištu biraš mjesto za psa tijekom vrućeg dana. Koje ima oba potrebna uvjeta za predah?',
          'Hladovina s dostupnom pitkom vodom.','Osunčana staza sa zdjelom vode.','Sjena pokraj prazne zdjele.','Suha klupa na suncu.')],
      10:[
        comparison('Čiji zapis odgovara mjerenju?',
          ['U hladu su ostale četiri žlice.','Na suncu su nestale tri žlice.'],
          ['Na suncu je ostalo više vode.','U hladu su nestale tri žlice.','Na početku je više vode bilo u hladu.'],
          {kind:'table',caption:'Žlice vode u jednakim tanjurićima',headers:['Mjesto','Na početku','Na kraju'],rows:[['na suncu',5,2],['u hladu',5,4]]}),
        comparison('Čiji zapis opisuje pokus s čašama?',
          ['U hladu je ostalo više vode.','Na suncu je ostala jedna žlica.'],
          ['U hladu je ostala jedna žlica.','Na početku je više vode bilo na suncu.','Na suncu je nestala samo jedna žlica.'],
          {kind:'table',caption:'Žlice vode u jednakim čašama',headers:['Mjesto','Na početku','Na kraju'],rows:[['u hladu',4,2],['na suncu',4,1]]})],
      11:[
        choice('Eni se na vrućem igralištu vrti. Učiteljica stoji blizu. Što Ena treba prvo učiniti?',
          'Prekinuti igru i odmah reći učiteljici.','Pretrčati još jedan krug prije odmora.','Sama otići dalje od učiteljice.','Pričekati kraj igre da kaže kako se osjeća.'),
        choice('Tinu je nakon trčanja na suncu jako slabo. Koji je plan za njega i prijateljicu?',
          'Odmah javiti odrasloj osobi i zajedno otići u hlad.','Nastaviti trčati sporije do kraja igre.','Sakriti se dok slabost ne prođe.','Čekati na sunčanoj stazi bez javljanja odraslima.')]},
    spacetime:{
      0:[
        choice('Kutija je na klupi, a lopta točno ispod sjedala. Što je iznad lopte?',
          'I sjedalo i kutija.','Samo kutija, bez sjedala.','Samo sjedalo, bez kutije.','Ni sjedalo ni kutija.'),
        choice('Olovka je u ladici ispod ploče stola. Knjiga je na stolu. Gdje je olovka u odnosu na knjigu?',
          'Ispod knjige.','Iznad knjige.','Na istoj visini.','U knjizi.')],
      4:[
        choice('Ispred škole su preko kolnika bijele pruge. Za koga je označeno to mjesto?',
          'Za pješake koji prelaze cestu.','Za vozila koja čekaju putnike.','Za bicikle ostavljene uz školu.','Za automobile koji ondje parkiraju.'),
        choice('S odraslom osobom stojiš uz zebru. Zašto ondje i vozači trebaju osobito paziti?',
          'Na tom mjestu pješaci prelaze cestu.','Na tom mjestu sva vozila parkiraju.','Tu promet smiju pratiti samo biciklisti.','Bijele pruge označuju kraj svake ceste.')],
      10:[
        choice('Na skici su redom škola, most i park. Od škole si stigla do mosta. Što slijedi na označenom putu?',
          'Park.','Ponovno škola.','Još jedan most.','Kraj puta kod škole.'),
        choice('Do knjižnice treba proći poštu pa most. Stojiš kod pošte. Po čemu ćeš dalje provjeriti svoj put?',
          'Prepoznat ću most prije knjižnice.','Tražit ću poštu nakon knjižnice.','Očekujem knjižnicu prije mosta.','Most trebam sresti tek na povratku.')]},
    energy:{
      0:[
        choice('Pod nadstrešnicom učiteljica pali baterijsku svjetiljku. Što svjetiljci daje energiju?',
          'Baterija u svjetiljci.','Nadstrešnica iznad nje.','Stol koji osvjetljava.','Sjena na tlu.'),
        choice('Na klupi vidiš lice iz knjige i kad ugasiš svjetiljku. Dan je vedar. Koji izvor i dalje osvjetljava knjigu?',
          'Sunce.','Ugašena svjetiljka.','Papir na klupi.','Korice knjige.')],
      4:[
        choice('Metalna žličica stoji u toplom čaju. Drška izvan čaja postaje toplija. Odakle stiže toplina?',
          'Iz čaja preko metalne žličice.','Iz hladnije drške prema toplijem čaju.','Iz šalice samo kroz zrak iznad čaja.','Iz čaja tek kad dršku uronimo u njega.'),
        choice('Topao dlan drži hladniju metalnu kovanicu. Nakon nekog vremena kovanica je toplija. U kojem je smjeru išla toplina?',
          'Od dlana prema kovanici.','Od kovanice prema toplijem dlanu.','Iz kovanice prema stolu na kojem nije ležala.','Samo unutar dlana, bez prijelaza u kovanicu.')],
      5:[
        choice('Stolna svjetiljka nema bateriju. Kabel joj je izvučen iz utičnice. Zašto ne svijetli?',
          'Kroz kabel ne dobiva struju iz utičnice.','Sjenilo je između žarulje i stola.','Stol je predaleko od žarulje.','U sobi već ima danjeg svjetla.'),
        choice('Utikač je priključen, a svjetiljka gori. Kojim putem struja dolazi do svjetiljke?',
          'Iz utičnice kroz kabel.','Od stola kroz sjenilo.','Od zida kroz zrak do žarulje.','Od osvijetljene knjige prema žarulji.')],
      7:[
        choice('Dvije svjetiljke svijetle u učionici iz koje svi odlaze. Kako uštedjeti najviše energije?',
          'Ugasiti obje.','Ugasiti samo prvu.','Ugasiti samo drugu.','Ostaviti obje upaljene.'),
        choice('Učenici rade kod jedne lampe, a druga svijetli u praznom kutu. Kako uštedjeti i zadržati potrebno svjetlo?',
          'Ugasiti samo lampu u praznom kutu.','Ugasiti samo lampu kod učenika.','Ugasiti obje dok učenici rade.','Premjestiti obje upaljene lampe u prazni kut.')],
      10:[
        choice('U toploj kuhinji vrata hladnjaka ostanu otvorena. Što hladnjak zatim mora ponovno ohladiti?',
          'Topliji zrak koji je ušao.','Zrak koji je ostao u hodniku.','Samo kvaku s vanjske strane.','Cijelu kuhinju izvan hladnjaka.'),
        choice('Mia prije otvaranja hladnjaka odluči što joj treba. Kako joj to pomaže štedjeti energiju?',
          'Vrata su kraće otvorena pa ulazi manje toplog zraka.','Hladnjak uopće više ne mora hladiti hranu.','Otvorena vrata dulje zadržavaju hladan zrak.','Hrana postaje hladnija kad stoji izvan hladnjaka.')],
      11:[
        choice('Što se može ugasiti da noću bude manje nepotrebnog svjetla?',
          'Reflektor na praznom zatvorenom igralištu.','Lampu uz stube dok se njima silazi.','Svjetlo na biciklu koji vozi u mraku.','Radnu lampu uz knjigu koju netko čita.'),
        choice('Uz stazu svjetlo treba ljudima dok prolaze. Koji dogovor smanjuje suvišnu noćnu rasvjetu?',
          'Svjetlo se pali kad netko prolazi.','Svi reflektori svijetle jako cijelu noć.','Svjetlo se gasi baš kad netko dođe.','Rasvjeta se usmjeri u nebo umjesto na stazu.')]},
    health:{
      0:[
        choice('Leo je dugo sjedio i pisao. Koja stanka mijenja i posao i položaj tijela?',
          'Ustati i prošetati hodnikom.','Sjedeći prijeći na slagalicu.','Na istom stolcu otvoriti drugu knjigu.','Sjedeći nastaviti crtati.'),
        choice('Nakon vožnje autobusom Ema ima deset minuta do sata. Kako će u taj dio jutra uključiti kretanje?',
          'Prošetati školskim dvorištem.','Sjedeći čekati uz novu igru.','Prelistati bilježnicu u klupi.','Sjedeći slušati snimku.')],
      4:[
        choice('Mia nakon doručka uči i trči na odmoru. Što njezino tijelo dobiva iz hrane za te aktivnosti?',
          'Energiju.','Zamjenu za noćni san.','Zamjenu za sav dnevni odmor.','Svjež zrak za disanje.'),
        choice('Tin je doručkovao, a nakon škole opet je gladan. Kako je tijelo iskoristilo dio energije iz doručka?',
          'Za jutarnje hodanje i rad.','Čuva svu energiju dok ne dođe večer.','Energiju iz doručka dobiva tek nakon škole.','Sva energija ostaje u tijelu i poslije trčanja.')],
      5:[
        choice('Na tanjuru su riža i grah. Što treba dodati da imaš i povrće, žitaricu i grah?',
          'Mrkvu.','Kruh.','Još riže.','Jaje.'),
        choice('Na tanjuru su jaje i rajčica. Što još nedostaje ako treba obuhvatiti i žitarice?',
          'Kriška kruha.','Krastavac.','Jogurt.','Sir.')],
      7:[
        choice('Kamo možeš staviti suhu kartonsku kutiju kad iz nje izvadiš plastičnu vrećicu?',
          'U spremnik za papir.','U spremnik za staklo.','U spremnik za plastiku.','U spremnik za ostatke hrane.'),
        choice('Tražiš čist, suh papir za spremnik. Koja je ambalaža spremna za njega?',
          'Prazna papirnata vrećica.','Staklenka s papirnatom naljepnicom.','Masna papirnata vrećica s hranom.','Plastična kutija omotana papirom.')],
      10:[
        choice('Nakon rada na zaslonu želiš protegnuti noge i odmoriti pogled od blizine. Što radiš?',
          'Prošećem i pogledam u daljinu.','Sjednem bliže drugom zaslonu.','Ostanem sjediti i čitam sa zaslona.','Hodam gledajući cijelo vrijeme u mobitel.'),
        choice('Ema ustane od računala, ali nastavi gledati u mobitel. Što još može promijeniti da odmori pogled?',
          'Odložiti mobitel i pogledati kroz prozor u daljinu.','Približiti mobitel očima.','Vratiti se čitanju na računalu.','Na mobitelu otvoriti drugu igru.')],
      11:[
        choice('Susjedi noću čuju glasan televizor. Koji postupak uklanja uzrok te buke?',
          'Smanjiti glasnoću televizora.','Smanjiti svjetlinu zaslona.','Promijeniti program uz istu glasnoću.','Otvoriti prozor uz televizor.'),
        choice('Navečer čuješ glazbu s prozora i sirenu vozila hitne pomoći. Koji se zvuk može stišati radi odmora susjeda?',
          'Glazba iz stana.','Sirena vozila koje žuri pomoći.','Oba zvuka, čak i dok vozilo žuri.','Samo upozorenje vozila u prolazu.')]},
    nature:{
      0:[
        choice('U posudi su kamen, žličica i mladica graha. Na kojem bi od njih mogla vidjeti kako raste novi list?',
          'Na mladici graha.','Na kamenu.','Na žličici.','Na sva tri predmeta.'),
        choice('U travi vidiš kamen i mrava koji nosi mrvicu prema mravinjaku. Koji je znak života mrav pokazao?',
          'Sam se kreće i nosi hranu.','Nalazi se na istome tlu kao kamen.','Baca sjenu na travu.','Može se vidjeti povećalom.')],
      4:[
        choice('Dvije su biljke jednako zalivene i tople. Jedna je uza svijetli prozor, druga u tamnom ormaru. Što ispituješ?',
          'Utjecaj svjetlosti.','Utjecaj različitih količina vode.','Utjecaj različite topline.','Razliku između dviju vrsta biljaka.'),
        choice('U pokusu s dvije jednake biljke mijenjaš samo svjetlost. Što treba biti jednako u oba lončića?',
          'Količina vode i toplina.','Samo veličina natpisa.','Osvjetljenje i položaj na suncu.','Boja papira u bilježnici.')],
      5:[
        choice('Kroz jednu pločicu jasno vidiš nacrtani list, a kroz drugu ga ne vidiš. Što si ispitala?',
          'Prozirnost pločica.','Njihovu težinu.','Njihovu hrapavost.','Njihovu savitljivost.'),
        choice('Želiš provjeriti je li folija prozirna. Koji ti postupak daje potreban podatak?',
          'Staviti je ispred crteža i pogledati vidi li se crtež.','Izvagati je na vagi.','Presaviti je i pogledati rub.','Preliti je vodom i protresti.')],
      7:[
        choice('Dvije su zatvorene vrećice jednake na dodir. Iz jedne dopire miris metvice. Kojim ih osjetilom razlikuješ?',
          'Njuhom.','Sluhom.','Dodirom.','Vidom.'),
        choice('Zatvorenih očiju prepoznaješ lavandu, bez kušanja i dodira. Koji ti podatak pomaže?',
          'Njezin miris.','Boja njezinih cvjetova.','Duljina njezine stabljike.','Oblik njezinih listova.')],
      10:[
        comparison('U pokusu je čep ostao na površini, a kamen na dnu. Čiji zapis odgovara pokusu?',
          ['Čep je plutao.','Kamen je potonuo.'],
          ['Oba su predmeta potonula.','Kamen je plutao.','Čep je bio na dnu.']),
        comparison('U posudi je list ostao na površini, a kovanica na dnu. Čiji zapis odgovara opažanju?',
          ['List je ostao na površini.','Kovanica je potonula.'],
          ['Na dnu je završio list.','Kovanica je plutala.','Oba su predmeta ostala na površini.'])],
      11:[
        choice('Na crtežu se korijen nastavlja u stabljiku, a na njoj rastu listovi. Što čine zajedno?',
          'Dijelove jedne biljke.','Tri zasebne cijele biljke.','Samo jedan list.','Samo jedan korijen.'),
        choice('Na crtežu graha vidiš stabljiku i listove. Koji dio treba docrtati pod zemljom?',
          'Korijen.','Cvijet.','Plod.','Još jedan list.')]},
    place:{
      0:[
        choice('Od pošte ulica vodi do trga. Tek na trgu počinje staza za park. Kojim putem ideš iz pošte?',
          'Ulicom do trga pa stazom do parka.','Stazom do trga pa ulicom do parka.','Iz pošte ravno stazom mimo trga.','Ulicom sve do parka, bez staze.'),
        choice('Do knjižnice treba proći most pa trg. Vraćaš se istim putem. Što ćeš proći prvo?',
          'Trg pa most.','Most pa trg.','Dvaput most.','Dvaput trg.')],
      4:[
        choice('Pekar je ispekao kruh, a trgovina ga još čeka. Čiji posao u tom lancu tek treba obaviti?',
          'Vozačev, da dostavi kruh.','Pekarov, da ponovno zamijesi isti kruh.','Mlinarov, da tek samelje zrno za taj kruh.','Poljoprivrednikov, da tek požanje tu pšenicu.'),
        choice('Poljoprivrednica je uzgojila jabuke, a prodavač ih nudi kupcima. Kako su njihovi poslovi povezani?',
          'Prodavač nudi ono što je poljoprivrednica uzgojila.','Prodavač je izlaganjem uzgojio jabuke.','Poljoprivrednica je branjem naplatila svaku jabuku.','Kupci su kupili te jabuke prije nego što su narasle.')],
      5:[
        choice('Na fotografiji most prelazi preko rijeke. Koji par redom navodi prirodno pa izgrađeno obilježje?',
          'Rijeka pa most.','Most pa rijeka.','Most pa cesta.','Rijeka pa brdo.'),
        choice('Učenici trebaju nacrtati prirodno i izgrađeno obilježje jedno uz drugo. Koji prizor odgovara?',
          'Cesta podno brda.','Dvije susjedne kuće.','Rijeka između dva brda.','Klupa uz školsku zgradu.')],
      7:[
        choice('U mjestu još samo baka zna staru pjesmu. Što će pomoći da je djeca mogu pjevati i poslije?',
          'Snimiti pjesmu uz bakin pristanak i naučiti je.','Zapisati samo datum susreta.','Sačuvati samo sliku prostora za pjevanje.','Izmisliti novu pjesmu i zaboraviti staru.'),
        choice('Razred uči stari ples. Što treba sačuvati da ga idući razred može naučiti?',
          'Redoslijed koraka i glazbu uz koju se pleše.','Samo broj gledatelja.','Samo boju zidova dvorane.','Samo datum prvog školskog nastupa.')],
      10:[
        choice('Vjetar nosi praznu vrećicu prema potoku. Kako s odraslom osobom spriječiti da dospije u vodu?',
          'Pokupiti je i odložiti u odgovarajući spremnik.','Premjestiti je na drugu obalu.','Gurnuti je nizvodno.','Ostaviti je uz rub vode.'),
        choice('Nakon čišćenja obale sve je smeće u spremniku. Kako to pomaže životinjama u potoku?',
          'Manje otpada može završiti u njihovoj vodi.','Sav je otpad samo premješten nizvodno.','Životinje sada moraju izaći na obalu po hranu.','Voda će pretvoriti vrećice u hranu za ribe.')]},
  };
  return {cases,sunset,hardCases};
});
