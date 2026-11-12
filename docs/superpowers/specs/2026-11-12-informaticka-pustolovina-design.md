# Informatička pustolovina — dizajn aplikacije

## Namjera

Napraviti treću javno dostupnu aplikaciju za učenicu drugog razreda osnovne škole, usklađenu s cjelogodišnjim sadržajem radne bilježnice *e-SVIJET 2* i službenim ishodima hrvatskog kurikuluma informatike. Aplikacija treba služiti za samostalno uvježbavanje i provjeru razumijevanja, a ne za reprodukciju ili zamjenu radne bilježnice.

Sav tekst, scenariji, pitanja, ilustracije i interakcije bit će originalni. Ne kopiraju se stranice, zadatci, ilustracije ni formulacije iz knjige.

## Ciljevi

- Pokriti cijelu školsku godinu i sve četiri kurikularne domene: digitalna tehnologija, računalno razmišljanje, digitalna pismenost i e-Društvo.
- Zadržati jednostavnost, čitljivost i sigurnu povratnu informaciju prethodnih aplikacija.
- Učiti kroz radnje primjerene informatici: spajanje, razvrstavanje, slaganje redoslijeda, prepoznavanje, navigaciju i jednostavne simulacije.
- Omogućiti tri razine težine unutar svake cjeline.
- Nakon svakog odgovora odmah prikazati je li odgovor točan ili nije, bez gumba za pomoć i bez otkrivanja rješenja.
- Čuvati napredak lokalno u pregledniku, bez računa, prijave ili prikupljanja osobnih podataka.
- Raditi na računalu, tabletu i mobitelu, uključujući Chrome na drugom računalu.

## Što aplikacija neće raditi

- Neće kopirati sadržaj knjige niti nositi naziv koji bi sugerirao službenu aplikaciju Školske knjige.
- Neće koristiti vanjske servise, oglase, analitiku, chat ili poveznice koje dijete izvode iz aplikacije.
- Neće tražiti ime učenice, e-mail, fotografiju ili drugi osobni podatak.
- Neće davati slobodan pristup rješenjima, pomoći ili roditeljskim postavkama.
- Neće ocjenjivati školskom ocjenom od 1 do 5.
- Neće pokušati zamijeniti praktičan rad u pravom programu za pisanje ili u Scratchu; simulacije služe pripremi i provjeri razumijevanja.

## Razmotreni pristupi

### 1. Klasični kviz

Isti tip višestrukog izbora za sve teme. Najbrži je za izradu i najjednostavniji za održavanje, ali informatiku pretvara u puko pamćenje pojmova i slabo vježba redoslijed radnji.

### 2. Interaktivna informatička pustolovina — odabrano

Jedinstvena aplikacija s više vrsta interakcija. Zadržava poznatu strukturu prethodnih aplikacija, ali svaka tema koristi zadatke koji odgovaraju sadržaju: razvrstavanje, spajanje, slaganje koraka, mini-simulacije mapa, preglednika i blokova naredbi. Odabrano je jer bolje provjerava razumijevanje i praktično razmišljanje.

### 3. Potpuna simulacija računala

Virtualna radna površina s lažnim prozorima, datotekama i programima. Bila bi vrlo dojmljiva, ali previše složena za cijelo gradivo, te bi povećala mogućnost zabune između simulacije i stvarnog operativnog sustava.

## Nastavne cjeline

Aplikacija će imati osam svjetova. Svaki svijet sadrži originalnu banku zadataka na tri razine.

1. **Moje računalo** — dijelovi računala, ulazni i izlazni uređaji, pažljivo i zdravo korištenje.
2. **Programi i dokumenti** — uloga programa i operativnog sustava, odabir programa prema zadatku, mape, datoteke, spremanje i otvaranje.
3. **Internet i pretraživanje** — internet kao izvor sadržaja i usluga, preglednik, tražilica, dobra ključna riječ, obrazovni portali.
4. **Sigurna mreža** — osobni podatci, lozinke, nepoznate osobe, neprimjeren sadržaj, traženje pomoći odrasle osobe, odgovorno ponašanje.
5. **Digitalni tragovi** — što ostaje nakon objave, digitalni ugled, dopuštenje za fotografije, dobri i loši tragovi.
6. **Mislim kao programer** — niz uputa, redoslijed koraka, otkrivanje i ispravljanje pogreške, ponavljanje radnje.
7. **Scratch radionica** — lik, pozornica, blokovi kretanja i izgleda, pokretanje programa, jednostavan redoslijed i ponavljanje; sve u originalnoj pojednostavljenoj simulaciji bez kopiranja Scratch sučelja.
8. **Stvaram i surađujem** — tekst i slika u digitalnom radu, odabir uređaja i programa, spremanje rada, mrežna učionica, videosastanak i zanimanja koja koriste tehnologiju.

## Razine težine

- **Lagani zadaci:** jedno prepoznavanje ili jedan korak; tri jasna odgovora; snažna vizualna podrška.
- **Teži zadaci:** povezivanje dvije informacije, razvrstavanje više elemenata ili slaganje tri do četiri koraka.
- **Teški zadaci:** situacijski problem, pronalazak pogreške, odabir najboljeg postupka ili slaganje duljeg niza naredbi.

Težina ne uvodi sadržaj iz viših razreda, nego povećava broj informacija koje učenica treba povezati.

## Vrste zadataka

1. **Odaberi odgovor** — jedan od tri ili četiri odgovora.
2. **Spoji parove** — pojam i njegova namjena, uređaj i radnja, program i zadatak.
3. **Razvrstaj** — sigurno/nesigurno, mapa/datoteka, ulaz/izlaz, osobni/javni podatak.
4. **Složi redoslijed** — koraci spremanja dokumenta, pretraživanja ili rješavanja problema.
5. **Pronađi pogrešku** — jedan pogrešan korak ili blok u nizu.
6. **Mini-simulacija** — odabir odgovarajuće mape, naredbe preglednika ili jednostavnog bloka za kretanje lika.

Na dodirnim uređajima svaki zadatak mora biti rješiv dodirom. Povlačenje će imati alternativu dodirom: učenica prvo odabere karticu, zatim odredi odredište.

## Tijek aplikacije

1. Početni ekran prikazuje naslov **Informatička pustolovina**, kratku poruku i tri razine težine.
2. Nakon odabira razine prikazuje se osam svjetova i opcija **Miješana vježba**.
3. Svijet pokreće rundu od pet zadataka; miješana vježba bira po jedan zadatak iz više svjetova.
4. Učenica rješava jedan zadatak po ekranu. Gumb **Provjeri** postaje aktivan tek kada je odgovor potpun.
5. Točan odgovor prikazuje kratku pozitivnu potvrdu i gumb **Sljedeći zadatak**.
6. Netočan odgovor prikazuje neutralnu poruku **Pogledaj još jednom** i gumb **Pokušaj ponovno**. Ne prikazuje točno rješenje.
7. Završni ekran prikazuje broj zadataka riješenih iz prvog pokušaja i broj zadataka riješenih nakon ponovnog pokušaja.
8. Nedovršena runda sprema se u `localStorage` i nudi nastavak pri sljedećem otvaranju.

## Vizualni smjer

- Isti dizajnerski sustav kao **Mislim i otkrivam**: velike kartice, zaobljeni rubovi, vrlo čitljiv kontrast, veliki dodirni ciljevi i jednostavne animacije.
- Nova paleta: tamnoplava za tekst, tirkizna i svijetloplava za tehnologiju, topla žuta za naglaske, zelena za točan odgovor i narančasta za ponovni pokušaj.
- Novi originalni vodič: mali prijateljski robot **Bitko**. Robot ne daje rješenja; samo potvrđuje napredak i prikazuje kratke neutralne poruke.
- Ilustracije su jednostavne, bez logotipa proizvođača, bez izgleda zaštićenih stranica knjige i bez fotografija djece.
- Animacije poštuju `prefers-reduced-motion`.

## Povratna informacija i bodovanje

- Nema negativnih bodova, vremenskog ograničenja ni zvuka koji kažnjava pogrešku.
- Netočan pokušaj ne preskače zadatak i ne otkriva rješenje.
- Rezultat razlikuje samo `iz prvog pokušaja` i `uz ponovni pokušaj`.
- Nakon završetka učenica može ponoviti isti svijet s novim zadatcima ili odabrati drugi svijet.

## Količina sadržaja

- Najmanje 12 originalnih predložaka zadataka po svijetu i razini: 8 svjetova × 3 razine × 12 = najmanje 288 predložaka.
- Predlošci s varijabilnim imenima, slikama, redoslijedom i izborima stvaraju mnogo različitih rundi.
- Svaka kombinacija odgovora mora imati programski definiranu provjeru, bez ručnog uspoređivanja slobodnog teksta.

## Tehnička izvedba

- Samostalna statička aplikacija u jednoj HTML datoteci s ugrađenim CSS-om, JavaScriptom i SVG ilustracijama.
- Bez vanjskih fontova, biblioteka, API-ja ili mrežnih zahtjeva nakon učitavanja.
- Odvojeni čisti modul za generiranje zadataka i provjeru odgovora kako bi se mogao automatski testirati.
- Zaštita od ponavljanja istog zadatka u uzastopnim rundama kada banka to dopušta.
- Semantički HTML, podrška tipkovnici, vidljiv fokus, `aria-live` za povratnu informaciju i minimalna veličina dodirne mete 44 px.
- Nova javna putanja: `/informaticka-pustolovina/index.html`.
- Početna stranica postojećeg Render sajta dobiva treću karticu, bez promjene postojećih dviju aplikacija.

## Provjera kvalitete

- Testovi generatora: svaki predložak daje valjan zadatak i barem jedan točan odgovor.
- Testovi provjere: točni i netočni odgovori za sve tipove zadataka.
- Testovi toka: odabir razine, teme, rješavanje, ponovni pokušaj, završetak i nastavak spremljene runde.
- Testiranje na desktop i mobilnoj širini, tipkovnicom i dodirom.
- Provjera kontrasta, čitljivosti hrvatskih dijakritičkih znakova i rada bez interneta nakon prvog učitavanja.
- Nakon objave: HTTP 200 za početnu stranicu i sve tri aplikacije te usporedba objavljenih datoteka s lokalnim verzijama.

## Odluke prepuštene izvođaču

- Točan izgled Bitka i pojedinačne SVG ikone.
- Precizna raspodjela tipova zadataka po svijetu, pod uvjetom da svaka cjelina ima najmanje tri različita tipa interakcije.
- Interna struktura JavaScript modula i nazivi funkcija.
- Konačne formulacije kratkih pozitivnih poruka, uz uvjet da ostanu neutralne i primjerene sedmogodišnjaku.

