import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {EnergyBars, ELabel} from '../components/physics';
import {Arrow, Glow, Label, Stage} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pendulum bola boling: dilepas dari ujung hidung tanpa dorongan, kembali sedikit lebih rendah
// (redaman kecil hambatan udara). Periode dipilih agar kembalinya tepat saat baris 4 diucapkan.
const PIV = {x: 800, y: 70};
const L = 640;
const R = 46;
const TH0 = (38 * Math.PI) / 180;

const Face: React.FC<{x: number; y: number; flinch: number}> = ({x, y, flinch}) => (
  <g transform={`translate(${x} ${y})`}>
    {/* profil kepala menghadap kiri; ujung hidung di (0,0) */}
    <path
      d="M0,0 L22,-26 Q30,-60 26,-92 Q60,-170 150,-150 Q215,-130 220,-40 Q222,40 196,96 L196,190 L80,190 L84,120 Q60,118 44,96 Q40,74 46,60 Q30,56 34,40 Q26,34 32,22 Q18,14 0,0 Z"
      fill="#141d3e"
      stroke={C.muted}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={64} cy={-56} r={6} fill={C.ink} opacity={1 - flinch} />
    <path d="M56,-56 h16" stroke={C.ink} strokeWidth={4} opacity={flinch} strokeLinecap="round" />
  </g>
);

export const Hook: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const pull = ramp(t, cue(1) + 0.4, cueEnd(1) - 0.2, EASE_IN_OUT);
  const tr = cueEnd(1) + 0.15; // saat dilepas
  // satu periode penuh berakhir tepat ketika baris 4 dimulai (+0,5 dtk)
  const T = Math.max(3.6, Math.min(7, cue(4) + 0.3 - tr));
  const gamma = 0.04 / T;
  const tau = t - tr;
  const theta = tau < 0 ? TH0 * pull + 0.01 * Math.sin(t * 1.3) * (1 - pull) : TH0 * Math.exp(-gamma * tau) * Math.cos((2 * Math.PI * tau) / T);
  const bx = PIV.x + L * Math.sin(theta);
  const by = PIV.y + L * Math.cos(theta);
  const noseX = PIV.x + L * Math.sin(TH0) + R + 4;
  const noseY = PIV.y + L * Math.cos(TH0);

  // energi (per satuan, relatif titik terendah)
  const h0 = 1 - Math.cos(TH0);
  const amp = tau < 0 ? TH0 * pull : TH0 * Math.exp(-gamma * tau);
  const E = 1 - Math.cos(amp);
  const U = 1 - Math.cos(theta);
  const K = Math.max(0, E - U);
  const bars = win(t, cue(6), dur - 0.8, 0.8, 0.6);

  const faceIn = ramp(t, cue(1) - 0.2, cue(1) + 0.6);
  const flinch = win(t, cue(3) + 0.4, cue(4) + 1.2, 0.3, 0.4) * 0; // ia tidak bergerak — mata tetap terbuka
  const gapCall = win(t, cue(4) + 0.4, cue(6), 0.5, 0.6);
  const levelLine = win(t, cue(5) + 0.3, dur - 0.8, 0.8, 0.6);
  const energyWord = ramp(t, cue(7) + 0.2, cue(7) + 1.2);
  const qs = [ramp(t, cue(8) + 2.6, cue(8) + 3.4), ramp(t, cue(8) + 4.4, cue(8) + 5.2), ramp(t, cue(8) + 6.2, cue(8) + 7.0)];

  // jejak bola (busur) saat berayun
  const trail = Array.from({length: 14}, (_, i) => {
    const tt = tau - i * 0.05;
    if (tt < 0) return null;
    const th = TH0 * Math.exp(-gamma * tt) * Math.cos((2 * Math.PI * tt) / T);
    return {x: PIV.x + L * Math.sin(th), y: PIV.y + L * Math.cos(th), o: (1 - i / 14) * 0.35};
  }).filter(Boolean) as {x: number; y: number; o: number}[];

  // titik terdekat saat kembali (setelah satu periode)
  const xBack = PIV.x + L * Math.sin(TH0 * Math.exp(-gamma * T)) + R;
  return (
    <AbsoluteFill>
      <Stage>
        <Glow x={bx} y={by} r={200} color="kin" opacity={0.35 + 0.5 * K / Math.max(E, 1e-6)} />
        {/* langit-langit */}
        <rect x={PIV.x - 160} y={PIV.y - 30} width={320} height={30} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
        {Array.from({length: 9}, (_, i) => (
          <line key={i} x1={PIV.x - 150 + i * 36} y1={PIV.y - 30} x2={PIV.x - 130 + i * 36} y2={PIV.y - 50} stroke={C.faint} strokeWidth={2} />
        ))}
        {/* garis ketinggian awal */}
        <g opacity={levelLine}>
          <line x1={470} y1={noseY} x2={noseX + 40} y2={noseY} stroke={C.gold} strokeWidth={3} strokeDasharray="14 10" />
          <Label x={480} y={noseY - 28} size={26} color={C.gold} anchor="start" weight={600}>
            ketinggian awal = batas energi
          </Label>
        </g>
        {trail.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={R * 0.9} fill={C.kin} opacity={p.o * 0.25} />
        ))}
        <line x1={PIV.x} y1={PIV.y} x2={bx} y2={by} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
        <circle cx={PIV.x} cy={PIV.y} r={7} fill={C.ink} />
        {/* bola boling */}
        <g>
          <circle cx={bx} cy={by} r={R} fill="url(#ball)" stroke={C.ink} strokeOpacity={0.55} strokeWidth={2} />
          <circle cx={bx - 12} cy={by - 14} r={5} fill="#0a0f22" />
          <circle cx={bx + 4} cy={by - 20} r={5} fill="#0a0f22" />
          <circle cx={bx + 2} cy={by - 4} r={6} fill="#0a0f22" />
          <circle cx={bx - 16} cy={by - 20} r={9} fill="#fff" opacity={0.25} />
        </g>
        <g opacity={faceIn}>
          <Face x={noseX} y={noseY} flinch={flinch} />
        </g>
        {/* sisa celah beberapa cm */}
        <g opacity={gapCall}>
          <line x1={xBack} y1={noseY + 66} x2={noseX} y2={noseY + 66} stroke={C.gold} strokeWidth={3} />
          <line x1={xBack} y1={noseY + 54} x2={xBack} y2={noseY + 78} stroke={C.gold} strokeWidth={3} />
          <line x1={noseX} y1={noseY + 54} x2={noseX} y2={noseY + 78} stroke={C.gold} strokeWidth={3} />
          <Label x={xBack - 30} y={noseY + 108} size={26} color={C.gold} weight={600} anchor="end">
            beberapa cm
          </Label>
        </g>
        {/* panah tanda dilepas tanpa dorongan */}
        <g opacity={win(t, cueEnd(1) - 0.4, cue(3), 0.4, 0.6)}>
          <Label x={noseX - 330} y={noseY - 40} size={26} color={C.muted} anchor="end">
            dilepas, tanpa dorongan
          </Label>
          <Arrow x1={noseX - 320} y1={noseY - 30} x2={bx - R - 16} y2={by - 6} color="muted" width={3} />
        </g>
        <EnergyBars
          x={160}
          y={800}
          height={240}
          barW={62}
          gap={28}
          max={h0}
          showValues={false}
          unit=""
          title="ENERGI BOLA"
          opacity={bars}
          bars={[
            {key: 'K', label: ELabel.K, value: K, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: U, color: 'pot'},
          ]}
        />
      </Stage>
      {/* kata "energi" */}
      <div
        style={{
          position: 'absolute',
          left: 1480,
          top: 150,
          fontFamily: FONT.head,
          fontWeight: 700,
          fontSize: 92,
          letterSpacing: -2,
          color: C.gold,
          opacity: energyWord,
          translate: `0px ${(1 - energyWord) * 20}px`,
          textShadow: '0 0 40px rgba(255,201,74,0.5)',
        }}
      >
        energi
      </div>
      {['dari mana datangnya?', 'ke mana perginya?', 'seberapa cepat?'].map((q, i) => (
        <div
          key={q}
          style={{
            position: 'absolute',
            left: 1490,
            top: 290 + i * 70,
            fontFamily: FONT.head,
            fontSize: 32,
            fontWeight: 500,
            color: [C.work, C.heat, C.cyan][i],
            opacity: qs[i],
            translate: `${(1 - qs[i]) * 24}px 0px`,
          }}
        >
          <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: 'currentColor', marginRight: 14, verticalAlign: 'middle'}} />
          {q}
        </div>
      ))}
    </AbsoluteFill>
  );
};
