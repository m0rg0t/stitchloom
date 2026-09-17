const MAX_FILE_SIZE = 20 * 1024 * 1024;
const DEFAULT_GRID_WIDTH = 70;

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
  showSymbols: $("showSymbols"),
  showGrid: $("showGrid"),
  legendCount: $("legendCount"),
  legendList: $("legendList"),
  downloadPng: $("downloadPng"),
  downloadCsv: $("downloadCsv"),
  viewButtons: Array.from(document.querySelectorAll("[data-view]")),
};

const state = {
  image: null,
  objectUrl: null,
  fileName: "",
  fileSize: 0,
  pattern: null,
  settings: {
    view: "pattern",
    showSymbols: true,
    showGrid: true,
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

function updateControls() {
  const width = Number(elements.sizeSelect.value || DEFAULT_GRID_WIDTH);
  const colorCount = Number(elements.colorCount.value);
  elements.sizeValue.textContent = width + " " + plural(width, "клетка", "клетки", "клеток");
  elements.colorCountValue.textContent = String(colorCount);
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

function createSampleCanvas(image, width, height) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = width;
  sampleCanvas.height = height;
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  return sampleCanvas;
}

function buildPattern() {
  if (!state.image) return;

  setPatternStatus("Собираю схему…", "busy");
  elements.patternHeading.textContent = "Считаю клетки и подбираю цвета";

  const width = Number(elements.sizeSelect.value);
  const sourceWidth = state.image.naturalWidth || state.image.width;
  const sourceHeight = state.image.naturalHeight || state.image.height;
  const aspectRatio = sourceWidth / sourceHeight;
  const height = clamp(Math.round(width / aspectRatio), 16, 140);
  const sampleCanvas = createSampleCanvas(state.image, width, height);
  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = context.getImageData(0, 0, width, height).data;
  const rawColors = [];
  const fullCounts = new Array(DMC_PALETTE.length).fill(0);

  for (let index = 0; index < pixels.length; index += 4) {
    const color = {
      r: pixels[index],
      g: pixels[index + 1],
      b: pixels[index + 2],
    };
    rawColors.push(color);
    const paletteIndex = nearestColorIndex(color, DMC_PALETTE);
    fullCounts[paletteIndex] += 1;
  }

  const ranked = DMC_PALETTE
    .map((entry, index) => ({ entry, index, count: fullCounts[index] }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const requestedColors = Number(elements.colorCount.value);
  const selected = ranked.slice(0, requestedColors);
  const selectedColors = selected.map((item) => item.entry);
  const localCells = rawColors.map((color) => nearestColorIndex(color, selectedColors));
  const localCounts = new Array(selected.length).fill(0);

  localCells.forEach((index) => {
    localCounts[index] += 1;
  });

  const ordered = selected
    .map((item, index) => ({ entry: item.entry, index, count: localCounts[index] }))
    .sort((a, b) => b.count - a.count);
  const remap = new Map();

  ordered.forEach((item, index) => {
    remap.set(item.index, index);
  });

  const cells = localCells.map((index) => remap.get(index));
  const legend = ordered.map((item, index) => ({
    ...item.entry,
    count: item.count,
    symbol: SYMBOLS[index % SYMBOLS.length],
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
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.maxWidth = "100%";
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
        '<span class="legend-swatch" style="background:' + color.hex + '" aria-label="' + color.name + '"></span>' +
        '<span class="legend-symbol">' + color.symbol + "</span>" +
        '<span class="legend-code">DMC ' + color.code + "</span>" +
        '<span class="legend-name">' + color.name + "</span>" +
        '<span class="legend-count">' + formatNumber(color.count) + "</span>" +
      "</div>"
    );
  }).join("");
}

function renderPattern() {
  const hasPattern = Boolean(state.pattern);
  elements.emptyState.classList.toggle("is-hidden", hasPattern);
  elements.patternResult.classList.toggle("is-hidden", !hasPattern);
  elements.downloadPng.disabled = !hasPattern;
  elements.downloadCsv.disabled = !hasPattern;

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
  elements.fileInput.value = "";
  elements.sourcePreview.removeAttribute("src");
  elements.sourceCard.classList.add("is-hidden");
  elements.dropzone.classList.remove("is-hidden");
  elements.rebuildButton.disabled = true;
  setFileStatus("Всё считается локально: файл не загружается на сервер.");
  setPatternStatus("Ждёт фото");
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
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
  const rows = ["row;column;DMC;color;symbol"];
  pattern.cells.forEach((paletteIndex, index) => {
    const color = pattern.palette[paletteIndex];
    const row = Math.floor(index / pattern.width) + 1;
    const column = (index % pattern.width) + 1;
    rows.push([
      row,
      column,
      "DMC " + color.code,
      color.name,
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
elements.viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.settings.view = button.dataset.view;
    updateViewButtons();
    renderPattern();
  });
});
elements.downloadPng.addEventListener("click", downloadPng);
elements.downloadCsv.addEventListener("click", downloadCsv);
window.addEventListener("resize", () => {
  if (state.pattern) renderPattern();
});

updateControls();
updateViewButtons();
renderPattern();
