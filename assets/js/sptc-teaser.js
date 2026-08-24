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
  var K = 455 / 120; /* timeline px per second */

  /* the raw stream: t0<t1 streams char-by-char; t0===t1 pops whole.
     hls: transient line highlights [f, t) — green/purple while speculation
     works the line, amber marks where the baseline twin is. badge: inline tag. */
  var S = [
    { t0: 0,    t1: 8,    cls: 't-think', text: "<think>\nThe context is long. Chunk it, label every chunk with the sub-model, then have a judge call pick the final answer.\n</think>" },
    { t0: 8,    t1: 8.6,  cls: 't-fence', text: "```repl" },
    { t0: 8.6,  t1: 14,   cls: 't-code',  text: "brief, chunks = prep(context)",
      hls: [{ f: 14, t: 15.5, cls: 'hl-ran' }, { f: 34, t: 34.4, cls: 'hl-exec' }],
      badge: { at: 14, text: "✓ ran in fork", cls: 'g' } },
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
      ],
      badge: { at: 21, text: "⚡ ×6" } },
    { t0: 21,   t1: 30,   cls: 't-code',  text: "verdict = llm_query(\"judge: \" + str(labels))",
      hls: [{ f: 33.5, t: 45.5, cls: 'hl-spec' }, { f: 100.8, t: 112, cls: 'hl-exec' }],
      badge: { at: 33.5, text: "⚡" } },
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
      if (t < s.t0) { L.txt.textContent = ''; }
      else if (s.t1 <= s.t0 || t >= s.t1) { L.txt.textContent = s.text; }
      else {
        var n = Math.floor(((t - s.t0) / (s.t1 - s.t0)) * s.text.length);
        L.txt.textContent = s.text.slice(0, n);
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
    body.scrollTop = body.scrollHeight;
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

  render(+slider.value);
})();
