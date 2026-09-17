import {
  analyzePattern,
  cleanupConfetti,
  estimatePhysicalPattern,
  floodFillCells,
  nearestPaletteIndex,
  rebuildPaletteUsage,
  selectDmcPalette,
} from "./pattern-tools.js";
import {
  initVkMode,
  showVkInterstitialAfterExport,
  vkBridgeService,
  vkLaunchContext,
} from "./vk-bridge-service.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PROJECT_SIZE = 40 * 1024 * 1024;
const DEFAULT_GRID_WIDTH = 70;
const DEFAULT_COLOR_COUNT = 16;
const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;
const LOCALE_STORAGE_KEY = "stitchloom:locale:v1";
const SUPPORTED_LOCALES = ["ru", "en", "es", "de"];
const LOCALE_NUMBER_FORMATS = { ru: "ru-RU", en: "en-US", es: "es-ES", de: "de-DE" };
const LOCALE_MANIFESTS = {
  ru: "./manifest.webmanifest",
  en: "./manifest.en.webmanifest",
  es: "./manifest.es.webmanifest",
  de: "./manifest.de.webmanifest",
};
const LOCALE_OG_CODES = { ru: "ru_RU", en: "en_US", es: "es_ES", de: "de_DE" };
const LOCALE_NAMES = { ru: "Русский", en: "English", es: "Español", de: "Deutsch" };
const THEME_STORAGE_KEY = "stitchloom:theme:v1";
const ONBOARDING_STORAGE_KEY = "stitchloom:onboarding:v1";
const ONBOARDING_COOKIE_KEY = "stitchloom_onboarding_v1";
const PROJECT_DB_NAME = "stitchloom-projects";
const PROJECT_STORE_NAME = "autosave";
const PROJECT_AUTOSAVE_KEY = "latest";
const PROJECT_FORMAT_VERSION = 1;

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
  detailLevelButtons: Array.from(document.querySelectorAll("[data-detail-level]")),
  paletteMode: $("paletteMode"),
  fabricCount: $("fabricCount"),
  aiPromptTarget: $("aiPromptTarget"),
  aiPromptText: $("aiPromptText"),
  aiPromptDetails: $("aiPromptDetails"),
  copyAiPrompt: $("copyAiPrompt"),
  copyAiPromptLabel: $("copyAiPromptLabel"),
  aiPromptStatus: $("aiPromptStatus"),
  photoPrep: $("photoPrep"),
  cropZoom: $("cropZoom"),
  cropZoomValue: $("cropZoomValue"),
  cropX: $("cropX"),
  cropXValue: $("cropXValue"),
  cropY: $("cropY"),
  cropYValue: $("cropYValue"),
  brightness: $("brightness"),
  brightnessValue: $("brightnessValue"),
  contrast: $("contrast"),
  contrastValue: $("contrastValue"),
  saturation: $("saturation"),
  saturationValue: $("saturationValue"),
  soften: $("soften"),
  softenValue: $("softenValue"),
  rotatePhoto: $("rotatePhoto"),
  resetPhotoPrep: $("resetPhotoPrep"),
  projectInput: $("projectInput"),
  openProject: $("openProject"),
  saveProject: $("saveProject"),
  projectStatus: $("projectStatus"),
  appManifest: $("appManifest"),
  canonicalUrl: $("canonicalUrl"),
  ogLocale: $("ogLocale"),
  ogLocaleAlternate: $("ogLocaleAlternate"),
  ogLocaleAlternateSecondary: $("ogLocaleAlternateSecondary"),
  ogLocaleAlternateTertiary: $("ogLocaleAlternateTertiary"),
  ogUrl: $("ogUrl"),
  structuredData: $("structuredData"),
  localePicker: $("localePicker"),
  localePickerSummary: $("localePickerSummary"),
  localePickerLabel: $("localePickerLabel"),
  localeCurrentCode: $("localeCurrentCode"),
  localeChoices: Array.from(document.querySelectorAll("[data-locale-choice]")),
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
  editorToolButtons: Array.from(document.querySelectorAll("[data-editor-tool]")),
  editorColor: $("editorColor"),
  undoEdit: $("undoEdit"),
  redoEdit: $("redoEdit"),
  editorStatus: $("editorStatus"),
  stitchabilityScore: $("stitchabilityScore"),
  stitchabilityDetails: $("stitchabilityDetails"),
  finishedSize: $("finishedSize"),
  fabricSize: $("fabricSize"),
  materialsEstimate: $("materialsEstimate"),
  timeEstimate: $("timeEstimate"),
  legendCount: $("legendCount"),
  legendList: $("legendList"),
  downloadPdf: $("downloadPdf"),
  downloadPdfLabel: $("downloadPdfLabel"),
  downloadPng: $("downloadPng"),
  downloadCsv: $("downloadCsv"),
  downloadProject: $("downloadProject"),
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
  sourceDataUrl: "",
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
  autosaveTimer: null,
  autosaveRestored: false,
  editorTool: "none",
  activePaletteIndex: 0,
  undoStack: [],
  redoStack: [],
  locale: "ru",
  localeSource: "browser",
  themePreference: "auto",
  settings: {
    view: "pattern",
    showSymbols: true,
    symbolPreferenceTouched: false,
    showGrid: true,
    zoom: 100,
    detailLevel: "balanced",
    paletteMode: "adaptive",
    fabricCount: 14,
    photo: {
      cropZoom: 100,
      cropX: 0,
      cropY: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      soften: 0,
      rotation: 0,
    },
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
  "locale.groupLabel": "Choose a language",
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
  "prep.title": "Prepare the photo",
  "prep.summary": "crop · light · color",
  "prep.cropZoom": "Crop",
  "prep.cropX": "Horizontal position",
  "prep.cropY": "Vertical position",
  "prep.brightness": "Brightness",
  "prep.contrast": "Contrast",
  "prep.saturation": "Saturation",
  "prep.soften": "Soften details",
  "prep.rotate": "Rotate 90°",
  "prep.reset": "Reset",
  "project.group": "Project file",
  "project.open": "Open .stitchloom",
  "project.save": "Save project",
  "settings.stitchability": "Pattern character",
  "settings.stitchabilityLabel": "Confetti cleanup level",
  "settings.easy": "Easier to stitch",
  "settings.balanced": "Balanced",
  "settings.detail": "More detail",
  "settings.paletteMode": "Palette",
  "settings.paletteAdaptive": "Image colors",
  "settings.paletteDmc": "Real DMC colors only",
  "settings.fabric": "Fabric",
  "editor.group": "Pattern editing",
  "editor.tools": "Tool",
  "editor.pan": "View",
  "editor.pencil": "Pencil",
  "editor.fill": "Fill",
  "editor.eyedropper": "Eyedropper",
  "editor.color": "Color",
  "editor.colorLabel": "Editing color",
  "editor.undo": "Undo change",
  "editor.redo": "Redo change",
  "insights.score": "Stitchability",
  "insights.finishedSize": "Finished size",
  "insights.materials": "Materials and time",
  "result.downloadProject": "Download .stitchloom",
};

const ES_TRANSLATIONS = {
  "meta.title": "Stitchloom — patrón de punto de cruz desde una foto",
  "meta.description": "Convierte una foto en un patrón de punto de cruz directamente en tu navegador: celdas cuadradas, de 2 a 256 colores y exportación a PDF, PNG o CSV.",
  "meta.ogTitle": "Stitchloom — de foto a patrón de punto de cruz",
  "meta.ogDescription": "Celdas cuadradas, una paleta de 2 a 256 colores y exportación a PDF, todo procesado en tu navegador.",
  "meta.twitterDescription": "Crea un patrón de punto de cruz desde una foto directamente en tu navegador.",
  "meta.imageAlt": "Stitchloom convierte una foto en un patrón de puntadas cuadradas",
  "brand.home": "Stitchloom, inicio",
  "privacy.full": "TU FOTO PERMANECE EN ESTE DISPOSITIVO",
  "privacy.short": "LOCAL",
  "locale.groupLabel": "Elegir idioma",
  "theme.groupLabel": "Elegir el tema de la interfaz",
  "theme.auto": "Automático",
  "theme.autoHint": "Usar el tema del sistema",
  "theme.light": "Claro",
  "theme.lightHint": "Siempre claro",
  "theme.dark": "Oscuro",
  "theme.darkHint": "Siempre oscuro",
  "tour.label": "Cómo funciona",
  "hero.eyebrow": "ESTUDIO DE PATRONES",
  "hero.title": "De foto a puntadas.<br /><em>Celda a celda.</em>",
  "hero.copy": "Sube una imagen, elige la densidad y obtén un patrón plano con un color y un símbolo en cada celda.",
  "controls.label": "Ajustes del patrón",
  "source.eyebrow": "ORIGEN",
  "source.title": "Sube una foto",
  "source.choose": "Elegir una imagen",
  "source.dropTitle": "Suelta aquí tu foto",
  "source.dropHint": "o haz clic para elegir un archivo",
  "source.formats": "PNG, JPG, WEBP · hasta 20 MB",
  "source.previewAlt": "Foto subida",
  "source.readyToProcess": "Lista para procesar",
  "source.remove": "Quitar imagen",
  "ai.badge": "OPCIONAL",
  "ai.title": "Prepara la foto con IA",
  "ai.copy": "Pide a ChatGPT, Gemini u otro editor de imágenes que convierta una foto compleja en pixel art limpio. Las formas grandes se conservan mejor en un patrón pequeño.",
  "ai.step1": "Elige abajo el tamaño del patrón y el número de colores.",
  "ai.step2": "Adjunta la foto original a un chat con IA y pega el prompt.",
  "ai.step3": "Descarga el PNG resultante y súbelo a Stitchloom.",
  "ai.copyButton": "Copiar prompt",
  "ai.edit": "Ver y editar el texto",
  "ai.promptLabel": "Prompt para simplificar artísticamente la foto",
  "ai.privacy": "Stitchloom no envía nada por sí mismo. Si subes una foto a un servicio de IA externo, se aplicará la política de privacidad de ese servicio.",
  "settings.eyebrow": "AJUSTES",
  "settings.title": "Configura el patrón",
  "settings.width": "Ancho en celdas",
  "settings.size36": "36 celdas · boceto rápido",
  "settings.size52": "52 celdas · equilibrado",
  "settings.size70": "70 celdas · predeterminado",
  "settings.size90": "90 celdas · detallado",
  "settings.size110": "110 celdas · máximo detalle",
  "settings.colors": "Colores de la paleta",
  "settings.presetsLabel": "Ajustes rápidos del número de colores",
  "settings.exact": "Exacto",
  "settings.exactLabel": "Número exacto de colores",
  "settings.rangeLow": "2 · gráfico",
  "settings.rangeHigh": "256 · más fiel a la foto",
  "settings.algorithm": "Primero promediamos el área de la foto bajo cada celda y después creamos la paleta elegida, sin mezclar colores entre celdas vecinas.",
  "result.eyebrow": "RESULTADO",
  "result.viewMode": "Modo de vista",
  "result.pattern": "Patrón",
  "result.photo": "Foto",
  "result.symbols": "Símbolos",
  "result.grid": "Cuadrícula",
  "zoom.group": "Zoom del patrón",
  "zoom.out": "Alejar",
  "zoom.outShort": "Alejar",
  "zoom.fit": "Ajustar",
  "zoom.fitShort": "Ajustar patrón",
  "zoom.in": "Acercar",
  "zoom.inShort": "Acercar",
  "result.emptyTitle": "Empieza con una foto",
  "result.emptyCopy": "Cuando la subas, aquí aparecerán la cuadrícula, los símbolos y la clave de colores.",
  "result.squareBadge": "CUADRADA 1:1",
  "result.canvasRegion": "Área del patrón. Usa los botones de zoom, pellizca o pulsa Control y gira la rueda del ratón. Arrastra el patrón cuando esté ampliado.",
  "result.canvasAlt": "Patrón de punto de cruz",
  "result.zoomHint": "Pellizca o usa los botones para cambiar el zoom",
  "result.panHint": "Arrastra el patrón cuando esté ampliado",
  "result.downloadPdf": "Descargar PDF",
  "result.downloadPng": "Descargar PNG",
  "result.downloadCsv": "Descargar CSV",
  "result.sampleDimension": "70 × 70 celdas",
  "result.sampleDetails": "16 colores · 4.900 puntadas",
  "legend.eyebrow": "CLAVE",
  "legend.title": "Colores y símbolos",
  "legend.region": "Clave desplazable de colores y símbolos",
  "legend.zero": "0 colores",
  "legend.note": "Los tonos en pantalla son aproximados. Compáralos con una carta física de hilos antes de comprar el hilo.",
  "guide.eyebrow": "EL PROCESO DE UN VISTAZO",
  "guide.title": "Cómo crear un patrón de punto de cruz desde una foto",
  "guide.copy": "Stitchloom convierte una foto en un patrón cuadriculado listo para usar directamente en tu navegador, sin cuenta, calco manual ni subida a un servidor.",
  "guide.step1Title": "Sube una foto",
  "guide.step1Copy": "Elige una imagen con una silueta clara. Si el fondo es recargado, copia primero el prompt y simplifica la imagen con IA.",
  "guide.step2Title": "Configura la cuadrícula y la paleta",
  "guide.step2Copy": "Elige el ancho del patrón y entre 2 y 256 colores. La altura se adapta automáticamente y cada celda permanece perfectamente cuadrada.",
  "guide.step3Title": "Guarda el resultado",
  "guide.step3Copy": "Revisa los símbolos y la cuadrícula, amplía cualquier zona y descarga el patrón como PDF, PNG o CSV.",
  "faq.title": "Preguntas frecuentes",
  "faq.uploadQuestion": "¿Mi foto se sube a un servidor?",
  "faq.uploadAnswer": "No. Stitchloom procesa la foto localmente en tu navegador y no la envía a ningún servidor.",
  "faq.sizeQuestion": "¿Cómo elijo el tamaño del patrón?",
  "faq.sizeAnswer": "Elige el ancho en celdas. La altura se calcula automáticamente según las proporciones de la foto y cada celda permanece cuadrada.",
  "faq.colorsQuestion": "¿Cuántos colores debo elegir?",
  "faq.colorsAnswer": "Empieza con 16 colores. Ocho suelen bastar para ilustraciones sencillas, mientras que las fotos complejas pueden necesitar 24 o más.",
  "footer.privacy": "Sin cuenta · sin subida al servidor",
  "mobile.goToResult": "Ir al patrón terminado",
  "mobile.ready": "PATRÓN LISTO",
  "mobile.openResult": "Abrir resultado",
  "mobile.open": "Abrir",
  "onboarding.eyebrow": "INICIO RÁPIDO",
  "onboarding.title": "Cómo funciona Stitchloom",
  "onboarding.close": "Cerrar consejos",
  "onboarding.region": "Paso de introducción",
  "onboarding.step1Code": "01 / ORIGEN",
  "onboarding.step1Visual": "LOCAL EN TU NAVEGADOR",
  "onboarding.step1Kicker": "Paso 1 · Subir",
  "onboarding.step1Title": "Empieza con una foto",
  "onboarding.step1Copy": "Añade un PNG, JPG o WEBP. Stitchloom lo lee directamente en tu navegador: el archivo no se sube a un servidor para crear el patrón.",
  "onboarding.step1Callout": "Las imágenes con una silueta clara y un fondo tranquilo funcionan mejor.",
  "onboarding.step2Code": "02 / AJUSTES",
  "onboarding.step2Visual": "CADA CELDA ES 1:1",
  "onboarding.step2Kicker": "Paso 2 · Base",
  "onboarding.step2Title": "Las celdas siempre son cuadradas",
  "onboarding.step2Copy": "Elige el ancho del patrón y la altura seguirá las proporciones de la foto. Usa un ajuste de paleta o introduce un número exacto. El patrón se actualiza automáticamente y 16 colores suele ser un buen punto de partida.",
  "onboarding.ranges": "Rangos de ajuste",
  "onboarding.cellsRange": "36–110 celdas",
  "onboarding.colorsRange": "2–256 colores",
  "onboarding.squareCell": "Celda cuadrada 1:1",
  "onboarding.step3Code": "03 / OPCIONAL",
  "onboarding.step3Visual": "FOTO → PIXEL ART LIMPIO",
  "onboarding.step3Kicker": "Paso 3 · Preparación",
  "onboarding.step3Title": "Simplifica una foto compleja",
  "onboarding.step3Copy": "La sección de origen incluye un prompt listo para ChatGPT, Gemini u otra herramienta de IA. Usa automáticamente el ancho y el número de colores que hayas elegido.",
  "onboarding.step3Callout": "Es opcional. Si subes una foto a un servicio de IA externo, se aplicará la política de privacidad de ese servicio.",
  "onboarding.step4Code": "04 / RESULTADO",
  "onboarding.step4Visual": "ZOOM · PDF · PNG · CSV",
  "onboarding.step4Kicker": "Paso 4 · Revisión",
  "onboarding.step4Title": "Revisa y guarda el patrón",
  "onboarding.step4Copy": "Activa o desactiva la cuadrícula y los símbolos, usa los controles o pellizca para ampliar, arrastra el patrón ampliado y después descarga el PDF, PNG o CSV.",
  "onboarding.step4Callout": "Puedes volver a abrir esta guía en cualquier momento con el botón “?” de la cabecera.",
  "onboarding.skip": "Saltar",
  "onboarding.back": "Atrás",
  "prep.title": "Preparar la foto",
  "prep.summary": "recorte · luz · color",
  "prep.cropZoom": "Recorte",
  "prep.cropX": "Posición horizontal",
  "prep.cropY": "Posición vertical",
  "prep.brightness": "Brillo",
  "prep.contrast": "Contraste",
  "prep.saturation": "Saturación",
  "prep.soften": "Suavizar detalles",
  "prep.rotate": "Girar 90°",
  "prep.reset": "Restablecer",
  "project.group": "Archivo de proyecto",
  "project.open": "Abrir .stitchloom",
  "project.save": "Guardar proyecto",
  "settings.stitchability": "Carácter del patrón",
  "settings.stitchabilityLabel": "Nivel de limpieza de puntadas aisladas",
  "settings.easy": "Más fácil de bordar",
  "settings.balanced": "Equilibrado",
  "settings.detail": "Más detalle",
  "settings.paletteMode": "Paleta",
  "settings.paletteAdaptive": "Colores de la imagen",
  "settings.paletteDmc": "Solo colores DMC reales",
  "settings.fabric": "Tela",
  "editor.group": "Edición del patrón",
  "editor.tools": "Herramienta",
  "editor.pan": "Vista",
  "editor.pencil": "Lápiz",
  "editor.fill": "Relleno",
  "editor.eyedropper": "Cuentagotas",
  "editor.color": "Color",
  "editor.colorLabel": "Color de edición",
  "editor.undo": "Deshacer cambio",
  "editor.redo": "Rehacer cambio",
  "insights.score": "Facilidad de bordado",
  "insights.finishedSize": "Tamaño final",
  "insights.materials": "Materiales y tiempo",
  "result.downloadProject": "Descargar .stitchloom",
};

const DE_TRANSLATIONS = {
  "meta.title": "Stitchloom — Kreuzstichvorlage aus einem Foto",
  "meta.description": "Verwandle ein Foto direkt im Browser in eine Kreuzstichvorlage: quadratische Zellen, 2–256 Farben und Export als PDF, PNG oder CSV.",
  "meta.ogTitle": "Stitchloom — vom Foto zur Kreuzstichvorlage",
  "meta.ogDescription": "Quadratische Zellen, eine Palette mit 2–256 Farben und PDF-Export — vollständig in deinem Browser verarbeitet.",
  "meta.twitterDescription": "Erstelle direkt im Browser eine Kreuzstichvorlage aus einem Foto.",
  "meta.imageAlt": "Stitchloom verwandelt ein Foto in eine Vorlage aus quadratischen Stichen",
  "brand.home": "Stitchloom, Startseite",
  "privacy.full": "DEIN FOTO BLEIBT AUF DIESEM GERÄT",
  "privacy.short": "LOKAL",
  "locale.groupLabel": "Sprache auswählen",
  "theme.groupLabel": "Oberflächendesign auswählen",
  "theme.auto": "Automatisch",
  "theme.autoHint": "Systemeinstellung verwenden",
  "theme.light": "Hell",
  "theme.lightHint": "Immer hell",
  "theme.dark": "Dunkel",
  "theme.darkHint": "Immer dunkel",
  "tour.label": "So funktioniert es",
  "hero.eyebrow": "VORLAGENSTUDIO",
  "hero.title": "Vom Foto zu Stichen.<br /><em>Zelle für Zelle.</em>",
  "hero.copy": "Lade ein Bild hoch, wähle die Dichte und erhalte eine klare Vorlage mit einer Farbe und einem Symbol in jeder Zelle.",
  "controls.label": "Vorlageneinstellungen",
  "source.eyebrow": "QUELLE",
  "source.title": "Foto hochladen",
  "source.choose": "Bild auswählen",
  "source.dropTitle": "Foto hier ablegen",
  "source.dropHint": "oder klicken, um eine Datei auszuwählen",
  "source.formats": "PNG, JPG, WEBP · bis zu 20 MB",
  "source.previewAlt": "Hochgeladenes Foto",
  "source.readyToProcess": "Bereit zur Verarbeitung",
  "source.remove": "Bild entfernen",
  "ai.badge": "OPTIONAL",
  "ai.title": "Foto mit KI vorbereiten",
  "ai.copy": "Bitte ChatGPT, Gemini oder einen anderen Bildeditor, ein komplexes Foto in klare Pixel-Art umzuwandeln. Große Formen bleiben in einer kleinen Vorlage besser erhalten.",
  "ai.step1": "Wähle unten die Vorlagengröße und die Anzahl der Farben.",
  "ai.step2": "Hänge das Originalfoto an einen KI-Chat an und füge den Prompt ein.",
  "ai.step3": "Lade das Ergebnis als PNG herunter und lade es in Stitchloom hoch.",
  "ai.copyButton": "Prompt kopieren",
  "ai.edit": "Text anzeigen und bearbeiten",
  "ai.promptLabel": "Prompt zur künstlerischen Vereinfachung des Fotos",
  "ai.privacy": "Stitchloom sendet selbst keine Daten. Wenn du ein Foto bei einem externen KI-Dienst hochlädst, gilt dessen Datenschutzrichtlinie.",
  "settings.eyebrow": "EINSTELLUNGEN",
  "settings.title": "Vorlage einrichten",
  "settings.width": "Breite in Zellen",
  "settings.size36": "36 Zellen · schnelle Skizze",
  "settings.size52": "52 Zellen · ausgewogen",
  "settings.size70": "70 Zellen · Standard",
  "settings.size90": "90 Zellen · detailliert",
  "settings.size110": "110 Zellen · maximale Details",
  "settings.colors": "Farben in der Palette",
  "settings.presetsLabel": "Schnellauswahl der Farbanzahl",
  "settings.exact": "Genau",
  "settings.exactLabel": "Genaue Anzahl der Farben",
  "settings.rangeLow": "2 · grafisch",
  "settings.rangeHigh": "256 · näher am Foto",
  "settings.algorithm": "Zuerst mitteln wir den Fotobereich unter jeder Zelle, dann erstellen wir die gewählte Palette — ohne Farben zwischen benachbarten Zellen zu vermischen.",
  "result.eyebrow": "ERGEBNIS",
  "result.viewMode": "Ansichtsmodus",
  "result.pattern": "Vorlage",
  "result.photo": "Foto",
  "result.symbols": "Symbole",
  "result.grid": "Raster",
  "zoom.group": "Vorlagenzoom",
  "zoom.out": "Verkleinern",
  "zoom.outShort": "Verkleinern",
  "zoom.fit": "Einpassen",
  "zoom.fitShort": "Vorlage einpassen",
  "zoom.in": "Vergrößern",
  "zoom.inShort": "Vergrößern",
  "result.emptyTitle": "Beginne mit einem Foto",
  "result.emptyCopy": "Nach dem Hochladen erscheinen hier Raster, Symbole und Farbschlüssel.",
  "result.squareBadge": "QUADRATISCH 1:1",
  "result.canvasRegion": "Vorlagenbereich. Zoome mit den Schaltflächen, einer Zwei-Finger-Geste oder mit Strg und Mausrad. Ziehe die vergrößerte Vorlage zum Verschieben.",
  "result.canvasAlt": "Kreuzstichvorlage",
  "result.zoomHint": "Mit zwei Fingern oder den Schaltflächen zoomen",
  "result.panHint": "Vergrößerte Vorlage zum Verschieben ziehen",
  "result.downloadPdf": "PDF herunterladen",
  "result.downloadPng": "PNG herunterladen",
  "result.downloadCsv": "CSV herunterladen",
  "result.sampleDimension": "70 × 70 Zellen",
  "result.sampleDetails": "16 Farben · 4.900 Stiche",
  "legend.eyebrow": "LEGENDE",
  "legend.title": "Farben und Symbole",
  "legend.region": "Scrollbare Farb- und Symbollegende",
  "legend.zero": "0 Farben",
  "legend.note": "Farbtöne auf dem Bildschirm sind Näherungswerte. Vergleiche sie vor dem Kauf des Garns mit einer physischen Farbkarte.",
  "guide.eyebrow": "DER ABLAUF AUF EINEN BLICK",
  "guide.title": "So entsteht eine Kreuzstichvorlage aus einem Foto",
  "guide.copy": "Stitchloom verwandelt ein Foto direkt im Browser in eine gebrauchsfertige Rastervorlage — ohne Konto, manuelles Nachzeichnen oder Server-Upload.",
  "guide.step1Title": "Foto hochladen",
  "guide.step1Copy": "Wähle ein Bild mit klarer Silhouette. Bei einem unruhigen Hintergrund kannst du zuerst den Prompt kopieren und das Bild mit KI vereinfachen.",
  "guide.step2Title": "Raster und Palette festlegen",
  "guide.step2Copy": "Wähle die Breite der Vorlage und 2–256 Farben. Die Höhe passt sich automatisch an, während jede Zelle exakt quadratisch bleibt.",
  "guide.step3Title": "Ergebnis speichern",
  "guide.step3Copy": "Prüfe Symbole und Raster, vergrößere jeden gewünschten Bereich und lade die Vorlage als PDF, PNG oder CSV herunter.",
  "faq.title": "Häufig gestellte Fragen",
  "faq.uploadQuestion": "Wird mein Foto auf einen Server hochgeladen?",
  "faq.uploadAnswer": "Nein. Stitchloom verarbeitet das Foto lokal in deinem Browser und sendet es nicht an einen Server.",
  "faq.sizeQuestion": "Wie wähle ich die Vorlagengröße?",
  "faq.sizeAnswer": "Wähle die Breite in Zellen. Die Höhe wird automatisch aus den Proportionen des Fotos berechnet, und jede Zelle bleibt quadratisch.",
  "faq.colorsQuestion": "Wie viele Farben sollte ich wählen?",
  "faq.colorsAnswer": "Beginne mit 16 Farben. Für einfache Illustrationen reichen oft acht, komplexe Fotos benötigen eventuell 24 oder mehr.",
  "footer.privacy": "Kein Konto · kein Server-Upload",
  "mobile.goToResult": "Zur fertigen Vorlage",
  "mobile.ready": "VORLAGE BEREIT",
  "mobile.openResult": "Ergebnis öffnen",
  "mobile.open": "Öffnen",
  "onboarding.eyebrow": "SCHNELLSTART",
  "onboarding.title": "So funktioniert Stitchloom",
  "onboarding.close": "Tipps schließen",
  "onboarding.region": "Einführungsschritt",
  "onboarding.step1Code": "01 / QUELLE",
  "onboarding.step1Visual": "LOKAL IN DEINEM BROWSER",
  "onboarding.step1Kicker": "Schritt 1 · Hochladen",
  "onboarding.step1Title": "Beginne mit einem Foto",
  "onboarding.step1Copy": "Füge eine PNG-, JPG- oder WEBP-Datei hinzu. Stitchloom liest sie direkt im Browser: Zur Erstellung der Vorlage wird die Datei nicht auf einen Server hochgeladen.",
  "onboarding.step1Callout": "Bilder mit klarer Silhouette und ruhigem Hintergrund funktionieren am besten.",
  "onboarding.step2Code": "02 / EINSTELLUNGEN",
  "onboarding.step2Visual": "JEDE ZELLE IST 1:1",
  "onboarding.step2Kicker": "Schritt 2 · Grundlage",
  "onboarding.step2Title": "Zellen sind immer quadratisch",
  "onboarding.step2Copy": "Wähle die Breite der Vorlage; die Höhe folgt den Proportionen des Fotos. Nutze eine Palettenvorgabe oder gib eine genaue Zahl ein. Die Vorlage aktualisiert sich automatisch, und 16 Farben sind meist ein guter Ausgangspunkt.",
  "onboarding.ranges": "Einstellbereiche",
  "onboarding.cellsRange": "36–110 Zellen",
  "onboarding.colorsRange": "2–256 Farben",
  "onboarding.squareCell": "Quadratische 1:1-Zelle",
  "onboarding.step3Code": "03 / OPTIONAL",
  "onboarding.step3Visual": "FOTO → KLARE PIXEL-ART",
  "onboarding.step3Kicker": "Schritt 3 · Vorbereitung",
  "onboarding.step3Title": "Komplexes Foto vereinfachen",
  "onboarding.step3Copy": "Im Quellenbereich findest du einen fertigen Prompt für ChatGPT, Gemini oder ein anderes KI-Werkzeug. Er verwendet automatisch deine gewählte Vorlagenbreite und Farbanzahl.",
  "onboarding.step3Callout": "Dieser Schritt ist optional. Wenn du ein Foto bei einem externen KI-Dienst hochlädst, gilt dessen Datenschutzrichtlinie.",
  "onboarding.step4Code": "04 / ERGEBNIS",
  "onboarding.step4Visual": "ZOOM · PDF · PNG · CSV",
  "onboarding.step4Kicker": "Schritt 4 · Prüfen",
  "onboarding.step4Title": "Vorlage prüfen und speichern",
  "onboarding.step4Copy": "Schalte Raster und Symbole ein oder aus, zoome mit den Bedienelementen oder einer Zwei-Finger-Geste, verschiebe die vergrößerte Vorlage und lade anschließend PDF, PNG oder CSV herunter.",
  "onboarding.step4Callout": "Du kannst diese Einführung jederzeit über die Schaltfläche „?“ in der Kopfzeile erneut öffnen.",
  "onboarding.skip": "Überspringen",
  "onboarding.back": "Zurück",
  "prep.title": "Foto vorbereiten",
  "prep.summary": "Zuschnitt · Licht · Farbe",
  "prep.cropZoom": "Zuschnitt",
  "prep.cropX": "Horizontale Position",
  "prep.cropY": "Vertikale Position",
  "prep.brightness": "Helligkeit",
  "prep.contrast": "Kontrast",
  "prep.saturation": "Sättigung",
  "prep.soften": "Details glätten",
  "prep.rotate": "Um 90° drehen",
  "prep.reset": "Zurücksetzen",
  "project.group": "Projektdatei",
  "project.open": ".stitchloom öffnen",
  "project.save": "Projekt speichern",
  "settings.stitchability": "Charakter der Vorlage",
  "settings.stitchabilityLabel": "Bereinigung einzelner Stiche",
  "settings.easy": "Einfacher zu sticken",
  "settings.balanced": "Ausgewogen",
  "settings.detail": "Mehr Details",
  "settings.paletteMode": "Palette",
  "settings.paletteAdaptive": "Bildfarben",
  "settings.paletteDmc": "Nur echte DMC-Farben",
  "settings.fabric": "Stoff",
  "editor.group": "Vorlage bearbeiten",
  "editor.tools": "Werkzeug",
  "editor.pan": "Ansicht",
  "editor.pencil": "Stift",
  "editor.fill": "Füllen",
  "editor.eyedropper": "Pipette",
  "editor.color": "Farbe",
  "editor.colorLabel": "Bearbeitungsfarbe",
  "editor.undo": "Änderung rückgängig machen",
  "editor.redo": "Änderung wiederholen",
  "insights.score": "Stickfreundlichkeit",
  "insights.finishedSize": "Fertige Größe",
  "insights.materials": "Material und Zeit",
  "result.downloadProject": ".stitchloom herunterladen",
};

const UI_MESSAGES = {
  ru: {
    "theme.auto": "Авто",
    "theme.light": "Светлая",
    "theme.dark": "Тёмная",
    "theme.current": "Тема: {value}",
    "locale.switch": "Выбрать язык",
    "locale.current": "Язык: {language}",
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
    "project.saved": "Проект .stitchloom сохранён.",
    "project.opened": "Проект открыт. Можно продолжать редактирование.",
    "project.invalid": "Это не поддерживаемый файл Stitchloom.",
    "project.tooLarge": "Файл проекта слишком большой. Максимум — 40 МБ.",
    "project.autosaved": "Автосохранено на этом устройстве.",
    "project.restored": "Последний проект восстановлен с этого устройства.",
    "project.saveFailed": "Не удалось сохранить проект.",
    "project.openFailed": "Не удалось открыть проект.",
    "prep.updated": "Подготовка фото применена — схема обновляется.",
    "prep.resetDone": "Подготовка фото сброшена.",
    "editor.selected": "Выбран цвет {color}.",
    "editor.pencilDone": "Клетка перекрашена.",
    "editor.fillDone": "Область залита.",
    "editor.undoDone": "Изменение отменено.",
    "editor.redoDone": "Изменение повторено.",
    "insights.scoreDetails": "{isolated} одиночных · {regions} малых областей",
    "insights.fabric": "Aida {count} · ткань {width} × {height} см",
    "insights.materialsValue": "≈ {skeins} мотков",
    "insights.time": "примерно {low}–{high} ч",
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
    "locale.switch": "Choose language",
    "locale.current": "Language: {language}",
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
    "project.saved": ".stitchloom project saved.",
    "project.opened": "Project opened. You can continue editing.",
    "project.invalid": "This is not a supported Stitchloom file.",
    "project.tooLarge": "The project file is too large. Maximum: 40 MB.",
    "project.autosaved": "Autosaved on this device.",
    "project.restored": "The latest project was restored from this device.",
    "project.saveFailed": "The project could not be saved.",
    "project.openFailed": "The project could not be opened.",
    "prep.updated": "Photo preparation applied — rebuilding the pattern.",
    "prep.resetDone": "Photo preparation reset.",
    "editor.selected": "Selected color {color}.",
    "editor.pencilDone": "Cell recolored.",
    "editor.fillDone": "Area filled.",
    "editor.undoDone": "Change undone.",
    "editor.redoDone": "Change redone.",
    "insights.scoreDetails": "{isolated} isolated · {regions} small regions",
    "insights.fabric": "Aida {count} · fabric {width} × {height} cm",
    "insights.materialsValue": "≈ {skeins} skeins",
    "insights.time": "about {low}–{high} h",
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
  es: {
    "theme.auto": "Automático",
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "theme.current": "Tema: {value}",
    "locale.switch": "Elegir idioma",
    "locale.current": "Idioma: {language}",
    "onboarding.progress": "Paso {current} de {total}",
    "onboarding.start": "Empezar a crear",
    "onboarding.next": "Siguiente",
    "ai.target": "{width} celdas · hasta {colors} colores",
    "ai.copy": "Copiar prompt",
    "ai.copied": "Prompt copiado",
    "ai.copiedStatus": "Ahora adjunta la foto y pega el prompt en el servicio de IA que prefieras.",
    "ai.select": "Seleccionar prompt",
    "ai.manualStatus": "La copia automática no está disponible: el texto está abierto y seleccionado para copiarlo manualmente.",
    "guidance.low": "Un resultado gráfico con una clave breve y sencilla.",
    "guidance.balanced": "{colors} ofrece un buen equilibrio entre detalle y una clave manejable.",
    "guidance.detailed": "Más matices, aunque la clave impresa será más larga.",
    "guidance.high": "Para bordar a mano suele ser más práctico usar hasta 64 colores. Los símbolos están ocultos de forma predeterminada, pero puedes activarlos.",
    "auto.noPhoto": "Sube una foto: el patrón se creará automáticamente.",
    "auto.updating": "Los ajustes han cambiado: recalculando el patrón…",
    "auto.ready": "Listo: {width} × {height} celdas, {palette}. Los cambios se aplican automáticamente.",
    "pattern.updatingStatus": "Actualizando…",
    "pattern.updatingHeading": "Actualizando el patrón",
    "pattern.buildingHeading": "Calculando celdas y eligiendo colores",
    "pattern.buildingStatus": "Creando el patrón…",
    "pattern.readyStatus": "Patrón listo",
    "pattern.readyHeading": "Patrón listo para bordar",
    "pattern.emptyHeading": "Tu patrón aparecerá aquí",
    "pattern.waiting": "Esperando una foto",
    "zoom.current": "Zoom actual: {zoom} por ciento. Ajustar el patrón al área visible",
    "file.local": "Todo se procesa localmente: el archivo no se sube a ningún servidor.",
    "file.ready": "Imagen lista. El patrón se está creando localmente en esta ventana.",
    "file.patternReady": "Listo. Cambia los ajustes: la foto permanece local y el patrón se actualiza automáticamente.",
    "file.invalid": "Elige un archivo de imagen PNG, JPG, WEBP o GIF.",
    "file.tooLarge": "El archivo es demasiado grande. El tamaño máximo es de 20 MB.",
    "file.openFailed": "No se pudo abrir la imagen. Prueba con otro archivo.",
    "legend.stitches": "Puntadas",
    "project.saved": "Proyecto .stitchloom guardado.",
    "project.opened": "Proyecto abierto. Puedes seguir editando.",
    "project.invalid": "Este archivo de Stitchloom no es compatible.",
    "project.tooLarge": "El archivo del proyecto es demasiado grande. Máximo: 40 MB.",
    "project.autosaved": "Guardado automáticamente en este dispositivo.",
    "project.restored": "Se restauró el último proyecto de este dispositivo.",
    "project.saveFailed": "No se pudo guardar el proyecto.",
    "project.openFailed": "No se pudo abrir el proyecto.",
    "prep.updated": "Preparación aplicada: actualizando el patrón.",
    "prep.resetDone": "Preparación de la foto restablecida.",
    "editor.selected": "Color {color} seleccionado.",
    "editor.pencilDone": "Celda recoloreada.",
    "editor.fillDone": "Área rellenada.",
    "editor.undoDone": "Cambio deshecho.",
    "editor.redoDone": "Cambio rehecho.",
    "insights.scoreDetails": "{isolated} aisladas · {regions} áreas pequeñas",
    "insights.fabric": "Aida {count} · tela {width} × {height} cm",
    "insights.materialsValue": "≈ {skeins} madejas",
    "insights.time": "aprox. {low}–{high} h",
    "pdf.ready": "PDF listo. ",
    "pdf.retry": "Descargar de nuevo",
    "pdf.readFailed": "No se pudo leer la página del PDF",
    "pdf.pageFailed": "No se pudo preparar la página del PDF",
    "pdf.preparing": "Preparando PDF…",
    "pdf.pages": "Creando páginas: {current} / {total}",
    "pdf.packing": "Empaquetando PDF…",
    "pdf.failed": "No se pudo crear el PDF. Prueba con un patrón más pequeño.",
    "pdf.download": "Descargar PDF",
    "pdf.footerLocal": "Patrón creado localmente — stitchloom",
    "pdf.page": "Página {page} / {total}",
    "pdf.overviewSection": "RESUMEN DEL PATRÓN",
    "pdf.coverTitle": "Patrón de punto de cruz",
    "pdf.coverSubtitle": "celda a celda",
    "pdf.imageDefault": "Imagen",
    "pdf.size": "TAMAÑO",
    "pdf.colors": "COLORES",
    "pdf.stitches": "PUNTADAS",
    "pdf.nextPages": "CUADRÍCULA DETALLADA Y CLAVE DE COLORES EN LAS PÁGINAS SIGUIENTES",
    "pdf.gridSection": "CUADRÍCULA {current} / {total}",
    "pdf.gridTitle": "Patrón cuadrado 1:1",
    "pdf.gridRange": "Columnas {columnStart}–{columnEnd} · filas {rowStart}–{rowEnd}",
    "pdf.thickLine": "Línea gruesa cada 10 celdas",
    "pdf.keySection": "CLAVE {current} / {total}",
    "pdf.legendTitle": "Colores y símbolos",
    "pdf.legendNote": "Los tonos en pantalla son aproximados: compáralos con una carta física de hilos.",
  },
  de: {
    "theme.auto": "Automatisch",
    "theme.light": "Hell",
    "theme.dark": "Dunkel",
    "theme.current": "Design: {value}",
    "locale.switch": "Sprache auswählen",
    "locale.current": "Sprache: {language}",
    "onboarding.progress": "Schritt {current} von {total}",
    "onboarding.start": "Jetzt erstellen",
    "onboarding.next": "Weiter",
    "ai.target": "{width} Zellen · bis zu {colors} Farben",
    "ai.copy": "Prompt kopieren",
    "ai.copied": "Prompt kopiert",
    "ai.copiedStatus": "Hänge jetzt das Foto an und füge den Prompt in den gewünschten KI-Dienst ein.",
    "ai.select": "Prompt auswählen",
    "ai.manualStatus": "Automatisches Kopieren ist nicht verfügbar — der Text ist geöffnet und zum manuellen Kopieren markiert.",
    "guidance.low": "Ein grafisches Ergebnis mit einer kurzen, einfachen Legende.",
    "guidance.balanced": "{colors} bietet ein gutes Gleichgewicht zwischen Details und einer übersichtlichen Legende.",
    "guidance.detailed": "Mehr Nuancen, aber die Legende für den Druck wird länger.",
    "guidance.high": "Für Handstickerei sind bis zu 64 Farben meist praktischer. Symbole sind standardmäßig ausgeblendet, können aber eingeblendet werden.",
    "auto.noPhoto": "Lade ein Foto hoch — die Vorlage wird automatisch erstellt.",
    "auto.updating": "Einstellungen geändert — Vorlage wird neu berechnet…",
    "auto.ready": "Bereit: {width} × {height} Zellen, {palette}. Änderungen werden automatisch übernommen.",
    "pattern.updatingStatus": "Wird aktualisiert…",
    "pattern.updatingHeading": "Vorlage wird aktualisiert",
    "pattern.buildingHeading": "Zellen werden berechnet und Farben ausgewählt",
    "pattern.buildingStatus": "Vorlage wird erstellt…",
    "pattern.readyStatus": "Vorlage bereit",
    "pattern.readyHeading": "Vorlage ist bereit zum Sticken",
    "pattern.emptyHeading": "Deine Vorlage erscheint hier",
    "pattern.waiting": "Wartet auf ein Foto",
    "zoom.current": "Aktueller Zoom: {zoom} Prozent. Vorlage in den sichtbaren Bereich einpassen",
    "file.local": "Alles wird lokal verarbeitet: Die Datei wird nicht auf einen Server hochgeladen.",
    "file.ready": "Bild bereit. Die Vorlage wird lokal in diesem Fenster erstellt.",
    "file.patternReady": "Bereit. Ändere die Einstellungen — das Foto bleibt lokal und die Vorlage aktualisiert sich automatisch.",
    "file.invalid": "Wähle eine Bilddatei im Format PNG, JPG, WEBP oder GIF.",
    "file.tooLarge": "Die Datei ist zu groß. Die maximale Größe beträgt 20 MB.",
    "file.openFailed": "Das Bild konnte nicht geöffnet werden. Versuche es mit einer anderen Datei.",
    "legend.stitches": "Stiche",
    "project.saved": ".stitchloom-Projekt gespeichert.",
    "project.opened": "Projekt geöffnet. Du kannst weiterarbeiten.",
    "project.invalid": "Diese Stitchloom-Datei wird nicht unterstützt.",
    "project.tooLarge": "Die Projektdatei ist zu groß. Maximum: 40 MB.",
    "project.autosaved": "Auf diesem Gerät automatisch gespeichert.",
    "project.restored": "Das letzte Projekt wurde von diesem Gerät wiederhergestellt.",
    "project.saveFailed": "Das Projekt konnte nicht gespeichert werden.",
    "project.openFailed": "Das Projekt konnte nicht geöffnet werden.",
    "prep.updated": "Fotovorbereitung angewendet — Vorlage wird aktualisiert.",
    "prep.resetDone": "Fotovorbereitung zurückgesetzt.",
    "editor.selected": "Farbe {color} ausgewählt.",
    "editor.pencilDone": "Zelle neu eingefärbt.",
    "editor.fillDone": "Bereich gefüllt.",
    "editor.undoDone": "Änderung rückgängig gemacht.",
    "editor.redoDone": "Änderung wiederholt.",
    "insights.scoreDetails": "{isolated} einzeln · {regions} kleine Bereiche",
    "insights.fabric": "Aida {count} · Stoff {width} × {height} cm",
    "insights.materialsValue": "≈ {skeins} Stränge",
    "insights.time": "etwa {low}–{high} Std.",
    "pdf.ready": "PDF bereit. ",
    "pdf.retry": "Erneut herunterladen",
    "pdf.readFailed": "Die PDF-Seite konnte nicht gelesen werden",
    "pdf.pageFailed": "Die PDF-Seite konnte nicht vorbereitet werden",
    "pdf.preparing": "PDF wird vorbereitet…",
    "pdf.pages": "Seiten werden erstellt: {current} / {total}",
    "pdf.packing": "PDF wird verpackt…",
    "pdf.failed": "Das PDF konnte nicht erstellt werden. Versuche es mit einer kleineren Vorlage.",
    "pdf.download": "PDF herunterladen",
    "pdf.footerLocal": "Vorlage lokal erstellt — stitchloom",
    "pdf.page": "Seite {page} / {total}",
    "pdf.overviewSection": "VORLAGENÜBERSICHT",
    "pdf.coverTitle": "Kreuzstichvorlage",
    "pdf.coverSubtitle": "Zelle für Zelle",
    "pdf.imageDefault": "Bild",
    "pdf.size": "GRÖSSE",
    "pdf.colors": "FARBEN",
    "pdf.stitches": "STICHE",
    "pdf.nextPages": "DETAILRASTER UND FARBSCHLÜSSEL — AUF DEN FOLGENDEN SEITEN",
    "pdf.gridSection": "RASTER {current} / {total}",
    "pdf.gridTitle": "Quadratische Vorlage 1:1",
    "pdf.gridRange": "Spalten {columnStart}–{columnEnd} · Reihen {rowStart}–{rowEnd}",
    "pdf.thickLine": "Dicke Linie alle 10 Zellen",
    "pdf.keySection": "LEGENDE {current} / {total}",
    "pdf.legendTitle": "Farben und Symbole",
    "pdf.legendNote": "Farbtöne auf dem Bildschirm sind Näherungswerte — vergleiche sie mit einer physischen Garnfarbkarte.",
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
  es: {
    cell: ["celda", "celdas"],
    color: ["color", "colores"],
    stitch: ["puntada", "puntadas"],
  },
  de: {
    cell: ["Zelle", "Zellen"],
    color: ["Farbe", "Farben"],
    stitch: ["Stich", "Stiche"],
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
  { code: "B5200", name: { ru: "Белый", en: "Snow White", es: "Blanco nieve", de: "Schneeweiß" }, hex: "#ffffff", r: 255, g: 255, b: 255 },
  { code: "3865", name: { ru: "Зимний белый", en: "Winter White", es: "Blanco invierno", de: "Winterweiß" }, hex: "#f4f0e6", r: 244, g: 240, b: 230 },
  { code: "762", name: { ru: "Жемчужно-серый, светлый", en: "Pearl Gray, very light", es: "Gris perla, muy claro", de: "Perlgrau, sehr hell" }, hex: "#d7d0c4", r: 215, g: 208, b: 196 },
  { code: "318", name: { ru: "Стальной серый, светлый", en: "Steel Gray, light", es: "Gris acero, claro", de: "Stahlgrau, hell" }, hex: "#a7abb0", r: 167, g: 171, b: 176 },
  { code: "414", name: { ru: "Стальной серый, тёмный", en: "Steel Gray, dark", es: "Gris acero, oscuro", de: "Stahlgrau, dunkel" }, hex: "#73777a", r: 115, g: 119, b: 122 },
  { code: "535", name: { ru: "Графитовый серый", en: "Graphite Gray", es: "Gris grafito", de: "Graphitgrau" }, hex: "#55585a", r: 85, g: 88, b: 90 },
  { code: "413", name: { ru: "Серый, тёмный", en: "Gray, dark", es: "Gris, oscuro", de: "Grau, dunkel" }, hex: "#44484a", r: 68, g: 72, b: 74 },
  { code: "3799", name: { ru: "Серый, очень тёмный", en: "Gray, very dark", es: "Gris, muy oscuro", de: "Grau, sehr dunkel" }, hex: "#25292b", r: 37, g: 41, b: 43 },
  { code: "310", name: { ru: "Чёрный", en: "Black", es: "Negro", de: "Schwarz" }, hex: "#171719", r: 23, g: 23, b: 25 },
  { code: "3371", name: { ru: "Коричневый, почти чёрный", en: "Brown, very dark", es: "Marrón, muy oscuro", de: "Braun, sehr dunkel" }, hex: "#30201d", r: 48, g: 32, b: 29 },
  { code: "754", name: { ru: "Персиковый, светлый", en: "Peach, light", es: "Melocotón, claro", de: "Pfirsich, hell" }, hex: "#f1c7ae", r: 241, g: 199, b: 174 },
  { code: "210", name: { ru: "Розовый, тёмный", en: "Pink, dark", es: "Rosa, oscuro", de: "Rosa, dunkel" }, hex: "#c87878", r: 200, g: 120, b: 120 },
  { code: "3712", name: { ru: "Лососевый, тёмный", en: "Salmon, dark", es: "Salmón, oscuro", de: "Lachs, dunkel" }, hex: "#ad5b5e", r: 173, g: 91, b: 94 },
  { code: "962", name: { ru: "Пыльная роза, средний", en: "Dusty Rose, medium", es: "Rosa empolvado, medio", de: "Altrosa, mittel" }, hex: "#d18d94", r: 209, g: 141, b: 148 },
  { code: "3803", name: { ru: "Розово-лиловый, светлый", en: "Mauve, light", es: "Malva, claro", de: "Mauve, hell" }, hex: "#ad6b7b", r: 173, g: 107, b: 123 },
  { code: "321", name: { ru: "Красный", en: "Red", es: "Rojo", de: "Rot" }, hex: "#bd2435", r: 189, g: 36, b: 53 },
  { code: "606", name: { ru: "Красно-оранжевый", en: "Bright Orange-Red", es: "Rojo anaranjado intenso", de: "Leuchtendes Orangerot" }, hex: "#ef4c3c", r: 239, g: 76, b: 60 },
  { code: "782", name: { ru: "Топаз, тёмный", en: "Topaz, dark", es: "Topacio, oscuro", de: "Topas, dunkel" }, hex: "#ad7b3d", r: 173, g: 123, b: 61 },
  { code: "783", name: { ru: "Топаз, средний", en: "Topaz, medium", es: "Topacio, medio", de: "Topas, mittel" }, hex: "#c39a59", r: 195, g: 154, b: 89 },
  { code: "3047", name: { ru: "Жёлтый, очень светлый", en: "Yellow, very light", es: "Amarillo, muy claro", de: "Gelb, sehr hell" }, hex: "#e9dca4", r: 233, g: 220, b: 164 },
  { code: "3346", name: { ru: "Охотничий зелёный", en: "Hunter Green", es: "Verde cazador", de: "Jägergrün" }, hex: "#64814b", r: 100, g: 129, b: 75 },
  { code: "702", name: { ru: "Келли-зелёный", en: "Kelly Green", es: "Verde Kelly", de: "Kellygrün" }, hex: "#5a9a5a", r: 90, g: 154, b: 90 },
  { code: "890", name: { ru: "Фисташковый, тёмный", en: "Pistachio Green, dark", es: "Verde pistacho, oscuro", de: "Pistaziengrün, dunkel" }, hex: "#417342", r: 65, g: 115, b: 66 },
  { code: "799", name: { ru: "Синий Delft, средний", en: "Delft Blue, medium", es: "Azul Delft, medio", de: "Delftblau, mittel" }, hex: "#3c6290", r: 60, g: 98, b: 144 },
  { code: "820", name: { ru: "Королевский синий, тёмный", en: "Royal Blue, dark", es: "Azul real, oscuro", de: "Königsblau, dunkel" }, hex: "#263f72", r: 38, g: 63, b: 114 },
  { code: "3325", name: { ru: "Синий, светлый", en: "Blue, light", es: "Azul, claro", de: "Blau, hell" }, hex: "#8ca4c2", r: 140, g: 164, b: 194 },
  { code: "550", name: { ru: "Фиолетовый, тёмный", en: "Violet, dark", es: "Violeta, oscuro", de: "Violett, dunkel" }, hex: "#684c79", r: 104, g: 76, b: 121 },
  { code: "718", name: { ru: "Сливовый", en: "Plum", es: "Ciruela", de: "Pflaume" }, hex: "#a44770", r: 164, g: 71, b: 112 },
  { code: "3862", name: { ru: "Мокко, средний", en: "Mocha Brown, medium", es: "Marrón moca, medio", de: "Mokkabraun, mittel" }, hex: "#a47756", r: 164, g: 119, b: 86 },
  { code: "3866", name: { ru: "Мокко, очень светлый", en: "Mocha Brown, very light", es: "Marrón moca, muy claro", de: "Mokkabraun, sehr hell" }, hex: "#f0ddc1", r: 240, g: 221, b: 193 },
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
  return new Intl.NumberFormat(LOCALE_NUMBER_FORMATS[state.locale] || "ru-RU").format(value);
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
  if (state.locale !== "ru") return value === 1 ? forms[0] : forms[1];
  return plural(value, forms[0], forms[1], forms[2]);
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + (state.locale === "ru" ? " КБ" : " KB");
  }
  const value = new Intl.NumberFormat(LOCALE_NUMBER_FORMATS[state.locale] || "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(bytes / (1024 * 1024));
  return value + (state.locale === "ru" ? " МБ" : " MB");
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
      const translations = {
        en: EN_TRANSLATIONS,
        es: ES_TRANSLATIONS,
        de: DE_TRANSLATIONS,
      }[locale] || null;
      const value = translations ? translations[key] : fallback;
      if (typeof value !== "string") return;
      if (binding.attribute) element.setAttribute(binding.attribute, value);
      else element[binding.property] = value;
    });
  });
}

function getStaticTranslation(key, locale = state.locale) {
  if (locale === "en") return EN_TRANSLATIONS[key] || key;
  if (locale === "es") return ES_TRANSLATIONS[key] || key;
  if (locale === "de") return DE_TRANSLATIONS[key] || key;
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
  return SUPPORTED_LOCALES.includes(value);
}

function detectBrowserLocale() {
  const languages = [
    ...(Array.isArray(window.navigator.languages) ? window.navigator.languages : []),
    window.navigator.language || "",
  ];

  for (const language of languages) {
    const baseLanguage = String(language).toLowerCase().split("-")[0];
    if (isSupportedLocale(baseLanguage)) return baseLanguage;
  }

  return "en";
}

function getInitialLocale() {
  if (vkLaunchContext.enabled) return "ru";
  const documentLocale = document.documentElement.dataset.locale;
  if (isSupportedLocale(documentLocale)) return documentLocale;
  return "ru";
}

function getLocalizedCanonicalUrl(locale) {
  return `https://stitchloom.antonlenev.chatgpt.site/${locale}/`;
}

function getLocalizedAppPath(locale) {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (isSupportedLocale(segments.at(-1))) segments.pop();
  const rootSegments = segments.filter((segment) => segment !== "index.html");
  return `/${rootSegments.length ? rootSegments.join("/") + "/" : ""}${locale}/`;
}

function buildStructuredData(locale) {
  const url = getLocalizedCanonicalUrl(locale);
  const localizedStructuredCopy = {
    ru: {
      description: "Браузерный генератор схем вышивки крестиком из фотографий.",
      features: [
        "Квадратные клетки схемы",
        "Палитра от 2 до 256 цветов",
        "Экспорт в PDF, PNG и CSV",
        "Локальная обработка изображения",
      ],
      currency: "RUB",
    },
    en: {
      description: "A browser-based generator that turns photos into cross-stitch patterns.",
      features: [
        "Square pattern cells",
        "Palette from 2 to 256 colors",
        "PDF, PNG, and CSV export",
        "Local image processing",
      ],
      currency: "USD",
    },
    es: {
      description: "Generador en el navegador que convierte fotos en patrones de punto de cruz.",
      features: [
        "Celdas cuadradas",
        "Paleta de 2 a 256 colores",
        "Exportación a PDF, PNG y CSV",
        "Procesamiento local de imágenes",
      ],
      currency: "EUR",
    },
    de: {
      description: "Ein browserbasierter Generator, der Fotos in Kreuzstichvorlagen umwandelt.",
      features: [
        "Quadratische Rasterzellen",
        "Palette mit 2 bis 256 Farben",
        "Export als PDF, PNG und CSV",
        "Lokale Bildverarbeitung",
      ],
      currency: "EUR",
    },
  };
  const structuredCopy = localizedStructuredCopy[locale] || localizedStructuredCopy.ru;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://stitchloom.antonlenev.chatgpt.site/#website",
        url,
        name: "Stitchloom",
        alternateName: getStaticTranslation("meta.title", locale),
        description: structuredCopy.description,
        inLanguage: locale,
      },
      {
        "@type": "WebApplication",
        "@id": "https://stitchloom.antonlenev.chatgpt.site/#app",
        name: "Stitchloom",
        url,
        description: structuredCopy.description,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any",
        inLanguage: locale,
        image: "https://stitchloom.antonlenev.chatgpt.site/og.png",
        isPartOf: { "@id": "https://stitchloom.antonlenev.chatgpt.site/#website" },
        featureList: structuredCopy.features,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: structuredCopy.currency,
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
    url.pathname = getLocalizedAppPath(locale);
    url.searchParams.delete("lang");
    window.location.assign(url);
  } catch {
    // The selected language still applies for the current page view.
  }
}

function applyLocale(locale, persist = false, refresh = true) {
  const nextLocale = vkLaunchContext.enabled
    ? "ru"
    : (isSupportedLocale(locale) ? locale : "ru");
  if (persist) state.localeSource = "manual";
  state.locale = nextLocale;
  document.documentElement.lang = nextLocale;
  document.documentElement.dataset.locale = nextLocale;
  document.documentElement.dataset.localeSource = state.localeSource;
  applyStaticTranslations(nextLocale);

  const localizedUrl = getLocalizedCanonicalUrl(nextLocale);
  elements.canonicalUrl.href = localizedUrl;
  elements.ogUrl.content = localizedUrl;
  const alternateLocales = SUPPORTED_LOCALES.filter((localeCode) => localeCode !== nextLocale);
  elements.ogLocale.content = LOCALE_OG_CODES[nextLocale];
  elements.ogLocaleAlternate.content = LOCALE_OG_CODES[alternateLocales[0]];
  elements.ogLocaleAlternateSecondary.content = LOCALE_OG_CODES[alternateLocales[1]];
  elements.ogLocaleAlternateTertiary.content = LOCALE_OG_CODES[alternateLocales[2]];
  elements.structuredData.textContent = JSON.stringify(buildStructuredData(nextLocale));
  elements.appManifest.href = new URL(LOCALE_MANIFESTS[nextLocale], document.baseURI).href;

  const localeName = LOCALE_NAMES[nextLocale];
  const localeDescription = t("locale.current", { language: localeName });
  elements.localePickerLabel.textContent = localeName;
  elements.localePickerLabel.lang = nextLocale;
  elements.localeCurrentCode.textContent = nextLocale.toUpperCase();
  elements.localePickerSummary.setAttribute("aria-label", localeDescription);
  elements.localePickerSummary.title = localeDescription;
  elements.localeChoices.forEach((button) => {
    const isActive = button.dataset.localeChoice === nextLocale;
    button.setAttribute("aria-pressed", String(isActive));
  });
  elements.brandHome.href = getLocalizedAppPath(nextLocale);

  if (persist) persistLocale(nextLocale);
  if (refresh) refreshLocalizedUi();
}

function initLocale() {
  cacheStaticLocaleValues();
  if (vkLaunchContext.enabled) {
    state.localeSource = "vk";
    document.documentElement.dataset.vkMode = "true";
    applyLocale("ru", false, false);
    return;
  }
  const documentSource = document.documentElement.dataset.localeSource;
  state.localeSource = ["browser", "query", "route", "stored"].includes(documentSource)
    ? documentSource
    : "browser";
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

  if (state.locale === "es") {
    return [
      "Usa la fotografía adjunta como única referencia visual.",
      "",
      "Transfórmala en una ilustración de pixel art limpia y simplificada, preparada para convertirla después en un patrón de punto de cruz.",
      "",
      "Requisitos:",
      `- usa una resolución de trabajo de exactamente ${width} píxeles cuadrados (celdas) de ancho; calcula la altura proporcionalmente a partir de la foto original;`,
      `- usa como máximo ${colorCount} colores sólidos claramente distinguibles;`,
      "- conserva la silueta, la pose, la composición y los rasgos distintivos; no recortes el sujeto principal;",
      "- combina los detalles finos, el ruido y las texturas en áreas de color grandes y legibles;",
      "- cada píxel debe ser perfectamente cuadrado, del mismo tamaño y contener un solo color;",
      "- usa bordes duros, sin desenfoque, transparencia, degradados, antialiasing ni tramado;",
      "- no añadas cuadrícula, símbolos, etiquetas, texto, marco, textura de tela, cruces ni hilo bordado;",
      "- no cambies el sujeto ni inventes detalles que no estén presentes en la foto;",
      "- simplifica el fondo en unas pocas áreas grandes de color o en un solo color plano si no es importante;",
      "- entrega únicamente la imagen PNG terminada. Para mostrarla, amplíala solo por un factor entero con escalado de vecino más cercano, de modo que los bordes de los píxeles permanezcan nítidos.",
      "",
      "El resultado debe parecer pixel art / bloques de color limpios y ser adecuado para subirlo al generador de patrones Stitchloom.",
    ].join("\n");
  }

  if (state.locale === "de") {
    return [
      "Verwende das angehängte Foto als einzige visuelle Referenz.",
      "",
      "Wandle es in eine klare, vereinfachte Pixel-Art-Illustration um, die für die spätere Umwandlung in eine Kreuzstichvorlage vorbereitet ist.",
      "",
      "Anforderungen:",
      `- verwende eine Arbeitsauflösung von genau ${width} quadratischen Pixeln (Zellen) in der Breite; berechne die Höhe proportional zum Ausgangsfoto;`,
      `- verwende höchstens ${colorCount} klar unterscheidbare Vollfarben;`,
      "- bewahre die erkennbare Silhouette, Pose, Komposition und charakteristischen Merkmale; schneide das Hauptmotiv nicht ab;",
      "- fasse feine Details, Bildrauschen und Texturen zu großen, gut lesbaren Farbflächen zusammen;",
      "- jedes Pixel muss exakt quadratisch, gleich groß und mit genau einer Farbe gefüllt sein;",
      "- verwende harte Kanten ohne Unschärfe, Transparenz, Verläufe, Kantenglättung oder Dithering;",
      "- füge kein Raster, keine Symbole, Beschriftungen, Texte, Rahmen, Stofftexturen, Kreuze oder gestickten Fäden hinzu;",
      "- verändere das Motiv nicht und erfinde keine Details, die auf dem Foto nicht vorhanden sind;",
      "- vereinfache den Hintergrund zu wenigen großen Farbflächen oder einer einzigen Vollfarbe, wenn er nicht wichtig ist;",
      "- gib ausschließlich das fertige PNG-Bild aus. Vergrößere es zur Anzeige nur um einen ganzzahligen Faktor mit Nearest-Neighbor-Skalierung, damit die Pixelkanten scharf bleiben.",
      "",
      "Das Ergebnis soll wie saubere Pixel-Art mit klaren Farbflächen aussehen und sich zum Hochladen in den Stitchloom-Vorlagengenerator eignen.",
    ].join("\n");
  }

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
  elements.detailLevelButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.detailLevel === state.settings.detailLevel));
  });
  elements.paletteMode.value = state.settings.paletteMode;
  elements.fabricCount.value = String(state.settings.fabricCount);

  if (colorCount <= 8) {
    elements.colorGuidance.textContent = t("guidance.low");
  } else if (colorCount <= 32) {
    elements.colorGuidance.textContent = t("guidance.balanced", { colors: colorCount });
  } else if (colorCount <= 64) {
    elements.colorGuidance.textContent = t("guidance.detailed");
  } else {
    elements.colorGuidance.textContent = t("guidance.high");
  }
  updatePhotoPrepControls();
  updateAiPrompt();
}

function updatePhotoPrepControls() {
  const photo = state.settings.photo;
  const controls = [
    [elements.cropZoom, elements.cropZoomValue, photo.cropZoom, "%"],
    [elements.cropX, elements.cropXValue, photo.cropX, ""],
    [elements.cropY, elements.cropYValue, photo.cropY, ""],
    [elements.brightness, elements.brightnessValue, photo.brightness, "%"],
    [elements.contrast, elements.contrastValue, photo.contrast, "%"],
    [elements.saturation, elements.saturationValue, photo.saturation, "%"],
    [elements.soften, elements.softenValue, photo.soften, ""],
  ];
  controls.forEach(([control, output, value, suffix]) => {
    control.value = String(value);
    output.value = String(value) + suffix;
    output.textContent = String(value) + suffix;
  });
  elements.sourcePreview.style.filter =
    `brightness(${photo.brightness}%) contrast(${photo.contrast}%) saturate(${photo.saturation}%) blur(${photo.soften}px)`;
  elements.sourcePreview.style.objectPosition = `${50 + photo.cropX}% ${50 + photo.cropY}%`;
  elements.sourcePreview.style.transform = `rotate(${photo.rotation}deg) scale(${photo.cropZoom / 100})`;
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

  if (state.locale === "en") return `${paletteLength} of ${requestedColors} colors`;
  if (state.locale === "es") return `${paletteLength} de ${requestedColors} colores`;
  if (state.locale === "de") return `${paletteLength} von ${requestedColors} Farben`;
  return `${paletteLength} из ${requestedColors} цветов`;
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

function getProcessedImageDimensions(image = state.image) {
  const width = image?.naturalWidth || image?.width || 1;
  const height = image?.naturalHeight || image?.height || 1;
  const quarterTurn = state.settings.photo.rotation % 180 !== 0;
  return quarterTurn ? { width: height, height: width } : { width, height };
}

function drawProcessedImage(context, image, targetWidth, targetHeight) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const photo = state.settings.photo;
  const { width: orientedWidth, height: orientedHeight } = getProcessedImageDimensions(image);
  const coverScale = Math.max(targetWidth / orientedWidth, targetHeight / orientedHeight);
  const scale = coverScale * photo.cropZoom / 100;

  context.save();
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter =
    `brightness(${photo.brightness}%) contrast(${photo.contrast}%) ` +
    `saturate(${photo.saturation}%) blur(${photo.soften}px)`;
  context.translate(
    targetWidth / 2 + targetWidth * photo.cropX / 100,
    targetHeight / 2 + targetHeight * photo.cropY / 100,
  );
  context.rotate(photo.rotation * Math.PI / 180);
  context.scale(scale, scale);
  context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2);
  context.restore();
}

function createSampleCanvas(image, width, height, scale) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = width * scale;
  sampleCanvas.height = height * scale;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  drawProcessedImage(context, image, sampleCanvas.width, sampleCanvas.height);
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
  const { width: sourceWidth, height: sourceHeight } = getProcessedImageDimensions();
  const aspectRatio = sourceWidth / sourceHeight;
  const height = clamp(Math.round(width / aspectRatio), 16, 220);
  const sampleScale = 4;
  const sampleCanvas = createSampleCanvas(state.image, width, height, sampleScale);
  const rawColors = getCellColors(sampleCanvas, width, height, sampleScale);
  const requestedColors = Number(elements.colorCount.value);
  let paletteColors;
  let localCells;
  if (state.settings.paletteMode === "dmc") {
    const dmcResult = selectDmcPalette(rawColors, DMC_PALETTE, requestedColors);
    paletteColors = dmcResult.colors;
    localCells = dmcResult.cells;
  } else {
    paletteColors = dedupeColors(medianCut(rawColors, requestedColors));
    localCells = rawColors.map((color) => nearestPaletteIndex(color, paletteColors));
  }

  const minimumRegionSize = { easy: 4, balanced: 2, detail: 1 }[state.settings.detailLevel] || 2;
  const cleanedCells = cleanupConfetti(
    localCells,
    width,
    height,
    paletteColors,
    minimumRegionSize,
  );
  const rebuilt = rebuildPaletteUsage(cleanedCells, paletteColors);
  const cells = rebuilt.cells;
  const legend = rebuilt.palette.map((item, index) => {
    const dmc = state.settings.paletteMode === "dmc"
      ? item
      : DMC_PALETTE[nearestPaletteIndex(item, DMC_PALETTE)];
    return {
      r: item.r,
      g: item.g,
      b: item.b,
      hex: state.settings.paletteMode === "dmc" ? dmc.hex : colorToHex(item),
      code: "C" + String(index + 1).padStart(3, "0"),
      dmcCode: dmc.code,
      dmcName: dmc.name,
      count: item.count,
      symbol: symbolForIndex(index),
      isExactDmc: state.settings.paletteMode === "dmc",
    };
  });
  const metrics = analyzePattern(cells, width, height);
  const physical = estimatePhysicalPattern(width, height, state.settings.fabricCount, legend);

  state.pattern = {
    width,
    height,
    cells,
    palette: legend,
    requestedColors,
    totalStitches: width * height,
    detailLevel: state.settings.detailLevel,
    paletteMode: state.settings.paletteMode,
    fabricCount: state.settings.fabricCount,
    metrics,
    physical,
  };
  state.undoStack = [];
  state.redoStack = [];
  state.activePaletteIndex = 0;

  renderPattern();
  setPatternStatus(t("pattern.readyStatus"), "ready");
  elements.patternHeading.textContent = t("pattern.readyHeading");
  const paletteSummary = formatPaletteSummary(legend.length, requestedColors);
  setAutoUpdateStatus(t("auto.ready", { width, height, palette: paletteSummary }), "ready");
  setFileStatus(t("file.patternReady"));
  updateMobileResultBar();
  scheduleAutosave();
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
    drawProcessedImage(context, state.image, canvasWidth, canvasHeight);
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

function formatDecimal(value) {
  return new Intl.NumberFormat(LOCALE_NUMBER_FORMATS[state.locale] || "ru-RU", {
    maximumFractionDigits: 1,
  }).format(value);
}

function refreshPatternAnalysis() {
  if (!state.pattern) return;
  const counts = new Array(state.pattern.palette.length).fill(0);
  state.pattern.cells.forEach((index) => { if (counts[index] !== undefined) counts[index] += 1; });
  state.pattern.palette.forEach((color, index) => { color.count = counts[index]; });
  state.pattern.metrics = analyzePattern(
    state.pattern.cells,
    state.pattern.width,
    state.pattern.height,
  );
  state.pattern.physical = estimatePhysicalPattern(
    state.pattern.width,
    state.pattern.height,
    state.settings.fabricCount,
    state.pattern.palette,
  );
}

function renderInsights() {
  if (!state.pattern) {
    elements.stitchabilityScore.textContent = "—";
    elements.stitchabilityDetails.textContent = "";
    elements.finishedSize.textContent = "—";
    elements.fabricSize.textContent = "";
    elements.materialsEstimate.textContent = "—";
    elements.timeEstimate.textContent = "";
    return;
  }
  const { metrics, physical } = state.pattern;
  elements.stitchabilityScore.textContent = metrics.score + "/100";
  elements.stitchabilityDetails.textContent = t("insights.scoreDetails", {
    isolated: formatNumber(metrics.isolatedStitches),
    regions: formatNumber(metrics.smallRegions),
  });
  elements.finishedSize.textContent =
    `${formatDecimal(physical.stitchedWidthCm)} × ${formatDecimal(physical.stitchedHeightCm)} cm`;
  elements.fabricSize.textContent = t("insights.fabric", {
    count: state.settings.fabricCount,
    width: formatDecimal(physical.fabricWidthCm),
    height: formatDecimal(physical.fabricHeightCm),
  });
  elements.materialsEstimate.textContent = t("insights.materialsValue", {
    skeins: formatNumber(physical.totalSkeins),
  });
  elements.timeEstimate.textContent = t("insights.time", {
    low: formatNumber(physical.hoursLow),
    high: formatNumber(physical.hoursHigh),
  });
}

function updateEditorControls() {
  const hasPattern = Boolean(state.pattern);
  elements.editorToolButtons.forEach((button) => {
    const isActive = button.dataset.editorTool === state.editorTool;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.disabled = !hasPattern;
  });
  elements.editorColor.disabled = !hasPattern || state.editorTool === "none";
  elements.undoEdit.disabled = !state.undoStack.length;
  elements.redoEdit.disabled = !state.redoStack.length;
  elements.patternCanvas.classList.toggle("is-editing", hasPattern && state.editorTool !== "none");
  if (!hasPattern) {
    elements.editorColor.innerHTML = "";
    return;
  }
  if (state.activePaletteIndex >= state.pattern.palette.length) state.activePaletteIndex = 0;
  elements.editorColor.innerHTML = state.pattern.palette.map((color, index) => (
    `<option value="${index}">${escapeHtml(color.symbol)} · ${escapeHtml(color.hex.toUpperCase())} · DMC ${escapeHtml(color.dmcCode)}</option>`
  )).join("");
  elements.editorColor.value = String(state.activePaletteIndex);
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
  elements.legendList.innerHTML = palette.map((color, index) => {
    const dmcPrefix = color.isExactDmc ? "DMC" : "≈ DMC";
    const colorDescription = `${color.hex.toUpperCase()} · ${dmcPrefix} ${color.dmcCode} ${getLocalizedDmcName(color)}`;
    return (
      '<button type="button" class="legend-row" data-palette-index="' + index + '" title="' + escapeHtml(colorDescription) + '">' +
        '<span class="legend-swatch" style="background:' + color.hex + '" aria-hidden="true"></span>' +
        '<span class="legend-symbol">' + escapeHtml(color.symbol) + "</span>" +
        '<span class="legend-code">' + escapeHtml(color.code) + "</span>" +
        '<span class="legend-name">' + escapeHtml(colorDescription) + "</span>" +
        '<span class="legend-count" title="' + escapeHtml(t("legend.stitches")) + '">' + formatNumber(color.count) + "</span>" +
      "</button>"
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
  elements.downloadProject.disabled = !hasPattern;
  elements.saveProject.disabled = !hasPattern;
  updateZoomControls();

  if (!hasPattern) {
    elements.patternHeading.textContent = t("pattern.emptyHeading");
    renderInsights();
    updateEditorControls();
    updateMobileResultBar();
    return;
  }

  const pattern = state.pattern;
  const cellCount = pattern.width * pattern.height;
  elements.patternDimension.textContent = pattern.width + " × " + pattern.height + " " + formatUnit(5, "cell");
  const paletteText = formatPaletteSummary(pattern.palette.length, pattern.requestedColors);
  elements.patternDetails.textContent =
    paletteText +
    " · " + formatNumber(cellCount) + " " + formatUnit(cellCount, "stitch");

  const displaySize = clamp(Math.floor(900 / Math.max(pattern.width, pattern.height)), 7, 20);
  drawPatternToCanvas(elements.patternCanvas, displaySize, state.settings.view);
  applyCanvasZoom();
  renderLegend();
  renderInsights();
  updateEditorControls();
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function loadImageData(dataUrl, metadata = {}, shouldBuild = true) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
      state.image = image;
      state.objectUrl = null;
      state.sourceDataUrl = dataUrl;
      state.fileName = metadata.name || "image";
      state.fileSize = Number(metadata.size) || 0;
      elements.sourcePreview.src = dataUrl;
      elements.fileName.textContent = state.fileName;
      elements.fileMeta.textContent =
        image.naturalWidth + " × " + image.naturalHeight + " px · " + formatBytes(state.fileSize);
      elements.sourceCard.classList.remove("is-hidden");
      elements.dropzone.classList.add("is-hidden");
      elements.photoPrep.classList.remove("is-hidden");
      updatePhotoPrepControls();
      setFileStatus(t("file.ready"));
      if (shouldBuild) schedulePatternBuild(60);
      resolve(image);
    };
    image.onerror = () => reject(new Error("image decode failed"));
    image.src = dataUrl;
  });
}

function getProjectPayload() {
  return {
    format: "stitchloom",
    version: PROJECT_FORMAT_VERSION,
    savedAt: new Date().toISOString(),
    source: state.sourceDataUrl ? {
      name: state.fileName,
      size: state.fileSize,
      dataUrl: state.sourceDataUrl,
    } : null,
    settings: {
      width: Number(elements.sizeSelect.value),
      colorCount: Number(elements.colorCount.value),
      view: state.settings.view,
      showSymbols: state.settings.showSymbols,
      showGrid: state.settings.showGrid,
      detailLevel: state.settings.detailLevel,
      paletteMode: state.settings.paletteMode,
      fabricCount: state.settings.fabricCount,
      photo: { ...state.settings.photo },
    },
    pattern: state.pattern ? {
      ...state.pattern,
      cells: Array.from(state.pattern.cells),
      palette: state.pattern.palette.map((color) => ({ ...color })),
    } : null,
  };
}

function isValidProject(project) {
  if (!project || project.format !== "stitchloom" || project.version !== PROJECT_FORMAT_VERSION) return false;
  if (!project.pattern) return Boolean(project.source?.dataUrl);
  const { width, height, cells, palette } = project.pattern;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) return false;
  if (width * height > 50000 || !Array.isArray(cells) || cells.length !== width * height) return false;
  if (!Array.isArray(palette) || !palette.length || palette.length > 256) return false;
  return cells.every((index) => Number.isInteger(index) && index >= 0 && index < palette.length);
}

function applyProjectSettings(settings = {}) {
  if (settings.width) elements.sizeSelect.value = String(settings.width);
  if (settings.colorCount) setColorCount(settings.colorCount, false);
  state.settings.view = ["pattern", "photo"].includes(settings.view) ? settings.view : "pattern";
  state.settings.showSymbols = settings.showSymbols !== false;
  state.settings.showGrid = settings.showGrid !== false;
  state.settings.detailLevel = ["easy", "balanced", "detail"].includes(settings.detailLevel)
    ? settings.detailLevel : "balanced";
  state.settings.paletteMode = settings.paletteMode === "dmc" ? "dmc" : "adaptive";
  state.settings.fabricCount = [11, 14, 16, 18].includes(Number(settings.fabricCount))
    ? Number(settings.fabricCount) : 14;
  state.settings.photo = { ...state.settings.photo, ...(settings.photo || {}) };
  elements.showSymbols.checked = state.settings.showSymbols;
  elements.showGrid.checked = state.settings.showGrid;
  updateControls();
  updateViewButtons();
}

async function restoreProject(project, fromAutosave = false) {
  if (!isValidProject(project)) throw new Error("invalid project");
  if (state.rebuildTimer) window.clearTimeout(state.rebuildTimer);
  state.rebuildTimer = null;
  state.buildRevision += 1;
  applyProjectSettings(project.settings);
  if (project.source?.dataUrl) {
    await loadImageData(project.source.dataUrl, project.source, false);
  }
  state.pattern = project.pattern ? {
    ...project.pattern,
    cells: Array.from(project.pattern.cells),
    palette: project.pattern.palette.map((color) => ({ ...color })),
  } : null;
  if (state.pattern) refreshPatternAnalysis();
  state.undoStack = [];
  state.redoStack = [];
  state.activePaletteIndex = 0;
  renderPattern();
  setPatternStatus(state.pattern ? t("pattern.readyStatus") : t("pattern.waiting"), state.pattern ? "ready" : "");
  elements.patternHeading.textContent = state.pattern ? t("pattern.readyHeading") : t("pattern.emptyHeading");
  elements.projectStatus.textContent = fromAutosave ? t("project.restored") : t("project.opened");
  elements.projectStatus.classList.remove("is-error");
  state.autosaveRestored = fromAutosave;
}

function openProjectDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(PROJECT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        request.result.createObjectStore(PROJECT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeAutosave(project) {
  const database = await openProjectDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE_NAME, "readwrite");
    transaction.objectStore(PROJECT_STORE_NAME).put(project, PROJECT_AUTOSAVE_KEY);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readAutosave() {
  const database = await openProjectDatabase();
  const project = await new Promise((resolve, reject) => {
    const request = database.transaction(PROJECT_STORE_NAME).objectStore(PROJECT_STORE_NAME).get(PROJECT_AUTOSAVE_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return project;
}

function scheduleAutosave() {
  if (!state.pattern) return;
  if (state.autosaveTimer) window.clearTimeout(state.autosaveTimer);
  state.autosaveTimer = window.setTimeout(async () => {
    state.autosaveTimer = null;
    try {
      await storeAutosave(getProjectPayload());
      elements.projectStatus.textContent = t("project.autosaved");
      elements.projectStatus.classList.remove("is-error");
    } catch {
      // Downloadable project files remain available when browser storage is blocked.
    }
  }, 700);
}

function downloadProjectFile() {
  if (!state.pattern) return;
  try {
    const payload = JSON.stringify(getProjectPayload());
    triggerDownload(
      new Blob([payload], { type: "application/x-stitchloom+json" }),
      `stitchloom-${state.pattern.width}x${state.pattern.height}.stitchloom`,
    );
    elements.projectStatus.textContent = t("project.saved");
    elements.projectStatus.classList.remove("is-error");
    void showVkInterstitialAfterExport();
  } catch {
    elements.projectStatus.textContent = t("project.saveFailed");
    elements.projectStatus.classList.add("is-error");
  }
}

async function openProjectFile(file) {
  if (!file) return;
  if (file.size > MAX_PROJECT_SIZE) {
    elements.projectStatus.textContent = t("project.tooLarge");
    elements.projectStatus.classList.add("is-error");
    return;
  }
  try {
    const project = JSON.parse(await file.text());
    await restoreProject(project);
    scheduleAutosave();
  } catch {
    elements.projectStatus.textContent = t("project.invalid");
    elements.projectStatus.classList.add("is-error");
  } finally {
    elements.projectInput.value = "";
  }
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
  state.sourceDataUrl = "";
  state.pattern = null;
  state.settings.zoom = 100;
  clearLastDownloadUrl();
  elements.fileInput.value = "";
  elements.sourcePreview.removeAttribute("src");
  elements.sourceCard.classList.add("is-hidden");
  elements.photoPrep.classList.add("is-hidden");
  elements.dropzone.classList.remove("is-hidden");
  setAutoUpdateStatus(t("auto.noPhoto"));
  setFileStatus(t("file.local"));
  setPatternStatus(t("pattern.waiting"));
  setExportStatus("");
  renderPattern();
}

async function loadImageFile(file) {
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

  try {
    const dataUrl = await readFileAsDataUrl(file);
    await loadImageData(dataUrl, { name: file.name, size: file.size }, true);
  } catch {
    setFileStatus(t("file.openFailed"), true);
  }
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
    void showVkInterstitialAfterExport();
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
    if (blob) {
      triggerDownload(blob, "stitchloom-" + pattern.width + "x" + pattern.height + ".png");
      void showVkInterstitialAfterExport();
    }
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
  void showVkInterstitialAfterExport();
}

function setEditorTool(tool) {
  state.editorTool = ["none", "pencil", "fill", "eyedropper"].includes(tool) ? tool : "none";
  updateEditorControls();
}

function rememberEdit() {
  if (!state.pattern) return;
  state.undoStack.push(state.pattern.cells.slice());
  if (state.undoStack.length > 50) state.undoStack.shift();
  state.redoStack = [];
}

function commitEditedCells(cells, messageKey) {
  state.pattern.cells = cells;
  refreshPatternAnalysis();
  renderPattern();
  elements.editorStatus.textContent = t(messageKey);
  scheduleAutosave();
}

function editPatternCell(event) {
  if (!state.pattern || state.editorTool === "none" || state.settings.view !== "pattern") return;
  const bounds = elements.patternCanvas.getBoundingClientRect();
  const column = clamp(Math.floor((event.clientX - bounds.left) / bounds.width * state.pattern.width), 0, state.pattern.width - 1);
  const row = clamp(Math.floor((event.clientY - bounds.top) / bounds.height * state.pattern.height), 0, state.pattern.height - 1);
  const cellIndex = row * state.pattern.width + column;
  if (state.editorTool === "eyedropper") {
    state.activePaletteIndex = state.pattern.cells[cellIndex];
    elements.editorStatus.textContent = t("editor.selected", {
      color: state.pattern.palette[state.activePaletteIndex].code,
    });
    updateEditorControls();
    return;
  }
  if (state.pattern.cells[cellIndex] === state.activePaletteIndex) return;
  rememberEdit();
  const nextCells = state.editorTool === "fill"
    ? floodFillCells(
      state.pattern.cells,
      state.pattern.width,
      state.pattern.height,
      cellIndex,
      state.activePaletteIndex,
    )
    : state.pattern.cells.map((value, index) => index === cellIndex ? state.activePaletteIndex : value);
  commitEditedCells(nextCells, state.editorTool === "fill" ? "editor.fillDone" : "editor.pencilDone");
}

function undoEdit() {
  if (!state.pattern || !state.undoStack.length) return;
  state.redoStack.push(state.pattern.cells.slice());
  commitEditedCells(state.undoStack.pop(), "editor.undoDone");
}

function redoEdit() {
  if (!state.pattern || !state.redoStack.length) return;
  state.undoStack.push(state.pattern.cells.slice());
  commitEditedCells(state.redoStack.pop(), "editor.redoDone");
}

function updatePhotoSetting(control) {
  const key = control.id;
  state.settings.photo[key] = Number(control.value);
  updatePhotoPrepControls();
  if (state.image) schedulePatternBuild(140);
}

function resetPhotoPreparation() {
  state.settings.photo = {
    cropZoom: 100,
    cropX: 0,
    cropY: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    soften: 0,
    rotation: 0,
  };
  updatePhotoPrepControls();
  elements.projectStatus.textContent = t("prep.resetDone");
  if (state.image) schedulePatternBuild(60);
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
elements.detailLevelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.settings.detailLevel = button.dataset.detailLevel;
    updateControls();
    if (state.image) schedulePatternBuild();
  });
});
elements.paletteMode.addEventListener("change", () => {
  state.settings.paletteMode = elements.paletteMode.value === "dmc" ? "dmc" : "adaptive";
  if (state.image) schedulePatternBuild();
});
elements.fabricCount.addEventListener("change", () => {
  state.settings.fabricCount = Number(elements.fabricCount.value) || 14;
  if (state.pattern) {
    refreshPatternAnalysis();
    renderInsights();
    scheduleAutosave();
  }
});
[
  elements.cropZoom,
  elements.cropX,
  elements.cropY,
  elements.brightness,
  elements.contrast,
  elements.saturation,
  elements.soften,
].forEach((control) => control.addEventListener("input", () => updatePhotoSetting(control)));
elements.rotatePhoto.addEventListener("click", () => {
  state.settings.photo.rotation = (state.settings.photo.rotation + 90) % 360;
  updatePhotoPrepControls();
  if (state.image) schedulePatternBuild(60);
});
elements.resetPhotoPrep.addEventListener("click", resetPhotoPreparation);
elements.openProject.addEventListener("click", () => elements.projectInput.click());
elements.projectInput.addEventListener("change", (event) => openProjectFile(event.target.files[0]));
elements.saveProject.addEventListener("click", downloadProjectFile);
elements.downloadProject.addEventListener("click", downloadProjectFile);
elements.copyAiPrompt.addEventListener("click", copySimplificationPrompt);
elements.localeChoices.forEach((button) => {
  button.addEventListener("click", () => {
    elements.localePicker.open = false;
    applyLocale(button.dataset.localeChoice, true);
  });
});
window.addEventListener("languagechange", () => {
  if (vkLaunchContext.enabled || state.localeSource !== "browser") return;
  applyLocale(detectBrowserLocale());
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
elements.localePicker.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !elements.localePicker.open) return;
  event.preventDefault();
  elements.localePicker.open = false;
  elements.localePickerSummary.focus();
});
elements.themePicker.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !elements.themePicker.open) return;
  event.preventDefault();
  elements.themePicker.open = false;
  elements.themePickerSummary.focus();
});
document.addEventListener("click", (event) => {
  if (elements.localePicker.open && !elements.localePicker.contains(event.target)) {
    elements.localePicker.open = false;
  }
  if (elements.themePicker.open && !elements.themePicker.contains(event.target)) {
    elements.themePicker.open = false;
  }
});
elements.localePicker.addEventListener("toggle", () => {
  if (elements.localePicker.open) elements.themePicker.open = false;
});
elements.themePicker.addEventListener("toggle", () => {
  if (elements.themePicker.open) elements.localePicker.open = false;
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
  scheduleAutosave();
});
elements.showGrid.addEventListener("change", () => {
  state.settings.showGrid = elements.showGrid.checked;
  renderPattern();
  scheduleAutosave();
});
elements.editorToolButtons.forEach((button) => {
  button.addEventListener("click", () => setEditorTool(button.dataset.editorTool));
});
elements.editorColor.addEventListener("change", () => {
  state.activePaletteIndex = Number(elements.editorColor.value) || 0;
  elements.editorStatus.textContent = t("editor.selected", {
    color: state.pattern?.palette[state.activePaletteIndex]?.code || "",
  });
});
elements.undoEdit.addEventListener("click", undoEdit);
elements.redoEdit.addEventListener("click", redoEdit);
elements.legendList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-palette-index]");
  if (!row || !state.pattern) return;
  state.activePaletteIndex = Number(row.dataset.paletteIndex) || 0;
  if (state.editorTool === "none") setEditorTool("pencil");
  updateEditorControls();
  elements.editorStatus.textContent = t("editor.selected", {
    color: state.pattern.palette[state.activePaletteIndex].code,
  });
});
elements.patternCanvas.addEventListener("pointerdown", (event) => {
  if (state.editorTool === "none") return;
  event.preventDefault();
  event.stopPropagation();
  editPatternCell(event);
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
window.addEventListener("pagehide", () => {
  if (vkLaunchContext.enabled) void vkBridgeService.hideBannerAd();
});

if ("IntersectionObserver" in window) {
  const patternObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    state.patternInView = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.12);
    updateMobileResultBar();
  }, { threshold: [0, 0.12, 0.5] });
  patternObserver.observe(elements.patternPanel);
}

async function restoreAutosaveOnStart() {
  try {
    const project = await readAutosave();
    if (project && isValidProject(project)) await restoreProject(project, true);
  } catch {
    // Private browsing and restricted storage simply start with an empty project.
  }
}

if ("launchQueue" in window && "LaunchParams" in window) {
  window.launchQueue.setConsumer(async (launchParams) => {
    const handle = launchParams.files?.[0];
    if (handle) await openProjectFile(await handle.getFile());
  });
}

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("./sw.js", import.meta.url), { scope: "./" }).catch(() => {});
  });
}

initLocale();
initTheme();
void initVkMode();
updateControls();
updateViewButtons();
renderPattern();
setPatternStatus(t("pattern.waiting"));
setAutoUpdateStatus(t("auto.noPhoto"));
setFileStatus(t("file.local"));
initOnboarding();
restoreAutosaveOnStart();
