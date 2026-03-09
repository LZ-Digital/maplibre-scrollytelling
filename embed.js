/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 *
 * Rock-solid sticky anchor: isStuck() prüft synchron per getBoundingClientRect(),
 * ob der Container exakt am Viewport-Rand klebt. Bei same-origin iframes wird der
 * Scroll-Zustand (atTop/atBottom) direkt aus dem iframe-DOM gelesen statt per
 * asynchronem postMessage – das eliminiert die Race-Condition vollständig.
 *
 * Script-Attribute:
 *   data-target           – Container-Selektor (Pflicht)
 *   data-src              – URL der index.html (Pflicht)
 *   data-offset-top       – Versatz in px bei fixem Header (Standard: 0)
 *   data-wheel-sensitivity– Mausrad-Multiplikator (Standard: 2.5)
 *   data-touch-sensitivity– Touch-Swipe-Multiplikator (Standard: 2)
 *   data-debug            – "true"/"1" für Konsolen-Logs
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  if (!targetSelector || !src) return;

  var topOffset = parseInt(script.getAttribute('data-offset-top'), 10);
  if (isNaN(topOffset)) topOffset = 0;

  var touchSensitivity = parseFloat(script.getAttribute('data-touch-sensitivity'));
  if (isNaN(touchSensitivity) || touchSensitivity <= 0) touchSensitivity = 2;

  var wheelSensitivity = parseFloat(script.getAttribute('data-wheel-sensitivity'));
  if (isNaN(wheelSensitivity) || wheelSensitivity <= 0) wheelSensitivity = 2.5;

  var debug = /^(1|true|yes)$/i.test(script.getAttribute('data-debug') || '');

  function log() {
    if (!debug) return;
    console.log.apply(console, ['[ScrollyEmbed]'].concat(Array.prototype.slice.call(arguments)));
  }

  var container = document.querySelector(targetSelector);
  if (!container) { log('Container nicht gefunden:', targetSelector); return; }

  /* ── Sticky-Container ────────────────────────────────────────────── */
  container.style.position = '-webkit-sticky';
  container.style.position = 'sticky';
  container.style.top = topOffset + 'px';
  container.style.zIndex = '10';

  /* ── iframe ──────────────────────────────────────────────────────── */
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);

  var iframe = document.createElement('iframe');
  iframe.title = 'Heatmap Scrollytelling – Karte';
  iframe.setAttribute('aria-label', 'Interaktive Heatmap-Karte Deutschland');
  iframe.src = src;
  iframe.frameBorder = '0';
  iframe.style.cssText = 'width:100%;min-width:100%;border:none;height:' +
    (isMobile ? '85vh' : '700px') + ';min-height:400px;display:block;';
  container.appendChild(iframe);

  /* ── Overlay (fängt Wheel-/Touch-Events über dem iframe ab) ──────── */
  var overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:auto;z-index:1;';
  container.appendChild(overlay);

  /* ── iframe-Origin für postMessage-Fallback ───────────────────────── */
  var iframeOrigin;
  try { iframeOrigin = new URL(src, document.location.href).origin; }
  catch (e) { iframeOrigin = '*'; }

  /* ── Scroll-Zustand: same-origin direkt, cross-origin per postMessage */

  /** Inneres Scroll-Element des iframes (nur same-origin). */
  function getInnerScroll() {
    try {
      var doc = iframe.contentDocument;
      return doc ? doc.getElementById('scroll-container') : null;
    } catch (e) { return null; }
  }

  /* Async-Fallback-State für cross-origin */
  var asyncAtTop = true;
  var asyncAtBottom = false;

  window.addEventListener('message', function (e) {
    if (iframeOrigin !== '*' && e.origin !== iframeOrigin) return;
    if (!e.data || e.data.type !== 'scrollState') return;
    asyncAtTop = !!e.data.atTop;
    asyncAtBottom = !!e.data.atBottom;
    log('postMessage scrollState atTop=' + asyncAtTop + ' atBottom=' + asyncAtBottom);
  });

  /**
   * Liefert den aktuellen Scroll-Zustand des iframes.
   * Bei same-origin: synchron direkt aus dem DOM.
   * Bei cross-origin: async postMessage-State (best-effort).
   */
  function scrollState() {
    var el = getInnerScroll();
    if (el) {
      var st = el.scrollTop;
      var sh = el.scrollHeight;
      var ch = el.clientHeight;
      return { atTop: st <= 2, atBottom: st + ch >= sh - 2 };
    }
    return { atTop: asyncAtTop, atBottom: asyncAtBottom };
  }

  /** Scrollt den iframe-Inhalt um deltaY Pixel. */
  function scrollIframe(deltaY) {
    var el = getInnerScroll();
    if (el) {
      /* same-origin: direkte DOM-Manipulation, synchron und ohne Latenz */
      el.scrollTop += deltaY;
      return;
    }
    /* cross-origin: postMessage-Fallback */
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'scroll', deltaY: deltaY },
        iframeOrigin === '*' ? '*' : iframeOrigin
      );
    }
  }

  /* ── Capture-Logik ───────────────────────────────────────────────── */

  /**
   * Prüft synchron, ob der Container aktuell am Viewport-Rand klebt.
   * 5 px Toleranz für Float-Ungenauigkeiten; kein fuzzy Vorausgreifen mehr.
   */
  function isStuck() {
    return container.getBoundingClientRect().top <= topOffset + 5;
  }

  /**
   * Entscheidet, ob dieses Scroll-Delta vom iframe übernommen werden soll.
   * Bedingungen:
   *   1. Container muss tatsächlich am Rand kleben (isStuck).
   *   2. iframe darf noch nicht am jeweiligen Ende angekommen sein.
   */
  function shouldCapture(deltaY) {
    if (!isStuck()) return false;
    var state = scrollState();
    if (deltaY > 0 && state.atBottom) return false; /* iframe-Ende → Seite weiter */
    if (deltaY < 0 && state.atTop)    return false; /* iframe-Anfang → Seite zurück */
    return true;
  }

  function handleWheel(e) {
    if (!shouldCapture(e.deltaY)) return;
    e.preventDefault();
    e.stopPropagation();
    var scaled = e.deltaY * wheelSensitivity;
    log('wheel captured deltaY=' + e.deltaY + ' scaled=' + scaled);
    scrollIframe(scaled);
  }

  /* Wheel-Listener: capture-Phase auf window fängt auch Events über dem iframe ab */
  overlay.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('wheel', handleWheel, { passive: false, capture: true });

  /* ── Touch ───────────────────────────────────────────────────────── */
  var touchStartY = 0;

  overlay.addEventListener('touchstart', function (e) {
    if (e.changedTouches && e.changedTouches[0]) {
      touchStartY = e.changedTouches[0].clientY;
    }
  }, { passive: true });

  overlay.addEventListener('touchmove', function (e) {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    var ty = e.changedTouches[0].clientY;
    var deltaY = (touchStartY - ty) * touchSensitivity;
    touchStartY = ty;
    if (!shouldCapture(deltaY)) return;
    e.preventDefault();
    scrollIframe(deltaY);
  }, { passive: false, capture: true });

  /* ── Resize ──────────────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    var mobile = navigator.maxTouchPoints > 0 &&
      window.matchMedia('(max-width: 768px)').matches;
    iframe.style.height = mobile ? '85vh' : '700px';
  });

  log('Initialisiert. target=' + targetSelector + ' src=' + src + ' topOffset=' + topOffset);
})();
