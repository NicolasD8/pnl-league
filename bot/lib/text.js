// All user-facing copy, English + Arabic. Arabic is a DRAFT pending review.
// Compliance: no profit claims, no giveaway framing, no trading advice. Keep it that way when editing.

const en = {
  pickLang: "Choose your language · اختر لغتك",
  welcome: (cd) =>
    `<b>PNL League</b> · Lebanon's first live trading championship.\n\n` +
    `12 seats at the Live Finals. 5,000 USDT prize pool. One title.\n\n` +
    `Registration opens on OKX in <b>${cd}</b>. Join the early list and we'll send you the link here the moment it opens.\n\n` +
    `<i>18+. KYC required. Trading involves risk.</i>`,
  welcomeBack: (name, cd) =>
    `You're on the list, <b>${name}</b>. Registration opens on OKX in <b>${cd}</b>, and we'll message you here the moment it does.`,
  open:
    `<b>Registration is open.</b>\n\nJoin the campaign on OKX, make sure it shows "Enrolled", and start climbing.\n\n` +
    `<i>18+. KYC required. Trading involves risk.</i>`,

  // menu
  bJoin: "Join the early list",
  bHow: "How it works",
  bPrizes: "Prizes",
  bRules: "Who can enter",
  bAsk: "Ask a question",
  bPrivacy: "Your data",
  bLang: "العربية",
  bBack: "← Menu",
  bRegister: "Register on OKX",
  bOpenOkx: "Open my OKX account",
  bOkxUpdate: "Update my OKX status",
  okxAskAgain: "Where's your OKX account at now?",
  okxCheck: `Opened your OKX account yet?

Tap below to update your status, so we know you're ready for registration on <b>1 Nov</b>.`,
  okxNow: {
    verified: "Nice, you're ready for day one. Make sure you have at least 50 USDT to deposit when registration opens.",
    unverified: "Good start. Now complete identity verification (KYC) in the OKX app: Profile, then Verification. You need it to enter, and it can take a while.",
    none: (link) => link ? `No problem. Open your account here, then complete KYC in the OKX app:
${link}` : "No problem. Open an OKX account and complete KYC before registration opens.",
  },
  bInvite: "Invite a friend",

  how:
    `<b>How it works</b>\n\n` +
    `<b>1. Join the early list</b> right here. It takes 20 seconds.\n\n` +
    `<b>2. Register on OKX</b> when registration opens. To rank you need a KYC-verified OKX account, a 50 USDT minimum deposit and 5,000 USDT minimum trading volume.\n\n` +
    `<b>3. Climb two leaderboards:</b> PnL and Trading Volume, updated every 5 minutes. Futures and spot both count. Rewards from both are added up, and the 12 highest totals make the Finals.\n\n` +
    `<b>4. Trade live at VCore Tabarja:</b> six hours of live trading with casters, a crowd and a livestream on TikTok and Instagram. Rami casts it, Rich coaches all 12 finalists. Date announced with the registration opening.`,
  prizes:
    `<b>Prizes</b>\n\n` +
    `• <b>5,000 USDT prize pool</b> at the Live Finals, competed for by the 12 finalists.\n` +
    `• <b>1,000 USDT in leaderboard rewards</b> (trading bonus) during the Online League, shared across the two leaderboards.\n\n` +
    `Competition terms are set by OKX on the campaign page.`,
  rules:
    `<b>Who can enter</b>\n\n` +
    `• 18 or older and based in Lebanon\n` +
    `• A KYC-verified OKX account, main accounts only (no sub-accounts)\n` +
    `• 50 USDT minimum deposit and 5,000 USDT minimum trading volume to rank\n` +
    `• Some existing OKX accounts need to be linked to the competition first. We check that with you one by one.\n` +
    `• Wash trading and multiple accounts get you disqualified.\n\n` +
    `<i>Nothing here is investment advice. Digital assets are volatile and you can lose some or all of what you put in.</i>`,
  privacy:
    `<b>Your data</b>\n\n` +
    `We use your details only to send you PNL League updates here. We don't sell or share them.\n\n` +
    `/stop: stop all messages\n/delete: delete your details`,

  // signup
  askName: "What name should go on your contender card?",
  askConfirm: (name) => `Last step${name ? ", " + name : ""}. Tap below to confirm you're <b>18 or older</b>, <b>based in Lebanon</b>, and OK with PNL League messaging you here about the competition. No spam, and you can send /stop any time.`,
  bConfirm: "Yes, count me in",
  bNotEligible: "No",
  cfNo: "No problem. PNL League is open to traders 18 or older based in Lebanon, and we can only send you the registration link if you're OK with messages here. Send /start if anything changes.",
  bAddPhone: "Add my WhatsApp number (optional)",
  phoneThanks: "Saved. We may also reach you on WhatsApp about the competition.",
  nameUpdated: "Name updated. Here's your new card.",
  nameHint: "Wrong name on your card? Send /name to change it.",
  badName: "That doesn't look like a full name. Type your first and last name.",
  askPhone: "Share your phone number so we can also reach you on WhatsApp. Tap the button below, or skip.",
  bShare: "Share my number",
  bSkip: "Skip",
  notOwnContact: "Please share your own number with the button, or tap Skip.",
  askOkx: "Do you have an OKX account?",
  okx: { verified: "Yes, KYC verified", unverified: "Yes, not verified yet", none: "Not yet" },
  askExp: "How do you trade?",
  exp: { futures: "Mostly futures", spot: "Mostly spot", both: "Both", new: "Just getting started", skip: "Prefer not to say" },
  askElig: "Almost done. Are you 18 or older and based in Lebanon?",
  yes: "Yes",
  no: "No",
  inelig: "Thanks for your interest. PNL League is open to traders 18 or older based in Lebanon, so we can't add you to the list.",
  askConsent: "Last one. Can PNL League message you here about the competition? No spam, and you can send /stop any time.",
  bConsentYes: "Yes, keep me posted",
  noConsent: "No problem. We can only send you the registration link if you say yes. Send /start whenever you change your mind.",
  done: (name, kyc) =>
    `<b>You're in, ${name}.</b>\n\n` +
    `1. We'll message you the OKX registration link here the moment it opens.\n` +
    `2. ${kyc}\n` +
    `3. Bring your rivals. Send them your invite link.`,
  kycTodo: "Get your OKX account KYC verified now. It can take a while, and you need it to enter.",
  kycDone: "Your account's verified, so you're ready. Make sure you have at least 50 USDT to deposit when it opens.",
  inviteText: "PNL League is Lebanon's first live trading championship. The top 12 trade live at VCore for a 5,000 USDT prize pool. Join the early list:",
  useTypeHint: "Tap a button above to answer.",
  cardCaption: (no) => `<b>Your contender card${no ? " · #" + String(no).padStart(4, "0") : ""}</b>

Post it on your story, tag @pnlleague and challenge your rivals. The QR brings them straight here.

#PNLLeague #MindOverMarket`,
  cardNotYet: "Your contender card unlocks when you join the early list.",
  nudge: `You're one step away from the PNL League early list.

Registration opens on OKX on <b>1 Nov</b>, and we'll send the link here to everyone on the list. You also get your contender card.

Tap below to finish. It takes 20 seconds.`,
  bResume: "Finish my signup",
  okxNudge: (link) => `<b>⚠️ Action needed to secure your spot</b>

Registration opens on OKX on <b>Sunday 1 Nov</b>, and Phase 1 only runs <b>7 days (1–7 Nov)</b>. Without a <b>KYC-verified OKX account</b> you can't register, and every day you wait is a day off the leaderboard.

<b>Do it now:</b>
1. Open your OKX account: ${link}
2. Complete identity verification (KYC) in the OKX app

Be ready on day one.

<i>18+. KYC required. Trading involves risk.</i>`,

  // questions
  askQ: "Type your question and someone from PNL League will reply here.",
  qSent: "Got it. We'll reply here as soon as we can.",
  answer: (t) => `<b>PNL League:</b>\n${t}`,

  // account
  stopped: "Done. You won't get any more messages from us. Send /start to join again.",
  deleted: "Your details are deleted. Send /start if you want to join again.",
  langSet: "Language set to English.",
};

const ar = {
  pickLang: en.pickLang,
  welcome: (cd) =>
    `<b>PNL League</b> · أول بطولة تداول مباشرة في لبنان.\n\n` +
    `12 مقعدًا في النهائيات المباشرة. مجموع جوائز بقيمة 5,000 USDT. لقب واحد.\n\n` +
    `يفتح التسجيل على OKX خلال <b>${cd}</b>. انضم إلى القائمة المبكرة وسنرسل لك الرابط هنا لحظة فتحه.\n\n` +
    `<i>‏18+. التحقق من الهوية (KYC) مطلوب. التداول ينطوي على مخاطر.</i>`,
  welcomeBack: (name, cd) =>
    `أنت على القائمة يا <b>${name}</b>. يفتح التسجيل على OKX خلال <b>${cd}</b>، وسنراسلك هنا لحظة فتحه.`,
  open:
    `<b>التسجيل مفتوح.</b>\n\nانضم إلى الحملة على OKX، تأكّد أن حالتك تظهر "Enrolled"، وابدأ الصعود.\n\n` +
    `<i>‏18+. التحقق من الهوية (KYC) مطلوب. التداول ينطوي على مخاطر.</i>`,

  bJoin: "انضم إلى القائمة المبكرة",
  bHow: "كيف تعمل",
  bPrizes: "الجوائز",
  bRules: "من يمكنه المشاركة",
  bAsk: "اطرح سؤالًا",
  bPrivacy: "بياناتك",
  bLang: "English",
  bBack: "القائمة →",
  bRegister: "سجّل على OKX",
  bOpenOkx: "افتح حسابي على OKX",
  bOkxUpdate: "حدّث حالة حسابي على OKX",
  okxAskAgain: "ما وضع حسابك على OKX الآن؟",
  okxCheck: `هل فتحت حسابك على OKX؟

اضغط أدناه لتحديث حالتك، لنعرف أنك جاهز للتسجيل في <b>1 تشرين الثاني</b>.`,
  okxNow: {
    verified: "ممتاز، أنت جاهز لليوم الأول. تأكّد أن لديك 50 USDT على الأقل للإيداع عند فتح التسجيل.",
    unverified: "بداية جيدة. أكمل الآن التحقق من الهوية (KYC) في تطبيق OKX: الملف الشخصي ثم التحقق. هو شرط للمشاركة وقد يستغرق بعض الوقت.",
    none: (link) => link ? `لا مشكلة. افتح حسابك من هنا، ثم أكمل التحقق (KYC) في تطبيق OKX:
${link}` : "لا مشكلة. افتح حسابًا على OKX وأكمل التحقق (KYC) قبل فتح التسجيل.",
  },
  bInvite: "ادعُ صديقًا",

  how:
    `<b>كيف تعمل</b>\n\n` +
    `<b>1. انضم إلى القائمة المبكرة</b> هنا. تستغرق 20 ثانية.\n\n` +
    `<b>2. سجّل على OKX</b> عند فتح التسجيل. لتظهر في الترتيب تحتاج إلى حساب OKX موثّق (KYC)، وإيداع 50 USDT كحد أدنى، وحجم تداول 5,000 USDT كحد أدنى.\n\n` +
    `<b>3. اصعد في لوحتَي الصدارة:</b> الربح والخسارة (PnL) وحجم التداول، تُحدَّثان كل 5 دقائق. العقود الآجلة والتداول الفوري يُحتسبان. تُجمع مكافآتك من اللوحتين، وأعلى 12 مجموعًا تتأهل إلى النهائيات.\n\n` +
    `<b>4. تداول مباشرةً في VCore طبرجا:</b> ست ساعات من التداول المباشر مع معلّقين وجمهور وبث مباشر على TikTok وInstagram. رامي يعلّق، وريتش يدرّب المتأهّلين الـ12. يُعلَن الموعد مع فتح التسجيل.`,
  prizes:
    `<b>الجوائز</b>\n\n` +
    `• <b>مجموع جوائز بقيمة 5,000 USDT</b> في النهائيات المباشرة، يتنافس عليه المتأهّلون الـ12.\n` +
    `• <b>مكافآت لوحات الصدارة بقيمة 1,000 USDT</b> (مكافأة تداول) خلال الدوري الإلكتروني، تُوزَّع على اللوحتين.\n\n` +
    `شروط المسابقة تحددها OKX على صفحة الحملة.`,
  rules:
    `<b>من يمكنه المشاركة</b>\n\n` +
    `• عمرك 18 سنة أو أكثر وتقيم في لبنان\n` +
    `• حساب OKX موثّق (KYC)، الحسابات الرئيسية فقط (بدون حسابات فرعية)\n` +
    `• إيداع 50 USDT كحد أدنى وحجم تداول 5,000 USDT كحد أدنى لتظهر في الترتيب\n` +
    `• بعض الحسابات الحالية تحتاج إلى ربطها بالمسابقة أولًا. نتحقق من ذلك معك حالة بحالة.\n` +
    `• التداول الوهمي (wash trading) والحسابات المتعددة تؤدي إلى الاستبعاد.\n\n` +
    `<i>لا شيء هنا يُعدّ نصيحة استثمارية. الأصول الرقمية متقلّبة وقد تخسر جزءًا مما تضعه أو كله.</i>`,
  privacy:
    `<b>بياناتك</b>\n\n` +
    `نستخدم بياناتك فقط لإرسال تحديثات PNL League لك هنا. لا نبيعها ولا نشاركها.\n\n` +
    `/stop: إيقاف كل الرسائل\n/delete: حذف بياناتك`,

  askName: "ما الاسم الذي تريده على بطاقتك كمتنافس؟",
  askConfirm: (name) => `الخطوة الأخيرة${name ? " يا " + name : ""}. اضغط أدناه لتؤكّد أن عمرك <b>18 سنة أو أكثر</b>، وأنك <b>تقيم في لبنان</b>، وأنك توافق على أن تراسلك PNL League هنا بخصوص المسابقة. بدون رسائل مزعجة، ويمكنك إرسال /stop في أي وقت.`,
  bConfirm: "نعم، سجّلني",
  bNotEligible: "لا",
  cfNo: "لا مشكلة. PNL League مفتوحة لمن هم بعمر 18 سنة وما فوق ومقيمين في لبنان، ولا يمكننا إرسال رابط التسجيل إلا إذا وافقت على الرسائل هنا. أرسل /start إذا تغيّر أي شيء.",
  bAddPhone: "أضف رقم واتساب (اختياري)",
  phoneThanks: "تم الحفظ. قد نتواصل معك أيضًا على واتساب بخصوص المسابقة.",
  nameUpdated: "تم تحديث الاسم. إليك بطاقتك الجديدة.",
  nameHint: "الاسم على بطاقتك غير صحيح؟ أرسل /name لتغييره.",
  badName: "لا يبدو هذا اسمًا كاملًا. اكتب اسمك الأول واسم العائلة.",
  askPhone: "شارك رقم هاتفك لنتمكّن من التواصل معك على واتساب أيضًا. اضغط الزر أدناه، أو تخطَّ.",
  bShare: "شارك رقمي",
  bSkip: "تخطَّ",
  notOwnContact: "شارك رقمك أنت عبر الزر، أو اضغط تخطَّ.",
  askOkx: "هل لديك حساب على OKX؟",
  okx: { verified: "نعم، موثّق (KYC)", unverified: "نعم، غير موثّق بعد", none: "ليس بعد" },
  askExp: "كيف تتداول؟",
  exp: { futures: "العقود الآجلة غالبًا", spot: "التداول الفوري غالبًا", both: "الاثنان", new: "ما زلت في البداية", skip: "أفضّل عدم القول" },
  askElig: "اقتربنا. هل عمرك 18 سنة أو أكثر وتقيم في لبنان؟",
  yes: "نعم",
  no: "لا",
  inelig: "شكرًا لاهتمامك. PNL League مفتوحة لمن هم بعمر 18 سنة وما فوق ومقيمين في لبنان، لذلك لا يمكننا إضافتك إلى القائمة.",
  askConsent: "سؤال أخير. هل توافق أن تراسلك PNL League هنا بخصوص المسابقة؟ بدون رسائل مزعجة، ويمكنك إرسال /stop في أي وقت.",
  bConsentYes: "نعم، أبقوني على اطّلاع",
  noConsent: "لا مشكلة. لا يمكننا إرسال رابط التسجيل لك إلا إذا وافقت. أرسل /start متى غيّرت رأيك.",
  done: (name, kyc) =>
    `<b>أنت معنا يا ${name}.</b>\n\n` +
    `1. سنرسل لك رابط التسجيل على OKX هنا لحظة فتحه.\n` +
    `2. ${kyc}\n` +
    `3. تحدَّ منافسيك. أرسل لهم رابط الدعوة.`,
  kycTodo: "وثّق حسابك على OKX (KYC) الآن. قد يستغرق ذلك بعض الوقت، وهو شرط للمشاركة.",
  kycDone: "حسابك موثّق، أنت جاهز. تأكّد أن لديك 50 USDT على الأقل للإيداع عند فتح التسجيل.",
  inviteText: "PNL League أول بطولة تداول مباشرة في لبنان. أفضل 12 يتداولون مباشرةً في VCore على مجموع جوائز بقيمة 5,000 USDT. انضم إلى القائمة المبكرة:",
  useTypeHint: "اضغط أحد الأزرار أعلاه للإجابة.",
  cardCaption: (no) => `<b>بطاقتك كمتنافس${no ? " · #" + String(no).padStart(4, "0") : ""}</b>

انشرها على الستوري، أشِر إلى @pnlleague وتحدَّ منافسيك. رمز QR يوصلهم مباشرةً إلى هنا.

#PNLLeague #MindOverMarket`,
  cardNotYet: "تُفتح بطاقتك كمتنافس عند انضمامك إلى القائمة المبكرة.",
  nudge: `تبقّت خطوة واحدة لتنضم إلى القائمة المبكرة لـ PNL League.

يفتح التسجيل على OKX في <b>1 تشرين الثاني</b>، وسنرسل الرابط هنا لكل من على القائمة. وتحصل أيضًا على بطاقتك كمتنافس.

اضغط أدناه لإكمال التسجيل. تستغرق 20 ثانية.`,
  bResume: "أكمل تسجيلي",
  okxNudge: (link) => `<b>⚠️ خطوة ضرورية لتضمن مكانك</b>

يفتح التسجيل على OKX <b>يوم الأحد 1 تشرين الثاني</b>، والمرحلة الأولى تستمر <b>7 أيام فقط (1–7 تشرين الثاني)</b>. بدون <b>حساب OKX موثّق (KYC)</b> لا يمكنك التسجيل، وكل يوم تتأخر فيه هو يوم خارج لوحة الصدارة.

<b>قم بذلك الآن:</b>
1. افتح حسابك على OKX: ${link}
2. أكمل التحقق من الهوية (KYC) في تطبيق OKX

كن جاهزًا من اليوم الأول.

<i>‏18+. التحقق من الهوية (KYC) مطلوب. التداول ينطوي على مخاطر.</i>`,

  askQ: "اكتب سؤالك وسيردّ عليك أحد فريق PNL League هنا.",
  qSent: "وصلنا سؤالك. سنردّ عليك هنا في أقرب وقت.",
  answer: (t) => `<b>PNL League:</b>\n${t}`,

  stopped: "تم. لن تصلك أي رسائل منا بعد الآن. أرسل /start للانضمام مجددًا.",
  deleted: "تم حذف بياناتك. أرسل /start إذا أردت الانضمام مجددًا.",
  langSet: "تم اختيار العربية.",
};

module.exports = { en, ar, t: (lang) => (lang === "ar" ? ar : en) };
