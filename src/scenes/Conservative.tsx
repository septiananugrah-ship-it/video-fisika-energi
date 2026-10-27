import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Crate, EnergyBars, ELabel, Ground, fmt} from '../components/physics';
import {Arrow, DrawPath, Formula, Label, Note, Stage, Sub, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kotak 5 kg dipindah dari lantai ke rak setinggi 2 m lewat tiga jalan.
// Skala 180 px/m. Usaha gravitasi W_g = −m g Δy dihitung dari posisi kotak sesungguhnya.
const PXM = 180;
const FLOOR = 780;
const SHELF = 420;
const M = 5;
const G = 10;
const F_FRIC = 10; // N, gesekan contoh

type P = [number, number];
const sampler = (pts: P[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const at = (u: number): P => {
    const s = Math.max(0, Math.min(1, u)) * len;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const f = (s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return [mix(pts[i - 1][0], pts[i][0], f), mix(pts[i - 1][1], pts[i][1], f)];
  };
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return {at, len, d};
};

const STAIRS = sampler([
  [300, 780], [300, 708], [420, 708], [420, 636], [540, 636], [540, 564], [660, 564], [660, 492], [780, 492], [780, 420], [900, 420],
]);
const RAMP = sampler([
  [300, 780],
  [900, 420],
]);
const WAVY = sampler(
  Array.from({length: 161}, (_, i) => {
    const u = i / 160;
    return [300 + 600 * u, 780 - 360 * u - 110 * Math.sin(3 * Math.PI * u)] as P;
  }),
);
const PATHS = [
  {name: 'tangga', s: STAIRS, color: C.ink},
  {name: 'bidang miring', s: RAMP, color: C.cyan},
  {name: 'berkelok', s: WAVY, color: C.gold},
];

export const Conservative: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const draw = PATHS.map((_, i) => ramp(t, cue(0) + 1.2 + i * 1.3, cue(0) + 2.6 + i * 1.3, EASE_IN_OUT));
  const move = ramp(t, cue(1) + 0.2, cueEnd(1) - 0.5, EASE_IN_OUT);
  // fase panel kanan (silang-pudar, tanpa ambang)
  const phA = win(t, cue(1), cue(4) - 0.2, 0.6, 0.5);
  const phB = win(t, cue(4) + 0.1, cue(5) - 0.2, 0.6, 0.5);
  const phC = win(t, cue(5) + 0.2, cue(9) - 0.2, 0.6, 0.5);
  const phD = ramp(t, cue(9) + 0.2, cue(9) + 0.9);
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);

  // kotak jatuh dari rak (baris 7): jatuh bebas, waktu diperlambat
  const slide = ramp(t, cue(7) + 0.6, cue(7) + 1.3, EASE_IN_OUT);
  const fallP = ramp(t, cue(7) + 1.35, cue(7) + 3.4, (x) => x * x); // y ∝ τ²
  const fallOn = win(t, cue(7) + 0.6, cue(9) - 0.3, 0.4, 0.5);
  const drop = fallP * 2; // m
  const fallX = mix(1000, 1150, slide);
  const fallY = SHELF + drop * PXM;
  const Ufall = M * G * (2 - drop);
  const Kfall = M * G * drop;

  // acuan nol bergeser (baris 9)
  const ref = ramp(t, cue(9) + 1.5, cue(9) + 4.5, EASE_IN_OUT) * 2; // m
  const refY = FLOOR - ref * PXM;

  const boxes = PATHS.map((p) => p.s.at(move));
  const wg = boxes.map((b) => -M * G * ((FLOOR - b[1]) / PXM));
  const lens = PATHS.map((p) => p.s.len / PXM);

  const rowStyle = (i: number): React.CSSProperties => ({
    position: 'absolute',
    left: 1220,
    top: 300 + i * 120,
    width: 600,
    fontFamily: FONT.head,
    fontSize: 32,
    color: C.ink,
  });

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        <Ground x1={140} x2={1200} y={FLOOR} />
        {/* rak */}
        <rect x={900} y={SHELF} width={190} height={14} rx={4} fill="#22305a" stroke={C.muted} strokeWidth={2} />
        <line x1={915} y1={SHELF + 14} x2={915} y2={FLOOR} stroke={C.faint} strokeWidth={6} />
        <line x1={1075} y1={SHELF + 14} x2={1075} y2={FLOOR} stroke={C.faint} strokeWidth={6} />
        {/* ukuran tinggi */}
        <g opacity={ramp(t, cue(0) + 0.6, cue(0) + 1.4)}>
          <Arrow x1={160} y1={FLOOR - 6} x2={160} y2={SHELF + 4} color="pot" width={4} both />
          <Label x={186} y={(FLOOR + SHELF) / 2} size={30} font="serif" italic color={C.pot} anchor="start">
            h = 2 m
          </Label>
          <Label x={186} y={(FLOOR + SHELF) / 2 + 44} size={24} font="mono" color={C.muted} anchor="start">
            m = 5 kg
          </Label>
          <line x1={150} y1={SHELF} x2={900} y2={SHELF} stroke={C.pot} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 8" />
        </g>
        {PATHS.map((p, i) => (
          <DrawPath key={p.name} d={p.s.d} p={draw[i]} stroke={p.color} width={4} opacity={0.85 - 0.45 * phD} halo />
        ))}
        {/* acuan nol */}
        <g opacity={phD}>
          <line x1={140} y1={refY} x2={1120} y2={refY} stroke={C.work} strokeWidth={3} strokeDasharray="16 10" />
          <Label x={1110} y={refY - 24} size={26} color={C.work} anchor="end" weight={600}>
            y = 0 (acuan)
          </Label>
          <Crate x={300} y={FLOOR} w={64} h={52} label="awal" color={C.muted} opacity={0.7} />
        </g>
        {PATHS.map((p, i) => (
          <g key={p.name} opacity={ramp(t, cue(0) + 1.2 + i * 1.3, cue(0) + 2.2 + i * 1.3) * (1 - fallOn * (i === 1 ? 1 : 0))}>
            <rect x={boxes[i][0] - 27} y={boxes[i][1] - 44} width={54} height={44} rx={9} fill={p.color} fillOpacity={0.3} stroke={p.color} strokeWidth={3} />
          </g>
        ))}
        {/* kotak jatuh */}
        <g opacity={fallOn}>
          <line x1={1150} y1={SHELF} x2={1150} y2={FLOOR} stroke={C.pot} strokeOpacity={0.25 * slide} strokeWidth={2} strokeDasharray="4 8" />
          <Crate x={fallX} y={Math.min(FLOOR, fallY)} w={64} h={52} label="5 kg" color={C.cyan} />
          <Arrow x1={fallX + 60} y1={Math.min(FLOOR, fallY) - 60} x2={fallX + 60} y2={Math.min(FLOOR, fallY) + 10} color="force" width={4} opacity={1 - fallP} />
        </g>
        <EnergyBars
          x={1290}
          y={780}
          height={230}
          barW={70}
          gap={30}
          max={100}
          title="KOTAK YANG JATUH"
          opacity={phC * ramp(t, cue(7) + 0.4, cue(7) + 1.1)}
          bars={[
            {key: 'K', label: ELabel.K, value: Kfall, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ufall, color: 'pot'},
          ]}
        />
      </Stage>

      {/* Fase A: usaha gravitasi tiap jalan */}
      <div style={{opacity: phA}}>
        <div style={{position: 'absolute', left: 1220, top: 210, fontFamily: FONT.head, fontSize: 24, letterSpacing: 2.5, color: C.muted, fontWeight: 600}}>
          USAHA GRAVITASI <V>W</V>
          <Sub>g</Sub>
        </div>
        {PATHS.map((p, i) => (
          <div key={p.name} style={rowStyle(i)}>
            <span style={{display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: p.color, marginRight: 16, verticalAlign: 'middle'}} />
            <span style={{display: 'inline-block', width: 230}}>{p.name}</span>
            <span style={{fontFamily: FONT.mono, fontSize: 40, color: C.pot}}>{fmt(wg[i])} J</span>
          </div>
        ))}
      </div>
      {/* Fase B: gesekan bergantung panjang jalan */}
      <div style={{opacity: phB}}>
        <div style={{position: 'absolute', left: 1220, top: 210, fontFamily: FONT.head, fontSize: 24, letterSpacing: 2.5, color: C.heat, fontWeight: 600}}>
          USAHA GESEKAN (f = 10 N)
        </div>
        {PATHS.map((p, i) => (
          <div key={p.name} style={rowStyle(i)}>
            <span style={{display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: p.color, marginRight: 16, verticalAlign: 'middle'}} />
            <span style={{display: 'inline-block', width: 230}}>{p.name}</span>
            <span style={{fontFamily: FONT.mono, fontSize: 40, color: C.heat}}>{fmt(-F_FRIC * lens[i])} J</span>
            <div style={{marginLeft: 38, marginTop: 6, height: 10, width: lens[i] * 70, borderRadius: 5, background: C.heat, opacity: 0.8}} />
          </div>
        ))}
      </div>
      <Note x={1500} y={760} p={phA * ramp(t, cue(2) + 0.2, cue(2) + 0.9)} color={C.pot} size={28}>
        hanya bergantung pada <Tint c="pot">beda ketinggian</Tint>
      </Note>
      <div
        style={{
          position: 'absolute',
          left: 1520,
          top: 640,
          transform: 'translateX(-50%)',
          fontFamily: FONT.head,
          fontSize: 40,
          fontWeight: 700,
          color: C.work,
          opacity: phA * ramp(t, cue(3) + 0.2, cue(3) + 0.9),
          whiteSpace: 'nowrap',
        }}
      >
        gaya konservatif ✓
      </div>
      <div
        style={{
          position: 'absolute',
          left: 1520,
          top: 700,
          transform: 'translateX(-50%)',
          fontFamily: FONT.head,
          fontSize: 34,
          fontWeight: 700,
          color: C.heat,
          opacity: phB * ramp(t, cue(4) + 3.5, cue(4) + 4.6),
          whiteSpace: 'nowrap',
        }}
      >
        gesekan: bukan gaya konservatif
      </div>

      {/* Fase C: definisi energi potensial */}
      <Formula x={1480} y={290} p={phC * ramp(t, cue(6) + 0.2, cue(6) + 1.0)} accent={C.pot} size={62} caption="definisi energi potensial U">
        <V>W</V>
        <Sub>kons</Sub> = − Δ<V color="pot">U</V>
      </Formula>
      <Note x={1500} y={470} p={phC * ramp(t, cue(5) + 0.3, cue(5) + 1.0) * (1 - ramp(t, cue(6), cue(6) + 0.5))} color={C.pot} size={28}>
        hanya bergantung pada posisi
        <br />→ bisa dicatat sebagai <span style={{color: C.pot}}>energi tersimpan</span>
      </Note>
      <Note x={1480} y={430} p={phC * ramp(t, cue(7) + 1.0, cue(7) + 1.7)} color={C.work} size={28}>
        jatuh: <Tint c="work">W<sub>g</sub> &gt; 0</Tint> ⇒ <Tint c="pot">ΔU &lt; 0</Tint>
      </Note>
      <Note x={760} y={250} p={phC * ramp(t, cue(8) + 0.2, cue(8) + 0.9)} color={C.pot} size={30}>
        <Tint c="pot">U</Tint> = tabungan energi · dicairkan menjadi <Tint c="kin">K</Tint>
      </Note>

      {/* Fase D: acuan nol bebas dipilih */}
      <div style={{opacity: phD}}>
        <div style={{position: 'absolute', left: 1210, top: 250, fontFamily: FONT.head, fontSize: 24, letterSpacing: 2.5, color: C.work, fontWeight: 600}}>
          ACUAN NOL: {fmt(ref, 1)} m DI ATAS LANTAI
        </div>
        {[
          ['U awal', -M * G * ref],
          ['U akhir', M * G * (2 - ref)],
          ['ΔU', 100],
        ].map(([n, v], i) => (
          <div key={String(n)} style={{position: 'absolute', left: 1210, top: 320 + i * 90, fontFamily: FONT.head, fontSize: 36, color: i === 2 ? C.gold : C.ink, width: 560}}>
            <span style={{display: 'inline-block', width: 220, fontFamily: FONT.serif, fontStyle: 'italic'}}>{n}</span>
            <span style={{fontFamily: FONT.mono, fontSize: 44, color: i === 2 ? C.gold : C.pot}}>{fmt(Number(v))} J</span>
          </div>
        ))}
        <div style={{position: 'absolute', left: 1210, top: 600, fontFamily: FONT.head, fontSize: 30, color: C.muted, width: 600, whiteSpace: 'normal', lineHeight: 1.35}}>
          nilai <span style={{color: C.pot}}>U</span> ikut acuan, tetapi <span style={{color: C.gold}}>perubahannya tetap</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
