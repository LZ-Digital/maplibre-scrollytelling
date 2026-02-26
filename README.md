# Scrollytelling-Prototyp: Heatmap mit MapLibre & Scrollama

Demonstrations-Prototyp für eine scrollgesteuerte Kartenvisualisierung: Heatmap mit Standortdaten, die beim Scrollen auf feste Punkte zoomen.

## Tech-Stack

- **MapLibre GL JS** – Karte und Heatmap-Layer
- **Scrollama.js** – Scrollytelling (Step-Trigger beim Scrollen)
- **Kartenkacheln:** [OpenFreeMap](https://openfreemap.org/) (Style „Bright“) – freie Vektorkarten mit Straßen, Flächen und Gebäuden, ohne API-Key.
- Kein Build-Schritt; Einbindung im CMS über statische Dateien möglich (z.B. iframe oder eingebettete Assets).

## Projektstruktur

```
maplibre-scrollytelling/
├── index.html              # Demo-Seite (Karte + Scroll-Steps)
├── embed.js                # Loader für Script-Embed (optional)
├── data/
│   └── heatmap-data.geojson # Dummy-GeoJSON mit Punkten für die Heatmap
├── .nojekyll               # Damit GitHub Pages kein Jekyll verwendet
└── README.md
```

## Auslieferung mit GitHub Pages

**Ja, die Demo ist für GitHub Pages vorbereitet.** Nach dem Push des Repos und Aktivierung von Pages wird die Seite unter einer festen URL ausgeliefert und kann per Embed-Code im CMS eingebunden werden.

### Einrichtung (einmalig)

1. Repository auf GitHub pushen (falls noch nicht geschehen).
2. Im Repo: **Settings** → **Pages**.
3. Unter **Build and deployment**:
   - **Source:** „Deploy from a branch“
   - **Branch:** `main` (oder euer Standard-Branch)
   - **Folder:** „/ (root)“
4. Speichern. Nach kurzer Zeit ist die Seite erreichbar unter:
   - **URL:** `https://<USERNAME>.github.io/maplibre-scrollytelling/`  
   („USERNAME“ durch den GitHub-Benutzernamen bzw. die Organisation ersetzen, „maplibre-scrollytelling“ durch den tatsächlichen Repo-Namen, falls abweichend.)

Die Datei **`.nojekyll`** liegt bereits im Projekt; damit nutzt GitHub Pages kein Jekyll und liefert alle Dateien unverändert aus.

### Embed-Codes für GitHub-Pages-URL

Basis-URL annehmen: `https://IHR-GITHUB-USERNAME.github.io/maplibre-scrollytelling/`

**Variante 1 – iframe:**
```html
<iframe title="Heatmap Scrollytelling" aria-label="Karte Heatmap Deutschland" src="https://IHR-GITHUB-USERNAME.github.io/maplibre-scrollytelling/" scrolling="yes" frameborder="0" style="width: 100%; min-width: 100% !important; border: none;" height="700"></iframe>
```

**Variante 2 – Script + Container:**
```html
<div style="min-height: 700px" id="maplibre-scrollytelling-embed"></div>
<script type="text/javascript" defer src="https://IHR-GITHUB-USERNAME.github.io/maplibre-scrollytelling/embed.js" charset="utf-8" data-target="#maplibre-scrollytelling-embed" data-src="https://IHR-GITHUB-USERNAME.github.io/maplibre-scrollytelling/"></script>
<noscript><p>Für die Karte wird JavaScript benötigt. <a href="https://IHR-GITHUB-USERNAME.github.io/maplibre-scrollytelling/">Visualisierung direkt öffnen</a>.</p></noscript>
```

`IHR-GITHUB-USERNAME` und ggf. den Repo-Namen anpassen.

## Lokal testen

Wegen möglicher CORS-Einschränkungen beim Laden von `data/heatmap-data.geojson` am besten einen kleinen lokalen Webserver nutzen:

```bash
# Mit Python 3
python -m http.server 8080

# Oder mit Node (npx)
npx serve -p 8080
```

Dann im Browser: `http://localhost:8080`

## Embed-Codes fürs CMS

Da im CMS keine Seiten direkt gehostet werden, die Visualisierung aber woanders (eigener Server, CDN, GitHub Pages o.ä.) liegt, wird sie per Embed-Code eingebunden. Zwei Varianten (analog zu Datawrapper):

### Variante 1: iframe (einfach)

Inhalt der Seite durch **eine** URL ersetzen (`https://IHR-HOST/pfad/zur/visualisierung/`).

```html
<iframe title="Heatmap Scrollytelling" aria-label="Karte Heatmap Deutschland" src="https://IHR-HOST/pfad/zur/visualisierung/" scrolling="yes" frameborder="0" style="width: 100%; min-width: 100% !important; border: none;" height="700"></iframe>
```

**Hinweis bei CMS-Einbindung:** Viele CMS setzen den Embed-Code zusätzlich in einen Wrapper (z. B. `<div class="MediaWrapper_xxLarge">…</div>`). Das verändert die Scrollama-Logik im iframe nicht direkt. **Allerdings** hat die reine iframe-Variante kein Scroll-Capture: Das Mausrad scrollt die **umgebende Seite**, nicht den Inhalt im iframe – das Scroll-Verhalten wirkt dann inkonsistent (mal Seite, mal Embed). Für zuverlässiges Anhalten der Seitenscroll beim Embed und Scrollen nur im Scrollytelling **Variante 2 (Script + Container)** verwenden, sofern das CMS Script-Einbindung erlaubt.

### Variante 2: Script + Container (wie Datawrapper)

Container-Div mit fester Mindesthöhe, Script lädt die Seite in ein iframe und fügt es in den Container ein. `data-target` = Selektor des Containers, `data-src` = URL der Visualisierung (Ordner oder `index.html`). Optional: `data-offset-top="100"` = Versatz in px (z. B. Höhe eines Sticky-Headers), ab dem das Embed als „erreicht“ gilt (Standard: 0). `data-wheel-sensitivity="2.5"` = Multiplikator für Mausrad (höher = größere Scroll-Sprünge, Standard: 2.5). `data-touch-sensitivity="2"` = Multiplikator für Touch-Swipe (Standard: 2).  
**Scroll-Capture:** Beim Scrollen der Seite wird zuerst die Seite gescrollt, bis das Embed den oberen Rand (minus Versatz) erreicht; dann scrollt nur noch im Embed, bis dessen Ende – danach scrollt die Seite wieder.  
*embed.js* ermittelt automatisch den tatsächlichen Scroll-Container der Seite (auch bei CMS mit innerem Scroll-Bereich, z. B. `overflow` auf Artikel-Container), damit das Anhalten am Embed zuverlässig funktioniert.

```html
<div style="min-height: 700px" id="maplibre-scrollytelling-embed"></div>
<script type="text/javascript" defer src="https://IHR-HOST/pfad/embed.js" charset="utf-8" data-target="#maplibre-scrollytelling-embed" data-src="https://IHR-HOST/pfad/"></script>
<noscript><p>Für die Karte wird JavaScript benötigt. <a href="https://IHR-HOST/pfad/">Visualisierung direkt öffnen</a>.</p></noscript>
```

**Hinweis:** `https://IHR-HOST/pfad/` überall durch die tatsächliche Basis-URL ersetzen, unter der ihr `index.html`, `embed.js` und `data/` ausgeliefert werden.

## CMS-Einbindung (Hosting)

- `index.html`, `embed.js` und der Ordner `data/` werden auf einem beliebigen Webserver/CDN bereitgestellt; das CMS enthält nur den Embed-Code (iframe oder Script+Div).
- Pfad zur GeoJSON-Datei in `index.html` ist relativ: `data/heatmap-data.geojson`. Beim Deploy in einen Unterordner bleibt die Struktur erhalten.
- Externe Abhängigkeiten nur über CDN (MapLibre, Scrollama); keine Installation nötig.

## GeoJSON-Format

`data/heatmap-data.geojson` ist eine **FeatureCollection** mit **Point**-Features. Jeder Punkt hat:

- `geometry`: `Point` mit `[Längengrad, Breitengrad]`
- `properties`: z.B. `name`, `intensity` (wird für die Heatmap-Stärke genutzt)

Eigene Daten: gleiches Schema beibehalten, `intensity` (Zahl) für die Gewichtung der Heatmap setzen.
