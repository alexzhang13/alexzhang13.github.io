// Client-side Python highlighter for spec-ptc code blocks.
(function () {
  var KW = {
    and: 1, as: 1, assert: 1, async: 1, await: 1, break: 1, class: 1, continue: 1,
    def: 1, del: 1, elif: 1, else: 1, except: 1, finally: 1, for: 1, from: 1,
    global: 1, if: 1, import: 1, in: 1, is: 1, lambda: 1, nonlocal: 1, not: 1,
    or: 1, pass: 1, raise: 1, return: 1, try: 1, while: 1, with: 1, yield: 1
  };
  var CONST = { True: 1, False: 1, None: 1, Ellipsis: 1 };
  var BUILTIN = {
    abs: 1, all: 1, any: 1, bool: 1, dict: 1, enumerate: 1, filter: 1, float: 1,
    format: 1, getattr: 1, hasattr: 1, id: 1, int: 1, isinstance: 1, len: 1,
    list: 1, locals: 1, map: 1, max: 1, min: 1, next: 1, object: 1, open: 1,
    print: 1, range: 1, repr: 1, reversed: 1, set: 1, sorted: 1, str: 1, sum: 1,
    super: 1, tuple: 1, type: 1, zip: 1, exec: 1, eval: 1, globals: 1, property: 1
  };
  var PREFIX = { r: 1, R: 1, u: 1, U: 1, f: 1, F: 1, b: 1, B: 1,
    fr: 1, Fr: 1, fR: 1, FR: 1, rf: 1, Rf: 1, rF: 1, RF: 1,
    br: 1, Br: 1, bR: 1, BR: 1, rb: 1, Rb: 1, rB: 1, RB: 1 };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function dedent(src) {
    var text = src.replace(/^\n/, '').replace(/\s+$/, '');
    var lines = text.split('\n');
    var min = Infinity;
    for (var i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      var m = lines[i].match(/^[ \t]*/)[0].length;
      if (m < min) min = m;
    }
    if (!isFinite(min) || min === 0) return text;
    return lines.map(function (ln) {
      return ln.slice(Math.min(min, ln.match(/^[ \t]*/)[0].length));
    }).join('\n');
  }

  function tokenizeBibtex(src) {
    var out = [];
    var i = 0;
    var n = src.length;
    var mode = 'start';

    function push(cls, a, b) {
      if (a >= b) return;
      out.push({ cls: cls, text: src.slice(a, b) });
    }

    while (i < n) {
      var c = src[i];

      if (/\s/.test(c)) {
        var js = i + 1;
        while (js < n && /\s/.test(src[js])) js++;
        push('', i, js);
        i = js;
        continue;
      }

      if (c === '@') {
        var ja = i + 1;
        while (ja < n && /[A-Za-z]/.test(src[ja])) ja++;
        push('dec', i, ja);
        i = ja;
        mode = 'key';
        continue;
      }

      if (c === '"') {
        var jq = i + 1;
        while (jq < n && src[jq] !== '"') {
          if (src[jq] === '\\') jq += 2;
          else jq++;
        }
        if (jq < n) jq++;
        push('str', i, jq);
        i = jq;
        if (mode === 'value') mode = 'fields';
        continue;
      }

      if (c === '{') {
        if (mode === 'value') {
          var depth = 1;
          var jb = i + 1;
          while (jb < n && depth) {
            if (src[jb] === '{') depth++;
            else if (src[jb] === '}') depth--;
            jb++;
          }
          push('str', i, jb);
          i = jb;
          mode = 'fields';
          continue;
        }
        push('punct', i, i + 1);
        i++;
        continue;
      }

      if (c === '}' || c === ',') {
        push('punct', i, i + 1);
        i++;
        continue;
      }

      if (c === '=') {
        push('op', i, i + 1);
        i++;
        mode = 'value';
        continue;
      }

      if (/[0-9]/.test(c) && mode === 'value') {
        var jn = i;
        while (jn < n && /[0-9]/.test(src[jn])) jn++;
        push('num', i, jn);
        i = jn;
        mode = 'fields';
        continue;
      }

      if (/[A-Za-z0-9_:-]/.test(c)) {
        var jw = i + 1;
        while (jw < n && /[A-Za-z0-9_:-]/.test(src[jw])) jw++;
        if (mode === 'key') {
          push('fn', i, jw);
          mode = 'fields';
        } else if (mode === 'value') {
          push('str', i, jw);
          mode = 'fields';
        } else {
          push('kw', i, jw);
        }
        i = jw;
        continue;
      }

      push('punct', i, i + 1);
      i++;
    }

    return out;
  }

  function tokenize(src) {
    var out = [];
    var i = 0;
    var n = src.length;

    function push(cls, a, b) {
      if (a >= b) return;
      out.push({ cls: cls, text: src.slice(a, b) });
    }

    function lastSig() {
      for (var k = out.length - 1; k >= 0; k--) {
        if (out[k].text.trim()) return out[k];
      }
      return null;
    }

    function peekIdent(at) {
      if (at >= n || !/[A-Za-z_]/.test(src[at])) return '';
      var j = at + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      return src.slice(at, j);
    }

    while (i < n) {
      var c = src[i];

      if (c === '#') {
        var eol = src.indexOf('\n', i);
        if (eol < 0) eol = n;
        push('cmt', i, eol);
        i = eol;
        continue;
      }

      if (c === '"' || c === "'") {
        i = takeString(i, '');
        continue;
      }

      if (/[rRuUfFbB]/.test(c)) {
        var pref = peekIdent(i);
        var after = i + pref.length;
        if (PREFIX[pref] && after < n && (src[after] === '"' || src[after] === "'")) {
          i = takeString(after, pref);
          continue;
        }
      }

      if (c === '.' && src.slice(i, i + 3) === '...') {
        push('bool', i, i + 3);
        i += 3;
        continue;
      }

      if (/[0-9]/.test(c) || (c === '.' && i + 1 < n && /[0-9]/.test(src[i + 1]))) {
        var jn = i;
        if (src[jn] === '0' && jn + 1 < n && /[xXoObB]/.test(src[jn + 1])) {
          jn += 2;
          while (jn < n && /[0-9A-Fa-f_]/.test(src[jn])) jn++;
        } else {
          while (jn < n && /[0-9_]/.test(src[jn])) jn++;
          if (jn < n && src[jn] === '.') {
            jn++;
            while (jn < n && /[0-9_]/.test(src[jn])) jn++;
          }
          if (jn < n && /[eE]/.test(src[jn])) {
            jn++;
            if (jn < n && /[+-]/.test(src[jn])) jn++;
            while (jn < n && /[0-9_]/.test(src[jn])) jn++;
          }
        }
        push('num', i, jn);
        i = jn;
        continue;
      }

      if (c === '@') {
        var ja = i + 1;
        while (ja < n && /[A-Za-z0-9_.]/.test(src[ja])) ja++;
        push('dec', i, ja);
        i = ja;
        continue;
      }

      if (/[A-Za-z_]/.test(c)) {
        var w = peekIdent(i);
        var jw = i + w.length;
        var k = jw;
        while (k < n && /[ \t]/.test(src[k])) k++;
        var call = k < n && src[k] === '(';
        var prev = lastSig();
        var cls;
        if (KW[w]) cls = 'kw';
        else if (CONST[w]) cls = 'bool';
        else if (prev && prev.cls === 'kw' && /^(def|class)$/.test(prev.text)) cls = 'fn';
        else if (prev && prev.cls === 'op' && prev.text === '->') cls = 'type';
        else if (prev && prev.cls === 'punct' && prev.text === '.') cls = call ? 'fn' : 'attr';
        else if (call) cls = 'fn';
        else if (BUILTIN[w]) cls = 'fn';
        else cls = '';
        push(cls, i, jw);
        i = jw;
        continue;
      }

      var two = src.slice(i, i + 2);
      if (two === '->' || two === '**' || two === '//' || two === '==' || two === '!=' ||
          two === '<=' || two === '>=' || two === ':=' || two === '+=') {
        push('op', i, i + 2);
        i += 2;
        continue;
      }
      if ('=+-*/%<>|&^~'.indexOf(c) !== -1) {
        push('op', i, i + 1);
        i++;
        continue;
      }
      if ('[](){},.:;'.indexOf(c) !== -1) {
        push('punct', i, i + 1);
        i++;
        continue;
      }

      var js = i + 1;
      while (js < n && src[js] !== '\n' && !/[A-Za-z0-9_#'"@.[\](){},.:;+\-*/%<>=|&^~]/.test(src[js])) js++;
      push('', i, js);
      i = js;
    }

    function takeString(start, pref) {
      var q = src[start];
      var triple = src.slice(start, start + 3) === q + q + q;
      var j = start + (triple ? 3 : 1);
      var fstr = /[fF]/.test(pref);
      if (pref) push('str', start - pref.length, start);
      var from = start;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (fstr && src[j] === '{') {
          if (j + 1 < n && src[j + 1] === '{') { j += 2; continue; }
          push('str', from, j);
          var depth = 1;
          var k = j + 1;
          while (k < n && depth) {
            if (src[k] === '{') depth++;
            else if (src[k] === '}') depth--;
            k++;
          }
          push('interp', j, j + 1);
          var inner = tokenize(src.slice(j + 1, k - 1));
          for (var t = 0; t < inner.length; t++) out.push(inner[t]);
          push('interp', k - 1, k);
          from = k;
          j = k;
          continue;
        }
        if (triple) {
          if (src.slice(j, j + 3) === q + q + q) { j += 3; break; }
          j++;
        } else {
          if (src[j] === q) { j++; break; }
          if (src[j] === '\n') break;
          j++;
        }
      }
      push('str', from, j);
      return j;
    }

    return out;
  }

  function toLines(tokens) {
    var lines = [[]];
    for (var t = 0; t < tokens.length; t++) {
      var tok = tokens[t];
      var parts = tok.text.split('\n');
      for (var p = 0; p < parts.length; p++) {
        if (p) lines.push([]);
        if (parts[p]) lines[lines.length - 1].push({ cls: tok.cls, text: parts[p] });
      }
    }
    return lines;
  }

  // Full class names (not `'tok-' + cls`) so PurgeCSS keeps the token colors.
  var TOK_CLASS = {
    kw: 'tok-kw', fn: 'tok-fn', str: 'tok-str', num: 'tok-num',
    bool: 'tok-bool', cmt: 'tok-cmt', dec: 'tok-dec', type: 'tok-type',
    attr: 'tok-attr', op: 'tok-op', punct: 'tok-punct', interp: 'tok-interp'
  };

  function htmlLines(lines, showLn) {
    return lines.map(function (line, idx) {
      var inner = line.length
        ? line.map(function (tok) {
            var body = esc(tok.text);
            var cls = TOK_CLASS[tok.cls];
            return cls ? '<span class="' + cls + '">' + body + '</span>' : body;
          }).join('')
        : '&nbsp;';
      var ln = showLn
        ? '<span class="sptc-py-ln" aria-hidden="true">' + (idx + 1) + '</span>'
        : '';
      return '<div class="sptc-py-line">' +
        ln + '<code class="sptc-py-src">' + inner + '</code></div>';
    }).join('');
  }

  function mount(el) {
    if (el.dataset.ready) return;
    var srcEl = el.querySelector('pre, script');
    if (!srcEl) return;
    var lang = (el.getAttribute('data-lang') || 'python').toLowerCase();
    var source = dedent(srcEl.textContent || '');
    var tokens = lang === 'bibtex' ? tokenizeBibtex(source) : tokenize(source);
    var label = lang === 'bibtex' ? 'BibTeX' : 'Python';
    var showLn = lang !== 'bibtex';
    var html = htmlLines(toLines(tokens), showLn);
    if (!showLn) el.classList.add('no-ln');

    el.innerHTML =
      '<div class="sptc-py-chrome">' +
        '<span class="sptc-py-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '<span class="sptc-py-lang">' + label + '</span>' +
        '<button type="button" class="sptc-py-copy" aria-label="Copy ' + label + '">Copy</button>' +
      '</div>' +
      '<div class="sptc-py-body" role="region" aria-label="' + label + '">' + html + '</div>';

    var btn = el.querySelector('.sptc-py-copy');
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = 'Copied';
        btn.classList.add('ok');
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('ok');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(source).then(done).catch(function () {
          done();
        });
      } else {
        done();
      }
    });

    el.dataset.ready = '1';
    el.classList.add('is-ready');
  }

  function init() {
    var blocks = document.querySelectorAll('.sptc-py');
    for (var i = 0; i < blocks.length; i++) mount(blocks[i]);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tokenize: tokenize, tokenizeBibtex: tokenizeBibtex, dedent: dedent, toLines: toLines };
  }
})();
