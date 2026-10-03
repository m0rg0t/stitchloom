import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidProject } from '../dist/project-format.js';
const color = { r: 0, g: 0, b: 0, hex: '#000000', symbol: '■', code: 'C001', dmcCode: '310', dmcName: { en: 'Black', ru: 'Чёрный' }, count: 1 };
const project = () => ({ format: 'stitchloom', version: 1, source: null, settings: { width: 52, colorCount: 16, photo: { cropZoom: 100, cropX: 0, brightness: 100, rotation: 0 } }, pattern: { width: 1, height: 1, cells: [0], palette: [structuredClone(color)] } });
test('valid version-1 pattern-only and self-contained raster projects remain compatible', () => {
  assert.equal(isValidProject(project()), true);
  for (const mime of ['png', 'jpeg', 'jpg', 'webp', 'gif']) {
    const p = project(); p.source = { name: 'fixture', dataUrl: `data:image/${mime};base64,aGVsbG8=` };
    assert.equal(isValidProject(p), true);
  }
  const sourceOnly = project(); sourceOnly.pattern = null; sourceOnly.source = { dataUrl: 'data:image/png;base64,aGVsbG8=' };
  assert.equal(isValidProject(sourceOnly), true);
});
for (const source of ['https://example.invalid/source.png', '//example.invalid/source.png', 'data:image/svg+xml;base64,PHN2Zy8+', 'data:text/html;base64,aGVsbG8=', 'data:image/png;base64,%%%']) {
  test(`rejects non-raster or non-local source ${source.split(',')[0]}`, () => {
    const p = project(); p.source = { dataUrl: source }; assert.equal(isValidProject(p), false);
  });
}
test('rejects palette markup, malformed color channels and missing rendering fields', () => {
  for (const patch of [{ hex: '#000000" data-invalid="x' }, { hex: 'url(https://example.invalid/pixel)' }, { r: NaN }, { g: 256 }, { b: -1 }, { symbol: {} }, { code: null }, { dmcName: { en: {} } }]) {
    const p = project(); Object.assign(p.pattern.palette[0], patch); assert.equal(isValidProject(p), false);
  }
});
test('rejects invalid dimensions, palette references and settings without changing its input', () => {
  const p = project(); const before = structuredClone(p); assert.equal(isValidProject(p), true); assert.deepEqual(p, before);
  for (const patch of [{ width: 0 }, { height: 50001 }, { cells: [-1] }, { cells: [1] }, { cells: [] }, { palette: [] }]) {
    const invalid = project(); Object.assign(invalid.pattern, patch); assert.equal(isValidProject(invalid), false);
  }
  for (const settings of [{ width: 50 }, { colorCount: 257 }, { photo: { brightness: '100' } }, { photo: { rotation: Infinity } }]) {
    const invalid = project(); invalid.settings = settings; assert.equal(isValidProject(invalid), false);
  }
});
