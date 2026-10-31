// Brand chart: inside the contender list - OKX status, the affiliate link, language, /okx reach.
// usage: node scripts/signups-chart.js <out.png> '<json stats>' '<json extra>' "<timestamp>"
//   stats = the Sheet's "stats" action output
//   extra = { invitees: [["29 Oct", 4], ...] (from the OKX invitee notifications), okx_got: n, okx_reach: n }
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [out, json, extraJson, stamp] = process.argv.slice(2);
const s = JSON.parse(json), x = JSON.parse(extraJson || "{}");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const ok = s.by_okx || {};
const total = s.complete;
// the OKX invitees came out of the "no account" group
const invTotal = (x.invitees || []).reduce((t, [, n]) => t + n, 0);
const viaLink = Math.min(invTotal, ok.none || 0);
const slices = [
  { label: "KYC VERIFIED", sub: "Ready for day one", n: ok.verified || 0, fill: C.green },
  { label: "OPENED VIA YOUR LINK", sub: "New OKX account, KYC to finish", n: viaLink, fill: C.bone },
  { label: "NOT VERIFIED YET", sub: "Had an account, KYC to finish", n: ok.unverified || 0, fill: C.ash },
  { label: "NO OKX ACCOUNT YET", sub: "Still needs to open one", n: (ok.none || 0) - viaLink, fill: C.slate },
];
const pct = (n, of = total) => (of ? Math.round((n / of) * 100) : 0);

// donut
const cx = 300, cy = 640, R = 210, r = 126;
function arc(a0, a1) {
  const p = (a, rad) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r} ${r} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
}
let a = 0, donut = "";
const sum = slices.reduce((t, sl) => t + sl.n, 0);
for (const sl of slices) {
  if (!sl.n) continue;
  const a1 = a + (sl.n / sum) * Math.PI * 2;
  donut += `<path d="${arc(a, a1)}" fill="${sl.fill}" stroke="${C.black}" stroke-width="4" stroke-linejoin="round"/>`;
  a = a1;
}
let legend = "", ly = 468;
for (const sl of slices) {
  legend += `<rect x="580" y="${ly - 30}" width="26" height="26" fill="${sl.fill}"/>
  <text x="622" y="${ly - 5}" font-family="${D}" font-weight="900" font-size="32" fill="${C.bone}">${sl.label}</text>
  <text x="1016" y="${ly - 5}" font-family="${D}" font-weight="900" font-size="50" fill="${C.bone}" text-anchor="end">${sl.n}<tspan font-size="26" fill="${C.ash}" dx="10">${pct(sl.n)}%</tspan></text>
  <text x="622" y="${ly + 28}" font-family="${M}" font-size="20" fill="${C.ash}">${sl.sub}</text>
  <rect x="580" y="${ly + 48}" width="436" height="2" fill="${C.line}"/>`;
  ly += 104;
}

// your OKX link: invitees per day (from the OKX app)
const inv = x.invitees || [], invMax = Math.max(1, ...inv.map(([, n]) => n));
let bars = "";
inv.forEach(([day, n], i) => {
  const bx = 560 + i * 150, h = Math.round((n / invMax) * 96), by = 1060 - h;
  bars += `<rect x="${bx}" y="${by}" width="110" height="${h}" fill="${C.green}"/>
  <text x="${bx + 55}" y="${by - 10}" font-family="${D}" font-weight="900" font-size="32" fill="${C.bone}" text-anchor="middle">${n}</text>
  <text x="${bx + 55}" y="1090" font-family="${D}" font-weight="700" font-size="22" letter-spacing="3" fill="${C.ash}" text-anchor="middle">${esc(day.toUpperCase())}</text>`;
});

// language split + /okx reach
const en = (s.by_lang || {}).en || 0, ar = (s.by_lang || {}).ar || 0;
const lw = 400, enW = Math.round((en / Math.max(1, en + ar)) * lw);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${C.black}"/>
  <rect width="1080" height="14" fill="${C.green}"/>
  <rect x="24" y="38" width="1032" height="1288" fill="none" stroke="${C.line}" stroke-width="2"/>
  <svg x="58" y="70" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="1016" y="118" font-family="${D}" font-weight="700" font-size="26" letter-spacing="5" fill="${C.ash}" text-anchor="end">EARLY LIST · CONTENDERS</text>

  <text x="64" y="262" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.ash}">INSIDE THE CONTENDER LIST · OKX STATUS</text>
  <text x="64" y="372" font-family="${D}" font-weight="900" font-size="120" fill="${C.bone}"><tspan fill="${C.green}">${total}</tspan> SIGNED UP</text>

  ${donut}
  <text x="${cx}" y="${cy + 20}" font-family="${D}" font-weight="900" font-size="104" fill="${C.green}" text-anchor="middle">${pct(ok.verified || 0)}%</text>
  <text x="${cx}" y="${cy + 58}" font-family="${D}" font-weight="700" font-size="22" letter-spacing="5" fill="${C.ash}" text-anchor="middle">READY TO TRADE</text>
  ${legend}

  <rect x="64" y="900" width="952" height="2" fill="${C.line}"/>
  <text x="64" y="944" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.ash}">YOUR OKX LINK</text>
  <text x="64" y="1062" font-family="${D}" font-weight="900" font-size="130" fill="${C.green}">${invTotal}</text>
  <text x="${64 + String(invTotal).length * 62 + 20}" y="1018" font-family="${D}" font-weight="900" font-size="38" fill="${C.bone}">NEW OKX</text>
  <text x="${64 + String(invTotal).length * 62 + 20}" y="1058" font-family="${D}" font-weight="900" font-size="38" fill="${C.bone}">ACCOUNTS</text>
  <text x="64" y="1094" font-family="${M}" font-size="20" fill="${C.ash}">from the ${ok.none || 0} who had no account</text>
  ${bars}

  <rect x="64" y="1120" width="952" height="2" fill="${C.line}"/>
  <text x="64" y="1164" font-family="${D}" font-weight="700" font-size="26" letter-spacing="6" fill="${C.ash}">LANGUAGE</text>
  <rect x="64" y="1184" width="${enW}" height="34" fill="${C.bone}"/><rect x="${64 + enW}" y="1184" width="${lw - enW}" height="34" fill="${C.slate}"/>
  <text x="64" y="1254" font-family="${D}" font-weight="900" font-size="32" fill="${C.bone}">EN ${en}<tspan fill="${C.ash}" font-size="22" dx="8">${pct(en)}%</tspan><tspan dx="28">AR ${ar}</tspan><tspan fill="${C.ash}" font-size="22" dx="8">${pct(ar)}%</tspan></text>

  <text x="580" y="1164" font-family="${D}" font-weight="700" font-size="26" letter-spacing="6" fill="${C.ash}">GOT YOUR OKX LINK IN THE BOT</text>
  <text x="580" y="1232" font-family="${D}" font-weight="900" font-size="64" fill="${C.bone}">${x.okx_got ?? "-"}<tspan font-size="30" fill="${C.ash}" dx="12">of ${x.okx_reach ?? "-"} not verified</tspan></text>
  <text x="580" y="1262" font-family="${M}" font-size="20" fill="${C.ash}">via /okx, once per person</text>

  <text x="64" y="1300" font-family="${M}" font-size="17" fill="${C.dim}">Source: @PNLLeagueBot + OKX invitee feed · ${esc(stamp || "")}</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log(JSON.stringify({ total, okx: ok, invTotal, en, ar }));
