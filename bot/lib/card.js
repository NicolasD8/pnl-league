// Contender card: a shareable 1080x1350 PNG in the style of an exchange PnL card.
// Deliberately shows NO profit figures (compliance): the hero number is the contender number.
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal", "cairo-arabic-900-normal"]
  .map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B" };
const DISPLAY = "PNL Display, PNL Arabic";
const MONO = "PNL Mono";
const W = 1080, H = 1350, X = 64;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const isArabic = (s) => /[؀-ۿ]/.test(s);

function nameLine(name) {
  let n = String(name || "Contender").replace(/\s+/g, " ").trim();
  const ar = isArabic(n);
  if (!ar) n = n.toUpperCase();
  if (n.length > 26) n = n.slice(0, 25) + "…";
  // Big Shoulders is condensed (~0.47em per char); Cairo is wider (~0.62em)
  const per = ar ? 0.62 : 0.47;
  const size = Math.max(64, Math.min(ar ? 118 : 150, Math.floor((W - 2 * X) / (n.length * per))));
  return { text: n, size, ar };
}

function qrRects(text, x, y, size) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const n = qr.modules.size, pad = 14, cell = (size - 2 * pad) / n;
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${C.bone}"/>`;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (qr.modules.get(r, c)) out += `<rect x="${(x + pad + c * cell).toFixed(2)}" y="${(y + pad + r * cell).toFixed(2)}" width="${(cell + 0.3).toFixed(2)}" height="${(cell + 0.3).toFixed(2)}" fill="${C.black}"/>`;
  }
  return out;
}

function cardSvg({ name, no, link }) {
  const nm = nameLine(name);
  const num = no ? "#" + String(no).padStart(4, "0") : "#----";
  const label = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-family="${DISPLAY}" font-weight="700" font-size="${o.size || 28}" letter-spacing="${o.ls == null ? 5 : o.ls}" fill="${o.fill || C.ash}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}>${esc(t)}</text>`;
  const stat = (x, v, l) => `<text x="${x}" y="1052" font-family="${DISPLAY}" font-weight="900" font-size="58" fill="${C.bone}">${v}</text>` + label(x, 1094, l, { size: 24, ls: 4 });
  const nameText = nm.ar
    ? `<text x="${W - X}" y="382" font-family="PNL Arabic" font-weight="900" font-size="${nm.size}" fill="${C.bone}" text-anchor="end" direction="rtl">${esc(nm.text)}</text>`
    : `<text x="${X}" y="408" font-family="${DISPLAY}" font-weight="900" font-size="${nm.size}" fill="${C.bone}">${esc(nm.text)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.black}"/>
  <rect width="${W}" height="14" fill="${C.green}"/>
  <rect x="24" y="38" width="${W - 48}" height="${H - 62}" fill="none" stroke="${C.line}" stroke-width="2"/>
  <svg x="${X - 6}" y="70" width="210" height="70" viewBox="20 9 244 81">${WORDMARK}</svg>
  ${label(W - X, 118, "SEASON 1 · ONLINE LEAGUE", { anchor: "end", size: 26 })}

  ${label(X, 262, "CONTENDER", { size: 30, ls: 8 })}
  ${nameText}

  <rect x="${X}" y="448" width="292" height="66" fill="${C.green}"/>
  <rect x="${X + 24}" y="471" width="20" height="20" fill="${C.black}"/>
  <text x="${X + 60}" y="496" font-family="${DISPLAY}" font-weight="900" font-size="42" letter-spacing="2" fill="${C.black}">COMPETING</text>
  <text x="${X + 318}" y="492" font-family="${MONO}" font-weight="500" font-size="26" fill="${C.bone}">for 1 of 12 seats at the Live Finals</text>

  <rect x="${X}" y="584" width="${W - 2 * X}" height="2" fill="${C.line}"/>
  ${label(X, 650, "CONTENDER NO.", { size: 28 })}
  <text x="${X - 8}" y="868" font-family="${DISPLAY}" font-weight="900" font-size="250" letter-spacing="-2" fill="${C.green}">${num}</text>

  <rect x="${X}" y="950" width="${W - 2 * X}" height="2" fill="${C.line}"/>
  ${stat(X, "5,000 <tspan font-size='30' fill='" + C.ash + "'>USDT</tspan>", "PRIZE POOL")}
  ${stat(430, "12", "FINALISTS")}
  ${stat(640, "VCORE", "LIVE FINALS, TABARJA")}
  <rect x="${X}" y="1128" width="${W - 2 * X}" height="2" fill="${C.line}"/>

  <text x="${X}" y="1202" font-family="${DISPLAY}" font-weight="900" font-size="50" letter-spacing="1" fill="${C.green}">MIND OVER MARKET</text>
  <text x="${X}" y="1246" font-family="${MONO}" font-weight="500" font-size="25" fill="${C.bone}">Think you can trade? Join me:</text>
  <text x="${X}" y="1280" font-family="${MONO}" font-weight="400" font-size="25" fill="${C.green}">${esc(link.replace(/^https:\/\//, ""))}</text>
  <text x="${X}" y="1306" font-family="${MONO}" font-weight="400" font-size="16" fill="${C.ash}">PNL League by CE · Presented by OKX · 18+. KYC required. Trading involves risk.</text>
  ${qrRects(link, W - X - 158, 1150, 158)}
</svg>`;
}

function renderCard(opts) {
  const { Resvg } = require("@resvg/resvg-js");
  const svg = cardSvg(opts);
  const r = new Resvg(svg, { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "PNL Mono" } });
  return r.render().asPng();
}

module.exports = { renderCard, cardSvg };
