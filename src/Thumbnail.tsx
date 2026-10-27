import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from './brand';
import {C, FONT} from './theme';

/** Gambar mini 2K untuk YouTube/LMS. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 30% 40%, #20305e 0%, ${C.bg} 70%)`, fontFamily: FONT.head}}>
    <div style={{position: 'absolute', left: 140, top: 180, color: C.gold, fontSize: 54, letterSpacing: 10, fontWeight: 600}}>{BRAND.series.toUpperCase()}</div>
    <div style={{position: 'absolute', left: 130, top: 270, color: C.ink, fontSize: 200, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6}}>
      Mata Uang
      <br />
      <span style={{color: C.kin}}>Semesta</span>
    </div>
    <div style={{position: 'absolute', left: 140, top: 760, color: C.muted, fontSize: 70, fontWeight: 500}}>{BRAND.subtitle}</div>
    <div style={{position: 'absolute', left: 140, bottom: 140, color: C.ink, fontSize: 44, letterSpacing: 8, fontWeight: 600}}>
      {BRAND.channel} <span style={{color: C.muted, letterSpacing: 2, fontWeight: 400}}>· {BRAND.tagline}</span>
    </div>
    <svg width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1700 + i * 170} y={1100 - [520, 300, 140, 700][i]} width={120} height={[520, 300, 140, 700][i]} rx={14} fill={[C.kin, C.pot, C.heat, 'none'][i]} stroke={i === 3 ? C.ink : 'none'} strokeWidth={6} strokeDasharray={i === 3 ? '20 14' : undefined} />
      ))}
    </svg>
  </AbsoluteFill>
);
