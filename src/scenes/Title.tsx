import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp} from '../anim';
import {Glow, Ripple, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Empat batang warna energi (K, Ug, Us, termal) naik berganti tinggi, lalu menyatu
// menjadi satu garis emas: bentuknya berubah, totalnya tetap.
// Butir energi berwarna mengorbit judul, mengalir ke tumpukan batang, lalu ikut tersedot ke garis emas.
const COLORS = [C.kin, C.pot, C.spr, C.heat];
const HUE: Hue[] = ['kin', 'pot', 'spr', 'heat'];
const BASE = 862;
const TOTAL = 320;
const NP = 22;

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.4, 2.4);
  const merge = ramp(t, 4.2, 5.6, EASE_IN_OUT);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const title = BRAND.title;
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const flare = ramp(t, 0.5, 1.6) * (0.75 + 0.25 * Math.sin(t * 1.7));
  const orbitIn = ramp(t, 0.3, 1.6);
  const stackX = (side: number) => mix(side ? 1560 : 300, side ? 960 + 300 : 960 - 360, merge);

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="title-flare" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={C.gold} stopOpacity={0} />
              <stop offset="50%" stopColor="#fff2cc" stopOpacity={0.5} />
              <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="title-frame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b2856" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#1b2856" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <Glow x={960} y={470} r={640} color="gold" opacity={0.35 * a} />
          <Glow x={960} y={790} r={360} color="gold" opacity={0.5 * merge} />
          {/* pendar lebar di belakang judul */}
          <ellipse cx={960} cy={390} rx={700 * flare} ry={90} fill="url(#title-flare)" opacity={0.22 * flare} />
          {/* cincin orbit samar */}
          <ellipse cx={960} cy={470} rx={790} ry={320} fill="none" stroke={C.gold} strokeOpacity={0.08 * orbitIn * (1 - merge)} strokeWidth={2} strokeDasharray="3 14" strokeDashoffset={-t * 30} />

          {/* tumpukan batang di kanan-kiri judul: tinggi tiap warna berganti, total tetap */}
          {[0, 1].map((side) => {
            const x = stackX(side);
            const vals = COLORS.map((_, k) => 1.2 + Math.sin(t * 1.6 + k * 1.7 + side * 2.1));
            const tot = vals.reduce((s, v) => s + v, 0);
            let acc = 0;
            const fr = ramp(t, 0.5, 1.2) * (1 - merge);
            return (
              <g key={side}>
                <rect x={x - 10} y={BASE - TOTAL - 16} width={80} height={TOTAL + 26} rx={12} fill="url(#title-frame)" stroke={C.line} strokeWidth={2} opacity={fr} />
                {COLORS.map((c, i) => {
                  const h = (vals[i] / tot) * TOTAL;
                  const y0 = BASE - acc;
                  acc += h;
                  const op = ramp(t, 0.6 + i * 0.15, 1.3 + i * 0.15) * (1 - merge);
                  return (
                    <g key={i} opacity={op}>
                      <rect x={x} y={y0 - h} width={60} height={Math.max(0, h - 4)} rx={6} fill={c} />
                      <rect x={x + 7} y={y0 - h + 5} width={7} height={Math.max(0, h - 14)} rx={3.5} fill="#fff" opacity={0.18} />
                    </g>
                  );
                })}
                {/* garis total tetap */}
                <line x1={x - 18} y1={BASE - TOTAL - 4} x2={x + 78} y2={BASE - TOTAL - 4} stroke={C.gold} strokeWidth={3} strokeDasharray="8 6" strokeDashoffset={-t * 20} opacity={fr} />
              </g>
            );
          })}

          {/* butir energi: mengorbit judul lalu mengalir ke tumpukan; saat menyatu tersedot ke garis emas */}
          {Array.from({length: NP}, (_, i) => {
            const k = i % 4;
            const side = i % 2;
            const ph = (((t * 0.16 + i / NP) % 1) + 1) % 1;
            // orbit elips
            const ang = ph * Math.PI * 2 + (side ? Math.PI : 0) * 0.15;
            const ox = 960 + 790 * Math.cos(ang);
            const oy = 470 + 320 * Math.sin(ang);
            // sebagian waktu meluncur masuk ke puncak tumpukan terdekat
            const dive = Math.max(0, Math.sin(ang * 2 + i)) ** 6;
            const sx = stackX(ox > 960 ? 1 : 0) + 30;
            const sy = BASE - TOTAL * 0.5;
            let x = mix(ox, sx, dive * 0.55);
            let y = mix(oy, sy, dive * 0.55);
            // menyatu: spiral ke garis emas
            const m = merge;
            const lx = 960 + 340 * Math.cos(ang * 1.5 + t);
            x = mix(x, lx, m);
            y = mix(y, 790 + 6 * Math.sin(ang * 3 + t * 2), m);
            const tr: [number, number][] = [1, 2, 3].map((j) => {
              const a2 = ang - j * 0.05;
              return [mix(960 + 790 * Math.cos(a2), lx, m), mix(470 + 320 * Math.sin(a2), 790, m)] as [number, number];
            });
            const op = orbitIn * (0.35 + 0.65 * cyc((ph * 3 + i * 0.13) % 1)) * (1 - 0.4 * m);
            return (
              <g key={i}>
                <Spark x={x} y={y} r={4 + (i % 3)} color={HUE[k]} opacity={op * (1 - m)} trail={tr} />
                <Spark x={x} y={y} r={4 + (i % 3)} color="gold" opacity={op * m} />
              </g>
            );
          })}
          {/* butir emas yang muncul bersama garis */}
          {Array.from({length: 10}, (_, i) => {
            const ph = (((t * 0.4 + i / 10) % 1) + 1) % 1;
            return <Spark key={`g${i}`} x={960 - 360 + 720 * ph} y={790 + 4 * Math.sin(t * 3 + i)} r={4} color="gold" opacity={merge * cyc(ph)} />;
          })}

          <g opacity={merge}>
            <rect x={960 - 360 * merge} y={786} width={720 * merge} height={8} rx={4} fill={C.gold} />
            <rect x={960 - 380 * merge} y={778} width={760 * merge} height={24} rx={12} fill={C.gold} opacity={0.15} />
            {/* kilau merambat di garis emas */}
            <circle cx={960 - 340 + 680 * ((t * 0.35) % 1)} cy={790} r={18} fill="url(#soft-white)" opacity={cyc((t * 0.35) % 1)} />
          </g>
          <Ripple x={960} y={790} p={(t - 5.3) / 1.6} r={300} color="gold" />
          <Twinkles x={960} y={790} rx={380} ry={40} n={7} color="gold" opacity={ramp(t, 5.4, 6.2)} seed={8} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 120}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.05, 1.3 + i * 0.05, BACK);
              const bob = 3 * Math.sin(t * 1.4 - i * 0.35) * ramp(t, 1.6, 2.6);
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT.head,
                    fontWeight: 700,
                    fontSize: 150,
                    letterSpacing: -4,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                    color: i >= 10 ? C.kin : C.ink,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 40 + bob}px`,
                    textShadow: i >= 10 ? `0 0 ${44 + 14 * Math.sin(t * 2 + i * 0.4)}px rgba(255,138,61,0.5)` : '0 0 40px rgba(120,160,255,0.25)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{fontFamily: FONT.head, fontSize: 48, color: C.ink, fontWeight: 500, marginTop: 6, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
          <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.0, 3.0)}}>{BRAND.course}</div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.gold, marginTop: 120, opacity: merge, letterSpacing: 3 + 2 * (1 - merge)}}>bentuknya berubah · totalnya tetap</div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
