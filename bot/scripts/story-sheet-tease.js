// Teaser story built on a screenshot of the Users sheet. Names/phones must be blurred first (see blur step in README / chat):
// usage: node scripts/story-sheet-tease.js <blurred-screenshot.png> <out.png> <count>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [shot, out, countArg] = process.argv.slice(2);
const count = Number(countArg);
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;

const img = fs.readFileSync(shot);
// PNG size from the IHDR header
const iw = img.readUInt32BE(16), ih = img.readUInt32BE(20);
const sw = CW, sh = Math.round((ih / iw) * sw);
const sy = 800;
const b64 = "data:image/png;base64," + img.toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">LIVE FROM THE SHEET</text>
<text x="${X - 6}" y="600" font-family="${D}" font-weight="900" font-size="300" fill="${C.green}">${count}+</text>
<text x="${X}" y="690" font-family="${D}" font-weight="900" font-size="88" fill="${C.bone}">TRADERS ARE IN.</text>
<text x="${X}" y="752" font-family="${M}" font-weight="500" font-size="34" fill="${C.ash}">And the list keeps scrolling.</text>
<rect x="${X - 10}" y="${sy - 10}" width="${sw + 20}" height="${sh + 20}" fill="${C.bone}"/>
<image x="${X}" y="${sy}" width="${sw}" height="${sh}" xlink:href="${b64}" preserveAspectRatio="none"/>
<rect x="${X - 10}" y="${sy - 10}" width="${sw + 20}" height="${sh + 20}" fill="none" stroke="${C.green}" stroke-width="6"/>
<rect x="${X + sw - 250}" y="${sy + sh - 18}" width="270" height="64" fill="${C.green}"/>
<text x="${X + sw - 115}" y="${sy + sh + 26}" font-family="${D}" font-weight="900" font-size="38" fill="${C.black}" text-anchor="middle">ROW ${count + 1}…</text>
<text x="${X}" y="1440" font-family="${D}" font-weight="900" font-size="58" fill="${C.bone}">12 SEATS AT THE LIVE FINALS.</text>
<text x="${X}" y="1492" font-family="${M}" font-weight="500" font-size="32" fill="${C.ash}">Registration opens on OKX Sunday 1 Nov.</text>
<rect x="${X}" y="1540" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">Get in: t.me/PNLLeagueBot</text>
<text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out, "| screenshot box", sw + "x" + sh, "at y", sy);
