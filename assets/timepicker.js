/* ====================================================================
   Pick-up time picker for the quote form.

   Companion to datepicker.js and built the same way: the native
   <input type="time"> keeps the value and stays in the DOM, hidden by a
   class this script adds, so if the script never runs the ordinary time
   field is still there and still works. The visible control is a trigger
   button carrying the chosen time.

   It exists because the date field beside it is now a trigger button. Two
   adjacent fields in a row, one a styled button and one a raw browser
   control, reads as a bug rather than a choice.

   No dependencies. Shares the .dp panel styling with the date picker.
   ==================================================================== */
(function () {
  'use strict';

  var input = document.getElementById('q-time');
  if (!input) return;

  var wrap = input.parentNode;                 // .field
  var STEP = 5;                                 /* minutes per option */

  function pad(n) { return String(n).padStart(2, '0'); }
  function parts() {
    var m = /^(\d{1,2}):(\d{2})/.exec(input.value || '');
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    return (h >= 0 && h < 24 && mi >= 0 && mi < 60) ? { h: h, m: mi } : null;
  }

  wrap.classList.add('dp-wrap');

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9"/></svg>';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'dp-trigger';
  btn.innerHTML = ICON + '<span class="pick-txt"></span>';
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  input.classList.add('pick-native');
  input.insertAdjacentElement('afterend', btn);
  var triggerTxt = btn.querySelector('.pick-txt');

  var pop = document.createElement('div');
  pop.className = 'dp tp';
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Choose a pick-up time');
  wrap.appendChild(pop);

  function paintTrigger() {
    var p = parts();
    if (p) {
      triggerTxt.textContent = pad(p.h) + ':' + pad(p.m);
      btn.classList.remove('is-empty');
      btn.setAttribute('aria-label', 'Pick-up time, ' + triggerTxt.textContent + '. Change it');
    } else {
      triggerTxt.textContent = 'Pick a time';
      btn.classList.add('is-empty');
      btn.setAttribute('aria-label', 'Choose a pick-up time');
    }
  }
  paintTrigger();

  /* 09:00 is the working default the columns open on when nothing is set.
     It is only what the lists scroll to; it is never written to the input
     unless the customer actually picks it. */
  function shown() { return parts() || { h: 9, m: 0 }; }

  function render() {
    var p = shown();
    var hours = '', mins = '';
    for (var h = 0; h < 24; h++) {
      hours += '<button type="button" class="tp-opt" role="option" data-h="' + h + '"' +
               (h === p.h ? ' aria-selected="true"' : ' aria-selected="false"') + '>' + pad(h) + '</button>';
    }
    for (var m = 0; m < 60; m += STEP) {
      mins += '<button type="button" class="tp-opt" role="option" data-m="' + m + '"' +
              (m === p.m ? ' aria-selected="true"' : ' aria-selected="false"') + '>' + pad(m) + '</button>';
    }
    pop.innerHTML =
      '<div class="dp-head"><span class="tp-read">' +
        (parts() ? pad(p.h) + ':' + pad(p.m) : 'Pick a time') +
      '</span></div>' +
      '<div class="tp-cols">' +
        '<div class="tp-col"><span class="tp-lab">Hour</span>' +
          '<div class="tp-scroll" role="listbox" aria-label="Hour">' + hours + '</div></div>' +
        '<div class="tp-col"><span class="tp-lab">Minute</span>' +
          '<div class="tp-scroll" role="listbox" aria-label="Minute">' + mins + '</div></div>' +
      '</div>' +
      '<div class="dp-foot">' +
        '<button type="button" data-tp-clear>Clear</button>' +
        '<span class="dp-hint">Esc to close</span>' +
      '</div>';

  }

  /* Centre the current choice in each column, so the selection is visible
     on open rather than the list sitting at midnight. Must run while the
     panel is displayed: measuring a hidden element gives a clientHeight of
     zero, and the maths silently yields a scrollTop of zero. */
  function centreColumns() {
    pop.querySelectorAll('.tp-scroll').forEach(function (col) {
      var sel = col.querySelector('[aria-selected="true"]');
      if (sel) col.scrollTop = sel.offsetTop - col.clientHeight / 2 + sel.offsetHeight / 2;
    });
  }

  function isOpen() { return btn.getAttribute('aria-expanded') === 'true'; }

  function open() {
    if (isOpen()) return;
    render();
    pop.hidden = false;
    centreColumns();
    requestAnimationFrame(function () { pop.setAttribute('data-open', 'true'); });
    btn.setAttribute('aria-expanded', 'true');
    var f = pop.querySelector('.tp-opt[aria-selected="true"]') || pop.querySelector('.tp-opt');
    if (f) f.focus({ preventScroll: true });
    document.addEventListener('pointerdown', onOutside, true);
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    pop.removeAttribute('data-open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    var done = function () { pop.hidden = true; };
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) done(); else setTimeout(done, 170);
    if (returnFocus) btn.focus();
  }

  function onOutside(e) {
    if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(false);
  }

  function commit(h, m) {
    input.value = pad(h) + ':' + pad(m);
    paintTrigger();
    /* Let the form's own listeners clear the invalid state. */
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  btn.addEventListener('click', function () { isOpen() ? close(true) : open(); });

  pop.addEventListener('click', function (e) {
    if (e.target.closest('[data-tp-clear]')) {
      input.value = '';
      paintTrigger();
      input.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
      return;
    }
    var opt = e.target.closest('.tp-opt');
    if (!opt) return;
    var p = shown();
    if (opt.hasAttribute('data-h')) {
      /* Choosing an hour leaves the panel open so the minute can follow. */
      var hTop = pop.querySelector('.tp-scroll').scrollTop;
      var mTop = pop.querySelectorAll('.tp-scroll')[1].scrollTop;
      commit(+opt.getAttribute('data-h'), p.m);
      render();
      /* Keep both lists where the customer left them; re-rendering would
         otherwise snap them back to the top mid-choice. */
      pop.querySelectorAll('.tp-scroll')[0].scrollTop = hTop;
      pop.querySelectorAll('.tp-scroll')[1].scrollTop = mTop;
    } else {
      commit(p.h, +opt.getAttribute('data-m'));
      close(true);
    }
  });

  pop.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    var opt = e.target.closest('.tp-opt');
    if (!opt) return;
    var step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    var list = Array.prototype.slice.call(opt.parentNode.querySelectorAll('.tp-opt'));
    var next = list[list.indexOf(opt) + step];
    if (next) next.focus();
  });

  input.addEventListener('change', paintTrigger);
})();
