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
  var desiredScrollTop = 0;
  var allowScrollThrough = false;
  var scrollLockApplying = false;

  function getScrollTop() {
    return window.pageYOffset !== undefined
      ? window.pageYOffset
      : (document.documentElement || document.body).scrollTop;
  }
  function setScrollTop(v) {
    if (document.documentElement.scrollTop !== undefined) document.documentElement.scrollTop = v;
    document.body.scrollTop = v;
  }

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
      desiredScrollTop = getScrollTop();
    } else {
      embedReached = false;
    }
  }

  window.addEventListener('scroll', function () {
    if (scrollLockApplying) return;
    if (embedReached) {
      if (allowScrollThrough) {
        allowScrollThrough = false;
        desiredScrollTop = getScrollTop();
      } else {
        scrollLockApplying = true;
        setScrollTop(desiredScrollTop);
        requestAnimationFrame(function () {
          scrollLockApplying = false;
        });
      }
    }
  }, { passive: true });

  var scrollTick;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = requestAnimationFrame(function () {
      updateEmbedReached();
      scrollTick = null;
    });
  }, { passive: true });
  window.addEventListener('resize', updateEmbedReached);
  updateEmbedReached();

  window.addEventListener('wheel', function (e) {
    if (!embedReached) return;
    if (atBottom && e.deltaY > 0) {
      allowScrollThrough = true;
      return;
    }
    if (atTop && e.deltaY < 0) {
      allowScrollThrough = true;
      return;
    }
    e.preventDefault();
    iframe.contentWindow.postMessage({ type: 'scroll', deltaY: e.deltaY }, iframeOrigin);
  }, { passive: false });
})();
