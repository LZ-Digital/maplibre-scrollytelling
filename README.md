# Scrollytelling-Prototyp: Heatmap mit MapLibre & Scrollama

Demonstrations-Prototyp für eine scrollgesteuerte Kartenvisualisierung: Heatmap mit Standortdaten, die beim Scrollen auf feste Punkte zoomen.

## Tech-Stack

- **MapLibre GL JS** – Karte und Heatmap-Layer
- **Scrollama.js** – Scrollytelling (Step-Trigger beim Scrollen)
- Kein Build-Schritt; Einbindung im CMS über statische Dateien möglich (z.B. iframe oder eingebettete Assets).

## Projektstruktur

```
maplibre-scrollytelling/
├── index.html              # Demo-Seite (Karte + Scroll-Steps)
├── data/
│   └── heatmap-data.geojson # Dummy-GeoJSON mit Punkten für die Heatmap
└── README.md
```

## Lokal testen

Wegen möglicher CORS-Einschränkungen beim Laden von `data/heatmap-data.geojson` am besten einen kleinen lokalen Webserver nutzen:

```bash
# Mit Python 3
python -m http.server 8080

# Oder mit Node (npx)
npx serve -p 8080
```

Dann im Browser: `http://localhost:8080`

## CMS-Einbindung

- `index.html` und der Ordner `data/` können 1:1 ins CMS übernommen werden.
- Pfad zur GeoJSON-Datei in `index.html` ist relativ: `data/heatmap-data.geojson`. Beim Einbinden in eine Unterordner-Struktur ggf. anpassen (z.B. `./data/heatmap-data.geojson` oder absoluter Pfad).
- Externe Abhängigkeiten nur über CDN (MapLibre, Scrollama); keine Installation nötig.

## GeoJSON-Format

`data/heatmap-data.geojson` ist eine **FeatureCollection** mit **Point**-Features. Jeder Punkt hat:

- `geometry`: `Point` mit `[Längengrad, Breitengrad]`
- `properties`: z.B. `name`, `intensity` (wird für die Heatmap-Stärke genutzt)

Eigene Daten: gleiches Schema beibehalten, `intensity` (Zahl) für die Gewichtung der Heatmap setzen.
