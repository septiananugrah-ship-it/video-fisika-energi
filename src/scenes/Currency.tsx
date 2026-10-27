import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {Ground} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Spark, Stage, Sub, Tint, V} from '../components/primitives';
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

/** Angka yang berganti dengan silang-pudar (tanpa loncatan). */
const Num: React.FC<{a: number; b: number; p: number; color: string}> = ({a, b, p, color}) => (
  <span style={{position: 'relative', display: 'inline-block', width: '1.3em', textAlign: 'center', color}}>
    <span style={{opacity: 1 - p, position: 'absolute', left: 0, right: 0, translate: `0px ${-p * 14}px`}}>{a}</span>
    <span style={{opacity: p, translate: `0px ${(1 - p) * 14}px`, display: 'inline-block'}}>{b}</span>
  </span>
);

/** Segmen teks yang melebar masuk (lebar & opasitas ikut p). */
const Seg: React.FC<{p: number; w: number; children: React.ReactNode}> = ({p, w, children}) => (
  <span style={{display: 'inline-block', maxWidth: w * p, overflow: 'hidden', whiteSpace: 'nowrap', opacity: p, verticalAlign: 'bottom'}}>{children}</span>
);

const Block: React.FC<{x: number; y: number; c: string; rot?: number; s?: number; o?: number}> = ({x, y, c, rot = 0, s = 1, o = 1}) => (
  <g transform={`translate(${x + BS / 2} ${y + BS / 2}) rotate(${rot}) scale(${s})`} opacity={o}>
    <rect x={-BS / 2} y={-BS / 2} width={BS} height={BS} rx={10} fill={c} fillOpacity={0.22} stroke={c} strokeWidth={3} />
    <rect x={-BS / 2 + 8} y={-BS / 2 + 8} width={BS - 16} height={8} rx={4} fill="#fff" opacity={0.18} />
  </g>
);

export const Currency: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- fase balok (baris 0–4) ----
  const blocksIn = ramp(t, 0.6, 3.2);
  const blockScene = 1 - ramp(t, cue(5) + 0.2, cue(5) + 1.4, EASE_IN_OUT);
  const boxIn = ramp(t, cue(2) - 0.2, cue(2) + 0.8);
  const winIn = ramp(t, cue(3) - 0.2, cue(3) + 0.8);
  const toBox = (k: number) => ramp(t, wordOf(2, 'Ternyata') + k * 0.35, wordOf(2, 'Ternyata') + k * 0.35 + 1.1, EASE_IN_OUT);
  const toOut = (k: number) => ramp(t, cue(3) + 1.6 + k * 0.45, cue(3) + 1.6 + k * 0.45 + 1.3, EASE_IN_OUT);
  const pBox = ramp(t, wordOf(2, 'Ternyata') + 1.0, wordOf(2, 'Ternyata') + 2.6);
  const pOut = ramp(t, cue(3) + 2.6, cue(3) + 4.0);
  const ruleGlow = win(t, cue(4) + 0.3, cue(5), 0.6, 0.6);

  // ---- fase energi (baris 5–8) ----
  const eq = win(t, cue(5) + 0.8, cue(7) - 0.2, 0.8, 0.7);
  const forms = [wordOf(6, 'kinetik'), wordOf(6, 'potensial'), wordOf(6, 'termal')].map((a) => win(t, a - 0.2, cue(7) - 0.2, 0.7, 0.7));
  const apple = win(t, cue(7) + 0.2, cue(8) - 0.1, 0.7, 0.7);
  const lift = ramp(t, cue(7) + 1.4, cue(7) + 4.4, EASE_IN_OUT);
  const transfer = ramp(t, cue(8) + 0.2, cue(8) + 1.0);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== balok ===== */}
        <g opacity={blockScene}>
          <Ground x1={150} x2={1770} y={FLOOR} />
          {/* kotak mainan */}
          <g opacity={boxIn}>
            <path d={`M${BOX.x},${BOX.top} L${BOX.x},${FLOOR} L${BOX.x + BOX.w},${FLOOR} L${BOX.x + BOX.w},${BOX.top}`} fill="#0e1736" stroke={C.muted} strokeWidth={4} />
            <path d={`M${BOX.x},${BOX.top} l-40,-50 M${BOX.x + BOX.w},${BOX.top} l40,-50`} stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
            <Label x={BOX.x + BOX.w / 2} y={BOX.top - 80} size={26} color={C.muted}>
              kotak
            </Label>
          </g>
          {/* dinding & jendela */}
          <g opacity={winIn}>
            <rect x={WIN.x - 30} y={250} width={30 + WIN.w + 30} height={FLOOR - 250} fill="#0c1430" opacity={0.6} />
            <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={6} fill="#13245a" stroke={C.cyan} strokeWidth={4} />
            <line x1={WIN.x + WIN.w / 2} y1={WIN.y} x2={WIN.x + WIN.w / 2} y2={WIN.y + WIN.h} stroke={C.cyan} strokeWidth={3} />
            <line x1={WIN.x} y1={WIN.y + WIN.h / 2} x2={WIN.x + WIN.w} y2={WIN.y + WIN.h / 2} stroke={C.cyan} strokeWidth={3} />
            <Label x={WIN.x + WIN.w / 2} y={WIN.y - 34} size={26} color={C.cyan}>
              jendela
            </Label>
            <Label x={1530} y={FLOOR - 120} size={24} color={C.muted}>
              halaman
            </Label>
          </g>
          {Array.from({length: 28}, (_, i) => {
            const g = gridPos(i);
            const appear = ramp(t, 0.6 + i * 0.07, 1.2 + i * 0.07);
            let x = g.x;
            let y = g.y - (1 - appear) * 40;
            let rot = 0;
            let o = appear * blocksIn;
            if (i >= 23) {
              const k = i - 23;
              const p = toBox(k);
              const b = boxPos(k);
              x = mix(g.x, b.x, p);
              y = mix(g.y, b.y, p) - Math.sin(Math.PI * p) * 220;
              rot = 360 * p * (k % 2 ? 1 : -1) * 0.5;
              o *= 1 - 0.35 * p;
            } else if (i >= 20) {
              const k = i - 20;
              const p = toOut(k);
              const w = {x: WIN.x + WIN.w / 2 - BS / 2, y: WIN.y + WIN.h / 2 - BS / 2};
              const e = outPos(k);
              // lintasan dua bagian: ke jendela, lalu jatuh ke halaman
              const p1 = Math.min(1, p * 1.8);
              const p2 = Math.max(0, (p - 0.55) / 0.45);
              x = p < 0.55 ? mix(g.x, w.x, p1) : mix(w.x, e.x, p2);
              y = p < 0.55 ? mix(g.y, w.y, p1) - Math.sin(Math.PI * p1) * 160 : mix(w.y, e.y, p2 * p2);
              rot = 270 * p * (k % 2 ? 1 : -1);
            }
            return <Block key={i} x={x} y={y} c={COLORS[i % 7]} rot={rot} o={o} />;
          })}
        </g>

        {/* ===== bentuk energi (baris 6) ===== */}
        {/* kinetik: bola melaju */}
        <g opacity={forms[0]}>
          <rect x={200} y={560} width={460} height={270} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.kin} strokeOpacity={0.5} strokeWidth={2} />
          <clipPath id="clip-kin">
            <rect x={200} y={560} width={460} height={270} rx={20} />
          </clipPath>
          <g clipPath="url(#clip-kin)">
            {[0, 0.5].map((off) => {
              const ph = (t * 0.4 + off) % 1;
              const x = 250 + ph * 330;
              const o = cyc(ph);
              return (
                <g key={off} opacity={o}>
                  <Glow x={x} y={720} r={70} color="kin" opacity={0.6} />
                  <circle cx={x} cy={720} r={28} fill={C.kin} />
                  <Arrow x1={x + 36} y1={720} x2={x + 100} y2={720} color="kin" width={5} />
                </g>
              );
            })}
          </g>
          <Label x={430} y={605} size={32} color={C.kin} weight={600}>
            kinetik · gerak
          </Label>
        </g>
        {/* potensial: bola di rak */}
        <g opacity={forms[1]}>
          <rect x={730} y={560} width={460} height={270} rx={20} fill="rgba(10,16,36,0.7)" stroke={C.pot} strokeOpacity={0.5} strokeWidth={2} />
          <line x1={980} y1={680} x2={1120} y2={680} stroke={C.muted} strokeWidth={6} strokeLinecap="round" />
          <circle cx={1050} cy={652} r={26} fill={C.pot} />
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
          {Array.from({length: 15}, (_, i) => {
            const cx = 1330 + (i % 5) * 80;
            const cy = 680 + Math.floor(i / 5) * 55;
            const jx = 9 * Math.sin(t * 13 + i * 2.3);
            const jy = 9 * Math.cos(t * 11 + i * 1.7);
            return <circle key={i} cx={cx + jx} cy={cy + jy} r={14} fill={C.heat} opacity={0.85} />;
          })}
          <Label x={1490} y={605} size={32} color={C.heat} weight={600}>
            termal · getaran molekul
          </Label>
        </g>

        {/* ===== apel 1 joule (baris 7) ===== */}
        <g opacity={apple}>
          <line x1={360} y1={800} x2={760} y2={800} stroke={C.muted} strokeWidth={3} />
          {/* penggaris 1 m */}
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
          {(() => {
            const ay = 770 - lift * 400;
            return (
              <g>
                <Glow x={600} y={ay} r={90} color="pot" opacity={0.35 + 0.5 * lift} />
                <circle cx={600} cy={ay} r={30} fill={C.heat} />
                <path d={`M600,${ay - 28} q6,-18 18,-22`} stroke={C.work} strokeWidth={5} fill="none" strokeLinecap="round" />
                <Arrow x1={680} y1={ay + 40} x2={680} y2={ay - 50} color="force" width={5} />
                <Label x={700} y={ay - 10} size={26} anchor="start" color={C.force}>
                  ≈ 1 N
                </Label>
              </g>
            );
          })()}
          <Label x={600} y={850} size={24} color={C.muted}>
            apel kecil ≈ 100 g
          </Label>
        </g>

        {/* ===== usaha: perpindahan energi (baris 8) ===== */}
        <g opacity={transfer}>
          <circle cx={560} cy={600} r={90} fill="rgba(10,16,36,0.8)" stroke={C.muted} strokeWidth={3} />
          <Label x={560} y={600} size={30} color={C.ink}>
            benda A
          </Label>
          <circle cx={1360} cy={600} r={90} fill="rgba(10,16,36,0.8)" stroke={C.muted} strokeWidth={3} />
          <Label x={1360} y={600} size={30} color={C.ink}>
            benda B
          </Label>
          <Arrow x1={670} y1={600} x2={1240} y2={600} color="work" width={6} />
          {Array.from({length: 7}, (_, i) => {
            const ph = (t * 0.5 + i / 7) % 1;
            return <Spark key={i} x={mix(680, 1230, ph)} y={600 + 16 * Math.sin(ph * Math.PI * 2 + i)} r={6} color="work" opacity={Math.min(1, ph * 6) * (1 - ph) * transfer} />;
          })}
          <Label x={960} y={540} size={40} color={C.work} weight={700}>
            usaha
          </Label>
        </g>
      </Stage>

      {/* papan hitungan balok */}
      <Card x={960} y={232} opacity={blockScene * ramp(t, cue(1), cue(1) + 0.8)} accent={interpolateColors(ruleGlow, [0, 1], [C.cyan, C.gold])} style={{padding: '14px 34px', boxShadow: `0 0 ${50 * ruleGlow}px rgba(255,201,74,${0.5 * ruleGlow})`}}>
        <div style={{fontFamily: FONT.head, fontSize: 38, fontWeight: 500, display: 'flex', gap: 18, alignItems: 'baseline'}}>
          <span style={{color: C.muted}}>terlihat</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
            <Num a={pOut > 0 ? 23 : 28} b={pOut > 0 ? 20 : 23} p={pOut > 0 ? pOut : pBox} color={C.ink} />
          </span>
          <Seg p={ramp(t, cue(2) + 0.3, cue(2) + 1.3)} w={250}>
            <span style={{color: C.muted}}>+ di kotak </span>
            <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
              <Num a={0} b={5} p={pBox} color={C.ink} />
            </span>
          </Seg>
          <Seg p={ramp(t, cue(3) + 0.3, cue(3) + 1.3)} w={330}>
            <span style={{color: C.muted}}>+ luar jendela </span>
            <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 44}}>
              <Num a={0} b={3} p={pOut} color={C.ink} />
            </span>
          </Seg>
          <span style={{color: C.muted}}>=</span>
          <span style={{fontFamily: FONT.mono, fontWeight: 600, fontSize: 52, color: C.gold}}>28</span>
        </div>
      </Card>

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
      <Card x={960} y={760} opacity={transfer * ramp(t, cue(8) + 2.5, cue(8) + 3.5)} accent={C.work} style={{padding: '12px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 32}}>energi berpindah lewat gaya yang bekerja sambil berpindah</div>
      </Card>
    </AbsoluteFill>
  );
};
