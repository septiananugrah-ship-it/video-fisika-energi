import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, ramp} from '../anim';
import {Crate, Spring} from '../components/physics';
import {Stage} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

const PARTS = [
  {n: '1', title: 'Konsep & cara berpikir', color: C.cyan, items: ['Usaha & luas grafik', 'Energi kinetik', 'Energi potensial & pegas', 'Kekekalan · gesekan', 'Daya · strategi soal']},
  {n: '2', title: 'Energi dalam kimia', color: C.spr, items: ['Ikatan sebagai pegas', 'Panas = gerak molekul', 'Bukit energi reaksi']},
  {n: '3', title: 'Penerapan', color: C.work, items: ['PLTA', 'Rem & mobil listrik', 'Listrik rumah & tubuh']},
];
const CX = [380, 960, 1540];
const TOP = 230;
const CW = 500;
const CH = 560;

/** Ikon kecil tiap bagian, digambar SVG dan bergerak pelan. */
const Icon: React.FC<{i: number; x: number; y: number; t: number}> = ({i, x, y, t}) => {
  if (i === 0) {
    const s = 30 * Math.sin(t * 2.2);
    return (
      <g>
        <line x1={x - 150} y1={y + 40} x2={x + 150} y2={y + 40} stroke={C.muted} strokeWidth={3} />
        <rect x={x - 156} y={y - 30} width={10} height={70} fill={C.muted} />
        <Spring xa={x - 146} xb={x + 10 + s} y={y + 5} coils={8} amp={16} width={4} />
        <Crate x={x + 55 + s} y={y + 40} w={90} h={70} color={C.kin} />
      </g>
    );
  }
  if (i === 1) {
    const d = 110 + 10 * Math.sin(t * 5);
    return (
      <g>
        <Spring xa={x - d / 2} xb={x + d / 2} y={y} coils={6} amp={12} width={4} />
        <circle cx={x - d / 2} cy={y} r={30} fill={ATOM.H.fill} stroke={C.ink} strokeWidth={2} />
        <circle cx={x + d / 2} cy={y} r={42} fill={ATOM.Cl.fill} stroke={C.ink} strokeWidth={2} />
        <text x={x - d / 2} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={24} fill="#111">
          H
        </text>
        <text x={x + d / 2} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#111">
          Cl
        </text>
      </g>
    );
  }
  // turbin berputar di bawah air terjun
  const rot = t * 140;
  return (
    <g>
      <path d={`M${x - 150},${y - 50} h70 v20 q20,0 30,40`} fill="none" stroke={C.pot} strokeWidth={10} strokeLinecap="round" />
      <g transform={`translate(${x + 30} ${y + 20}) rotate(${rot})`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M0,0 L44,-10 Q50,0 44,10 Z" fill={C.work} opacity={0.85} transform={`rotate(${a})`} />
        ))}
        <circle r={10} fill={C.ink} />
      </g>
      <path d={`M${x + 100},${y - 20} l-16,30 h14 l-12,28`} fill="none" stroke={C.gold} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 112, textAlign: 'center', fontFamily: FONT.head, fontSize: 52, fontWeight: 700, color: C.ink, opacity: head}}>
        Peta perjalanan energi
      </div>
      <Stage>
        {/* garis perjalanan yang menghubungkan ketiga bagian */}
        <line x1={CX[0]} y1={TOP + CH + 40} x2={CX[2]} y2={TOP + CH + 40} stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" />
        {PARTS.map((p, i) => (
          <g key={i} opacity={ps[i]}>
            <circle cx={CX[i]} cy={TOP + CH + 40} r={12} fill={p.color} />
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
            boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 40px ${p.color}22`,
            opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * Math.min(1, ps[i])),
            translate: `0px ${(1 - Math.min(1, ps[i])) * 40}px`,
            scale: String(0.9 + 0.1 * ps[i]),
            fontFamily: FONT.head,
            color: C.ink,
            padding: '26px 34px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
          <div style={{fontSize: 38, fontWeight: 700, marginTop: 6, letterSpacing: -0.5}}>{p.title}</div>
          <div style={{height: 190}} />
          {p.items.map((it, k) => (
            <div key={it} style={{fontSize: 26, color: C.muted, lineHeight: 1.6, opacity: ramp(t, cue(i + 1) + 0.6 + k * 0.25, cue(i + 1) + 1.2 + k * 0.25)}}>
              <span style={{color: p.color, marginRight: 10}}>—</span>
              {it}
            </div>
          ))}
        </div>
      ))}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Icon i={i} x={CX[i]} y={TOP + 220} t={t} />
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
