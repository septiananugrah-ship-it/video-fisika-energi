import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, mix, ramp} from '../anim';
import {Glow, Stage} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Empat batang warna energi (K, Ug, Us, termal) naik berganti tinggi, lalu menyatu
// menjadi satu garis emas: bentuknya berubah, totalnya tetap.
const COLORS = [C.kin, C.pot, C.spr, C.heat];

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.4, 2.4);
  const merge = ramp(t, 4.2, 5.6, EASE_IN_OUT);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const title = BRAND.title;
  // tinggi batang berganti-ganti tetapi jumlahnya tetap
  const total = 360;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={470} r={640} color="gold" opacity={0.35 * a} />
        {/* batang energi bertumpuk di kanan-kiri judul */}
        {[0, 1].map((side) =>
          COLORS.map((c, i) => {
            const vals = COLORS.map((_, k) => 1.2 + Math.sin(t * 1.6 + k * 1.7 + side * 2.1));
            const tot = vals.reduce((x, v) => x + v, 0);
            const h = (vals[i] / tot) * total;
            const y0 = 820 - vals.slice(0, i).reduce((x, v) => x + (v / tot) * total, 0);
            const x = mix(side ? 1560 : 300, side ? 960 + 300 : 960 - 360, merge);
            return <rect key={`${side}-${i}`} x={x} y={y0 - h} width={60} height={Math.max(0, h - 4)} rx={6} fill={c} opacity={ramp(t, 0.6 + i * 0.15, 1.3 + i * 0.15) * (1 - merge)} />;
          }),
        )}
        <g opacity={merge}>
          <rect x={960 - 360 * merge} y={786} width={720 * merge} height={8} rx={4} fill={C.gold} />
          <rect x={960 - 380 * merge} y={778} width={760 * merge} height={24} rx={12} fill={C.gold} opacity={0.15} />
        </g>
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 120}}>
        <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
        <div style={{display: 'flex', marginTop: 18}}>
          {title.split('').map((ch, i) => {
            const p = ramp(t, 0.5 + i * 0.05, 1.3 + i * 0.05, BACK);
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
                  translate: `0px ${(1 - p) * 40}px`,
                  textShadow: i >= 10 ? '0 0 50px rgba(255,138,61,0.45)' : '0 0 40px rgba(120,160,255,0.25)',
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div style={{fontFamily: FONT.head, fontSize: 48, color: C.ink, fontWeight: 500, marginTop: 6, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
        <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.0, 3.0)}}>{BRAND.course}</div>
        <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.gold, marginTop: 120, opacity: merge, letterSpacing: 3}}>bentuknya berubah · totalnya tetap</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
