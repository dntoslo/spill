// Hvor er hytta?
// Hyttelista ligger i data/hytter.js og er tilgjengelig her som HYTTER.

// ---------- Innstillinger som er lette å endre ----------

const ANTALL_RUNDER = 5;        // hytter per spill
const MAKS_POENG = 1000;        // poeng for et treff midt i blinken
const FULL_POTT_KM = 1;         // innenfor denne avstanden får du full pott
const POENG_SKALA_KM = 75;      // jo høyere tall, jo snillere poengberegning
const MIN_AVSTAND_KM = 2;       // hytter i samme spill ligger minst så langt fra hverandre
const MAKS_ZOOM_GJETTING = 10;  // kartet viser hyttenavn når man zoomer lenger inn enn dette
const MAKS_ZOOM_FASIT = 15;     // etter at svaret vises, kan man zoome helt inn
const REKORD_NOKKEL = "hvor-er-hytta-rekord";

// ---------- Små hjelpefunksjoner ----------

const el = (id) => document.getElementById(id);
const tall = (n) => n.toLocaleString("nb-NO");

// Avstand i kilometer mellom to punkter på jordkloden (haversine-formelen).
function avstandKm(a, b) {
  const rad = (grader) => (grader * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function poengFor(km) {
  if (km <= FULL_POTT_KM) return MAKS_POENG;
  return Math.round(MAKS_POENG * Math.exp(-(km - FULL_POTT_KM) / POENG_SKALA_KM));
}

function avstandTekst(km) {
  if (km < 1) return `${Math.round(km * 1000)} meter unna`;
  if (km < 10) return `${km.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} km unna`;
  return `${tall(Math.round(km))} km unna`;
}

function stokk(liste) {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopi[i], kopi[j]] = [kopi[j], kopi[i]];
  }
  return kopi;
}

// Trekker hytter til et spill. Hytter som ligger på samme tun, havner ikke i samme spill.
function trekkHytter() {
  const valgt = [];
  for (const hytte of stokk(HYTTER)) {
    if (valgt.every((v) => avstandKm(v, hytte) >= MIN_AVSTAND_KM)) valgt.push(hytte);
    if (valgt.length === ANTALL_RUNDER) break;
  }
  return valgt;
}

// Rekorden lagres i nettleseren. Går ikke det, virker spillet likevel.
function hentRekord() {
  try {
    return Number(localStorage.getItem(REKORD_NOKKEL)) || 0;
  } catch {
    return 0;
  }
}
function lagreRekord(poeng) {
  try {
    localStorage.setItem(REKORD_NOKKEL, String(poeng));
  } catch {
    // Ingen lagring tilgjengelig. Da husker vi bare ikke rekorden til neste gang.
  }
}

// ---------- Kartet ----------

const alleHytter = L.latLngBounds(HYTTER.map((h) => [h.lat, h.lng]));

const kart = L.map("kart", {
  minZoom: 5,
  maxZoom: MAKS_ZOOM_GJETTING,
  maxBounds: alleHytter.pad(1.5),
  zoomSnap: 0.5,
});

L.tileLayer("https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.kartverket.no/" target="_blank" rel="noopener">Kartverket</a>',
}).addTo(kart);

// Går tilbake til oversikten over alle hyttene. Rekkefølgen er viktig: først flyttes
// kartet uten animasjon, så låses zoomen. Ellers blir kartet stående innzoomet der forrige hytte lå.
function visHeleKartet() {
  kart.fitBounds(alleHytter.pad(0.08), { animate: false });
  kart.setMaxZoom(MAKS_ZOOM_GJETTING);
}
visHeleKartet();

function nal(type) {
  return L.divIcon({
    className: "",
    html: `<div class="nal nal-${type}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 31],
    tooltipAnchor: [0, -30],
  });
}

// ---------- Spillets tilstand ----------

let hytter = [];        // hyttene i dette spillet
let runde = 0;          // 0 er første runde
let resultater = [];    // ett resultat per ferdig runde
let gjettMarkor = null; // markøren spilleren setter
let fasitLag = null;    // fasitmarkør og linje, vises etter gjett
let venterPaGjett = false;

function sumPoeng() {
  return resultater.reduce((sum, r) => sum + r.poeng, 0);
}

function oppdaterStatus() {
  el("runde").textContent = `Runde ${Math.min(runde + 1, ANTALL_RUNDER)} av ${ANTALL_RUNDER}`;
  el("sum").textContent = `${tall(sumPoeng())} poeng`;
}

function ryddKart() {
  if (gjettMarkor) kart.removeLayer(gjettMarkor);
  if (fasitLag) kart.removeLayer(fasitLag);
  gjettMarkor = null;
  fasitLag = null;
}

function startSpill() {
  hytter = trekkHytter();
  runde = 0;
  resultater = [];
  el("start").hidden = true;
  el("slutt").hidden = true;
  startRunde();
}

function startRunde() {
  const hytte = hytter[runde];
  venterPaGjett = true;
  ryddKart();
  visHeleKartet();
  oppdaterStatus();

  el("hyttenavn").textContent = hytte.navn;
  el("fotograf").textContent = `Foto: ${hytte.bilde.fotograf}`;
  el("bilde-mangler").hidden = true;
  const bilde = el("bilde");
  bilde.hidden = false;
  bilde.alt = `Bilde av ${hytte.navn}`;
  bilde.src = hytte.bilde.url;

  el("hjelp").hidden = false;
  el("svar").hidden = true;
  el("gjett").hidden = false;
  el("gjett").disabled = true;
  el("neste").hidden = true;
}

// Klikk i kartet setter markøren, eller flytter den hvis den allerede står der.
kart.on("click", (hendelse) => {
  if (!venterPaGjett) return;
  if (gjettMarkor) {
    gjettMarkor.setLatLng(hendelse.latlng);
  } else {
    gjettMarkor = L.marker(hendelse.latlng, { icon: nal("gjett"), draggable: true, keyboard: false }).addTo(kart);
  }
  el("gjett").disabled = false;
});

function gjett() {
  if (!venterPaGjett || !gjettMarkor) return;
  venterPaGjett = false;

  const hytte = hytter[runde];
  const gjettet = gjettMarkor.getLatLng();
  const km = avstandKm(gjettet, hytte);
  const poeng = poengFor(km);
  resultater.push({ hytte, km, poeng });

  // Vis fasiten i kartet.
  gjettMarkor.dragging.disable();
  const fasit = L.marker([hytte.lat, hytte.lng], { icon: nal("fasit"), keyboard: false })
    .bindTooltip(hytte.navn, { permanent: true, direction: "top" });
  const linje = L.polyline([gjettet, [hytte.lat, hytte.lng]], { color: "#1f2a24", weight: 2, dashArray: "6 6" });
  fasitLag = L.layerGroup([linje, fasit]).addTo(kart);
  kart.setMaxZoom(MAKS_ZOOM_FASIT);
  kart.fitBounds(L.latLngBounds([gjettet, [hytte.lat, hytte.lng]]).pad(0.4), { maxZoom: 12 });

  // Vis fasiten i teksten.
  el("svar-poeng").textContent = `${tall(poeng)} poeng`;
  el("svar-avstand").textContent = avstandTekst(km);
  const fakta = [`${hytte.betjening} hytte`, hytte.omrade, `${hytte.kommune} kommune`];
  if (hytte.moh != null) fakta.push(`${tall(hytte.moh)} moh.`);
  el("svar-fakta").textContent = fakta.join(" · ");
  el("svar-lenke").href = hytte.url;

  el("hjelp").hidden = true;
  el("svar").hidden = false;
  el("gjett").hidden = true;
  el("neste").hidden = false;
  el("neste").textContent = runde + 1 < ANTALL_RUNDER ? "Neste hytte" : "Se resultatet";
  el("sum").textContent = `${tall(sumPoeng())} poeng`;
  el("neste").focus();
}

function neste() {
  runde += 1;
  if (runde < hytter.length) {
    startRunde();
  } else {
    visSlutt();
  }
}

// ---------- Sluttskjerm, rekord og deling ----------

function visSlutt() {
  const sum = sumPoeng();
  const forrigeRekord = hentRekord();
  el("slutt-sum").textContent = `${tall(sum)} poeng`;
  el("slutt-maks").textContent = `av ${tall(ANTALL_RUNDER * MAKS_POENG)}`;

  if (sum > forrigeRekord) {
    lagreRekord(sum);
    el("slutt-rekord").textContent = forrigeRekord > 0
      ? `Ny rekord! Den forrige var ${tall(forrigeRekord)} poeng.`
      : "Dette er rekorden din så langt.";
  } else {
    el("slutt-rekord").textContent = `Rekorden din er ${tall(forrigeRekord)} poeng.`;
  }

  const liste = el("slutt-liste");
  liste.textContent = "";
  for (const r of resultater) {
    const rad = document.createElement("li");
    for (const [klasse, tekst] of [["navn", r.hytte.navn], ["km", avstandTekst(r.km)], ["poeng", `${tall(r.poeng)} p`]]) {
      const celle = document.createElement("span");
      celle.className = klasse;
      celle.textContent = tekst;
      rad.append(celle);
    }
    liste.append(rad);
  }

  el("kopiert").textContent = "";
  el("slutt").hidden = false;
  el("igjen").focus();
}

function resultatTekst() {
  const ruter = resultater
    .map((r) => (r.poeng >= 900 ? "🟩" : r.poeng >= 600 ? "🟨" : r.poeng >= 300 ? "🟧" : "🟥"))
    .join("");
  const linjer = [
    `Hvor er hytta? ${tall(sumPoeng())} av ${tall(ANTALL_RUNDER * MAKS_POENG)} poeng`,
    ruter,
  ];
  if (location.protocol.startsWith("http")) linjer.push(location.origin + location.pathname);
  return linjer.join("\n");
}

async function kopierResultat() {
  const tekst = resultatTekst();
  try {
    await navigator.clipboard.writeText(tekst);
    el("kopiert").textContent = "Kopiert! Lim det inn i Teams.";
  } catch {
    // Noen nettlesere slipper oss ikke til utklippstavla. Da viser vi teksten så den kan kopieres for hånd.
    el("kopiert").textContent = tekst;
  }
}

// ---------- Oppstart ----------

el("gjett").addEventListener("click", gjett);
el("neste").addEventListener("click", neste);
el("start-knapp").addEventListener("click", startSpill);
el("igjen").addEventListener("click", startSpill);
el("kopier").addEventListener("click", kopierResultat);

el("bilde").addEventListener("error", () => {
  el("bilde").hidden = true;
  el("bilde-mangler").hidden = false;
});

el("start-runder").textContent = ANTALL_RUNDER;
el("start-maks").textContent = tall(MAKS_POENG);
const rekord = hentRekord();
if (rekord > 0) {
  el("start-rekord").textContent = `Rekorden din er ${tall(rekord)} poeng.`;
  el("start-rekord").hidden = false;
}
oppdaterStatus();
