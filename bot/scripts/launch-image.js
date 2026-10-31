// Launch-day image (1080x1350) for /launch: "The competition is live". Facts only, no profit claims.
// usage: node scripts/launch-image.js <out.png> [background.jpg|png]   (photo is cropped to fill and darkened for legibility)
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "launch-live.png");
const bgFile = process.argv[3];
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1350, X = 72, CW = W - 2 * X;

// rising candles behind the headline (fixed pseudo-random, trending up)
let candles = "";
for (let i = 0; i < 16; i++) {
  const x = 60 + i * 62, up = i % 4 !== 2, base = 1010 - i * 34 + ((i * 37) % 50);
  const body = 60 + ((i * 53) % 90), wick = body + 40 + ((i * 29) % 40);
  const top = base - body;
  candles += `<rect x="${x + 15}" y="${top - (wick - body) / 2}" width="4" height="${wick}" fill="${up ? C.green : C.slate}" opacity="0.18"/>
  <rect x="${x}" y="${top}" width="34" height="${body}" fill="${up ? C.green : C.slate}" opacity="${up ? 0.16 : 0.12}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/>
${bgFile ? `<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" xlink:href="data:image/${/\.png$/i.test(bgFile) ? "png" : "jpeg"};base64,${fs.readFileSync(bgFile).toString("base64")}"/>
<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.black}" stop-opacity="0.92"/><stop offset="0.42" stop-color="${C.black}" stop-opacity="0.55"/><stop offset="0.62" stop-color="${C.black}" stop-opacity="0.55"/><stop offset="0.78" stop-color="${C.black}" stop-opacity="0.9"/><stop offset="1" stop-color="${C.black}" stop-opacity="0.97"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#shade)"/>` : candles}
<rect width="${W}" height="16" fill="${C.green}"/>
<svg x="${X - 6}" y="64" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
<g transform="translate(${W - X},112)">
  <rect x="-250" y="-40" width="250" height="56" fill="none" stroke="${C.green}" stroke-width="3"/>
  <circle cx="-222" cy="-12" r="10" fill="${C.green}"/>
  <text x="-18" y="2" font-family="${D}" font-weight="900" font-size="38" letter-spacing="4" fill="${C.green}" text-anchor="end">LIVE NOW</text>
</g>

<text x="${X}" y="262" font-family="${D}" font-weight="700" font-size="32" letter-spacing="9" fill="${C.ash}">EARLY LIST · YOUR INVITATION</text>
<text x="${X - 6}" y="470" font-family="${D}" font-weight="900" font-size="210" fill="${C.bone}">YOU'RE</text>
<text x="${X - 6}" y="660" font-family="${D}" font-weight="900" font-size="186" fill="${C.bone}">AMONG THE</text>
<text x="${X - 6}" y="880" font-family="${D}" font-weight="900" font-size="230" fill="${C.green}">FIRST.</text>
<text x="${X}" y="940" font-family="${D}" font-weight="700" font-size="34" letter-spacing="6" fill="${C.ash}">THE COMPETITION IS LIVE. YOU GET IN FIRST.</text>

<rect x="${X}" y="975" width="${CW}" height="126" fill="${C.green}"/>
<text x="${X + 32}" y="1036" font-family="${D}" font-weight="900" font-size="50" fill="${C.black}">REGISTER ON OKX NOW</text>
<text x="${X + 32}" y="1078" font-family="${M}" font-weight="500" font-size="28" fill="${C.black}">Open until Wednesday 4 Nov</text>
<path d="M${W - X - 110} 1038 h56 m-22 -24 l24 24 l-24 24" fill="none" stroke="${C.black}" stroke-width="10" stroke-linecap="square"/>

<text x="${X}" y="1170" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">5,000 USDT PRIZE POOL <tspan fill="${C.slate}">·</tspan> 12 SEATS AT THE LIVE FINALS</text>
<rect x="${X}" y="1206" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1250" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1284" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text>
</svg>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
