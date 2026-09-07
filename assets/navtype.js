/* ====================================================================
   Variable-weight nav hover.

   The reference component animates `font-variation-settings: 'wght'`
   per letter, staggered outward from the centre. That needs a real
   variable font: Barlow ships from Google Fonts as static instances
   only, so the nav is set in Archivo, which the site already loads for
   headings and which does have a wght axis. Requesting
   `Archivo:wght@100..900` gets the variable file in place of the four
   static cuts, so this costs no extra request.

   Progressive enhancement. If this file never loads the nav is a plain
   list of links with a colour hover, which is what it was before.
   Accessibility: the visible text becomes per-letter spans, which some
   screen readers spell out one character at a time, so the link keeps
   an aria-label with the intact string and the spans are hidden from
   the accessibility tree.
   ==================================================================== */
(function () {
  'use strict';

  if (!CSS.supports('font-variation-settings', '"wght" 500')) return;

  var STEP = 26;   /* ms between adjacent letters */

  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var label = link.textContent.trim();
    if (!label || link.querySelector('.ch')) return;

    link.setAttribute('aria-label', label);

    var frag = document.createDocumentFragment();
    var mid = (label.length - 1) / 2;

    for (var i = 0; i < label.length; i++) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = label[i];
      /* Distance from the centre, so the ripple opens outwards from the
         middle of the word rather than running left to right. */
      span.style.setProperty('--d', Math.round(Math.abs(i - mid) * STEP) + 'ms');
      frag.appendChild(span);
    }

    link.textContent = '';
    link.appendChild(frag);
    link.classList.add('vf');
  });
})();
