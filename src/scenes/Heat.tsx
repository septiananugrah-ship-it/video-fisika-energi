import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, rand, ramp, win} from '../anim';
import {Crate, ELabel, EnergyBars, Ground, HeatShimmer} from '../components/physics';
import {Formula, Frac, Glow, Label, Note, Stage, Sub, Tint, V} from '../components/primitives';
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

export const Heat: React.FC = () => {
  const {t, cue, fps} = useScene();

  // ===== bagian A: alat Joule =====
  const phaseA = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  const appIn = ramp(t, 0, 1.0);
  const fall = ramp(t, cue(1) + 1.6, cue(3) - 0.4, EASE_IN_OUT);
  const shaftRot = fall * 360 * 7;
  const yW = mix(420, 760, fall);
  const temp = 0.3 + 0.32 * fall;
  const barsIn = ramp(t, cue(2) - 0.2, cue(2) + 0.6);
  const calCard = ramp(t, cue(3) + 0.3, cue(3) + 1.1);
  const joule = win(t, cue(1) + 0.2, cue(4) - 0.6, 0.6, 0.5);

  // ===== bagian B: kotak gas =====
  const phaseB = ramp(t, cue(4) - 0.2, cue(4) + 0.8);
  // faktor laju ∝ √T: naik saat baris 5, kembali ke suhu kamar saat baris 6
  const speedAt = (tt: number) => 1 + 0.75 * ramp(tt, cue(5) + 3.0, cue(5) + 6.0, EASE_IN_OUT) * (1 - ramp(tt, cue(6) - 0.4, cue(6) + 1.0, EASE_IN_OUT));
  // integral laju terhadap waktu (posisi = ∫ v dt), dihitung ulang per frame
  const steps = Math.max(1, Math.round(t * fps / 3));
  let S = 0;
  for (let i = 0; i < steps; i++) S += speedAt(((i + 0.5) / steps) * t) * (t / steps);
  const f = speedAt(t);
  const kCard = ramp(t, cue(5) + 0.3, cue(5) + 1.1);
  const n2 = win(t, cue(6) + 0.4, cue(7) - 0.2, 0.6, 0.5);
  const fric = ramp(t, cue(7) + 0.2, cue(7) + 1.0);
  const slide = ramp(t, cue(7) + 0.6, cue(7) + 5.0, (x) => 1 - (1 - x) * (1 - x)); // perlambatan seragam
  const heatAmt = ramp(t, cue(7) + 1.0, cue(7) + 5.0);
  const tempB = 0.42 + 0.3 * (f - 1) / 0.75;

  const W = BOX.x2 - BOX.x1 - 40;
  const Hh = BOX.y2 - BOX.y1 - 40;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= alat Joule ================= */}
        <g opacity={phaseA * appIn}>
          {/* bejana berinsulasi */}
          <rect x={420} y={500} width={420} height={330} rx={18} fill="#141d3e" stroke={C.muted} strokeWidth={4} />
          <rect x={444} y={560} width={372} height={250} rx={8} fill="url(#water)" opacity={0.75} />
          <Glow x={630} y={690} r={260} color="heat" opacity={fall * 0.8} />
          {/* poros & bilah kincir (berputar: lebar tampak = |cos|) */}
          <line x1={630} y1={300} x2={630} y2={780} stroke={C.ink} strokeWidth={6} />
          {[0, 1, 2, 3].map((k) => {
            const a = ((shaftRot + k * 90) * Math.PI) / 180;
            const wv = 150 * Math.cos(a);
            const front = Math.sin(a) > 0;
            return [620, 700].map((yy) => (
              <rect key={`${k}-${yy}`} x={630 + Math.min(0, wv)} y={yy} width={Math.abs(wv)} height={46} rx={4} fill={front ? '#c7d2f5' : '#5d6a99'} opacity={0.9} />
            ));
          })}
          {/* sirip tetap di dinding */}
          {[600, 680, 760].map((yy) => (
            <g key={yy}>
              <rect x={446} y={yy} width={40} height={14} fill={C.muted} />
              <rect x={774} y={yy} width={40} height={14} fill={C.muted} />
            </g>
          ))}
          {/* termometer */}
          <rect x={756} y={430} width={22} height={360} rx={11} fill="#0a1024" stroke={C.ink} strokeWidth={2.5} />
          <rect x={761} y={790 - 340 * temp} width={12} height={340 * temp} rx={6} fill={C.heat} />
          <circle cx={767} cy={800} r={20} fill={C.heat} stroke={C.ink} strokeWidth={2.5} />
          <Label x={796} y={430} size={26} font="serif" italic anchor="start" color={C.heat}>
            T
          </Label>
          {/* drum, tali, katrol, beban */}
          <rect x={600} y={278} width={60} height={44} rx={8} fill="#1a2550" stroke={C.ink} strokeWidth={3} />
          <line x1={660} y1={290} x2={1000} y2={290} stroke={C.ink} strokeWidth={3} />
          <g transform={`translate(1000 316) rotate(${fall * 900})`}>
            <circle r={26} fill="#0e1530" stroke={C.ink} strokeWidth={3} />
            <line x1={-20} y1={0} x2={20} y2={0} stroke={C.muted} strokeWidth={3} />
          </g>
          <line x1={1026} y1={316} x2={1026} y2={yW - 60} stroke={C.ink} strokeWidth={3} />
          <Crate x={1026} y={yW + 40} w={90} h={100} label="m" color={C.pot} />
          <Label x={1026} y={yW + 72} size={22} anchor="middle" color={C.pot} opacity={joule}>
            beban turun
          </Label>
          <Label x={630} y={862} size={24} color={C.muted} opacity={joule}>
            percobaan James Joule, 1840-an
          </Label>
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
        </g>

        {/* ================= kotak gas ================= */}
        <g opacity={phaseB}>
          <rect x={BOX.x1} y={BOX.y1} width={BOX.x2 - BOX.x1} height={BOX.y2 - BOX.y1} rx={16} fill="rgba(10,16,36,0.6)" stroke={C.muted} strokeWidth={3} />
          <Glow x={650} y={830} r={300} color="heat" opacity={0.5 * (f - 1) / 0.75} />
          {MOL.map((m, i) => {
            const x = BOX.x1 + 20 + bounce(m.x0 * W + m.vx * S, W);
            const y = BOX.y1 + 20 + bounce(m.y0 * Hh + m.vy * S, Hh);
            const a = m.rot + m.spin * S;
            const dx = 11 * Math.cos(a);
            const dy = 11 * Math.sin(a);
            const tracked = i === 3;
            const col = tracked ? C.gold : C.pot;
            const hi = tracked ? n2 : 0;
            return (
              <g key={i}>
                {tracked ? <circle cx={x} cy={y} r={40} fill="url(#soft-gold)" opacity={hi} /> : null}
                <circle cx={x - dx} cy={y - dy} r={10} fill={tracked ? col : C.pot} opacity={tracked ? 0.85 + 0.15 * hi : 0.85} />
                <circle cx={x + dx} cy={y + dy} r={10} fill={tracked ? col : C.pot} opacity={tracked ? 0.85 + 0.15 * hi : 0.85} />
              </g>
            );
          })}
          <Label x={BOX.x1 + 20} y={BOX.y1 - 28} size={24} anchor="start" color={C.muted}>
            gas nitrogen, N₂ (diperbesar, diperlambat)
          </Label>
          {/* termometer kotak */}
          <rect x={1040} y={300} width={22} height={480} rx={11} fill="#0a1024" stroke={C.ink} strokeWidth={2.5} />
          <rect x={1045} y={780 - 460 * tempB} width={12} height={460 * tempB} rx={6} fill={C.heat} />
          <circle cx={1051} cy={790} r={20} fill={C.heat} stroke={C.ink} strokeWidth={2.5} />
          <Label x={1051} y={270} size={26} font="serif" italic color={C.heat}>
            T
          </Label>

          {/* gesekan → atom permukaan bergetar */}
          <g opacity={fric}>
            <Ground x1={1170} x2={1790} y={500} rough heat={heatAmt * 0.8} />
            <Crate x={mix(1260, 1600, slide)} y={500} w={130} h={84} color={C.kin} />
            <HeatShimmer x1={1200} x2={mix(1300, 1650, slide)} y={500} t={t} amount={heatAmt} />
            <line x1={1480} y1={506} x2={1480} y2={574} stroke={C.muted} strokeWidth={2} strokeDasharray="5 6" />
            <circle cx={1480} cy={712} r={136} fill="rgba(8,12,28,0.92)" stroke={C.heat} strokeOpacity={0.7} strokeWidth={3} />
            {Array.from({length: 24}, (_, i) => {
              const gx = i % 6;
              const gy = Math.floor(i / 6);
              const amp = 2 + 9 * heatAmt;
              const x = 1480 - 125 + 50 * gx + amp * Math.sin(t * (9 + rand(i) * 5) + i);
              const y = 640 + 48 * gy + amp * Math.cos(t * (8 + rand(i * 3) * 6) + i * 2);
              const d = Math.hypot(x - 1480, y - 712);
              return d < 118 ? <circle key={i} cx={x} cy={y} r={14} fill={C.heat} opacity={0.5 + 0.4 * heatAmt} /> : null;
            })}
            <Label x={1640} y={604} size={22} anchor="start" color={C.heat}>
              atom permukaan
            </Label>
          </g>
        </g>
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
