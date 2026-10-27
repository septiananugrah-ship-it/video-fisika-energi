import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Crate, Ground, fmt} from '../components/physics';
import {Arrow, Card, Formula, Label, Stage, Sub, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Contoh 2 modul: koper 10 kg, F = 60 N pada 60°, s = 20 m, gesekan 12 N.
// Buku kas usaha per gaya: +600, −240, 0, 0 → 360 J.

const FLOOR = 560;
const X0 = 230; // posisi 0 m (tengah koper)
const PXM = 40; // piksel per meter → 20 m = 800 px
const TH = (60 * Math.PI) / 180;

const Row: React.FC<{p: number; label: React.ReactNode; value: number; color: string; strong?: boolean}> = ({p, label, value, color, strong}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 40,
      opacity: p,
      translate: `${(1 - p) * 20}px 0px`,
      padding: '6px 0',
      fontSize: strong ? 40 : 34,
    }}
  >
    <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color}}>{label}</span>
    <span style={{fontFamily: FONT.mono, fontWeight: 600, color}}>
      {value > 0 ? '+' : value < 0 ? '−' : ''}
      {fmt(Math.abs(value) * Math.min(1, p * 1.2))} J
    </span>
  </div>
);

export const Suitcase: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  // koper dipercepat dari diam (gerak diperlambat untuk ditonton): s = 20 (τ/T)²
  const a = cue(0) + 2;
  const b = cue(6);
  const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
  const sM = 20 * u * u;
  const x = X0 + sM * PXM;
  const hY = FLOOR - 120 - 22;
  const FL = 230;
  const forces = ramp(t, cue(0) + 0.8, cue(0) + 2);
  const fric = ramp(t, cue(1), cue(1) + 0.8);
  const gn = ramp(t, cue(4), cue(4) + 0.8);

  const rF = ramp(t, wordOf(2, 'Hasilnya'), wordOf(2, 'Hasilnya') + 1);
  const rf = ramp(t, wordOf(3, 'yaitu'), wordOf(3, 'yaitu') + 1);
  const rg = ramp(t, cue(4) + 1, cue(4) + 2);
  const rT = ramp(t, wordOf(5, 'tiga'), wordOf(5, 'tiga') + 1.2);
  const ledger = ramp(t, cue(2), cue(2) + 0.8);

  const f1 = win(t, cue(2) + 0.2, cue(3) - 0.1, 0.7, 0.6);
  const f2 = win(t, cue(3) + 0.2, cue(5) - 0.1, 0.7, 0.6);
  const f3 = win(t, cue(5) + 0.2, cue(6) - 0.1, 0.7, 0.6);
  const flow = ramp(t, cue(6) + 0.3, cue(6) + 2.2, EASE_IN_OUT);
  const flowIn = ramp(t, cue(6), cue(6) + 0.8);
  const emph = ramp(t, cue(7) + 0.2, cue(7) + 1.2);

  return (
    <AbsoluteFill>
      <Stage>
        <Ground x1={120} x2={1160} y={FLOOR} rough />
        {/* skala jarak */}
        <g opacity={ramp(t, cue(0) + 1, cue(0) + 2)}>
          {[0, 5, 10, 15, 20].map((m) => (
            <g key={m}>
              <line x1={X0 + m * PXM} y1={FLOOR + 30} x2={X0 + m * PXM} y2={FLOOR + 44} stroke={C.muted} strokeWidth={2} />
              <Label x={X0 + m * PXM} y={FLOOR + 66} size={20} font="mono" color={C.muted}>
                {`${m} m`}
              </Label>
            </g>
          ))}
          <line x1={X0} y1={FLOOR + 37} x2={X0 + 20 * PXM} y2={FLOOR + 37} stroke={C.muted} strokeWidth={2} />
          <line x1={X0} y1={FLOOR + 37} x2={x} y2={FLOOR + 37} stroke={C.cyan} strokeWidth={5} strokeLinecap="round" />
        </g>
        <Crate x={x} y={FLOOR} w={160} h={120} label="10 kg" color={C.pot} handle />
        {/* gaya-gaya */}
        <g opacity={forces}>
          <line x1={x} y1={hY} x2={x + 320 * Math.cos(TH)} y2={hY - 320 * Math.sin(TH)} stroke={C.muted} strokeWidth={3} />
          <Arrow x1={x} y1={hY} x2={x + FL * Math.cos(TH)} y2={hY - FL * Math.sin(TH)} color="force" width={7} />
          <Label x={x + FL * Math.cos(TH) + 46} y={hY - FL * Math.sin(TH)} size={30} color={C.force} weight={600}>
            60 N
          </Label>
          <path d={`M${x + 60},${hY} A60,60 0 0 0 ${x + 60 * Math.cos(TH)},${hY - 60 * Math.sin(TH)}`} fill="none" stroke={C.gold} strokeWidth={3} />
          <Label x={x + 92} y={hY - 34} size={22} color={C.gold}>
            60°
          </Label>
        </g>
        <g opacity={fric}>
          <Arrow x1={x - 80} y1={FLOOR - 8} x2={x - 200} y2={FLOOR - 8} color="heat" width={6} />
          <Label x={x - 150} y={FLOOR - 40} size={26} color={C.heat} weight={600}>
            12 N
          </Label>
        </g>
        <g opacity={gn}>
          <Arrow x1={x + 58} y1={FLOOR - 60} x2={x + 58} y2={FLOOR + 22} color="muted" width={5} />
          <Label x={x + 96} y={FLOOR - 24} size={26} font="serif" italic color={C.muted} anchor="start">
            mg
          </Label>
          <Arrow x1={x - 58} y1={FLOOR - 60} x2={x - 58} y2={FLOOR - 190} color="muted" width={5} />
          <Label x={x - 80} y={FLOOR - 180} size={26} font="serif" italic color={C.muted} anchor="end">
            N
          </Label>
          <Label x={x - 70} y={FLOOR - 230} size={24} color={C.muted} anchor="end">
            ⊥ gerak → W = 0
          </Label>
        </g>
        <Arrow x1={X0 - 60} y1={FLOOR + 110} x2={X0 + 60} y2={FLOOR + 110} color="cyan" width={4} opacity={ramp(t, cue(0) + 2, cue(0) + 3)} />
        <Label x={X0 + 76} y={FLOOR + 110} size={24} color={C.cyan} anchor="start" opacity={ramp(t, cue(0) + 2, cue(0) + 3)}>
          arah gerak
        </Label>
      </Stage>

      {/* buku kas usaha */}
      <Card x={1490} y={470} opacity={ledger} accent={C.work} style={{padding: '22px 36px', minWidth: 470, boxShadow: `0 18px 50px rgba(0,0,0,0.45), 0 0 ${60 * emph}px rgba(255,201,74,${0.45 * emph})`}}>
        <div style={{fontFamily: FONT.head, fontSize: 22, letterSpacing: 3, color: C.muted, marginBottom: 6}}>BUKU KAS USAHA</div>
        <Row p={rF} label={<>W<Sub>tarik</Sub></>} value={600} color={C.work} />
        <Row p={rf} label={<>W<Sub>gesek</Sub></>} value={-240} color={C.heat} />
        <Row p={rg} label={<>W<Sub>berat</Sub></>} value={0} color={C.muted} />
        <Row p={rg} label={<>W<Sub>normal</Sub></>} value={0} color={C.muted} />
        <div style={{height: 2, background: C.line, margin: '8px 0', opacity: rT}} />
        <Row p={rT} label={<>W<Sub>total</Sub></>} value={360} color={C.gold} strong />
      </Card>

      <Formula x={640} y={780} p={f1} accent={C.work} size={56}>
        <V>W</V>
        <Sub>tarik</Sub> = (60)(20)(cos 60°) = <span style={{color: C.work}}>600 J</span>
      </Formula>
      <Formula x={640} y={780} p={f2} accent={C.heat} size={56}>
        <V>W</V>
        <Sub>gesek</Sub> = −(12)(20) = <span style={{color: C.heat}}>−240 J</span>
      </Formula>
      <Formula x={640} y={780} p={f3} accent={C.gold} size={56}>
        <V>W</V>
        <Sub>total</Sub> = 600 − 240 = <span style={{color: C.gold}}>360 J</span>
      </Formula>

      {/* aliran 600 J: 360 ke koper, 240 jadi panas */}
      <div style={{position: 'absolute', left: 200, top: 740, width: 900, opacity: flowIn}}>
        <div style={{fontFamily: FONT.head, fontSize: 26, color: C.muted, marginBottom: 10}}>
          tarikan menyumbang <span style={{color: C.work, fontWeight: 600}}>600 J</span>
        </div>
        <div style={{display: 'flex', height: 54, borderRadius: 12, overflow: 'hidden', border: `2px solid ${C.line}`}}>
          <div style={{width: `${mix(100, 60, flow)}%`, background: C.kin, display: 'flex', alignItems: 'center', paddingLeft: 18, fontFamily: FONT.head, fontWeight: 600, fontSize: 26, color: '#1a0d00'}}>
            360 J → koper (energi kinetik)
          </div>
          <div style={{width: `${mix(0, 40, flow)}%`, background: C.heat, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.head, fontWeight: 600, fontSize: 26, color: '#2a0006', whiteSpace: 'nowrap', overflow: 'hidden'}}>
            240 J → panas
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
