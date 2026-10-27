import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Person, fmt} from '../components/physics';
import {Card, Formula, Frac, Glow, Label, Note, Stage, Sub, Sup, TSub, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Energi di rumah (kWh) & di tubuh (daya, efisiensi otot, kalori makanan).
// Setrika 1000 W × 2 jam = 2 kWh = 7,2 MJ → cukup mengangkat 70 kg setinggi 7,2e6/(70·10) ≈ 10,3 km.
// Lari naik tangga 3 m dalam 3 s: 70·10·3/3 = 700 W.

const ALT = {x: 1330, y0: 800, y12: 250}; // sumbu ketinggian 0–12 km
const altY = (km: number) => ALT.y0 - (km / 12) * (ALT.y0 - ALT.y12);

const STAIR = {x0: 200, y0: 800, run: 60, rise: 35, n: 10};
const stairTopX = STAIR.x0 + STAIR.run * STAIR.n;
const stairTopY = STAIR.y0 - STAIR.rise * STAIR.n;

const Iron: React.FC<{x: number; y: number; heat: number}> = ({x, y, heat}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={10} rx={130} ry={40} fill="url(#soft-heat)" opacity={heat} />
    <path d="M-110,0 L90,0 Q120,0 120,-20 L60,-70 L-60,-70 Q-110,-70 -110,-20 Z" fill="#1e2a55" stroke={C.muted} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-110,0 L120,0" stroke={C.heat} strokeWidth={6} strokeOpacity={0.3 + 0.7 * heat} strokeLinecap="round" />
    <path d="M-40,-70 Q-40,-120 0,-120 L60,-120 Q80,-120 70,-95" fill="none" stroke={C.muted} strokeWidth={10} strokeLinecap="round" />
    <circle cx={30} cy={-40} r={8} fill={C.heat} opacity={0.3 + 0.7 * heat} />
  </g>
);

export const Home: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const panelA = win(t, 0, cue(3) - 0.4, 0.9, 0.7);
  const panelB = ramp(t, cue(3) + 0.1, cue(3) + 1.0);

  // ---- panel A: meter kWh & setrika ----
  const on = ramp(t, cue(1) + 0.6, cue(1) + 1.0);
  const run = ramp(t, cue(1) + 1.0, cueEnd(1) - 0.3, EASE_IN_OUT); // 0 → 2 jam
  const kwh = 2 * run;
  const discAng = 360 * 6 * run;
  const chips = win(t, cue(0) + 1.2, cue(1) + 0.4, 0.6, 0.5);
  const eCard = win(t, cue(1) + 1.2, cue(2) + 0.2, 0.7, 0.5);
  const alt = ramp(t, cue(2) + 0.2, cue(2) + 1.2);
  const lift = ramp(t, cue(2) + 1.5, cueEnd(2) - 1.5, EASE_IN_OUT);
  const kmNow = 10.3 * lift;
  const hCard = ramp(t, cue(2) + 2.5, cue(2) + 3.4);

  // ---- panel B: tangga ----
  const tRun = cue(3) + 2.0;
  const s = ramp(t, tRun, tRun + 3, (x) => x); // kelajuan tetap 3 s
  const runT = 3 * s;
  const px = mix(STAIR.x0 + 40, stairTopX - 10, s);
  const py = mix(STAIR.y0, stairTopY, s);
  const stepPhase = s * STAIR.n * Math.PI;
  const ug = 70 * 10 * 3 * s;
  const pCard = win(t, cue(3) + 4.0, cue(4) + 0.3, 0.7, 0.5);
  const flow = win(t, cue(4) + 0.6, cue(5) - 0.1, 0.7, 0.5);
  const flowP = ramp(t, cue(4) + 0.8, cue(4) + 3.0, EASE_IN_OUT);
  const sweat = ramp(t, cue(4) + 2.5, cue(4) + 3.5);
  const food = ramp(t, cue(5) + 0.3, cue(5) + 1.1);
  const kalCard = ramp(t, cue(5) + 2.4, cue(5) + 3.2);

  // pita Sankey (efisiensi otot)
  const SX0 = 1090;
  const SX1 = 1640;
  const top = 400;
  const H = 330;
  const usefulH = H * 0.25;
  const ribbon = (y0a: number, y0b: number, y1a: number, y1b: number) =>
    `M${SX0},${y0a} C${(SX0 + SX1) / 2},${y0a} ${(SX0 + SX1) / 2},${y1a} ${SX1},${y1a} L${SX1},${y1b} C${(SX0 + SX1) / 2},${y1b} ${(SX0 + SX1) / 2},${y0b} ${SX0},${y0b} Z`;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= PANEL A ================= */}
        <g opacity={panelA}>
          {/* meter kWh */}
          <g transform="translate(430 450)">
            <rect x={-200} y={-150} width={400} height={270} rx={22} fill="#101a3a" stroke={C.muted} strokeWidth={3} />
            <Label x={0} y={-118} size={22} color={C.muted} weight={600} spacing={3}>
              METER LISTRIK
            </Label>
            <rect x={-160} y={-90} width={320} height={80} rx={10} fill="#050914" stroke={C.gold} strokeWidth={2} />
            <text x={110} y={-50} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={600} fontSize={46} fill={C.gold}>
              {fmt(kwh, 2)}
            </text>
            <text x={145} y={-44} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontSize={20} fill={C.muted}>
              kWh
            </text>
            <ellipse cx={0} cy={50} rx={90} ry={18} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            <line x1={90 * Math.cos((discAng * Math.PI) / 180)} y1={50} x2={90 * Math.cos((discAng * Math.PI) / 180)} y2={50 + 18 * Math.sin((discAng * Math.PI) / 180) * 0.0 + 0} stroke={C.gold} strokeWidth={6} />
            <circle cx={90 * Math.cos((discAng * Math.PI) / 180)} cy={50 + 18 * Math.sin((discAng * Math.PI) / 180)} r={7} fill={C.heat} />
          </g>
          {/* kabel ke setrika */}
          <path d="M430,570 Q430,640 520,660 Q600,676 610,700" fill="none" stroke={C.muted} strokeWidth={4} />
          <Iron x={700} y={790} heat={on * (0.6 + 0.4 * Math.sin(t * 3) ** 2)} />
          <Label x={700} y={830} size={24} color={C.ink} weight={600}>
            setrika 1000 W
          </Label>
          {/* jam 2 jam */}
          <g transform="translate(200 740)">
            <circle r={58} fill="#101a3a" stroke={C.muted} strokeWidth={3} />
            <path d={`M0,0 L0,-50 A50,50 0 ${run > 0.5 ? 1 : 0} 1 ${50 * Math.sin(run * 2 * Math.PI * 0.999)},${-50 * Math.cos(run * 2 * Math.PI * 0.999)} Z`} fill={C.cyan} opacity={0.3 * Math.min(1, run * 50)} />
            <line x1={0} y1={0} x2={44 * Math.sin(run * 4 * Math.PI)} y2={-44 * Math.cos(run * 4 * Math.PI)} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            <Label x={0} y={88} size={24} font="mono" color={C.cyan}>
              {`${fmt(2 * run, 1)} jam`}
            </Label>
          </g>
          {/* sumbu ketinggian */}
          <g opacity={alt}>
            <line x1={ALT.x} y1={ALT.y0} x2={ALT.x} y2={ALT.y12 - 20} stroke={C.muted} strokeWidth={3} markerEnd="url(#arrow-muted)" />
            {[0, 2, 4, 6, 8, 10, 12].map((k) => (
              <g key={k}>
                <line x1={ALT.x - 8} y1={altY(k)} x2={ALT.x + 8} y2={altY(k)} stroke={C.muted} strokeWidth={2} />
                <Label x={ALT.x - 20} y={altY(k)} size={20} font="mono" color={C.muted} anchor="end">
                  {`${k} km`}
                </Label>
              </g>
            ))}
            <path d={`M1400,${ALT.y0} L1520,${altY(5.5)} L1560,${altY(7)} L1600,${altY(8.85)} L1650,${altY(7.4)} L1720,${altY(5)} L1820,${ALT.y0} Z`} fill="#1b2650" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M1560,${altY(7)} L1600,${altY(8.85)} L1650,${altY(7.4)} L1625,${altY(7.6)} L1600,${altY(7.1)} L1580,${altY(7.5)} Z`} fill="#e8efff" opacity={0.8} />
            <Label x={1660} y={altY(8.85) - 6} size={22} color={C.muted} anchor="start">
              Everest ≈ 8,8 km
            </Label>
            <line x1={ALT.x} y1={altY(10.3)} x2={1800} y2={altY(10.3)} stroke={C.pot} strokeWidth={2} strokeDasharray="8 8" opacity={ramp(lift, 0.9, 1)} />
            <g transform={`translate(${ALT.x + 60} ${altY(kmNow)})`}>
              <circle cx={0} cy={-36} r={60} fill="url(#soft-pot)" opacity={0.8} />
              <Person x={0} y={0} scale={0.42} color={C.pot} />
            </g>
            <Label x={ALT.x + 100} y={altY(kmNow) - 40} size={28} font="mono" color={C.pot} anchor="start" weight={600}>
              {`${fmt(kmNow, 1)} km`}
            </Label>
          </g>
        </g>

        {/* ================= PANEL B ================= */}
        <g opacity={panelB}>
          {/* tangga */}
          <path
            d={
              `M${STAIR.x0 - 80},${STAIR.y0} ` +
              Array.from({length: STAIR.n}, (_, i) => `H${STAIR.x0 + i * STAIR.run} V${STAIR.y0 - (i + 1) * STAIR.rise}`).join(' ') +
              ` H${stairTopX + 140} V${STAIR.y0} Z`
            }
            fill="#141e42"
            stroke={C.muted}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <g opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.8)}>
            <line x1={stairTopX + 180} y1={STAIR.y0} x2={stairTopX + 180} y2={stairTopY} stroke={C.pot} strokeWidth={3} markerStart="url(#arrow-pot)" markerEnd="url(#arrow-pot)" />
            <Label x={stairTopX + 198} y={(STAIR.y0 + stairTopY) / 2} size={30} color={C.pot} anchor="start" weight={600}>
              3 m
            </Label>
          </g>
          <Glow x={px} y={py - 70} r={150} color="heat" opacity={0.6 * sweat} />
          <Person x={px} y={py - 6 * Math.abs(Math.sin(stepPhase))} phase={stepPhase} scale={0.62} color={C.ink} arm={s > 0 && s < 1 ? undefined : 0} />
          {Array.from({length: 5}, (_, i) => {
            const ph = (((t * 0.8 + i / 5) % 1) + 1) % 1;
            return <path key={i} d={`M${px + (rand(i) - 0.5) * 50},${py - 112 + ph * 60} q4,-10 0,-14 q-4,4 0,14 Z`} fill={C.cyan} opacity={cyc(ph) * sweat} />;
          })}
          <Label x={180} y={232} size={30} font="mono" color={C.ink} anchor="start" weight={600} opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.8)}>
            {`t = ${fmt(runT, 1)} s`}
          </Label>
          <Label x={180} y={278} size={26} font="mono" color={C.pot} anchor="start" opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.8)}>
            {`Ug naik: ${fmt(ug)} J`}
          </Label>
          <Label x={180} y={318} size={22} color={C.muted} anchor="start" opacity={ramp(t, cue(3) + 1.0, cue(3) + 1.8)}>
            orang 70 kg
          </Label>
          {/* Sankey efisiensi otot */}
          <g opacity={flow}>
            <Label x={(SX0 + SX1) / 2} y={top - 50} size={24} color={C.muted} weight={600} spacing={2}>
              ENERGI DARI MAKANAN
            </Label>
            <rect x={SX0 - 40} y={top} width={40} height={H} rx={6} fill={C.gold} />
            <g opacity={flowP}>
              <path d={ribbon(top, top + usefulH, top - 10, top - 10 + usefulH)} fill={C.work} opacity={0.75} />
              <path d={ribbon(top + usefulH, top + H, top + usefulH + 40, top + H + 40)} fill={C.heat} opacity={0.7} />
            </g>
            <Label x={SX1 + 16} y={top - 10 + usefulH / 2} size={26} color={C.work} anchor="start" weight={600} opacity={flowP}>
              ≈ 25 % usaha
            </Label>
            <Label x={SX1 + 16} y={top + usefulH + 40 + (H - usefulH) / 2} size={26} color={C.heat} anchor="start" weight={600} opacity={flowP}>
              ≈ 75 % panas
            </Label>
            <Label x={SX0 - 20} y={top + H + 30} size={22} color={C.gold}>
              100 %
            </Label>
          </g>
        </g>
      </Stage>

      {/* ---- kartu panel A ---- */}
      <div style={{position: 'absolute', left: 1080, top: 300, display: 'flex', flexDirection: 'column', gap: 24, opacity: chips * panelA}}>
        <div style={{fontFamily: FONT.head, fontSize: 34, color: C.muted, padding: '14px 26px', borderRadius: 14, border: `2px solid ${C.line}`, background: 'rgba(10,16,36,0.85)'}}>
          daya: <b style={{color: C.cyan}}>watt</b> — seberapa cepat
        </div>
        <div style={{fontFamily: FONT.head, fontSize: 34, color: C.ink, padding: '14px 26px', borderRadius: 14, border: `2px solid ${C.gold}`, background: 'rgba(10,16,36,0.85)', boxShadow: `0 0 26px ${C.gold}44`}}>
          tagihan: <b style={{color: C.gold}}>kilowatt jam</b> — berapa banyak energi
        </div>
      </div>
      <Formula x={1400} y={420} p={eCard} accent={C.gold} size={58} caption="1 kWh = 3,6 × 10⁶ J  →  2 kWh ≈ 7,2 × 10⁶ J">
        <V>E</V> = <V>P t</V> = 1 kW × 2 jam = 2 kWh
      </Formula>
      <Formula x={540} y={250} p={hCard * panelA} accent={C.pot} size={50} caption="massa 70 kg, g = 10 m/s²">
        <V>h</V> ={' '}
        <Frac
          n={<V>E</V>}
          d={
            <>
              <V>m g</V>
            </>
          }
        />{' '}
        ={' '}
        <Frac
          n={
            <>
              7,2 × 10<Sup>6</Sup> J
            </>
          }
          d="700 N"
        />{' '}
        ≈ 10,3 km
      </Formula>

      {/* ---- kartu panel B ---- */}
      <Formula x={1420} y={340} p={pCard * panelB} accent={C.cyan} size={56} caption="daya = energi dibagi waktu">
        <V>P</V> ={' '}
        <Frac
          n={
            <>
              <V>m g h</V>
            </>
          }
          d={<V>t</V>}
        />{' '}
        ={' '}
        <Frac n="2100 J" d="3 s" /> = 700 W
      </Formula>
      <Note x={1360} y={800} p={sweat * flow} color={C.heat} size={26}>
        panas berlebih dibuang lewat keringat
      </Note>
      <Card x={1420} y={360} opacity={food * panelB} accent={C.gold} style={{padding: '20px 34px', width: 520, whiteSpace: 'normal'}}>
        <div style={{fontFamily: FONT.head, fontSize: 30, fontWeight: 700, borderBottom: `3px solid ${C.ink}`, paddingBottom: 8}}>Informasi Nilai Gizi</div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT.head, fontSize: 28, marginTop: 12}}>
          <span>Energi total</span>
          <b style={{color: C.gold}}>250 kkal</b>
        </div>
        <div style={{fontFamily: FONT.sans, fontSize: 22, color: C.muted, marginTop: 8}}>sering ditulis "250 kalori" ≈ 1,05 juta joule</div>
      </Card>
      <Formula x={1420} y={640} p={kalCard * panelB} accent={C.gold} size={58} caption="kalori pada label makanan = kilokalori">
        1 kkal ≈ 4184 J
      </Formula>
      <div style={{display: 'none'}}>
        <Sub>.</Sub>
        <TSub>.</TSub>
      </div>
    </AbsoluteFill>
  );
};
