import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {cyc, ramp, win} from '../anim';
import {Crate, Ground, HeatShimmer, Person} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Motes, Ripple, Spark, Stage, Stream, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Usaha: definisi, koper dengan tali miring (penguraian gaya), W = F s cos θ,
// tiga kasus tanda (+, 0, −), dan tas yang dipegang diam (W = 0).

const FLOOR = 740;
const TH = (35 * Math.PI) / 180;
const SX0 = 500; // posisi awal koper
const RL = 450; // panjang tali yang tergambar

/** Orang garis yang condong (mendorong): kaki di (x, y), tangan menuju (hx, hy). */
const LeanPerson: React.FC<{x: number; y: number; lean: number; s: number; hx: number; hy: number; phase?: number; color?: string}> = ({x, y, lean, s, hx, hy, phase = 0, color = C.ink}) => {
  const a = (lean * Math.PI) / 180;
  const P = (h: number): [number, number] => [x + h * s * Math.sin(a), y - h * s * Math.cos(a)];
  const hip = P(70);
  const sh = P(128);
  const head = P(162);
  const neck = P(140);
  const st = Math.sin(phase);
  const fb: [number, number] = [x - (34 + 10 * st) * s, y];
  const ff: [number, number] = [x + (18 - 10 * st) * s, y];
  const kneeF: [number, number] = [(hip[0] + ff[0]) / 2 + 10 * s, (hip[1] + ff[1]) / 2 - 4 * s];
  const elbow: [number, number] = [(sh[0] + hx) / 2 - 2 * s, (sh[1] + hy) / 2 + 12 * s];
  return (
    <g stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={hip[0]} y1={hip[1]} x2={fb[0]} y2={fb[1]} />
      <polyline points={`${hip[0]},${hip[1]} ${kneeF[0]},${kneeF[1]} ${ff[0]},${ff[1]}`} />
      <line x1={hip[0]} y1={hip[1]} x2={neck[0]} y2={neck[1]} />
      <polyline points={`${sh[0]},${sh[1]} ${elbow[0]},${elbow[1]} ${hx},${hy}`} />
      <circle cx={head[0]} cy={head[1]} r={18 * s} fill={C.bg} />
    </g>
  );
};

/** Panel kecil untuk satu kasus tanda usaha; animasi berulang yang mulus. */
const SignPanel: React.FC<{
  cx: number;
  t: number;
  op: number;
  kind: 'pos' | 'zero' | 'neg';
}> = ({cx, t, op, kind}) => {
  if (op <= 0.001) return null;
  const P = 3.4;
  const ph = (((t % P) + P) % P) / P;
  const tau = ph * P;
  const loopOp = Math.min(1, ph * 9, (1 - ph) * 9);
  const x0 = cx - 190;
  const floor = 720;
  // gerak dalam panel (≤ 200 px, tidak menabrak batang K): + dipercepat, 0 tetap, − diperlambat sampai berhenti
  const u = tau / P;
  const TR = 200;
  let x = x0;
  let vRel = 0;
  if (kind === 'pos') {
    x = x0 + TR * u * u;
    vRel = u;
  } else if (kind === 'zero') {
    x = x0 + TR * u;
    vRel = 0.6;
  } else {
    x = x0 + TR * (1 - (1 - u) * (1 - u));
    vRel = 1 - u;
  }
  const v = vRel * 140;
  const kRel = vRel * vRel;
  const color = kind === 'pos' ? C.work : kind === 'zero' ? C.muted : C.heat;
  const title = kind === 'pos' ? 'W > 0' : kind === 'zero' ? 'W = 0' : 'W < 0';
  const sub = kind === 'pos' ? 'gaya searah gerak · θ < 90°' : kind === 'zero' ? 'gaya tegak lurus · θ = 90°' : 'gaya melawan gerak · θ > 90°';
  const bx = x + 50;
  const kTop = 700 - 140 * Math.min(1, kRel) * loopOp;
  return (
    <g opacity={op}>
      <rect x={cx - 250} y={380} width={500} height={470} rx={22} fill="rgba(10,16,36,0.72)" stroke={color} strokeOpacity={0.6} strokeWidth={2} />
      <Glow x={cx} y={640} r={240} color={kind === 'pos' ? 'work' : kind === 'zero' ? 'muted' : 'heat'} opacity={0.25} />
      <Label x={cx} y={430} size={44} font="serif" italic weight={600} color={color}>
        {title}
      </Label>
      <Label x={cx} y={482} size={24} color={C.muted}>
        {sub}
      </Label>
      <line x1={cx - 225} y1={floor} x2={cx + 225} y2={floor} stroke={kind === 'neg' ? C.muted : C.ink} strokeWidth={3} />
      {kind === 'neg'
        ? Array.from({length: 22}, (_, i) => <line key={i} x1={cx - 220 + i * 20} y1={floor + 2} x2={cx - 232 + i * 20} y2={floor + 18} stroke={C.faint} strokeWidth={2} />)
        : null}
      <clipPath id={`clip-${kind}`}>
        <rect x={cx - 250} y={380} width={430} height={470} rx={22} />
      </clipPath>
      <g opacity={loopOp} clipPath={`url(#clip-${kind})`}>
        <ellipse cx={bx} cy={floor + 3} rx={56} ry={5} fill="#000" opacity={0.4} />
        {kind === 'neg' ? <HeatShimmer x1={x - 60} x2={x + 90} y={floor} t={t} amount={vRel} /> : null}
        {kind === 'neg' ? <Glow x={x + 10} y={floor} r={70} color="heat" opacity={0.7 * vRel} still /> : null}
        {kind !== 'zero' ? (
          [-12, 0, 12].map((o) => (
            <line key={o} x1={x - 8} y1={floor - 40 + o} x2={x - 8 - 50 * vRel} y2={floor - 40 + o} stroke={C.kin} strokeOpacity={0.45 * vRel} strokeWidth={3} strokeLinecap="round" />
          ))
        ) : null}
        <rect x={x} y={floor - 80} width={100} height={80} rx={10} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
        <rect x={x + 8} y={floor - 72} width={84} height={8} rx={4} fill="#fff" opacity={0.08} />
        <Glow x={bx} y={floor - 40} r={80} color="kin" opacity={0.6 * kRel} still />
        {kind === 'pos' ? <Arrow x1={bx + 52} y1={floor - 40} x2={bx + 120} y2={floor - 40} color="force" width={5} /> : null}
        {kind === 'zero' ? <Arrow x1={bx} y1={floor - 86} x2={bx} y2={floor - 180} color="force" width={5} /> : null}
        {kind === 'neg' && v > 2 ? <Arrow x1={x - 2} y1={floor - 10} x2={x - 92} y2={floor - 10} color="heat" width={5} /> : null}
        {/* kecepatan */}
        {v > 2 ? <Arrow x1={bx - 30} y1={floor - 112} x2={bx - 30 + v * 0.6} y2={floor - 112} color="kin" width={3} opacity={kind === 'zero' ? 0 : 1} /> : null}
      </g>
      {/* aliran energi: + masuk lewat gaya → K; 0 tidak ada; − keluar jadi panas */}
      {kind === 'pos' ? (
        <>
          <Stream pts={[[bx + 116, floor - 40], [bx + 30, floor - 40]]} color="work" n={5} speed={1.1} r={4} jitter={4} opacity={loopOp} seed={1} />
          <Stream pts={[[bx + 20, floor - 84], [cx + 150, kTop - 40], [cx + 207, kTop - 8]]} color="kin" n={5} speed={0.9} r={3.5} jitter={2} opacity={loopOp * Math.min(1, u * 2)} seed={2} />
        </>
      ) : null}
      {kind === 'neg' ? (
        <>
          <Stream pts={[[cx + 207, kTop - 8], [cx + 150, kTop - 50], [bx + 20, floor - 84]]} color="kin" n={5} speed={0.9} r={3.5} jitter={2} opacity={loopOp * vRel} seed={3} />
          <Stream pts={[[x + 20, floor - 6], [x - 30, floor - 30], [x - 70, floor - 70]]} color="heat" n={5} speed={1.0} r={4} jitter={5} opacity={loopOp * vRel} seed={4} />
        </>
      ) : null}
      {kind === 'zero' ? (
        <g opacity={0.5 + 0.2 * Math.sin(t * 2.4)}>
          <circle cx={cx + 207} cy={630} r={34} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="4 6" strokeDashoffset={-t * 10} />
        </g>
      ) : null}
      {/* batang K */}
      <rect x={cx + 190} y={560} width={34} height={140} rx={6} fill={C.kin} opacity={0.1} />
      <rect x={cx + 190} y={kTop} width={34} height={700 - kTop} rx={6} fill={C.kin} />
      <rect x={cx + 196} y={kTop + 6} width={6} height={Math.max(0, 700 - kTop - 12)} rx={3} fill="#fff" opacity={0.2} />
      <Label x={cx + 207} y={540} size={26} font="serif" italic color={C.kin}>
        K
      </Label>
      <Label x={cx - 20} y={800} size={26} color={color} weight={600}>
        {kind === 'pos' ? 'energi masuk → makin cepat' : kind === 'zero' ? 'tidak ada energi berpindah' : 'energi diambil → melambat'}
      </Label>
    </g>
  );
};

export const Work: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- definisi (baris 0–1) ----
  const daily = win(t, 0.4, cue(1) + 0.2, 0.7, 0.7);
  const defn = win(t, cue(1) + 0.3, cue(2) - 0.1, 0.8, 0.7);
  const pushT = Math.max(0, t - (cue(1) + 0.8));
  const pushD = Math.max(3, cue(2) + 0.6 - (cue(1) + 0.8)); // masih dipercepat saat memudar (tanpa berhenti mendadak)
  const pushU = Math.min(1.1, pushT / pushD);
  const pushX = 560 + 420 * pushU * pushU;
  const pushV = Math.min(1, pushU); // laju relatif
  const strain = Math.sin(t * 9) * 1.5;

  // ---- koper & tali (baris 2–6) ----
  const scene2 = win(t, cue(2) - 0.2, cue(8) - 0.5, 0.8, 0.6);
  const sx = SX0 + 8 * Math.max(0, t - cue(2)); // laju tetap
  const hx = sx; // titik tali pada pegangan
  const hy = FLOOR - 150 - 22;
  const FL = 380;
  const fx = hx + FL * Math.cos(TH);
  const fy = hy - FL * Math.sin(TH);
  const decomp = ramp(t, wordOf(3, 'dua') - 0.1, wordOf(3, 'dua') + 1.2);
  const perpHi = win(t, cue(4), cue(5) + 0.2, 0.6, 0.6);
  const parHi = ramp(t, cue(5) + 0.2, cue(5) + 1.0);
  const sArrow = ramp(t, cue(6) + 0.3, cue(6) + 1.3);
  const formula = win(t, cue(6) + 0.4, cue(11) - 0.2, 0.8, 0.7);
  const cosHi = win(t, cue(7), cue(8) + 0.4, 0.4, 0.6);
  const press = 1 - 0.4 * decomp; // tekanan ke lantai berkurang oleh F sin θ
  const camZ = 1 + 0.06 * win(t, cue(3) - 0.2, cue(6) - 0.2, 1.6, 1.6);
  const camC = {x: hx + 160, y: hy + 40};
  const ropeEnd = {x: hx + RL * Math.cos(TH), y: hy - RL * Math.sin(TH)};
  const ropePh = (t * 0.7) % 1;

  // ---- tiga kasus tanda (baris 8–10) ----
  const pPos = win(t, cue(8) - 0.2, cue(11) - 0.3, 0.7, 0.7);
  const pZero = win(t, cue(9) - 0.2, cue(11) - 0.3, 0.7, 0.7);
  const pNeg = win(t, cue(10) - 0.2, cue(11) - 0.3, 0.7, 0.7);

  // ---- tas dipegang diam (baris 11–12) ----
  const bag = ramp(t, cue(11) + 0.2, cue(11) + 1.2);
  const muscle = ramp(t, wordOf(12, 'Pegalnya') - 0.2, wordOf(12, 'Pegalnya') + 1);
  const PS = 1.9;
  const PY = 800;
  const shoulder = {x: 820, y: PY - 128 * PS};
  const handX = 905;
  const handY = PY - 82 * PS;
  const elbow = {x: (shoulder.x + handX) / 2, y: (shoulder.y + handY) / 2};

  return (
    <AbsoluteFill>
      <Stage>
        {/* sehari-hari: mendorong dinding sampai berkeringat (dinding tak bergeser) */}
        <g opacity={daily}>
          <Ground x1={560} x2={1360} y={FLOOR} />
          <rect x={1080} y={430} width={120} height={FLOOR - 430} fill="#16214a" stroke={C.muted} strokeWidth={3} />
          {Array.from({length: 8}, (_, r) => (
            <g key={r}>
              <line x1={1080} y1={430 + r * 39} x2={1200} y2={430 + r * 39} stroke={C.faint} strokeWidth={2} />
              <line x1={1080 + (r % 2 ? 40 : 80)} y1={430 + r * 39} x2={1080 + (r % 2 ? 40 : 80)} y2={469 + r * 39} stroke={C.faint} strokeWidth={2} />
            </g>
          ))}
          <ellipse cx={960} cy={FLOOR + 3} rx={70} ry={6} fill="#000" opacity={0.35} />
          <LeanPerson x={960} y={FLOOR} lean={18 + strain * 0.4} s={1.55} hx={1078} hy={560 + strain} />
          {[0, 1, 2].map((i) => {
            const ph = (t * 0.6 + i / 3) % 1;
            return <path key={i} d={`M${1012 + i * 9},${478 + ph * 80} q-5,8 0,12 q5,-4 0,-12 Z`} fill={C.pot} opacity={cyc(ph) * 0.9} />;
          })}
          {[0, 1].map((i) => (
            <path key={`st${i}`} d={`M${1000 - i * 14},${470 - i * 12} q-14,-8 -22,-24`} fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" opacity={0.4 + 0.4 * Math.sin(t * 6 + i)} />
          ))}
          <Label x={960} y={FLOOR + 60} size={24} color={C.muted}>
            capek… tetapi dindingnya tidak bergeser
          </Label>
        </g>

        {/* definisi: dorongan memindahkan energi ke peti */}
        <g opacity={defn}>
          <Ground x1={360} x2={1560} y={FLOOR} />
          <ellipse cx={pushX} cy={FLOOR + 4} rx={90} ry={7} fill="#000" opacity={0.4} />
          {[0, 1, 2].map((i) => {
            const ph = (t * 1.3 + i / 3) % 1;
            return <circle key={i} cx={pushX - 90 - ph * 70} cy={FLOOR - 6 - ph * 24} r={4 + ph * 10} fill={C.muted} opacity={0.25 * cyc(ph) * pushV} />;
          })}
          {[-30, 0, 30].map((o) => (
            <line key={o} x1={pushX - 250} y1={FLOOR - 60 + o + 34} x2={pushX - 250 - 90 * pushV} y2={FLOOR - 60 + o + 34} stroke={C.ink} strokeOpacity={0.25 * pushV} strokeWidth={3} strokeLinecap="round" />
          ))}
          <Glow x={pushX} y={FLOOR - 60} r={140} color="kin" opacity={0.7 * pushV * pushV} />
          <Crate x={pushX} y={FLOOR} w={160} h={120} color={C.pot} />
          <Arrow x1={pushX - 230} y1={FLOOR - 60} x2={pushX - 92} y2={FLOOR - 60} color="force" width={7} />
          <Label x={pushX - 170} y={FLOOR - 100} size={30} font="serif" italic color={C.force}>
            F
          </Label>
          <Stream pts={[[pushX - 220, FLOOR - 60], [pushX - 20, FLOOR - 60]]} color="work" n={6} speed={0.8} r={6} jitter={14} />
          {/* energi kinetik peti naik */}
          <Stream pts={[[pushX + 60, FLOOR - 110], [1240, 520], [1325, 740 - 200 * pushV * pushV - 10]]} color="kin" n={6} speed={0.6} r={4} opacity={pushV} seed={2} />
          <rect x={1300} y={540} width={50} height={200} rx={8} fill={C.kin} opacity={0.1} stroke={C.kin} strokeOpacity={0.35} strokeWidth={2} />
          <rect x={1300} y={740 - 200 * Math.min(1, pushV * pushV)} width={50} height={200 * Math.min(1, pushV * pushV)} rx={8} fill={C.kin} />
          <Label x={1325} y={512} size={30} font="serif" italic color={C.kin} weight={600}>
            K
          </Label>
        </g>

        {/* koper ditarik tali miring */}
        <g opacity={scene2} transform={`translate(${camC.x} ${camC.y}) scale(${camZ}) translate(${-camC.x} ${-camC.y})`}>
          <Ground x1={200} x2={1720} y={FLOOR} />
          <Motes x={hx + 160} y={hy - 40} rx={360} ry={200} n={22} color="gold" opacity={0.35} seed={7} />
          <Glow x={hx + 80} y={hy} r={180} color="work" opacity={0.5 * parHi} />
          <ellipse cx={sx} cy={FLOOR + 4} rx={128} ry={8} fill="#000" opacity={0.4} />
          <Crate x={sx} y={FLOOR} w={230} h={150} label="koper" color={C.pot} handle />
          {/* sabuk & sudut koper */}
          <rect x={sx - 70} y={FLOOR - 150} width={12} height={150} fill={C.pot} opacity={0.25} />
          <rect x={sx + 58} y={FLOOR - 150} width={12} height={150} fill={C.pot} opacity={0.25} />
          {/* roda berputar */}
          {[-82, 82].map((o) => (
            <g key={o} transform={`translate(${sx + o} ${FLOOR - 10}) rotate(${((sx - SX0) / 12) * (180 / Math.PI)})`}>
              <circle r={12} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
              <line x1={-9} y1={0} x2={9} y2={0} stroke={C.muted} strokeWidth={2} />
              <line x1={0} y1={-9} x2={0} y2={9} stroke={C.muted} strokeWidth={2} />
            </g>
          ))}
          {/* tekanan koper ke lantai (berkurang saat F sin θ bekerja) */}
          <g opacity={win(t, cue(3) + 0.4, cue(6), 0.6, 0.6)}>
            {[-60, -20, 20, 60].map((o) => (
              <Arrow key={o} x1={sx + o} y1={FLOOR + 8} x2={sx + o} y2={FLOOR + 8 + 40 * press} color="muted" width={3} pulse={false} />
            ))}
          </g>
          {/* tali + tangan penarik */}
          <line x1={hx} y1={hy} x2={ropeEnd.x} y2={ropeEnd.y} stroke={C.muted} strokeWidth={4} />
          <circle cx={hx + (ropeEnd.x - hx) * (0.1 + 0.8 * ropePh)} cy={hy + (ropeEnd.y - hy) * (0.1 + 0.8 * ropePh)} r={4} fill="#fff" opacity={0.5 * cyc(ropePh)} />
          <circle cx={ropeEnd.x} cy={ropeEnd.y} r={16} fill="#1a2550" stroke={C.ink} strokeWidth={3} />
          <path d={`M${ropeEnd.x - 8},${ropeEnd.y - 6} h14 M${ropeEnd.x - 8},${ropeEnd.y + 1} h14 M${ropeEnd.x - 8},${ropeEnd.y + 8} h12`} stroke={C.muted} strokeWidth={2} strokeLinecap="round" />
          <line x1={ropeEnd.x + 12} y1={ropeEnd.y - 8} x2={ropeEnd.x + 70} y2={ropeEnd.y - 40} stroke={C.ink} strokeWidth={7} strokeLinecap="round" opacity={0.8} />
          {/* sudut θ */}
          <path d={`M${hx + 90},${hy} A90,90 0 0 0 ${hx + 90 * Math.cos(TH)},${hy - 90 * Math.sin(TH)}`} fill="none" stroke={C.gold} strokeWidth={3} opacity={ramp(t, cue(2) + 1, cue(2) + 2)} />
          <Label x={hx + 116} y={hy - 30} size={30} font="serif" italic color={C.gold} opacity={ramp(t, cue(2) + 1, cue(2) + 2)}>
            θ
          </Label>
          {/* gaya F */}
          <Arrow x1={hx} y1={hy} x2={fx} y2={fy} color="force" width={7} opacity={ramp(t, cue(2) + 0.6, cue(2) + 1.4) * (1 - 0.35 * decomp)} />
          <Label x={fx + 10} y={fy - 34} size={34} font="serif" italic color={C.force} weight={600} opacity={ramp(t, cue(2) + 0.6, cue(2) + 1.4)}>
            F
          </Label>
          {/* komponen */}
          <g opacity={decomp}>
            <line x1={fx} y1={fy} x2={fx} y2={hy} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={fx} y1={fy} x2={hx} y2={fy} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
            <Arrow x1={hx} y1={hy} x2={hx + (fx - hx) * decomp} y2={hy} color="force" width={7} opacity={1 - parHi} />
            <Arrow x1={hx} y1={hy} x2={hx + (fx - hx) * decomp} y2={hy} color="work" width={7} opacity={parHi} />
            {/* F sin θ: gaya ada, tetapi tidak ada energi yang mengalir lewatnya (tanpa denyut, tanpa aliran) */}
            <Arrow x1={hx} y1={hy} x2={hx} y2={hy - (hy - fy) * decomp} color="cyan" width={6} opacity={1 - 0.6 * parHi} pulse={false} />
            <Label x={fx + 22} y={hy} size={32} font="serif" italic color={C.ink} anchor="start">
              F cos θ
            </Label>
            <Label x={hx - 20} y={(hy + fy) / 2} size={32} font="serif" italic color={C.cyan} anchor="end" opacity={1 - 0.6 * parHi}>
              F sin θ
            </Label>
          </g>
          {/* energi hanya mengalir lewat komponen searah gerak */}
          <Stream pts={[[fx - 6, hy], [hx + 30, hy], [hx + 6, hy + 50], [hx - 10, hy + 100]]} color="work" n={8} speed={0.7} r={5} jitter={5} opacity={parHi * scene2} />
          <Ripple x={hx} y={hy + 70} p={(t - cue(5) - 0.6) / 1.6} r={150} color="work" />
          <g opacity={perpHi}>
            <Label x={hx - 20} y={fy - 60} size={26} color={C.cyan} anchor="end">
              mengurangi tekanan ke lantai
            </Label>
            <Label x={hx - 20} y={fy - 26} size={26} color={C.cyan} anchor="end">
              tidak mempercepat ke depan
            </Label>
          </g>
          <g opacity={parHi}>
            <Label x={fx + 22} y={hy + 40} size={26} color={C.work} weight={600} anchor="start">
              memindahkan energi
            </Label>
          </g>
          {/* perpindahan s */}
          <g opacity={sArrow}>
            <Arrow x1={SX0 - 115} y1={FLOOR + 70} x2={sx - 115} y2={FLOOR + 70} color="cyan" width={5} />
            <Label x={(SX0 + sx) / 2 - 115} y={FLOOR + 104} size={30} font="serif" italic color={C.cyan}>
              s
            </Label>
          </g>
        </g>

        <SignPanel cx={400} t={t - cue(8)} op={pPos} kind="pos" />
        <SignPanel cx={960} t={t - cue(9)} op={pZero} kind="zero" />
        <SignPanel cx={1520} t={t - cue(10)} op={pNeg} kind="neg" />

        {/* tas dipegang diam */}
        <g opacity={bag}>
          <line x1={520} y1={PY} x2={1120} y2={PY} stroke={C.ink} strokeWidth={3} />
          <ellipse cx={850} cy={PY + 4} rx={110} ry={8} fill="#000" opacity={0.35} />
          <ellipse cx={handX} cy={PY + 4} rx={60} ry={6} fill="#000" opacity={0.3} />
          <g transform={`translate(0 ${0.8 * Math.sin(t * 1.6)})`}>
            <Person x={820} y={PY} scale={PS} arm={0} />
          </g>
          {/* aliran energi di dalam tubuh (bukan ke tas) */}
          <Stream pts={[[820, PY - 95 * PS], [820, shoulder.y + 6], [elbow.x, elbow.y]]} color="heat" n={6} speed={0.7} r={4} jitter={2} opacity={muscle} seed={5} />
          <line x1={shoulder.x} y1={shoulder.y} x2={handX + 0.8 * Math.sin(t * 17) * muscle} y2={handY} stroke={C.ink} strokeWidth={7 * PS} strokeLinecap="round" />
          <line x1={handX} y1={handY} x2={handX} y2={handY + 36} stroke={C.muted} strokeWidth={4} />
          <rect x={handX - 55} y={handY + 36} width={110} height={100} rx={14} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
          <rect x={handX - 45} y={handY + 46} width={90} height={8} rx={4} fill="#fff" opacity={0.08} />
          <rect x={handX - 10} y={handY + 60} width={20} height={14} rx={3} fill={C.pot} opacity={0.5} />
          <Arrow x1={handX + 95} y1={handY + 130} x2={handX + 95} y2={handY + 10} color="force" width={6} pulse={false} />
          <Label x={handX + 120} y={handY + 70} size={32} font="serif" italic color={C.force} anchor="start">
            F
          </Label>
          <Label x={handX + 70} y={PY + 40} size={28} color={C.cyan} anchor="start">
            perpindahan s = 0
          </Label>
          {/* keringat */}
          {[0, 1].map((i) => {
            const ph = (t * 0.5 + i * 0.5) % 1;
            return <path key={i} d={`M${790 - i * 12},${PY - 170 * PS + ph * 60} q-5,8 0,12 q5,-4 0,-12 Z`} fill={C.pot} opacity={cyc(ph) * 0.8 * muscle} />;
          })}
          <g opacity={muscle}>
            <Glow x={elbow.x} y={elbow.y} r={110} color="heat" opacity={0.6 + 0.2 * Math.sin(t * 6)} />
            {Array.from({length: 6}, (_, i) => {
              const ph = (t * 0.7 + i / 6) % 1;
              return <Spark key={i} x={elbow.x + 30 * Math.sin(i * 3 + t)} y={elbow.y - ph * 120} r={5} color="heat" opacity={Math.min(1, ph * 6) * (1 - ph)} />;
            })}
            <Label x={760} y={420} size={28} color={C.heat} anchor="end">
              otot terus berkontraksi
            </Label>
            <Label x={760} y={456} size={24} color={C.heat} anchor="end">
              (energi dipakai di dalam tubuh)
            </Label>
          </g>
        </g>
      </Stage>

      <Card x={960} y={330} opacity={daily} accent={C.muted} style={{padding: '18px 36px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 44, color: C.muted}}>
          sehari-hari: usaha = <span style={{color: C.ink}}>berjuang keras</span>
        </div>
      </Card>
      <Card x={960} y={330} opacity={defn} accent={C.work} style={{padding: '18px 36px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 44}}>
          fisika: usaha = <span style={{color: C.work}}>energi yang dipindahkan gaya</span>
        </div>
        <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 6, textAlign: 'center'}}>saat titik kerja gaya ikut berpindah</div>
      </Card>

      <Formula x={1480} y={255} p={formula} accent={C.work} size={64}>
        <V color={C.work}>W</V> = <V color={C.force}>F</V> <V color={C.cyan}>s</V>{' '}
        <span style={{color: interpolateColors(cosHi, [0, 1], [C.ink, C.gold]), textShadow: `0 0 ${24 * cosHi}px rgba(255,201,74,0.8)`}}>cos θ</span>
      </Formula>
      <Card x={1480} y={430} opacity={win(t, cue(7) + 0.3, cue(8) - 0.3, 0.6, 0.5)} accent={C.gold} style={{padding: '14px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, lineHeight: 1.55}}>
          <div>
            θ &lt; 90° → cos θ &gt; 0 → <span style={{color: C.work, fontWeight: 700}}>+</span>
          </div>
          <div>
            θ = 90° → cos θ = 0 → <span style={{color: C.muted, fontWeight: 700}}>0</span>
          </div>
          <div>
            θ &gt; 90° → cos θ &lt; 0 → <span style={{color: C.heat, fontWeight: 700}}>−</span>
          </div>
        </div>
      </Card>
      <Formula x={1450} y={560} p={bag * ramp(t, cue(11) + 1.2, cue(11) + 2.2)} accent={C.work} size={60} caption="tas tidak berpindah, tidak ada energi masuk ke tas">
        <V color={C.work}>
          W<TSubHtml>tangan</TSubHtml>
        </V>{' '}
        = <V color={C.force}>F</V> · <span style={{color: C.cyan}}>0</span> = 0
      </Formula>
    </AbsoluteFill>
  );
};

const TSubHtml: React.FC<{children: React.ReactNode}> = ({children}) => (
  <sub style={{fontSize: '0.55em', verticalAlign: '-0.3em', lineHeight: 0, fontStyle: 'normal'}}>{children}</sub>
);
