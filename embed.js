/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.
 * Scroll-Capture: Sobald der obere Rand des Embeds data-offset-top erreicht, scrollt nur
 * noch im Embed. Am Ende scrollt die Seite wieder.
 * data-offset-top: Abstand in px vom oberen Viewport-Rand (z. B. "0" oder "64" bei fixem Header).
 * data-touch-sensitivity: Multiplikator für Touch-Swipe (Standard: 2, höher = empfindlicher).
 * data-wheel-sensitivity: Multiplikator für Mausrad (Standard: 2.5, höher = größere Sprünge bei weniger Bewegung).
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
  if (!targetSelector || !src) return;

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
  var embedReached = false;

  window.addEventListener('message', function (e) {
    if (e.origin !== iframeOrigin || !e.data || e.data.type !== 'scrollState') return;
    atTop = e.data.atTop;
    atBottom = e.data.atBottom;
  });

  function updateEmbedReached() {
    var rect = container.getBoundingClientRect();
    if (rect.bottom <= topOffset) embedReached = false;
    else if (rect.top <= topOffset) embedReached = true;
    else embedReached = false;
  }

  function onScrollOrResize() {
    updateEmbedReached();
  }

  var scrollOpt = { passive: true };
  var node = container;
  while (node && node !== document.body) {
    node = node.parentElement;
    if (node) node.addEventListener('scroll', onScrollOrResize, scrollOpt);
  }
  window.addEventListener('scroll', onScrollOrResize, scrollOpt);
  if (document.scrollingElement && document.scrollingElement !== document.body) {
    document.scrollingElement.addEventListener('scroll', onScrollOrResize, scrollOpt);
  }
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
    return true;
  }

  function forwardWheel(deltaY) {
    if (!shouldCaptureWheel(deltaY)) return;
    var scaled = deltaY * wheelSensitivity;
    if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'scroll', deltaY: scaled }, iframeOrigin);
  }

  overlay.addEventListener('wheel', function (e) {
    updateEmbedReached();
    if (!embedReached || !shouldCaptureWheel(e.deltaY)) return;
    e.preventDefault();
    e.stopPropagation();
    forwardWheel(e.deltaY);
  }, { passive: false });

  window.addEventListener('wheel', function (e) {
    updateEmbedReached();
    if (!embedReached || !shouldCaptureWheel(e.deltaY)) return;
    e.preventDefault();
    e.stopPropagation();
    forwardWheel(e.deltaY);
  }, { passive: false, capture: true });

  var touchStartY = 0;
  overlay.addEventListener('touchstart', function (e) {
    if (e.changedTouches && e.changedTouches[0]) touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  overlay.addEventListener('touchmove', function (e) {
    updateEmbedReached();
    if (!embedReached || !e.changedTouches || !e.changedTouches[0]) return;
    var touchY = e.changedTouches[0].clientY;
    var deltaY = (touchStartY - touchY) * touchSensitivity;
    touchStartY = touchY;
    if (atBottom && deltaY > 0) return;
    if (atTop && deltaY < 0) return;
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: deltaY }, iframeOrigin);
  }, { passive: false, capture: true });
})();
