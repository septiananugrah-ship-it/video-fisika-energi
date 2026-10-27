import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Ball, EnergyBars, ELabel, Ground, fmt} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Note, Sqrt, Stage, Sub, Sup, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Bola dilempar vertikal ke atas: v0 = 20 m/s, g = 10 m/s², m = 1 kg (misal) → E = 200 J.
// Kinematika nyata y = 20τ − 5τ², v = 20 − 10τ; waktu fisika τ dipetakan ke narasi
// dengan laju tetap per segmen (gerak lambat), energi selalu konsisten.
const GROUND = 820;
const PXM = 30; // 20 m → 600 px (puncak di y = 220)
const BX = 600;
const V0 = 20;
const G = 10;
const M = 1;

const yOf = (tau: number) => V0 * tau - 0.5 * G * tau * tau;
const vOf = (tau: number) => V0 - G * tau;

export const Gravity: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  // naik: τ 0→2 selama baris 3 (puncak tepat awal baris 4); turun ke 15 m (τ = 3) selama baris 6; lalu ke tanah
  const rise = ramp(t, cue(3) + 0.2, cue(4) + 0.3, (x) => x);
  const down1 = ramp(t, cue(6) + 0.3, cueEnd(6) - 0.4, (x) => x);
  const down2 = ramp(t, cue(7) + 2.6, cue(7) + 4.4, (x) => x);
  const tau = 2 * rise + down1 + down2;
  const y = Math.max(0, yOf(tau));
  const v = vOf(tau);
  const by = GROUND - y * PXM - 26;
  const K = 0.5 * M * v * v;
  const U = M * G * y;

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

  // jejak titik tiap 0,25 dtk fisika
  const dots = Array.from({length: 17}, (_, i) => i * 0.25).filter((s) => s <= tau + 1e-6);

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
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
          <Label x={380} y={GROUND - 20 * PXM - 46} size={28} font="serif" italic color={C.pot}>
            y
          </Label>
          <Label x={470} y={GROUND + 34} size={22} color={C.work} weight={600}>
            y = 0
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
        <Glow x={BX} y={by} r={120} color="kin" opacity={(K / 200) * ballIn} />
        {/* bayangan bola di 15 m: naik (kanan) dan turun (tengah) */}
        <g opacity={upGhost}>
          <circle cx={BX + 130} cy={y15} r={26} fill="none" stroke={C.kin} strokeWidth={3} strokeDasharray="6 6" />
          <Arrow x1={BX + 130} y1={y15 - 34} x2={BX + 130} y2={y15 - 34 - 90} color="kin" width={5} />
          <Label x={BX + 156} y={y15 - 90} size={26} font="mono" color={C.kin} anchor="start" weight={600}>
            10 m/s
          </Label>
          <circle cx={BX} cy={y15} r={26} fill="none" stroke={C.cyan} strokeWidth={3} strokeDasharray="6 6" opacity={ramp(t, cue(7) + 2.8, cue(7) + 3.3)} />
        </g>
        <Ball x={BX} y={by} r={26} opacity={ballIn} />
        {/* panah kecepatan bola */}
        <g opacity={ballIn * (1 - aim) * Math.min(1, Math.abs(v) / 3) * ramp(t, cue(3), cue(3) + 0.4) * Math.min(1, y / 1.5 + (v > 0 ? 1 : 0))}>
          <Arrow x1={BX + 50} y1={by} x2={BX + 50} y2={by - v * 6} color="kin" width={5} />
        </g>
        <g opacity={aim * ballIn}>
          <Arrow x1={BX} y1={by - 34} x2={BX} y2={by - 34 - 160} color="kin" width={6} />
          <Label x={BX + 24} y={by - 150} size={30} font="mono" color={C.kin} anchor="start" weight={600}>
            v₀ = 20 m/s
          </Label>
        </g>
        <g opacity={at15}>
          <Arrow x1={BX - 60} y1={y15 - 50} x2={BX - 60} y2={y15 + 50} color="cyan" width={5} opacity={upGhost} />
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
        <EnergyBars
          x={1120}
          y={800}
          height={260}
          barW={80}
          gap={34}
          max={200}
          title="ENERGI BOLA (m = 1 kg, misal)"
          opacity={bars}
          bars={[
            {key: 'K', label: ELabel.K, value: K, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: U, color: 'pot'},
          ]}
        />
      </Stage>
      <Formula x={1400} y={300} p={f0} accent={C.pot} size={66} caption="y diukur dari titik nol pilihan kita">
        <V color="pot">U</V>
        <Sub>g</Sub> = <V>m</V> <V>g</V> <V>y</V>
      </Formula>
      <Formula x={1400} y={300} p={f1} accent={C.pot} size={56}>
        <Frac n={<>1</>} d={<>2</>} />
        <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup> = <V>g</V> <V>h</V> ⇒ <V>h</V> = <Frac n={<>20<Sup>2</Sup></>} d={<>20</>} /> = 20 m
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
    </AbsoluteFill>
  );
};
