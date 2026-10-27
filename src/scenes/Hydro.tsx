import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {EnergyBars, ELabel} from '../components/physics';
import {Formula, Glow, Label, Note, Stage, Sub, TSub, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// PLTA: waduk (Ug) → pipa pesat (K) → turbin & generator (listrik) → jaringan.
// Satu "paket" air 1 kg dilacak; batang energinya per kg (g = 10 m/s², h = 100 m → 1000 J/kg).
const SURF = 330; // permukaan waduk
const TURB = {x: 985, y: 760}; // turbin
const P0 = {x: 612, y: 382}; // mulut pipa (intake)
const P1 = {x: TURB.x - 18, y: TURB.y - 14};
const hOf = (y: number) => ((P1.y - y) / (P1.y - SURF)) * 100; // meter di atas turbin (h = 100 m dari permukaan)

/** Sudut putar untuk laju sudut yang naik linear dari 0 (t1) ke w (t2), lalu tetap. */
const spinAngle = (t: number, t1: number, t2: number, w: number) => {
  if (t <= t1) return 0;
  if (t <= t2) return (w * (t - t1) ** 2) / (2 * (t2 - t1));
  return w * ((t2 - t1) / 2 + (t - t2));
};

export const Hydro: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const sceneIn = ramp(t, 0, 1.2);
  const resGlow = win(t, cue(0) + 0.3, cue(1) + 1, 0.8, 1.0);
  const flowOn = ramp(t, cue(1) + 0.4, cue(1) + 1.6);
  const rot = spinAngle(t, cue(1) + 0.6, cue(1) + 3.5, 260);

  // paket air yang dilacak
  const tStart = cue(1) + 1.6;
  const tIntake = tStart + 0.9;
  const T_PIPE = 2.8;
  const tTurb = tIntake + T_PIPE;
  const tConv = tTurb + 1.4;
  let px: number;
  let py: number;
  if (t < tIntake) {
    const q = ramp(t, tStart, tIntake, EASE_IN_OUT);
    px = mix(560, P0.x, q);
    py = mix(SURF, P0.y, q);
  } else {
    // percepatan tetap di pipa miring licin: u = (τ/T)²
    const u = Math.min(1, ((t - tIntake) / T_PIPE) ** 2);
    px = mix(P0.x, P1.x, u);
    py = mix(P0.y, P1.y, u);
  }
  const Ug = Math.max(0, hOf(py)) * 10; // J/kg
  const conv = ramp(t, tTurb, tConv, EASE_IN_OUT);
  const Kraw = Math.max(0, 1000 - Ug);
  const K = Kraw * (1 - conv);
  const Elec = Kraw * conv * 0.9;
  const Eth = Kraw * conv * 0.1;
  const parcelOn = win(t, tStart - 0.3, tTurb + 0.2, 0.4, 0.5);
  const bars = ramp(t, cue(1) + 0.8, cue(1) + 1.8);

  const cardA = win(t, cue(2) + 1.0, cue(4) - 0.2, 0.7, 0.5);
  const cardB = win(t, cue(4) + 0.2, mix(cue(4), cueEnd(4), 0.45), 0.7, 0.5);
  const cardC = ramp(t, mix(cue(4), cueEnd(4), 0.45) + 0.45, mix(cue(4), cueEnd(4), 0.45) + 1.2);
  const slab = win(t, cue(2) + 0.4, cue(3), 0.6, 0.6);
  const note1 = win(t, cue(3) + 0.3, cue(5) - 0.2, 0.6, 0.5);
  const note2 = ramp(t, cue(5) + 0.4, cue(5) + 1.2);
  const hPulse = cue(5) < t ? 0.5 + 0.5 * Math.sin((t - cue(5)) * 4) : 0;
  const hBr = ramp(t, cue(2) + 2.5, cue(2) + 3.5);

  // partikel air di pipa: dipercepat (u ∝ τ²), muncul bergiliran tanpa "pop"
  const N = 16;
  const pipeDrops = Array.from({length: N}, (_, i) => {
    const ph = (((t * 0.36 + i / N) % 1) + 1) % 1;
    const u = ph * ph;
    return {x: mix(P0.x, P1.x, u) + (rand(i) - 0.5) * 10, y: mix(P0.y, P1.y, u) + (rand(i * 3) - 0.5) * 10, o: cyc(ph) * flowOn, r: 3 + 3 * u};
  });
  // aliran buangan setelah turbin
  const tail = Array.from({length: 10}, (_, i) => {
    const ph = (((t * 0.3 + i / 10) % 1) + 1) % 1;
    return {x: mix(1100, 1260, ph), y: 792 + 4 * Math.sin(ph * 9 + i), o: cyc(ph) * flowOn};
  });
  // percikan listrik di kabel
  const sparks = Array.from({length: 6}, (_, i) => {
    const ph = (((t * 0.5 + i / 6) % 1) + 1) % 1;
    return {x: mix(1060, 1290, ph), y: mix(640, 560, ph) + 18 * Math.sin(Math.PI * ph), o: cyc(ph) * ramp(t, cue(1) + 3.5, cue(1) + 4.5)};
  });

  return (
    <AbsoluteFill style={{opacity: sceneIn}}>
      <Stage>
        <Glow x={360} y={480} r={360} color="pot" opacity={0.5 * resGlow + 0.15} />
        {/* lereng gunung & dasar lembah */}
        <path d="M80,250 Q200,300 260,420 L600,800 L1300,800 L1300,860 L80,860 Z" fill="#111a38" stroke={C.faint} strokeWidth={3} />
        {/* air waduk */}
        <path d={`M210,${SURF} L600,${SURF} L600,800 L540,732 Q330,470 210,${SURF} Z`} fill="url(#water)" opacity={0.92} />
        {Array.from({length: 5}, (_, i) => (
          <path
            key={i}
            d={`M${250 + i * 70 + 10 * Math.sin(t + i)},${SURF + 6 + i * 3} q16,-5 32,0`}
            fill="none"
            stroke="#bfe0ff"
            strokeOpacity={0.45}
            strokeWidth={2}
          />
        ))}
        <Label x={380} y={430} size={30} color={C.ink} weight={600}>
          waduk
        </Label>
        <Label x={330} y={540} size={24} color={C.ink} opacity={resGlow} weight={600}>
          tabungan <tspan fontStyle="italic">U</tspan>
          <TSub>g</TSub> raksasa
        </Label>
        {/* bendungan */}
        <path d="M600,300 L652,300 L770,800 L600,800 Z" fill="#2a3560" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
        {/* pipa pesat */}
        <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke="#0c1430" strokeWidth={40} strokeLinecap="round" />
        <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke={C.muted} strokeOpacity={0.18} strokeWidth={40} strokeLinecap="round" />
        <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke={C.pot} strokeOpacity={0.35 * flowOn} strokeWidth={24} strokeLinecap="round" />
        {pipeDrops.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#cfe7ff" opacity={d.o} />
        ))}
        <g transform={`translate(${(P0.x + P1.x) / 2 - 29} ${(P0.y + P1.y) / 2 + 28}) rotate(${(Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180) / Math.PI})`}>
          <Label x={0} y={0} size={24} color={C.muted}>
            pipa pesat
          </Label>
        </g>
        {/* rumah pembangkit: turbin + generator */}
        <rect x={925} y={672} width={175} height={128} rx={10} fill="#16224a" stroke={C.muted} strokeWidth={3} />
        <g transform={`translate(${TURB.x} ${TURB.y}) rotate(${rot})`}>
          <circle r={38} fill="#0c1430" stroke={C.cyan} strokeWidth={3} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M0,0 Q14,-14 6,-34" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a})`} />
          ))}
          <circle r={7} fill={C.cyan} />
        </g>
        <rect x={1030} y={694} width={58} height={44} rx={8} fill="#0c1430" stroke={C.cyan} strokeWidth={3} />
        <line x1={TURB.x} y1={TURB.y} x2={1059} y2={716} stroke={C.muted} strokeWidth={5} />
        <Label x={1012} y={830} size={22} color={C.muted}>
          turbin + generator
        </Label>
        {/* jaringan listrik */}
        {[1170, 1270].map((x) => (
          <path key={x} d={`M${x - 22},800 L${x},560 L${x + 22},800 M${x - 30},590 H${x + 30}`} fill="none" stroke={C.muted} strokeWidth={3} />
        ))}
        <path d="M1088,700 Q1130,640 1170,590 Q1220,610 1270,590 L1300,585" fill="none" stroke={C.cyan} strokeOpacity={0.7} strokeWidth={2.5} />
        {sparks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={5} fill={C.cyan} opacity={s.o} />
        ))}
        <Label x={1220} y={530} size={22} color={C.cyan} opacity={ramp(t, cue(1) + 3.5, cue(1) + 4.5)}>
          ke jaringan
        </Label>
        {/* buangan */}
        <path d="M1100,786 L1300,786 L1300,800 L1100,800 Z" fill="url(#water)" opacity={0.6 * flowOn} />
        {tail.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3} fill="#cfe7ff" opacity={d.o} />
        ))}
        {/* tinggi jatuh h */}
        <g opacity={hBr}>
          <line x1={600} y1={SURF} x2={900} y2={SURF} stroke={C.pot} strokeWidth={2} strokeDasharray="8 8" />
          <line x1={880} y1={SURF + 4} x2={880} y2={TURB.y - 4} stroke={C.pot} strokeWidth={3 + 3 * hPulse} markerStart="url(#arrow-pot)" markerEnd="url(#arrow-pot)" />
          <Label x={858} y={(SURF + TURB.y) / 2 - 80} size={40} font="serif" italic color={C.pot} anchor="end" weight={600}>
            h
          </Label>
        </g>
        {/* massa air per detik */}
        <g opacity={slab}>
          <rect x={470} y={SURF + 2} width={120} height={46} rx={6} fill={C.gold} opacity={0.25} stroke={C.gold} strokeWidth={3} />
          <Label x={530} y={SURF - 30} size={26} color={C.gold} weight={600}>
            <tspan fontStyle="italic">ρ Q</tspan> kg tiap detik
          </Label>
        </g>
        {/* paket air yang dilacak */}
        <g opacity={parcelOn}>
          <circle cx={px} cy={py} r={34} fill="url(#soft-gold)" />
          <circle cx={px} cy={py} r={11} fill="#fff" stroke={C.gold} strokeWidth={3} />
        </g>
        <Label x={px - 40} y={py - 36} size={22} color={C.gold} anchor="end" opacity={parcelOn * ramp(t, tStart, tStart + 0.6)}>
          1 kg air
        </Label>

        <EnergyBars
          x={1390}
          y={770}
          height={280}
          barW={60}
          gap={26}
          max={1000}
          unit=""
          title="ENERGI 1 kg AIR (J)"
          opacity={bars}
          bars={[
            {key: 'Ug', label: ELabel.Ug, value: Ug, color: 'pot'},
            {key: 'K', label: ELabel.K, value: K, color: 'kin'},
            {
              key: 'El',
              label: (
                <>
                  E<TSub>el</TSub>
                </>
              ),
              value: Elec,
              color: 'cyan',
            },
            {key: 'Th', label: ELabel.Th, value: Eth, color: 'heat'},
          ]}
        />
        <Label x={1384} y={836} size={18} color={C.muted} anchor="start" opacity={bars}>
          E
          <TSub>el</TSub> = energi listrik
        </Label>
      </Stage>
      <Formula x={1560} y={300} p={cardA} accent={C.pot} size={66} caption="daya = energi tiap detik">
        <V>P</V> = <V>ρ g Q h</V>
      </Formula>
      <Formula x={1560} y={300} p={cardB} accent={C.pot} size={56} caption="1000 · 10 · 100 · 100 watt">
        <V>P</V> ≈ 10<sup style={{fontSize: '0.6em'}}>8</sup> W = 100 MW
      </Formula>
      <Formula x={1560} y={300} p={cardC} accent={C.gold} size={56} caption="efisiensi turbin + generator 90 %">
        <V>P</V>
        <Sub>listrik</Sub> ≈ 90 MW
      </Formula>
      <Note x={440} y={228} p={note1} color={C.pot} size={26}>
        <i>Q</i> = 100 m³/s · <i>h</i> = 100 m · <i>ρ</i> = 1000 kg/m³
      </Note>
      <Note x={440} y={228} p={note2} color={C.pot} size={26}>
        1 liter jatuh 100 m → <i>mgh</i> = 1000 J
      </Note>
    </AbsoluteFill>
  );
};
