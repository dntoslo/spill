# Hvor er hytta?

Et lite nettleserspill for ansatte i DNT Oslo og Omegn. Du får navnet på og et bilde av en hytte, og skal peke den ut på kartet. Jo nærmere du treffer, jo flere poeng.

## Slik spiller du

1. Trykk «Start spillet».
2. Se på bildet og hyttenavnet, og klikk i kartet der du tror hytta ligger. Du kan flytte markøren.
3. Trykk «Gjett». Da ser du hvor hytta ligger og hvor mange poeng du fikk.
4. Etter fem hytter får du en sum. Den beste summen din lagres i nettleseren, og du kan kopiere resultatet og dele det i Teams.

## Teste spillet på egen maskin

Last ned mappa og dobbeltklikk på `index.html`. Spillet åpnes i nettleseren. Du trenger internett, siden kart og bilder hentes fra nettet.

## Filene

| Fil | Hva den gjør |
|---|---|
| `index.html` | Selve siden med tekst og knapper |
| `style.css` | Farger og utseende |
| `spill.js` | Spillereglene. Øverst står innstillinger som antall runder og poengberegning |
| `data/hytter.js` | Lista over hyttene, én linje per hytte |

Vil du endre noe, kan du åpne fila i en teksteditor, lagre og laste siden på nytt i nettleseren.

## Hyttene

Spillet har med hytter som DNT Oslo og Omegn står som eier av på ut.no, og som er betjente, selvbetjente eller ubetjente. Dette er tatt ut:

- nødbuer, stengte hytter og serveringssteder
- egne selvbetjent-oppføringer for en betjent hytte som allerede er med, for eksempel «Gjendebu Selvbetjent»
- oppføringer som ikke er en hytte, for eksempel gapahuken på Sæteren Gård

### Oppdatere hyttelista

Lista i `data/hytter.js` er hentet fra ut.no og oppdaterer seg ikke selv. Får en hytte nytt bilde på ut.no, kan det gamle bildet forsvinne fra spillet. Da må lista hentes på nytt. Be Claude om å oppdatere `data/hytter.js` med Ut.no-connectoren, etter reglene over.

## Kilder og kreditering

- Hytteinformasjon og bilder er hentet fra [ut.no](https://ut.no). Bildene ligger hos ut.no og vises med fotografens navn.
- Kartet er Kartverkets topografiske norgeskart.
- Kartvisningen bruker [Leaflet](https://leafletjs.com).

## Publisering

Spillet publiseres med GitHub Pages.
