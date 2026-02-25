/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.
 * Scroll-Capture: Beim Scrollen über dem Embed wird zuerst innerhalb des iframes gescrollt,
 * erst am Ende des Inhalts scrollt die einbettende Seite weiter.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
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
  iframe.style.cssText = 'width:100%;min-width:100%;border:none;height:700px;display:block;';
  container.appendChild(iframe);

  var iframeOrigin = new URL(src, document.location.href).origin;
  var atTop = true;
  var atBottom = false;

  window.addEventListener('message', function (e) {
    if (e.origin !== iframeOrigin || !e.data || e.data.type !== 'scrollState') return;
    atTop = e.data.atTop;
    atBottom = e.data.atBottom;
  });

  var overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;';
  container.appendChild(overlay);

  overlay.addEventListener('wheel', function (e) {
    var scrollDown = e.deltaY > 0;
    var scrollUp = e.deltaY < 0;
    if (atBottom && scrollDown) return;
    if (atTop && scrollUp) return;
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: e.deltaY }, iframeOrigin);
  }, { passive: false });
})();
