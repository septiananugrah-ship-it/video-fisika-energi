import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {type Axes, Car, EnergyBars, HeatShimmer, Person, Plot, px, py} from '../components/physics';
import {Arrow, Card, Formula, Frac, Glow, Label, Motes, Ripple, Spark, Sqrt, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Energi kinetik: penurunan dari Newton + kinematika → W_net = ΔK; koper 360 J → ≈ 8,5 m/s;
// K ∝ v²; dua mobil identik direm 5000 N (a = 5 m/s²): 20 m/s → 40 m, 40 m/s → 160 m (gerak waktu nyata).

type P = [number, number];
const TRACK = 430;
const GX1 = 120;
const GX2 = 1240;
const SX0 = 360; // posisi layar troli saat mulai didorong
const PUSH = 500; // px jarak dorongan
const T_CAM = 1.2; // kelambanan kamera mengikuti troli
const half = <Frac n="1" d="2" size={0.7} />;

// mobil
const S0 = 300; // garis mulai rem (bagian depan mobil)
const KPX = 8.75; // piksel per meter (160 m = 1400 px)
const DEC = 5; // m/s²
const LANES = [
  {y: 470, v0: 20, color: C.cyan, hue: 'cyan' as const},
  {y: 720, v0: 40, color: C.kin, hue: 'kin' as const},
];
const CSCALE = 0.8;

/** Titik-titik busur kuadratik dari a ke b (untuk aliran energi). */
const arc = (a: P, b: P, lift: number, n = 16): P[] => {
  const c: P = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const m = 1 - s;
    return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1]];
  });
};

/** Stabilo yang tersapu dari kiri ke kanan di belakang suku rumus yang sedang berubah. */
const Hi: React.FC<{p: number; c: string; children: React.ReactNode}> = ({p, c, children}) => {
  const q = Math.max(0, Math.min(1, p)) * 100;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0 0.1em',
        borderRadius: 10,
        backgroundImage: `linear-gradient(90deg, ${c}40 0%, ${c}40 ${q}%, transparent ${q}%)`,
      }}
    >
      {children}
    </span>
  );
};

const GraphK: React.FC<{op: number; p: number}> = ({op, p}) => {
  if (op <= 0.001) return null;
  const a: Axes = {x0: 280, y0: 760, w: 620, h: 420, xmax: 2.2, ymax: 4.6};
  const d = Array.from({length: 81}, (_, i) => {
    const v = (2.1 * i) / 80;
    return `${i ? 'L' : 'M'}${px(a, v).toFixed(1)},${py(a, v * v).toFixed(1)}`;
  }).join(' ');
  const vt = 2.1 * p;
  return (
    <g opacity={op}>
      <Plot a={a} xLabel="v" yLabel="K" />
      <path d={d} fill="none" stroke={C.kin} strokeOpacity={0.22} strokeWidth={14} strokeDasharray="1000" strokeDashoffset={1000 * (1 - p)} pathLength={1000} />
      <path d={d} fill="none" stroke={C.kin} strokeWidth={5} strokeDasharray="1000" strokeDashoffset={1000 * (1 - p)} pathLength={1000} />
      <Spark x={px(a, vt)} y={py(a, vt * vt)} r={7} color="kin" opacity={Math.sin(Math.PI * Math.min(1, p)) + 0.001} />
      {[1, 2].map((v) => {
        const show = ramp(p, v === 1 ? 0.45 : 0.9, v === 1 ? 0.6 : 1);
        return (
          <g key={v} opacity={show}>
            <line x1={px(a, v)} y1={a.y0} x2={px(a, v)} y2={py(a, v * v)} stroke={C.muted} strokeDasharray="6 6" strokeWidth={2} />
            <line x1={a.x0} y1={py(a, v * v)} x2={px(a, v)} y2={py(a, v * v)} stroke={C.muted} strokeDasharray="6 6" strokeWidth={2} />
            <Glow x={px(a, v)} y={py(a, v * v)} r={50} color="kin" opacity={0.8} />
            <circle cx={px(a, v)} cy={py(a, v * v)} r={10} fill={C.kin} />
            <Label x={px(a, v)} y={a.y0 + 30} size={26} font="serif" italic>
              {v === 1 ? 'v' : '2v'}
            </Label>
            <Label x={a.x0 - 18} y={py(a, v * v)} size={26} font="mono" anchor="end" color={C.kin}>
              {v === 1 ? '1' : '4'}
            </Label>
          </g>
        );
      })}
      <Motes x={px(a, 1.2)} y={py(a, 2)} rx={300} ry={200} n={16} color="kin" opacity={0.3} seed={6} />
    </g>
  );
};

export const Kinetic: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- troli (baris 1–7) ----
  const trolley = win(t, cue(0) + 0.3, cue(8) - 0.2, 0.8, 0.8);
  const t0 = cue(1) + 1.2;
  const t1 = cue(2) + 4.5;
  const D = t1 - t0;
  const u = Math.max(0, Math.min(1, (t - t0) / D));
  const VEL = (2 * PUSH) / D; // px/s saat dorongan berhenti
  const tau = Math.max(0, t - t1);
  // posisi dunia: s ∝ τ² selama didorong, lalu kecepatan tetap (gaya total nol)
  const X = t < t1 ? PUSH * u * u : PUSH + VEL * tau;
  // kamera mulai mengikuti dengan halus (kecepatan kamera naik dari 0 ke V)
  const cam = VEL * (tau - 2 * T_CAM * (1 - Math.exp(-tau / T_CAM)) + (T_CAM / 2) * (1 - Math.exp((-2 * tau) / T_CAM)));
  const sx = (wx: number) => SX0 + wx - cam;
  const tx = sx(X);
  const vFrac = t < t1 ? u : 1;
  const s = Math.min(1, u * u); // W = F·s dan K tumbuh ∝ τ²
  const fArrow = ramp(t, cue(1) + 0.3, cue(1) + 1) * (1 - ramp(t, t1 - 0.2, t1 + 0.6, EASE_IN_OUT));
  const bars = ramp(t, cue(1) + 1.5, cue(1) + 2.3);
  const kLabel = win(t, cue(5), cue(6), 0.8, 0.8);
  const glide = ramp(t, t1, t1 + 1.4);
  const k7 = ramp(t, cue(7), cue(7) + 0.8);

  // pendorong
  const pp = 1 - ramp(t, t1 - 0.1, t1 + 0.7, EASE_IN_OUT); // pose mendorong
  const Xp = Math.min(X, PUSH) - 230;
  const xp = sx(Xp);
  const phase = (Math.min(X, PUSH) / PUSH) * 14 * Math.PI; // 7 langkah, berakhir dengan kaki rapat
  const personOp = trolley * ramp(xp, 60, 120);
  const hx1 = xp + 48;
  const hx2 = tx - 92;

  // kartu penurunan (satu per baris)
  const d1 = win(t, wordOf(1, 'Newton'), cue(2) - 0.1, 0.6, 0.5);
  const d2 = win(t, cue(2) + 0.2, cue(3) - 0.1, 0.6, 0.5);
  const d3 = win(t, cue(3) + 0.1, cue(4) - 0.1, 0.6, 0.5);
  const d4 = win(t, cue(4) + 0.2, cue(5) - 0.1, 0.6, 0.5);
  const d5 = win(t, cue(5) + 0.2, cue(6) - 0.1, 0.6, 0.5);
  const d6 = win(t, cue(6) + 0.2, cue(7) - 0.1, 0.6, 0.5);
  const d7 = win(t, cue(7) + 0.2, cue(8) - 0.2, 0.6, 0.5);
  const hl = (w: number) => ramp(t, w - 0.15, w + 0.7, EASE_IN_OUT);

  // ---- K ∝ v² (baris 8) ----
  const gk = win(t, cue(8) - 0.1, cue(9) - 0.2, 0.7, 0.6);
  const gkp = ramp(t, cue(8) + 0.4, cue(8) + 4, EASE_IN_OUT);

  // ---- mobil (baris 9–12) ----
  const cars = ramp(t, cue(9) - 0.1, cue(9) + 0.8);
  const tb = cue(10);
  const info = win(t, cue(9) + 1, cue(12) - 0.2, 0.7, 0.6);
  const f12 = ramp(t, cue(12) + 0.2, cue(12) + 1);
  const far = ramp(t, tb + 8.3, tb + 9);

  // bar energi troli: puncak batang (untuk aliran)
  const BX = 1440;
  const BY = 780;
  const BH = 200;
  const topBar = BY - BH * s;
  const wBarX = BX + 35;
  const kBarX = BX + 70 + 70 + 35;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="kin-clip">
            <rect x={GX1} y={0} width={GX2 - GX1} height={1080} />
          </clipPath>
          <linearGradient id="kin-hot" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.heat} stopOpacity="0" />
            <stop offset="100%" stopColor={C.heat} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="kin-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f5190" />
            <stop offset="100%" stopColor="#1b2449" />
          </linearGradient>
        </defs>

        {/* ===== troli ===== */}
        <g opacity={trolley}>
          <Motes x={640} y={TRACK - 80} rx={520} ry={150} n={18} color="gold" opacity={0.25} seed={2} />
          {/* lantai yang bergulir mengikuti kamera */}
          <rect x={GX1} y={TRACK} width={GX2 - GX1} height={70} fill="url(#ground)" />
          <g clipPath="url(#kin-clip)">
            {Array.from({length: 38}, (_, k) => {
              const k0 = Math.floor((cam - SX0 + GX1) / 34) - 1;
              const x = sx((k0 + k) * 34);
              const op = Math.max(0, Math.min(1, (x - GX1) / 50, (GX2 - x) / 50));
              return op > 0 ? <line key={k} x1={x} y1={TRACK + 2} x2={x - 16} y2={TRACK + 24} stroke={C.faint} strokeWidth={2} opacity={op} /> : null;
            })}
            {Array.from({length: 8}, (_, k) => {
              const k0 = Math.floor((cam - SX0 + GX1) / 200) - 1;
              const x = sx((k0 + k) * 200);
              const op = Math.max(0, Math.min(1, (x - GX1) / 60, (GX2 - x) / 60));
              return op > 0 ? <rect key={`m${k}`} x={x - 3} y={TRACK - 10} width={6} height={10} rx={2} fill={C.muted} opacity={0.5 * op} /> : null;
            })}
            {/* jejak perpindahan s (tetap di dunia, ikut bergulir) */}
            <g opacity={ramp(u, 0.1, 0.25)}>
              <line x1={sx(0)} y1={TRACK + 40} x2={sx(Math.min(X, PUSH))} y2={TRACK + 40} stroke={C.cyan} strokeWidth={4} />
              <line x1={sx(0)} y1={TRACK + 30} x2={sx(0)} y2={TRACK + 50} stroke={C.cyan} strokeWidth={3} />
              <line x1={sx(Math.min(X, PUSH))} y1={TRACK + 30} x2={sx(Math.min(X, PUSH))} y2={TRACK + 50} stroke={C.cyan} strokeWidth={3} />
              <Label x={(sx(0) + sx(Math.min(X, PUSH))) / 2} y={TRACK + 70} size={28} font="serif" italic color={C.cyan} opacity={ramp((sx(0) + sx(Math.min(X, PUSH))) / 2, 150, 260)}>
                s
              </Label>
            </g>
          </g>
          <line x1={GX1} y1={TRACK} x2={GX2} y2={TRACK} stroke={C.ink} strokeOpacity={0.85} strokeWidth={3} />

          {/* pendorong */}
          <g opacity={personOp} transform={`rotate(${8 * pp + 1.2 * Math.sin(t * 1.8)} ${xp} ${TRACK})`}>
            <Person x={xp} y={TRACK} phase={phase} scale={0.9} color={C.ink} arm={60 * pp} />
          </g>

          {/* troli */}
          <ellipse cx={tx} cy={TRACK + 4} rx={92} ry={9} fill="#000" opacity={0.45} />
          <Glow x={tx} y={TRACK - 70} r={170} color="kin" opacity={0.75 * s} />
          {[0, 1, 2].map((k) => {
            const L = (46 + 20 * Math.sin(t * 6 + k * 2.3)) * glide;
            return (
              <line
                key={k}
                x1={tx - 96 - L}
                y1={TRACK - 96 + k * 26}
                x2={tx - 96}
                y2={TRACK - 96 + k * 26}
                stroke={C.ink}
                strokeOpacity={0.35 * glide}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
          <g transform={`translate(${tx} ${TRACK})`}>
            <rect x={-80} y={-110} width={160} height={84} rx={12} fill="url(#kin-body)" stroke={C.pot} strokeWidth={3} />
            <rect x={-70} y={-102} width={140} height={9} rx={4.5} fill="#fff" opacity={0.12} />
            <text x={0} y={-62} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={28} fontWeight={600} fill={C.ink} opacity={1 - k7}>
              m
            </text>
            <text x={0} y={-62} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={28} fontWeight={600} fill={C.ink} opacity={k7}>
              10 kg
            </text>
            {[-50, 50].map((wx) => (
              <g key={wx} transform={`translate(${wx} -14) rotate(${(X / 14) * (180 / Math.PI)})`}>
                <circle r={14} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
                <line x1={-10} x2={10} y1={0} y2={0} stroke={C.muted} strokeWidth={2} />
                <line x1={0} x2={0} y1={-10} y2={10} stroke={C.muted} strokeWidth={2} />
                <circle r={3} fill={C.ink} />
              </g>
            ))}
          </g>
          <Arrow x1={hx1} y1={TRACK - 70} x2={hx2} y2={TRACK - 70} color="force" width={7} opacity={fArrow} />
          <Label x={(hx1 + hx2) / 2} y={TRACK - 106} size={30} font="serif" italic color={C.force} opacity={fArrow}>
            F
          </Label>
          {/* kecepatan ∝ τ */}
          <Arrow x1={tx - 40} y1={TRACK - 140} x2={tx - 40 + 150 * vFrac} y2={TRACK - 140} color="kin" width={5} />
          <Label x={tx - 40 + 150 * vFrac + 26} y={TRACK - 140} size={28} font="serif" italic color={C.kin} anchor="start" opacity={ramp(u, 0.05, 0.2)}>
            v
          </Label>

          {/* aliran energi: usaha F·s masuk, menjadi energi gerak */}
          <Stream pts={arc([(hx1 + hx2) / 2, TRACK - 72], [wBarX, topBar - 10], 120, 24)} color="work" n={18} speed={0.35} r={6} opacity={fArrow * bars} seed={1} />
          <Stream pts={arc([tx, TRACK - 120], [kBarX, topBar - 10], 150, 24)} color="kin" n={18} speed={0.35} r={6} opacity={fArrow * bars} seed={2} />
          <Stream pts={arc([wBarX + 24, topBar - 6], [kBarX - 24, topBar - 6], 30, 12)} color="work" n={5} speed={0.6} opacity={bars * win(t, cue(6) + 0.3, cue(7), 0.5, 0.5)} seed={3} />
          <Glow x={kBarX} y={BY - BH / 2} r={130} color="kin" opacity={kLabel} />
          <Ripple x={kBarX} y={topBar} p={ramp(t, cue(5) + 0.2, cue(5) + 1.5)} r={110} color="kin" />
          <EnergyBars
            x={BX}
            y={BY}
            height={BH}
            barW={70}
            gap={70}
            max={1}
            total={false}
            showValues={false}
            unit=""
            title="USAHA → ENERGI KINETIK"
            opacity={bars}
            bars={[
              {key: 'W', label: 'F·s', value: s, color: 'work'},
              {key: 'K', label: '½mv²', value: s, color: 'kin'},
            ]}
          />
        </g>
        {/* pendar kartu rumus utama */}
        <Glow x={700} y={700} r={330} color="kin" opacity={d5 * 0.75} />
        <Glow x={700} y={700} r={330} color="gold" opacity={d6 * 0.6} />
        <Twinkles x={700} y={700} rx={330} ry={90} n={5} color="kin" opacity={d7 * ramp(t, wordOf(7, 'delapan'), wordOf(7, 'delapan') + 0.6)} seed={3} />

        {/* ===== K ∝ v² ===== */}
        <GraphK op={gk} p={gkp} />
        <g opacity={gk}>
          {[0, 1].map((i) => {
            const y = 430 + i * 220;
            const v = i === 0 ? 1 : 2;
            const ph = (((t * 0.6 * v) % 1) + 1) % 1;
            const bx = 1110 + ph * 220;
            const fade = cyc(ph) * 1.25;
            const show = ramp(gkp, i === 0 ? 0.45 : 0.9, i === 0 ? 0.6 : 1);
            return (
              <g key={i} opacity={show}>
                <g opacity={Math.min(1, fade)}>
                  {Array.from({length: 5}, (_, k) => (
                    <circle key={k} cx={bx - (k + 1) * 9 * v} cy={y} r={30 * (1 - (k + 1) / 7)} fill={C.kin} opacity={0.18 * (1 - k / 5)} />
                  ))}
                  <circle cx={bx} cy={y} r={52} fill="url(#soft-kin)" />
                  <circle cx={bx} cy={y} r={30} fill={C.kin} />
                  <circle cx={bx - 10} cy={y - 10} r={7} fill="#fff" opacity={0.5} />
                  <Arrow x1={bx + 38} y1={y} x2={bx + 38 + 60 * v} y2={y} color="kin" width={5} />
                </g>
                <Label x={1220} y={y + 66} size={26} font="serif" italic>
                  {i === 0 ? 'v' : '2v'}
                </Label>
                <rect x={1560} y={y + 40 - 40 * v * v} width={60} height={40 * v * v} rx={6} fill={C.kin} />
                <rect x={1568} y={y + 46 - 40 * v * v} width={8} height={40 * v * v - 12} rx={4} fill="#fff" opacity={0.18} />
                <Label x={1660} y={y + 40 - 20 * v * v} size={34} font="mono" color={C.kin} anchor="start" weight={600}>
                  {i === 0 ? '1×' : '4×'}
                </Label>
              </g>
            );
          })}
          <Twinkles x={1700} y={610} rx={70} ry={60} n={5} color="kin" opacity={ramp(gkp, 0.95, 1)} seed={7} />
          <Ripple x={1590} y={570} p={ramp(t, cue(8) + 3.6, cue(8) + 5)} r={130} color="kin" />
        </g>

        {/* ===== dua mobil direm ===== */}
        <g opacity={cars}>
          {LANES.map((ln, i) => {
            const tauB = t - tb;
            const tStop = ln.v0 / DEC;
            const posAt = (tt0: number) => {
              const tt = Math.max(0, Math.min(tt0, tStop));
              return ln.v0 * tt - 0.5 * DEC * tt * tt;
            };
            const brakingAt = (x: number) => ramp(x, 0, 0.2) * (1 - ramp(x, tStop - 0.3, tStop));
            const sM = posAt(tauB);
            const v = tauB < 0 ? ln.v0 : Math.max(0, ln.v0 - DEC * tauB);
            const front = S0 + sM * KPX;
            const carX = front - 130 * CSCALE;
            const braking = brakingAt(tauB);
            const heatFrac = 1 - (v / ln.v0) ** 2; // K yang sudah menjadi panas
            const cool = 1 - 0.55 * ramp(tauB, tStop, tStop + 8);
            // sebelum rem: marka jalan bergeser (mobil melaju dengan kamera)
            const scroll = tauB < 0 ? (((ln.v0 * KPX * tauB) % 80) + 80) % 80 : 0;
            const stopped = ramp(t, tb + tStop, tb + tStop + 0.6);
            const stopX = S0 + ((ln.v0 * ln.v0) / (2 * DEC)) * KPX;
            const wheel = ((sM - (tauB < 0 ? -ln.v0 * tauB : 0)) * KPX * 180) / (Math.PI * 28 * CSCALE);
            const rearX = carX - 70 * CSCALE;
            const frontWX = carX + 78 * CSCALE;
            const rear0 = S0 - 130 * CSCALE - 70 * CSCALE;
            const front0 = S0 - 130 * CSCALE + 78 * CSCALE;
            const sp = v / ln.v0;
            const wy = ln.y - 28 * CSCALE;
            return (
              <g key={i}>
                {/* aspal */}
                <rect x={120} y={ln.y} width={1680} height={44} fill="#0b1330" opacity={0.9} />
                <line x1={120} y1={ln.y + 44} x2={1800} y2={ln.y + 44} stroke={C.faint} strokeWidth={2} />
                <line x1={120} y1={ln.y} x2={1800} y2={ln.y} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
                <line x1={120 + scroll} y1={ln.y + 22} x2={1800} y2={ln.y + 22} stroke={C.muted} strokeWidth={4} strokeDasharray="40 40" strokeDashoffset={-scroll} />
                {/* bekas rem: jejak gelap + ujung yang masih panas */}
                {tauB > 0 ? (
                  <g>
                    {[
                      [rear0, rearX],
                      [front0, frontWX],
                    ].map(([a, b], k) => (
                      <g key={k}>
                        <line x1={a} y1={ln.y + 3} x2={Math.max(a, b)} y2={ln.y + 3} stroke="#03050c" strokeWidth={6} opacity={0.85} />
                        <line x1={a} y1={ln.y + 3} x2={Math.max(a, b)} y2={ln.y + 3} stroke={C.heat} strokeWidth={2} opacity={0.22 * cool} />
                        <rect x={Math.max(a, b - 90)} y={ln.y + 1} width={Math.max(0, b - Math.max(a, b - 90))} height={4} fill="url(#kin-hot)" opacity={0.15 + 0.75 * braking} />
                      </g>
                    ))}
                  </g>
                ) : null}
                <HeatShimmer x1={rear0} x2={Math.max(rear0 + 80, frontWX)} y={ln.y} t={t + i * 0.37} amount={heatFrac * 0.75 * cool * ramp(tauB, 0.2, 0.8)} />
                <line x1={S0} y1={ln.y - 140} x2={S0} y2={ln.y + 34} stroke={C.heat} strokeWidth={3} strokeDasharray="8 8" opacity={0.7} />
                {/* garis gerak */}
                {[0, 1, 2].map((k) => {
                  const L = (60 + 20 * Math.sin(t * 7 + k * 2 + i)) * sp;
                  const x2 = carX - 110 * CSCALE;
                  return sp > 0.01 ? (
                    <line key={k} x1={Math.max(124, x2 - L)} y1={ln.y - 34 - k * 26} x2={Math.max(124, x2)} y2={ln.y - 34 - k * 26} stroke={ln.color} strokeOpacity={0.4 * sp} strokeWidth={3} strokeLinecap="round" />
                  ) : null;
                })}
                {/* asap ban saat mengerem */}
                {Array.from({length: 7}, (_, k) => {
                  const L = 1.5;
                  const age = ((((tauB - (k * L) / 7) % L) + L) % L);
                  const ts = tauB - age;
                  const b = brakingAt(ts);
                  if (b <= 0.01 || ts < 0) return null;
                  const sx0 = S0 + posAt(ts) * KPX - 130 * CSCALE - 70 * CSCALE;
                  return (
                    <circle
                      key={`s${k}`}
                      cx={sx0 - 14 * age}
                      cy={ln.y - 8 - 34 * age}
                      r={8 + 18 * (age / L)}
                      fill={C.muted}
                      opacity={0.3 * cyc(age / L) * b}
                    />
                  );
                })}
                <ellipse cx={carX + 5} cy={ln.y + 3} rx={110} ry={8} fill="#000" opacity={0.5} />
                <Car x={carX} y={ln.y} scale={CSCALE} color={ln.color} wheel={wheel} braking={braking} />
                {/* rem membara */}
                {[rearX, frontWX].map((wx, k) => (
                  <g key={`h${k}`} opacity={heatFrac * cool * (0.75 + 0.25 * Math.sin(t * 5 + k))}>
                    <circle cx={wx} cy={wy} r={44} fill="url(#soft-heat)" />
                    <circle cx={wx} cy={wy} r={17} fill="none" stroke={C.heat} strokeWidth={4} />
                  </g>
                ))}
                {/* batang mini: K berubah menjadi panas */}
                <g opacity={ramp(t, cue(9) + 1.2, cue(9) + 2)}>
                  <rect x={carX - 65} y={ln.y - 136} width={130} height={10} rx={5} fill="rgba(10,16,36,0.85)" stroke={C.line} strokeWidth={1.5} />
                  <rect x={carX - 65} y={ln.y - 136} width={130 * (1 - heatFrac)} height={10} rx={5} fill={C.kin} />
                  <rect x={carX - 65 + 130 * (1 - heatFrac)} y={ln.y - 136} width={130 * heatFrac} height={10} rx={5} fill={C.heat} />
                </g>
                <Label x={S0 + 14} y={ln.y - 165} size={26} color={ln.color} anchor="start" weight={600}>
                  {`v₀ = ${ln.v0} m/s  ·  K = ${ln.v0 === 20 ? '200' : '800'} kJ`}
                </Label>
                <Ripple x={stopX} y={ln.y - 60} p={ramp(t, tb + tStop, tb + tStop + 1.3)} r={120} color={ln.hue} />
                <g opacity={stopped}>
                  <line x1={stopX} y1={ln.y - 140} x2={stopX} y2={ln.y + 34} stroke={ln.color} strokeWidth={3} strokeDasharray="8 8" />
                  <Label x={stopX + (i === 1 ? -14 : 14)} y={i === 1 ? ln.y - 168 : ln.y - 120} size={34} font="mono" color={ln.color} weight={600} anchor={i === 1 ? 'end' : 'start'}>
                    {ln.v0 === 20 ? '40 m' : '160 m'}
                  </Label>
                </g>
              </g>
            );
          })}
          <Label x={S0} y={LANES[0].y - 200} size={22} color={C.heat}>
            mulai rem
          </Label>
          {/* skala jarak */}
          {[0, 40, 80, 120, 160].map((m) => (
            <g key={m}>
              <line x1={S0 + m * KPX} y1={LANES[1].y + 50} x2={S0 + m * KPX} y2={LANES[1].y + 62} stroke={C.muted} strokeWidth={2} />
              <Label x={S0 + m * KPX} y={LANES[1].y + 82} size={20} font="mono" color={C.muted}>
                {`${m} m`}
              </Label>
            </g>
          ))}
          <g opacity={far}>
            <Glow x={1180} y={LANES[1].y - 60} r={190} color="gold" opacity={0.6} />
            <Label x={1180} y={LANES[1].y - 60} size={44} color={C.gold} weight={700}>
              4× lebih jauh
            </Label>
            <Twinkles x={1180} y={LANES[1].y - 60} rx={190} ry={44} n={6} color="gold" seed={9} />
          </g>
        </g>
      </Stage>

      {/* kartu penurunan */}
      <Formula x={700} y={700} p={d1} accent={C.force} size={60} caption="hukum Newton II">
        <V>a</V> ={' '}
        <Hi p={hl(wordOf(1, 'sebesar') + 0.3)} c={C.force}>
          <Frac n={<V>F</V>} d={<V>m</V>} />
        </Hi>
      </Formula>
      <Formula x={700} y={700} p={d2} accent={C.cyan} size={60} caption="kinematika percepatan tetap">
        <V>v</V>
        <Sup>2</Sup> − <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup> ={' '}
        <Hi p={hl(wordOf(2, 'dua'))} c={C.cyan}>
          2<V>a s</V>
        </Hi>
      </Formula>
      <Formula x={700} y={700} p={d3} accent={C.cyan} size={60} caption="kalikan kedua ruas dengan ½m">
        <Hi p={hl(wordOf(3, 'setengah'))} c={C.gold}>
          {half}
          <V>m</V>
        </Hi>
        (<V>v</V>
        <Sup>2</Sup> − <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup>) ={' '}
        <Hi p={hl(wordOf(3, 'setengah') + 0.25)} c={C.gold}>
          {half}
          <V>m</V>
        </Hi>{' '}
        · 2<V>a s</V>
      </Formula>
      <Formula x={700} y={700} p={d4} accent={C.work} size={60}>
        <Hi p={hl(wordOf(4, 'kiri'))} c={C.kin}>
          {half}
          <V>m v</V>
          <Sup>2</Sup> − {half}
          <V>m v</V>
          <Sub>0</Sub>
          <Sup>2</Sup>
        </Hi>{' '}
        ={' '}
        <Hi p={hl(wordOf(4, 'kanan') + 0.2)} c={C.work}>
          <V>m a s</V> = <V color={C.work}>F s</V>
        </Hi>
      </Formula>
      <Formula x={700} y={700} p={d5} accent={C.kin} size={72} caption="energi kinetik: energi karena bergerak">
        <V color={C.kin}>K</V> ={' '}
        <Hi p={hl(wordOf(5, 'kinetik'))} c={C.kin}>
          {half}
          <V>m v</V>
          <Sup>2</Sup>
        </Hi>
      </Formula>
      <Formula x={700} y={700} p={d6} accent={C.gold} size={66} caption="teorema usaha–energi">
        <V color={C.work}>W</V>
        <Sub>net</Sub> ={' '}
        <Hi p={hl(wordOf(6, 'perubahan'))} c={C.kin}>
          Δ<V color={C.kin}>K</V>
        </Hi>{' '}
        = <V>K</V>
        <Sub>akhir</Sub> − <V>K</V>
        <Sub>awal</Sub>
      </Formula>
      <Formula x={700} y={700} p={d7} accent={C.kin} size={58} caption="koper 10 kg dari diam">
        360 = {half}(10)<V>v</V>
        <Sup>2</Sup> → <V>v</V> = <Sqrt>72</Sqrt> ≈{' '}
        <Hi p={hl(wordOf(7, 'delapan'))} c={C.kin}>
          <span style={{color: C.kin}}>8,5 m/s</span>
        </Hi>
      </Formula>

      <Card x={1440} y={240} opacity={info} accent={C.heat} style={{padding: '12px 26px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 28}}>
          tiap mobil 1000 kg · gaya rem 5000 N → <span style={{color: C.heat}}>a = 5 m/s²</span>
        </div>
      </Card>
      <Formula x={1340} y={240} p={f12} accent={C.kin} size={56} caption="jarak rem sebanding dengan kuadrat kelajuan">
        <V>s</V> ={' '}
        <Frac
          n={
            <>
              ½<V>m v</V>
              <Sub>0</Sub>
              <Sup>2</Sup>
            </>
          }
          d={
            <>
              <V>F</V>
              <Sub>rem</Sub>
            </>
          }
        />
      </Formula>
    </AbsoluteFill>
  );
};
