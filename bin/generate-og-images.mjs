#!/usr/bin/env node
// Builds static Open Graph cards for GitHub Pages.
//
// Crawlers do not run JavaScript. Each blog post gets a PNG at
// assets/og/blog/<year>/<slug>.png, and other pages share assets/og/home.png.
// Set `preview` in a post's front matter to the intro that should lead the
// card (skip "paper is on arXiv" / "code is here" lines). Optional
// `preview_image` is a figure from the post, shown under that text.
// `preview_byline` overrides the author line.

import { createRequire } from "node:module";
import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(raw) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return {};
  const front = raw.slice(raw.indexOf("\n") + 1, end).replace(/\r\n/g, "\n");
  const data = {};
  const lines = front.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    const marker = match[2].trim();
    if (marker === ">" || marker === "|") {
      const folded = marker === ">";
      const parts = [];
      i += 1;
      while (i < lines.length && (lines[i].startsWith(" ") || lines[i].trim() === "")) {
        parts.push(lines[i].trim());
        i += 1;
      }
      i -= 1;
      data[key] = folded ? parts.join(" ").replace(/\s+/g, " ").trim() : parts.join("\n").trim();
      continue;
    }
    data[key] = unquote(marker);
  }
  const authors = [];
  let inAuthors = false;
  for (const line of front.split("\n")) {
    if (/^authors:\s*$/.test(line)) {
      inAuthors = true;
      continue;
    }
    if (!inAuthors) continue;
    if (/^\S/.test(line)) break;
    const author = line.match(/^\s+- name:\s+(.+?)\s*$/);
    if (author) authors.push(unquote(author[1]));
  }
  data.authors = authors;
  return data;
}

function joinNames(names) {
  if (names.length === 0) return "Alex Zhang";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function dateParts(value, fallbackYear) {
  const match = String(value || "").match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return { year: fallbackYear, label: "" };
  return {
    year: match[1],
    label: `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`,
  };
}

async function fontFace(weight) {
  const pkg = path.dirname(require.resolve("@fontsource/roboto/package.json"));
  const files = await readdir(path.join(pkg, "files"));
  const name = files.find((file) => file.includes(`-latin-${weight}-normal`) && file.endsWith(".woff"));
  if (!name) throw new Error(`Missing Roboto weight ${weight}`);
  const bytes = await readFile(path.join(pkg, "files", name));
  return `@font-face { font-family: Roboto; font-weight: ${weight}; font-style: normal; src: url("data:font/woff;base64,${bytes.toString("base64")}") format("woff"); }`;
}

async function imageSrc(sitePath) {
  if (!sitePath) return "";
  const relative = sitePath.replace(/^\//, "");
  const absolute = path.join(root, relative);
  const bytes = await readFile(absolute);
  const ext = path.extname(absolute).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

function cardHtml({ fonts, card }) {
  const figure = card.image
    ? `<div class="figure"><img src="${card.image}" alt=""></div>`
    : "";
  const kicker = card.home
    ? `<div class="kicker">alexzhang13.github.io</div>`
    : `<div class="byline">${escapeHtml(card.byline)}${card.dateLabel ? `<span class="date">${escapeHtml(card.dateLabel)}</span>` : ""}</div>`;
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    ${fonts}
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1200px; height: 630px; background: #fff; }
    body {
      font-family: Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #1c1c1c;
    }
    .card {
      width: 1200px;
      height: 630px;
      padding: 48px 56px 36px;
      display: flex;
      flex-direction: column;
      background: #fff;
      overflow: hidden;
    }
    .byline {
      font-size: 22px;
      font-weight: 500;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    .byline .date { color: #6b6b6b; font-weight: 400; }
    .byline .date::before { content: "·"; color: #b5b5b5; margin: 0 10px; }
    h1 {
      margin: 14px 0 0;
      font-size: ${card.image ? 40 : 52}px;
      line-height: 1.12;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: ${card.image ? 3 : 4};
      overflow: hidden;
    }
    p {
      margin: 16px 0 0;
      font-size: ${card.image ? 24 : 30}px;
      line-height: 1.35;
      font-weight: 400;
      color: #2a2a2a;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: ${card.image ? 3 : 6};
      overflow: hidden;
    }
    .figure {
      flex: 1 1 auto;
      min-height: 0;
      margin-top: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .figure img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
    body.home .card { justify-content: center; padding-bottom: 56px; }
    body.home .kicker {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #e77500;
    }
    body.home h1 { margin-top: 12px; font-size: 76px; -webkit-line-clamp: 2; }
    body.home p { margin-top: 22px; font-size: 32px; max-width: 980px; -webkit-line-clamp: 4; }
  </style>
</head>
<body class="${card.home ? "home" : ""}">
  <article class="card">
    <div class="copy">
      ${kicker}
      <h1>${escapeHtml(card.title)}</h1>
      <p>${escapeHtml(card.preview)}</p>
    </div>
    ${figure}
  </article>
</body>
</html>`;
}

async function posts() {
  const dir = path.join(root, "_posts");
  const names = (await readdir(dir)).filter((name) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name));
  const cards = [];
  for (const name of names) {
    const match = name.match(/^(\d{4})-\d{2}-\d{2}-(.+)\.md$/);
    const raw = await readFile(path.join(dir, name), "utf8");
    const data = parseFrontMatter(raw);
    if (data.published === "false") continue;
    const { year, label } = dateParts(data.date, match[1]);
    const preview = (data.preview || data.description || "").replace(/\s+/g, " ").trim();
    if (!data.title || !preview) {
      throw new Error(`${name} needs a title and a preview or description`);
    }
    cards.push({
      title: data.title,
      preview,
      byline: data.preview_byline || joinNames(data.authors || []),
      dateLabel: label,
      image: await imageSrc(data.preview_image),
      out: path.join(root, "assets", "og", "blog", year, `${match[2]}.png`),
    });
  }
  return cards;
}

async function main() {
  const fonts = [await fontFace(400), await fontFace(500), await fontFace(700)].join("\n");
  const cards = await posts();
  cards.push({
    home: true,
    title: "Alex L. Zhang",
    preview:
      "PhD student at MIT CSAIL. I work on areas where language models are underutilized or inefficient.",
    image: "",
    out: path.join(root, "assets", "og", "home.png"),
  });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  try {
    for (const card of cards) {
      await page.setContent(cardHtml({ fonts, card }), { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await mkdir(path.dirname(card.out), { recursive: true });
      await page.screenshot({ path: card.out, type: "png" });
      console.log(path.relative(root, card.out));
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
