/* ====================================================================
   Date picker for the quote form.

   Deliberately an enhancement, not a replacement. The native
   <input type="date"> stays in the DOM and stays the source of truth,
   so typing still works, the mobile keyboard still works, the existing
   validation still works, and the WhatsApp handoff reads the same value
   it always did. If this file fails to load, the field is exactly what
   it was before.

   No dependencies. The site has no build step, so it cannot use the
   React or Tailwind version of this component.
   ==================================================================== */
(function () {
  'use strict';

  var input = document.getElementById('q-date');
  if (!input) return;

  var wrap = input.parentNode;                      // .field
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var DOW = ['M','T','W','T','F','S','S'];          // week starts Monday, UK

  /* Local-date helpers. Never use toISOString here: it converts to UTC and
     shifts the date back a day for anyone on BST. */
  function iso(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  var today = startOfDay(new Date());
  /* Travel cannot be booked into the past. */
  if (!input.min) input.min = iso(today);

  wrap.classList.add('dp-wrap');

  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>';
  var ICON_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  var ICON_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';

  var openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'dp-open';
  openBtn.innerHTML = ICON_CAL;
  openBtn.setAttribute('aria-label', 'Choose a date of travel');
  openBtn.setAttribute('aria-expanded', 'false');
  input.insertAdjacentElement('afterend', openBtn);

  var pop = document.createElement('div');
  pop.className = 'dp';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'false');
  pop.setAttribute('aria-label', 'Choose a date of travel');
  wrap.appendChild(pop);

  var view = startOfDay(parseISO(input.value) || today);   // month on screen
  var focusDay = new Date(view);                            // roving focus

  function selected() { return parseISO(input.value); }

  function render() {
    var y = view.getFullYear(), m = view.getMonth();
    var first = new Date(y, m, 1);
    var lead = (first.getDay() + 6) % 7;                    // Monday-first offset
    var total = new Date(y, m + 1, 0).getDate();
    var sel = selected();
    var atFloor = y === today.getFullYear() && m === today.getMonth();

    var html =
      '<div class="dp-head">' +
        '<span class="dp-title">' + MONTHS[m] + ' ' + y + '</span>' +
        '<span class="dp-nav">' +
          '<button type="button" data-nav="-1" aria-label="Previous month"' + (atFloor ? ' disabled' : '') + '>' + ICON_L + '</button>' +
          '<button type="button" data-nav="1" aria-label="Next month">' + ICON_R + '</button>' +
        '</span>' +
      '</div>' +
      '<div class="dp-dow" aria-hidden="true">' +
        DOW.map(function (d) { return '<span>' + d + '</span>'; }).join('') +
      '</div>' +
      '<div class="dp-grid" role="grid">';

    for (var i = 0; i < lead; i++) {
      html += '<span class="dp-day" data-blank aria-hidden="true"></span>';
    }
    for (var day = 1; day <= total; day++) {
      var d = new Date(y, m, day);
      var past = d < today;
      var isSel = sameDay(d, sel);
      var isToday = sameDay(d, today);
      html += '<button type="button" class="dp-day" role="gridcell"' +
              ' data-iso="' + iso(d) + '"' +
              (past ? ' disabled' : '') +
              (isToday ? ' data-today' : '') +
              ' aria-selected="' + (isSel ? 'true' : 'false') + '"' +
              ' tabindex="' + (sameDay(d, focusDay) ? '0' : '-1') + '"' +
              ' aria-label="' + d.getDate() + ' ' + MONTHS[m] + ' ' + y + '">' +
              day + '</button>';
    }

    html += '</div>' +
      '<div class="dp-foot">' +
        '<button type="button" data-today-btn>Today</button>' +
        '<span class="dp-hint">Esc to close</span>' +
      '</div>';

    pop.innerHTML = html;
  }

  function isOpen() { return openBtn.getAttribute('aria-expanded') === 'true'; }

  function open() {
    if (isOpen()) return;
    view = startOfDay(selected() || today);
    focusDay = startOfDay(selected() || today);
    render();
    pop.hidden = false;
    /* Next frame, so the transition has a start state to run from. */
    requestAnimationFrame(function () { pop.setAttribute('data-open', 'true'); });
    openBtn.setAttribute('aria-expanded', 'true');
    var f = pop.querySelector('.dp-day[tabindex="0"]:not(:disabled)') ||
            pop.querySelector('.dp-day:not(:disabled)');
    if (f) f.focus();
    document.addEventListener('pointerdown', onOutside, true);
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    pop.removeAttribute('data-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    var done = function () { pop.hidden = true; };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) done(); else setTimeout(done, 170);
    if (returnFocus) openBtn.focus();
  }

  function onOutside(e) {
    if (!pop.contains(e.target) && e.target !== openBtn && !openBtn.contains(e.target)) close(false);
  }

  function commit(d) {
    input.value = iso(d);
    /* Let the form's own listeners clear the invalid state. */
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    close(true);
  }

  function shiftFocus(days) {
    var next = new Date(focusDay.getFullYear(), focusDay.getMonth(), focusDay.getDate() + days);
    if (next < today) return;
    focusDay = next;
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      view = new Date(next.getFullYear(), next.getMonth(), 1);
    }
    render();
    var el = pop.querySelector('.dp-day[data-iso="' + iso(focusDay) + '"]');
    if (el) el.focus();
  }

  openBtn.addEventListener('click', function () { isOpen() ? close(true) : open(); });

  pop.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (nav) {
      var step = +nav.getAttribute('data-nav');
      var cand = new Date(view.getFullYear(), view.getMonth() + step, 1);
      if (step < 0 && cand < new Date(today.getFullYear(), today.getMonth(), 1)) return;
      view = cand;
      render();
      var keep = pop.querySelector('[data-nav="' + step + '"]');
      if (keep && !keep.disabled) keep.focus();
      return;
    }
    if (e.target.closest('[data-today-btn]')) { commit(today); return; }
    var cell = e.target.closest('.dp-day[data-iso]');
    if (cell && !cell.disabled) commit(parseISO(cell.getAttribute('data-iso')));
  });

  pop.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'Escape') { e.preventDefault(); close(true); return; }
    if (!e.target.classList.contains('dp-day')) return;
    var map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, PageUp: -28, PageDown: 28 };
    if (k in map) { e.preventDefault(); shiftFocus(map[k]); return; }
    if (k === 'Home') {
      e.preventDefault();
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      shiftFocus(Math.round((first - focusDay) / 86400000));
      return;
    }
    if (k === 'End') {
      e.preventDefault();
      var last = new Date(view.getFullYear(), view.getMonth() + 1, 0);
      shiftFocus(Math.round((last - focusDay) / 86400000));
    }
  });

  /* Typing straight into the field stays available, so keep the popover
     in step with whatever was typed. */
  input.addEventListener('change', function () {
    var d = parseISO(input.value);
    if (d) { view = startOfDay(d); focusDay = startOfDay(d); if (isOpen()) render(); }
  });
})();
