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
      { id: 'n-geltehnika',  naziv: 'Gel tehnika',                             trajanje: 90,  cena: 2200 },
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
const STATUS = {
  na_cekanju: 'Na čekanju',
  potvrdjen: 'Potvrđen',
  otkazan: 'Otkazan',
};
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
const kratakDatum = k => { const d = izKljuca(k); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`; };
const trajanjeTekst = m => { const h = Math.floor(m / 60), mm = m % 60; return [h ? `${h}h` : '', mm ? `${mm}min` : ''].filter(Boolean).join(' ') || '0min'; };
const cenaTekst = c => `${c.toLocaleString('sr-RS')} ${CONFIG.valuta}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const sveUsluge = new Map();
USLUGE.forEach(k => k.stavke.forEach(s => sveUsluge.set(s.id, { ...s, kat: k.kat })));
const naziviUsluga = ids => ids.map(id => sveUsluge.get(id)?.naziv || '(obrisana usluga)').join(', ');
const ukupnaCena = ids => {
  const cene = ids.map(id => sveUsluge.get(id)?.cena).filter(c => typeof c === 'number');
  return cene.length ? cene.reduce((a, b) => a + b, 0) : null;
};

/* ---------- Čuvanje podataka (u telefonu, localStorage) ---------- */
function ucitaj() {
  try { return JSON.parse(localStorage.getItem(KLJUC)) || []; } catch { return []; }
}
function sacuvaj() {
  try { localStorage.setItem(KLJUC, JSON.stringify(rez)); }
  catch { obavesti('Greška pri čuvanju'); }
}
let rez = ucitaj();

const stanje = { datum: danas(), pogled: 'dan', filter: 'aktivni', pretraga: '', izmenaId: null };

const aktivneZaDan = datum => rez
  .filter(r => r.datum === datum && r.status !== 'otkazan')
  .sort((a, b) => a.pocetak - b.pocetak);

const preklapanje = (datum, pocetak, trajanje, izuzmiId) => aktivneZaDan(datum)
  .find(r => r.id !== izuzmiId && pocetak < r.pocetak + r.trajanje && r.pocetak < pocetak + trajanje);

/* ---------- Prikaz ---------- */
function prikazi() {
  $('#pogledDan').hidden = stanje.pogled !== 'dan';
  $('#pogledLista').hidden = stanje.pogled !== 'lista';
  $$('.tab').forEach(t => t.classList.toggle('aktivan', t.dataset.pogled === stanje.pogled));
  const naCekanju = rez.filter(r => r.status === 'na_cekanju' && r.datum >= danas()).length;
  const bedz = $('#bedzCekanje');
  bedz.hidden = !naCekanju;
  bedz.textContent = naCekanju;
  if (stanje.pogled === 'dan') { prikaziNedelju(); prikaziDan(); } else { prikaziListu(); }
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
  const prosla = prosao(r.datum, kraj) && r.status !== 'otkazan';
  return `<button class="termin ${r.status} ${prosla ? 'prosao' : ''}" data-id="${r.id}">
    <div class="gore">
      <span class="vreme">${saDatumom ? kratakDatum(r.datum) + ' · ' : ''}${uVreme(r.pocetak)} – ${uVreme(kraj)}</span>
      <span class="status ${r.status}">${STATUS[r.status]}</span>
    </div>
    <div class="ime">${esc(r.ime)}</div>
    <div class="opis">${esc(naziviUsluga(r.usluge))}</div>
  </button>`;
}

function prikaziDan() {
  const datum = stanje.datum;
  const d = izKljuca(datum);
  $('#naslovDana').textContent = lepDatum(datum);
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
      html += `<div class="slot nastavak"><span class="vreme">${uVreme(t)}</span>↳ zauzeto (${esc(traje.ime)})</div>`;
    } else if (prosao(datum, t)) {
      html += `<div class="slot proslo"><span class="vreme">${uVreme(t)}</span>prošlo</div>`;
    } else {
      slobodnih++;
      html += `<button class="slot slobodan" data-vreme="${t}"><span class="vreme">${uVreme(t)}</span>Slobodno<span class="plus">+</span></button>`;
    }
  }
  box.innerHTML = html;
  $('#statistika').textContent = `${lista.length} zakazano · ${slobodnih} slobodno`;
}

function prikaziListu() {
  const dan = danas();
  const f = stanje.filter;
  let stavke = rez.filter(r => {
    if (f === 'aktivni') return r.status !== 'otkazan' && r.datum >= dan;
    if (f === 'na_cekanju' || f === 'potvrdjen') return r.status === f && r.datum >= dan;
    if (f === 'otkazan') return r.status === 'otkazan';
    if (f === 'prosli') return r.status !== 'otkazan' && r.datum < dan;
    return true;
  });
  const q = stanje.pretraga.trim().toLowerCase();
  if (q) stavke = stavke.filter(r => r.ime.toLowerCase().includes(q) || (r.telefon || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')));

  const unazad = f === 'prosli' || f === 'otkazan';
  stavke.sort((a, b) => (a.datum.localeCompare(b.datum) || a.pocetak - b.pocetak) * (unazad ? -1 : 1));

  if (!stavke.length) {
    $('#lista').innerHTML = '<p class="prazno">Nema termina za prikaz.</p>';
    return;
  }
  let html = '', poslednji = '';
  for (const r of stavke) {
    if (r.datum !== poslednji) {
      html += `<div class="grupa-naslov">${r.datum === dan ? 'Danas – ' : ''}${lepDatum(r.datum)}</div>`;
      poslednji = r.datum;
    }
    html += karticaTermina(r);
  }
  $('#lista').innerHTML = html;
}

/* ---------- Forma ---------- */
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

function izabraneUsluge() {
  return $$('input[name="usluga"]:checked', forma).map(i => i.value);
}

function popuniVremena(izabrano) {
  const datum = forma.datum.value;
  const sel = forma.vreme;
  let html = '';
  for (let t = OD; t < DO; t += CONFIG.korak) {
    const zauzet = datum && preklapanje(datum, t, 1, stanje.izmenaId);
    html += `<option value="${t}" ${zauzet ? 'disabled' : ''}>${uVreme(t)}${zauzet ? ' – zauzeto' : ''}</option>`;
  }
  sel.innerHTML = html;
  if (izabrano != null && !sel.querySelector(`option[value="${izabrano}"]`)?.disabled) {
    sel.value = String(izabrano);
  } else {
    const prvo = [...sel.options].find(o => !o.disabled && !prosao(datum, +o.value)) || [...sel.options].find(o => !o.disabled);
    if (prvo) sel.value = prvo.value;
  }
}

function osveziRezime() {
  const ids = izabraneUsluge();
  // brojač izabranih po kategoriji
  $$('#uslugeIzbor details').forEach(det => {
    const n = $$('input:checked', det).length;
    $('.izabrano', det).textContent = n ? `(${n})` : '';
  });
  const greska = $('#greska');
  greska.textContent = '';
  if (!ids.length) { $('#rezime').innerHTML = 'Izaberi bar jednu uslugu.'; return null; }

  const trajanje = ids.reduce((s, id) => s + (sveUsluge.get(id)?.trajanje || 0), 0);
  const pocetak = Number(forma.vreme.value);
  const kraj = pocetak + trajanje;
  const cena = ukupnaCena(ids);
  $('#rezime').innerHTML = `Trajanje: <b>${trajanjeTekst(trajanje)}</b> · Kraj: <b>${uVreme(kraj)}</b>${cena != null ? ` · Cena: <b>${cenaTekst(cena)}</b>` : ''}`;

  let problem = '';
  if (kraj > DO) problem = `Termin se završava posle ${CONFIG.kraj}. Izaberi ranije vreme.`;
  const sudar = forma.datum.value && preklapanje(forma.datum.value, pocetak, trajanje, stanje.izmenaId);
  if (sudar) problem = `Preklapa se sa terminom: ${sudar.ime} (${uVreme(sudar.pocetak)} – ${uVreme(sudar.pocetak + sudar.trajanje)}).`;
  greska.textContent = problem;
  return { trajanje, problem };
}

function otvoriFormu({ datum = stanje.datum, vreme = null, id = null } = {}) {
  stanje.izmenaId = id;
  forma.reset();
  const r = id ? rez.find(x => x.id === id) : null;
  $('#formaNaslov').textContent = r ? 'Izmena termina' : 'Novi termin';
  forma.datum.value = r ? r.datum : datum;
  popuniVremena(r ? r.pocetak : vreme);
  $$('#uslugeIzbor details').forEach(d => { d.open = false; });
  if (r) {
    forma.ime.value = r.ime;
    forma.telefon.value = r.telefon || '';
    forma.napomena.value = r.napomena || '';
    forma.potvrdi.checked = r.status === 'potvrdjen';
    r.usluge.forEach(uid => {
      const cb = forma.querySelector(`input[name="usluga"][value="${uid}"]`);
      if (cb) { cb.checked = true; cb.closest('details').open = true; }
    });
  }
  osveziRezime();
  dlgForma.showModal();
  if (!r) setTimeout(() => forma.ime.focus(), 50);
}

forma.addEventListener('submit', e => {
  e.preventDefault();
  const ime = forma.ime.value.trim();
  const ids = izabraneUsluge();
  const info = osveziRezime();
  const greska = $('#greska');
  if (!forma.datum.value) { greska.textContent = 'Izaberi datum.'; return; }
  if (!ime) { greska.textContent = 'Upiši ime klijenta.'; forma.ime.focus(); return; }
  if (!ids.length || !info) { greska.textContent = 'Izaberi bar jednu uslugu.'; return; }
  if (info.problem) return;

  const podaci = {
    datum: forma.datum.value,
    pocetak: Number(forma.vreme.value),
    trajanje: info.trajanje,
    usluge: ids,
    ime,
    telefon: forma.telefon.value.trim(),
    napomena: forma.napomena.value.trim(),
  };

  if (stanje.izmenaId) {
    const r = rez.find(x => x.id === stanje.izmenaId);
    Object.assign(r, podaci);
    if (forma.potvrdi.checked) r.status = 'potvrdjen';
    else if (r.status === 'potvrdjen') r.status = 'na_cekanju';
    obavesti('Termin izmenjen');
  } else {
    rez.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...podaci,
      status: forma.potvrdi.checked ? 'potvrdjen' : 'na_cekanju',
      kreirano: new Date().toISOString(),
    });
    obavesti(forma.potvrdi.checked ? 'Termin zakazan i potvrđen' : 'Termin zakazan – na čekanju');
  }
  sacuvaj();
  stanje.datum = podaci.datum;
  dlgForma.close();
  prikazi();
});

forma.addEventListener('change', e => {
  if (e.target.name === 'datum') popuniVremena(Number(forma.vreme.value));
  osveziRezime();
});

/* ---------- Detalji termina ---------- */
const dlgDetalji = $('#dlgDetalji');

function poruka(r, tip) {
  const tekst = tip === 'potvrda'
    ? `Poštovani/a ${r.ime}, potvrđujemo Vaš termin: ${lepDatum(r.datum)} u ${uVreme(r.pocetak)}h (${naziviUsluga(r.usluge)}). Vidimo se!`
    : `Poštovani/a ${r.ime}, Vaš termin ${lepDatum(r.datum)} u ${uVreme(r.pocetak)}h je otkazan. Javite se ako želite novi termin.`;
  const broj = (r.telefon || '').replace(/[^\d+]/g, '');
  return `sms:${broj}?body=${encodeURIComponent(tekst)}`;
}

function otvoriDetalje(id) {
  const r = rez.find(x => x.id === id);
  if (!r) return;
  const kraj = r.pocetak + r.trajanje;
  const cena = ukupnaCena(r.usluge);
  const tel = (r.telefon || '').replace(/[^\d+]/g, '');
  $('#detalji').innerHTML = `
    <header class="dlg-vrh">
      <h2>${esc(r.ime)}</h2>
      <button type="button" class="ikona-btn" data-zatvori aria-label="Zatvori">✕</button>
    </header>
    <div class="dlg-telo">
      <span class="status ${r.status}" style="align-self:flex-start">${STATUS[r.status]}</span>
      <dl class="det-polja">
        <dt>Datum</dt><dd style="text-transform:capitalize">${lepDatum(r.datum)}</dd>
        <dt>Vreme</dt><dd>${uVreme(r.pocetak)} – ${uVreme(kraj)} (${trajanjeTekst(r.trajanje)})</dd>
        <dt>Usluge</dt><dd>${esc(naziviUsluga(r.usluge))}</dd>
        ${cena != null ? `<dt>Cena</dt><dd>${cenaTekst(cena)}</dd>` : ''}
        ${r.telefon ? `<dt>Telefon</dt><dd><a href="tel:${tel}">${esc(r.telefon)}</a></dd>` : ''}
        ${r.napomena ? `<dt>Napomena</dt><dd>${esc(r.napomena)}</dd>` : ''}
      </dl>
      <div class="det-akcije">
        ${r.status === 'na_cekanju' ? `<button class="btn puno" data-akcija="potvrdi">Potvrdi termin</button>` : ''}
        ${r.status === 'otkazan' ? `<button class="btn puno" data-akcija="vrati">Vrati termin</button>` : ''}
        ${r.telefon ? `<a class="btn sek" href="tel:${tel}">Pozovi</a>` : ''}
        ${r.telefon && r.status !== 'otkazan' ? `<a class="btn sek" href="${poruka(r, 'potvrda')}">SMS potvrda</a>` : ''}
        ${r.telefon && r.status === 'otkazan' ? `<a class="btn sek" href="${poruka(r, 'otkaz')}">SMS o otkazu</a>` : ''}
        ${r.status !== 'otkazan' ? `<button class="btn sek" data-akcija="izmeni">Izmeni</button>` : ''}
        ${r.status !== 'otkazan' ? `<button class="btn opasno" data-akcija="otkazi">Otkaži</button>` : ''}
        ${r.status === 'otkazan' ? `<button class="btn opasno puno" data-akcija="obrisi">Obriši trajno</button>` : ''}
      </div>
    </div>`;
  dlgDetalji.dataset.id = id;
  if (!dlgDetalji.open) dlgDetalji.showModal();
}

dlgDetalji.addEventListener('click', e => {
  const btn = e.target.closest('[data-akcija]');
  if (!btn) return;
  const r = rez.find(x => x.id === dlgDetalji.dataset.id);
  if (!r) return;
  switch (btn.dataset.akcija) {
    case 'potvrdi':
      r.status = 'potvrdjen'; sacuvaj(); obavesti('Termin potvrđen'); otvoriDetalje(r.id); break;
    case 'otkazi':
      if (!confirm(`Otkazati termin za ${r.ime}?`)) return;
      r.status = 'otkazan'; sacuvaj(); obavesti('Termin otkazan – vreme je ponovo slobodno'); otvoriDetalje(r.id); break;
    case 'vrati': {
      const sudar = preklapanje(r.datum, r.pocetak, r.trajanje, r.id);
      if (sudar) { alert(`Ne može – u tom vremenu je već zakazan termin: ${sudar.ime}.`); return; }
      r.status = 'na_cekanju'; sacuvaj(); obavesti('Termin vraćen'); otvoriDetalje(r.id); break;
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
  const blob = new Blob([JSON.stringify({ verzija: 1, izvezeno: new Date().toISOString(), rezervacije: rez }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rezervacije-${danas()}.json`;
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
    if (!confirm(`Fajl ima ${lista.length} termina. Zameniti trenutne podatke (${rez.length} termina)?`)) return;
    rez = lista;
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

  const tab = t.closest('.tab');
  if (tab) { stanje.pogled = tab.dataset.pogled; prikazi(); return; }

  const dan = t.closest('.dan');
  if (dan) { stanje.datum = dan.dataset.datum; prikazi(); return; }

  const slot = t.closest('.slot.slobodan');
  if (slot) { otvoriFormu({ vreme: Number(slot.dataset.vreme) }); return; }

  const termin = t.closest('.termin');
  if (termin && !t.closest('dialog')) { otvoriDetalje(termin.dataset.id); return; }

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
$('#fab').addEventListener('click', () => otvoriFormu());
$('#pretraga').addEventListener('input', e => { stanje.pretraga = e.target.value; prikaziListu(); });
$('#btnMeni').addEventListener('click', () => {
  $('#infoBroj').textContent = `Ukupno sačuvano termina: ${rez.length}`;
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
