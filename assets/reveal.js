/* Scroll entry for the service pages.
   Same contract as the home page: IntersectionObserver only, never a
   scroll listener. Elements marked .rev-in start hidden in CSS and are
   shown a section at a time, with a short stagger inside each section.
   If the API is missing, or the visitor asked for reduced motion,
   everything is shown immediately rather than left invisible. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showAll() {
    document.querySelectorAll('.rev-in').forEach(function (el) { el.classList.add('shown'); });
  }

  if (reduce || !('IntersectionObserver' in window)) { showAll(); return; }

  /* The masthead is already in view on load, so it runs on a timer
     rather than waiting for a scroll that may never come. */
  document.querySelectorAll('.page-head .rev-in').forEach(function (el, i) {
    setTimeout(function () { el.classList.add('shown'); }, 120 + i * 70);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.rev-in:not(.shown)').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('shown'); }, i * 70);
      });
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  document.querySelectorAll('section:not(.page-head), footer').forEach(function (g) { io.observe(g); });

  /* Nothing should stay hidden if the observer never fires for a
     section that is already on screen at load on a tall display. */
  window.addEventListener('load', function () {
    setTimeout(function () {
      document.querySelectorAll('.rev-in:not(.shown)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('shown');
      });
    }, 400);
  });
})();
