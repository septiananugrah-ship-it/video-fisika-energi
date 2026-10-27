import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Crate, Ground, HeatShimmer, Person, fmt} from '../components/physics';
import {Formula, Frac, Glow, Label, Stage, Sub, Sup, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

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

/** Tangga dengan dasar kiri di (x0, FLOOR). */
const Stairs: React.FC<{x0: number}> = ({x0}) => {
  const d: string[] = [`M${x0 - 60},${FLOOR}`, `L${x0},${FLOOR}`];
  for (let i = 0; i < STEPS; i++) {
    d.push(`L${x0 + i * RUN},${FLOOR - (i + 1) * RISE}`, `L${x0 + (i + 1) * RUN},${FLOOR - (i + 1) * RISE}`);
  }
  d.push(`L${x0 + STEPS * RUN + 70},${FLOOR - STEPS * RISE}`);
  const fill = `${d.join(' ')} L${x0 + STEPS * RUN + 70},${FLOOR} Z`;
  return (
    <g>
      <path d={fill} fill="#121c3e" opacity={0.9} />
      <path d={d.join(' ')} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
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
  return {x: x0 - 30 + (k + 0.4) * RUN, y: FLOOR - RISE * (Math.min(STEPS, i + lift)), phase: k * Math.PI};
};

/** Pita aliran energi (Sankey) dari (x1, y1) ke (x2, y2) dengan tebal w. */
const band = (x1: number, y1: number, x2: number, y2: number, w: number) => {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1 - w / 2} C${mx},${y1 - w / 2} ${mx},${y2 - w / 2} ${x2},${y2 - w / 2} L${x2},${y2 + w / 2} C${mx},${y2 + w / 2} ${mx},${y1 + w / 2} ${x1},${y1 + w / 2} Z`;
};

export const Power: React.FC = () => {
  const {t, cue} = useScene();

  // ---------- bagian A: dua orang menaiki tangga ----------
  const phaseA = 1 - ramp(t, cue(5) - 0.6, cue(5) + 0.2, EASE_IN_OUT);
  const t0 = cue(0) + 1.2;
  const TW = 9; // detik, berjalan
  const TR = 3; // detik, berlari
  const sW = ramp(t, t0, t0 + TW, (x) => x);
  const sR = ramp(t, t0, t0 + TR, (x) => x);
  const XW = 190;
  const XR = 830;
  const pw = climb(XW, sW);
  const pr = climb(XR, sR);
  const stairsIn = ramp(t, 0, 1);
  const ugTag = win(t, cue(1), cue(5) - 0.6, 0.6, 0.5);
  const pTag = ramp(t, cue(3) + 2.5, cue(3) + 3.3);
  const fP = win(t, cue(3) + 0.3, cue(5) - 0.6, 0.6, 0.5);
  const fFv = win(t, cue(4) + 0.2, cue(5) - 0.6, 0.6, 0.5);

  // ---------- bagian B: motor pengangkat ----------
  const phaseB = ramp(t, cue(5) - 0.2, cue(5) + 0.8);
  const lift = ramp(t, cue(5) + 1.2, cue(5) + 7.2, EASE_IN_OUT);
  const simT = 15 * ramp(t, cue(5) + 1.2, cue(5) + 7.2, (x) => x);
  const crateY = mix(830, 410, lift);
  const drumRot = lift * 1400;
  const calc = win(t, cue(6) + 0.2, cue(8) - 0.2, 0.6, 0.5);
  const eta = win(t, cue(8) + 0.1, cue(9) - 0.2, 0.6, 0.5);
  const kwh = ramp(t, cue(9) + 0.3, cue(9) + 1.1);
  const sankIn = ramp(t, cue(7) + 0.2, cue(7) + 1.4);
  const sankSplit = ramp(t, cue(7) + 1.6, cue(7) + 3.0);
  const heatGlow = ramp(t, cue(7) + 2.0, cue(8) + 1.0);

  // Sankey: 2000 W → 1600 W berguna + 400 W panas (tebal sebanding)
  const SK = 0.05; // px per watt
  const wIn = 2000 * SK;
  const wUse = 1600 * SK;
  const wHeat = 400 * SK;
  const sx0 = 880;
  const sx1 = 1180;
  const sy = 560;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== bagian A ===== */}
        <g opacity={phaseA * stairsIn}>
          <Stairs x0={XW} />
          <Stairs x0={XR} />
          {/* meter Ug per tangga: tinggi batang = tinggi orang di atas lantai */}
          {[
            {x: XW + STEPS * RUN + 85, s: (FLOOR - pw.y) / (STEPS * RISE)},
            {x: XR + STEPS * RUN + 85, s: (FLOOR - pr.y) / (STEPS * RISE)},
          ].map((m, i) => (
            <g key={i}>
              <rect x={m.x} y={FLOOR - STEPS * RISE} width={26} height={STEPS * RISE} rx={6} fill={C.pot} opacity={0.12} />
              <rect x={m.x} y={FLOOR - STEPS * RISE * m.s} width={26} height={STEPS * RISE * m.s} rx={6} fill={C.pot} />
              <Label x={m.x + 13} y={FLOOR - STEPS * RISE - 30} size={28} font="serif" italic color={C.pot} weight={600}>
                U<tspan baselineShift="sub" fontSize="0.65em">g</tspan>
              </Label>
            </g>
          ))}
          <Person x={pw.x} y={pw.y} phase={pw.phase} scale={0.9} color={C.ink} />
          <Person x={pr.x} y={pr.y} phase={pr.phase * 1.2} scale={0.9} color={C.kin} arm={sR < 1 ? -34 * Math.sin(pr.phase * 1.2) : undefined} />
          <Label x={XW + 200} y={FLOOR + 40} size={28} color={C.ink} weight={600}>
            berjalan santai
          </Label>
          <Label x={XR + 200} y={FLOOR + 40} size={28} color={C.kin} weight={600}>
            berlari
          </Label>
          {/* stopwatch */}
          {[
            {x: XW + 40, v: sW * TW, done: ramp(t, t0 + TW, t0 + TW + 0.4), p: 200},
            {x: XR + 40, v: sR * TR, done: ramp(t, t0 + TR, t0 + TR + 0.4), p: 600},
          ].map((w, i) => (
            <g key={i} opacity={ramp(t, t0 - 0.6, t0)}>
              <circle cx={w.x} cy={290} r={44} fill="rgba(10,16,36,0.9)" stroke={interpolateColors(w.done, [0, 1], [C.muted, C.gold])} strokeWidth={4} />
              <line x1={w.x} y1={290} x2={w.x + 32 * Math.sin((w.v / 10) * 2 * Math.PI)} y2={290 - 32 * Math.cos((w.v / 10) * 2 * Math.PI)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
              <rect x={w.x - 8} y={236} width={16} height={10} rx={3} fill={C.muted} />
              <Label x={w.x + 64} y={290} size={34} font="mono" anchor="start" color={interpolateColors(w.done, [0, 1], [C.ink, C.gold])} weight={600}>
                {`Δt = ${fmt(w.v, 1)} s`}
              </Label>
              <Label x={w.x + 64} y={338} size={26} font="mono" anchor="start" color={C.work} weight={600} opacity={pTag}>
                {`P = ${w.p} W`}
              </Label>
            </g>
          ))}
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
        </g>

        {/* ===== bagian B ===== */}
        <g opacity={phaseB}>
          <Ground x1={160} x2={780} y={830} />
          {/* tiang & balok atas */}
          <rect x={170} y={190} width={20} height={640} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <rect x={170} y={176} width={480} height={22} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          {/* motor */}
          <Glow x={410} y={240} r={130} color="heat" opacity={heatGlow * 0.9} />
          <rect x={330} y={206} width={130} height={70} rx={10} fill="#16224a" stroke={C.work} strokeWidth={3} />
          <Label x={395} y={241} size={22} color={C.work} weight={600}>
            MOTOR
          </Label>
          <HeatShimmer x1={340} x2={450} y={206} t={t} amount={heatGlow} />
          <line x1={460} y1={241} x2={520} y2={241} stroke={C.muted} strokeWidth={6} />
          <g transform={`translate(550 241) rotate(${drumRot})`}>
            <circle r={32} fill="#0e1530" stroke={C.ink} strokeWidth={3} />
            <line x1={-26} y1={0} x2={26} y2={0} stroke={C.muted} strokeWidth={3} />
            <line x1={0} y1={-26} x2={0} y2={26} stroke={C.muted} strokeWidth={3} />
          </g>
          <line x1={582} y1={241} x2={582} y2={crateY - 104} stroke={C.ink} strokeWidth={3} />
          <path d={`M${582 - 28},${crateY - 100} L582,${crateY - 128} L${582 + 28},${crateY - 100}`} fill="none" stroke={C.ink} strokeWidth={3} />
          <Crate x={582} y={crateY} w={130} h={100} label="200 kg" color={C.pot} />
          {/* tinggi 12 m */}
          <g opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.4)}>
            <line x1={720} y1={830} x2={720} y2={410} stroke={C.pot} strokeWidth={3} strokeDasharray="8 8" />
            <line x1={705} y1={410} x2={735} y2={410} stroke={C.pot} strokeWidth={3} />
            <line x1={705} y1={830} x2={735} y2={830} stroke={C.pot} strokeWidth={3} />
            <Label x={745} y={610} size={30} color={C.pot} anchor="start" weight={600}>
              12 m
            </Label>
          </g>
          {/* jam simulasi */}
          <g opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.4)}>
            <Label x={250} y={880 - 10} size={28} font="mono" anchor="start" color={interpolateColors(lift, [0.95, 1], [C.ink, C.gold])} weight={600}>
              {`t = ${fmt(simT, 1)} s`}
            </Label>
          </g>

          {/* aliran energi */}
          <g opacity={sankIn}>
            <path d={band(sx0, sy, sx1, sy, wIn)} fill={C.work} opacity={0.85} />
            <Label x={sx0} y={sy - wIn / 2 - 30} size={28} anchor="start" color={C.work} weight={600}>
              daya masuk 2000 W
            </Label>
          </g>
          <g opacity={sankSplit}>
            <path d={band(sx1, sy - wIn / 2 + wUse / 2, 1740, sy - wIn / 2 + wUse / 2 - 20, wUse)} fill={C.pot} opacity={0.9} />
            <path d={band(sx1, sy + wIn / 2 - wHeat / 2, 1560, 790, wHeat)} fill={C.heat} opacity={0.9} />
            <Label x={1740} y={sy - wIn / 2 - 36} size={26} anchor="end" color={C.pot} weight={600}>
              berguna 1600 W → U<tspan baselineShift="sub" fontSize="0.65em">g</tspan> beban
            </Label>
            <Label x={1580} y={790} size={28} anchor="start" color={C.heat} weight={600}>
              400 W
            </Label>
            <Label x={1580} y={830} size={24} anchor="start" color={C.heat}>
              panas
            </Label>
          </g>
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
