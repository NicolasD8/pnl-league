/* =====================================================================
   PNL LEAGUE · EDIT ME
   One config for the English (/) and Arabic (/ar/) pages.
   Anything marked TODO is a placeholder waiting for a real value.
   ===================================================================== */
window.PNL_CONFIG = {
  // TODO: Google Apps Script web-app URL (see apps-script.gs + README).
  // Empty = demo mode: the form shows success but saves nothing.
  FORM_ENDPOINT: "",

  // TODO: confirm exact time with OKX. After this moment the page switches to
  // "Registration is open" and every CTA goes to OKX_CAMPAIGN_URL.
  REG_OPENS: "2026-11-01T12:00:00+03:00",

  OKX_CAMPAIGN_URL: "https://www.okx.com/campaigns/ce-community-trading-competition-phase-1",

  // TODO: our OKX affiliate sign-up link for new accounts.
  // Empty = the "Open my OKX account" button stays hidden.
  OKX_SIGNUP_URL: "",

  // Real cap on the early list. 0 = no cap shown.
  // Only set a number you will actually enforce (compliance: scarcity must be true).
  EARLY_CAP: 0,
  EARLY_TAKEN: 0,

  // TODO: final domain, no trailing slash. Used for share links.
  // (OG / canonical URLs are hard-coded in the HTML <head>; see README "Changing the domain".)
  SITE_URL: "https://pnlleague.com",

  // TODO: Telegram community invite link, e.g. "https://t.me/+AbCdEf..." or "https://t.me/yourgroup".
  // Every "Join our Telegram community" button uses it. Empty = buttons scroll to the community section.
  TELEGRAM_URL: "",

  // TODO: Rami and Rich's accounts (handle only, no @) and photo paths (put photos in public/assets/img/).
  // Empty handle = that button is hidden. Empty photo = initial shown instead.
  CREW: {
    rami: { instagram: "", tiktok: "", photo: "" },
    rich: { instagram: "", tiktok: "", photo: "" },
  },

  // TODO: partner logo files (SVG preferred) in public/assets/brand/. Empty = the name is set in type instead.
  // Use OKX's logo only from their official brand kit and with their OK.
  LOGOS: { okx: "", vcore: "" },

  // TODO: analytics IDs. Empty = that tracker is not loaded at all.
  META_PIXEL_ID: "",   // e.g. "123456789012345"
  GA4_ID: "",          // e.g. "G-XXXXXXXXXX"
};
