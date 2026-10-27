import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {type Axes, Car, Ground, Plot, px, py} from '../components/physics';
import {Arrow, Card, Formula, Frac, Label, Sqrt, Stage, Sub, Sup, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Energi kinetik: penurunan dari Newton + kinematika → W_net = ΔK; koper 360 J → ≈ 8,5 m/s;
// K ∝ v²; dua mobil identik direm 5000 N (a = 5 m/s²): 20 m/s → 40 m, 40 m/s → 160 m (gerak waktu nyata).

const TRACK = 430;
const half = (
  <Frac n="1" d="2" size={0.7} />
);

// mobil
const S0 = 300; // garis mulai rem (bagian depan mobil)
const KPX = 8.75; // piksel per meter (160 m = 1400 px)
const DEC = 5; // m/s²
const LANES = [
  {y: 470, v0: 20, color: C.cyan},
  {y: 720, v0: 40, color: C.kin},
];
const CSCALE = 0.8;

const GraphK: React.FC<{op: number; p: number}> = ({op, p}) => {
  if (op <= 0.001) return null;
  const a: Axes = {x0: 280, y0: 760, w: 620, h: 420, xmax: 2.2, ymax: 4.6};
  const d = Array.from({length: 81}, (_, i) => {
    const v = (2.1 * i) / 80;
    return `${i ? 'L' : 'M'}${px(a, v).toFixed(1)},${py(a, v * v).toFixed(1)}`;
  }).join(' ');
  return (
    <g opacity={op}>
      <Plot a={a} xLabel="v" yLabel="K" />
      <path d={d} fill="none" stroke={C.kin} strokeWidth={5} strokeDasharray="1000" strokeDashoffset={1000 * (1 - p)} pathLength={1000} />
      {[1, 2].map((v) => (
        <g key={v} opacity={ramp(p, v === 1 ? 0.45 : 0.9, v === 1 ? 0.6 : 1)}>
          <line x1={px(a, v)} y1={a.y0} x2={px(a, v)} y2={py(a, v * v)} stroke={C.muted} strokeDasharray="6 6" strokeWidth={2} />
          <line x1={a.x0} y1={py(a, v * v)} x2={px(a, v)} y2={py(a, v * v)} stroke={C.muted} strokeDasharray="6 6" strokeWidth={2} />
          <circle cx={px(a, v)} cy={py(a, v * v)} r={10} fill={C.kin} />
          <Label x={px(a, v)} y={a.y0 + 30} size={26} font="serif" italic>
            {v === 1 ? 'v' : '2v'}
          </Label>
          <Label x={a.x0 - 18} y={py(a, v * v)} size={26} font="mono" anchor="end" color={C.kin}>
            {v === 1 ? '1' : '4'}
          </Label>
        </g>
      ))}
    </g>
  );
};

export const Kinetic: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- troli (baris 1–7) ----
  const trolley = win(t, cue(0) + 0.3, cue(8) - 0.2, 0.8, 0.8);
  const t0 = cue(1) + 1.2;
  const t1 = cue(2) + 4.5;
  const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const s = u * u; // s ∝ τ² (percepatan tetap), v ∝ τ
  const tx = 260 + 820 * s;
  const fArrow = ramp(t, cue(1) + 0.3, cue(1) + 1) * (1 - ramp(t, t1 - 0.2, t1 + 0.6, EASE_IN_OUT));
  const bars = ramp(t, cue(1) + 1.5, cue(1) + 2.3);
  const kLabel = ramp(t, cue(5), cue(5) + 0.8);

  // kartu penurunan (satu per baris)
  const d1 = win(t, wordOf(1, 'Newton'), cue(2) - 0.1, 0.6, 0.5);
  const d2 = win(t, cue(2) + 0.2, cue(3) - 0.1, 0.6, 0.5);
  const d3 = win(t, cue(3) + 0.1, cue(4) - 0.1, 0.6, 0.5);
  const d4 = win(t, cue(4) + 0.2, cue(5) - 0.1, 0.6, 0.5);
  const d5 = win(t, cue(5) + 0.2, cue(6) - 0.1, 0.6, 0.5);
  const d6 = win(t, cue(6) + 0.2, cue(7) - 0.1, 0.6, 0.5);
  const d7 = win(t, cue(7) + 0.2, cue(8) - 0.2, 0.6, 0.5);

  // ---- K ∝ v² (baris 8) ----
  const gk = win(t, cue(8) - 0.1, cue(9) - 0.2, 0.7, 0.6);
  const gkp = ramp(t, cue(8) + 0.4, cue(8) + 4, EASE_IN_OUT);

  // ---- mobil (baris 9–12) ----
  const cars = ramp(t, cue(9) - 0.1, cue(9) + 0.8);
  const tb = cue(10);
  const info = win(t, cue(9) + 1, cue(12) - 0.2, 0.7, 0.6);
  const f12 = ramp(t, cue(12) + 0.2, cue(12) + 1);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== troli ===== */}
        <g opacity={trolley}>
          <Ground x1={160} x2={1200} y={TRACK} />
          <g transform={`translate(${tx} ${TRACK})`}>
            <rect x={-80} y={-110} width={160} height={84} rx={12} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
            <text x={0} y={-62} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontSize={28} fontWeight={600} fill={C.ink}>
              m
            </text>
            {[-50, 50].map((wx) => (
              <g key={wx} transform={`translate(${wx} -14) rotate(${(s * 820 * 180) / (Math.PI * 14)})`}>
                <circle r={14} fill="#0b1022" stroke={C.muted} strokeWidth={3} />
                <line x1={-10} x2={10} y1={0} y2={0} stroke={C.muted} strokeWidth={2} />
              </g>
            ))}
          </g>
          <Arrow x1={tx - 210} y1={TRACK - 68} x2={tx - 92} y2={TRACK - 68} color="force" width={7} opacity={fArrow} />
          <Label x={tx - 150} y={TRACK - 104} size={30} font="serif" italic color={C.force} opacity={fArrow}>
            F
          </Label>
          {/* kecepatan ∝ τ */}
          <Arrow x1={tx - 40} y1={TRACK - 140} x2={tx - 40 + 150 * u} y2={TRACK - 140} color="kin" width={5} />
          <Label x={tx - 40 + 150 * u + 26} y={TRACK - 140} size={28} font="serif" italic color={C.kin} anchor="start" opacity={ramp(u, 0.05, 0.2)}>
            v
          </Label>
          {/* jejak perpindahan s */}
          <line x1={260} y1={TRACK + 40} x2={tx} y2={TRACK + 40} stroke={C.cyan} strokeWidth={4} />
          <Label x={(260 + tx) / 2} y={TRACK + 70} size={28} font="serif" italic color={C.cyan} opacity={ramp(u, 0.1, 0.25)}>
            s
          </Label>
          {/* batang W dan K tumbuh bersama */}
          <g opacity={bars} transform="translate(0 340)">
            <rect x={1360} y={190} width={330} height={290} rx={18} fill="rgba(10,16,36,0.72)" stroke={C.line} strokeWidth={2} />
            <rect x={1420} y={220} width={70} height={200} rx={8} fill={C.work} opacity={0.08} />
            <rect x={1420} y={420 - 200 * s} width={70} height={200 * s} rx={8} fill={C.work} />
            <rect x={1560} y={220} width={70} height={200} rx={8} fill={C.kin} opacity={0.08} />
            <rect x={1560} y={420 - 200 * s} width={70} height={200 * s} rx={8} fill={C.kin} />
            <Label x={1455} y={452} size={26} color={C.work} weight={600}>
              F·s
            </Label>
            <Label x={1595} y={452} size={26} color={C.kin} weight={600} opacity={0.4 + 0.6 * kLabel}>
              ½mv²
            </Label>
          </g>
        </g>

        {/* ===== K ∝ v² ===== */}
        <GraphK op={gk} p={gkp} />
        <g opacity={gk}>
          {[0, 1].map((i) => {
            const y = 430 + i * 220;
            const v = i === 0 ? 1 : 2;
            const bx = 1120 + (((t * 120 * v) % 200) + 200) % 200;
            const fade = Math.min(1, (bx - 1120) / 30, (1320 - bx) / 30);
            const show = ramp(gkp, i === 0 ? 0.45 : 0.9, i === 0 ? 0.6 : 1);
            return (
              <g key={i} opacity={show}>
                <g opacity={Math.max(0, fade)}>
                  <circle cx={bx} cy={y} r={30} fill={C.kin} />
                  <Arrow x1={bx + 38} y1={y} x2={bx + 38 + 60 * v} y2={y} color="kin" width={5} />
                </g>
                <Label x={1220} y={y + 66} size={26} font="serif" italic>
                  {i === 0 ? 'v' : '2v'}
                </Label>
                <rect x={1560} y={y + 40 - 40 * v * v} width={60} height={40 * v * v} rx={6} fill={C.kin} />
                <Label x={1660} y={y + 40 - 20 * v * v} size={34} font="mono" color={C.kin} anchor="start" weight={600}>
                  {i === 0 ? '1×' : '4×'}
                </Label>
              </g>
            );
          })}
        </g>

        {/* ===== dua mobil direm ===== */}
        <g opacity={cars}>
          {LANES.map((ln, i) => {
            const tau = t - tb;
            const tStop = ln.v0 / DEC;
            const tt = Math.max(0, Math.min(tau, tStop));
            const sM = ln.v0 * tt - 0.5 * DEC * tt * tt;
            const front = S0 + sM * KPX;
            const braking = ramp(tau, 0, 0.2) * (1 - ramp(tau, tStop - 0.3, tStop));
            // sebelum rem: marka jalan bergeser (mobil melaju dengan kamera)
            const scroll = tau < 0 ? (((ln.v0 * KPX * tau) % 80) + 80) % 80 : 0;
            const stopped = ramp(t, tb + tStop, tb + tStop + 0.6);
            const stopX = S0 + ((ln.v0 * ln.v0) / (2 * DEC)) * KPX;
            const wheel = ((sM - (tau < 0 ? -ln.v0 * tau : 0)) * KPX * 180) / (Math.PI * 28 * CSCALE);
            return (
              <g key={i}>
                <line x1={120} y1={ln.y} x2={1800} y2={ln.y} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
                <line x1={120 + scroll} y1={ln.y + 22} x2={1800} y2={ln.y + 22} stroke={C.muted} strokeWidth={4} strokeDasharray="40 40" strokeDashoffset={-scroll} />
                <line x1={S0} y1={ln.y - 140} x2={S0} y2={ln.y + 34} stroke={C.heat} strokeWidth={3} strokeDasharray="8 8" opacity={0.7} />
                <Car x={front - 130 * CSCALE} y={ln.y} scale={CSCALE} color={ln.color} wheel={wheel} braking={braking} />
                <Label x={S0 + 14} y={ln.y - 165} size={26} color={ln.color} anchor="start" weight={600}>
                  {`v₀ = ${ln.v0} m/s  ·  K = ${ln.v0 === 20 ? '200' : '800'} kJ`}
                </Label>
                <g opacity={stopped}>
                  <line x1={stopX} y1={ln.y - 140} x2={stopX} y2={ln.y + 34} stroke={ln.color} strokeWidth={3} strokeDasharray="8 8" />
                  <Label x={stopX + (i === 1 ? -14 : 14)} y={ln.y - 120} size={34} font="mono" color={ln.color} weight={600} anchor={i === 1 ? 'end' : 'start'}>
                    {ln.v0 === 20 ? '40 m' : '160 m'}
                  </Label>
                </g>
              </g>
            );
          })}
          <Label x={S0} y={LANES[0].y - 200} size={22} color={C.heat}>
            mulai rem
          </Label>
          {/* skala jarak */}
          {[0, 40, 80, 120, 160].map((m) => (
            <g key={m}>
              <line x1={S0 + m * KPX} y1={LANES[1].y + 44} x2={S0 + m * KPX} y2={LANES[1].y + 58} stroke={C.muted} strokeWidth={2} />
              <Label x={S0 + m * KPX} y={LANES[1].y + 80} size={20} font="mono" color={C.muted}>
                {`${m} m`}
              </Label>
            </g>
          ))}
          <g opacity={ramp(t, tb + 8.3, tb + 9)}>
            <Label x={1180} y={LANES[1].y - 60} size={44} color={C.gold} weight={700}>
              4× lebih jauh
            </Label>
          </g>
        </g>
      </Stage>

      {/* kartu penurunan */}
      <Formula x={700} y={700} p={d1} accent={C.force} size={60} caption="hukum Newton II">
        <V>a</V> = <Frac n={<V>F</V>} d={<V>m</V>} />
      </Formula>
      <Formula x={700} y={700} p={d2} accent={C.cyan} size={60} caption="kinematika percepatan tetap">
        <V>v</V>
        <Sup>2</Sup> − <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup> = 2<V>a s</V>
      </Formula>
      <Formula x={700} y={700} p={d3} accent={C.cyan} size={60} caption="kalikan kedua ruas dengan ½m">
        {half}
        <V>m</V>(<V>v</V>
        <Sup>2</Sup> − <V>v</V>
        <Sub>0</Sub>
        <Sup>2</Sup>) = {half}
        <V>m</V> · 2<V>a s</V>
      </Formula>
      <Formula x={700} y={700} p={d4} accent={C.work} size={60}>
        {half}
        <V>m v</V>
        <Sup>2</Sup> − {half}
        <V>m v</V>
        <Sub>0</Sub>
        <Sup>2</Sup> = <V>m a s</V> = <V color={C.work}>F s</V>
      </Formula>
      <Formula x={700} y={700} p={d5} accent={C.kin} size={72} caption="energi kinetik: energi karena bergerak">
        <V color={C.kin}>K</V> = {half}
        <V>m v</V>
        <Sup>2</Sup>
      </Formula>
      <Formula x={700} y={700} p={d6} accent={C.gold} size={66} caption="teorema usaha–energi">
        <V color={C.work}>W</V>
        <Sub>net</Sub> = Δ<V color={C.kin}>K</V> = <V>K</V>
        <Sub>akhir</Sub> − <V>K</V>
        <Sub>awal</Sub>
      </Formula>
      <Formula x={700} y={700} p={d7} accent={C.kin} size={58} caption="koper 10 kg dari diam">
        360 = {half}(10)<V>v</V>
        <Sup>2</Sup> → <V>v</V> = <Sqrt>72</Sqrt> ≈ <span style={{color: C.kin}}>8,5 m/s</span>
      </Formula>

      <Card x={1440} y={240} opacity={info} accent={C.heat} style={{padding: '12px 26px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 28}}>
          tiap mobil 1000 kg · gaya rem 5000 N → <span style={{color: C.heat}}>a = 5 m/s²</span>
        </div>
      </Card>
      <Formula x={1340} y={240} p={f12} accent={C.kin} size={56} caption="jarak rem sebanding dengan kuadrat kelajuan">
        <V>s</V> = <Frac n={<>½<V>m v</V><Sub>0</Sub><Sup>2</Sup></>} d={<><V>F</V><Sub>rem</Sub></>} />
      </Formula>
    </AbsoluteFill>
  );
};
