import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Spring} from '../components/physics';
import {Arrow, Card, DrawPath, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Stream, Tint, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

// Ikatan kimia sebagai pegas: H–Cl bergetar, kurva energi potensial berbentuk sumur (bentuk Morse,
// skematis), dasar sumur ≈ parabola ½kx², kedalaman = energi ikatan, memutus = energi masuk.

const RE = 1.3; // panjang ikatan (satuan gambar)
const A = 1.6;
const D = 400; // kedalaman sumur (px)
const Y0 = 360; // garis U = 0 (atom terpisah jauh)
const PX = (r: number) => 860 + (r - 0.5) * 270;
const U = (r: number) => D * ((1 - Math.exp(-A * (r - RE))) ** 2 - 1); // px, positif = naik
const PY = (r: number) => Y0 - U(r);
const PAR = (r: number) => Y0 + D - D * A * A * (r - RE) ** 2; // ½k x² di sekitar dasar (y layar)
// sumur ikatan yang lebih kuat (skematis, untuk baris terakhir)
const RE2 = 1.12;
const A2 = 1.9;
const D2 = 470;
const PY2 = (r: number) => Y0 - D2 * ((1 - Math.exp(-A2 * (r - RE2))) ** 2 - 1);

const CURVE_PTS: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 260; i++) {
    const r = 0.6 + (3.4 * i) / 260;
    const y = PY(r);
    if (y < 190) continue;
    pts.push([PX(r), y]);
  }
  return pts;
})();
const CURVE = CURVE_PTS.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const WELL_FILL = (() => {
  const pts = CURVE_PTS.filter((p) => p[1] >= Y0);
  return `${pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} L${pts[pts.length - 1][0].toFixed(1)},${Y0} L${pts[0][0].toFixed(1)},${Y0} Z`;
})();
const CURVE2 = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const r = 0.62 + (3.3 * i) / 200;
    const y = PY2(r);
    if (y < 200) continue;
    pts.push(`${pts.length ? 'L' : 'M'}${PX(r).toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
})();
const PARAB = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 80; i++) {
    const r = RE - 0.62 + (1.3 * i) / 80;
    pts.push(`${i ? 'L' : 'M'}${PX(r).toFixed(1)},${PAR(r).toFixed(1)}`);
  }
  return pts.join(' ');
})();

const AtomBall: React.FC<{x: number; y: number; el: string; s: number}> = ({x, y, el, s}) => {
  const a = ATOM[el];
  const r = a.r * 2.3 * s;
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.8} fill={el === 'Cl' ? 'url(#soft-work)' : 'url(#soft-ink)'} opacity={0.45} />
      <ellipse cx={x} cy={y + r * 1.05} rx={r * 0.8} ry={r * 0.12} fill="#000" opacity={0.3} />
      <circle cx={x} cy={y} r={r} fill={`url(#bond-${el})`} stroke={C.bg} strokeWidth={3} />
      <path d={`M${x - r * 0.72},${y - r * 0.2} A${r * 0.78},${r * 0.78} 0 0 1 ${x - r * 0.1},${y - r * 0.76}`} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={r * 0.1} strokeLinecap="round" />
      <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.16} fill="#fff" opacity={0.65} />
      <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={r * 0.72} fill={C.bg}>
        {el}
      </text>
    </g>
  );
};

export const Bond: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // tahap 1: molekul besar di tengah → tahap 2: kecil di kiri atas, grafik di kanan
  const move = ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT);
  const mx = mix(960, 520, move);
  const my = mix(470, 320, move);
  const s = mix(1, 0.6, move);
  const pxPerR = 230 * s;

  const tClose0 = wordOf(2, 'Didekatkan');
  const tFar0 = wordOf(2, 'Dijauhkan');
  const tNice = wordOf(2, 'nyaman');
  const irOn = (tt: number) => ramp(tt, cue(5) + 2.0, cue(5) + 3.5) * (1 - ramp(tt, cue(6) + 0.5, cue(6) + 3.0, EASE_IN_OUT));
  const stateAt = (tt: number) => {
    const close = win(tt, tClose0 - 0.1, tFar0 - 0.4, 0.6, 0.5);
    const far = win(tt, tFar0 - 0.1, tNice - 0.4, 0.7, 0.7);
    const brk = win(tt, cue(7) + 0.3, cue(7) + 3.8, 1.8, 1.4);
    const lock = Math.max(close, far, brk);
    const amp = 0.12 + 0.07 * irOn(tt);
    const r = RE + amp * Math.sin(2 * Math.PI * 0.9 * tt) * (1 - lock) + close * (0.8 - RE) + far * (2.1 - RE) + brk * (3.7 - RE);
    return {close, far, brk, lock, amp, r};
  };
  const {close, far, brk, lock, amp, r} = stateAt(t);
  // pusat massa: Cl jauh lebih berat → H yang lebih banyak berayun
  const mH = 1;
  const mCl = 35.5;
  // saat ikatan diputus, gambar dipisah simetris agar kedua atom tetap di layar
  const wH = mix(mCl / (mH + mCl), 0.5, brk);
  const xH = mx - r * pxPerR * wH;
  const xCl = mx + r * pxPerR * (1 - wH);
  const rH = ATOM.H.r * 2.3 * s;
  const rCl = ATOM.Cl.r * 2.3 * s;
  const springOp = 1 - ramp(r, 2.6, 3.2);
  const stretch = (r - RE) / 0.2; // −..+ (tekan / regang)
  const springCol = interpolateColors(Math.min(1, Math.abs(stretch)), [0, 1], [C.spr, '#ecdcff']);
  const tumble = 22 * Math.sin(t * 0.7) * (1 - ramp(t, cue(1) - 0.6, cue(1) + 0.6, EASE_IN_OUT));

  const molIn = ramp(t, 0.3, 1.3);
  const repel = close;
  const attract = far;
  const lenTag = win(t, tNice, cue(3) - 0.6, 0.6, 0.5);

  const plot = ramp(t, cue(3) + 0.2, cue(3) + 1.6);
  const parab = win(t, cue(4) + 0.4, cue(7) - 0.2, 1.0, 0.6);
  const kCard = win(t, cue(5) + 0.2, cue(6) - 0.3, 0.6, 0.5);
  const ir = win(t, cue(5) + 1.0, cue(6) - 0.3, 0.8, 0.6);
  const irFront = ramp(t, cue(5) + 1.0, cue(5) + 2.2, (x) => x);
  const depth = win(t, cue(6) + 0.2, cue(7) - 0.1, 0.8, 0.5);
  const hhCard = win(t, cue(6) + 1.6, cue(8) - 0.3, 0.6, 0.5);
  const upArrow = win(t, cue(7) + 0.3, cue(8), 0.8, 0.6);
  const downArrow = win(t, cue(7) + 4.0, cue(8) + 0.6, 0.8, 0.6);
  const flash = win(t, cue(7) + 4.6, cue(7) + 5.2, 0.15, 0.9);
  const formP = ramp(t, cue(7) + 4.5, cue(7) + 5.9, (x) => x);
  const outBurst = win(t, cue(7) + 4.5, cue(7) + 6.5, 0.3, 1.0);
  const inFlow = win(t, cue(7) + 0.3, cue(7) + 2.4, 0.4, 0.6);
  const myth = ramp(t, cue(8) + 0.2, cue(8) + 1.0);
  const truth = ramp(t, cue(8) + 5.0, cue(8) + 5.8);
  const strike = ramp(t, cue(8) + 4.2, cue(8) + 5.0);
  const drop2 = ramp(t, cue(8) + 5.8, cue(8) + 7.4, EASE_IN_OUT);
  const release = win(t, cue(8) + 6.6, cue(8) + 10.5, 0.5, 1.2);
  const cam = ramp(t, cue(4) - 0.2, cue(4) + 2.4, EASE_IN_OUT) * (1 - ramp(t, cue(5) + 0.5, cue(5) + 2.8, EASE_IN_OUT));
  const zS = 1 + 0.06 * cam;

  const dotOf = (rr: number): [number, number] => {
    const q = Math.min(3.9, Math.max(0.7, rr));
    return [PX(q), Math.max(190, PY(q))];
  };
  const [dx, dy] = dotOf(r);
  const trail = [1, 2, 3, 4, 5, 6, 7].map((k) => dotOf(stateAt(t - k * 0.045).r));
  const eLevel = Y0 + D - D * A * A * amp * amp; // energi getaran (garis horizontal)
  const levelOp = plot * (1 - lock);
  const irAbs = irOn(t);
  const sheen = (t * 0.16) % 1;
  const [shx, shy] = pointAlong(CURVE_PTS, sheen);
  const deep: [number, number] = [PX(RE2), PY2(RE2)];
  const d2: [number, number] = [mix(PX(RE), deep[0], drop2), mix(PY(RE), deep[1], drop2)];

  // gelombang inframerah: muka gelombang merambat, lalu diserap molekul
  const waveEnd = Math.max(130, xH - rH - 8);
  const frontX = mix(110, waveEnd, irFront);
  const wavePts = Array.from({length: 90}, (_, i) => {
    const x = 110 + (i / 89) * Math.max(10, frontX - 110);
    const env = Math.min(1, (x - 110) / 60) * Math.min(1, (waveEnd - x) / 50 + 0.25);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${(my + 18 * env * Math.sin((x - 110) * 0.11 - t * 9)).toFixed(1)}`;
  }).join(' ');

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="bond-H" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor={ATOM.H.fill} />
            <stop offset="100%" stopColor="#9aa6c8" />
          </radialGradient>
          <radialGradient id="bond-Cl" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#b6f5c4" />
            <stop offset="55%" stopColor={ATOM.Cl.fill} />
            <stop offset="100%" stopColor="#2a8a44" />
          </radialGradient>
          <linearGradient id="bond-well" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.spr} stopOpacity="0" />
            <stop offset="100%" stopColor={C.spr} stopOpacity="0.22" />
          </linearGradient>
        </defs>

        {/* ===== grafik energi potensial ===== */}
        <g opacity={plot}>
          <g transform={`translate(1100 640) scale(${zS}) translate(-1100 -640)`}>
            <path d={WELL_FILL} fill="url(#bond-well)" opacity={ramp(t, cue(3) + 1.6, cue(3) + 3.0)} />
            <line x1={860} y1={850} x2={860} y2={190} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <line x1={860} y1={Y0} x2={1790} y2={Y0} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
            <Label x={884} y={200} size={28} font="serif" italic anchor="start">
              U
            </Label>
            <Label x={1780} y={Y0 - 64} size={24} anchor="end" color={C.muted}>
              jarak antaratom r →
            </Label>
            <Label x={1780} y={Y0 - 30} size={22} anchor="end" color={C.muted}>
              atom terpisah (U = 0)
            </Label>
            <DrawPath d={CURVE} p={ramp(t, cue(3) + 0.4, cue(3) + 2.6, EASE_IN_OUT)} stroke="spr" width={5} halo />
            {/* kilau berjalan di sepanjang kurva */}
            <circle cx={shx} cy={shy} r={16} fill="url(#soft-white)" opacity={0.7 * cyc(sheen) * ramp(t, cue(3) + 2.6, cue(3) + 3.4)} />
            <Label x={PX(0.98)} y={250} size={24} color={C.heat} anchor="end" opacity={ramp(t, cue(3) + 2.4, cue(3) + 3.2)}>
              tolak
            </Label>
            <Label x={PX(2.4)} y={PY(2.4) + 46} size={24} color={C.cyan} opacity={ramp(t, cue(3) + 2.4, cue(3) + 3.2)}>
              tarik
            </Label>
            <Label x={PX(RE)} y={Y0 + D + 40} size={24} color={C.muted} opacity={ramp(t, cue(3) + 2.6, cue(3) + 3.4) * (1 - truth)}>
              panjang ikatan
            </Label>
            {/* garis energi getaran (naik saat menyerap foton IR) */}
            <line x1={PX(RE - amp - 0.01)} y1={eLevel} x2={PX(RE + amp + 0.02)} y2={eLevel} stroke={interpolateColors(irAbs, [0, 1], [C.ink, C.heat])} strokeOpacity={0.7 * levelOp} strokeWidth={2.5} />
            {/* titik keadaan dengan jejak */}
            <g opacity={plot}>
              {trail.map(([tx, ty], k) => (
                <circle key={k} cx={tx} cy={ty} r={10 * (1 - k / 9)} fill={C.gold} opacity={0.35 * (1 - k / 8)} />
              ))}
              <circle cx={dx} cy={dy} r={34} fill="url(#soft-gold)" />
              <circle cx={dx} cy={dy} r={13} fill={C.gold} />
              <circle cx={dx - 4} cy={dy - 4} r={4} fill="#fff" opacity={0.8} />
            </g>
            {/* parabola ½kx² */}
            <g opacity={parab}>
              <path d={PARAB} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 16} />
              <Label x={PX(1.98) + 18} y={300} size={30} font="serif" italic anchor="start" color={C.ink}>
                ≈ ½ k x²
              </Label>
              <Twinkles x={PX(RE)} y={Y0 + D - 20} rx={70} ry={30} n={3} opacity={win(t, cue(4) + 1.4, cue(5), 0.6, 0.6)} seed={4} />
            </g>
            {/* kedalaman sumur */}
            <g opacity={depth}>
              <line x1={1690} y1={Y0} x2={1690} y2={Y0 + D} stroke={C.gold} strokeWidth={3} />
              <line x1={1670} y1={Y0 + D} x2={1710} y2={Y0 + D} stroke={C.gold} strokeWidth={3} />
              <line x1={1670} y1={Y0} x2={1710} y2={Y0} stroke={C.gold} strokeWidth={3} />
              <line x1={PX(RE) + 40} y1={Y0 + D} x2={1670} y2={Y0 + D} stroke={C.gold} strokeWidth={1.5} strokeDasharray="6 8" strokeDashoffset={-t * 12} />
              <Label x={1675} y={Y0 + D / 2} size={28} color={C.gold} anchor="end" weight={600}>
                energi ikatan
              </Label>
              <Glow x={1690} y={Y0 + D / 2} r={90} color="gold" opacity={0.5} />
            </g>
            {/* memutus & membentuk */}
            <g opacity={upArrow}>
              <Arrow x1={1430} y1={Y0 + D - 10} x2={1430} y2={Y0 + 20} color="work" width={7} />
              <Stream pts={[[1430, Y0 + D - 10], [1430, Y0 + 30]]} color="work" n={6} speed={0.7} r={4.5} jitter={3} seed={1} />
              <Label x={1410} y={Y0 + D / 2 + 40} size={26} color={C.work} anchor="end" weight={600}>
                memutus:
              </Label>
              <Label x={1410} y={Y0 + D / 2 + 76} size={26} color={C.work} anchor="end" weight={600}>
                energi masuk
              </Label>
            </g>
            <g opacity={downArrow}>
              <Arrow x1={1530} y1={Y0 + 20} x2={1530} y2={Y0 + D - 10} color="heat" width={7} />
              <Stream pts={[[1530, Y0 + 30], [1530, Y0 + D - 30], [1600, Y0 + D + 30], [1700, Y0 + D + 60]]} color="heat" n={7} speed={0.6} r={4.5} jitter={3} seed={2} />
              <Label x={1552} y={Y0 + D / 2 + 40} size={26} color={C.heat} anchor="start" weight={600}>
                membentuk:
              </Label>
              <Label x={1552} y={Y0 + D / 2 + 76} size={26} color={C.heat} anchor="start" weight={600}>
                energi keluar
              </Label>
            </g>
            {/* ikatan yang lebih kuat: sumur lebih dalam, selisihnya dilepas */}
            <g opacity={truth}>
              <path d={CURVE2} fill="none" stroke={C.gold} strokeWidth={3.5} strokeDasharray="12 9" strokeDashoffset={-t * 14} />
              <Label x={PX(RE2) + 20} y={Y0 + D2 + 28} size={24} color={C.gold} anchor="start" weight={600}>
                ikatan lebih kuat
              </Label>
              {<Spark x={d2[0]} y={d2[1]} r={9} color="gold" opacity={Math.min(1, drop2 * 8)} trail={[1, 2, 3, 4].map((k) => [mix(PX(RE), deep[0], Math.max(0, drop2 - k * 0.06)), mix(PY(RE), deep[1], Math.max(0, drop2 - k * 0.06))] as [number, number])} />}
              <Ripple x={deep[0]} y={deep[1]} p={ramp(t, cue(8) + 7.2, cue(8) + 8.6, (x) => x)} r={140} color="heat" />
              <Stream pts={[[deep[0] + 20, deep[1] - 10], [1180, 790], [1330, 800], [1420, 770]]} color="heat" n={8} speed={0.55} r={4.5} jitter={4} opacity={release} seed={6} />
              <Label x={1440} y={770} size={26} color={C.heat} anchor="start" weight={600} opacity={release}>
                energi dilepas
              </Label>
            </g>
          </g>
        </g>

        {/* ===== gelombang inframerah ===== */}
        <g opacity={ir}>
          <path d={wavePts} fill="none" stroke={C.heat} strokeOpacity={0.25} strokeWidth={12} strokeLinecap="round" />
          <path d={wavePts} fill="none" stroke={C.heat} strokeWidth={4} strokeLinecap="round" />
          <Spark x={frontX} y={my} r={6} color="heat" opacity={1 - irFront * 0.6} />
          <Label x={160} y={my - 50} size={22} color={C.heat} anchor="start">
            cahaya inframerah
          </Label>
          {[0, 1].map((k) => (
            <Ripple key={k} x={mx} y={my} p={(t * 0.7 + k * 0.5) % 1} r={150} color="heat" rings={2} width={2.5} />
          ))}
        </g>

        {/* ===== molekul H–Cl ===== */}
        <g opacity={molIn}>
          <Glow x={mx} y={my} r={260 * s} color="spr" opacity={0.4 + 0.6 * flash} />
          <Motes x={mx} y={my} rx={300 * s} ry={170 * s} n={22} color="spr" opacity={0.55} seed={2} />
          <Glow x={mx} y={my} r={220 * s} color="heat" opacity={0.6 * irAbs * (0.7 + 0.3 * Math.sin(t * 2 * Math.PI * 0.9))} />
          <g transform={`rotate(${tumble} ${mx} ${my})`}>
            {/* awan elektron ikatan */}
            <ellipse cx={(xH + xCl) / 2} cy={my} rx={Math.max(10, (xCl - xH) / 2 + 20 * s)} ry={58 * s} fill="url(#soft-spr)" opacity={0.6 * springOp} />
            <line x1={xH} y1={my} x2={xCl} y2={my} stroke={springCol} strokeOpacity={0.12 * springOp} strokeWidth={34 * s} strokeLinecap="round" />
            <Spring xa={xH + rH * 0.8} xb={xCl - rCl * 0.85} y={my} coils={7} amp={14 * s + 4} color={springCol} opacity={springOp} />
            <AtomBall x={xH} y={my} el="H" s={s} />
            <AtomBall x={xCl} y={my} el="Cl" s={s} />
          </g>
          {/* energi masuk saat memutus, energi keluar saat membentuk */}
          <Stream pts={[[mx - 330 * s - 120, my - 150], [mx - 100, my - 90], [mx, my]]} color="work" n={10} speed={0.8} r={5} opacity={inFlow} seed={3} />
          {Array.from({length: 6}, (_, k) => {
            const a = (k / 6) * 2 * Math.PI + 0.3;
            return <Stream key={k} pts={[[mx + 40 * Math.cos(a), my + 40 * Math.sin(a)], [mx + 190 * Math.cos(a), my + 150 * Math.sin(a)]]} color="heat" n={3} speed={0.9} r={4.5} jitter={2} opacity={outBurst} seed={k + 7} />;
          })}
          <Ripple x={mx} y={my} p={formP} r={200} color="heat" />
          {/* tolak / tarik */}
          <g opacity={repel}>
            <Arrow x1={xH - rH - 14} y1={my} x2={xH - rH - 84} y2={my} color="heat" width={6} />
            <Arrow x1={xCl + rCl + 14} y1={my} x2={xCl + rCl + 84} y2={my} color="heat" width={6} />
            <Label x={mx} y={my - 120} size={30} color={C.heat} weight={600}>
              terlalu rapat: saling tolak
            </Label>
          </g>
          <g opacity={attract}>
            <Arrow x1={xH + rH + 14} y1={my - 62} x2={xH + rH + 84} y2={my - 62} color="cyan" width={6} />
            <Arrow x1={xCl - rCl - 14} y1={my - 62} x2={xCl - rCl - 84} y2={my - 62} color="cyan" width={6} />
            <Label x={mx} y={my - 130} size={30} color={C.cyan} weight={600}>
              terlalu jauh: saling tarik
            </Label>
          </g>
          <g opacity={lenTag}>
            <line x1={xH} y1={my + 110} x2={xCl} y2={my + 110} stroke={C.gold} strokeWidth={3} />
            <line x1={xH} y1={my + 96} x2={xH} y2={my + 124} stroke={C.gold} strokeWidth={3} />
            <line x1={xCl} y1={my + 96} x2={xCl} y2={my + 124} stroke={C.gold} strokeWidth={3} />
            <Label x={mx} y={my + 154} size={30} color={C.gold} weight={600}>
              panjang ikatan
            </Label>
            <Twinkles x={mx} y={my + 110} rx={(xCl - xH) / 2} ry={16} n={3} seed={5} />
          </g>
        </g>
      </Stage>

      {/* ===== kartu ===== */}
      <Formula x={450} y={620} p={kCard} accent={C.spr} size={58} caption="ikatan H–Cl · getarannya dibaca spektroskopi IR">
        <V>k</V> ≈ 516 N/m
      </Formula>
      <Formula x={450} y={620} p={hhCard} accent={C.gold} size={56} caption="energi untuk memutus 1 mol ikatan H–H">
        H–H ≈ 436 kJ/mol
      </Formula>
      <Card x={450} y={650} opacity={myth} accent={C.heat} style={{padding: '20px 30px', whiteSpace: 'normal', width: 640}}>
        <div style={{fontFamily: FONT.head, fontSize: 28, lineHeight: 1.4, position: 'relative'}}>
          <Tint c={C.heat}>✗ </Tint>
          <span style={{opacity: 1 - 0.5 * strike}}>“Energi tersimpan di dalam ikatan, seperti bensin di tangki.”</span>
          <div style={{position: 'absolute', left: 30, top: '50%', height: 3, width: `${88 * strike}%`, background: C.heat, borderRadius: 2}} />
        </div>
        <div style={{fontFamily: FONT.head, fontSize: 28, lineHeight: 1.4, marginTop: 14, opacity: truth}}>
          <Tint c={C.work}>✓ </Tint>
          Energi <Tint c={C.work}>dilepaskan</Tint> ketika ikatan yang <Tint c={C.gold}>lebih kuat terbentuk</Tint>.
        </div>
      </Card>
    </AbsoluteFill>
  );
};
