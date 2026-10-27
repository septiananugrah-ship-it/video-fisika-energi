import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {rand} from '../anim';
import {C, FONT, H, MOOD_TINT, W} from '../theme';
import {TIMELINE} from '../timeline.ts';

const tintAt = (t: number) => {
  const stops: number[] = [];
  const colors: string[] = [];
  TIMELINE.scenes.forEach((s) => {
    stops.push(s.start + 0.01, Math.max(s.start + 0.02, s.end - 1.5));
    colors.push(MOOD_TINT[s.mood], MOOD_TINT[s.mood]);
  });
  return interpolateColors(t, stops, colors);
};

// Kisi cetak biru: garis halus 40 px, garis tebal tiap 200 px. Digeser dalam satu periode (200 px)
// lalu dibungkus, jadi tidak ada loncatan.
const P = 200;
const MINOR = (() => {
  const d: string[] = [];
  for (let x = -P; x <= W + P; x += 40) d.push(`M${x},${-P} V${H + P}`);
  for (let y = -P; y <= H + P; y += 40) d.push(`M${-P},${y} H${W + P}`);
  return d.join(' ');
})();
const MAJOR = (() => {
  const d: string[] = [];
  for (let x = -P; x <= W + P; x += P) d.push(`M${x},${-P} V${H + P}`);
  for (let y = -P; y <= H + P; y += P) d.push(`M${-P},${y} H${W + P}`);
  return d.join(' ');
})();

const DUST = Array.from({length: 46}, (_, i) => ({
  x: rand(i * 3.1) * W,
  y: rand(i * 5.7) * H,
  r: 1 + rand(i * 9.3) * 2.2,
  s: 4 + rand(i * 1.7) * 10,
  ph: rand(i * 2.9) * Math.PI * 2,
  c: [C.kin, C.pot, C.cyan, C.gold][i % 4],
}));

// Rumus "hantu" yang melayang pelan di latar (sangat samar, hanya tekstur hidup).
const GHOSTS = ['E = K + U', 'W = F·s·cos θ', '½ m v²', 'm g h', '½ k x²', 'P = W / t', 'ΔK = W', 'F = −k x'];
const GHOST = GHOSTS.map((txt, i) => ({
  txt,
  y: 120 + ((i * 131) % 840),
  size: 60 + (i % 3) * 26,
  speed: 9 + (i % 4) * 4,
  off: rand(i * 7.7) * (W + 700),
  c: [C.kin, C.pot, C.spr, C.work, C.gold, C.cyan][i % 6],
}));

/** Latar malam biru tinta + kisi cetak biru yang bergeser pelan + debu energi berkelip. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const tint = tintAt(t);
  const shift = (t * 5) % P;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 75% at 50% 42%, ${tint} 0%, ${C.bg} 75%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${-shift} ${-shift * 0.5})`}>
          <path d={MINOR} stroke={C.grid} strokeOpacity={0.45} strokeWidth={1} fill="none" />
          <path d={MAJOR} stroke={C.grid} strokeOpacity={0.95} strokeWidth={1.5} fill="none" />
        </g>
        {/* cincin orbit samar yang berputar pelan di pojok */}
        <g transform={`translate(1780 960) rotate(${t * 3})`} opacity={0.5}>
          <ellipse rx={340} ry={140} fill="none" stroke={C.pot} strokeOpacity={0.14} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" />
          <circle cx={340 * Math.cos(t * 0.35)} cy={140 * Math.sin(t * 0.35)} r={6} fill={C.kin} opacity={0.5} />
        </g>
        <g transform={`translate(120 150) rotate(${-t * 4})`} opacity={0.45}>
          <ellipse rx={250} ry={96} fill="none" stroke={C.cyan} strokeOpacity={0.13} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" />
          <circle cx={-250 * Math.cos(t * 0.45)} cy={-96 * Math.sin(t * 0.45)} r={5} fill={C.cyan} opacity={0.5} />
        </g>
        {/* gelombang energi tipis yang berjalan di bawah & atas */}
        {[0, 1].map((k) => {
          const base = k ? 1010 : 196;
          const pts = Array.from({length: 49}, (_, i) => {
            const x = (i / 48) * W;
            const y = base + 16 * Math.sin(x * 0.006 + t * (k ? 0.7 : -0.55) + k * 2) * Math.sin(x * 0.0017 + t * 0.2);
            return `${i ? 'L' : 'M'}${x.toFixed(0)},${y.toFixed(1)}`;
          }).join(' ');
          return <path key={k} d={pts} fill="none" stroke={k ? C.kin : C.cyan} strokeOpacity={0.07} strokeWidth={2} />;
        })}
        {/* rumus hantu */}
        {GHOST.map((g, i) => {
          const span = W + 700;
          const x = ((((g.off + t * g.speed) % span) + span) % span) - 350;
          const edge = Math.min(1, (x + 350) / 300, (W + 350 - x) / 300);
          return (
            <text key={i} x={x} y={g.y + 10 * Math.sin(t * 0.3 + i)} fontFamily={FONT.serif} fontStyle="italic" fontSize={g.size} fill={g.c} opacity={0.033 * Math.max(0, edge)}>
              {g.txt}
            </text>
          );
        })}
        {DUST.map((d, i) => {
          const y = (((d.y - t * d.s) % H) + H) % H;
          const tw = 0.35 + 0.35 * Math.sin(t * 0.9 + d.ph);
          return <circle key={i} cx={d.x + 14 * Math.sin(t * 0.2 + d.ph)} cy={y} r={d.r} fill={d.c} opacity={tw * Math.min(1, y / 120, (H - y) / 120)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Vinyet gelap di tepi layar. */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 80% at 50% 46%, transparent 60%, rgba(2,4,10,0.55) 100%)'}} />
);
