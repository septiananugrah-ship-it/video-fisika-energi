import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Spring} from '../components/physics';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Enam kartu rangkuman (satu per baris narasi 1–6), lalu pertanyaan kunci.
// Tiap kartu punya animasi mini yang terus berputar di pita bawahnya.
const SW = 444; // lebar pita animasi mini
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;

/** 01 · Energi: tiga bentuk energi bertukar, panjang total tetap. */
const MiniEnergy: React.FC<{t: number}> = ({t}) => {
  const s = Math.sin(t * 1.4);
  const K = 0.42 + 0.26 * s;
  const U = 0.43 - 0.26 * s;
  const E = 0.15;
  const L = 330;
  const x0 = 56;
  const segs = [
    {v: K, c: C.kin},
    {v: U, c: C.pot},
    {v: E, c: C.heat},
  ];
  let acc = x0;
  const by = 22;
  // bola mini berayun di lintasan U (K ↔ U)
  const a = Math.asin(Math.max(-1, Math.min(1, s))) * 0.9;
  const bx = 24 + 14 * Math.sin(a);
  const byy = 34 - 10 * Math.cos(a) + 10;
  return (
    <g>
      <path d="M8,30 Q24,56 40,30" fill="none" stroke={C.muted} strokeWidth={2} />
      <circle cx={bx} cy={byy - 5} r={5} fill={C.gold} />
      {segs.map((sg, i) => {
        const w = sg.v * L;
        const r = <rect key={i} x={acc} y={by} width={Math.max(0, w - 2)} height={20} rx={4} fill={sg.c} />;
        acc += w;
        return r;
      })}
      <rect x={x0} y={by + 2} width={L} height={5} rx={2.5} fill="#fff" opacity={0.18} />
      <rect x={x0 - 4} y={by - 5} width={L + 6} height={30} rx={7} fill="none" stroke={C.ink} strokeWidth={2} strokeDasharray="7 5" strokeDashoffset={-t * 18} opacity={0.75} />
      <text x={x0 + L + 14} y={by + 11} dominantBaseline="central" fontFamily={FONT.mono} fontSize={16} fill={C.muted}>
        tetap
      </text>
    </g>
  );
};

/** 02 · Usaha: balok ditarik gaya miring, perpindahan hijau bertambah. */
const MiniWork: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 3.4);
  const x = 60 + 270 * (p * p * 0.5 + p * 0.5);
  const fy = 50;
  return (
    <g>
      <line x1={20} y1={fy} x2={424} y2={fy} stroke={C.muted} strokeWidth={2} />
      <g opacity={cyc(p)}>
        <line x1={60} y1={fy + 9} x2={x} y2={fy + 9} stroke={C.work} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arrow-work)" />
        <rect x={x - 22} y={fy - 26} width={44} height={26} rx={5} fill="url(#crate)" stroke={C.pot} strokeWidth={2} />
        <line x1={x + 22} y1={fy - 13} x2={x + 62} y2={fy - 36} stroke={C.force} strokeWidth={4} strokeLinecap="round" markerEnd="url(#arrow-force)" />
        <path d={`M${x + 44},${fy - 13} A20,20 0 0 0 ${x + 39},${fy - 25}`} fill="none" stroke={C.muted} strokeWidth={1.5} />
      </g>
    </g>
  );
};

/** 03 · Energi kinetik: bola makin cepat, batang K ∝ v². */
const MiniKinetic: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 3);
  const v = p; // kelajuan naik linear
  const x = 30 + 300 * p * p;
  const kH = 44 * v * v;
  return (
    <g>
      <line x1={20} y1={54} x2={350} y2={54} stroke={C.muted} strokeWidth={2} />
      <g opacity={cyc(p)}>
        {[0, 1].map((k) => (
          <line key={k} x1={x - 16} y1={38 + 9 * k} x2={x - 16 - 40 * v} y2={38 + 9 * k} stroke={C.kin} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
        ))}
        <circle cx={x} cy={42} r={12} fill={C.kin} />
        <line x1={x} y1={42} x2={x + 10 * Math.cos(p * 30)} y2={42 + 10 * Math.sin(p * 30)} stroke="#fff" strokeWidth={2} opacity={0.6} />
        <line x1={x + 16} y1={22} x2={x + 26 + 50 * v} y2={22} stroke={C.kin} strokeWidth={3} strokeLinecap="round" markerEnd="url(#arrow-kin)" opacity={v > 0.05 ? 1 : v * 20} />
      </g>
      <rect x={384} y={8} width={28} height={46} rx={5} fill={C.kin} opacity={0.12} />
      <rect x={384} y={54 - kH * cyc(p) ** 0.3} width={28} height={kH * cyc(p) ** 0.3} rx={5} fill={C.kin} />
      <text x={398} y={64} textAnchor="middle" dominantBaseline="hanging" fontFamily={FONT.serif} fontStyle="italic" fontSize={14} fill={C.kin}>
        K
      </text>
    </g>
  );
};

/** 04 · Energi potensial: bola memantul (Ug) + pegas berosilasi (Us). */
const MiniPotential: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 1.4);
  const hgt = 1 - (2 * p - 1) ** 2; // parabola jatuh-bebas
  const by = 54 - 8 - 38 * hgt;
  const xs = Math.sin(t * 3.2);
  const xb = 330 + 34 * xs;
  return (
    <g>
      <line x1={20} y1={56} x2={150} y2={56} stroke={C.muted} strokeWidth={2} />
      <circle cx={70} cy={by} r={8} fill={C.pot} />
      <ellipse cx={70} cy={57} rx={10 * (0.5 + 0.5 * (1 - hgt))} ry={2.5} fill="#000" opacity={0.4} />
      <rect x={110} y={56 - 44 * hgt} width={18} height={44 * hgt} rx={4} fill={C.pot} />
      <line x1={196} y1={10} x2={196} y2={56} stroke={C.muted} strokeWidth={3} />
      <line x1={196} y1={56} x2={424} y2={56} stroke={C.muted} strokeWidth={2} />
      <Spring xa={196} xb={xb - 18} y={40} coils={7} amp={9} width={3} />
      <rect x={xb - 18} y={26} width={36} height={30} rx={5} fill="url(#crate)" stroke={C.spr} strokeWidth={2} />
      <rect x={400} y={56 - 44 * xs * xs} width={18} height={44 * xs * xs} rx={4} fill={C.spr} />
    </g>
  );
};

/** 05 · Gesekan: balok melambat lalu berhenti, lantai memanas. */
const MiniFriction: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 3.6);
  const u = Math.min(1, p / 0.75);
  const x = 50 + 260 * (1 - (1 - u) * (1 - u));
  const heat = u;
  const hatch: string[] = [];
  for (let xx = 24; xx < 424; xx += 16) hatch.push(`M${xx},${54} l-8,10`);
  return (
    <g>
      <path d={hatch.join(' ')} stroke={C.faint} strokeWidth={1.5} />
      <line x1={20} y1={54} x2={424} y2={54} stroke={C.muted} strokeWidth={2} />
      <g opacity={cyc(p)}>
        <rect x={50} y={51} width={Math.max(0, x - 50)} height={4} rx={2} fill={C.heat} opacity={0.7 * heat} />
        <circle cx={x} cy={54} r={34} fill="url(#soft-heat)" opacity={heat} />
        {[0, 1, 2].map((k) => {
          const q = ph(t, 0.9, k * 0.3);
          return <path key={k} d={`M${x - 20 + 20 * k},${48 - 30 * q} q4,-5 0,-10 q-4,-5 0,-10`} fill="none" stroke={C.heat} strokeWidth={2} opacity={cyc(q) * heat} />;
        })}
        {[0, 1].map((k) => (
          <line key={k} x1={x - 30} y1={36 + 10 * k} x2={x - 30 - 36 * (1 - u)} y2={36 + 10 * k} stroke={C.kin} strokeWidth={2.5} strokeLinecap="round" opacity={0.6 * (1 - u)} />
        ))}
        <rect x={x - 22} y={28} width={44} height={26} rx={5} fill="url(#crate)" stroke={C.kin} strokeWidth={2} />
      </g>
    </g>
  );
};

/** 06 · Daya: energi sama, waktu beda — yang cepat dayanya besar. */
const MiniPower: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 4);
  const fast = Math.min(1, p / 0.25);
  const slow = Math.min(1, p / 0.75);
  const L = 300;
  const rows = [
    {y: 10, v: fast, lab: 'cepat'},
    {y: 36, v: slow, lab: 'lambat'},
  ];
  return (
    <g>
      {rows.map((r, i) => (
        <g key={i}>
          <rect x={20} y={r.y} width={L} height={16} rx={8} fill={C.cyan} opacity={0.12} />
          <g opacity={cyc(p)}>
            <rect x={20} y={r.y} width={L * r.v} height={16} rx={8} fill={C.cyan} opacity={i ? 0.6 : 1} />
            <circle cx={20 + L * r.v} cy={r.y + 8} r={9} fill="url(#soft-cyan)" opacity={1 - 0.7 * r.v} />
          </g>
          <text x={334} y={r.y + 8} dominantBaseline="central" fontFamily={FONT.mono} fontSize={15} fill={i ? C.muted : C.cyan}>
            {r.lab}
          </text>
        </g>
      ))}
      <path d="M410,8 L398,32 L408,32 L402,56 L420,26 L410,26 Z" fill={C.cyan} opacity={0.4 + 0.5 * Math.sin(t * 6) ** 2} />
    </g>
  );
};

const ITEMS: {title: string; color: string; hue: 'gold' | 'work' | 'kin' | 'pot' | 'heat' | 'cyan'; body: React.ReactNode; Mini: React.FC<{t: number}>}[] = [
  {title: 'Energi', color: C.gold, hue: 'gold', body: <span>K + U + E<Sub>th</Sub> = tetap</span>, Mini: MiniEnergy},
  {
    title: 'Usaha',
    color: C.work,
    hue: 'work',
    body: (
      <span>
        <V>W</V> = <V>F s</V> cos <V>θ</V>
      </span>
    ),
    Mini: MiniWork,
  },
  {
    title: 'Energi kinetik',
    color: C.kin,
    hue: 'kin',
    body: (
      <span>
        <V>W</V>
        <Sub>tot</Sub> = Δ<V>K</V>, &nbsp;<V>K</V> = <Frac n="1" d="2" />
        <V>mv</V>
        <Sup>2</Sup>
      </span>
    ),
    Mini: MiniKinetic,
  },
  {
    title: 'Energi potensial',
    color: C.pot,
    hue: 'pot',
    body: (
      <span>
        <V>mgy</V> &nbsp;·&nbsp; <Frac n="1" d="2" />
        <V>kx</V>
        <Sup>2</Sup>
      </span>
    ),
    Mini: MiniPotential,
  },
  {title: 'Gesekan', color: C.heat, hue: 'heat', body: <span>mekanik → termal</span>, Mini: MiniFriction},
  {
    title: 'Daya',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V>P</V> = <Frac n={<V>W</V>} d={<V>t</V>} /> = <V>Fv</V>
      </span>
    ),
    Mini: MiniPower,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue} = useScene();
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(7) + 0.2, cue(7) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(7), cue(7) + 1.0, EASE_IN_OUT);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={40} color="gold" opacity={0.35} seed={5} />
        {/* slot kartu kosong yang berdenyut bergiliran sebelum kartunya muncul */}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, cue(i + 1) - 0.2, cue(i + 1) + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, cue(i + 1), cue(i + 2), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - cue(i + 1) - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        {/* pertanyaan kunci: energi datang (hijau) dan pergi (merah) */}
        <g opacity={q}>
          <Stream
            pts={[
              [100, 795],
              [200, 795],
              [300, 795],
            ]}
            color="work"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1620, 795],
              [1720, 795],
              [1820, 795],
            ]}
            color="heat"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={795} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const act = win(t, cue(i + 1), cue(i + 2), 0.5, 0.6);
        const mini = ramp(t, cue(i + 1) + 0.4, cue(i + 1) + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dim,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: 44, marginTop: 10, whiteSpace: 'nowrap', textAlign: 'center', height: 76, lineHeight: '76px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 4, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
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
