/**
 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).
 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.
 * Scroll-Capture: Sobald das Embed beim Scrollen der Seite erreicht wird, scrollt weiterhin
 * nur noch im Embed – unabhängig von der Cursor-Position. Am Ende des Embeds scrollt die
 * umgebende Seite wieder.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  if (!targetSelector || !src) return;

  var container = document.querySelector(targetSelector);
  if (!container) return;

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
  var embedReached = false;

  window.addEventListener('message', function (e) {
    if (e.origin !== iframeOrigin || !e.data || e.data.type !== 'scrollState') return;
    atTop = e.data.atTop;
    atBottom = e.data.atBottom;
  });

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        embedReached = entry.intersectionRatio > 0;
      });
    },
    { threshold: [0, 0.001] }
  );
  io.observe(container);

  window.addEventListener('wheel', function (e) {
    if (!embedReached) return;
    if (atBottom && e.deltaY > 0) return;
    if (atTop && e.deltaY < 0) return;
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: e.deltaY }, iframeOrigin);
  }, { passive: false });
})();
