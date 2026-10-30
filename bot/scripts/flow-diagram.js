// Minimal visual workflow: icons + arrows + one number per step. No explanations.
// usage: node scripts/flow-diagram.js <out.png> '<json {views,taps,inbot,signed}>' "<stamp>"
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [out, json, stamp] = process.argv.slice(2);
const n = Object.assign({ views: 0, taps: 0, inbot: 0, signed: 0 }, json ? JSON.parse(json) : {});
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B" };
const D = "PNL Display", M = "PNL Mono";
const W = 1920, H = 1080, cy = 560, R = 92;

// icons drawn around (0,0), ~110px box
const ICON = {
  ad: `<rect x="-46" y="-38" width="92" height="76" fill="none" stroke="${C.bone}" stroke-width="8"/><path d="M-12 -18 L22 0 L-12 18 Z" fill="${C.green}"/>`,
  page: `<rect x="-30" y="-50" width="60" height="100" rx="8" fill="none" stroke="${C.bone}" stroke-width="8"/><rect x="-18" y="12" width="36" height="16" fill="${C.green}"/><rect x="-18" y="-30" width="36" height="6" fill="${C.ash}"/><rect x="-18" y="-18" width="24" height="6" fill="${C.ash}"/>`,
  tap: `<rect x="-50" y="-30" width="100" height="40" fill="${C.green}"/><circle cx="20" cy="26" r="9" fill="${C.bone}"/><circle cx="20" cy="26" r="22" fill="none" stroke="${C.bone}" stroke-width="4" opacity=".8"/><circle cx="20" cy="26" r="34" fill="none" stroke="${C.bone}" stroke-width="3" opacity=".35"/>`,
  tg: `<path d="M-46 -4 L44 -40 L26 42 L4 18 L-14 34 L-10 10 Z" fill="none" stroke="${C.bone}" stroke-width="8" stroke-linejoin="round"/><path d="M-10 10 L36 -30" stroke="${C.green}" stroke-width="8" stroke-linecap="round"/>`,
  start: `<rect x="-54" y="-24" width="108" height="48" rx="24" fill="${C.green}"/><text x="0" y="12" font-family="${D}" font-weight="900" font-size="32" fill="${C.black}" text-anchor="middle">START</text>`,
  done: `<circle cx="0" cy="0" r="44" fill="none" stroke="${C.green}" stroke-width="9"/><path d="M-20 0 L-5 16 L22 -16" fill="none" stroke="${C.bone}" stroke-width="10" stroke-linecap="square"/>`,
  okx: `<rect x="-42" y="-40" width="84" height="84" fill="none" stroke="${C.bone}" stroke-width="8"/><rect x="-42" y="-40" width="84" height="22" fill="${C.green}"/><text x="0" y="28" font-family="${D}" font-weight="900" font-size="30" fill="${C.bone}" text-anchor="middle">1 NOV</text>`,
};

const steps = [
  { icon: "ad", label: "AD", num: "META" },
  { icon: "page", label: "PAGE", num: String(n.views), sub: "VIEWS" },
  { icon: "tap", label: "TAP", num: String(n.taps), sub: "TAPS", leak: true },
  { icon: "tg", label: "TELEGRAM", num: "" },
  { icon: "start", label: "START", num: String(n.inbot), sub: "IN BOT" },
  { icon: "done", label: "SIGNED UP", num: String(n.signed), sub: "SIGNED", hot: true },
  { icon: "okx", label: "REGISTER", num: "OKX", sub: "FROM 1 NOV" },
];

const x0 = 170, gap = (W - 2 * x0) / (steps.length - 1);
let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="12" fill="${C.green}"/>
<svg x="70" y="64" width="180" height="60" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - 70}" y="108" font-family="${D}" font-weight="700" font-size="26" letter-spacing="7" fill="${C.ash}" text-anchor="end">AD FLOW</text>`;

steps.forEach((s, i) => {
  const x = x0 + i * gap;
  // connector
  if (i < steps.length - 1) {
    const xa = x + R + 18, xb = x + gap - R - 18;
    svg += `<path d="M${xa} ${cy} H${xb - 14}" stroke="${s.leak ? C.green : C.slate}" stroke-width="${s.leak ? 6 : 4}" ${s.leak ? 'stroke-dasharray="10 10"' : ""}/><path d="M${xb - 18} ${cy - 12} L${xb - 2} ${cy} L${xb - 18} ${cy + 12}" fill="none" stroke="${s.leak ? C.green : C.slate}" stroke-width="${s.leak ? 6 : 4}"/>`;
  }
  svg += `<circle cx="${x}" cy="${cy}" r="${R}" fill="${s.hot ? "#0F2A1C" : C.black2}" stroke="${s.leak || s.hot ? C.green : C.line}" stroke-width="${s.leak || s.hot ? 5 : 3}"/>
  <g transform="translate(${x},${cy})">${ICON[s.icon]}</g>
  <text x="${x}" y="${cy + R + 60}" font-family="${D}" font-weight="900" font-size="34" letter-spacing="2" fill="${C.bone}" text-anchor="middle">${s.label}</text>`;
  if (s.num) svg += `<text x="${x}" y="${cy - R - 44}" font-family="${D}" font-weight="900" font-size="${/^\d+$/.test(s.num) ? 84 : 44}" fill="${s.leak || s.hot ? C.green : C.bone}" text-anchor="middle">${s.num}</text>`;
  if (s.sub) svg += `<text x="${x}" y="${cy - R - 14}" font-family="${D}" font-weight="700" font-size="20" letter-spacing="4" fill="${C.ash}" text-anchor="middle">${s.sub}</text>`;
});

// the leak marker
const lx = x0 + 2 * gap;
svg += `<text x="${lx}" y="${cy + R + 112}" font-family="${D}" font-weight="900" font-size="26" letter-spacing="5" fill="${C.green}" text-anchor="middle">THE LEAK</text>`;
svg += `<text x="70" y="${H - 44}" font-family="${M}" font-size="18" fill="${C.slate}">All ad tags · ${stamp || ""} · PNL League by CE · Presented by OKX</text></svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
