'use strict';

/* =====================================================================
   PODEŠAVANJA – slobodno menjaj
   ===================================================================== */
const CONFIG = {
  nazivSalona: 'MIVA nails',
  pocetak: '08:00',     // prvi termin
  kraj: '20:00',        // do kada mora da se završi poslednji termin
  korak: 30,            // razmak između termina u minutima (15 ili 30)
  neradniDani: [],      // 0 = nedelja, 1 = ponedeljak ... 6 = subota. Npr. [0] = nedeljom ne radiš
  valuta: 'din',
};

/* =====================================================================
   USLUGE – trajanje je u minutima, cena je broj (ili null ako ne želiš
   da se prikazuje). Dodaj / obriši / promeni po želji.
   Svaka usluga mora imati jedinstven "id".
   ===================================================================== */
const USLUGE = [
  {
    kat: 'Nokti', stavke: [
      { id: 'n-gellak',      naziv: 'Gel lak',                                 trajanje: 60,  cena: 1800 },
      { id: 'n-geltehnika',  naziv: 'Gel tehnika',                             trajanje: 120, cena: 2200 },
      { id: 'n-izliv-duza',  naziv: 'Izlivanje – duža dužina',                 trajanje: 150, cena: 2800 },
      { id: 'n-izliv-kraca', naziv: 'Izlivanje – kraća dužina',                trajanje: 120, cena: 2500 },
      { id: 'n-skidanje',    naziv: 'Skidanje materijala',                     trajanje: 30,  cena: 500 },
      { id: 'n-skid-obrada', naziv: 'Skidanje materijala + obrada zanoktica',  trajanje: 45,  cena: 800 },
      { id: 'n-french',      naziv: 'French (doplata)',                        trajanje: 15,  cena: 200 },
    ],
  },
  {
    kat: 'Depilacija šećernom pastom', stavke: [
      { id: 'd-noge-cele',  naziv: 'Cele noge',    trajanje: 45, cena: 1100 },
      { id: 'd-noge-pola',  naziv: 'Pola noge',    trajanje: 30, cena: 800 },
      { id: 'd-ruke-pola',  naziv: 'Pola ruke',    trajanje: 20, cena: 600 },
      { id: 'd-ruke',       naziv: 'Ruke',         trajanje: 30, cena: 1000 },
      { id: 'd-intima',     naziv: 'Intima',       trajanje: 30, cena: 1000 },
      { id: 'd-stomak',     naziv: 'Stomak',       trajanje: 15, cena: 500 },
      { id: 'd-gluteus',    naziv: 'Gluteus',      trajanje: 20, cena: 500 },
      { id: 'd-ledja',      naziv: 'Leđa',         trajanje: 30, cena: 600 },
      { id: 'd-pazuh',      naziv: 'Pazuh',        trajanje: 15, cena: 500 },
      { id: 'd-nausnice',   naziv: 'Nausnice',     trajanje: 10, cena: 400 },
      { id: 'd-delovi-lica',naziv: 'Delovi lica',  trajanje: 10, cena: 400 },
      { id: 'd-lice',       naziv: 'Lice',         trajanje: 20, cena: 600 },
    ],
  },
  {
    kat: 'Šminkanje', stavke: [
      // cene za šminkanje upiši umesto null, npr. cena: 3000
      { id: 'sm-dnevno',    naziv: 'Dnevno šminkanje',               trajanje: 45, cena: null },
      { id: 'sm-vecernje',  naziv: 'Večernje šminkanje',             trajanje: 60, cena: null },
      { id: 'sm-svadbeno',  naziv: 'Svadbeno šminkanje',             trajanje: 90, cena: null },
      { id: 'sm-probno',    naziv: 'Probno svadbeno šminkanje',      trajanje: 90, cena: null },
      { id: 'sm-proslava',  naziv: 'Šminkanje za proslavu / foto',   trajanje: 60, cena: null },
      { id: 'sm-trepavice', naziv: 'Lepljenje trepavica',            trajanje: 15, cena: null },
    ],
  },
];

/* =====================================================================
   Ispod ovoga je logika aplikacije
   ===================================================================== */
const KLJUC = 'rezervacije_v1';
const KLJUC_KLIJENTI = 'miva_klijenti_v1';
const STATUS = { rezervisan: 'Rezervisano', otkazan: 'Otkazano' };
const DANI = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
const DANI_PUNO = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
const MESECI = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const uMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const uVreme = min => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
const OD = uMin(CONFIG.pocetak);
const DO = uMin(CONFIG.kraj);

const kljucDatuma = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const izKljuca = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const danas = () => kljucDatuma(new Date());
const sadaMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const prosao = (datum, min) => datum < danas() || (datum === danas() && min < sadaMin());

const lepDatum = k => { const d = izKljuca(k); return `${DANI_PUNO[d.getDay()]}, ${d.getDate()}. ${MESECI[d.getMonth()]}`; };
const Datum = k => { const t = lepDatum(k); return t[0].toUpperCase() + t.slice(1); };
const kratakDatum = k => { const d = izKljuca(k); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`; };
const trajanjeTekst = m => { const h = Math.floor(m / 60), mm = m % 60; return [h ? `${h}h` : '', mm ? `${mm}min` : ''].filter(Boolean).join(' ') || '0min'; };
const cenaTekst = c => `${Math.round(c).toLocaleString('sr-RS')} ${CONFIG.valuta}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cistTel = t => (t || '').replace(/[^\d+]/g, '');
const noviId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const normalizuj = s => (s || '').toLowerCase()
  .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj').trim();

const sveUsluge = new Map();
USLUGE.forEach(k => k.stavke.forEach(s => sveUsluge.set(s.id, { ...s, kat: k.kat })));
const naziviUsluga = ids => ids.map(id => sveUsluge.get(id)?.naziv || '(obrisana usluga)').join(', ');
const ukupnaCena = ids => ids.reduce((s, id) => s + (typeof sveUsluge.get(id)?.cena === 'number' ? sveUsluge.get(id).cena : 0), 0);

/* ---------- Čuvanje podataka (u telefonu, localStorage) ---------- */
function ucitajListu(kljuc) {
  try { return JSON.parse(localStorage.getItem(kljuc)) || []; } catch { return []; }
}
function sacuvaj() {
  try {
    localStorage.setItem(KLJUC, JSON.stringify(rez));
    localStorage.setItem(KLJUC_KLIJENTI, JSON.stringify(klijenti));
  } catch { obavesti('Greška pri čuvanju'); }
}
let rez = ucitajListu(KLJUC);
let klijenti = ucitajListu(KLJUC_KLIJENTI);

// prelazak sa stare verzije (na čekanju / potvrđen -> rezervisano)
function srediStarePodatke() {
  let promena = false;
  rez.forEach(r => {
    if (r.status !== 'otkazan' && r.status !== 'rezervisan') { r.status = 'rezervisan'; promena = true; }
    if (typeof r.cena !== 'number') { r.cena = ukupnaCena(r.usluge || []); promena = true; }
  });
  if (promena) sacuvaj();
}
srediStarePodatke();

const stanje = {
  datum: danas(), pogled: 'dan', filter: 'aktivni', pretraga: '', pretragaKlijenata: '',
  mesecZarade: danas().slice(0, 7), izmenaId: null, izmenaKlijentaId: null,
};

const imeKlijenta = k => [k.ime, k.prezime].filter(Boolean).join(' ');
const klijentPoId = id => klijenti.find(k => k.id === id);
const imeTermina = r => { const k = klijentPoId(r.klijentId); return k ? imeKlijenta(k) : r.ime; };
const telTermina = r => { const k = klijentPoId(r.klijentId); return (k && k.telefon) || r.telefon || ''; };
const cenaTermina = r => typeof r.cena === 'number' ? r.cena : ukupnaCena(r.usluge);
const zavrsen = r => prosao(r.datum, r.pocetak + r.trajanje);

const aktivneZaDan = datum => rez
  .filter(r => r.datum === datum && r.status !== 'otkazan')
  .sort((a, b) => a.pocetak - b.pocetak);

const preklapanje = (datum, pocetak, trajanje, izuzmiId) => aktivneZaDan(datum)
  .find(r => r.id !== izuzmiId && pocetak < r.pocetak + r.trajanje && r.pocetak < pocetak + trajanje);

/* ---------- Prikaz ---------- */
const POGLEDI = ['dan', 'lista', 'klijenti', 'zarada'];
function prikazi() {
  POGLEDI.forEach(p => { $('#pogled-' + p).hidden = stanje.pogled !== p; });
  $$('.tab').forEach(t => t.classList.toggle('aktivan', t.dataset.pogled === stanje.pogled));
  $('#fab').hidden = stanje.pogled === 'zarada';
  $('#fab').setAttribute('aria-label', stanje.pogled === 'klijenti' ? 'Nova klijentkinja' : 'Novi termin');
  ({ dan: () => { prikaziNedelju(); prikaziDan(); }, lista: prikaziListu, klijenti: prikaziKlijente, zarada: prikaziZaradu })[stanje.pogled]();
}

function prikaziNedelju() {
  const d = izKljuca(stanje.datum);
  const pon = new Date(d);
  pon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  let html = '';
  for (let i = 0; i < 7; i++) {
    const x = new Date(pon);
    x.setDate(pon.getDate() + i);
    const k = kljucDatuma(x);
    const broj = aktivneZaDan(k).length;
    const klase = ['dan',
      k === stanje.datum && 'izabran',
      k === danas() && 'danas',
      CONFIG.neradniDani.includes(x.getDay()) && 'neradni'].filter(Boolean).join(' ');
    html += `<button class="${klase}" data-datum="${k}">
      <span>${DANI[x.getDay()]}</span><b>${x.getDate()}</b><i class="${broj ? 'ima' : ''}" title="${broj} termina"></i></button>`;
  }
  $('#nedelja').innerHTML = html;
  $('#mesec').textContent = `${MESECI[d.getMonth()]} ${d.getFullYear()}`;
}

function karticaTermina(r, saDatumom = false) {
  const kraj = r.pocetak + r.trajanje;
  const klasa = r.status === 'otkazan' ? 'otkazan' : (zavrsen(r) ? 'rezervisan prosao' : 'rezervisan');
  return `<button class="termin ${klasa}" data-id="${r.id}">
    <div class="gore">
      <span class="vreme">${saDatumom ? kratakDatum(r.datum) + ' · ' : ''}${uVreme(r.pocetak)} – ${uVreme(kraj)}</span>
      ${r.status === 'otkazan' ? '<span class="status otkazan">Otkazano</span>' : `<span class="iznos">${cenaTekst(cenaTermina(r))}</span>`}
    </div>
    <div class="ime">${esc(imeTermina(r))}</div>
    <div class="opis">${esc(naziviUsluga(r.usluge))}</div>
  </button>`;
}

function prikaziDan() {
  const datum = stanje.datum;
  const d = izKljuca(datum);
  $('#naslovDana').textContent = Datum(datum);
  const lista = aktivneZaDan(datum);
  const box = $('#termini');

  if (CONFIG.neradniDani.includes(d.getDay())) {
    box.innerHTML = '<p class="prazno">Neradni dan</p>';
    $('#statistika').textContent = '';
    return;
  }

  let html = '', slobodnih = 0;
  for (let t = OD; t < DO; t += CONFIG.korak) {
    const pocinju = lista.filter(r => r.pocetak >= t && r.pocetak < t + CONFIG.korak);
    if (pocinju.length) {
      html += pocinju.map(r => karticaTermina(r)).join('');
      continue;
    }
    const traje = lista.find(r => r.pocetak < t && t < r.pocetak + r.trajanje);
    if (traje) {
      html += `<div class="slot nastavak ${zavrsen(traje) ? 'proslo' : ''}"><span class="vreme">${uVreme(t)}</span>↳ ${esc(imeTermina(traje))}</div>`;
    } else if (prosao(datum, t)) {
      html += `<div class="slot proslo" aria-disabled="true"><span class="vreme">${uVreme(t)}</span></div>`;
    } else {
      slobodnih++;
      html += `<button class="slot slobodan" data-vreme="${t}"><span class="vreme">${uVreme(t)}</span>Slobodno<span class="plus">+</span></button>`;
    }
  }
  box.innerHTML = html;
  const zarada = lista.reduce((s, r) => s + cenaTermina(r), 0);
  $('#statistika').textContent = `${lista.length} rezervisano · ${slobodnih} slobodno${lista.length ? ' · ' + cenaTekst(zarada) : ''}`;
}

function prikaziListu() {
  const dan = danas();
  const f = stanje.filter;
  let stavke = rez.filter(r => {
    if (f === 'aktivni') return r.status !== 'otkazan' && !zavrsen(r);
    if (f === 'prosli') return r.status !== 'otkazan' && zavrsen(r);
    if (f === 'otkazan') return r.status === 'otkazan';
    return true;
  });
  const q = normalizuj(stanje.pretraga);
  if (q) stavke = stavke.filter(r => normalizuj(imeTermina(r)).includes(q) || cistTel(telTermina(r)).includes(q.replace(/\s/g, '')));

  const unazad = f !== 'aktivni';
  stavke.sort((a, b) => (a.datum.localeCompare(b.datum) || a.pocetak - b.pocetak) * (unazad ? -1 : 1));

  if (!stavke.length) {
    $('#lista').innerHTML = '<p class="prazno">Nema termina za prikaz.</p>';
    return;
  }
  let html = '', poslednji = '';
  for (const r of stavke) {
    if (r.datum !== poslednji) {
      html += `<div class="grupa-naslov">${r.datum === dan ? 'Danas – ' + lepDatum(r.datum) : Datum(r.datum)}</div>`;
      poslednji = r.datum;
    }
    html += karticaTermina(r);
  }
  $('#lista').innerHTML = html;
}

/* ---------- Klijenti ---------- */
function statistikaKlijenta(id) {
  const termini = rez.filter(r => r.klijentId === id && r.status !== 'otkazan');
  const prosli = termini.filter(zavrsen);
  const sledeci = termini.filter(r => !zavrsen(r)).sort((a, b) => a.datum.localeCompare(b.datum) || a.pocetak - b.pocetak)[0];
  const poslednji = prosli.sort((a, b) => b.datum.localeCompare(a.datum) || b.pocetak - a.pocetak)[0];
  return { dolazaka: prosli.length, ukupno: prosli.reduce((s, r) => s + cenaTermina(r), 0), sledeci, poslednji, termini };
}

function prikaziKlijente() {
  const q = normalizuj(stanje.pretragaKlijenata);
  const lista = klijenti
    .filter(k => !q || normalizuj(imeKlijenta(k)).includes(q) || cistTel(k.telefon).includes(q.replace(/\s/g, '')))
    .sort((a, b) => imeKlijenta(a).localeCompare(imeKlijenta(b), 'sr'));
  $('#brojKlijenata').textContent = klijenti.length ? `${klijenti.length} ${klijenti.length === 1 ? 'klijentkinja' : 'klijenata'}` : '';
  if (!lista.length) {
    $('#listaKlijenata').innerHTML = `<p class="prazno">${klijenti.length ? 'Nema rezultata.' : 'Još nema klijenata.<br><small>Dodaj ih dugmetom + ili će se dodati sami kad zakažeš termin.</small>'}</p>`;
    return;
  }
  $('#listaKlijenata').innerHTML = lista.map(k => {
    const s = statistikaKlijenta(k.id);
    return `<button class="klijent" data-klijent="${k.id}">
      <span class="inicijali">${esc((k.ime[0] || '') + (k.prezime?.[0] || '')).toUpperCase()}</span>
      <span class="klijent-info">
        <span class="ime">${esc(imeKlijenta(k))}</span>
        <span class="opis">${esc(k.telefon || 'bez telefona')}${s.sledeci ? ` · sledeći ${kratakDatum(s.sledeci.datum)}` : ''}</span>
      </span>
      <span class="klijent-broj">${s.dolazaka}<small>dolazaka</small></span>
    </button>`;
  }).join('');
}

const dlgKlijent = $('#dlgKlijent');
const formaKlijent = $('#formaKlijent');

function otvoriFormuKlijenta(id = null) {
  stanje.izmenaKlijentaId = id;
  formaKlijent.reset();
  $('#greskaKlijent').textContent = '';
  const k = id ? klijentPoId(id) : null;
  $('#klijentNaslov').textContent = k ? 'Izmena klijentkinje' : 'Nova klijentkinja';
  if (k) {
    formaKlijent.ime.value = k.ime;
    formaKlijent.prezime.value = k.prezime || '';
    formaKlijent.telefon.value = k.telefon || '';
    formaKlijent.napomena.value = k.napomena || '';
  }
  dlgKlijent.showModal();
  if (!k) setTimeout(() => formaKlijent.ime.focus(), 50);
}

formaKlijent.addEventListener('submit', e => {
  e.preventDefault();
  const ime = formaKlijent.ime.value.trim();
  const prezime = formaKlijent.prezime.value.trim();
  const telefon = formaKlijent.telefon.value.trim();
  if (!ime) { $('#greskaKlijent').textContent = 'Upiši ime.'; return; }
  const duplikat = klijenti.find(k => k.id !== stanje.izmenaKlijentaId &&
    normalizuj(imeKlijenta(k)) === normalizuj([ime, prezime].filter(Boolean).join(' ')) &&
    cistTel(k.telefon) === cistTel(telefon));
  if (duplikat) { $('#greskaKlijent').textContent = 'Ova klijentkinja već postoji.'; return; }
  const podaci = { ime, prezime, telefon, napomena: formaKlijent.napomena.value.trim() };
  let id = stanje.izmenaKlijentaId;
  if (id) { Object.assign(klijentPoId(id), podaci); obavesti('Podaci sačuvani'); }
  else { id = noviId(); klijenti.push({ id, ...podaci, kreirano: new Date().toISOString() }); obavesti('Klijentkinja dodata'); }
  sacuvaj();
  dlgKlijent.close();
  prikazi();
  if (dlgDetalji.open && dlgDetalji.dataset.klijent) otvoriKlijenta(id);
});

function otvoriKlijenta(id) {
  const k = klijentPoId(id);
  if (!k) return;
  const s = statistikaKlijenta(id);
  const tel = cistTel(k.telefon);
  const istorija = s.termini.slice().sort((a, b) => b.datum.localeCompare(a.datum) || b.pocetak - a.pocetak).slice(0, 15);
  $('#detalji').innerHTML = `
    <header class="dlg-vrh">
      <h2>${esc(imeKlijenta(k))}</h2>
      <button type="button" class="ikona-btn" data-zatvori aria-label="Zatvori">✕</button>
    </header>
    <div class="dlg-telo">
      <dl class="det-polja">
        <dt>Telefon</dt><dd>${k.telefon ? `<a href="tel:${tel}">${esc(k.telefon)}</a>` : '—'}</dd>
        <dt>Dolazaka</dt><dd>${s.dolazaka}</dd>
        <dt>Ukupno</dt><dd>${cenaTekst(s.ukupno)}</dd>
        ${s.poslednji ? `<dt>Poslednji put</dt><dd>${kratakDatum(s.poslednji.datum)}</dd>` : ''}
        ${s.sledeci ? `<dt>Sledeći termin</dt><dd>${kratakDatum(s.sledeci.datum)} u ${uVreme(s.sledeci.pocetak)}</dd>` : ''}
        ${k.napomena ? `<dt>Napomena</dt><dd>${esc(k.napomena)}</dd>` : ''}
      </dl>
      <div class="det-akcije">
        <button class="btn puno" data-akcija="zakazi-klijentu">Zakaži termin</button>
        ${k.telefon ? `<a class="btn sek" href="tel:${tel}">Pozovi</a><a class="btn sek" href="sms:${tel}">SMS</a>` : ''}
        <button class="btn sek" data-akcija="izmeni-klijenta">Izmeni</button>
        <button class="btn opasno" data-akcija="obrisi-klijenta">Obriši</button>
      </div>
      ${istorija.length ? `<div class="grupa-naslov">Termini</div>${istorija.map(r => karticaTermina(r, true)).join('')}` : ''}
    </div>`;
  dlgDetalji.dataset.klijent = id;
  delete dlgDetalji.dataset.id;
  if (!dlgDetalji.open) dlgDetalji.showModal();
}

/* ---------- Zarada ---------- */
function zaradaZa(filter) {
  const termini = rez.filter(r => r.status !== 'otkazan' && filter(r));
  const zavrseni = termini.filter(zavrsen);
  const predstojeci = termini.filter(r => !zavrsen(r));
  const suma = l => l.reduce((s, r) => s + cenaTermina(r), 0);
  return { zaradjeno: suma(zavrseni), ocekivano: suma(predstojeci), brojZavrsenih: zavrseni.length, broj: termini.length, termini };
}

function prikaziZaradu() {
  const mesec = stanje.mesecZarade;
  const [g, m] = mesec.split('-').map(Number);
  $('#mesecZarade').textContent = `${MESECI[m - 1]} ${g}`;

  const dan = zaradaZa(r => r.datum === danas());
  const mes = zaradaZa(r => r.datum.startsWith(mesec));
  const ovajMesec = mesec === danas().slice(0, 7);

  // po danima
  const poDanima = {};
  mes.termini.forEach(r => { (poDanima[r.datum] ||= []).push(r); });
  const dani = Object.keys(poDanima).sort().reverse();
  const max = Math.max(1, ...dani.map(k => poDanima[k].reduce((s, r) => s + cenaTermina(r), 0)));

  // po kategorijama (završeni termini)
  const poKat = {};
  mes.termini.filter(zavrsen).forEach(r => {
    const ukupnoCenovnik = ukupnaCena(r.usluge);
    r.usluge.forEach(id => {
      const u = sveUsluge.get(id);
      if (!u) return;
      const udeo = ukupnoCenovnik ? (u.cena || 0) / ukupnoCenovnik : 1 / r.usluge.length;
      poKat[u.kat] = (poKat[u.kat] || 0) + cenaTermina(r) * udeo;
    });
  });

  $('#zaradaSadrzaj').innerHTML = `
    ${ovajMesec ? `
    <div class="kartica-zarada">
      <span class="oznaka">Danas</span>
      <span class="velika">${cenaTekst(dan.zaradjeno)}</span>
      <span class="mala">${dan.brojZavrsenih} završeno${dan.ocekivano ? ` · još ${cenaTekst(dan.ocekivano)} zakazano` : ''}</span>
    </div>` : ''}
    <div class="kartica-zarada glavna">
      <span class="oznaka">${ovajMesec ? 'Ovaj mesec' : 'Ukupno u mesecu'}</span>
      <span class="velika">${cenaTekst(mes.zaradjeno)}</span>
      <span class="mala">${mes.brojZavrsenih} završenih termina${mes.ocekivano ? ` · još ${cenaTekst(mes.ocekivano)} zakazano` : ''}</span>
      ${mes.brojZavrsenih ? `<span class="mala">prosečno ${cenaTekst(mes.zaradjeno / mes.brojZavrsenih)} po terminu</span>` : ''}
    </div>
    ${Object.keys(poKat).length ? `
      <div class="grupa-naslov">Po uslugama</div>
      <div class="kategorije">${Object.entries(poKat).sort((a, b) => b[1] - a[1]).map(([kat, iznos]) =>
        `<div class="kat-red"><span>${esc(kat)}</span><b>${cenaTekst(iznos)}</b></div>`).join('')}</div>` : ''}
    <div class="grupa-naslov">Po danima</div>
    ${dani.length ? dani.map(k => {
      const lista = poDanima[k];
      const iznos = lista.reduce((s, r) => s + cenaTermina(r), 0);
      const buduci = lista.some(r => !zavrsen(r));
      return `<button class="dan-zarada ${buduci ? 'buduci' : ''}" data-idi-na="${k}">
        <span class="dz-datum">${Datum(k)}</span>
        <span class="dz-broj">${lista.length} ${lista.length === 1 ? 'termin' : 'termina'}${buduci ? ' · zakazano' : ''}</span>
        <b>${cenaTekst(iznos)}</b>
        <span class="traka"><i style="width:${(iznos / max * 100).toFixed(1)}%"></i></span>
      </button>`;
    }).join('') : '<p class="prazno">Nema termina u ovom mesecu.</p>'}
  `;
}

/* ---------- Forma za termin ---------- */
const forma = $('#forma');
const dlgForma = $('#dlgForma');

function napraviIzborUsluga() {
  $('#uslugeIzbor').innerHTML = USLUGE.map(k => `
    <details data-kat="${esc(k.kat)}">
      <summary><span>${esc(k.kat)}<span class="izabrano"></span></span></summary>
      ${k.stavke.map(s => `
        <label class="usluga">
          <input type="checkbox" name="usluga" value="${s.id}">
          <span class="naziv">${esc(s.naziv)}</span>
          <span class="meta">${typeof s.cena === 'number' ? `<b>${cenaTekst(s.cena)}</b>` : ''}${trajanjeTekst(s.trajanje)}</span>
        </label>`).join('')}
    </details>`).join('');
}

const izabraneUsluge = () => $$('input[name="usluga"]:checked', forma).map(i => i.value);

function popuniVremena(izabrano) {
  const datum = forma.datum.value;
  const sel = forma.vreme;
  const sopstveno = stanje.izmenaId ? rez.find(r => r.id === stanje.izmenaId)?.pocetak : null;
  let html = '';
  for (let t = OD; t < DO; t += CONFIG.korak) {
    const zauzet = datum && preklapanje(datum, t, 1, stanje.izmenaId);
    const proslo = datum && prosao(datum, t) && t !== sopstveno;
    const tekst = zauzet ? ' – zauzeto' : (proslo ? ' – prošlo' : '');
    html += `<option value="${t}" ${zauzet || proslo ? 'disabled' : ''}>${uVreme(t)}${tekst}</option>`;
  }
  sel.innerHTML = html;
  if (izabrano != null && sel.querySelector(`option[value="${izabrano}"]`) && !sel.querySelector(`option[value="${izabrano}"]`).disabled) {
    sel.value = String(izabrano);
  } else {
    const prvo = [...sel.options].find(o => !o.disabled);
    if (prvo) sel.value = prvo.value; else sel.value = '';
  }
}

// izbor klijentkinje
function prikaziPredloge() {
  const q = normalizuj(forma.ime.value);
  const box = $('#predlozi');
  if (!q || forma.klijentId.value) { box.hidden = true; return; }
  const nadjeni = klijenti
    .filter(k => normalizuj(imeKlijenta(k)).includes(q) || (cistTel(k.telefon) && cistTel(k.telefon).includes(q.replace(/\s/g, ''))))
    .sort((a, b) => imeKlijenta(a).localeCompare(imeKlijenta(b), 'sr'))
    .slice(0, 6);
  box.innerHTML = nadjeni.map(k => `<button type="button" class="predlog" data-izaberi="${k.id}">
      <b>${esc(imeKlijenta(k))}</b><span>${esc(k.telefon || '')}</span></button>`).join('') +
    `<div class="predlog novi">+ Nova klijentkinja: <b>${esc(forma.ime.value.trim())}</b></div>`;
  box.hidden = false;
}

function izaberiKlijenta(id) {
  const k = klijentPoId(id);
  if (!k) return;
  forma.klijentId.value = k.id;
  forma.ime.value = imeKlijenta(k);
  forma.telefon.value = k.telefon || '';
  $('#predlozi').hidden = true;
  $('#izabranaKlijentkinja').hidden = false;
}

function osveziRezime() {
  const ids = izabraneUsluge();
  $$('#uslugeIzbor details').forEach(det => {
    const n = $$('input:checked', det).length;
    $('.izabrano', det).textContent = n ? `(${n})` : '';
  });
  if (!forma.cenaRucno) forma.cena.value = ids.length ? ukupnaCena(ids) : '';
  const greska = $('#greska');
  greska.textContent = '';
  if (!ids.length) { $('#rezime').innerHTML = 'Izaberi bar jednu uslugu.'; return null; }

  const trajanje = ids.reduce((s, id) => s + (sveUsluge.get(id)?.trajanje || 0), 0);
  const pocetak = Number(forma.vreme.value);
  const kraj = pocetak + trajanje;
  $('#rezime').innerHTML = `Trajanje: <b>${trajanjeTekst(trajanje)}</b> · Kraj: <b>${uVreme(kraj)}</b> · Cena: <b>${cenaTekst(Number(forma.cena.value) || 0)}</b>`;

  let problem = '';
  if (forma.vreme.value === '') problem = 'Nema slobodnih termina za ovaj dan.';
  else if (kraj > DO) problem = `Termin se završava posle ${CONFIG.kraj}. Izaberi ranije vreme.`;
  const sudar = forma.datum.value && forma.vreme.value !== '' && preklapanje(forma.datum.value, pocetak, trajanje, stanje.izmenaId);
  if (sudar) problem = `Preklapa se sa terminom: ${imeTermina(sudar)} (${uVreme(sudar.pocetak)} – ${uVreme(sudar.pocetak + sudar.trajanje)}).`;
  greska.textContent = problem;
  return { trajanje, problem };
}

function otvoriFormu({ datum = stanje.datum, vreme = null, id = null, klijentId = null } = {}) {
  stanje.izmenaId = id;
  forma.reset();
  forma.cenaRucno = false;
  forma.klijentId.value = '';
  $('#predlozi').hidden = true;
  $('#izabranaKlijentkinja').hidden = true;
  const r = id ? rez.find(x => x.id === id) : null;
  $('#formaNaslov').textContent = r ? 'Izmena termina' : 'Novi termin';
  forma.datum.min = r ? '' : danas();
  if (!r && datum < danas()) datum = danas();
  forma.datum.value = r ? r.datum : datum;
  popuniVremena(r ? r.pocetak : vreme);
  $$('#uslugeIzbor details').forEach(d => { d.open = false; });
  if (r) {
    if (klijentPoId(r.klijentId)) izaberiKlijenta(r.klijentId);
    else { forma.ime.value = r.ime; forma.telefon.value = r.telefon || ''; }
    forma.napomena.value = r.napomena || '';
    r.usluge.forEach(uid => {
      const cb = forma.querySelector(`input[name="usluga"][value="${uid}"]`);
      if (cb) { cb.checked = true; cb.closest('details').open = true; }
    });
    forma.cena.value = cenaTermina(r);
    forma.cenaRucno = cenaTermina(r) !== ukupnaCena(r.usluge);
  } else if (klijentId) {
    izaberiKlijenta(klijentId);
  }
  osveziRezime();
  dlgForma.showModal();
  if (!r && !klijentId) setTimeout(() => forma.ime.focus(), 50);
}

forma.addEventListener('submit', e => {
  e.preventDefault();
  const ime = forma.ime.value.trim();
  const ids = izabraneUsluge();
  const info = osveziRezime();
  const greska = $('#greska');
  if (!forma.datum.value) { greska.textContent = 'Izaberi datum.'; return; }
  if (!ime) { greska.textContent = 'Upiši ili izaberi klijentkinju.'; forma.ime.focus(); return; }
  if (!ids.length || !info) { greska.textContent = 'Izaberi bar jednu uslugu.'; return; }
  if (info.problem) return;
  const pocetak = Number(forma.vreme.value);
  const stari = stanje.izmenaId ? rez.find(x => x.id === stanje.izmenaId) : null;
  if (prosao(forma.datum.value, pocetak) && !(stari && stari.datum === forma.datum.value && stari.pocetak === pocetak)) {
    greska.textContent = 'Ne možeš zakazati termin u prošlosti.'; return;
  }

  // klijentkinja: izabrana iz liste ili nova
  const telefon = forma.telefon.value.trim();
  let klijentId = forma.klijentId.value;
  if (klijentId && klijentPoId(klijentId)) {
    const k = klijentPoId(klijentId);
    if (telefon && telefon !== k.telefon) k.telefon = telefon;
  } else {
    const postoji = klijenti.find(k => normalizuj(imeKlijenta(k)) === normalizuj(ime));
    if (postoji) {
      klijentId = postoji.id;
      if (telefon && !postoji.telefon) postoji.telefon = telefon;
    } else {
      const [prvo, ...ostalo] = ime.split(/\s+/);
      klijentId = noviId();
      klijenti.push({ id: klijentId, ime: prvo, prezime: ostalo.join(' '), telefon, napomena: '', kreirano: new Date().toISOString() });
    }
  }

  const podaci = {
    datum: forma.datum.value,
    pocetak,
    trajanje: info.trajanje,
    usluge: ids,
    klijentId,
    ime,
    telefon,
    cena: Math.max(0, Number(forma.cena.value) || 0),
    napomena: forma.napomena.value.trim(),
  };

  if (stari) {
    Object.assign(stari, podaci);
    obavesti('Termin izmenjen');
  } else {
    rez.push({ id: noviId(), ...podaci, status: 'rezervisan', kreirano: new Date().toISOString() });
    obavesti('Termin rezervisan');
  }
  sacuvaj();
  stanje.datum = podaci.datum;
  dlgForma.close();
  if (dlgDetalji.open) dlgDetalji.close();
  prikazi();
});

forma.addEventListener('change', e => {
  if (e.target.name === 'datum') popuniVremena(Number(forma.vreme.value));
  if (e.target.name === 'cena') forma.cenaRucno = true;
  if (e.target.name === 'usluga' && !stanje.izmenaId) forma.cenaRucno = false;
  osveziRezime();
});
forma.addEventListener('input', e => {
  if (e.target.name === 'ime') {
    forma.klijentId.value = '';
    $('#izabranaKlijentkinja').hidden = true;
    prikaziPredloge();
  }
  if (e.target.name === 'cena') { forma.cenaRucno = true; osveziRezime(); }
});
$('#predlozi').addEventListener('click', e => {
  const b = e.target.closest('[data-izaberi]');
  if (b) izaberiKlijenta(b.dataset.izaberi);
  else if (e.target.closest('.novi')) $('#predlozi').hidden = true;
});

/* ---------- Detalji termina ---------- */
const dlgDetalji = $('#dlgDetalji');

function smsLink(r, tip) {
  const ime = imeTermina(r);
  const tekst = tip === 'otkaz'
    ? `Poštovani/a ${ime}, Vaš termin ${lepDatum(r.datum)} u ${uVreme(r.pocetak)}h je otkazan. Javite se ako želite novi termin. ${CONFIG.nazivSalona}`
    : `Poštovani/a ${ime}, Vaš termin je ${lepDatum(r.datum)} u ${uVreme(r.pocetak)}h (${naziviUsluga(r.usluge)}). Vidimo se! ${CONFIG.nazivSalona}`;
  return `sms:${cistTel(telTermina(r))}?body=${encodeURIComponent(tekst)}`;
}

function otvoriDetalje(id) {
  const r = rez.find(x => x.id === id);
  if (!r) return;
  const kraj = r.pocetak + r.trajanje;
  const telefon = telTermina(r);
  const tel = cistTel(telefon);
  const k = klijentPoId(r.klijentId);
  $('#detalji').innerHTML = `
    <header class="dlg-vrh">
      <h2>${esc(imeTermina(r))}</h2>
      <button type="button" class="ikona-btn" data-zatvori aria-label="Zatvori">✕</button>
    </header>
    <div class="dlg-telo">
      <span class="status ${r.status === 'otkazan' ? 'otkazan' : (zavrsen(r) ? 'zavrsen' : 'rezervisan')}" style="align-self:flex-start">${r.status === 'otkazan' ? 'Otkazano' : (zavrsen(r) ? 'Završeno' : 'Rezervisano')}</span>
      <dl class="det-polja">
        <dt>Datum</dt><dd>${Datum(r.datum)}</dd>
        <dt>Vreme</dt><dd>${uVreme(r.pocetak)} – ${uVreme(kraj)} (${trajanjeTekst(r.trajanje)})</dd>
        <dt>Usluge</dt><dd>${esc(naziviUsluga(r.usluge))}</dd>
        <dt>Cena</dt><dd>${cenaTekst(cenaTermina(r))}</dd>
        ${telefon ? `<dt>Telefon</dt><dd><a href="tel:${tel}">${esc(telefon)}</a></dd>` : ''}
        ${r.napomena ? `<dt>Napomena</dt><dd>${esc(r.napomena)}</dd>` : ''}
      </dl>
      <div class="det-akcije">
        ${r.status === 'otkazan' && !zavrsen(r) ? `<button class="btn puno" data-akcija="vrati">Vrati termin</button>` : ''}
        ${telefon ? `<a class="btn sek" href="tel:${tel}">Pozovi</a>` : ''}
        ${telefon ? `<a class="btn sek" href="${smsLink(r, r.status === 'otkazan' ? 'otkaz' : 'potvrda')}">${r.status === 'otkazan' ? 'SMS o otkazu' : 'Pošalji SMS'}</a>` : ''}
        ${k ? `<button class="btn sek" data-akcija="klijent" data-klijent-id="${k.id}">Karton klijentkinje</button>` : ''}
        ${r.status !== 'otkazan' ? `<button class="btn sek" data-akcija="izmeni">Izmeni</button>` : ''}
        ${r.status !== 'otkazan' && !zavrsen(r) ? `<button class="btn opasno puno" data-akcija="otkazi">Otkaži termin</button>` : ''}
        ${r.status === 'otkazan' || zavrsen(r) ? `<button class="btn opasno puno" data-akcija="obrisi">Obriši trajno</button>` : ''}
      </div>
    </div>`;
  dlgDetalji.dataset.id = id;
  delete dlgDetalji.dataset.klijent;
  if (!dlgDetalji.open) dlgDetalji.showModal();
}

dlgDetalji.addEventListener('click', e => {
  const termin = e.target.closest('.termin');
  if (termin) { otvoriDetalje(termin.dataset.id); return; }
  const btn = e.target.closest('[data-akcija]');
  if (!btn) return;
  const akcija = btn.dataset.akcija;

  if (akcija === 'zakazi-klijentu') { const kid = dlgDetalji.dataset.klijent; dlgDetalji.close(); otvoriFormu({ klijentId: kid, datum: danas() }); return; }
  if (akcija === 'izmeni-klijenta') { otvoriFormuKlijenta(dlgDetalji.dataset.klijent); return; }
  if (akcija === 'obrisi-klijenta') {
    const k = klijentPoId(dlgDetalji.dataset.klijent);
    if (!k || !confirm(`Obrisati ${imeKlijenta(k)} iz liste klijenata? Njeni termini ostaju.`)) return;
    klijenti = klijenti.filter(x => x.id !== k.id);
    sacuvaj(); dlgDetalji.close(); obavesti('Klijentkinja obrisana'); prikazi(); return;
  }
  if (akcija === 'klijent') { otvoriKlijenta(btn.dataset.klijentId); return; }

  const r = rez.find(x => x.id === dlgDetalji.dataset.id);
  if (!r) return;
  switch (akcija) {
    case 'otkazi':
      if (!confirm(`Otkazati termin za ${imeTermina(r)}?`)) return;
      r.status = 'otkazan'; sacuvaj(); obavesti('Termin otkazan – vreme je ponovo slobodno'); otvoriDetalje(r.id); break;
    case 'vrati': {
      const sudar = preklapanje(r.datum, r.pocetak, r.trajanje, r.id);
      if (sudar) { alert(`Ne može – u tom vremenu je već rezervisan termin: ${imeTermina(sudar)}.`); return; }
      r.status = 'rezervisan'; sacuvaj(); obavesti('Termin vraćen'); otvoriDetalje(r.id); break;
    }
    case 'izmeni':
      dlgDetalji.close(); otvoriFormu({ id: r.id }); break;
    case 'obrisi':
      if (!confirm('Trajno obrisati ovaj termin? Ovo ne može da se poništi.')) return;
      rez = rez.filter(x => x.id !== r.id); sacuvaj(); dlgDetalji.close(); obavesti('Obrisano'); break;
  }
  prikazi();
});

/* ---------- Rezervna kopija ---------- */
$('#btnIzvoz').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ verzija: 2, izvezeno: new Date().toISOString(), rezervacije: rez, klijenti }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `miva-rezervna-kopija-${danas()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#uvozFajl').addEventListener('change', async e => {
  const fajl = e.target.files[0];
  if (!fajl) return;
  try {
    const podaci = JSON.parse(await fajl.text());
    const lista = Array.isArray(podaci) ? podaci : podaci.rezervacije;
    if (!Array.isArray(lista)) throw new Error();
    const kl = Array.isArray(podaci.klijenti) ? podaci.klijenti : [];
    if (!confirm(`Fajl ima ${lista.length} termina i ${kl.length} klijenata. Zameniti trenutne podatke?`)) return;
    rez = lista;
    klijenti = kl;
    srediStarePodatke();
    sacuvaj();
    prikazi();
    $('#dlgMeni').close();
    obavesti('Podaci vraćeni');
  } catch {
    alert('Ovo nije ispravan fajl rezervne kopije.');
  } finally {
    e.target.value = '';
  }
});

/* ---------- Ostali događaji ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const zatvori = t.closest('[data-zatvori]');
  if (zatvori) { zatvori.closest('dialog').close(); return; }
  if (t.closest('dialog')) return;

  const tab = t.closest('.tab');
  if (tab) { stanje.pogled = tab.dataset.pogled; prikazi(); window.scrollTo(0, 0); return; }

  const dan = t.closest('.dan');
  if (dan) { stanje.datum = dan.dataset.datum; prikazi(); return; }

  const slot = t.closest('.slot.slobodan');
  if (slot) { otvoriFormu({ vreme: Number(slot.dataset.vreme) }); return; }

  const termin = t.closest('.termin');
  if (termin) { otvoriDetalje(termin.dataset.id); return; }

  const klijent = t.closest('.klijent');
  if (klijent) { otvoriKlijenta(klijent.dataset.klijent); return; }

  const idiNa = t.closest('[data-idi-na]');
  if (idiNa) { stanje.datum = idiNa.dataset.idiNa; stanje.pogled = 'dan'; prikazi(); window.scrollTo(0, 0); return; }

  const filter = t.closest('.filter');
  if (filter) {
    stanje.filter = filter.dataset.filter;
    $$('.filter').forEach(f => f.classList.toggle('aktivan', f === filter));
    prikaziListu();
  }
});

// klik na pozadinu zatvara dijalog
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

const pomeriDane = n => { const d = izKljuca(stanje.datum); d.setDate(d.getDate() + n); stanje.datum = kljucDatuma(d); prikazi(); };
$('#prethodna').addEventListener('click', () => pomeriDane(-7));
$('#sledeca').addEventListener('click', () => pomeriDane(7));
$('#mesec').addEventListener('click', () => { stanje.datum = danas(); prikazi(); });
const pomeriMesec = n => {
  const [g, m] = stanje.mesecZarade.split('-').map(Number);
  const d = new Date(g, m - 1 + n, 1);
  stanje.mesecZarade = kljucDatuma(d).slice(0, 7);
  prikaziZaradu();
};
$('#zaradaPrethodni').addEventListener('click', () => pomeriMesec(-1));
$('#zaradaSledeci').addEventListener('click', () => pomeriMesec(1));
$('#mesecZarade').addEventListener('click', () => { stanje.mesecZarade = danas().slice(0, 7); prikaziZaradu(); });
$('#fab').addEventListener('click', () => {
  if (stanje.pogled === 'klijenti') otvoriFormuKlijenta();
  else otvoriFormu();
});
$('#pretraga').addEventListener('input', e => { stanje.pretraga = e.target.value; prikaziListu(); });
$('#pretragaKlijenata').addEventListener('input', e => { stanje.pretragaKlijenata = e.target.value; prikaziKlijente(); });
$('#btnMeni').addEventListener('click', () => {
  $('#infoBroj').textContent = `Sačuvano: ${rez.length} termina, ${klijenti.length} klijenata`;
  $('#dlgMeni').showModal();
});

let toastTimer;
function obavesti(tekst) {
  const el = $('#toast');
  el.textContent = tekst;
  el.classList.add('vidljiv');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('vidljiv'), 2500);
}

/* ---------- Start ---------- */
document.title = CONFIG.nazivSalona;
napraviIzborUsluga();
prikazi();
// danas: skroluj do trenutnog vremena
{
  const prvi = $('#termini').querySelector('.slot.slobodan, .termin:not(.prosao)');
  if (prvi && $('#termini .slot.proslo')) prvi.scrollIntoView({ block: 'center' });
}
setInterval(() => { if (!document.querySelector('dialog[open]')) prikazi(); }, 60 * 1000);

// rad bez interneta (kad je aplikacija na GitHub Pages)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
