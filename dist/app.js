const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_GRID_WIDTH = 70;
const MIN_ZOOM = 50;
const MAX_ZOOM = 300;
const ZOOM_STEP = 25;

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
  colorCountValue: $("colorCountValue"),
  rebuildButton: $("rebuildButton"),
  patternHeading: $("pattern-heading"),
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
  viewButtons: Array.from(document.querySelectorAll("[data-view]")),
};

const state = {
  image: null,
  objectUrl: null,
  fileName: "",
  fileSize: 0,
  pattern: null,
  lastDownloadUrl: null,
  settings: {
    view: "pattern",
    showSymbols: true,
    showGrid: true,
    zoom: 100,
  },
};

const SYMBOLS = [
  "■", "●", "▲", "◆", "✚", "×", "○", "□",
  "△", "◇", "★", "∗", "⌁", "≋", "◉", "◌",
  "⊕", "▦", "⋆", "♢", "⊗", "⊙", "◊", "✧",
];

const DMC_PALETTE = [
  { code: "B5200", name: "Белый", hex: "#ffffff", r: 255, g: 255, b: 255 },
  { code: "3865", name: "Зимний белый", hex: "#f4f0e6", r: 244, g: 240, b: 230 },
  { code: "762", name: "Жемчужно-серый, светлый", hex: "#d7d0c4", r: 215, g: 208, b: 196 },
  { code: "318", name: "Стальной серый, светлый", hex: "#a7abb0", r: 167, g: 171, b: 176 },
  { code: "414", name: "Стальной серый, тёмный", hex: "#73777a", r: 115, g: 119, b: 122 },
  { code: "535", name: "Графитовый серый", hex: "#55585a", r: 85, g: 88, b: 90 },
  { code: "413", name: "Серый, тёмный", hex: "#44484a", r: 68, g: 72, b: 74 },
  { code: "3799", name: "Серый, очень тёмный", hex: "#25292b", r: 37, g: 41, b: 43 },
  { code: "310", name: "Чёрный", hex: "#171719", r: 23, g: 23, b: 25 },
  { code: "3371", name: "Коричневый, почти чёрный", hex: "#30201d", r: 48, g: 32, b: 29 },
  { code: "754", name: "Персиковый, светлый", hex: "#f1c7ae", r: 241, g: 199, b: 174 },
  { code: "210", name: "Розовый, тёмный", hex: "#c87878", r: 200, g: 120, b: 120 },
  { code: "3712", name: "Лососевый, тёмный", hex: "#ad5b5e", r: 173, g: 91, b: 94 },
  { code: "962", name: "Пыльная роза, средний", hex: "#d18d94", r: 209, g: 141, b: 148 },
  { code: "3803", name: "Розово-лиловый, светлый", hex: "#ad6b7b", r: 173, g: 107, b: 123 },
  { code: "321", name: "Красный", hex: "#bd2435", r: 189, g: 36, b: 53 },
  { code: "606", name: "Красно-оранжевый", hex: "#ef4c3c", r: 239, g: 76, b: 60 },
  { code: "782", name: "Топаз, тёмный", hex: "#ad7b3d", r: 173, g: 123, b: 61 },
  { code: "783", name: "Топаз, средний", hex: "#c39a59", r: 195, g: 154, b: 89 },
  { code: "3047", name: "Жёлтый, очень светлый", hex: "#e9dca4", r: 233, g: 220, b: 164 },
  { code: "3346", name: "Охотничий зелёный", hex: "#64814b", r: 100, g: 129, b: 75 },
  { code: "702", name: "Келли-зелёный", hex: "#5a9a5a", r: 90, g: 154, b: 90 },
  { code: "890", name: "Фисташковый, тёмный", hex: "#417342", r: 65, g: 115, b: 66 },
  { code: "799", name: "Синий Delft, средний", hex: "#3c6290", r: 60, g: 98, b: 144 },
  { code: "820", name: "Королевский синий, тёмный", hex: "#263f72", r: 38, g: 63, b: 114 },
  { code: "3325", name: "Синий, светлый", hex: "#8ca4c2", r: 140, g: 164, b: 194 },
  { code: "550", name: "Фиолетовый, тёмный", hex: "#684c79", r: 104, g: 76, b: 121 },
  { code: "718", name: "Сливовый", hex: "#a44770", r: 164, g: 71, b: 112 },
  { code: "3862", name: "Мокко, средний", hex: "#a47756", r: 164, g: 119, b: 86 },
  { code: "3866", name: "Мокко, очень светлый", hex: "#f0ddc1", r: 240, g: 221, b: 193 },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function plural(value, one, few, many) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return Math.max(1, Math.round(bytes / 1024)) + " КБ";
  }
  return (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " МБ";
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

function setExportStatus(message, isError) {
  elements.exportStatus.textContent = message;
  elements.exportStatus.classList.toggle("is-error", Boolean(isError));
}

function updateControls() {
  const width = Number(elements.sizeSelect.value || DEFAULT_GRID_WIDTH);
  const colorCount = Number(elements.colorCount.value);
  elements.sizeValue.textContent = width + " " + plural(width, "клетка", "клетки", "клеток");
  elements.colorCountValue.textContent = String(colorCount);
}

function updateZoomControls() {
  const hasPattern = Boolean(state.pattern);
  const zoom = state.settings.zoom;
  elements.zoomValue.textContent = zoom + "%";
  elements.zoomReset.setAttribute(
    "aria-label",
    "Текущий масштаб " + zoom + " процентов. Сбросить до 100 процентов",
  );
  elements.zoomOut.disabled = !hasPattern || zoom <= MIN_ZOOM;
  elements.zoomReset.disabled = !hasPattern;
  elements.zoomIn.disabled = !hasPattern || zoom >= MAX_ZOOM;
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
  return String(index + 1).padStart(3, "0");
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

function buildPattern() {
  if (!state.image) return;

  setPatternStatus("Собираю схему…", "busy");
  elements.patternHeading.textContent = "Считаю клетки и подбираю цвета";

  const width = Number(elements.sizeSelect.value);
  const sourceWidth = state.image.naturalWidth || state.image.width;
  const sourceHeight = state.image.naturalHeight || state.image.height;
  const aspectRatio = sourceWidth / sourceHeight;
  const height = clamp(Math.round(width / aspectRatio), 16, 220);
  const sampleScale = 4;
  const sampleCanvas = createSampleCanvas(state.image, width, height, sampleScale);
  const rawColors = getCellColors(sampleCanvas, width, height, sampleScale);
  const requestedColors = Number(elements.colorCount.value);
  const quantizedColors = medianCut(rawColors, requestedColors);
  const localCells = rawColors.map((color) => nearestColorIndex(color, quantizedColors));
  const localCounts = new Array(quantizedColors.length).fill(0);

  localCells.forEach((index) => {
    localCounts[index] += 1;
  });

  const ordered = quantizedColors
    .map((color, index) => ({ color, index, count: localCounts[index] }))
    .sort((a, b) => b.count - a.count);
  const remap = new Map();

  ordered.forEach((item, index) => {
    remap.set(item.index, index);
  });

  const cells = localCells.map((index) => remap.get(index));
  const legend = ordered.map((item, index) => ({
    ...item.color,
    hex: colorToHex(item.color),
    code: "C" + String(index + 1).padStart(3, "0"),
    dmcCode: DMC_PALETTE[nearestColorIndex(item.color, DMC_PALETTE)].code,
    dmcName: DMC_PALETTE[nearestColorIndex(item.color, DMC_PALETTE)].name,
    count: item.count,
    symbol: symbolForIndex(index),
  }));

  state.pattern = {
    width,
    height,
    cells,
    palette: legend,
    totalStitches: width * height,
  };

  renderPattern();
  elements.rebuildButton.disabled = false;
  setPatternStatus("Схема готова", "ready");
  elements.patternHeading.textContent = "Схема готова к вышивке";
  setFileStatus("Готово. Можно менять размер и количество цветов — фото останется локальным.");
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

function renderLegend() {
  if (!state.pattern) {
    elements.legendList.innerHTML = "";
    elements.legendCount.textContent = "0 цветов";
    return;
  }

  const palette = state.pattern.palette;
  elements.legendCount.textContent = palette.length + " " + plural(palette.length, "цвет", "цвета", "цветов");
  elements.legendList.innerHTML = palette.map((color) => {
    return (
      '<div class="legend-row">' +
        '<span class="legend-swatch" style="background:' + color.hex + '" aria-label="' + color.hex.toUpperCase() + '"></span>' +
        '<span class="legend-symbol">' + color.symbol + "</span>" +
        '<span class="legend-code">' + color.code + "</span>" +
        '<span class="legend-name">' + color.hex.toUpperCase() + " · ≈ DMC " + color.dmcCode + " " + color.dmcName + "</span>" +
        '<span class="legend-count">' + formatNumber(color.count) + "</span>" +
      "</div>"
    );
  }).join("");
}

function renderPattern() {
  const hasPattern = Boolean(state.pattern);
  elements.emptyState.classList.toggle("is-hidden", hasPattern);
  elements.patternResult.classList.toggle("is-hidden", !hasPattern);
  elements.downloadPdf.disabled = !hasPattern || elements.downloadPdf.classList.contains("is-busy");
  elements.downloadPng.disabled = !hasPattern;
  elements.downloadCsv.disabled = !hasPattern;
  updateZoomControls();

  if (!hasPattern) {
    elements.patternHeading.textContent = "Ваша схема появится здесь";
    return;
  }

  const pattern = state.pattern;
  const cellCount = pattern.width * pattern.height;
  elements.patternDimension.textContent = pattern.width + " × " + pattern.height + " клеток";
  elements.patternDetails.textContent =
    pattern.palette.length + " " + plural(pattern.palette.length, "цвет", "цвета", "цветов") +
    " · " + formatNumber(cellCount) + " " + plural(cellCount, "стежок", "стежка", "стежков");

  const displaySize = clamp(Math.floor(900 / Math.max(pattern.width, pattern.height)), 7, 20);
  drawPatternToCanvas(elements.patternCanvas, displaySize, state.settings.view);
  applyCanvasZoom();
  renderLegend();
}

function updateViewButtons() {
  elements.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.settings.view);
  });
}

function clearImage() {
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
  elements.rebuildButton.disabled = true;
  setFileStatus("Всё считается локально: файл не загружается на сервер.");
  setPatternStatus("Ждёт фото");
  setExportStatus("");
  renderPattern();
}

function loadImageFile(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith("image/")) {
    setFileStatus("Нужен файл изображения: PNG, JPG, WEBP или GIF.", true);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setFileStatus("Файл слишком большой. Максимальный размер — 20 МБ.", true);
    return;
  }

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
    elements.rebuildButton.disabled = false;
    setFileStatus("Изображение готово. Схема строится локально в этом окне.");
    buildPattern();
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    setFileStatus("Не получилось открыть изображение. Попробуйте другой файл.", true);
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
  elements.exportStatus.textContent = "PDF готов. ";
  const retryLink = document.createElement("a");
  retryLink.href = url;
  retryLink.download = filename;
  retryLink.target = "_blank";
  retryLink.rel = "noopener";
  retryLink.textContent = "Скачать ещё раз";
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
    reader.onerror = () => reject(reader.error || new Error("Не удалось прочитать страницу PDF"));
    reader.readAsArrayBuffer(blob);
  });
}

function canvasToJpegBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Не удалось подготовить страницу PDF"));
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
  context.fillText("Схема создана локально — stitchloom", margin, footerY);
  context.textAlign = "right";
  context.fillText("Страница " + pageNumber + " / " + layout.totalPages, page.width - margin, footerY);
  context.textAlign = "left";
}

function drawPdfCover(context, layout, pattern, fileName) {
  const { page, margin } = layout;
  drawPdfChrome(context, layout, 1, "ОБЗОР СХЕМЫ");

  context.fillStyle = "#141819";
  context.font = "800 52px Arial, sans-serif";
  context.fillText("Схема для вышивки", margin, 148);
  context.fillStyle = "#5058bd";
  context.font = "italic 700 40px Georgia, serif";
  context.fillText("клетка за клеткой", margin, 198);

  context.fillStyle = "#6c706d";
  context.font = "600 16px Arial, sans-serif";
  context.fillText(
    fitCanvasText(context, fileName || "Изображение", page.width - margin * 2),
    margin,
    238,
  );

  const cardGap = 16;
  const cardWidth = (page.width - margin * 2 - cardGap * 2) / 3;
  const cardY = 270;
  const cardValues = [
    { label: "РАЗМЕР", value: pattern.width + " × " + pattern.height },
    { label: "ЦВЕТОВ", value: String(pattern.palette.length) },
    { label: "СТЕЖКОВ", value: formatNumber(pattern.totalStitches) },
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
  context.fillText("ДЕТАЛЬНАЯ СЕТКА И КЛЮЧ ЦВЕТОВ — НА СЛЕДУЮЩИХ СТРАНИЦАХ", margin, page.height - 94);
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
    "СЕТКА " + (tileRow * tileColumns + tileColumn + 1) + " / " + (tileColumns * tileRows),
  );
  context.fillStyle = "#141819";
  context.font = "800 31px Arial, sans-serif";
  context.fillText("Квадратная схема 1:1", margin, margin + 61);
  context.fillStyle = "#6c706d";
  context.font = "600 15px Arial, sans-serif";
  context.fillText(
    "Столбцы " + (columnStart + 1) + "–" + columnEnd + " · ряды " + (rowStart + 1) + "–" + rowEnd,
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
    context.fillText("Толстая линия — каждые 10 клеток", noteX, gridY + 17);
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
    "КЛЮЧ " + (legendPageIndex + 1) + " / " + legendPageCount,
  );
  context.fillStyle = "#141819";
  context.font = "800 31px Arial, sans-serif";
  context.fillText("Цвета и символы", margin, margin + 61);
  context.fillStyle = "#6c706d";
  context.font = "600 15px Arial, sans-serif";
  context.fillText("Оттенки на экране приблизительные — сверяйтесь с физическим каталогом мулине.", margin, margin + 91);

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
      fitCanvasText(context, "≈ DMC " + color.dmcCode + " · " + color.dmcName, textWidth),
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
  elements.downloadPdfLabel.textContent = "Готовлю PDF…";
  setExportStatus("Собираю страницы: 0 / " + layout.totalPages);
  await nextPaint();

  const addPage = async (drawPage) => {
    const canvas = createPdfCanvas(layout);
    const context = canvas.getContext("2d");
    drawPage(context);
    await appendPdfCanvasPage(pages, canvas, layout);
    completedPages += 1;
    setExportStatus("Собираю страницы: " + completedPages + " / " + layout.totalPages);
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

    setExportStatus("Упаковываю PDF…");
    await nextPaint();
    const pdfBytes = buildImagePdf(pages);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const filename = "stitchloom-" + pattern.width + "x" + pattern.height + ".pdf";
    offerPdfDownload(blob, filename);
  } catch (error) {
    console.error(error);
    setExportStatus("Не удалось собрать PDF. Попробуйте уменьшить размер схемы.", true);
  } finally {
    elements.downloadPdf.classList.remove("is-busy");
    elements.downloadPdf.removeAttribute("aria-busy");
    elements.downloadPdfLabel.textContent = "Скачать PDF";
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
  if (state.image) buildPattern();
});
elements.colorCount.addEventListener("input", updateControls);
elements.colorCount.addEventListener("change", () => {
  if (state.image) buildPattern();
});
elements.rebuildButton.addEventListener("click", buildPattern);
elements.showSymbols.addEventListener("change", () => {
  state.settings.showSymbols = elements.showSymbols.checked;
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
window.addEventListener("resize", () => {
  if (state.pattern) renderPattern();
});
window.addEventListener("beforeunload", clearLastDownloadUrl);

updateControls();
updateViewButtons();
renderPattern();
