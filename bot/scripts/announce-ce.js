// Official announcement graphic for the CE Telegram channel (1080x1350): trophy photo + "PNL League is live" + 3 steps + "Created by CE".
// usage: node scripts/announce-ce.js <out.png> [background.jpg]
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const A = path.join(__dirname, "..", "assets");
const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "ce-official-announcement.png");
const bgFile = process.argv[3] || path.join(A, "trophy-bg.jpg");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1350, X = 72, CW = W - 2 * X;
const bg = "data:image/jpeg;base64," + fs.readFileSync(bgFile).toString("base64");

// three step tiles along the bottom
const tw = (CW - 2 * 18) / 3;
const steps = [["01", "SIGN UP", "or rebind your OKX"], ["02", "JOIN", "check \"Enrolled\""], ["03", "TRADE", "climb the board"]];
const tiles = steps.map(([n, t, s], i) => {
  const x = X + i * (tw + 18);
  return `<rect x="${x}" y="1036" width="${tw}" height="128" fill="${C.black}" fill-opacity="0.78" stroke="${C.green}" stroke-width="3"/>
  <text x="${x + 22}" y="1086" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">${n}</text>
  <text x="${x + 78}" y="1086" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">${t}</text>
  <text x="${x + 22}" y="1136" font-family="${M}" font-weight="500" font-size="22" fill="${C.ash}">${s}</text>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/>
<image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" xlink:href="${bg}"/>
<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.black}" stop-opacity="0.88"/><stop offset="0.3" stop-color="${C.black}" stop-opacity="0.45"/>
  <stop offset="0.45" stop-color="${C.black}" stop-opacity="0"/><stop offset="0.66" stop-color="${C.black}" stop-opacity="0.15"/>
  <stop offset="0.76" stop-color="${C.black}" stop-opacity="0.8"/><stop offset="1" stop-color="${C.black}" stop-opacity="0.96"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#shade)"/>

<rect width="${W}" height="16" fill="${C.green}"/>
<svg x="${X - 6}" y="64" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
<g transform="translate(${W - X},112)">
  <rect x="-250" y="-40" width="250" height="56" fill="${C.black}" fill-opacity="0.6" stroke="${C.green}" stroke-width="3"/>
  <circle cx="-222" cy="-12" r="10" fill="${C.green}"/>
  <text x="-18" y="2" font-family="${D}" font-weight="900" font-size="38" letter-spacing="4" fill="${C.green}" text-anchor="end">LIVE NOW</text>
</g>

<text x="${X}" y="226" font-family="${D}" font-weight="700" font-size="32" letter-spacing="9" fill="${C.ash}">OFFICIAL ANNOUNCEMENT</text>
<text x="${X - 4}" y="350" font-family="${D}" font-weight="900" font-size="132" fill="${C.bone}">PNL LEAGUE</text>
<text x="${X - 4}" y="480" font-family="${D}" font-weight="900" font-size="150" fill="${C.green}">IS LIVE.</text>

<text x="${X}" y="1000" font-family="${D}" font-weight="900" font-size="46" fill="${C.bone}">3 STEPS TO ENTER</text>
${tiles}

<text x="${X}" y="1222" font-family="${D}" font-weight="900" font-size="34" fill="${C.bone}">5,000 USDT PRIZE POOL <tspan fill="${C.ash}">·</tspan> 12 SEATS AT THE LIVE FINALS</text>
<rect x="${X}" y="1248" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1288" font-family="${D}" font-weight="900" font-size="30" letter-spacing="4" fill="${C.green}">CREATED BY CE</text>
<text x="${W - X}" y="1288" font-family="${D}" font-weight="700" font-size="26" letter-spacing="4" fill="${C.ash}" text-anchor="end">PRESENTED BY OKX</text>
<text x="${X}" y="1324" font-family="${M}" font-size="21" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
