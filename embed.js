/**
 * Embed-Loader mit Sticky-Lock Mechanismus
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var targetSelector = script.getAttribute('data-target');
  var src = script.getAttribute('data-src');
  var topOffset = parseInt(script.getAttribute('data-offset-top'), 10) || 0;

  var container = document.querySelector(targetSelector);
  if (!container) return;

  // Iframe Setup
  var iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.style.cssText = 'width:100%; border:none; height:100vh; display:block; overflow:hidden;';
  iframe.scrolling = 'no'; // Wir steuern das Scrollen manuell per postMessage
  container.appendChild(iframe);

  var iframeOrigin = new URL(src, document.location.href).origin;
  var atTop = true;
  var atBottom = false;

  // Status vom Iframe empfangen
  window.addEventListener('message', function (e) {
    if (e.origin !== iframeOrigin || !e.data || e.data.type !== 'scrollState') return;
    atTop = e.data.atTop;
    atBottom = e.data.atBottom;
  });

  // Der "Wheel" Interceptor
  window.addEventListener('wheel', function (e) {
    var rect = container.getBoundingClientRect();
    
    // Bedingung: Das Embed hat das obere Limit (topOffset) erreicht
    // Wir erlauben eine Toleranz von 5px für das Einrasten
    var isAtStickyPos = rect.top <= topOffset + 5 && rect.top >= topOffset - 5;
    var isInside = rect.top <= topOffset && rect.bottom > topOffset;

    if (isInside) {
      // 1. Wenn wir ganz oben sind und hochscrollen -> normaler Page-Scroll
      if (atTop && e.deltaY < 0) return;
      
      // 2. Wenn wir ganz unten sind und runterscrollen -> normaler Page-Scroll
      if (atBottom && e.deltaY > 0) return;

      // 3. Ansonsten: Seite fixieren und Scroll-Event in Iframe tunneln
      e.preventDefault();

      // "Sticky-Snap": Wir korrigieren die Position der Hauptseite minimal, 
      // damit das Iframe exakt am topOffset klebt.
      if (rect.top !== topOffset) {
        window.scrollBy(0, rect.top - topOffset);
      }

      iframe.contentWindow.postMessage({
        type: 'scroll',
        deltaY: e.deltaY
      }, iframeOrigin);
    }
  }, { passive: false }); // WICHTIG: Erlaubt preventDefault()

  // Initialer Check beim Laden
  window.addEventListener('load', function() {
    iframe.contentWindow.postMessage({ type: 'checkState' }, iframeOrigin);
  });
})();