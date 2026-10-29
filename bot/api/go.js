// Vercel function: ad bridge page. Ads point to https://<app>/go/<tag> (e.g. /go/lead3).
// Inside Instagram/Facebook, a plain t.me link opens a web page that most people never get past.
// This page jumps straight into the Telegram app where the phone allows it, shows one big button where it doesn't,
// helps people who don't have Telegram, and counts each step (via /api/track) so the ad funnel is visible.
const fs = require("fs");
const path = require("path");
const env = require("../lib/env");

const REF_RE = /^[A-Za-z0-9_-]{1,40}$/;
let FONT = "";
try { FONT = fs.readFileSync(path.join(__dirname, "..", "assets", "fonts", "big-shoulders-display-latin-900-normal.woff2")).toString("base64"); } catch (e) {}

const T = {
  en: {
    dir: "ltr", eyebrow: "Lebanon's first live trading championship", h1a: "12 seats.", h1b: "One title.",
    sub: "Join the PNL League early list on Telegram. We send you the OKX registration link the moment it opens on 1 Nov.",
    open: "Open in Telegram", note: "Takes 20 seconds. Free.",
    noTg: "Don't have Telegram?", get: "Get Telegram (free)", then: "Then come back and tap Open in Telegram.",
    web: "Having trouble? Open the web link", foot: "18+. KYC required. Trading involves risk. PNL League by CE · Presented by OKX",
  },
  ar: {
    dir: "rtl", eyebrow: "أول بطولة تداول مباشرة في لبنان", h1a: "12 مقعدًا.", h1b: "لقب واحد.",
    sub: "انضم إلى القائمة المبكرة لـ PNL League على تيليغرام. نرسل لك رابط التسجيل على OKX لحظة فتحه في 1 تشرين الثاني.",
    open: "افتح في تيليغرام", note: "تستغرق 20 ثانية. مجانًا.",
    noTg: "ليس لديك تيليغرام؟", get: "حمّل تيليغرام (مجانًا)", then: "ثم عُد واضغط «افتح في تيليغرام».",
    web: "واجهت مشكلة؟ افتح الرابط على الويب", foot: "‏18+. التحقق من الهوية (KYC) مطلوب. التداول ينطوي على مخاطر. PNL League by CE · Presented by OKX",
  },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = (req, res) => {
  const e = env();
  const bot = e.BOT_USERNAME || "PNLLeagueBot";
  const raw = String(req.query.ref || "").trim();
  const ref = REF_RE.test(raw) ? raw.toLowerCase() : "";
  const lang = String(req.query.lang || "").toLowerCase() === "ar" || /^ar\b/i.test(req.headers["accept-language"] || "") && req.query.lang !== "en" ? "ar" : "en";
  const L = T[lang];
  const ua = req.headers["user-agent"] || "";
  const os = /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "desktop";
  const start = ref ? `&start=${ref}` : "";
  const web = `https://t.me/${bot}${ref ? "?start=" + ref : ""}`;
  const tgUrl = `tg://resolve?domain=${bot}${start}`;
  // Android: an intent link opens the app directly from in-app browsers, falling back to the web link if Telegram isn't installed
  const deep = os === "android"
    ? `intent://resolve?domain=${bot}${start}#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=${encodeURIComponent(web)};end`
    : os === "ios" ? tgUrl : web;
  const store = os === "android" ? "https://play.google.com/store/apps/details?id=org.telegram.messenger"
    : os === "ios" ? "https://apps.apple.com/app/telegram-messenger/id686449807" : "https://telegram.org/apps";
  const pixel = /^\d{6,20}$/.test(e.META_PIXEL_ID || "") ? e.META_PIXEL_ID : "";

  const html = `<!doctype html>
<html lang="${lang}" dir="${L.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PNL League · Join on Telegram</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0B1410">
<style>
${FONT ? `@font-face{font-family:"BSD";font-weight:900;font-display:swap;src:url(data:font/woff2;base64,${FONT}) format("woff2")}` : ""}
:root{--g:#22F07A;--k:#0B1410;--k2:#111C17;--b:#F3F5F0;--a:#9FB0A6;--l:#24322B;--d:"BSD",Impact,"Arial Narrow",sans-serif;--m:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--k);color:var(--b)}
body{font:15px/1.55 var(--m);min-height:100svh;display:flex;flex-direction:column;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}
.bar{height:6px;background:var(--g);margin:-20px -20px 28px}
main{flex:1;max-width:460px;width:100%;margin:0 auto;display:flex;flex-direction:column}
.eb{font:900 13px/1.3 var(--d);letter-spacing:.14em;text-transform:uppercase;color:var(--a)}
[dir=rtl] .eb,[dir=rtl] .btn{letter-spacing:0}
h1{font:900 clamp(58px,17vw,84px)/.9 var(--d);text-transform:uppercase;margin-top:14px}
[dir=rtl] h1{line-height:1.15;font-family:system-ui,sans-serif}
h1 span{color:var(--g)}
.sub{margin-top:18px;color:var(--b)}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:64px;margin-top:28px;background:var(--g);color:var(--k);text-decoration:none;font:900 28px/1 var(--d);text-transform:uppercase;letter-spacing:.01em;border:0}
.btn:active{transform:translateY(1px)}
.btn:focus-visible{outline:3px solid var(--b);outline-offset:3px}
.note{margin-top:10px;text-align:center;color:var(--a);font-size:13px}
.help{margin-top:28px;border:1px solid var(--l);background:var(--k2);padding:16px}
.help.hot{border-color:var(--g)}
.help b{display:block;font:900 22px/1.1 var(--d);text-transform:uppercase}
[dir=rtl] .help b{font-family:system-ui,sans-serif}
.help a{display:inline-block;margin-top:10px;color:var(--g);font-weight:600}
.help p{margin-top:6px;color:var(--a);font-size:13px}
.web{margin-top:18px;text-align:center;font-size:13px}
.web a{color:var(--a)}
footer{max-width:460px;width:100%;margin:28px auto 0;font-size:11.5px;color:var(--a);opacity:.85}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
${pixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","${pixel}");fbq("track","PageView");</script>` : ""}
</head>
<body>
<div class="bar"></div>
<main>
  <div class="eb">${esc(L.eyebrow)}</div>
  <h1>${esc(L.h1a)}<br><span>${esc(L.h1b)}</span></h1>
  <p class="sub">${esc(L.sub)}</p>
  <a class="btn" id="open" href="${esc(deep)}">${esc(L.open)} <span aria-hidden="true">${L.dir === "rtl" ? "←" : "→"}</span></a>
  <p class="note">${esc(L.note)}</p>
  <div class="help" id="help">
    <b>${esc(L.noTg)}</b>
    <a id="get" href="${esc(store)}">${esc(L.get)}</a>
    <p>${esc(L.then)}</p>
  </div>
  <p class="web"><a id="web" href="${esc(web)}">${esc(L.web)}</a></p>
</main>
<footer>${esc(L.foot)}</footer>
<script>
(function(){
  var ref=${JSON.stringify(ref)}, os=${JSON.stringify(os)}, sent={};
  function track(ev){ if(sent[ev])return; sent[ev]=1;
    var body=JSON.stringify({e:ev,r:ref,os:os});
    try{ if(navigator.sendBeacon&&navigator.sendBeacon("/api/track",new Blob([body],{type:"text/plain"})))return; }catch(e){}
    try{ fetch("/api/track",{method:"POST",body:body,keepalive:true,headers:{"content-type":"text/plain"}}); }catch(e){}
  }
  function left(){ track("left_page"); }
  track("view");
  document.addEventListener("visibilitychange",function(){ if(document.hidden) left(); });
  document.getElementById("open").addEventListener("click",function(){ track("tap_open"); ${pixel ? 'try{fbq("trackCustom","OpenTelegram",{ref:ref})}catch(e){}' : ""} });
  document.getElementById("get").addEventListener("click",function(){ track("tap_get_telegram"); });
  document.getElementById("web").addEventListener("click",function(){ track("tap_web"); });
  // try the app straight away (works on most Android in-app browsers; iOS usually needs the tap)
  if(os!=="desktop"){ setTimeout(function(){ track("auto_open"); window.location.href=document.getElementById("open").href; },350); }
  // still here after 2.5s? the app probably didn't open: highlight the "no Telegram" help
  setTimeout(function(){ if(!document.hidden) document.getElementById("help").className="help hot"; },2500);
})();
</script>
</body>
</html>`;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.status(200).send(html);
};
