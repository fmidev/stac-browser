# Tuulituhohaukka

## [Aineistokatalogi](https://s3.eu-west-1.amazonaws.com/directory.spatineo.com/tmp/tuulituhohaukka-stac/catalog/root2.json)
Tällä hetkellä (29.9.2021) sovelluksessa on käytössä seuraavia aineistoja:
- Tuulituhoriski (2.11.2020 - )
- MML 2m Maastomalli (2020)
- Landsat vuosittaiset indeksit (1984-2011)
- Landsat pintaheijastus vuosikuvat (1985, 1990 ja 1995)
- SMK Latvuskorkeusmalli
- Monilähdeinventoinnin Metsävarateema (2005-2019)
- Myrskytuhoriskikartta
- Sentinel-1 päivittäiset mosaiikit (3.1.2017 - )
- Sentinel-1 dekadi mosaiikit (1.10.2014 - )
- Sentinel-1 osakuvat (4.10.2014 - )
- Sentinel-2 Global mosaic (dekadi) (1.2.2017 - )
- Sentinel-2 Global mosaic (vuosi) (2018 - )
- Sentinel-2 indeksimosaiikit (1.4.2016 - )

## [Karttasovellus](https://tuulituhohaukka.spatineo-devops.com)
### Yleistä
Tässä kuvataan tavoiteltu lopputulos. Kuvaus sovelluksen MVP:stä löytyy dokumentin lopusta. Tällä hetkellä sovelluksesta on toteutettu MVP.

### Kalenterinäkymä

Sivupaneelin kalenterinäkymä sisältää aikavalitsimen, tuholistan ja indeksikartan. Kalenterinäkymästä voi tarkastella tuulituhoja kolmella eri tarkkuustasolla:

1. kuukausittain
<img width="309" alt="image" src="https://user-images.githubusercontent.com/14890301/135270304-b89dafdf-2733-458d-8b7a-ccdd1fbba4a5.png">

2. päivittäin
<img width="309" alt="image" src="https://user-images.githubusercontent.com/14890301/135270487-3cfdc49d-93ad-42dd-9ac6-d1d3b5c10a28.png">

3. tuhoalueittain
- Vuosinäkymästä voi tarkastella, minä kuukausina on arvion mukaan tapahtunut merkittävimpiä tuulituhoja: tolpan korkeus kuvaa tuulituhojen arvioitua laajuutta
- Kuukausinäkymässä korostetaan eri värillä ne päivät, joina analyysin mukaan on merkittäviä tuhoja
- Valittuaan tarkasteluajan, tuulituhoja voi etsiä ja selata karttanäkymien avulla, mutta myös maakuntakohtaisesta tuholistasta, johon on nostettu merkittävimmät tuhot. Tästä valikosta käyttäjä voi valita kiinnostavan tuulituhoalueen näytettäväksi kartalla 

Valinnan tehtyään kaikki karttanäkymät tarkentavat automaattisesti esittämään kyseisen alueen tietoja. Aineistojen päivämäärät esitetään karttanäkymien alalaidassa

### Karttanäkymät

Karttakanvaasi sisältää käyttäjän lisäämät ja visualisoimat karttanäkymät eri aineistoilla.
<img width="548" alt="image" src="https://user-images.githubusercontent.com/14890301/135270945-8173b5f3-589e-49e3-835a-ba1754e13e38.png"> 

Käyttäjä voi valita näkyviin eri aineistoja tarpeensa mukaan:
- Karttanäkymiä lisätään karttakanvaasin lisäysnapista
<img width="80" alt="image" src="https://user-images.githubusercontent.com/14890301/135270602-d434b922-b3ac-4728-9f0c-1979924cb82c.png">

- Karttanäkymiä voi vähentää poistettavan karttanäkymän poistonapista
<img width="80" alt="image" src="https://user-images.githubusercontent.com/14890301/135271004-a2509dd0-5fb7-42be-8cde-748a3765d424.png">

- Kussakin karttanäkymässä näytetään yhtä aineistoa kerrallaan selkeyden vuoksi
- Karttanäkymiä voi lisätä kanvaasille niin monta kuin haluaa, jolloin saman aineiston tarkastelu eri visualisointivalinnoilla on mahdollista
- Karttaikkunaan valitaan haluttu aineisto alasvetovalikosta 
<img width="259" alt="image" src="https://user-images.githubusercontent.com/14890301/135271908-3219b044-6e43-4414-9615-83dc1af4b3c4.png">

### Visualisointi

Karttaikkunat sisältävät kanavavalitsin-työkalun, jolla on mahdollista valita eri kanavien väriyhdistelmiä.
- Käyttäjä voi määrittää eri kanavien väriyhdistelmiä asettamalla punaiselle, vihreälle ja siniselle eri kanavat
- Valinta tapahtuu valitsemalla haluttu kanava punaisen, vihreän tai sinisen värin kohdalle (RGB)
- Jos aineistossa on vain yksi visualisoitava kanava, sovellus valitsee sen automaattisesti
- Kanavavalitsin on aineisto- ja karttanäkymäkohtainen
- Kanavavalitsin avautuu Visualisointi -pudotusvalikosta
<img width="259" alt="image" src="https://user-images.githubusercontent.com/14890301/135272842-87098a67-3804-4cf8-a71f-38d006742dbc.png">

### Jakaminen

Voit halutessasi jakaa näkymäsi linkillä jolloin valittu päivä, valitut aineistot sekä visualisointiasetukset säilyvät.

<img width="294" alt="image" src="https://user-images.githubusercontent.com/14890301/135275705-4f6ec857-9180-47b8-9220-a541da390b70.png">

### Aikasarja

Aikasarja-työkalulla käyttäjä voi tarkastella karttanäkymässä kunkin tuotteen pikselin/alueen arvojen aikasarjaa 
- Aikasarja-ikkuna avautuu isommaksi ja esittää tähtäimen osoittaman pikselin/alueen mitatut arvot siten että x-akselilla on aika ja y-akselilla esitetään pikselin arvo
- Käyttäjä voi tarkastella tuotteen yksittäisen tai useamman kanavan arvoa
- Huomatessaan käyristä jonkin mielenkiintoisen piirteen, käyttäjä voi hiiren painauksella valita kyseisen ajankohdan vertailuajankohdaksi. Tämän jälkeen linssityökalu näyttää tämän vertailuajankohdan mukaista aineistoa

### Aikaerottelu

Sovelluksessa on valittuna erikseen tarkasteluaika ja vertailuaika: 
1. Tarkasteluaika valitaan ensisijaisesti kalenterista:
- Vertailuaika voidaan valita automaattisesti tarkasteluaikaa edeltäväksi kuva-aineistoksi, kun päivämäärä on valittu kalenterinäkymästä
- Kalenterinäkymästä erottaa helposti ne päivät, jolloin tuulituhon riski on suuri
- Käyttäjän valitessa tarkasteluaika kalenterinäkymästä, kaikki karttanäkymät päivittyvät esittämään kyseisen päivän, tai tarkasteluaikaa seuraavan ajankohdan, dataa
- Valittu ajanhetki tulee näkyviin myös aikajanalle
2. Toinen tapa valita aineistojen tarkasteluaika on aikasarjanäkymän kautta:
- Käyttäjä voi huomata mielenkiintoisen ajanhetken
- Käyttäjä voi klikata aikasarjalta ja valita siten uusi vertailuaika. Tämä päivittää karttanäkymät esittämään vertailuajankohdan tai sitä lähinnä seuraavan ajankohdan dataa

Linssi-työkalun avulla käyttäjä voi tarkastella kiinnostavasta kohteesta kahta eri kuvaa eri ajankohdilta
- Linssi kulkee käyttäjän hiiren mukana tai vaihtoehtoisesti karttanäkymän keskipisteessä
- Linssi “paljastaa” alta vertailuajankohdan aineiston
- Linssin avulla käyttäjä voi helposti vertailla esim. kahden peräkkäisen kuvausajankohdan Sentinel-2 kuvia nähdäkseen, onko merkittävää muutosta tapahtunut kuvien välillä (esim. myrskytuhoja)
- Linssin näyttämän aineiston vertailuajankohta on oletuksena valittua tuulituhohetkeä edeltävä ajankohta, mutta ajankohtaa voi myös muuttaa aikajanan avulla

### Sovelluksen käyttö ###
1. Lisää haluamasi aineistot karttanäkymään valitsemalla aineisto aineistolistasta ja asettamalla visualisointiasetukset.
- Voit lisätä ja poistaa karttaikkunoita haluamasi määrän. 

2. Valitse haluamasi tarkastelupäivä kalenterinäkymästä:
- Valitse kuukausi vuosinäkymästä
-> Kalenterinäkymä päivittyy
- Valitse päivä kuukausinäkymästä
-> Tuholista päivittyy
-> Karttojen aineistot päivittyvät 
- Valitse tuhoalue tuholistasta
-> Kartat kohdentuvat alueeseen
-> Indeksikartta näyttää alueen sijainnin

## MVP
Tällä hetkellä sovelluksesta on toteutettu MVP (minimum viable product). 
MVP:ssä on toteutettu seuraavat ominaisuudet:
- Kalenterinäkymä
- Karttanäkymät + visualisointi
- Kanavavalitsin

Sovelluksessa ei voi tarkastella rasterimuotoisia tuhoalueita tai tuholistaa. 

Sovelluksen käyttö alkaa kalenterinäkymästä:
1. Valitaan kuukausi vuosinäkymästä
-> Kalenterinäkymä päivittyy
2. Valitaan päivä kuukausinäkymästä
-> Tuholista päivittyy
-> Karttojen aineistot päivittyvät
3. Tarkastellaan ja vertaillaan eri aineistojen karttanäkymiä.
