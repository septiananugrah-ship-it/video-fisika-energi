import {Easing, interpolate} from 'remotion';

// Ease-out lembut: mulai pelan lalu melambat halus (versi lama 0.16,1,0.3,1 terlalu "meletup" di frame pertama).
export const EASE = Easing.bezier(0.3, 0.05, 0.15, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 antara detik a dan b. */
export const ramp = (t: number, a: number, b: number, easing: (x: number) => number = EASE) =>
  interpolate(t, [a, b], [0, 1], {...clamp, easing});

/** Muncul pada a..a+inDur lalu hilang pada b..b+outDur. */
export const win = (t: number, a: number, b: number, inDur = 0.6, outDur = 0.6) =>
  Math.min(ramp(t, a, a + inDur), 1 - ramp(t, b, b + outDur, EASE_IN_OUT));

export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** Opasitas siklus berulang (fase 0..1): muncul halus di awal, memudar di akhir — tanpa "pop". */
export const cyc = (ph: number) => Math.min(1, ph * 6) * (1 - ph);

export const lerpPts = (a: [number, number], b: [number, number], p: number): [number, number] => [
  mix(a[0], b[0], p),
  mix(a[1], b[1], p),
];

/** Osilasi halus yang dimulai dari amplitudo nol. */
export const osc = (t: number, freq: number, amp = 1, phase = 0) => amp * Math.sin(2 * Math.PI * freq * t + phase);

/** Pseudo-random deterministik. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Path SVG dari daftar titik. */
export const pathOf = (pts: [number, number][]) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Path halus (Catmull-Rom → Bezier). */
export const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

/** Sampel fungsi y = f(x) menjadi titik. */
export const sample = (f: (x: number) => number, x0: number, x1: number, n = 200): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    return [x, f(x)];
  });
