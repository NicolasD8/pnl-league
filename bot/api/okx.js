// Vercel function: OKX landing page for ads. Ads point to https://<app>/okx/<tag> (e.g. /okx/lead1_c1).
// GET: two buttons ("I have an OKX account" / "I don't"), then name + phone, then the right OKX link
//      (rebind for existing accounts, sign-up for new ones) and the competition link to join once that's done.
// POST: saves the lead (name, phone, has/new, tag) to the Sheet's "Leads" tab.
const fs = require("fs");
const path = require("path");
const { sheet } = require("../lib/clients");
const env = require("../lib/env");

const REF_RE = /^[A-Za-z0-9_-]{1,40}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const SIGNUP = "https://okx.com/join/8754277";
const CAMPAIGN = "https://www.okx.com/campaigns/ce-community-trading-competition-phase-1?channelid=8754277";
const REBIND ="https://okx.com/ul/f1IP61?channelId=8754277&rebindCode=TGQ27Z5X";
let FONT = "";
try { FONT = fs.readFileSync(path.join(__dirname, "..", "assets", "fonts", "big-shoulders-display-latin-900-normal.woff2")).toString("base64"); } catch (e) {}

const T = {
  en: {
    dir: "ltr", eyebrow: "PNL League · Trading competition on OKX", h1a: "The league", h1b: "is live.",
    sub: "Trade on OKX, climb the leaderboard, compete for the prize pool and a seat at the live finals.",
    q: "Do you have an OKX account?", has: "I have an OKX account", none: "I don't have an OKX account",
    formH: "Almost there", formP: "Leave your name and number so we can help you get in.",
    name: "Full name", phone: "Phone number (with country code)", phonePh: "+961 70 123 456", done: "Complete",
    back: "Back", errName: "Please enter your name.", errPhone: "Please enter a valid phone number.",
    hasH: "Link your account to PNL League", hasP: "Open the link on your phone, log in, and on \"Join this community\" write PNL League and tap Submit.",
    hasBtn: "Link my OKX account",
    newH: "Create your OKX account", newP: "Sign up with our link, then finish identity verification (KYC Level 2): profile picture > Verification.",
    newBtn: "Sign up on OKX",
    compH: "Then join the competition", compBtn: "Join the competition",
    compHas: "Once your rebind is approved (up to 1 business day), open the competition, tap \"Join Campaign\" and check it says \"Enrolled\".",
    compNew: "Once your KYC is verified, open the competition, tap \"Join Campaign\" and check it says \"Enrolled\".",
    foot: "18+. KYC required. Trading involves risk. PNL League by CE · Presented by OKX",
  },
  ar: {
    dir: "rtl", eyebrow: "PNL League · مسابقة تداول على OKX", h1a: "البطولة", h1b: "انطلقت.",
    sub: "تداول على OKX، اصعد في الترتيب، ونافس على الجوائز ومقعد في النهائيات المباشرة.",
    q: "هل لديك حساب على OKX؟", has: "لدي حساب على OKX", none: "ليس لدي حساب على OKX",
    formH: "خطوة أخيرة", formP: "اترك اسمك ورقمك لنساعدك على الدخول.",
    name: "الاسم الكامل", phone: "رقم الهاتف (مع رمز البلد)", phonePh: "+961 70 123 456", done: "إتمام",
    back: "رجوع", errName: "يرجى إدخال اسمك.", errPhone: "يرجى إدخال رقم هاتف صحيح.",
    hasH: "اربط حسابك بـ PNL League", hasP: "افتح الرابط على هاتفك، سجّل الدخول، وفي خانة \"Join this community\" اكتب PNL League واضغط Submit.",
    hasBtn: "اربط حسابي على OKX",
    newH: "أنشئ حسابك على OKX", newP: "سجّل عبر رابطنا، ثم أكمل التحقق من الهوية (KYC المستوى 2): صورة الملف > Verification.",
    newBtn: "سجّل على OKX",
    compH: "ثم انضم إلى المسابقة", compBtn: "انضم إلى المسابقة",
    compHas: "بعد الموافقة على الربط (خلال يوم عمل واحد)، افتح المسابقة، اضغط \"Join Campaign\" وتأكد أنها تقول \"Enrolled\".",
    compNew: "بعد التحقق من هويتك (KYC)، افتح المسابقة، اضغط \"Join Campaign\" وتأكد أنها تقول \"Enrolled\".",
    foot: "‏18+. التحقق من الهوية (KYC) مطلوب. التداول ينطوي على مخاطر. PNL League by CE · Presented by OKX",
  },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (s, n) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);

async function saveLead(req, res, e, sheetImpl) {
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (err) { b = {}; } }
  b = b || {};
  const name = clean(b.name, 80), phone = String(b.phone || "").replace(/[\s().-]/g, "");
  const okx = b.okx === "has" ? "has" : b.okx === "new" ? "new" : "";
  const ref = REF_RE.test(String(b.ref || "")) ? String(b.ref).toLowerCase() : "";
  const lang = b.lang === "ar" ? "ar" : "en";
  const ua = req.headers["user-agent"] || "";
  const os = /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "desktop";
  if (name.length < 2 || !PHONE_RE.test(phone) || !okx) return res.status(400).json({ ok: false, error: "bad lead" });
  try {
    await (sheetImpl || sheet(e.SHEET_URL, e.SHEET_SECRET)).lead({ name, phone, okx, ref, lang, os });
  } catch (err) {
    console.error("lead save failed", err && err.message); // still send them on: losing the signup is worse than losing the row
  }
  res.status(200).json({ ok: true });
}

module.exports = async (req, res, sheetImpl) => {
  const e = env();
  res.setHeader("cache-control", "no-store");
  if (req.method === "POST") return saveLead(req, res, e, sheetImpl);
  const raw = String(req.query.ref || "").trim();
  const ref = REF_RE.test(raw) ? raw.toLowerCase() : "";
  const lang = String(req.query.lang || "").toLowerCase() === "ar" || /^ar\b/i.test(req.headers["accept-language"] || "") && req.query.lang !== "en" ? "ar" : "en";
  const L = T[lang];
  const ua = req.headers["user-agent"] || "";
  const os = /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "desktop";
  const signup = e.OKX_SIGNUP_URL || SIGNUP, rebind = e.OKX_REBIND_URL || REBIND;
  const comp = /^https:\/\//.test(e.OKX_CAMPAIGN_URL || "") ? e.OKX_CAMPAIGN_URL : CAMPAIGN;
  const pixel = /^\d{6,20}$/.test(e.META_PIXEL_ID || "") ? e.META_PIXEL_ID : "";
  const arrow = `<span aria-hidden="true">${L.dir === "rtl" ? "←" : "→"}</span>`;

  const html = `<!doctype html>
<html lang="${lang}" dir="${L.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PNL League · Join on OKX</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#0B1410">
<style>
${FONT ? `@font-face{font-family:"BSD";font-weight:900;font-display:swap;src:url(data:font/woff2;base64,${FONT}) format("woff2")}` : ""}
:root{--g:#22F07A;--k:#0B1410;--k2:#111C17;--b:#F3F5F0;--a:#9FB0A6;--l:#24322B;--r:#FF6B6B;--d:"BSD",Impact,"Arial Narrow",sans-serif;--m:ui-monospace,"SFMono-Regular",Menlo,Consolas,monospace;color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--k);color:var(--b)}
body{font:15px/1.55 var(--m);min-height:100svh;display:flex;flex-direction:column;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left))}
.bar{height:6px;background:var(--g);margin:-20px -20px 28px}
main{flex:1;max-width:460px;width:100%;margin:0 auto;display:flex;flex-direction:column}
.eb{font:900 13px/1.3 var(--d);letter-spacing:.14em;text-transform:uppercase;color:var(--a)}
[dir=rtl] .eb,[dir=rtl] .btn,[dir=rtl] .opt{letter-spacing:0}
h1{font:900 clamp(58px,17vw,84px)/.9 var(--d);text-transform:uppercase;margin-top:14px}
h2{font:900 34px/1 var(--d);text-transform:uppercase}
[dir=rtl] h1,[dir=rtl] h2,[dir=rtl] .opt,[dir=rtl] .btn{line-height:1.2;font-family:system-ui,sans-serif}
h1 span{color:var(--g)}
.sub{margin-top:18px}
.q{margin-top:30px;color:var(--a)}
.opt{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:72px;margin-top:12px;padding:0 20px;background:var(--k2);color:var(--b);border:2px solid var(--l);font:900 24px/1 var(--d);text-transform:uppercase;text-align:start;cursor:pointer}
.opt:hover,.opt:focus-visible{border-color:var(--g);outline:0}
.opt span{color:var(--g)}
.btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:64px;margin-top:22px;background:var(--g);color:var(--k);text-decoration:none;font:900 28px/1 var(--d);text-transform:uppercase;border:0;cursor:pointer}
.btn.alt{background:transparent;color:var(--g);border:2px solid var(--g);font-size:22px;padding:12px 16px}
.btn:disabled{opacity:.6}
.btn:focus-visible{outline:3px solid var(--b);outline-offset:3px}
label{display:block;margin-top:18px;color:var(--a);font-size:13px}
input{display:block;width:100%;margin-top:6px;min-height:54px;padding:0 14px;background:var(--k2);color:var(--b);border:2px solid var(--l);font:16px var(--m)}
input:focus{border-color:var(--g);outline:0}
.err{min-height:20px;margin-top:10px;color:var(--r);font-size:13px}
.lnk{margin-top:16px;background:none;border:0;color:var(--a);font:13px var(--m);text-decoration:underline;cursor:pointer;align-self:flex-start}
.card{margin-top:26px;border:1px solid var(--l);background:var(--k2);padding:18px}
.card p{margin-top:8px;color:var(--a);font-size:14px}
.n{font:900 18px/1 var(--d);color:var(--g);letter-spacing:.1em}
[hidden]{display:none!important}
footer{max-width:460px;width:100%;margin:28px auto 0;font-size:11.5px;color:var(--a);opacity:.85}
</style>
${pixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");fbq("init","${pixel}");fbq("track","PageView");</script>` : ""}
</head>
<body>
<div class="bar"></div>
<main>
  <section id="s1">
    <div class="eb">${esc(L.eyebrow)}</div>
    <h1>${esc(L.h1a)}<br><span>${esc(L.h1b)}</span></h1>
    <p class="sub">${esc(L.sub)}</p>
    <p class="q">${esc(L.q)}</p>
    <button class="opt" id="has" type="button">${esc(L.has)} ${arrow}</button>
    <button class="opt" id="new" type="button">${esc(L.none)} ${arrow}</button>
  </section>

  <form id="s2" hidden novalidate>
    <h2>${esc(L.formH)}</h2>
    <p class="sub">${esc(L.formP)}</p>
    <label for="name">${esc(L.name)}</label>
    <input id="name" name="name" autocomplete="name" maxlength="80" required>
    <label for="phone">${esc(L.phone)}</label>
    <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(L.phonePh)}" dir="ltr" required>
    <p class="err" id="err" role="alert"></p>
    <button class="btn" id="done" type="submit">${esc(L.done)} ${arrow}</button>
    <button class="lnk" id="back" type="button">${esc(L.back)}</button>
  </form>

  <section id="s3" hidden>
    <div class="card">
      <div class="n">01</div>
      <h2 id="okxH"></h2>
      <p id="okxP"></p>
      <a class="btn" id="okx" href="#">${arrow}</a>
    </div>
    <div class="card">
      <div class="n">02</div>
      <h2>${esc(L.compH)}</h2>
      <p id="compP"></p>
      <a class="btn alt" id="comp" href="${esc(comp)}">${esc(L.compBtn)} ${arrow}</a>
    </div>
  </section>
</main>
<footer>${esc(L.foot)}</footer>
<script>
(function(){
  var ref=${JSON.stringify(ref)}, os=${JSON.stringify(os)}, lang=${JSON.stringify(lang)}, sent={}, okx="";
  var TX=${JSON.stringify({ has: [L.hasH, L.hasP, L.hasBtn, rebind, L.compHas], new: [L.newH, L.newP, L.newBtn, signup, L.compNew], errName: L.errName, errPhone: L.errPhone })};
  var $=function(id){return document.getElementById(id)};
  function track(ev){ if(sent[ev])return; sent[ev]=1;
    var body=JSON.stringify({e:ev,r:ref,os:os});
    try{ if(navigator.sendBeacon&&navigator.sendBeacon("/api/track",new Blob([body],{type:"text/plain"})))return; }catch(e){}
    try{ fetch("/api/track",{method:"POST",body:body,keepalive:true,headers:{"content-type":"text/plain"}}); }catch(e){}
  }
  function show(id){ ["s1","s2","s3"].forEach(function(s){ $(s).hidden=s!==id; }); window.scrollTo(0,0); }
  function pick(k){ okx=k; track(k==="has"?"lp_has":"lp_new"); show("s2"); $("name").focus(); }
  track("lp_view");
  $("has").addEventListener("click",function(){ pick("has"); });
  $("new").addEventListener("click",function(){ pick("new"); });
  $("back").addEventListener("click",function(){ show("s1"); });
  $("s2").addEventListener("submit",function(ev){
    ev.preventDefault();
    var name=$("name").value.trim(), phone=$("phone").value.replace(/[\\s().-]/g,"");
    if(name.length<2){ $("err").textContent=TX.errName; return $("name").focus(); }
    if(!/^\\+?[0-9]{7,15}$/.test(phone)){ $("err").textContent=TX.errPhone; return $("phone").focus(); }
    $("err").textContent=""; $("done").disabled=true;
    // save in the background (a beacon survives them leaving for OKX) and move on at once: the Sheet takes seconds
    var lead=JSON.stringify({name:name,phone:phone,okx:okx,ref:ref,lang:lang}), queued=false;
    try{ queued=navigator.sendBeacon&&navigator.sendBeacon("/api/okx",new Blob([lead],{type:"text/plain"})); }catch(e){}
    if(!queued){ try{ fetch("/api/okx",{method:"POST",body:lead,keepalive:true,headers:{"content-type":"text/plain"}}); }catch(e){} }
    track("lp_submit"); ${pixel ? 'try{fbq("track","Lead",{content_name:okx})}catch(e){}' : ""}
    var t=TX[okx];
    $("okxH").textContent=t[0]; $("okxP").textContent=t[1]; $("compP").textContent=t[4]; $("okx").href=t[3];
    $("okx").insertBefore(document.createTextNode(t[2]+" "),$("okx").firstChild);
    show("s3");
  });
  $("okx").addEventListener("click",function(){ track(okx==="has"?"lp_rebind":"lp_signup"); });
  $("comp").addEventListener("click",function(){ track("lp_comp"); });
})();
</script>
</body>
</html>`;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.status(200).send(html);
};
