# MIVA nails – rezervacije

## Fajlovi
| Fajl | Šta je |
|---|---|
| `index.html` | izgled stranice |
| `style.css` | boje i dizajn (boje se menjaju na vrhu fajla) |
| `app.js` | logika + **podešavanja i usluge na vrhu fajla** |
| `manifest.json`, `sw.js`, `icons/` | da se instalira kao aplikacija i radi bez interneta |

## Šta da menjaš u `app.js`
- `CONFIG`: radno vreme, razmak termina (30 ili 15 min), neradni dani, valuta
- `USLUGE`: nazivi, trajanje (u minutima) i cena (`cena: 2500`; `null` = ne prikazuje se)

Kad nešto promeniš i ponovo okačiš na GitHub, u `sw.js` promeni `miva-v2` u `miva-v3` (pa v4…), da bi telefon povukao novu verziju.

## Kačenje na GitHub Pages (besplatno)
1. Napravi nalog na github.com.
2. Klikni **New repository**, daj mu ime npr. `rezervacije`, izaberi **Public**, pa **Create**.
3. Klikni **uploading an existing file**, prevuci SVE fajlove iz ovog foldera (i folder `icons`), pa **Commit changes**.
4. Otvori **Settings → Pages**, pod *Branch* izaberi `main` i `/ (root)`, pa **Save**.
5. Za 1–2 minuta aplikacija je na: `https://vanjakovacevic1.github.io/MIVA-nails/`

(Može i iz VS Code-a: Source Control → Publish to GitHub.)

## Instalacija na telefon
- **Android (Chrome):** otvori link, pa ⋮ → **Dodaj na početni ekran / Instaliraj aplikaciju**
- **iPhone (Safari):** otvori link, pa dugme Deli (□↑) → **Dodaj na početni ekran**

## Važno o podacima
- Rezervacije se čuvaju **samo na tom telefonu** (u pregledaču). Na GitHubu je samo prazna aplikacija, a tvoji klijenti i termini **nisu javni**.
- Ako obrišeš podatke pregledača ili aplikaciju, gube se i termini. Zato povremeno klikni **⋯ → Sačuvaj rezervnu kopiju** i sačuvaj fajl (Drive, mejl). Sa **Vrati iz rezervne kopije** ih vraćaš, i na novom telefonu.

## Probanje na računaru
Otvori folder u VS Code-u, instaliraj ekstenziju **Live Server** i klikni **Go Live**. Može i samo dupli klik na `index.html`.
