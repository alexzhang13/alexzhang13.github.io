/**
 * Code comparison carousel — side-by-side train/eval LLM trajectories.
 * Parses <user>/<assistant> turns and ```repl``` Python blocks; highlights with Prism when available.
 */
(function () {
  const FENCE_RE = /```(\w+)?\n([\s\S]*?)```/g;
  const ROLE_SPLIT_RE = /<(assistant|user)>\s*/g;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightPython(code) {
    if (window.Prism && Prism.languages && Prism.languages.python) {
      try {
        return Prism.highlight(code, Prism.languages.python, "python");
      } catch (e) {
        /* fall through */
      }
    }
    return escapeHtml(code);
  }

  function renderInlineContent(text) {
    if (!text || !text.trim()) return "";
    const parts = [];
    let last = 0;
    let match;
    const re = new RegExp(FENCE_RE.source, "g");
    while ((match = re.exec(text)) !== null) {
      if (match.index > last) {
        const chunk = text.slice(last, match.index).trim();
        if (chunk) parts.push(`<p>${escapeHtml(chunk)}</p>`);
      }
      const lang = (match[1] || "").toLowerCase();
      const code = match[2].replace(/\n$/, "");
      const isRepl = lang === "repl" || lang === "python" || lang === "py";
      const highlighted = isRepl ? highlightPython(code) : escapeHtml(code);
      const label = lang === "repl" ? "REPL · Python" : lang ? lang.toUpperCase() : "CODE";
      parts.push(
        `<div class="ccc-repl"><div class="ccc-repl-label"><span>${label}</span></div>` +
          `<pre><code class="language-python">${highlighted}</code></pre></div>`
      );
      last = match.index + match[0].length;
    }
    if (last < text.length) {
      const chunk = text.slice(last).trim();
      if (chunk) parts.push(`<p>${escapeHtml(chunk)}</p>`);
    }
    return parts.join("");
  }

  function parseTrajectory(raw) {
    const text = String(raw || "").replace(/^\uFEFF/, "");
    const messages = [];
    ROLE_SPLIT_RE.lastIndex = 0;
    let match;
    const tags = [];
    while ((match = ROLE_SPLIT_RE.exec(text)) !== null) {
      tags.push({ role: match[1], index: match.index, end: match.index + match[0].length });
    }
    if (tags.length === 0) {
      const body = text.trim();
      if (body) messages.push({ role: "assistant", content: body });
      return messages;
    }
    for (let i = 0; i < tags.length; i++) {
      const start = tags[i].end;
      const end = i + 1 < tags.length ? tags[i + 1].index : text.length;
      const content = text.slice(start, end).trim();
      if (content) messages.push({ role: tags[i].role, content });
    }
    return messages;
  }

  function classifyUserMessage(content) {
    const trimmed = content.trim();
    if (/^REPL output:/i.test(trimmed)) return "stdout";
    if (/^Turn\s+\d+\s*\/\s*\d+\s*:?/i.test(trimmed)) return "turn";
    return "user";
  }

  function renderStdoutContent(text) {
    let body = text.trim();
    body = body.replace(/^REPL output:\s*/i, "");
    let varsLine = "";
    const varsMatch = body.match(/\n\s*REPL variables:\s*(\[[\s\S]*\])\s*$/);
    if (varsMatch) {
      varsLine = varsMatch[1].trim();
      body = body.slice(0, varsMatch.index).replace(/\s+$/, "");
    }
    const parts = [];
    parts.push(
      `<div class="ccc-stdout"><div class="ccc-stdout-label"><span>Stdout</span></div>` +
        `<pre class="ccc-stdout-pre">${escapeHtml(body)}</pre></div>`
    );
    if (varsLine) {
      parts.push(
        `<div class="ccc-stdout-vars"><span class="ccc-stdout-vars-label">REPL variables</span>` +
          `<code>${escapeHtml(varsLine)}</code></div>`
      );
    }
    return parts.join("");
  }

  function renderMessages(messages) {
    if (!messages.length) {
      return `<div class="ccc-status">Empty trajectory.</div>`;
    }
    return messages
      .map((msg) => {
        if (msg.role === "user") {
          const kind = classifyUserMessage(msg.content);
          if (kind === "stdout") {
            return (
              `<div class="ccc-msg ccc-msg--stdout">` +
              `<div class="ccc-msg-role">Observation</div>` +
              `<div class="ccc-msg-content">${renderStdoutContent(msg.content)}</div>` +
              `</div>`
            );
          }
          if (kind === "turn") {
            return (
              `<div class="ccc-msg ccc-msg--turn">` +
              `<div class="ccc-msg-role">User</div>` +
              `<div class="ccc-msg-content"><p class="ccc-turn-nudge">${escapeHtml(msg.content.trim())}</p></div>` +
              `</div>`
            );
          }
        }
        const roleLabel = msg.role === "user" ? "User" : "Assistant";
        return (
          `<div class="ccc-msg ccc-msg--${msg.role}">` +
          `<div class="ccc-msg-role">${roleLabel}</div>` +
          `<div class="ccc-msg-content">${renderInlineContent(msg.content)}</div>` +
          `</div>`
        );
      })
      .join("");
  }

  function formatMeta(caseInfo, side) {
    const meta = (side === "train" ? caseInfo.train_meta : caseInfo.eval_meta) || {};
    const bits = [];
    if (meta.reward != null) bits.push(`r=${Number(meta.reward).toFixed(2)}`);
    if (meta.num_turns != null) bits.push(`${meta.num_turns} turns`);
    if (meta.uid) bits.push(meta.uid);
    return bits.join(" · ");
  }

  function similarityBadge(caseInfo) {
    const sims = caseInfo.sims || {};
    if (sims.token_lcs != null) {
      return `token_lcs ${Number(sims.token_lcs).toFixed(3)}`;
    }
    return "";
  }

  class CodeComparisonCarousel {
    constructor(root) {
      this.root = root;
      this.dataPath = root.dataset.path.replace(/\/$/, "");
      this.cases = [];
      this.index = 0;
      this.cache = new Map();
      this.syncingScroll = false;

      this.select = root.querySelector("[data-ccc-select]");
      this.prevBtn = root.querySelector("[data-ccc-prev]");
      this.nextBtn = root.querySelector("[data-ccc-next]");
      this.metaEl = root.querySelector("[data-ccc-meta]");
      this.trainBody = root.querySelector("[data-ccc-train]");
      this.evalBody = root.querySelector("[data-ccc-eval]");
      this.trainSub = root.querySelector("[data-ccc-train-sub]");
      this.evalSub = root.querySelector("[data-ccc-eval-sub]");

      this.prevBtn.addEventListener("click", () => this.go(this.index - 1));
      this.nextBtn.addEventListener("click", () => this.go(this.index + 1));
      this.select.addEventListener("change", () => {
        const idx = Number(this.select.value);
        if (!Number.isNaN(idx)) this.go(idx);
      });

      this.trainBody.addEventListener("scroll", () => this.onScroll(this.trainBody, this.evalBody));
      this.evalBody.addEventListener("scroll", () => this.onScroll(this.evalBody, this.trainBody));

      this.init();
    }

    onScroll(source, target) {
      if (this.syncingScroll) return;
      this.syncingScroll = true;
      target.scrollTop = source.scrollTop;
      requestAnimationFrame(() => {
        this.syncingScroll = false;
      });
    }

    clearSpacers() {
      this.root.querySelectorAll(".ccc-scroll-spacer").forEach((el) => el.remove());
    }

    equalizeScrollHeights() {
      this.clearSpacers();
      const trainH = this.trainBody.scrollHeight;
      const evalH = this.evalBody.scrollHeight;
      const diff = Math.abs(trainH - evalH);
      if (diff < 2) return;
      const spacer = document.createElement("div");
      spacer.className = "ccc-scroll-spacer";
      spacer.style.height = `${diff}px`;
      spacer.setAttribute("aria-hidden", "true");
      if (trainH < evalH) this.trainBody.appendChild(spacer);
      else this.evalBody.appendChild(spacer);
    }

    setStatus(msg) {
      this.clearSpacers();
      const html = `<div class="ccc-status">${escapeHtml(msg)}</div>`;
      this.trainBody.innerHTML = html;
      this.evalBody.innerHTML = html;
    }

    async init() {
      this.setStatus("Loading trajectories…");
      try {
        const res = await fetch(`${this.dataPath}/manifest.json`);
        if (!res.ok) throw new Error(`Failed to load manifest (${res.status})`);
        const data = await res.json();
        this.cases = data.cases || [];
        if (!this.cases.length) {
          this.setStatus("No trajectory cases found.");
          return;
        }
        this.select.innerHTML = this.cases
          .map((c, i) => `<option value="${i}">${escapeHtml(c.label || c.id)}</option>`)
          .join("");
        await this.go(0);
      } catch (err) {
        console.error(err);
        this.setStatus(err.message || "Failed to load trajectories.");
      }
    }

    async fetchText(relPath) {
      const url = `${this.dataPath}/${relPath}`;
      if (this.cache.has(url)) return this.cache.get(url);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load ${relPath} (${res.status})`);
      const text = await res.text();
      this.cache.set(url, text);
      return text;
    }

    async go(index) {
      if (!this.cases.length) return;
      const next = Math.max(0, Math.min(this.cases.length - 1, index));
      this.index = next;
      this.select.value = String(next);
      this.prevBtn.disabled = next === 0;
      this.nextBtn.disabled = next === this.cases.length - 1;

      const caseInfo = this.cases[next];
      const badge = similarityBadge(caseInfo);
      const verdictBits = [];
      if (caseInfo.verdict) verdictBits.push(caseInfo.verdict);
      if (caseInfo.lined_up) verdictBits.push(caseInfo.lined_up);
      const verdict = verdictBits.length
        ? `<span class="ccc-badge">${escapeHtml(verdictBits.join(" · "))}</span>`
        : "";
      this.metaEl.innerHTML =
        `<span>${next + 1} / ${this.cases.length}</span>` +
        (badge ? `<span>${escapeHtml(badge)}</span>` : "") +
        verdict;

      this.trainSub.textContent = formatMeta(caseInfo, "train");
      this.evalSub.textContent = formatMeta(caseInfo, "eval");
      this.setStatus("Loading…");

      try {
        const [trainRaw, evalRaw] = await Promise.all([
          this.fetchText(caseInfo.train),
          this.fetchText(caseInfo.eval),
        ]);
        this.trainBody.innerHTML = renderMessages(parseTrajectory(trainRaw));
        this.evalBody.innerHTML = renderMessages(parseTrajectory(evalRaw));
        this.trainBody.scrollTop = 0;
        this.evalBody.scrollTop = 0;
        // Wait a frame so layout/fonts settle before measuring heights.
        requestAnimationFrame(() => {
          this.equalizeScrollHeights();
          this.trainBody.scrollTop = 0;
          this.evalBody.scrollTop = 0;
        });
      } catch (err) {
        console.error(err);
        this.setStatus(err.message || "Failed to load pair.");
      }
    }
  }

  function boot() {
    document.querySelectorAll("[data-code-comparison-carousel]").forEach((el) => {
      if (el.dataset.cccReady) return;
      el.dataset.cccReady = "1";
      new CodeComparisonCarousel(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
