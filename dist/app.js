const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_GRID_WIDTH = 70;
const DEFAULT_COLOR_COUNT = 16;
const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;
const LOCALE_STORAGE_KEY = "stitchloom:locale:v1";
const THEME_STORAGE_KEY = "stitchloom:theme:v1";
const ONBOARDING_STORAGE_KEY = "stitchloom:onboarding:v1";
const ONBOARDING_COOKIE_KEY = "stitchloom_onboarding_v1";

const $ = (id) => document.getElementById(id);

const elements = {
  dropzone: $("dropzone"),
  fileInput: $("fileInput"),
  sourceCard: $("sourceCard"),
  sourcePreview: $("sourcePreview"),
  fileName: $("fileName"),
  fileMeta: $("fileMeta"),
  fileStatus: $("fileStatus"),
  removeImage: $("removeImage"),
  sizeSelect: $("sizeSelect"),
  sizeValue: $("sizeValue"),
  colorCount: $("colorCount"),
  colorNumber: $("colorNumber"),
  colorCountValue: $("colorCountValue"),
  colorGuidance: $("colorGuidance"),
  colorPresets: Array.from(document.querySelectorAll("[data-color-preset]")),
  aiPromptTarget: $("aiPromptTarget"),
  aiPromptText: $("aiPromptText"),
  aiPromptDetails: $("aiPromptDetails"),
  copyAiPrompt: $("copyAiPrompt"),
  copyAiPromptLabel: $("copyAiPromptLabel"),
  aiPromptStatus: $("aiPromptStatus"),
  appManifest: $("appManifest"),
  canonicalUrl: $("canonicalUrl"),
  ogLocale: $("ogLocale"),
  ogLocaleAlternate: $("ogLocaleAlternate"),
  ogUrl: $("ogUrl"),
  structuredData: $("structuredData"),
  localeToggle: $("localeToggle"),
  localeToggleLabel: $("localeToggleLabel"),
  brandHome: $("brandHome"),
  themeColor: $("themeColor"),
  themePicker: $("themePicker"),
  themePickerSummary: $("themePickerSummary"),
  themePickerLabel: $("themePickerLabel"),
  themeChoices: Array.from(document.querySelectorAll("[data-theme-choice]")),
  openOnboarding: $("openOnboarding"),
  onboardingDialog: $("onboardingDialog"),
  closeOnboarding: $("closeOnboarding"),
  skipOnboarding: $("skipOnboarding"),
  onboardingBack: $("onboardingBack"),
  onboardingNext: $("onboardingNext"),
  onboardingProgress: $("onboardingProgress"),
  onboardingSteps: Array.from(document.querySelectorAll("[data-onboarding-step]")),
  onboardingDots: Array.from(document.querySelectorAll("[data-onboarding-dot]")),
  autoUpdateStatus: $("autoUpdateStatus"),
  patternHeading: $("pattern-heading"),
  patternPanel: $("patternPanel"),
  patternToolbar: $("patternToolbar"),
  patternStatus: $("patternStatus"),
  emptyState: $("emptyState"),
  patternResult: $("patternResult"),
  patternDimension: $("patternDimension"),
  patternDetails: $("patternDetails"),
  patternCanvas: $("patternCanvas"),
  canvasShell: $("canvasShell"),
  showSymbols: $("showSymbols"),
  showGrid: $("showGrid"),
  zoomOut: $("zoomOut"),
  zoomReset: $("zoomReset"),
  zoomIn: $("zoomIn"),
  zoomValue: $("zoomValue"),
  legendCount: $("legendCount"),
  legendList: $("legendList"),
  downloadPdf: $("downloadPdf"),
  downloadPdfLabel: $("downloadPdfLabel"),
  downloadPng: $("downloadPng"),
  downloadCsv: $("downloadCsv"),
  exportStatus: $("exportStatus"),
  mobileResultBar: $("mobileResultBar"),
  mobileResultSummary: $("mobileResultSummary"),
  viewButtons: Array.from(document.querySelectorAll("[data-view]")),
};

const state = {
  image: null,
  objectUrl: null,
  fileName: "",
  fileSize: 0,
  pattern: null,
  lastDownloadUrl: null,
  copyResetTimer: null,
  onboardingStep: 0,
  onboardingSeenThisPage: false,
  onboardingOpenTimer: null,
  rebuildTimer: null,
  buildRevision: 0,
  patternInView: false,
  drag: null,
  pinch: null,
  resizeFrame: null,
  locale: "ru",
  themePreference: "auto",
  settings: {
    view: "pattern",
    showSymbols: true,
    symbolPreferenceTouched: false,
    showGrid: true,
    zoom: 100,
  },
};

const EN_TRANSLATIONS = {
  "meta.title": "Stitchloom — cross-stitch pattern from a photo",
  "meta.description": "Turn a photo into a cross-stitch pattern directly in your browser: square cells, 2–256 colors, and PDF, PNG, or CSV export.",
  "meta.ogTitle": "Stitchloom — photo to cross-stitch pattern",
  "meta.ogDescription": "Square cells, a 2–256 color palette, and PDF export — processed entirely in your browser.",
  "meta.twitterDescription": "Create a cross-stitch pattern from a photo directly in your browser.",
  "meta.imageAlt": "Stitchloom turns a photo into a pattern of square stitches",
  "brand.home": "Stitchloom, home",
  "privacy.full": "YOUR PHOTO STAYS ON THIS DEVICE",
  "privacy.short": "LOCAL",
  "theme.groupLabel": "Choose an interface theme",
  "theme.auto": "Auto",
  "theme.autoHint": "Match the system",
  "theme.light": "Light",
  "theme.lightHint": "Always light",
  "theme.dark": "Dark",
  "theme.darkHint": "Always dark",
  "tour.label": "How it works",
  "hero.eyebrow": "PATTERN STUDIO",
  "hero.title": "Photo to stitches.<br /><em>Cell by cell.</em>",
  "hero.copy": "Upload an image, choose the density, and get a flat pattern with one color and one symbol for every cell.",
  "controls.label": "Pattern settings",
  "source.eyebrow": "SOURCE",
  "source.title": "Upload a photo",
  "source.choose": "Choose an image",
  "source.dropTitle": "Drop your photo here",
  "source.dropHint": "or click to choose a file",
  "source.formats": "PNG, JPG, WEBP · up to 20 MB",
  "source.previewAlt": "Uploaded photo",
  "source.readyToProcess": "Ready to process",
  "source.remove": "Remove image",
  "ai.badge": "OPTIONAL",
  "ai.title": "Prepare the photo with AI",
  "ai.copy": "Ask ChatGPT, Gemini, or another image editor to turn a complex photo into clean pixel art. Large shapes survive better in a small pattern.",
  "ai.step1": "Choose the pattern size and color count below.",
  "ai.step2": "Attach the source photo to an AI chat and paste the prompt.",
  "ai.step3": "Download the resulting PNG and upload it to Stitchloom.",
  "ai.copyButton": "Copy prompt",
  "ai.edit": "View and edit the text",
  "ai.promptLabel": "Prompt for artistically simplifying the photo",
  "ai.privacy": "Stitchloom does not send anything itself. When you upload a photo to an external AI service, that service’s privacy policy applies.",
  "settings.eyebrow": "SETTINGS",
  "settings.title": "Set up the pattern",
  "settings.width": "Width in cells",
  "settings.size36": "36 cells · quick sketch",
  "settings.size52": "52 cells · balanced",
  "settings.size70": "70 cells · default",
  "settings.size90": "90 cells · detailed",
  "settings.size110": "110 cells · maximum detail",
  "settings.colors": "Colors in palette",
  "settings.presetsLabel": "Quick color-count presets",
  "settings.exact": "Exact",
  "settings.exactLabel": "Exact number of colors",
  "settings.rangeLow": "2 · graphic",
  "settings.rangeHigh": "256 · closer to photo",
  "settings.algorithm": "First we average the photo area under each cell, then build the selected palette — with no blending between neighboring cells.",
  "result.eyebrow": "RESULT",
  "result.viewMode": "View mode",
  "result.pattern": "Pattern",
  "result.photo": "Photo",
  "result.symbols": "Symbols",
  "result.grid": "Grid",
  "zoom.group": "Pattern zoom",
  "zoom.out": "Zoom out",
  "zoom.outShort": "Zoom out",
  "zoom.fit": "Fit",
  "zoom.fitShort": "Fit pattern",
  "zoom.in": "Zoom in",
  "zoom.inShort": "Zoom in",
  "result.emptyTitle": "Start with a photo",
  "result.emptyCopy": "Once uploaded, the grid, symbols, and color key will appear here.",
  "result.squareBadge": "SQUARE 1:1",
  "result.canvasRegion": "Pattern area. Use the zoom buttons, pinch, or Control and the mouse wheel. Drag the pattern when zoomed in.",
  "result.canvasAlt": "Cross-stitch pattern",
  "result.zoomHint": "Pinch or use the buttons to zoom",
  "result.panHint": "Drag the pattern when zoomed in",
  "result.downloadPdf": "Download PDF",
  "result.downloadPng": "Download PNG",
  "result.downloadCsv": "Download CSV",
  "result.sampleDimension": "70 × 70 cells",
  "result.sampleDetails": "16 colors · 4,900 stitches",
  "legend.eyebrow": "KEY",
  "legend.title": "Colors and symbols",
  "legend.region": "Scrollable color and symbol key",
  "legend.zero": "0 colors",
  "legend.note": "On-screen shades are approximate. Check them against a physical thread chart before buying floss.",
  "guide.eyebrow": "THE PROCESS AT A GLANCE",
  "guide.title": "How to make a cross-stitch pattern from a photo",
  "guide.copy": "Stitchloom turns a photo into a ready-to-use gridded pattern directly in your browser — with no account, manual tracing, or server upload.",
  "guide.step1Title": "Upload a photo",
  "guide.step1Copy": "Choose an image with a clear silhouette. For a busy background, copy the prompt first and simplify the image with AI.",
  "guide.step2Title": "Set the grid and palette",
  "guide.step2Copy": "Choose the pattern width and 2–256 colors. The height adapts automatically, while every cell stays perfectly square.",
  "guide.step3Title": "Save the result",
  "guide.step3Copy": "Check the symbols and grid, zoom into any area, and download the pattern as PDF, PNG, or CSV.",
  "faq.title": "Frequently asked questions",
  "faq.uploadQuestion": "Is my photo uploaded to a server?",
  "faq.uploadAnswer": "No. Stitchloom processes the photo locally in your browser and does not send it to a server.",
  "faq.sizeQuestion": "How do I choose the pattern size?",
  "faq.sizeAnswer": "Choose the width in cells. The height is calculated automatically from the photo’s proportions, and every cell remains square.",
  "faq.colorsQuestion": "How many colors should I choose?",
  "faq.colorsAnswer": "Start with 16 colors. Eight is often enough for simple artwork, while complex photos may need 24 or more.",
  "footer.privacy": "No account · no server upload",
  "mobile.goToResult": "Go to the finished pattern",
  "mobile.ready": "PATTERN READY",
  "mobile.openResult": "Open result",
  "mobile.open": "Open",
  "onboarding.eyebrow": "QUICK START",
  "onboarding.title": "How Stitchloom works",
  "onboarding.close": "Close tips",
  "onboarding.region": "Onboarding step",
  "onboarding.step1Code": "01 / SOURCE",
  "onboarding.step1Visual": "LOCAL IN YOUR BROWSER",
  "onboarding.step1Kicker": "Step 1 · Upload",
  "onboarding.step1Title": "Start with a photo",
  "onboarding.step1Copy": "Drop in a PNG, JPG, or WEBP. Stitchloom reads it directly in your browser: the file is not uploaded to a server to create the pattern.",
  "onboarding.step1Callout": "Images with a clear silhouette and calm background work best.",
  "onboarding.step2Code": "02 / SETTINGS",
  "onboarding.step2Visual": "EVERY CELL IS 1:1",
  "onboarding.step2Kicker": "Step 2 · Foundation",
  "onboarding.step2Title": "Cells are always square",
  "onboarding.step2Copy": "Choose the pattern width and the height follows the photo’s proportions. Pick a palette preset or enter an exact number. The pattern updates automatically, and 16 colors is usually a strong starting point.",
  "onboarding.ranges": "Setting ranges",
  "onboarding.cellsRange": "36–110 cells",
  "onboarding.colorsRange": "2–256 colors",
  "onboarding.squareCell": "Square 1:1 cell",
  "onboarding.step3Code": "03 / OPTIONAL",
  "onboarding.step3Visual": "PHOTO → CLEAN PIXEL ART",
  "onboarding.step3Kicker": "Step 3 · Preparation",
  "onboarding.step3Title": "Simplify a complex photo",
  "onboarding.step3Copy": "The source section includes a ready-made prompt for ChatGPT, Gemini, or another AI tool. It automatically uses your chosen pattern width and color count.",
  "onboarding.step3Callout": "This is optional. If you upload a photo to an external AI service, that service’s privacy policy applies.",
  "onboarding.step4Code": "04 / RESULT",
  "onboarding.step4Visual": "ZOOM · PDF · PNG · CSV",
  "onboarding.step4Kicker": "Step 4 · Review",
  "onboarding.step4Title": "Check and save the pattern",
  "onboarding.step4Copy": "Toggle the grid and symbols, zoom with the controls or a pinch, drag the enlarged pattern, and then download PDF, PNG, or CSV.",
  "onboarding.step4Callout": "You can reopen this tour at any time with the “?” button in the header.",
  "onboarding.skip": "Skip",
  "onboarding.back": "Back",
};

const UI_MESSAGES = {
  ru: {
    "theme.auto": "Авто",
    "theme.light": "Светлая",
    "theme.dark": "Тёмная",
    "theme.current": "Тема: {value}",
    "locale.switch": "Переключить на английский",
    "onboarding.progress": "Шаг {current} из {total}",
    "onboarding.start": "Начать работу",
    "onboarding.next": "Дальше",
    "ai.target": "{width} клеток · до {colors} цветов",
    "ai.copy": "Скопировать промпт",
    "ai.copied": "Промпт скопирован",
    "ai.copiedStatus": "Теперь прикрепите фото и вставьте промпт в выбранный ИИ-сервис.",
    "ai.select": "Выделить промпт",
    "ai.manualStatus": "Автокопирование недоступно — текст раскрыт и выделен для ручного копирования.",
    "guidance.low": "Графичный результат с коротким и простым ключом.",
    "guidance.balanced": "{colors} — хороший баланс деталей и удобного ключа.",
    "guidance.detailed": "Больше нюансов; для печати ключ уже будет длиннее.",
    "guidance.high": "Для ручной вышивки обычно удобнее до 64 цветов. Символы скрыты по умолчанию, но их можно включить.",
    "auto.noPhoto": "Загрузите фото — схема соберётся автоматически.",
    "auto.updating": "Настройки изменились — пересчитываю схему…",
    "auto.ready": "Готово: {width} × {height} клеток, {palette}. Изменения применяются автоматически.",
    "pattern.updatingStatus": "Обновляю…",
    "pattern.updatingHeading": "Обновляю схему",
    "pattern.buildingHeading": "Считаю клетки и подбираю цвета",
    "pattern.buildingStatus": "Собираю схему…",
    "pattern.readyStatus": "Схема готова",
    "pattern.readyHeading": "Схема готова к вышивке",
    "pattern.emptyHeading": "Ваша схема появится здесь",
    "pattern.waiting": "Ждёт фото",
    "zoom.current": "Текущий масштаб {zoom} процентов. Вписать схему в область просмотра",
    "file.local": "Всё считается локально: файл не загружается на сервер.",
    "file.ready": "Изображение готово. Схема строится локально в этом окне.",
    "file.patternReady": "Готово. Меняйте настройки — фото останется локальным, а схема обновится сама.",
    "file.invalid": "Нужен файл изображения: PNG, JPG, WEBP или GIF.",
    "file.tooLarge": "Файл слишком большой. Максимальный размер — 20 МБ.",
    "file.openFailed": "Не получилось открыть изображение. Попробуйте другой файл.",
    "legend.stitches": "Стежков",
    "pdf.ready": "PDF готов. ",
    "pdf.retry": "Скачать ещё раз",
    "pdf.readFailed": "Не удалось прочитать страницу PDF",
    "pdf.pageFailed": "Не удалось подготовить страницу PDF",
    "pdf.preparing": "Готовлю PDF…",
    "pdf.pages": "Собираю страницы: {current} / {total}",
    "pdf.packing": "Упаковываю PDF…",
    "pdf.failed": "Не удалось собрать PDF. Попробуйте уменьшить размер схемы.",
    "pdf.download": "Скачать PDF",
    "pdf.footerLocal": "Схема создана локально — stitchloom",
    "pdf.page": "Страница {page} / {total}",
    "pdf.overviewSection": "ОБЗОР СХЕМЫ",
    "pdf.coverTitle": "Схема для вышивки",
    "pdf.coverSubtitle": "клетка за клеткой",
    "pdf.imageDefault": "Изображение",
    "pdf.size": "РАЗМЕР",
    "pdf.colors": "ЦВЕТОВ",
    "pdf.stitches": "СТЕЖКОВ",
    "pdf.nextPages": "ДЕТАЛЬНАЯ СЕТКА И КЛЮЧ ЦВЕТОВ — НА СЛЕДУЮЩИХ СТРАНИЦАХ",
    "pdf.gridSection": "СЕТКА {current} / {total}",
    "pdf.gridTitle": "Квадратная схема 1:1",
    "pdf.gridRange": "Столбцы {columnStart}–{columnEnd} · ряды {rowStart}–{rowEnd}",
    "pdf.thickLine": "Толстая линия — каждые 10 клеток",
    "pdf.keySection": "КЛЮЧ {current} / {total}",
    "pdf.legendTitle": "Цвета и символы",
    "pdf.legendNote": "Оттенки на экране приблизительные — сверяйтесь с физическим каталогом мулине.",
  },
  en: {
    "theme.auto": "Auto",
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.current": "Theme: {value}",
    "locale.switch": "Switch to Russian",
    "onboarding.progress": "Step {current} of {total}",
    "onboarding.start": "Start creating",
    "onboarding.next": "Next",
    "ai.target": "{width} cells · up to {colors} colors",
    "ai.copy": "Copy prompt",
    "ai.copied": "Prompt copied",
    "ai.copiedStatus": "Now attach the photo and paste the prompt into your chosen AI service.",
    "ai.select": "Select prompt",
    "ai.manualStatus": "Automatic copying is unavailable — the text is open and selected for manual copying.",
    "guidance.low": "A graphic result with a short, simple key.",
    "guidance.balanced": "{colors} is a good balance between detail and a manageable key.",
    "guidance.detailed": "More nuance, but the printable key will be longer.",
    "guidance.high": "Up to 64 colors is usually more practical for hand stitching. Symbols are hidden by default, but you can turn them on.",
    "auto.noPhoto": "Upload a photo — the pattern will build automatically.",
    "auto.updating": "Settings changed — rebuilding the pattern…",
    "auto.ready": "Ready: {width} × {height} cells, {palette}. Changes apply automatically.",
    "pattern.updatingStatus": "Updating…",
    "pattern.updatingHeading": "Updating pattern",
    "pattern.buildingHeading": "Calculating cells and choosing colors",
    "pattern.buildingStatus": "Building pattern…",
    "pattern.readyStatus": "Pattern ready",
    "pattern.readyHeading": "Pattern ready to stitch",
    "pattern.emptyHeading": "Your pattern will appear here",
    "pattern.waiting": "Waiting for photo",
    "zoom.current": "Current zoom {zoom} percent. Fit the pattern to the viewport",
    "file.local": "Everything is processed locally: the file is not uploaded to a server.",
    "file.ready": "Image ready. The pattern is being built locally in this window.",
    "file.patternReady": "Ready. Change the settings — the photo stays local and the pattern updates automatically.",
    "file.invalid": "Choose an image file: PNG, JPG, WEBP, or GIF.",
    "file.tooLarge": "The file is too large. The maximum size is 20 MB.",
    "file.openFailed": "The image could not be opened. Try another file.",
    "legend.stitches": "Stitches",
    "pdf.ready": "PDF ready. ",
    "pdf.retry": "Download again",
    "pdf.readFailed": "Could not read the PDF page",
    "pdf.pageFailed": "Could not prepare the PDF page",
    "pdf.preparing": "Preparing PDF…",
    "pdf.pages": "Building pages: {current} / {total}",
    "pdf.packing": "Packaging PDF…",
    "pdf.failed": "Could not build the PDF. Try a smaller pattern size.",
    "pdf.download": "Download PDF",
    "pdf.footerLocal": "Pattern created locally — stitchloom",
    "pdf.page": "Page {page} / {total}",
    "pdf.overviewSection": "PATTERN OVERVIEW",
    "pdf.coverTitle": "Cross-stitch pattern",
    "pdf.coverSubtitle": "cell by cell",
    "pdf.imageDefault": "Image",
    "pdf.size": "SIZE",
    "pdf.colors": "COLORS",
    "pdf.stitches": "STITCHES",
    "pdf.nextPages": "DETAILED GRID AND COLOR KEY — ON THE FOLLOWING PAGES",
    "pdf.gridSection": "GRID {current} / {total}",
    "pdf.gridTitle": "Square 1:1 pattern",
    "pdf.gridRange": "Columns {columnStart}–{columnEnd} · rows {rowStart}–{rowEnd}",
    "pdf.thickLine": "Bold line every 10 cells",
    "pdf.keySection": "KEY {current} / {total}",
    "pdf.legendTitle": "Colors and symbols",
    "pdf.legendNote": "On-screen shades are approximate — check them against a physical thread chart.",
  },
};

const UNIT_FORMS = {
  ru: {
    cell: ["клетка", "клетки", "клеток"],
    color: ["цвет", "цвета", "цветов"],
    stitch: ["стежок", "стежка", "стежков"],
  },
  en: {
    cell: ["cell", "cells"],
    color: ["color", "colors"],
    stitch: ["stitch", "stitches"],
  },
};

const staticLocaleCache = new Map();

const SYMBOLS = [
  "■", "●", "▲", "◆", "✚", "×", "○", "□",
  "△", "◇", "★", "∗", "⌁", "≋", "◉", "◌",
  "⊕", "▦", "⋆", "♢", "⊗", "⊙", "◊", "✧",
];

const SYMBOL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DMC_PALETTE = [
  { code: "B5200", name: { ru: "Белый", en: "Snow White" }, hex: "#ffffff", r: 255, g: 255, b: 255 },
  { code: "3865", name: { ru: "Зимний белый", en: "Winter White" }, hex: "#f4f0e6", r: 244, g: 240, b: 230 },
  { code: "762", name: { ru: "Жемчужно-серый, светлый", en: "Pearl Gray, very light" }, hex: "#d7d0c4", r: 215, g: 208, b: 196 },
  { code: "318", name: { ru: "Стальной серый, светлый", en: "Steel Gray, light" }, hex: "#a7abb0", r: 167, g: 171, b: 176 },
  { code: "414", name: { ru: "Стальной серый, тёмный", en: "Steel Gray, dark" }, hex: "#73777a", r: 115, g: 119, b: 122 },
  { code: "535", name: { ru: "Графитовый серый", en: "Graphite Gray" }, hex: "#55585a", r: 85, g: 88, b: 90 },
  { code: "413", name: { ru: "Серый, тёмный", en: "Gray, dark" }, hex: "#44484a", r: 68, g: 72, b: 74 },
  { code: "3799", name: { ru: "Серый, очень тёмный", en: "Gray, very dark" }, hex: "#25292b", r: 37, g: 41, b: 43 },
  { code: "310", name: { ru: "Чёрный", en: "Black" }, hex: "#171719", r: 23, g: 23, b: 25 },
  { code: "3371", name: { ru: "Коричневый, почти чёрный", en: "Brown, very dark" }, hex: "#30201d", r: 48, g: 32, b: 29 },
  { code: "754", name: { ru: "Персиковый, светлый", en: "Peach, light" }, hex: "#f1c7ae", r: 241, g: 199, b: 174 },
  { code: "210", name: { ru: "Розовый, тёмный", en: "Pink, dark" }, hex: "#c87878", r: 200, g: 120, b: 120 },
  { code: "3712", name: { ru: "Лососевый, тёмный", en: "Salmon, dark" }, hex: "#ad5b5e", r: 173, g: 91, b: 94 },
  { code: "962", name: { ru: "Пыльная роза, средний", en: "Dusty Rose, medium" }, hex: "#d18d94", r: 209, g: 141, b: 148 },
  { code: "3803", name: { ru: "Розово-лиловый, светлый", en: "Mauve, light" }, hex: "#ad6b7b", r: 173, g: 107, b: 123 },
  { code: "321", name: { ru: "Красный", en: "Red" }, hex: "#bd2435", r: 189, g: 36, b: 53 },
  { code: "606", name: { ru: "Красно-оранжевый", en: "Bright Orange-Red" }, hex: "#ef4c3c", r: 239, g: 76, b: 60 },
  { code: "782", name: { ru: "Топаз, тёмный", en: "Topaz, dark" }, hex: "#ad7b3d", r: 173, g: 123, b: 61 },
  { code: "783", name: { ru: "Топаз, средний", en: "Topaz, medium" }, hex: "#c39a59", r: 195, g: 154, b: 89 },
  { code: "3047", name: { ru: "Жёлтый, очень светлый", en: "Yellow, very light" }, hex: "#e9dca4", r: 233, g: 220, b: 164 },
  { code: "3346", name: { ru: "Охотничий зелёный", en: "Hunter Green" }, hex: "#64814b", r: 100, g: 129, b: 75 },
  { code: "702", name: { ru: "Келли-зелёный", en: "Kelly Green" }, hex: "#5a9a5a", r: 90, g: 154, b: 90 },
  { code: "890", name: { ru: "Фисташковый, тёмный", en: "Pistachio Green, dark" }, hex: "#417342", r: 65, g: 115, b: 66 },
  { code: "799", name: { ru: "Синий Delft, средний", en: "Delft Blue, medium" }, hex: "#3c6290", r: 60, g: 98, b: 144 },
  { code: "820", name: { ru: "Королевский синий, тёмный", en: "Royal Blue, dark" }, hex: "#263f72", r: 38, g: 63, b: 114 },
  { code: "3325", name: { ru: "Синий, светлый", en: "Blue, light" }, hex: "#8ca4c2", r: 140, g: 164, b: 194 },
  { code: "550", name: { ru: "Фиолетовый, тёмный", en: "Violet, dark" }, hex: "#684c79", r: 104, g: 76, b: 121 },
  { code: "718", name: { ru: "Сливовый", en: "Plum" }, hex: "#a44770", r: 164, g: 71, b: 112 },
  { code: "3862", name: { ru: "Мокко, средний", en: "Mocha Brown, medium" }, hex: "#a47756", r: 164, g: 119, b: 86 },
  { code: "3866", name: { ru: "Мокко, очень светлый", en: "Mocha Brown, very light" }, hex: "#f0ddc1", r: 240, g: 221, b: 193 },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function t(key, variables = {}) {
  const localeMessages = UI_MESSAGES[state.locale] || UI_MESSAGES.ru;
  const template = localeMessages[key] ?? UI_MESSAGES.ru[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => (
    Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : `{${name}}`
  ));
}

function formatNumber(value) {
  return new Intl.NumberFormat(state.locale === "en" ? "en-US" : "ru-RU").format(value);
}

function plural(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function formatUnit(value, unit) {
  const forms = UNIT_FORMS[state.locale]?.[unit] || UNIT_FORMS.ru[unit];
  if (state.locale === "en") return value === 1 ? forms[0] : forms[1];
  return plural(value, forms[0], forms[1], forms[2]);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + (state.locale === "en" ? " KB" : " КБ");
  }
  const value = new Intl.NumberFormat(state.locale === "en" ? "en-US" : "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024));
  return value + (state.locale === "en" ? " MB" : " МБ");
}

function cacheStaticLocaleValues() {
  const bindings = [
    { selector: "[data-i18n]", datasetKey: "i18n", property: "textContent", suffix: "text" },
    { selector: "[data-i18n-html]", datasetKey: "i18nHtml", property: "innerHTML", suffix: "html" },
    { selector: "[data-i18n-aria-label]", datasetKey: "i18nAriaLabel", attribute: "aria-label", suffix: "aria" },
    { selector: "[data-i18n-title]", datasetKey: "i18nTitle", attribute: "title", suffix: "title" },
    { selector: "[data-i18n-content]", datasetKey: "i18nContent", attribute: "content", suffix: "content" },
    { selector: "[data-i18n-alt]", datasetKey: "i18nAlt", attribute: "alt", suffix: "alt" },
  ];

  bindings.forEach((binding) => {
    document.querySelectorAll(binding.selector).forEach((element) => {
      const key = element.dataset[binding.datasetKey];
      const cacheKey = `${key}:${binding.suffix}`;
      if (!staticLocaleCache.has(cacheKey)) {
        staticLocaleCache.set(
          cacheKey,
          binding.attribute ? element.getAttribute(binding.attribute) || "" : element[binding.property],
        );
      }
    });
  });
}

function applyStaticTranslations(locale) {
  const bindings = [
    { selector: "[data-i18n]", datasetKey: "i18n", property: "textContent", suffix: "text" },
    { selector: "[data-i18n-html]", datasetKey: "i18nHtml", property: "innerHTML", suffix: "html" },
    { selector: "[data-i18n-aria-label]", datasetKey: "i18nAriaLabel", attribute: "aria-label", suffix: "aria" },
    { selector: "[data-i18n-title]", datasetKey: "i18nTitle", attribute: "title", suffix: "title" },
    { selector: "[data-i18n-content]", datasetKey: "i18nContent", attribute: "content", suffix: "content" },
    { selector: "[data-i18n-alt]", datasetKey: "i18nAlt", attribute: "alt", suffix: "alt" },
  ];

  bindings.forEach((binding) => {
    document.querySelectorAll(binding.selector).forEach((element) => {
      const key = element.dataset[binding.datasetKey];
      const fallback = staticLocaleCache.get(`${key}:${binding.suffix}`);
      const value = locale === "en" ? EN_TRANSLATIONS[key] : fallback;
      if (typeof value !== "string") return;
      if (binding.attribute) element.setAttribute(binding.attribute, value);
      else element[binding.property] = value;
    });
  });
}

function getStaticTranslation(key, locale = state.locale) {
  if (locale === "en") return EN_TRANSLATIONS[key] || key;
  return staticLocaleCache.get(`${key}:text`)
    || staticLocaleCache.get(`${key}:content`)
    || key;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function setPatternStatus(label, kind) {
  elements.patternStatus.classList.remove("is-ready", "is-busy");
  if (kind) elements.patternStatus.classList.add("is-" + kind);
  const text = elements.patternStatus.querySelector("span:last-child");
  if (text) text.textContent = label;
}

function setFileStatus(message, isError) {
  elements.fileStatus.textContent = message;
  elements.fileStatus.classList.toggle("is-error", Boolean(isError));
}

function setAutoUpdateStatus(message, kind) {
  elements.autoUpdateStatus.classList.remove("is-busy", "is-ready");
  if (kind) elements.autoUpdateStatus.classList.add("is-" + kind);
  const text = elements.autoUpdateStatus.querySelector("span:last-child");
  if (text) text.textContent = message;
}

function setExportStatus(message, isError) {
  elements.exportStatus.textContent = message;
  elements.exportStatus.classList.toggle("is-error", Boolean(isError));
}

function getSafeStorage(name) {
  try {
    const storage = window[name];
    const testKey = "stitchloom:storage-test";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

const safeLocalStorage = getSafeStorage("localStorage");
const safeSessionStorage = getSafeStorage("sessionStorage");
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function isSupportedLocale(value) {
  return value === "ru" || value === "en";
}

function getInitialLocale() {
  const documentLocale = document.documentElement.dataset.locale;
  if (isSupportedLocale(documentLocale)) return documentLocale;
  return "ru";
}

function getLocalizedCanonicalUrl(locale) {
  const url = new URL("https://stitchloom.antonlenev.chatgpt.site/");
  if (locale === "en") url.searchParams.set("lang", "en");
  return url.href;
}

function buildStructuredData(locale) {
  const url = getLocalizedCanonicalUrl(locale);
  const english = locale === "en";
  const appDescription = english
    ? "A browser-based generator that turns photos into cross-stitch patterns."
    : "Браузерный генератор схем вышивки крестиком из фотографий.";
  const featureList = english
    ? [
      "Square pattern cells",
      "Palette from 2 to 256 colors",
      "PDF, PNG, and CSV export",
      "Local image processing",
    ]
    : [
      "Квадратные клетки схемы",
      "Палитра от 2 до 256 цветов",
      "Экспорт в PDF, PNG и CSV",
      "Локальная обработка изображения",
    ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://stitchloom.antonlenev.chatgpt.site/#website",
        url,
        name: "Stitchloom",
        alternateName: getStaticTranslation("meta.title", locale),
        description: appDescription,
        inLanguage: locale,
      },
      {
        "@type": "WebApplication",
        "@id": "https://stitchloom.antonlenev.chatgpt.site/#app",
        name: "Stitchloom",
        url,
        description: appDescription,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        inLanguage: locale,
        image: "https://stitchloom.antonlenev.chatgpt.site/og.png",
        isPartOf: { "@id": "https://stitchloom.antonlenev.chatgpt.site/#website" },
        featureList,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: english ? "USD" : "RUB",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://stitchloom.antonlenev.chatgpt.site/#faq",
        inLanguage: locale,
        mainEntity: [
          {
            "@type": "Question",
            name: getStaticTranslation("faq.uploadQuestion", locale),
            acceptedAnswer: {
              "@type": "Answer",
              text: getStaticTranslation("faq.uploadAnswer", locale),
            },
          },
          {
            "@type": "Question",
            name: getStaticTranslation("faq.sizeQuestion", locale),
            acceptedAnswer: {
              "@type": "Answer",
              text: getStaticTranslation("faq.sizeAnswer", locale),
            },
          },
          {
            "@type": "Question",
            name: getStaticTranslation("faq.colorsQuestion", locale),
            acceptedAnswer: {
              "@type": "Answer",
              text: getStaticTranslation("faq.colorsAnswer", locale),
            },
          },
        ],
      },
    ],
  };
}

function persistLocale(locale) {
  try {
    safeLocalStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // The URL still preserves the choice when storage is unavailable.
  }

  try {
    const url = new URL(window.location.href);
    if (locale === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    history.replaceState(history.state, document.title, url);
  } catch {
    // The selected language still applies for the current page view.
  }
}

function applyLocale(locale, persist = false, refresh = true) {
  const nextLocale = isSupportedLocale(locale) ? locale : "ru";
  state.locale = nextLocale;
  document.documentElement.lang = nextLocale;
  document.documentElement.dataset.locale = nextLocale;
  applyStaticTranslations(nextLocale);

  const localizedUrl = getLocalizedCanonicalUrl(nextLocale);
  elements.canonicalUrl.href = localizedUrl;
  elements.ogUrl.content = localizedUrl;
  elements.ogLocale.content = nextLocale === "en" ? "en_US" : "ru_RU";
  elements.ogLocaleAlternate.content = nextLocale === "en" ? "ru_RU" : "en_US";
  elements.structuredData.textContent = JSON.stringify(buildStructuredData(nextLocale));
  elements.appManifest.href = nextLocale === "en"
    ? new URL("./manifest.en.webmanifest", window.location.href).href
    : new URL("./manifest.webmanifest", window.location.href).href;

  elements.localeToggleLabel.textContent = nextLocale === "en" ? "RU" : "EN";
  elements.localeToggleLabel.lang = nextLocale === "en" ? "ru" : "en";
  elements.localeToggle.setAttribute("aria-label", t("locale.switch"));
  elements.localeToggle.title = t("locale.switch");
  elements.brandHome.href = nextLocale === "en" ? "./?lang=en" : "./";

  if (persist) persistLocale(nextLocale);
  if (refresh) refreshLocalizedUi();
}

function initLocale() {
  cacheStaticLocaleValues();
  applyLocale(getInitialLocale(), false, false);
}

const THEME_LABELS = {
  auto: "theme.auto",
  light: "theme.light",
  dark: "theme.dark",
};

function isThemePreference(value) {
  return Object.prototype.hasOwnProperty.call(THEME_LABELS, value);
}

function getInitialThemePreference() {
  const documentPreference = document.documentElement.dataset.themePreference;
  if (isThemePreference(documentPreference)) return documentPreference;

  try {
    const storedPreference = safeLocalStorage?.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(storedPreference)) return storedPreference;
  } catch {
    // Fall back to the automatic theme for this page view.
  }

  return "auto";
}

function resolveTheme(preference) {
  if (preference === "auto") return systemThemeMedia.matches ? "dark" : "light";
  return preference;
}

function applyTheme(preference, persist = false) {
  const nextPreference = isThemePreference(preference) ? preference : "auto";
  const resolvedTheme = resolveTheme(nextPreference);
  state.themePreference = nextPreference;

  document.documentElement.dataset.themePreference = nextPreference;
  document.documentElement.dataset.theme = resolvedTheme;
  const themeLabel = t(THEME_LABELS[nextPreference]);
  const themeDescription = t("theme.current", { value: themeLabel });
  elements.themePickerLabel.textContent = themeLabel;
  elements.themePickerSummary.setAttribute("aria-label", themeDescription);
  elements.themePickerSummary.title = themeDescription;
  elements.themeColor.content = resolvedTheme === "dark" ? "#131718" : "#e9e5dd";

  elements.themeChoices.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === nextPreference));
  });

  if (!persist) return;

  try {
    safeLocalStorage?.setItem(THEME_STORAGE_KEY, nextPreference);
  } catch {
    // The selected theme still applies for the current page view.
  }
}

function initTheme() {
  applyTheme(getInitialThemePreference());

  const handleSystemThemeChange = () => {
    if (state.themePreference === "auto") applyTheme("auto");
  };

  if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", handleSystemThemeChange);
  } else if (typeof systemThemeMedia.addListener === "function") {
    systemThemeMedia.addListener(handleSystemThemeChange);
  }
}

function hasOnboardingCookie() {
  try {
    return document.cookie
      .split(";")
      .map((part) => part.trim())
      .includes(ONBOARDING_COOKIE_KEY + "=1");
  } catch {
    return false;
  }
}

function writeOnboardingCookie() {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ONBOARDING_COOKIE_KEY}=1; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
    return hasOnboardingCookie();
  } catch {
    return false;
  }
}

function hasSeenOnboarding() {
  if (state.onboardingSeenThisPage) return true;

  try {
    if (safeLocalStorage?.getItem(ONBOARDING_STORAGE_KEY) === "1") return true;
  } catch {
    // Continue through the non-localStorage fallbacks.
  }

  if (hasOnboardingCookie()) return true;

  try {
    if (safeSessionStorage?.getItem(ONBOARDING_STORAGE_KEY) === "1") return true;
  } catch {
    // Fall through to history state.
  }

  try {
    return Boolean(history.state?.[ONBOARDING_STORAGE_KEY]);
  } catch {
    return false;
  }
}

function rememberOnboarding() {
  state.onboardingSeenThisPage = true;

  try {
    if (safeLocalStorage) {
      safeLocalStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
      return;
    }
  } catch {
    // Try the next persistence option.
  }

  if (writeOnboardingCookie()) return;

  try {
    if (safeSessionStorage) {
      safeSessionStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
      return;
    }
  } catch {
    // Keep the dismissal in this history entry as a last browser fallback.
  }

  try {
    const nextState = history.state && typeof history.state === "object"
      ? { ...history.state }
      : {};
    nextState[ONBOARDING_STORAGE_KEY] = true;
    history.replaceState(nextState, document.title);
  } catch {
    // In-memory state still prevents another opening during this page view.
  }
}

function updateOnboardingStep(nextStep) {
  const lastStep = elements.onboardingSteps.length - 1;
  state.onboardingStep = clamp(nextStep, 0, lastStep);

  elements.onboardingSteps.forEach((step, index) => {
    const isActive = index === state.onboardingStep;
    step.hidden = !isActive;
    step.classList.toggle("is-active", isActive);
  });

  elements.onboardingDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === state.onboardingStep);
  });

  elements.onboardingProgress.textContent = t("onboarding.progress", {
    current: state.onboardingStep + 1,
    total: elements.onboardingSteps.length,
  });
  elements.onboardingBack.disabled = state.onboardingStep === 0;
  elements.skipOnboarding.hidden = state.onboardingStep === lastStep;
  elements.onboardingNext.textContent = state.onboardingStep === lastStep
    ? t("onboarding.start")
    : t("onboarding.next");
}

function openOnboarding() {
  if (state.onboardingOpenTimer) {
    window.clearTimeout(state.onboardingOpenTimer);
    state.onboardingOpenTimer = null;
  }

  updateOnboardingStep(0);
  if (elements.onboardingDialog.open) return;

  if (typeof elements.onboardingDialog.showModal === "function") {
    elements.onboardingDialog.showModal();
  } else {
    elements.onboardingDialog.setAttribute("open", "");
    elements.onboardingDialog.classList.add("is-fallback");
  }

  document.body.classList.add("onboarding-open");
  window.setTimeout(() => elements.onboardingNext.focus(), 0);
}

function closeOnboarding() {
  rememberOnboarding();

  if (typeof elements.onboardingDialog.close === "function") {
    elements.onboardingDialog.close();
  } else {
    elements.onboardingDialog.removeAttribute("open");
    elements.onboardingDialog.classList.remove("is-fallback");
    document.body.classList.remove("onboarding-open");
  }
}

function initOnboarding() {
  updateOnboardingStep(0);
  if (hasSeenOnboarding()) return;

  state.onboardingOpenTimer = window.setTimeout(() => {
    state.onboardingOpenTimer = null;
    openOnboarding();
  }, 360);
}

function buildSimplificationPrompt() {
  const width = Number(elements.sizeSelect.value || DEFAULT_GRID_WIDTH);
  const colorCount = Number(elements.colorCount.value || DEFAULT_COLOR_COUNT);

  if (state.locale === "en") {
    return [
      "Use the attached photograph as the only visual reference.",
      "",
      "Transform it into a clean, simplified pixel-art illustration prepared for conversion into a cross-stitch pattern.",
      "",
      "Requirements:",
      `- use a working resolution of exactly ${width} square pixels (cells) wide; calculate the height proportionally from the source photo;`,
      `- use no more than ${colorCount} clearly distinguishable solid colors;`,
      "- preserve the recognizable silhouette, pose, composition, and defining features; do not crop the main subject;",
      "- merge fine details, noise, and texture into large, readable color regions;",
      "- every pixel must be perfectly square, equal in size, and contain exactly one color;",
      "- use hard edges with no blur, transparency, gradients, antialiasing, or dithering;",
      "- do not add a grid, symbols, labels, text, a frame, fabric texture, crosses, or stitched thread;",
      "- do not change the subject or invent details that are not present in the photo;",
      "- simplify the background into a few large color regions or one flat color if it is not important;",
      "- output only the finished PNG image. For display, enlarge it only by an integer factor with nearest-neighbor scaling so pixel edges remain crisp.",
      "",
      "The result should look like clean pixel art / color blocking and be suitable for upload to the Stitchloom pattern generator.",
    ].join("\n");
  }

  return [
    "Используй прикреплённую фотографию как единственный визуальный источник.",
    "",
    "Преобразуй её в аккуратную упрощённую пиксельную иллюстрацию, подготовленную для последующего создания схемы вышивки крестиком.",
    "",
    "Требования:",
    `- рабочее разрешение — ровно ${width} квадратных пикселей (клеток) по ширине; высоту рассчитай пропорционально исходной фотографии;`,
    `- используй не более ${colorCount} чётко различимых сплошных цветов;`,
    "- сохрани узнаваемый силуэт, позу, композицию и главные черты объекта; не обрезай главный объект;",
    "- объедини мелкие детали, шум и текстуры в крупные понятные цветовые области;",
    "- каждый пиксель должен быть строго квадратным, одинакового размера и иметь только один цвет;",
    "- используй жёсткие границы без размытия, полупрозрачности, градиентов, сглаживания и дизеринга;",
    "- не добавляй сетку, символы, подписи, текст, рамку, эффект ткани, крестики или вышитые нити;",
    "- не меняй объект и не придумывай детали, которых нет на фотографии;",
    "- фон упрости до нескольких больших цветовых областей или одного ровного цвета, если он не важен;",
    "- выведи только готовое изображение в PNG. Для показа можешь увеличить его только целым коэффициентом методом nearest-neighbor, чтобы границы пикселей оставались резкими.",
    "",
    "Результат должен выглядеть как чистый pixel art / color blocking и быть пригодным для загрузки в генератор схемы Stitchloom.",
  ].join("\n");
}

function updateAiPrompt() {
  const width = Number(elements.sizeSelect.value || DEFAULT_GRID_WIDTH);
  const colorCount = Number(elements.colorCount.value || DEFAULT_COLOR_COUNT);
  elements.aiPromptTarget.textContent = t("ai.target", { width, colors: colorCount });
  elements.aiPromptText.value = buildSimplificationPrompt();
}

function resetPromptCopyState() {
  elements.copyAiPrompt.classList.remove("is-copied");
  elements.copyAiPromptLabel.textContent = t("ai.copy");
  elements.aiPromptStatus.textContent = "";
  elements.aiPromptStatus.classList.remove("is-error");
  state.copyResetTimer = null;
}

async function copySimplificationPrompt() {
  const prompt = elements.aiPromptText.value.trim() || buildSimplificationPrompt();
  elements.aiPromptText.value = prompt;
  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(prompt);
      copied = true;
    }
  } catch {
    copied = false;
  }

  if (!copied) {
    try {
      elements.aiPromptDetails.open = true;
      elements.aiPromptText.focus();
      elements.aiPromptText.select();
      elements.aiPromptText.setSelectionRange(0, prompt.length);
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
  }

  if (state.copyResetTimer) window.clearTimeout(state.copyResetTimer);
  elements.copyAiPrompt.classList.toggle("is-copied", copied);
  elements.aiPromptStatus.classList.toggle("is-error", !copied);

  if (copied) {
    elements.copyAiPromptLabel.textContent = t("ai.copied");
    elements.aiPromptStatus.textContent = t("ai.copiedStatus");
    state.copyResetTimer = window.setTimeout(resetPromptCopyState, 3600);
  } else {
    elements.copyAiPromptLabel.textContent = t("ai.select");
    elements.aiPromptStatus.textContent = t("ai.manualStatus");
  }
}

function updateControls() {
  const width = Number(elements.sizeSelect.value || DEFAULT_GRID_WIDTH);
  const colorCount = clamp(
    Math.round(Number(elements.colorCount.value) || DEFAULT_COLOR_COUNT),
    2,
    256,
  );
  elements.colorCount.value = String(colorCount);
  elements.colorNumber.value = String(colorCount);
  elements.sizeValue.textContent = width + " " + formatUnit(width, "cell");
  elements.colorCountValue.textContent = String(colorCount);
  elements.colorPresets.forEach((button) => {
    const isActive = Number(button.dataset.colorPreset) === colorCount;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (colorCount <= 8) {
    elements.colorGuidance.textContent = t("guidance.low");
  } else if (colorCount <= 32) {
    elements.colorGuidance.textContent = t("guidance.balanced", { colors: colorCount });
  } else if (colorCount <= 64) {
    elements.colorGuidance.textContent = t("guidance.detailed");
  } else {
    elements.colorGuidance.textContent = t("guidance.high");
  }
  updateAiPrompt();
}

function setColorCount(value, shouldBuild = true) {
  const nextValue = clamp(Math.round(Number(value) || DEFAULT_COLOR_COUNT), 2, 256);
  elements.colorCount.value = String(nextValue);
  elements.colorNumber.value = String(nextValue);
  if (!state.settings.symbolPreferenceTouched) {
    state.settings.showSymbols = nextValue <= 64;
    elements.showSymbols.checked = state.settings.showSymbols;
  }
  updateControls();
  if (shouldBuild && state.image) schedulePatternBuild();
}

function formatPaletteSummary(paletteLength, requestedColors) {
  if (paletteLength === requestedColors) {
    return `${paletteLength} ${formatUnit(paletteLength, "color")}`;
  }

  return state.locale === "en"
    ? `${paletteLength} of ${requestedColors} colors`
    : `${paletteLength} из ${requestedColors} цветов`;
}

function schedulePatternBuild(delay = 220) {
  if (state.rebuildTimer) window.clearTimeout(state.rebuildTimer);
  state.buildRevision += 1;

  if (!state.image) {
    setAutoUpdateStatus(t("auto.noPhoto"));
    return;
  }

  const revision = state.buildRevision;
  setPatternStatus(t("pattern.updatingStatus"), "busy");
  elements.patternHeading.textContent = state.pattern
    ? t("pattern.updatingHeading")
    : t("pattern.buildingHeading");
  setAutoUpdateStatus(t("auto.updating"), "busy");
  state.rebuildTimer = window.setTimeout(() => {
    state.rebuildTimer = null;
    if (revision !== state.buildRevision) return;
    buildPattern(revision);
  }, delay);
}

function updateZoomControls() {
  const hasPattern = Boolean(state.pattern);
  const zoom = state.settings.zoom;
  elements.zoomValue.textContent = zoom + "%";
  elements.zoomReset.setAttribute(
    "aria-label",
    t("zoom.current", { zoom }),
  );
  elements.zoomOut.disabled = !hasPattern || zoom <= MIN_ZOOM;
  elements.zoomReset.disabled = !hasPattern;
  elements.zoomIn.disabled = !hasPattern || zoom >= MAX_ZOOM;
  elements.canvasShell.classList.toggle("is-pannable", hasPattern && zoom > 100);
}

function applyCanvasZoom() {
  if (!state.pattern || !elements.canvasShell.clientWidth) return;

  const shellStyle = window.getComputedStyle(elements.canvasShell);
  const horizontalPadding =
    (Number.parseFloat(shellStyle.paddingLeft) || 0) +
    (Number.parseFloat(shellStyle.paddingRight) || 0);
  const availableWidth = Math.max(1, elements.canvasShell.clientWidth - horizontalPadding);
  const scale = state.settings.zoom / 100;
  const displayWidth = Math.max(1, Math.round(availableWidth * scale));
  const aspectRatio = elements.patternCanvas.width / elements.patternCanvas.height;

  elements.patternCanvas.style.width = displayWidth + "px";
  elements.patternCanvas.style.height = Math.max(1, Math.round(displayWidth / aspectRatio)) + "px";
}

function setZoom(nextZoom, anchor) {
  if (!state.pattern) return;

  const zoom = clamp(Math.round(nextZoom / ZOOM_STEP) * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
  if (zoom === state.settings.zoom) return;

  const shell = elements.canvasShell;
  const bounds = shell.getBoundingClientRect();
  const anchorX = anchor ? anchor.clientX - bounds.left : shell.clientWidth / 2;
  const anchorY = anchor ? anchor.clientY - bounds.top : shell.clientHeight / 2;
  const relativeX = (shell.scrollLeft + anchorX) / Math.max(shell.scrollWidth, 1);
  const relativeY = (shell.scrollTop + anchorY) / Math.max(shell.scrollHeight, 1);

  state.settings.zoom = zoom;
  applyCanvasZoom();
  updateZoomControls();

  window.requestAnimationFrame(() => {
    shell.scrollLeft = relativeX * shell.scrollWidth - anchorX;
    shell.scrollTop = relativeY * shell.scrollHeight - anchorY;
  });
}

function getRgbDistance(colorA, colorB) {
  const red = colorA.r - colorB.r;
  const green = colorA.g - colorB.g;
  const blue = colorA.b - colorB.b;
  return red * red * 0.28 + green * green * 0.62 + blue * blue * 0.1;
}

function nearestColorIndex(color, palette) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  palette.forEach((candidate, index) => {
    const distance = getRgbDistance(color, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function getContrastColor(color) {
  const luminance = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return luminance > 156 ? "#1f2525" : "#fffaf1";
}

function colorToHex(color) {
  return "#" + [color.r, color.g, color.b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function symbolForIndex(index) {
  if (index < SYMBOLS.length) return SYMBOLS[index];
  const base = SYMBOL_CODE_ALPHABET.length;
  const codeIndex = index - SYMBOLS.length;
  if (codeIndex < base) return SYMBOL_CODE_ALPHABET[codeIndex];
  const pairIndex = codeIndex - base;
  return SYMBOL_CODE_ALPHABET[Math.floor(pairIndex / base)] +
    SYMBOL_CODE_ALPHABET[pairIndex % base];
}

function dedupeColors(colors) {
  const seen = new Set();
  return colors.filter((color) => {
    const key = `${color.r},${color.g},${color.b}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createSampleCanvas(image, width, height, scale) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = width * scale;
  sampleCanvas.height = height * scale;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, sampleCanvas.width, sampleCanvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
  return sampleCanvas;
}

function getCellColors(sampleCanvas, width, height, scale) {
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const colors = [];
  const sampleArea = scale * scale;

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let y = 0; y < scale; y += 1) {
        for (let x = 0; x < scale; x += 1) {
          const pixelIndex = ((row * scale + y) * sampleCanvas.width + column * scale + x) * 4;
          red += pixels[pixelIndex];
          green += pixels[pixelIndex + 1];
          blue += pixels[pixelIndex + 2];
        }
      }

      colors.push({
        r: Math.round(red / sampleArea),
        g: Math.round(green / sampleArea),
        b: Math.round(blue / sampleArea),
      });
    }
  }

  return colors;
}

function getColorBounds(indices, colors) {
  const bounds = {
    r: { min: 255, max: 0 },
    g: { min: 255, max: 0 },
    b: { min: 255, max: 0 },
  };

  indices.forEach((index) => {
    const color = colors[index];
    bounds.r.min = Math.min(bounds.r.min, color.r);
    bounds.r.max = Math.max(bounds.r.max, color.r);
    bounds.g.min = Math.min(bounds.g.min, color.g);
    bounds.g.max = Math.max(bounds.g.max, color.g);
    bounds.b.min = Math.min(bounds.b.min, color.b);
    bounds.b.max = Math.max(bounds.b.max, color.b);
  });

  return bounds;
}

function medianCut(colors, requestedCount) {
  const target = clamp(requestedCount, 2, 256);
  const boxes = [colors.map((_, index) => index)];
  const channels = ["r", "g", "b"];

  while (boxes.length < target) {
    let splitIndex = -1;
    let splitChannel = "r";
    let splitScore = -1;

    boxes.forEach((box, index) => {
      if (box.length < 2) return;
      const bounds = getColorBounds(box, colors);
      const ranges = channels.map((channel) => bounds[channel].max - bounds[channel].min);
      const largestRange = Math.max(...ranges);
      const channelIndex = ranges.indexOf(largestRange);
      const score = largestRange * Math.log2(box.length + 1);
      if (score > splitScore) {
        splitIndex = index;
        splitChannel = channels[channelIndex];
        splitScore = score;
      }
    });

    if (splitIndex === -1) break;
    const box = boxes.splice(splitIndex, 1)[0];
    box.sort((a, b) => colors[a][splitChannel] - colors[b][splitChannel]);
    const midpoint = Math.floor(box.length / 2);
    boxes.push(box.slice(0, midpoint), box.slice(midpoint));
  }

  return boxes.map((box) => {
    const sum = box.reduce((result, index) => {
      result.r += colors[index].r;
      result.g += colors[index].g;
      result.b += colors[index].b;
      return result;
    }, { r: 0, g: 0, b: 0 });

    return {
      r: Math.round(sum.r / box.length),
      g: Math.round(sum.g / box.length),
      b: Math.round(sum.b / box.length),
    };
  });
}

function buildPattern(revision = state.buildRevision) {
  if (!state.image) return;
  if (revision !== state.buildRevision) return;

  setPatternStatus(t("pattern.buildingStatus"), "busy");
  elements.patternHeading.textContent = t("pattern.buildingHeading");

  const width = Number(elements.sizeSelect.value);
  const sourceWidth = state.image.naturalWidth || state.image.width;
  const sourceHeight = state.image.naturalHeight || state.image.height;
  const aspectRatio = sourceWidth / sourceHeight;
  const height = clamp(Math.round(width / aspectRatio), 16, 220);
  const sampleScale = 4;
  const sampleCanvas = createSampleCanvas(state.image, width, height, sampleScale);
  const rawColors = getCellColors(sampleCanvas, width, height, sampleScale);
  const requestedColors = Number(elements.colorCount.value);
  const quantizedColors = dedupeColors(medianCut(rawColors, requestedColors));
  const localCells = rawColors.map((color) => nearestColorIndex(color, quantizedColors));
  const localCounts = new Array(quantizedColors.length).fill(0);

  localCells.forEach((index) => {
    localCounts[index] += 1;
  });

  const ordered = quantizedColors
    .map((color, index) => ({ color, index, count: localCounts[index] }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const remap = new Map();

  ordered.forEach((item, index) => {
    remap.set(item.index, index);
  });

  const cells = localCells.map((index) => remap.get(index));
  const legend = ordered.map((item, index) => {
    const dmc = DMC_PALETTE[nearestColorIndex(item.color, DMC_PALETTE)];
    return {
      ...item.color,
      hex: colorToHex(item.color),
      code: "C" + String(index + 1).padStart(3, "0"),
      dmcCode: dmc.code,
      dmcName: dmc.name,
      count: item.count,
      symbol: symbolForIndex(index),
    };
  });

  state.pattern = {
    width,
    height,
    cells,
    palette: legend,
    requestedColors,
    totalStitches: width * height,
  };

  renderPattern();
  setPatternStatus(t("pattern.readyStatus"), "ready");
  elements.patternHeading.textContent = t("pattern.readyHeading");
  const paletteSummary = formatPaletteSummary(legend.length, requestedColors);
  setAutoUpdateStatus(t("auto.ready", { width, height, palette: paletteSummary }), "ready");
  setFileStatus(t("file.patternReady"));
  updateMobileResultBar();
}

function prepareCanvas(canvas, width, height, pixelRatio) {
  const ratio = pixelRatio || Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(width * ratio));
  canvas.height = Math.max(1, Math.floor(height * ratio));
  canvas.style.aspectRatio = width + " / " + height;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function drawPatternToCanvas(canvas, cellSize, mode, pixelRatio) {
  if (!state.pattern) return;

  const pattern = state.pattern;
  const canvasWidth = pattern.width * cellSize;
  const canvasHeight = pattern.height * cellSize;
  const context = prepareCanvas(canvas, canvasWidth, canvasHeight, pixelRatio);

  if (mode === "photo") {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(state.image, 0, 0, canvasWidth, canvasHeight);
    context.fillStyle = "rgba(20, 24, 25, 0.08)";
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.strokeStyle = "rgba(255, 250, 241, 0.82)";
    context.lineWidth = 2;
    context.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);
    return;
  }

  context.imageSmoothingEnabled = false;
  pattern.cells.forEach((paletteIndex, index) => {
    const x = (index % pattern.width) * cellSize;
    const y = Math.floor(index / pattern.width) * cellSize;
    const color = pattern.palette[paletteIndex];
    context.fillStyle = color.hex;
    context.fillRect(x, y, cellSize, cellSize);
  });

  if (state.settings.showGrid) {
    context.beginPath();
    context.strokeStyle = cellSize >= 12 ? "rgba(31, 37, 37, 0.34)" : "rgba(31, 37, 37, 0.22)";
    context.lineWidth = cellSize >= 12 ? 0.65 : 0.4;
    for (let x = 0; x <= pattern.width; x += 1) {
      context.moveTo(x * cellSize + 0.5, 0);
      context.lineTo(x * cellSize + 0.5, canvasHeight);
    }
    for (let y = 0; y <= pattern.height; y += 1) {
      context.moveTo(0, y * cellSize + 0.5);
      context.lineTo(canvasWidth, y * cellSize + 0.5);
    }
    context.stroke();
  }

  if (state.settings.showSymbols) {
    const fontSize = clamp(Math.round(cellSize * 0.6), 7, 16);
    context.font = "700 " + fontSize + "px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    pattern.cells.forEach((paletteIndex, index) => {
      const x = (index % pattern.width) * cellSize + cellSize / 2;
      const y = Math.floor(index / pattern.width) * cellSize + cellSize / 2 + 0.5;
      const color = pattern.palette[paletteIndex];
      context.fillStyle = getContrastColor(color);
      context.fillText(color.symbol, x, y);
    });
  }

  context.strokeStyle = "rgba(31, 37, 37, 0.58)";
  context.lineWidth = 1.5;
  context.strokeRect(0.75, 0.75, canvasWidth - 1.5, canvasHeight - 1.5);
}

function getLocalizedDmcName(color) {
  if (color.dmcName && typeof color.dmcName === "object") {
    return color.dmcName[state.locale] || color.dmcName.ru || "";
  }
  return color.dmcName || "";
}

function renderLegend() {
  if (!state.pattern) {
    elements.legendList.innerHTML = "";
    elements.legendCount.textContent = "0 " + formatUnit(0, "color");
    return;
  }

  const palette = state.pattern.palette;
  const requestedColors = state.pattern.requestedColors || palette.length;
  elements.legendCount.textContent = formatPaletteSummary(palette.length, requestedColors);
  elements.legendList.innerHTML = palette.map((color) => {
    const colorDescription = `${color.hex.toUpperCase()} · ≈ DMC ${color.dmcCode} ${getLocalizedDmcName(color)}`;
    return (
      '<div class="legend-row" title="' + escapeHtml(colorDescription) + '">' +
        '<span class="legend-swatch" style="background:' + color.hex + '" aria-hidden="true"></span>' +
        '<span class="legend-symbol">' + escapeHtml(color.symbol) + "</span>" +
        '<span class="legend-code">' + escapeHtml(color.code) + "</span>" +
        '<span class="legend-name">' + escapeHtml(colorDescription) + "</span>" +
        '<span class="legend-count" title="' + escapeHtml(t("legend.stitches")) + '">' + formatNumber(color.count) + "</span>" +
      "</div>"
    );
  }).join("");
}

function updateMobileResultBar() {
  const hasPattern = Boolean(state.pattern);
  const shouldShow = hasPattern && !state.patternInView;
  elements.mobileResultBar.classList.toggle("is-hidden", !shouldShow);
  if (!hasPattern) return;

  const paletteLength = state.pattern.palette.length;
  elements.mobileResultSummary.textContent =
    `${state.pattern.width} × ${state.pattern.height} · ${paletteLength} ${formatUnit(paletteLength, "color")}`;
}

function renderPattern() {
  const hasPattern = Boolean(state.pattern);
  elements.emptyState.classList.toggle("is-hidden", hasPattern);
  elements.patternResult.classList.toggle("is-hidden", !hasPattern);
  elements.patternToolbar.classList.toggle("is-hidden", !hasPattern);
  elements.downloadPdf.disabled = !hasPattern || elements.downloadPdf.classList.contains("is-busy");
  elements.downloadPng.disabled = !hasPattern;
  elements.downloadCsv.disabled = !hasPattern;
  updateZoomControls();

  if (!hasPattern) {
    elements.patternHeading.textContent = t("pattern.emptyHeading");
    updateMobileResultBar();
    return;
  }

  const pattern = state.pattern;
  const cellCount = pattern.width * pattern.height;
  elements.patternDimension.textContent = pattern.width + " × " + pattern.height + " " + formatUnit(pattern.height, "cell");
  const paletteText = formatPaletteSummary(pattern.palette.length, pattern.requestedColors);
  elements.patternDetails.textContent =
    paletteText +
    " · " + formatNumber(cellCount) + " " + formatUnit(cellCount, "stitch");

  const displaySize = clamp(Math.floor(900 / Math.max(pattern.width, pattern.height)), 7, 20);
  drawPatternToCanvas(elements.patternCanvas, displaySize, state.settings.view);
  applyCanvasZoom();
  renderLegend();
  updateMobileResultBar();
}

function updateViewButtons() {
  elements.viewButtons.forEach((button) => {
    const isActive = button.dataset.view === state.settings.view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function refreshLocalizedUi() {
  applyTheme(state.themePreference);
  updateControls();
  updateOnboardingStep(state.onboardingStep);
  updateViewButtons();
  renderPattern();

  if (state.image) {
    const sourceWidth = state.image.naturalWidth || state.image.width;
    const sourceHeight = state.image.naturalHeight || state.image.height;
    elements.fileMeta.textContent =
      `${sourceWidth} × ${sourceHeight} px · ${formatBytes(state.fileSize)}`;
  }

  if (state.image && state.rebuildTimer) {
    setPatternStatus(t("pattern.updatingStatus"), "busy");
    elements.patternHeading.textContent = state.pattern
      ? t("pattern.updatingHeading")
      : t("pattern.buildingHeading");
    setAutoUpdateStatus(t("auto.updating"), "busy");
    setFileStatus(t("file.ready"));
  } else if (state.pattern) {
    const pattern = state.pattern;
    const paletteSummary = formatPaletteSummary(
      pattern.palette.length,
      pattern.requestedColors,
    );
    setPatternStatus(t("pattern.readyStatus"), "ready");
    elements.patternHeading.textContent = t("pattern.readyHeading");
    setAutoUpdateStatus(t("auto.ready", {
      width: pattern.width,
      height: pattern.height,
      palette: paletteSummary,
    }), "ready");
    setFileStatus(t("file.patternReady"));
  } else if (state.image) {
    setPatternStatus(t("pattern.buildingStatus"), "busy");
    elements.patternHeading.textContent = t("pattern.buildingHeading");
    setAutoUpdateStatus(t("auto.updating"), "busy");
    setFileStatus(t("file.ready"));
  } else {
    setPatternStatus(t("pattern.waiting"));
    elements.patternHeading.textContent = t("pattern.emptyHeading");
    setAutoUpdateStatus(t("auto.noPhoto"));
    setFileStatus(t("file.local"));
  }

  elements.downloadPdfLabel.textContent = elements.downloadPdf.classList.contains("is-busy")
    ? t("pdf.preparing")
    : t("pdf.download");

  const retryLink = elements.exportStatus.querySelector("a");
  if (retryLink && state.lastDownloadUrl) {
    const filename = retryLink.download;
    elements.exportStatus.textContent = t("pdf.ready");
    const localizedRetryLink = document.createElement("a");
    localizedRetryLink.href = state.lastDownloadUrl;
    localizedRetryLink.download = filename;
    localizedRetryLink.target = "_blank";
    localizedRetryLink.rel = "noopener";
    localizedRetryLink.textContent = t("pdf.retry");
    elements.exportStatus.appendChild(localizedRetryLink);
  }

  if (state.copyResetTimer) window.clearTimeout(state.copyResetTimer);
  resetPromptCopyState();
}

function clearImage() {
  if (state.rebuildTimer) window.clearTimeout(state.rebuildTimer);
  state.rebuildTimer = null;
  state.buildRevision += 1;
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.image = null;
  state.objectUrl = null;
  state.fileName = "";
  state.fileSize = 0;
  state.pattern = null;
  state.settings.zoom = 100;
  clearLastDownloadUrl();
  elements.fileInput.value = "";
  elements.sourcePreview.removeAttribute("src");
  elements.sourceCard.classList.add("is-hidden");
  elements.dropzone.classList.remove("is-hidden");
  setAutoUpdateStatus(t("auto.noPhoto"));
  setFileStatus(t("file.local"));
  setPatternStatus(t("pattern.waiting"));
  setExportStatus("");
  renderPattern();
}

function loadImageFile(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith("image/")) {
    setFileStatus(t("file.invalid"), true);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setFileStatus(t("file.tooLarge"), true);
    return;
  }

  if (state.rebuildTimer) window.clearTimeout(state.rebuildTimer);
  state.rebuildTimer = null;
  state.buildRevision += 1;

  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    state.image = image;
    state.objectUrl = objectUrl;
    state.fileName = file.name;
    state.fileSize = file.size;
    elements.sourcePreview.src = objectUrl;
    elements.fileName.textContent = file.name;
    elements.fileMeta.textContent =
      image.naturalWidth + " × " + image.naturalHeight + " px · " + formatBytes(file.size);
    elements.sourceCard.classList.remove("is-hidden");
    elements.dropzone.classList.add("is-hidden");
    setFileStatus(t("file.ready"));
    schedulePatternBuild(60);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    setFileStatus(t("file.openFailed"), true);
  };
  image.src = objectUrl;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function clearLastDownloadUrl() {
  if (!state.lastDownloadUrl) return;
  URL.revokeObjectURL(state.lastDownloadUrl);
  state.lastDownloadUrl = null;
}

function offerPdfDownload(blob, filename) {
  clearLastDownloadUrl();
  const url = URL.createObjectURL(blob);
  state.lastDownloadUrl = url;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  elements.exportStatus.classList.remove("is-error");
  elements.exportStatus.textContent = t("pdf.ready");
  const retryLink = document.createElement("a");
  retryLink.href = url;
  retryLink.download = filename;
  retryLink.target = "_blank";
  retryLink.rel = "noopener";
  retryLink.textContent = t("pdf.retry");
  elements.exportStatus.appendChild(retryLink);
}

function nextPaint() {
  return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

function blobToBytes(blob) {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error || new Error(t("pdf.readFailed")));
    reader.readAsArrayBuffer(blob);
  });
}

function canvasToJpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error(t("pdf.pageFailed")));
        return;
      }
      try {
        resolve(await blobToBytes(blob));
      } catch (error) {
        reject(error);
      }
    }, "image/jpeg", 0.92);
  });
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function fitCanvasText(context, text, maxWidth) {
  const value = String(text);
  if (context.measureText(value).width <= maxWidth) return value;
  let shortened = value;
  while (shortened.length > 1 && context.measureText(shortened + "…").width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }
  return shortened + "…";
}

function getPdfLayout(pattern) {
  const landscape = pattern.width > pattern.height * 1.2;
  const page = landscape
    ? { width: 1754, height: 1240, widthPt: 841.89, heightPt: 595.28 }
    : { width: 1240, height: 1754, widthPt: 595.28, heightPt: 841.89 };
  const margin = 72;
  const headerHeight = 126;
  const footerHeight = 58;
  const axisSize = 42;
  const cellSize = 28;
  const columnsPerPage = Math.max(
    1,
    Math.floor((page.width - margin * 2 - axisSize) / cellSize),
  );
  const rowsPerPage = Math.max(
    1,
    Math.floor((page.height - margin * 2 - headerHeight - footerHeight - axisSize) / cellSize),
  );
  const tileColumns = Math.ceil(pattern.width / columnsPerPage);
  const tileRows = Math.ceil(pattern.height / rowsPerPage);
  const tilePageCount = tileColumns * tileRows;
  const legendColumns = landscape ? 3 : 2;
  const legendRowHeight = 64;
  const legendTop = margin + 145;
  const legendRows = Math.max(
    1,
    Math.floor((page.height - legendTop - margin - footerHeight) / legendRowHeight),
  );
  const legendCapacity = legendColumns * legendRows;
  const legendPageCount = Math.ceil(pattern.palette.length / legendCapacity);

  return {
    page,
    margin,
    headerHeight,
    footerHeight,
    axisSize,
    cellSize,
    columnsPerPage,
    rowsPerPage,
    tileColumns,
    tileRows,
    tilePageCount,
    legendColumns,
    legendRows,
    legendRowHeight,
    legendTop,
    legendCapacity,
    legendPageCount,
    totalPages: 1 + tilePageCount + legendPageCount,
  };
}

function createPdfCanvas(layout) {
  const canvas = document.createElement("canvas");
  canvas.width = layout.page.width;
  canvas.height = layout.page.height;
  return canvas;
}

function drawPdfChrome(context, layout, pageNumber, section) {
  const { page, margin } = layout;
  context.fillStyle = "#fffaf1";
  context.fillRect(0, 0, page.width, page.height);
  context.fillStyle = "#141819";
  context.fillRect(0, 0, page.width, 16);

  context.fillStyle = "#141819";
  context.font = "800 20px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("STITCHLOOM", margin, 58);
  context.letterSpacing = "0px";
  context.fillStyle = "#6c706d";
  context.font = "700 15px Arial, sans-serif";
  context.textAlign = "right";
  context.fillText(section, page.width - margin, 58);

  const footerY = page.height - 42;
  context.strokeStyle = "rgba(20, 24, 25, 0.18)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(margin, footerY - 20);
  context.lineTo(page.width - margin, footerY - 20);
  context.stroke();
  context.fillStyle = "#6c706d";
  context.font = "600 13px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText(t("pdf.footerLocal"), margin, footerY);
  context.textAlign = "right";
  context.fillText(t("pdf.page", { page: pageNumber, total: layout.totalPages }), page.width - margin, footerY);
  context.textAlign = "left";
}

function drawPdfCover(context, layout, pattern, fileName) {
  const { page, margin } = layout;
  drawPdfChrome(context, layout, 1, t("pdf.overviewSection"));

  context.fillStyle = "#141819";
  context.font = "800 52px Arial, sans-serif";
  context.fillText(t("pdf.coverTitle"), margin, 148);
  context.fillStyle = "#5058bd";
  context.font = "italic 700 40px Georgia, serif";
  context.fillText(t("pdf.coverSubtitle"), margin, 198);

  context.fillStyle = "#6c706d";
  context.font = "600 16px Arial, sans-serif";
  context.fillText(
    fitCanvasText(context, fileName || t("pdf.imageDefault"), page.width - margin * 2),
    margin,
    238,
  );

  const cardGap = 16;
  const cardWidth = (page.width - margin * 2 - cardGap * 2) / 3;
  const cardY = 270;
  const cardValues = [
    { label: t("pdf.size"), value: pattern.width + " × " + pattern.height },
    { label: t("pdf.colors"), value: String(pattern.palette.length) },
    { label: t("pdf.stitches"), value: formatNumber(pattern.totalStitches) },
  ];

  cardValues.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);
    drawRoundedRect(context, x, cardY, cardWidth, 92, 13);
    context.fillStyle = index === 1 ? "#eef0ff" : "#f1e9dd";
    context.fill();
    context.fillStyle = "#6c706d";
    context.font = "800 12px Arial, sans-serif";
    context.fillText(card.label, x + 18, cardY + 27);
    context.fillStyle = "#141819";
    context.font = "800 27px Arial, sans-serif";
    context.fillText(card.value, x + 18, cardY + 65);
  });

  const previewX = margin;
  const previewY = 392;
  const previewWidth = page.width - margin * 2;
  const previewHeight = page.height - previewY - 150;
  drawRoundedRect(context, previewX, previewY, previewWidth, previewHeight, 14);
  context.fillStyle = "#e8dfd2";
  context.fill();

  const previewScale = Math.min(
    (previewWidth - 44) / pattern.width,
    (previewHeight - 44) / pattern.height,
  );
  const gridWidth = pattern.width * previewScale;
  const gridHeight = pattern.height * previewScale;
  const gridX = previewX + (previewWidth - gridWidth) / 2;
  const gridY = previewY + (previewHeight - gridHeight) / 2;

  pattern.cells.forEach((paletteIndex, index) => {
    const column = index % pattern.width;
    const row = Math.floor(index / pattern.width);
    context.fillStyle = pattern.palette[paletteIndex].hex;
    context.fillRect(
      gridX + column * previewScale,
      gridY + row * previewScale,
      Math.ceil(previewScale + 0.2),
      Math.ceil(previewScale + 0.2),
    );
  });
  context.strokeStyle = "rgba(20, 24, 25, 0.55)";
  context.lineWidth = 2;
  context.strokeRect(gridX, gridY, gridWidth, gridHeight);

  context.fillStyle = "#5058bd";
  context.font = "800 14px Arial, sans-serif";
  context.fillText(t("pdf.nextPages"), margin, page.height - 94);
}

function shouldLabelAxis(value, first, last) {
  return value === first || value === last || value % 5 === 0;
}

function drawPdfPatternTile(context, layout, pattern, tileColumn, tileRow, pageNumber) {
  const {
    page,
    margin,
    headerHeight,
    axisSize,
    cellSize,
    columnsPerPage,
    rowsPerPage,
    tileColumns,
    tileRows,
  } = layout;
  const columnStart = tileColumn * columnsPerPage;
  const rowStart = tileRow * rowsPerPage;
  const columnEnd = Math.min(pattern.width, columnStart + columnsPerPage);
  const rowEnd = Math.min(pattern.height, rowStart + rowsPerPage);
  const columnCount = columnEnd - columnStart;
  const rowCount = rowEnd - rowStart;
  const gridX = margin + axisSize;
  const gridY = margin + headerHeight + axisSize;
  const gridWidth = columnCount * cellSize;
  const gridHeight = rowCount * cellSize;

  drawPdfChrome(
    context,
    layout,
    pageNumber,
    t("pdf.gridSection", {
      current: tileRow * tileColumns + tileColumn + 1,
      total: tileColumns * tileRows,
    }),
  );
  context.fillStyle = "#141819";
  context.font = "800 31px Arial, sans-serif";
  context.fillText(t("pdf.gridTitle"), margin, margin + 61);
  context.fillStyle = "#6c706d";
  context.font = "600 15px Arial, sans-serif";
  context.fillText(
    t("pdf.gridRange", {
      columnStart: columnStart + 1,
      columnEnd,
      rowStart: rowStart + 1,
      rowEnd,
    }),
    margin,
    margin + 91,
  );

  for (let row = rowStart; row < rowEnd; row += 1) {
    for (let column = columnStart; column < columnEnd; column += 1) {
      const paletteIndex = pattern.cells[row * pattern.width + column];
      const color = pattern.palette[paletteIndex];
      const x = gridX + (column - columnStart) * cellSize;
      const y = gridY + (row - rowStart) * cellSize;
      context.fillStyle = color.hex;
      context.fillRect(x, y, cellSize, cellSize);
      context.fillStyle = getContrastColor(color);
      context.font = color.symbol.length > 1
        ? "800 10px Arial, sans-serif"
        : "800 15px Georgia, serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(color.symbol, x + cellSize / 2, y + cellSize / 2 + 0.5);
    }
  }

  context.textBaseline = "alphabetic";
  for (let index = 0; index <= columnCount; index += 1) {
    const globalBoundary = columnStart + index;
    const x = gridX + index * cellSize + 0.5;
    context.strokeStyle = globalBoundary % 10 === 0
      ? "rgba(20, 24, 25, 0.72)"
      : "rgba(20, 24, 25, 0.30)";
    context.lineWidth = globalBoundary % 10 === 0 ? 2 : 0.8;
    context.beginPath();
    context.moveTo(x, gridY);
    context.lineTo(x, gridY + gridHeight);
    context.stroke();
  }
  for (let index = 0; index <= rowCount; index += 1) {
    const globalBoundary = rowStart + index;
    const y = gridY + index * cellSize + 0.5;
    context.strokeStyle = globalBoundary % 10 === 0
      ? "rgba(20, 24, 25, 0.72)"
      : "rgba(20, 24, 25, 0.30)";
    context.lineWidth = globalBoundary % 10 === 0 ? 2 : 0.8;
    context.beginPath();
    context.moveTo(gridX, y);
    context.lineTo(gridX + gridWidth, y);
    context.stroke();
  }

  context.fillStyle = "#5058bd";
  context.font = "800 13px Arial, sans-serif";
  context.textAlign = "center";
  for (let column = columnStart; column < columnEnd; column += 1) {
    const humanColumn = column + 1;
    if (!shouldLabelAxis(humanColumn, columnStart + 1, columnEnd)) continue;
    const x = gridX + (column - columnStart + 0.5) * cellSize;
    context.fillText(String(humanColumn), x, gridY - 13);
  }
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let row = rowStart; row < rowEnd; row += 1) {
    const humanRow = row + 1;
    if (!shouldLabelAxis(humanRow, rowStart + 1, rowEnd)) continue;
    const y = gridY + (row - rowStart + 0.5) * cellSize;
    context.fillText(String(humanRow), gridX - 11, y);
  }
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  context.fillStyle = "#6c706d";
  context.font = "600 13px Arial, sans-serif";
  const noteX = Math.min(page.width - margin - 330, gridX + gridWidth + 24);
  if (noteX > gridX + gridWidth + 8) {
    context.fillText(t("pdf.thickLine"), noteX, gridY + 17);
  }
}

function drawPdfLegendPage(context, layout, pattern, legendPageIndex, pageNumber) {
  const {
    page,
    margin,
    legendColumns,
    legendRows,
    legendRowHeight,
    legendTop,
    legendCapacity,
    legendPageCount,
  } = layout;
  const gap = 18;
  const columnWidth = (page.width - margin * 2 - gap * (legendColumns - 1)) / legendColumns;
  const startIndex = legendPageIndex * legendCapacity;
  const endIndex = Math.min(pattern.palette.length, startIndex + legendCapacity);

  drawPdfChrome(
    context,
    layout,
    pageNumber,
    t("pdf.keySection", { current: legendPageIndex + 1, total: legendPageCount }),
  );
  context.fillStyle = "#141819";
  context.font = "800 31px Arial, sans-serif";
  context.fillText(t("pdf.legendTitle"), margin, margin + 61);
  context.fillStyle = "#6c706d";
  context.font = "600 15px Arial, sans-serif";
  context.fillText(t("pdf.legendNote"), margin, margin + 91);

  for (let paletteIndex = startIndex; paletteIndex < endIndex; paletteIndex += 1) {
    const localIndex = paletteIndex - startIndex;
    const column = Math.floor(localIndex / legendRows);
    const row = localIndex % legendRows;
    const x = margin + column * (columnWidth + gap);
    const y = legendTop + row * legendRowHeight;
    const color = pattern.palette[paletteIndex];

    drawRoundedRect(context, x, y, columnWidth, legendRowHeight - 8, 9);
    context.fillStyle = paletteIndex % 2 === 0 ? "#f3ece2" : "#f8f2e9";
    context.fill();

    context.fillStyle = color.hex;
    context.fillRect(x + 9, y + 9, 38, 38);
    context.strokeStyle = "rgba(20, 24, 25, 0.25)";
    context.lineWidth = 1;
    context.strokeRect(x + 9.5, y + 9.5, 37, 37);

    drawRoundedRect(context, x + 54, y + 9, 38, 38, 7);
    context.fillStyle = "#fffaf1";
    context.fill();
    context.strokeStyle = "rgba(20, 24, 25, 0.18)";
    context.stroke();
    context.fillStyle = "#141819";
    context.font = color.symbol.length > 1
      ? "800 11px Arial, sans-serif"
      : "800 18px Georgia, serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(color.symbol, x + 73, y + 28);

    const textX = x + 102;
    const countWidth = 58;
    const textWidth = columnWidth - 111 - countWidth;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillStyle = "#141819";
    context.font = "800 14px Arial, sans-serif";
    context.fillText(color.code + " · " + color.hex.toUpperCase(), textX, y + 22);
    context.fillStyle = "#6c706d";
    context.font = "600 12px Arial, sans-serif";
    context.fillText(
      fitCanvasText(context, "≈ DMC " + color.dmcCode + " · " + getLocalizedDmcName(color), textWidth),
      textX,
      y + 42,
    );
    context.fillStyle = "#5058bd";
    context.font = "800 12px Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(formatNumber(color.count), x + columnWidth - 10, y + 32);
    context.textAlign = "left";
  }
}

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function buildImagePdf(pages) {
  const objectCount = 2 + pages.length * 3;
  const offsets = new Array(objectCount + 1).fill(0);
  const chunks = [];
  let byteLength = 0;

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const pushAscii = (value) => pushBytes(asciiBytes(value));
  const startObject = (objectId) => {
    offsets[objectId] = byteLength;
    pushAscii(objectId + " 0 obj\n");
  };
  const endObject = () => pushAscii("endobj\n");

  pushAscii("%PDF-1.4\n");
  pushBytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  startObject(1);
  pushAscii("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObject();

  const pageReferences = pages.map((_, index) => (3 + index * 3) + " 0 R").join(" ");
  startObject(2);
  pushAscii("<< /Type /Pages /Count " + pages.length + " /Kids [" + pageReferences + "] >>\n");
  endObject();

  pages.forEach((page, index) => {
    const pageObjectId = 3 + index * 3;
    const imageObjectId = pageObjectId + 1;
    const contentObjectId = pageObjectId + 2;
    const widthPt = page.widthPt.toFixed(2);
    const heightPt = page.heightPt.toFixed(2);
    const content =
      "q\n" + widthPt + " 0 0 " + heightPt + " 0 0 cm\n/Im0 Do\nQ\n";
    const contentBytes = asciiBytes(content);

    startObject(pageObjectId);
    pushAscii(
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + widthPt + " " + heightPt + "] " +
      "/Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 " + imageObjectId + " 0 R >> >> " +
      "/Contents " + contentObjectId + " 0 R >>\n",
    );
    endObject();

    startObject(imageObjectId);
    pushAscii(
      "<< /Type /XObject /Subtype /Image /Width " + page.imageWidth +
      " /Height " + page.imageHeight +
      " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Interpolate false /Length " +
      page.jpeg.length + " >>\nstream\n",
    );
    pushBytes(page.jpeg);
    pushAscii("\nendstream\n");
    endObject();

    startObject(contentObjectId);
    pushAscii("<< /Length " + contentBytes.length + " >>\nstream\n");
    pushBytes(contentBytes);
    pushAscii("endstream\n");
    endObject();
  });

  const xrefOffset = byteLength;
  pushAscii("xref\n0 " + (objectCount + 1) + "\n");
  pushAscii("0000000000 65535 f \n");
  for (let objectId = 1; objectId <= objectCount; objectId += 1) {
    pushAscii(String(offsets[objectId]).padStart(10, "0") + " 00000 n \n");
  }
  pushAscii(
    "trailer\n<< /Size " + (objectCount + 1) + " /Root 1 0 R >>\n" +
    "startxref\n" + xrefOffset + "\n%%EOF\n",
  );

  const output = new Uint8Array(byteLength);
  let cursor = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, cursor);
    cursor += chunk.length;
  });
  return output;
}

async function appendPdfCanvasPage(pages, canvas, layout) {
  const jpeg = await canvasToJpegBytes(canvas);
  pages.push({
    jpeg,
    imageWidth: canvas.width,
    imageHeight: canvas.height,
    widthPt: layout.page.widthPt,
    heightPt: layout.page.heightPt,
  });
  canvas.width = 1;
  canvas.height = 1;
}

async function downloadPdf() {
  if (!state.pattern || elements.downloadPdf.classList.contains("is-busy")) return;
  const pattern = {
    ...state.pattern,
    cells: state.pattern.cells.slice(),
    palette: state.pattern.palette.map((color) => ({ ...color })),
  };
  const layout = getPdfLayout(pattern);
  const pages = [];
  let completedPages = 0;

  elements.downloadPdf.disabled = true;
  elements.downloadPdf.classList.add("is-busy");
  elements.downloadPdf.setAttribute("aria-busy", "true");
  elements.downloadPdfLabel.textContent = t("pdf.preparing");
  setExportStatus(t("pdf.pages", { current: 0, total: layout.totalPages }));
  await nextPaint();

  const addPage = async (drawPage) => {
    const canvas = createPdfCanvas(layout);
    const context = canvas.getContext("2d");
    drawPage(context);
    await appendPdfCanvasPage(pages, canvas, layout);
    completedPages += 1;
    setExportStatus(t("pdf.pages", { current: completedPages, total: layout.totalPages }));
    await nextPaint();
  };

  try {
    await addPage((context) => drawPdfCover(context, layout, pattern, state.fileName));

    for (let tileRow = 0; tileRow < layout.tileRows; tileRow += 1) {
      for (let tileColumn = 0; tileColumn < layout.tileColumns; tileColumn += 1) {
        const pageNumber = pages.length + 1;
        await addPage((context) => {
          drawPdfPatternTile(context, layout, pattern, tileColumn, tileRow, pageNumber);
        });
      }
    }

    for (let legendPageIndex = 0; legendPageIndex < layout.legendPageCount; legendPageIndex += 1) {
      const pageNumber = pages.length + 1;
      await addPage((context) => {
        drawPdfLegendPage(context, layout, pattern, legendPageIndex, pageNumber);
      });
    }

    setExportStatus(t("pdf.packing"));
    await nextPaint();
    const pdfBytes = buildImagePdf(pages);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const filename = "stitchloom-" + pattern.width + "x" + pattern.height + ".pdf";
    offerPdfDownload(blob, filename);
  } catch (error) {
    console.error(error);
    setExportStatus(t("pdf.failed"), true);
  } finally {
    elements.downloadPdf.classList.remove("is-busy");
    elements.downloadPdf.removeAttribute("aria-busy");
    elements.downloadPdfLabel.textContent = t("pdf.download");
    elements.downloadPdf.disabled = !state.pattern;
  }
}

function downloadPng() {
  if (!state.pattern) return;
  const pattern = state.pattern;
  const exportCellSize = clamp(Math.floor(1800 / Math.max(pattern.width, pattern.height)), 8, 20);
  const exportCanvas = document.createElement("canvas");
  drawPatternToCanvas(exportCanvas, exportCellSize, "pattern", 1);
  exportCanvas.toBlob((blob) => {
    if (blob) triggerDownload(blob, "stitchloom-" + pattern.width + "x" + pattern.height + ".png");
  }, "image/png");
}

function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function downloadCsv() {
  if (!state.pattern) return;
  const pattern = state.pattern;
  const rows = ["row;column;palette;color_hex;nearest_dmc;symbol"];
  pattern.cells.forEach((paletteIndex, index) => {
    const color = pattern.palette[paletteIndex];
    const row = Math.floor(index / pattern.width) + 1;
    const column = (index % pattern.width) + 1;
    rows.push([
      row,
      column,
      color.code,
      color.hex.toUpperCase(),
      "DMC " + color.dmcCode,
      color.symbol,
    ].map(csvCell).join(";"));
  });
  const blob = new Blob(["\ufeff" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, "stitchloom-" + pattern.width + "x" + pattern.height + ".csv");
}

elements.dropzone.addEventListener("click", () => elements.fileInput.click());
elements.dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.fileInput.click();
  }
});

elements.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  elements.dropzone.classList.add("is-dragging");
});

elements.dropzone.addEventListener("dragleave", () => {
  elements.dropzone.classList.remove("is-dragging");
});

elements.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  elements.dropzone.classList.remove("is-dragging");
  loadImageFile(event.dataTransfer.files[0]);
});

elements.fileInput.addEventListener("change", (event) => {
  loadImageFile(event.target.files[0]);
});

elements.removeImage.addEventListener("click", clearImage);
elements.sizeSelect.addEventListener("change", () => {
  updateControls();
  if (state.image) schedulePatternBuild();
});
elements.colorCount.addEventListener("input", (event) => {
  setColorCount(event.target.value);
});
elements.colorNumber.addEventListener("input", (event) => {
  if (event.target.value === "") return;
  const value = Number(event.target.value);
  if (Number.isFinite(value) && value >= 2 && value <= 256) setColorCount(value);
});
elements.colorNumber.addEventListener("change", (event) => {
  setColorCount(event.target.value);
});
elements.colorPresets.forEach((button) => {
  button.addEventListener("click", () => setColorCount(button.dataset.colorPreset));
});
elements.copyAiPrompt.addEventListener("click", copySimplificationPrompt);
elements.localeToggle.addEventListener("click", () => {
  applyLocale(state.locale === "ru" ? "en" : "ru", true);
});
document.addEventListener("keydown", () => {
  document.documentElement.dataset.inputModality = "keyboard";
}, true);
document.addEventListener("pointerdown", () => {
  document.documentElement.dataset.inputModality = "pointer";
}, true);
elements.themeChoices.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.themeChoice, true);
    elements.themePicker.open = false;
  });
});
elements.themePicker.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !elements.themePicker.open) return;
  event.preventDefault();
  elements.themePicker.open = false;
  elements.themePickerSummary.focus();
});
document.addEventListener("click", (event) => {
  if (elements.themePicker.open && !elements.themePicker.contains(event.target)) {
    elements.themePicker.open = false;
  }
});
elements.openOnboarding.addEventListener("click", openOnboarding);
elements.closeOnboarding.addEventListener("click", closeOnboarding);
elements.skipOnboarding.addEventListener("click", closeOnboarding);
elements.onboardingBack.addEventListener("click", () => {
  updateOnboardingStep(state.onboardingStep - 1);
});
elements.onboardingNext.addEventListener("click", () => {
  if (state.onboardingStep === elements.onboardingSteps.length - 1) {
    closeOnboarding();
    return;
  }
  updateOnboardingStep(state.onboardingStep + 1);
});
elements.onboardingDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeOnboarding();
});
elements.onboardingDialog.addEventListener("close", () => {
  document.body.classList.remove("onboarding-open");
});
elements.onboardingDialog.addEventListener("click", (event) => {
  if (event.target === elements.onboardingDialog) closeOnboarding();
});
elements.onboardingDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" && state.onboardingStep > 0) {
    event.preventDefault();
    updateOnboardingStep(state.onboardingStep - 1);
  } else if (
    event.key === "ArrowRight" &&
    state.onboardingStep < elements.onboardingSteps.length - 1
  ) {
    event.preventDefault();
    updateOnboardingStep(state.onboardingStep + 1);
  }
});
elements.showSymbols.addEventListener("change", () => {
  state.settings.showSymbols = elements.showSymbols.checked;
  state.settings.symbolPreferenceTouched = true;
  renderPattern();
});
elements.showGrid.addEventListener("change", () => {
  state.settings.showGrid = elements.showGrid.checked;
  renderPattern();
});
elements.zoomOut.addEventListener("click", () => setZoom(state.settings.zoom - ZOOM_STEP));
elements.zoomReset.addEventListener("click", () => setZoom(100));
elements.zoomIn.addEventListener("click", () => setZoom(state.settings.zoom + ZOOM_STEP));
elements.canvasShell.addEventListener("keydown", (event) => {
  if (!state.pattern) return;
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    setZoom(state.settings.zoom + ZOOM_STEP);
  } else if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    setZoom(state.settings.zoom - ZOOM_STEP);
  } else if (event.key === "0") {
    event.preventDefault();
    setZoom(100);
  }
});
elements.canvasShell.addEventListener("wheel", (event) => {
  if (!state.pattern || (!event.ctrlKey && !event.metaKey)) return;
  event.preventDefault();
  const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
  setZoom(state.settings.zoom + direction, event);
}, { passive: false });
elements.canvasShell.addEventListener("pointerdown", (event) => {
  if (!state.pattern || state.settings.zoom <= 100 || event.pointerType === "touch") return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  state.drag = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    scrollLeft: elements.canvasShell.scrollLeft,
    scrollTop: elements.canvasShell.scrollTop,
  };
  elements.canvasShell.setPointerCapture(event.pointerId);
  elements.canvasShell.classList.add("is-dragging");
  event.preventDefault();
});
elements.canvasShell.addEventListener("pointermove", (event) => {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  elements.canvasShell.scrollLeft = state.drag.scrollLeft - (event.clientX - state.drag.x);
  elements.canvasShell.scrollTop = state.drag.scrollTop - (event.clientY - state.drag.y);
});
function finishCanvasDrag(event) {
  if (!state.drag || state.drag.pointerId !== event.pointerId) return;
  state.drag = null;
  elements.canvasShell.classList.remove("is-dragging");
}
elements.canvasShell.addEventListener("pointerup", finishCanvasDrag);
elements.canvasShell.addEventListener("pointercancel", finishCanvasDrag);

function touchDistance(touches) {
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

elements.canvasShell.addEventListener("touchstart", (event) => {
  if (!state.pattern || event.touches.length !== 2) return;
  state.pinch = {
    distance: touchDistance(event.touches),
    zoom: state.settings.zoom,
  };
}, { passive: true });
elements.canvasShell.addEventListener("touchmove", (event) => {
  if (!state.pinch || event.touches.length !== 2) return;
  event.preventDefault();
  const midpoint = {
    clientX: (event.touches[0].clientX + event.touches[1].clientX) / 2,
    clientY: (event.touches[0].clientY + event.touches[1].clientY) / 2,
  };
  const nextZoom = state.pinch.zoom * touchDistance(event.touches) / Math.max(state.pinch.distance, 1);
  setZoom(nextZoom, midpoint);
}, { passive: false });
elements.canvasShell.addEventListener("touchend", (event) => {
  if (event.touches.length < 2) state.pinch = null;
});
elements.canvasShell.addEventListener("touchcancel", () => {
  state.pinch = null;
});
elements.viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.settings.view = button.dataset.view;
    updateViewButtons();
    renderPattern();
  });
});
elements.downloadPng.addEventListener("click", downloadPng);
elements.downloadCsv.addEventListener("click", downloadCsv);
elements.downloadPdf.addEventListener("click", downloadPdf);
elements.mobileResultBar.addEventListener("click", () => {
  elements.patternPanel.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
});
window.addEventListener("resize", () => {
  if (!state.pattern || state.resizeFrame) return;
  state.resizeFrame = window.requestAnimationFrame(() => {
    state.resizeFrame = null;
    renderPattern();
  });
});
window.addEventListener("beforeunload", clearLastDownloadUrl);

if ("IntersectionObserver" in window) {
  const patternObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    state.patternInView = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.12);
    updateMobileResultBar();
  }, { threshold: [0, 0.12, 0.5] });
  patternObserver.observe(elements.patternPanel);
}

initLocale();
initTheme();
updateControls();
updateViewButtons();
renderPattern();
setPatternStatus(t("pattern.waiting"));
setAutoUpdateStatus(t("auto.noPhoto"));
setFileStatus(t("file.local"));
initOnboarding();
