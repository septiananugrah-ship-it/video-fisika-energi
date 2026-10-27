import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {HeatShimmer, Person, fmt} from '../components/physics';
import {Card, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Energi di rumah (kWh) & di tubuh (daya, efisiensi otot, kalori makanan).
// Setrika 1000 W × 2 jam = 2 kWh = 7,2 MJ → cukup mengangkat 70 kg setinggi 7,2e6/(70·10) ≈ 10,3 km.
// Lari naik tangga 3 m dalam 3 s: 70·10·3/3 = 700 W.

const ALT = {x: 1330, y0: 800, y12: 250}; // sumbu ketinggian 0–12 km
const altY = (km: number) => ALT.y0 - (km / 12) * (ALT.y0 - ALT.y12);

const STAIR = {x0: 200, y0: 800, run: 60, rise: 35, n: 10};
const stairTopX = STAIR.x0 + STAIR.run * STAIR.n;
const stairTopY = STAIR.y0 - STAIR.rise * STAIR.n;

/** Titik-titik pada kurva Bezier kubik (untuk aliran sepanjang pita Sankey). */
const bez = (p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], n = 12): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const u = i / n;
    const a = (1 - u) ** 3;
    const b = 3 * u * (1 - u) ** 2;
    const c = 3 * u * u * (1 - u);
    const d = u ** 3;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });

const Iron: React.FC<{x: number; y: number; heat: number}> = ({x, y, heat}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={10} rx={130} ry={40} fill="url(#soft-heat)" opacity={heat} />
    <path d="M-110,0 L90,0 Q120,0 120,-20 L60,-70 L-60,-70 Q-110,-70 -110,-20 Z" fill="#1e2a55" stroke={C.muted} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-100,-12 L96,-12" stroke="#fff" strokeOpacity={0.08} strokeWidth={6} strokeLinecap="round" />
    <path d="M-50,-62 L50,-62" stroke="#fff" strokeOpacity={0.12} strokeWidth={4} strokeLinecap="round" />
    <path d="M-110,0 L120,0" stroke={C.heat} strokeWidth={6} strokeOpacity={0.3 + 0.7 * heat} strokeLinecap="round" />
    <path d="M-40,-70 Q-40,-120 0,-120 L60,-120 Q80,-120 70,-95" fill="none" stroke={C.muted} strokeWidth={10} strokeLinecap="round" />
    <circle cx={30} cy={-40} r={8} fill={C.heat} opacity={0.3 + 0.7 * heat} />
  </g>
);

const Cloud: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx={0} cy={0} rx={56} ry={14} fill="#c7d6ff" opacity={0.5} />
      <ellipse cx={-18} cy={-10} rx={26} ry={16} fill="#c7d6ff" opacity={0.5} />
      <ellipse cx={16} cy={-12} rx={30} ry={18} fill="#d8e3ff" opacity={0.5} />
    </g>
  );

export const Home: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const panelA = win(t, 0, cue(3) - 0.4, 0.9, 0.7);
  const panelB = ramp(t, cue(3) + 0.1, cue(3) + 1.0);

  // ---- panel A: meter kWh & setrika ----
  const on = ramp(t, cue(1) + 0.6, cue(1) + 1.0);
  const tR0 = cue(1) + 1.0;
  const tR1 = cueEnd(1) - 0.3;
  const runAt = (tt: number) => ramp(tt, tR0, tR1, EASE_IN_OUT); // 0 → 2 jam
  const run = runAt(t);
  const rate = Math.min(1, (((runAt(t + 0.04) - runAt(t - 0.04)) / 0.08) * (tR1 - tR0)) / 2); // laju putar meter (∝ daya × skala waktu)
  const kwh = 2 * run;
  const discAng = 360 * 6 * run;
  const chips = win(t, cue(0) + 1.2, cue(1) + 0.4, 0.6, 0.5);
  const eCard = win(t, cue(1) + 1.2, cue(2) + 0.2, 0.7, 0.5);
  const alt = ramp(t, cue(2) + 0.2, cue(2) + 1.2);
  const lift = ramp(t, cue(2) + 1.5, cueEnd(2) - 1.5, EASE_IN_OUT);
  const kmNow = 10.3 * lift;
  const hCard = ramp(t, cue(2) + 2.5, cue(2) + 3.4);
  const ironing = on * (1 - 0.6 * ramp(t, tR1, tR1 + 1.2));
  const ix = 700 + 46 * Math.sin(t * 2.2) * ironing;
  const ironHeat = on * (0.6 + 0.4 * Math.sin(t * 3) ** 2);
  // LED meter berkedip (impuls per kWh): pelan saat beban kecil, cepat saat setrika menyala
  const led = 0.5 + 0.5 * Math.sin(t * (2 + 9 * on));

  // ---- panel B: tangga ----
  const tRun = cue(3) + 2.0;
  const s = ramp(t, tRun, tRun + 3, (x) => x); // kelajuan tetap 3 s
  const running = ramp(t, tRun, tRun + 0.15) * (1 - ramp(t, tRun + 2.85, tRun + 3.1));
  const runT = 3 * s;
  const px = mix(STAIR.x0 + 40, stairTopX - 10, s);
  const py = mix(STAIR.y0, stairTopY, s);
  const stepPhase = s * STAIR.n * Math.PI;
  const breathe = (1 - running) * (2 + 2 * ramp(t, tRun + 3, tRun + 3.5)) * Math.sin(t * (2.4 + 2 * ramp(t, tRun + 3, tRun + 3.5)));
  const ug = 70 * 10 * 3 * s;
  const pCard = win(t, cue(3) + 4.0, cue(4) + 0.3, 0.7, 0.5);
  const flow = win(t, cue(4) + 0.6, cue(5) - 0.1, 0.7, 0.5);
  const flowP = ramp(t, cue(4) + 0.8, cue(4) + 3.0, EASE_IN_OUT);
  const sweat = ramp(t, cue(4) + 2.5, cue(4) + 3.5);
  const food = ramp(t, cue(5) + 0.3, cue(5) + 1.1);
  const kalCard = ramp(t, cue(5) + 2.4, cue(5) + 3.2);
  const readouts = ramp(t, cue(3) + 1.0, cue(3) + 1.8);

  // pita Sankey (efisiensi otot)
  const SX0 = 1190;
  const SX1 = 1600;
  const top = 400;
  const H = 330;
  const usefulH = H * 0.25;
  const MX = (SX0 + SX1) / 2;
  const ribbon = (y0a: number, y0b: number, y1a: number, y1b: number) =>
    `M${SX0},${y0a} C${MX},${y0a} ${MX},${y1a} ${SX1},${y1a} L${SX1},${y1b} C${MX},${y1b} ${MX},${y0b} ${SX0},${y0b} Z`;
  const yU0 = top + usefulH / 2;
  const yU1 = top - 10 + usefulH / 2;
  const yH0 = top + usefulH + (H - usefulH) / 2;
  const yH1 = top + usefulH + 40 + (H - usefulH) / 2;
  const usefulPts = bez([SX0, yU0], [MX, yU0], [MX, yU1], [SX1 + 10, yU1]);
  const heatPts = bez([SX0, yH0], [MX, yH0], [MX, yH1], [SX1 + 10, yH1]);
  const heatPts2 = bez([SX0, yH0 - 70], [MX, yH0 - 70], [MX, yH1 - 70], [SX1 + 10, yH1 - 70]);
  const heatPts3 = bez([SX0, yH0 + 70], [MX, yH0 + 70], [MX, yH1 + 70], [SX1 + 10, yH1 + 70]);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= PANEL A ================= */}
        <g opacity={panelA}>
          {/* meter kWh */}
          <g transform="translate(430 548) scale(0.85)">
            <rect x={-206} y={-144} width={412} height={270} rx={24} fill="#000" opacity={0.3} />
            <rect x={-200} y={-150} width={400} height={270} rx={22} fill="#101a3a" stroke={C.muted} strokeWidth={3} />
            <rect x={-190} y={-140} width={380} height={12} rx={6} fill="#fff" opacity={0.06} />
            <Label x={0} y={-118} size={22} color={C.muted} weight={600} spacing={3}>
              METER LISTRIK
            </Label>
            <rect x={-160} y={-90} width={320} height={80} rx={10} fill="#050914" stroke={C.gold} strokeWidth={2} />
            <rect x={-160} y={-90} width={320} height={80} rx={10} fill={C.gold} opacity={0.05 + 0.08 * rate} />
            <text x={110} y={-50} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={46} fill={C.gold}>
              {fmt(kwh, 2)}
            </text>
            <text x={145} y={-44} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
              kWh
            </text>
            {/* cakram aluminium berputar (tanda merah + garis-garis tepi) */}
            <ellipse cx={0} cy={50} rx={90} ry={18} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 10}, (_, k) => {
              const a = ((discAng + k * 36) * Math.PI) / 180;
              const front = Math.sin(a) > 0;
              return front ? <line key={k} x1={78 * Math.cos(a)} y1={50 + 15.6 * Math.sin(a)} x2={90 * Math.cos(a)} y2={50 + 18 * Math.sin(a)} stroke={C.muted} strokeWidth={2} /> : null;
            })}
            <circle cx={90 * Math.cos((discAng * Math.PI) / 180)} cy={50 + 18 * Math.sin((discAng * Math.PI) / 180)} r={7} fill={C.heat} />
            <circle cx={150} cy={50} r={9} fill={C.heat} opacity={0.25 + 0.75 * led} />
            <circle cx={150} cy={50} r={24} fill="url(#soft-heat)" opacity={led} />
          </g>
          {/* kabel ke setrika + arus energi listrik */}
          <path d={`M430,650 Q430,690 520,700 Q600,708 ${ix - 90},716`} fill="none" stroke={C.muted} strokeWidth={4} />
          <Stream
            pts={[
              [430, 652],
              [440, 682],
              [520, 700],
              [ix - 90, 716],
            ]}
            color="cyan"
            n={6}
            speed={0.8}
            r={4}
            jitter={1}
            opacity={on * (0.35 + 0.65 * rate)}
          />
          {/* papan setrika */}
          <g opacity={0.85}>
            <line x1={600} y1={806} x2={800} y2={872} stroke={C.faint} strokeWidth={5} strokeLinecap="round" />
            <line x1={800} y1={806} x2={600} y2={872} stroke={C.faint} strokeWidth={5} strokeLinecap="round" />
            <path d="M520,792 L860,792 Q900,792 900,800 Q900,808 860,808 L520,808 Z" fill="#26325f" stroke={C.muted} strokeWidth={2.5} />
          </g>
          <HeatShimmer x1={ix - 90} x2={ix + 90} y={720} t={t} amount={0.7 * on} />
          {/* uap dari setrika */}
          {Array.from({length: 7}, (_, k) => {
            const ph = (((t * 0.6 + k / 7) % 1) + 1) % 1;
            const sx0 = ix + 80 + 14 * Math.sin(k * 2.1);
            return <circle key={k} cx={sx0 + 30 * ph + 8 * Math.sin(t * 2 + k)} cy={784 - 120 * ph} r={8 + 22 * ph} fill="#d8e3ff" opacity={cyc(ph) * 0.22 * on} />;
          })}
          <Iron x={ix} y={790} heat={ironHeat} />
          <Label x={700} y={846} size={24} color={C.ink} weight={600}>
            setrika 1000 W
          </Label>
          {/* jam 2 jam */}
          <g transform="translate(200 740)">
            <circle r={58} fill="#101a3a" stroke={C.muted} strokeWidth={3} />
            {Array.from({length: 12}, (_, k) => {
              const a = (k / 12) * Math.PI * 2;
              return <line key={k} x1={48 * Math.sin(a)} y1={-48 * Math.cos(a)} x2={54 * Math.sin(a)} y2={-54 * Math.cos(a)} stroke={C.muted} strokeWidth={2} />;
            })}
            <path d={`M0,0 L0,-50 A50,50 0 ${run > 0.5 ? 1 : 0} 1 ${50 * Math.sin(run * 2 * Math.PI * 0.999)},${-50 * Math.cos(run * 2 * Math.PI * 0.999)} Z`} fill={C.cyan} opacity={0.3 * Math.min(1, run * 50)} />
            <line x1={0} y1={0} x2={44 * Math.sin(run * 4 * Math.PI)} y2={-44 * Math.cos(run * 4 * Math.PI)} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <line x1={0} y1={0} x2={30 * Math.sin(run * Math.PI)} y2={-30 * Math.cos(run * Math.PI)} stroke={C.cyan} strokeWidth={5} strokeLinecap="round" />
            <circle r={5} fill={C.ink} />
            <Label x={0} y={88} size={24} font="mono" color={C.cyan}>
              {`${fmt(2 * run, 1)} jam`}
            </Label>
          </g>
          <Motes x={560} y={640} rx={360} ry={200} n={22} color="gold" opacity={0.35} seed={3} />
          {/* sumbu ketinggian */}
          <g opacity={alt}>
            {/* langit makin gelap & berbintang di atas */}
            {Array.from({length: 10}, (_, k) => (
              <circle key={k} cx={1400 + rand(k * 3.3) * 420} cy={altY(9.5 + rand(k * 5.1) * 2.4)} r={1.5 + rand(k) * 1.5} fill="#fff" opacity={0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * (1.5 + rand(k * 2)) + k))} />
            ))}
            <line x1={ALT.x} y1={ALT.y0} x2={ALT.x} y2={ALT.y12 - 20} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            {[0, 2, 4, 6, 8, 10, 12].map((k) => (
              <g key={k}>
                <line x1={ALT.x - 8} y1={altY(k)} x2={ALT.x + 8} y2={altY(k)} stroke={C.muted} strokeWidth={2} />
                <Label x={ALT.x - 20} y={altY(k)} size={20} font="mono" color={C.muted} anchor="end">
                  {`${k} km`}
                </Label>
              </g>
            ))}
            <path d={`M1400,${ALT.y0} L1520,${altY(5.5)} L1560,${altY(7)} L1600,${altY(8.85)} L1650,${altY(7.4)} L1720,${altY(5)} L1820,${ALT.y0} Z`} fill="#1b2650" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M1600,${altY(8.85)} L1650,${altY(7.4)} L1720,${altY(5)} L1820,${ALT.y0} L1700,${ALT.y0} L1630,${altY(6)} Z`} fill="#000" opacity={0.18} />
            <path d={`M1560,${altY(7)} L1600,${altY(8.85)} L1650,${altY(7.4)} L1625,${altY(7.6)} L1600,${altY(7.1)} L1580,${altY(7.5)} Z`} fill="#e8efff" opacity={0.8} />
            <Twinkles x={1600} y={altY(8.2)} rx={40} ry={24} n={3} color="white" opacity={0.6} seed={4} />
            <Label x={1660} y={altY(8.85) - 6} size={22} color={C.muted} anchor="start">
              Everest ≈ 8,8 km
            </Label>
            {/* awan berarak di beberapa ketinggian */}
            {[0, 1, 2, 3].map((k) => {
              const ph = (((t * (0.03 + 0.012 * k) + k * 0.27) % 1) + 1) % 1;
              return <Cloud key={k} x={1380 + 440 * ph} y={altY([2.2, 4.4, 6.4, 3.3][k])} s={0.6 + 0.15 * k} o={cyc(ph) * 0.6} />;
            })}
            <line x1={ALT.x} y1={altY(10.3)} x2={1800} y2={altY(10.3)} stroke={C.pot} strokeWidth={2} strokeDasharray="8 8" opacity={ramp(lift, 0.9, 1)} />
            {/* jejak ketinggian + energi masuk sebagai Ug */}
            <line x1={ALT.x + 60} y1={ALT.y0} x2={ALT.x + 60} y2={altY(kmNow) + 4} stroke={C.pot} strokeWidth={3} strokeDasharray="6 8" opacity={0.6} />
            <Stream
              pts={[
                [ALT.x + 60, ALT.y0],
                [ALT.x + 60, altY(kmNow) + 6],
              ]}
              color="pot"
              n={6}
              speed={0.9}
              r={4.5}
              jitter={2}
              opacity={ramp(kmNow, 0.2, 1) * (1 - ramp(lift, 0.97, 1) * 0.6)}
            />
            <g transform={`translate(${ALT.x + 60} ${altY(kmNow) + 3 * Math.sin(t * 2.2)})`}>
              <circle cx={0} cy={-36} r={60} fill="url(#soft-pot)" opacity={0.8} />
              <rect x={-26} y={0} width={52} height={7} rx={3} fill={C.pot} />
              <Person x={0} y={0} scale={0.42} color={C.pot} phase={0.5 * Math.sin(t * 1.8)} arm={-40 + 10 * Math.sin(t * 2.5)} />
            </g>
            <Label x={ALT.x + 100} y={altY(kmNow) - 40} size={28} font="mono" color={C.pot} anchor="start" weight={600}>
              {`${fmt(kmNow, 1)} km`}
            </Label>
            <Ripple x={ALT.x + 60} y={altY(10.3) - 30} p={(t - (cueEnd(2) - 1.5)) / 1.4} r={110} color="pot" />
            <Twinkles x={ALT.x + 150} y={altY(10.3) - 40} rx={110} ry={40} n={4} color="pot" opacity={ramp(lift, 0.95, 1)} seed={6} />
          </g>
        </g>

        {/* ================= PANEL B ================= */}
        <g opacity={panelB}>
          {/* tangga dengan sisi samping (kedalaman) */}
          <path
            d={
              `M${STAIR.x0 - 80 + 26},${STAIR.y0 - 16} ` +
              Array.from({length: STAIR.n}, (_, i) => `H${STAIR.x0 + i * STAIR.run + 26} V${STAIR.y0 - (i + 1) * STAIR.rise - 16}`).join(' ') +
              ` H${stairTopX + 140 + 26} V${STAIR.y0 - 16} Z`
            }
            fill="#0e1634"
            stroke={C.faint}
            strokeWidth={2}
          />
          <path
            d={
              `M${STAIR.x0 - 80},${STAIR.y0} ` +
              Array.from({length: STAIR.n}, (_, i) => `H${STAIR.x0 + i * STAIR.run} V${STAIR.y0 - (i + 1) * STAIR.rise}`).join(' ') +
              ` H${stairTopX + 140} V${STAIR.y0} Z`
            }
            fill="#141e42"
            stroke={C.muted}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {Array.from({length: STAIR.n}, (_, i) => (
            <line key={i} x1={STAIR.x0 + i * STAIR.run} y1={STAIR.y0 - (i + 1) * STAIR.rise + 2} x2={STAIR.x0 + (i + 1) * STAIR.run} y2={STAIR.y0 - (i + 1) * STAIR.rise + 2} stroke="#fff" strokeOpacity={0.12} strokeWidth={3} />
          ))}
          {/* pegangan tangga */}
          <line x1={STAIR.x0 - 20} y1={STAIR.y0 - 70} x2={stairTopX + 20} y2={stairTopY - 70} stroke={C.muted} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
          {[0, 3, 6, 9].map((i) => (
            <line key={i} x1={STAIR.x0 + i * STAIR.run + 30} y1={STAIR.y0 - (i + 1) * STAIR.rise} x2={STAIR.x0 + i * STAIR.run + 30} y2={STAIR.y0 - (i + 1) * STAIR.rise - 70 + (STAIR.rise * 0.5)} stroke={C.muted} strokeWidth={3} opacity={0.5} />
          ))}
          <g opacity={readouts}>
            <line x1={stairTopX + 180} y1={STAIR.y0} x2={stairTopX + 180} y2={stairTopY} stroke={C.pot} strokeWidth={3} markerStart="url(#arrow-pot)" markerEnd="url(#arrow-pot)" />
            <Label x={stairTopX + 198} y={(STAIR.y0 + stairTopY) / 2} size={30} color={C.pot} anchor="start" weight={600}>
              3 m
            </Label>
            <Stream
              pts={[
                [stairTopX + 180, STAIR.y0 - 10],
                [stairTopX + 180, mix(STAIR.y0 - 10, stairTopY + 10, Math.max(0.05, s))],
              ]}
              color="pot"
              n={5}
              speed={0.9}
              r={4}
              jitter={0}
              opacity={running}
            />
          </g>
          <Glow x={px} y={py - 70} r={150} color="heat" opacity={0.6 * sweat} />
          <ellipse cx={px} cy={py + 2} rx={26} ry={5} fill="#000" opacity={0.35} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={px - 36 - 14 * k} y1={py - 50 - 22 * k} x2={px - 80 - 14 * k} y2={py - 50 - 22 * k + 26} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.4 * running} />
          ))}
          <Person x={px} y={py - 6 * Math.abs(Math.sin(stepPhase)) * running + breathe * 0.5} phase={stepPhase} scale={0.62} color={C.ink} />
          <HeatShimmer x1={px - 50} x2={px + 50} y={py - 116} t={t} amount={0.8 * sweat} />
          {Array.from({length: 5}, (_, i) => {
            const ph = (((t * 0.8 + i / 5) % 1) + 1) % 1;
            return <path key={i} d={`M${px + (rand(i) - 0.5) * 50},${py - 112 + ph * 60} q4,-10 0,-14 q-4,4 0,14 Z`} fill={C.cyan} opacity={cyc(ph) * sweat} />;
          })}
          <Label x={180} y={232} size={30} font="mono" color={C.ink} anchor="start" weight={600} opacity={readouts}>
            {`t = ${fmt(runT, 1)} s`}
          </Label>
          <Label x={180} y={278} size={26} font="mono" color={C.pot} anchor="start" opacity={readouts}>
            <tspan fontStyle="italic">U</tspan>
            <tspan baselineShift="sub" fontSize="0.65em">
              g
            </tspan>
            {` naik: ${fmt(ug)} J`}
          </Label>
          <Label x={180} y={318} size={22} color={C.muted} anchor="start" opacity={readouts}>
            orang 70 kg
          </Label>
          <Ripple x={stairTopX - 10} y={stairTopY - 60} p={(t - tRun - 3) / 1.3} r={120} color="pot" />
          {/* Sankey efisiensi otot */}
          <g opacity={flow}>
            <Label x={(SX0 + SX1) / 2} y={top - 50} size={24} color={C.muted} weight={600} spacing={2}>
              ENERGI DARI MAKANAN
            </Label>
            <rect x={SX0 - 40} y={top} width={40} height={H} rx={6} fill={C.gold} />
            <rect x={SX0 - 34} y={top + 8} width={8} height={H - 16} rx={4} fill="#fff" opacity={0.2} />
            <circle cx={SX0 - 20} cy={top + H / 2} r={90} fill="url(#soft-gold)" opacity={0.5 + 0.2 * Math.sin(t * 2)} />
            <g opacity={flowP}>
              <path d={ribbon(top, top + usefulH, top - 10, top - 10 + usefulH)} fill={C.work} opacity={0.75} />
              <path d={ribbon(top + usefulH, top + H, top + usefulH + 40, top + H + 40)} fill={C.heat} opacity={0.7} />
              <Stream pts={usefulPts} color="white" n={6} speed={0.45} r={3.5} jitter={2} opacity={0.8} />
              {[heatPts2, heatPts, heatPts3].map((pts, k) => (
                <Stream key={k} pts={pts} color="white" n={5} speed={0.45} r={3.5} jitter={3} seed={k + 1} opacity={0.6} />
              ))}
              <HeatShimmer x1={SX1 - 30} x2={SX1 + 10} y={top + usefulH + 40} t={t} amount={0.8} />
            </g>
            <Label x={SX1 + 16} y={top - 10 + usefulH / 2} size={26} color={C.work} anchor="start" weight={600} opacity={flowP}>
              ≈ 25 % usaha
            </Label>
            <Label x={SX1 + 16} y={top + usefulH + 40 + (H - usefulH) / 2} size={26} color={C.heat} anchor="start" weight={600} opacity={flowP}>
              ≈ 75 % panas
            </Label>
            <Label x={SX0 - 20} y={top + H + 30} size={22} color={C.gold}>
              100 %
            </Label>
          </g>
          {/* makanan → energi tubuh */}
          <g opacity={food}>
            <g transform={`translate(1040 ${392 + 3 * Math.sin(t * 1.6)})`}>
              <circle r={90} fill="url(#soft-gold)" opacity={0.5} />
              <path d="M-42,-6 Q-30,-40 0,-42 Q30,-40 42,-6 Z" fill="#f2f5ff" opacity={0.92} />
              <path d="M-56,-6 L56,-6 Q50,34 0,38 Q-50,34 -56,-6 Z" fill="#3b4a7a" stroke={C.gold} strokeWidth={3} />
              <path d="M-44,8 Q0,18 44,8" fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={4} />
              {[0, 1, 2].map((k) => {
                const ph = (((t * 0.5 + k / 3) % 1) + 1) % 1;
                return <path key={k} d={`M${-18 + 18 * k},${-50 - 50 * ph} q8,-10 0,-20 q-8,-10 0,-20`} fill="none" stroke="#d8e3ff" strokeWidth={3} strokeLinecap="round" opacity={cyc(ph) * 0.5} />;
              })}
            </g>
            <Stream
              pts={[
                [1000, 380],
                [930, 360],
                [860, 362],
                [stairTopX + 4, stairTopY - 70],
              ]}
              color="gold"
              n={7}
              speed={0.5}
              r={5}
              opacity={ramp(t, cue(5) + 0.8, cue(5) + 1.6)}
            />
          </g>
        </g>
        <Glow x={1420} y={640} r={260} color="gold" opacity={0.4 * kalCard * panelB} />
        <Twinkles x={1420} y={640} rx={240} ry={80} n={5} color="gold" opacity={kalCard * panelB} seed={2} />
        <Twinkles x={1420} y={340} rx={260} ry={80} n={4} color="cyan" opacity={pCard * panelB} seed={9} />
      </Stage>

      {/* ---- kartu panel A ---- */}
      <div style={{position: 'absolute', left: 960, top: 300, display: 'flex', flexDirection: 'column', gap: 24, opacity: chips * panelA}}>
        <div style={{fontFamily: FONT.head, fontSize: 34, color: C.muted, padding: '14px 26px', borderRadius: 14, border: `2px solid ${C.line}`, background: 'rgba(10,16,36,0.85)', translate: `${(1 - chips) * 20}px 0px`}}>
          daya: <b style={{color: C.cyan}}>watt</b> — seberapa cepat
        </div>
        <div
          style={{
            fontFamily: FONT.head,
            fontSize: 34,
            color: C.ink,
            padding: '14px 26px',
            borderRadius: 14,
            border: `2px solid ${C.gold}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${20 + 10 * Math.sin(t * 2.4)}px ${C.gold}55`,
            translate: `${(1 - chips) * 40}px 0px`,
          }}
        >
          tagihan: <b style={{color: C.gold}}>kilowatt jam</b> — berapa banyak energi
        </div>
      </div>
      <Formula x={1400} y={420} p={eCard} accent={C.gold} size={58} caption="1 kWh = 3,6 × 10⁶ J  →  2 kWh ≈ 7,2 × 10⁶ J">
        <V>E</V> = <V>P t</V> = 1 kW × 2 jam = 2 kWh
      </Formula>
      <Formula x={560} y={240} p={hCard * panelA} accent={C.pot} size={56} caption="massa 70 kg, g = 10 m/s²">
        <V>h</V> ={' '}
        <Frac
          n={<V>E</V>}
          d={
            <>
              <V>m g</V>
            </>
          }
        />{' '}
        ={' '}
        <Frac
          n={
            <>
              7,2 × 10<Sup>6</Sup> J
            </>
          }
          d="700 N"
        />{' '}
        ≈ 10,3 km
      </Formula>

      {/* ---- kartu panel B ---- */}
      <Formula x={1420} y={340} p={pCard * panelB} accent={C.cyan} size={56} caption="daya = energi dibagi waktu">
        <V>P</V> ={' '}
        <Frac
          n={
            <>
              <V>m g h</V>
            </>
          }
          d={<V>t</V>}
        />{' '}
        ={' '}
        <Frac n="2100 J" d="3 s" /> = 700 W
      </Formula>
      <Note x={1420} y={815} p={sweat * flow} color={C.heat} size={26}>
        panas berlebih dibuang lewat keringat
      </Note>
      <Card x={1420} y={360} opacity={food * panelB} accent={C.gold} style={{padding: '20px 34px', width: 520, whiteSpace: 'normal'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, fontWeight: 700, borderBottom: `3px solid ${C.ink}`, paddingBottom: 8}}>Informasi Nilai Gizi</div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.head, fontSize: 28, marginTop: 12}}>
          <span>Energi total</span>
          <b style={{color: C.gold}}>250 kkal</b>
        </div>
        <div style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted, marginTop: 8}}>sering ditulis "250 kalori" ≈ 1,05 juta joule</div>
      </Card>
      <Formula x={1420} y={640} p={kalCard * panelB} accent={C.gold} size={58} caption="kalori pada label makanan = kilokalori">
        1 kkal ≈ 4184 J
      </Formula>
    </AbsoluteFill>
  );
};
