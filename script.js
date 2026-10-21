(function () {
  'use strict';
  var TZ = 'America/Denver';
  // Minutes after midnight. Empty array = closed. Edit these to change hours.
  var WEEK = {0: [[480, 780]], 1: [], 2: [[420, 900]], 3: [[420, 900]], 4: [[420, 900]], 5: [[420, 900]], 6: [[420, 840]]};
  var FIXED = {'01-01': [], '07-04': [], '12-25': []};            // repeats every year
  var YEAR = {'2026-11-26': [], '2026-12-24': [[420, 720]]};      // one year only
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  function nowParts() {
    var f = new Intl.DateTimeFormat('en-US', {timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'});
    var o = {};
    f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return {y: +o.year, m: +o.month, d: +o.day, mins: (+o.hour) * 60 + (+o.minute)};
  }
  function dow(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
  function rangesFor(y, m, d) {
    var md = pad(m) + '-' + pad(d);
    var iso = y + '-' + md;
    if (YEAR[iso]) { return YEAR[iso]; }
    if (FIXED[md]) { return FIXED[md]; }
    return WEEK[dow(y, m, d)];
  }
  function fmt(min) {
    var h = Math.floor(min / 60), mm = min % 60;
    return ((h % 12) || 12) + (mm ? ':' + pad(mm) : '') + ' ' + (h >= 12 ? 'p.m.' : 'a.m.');
  }
  function compute() {
    var n = nowParts(), r = rangesFor(n.y, n.m, n.d), i;
    for (i = 0; i < r.length; i++) {
      if (n.mins >= r[i][0] && n.mins < r[i][1]) {
        var soon = r[i][1] - n.mins <= 60;
        return {cls: soon ? 'is-soon' : 'is-open', icon: soon ? '◐' : '●',
          text: 'Open now, closes at ' + fmt(r[i][1]) + (soon ? ' (closing soon)' : '')};
      }
    }
    for (i = 0; i < r.length; i++) {
      if (r[i][0] > n.mins) { return {cls: 'is-closed', icon: '○', text: 'Closed now, opens today at ' + fmt(r[i][0])}; }
    }
    for (i = 1; i <= 8; i++) {
      var dt = new Date(Date.UTC(n.y, n.m - 1, n.d + i));
      var rr = rangesFor(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      if (rr.length) {
        return {cls: 'is-closed', icon: '○', text: 'Closed now, opens ' + (i === 1 ? 'tomorrow' : DAYS[dt.getUTCDay()]) + ' at ' + fmt(rr[0][0])};
      }
    }
    return {cls: 'is-closed', icon: '○', text: 'Closed now'};
  }
  function render() {
    try {
      var s = compute(), n = nowParts(), today = dow(n.y, n.m, n.d);
      document.querySelectorAll('[data-status]').forEach(function (el) {
        el.className = 'status ' + s.cls;
        el.textContent = '';
        var ic = document.createElement('span');
        ic.className = 'ic'; ic.setAttribute('aria-hidden', 'true'); ic.textContent = s.icon;
        el.appendChild(ic);
        el.appendChild(document.createTextNode(s.text));
        el.hidden = false;
      });
      document.querySelectorAll('#hours tr').forEach(function (tr) {
        var on = +tr.getAttribute('data-day') === today;
        tr.classList.toggle('today', on);
        if (on) { tr.setAttribute('aria-current', 'date'); } else { tr.removeAttribute('aria-current'); }
        var th = tr.querySelector('th'), tag = th.querySelector('.tag');
        if (on && !tag) { tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = ' (today)'; th.appendChild(tag); }
        if (!on && tag) { th.removeChild(tag); }
      });
    } catch (e) {
      document.querySelectorAll('[data-status]').forEach(function (el) { el.hidden = true; });
    }
  }
  render();
  setInterval(render, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { render(); } });
})();
