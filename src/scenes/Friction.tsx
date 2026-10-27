import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, rand, ramp, win} from '../anim';
import {Crate, EnergyBars, ELabel, Ground, HeatShimmer, fmt} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Note, Part, Stage, Sub, Sup, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Contoh 8 modul: balok 2 kg dilepas dari diam di bidang miring 30°, meluncur 5 m, μk = 0,2, g = 10.
// N = mg cos30° = 17,32 N, f = 3,464 N, a = g(sin30° − μ cos30°) = 3,268 m/s².
// Neraca: Ug = 50 − 10 s, E_th = 3,464 s, K = 6,536 s (s dalam m) → di bawah: 32,68 J + 17,32 J.
const PXM = 130;
const ANG = Math.PI / 6;
const A = {x: 230, y: 300};
const LEN = 6; // m lintasan yang digambar
const S0 = 0.6; // posisi awal balok di lintasan (m)
const B = {x: A.x + LEN * PXM * Math.cos(ANG), y: A.y + LEN * PXM * Math.sin(ANG)};
const ACC = 10 * (0.5 - 0.2 * Math.cos(ANG));
const onSlope = (s: number) => ({x: A.x + s * PXM * Math.cos(ANG), y: A.y + s * PXM * Math.sin(ANG)});

const Atoms: React.FC<{cx: number; cy: number; r: number; t: number; amp: number}> = ({cx, cy, r, t, amp}) => (
  <g>
    <defs>
      <clipPath id="atom-clip">
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill="#0b1229" stroke={C.heat} strokeOpacity={0.4 + 0.5 * amp} strokeWidth={4} />
    <g clipPath="url(#atom-clip)">
      {Array.from({length: 49}, (_, i) => {
        const gx = (i % 7) - 3;
        const gy = Math.floor(i / 7) - 3;
        const dx = amp * 16 * Math.sin(t * (9 + rand(i) * 5) + rand(i * 3) * 6);
        const dy = amp * 16 * Math.sin(t * (8 + rand(i * 7) * 6) + rand(i * 5) * 6);
        return <circle key={i} cx={cx + gx * 58 + dx} cy={cy + gy * 58 + dy} r={17} fill={C.heat} opacity={0.35 + 0.55 * Math.min(1, amp + 0.2)} />;
      })}
    </g>
  </g>
);

export const Friction: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);
  const ph0 = 1 - ramp(t, cue(1) - 0.3, cue(1) + 0.3, EASE_IN_OUT);
  const phA = win(t, cue(1) - 0.1, cue(3) - 0.2, 0.6, 0.5);
  const phB = win(t, cue(3) + 0.1, cue(5) - 0.2, 0.6, 0.5);
  const phC = ramp(t, cue(5) + 0.1, cue(5) + 0.8);

  // ---------- baris 0: balok melambat lalu berhenti di lantai kasar ----------
  const p0 = ramp(t, cue(0) + 0.4, cue(0) + 3.4, (x) => x);
  const s0 = 1 - (1 - p0) * (1 - p0); // perlambatan tetap: s ∝ 1 − (1 − τ)²
  const K0 = 100 * (1 - p0) * (1 - p0);
  const bx0 = mix(260, 860, s0);

  // ---------- baris 1–2: tangan digosok, atom bergetar ----------
  const rub = ramp(t, cue(1) + 0.3, cue(1) + 1.0);
  const warm = ramp(t, cue(1) + 0.5, cue(2) + 2.5, (x) => x);
  const handY = 28 * Math.sin(t * 9) * rub;

  // ---------- baris 5–10: bidang miring ----------
  const slideP = ramp(t, cue(8) + 0.3, cueEnd(8) - 0.1, (x) => x);
  const tau = Math.sqrt(10 / ACC) * slideP;
  const s = 0.5 * ACC * tau * tau; // m
  const v = ACC * tau;
  const Ug = 50 - 10 * s;
  const Th = 2 * 10 * Math.cos(ANG) * 0.2 * s;
  const Kc = Math.max(0, 50 - Ug - Th);
  const blk = onSlope(S0 + s);
  const forces = win(t, cue(7) + 0.2, cue(8) + 0.4, 0.6, 0.5);
  const n6 = win(t, cue(6) + 0.3, cue(7), 0.6, 0.5);
  const n7 = win(t, cue(7) + 0.3, cue(8) + 0.2, 0.6, 0.5);
  const n8 = win(t, cueEnd(8) - 0.4, cue(10), 0.6, 0.5);
  const f9 = ramp(t, cue(9) + 0.3, cue(9) + 1.1);
  const n10 = ramp(t, cue(10) + 0.3, cue(10) + 1.0);
  const hDim = ramp(t, cue(6), cue(6) + 0.6);
  const bottom = onSlope(S0 + 5);
  const top = onSlope(S0);
  const ux = Math.cos(ANG);
  const uy = Math.sin(ANG);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        {/* ---------- baris 0 ---------- */}
        <g opacity={ph0}>
          <Ground x1={160} x2={1040} y={600} rough heat={0.8 * s0} />
          <HeatShimmer x1={260} x2={bx0} y={600} t={t} amount={s0} />
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
          <Label x={1500} y={480} size={120} color={C.gold} weight={700} opacity={ramp(t, cue(0) + 3.0, cue(0) + 3.8)}>
            ?
          </Label>
        </g>

        {/* ---------- baris 1–2 ---------- */}
        <g opacity={phA}>
          <Glow x={600} y={470} r={340} color="heat" opacity={0.25 + 0.75 * warm} />
          {/* dua telapak tangan */}
          <g transform={`translate(0 ${-handY})`}>
            <rect x={420} y={280} width={170} height={330} rx={80} fill="#1b2650" stroke={C.muted} strokeWidth={4} />
          </g>
          <g transform={`translate(0 ${handY})`}>
            <rect x={600} y={280} width={170} height={330} rx={80} fill="#1b2650" stroke={C.muted} strokeWidth={4} />
          </g>
          <rect x={588} y={300} width={14} height={290} rx={7} fill={C.heat} opacity={0.3 + 0.7 * warm} />
          <HeatShimmer x1={470} x2={730} y={270} t={t} amount={warm} />
          <Label x={595} y={680} size={30} color={C.heat} weight={600} opacity={warm}>
            terasa hangat
          </Label>
          {/* perbesaran: atom kulit */}
          <g opacity={ramp(t, cue(2) + 0.2, cue(2) + 1.0)}>
            <line x1={700} y1={440} x2={1130} y2={440} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
            <Atoms cx={1340} cy={470} r={220} t={t} amp={ramp(t, cue(2) + 1.0, cue(2) + 4.0, (x) => x)} />
            <Label x={1340} y={740} size={26} color={C.muted}>
              perbesaran: atom permukaan kulit
            </Label>
          </g>
        </g>

        {/* ---------- baris 5–10 ---------- */}
        <g opacity={phC}>
          <path d={`M${A.x},${A.y} L${B.x},${B.y} L${A.x},${B.y} Z`} fill="#122047" stroke={C.muted} strokeWidth={3} />
          <Ground x1={130} x2={990} y={B.y} />
          {/* jejak panas di permukaan */}
          <line x1={top.x} y1={top.y} x2={blk.x} y2={blk.y} stroke={C.heat} strokeWidth={6} strokeLinecap="round" opacity={0.75 * slideP} />
          <g transform={`translate(${top.x} ${top.y}) rotate(30)`}>
            <HeatShimmer x1={0} x2={s * PXM} y={0} t={t} amount={slideP * (1 - ramp(t, cue(10), cue(10) + 2))} />
          </g>
          <path d={`M${B.x - 90},${B.y} A90,90 0 0 1 ${B.x - 90 * Math.cos(ANG)},${B.y - 90 * Math.sin(ANG)}`} fill="none" stroke={C.gold} strokeWidth={3} />
          <Label x={B.x - 130} y={B.y - 26} size={26} color={C.gold} font="mono">
            30°
          </Label>
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
          <Crate x={blk.x} y={blk.y} w={92} h={70} label="2 kg" color={C.kin} rot={30} />
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
        <EnergyBars
          x={1080}
          y={650}
          height={260}
          barW={70}
          gap={30}
          max={50}
          title="NERACA ENERGI (J)"
          unit=""
          opacity={phC * ramp(t, cue(6) + 0.2, cue(6) + 0.9)}
          bars={[
            {key: 'K', label: ELabel.K, value: Kc, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ug, color: 'pot'},
            {key: 'Th', label: ELabel.Th, value: Th, color: 'heat'},
          ]}
        />
      </Stage>

      {/* master equation */}
      <Formula x={960} y={460} p={phB} accent={C.work} size={66} caption={<Part p={ramp(t, cue(4) + 0.3, cue(4) + 1.0)}>neraca energi paling serbaguna</Part>}>
        <V color="kin">K</V>
        <Sub>i</Sub> + <V color="pot">U</V>
        <Sub>i</Sub>
        <Part p={ramp(t, wordOf(3, 'usaha') - 0.2, wordOf(3, 'usaha') + 0.5)} color="work">
          {' '}+ <V>W</V>
          <Sub>lain</Sub>
        </Part>{' '}
        = <V color="kin">K</V>
        <Sub>f</Sub> + <V color="pot">U</V>
        <Sub>f</Sub>
      </Formula>
      <Note x={960} y={680} p={phB * ramp(t, wordOf(3, 'gesekan') - 0.2, wordOf(3, 'gesekan') + 0.6)} color={C.work} size={28}>
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
      <Note x={1280} y={800} p={phC * n8} color={C.heat} size={30}>
        <Tint c="heat">
          <V>E</V>
          <sub>th</sub> = <V>f</V> · <V>s</V> ≈ 17,3 J
        </Tint>
      </Note>
      <Formula x={540} y={800} p={phC * f9} accent={C.kin} size={56}>
        <Frac n={<>1</>} d={<>2</>} />
        <V>m</V> <V color="kin">v</V>
        <Sup>2</Sup> = 32,7 J ⇒ <V color="kin">v</V> ≈ 5,7 m/s
      </Formula>
      <div
        style={{
          position: 'absolute',
          left: 1280,
          top: 170,
          transform: 'translateX(-50%)',
          fontFamily: FONT.head,
          fontSize: 34,
          fontWeight: 700,
          color: C.gold,
          whiteSpace: 'nowrap',
          opacity: phC * n10,
        }}
      >
        50 J = <span style={{color: C.kin}}>32,7 J</span> + <span style={{color: C.heat}}>17,3 J</span>
      </div>
    </AbsoluteFill>
  );
};
