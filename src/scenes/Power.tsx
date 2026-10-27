import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Crate, Ground, HeatShimmer, Person, fmt} from '../components/physics';
import {Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Daya: dua orang menaiki tangga identik (usaha sama, waktu beda), lalu motor pengangkat
// 200 kg setinggi 12 m dalam 15 s (1600 W berguna; η = 0,80 → 2000 W masuk) sebagai aliran energi.

const STEPS = 6;
const RUN = 74;
const RISE = 60;
const FLOOR = 820;

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x));
  return c * c * (3 - 2 * c);
};

/** Tangga dengan dasar kiri di (x0, FLOOR), plus pegangan tangan & sisi berkedalaman. */
const Stairs: React.FC<{x0: number}> = ({x0}) => {
  const d: string[] = [`M${x0 - 60},${FLOOR}`, `L${x0},${FLOOR}`];
  for (let i = 0; i < STEPS; i++) {
    d.push(`L${x0 + i * RUN},${FLOOR - (i + 1) * RISE}`, `L${x0 + (i + 1) * RUN},${FLOOR - (i + 1) * RISE}`);
  }
  d.push(`L${x0 + STEPS * RUN + 70},${FLOOR - STEPS * RISE}`);
  const fill = `${d.join(' ')} L${x0 + STEPS * RUN + 70},${FLOOR} Z`;
  const rail = (k: number) => ({x: x0 + k * RUN + 30, y: FLOOR - k * RISE - 112});
  return (
    <g>
      <path d={fill} fill="url(#pow-stair)" opacity={0.95} />
      {Array.from({length: STEPS}, (_, i) => (
        <line key={i} x1={x0 + i * RUN + 4} y1={FLOOR - (i + 1) * RISE + 2} x2={x0 + (i + 1) * RUN - 4} y2={FLOOR - (i + 1) * RISE + 2} stroke="#fff" strokeOpacity={0.12} strokeWidth={4} />
      ))}
      <path d={d.join(' ')} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
      {/* pegangan tangan */}
      {[0, 2, 4, 6].map((k) => {
        const r = rail(k);
        return <line key={k} x1={r.x} y1={r.y} x2={r.x} y2={r.y + 112 - (k === 0 ? 0 : 0)} stroke={C.faint} strokeWidth={3} />;
      })}
      <line x1={rail(0).x} y1={rail(0).y} x2={rail(6).x} y2={rail(6).y} stroke={C.muted} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
      <line x1={x0 - 80} y1={FLOOR} x2={x0 + STEPS * RUN + 90} y2={FLOOR} stroke={C.ink} strokeOpacity={0.7} strokeWidth={3} />
    </g>
  );
};

/** Posisi kaki orang pada tangga untuk kemajuan s (0..1). */
const climb = (x0: number, s: number) => {
  const k = s * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(k));
  const f = s >= 1 ? 1 : k - i;
  const lift = smooth((f - 0.25) / 0.5);
  return {x: x0 - 30 + (k + 0.4) * RUN, y: FLOOR - RISE * Math.min(STEPS, i + lift), phase: k * Math.PI};
};

/** Pita aliran energi (Sankey) dari (x1, y1) ke (x2, y2) dengan tebal w. */
const band = (x1: number, y1: number, x2: number, y2: number, w: number) => {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1 - w / 2} C${mx},${y1 - w / 2} ${mx},${y2 - w / 2} ${x2},${y2 - w / 2} L${x2},${y2 + w / 2} C${mx},${y2 + w / 2} ${mx},${y1 + w / 2} ${x1},${y1 + w / 2} Z`;
};
/** Titik-titik garis tengah pita (untuk butir aliran). */
const bandMid = (x1: number, y1: number, x2: number, y2: number): [number, number][] => {
  const mx = (x1 + x2) / 2;
  return Array.from({length: 17}, (_, i) => {
    const u = i / 16;
    const a = (1 - u) ** 3;
    const b = 3 * (1 - u) ** 2 * u;
    const c = 3 * (1 - u) * u * u;
    const d = u ** 3;
    return [a * x1 + b * mx + c * mx + d * x2, a * y1 + b * y1 + c * y2 + d * y2] as [number, number];
  });
};

/** Satu kolom angka odometer yang berputar halus (pos kontinu). */
const Digit: React.FC<{x: number; y: number; pos: number; id: string; color?: string}> = ({x, y, pos, id, color = C.ink}) => {
  const m = ((pos % 10) + 10) % 10;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x - 20} y={y - 28} width={40} height={56} rx={4} />
        </clipPath>
      </defs>
      <rect x={x - 20} y={y - 28} width={40} height={56} rx={4} fill="#050914" stroke={C.faint} strokeWidth={1.5} />
      <g clipPath={`url(#${id})`}>
        {[-1, 0, 1].map((k) => {
          const dgt = (((Math.floor(m) + k) % 10) + 10) % 10;
          const yy = y + (k - (m - Math.floor(m))) * 48;
          return (
            <text key={k} x={x} y={yy} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={36} fontWeight={600} fill={color}>
              {dgt}
            </text>
          );
        })}
      </g>
      <rect x={x - 20} y={y - 28} width={40} height={14} fill="#000" opacity={0.35} />
      <rect x={x - 20} y={y + 14} width={40} height={14} fill="#000" opacity={0.35} />
    </g>
  );
};

/** Jarum pengukur laju energi (setengah lingkaran 0–800 W). */
const Gauge: React.FC<{x: number; y: number; val: number; color: string; label: string; t: number}> = ({x, y, val, color, label, t}) => {
  const R = 86;
  const ang = Math.PI * (1 - Math.min(1, val / 800));
  const pct = Math.min(1, val / 800);
  return (
    <g>
      <path d={`M${x - R},${y} A${R},${R} 0 0 1 ${x + R},${y}`} fill="rgba(10,16,36,0.85)" stroke={C.line} strokeWidth={3} />
      <path d={`M${x - R + 14},${y} A${R - 14},${R - 14} 0 0 1 ${x + R - 14},${y}`} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={10} />
      <path
        d={`M${x - R + 14},${y} A${R - 14},${R - 14} 0 0 1 ${x + R - 14},${y}`}
        fill="none"
        stroke={color}
        strokeWidth={10}
        pathLength={100}
        strokeDasharray={`${100 * pct} 100`}
      />
      {Array.from({length: 9}, (_, i) => {
        const a = Math.PI * (1 - i / 8);
        return <line key={i} x1={x + (R - 4) * Math.cos(a)} y1={y - (R - 4) * Math.sin(a)} x2={x + (R - (i % 2 ? 12 : 22)) * Math.cos(a)} y2={y - (R - (i % 2 ? 12 : 22)) * Math.sin(a)} stroke={C.muted} strokeWidth={2} />;
      })}
      <line x1={x} y1={y} x2={x + (R - 18) * Math.cos(ang + 0.02 * Math.sin(t * 17) * pct)} y2={y - (R - 18) * Math.sin(ang + 0.02 * Math.sin(t * 17) * pct)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <circle cx={x} cy={y} r={8} fill={C.gold} />
      <Label x={x} y={y + 30} size={24} color={color} weight={600}>
        {label}
      </Label>
    </g>
  );
};

export const Power: React.FC = () => {
  const {t, cue} = useScene();

  // ---------- bagian A: dua orang menaiki tangga ----------
  const phaseA = 1 - ramp(t, cue(5) - 0.6, cue(5) + 0.2, EASE_IN_OUT);
  const t0 = cue(0) + 1.2;
  const t2 = cue(2) + 0.3; // putar ulang saat "Bedanya ada pada waktu"
  const TW = 9; // detik, berjalan
  const TR = 3; // detik, berlari
  const XW = 190;
  const XR = 830;
  const rep = ramp(t, t2 - 0.6, t2 - 0.05, EASE_IN_OUT);
  const lin = (x: number) => x;
  const runs = [t0, t2].map((st) => ({
    sW: ramp(t, st, st + TW, lin),
    sR: ramp(t, st, st + TR, lin),
    clW: Math.min(ramp(t, st - 0.1, st + 0.3), 1 - ramp(t, st + TW - 0.2, st + TW + 0.4)),
    clR: Math.min(ramp(t, st - 0.1, st + 0.3), 1 - ramp(t, st + TR - 0.2, st + TR + 0.4)),
    doneW: ramp(t, st + TW, st + TW + 0.4),
    doneR: ramp(t, st + TR, st + TR + 0.4),
    exR: win(t, st, st + TR + 4, 0.3, 3),
    st,
  }));
  const vis = [1 - rep, rep];
  const mixRun = (f: (r: (typeof runs)[0]) => number) => mix(f(runs[0]), f(runs[1]), rep);
  const stairsIn = ramp(t, 0, 1);
  const ugTag = win(t, cue(1), cue(5) - 0.6, 0.6, 0.5);
  const pTag = ramp(t, Math.max(cue(3) + 2.5, t2 + TW + 0.3), Math.max(cue(3) + 3.3, t2 + TW + 1.1));
  const fP = win(t, cue(3) + 0.3, cue(5) - 0.6, 0.6, 0.5);
  const fFv = win(t, cue(4) + 0.2, cue(5) - 0.6, 0.6, 0.5);
  const gauges = win(t, t0 - 0.6, cue(3) - 0.2, 0.6, 0.5);
  const valW = mixRun((r) => r.clW) * 200;
  const valR = mixRun((r) => r.clR) * 600;

  // ---------- bagian B: motor pengangkat ----------
  const phaseB = ramp(t, cue(5) - 0.2, cue(5) + 0.8);
  const lift = ramp(t, cue(5) + 1.2, cue(5) + 7.2, EASE_IN_OUT);
  const lifting = win(t, cue(5) + 1.2, cue(5) + 7.0, 0.5, 0.6);
  const simT = 15 * ramp(t, cue(5) + 1.2, cue(5) + 7.2, lin);
  const crateY = mix(830, 450, lift);
  const drumRot = lift * 1400;
  const calc = win(t, cue(6) + 0.2, cue(8) - 0.2, 0.6, 0.5);
  const eta = win(t, cue(8) + 0.1, cue(9) - 0.2, 0.6, 0.5);
  const kwh = ramp(t, cue(9) + 0.3, cue(9) + 1.1);
  const sankIn = ramp(t, cue(7) + 0.2, cue(7) + 1.4, EASE_IN_OUT);
  const sankSplit = ramp(t, cue(7) + 1.6, cue(7) + 3.0, EASE_IN_OUT);
  const heatGlow = ramp(t, cue(7) + 2.0, cue(8) + 1.0);
  const powered = Math.max(lifting, sankIn);
  const readout = win(t, cue(5) + 0.8, cue(7) + 0.2, 0.6, 0.6);
  const sankDim = 1 - 0.82 * kwh;
  const meterIn = ramp(t, cue(9) + 1.0, cue(9) + 2.0);

  // Sankey: 2000 W → 1600 W berguna + 400 W panas (tebal sebanding)
  const SK = 0.05; // px per watt
  const wIn = 2000 * SK;
  const wUse = 1600 * SK;
  const wHeat = 400 * SK;
  const sx0 = 880;
  const sx1 = 1180;
  const sy = 560;
  const yUse1 = sy - wIn / 2 + wUse / 2;
  const yHeat1 = sy + wIn / 2 - wHeat / 2;

  // kWh meter: pembacaan (persepuluh kWh) berputar terus
  const kv = 364 + Math.max(0, t - (cue(9) + 1.0)) * 6;
  const dpos = (k: number) => {
    if (k === 0) return kv;
    const p = 10 ** k;
    const base = Math.floor(kv / p);
    const r = Math.max(0, Math.min(1, (kv % p) - (p - 1)));
    return base + r;
  };

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="pow-stair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2752" />
            <stop offset="100%" stopColor="#0c1433" />
          </linearGradient>
          <linearGradient id="pow-motor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24346a" />
            <stop offset="100%" stopColor="#121c40" />
          </linearGradient>
          <clipPath id="pow-clip-in">
            <rect x={sx0 - 2} y={400} width={(sx1 - sx0 + 4) * sankIn} height={300} />
          </clipPath>
          <clipPath id="pow-clip-out">
            <rect x={sx1 - 2} y={380} width={(1760 - sx1) * sankSplit + 2} height={480} />
          </clipPath>
        </defs>

        {/* ===== bagian A ===== */}
        <g opacity={phaseA * stairsIn}>
          <Stairs x0={XW} />
          <Stairs x0={XR} />
          {/* meter Ug per tangga: tinggi batang = tinggi orang di atas lantai */}
          {[
            {x: XW + STEPS * RUN + 85, key: 'W' as const, rate: 0.35, n: 4},
            {x: XR + STEPS * RUN + 85, key: 'R' as const, rate: 1.15, n: 10},
          ].map((m, i) => {
            const x0 = m.key === 'W' ? XW : XR;
            const sv = mixRun((r) => (FLOOR - climb(x0, m.key === 'W' ? r.sW : r.sR).y) / (STEPS * RISE));
            const H = STEPS * RISE * sv;
            const top = FLOOR - H;
            const wave = Array.from({length: 7}, (_, k) => `${k ? 'L' : 'M'}${(m.x + (26 * k) / 6).toFixed(1)},${(top + Math.min(2.2, H * 0.3) * Math.sin(t * 4 + k * 1.1 + i)).toFixed(1)}`).join(' ');
            return (
              <g key={i}>
                <rect x={m.x} y={FLOOR - STEPS * RISE} width={26} height={STEPS * RISE} rx={6} fill={C.pot} opacity={0.12} stroke={C.pot} strokeOpacity={0.3} strokeWidth={1.5} />
                {H > 0.5 ? <path d={`${wave} L${m.x + 26},${FLOOR} L${m.x},${FLOOR} Z`} fill={C.pot} /> : null}
                <rect x={m.x + 4} y={top + 6} width={5} height={Math.max(0, H - 10)} rx={2.5} fill="#fff" opacity={0.2} />
                <Glow x={m.x + 13} y={top} r={44} color="pot" opacity={Math.min(1, H / 30) * (0.5 + 0.5 * Math.max(...runs.map((r, j) => (m.key === 'W' ? r.clW : r.clR) * vis[j])))} />
                <Label x={m.x + 13} y={FLOOR - STEPS * RISE - 30} size={28} font="serif" italic color={C.pot} weight={600}>
                  U<tspan baselineShift="sub" fontSize="0.65em">g</tspan>
                </Label>
              </g>
            );
          })}
          {/* dua orang (putaran pertama & putaran ulang, bersilang-pudar) */}
          {runs.map((r, j) => {
            const pw = climb(XW, r.sW);
            const pr = climb(XR, r.sR);
            const bobW = -4 * Math.abs(Math.sin(pw.phase)) * r.clW + 1.5 * Math.sin(t * 2.1) * (1 - r.clW);
            const pant = r.exR * (1 - r.clR);
            const bobR = -7 * Math.abs(Math.sin(pr.phase)) * r.clR + (1.5 + 2.5 * pant) * Math.sin(t * (2.1 + 4 * pant));
            const mW = {x: XW + STEPS * RUN + 98, y: FLOOR - (FLOOR - pw.y)};
            const mR = {x: XR + STEPS * RUN + 98, y: FLOOR - (FLOOR - pr.y)};
            const hx = pr.x + 10 * r.clR;
            const hy = pr.y + bobR - 160;
            return (
              <g key={j} opacity={vis[j]}>
                <ellipse cx={pw.x} cy={pw.y + 2} rx={30} ry={6} fill="#000" opacity={0.4} />
                <ellipse cx={pr.x} cy={pr.y + 2} rx={30} ry={6} fill="#000" opacity={0.4} />
                {/* energi dari tubuh ke meter Ug: lambat vs cepat */}
                <Stream pts={[[pw.x + 10, pw.y - 100], [mW.x - 30, Math.min(pw.y, mW.y) - 120], [mW.x, mW.y - 6]]} color="pot" n={4} speed={0.35} r={4.5} opacity={r.clW} seed={j + 1} />
                <Stream pts={[[pr.x + 10, pr.y - 100], [mR.x - 30, Math.min(pr.y, mR.y) - 120], [mR.x, mR.y - 6]]} color="pot" n={10} speed={1.15} r={4.5} opacity={r.clR} seed={j + 3} />
                <g transform={`translate(0 ${bobW})`}>
                  <Person x={pw.x} y={pw.y} phase={pw.phase} scale={0.9} color={C.ink} />
                </g>
                <g transform={`translate(0 ${bobR}) rotate(${10 * r.clR} ${pr.x} ${pr.y})`}>
                  <Person x={pr.x} y={pr.y} phase={pr.phase} scale={0.9} color={C.kin} arm={mix(-20, -34, r.clR) * Math.sin(pr.phase)} />
                </g>
                {/* napas terengah & panas tubuh pelari */}
                {[0, 1, 2, 3].map((k) => {
                  const ph = (t * 0.9 + k / 4) % 1;
                  return <circle key={k} cx={hx + 22 + ph * 40} cy={hy + 6 - ph * 30} r={4 + ph * 9} fill={C.ink} opacity={0.22 * cyc(ph) * r.exR} />;
                })}
                {[0, 1, 2].map((k) => {
                  const ph = (t * 1.4 + k / 3) % 1;
                  const sd = k % 2 ? 1 : -1;
                  return <path key={k} d={`M${hx + sd * (14 + ph * 34)},${hy - 12 + ph * ph * 60 - ph * 20} q4,7 0,11 q-4,-4 0,-11 Z`} fill={C.cyan} opacity={0.8 * cyc(ph) * r.exR} />;
                })}
                <HeatShimmer x1={hx - 40} x2={hx + 40} y={hy - 14} t={t} amount={0.7 * r.exR} />
              </g>
            );
          })}
          <Label x={XW + 200} y={FLOOR + 40} size={28} color={C.ink} weight={600}>
            berjalan santai
          </Label>
          <Label x={XR + 200} y={FLOOR + 40} size={28} color={C.kin} weight={600}>
            berlari
          </Label>
          {/* stopwatch */}
          {[
            {x: XW + 40, T: TW, key: 'W' as const, p: 200},
            {x: XR + 40, T: TR, key: 'R' as const, p: 600},
          ].map((w, i) => {
            const v = mixRun((r) => (w.key === 'W' ? r.sW : r.sR)) * w.T;
            const done = mixRun((r) => (w.key === 'W' ? r.doneW : r.doneR));
            const ang = (v / 10) * 2 * Math.PI;
            return (
              <g key={i} opacity={ramp(t, t0 - 0.6, t0)}>
                <Glow x={w.x} y={290} r={80} color="gold" opacity={0.6 * done} />
                <circle cx={w.x} cy={290} r={44} fill="rgba(10,16,36,0.9)" stroke={interpolateColors(done, [0, 1], [C.muted, C.gold])} strokeWidth={4} />
                {Array.from({length: 12}, (_, k) => {
                  const a = (k / 12) * 2 * Math.PI;
                  return <line key={k} x1={w.x + 36 * Math.sin(a)} y1={290 - 36 * Math.cos(a)} x2={w.x + (k % 3 ? 32 : 28) * Math.sin(a)} y2={290 - (k % 3 ? 32 : 28) * Math.cos(a)} stroke={C.muted} strokeWidth={2} />;
                })}
                <circle cx={w.x} cy={290} r={40} fill="none" stroke={C.gold} strokeOpacity={0.55} strokeWidth={4} pathLength={100} strokeDasharray={`${Math.min(100, (v / 10) * 100)} 100`} transform={`rotate(-90 ${w.x} 290)`} />
                <line x1={w.x} y1={290} x2={w.x + 32 * Math.sin(ang)} y2={290 - 32 * Math.cos(ang)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
                <circle cx={w.x} cy={290} r={4} fill={C.gold} />
                <rect x={w.x - 8} y={236} width={16} height={10} rx={3} fill={C.muted} />
                <rect x={w.x + 30} y={248} width={10} height={8} rx={2} fill={C.muted} transform={`rotate(40 ${w.x + 35} 252)`} />
                {runs.map((r, j) => (
                  <Ripple key={j} x={w.x} y={290} p={ramp(t, r.st + w.T, r.st + w.T + 1.2, lin)} r={90} color="gold" rings={2} />
                ))}
                <Label x={w.x + 64} y={290} size={34} font="mono" anchor="start" color={interpolateColors(done, [0, 1], [C.ink, C.gold])} weight={600}>
                  {`Δt = ${fmt(v, 1)} s`}
                </Label>
                <Label x={w.x + 64} y={338} size={26} font="mono" anchor="start" color={C.work} weight={600} opacity={pTag}>
                  {`P = ${w.p} W`}
                </Label>
              </g>
            );
          })}
          <g opacity={ugTag}>
            <Label x={XW + 200} y={420} size={26} color={C.pot} weight={600}>
              W = mgh = 1800 J
            </Label>
            <Label x={XR + 200} y={420} size={26} color={C.pot} weight={600}>
              W = mgh = 1800 J
            </Label>
          </g>
          <Label x={1600} y={250} size={24} color={C.muted} opacity={ugTag * 0.9}>
            contoh: m = 60 kg, h = 3 m
          </Label>
          {/* pengukur laju energi (sebelum kartu rumus muncul) */}
          <g opacity={gauges}>
            <Label x={1630} y={330} size={22} color={C.muted} weight={600} spacing={2}>
              LAJU ENERGI (J/s)
            </Label>
            <Gauge x={1630} y={480} val={valW} color={C.ink} label="berjalan" t={t} />
            <Gauge x={1630} y={700} val={valR} color={C.kin} label="berlari" t={t} />
          </g>
          <Motes x={960} y={560} rx={820} ry={300} n={26} color="pot" opacity={0.35} seed={4} />
        </g>

        {/* ===== bagian B ===== */}
        <g opacity={phaseB}>
          <Ground x1={160} x2={780} y={830} />
          {/* kabel listrik dari stopkontak ke motor */}
          <path d="M330,250 L250,250 L250,760 L236,760" fill="none" stroke={C.faint} strokeWidth={6} strokeLinejoin="round" />
          <rect x={206} y={740} width={34} height={44} rx={6} fill="#16224a" stroke={C.work} strokeWidth={2} />
          <circle cx={223} cy={756} r={3} fill={C.work} />
          <circle cx={223} cy={769} r={3} fill={C.work} />
          <Stream pts={[[230, 760], [250, 760], [250, 250], [330, 250]]} color="work" n={14} speed={0.55} r={4.5} jitter={1} opacity={powered} seed={2} />
          {/* tiang & balok atas */}
          <rect x={170} y={190} width={20} height={640} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <rect x={170} y={176} width={480} height={22} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          {Array.from({length: 6}, (_, i) => (
            <line key={i} x1={190} y1={260 + i * 100} x2={170} y2={310 + i * 100} stroke={C.faint} strokeWidth={2} />
          ))}
          {/* motor: rumah bersirip, jendela kumparan menyala, rotor berputar */}
          <Glow x={395} y={241} r={140} color="heat" opacity={heatGlow * (0.8 + 0.2 * Math.sin(t * 3))} />
          <rect x={330} y={206} width={130} height={70} rx={10} fill="url(#pow-motor)" stroke={C.work} strokeWidth={3} />
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={342 + i * 9} y1={212} x2={342 + i * 9} y2={270} stroke={C.ink} strokeOpacity={0.12} strokeWidth={3} />
          ))}
          <rect x={348} y={222} width={56} height={38} rx={5} fill="#0a0f22" stroke={C.muted} strokeWidth={1.5} />
          {[0, 1, 2, 3].map((k) => (
            <path key={k} d={`M${352 + k * 13},226 q6,15 0,30`} fill="none" stroke={interpolateColors(heatGlow, [0, 1], ['#b07a3a', C.heat])} strokeWidth={4} opacity={0.5 + 0.5 * heatGlow} />
          ))}
          <g transform={`translate(432 241) rotate(${drumRot * 2.6 + t * 40 * powered})`}>
            <circle r={18} fill="#0e1530" stroke={C.work} strokeWidth={2} />
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-15 * Math.cos((a * Math.PI) / 180)} y1={-15 * Math.sin((a * Math.PI) / 180)} x2={15 * Math.cos((a * Math.PI) / 180)} y2={15 * Math.sin((a * Math.PI) / 180)} stroke={C.work} strokeOpacity={0.8} strokeWidth={2.5} />
            ))}
          </g>
          <Label x={395} y={194} size={18} color={C.work} weight={600} spacing={2}>
            MOTOR
          </Label>
          <HeatShimmer x1={340} x2={450} y={206} t={t} amount={heatGlow} />
          <line x1={460} y1={241} x2={520} y2={241} stroke={C.muted} strokeWidth={6} />
          <g transform={`translate(550 241) rotate(${drumRot})`}>
            <circle r={32} fill="#0e1530" stroke={C.ink} strokeWidth={3} />
            <circle r={24} fill="none" stroke={C.muted} strokeOpacity={0.5} strokeWidth={6} strokeDasharray="4 5" />
            <line x1={-26} y1={0} x2={26} y2={0} stroke={C.muted} strokeWidth={3} />
            <line x1={0} y1={-26} x2={0} y2={26} stroke={C.muted} strokeWidth={3} />
            <circle r={6} fill={C.ink} />
          </g>
          <line x1={582} y1={241} x2={582} y2={crateY - 104} stroke={C.ink} strokeWidth={3} />
          {/* energi berguna turun lewat tali ke beban */}
          <Stream pts={[[582, 262], [582, crateY - 128]]} color="pot" n={7} speed={0.9} r={4.5} jitter={1} opacity={lifting} seed={5} />
          {/* bayangan beban di lantai mengecil saat naik */}
          <ellipse cx={582} cy={832} rx={70 - 30 * lift} ry={8 - 3 * lift} fill="#000" opacity={0.45 - 0.25 * lift} />
          <g transform={`rotate(${1.4 * Math.sin(t * 2.2) * lifting} 582 ${crateY - 128})`}>
            <path d={`M${582 - 28},${crateY - 100} L582,${crateY - 128} L${582 + 28},${crateY - 100}`} fill="none" stroke={C.ink} strokeWidth={3} />
            <Glow x={582} y={crateY - 50} r={110} color="pot" opacity={0.25 + 0.5 * lift} />
            <Crate x={582} y={crateY} w={130} h={100} label="200 kg" color={C.pot} />
          </g>
          {/* tinggi 12 m: penggaris + isi Ug yang naik bersama beban */}
          <g opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.4)}>
            <line x1={720} y1={830} x2={720} y2={450} stroke={C.pot} strokeWidth={3} strokeDasharray="8 8" />
            <line x1={720} y1={830} x2={720} y2={crateY} stroke={C.pot} strokeOpacity={0.35} strokeWidth={12} strokeLinecap="round" />
            {Array.from({length: 13}, (_, i) => (
              <line key={i} x1={720 - (i % 6 === 0 ? 14 : 8)} y1={830 - (i * 380) / 12} x2={720} y2={830 - (i * 380) / 12} stroke={C.pot} strokeWidth={2} />
            ))}
            <line x1={705} y1={450} x2={735} y2={450} stroke={C.pot} strokeWidth={3} />
            <line x1={705} y1={830} x2={735} y2={830} stroke={C.pot} strokeWidth={3} />
            <Label x={745} y={640} size={30} color={C.pot} anchor="start" weight={600}>
              12 m
            </Label>
          </g>
          {/* jam simulasi */}
          <g opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.4)}>
            <circle cx={232} cy={870} r={16} fill="none" stroke={C.muted} strokeWidth={3} />
            <line x1={232} y1={870} x2={232 + 11 * Math.sin((simT / 15) * 2 * Math.PI)} y2={870 - 11 * Math.cos((simT / 15) * 2 * Math.PI)} stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
            <Label x={260} y={870} size={28} font="mono" anchor="start" color={interpolateColors(lift, [0.95, 1], [C.ink, C.gold])} weight={600}>
              {`t = ${fmt(simT, 1)} s`}
            </Label>
          </g>
          {/* pembacaan langsung saat beban naik */}
          <g opacity={readout}>
            <rect x={1010} y={520} width={640} height={200} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.line} strokeWidth={2} />
            <Label x={1050} y={575} size={30} font="mono" anchor="start" color={C.muted}>
              {`h  = ${fmt(12 * lift, 1)} m`}
            </Label>
            <Label x={1050} y={650} size={44} font="mono" anchor="start" color={C.pot} weight={600}>
              U<tspan baselineShift="sub" fontSize="0.6em">g</tspan>
              {` = ${fmt(24000 * lift)} J`}
            </Label>
            <rect x={1050} y={690} width={560} height={8} rx={4} fill={C.pot} opacity={0.15} />
            <rect x={1050} y={690} width={560 * lift} height={8} rx={4} fill={C.pot} />
            <Twinkles x={1330} y={650} rx={280} ry={60} n={5} opacity={ramp(t, cue(5) + 7.0, cue(5) + 7.6) * readout} seed={2} />
          </g>

          {/* aliran energi (Sankey) dengan butir yang mengalir */}
          <g opacity={sankDim}>
            <g clipPath="url(#pow-clip-in)">
              <path d={band(sx0, sy, sx1, sy, wIn)} fill={C.work} opacity={0.85} />
              <path d={`M${sx0},${sy - wIn / 2 + 6} L${sx1},${sy - wIn / 2 + 6}`} stroke="#fff" strokeOpacity={0.25} strokeWidth={3} />
            </g>
            <Stream pts={[[sx0, sy], [sx1, sy]]} color="white" n={8} speed={0.5} r={5} jitter={14} opacity={sankIn * 0.8} seed={1} />
            <Label x={sx0} y={sy - wIn / 2 - 30} size={28} anchor="start" color={C.work} weight={600} opacity={sankIn}>
              daya masuk 2000 W
            </Label>
            <g clipPath="url(#pow-clip-out)">
              <path d={band(sx1, yUse1, 1740, yUse1 - 20, wUse)} fill={C.pot} opacity={0.9} />
              <path d={band(sx1, yHeat1, 1560, 790, wHeat)} fill={C.heat} opacity={0.9} />
            </g>
            <Stream pts={bandMid(sx1, yUse1, 1740, yUse1 - 20)} color="white" n={10} speed={0.28} r={5} jitter={10} opacity={sankSplit * 0.8} seed={2} />
            <Stream pts={bandMid(sx1, yHeat1, 1560, 790)} color="force" n={3} speed={0.37} r={4} jitter={2} opacity={sankSplit * 0.9} seed={3} />
            <g opacity={sankSplit}>
              <Label x={1740} y={sy - wIn / 2 - 36} size={26} anchor="end" color={C.pot} weight={600}>
                berguna 1600 W → U<tspan baselineShift="sub" fontSize="0.65em">g</tspan> beban
              </Label>
              <Label x={1580} y={790} size={28} anchor="start" color={C.heat} weight={600}>
                400 W
              </Label>
              <Label x={1580} y={830} size={24} anchor="start" color={C.heat}>
                panas
              </Label>
              <HeatShimmer x1={1500} x2={1570} y={772} t={t} amount={0.9} />
              <Glow x={1560} y={790} r={60} color="heat" opacity={0.6} />
            </g>
          </g>

          {/* kWh meter: kilowatt jam = energi yang terkumpul */}
          <g opacity={meterIn}>
            <rect x={1090} y={500} width={460} height={300} rx={22} fill="rgba(14,22,48,0.95)" stroke={C.gold} strokeOpacity={0.7} strokeWidth={3} />
            <rect x={1108} y={518} width={424} height={264} rx={14} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
            <Label x={1320} y={548} size={22} color={C.gold} weight={600} spacing={3}>
              METER LISTRIK
            </Label>
            {[3, 2, 1, 0].map((k, i) => (
              <Digit key={k} x={1236 + i * 48 + (k === 0 ? 14 : 0)} y={612} pos={dpos(k)} id={`pow-dg${k}`} color={k === 0 ? C.gold : C.ink} />
            ))}
            <Label x={1366} y={630} size={30} font="mono" color={C.ink} weight={600}>
              ,
            </Label>
            <Label x={1460} y={612} size={26} font="mono" anchor="start" color={C.gold} weight={600}>
              kWh
            </Label>
            {/* piringan berputar (tampak tepi) */}
            <ellipse cx={1320} cy={712} rx={120} ry={16} fill="#0a0f22" stroke={C.muted} strokeWidth={2} />
            {[0, 1].map((k) => {
              const ph = t * 2.4 + k * Math.PI;
              return <rect key={k} x={1320 + 112 * Math.sin(ph) - 6} y={702} width={12} height={20} rx={3} fill={C.heat} opacity={Math.max(0, Math.cos(ph)) * 0.9} />;
            })}
            <Glow x={1320} y={712} r={90} color="gold" opacity={0.35} />
            <Label x={1320} y={762} size={20} color={C.muted}>
              terus bertambah selama daya mengalir
            </Label>
          </g>
          <Motes x={600} y={500} rx={360} ry={300} n={18} color="work" opacity={0.3 * powered} seed={7} />
        </g>
      </Stage>

      {/* ===== kartu rumus ===== */}
      <Formula x={1630} y={430} p={fP} accent={C.work} caption="watt = joule per detik">
        <V>P</V> = <Frac n={<V>W</V>} d={<>Δ<V>t</V></>} />
      </Formula>
      <Formula x={1630} y={680} p={fFv} accent={C.force} caption="gaya searah gerak">
        <V>P</V> = <V color={C.force}>F</V> <V>v</V>
      </Formula>

      <Formula x={1330} y={290} p={calc} accent={C.work} size={52}>
        <V>P</V> = <Frac n={<V>mgh</V>} d={<>Δ<V>t</V></>} /> = <Frac n="24 000 J" d="15 s" /> = <Tint c={C.work}>1600 W</Tint>
      </Formula>
      <Formula x={1330} y={290} p={eta} accent={C.heat} size={56} caption="sisanya menjadi panas di kumparan & bantalan">
        <V>η</V> = <Frac n={<>E<Sub>berguna</Sub></>} d={<>E<Sub>masuk</Sub></>} /> = <Frac n="1600" d="2000" /> = 0,80
      </Formula>
      <Formula x={1330} y={290} p={kwh} accent={C.gold} size={56} caption="kilowatt jam adalah satuan ENERGI, bukan daya">
        1 kWh = 1000 W × 3600 s = 3,6 × 10<Sup>6</Sup> J
      </Formula>
    </AbsoluteFill>
  );
};
