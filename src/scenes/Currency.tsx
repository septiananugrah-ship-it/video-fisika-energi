import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Ground, HeatShimmer} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Motes, Ripple, Stage, Stream, Sub, TSub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Cerita balok Feynman: 28 balok, sebagian disembunyikan di kotak, sebagian keluar jendela —
// jumlah total selalu 28. Lalu: energi = angka tetap, bentuk-bentuknya, joule, dan usaha.

const BS = 62; // ukuran balok
const GAP = 12;
const GX = 210; // kiri grid
const FLOOR = 770;
const COLORS = [C.kin, C.pot, C.spr, C.work, C.gold, C.cyan, C.heat];

const gridPos = (i: number) => {
  const col = i % 7;
  const row = Math.floor(i / 7);
  return {x: GX + col * (BS + GAP), y: FLOOR - BS - row * (BS + GAP)};
};
// 5 balok (23..27) ke kotak, 3 balok (20..22) keluar jendela
const BOX = {x: 820, w: 220, top: 640};
const boxPos = (k: number) => ({x: BOX.x + 10 + (k % 3) * 66 + (k >= 3 ? 33 : 0), y: FLOOR - BS - 3 - Math.floor(k / 3) * (BS + 3)});
const WIN = {x: 1180, y: 360, w: 170, h: 200};
const outPos = (k: number) => ({x: 1420 + k * 76, y: FLOOR - BS});
const STARS = Array.from({length: 9}, (_, i) => ({x: WIN.x + 14 + ((i * 53) % (WIN.w - 28)), y: WIN.y + 14 + ((i * 37) % (WIN.h - 60)), s: 1.2 + (i % 3) * 0.7}));

/** Angka yang berganti dengan silang-pudar (tanpa loncatan). */
const Num: React.FC<{a: number; b: number; p: number; color: string}> = ({a, b, p, color}) => (
  <span style={{position: 'relative', display: 'inline-block', width: '1.3em', textAlign: 'center', color}}>
    <span style={{opacity: 1 - p, position: 'absolute', left: 0, right: 0, translate: `0px ${-p * 14}px`}}>{a}</span>
    <span style={{opacity: p, translate: `0px ${(1 - p) * 14}px`, display: 'inline-block'}}>{b}</span>
  </span>
);

/** Penghitung bergulir: nilai kontinu v, angka bulat bergulir halus ke angka berikutnya. */
const Roll: React.FC<{v: number; color: string}> = ({v, color}) => {
  const n = Math.floor(v + 1e-6);
  const raw = v - n;
  const k = Math.max(0, Math.min(1, (raw - 0.25) / 0.5));
  const f = k * k * (3 - 2 * k);
  return <Num a={n} b={n + 1} p={f} color={color} />;
};

/** Segmen teks yang melebar masuk (lebar & opasitas ikut p). */
const Seg: React.FC<{p: number; w: number; children: React.ReactNode}> = ({p, w, children}) => (
  <span style={{display: 'inline-block', maxWidth: w * p, overflow: 'hidden', whiteSpace: 'nowrap', opacity: p, verticalAlign: 'bottom'}}>{children}</span>
);

const Block: React.FC<{x: number; y: number; c: string; rot?: number; s?: number; o?: number; hi?: number; shine?: number}> = ({x, y, c, rot = 0, s = 1, o = 1, hi = 0, shine = 0}) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x + BS / 2} ${y + BS / 2}) rotate(${rot}) scale(${s * (1 + 0.12 * hi)})`} opacity={o}>
      {hi > 0.01 ? <rect x={-BS / 2 - 6} y={-BS / 2 - 6} width={BS + 12} height={BS + 12} rx={14} fill={c} opacity={0.25 * hi} /> : null}
      <rect x={-BS / 2} y={-BS / 2} width={BS} height={BS} rx={10} fill={c} fillOpacity={0.22 + 0.3 * hi} stroke={c} strokeWidth={3} />
      <rect x={-BS / 2 + 8} y={-BS / 2 + 8} width={BS - 16} height={8} rx={4} fill="#fff" opacity={0.18 + 0.35 * shine} />
      <rect x={-BS / 2 + 8} y={-BS / 2 + 20} width={6} height={BS - 30} rx={3} fill="#fff" opacity={0.08 + 0.2 * shine} />
    </g>
  );

export const Currency: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- fase balok (baris 0–4) ----
  const blocksIn = ramp(t, 0.6, 3.2);
  const blockScene = 1 - ramp(t, cue(5) + 0.2, cue(5) + 1.4, EASE_IN_OUT);
  const boxIn = ramp(t, cue(2) - 0.2, cue(2) + 0.8);
  const winIn = ramp(t, cue(3) - 0.2, cue(3) + 0.8);
  const tBox = wordOf(2, 'Ternyata');
  const boxStart = (k: number) => tBox + k * 0.35;
  const outStart = (k: number) => cue(3) + 1.6 + k * 0.45;
  const toBoxAt = (k: number, tt: number) => ramp(tt, boxStart(k), boxStart(k) + 1.1, EASE_IN_OUT);
  const toOutAt = (k: number, tt: number) => ramp(tt, outStart(k), outStart(k) + 1.3, EASE_IN_OUT);
  const landBox = (k: number) => ramp(t, boxStart(k) + 0.85, boxStart(k) + 1.15);
  const exitWin = (k: number) => ramp(t, outStart(k) + 0.55, outStart(k) + 0.85);
  const ruleGlow = win(t, cue(4) + 0.3, cue(5), 0.6, 0.6);
  const flapOpen = boxIn * (1 - 0.8 * ramp(t, boxStart(4) + 1.3, boxStart(4) + 2.1, EASE_IN_OUT));

  // penghitung: ibu menghitung satu per satu (sorotan menyapu balok), lalu angka bergulir saat balok pindah
  const cntA = cue(1) + 0.5;
  const cntB = Math.max(cntA + 1.6, wordOf(1, 'menghitung') + 1.6);
  const count = 28 * ramp(t, cntA, cntB, (x) => x);
  const inBox = [0, 1, 2, 3, 4].reduce((s, k) => s + landBox(k), 0);
  const outside = [0, 1, 2].reduce((s, k) => s + exitWin(k), 0);
  const visible = count - inBox - outside;

  // kamera: dorong pelan ke kotak (baris 2) lalu ke jendela (baris 3)
  const camZ = 1 + 0.05 * win(t, cue(2) + 0.2, cue(4) - 0.2, 1.4, 1.6);
  const camC = {x: mix(930, 1300, ramp(t, cue(3) - 0.6, cue(3) + 1.0, EASE_IN_OUT)), y: 620};

  const pose = (i: number, tt: number) => {
    const g = gridPos(i);
    const appear = ramp(tt, 0.6 + i * 0.07, 1.2 + i * 0.07);
    let x = g.x;
    let y = g.y - (1 - appear) * 40;
    let rot = 0;
    let o = appear;
    let air = 0;
    if (i >= 23) {
      const k = i - 23;
      const p = toBoxAt(k, tt);
      const b = boxPos(k);
      x = mix(g.x, b.x, p);
      y = mix(g.y, b.y, p) - Math.sin(Math.PI * p) * 220;
      rot = 360 * p * (k % 2 ? 1 : -1) * 0.5;
      air = Math.sin(Math.PI * p);
    } else if (i >= 20) {
      const k = i - 20;
      const p = toOutAt(k, tt);
      const w = {x: WIN.x + WIN.w / 2 - BS / 2, y: WIN.y + WIN.h / 2 - BS / 2};
      const e = outPos(k);
      // lintasan dua bagian: ke jendela, lalu jatuh ke halaman
      const p1 = Math.min(1, p * 1.8);
      const p2 = Math.max(0, (p - 0.55) / 0.45);
      x = p < 0.55 ? mix(g.x, w.x, p1) : mix(w.x, e.x, p2);
      y = p < 0.55 ? mix(g.y, w.y, p1) - Math.sin(Math.PI * p1) * 160 : mix(w.y, e.y, p2 * p2);
      rot = 270 * p * (k % 2 ? 1 : -1);
      air = Math.sin(Math.PI * p);
    }
    return {x, y, rot, o, air};
  };

  // kilau menyapu tumpukan balok sesekali
  const sweepPh = (t * 0.18) % 1;
  const sweepX = GX - 200 + sweepPh * 1100;

  // ---- fase energi (baris 5–8) ----
  const eq = win(t, cue(5) + 0.8, cue(7) - 0.2, 0.8, 0.7);
  const formsT = [wordOf(6, 'kinetik'), wordOf(6, 'potensial'), wordOf(6, 'termal')];
  const forms = formsT.map((a) => win(t, a - 0.2, cue(7) - 0.2, 0.7, 0.7));
  const mixBar = win(t, cue(5) + 1.4, formsT[0] - 0.3, 0.8, 0.6);
  const links = [Math.min(forms[0], forms[1]), Math.min(forms[1], forms[2]), Math.min(forms[2], forms[0])];
  const apple = win(t, cue(7) + 0.2, cue(8) - 0.1, 0.7, 0.7);
  const lift = ramp(t, cue(7) + 1.4, cue(7) + 4.4, EASE_IN_OUT);
  const lifting = win(t, cue(7) + 1.3, cue(7) + 4.3, 0.4, 0.5);
  const transfer = ramp(t, cue(8) + 0.2, cue(8) + 1.0);
  const flowQ = ramp(t, cue(8) + 0.8, cue(8) + 6.2, EASE_IN_OUT);

  // batang campuran: proporsi K/U/termal berubah, panjang total tetap
  const mv = [1.9 + Math.sin(t * 1.3), 1.9 + Math.sin(t * 1.3 + 2.1), 1.9 + Math.sin(t * 1.3 + 4.2)];
  const mvs = mv[0] + mv[1] + mv[2];
  const MBX = 560;
  const MBW = 800;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="cur-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1640" />
            <stop offset="100%" stopColor="#1a3070" />
          </linearGradient>
          <clipPath id="cur-win">
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={6} />
          </clipPath>
          <clipPath id="cur-clip-kin">
            <rect x={200} y={560} width={460} height={270} rx={20} />
          </clipPath>
          <clipPath id="cur-clip-pot">
            <rect x={730} y={560} width={460} height={270} rx={20} />
          </clipPath>
          <clipPath id="cur-A">
            <circle cx={560} cy={600} r={86} />
          </clipPath>
          <clipPath id="cur-B">
            <circle cx={1360} cy={600} r={86} />
          </clipPath>
        </defs>

        {/* ===== balok ===== */}
        <g opacity={blockScene} transform={`translate(${camC.x} ${camC.y}) scale(${camZ}) translate(${-camC.x} ${-camC.y})`}>
          <Motes x={520} y={560} rx={420} ry={230} n={24} color="gold" opacity={0.35 * blocksIn} seed={2} />
          <Ground x1={150} x2={1770} y={FLOOR} />
          {/* dinding & jendela malam */}
          <g opacity={winIn}>
            <rect x={WIN.x - 30} y={250} width={30 + WIN.w + 30} height={FLOOR - 250} fill="#0c1430" opacity={0.6} />
            <rect x={WIN.x - 30} y={250} width={6} height={FLOOR - 250} fill="#fff" opacity={0.05} />
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={6} fill="url(#cur-sky)" />
            <g clipPath="url(#cur-win)">
              <circle cx={WIN.x + 124} cy={WIN.y + 48} r={40} fill="url(#soft-white)" opacity={0.6} />
              <circle cx={WIN.x + 124} cy={WIN.y + 48} r={16} fill="#f3f0dc" />
              <circle cx={WIN.x + 131} cy={WIN.y + 43} r={14} fill="#11204e" />
              {STARS.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * (1.5 + i * 0.3) + i))} />
              ))}
              <path d={`M${WIN.x},${WIN.y + WIN.h - 30} q40,-26 80,-8 t90,-6 v40 h-170 Z`} fill="#0a1534" />
            </g>
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={6} fill="none" stroke={C.cyan} strokeWidth={4} />
            <line x1={WIN.x + WIN.w / 2} y1={WIN.y} x2={WIN.x + WIN.w / 2} y2={WIN.y + WIN.h} stroke={C.cyan} strokeWidth={3} />
            <line x1={WIN.x} y1={WIN.y + WIN.h / 2} x2={WIN.x + WIN.w} y2={WIN.y + WIN.h / 2} stroke={C.cyan} strokeWidth={3} />
            {/* tirai bergoyang */}
            {[0, 1].map((s) => {
              const sw = 6 * Math.sin(t * 1.4 + s * 1.7);
              const x0 = s ? WIN.x + WIN.w + 6 : WIN.x - 6;
              const dir = s ? -1 : 1;
              return (
                <path
                  key={s}
                  d={`M${x0},${WIN.y - 14} L${x0 + dir * 34},${WIN.y - 14} Q${x0 + dir * (22 + sw)},${WIN.y + 90} ${x0 + dir * (14 + sw * 1.6)},${WIN.y + WIN.h + 20} L${x0},${WIN.y + WIN.h + 20} Z`}
                  fill={C.spr}
                  opacity={0.22}
                />
              );
            })}
            <rect x={WIN.x - 16} y={WIN.y + WIN.h} width={WIN.w + 32} height={10} rx={4} fill="#22305a" />
            <Label x={WIN.x + WIN.w / 2} y={WIN.y - 40} size={26} color={C.cyan}>
              jendela
            </Label>
            {/* halaman berumput */}
            {Array.from({length: 14}, (_, i) => {
              const gx = 1400 + i * 26;
              const sw = 5 * Math.sin(t * 1.8 + i * 0.7);
              return <path key={i} d={`M${gx},${FLOOR} q${2 + sw * 0.5},-12 ${4 + sw},-${18 + (i % 3) * 5} M${gx + 6},${FLOOR} q${-1 + sw * 0.4},-10 ${-2 + sw * 0.8},-${12 + (i % 2) * 6}`} stroke={C.work} strokeOpacity={0.55} strokeWidth={2.5} fill="none" strokeLinecap="round" />;
            })}
            <Label x={1530} y={FLOOR - 120} size={24} color={C.muted}>
              halaman
            </Label>
          </g>
          {/* kotak: dinding belakang + tutup yang membuka */}
          <g opacity={boxIn}>
            <rect x={BOX.x} y={BOX.top} width={BOX.w} height={FLOOR - BOX.top} fill="#0a1230" />
            <g transform={`rotate(${-140 * flapOpen} ${BOX.x} ${BOX.top})`}>
              <rect x={BOX.x} y={BOX.top - 5} width={92} height={10} rx={4} fill="#1a2550" stroke={C.muted} strokeWidth={3} />
            </g>
            <g transform={`rotate(${140 * flapOpen} ${BOX.x + BOX.w} ${BOX.top})`}>
              <rect x={BOX.x + BOX.w - 92} y={BOX.top - 5} width={92} height={10} rx={4} fill="#1a2550" stroke={C.muted} strokeWidth={3} />
            </g>
          </g>
          {/* bayangan balok di lantai */}
          {Array.from({length: 28}, (_, i) => {
            const p = pose(i, t);
            if (i < 20 && i >= 7) return null;
            const h = Math.max(0, FLOOR - (p.y + BS));
            const k = Math.max(0, 1 - h / 320);
            return <ellipse key={`s${i}`} cx={p.x + BS / 2} cy={FLOOR + 3} rx={(BS / 2 + 6) * (0.5 + 0.5 * k)} ry={5} fill="#000" opacity={0.35 * k * p.o * blocksIn} />;
          })}
          {/* jejak kabur balok yang melayang */}
          {Array.from({length: 8}, (_, j) => {
            const i = 20 + j;
            return [0.06, 0.12].map((d, m) => {
              const p = pose(i, t - d);
              const cur = pose(i, t);
              if (cur.air < 0.05) return null;
              return <Block key={`gh${i}-${m}`} x={p.x} y={p.y} c={COLORS[i % 7]} rot={p.rot} o={0.22 * (1 - m * 0.5) * cur.air * blocksIn} />;
            });
          })}
          {Array.from({length: 28}, (_, i) => {
            const p = pose(i, t);
            const hi = Math.max(0, 1 - Math.abs(count - 0.5 - i) / 1.2) * (1 - ramp(t, cntB, cntB + 0.7, EASE_IN_OUT));
            const shine = Math.max(0, 1 - Math.abs(p.x + BS / 2 - sweepX - (p.y - 500) * 0.4) / 60) * cyc(sweepPh);
            return <Block key={i} x={p.x} y={p.y} c={COLORS[i % 7]} rot={p.rot} o={p.o * blocksIn} hi={hi} shine={shine} />;
          })}
          {/* sisi depan kotak (menyembunyikan balok di dalamnya) */}
          <g opacity={boxIn}>
            <rect x={BOX.x} y={BOX.top} width={BOX.w} height={FLOOR - BOX.top} fill="#13204a" opacity={0.86} stroke={interpolateColors(ruleGlow, [0, 1], [C.muted, C.gold])} strokeWidth={4} />
            <rect x={BOX.x + 10} y={BOX.top + 10} width={BOX.w - 20} height={8} rx={4} fill="#fff" opacity={0.06} />
            <Label x={BOX.x + BOX.w / 2} y={BOX.top + 68} size={28} color={C.muted} weight={600}>
              kotak
            </Label>
            <Glow x={BOX.x + BOX.w / 2} y={BOX.top + 60} r={200} color="gold" opacity={0.6 * ruleGlow} />
          </g>
          {[0, 1, 2, 3, 4].map((k) => (
            <Ripple key={`rb${k}`} x={BOX.x + BOX.w / 2} y={BOX.top} p={(t - boxStart(k) - 1.0) / 0.9} r={70} color="cyan" rings={2} />
          ))}
          {[0, 1, 2].map((k) => (
            <Ripple key={`ro${k}`} x={outPos(k).x + BS / 2} y={FLOOR} p={(t - outStart(k) - 1.25) / 0.9} r={60} color="cyan" rings={2} />
          ))}
          {/* yang di luar jendela ikut disorot saat aturan diucapkan */}
          <Glow x={1496 + BS / 2} y={FLOOR - 30} r={190} color="gold" opacity={0.55 * ruleGlow} />
        </g>

        {/* ===== energi: proporsi bentuk berubah, total tetap (baris 5) ===== */}
        <g opacity={mixBar}>
          {(() => {
            let acc = MBX;
            const parts: {c: string; lab: React.ReactNode}[] = [
              {c: C.kin, lab: 'K'},
              {c: C.pot, lab: 'U'},
              {c: C.heat, lab: <>E<TSub>termal</TSub></>},
            ];
            return parts.map((p, i) => {
              const w = (mv[i] / mvs) * MBW;
              const x = acc;
              acc += w;
              return (
                <g key={i}>
                  <rect x={x + 2} y={640} width={Math.max(0, w - 4)} height={64} rx={10} fill={p.c} opacity={0.85} />
                  <rect x={x + 10} y={648} width={Math.max(0, w - 20)} height={8} rx={4} fill="#fff" opacity={0.22} />
                  <text x={x + w / 2} y={674} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontWeight={600} fontSize={32} fill="#0a1024">
                    {p.lab}
                  </text>
                </g>
              );
            });
          })()}
          <path d={`M${MBX},622 v-14 h${MBW} v14`} fill="none" stroke={C.gold} strokeWidth={3} />
          <Label x={960} y={590} size={26} color={C.gold} weight={600}>
            total tetap
          </Label>
          <Motes x={960} y={672} rx={460} ry={70} n={18} color="gold" opacity={0.5} seed={4} />
        </g>

        {/* ===== bentuk energi (baris 6) + aliran perubahan bentuk antar-panel ===== */}
        <Stream pts={[[620, 556], [695, 512], [770, 556]]} color="kin" n={6} speed={0.55} r={4} jitter={3} opacity={links[0]} seed={1} />
        <Stream pts={[[1150, 556], [1225, 512], [1300, 556]]} color="pot" n={6} speed={0.55} r={4} jitter={3} opacity={links[1]} seed={2} />
        <Stream pts={[[1490, 836], [1200, 872], [720, 872], [430, 836]]} color="heat" n={10} speed={0.28} r={4} jitter={3} opacity={links[2] * 0.85} seed={3} />
        {/* kinetik: bola melaju */}
        <g opacity={forms[0]}>
          <rect x={200} y={560} width={460} height={270} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.kin} strokeOpacity={0.5} strokeWidth={2} />
          <line x1={220} y1={750} x2={640} y2={750} stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
          <g clipPath="url(#cur-clip-kin)">
            {[0, 0.5].map((off) => {
              const ph = (t * 0.4 + off) % 1;
              const x = 250 + ph * 330;
              const o = cyc(ph);
              const spin = (ph * 330 * 180) / (Math.PI * 28);
              return (
                <g key={off} opacity={o}>
                  <ellipse cx={x} cy={752} rx={26} ry={4} fill="#000" opacity={0.4} />
                  {[-10, 0, 10].map((dy) => (
                    <line key={dy} x1={x - 36} y1={722 + dy} x2={x - 36 - 40 - (dy === 0 ? 16 : 0)} y2={722 + dy} stroke={C.kin} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
                  ))}
                  <Glow x={x} y={722} r={70} color="kin" opacity={0.6} />
                  <circle cx={x} cy={722} r={28} fill={C.kin} />
                  <g transform={`rotate(${spin} ${x} 722)`}>
                    <line x1={x - 18} y1={722} x2={x + 18} y2={722} stroke="#7a3a10" strokeWidth={3} />
                    <line x1={x} y1={704} x2={x} y2={740} stroke="#7a3a10" strokeWidth={3} />
                  </g>
                  <circle cx={x - 9} cy={712} r={6} fill="#fff" opacity={0.45} />
                  <Arrow x1={x + 36} y1={722} x2={x + 100} y2={722} color="kin" width={5} />
                </g>
              );
            })}
          </g>
          <Label x={430} y={605} size={32} color={C.kin} weight={600}>
            kinetik · gerak
          </Label>
        </g>
        {/* potensial: bola di rak (bayangan jatuh = energi yang siap dilepas) */}
        <g opacity={forms[1]}>
          <rect x={730} y={560} width={460} height={270} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.pot} strokeOpacity={0.5} strokeWidth={2} />
          <g clipPath="url(#cur-clip-pot)">
            {(() => {
              const ph = (t * 0.45) % 1;
              const fy = 652 + 112 * ph * ph;
              return <circle cx={1050} cy={fy} r={26} fill="none" stroke={C.pot} strokeWidth={2} strokeDasharray="5 5" opacity={0.5 * cyc(ph)} />;
            })()}
          </g>
          <Glow x={1050} y={652} r={80} color="pot" opacity={0.5 + 0.3 * Math.sin(t * 2.4)} still />
          <line x1={980} y1={680} x2={1120} y2={680} stroke={C.muted} strokeWidth={6} strokeLinecap="round" />
          <line x1={1110} y1={680} x2={1110} y2={790} stroke={C.muted} strokeWidth={4} />
          <circle cx={1050 + 1.5 * Math.sin(t * 3.1)} cy={652} r={26} fill={C.pot} />
          <circle cx={1042 + 1.5 * Math.sin(t * 3.1)} cy={644} r={7} fill="#fff" opacity={0.45} />
          <line x1={800} y1={790} x2={1140} y2={790} stroke={C.muted} strokeWidth={3} />
          <Arrow x1={900} y1={786} x2={900} y2={688} color="pot" width={4} both />
          <Label x={870} y={737} size={28} font="serif" italic color={C.pot}>
            h
          </Label>
          <Label x={960} y={605} size={32} color={C.pot} weight={600}>
            potensial · tersimpan
          </Label>
        </g>
        {/* termal: molekul bergetar */}
        <g opacity={forms[2]}>
          <rect x={1260} y={560} width={460} height={270} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.heat} strokeOpacity={0.5} strokeWidth={2} />
          <Glow x={1490} y={735} r={190} color="heat" opacity={0.35 + 0.1 * Math.sin(t * 3)} />
          {Array.from({length: 15}, (_, i) => {
            const cx = 1330 + (i % 5) * 80;
            const cy = 680 + Math.floor(i / 5) * 55;
            const jx = 9 * Math.sin(t * 13 + i * 2.3);
            const jy = 9 * Math.cos(t * 11 + i * 1.7);
            return (
              <g key={i}>
                <circle cx={cx + jx} cy={cy + jy} r={14} fill={C.heat} opacity={0.85} />
                <circle cx={cx + jx - 4} cy={cy + jy - 4} r={4} fill="#fff" opacity={0.4} />
              </g>
            );
          })}
          <HeatShimmer x1={1290} x2={1690} y={660} t={t} amount={0.5} />
          <Label x={1490} y={605} size={32} color={C.heat} weight={600}>
            termal · getaran molekul
          </Label>
        </g>

        {/* ===== apel 1 joule (baris 7) ===== */}
        <g opacity={apple}>
          <line x1={360} y1={800} x2={900} y2={800} stroke={C.muted} strokeWidth={3} />
          {/* penggaris 1 m */}
          <rect x={420} y={400} width={36} height={400} fill="#fff" opacity={0.04} />
          <line x1={420} y1={800} x2={420} y2={400} stroke={C.ink} strokeWidth={3} />
          {Array.from({length: 11}, (_, i) => (
            <line key={i} x1={420} y1={800 - i * 40} x2={i % 5 === 0 ? 452 : 440} y2={800 - i * 40} stroke={C.ink} strokeWidth={2} />
          ))}
          <Label x={400} y={400} size={26} font="mono" anchor="end" color={C.ink}>
            1 m
          </Label>
          <Label x={400} y={800} size={26} font="mono" anchor="end" color={C.ink}>
            0
          </Label>
          {/* batang Ug yang terisi seiring apel naik */}
          {(() => {
            const bh = 400 * lift;
            const top = 800 - bh;
            const wav = 3 * Math.sin(t * 3.4);
            return (
              <g>
                <rect x={820} y={400} width={44} height={400} rx={8} fill={C.pot} opacity={0.08} stroke={C.pot} strokeOpacity={0.4} strokeWidth={2} />
                {bh > 1 ? <path d={`M820,${top + wav} Q842,${top - wav} 864,${top + wav} V792 Q864,800 856,800 H828 Q820,800 820,792 Z`} fill={C.pot} /> : null}
                <rect x={827} y={Math.min(796, top + 8)} width={7} height={Math.max(0, bh - 16)} rx={3} fill="#fff" opacity={0.18} />
                <Label x={842} y={832} size={30} font="serif" italic color={C.pot} weight={600}>
                  U<TSub>g</TSub>
                </Label>
                <line x1={812} y1={400} x2={872} y2={400} stroke={C.pot} strokeWidth={2} strokeDasharray="5 5" />
                <Label x={884} y={400} size={24} font="mono" anchor="start" color={C.pot} opacity={ramp(t, cue(7) + 3.8, cue(7) + 4.6)}>
                  ≈ 1 J
                </Label>
              </g>
            );
          })()}
          {(() => {
            const ay = 770 - lift * 400;
            return (
              <g>
                <ellipse cx={600} cy={803} rx={34 * (1 - 0.55 * lift)} ry={5} fill="#000" opacity={0.45 * (1 - 0.6 * lift)} />
                <Stream pts={[[624, ay], [720, ay + 30 + 40 * (1 - lift)], [842, 800 - 400 * lift]]} color="pot" n={6} speed={0.9} r={4} jitter={3} opacity={lifting} />
                <Glow x={600} y={ay} r={90} color="pot" opacity={0.35 + 0.5 * lift} />
                {/* tangan yang mengangkat */}
                <path d={`M562,${ay + 26} Q600,${ay + 40} 638,${ay + 24} Q646,${ay + 22} 644,${ay + 32} Q624,${ay + 56} 596,${ay + 56} Q566,${ay + 54} 556,${ay + 36} Q554,${ay + 26} 562,${ay + 26} Z`} fill="#1a2550" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
                <circle cx={600} cy={ay} r={30} fill={C.heat} />
                <circle cx={590} cy={ay - 10} r={8} fill="#fff" opacity={0.35} />
                <path d={`M600,${ay - 28} q6,-18 18,-22`} stroke={C.work} strokeWidth={5} fill="none" strokeLinecap="round" />
                <Arrow x1={680} y1={ay + 40} x2={680} y2={ay - 50} color="force" width={5} />
                <Label x={700} y={ay - 10} size={26} anchor="start" color={C.force}>
                  ≈ 1 N
                </Label>
              </g>
            );
          })()}
          <Ripple x={600} y={370} p={(t - cue(7) - 4.3) / 1.3} r={110} color="pot" />
          <Twinkles x={842} y={400} rx={60} ry={30} n={4} color="pot" opacity={ramp(t, cue(7) + 4.2, cue(7) + 4.8)} seed={6} />
          <Label x={600} y={850} size={24} color={C.muted}>
            apel kecil ≈ 100 g
          </Label>
        </g>

        {/* ===== usaha: perpindahan energi (baris 8) ===== */}
        <g opacity={transfer}>
          {[
            {x: 560, lvl: mix(0.74, 0.34, flowQ), clip: 'cur-A', lab: 'benda A'},
            {x: 1360, lvl: mix(0.26, 0.66, flowQ), clip: 'cur-B', lab: 'benda B'},
          ].map((b, i) => {
            const top = 686 - 172 * b.lvl;
            const wv = 4 * Math.sin(t * 2.6 + i);
            return (
              <g key={b.lab}>
                <Glow x={b.x} y={600} r={170} color="gold" opacity={0.25 + 0.25 * b.lvl} />
                <circle cx={b.x} cy={600} r={90} fill="rgba(10,16,36,0.85)" stroke={C.muted} strokeWidth={3} />
                <g clipPath={`url(#${b.clip})`}>
                  <path d={`M${b.x - 90},${top + wv} Q${b.x - 45},${top - wv * 2} ${b.x},${top + wv} T${b.x + 90},${top + wv} V700 H${b.x - 90} Z`} fill={C.gold} opacity={0.78} />
                  <path d={`M${b.x - 90},${top + wv} Q${b.x - 45},${top - wv * 2} ${b.x},${top + wv} T${b.x + 90},${top + wv}`} fill="none" stroke={C.gold} strokeOpacity={0.8} strokeWidth={2} />
                </g>
                <Label x={b.x} y={600} size={30} color={C.ink}>
                  {b.lab}
                </Label>
              </g>
            );
          })}
          <Arrow x1={670} y1={600} x2={1240} y2={600} color="work" width={6} />
          <Stream pts={[[690, 600], [1230, 600]]} color="work" n={10} speed={0.5} r={5} jitter={14} />
          <Ripple x={1360} y={600} p={(t - cue(8) - 1.6) / 1.5} r={150} color="work" />
          <Label x={960} y={540} size={40} color={C.work} weight={700}>
            usaha
          </Label>
        </g>
      </Stage>

      {/* sumber cerita (baris 0) */}
      <Card x={960} y={232} opacity={win(t, 0.8, cue(1) - 0.2, 0.7, 0.6)} accent={C.muted} style={{padding: '14px 34px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 32, color: C.muted}}>
          cerita <span style={{color: C.ink}}>Richard Feynman</span> · balok mainan
        </div>
      </Card>

      {/* papan hitungan balok */}
      <Card x={960} y={232} opacity={blockScene * ramp(t, cue(1), cue(1) + 0.8)} accent={interpolateColors(ruleGlow, [0, 1], [C.cyan, C.gold])} style={{padding: '14px 34px', boxShadow: `0 0 ${50 * ruleGlow}px rgba(255,201,74,${0.5 * ruleGlow})`}}>
        <div style={{fontFamily: FONT.head, fontSize: 38, fontWeight: 500, display: 'flex', gap: 18, alignItems: 'baseline'}}>
          <span style={{color: C.muted}}>terlihat</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
            <Roll v={visible} color={C.ink} />
          </span>
          <Seg p={ramp(t, cue(2) + 0.3, cue(2) + 1.3)} w={250}>
            <span style={{color: C.muted}}>+ di kotak </span>
            <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
              <Roll v={inBox} color={C.ink} />
            </span>
          </Seg>
          <Seg p={ramp(t, cue(3) + 0.3, cue(3) + 1.3)} w={330}>
            <span style={{color: C.muted}}>+ luar jendela </span>
            <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
              <Roll v={outside} color={C.ink} />
            </span>
          </Seg>
          <span style={{color: C.muted}}>=</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 52, color: C.gold, textShadow: `0 0 ${20 * ruleGlow}px rgba(255,201,74,0.8)`}}>28</span>
        </div>
      </Card>
      <Stage>
        <Twinkles x={960} y={232} rx={420} ry={60} n={7} color="gold" opacity={ruleGlow * blockScene} seed={3} />
      </Stage>

      <Formula x={960} y={380} p={eq} accent={C.gold} size={64} caption="jumlah semua bentuk energi selalu sama">
        <Tint c="kin">
          <V>K</V>
        </Tint>{' '}
        +{' '}
        <Tint c="pot">
          <V>U</V>
        </Tint>{' '}
        +{' '}
        <Tint c="heat">
          <V>E</V>
          <Sub>termal</Sub>
        </Tint>{' '}
        + … = <span style={{color: C.gold}}>tetap</span>
      </Formula>

      <Formula x={1310} y={470} p={apple} accent={C.pot} size={62} caption="usaha mengangkat apel kecil setinggi 1 meter">
        1 J = 1 N × 1 m
      </Formula>
      <Card x={1310} y={680} opacity={apple * ramp(t, cue(7) + 3, cue(7) + 4)} accent={C.muted} style={{padding: '12px 26px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 36}}>
          1 J = 1 kg m<sup style={{fontSize: '0.6em'}}>2</sup> s<sup style={{fontSize: '0.6em'}}>−2</sup>
        </div>
      </Card>
      <Card x={960} y={790} opacity={transfer * ramp(t, cue(8) + 2.5, cue(8) + 3.5)} accent={C.work} style={{padding: '12px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 32}}>energi berpindah lewat gaya yang bekerja sambil berpindah</div>
      </Card>
    </AbsoluteFill>
  );
};
