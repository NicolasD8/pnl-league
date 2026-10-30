// Brand chart: where early-list signups came from + the signup flow.
// usage: node scripts/sources-chart.js <out.png> '<json stats>'   (stats = the Sheet's "stats" action output)
// Buckets: rich = ref "rich"; ads = any ref starting with "lead" or "awareness"; raw = no ref (direct) + anything else.
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [out, json, stamp] = process.argv.slice(2);
const s = JSON.parse(json);
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";

// bucket the sources
const b = { rich: 0, rami: 0, raw: 0, ads: 0 };
for (const [ref, n] of Object.entries(s.by_ref || {})) {
  if (ref === "rich") b.rich += n;
  else if (ref === "rami") b.rami += n;
  else if (/^(lead|awareness)/i.test(ref)) b.ads += n;
  else b.raw += n;
}
const total = b.rich + b.rami + b.raw + b.ads;
// fixed order = fixed colour (colour follows the entity, never its rank)
const slices = [
  { key: "rich", label: "RICH", sub: "Creator link", n: b.rich, fill: C.green },
  { key: "rami", label: "RAMI", sub: "Creator link", n: b.rami, fill: C.bone },
  { key: "raw", label: "RAW", sub: "Direct, no link tag", n: b.raw, fill: C.ash },
  { key: "ads", label: "ADS", sub: "Lead + awareness links", n: b.ads, fill: C.slate },
];
const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

// donut geometry
const cx = 330, cy = 650, R = 220, r = 132;
function arc(a0, a1) {
  const p = (a, rad) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r} ${r} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
}
let a = 0, donut = "";
for (const sl of slices) {
  if (!sl.n) continue;
  const a1 = a + (sl.n / total) * Math.PI * 2;
  donut += sl.n === total
    ? `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${sl.fill}" stroke-width="${R - r}"/>`
    : `<path d="${arc(a, a1)}" fill="${sl.fill}" stroke="${C.black}" stroke-width="4" stroke-linejoin="round"/>`;
  a = a1;
}

// legend with direct values (identity never by colour alone)
let legend = "", ly = 452;
for (const sl of slices) {
  legend += `<rect x="610" y="${ly - 30}" width="26" height="26" fill="${sl.fill}"/>
  <text x="654" y="${ly - 5}" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">${sl.label}</text>
  <text x="1016" y="${ly - 5}" font-family="${D}" font-weight="900" font-size="56" fill="${C.bone}" text-anchor="end">${sl.n}<tspan font-size="26" fill="${C.ash}" dx="10">${pct(sl.n)}%</tspan></text>
  <text x="654" y="${ly + 26}" font-family="${M}" font-weight="400" font-size="22" fill="${C.ash}">${sl.sub}</text>
  <rect x="610" y="${ly + 50}" width="406" height="2" fill="${C.line}"/>`;
  ly += 112;
}

// funnel (one scale for all three bars)
const steps = [
  { label: "OPENED THE BOT", n: s.total },
  { label: "STARTED SIGNUP", n: s.started },
  { label: "SIGNED UP", n: s.complete },
];
const maxW = 952 - 96, fx = 64; // leave room for the value label at the bar end
let funnel = "", fy = 1040;
steps.forEach((st, i) => {
  const w = Math.max(6, Math.round((st.n / steps[0].n) * maxW));
  const conv = i ? `   ·  ${Math.round((st.n / steps[i - 1].n) * 100)}% of previous` : "";
  funnel += `<text x="${fx}" y="${fy}" font-family="${D}" font-weight="700" font-size="24" letter-spacing="4" fill="${C.ash}">${st.label}<tspan font-family="${M}" font-weight="400" letter-spacing="0" font-size="20">${conv}</tspan></text>
  <rect x="${fx}" y="${fy + 14}" width="${w}" height="34" rx="0" fill="${i === 2 ? C.green : C.line}"/>
  <text x="${fx + w + 14}" y="${fy + 42}" font-family="${D}" font-weight="900" font-size="36" fill="${C.bone}">${st.n}</text>`;
  fy += 82;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${C.black}"/>
  <rect width="1080" height="14" fill="${C.green}"/>
  <rect x="24" y="38" width="1032" height="1288" fill="none" stroke="${C.line}" stroke-width="2"/>
  <svg x="58" y="70" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="1016" y="118" font-family="${D}" font-weight="700" font-size="26" letter-spacing="5" fill="${C.ash}" text-anchor="end">EARLY LIST · SOURCES</text>

  <text x="64" y="262" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.ash}">WHERE THE CONTENDERS CAME FROM</text>
  <text x="64" y="372" font-family="${D}" font-weight="900" font-size="120" fill="${C.bone}"><tspan fill="${C.green}">${total}</tspan> SIGNED UP</text>

  ${donut}
  <text x="${cx}" y="${cy + 22}" font-family="${D}" font-weight="900" font-size="110" fill="${C.bone}" text-anchor="middle">${total}</text>
  <text x="${cx}" y="${cy + 62}" font-family="${D}" font-weight="700" font-size="24" letter-spacing="5" fill="${C.ash}" text-anchor="middle">CONTENDERS</text>
  ${legend}

  <rect x="64" y="930" width="952" height="2" fill="${C.line}"/>
  <text x="64" y="972" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.ash}">THE FLOW</text>
  ${funnel}

  <text x="64" y="1296" font-family="${M}" font-weight="400" font-size="17" fill="${C.dim}">Source: @PNLLeagueBot · ${stamp || ""} · PNL League by CE · Presented by OKX</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log(JSON.stringify({ total, ...b, opened: s.total, started: s.started }));
