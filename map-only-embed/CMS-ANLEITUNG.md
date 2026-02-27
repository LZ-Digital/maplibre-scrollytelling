# CMS-Einbindung: Map-Only Embed

## 1. HTML-Struktur im Artikel

Die folgende Struktur muss **im Artikel** vorhanden sein (z. B. als HTML-Block oder vordefinierte Vorlage):

```html
<div class="scrolly-section">
  <div id="map-embed"></div>
  <div class="steps-wrapper">
    <div class="step" data-lng="10.45" data-lat="51.17" data-zoom="5">
      <div class="step-content">
        <h2>Standorte in Deutschland</h2>
        <p>Scrollen Sie, um in die Ballungsräume zu zoomen.</p>
      </div>
    </div>
    <div class="step" data-lng="11.576" data-lat="48.137" data-zoom="12">
      <div class="step-content">
        <h2>München</h2>
        <p>Starker Fokus auf Zentrum und Marienplatz.</p>
      </div>
    </div>
    <!-- weitere Steps mit data-lng, data-lat, data-zoom -->
  </div>
</div>
```

**Wichtig:**
- `#map-embed` = Container für die Karte (ID muss exakt sein)
- `.scrolly-section` = Wrapper (Höhe wird automatisch berechnet)
- `.steps-wrapper` = Container für alle Steps
- Jeder `.step` braucht `data-lng`, `data-lat`, `data-zoom`

## 2. Embed-Code im CMS

Als **Embed** oder **Custom HTML** einfügen:

```html
<link rel="stylesheet" href="https://lz-digital.github.io/maplibre-scrollytelling/map-only-embed/embed-cms.css" />
<script src="https://unpkg.com/scrollama@3.2.0/build/scrollama.min.js"></script>
<script
  type="text/javascript"
  defer
  src="https://lz-digital.github.io/maplibre-scrollytelling/map-only-embed/embed-map.js"
  charset="utf-8"
  data-target="#map-embed"
  data-src="https://lz-digital.github.io/maplibre-scrollytelling/map-only-embed/map-only.html"
  data-step-selector=".step[data-lng]"
  data-position="fixed"
></script>
<noscript>
  <p>Für die Karte wird JavaScript benötigt. <a href="https://lz-digital.github.io/maplibre-scrollytelling/map-only-embed/map-only.html">Karte direkt öffnen</a>.</p>
</noscript>
```

**Hinweis:** Wenn Scrollama bereits global auf der Seite geladen ist, kann die zweite Zeile (`<script src="...scrollama...">`) entfallen.

## 3. Optionale Anpassungen

| Attribut | Beschreibung |
|----------|--------------|
| `data-position` | **"fixed"** (Standard für CMS) – Karte bleibt im Viewport, Steps scrollen darüber. **"sticky"** – klassisches Sticky-Verhalten |
| `data-scroll-container` | Falls das CMS einen eigenen Scroll-Container hat (z. B. `#article-body`), hier den Selektor angeben. Wird sonst automatisch erkannt. |
| `data-scrolly-section` | Falls die Scrolly-Section einen anderen Selektor hat |
| `data-offset` | Scrollama-Offset 0–1 (Standard: 0.5) |
| `data-debug="true"` | Debug-Logs in der Konsole (zeigt u. a. den erkannten Scroll-Container) |

**Beispiel mit eigenem Scroll-Container:**
```html
<script ... data-scroll-container="#article-scroll" ...></script>
```

## 4. Häufige CMS-Probleme

### Karte erscheint nicht
- Prüfen, ob `#map-embed` im DOM existiert
- Browser-Konsole öffnen (F12) – Fehlermeldungen prüfen
- `data-debug="true"` setzen für detaillierte Logs

### Scroll funktioniert nicht
- CMS hat oft einen eigenen Scroll-Container (z. B. `overflow: auto` auf einem Wrapper)
- `data-scroll-container` mit dem passenden Selektor setzen
- Im DOM prüfen, welches Element tatsächlich scrollt

### Styles kollidieren
- Die CMS-Styles sind unter `.maplibre-scrollytelling` gekapselt
- Das Script fügt diese Klasse automatisch der `.scrolly-section` hinzu
