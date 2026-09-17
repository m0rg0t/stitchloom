export function rgbDistance(colorA, colorB) {
  const red = colorA.r - colorB.r;
  const green = colorA.g - colorB.g;
  const blue = colorA.b - colorB.b;
  return red * red * 0.28 + green * green * 0.62 + blue * blue * 0.1;
}

export function nearestPaletteIndex(color, palette) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  palette.forEach((candidate, index) => {
    const distance = rgbDistance(color, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function neighborIndices(index, width, height) {
  const row = Math.floor(index / width);
  const column = index % width;
  const neighbors = [];
  if (column > 0) neighbors.push(index - 1);
  if (column + 1 < width) neighbors.push(index + 1);
  if (row > 0) neighbors.push(index - width);
  if (row + 1 < height) neighbors.push(index + width);
  return neighbors;
}

export function getColorRegions(cells, width, height) {
  const visited = new Uint8Array(cells.length);
  const regions = [];

  cells.forEach((colorIndex, startIndex) => {
    if (visited[startIndex]) return;
    const queue = [startIndex];
    const region = [];
    visited[startIndex] = 1;

    while (queue.length) {
      const index = queue.pop();
      region.push(index);
      neighborIndices(index, width, height).forEach((neighbor) => {
        if (!visited[neighbor] && cells[neighbor] === colorIndex) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      });
    }

    regions.push({ colorIndex, indices: region });
  });

  return regions;
}

export function cleanupConfetti(cells, width, height, palette, minimumRegionSize, passes = 2) {
  if (minimumRegionSize <= 1) return cells.slice();
  let output = cells.slice();

  for (let pass = 0; pass < passes; pass += 1) {
    const regions = getColorRegions(output, width, height);
    let changed = false;

    regions
      .filter((region) => region.indices.length < minimumRegionSize)
      .forEach((region) => {
        const candidates = new Map();
        region.indices.forEach((index) => {
          neighborIndices(index, width, height).forEach((neighbor) => {
            const candidate = output[neighbor];
            if (candidate === region.colorIndex) return;
            candidates.set(candidate, (candidates.get(candidate) || 0) + 1);
          });
        });
        if (!candidates.size) return;

        const sourceColor = palette[region.colorIndex];
        const replacement = [...candidates.entries()]
          .sort((a, b) => {
            const borderDifference = b[1] - a[1];
            if (borderDifference) return borderDifference;
            return rgbDistance(sourceColor, palette[a[0]]) - rgbDistance(sourceColor, palette[b[0]]);
          })[0][0];
        region.indices.forEach((index) => { output[index] = replacement; });
        changed = true;
      });

    if (!changed) break;
  }

  return output;
}

export function analyzePattern(cells, width, height) {
  const regions = getColorRegions(cells, width, height);
  let isolatedStitches = 0;
  let edgeChanges = 0;

  cells.forEach((colorIndex, index) => {
    const row = Math.floor(index / width);
    const column = index % width;
    const neighbors = neighborIndices(index, width, height);
    if (neighbors.every((neighbor) => cells[neighbor] !== colorIndex)) isolatedStitches += 1;
    if (column + 1 < width && cells[index + 1] !== colorIndex) edgeChanges += 1;
    if (row + 1 < height && cells[index + width] !== colorIndex) edgeChanges += 1;
  });

  const smallRegions = regions.filter((region) => region.indices.length <= 3).length;
  const possibleEdges = Math.max(1, height * (width - 1) + width * (height - 1));
  const isolatedRatio = isolatedStitches / Math.max(1, cells.length);
  const changeRatio = edgeChanges / possibleEdges;
  const regionRatio = smallRegions / Math.max(1, regions.length);
  const score = Math.max(1, Math.round(100 - isolatedRatio * 250 - changeRatio * 36 - regionRatio * 18));

  return {
    score,
    isolatedStitches,
    edgeChanges,
    smallRegions,
    regionCount: regions.length,
  };
}

export function selectDmcPalette(rawColors, dmcPalette, requestedCount) {
  const usage = new Array(dmcPalette.length).fill(0);
  rawColors.forEach((color) => { usage[nearestPaletteIndex(color, dmcPalette)] += 1; });
  const selected = dmcPalette
    .map((color, index) => ({ ...color, sourceIndex: index, usage: usage[index] }))
    .filter((color) => color.usage > 0)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, Math.max(2, Math.min(requestedCount, dmcPalette.length)));
  const cells = rawColors.map((color) => nearestPaletteIndex(color, selected));
  return { colors: selected, cells };
}

export function rebuildPaletteUsage(cells, palette) {
  const counts = new Array(palette.length).fill(0);
  cells.forEach((index) => { if (counts[index] !== undefined) counts[index] += 1; });
  const ordered = palette
    .map((color, index) => ({ color, index, count: counts[index] }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const remap = new Map(ordered.map((item, index) => [item.index, index]));
  return {
    cells: cells.map((index) => remap.get(index)),
    palette: ordered.map((item) => ({ ...item.color, count: item.count })),
  };
}

export function floodFillCells(cells, width, height, startIndex, replacementIndex) {
  const output = cells.slice();
  const targetIndex = output[startIndex];
  if (targetIndex === replacementIndex || targetIndex === undefined) return output;
  const queue = [startIndex];
  output[startIndex] = replacementIndex;

  while (queue.length) {
    const index = queue.pop();
    neighborIndices(index, width, height).forEach((neighbor) => {
      if (output[neighbor] === targetIndex) {
        output[neighbor] = replacementIndex;
        queue.push(neighbor);
      }
    });
  }

  return output;
}

export function estimatePhysicalPattern(width, height, fabricCount, palette) {
  const centimetersPerInch = 2.54;
  const stitchedWidthCm = width / fabricCount * centimetersPerInch;
  const stitchedHeightCm = height / fabricCount * centimetersPerInch;
  const marginCm = 7.5;
  const strandMetersPerStitch = 4 * Math.SQRT2 * (centimetersPerInch / fabricCount) / 100 * 1.15;
  const usableTwoStrandMetersPerSkein = 8 * 3 * 0.9;
  const threads = palette.map((color) => ({
    code: color.dmcCode,
    count: color.count,
    skeins: Math.max(1, Math.ceil(color.count * strandMetersPerStitch / usableTwoStrandMetersPerSkein)),
  }));
  return {
    stitchedWidthCm,
    stitchedHeightCm,
    fabricWidthCm: stitchedWidthCm + marginCm * 2,
    fabricHeightCm: stitchedHeightCm + marginCm * 2,
    marginCm,
    hoursLow: Math.max(1, Math.ceil(width * height / 120)),
    hoursHigh: Math.max(1, Math.ceil(width * height / 80)),
    totalSkeins: threads.reduce((sum, thread) => sum + thread.skeins, 0),
    threads,
  };
}
