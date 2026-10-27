import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {mix, ramp, win} from '../anim';
import {Crate, Ground, Person} from '../components/physics';
import {Arrow, Card, Formula, Glow, Label, Spark, Stage, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Usaha: definisi, koper dengan tali miring (penguraian gaya), W = F s cos θ,
// tiga kasus tanda (+, 0, −), dan tas yang dipegang diam (W = 0).

const FLOOR = 740;
const TH = (35 * Math.PI) / 180;

/** Panel kecil untuk satu kasus tanda usaha; animasi berulang yang mulus. */
const SignPanel: React.FC<{
  cx: number;
  t: number;
  op: number;
  kind: 'pos' | 'zero' | 'neg';
}> = ({cx, t, op, kind}) => {
  if (op <= 0.001) return null;
  const P = 3.4;
  const ph = ((t % P) + P) % P / P;
  const tau = ph * P;
  const loopOp = Math.min(1, ph * 9, (1 - ph) * 9);
  const x0 = cx - 190;
  const floor = 720;
  // gerak dalam panel (≤ 200 px, tidak menabrak batang K): + dipercepat, 0 tetap, − diperlambat sampai berhenti
  const u = tau / P;
  const TR = 200;
  let x = x0;
  let vRel = 0;
  if (kind === 'pos') {
    x = x0 + TR * u * u;
    vRel = u;
  } else if (kind === 'zero') {
    x = x0 + TR * u;
    vRel = 0.6;
  } else {
    x = x0 + TR * (1 - (1 - u) * (1 - u));
    vRel = 1 - u;
  }
  const v = vRel * 140;
  const kRel = vRel * vRel;
  const color = kind === 'pos' ? C.work : kind === 'zero' ? C.muted : C.heat;
  const title = kind === 'pos' ? 'W > 0' : kind === 'zero' ? 'W = 0' : 'W < 0';
  const sub = kind === 'pos' ? 'gaya searah gerak · θ < 90°' : kind === 'zero' ? 'gaya tegak lurus · θ = 90°' : 'gaya melawan gerak · θ > 90°';
  const bx = x + 50;
  return (
    <g opacity={op}>
      <rect x={cx - 250} y={380} width={500} height={470} rx={22} fill="rgba(10,16,36,0.72)" stroke={color} strokeOpacity={0.6} strokeWidth={2} />
      <Label x={cx} y={430} size={44} font="serif" italic weight={600} color={color}>
        {title}
      </Label>
      <Label x={cx} y={482} size={24} color={C.muted}>
        {sub}
      </Label>
      <line x1={cx - 225} y1={floor} x2={cx + 225} y2={floor} stroke={kind === 'neg' ? C.muted : C.ink} strokeWidth={3} />
      {kind === 'neg'
        ? Array.from({length: 22}, (_, i) => <line key={i} x1={cx - 220 + i * 20} y1={floor + 2} x2={cx - 232 + i * 20} y2={floor + 18} stroke={C.faint} strokeWidth={2} />)
        : null}
      <clipPath id={`clip-${kind}`}>
        <rect x={cx - 250} y={380} width={430} height={470} rx={22} />
      </clipPath>
      <g opacity={loopOp} clipPath={`url(#clip-${kind})`}>
        <rect x={x} y={floor - 80} width={100} height={80} rx={10} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
        {kind === 'pos' ? <Arrow x1={bx + 52} y1={floor - 40} x2={bx + 120} y2={floor - 40} color="force" width={5} /> : null}
        {kind === 'zero' ? <Arrow x1={bx} y1={floor - 86} x2={bx} y2={floor - 180} color="force" width={5} /> : null}
        {kind === 'neg' && v > 2 ? <Arrow x1={x - 2} y1={floor - 10} x2={x - 92} y2={floor - 10} color="heat" width={5} /> : null}
        {/* kecepatan */}
        {v > 2 ? <Arrow x1={bx - 30} y1={floor - 112} x2={bx - 30 + v * 0.6} y2={floor - 112} color="kin" width={3} opacity={kind === 'zero' ? 0 : 1} /> : null}
      </g>
      {/* batang K */}
      <rect x={cx + 190} y={560} width={34} height={140} rx={6} fill={C.kin} opacity={0.1} />
      <rect x={cx + 190} y={700 - 140 * Math.min(1, kRel) * loopOp + 0} width={34} height={140 * Math.min(1, kRel) * loopOp} rx={6} fill={C.kin} />
      <Label x={cx + 207} y={540} size={26} font="serif" italic color={C.kin}>
        K
      </Label>
      <Label x={cx - 20} y={800} size={26} color={color} weight={600}>
        {kind === 'pos' ? 'energi masuk → makin cepat' : kind === 'zero' ? 'tidak ada energi berpindah' : 'energi diambil → melambat'}
      </Label>
    </g>
  );
};

export const Work: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---- definisi (baris 0–1) ----
  const daily = win(t, 0.4, cue(1) + 0.2, 0.7, 0.7);
  const defn = win(t, cue(1) + 0.3, cue(2) - 0.1, 0.8, 0.7);
  const pushT = t - (cue(1) + 0.8);
  const pushX = 560 + (pushT > 0 ? Math.min(380, 12 * pushT * pushT) : 0);

  // ---- koper & tali (baris 2–6) ----
  const scene2 = win(t, cue(2) - 0.2, cue(8) - 0.5, 0.8, 0.6);
  const sx = 380 + 8 * Math.max(0, t - cue(2)); // laju tetap
  const hx = sx; // titik tali pada pegangan
  const hy = FLOOR - 150 - 22;
  const FL = 380;
  const fx = hx + FL * Math.cos(TH);
  const fy = hy - FL * Math.sin(TH);
  const decomp = ramp(t, wordOf(3, 'dua') - 0.1, wordOf(3, 'dua') + 1.2);
  const perpHi = win(t, cue(4), cue(5) + 0.2, 0.6, 0.6);
  const parHi = ramp(t, cue(5) + 0.2, cue(5) + 1.0);
  const sArrow = ramp(t, cue(6) + 0.3, cue(6) + 1.3);
  const formula = win(t, cue(6) + 0.4, cue(11) - 0.2, 0.8, 0.7);
  const cosHi = win(t, cue(7), cue(8) + 0.4, 0.4, 0.6);

  // ---- tiga kasus tanda (baris 8–10) ----
  const pPos = win(t, cue(8) - 0.2, cue(11) - 0.3, 0.7, 0.7);
  const pZero = win(t, cue(9) - 0.2, cue(11) - 0.3, 0.7, 0.7);
  const pNeg = win(t, cue(10) - 0.2, cue(11) - 0.3, 0.7, 0.7);

  // ---- tas dipegang diam (baris 11–12) ----
  const bag = ramp(t, cue(11) + 0.2, cue(11) + 1.2);
  const muscle = ramp(t, wordOf(12, 'Pegalnya') - 0.2, wordOf(12, 'Pegalnya') + 1);
  const PS = 1.9;
  const PY = 800;
  const shoulder = {x: 820, y: PY - 128 * PS};
  const handX = 905;
  const handY = PY - 82 * PS;

  return (
    <AbsoluteFill>
      <Stage>
        {/* definisi: dorongan memindahkan energi ke peti */}
        <g opacity={defn}>
          <Ground x1={360} x2={1560} y={FLOOR} />
          <Crate x={pushX} y={FLOOR} w={160} h={120} color={C.pot} />
          <Arrow x1={pushX - 230} y1={FLOOR - 60} x2={pushX - 92} y2={FLOOR - 60} color="force" width={7} />
          <Label x={pushX - 170} y={FLOOR - 100} size={30} font="serif" italic color={C.force}>
            F
          </Label>
          {Array.from({length: 6}, (_, i) => {
            const ph = (t * 0.8 + i / 6) % 1;
            return <Spark key={i} x={mix(pushX - 220, pushX - 20, ph)} y={FLOOR - 60 + 14 * Math.sin(i * 2 + ph * 6)} r={6} color="work" opacity={Math.min(1, ph * 6) * (1 - ph)} />;
          })}
        </g>

        {/* koper ditarik tali miring */}
        <g opacity={scene2}>
          <Ground x1={200} x2={1720} y={FLOOR} />
          <Glow x={hx + 80} y={hy} r={180} color="work" opacity={0.5 * parHi} />
          <Crate x={sx} y={FLOOR} w={230} h={150} label="koper" color={C.pot} handle />
          {/* tali */}
          <line x1={hx} y1={hy} x2={hx + 500 * Math.cos(TH)} y2={hy - 500 * Math.sin(TH)} stroke={C.muted} strokeWidth={4} />
          <circle cx={hx + 500 * Math.cos(TH)} cy={hy - 500 * Math.sin(TH)} r={14} fill="#1a2550" stroke={C.ink} strokeWidth={3} />
          {/* sudut θ */}
          <path d={`M${hx + 90},${hy} A90,90 0 0 0 ${hx + 90 * Math.cos(TH)},${hy - 90 * Math.sin(TH)}`} fill="none" stroke={C.gold} strokeWidth={3} opacity={ramp(t, cue(2) + 1, cue(2) + 2)} />
          <Label x={hx + 116} y={hy - 30} size={30} font="serif" italic color={C.gold} opacity={ramp(t, cue(2) + 1, cue(2) + 2)}>
            θ
          </Label>
          {/* gaya F */}
          <Arrow x1={hx} y1={hy} x2={fx} y2={fy} color="force" width={7} opacity={ramp(t, cue(2) + 0.6, cue(2) + 1.4)} />
          <Label x={fx + 10} y={fy - 34} size={34} font="serif" italic color={C.force} weight={600} opacity={ramp(t, cue(2) + 0.6, cue(2) + 1.4)}>
            F
          </Label>
          {/* komponen */}
          <g opacity={decomp}>
            <line x1={fx} y1={fy} x2={fx} y2={hy} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={fx} y1={fy} x2={hx} y2={fy} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
            <Arrow x1={hx} y1={hy} x2={hx + (fx - hx) * decomp} y2={hy} color="force" width={7} opacity={1 - parHi} />
            <Arrow x1={hx} y1={hy} x2={hx + (fx - hx) * decomp} y2={hy} color="work" width={7} opacity={parHi} />
            <Arrow x1={hx} y1={hy} x2={hx} y2={hy - (hy - fy) * decomp} color="cyan" width={6} opacity={1 - 0.6 * parHi} />
            <Label x={fx + 22} y={hy} size={32} font="serif" italic color={C.ink} anchor="start">
              F cos θ
            </Label>
            <Label x={hx - 20} y={(hy + fy) / 2} size={32} font="serif" italic color={C.cyan} anchor="end" opacity={1 - 0.6 * parHi}>
              F sin θ
            </Label>
          </g>
          <g opacity={perpHi}>
            <Label x={hx - 20} y={fy - 60} size={26} color={C.cyan} anchor="end">
              mengurangi tekanan ke lantai
            </Label>
            <Label x={hx - 20} y={fy - 26} size={26} color={C.cyan} anchor="end">
              tidak mempercepat ke depan
            </Label>
          </g>
          <g opacity={parHi}>
            <Label x={fx + 22} y={hy + 40} size={26} color={C.work} weight={600} anchor="start">
              memindahkan energi
            </Label>
          </g>
          {/* perpindahan s */}
          <g opacity={sArrow}>
            <Arrow x1={380 - 115} y1={FLOOR + 40} x2={sx - 115} y2={FLOOR + 40} color="cyan" width={5} />
            <Label x={(380 + sx) / 2 - 115} y={FLOOR + 76} size={30} font="serif" italic color={C.cyan}>
              s
            </Label>
          </g>
        </g>

        <SignPanel cx={400} t={t - cue(8)} op={pPos} kind="pos" />
        <SignPanel cx={960} t={t - cue(9)} op={pZero} kind="zero" />
        <SignPanel cx={1520} t={t - cue(10)} op={pNeg} kind="neg" />

        {/* tas dipegang diam */}
        <g opacity={bag}>
          <line x1={520} y1={PY} x2={1120} y2={PY} stroke={C.ink} strokeWidth={3} />
          <Person x={820} y={PY} scale={PS} arm={0} />
          <line x1={shoulder.x} y1={shoulder.y} x2={handX} y2={handY} stroke={C.ink} strokeWidth={7 * PS} strokeLinecap="round" />
          <line x1={handX} y1={handY} x2={handX} y2={handY + 36} stroke={C.muted} strokeWidth={4} />
          <rect x={handX - 55} y={handY + 36} width={110} height={100} rx={14} fill="url(#crate)" stroke={C.pot} strokeWidth={3} />
          <Arrow x1={handX + 95} y1={handY + 130} x2={handX + 95} y2={handY + 10} color="force" width={6} />
          <Label x={handX + 120} y={handY + 70} size={32} font="serif" italic color={C.force} anchor="start">
            F
          </Label>
          <Label x={handX + 70} y={PY + 40} size={28} color={C.cyan} anchor="start">
            perpindahan s = 0
          </Label>
          <g opacity={muscle}>
            <Glow x={(shoulder.x + handX) / 2} y={(shoulder.y + handY) / 2} r={110} color="heat" opacity={0.6 + 0.2 * Math.sin(t * 6)} />
            {Array.from({length: 6}, (_, i) => {
              const ph = (t * 0.7 + i / 6) % 1;
              return <Spark key={i} x={(shoulder.x + handX) / 2 + 30 * Math.sin(i * 3 + t)} y={(shoulder.y + handY) / 2 - ph * 120} r={5} color="heat" opacity={Math.min(1, ph * 6) * (1 - ph)} />;
            })}
            <Label x={760} y={420} size={28} color={C.heat} anchor="end">
              otot terus berkontraksi
            </Label>
            <Label x={760} y={456} size={24} color={C.heat} anchor="end">
              (energi dipakai di dalam tubuh)
            </Label>
          </g>
        </g>
      </Stage>

      <Card x={960} y={330} opacity={daily} accent={C.muted} style={{padding: '18px 36px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 44, color: C.muted}}>
          sehari-hari: usaha = <span style={{color: C.ink}}>berjuang keras</span>
        </div>
      </Card>
      <Card x={960} y={330} opacity={defn} accent={C.work} style={{padding: '18px 36px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 44}}>
          fisika: usaha = <span style={{color: C.work}}>energi yang dipindahkan gaya</span>
        </div>
        <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 6, textAlign: 'center'}}>saat titik kerja gaya ikut berpindah</div>
      </Card>

      <Formula x={1360} y={255} p={formula} accent={C.work} size={64}>
        <V color={C.work}>W</V> = <V color={C.force}>F</V> <V color={C.cyan}>s</V>{' '}
        <span style={{color: interpolateColors(cosHi, [0, 1], [C.ink, C.gold]), textShadow: `0 0 ${24 * cosHi}px rgba(255,201,74,0.8)`}}>cos θ</span>
      </Formula>
      <Card x={1360} y={420} opacity={win(t, cue(7) + 0.3, cue(8) - 0.3, 0.6, 0.5)} accent={C.gold} style={{padding: '14px 28px'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, lineHeight: 1.55}}>
          <div>
            θ &lt; 90° → cos θ &gt; 0 → <span style={{color: C.work, fontWeight: 700}}>+</span>
          </div>
          <div>
            θ = 90° → cos θ = 0 → <span style={{color: C.muted, fontWeight: 700}}>0</span>
          </div>
          <div>
            θ &gt; 90° → cos θ &lt; 0 → <span style={{color: C.heat, fontWeight: 700}}>−</span>
          </div>
        </div>
      </Card>
      <Formula x={1450} y={560} p={bag * ramp(t, cue(11) + 1.2, cue(11) + 2.2)} accent={C.work} size={60} caption="tas tidak berpindah, tidak ada energi masuk ke tas">
        <V color={C.work}>
          W<TSubHtml>tangan</TSubHtml>
        </V>{' '}
        = <V color={C.force}>F</V> · <span style={{color: C.cyan}}>0</span> = 0
      </Formula>
    </AbsoluteFill>
  );
};

const TSubHtml: React.FC<{children: React.ReactNode}> = ({children}) => (
  <sub style={{fontSize: '0.55em', verticalAlign: '-0.3em', lineHeight: 0, fontStyle: 'normal'}}>{children}</sub>
);
