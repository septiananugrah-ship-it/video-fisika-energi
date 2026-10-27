import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, ramp} from '../anim';
import {Glow, Motes, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (bab 7–8)',
  'F. J. Bueche, Schaum’s Outline of College Physics',
  'A. G. Sarojo, Seri Fisika Dasar: Mekanika',
  'R. P. Feynman, The Feynman Lectures on Physics, Vol. I, bab 4',
  'P. Atkins & J. de Paula, Physical Chemistry (konstanta gaya HCl, energi ikatan)',
  'Modul Fisika Umum 03: Usaha dan Energi',
];

// partikel energi yang mengorbit logo (warna = kode bentuk energi)
const ORBIT: {hue: Hue; ph: number; sp: number}[] = [
  {hue: 'kin', ph: 0, sp: 0.55},
  {hue: 'pot', ph: 1.26, sp: 0.55},
  {hue: 'spr', ph: 2.51, sp: 0.55},
  {hue: 'heat', ph: 3.77, sp: 0.55},
  {hue: 'work', ph: 5.03, sp: 0.55},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

/** Motif batang energi kecil: bentuk energi bertukar terus, jumlahnya tetap. */
const BarMotif: React.FC<{x: number; y: number; t: number; seed: number; opacity: number}> = ({x, y, t, seed, opacity}) => {
  const s1 = Math.sin(t * 0.9 + seed);
  const s2 = Math.sin(t * 0.6 + seed * 2);
  const vals: {v: number; c: string}[] = [
    {v: 0.5 + 0.32 * s1, c: C.kin},
    {v: 0.5 - 0.32 * s1 + 0.2 * s2, c: C.pot},
    {v: 0.45 - 0.2 * s2, c: C.spr},
    {v: 0.3, c: C.heat},
  ];
  const H = 170;
  const bw = 34;
  const gap = 18;
  return (
    <g opacity={opacity}>
      <line x1={x - 10} y1={y} x2={x + 4 * bw + 3 * gap + 10} y2={y} stroke={C.muted} strokeWidth={2} opacity={0.6} />
      {vals.map((b, i) => {
        const bx = x + i * (bw + gap);
        const h = b.v * H;
        const top = y - h;
        const wave = Array.from({length: 5}, (_, k) => `${k ? 'L' : 'M'}${(bx + (bw * k) / 4).toFixed(1)},${(top + 2.5 * Math.sin(t * 3 + k * 1.1 + i)).toFixed(1)}`).join(' ');
        return (
          <g key={i}>
            <rect x={bx} y={y - H} width={bw} height={H} rx={6} fill={b.c} opacity={0.07} />
            <path d={`${wave} L${bx + bw},${y} L${bx},${y} Z`} fill={b.c} opacity={0.85} />
            <path d={wave} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.5} />
          </g>
        );
      })}
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan seri berikutnya. */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const next = ramp(t, 6, 7);
  const motif = ramp(t, 1.0, 3.0);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  const orbitOn = ramp(t, 0.8, 2.2);
  const pts = ORBIT.map((o) => {
    const a = o.ph + t * o.sp;
    const trail = [1, 2, 3, 4, 5].map((k) => orbitPt(a - k * 0.07));
    return {o, a, p: orbitPt(a), trail, front: Math.sin(a) > 0};
  });
  const ring = (front: boolean) =>
    pts
      .filter((q) => q.front === front)
      .map((q) => <Spark key={q.o.hue} x={q.p[0]} y={q.p[1]} r={5.25 + 1.25 * Math.sin(q.a)} color={q.o.hue} trail={q.trail} opacity={orbitOn * (0.8 + 0.2 * Math.sin(q.a))} />);
  const ellipseD = (() => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt((i / 48) * Math.PI * 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={240} r={440} color="cyan" opacity={0.35 * logo} />
        <Glow x={960} y={188} r={200} color="gold" opacity={0.25 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={46} color="gold" opacity={0.5 * logo} seed={13} />
        <Motes x={960} y={760} rx={820} ry={200} n={30} color="cyan" opacity={0.3 * logo} seed={21} />
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <BarMotif x={150} y={860} t={t} seed={0.3} opacity={0.38 * motif} />
        <BarMotif x={1590} y={860} t={t} seed={2.1} opacity={0.38 * motif} />
        <Twinkles x={960} y={530} rx={360} ry={30} n={4} color="gold" opacity={by * 0.7} seed={17} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{
            width: 230,
            height: 230,
            opacity: logo,
            scale: String((0.85 + 0.15 * logo) * (1 + 0.015 * Math.sin(t * 1.3))),
            rotate: `${(1 - logo) * -20}deg`,
          }}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.cyan}55`}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2, translate: `0px ${(1 - by) * 12}px`}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10, opacity: ramp(t, 3.4, 4.2)}}>RUJUKAN</div>
          {REFS.map((r, i) => {
            const o = ramp(t, 3.7 + i * 0.22, 4.6 + i * 0.22);
            return (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55, opacity: o, translate: `0px ${(1 - o) * 10}px`}}>
                {r}
              </div>
            );
          })}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 18, color: C.faint, opacity: ramp(t, 5.2, 6.0)}}>
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
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.pot}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.pot}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
