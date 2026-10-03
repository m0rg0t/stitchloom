// Version-1 projects are local, self-contained raster documents. Validate before
// image decoding or UI mutation; a data: prefix alone does not make SVG safe.
export const PROJECT_FORMAT_VERSION = 1;
const rasterDataUrl = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finiteRange = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const text = (value, max = 128) => typeof value === 'string' && value.length > 0 && value.length <= max;

export function isValidProject(project) {
  if (!record(project) || project.format !== 'stitchloom' || project.version !== PROJECT_FORMAT_VERSION) return false;
  if (project.source != null) {
    if (!record(project.source) || typeof project.source.dataUrl !== 'string' || !rasterDataUrl.test(project.source.dataUrl)) return false;
    if (project.source.dataUrl.split(',')[1].length % 4 !== 0) return false;
  }
  if (project.settings != null) {
    const settings = project.settings;
    if (!record(settings)) return false;
    if (settings.width !== undefined && (!Number.isInteger(settings.width) || ![36, 52, 70, 90, 110].includes(settings.width))) return false;
    if (settings.colorCount !== undefined && (!Number.isInteger(settings.colorCount) || !finiteRange(settings.colorCount, 2, 256))) return false;
    if (settings.photo !== undefined) {
      if (!record(settings.photo)) return false;
      const bounds = { cropZoom: [100, 220], cropX: [-50, 50], cropY: [-50, 50], brightness: [50, 150], contrast: [50, 170], saturation: [0, 180], soften: [0, 4], rotation: [0, 360] };
      for (const [key, value] of Object.entries(settings.photo)) {
        if (!Object.hasOwn(bounds, key) || !finiteRange(value, ...bounds[key])) return false;
      }
    }
  }
  if (!project.pattern) return Boolean(project.source);
  if (!record(project.pattern)) return false;
  const { width, height, cells, palette } = project.pattern;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 50000) return false;
  if (!Array.isArray(cells) || cells.length !== width * height || !Array.isArray(palette) || !palette.length || palette.length > 256) return false;
  if (!palette.every(color => record(color)
    && ['r', 'g', 'b'].every(channel => finiteRange(color[channel], 0, 255))
    && typeof color.hex === 'string' && /^#[0-9a-f]{6}$/i.test(color.hex)
    && text(color.symbol, 16) && text(color.code, 32) && text(color.dmcCode, 32)
    && (color.dmcName === undefined || typeof color.dmcName === 'string' || (record(color.dmcName) && Object.values(color.dmcName).every(name => typeof name === 'string'))))) return false;
  return cells.every(index => Number.isInteger(index) && index >= 0 && index < palette.length);
}
