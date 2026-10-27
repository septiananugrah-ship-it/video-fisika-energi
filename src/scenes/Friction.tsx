import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, rand, ramp, win} from '../anim';
import {Crate, EnergyBars, ELabel, Ground, HeatShimmer, fmt} from '../components/physics';
import {Arrow, DrawPath, Formula, Frac, Glow, Label, Motes, Note, Part, Ripple, Stage, Stream, Sub, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Contoh 8 modul: balok 2 kg dilepas dari diam di bidang miring 30°, meluncur 5 m, μk = 0,2, g = 10.
// N = mg cos30° = 17,32 N, f = 3,464 N, a = g(sin30° − μ cos30°) = 3,268 m/s².
// Neraca: Ug = 50 − 10 s, E_th = 3,464 s, K = 6,536 s (s dalam m) → di bawah: 32,68 J + 17,32 J.
const PXM = 130;
const ANG = Math.PI / 6;
const A = {x: 230, y: 280};
const LEN = 6; // m lintasan yang digambar
const S0 = 0.6; // posisi awal balok di lintasan (m)
const B = {x: A.x + LEN * PXM * Math.cos(ANG), y: A.y + LEN * PXM * Math.sin(ANG)};
const ACC = 10 * (0.5 - 0.2 * Math.cos(ANG));
const VMAX = Math.sqrt(2 * ACC * 5);
const onSlope = (s: number) => ({x: A.x + s * PXM * Math.cos(ANG), y: A.y + s * PXM * Math.sin(ANG)});
const DEP = {x: 30, y: -22}; // kedalaman semu permukaan miring

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Suku rumus yang menyala saat diucapkan (latar pil, tanpa mengubah tata letak). */
const Hl: React.FC<{p: number; c: string; children: React.ReactNode}> = ({p, c, children}) => (
  <span style={{borderRadius: 12, padding: '0 8px', margin: '0 -8px', background: hexA(c, 0.26 * p), boxShadow: `0 0 ${26 * p}px ${hexA(c, 0.45 * p)}`}}>{children}</span>
);

/** Telapak tangan tampak samping (jari ke atas). side = −1 kiri, +1 kanan; x0 = garis kontak. */
const Palm: React.FC<{x0: number; side: 1 | -1; dy: number; warm: number}> = ({x0, side, dy, warm}) => {
  const fill = interpolateColors(warm, [0, 1], ['#1b2650', '#3a2142']);
  const s = side;
  const xo = x0 + s * 170; // sisi luar
  const d = `M${x0 + s * 6},${300 + dy} Q${x0 + s * 6},${232 + dy} ${x0 + s * 60},${226 + dy} Q${xo - s * 6},${226 + dy} ${xo - s * 10},${300 + dy} L${xo},${470 + dy} Q${xo + s * 26},${500 + dy} ${xo + s * 4},${540 + dy} L${xo - s * 14},${640 + dy} L${x0 + s * 22},${640 + dy} Q${x0 + s * 6},${600 + dy} ${x0 + s * 6},${540 + dy} Z`;
  return (
    <g>
      <path d={d} fill={fill} stroke={C.muted} strokeWidth={4} strokeLinejoin="round" />
      {/* lipatan jari */}
      {[0, 1, 2].map((k) => (
        <path key={k} d={`M${x0 + s * (40 + k * 38)},${238 + dy + k * 2} q${s * 4},40 0,${80 - k * 6}`} fill="none" stroke={C.muted} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
      ))}
      {/* sorotan tepi */}
      <path d={`M${x0 + s * 24},${320 + dy} L${x0 + s * 24},${560 + dy}`} stroke="#fff" strokeOpacity={0.1} strokeWidth={8} strokeLinecap="round" />
      {/* lengan baju */}
      <rect x={Math.min(x0 + s * 18, xo - s * 14) - (s > 0 ? 0 : 0)} y={640 + dy} width={Math.abs(xo - s * 14 - (x0 + s * 18))} height={60} rx={10} fill="#22305a" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={3} />
    </g>
  );
};

const Atoms: React.FC<{cx: number; cy: number; r: number; t: number; amp: number}> = ({cx, cy, r, t, amp}) => {
  const col = interpolateColors(Math.min(1, amp * 1.2), [0, 1], ['#5a6aa0', C.heat]);
  return (
    <g>
      <defs>
        <clipPath id="fric-atom-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="fric-lens" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1a2550" />
          <stop offset="100%" stopColor="#090f24" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 26} fill="url(#soft-heat)" opacity={0.25 + 0.6 * amp} />
      <circle cx={cx} cy={cy} r={r} fill="url(#fric-lens)" stroke={C.heat} strokeOpacity={0.4 + 0.5 * amp} strokeWidth={4} />
      <g clipPath="url(#fric-atom-clip)">
        {Array.from({length: 49}, (_, i) => {
          const gx = (i % 7) - 3;
          const gy = Math.floor(i / 7) - 3;
          const a = 3 + amp * 15;
          const dx = a * Math.sin(t * (6 + rand(i) * 6 + amp * 4) + rand(i * 3) * 6);
          const dy = a * Math.sin(t * (5 + rand(i * 7) * 7 + amp * 4) + rand(i * 5) * 6);
          const x = cx + gx * 58 + dx;
          const y = cy + gy * 58 + dy;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={17} fill={col} opacity={0.4 + 0.5 * Math.min(1, amp + 0.2)} />
              <circle cx={x - 5} cy={y - 6} r={5} fill="#fff" opacity={0.25} />
            </g>
          );
        })}
      </g>
      <path d={`M${cx - r * 0.75},${cy - r * 0.45} A${r * 0.9},${r * 0.9} 0 0 1 ${cx - r * 0.2},${cy - r * 0.85}`} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={6} strokeLinecap="round" />
    </g>
  );
};

export const Friction: React.FC = () => {
  const {t, cue, cueEnd, word, wordOf, dur} = useScene();
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);
  const ph0 = 1 - ramp(t, cue(1) - 0.3, cue(1) + 0.3, EASE_IN_OUT);
  const phA = win(t, cue(1) - 0.1, cue(3) - 0.2, 0.6, 0.5);
  const phB = win(t, cue(3) + 0.1, cue(5) - 0.2, 0.6, 0.5);
  const phC = ramp(t, cue(5) + 0.1, cue(5) + 0.8);

  // ---------- baris 0: balok melambat lalu berhenti di lantai kasar ----------
  const p0 = ramp(t, cue(0) + 0.4, cue(0) + 3.4, (x) => x);
  const s0 = 1 - (1 - p0) * (1 - p0); // perlambatan tetap: s ∝ 1 − (1 − τ)²
  const K0 = 100 * (1 - p0) * (1 - p0);
  const v0 = 1 - p0; // kelajuan relatif
  const bx0 = mix(260, 860, s0);
  const qMark = ramp(t, cue(0) + 3.0, cue(0) + 3.8);

  // ---------- baris 1–2: tangan digosok, atom bergetar ----------
  const rub = ramp(t, cue(1) + 0.3, cue(1) + 1.0);
  const warm = ramp(t, cue(1) + 0.5, cue(2) + 2.5, (x) => x);
  const handY = 28 * Math.sin(t * 9) * rub;
  const zoomIn = ramp(t, cue(2) + 0.2, cue(2) + 1.0);
  const atomAmp = ramp(t, cue(2) + 1.0, cue(2) + 4.0, (x) => x);
  const CX = 595; // garis kontak telapak

  // ---------- baris 3–4: neraca ----------
  const wIn = ramp(t, wordOf(3, 'usaha') - 0.2, wordOf(3, 'usaha') + 0.5);
  const tw = wordOf(3, 'usaha');
  const tilt = (t > tw ? 6 * Math.exp(-(t - tw) * 1.1) * Math.sin((t - tw) * 4.2) : 0) + 0.8 * Math.sin(t * 0.9);
  const hlAt = (k: number) => win(t, word(4, k) - 0.15, word(4, k) + 0.9, 0.25, 0.6);
  const hK1 = hlAt(0);
  const hU1 = hlAt(3);
  const hW = Math.max(hlAt(6), win(t, tw - 0.1, tw + 1.2, 0.3, 0.6));
  const hK2 = hlAt(10);
  const hU2 = hlAt(13);
  const scaleIn = ramp(t, cue(3) + 0.3, cue(3) + 1.3);

  // ---------- baris 5–10: bidang miring ----------
  const slideA = cue(8) + 0.3;
  const slideB = cueEnd(8) - 0.1;
  const sAt = (tt: number) => {
    const sp = ramp(tt, slideA, slideB, (x) => x);
    const tau = Math.sqrt(10 / ACC) * sp;
    return 0.5 * ACC * tau * tau;
  };
  const slideP = ramp(t, slideA, slideB, (x) => x);
  const tau = Math.sqrt(10 / ACC) * slideP;
  const s = 0.5 * ACC * tau * tau; // m
  const v = ACC * tau;
  const Ug = 50 - 10 * s;
  const Th = 2 * 10 * Math.cos(ANG) * 0.2 * s;
  const Kc = Math.max(0, 50 - Ug - Th);
  const blk = onSlope(S0 + s);
  const moving = Math.min(v / VMAX, 1 - ramp(t, slideB - 0.05, slideB + 0.5));
  const forces = win(t, cue(7) + 0.2, cue(8) + 0.4, 0.6, 0.5);
  const n6 = win(t, cue(6) + 0.3, cue(7), 0.6, 0.5);
  const n7 = win(t, cue(7) + 0.3, cue(8) + 0.2, 0.6, 0.5);
  const n8 = win(t, cueEnd(8) - 0.4, cue(10), 0.6, 0.5);
  const f9 = ramp(t, cue(9) + 0.3, cue(9) + 1.1);
  const n10 = ramp(t, cue(10) + 0.3, cue(10) + 1.0);
  const hDim = ramp(t, cue(6), cue(6) + 0.6);
  const sDim = ramp(t, cue(5) + 1.0, cue(5) + 2.6, EASE_IN_OUT);
  const bottom = onSlope(S0 + 5);
  const top = onSlope(S0);
  const ux = Math.cos(ANG);
  const uy = Math.sin(ANG);
  const camZ = ramp(t, cue(7) - 0.3, cue(7) + 1.8, EASE_IN_OUT) * (1 - ramp(t, cue(8) - 0.2, cue(8) + 1.0, EASE_IN_OUT));
  const zS = 1 + 0.08 * camZ;
  const arrive = ramp(t, slideB, slideB + 1.3, (x) => x);
  const barsIn = phC * ramp(t, cue(6) + 0.2, cue(6) + 0.9);
  const ugGlow = (1 - slideP) * ramp(t, cue(6), cue(6) + 1);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        <defs>
          <linearGradient id="fric-side" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a2b5c" />
            <stop offset="100%" stopColor="#0d1638" />
          </linearGradient>
          <linearGradient id="fric-top" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2c3f7a" />
            <stop offset="100%" stopColor="#22336a" />
          </linearGradient>
        </defs>

        {/* ---------- baris 0 ---------- */}
        <g opacity={ph0}>
          <Ground x1={160} x2={1040} y={600} rough heat={0.8 * s0} />
          <rect x={260} y={597} width={Math.max(0, bx0 - 260)} height={6} rx={3} fill={C.heat} opacity={0.35 * s0 * (0.8 + 0.2 * Math.sin(t * 3))} />
          <HeatShimmer x1={260} x2={bx0} y={600} t={t} amount={s0} />
          <ellipse cx={bx0} cy={604} rx={86} ry={9} fill="#000" opacity={0.4} />
          {/* percikan panas di bidang kontak */}
          {Array.from({length: 8}, (_, k) => {
            const ph = (t * 1.8 + k / 8) % 1;
            return <circle key={k} cx={bx0 - 70 - ph * 90 - rand(k) * 20} cy={598 - ph * (30 + rand(k + 3) * 30) + ph * ph * 40} r={2.6} fill={C.heat} opacity={cyc(ph) * v0 * 1.4} />;
          })}
          {[0, 1, 2].map((k) => (
            <line key={k} x1={bx0 - 86 - k * 10} y1={520 + k * 26} x2={bx0 - 86 - k * 10 - 90 * v0} y2={520 + k * 26} stroke={C.ink} strokeOpacity={0.5 * v0} strokeWidth={3} strokeLinecap="round" />
          ))}
          <Crate x={bx0} y={600} w={140} h={100} color={C.kin} />
          <Arrow x1={bx0} y1={470} x2={bx0 + 180 * (1 - p0)} y2={470} color="kin" width={6} opacity={Math.min(1, (1 - p0) * 4)} />
          <EnergyBars
            x={1260}
            y={680}
            height={260}
            barW={80}
            gap={34}
            max={100}
            showValues={false}
            unit=""
            total={false}
            title="ENERGI MEKANIK"
            opacity={ramp(t, cue(0) + 0.3, cue(0) + 1.0)}
            bars={[{key: 'K', label: ELabel.K, value: K0, color: 'kin'}]}
          />
          {/* energi "menguap" dari batang menuju tanda tanya */}
          <Stream pts={[[1300, 680 - K0 * 2.6 - 10], [1400, 380], [1500, 470]]} color="kin" n={8} speed={0.7} opacity={Math.min(1, v0 * 3) * ramp(t, cue(0) + 0.5, cue(0) + 1)} seed={4} />
          <g transform={`translate(1500 480) scale(${0.85 + 0.15 * qMark + 0.04 * Math.sin(t * 2.4)}) translate(-1500 -480)`}>
            <Glow x={1500} y={480} r={130} color="gold" opacity={0.6 * qMark} />
            <Label x={1500} y={480} size={120} color={C.gold} weight={700} opacity={qMark}>
              ?
            </Label>
          </g>
          <Motes x={1500} y={480} rx={140} ry={110} n={12} color="gold" opacity={0.5 * qMark} seed={6} />
        </g>

        {/* ---------- baris 1–2 ---------- */}
        <g opacity={phA}>
          <Glow x={CX} y={440} r={360} color="heat" opacity={0.25 + 0.75 * warm} />
          <Palm x0={CX - 7} side={-1} dy={-handY} warm={warm} />
          <Palm x0={CX + 7} side={1} dy={handY} warm={warm} />
          <rect x={CX - 7} y={250} width={14} height={380} rx={7} fill={C.heat} opacity={0.3 + 0.7 * warm} />
          <rect x={CX - 18} y={250} width={36} height={380} rx={18} fill={C.heat} opacity={0.15 * warm * (0.7 + 0.3 * Math.sin(t * 9))} />
          {/* percikan hangat dari bidang gosok */}
          {Array.from({length: 10}, (_, k) => {
            const ph = (t * 1.3 + k / 10) % 1;
            const side = k % 2 ? 1 : -1;
            return <circle key={k} cx={CX + side * (8 + ph * (40 + rand(k) * 50))} cy={300 + rand(k + 2) * 300 - ph * 60} r={2.2 + rand(k + 5) * 1.5} fill={C.heat} opacity={cyc(ph) * warm * rub} />;
          })}
          <HeatShimmer x1={470} x2={730} y={220} t={t} amount={warm} />
          <Motes x={CX} y={440} rx={240} ry={230} n={16} color="heat" opacity={0.45 * warm} seed={2} />
          <Label x={CX} y={760} size={30} color={C.heat} weight={600} opacity={warm}>
            terasa hangat
          </Label>
          {/* perbesaran: atom kulit */}
          <g opacity={zoomIn}>
            <circle cx={CX + 4} cy={440} r={34} fill="none" stroke={C.muted} strokeWidth={3} />
            <line x1={CX + 18} y1={409} x2={1300} y2={252} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 8" />
            <line x1={CX + 18} y1={471} x2={1300} y2={688} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 8" />
            <Stream pts={[[CX + 30, 440], [900, 420], [1130, 470]]} color="heat" n={10} speed={0.6} opacity={rub * 0.9} seed={3} />
            <Atoms cx={1340} cy={470} r={220} t={t} amp={atomAmp} />
            <Label x={1340} y={740} size={26} color={C.muted}>
              perbesaran: atom permukaan kulit
            </Label>
            {/* termometer */}
            <g>
              <rect x={1640} y={290} width={30} height={330} rx={15} fill="#0b1229" stroke={C.muted} strokeWidth={3} />
              <circle cx={1655} cy={640} r={30} fill={C.heat} stroke={C.muted} strokeWidth={3} />
              <rect x={1647} y={600 - 280 * (0.18 + 0.72 * atomAmp)} width={16} height={280 * (0.18 + 0.72 * atomAmp) + 20} rx={8} fill={C.heat} />
              {[0, 1, 2, 3, 4].map((k) => (
                <line key={k} x1={1676} y1={330 + k * 60} x2={1690} y2={330 + k * 60} stroke={C.muted} strokeWidth={2} />
              ))}
              <Glow x={1655} y={640} r={70} color="heat" opacity={0.4 + 0.5 * atomAmp} />
            </g>
          </g>
        </g>

        {/* ---------- baris 3–4: timbangan neraca ---------- */}
        <g opacity={phB * scaleIn}>
          {(() => {
            const PV = {x: 960, y: 540};
            const a = (tilt * Math.PI) / 180;
            const ex = 360 * Math.cos(a);
            const ey = 360 * Math.sin(a);
            const lE = {x: PV.x - ex, y: PV.y - ey};
            const rE = {x: PV.x + ex, y: PV.y + ey};
            const pan = (e: {x: number; y: number}) => (
              <g>
                <line x1={e.x} y1={e.y} x2={e.x - 100} y2={e.y + 140} stroke={C.muted} strokeWidth={2} />
                <line x1={e.x} y1={e.y} x2={e.x + 100} y2={e.y + 140} stroke={C.muted} strokeWidth={2} />
                <path d={`M${e.x - 120},${e.y + 140} Q${e.x},${e.y + 190} ${e.x + 120},${e.y + 140} Z`} fill="#16224a" stroke={C.muted} strokeWidth={3} />
              </g>
            );
            const orb = (x: number, y: number, c: 'kin' | 'pot' | 'work', label: React.ReactNode, hl: number, op = 1) => (
              <g opacity={op} key={`${c}${x}`}>
                <Glow x={x} y={y} r={60 + 30 * hl} color={c} opacity={0.6 + 0.4 * hl} still />
                <circle cx={x} cy={y} r={26 * (1 + 0.22 * hl)} fill={C[c]} />
                <circle cx={x - 8} cy={y - 9} r={7} fill="#fff" opacity={0.45} />
                <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={28 * (1 + 0.22 * hl)} fill={C.bg}>
                  {label}
                </text>
                <g opacity={hl}>
                  <Ripple x={x} y={y} p={(t * 0.9 + x * 0.0013) % 1} r={70} color={c} rings={2} width={2} />
                </g>
              </g>
            );
            return (
              <g>
                <path d={`M${PV.x - 70},800 L${PV.x + 70},800 L${PV.x + 30},780 L${PV.x - 30},780 Z`} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
                <rect x={PV.x - 7} y={PV.y} width={14} height={240} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
                <path d={`M${PV.x - 20},${PV.y + 4} L${PV.x},${PV.y - 26} L${PV.x + 20},${PV.y + 4} Z`} fill={C.gold} opacity={0.9} />
                <line x1={lE.x} y1={lE.y} x2={rE.x} y2={rE.y} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
                <line x1={lE.x} y1={lE.y - 3} x2={rE.x} y2={rE.y - 3} stroke="#fff" strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" />
                {pan(lE)}
                {pan(rE)}
                {orb(lE.x - 62, lE.y + 128, 'kin', <>K</>, hK1)}
                {orb(lE.x, lE.y + 128, 'pot', <>U</>, hU1)}
                {orb(lE.x + 62, lE.y + 128, 'work', <>W</>, hW, wIn)}
                {orb(rE.x - 34, rE.y + 128, 'kin', <>K</>, hK2)}
                {orb(rE.x + 34, rE.y + 128, 'pot', <>U</>, hU2)}
                <Label x={lE.x} y={lE.y + 220} size={26} color={C.muted} weight={600} spacing={2}>
                  AWAL
                </Label>
                <Label x={rE.x} y={rE.y + 220} size={26} color={C.muted} weight={600} spacing={2}>
                  AKHIR
                </Label>
                <Stream pts={[[960, 400], [lE.x + 62, lE.y + 70]]} color="work" n={6} speed={0.8} opacity={win(t, tw - 0.1, tw + 1.6, 0.3, 0.6)} seed={9} />
                <Motes x={960} y={560} rx={520} ry={240} n={24} color="work" opacity={0.35} seed={5} />
              </g>
            );
          })()}
        </g>

        {/* ---------- baris 5–10 ---------- */}
        <g opacity={phC}>
          <g transform={`translate(330 330) scale(${zS}) translate(-330 -330)`}>
            <Ground x1={130} x2={990} y={B.y} />
            <ellipse cx={(A.x + B.x) / 2 + 20} cy={B.y + 6} rx={420} ry={12} fill="#000" opacity={0.35} />
            {/* permukaan miring dengan kedalaman */}
            <path d={`M${A.x},${A.y} L${B.x},${B.y} L${B.x + DEP.x},${B.y + DEP.y} L${A.x + DEP.x},${A.y + DEP.y} Z`} fill="url(#fric-top)" stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
            {Array.from({length: 22}, (_, i) => {
              const p = onSlope(0.15 + (i * 5.7) / 22);
              const f = (i * 0.37) % 1;
              return <line key={i} x1={p.x + DEP.x * (0.2 + 0.5 * f)} y1={p.y + DEP.y * (0.2 + 0.5 * f)} x2={p.x + DEP.x * (0.2 + 0.5 * f) + 10} y2={p.y + DEP.y * (0.2 + 0.5 * f) + 5} stroke={C.ink} strokeOpacity={0.22} strokeWidth={2} strokeLinecap="round" />;
            })}
            <path d={`M${A.x},${A.y} L${B.x},${B.y} L${A.x},${B.y} Z`} fill="url(#fric-side)" stroke={C.muted} strokeWidth={3} />
            {/* kilau pelan meluncur di tepi permukaan */}
            {(() => {
              const u = (t * 0.12) % 1;
              const p1 = onSlope(u * 6);
              const p2 = onSlope(Math.min(6, u * 6 + 0.6));
              return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.3 * cyc(u)} />;
            })()}
            {/* jejak panas di permukaan */}
            <line x1={top.x} y1={top.y} x2={blk.x} y2={blk.y} stroke={C.heat} strokeOpacity={0.25} strokeWidth={16} strokeLinecap="round" opacity={Math.min(1, slideP * 20)} />
            <line x1={top.x} y1={top.y} x2={blk.x} y2={blk.y} stroke={C.heat} strokeWidth={6} strokeLinecap="round" opacity={0.75 * Math.min(1, slideP * 20)} />
            <g transform={`translate(${top.x} ${top.y}) rotate(30)`}>
              <HeatShimmer x1={0} x2={s * PXM} y={0} t={t} amount={Math.min(1, slideP * 4) * (1 - ramp(t, cue(10), cue(10) + 2))} />
            </g>
            <path d={`M${B.x - 90},${B.y} A90,90 0 0 1 ${B.x - 90 * Math.cos(ANG)},${B.y - 90 * Math.sin(ANG)}`} fill="none" stroke={C.gold} strokeWidth={3} strokeOpacity={0.75 + 0.25 * Math.sin(t * 2)} />
            <Label x={B.x - 130} y={B.y - 26} size={26} color={C.gold} font="mono">
              30°
            </Label>
            {/* jarak lintasan 5 m sejajar bidang */}
            <g opacity={1 - hDim * 0.4}>
              <DrawPath
                d={`M${top.x + 46 * uy},${top.y - 46 * ux + 92} L${bottom.x + 46 * uy - 40},${bottom.y - 46 * ux + 92 - 23}`}
                p={sDim}
                stroke="muted"
                width={2.5}
              />
            </g>
            {/* tinggi turun 2,5 m */}
            <g opacity={hDim}>
              <Arrow x1={bottom.x + 40} y1={top.y - 10} x2={bottom.x + 40} y2={bottom.y - 10} color="pot" width={4} both />
              <line x1={top.x} y1={top.y - 10} x2={bottom.x + 50} y2={top.y - 10} stroke={C.pot} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 8" />
              <Label x={bottom.x + 24} y={(top.y + bottom.y) / 2} size={28} font="serif" italic color={C.pot} anchor="end">
                h = 2,5 m
              </Label>
            </g>
            <Label x={(top.x + bottom.x) / 2 - 150} y={(top.y + bottom.y) / 2 + 60} size={24} font="mono" color={C.muted} opacity={ramp(t, cue(5) + 1, cue(5) + 1.6)}>
              s = 5 m · μk = 0,2
            </Label>
            {/* balok: energi potensial tersimpan (pendar biru), percikan & garis gerak saat meluncur */}
            <Glow x={blk.x} y={blk.y - 30} r={110} color="pot" opacity={0.7 * ugGlow} />
            <Motes x={blk.x} y={blk.y - 40} rx={110} ry={80} n={12} color="pot" opacity={0.5 * ugGlow} seed={8} />
            <Glow x={blk.x} y={blk.y - 20} r={100} color="kin" opacity={0.8 * moving} />
            {Array.from({length: 9}, (_, k) => {
              const sk = sAt(t - k * 0.05);
              const p = onSlope(S0 + sk);
              const back = -(28 + k * 3);
              return (
                <circle
                  key={k}
                  cx={p.x + back * ux - k * 4 * uy + 6 * Math.sin(t * 13 + k * 2.1)}
                  cy={p.y + back * uy - k * 6 * ux - k * k * 0.8}
                  r={3.2 - k * 0.25}
                  fill={k < 3 ? C.gold : C.heat}
                  opacity={moving * (1 - k / 10)}
                />
              );
            })}
            {[0, 1, 2].map((k) => (
              <line
                key={k}
                x1={blk.x - 58 * ux + (24 + k * 18) * uy}
                y1={blk.y - 58 * uy - (24 + k * 18) * ux}
                x2={blk.x - (58 + 90 * moving) * ux + (24 + k * 18) * uy}
                y2={blk.y - (58 + 90 * moving) * uy - (24 + k * 18) * ux}
                stroke={C.ink}
                strokeOpacity={0.5 * moving}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
            <Crate x={blk.x} y={blk.y} w={92} h={70} label="2 kg" color={C.kin} rot={30} />
            <Ripple x={bottom.x} y={bottom.y - 30} p={arrive} r={130} color="kin" />
            {/* gaya pada balok */}
            <g opacity={forces}>
              <Arrow x1={blk.x + 18} y1={blk.y - 30} x2={blk.x + 18} y2={blk.y - 30 + 130} color="force" width={5} />
              <Label x={blk.x + 44} y={blk.y + 92} size={26} color={C.force} anchor="start" font="serif" italic>
                mg
              </Label>
              <Arrow x1={blk.x + 18 * uy} y1={blk.y - 18 * ux} x2={blk.x + 18 * uy + 110 * uy} y2={blk.y - 18 * ux - 110 * ux} color="cyan" width={5} />
              <Label x={blk.x + 140 * uy + 20} y={blk.y - 140 * ux} size={26} color={C.cyan} anchor="start" font="serif" italic>
                N
              </Label>
              <Arrow x1={blk.x - 50 * ux} y1={blk.y - 50 * uy - 6} x2={blk.x - 115 * ux} y2={blk.y - 115 * uy - 6} color="heat" width={5} />
              <Label x={blk.x - 112 * ux} y={blk.y - 112 * uy - 40} size={26} color={C.heat} font="serif" italic>
                f
              </Label>
            </g>
            <g opacity={ramp(t, cue(8) + 0.4, cue(8) + 0.9)}>
              <Label x={560} y={250} size={30} font="mono" color={C.kin} weight={600}>
                {`v = ${fmt(v, 1)} m/s`}
              </Label>
            </g>
          </g>
        </g>
        <EnergyBars
          x={1080}
          y={650}
          height={260}
          barW={70}
          gap={30}
          max={50}
          title="NERACA ENERGI (J)"
          unit=""
          opacity={barsIn}
          bars={[
            {key: 'K', label: ELabel.K, value: Kc, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ug, color: 'pot'},
            {key: 'Th', label: ELabel.Th, value: Th, color: 'heat'},
          ]}
        />
        <g opacity={barsIn}>
          {/* Ug mengalir menjadi K (jingga) dan E_th (merah) selama balok meluncur */}
          <Stream pts={[[1203, 738], [1165, 778], [1127, 738]]} color="kin" n={6} speed={1.0} r={4.5} jitter={2} opacity={moving * 1.3} seed={1} />
          <Stream pts={[[1227, 738], [1265, 778], [1303, 738]]} color="heat" n={5} speed={1.0} r={4.5} jitter={2} opacity={moving * 1.3} seed={2} />
          <Glow x={1215} y={650 - Ug * 5.2} r={60} color="pot" opacity={0.5 * ugGlow} />
          <Ripple x={1427} y={650 - 260} p={ramp(t, cue(10) + 0.3, cue(10) + 1.6, (x) => x)} r={110} color="gold" />
          <Twinkles x={1280} y={192} rx={230} ry={30} n={6} opacity={phC * n10} seed={3} />
          <Twinkles x={1110} y={650 - Kc * 5.2 - 30} rx={50} ry={30} n={3} opacity={f9} seed={5} />
        </g>
      </Stage>

      {/* master equation */}
      <Formula x={960} y={330} p={phB} accent={C.work} size={66} caption={<Part p={ramp(t, cue(4) + 0.3, cue(4) + 1.0)}>neraca energi paling serbaguna</Part>}>
        <Hl p={hK1} c={C.kin}>
          <V color="kin">K</V>
          <Sub>i</Sub>
        </Hl>{' '}
        +{' '}
        <Hl p={hU1} c={C.pot}>
          <V color="pot">U</V>
          <Sub>i</Sub>
        </Hl>
        <Part p={wIn} color="work">
          {' '}+{' '}
          <Hl p={hW} c={C.work}>
            <V>W</V>
            <Sub>lain</Sub>
          </Hl>
        </Part>{' '}
        ={' '}
        <Hl p={hK2} c={C.kin}>
          <V color="kin">K</V>
          <Sub>f</Sub>
        </Hl>{' '}
        +{' '}
        <Hl p={hU2} c={C.pot}>
          <V color="pot">U</V>
          <Sub>f</Sub>
        </Hl>
      </Formula>
      <Note x={960} y={846} p={phB * ramp(t, wordOf(3, 'gesekan') - 0.2, wordOf(3, 'gesekan') + 0.6)} color={C.work} size={28}>
        <Tint c="work">W</Tint>
        <sub>lain</sub>: gesekan (negatif), tarikan mesin atau dorongan (positif)
      </Note>

      <Note x={540} y={800} p={phC * n6} color={C.pot} size={32}>
        <Tint c="pot">U</Tint>
        <sub>g</sub> = <V>m g h</V> = 2 · 10 · 2,5 = <Tint c="pot">50 J</Tint>
      </Note>
      <Note x={540} y={800} p={phC * n7} color={C.heat} size={30}>
        <V>N</V> = <V>mg</V> cos 30° ≈ 17,3 N · <Tint c="heat">
          <V>f</V> = μ<sub>k</sub>
          <V>N</V> ≈ 3,5 N
        </Tint>
      </Note>
      <Note x={1280} y={822} p={phC * n8} color={C.heat} size={30}>
        <Tint c="heat">
          <V>E</V>
          <sub>th</sub> = <V>f</V> · <V>s</V> ≈ 17,3 J
        </Tint>
      </Note>
      <Formula x={540} y={806} p={phC * f9} accent={C.kin} size={56}>
        <Frac n={<>1</>} d={<>2</>} />
        <V>m</V> <V color="kin">v</V>
        <Sup>2</Sup> = 32,7 J ⇒ <V color="kin">v</V> ≈ 5,7 m/s
      </Formula>
      <div
        style={{
          position: 'absolute',
          left: 1280,
          top: 170,
          transform: `translateX(-50%) scale(${0.94 + 0.06 * n10})`,
          fontFamily: FONT.head,
          fontSize: 34,
          fontWeight: 700,
          color: C.gold,
          whiteSpace: 'nowrap',
          opacity: phC * n10,
          textShadow: `0 0 18px ${hexA(C.gold, 0.35)}`,
        }}
      >
        50 J = <span style={{color: C.kin}}>32,7 J</span> + <span style={{color: C.heat}}>17,3 J</span>
      </div>
    </AbsoluteFill>
  );
};
