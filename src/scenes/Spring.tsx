import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {type Axes, Crate, EnergyBars, ELabel, Ground, Plot, Spring as Coil, fmt, px, py} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, TSub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Pegas k = 200 N/m, balok 2 kg, skala 600 px/m. Contoh modul: v = 4 m/s → x_maks = 0,40 m, 16 J.
// Saat kontak: x(τ) = (v/ω) sin ωτ dengan ω = √(k/m) = 10 rad/s (gerak lambat, faktor tetap per tahap).
type P = [number, number];
const PXM = 600;
const WALL = 160;
const XN = 560; // muka kiri balok saat pegas alami
const FLOOR = 520;
const BW = 140;
const BH = 110;
const K_SPR = 200;
const OMEGA = 10;
const V0 = 4;
const AX: Axes = {x0: 1130, y0: 720, w: 560, h: 380, xmax: 0.5, ymax: 100};
const AU: Axes = {x0: 300, y0: 840, w: 470, h: 200, xmax: 0.45, ymax: 18};
const EB_X = 1270;
const EB_Y = 760;
const EB_H = 260;
const EB_W = 80;
const EB_GAP = 34;
const TRI = `M${px(AX, 0)},${py(AX, 0)} L${px(AX, 0.4)},${py(AX, 0)} L${px(AX, 0.4)},${py(AX, 80)} Z`;
const US_CURVE = Array.from({length: 61}, (_, i) => {
  const x = (0.42 * i) / 60;
  return `${i ? 'L' : 'M'}${px(AU, x).toFixed(1)},${py(AU, 100 * x * x).toFixed(1)}`;
}).join(' ');

/** Titik-titik busur kuadratik dari a ke b. */
const arc = (a: P, b: P, lift: number, n = 14): P[] => {
  const c: P = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  return Array.from({length: n + 1}, (_, i) => {
    const s = i / n;
    const m = 1 - s;
    return [m * m * a[0] + 2 * m * s * c[0] + s * s * b[0], m * m * a[1] + 2 * m * s * c[1] + s * s * b[1]];
  });
};

/** Cairan yang mengisi bentuk (clip) dari dasar yFrom naik ke yTo, permukaan beriak + gelembung. */
const Liquid: React.FC<{id: string; clip: string; x1: number; x2: number; yFrom: number; yTo: number; p: number; color: string; t: number}> = ({
  id,
  clip,
  x1,
  x2,
  yFrom,
  yTo,
  p,
  color,
  t,
}) => {
  if (p <= 0.001) return null;
  const level = mix(yFrom, yTo, p);
  const amp = 2 + 5 * Math.sin(Math.PI * Math.min(1, p));
  const top = Array.from({length: 17}, (_, k) => {
    const x = x1 + ((x2 - x1) * k) / 16;
    const y = level + amp * Math.sin(t * 3.1 + k * 0.85) * Math.sin(t * 1.3 + k * 0.3 + 1);
    return `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={clip} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <path d={`${top} L${x2},${yFrom} L${x1},${yFrom} Z`} fill={color} opacity={0.42} />
        <path d={top} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2.5} />
        {Array.from({length: 5}, (_, k) => {
          const ph = (((t * (0.2 + 0.05 * k) + k * 0.37) % 1) + 1) % 1;
          const bx = x1 + (x2 - x1) * (0.55 + 0.4 * ((k * 0.618) % 1)) + 5 * Math.sin(t * 2 + k);
          return <circle key={k} cx={bx} cy={yFrom - ph * (yFrom - level)} r={2.5 + (k % 3)} fill="#fff" opacity={0.3 * cyc(ph)} />;
        })}
      </g>
    </g>
  );
};

/** Pegas yang berpendar makin terang saat makin tertekan/teregang (e: 0..1). */
const GlowCoil: React.FC<{xb: number; y: number; e: number; t: number}> = ({xb, y, e, t}) => {
  const col = interpolateColors(Math.min(1, e), [0, 1], [C.spr, '#efe2ff']);
  const len = Math.abs(xb - WALL);
  const mid = (WALL + xb) / 2;
  return (
    <g>
      <Glow x={mid} y={y} r={70 + len * 0.45} color="spr" opacity={Math.min(1, e) * (0.85 + 0.15 * Math.sin(t * 3))} />
      <Coil xa={WALL} xb={xb} y={y} coils={12} amp={24} color={col} width={5 + 1.5 * Math.min(1, e)} />
      <Motes x={mid} y={y} rx={Math.max(20, len / 2)} ry={30} n={12} color="spr" opacity={0.7 * Math.min(1, e)} seed={11} />
      {/* kilau yang merambat pelan sepanjang pegas */}
      <Stream pts={[[WALL + 24, y], [xb - 24, y]]} color="spr" n={2} speed={0.3} r={4} jitter={0} opacity={0.55} seed={4} />
    </g>
  );
};

export const Spring: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();
  const ph1 = 1 - ramp(t, cue(6) - 0.3, cue(6) + 0.3, EASE_IN_OUT);
  const ph2 = ramp(t, cue(6) + 0.1, cue(6) + 0.7);
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);

  // ---------- fase 1: Hooke & luas segitiga ----------
  const compAt = (tt: number) => ramp(tt, cue(3) + 1.2, cueEnd(3) + 0.2, EASE_IN_OUT); // 0 → 0,40 m
  const comp = compAt(t);
  const compRate = (compAt(t + 1 / 30) - comp) * 30;
  // balok baru diletakkan: sedikit bergoyang lalu tenang
  const settle = t > 0.4 ? 12 * Math.exp(-(t - 0.4) / 1.0) * Math.sin(2 * Math.PI * 1.4 * (t - 0.4)) : 0;
  const d1 =
    settle +
    150 * ramp(t, cue(1) + 0.6, cue(1) + 1.6, EASE_IN_OUT) -
    300 * ramp(t, wordOf(2, 'ditekan') - 0.1, wordOf(2, 'ditekan') + 0.9, EASE_IN_OUT) +
    150 * ramp(t, cue(3) - 0.2, cue(3) + 0.8, EASE_IN_OUT) -
    0.4 * PXM * comp;
  const c1 = Math.max(0, -d1 / PXM); // tekanan (m), untuk grafik
  const e1 = Math.abs(d1) / (0.4 * PXM);
  const hand = ramp(t, cue(3) + 0.6, cue(3) + 1.2) * (1 - ramp(t, cue(6) - 0.6, cue(6)));
  const graph = ramp(t, cue(3) + 0.3, cue(3) + 1.0);
  const tri = ramp(t, cue(4) + 0.3, cue(4) + 1.9, EASE_IN_OUT);
  const fHooke = win(t, cue(1) + 0.3, cue(5), 0.7, 0.5);
  const fUs = ramp(t, cue(5) + 0.2, cue(5) + 1.0);

  // ---------- fase 2: balok menabrak pegas ----------
  const tMax = wordOf(7, 'pindah');
  const D1 = Math.max(3, tMax - cue(6) - 0.8); // meluncur + menekan (gerak lambat)
  const D2 = Math.max(3, Math.min(6, D1)); // terlempar balik (lebih cepat)
  const PH_TOTAL = 0.1833 + Math.PI / 20;
  const tB = cue(10) + 2.8;
  const tauAt = (tt: number) => (tt > tB ? Math.PI / 20 + ((tt - tB) * PH_TOTAL) / D2 : -0.1833 + PH_TOTAL * ramp(tt, tMax - D1, tMax, (x) => x));
  const tau = tauAt(t);
  let xL: number;
  let c2 = 0;
  let vel: number; // m/s, + ke kanan
  if (tau < 0) {
    xL = XN + -tau * V0 * PXM;
    vel = -V0;
  } else if (tau <= Math.PI / OMEGA) {
    c2 = (V0 / OMEGA) * Math.sin(OMEGA * tau);
    xL = XN - c2 * PXM;
    vel = -V0 * Math.cos(OMEGA * tau);
  } else {
    xL = XN + (tau - Math.PI / OMEGA) * V0 * PXM;
    vel = V0;
  }
  const running = Math.min(1, ((tauAt(t + 1 / 30) - tau) * 30) / 0.01); // 0 saat waktu "dibekukan"
  const K2 = 0.5 * 2 * vel * vel;
  const U2 = 0.5 * K_SPR * c2 * c2;
  const e2 = c2 / 0.4;
  const moving = Math.min(1, Math.abs(vel) / 1.5);
  const halfGhost = win(t, cue(9) + 0.2, cue(10), 0.6, 0.5);
  const forceMax = win(t, cue(10) + 0.3, tB + 0.4, 0.5, 0.5);
  const f8 = win(t, cue(8) + 0.2, cue(9), 0.7, 0.5);
  const n9 = win(t, cue(9) + 0.3, cue(10), 0.6, 0.5);
  const n10 = ramp(t, cue(10) + 0.5, cue(10) + 1.2) * (1 - ramp(t, dur - 1.2, dur - 0.5));
  const exitFade = tau > Math.PI / OMEGA ? 1 - ramp(xL, 880, 990, (x) => x) : 1;
  // aliran energi: menekan K → Us, melepas Us → K
  const contact = Math.min(1, c2 * 40) * running;
  const fIn = contact * Math.min(1, Math.max(0, -vel) / 0.6);
  const fOut = contact * Math.min(1, Math.max(0, vel) / 0.6);
  const topK = EB_Y - (K2 / 16) * EB_H;
  const topU = EB_Y - (U2 / 16) * EB_H;
  const kIn: P = [EB_X + EB_W - 6, topK + 4];
  const uIn: P = [EB_X + EB_W + EB_GAP + 6, topU + 4];
  const dimX = win(t, cue(8) + 0.2, cue(9) + 0.3, 0.6, 0.6);
  // grafik Us(x) (baris 9–10): titik menyapu 0 → 0,2 → 0,4 lalu mengikuti pegas saat melepas
  const usG = win(t, cue(9) + 0.1, 999, 0.7, 0.6) * ph2;
  const usDraw = ramp(t, cue(9) + 0.2, cue(9) + 1.4, EASE_IN_OUT);
  const xs = 0.2 * ramp(t, cue(9) + 1.0, cue(9) + 2.4, EASE_IN_OUT) + 0.2 * ramp(t, cue(9) + 3.6, cue(9) + 4.8, EASE_IN_OUT);
  const dotX = mix(xs, c2, ramp(t, tB - 0.6, tB - 0.1));
  const wQ = wordOf(9, 'seperempat');

  // kamera: dorong pelan ke pegas saat tertekan maksimum
  const zoom = ramp(t, tMax - 1.2, tMax + 0.6, EASE_IN_OUT) * (1 - ramp(t, cue(9) - 1.4, cue(9), EASE_IN_OUT));
  const zs = 1 + 0.1 * zoom;
  const ZC: P = [420, 470];

  const xBlock1 = XN + d1;
  const springY = FLOOR - BH / 2;
  const vis1 = ph1;
  const vis2 = ph2;
  const fx = -K_SPR * (d1 / PXM) * 2.2; // px panah gaya pegas (N × 2,2)
  const handTail = xBlock1 + BW + 20 + K_SPR * c1 * 2.2;

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      <Stage>
        <g transform={`translate(${ZC[0]} ${ZC[1]}) scale(${zs}) translate(${-ZC[0]} ${-ZC[1]})`}>
          {/* dinding & lantai */}
          <rect x={WALL - 34} y={300} width={34} height={FLOOR - 300} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <rect x={WALL - 6} y={300} width={6} height={FLOOR - 300} fill="#fff" opacity={0.08} />
          {Array.from({length: 7}, (_, i) => (
            <line key={i} x1={WALL - 34} y1={318 + i * 30} x2={WALL - 54} y2={338 + i * 30} stroke={C.faint} strokeWidth={2} />
          ))}
          <rect x={WALL - 4} y={springY - 30} width={10} height={60} rx={3} fill={C.faint} stroke={C.muted} strokeWidth={1.5} />
          <Ground x1={WALL - 40} x2={1020} y={FLOOR} />
          {/* panjang alami */}
          <line x1={XN} y1={FLOOR + 10} x2={XN} y2={FLOOR - BH - 100} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" opacity={ramp(t, cue(1), cue(1) + 0.6)} />
          <Label x={XN} y={FLOOR - BH - 122} size={22} color={C.muted} opacity={ramp(t, cue(1), cue(1) + 0.6)}>
            panjang alami
          </Label>

          {/* fase 1 */}
          <g opacity={vis1}>
            <GlowCoil xb={xBlock1} y={springY} e={e1} t={t} />
            <ellipse cx={xBlock1 + BW / 2} cy={FLOOR + 3} rx={80} ry={8} fill="#000" opacity={0.45} />
            <Crate x={xBlock1 + BW / 2} y={FLOOR} w={BW} h={BH} color={C.spr} />
            {/* gaya pegas F = −kx */}
            <g opacity={fHooke}>
              <Arrow x1={xBlock1 + BW / 2} y1={FLOOR - BH - 26} x2={xBlock1 + BW / 2 + fx} y2={FLOOR - BH - 26} color="force" width={6} opacity={Math.min(1, Math.abs(fx) / 30)} />
              <Label x={xBlock1 + BW / 2 + fx / 2} y={FLOOR - BH - 60} size={26} color={C.force} weight={600} opacity={Math.min(1, Math.abs(fx) / 30)}>
                F pegas
              </Label>
            </g>
            {/* simpangan x */}
            <g opacity={Math.min(1, Math.abs(d1) / 20) * ramp(t, cue(1), cue(1) + 0.5)}>
              <Arrow x1={XN} y1={FLOOR + 50} x2={xBlock1} y2={FLOOR + 50} color="spr" width={4} />
              <Label x={(XN + xBlock1) / 2} y={FLOOR + 82} size={28} font="serif" italic color={C.spr}>
                x
              </Label>
            </g>
            {/* gaya tangan menekan; usaha tangan mengalir ke pegas */}
            <g opacity={hand}>
              <Arrow x1={handTail} y1={springY} x2={xBlock1 + BW + 14} y2={springY} color="work" width={6} opacity={Math.min(1, c1 * 20)} />
              <Label x={xBlock1 + BW + 40 + K_SPR * c1 * 1.1} y={springY - 38} size={24} color={C.work} weight={600} opacity={Math.min(1, c1 * 20)}>
                {`tangan: ${fmt(K_SPR * c1)} N`}
              </Label>
            </g>
            <Stream
              pts={[
                [handTail, springY],
                [xBlock1 + BW / 2, springY],
                [WALL + 24, springY],
              ]}
              color="work"
              n={9}
              speed={0.7}
              jitter={14}
              opacity={hand * Math.min(1, compRate / 0.12)}
            />
          </g>
          {/* fase 2 */}
          <g opacity={vis2}>
            <GlowCoil xb={Math.min(XN, xL)} y={springY} e={e2} t={t} />
            {/* bayangan setengah tekanan */}
            <g opacity={halfGhost}>
              <rect x={XN - 0.2 * PXM} y={FLOOR - BH} width={BW} height={BH} rx={12} fill={C.spr} fillOpacity={0.06} stroke={C.spr} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 16} />
              <Label x={XN - 0.2 * PXM + BW / 2} y={FLOOR - BH - 30} size={24} color={C.spr} weight={600}>
                x = 0,20 m
              </Label>
            </g>
            <Stream pts={[[xL + BW / 2, springY], [WALL + 24, springY]]} color="kin" n={9} speed={0.8} jitter={16} opacity={fIn} seed={2} />
            <Stream pts={[[WALL + 24, springY], [xL + BW / 2, springY]]} color="spr" n={9} speed={0.8} jitter={16} opacity={fOut} seed={3} />
            <g opacity={exitFade}>
              {/* garis gerak: di kanan saat ke kiri, di kiri saat ke kanan */}
              {[0, 1, 2].map((k) => {
                const L = 50 + 16 * Math.sin(t * 6 + k * 2);
                const yy = FLOOR - BH + 24 + k * 30;
                const aL = Math.max(0, -vel) / V0;
                const aR = Math.max(0, vel) / V0;
                return (
                  <g key={k}>
                    {aL > 0.01 ? <line x1={xL + BW + 8} y1={yy} x2={xL + BW + 8 + L} y2={yy} stroke={C.ink} strokeOpacity={0.35 * aL} strokeWidth={3} strokeLinecap="round" /> : null}
                    {aR > 0.01 ? <line x1={xL - 8 - L} y1={yy} x2={xL - 8} y2={yy} stroke={C.ink} strokeOpacity={0.35 * aR} strokeWidth={3} strokeLinecap="round" /> : null}
                  </g>
                );
              })}
              <ellipse cx={xL + BW / 2} cy={FLOOR + 3} rx={80} ry={8} fill="#000" opacity={0.45} />
              <Glow x={xL + BW / 2} y={FLOOR - BH / 2} r={120} color="kin" opacity={0.6 * (K2 / 16)} />
              <Crate x={xL + BW / 2} y={FLOOR} w={BW} h={BH} label="2 kg" color={C.kin} />
            </g>
            <g opacity={moving * (1 - halfGhost) * exitFade}>
              <Arrow x1={xL + BW / 2} y1={FLOOR - BH - 30} x2={xL + BW / 2 + vel * 30} y2={FLOOR - BH - 30} color="kin" width={6} />
              <Label x={xL + BW / 2 + vel * 15} y={FLOOR - BH - 62} size={24} font="mono" color={C.kin} weight={600}>
                {`${fmt(Math.abs(vel), 1)} m/s`}
              </Label>
            </g>
            <Ripple x={XN - 0.4 * PXM} y={springY} p={ramp(t, tMax - 0.05, tMax + 1.3)} r={150} color="spr" />
            <Ripple x={XN - 0.4 * PXM} y={springY} p={ramp(t, tB, tB + 1.2)} r={130} color="kin" />
            <g opacity={forceMax}>
              <Arrow x1={xL - 4} y1={springY + 70} x2={xL + 180} y2={springY + 70} color="force" width={7} />
              <Label x={xL + 90} y={springY + 110} size={28} font="mono" color={C.force} weight={600}>
                kx = 80 N
              </Label>
            </g>
            {/* ukuran tekanan maksimum */}
            <g opacity={dimX}>
              <Arrow x1={XN} y1={FLOOR + 46} x2={XN - 0.4 * PXM} y2={FLOOR + 46} color="spr" width={4} both />
              <Glow x={XN - 0.2 * PXM} y={FLOOR + 76} r={90} color="spr" opacity={0.5} />
              <Label x={XN - 0.2 * PXM} y={FLOOR + 76} size={28} font="mono" color={C.spr} weight={600}>
                x = 0,40 m
              </Label>
            </g>
            <Label x={840} y={FLOOR + 64} size={22} color={C.muted} opacity={ramp(t, cue(6) + 0.6, cue(6) + 1.2)}>
              lantai licin · gerak diperlambat
            </Label>
          </g>
        </g>

        {/* grafik F–x (fase 1) */}
        <g opacity={graph * vis1}>
          <Plot a={AX} xLabel="x (m)" yLabel="F (N)" xTicks={[0.1, 0.2, 0.3, 0.4]} yTicks={[20, 40, 60, 80]} />
          <Liquid id="spr-tri" clip={TRI} x1={px(AX, 0)} x2={px(AX, 0.4)} yFrom={py(AX, 0)} yTo={py(AX, 80) - 12} p={tri} color={C.spr} t={t} />
          <line x1={px(AX, 0)} y1={py(AX, 0)} x2={px(AX, c1)} y2={py(AX, K_SPR * c1)} stroke={C.spr} strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" />
          <line x1={px(AX, 0)} y1={py(AX, 0)} x2={px(AX, c1)} y2={py(AX, K_SPR * c1)} stroke={C.spr} strokeWidth={5} strokeLinecap="round" />
          <Spark x={px(AX, c1)} y={py(AX, K_SPR * c1)} r={8} color="force" opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.4)} />
          <Ripple x={px(AX, 0.4)} y={py(AX, 80)} p={ramp(t, cue(4) + 1.6, cue(4) + 3)} r={120} color="spr" />
          <Label x={px(AX, 0.4) + 18} y={py(AX, 80)} size={26} font="serif" italic color={C.force} anchor="start" opacity={tri}>
            kx
          </Label>
          <Label x={px(AX, 0.28)} y={py(AX, 16)} size={28} color={C.ink} weight={600} opacity={tri}>
            luas = ½ · x · kx
          </Label>
        </g>
        <Glow x={560} y={740} r={300} color="spr" opacity={fUs * vis1 * 0.7} />

        {/* grafik Us(x) (fase 2, baris 9–10) */}
        <g opacity={usG}>
          <Plot
            a={AU}
            xLabel="x (m)"
            yLabel={
              <>
                U<TSub>s</TSub> (J)
              </>
            }
            xTicks={[0.2, 0.4]}
            yTicks={[4, 16]}
          />
          <path d={US_CURVE} fill="none" stroke={C.spr} strokeOpacity={0.25} strokeWidth={14} strokeDasharray="1000" strokeDashoffset={1000 * (1 - usDraw)} pathLength={1000} />
          <path d={US_CURVE} fill="none" stroke={C.spr} strokeWidth={5} strokeDasharray="1000" strokeDashoffset={1000 * (1 - usDraw)} pathLength={1000} />
          {[0.2, 0.4].map((xm, k) => {
            const show = ramp(xs, xm - 0.02, xm);
            return (
              <g key={xm} opacity={show}>
                <line x1={px(AU, xm)} y1={AU.y0} x2={px(AU, xm)} y2={py(AU, 100 * xm * xm)} stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" />
                <line x1={AU.x0} y1={py(AU, 100 * xm * xm)} x2={px(AU, xm)} y2={py(AU, 100 * xm * xm)} stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" />
                <Label x={px(AU, xm) + (k ? 18 : -14)} y={py(AU, 100 * xm * xm) - 24} size={26} font="mono" color={C.spr} weight={600} anchor={k ? 'start' : 'end'}>
                  {k ? '16 J' : '4 J'}
                </Label>
              </g>
            );
          })}
          <Spark x={px(AU, dotX)} y={py(AU, 100 * dotX * dotX)} r={8} color="spr" opacity={ramp(t, cue(9) + 0.8, cue(9) + 1.2)} />
          <Ripple x={px(AU, 0.2)} y={py(AU, 4)} p={ramp(t, wQ - 0.1, wQ + 1.3)} r={90} color="spr" />
          <Twinkles x={px(AU, 0.2)} y={py(AU, 4) - 10} rx={50} ry={34} n={4} color="spr" opacity={win(t, wQ, cue(10), 0.4, 0.6)} seed={3} />
        </g>

        <Stream pts={arc(kIn, uIn, 26)} color="kin" n={6} speed={0.9} r={4} opacity={vis2 * fIn} seed={1} />
        <Stream pts={arc(uIn, kIn, 26)} color="spr" n={6} speed={0.9} r={4} opacity={vis2 * fOut} seed={2} />
        <EnergyBars
          x={EB_X}
          y={EB_Y}
          height={EB_H}
          barW={EB_W}
          gap={EB_GAP}
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
