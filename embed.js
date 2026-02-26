/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.
 * Scroll-Capture: Sobald der obere Rand des Embeds data-offset-top erreicht, scrollt nur
 * noch im Embed. Am Ende scrollt die Seite wieder.
 * data-offset-top: Abstand in px vom oberen Viewport-Rand (z. B. "0" oder "64" bei fixem Header).
 * data-touch-sensitivity: Multiplikator für Touch-Swipe (Standard: 2, höher = empfindlicher).
 * data-wheel-sensitivity: Multiplikator für Mausrad (Standard: 2.5, höher = größere Sprünge bei weniger Bewegung).
 * data-debug: Bei "true" oder "1" werden Debug-Logs in der Konsole ausgegeben (Scroll-/Wheel-/embedReached-Zustand).
 * „embedReached“ wird per Scroll-Listener an allen Vorfahren des Containers plus Intersection Observer
 * aktualisiert, damit es auch bei CMS mit beliebigem Scroll-Container (z. B. overflow auf Wrapper) funktioniert.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  var topOffset = parseInt(script.getAttribute('data-offset-top'), 10);
  if (isNaN(topOffset)) topOffset = 0;
  var touchSensitivity = parseFloat(script.getAttribute('data-touch-sensitivity'), 10);
  if (isNaN(touchSensitivity) || touchSensitivity <= 0) touchSensitivity = 2;
  var wheelSensitivity = parseFloat(script.getAttribute('data-wheel-sensitivity'), 10);
  if (isNaN(wheelSensitivity) || wheelSensitivity <= 0) wheelSensitivity = 2.5;
  var debug = /^(1|true|yes)$/i.test(script.getAttribute('data-debug') || '');
  if (!targetSelector || !src) return;

  function log() {
    if (!debug || !console || !console.log) return;
    var a = [];
    for (var i = 0; i < arguments.length; i++) a.push(arguments[i]);
    console.log.apply(console, ['[ScrollyEmbed]'].concat(a));
  }
  function logThrottled(key, intervalMs, fn) {
    if (!debug) return fn();
    var last = logThrottled._last || (logThrottled._last = {});
    var now = Date.now();
    if (last[key] && now - last[key] < intervalMs) return;
    last[key] = now;
    return fn();
  }

  var container = document.querySelector(targetSelector);
  if (!container) return;

  container.style.position = 'relative';

  var iframe = document.createElement('iframe');
  iframe.title = 'Heatmap Scrollytelling – Karte';
  iframe.setAttribute('aria-label', 'Interaktive Heatmap-Karte Deutschland');
  iframe.src = src;
  iframe.scrolling = 'yes';
  iframe.frameBorder = '0';
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
  iframe.style.cssText = 'width:100%;min-width:100%;border:none;height:' + (isMobile ? '85vh' : '700px') + ';min-height:400px;display:block;';

  container.appendChild(iframe);

  var overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;z-index:1;';
  container.appendChild(overlay);

  var iframeOrigin = new URL(src, document.location.href).origin;
  var atTop = true;
  var atBottom = false;
  var embedReachedDown = false;
  var embedReachedUp = false;

  window.addEventListener('message', function (e) {
    if (e.origin !== iframeOrigin || !e.data || e.data.type !== 'scrollState') return;
    atTop = e.data.atTop;
    atBottom = e.data.atBottom;
    logThrottled('scrollState', 800, function () {
      log('scrollState vom Iframe', 'atTop=' + atTop, 'atBottom=' + atBottom);
    });
  });

  var embedReachedDownPrev = null;
  var embedReachedUpPrev = null;
  var viewportHeight = function () {
    return window.innerHeight || document.documentElement.clientHeight || 0;
  };
  function updateEmbedReached() {
    var rect = container.getBoundingClientRect();
    var vh = viewportHeight();
    embedReachedDown = rect.top <= topOffset && rect.bottom > topOffset;
    embedReachedUp = rect.bottom >= vh && rect.top < vh;
    if (embedReachedDown !== embedReachedDownPrev || embedReachedUp !== embedReachedUpPrev) {
      embedReachedDownPrev = embedReachedDown;
      embedReachedUpPrev = embedReachedUp;
      log('embedReached geändert', 'Down=' + embedReachedDown, 'Up=' + embedReachedUp, 'rect.top=' + Math.round(rect.top), 'rect.bottom=' + Math.round(rect.bottom), 'topOffset=' + topOffset, 'vh=' + vh);
    }
  }

  function onScrollOrResize(ev) {
    logThrottled('scroll', 600, function () {
      var from = ev && ev.target ? (ev.target.tagName + (ev.target.id ? '#' + ev.target.id : '')) : '?';
      log('scroll ausgelöst von', from, '→ embedReached wird aktualisiert');
    });
    updateEmbedReached();
  }

  var scrollOpt = { passive: true };
  var scrollParents = [];
  var node = container;
  while (node && node !== document.body) {
    node = node.parentElement;
    if (node) {
      node.addEventListener('scroll', onScrollOrResize, scrollOpt);
      var desc = node.tagName + (node.id ? '#' + node.id : '');
      try {
        if (typeof node.className === 'string' && node.className) desc += ' .' + node.className.trim().split(/\s+/)[0];
      } catch (err) {}
      scrollParents.push(desc);
    }
  }
  window.addEventListener('scroll', onScrollOrResize, scrollOpt);
  if (document.scrollingElement && document.scrollingElement !== document.body) {
    document.scrollingElement.addEventListener('scroll', onScrollOrResize, scrollOpt);
    scrollParents.push('document.scrollingElement');
  }
  scrollParents.push('window');
  log('Scroll-Listener an', scrollParents.length, 'Stellen:', scrollParents.join(', '));
  var rect0 = container.getBoundingClientRect();
  log('Init: container rect.top=' + Math.round(rect0.top), 'topOffset=' + topOffset);
  window.addEventListener('resize', function () {
    updateEmbedReached();
    var mobile = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
    iframe.style.height = mobile ? '85vh' : '700px';
  });
  if (typeof IntersectionObserver !== 'undefined') {
    var io = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].target === container) {
            updateEmbedReached();
            break;
          }
        }
      },
      { root: null, threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] }
    );
    io.observe(container);
  }
  updateEmbedReached();

  function shouldCaptureWheel(deltaY) {
    if (atBottom && deltaY > 0) return false;
    if (atTop && deltaY < 0) return false;
    if (deltaY > 0) return embedReachedDown;
    if (deltaY < 0) return embedReachedUp;
    return false;
  }

  function forwardWheel(deltaY) {
    if (!shouldCaptureWheel(deltaY)) return;
    var scaled = deltaY * wheelSensitivity;
    if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'scroll', deltaY: scaled }, iframeOrigin);
  }

  function handleWheel(e, source) {
    updateEmbedReached();
    var willCapture = shouldCaptureWheel(e.deltaY);
    logThrottled('wheel', 250, function () {
      var reason = !willCapture ? (!embedReachedDown && !embedReachedUp ? 'Embed nicht am Viewport-Rand' : (e.deltaY > 0 && !embedReachedDown ? 'Oberkante Embed noch nicht am Viewport' : (e.deltaY < 0 && !embedReachedUp ? 'Unterkante Embed noch nicht am Viewport' : 'atTop/atBottom'))) : '';
      log(
        'wheel',
        source,
        'deltaY=' + e.deltaY,
        'embedReachedDown=' + embedReachedDown,
        'embedReachedUp=' + embedReachedUp,
        '→ ' + (willCapture ? 'CAPTURE' : 'durchlassen: ' + reason)
      );
    });
    if (!willCapture) return;
    e.preventDefault();
    e.stopPropagation();
    forwardWheel(e.deltaY);
  }

  overlay.addEventListener('wheel', function (e) {
    handleWheel(e, 'overlay');
  }, { passive: false });

  window.addEventListener('wheel', function (e) {
    handleWheel(e, 'window(capture)');
  }, { passive: false, capture: true });

  var touchStartY = 0;
  overlay.addEventListener('touchstart', function (e) {
    if (e.changedTouches && e.changedTouches[0]) touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  overlay.addEventListener('touchmove', function (e) {
    updateEmbedReached();
    if (!e.changedTouches || !e.changedTouches[0]) return;
    var touchY = e.changedTouches[0].clientY;
    var deltaY = (touchStartY - touchY) * touchSensitivity;
    touchStartY = touchY;
    if (!shouldCaptureWheel(deltaY)) return;
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: deltaY }, iframeOrigin);
  }, { passive: false, capture: true });
})();
