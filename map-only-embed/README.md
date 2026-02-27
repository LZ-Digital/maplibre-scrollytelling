# Map-Only Embed (Option 1: API-gesteuert)

Dieser Ordner enthält eine alternative Embed-Variante: Die **Karte** wird als iframe eingebettet, die **Steps** liegen auf der Host-Seite. Beim Scrollen sendet die Host-Seite `flyTo`-Befehle an die Karte.

## Vorteile

- **Redaktionelle Kontrolle:** Texte und Steps kommen aus dem CMS
- **Kein Scroll-Capture:** Keine Konflikte mit CMS-Scroll-Verhalten
- **Ein Scroll-Flow:** Host-Seite scrollt, Karte reagiert auf Step-Trigger

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `map-only.html` | Nur die Karte, empfängt `flyTo` per postMessage |
| `embed-map.js` | Loader für die Host-Seite: iframe + Scrollama-Integration |
| `demo.html` | Beispiel-Host-Seite mit Intro, Steps und Outro |

## Einbindung im CMS

### 1. Voraussetzungen

- **Scrollama** muss auf der Host-Seite geladen sein:
  ```html
  <script src="https://unpkg.com/scrollama@3.2.0/build/scrollama.min.js"></script>
  ```

### 2. HTML-Struktur

Die Steps müssen **über** der Karte liegen (höherer z-index) und per negativem `margin-top` über die Karte gezogen werden:

```html
<!-- Map-Container (sticky, z-index: 0) -->
<div id="map-embed"></div>

<!-- Steps-Wrapper: z-index: 1, margin-top: -100vh (Map ist 100vh) -->
<div class="steps-wrapper" style="position:relative;z-index:1;margin-top:-100vh;pointer-events:none;">
  <div class="step" style="pointer-events:auto;" data-lng="10.45" data-lat="51.17" data-zoom="5">
    <h2>Standorte in Deutschland</h2>
    <p>Scrollen Sie, um in die Ballungsräume zu zoomen.</p>
  </div>
  <div class="step" style="pointer-events:auto;" data-lng="11.576" data-lat="48.137" data-zoom="12">
    <h2>München</h2>
    <p>Starker Fokus auf Zentrum und Marienplatz.</p>
  </div>
  <!-- weitere Steps -->
</div>
```

### 3. Embed-Script

```html
<script
  type="text/javascript"
  defer
  src="https://IHR-HOST/maplibre-scrollytelling/map-only-embed/embed-map.js"
  charset="utf-8"
  data-target="#map-embed"
  data-src="https://IHR-HOST/maplibre-scrollytelling/map-only-embed/map-only.html"
  data-step-selector=".step[data-lng]"
></script>
```

### 4. Script-Attribute

| Attribut | Pflicht | Beschreibung |
|----------|---------|--------------|
| `data-target` | ja | CSS-Selektor des Map-Containers |
| `data-src` | ja | URL von `map-only.html` |
| `data-step-selector` | nein | Selektor für Steps (Default: `[data-lng][data-lat][data-zoom]`) |
| `data-scroll-container` | nein | Selektor des Scroll-Containers (Default: `document.scrollingElement`) |
| `data-offset` | nein | Scrollama offset 0–1 (Default: 0.5) |
| `data-debug` | nein | `"true"` für Debug-Logs in der Konsole |

## Lokal testen

Mit lokalem Webserver (wegen CORS für GeoJSON):

```bash
# Projekt-Root
cd maplibre-scrollytelling
python -m http.server 8080
# oder: npx serve -p 8080
```

Dann im Browser: `http://localhost:8080/map-only-embed/demo.html`

## GitHub Pages

Nach dem Deploy ist die Demo erreichbar unter:

- Demo: `https://IHR-USER.github.io/maplibre-scrollytelling/map-only-embed/demo.html`
- Map-only: `https://IHR-USER.github.io/maplibre-scrollytelling/map-only-embed/map-only.html`

Die `data-src`-URL muss entsprechend angepasst werden.
