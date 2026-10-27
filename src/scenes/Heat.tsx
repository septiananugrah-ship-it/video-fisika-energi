import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, rand, ramp, win} from '../anim';
import {Crate, ELabel, EnergyBars, Ground, HeatShimmer} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Stage, Stream, Sub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Panas = gerak molekul: alat kincir Joule (beban turun → air menghangat, 4,2 J ≈ 1 kal),
// lalu kotak gas N₂ yang molekulnya makin cepat saat suhu naik (K rata-rata = 3/2 kT),
// dan akhirnya gesekan → atom permukaan bergetar lebih hebat.

const NMOL = 34;
const BOX = {x1: 300, y1: 230, x2: 1000, y2: 830};
const MOL = Array.from({length: NMOL}, (_, i) => {
  const ang = rand(i * 4.3) * Math.PI * 2;
  // laju acak berbentuk distribusi Maxwell (jumlah tiga komponen acak)
  const sp = 70 + 120 * Math.hypot(rand(i * 1.9) - 0.5, rand(i * 2.7) - 0.5, rand(i * 3.3) - 0.5);
  return {x0: rand(i * 7.7), y0: rand(i * 5.1), vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, rot: rand(i * 9.9) * 6, spin: (rand(i * 6.1) - 0.5) * 6};
});
/** Pantulan di dinding: posisi bolak-balik (gelombang segitiga) dalam [0, L]. */
const bounce = (p: number, L: number) => {
  const m = ((p % (2 * L)) + 2 * L) % (2 * L);
  return m <= L ? m : 2 * L - m;
};
/** Jarak tempuh sejak pantulan dinding terakhir (px) dan dinding mana (0 atau L). */
const lastHit = (u: number, v: number, L: number) => {
  const k = Math.floor(u / L);
  const r = u - k * L;
  if (v >= 0) return {d: r, wall: k % 2 === 0 ? 0 : L};
  return {d: L - r, wall: (k + 1) % 2 === 0 ? 0 : L};
};

const TANK = {x1: 444, x2: 816, top: 560, bot: 810, cx: 630};

/** Busur elips (perspektif pusaran air). */
const arcPath = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = mix(a0, a1, i / n);
    d += `${i ? 'L' : 'M'}${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + ry * Math.sin(a)).toFixed(1)}`;
  }
  return d;
};

/** Termometer kaca dengan skala, kilau, dan pendar raksa. */
const Thermo: React.FC<{x: number; top: number; bot: number; level: number; glow: number; t: number}> = ({x, top, bot, level, glow, t}) => {
  const len = bot - top - 20;
  const yTop = bot - 10 - len * level;
  return (
    <g>
      <rect x={x - 11} y={top} width={22} height={bot - top} rx={11} fill="#0a1024" stroke={C.ink} strokeWidth={2.5} />
      {Array.from({length: 9}, (_, i) => (
        <line key={i} x1={x + 11} y1={top + 24 + (i * (len - 10)) / 8} x2={x + (i % 2 ? 18 : 24)} y2={top + 24 + (i * (len - 10)) / 8} stroke={C.muted} strokeWidth={2} />
      ))}
      <rect x={x - 6} y={yTop} width={12} height={bot - yTop} rx={6} fill={C.heat} />
      <rect x={x - 4} y={yTop + 6} width={3} height={Math.max(0, bot - yTop - 16)} rx={1.5} fill="#fff" opacity={0.35} />
      <circle cx={x} cy={yTop} r={18} fill="url(#soft-heat)" opacity={0.5 + 0.5 * glow * (0.75 + 0.25 * Math.sin(t * 3))} />
      <circle cx={x} cy={bot + 10} r={40} fill="url(#soft-heat)" opacity={0.4 + 0.5 * glow} />
      <circle cx={x} cy={bot + 10} r={20} fill={C.heat} stroke={C.ink} strokeWidth={2.5} />
      <circle cx={x - 6} cy={bot + 4} r={5} fill="#fff" opacity={0.45} />
    </g>
  );
};

export const Heat: React.FC = () => {
  const {t, cue, fps} = useScene();

  // ===== bagian A: alat Joule =====
  const phaseA = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  const appIn = ramp(t, 0, 1.0);
  const tF0 = cue(1) + 1.6;
  const tF1 = cue(3) - 0.4;
  const fallAt = (tt: number) => ramp(tt, tF0, tF1, EASE_IN_OUT);
  const fall = fallAt(t);
  // laju turun ternormalisasi (0 saat diam, 1 di tengah jatuh)
  const churn = Math.min(1, (((fallAt(t + 0.04) - fallAt(t - 0.04)) / 0.08) * (tF1 - tF0)) / 2);
  const stir = 0.2 * fall + 0.8 * churn;
  const shaftRot = fall * 360 * 7;
  const yW = mix(420, 760, fall);
  const wx = 1026 + 5 * Math.sin(t * 1.7) * (1 - fall);
  const temp = 0.3 + 0.32 * fall;
  const barsIn = ramp(t, cue(2) - 0.2, cue(2) + 0.6);
  const calCard = ramp(t, cue(3) + 0.3, cue(3) + 1.1);
  const joule = win(t, cue(1) + 0.2, cue(4) - 0.6, 0.6, 0.5);
  const flowA = win(t, tF0 - 0.2, tF1 - 0.8, 0.6, 1.0);
  // kamera: dorong pelan ke bejana saat "air menjadi lebih hangat", lalu kembali
  const camA = ramp(t, cue(2) - 0.3, cue(2) + 1.8, EASE_IN_OUT) * (1 - ramp(t, cue(3) + 0.4, cue(3) + 2.2, EASE_IN_OUT));
  const zA = 1 + 0.07 * camA;
  const swirlA = (shaftRot * 0.6 + t * 30 * (0.3 + fall)) * (Math.PI / 180);
  const swirlCol = interpolateColors(fall, [0, 1], ['#bfe0ff', C.heat]);
  const surf = (x: number) => TANK.top + (1.5 + 5 * stir) * Math.sin(x * 0.035 - t * 3.2) * (0.6 + 0.4 * Math.sin(x * 0.011 + t * 1.3));
  let surfD = '';
  for (let x = TANK.x1; x <= TANK.x2 + 0.1; x += 24.8) surfD += `${surfD ? ' L' : 'M'}${x.toFixed(1)},${surf(x).toFixed(1)}`;
  const waterD = `M${TANK.x1},${TANK.bot} ${surfD.replace('M', 'L')} L${TANK.x2},${TANK.bot} Z`;

  // ===== bagian B: kotak gas =====
  const phaseB = ramp(t, cue(4) - 0.2, cue(4) + 0.8);
  // faktor laju ∝ √T: naik saat baris 5, kembali ke suhu kamar saat baris 6
  const speedAt = (tt: number) => 1 + 0.75 * ramp(tt, cue(5) + 3.0, cue(5) + 6.0, EASE_IN_OUT) * (1 - ramp(tt, cue(6) - 0.4, cue(6) + 1.0, EASE_IN_OUT));
  // integral laju terhadap waktu (posisi = ∫ v dt), dihitung ulang per frame
  const steps = Math.max(1, Math.round((t * fps) / 3));
  let S = 0;
  for (let i = 0; i < steps; i++) S += speedAt(((i + 0.5) / steps) * t) * (t / steps);
  const f = speedAt(t);
  const hot = (f - 1) / 0.75;
  const kCard = ramp(t, cue(5) + 0.3, cue(5) + 1.1);
  const n2 = win(t, cue(6) + 0.4, cue(7) - 0.2, 0.6, 0.5);
  const bigMol = win(t, cue(4) + 0.5, cue(6) - 0.5, 0.8, 0.6);
  const fric = ramp(t, cue(7) + 0.2, cue(7) + 1.0);
  const slide = ramp(t, cue(7) + 0.6, cue(7) + 5.0, (x) => 1 - (1 - x) * (1 - x)); // perlambatan seragam
  const slideV = (1 - ramp(t, cue(7) + 0.6, cue(7) + 5.0, (x) => x)) * ramp(t, cue(7) + 0.6, cue(7) + 0.9);
  const heatAmt = ramp(t, cue(7) + 1.0, cue(7) + 5.0);
  const mag = ramp(t, cue(7) + 0.7, cue(7) + 1.7, BACK);
  const tempB = 0.42 + 0.3 * hot;

  const W = BOX.x2 - BOX.x1 - 40;
  const Hh = BOX.y2 - BOX.y1 - 40;
  const molPos = (m: (typeof MOL)[number], SS: number): [number, number] => [BOX.x1 + 20 + bounce(m.x0 * W + m.vx * SS, W), BOX.y1 + 20 + bounce(m.y0 * Hh + m.vy * SS, Hh)];
  const pos = MOL.map((m) => molPos(m, S));
  // kilatan tabrakan antar-molekul (halus: makin dekat makin terang)
  const bumps: {x: number; y: number; o: number}[] = [];
  if (phaseB > 0.01) {
    for (let i = 0; i < NMOL; i++)
      for (let j = i + 1; j < NMOL; j++) {
        const d = Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]);
        if (d < 30) bumps.push({x: (pos[i][0] + pos[j][0]) / 2, y: (pos[i][1] + pos[j][1]) / 2, o: 1 - d / 30});
      }
  }
  const crX = mix(1260, 1600, slide);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= alat Joule ================= */}
        <g opacity={phaseA * appIn}>
          <g transform={`translate(640 640) scale(${zA}) translate(-640 -640)`}>
            <Motes x={630} y={600} rx={330} ry={260} n={26} color="heat" opacity={0.25 + 0.3 * fall} seed={4} />
            {/* bayangan lantai */}
            <ellipse cx={630} cy={846} rx={250} ry={12} fill="#000" opacity={0.35} />
            {/* jaket insulasi kayu + bejana */}
            <rect x={406} y={488} width={448} height={354} rx={22} fill="url(#heat-wood)" stroke={C.faint} strokeWidth={3} />
            {[530, 600, 670, 740, 810].map((yy) => (
              <line key={yy} x1={414} y1={yy} x2={846} y2={yy} stroke="#000" strokeOpacity={0.18} strokeWidth={2} />
            ))}
            <rect x={420} y={500} width={420} height={330} rx={18} fill="#141d3e" stroke={C.muted} strokeWidth={4} />
            <Glow x={630} y={690} r={260} color="heat" opacity={fall * 0.8} />
            <path d={waterD} fill="url(#water)" opacity={0.78} />
            <path d={surfD} fill="none" stroke="#cfe7ff" strokeOpacity={0.55} strokeWidth={2.5} />
            {/* pusaran air (warna menghangat) & riak panas dari bilah */}
            {Array.from({length: 6}, (_, i) => {
              const cy = i % 2 ? 735 : 655;
              const rx = 70 + (i >> 1) * 42;
              const a0 = swirlA * (1 + i * 0.12) + i * 2.1;
              return <path key={i} d={arcPath(630, cy, rx, rx * 0.2, a0, a0 + 1.5)} fill="none" stroke={swirlCol} strokeWidth={3} strokeLinecap="round" opacity={0.6 * stir} />;
            })}
            {[0, 1, 2].map((i) => {
              const ph = (((t * 0.55 + i / 3) % 1) + 1) % 1;
              return <ellipse key={i} cx={630} cy={700} rx={30 + 150 * ph} ry={(30 + 150 * ph) * 0.3} fill="none" stroke={C.heat} strokeWidth={3 * (1 - ph) + 0.5} opacity={cyc(ph) * 0.55 * fall} />;
            })}
            {Array.from({length: 11}, (_, i) => {
              const ph = (((t * (0.35 + rand(i * 2.3) * 0.3) + rand(i)) % 1) + 1) % 1;
              const bx = 466 + rand(i * 5.7) * 330 + 6 * Math.sin(t * 3 + i);
              const by = mix(800, 572, ph);
              return <circle key={i} cx={bx} cy={by} r={2.5 + 3 * rand(i * 3.1)} fill="none" stroke="#e6f3ff" strokeWidth={1.8} opacity={cyc(ph) * (0.25 + 0.75 * stir)} />;
            })}
            {/* poros & bilah kincir (berputar: lebar tampak = |cos|), bayangan gerak saat cepat */}
            <line x1={630} y1={300} x2={630} y2={780} stroke={C.ink} strokeWidth={6} />
            {[0, 1, 2, 3].map((k) =>
              [0, 1].map((ghost) => {
                const a = ((shaftRot - ghost * 22 + k * 90) * Math.PI) / 180;
                const wv = 150 * Math.cos(a);
                const front = Math.sin(a) > 0;
                return [620, 700].map((yy) => (
                  <rect
                    key={`${k}-${yy}-${ghost}`}
                    x={630 + Math.min(0, wv)}
                    y={yy}
                    width={Math.abs(wv)}
                    height={46}
                    rx={4}
                    fill={front ? '#c7d2f5' : '#5d6a99'}
                    opacity={ghost ? 0.3 * churn : 0.9}
                  />
                ));
              }),
            )}
            {/* sirip tetap di dinding */}
            {[600, 680, 760].map((yy) => (
              <g key={yy}>
                <rect x={446} y={yy} width={40} height={14} fill={C.muted} />
                <rect x={774} y={yy} width={40} height={14} fill={C.muted} />
              </g>
            ))}
            {/* tutup bejana */}
            <rect x={414} y={490} width={432} height={16} rx={8} fill="#1d2850" stroke={C.muted} strokeWidth={2.5} />
            <HeatShimmer x1={470} x2={720} y={492} t={t} amount={fall * 0.8} />
            {/* termometer */}
            <Thermo x={767} top={430} bot={790} level={temp} glow={fall} t={t} />
            <Label x={796} y={430} size={26} font="serif" italic anchor="start" color={C.heat}>
              T
            </Label>
            {/* drum, tali, katrol, beban */}
            <g transform={`translate(630 300) rotate(${shaftRot})`}>
              <ellipse rx={30} ry={22} fill="#1a2550" stroke={C.ink} strokeWidth={3} />
              <line x1={-26} y1={0} x2={26} y2={0} stroke={C.muted} strokeWidth={2.5} />
            </g>
            <line x1={660} y1={290} x2={1000} y2={290} stroke={C.ink} strokeWidth={3} />
            <line x1={1000} y1={250} x2={1000} y2={290} stroke={C.muted} strokeWidth={4} />
            <g transform={`translate(1000 316) rotate(${fall * 900})`}>
              <circle r={26} fill="#0e1530" stroke={C.ink} strokeWidth={3} />
              <line x1={-20} y1={0} x2={20} y2={0} stroke={C.muted} strokeWidth={3} />
              <line x1={0} y1={-20} x2={0} y2={20} stroke={C.muted} strokeWidth={3} />
            </g>
            <line x1={1026} y1={316} x2={wx} y2={yW - 60} stroke={C.ink} strokeWidth={3} />
            {/* landasan beban + bayangan yang menajam saat beban mendekat */}
            <ellipse cx={1026} cy={806} rx={30 + 26 * fall} ry={7} fill="#000" opacity={0.15 + 0.35 * fall} />
            <line x1={962} y1={802} x2={1090} y2={802} stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
            {[990, 1062].map((lx, i) => (
              <line key={lx} x1={lx} y1={yW - 80 - 30 * i} x2={lx} y2={yW - 150 - 30 * i} stroke={C.pot} strokeWidth={3} strokeLinecap="round" opacity={0.55 * churn} />
            ))}
            <Glow x={wx} y={yW - 10} r={90} color="pot" opacity={0.6 * (1 - fall) * appIn} />
            <Crate x={wx} y={yW + 40} w={90} h={100} label="m" color={C.pot} />
            <Label x={1026} y={yW + 72} size={22} anchor="middle" color={C.pot} opacity={joule}>
              beban turun
            </Label>
            {/* energi beban mengalir lewat tali ke kincir lalu ke air */}
            <Stream
              pts={[
                [1026, yW - 62],
                [1026, 318],
                [1016, 296],
                [1000, 290],
                [660, 290],
                [630, 302],
                [630, 660],
              ]}
              color="pot"
              n={12}
              speed={0.32}
              r={5}
              jitter={2}
              opacity={flowA}
            />
            <Label x={420} y={236} size={24} color={C.muted} anchor="start" opacity={joule}>
              percobaan James Joule, 1840-an
            </Label>
          </g>
          <EnergyBars
            x={1240}
            y={800}
            height={260}
            barW={70}
            gap={34}
            max={1.05}
            showValues={false}
            unit=""
            title="ENERGI"
            opacity={barsIn}
            bars={[
              {key: 'Ug', label: ELabel.Ug, value: 1 - fall, color: 'pot'},
              {key: 'Th', label: ELabel.Th, value: fall, color: 'heat'},
            ]}
          />
          <Glow x={1480} y={300} r={280} color="heat" opacity={0.45 * calCard} />
          <Twinkles x={1480} y={300} rx={260} ry={110} n={6} color="gold" opacity={calCard * (1 - ramp(t, cue(3) + 4, cue(3) + 6))} seed={3} />
        </g>

        {/* ================= kotak gas ================= */}
        <g opacity={phaseB}>
          <rect x={BOX.x1} y={BOX.y1} width={BOX.x2 - BOX.x1} height={BOX.y2 - BOX.y1} rx={16} fill="rgba(10,16,36,0.6)" stroke={C.muted} strokeWidth={3} />
          <rect x={BOX.x1 + 10} y={BOX.y1 + 10} width={BOX.x2 - BOX.x1 - 20} height={8} rx={4} fill="#fff" opacity={0.05} />
          <Glow x={650} y={830} r={300} color="heat" opacity={0.15 + 0.5 * hot} />
          {/* pemanas di bawah kotak */}
          <rect x={360} y={838} width={580} height={12} rx={6} fill={interpolateColors(hot, [0, 1], ['#2a3358', C.heat])} opacity={0.9} />
          <HeatShimmer x1={380} x2={920} y={830} t={t} amount={0.9 * hot} />
          {/* kilatan di dinding saat molekul memantul */}
          {MOL.map((m, i) => {
            const out: React.ReactNode[] = [];
            const [x, y] = pos[i];
            const hx = lastHit(m.x0 * W + m.vx * S, m.vx, W);
            const px = hx.d / (Math.abs(m.vx) * f) / 0.45;
            if (px < 1) {
              const wxp = hx.wall === 0 ? BOX.x1 : BOX.x2;
              out.push(<line key={`x${i}`} x1={wxp} y1={y - 22} x2={wxp} y2={y + 22} stroke={C.kin} strokeWidth={4} strokeLinecap="round" opacity={(1 - px) * 0.7} />);
            }
            const hy = lastHit(m.y0 * Hh + m.vy * S, m.vy, Hh);
            const py = hy.d / (Math.abs(m.vy) * f) / 0.45;
            if (py < 1) {
              const wyp = hy.wall === 0 ? BOX.y1 : BOX.y2;
              out.push(<line key={`y${i}`} x1={x - 22} y1={wyp} x2={x + 22} y2={wyp} stroke={C.kin} strokeWidth={4} strokeLinecap="round" opacity={(1 - py) * 0.7} />);
            }
            return out;
          })}
          {bumps.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={14 + 22 * (1 - b.o)} fill="url(#soft-gold)" opacity={b.o} />
          ))}
          {MOL.map((m, i) => {
            const [x, y] = pos[i];
            const a = m.rot + m.spin * S;
            const dx = 11 * Math.cos(a);
            const dy = 11 * Math.sin(a);
            const tracked = i === 3;
            const hi = tracked ? n2 : 0;
            const col = tracked ? C.gold : '#cfdcff';
            return (
              <g key={i}>
                {[1, 2, 3].map((k) => {
                  const [tx, ty] = molPos(m, S - f * 0.075 * k);
                  return <circle key={k} cx={tx} cy={ty} r={7 - 1.5 * k} fill={tracked ? C.gold : C.kin} opacity={(0.5 - 0.13 * k) * (0.6 + 0.4 * hot)} />;
                })}
                {tracked ? <circle cx={x} cy={y} r={44} fill="url(#soft-gold)" opacity={hi} /> : null}
                <circle cx={x - dx} cy={y - dy} r={10} fill={col} opacity={0.9} />
                <circle cx={x + dx} cy={y + dy} r={10} fill={col} opacity={0.9} />
              </g>
            );
          })}
          {/* molekul yang dilacak: panah kecepatan saat dibahas */}
          {n2 > 0.01
            ? (() => {
                const m = MOL[3];
                const [x, y] = pos[3];
                const v = Math.hypot(m.vx, m.vy);
                return <Arrow x1={x} y1={y} x2={x + (m.vx * f * 0.6 * 100) / v} y2={y + (m.vy * f * 0.6 * 100) / v} color="kin" width={4} opacity={n2} pulse={false} />;
              })()
            : null}
          <Label x={BOX.x1 + 20} y={BOX.y1 - 28} size={24} anchor="start" color={C.muted}>
            gas nitrogen, N₂ (diperbesar, diperlambat)
          </Label>
          {/* termometer kotak */}
          <Thermo x={1051} top={300} bot={780} level={tempB} glow={hot} t={t} />
          <Label x={1051} y={270} size={26} font="serif" italic color={C.heat}>
            T
          </Label>

          {/* satu molekul diperbesar: K = energi geraknya */}
          <g opacity={bigMol}>
            {(() => {
              const cx = 1450 + 50 * Math.sin(t * 0.9);
              const cy = 610 + 18 * Math.sin(t * 1.3 + 1);
              const a = t * 0.9;
              const bl = 36 + 4 * Math.sin(t * 9);
              const vx = 50 * 0.9 * Math.cos(t * 0.9);
              const len = 120 * f;
              return (
                <g>
                  <Motes x={cx} y={cy} rx={190} ry={120} n={18} color="kin" opacity={0.5} seed={7} />
                  {[1, 2, 3].map((k) => (
                    <line key={k} x1={cx - 70 - 26 * k} y1={cy - 30 + 30 * (k - 1)} x2={cx - 120 - 26 * k - 30 * f} y2={cy - 30 + 30 * (k - 1)} stroke={C.kin} strokeWidth={3} strokeLinecap="round" opacity={0.25 + 0.15 * f} />
                  ))}
                  <circle cx={cx} cy={cy} r={110} fill="url(#soft-cyan)" opacity={0.5} />
                  <line x1={cx - bl * Math.cos(a)} y1={cy - bl * Math.sin(a)} x2={cx + bl * Math.cos(a)} y2={cy + bl * Math.sin(a)} stroke="#fff" strokeOpacity={0.6} strokeWidth={10} />
                  {[-1, 1].map((s) => (
                    <g key={s}>
                      <circle cx={cx + s * bl * Math.cos(a)} cy={cy + s * bl * Math.sin(a)} r={38} fill="#cfdcff" stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
                      <circle cx={cx + s * bl * Math.cos(a) - 12} cy={cy + s * bl * Math.sin(a) - 12} r={9} fill="#fff" opacity={0.6} />
                    </g>
                  ))}
                  <Arrow x1={cx + 50} y1={cy + 70} x2={cx + 50 + len + vx * 0.2} y2={cy + 70} color="kin" width={6} />
                  <Label x={cx + 70 + len + vx * 0.2} y={cy + 70} size={34} font="serif" italic color={C.kin} anchor="start" weight={600}>
                    v
                  </Label>
                  <Label x={cx} y={cy - 92} size={26} color={C.ink} weight={600}>
                    N₂
                  </Label>
                </g>
              );
            })()}
          </g>

          {/* gesekan → atom permukaan bergetar */}
          <g opacity={fric}>
            <Ground x1={1170} x2={1790} y={500} rough heat={heatAmt * 0.8} />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={crX - 80 - 20 * k} y1={444 + 18 * k} x2={crX - 80 - 20 * k - 70 * slideV} y2={444 + 18 * k} stroke={C.kin} strokeWidth={3} strokeLinecap="round" opacity={0.6 * slideV} />
            ))}
            <ellipse cx={crX} cy={504} rx={70} ry={6} fill="#000" opacity={0.35} />
            <Crate x={crX} y={500} w={130} h={84} color={C.kin} />
            <HeatShimmer x1={1200} x2={mix(1300, 1650, slide)} y={500} t={t} amount={heatAmt} />
            <Stream
              pts={[
                [crX, 506],
                [mix(crX, 1480, 0.5), 545],
                [1480, 590],
              ]}
              color="heat"
              n={7}
              speed={0.6}
              r={4}
              jitter={3}
              opacity={heatAmt * mag * 0.9}
            />
            <line x1={1480} y1={506} x2={1480} y2={574} stroke={C.muted} strokeWidth={2} strokeDasharray="5 6" />
            <g transform={`translate(1480 712) scale(${Math.max(0.01, mag)}) translate(-1480 -712)`}>
              <circle cx={1480} cy={712} r={170} fill="url(#soft-heat)" opacity={0.3 + 0.5 * heatAmt} />
              <circle cx={1480} cy={712} r={136} fill="rgba(8,12,28,0.92)" stroke={C.heat} strokeOpacity={0.7} strokeWidth={3} />
              {Array.from({length: 24}, (_, i) => {
                const gx = i % 6;
                const gy = Math.floor(i / 6);
                const amp = 2 + 9 * heatAmt;
                const x = 1480 - 125 + 50 * gx + amp * Math.sin(t * (9 + rand(i) * 5) + i);
                const y = 640 + 48 * gy + amp * Math.cos(t * (8 + rand(i * 3) * 6) + i * 2);
                const d = Math.hypot(x - 1480, y - 712);
                return d < 118 ? (
                  <g key={i}>
                    <circle cx={x} cy={y} r={20} fill="url(#soft-heat)" opacity={heatAmt} />
                    <circle cx={x} cy={y} r={14} fill={C.heat} opacity={0.5 + 0.4 * heatAmt} />
                    <circle cx={x - 4} cy={y - 4} r={4} fill="#fff" opacity={0.35} />
                  </g>
                ) : null;
              })}
            </g>
            <Label x={1640} y={604} size={22} anchor="start" color={C.heat} opacity={mag > 0.5 ? 1 : mag * 2}>
              atom permukaan
            </Label>
          </g>
        </g>
        <defs>
          <linearGradient id="heat-wood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a2a24" />
            <stop offset="50%" stopColor="#5a3d2e" />
            <stop offset="100%" stopColor="#2e211c" />
          </linearGradient>
        </defs>
      </Stage>

      <Formula x={1480} y={300} p={calCard * phaseA} accent={C.heat} size={60} caption="usaha mekanik setara dengan panas">
        4,2 J ≈ 1 kal
      </Formula>
      <Formula x={1450} y={300} p={kCard * phaseB} accent={C.kin} size={58} caption="k = tetapan Boltzmann · T dalam kelvin">
        <V color={C.kin}>K</V>
        <Sub>rata-rata</Sub> = <Frac n="3" d="2" /> <V>k</V>
        <V>T</V>
      </Formula>
      <Note x={1450} y={560} p={n2} color={C.gold} size={30}>
        N₂ pada suhu kamar: <Tint c={C.gold}>≈ 500 m/s</Tint>
        <div style={{fontSize: 24, color: C.muted}}>sekitar 1800 km/jam, terus bertabrakan</div>
      </Note>
    </AbsoluteFill>
  );
};
