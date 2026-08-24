// spec-ptc interactive teaser: one slider value t drives the model-stream
// terminal (left) and the growing decode/execute timeline (right).
(function () {
  var root = document.getElementById('sptc-teaser');
  if (!root) return;

  var grows = [], shows = [];
  root.querySelectorAll('[data-grow]').forEach(function (el) {
    grows.push({ el: el, t0: +el.dataset.t0, t1: +el.dataset.t1 });
    el.setAttribute('width', 0);
  });
  root.querySelectorAll('[data-show]').forEach(function (el) {
    shows.push({ el: el, at: +el.dataset.show });
    el.style.transition = 'opacity .18s';
  });
  var K = 2.578333; /* timeline px/sec after horizontal compress */

  var KW = { for: 1, in: 1, True: 1, False: 1, None: 1, and: 1, or: 1, not: 1 };
  var FN = { prep: 1, llm_query: 1, str: 1, append: 1, len: 1, range: 1 };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* lightweight Python-ish highlighter for the REPL stream */
  function lint(src) {
    if (!src) return '';
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var c = src[i];
      if (c === '"' || c === "'") {
        var q = c, j = i + 1;
        while (j < n && src[j] !== q) {
          if (src[j] === '\\' && j + 1 < n) j += 2; else j++;
        }
        if (j < n) j++;
        out += '<span class="tok-str">' + esc(src.slice(i, j)) + '</span>';
        i = j; continue;
      }
      if (/[0-9]/.test(c)) {
        var jn = i + 1;
        while (jn < n && /[0-9._]/.test(src[jn])) jn++;
        out += '<span class="tok-num">' + esc(src.slice(i, jn)) + '</span>';
        i = jn; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var jw = i + 1;
        while (jw < n && /[A-Za-z0-9_]/.test(src[jw])) jw++;
        var w = src.slice(i, jw);
        var cls = KW[w] ? (w === 'True' || w === 'False' || w === 'None' ? 'tok-bool' : 'tok-kw')
                : FN[w] ? 'tok-fn' : null;
        /* answer["content"] — treat string keys via quotes above; bare attrs after . */
        out += cls ? ('<span class="' + cls + '">' + esc(w) + '</span>') : esc(w);
        i = jw; continue;
      }
      if ('=[](){},:+'.indexOf(c) !== -1) {
        out += '<span class="tok-punct">' + esc(c) + '</span>';
        i++; continue;
      }
      out += esc(c);
      i++;
    }
    return out;
  }

  function setText(el, text, highlight) {
    if (highlight) el.innerHTML = lint(text);
    else el.textContent = text;
  }

  /* the raw stream: t0<t1 streams char-by-char; t0===t1 pops whole.
     hls: transient line highlights [f, t) — green/purple while speculation
     works the line, amber marks where the baseline twin is. badge: inline tag. */
  var S = [
    { t0: 0,    t1: 8,    cls: 't-think', text: "<think>\nThe context is long. Chunk it, label every chunk with the sub-model, then have a judge call pick the final answer.\n</think>" },
    { t0: 8,    t1: 8.6,  cls: 't-fence', text: "```repl" },
    { t0: 8.6,  t1: 14,   cls: 't-code',  text: "brief, chunks = prep(context)",
      hls: [{ f: 14, t: 15.5, cls: 'hl-ran' }, { f: 34, t: 34.4, cls: 'hl-exec' }] },
    { t0: 14,   t1: 15.5, cls: 't-code',  text: "labels = []",
      hls: [{ f: 15.5, t: 17.5, cls: 'hl-ran' }, { f: 34.4, t: 34.8, cls: 'hl-exec' }] },
    { t0: 15.5, t1: 17.5, cls: 't-code',  text: "for c in chunks:",
      hls: [
        { f: 34.8, t: 35.5, cls: 'hl-exec' }, { f: 45.8, t: 46.5, cls: 'hl-exec' },
        { f: 56.8, t: 57.5, cls: 'hl-exec' }, { f: 67.8, t: 68.5, cls: 'hl-exec' },
        { f: 78.8, t: 79.5, cls: 'hl-exec' }, { f: 89.8, t: 90.5, cls: 'hl-exec' }
      ] },
    { t0: 17.5, t1: 21,   cls: 't-code',  text: "    labels.append(llm_query(brief + c))",
      hls: [
        { f: 21,   t: 33.5, cls: 'hl-spec' },
        { f: 35.5, t: 45.8, cls: 'hl-exec' }, { f: 46.5, t: 56.8, cls: 'hl-exec' },
        { f: 57.5, t: 67.8, cls: 'hl-exec' }, { f: 68.5, t: 78.8, cls: 'hl-exec' },
        { f: 79.5, t: 89.8, cls: 'hl-exec' }, { f: 90.5, t: 100.8, cls: 'hl-exec' }
      ] },
    { t0: 21,   t1: 30,   cls: 't-code',  text: "verdict = llm_query(\"judge: \" + str(labels))",
      hls: [{ f: 33.5, t: 45.5, cls: 'hl-spec' }, { f: 100.8, t: 112, cls: 'hl-exec' }] },
    { t0: 30,   t1: 32.3, cls: 't-code',  text: "answer[\"content\"] = str(verdict)",
      hls: [{ f: 45.5, t: 46.2, cls: 'hl-ran' }] },
    { t0: 32.3, t1: 33.2, cls: 't-code',  text: "answer[\"ready\"] = True",
      hls: [{ f: 46.2, t: 47, cls: 'hl-ran' }] },
    { t0: 33.2, t1: 34,   cls: 't-fence', text: "```" }
  ];

  var body = document.getElementById('sptc-term-body');
  var lines = S.map(function (s) {
    var line = document.createElement('span');
    line.className = 'tline ' + s.cls;
    var txt = document.createElement('span');
    line.appendChild(txt);
    var badge = null;
    if (s.badge) {
      badge = document.createElement('span');
      badge.className = 'badge' + (s.badge.cls ? ' ' + s.badge.cls : '');
      badge.textContent = s.badge.text;
      line.appendChild(badge);
    }
    body.appendChild(line);
    return { el: line, txt: txt, badge: badge };
  });

  var caret = document.createElement('span');
  caret.className = 'caret';

  var slider = document.getElementById('sptc-slider');
  var readout = document.getElementById('sptc-readout');
  var dot = document.getElementById('sptc-dot');
  var title = document.getElementById('sptc-title');

  /* Size both panels to the taller of: full REPL stream, or timeline aspect
     box. SVG fills the right card; REPL card stretches to the same height. */
  function syncPanelHeights() {
    var term = root.querySelector('.teaser-term');
    var time = root.querySelector('.teaser-time');
    var tNow = slider ? +slider.value : 0;
    term.style.minHeight = '';
    time.style.minHeight = '';
    body.style.minHeight = '';
    S.forEach(function (s, i) {
      lines[i].el.classList.add('on');
      setText(lines[i].txt, s.text, s.cls === 't-code');
    });
    var contentH = body.scrollHeight;
    var headH = root.querySelector('.term-head').offsetHeight;
    var termNeed = headH + contentH;
    var timeW = time.clientWidth || time.getBoundingClientRect().width;
    var svgNeed = timeW > 0 ? timeW * (262 / 420) + 16 : 0; /* + padding */
    var h = Math.max(termNeed, svgNeed);
    term.style.minHeight = h + 'px';
    time.style.minHeight = h + 'px';
    body.style.minHeight = (h - headH) + 'px';
    if (typeof render === 'function') render(tNow);
    else {
      S.forEach(function (s, i) {
        lines[i].el.classList.remove('on');
        setText(lines[i].txt, '', false);
      });
    }
  }

  function render(t) {
    grows.forEach(function (g) {
      var w = (Math.min(Math.max(t, g.t0), g.t1) - g.t0) * K;
      g.el.setAttribute('width', Math.max(0, w));
    });
    shows.forEach(function (s) { s.el.style.opacity = t >= s.at ? 1 : 0; });

    var streaming = null;
    S.forEach(function (s, i) {
      var L = lines[i];
      L.el.classList.toggle('on', t >= s.t0);
      var doLint = s.cls === 't-code';
      if (t < s.t0) { setText(L.txt, '', false); }
      else if (s.t1 <= s.t0 || t >= s.t1) { setText(L.txt, s.text, doLint); }
      else {
        var n = Math.floor(((t - s.t0) / (s.t1 - s.t0)) * s.text.length);
        setText(L.txt, s.text.slice(0, n), doLint);
        streaming = L;
      }
      if (s.hls) {
        var on = {};
        s.hls.forEach(function (h) { on[h.cls] = on[h.cls] || (t >= h.f && t < h.t); });
        Object.keys(on).forEach(function (c) { L.el.classList.toggle(c, on[c]); });
      }
      if (L.badge) L.badge.classList.toggle('show', t >= s.badge.at);
    });

    if (t < 34) {
      var host = streaming || lines[0];
      for (var i = S.length - 1; i >= 0; i--) { if (t >= S[i].t0) { host = streaming || lines[i]; break; } }
      host.el.insertBefore(caret, host.badge);
      caret.style.display = 'inline-block';
    } else {
      caret.style.display = 'none';
    }

    dot.className = 'dot' + (t >= 46 ? ' done' : '');
    title.textContent = t < 34 ? "the model's turn — streaming"
                      : (t < 46 ? "decode done — executing" : "turn complete");
    readout.textContent = 'Time t';
  }

  slider.addEventListener('input', function () { stop(); render(+slider.value); });

  var playing = false, raf = null, last = 0;
  var btn = document.getElementById('sptc-play');
  function stop() {
    playing = false; btn.textContent = '▶ play';
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }
  function tick(now) {
    if (!playing) return;
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    var t = Math.min(115, +slider.value + dt * 16); /* 16 sim-seconds per real second */
    slider.value = t; render(t);
    if (t >= 115) { stop(); return; }
    raf = requestAnimationFrame(tick);
  }
  btn.addEventListener('click', function () {
    if (playing) { stop(); return; }
    if (+slider.value >= 114.5) slider.value = 0;
    playing = true; btn.textContent = '⏸ pause'; last = performance.now();
    raf = requestAnimationFrame(tick);
  });

  render(0);
  slider.value = 0;
  syncPanelHeights();
  playing = true;
  btn.textContent = '⏸ pause';
  last = performance.now();
  raf = requestAnimationFrame(tick);

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncPanelHeights, 100);
  });
})();
