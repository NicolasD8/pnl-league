/* PNL League · page logic. Shared by / and /ar/. Settings live in config.js. */
(function () {
  "use strict";
  const CONFIG = window.PNL_CONFIG || {};
  const LANG = document.documentElement.lang === "ar" ? "ar" : "en";

  const T = {
    en: {
      errName: "Add your name.",
      errPhone: "Add a valid WhatsApp number.",
      errOkx: "Tell us about your OKX account.",
      errEligible: "The competition is for 18+ traders based in Lebanon.",
      errConsent: "We need your OK to WhatsApp you the link.",
      errNetwork: "That didn't go through. Check your connection and try again.",
      saving: "Saving…",
      submit: "Claim my spot",
      doneTitle: (n) => (n ? `${n}, you're <span class="green">in.</span>` : `You're <span class="green">in.</span>`),
      kycVerified: "Your account's verified, so you're ready. Make sure you have at least 50 USDT to deposit when it opens.",
      share: (link) => `Think you can trade? PNL League is Lebanon's first live trading championship. Top 12 trade live at VCore for a 5,000 USDT prize pool. Claim your spot: ${link}`,
      capLeft: (left, cap) => `${left} of ${cap} early spots left`,
      openNote: '<span class="green">Registration is open.</span> Enter on OKX now.',
      openCard: (url) => `<div class="label">Registration is open</div>
        <h2 class="h">Take your <span class="green">seat.</span></h2>
        <p class="lead">Registration is live on OKX. Join the campaign, make sure it shows "Enrolled", and start climbing.</p>
        <a class="btn" href="${url}" target="_blank" rel="noopener">Register on OKX <span class="arr" aria-hidden="true">→</span></a>
        <p class="fine">18+, in Lebanon, KYC-verified OKX account. Main accounts only.</p>`,
      openCta: "Register on OKX",
      openNow: "Open now",
    },
    ar: {
      errName: "أضف اسمك.",
      errPhone: "أضف رقم واتساب صحيح.",
      errOkx: "أخبرنا عن حسابك على OKX.",
      errEligible: "المسابقة مخصّصة لمن هم بعمر 18 سنة وما فوق ومقيمين في لبنان.",
      errConsent: "نحتاج موافقتك لنرسل لك الرابط على واتساب.",
      errNetwork: "لم يتم الإرسال. تأكّد من اتصالك وحاول مجددًا.",
      saving: "جارٍ الحفظ…",
      submit: "احجز مكانك",
      doneTitle: (n) => (n ? `${n}، أنت <span class="green">معنا.</span>` : `أنت <span class="green">معنا.</span>`),
      kycVerified: "حسابك موثّق، أنت جاهز. تأكّد أن لديك 50 USDT على الأقل للإيداع عند فتح التسجيل.",
      share: (link) => `تظن أنك تجيد التداول؟ PNL League أول بطولة تداول مباشرة في لبنان. أفضل 12 متداولًا يتداولون مباشرةً في VCore على مجموع جوائز بقيمة 5,000 USDT. احجز مكانك: ${link}`,
      capLeft: (left, cap) => `بقي ${left} من ${cap} مكانًا في القائمة المبكرة`,
      openNote: '<span class="green">التسجيل مفتوح.</span> سجّل على OKX الآن.',
      openCard: (url) => `<div class="label">التسجيل مفتوح</div>
        <h2 class="h">خذ <span class="green">مقعدك.</span></h2>
        <p class="lead">التسجيل متاح الآن على OKX. انضم إلى الحملة، تأكّد أن حالتك تظهر "Enrolled"، وابدأ الصعود.</p>
        <a class="btn" href="${url}" target="_blank" rel="noopener">سجّل على OKX <span class="arr" aria-hidden="true">→</span></a>
        <p class="fine"><span class="ltr">18+</span>، في لبنان، حساب OKX موثّق (KYC). الحسابات الرئيسية فقط.</p>`,
      openCta: "سجّل على OKX",
      openNow: "مفتوح الآن",
    },
  }[LANG];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------- URL: drop a stale ?joined=1 so a shared/bookmarked thank-you URL never counts as a conversion ---------- */
  const url = new URL(location.href);
  if (url.searchParams.has("joined")) {
    url.searchParams.delete("joined");
    try { history.replaceState(null, "", url.pathname + url.search + url.hash); } catch (e) {}
  }
  const params = url.searchParams;

  /* ---------- analytics: Meta Pixel + GA4, only if IDs are set. PageView on load, Lead on signup. ---------- */
  function loadScript(src) { const s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  if (CONFIG.META_PIXEL_ID) {
    /* standard Meta Pixel bootstrap */
    const n = (window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    n.disablePushState = true; // we fire the ?joined=1 PageView ourselves, exactly once
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", CONFIG.META_PIXEL_ID);
    fbq("track", "PageView");
  }
  if (CONFIG.GA4_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", CONFIG.GA4_ID); // sends page_view
    loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.GA4_ID));
  }

  /* ---------- attribution: ?ref=rami + utm_* + fbclid, remembered across visits ---------- */
  const ATTR_KEYS = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  const attr = {};
  ATTR_KEYS.forEach((k) => {
    let v = (params.get(k) || "").trim().slice(0, 200);
    if (v) store.set("pnl_" + k, v); else v = store.get("pnl_" + k);
    if (v) attr[k] = v;
  });

  /* ---------- Telegram, crew accounts, partner logos ---------- */
  $$("[data-tg]").forEach((a) => {
    if (CONFIG.TELEGRAM_URL) { a.href = CONFIG.TELEGRAM_URL; a.target = "_blank"; a.rel = "noopener"; }
    else a.href = "#community";
  });
  const SOCIAL = { instagram: (h) => `https://www.instagram.com/${h}/`, tiktok: (h) => `https://www.tiktok.com/@${h}` };
  $$("[data-person]").forEach((el) => {
    const p = (CONFIG.CREW || {})[el.dataset.person] || {};
    el.querySelectorAll("[data-social]").forEach((a) => {
      const h = String(p[a.dataset.social] || "").replace(/^@/, "").trim();
      if (h) { a.href = SOCIAL[a.dataset.social](encodeURIComponent(h)); a.textContent += " @" + h; a.hidden = false; }
    });
    const img = el.querySelector("[data-photo]");
    if (img && p.photo) { img.src = p.photo; img.hidden = false; img.onerror = () => (img.hidden = true); }
  });
  $$("[data-logo]").forEach((el) => {
    const src = (CONFIG.LOGOS || {})[el.dataset.logo];
    if (src) el.innerHTML = `<img class="partner-logo" src="${src}" alt="${el.textContent.trim()}" />`;
  });

  /* ---------- countdown + launch-day switch ---------- */
  const opens = new Date(CONFIG.REG_OPENS);
  const isOpen = () => Date.now() >= opens.getTime();
  const pad = (n) => String(n).padStart(2, "0");
  const cdCells = $$("#countdown b");
  let switched = false;
  let timer = 0;

  function tick() {
    if (isOpen()) return switchToOpen();
    let ms = opens - Date.now();
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const s = Math.floor(ms / 1e3);
    const vals = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    cdCells.forEach((b) => { if (b.textContent !== vals[b.dataset.u]) b.textContent = vals[b.dataset.u]; });
  }

  function switchToOpen() {
    if (switched) return;
    switched = true;
    clearInterval(timer);
    const okx = CONFIG.OKX_CAMPAIGN_URL;
    $("#clock").hidden = true;
    $("#cd-note-open").innerHTML = T.openNote;
    $("#cd-note-open").hidden = false;
    const card = $("#join");
    card.className = "card is-open";
    card.innerHTML = T.openCard(okx);
    $$("[data-cta]").forEach((a) => {
      a.href = okx; a.target = "_blank"; a.rel = "noopener";
      const label = a.querySelector("[data-cta-label]") || a;
      label.textContent = T.openCta;
    });
    const when = $("#when-reg");
    if (when) { when.textContent = T.openNow; when.classList.add("now"); }
    $$("[data-before-open]").forEach((el) => (el.hidden = true));
    $$("[data-after-open]").forEach((el) => (el.hidden = false));
    $("#sticky").classList.remove("show");
  }

  tick();
  if (!switched) timer = setInterval(tick, 1000);

  /* ---------- optional real cap ---------- */
  if (!switched && CONFIG.EARLY_CAP > 0) {
    const left = Math.max(0, CONFIG.EARLY_CAP - CONFIG.EARLY_TAKEN);
    $("#cap").hidden = false;
    requestAnimationFrame(() => ($("#cap-fill").style.width = Math.min(100, (CONFIG.EARLY_TAKEN / CONFIG.EARLY_CAP) * 100) + "%"));
    $("#cap-text").textContent = T.capLeft(left, CONFIG.EARLY_CAP);
  }

  /* ---------- phone normalisation (mirrors apps-script.gs) ---------- */
  function normPhone(ccRaw, numRaw) {
    let cc = String(ccRaw || "").replace(/\D/g, "").replace(/^00/, "") || "961";
    let n = String(numRaw || "").replace(/\D/g, "");
    if (n.startsWith("00")) { n = n.slice(2); if (n.startsWith(cc)) n = n.slice(cc.length); }
    else if (n.startsWith(cc) && n.length > cc.length + 6) n = n.slice(cc.length);
    n = n.replace(/^0+/, "");
    const ok = cc === "961" ? n.length === 7 || n.length === 8 : n.length >= 6 && n.length <= 12;
    return { ok, e164: "+" + cc + n };
  }

  /* ---------- form ---------- */
  const form = $("#form");
  const loadedAt = Date.now();
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = form, err = $("#err");
    $$("#form [aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    const fail = (msg, el) => {
      err.textContent = msg;
      if (el) { el.setAttribute("aria-invalid", "true"); el.focus(); }
      return false;
    };
    const name = f.name.value.trim().replace(/\s+/g, " ");
    const phone = normPhone(f.cc.value, f.phone.value);
    if (name.length < 2) return fail(T.errName, f.name);
    if (!phone.ok) return fail(T.errPhone, f.phone);
    if (!f.okx.value) return fail(T.errOkx, f.okx);
    if (!f.eligible.checked) return fail(T.errEligible, f.eligible);
    if (!f.consent.checked) return fail(T.errConsent, f.consent);
    err.textContent = "";

    // honeypot: humans never see this field. Bots that fill it get a fake success and nothing is sent.
    const bot = f.website && f.website.value;

    const data = new URLSearchParams({
      name, phone: phone.e164, okx: f.okx.value, exp: f.exp.value, lang: LANG,
      consent: "yes", eligible: "yes", website: f.website ? f.website.value : "",
      ms: String(Date.now() - loadedAt), page: location.origin + location.pathname, ...attr,
    });
    const btn = $("#submit");
    btn.disabled = true; btn.textContent = T.saving;
    try {
      if (CONFIG.FORM_ENDPOINT && !bot) {
        // Apps Script doesn't send CORS headers on the first hop, so the response is opaque.
        // Validation is mirrored client-side; the script also rejects bad rows.
        await fetch(CONFIG.FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data, keepalive: true });
      } else if (!CONFIG.FORM_ENDPOINT) {
        console.info("[PNL demo mode] FORM_ENDPOINT is empty, nothing saved. Payload:", Object.fromEntries(data));
        await new Promise((r) => setTimeout(r, 450));
      }
    } catch (x) {
      btn.disabled = false; btn.textContent = T.submit;
      return fail(T.errNetwork);
    }
    store.set("pnl_joined", "1");
    if (!bot) conversion();
    showDone(name.split(" ")[0], f.okx.value);
  });

  function conversion() {
    // URL-based conversion: /?joined=1 (keeps utm_* so the ad platform can still match it)
    const u = new URL(location.href);
    u.searchParams.set("joined", "1");
    u.hash = "";
    try { history.pushState({ joined: 1 }, "", u.pathname + u.search); } catch (e) {}
    if (window.fbq) { fbq("track", "Lead"); fbq("track", "PageView"); }
    if (window.gtag) gtag("event", "generate_lead", { method: "early_list", lang: LANG, ref: attr.ref || "" });
  }

  function showDone(first, okx) {
    $("#done-title").innerHTML = T.doneTitle(escapeHtml(first));
    if (okx === "verified") $("#kyc-step").textContent = T.kycVerified;
    const okxBtn = $("#okx-btn");
    if (okx === "verified" || !CONFIG.OKX_SIGNUP_URL) okxBtn.hidden = true;
    else { okxBtn.href = CONFIG.OKX_SIGNUP_URL; okxBtn.hidden = false; }
    const base = (CONFIG.SITE_URL || location.origin).replace(/\/$/, "") + (LANG === "ar" ? "/ar/" : "/");
    const link = base + (attr.ref ? "?ref=" + encodeURIComponent(attr.ref) : "");
    $("#share-btn").href = "https://wa.me/?text=" + encodeURIComponent(T.share(link));
    const card = $("#join");
    card.classList.add("is-done");
    $("#sticky").classList.remove("show");
    const done = $("#done");
    done.focus({ preventScroll: true });
    const top = card.getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.5) card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- sticky CTA on mobile once the form scrolls out of view ---------- */
  const sticky = $("#sticky");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      sticky.classList.toggle("show", !en.isIntersecting && en.boundingClientRect.top < 0 && !switched && !$("#join").classList.contains("is-done"));
    }).observe($("#join"));
  }
})();
