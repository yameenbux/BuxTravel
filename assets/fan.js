/* ====================================================================
   Services card fan.

   Ported from a React + GSAP component. Two deliberate departures:

   1. No GSAP. The whole effect is six transforms and a spring curve, and
      the site has no build step and no JS dependencies. JS computes the
      layout and writes it to custom properties; CSS transitions with a
      linear() spring do the animating. That is ~2KB instead of ~70KB.

   2. The reference fanned image-only cards and left every off-centre one
      rotated up to 21 degrees. These cards carry a heading, a paragraph
      and a link, and rotated body copy cannot be read. So the centre
      card sits upright at full size with its copy open, and pointing at
      or tabbing to any other card makes it the centre. Nothing is hidden
      from the DOM, a crawler or a screen reader — only the transform is
      decorative.

   The fan is opt-in: CSS lays the cards out as an ordinary grid, and
   this file adds .fan-on to switch to the fan. No JS, narrow viewport or
   reduced motion all leave the readable grid in place.
   ==================================================================== */
(function () {
  'use strict';

  var fan = document.querySelector('.fan');
  if (!fan) return;

  var cards = Array.prototype.slice.call(fan.querySelectorAll('.fan-card'));
  if (cards.length < 2) return;

  var mqNarrow = window.matchMedia('(max-width: 1100px)');
  var mqPhone  = window.matchMedia('(max-width: 900px)');
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* The card the fan opens on, and the one it falls back to. Chosen in
     the markup so the flagship service is the one sitting upright. */
  var home = cards.findIndex(function (c) { return c.hasAttribute('data-fan-home'); });
  if (home < 0) home = cards.length >> 1;
  var centre = home;

  /* The step has to be wide enough that the strip of each card left
     showing is readable. At a third of a card width you get a handsome
     fan in which five of the six services cannot be identified, which is
     decoration standing where the content should be. */
  var SPREAD = 0.60;   /* horizontal step, as a fraction of card width */
  var ROT    = 8;      /* degrees per step */
  var DROP   = 12;     /* px of sag per step, eased */
  var SHRINK = 0.065;  /* scale lost per step */

  function layout() {
    /* Offset so the fan stays optically centred whichever card is open,
       rather than sliding off to one side. */
    var mid = (cards.length - 1) / 2;
    /* Offsets run from (0 - centre) to (n-1 - centre), whose mean is
       (mid - centre). Subtracting that mean re-centres the spread; adding
       it doubles the lean and pushes the fan off the side of the page. */
    var shift = centre - mid;

    cards.forEach(function (card, i) {
      var d = i - centre;
      var a = Math.abs(d);
      var isCentre = d === 0;
      /* Compress beyond the third step. Six cards with the end one open
         means a five-step offset, and at a flat 8 degrees a step that is
         a 40-degree card lying almost on its side. */
      var ca = a <= 3 ? a : 3 + (a - 3) * 0.45;

      var sign = d < 0 ? -1 : 1;
      card.style.setProperty('--tx', ((d + shift) * SPREAD * 100).toFixed(2) + '%');
      card.style.setProperty('--ty', (Math.pow(ca, 1.35) * DROP).toFixed(1) + 'px');
      card.style.setProperty('--rot', (sign * ca * ROT).toFixed(2) + 'deg');
      card.style.setProperty('--scale', Math.max(0.68, 1 - SHRINK * ca).toFixed(3));
      card.style.setProperty('--z', String(20 - a));

      card.classList.toggle('is-centre', isCentre);
      /* Cards stack toward the centre, so a card left of the open one is
         overlapped on its right and a card to the right is overlapped on
         its left. The heading is aligned to whichever edge still shows. */
      card.dataset.side = isCentre ? 'c' : (d < 0 ? 'l' : 'r');
      /* Only the open card's copy is reachable by pointer; the others
         are a click target for opening themselves. */
      card.setAttribute('aria-expanded', isCentre ? 'true' : 'false');
    });
  }

  function open(i) {
    if (i === centre || i < 0 || i >= cards.length) return;
    centre = i;
    layout();
  }

  cards.forEach(function (card, i) {
    card.addEventListener('mouseenter', function () { open(i); });
    /* Tabbing to a card opens it, so the fan is usable without a pointer. */
    card.addEventListener('focusin', function () { open(i); });
    /* On touch there is no hover: the first tap opens the card, and only
       a tap on the already-open card follows its link. This applies ONLY
       while the fan is on. Below 1100px the cards are a plain carousel
       with every link visible and tappable, and swallowing the first tap
       there would break them — the old version relied on the browser
       synthesising a mouseenter before the click to avoid that, which is
       not something to depend on. */
    card.addEventListener('click', function (e) {
      if (!fan.classList.contains('fan-on')) return;
      if (centre !== i) { e.preventDefault(); open(i); }
    });
  });

  fan.addEventListener('mouseleave', function () { open(home); });

  fan.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var next = centre + (e.key === 'ArrowRight' ? 1 : -1);
    if (next < 0 || next >= cards.length) return;
    e.preventDefault();
    open(next);
    var link = cards[next].querySelector('a') || cards[next];
    if (link.focus) link.focus();
  });

  /* Position dots for the carousel. IntersectionObserver against the
     scroller itself — this file does not get to add a scroll listener,
     the same rule the rest of the site follows. */
  var dots = null, dotIO = null;

  function buildDots() {
    if (dots) return;
    dots = document.createElement('div');
    dots.className = 'fan-dots';
    dots.setAttribute('aria-hidden', 'true');
    cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    fan.parentNode.insertBefore(dots, fan.nextSibling);

    dotIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = cards.indexOf(e.target);
        if (i < 0 || !dots.children[i]) return;
        dots.children[i].classList.toggle('on', e.isIntersecting);
      });
    }, { root: fan, threshold: 0.62 });
    cards.forEach(function (c) { dotIO.observe(c); });
  }

  function dropDots() {
    if (!dots) return;
    if (dotIO) { dotIO.disconnect(); dotIO = null; }
    dots.parentNode.removeChild(dots);
    dots = null;
  }

  function sync() {
    var fanned = !mqNarrow.matches && !mqMotion.matches;
    fan.classList.toggle('fan-on', fanned);
    /* The carousel is the layout below 900px; the 900-1100px band is the
       ordinary grid, which needs no dots. */
    if (!fanned && mqPhone.matches && 'IntersectionObserver' in window) { buildDots(); }
    else { dropDots(); }
    if (fanned) { layout(); }
    else {
      cards.forEach(function (c) {
        c.classList.remove('is-centre');
        c.removeAttribute('aria-expanded');
        ['--tx','--ty','--rot','--scale','--z'].forEach(function (p) { c.style.removeProperty(p); });
      });
    }
  }

  (mqNarrow.addEventListener ? mqNarrow.addEventListener.bind(mqNarrow, 'change')
                             : mqNarrow.addListener.bind(mqNarrow))(sync);
  (mqMotion.addEventListener ? mqMotion.addEventListener.bind(mqMotion, 'change')
                             : mqMotion.addListener.bind(mqMotion))(sync);
  (mqPhone.addEventListener ? mqPhone.addEventListener.bind(mqPhone, 'change')
                            : mqPhone.addListener.bind(mqPhone))(sync);
  sync();
})();
