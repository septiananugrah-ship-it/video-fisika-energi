import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, smoothPath, win} from '../anim';
import {Crate, HeatShimmer, Spring} from '../components/physics';
import {DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT, type Hue} from '../theme';

const PARTS = [
  {n: '1', title: 'Konsep & cara berpikir', color: C.cyan, hue: 'cyan' as Hue, items: ['Usaha & luas grafik', 'Energi kinetik', 'Energi potensial & pegas', 'Kekekalan · gesekan', 'Daya · strategi soal']},
  {n: '2', title: 'Energi dalam kimia', color: C.spr, hue: 'spr' as Hue, items: ['Ikatan sebagai pegas', 'Panas = gerak molekul', 'Bukit energi reaksi']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['PLTA', 'Rem & mobil listrik', 'Listrik rumah & tubuh']},
];
const CX = [380, 960, 1540];
const TOP = 230;
const CW = 500;
const CH = 560;
const PY = TOP + CH + 42; // garis perjalanan

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
// sampel lintasan halus untuk butir yang merambat
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 11 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
// fraksi lintasan tempat tiap bagian berada
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

/** Ikon tiap bagian, digambar SVG dan terus bergerak. */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // pegas–balok berosilasi: energi berpindah antara pegas (ungu) dan gerak (jingga)
    const w = 2.2;
    const s = 30 * Math.sin(t * w);
    const v = Math.cos(t * w); // kecepatan relatif
    const bx = x + 55 + s;
    const us = (s / 30) ** 2;
    return (
      <g>
        <ellipse cx={bx} cy={y + 44} rx={52} ry={6} fill="#000" opacity={0.35} />
        <line x1={x - 150} y1={y + 40} x2={x + 150} y2={y + 40} stroke={C.muted} strokeWidth={3} />
        {Array.from({length: 9}, (_, k) => (
          <line key={k} x1={x - 140 + k * 34} y1={y + 42} x2={x - 152 + k * 34} y2={y + 56} stroke={C.faint} strokeWidth={2} />
        ))}
        <rect x={x - 156} y={y - 30} width={10} height={70} fill={C.muted} />
        <Glow x={(x - 146 + bx - 45) / 2} y={y + 5} r={70} color="spr" opacity={0.6 * us * act} still />
        <Spring xa={x - 146} xb={bx - 45} y={y + 5} coils={8} amp={16} width={4} />
        {[-14, 0, 14].map((o) => (
          <line key={o} x1={bx - Math.sign(v) * 52} y1={y + 5 + o} x2={bx - Math.sign(v) * (52 + 34 * Math.abs(v))} y2={y + 5 + o} stroke={C.kin} strokeOpacity={0.55 * v * v} strokeWidth={3} strokeLinecap="round" />
        ))}
        <Glow x={bx} y={y + 5} r={70} color="kin" opacity={0.55 * v * v * act} still />
        <Crate x={bx} y={y + 40} w={90} h={70} color={C.kin} />
      </g>
    );
  }
  if (i === 1) {
    // HCl bergetar (ikatan = pegas) + molekul kecil yang bergoyang termal
    const d = 110 + 12 * Math.sin(t * 5);
    const rot = 8 * Math.sin(t * 0.7);
    return (
      <g>
        <Glow x={x} y={y} r={110} color="spr" opacity={0.35 + 0.25 * act} />
        {Array.from({length: 6}, (_, k) => {
          const a = k * 1.05 + t * 0.4;
          const mx = x + 150 * Math.cos(a) + 6 * Math.sin(t * 9 + k * 2);
          const my = y + 62 * Math.sin(a) + 6 * Math.cos(t * 8 + k);
          return <circle key={k} cx={mx} cy={my} r={6} fill={C.heat} opacity={0.5} />;
        })}
        <g transform={`rotate(${rot} ${x} ${y})`}>
          <Spring xa={x - d / 2} xb={x + d / 2} y={y} coils={6} amp={12} width={4} />
          <circle cx={x - d / 2} cy={y} r={30} fill={ATOM.H.fill} stroke={C.ink} strokeWidth={2} />
          <circle cx={x - d / 2 - 9} cy={y - 10} r={8} fill="#fff" opacity={0.6} />
          <circle cx={x + d / 2} cy={y} r={42} fill={ATOM.Cl.fill} stroke={C.ink} strokeWidth={2} />
          <circle cx={x + d / 2 - 13} cy={y - 14} r={11} fill="#fff" opacity={0.35} />
          <text x={x - d / 2} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={24} fill="#111">
            H
          </text>
          <text x={x + d / 2} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#111">
            Cl
          </text>
        </g>
        <HeatShimmer x1={x - 120} x2={x + 120} y={y + 80} t={t} amount={0.5} />
      </g>
    );
  }
  // PLTA mini: air mengalir di pipa → turbin berputar → kabel → lampu menyala
  const rot = t * 140;
  const pipe: [number, number][] = [
    [x - 160, y - 54],
    [x - 80, y - 54],
    [x - 62, y - 44],
    [x - 34, y - 8],
    [x + 6, y + 14],
  ];
  const cable: [number, number][] = [
    [x + 54, y + 20],
    [x + 96, y + 20],
    [x + 120, y - 6],
    [x + 140, y - 6],
  ];
  const lamp = 0.75 + 0.25 * Math.sin(t * 6) * Math.sin(t * 2.3);
  return (
    <g>
      <path d={`M${x - 160},${y - 54} h80 q14,0 22,14 l30,48`} fill="none" stroke={C.pot} strokeOpacity={0.35} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${x - 160},${y - 54} h80 q14,0 22,14 l30,48`} fill="none" stroke={C.pot} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <Stream pts={pipe} color="pot" n={6} speed={0.9} r={3.5} jitter={1.5} />
      <circle cx={x + 30} cy={y + 20} r={52} fill="none" stroke={C.line} strokeWidth={2} />
      <g transform={`translate(${x + 30} ${y + 20}) rotate(${rot})`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M0,0 L44,-10 Q50,0 44,10 Z" fill={C.work} opacity={0.85} transform={`rotate(${a})`} />
        ))}
        <circle r={10} fill={C.ink} />
      </g>
      <path d={`M${x + 54},${y + 20} h42 l24,-26 h20`} fill="none" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
      <Stream pts={cable} color="gold" n={4} speed={1.2} r={3} jitter={1} />
      {/* bola lampu */}
      <circle cx={x + 158} cy={y - 14} r={60} fill="url(#soft-gold)" opacity={lamp * (0.6 + 0.4 * act)} />
      <circle cx={x + 158} cy={y - 14} r={17} fill="#fff1c2" stroke={C.gold} strokeWidth={3} opacity={0.6 + 0.4 * lamp} />
      <rect x={x + 150} y={y + 2} width={16} height={12} rx={2} fill={C.muted} />
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  // bagian yang sedang dibacakan disorot
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  // lintasan tergambar bertahap sampai bagian yang sudah muncul (jumlah ramp berurutan → kontinu)
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  // butir perintis: meluncur di ujung lintasan yang sedang tergambar
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  // setelah lengkap: butir terus merambat bolak-balik di seluruh lintasan
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 112, textAlign: 'center', fontFamily: FONT.head, fontSize: 52, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan energi
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={40} color="gold" opacity={0.4} seed={11} />
        {/* bayangan kartu (garis putus berjalan) sebelum kartu muncul */}
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        {/* garis perjalanan yang menghubungkan ketiga bagian */}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="gold" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="gold" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="gold" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={22 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={12} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => (
        <div
          key={p.n}
          style={{
            position: 'absolute',
            left: CX[i] - CW / 2,
            top: TOP,
            width: CW,
            height: CH,
            borderRadius: 24,
            background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
            border: `1.5px solid ${p.color}55`,
            borderTop: `8px solid ${p.color}`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16)}`,
            opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * Math.min(1, ps[i])),
            translate: `0px ${(1 - Math.min(1, ps[i])) * 40 - 6 * act[i]}px`,
            scale: String(0.9 + 0.1 * ps[i]),
            fontFamily: FONT.head,
            color: C.ink,
            padding: '26px 34px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* kilau sapuan saat kartu muncul */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `linear-gradient(105deg, transparent ${-40 + 150 * Math.min(1, ps[i]) - 16}%, rgba(255,245,220,0.12) ${-40 + 150 * Math.min(1, ps[i])}%, transparent ${-40 + 150 * Math.min(1, ps[i]) + 16}%)`,
            }}
          />
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
          <div style={{fontSize: 38, fontWeight: 700, marginTop: 6, letterSpacing: -0.5}}>{p.title}</div>
          <div style={{height: 190}} />
          {p.items.map((it, k) => {
            const q = ramp(t, cue(i + 1) + 0.6 + k * 0.25, cue(i + 1) + 1.2 + k * 0.25);
            return (
              <div key={it} style={{fontSize: 26, color: C.muted, lineHeight: 1.6, opacity: q, translate: `${(1 - q) * 14}px 0px`}}>
                <span style={{color: p.color, marginRight: 10}}>—</span>
                {it}
              </div>
            );
          })}
        </div>
      ))}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Icon i={i} x={CX[i]} y={TOP + 220} t={t} act={act[i]} />
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
