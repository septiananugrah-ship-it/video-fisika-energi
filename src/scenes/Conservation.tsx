import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {EnergyBars, ELabel} from '../components/physics';
import {Arrow, Formula, Glow, Label, Note, Stage, Sub, Tint, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase B: papan luncur di setengah pipa licin (lintasan lingkaran R). Energi dihitung dari posisi:
// U = mgR(1 − cos θ), K = E − U. Hentakan kaki menambah E (usaha luar positif).
const PIPE = {cx: 620, cy: 250, R: 480};
const A0 = (55 * Math.PI) / 180;
const pipePt = (th: number) => ({x: PIPE.cx + PIPE.R * Math.sin(th), y: PIPE.cy + PIPE.R * Math.cos(th)});
const PIPE_D = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const th = ((-78 + (156 * i) / 120) * Math.PI) / 180;
    const p = pipePt(th);
    pts.push(`${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
})();

// Fase C: bandul bola boling (seperti pembuka).
const PIV = {x: 820, y: 175};
const L = 520;
const RB = 40;
const TH0 = (38 * Math.PI) / 180;
const TP = 3.6;
const GAMMA = 0.04 / TP;

const Face: React.FC<{x: number; y: number; hit: number}> = ({x, y, hit}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0,0 L22,-26 Q30,-60 26,-92 Q60,-170 150,-150 Q215,-130 220,-40 Q222,40 196,96 L196,170 L80,170 L84,120 Q60,118 44,96 Q40,74 46,60 Q30,56 34,40 Q26,34 32,22 Q18,14 0,0 Z"
      fill="#141d3e"
      stroke={hit > 0.01 ? C.heat : C.muted}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={64} cy={-56} r={6} fill={C.ink} />
  </g>
);

export const Conservation: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const sceneOut = 1 - ramp(t, dur - 0.9, dur - 0.2, EASE_IN_OUT);
  const phA = 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.2, EASE_IN_OUT);
  const phB = win(t, cue(3) - 0.1, cue(6) - 0.2, 0.6, 0.5);
  const phC = ramp(t, cue(6) - 0.1, cue(6) + 0.5);

  // ---------- fase A ----------
  const chips = [0, 1, 2].map((i) => ramp(t, cue(0) + 1.6 + i * 1.3, cue(0) + 2.3 + i * 1.3));
  const fEm = win(t, cue(1) + 0.2, cue(2) + 0.2, 0.7, 0.5);
  const fCons = ramp(t, cue(2) + 0.3, cue(2) + 1.1);

  // ---------- fase B: papan luncur ----------
  const tb = t - (cue(3) + 0.3);
  const kick = ramp(t, wordOf(5, 'hentakan') + 0.1, wordOf(5, 'hentakan') + 0.9, EASE_IN_OUT);
  const A1 = Math.acos(1 - 1.15 * (1 - Math.cos(A0)));
  const amp = mix(A0, A1, kick);
  const th = tb < 0 ? A0 : amp * Math.cos((2 * Math.PI * tb) / 4.4);
  const Us = 100 / (1 - Math.cos(A0));
  const E = Us * (1 - Math.cos(amp));
  const Ub = Us * (1 - Math.cos(th));
  const Kb = Math.max(0, E - Ub);
  const sk = pipePt(th);
  const startY = pipePt(A0).y;
  const kickFlash = win(t, wordOf(5, 'hentakan'), wordOf(5, 'hentakan') + 1.6, 0.3, 0.6);

  // ---------- fase C: bandul ----------
  const tr = cue(7) + 0.6;
  const tau = t - tr;
  const theta = tau < 0 ? TH0 : TH0 * Math.exp(-GAMMA * tau) * Math.cos((2 * Math.PI * tau) / TP);
  const bx = PIV.x + L * Math.sin(theta);
  const by = PIV.y + L * Math.cos(theta);
  const noseX = PIV.x + L * Math.sin(TH0) + RB + 4;
  const noseY = PIV.y + L * Math.cos(TH0);
  const h0 = 1 - Math.cos(TH0);
  const ampC = tau < 0 ? TH0 : TH0 * Math.exp(-GAMMA * tau);
  const Ec = (1 - Math.cos(ampC)) / h0;
  const Uc = (1 - Math.cos(theta)) / h0;
  const Kc = Math.max(0, Ec - Uc);
  // puncak yang sudah dicapai di sisi wajah (tiap periode)
  const peaks = [1, 2, 3].filter((n) => tau > n * TP - 0.2).map((n) => TH0 * Math.exp(-GAMMA * n * TP));
  const lowerNote = ramp(t, cue(8) + 0.4, cue(8) + 1.1);
  const ghostP = ramp(t, cue(9) + 1.4, cue(9) + 3.6, EASE_IN_OUT);
  const ghostOn = ramp(t, cue(9) + 0.3, cue(9) + 0.9);
  const TH_PUSH = TH0 + 0.16;
  const thG = Math.min(mix(-TH_PUSH, TH_PUSH, ghostP), TH0);
  const hit = ramp(t, cue(9) + 3.0, cue(9) + 3.3) * ghostOn;
  const gx = PIV.x + L * Math.sin(thG);
  const gy = PIV.y + L * Math.cos(thG);
  const ghostArc = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const a = mix(-TH_PUSH, TH_PUSH, i / 60);
      pts.push(`${i ? 'L' : 'M'}${(PIV.x + L * Math.sin(a)).toFixed(1)},${(PIV.y + L * Math.cos(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  const chipData = [
    {c: C.kin, name: 'energi kinetik', f: <>K = ½ m v²</>},
    {c: C.pot, name: 'potensial gravitasi', f: <>U<sub>g</sub> = m g y</>},
    {c: C.spr, name: 'potensial pegas', f: <>U<sub>s</sub> = ½ k x²</>},
  ];

  return (
    <AbsoluteFill style={{opacity: sceneOut}}>
      {/* ---------- fase A ---------- */}
      <div style={{opacity: phA}}>
        {chipData.map((d, i) => (
          <div
            key={d.name}
            style={{
              position: 'absolute',
              left: 300 + i * 460,
              top: 300,
              width: 400,
              height: 190,
              borderRadius: 22,
              background: 'rgba(12,20,44,0.9)',
              border: `2px solid ${d.c}`,
              boxShadow: `0 0 36px ${d.c}33`,
              opacity: chips[i],
              translate: `0px ${(1 - chips[i]) * 30}px`,
              textAlign: 'center',
              color: C.ink,
            }}
          >
            <div style={{marginTop: 28, fontFamily: FONT.head, fontSize: 26, letterSpacing: 2, color: d.c, fontWeight: 600, textTransform: 'uppercase'}}>{d.name}</div>
            <div style={{marginTop: 18, fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 52, color: d.c}}>{d.f}</div>
          </div>
        ))}
      </div>
      <Formula x={960} y={680} p={fEm * phA} accent={C.gold} size={66} caption="energi mekanik">
        <V>E</V>
        <Sub>m</Sub> = <V color="kin">K</V> + <V color="pot">U</V>
      </Formula>
      <Formula x={960} y={680} p={fCons * phA} accent={C.gold} size={64} caption="berlaku bila hanya gaya konservatif yang melakukan usaha">
        <V color="kin">K</V>
        <Sub>i</Sub> + <V color="pot">U</V>
        <Sub>i</Sub> = <V color="kin">K</V>
        <Sub>f</Sub> + <V color="pot">U</V>
        <Sub>f</Sub>
      </Formula>

      <Stage>
        {/* ---------- fase B ---------- */}
        <g opacity={phB}>
          <path d={`${PIPE_D} L${pipePt((78 * Math.PI) / 180).x},790 L${pipePt((-78 * Math.PI) / 180).x},790 Z`} fill="#0e1736" opacity={0.85} />
          <path d={PIPE_D} fill="none" stroke={C.ink} strokeWidth={5} />
          <line x1={140} y1={startY} x2={1100} y2={startY} stroke={C.gold} strokeWidth={2.5} strokeDasharray="14 10" />
          <Label x={150} y={startY - 26} size={24} color={C.gold} anchor="start" weight={600}>
            ketinggian awal
          </Label>
          <Glow x={sk.x} y={sk.y} r={120} color="kin" opacity={Kb / 120} />
          {/* pemain papan luncur: papan menyinggung lintasan, badan menghadap pusat */}
          <g transform={`translate(${sk.x} ${sk.y}) rotate(${(-th * 180) / Math.PI})`}>
            <rect x={-46} y={-14} width={92} height={10} rx={5} fill={C.kin} />
            <circle cx={-30} cy={-2} r={6} fill={C.muted} />
            <circle cx={30} cy={-2} r={6} fill={C.muted} />
            <g stroke={C.ink} strokeWidth={6} strokeLinecap="round" fill="none">
              <line x1={-14} y1={-14} x2={0} y2={-60} />
              <line x1={14} y1={-14} x2={0} y2={-60} />
              <line x1={0} y1={-60} x2={0} y2={-104} />
              <line x1={0} y1={-92} x2={-30} y2={-74} />
              <line x1={0} y1={-92} x2={30} y2={-74} />
            </g>
            <circle cx={0} cy={-122} r={15} fill={C.bg} stroke={C.ink} strokeWidth={5} />
          </g>
          <g opacity={kickFlash}>
            <Arrow x1={sk.x - 70} y1={sk.y - 40} x2={sk.x + 70} y2={sk.y - 40} color="work" width={6} />
            <Label x={sk.x} y={sk.y - 80} size={26} color={C.work} weight={600}>
              + usaha kaki
            </Label>
          </g>
        </g>
        <EnergyBars
          x={1240}
          y={760}
          height={300}
          barW={80}
          gap={34}
          max={125}
          showValues={false}
          unit=""
          title="ENERGI PEMAIN"
          opacity={phB * ramp(t, cue(3) + 0.6, cue(3) + 1.3)}
          bars={[
            {key: 'K', label: ELabel.K, value: Kb, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Ub, color: 'pot'},
          ]}
        />

        {/* ---------- fase C ---------- */}
        <g opacity={phC}>
          <rect x={PIV.x - 150} y={PIV.y - 26} width={300} height={26} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <line x1={480} y1={noseY} x2={noseX + 30} y2={noseY} stroke={C.gold} strokeWidth={2.5} strokeDasharray="14 10" opacity={ramp(t, cue(7), cue(7) + 0.6)} />
          <Label x={490} y={noseY - 26} size={24} color={C.gold} anchor="start" weight={600} opacity={ramp(t, cue(7), cue(7) + 0.6)}>
            ketinggian awal
          </Label>
          {peaks.map((a, i) => {
            const x = PIV.x + L * Math.sin(a) + RB;
            const y = PIV.y + L * Math.cos(a);
            return <line key={i} x1={x - 50} y1={y} x2={x + 6} y2={y} stroke={C.heat} strokeWidth={3} opacity={0.8 * lowerNote} />;
          })}
          {/* lintasan bayangan bila didorong */}
          <g opacity={ghostOn}>
            <path d={ghostArc} fill="none" stroke={C.heat} strokeWidth={3} strokeDasharray="8 10" opacity={0.7} />
            <line x1={PIV.x} y1={PIV.y} x2={gx} y2={gy} stroke={C.heat} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="6 6" />
            <circle cx={gx} cy={gy} r={RB} fill="none" stroke={C.heat} strokeWidth={4} strokeDasharray="8 6" />
            <circle cx={noseX} cy={noseY} r={30 + 40 * hit} fill={`url(#soft-heat)`} opacity={hit} />
          </g>
          <g opacity={1 - 0.65 * ghostOn}>
            <line x1={PIV.x} y1={PIV.y} x2={bx} y2={by} stroke={C.ink} strokeOpacity={0.8} strokeWidth={3} />
            <circle cx={PIV.x} cy={PIV.y} r={7} fill={C.ink} />
            <Glow x={bx} y={by} r={150} color="kin" opacity={0.6 * Kc} />
            <circle cx={bx} cy={by} r={RB} fill="url(#ball)" stroke={C.ink} strokeOpacity={0.55} strokeWidth={2} />
            <circle cx={bx - 10} cy={by - 12} r={4.5} fill="#0a0f22" />
            <circle cx={bx + 4} cy={by - 17} r={4.5} fill="#0a0f22" />
            <circle cx={bx + 2} cy={by - 3} r={5} fill="#0a0f22" />
          </g>
          <Face x={noseX} y={noseY} hit={hit} />
        </g>
        <EnergyBars
          x={150}
          y={800}
          height={240}
          barW={62}
          gap={28}
          max={1}
          showValues={false}
          unit=""
          title="ENERGI BOLA"
          opacity={phC * ramp(t, cue(7) - 0.2, cue(7) + 0.6)}
          bars={[
            {key: 'K', label: ELabel.K, value: Kc, color: 'kin'},
            {key: 'Ug', label: ELabel.Ug, value: Uc, color: 'pot'},
          ]}
        />
      </Stage>
      <Note x={1500} y={300} p={phB * ramp(t, cue(4) + 0.4, cue(4) + 1.1)} color={C.gold} size={28}>
        <Tint c="kin">K</Tint> ⇄ <Tint c="pot">U</Tint>
        <sub>g</sub>, total tetap
      </Note>
      <Note x={1540} y={300} p={phC * lowerNote * (1 - ghostOn)} color={C.heat} size={28}>
        hambatan udara → puncak makin rendah
      </Note>
      <Note x={1540} y={300} p={phC * ghostOn} color={C.heat} size={28}>
        didorong: <Tint c="work">+W</Tint> → melewati batas awal
      </Note>
      <Note x={1540} y={300} p={phC * ramp(t, cue(7) + 0.2, cue(7) + 0.9) * (1 - lowerNote)} color={C.gold} size={28}>
        tanpa dorongan: <Tint c="gold">E</Tint> tidak bertambah
      </Note>
    </AbsoluteFill>
  );
};
