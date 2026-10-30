// One-page ad funnel diagram for the ads team: path, where it's measured, current numbers, actions.
// usage: node scripts/funnel-diagram.js <out.png>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const out = process.argv[2] || path.join(__dirname, "..", "..", "reports", "ad-funnel.png");
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91", warn: "#F3F5F0" };
const D = "PNL Display", M = "PNL Mono";
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const W = 1920, H = 1200;

// ---- the funnel (numbers: all ad tags, bridge page live -> 30 Oct) ----
const steps = [
  { n: "01", title: "META AD", where: "Ads Manager", what: "Website URL = bridge link with the ad's tag", track: "Impressions, link clicks", num: "", numL: "" },
  { n: "02", title: "BRIDGE PAGE", where: "/go/<tag>", what: "One screen, one green button: Open in Telegram", track: "Pixel: PageView · Sheet: view", num: "316", numL: "page views" },
  { n: "03", title: "TAPS OPEN", where: "on the page", what: "Opens the Telegram app (Android direct, iPhone on tap)", track: "Pixel: OpenTelegram · Sheet: tap_open", num: "~0", numL: "real taps*", hot: true },
  { n: "04", title: "PRESSES START", where: "in Telegram", what: "Bot saves the ad tag (first tag a person arrives with)", track: "Sheet: Users > ref", num: "0", numL: "new from ads" },
  { n: "05", title: "SIGNS UP", where: "@PNLLeagueBot", what: "2 taps: OKX status + confirm 18+ / Lebanon / messages", track: "Sheet: status = complete", num: "0", numL: "new from ads" },
  { n: "06", title: "REGISTERS ON OKX", where: "from 1 Nov", what: "Bot sends the OKX link; 50 USDT min deposit, 5,000 USDT min volume", track: "OKX affiliate dashboard", num: "", numL: "" },
];

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="12" fill="${C.green}"/>
<svg x="58" y="54" width="180" height="60" viewBox="20 9 244 81">${WORDMARK}</svg>
<text x="${W - 64}" y="96" font-family="${D}" font-weight="700" font-size="24" letter-spacing="6" fill="${C.ash}" text-anchor="end">AD FUNNEL · FOR THE ADS TEAM · 30 OCT 2026</text>
<text x="64" y="196" font-family="${D}" font-weight="900" font-size="78" fill="${C.bone}">FROM AD TO <tspan fill="${C.green}">REGISTERED</tspan></text>
<text x="64" y="240" font-family="${M}" font-size="24" fill="${C.ash}">Every step is measured. The leak is step 03: people land on the page and don't tap.</text>`;

// funnel column (left)
const x0 = 64, bw = 1040, bh = 112, gap = 22;
let y = 286;
steps.forEach((s, i) => {
  const stroke = s.hot ? C.green : C.line, fill = s.hot ? "#0F2A1C" : C.black2;
  svg += `<rect x="${x0}" y="${y}" width="${bw}" height="${bh}" fill="${fill}" stroke="${stroke}" stroke-width="${s.hot ? 4 : 2}"/>
  <text x="${x0 + 26}" y="${y + 50}" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">${s.n}</text>
  <text x="${x0 + 96}" y="${y + 50}" font-family="${D}" font-weight="900" font-size="40" fill="${C.bone}">${esc(s.title)}</text>
  <text x="${x0 + 96 + s.title.length * 21 + 18}" y="${y + 50}" font-family="${D}" font-weight="700" font-size="22" letter-spacing="3" fill="${C.ash}">${esc(s.where.toUpperCase())}</text>
  <text x="${x0 + 96}" y="${y + 82}" font-family="${M}" font-size="21" fill="${C.bone}">${esc(s.what)}</text>
  <text x="${x0 + 96}" y="${y + 106}" font-family="${M}" font-size="18" fill="${C.green}">${esc(s.track)}</text>`;
  if (s.num) svg += `<text x="${x0 + bw - 26}" y="${y + 66}" font-family="${D}" font-weight="900" font-size="62" fill="${s.hot ? C.green : C.bone}" text-anchor="end">${esc(s.num)}</text>
  <text x="${x0 + bw - 26}" y="${y + 96}" font-family="${D}" font-weight="700" font-size="20" letter-spacing="3" fill="${C.ash}" text-anchor="end">${esc(s.numL.toUpperCase())}</text>`;
  if (i < steps.length - 1) svg += `<path d="M${x0 + 56} ${y + bh + 4} v${gap - 8}" stroke="${C.slate}" stroke-width="4"/><path d="M${x0 + 46} ${y + bh + gap - 12} l10 10 l10 -10" fill="none" stroke="${C.slate}" stroke-width="4"/>`;
  y += bh + gap;
});
svg += `<text x="${x0}" y="${y + 14}" font-family="${M}" font-size="17" fill="${C.dim}">* 17 taps recorded across all tags, but nearly every tag shows exactly 1 of each button: link checks,</text>
<text x="${x0}" y="${y + 38}" font-family="${M}" font-size="17" fill="${C.dim}">  not real visitors. 167 of 316 visits left without tapping.</text>`;

// action column (right)
const rx = 1160, rw = W - rx - 64;
svg += `<rect x="${rx}" y="286" width="${rw}" height="${1108 - 286}" fill="${C.black2}" stroke="${C.line}" stroke-width="2"/>
<text x="${rx + 32}" y="340" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">WHAT TO CHANGE</text>`;
const actions = [
  ["Optimise for the tap, not the page view", "Conversion goal: Pixel custom event OpenTelegram (custom conversion \"Opened Telegram\"). Pixel ID 1149143244163629. Landing page views buy cheap accidental clicks."],
  ["Use the exact tags", "Website URL: pnl-league-bot.vercel.app/go/<tag>. Live traffic shows tags not on the plan (ugc1_a1, ugc2_a1, lead1_b1, lead2_b1, ugc2_b1) and 5 planned tags with 0 visits (ugc1_a2, ugc2_a2, lead3_b2, lead1_b2, ugc2_b2)."],
  ["Pause the old ads", "Lead 3 (old) is still serving: 155 page views, 2 real taps. Awareness 1 too, if replaced."],
  ["Test with a test tag", "Check links with /go/test_<name>, or in a private window. Tapping the buttons on real tags mixes into real numbers."],
  ["Read results per tag", "Sheet tab Clicks (page steps) + Users > ref (bot), or /stats in the bot (admins): views > taps > in bot > signed."],
];
let ay = 392;
actions.forEach(([h, b], i) => {
  svg += `<text x="${rx + 32}" y="${ay}" font-family="${D}" font-weight="900" font-size="28" fill="${C.bone}">${i + 1}. ${esc(h.toUpperCase())}</text>`;
  ay += 10;
  const words = b.split(" "); let line = "", lines = [];
  for (const w of words) { if ((line + " " + w).trim().length > 50) { lines.push(line.trim()); line = w; } else line += " " + w; }
  if (line.trim()) lines.push(line.trim());
  lines.forEach((l) => { ay += 30; svg += `<text x="${rx + 32}" y="${ay}" font-family="${M}" font-size="20" fill="${C.ash}">${esc(l)}</text>`; });
  ay += 34;
});

svg += `<text x="64" y="${H - 30}" font-family="${M}" font-size="17" fill="${C.dim}">PNL League by CE · Presented by OKX · Ads must not imply profit, giveaways or trading advice. 18+. KYC required. Trading involves risk.</text></svg>`;

fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());
console.log("wrote", out);
