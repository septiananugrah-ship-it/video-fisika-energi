import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {type Axes, Plot, px, py} from '../components/physics';
import {Arrow, Card, Formula, Label, Stage, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Gaya berubah: potong menjadi pita F·dx → luas di bawah grafik = integral.
// Lalu grafik modul (luas bertanda 40 + 20 − 10 = 50 J) dan jebakan grafik F–t.

const A: Axes = {x0: 230, y0: 680, w: 900, h: 330, xmax: 6, ymax: 25, ymin: -12};
const F = (x: number) => 14 + 7 * Math.sin(1.1 * x + 0.3) - x;
const G = (x: number) => (x <= 2 ? 20 : x <= 4 ? 20 - 10 * (x - 2) : -5 * (x - 4)); // grafik modul

const curve = (f: (x: number) => number, x1 = 6, n = 160) =>
  Array.from({length: n + 1}, (_, i) => {
    const x = (x1 * i) / n;
    return `${i === 0 ? 'M' : 'L'}${px(A, x).toFixed(1)},${py(A, f(x)).toFixed(1)}`;
  }).join(' ');
const CURVE = curve(F);
const AREA = `${curve(F)} L${px(A, 6)},${A.y0} L${px(A, 0)},${A.y0} Z`;

const Strips: React.FC<{n: number; op: number; hi?: number; hiOp?: number}> = ({n, op, hi = -1, hiOp = 0}) => {
  if (op <= 0.001) return null;
  const dx = 6 / n;
  return (
    <g opacity={op}>
      {Array.from({length: n}, (_, i) => {
        const xm = (i + 0.5) * dx;
        const y = py(A, F(xm));
        const isHi = i === hi;
        return (
          <rect
            key={i}
            x={px(A, i * dx) + 1}
            y={y}
            width={px(A, dx) - A.x0 - 2}
            height={A.y0 - y}
            fill={C.work}
            fillOpacity={isHi ? 0.25 + 0.5 * hiOp : 0.25}
            stroke={C.work}
            strokeOpacity={0.8}
            strokeWidth={n > 20 ? 1 : 2}
          />
        );
      })}
    </g>
  );
};

export const Area: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  // grafik 1 (gaya berubah halus)
  const g1 = 1 - ramp(t, cue(6) - 0.2, cue(6) + 0.8, EASE_IN_OUT);
  const axes = ramp(t, 0.4, 1.4);
  const run = ramp(t, cue(0) + 1.5, cue(1) + 2.5, EASE_IN_OUT);
  const bx = run * 6;
  const s6 = win(t, cue(1) + 0.6, cue(3) + 2.4, 0.8, 0.8);
  const hiOp = win(t, cue(2) + 0.4, cue(4), 0.6, 0.6);
  const s12 = win(t, cue(3) + 2.0, cue(4) + 1.6, 0.8, 0.8);
  const s40 = win(t, cue(4) + 1.2, cue(4) + 4.2, 0.8, 0.8);
  const fill = ramp(t, cue(4) + 3.6, cue(4) + 5);
  const intg = win(t, cue(5) + 0.2, cue(6) - 0.2, 0.8, 0.6);

  // grafik 2 (modul)
  const g2 = ramp(t, cue(6) + 0.2, cue(6) + 1.2);
  const signs = ramp(t, cue(6) + 1.5, cue(6) + 2.5);
  const l40 = ramp(t, wordOf(7, 'empat'), wordOf(7, 'empat') + 0.8);
  const l20 = ramp(t, wordOf(7, 'segitiga'), wordOf(7, 'segitiga') + 0.8);
  const l10 = ramp(t, wordOf(7, 'dikurangi'), wordOf(7, 'dikurangi') + 0.8);
  const tot = win(t, wordOf(7, 'Totalnya') - 0.2, cue(8) + 0.2, 0.7, 0.6);
  const legend = win(t, cue(6) + 1.0, cue(8) + 0.2, 0.7, 0.6);

  // jebakan F–t
  const trap = ramp(t, cue(8) + 0.2, cue(8) + 1.2);
  const xHi = win(t, cue(8) + 0.4, 999, 0.6, 0.6);
  const inset = ramp(t, wordOf(8, 'Luas') - 0.2, wordOf(8, 'Luas') + 0.8);

  // jalur grafik modul
  const MOD = curve(G, 6, 120);
  const pos = `M${px(A, 0)},${A.y0} L${px(A, 0)},${py(A, 20)} L${px(A, 2)},${py(A, 20)} L${px(A, 4)},${A.y0} Z`;
  const neg = `M${px(A, 4)},${A.y0} L${px(A, 6)},${py(A, -10)} L${px(A, 6)},${A.y0} Z`;

  return (
    <AbsoluteFill>
      <Stage>
        <Plot a={A} p={axes} xLabel="x (m)" yLabel="F (N)" xTicks={[1, 2, 3, 4, 5, 6]} yTicks={[-10, 10, 20]} />
        <Label x={px(A, 5.2)} y={A.y0 - 44} size={26} color={C.gold} opacity={xHi} weight={600}>
          posisi, bukan waktu!
        </Label>
        <rect x={A.x0 + A.w + 34} y={A.y0 - 22} width={100} height={44} rx={10} fill="none" stroke={C.gold} strokeWidth={3} opacity={xHi} />

        {/* ===== grafik gaya berubah ===== */}
        <g opacity={g1}>
          {/* balok di lintasan, panah gaya mengikuti grafik */}
          <line x1={A.x0 - 40} y1={280} x2={A.x0 + A.w + 40} y2={280} stroke={C.muted} strokeWidth={3} />
          <rect x={px(A, bx) - 35} y={210} width={70} height={70} rx={10} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
          <Arrow x1={px(A, bx) + 38} y1={245} x2={px(A, bx) + 38 + F(bx) * 7} y2={245} color="force" width={6} opacity={ramp(t, cue(0) + 1, cue(0) + 1.6)} />
          <line x1={px(A, bx)} y1={282} x2={px(A, bx)} y2={py(A, F(bx))} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 7" opacity={0.8 * (1 - ramp(t, cue(1) + 2.5, cue(1) + 3.2))} />
          <path d={AREA} fill={C.work} opacity={0.32 * fill} />
          <Strips n={6} op={s6} hi={3} hiOp={hiOp} />
          <Strips n={12} op={s12} />
          <Strips n={40} op={s40} />
          <path d={CURVE} fill="none" stroke={C.force} strokeWidth={5} strokeDasharray="2000" strokeDashoffset={2000 * (1 - run)} pathLength={2000} />
          {/* label pita F × dx */}
          <g opacity={hiOp}>
            {(() => {
              const x1 = px(A, 3);
              const x2 = px(A, 4);
              const yy = py(A, F(3.5));
              return (
                <g>
                  <Arrow x1={x1} y1={A.y0 + 46} x2={x2} y2={A.y0 + 46} color="cyan" width={3} both />
                  <Label x={(x1 + x2) / 2} y={A.y0 + 76} size={28} font="serif" italic color={C.cyan}>
                    dx
                  </Label>
                  <Arrow x1={x2 + 22} y1={A.y0} x2={x2 + 22} y2={yy} color="force" width={3} both />
                  <Label x={x2 + 40} y={(A.y0 + yy) / 2} size={28} font="serif" italic color={C.force} anchor="start">
                    F
                  </Label>
                </g>
              );
            })()}
          </g>
        </g>

        {/* ===== grafik modul ===== */}
        <g opacity={g2}>
          <path d={pos} fill={C.work} opacity={0.35} />
          <path d={neg} fill={C.heat} opacity={0.4} />
          <line x1={px(A, 2)} y1={py(A, 20)} x2={px(A, 2)} y2={A.y0} stroke={C.work} strokeWidth={2} strokeDasharray="6 6" />
          <path d={MOD} fill="none" stroke={C.force} strokeWidth={5} />
          <g opacity={signs}>
            <Label x={px(A, 0.35)} y={py(A, 16.5)} size={40} color={C.work} weight={700}>
              +
            </Label>
            <Label x={px(A, 4.75)} y={py(A, -1.4)} size={36} color={C.heat} weight={700}>
              −
            </Label>
          </g>
          <Label x={px(A, 1)} y={py(A, 10)} size={36} font="mono" color={C.ink} weight={600} opacity={l40}>
            40 J
          </Label>
          <Label x={px(A, 2.62)} y={py(A, 6.5)} size={32} font="mono" color={C.ink} weight={600} opacity={l20}>
            20 J
          </Label>
          <Label x={px(A, 5.25)} y={py(A, -10.5)} size={32} font="mono" color={C.heat} weight={600} opacity={l10}>
            −10 J
          </Label>
        </g>

        {/* ===== jebakan: grafik F–t ===== */}
        <g opacity={inset}>
          <rect x={1250} y={330} width={540} height={420} rx={20} fill="rgba(10,16,36,0.78)" stroke={C.heat} strokeOpacity={0.7} strokeWidth={2} />
          <line x1={1310} y1={660} x2={1740} y2={660} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <line x1={1310} y1={670} x2={1310} y2={400} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
          <path d="M1330,660 C1420,660 1440,450 1510,450 C1580,450 1600,660 1690,660 Z" fill={C.cyan} opacity={0.3} />
          <path d="M1330,660 C1420,660 1440,450 1510,450 C1580,450 1600,660 1690,660" fill="none" stroke={C.cyan} strokeWidth={4} />
          <Label x={1740} y={694} size={26} font="serif" italic anchor="end">
            t (s)
          </Label>
          <Label x={1326} y={386} size={26} font="serif" italic anchor="start">
            F (N)
          </Label>
          <Label x={1520} y={580} size={28} color={C.cyan} weight={600}>
            luas = impuls
          </Label>
        </g>
      </Stage>

      <Card x={1480} y={430} opacity={win(t, 0.6, cue(1), 0.7, 0.6)} accent={C.force} style={{padding: '12px 28px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 40}}>
          <V>W</V> = <V>F s</V> <span style={{fontFamily: FONT.head, fontSize: 30, color: C.muted}}>hanya jika F tetap</span>
        </div>
      </Card>

      <Formula x={1500} y={300} p={win(t, cue(2) + 0.6, cue(5), 0.7, 0.6)} accent={C.work} size={56}>
        <V>dW</V> = <V color={C.force}>F</V> <V color={C.cyan}>dx</V>
      </Formula>
      <Formula x={1500} y={460} p={intg} accent={C.work} size={60} caption="luas di bawah grafik F terhadap posisi">
        <V color={C.work}>W</V> ={' '}
        <span style={{fontSize: '1.3em', position: 'relative', top: '0.06em'}}>∫</span>
        <V color={C.force}>F</V> <V color={C.cyan}>dx</V>
      </Formula>
      <Card x={1500} y={380} opacity={legend * (1 - inset)} accent={C.muted} style={{padding: '14px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, lineHeight: 1.6}}>
          <div>
            <span style={{color: C.work, fontWeight: 700}}>+</span> luas di atas sumbu
          </div>
          <div>
            <span style={{color: C.heat, fontWeight: 700}}>−</span> luas di bawah sumbu
          </div>
        </div>
      </Card>
      <Formula x={1500} y={600} p={tot} accent={C.gold} size={56}>
        <V>W</V> = 40 + 20 − 10 = <span style={{color: C.gold}}>50 J</span>
      </Formula>
      <Card x={1520} y={810} opacity={inset} accent={interpolateColors(trap, [0, 1], [C.muted, C.heat])} style={{padding: '10px 24px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.heat}}>
          bukan usaha — dibahas di video <span style={{color: C.ink}}>Momentum</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};
