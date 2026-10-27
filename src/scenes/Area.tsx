import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {type Axes, Plot, fmt, px, py} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Gaya berubah: potong menjadi pita F·dx → luas di bawah grafik = integral.
// Lalu grafik modul (luas bertanda 40 + 20 − 10 = 50 J) dan jebakan grafik F–t.

const A: Axes = {x0: 230, y0: 680, w: 900, h: 330, xmax: 6, ymax: 25, ymin: -12};
const F = (x: number) => 14 + 7 * Math.sin(1.1 * x + 0.3) - x;
// integral analitik F dari 0 sampai x (untuk penghitung W yang berjalan)
const IF = (x: number) => 14 * x - (7 / 1.1) * (Math.cos(1.1 * x + 0.3) - Math.cos(0.3)) - (x * x) / 2;
const G = (x: number) => (x <= 2 ? 20 : x <= 4 ? 20 - 10 * (x - 2) : -5 * (x - 4)); // grafik modul

const curve = (f: (x: number) => number, x1 = 6, n = 160) =>
  Array.from({length: n + 1}, (_, i) => {
    const x = (x1 * i) / n;
    return `${i === 0 ? 'M' : 'L'}${px(A, x).toFixed(1)},${py(A, f(x)).toFixed(1)}`;
  }).join(' ');
const CURVE = curve(F);
const AREA = `${curve(F)} L${px(A, 6)},${A.y0} L${px(A, 0)},${A.y0} Z`;
const TRACK_Y = 280;

// grafik modul: bagian-bagian luas
const RECT40 = `M${px(A, 0)},${A.y0} L${px(A, 0)},${py(A, 20)} L${px(A, 2)},${py(A, 20)} L${px(A, 2)},${A.y0} Z`;
const TRI20 = `M${px(A, 2)},${A.y0} L${px(A, 2)},${py(A, 20)} L${px(A, 4)},${A.y0} Z`;
const POS = `M${px(A, 0)},${A.y0} L${px(A, 0)},${py(A, 20)} L${px(A, 2)},${py(A, 20)} L${px(A, 4)},${A.y0} Z`;
const NEG = `M${px(A, 4)},${A.y0} L${px(A, 6)},${py(A, -10)} L${px(A, 6)},${A.y0} Z`;
const BELL = 'M1330,660 C1420,660 1440,450 1510,450 C1580,450 1600,660 1690,660 Z';

/** Cairan yang mengisi bentuk (clip) dari garis datar yFrom menuju yTo, permukaan beriak + gelembung. */
const Liquid: React.FC<{
  id: string;
  clip: string;
  x1: number;
  x2: number;
  yFrom: number;
  yTo: number;
  p: number;
  color: string;
  t: number;
  opacity?: number;
  bubbles?: number;
}> = ({id, clip, x1, x2, yFrom, yTo, p, color, t, opacity = 0.42, bubbles = 5}) => {
  if (p <= 0.001) return null;
  const level = mix(yFrom, yTo, p);
  const amp = 2 + 5 * Math.sin(Math.PI * Math.min(1, p));
  const n = 18;
  const wave = Array.from({length: n + 1}, (_, k) => {
    const x = x1 + ((x2 - x1) * k) / n;
    const y = level + amp * Math.sin(t * 3.1 + k * 0.85) * Math.sin(t * 1.3 + k * 0.3 + 1);
    return [x, y] as const;
  });
  const top = wave.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const body = `${top} L${x2},${yFrom} L${x1},${yFrom} Z`;
  const dir = yTo < yFrom ? -1 : 1;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={clip} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={body} fill={color} opacity={opacity} />
        <path d={top} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2.5} />
        {Array.from({length: bubbles}, (_, k) => {
          const ph = (((t * (0.18 + 0.05 * k) + k * 0.37) % 1) + 1) % 1;
          const bx = x1 + (x2 - x1) * ((k * 0.618 + 0.13) % 1) + 6 * Math.sin(t * 2 + k);
          const by = yFrom + dir * ph * Math.abs(level - yFrom);
          return <circle key={k} cx={bx} cy={by} r={2.5 + (k % 3)} fill="#fff" opacity={0.3 * cyc(ph)} />;
        })}
      </g>
    </g>
  );
};

/** Pita-pita F·dx; tinggi tiap pita tumbuh seperti cairan (grow 0..1 per pita). */
const Strips: React.FC<{n: number; op: number; grow: (i: number) => number; hi?: number; hiOp?: number; t: number; lit?: (i: number) => number}> = ({
  n,
  op,
  grow,
  hi = -1,
  hiOp = 0,
  t,
  lit,
}) => {
  if (op <= 0.001) return null;
  const dx = 6 / n;
  return (
    <g opacity={op}>
      {Array.from({length: n}, (_, i) => {
        const g = grow(i);
        if (g <= 0.001) return null;
        const xm = (i + 0.5) * dx;
        const full = A.y0 - py(A, F(xm));
        const h = full * g;
        const y = A.y0 - h;
        const isHi = i === hi;
        const l = lit ? lit(i) : 0;
        const pulse = isHi ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
        return (
          <g key={i}>
            <rect
              x={px(A, i * dx) + 1}
              y={y}
              width={px(A, dx) - A.x0 - 2}
              height={h}
              fill={C.work}
              fillOpacity={0.22 + (isHi ? (0.35 + 0.15 * pulse) * hiOp : 0) + 0.3 * l}
              stroke={C.work}
              strokeOpacity={0.85}
              strokeWidth={n > 20 ? 1 : 2}
            />
            {g < 0.999 || l > 0.01 ? (
              <rect x={px(A, i * dx) + 1} y={y - 1.5} width={px(A, dx) - A.x0 - 2} height={3} fill="#fff" opacity={0.6 * Math.max(Math.sin(Math.PI * g), l * (1 - l) * 4)} />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** Balok di lintasan atas dengan bayangan lantai dan panah gaya F(x). */
const Block: React.FC<{x: number; op: number; arrowOp: number; t: number; speed: number}> = ({x, op, arrowOp, t, speed}) => {
  if (op <= 0.001) return null;
  const X = px(A, x);
  return (
    <g opacity={op}>
      <ellipse cx={X} cy={TRACK_Y + 4} rx={44} ry={7} fill="#000" opacity={0.45} />
      {/* garis gerak di belakang balok */}
      {[0, 1, 2].map((k) => {
        const L = 46 * speed * (0.7 + 0.3 * Math.sin(t * 7 + k * 2));
        return speed > 0.02 ? (
          <line key={k} x1={X - 44 - L} y1={TRACK_Y - 56 + k * 18} x2={X - 44} y2={TRACK_Y - 56 + k * 18} stroke={C.ink} strokeOpacity={0.35 * speed} strokeWidth={3} strokeLinecap="round" />
        ) : null;
      })}
      <rect x={X - 35} y={TRACK_Y - 70} width={70} height={70} rx={10} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
      <rect x={X - 28} y={TRACK_Y - 63} width={56} height={8} rx={4} fill="#fff" opacity={0.1} />
      <Arrow x1={X + 38} y1={TRACK_Y - 35} x2={X + 38 + F(x) * 7} y2={TRACK_Y - 35} color="force" width={6} opacity={arrowOp} />
    </g>
  );
};

export const Area: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  // grafik 1 (gaya berubah halus)
  const g1 = 1 - ramp(t, cue(6) - 0.2, cue(6) + 0.8, EASE_IN_OUT);
  const axes = ramp(t, 0.4, 1.4);
  const run = ramp(t, cue(0) + 1.5, cue(1) + 2.5, EASE_IN_OUT);
  const bx = run * 6;
  const sp1 = Math.sin(Math.PI * run) * (run > 0 && run < 1 ? 1 : 0);
  // pita 6 (tumbuh bergiliran), 12, lalu 40 yang menyala saat balok lewat (lari kedua)
  const s6 = win(t, cue(1) + 0.6, cue(3) + 2.4, 0.4, 0.8);
  const hiOp = win(t, cue(2) + 0.4, cue(4), 0.6, 0.6);
  const s12 = win(t, cue(3) + 2.0, cue(4) + 0.6, 0.4, 0.6);
  const run2 = ramp(t, cue(4) + 1.0, cue(4) + 5.6, EASE_IN_OUT);
  const bx2 = run2 * 6;
  const sp2 = Math.sin(Math.PI * run2);
  const s40 = win(t, cue(4) + 0.8, cue(4) + 6.0, 0.3, 0.8);
  const fill = ramp(t, cue(4) + 5.6, cue(4) + 6.6);
  const intg = win(t, cue(5) + 0.2, cue(6) - 0.2, 0.8, 0.6);
  const acc = win(t, cue(4) + 0.9, cue(5) - 0.1, 0.6, 0.5);
  const opA = 1 - ramp(t, cue(4) + 0.15, cue(4) + 0.55, EASE_IN_OUT);
  const opB = ramp(t, cue(4) + 0.55, cue(4) + 0.95);
  const fArrow = ramp(t, cue(0) + 1, cue(0) + 1.6);
  const sweep = win(t, cue(5) - 0.2, cue(6), 0.8, 0.6);

  // kamera: dorong pelan ke pita yang disorot (baris 2–3)
  const zoom = ramp(t, cue(2) + 0.3, cue(2) + 1.8, EASE_IN_OUT) * (1 - ramp(t, cue(3) + 3.4, cue(3) + 5.0, EASE_IN_OUT));
  const zs = 1 + 0.12 * zoom;
  const zc = [px(A, 3.5), 600];

  // grafik 2 (modul)
  const g2 = ramp(t, cue(6) + 0.2, cue(6) + 1.2);
  const wPos = wordOf(6, 'atas');
  const wNeg = wordOf(6, 'bawah');
  const posFill = ramp(t, wPos - 0.3, wPos + 1.4, EASE_IN_OUT);
  const negFill = ramp(t, wNeg - 0.3, wNeg + 1.4, EASE_IN_OUT);
  const signs = ramp(t, cue(6) + 1.5, cue(6) + 2.5);
  const w40 = wordOf(7, 'empat');
  const w20 = wordOf(7, 'segitiga');
  const w10 = wordOf(7, 'dikurangi');
  const wTot = wordOf(7, 'Totalnya');
  const l40 = ramp(t, w40, w40 + 0.8);
  const l20 = ramp(t, w20, w20 + 0.8);
  const l10 = ramp(t, w10, w10 + 0.8);
  const fl = (w: number) => win(t, w - 0.1, w + 1.2, 0.3, 0.9);
  const tot = win(t, wTot - 0.2, cue(8) + 0.2, 0.7, 0.6);
  const totStream = win(t, wTot - 0.5, cue(8), 0.5, 0.6);
  const legend = win(t, cue(6) + 1.0, cue(8) + 0.2, 0.7, 0.6);

  // jebakan F–t
  const trap = ramp(t, cue(8) + 0.2, cue(8) + 1.2);
  const xHi = win(t, cue(8) + 0.4, 999, 0.6, 0.6);
  const wLuas = wordOf(8, 'Luas');
  const inset = ramp(t, wLuas - 0.2, wLuas + 0.8);
  const bellDraw = ramp(t, wLuas + 0.1, wLuas + 1.6, EASE_IN_OUT);
  const bellFill = ramp(t, wLuas + 1.0, wLuas + 2.6, EASE_IN_OUT);
  const boxPulse = 1 + 0.06 * Math.sin(t * 4.5);

  const MOD = curve(G, 6, 120);
  const penX = px(A, bx);
  const penY = py(A, F(bx));
  const penTrail = Array.from({length: 7}, (_, k) => {
    const xx = Math.max(0, bx - (k + 1) * 0.06);
    return [px(A, xx), py(A, F(xx))] as [number, number];
  });
  const fr2 = [px(A, bx2), py(A, F(bx2))] as const;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="area-fillg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.work} stopOpacity="0.55" />
            <stop offset="100%" stopColor={C.work} stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="area-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="area-clipA">
            <path d={AREA} />
          </clipPath>
        </defs>
        <Motes x={680} y={520} rx={520} ry={300} n={26} color="work" opacity={0.35} seed={4} />

        <g transform={`translate(${zc[0]} ${zc[1]}) scale(${zs}) translate(${-zc[0]} ${-zc[1]})`}>
          <Plot a={A} p={axes} xLabel="x (m)" yLabel="F (N)" xTicks={[1, 2, 3, 4, 5, 6]} yTicks={[-10, 10, 20]} />
          <Label x={px(A, 5.2)} y={A.y0 - 44} size={26} color={C.gold} opacity={xHi} weight={600}>
            posisi, bukan waktu!
          </Label>
          <g opacity={xHi} transform={`translate(${A.x0 + A.w + 84} ${A.y0}) scale(${boxPulse})`}>
            <rect x={-56} y={-26} width={112} height={52} rx={12} fill={C.gold} opacity={0.1} />
            <rect x={-50} y={-22} width={100} height={44} rx={10} fill="none" stroke={C.gold} strokeWidth={3} />
          </g>

          {/* ===== grafik gaya berubah ===== */}
          <g opacity={g1}>
            {/* lintasan balok */}
            <line x1={A.x0 - 40} y1={TRACK_Y} x2={A.x0 + A.w + 40} y2={TRACK_Y} stroke={C.muted} strokeWidth={3} />
            {Array.from({length: 26}, (_, i) => (
              <line key={i} x1={A.x0 - 30 + i * 38} y1={TRACK_Y + 3} x2={A.x0 - 44 + i * 38} y2={TRACK_Y + 17} stroke={C.faint} strokeWidth={2} />
            ))}
            <line
              x1={px(A, bx)}
              y1={TRACK_Y + 2}
              x2={px(A, bx)}
              y2={py(A, F(bx))}
              stroke={C.muted}
              strokeWidth={1.5}
              strokeDasharray="5 7"
              opacity={0.8 * ramp(t, cue(0) + 1.4, cue(0) + 1.9) * (1 - ramp(t, cue(1) + 2.5, cue(1) + 3.2))}
            />
            <line x1={px(A, bx2)} y1={TRACK_Y + 2} x2={px(A, bx2)} y2={py(A, F(bx2))} stroke={C.work} strokeOpacity={0.7} strokeWidth={1.5} strokeDasharray="5 7" opacity={sp2} />
            <path d={AREA} fill="url(#area-fillg)" opacity={fill} />
            {/* sapuan cahaya pada luas (baris 5) */}
            <g clipPath="url(#area-clipA)" opacity={sweep}>
              {(() => {
                const ph = (((t - cue(5)) / 3.2) % 1 + 1) % 1;
                const x = A.x0 - 160 + ph * (A.w + 320);
                return <rect x={x - 80} y={A.y0 - A.h} width={160} height={A.h} fill="url(#area-band)" opacity={cyc(ph) * 1.4} />;
              })()}
            </g>
            <Strips n={6} op={s6} t={t} hi={3} hiOp={hiOp} grow={(i) => ramp(t, cue(1) + 0.6 + i * 0.28, cue(1) + 1.4 + i * 0.28, EASE_IN_OUT)} />
            <Strips n={12} op={s12} t={t} grow={(i) => ramp(t, cue(3) + 2.0 + i * 0.07, cue(3) + 2.7 + i * 0.07, EASE_IN_OUT)} />
            <Strips
              n={40}
              op={s40}
              t={t}
              grow={(i) => Math.max(0, Math.min(1, (bx2 - (i * 6) / 40) / 0.3))}
              lit={(i) => Math.max(0, Math.min(1, (bx2 - (i * 6) / 40) / 0.3)) * (1 - Math.max(0, Math.min(1, (bx2 - (i * 6) / 40 - 0.3) / 0.6)))}
            />
            <path d={CURVE} fill="none" stroke={C.force} strokeOpacity={0.25} strokeWidth={14} strokeDasharray="2000" strokeDashoffset={2000 * (1 - run)} pathLength={2000} />
            <path d={CURVE} fill="none" stroke={C.force} strokeWidth={5} strokeDasharray="2000" strokeDashoffset={2000 * (1 - run)} pathLength={2000} />
            {/* denyut energi yang terus merambat di sepanjang kurva */}
            {(() => {
              const ph = (((t - cue(1)) / 4.2) % 1 + 1) % 1;
              const xx = 6 * ph;
              return <Spark x={px(A, xx)} y={py(A, F(xx))} r={6} color="force" opacity={cyc(ph) * 1.2 * win(t, cue(1) + 2.8, cue(6) - 0.4, 0.8, 0.6) * (1 - acc)} />;
            })()}
            {/* ujung pena yang menggambar kurva */}
            <Spark x={penX} y={penY} r={7} color="force" opacity={sp1 > 0.001 ? Math.min(1, sp1 * 4) : 0} trail={penTrail} />
            {/* muka gelombang saat pita menyala */}
            <Spark x={fr2[0]} y={fr2[1]} r={7} color="work" opacity={Math.min(1, sp2 * 4) * opB} />
            <Block x={bx} op={opA} arrowOp={fArrow} t={t} speed={sp1} />
            <Block x={bx2} op={opB} arrowOp={1} t={t} speed={sp2} />
            {/* label pita F × dx */}
            <g opacity={hiOp}>
              {(() => {
                const x1 = px(A, 3);
                const x2 = px(A, 4);
                const yy = py(A, F(3.5));
                return (
                  <g>
                    <Arrow x1={x1} y1={A.y0 + 46} x2={x2} y2={A.y0 + 46} color="cyan" width={3} both />
                    <Label x={(x1 + x2) / 2} y={A.y0 + 76} size={28} font="serif" italic color={C.cyan}>
                      dx
                    </Label>
                    <Arrow x1={x2 + 22} y1={A.y0} x2={x2 + 22} y2={yy} color="force" width={3} both />
                    <Label x={x2 + 40} y={(A.y0 + yy) / 2} size={28} font="serif" italic color={C.force} anchor="start">
                      F
                    </Label>
                    <Label x={(x1 + x2) / 2} y={(A.y0 + yy) / 2 + 2} size={24} font="serif" italic color={C.ink} weight={600} opacity={ramp(t, cue(3) + 0.3, cue(3) + 1.0) * s6}>
                      F·dx
                    </Label>
                  </g>
                );
              })()}
            </g>
          </g>

          {/* ===== grafik modul ===== */}
          <g opacity={g2}>
            <Liquid id="area-liq-pos" clip={POS} x1={px(A, 0)} x2={px(A, 4)} yFrom={A.y0} yTo={py(A, 20) - 12} p={posFill} color={C.work} t={t} />
            <Liquid id="area-liq-neg" clip={NEG} x1={px(A, 4)} x2={px(A, 6)} yFrom={A.y0} yTo={py(A, -10) + 12} p={negFill} color={C.heat} t={t} opacity={0.48} bubbles={3} />
            {/* kilatan bagian yang sedang disebut */}
            <path d={RECT40} fill="#fff" opacity={0.16 * fl(w40)} />
            <path d={TRI20} fill="#fff" opacity={0.16 * fl(w20)} />
            <path d={NEG} fill="#fff" opacity={0.16 * fl(w10)} />
            <line x1={px(A, 2)} y1={py(A, 20)} x2={px(A, 2)} y2={A.y0} stroke={C.work} strokeWidth={2} strokeDasharray="6 6" opacity={posFill} />
            <path d={MOD} fill="none" stroke={C.force} strokeOpacity={0.22} strokeWidth={14} />
            <path d={MOD} fill="none" stroke={C.force} strokeWidth={5} />
            <g opacity={signs}>
              <Label x={px(A, 0.35)} y={py(A, 16.5)} size={40 * (1 + 0.08 * Math.sin(t * 3))} color={C.work} weight={700}>
                +
              </Label>
              <Label x={px(A, 4.75)} y={py(A, -1.4)} size={36 * (1 + 0.08 * Math.sin(t * 3 + 1.5))} color={C.heat} weight={700}>
                −
              </Label>
            </g>
            <Ripple x={px(A, 1)} y={py(A, 10)} p={ramp(t, w40, w40 + 1.3)} r={120} color="work" />
            <Ripple x={px(A, 2.62)} y={py(A, 6.5)} p={ramp(t, w20, w20 + 1.3)} r={100} color="work" />
            <Ripple x={px(A, 5.25)} y={py(A, -6)} p={ramp(t, w10, w10 + 1.3)} r={100} color="heat" />
            <Label x={px(A, 1)} y={py(A, 10)} size={36} font="mono" color={C.ink} weight={600} opacity={l40}>
              40 J
            </Label>
            <Label x={px(A, 2.62)} y={py(A, 6.5)} size={32} font="mono" color={C.ink} weight={600} opacity={l20}>
              20 J
            </Label>
            <Label x={px(A, 5.25)} y={py(A, -10.5)} size={32} font="mono" color={C.heat} weight={600} opacity={l10}>
              −10 J
            </Label>
          </g>
        </g>

        {/* aliran ketiga luas menuju kartu total */}
        <Stream pts={[[px(A, 1) + 50, py(A, 10)], [800, 520], [1190, 590]]} color="work" n={9} speed={0.55} opacity={totStream * g2} seed={1} />
        <Stream pts={[[px(A, 2.62) + 48, py(A, 6.5)], [900, 580], [1190, 605]]} color="work" n={7} speed={0.6} opacity={totStream * g2} seed={2} />
        <Stream pts={[[px(A, 5.25) + 40, py(A, -10.5) - 20], [1120, 720], [1200, 625]]} color="heat" n={6} speed={0.6} opacity={totStream * g2} seed={3} />
        <Ripple x={1500} y={600} p={ramp(t, wTot + 0.2, wTot + 1.6)} r={380} color="gold" />
        <Glow x={1500} y={460} r={300} color="work" opacity={intg * 0.6} />

        {/* ===== jebakan: grafik F–t ===== */}
        <g opacity={inset}>
          <rect x={1250} y={330} width={540} height={420} rx={20} fill="rgba(10,16,36,0.82)" stroke={C.heat} strokeOpacity={0.7} strokeWidth={2} />
          <line x1={1310} y1={660} x2={1740} y2={660} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={1310} y1={670} x2={1310} y2={400} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <Liquid id="area-liq-bell" clip={BELL} x1={1330} x2={1690} yFrom={660} yTo={440} p={bellFill} color={C.cyan} t={t} opacity={0.34} bubbles={3} />
          <path
            d="M1330,660 C1420,660 1440,450 1510,450 C1580,450 1600,660 1690,660"
            fill="none"
            stroke={C.cyan}
            strokeWidth={4}
            strokeDasharray="1000"
            strokeDashoffset={1000 * (1 - bellDraw)}
            pathLength={1000}
          />
          <Ripple x={1510} y={450} p={ramp(t, wLuas + 0.8, wLuas + 2.2)} r={110} color="cyan" />
          <Label x={1740} y={694} size={26} font="serif" italic anchor="end">
            t (s)
          </Label>
          <Label x={1326} y={386} size={26} font="serif" italic anchor="start">
            F (N)
          </Label>
          <Label x={1520} y={590} size={28} color={C.cyan} weight={600} opacity={bellFill}>
            luas = impuls
          </Label>
        </g>
      </Stage>

      <Card x={1480} y={430} opacity={win(t, 0.6, cue(1), 0.7, 0.6)} accent={C.force} style={{padding: '12px 28px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 40}}>
          <V>W</V> = <V>F s</V> <span style={{fontFamily: FONT.head, fontSize: 30, color: C.muted}}>hanya jika F tetap</span>
        </div>
      </Card>

      <Formula x={1500} y={300} p={win(t, cue(2) + 0.6, cue(5), 0.7, 0.6)} accent={C.work} size={56}>
        <V>dW</V> = <V color={C.force}>F</V> <V color={C.cyan}>dx</V>
      </Formula>
      {/* penghitung usaha yang berjalan: jumlah pita yang sudah dilewati balok */}
      <Card x={1500} y={480} opacity={acc} accent={C.work} style={{padding: '16px 30px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 22, color: C.muted, letterSpacing: 2, fontWeight: 600}}>JUMLAH SEMUA PITA</div>
        <div style={{fontFamily: FONT.serif, fontSize: 46, marginTop: 4}}>
          Σ <V color={C.force}>F</V> <V color={C.cyan}>dx</V> ={' '}
          <span style={{fontFamily: FONT.mono, color: C.work, display: 'inline-block', width: 170, textAlign: 'right'}}>{fmt(IF(bx2), 1)}</span>
          <span style={{fontFamily: FONT.mono, color: C.work}}> J</span>
        </div>
        <div style={{marginTop: 10, height: 8, borderRadius: 4, background: 'rgba(79,227,160,0.15)'}}>
          <div style={{height: 8, borderRadius: 4, width: `${(IF(bx2) / IF(6)) * 100}%`, background: C.work, boxShadow: `0 0 12px ${C.work}`}} />
        </div>
      </Card>
      <Formula x={1500} y={460} p={intg} accent={C.work} size={60} caption="luas di bawah grafik F terhadap posisi">
        <V color={C.work}>W</V> ={' '}
        <span style={{fontSize: '1.3em', position: 'relative', top: '0.06em'}}>∫</span>
        <V color={C.force}>F</V> <V color={C.cyan}>dx</V>
      </Formula>
      <Card x={1500} y={380} opacity={legend * (1 - inset)} accent={C.muted} style={{padding: '14px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, lineHeight: 1.6}}>
          <div>
            <span style={{color: C.work, fontWeight: 700}}>+</span> luas di atas sumbu
          </div>
          <div>
            <span style={{color: C.heat, fontWeight: 700}}>−</span> luas di bawah sumbu
          </div>
        </div>
      </Card>
      <Formula x={1500} y={600} p={tot} accent={C.gold} size={56}>
        <V>W</V> = 40 + 20 − 10 = <span style={{color: C.gold}}>50 J</span>
      </Formula>
      <Card x={1520} y={810} opacity={inset} accent={interpolateColors(trap, [0, 1], [C.muted, C.heat])} style={{padding: '10px 24px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.heat}}>
          bukan usaha — dibahas di video <span style={{color: C.ink}}>Momentum</span>
        </div>
      </Card>

      {/* kilau di atas kartu hasil */}
      <Stage>
        <Twinkles x={1730} y={600} rx={80} ry={52} n={6} color="gold" opacity={tot * ramp(t, wTot + 0.3, wTot + 1)} seed={5} />
      </Stage>
    </AbsoluteFill>
  );
};
