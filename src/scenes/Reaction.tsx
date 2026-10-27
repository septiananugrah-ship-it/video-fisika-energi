import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {DrawPath, Formula, Glow, Label, Note, Stage, Sub, TSub, V} from '../components/primitives';
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

const BallOnTrack: React.FC<{s: number; color: string; opacity?: number}> = ({s, color, opacity = 1}) => {
  const h = 0.002;
  const slope = (trackY(s + h) - trackY(s - h)) / (2 * h * WD);
  const n = 1 / Math.sqrt(1 + slope * slope);
  const x = sx(s) + slope * n * BR;
  const y = trackY(s) - n * BR;
  return opacity <= 0.001 ? null : (
    <g opacity={opacity}>
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

export const Reaction: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();
  const draw = ramp(t, 0.4, cue(0) + 4, EASE_IN_OUT);
  const labels = ramp(t, cue(1) + 0.3, cue(1) + 1.2);
  const prodLabel = ramp(t, cue(1) + 2.2, cue(1) + 3.0);
  const ea = win(t, cue(2) + 0.5, cue(7), 0.7, 0.6);

  // bola gagal: berayun di lembah reaktan (aproksimasi harmonik di antara titik balik)
  const failOn = win(t, cue(2) + 2.5, mix(cue(3), cueEnd(3), 0.5), 0.6, 0.6);
  const ft = Math.max(0, t - (cue(2) + 2.5));
  const sFail = F_L + (F_R - F_L) * (0.5 - 0.5 * Math.cos((2 * Math.PI * ft) / 2.6));
  // bola sukses
  const tS = mix(cue(3), cueEnd(3), 0.5);
  const okOn = win(t, tS - 0.5, cue(7), 0.5, 0.8);
  const sOk = okBall(t - tS);
  const tArr = tS + T_ARRIVE;
  const okE = interpolateColors(ramp(t, tArr - 0.3, tArr + 1.5), [0, 1], [C.kin, C.spr]);

  const dH = win(t, cue(4) + 0.6, cue(7), 0.7, 0.6);
  const heatOn = ramp(t, tArr - 0.2, tArr + 0.3) * (1 - ramp(t, cue(5) + 2, cue(5) + 3.5));
  const dHcard = win(t, cue(4) + 2.4, cue(5) - 0.2, 0.6, 0.5);

  // panel distribusi energi
  const panel = win(t, cue(5) + 0.2, cue(7) - 0.1, 0.7, 0.6);
  const kT = mix(0.9, 1.5, ramp(t, cue(5) + 2.4, cueEnd(5) - 0.5, EASE_IN_OUT));
  const cat = win(t, cue(6) + 0.3, dur - 0.6, 0.9, 0.6);
  const Ea = mix(4, 2.6, ramp(t, cue(6) + 1.2, cue(6) + 3.4, EASE_IN_OUT));
  const frac = above(Ea, kT);
  const coll = win(t, cue(2) + 0.8, cue(4) + 1.6, 0.7, 0.6);
  const finalCard = ramp(t, cue(7) + 0.2, cue(7) + 1.0);

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

  // riak panas di lembah produk
  const ripples = [0, 1, 2].map((i) => {
    const ph = (((t - tArr) * 0.7 + i / 3) % 1 + 1) % 1;
    return {r: 30 + 110 * ph, o: Math.min(1, ph * 6) * (1 - ph) * heatOn};
  });

  const struts: string[] = [];
  for (let s = 0.02; s < 1; s += 0.04) struts.push(`M${sx(s).toFixed(1)},${(trackY(s) + 6).toFixed(1)} V${AXIS_Y}`);

  return (
    <AbsoluteFill>
      <Stage>
        <Glow x={sx(S_TOP)} y={Y_TOP} r={260} color="spr" opacity={0.35 * ea} />
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
        {/* jalur katalis */}
        <g opacity={cat}>
          <path d={TRACK_CAT} fill="none" stroke={C.work} strokeWidth={5} strokeDasharray="14 10" strokeLinecap="round" />
          <Label x={sx(S_TOPC) + 110} y={Y_TOPC - 60} size={26} color={C.work} weight={600} anchor="start">
            jalan pintas katalis
          </Label>
        </g>
        {/* label lembah */}
        <Label x={sx(S_R)} y={Y_R + 44} size={30} color={C.ink} weight={600} opacity={labels}>
          reaktan
        </Label>
        <Label x={sx(S_P)} y={Y_P + 40} size={30} color={C.ink} weight={600} opacity={prodLabel}>
          produk
        </Label>
        <Label x={sx(S_TOP)} y={Y_TOP - 40} size={24} color={C.muted} opacity={ea}>
          keadaan transisi
        </Label>
        {/* garis tingkat & kurung Ea */}
        <g opacity={ea}>
          <line x1={sx(S_R) - 60} y1={Y_R} x2={sx(S_TOP) + 30} y2={Y_R} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
          <line x1={sx(S_TOP) - 160} y1={Y_TOP} x2={sx(S_TOP) + 30} y2={Y_TOP} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
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
        </g>
        <BallOnTrack s={sFail} color={C.kin} opacity={failOn} />
        {/* tingkat energi bola sukses */}
        <g opacity={okOn * (1 - ramp(t, tArr, tArr + 1))}>
          <line x1={sx(OK_L) - 10} y1={Y_OK} x2={sx(S_TOP) + 120} y2={Y_OK} stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" />
          <Label x={sx(S_TOP) + 136} y={Y_OK} size={24} color={C.gold} anchor="start" weight={600}>
            energi cukup → lolos
          </Label>
        </g>
        {ripples.map((r, i) => (
          <circle key={i} cx={sx(S_P)} cy={Y_P - BR} r={r.r} fill="none" stroke={C.heat} strokeWidth={4} opacity={r.o} />
        ))}
        <Label x={sx(S_P)} y={Y_P - 190} size={28} color={C.heat} weight={600} opacity={heatOn * ramp(t, tArr + 0.2, tArr + 1)}>
          panas dilepas
        </Label>
        <BallOnTrack s={sOk} color={okE} opacity={okOn} />

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
            return (
              <g key={row} opacity={op}>
                {flash > 0 ? <circle cx={1550} cy={y} r={60 + 60 * flash} fill="url(#soft-gold)" opacity={flash} /> : null}
                <circle cx={xa} cy={y} r={30} fill={C.pot} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
                <circle cx={xb} cy={y} r={34} fill={C.kin} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
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
          <path d={tail} fill={C.gold} opacity={0.45} />
          <path d={curve(0.9)} fill="none" stroke={C.pot} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.6 * ramp(t, cue(5) + 2.4, cue(5) + 3)} />
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
      </Stage>
      <Formula x={1530} y={300} p={dHcard} accent={C.heat} size={58} caption="produk lebih rendah: eksoterm">
        Δ<V>H</V> = <V>H</V>
        <Sub>produk</Sub> − <V>H</V>
        <Sub>reaktan</Sub> {'< 0'}
      </Formula>
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
      {/* keterangan suhu di panel muncul lewat label; bintik molekul hiasan */}
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        {Array.from({length: 10}, (_, i) => {
          const o = labels * (1 - ramp(t, cue(2), cue(2) + 1)) * 0.8;
          const x = sx(S_R) + 70 * Math.sin(t * (1 + rand(i)) + i);
          const y = Y_R - 60 - 30 * rand(i * 3) + 10 * Math.cos(t * 1.7 + i);
          return <circle key={i} cx={x} cy={y} r={5} fill={C.kin} opacity={o} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};
