// Story (1080x1920): "Can't join yet? We're on it" + send us your OKX UID. Content kept inside the IG safe zone (~260-1540).
// usage: node scripts/story-regissue.js <out.png>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "story-registration-issue.png");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">REGISTRATION UPDATE</text>

<text x="${X - 4}" y="470" font-family="${D}" font-weight="900" font-size="128" fill="${C.bone}">CAN'T JOIN YET?</text>
<text x="${X - 4}" y="596" font-family="${D}" font-weight="900" font-size="128" fill="${C.green}">WE'RE ON IT.</text>

<rect x="${X}" y="650" width="${CW}" height="112" fill="${C.black2}" stroke="${C.line}" stroke-width="3"/>
<text x="${X + 30}" y="718" font-family="${M}" font-weight="500" font-size="30" fill="${C.ash}">"You don't meet the requirements..."</text>
<text x="${X}" y="830" font-family="${M}" font-weight="500" font-size="34" fill="${C.bone}">Seeing this on OKX? You're not alone.</text>
<text x="${X}" y="878" font-family="${M}" font-weight="500" font-size="34" fill="${C.bone}">We're fixing it with the OKX team,</text>
<text x="${X}" y="926" font-family="${M}" font-weight="500" font-size="34" fill="${C.bone}">and you haven't missed anything.</text>

<rect x="${X}" y="990" width="${CW}" height="360" fill="none" stroke="${C.green}" stroke-width="4"/>
<text x="${X + 36}" y="1064" font-family="${D}" font-weight="900" font-size="60" fill="${C.green}">SEND US YOUR OKX UID</text>
<text x="${X + 36}" y="1130" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">01  <tspan font-family="${M}" font-weight="500" font-size="30">Open t.me/PNLLeagueBot</tspan></text>
<text x="${X + 36}" y="1186" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">02  <tspan font-family="${M}" font-weight="500" font-size="30">Send /uid and paste your UID</tspan></text>
<text x="${X + 36}" y="1242" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">03  <tspan font-family="${M}" font-weight="500" font-size="30">Or DM it to @pnlleague</tspan></text>
<text x="${X + 36}" y="1310" font-family="${M}" font-size="24" fill="${C.ash}">Find it: OKX app &gt; profile picture &gt; UID under your name</text>

<text x="${X}" y="1440" font-family="${D}" font-weight="900" font-size="46" fill="${C.bone}">WE'LL MESSAGE YOU THE MOMENT IT'S FIXED.</text>
<rect x="${X}" y="1490" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1534" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1566" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
