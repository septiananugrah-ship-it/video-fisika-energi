import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, H, HUES, type Hue, W} from '../theme';

/** Detik global film (untuk gerak hiasan yang terus berjalan). */
const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};
const cycOp = (ph: number) => Math.min(1, ph * 6) * (1 - ph);

export const hue = (h: Hue | string) => (h in C ? (C as Record<string, string>)[h] : h);

/** Gradien & penanda panah bersama. Dipasang sekali di setiap <Stage>. */
export const Defs: React.FC = () => (
  <defs>
    {HUES.map((k) => (
      <radialGradient key={k} id={`soft-${k}`}>
        <stop offset="0%" stopColor={hue(k)} stopOpacity="0.55" />
        <stop offset="40%" stopColor={hue(k)} stopOpacity="0.18" />
        <stop offset="100%" stopColor={hue(k)} stopOpacity="0" />
      </radialGradient>
    ))}
    {HUES.map((k) => (
      <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 L2.6,5 Z" fill={hue(k)} />
      </marker>
    ))}
    <linearGradient id="crate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b4a7a" />
      <stop offset="100%" stopColor="#1f2a50" />
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#1c2a52" />
      <stop offset="100%" stopColor="#0b1126" stopOpacity="0" />
    </linearGradient>
    <radialGradient id="ball" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor="#9aa6d6" />
      <stop offset="45%" stopColor="#3c4677" />
      <stop offset="100%" stopColor="#11162e" />
    </radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3aa0ff" stopOpacity="0.85" />
      <stop offset="100%" stopColor="#123a7a" stopOpacity="0.9" />
    </linearGradient>
  </defs>
);

/** Kanvas SVG penuh 1920×1080 untuk sebuah adegan. HTML (Card/Formula) diletakkan DI LUAR Stage. */
export const Stage: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <AbsoluteFill style={style}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <Defs />
      {children}
    </svg>
  </AbsoluteFill>
);

/** Pendar lembut (gradien radial, aman untuk tema gelap). */
export const Glow: React.FC<{x: number; y: number; r: number; color?: Hue; opacity?: number; still?: boolean}> = ({x, y, r, color = 'cyan', opacity = 1, still}) => {
  const t = useT();
  if (opacity <= 0.001) return null;
  // bernapas pelan: ukuran & terang berdenyut halus (fase dari posisi agar tiap pendar beda irama)
  const b = still ? 0 : Math.sin(t * 1.25 + x * 0.013 + y * 0.007);
  return <circle cx={x} cy={y} r={r * (1 + 0.05 * b)} fill={`url(#soft-${color})`} opacity={Math.min(1, opacity * (0.9 + 0.1 * b))} />;
};

/** Panah lurus berwarna (gaya, kecepatan, perpindahan). Tanpa filter agar garis datar/tegak tidak hilang. */
export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: Hue;
  width?: number;
  opacity?: number;
  dash?: string;
  both?: boolean;
  /** denyut energi yang merambat sepanjang panah (bawaan: aktif untuk panah ≥ 70 px) */
  pulse?: boolean;
}> = ({x1, y1, x2, y2, color = 'force', width = 6, opacity = 1, dash, both, pulse}) => {
  const t = useT();
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3 || opacity <= 0.001) return null;
  const doPulse = (pulse ?? len >= 70) && !dash;
  const ph = (((t * 0.9 + (x1 * 0.0031 + y1 * 0.0017)) % 1) + 1) % 1;
  const px = x1 + (x2 - x1) * (0.06 + 0.8 * ph);
  const py = y1 + (y2 - y1) * (0.06 + 0.8 * ph);
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={hue(color)} strokeOpacity={0.22} strokeWidth={width * 3} strokeLinecap="round" />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={hue(color)}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
        markerEnd={`url(#arrow-${color})`}
        markerStart={both ? `url(#arrow-${color})` : undefined}
      />
      {doPulse ? (
        <g opacity={cycOp(ph)}>
          <circle cx={px} cy={py} r={width * 2.2} fill={`url(#soft-${color})`} />
          <circle cx={px} cy={py} r={width * 0.55} fill="#fff" opacity={0.85} />
        </g>
      ) : null}
    </g>
  );
};

/** Teks SVG dengan tepi gelap agar terbaca di atas grafik. */
export const Label: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  font?: 'head' | 'sans' | 'mono' | 'serif';
  italic?: boolean;
  spacing?: number;
}> = ({x, y, children, size = 30, color = C.ink, anchor = 'middle', weight = 500, opacity = 1, font = 'head', italic, spacing}) =>
  opacity <= 0.001 ? null : (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={FONT[font]}
      fontSize={size}
      fontWeight={weight}
      fill={hue(color)}
      opacity={opacity}
      fontStyle={italic ? 'italic' : undefined}
      letterSpacing={spacing}
      style={{paintOrder: 'stroke', stroke: 'rgba(7,11,24,0.92)', strokeWidth: size * 0.18, strokeLinejoin: 'round'}}
    >
      {children}
    </text>
  );

/** Subskrip / superskrip di label SVG. */
export const TSub: React.FC<{children: React.ReactNode}> = ({children}) => (
  <tspan baselineShift="sub" fontSize="0.65em">
    {children}
  </tspan>
);
export const TSup: React.FC<{children: React.ReactNode}> = ({children}) => (
  <tspan baselineShift="super" fontSize="0.65em">
    {children}
  </tspan>
);

/** Kartu HTML kaca gelap (rumus & catatan) yang diposisikan absolut; garis aksen di kiri. */
export const Card: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  opacity?: number;
  scale?: number;
  anchor?: 'center' | 'left' | 'right';
  accent?: string;
  style?: React.CSSProperties;
  plain?: boolean;
}> = ({x, y, children, opacity = 1, scale = 1, anchor = 'center', accent = C.cyan, style, plain}) => {
  if (opacity <= 0.001) return null;
  const tx = anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0%';
  const a = hue(accent);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${tx}, -50%) scale(${scale})`,
        transformOrigin: anchor === 'center' ? '50% 50%' : anchor === 'left' ? '0% 50%' : '100% 50%',
        opacity,
        padding: plain ? 0 : '18px 30px',
        borderRadius: 16,
        background: plain ? undefined : 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
        border: plain ? undefined : `1.5px solid ${a}55`,
        borderLeft: plain ? undefined : `7px solid ${a}`,
        boxShadow: plain ? undefined : `0 18px 50px rgba(0,0,0,0.45), 0 0 34px ${a}22`,
        color: C.ink,
        fontFamily: FONT.sans,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {plain ? null : <CardShine accent={a} opacity={opacity} />}
      {children}
    </div>
  );
};

/** Kilau kartu: sapuan cahaya saat muncul, garis rambut atas yang berkilau pelan, dan kilau sesekali. */
const CardShine: React.FC<{accent: string; opacity: number}> = ({accent, opacity}) => {
  const t = useT();
  const ph = (t * 0.11 + accent.length * 0.13) % 1; // kilau berkala (≈ 9 dtk sekali)
  const sweep = -40 + opacity * 150;
  const idle = -40 + ph * 6 * 150; // hanya terlihat di awal siklus
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent ${sweep - 16}%, rgba(255,245,220,0.13) ${sweep}%, transparent ${sweep + 16}%)`,
        }}
      />
      {ph < 1 / 6 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            pointerEvents: 'none',
            background: `linear-gradient(105deg, transparent ${idle - 14}%, rgba(255,245,220,0.07) ${idle}%, transparent ${idle + 14}%)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          top: -1,
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${accent} ${20 + 60 * (0.5 + 0.5 * Math.sin(t * 0.8))}%, transparent)`,
          opacity: 0.9,
        }}
      />
    </>
  );
};

/** Variabel matematika bergaya miring. */
export const V: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color: color ? hue(color) : undefined}}>{children}</span>
);

/** Teks berwarna (untuk menandai suku rumus dengan warna bentuk energinya). */
export const Tint: React.FC<{children: React.ReactNode; c: string}> = ({children, c}) => <span style={{color: hue(c)}}>{children}</span>;

/** Pil label kecil. */
export const Badge: React.FC<{x: number; y: number; text: React.ReactNode; color: string; opacity?: number; scale?: number; size?: number}> = ({
  x,
  y,
  text,
  color,
  opacity = 1,
  scale = 1,
  size = 26,
}) =>
  opacity <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        padding: '8px 22px',
        borderRadius: 999,
        background: 'rgba(10,16,36,0.88)',
        border: `2px solid ${hue(color)}`,
        boxShadow: `0 0 22px ${hue(color)}44`,
        color: hue(color),
        fontFamily: FONT.head,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );

/** Path yang tergambar progresif (0..1). */
export const DrawPath: React.FC<{d: string; p: number; stroke: string; width?: number; opacity?: number; dash?: string; fill?: string; halo?: boolean}> = ({
  d,
  p,
  stroke,
  width = 4,
  opacity = 1,
  dash,
  fill = 'none',
  halo,
}) => {
  if (p <= 0) return null;
  const len = 1000;
  const common = {
    d,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeDasharray: dash ?? `${len} ${len}`,
    strokeDashoffset: dash ? undefined : len * (1 - p),
    pathLength: dash ? undefined : len,
  };
  return (
    <g opacity={opacity}>
      {fill !== 'none' ? <path d={d} fill={fill} opacity={p} /> : null}
      {halo ? <path {...common} stroke={hue(stroke)} strokeOpacity={0.22} strokeWidth={width * 3.2} /> : null}
      <path {...common} stroke={hue(stroke)} strokeWidth={width} />
    </g>
  );
};

/** Partikel bercahaya (inti putih + halo warna). */
export const Spark: React.FC<{x: number; y: number; r?: number; color?: Hue; opacity?: number; trail?: [number, number][]}> = ({x, y, r = 8, color = 'gold', opacity = 1, trail}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity}>
      {trail?.map(([tx, ty], i) => (
        <circle key={i} cx={tx} cy={ty} r={r * (1 - i / (trail.length + 1)) * 0.8} fill={hue(color)} opacity={0.45 * (1 - i / trail.length)} />
      ))}
      <circle cx={x} cy={y} r={r * 3.2} fill={`url(#soft-${color})`} />
      <circle cx={x} cy={y} r={r} fill={hue(color)} />
      <circle cx={x} cy={y} r={r * 0.45} fill="#fff" />
    </g>
  );

/* ------------------------------------------------------------------ */
/* Tipografi rumus (HTML): pecahan bertumpuk, subskrip & superskrip.    */
/* Isi rumus berupa baris inline (bukan flex) agar <sub> tidak naik.    */
/* ------------------------------------------------------------------ */

export const Frac: React.FC<{n: React.ReactNode; d: React.ReactNode; size?: number}> = ({n, d, size = 0.84}) => (
  <span
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      verticalAlign: 'middle',
      margin: '0 0.14em',
      fontSize: `${size}em`,
      lineHeight: 1.12,
      position: 'relative',
      top: '-0.08em',
    }}
  >
    <span style={{padding: '0 0.2em 0.08em', whiteSpace: 'nowrap'}}>{n}</span>
    <span style={{alignSelf: 'stretch', height: 3, borderRadius: 2, background: 'currentColor', opacity: 0.85}} />
    <span style={{padding: '0.08em 0.2em 0', whiteSpace: 'nowrap'}}>{d}</span>
  </span>
);

export const Sub: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <sub style={{fontSize: '0.62em', verticalAlign: '-0.32em', lineHeight: 0, color, fontStyle: 'normal'}}>{children}</sub>
);

export const Sup: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <sup style={{fontSize: '0.62em', verticalAlign: '0.55em', lineHeight: 0, color}}>{children}</sup>
);

/** Akar kuadrat: tanda akar digambar SVG setinggi isi, garis atas menempel ke tanda akar. */
export const Sqrt: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span style={{display: 'inline-block', position: 'relative', paddingLeft: '0.6em', whiteSpace: 'nowrap', lineHeight: 1.05}}>
    <svg viewBox="0 0 60 100" preserveAspectRatio="none" style={{position: 'absolute', left: 0, top: 0, width: '0.62em', height: '100%', overflow: 'visible'}}>
      <path d="M4,60 L16,53 L33,97 L60,1.5" fill="none" stroke="currentColor" strokeWidth="0.055em" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    <span style={{display: 'inline-block', borderTop: '0.055em solid currentColor', padding: '0.1em 0.06em 0 0.08em', lineHeight: 1.05}}>{children}</span>
  </span>
);

/** Bagian rumus yang muncul bertahap (p: 0..1) mengikuti narasi. */
export const Part: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color}) => (
  <span style={{opacity: Math.max(0, Math.min(1, p)), color: color ? hue(color) : undefined}}>{children}</span>
);

/** Kartu rumus utama: ≥ 56 px, satu per momen. */
export const Formula: React.FC<{
  x: number;
  y: number;
  p: number;
  children: React.ReactNode;
  accent?: string;
  size?: number;
  anchor?: 'center' | 'left' | 'right';
  caption?: React.ReactNode;
}> = ({x, y, p, children, accent = C.cyan, size = 60, anchor = 'center', caption}) =>
  p <= 0.001 ? null : (
    <Card x={x} y={y} opacity={Math.min(1, p * 1.4)} scale={0.94 + 0.06 * p} accent={accent} anchor={anchor} style={{padding: '22px 40px'}}>
      <div style={{fontSize: size, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'nowrap', fontFamily: FONT.serif}}>{children}</div>
      {caption ? <div style={{fontSize: 25, color: C.muted, textAlign: 'center', marginTop: 8, fontFamily: FONT.sans, whiteSpace: 'nowrap'}}>{caption}</div> : null}
    </Card>
  );

/** Catatan teks pendek (HTML) dengan ikon titik warna. */
export const Note: React.FC<{x: number; y: number; p: number; color?: string; children: React.ReactNode; anchor?: 'center' | 'left' | 'right'; size?: number}> = ({
  x,
  y,
  p,
  color = C.gold,
  children,
  anchor = 'center',
  size = 30,
}) =>
  p <= 0.001 ? null : (
    <Card x={x} y={y} opacity={Math.min(1, p * 1.3)} scale={0.96 + 0.04 * p} accent={color} anchor={anchor} style={{padding: '14px 26px'}}>
      <div style={{fontSize: size, fontFamily: FONT.head, fontWeight: 500, lineHeight: 1.35}}>{children}</div>
    </Card>
  );

/* ------------------------------------------------------------------ */
/* Hiasan gerak (selalu hidup): riak, debu cahaya, aliran partikel      */
/* ------------------------------------------------------------------ */

/** Riak cahaya: cincin yang mengembang & memudar (p: 0..1), untuk tumbukan, energi dilepas, momen penting. */
export const Ripple: React.FC<{x: number; y: number; p: number; r?: number; color?: Hue; rings?: number; width?: number}> = ({x, y, p, r = 160, color = 'gold', rings = 3, width = 3}) => {
  if (p <= 0 || p >= 1) return null;
  return (
    <g>
      {Array.from({length: rings}, (_, i) => {
        const q = p * 1.35 - i * 0.17;
        if (q <= 0 || q >= 1) return null;
        return <circle key={i} cx={x} cy={y} r={r * q} fill="none" stroke={hue(color)} strokeWidth={width * (1 - q) + 0.5} opacity={Math.min(1, q * 6) * (1 - q) * 0.85} />;
      })}
      <circle cx={x} cy={y} r={r * 0.4} fill={`url(#soft-${color})`} opacity={Math.sin(Math.PI * p)} />
    </g>
  );
};

/** Debu cahaya berkelip mengitari objek fokus (deterministik, berputar pelan). */
export const Motes: React.FC<{x: number; y: number; rx: number; ry: number; n?: number; color?: Hue; opacity?: number; seed?: number}> = ({
  x,
  y,
  rx,
  ry,
  n = 30,
  color = 'gold',
  opacity = 1,
  seed = 0,
}) => {
  const t = useT();
  if (opacity <= 0.001) return null;
  const rnd = (k: number) => {
    const v = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const a = rnd(i) * Math.PI * 2 + t * (0.05 + rnd(i + 3) * 0.12) * (rnd(i + 9) > 0.5 ? 1 : -1);
        const d = 0.35 + 0.65 * Math.sqrt(rnd(i + 5));
        const tw = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.2 + rnd(i + 7) * 2) + i));
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * rx * d}
            cy={y + Math.sin(a) * ry * d - 12 * Math.sin(t * (0.4 + rnd(i + 2) * 0.6) + i)}
            r={0.8 + rnd(i + 1) * 2.2}
            fill={hue(color)}
            opacity={tw * 0.7}
          />
        );
      })}
    </g>
  );
};

/** Titik pada polyline pada fraksi panjang u (0..1). */
export const pointAlong = (pts: [number, number][], u: number): [number, number] => {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let target = Math.max(0, Math.min(1, u)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? target / seg[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    target -= seg[i];
  }
  return pts[pts.length - 1];
};

/**
 * Aliran energi: butir cahaya yang terus mengalir sepanjang lintasan (polyline) dari sumber ke tujuan.
 * Pakai untuk menunjukkan energi berpindah (benda → batang, gesekan → panas, PLTA → kabel).
 */
export const Stream: React.FC<{pts: [number, number][]; color?: Hue; n?: number; speed?: number; r?: number; opacity?: number; seed?: number; jitter?: number}> = ({
  pts,
  color = 'gold',
  n = 10,
  speed = 0.5,
  r = 5,
  opacity = 1,
  seed = 0,
  jitter = 6,
}) => {
  const t = useT();
  if (opacity <= 0.001 || pts.length < 2) return null;
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        const ph = (((t * speed + i / n + seed * 0.37) % 1) + 1) % 1;
        const [x, y] = pointAlong(pts, ph);
        const j = jitter * Math.sin(t * 3 + i * 2.1 + seed);
        return (
          <g key={i} opacity={cycOp(ph)}>
            <circle cx={x} cy={y + j} r={r * 2.6} fill={`url(#soft-${color})`} />
            <circle cx={x} cy={y + j} r={r * 0.7} fill={hue(color)} />
            <circle cx={x} cy={y + j} r={r * 0.32} fill="#fff" opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

/** Bintang kilau kecil (empat ujung) yang muncul-hilang di sekitar titik — untuk hasil akhir/angka penting. */
export const Twinkles: React.FC<{x: number; y: number; rx: number; ry: number; n?: number; color?: Hue; opacity?: number; seed?: number}> = ({
  x,
  y,
  rx,
  ry,
  n = 6,
  color = 'gold',
  opacity = 1,
  seed = 1,
}) => {
  const t = useT();
  if (opacity <= 0.001) return null;
  const rnd = (k: number) => {
    const v = Math.sin(k * 91.17 + seed * 13.7) * 43758.5453;
    return v - Math.floor(v);
  };
  return (
    <g opacity={opacity}>
      {Array.from({length: n}, (_, i) => {
        // posisi berganti hanya saat siklus kilau berganti (saat tak terlihat) → tanpa loncatan
        const raw = t * (0.35 + rnd(i) * 0.3) + rnd(i + 4);
        const cyc = Math.floor(raw);
        const ph = raw - cyc;
        const cx = x + (rnd(i * 7 + cyc * 3.1 + 11) - 0.5) * 2 * rx;
        const cy = y + (rnd(i * 5 + cyc * 2.3 + 23) - 0.5) * 2 * ry;
        const s = 10 * Math.sin(Math.PI * ph);
        return (
          <path
            key={i}
            d={`M${cx},${cy - s} Q${cx},${cy} ${cx + s},${cy} Q${cx},${cy} ${cx},${cy + s} Q${cx},${cy} ${cx - s},${cy} Q${cx},${cy} ${cx},${cy - s} Z`}
            fill={hue(color)}
            opacity={Math.sin(Math.PI * ph) * 0.9}
          />
        );
      })}
    </g>
  );
};
