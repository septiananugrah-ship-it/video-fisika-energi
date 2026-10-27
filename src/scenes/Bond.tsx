import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Spring} from '../components/physics';
import {Arrow, Card, DrawPath, Formula, Glow, Label, Stage, Tint, V} from '../components/primitives';
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

const CURVE = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 260; i++) {
    const r = 0.6 + (3.4 * i) / 260;
    const y = PY(r);
    if (y < 190) continue;
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
      <circle cx={x} cy={y} r={r} fill={a.fill} stroke={C.bg} strokeWidth={3} />
      <circle cx={x - r * 0.35} cy={y - r * 0.38} r={r * 0.24} fill="#fff" opacity={0.6} />
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

  const close = win(t, wordOf(2, 'Didekatkan') - 0.1, wordOf(2, 'Dijauhkan') - 0.4, 0.6, 0.5);
  const far = win(t, wordOf(2, 'Dijauhkan') - 0.1, wordOf(2, 'nyaman') - 0.4, 0.7, 0.7);
  const brk = win(t, cue(7) + 0.3, cue(7) + 3.8, 1.8, 1.4);
  const lock = Math.max(close, far, brk);
  const vib = 0.12 * Math.sin(2 * Math.PI * 0.9 * t);
  const r = RE + vib * (1 - lock) + close * (0.8 - RE) + far * (2.1 - RE) + brk * (3.7 - RE);
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

  const molIn = ramp(t, cue(1) - 0.4, cue(1) + 0.6);
  const repel = close;
  const attract = far;
  const lenTag = win(t, wordOf(2, 'nyaman'), cue(3) - 0.6, 0.6, 0.5);

  const plot = ramp(t, cue(3) + 0.2, cue(3) + 1.6);
  const parab = win(t, cue(4) + 0.4, cue(7) - 0.2, 1.0, 0.6);
  const kCard = win(t, cue(5) + 0.2, cue(6) - 0.3, 0.6, 0.5);
  const ir = win(t, cue(5) + 1.0, cue(6) - 0.3, 0.8, 0.6);
  const depth = win(t, cue(6) + 0.2, cue(7) - 0.1, 0.8, 0.5);
  const hhCard = win(t, cue(6) + 1.6, cue(8) - 0.3, 0.6, 0.5);
  const upArrow = win(t, cue(7) + 0.3, cue(8), 0.8, 0.6);
  const downArrow = win(t, cue(7) + 4.0, cue(8) + 0.6, 0.8, 0.6);
  const flash = win(t, cue(7) + 4.6, cue(7) + 5.2, 0.15, 0.9);
  const myth = ramp(t, cue(8) + 0.2, cue(8) + 1.0);
  const truth = ramp(t, cue(8) + 5.0, cue(8) + 5.8);
  const strike = ramp(t, cue(8) + 4.2, cue(8) + 5.0);

  const rDot = Math.min(3.9, Math.max(0.7, r));
  const eLevel = Y0 + D - D * A * A * 0.12 * 0.12; // energi getaran (garis horizontal)
  const levelOp = plot * (1 - lock);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== grafik energi potensial ===== */}
        <g opacity={plot}>
          <line x1={860} y1={850} x2={860} y2={190} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={860} y1={Y0} x2={1800} y2={Y0} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <Label x={884} y={200} size={28} font="serif" italic anchor="start">
            U
          </Label>
          <Label x={1790} y={Y0 - 64} size={24} anchor="end" color={C.muted}>
            jarak antaratom r →
          </Label>
          <Label x={1790} y={Y0 - 30} size={22} anchor="end" color={C.muted}>
            atom terpisah (U = 0)
          </Label>
          <DrawPath d={CURVE} p={ramp(t, cue(3) + 0.4, cue(3) + 2.6, EASE_IN_OUT)} stroke="spr" width={5} halo />
          <Label x={PX(0.98)} y={250} size={24} color={C.heat} anchor="end" opacity={ramp(t, cue(3) + 2.4, cue(3) + 3.2)}>
            tolak
          </Label>
          <Label x={PX(2.4)} y={PY(2.4) + 46} size={24} color={C.cyan} opacity={ramp(t, cue(3) + 2.4, cue(3) + 3.2)}>
            tarik
          </Label>
          <Label x={PX(RE)} y={Y0 + D + 40} size={24} color={C.muted} opacity={ramp(t, cue(3) + 2.6, cue(3) + 3.4)}>
            panjang ikatan
          </Label>
          {/* garis energi getaran + titik keadaan */}
          <line x1={PX(RE - 0.13)} y1={eLevel} x2={PX(RE + 0.14)} y2={eLevel} stroke={C.ink} strokeOpacity={0.6 * levelOp} strokeWidth={2} />
          <circle cx={PX(rDot)} cy={Math.max(190, PY(rDot))} r={13} fill={C.gold} opacity={plot} />
          <circle cx={PX(rDot)} cy={Math.max(190, PY(rDot))} r={30} fill="url(#soft-gold)" opacity={plot} />
          {/* parabola ½kx² */}
          <g opacity={parab}>
            <path d={PARAB} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
            <Label x={PX(1.98) + 18} y={300} size={30} font="serif" italic anchor="start" color={C.ink}>
              ≈ ½ k x²
            </Label>
          </g>
          {/* kedalaman sumur */}
          <g opacity={depth}>
            <line x1={1690} y1={Y0} x2={1690} y2={Y0 + D} stroke={C.gold} strokeWidth={3} />
            <line x1={1670} y1={Y0 + D} x2={1710} y2={Y0 + D} stroke={C.gold} strokeWidth={3} />
            <line x1={PX(RE) + 40} y1={Y0 + D} x2={1670} y2={Y0 + D} stroke={C.gold} strokeWidth={1.5} strokeDasharray="6 8" />
            <Label x={1675} y={Y0 + D / 2} size={28} color={C.gold} anchor="end" weight={600}>
              energi ikatan
            </Label>
          </g>
          {/* memutus & membentuk */}
          <g opacity={upArrow}>
            <Arrow x1={1430} y1={Y0 + D - 10} x2={1430} y2={Y0 + 20} color="work" width={7} />
            <Label x={1410} y={Y0 + D / 2 + 40} size={26} color={C.work} anchor="end" weight={600}>
              memutus:
            </Label>
            <Label x={1410} y={Y0 + D / 2 + 76} size={26} color={C.work} anchor="end" weight={600}>
              energi masuk
            </Label>
          </g>
          <g opacity={downArrow}>
            <Arrow x1={1530} y1={Y0 + 20} x2={1530} y2={Y0 + D - 10} color="heat" width={7} />
            <Label x={1552} y={Y0 + D / 2 + 40} size={26} color={C.heat} anchor="start" weight={600}>
              membentuk:
            </Label>
            <Label x={1552} y={Y0 + D / 2 + 76} size={26} color={C.heat} anchor="start" weight={600}>
              energi keluar
            </Label>
          </g>
        </g>

        {/* ===== gelombang inframerah ===== */}
        <g opacity={ir}>
          <path
            d={Array.from({length: 120}, (_, i) => {
              const x = 110 + (i / 119) * Math.max(40, xH - rH - 130);
              return `${i ? 'L' : 'M'}${x.toFixed(1)},${(my + 18 * Math.sin(i * 0.42 - t * 9)).toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke={C.heat}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Label x={160} y={my - 50} size={22} color={C.heat} anchor="start">
            cahaya inframerah
          </Label>
        </g>

        {/* ===== molekul H–Cl ===== */}
        <g opacity={molIn}>
          <Glow x={mx} y={my} r={260 * s} color="spr" opacity={0.4 + 0.6 * flash} />
          <Spring xa={xH + rH * 0.8} xb={xCl - rCl * 0.85} y={my} coils={7} amp={14 * s + 4} opacity={springOp} />
          <AtomBall x={xH} y={my} el="H" s={s} />
          <AtomBall x={xCl} y={my} el="Cl" s={s} />
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
