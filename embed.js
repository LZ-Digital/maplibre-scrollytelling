/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.
 * Scroll-Capture: Sobald das Embed beim Scrollen der Seite erreicht wird, scrollt nur noch
 * im Embed. Am Ende des Embeds scrollt die umgebende Seite wieder.
 * Optional: data-offset-top="100" für Versatz in px (z. B. Sticky-Header-Höhe).
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  var topOffset = parseInt(script.getAttribute('data-offset-top'), 10);
  if (isNaN(topOffset)) topOffset = 100;
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

  window.addEventListener('scroll', function () { updateEmbedReached(); }, { passive: true });
  window.addEventListener('resize', function () {
    updateEmbedReached();
    var mobile = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
    iframe.style.height = mobile ? '85vh' : '700px';
  });
  updateEmbedReached();

  function shouldCaptureWheel(deltaY) {
    if (atBottom && deltaY > 0) return false;
    if (atTop && deltaY < 0) return false;
    return true;
  }

  function forwardWheel(deltaY) {
    if (!shouldCaptureWheel(deltaY)) return;
    if (iframe.contentWindow) iframe.contentWindow.postMessage({ type: 'scroll', deltaY: deltaY }, iframeOrigin);
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
    var deltaY = touchStartY - touchY;
    touchStartY = touchY;
    if (atBottom && deltaY > 0) return;
    if (atTop && deltaY < 0) return;
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: deltaY }, iframeOrigin);
  }, { passive: false, capture: true });
})();
