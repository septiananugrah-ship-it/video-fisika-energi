import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp} from '../anim';
import {Frac, Sub, Sup, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Enam kartu rangkuman (satu per baris narasi 1–6), lalu pertanyaan kunci.
const ITEMS: {title: string; color: string; body: React.ReactNode}[] = [
  {title: 'Energi', color: C.gold, body: <span>K + U + E<Sub>th</Sub> = tetap</span>},
  {
    title: 'Usaha',
    color: C.work,
    body: (
      <span>
        <V>W</V> = <V>F s</V> cos <V>θ</V>
      </span>
    ),
  },
  {
    title: 'Energi kinetik',
    color: C.kin,
    body: (
      <span>
        <V>W</V>
        <Sub>tot</Sub> = Δ<V>K</V>, &nbsp;<V>K</V> = <Frac n="1" d="2" />
        <V>mv</V>
        <Sup>2</Sup>
      </span>
    ),
  },
  {
    title: 'Energi potensial',
    color: C.pot,
    body: (
      <span>
        <V>mgy</V> &nbsp;·&nbsp; <Frac n="1" d="2" />
        <V>kx</V>
        <Sup>2</Sup>
      </span>
    ),
  },
  {title: 'Gesekan', color: C.heat, body: <span>mekanik → termal</span>},
  {
    title: 'Daya',
    color: C.cyan,
    body: (
      <span>
        <V>P</V> = <Frac n={<V>W</V>} d={<V>t</V>} /> = <V>Fv</V>
      </span>
    ),
  },
];

const COLS = [400, 960, 1520];
const ROWS = [330, 600];

export const Recap: React.FC = () => {
  const {t, cue} = useScene();
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(7) + 0.2, cue(7) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(7), cue(7) + 1.0, EASE_IN_OUT);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8, color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - 105,
              width: 500,
              height: 210,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}55`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 30px ${it.color}22`,
              padding: '22px 28px',
              opacity: Math.min(1, p) * dim,
              scale: String(0.9 + 0.1 * p),
              color: C.ink,
            }}
          >
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: 50, marginTop: 22, whiteSpace: 'nowrap', textAlign: 'center'}}>{it.body}</div>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 760,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 54,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
        }}
      >
        Dari mana energinya <span style={{color: C.work}}>datang</span>, ke mana ia <span style={{color: C.heat}}>pergi</span>?
      </div>
    </AbsoluteFill>
  );
};
