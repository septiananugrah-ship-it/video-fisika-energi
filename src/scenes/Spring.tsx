import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {type Axes, Crate, EnergyBars, ELabel, Ground, Plot, Spring as Coil, fmt, px, py} from '../components/physics';
import {Arrow, Formula, Frac, Label, Note, Stage, Sub, Sup, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Pegas k = 200 N/m, balok 2 kg, skala 600 px/m. Contoh modul: v = 4 m/s → x_maks = 0,40 m, 16 J.
// Saat kontak: x(τ) = (v/ω) sin ωτ dengan ω = √(k/m) = 10 rad/s (gerak lambat, faktor tetap).
const PXM = 600;
const WALL = 160;
const XN = 560; // muka kiri balok saat pegas alami
const FLOOR = 520;
const BW = 140;
const BH = 110;
const K_SPR = 200;
const OMEGA = 10;
const V = 4;
const AX: Axes = {x0: 1130, y0: 720, w: 560, h: 380, xmax: 0.5, ymax: 100};

export const Spring: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  const ph1 = 1 - ramp(t, cue(6) - 0.3, cue(6) + 0.3, EASE_IN_OUT);
  const ph2 = ramp(t, cue(6) + 0.1, cue(6) + 0.7);
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);

  // ---------- fase 1: Hooke & luas segitiga ----------
  const comp = ramp(t, cue(3) + 1.2, cueEnd(3) + 0.2, EASE_IN_OUT); // 0 → 0,40 m
  const d1 =
    150 * ramp(t, cue(1) + 0.6, cue(1) + 1.6, EASE_IN_OUT) -
    300 * ramp(t, wordOf(2, 'ditekan') - 0.1, wordOf(2, 'ditekan') + 0.9, EASE_IN_OUT) +
    150 * ramp(t, cue(3) - 0.2, cue(3) + 0.8, EASE_IN_OUT) -
    0.4 * PXM * comp;
  const c1 = Math.max(0, -d1 / PXM); // tekanan (m), untuk grafik
  const hand = ramp(t, cue(3) + 0.6, cue(3) + 1.2) * (1 - ramp(t, cue(6) - 0.6, cue(6)));
  const graph = ramp(t, cue(3) + 0.3, cue(3) + 1.0);
  const tri = ramp(t, cue(4) + 0.3, cue(4) + 1.4);
  const fHooke = win(t, cue(1) + 0.3, cue(5), 0.7, 0.5);
  const fUs = ramp(t, cue(5) + 0.2, cue(5) + 1.0);

  // ---------- fase 2: balok menabrak pegas ----------
  const tMax = wordOf(7, 'pindah');
  const D = Math.max(3, Math.min(6, tMax - cue(6) - 1));
  const PH_TOTAL = 0.1833 + Math.PI / 20;
  const tB = cue(10) + 2.8;
  let tau = -0.1833 + PH_TOTAL * ramp(t, tMax - D, tMax, (x) => x);
  if (t > tB) tau = Math.PI / 20 + ((t - tB) * PH_TOTAL) / D;
  let xL: number;
  let c2 = 0;
  let vel: number; // m/s, + ke kanan
  if (tau < 0) {
    xL = XN + -tau * V * PXM;
    vel = -V;
  } else if (tau <= Math.PI / OMEGA) {
    c2 = (V / OMEGA) * Math.sin(OMEGA * tau);
    xL = XN - c2 * PXM;
    vel = -V * Math.cos(OMEGA * tau);
  } else {
    xL = XN + (tau - Math.PI / OMEGA) * V * PXM;
    vel = V;
  }
  const K2 = 0.5 * 2 * vel * vel;
  const U2 = 0.5 * K_SPR * c2 * c2;
  const moving = Math.min(1, Math.abs(vel) / 1.5);
  const halfGhost = win(t, cue(9) + 0.2, cue(10), 0.6, 0.5);
  const forceMax = win(t, cue(10) + 0.3, tB + 0.4, 0.5, 0.5);
  const f8 = win(t, cue(8) + 0.2, cue(9), 0.7, 0.5);
  const n9 = win(t, cue(9) + 0.3, cue(10), 0.6, 0.5);
  const n10 = ramp(t, cue(10) + 0.5, cue(10) + 1.2) * (1 - ramp(t, dur - 1.2, dur - 0.5));

  const xBlock1 = XN + d1;
  const springY = FLOOR - BH / 2;
  const vis1 = ph1;
  const vis2 = ph2;
  const fx = (-K_SPR * (d1 / PXM)) * 2.2; // px panah gaya pegas (N × 2,2)

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        {/* dinding & lantai */}
        <rect x={WALL - 34} y={300} width={34} height={FLOOR - 300} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
        {Array.from({length: 7}, (_, i) => (
          <line key={i} x1={WALL - 34} y1={318 + i * 30} x2={WALL - 54} y2={338 + i * 30} stroke={C.faint} strokeWidth={2} />
        ))}
        <Ground x1={WALL - 40} x2={1020} y={FLOOR} />
        {/* panjang alami */}
        <line x1={XN} y1={FLOOR + 10} x2={XN} y2={FLOOR - BH - 50} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" opacity={ramp(t, cue(1), cue(1) + 0.6)} />
        <Label x={XN} y={FLOOR - BH - 72} size={22} color={C.muted} opacity={ramp(t, cue(1), cue(1) + 0.6)}>
          panjang alami
        </Label>

        {/* fase 1 */}
        <g opacity={vis1}>
          <Coil xa={WALL} xb={xBlock1} y={springY} coils={12} amp={24} />
          <Crate x={xBlock1 + BW / 2} y={FLOOR} w={BW} h={BH} color={C.spr} />
          {/* gaya pegas F = −kx */}
          <g opacity={fHooke + fUs * 0.0}>
            <Arrow x1={xBlock1 + BW / 2} y1={FLOOR - BH - 26} x2={xBlock1 + BW / 2 + fx} y2={FLOOR - BH - 26} color="force" width={6} opacity={Math.min(1, Math.abs(fx) / 30)} />
            <Label x={xBlock1 + BW / 2 + fx / 2} y={FLOOR - BH - 60} size={26} color={C.force} weight={600} opacity={Math.min(1, Math.abs(fx) / 30)}>
              F pegas
            </Label>
          </g>
          {/* simpangan x */}
          <g opacity={Math.min(1, Math.abs(d1) / 20)}>
            <Arrow x1={XN} y1={FLOOR + 50} x2={xBlock1} y2={FLOOR + 50} color="spr" width={4} />
            <Label x={(XN + xBlock1) / 2} y={FLOOR + 82} size={28} font="serif" italic color={C.spr}>
              x
            </Label>
          </g>
          {/* gaya tangan menekan */}
          <g opacity={hand}>
            <Arrow x1={xBlock1 + BW + 20 + K_SPR * c1 * 2.2} y1={springY} x2={xBlock1 + BW + 14} y2={springY} color="work" width={6} opacity={Math.min(1, c1 * 20)} />
            <Label x={xBlock1 + BW + 40 + K_SPR * c1 * 1.1} y={springY - 38} size={24} color={C.work} weight={600} opacity={Math.min(1, c1 * 20)}>
              {`tangan: ${fmt(K_SPR * c1)} N`}
            </Label>
          </g>
          {/* grafik F–x */}
          <g opacity={graph}>
            <Plot a={AX} xLabel="x (m)" yLabel="F (N)" xTicks={[0.1, 0.2, 0.3, 0.4]} yTicks={[20, 40, 60, 80]} />
            <polygon points={`${px(AX, 0)},${py(AX, 0)} ${px(AX, 0.4)},${py(AX, 0)} ${px(AX, 0.4)},${py(AX, 80)}`} fill={C.spr} opacity={0.35 * tri} />
            <line x1={px(AX, 0)} y1={py(AX, 0)} x2={px(AX, c1)} y2={py(AX, K_SPR * c1)} stroke={C.spr} strokeWidth={5} strokeLinecap="round" />
            <circle cx={px(AX, c1)} cy={py(AX, K_SPR * c1)} r={9} fill={C.force} opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.4)} />
            <Label x={px(AX, 0.4) + 14} y={py(AX, 80)} size={26} font="serif" italic color={C.force} anchor="start" opacity={tri}>
              kx
            </Label>
            <Label x={px(AX, 0.28)} y={py(AX, 16)} size={28} color={C.ink} weight={600} opacity={tri}>
              luas = ½ · x · kx
            </Label>
          </g>
        </g>

        {/* fase 2 */}
        <g opacity={vis2}>
          <Coil xa={WALL} xb={Math.min(XN, xL)} y={springY} coils={12} amp={24} />
          {/* bayangan setengah tekanan */}
          <g opacity={halfGhost}>
            <rect x={XN - 0.2 * PXM} y={FLOOR - BH} width={BW} height={BH} rx={12} fill="none" stroke={C.spr} strokeWidth={3} strokeDasharray="10 8" />
            <Label x={XN - 0.2 * PXM + BW / 2} y={FLOOR - BH - 30} size={24} color={C.spr} weight={600}>
              x = 0,20 m
            </Label>
          </g>
          <Crate x={xL + BW / 2} y={FLOOR} w={BW} h={BH} label="2 kg" color={C.kin} />
          <g opacity={moving * (1 - halfGhost)}>
            <Arrow x1={xL + BW / 2} y1={FLOOR - BH - 30} x2={xL + BW / 2 + vel * 30} y2={FLOOR - BH - 30} color="kin" width={6} />
            <Label x={xL + BW / 2 + vel * 15} y={FLOOR - BH - 62} size={24} font="mono" color={C.kin} weight={600}>
              {`${fmt(Math.abs(vel), 1)} m/s`}
            </Label>
          </g>
          <g opacity={forceMax}>
            <Arrow x1={xL - 4} y1={springY + 70} x2={xL + 180} y2={springY + 70} color="force" width={7} />
            <Label x={xL + 90} y={springY + 110} size={28} font="mono" color={C.force} weight={600}>
              kx = 80 N
            </Label>
          </g>
          <Label x={840} y={FLOOR + 64} size={22} color={C.muted} opacity={ramp(t, cue(6) + 0.6, cue(6) + 1.2)}>
            lantai licin · gerak diperlambat
          </Label>
        </g>
        <EnergyBars
          x={1180}
          y={760}
          height={260}
          barW={80}
          gap={34}
          max={16}
          title="ENERGI BALOK + PEGAS"
          opacity={vis2}
          bars={[
            {key: 'K', label: ELabel.K, value: K2, color: 'kin'},
            {key: 'Us', label: ELabel.Us, value: U2, color: 'spr'},
          ]}
        />
      </Stage>
      <Formula x={560} y={740} p={fHooke * vis1} accent={C.force} size={66} caption="tanda minus: gaya pemulih, melawan simpangan">
        <V color="force">F</V> = − <V>k</V> <V color="spr">x</V>
      </Formula>
      <Formula x={560} y={740} p={fUs * vis1} accent={C.spr} size={66}>
        <V color="spr">U</V>
        <Sub>s</Sub> = <Frac n={<>1</>} d={<>2</>} />
        <V>k</V> <V color="spr">x</V>
        <Sup>2</Sup>
      </Formula>
      <Formula x={1440} y={270} p={f8 * vis2} accent={C.spr} size={56}>
        <Frac n={<>1</>} d={<>2</>} />
        (200) <V color="spr">x</V>
        <Sup>2</Sup> = 16 ⇒ <V color="spr">x</V> = 0,40 m
      </Formula>
      <Note x={1440} y={270} p={n9 * vis2} color={C.spr} size={30}>
        <V>x</V> = 0,20 m → <Tint c="spr">U<sub>s</sub> = 4 J</Tint> = ¼ × 16 J
      </Note>
      <Note x={1440} y={270} p={n10 * vis2} color={C.force} size={30}>
        <Tint c="kin">v = 0</Tint>, tetapi <Tint c="force">F = 80 N</Tint> → bukan setimbang
      </Note>
      <Note x={560} y={740} p={vis2 * ramp(t, wordOf(7, 'enam') - 0.2, wordOf(7, 'enam') + 0.5) * (1 - ramp(t, cue(8), cue(8) + 0.5))} color={C.kin} size={30}>
        <Tint c="kin">K</Tint> = ½ (2)(4)² = 16 J
      </Note>
    </AbsoluteFill>
  );
};
