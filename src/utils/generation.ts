import type { ArtNode, RenderElement, CharacterMeasurement, Depth } from '../types';
import { hashString, createGenerator } from './random';

/*
 * Woven vine generator.
 *
 * Each word (or each line-fragment of a word) is a "run". A run has one main strand plus
 * occasional secondary strands that peel away from the main strand, wander farther above or
 * below the letters, cross it, and rejoin it.
 *
 * Every strand is a pure function of `u`: the horizontal distance from the run's first glyph,
 * measured in ems. Because `u` is relative to the run start and every random choice is seeded from
 * the prefix of the text, the segments owned by character i never change when later characters
 * are typed. Typing extends the vine; it never redraws it.
 *
 * Each segment is given a deterministic depth ('back' or 'front') so strands alternately pass behind
 * and in front of the opaque letters.
 */

type Rng = ReturnType<typeof createGenerator>;
interface Pt { x: number; y: number; }

/** Average glyph advance in ems: used for fallback layout and secondary-strand lifespans. */
const NOMINAL_ADVANCE = 0.55;
const FALLBACK_FONT_SIZE = 100;
/** Native lengths of the leaf / flower artwork in Leaf.tsx and Flower.tsx. */
const LEAF_ART_LENGTH = 40;
const FLOWER_ART_RADIUS = 36;

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (p: Pt) => `${round(p.x)},${round(p.y)}`;
const dir = (a: number): Pt => ({ x: Math.cos(a), y: Math.sin(a) });
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Derive an independent, stable sub-seed so separate decisions don't share one random sequence. */
const subSeed = (seed: number, salt: string) => hashString(salt, seed % 4294967296);
const subRng = (seed: number, salt: string) => createGenerator(subSeed(seed, salt));

interface CharData {
  char: string;
  index: number;
  seed: number;
  x: number;   // glyph centre x (relative to viewport centre)
  cy: number;  // line-box centre y (relative to viewport centre)
  fs: number;  // font size in px
  isSpace: boolean;
}

interface Strand {
  key: string;
  /** Vertical offset (px) from the run's centre line at horizontal position u (ems). */
  y: (u: number) => number;
  uStart: number;
  uEnd: number;
  depthAt: (j: number) => Depth;
  thickness: number;
}

/** Alternates back/front in runs of 1–3 segments, seeded per strand. */
function makeDepthSequence(seed: number): (j: number) => Depth {
  const cache: Depth[] = [];
  const rng = createGenerator(seed);
  let front = rng.next() < 0.55;
  return (j: number) => {
    while (cache.length <= j) {
      const len = 1 + Math.floor(rng.next() * 3);
      for (let k = 0; k < len; k++) cache.push(front ? 'front' : 'back');
      front = !front;
    }
    return cache[j];
  };
}

function slope(f: (u: number) => number, u: number) {
  const h = 1e-3;
  return (f(u + h) - f(u - h)) / (2 * h);
}

/** Context that maps strand space (u, offset) to a character node's local coordinates. */
interface Frame {
  runX: number;  // x of the run's first glyph
  runCy: number; // centre line of the run
  ox: number;    // node origin x
  oy: number;    // node origin y
  fs: number;
}

const strandPoint = (s: Strand, f: Frame, u: number): Pt => ({
  x: f.runX + u * f.fs - f.ox,
  y: f.runCy + s.y(u) - f.oy,
});

/** Tangent angle (radians) of a strand at u. */
const strandAngle = (s: Strand, f: Frame, u: number) => Math.atan2(slope(s.y, u), f.fs);

/** Smooth cubic path following the strand from ua to ub (Hermite → Bézier pieces). */
function strandPath(s: Strand, f: Frame, ua: number, ub: number): string {
  const pieces = Math.max(1, Math.ceil((ub - ua) / 0.2));
  let d = `M ${fmt(strandPoint(s, f, ua))}`;
  for (let k = 0; k < pieces; k++) {
    const u0 = ua + ((ub - ua) * k) / pieces;
    const u1 = ua + ((ub - ua) * (k + 1)) / pieces;
    const du = u1 - u0;
    const p0 = strandPoint(s, f, u0);
    const p1 = strandPoint(s, f, u1);
    const c1 = { x: p0.x + (f.fs * du) / 3, y: p0.y + (slope(s.y, u0) * du) / 3 };
    const c2 = { x: p1.x - (f.fs * du) / 3, y: p1.y - (slope(s.y, u1) * du) / 3 };
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p1)}`;
  }
  return d;
}

/** A tapered, tightening spiral tendril, returned as a filled outline path. */
function tendrilPath(start: Pt, heading: number, curl: number, len: number, width: number, rng: Rng): string {
  const steps = 30;
  const totalTurn = (Math.PI * 2 * rng.range(0.85, 1.3)) / 1.15;
  const pts: Pt[] = [start];
  let h = heading;
  let p = start;
  for (let k = 1; k <= steps; k++) {
    const t = k / steps;
    h += (curl * totalTurn * (0.3 + 1.7 * t)) / steps;
    const step = (len / steps) * (1.15 - 0.7 * t);
    p = { x: p.x + Math.cos(h) * step, y: p.y + Math.sin(h) * step };
    pts.push(p);
  }
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach((pt, k) => {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const w = (width * (1 - (k / steps) * 0.85)) / 2;
    left.push({ x: pt.x + Math.cos(ang - Math.PI / 2) * w, y: pt.y + Math.sin(ang - Math.PI / 2) * w });
    right.push({ x: pt.x + Math.cos(ang + Math.PI / 2) * w, y: pt.y + Math.sin(ang + Math.PI / 2) * w });
  });
  return `M ${left.map(fmt).join(' L ')} L ${right.reverse().map(fmt).join(' L ')} Z`;
}

function cubicAt(p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number) {
  const mt = 1 - t;
  const x = mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p1.x;
  const y = mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p1.y;
  const dx = 3 * mt * mt * (c1.x - p0.x) + 6 * mt * t * (c2.x - c1.x) + 3 * t * t * (p1.x - c2.x);
  const dy = 3 * mt * mt * (c1.y - p0.y) + 6 * mt * t * (c2.y - c1.y) + 3 * t * t * (p1.y - c2.y);
  return { x, y, angle: Math.atan2(dy, dx) };
}

const leafScale = (fs: number, rng: Rng) => (fs * rng.range(0.11, 0.17)) / LEAF_ART_LENGTH;
const pickLeafStyle = (rng: Rng) => (rng.next() < 0.8 ? (rng.next() < 0.5 ? 0 : 2) : 1);

interface TwigOptions {
  id: string;
  base: Pt;
  baseAngle: number; // strand tangent (radians)
  side: number;      // +1 / -1
  fs: number;
  rng: Rng;
  layer: Depth;
  delay: number;
  length: number;    // px
  leaves: number;
  flower?: { scale: number; type: number; petals: number };
  berry?: { count: number; radius: number };
}

/** A short curving twig with alternating leaves, ending in a leaf, flower, or berry cluster. */
function addTwig(els: RenderElement[], o: TwigOptions) {
  const { rng, base, fs, side } = o;
  const h0 = o.baseAngle + side * rng.range(0.55, 1.05);
  const bend = -side * rng.range(0.15, 0.45);
  const c1 = { x: base.x + dir(h0).x * o.length * 0.45, y: base.y + dir(h0).y * o.length * 0.45 };
  const c2 = { x: base.x + dir(h0 + bend * 0.6).x * o.length * 0.8, y: base.y + dir(h0 + bend * 0.6).y * o.length * 0.8 };
  const end = { x: base.x + dir(h0 + bend).x * o.length, y: base.y + dir(h0 + bend).y * o.length };

  els.push({
    id: `${o.id}-twig`, type: 'branch', layer: o.layer,
    x: 0, y: 0, rotation: 0, scale: 1, delay: o.delay,
    path: `M ${fmt(base)} C ${fmt(c1)} ${fmt(c2)} ${fmt(end)}`,
    thickness: Math.max(0.9, fs * 0.008),
  });

  let alt = rng.next() < 0.5 ? 1 : -1;
  for (let k = 0; k < o.leaves; k++) {
    const t = o.leaves === 1 ? 0.55 : 0.35 + (0.45 * k) / (o.leaves - 1);
    const p = cubicAt(base, c1, c2, end, t);
    els.push({
      id: `${o.id}-leaf${k}`, type: 'leaf', layer: o.layer,
      x: round(p.x), y: round(p.y),
      rotation: round((p.angle + alt * rng.range(0.6, 0.95)) * (180 / Math.PI)),
      scale: round(leafScale(fs, rng) * (0.8 + 0.2 * t)),
      delay: o.delay + 120 + k * 50,
      leafStyle: pickLeafStyle(rng),
      opacity: round(rng.range(0.82, 1)),
    });
    alt = -alt;
  }

  const endAngle = cubicAt(base, c1, c2, end, 1).angle;
  if (o.flower) {
    els.push({
      id: `${o.id}-flower`, type: 'flower', layer: o.layer,
      x: round(end.x), y: round(end.y),
      rotation: round(endAngle * (180 / Math.PI) + 90 + rng.range(-20, 20)),
      scale: round(o.flower.scale),
      delay: o.delay + 260,
      flowerType: o.flower.type,
      petals: o.flower.petals,
    });
  } else if (o.berry) {
    els.push({
      id: `${o.id}-berry`, type: 'berry', layer: o.layer,
      x: round(end.x), y: round(end.y),
      rotation: round(endAngle * (180 / Math.PI)),
      scale: 1,
      delay: o.delay + 200,
      berryCount: o.berry.count,
      berryRadius: round(o.berry.radius),
    });
  } else {
    els.push({
      id: `${o.id}-tipleaf`, type: 'leaf', layer: o.layer,
      x: round(end.x), y: round(end.y),
      rotation: round((endAngle + rng.range(-0.25, 0.25)) * (180 / Math.PI)),
      scale: round(leafScale(fs, rng)),
      delay: o.delay + 120 + o.leaves * 50,
      leafStyle: pickLeafStyle(rng),
      opacity: round(rng.range(0.85, 1)),
    });
  }
}

function makeMainStrand(seed: number, fs: number): Strand {
  const r = subRng(seed, 'main');
  const a1 = r.range(0.24, 0.38), p1 = r.range(2.2, 3.4), ph1 = r.range(0, Math.PI * 2);
  const a2 = r.range(0.05, 0.11), p2 = r.range(0.9, 1.3), ph2 = r.range(0, Math.PI * 2);
  const f1 = (Math.PI * 2) / p1, f2 = (Math.PI * 2) / p2;
  return {
    key: 'm',
    y: (u) => fs * (a1 * Math.sin(f1 * u + ph1) + a2 * Math.sin(f2 * u + ph2)),
    uStart: -Infinity,
    uEnd: Infinity,
    depthAt: makeDepthSequence(subSeed(seed, 'main-depth')),
    thickness: Math.max(1.2, fs * 0.012),
  };
}

function makeSecondaryStrand(seed: number, startIndex: number, us: number, main: Strand, fs: number): Strand {
  const r = subRng(seed, 'secondary');
  const lifespan = r.range(2.5, 6) * NOMINAL_ADVANCE;
  const amp = r.range(0.5, 0.85) * (r.next() < 0.5 ? -1 : 1);
  // c > 0.5 guarantees the strand crosses the main strand once during its life.
  const cross = r.range(0.6, 1.0) * (r.next() < 0.5 ? -1 : 1);
  return {
    key: `s${startIndex}`,
    y: (u) => {
      const t = clamp01((u - us) / lifespan);
      const env = Math.sin(Math.PI * t) + cross * Math.sin(Math.PI * 2 * t);
      return main.y(u) + fs * amp * env * 0.75;
    },
    uStart: us,
    uEnd: us + lifespan,
    depthAt: makeDepthSequence(subSeed(seed, 'secondary-depth')),
    thickness: Math.max(1, fs * 0.01),
  };
}

export const generateGarden = (text: string, measurements?: CharacterMeasurement[], sessionSeed: number = 0): ArtNode[] => {
  const hasMeasurements = !!measurements && measurements.length === text.length;

  // 1. Gather glyph positions and prefix-stable seeds.
  const chars: CharData[] = [];
  const lines = text.split('\n');
  const numLines = lines.length;
  const totalFallbackHeight = (numLines - 1) * FALLBACK_FONT_SIZE * 1.45;

  let currentLineIdx = 0;
  let currentCol = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const m = hasMeasurements ? measurements![i] : undefined;
    const fs = m?.fontSize ?? FALLBACK_FONT_SIZE;
    const isSpace = char === ' ' || char === '\n' || char === '\r';
    const seed = isSpace ? 0 : hashString(text.substring(0, i + 1) + i, sessionSeed);

    let x: number;
    let cy: number;

    if (m) {
      x = m.x;
      cy = m.y;
    } else {
      if (char === '\n') {
        x = 0;
        cy = (currentLineIdx * fs * 1.45) - totalFallbackHeight / 2;
        currentLineIdx++;
        currentCol = 0;
      } else {
        const lineStr = lines[currentLineIdx] || '';
        const lineLen = lineStr.replace(/\r/g, '').length;
        const lineWidth = lineLen * NOMINAL_ADVANCE * fs;
        x = currentCol * NOMINAL_ADVANCE * fs + (NOMINAL_ADVANCE * fs) / 2 - lineWidth / 2;
        cy = (currentLineIdx * fs * 1.45) - totalFallbackHeight / 2;
        if (char !== '\r') currentCol++;
      }
    }

    chars.push({ char, index: i, seed, x, cy, fs, isSpace });
  }

  // 2. Split into runs: spaces cut, and so do line wraps (even mid-word).
  const runs: CharData[][] = [];
  let run: CharData[] = [];
  for (const c of chars) {
    if (c.isSpace) {
      if (run.length) runs.push(run);
      run = [];
      continue;
    }
    const prev = run[run.length - 1];
    if (prev && Math.abs(c.cy - prev.cy) > c.fs * 0.45) {
      runs.push(run);
      run = [];
    }
    run.push(c);
  }
  if (run.length) runs.push(run);

  const nodes: ArtNode[] = [];

  for (const r of runs) {
    const first = r[0];
    const fs = first.fs;
    const main = makeMainStrand(first.seed, fs);
    const us = r.map((c) => (c.x - first.x) / fs);
    const secondaries: { strand: Strand; startIndex: number }[] = [];
    let prevFlower = false;

    for (let j = 0; j < r.length; j++) {
      const cd = r[j];
      const rng = createGenerator(cd.seed);
      const els: RenderElement[] = [];
      const frame: Frame = { runX: first.x, runCy: first.cy, ox: cd.x, oy: cd.cy, fs };
      const id = (s: string) => `${cd.index}-${s}`;
      const jitter = () => Math.round(rng.range(0, 40));

      // --- Main strand segment (or lead-in with a spiral tendril for the first glyph) ---
      const mainDepth = main.depthAt(j);
      let ua: number;
      if (j === 0) {
        const lr = subRng(cd.seed, 'lead');
        ua = -lr.range(0.45, 0.8);
        const start = strandPoint(main, frame, ua);
        els.push({
          id: id('m-lead-tendril'), type: 'tendril', layer: mainDepth,
          x: 0, y: 0, rotation: 0, scale: 1, delay: 220,
          path: tendrilPath(start, strandAngle(main, frame, ua) + Math.PI, lr.next() < 0.5 ? 1 : -1,
            fs * lr.range(0.28, 0.42), main.thickness, lr),
        });
      } else {
        ua = us[j - 1];
      }
      const ub = us[j];
      els.push({
        id: id('m-seg'), type: 'vine', layer: mainDepth,
        x: 0, y: 0, rotation: 0, scale: 1, delay: 0,
        path: strandPath(main, frame, ua, ub), thickness: main.thickness,
      });

      // --- Secondary strand segments ---
      for (const { strand, startIndex } of secondaries) {
        if (startIndex >= j || us[j - 1] >= strand.uEnd) continue;
        const sa = Math.max(strand.uStart, us[j - 1]);
        const sb = Math.min(ub, strand.uEnd);
        const depth = strand.depthAt(j);
        els.push({
          id: id(`${strand.key}-seg`), type: 'vine', layer: depth,
          x: 0, y: 0, rotation: 0, scale: 1, delay: 60,
          path: strandPath(strand, frame, sa, sb), thickness: strand.thickness,
        });
        if (rng.next() < 0.55) {
          const u = sa + (sb - sa) * rng.range(0.3, 0.8);
          const hasBerry = rng.next() < 0.35;
          addTwig(els, {
            id: id(`${strand.key}-t`), base: strandPoint(strand, frame, u),
            baseAngle: strandAngle(strand, frame, u), side: rng.next() < 0.5 ? 1 : -1,
            fs, rng, layer: depth, delay: 140 + jitter(),
            length: fs * rng.range(0.14, 0.26), leaves: 1 + Math.floor(rng.next() * 2),
            berry: hasBerry ? {
              count: 2 + Math.floor(rng.next() * 3),
              radius: Math.max(2.2, fs * rng.range(0.028, 0.04)),
            } : undefined,
          });
        }
      }

      // --- Foliage on the main strand: alternating twigs + a sessile leaf ---
      const twigCount = 1 + (rng.next() < 0.45 ? 1 : 0);
      let side = rng.next() < 0.5 ? 1 : -1;
      for (let k = 0; k < twigCount; k++) {
        const u = ua + (ub - ua) * rng.range(0.2, 0.85);
        addTwig(els, {
          id: id(`m-t${k}`), base: strandPoint(main, frame, u), baseAngle: strandAngle(main, frame, u),
          side, fs, rng, layer: mainDepth, delay: 120 + k * 60 + jitter(),
          length: fs * rng.range(0.16, 0.32), leaves: 1 + Math.floor(rng.next() * 3),
        });
        side = -side;
      }
      if (rng.next() < 0.55) {
        const u = ua + (ub - ua) * rng.range(0.15, 0.9);
        const p = strandPoint(main, frame, u);
        els.push({
          id: id('m-leaf'), type: 'leaf', layer: mainDepth,
          x: round(p.x), y: round(p.y),
          rotation: round((strandAngle(main, frame, u) + side * rng.range(0.7, 1.1)) * (180 / Math.PI)),
          scale: round(leafScale(fs, rng)), delay: 180 + jitter(),
          leafStyle: pickLeafStyle(rng), opacity: round(rng.range(0.82, 1)),
        });
      }

      // --- Accent flower: roughly 1 in 3 glyphs, never two in a row, grown away from the text ---
      const fr = subRng(cd.seed, 'flower');
      const isFlower: boolean = fr.next() < 0.42 && !prevFlower;
      if (isFlower) {
        const u = ua + (ub - ua) * fr.range(0.3, 0.8);
        const base = strandPoint(main, frame, u);
        const offset = main.y(u);
        const outward = Math.abs(offset) > fs * 0.08 ? (offset < 0 ? -1 : 1) : (fr.next() < 0.5 ? -1 : 1);
        const accent = fr.next() < 0.18;
        addTwig(els, {
          id: id('m-f'), base, baseAngle: strandAngle(main, frame, u), side: outward,
          fs, rng: fr, layer: mainDepth, delay: 160,
          length: fs * fr.range(0.3, 0.5), leaves: 1 + Math.floor(fr.next() * 2),
          flower: {
            scale: ((fs * 0.36) / FLOWER_ART_RADIUS) * fr.range(0.8, 1.12) * (accent ? 1.3 : 1),
            type: fr.choice([0, 0, 2, 2, 1, 4]),
            petals: 5 + Math.floor(fr.next() * 4),
          },
        });
      } else {
        // --- Sprout wild berry cluster on non-flowering glyphs (~40% chance) ---
        const br = subRng(cd.seed, 'berry');
        if (br.next() < 0.42) {
          const u = ua + (ub - ua) * br.range(0.25, 0.75);
          const base = strandPoint(main, frame, u);
          const offset = main.y(u);
          const outward = Math.abs(offset) > fs * 0.08 ? (offset < 0 ? -1 : 1) : (br.next() < 0.5 ? -1 : 1);
          addTwig(els, {
            id: id('m-berry'), base, baseAngle: strandAngle(main, frame, u), side: outward,
            fs, rng: br, layer: mainDepth, delay: 150,
            length: fs * br.range(0.22, 0.38), leaves: 1 + Math.floor(br.next() * 2),
            berry: {
              count: 2 + Math.floor(br.next() * 3),
              radius: Math.max(2.4, fs * br.range(0.03, 0.045)),
            },
          });
        }
      }
      prevFlower = isFlower;

      // --- Maybe start a new secondary strand here (its segments belong to later glyphs) ---
      const sr = subRng(cd.seed, 'start-secondary');
      const alive = secondaries.filter((s) => ub < s.strand.uEnd).length;
      const chance = alive === 0 ? (j === 0 ? 0.65 : 0.5) : alive === 1 ? 0.2 : 0;
      if (sr.next() < chance) {
        secondaries.push({ strand: makeSecondaryStrand(cd.seed, j, ub, main, fs), startIndex: j });
      }

      // --- Growing tip: tail + tendril on the run's last glyph (re-grows as you type) ---
      if (j === r.length - 1) {
        const tr = subRng(cd.seed, 'tip');
        const tails: Strand[] = [main, ...secondaries
          .filter((s) => s.startIndex < j && ub < s.strand.uEnd)
          .map((s) => s.strand)];
        tails.forEach((s, k) => {
          const reach = tr.range(0.45, 0.8) * (k === 0 ? 1 : 0.6);
          const te = s === main ? ub + reach : Math.min(ub + reach, s.uEnd);
          const depth = s.depthAt(j + 1);
          els.push({
            id: id(`${s.key}-tip-seg`), type: 'vine', layer: depth,
            x: 0, y: 0, rotation: 0, scale: 1, delay: 120,
            path: strandPath(s, frame, ub, te), thickness: s.thickness,
          });
          els.push({
            id: id(`${s.key}-tip-tendril`), type: 'tendril', layer: depth,
            x: 0, y: 0, rotation: 0, scale: 1, delay: 300,
            path: tendrilPath(strandPoint(s, frame, te), strandAngle(s, frame, te), tr.next() < 0.5 ? 1 : -1,
              fs * tr.range(0.24, 0.38) * (k === 0 ? 1 : 0.75), s.thickness, tr),
          });
        });
      }

      nodes.push({
        id: `${cd.index}-${cd.char}`,
        char: cd.char,
        index: cd.index,
        x: cd.x,
        y: cd.cy,
        seed: cd.seed,
        elements: els,
        fontSize: cd.fs,
      });
    }
  }

  nodes.sort((a, b) => a.index - b.index);
  return nodes;
};
