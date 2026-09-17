import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "dist/index.html"), "utf8");
const pages = {
  ru: {
    title: "Stitchloom — схема вышивки из фото",
    description: "Превратите фотографию в схему вышивки крестиком прямо в браузере: квадратные клетки, 2–256 цветов, экспорт PDF, PNG и CSV.",
    heading: "Фото в вышивку.<br /><em>Клетка за клеткой.</em>",
  },
  en: {
    title: "Stitchloom — cross-stitch pattern from a photo",
    description: "Turn a photo into a cross-stitch pattern directly in your browser: square cells, 2–256 colors, and PDF, PNG, or CSV export.",
    heading: "Photo to stitches.<br /><em>Cell by cell.</em>",
  },
  es: {
    title: "Stitchloom — patrón de punto de cruz desde una foto",
    description: "Convierte una foto en un patrón de punto de cruz directamente en tu navegador: celdas cuadradas, de 2 a 256 colores y exportación a PDF, PNG o CSV.",
    heading: "De foto a puntadas.<br /><em>Celda a celda.</em>",
  },
  de: {
    title: "Stitchloom — Kreuzstichvorlage aus einem Foto",
    description: "Verwandle ein Foto direkt im Browser in eine Kreuzstichvorlage: quadratische Zellen, 2–256 Farben sowie PDF-, PNG- und CSV-Export.",
    heading: "Vom Foto zum Stich.<br /><em>Zelle für Zelle.</em>",
  },
};

for (const [locale, copy] of Object.entries(pages)) {
  const canonical = `https://stitchloom.antonlenev.chatgpt.site/${locale}/`;
  let html = source
    .replace(
      /<html lang="ru" data-locale="ru"/,
      `<html lang="${locale}" data-locale="${locale}" data-route-locale="${locale}"`,
    )
    .replace("<head>", "<head>\n    <base href=\"../\" />")
    .replace(
      /<link id="canonicalUrl" rel="canonical" href="[^"]+" \/>/,
      `<link id="canonicalUrl" rel="canonical" href="${canonical}" />`,
    )
    .replace(/<meta id="ogUrl" property="og:url" content="[^"]+" \/>/, `<meta id="ogUrl" property="og:url" content="${canonical}" />`)
    .replace(/<title data-i18n="meta.title">[^<]+<\/title>/, `<title data-i18n="meta.title">${copy.title}</title>`)
    .replace(
      /(<meta\s+data-i18n-content="meta.description"\s+name="description"\s+content=")[^"]+("\s*\/?>)/,
      `$1${copy.description}$2`,
    )
    .replace(
      /(<h1 id="page-title" data-i18n-html="hero.title">)[\s\S]*?(<\/h1>)/,
      `$1${copy.heading}$2`,
    );

  const targetDirectory = resolve(root, "dist", locale);
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(resolve(targetDirectory, "index.html"), html);
}

console.log(`Built ${Object.keys(pages).length} localized pages.`);
