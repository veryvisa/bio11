/* Bio 11 catch-up page: one day at a time; per block: quick check -> study only what was missed -> re-check.
   "Missed" = quiz items the student marked "Again" (stored by the focus player in localStorage fd.v1.again). Works without localStorage (just not remembered). */
(function () {
  var KEY = 'bio11.cu', n = 0;
  function loadAgain() { try { return (JSON.parse(localStorage.getItem('fd.v1')) || {}).again || {}; } catch (e) { return {}; } }
  function st() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } }
  var days = [].slice.call(document.querySelectorAll('.cu-day'));
  if (!days.length) return;
  var cur = st().day || 1, all = false;
  function show() {
    days.forEach(function (d) { d.hidden = !all && +d.getAttribute('data-day') !== cur; });
    var bar = document.querySelector('.cu-pager'); if (!bar) return; document.documentElement.classList.toggle('cu-single', !all);
    bar.querySelector('[data-pg="prev"]').disabled = cur <= 1; bar.querySelector('[data-pg="next"]').disabled = cur >= days.length;
    [].forEach.call(bar.querySelectorAll('.cu-dayno b'), function (x) { x.textContent = cur; });
    var al = document.querySelector('[data-pg="all"]'); if (al) al.setAttribute('aria-pressed', all ? 'true' : 'false');
  }
  document.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('[data-pg]');
    if (p) { var k = p.getAttribute('data-pg'); if (k === 'prev') cur = Math.max(1, cur - 1); else if (k === 'next') cur = Math.min(days.length, cur + 1); else all = !all;
      var s = st(); s.day = cur; save(s); show(); window.scrollTo(0, 0); return; }
    var b = e.target.closest && e.target.closest('[data-cu]');
    if (!b) return;
    var block = b.getAttribute('data-block'), kind = b.getAttribute('data-cu') === 'study' ? 'cards' : 'quiz';
    var art = b.closest('.cu-block'), note = art.querySelector('.cu-note');
    fetch('focus/cu-' + block + '.json').then(function (r) { return r.json(); }).then(function (d) {
      var again = loadAgain();
      var miss = d.quiz.filter(function (q) { return again[q.id]; });
      if (!miss.length) { note.innerHTML = document.querySelector('#cu-msgs [data-m="none"]').innerHTML; note.hidden = false; return; }
      note.hidden = true;
      var ids = miss.map(function (q) { return q.id.replace('cu.q.', ''); });
      var data = { v: 1, key: 'cu-' + block + '-' + kind, cards: d.cards.filter(function (c) { return ids.indexOf(c.id) >= 0; }), quiz: miss };
      var s = document.createElement('script'); s.type = 'application/json'; s.id = 'cu-tmp-' + (++n); s.textContent = JSON.stringify(data);
      document.body.appendChild(s);
      if (window.FocusDeck) window.FocusDeck.open(kind, '#' + s.id, b);
    }).catch(function () { note.innerHTML = document.querySelector('#cu-msgs [data-m="err"]').innerHTML; note.hidden = false; });
  });
  document.addEventListener('change', function (e) {
    var c = e.target.closest && e.target.closest('[data-cu-done]'); if (!c) return;
    var s = st(); s.done = s.done || {}; s.done[c.getAttribute('data-cu-done')] = c.checked ? 1 : 0; save(s);
  });
  var s0 = st(); [].forEach.call(document.querySelectorAll('[data-cu-done]'), function (c) { c.checked = !!(s0.done && s0.done[c.getAttribute('data-cu-done')]); });
  show();
})();
