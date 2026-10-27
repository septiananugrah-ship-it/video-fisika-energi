import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {EnergyBars, ELabel, Ground, Spring} from '../components/physics';
import {Arrow, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase B: papan luncur di setengah pipa licin (lintasan lingkaran R). Energi dihitung dari posisi:
// U = mgR(1 − cos θ), K = E − U. Hentakan kaki menambah E (usaha luar positif).
const PIPE = {cx: 620, cy: 250, R: 480};
const A0 = (55 * Math.PI) / 180;
const DEPTH = {x: 38, y: -28}; // kedalaman semu (tepi belakang pipa)
const pipePt = (th: number) => ({x: PIPE.cx + PIPE.R * Math.sin(th), y: PIPE.cy + PIPE.R * Math.cos(th)});
const arcD = (a0: number, a1: number, n: number, dx = 0, dy = 0) => {
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const p = pipePt(mix(a0, a1, i / n));
    pts.push(`${i ? 'L' : 'M'}${(p.x + dx).toFixed(1)},${(p.y + dy).toFixed(1)}`);
  }
  return pts.join(' ');
};
const RIM = (78 * Math.PI) / 180;
const PIPE_D = arcD(-RIM, RIM, 120);
const BACK_D = arcD(-RIM, RIM, 120, DEPTH.x, DEPTH.y);
// permukaan dek: tepi belakang lalu tepi depan dibalik
const DECK_D = (() => {
  const back = arcD(-RIM, RIM, 60, DEPTH.x, DEPTH.y);
  const front: string[] = [];
  for (let i = 60; i >= 0; i--) {
    const p = pipePt(mix(-RIM, RIM, i / 60));
    front.push(`L${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return `${back} ${front.join(' ')} Z`;
})();
const RIBS = Array.from({length: 13}, (_, i) => mix(-RIM, RIM, (i + 0.5) / 13));
const FLOOR_Y = 790;

// Fase C: bandul bola boling (seperti pembuka).
const PIV = {x: 820, y: 175};
const L = 520;
const RB = 40;
const TH0 = (38 * Math.PI) / 180;
const TP = 3.6;
const GAMMA = 0.04 / TP;
const thetaAt = (tau: number) => (tau < 0 ? TH0 : TH0 * Math.exp(-GAMMA * tau) * Math.cos((2 * Math.PI * tau) / TP));

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Pemain papan luncur (koordinat lokal: papan di y = 0, badan ke arah pusat pipa). */
const Skater: React.FC<{ghost?: boolean}> = ({ghost}) => (
  <g>
    <rect x={-46} y={-14} width={92} height={10} rx={5} fill={C.kin} />
    {ghost ? null : (
      <>
        <rect x={-40} y={-13} width={80} height={3} rx={1.5} fill="#fff" opacity={0.35} />
        <circle cx={-30} cy={-2} r={6} fill={C.muted} />
        <circle cx={30} cy={-2} r={6} fill={C.muted} />
      </>
    )}
    <g stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none">
      <line x1={-14} y1={-14} x2={0} y2={-60} />
      <line x1={14} y1={-14} x2={0} y2={-60} />
      <line x1={0} y1={-60} x2={0} y2={-104} />
      <line x1={0} y1={-92} x2={-30} y2={-74} />
      <line x1={0} y1={-92} x2={30} y2={-74} />
    </g>
    {ghost ? null : <circle cx={0} cy={-122} r={15} fill={C.bg} stroke={C.ink} strokeWidth={5} />}
  </g>
);

/** Wajah tampak samping; ujung hidung di (0, 0). */
const Face: React.FC<{x: number; y: number; hit: number; t: number; fear: number}> = ({x, y, hit, t, fear}) => {
  const stroke = interpolateColors(hit, [0, 1], [C.muted, C.heat]);
  const blinkPh = (t * 0.27) % 1;
  const blink = Math.max(0, 1 - Math.abs(blinkPh - 0.5) * 30);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={120} cy={0} r={190} fill="url(#soft-heat)" opacity={0.7 * hit} />
      <path
        d="M0,0 L22,-26 Q30,-60 26,-92 Q60,-170 150,-150 Q215,-130 220,-40 Q222,40 196,96 L196,170 L80,170 L84,120 Q60,118 44,96 Q40,74 46,60 Q30,56 34,40 Q26,34 32,22 Q18,14 0,0 Z"
        fill="url(#cons-face)"
        stroke={stroke}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      {/* telinga, alis, mulut */}
      <path d="M150,-30 Q172,-38 176,-12 Q178,12 156,10" fill="none" stroke={stroke} strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round" />
      <path d={`M48,${-76 - 8 * fear} Q64,${-86 - 10 * fear} 82,${-78 - 6 * fear}`} fill="none" stroke={C.ink} strokeOpacity={0.8} strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M34,48 Q44,${52 + 4 * fear} 54,48`} fill="none" stroke={C.ink} strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={64} cy={-56} rx={6 + 2 * fear} ry={(6 + 2 * fear) * (1 - 0.9 * blink)} fill={C.ink} />
      {/* setetes keringat saat bola mendekat */}
      <path d={`M96,${-104 + 26 * ((t * 0.8) % 1)} q6,10 0,16 q-6,-6 0,-16 Z`} fill={C.cyan} opacity={fear * 0.8 * Math.min(1, ((t * 0.8) % 1) * 6) * (1 - ((t * 0.8) % 1))} />
    </g>
  );
};

/** Aliran bolak-balik antara batang K dan Ug (arah mengikuti laju perubahan Ug). */
const Exchange: React.FC<{xK: number; xU: number; yK: number; yU: number; rate: number; ceil: number; opacity: number; seed: number}> = ({xK, xU, yK, yU, rate, ceil, opacity, seed}) => {
  const peak = Math.max(ceil, Math.min(yK, yU) - 50);
  const a: [number, number][] = [
    [xK, yK - 12],
    [(xK + xU) / 2, peak],
    [xU, yU - 12],
  ];
  const b: [number, number][] = [a[2], a[1], a[0]];
  return (
    <g>
      <Stream pts={a} color="pot" n={6} speed={0.9} r={4.5} jitter={2} seed={seed} opacity={opacity * clamp01(rate * 3)} />
      <Stream pts={b} color="kin" n={6} speed={0.9} r={4.5} jitter={2} seed={seed + 1} opacity={opacity * clamp01(-rate * 3)} />
    </g>
  );
};

export const Conservation: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);
  const phA = 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.2, EASE_IN_OUT);
  const phB = win(t, cue(3) - 0.1, cue(6) - 0.2, 0.6, 0.5);
  const phC = ramp(t, cue(6) - 0.1, cue(6) + 0.5);

  // ---------- fase A ----------
  const chips = [0, 1, 2].map((i) => ramp(t, cue(0) + 1.6 + i * 1.3, cue(0) + 2.3 + i * 1.3));
  const fEm = win(t, cue(1) + 0.2, cue(2) + 0.2, 0.7, 0.5);
  const fCons = ramp(t, cue(2) + 0.3, cue(2) + 1.1);
  const sumFlow = win(t, cue(1) + 0.5, cue(2) + 0.4, 0.8, 0.8) + 0.45 * ramp(t, cue(2) + 0.6, cue(2) + 1.6) * phA;
  const consFlash = win(t, cue(2) + 0.3, cue(2) + 2.6, 0.4, 1.2);

  // ---------- fase B: papan luncur ----------
  const tb = t - (cue(3) + 0.3);
  const kT = wordOf(5, 'hentakan');
  const kick = ramp(t, kT + 0.1, kT + 0.9, EASE_IN_OUT);
  const A1 = Math.acos(1 - 1.15 * (1 - Math.cos(A0)));
  const amp = mix(A0, A1, kick);
  const thAt = (tt: number) => (tt < 0 ? A0 : amp * Math.cos((2 * Math.PI * tt) / 4.4));
  const th = thAt(tb);
  const Us = 100 / (1 - Math.cos(A0));
  const E = Us * (1 - Math.cos(amp));
  const Ub = Us * (1 - Math.cos(th));
  const Kb = Math.max(0, E - Ub);
  const rateB = tb < 0 ? 0 : (Us * (1 - Math.cos(thAt(tb + 0.05))) - Ub) / 0.05 / 120; // ≈ −1..1
  const speedB = Math.sqrt(Kb / 115);
  const sk = pipePt(th);
  const startY = pipePt(A0).y;
  const kickFlash = win(t, kT, kT + 1.6, 0.3, 0.6);
  const barsB = phB * ramp(t, cue(3) + 0.6, cue(3) + 1.3);
  const camB = ramp(t, cue(4) - 0.2, cue(4) + 3.2, EASE_IN_OUT) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 2.2, EASE_IN_OUT));
  const sB = 1 + 0.06 * camB;
  const tipP = tb > 0 ? (tb / 2.2) % 1 : 1;
  const tipN = Math.floor(Math.max(0, tb) / 2.2);
  const tip = pipePt(amp * (tipN % 2 === 0 ? 1 : -1));
  // batang energi B (posisi untuk aliran)
  const BX = 1240;
  const BW = 80;
  const BG = 34;
  const BH = 300;
  const BMAX = 125;
  const yOf = (v: number) => 760 - (v / BMAX) * BH;
  const totX = BX + 2 * BW + BG + BG * 1.4;

  // ---------- fase C: bandul ----------
  const tr = cue(7) + 0.6;
  const tau = t - tr;
  const theta = thetaAt(tau);
  const bx = PIV.x + L * Math.sin(theta);
  const by = PIV.y + L * Math.cos(theta);
  const noseX = PIV.x + L * Math.sin(TH0) + RB + 4;
  const noseY = PIV.y + L * Math.cos(TH0);
  const h0 = 1 - Math.cos(TH0);
  const ampC = tau < 0 ? TH0 : TH0 * Math.exp(-GAMMA * tau);
  const Ec = (1 - Math.cos(ampC)) / h0;
  const Uc = (1 - Math.cos(theta)) / h0;
  const Kc = Math.max(0, Ec - Uc);
  const speedC = Math.sqrt(Kc);
  const rateC = tau < 0 ? 0 : ((1 - Math.cos(thetaAt(tau + 0.05))) / h0 - Uc) / 0.05 / 1.4;
  const omega = tau < 0 ? 0 : (thetaAt(tau + 0.02) - theta) / 0.02;
  // puncak yang sudah dicapai di sisi wajah (tiap periode)
  const peaks = [1, 2, 3].filter((n) => tau > n * TP - 0.2).map((n) => TH0 * Math.exp(-GAMMA * n * TP));
  const lowerNote = ramp(t, cue(8) + 0.4, cue(8) + 1.1);
  const ghostP = ramp(t, cue(9) + 1.4, cue(9) + 3.6, EASE_IN_OUT);
  const ghostOn = ramp(t, cue(9) + 0.3, cue(9) + 0.9);
  const TH_PUSH = TH0 + 0.16;
  const thG = Math.min(mix(-TH_PUSH, TH_PUSH, ghostP), TH0);
  const hit = ramp(t, cue(9) + 3.0, cue(9) + 3.3) * ghostOn;
  const gx = PIV.x + L * Math.sin(thG);
  const gy = PIV.y + L * Math.cos(thG);
  const g0 = {x: PIV.x - L * Math.sin(TH_PUSH), y: PIV.y + L * Math.cos(TH_PUSH)};
  const pushArrow = win(t, cue(9) + 0.5, cue(9) + 2.6, 0.5, 0.6);
  const ghostArc = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = mix(-TH_PUSH, TH_PUSH, i / 60);
      pts.push(`${i ? 'L' : 'M'}${(PIV.x + L * Math.sin(a)).toFixed(1)},${(PIV.y + L * Math.cos(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  })();
  const dNose = Math.hypot(bx - noseX + RB, by - noseY);
  const fear = Math.max(clamp01(1 - (dNose - 30) / 160) * phC, hit);
  const recoil = 10 * fear;
  const faceTipP = tau > 0 ? (tau / TP) % 1 : 1;
  const safe = win(t, wordOf(8, 'Hidung'), cue(9) + 0.2, 0.5, 0.6);
  const camC = ramp(t, wordOf(8, 'Hidung') - 0.6, wordOf(8, 'Hidung') + 1.6, EASE_IN_OUT) * (1 - ramp(t, cue(9) - 0.2, cue(9) + 1.4, EASE_IN_OUT));
  const sC = 1 + 0.05 * camC;
  const barsC = phC * ramp(t, cue(7) - 0.2, cue(7) + 0.6);
  const yC = (v: number) => 800 - v * 240;

  const chipData = [
    {c: C.kin, name: 'energi kinetik', f: <>K = ½ m v²</>},
    {c: C.pot, name: 'potensial gravitasi', f: <>U<sub>g</sub> = m g y</>},
    {c: C.spr, name: 'potensial pegas', f: <>U<sub>s</sub> = ½ k x²</>},
  ];
  const CHIP_TOP = 330;

  // ikon gerak di atas tiap kartu
  const kx = 500 + 92 * Math.sin(t * 1.5);
  const kv = Math.cos(t * 1.5);
  const gyb = 236 + 34 * Math.sin(t * 1.3);
  const sx = 1452 + 34 * Math.sin(t * 2.3);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      {/* ---------- fase A: latar ---------- */}
      <Stage>
        <g opacity={phA}>
          <Glow x={960} y={680} r={420} color="gold" opacity={0.25 * fEm + 0.5 * consFlash} />
          <Motes x={960} y={560} rx={760} ry={330} n={36} color="gold" opacity={0.45 * Math.max(...chips)} seed={3} />
          {/* ikon K: bola menggelinding dengan garis gerak */}
          <g opacity={chips[0]}>
            <line x1={380} y1={300} x2={620} y2={300} stroke={C.faint} strokeWidth={3} strokeLinecap="round" />
            <ellipse cx={kx} cy={302} rx={22} ry={5} fill="#000" opacity={0.35} />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={kx - Math.sign(kv) * (30 + k * 4)} y1={270 + k * 10} x2={kx - Math.sign(kv) * (30 + k * 4 + 40 * Math.abs(kv))} y2={270 + k * 10} stroke={C.kin} strokeWidth={3} strokeLinecap="round" opacity={0.6 * Math.abs(kv)} />
            ))}
            <g transform={`translate(${kx} 280) rotate(${(((kx - 500) / 20) * 180) / Math.PI})`}>
              <circle r={20} fill={C.kin} />
              <circle cx={-6} cy={-7} r={5} fill="#fff" opacity={0.6} />
              <line x1={-14} y1={0} x2={14} y2={0} stroke="#7a3510" strokeWidth={2} />
            </g>
          </g>
          {/* ikon Ug: bola naik-turun di atas lantai, garis ketinggian */}
          <g opacity={chips[1]}>
            <line x1={880} y1={300} x2={1040} y2={300} stroke={C.faint} strokeWidth={3} strokeLinecap="round" />
            <ellipse cx={960} cy={302} rx={16 + 8 * ((gyb - 202) / 68)} ry={4} fill="#000" opacity={0.25 + 0.2 * ((gyb - 202) / 68)} />
            <line x1={1010} y1={300} x2={1010} y2={gyb} stroke={C.pot} strokeWidth={2.5} strokeDasharray="5 5" />
            <line x1={1000} y1={gyb} x2={1020} y2={gyb} stroke={C.pot} strokeWidth={2.5} />
            <circle cx={960} cy={gyb} r={18} fill={C.pot} />
            <circle cx={954} cy={gyb - 6} r={4.5} fill="#fff" opacity={0.6} />
            <Glow x={960} y={gyb} r={50} color="pot" opacity={0.6} still />
          </g>
          {/* ikon Us: balok bergetar pada pegas */}
          <g opacity={chips[2]}>
            <line x1={1300} y1={300} x2={1540} y2={300} stroke={C.faint} strokeWidth={3} strokeLinecap="round" />
            <rect x={1296} y={236} width={10} height={64} rx={3} fill={C.faint} />
            <Spring xa={1306} xb={sx - 24} y={274} coils={6} amp={11} width={3.5} />
            <rect x={sx - 24} y={250} width={48} height={48} rx={7} fill="url(#crate)" stroke={C.spr} strokeWidth={2.5} />
            <Glow x={1360} y={274} r={70} color="spr" opacity={0.3 + 0.3 * Math.abs(Math.sin(t * 2.3))} still />
          </g>
          {/* K + U dijumlah menjadi energi mekanik */}
          <Stream pts={[[500, CHIP_TOP + 200], [560, 575], [830, 640]]} color="kin" n={9} speed={0.55} opacity={clamp01(sumFlow)} seed={1} />
          <Stream pts={[[960, CHIP_TOP + 200], [960, 600]]} color="pot" n={5} speed={0.55} opacity={clamp01(sumFlow)} seed={2} />
          <Stream pts={[[1420, CHIP_TOP + 200], [1360, 575], [1090, 640]]} color="spr" n={9} speed={0.55} opacity={clamp01(sumFlow)} seed={3} />
          <Twinkles x={960} y={680} rx={380} ry={90} n={6} opacity={consFlash} seed={4} />
        </g>
      </Stage>
      <div style={{opacity: phA}}>
        {chipData.map((d, i) => (
          <div
            key={d.name}
            style={{
              position: 'absolute',
              left: 300 + i * 460,
              top: CHIP_TOP,
              width: 400,
              height: 190,
              borderRadius: 22,
              background: 'linear-gradient(165deg, rgba(18,28,60,0.94), rgba(10,16,38,0.94))',
              border: `2px solid ${d.c}`,
              boxShadow: `0 0 ${30 + 12 * Math.sin(t * 1.4 + i * 2)}px ${d.c}3a, 0 18px 40px rgba(0,0,0,0.4)`,
              opacity: chips[i],
              translate: `0px ${(1 - chips[i]) * 30 + 4 * Math.sin(t * 1.1 + i * 1.7)}px`,
              textAlign: 'center',
              color: C.ink,
            }}
          >
            <div style={{marginTop: 28, fontFamily: FONT.head, fontSize: 26, letterSpacing: 2, color: d.c, fontWeight: 600, textTransform: 'uppercase'}}>{d.name}</div>
            <div style={{marginTop: 18, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 52, color: d.c}}>{d.f}</div>
          </div>
        ))}
      </div>
      <Formula x={960} y={690} p={fEm * phA} accent={C.gold} size={66} caption="energi mekanik">
        <V>E</V>
        <Sub>m</Sub> = <V color="kin">K</V> + <V color="pot">U</V>
      </Formula>
      <Formula x={960} y={690} p={fCons * phA} accent={C.gold} size={64} caption="berlaku bila hanya gaya konservatif yang melakukan usaha">
        <V color="kin">K</V>
        <Sub>i</Sub> + <V color="pot">U</V>
        <Sub>i</Sub> = <V color="kin">K</V>
        <Sub>f</Sub> + <V color="pot">U</V>
        <Sub>f</Sub>
      </Formula>

      <Stage>
        <defs>
          <linearGradient id="cons-deck" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a3b74" />
            <stop offset="100%" stopColor="#141f45" />
          </linearGradient>
          <linearGradient id="cons-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14204a" />
            <stop offset="100%" stopColor="#0a1130" />
          </linearGradient>
          <linearGradient id="cons-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1c2852" />
            <stop offset="100%" stopColor="#0f1735" />
          </linearGradient>
          <linearGradient id="cons-rope" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.ink} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.ink} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* ---------- fase B ---------- */}
        <g opacity={phB}>
          <g transform={`translate(800 520) scale(${sB}) translate(-800 -520)`}>
            <Ground x1={110} x2={1150} y={FLOOR_Y} />
            {/* struktur penyangga & muka depan */}
            <path d={`${PIPE_D} L${pipePt(RIM).x},${FLOOR_Y} L${pipePt(-RIM).x},${FLOOR_Y} Z`} fill="url(#cons-front)" opacity={0.95} />
            {[-0.8, -0.45, 0, 0.45, 0.8].map((a) => {
              const p = pipePt(a);
              return <line key={a} x1={p.x} y1={p.y + 14} x2={p.x} y2={FLOOR_Y} stroke={C.faint} strokeOpacity={0.5} strokeWidth={3} />;
            })}
            {/* dek (permukaan lengkung dengan kedalaman) */}
            <path d={DECK_D} fill="url(#cons-deck)" opacity={0.9} />
            {RIBS.map((a) => {
              const p = pipePt(a);
              return <line key={a} x1={p.x} y1={p.y} x2={p.x + DEPTH.x} y2={p.y + DEPTH.y} stroke={C.ink} strokeOpacity={0.12} strokeWidth={2} />;
            })}
            <path d={BACK_D} fill="none" stroke={C.muted} strokeOpacity={0.55} strokeWidth={3} />
            <path d={PIPE_D} fill="none" stroke={C.ink} strokeWidth={5} />
            {/* kilau berjalan pelan + kilau di bawah pemain */}
            <path d={arcD(Math.sin(t * 0.45) * 1.1 - 0.12, Math.sin(t * 0.45) * 1.1 + 0.12, 10)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={3} strokeLinecap="round" />
            <path d={arcD(th - 0.16, th + 0.16, 10)} fill="none" stroke={C.kin} strokeOpacity={0.6 * speedB} strokeWidth={8} strokeLinecap="round" />
            {/* pagar tepi (coping) */}
            {[-RIM, RIM].map((a) => {
              const p = pipePt(a);
              return (
                <g key={a}>
                  <line x1={p.x} y1={p.y} x2={p.x + DEPTH.x} y2={p.y + DEPTH.y} stroke={C.muted} strokeWidth={9} strokeLinecap="round" />
                  <line x1={p.x} y1={p.y - 2} x2={p.x + DEPTH.x} y2={p.y + DEPTH.y - 2} stroke="#fff" strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" />
                </g>
              );
            })}
            <line x1={140} y1={startY} x2={1100} y2={startY} stroke={C.gold} strokeWidth={2.5} strokeDasharray="14 10" strokeDashoffset={-t * 12} />
            <Label x={150} y={startY - 26} size={24} color={C.gold} anchor="start" weight={600}>
              ketinggian awal
            </Label>
            <Twinkles x={620} y={startY} rx={460} ry={14} n={4} opacity={phB * win(t, wordOf(5, 'ketinggian'), kT - 0.2, 0.5, 0.6)} seed={7} />
            {/* titik balik: riak kecil */}
            {tb > 0 ? <Ripple x={tip.x} y={tip.y - 50} p={tipP / 0.5} r={70} color="gold" rings={2} width={2.5} /> : null}
            <Glow x={sk.x} y={sk.y} r={130} color="kin" opacity={Kb / 110} />
            <Motes x={sk.x} y={sk.y - 70} rx={150} ry={110} n={14} color="kin" opacity={0.45} seed={11} />
            {/* bayangan gerak (posisi beberapa saat sebelumnya) */}
            {[4, 3, 2, 1].map((k) => {
              const tk = thAt(tb - k * 0.07);
              const pk = pipePt(tk);
              return (
                <g key={k} transform={`translate(${pk.x} ${pk.y}) rotate(${(-tk * 180) / Math.PI})`} opacity={0.16 * (1 - k / 5) * speedB}>
                  <Skater ghost />
                </g>
              );
            })}
            <Spark
              x={sk.x}
              y={sk.y}
              r={5}
              color="kin"
              opacity={Math.min(1, speedB * 1.5)}
              trail={[1, 2, 3, 4, 5, 6, 7].map((k) => {
                const p = pipePt(thAt(tb - k * 0.035));
                return [p.x, p.y] as [number, number];
              })}
            />
            <g transform={`translate(${sk.x} ${sk.y}) rotate(${(-th * 180) / Math.PI})`}>
              {/* garis gerak di belakang pemain */}
              {[-90, -70, -50].map((yy, k) => {
                const dir = Math.sign(-Math.sin((2 * Math.PI * tb) / 4.4)) || 1;
                return <line key={k} x1={-dir * (56 + k * 8)} y1={yy} x2={-dir * (56 + k * 8 + 50 * speedB)} y2={yy} stroke={C.ink} strokeOpacity={0.5 * speedB} strokeWidth={3} strokeLinecap="round" />;
              })}
              <Skater />
            </g>
            {/* hentakan kaki: riak + aliran usaha (hijau) ke batang total */}
            <Ripple x={sk.x} y={sk.y - 20} p={ramp(t, kT, kT + 1.3, (x) => x)} r={150} color="work" />
            <g opacity={kickFlash}>
              <Arrow x1={sk.x - 70} y1={sk.y - 40} x2={sk.x + 70} y2={sk.y - 40} color="work" width={6} />
              <Label x={sk.x} y={sk.y - 80} size={26} color={C.work} weight={600}>
                + usaha kaki
              </Label>
            </g>
          </g>
        </g>
        <EnergyBars
          x={BX}
          y={760}
          height={BH}
          barW={BW}
          gap={BG}
          max={BMAX}
          showValues={false}
          unit=""
          title="ENERGI PEMAIN"
          opacity={barsB}
          bars={[
            {key: 'K', label: ELabel.K, value: Kb, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ub, color: 'pot'},
          ]}
        />
        <g opacity={barsB}>
          <Exchange xK={BX + BW / 2} xU={BX + BW + BG + BW / 2} yK={yOf(Kb)} yU={yOf(Ub)} rate={rateB} ceil={470} opacity={1 - kickFlash * 0.6} seed={2} />
          <Stream
            pts={[
              [sk.x + (sB - 1) * (sk.x - 800), sk.y - 60 + (sB - 1) * (sk.y - 520)],
              [1160, 330],
              [totX + BW / 2, yOf(E) - 14],
            ]}
            color="work"
            n={12}
            speed={0.8}
            r={5.5}
            opacity={kickFlash}
            seed={5}
          />
          <Ripple x={totX + BW / 2} y={yOf(E)} p={ramp(t, kT + 0.5, kT + 1.7, (x) => x)} r={80} color="work" rings={2} />
        </g>

        {/* ---------- fase C ---------- */}
        <g opacity={phC}>
          <g transform={`translate(1150 250) scale(${sC}) translate(-1150 -250)`}>
            {/* langit-langit & penggantung */}
            <rect x={PIV.x - 150} y={PIV.y - 26} width={300} height={26} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 10}, (_, i) => (
              <line key={i} x1={PIV.x - 140 + i * 30} y1={PIV.y - 26} x2={PIV.x - 128 + i * 30} y2={PIV.y - 40} stroke={C.faint} strokeWidth={2} />
            ))}
            <line x1={480} y1={noseY} x2={noseX + 30} y2={noseY} stroke={C.gold} strokeWidth={2.5} strokeDasharray="14 10" strokeDashoffset={-t * 12} opacity={ramp(t, cue(7), cue(7) + 0.6)} />
            <Label x={490} y={noseY - 26} size={24} color={C.gold} anchor="start" weight={600} opacity={ramp(t, cue(7), cue(7) + 0.6)}>
              ketinggian awal
            </Label>
            {peaks.map((a, i) => {
              const x = PIV.x + L * Math.sin(a) + RB;
              const y = PIV.y + L * Math.cos(a);
              return <line key={i} x1={x - 50} y1={y} x2={x + 6} y2={y} stroke={C.heat} strokeWidth={3} opacity={0.8 * lowerNote} />;
            })}
            {/* lintasan bayangan bila didorong */}
            <g opacity={ghostOn}>
              <path d={ghostArc} fill="none" stroke={C.heat} strokeWidth={3} strokeDasharray="8 10" strokeDashoffset={-t * 20} opacity={0.7} />
              <line x1={PIV.x} y1={PIV.y} x2={gx} y2={gy} stroke={C.heat} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" />
              <circle cx={gx} cy={gy} r={RB} fill="none" stroke={C.heat} strokeWidth={4} strokeDasharray="8 6" />
              <Ripple x={noseX} y={noseY} p={ramp(t, cue(9) + 3.0, cue(9) + 4.3, (x) => x)} r={170} color="heat" />
            </g>
            <g opacity={pushArrow}>
              <Arrow x1={g0.x} y1={g0.y} x2={g0.x + 120 * Math.cos(TH_PUSH)} y2={g0.y + 120 * Math.sin(TH_PUSH)} color="work" width={6} />
              <Label x={g0.x - 10} y={g0.y + 70} size={28} color={C.work} weight={700} font="serif" italic>
                +W
              </Label>
            </g>
            <g opacity={1 - 0.65 * ghostOn}>
              <line x1={PIV.x} y1={PIV.y} x2={bx} y2={by} stroke="url(#cons-rope)" strokeWidth={3} />
              <circle cx={PIV.x} cy={PIV.y} r={8} fill={C.ink} />
              <circle cx={PIV.x} cy={PIV.y} r={3} fill={C.bg} />
              <Glow x={bx} y={by} r={150} color="kin" opacity={0.6 * Kc} />
              {/* jejak bola + hambatan udara (butir panas kecil terlepas) */}
              {tau > 0
                ? [6, 5, 4, 3, 2, 1].map((k) => {
                    const a = thetaAt(tau - k * 0.05);
                    return <circle key={k} cx={PIV.x + L * Math.sin(a)} cy={PIV.y + L * Math.cos(a)} r={RB * (1 - k * 0.1)} fill={C.kin} opacity={0.08 * (1 - k / 7) * speedC * 2} />;
                  })
                : null}
              {tau > 0
                ? [1, 2, 3, 4, 5, 6, 7, 8].map((k) => {
                    const a = thetaAt(tau - k * 0.11);
                    const w = Math.abs(thetaAt(tau - k * 0.11 + 0.02) - a) / 0.02;
                    return (
                      <circle
                        key={k}
                        cx={PIV.x + L * Math.sin(a) + 5 * Math.sin(k * 2.3 + t)}
                        cy={PIV.y + L * Math.cos(a) - k * 7}
                        r={2.6}
                        fill={C.heat}
                        opacity={lowerNote * (1 - k / 9) * 0.8 * Math.min(1, w * 1.6)}
                      />
                    );
                  })
                : null}
              {[0, 1, 2].map((k) => {
                const dir = Math.sign(omega) || 1;
                const tx = Math.cos(theta);
                const ty = -Math.sin(theta);
                const o = -dir;
                return (
                  <line
                    key={k}
                    x1={bx + o * tx * (RB + 10) + (k - 1) * 16 * ty}
                    y1={by + o * ty * (RB + 10) - (k - 1) * 16 * tx}
                    x2={bx + o * tx * (RB + 10 + 46 * speedC) + (k - 1) * 16 * ty}
                    y2={by + o * ty * (RB + 10 + 46 * speedC) - (k - 1) * 16 * tx}
                    stroke={C.ink}
                    strokeOpacity={0.45 * speedC}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                );
              })}
              <circle cx={bx} cy={by} r={RB} fill="url(#ball)" stroke={C.ink} strokeOpacity={0.55} strokeWidth={2} />
              <path d={`M${bx - RB * 0.7},${by - RB * 0.35} A${RB * 0.8},${RB * 0.8} 0 0 1 ${bx + RB * 0.2},${by - RB * 0.78}`} fill="none" stroke="#fff" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" />
              <circle cx={bx - 10} cy={by - 12} r={4.5} fill="#0a0f22" />
              <circle cx={bx + 4} cy={by - 17} r={4.5} fill="#0a0f22" />
              <circle cx={bx + 2} cy={by - 3} r={5} fill="#0a0f22" />
            </g>
            {tau > 0 ? <Ripple x={noseX - 70} y={noseY} p={faceTipP / 0.3} r={60} color="gold" rings={2} width={2} /> : null}
            <Face x={noseX + recoil} y={noseY} hit={hit} t={t} fear={fear} />
            <Twinkles x={noseX - 60} y={noseY - 10} rx={60} ry={60} n={5} opacity={safe} seed={9} />
          </g>
        </g>
        <EnergyBars
          x={150}
          y={800}
          height={240}
          barW={62}
          gap={28}
          max={1}
          showValues={false}
          unit=""
          title="ENERGI BOLA"
          opacity={barsC}
          bars={[
            {key: 'K', label: ELabel.K, value: Kc, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Uc, color: 'pot'},
          ]}
        />
        <g opacity={barsC}>
          <Exchange xK={181} xU={271} yK={yC(Kc)} yU={yC(Uc)} rate={tau > 0 ? rateC : 0} ceil={560} opacity={1 - ghostOn * 0.7} seed={8} />
        </g>
      </Stage>
      <Note x={1500} y={300} p={phB * ramp(t, cue(4) + 0.4, cue(4) + 1.1)} color={C.gold} size={28}>
        <Tint c="kin">K</Tint> ⇄ <Tint c="pot">U</Tint>
        <sub>g</sub>, total tetap
      </Note>
      <Note x={1540} y={300} p={phC * lowerNote * (1 - ghostOn)} color={C.heat} size={28}>
        hambatan udara → puncak makin rendah
      </Note>
      <Note x={1540} y={300} p={phC * ghostOn} color={C.heat} size={28}>
        didorong: <Tint c="work">+W</Tint> → melewati batas awal
      </Note>
      <Note x={1540} y={300} p={phC * ramp(t, cue(7) + 0.2, cue(7) + 0.9) * (1 - lowerNote)} color={C.gold} size={28}>
        tanpa dorongan: <Tint c="gold">E</Tint> tidak bertambah
      </Note>
    </AbsoluteFill>
  );
};
