import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const output = join(dirname(fileURLToPath(import.meta.url)), 'icon-animation-flat.json');

const C = {
  background: [0.055, 0.169, 0.231, 1],
  backgroundAccent: [0.094, 0.18, 0.376, 1],
  dark: [0.125, 0.165, 0.278, 1],
  coral: [1, 0.38, 0.31, 1],
  coralShadow: [0.91, 0.286, 0.251, 1],
  sand: [1, 0.843, 0.592, 1],
  sandShadow: [0.91, 0.686, 0.416, 1],
  cream: [1, 0.973, 0.922, 1],
  brown: [0.545, 0.333, 0.184, 1],
  silver: [0.682, 0.725, 0.761, 1],
  mint: [0.447, 0.898, 0.733, 1],
  blue: [0.435, 0.471, 1, 1],
};

const fixed = (k, ix) => ({ a: 0, k, ...(ix ? { ix } : {}) });
const animated = (frames, ix) => ({
  a: 1,
  k: frames.map((frame, index) => {
    const next = frames[index + 1];
    if (!next) return frame;
    return {
      ...frame,
      e: next.s,
      i: { x: [0.667], y: [1] },
      o: { x: [0.333], y: [0] },
    };
  }),
  ...(ix ? { ix } : {}),
});
const transform = ({ anchor = [0, 0, 0], position = [0, 0, 0], scale = [100, 100, 100], rotation = 0 } = {}) => ({
  o: fixed(100, 11),
  r: typeof rotation === 'number' ? fixed(rotation, 10) : animated(rotation, 10),
  p: fixed(position, 2),
  a: fixed(anchor, 1),
  s: Array.isArray(scale) && typeof scale[0] === 'object' ? animated(scale, 6) : fixed(scale, 6),
});
const groupTransform = () => ({
  ty: 'tr', p: fixed([0, 0], 2), a: fixed([0, 0], 1), s: fixed([100, 100], 3),
  r: fixed(0, 6), o: fixed(100, 7), sk: fixed(0, 4), sa: fixed(0, 5), nm: 'Transform',
});
const fill = (color) => ({
  ty: 'fl', c: fixed(color, 4), o: fixed(100, 5), r: 1, bm: 0,
  nm: 'Fill', mn: 'ADBE Vector Graphic - Fill', hd: false,
});
const stroke = (color, width) => ({
  ty: 'st', c: fixed(color, 3), o: fixed(100, 4), w: fixed(width, 5), lc: 2, lj: 2, ml: 4, bm: 0,
  nm: 'Stroke', mn: 'ADBE Vector Graphic - Stroke', hd: false,
});
const ellipse = (position, size) => ({
  ty: 'el', d: 1, p: fixed(position, 3), s: fixed(size, 2),
  nm: 'Ellipse Path', mn: 'ADBE Vector Shape - Ellipse', hd: false,
});
const rect = (position, size, radius = 0) => ({
  ty: 'rc', d: 1, p: fixed(position, 3), s: fixed(size, 2), r: fixed(radius, 4),
  nm: 'Rectangle Path', mn: 'ADBE Vector Shape - Rect', hd: false,
});
const path = (vertices, closed = false) => ({
  ty: 'sh',
  ks: fixed({
    i: vertices.map(() => [0, 0]),
    o: vertices.map(() => [0, 0]),
    v: vertices,
    c: closed,
  }, 2),
  nm: 'Path', mn: 'ADBE Vector Shape - Group', hd: false,
});
const group = (name, items) => ({
  ty: 'gr', nm: name, np: items.length + 1, cix: 2, ix: 1,
  mn: 'ADBE Vector Group', hd: false, it: [...items, groupTransform()],
});
const shapeLayer = (ind, name, shapes, ks = transform()) => ({
  ddd: 0, ind, ty: 4, nm: name, sr: 1, ks, ao: 0, shapes, ip: 0, op: 90, st: 0, bm: 0,
});
const cross = (name, x, y, color) => group(name, [
  path([[x, y], [x + 6, y + 6]]),
  path([[x + 6, y], [x, y + 6]]),
  stroke(color, 3.6),
]);

const layers = [
  shapeLayer(1, 'Cross stitches pulse', [
    cross('Mint cross top', 34, 31, C.mint),
    cross('Blue cross top', 41, 29, C.blue),
    cross('Blue cross bottom', 57, 62, C.blue),
    cross('Mint cross bottom', 63, 58, C.mint),
  ], transform({
    anchor: [48, 48, 0],
    position: [48, 48, 0],
    scale: [
      { t: 0, s: [100, 100, 100] },
      { t: 45, s: [112, 112, 100] },
      { t: 90, s: [100, 100, 100] },
    ],
  })),

  shapeLayer(2, 'Needle swing', [
    group('Needle', [
      path([[68, 58], [76, 31]]), stroke(C.cream, 2.5),
      path([[69, 58], [77, 32]]), stroke(C.silver, 1),
      ellipse([76.5, 30], [4, 7]), stroke(C.cream, 1.7),
    ]),
  ], transform({
    anchor: [68, 52, 0],
    position: [68, 52, 0],
    rotation: [
      { t: 0, s: [-5] },
      { t: 45, s: [7] },
      { t: 90, s: [-5] },
    ],
  })),

  shapeLayer(3, 'Eyes blink', [
    group('Eyes', [
      ellipse([41, 47], [13, 17]), fill(C.cream),
      ellipse([57, 47], [13, 17]), fill(C.cream),
      ellipse([43, 48], [6.5, 10]), fill(C.dark),
      ellipse([55, 48], [6.5, 10]), fill(C.dark),
      ellipse([44, 46], [2.2, 2.2]), fill(C.cream),
      ellipse([54, 46], [2.2, 2.2]), fill(C.cream),
    ]),
  ], transform({
    anchor: [48, 47, 0],
    position: [48, 47, 0],
    scale: [
      { t: 0, s: [100, 100, 100] },
      { t: 34, s: [100, 100, 100] },
      { t: 39, s: [100, 18, 100] },
      { t: 44, s: [100, 100, 100] },
      { t: 90, s: [100, 100, 100] },
    ],
  })),

  shapeLayer(4, 'Face details and arms', [
    group('Brows, mouth and arms', [
      path([[36, 38], [44, 36]]), path([[53, 36], [61, 38]]), stroke(C.dark, 2.7),
      ellipse([49, 57], [11, 7]), fill(C.dark),
      ellipse([49, 59], [5, 2.5]), fill(C.coral),
      path([[31, 54], [25, 59], [31, 64]]), path([[67, 53], [73, 57], [70, 64]]), stroke(C.dark, 5.5),
      ellipse([31, 54], [8, 8]), fill(C.dark),
      ellipse([69, 54], [8, 8]), fill(C.dark),
    ]),
  ]),

  shapeLayer(5, 'Spool body', [
    group('Body and rims', [
      rect([48, 49], [39, 47], 8), fill(C.coral),
      rect([60, 49], [14, 45], 5), fill(C.coralShadow),
      rect([48, 39], [39, 3.5], 2), fill(C.coralShadow),
      rect([48, 52], [39, 3.5], 2), fill(C.coralShadow),
      rect([48, 65], [39, 3.5], 2), fill(C.coralShadow),
      ellipse([48, 28], [55, 18]), fill(C.sandShadow),
      ellipse([48, 24], [55, 17]), fill(C.sand),
      ellipse([48, 23], [18, 6]), fill(C.brown),
      ellipse([48, 73], [50, 16]), fill(C.sandShadow),
      ellipse([48, 69], [50, 14]), fill(C.sand),
    ]),
  ]),

  shapeLayer(6, 'Thread and legs', [
    group('Thread loop and legs', [
      path([[67, 33], [79, 24], [86, 34], [77, 47], [87, 58]]), stroke(C.coral, 4),
      path([[43, 75], [41, 84]]), path([[55, 75], [57, 84]]), stroke(C.dark, 4),
      ellipse([39, 86], [14, 7]), fill(C.dark),
      ellipse([60, 86], [14, 7]), fill(C.dark),
    ]),
  ]),

  shapeLayer(7, 'Opaque brand background', [
    group('Background', [
      rect([48, 48], [96, 96]), fill(C.background),
      ellipse([87, 11], [34, 34]), fill(C.backgroundAccent),
    ]),
  ]),
];

const lottie = {
  v: '5.12.2', fr: 30, ip: 0, op: 90, w: 96, h: 96,
  nm: 'Stitchloom flat launch icon', ddd: 0, assets: [], layers,
};

writeFileSync(output, `${JSON.stringify(lottie)}\n`);
console.log(`Wrote ${output}`);
