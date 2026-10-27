import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, rand, ramp, win} from '../anim';
import {Crate, EnergyBars, ELabel, Ground, fmt} from '../components/physics';
import {Arrow, DrawPath, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

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
  return {at, len, d, pts};
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
const PATHS: {name: string; s: ReturnType<typeof sampler>; color: string; hue: Hue}[] = [
  {name: 'tangga', s: STAIRS, color: C.ink, hue: 'ink'},
  {name: 'bidang miring', s: RAMP, color: C.cyan, hue: 'cyan'},
  {name: 'berkelok', s: WAVY, color: C.gold, hue: 'gold'},
];

/** Titik-titik busur kuadratik dari a ke b (untuk aliran energi). */
const arc = (a: P, b: P, lift: number, n = 16): P[] => {
  const c: P = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const m = 1 - s;
    return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1]];
  });
};

/** Kotak kecil berwarna jalur (x, y = tengah alas). */
const Box: React.FC<{x: number; y: number; color: string; op?: number}> = ({x, y, color, op = 1}) =>
  op <= 0.001 ? null : (
    <g opacity={op}>
      <rect x={x - 27} y={y - 44} width={54} height={44} rx={9} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={3} />
      <rect x={x - 21} y={y - 39} width={42} height={6} rx={3} fill="#fff" opacity={0.18} />
    </g>
  );

/** Brankas "tabungan U": jendela berisi cairan biru + kenop yang berputar. */
const Vault: React.FC<{x: number; y: number; fill: number; op: number; t: number}> = ({x, y, fill, op, t}) => {
  if (op <= 0.001) return null;
  const wx = x - 100;
  const wy = y - 62;
  const ww = 120;
  const wh = 124;
  const lvl = wy + wh - wh * fill;
  const wave = Array.from({length: 9}, (_, k) => {
    const xx = wx + (ww * k) / 8;
    const yy = lvl + 3 * Math.sin(t * 3 + k * 0.9) * Math.min(1, fill * 8);
    return `${k ? 'L' : 'M'}${xx.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
  return (
    <g opacity={op}>
      <Glow x={x} y={y} r={220} color="pot" opacity={0.35 + 0.5 * fill} />
      <rect x={x - 124} y={y - 92} width={248} height={184} rx={20} fill="#111a3c" stroke={C.pot} strokeWidth={3} />
      <rect x={x - 112} y={y - 80} width={224} height={160} rx={14} fill="none" stroke={C.pot} strokeOpacity={0.35} strokeWidth={2} />
      {/* jendela */}
      <defs>
        <clipPath id="cons-vault-win">
          <rect x={wx} y={wy} width={ww} height={wh} rx={10} />
        </clipPath>
      </defs>
      <rect x={wx} y={wy} width={ww} height={wh} rx={10} fill="#070b18" />
      <g clipPath="url(#cons-vault-win)">
        <path d={`${wave} L${wx + ww},${wy + wh} L${wx},${wy + wh} Z`} fill={C.pot} opacity={0.85} />
        <path d={wave} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={2} />
        {Array.from({length: 4}, (_, k) => {
          const ph = (((t * (0.25 + 0.06 * k) + k * 0.29) % 1) + 1) % 1;
          return <circle key={k} cx={wx + 20 + k * 27 + 4 * Math.sin(t * 2 + k)} cy={wy + wh - ph * wh * fill} r={2.5} fill="#fff" opacity={0.4 * cyc(ph) * Math.min(1, fill * 4)} />;
        })}
      </g>
      <rect x={wx} y={wy} width={ww} height={wh} rx={10} fill="none" stroke={C.muted} strokeWidth={2} />
      <text x={wx + ww / 2} y={wy + wh / 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={28} fill={C.ink}>
        {`${fmt(100 * fill)} J`}
      </text>
      {/* kenop */}
      <g transform={`translate(${x + 66} ${y}) rotate(${t * 40})`}>
        <circle r={34} fill="#1a2550" stroke={C.pot} strokeWidth={3} />
        {Array.from({length: 12}, (_, k) => (
          <line key={k} x1={0} y1={-30} x2={0} y2={k % 3 ? -25 : -20} stroke={C.muted} strokeWidth={2} transform={`rotate(${k * 30})`} />
        ))}
        <circle r={8} fill={C.pot} />
        <line x1={0} y1={0} x2={0} y2={-18} stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
      </g>
      {[-60, 60].map((dy) => (
        <rect key={dy} x={x + 112} y={y + dy - 12} width={14} height={24} rx={4} fill={C.faint} />
      ))}
      <Label x={x} y={y - 120} size={24} color={C.pot} weight={600} spacing={2}>
        TABUNGAN U
      </Label>
    </g>
  );
};

export const Conservative: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const draw = PATHS.map((_, i) => ramp(t, cue(0) + 1.2 + i * 1.3, cue(0) + 2.6 + i * 1.3, EASE_IN_OUT));
  const move = ramp(t, cue(1) + 0.2, cueEnd(1) - 0.5, EASE_IN_OUT);
  const moving = Math.sin(Math.PI * move);
  // fase panel kanan (silang-pudar, tanpa ambang)
  const phA = win(t, cue(1), cue(4) - 0.2, 0.6, 0.5);
  const phB = win(t, cue(4) + 0.1, cue(5) - 0.2, 0.6, 0.5);
  const phC = win(t, cue(5) + 0.2, cue(9) - 0.2, 0.6, 0.5);
  const phD = ramp(t, cue(9) + 0.2, cue(9) + 0.9);
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);

  // kamera: dorong pelan ke tiga jalan selama perbandingan (baris 1–4)
  const zoom = ramp(t, cue(1) - 0.5, cue(1) + 1.5, EASE_IN_OUT) * (1 - ramp(t, cue(4) + 4.5, cue(4) + 6.5, EASE_IN_OUT));
  const zs = 1 + 0.05 * zoom;
  const ZC: P = [620, 600];
  const zp = (p: P): P => [ZC[0] + (p[0] - ZC[0]) * zs, ZC[1] + (p[1] - ZC[1]) * zs];

  // kotak jatuh dari rak (baris 7): jatuh bebas, waktu diperlambat
  const slide = ramp(t, cue(7) + 0.6, cue(7) + 1.3, EASE_IN_OUT);
  const fallAt = (tt: number) => ramp(tt, cue(7) + 1.35, cue(7) + 3.4, (x) => x * x); // y ∝ τ²
  const fallP = fallAt(t);
  const fallOn = win(t, cue(7) + 0.6, cue(9) - 0.3, 0.4, 0.5);
  const drop = fallP * 2; // m
  const fallX = mix(1000, 1150, slide);
  const fallY = SHELF + drop * PXM;
  const Ufall = M * G * (2 - drop);
  const Kfall = M * G * drop;
  const landT = cue(7) + 3.4;

  // acuan nol bergeser (baris 9)
  const ref = ramp(t, cue(9) + 1.5, cue(9) + 4.5, EASE_IN_OUT) * 2; // m
  const refY = FLOOR - ref * PXM;

  const boxes = PATHS.map((p) => p.s.at(move));
  const wg = boxes.map((b) => -M * G * ((FLOOR - b[1]) / PXM));
  const lens = PATHS.map((p) => p.s.len / PXM);

  // percikan yang berlomba di tiga jalan: tiba bersamaan (baris 2–3)
  const race = win(t, cue(2) + 0.2, cue(4) - 0.3, 0.6, 0.6);
  const rph = ((((t - cue(2)) / 3.0) % 1) + 1) % 1;
  const ru = Math.min(1, rph / 0.7);
  const rOp = Math.min(1, rph * 8) * (1 - ramp(rph, 0.7, 0.85));

  // brankas tabungan U (baris 5–6)
  const vaultOp = win(t, cue(5) + 0.6, cue(7) + 0.3, 0.7, 0.6);
  const vfill = ramp(t, cue(5) + 1.2, cue(5) + 5.5, EASE_IN_OUT);
  const tab = win(t, cue(8) + 0.2, cue(9) + 0.4, 0.6, 0.6);

  // batang energi kotak jatuh
  const barsOp = phC * ramp(t, cue(7) + 0.4, cue(7) + 1.1);
  const topK = 780 - (Kfall / 100) * 230;
  const topU = 780 - (Ufall / 100) * 230;

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
        <Motes x={620} y={600} rx={520} ry={240} n={24} color="pot" opacity={0.35} seed={3} />
        <g transform={`translate(${ZC[0]} ${ZC[1]}) scale(${zs}) translate(${-ZC[0]} ${-ZC[1]})`}>
          <Ground x1={140} x2={1200} y={FLOOR} />
          {/* rak */}
          <line x1={915} y1={SHELF + 14} x2={915} y2={FLOOR} stroke={C.faint} strokeWidth={6} />
          <line x1={1075} y1={SHELF + 14} x2={1075} y2={FLOOR} stroke={C.faint} strokeWidth={6} />
          <path d={`M915,${SHELF + 70} L975,${SHELF + 14} M1075,${SHELF + 70} L1015,${SHELF + 14}`} stroke={C.faint} strokeWidth={4} />
          <rect x={900} y={SHELF} width={190} height={14} rx={4} fill="#22305a" stroke={C.muted} strokeWidth={2} />
          <rect x={904} y={SHELF + 2} width={182} height={3} rx={1.5} fill="#fff" opacity={0.15} />
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
            <g key={p.name}>
              <DrawPath d={p.s.d} p={draw[i]} stroke={p.color} width={4} opacity={0.85 - 0.45 * phD} halo />
              {/* ujung pena saat jalur digambar */}
              <Spark x={p.s.at(draw[i])[0]} y={p.s.at(draw[i])[1]} r={6} color={p.hue} opacity={Math.sin(Math.PI * draw[i])} />
              {/* jejak menyala di belakang kotak */}
              <DrawPath d={p.s.d} p={move} stroke={p.color} width={7} opacity={0.9 * ramp(t, cue(1) + 0.2, cue(1) + 0.8) * (1 - ramp(t, cue(2) + 1, cue(2) + 3))} halo />
            </g>
          ))}
          {/* gesekan: panas muncul di sepanjang jalan, makin panjang makin banyak */}
          {phB > 0.001
            ? PATHS.map((p, i) => {
                const n = Math.round(lens[i] * 2.4);
                return Array.from({length: n}, (_, k) => {
                  const [x, y] = p.s.at((k + 0.5) / n);
                  const ph = (t * 0.7 + rand(k * 3.1 + i * 17)) % 1;
                  const yy = y - 10 - ph * 50;
                  const xx = x + 6 * Math.sin(t * 2 + k);
                  return (
                    <path
                      key={`${i}-${k}`}
                      d={`M${xx},${yy + 14} q6,-7 0,-14 q-6,-7 0,-14`}
                      fill="none"
                      stroke={C.heat}
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={cyc(ph) * phB * 0.9}
                    />
                  );
                });
              })
            : null}
          {/* acuan nol */}
          <g opacity={phD}>
            <line x1={140} y1={refY} x2={1120} y2={refY} stroke={C.work} strokeOpacity={0.14} strokeWidth={18} />
            <line x1={140} y1={refY} x2={1120} y2={refY} stroke={C.work} strokeWidth={3} strokeDasharray="16 10" strokeDashoffset={-t * 18} />
            <Label x={1110} y={refY - 24} size={26} color={C.work} anchor="end" weight={600}>
              y = 0 (acuan)
            </Label>
            <Crate x={300} y={FLOOR} w={64} h={52} label="awal" color={C.muted} opacity={0.7} />
            <Ripple x={620} y={refY} p={ramp(t, cue(9) + 4.4, cue(9) + 5.8)} r={150} color="work" />
          </g>
          {/* tabungan: energi tersimpan di kotak yang ada di rak */}
          <Glow x={900} y={398} r={120} color="pot" opacity={tab} />
          <Motes x={900} y={392} rx={90} ry={46} n={14} color="pot" opacity={tab * 0.8} seed={8} />
          {PATHS.map((p, i) => {
            const trail = Array.from({length: 6}, (_, k) => p.s.at(move - (k + 1) * 0.014) as [number, number]).map(([x, y]) => [x, y - 22] as [number, number]);
            return (
              <g key={p.name} opacity={ramp(t, cue(0) + 1.2 + i * 1.3, cue(0) + 2.2 + i * 1.3) * (1 - fallOn * (i === 1 ? 1 : 0))}>
                <Spark x={boxes[i][0]} y={boxes[i][1] - 22} r={5} color={p.hue} opacity={moving} trail={trail} />
                <Box x={boxes[i][0]} y={boxes[i][1]} color={p.color} />
                <Spark x={p.s.at(ru)[0]} y={p.s.at(ru)[1]} r={6} color={p.hue} opacity={race * rOp} />
              </g>
            );
          })}
          <g opacity={race}>
            <Ripple x={900} y={410} p={Math.max(0, (rph - 0.7) / 0.3)} r={90} color="pot" rings={2} />
          </g>
        </g>

        {/* usaha gravitasi tiap jalan mengalir ke penghitung */}
        {PATHS.map((p, i) => (
          <Stream key={p.name} pts={arc(zp([boxes[i][0], boxes[i][1] - 30]), [1205, 322 + i * 120], 60)} color="pot" n={7} speed={0.7} opacity={moving * phA} seed={i} />
        ))}

        {/* kotak jatuh */}
        <g opacity={fallOn}>
          <line x1={1150} y1={SHELF} x2={1150} y2={FLOOR} stroke={C.pot} strokeOpacity={0.25 * slide} strokeWidth={2} strokeDasharray="4 8" />
          {[3, 2, 1].map((k) => {
            const fk = fallAt(t - k * 0.13);
            return (
              <Crate key={k} x={fallX} y={Math.min(FLOOR, SHELF + fk * 2 * PXM)} w={64} h={52} color={C.cyan} opacity={(0.22 / k) * Math.sin(Math.PI * Math.min(1, fallP)) * ramp(fallP - fk, 0.02, 0.08)} />
            );
          })}
          <ellipse cx={1150} cy={FLOOR + 3} rx={40 * (0.4 + 0.6 * fallP)} ry={6} fill="#000" opacity={0.25 + 0.3 * fallP} />
          <Crate x={fallX} y={Math.min(FLOOR, fallY)} w={64} h={52} label="5 kg" color={C.cyan} />
          <Arrow x1={fallX + 60} y1={Math.min(FLOOR, fallY) - 60} x2={fallX + 60} y2={Math.min(FLOOR, fallY) + 10} color="force" width={4} opacity={1 - fallP} />
          <Ripple x={1150} y={FLOOR} p={ramp(t, landT, landT + 1.3)} r={130} color="kin" />
          {[-1, 1].map((sgn) =>
            [0, 1].map((k) => {
              const a = ramp(t, landT, landT + 1.4 + k * 0.3);
              return a > 0 && a < 1 ? <circle key={`${sgn}${k}`} cx={1150 + sgn * (30 + 60 * a + k * 18)} cy={FLOOR - 8 - 22 * a - k * 10} r={6 + 12 * a} fill={C.muted} opacity={0.3 * (1 - a)} /> : null;
            }),
          )}
        </g>
        {/* Ug → K selama jatuh */}
        <Stream pts={arc([1402, topU + 6], [1348, topK + 6], 24, 12)} color="pot" n={5} speed={0.9} r={4} opacity={barsOp * win(t, cue(7) + 1.35, landT, 0.2, 0.3)} />
        <EnergyBars
          x={1290}
          y={780}
          height={230}
          barW={70}
          gap={30}
          max={100}
          title="KOTAK YANG JATUH"
          opacity={barsOp}
          bars={[
            {key: 'K', label: ELabel.K, value: Kfall, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ufall, color: 'pot'},
          ]}
        />

        {/* tabungan U menerima energi dari kotak yang naik ke rak */}
        <Stream pts={arc([935, 395], [1390, 690], 70)} color="pot" n={9} speed={0.55} opacity={vaultOp * win(t, cue(5) + 1.0, cue(6) + 0.5, 0.5, 0.8)} seed={5} />
        <Vault x={1510} y={700} fill={vfill} op={vaultOp} t={t} />
      </Stage>

      {/* Fase A: usaha gravitasi tiap jalan */}
      <div style={{opacity: phA}}>
        <div style={{position: 'absolute', left: 1220, top: 210, fontFamily: FONT.head, fontSize: 24, letterSpacing: 2.5, color: C.muted, fontWeight: 600}}>
          USAHA GRAVITASI <V>W</V>
          <Sub>g</Sub>
        </div>
        {PATHS.map((p, i) => (
          <div key={p.name} style={rowStyle(i)}>
            <span style={{display: 'inline-block', width: 22, height: 22, borderRadius: 6, background: p.color, marginRight: 16, verticalAlign: 'middle', boxShadow: `0 0 ${8 + 10 * moving}px ${p.color}`}} />
            <span style={{display: 'inline-block', width: 230}}>{p.name}</span>
            <span style={{fontFamily: FONT.mono, fontSize: 40, color: C.pot, textShadow: `0 0 ${14 * moving}px ${C.pot}`}}>{fmt(wg[i])} J</span>
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
            <div
              style={{
                marginLeft: 38,
                marginTop: 6,
                height: 10,
                width: lens[i] * 70 * ramp(t, cue(4) + 0.6 + i * 0.35, cue(4) + 1.8 + i * 0.35, EASE_IN_OUT),
                borderRadius: 5,
                background: C.heat,
                opacity: 0.85,
                boxShadow: `0 0 12px ${C.heat}`,
              }}
            />
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
          transform: `translateX(-50%) scale(${1 + 0.03 * Math.sin(t * 3)})`,
          fontFamily: FONT.head,
          fontSize: 40,
          fontWeight: 700,
          color: C.work,
          textShadow: `0 0 18px ${C.work}66`,
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
          textShadow: `0 0 18px ${C.heat}55`,
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
            <span style={{fontFamily: FONT.mono, fontSize: 44, color: i === 2 ? C.gold : C.pot, textShadow: i === 2 ? `0 0 ${10 + 6 * Math.sin(t * 3)}px ${C.gold}88` : undefined}}>
              {fmt(Number(v))} J
            </span>
          </div>
        ))}
        <div style={{position: 'absolute', left: 1210, top: 600, fontFamily: FONT.head, fontSize: 30, color: C.muted, width: 620, whiteSpace: 'nowrap', lineHeight: 1.4}}>
          nilai <span style={{color: C.pot}}>U</span> ikut acuan,
          <br />
          tetapi <span style={{color: C.gold}}>perubahannya tetap</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
