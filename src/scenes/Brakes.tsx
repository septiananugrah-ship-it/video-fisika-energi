import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Car, HeatShimmer, fmt} from '../components/physics';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Uji jarak henti: waktu reaksi 1 s (laju tetap), lalu pengereman 7 m/s² (jalan kering).
// Gerak dihitung tepat; ditayangkan gerak lambat 0,5×.
const T_R = 1;
const A = 7;
const X0 = 200; // piksel: posisi awal moncong mobil
const PPM = 17.33; // piksel per meter (0–90 m)
const SLOW = 0.5;
const CAR_S = 0.55;

const LANES = [
  {kmh: 60, ground: 390, color: 'cyan'},
  {kmh: 100, ground: 640, color: 'kin'},
] as const;

const motion = (v: number, tau: number) => {
  const tStop = T_R + v / A;
  if (tau <= 0) return {x: 0, v, phase: 0};
  if (tau <= T_R) return {x: v * tau, v, phase: 1};
  const tb = Math.min(tau, tStop) - T_R;
  return {x: v * T_R + v * tb - 0.5 * A * tb * tb, v: Math.max(0, v - A * tb), phase: tau >= tStop ? 3 : 2};
};

/** Patok tepi jalan yang ikut bergulir (memudar di tepi agar tanpa loncatan). */
const Posts: React.FC<{y: number; off: number; x1: number; x2: number; gap?: number; opacity?: number}> = ({y, off, x1, x2, gap = 150, opacity = 1}) => {
  const span = x2 - x1;
  const n = Math.ceil(span / gap);
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const x = x1 + ((((i * gap + off) % span) + span) % span);
        const edge = Math.min(1, (x - x1) / 60, (x2 - x) / 60);
        return (
          <g key={i} opacity={Math.max(0, edge)}>
            <line x1={x} y1={y - 26} x2={x} y2={y} stroke={C.faint} strokeWidth={4} strokeLinecap="round" />
            <rect x={x - 3} y={y - 26} width={6} height={7} rx={2} fill={C.gold} opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

/** Cakram rem tampak samping; warna logam memanas abu → merah → jingga. */
const Disc: React.FC<{x: number; y: number; r: number; angle: number; heat: number; t: number}> = ({x, y, r, angle, heat, t}) => {
  const metal = interpolateColors(heat, [0, 0.55, 1], ['#2a3358', '#7a1e2e', '#ff6a3d']);
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.9} fill="url(#soft-heat)" opacity={heat * (0.85 + 0.15 * Math.sin(t * 3))} />
      <ellipse cx={x} cy={y + r + 26} rx={r * 0.9} ry={12} fill="#000" opacity={0.3} />
      <g transform={`translate(${x} ${y}) rotate(${angle})`}>
        <circle r={r} fill={metal} stroke={C.muted} strokeWidth={4} />
        {[0.62, 0.86].map((k, i) => (
          <circle key={i} r={r * k} fill="none" stroke="#fff" strokeOpacity={0.06 + 0.1 * heat} strokeWidth={6} />
        ))}
        {Array.from({length: 18}, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * r * 0.78} cy={Math.sin(a) * r * 0.78} r={6} fill="#0b1022" opacity={0.8} />;
        })}
        <path d={`M${-r * 0.92},${-r * 0.2} A${r * 0.94},${r * 0.94} 0 0 1 ${-r * 0.2},${-r * 0.92}`} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
        <circle r={r * 0.42} fill="#151d3e" stroke={C.muted} strokeWidth={3} />
        {Array.from({length: 5}, (_, i) => {
          const a = (i / 5) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(a) * r * 0.24} cy={Math.sin(a) * r * 0.24} r={7} fill={C.muted} />;
        })}
      </g>
      {/* kaliper */}
      <path d={`M${x + r * 0.45},${y - r - 18} q${r * 0.6},0 ${r * 0.75},${r * 0.55} l-30,14 q-14,-34 -${r * 0.55},-38 Z`} fill="#3b4a7a" stroke={C.gold} strokeWidth={3} />
    </g>
  );
};

export const Brakes: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const road = win(t, 0, cue(5) - 0.3, 0.9, 0.8);
  const t0 = cue(1) + 1.5;
  const tau = Math.max(0, (t - t0) * SLOW);
  const formula = win(t, cue(0) + 0.6, cue(4) - 0.2, 0.7, 0.5);
  const ratio = win(t, cue(4) + 0.3, cue(5) - 0.3, 0.7, 0.5);
  const hazard = win(t, t0 - 0.4, t0 + 2.5, 0.3, 0.8);
  const clock = ramp(t, t0 - 0.6, t0);
  const result = [ramp(t, cue(3) + 0.5, cue(3) + 1.4), ramp(t, mix(cue(3), cueEnd(3), 0.55), mix(cue(3), cueEnd(3), 0.55) + 0.9)];

  const panel2 = ramp(t, cue(5) + 0.1, cue(5) + 1.1);
  // cakram rem: laju sudut turun linear selama baris 5
  const tb = Math.max(0, t - (cue(5) + 0.8));
  const TB = Math.max(2, cueEnd(5) - cue(5) - 1);
  const discAng = 420 * (Math.min(tb, TB) - Math.min(tb, TB) ** 2 / (2 * TB));
  const discW = (1 - Math.min(tb, TB) / TB) * ramp(t, cue(5) + 0.8, cue(5) + 1.0); // laju putar relatif (∝ daya gesek)
  const discHeat = ramp(t, cue(5) + 1, cueEnd(5), EASE_IN_OUT);
  // cakram mula-mula di tengah, bergeser ke kiri saat mobil listrik muncul
  const shift = ramp(t, cue(6) - 0.2, cue(6) + 1.1, EASE_IN_OUT);
  const DX = mix(960, 480, shift);
  const ev = ramp(t, cue(6) + 0.2, cue(6) + 1.2);
  const te = Math.max(0, t - (cue(6) + 1.2));
  const TE = Math.max(2, cueEnd(6) - cue(6) - 1.6);
  const evDist = 300 * (Math.min(te, TE) - Math.min(te, TE) ** 2 / (2 * TE));
  const evV = (1 - Math.min(te, TE) / TE) * ev; // kelajuan relatif mobil listrik
  // baterai terisi ∝ ∫ daya regeneratif (daya ∝ kelajuan saat perlambatan tetap)
  const charge = evDist / (150 * TE);
  const regen = evV * ramp(t, cue(6) + 1.2, cue(6) + 1.6);
  const finalNote = ramp(t, cue(7) + 0.3, cue(7) + 1.1);

  const ruler = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  const ARC: [number, number][] = Array.from({length: 13}, (_, i) => {
    const u = i / 12;
    return [(1 - u) ** 2 * 1370 + 2 * u * (1 - u) * 1460 + u * u * 1530, (1 - u) ** 2 * 640 + 2 * u * (1 - u) * 440 + u * u * 410];
  });
  return (
    <AbsoluteFill>
      <Stage>
        {/* ======== PANEL 1: uji jarak henti ======== */}
        <g opacity={road}>
          {LANES.map((ln, i) => {
            const v = ln.kmh / 3.6;
            const m = motion(v, tau);
            const front = X0 + m.x * PPM;
            const carX = front - 130 * CAR_S;
            const pre = t < t0 ? t * v * SLOW : t0 * v * SLOW; // sebelum uji: jalan yang bergerak (mobil melaju)
            const wheel = ((m.x + pre) / 0.32) * (180 / Math.PI);
            const dashOff = pre * PPM; // dasbor jalan bergeser ke kiri (mobil melaju ke kanan)
            const reactEnd = X0 + Math.min(m.x, v * T_R) * PPM;
            const brakeLen = Math.max(0, m.x - v * T_R) * PPM;
            const tStop = T_R + v / A;
            const braking = ramp(tau, T_R, T_R + 0.2) * (1 - ramp(tau, tStop - 0.2, tStop + 0.6));
            const brk = ramp(tau, T_R, T_R + 0.15) * (1 - ramp(tau, tStop - 0.05, tStop + 0.25));
            const ts = tau - tStop;
            const pitch = 2.4 * brk - (ts > 0 ? 1.6 * Math.exp(-ts * 5) * Math.sin(ts * 14) : 0);
            const sr = v * T_R;
            const sb = (v * v) / (2 * A);
            const vRel = m.v / v;
            const stopped = ramp(tau, tStop, tStop + 0.3);
            const blink = stopped * (0.5 - 0.5 * Math.cos(t * 6));
            const fw = (x: number) => X0 + x * PPM - 130 * CAR_S + 78 * CAR_S;
            const rw = (x: number) => X0 + x * PPM - 130 * CAR_S - 70 * CAR_S;
            return (
              <g key={ln.kmh}>
                <rect x={60} y={ln.ground - 3} width={1800} height={14} rx={3} fill="#141d40" />
                <rect x={60} y={ln.ground} width={1800} height={10} fill="#1a2550" />
                <line x1={60} y1={ln.ground + 5} x2={1860} y2={ln.ground + 5} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="30 30" strokeDashoffset={dashOff} />
                <Posts y={ln.ground - 4} off={-dashOff} x1={60} x2={1860} gap={180} opacity={0.7} />
                {/* jejak ban saat mengerem */}
                {m.x > sr ? (
                  <g opacity={0.75}>
                    <line x1={fw(sr)} y1={ln.ground + 1} x2={fw(m.x)} y2={ln.ground + 1} stroke="#04060e" strokeWidth={4} strokeLinecap="round" />
                    <line x1={rw(sr)} y1={ln.ground + 1} x2={rw(m.x)} y2={ln.ground + 1} stroke="#04060e" strokeWidth={4} strokeLinecap="round" />
                  </g>
                ) : null}
                {/* segmen reaksi & rem */}
                <line x1={X0} y1={ln.ground + 26} x2={reactEnd} y2={ln.ground + 26} stroke={C.gold} strokeWidth={7} strokeDasharray="14 9" opacity={ramp(tau, 0, 0.05)} />
                <rect x={X0 + sr * PPM} y={ln.ground + 22} width={brakeLen} height={9} rx={4} fill={C.heat} />
                {/* asap ban (gumpalan dilepas sepanjang pengereman) */}
                {Array.from({length: 12}, (_, k) => {
                  const tk = T_R + ((k + 0.5) / 12) * (v / A);
                  const age = (tau - tk) / SLOW;
                  if (age <= 0 || age >= 1.8) return null;
                  const xk = rw(motion(v, tk).x) - 40 * age;
                  return <circle key={k} cx={xk} cy={ln.ground - 8 - 26 * age} r={14 + 30 * age} fill="url(#soft-ink)" opacity={0.75 * Math.min(1, age * 6) * (1 - age / 1.8)} />;
                })}
                {/* garis laju di belakang mobil */}
                {[0, 1, 2].map((k) => (
                  <line key={k} x1={carX - 80} y1={ln.ground - 18 - 16 * k} x2={carX - 80 - (40 + 30 * k) * vRel} y2={ln.ground - 18 - 16 * k} stroke={C[ln.color]} strokeWidth={3} strokeLinecap="round" opacity={0.5 * vRel} />
                ))}
                <ellipse cx={carX + 4} cy={ln.ground + 2} rx={75} ry={6} fill="#000" opacity={0.35} />
                <g transform={`rotate(${pitch} ${carX} ${ln.ground})`}>
                  <Car x={carX} y={ln.ground} color={ln.color} scale={CAR_S} wheel={wheel} braking={ramp(tau, T_R, T_R + 0.15) * (1 - 0.4 * ramp(tau, tStop, tStop + 0.4))} />
                </g>
                {/* rem panas di roda & lampu hazard setelah berhenti */}
                {[rw(m.x), fw(m.x)].map((wxp, k) => (
                  <circle key={k} cx={wxp} cy={ln.ground - 15} r={26} fill="url(#soft-heat)" opacity={braking * 0.9} />
                ))}
                <circle cx={carX + 70} cy={ln.ground - 34} r={16} fill="url(#soft-gold)" opacity={blink} />
                <circle cx={carX - 66} cy={ln.ground - 34} r={16} fill="url(#soft-gold)" opacity={blink} />
                <HeatShimmer x1={front - 120} x2={front - 30} y={ln.ground} t={t} amount={0.8 * braking} />
                <Ripple x={front} y={ln.ground - 20} p={(tau - tStop) / SLOW / 1.3} r={90} color={ln.color} rings={2} />
                <Label x={front - 70} y={ln.ground - 94} size={24} font="mono" color={ln.color} weight={600}>
                  {`${fmt(m.v * 3.6)} km/jam`}
                </Label>
                <g opacity={result[i]}>
                  <Label x={X0} y={ln.ground + 62} size={24} color={C.gold} anchor="start" weight={600}>
                    {`reaksi ${fmt(sr, 1)} m`}
                  </Label>
                  <Label x={X0 + sr * PPM + 12} y={ln.ground + 62} size={24} color={C.heat} anchor="start" weight={600}>
                    {`rem ${fmt(sb, 1)} m`}
                  </Label>
                  <Label x={X0 + (sr + sb) * PPM + 20} y={ln.ground - 30} size={34} color={C.ink} anchor="start" weight={700}>
                    {`≈ ${fmt(sr + sb, 1)} m`}
                  </Label>
                  <Twinkles x={X0 + (sr + sb) * PPM + 90} y={ln.ground - 30} rx={90} ry={30} n={4} color="gold" opacity={result[i] * win(t, cue(3), cue(5) - 0.5, 0.6, 0.6)} seed={i + 3} />
                </g>
              </g>
            );
          })}
          {/* penggaris meter */}
          <line x1={X0} y1={770} x2={X0 + 90 * PPM} y2={770} stroke={C.muted} strokeWidth={2} />
          {ruler.map((d) => (
            <g key={d}>
              <line x1={X0 + d * PPM} y1={762} x2={X0 + d * PPM} y2={778} stroke={C.muted} strokeWidth={2} />
              <Label x={X0 + d * PPM} y={800} size={20} font="mono" color={C.muted}>
                {`${d} m`}
              </Label>
            </g>
          ))}
          {/* jam simulasi & asumsi */}
          <g opacity={clock}>
            <Label x={X0 - 60} y={200} size={28} font="mono" color={C.ink} anchor="start" weight={600}>
              {`t = ${fmt(Math.min(tau, T_R + 100 / 3.6 / A), 2)} s`}
            </Label>
            <Label x={X0 + 170} y={200} size={22} color={C.muted} anchor="start">
              (gerak lambat 0,5×)
            </Label>
            <Label x={X0 - 60} y={238} size={22} color={C.muted} anchor="start">
              model: waktu reaksi 1 s · perlambatan rem 7 m/s² (jalan kering)
            </Label>
          </g>
          <g opacity={hazard} transform={`translate(1230 300) scale(${1 + 0.06 * Math.sin(t * 8)}) translate(-1230 -300)`}>
            <circle cx={1230} cy={296} r={90} fill="url(#soft-heat)" opacity={0.6 + 0.4 * Math.sin(t * 8)} />
            <path d="M1230,240 L1280,330 L1180,330 Z" fill={C.heat} opacity={0.9} />
            <text x={1230} y={318} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={48} fill="#fff">
              !
            </text>
          </g>
        </g>

        {/* ======== PANEL 2: rem gesek vs rem regeneratif ======== */}
        <g opacity={panel2}>
          <line x1={960} y1={250} x2={960} y2={760} stroke={C.line} strokeWidth={2} opacity={ev} />
          <Label x={DX} y={250} size={32} color={C.heat} weight={700}>
            rem biasa (gesekan)
          </Label>
          <Motes x={DX} y={510} rx={260} ry={220} n={22} color="heat" opacity={0.25 + 0.35 * discHeat} seed={6} />
          <Disc x={DX} y={510} r={150} angle={discAng} heat={discHeat} t={t} />
          {/* bunga api di kaliper (∝ daya gesek) */}
          {Array.from({length: 12}, (_, k) => {
            const ph = (((t * (1.4 + 0.5 * rand(k)) + k / 12) % 1) + 1) % 1;
            const sx0 = DX + 150 * 0.72;
            const sy0 = 510 - 150 * 0.62;
            const vx = 160 + 140 * rand(k * 2.3);
            const vy = -40 + 120 * rand(k * 4.1);
            const tt = ph * 0.6;
            return <Spark key={k} x={sx0 + vx * tt} y={sy0 + vy * tt + 300 * tt * tt} r={2.5} color={k % 3 ? 'kin' : 'gold'} opacity={cyc(ph) * discW} />;
          })}
          {[-1, 0, 1].map((k) => (
            <Stream
              key={k}
              pts={[
                [DX + 70 * k, 380],
                [DX + 100 * k, 340],
                [DX + 140 * k, 300],
              ]}
              color="heat"
              n={4}
              speed={0.5}
              r={4.5}
              seed={k + 4}
              opacity={discHeat}
            />
          ))}
          <HeatShimmer x1={DX - 120} x2={DX + 120} y={350} t={t} amount={discHeat} />
          <Label x={DX} y={720} size={26} color={C.ink}>
            <tspan fill={C.kin} fontStyle="italic">K</tspan> → panas → terbuang ke udara
          </Label>
          <Label x={DX} y={760} size={24} font="mono" color={C.heat} opacity={discHeat}>
            {`suhu cakram ≈ ${fmt(mix(40, 400, discHeat))} °C`}
          </Label>
        </g>
        <g opacity={ev}>
          <Label x={1440} y={250} size={32} color={C.work} weight={700}>
            rem regeneratif (mobil listrik)
          </Label>
          <rect x={1000} y={698} width={860} height={8} fill="#1a2550" />
          <line x1={1000} y1={702} x2={1860} y2={702} stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="30 30" strokeDashoffset={evDist} />
          <Posts y={694} off={-evDist} x1={1000} x2={1860} gap={170} opacity={0.6} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={1280} y1={640 + 20 * k} x2={1280 - (60 + 30 * k) * evV} y2={640 + 20 * k} stroke={C.work} strokeWidth={3} strokeLinecap="round" opacity={0.5 * evV} />
          ))}
          <ellipse cx={1425} cy={704} rx={130} ry={8} fill="#000" opacity={0.35} />
          <g transform={`rotate(${2.0 * regen} 1420 700)`}>
            <Car x={1420} y={700} color="work" scale={1} wheel={(evDist / 28) * (180 / Math.PI)} />
          </g>
          {/* energi: roda → motor/generator → baterai */}
          <circle cx={1350} cy={672} r={40} fill="url(#soft-cyan)" opacity={regen} />
          <Stream
            pts={[
              [1498, 672],
              [1430, 690],
              [1370, 676],
            ]}
            color="kin"
            n={4}
            speed={0.9}
            r={4}
            jitter={1}
            opacity={regen}
          />
          <Stream pts={ARC} color="cyan" n={8} speed={0.7} r={5} jitter={2} opacity={regen} />
          {/* baterai */}
          <g transform="translate(1610 400)">
            <circle r={110} fill="url(#soft-work)" opacity={0.25 + 0.4 * regen} />
            <rect x={-70} y={-40} width={140} height={80} rx={10} fill="#0c1430" stroke={C.gold} strokeWidth={4} />
            <rect x={70} y={-16} width={12} height={32} rx={3} fill={C.gold} />
            <rect x={-62} y={-32} width={124 * mix(0.3, 0.75, charge)} height={64} rx={6} fill={C.work} />
            {[1, 2, 3, 4].map((k) => (
              <line key={k} x1={-62 + k * 24.8} y1={-32} x2={-62 + k * 24.8} y2={32} stroke="#0c1430" strokeWidth={3} opacity={0.6} />
            ))}
            <rect x={-62} y={-32} width={124 * mix(0.3, 0.75, charge)} height={10} rx={5} fill="#fff" opacity={0.18} />
            <path d="M6,-26 L-12,4 L0,4 L-6,26 L14,-6 L2,-6 Z" fill="#fff" opacity={0.25 + 0.65 * regen * (0.5 + 0.5 * Math.sin(t * 7))} />
            <Label x={0} y={70} size={22} font="mono" color={C.work}>
              {`baterai ${fmt(mix(30, 75, charge))} %`}
            </Label>
          </g>
          {/* motor ↔ generator */}
          <circle cx={1348} cy={672} r={22} fill="#0c1430" stroke={C.gold} strokeWidth={4} />
          <g transform={`translate(1348 672) rotate(${(evDist / 28) * (180 / Math.PI)})`}>
            <line x1={-13} y1={0} x2={13} y2={0} stroke={C.gold} strokeWidth={3} />
            <line x1={0} y1={-13} x2={0} y2={13} stroke={C.gold} strokeWidth={3} />
          </g>
          <Label x={1348} y={745} size={22} color={C.gold} weight={600}>
            motor → generator
          </Label>
          <path d="M1370,640 Q1460,440 1540,410" fill="none" stroke={C.work} strokeWidth={6} strokeDasharray="16 12" strokeDashoffset={-t * 60} opacity={0.35 + 0.4 * regen} markerEnd="url(#arrow-work)" />
          <Label x={1240} y={470} size={26} color={C.ink}>
            <tspan fill={C.kin} fontStyle="italic">K</tspan> → listrik
          </Label>
          <Motes x={1610} y={400} rx={160} ry={90} n={14} color="work" opacity={0.3 + 0.3 * charge} seed={9} />
        </g>
        <Glow x={1610} y={400} r={170} color="work" opacity={0.5 * charge * ev} />
        <Twinkles x={960} y={830} rx={520} ry={40} n={5} color="work" opacity={finalNote * 0.8} seed={12} />
      </Stage>
      <Formula x={1500} y={250} p={formula} accent={C.heat} size={56} caption="jarak rem ∝ kuadrat kelajuan">
        <V>s</V>
        <Sub>rem</Sub> ={' '}
        <Frac
          n={
            <>
              <V>v</V>
              <Sup>2</Sup>
            </>
          }
          d={
            <>
              2<V>a</V>
            </>
          }
        />
      </Formula>
      <Note x={1380} y={250} p={ratio} color={C.gold} size={28}>
        kelajuan 60 → 100 km/jam (× 1,7) · jarak 36,5 → 82,9 m (× 2,3)
      </Note>
      <Note x={960} y={830} p={finalNote} color={C.work} size={28}>
        neraca sama: <span style={{color: C.kin}}>K</span> = panas (terbuang) + listrik di baterai (dipakai lagi)
      </Note>
    </AbsoluteFill>
  );
};
