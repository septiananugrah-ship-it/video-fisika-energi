import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Ball, EnergyBars, ELabel, Ground, fmt} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Sqrt, Stage, Stream, Sub, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bola dilempar vertikal ke atas: v0 = 20 m/s, g = 10 m/s², m = 1 kg (misal) → E = 200 J.
// Kinematika nyata y = 20τ − 5τ², v = 20 − 10τ; waktu fisika τ dipetakan ke narasi
// dengan laju tetap per segmen (gerak lambat), energi selalu konsisten.
type P = [number, number];
const GROUND = 820;
const PXM = 30; // 20 m → 600 px (puncak di y = 220)
const BX = 600;
const V0 = 20;
const G = 10;
const M = 1;
// batang energi
const EB_X = 1120;
const EB_Y = 800;
const EB_H = 260;
const EB_W = 80;
const EB_GAP = 34;

const yOf = (tau: number) => V0 * tau - 0.5 * G * tau * tau;
const vOf = (tau: number) => V0 - G * tau;

/** Titik-titik busur kuadratik dari a ke b. */
const arc = (a: P, b: P, lift: number, n = 14): P[] => {
  const c: P = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const m = 1 - s;
    return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1]];
  });
};

/** Awan tipis yang melayang pelan (latar). */
const Cloud: React.FC<{x: number; y: number; s: number; op: number}> = ({x, y, s, op}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
    <ellipse cx={0} cy={0} rx={70} ry={22} fill={C.ink} />
    <ellipse cx={-30} cy={-14} rx={34} ry={22} fill={C.ink} />
    <ellipse cx={18} cy={-20} rx={38} ry={26} fill={C.ink} />
  </g>
);

export const Gravity: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  // naik: τ 0→2 selama baris 3 (puncak tepat awal baris 4); turun ke 15 m (τ = 3) selama baris 6; lalu ke tanah
  const tauAt = (tt: number) =>
    2 * ramp(tt, cue(3) + 0.2, cue(4) + 0.3, (x) => x) + ramp(tt, cue(6) + 0.3, cueEnd(6) - 0.4, (x) => x) + ramp(tt, cue(7) + 2.6, cue(7) + 4.4, (x) => x);
  const tau = tauAt(t);
  const dTau = (tauAt(t + 1 / 30) - tau) * 30; // laju waktu fisika (0 saat bola "diam" menunggu narasi)
  const y = Math.max(0, yOf(tau));
  const v = vOf(tau);
  const by = GROUND - y * PXM - 26;
  const K = 0.5 * M * v * v;
  const U = M * G * y;
  const landT = cue(7) + 4.4;

  const ballIn = ramp(t, cue(1) - 0.2, cue(1) + 0.5);
  const aim = win(t, cue(1) + 0.4, cue(3) + 0.6, 0.5, 0.5);
  const bars = ramp(t, cue(2), cue(2) + 0.8);
  const f0 = win(t, cue(0) + 0.3, cue(5), 0.7, 0.5);
  const f1 = win(t, cue(5) + 0.2, cue(6) + 0.2, 0.7, 0.5);
  const f2 = ramp(t, cue(6) + 0.4, cue(6) + 1.2);
  const top = win(t, cue(4) + 0.2, cue(6), 0.5, 0.5);
  const at15 = ramp(t, cue(6) + 0.4, cue(6) + 1.0);
  const upGhost = ramp(t, cue(7) + 0.3, cue(7) + 1.0);
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);
  const y15 = GROUND - 15 * PXM - 26;

  // kamera: dorong pelan ke puncak (baris 4–5)
  const zoom = ramp(t, cue(4) - 0.2, cue(4) + 1.4, EASE_IN_OUT) * (1 - ramp(t, cue(5) + 0.6, cue(5) + 2.2, EASE_IN_OUT));
  const zs = 1 + 0.07 * zoom;
  const ZC: P = [620, 520];

  // penunjuk tinggi y pada penggaris (baris 0): naik-turun pelan
  const ptrOp = win(t, cue(0) + 1.6, cue(1) - 0.2, 0.7, 0.6);
  const yPtr = 10 - 10 * Math.cos((2 * Math.PI * Math.max(0, t - cue(0) - 1.6)) / 5.5);
  const yPtrPx = GROUND - yPtr * PXM;
  const zeroPulse = win(t, wordOf(0, 'nol') - 0.2, wordOf(0, 'nol') + 1.6, 0.3, 0.8);

  // aliran energi antar-batang: naik K → Ug, turun Ug → K (tidak mengalir saat bola diam)
  const flow = ballIn * bars * Math.min(1, dTau / 0.12) * Math.min(1, Math.abs(v) / 4);
  const up = flow * Math.max(0, Math.min(1, v / 2));
  const down = flow * Math.max(0, Math.min(1, -v / 2));
  const topK = EB_Y - (K / 200) * EB_H;
  const topU = EB_Y - (U / 200) * EB_H;
  const kInner: P = [EB_X + EB_W - 6, topK + 4];
  const uInner: P = [EB_X + EB_W + EB_GAP + 6, topU + 4];

  // jejak titik tiap 0,25 dtk fisika
  const dots = Array.from({length: 17}, (_, i) => i * 0.25).filter((s) => s <= tau + 1e-6);
  const trail = Array.from({length: 7}, (_, k) => {
    const tk = Math.max(0, tau - (k + 1) * 0.045);
    return [BX, GROUND - Math.max(0, yOf(tk)) * PXM - 26] as P;
  });
  const speed = Math.min(1, Math.abs(v) / 20) * Math.min(1, dTau / 0.12);
  const spin = tau * 260;

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        {/* latar: awan tipis melayang */}
        <Cloud x={470 + 7 * t} y={300} s={1} op={0.05} />
        <Cloud x={860 + 5 * t} y={430} s={0.75} op={0.04} />
        <Cloud x={250 + 6 * t} y={560} s={0.6} op={0.035} />
        <Motes x={BX} y={by} rx={140} ry={110} n={16} color="kin" opacity={0.45 * ballIn} seed={5} />

        <g transform={`translate(${ZC[0]} ${ZC[1]}) scale(${zs}) translate(${-ZC[0]} ${-ZC[1]})`}>
          <Ground x1={180} x2={1000} y={GROUND} />
          {/* penggaris tinggi */}
          <g opacity={ramp(t, cue(0) + 0.6, cue(0) + 1.4)}>
            <line x1={380} y1={GROUND} x2={380} y2={GROUND - 20 * PXM - 20} stroke={C.muted} strokeWidth={3} />
            {[0, 5, 10, 15, 20].map((m) => (
              <g key={m}>
                <line x1={366} y1={GROUND - m * PXM} x2={394} y2={GROUND - m * PXM} stroke={C.muted} strokeWidth={3} />
                <Label x={350} y={GROUND - m * PXM} size={24} font="mono" color={C.muted} anchor="end">
                  {`${m} m`}
                </Label>
              </g>
            ))}
            {Array.from({length: 20}, (_, m) =>
              m % 5 ? <line key={`t${m}`} x1={372} y1={GROUND - m * PXM} x2={388} y2={GROUND - m * PXM} stroke={C.faint} strokeWidth={2} /> : null,
            )}
            <Label x={380} y={GROUND - 20 * PXM - 46} size={28} font="serif" italic color={C.pot}>
              y
            </Label>
            <Glow x={470} y={GROUND + 34} r={70} color="work" opacity={zeroPulse} />
            <Label x={470} y={GROUND + 34} size={22 * (1 + 0.15 * zeroPulse)} color={C.work} weight={600}>
              y = 0
            </Label>
          </g>
          {/* penunjuk y yang naik-turun */}
          <g opacity={ptrOp}>
            <line x1={396} y1={yPtrPx} x2={BX + 60} y2={yPtrPx} stroke={C.pot} strokeOpacity={0.12} strokeWidth={14} />
            <line x1={396} y1={yPtrPx} x2={BX + 60} y2={yPtrPx} stroke={C.pot} strokeWidth={2.5} strokeDasharray="8 8" strokeDashoffset={-t * 20} />
            <path d={`M398,${yPtrPx} l16,-10 v20 Z`} fill={C.pot} />
            <Glow x={BX} y={yPtrPx - 26} r={60 + 50 * (yPtr / 20)} color="pot" opacity={0.3 + 0.7 * (yPtr / 20)} />
            <circle cx={BX} cy={yPtrPx - 26} r={26} fill="none" stroke={C.pot} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={t * 12} />
            <Label x={BX + 70} y={yPtrPx - 26} size={26} font="mono" color={C.pot} anchor="start" weight={600}>
              {`y = ${fmt(yPtr, 1)} m`}
            </Label>
          </g>
          {/* garis 15 m dan puncak 20 m */}
          <g opacity={at15}>
            <line x1={400} y1={GROUND - 15 * PXM} x2={980} y2={GROUND - 15 * PXM} stroke={C.gold} strokeWidth={2.5} strokeDasharray="12 9" />
          </g>
          <g opacity={top}>
            <line x1={400} y1={GROUND - 20 * PXM} x2={980} y2={GROUND - 20 * PXM} stroke={C.pot} strokeWidth={2.5} strokeDasharray="12 9" />
            <Label x={680} y={GROUND - 20 * PXM - 30} size={28} color={C.pot} anchor="start" weight={600}>
              v = 0 sesaat
            </Label>
          </g>
          {dots.map((s) => (
            <circle key={s} cx={BX} cy={GROUND - yOf(s) * PXM - 26} r={4} fill={vOf(s) >= 0 ? C.kin : C.cyan} opacity={0.35} />
          ))}
          {/* landasan lempar & bayangan bola */}
          <ellipse cx={BX} cy={GROUND + 2} rx={30 * (1 - Math.min(0.8, y / 25))} ry={6 * (1 - Math.min(0.8, y / 25))} fill="#000" opacity={ballIn * 0.5 * (1 - Math.min(0.85, y / 20))} />
          <Ripple x={BX} y={GROUND - 6} p={ramp(t, cue(3) + 0.15, cue(3) + 1.4)} r={110} color="kin" />
          <Ripple x={BX} y={GROUND - 6} p={ramp(t, landT - 0.05, landT + 1.3)} r={120} color="kin" />
          <Glow x={BX} y={by} r={120} color="kin" opacity={(K / 200) * ballIn} />
          <Glow x={BX} y={by} r={110} color="pot" opacity={(U / 200) * ballIn * 0.8} />
          {/* bayangan bola di 15 m: naik (kanan) dan turun (tengah) */}
          <g opacity={upGhost}>
            <circle cx={BX + 130} cy={y15} r={26} fill="none" stroke={C.kin} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={-t * 14} />
            <Glow x={BX + 130} y={y15} r={56} color="kin" opacity={0.6} />
            <Arrow x1={BX + 130} y1={y15 - 34} x2={BX + 130} y2={y15 - 34 - 90 - 8 * Math.sin(t * 3.5)} color="kin" width={5} />
            <Label x={BX + 156} y={y15 - 90} size={26} font="mono" color={C.kin} anchor="start" weight={600}>
              10 m/s
            </Label>
            <g opacity={ramp(t, cue(7) + 2.8, cue(7) + 3.3)}>
              <circle cx={BX} cy={y15} r={26} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={t * 14} />
              <Glow x={BX} y={y15} r={56} color="cyan" opacity={0.6} />
            </g>
          </g>
          {/* jejak gerak + bola berputar */}
          {trail.map(([tx, ty], k) => (
            <circle key={k} cx={tx} cy={ty} r={24 * (1 - (k + 1) / 9)} fill={v >= 0 ? C.kin : C.cyan} opacity={0.22 * (1 - k / 7) * speed * ballIn} />
          ))}
          <Ball x={BX} y={by} r={26} opacity={ballIn} />
          <g opacity={ballIn * 0.55} transform={`rotate(${spin} ${BX} ${by})`}>
            <path d={`M${BX - 22},${by - 8} Q${BX},${by + 6} ${BX + 22},${by - 8}`} fill="none" stroke={C.ink} strokeWidth={2} />
            <path d={`M${BX - 18},${by + 12} Q${BX},${by + 22} ${BX + 18},${by + 12}`} fill="none" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} />
          </g>
          <Ripple x={BX} y={GROUND - 20 * PXM - 26} p={ramp(t, cue(4) + 0.1, cue(4) + 1.6)} r={140} color="pot" />
          {/* panah kecepatan bola */}
          <g opacity={ballIn * (1 - aim) * (1 - win(t, cue(7) + 0.2, cue(7) + 2.5, 0.5, 0.5)) * Math.min(1, Math.abs(v) / 3) * ramp(t, cue(3), cue(3) + 0.4) * Math.min(1, y / 1.5 + (v > 0 ? 1 : 0))}>
            <Arrow x1={BX + 50} y1={by} x2={BX + 50} y2={by - v * 6} color={v >= 0 ? 'kin' : 'cyan'} width={5} />
          </g>
          <g opacity={aim * ballIn}>
            <Arrow x1={BX} y1={by - 34} x2={BX} y2={by - 34 - 160 - 10 * Math.sin(t * 3)} color="kin" width={6} />
            <Label x={BX + 24} y={by - 150} size={30} font="mono" color={C.kin} anchor="start" weight={600}>
              v₀ = 20 m/s
            </Label>
          </g>
          <g opacity={at15}>
            <Arrow x1={BX - 60} y1={y15 - 50} x2={BX - 60} y2={y15 + 50 + 8 * Math.sin(t * 3.5 + 1)} color="cyan" width={5} opacity={upGhost} />
            <Label x={BX - 84} y={y15 + 10} size={26} font="mono" color={C.cyan} anchor="end" weight={600} opacity={upGhost}>
              10 m/s
            </Label>
          </g>
          <Label x={990} y={GROUND - 15 * PXM - 24} size={24} color={C.gold} anchor="end" weight={600} opacity={at15}>
            y = 15 m
          </Label>
          {/* angka langsung */}
          <g opacity={bars}>
            <Label x={BX + 80} y={GROUND - 40} size={24} font="mono" color={C.muted} anchor="start">
              {`y = ${fmt(y, 1)} m   v = ${fmt(Math.abs(v), 1)} m/s`}
            </Label>
          </g>
        </g>

        <Stream pts={arc(kInner, uInner, 26)} color="kin" n={6} speed={0.9} r={4} opacity={up} seed={1} />
        <Stream pts={arc(uInner, kInner, 26)} color="pot" n={6} speed={0.9} r={4} opacity={down} seed={2} />
        <EnergyBars
          x={EB_X}
          y={EB_Y}
          height={EB_H}
          barW={EB_W}
          gap={EB_GAP}
          max={200}
          title="ENERGI BOLA (m = 1 kg, misal)"
          opacity={bars}
          bars={[
            {key: 'K', label: ELabel.K, value: K, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: U, color: 'pot'},
          ]}
        />
        <Glow x={1400} y={300} r={300} color="pot" opacity={f1 * 0.5} />
      </Stage>
      <Formula x={1400} y={300} p={f0} accent={C.pot} size={66} caption="y diukur dari titik nol pilihan kita">
        <V color="pot">U</V>
        <Sub>g</Sub> = <V>m</V> <V>g</V> <V>y</V>
      </Formula>
      <Formula x={1400} y={300} p={f1} accent={C.pot} size={56}>
        <Frac n={<>1</>} d={<>2</>} />
        <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup> = <V>g</V> <V>h</V> ⇒ <V>h</V> ={' '}
        <Frac
          n={
            <>
              20<Sup>2</Sup>
            </>
          }
          d={<>20</>}
        />{' '}
        = 20 m
      </Formula>
      <Formula x={1400} y={300} p={f2 * (1 - ramp(t, dur - 1.2, dur - 0.5))} accent={C.gold} size={56}>
        <V>v</V> = <Sqrt>400 − 2·10·15</Sqrt> = 10 m/s
      </Formula>
      <Note x={1400} y={420} p={ramp(t, wordOf(7, 'arah') - 0.3, wordOf(7, 'arah') + 0.4)} color={C.gold} size={28}>
        energi → <Tint c="kin">seberapa cepat</Tint>, bukan <Tint c="cyan">ke arah mana</Tint>
      </Note>
      {/* penanda sisa pada puncak */}
      <Note x={1400} y={420} p={top * ramp(t, cue(4) + 0.6, cue(4) + 1.2) * (1 - ramp(t, cue(5) + 0.2, cue(5) + 0.7))} color={C.pot} size={28}>
        semua <Tint c="kin">K</Tint> → <Tint c="pot">U</Tint>
        <sub>g</sub>
      </Note>
      <Stage>
        <Twinkles x={1720} y={300} rx={70} ry={56} n={5} color="gold" opacity={f1 * ramp(t, wordOf(5, 'meter') - 0.3, wordOf(5, 'meter') + 0.4)} seed={4} />
      </Stage>
    </AbsoluteFill>
  );
};
