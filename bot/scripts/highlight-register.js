// "Register" Instagram highlight: 4 stories (1080x1920) + a cover (1080x1080).
// Each story leaves an empty, marked area for an Instagram link sticker. Content stays inside the safe zone (~260-1540).
// usage: node scripts/highlight-register.js <outDir>
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const dir = process.argv[2] || path.join(__dirname, "..", "..", "reports", "highlights", "register");
fs.mkdirSync(dir, { recursive: true });
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const render = (svg, file, w) => fs.writeFileSync(path.join(dir, file), new Resvg(svg, { fitTo: { mode: "width", value: w }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng());

// one story: kicker, two-line headline, numbered steps, optional sticker slot
function story({ n, kicker, title, steps, note, sticker }) {
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
  <svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">REGISTER · ${n}/4</text>
  <text x="${X}" y="400" font-family="${D}" font-weight="700" font-size="30" letter-spacing="8" fill="${C.green}">${esc(kicker)}</text>
  <text x="${X - 4}" y="520" font-family="${D}" font-weight="900" font-size="116" fill="${C.bone}">${esc(title[0])}</text>
  <text x="${X - 4}" y="632" font-family="${D}" font-weight="900" font-size="116" fill="${C.green}">${esc(title[1])}</text>`;
  let y = 700;
  steps.forEach((st, i) => {
    const lines = Array.isArray(st) ? st : [st];
    const h = 30 + lines.length * 44;
    s += `<text x="${X}" y="${y + 50}" font-family="${D}" font-weight="900" font-size="48" fill="${C.green}">${String(i + 1).padStart(2, "0")}</text>`;
    lines.forEach((l, j) => { s += `<text x="${X + 84}" y="${y + 46 + j * 44}" font-family="${M}" font-weight="500" font-size="32" fill="${j ? C.ash : C.bone}">${esc(l)}</text>`; });
    y += h + 26;
  });
  if (note) { s += `<text x="${X}" y="${y + 30}" font-family="${M}" font-size="26" fill="${C.ash}">${esc(note)}</text>`; y += 60; }
  if (sticker) {
    // empty slot for the Instagram link sticker, with a pointer above it
    const sy = Math.max(y + 40, 1260);
    s += `<text x="${W / 2}" y="${sy - 18}" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}" text-anchor="middle">${esc(sticker)}</text>
    <path d="M${W / 2 - 16} ${sy + 4} l16 18 l16 -18" fill="none" stroke="${C.green}" stroke-width="6"/>`; // the space below is left empty for the link sticker
  }
  s += `<text x="${X}" y="1560" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
  <text x="${X}" y="1592" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></svg>`;
  return s;
}

const stories = [
  { file: "register-01-new-account.png", n: 1, kicker: "NEW TO OKX?", title: ["OPEN YOUR", "OKX ACCOUNT"],
    steps: [["Sign up with our link below", "(it puts you in the PNL League community)"], ["Complete identity verification", "KYC Level 2: profile picture > Verification"], ["Then join the competition", "(story 4)"]],
    sticker: "TAP TO SIGN UP" },
  { file: "register-02-rebind.png", n: 2, kicker: "ALREADY ON OKX?", title: ["LINK YOUR", "ACCOUNT TO US"],
    steps: [["Tap the rebind link below", "on the phone with the OKX app"], ["Log in. If OKX asks for OKX Shield,", "follow its steps, then continue"], ["On \"Join this community\",", "write PNL League and tap Submit"], ["Approval takes up to 1 business day,", "then join the competition (story 4)"]],
    sticker: "TAP TO LINK YOUR ACCOUNT" },
  { file: "register-03-help.png", n: 3, kicker: "FACING ANY TROUBLE?", title: ["SEND US YOUR", "OKX UID"],
    steps: [["Find it in the OKX app:", "profile picture > UID under your name"], ["Send it in our bot:", "open t.me/PNLLeagueBot and send /uid"], ["Or DM it to @pnlleague", "We check it with the OKX team for you"]],
    sticker: "TAP TO OPEN THE BOT" },
  { file: "register-04-join.png", n: 4, kicker: "LAST STEP", title: ["JOIN THE", "COMPETITION"],
    steps: [["Open the competition link below"], ["Tap \"Join Campaign\""], ["Check your status says \"Enrolled\"", "No \"Enrolled\" = not in the competition yet"], ["Deposit at least 50 USDT and trade", "5,000 USDT volume to rank"]],
    sticker: "TAP TO JOIN" },
];
for (const st of stories) render(story(st), st.file, W);

// cover: clipboard with a green tick, inside the circle crop
const S = 1080, c = S / 2;
render(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
<rect width="${S}" height="${S}" fill="${C.black}"/><circle cx="${c}" cy="${c}" r="372" fill="none" stroke="${C.line}" stroke-width="6"/>
<g transform="translate(${c},${c + 10})">
  <rect x="-170" y="-220" width="340" height="430" rx="34" fill="none" stroke="${C.bone}" stroke-width="28"/>
  <rect x="-80" y="-262" width="160" height="80" rx="20" fill="${C.black}" stroke="${C.bone}" stroke-width="24"/>
  <path d="M-92 10 l62 64 l126 -140" fill="none" stroke="${C.green}" stroke-width="40" stroke-linecap="square"/>
</g></svg>`, "cover-register.png", S);
console.log("wrote", stories.length, "stories + cover to", dir);
