// Launch announcement image (1080x1080, square so Telegram never crops it) for /photo: trophy photo + "The competition is live". Facts only, no profit claims.
// Headline sits in the photo's dark top, the trophy stays clear in the middle, the register bar sits on the dark stage.
// usage: node scripts/announce-image.js <out.png> [background.jpg]
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const A = path.join(__dirname, "..", "assets");
const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "launch-announce.png");
const bgFile = process.argv[3] || path.join(A, "trophy-bg.jpg");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1080, X = 72, CW = W - 2 * X;
const bg = "data:image/jpeg;base64," + fs.readFileSync(bgFile).toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/>
<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMin slice" xlink:href="${bg}"/>
<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.black}" stop-opacity="0.85"/><stop offset="0.3" stop-color="${C.black}" stop-opacity="0.4"/>
  <stop offset="0.42" stop-color="${C.black}" stop-opacity="0"/><stop offset="0.64" stop-color="${C.black}" stop-opacity="0.1"/>
  <stop offset="0.76" stop-color="${C.black}" stop-opacity="0.8"/><stop offset="1" stop-color="${C.black}" stop-opacity="0.96"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#shade)"/>

<rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="46" width="180" height="60" viewBox="20 9 244 81">${WORDMARK}</svg>
<g transform="translate(${W - X},92)">
  <rect x="-224" y="-36" width="224" height="50" fill="${C.black}" fill-opacity="0.6" stroke="${C.green}" stroke-width="3"/>
  <circle cx="-198" cy="-11" r="9" fill="${C.green}"/>
  <text x="-16" y="1" font-family="${D}" font-weight="900" font-size="34" letter-spacing="4" fill="${C.green}" text-anchor="end">LIVE NOW</text>
</g>

<text x="${X - 4}" y="232" font-family="${D}" font-weight="900" font-size="118" fill="${C.bone}">THE COMPETITION</text>
<text x="${X - 4}" y="344" font-family="${D}" font-weight="900" font-size="128" fill="${C.green}">IS LIVE.</text>

<text x="${X}" y="806" font-family="${D}" font-weight="900" font-size="48" fill="${C.bone}">PROVE YOU'RE THE BEST.</text>
<rect x="${X}" y="828" width="${CW}" height="104" fill="${C.green}"/>
<text x="${X + 28}" y="880" font-family="${D}" font-weight="900" font-size="44" fill="${C.black}">REGISTER ON OKX NOW</text>
<text x="${X + 28}" y="916" font-family="${M}" font-weight="500" font-size="24" fill="${C.black}">Open until Wednesday 4 Nov</text>
<path d="M${W - X - 100} 880 h50 m-20 -22 l22 22 l-22 22" fill="none" stroke="${C.black}" stroke-width="9" stroke-linecap="square"/>

<text x="${X}" y="984" font-family="${D}" font-weight="900" font-size="32" fill="${C.bone}">5,000 USDT PRIZE POOL <tspan fill="${C.ash}">·</tspan> 12 SEATS AT THE LIVE FINALS</text>
<text x="${X}" y="1028" font-family="${M}" font-size="18" fill="${C.dim}">18+. KYC required. Trading involves risk. · PNL League by CE · Presented by OKX</text>
</svg>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
