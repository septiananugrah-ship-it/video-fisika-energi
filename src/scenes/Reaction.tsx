import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {HeatShimmer} from '../components/physics';
import {DrawPath, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Diagram energi reaksi sebagai lintasan roller coaster.
// Lembah reaktan (kiri), bukit energi aktivasi, lembah produk lebih rendah (eksoterm).
const X0 = 150;
const WD = 1020;
const AXIS_Y = 830;

const sm = (a: number, b: number, s: number) => {
  const u = Math.max(0, Math.min(1, (s - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Tinggi lintasan (piksel layar) pada koordinat reaksi s ∈ [0,1]; hill = tinggi bukit. */
const trackY = (s: number, hill = 300) =>
  650 + 110 * sm(0.35, 0.65, s) - hill * Math.exp(-(((s - 0.5) / 0.1) ** 2)) - 280 * Math.exp(-((s / 0.07) ** 2)) - 200 * Math.exp(-(((1 - s) / 0.07) ** 2));
const sx = (s: number) => X0 + s * WD;

const PATH = (hill: number, a = 0, b = 1) => {
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const s = mix(a, b, i / 200);
    pts.push(`${i ? 'L' : 'M'}${sx(s).toFixed(1)},${trackY(s, hill).toFixed(1)}`);
  }
  return pts.join(' ');
};
const TRACK = PATH(300);
const TRACK_CAT = PATH(190, 0.3, 0.72);
const CAT_PTS: [number, number][] = Array.from({length: 41}, (_, i) => {
  const s = mix(0.3, 0.72, i / 40);
  return [sx(s), trackY(s, 190) - 16];
});

const argExt = (a: number, b: number, hill: number, max: boolean) => {
  let best = a;
  for (let i = 0; i <= 400; i++) {
    const s = mix(a, b, i / 400);
    if (max ? trackY(s, hill) > trackY(best, hill) : trackY(s, hill) < trackY(best, hill)) best = s;
  }
  return best;
};
const S_R = argExt(0.08, 0.45, 300, true); // dasar lembah reaktan
const S_P = argExt(0.55, 0.95, 300, true); // dasar lembah produk
const S_TOP = argExt(0.4, 0.6, 300, false);
const S_TOPC = argExt(0.4, 0.6, 190, false);
const Y_R = trackY(S_R);
const Y_P = trackY(S_P);
const Y_TOP = trackY(S_TOP);
const Y_TOPC = trackY(S_TOPC, 190);

/** Titik balik: tempat lintasan setinggi tingkat energi yE (dicari dari s0 ke arah dir). */
const turn = (s0: number, dir: number, yE: number) => {
  let s = s0;
  for (let i = 0; i < 2000; i++) {
    const n = s + dir * 0.0005;
    if (n <= 0 || n >= 1 || trackY(n) <= yE) break;
    s = n;
  }
  return s;
};
const Y_FAIL = 505;
const F_L = turn(S_R, -1, Y_FAIL);
const F_R = turn(S_R, 1, Y_FAIL);
const Y_OK = 362;
const OK_L = turn(S_R, -1, Y_OK);

const BR = 22;

/** Bola sukses: dilepas dari titik balik kiri, laju ∝ √(tinggi turun) (kekekalan energi), lalu bergoyang teredam di lembah produk. */
const okBall = (tau: number) => {
  if (tau <= 0) return OK_L;
  const dt = 1 / 60;
  let s = OK_L + 0.002;
  let tt = 0;
  while (tt < tau) {
    const drop = Math.max(0, trackY(s) - Y_OK);
    // laju sepanjang lintasan ∝ √drop; dibagi faktor kemiringan agar laju busur yang konstan-energi
    const h = 0.002;
    const slope = (trackY(s + h) - trackY(s - h)) / (2 * h * WD);
    const v = 46 * Math.sqrt(drop + 2);
    s += (v * dt) / (WD * Math.sqrt(1 + slope * slope));
    tt += dt;
    if (s >= S_P) {
      const rest = tau - tt;
      return S_P + 0.05 * Math.exp(-1.6 * rest) * Math.sin(5 * rest);
    }
  }
  return s;
};
const T_ARRIVE = (() => {
  // waktu tiba di dasar lembah produk
  for (let k = 0; k < 600; k++) if (okBall(k / 30) >= S_P - 1e-4 && k > 3) return k / 30;
  return 4;
})();

// Distribusi energi kinetik (Maxwell–Boltzmann 3D) f(E) ∝ √E e^(−E/kT)
const fMB = (E: number, kT: number) => (2 / Math.sqrt(Math.PI)) * Math.pow(1 / kT, 1.5) * Math.sqrt(Math.max(0, E)) * Math.exp(-E / kT);
const above = (Ea: number, kT: number) => {
  let a = 0;
  const dE = 0.01;
  for (let E = Ea; E < 30; E += dE) a += fMB(E, kT) * dE;
  return a;
};
// Sampel molekul: E/kT ~ Gamma(3/2) = (z1² + z2² + z3²)/2, z normal baku (Box–Muller deterministik)
const gauss = (k: number) => Math.sqrt(-2 * Math.log(Math.max(1e-6, rand(k * 3.17 + 1)))) * Math.cos(2 * Math.PI * rand(k * 7.31 + 2));
const SAMPLES = Array.from({length: 44}, (_, i) => {
  const z = [gauss(i * 3 + 1), gauss(i * 3 + 2), gauss(i * 3 + 3)];
  return {e: (z[0] ** 2 + z[1] ** 2 + z[2] ** 2) / 2, h: 0.08 + 0.84 * rand(i * 5.9), ph: rand(i * 2.2) * 6};
});

const slopeAt = (s: number) => {
  const h = 0.002;
  return (trackY(s + h) - trackY(s - h)) / (2 * h * WD);
};
/** Titik pusat bola di atas lintasan (bergeser sepanjang normal). */
const onTrack = (s: number, r = BR): [number, number] => {
  const slope = slopeAt(s);
  const n = 1 / Math.sqrt(1 + slope * slope);
  return [sx(s) + slope * n * r, trackY(s) - n * r];
};

const BallOnTrack: React.FC<{s: number; color: string; opacity?: number; trail?: number[]}> = ({s, color, opacity = 1, trail = []}) => {
  const [x, y] = onTrack(s);
  return opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {trail.map((ts, i) => {
        const [tx, ty] = onTrack(ts);
        return <circle key={i} cx={tx} cy={ty} r={BR * (0.85 - 0.14 * i)} fill={color} opacity={0.32 - 0.06 * i} />;
      })}
      <ellipse cx={sx(s)} cy={trackY(s) + 4} rx={BR * 0.9} ry={4} fill="#000" opacity={0.3} />
      <circle cx={x} cy={y} r={BR * 3} fill="url(#soft-kin)" opacity={0.6} />
      <circle cx={x} cy={y} r={BR} fill={color} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
      <circle cx={x - 7} cy={y - 7} r={5} fill="#fff" opacity={0.6} />
    </g>
  );
};

const Bracket: React.FC<{x: number; y1: number; y2: number; color: string; label: React.ReactNode; opacity: number; side?: 'left' | 'right'}> = ({
  x,
  y1,
  y2,
  color,
  label,
  opacity,
  side = 'right',
}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={3} markerStart={`url(#arrow-${color === C.work ? 'work' : color === C.heat ? 'heat' : 'gold'})`} markerEnd={`url(#arrow-${color === C.work ? 'work' : color === C.heat ? 'heat' : 'gold'})`} />
      <Label x={x + (side === 'right' ? 16 : -16)} y={(y1 + y2) / 2} size={28} color={color} anchor={side === 'right' ? 'start' : 'end'} weight={600}>
        {label}
      </Label>
    </g>
  );


// Vinyet roller coaster (baris 0–2): kereta berayun di lembah, energinya di bawah puncak bukit.
const vy = (x: number) => 790 - 210 * Math.exp(-(((x - 1340) / 85) ** 2)) - 160 * Math.exp(-(((x - 1770) / 85) ** 2));
const VY_E = 668;
const vTurn = (x0: number, dir: number) => {
  let x = x0;
  for (let i = 0; i < 4000 && vy(x + dir * 0.25) > VY_E; i++) x += dir * 0.25;
  return x;
};
const VX_L = vTurn(1555, -1);
const VX_R = vTurn(1555, 1);
const V_TRACK = Array.from({length: 61}, (_, i) => {
  const x = 1290 + (530 * i) / 60;
  return `${i ? 'L' : 'M'}${x.toFixed(1)},${vy(x).toFixed(1)}`;
}).join(' ');
const Vignette: React.FC<{t: number; opacity: number}> = ({t, opacity}) => {
  if (opacity <= 0.001) return null;
  const xAt = (tt: number) => (VX_L + VX_R) / 2 - ((VX_R - VX_L) / 2) * Math.cos(tt * 1.5);
  const x = xAt(t);
  const pos = (xx: number): [number, number] => {
    const sl = (vy(xx + 1) - vy(xx - 1)) / 2;
    const n = 1 / Math.sqrt(1 + sl * sl);
    return [xx + sl * n * 14, vy(xx) - n * 14];
  };
  const [cx, cy] = pos(x);
  const ang = (Math.atan((vy(x + 1) - vy(x - 1)) / 2) * 180) / Math.PI;
  const struts: string[] = [];
  for (let xx = 1300; xx < 1820; xx += 30) struts.push(`M${xx},${vy(xx) + 4} V800`);
  return (
    <g opacity={opacity}>
      <path d={struts.join(' ')} stroke={C.faint} strokeWidth={2} opacity={0.6} />
      <path d={V_TRACK} fill="none" stroke={C.spr} strokeOpacity={0.25} strokeWidth={12} strokeLinecap="round" />
      <path d={V_TRACK} fill="none" stroke={C.spr} strokeWidth={4} strokeLinecap="round" />
      <line x1={VX_L - 20} y1={VY_E} x2={VX_R + 20} y2={VY_E} stroke={C.gold} strokeWidth={2} strokeDasharray="8 7" opacity={0.7} />
      <Spark x={cx} y={cy} r={5} color="gold" trail={[1, 2, 3, 4].map((k) => pos(xAt(t - k * 0.07)))} opacity={0.7} />
      <g transform={`translate(${cx} ${cy}) rotate(${ang})`}>
        <rect x={-22} y={-13} width={44} height={20} rx={6} fill="#2a2150" stroke={C.gold} strokeWidth={2.5} />
        <circle cx={-12} cy={9} r={5} fill={C.ink} />
        <circle cx={12} cy={9} r={5} fill={C.ink} />
      </g>
    </g>
  );
};

export const Reaction: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const draw = ramp(t, 0.4, cue(0) + 4, EASE_IN_OUT);
  const labels = ramp(t, cue(1) + 0.3, cue(1) + 1.2);
  const prodLabel = ramp(t, cue(1) + 2.2, cue(1) + 3.0);
  const ea = win(t, cue(2) + 0.5, cue(7), 0.7, 0.6);

  // kereta roller coaster kecil yang ikut menggambar lintasan
  const cartOn = win(t, 0.5, cue(0) + 4.4, 0.4, 0.9);
  const sCart = Math.max(0.004, Math.min(0.996, draw));

  // bola gagal: berayun di lembah reaktan (aproksimasi harmonik di antara titik balik)
  const failOn = win(t, cue(2) + 2.5, mix(cue(3), cueEnd(3), 0.5), 0.6, 0.6);
  const sFailAt = (tt: number) => {
    const ft = Math.max(0, tt - (cue(2) + 2.5));
    return F_L + (F_R - F_L) * (0.5 - 0.5 * Math.cos((2 * Math.PI * ft) / 2.6));
  };
  const sFail = sFailAt(t);
  // bola sukses
  const tS = mix(cue(3), cueEnd(3), 0.5);
  const okOn = win(t, tS - 0.5, cue(7), 0.5, 0.8);
  const sOk = okBall(t - tS);
  const tArr = tS + T_ARRIVE;
  const okE = interpolateColors(ramp(t, tArr - 0.3, tArr + 1.5), [0, 1], [C.kin, C.spr]);
  const okTrail = t > tS && t < tArr + 1.2 ? [1, 2, 3, 4].map((k) => okBall(t - tS - k * 0.05)) : [];
  const failTrail = [1, 2, 3].map((k) => sFailAt(t - k * 0.06));

  const dH = win(t, cue(4) + 0.6, cue(7), 0.7, 0.6);
  const heatOn = ramp(t, tArr - 0.2, tArr + 0.3) * (1 - ramp(t, cue(5) + 2, cue(5) + 3.5));
  const dHcard = win(t, cue(4) + 2.4, cue(5) - 0.2, 0.7, 0.5);

  // panel distribusi energi
  const panel = win(t, cue(5) + 0.2, cue(7) - 0.1, 0.7, 0.6);
  const kT = mix(0.9, 1.5, ramp(t, cue(5) + 2.4, cueEnd(5) - 0.5, EASE_IN_OUT));
  const cat = win(t, cue(6) + 0.3, dur - 0.6, 0.9, 0.6);
  const Ea = mix(4, 2.6, ramp(t, cue(6) + 1.2, cue(6) + 3.4, EASE_IN_OUT));
  const frac = above(Ea, kT);
  const coll = win(t, cue(2) + 0.8, cue(4) + 1.6, 0.7, 0.6);
  const finalCard = ramp(t, cue(7) + 0.2, cue(7) + 1.0);

  // kamera: dorong pelan ke lembah produk saat "eksoterm"
  const cam = ramp(t, cue(4) - 0.2, cue(4) + 2.0, EASE_IN_OUT) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 1.2, EASE_IN_OUT));
  const z = 1 + 0.05 * cam;
  const camX = sx(S_P);
  const camY = Y_P;

  // panel geometri
  const PX = 1290;
  const PY = 600;
  const PW = 500;
  const PH = 300;
  const ex = (E: number) => PX + (E / 8) * PW;
  const fy = (f: number) => PY - (f / 0.62) * PH;
  const curve = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const E = (8 * i) / 160;
      pts.push(`${i ? 'L' : 'M'}${ex(E).toFixed(1)},${fy(fMB(E, k)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const tail = (() => {
    const pts: string[] = [`M${ex(Ea).toFixed(1)},${PY}`];
    for (let i = 0; i <= 80; i++) {
      const E = Ea + ((8 - Ea) * i) / 80;
      pts.push(`L${ex(E).toFixed(1)},${fy(fMB(E, kT)).toFixed(1)}`);
    }
    pts.push(`L${ex(8)},${PY} Z`);
    return pts.join(' ');
  })();
  const curveCol = interpolateColors(ramp(t, cue(5) + 2.4, cueEnd(5) - 0.5), [0, 1], [C.pot, C.kin]);
  const tailPulse = 0.38 + 0.14 * Math.sin(t * 2.6);

  const struts: string[] = [];
  for (let s = 0.02; s < 1; s += 0.04) struts.push(`M${sx(s).toFixed(1)},${(trackY(s) + 6).toFixed(1)} V${AXIS_Y}`);

  // molekul hiasan di lembah: reaktan terpisah (A + B), produk terikat (AB)
  const molR = labels * (1 - ramp(t, cue(2) + 1.6, cue(2) + 2.6));
  const molP = prodLabel * (1 - ramp(t, cue(2) + 1.6, cue(2) + 2.6));

  return (
    <AbsoluteFill>
      <Stage>
        <Glow x={sx(S_TOP)} y={Y_TOP} r={260} color="spr" opacity={0.35 * ea} />
        <g transform={`translate(${camX} ${camY}) scale(${z}) translate(${-camX} ${-camY})`}>
          {/* sumbu */}
          <g opacity={draw}>
            <line x1={110} y1={AXIS_Y} x2={1200} y2={AXIS_Y} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <line x1={110} y1={AXIS_Y} x2={110} y2={300} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            <Label x={128} y={290} size={24} color={C.muted} anchor="start">
              energi
            </Label>
            <Label x={1196} y={858} size={22} color={C.muted} anchor="end">
              koordinat reaksi
            </Label>
          </g>
          <path d={struts.join(' ')} stroke={C.faint} strokeWidth={2} opacity={0.55 * draw} />
          <DrawPath d={TRACK} p={draw} stroke="spr" width={7} halo />
          {/* kilau yang terus merambat di rel */}
          <path d={TRACK} fill="none" stroke="#fff" strokeOpacity={0.5 * ramp(t, cue(0) + 4, cue(0) + 5)} strokeWidth={2.5} strokeLinecap="round" pathLength={1000} strokeDasharray="40 960" strokeDashoffset={-((t * 120) % 1000)} />
          {/* kereta yang menggambar lintasan */}
          {cartOn > 0.01
            ? (() => {
                const [cx, cy] = onTrack(sCart, 16);
                const ang = (Math.atan(slopeAt(sCart)) * 180) / Math.PI;
                const tr = [1, 2, 3, 4, 5].map((k) => onTrack(Math.max(0.004, sCart - k * 0.012), 16));
                return (
                  <g opacity={cartOn}>
                    <Spark x={cx} y={cy} r={6} color="gold" trail={tr} opacity={0.8} />
                    <g transform={`translate(${cx} ${cy}) rotate(${ang})`}>
                      <rect x={-26} y={-16} width={52} height={24} rx={7} fill="#2a2150" stroke={C.gold} strokeWidth={3} />
                      <circle cx={-14} cy={10} r={6} fill={C.ink} />
                      <circle cx={14} cy={10} r={6} fill={C.ink} />
                    </g>
                  </g>
                );
              })()
            : null}
          {/* jalur katalis (garis putus-putus mengalir) */}
          <g opacity={cat}>
            <path d={TRACK_CAT} fill="none" stroke={C.work} strokeOpacity={0.25} strokeWidth={14} strokeLinecap="round" />
            <path d={TRACK_CAT} fill="none" stroke={C.work} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-t * 40} strokeLinecap="round" />
            <Stream pts={CAT_PTS} color="work" n={4} speed={0.28} r={6} jitter={0} opacity={ramp(t, cue(6) + 1.0, cue(6) + 2.0)} />
            <Label x={sx(S_TOPC) + 110} y={Y_TOPC - 60} size={26} color={C.work} weight={600} anchor="start">
              jalan pintas katalis
            </Label>
          </g>
          {/* molekul di lembah */}
          {Array.from({length: 6}, (_, i) => {
            const bx = sx(S_R) - 75 + (i % 3) * 75 + 10 * Math.sin(t * (2.2 + rand(i)) + i);
            const by = Y_R - 70 - Math.floor(i / 3) * 44 + 8 * Math.cos(t * (2.6 + rand(i * 3)) + i * 2);
            return <circle key={i} cx={bx} cy={by} r={i % 2 ? 11 : 14} fill={i % 2 ? C.cyan : C.ink} opacity={0.8 * molR} />;
          })}
          {Array.from({length: 3}, (_, i) => {
            const bx = sx(S_P) - 60 + i * 60 + 6 * Math.sin(t * (1.8 + rand(i + 9)) + i);
            const by = Y_P - 66 - (i % 2) * 34 + 6 * Math.cos(t * 2.3 + i);
            const a = t * (0.8 + 0.3 * i) + i;
            return (
              <g key={i} opacity={0.8 * molP}>
                <line x1={bx - 12 * Math.cos(a)} y1={by - 12 * Math.sin(a)} x2={bx + 12 * Math.cos(a)} y2={by + 12 * Math.sin(a)} stroke="#fff" strokeOpacity={0.5} strokeWidth={5} />
                <circle cx={bx - 12 * Math.cos(a)} cy={by - 12 * Math.sin(a)} r={13} fill={C.ink} />
                <circle cx={bx + 12 * Math.cos(a)} cy={by + 12 * Math.sin(a)} r={10} fill={C.cyan} />
              </g>
            );
          })}
          {/* label lembah */}
          <Label x={sx(S_R)} y={Y_R + 44} size={30} color={C.ink} weight={600} opacity={labels}>
            reaktan
          </Label>
          <Label x={sx(S_P)} y={Y_P + 40} size={30} color={C.ink} weight={600} opacity={prodLabel}>
            produk
          </Label>
          <Label x={sx(S_TOP) + 48} y={Y_TOP + 6} size={24} color={C.muted} opacity={ea} anchor="start">
            keadaan transisi
          </Label>
          {/* garis tingkat & kurung Ea */}
          <g opacity={ea}>
            <line x1={sx(S_R) - 60} y1={Y_R} x2={sx(S_TOP) + 30} y2={Y_R} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
            <line x1={sx(S_TOP) - 160} y1={Y_TOP} x2={sx(S_TOP) + 30} y2={Y_TOP} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
            <circle cx={sx(S_TOP)} cy={Y_TOP} r={8 + 3 * Math.sin(t * 3)} fill={C.spr} opacity={0.8} />
          </g>
          <Bracket
            x={sx(S_TOP) - 150}
            y1={Y_R - 4}
            y2={Y_TOP + 4}
            color={C.gold}
            side="left"
            opacity={ea}
            label={
              <>
                E<TSub>a</TSub>
              </>
            }
          />
          <Bracket
            x={sx(S_TOPC) + 40}
            y1={Y_R - 4}
            y2={Y_TOPC + 4}
            color={C.work}
            opacity={cat * ramp(t, cue(6) + 1.0, cue(6) + 2.0)}
            label={
              <>
                E<TSub>a</TSub>′
              </>
            }
          />
          {/* ΔH */}
          <g opacity={dH}>
            <line x1={sx(S_R)} y1={Y_R} x2={1222} y2={Y_R} stroke={C.heat} strokeWidth={2} strokeDasharray="6 8" opacity={0.8} />
          </g>
          <Bracket x={1212} y1={Y_R + 2} y2={Y_P - 2} color={C.heat} opacity={dH} label="ΔH" />
          {/* tingkat energi bola gagal */}
          <g opacity={failOn}>
            <line x1={sx(F_L) - 10} y1={Y_FAIL} x2={sx(F_R) + 10} y2={Y_FAIL} stroke={C.kin} strokeWidth={3} strokeDasharray="10 8" />
            <Label x={sx(F_L) + 10} y={Y_FAIL - 28} size={24} color={C.kin} anchor="start" weight={600}>
              energi kurang
            </Label>
            {/* riak kecil di titik balik (bola berhenti sesaat lalu kembali) */}
            {[F_L, F_R].map((sTurn, k) => {
              const ft = Math.max(0, t - (cue(2) + 2.5));
              const ph = (((ft / 2.6 + (k ? 0.5 : 0)) % 1) + 1) % 1;
              const [rx, ry] = onTrack(sTurn);
              return <Ripple key={k} x={rx} y={ry} p={ph / 0.35} r={60} color="kin" rings={2} width={2} />;
            })}
          </g>
          <BallOnTrack s={sFail} color={C.kin} opacity={failOn} trail={failTrail} />
          {/* tingkat energi bola sukses */}
          <g opacity={okOn * (1 - ramp(t, tArr, tArr + 1))}>
            <line x1={sx(OK_L) - 10} y1={Y_OK} x2={sx(S_TOP) + 120} y2={Y_OK} stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" />
            <Label x={sx(S_TOP) + 136} y={Y_OK} size={24} color={C.gold} anchor="start" weight={600}>
              energi cukup → lolos
            </Label>
          </g>
          {/* panas dilepas di lembah produk: riak, aliran naik, gelombang panas */}
          {[0, 1, 2].map((i) => {
            const ph = ((((t - tArr) * 0.7 + i / 3) % 1) + 1) % 1;
            return <Ripple key={i} x={sx(S_P)} y={Y_P - BR} p={ph} r={150} color="heat" rings={1} width={4} />;
          }).map((el, i) => (
            <g key={i} opacity={heatOn}>
              {el}
            </g>
          ))}
          {[-1, 0, 1].map((k) => (
            <Stream
              key={k}
              pts={[
                [sx(S_P) + 40 * k, Y_P - 40],
                [sx(S_P) + 70 * k, Y_P - 110],
                [sx(S_P) + 95 * k, Y_P - 165],
              ]}
              color="heat"
              n={5}
              speed={0.55}
              r={5}
              seed={k + 2}
              opacity={heatOn}
            />
          ))}
          <HeatShimmer x1={sx(S_P) - 120} x2={sx(S_P) + 120} y={Y_P - 30} t={t} amount={heatOn * 0.8} />
          <Label x={sx(S_P)} y={Y_P - 190} size={28} color={C.heat} weight={600} opacity={heatOn * ramp(t, tArr + 0.2, tArr + 1)}>
            panas dilepas
          </Label>
          <BallOnTrack s={sOk} color={okE} opacity={okOn} trail={okTrail} />
          <Ripple x={sx(S_P)} y={Y_P - BR} p={(t - tArr) / 1.4} r={120} color="gold" rings={3} />
        </g>

        <Vignette t={t} opacity={win(t, cue(0) + 1.8, cue(2) + 0.1, 0.8, 0.6)} />
        {/* panel tabrakan: lemah memantul, kuat bereaksi */}
        <g opacity={coll}>
          <rect x={1290} y={250} width={520} height={400} rx={18} fill="rgba(10,16,36,0.82)" stroke={C.line} strokeWidth={2} />
          <Label x={1550} y={284} size={24} color={C.muted} weight={600} spacing={2}>
            TABRAKAN MOLEKUL
          </Label>
          {[0, 1].map((row) => {
            const ph = ((((t - cue(2)) / 3.2) % 1) + 1) % 1;
            const y = row === 0 ? 400 : 560;
            const meet = 0.45;
            // pelan: mendekat lalu memantul; kuat: mendekat cepat lalu menyatu
            const d = row === 0 ? (ph < meet ? 150 * (1 - ph / meet) : 150 * ((ph - meet) / (1 - meet))) : ph < meet ? 190 * (1 - ph / meet) : 0;
            const xa = 1550 - 34 - d;
            const xb = 1550 + 34 + d;
            const flash = row === 1 ? Math.max(0, 1 - Math.abs(ph - meet) / 0.08) : 0;
            const op = cyc(ph);
            const speedLines = row === 0 ? 0.35 : ph < meet ? 0.7 : 0;
            const after = Math.max(0, (ph - meet) / (1 - meet));
            return (
              <g key={row} opacity={op}>
                {flash > 0 ? <circle cx={1550} cy={y} r={60 + 60 * flash} fill="url(#soft-gold)" opacity={flash} /> : null}
                {/* garis gerak di belakang molekul */}
                {[-1, 1].map((sd) => (
                  <line key={sd} x1={sd < 0 ? xa - 40 : xb + 42} y1={y} x2={sd < 0 ? xa - 40 - 50 * speedLines : xb + 42 + 50 * speedLines} y2={y} stroke="#fff" strokeOpacity={0.35 * (row === 0 ? (ph < meet ? 1 : 0.6) : 1)} strokeWidth={3} strokeLinecap="round" />
                ))}
                {row === 0 ? <Ripple x={1550} y={y} p={(ph - meet) / 0.3} r={70} color="muted" rings={2} width={2} /> : null}
                {row === 1 && ph > meet
                  ? Array.from({length: 9}, (_, k) => {
                      const a = (k / 9) * Math.PI * 2 + 0.3;
                      const rr = 30 + 120 * Math.sqrt(after);
                      return <Spark key={k} x={1550 + Math.cos(a) * rr} y={y + Math.sin(a) * rr * 0.7} r={4} color={k % 2 ? 'gold' : 'heat'} opacity={(1 - after) * 0.9} />;
                    })
                  : null}
                <circle cx={xa} cy={y} r={30} fill={C.pot} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
                <circle cx={xa - 9} cy={y - 9} r={7} fill="#fff" opacity={0.45} />
                <circle cx={xb} cy={y} r={34} fill={C.kin} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
                <circle cx={xb - 10} cy={y - 10} r={8} fill="#fff" opacity={0.45} />
                {row === 1 ? <line x1={xa} y1={y} x2={xb} y2={y} stroke="#fff" strokeWidth={6} opacity={0.6 * Math.max(0, Math.min(1, (ph - meet) / 0.05))} /> : null}
              </g>
            );
          })}
          <Label x={1550} y={458} size={24} color={C.muted}>
            pelan → memantul, tidak bereaksi
          </Label>
          <Label x={1550} y={618} size={24} color={C.gold} weight={600}>
            cukup keras → bereaksi
          </Label>
        </g>

        {/* panel distribusi energi molekul */}
        <g opacity={panel}>
          <rect x={PX - 60} y={PY - PH - 90} width={PW + 110} height={PH + 160} rx={18} fill="rgba(10,16,36,0.82)" stroke={C.line} strokeWidth={2} />
          <Label x={PX + PW / 2} y={PY - PH - 58} size={24} color={C.muted} weight={600} spacing={2}>
            ENERGI KINETIK MOLEKUL
          </Label>
          <line x1={PX} y1={PY} x2={PX + PW + 20} y2={PY} stroke={C.muted} strokeWidth={2} />
          <line x1={PX} y1={PY} x2={PX} y2={PY - PH - 10} stroke={C.muted} strokeWidth={2} />
          <path d={tail} fill={C.gold} opacity={tailPulse} />
          <path d={curve(0.9)} fill="none" stroke={C.pot} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.6 * ramp(t, cue(5) + 2.4, cue(5) + 3)} />
          {/* molekul sampel: makin panas → bergeser ke kanan; yang melewati Ea menyala emas */}
          {SAMPLES.map((m, i) => {
            const E = m.e * kT;
            if (E > 7.8) return null;
            const top = fy(fMB(E, kT));
            const x = ex(E) + 3 * Math.sin(t * 2.4 + m.ph);
            const y = PY - 6 - m.h * (PY - 6 - top) + 3 * Math.cos(t * 3.1 + m.ph);
            const g = Math.max(0, Math.min(1, (E - Ea) / 0.3 + 0.5));
            return (
              <g key={i}>
                {g > 0.02 ? <circle cx={x} cy={y} r={14} fill="url(#soft-gold)" opacity={g} /> : null}
                <circle cx={x} cy={y} r={4.5} fill={interpolateColors(g, [0, 1], [curveCol, C.gold])} opacity={0.85} />
              </g>
            );
          })}
          <path d={curve(kT)} fill="none" stroke={curveCol} strokeWidth={4.5} />
          <line x1={ex(Ea)} y1={PY} x2={ex(Ea)} y2={PY - PH} stroke={C.gold} strokeWidth={3} strokeDasharray="8 6" />
          <Label x={ex(Ea)} y={PY - PH - 14} size={24} color={C.gold} weight={600}>
            <tspan>E</tspan>
            <TSub>a</TSub>
          </Label>
          <Label x={PX + PW} y={PY + 28} size={22} color={C.muted} anchor="end">
            energi →
          </Label>
          <Label x={PX + 10} y={PY + 28} size={22} color={C.pot} anchor="start" opacity={1 - ramp(kT, 1.05, 1.35)}>
            suhu rendah
          </Label>
          <Label x={PX + 10} y={PY + 28} size={22} color={C.kin} anchor="start" opacity={ramp(kT, 1.05, 1.35)}>
            suhu tinggi
          </Label>
          <Label x={ex(Ea) + 20} y={PY - 150} size={30} font="mono" color={C.gold} anchor="start" weight={600}>
            {`${(frac * 100).toFixed(0)} %`}
          </Label>
          <Label x={ex(Ea) + 20} y={PY - 112} size={20} color={C.muted} anchor="start">
            {'melewati bukit'}
          </Label>
        </g>
        <Glow x={1450} y={230} r={300} color="gold" opacity={0.4 * finalCard} />
        <Twinkles x={1450} y={230} rx={300} ry={100} n={6} color="gold" opacity={finalCard} seed={5} />
        <Motes x={sx(S_TOP)} y={560} rx={520} ry={240} n={26} color="spr" opacity={0.35 * draw} seed={11} />
      </Stage>
      <Formula x={1470} y={300} p={dHcard} accent={C.heat} size={58} caption="produk lebih rendah: eksoterm">
        Δ<V>H</V> = <V>H</V>
        <Sub>produk</Sub> − <V>H</V>
        <Sub>reaktan</Sub> {'< 0'}
      </Formula>
      <Note x={1500} y={440} p={win(t, cue(0) + 1.2, cue(2) + 0.2, 0.7, 0.5)} color={C.spr} size={28}>
        tinggi lintasan = energi potensial molekul
      </Note>
      <Note x={1530} y={790} p={win(t, cue(6) + 2.6, cue(7) - 0.1, 0.6, 0.5)} color={C.work} size={26}>
        katalis: bukit lebih rendah, Δ<i>H</i> tetap sama
      </Note>
      <Formula x={1450} y={230} p={finalCard} accent={C.gold} size={56} caption="dari bola boling sampai molekul">
        <V>K</V>
        <Sub>i</Sub> + <V>U</V>
        <Sub>i</Sub> + <V>W</V>
        <Sub>lain</Sub> = <V>K</V>
        <Sub>f</Sub> + <V>U</V>
        <Sub>f</Sub>
      </Formula>
    </AbsoluteFill>
  );
};
