// Animated story (1080x1920 @30fps): competition trading volume rolls up, bars grow, CTA lands. Inside the IG safe zone (~260-1540).
// usage: node scripts/story-volume.js <framesDir> <volume> [seconds]   (pass a .png instead of a dir for the still last frame)
// then:  ffmpeg -framerate 30 -i <framesDir>/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 out.mp4
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const [outArg, volArg, secArg] = process.argv.slice(2);
const VOL = Number(volArg || 109768), SEC = Number(secArg || 7), FPS = 30;
const A = path.join(__dirname, "..", "assets");
const FONTS = ["big-shoulders-display-latin-900-normal", "big-shoulders-display-latin-700-normal", "ibm-plex-mono-latin-400-normal", "ibm-plex-mono-latin-500-normal"].map((f) => path.join(A, "fonts", f + ".ttf"));
const WORDMARK = fs.readFileSync(path.join(A, "wordmark.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const C = { green: "#22F07A", black: "#0B1410", black2: "#111C17", bone: "#F3F5F0", ash: "#9FB0A6", line: "#24322B", dim: "#8A9B91" };
const D = "PNL Display", M = "PNL Mono";
const W = 1080, H = 1920, X = 72, CW = W - 2 * X;
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const fade = (t, a, b) => ease((t - a) / (b - a));
const LINE = [0.04, 0.12, 0.08, 0.24, 0.2, 0.36, 0.3, 0.5, 0.44, 0.66, 0.6, 0.82, 0.92]; // jagged uptrend, 0..1 of chart height

function frame(t) {
  const shown = Math.round(ease((t - 0.25) / 2.4) * VOL);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.black}"/><rect width="${W}" height="14" fill="${C.green}"/>
  <svg x="${X - 6}" y="260" width="190" height="63" viewBox="20 9 244 81">${WORDMARK}</svg>
  <text x="${W - X}" y="300" font-family="${D}" font-weight="700" font-size="28" letter-spacing="6" fill="${C.ash}" text-anchor="end">THIS MORNING</text>
  <text x="${X}" y="420" font-family="${D}" font-weight="700" font-size="34" letter-spacing="8" fill="${C.green}">TOTAL TRADING VOLUME</text>
  <text x="${X - 6}" y="640" font-family="${D}" font-weight="900" font-size="230" fill="${C.bone}">${shown.toLocaleString("en-US")}</text>
  <text x="${X}" y="780" font-family="${D}" font-weight="900" font-size="84" fill="${C.green}" opacity="${fade(t, 2.3, 2.9)}">USDT TRADED</text>
  <text x="${X}" y="850" font-family="${M}" font-weight="500" font-size="32" fill="${C.ash}" opacity="${fade(t, 2.7, 3.3)}">and the league has only just started.</text>`;
  // rising line draws itself left to right while the number rolls, glowing dot at the tip
  const p = ease((t - 0.25) / 2.4), top = 940, base = 1230;
  const pts = LINE.map((v, i) => [X + (CW * i) / (LINE.length - 1), base - (base - top) * v]);
  const cx = X + CW * p;
  let k = 1; while (k < pts.length - 1 && pts[k][0] < cx) k++;
  const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], cy = y0 + ((y1 - y0) * (cx - x0)) / (x1 - x0 || 1);
  const drawn = [...pts.slice(0, k), [cx, cy]];
  const line = drawn.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  s += `<defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.green}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.green}" stop-opacity="0"/></linearGradient></defs>`;
  [0, 1, 2].forEach((g) => { s += `<rect x="${X}" y="${top + g * ((base - top) / 3)}" width="${CW}" height="1" fill="${C.line}"/>`; });
  if (p > 0.001) s += `<path d="${line} L${cx.toFixed(1)} ${base} L${X} ${base} Z" fill="url(#area)"/>
    <path d="${line}" fill="none" stroke="${C.green}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${26 + 6 * Math.sin(t * 6)}" fill="${C.green}" opacity="0.25"/>
    <circle cx="${cx}" cy="${cy}" r="12" fill="${C.green}"/>`;
  s += `<rect x="${X}" y="${base}" width="${CW}" height="3" fill="${C.ash}"/>`;
  // CTA lands
  const c = fade(t, 3.2, 3.9), dy = (1 - c) * 60;
  s += `<g opacity="${c}" transform="translate(0,${dy})">
    <rect x="${X}" y="1420" width="${CW}" height="112" fill="${C.green}"/>
    <text x="${X + 32}" y="1474" font-family="${D}" font-weight="900" font-size="46" fill="${C.black}">NOT IN YET? JOIN NOW</text>
    <text x="${X + 32}" y="1512" font-family="${M}" font-weight="500" font-size="28" fill="${C.black}">t.me/PNLLeagueBot</text>
    <path d="M${W - X - 100} 1476 h50 m-20 -22 l22 22 l-22 22" fill="none" stroke="${C.black}" stroke-width="9" stroke-linecap="square"/></g></svg>`;
  return s;
}

const render = (t) => new Resvg(frame(t), { fitTo: { mode: "width", value: W }, font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: M } }).render().asPng();
if (outArg.endsWith(".png")) {
  fs.writeFileSync(outArg, render(SEC));
  console.log("wrote", outArg);
} else {
  fs.mkdirSync(outArg, { recursive: true });
  const total = Math.round(SEC * FPS);
  for (let f = 0; f < total; f++) fs.writeFileSync(path.join(outArg, `f${String(f).padStart(4, "0")}.png`), render(f / FPS));
  console.log("frames:", total);
}
