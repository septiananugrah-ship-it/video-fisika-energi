// Komponen fisika bersama: benda, pegas, lantai, batang energi, sumbu grafik.
// Semua dalam koordinat SVG 1920×1080 (dipakai di dalam <Stage>).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {mix, rand} from '../anim';
import {C, FONT, type Hue} from '../theme';
import {Label, TSub, hue} from './primitives';

/** Lantai bergaris arsir (permukaan kasar = arsir rapat, licin = garis tipis). */
export const Ground: React.FC<{x1: number; x2: number; y: number; rough?: boolean; opacity?: number; heat?: number}> = ({x1, x2, y, rough, opacity = 1, heat = 0}) => {
  const hatch: string[] = [];
  const step = rough ? 18 : 34;
  for (let x = x1 + 6; x < x2; x += step) hatch.push(`M${x},${y + 2} l-16,22`);
  return (
    <g opacity={opacity}>
      <rect x={x1} y={y} width={x2 - x1} height={70} fill="url(#ground)" />
      <path d={hatch.join(' ')} stroke={C.faint} strokeWidth={2} />
      {heat > 0.01 ? <rect x={x1} y={y - 3} width={x2 - x1} height={6} rx={3} fill={C.heat} opacity={0.75 * heat} /> : null}
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={rough ? C.muted : C.ink} strokeOpacity={0.85} strokeWidth={3} />
    </g>
  );
};

/** Kotak/koper/balok dengan label massa. (x, y) = titik tengah alas. */
export const Crate: React.FC<{x: number; y: number; w?: number; h?: number; label?: string; color?: string; rot?: number; opacity?: number; handle?: boolean}> = ({
  x,
  y,
  w = 150,
  h = 110,
  label,
  color = C.pot,
  rot = 0,
  opacity = 1,
  handle,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    {handle ? <path d={`M${-w * 0.18},${-h} v-22 h${w * 0.36} v22`} fill="none" stroke={C.muted} strokeWidth={6} strokeLinejoin="round" /> : null}
    <rect x={-w / 2} y={-h} width={w} height={h} rx={12} fill="url(#crate)" stroke={hue(color)} strokeWidth={3} />
    <rect x={-w / 2 + 8} y={-h + 8} width={w - 16} height={10} rx={5} fill="#fff" opacity={0.08} />
    {label ? (
      <text x={0} y={-h / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={Math.min(34, h * 0.32)} fill={C.ink}>
        {label}
      </text>
    ) : null}
  </g>
);

/** Pegas zig-zag mendatar dari xa ke xb pada ketinggian y. */
export const Spring: React.FC<{xa: number; xb: number; y: number; coils?: number; amp?: number; color?: string; width?: number; opacity?: number}> = ({
  xa,
  xb,
  y,
  coils = 12,
  amp = 26,
  color = C.spr,
  width = 5,
  opacity = 1,
}) => {
  const lead = 22;
  const a = xa + lead * Math.sign(xb - xa || 1);
  const b = xb - lead * Math.sign(xb - xa || 1);
  const n = coils * 2;
  const pts: string[] = [`M${xa},${y}`, `L${a},${y}`];
  for (let i = 1; i < n; i++) {
    const x = a + ((b - a) * i) / n;
    pts.push(`L${x.toFixed(1)},${(y + (i % 2 ? -amp : amp)).toFixed(1)}`);
  }
  pts.push(`L${b},${y}`, `L${xb},${y}`);
  return (
    <g opacity={opacity}>
      <path d={pts.join(' ')} fill="none" stroke={hue(color)} strokeOpacity={0.25} strokeWidth={width * 3} strokeLinejoin="round" />
      <path d={pts.join(' ')} fill="none" stroke={hue(color)} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

/** Pegas tegak dari ya (atas) ke yb (bawah) di x. */
export const SpringV: React.FC<{x: number; ya: number; yb: number; coils?: number; amp?: number; color?: string; width?: number; opacity?: number}> = ({
  x,
  ya,
  yb,
  coils = 10,
  amp = 30,
  color = C.spr,
  width = 5,
  opacity = 1,
}) => {
  const lead = 16;
  const a = ya + lead;
  const b = yb - lead;
  const n = coils * 2;
  const pts: string[] = [`M${x},${ya}`, `L${x},${a}`];
  for (let i = 1; i < n; i++) {
    const yy = a + ((b - a) * i) / n;
    pts.push(`L${(x + (i % 2 ? -amp : amp)).toFixed(1)},${yy.toFixed(1)}`);
  }
  pts.push(`L${x},${b}`, `L${x},${yb}`);
  return (
    <g opacity={opacity}>
      <path d={pts.join(' ')} fill="none" stroke={hue(color)} strokeOpacity={0.25} strokeWidth={width * 3} strokeLinejoin="round" />
      <path d={pts.join(' ')} fill="none" stroke={hue(color)} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
};

/** Bola mengilap. */
export const Ball: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 34, color, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={x} cy={y} r={r * 1.9} fill={`url(#soft-${color ? 'kin' : 'cyan'})`} opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill={color ?? 'url(#ball)'} stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
    <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.22} fill="#fff" opacity={0.55} />
  </g>
);

/** Mobil tampak samping. (x, y) = titik tengah bawah roda. */
export const Car: React.FC<{x: number; y: number; color?: string; scale?: number; wheel?: number; opacity?: number; braking?: number}> = ({
  x,
  y,
  color = C.cyan,
  scale = 1,
  wheel = 0,
  opacity = 1,
  braking = 0,
}) => {
  const c = hue(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <path d="M-120,-30 L-120,-62 Q-116,-74 -100,-76 L-62,-80 L-30,-118 Q-22,-126 -8,-126 L52,-126 Q66,-126 74,-116 L102,-80 L120,-74 Q130,-70 130,-58 L130,-30 Z" fill="#16224a" stroke={c} strokeWidth={4} strokeLinejoin="round" />
      <path d="M-50,-82 L-24,-114 L18,-114 L18,-82 Z M28,-82 L28,-114 L58,-114 Q64,-114 68,-108 L88,-82 Z" fill={c} opacity={0.28} />
      <rect x={118} y={-66} width={12} height={10} rx={3} fill={C.gold} />
      <rect x={-122} y={-66} width={10} height={12} rx={3} fill={C.heat} opacity={0.4 + 0.6 * braking} />
      {braking > 0.01 ? <circle cx={-120} cy={-60} r={30} fill="url(#soft-heat)" opacity={braking} /> : null}
      {[-70, 78].map((wx) => (
        <g key={wx} transform={`translate(${wx} -28) rotate(${wheel})`}>
          <circle r={28} fill="#0b1022" stroke={C.muted} strokeWidth={4} />
          <circle r={12} fill="#2a355e" />
          <line x1={-24} y1={0} x2={24} y2={0} stroke={C.muted} strokeWidth={3} />
          <line x1={0} y1={-24} x2={0} y2={24} stroke={C.muted} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

/** Orang sederhana (garis), pose berjalan berdasarkan fase langkah. (x, y) = kaki. */
export const Person: React.FC<{x: number; y: number; phase?: number; scale?: number; color?: string; opacity?: number; arm?: number}> = ({
  x,
  y,
  phase = 0,
  scale = 1,
  color = C.ink,
  opacity = 1,
  arm,
}) => {
  const s = Math.sin(phase);
  const legA = 18 * s;
  const legB = -18 * s;
  const armSwing = arm ?? -20 * s;
  const c = hue(color);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} stroke={c} strokeWidth={7} strokeLinecap="round" fill="none">
      <line x1={0} y1={-70} x2={legA} y2={0} />
      <line x1={0} y1={-70} x2={legB} y2={0} />
      <line x1={0} y1={-70} x2={0} y2={-140} />
      <line x1={0} y1={-128} x2={22 + armSwing * 0.3} y2={-88 + Math.abs(armSwing) * 0.2} />
      <line x1={0} y1={-128} x2={-18 - armSwing * 0.3} y2={-90} />
      <circle cx={0} cy={-162} r={18} fill={C.bg} />
    </g>
  );
};

/** Gelombang panas: riak merah yang naik dari permukaan (energi termal). */
export const HeatShimmer: React.FC<{x1: number; x2: number; y: number; t: number; amount: number}> = ({x1, x2, y, t, amount}) => {
  if (amount <= 0.01) return null;
  const n = Math.max(3, Math.round((x2 - x1) / 70));
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const ph = (t * 0.6 + rand(i * 7.1)) % 1;
        const x = mix(x1, x2, (i + 0.5) / n) + 10 * Math.sin(t * 2 + i);
        const yy = y - 10 - ph * 70;
        const op = Math.min(1, ph * 5) * (1 - ph) * amount;
        return <path key={i} d={`M${x},${yy + 18} q8,-9 0,-18 q-8,-9 0,-18`} fill="none" stroke={C.heat} strokeWidth={3} strokeLinecap="round" opacity={op} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Batang energi (diagram batang energi): satu batang per bentuk energi  */
/* ------------------------------------------------------------------ */

export type Bar = {key: string; label: React.ReactNode; value: number; color: Hue};

/**
 * Diagram batang energi. `max` = nilai yang setara tinggi penuh. Garis putus-putus = total.
 * (x, y) = kiri-bawah area batang.
 */
export const EnergyBars: React.FC<{
  x: number;
  y: number;
  bars: Bar[];
  max: number;
  height?: number;
  barW?: number;
  gap?: number;
  opacity?: number;
  unit?: string;
  showValues?: boolean;
  total?: boolean;
  title?: string;
}> = ({x, y, bars, max, height = 300, barW = 80, gap = 34, opacity = 1, unit = 'J', showValues = true, total = true, title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (opacity <= 0.001) return null;
  const width = bars.length * barW + (bars.length - 1) * gap;
  const sum = bars.reduce((s, b) => s + b.value, 0);
  const tot = barW;
  const totX = x + width + gap * 1.4;
  return (
    <g opacity={opacity}>
      {title ? (
        <Label x={x + (width + (total ? gap * 1.4 + tot : 0)) / 2} y={y - height - 56} size={24} color={C.muted} weight={600} spacing={2}>
          {title}
        </Label>
      ) : null}
      <rect x={x - 22} y={y - height - 26} width={width + 44 + (total ? gap * 1.4 + tot : 0)} height={height + 26 + 82} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
      <line x1={x - 10} y1={y} x2={x + width + 10 + (total ? gap * 1.4 + tot : 0)} y2={y} stroke={C.muted} strokeWidth={2} />
      {bars.map((b, i) => {
        const bx = x + i * (barW + gap);
        const hgt = Math.max(0, (b.value / max) * height);
        return (
          <g key={b.key}>
            <rect x={bx} y={y - height} width={barW} height={height} rx={8} fill={hue(b.color)} opacity={0.07} />
            <LiquidBar x={bx} y={y} w={barW} h={hgt} color={hue(b.color)} t={t} seed={i * 3.7 + x * 0.01} />
            {showValues ? (
              <Label x={bx + barW / 2} y={y - hgt - 20} size={22} font="mono" color={hue(b.color)} weight={600}>
                {Math.round(b.value)}
              </Label>
            ) : null}
            <Label x={bx + barW / 2} y={y + 32} size={30} font="serif" italic color={hue(b.color)} weight={600}>
              {b.label}
            </Label>
          </g>
        );
      })}
      {total ? (
        <g>
          <rect x={totX} y={y - (sum / max) * height} width={tot} height={(sum / max) * height} rx={8} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 7" strokeDashoffset={-t * 22} />
          {(() => {
            let acc = 0;
            return bars.map((b) => {
              const hgt = (b.value / max) * height;
              const r = <rect key={b.key} x={totX + 6} y={y - acc - hgt} width={tot - 12} height={Math.max(0, hgt)} fill={hue(b.color)} opacity={0.85} />;
              acc += hgt;
              return r;
            });
          })()}
          {showValues ? (
            <Label x={totX + tot / 2} y={y - (sum / max) * height - 20} size={22} font="mono" color={C.ink} weight={600}>
              {Math.round(sum)}
            </Label>
          ) : null}
          <Label x={totX + tot / 2} y={y + 32} size={24} color={C.ink} weight={600}>
            total
          </Label>
        </g>
      ) : null}
      {unit ? (
        <Label x={x - 6} y={y + 66} size={18} color={C.muted} anchor="start" font="mono">
          {`satuan: ${unit}`}
        </Label>
      ) : null}
    </g>
  );
};

/** Isi batang energi seperti cairan: permukaan bergelombang, kilau tepi, gelembung naik. */
const LiquidBar: React.FC<{x: number; y: number; w: number; h: number; color: string; t: number; seed: number}> = ({x, y, w, h, color, t, seed}) => {
  if (h <= 0.5) return null;
  const amp = Math.min(4, h * 0.12);
  const top = y - h;
  const n = 8;
  const wave = Array.from({length: n + 1}, (_, k) => {
    const xx = x + (w * k) / n;
    const yy = top + amp * Math.sin(t * 3.2 + k * 0.9 + seed) * Math.sin(t * 1.1 + seed);
    return `${k === 0 ? 'M' : 'L'}${xx.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
  const d = `${wave} L${x + w},${y - 8} Q${x + w},${y} ${x + w - 8},${y} L${x + 8},${y} Q${x},${y} ${x},${y - 8} Z`;
  const bubbles = h > 30 ? 4 : 0;
  return (
    <g>
      <path d={d} fill={color} />
      <path d={wave} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <rect x={x + 8} y={top + 6} width={9} height={Math.max(0, h - 14)} rx={4.5} fill="#fff" opacity={0.16} />
      {Array.from({length: bubbles}, (_, k) => {
        const ph = (((t * (0.22 + 0.07 * k) + k * 0.31 + seed) % 1) + 1) % 1;
        const by = y - 6 - ph * (h - 14);
        const bx = x + w * (0.35 + 0.4 * ((k * 0.618 + seed) % 1)) + 3 * Math.sin(t * 2 + k);
        return <circle key={k} cx={bx} cy={by} r={2 + (k % 2)} fill="#fff" opacity={0.35 * Math.min(1, ph * 6) * (1 - ph)} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Sumbu grafik                                                         */
/* ------------------------------------------------------------------ */

export type Axes = {
  x0: number; // piksel kiri area plot
  y0: number; // piksel baris nilai nol (sumbu horizontal)
  w: number;
  h: number; // tinggi ke atas dari y0 untuk nilai ymax
  xmax: number;
  ymax: number;
  ymin?: number;
};
export const px = (a: Axes, x: number) => a.x0 + (x / a.xmax) * a.w;
export const py = (a: Axes, y: number) => a.y0 - (y / a.ymax) * a.h;

/** Sumbu x–y dengan panah, label, dan tanda skala. */
export const Plot: React.FC<{
  a: Axes;
  p?: number;
  xLabel: React.ReactNode;
  yLabel: React.ReactNode;
  xTicks?: number[];
  yTicks?: number[];
  opacity?: number;
}> = ({a, p = 1, xLabel, yLabel, xTicks = [], yTicks = [], opacity = 1}) => {
  const ybot = a.ymin !== undefined ? py(a, a.ymin) : a.y0;
  return (
    <g opacity={opacity * p}>
      {yTicks.map((v) => (
        <line key={`g${v}`} x1={a.x0} y1={py(a, v)} x2={a.x0 + a.w} y2={py(a, v)} stroke={C.line} strokeWidth={1.5} strokeDasharray="4 8" />
      ))}
      <line x1={a.x0} y1={a.y0} x2={a.x0 + a.w + 30} y2={a.y0} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
      <line x1={a.x0} y1={ybot + 10} x2={a.x0} y2={a.y0 - a.h - 30} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
      {xTicks.map((v) => (
        <g key={`x${v}`}>
          <line x1={px(a, v)} y1={a.y0 - 6} x2={px(a, v)} y2={a.y0 + 6} stroke={C.muted} strokeWidth={2} />
          <Label x={px(a, v)} y={a.y0 + 26} size={20} font="mono" color={C.muted}>
            {String(v).replace('.', ',')}
          </Label>
        </g>
      ))}
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={a.x0 - 6} y1={py(a, v)} x2={a.x0 + 6} y2={py(a, v)} stroke={C.muted} strokeWidth={2} />
          <Label x={a.x0 - 16} y={py(a, v)} size={20} font="mono" color={C.muted} anchor="end">
            {String(v).replace('.', ',')}
          </Label>
        </g>
      ))}
      <Label x={a.x0 + a.w + 46} y={a.y0} size={26} font="serif" italic anchor="start" color={C.ink}>
        {xLabel}
      </Label>
      <Label x={a.x0 + 18} y={a.y0 - a.h - 34} size={26} font="serif" italic anchor="start" color={C.ink}>
        {yLabel}
      </Label>
    </g>
  );
};

/** Angka besar yang menghitung naik (readout) – dipakai untuk joule/meter. */
export const fmt = (v: number, digits = 0) => {
  const [i, d] = v.toFixed(digits).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : '');
};

/** Label energi singkat: K, U_g, U_s, E_termal. */
export const ELabel: Record<string, React.ReactNode> = {
  K: 'K',
  Ug: (
    <>
      U<TSub>g</TSub>
    </>
  ),
  Us: (
    <>
      U<TSub>s</TSub>
    </>
  ),
  Th: (
    <>
      E<TSub>th</TSub>
    </>
  ),
};
