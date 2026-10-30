// Teaser story (1080x1920): how many traders are in. Real numbers only, no names.
// usage: node scripts/story-tease.js <out.png> <opened> <signed> [firstNo]
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [out, openedArg, signedArg, firstArg] = process.argv.slice(2);
const opened = Number(openedArg), signed = Number(signedArg), first = Number(firstArg || 15);
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">THE FIELD IS GROWING</text>
<text x="${X - 6}" y="600" font-family="${D}" font-weight="900" font-size="300" fill="${C.green}">${opened}</text>
<text x="${X}" y="690" font-family="${D}" font-weight="900" font-size="88" fill="${C.bone}">TRADERS ARE IN.</text>
<text x="${X}" y="752" font-family="${M}" font-weight="500" font-size="34" fill="${C.ash}">${signed} already hold a contender number.</text>`;

// grid of contender numbers (real ones), then empty "?" seats
const cols = 6, tw = (CW - (cols - 1) * 12) / cols, th = 62, gy = 800;
const shown = Math.min(signed, 6 * 7 - 6); // leave the last row for "?"
const total = Math.ceil((shown + 6) / cols) * cols;
for (let i = 0; i < total; i++) {
  const x = X + (i % cols) * (tw + 12), y = gy + Math.floor(i / cols) * (th + 12);
  if (i < shown) {
    const hot = i >= shown - 4; // the newest few glow
    svg += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="${hot ? C.green : C.black2}" stroke="${hot ? C.green : C.line}" stroke-width="2"/>
    <text x="${x + tw / 2}" y="${y + 43}" font-family="${D}" font-weight="900" font-size="34" fill="${hot ? C.black : C.bone}" text-anchor="middle">#${String(first + i).padStart(4, "0")}</text>`;
  } else {
    svg += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="none" stroke="${C.green}" stroke-width="3" stroke-dasharray="10 8"/>
    <text x="${x + tw / 2}" y="${y + 45}" font-family="${D}" font-weight="900" font-size="38" fill="${C.green}" text-anchor="middle">YOU?</text>`;
  }
}
const gridEnd = gy + (total / cols) * (th + 12);
if (signed > shown) svg += `<text x="${X}" y="${gridEnd + 30}" font-family="${M}" font-size="24" fill="${C.dim}">+ ${signed - shown} more contenders</text>`;

svg += `<text x="${X}" y="1440" font-family="${D}" font-weight="900" font-size="58" fill="${C.bone}">12 SEATS AT THE LIVE FINALS.</text>
<text x="${X}" y="1492" font-family="${M}" font-weight="500" font-size="32" fill="${C.ash}">Registration opens on OKX Sunday 1 Nov.</text>
<rect x="${X}" y="1540" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">Get your number: t.me/PNLLeagueBot</text>
<text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out, "| grid end y", Math.round(gridEnd));
