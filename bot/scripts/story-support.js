// Support story (1080x1920): two ways to reach the team - DM on Instagram, or /ask in the bot.
// usage: node scripts/story-support.js <out.png>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "highlights", "story-support.png");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;

// a chat bubble; side "me" = right/green, "bot" = left/dark
function bubble(y, side, lines, label) {
  const size = 30, lh = 42, pad = 24;
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.6 + pad * 2 + 6, h = lines.length * lh + pad * 2 - 10 + (label ? 38 : 0);
  const x = side === "me" ? X + CW - 40 - w : X + 40;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="${side === "me" ? C.green : "#1A2A22"}"/>`;
  let ty = y + pad + 26;
  if (label) { s += `<text x="${x + pad}" y="${ty}" font-family="${D}" font-weight="900" font-size="26" letter-spacing="2" fill="${C.green}">${label}</text>`; ty += 38; }
  lines.forEach((l, i) => { s += `<text x="${x + pad}" y="${ty + i * lh}" font-family="${M}" font-weight="500" font-size="${size}" fill="${side === "me" ? C.black : C.bone}">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>`; });
  return { svg: s, h };
}

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
<svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">SUPPORT</text>
<text x="${X}" y="452" font-family="${D}" font-weight="900" font-size="118" fill="${C.bone}">NEED HELP?</text>
<text x="${X}" y="558" font-family="${D}" font-weight="900" font-size="118" fill="${C.green}">WE ANSWER.</text>`;

// card 1: DM
let y = 610;
svg += `<rect x="${X}" y="${y}" width="${CW}" height="150" fill="${C.black2}" stroke="${C.line}" stroke-width="3"/>
<text x="${X + 32}" y="${y + 60}" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">01</text>
<g transform="translate(${X + 140},${y + 76})"><path d="M-38 -30 h76 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-46 l-22 20 v-20 h-8 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10 z" fill="none" stroke="${C.bone}" stroke-width="7" stroke-linejoin="round"/><circle cx="-16" cy="-4" r="5" fill="${C.green}"/><circle cx="0" cy="-4" r="5" fill="${C.green}"/><circle cx="16" cy="-4" r="5" fill="${C.green}"/></g>
<text x="${X + 220}" y="${y + 70}" font-family="${D}" font-weight="900" font-size="56" fill="${C.bone}">DM US</text>
<text x="${X + 220}" y="${y + 116}" font-family="${M}" font-weight="500" font-size="32" fill="${C.ash}">@pnlleague on Instagram</text>`;

// card 2: /ask in the bot, shown as a mini chat
y += 180;
const top = y;
let inner = `<text x="${X + 32}" y="${y + 66}" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">02</text>
<text x="${X + 100}" y="${y + 70}" font-family="${D}" font-weight="900" font-size="56" fill="${C.bone}">/ASK IN THE BOT</text>`;
let cy = y + 100;
for (const [side, lines, label] of [
  ["me", ["/ask"]],
  ["bot", ["Type your question and", "we'll reply here."]],
  ["me", ["Can I use my existing", "OKX account?"]],
  ["bot", ["Yes. We'll check it", "with you before day one."], "PNL LEAGUE"],
]) {
  const b = bubble(cy, side, lines, label);
  inner += b.svg; cy += b.h + 18;
}
svg += `<rect x="${X}" y="${top}" width="${CW}" height="${cy - top + 14}" fill="${C.black2}" stroke="${C.green}" stroke-width="4"/>` + inner;
if (cy > 1520) console.warn("! runs low: " + cy);

svg += `<rect x="${X}" y="1540" width="${CW}" height="2" fill="${C.line}"/>
<text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">t.me/PNLLeagueBot</text>
<text x="${W - X}" y="1592" font-family="${D}" font-weight="700" font-size="28" letter-spacing="4" fill="${C.ash}" text-anchor="end">@PNLLEAGUE</text>
<text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
<text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></svg>`;

// highlight cover (1080x1080, glyph inside the circle crop): chat bubble with green "typing" dots
const S = 1080, c = S / 2;
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${C.black}"/><circle cx="${c}" cy="${c}" r="372" fill="none" stroke="${C.line}" stroke-width="6"/>
<g transform="translate(${c},${c - 20})"><path d="M-190 -140 h380 a40 40 0 0 1 40 40 v190 a40 40 0 0 1 -40 40 h-220 l-110 96 v-96 h-50 a40 40 0 0 1 -40 -40 v-190 a40 40 0 0 1 40 -40 z" fill="none" stroke="${C.bone}" stroke-width="28" stroke-linejoin="round"/>
<circle cx="-100" cy="-5" r="34" fill="${C.green}"/><circle cx="0" cy="-5" r="34" fill="${C.green}"/><circle cx="100" cy="-5" r="34" fill="${C.green}"/></g></svg>`;
fs.writeFileSync(path.join(path.dirname(out), "cover-support.png"), new Resvg(cover, { fitTo: { mode: "width", value: S }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
