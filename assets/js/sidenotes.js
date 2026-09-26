(function () {
  var root = document.querySelector(".post.has-sidenotes");
  var content = document.getElementById("markdown-content");
  if (!root || !content) return;

  var refs = Array.prototype.slice.call(content.querySelectorAll("a.footnote"));
  if (!refs.length) return;

  var list = document.createElement("div");
  list.className = "sidenote-list";
  content.appendChild(list);

  var notes = refs
    .map(function (ref) {
      var id = decodeURIComponent(ref.getAttribute("href").replace(/^#/, ""));
      var source = document.getElementById(id);
      if (!source) return null;

      var aside = document.createElement("aside");
      aside.className = "sidenote";
      aside.id = id;
      source.removeAttribute("id");

      var back = document.createElement("a");
      back.className = "sidenote-num";
      back.href = ref.parentElement && ref.parentElement.id ? "#" + ref.parentElement.id : "#" + (ref.id || "");
      back.textContent = ref.textContent.trim();
      aside.appendChild(back);

      while (source.firstChild) aside.appendChild(source.firstChild);
      source.remove();
      list.appendChild(aside);
      return { ref: ref, aside: aside };
    })
    .filter(Boolean);

  var NOTE_W = 240;
  var GAP = 28;
  var MIN_TEXT = 420;

  function clearActive() {
    root.querySelectorAll(".is-active").forEach(function (el) {
      el.classList.remove("is-active");
    });
  }

  function fullyVisible(el) {
    var rect = el.getBoundingClientRect();
    return rect.top >= 72 && rect.bottom <= window.innerHeight - 12;
  }

  function highlight(el) {
    clearActive();
    el.classList.remove("is-active");
    void el.offsetWidth;
    el.classList.add("is-active");
    if (!fullyVisible(el)) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (el.id) history.replaceState(null, "", "#" + el.id);
  }

  function place() {
    root.classList.remove("sidenotes-fallback");
    content.style.paddingRight = "";
    notes.forEach(function (note) {
      note.aside.style.position = "";
      note.aside.style.top = "";
      note.aside.style.left = "";
      note.aside.style.right = "";
      note.aside.style.width = "";
    });

    var rect = content.getBoundingClientRect();
    var gutter = window.innerWidth - rect.right;
    var mode = "fallback";
    if (gutter >= NOTE_W + GAP + 12) mode = "hang";
    else if (rect.width - NOTE_W - GAP >= MIN_TEXT) mode = "inset";

    if (mode === "fallback") {
      root.classList.add("sidenotes-fallback");
      return;
    }

    if (mode === "inset") content.style.paddingRight = NOTE_W + GAP + "px";

    var contentTop = content.getBoundingClientRect().top;
    var cursor = 0;
    notes.forEach(function (note) {
      var refTop = note.ref.getBoundingClientRect().top - contentTop;
      var top = Math.max(refTop, cursor);
      note.aside.style.top = top + "px";
      note.aside.style.width = NOTE_W + "px";
      if (mode === "hang") {
        note.aside.style.left = "calc(100% + " + GAP + "px)";
        note.aside.style.right = "auto";
      } else {
        note.aside.style.left = "auto";
        note.aside.style.right = "0";
      }
      cursor = top + note.aside.offsetHeight + 14;
    });
  }

  root.addEventListener("click", function (event) {
    var link = event.target.closest("a.footnote, a.sidenote-num");
    if (!link || !root.contains(link)) return;
    var id = decodeURIComponent(link.getAttribute("href").replace(/^#/, ""));
    var target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    highlight(target);
  });

  place();
  window.addEventListener("load", place);
  window.addEventListener("resize", place);
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    window.MathJax.startup.promise.then(place);
  }

  var hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (hash) {
    var open = document.getElementById(hash);
    if (open) highlight(open);
  }
})();
