/**
 * Map-Only Embed Loader (Option 1: API-gesteuert)
 *
 * Zwei Modi:
 * - capture (Default): Seite scrollen → am Embed einrasten → im Embed scrollen → Seite weiterscrollen
 * - overlay: Steps overlay die Karte beim Seitenscroll (kein innerer Scroll)
 *
 * Script-Attribute:
 * - data-target, data-src, data-step-selector, data-scrolly-section
 * - data-scroll-mode: "capture" (Default) oder "overlay"
 * - data-scroll-container, data-offset, data-wheel-sensitivity, data-touch-sensitivity
 * - data-offset-top, data-capture-tolerance, data-debug
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  var stepSelector = script.getAttribute('data-step-selector') || '[data-lng][data-lat][data-zoom]';
  var scrollySectionSelector = script.getAttribute('data-scrolly-section');
  var scrollContainerSelector = script.getAttribute('data-scroll-container');
  var scrollMode = (script.getAttribute('data-scroll-mode') || 'capture').toLowerCase();
  var topOffset = parseInt(script.getAttribute('data-offset-top'), 10) || 0;
  var wheelSensitivity = parseFloat(script.getAttribute('data-wheel-sensitivity'), 10) || 2.5;
  if (isNaN(wheelSensitivity) || wheelSensitivity <= 0) wheelSensitivity = 2.5;
  var touchSensitivity = parseFloat(script.getAttribute('data-touch-sensitivity'), 10) || 2;
  if (isNaN(touchSensitivity) || touchSensitivity <= 0) touchSensitivity = 2;
  var captureTolerance = parseInt(script.getAttribute('data-capture-tolerance'), 10);
  if (isNaN(captureTolerance) || captureTolerance < 0) captureTolerance = 180;
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
    log('Keine Steps gefunden');
    return;
  }

  var stepsWrapper = (container.parentElement && container.parentElement.querySelector('.steps-wrapper')) ||
    (container.nextElementSibling && container.nextElementSibling.querySelector(stepSelector) ? container.nextElementSibling : null);

  var scrollySection = scrollySectionSelector
    ? document.querySelector(scrollySectionSelector)
    : container.closest('.scrolly-section') || container.parentElement;

  if (typeof scrollama === 'undefined') {
    console.warn('[MapOnlyEmbed] Scrollama nicht geladen.');
  }

  var iframeOrigin = new URL(src, document.location.href).origin;

  function findScrollContainer(el) {
    if (scrollContainerSelector) return document.querySelector(scrollContainerSelector);
    var n = el || container;
    while (n && n !== document.body) {
      n = n.parentElement;
      if (n) {
        try {
          var s = window.getComputedStyle(n);
          var o = s.overflowY || s.overflow;
          if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight)
            return n;
        } catch (e) {}
      }
    }
    return document.scrollingElement || document.documentElement;
  }

  var iframe = document.createElement('iframe');
  iframe.title = 'Heatmap Scrollytelling – Karte';
  iframe.setAttribute('aria-label', 'Interaktive Heatmap-Karte Deutschland');
  iframe.src = src;
  iframe.frameBorder = '0';
  iframe.style.cssText = 'width:100%;min-width:100%;border:none;height:100vh;min-height:400px;display:block;';

  function sendFlyTo(lng, lat, zoom, duration) {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'flyTo', lng: lng, lat: lat, zoom: zoom, duration: duration || 1200 }, iframeOrigin);
    }
  }

  iframe.addEventListener('load', function () {
    var first = steps[0];
    if (first) {
      var lng = parseFloat(first.getAttribute('data-lng'), 10);
      var lat = parseFloat(first.getAttribute('data-lat'), 10);
      var zoom = parseFloat(first.getAttribute('data-zoom'), 10);
      if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) sendFlyTo(lng, lat, zoom, 0);
    }
  });

  if (scrollMode === 'capture' && stepsWrapper) {
    var pageScroll = findScrollContainer();
    var embedWrapper = scrollySection || container.parentElement;
    embedWrapper.classList.add('maplibre-scrollytelling');
    embedWrapper.classList.add('maplibre-scrollytelling-capture');

    var innerScroll = document.createElement('div');
    innerScroll.className = 'maplibre-inner-scroll';
    innerScroll.style.cssText = 'overflow-y:auto;overflow-x:hidden;height:100vh;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;';

    var graphic = document.createElement('div');
    graphic.className = 'maplibre-graphic';
    graphic.style.cssText = 'position:sticky;top:0;left:0;width:100%;height:100vh;z-index:0;';

    container.style.cssText = 'width:100%;height:100vh;min-height:400px;';
    container.appendChild(iframe);
    graphic.appendChild(container);

    innerScroll.appendChild(graphic);
    if (stepsWrapper.parentNode === embedWrapper) {
      embedWrapper.removeChild(stepsWrapper);
    }
    innerScroll.appendChild(stepsWrapper);

    embedWrapper.style.position = '-webkit-sticky';
    embedWrapper.style.position = 'sticky';
    embedWrapper.style.top = topOffset + 'px';
    embedWrapper.style.height = '100vh';
    embedWrapper.style.minHeight = '400px';
    embedWrapper.style.zIndex = '10';
    embedWrapper.innerHTML = '';
    embedWrapper.appendChild(innerScroll);
    var overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1;';
    embedWrapper.appendChild(overlay);

    function getAtTopBottom() {
      var st = innerScroll.scrollTop;
      var sh = innerScroll.scrollHeight;
      var ch = innerScroll.clientHeight;
      return { atTop: st <= 2, atBottom: st + ch >= sh - 2 };
    }

    /**
     * Prüft synchron, ob der embedWrapper tatsächlich am Viewport-Rand klebt.
     * 5 px Toleranz für Float-Ungenauigkeiten; kein fuzzy Vorausgreifen mehr.
     */
    function isStuck() {
      return embedWrapper.getBoundingClientRect().top <= topOffset + 5;
    }

    function shouldCapture(deltaY) {
      if (!isStuck()) return false;
      var pos = getAtTopBottom();
      if (deltaY > 0 && pos.atBottom) return false; /* innerScroll-Ende → Seite weiter */
      if (deltaY < 0 && pos.atTop)    return false; /* innerScroll-Anfang → Seite zurück */
      return true;
    }

    function handleWheel(e) {
      if (!shouldCapture(e.deltaY)) return;
      e.preventDefault();
      e.stopPropagation();
      innerScroll.scrollTop += e.deltaY * wheelSensitivity;
    }

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    var touchStartY = 0;
    overlay.addEventListener('touchstart', function (e) {
      if (e.changedTouches && e.changedTouches[0]) touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    overlay.addEventListener('touchmove', function (e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var ty = e.changedTouches[0].clientY;
      var dy = (touchStartY - ty) * touchSensitivity;
      touchStartY = ty;
      if (!shouldCapture(dy)) return;
      e.preventDefault();
      innerScroll.scrollTop += dy;
    }, { passive: false });

    var scrollamaContainer = innerScroll;
    if (typeof scrollama !== 'undefined') {
      var sc = scrollama();
      sc.setup({ step: stepSelector, offset: offset, progress: false, container: scrollamaContainer })
        .onStepEnter(function (r) {
          var el = r.element;
          var lng = parseFloat(el.getAttribute('data-lng'), 10);
          var lat = parseFloat(el.getAttribute('data-lat'), 10);
          var zoom = parseFloat(el.getAttribute('data-zoom'), 10);
          if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) sendFlyTo(lng, lat, zoom);
        });
    }

    log('Capture-Modus: Initialisiert,', steps.length, 'Steps');
    return;
  }

  container.appendChild(iframe);
  var scrollContainer = findScrollContainer();
  scrollySection && scrollySection.classList.add('maplibre-scrollytelling');
  if (scrollySection) scrollySection.style.height = steps.length * 100 + 'vh';

  container.style.position = 'sticky';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.zIndex = '0';

  if (typeof scrollama !== 'undefined') {
    var sc = scrollama();
    sc.setup({ step: stepSelector, offset: offset, progress: false, container: scrollContainer })
      .onStepEnter(function (r) {
        var el = r.element;
        var lng = parseFloat(el.getAttribute('data-lng'), 10);
        var lat = parseFloat(el.getAttribute('data-lat'), 10);
        var zoom = parseFloat(el.getAttribute('data-zoom'), 10);
        if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) sendFlyTo(lng, lat, zoom);
      });
  }

  log('Overlay-Modus: Initialisiert,', steps.length, 'Steps');
})();
