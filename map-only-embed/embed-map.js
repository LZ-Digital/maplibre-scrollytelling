/**
 * Map-Only Embed Loader (Option 1: API-gesteuert)
 *
 * Bindet die Heatmap-Karte als iframe ein. Die Steps liegen auf der Host-Seite.
 * Bei Scroll-Trigger (Scrollama) wird flyTo an das iframe gesendet.
 *
 * Script-Attribute:
 * - data-target: CSS-Selektor des Map-Containers (z.B. "#map-embed")
 * - data-src: URL von map-only.html (z.B. "https://.../map-only-embed/map-only.html")
 * - data-step-selector: Selektor für Step-Elemente (Default: "[data-lng][data-lat][data-zoom]")
 * - data-scroll-container: Selektor des Scroll-Containers (Default: null = document.scrollingElement)
 * - data-offset: Scrollama offset 0–1 (Default: 0.5)
 * - data-debug: "true" für Debug-Logs
 *
 * Voraussetzung: Scrollama muss auf der Host-Seite geladen sein.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  var stepSelector = script.getAttribute('data-step-selector') || '[data-lng][data-lat][data-zoom]';
  var scrollContainerSelector = script.getAttribute('data-scroll-container');
  var offset = parseFloat(script.getAttribute('data-offset'), 10);
  if (isNaN(offset) || offset < 0 || offset > 1) offset = 0.5;
  var debug = /^(1|true|yes)$/i.test(script.getAttribute('data-debug') || '');

  if (!targetSelector || !src) return;

  function log() {
    if (!debug || !console || !console.log) return;
    var a = [];
    for (var i = 0; i < arguments.length; i++) a.push(arguments[i]);
    console.log.apply(console, ['[MapOnlyEmbed]'].concat(a));
  }

  var container = document.querySelector(targetSelector);
  if (!container) {
    log('Container nicht gefunden:', targetSelector);
    return;
  }

  var steps = document.querySelectorAll(stepSelector);
  if (!steps.length) {
    log('Keine Steps gefunden mit Selektor:', stepSelector);
    return;
  }

  if (typeof scrollama === 'undefined') {
    console.warn('[MapOnlyEmbed] Scrollama nicht geladen. Bitte scrollama.min.js einbinden.');
    return;
  }

  var scrollContainer = scrollContainerSelector
    ? document.querySelector(scrollContainerSelector)
    : (document.scrollingElement || document.documentElement);

  if (!scrollContainer) {
    log('Scroll-Container nicht gefunden');
    return;
  }

  var iframeOrigin = new URL(src, document.location.href).origin;

  container.style.position = 'sticky';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.zIndex = '10';

  var iframe = document.createElement('iframe');
  iframe.title = 'Heatmap Scrollytelling – Karte';
  iframe.setAttribute('aria-label', 'Interaktive Heatmap-Karte Deutschland');
  iframe.src = src;
  iframe.frameBorder = '0';
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
  iframe.style.cssText = 'width:100%;min-width:100%;border:none;height:' + (isMobile ? '85vh' : '70vh') + ';min-height:400px;display:block;';

  container.appendChild(iframe);

  window.addEventListener('resize', function () {
    var mobile = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
    iframe.style.height = mobile ? '85vh' : '70vh';
  });

  function sendFlyTo(lng, lat, zoom, duration) {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'flyTo',
      lng: lng,
      lat: lat,
      zoom: zoom,
      duration: duration || 1200
    }, iframeOrigin);
    log('flyTo gesendet', lng, lat, zoom);
  }

  var scroller = scrollama();
  scroller
    .setup({
      step: stepSelector,
      offset: offset,
      progress: false,
      container: scrollContainer
    })
    .onStepEnter(function (response) {
      var el = response.element;
      var lng = parseFloat(el.getAttribute('data-lng'), 10);
      var lat = parseFloat(el.getAttribute('data-lat'), 10);
      var zoom = parseFloat(el.getAttribute('data-zoom'), 10);
      if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) {
        sendFlyTo(lng, lat, zoom);
      }
    });

  iframe.addEventListener('load', function () {
    var first = steps[0];
    if (first) {
      var lng = parseFloat(first.getAttribute('data-lng'), 10);
      var lat = parseFloat(first.getAttribute('data-lat'), 10);
      var zoom = parseFloat(first.getAttribute('data-zoom'), 10);
      if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) {
        sendFlyTo(lng, lat, zoom, 0);
      }
    }
  });

  log('Initialisiert:', steps.length, 'Steps, Container:', targetSelector);
})();
