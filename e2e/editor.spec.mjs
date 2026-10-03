import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function prepare(page) {
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') { external.push(url.origin); return route.abort(); }
    return route.continue();
  });
  await page.addInitScript(() => { localStorage.setItem('stitchloom:onboarding:v1', '1'); });
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  return { errors, external };
}
async function upload(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 32;
    const context = canvas.getContext('2d'); context.fillStyle = '#ff0000'; context.fillRect(0, 0, 32, 32);
    context.fillStyle = '#0000ff'; context.fillRect(32, 0, 32, 32);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#sizeSelect').selectOption('36');
  await page.locator('#fileInput').setInputFiles({ name: 'synthetic-landscape.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await expect(page.locator('#downloadProject')).toBeEnabled();
  await expect(page.locator('#patternDimension')).toContainText('36 × 18');
}
async function download(page, id) {
  const pending = page.waitForEvent('download'); await page.locator(id).click();
  const result = await pending; return readFile(await result.path());
}
const snapshot = page => page.evaluate(() => ({ pixels: document.querySelector('#patternCanvas').toDataURL(), size: document.querySelector('#sizeSelect').value, dimension: document.querySelector('#patternDimension').textContent, source: document.querySelector('#sourcePreview').src }));

test('local photo, square PNG, CSV, PDF and project round-trip remain consistent', async ({ page }, info) => {
  const state = await prepare(page); await upload(page);
  const project = JSON.parse((await download(page, '#downloadProject')).toString());
  expect(project.pattern.cells).toHaveLength(36 * 18);
  expect(project.pattern.palette.length).toBeLessThanOrEqual(16);
  expect(project.pattern.palette.reduce((sum, color) => sum + color.count, 0)).toBe(36 * 18);
  const png = await download(page, '#downloadPng');
  // PNG IHDR stores big-endian pixel width/height without needing another library.
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.readUInt32BE(16) / 36).toBe(png.readUInt32BE(20) / 18);
  const csv = (await download(page, '#downloadCsv')).toString().trim();
  expect(csv.split('\n')).toHaveLength(36 * 18 + 1);
  const pdf = await download(page, '#downloadPdf');
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.toString('latin1')).toContain('/Type /Page');
  const before = await snapshot(page);
  await page.locator('#zoomIn').click();
  expect((await download(page, '#downloadPng')).equals(png)).toBe(true);
  await page.locator('#projectInput').setInputFiles({ name: 'roundtrip.stitchloom', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)) });
  await expect(page.locator('#projectStatus')).toContainText(/opened/i);
  expect((await snapshot(page)).pixels).toBe(before.pixels);
  await page.screenshot({ path: info.outputPath('editor-roundtrip.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(state.errors).toEqual([]); expect(state.external).toEqual([]);
});

test('invalid projects cannot request external images, inject markup, or alter the open project', async ({ page }) => {
  const state = await prepare(page); await upload(page);
  const project = JSON.parse((await download(page, '#downloadProject')).toString());
  const before = await snapshot(page);
  const cases = [];
  const remote = structuredClone(project); remote.source.dataUrl = 'https://example.invalid/unrequested-image.png'; cases.push(remote);
  const svg = structuredClone(project); svg.source.dataUrl = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/unrequested-image.png"/></svg>').toString('base64'); cases.push(svg);
  const markup = structuredClone(project); markup.pattern.palette[0].hex = '#000000" data-invalid="marker'; cases.push(markup);
  const brokenRaster = structuredClone(project); brokenRaster.source.dataUrl = 'data:image/png;base64,aGVsbG8='; brokenRaster.settings.width = 110; cases.push(brokenRaster);
  for (const invalid of cases) {
    await page.locator('#projectInput').setInputFiles({ name: 'invalid.stitchloom', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await expect.poll(() => page.locator('#projectInput').evaluate(input => input.files.length)).toBe(0);
    await expect(page.locator('#projectStatus')).toHaveClass(/is-error/);
    expect(await snapshot(page)).toEqual(before);
    expect(await page.locator('[data-invalid]').count()).toBe(0);
  }
  expect(state.external).toEqual([]); expect(state.errors).toEqual([]);
});

test('language pages, manual language and dark theme survive reload', async ({ page }, info) => {
  const state = await prepare(page);
  for (const locale of ['ru', 'en', 'es', 'de']) {
    await page.goto(`/${locale}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('#canonicalUrl')).toHaveAttribute('href', `https://stitchloom.ru/${locale}/`);
    await expect(page.locator('#dropzone')).toBeVisible();
  }
  await page.locator('#localePicker').evaluate(element => { element.open = true; });
  await page.locator('[data-locale-choice=es]').click();
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.locator('#themePicker').evaluate(element => { element.open = true; });
  await page.locator('[data-theme-choice=dark]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: info.outputPath('localized-dark.png'), fullPage: true });
  expect(state.errors).toEqual([]);
});

test('current real Bridge bundle initializes once with an isolated host fixture', async ({ page }) => {
  const state = await prepare(page);
  await page.addInitScript(() => {
    window.bridgeCalls = [];
    window.AndroidBridge = {};
    for (const method of ['VKWebAppInit', 'VKWebAppShowBannerAd', 'VKWebAppCheckNativeAds', 'VKWebAppShowNativeAds', 'VKWebAppShowStoryBox']) {
      window.AndroidBridge[method] = raw => {
        const params = JSON.parse(raw); window.bridgeCalls.push(method);
        setTimeout(() => window.dispatchEvent(new CustomEvent('VKWebAppEvent', { detail: { type: method + 'Result', data: { request_id: params.request_id, result: method !== 'VKWebAppCheckNativeAds' } } })), 0);
      };
    }
  });
  await page.goto('/?vk_app_id=54777468&vk_user_id=101&vk_platform=mobile_web&sign=synthetic');
  await expect(page.locator('html')).toHaveAttribute('data-vk-mode', 'true');
  await expect.poll(() => page.evaluate(() => window.bridgeCalls.filter(method => method === 'VKWebAppShowBannerAd').length)).toBe(1);
  expect(await page.evaluate(() => window.bridgeCalls.filter(method => method === 'VKWebAppInit').length)).toBe(1);
  await expect(page.locator('#localePicker')).toBeHidden();
  expect(state.errors).toEqual([]);
});
