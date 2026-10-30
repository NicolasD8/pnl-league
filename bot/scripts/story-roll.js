// Animated teaser story frames (1080x1920 @30fps): counter rolls up, anonymous contender feed scrolls, CTA lands.
// usage: node scripts/story-roll.js <framesDir> <count> <lastContenderNo> [seconds]
// then:  ffmpeg -framerate 30 -i <framesDir>/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [dir, countArg, lastArg, secArg] = process.argv.slice(2);
const COUNT = Number(countArg), LAST = Number(lastArg), FIRST = 15, SEC = Number(secArg || 8.5), FPS = 30;
fs.mkdirSync(dir, { recursive: true });
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", slate: "#5A6B61", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const fade = (t, a, b) => ease((t - a) / (b - a));

// feed rows: newest contender numbers first, looping; masked "name" bars of fixed pseudo-random widths
const bar = (i, k) => 90 + ((i * 97 + k * 53) % 170);
const RH = 78, FEED_TOP = 748, FEED_H = 470, SPEED = 95; // px per second

function frame(t) {
  const shown = Math.round(ease((t - 0.25) / 2.4) * COUNT);
  const done = shown >= COUNT;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><clipPath id="feed"><rect x="${X}" y="${FEED_TOP}" width="${CW}" height="${FEED_H}"/></clipPath></defs>
  <rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
  <svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">THE FIELD IS GROWING</text>
  <text x="${X - 6}" y="600" font-family="${D}" font-weight="900" font-size="300" fill="${C.green}">${shown}${done ? "+" : ""}</text>
  <text x="${X}" y="690" font-family="${D}" font-weight="900" font-size="88" fill="${C.bone}" opacity="${fade(t, 2.3, 2.9)}">TRADERS ARE IN.</text>
  <g clip-path="url(#feed)">`;
  // rows move up; higher (newer) numbers enter from the bottom; the last frame ends on the newest contender
  const off = t * SPEED, visible = Math.ceil(FEED_H / RH) + 1;
  const startNo = LAST - visible - Math.floor((SEC * SPEED) / RH) + 2;
  for (let k = 0; k <= visible; k++) {
    const y = FEED_TOP + k * RH - (off % RH);
    const n = startNo + k + Math.floor(off / RH);
    if (n > LAST || n < FIRST) continue;
    const fresh = n > LAST - 4;
    s += `<rect x="${X}" y="${y}" width="${CW}" height="${RH - 10}" fill="${fresh ? "#0F2A1C" : C.black2}" stroke="${fresh ? C.green : C.line}" stroke-width="2"/>
    <text x="${X + 24}" y="${y + 47}" font-family="${D}" font-weight="900" font-size="40" fill="${fresh ? C.green : C.bone}">#${String(n).padStart(4, "0")}</text>
    <rect x="${X + 190}" y="${y + 24}" width="${bar(n, 1)}" height="20" fill="${C.slate}"/>
    <rect x="${X + 200 + bar(n, 1)}" y="${y + 24}" width="${bar(n, 2) * 0.7}" height="20" fill="${C.line}"/>
    <text x="${X + CW - 24}" y="${y + 44}" font-family="${D}" font-weight="700" font-size="24" letter-spacing="4" fill="${fresh ? C.green : C.ash}" text-anchor="end">${fresh ? "NEW" : "IN"}</text>`;
  }
  s += `</g><rect x="${X}" y="${FEED_TOP}" width="${CW}" height="${FEED_H}" fill="none" stroke="${C.line}" stroke-width="2"/>`;
  // CTA lands
  const c = fade(t, 3.0, 3.7), dy = (1 - c) * 60;
  s += `<g opacity="${c}" transform="translate(0,${dy})">
    <text x="${X}" y="1350" font-family="${D}" font-weight="900" font-size="128" fill="${C.bone}">PROVE YOU'RE</text>
    <text x="${X}" y="1468" font-family="${D}" font-weight="900" font-size="128" fill="${C.green}">THE BEST.</text></g>
  <g opacity="${fade(t, 3.5, 4.1)}">
    <rect x="${X}" y="1540" width="${CW}" height="2" fill="${C.line}"/>
    <text x="${X}" y="1592" font-family="${D}" font-weight="900" font-size="40" fill="${C.green}">t.me/PNLLeagueBot</text>
    <text x="${W - X}" y="1592" font-family="${D}" font-weight="700" font-size="28" letter-spacing="4" fill="${C.ash}" text-anchor="end">REGISTRATION 1 NOV</text>
    <text x="${X}" y="1636" font-family="${M}" font-size="22" fill="${C.dim}">18+. KYC required. Trading involves risk.</text>
    <text x="${X}" y="1668" font-family="${M}" font-size="22" fill="${C.dim}">PNL League by CE · Presented by OKX</text></g></svg>`;
  return s;
}

const total = Math.round(SEC * FPS);
for (let f = 0; f < total; f++) {
  const png = new Resvg(frame(f / FPS), { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng();
  fs.writeFileSync(path.join(dir, `f${String(f).padStart(4, "0")}.png`), png);
}
console.log("frames:", total);
