import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {Crate, Ground, HeatShimmer, fmt} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Contoh 2 modul: koper 10 kg, F = 60 N pada 60°, s = 20 m, gesekan 12 N.
// Buku kas usaha per gaya: +600, −240, 0, 0 → 360 J.

const FLOOR = 560;
const X0 = 230; // posisi 0 m (tengah koper)
const PXM = 40; // piksel per meter → 20 m = 800 px
const TH = (60 * Math.PI) / 180;
const RL = 270; // panjang tali tergambar (ujung tetap di bawah zona heading)

// gerak koper: s = 20·u² (dipercepat dari diam), lalu melambat halus 3 % terakhir agar tidak berhenti mendadak
const U1 = 0.97;
const DU = (2 * (1 - U1 * U1)) / (2 * U1);
const UEND = U1 + DU;
const g = (u: number) => (u <= U1 ? u * u : U1 * U1 + 2 * U1 * (u - U1) - (U1 / DU) * (u - U1) ** 2);
const gd = (u: number) => (u <= U1 ? 2 * u : Math.max(0, 2 * U1 * (1 - (u - U1) / DU)));

// diagram aliran 600 J → 360 J (K) + 240 J (panas), skala 0,2 px/J
const SK = {x0: 180, xs: 400, xc: 640, x1: 1090};

const Row: React.FC<{p: number; label: React.ReactNode; value: number; color: string; strong?: boolean; flash?: number}> = ({p, label, value, color, strong, flash = 0}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 40,
      padding: '6px 10px',
      margin: '0 -10px',
      borderRadius: 8,
      fontSize: strong ? 40 : 34,
      borderBottom: strong ? undefined : `1.5px dashed rgba(147,160,196,${0.22 * (1 - p)})`,
      background: `${color}${Math.round(40 * flash)
        .toString(16)
        .padStart(2, '0')}`,
    }}
  >
    <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color, opacity: p, translate: `${(1 - p) * 20}px 0px`}}>{label}</span>
    <span style={{fontFamily: FONT.mono, fontWeight: 600, color, opacity: p, translate: `${(1 - p) * 20}px 0px`}}>
      {value > 0 ? '+' : value < 0 ? '−' : ''}
      {fmt(Math.abs(value) * Math.min(1, p * 1.2))} J
    </span>
  </div>
);

export const Suitcase: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  // koper dipercepat dari diam (gerak diperlambat untuk ditonton): s = 20 (τ/T)²
  const a = cue(0) + 2;
  const b = cue(6);
  const u = Math.max(0, Math.min(UEND, ((t - a) / (b - a)) * UEND));
  const sM = 20 * g(u);
  const vRel = gd(u) / 2; // 0..1
  const x = X0 + sM * PXM;
  const hY = FLOOR - 120 - 22;
  const FL = 230;
  const forces = ramp(t, cue(0) + 0.8, cue(0) + 2);
  const fric = ramp(t, cue(1), cue(1) + 0.8);
  const gn = ramp(t, cue(4), cue(4) + 0.8);
  const cosC = win(t, cue(2) + 0.6, cue(4), 0.8, 0.8);

  const rF = ramp(t, wordOf(2, 'Hasilnya'), wordOf(2, 'Hasilnya') + 1);
  const rf = ramp(t, wordOf(3, 'yaitu'), wordOf(3, 'yaitu') + 1);
  const rg = ramp(t, cue(4) + 1, cue(4) + 2);
  const rT = ramp(t, wordOf(5, 'tiga'), wordOf(5, 'tiga') + 1.2);
  const ledger = ramp(t, cue(0) + 2.5, cue(0) + 3.5);
  const flash = (p: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, p)));

  const f1 = win(t, cue(2) + 0.2, cue(3) - 0.1, 0.7, 0.6);
  const f2 = win(t, cue(3) + 0.2, cue(5) - 0.1, 0.7, 0.6);
  const f3 = win(t, cue(5) + 0.2, cue(6) - 0.1, 0.7, 0.6);
  const flow = ramp(t, cue(6) + 0.3, cue(6) + 2.6, EASE_IN_OUT);
  const flowIn = ramp(t, cue(6), cue(6) + 0.8);
  const emph = ramp(t, cue(7) + 0.2, cue(7) + 1.2);
  const moveCue = win(t, cue(0) + 2, cue(6), 1, 0.8);

  // aliran usaha tarik masuk ke koper (lewat komponen searah gerak) & gesekan menjadi panas
  const pull = forces * (0.35 + 0.65 * vRel + 0.4 * ramp(t, cue(2), cue(2) + 1)) * (1 - ramp(t, cue(6) + 1, cue(6) + 3));
  const heat = fric * Math.min(1, 0.25 + vRel);
  const hx = x + FL * Math.cos(TH);
  const ropeEnd = {x: x + RL * Math.cos(TH), y: hY - RL * Math.sin(TH)};

  // pita diagram aliran
  const yS = 700; // atas pita sumber (600 J = 120 px)
  const kBand = `M${SK.xs},${yS} C${SK.xs + 120},${yS} ${SK.xc - 120},680 ${SK.xc},680 L${SK.x1},680 L${SK.x1},752 L${SK.xc},752 C${SK.xc - 120},752 ${SK.xs + 120},${yS + 72} ${SK.xs},${yS + 72} Z`;
  const hBand = `M${SK.xs},${yS + 72} C${SK.xs + 120},${yS + 72} ${SK.xc - 120},816 ${SK.xc},816 L${SK.x1},816 L${SK.x1},864 L${SK.xc},864 C${SK.xc - 120},864 ${SK.xs + 120},${yS + 120} ${SK.xs},${yS + 120} Z`;
  const kMid: [number, number][] = [
    [SK.xs, yS + 36],
    [SK.xs + 120, yS + 30],
    [SK.xc - 60, 718],
    [SK.xc, 716],
    [SK.x1 - 10, 716],
  ];
  const hMid: [number, number][] = [
    [SK.xs, yS + 96],
    [SK.xs + 120, yS + 104],
    [SK.xc - 60, 836],
    [SK.xc, 840],
    [SK.x1 - 10, 840],
  ];

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <clipPath id="suit-flow">
            <rect x={SK.x0 - 10} y={640} width={(SK.x1 + 60 - SK.x0) * flow + 10} height={250} />
          </clipPath>
        </defs>
        <Motes x={640} y={420} rx={560} ry={200} n={26} color="gold" opacity={0.3} seed={9} />
        <Ground x1={120} x2={1160} y={FLOOR} rough heat={0.5 * heat} />
        {/* skala jarak */}
        <g opacity={ramp(t, cue(0) + 1, cue(0) + 2)}>
          {[0, 5, 10, 15, 20].map((m) => (
            <g key={m}>
              <line x1={X0 + m * PXM} y1={FLOOR + 30} x2={X0 + m * PXM} y2={FLOOR + 44} stroke={C.muted} strokeWidth={2} />
              <Label x={X0 + m * PXM} y={FLOOR + 66} size={20} font="mono" color={C.muted}>
                {`${m} m`}
              </Label>
            </g>
          ))}
          <line x1={X0} y1={FLOOR + 37} x2={X0 + 20 * PXM} y2={FLOOR + 37} stroke={C.muted} strokeWidth={2} />
          <line x1={X0} y1={FLOOR + 37} x2={x} y2={FLOOR + 37} stroke={C.cyan} strokeWidth={5} strokeLinecap="round" />
          <circle cx={x} cy={FLOOR + 37} r={7} fill={C.cyan} />
          <circle cx={x} cy={FLOOR + 37} r={18} fill="url(#soft-cyan)" />
        </g>
        {/* panas gesekan di bawah koper */}
        <HeatShimmer x1={x - 90} x2={x + 90} y={FLOOR} t={t} amount={heat * 0.9} />
        <Glow x={x} y={FLOOR} r={110} color="heat" opacity={0.5 * heat} still />
        <Stream pts={[[x + 40, FLOOR - 4], [x - 40, FLOOR - 10], [x - 110, FLOOR - 50]]} color="heat" n={5} speed={0.9} r={3.5} jitter={4} opacity={heat * 0.8 * moveCue} seed={3} />
        {/* debu & garis gerak */}
        {[0, 1, 2].map((i) => {
          const ph = (t * 1.2 + i / 3) % 1;
          return <circle key={i} cx={x - 90 - ph * 60} cy={FLOOR - 6 - ph * 22} r={3 + ph * 9} fill={C.muted} opacity={0.25 * cyc(ph) * vRel} />;
        })}
        {[-30, 0, 30].map((o) => (
          <line key={o} x1={x - 96} y1={FLOOR - 64 + o} x2={x - 96 - 80 * vRel} y2={FLOOR - 64 + o} stroke={C.ink} strokeOpacity={0.25 * vRel} strokeWidth={3} strokeLinecap="round" />
        ))}
        <ellipse cx={x} cy={FLOOR + 4} rx={92} ry={7} fill="#000" opacity={0.4} />
        <Glow x={x} y={FLOOR - 60} r={150} color="kin" opacity={0.55 * vRel * vRel} />
        <Crate x={x} y={FLOOR} w={160} h={120} label="10 kg" color={C.pot} handle />
        <rect x={x - 52} y={FLOOR - 120} width={10} height={120} fill={C.pot} opacity={0.22} />
        <rect x={x + 42} y={FLOOR - 120} width={10} height={120} fill={C.pot} opacity={0.22} />
        {[-56, 56].map((o) => (
          <g key={o} transform={`translate(${x + o} ${FLOOR - 9}) rotate(${((x - X0) / 9) * (180 / Math.PI)})`}>
            <circle r={9} fill="#0b1022" stroke={C.muted} strokeWidth={2.5} />
            <line x1={-7} y1={0} x2={7} y2={0} stroke={C.muted} strokeWidth={2} />
            <line x1={0} y1={-7} x2={0} y2={7} stroke={C.muted} strokeWidth={2} />
          </g>
        ))}
        {/* gaya-gaya */}
        <g opacity={forces}>
          <line x1={x} y1={hY} x2={ropeEnd.x} y2={ropeEnd.y} stroke={C.muted} strokeWidth={3} />
          <circle cx={ropeEnd.x} cy={ropeEnd.y} r={13} fill="#1a2550" stroke={C.ink} strokeWidth={3} />
          <line x1={ropeEnd.x + 10} y1={ropeEnd.y - 2} x2={ropeEnd.x + 64} y2={ropeEnd.y - 10} stroke={C.ink} strokeWidth={6} strokeLinecap="round" opacity={0.75} />
          <Arrow x1={x} y1={hY} x2={x + FL * Math.cos(TH)} y2={hY - FL * Math.sin(TH)} color="force" width={7} />
          <Label x={x + FL * Math.cos(TH) + 54} y={hY - FL * Math.sin(TH) + 20} size={30} color={C.force} weight={600}>
            60 N
          </Label>
          <path d={`M${x + 60},${hY} A60,60 0 0 0 ${x + 60 * Math.cos(TH)},${hY - 60 * Math.sin(TH)}`} fill="none" stroke={C.gold} strokeWidth={3} />
          <Label x={x + 92} y={hY - 34} size={22} color={C.gold}>
            60°
          </Label>
        </g>
        {/* komponen searah gerak: F cos 60° = 30 N, hanya bagian ini yang memindahkan energi */}
        <g opacity={cosC}>
          <line x1={hx} y1={hY - FL * Math.sin(TH)} x2={hx} y2={hY} stroke={C.muted} strokeWidth={2} strokeDasharray="6 7" />
          <Arrow x1={x} y1={hY} x2={hx} y2={hY} color="work" width={6} />
          <Label x={hx + 16} y={hY + 4} size={22} color={C.work} anchor="start" weight={600}>
            30 N
          </Label>
        </g>
        <Stream pts={[[hx - 4, hY], [x + 20, hY], [x + 6, hY + 40], [x, hY + 80]]} color="work" n={6} speed={0.75} r={4.5} jitter={3} opacity={pull} seed={1} />
        <g opacity={fric}>
          <Arrow x1={x - 80} y1={FLOOR - 8} x2={x - 200} y2={FLOOR - 8} color="heat" width={6} />
          <Label x={x - 150} y={FLOOR - 40} size={26} color={C.heat} weight={600}>
            12 N
          </Label>
        </g>
        <g opacity={gn}>
          <Arrow x1={x + 58} y1={FLOOR - 60} x2={x + 58} y2={FLOOR + 22} color="muted" width={5} pulse={false} />
          <Label x={x + 96} y={FLOOR - 24} size={26} font="serif" italic color={C.muted} anchor="start">
            mg
          </Label>
          <Arrow x1={x - 58} y1={FLOOR - 60} x2={x - 58} y2={FLOOR - 190} color="muted" width={5} pulse={false} />
          <Label x={x - 80} y={FLOOR - 180} size={26} font="serif" italic color={C.muted} anchor="end">
            N
          </Label>
          <Label x={x - 70} y={FLOOR - 230} size={24} color={C.muted} anchor="end">
            ⊥ gerak → W = 0
          </Label>
        </g>
        <g opacity={ramp(t, cue(0) + 2, cue(0) + 3) * (1 - flowIn)}>
          <Arrow x1={X0 - 60} y1={FLOOR + 110} x2={X0 + 60} y2={FLOOR + 110} color="cyan" width={4} />
          <Label x={X0 + 76} y={FLOOR + 110} size={24} color={C.cyan} anchor="start">
            arah gerak
          </Label>
        </g>

        {/* ===== aliran 600 J: 360 J ke koper (kinetik), 240 J jadi panas ===== */}
        <g opacity={flowIn}>
          <g clipPath="url(#suit-flow)">
            <rect x={SK.x0} y={yS} width={SK.xs - SK.x0 + 2} height={120} rx={10} fill={C.work} opacity={0.9} />
            <path d={kBand} fill={C.kin} opacity={0.9} />
            <path d={hBand} fill={C.heat} opacity={0.9} />
            <path d={`M${SK.x1},668 L${SK.x1 + 40},716 L${SK.x1},764 Z`} fill={C.kin} />
            <path d={`M${SK.x1},808 L${SK.x1 + 30},840 L${SK.x1},872 Z`} fill={C.heat} />
            <rect x={SK.x0 + 10} y={yS + 8} width={SK.xs - SK.x0 - 20} height={7} rx={3.5} fill="#fff" opacity={0.25} />
            <text x={SK.x0 + 18} y={yS + 44} fontFamily={FONT.head} fontWeight={700} fontSize={30} fill="#04281a">
              600 J
            </text>
            <text x={SK.x0 + 18} y={yS + 80} fontFamily={FONT.head} fontWeight={500} fontSize={22} fill="#04281a">
              usaha tarik
            </text>
            <text x={SK.xc + 20} y={716} dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={27} fill="#1a0d00">
              360 J → energi kinetik koper
            </text>
            <text x={SK.xc + 20} y={840} dominantBaseline="central" fontFamily={FONT.head} fontWeight={600} fontSize={24} fill="#2a0006">
              240 J → panas (gesekan)
            </text>
            <Stream pts={[[SK.x0 + 10, yS + 104], [SK.xs, yS + 104]]} color="white" n={4} speed={0.5} r={3} jitter={2} opacity={0.6} seed={4} />
            <Stream pts={kMid} color="white" n={7} speed={0.32} r={3} jitter={3} opacity={0.55} seed={5} />
            <Stream pts={hMid} color="white" n={5} speed={0.32} r={3} jitter={2} opacity={0.55} seed={6} />
          </g>
          <HeatShimmer x1={SK.x1 - 40} x2={SK.x1 + 60} y={812} t={t} amount={flow} />
          <Ripple x={SK.x1 + 20} y={716} p={(t - cue(6) - 2.4) / 1.4} r={100} color="kin" />
        </g>
        {/* koper menerima 360 J: aliran dari ujung pita K ke koper */}
        <Stream pts={[[SK.x1 + 30, 690], [SK.x1 + 20, 620], [x + 40, FLOOR - 70]]} color="kin" n={6} speed={0.6} r={4} jitter={3} opacity={flow * win(t, cue(6) + 2, dur, 0.6, 0.6)} seed={7} />
      </Stage>

      {/* buku kas usaha */}
      <Card
        x={1490}
        y={470}
        opacity={ledger}
        accent={C.work}
        style={{padding: '22px 36px', minWidth: 470, boxShadow: `0 18px 50px rgba(0,0,0,0.45), 0 0 ${60 * emph}px rgba(255,201,74,${0.45 * emph})`}}
      >
        <div style={{fontFamily: FONT.head, fontSize: 22, letterSpacing: 3, color: C.muted, marginBottom: 6}}>BUKU KAS USAHA</div>
        <Row p={rF} flash={flash(rF)} label={<>W<Sub>tarik</Sub></>} value={600} color={C.work} />
        <Row p={rf} flash={flash(rf)} label={<>W<Sub>gesek</Sub></>} value={-240} color={C.heat} />
        <Row p={rg} flash={flash(rg)} label={<>W<Sub>berat</Sub></>} value={0} color={C.muted} />
        <Row p={rg} flash={flash(rg)} label={<>W<Sub>normal</Sub></>} value={0} color={C.muted} />
        <div style={{height: 2, background: C.line, margin: '8px 0', opacity: rT}} />
        <Row p={rT} flash={flash(rT)} label={<>W<Sub>total</Sub></>} value={360} color={C.gold} strong />
      </Card>
      <Stage>
        <Twinkles x={1660} y={354} rx={70} ry={20} n={3} color="work" opacity={win(t, wordOf(2, 'Hasilnya') + 0.8, wordOf(2, 'Hasilnya') + 2.8, 0.3, 0.8)} seed={1} />
        <Twinkles x={1660} y={414} rx={70} ry={20} n={3} color="heat" opacity={win(t, wordOf(3, 'yaitu') + 0.8, wordOf(3, 'yaitu') + 2.8, 0.3, 0.8)} seed={2} />
        <Twinkles x={1640} y={616} rx={110} ry={30} n={6} color="gold" opacity={ramp(t, wordOf(5, 'tiga') + 1, wordOf(5, 'tiga') + 1.6)} seed={3} />
        <Ripple x={1640} y={616} p={(t - wordOf(5, 'tiga') - 1.0) / 1.5} r={160} color="gold" />
        <Ripple x={1490} y={470} p={(t - cue(7) - 0.2) / 1.8} r={330} color="gold" rings={2} />
      </Stage>

      <Formula x={640} y={780} p={f1} accent={C.work} size={56}>
        <V>W</V>
        <Sub>tarik</Sub> = (60)(20)(cos 60°) = <span style={{color: C.work}}>600 J</span>
      </Formula>
      <Formula x={640} y={780} p={f2} accent={C.heat} size={56}>
        <V>W</V>
        <Sub>gesek</Sub> = −(12)(20) = <span style={{color: C.heat}}>−240 J</span>
      </Formula>
      <Formula x={640} y={780} p={f3} accent={C.gold} size={56}>
        <V>W</V>
        <Sub>total</Sub> = 600 − 240 = <span style={{color: C.gold}}>360 J</span>
      </Formula>
    </AbsoluteFill>
  );
};

