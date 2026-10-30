// One "You asked" Q&A story (1080x1920) in PNL League style. Anonymous question, factual answer.
// usage: node scripts/story-qa.js <out.png>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "story-qa-nasdaq.png");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const W = 1080, H = 1920, X = 72;

function wrap(text, size, maxW, per) {
  const max = Math.floor(maxW / (size * per)), lines = []; let cur = "";
  for (const w of text.split(/\s+/)) { if (!cur) cur = w; else if ((cur + " " + w).length <= max) cur += " " + w; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines;
}

const question = "I'm a Nasdaq trader. Can I enter the competition on OKX? It's mainly crypto.";
const title = ["YES, OKX LISTS", "STOCKS TOO"];
const answer = [
  ["!", "Stocks like Nasdaq, Inc. (NDAQ) trade on OKX as spot and perpetual contracts. Search the ticker in the app."],
  ["", "Which markets count for the leaderboard is set in OKX's campaign terms."],
];

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">YOU ASKED</text>`;

// question bubble
let y = 400;
const qLines = wrap(question, 44, W - 2 * X - 80, 0.6);
const bh = 80 + qLines.length * 62 + 40;
svg += `<rect x="${X}" y="${y}" width="${W - 2 * X}" height="${bh}" fill="${C.black2}" stroke="${C.line}" stroke-width="3"/>
<path d="M${X + 60} ${y + bh} l0 44 l44 -44 z" fill="${C.black2}" stroke="${C.line}" stroke-width="3"/><rect x="${X + 62}" y="${y + bh - 3}" width="40" height="6" fill="${C.black2}"/>
<text x="${X + 40}" y="${y + 62}" font-family="${D}" font-weight="700" font-size="28" letter-spacing="5" fill="${C.green}">A CONTENDER ASKED</text>`;
qLines.forEach((l, i) => { svg += `<text x="${X + 40}" y="${y + 130 + i * 62}" font-family="${M}" font-weight="500" font-size="44" fill="${C.bone}">${esc(l)}</text>`; });
y += bh + 44 + 140; // clear the bubble tail, then first headline baseline

// answer
title.forEach((t, i) => { svg += `<text x="${X}" y="${y + i * 118}" font-family="${D}" font-weight="900" font-size="128" fill="${i ? C.green : C.bone}">${t}</text>`; });
y += (title.length - 1) * 118 + 44;
svg += `<rect x="${X}" y="${y}" width="120" height="8" fill="${C.green}"/>`;
y += 40;
for (const [k, text] of answer) {
  const big = k === "!", size = big ? 44 : 38;
  for (const l of wrap(text, size, W - 2 * X, 0.6)) { y += size * 1.42; svg += `<text x="${X}" y="${y}" font-family="${M}" font-weight="${big ? 500 : 400}" font-size="${size}" fill="${big ? C.bone : C.ash}">${esc(l)}</text>`; }
  y += 40;
}
if (y > 1510) console.warn("! answer runs low: y=" + Math.round(y));

svg += `<rect x="${X}" y="1540" width="${W - 2 * X}" height="2" fill="${C.line}"/>
<text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">More questions? /ask in t.me/PNLLeagueBot</text>
<text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk. Not investment advice.</text>
<text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
