// Story (1080x1920): "Registration is fixed. Join now." + the two reasons someone may still be blocked. Inside the IG safe zone (~260-1540).
// usage: node scripts/story-regfixed.js <out.png>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "highlights", "story-registration-fixed.png");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;

function card(y, n, title, lines) {
  let s = `<rect x="${X}" y="${y}" width="${CW}" height="${96 + lines.length * 44}" fill="${C.black2}" stroke="${C.line}" stroke-width="3"/>
  <text x="${X + 32}" y="${y + 66}" font-family="${D}" font-weight="900" font-size="52" fill="${C.green}">${n}</text>
  <text x="${X + 112}" y="${y + 66}" font-family="${D}" font-weight="900" font-size="52" fill="${C.bone}">${title}</text>`;
  lines.forEach((l, i) => { s += `<text x="${X + 112}" y="${y + 116 + i * 44}" font-family="${M}" font-weight="500" font-size="28" fill="${C.ash}">${l}</text>`; });
  return s;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">REGISTRATION UPDATE</text>

<text x="${X - 4}" y="460" font-family="${D}" font-weight="900" font-size="124" fill="${C.bone}">REGISTRATION</text>
<text x="${X - 4}" y="580" font-family="${D}" font-weight="900" font-size="124" fill="${C.green}">IS FIXED</text>
<path d="M${X + 392} 532 l26 28 l52 -62" fill="none" stroke="${C.green}" stroke-width="16" stroke-linecap="square"/>
<text x="${X}" y="650" font-family="${M}" font-weight="500" font-size="30" fill="${C.bone}">Open the competition, tap Join, check "Enrolled".</text>

<text x="${X}" y="760" font-family="${D}" font-weight="900" font-size="56" fill="${C.bone}">STILL BLOCKED? IT'S ONE OF TWO:</text>
${card(800, "01", "KYC LEVEL 2", ["OKX app &gt; profile picture &gt; Verification.", "Finish Level 2, then try again."])}
${card(1010, "02", "THE REBIND STEP", ["Had an OKX account before PNL League?", "Use the rebind link in our bot first,", "then join."])}

<rect x="${X}" y="1260" width="${CW}" height="112" fill="${C.green}"/>
<text x="${X + 32}" y="1314" font-family="${D}" font-weight="900" font-size="46" fill="${C.black}">BOTH LINKS IN THE BOT</text>
<text x="${X + 32}" y="1352" font-family="${M}" font-weight="500" font-size="28" fill="${C.black}">t.me/PNLLeagueBot</text>
<path d="M${W - X - 100} 1316 h50 m-20 -22 l22 22 l-22 22" fill="none" stroke="${C.black}" stroke-width="9" stroke-linecap="square"/>

<text x="${X}" y="1440" font-family="${M}" font-weight="500" font-size="30" fill="${C.bone}">Still stuck? Send /uid in the bot and we'll check.</text>
<rect x="${X}" y="1480" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1518" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1550" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
