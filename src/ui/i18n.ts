import { signal } from "@preact/signals";

export type Lang = "en" | "fa" | "ckb";

export const LANGUAGES: { id: Lang; name: string; short: string }[] = [
  { id: "en", name: "English", short: "EN" },
  { id: "fa", name: "فارسی", short: "فا" },
  { id: "ckb", name: "کوردی", short: "کو" },
];

const STORAGE_KEY = "lang";
const RTL_LANGS: Lang[] = ["fa", "ckb"];

function isLang(value: unknown): value is Lang {
  return LANGUAGES.some((lang) => lang.id === value);
}

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // storage can be unavailable (private mode, blocked site data)
  }
  for (const pref of navigator.languages ?? [navigator.language]) {
    const code = pref.toLowerCase();
    if (code.startsWith("fa")) return "fa";
    if (code.startsWith("ckb") || code.startsWith("ku")) return "ckb";
    if (code.startsWith("en")) return "en";
  }
  return "en";
}

export const CurrentLang = signal<Lang>(getInitialLang());

function applyLang(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}

CurrentLang.subscribe((lang) => {
  applyLang(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore, the choice just won't be remembered
  }
});

export const isRtl = () => RTL_LANGS.includes(CurrentLang.value);

type Params = Record<string, string | number>;
type Message = string | ((params: Params) => string);

const en = {
  "app.tagline": "Convert almost any file to almost any format, right in your browser.",
  "feature.private": "Files never leave your device",
  "feature.formats": "Hundreds of formats",
  "feature.free": "Free, no sign-up",

  "upload.select": "Select files to convert",
  "upload.click": "Click to select a file",
  "upload.tap": "Tap to select a file",
  "upload.drag": "or drag and drop",
  "upload.viewFormats": "View supported formats",
  "drop.title": "Drop to upload",
  "drop.subtitle": "Release to convert your file",

  "invalid.title": "Invalid selection",
  "invalid.text": "All input files must be of the same type.",

  "loading.formats": "Loading formats…",
  "loading.formatsFailed": "Could not load formats.",
  "loading.toolsTitle": "Loading tools…",
  "loading.toolsText": "Please wait while the app loads conversion tools.",
  "loading.toolsIgnore": "Ignore",

  "common.ok": "OK",
  "common.close": "Close",
  "common.done": "Done",
  "common.back": "Back",
  "common.next": "Next",
  "common.convert": "Convert",
  "common.cancel": "Cancel",
  "common.download": "Download",

  "footer.source": "Source",
  "language.label": "Language",

  "conv.addFiles": "Add more files",
  "conv.removeFile": "Remove file",
  "conv.failedTitle": "Conversion failed",
  "conv.failedText": "Could not find a valid conversion route between these formats.",
  "conv.failedAdvancedHint":
    "In Advanced mode the output must come from the tool you picked. Try the same format from another tool, or switch to Simple mode in settings.",
  "conv.complete": "Conversion complete!",
  "conv.summary": "Converted {from} → {to} via {path}",
  "conv.summaryMixed": ({ n, to, count }) =>
    `Converted ${n} file${count === 1 ? "" : "s"} to ${to}`,
  "conv.errorTitle": "Conversion error",
  "conv.errorText": "An unexpected error occurred: {error}",
  "conv.cancelTitle": "Cancel conversion",
  "conv.findingRoute": "Finding conversion route…",
  "conv.trying": "Trying {path}…",
  "conv.lookingForPath": "Looking for a valid path…",
  "conv.noLogs": "No logs available.",

  "results.zip": ({ n }) => `Download all as ZIP (${n} files)`,
  "results.zipping": "Zipping…",
  "results.failed": "These files couldn't be converted: {files}",
  "results.startOver": "Convert new files",
  "results.download": "Download {name}",

  "explorer.search": "Search formats…",
  "explorer.searchInput": "Search input formats",
  "explorer.searchOutput": "Search output formats",
  "explorer.clearSearch": "Clear search",
  "explorer.toggleCategories": "Toggle categories",
  "explorer.filterByCategory": "Filter by category",
  "explorer.formats": "Formats",
  "explorer.count": ({ n, count }) => `${n} format${count === 1 ? "" : "s"}`,
  "explorer.noResults": "No matching formats found",
  "explorer.clearFilters": "Clear filters",
  "explorer.showAll": "Show all",
  "explorer.notFound": "Didn't find what you were looking for?",
  "explorer.suggested": "Suggested",
  "explorer.stepFrom": "Step 1 — What format is your file?",
  "explorer.stepTo": "Step 2 — Convert to",
  "explorer.mixedInput": ({ n }) => `${n} kinds of files`,

  "fromto.input": "input",
  "fromto.output": "output",
  "fromto.count": ({ n, kind, count }) => `${n} ${kind} format${count === 1 ? "" : "s"}`,
  "fromto.selectedInput": "Selected input format: {ext}",
  "fromto.selectedOutput": "Selected output format: {ext}",

  "category.image": "Image",
  "category.vector": "Vector",
  "category.video": "Video",
  "category.audio": "Audio",
  "category.text": "Text",
  "category.data": "Data",
  "category.code": "Code",
  "category.document": "Document",
  "category.spreadsheet": "Spreadsheet",
  "category.presentation": "Presentation",
  "category.archive": "Archive",
  "category.font": "Font",
  "category.model": "3D Model",
  "category.database": "Database",

  "settings.title": "App settings",
  "settings.general": "General",
  "settings.advanced": "Advanced mode",
  "settings.advancedDesc": "Choose which handler to use for each format.",
  "settings.updates": "Updates",
  "settings.autoUpdate": "Automatic updates",
  "settings.autoUpdateInstall":
    "Download new versions in the background and install them when you quit.",
  "settings.autoUpdateCheck": "Check for new versions when the app starts.",
  "settings.softwareUpdate": "Software update",
  "settings.restartToUpdate": "Restart to update",
  "settings.checkUpdates": "Check for updates",
  "update.unsupported": "Updates aren't available in this build.",
  "update.checking": "Checking for updates…",
  "update.upToDate": "You're on the latest version.",
  "update.downloading": "Downloading update…",
  "update.downloadingPercent": "Downloading update… {n}%",
  "update.available": "An update is available.",
  "update.downloaded": "The update will be installed when you quit.",
  "update.error": "Couldn't check for updates.",
  "update.notChecked": "Not checked yet.",

  "help.label": "Help & Info",
  "help.gotIt": "Got it",
  "help.subtitle": "Private, on-device file converter.",
  "help.whyTitle": "Why use this?",
  "help.why1":
    "Most online converters require uploading your files to some server, which is terrible for privacy. This app runs entirely in your browser. Your files never leave your device.",
  "help.why2":
    "Gorin can also convert across mediums, not just image to image or video to video. Need an AVI video as a PDF document? It will find a way.",
  "help.howTitle": "How to use",
  "help.step1": "Select your file(s) by clicking, pasting, or dragging-and-dropping.",
  "help.step2": "Confirm the input format (usually auto-detected).",
  "help.step3": "Choose your desired output format.",
  "help.step4": "Click Convert and wait for the result.",
  "help.advancedTitle": "Advanced mode",
  "help.advancedText":
    "Advanced mode lets you select which handler to use for each format. Use it when you need fine-grained control over which tool handles the conversion.",
} satisfies Record<string, Message>;

export type MessageKey = keyof typeof en;

const fa: Record<MessageKey, Message> = {
  "app.tagline": "تقریباً هر فایلی را به تقریباً هر فرمتی تبدیل کنید، همین‌جا در مرورگرتان.",
  "feature.private": "فایل‌ها از دستگاهتان خارج نمی‌شوند",
  "feature.formats": "صدها فرمت",
  "feature.free": "رایگان، بدونِ ثبت‌نام",

  "upload.select": "انتخابِ فایل برای تبدیل",
  "upload.click": "برای انتخابِ فایل کلیک کنید",
  "upload.tap": "برای انتخابِ فایل بزنید",
  "upload.drag": "یا فایل را بکشید و این‌جا رها کنید",
  "upload.viewFormats": "دیدنِ فرمت‌های پشتیبانی‌شده",
  "drop.title": "رها کنید تا اضافه شود",
  "drop.subtitle": "رها کنید تا فایلتان تبدیل شود",

  "invalid.title": "انتخابِ نامعتبر",
  "invalid.text": "همهٔ فایل‌های ورودی باید از یک نوع باشند.",

  "loading.formats": "در حالِ بارگذاریِ فرمت‌ها…",
  "loading.formatsFailed": "بارگذاریِ فرمت‌ها ناموفق بود.",
  "loading.toolsTitle": "در حالِ بارگذاریِ ابزارها…",
  "loading.toolsText": "لطفاً صبر کنید تا ابزارهای تبدیل بارگذاری شوند.",
  "loading.toolsIgnore": "نادیده بگیر",

  "common.ok": "باشه",
  "common.close": "بستن",
  "common.done": "تمام",
  "common.back": "بازگشت",
  "common.next": "بعدی",
  "common.convert": "تبدیل",
  "common.cancel": "لغو",
  "common.download": "دانلود",

  "footer.source": "کدِ منبع",
  "language.label": "زبان",

  "conv.addFiles": "افزودنِ فایلِ بیشتر",
  "conv.removeFile": "حذفِ فایل",
  "conv.failedTitle": "تبدیل ناموفق بود",
  "conv.failedText": "مسیری برای تبدیلِ این فرمت‌ها به یکدیگر پیدا نشد.",
  "conv.failedAdvancedHint":
    "در حالتِ پیشرفته، خروجی باید با همان ابزاری ساخته شود که انتخاب کرده‌اید. همین فرمت را از ابزارِ دیگری انتخاب کنید، یا در تنظیمات حالتِ پیشرفته را خاموش کنید.",
  "conv.complete": "تبدیل انجام شد!",
  "conv.summary": "تبدیلِ {from} به {to} از مسیرِ {path}",
  "conv.summaryMixed": "{n} فایل به {to} تبدیل شد",
  "conv.errorTitle": "خطا در تبدیل",
  "conv.errorText": "خطای غیرمنتظره‌ای رخ داد: {error}",
  "conv.cancelTitle": "لغوِ تبدیل",
  "conv.findingRoute": "در حالِ پیدا کردنِ مسیرِ تبدیل…",
  "conv.trying": "در حالِ امتحانِ {path}…",
  "conv.lookingForPath": "در حالِ جست‌وجوی مسیرِ مناسب…",
  "conv.noLogs": "گزارشی نیست.",

  "results.zip": ({ n }) => `دانلودِ همه به‌صورتِ ZIP (${n} فایل)`,
  "results.zipping": "در حالِ ساختِ ZIP…",
  "results.failed": "این فایل‌ها تبدیل نشدند: {files}",
  "results.startOver": "تبدیلِ فایل‌های جدید",
  "results.download": "دانلودِ {name}",

  "explorer.search": "جست‌وجوی فرمت…",
  "explorer.searchInput": "جست‌وجوی فرمت‌های ورودی",
  "explorer.searchOutput": "جست‌وجوی فرمت‌های خروجی",
  "explorer.clearSearch": "پاک کردنِ جست‌وجو",
  "explorer.toggleCategories": "نمایش یا پنهان کردنِ دسته‌ها",
  "explorer.filterByCategory": "فیلتر بر اساسِ دسته",
  "explorer.formats": "فرمت‌ها",
  "explorer.count": ({ n }) => `${n} فرمت`,
  "explorer.noResults": "فرمتی پیدا نشد",
  "explorer.clearFilters": "پاک کردنِ فیلترها",
  "explorer.showAll": "نمایشِ همه",
  "explorer.notFound": "چیزی را که می‌خواستید پیدا نکردید؟",
  "explorer.suggested": "پیشنهادی",
  "explorer.stepFrom": "مرحلهٔ ۱ — فایلِ شما چه فرمتی است؟",
  "explorer.stepTo": "مرحلهٔ ۲ — تبدیل به",
  "explorer.mixedInput": ({ n }) => `${n} نوع فایل`,

  "fromto.input": "ورودی",
  "fromto.output": "خروجی",
  "fromto.count": ({ n, kind }) => `${n} فرمتِ ${kind}`,
  "fromto.selectedInput": "فرمتِ ورودیِ انتخاب‌شده: {ext}",
  "fromto.selectedOutput": "فرمتِ خروجیِ انتخاب‌شده: {ext}",

  "category.image": "تصویر",
  "category.vector": "برداری",
  "category.video": "ویدیو",
  "category.audio": "صدا",
  "category.text": "متن",
  "category.data": "داده",
  "category.code": "کد",
  "category.document": "سند",
  "category.spreadsheet": "صفحه‌گسترده",
  "category.presentation": "ارائه",
  "category.archive": "آرشیو",
  "category.font": "فونت",
  "category.model": "مدلِ سه‌بعدی",
  "category.database": "پایگاه داده",

  "settings.title": "تنظیمات",
  "settings.general": "عمومی",
  "settings.advanced": "حالتِ پیشرفته",
  "settings.advancedDesc": "برای هر فرمت، ابزارِ تبدیل را خودتان انتخاب کنید.",
  "settings.updates": "به‌روزرسانی",
  "settings.autoUpdate": "به‌روزرسانیِ خودکار",
  "settings.autoUpdateInstall": "نسخه‌های جدید در پس‌زمینه دانلود و هنگامِ خروج نصب می‌شوند.",
  "settings.autoUpdateCheck": "هنگامِ اجرای برنامه، نسخهٔ جدید بررسی می‌شود.",
  "settings.softwareUpdate": "به‌روزرسانیِ نرم‌افزار",
  "settings.restartToUpdate": "اجرای دوباره برای به‌روزرسانی",
  "settings.checkUpdates": "بررسیِ به‌روزرسانی",
  "update.unsupported": "به‌روزرسانی در این نسخه در دسترس نیست.",
  "update.checking": "در حالِ بررسیِ به‌روزرسانی…",
  "update.upToDate": "آخرین نسخه را دارید.",
  "update.downloading": "در حالِ دانلودِ به‌روزرسانی…",
  "update.downloadingPercent": "در حالِ دانلودِ به‌روزرسانی… {n}٪",
  "update.available": "به‌روزرسانیِ جدید موجود است.",
  "update.downloaded": "به‌روزرسانی هنگامِ خروج نصب می‌شود.",
  "update.error": "بررسیِ به‌روزرسانی ممکن نشد.",
  "update.notChecked": "هنوز بررسی نشده.",

  "help.label": "راهنما و اطلاعات",
  "help.gotIt": "فهمیدم",
  "help.subtitle": "مبدلِ فایل، خصوصی و روی دستگاهِ خودتان.",
  "help.whyTitle": "چرا Gorin؟",
  "help.why1":
    "بیشترِ مبدل‌های آنلاین فایل‌تان را روی سرورِ خودشان آپلود می‌کنند که برای حریمِ خصوصی بد است. این برنامه کاملاً در مرورگرِ شما اجرا می‌شود و فایل‌هایتان هرگز از دستگاهتان خارج نمی‌شوند.",
  "help.why2":
    "Gorin می‌تواند بینِ رسانه‌های مختلف هم تبدیل کند، نه فقط تصویر به تصویر یا ویدیو به ویدیو. ویدیوی AVI را به‌صورتِ سندِ PDF می‌خواهید؟ راهش را پیدا می‌کند.",
  "help.howTitle": "روشِ استفاده",
  "help.step1": "فایل‌هایتان را با کلیک، چسباندن یا کشیدن و رها کردن انتخاب کنید.",
  "help.step2": "فرمتِ ورودی را تأیید کنید (معمولاً خودکار تشخیص داده می‌شود).",
  "help.step3": "فرمتِ خروجیِ دلخواه را انتخاب کنید.",
  "help.step4": "روی «تبدیل» بزنید و منتظرِ نتیجه بمانید.",
  "help.advancedTitle": "حالتِ پیشرفته",
  "help.advancedText":
    "در حالتِ پیشرفته می‌توانید برای هر فرمت، ابزارِ تبدیل را خودتان انتخاب کنید. وقتی کنترلِ دقیق‌تری روی تبدیل لازم دارید از آن استفاده کنید.",
};

const ckb: Record<MessageKey, Message> = {
  "app.tagline": "نزیکەی هەر فایلێک بگۆڕە بۆ نزیکەی هەر فۆرماتێک، ڕاستەوخۆ لە وێبگەڕەکەتدا.",
  "feature.private": "فایلەکانت هەرگیز ئامێرەکەت جێناهێڵن",
  "feature.formats": "سەدان فۆرمات",
  "feature.free": "بەخۆڕایی، بێ خۆتۆمارکردن",

  "upload.select": "فایل هەڵبژێرە بۆ گۆڕین",
  "upload.click": "کرتە بکە بۆ هەڵبژاردنی فایل",
  "upload.tap": "دەست لێبدە بۆ هەڵبژاردنی فایل",
  "upload.drag": "یان ڕایبکێشە و لێرە دایبنێ",
  "upload.viewFormats": "بینینی فۆرماتە پشتگیریکراوەکان",
  "drop.title": "دایبنێ بۆ زیادکردن",
  "drop.subtitle": "بەری بدە بۆ گۆڕینی فایلەکەت",

  "invalid.title": "هەڵبژاردنی نادروست",
  "invalid.text": "هەموو فایلەکان دەبێت لە یەک جۆر بن.",

  "loading.formats": "فۆرماتەکان بار دەکرێن…",
  "loading.formatsFailed": "نەتوانرا فۆرماتەکان بار بکرێن.",
  "loading.toolsTitle": "ئامرازەکان بار دەکرێن…",
  "loading.toolsText": "تکایە چاوەڕێ بکە تا ئامرازەکانی گۆڕین بار دەبن.",
  "loading.toolsIgnore": "پشتگوێی بخە",

  "common.ok": "باشە",
  "common.close": "داخستن",
  "common.done": "تەواو",
  "common.back": "گەڕانەوە",
  "common.next": "دواتر",
  "common.convert": "بگۆڕە",
  "common.cancel": "هەڵوەشاندنەوە",
  "common.download": "داگرتن",

  "footer.source": "سەرچاوە",
  "language.label": "زمان",

  "conv.addFiles": "زیادکردنی فایلی زیاتر",
  "conv.removeFile": "لابردنی فایل",
  "conv.failedTitle": "گۆڕین سەرکەوتوو نەبوو",
  "conv.failedText": "هیچ ڕێگایەک بۆ گۆڕینی ئەم فۆرماتانە نەدۆزرایەوە.",
  "conv.failedAdvancedHint":
    "لە دۆخی پێشکەوتوودا، دەرچوو دەبێت بە هەمان ئەو ئامرازە دروست بکرێت کە هەڵتبژاردووە. هەمان فۆرمات لە ئامرازێکی تر هەڵبژێرە، یان لە ڕێکخستنەکاندا دۆخی پێشکەوتوو بکوژێنەرەوە.",
  "conv.complete": "گۆڕین تەواو بوو!",
  "conv.summary": "{from} گۆڕدرا بۆ {to} لە ڕێگەی {path}",
  "conv.summaryMixed": "{n} فایل گۆڕدرا بۆ {to}",
  "conv.errorTitle": "هەڵە لە گۆڕیندا",
  "conv.errorText": "هەڵەیەکی چاوەڕواننەکراو ڕوویدا: {error}",
  "conv.cancelTitle": "هەڵوەشاندنەوەی گۆڕین",
  "conv.findingRoute": "دۆزینەوەی ڕێگای گۆڕین…",
  "conv.trying": "تاقیکردنەوەی {path}…",
  "conv.lookingForPath": "گەڕان بۆ ڕێگایەکی گونجاو…",
  "conv.noLogs": "هیچ تۆمارێک نییە.",

  "results.zip": ({ n }) => `داگرتنی هەمووی وەک ZIP (${n} فایل)`,
  "results.zipping": "ZIP دروست دەکرێت…",
  "results.failed": "ئەم فایلانە نەگۆڕدران: {files}",
  "results.startOver": "گۆڕینی فایلی نوێ",
  "results.download": "داگرتنی {name}",

  "explorer.search": "گەڕان بۆ فۆرمات…",
  "explorer.searchInput": "گەڕان لە فۆرماتەکانی هاتوو",
  "explorer.searchOutput": "گەڕان لە فۆرماتەکانی دەرچوو",
  "explorer.clearSearch": "سڕینەوەی گەڕان",
  "explorer.toggleCategories": "پیشاندان یان شاردنەوەی پۆلەکان",
  "explorer.filterByCategory": "پاڵاوتن بەپێی پۆل",
  "explorer.formats": "فۆرماتەکان",
  "explorer.count": ({ n }) => `${n} فۆرمات`,
  "explorer.noResults": "هیچ فۆرماتێک نەدۆزرایەوە",
  "explorer.clearFilters": "سڕینەوەی پاڵاوتنەکان",
  "explorer.showAll": "پیشاندانی هەموو",
  "explorer.notFound": "ئەوەی دەتویست نەتدۆزییەوە؟",
  "explorer.suggested": "پێشنیارکراو",
  "explorer.stepFrom": "هەنگاوی ١ — فایلەکەت چ فۆرماتێکە؟",
  "explorer.stepTo": "هەنگاوی ٢ — بگۆڕە بۆ",
  "explorer.mixedInput": ({ n }) => `${n} جۆر فایل`,

  "fromto.input": "هاتوو",
  "fromto.output": "دەرچوو",
  "fromto.count": ({ n, kind }) => `${n} فۆرماتی ${kind}`,
  "fromto.selectedInput": "فۆرماتی هاتووی هەڵبژێردراو: {ext}",
  "fromto.selectedOutput": "فۆرماتی دەرچووی هەڵبژێردراو: {ext}",

  "category.image": "وێنە",
  "category.vector": "ڤێکتەر",
  "category.video": "ڤیدیۆ",
  "category.audio": "دەنگ",
  "category.text": "دەق",
  "category.data": "داتا",
  "category.code": "کۆد",
  "category.document": "بەڵگەنامە",
  "category.spreadsheet": "خشتەی ئەلیکترۆنی",
  "category.presentation": "پێشکەشکردن",
  "category.archive": "ئەرشیف",
  "category.font": "فۆنت",
  "category.model": "مۆدێلی سێڕەهەندی",
  "category.database": "بنکەدراوە",

  "settings.title": "ڕێکخستنەکان",
  "settings.general": "گشتی",
  "settings.advanced": "دۆخی پێشکەوتوو",
  "settings.advancedDesc": "بۆ هەر فۆرماتێک، ئامرازی گۆڕین خۆت هەڵبژێرە.",
  "settings.updates": "نوێکردنەوە",
  "settings.autoUpdate": "نوێکردنەوەی خۆکار",
  "settings.autoUpdateInstall": "وەشانە نوێکان لە پاشبنەمادا دادەگیرێن و کاتی داخستن دادەمەزرێن.",
  "settings.autoUpdateCheck": "کاتی کردنەوەی بەرنامە، وەشانی نوێ دەپشکنرێت.",
  "settings.softwareUpdate": "نوێکردنەوەی بەرنامە",
  "settings.restartToUpdate": "دووبارە کردنەوە بۆ نوێکردنەوە",
  "settings.checkUpdates": "پشکنین بۆ نوێکردنەوە",
  "update.unsupported": "نوێکردنەوە لەم وەشانەدا بەردەست نییە.",
  "update.checking": "پشکنین بۆ نوێکردنەوە…",
  "update.upToDate": "دوایین وەشانت هەیە.",
  "update.downloading": "نوێکردنەوە دادەگیرێت…",
  "update.downloadingPercent": "نوێکردنەوە دادەگیرێت… {n}٪",
  "update.available": "نوێکردنەوەیەک بەردەستە.",
  "update.downloaded": "نوێکردنەوەکە کاتی داخستن دادەمەزرێت.",
  "update.error": "نەتوانرا نوێکردنەوە بپشکنرێت.",
  "update.notChecked": "هێشتا نەپشکنراوە.",

  "help.label": "یارمەتی و زانیاری",
  "help.gotIt": "تێگەیشتم",
  "help.subtitle": "گۆڕەری فایل، تایبەت و لەسەر ئامێرەکەی خۆت.",
  "help.whyTitle": "بۆچی Gorin؟",
  "help.why1":
    "زۆربەی گۆڕەرە ئۆنلاینەکان فایلەکانت بار دەکەن بۆ ڕاژەکارەکانیان، کە بۆ تایبەتمەندی خراپە. ئەم بەرنامەیە تەواو لە وێبگەڕەکەتدا کار دەکات و فایلەکانت هەرگیز ئامێرەکەت جێناهێڵن.",
  "help.why2":
    "Gorin دەتوانێت لە نێوان جۆرە جیاوازەکانیشدا بگۆڕێت، نەک تەنها وێنە بۆ وێنە یان ڤیدیۆ بۆ ڤیدیۆ. ڤیدیۆیەکی AVI وەک بەڵگەنامەی PDF دەتەوێت؟ ڕێگایەکی بۆ دەدۆزێتەوە.",
  "help.howTitle": "چۆنیەتی بەکارهێنان",
  "help.step1": "فایلەکانت هەڵبژێرە بە کرتەکردن، لکاندن یان ڕاکێشان و دانان.",
  "help.step2": "فۆرماتی هاتوو پشتڕاست بکەرەوە (زۆربەی کات خۆکار دەناسرێتەوە).",
  "help.step3": "فۆرماتی دەرچووی دڵخوازت هەڵبژێرە.",
  "help.step4": "کرتە لە «بگۆڕە» بکە و چاوەڕێی ئەنجام بکە.",
  "help.advancedTitle": "دۆخی پێشکەوتوو",
  "help.advancedText":
    "لە دۆخی پێشکەوتوودا دەتوانیت بۆ هەر فۆرماتێک ئامرازی گۆڕین خۆت هەڵبژێریت. کاتێک کۆنترۆڵی وردترت پێویستە بەکاری بهێنە.",
};

const MESSAGES: Record<Lang, Record<MessageKey, Message>> = { en, fa, ckb };

/** Formats a number with the digits of the current language (e.g. ۴۲۷ in Persian) */
export function formatNumber(value: number) {
  return new Intl.NumberFormat(CurrentLang.value).format(value);
}

/**
 * Looks up a UI string in the current language.
 * Numeric params are localized; `count` is passed through raw for plural rules.
 */
export function t(key: MessageKey, params: Params = {}): string {
  const message = MESSAGES[CurrentLang.value][key] ?? en[key];
  const localized: Params = { count: params.n ?? 0 };
  for (const [name, value] of Object.entries(params)) {
    localized[name] = typeof value === "number" ? formatNumber(value) : value;
  }
  if (typeof message === "function") return message(localized);
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    name in localized ? String(localized[name]) : match,
  );
}
