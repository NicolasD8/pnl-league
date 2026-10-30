// Instagram story highlights for PNL League: 2 covers (1080x1080) + story slides (1080x1920).
// usage: node scripts/highlights.js <outDir>
// Text stays inside Instagram's safe zone (top ~250px and bottom ~330px are covered by the app UI).
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const OUT = process.argv[2] || path.join(__dirname, "..", "..", "reports", "highlights");
fs.mkdirSync(OUT, { recursive: true });
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

// greedy word wrap by estimated glyph width (mono = 0.6em, display caps ~0.47em)
function wrap(text, size, maxW, per) {
  const max = Math.floor(maxW / (size * per)), lines = [];
  let cur = "";
  for (const w of String(text).split(/\s+/)) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= max) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

const W = 1080, H = 1920, X = 72, MAXW = W - 2 * X;

function render(svg, file, w) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: w }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng();
  fs.writeFileSync(path.join(OUT, file), png);
}

/* ---------- slide ---------- */
function slide(s, idx, total, series) {
  let y = 300, body = "";
  const frame = `<rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
    <svg x="${X - 6}" y="${y - 40}" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
    <text x="${W - X}" y="${y}" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">${esc(series)} · ${String(idx).padStart(2, "0")}/${String(total).padStart(2, "0")}</text>`;
  y += 120;
  if (s.kicker) { body += `<text x="${X}" y="${y}" font-family="${D}" font-weight="700" font-size="32" letter-spacing="7" fill="${C.green}">${esc(s.kicker.toUpperCase())}</text>`; y += 34; }
  const tSize = s.titleSize || 132;
  for (const l of wrap(s.title.toUpperCase(), tSize, MAXW, 0.46)) { y += tSize * 0.9; body += `<text x="${X}" y="${y}" font-family="${D}" font-weight="900" font-size="${tSize}" fill="${C.bone}">${esc(l)}</text>`; }
  y += 50;
  body += `<rect x="${X}" y="${y}" width="120" height="8" fill="${C.green}"/>`;
  y += 40;
  if (s.stats) {
    const cols = s.stats.length, cw = MAXW / cols;
    s.stats.forEach((st, i) => {
      const x = X + i * cw;
      body += `<text x="${x}" y="${y + 150}" font-family="${D}" font-weight="900" font-size="${st.size || 170}" fill="${C.green}">${esc(st.v)}</text>
        <text x="${x}" y="${y + 208}" font-family="${D}" font-weight="700" font-size="${cols > 2 ? 26 : 34}" letter-spacing="${cols > 2 ? 2 : 4}" fill="${C.bone}">${esc(st.l.toUpperCase())}</text>`;
      if (st.s) body += `<text x="${x}" y="${y + 252}" font-family="${M}" font-size="${cols > 2 ? 26 : 30}" fill="${C.ash}">${esc(st.s)}</text>`;
    });
    y += 320;
  }
  for (const b of s.bullets || []) {
    y += 26;
    body += `<rect x="${X}" y="${y + 8}" width="24" height="24" fill="${C.green}"/>`;
    let first = true;
    for (const l of wrap(b, 48, MAXW - 56, 0.6)) { y += first ? 40 : 66; body += `<text x="${X + 56}" y="${y}" font-family="${M}" font-weight="500" font-size="48" fill="${C.bone}">${esc(l)}</text>`; first = false; }
    y += 30;
  }
  if (s.bullets) y += 30;
  for (const p of s.body || []) {
    const big = p.startsWith("!"), txt = big ? p.slice(1) : p;
    const size = big ? 52 : 44, color = big ? C.bone : C.ash, weight = big ? 500 : 400;
    for (const l of wrap(txt, size, MAXW, 0.6)) { y += size * 1.4; body += `<text x="${X}" y="${y}" font-family="${M}" font-weight="${weight}" font-size="${size}" fill="${color}">${esc(l)}</text>`; }
    y += 36;
  }
  if (y > 1520) console.warn(`  ! ${series} ${idx} runs low (y=${Math.round(y)}): shorten it`);
  const foot = `<rect x="${X}" y="1540" width="${MAXW}" height="2" fill="${C.line}"/>
    <text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">${esc(s.cta || "t.me/PNLLeagueBot")}</text>
    <text x="${W - X}" y="1592" font-family="${D}" font-weight="700" font-size="28" letter-spacing="4" fill="${C.ash}" text-anchor="end">@PNLLEAGUE</text>
    <text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
    <text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${frame}${body}${foot}</svg>`;
}

/* ---------- covers (Instagram crops to a circle: keep the glyph in the middle ~60%) ---------- */
function cover(kind) {
  const S = 1080, c = S / 2;
  let glyph;
  if (kind === "faq") {
    glyph = `<text x="${c}" y="${c + 190}" font-family="${D}" font-weight="900" font-size="560" fill="${C.green}" text-anchor="middle">?</text>`;
  } else {
    // rulebook: three rule lines, the first one "checked"
    const x0 = 330, w = 420;
    glyph = [0, 1, 2].map((i) => {
      const y = 395 + i * 130;
      return `<rect x="${x0}" y="${y}" width="56" height="56" fill="${i === 0 ? C.green : "none"}" stroke="${C.green}" stroke-width="12"/>` +
        (i === 0 ? `<path d="M${x0 + 12} ${y + 30} l14 14 l20 -26" fill="none" stroke="${C.black}" stroke-width="10" stroke-linecap="square"/>` : "") +
        `<rect x="${x0 + 96}" y="${y + 18}" width="${w - 96 - i * 60}" height="20" fill="${i === 0 ? C.green : C.bone}"/>`;
    }).join("");
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    <rect width="${S}" height="${S}" fill="${C.black}"/>
    <circle cx="${c}" cy="${c}" r="372" fill="none" stroke="${C.line}" stroke-width="6"/>
    ${glyph}</svg>`;
}

/* ---------- content ---------- */
const FAQ = [
  { kicker: "Your questions", title: "FAQ: everything you asked us", body: ["!Straight answers to the questions we get most in the bot.", "Tap through. Still stuck? Send /ask in @PNLLeagueBot and the team replies there."] },
  { kicker: "Is this a demo?", title: "No. It's real trading.", body: ["!You trade your own funds, in your own OKX account, on real markets.", "Your real PnL and trading volume on OKX are what put you on the leaderboard.", "Real markets means real risk. Only trade what you can afford to lose."] },
  { kicker: "Which platform? MT5?", title: "OKX only, no MT5", titleSize: 120, body: ["!The whole competition runs on OKX. No MT5, no demo accounts, no other exchange.", "Futures and spot both count."] },
  { kicker: "When is it?", title: "It starts 1 Nov", stats: [{ v: "1 NOV", l: "Registration opens", s: "on OKX", size: 96 }, { v: "1-7", l: "Phase 1 online", s: "November", size: 96 }, { v: "23 NOV", l: "Live Finals", s: "tentative", size: 96 }], body: ["The Live Finals are at VCore Tabarja. The final date is confirmed with registration."] },
  { kicker: "Do I deposit now?", title: "Not yet. Get KYC done now.", body: ["!Today: have an OKX account with KYC (identity) verified. It can take a while.", "When registration opens on 1 Nov: register on OKX, deposit at least 50 USDT and trade at least 5,000 USDT volume to rank."] },
  { kicker: "I already have OKX", title: "Good. Check two things.", bullets: ["It's KYC verified", "It's your main account, not a sub-account"], body: ["Some existing accounts need to be linked to the competition before they count. Send /ask in the bot and we check yours."] },
  { kicker: "How do I make the Finals?", title: "Climb two leaderboards", body: ["!PnL and Trading Volume, updated live every 5 minutes.", "Your rewards from both boards are added up. The 12 highest totals go to the Live Finals."] },
  { kicker: "What can I win?", title: "Two separate rewards", stats: [{ v: "5,000", l: "USDT prize pool", s: "12 finalists" }, { v: "1,000", l: "USDT rewards", s: "Online League bonus" }], body: ["The 1,000 USDT leaderboard rewards are a trading bonus during the Online League. They're not part of the prize pool."] },
  { kicker: "How can I watch?", title: "Watch it live", stats: [{ v: "1-7 NOV", l: "Phase 1 online", s: "stories + reels", size: 110 }, { v: "23 NOV", l: "Live Finals", s: "tentative", size: 110 }], body: ["!Phase 1: follow the race all week on @pnlleague stories and reels.", "Live Finals: livestreamed on TikTok and Instagram, or come watch at VCore Tabarja on the day."] },
  { kicker: "How do I join?", title: "Two taps in Telegram", bullets: ["Open @PNLLeagueBot", "Tell us your OKX status", "Confirm, and you're on the early list"], body: ["!We send you the OKX registration link the moment it opens on 1 Nov."], cta: "t.me/PNLLeagueBot" },
];

const RULES = [
  { kicker: "The rulebook", title: "Rules: how PNL League works", body: ["!Lebanon's first live trading championship. 12 seats at the Live Finals. One title.", "Official competition terms are set by OKX on the campaign page."] },
  { kicker: "Who can enter", title: "Three conditions", bullets: ["18 or older", "Based in Lebanon", "KYC-verified OKX main account"], body: ["Sub-accounts don't count. Some existing accounts need to be linked to the competition first."] },
  { kicker: "To rank on the leaderboard", title: "The minimums", stats: [{ v: "50", l: "USDT deposit", s: "minimum" }, { v: "5,000", l: "USDT volume", s: "minimum traded" }], body: ["!Both are needed to appear on the leaderboards.", "Futures and spot both count."] },
  { kicker: "Phase 1 · Online League", title: "Two live leaderboards", stats: [{ v: "PNL", l: "Leaderboard 1", s: "your profit & loss" }, { v: "VOL", l: "Leaderboard 2", s: "your trading volume" }], body: ["!Both update live every 5 minutes, on OKX, during Phase 1 (1-7 Nov)."] },
  { kicker: "Road to the Finals", title: "Top 12 go live", bullets: ["Rewards from both leaderboards are added up", "The 12 highest totals qualify", "Six hours of live trading at VCore Tabarja"], body: ["Casters, a crowd and a livestream on TikTok and Instagram. Rich coaches all 12 finalists. Rami casts it."] },
  { kicker: "Fair play", title: "Instant disqualification", bullets: ["Wash trading", "Multiple accounts", "Sub-accounts"], body: ["!One person, one main account, real trading.", "OKX's competition terms apply."] },
  { kicker: "Prizes", title: "The prizes", stats: [{ v: "5,000", l: "USDT prize pool", s: "Live Finals" }, { v: "1,000", l: "USDT rewards", s: "Online League bonus" }], body: ["The prize pool is for the 12 finalists. The 1,000 USDT rewards are a separate trading bonus.", "!Trading involves risk. Not investment advice."] },
];

render(cover("faq"), "cover-faq.png", 1080);
render(cover("rules"), "cover-rules.png", 1080);
FAQ.forEach((s, i) => render(slide(s, i + 1, FAQ.length, "FAQ"), `faq-${String(i + 1).padStart(2, "0")}.png`, 1080));
RULES.forEach((s, i) => render(slide(s, i + 1, RULES.length, "RULES"), `rules-${String(i + 1).padStart(2, "0")}.png`, 1080));
console.log("wrote", 2 + FAQ.length + RULES.length, "images to", OUT);
