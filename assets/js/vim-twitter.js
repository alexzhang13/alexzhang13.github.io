(function () {
  const link = document.querySelector(".vim-twitter");
  if (!link) return;

  const word = "twitter";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chars = document.createElement("span");
  chars.className = "vim-chars";
  const cursor = document.createElement("span");
  cursor.className = "vim-cursor";
  cursor.setAttribute("aria-hidden", "true");
  link.textContent = "";
  link.append(chars, cursor);

  function paint(text, mode, cursorAt, selection) {
    chars.replaceChildren();
    const insert = mode === "insert";
    cursor.classList.toggle("is-bar", insert);
    cursor.classList.toggle("is-block", !insert);

    for (let i = 0; i < text.length; i += 1) {
      const span = document.createElement("span");
      span.className = "vim-ch";
      span.textContent = text[i];
      if (selection && i >= selection[0] && i <= selection[1]) span.classList.add("is-selected");
      if (!insert && i === cursorAt) span.classList.add("is-block");
      chars.append(span);
    }

    const caretAfterText = insert || cursorAt >= text.length;
    cursor.hidden = !caretAfterText;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  if (reduce) {
    paint(word, "normal", word.length, null);
    return;
  }

  async function loop() {
    for (let i = 0; i <= word.length; i += 1) {
      paint(word.slice(0, i), "insert", i, null);
      if (i < word.length) await wait(130);
    }
    await wait(1600);
    const last = word.length - 1;
    paint(word, "normal", last, null);
    await wait(260);
    for (let at = last; at >= 0; at -= 1) {
      paint(word, "visual", at, [at, last]);
      await wait(at === last ? 180 : 70);
    }
    await wait(700);
    paint("", "normal", 0, null);
    await wait(1100);
    loop();
  }

  loop();
})();
