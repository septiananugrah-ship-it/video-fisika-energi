import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Car, HeatShimmer, fmt} from '../components/physics';
import {Formula, Frac, Glow, Label, Note, Stage, Sub, Sup, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Uji jarak henti: waktu reaksi 1 s (laju tetap), lalu pengereman 7 m/s² (jalan kering).
// Gerak dihitung tepat; ditayangkan gerak lambat 0,5×.
const T_R = 1;
const A = 7;
const X0 = 200; // piksel: posisi awal moncong mobil
const PPM = 17.33; // piksel per meter (0–90 m)
const SLOW = 0.5;
const CAR_S = 0.55;

const LANES = [
  {kmh: 60, ground: 390, color: 'cyan'},
  {kmh: 100, ground: 640, color: 'kin'},
] as const;

const motion = (v: number, tau: number) => {
  const tStop = T_R + v / A;
  if (tau <= 0) return {x: 0, v, phase: 0};
  if (tau <= T_R) return {x: v * tau, v, phase: 1};
  const tb = Math.min(tau, tStop) - T_R;
  return {x: v * T_R + v * tb - 0.5 * A * tb * tb, v: Math.max(0, v - A * tb), phase: tau >= tStop ? 3 : 2};
};

/** Cakram rem tampak samping. */
const Disc: React.FC<{x: number; y: number; r: number; angle: number; heat: number}> = ({x, y, r, angle, heat}) => (
  <g>
    <circle cx={x} cy={y} r={r * 1.7} fill="url(#soft-heat)" opacity={heat} />
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <circle r={r} fill="#2a3358" stroke={C.muted} strokeWidth={4} />
      <circle r={r} fill={C.heat} opacity={0.75 * heat} />
      {Array.from({length: 18}, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * r * 0.78} cy={Math.sin(a) * r * 0.78} r={6} fill="#0b1022" opacity={0.8} />;
      })}
      <circle r={r * 0.42} fill="#151d3e" stroke={C.muted} strokeWidth={3} />
      {Array.from({length: 5}, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * r * 0.24} cy={Math.sin(a) * r * 0.24} r={7} fill={C.muted} />;
      })}
    </g>
    {/* kaliper */}
    <path d={`M${x + r * 0.45},${y - r - 18} q${r * 0.6},0 ${r * 0.75},${r * 0.55} l-30,14 q-14,-34 -${r * 0.55},-38 Z`} fill="#3b4a7a" stroke={C.gold} strokeWidth={3} />
  </g>
);

export const Brakes: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const road = win(t, 0, cue(5) - 0.3, 0.9, 0.8);
  const t0 = cue(1) + 1.5;
  const tau = Math.max(0, (t - t0) * SLOW);
  const formula = win(t, cue(0) + 0.6, cue(4) - 0.2, 0.7, 0.5);
  const ratio = win(t, cue(4) + 0.3, cue(5) - 0.3, 0.7, 0.5);
  const hazard = win(t, t0 - 0.4, t0 + 2.5, 0.3, 0.8);
  const clock = ramp(t, t0 - 0.6, t0);
  const result = [ramp(t, cue(3) + 0.5, cue(3) + 1.4), ramp(t, mix(cue(3), cueEnd(3), 0.55), mix(cue(3), cueEnd(3), 0.55) + 0.9)];

  const panel2 = ramp(t, cue(5) + 0.1, cue(5) + 1.1);
  // cakram rem: laju sudut turun linear selama baris 5
  const tb = Math.max(0, t - (cue(5) + 0.8));
  const TB = Math.max(2, cueEnd(5) - cue(5) - 1);
  const discAng = 420 * (Math.min(tb, TB) - Math.min(tb, TB) ** 2 / (2 * TB));
  const discHeat = ramp(t, cue(5) + 1, cueEnd(5), EASE_IN_OUT);
  const ev = ramp(t, cue(6) + 0.2, cue(6) + 1.2);
  const te = Math.max(0, t - (cue(6) + 1.2));
  const TE = Math.max(2, cueEnd(6) - cue(6) - 1.6);
  const evDist = 300 * (Math.min(te, TE) - Math.min(te, TE) ** 2 / (2 * TE));
  const charge = ramp(t, cue(6) + 1.6, cueEnd(6), EASE_IN_OUT);
  const finalNote = ramp(t, cue(7) + 0.3, cue(7) + 1.1);

  const ruler = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  return (
    <AbsoluteFill>
      <Stage>
        {/* ======== PANEL 1: uji jarak henti ======== */}
        <g opacity={road}>
          {LANES.map((ln, i) => {
            const v = ln.kmh / 3.6;
            const m = motion(v, tau);
            const front = X0 + m.x * PPM;
            const pre = t < t0 ? (t - 0) * v * SLOW : 0; // sebelum uji: jalan yang bergerak (mobil melaju)
            const wheel = ((m.x + (t < t0 ? pre : 0)) / 0.32) * (180 / Math.PI);
            const dashOff = -(t < t0 ? pre : (t0 - 0) * v * SLOW) * PPM;
            const reactEnd = X0 + Math.min(m.x, v * T_R) * PPM;
            const brakeLen = Math.max(0, m.x - v * T_R) * PPM;
            const tStop = T_R + v / A;
            const braking = ramp(tau, T_R, T_R + 0.2) * (1 - ramp(tau, tStop - 0.2, tStop + 0.6));
            const sr = v * T_R;
            const sb = (v * v) / (2 * A);
            return (
              <g key={ln.kmh}>
                <rect x={60} y={ln.ground} width={1800} height={10} fill="#1a2550" />
                <line x1={60} y1={ln.ground + 5} x2={1860} y2={ln.ground + 5} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="30 30" strokeDashoffset={dashOff} />
                {/* segmen reaksi & rem */}
                <line x1={X0} y1={ln.ground + 26} x2={reactEnd} y2={ln.ground + 26} stroke={C.gold} strokeWidth={7} strokeDasharray="14 9" opacity={ramp(tau, 0, 0.05)} />
                <rect x={X0 + sr * PPM} y={ln.ground + 22} width={brakeLen} height={9} rx={4} fill={C.heat} />
                <Car x={front - 130 * CAR_S} y={ln.ground} color={ln.color} scale={CAR_S} wheel={wheel} braking={ramp(tau, T_R, T_R + 0.15) * (1 - 0.4 * ramp(tau, tStop, tStop + 0.4))} />
                <HeatShimmer x1={front - 120} x2={front - 30} y={ln.ground} t={t} amount={0.8 * braking} />
                <Label x={front - 70} y={ln.ground - 110} size={26} font="mono" color={ln.color} weight={600}>
                  {`${fmt(m.v * 3.6)} km/jam`}
                </Label>
                <g opacity={result[i]}>
                  <Label x={X0} y={ln.ground + 62} size={24} color={C.gold} anchor="start" weight={600}>
                    {`reaksi ${fmt(sr, 1)} m`}
                  </Label>
                  <Label x={X0 + sr * PPM + 12} y={ln.ground + 62} size={24} color={C.heat} anchor="start" weight={600}>
                    {`rem ${fmt(sb, 1)} m`}
                  </Label>
                  <Label x={X0 + (sr + sb) * PPM + 20} y={ln.ground - 30} size={34} color={C.ink} anchor="start" weight={700}>
                    {`≈ ${fmt(sr + sb, 1)} m`}
                  </Label>
                </g>
              </g>
            );
          })}
          {/* penggaris meter */}
          <line x1={X0} y1={770} x2={X0 + 90 * PPM} y2={770} stroke={C.muted} strokeWidth={2} />
          {ruler.map((d) => (
            <g key={d}>
              <line x1={X0 + d * PPM} y1={762} x2={X0 + d * PPM} y2={778} stroke={C.muted} strokeWidth={2} />
              <Label x={X0 + d * PPM} y={800} size={20} font="mono" color={C.muted}>
                {`${d} m`}
              </Label>
            </g>
          ))}
          {/* jam simulasi & asumsi */}
          <g opacity={clock}>
            <Label x={X0 - 60} y={216} size={28} font="mono" color={C.ink} anchor="start" weight={600}>
              {`t = ${fmt(Math.min(tau, T_R + 100 / 3.6 / A), 2)} s`}
            </Label>
            <Label x={X0 + 170} y={216} size={22} color={C.muted} anchor="start">
              (gerak lambat 0,5×)
            </Label>
            <Label x={X0 - 60} y={256} size={22} color={C.muted} anchor="start">
              model: waktu reaksi 1 s · perlambatan rem 7 m/s² (jalan kering)
            </Label>
          </g>
          <g opacity={hazard}>
            <path d="M1790,240 L1840,330 L1740,330 Z" fill={C.heat} opacity={0.9} />
            <text x={1790} y={318} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={48} fill="#fff">
              !
            </text>
          </g>
        </g>

        {/* ======== PANEL 2: rem gesek vs rem regeneratif ======== */}
        <g opacity={panel2}>
          <line x1={960} y1={250} x2={960} y2={760} stroke={C.line} strokeWidth={2} />
          <Label x={480} y={250} size={32} color={C.heat} weight={700}>
            rem biasa (gesekan)
          </Label>
          <Disc x={480} y={510} r={150} angle={discAng} heat={discHeat} />
          <HeatShimmer x1={360} x2={600} y={340} t={t} amount={discHeat} />
          <Label x={480} y={720} size={26} color={C.ink}>
            <tspan fill={C.kin} fontStyle="italic">K</tspan> → panas → terbuang ke udara
          </Label>
          <Label x={480} y={760} size={24} font="mono" color={C.heat} opacity={discHeat}>
            {`suhu cakram ≈ ${fmt(mix(40, 400, discHeat))} °C`}
          </Label>
        </g>
        <g opacity={ev}>
          <Label x={1440} y={250} size={32} color={C.work} weight={700}>
            rem regeneratif (mobil listrik)
          </Label>
          <line x1={1000} y1={700} x2={1860} y2={700} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="30 30" strokeDashoffset={evDist} />
          <Car x={1420} y={700} color="work" scale={1} wheel={(evDist / 28) * (180 / Math.PI)} />
          {/* baterai */}
          <g transform="translate(1610 400)">
            <rect x={-70} y={-40} width={140} height={80} rx={10} fill="#0c1430" stroke={C.gold} strokeWidth={4} />
            <rect x={70} y={-16} width={12} height={32} rx={3} fill={C.gold} />
            <rect x={-62} y={-32} width={124 * mix(0.3, 0.75, charge)} height={64} rx={6} fill={C.work} />
            <Label x={0} y={70} size={22} font="mono" color={C.work}>
              {`baterai ${fmt(mix(30, 75, charge))} %`}
            </Label>
          </g>
          {/* motor ↔ generator */}
          <circle cx={1348} cy={672} r={22} fill="none" stroke={C.gold} strokeWidth={4} />
          <Label x={1348} y={745} size={22} color={C.gold} weight={600}>
            motor → generator
          </Label>
          <path d="M1370,640 Q1460,440 1540,410" fill="none" stroke={C.work} strokeWidth={6} strokeDasharray="16 12" strokeDashoffset={-t * 60} opacity={0.4 + 0.6 * ramp(charge, 0, 0.1)} markerEnd="url(#arrow-work)" />
          <Label x={1240} y={470} size={26} color={C.ink}>
            <tspan fill={C.kin} fontStyle="italic">K</tspan> → listrik
          </Label>
        </g>
        <Glow x={1610} y={400} r={170} color="work" opacity={0.5 * charge * ev} />
      </Stage>
      <Formula x={1500} y={250} p={formula} accent={C.heat} size={56} caption="jarak rem ∝ kuadrat kelajuan">
        <V>s</V>
        <Sub>rem</Sub> ={' '}
        <Frac
          n={
            <>
              <V>v</V>
              <Sup>2</Sup>
            </>
          }
          d={
            <>
              2<V>a</V>
            </>
          }
        />
      </Formula>
      <Note x={1380} y={250} p={ratio} color={C.gold} size={28}>
        kelajuan 60 → 100 km/jam (× 1,7) · jarak 36,5 → 82,9 m (× 2,3)
      </Note>
      <Note x={960} y={830} p={finalNote} color={C.work} size={28}>
        neraca sama: <span style={{color: C.kin}}>K</span> = panas (terbuang) + listrik di baterai (dipakai lagi)
      </Note>
    </AbsoluteFill>
  );
};
