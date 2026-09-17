import assert from "node:assert/strict";
import {
  analyzePattern,
  cleanupConfetti,
  estimatePhysicalPattern,
  floodFillCells,
  selectDmcPalette,
} from "../dist/pattern-tools.js";

const palette = [
  { r: 0, g: 0, b: 0 },
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 0, b: 0 },
];

const noisy = [
  0, 0, 0,
  0, 2, 0,
  0, 0, 1,
];
const cleaned = cleanupConfetti(noisy, 3, 3, palette, 2);
assert.equal(cleaned[4], 0, "isolated center must merge into its surrounding color");
assert.equal(analyzePattern(cleaned, 3, 3).isolatedStitches, 0);

const filled = floodFillCells([0, 0, 1, 0, 1, 1], 3, 2, 0, 2);
assert.deepEqual(filled, [2, 2, 1, 2, 1, 1]);

const dmc = selectDmcPalette(
  [{ r: 250, g: 250, b: 250 }, { r: 5, g: 5, b: 5 }, { r: 245, g: 245, b: 245 }],
  [{ code: "W", r: 255, g: 255, b: 255 }, { code: "B", r: 0, g: 0, b: 0 }],
  2,
);
assert.equal(dmc.colors.length, 2);
assert.deepEqual(dmc.cells, [0, 1, 0]);

const physical = estimatePhysicalPattern(140, 70, 14, [
  { dmcCode: "310", count: 9800 },
]);
assert.equal(Math.round(physical.stitchedWidthCm * 10) / 10, 25.4);
assert.ok(physical.totalSkeins >= 1);

console.log("pattern-tools: ok");
