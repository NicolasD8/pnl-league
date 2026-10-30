// Brand chart: everyone who opened the bot (not just signups) - stage, source and day.
// usage: node scripts/overview-chart.js <out.png> '<json overview>' "<timestamp>"   (overview = the Sheet's "overview" action output)
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [out, json, stamp] = process.argv.slice(2);
const o = JSON.parse(json);
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
// brand palette; 4th step validated for CVD separation + 3:1 contrast on Pit Black
const C = { green: "#22F07A", black: "#0B1410", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", track: "#18241E", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const esc = (x) => String(x).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

/* ---------- stages ---------- */
const st = o.stage || {};
const mid = Object.entries(st).filter(([k]) => k.startsWith("mid_signup:"));
const midN = mid.reduce((a, [, n]) => a + n, 0);
const STEP = { name: "name", phone: "phone", okx: "OKX", exp: "style", elig: "18+", consent: "consent", question: "question" };
const groups = [
  { label: "SIGNED UP", sub: "Finished the early-list signup", n: st.signed_up || 0, fill: C.green },
  { label: "MID-SIGNUP", sub: (() => {
      const top = mid.sort((a, b) => b[1] - a[1]);
      const shown = top.slice(0, 3).map(([k, n]) => `${STEP[k.split(":")[1]] || k.split(":")[1]} ${n}`);
      const rest = top.slice(3).reduce((a, [, n]) => a + n, 0);
      return "At: " + (shown.join(" · ") || "-") + (rest ? ` · other ${rest}` : "");
    })(), n: midN, fill: C.bone },
  { label: "ONLY OPENED", sub: "Never tapped Join", n: st.opened_only || 0, fill: C.ash },
  { label: "DROPPED OUT", sub: `Ineligible ${st.ineligible || 0} · said no ${st.declined || 0} · deleted ${st.deleted || 0}`, n: (st.ineligible || 0) + (st.declined || 0) + (st.deleted || 0), fill: C.slate },
];
const total = groups.reduce((a, g) => a + g.n, 0) || 1;
const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

const cx = 290, cy = 610, R = 190, r = 114;
function arc(a0, a1) {
  const p = (a, rad) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, R), [x1, y1] = p(a1, R), [x2, y2] = p(a1, r), [x3, y3] = p(a0, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)} A${r} ${r} 0 ${large} 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
}
let a = 0, donut = "";
for (const g of groups) {
  if (!g.n) continue;
  const a1 = a + (g.n / total) * Math.PI * 2;
  donut += `<path d="${arc(a, a1)}" fill="${g.fill}" stroke="${C.black}" stroke-width="4" stroke-linejoin="round"/>`;
  a = a1;
}
let legend = "", ly = 452;
for (const g of groups) {
  legend += `<rect x="540" y="${ly - 26}" width="22" height="22" fill="${g.fill}"/>
  <text x="578" y="${ly - 5}" font-family="${D}" font-weight="900" font-size="34" fill="${C.bone}">${g.label}</text>
  <text x="1016" y="${ly - 3}" font-family="${D}" font-weight="900" font-size="48" fill="${C.bone}" text-anchor="end">${g.n}<tspan font-size="24" fill="${C.ash}" dx="8">${pct(g.n, total)}%</tspan></text>
  <text x="578" y="${ly + 24}" font-family="${M}" font-size="16" fill="${C.ash}">${esc(g.sub)}</text>
  <rect x="540" y="${ly + 44}" width="476" height="2" fill="${C.line}"/>`;
  ly += 94;
}
const blockedNote = st.blocked_bot ? `<text x="540" y="${ly - 4}" font-family="${M}" font-size="19" fill="${C.dim}">${st.blocked_bot} of these later blocked the bot</text>` : "";

/* ---------- by source (opened vs signed up, one scale) ---------- */
const src = { rich: { opened: 0, signed_up: 0 }, rami: { opened: 0, signed_up: 0 }, raw: { opened: 0, signed_up: 0 }, ads: { opened: 0, signed_up: 0 } };
for (const [ref, v] of Object.entries(o.by_source || {})) {
  const k = ref === "rich" ? "rich" : ref === "rami" ? "rami" : /^(lead|awareness)/i.test(ref) ? "ads" : "raw";
  src[k].opened += v.opened; src[k].signed_up += v.signed_up;
}
const rowsSrc = [["RICH", src.rich], ["RAMI", src.rami], ["RAW", src.raw], ["ADS", src.ads]];
const maxOpen = Math.max(1, ...rowsSrc.map(([, v]) => v.opened));
const bx = 200, bw = 520;
let srcSvg = "", sy = 896;
for (const [label, v] of rowsSrc) {
  const wo = Math.max(4, Math.round((v.opened / maxOpen) * bw)), ws = Math.round((v.signed_up / maxOpen) * bw);
  srcSvg += `<text x="64" y="${sy + 25}" font-family="${D}" font-weight="900" font-size="30" fill="${C.bone}">${label}</text>
  <rect x="${bx}" y="${sy}" width="${wo}" height="32" fill="${C.slate}"/>
  ${ws ? `<rect x="${bx}" y="${sy}" width="${ws}" height="32" fill="${C.green}"/>` : ""}
  <text x="${bx + wo + 12}" y="${sy + 25}" font-family="${D}" font-weight="900" font-size="30" fill="${C.bone}">${v.signed_up} of ${v.opened}</text>
  <text x="1016" y="${sy + 25}" font-family="${M}" font-size="20" fill="${C.ash}" text-anchor="end">${pct(v.signed_up, v.opened)}% signed</text>`;
  sy += 46;
}

/* ---------- per day ---------- */
const days = Object.entries(o.by_day || {}).sort(([x], [y]) => (x < y ? -1 : 1)).slice(-7);
const maxDay = Math.max(1, ...days.map(([, v]) => v.opened));
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const chartH = 70, base = 1240, colW = Math.min(110, Math.floor(952 / Math.max(1, days.length)) - 24);
let daySvg = "";
days.forEach(([d, v], i) => {
  const x = 64 + i * (colW + 24);
  const ho = Math.max(3, Math.round((v.opened / maxDay) * chartH)), hs = Math.round((v.signed_up / maxDay) * chartH);
  const [, mm, dd] = d.split("-");
  daySvg += `<rect x="${x}" y="${base - ho}" width="${colW}" height="${ho}" fill="${C.slate}"/>
  ${hs ? `<rect x="${x}" y="${base - hs}" width="${colW}" height="${hs}" fill="${C.green}"/>` : ""}
  <text x="${x + colW / 2}" y="${base - ho - 10}" font-family="${D}" font-weight="900" font-size="26" fill="${C.bone}" text-anchor="middle">${v.opened}</text>
  <text x="${x + colW / 2}" y="${base + 26}" font-family="${D}" font-weight="700" font-size="20" letter-spacing="3" fill="${C.ash}" text-anchor="middle">${Number(dd)} ${MON[Number(mm) - 1]}</text>`;
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="${C.black}"/>
  <rect width="1080" height="14" fill="${C.green}"/>
  <rect x="24" y="38" width="1032" height="1288" fill="none" stroke="${C.line}" stroke-width="2"/>
  <svg x="58" y="70" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="1016" y="118" font-family="${D}" font-weight="700" font-size="26" letter-spacing="5" fill="${C.ash}" text-anchor="end">BOT OVERVIEW · EVERYONE</text>

  <text x="64" y="248" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.ash}">EVERYONE WHO OPENED @PNLLEAGUEBOT</text>
  <text x="64" y="352" font-family="${D}" font-weight="900" font-size="112" fill="${C.bone}"><tspan fill="${C.green}">${o.total}</tspan> OPENED THE BOT</text>

  ${donut}
  <text x="${cx}" y="${cy + 14}" font-family="${D}" font-weight="900" font-size="96" fill="${C.bone}" text-anchor="middle">${o.total}</text>
  <text x="${cx}" y="${cy + 50}" font-family="${D}" font-weight="700" font-size="22" letter-spacing="5" fill="${C.ash}" text-anchor="middle">PEOPLE</text>
  ${legend}
  ${blockedNote}

  <rect x="64" y="830" width="952" height="2" fill="${C.line}"/>
  <text x="64" y="874" font-family="${D}" font-weight="700" font-size="28" letter-spacing="7" fill="${C.ash}">BY SOURCE</text>
  <rect x="596" y="854" width="18" height="18" fill="${C.green}"/><text x="622" y="870" font-family="${M}" font-size="19" fill="${C.ash}">signed up</text>
  <rect x="756" y="854" width="18" height="18" fill="${C.slate}"/><text x="782" y="870" font-family="${M}" font-size="19" fill="${C.ash}">opened, not signed</text>
  ${srcSvg}

  <rect x="64" y="1086" width="952" height="2" fill="${C.line}"/>
  <text x="64" y="1120" font-family="${D}" font-weight="700" font-size="28" letter-spacing="7" fill="${C.ash}">NEW PEOPLE PER DAY</text>
  ${daySvg}

  <text x="64" y="1300" font-family="${M}" font-size="17" fill="${C.dim}">Source: @PNLLeagueBot · ${esc(stamp || "")} · PNL League by CE · Presented by OKX</text>
</svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log(JSON.stringify({ total: o.total, groups: groups.map((g) => [g.label, g.n]), src, days }));
