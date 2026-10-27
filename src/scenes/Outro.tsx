import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, ramp} from '../anim';
import {Glow, Stage} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (bab 7–8)',
  'F. J. Bueche, Schaum’s Outline of College Physics',
  'A. G. Sarojo, Seri Fisika Dasar: Mekanika',
  'R. P. Feynman, The Feynman Lectures on Physics, Vol. I, bab 4',
  'P. Atkins & J. de Paula, Physical Chemistry (konstanta gaya HCl, energi ikatan)',
  'Modul Fisika Umum 03: Usaha dan Energi',
];

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan seri berikutnya. */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const refs = ramp(t, 3.6, 4.8);
  const next = ramp(t, 6, 7);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={260} r={420} color="cyan" opacity={0.35 * logo} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{width: 230, height: 230, opacity: logo, scale: String(0.85 + 0.15 * logo), rotate: `${(1 - logo) * -20}deg`}}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16, color: C.ink, marginTop: 4, opacity: name}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center', opacity: refs}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10}}>RUJUKAN</div>
          {REFS.map((r) => (
            <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55}}>
              {r}
            </div>
          ))}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 18, color: C.faint}}>
            Ilustrasi skematis · g = 10 m/s² seperti modul · contoh angka dari modul dan sumber di atas
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            fontFamily: FONT.head,
            fontSize: 30,
            color: C.ink,
            opacity: next,
            padding: '10px 28px',
            borderRadius: 999,
            border: `2px solid ${C.pot}`,
            background: 'rgba(10,16,36,0.85)',
          }}
        >
          <span style={{color: C.pot}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
