import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const output = join(dirname(fileURLToPath(import.meta.url)), 'icon-animation-flat.json');
const END = 90;
// Preserve the SVG master's proportions, leaving room around the thread and shoes.
const UNIT = 0.096;
const round = (value) => Math.round(value * 1000) / 1000;
const point = (x, y) => [round(x * UNIT - 3.5), round(y * UNIT - 2)];
const size = (x, y) => [round(x * UNIT), round(y * UNIT)];
const rgb = (hex) => [...hex.match(/\w\w/g).map((v) => round(parseInt(v, 16) / 255)), 1];
const C = Object.fromEntries(Object.entries({
  background: '6FB8B0',
  dark: '202A47', highlight: '313B5E', pupil: '18233E',
  coral: 'FF614F', coralShadow: 'DE3E3A', band: 'E84940', tongue: 'FF8069',
  sand: 'FFD797', sandShadow: 'E8AF6A', woodEdge: 'DDA35F',
  cream: 'FFF8EB', brown: '8B552F', brownShadow: '6F4028',
  needle: 'F4F1E8', silver: 'AEB9C2', mint: '72E5BB', blue: '6F78FF',
}).map(([key, value]) => [key, rgb(value)]));

const fixed = (k) => ({ a: 0, k });
const animated = (frames) => {
  if (frames[0].t !== 0 || frames.at(-1).t !== END
      || JSON.stringify(frames[0].s) !== JSON.stringify(frames.at(-1).s)) {
    throw new Error('Every animated property must close its loop at frame 90');
  }
  return { a: 1, k: frames.map((frame, index) => {
    const next = frames[index + 1];
    return next ? {
      ...frame, e: next.s,
      i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] },
    } : frame;
  }) };
};
const transform = ({ pivot = [0, 0], scale = fixed([100, 100, 100]), rotation = fixed(0) } = {}) => ({
  o: fixed(100), r: rotation, p: fixed([...pivot, 0]), a: fixed([...pivot, 0]), s: scale,
});
const groupTransform = ({ pivot = [0, 0], scale = fixed([100, 100]), rotation = fixed(0) } = {}) => ({
  ty: 'tr', p: fixed(pivot), a: fixed(pivot), s: scale,
  r: rotation, o: fixed(100), sk: fixed(0), sa: fixed(0),
});
const fill = (color) => ({ ty: 'fl', c: fixed(color), o: fixed(100), r: 1 });
const stroke = (color, width) => ({
  ty: 'st', c: fixed(color), o: fixed(100), w: fixed(round(width * UNIT)), lc: 2, lj: 2, ml: 4,
});
const ellipse = (x, y, rx, ry) => ({ ty: 'el', d: 1, p: fixed(point(x, y)), s: fixed(size(rx * 2, ry * 2)) });
const group = (name, items, options) => ({ ty: 'gr', nm: name, it: [...items, groupTransform(options)] });

// Convert only the master's absolute M/L/C/V/Z subset. Preserve cubic handles
// instead of approximating the smile, arms and thread with angular polylines.
const path = (d) => {
  const tokens = d.match(/[A-Za-z]|-?(?:\d*\.)?\d+/g);
  const v = [], i = [], o = [];
  let cursor = 0, closed = false;
  const number = () => {
    const value = Number(tokens[cursor++]);
    if (!Number.isFinite(value)) throw new Error(`Invalid SVG coordinate in ${d}`);
    return value;
  };
  const nextPoint = () => point(number(), number());
  const add = (p) => { v.push(p); i.push([0, 0]); o.push([0, 0]); };
  const delta = (a, b) => a.map((value, n) => round(value - b[n]));
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    if (command === 'M' || command === 'L') add(nextPoint());
    else if (command === 'V') add([v.at(-1)[0], point(0, number())[1]]);
    else if (command === 'C') {
      const c1 = nextPoint(), c2 = nextPoint(), end = nextPoint();
      o[o.length - 1] = delta(c1, v.at(-1));
      add(end);
      i[i.length - 1] = delta(c2, end);
    } else if (command === 'Z') closed = true;
    else throw new Error(`Unsupported SVG command ${command}`);
  }
  if (closed && v.length > 1 && JSON.stringify(v.at(-1)) === JSON.stringify(v[0])) {
    i[0] = i.pop(); v.pop(); o.pop();
  }
  return { ty: 'sh', ks: fixed({ i, o, v, c: closed }) };
};

// A paint belongs to ONE group: successive fills in a shared group repaint
// preceding paths (the original white fill obscured both pupils).
const paintedPath = (name, d, color, width) => group(name, [path(d), width ? stroke(color, width) : fill(color)]);
const paintedEllipse = (name, x, y, rx, ry, color) => group(name, [ellipse(x, y, rx, ry), fill(color)]);
// Author artwork back-to-front like SVG; Lottie arrays are front-to-back.
const shapeLayer = (ind, name, artwork, ks = transform()) => ({
  ddd: 0, ind, ty: 4, nm: name, sr: 1, ks, ao: 0,
  shapes: [...artwork].reverse(), ip: 0, op: END, st: 0, bm: 0,
});
const cross = (name, x, y, color, peak) => group(name, [
  path(`M${x} ${y}L${x + 45} ${y + 45}`),
  path(`M${x + 45} ${y}L${x} ${y + 45}`), stroke(color, 28),
], {
  pivot: point(x + 22.5, y + 22.5),
  scale: animated([
    { t: 0, s: [100, 100] }, { t: peak, s: [106, 106] }, { t: END, s: [100, 100] },
  ]),
});

const layers = [
  shapeLayer(1, 'Cross stitches — gentle local pulse', [
    cross('Mint upper', 344, 330, C.mint, 35),
    cross('Blue upper', 405, 308, C.blue, 43),
    cross('Blue lower', 604, 664, C.blue, 43),
    cross('Mint lower', 656, 625, C.mint, 51),
  ]),

  shapeLayer(2, 'Needle — small swing around the hand', [
    paintedPath('Ivory shaft', 'M714 561L775 333', C.needle, 17),
    paintedPath('Silver edge', 'M725 557L785 337', C.silver, 8),
    group('Open needle eye', [ellipse(780, 326, 17, 28), stroke(C.needle, 12)], {
      pivot: point(780, 326), rotation: fixed(15),
    }),
  ], transform({
    pivot: point(714, 561),
    rotation: animated([
      { t: 0, s: [0] }, { t: 24, s: [-1.5] }, { t: 58, s: [1.5] }, { t: END, s: [0] },
    ]),
  })),

  shapeLayer(3, 'Eyes — pupils and catchlights blink together', [
    paintedEllipse('Left ivory eye', 411, 501, 64, 78, C.cream),
    paintedEllipse('Right ivory eye', 611, 501, 64, 78, C.cream),
    paintedEllipse('Left attentive pupil', 427, 510, 34, 48, C.pupil),
    paintedEllipse('Right attentive pupil', 595, 510, 34, 48, C.pupil),
    paintedEllipse('Left catchlight', 437, 493, 11, 11, C.cream),
    paintedEllipse('Right catchlight', 584, 493, 11, 11, C.cream),
  ], transform({
    pivot: point(511, 501),
    scale: animated([
      { t: 0, s: [100, 100, 100] }, { t: 49, s: [100, 100, 100] },
      { t: 52, s: [100, 8, 100] }, { t: 54, s: [100, 8, 100] },
      { t: 58, s: [100, 100, 100] }, { t: END, s: [100, 100, 100] },
    ]),
  })),

  shapeLayer(4, 'Warm expression and curved arms', [
    paintedPath('Left soft brow', 'M353 430C386 397 431 394 461 424', C.dark, 25),
    paintedPath('Right soft brow', 'M559 424C589 394 635 397 668 430', C.dark, 25),
    paintedPath('Small curved smile', 'M456 582C487 607 536 607 567 582C567 642 456 642 456 582Z', C.dark),
    paintedPath('Warm smile accent', 'M482 618C500 601 524 601 542 618C525 634 499 634 482 618Z', C.tongue),
    paintedPath('Left curved arm', 'M305 566C239 579 226 653 280 684C320 706 357 667 374 626', C.dark, 47),
    paintedEllipse('Left mitten', 374, 615, 43, 43, C.dark),
    paintedPath('Right curved arm', 'M708 548C773 557 784 638 733 676', C.dark, 47),
    paintedEllipse('Right mitten highlight', 710, 549, 43, 43, C.highlight),
  ]),

  shapeLayer(5, 'Coral spool and wooden rims — SVG proportions', [
    // The lower rim sits behind the wound thread: the spool body hides its
    // upper half and leaves only the front/lower wooden lip visible.
    paintedPath('Bottom rim edge', 'M275 752C314 712 391 696 511 696C631 696 708 712 747 752V804C715 861 627 885 511 885C395 885 307 861 275 804Z', C.woodEdge),
    paintedEllipse('Bottom wooden surface', 511, 758, 236, 76, C.sand),
    paintedPath('Bottom rim hard shadow', 'M276 758C309 798 396 815 511 815C626 815 713 798 746 758V802C714 850 627 870 511 870C395 870 308 850 276 802Z', C.sandShadow),
    paintedPath('Rounded tapered spool', 'M289 248C282 368 291 633 315 773C377 820 645 820 707 773C731 633 740 368 733 248Z', C.coral),
    paintedPath('Hard side shadow', 'M650 259C687 380 681 650 646 786C680 781 700 772 707 763C731 625 740 371 733 248Z', C.coralShadow),
    paintedPath('Upper curved thread band', 'M297 356C403 393 583 385 724 333L722 383C573 430 410 434 299 401Z', C.band),
    paintedPath('Middle curved thread band', 'M303 516C418 553 591 547 718 494L716 544C580 593 417 598 306 561Z', C.band),
    paintedPath('Lower curved thread band', 'M312 675C431 716 587 706 710 655L706 708C574 754 423 759 316 720Z', C.band),
    paintedPath('Top rim edge', 'M241 231C252 173 359 135 510 135C662 135 770 173 781 231V278C749 336 659 358 510 358C361 358 272 336 241 278Z', C.woodEdge),
    paintedEllipse('Top wooden surface', 511, 224, 270, 96, C.sand),
    paintedPath('Top rim hard shadow', 'M241 224C260 267 367 296 511 296C655 296 762 267 781 224V274C748 327 654 346 511 346C368 346 274 327 241 274Z', C.sandShadow),
    paintedEllipse('Spool hole bevel', 511, 215, 104, 38, C.brown),
    paintedEllipse('Spool hole interior', 511, 205, 83, 23, C.brownShadow),
  ]),

  shapeLayer(6, 'Flowing thread and grounded shoes', [
    paintedPath('Continuous cubic thread loop', 'M718 304C900 194 943 354 807 433C713 488 741 622 874 616C944 613 966 558 930 526', C.coral, 40),
    paintedPath('Left leg', 'M443 783L427 893', C.dark, 42),
    paintedPath('Right leg', 'M589 783L606 893', C.dark, 42),
    paintedEllipse('Left rounded shoe', 396, 912, 82, 43, C.dark),
    paintedEllipse('Right rounded shoe', 636, 912, 82, 43, C.dark),
    paintedPath('Left shoe flat highlight', 'M330 914C355 892 403 882 465 900C452 939 334 950 330 914Z', C.highlight),
    paintedPath('Right shoe flat highlight', 'M566 900C628 882 677 892 702 914C698 950 580 939 566 900Z', C.highlight),
  ]),

  // The opaque background must remain LAST, behind all artwork.
  shapeLayer(7, 'Opaque brand background', [
    group('Full canvas', [
      { ty: 'rc', d: 1, p: fixed([48, 48]), s: fixed([96, 96]), r: fixed(0) }, fill(C.background),
    ]),
  ]),
];

const lottie = {
  v: '5.12.2', fr: 30, ip: 0, op: END, w: 96, h: 96,
  nm: 'Stitchloom flat launch icon', ddd: 0, assets: [], layers,
};
const json = `${JSON.stringify(lottie)}\n`;
const bytes = Buffer.byteLength(json);
if (bytes > 24 * 1024) throw new Error(`Lottie exceeds 24 KB: ${bytes} bytes`);
writeFileSync(output, json);
console.log(`Wrote ${output} (${bytes} bytes)`);
