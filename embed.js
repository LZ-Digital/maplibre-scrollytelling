/**

 * Embed-Loader für Scrollytelling-Heatmap (Datawrapper-ähnlich).

 * Liest data-target (Container-Selektor) und data-src (URL der index.html) vom Script-Tag.

 * Scroll-Capture: Sobald das Embed beim Scrollen der Seite erreicht wird, scrollt weiterhin

 * nur noch im Embed – unabhängig von der Cursor-Position. Am Ende des Embeds scrollt die

 * umgebende Seite wieder.

 * Optional: data-offset-top="100" für Versatz nach unten (z. B. Sticky-Header-Höhe in px).

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

  function getEmbedHeight() {
    var vh = window.innerHeight;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 && window.matchMedia('(max-width: 768px)').matches);
    var fraction = isMobile ? 0.85 : 0.9;
    var height = Math.max(400, Math.round(vh * fraction));
    return height + 'px';
  }

  function setIframeHeight() {
    iframe.style.height = getEmbedHeight();
  }

  iframe.style.cssText = 'width:100%;min-width:100%;border:none;min-height:400px;display:block;';
  setIframeHeight();

  container.appendChild(iframe);



  var overlay = document.createElement('div');

  overlay.setAttribute('aria-hidden', 'true');

  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:auto;';

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

    if (rect.bottom <= topOffset) {

      embedReached = false;

    } else if (rect.top <= topOffset) {

      embedReached = true;

    } else {

      embedReached = false;

    }

  }



  window.addEventListener('scroll', function () {

    updateEmbedReached();

  }, { passive: true });

  window.addEventListener('resize', function () {
    updateEmbedReached();
    setIframeHeight();
  });
  updateEmbedReached();



  /* Desktop: Mausrad – Scroll-Capture wenn Embed im Viewport */
  window.addEventListener('wheel', function (e) {
    updateEmbedReached();
    if (!embedReached) return;
    if (atBottom && e.deltaY > 0) return;
    if (atTop && e.deltaY < 0) return;
    e.preventDefault();
    e.stopPropagation();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: e.deltaY }, iframeOrigin);
  }, { passive: false, capture: true });

  /* Mobile: Touch – Scroll im Embed weiterleiten, wenn Overlay berührt wird */
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