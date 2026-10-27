import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {EnergyBars, ELabel} from '../components/physics';
import {Arrow, Glow, Label, Motes, Ripple, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pendulum bola boling: dilepas dari ujung hidung tanpa dorongan, kembali sedikit lebih rendah
// (redaman kecil hambatan udara). Periode dipilih agar kembalinya tepat saat baris 4 diucapkan.
const PIV = {x: 820, y: 70};
const L = 640;
const R = 46;
const TH0 = (38 * Math.PI) / 180;
const FLOOR = 870;
const LAMP = {x: 250, y: 58};
// batang energi (kiri bawah, di luar jangkauan ayunan bola)
const BX = 102;
const BW = 54;
const BG = 22;
const BY = 812;
const BH = 210;

const Face: React.FC<{x: number; y: number; blink: number; breath: number}> = ({x, y, blink, breath}) => (
  <g transform={`translate(${x} ${y})`}>
    {/* bahu & badan (bernapas pelan) */}
    <g transform={`translate(0 ${FLOOR - y}) scale(1 ${1 + 0.012 * breath}) translate(0 ${-(FLOOR - y)})`}>
      <path
        d={`M86,168 Q62,214 12,238 Q-14,252 -16,${FLOOR - y} L332,${FLOOR - y} Q334,252 302,232 Q244,204 196,168 Z`}
        fill="#101834"
        stroke={C.muted}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={`M120,232 Q160,262 210,236`} fill="none" stroke={C.faint} strokeWidth={3} strokeLinecap="round" />
    </g>
    {/* profil kepala menghadap kiri; ujung hidung di (0,0) */}
    <path
      d="M0,0 L22,-26 Q30,-60 26,-92 Q60,-170 150,-150 Q215,-130 220,-40 Q222,40 196,96 L196,190 L80,190 L84,120 Q60,118 44,96 Q40,74 46,60 Q30,56 34,40 Q26,34 32,22 Q18,14 0,0 Z"
      fill="#141d3e"
      stroke={C.muted}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* sorotan tepi (cahaya bola memantul di wajah) */}
    <path d="M22,-26 Q30,-60 26,-92 Q44,-140 96,-156" fill="none" stroke={C.kin} strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" />
    <path d="M150,-150 Q215,-130 220,-40" fill="none" stroke="#000" strokeOpacity={0.25} strokeWidth={8} strokeLinecap="round" />
    {/* telinga */}
    <path d="M150,-58 q22,-6 24,20 q-2,24 -22,22" fill="none" stroke={C.muted} strokeWidth={3} strokeLinecap="round" />
    {/* alis & mata (berkedip sesekali) */}
    <path d="M52,-80 q14,-8 28,-2" fill="none" stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
    <ellipse cx={64} cy={-56} rx={6} ry={Math.max(0.6, 6 * (1 - blink))} fill={C.ink} />
  </g>
);

export const Hook: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const tr = cueEnd(1) + 0.15; // saat dilepas
  // satu atau beberapa ayunan penuh berakhir tepat ketika baris 4 dimulai (+0,3 dtk)
  const span = Math.max(3.6, cue(4) + 0.3 - tr);
  const nSw = Math.max(1, Math.round(span / 4.5));
  const T = span / nSw;
  const gamma = 0.04 / span;
  const pullAt = (tt: number) => ramp(tt, cue(1) + 0.4, cueEnd(1) - 0.2, EASE_IN_OUT);
  const thetaAt = (tt: number) => {
    const ta = tt - tr;
    if (ta < 0) {
      const p = pullAt(tt);
      return TH0 * p + 0.01 * Math.sin(tt * 1.3) * (1 - p);
    }
    return TH0 * Math.exp(-gamma * ta) * Math.cos((2 * Math.PI * ta) / T);
  };
  const tau = t - tr;
  const theta = thetaAt(t);
  const omega = (thetaAt(t + 1 / 60) - thetaAt(t - 1 / 60)) * 30; // rad/s
  const bx = PIV.x + L * Math.sin(theta);
  const by = PIV.y + L * Math.cos(theta);
  const noseX = PIV.x + L * Math.sin(TH0) + R + 4;
  const noseY = PIV.y + L * Math.cos(TH0);

  // energi (per satuan, relatif titik terendah)
  const h0 = 1 - Math.cos(TH0);
  const amp = tau < 0 ? TH0 * pullAt(t) : TH0 * Math.exp(-gamma * tau);
  const E = 1 - Math.cos(amp);
  const U = 1 - Math.cos(theta);
  const K = Math.max(0, E - U);
  const kRel = K / Math.max(E, 1e-6);
  const vMax = (2 * Math.PI * TH0) / T;
  const vRel = Math.min(1, Math.abs(omega) / vMax);
  const dU = Math.sin(theta) * omega; // tanda: + naik (K → U), − turun (U → K)
  const bars = win(t, cue(6), dur - 0.8, 0.8, 0.6);

  const faceIn = ramp(t, cue(1) - 0.2, cue(1) + 0.6);
  // kedipan sesekali — tidak saat bola mendekat (ia tidak bergerak sedikit pun)
  const blinkPh = (((t / 4.3 + 0.3) % 1) + 1) % 1;
  const blink = Math.max(0, 1 - Math.abs(blinkPh - 0.5) * 14) * (1 - win(t, cue(2) - 0.5, cue(5), 0.5, 0.5));
  const gapCall = win(t, cue(4) + 0.4, cue(6), 0.5, 0.6);
  const levelLine = win(t, cue(5) + 0.3, dur - 0.8, 0.8, 0.6);
  const energyWord = ramp(t, cue(7) + 0.2, cue(7) + 1.2);
  const qs = [ramp(t, cue(8) + 2.6, cue(8) + 3.4), ramp(t, cue(8) + 4.4, cue(8) + 5.2), ramp(t, cue(8) + 6.2, cue(8) + 7.0)];
  const world = ramp(t, -0.4, 1.2);

  // dorongan kamera ke wajah saat bola kembali, lalu mundur lagi
  const zoom = 1 + 0.07 * win(t, cue(2) + 1.0, cue(4) + 1.6, 2.4, 2.6);
  const zc = {x: noseX - 120, y: noseY - 40};
  const zp = (x: number, y: number): [number, number] => [zc.x + (x - zc.x) * zoom, zc.y + (y - zc.y) * zoom];

  // jejak bola (busur kabur gerak) saat berayun
  const TRN = 18;
  const trail = Array.from({length: TRN}, (_, i) => {
    const tt = t - i * 0.035;
    const th = thetaAt(tt);
    return {x: PIV.x + L * Math.sin(th), y: PIV.y + L * Math.cos(th)};
  });
  // garis gerak di belakang bola (arah berlawanan kecepatan)
  const vx = Math.cos(theta) * Math.sign(omega);
  const vy = -Math.sin(theta) * Math.sign(omega);

  // titik terdekat saat kembali (setelah satu periode)
  const xBack = PIV.x + L * Math.sin(TH0 * Math.exp(-gamma * span)) + R;
  const returns = Array.from({length: nSw}, (_, k) => tr + (k + 1) * T);

  // tegangan tali ∝ 3 cos θ − 2 cos θ_amp (relatif)
  const tension = Math.max(0, 3 * Math.cos(theta) - 2 * Math.cos(amp)) / Math.max(1e-6, 3 - 2 * Math.cos(amp));
  const ropePh = (t * 0.8) % 1;
  const lampSway = 1.4 * Math.sin(t * 1.9);

  // posisi batang energi
  const kBar = {x: BX + BW / 2, y: BY - BH * Math.min(1, K / h0)};
  const uBar = {x: BX + BW + BG + BW / 2, y: BY - BH * Math.min(1, U / h0)};
  const [wbx, wby] = zp(bx, by);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="hook-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.gold} stopOpacity={0.16} />
            <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="hook-ceil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1128" />
            <stop offset="100%" stopColor="#1a2550" />
          </linearGradient>
          <linearGradient id="hook-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2a52" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0b1126" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g opacity={world} transform={`translate(${zc.x} ${zc.y}) scale(${zoom}) translate(${-zc.x} ${-zc.y})`}>
          {/* lampu gantung + kerucut cahaya redup */}
          <g transform={`rotate(${lampSway} ${LAMP.x} ${LAMP.y})`}>
            <path d={`M${LAMP.x - 46},150 L${LAMP.x + 46},150 L${LAMP.x + 330},${FLOOR} L${LAMP.x - 330},${FLOOR} Z`} fill="url(#hook-cone)" opacity={0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 2.1)} />
            <line x1={LAMP.x} y1={LAMP.y} x2={LAMP.x} y2={118} stroke={C.muted} strokeWidth={3} />
            <path d={`M${LAMP.x - 22},118 L${LAMP.x + 22},118 L${LAMP.x + 52},150 L${LAMP.x - 52},150 Z`} fill="#1a2550" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
            <circle cx={LAMP.x} cy={152} r={60} fill="url(#soft-gold)" opacity={0.8} />
            <ellipse cx={LAMP.x} cy={152} rx={20} ry={7} fill="#fff3cf" />
          </g>
          <Motes x={LAMP.x + 40} y={560} rx={230} ry={300} n={26} color="gold" opacity={0.4} seed={3} />
          {/* lantai */}
          <rect x={80} y={FLOOR} width={1760} height={34} fill="url(#hook-floor)" />
          <line x1={80} y1={FLOOR} x2={1840} y2={FLOOR} stroke={C.faint} strokeWidth={3} />
          {/* bayangan bola di lantai */}
          <ellipse cx={bx} cy={FLOOR + 4} rx={44 + 26 * ((by - 528) / 230)} ry={9} fill="#000" opacity={0.25 + 0.2 * ((by - 528) / 230)} />
          {/* langit-langit */}
          <rect x={80} y={0} width={1760} height={56} fill="url(#hook-ceil)" />
          <line x1={80} y1={56} x2={1840} y2={56} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
          {Array.from({length: 22}, (_, i) => (
            <line key={i} x1={100 + i * 80} y1={56} x2={120 + i * 80} y2={30} stroke={C.faint} strokeWidth={2} />
          ))}
          <rect x={PIV.x - 50} y={52} width={100} height={12} rx={4} fill="#22305a" stroke={C.muted} strokeWidth={2} />
          <Glow x={bx} y={by} r={200} color="kin" opacity={0.3 + 0.5 * kRel} />
          {/* garis ketinggian awal */}
          <g opacity={levelLine}>
            <line x1={470} y1={noseY} x2={noseX + 40} y2={noseY} stroke={C.gold} strokeWidth={3} strokeDasharray="14 10" strokeDashoffset={-t * 16} />
            <Label x={PIV.x} y={noseY - 28} size={26} color={C.gold} weight={600}>
              ketinggian awal = batas energi
            </Label>
          </g>
          {/* busur kabur gerak */}
          {trail.slice(1).map((p, i) => {
            const q = trail[i];
            const f = 1 - i / TRN;
            return <line key={`a${i}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={C.kin} strokeOpacity={0.5 * f * vRel} strokeWidth={R * 1.5 * f} strokeLinecap="round" />;
          })}
          {trail.slice(2).filter((_, i) => i % 3 === 0).map((p, i) => (
            <circle key={`g${i}`} cx={p.x} cy={p.y} r={R * 0.92} fill="#3c4677" opacity={0.18 * (1 - i / 6) * vRel} />
          ))}
          {/* tali: pendar sebanding tegangan + denyut merambat */}
          <line x1={PIV.x} y1={PIV.y} x2={bx} y2={by} stroke={C.gold} strokeOpacity={0.06 + 0.16 * tension * vRel} strokeWidth={10} strokeLinecap="round" />
          <line x1={PIV.x} y1={PIV.y} x2={bx} y2={by} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
          <circle
            cx={PIV.x + (bx - PIV.x) * (0.08 + 0.84 * ropePh)}
            cy={PIV.y + (by - PIV.y) * (0.08 + 0.84 * ropePh)}
            r={4}
            fill="#fff"
            opacity={cyc(ropePh) * (0.25 + 0.6 * vRel)}
          />
          <circle cx={PIV.x} cy={PIV.y} r={8} fill={C.ink} />
          <circle cx={PIV.x} cy={PIV.y} r={3} fill={C.bg} />
          {/* garis gerak */}
          {[-18, 0, 18].map((o, i) => {
            const len = 30 + 70 * vRel;
            const sx = bx - vx * (R + 12) + -vy * o;
            const sy = by - vy * (R + 12) + vx * o;
            return <line key={o} x1={sx} y1={sy} x2={sx - vx * len * (i === 1 ? 1.2 : 0.8)} y2={sy - vy * len * (i === 1 ? 1.2 : 0.8)} stroke={C.ink} strokeOpacity={0.35 * vRel * vRel} strokeWidth={3} strokeLinecap="round" />;
          })}
          {/* bola boling (lubang jari ikut berputar bersama tali) */}
          <g>
            <circle cx={bx} cy={by} r={R} fill="url(#ball)" stroke={C.ink} strokeOpacity={0.55} strokeWidth={2} />
            <g transform={`rotate(${(-theta * 180) / Math.PI} ${bx} ${by})`}>
              <circle cx={bx - 12} cy={by - 14} r={5} fill="#0a0f22" />
              <circle cx={bx + 4} cy={by - 20} r={5} fill="#0a0f22" />
              <circle cx={bx + 2} cy={by - 4} r={6} fill="#0a0f22" />
            </g>
            <path d={`M${bx + R * 0.72},${by - R * 0.5} A${R * 0.88},${R * 0.88} 0 0 1 ${bx + R * 0.3},${by + R * 0.84}`} fill="none" stroke={C.kin} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
            <circle cx={bx - 16} cy={by - 20} r={9} fill="#fff" opacity={0.25} />
          </g>
          <g opacity={faceIn}>
            <Face x={noseX} y={noseY} blink={blink} breath={Math.sin(t * 1.6)} />
          </g>
          {/* riak saat bola tiba paling dekat */}
          {returns.map((tc, k) => (
            <Ripple key={k} x={noseX - 16} y={noseY} p={(t - tc + 0.15) / 1.5} r={k === nSw - 1 ? 150 : 110} color={k === nSw - 1 ? 'gold' : 'cyan'} />
          ))}
          {/* sisa celah beberapa cm */}
          <g opacity={gapCall}>
            <line x1={xBack} y1={noseY + 66} x2={noseX} y2={noseY + 66} stroke={C.gold} strokeWidth={3} />
            <line x1={xBack} y1={noseY + 54} x2={xBack} y2={noseY + 78} stroke={C.gold} strokeWidth={3} />
            <line x1={noseX} y1={noseY + 54} x2={noseX} y2={noseY + 78} stroke={C.gold} strokeWidth={3} />
            <line x1={(xBack + noseX) / 2} y1={noseY + 80} x2={(xBack + noseX) / 2} y2={noseY + 176} stroke={C.gold} strokeWidth={2} strokeDasharray="4 5" />
            <Label x={(xBack + noseX) / 2 - 12} y={noseY + 200} size={26} color={C.gold} weight={600} anchor="end">
              beberapa cm
            </Label>
            <Twinkles x={(xBack + noseX) / 2} y={noseY + 66} rx={40} ry={26} n={4} color="gold" />
          </g>
          {/* panah tanda dilepas tanpa dorongan */}
          <g opacity={win(t, cueEnd(1) - 0.4, cue(3), 0.4, 0.6)}>
            <Label x={noseX - 330} y={noseY - 40} size={26} color={C.muted} anchor="end">
              dilepas, tanpa dorongan
            </Label>
            <Arrow x1={noseX - 320} y1={noseY - 30} x2={bx - R - 16} y2={by - 6} color="muted" width={3} />
          </g>
        </g>

        {/* energi bola: aliran dari bola ke batang, dan K ⇄ Ug di antara batang */}
        <g opacity={bars}>
          <Stream pts={[[wbx - 10, wby + R * 0.6], [(wbx + 300) / 2, (wby + 470) / 2 + 40], [BX + 110, BY - BH - 40]]} color="kin" n={7} speed={0.45} r={4} opacity={0.55 * kRel} seed={1} />
          <Stream pts={[[wbx - 10, wby + R * 0.6], [(wbx + 300) / 2, (wby + 470) / 2 + 40], [BX + 110, BY - BH - 40]]} color="pot" n={7} speed={0.45} r={4} opacity={0.55 * (1 - kRel)} seed={2} />
          <Stream pts={[[uBar.x, uBar.y - 14], [(uBar.x + kBar.x) / 2, Math.min(uBar.y, kBar.y) - 46], [kBar.x, kBar.y - 14]]} color="pot" n={5} speed={0.9} r={3.5} jitter={2} opacity={Math.min(1, Math.max(0, -dU * 2.2))} seed={3} />
          <Stream pts={[[kBar.x, kBar.y - 14], [(uBar.x + kBar.x) / 2, Math.min(uBar.y, kBar.y) - 46], [uBar.x, uBar.y - 14]]} color="kin" n={5} speed={0.9} r={3.5} jitter={2} opacity={Math.min(1, Math.max(0, dU * 2.2))} seed={4} />
        </g>
        <EnergyBars
          x={BX}
          y={BY}
          height={BH}
          barW={BW}
          gap={BG}
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
        {/* kilau di sekitar kata "energi" */}
        <g opacity={energyWord}>
          <Glow x={1640} y={205} r={220} color="gold" opacity={0.45} />
          <Twinkles x={1640} y={205} rx={190} ry={70} n={7} color="gold" seed={5} />
          <line x1={1484} y1={268} x2={1484 + 300 * ramp(t, cue(7) + 0.6, cue(7) + 1.6, EASE_IN_OUT)} y2={268} stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
        </g>
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
          textShadow: `0 0 ${34 + 10 * Math.sin(t * 2)}px rgba(255,201,74,0.5)`,
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
            top: 300 + i * 70,
            fontFamily: FONT.head,
            fontSize: 32,
            fontWeight: 500,
            color: [C.work, C.heat, C.cyan][i],
            opacity: qs[i],
            translate: `${(1 - qs[i]) * 24}px 0px`,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              borderRadius: 7,
              background: 'currentColor',
              marginRight: 14,
              verticalAlign: 'middle',
              scale: String(1 + 0.25 * Math.sin(t * 3 + i * 2.1)),
              boxShadow: `0 0 ${10 + 6 * Math.sin(t * 3 + i * 2.1)}px currentColor`,
            }}
          />
          {q}
        </div>
      ))}
    </AbsoluteFill>
  );
};
