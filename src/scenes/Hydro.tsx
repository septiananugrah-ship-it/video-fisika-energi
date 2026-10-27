import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {EnergyBars, ELabel} from '../components/physics';
import {Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// PLTA: waduk (Ug) → pipa pesat (K) → turbin & generator (listrik) → jaringan.
// Satu "paket" air 1 kg dilacak; batang energinya per kg (g = 10 m/s², h = 100 m → 1000 J/kg).
const SURF = 330; // permukaan waduk
const TURB = {x: 985, y: 760}; // turbin
const P0 = {x: 612, y: 382}; // mulut pipa (intake)
const P1 = {x: TURB.x - 18, y: TURB.y - 14};
const hOf = (y: number) => ((P1.y - y) / (P1.y - SURF)) * 100; // meter di atas turbin (h = 100 m dari permukaan)
const PIPE_ANG = (Math.atan2(P1.y - P0.y, P1.x - P0.x) * 180) / Math.PI;

/** Sudut putar untuk laju sudut yang naik linear dari 0 (t1) ke w (t2), lalu tetap. */
const spinAngle = (t: number, t1: number, t2: number, w: number) => {
  if (t <= t1) return 0;
  if (t <= t2) return (w * (t - t1) ** 2) / (2 * (t2 - t1));
  return w * ((t2 - t1) / 2 + (t - t2));
};

// kabel listrik: generator → menara 1 → menara 2 → keluar (melengkung seperti katenari)
const sag = (a: [number, number], b: [number, number], d: number, n = 8): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const u = i / n;
    return [mix(a[0], b[0], u), mix(a[1], b[1], u) + d * 4 * u * (1 - u)];
  });
const LINE: [number, number][] = [...sag([1088, 700], [1170, 590], 10, 4), ...sag([1170, 590], [1270, 590], 16).slice(1), ...sag([1270, 590], [1340, 596], 8, 4).slice(1)];
const lineD = LINE.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/** Awan malam tipis. */
const Cloud: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) =>
  o <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <ellipse cx={0} cy={0} rx={70} ry={18} fill="#22305e" />
      <ellipse cx={-26} cy={-12} rx={34} ry={20} fill="#22305e" />
      <ellipse cx={20} cy={-16} rx={40} ry={24} fill="#283766" />
    </g>
  );

export const Hydro: React.FC = () => {
  const {t, cue, cueEnd} = useScene();
  const sceneIn = ramp(t, 0, 1.2);
  const resGlow = win(t, cue(0) + 0.3, cue(1) + 1, 0.8, 1.0);
  const flowOn = ramp(t, cue(1) + 0.4, cue(1) + 1.6);
  const t1 = cue(1) + 0.6;
  const t2 = cue(1) + 3.5;
  const rot = spinAngle(t, t1, t2, 260);
  const spin = ramp(t, t1, t2, (x) => x); // laju putar relatif
  const elecOn = ramp(t, cue(1) + 3.5, cue(1) + 4.5);

  // paket air yang dilacak
  const tStart = cue(1) + 1.6;
  const tIntake = tStart + 0.9;
  const T_PIPE = 2.8;
  const tTurb = tIntake + T_PIPE;
  const tConv = tTurb + 1.4;
  const parcelAt = (tt: number): [number, number] => {
    if (tt < tIntake) {
      const q = ramp(tt, tStart, tIntake, EASE_IN_OUT);
      return [mix(560, P0.x, q), mix(SURF, P0.y, q)];
    }
    // percepatan tetap di pipa miring licin: u = (τ/T)²
    const u = Math.min(1, ((tt - tIntake) / T_PIPE) ** 2);
    return [mix(P0.x, P1.x, u), mix(P0.y, P1.y, u)];
  };
  const [px, py] = parcelAt(t);
  const Ug = Math.max(0, hOf(py)) * 10; // J/kg
  const conv = ramp(t, tTurb, tConv, EASE_IN_OUT);
  const Kraw = Math.max(0, 1000 - Ug);
  const K = Kraw * (1 - conv);
  const Elec = Kraw * conv * 0.9;
  const Eth = Kraw * conv * 0.1;
  const parcelOn = win(t, tStart - 0.3, tTurb + 0.2, 0.4, 0.5);
  const parcelTrail = [1, 2, 3, 4, 5].map((k) => parcelAt(t - k * 0.07));
  const bars = ramp(t, cue(1) + 0.8, cue(1) + 1.8);

  const cardA = win(t, cue(2) + 1.0, cue(4) - 0.2, 0.7, 0.5);
  const cardB = win(t, cue(4) + 0.2, mix(cue(4), cueEnd(4), 0.45), 0.7, 0.5);
  const tC = mix(cue(4), cueEnd(4), 0.45) + 0.45;
  const cardC = ramp(t, tC, tC + 0.75);
  const slab = win(t, cue(2) + 0.4, cue(3), 0.6, 0.6);
  const note1 = win(t, cue(3) + 0.3, cue(5) - 0.2, 0.6, 0.5);
  const note2 = ramp(t, cue(5) + 0.4, cue(5) + 1.2);
  const hPulse = ramp(t, cue(5), cue(5) + 0.6) * (0.5 - 0.5 * Math.cos((t - cue(5)) * 4));
  const hBr = ramp(t, cue(2) + 2.5, cue(2) + 3.5);

  // kamera: ikut paket air turun ke turbin, lalu kembali
  const cam = win(t, tStart - 0.6, tConv + 0.4, 1.4, 1.6);
  const z = 1 + 0.06 * cam;
  const camX = mix(700, 860, ramp(t, tStart, tTurb, EASE_IN_OUT));
  const camY = mix(520, 640, ramp(t, tStart, tTurb, EASE_IN_OUT));

  // partikel air di pipa: dipercepat (u ∝ τ²), warnanya berubah biru → jingga (Ug → K)
  const N = 16;
  const pipeDrops = Array.from({length: N}, (_, i) => {
    const ph = (((t * 0.36 + i / N) % 1) + 1) % 1;
    const u = ph * ph;
    const u0 = Math.max(0, ph - 0.05) ** 2;
    const ox = (rand(i) - 0.5) * 10;
    const oy = (rand(i * 3) - 0.5) * 10;
    return {
      x: mix(P0.x, P1.x, u) + ox,
      y: mix(P0.y, P1.y, u) + oy,
      x0: mix(P0.x, P1.x, u0) + ox,
      y0: mix(P0.y, P1.y, u0) + oy,
      o: cyc(ph) * flowOn,
      r: 3 + 3 * u,
      col: interpolateColors(u, [0, 1], ['#cfe7ff', C.kin]),
    };
  });
  // semprotan buangan setelah turbin (lintasan parabola)
  const spray = Array.from({length: 16}, (_, i) => {
    const ph = (((t * (0.8 + 0.4 * rand(i)) + i / 16) % 1) + 1) % 1;
    const vx = 90 + 120 * rand(i * 2.1);
    const vy = 60 + 60 * rand(i * 3.7);
    const tt = ph * 1.1;
    return {x: 1100 + vx * tt, y: 782 - vy * tt + 110 * tt * tt, o: cyc(ph) * flowOn * spin, r: 2 + 2 * rand(i * 5.3)};
  });
  // gelombang permukaan waduk
  const wave = (x: number) => SURF + 3 * Math.sin(x * 0.045 - t * 1.6) + 1.5 * Math.sin(x * 0.11 + t * 2.3);
  let surfD = '';
  for (let x = 210; x <= 600.1; x += 26) surfD += `${surfD ? ' L' : 'M'}${x.toFixed(1)},${wave(x).toFixed(1)}`;
  const waterD = `${surfD} L600,800 L540,732 Q330,470 210,${SURF} Z`;
  const tailWave = Array.from({length: 9}, (_, i) => {
    const x = 1100 + i * 25;
    return `${i ? 'L' : 'M'}${x},${786 + 2.5 * Math.sin(x * 0.08 - t * 4)}`;
  }).join(' ');

  return (
    <AbsoluteFill style={{opacity: sceneIn}}>
      <Stage>
        <defs>
          <linearGradient id="hydro-pipe" x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={C.pot} />
            <stop offset="100%" stopColor={C.kin} />
          </linearGradient>
          <linearGradient id="hydro-rock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18234a" />
            <stop offset="100%" stopColor="#0c1330" />
          </linearGradient>
        </defs>
        <clipPath id="hydro-clip">
          <path d={waterD} />
        </clipPath>
        <Glow x={360} y={480} r={360} color="pot" opacity={0.5 * resGlow + 0.15} />
        <g transform={`translate(${camX} ${camY}) scale(${z}) translate(${-camX} ${-camY})`}>
          {/* pegunungan jauh (kedalaman) & awan */}
          <path d="M80,420 L190,330 L290,380 L420,250 L560,350 L700,270 L860,380 L980,300 L1120,400 L1200,370 L1300,560 L1300,800 L80,800 Z" fill="#0e1736" opacity={0.75} />
          <path d="M420,250 L450,272 L432,276 L412,262 Z M700,270 L726,290 L708,292 L690,282 Z" fill="#cfe0ff" opacity={0.25} />
          {[0, 1, 2].map((i) => {
            const ph = (((t * 0.018 + i / 3 + 0.1) % 1) + 1) % 1;
            return <Cloud key={i} x={760 + 520 * ph} y={205 + 30 * i} s={0.8 + 0.25 * i} o={cyc(ph) * 0.7} />;
          })}
          {/* lereng gunung & dasar lembah */}
          <path d="M80,250 Q200,300 260,420 L600,800 L1300,800 L1300,860 L80,860 Z" fill="url(#hydro-rock)" stroke={C.faint} strokeWidth={3} />
          {Array.from({length: 6}, (_, i) => (
            <path key={i} d={`M${120 + i * 26},${300 + i * 40} l40,18`} stroke={C.faint} strokeWidth={2} opacity={0.6} />
          ))}
          {/* sungai kecil mengisi waduk */}
          <Stream
            pts={[
              [96, 262],
              [150, 280],
              [196, 308],
              [222, 330],
            ]}
            color="pot"
            n={6}
            speed={0.45}
            r={4}
            jitter={2}
            opacity={0.8}
          />
          {/* air waduk */}
          <path d={waterD} fill="url(#water)" opacity={0.92} />
          <path d={surfD} fill="none" stroke="#cfe7ff" strokeOpacity={0.65} strokeWidth={2.5} />
          {/* pita cahaya bawah air yang bergeser */}
          {[0, 1].map((i) => {
            const ph = (((t * 0.07 + i * 0.5) % 1) + 1) % 1;
            const y = SURF + 40 + ph * 300;
            return <line key={i} x1={200} y1={y} x2={600} y2={y} stroke="#9fd0ff" strokeWidth={10} opacity={cyc(ph) * 0.14} clipPath="url(#hydro-clip)" />;
          })}
          {/* kilau permukaan */}
          {Array.from({length: 7}, (_, i) => {
            const raw = t * (0.25 + 0.1 * rand(i)) + rand(i * 4);
            const ph = raw - Math.floor(raw);
            const x = 240 + rand(i * 9.3 + Math.floor(raw) * 1.7) * 330;
            return <path key={i} d={`M${x - 12},${wave(x) + 7} q12,-4 24,0`} fill="none" stroke="#e6f4ff" strokeWidth={2} opacity={cyc(ph) * 0.7} />;
          })}
          {/* air masuk ke pipa: pusaran kecil di mulut pipa */}
          {[0, 1, 2].map((i) => {
            const a = t * 2.4 + (i * Math.PI * 2) / 3;
            const r = 22 + 6 * i;
            return <path key={i} d={`M${P0.x - 30 + r * Math.cos(a)},${P0.y + 4 + r * 0.45 * Math.sin(a)} A${r},${r * 0.45} 0 0 1 ${P0.x - 30 + r * Math.cos(a + 1.4)},${P0.y + 4 + r * 0.45 * Math.sin(a + 1.4)}`} fill="none" stroke="#cfe7ff" strokeWidth={2} opacity={0.5 * flowOn} />;
          })}
          <Stream
            pts={[
              [380, 450],
              [500, 410],
              [P0.x - 10, P0.y],
            ]}
            color="pot"
            n={7}
            speed={0.35}
            r={5}
            opacity={0.8 * flowOn}
          />
          <Label x={380} y={430} size={30} color={C.ink} weight={600}>
            waduk
          </Label>
          <Label x={330} y={540} size={24} color={C.ink} opacity={resGlow} weight={600}>
            tabungan <tspan fontStyle="italic">U</tspan>
            <TSub>g</TSub> raksasa
          </Label>
          <Motes x={380} y={520} rx={200} ry={140} n={20} color="pot" opacity={0.4 * resGlow + 0.15} seed={2} />
          {/* bendungan (beton dengan sambungan) */}
          <path d="M600,300 L652,300 L770,800 L600,800 Z" fill="#2a3560" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
          {[380, 470, 560, 650, 740].map((yy) => (
            <line key={yy} x1={600} y1={yy} x2={652 + ((yy - 300) / 500) * 118} y2={yy} stroke="#000" strokeOpacity={0.2} strokeWidth={2} />
          ))}
          <path d="M604,304 L648,304 L652,320 L606,320 Z" fill="#fff" opacity={0.08} />
          {/* pipa pesat (warna Ug → K) */}
          <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke="#0c1430" strokeWidth={40} strokeLinecap="round" />
          <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke={C.muted} strokeOpacity={0.18} strokeWidth={40} strokeLinecap="round" />
          <line x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} stroke="url(#hydro-pipe)" strokeOpacity={0.35 * flowOn} strokeWidth={24} strokeLinecap="round" />
          {pipeDrops.map((d, i) => (
            <g key={i} opacity={d.o}>
              <line x1={d.x0} y1={d.y0} x2={d.x} y2={d.y} stroke={d.col} strokeWidth={d.r * 1.2} strokeLinecap="round" opacity={0.5} />
              <circle cx={d.x} cy={d.y} r={d.r} fill={d.col} />
            </g>
          ))}
          <g transform={`translate(${(P0.x + P1.x) / 2 - 29} ${(P0.y + P1.y) / 2 + 28}) rotate(${PIPE_ANG})`}>
            <Label x={0} y={0} size={24} color={C.muted}>
              pipa pesat
            </Label>
          </g>
          {/* rumah pembangkit: turbin + generator */}
          <rect x={925} y={672} width={175} height={128} rx={10} fill="#16224a" stroke={C.muted} strokeWidth={3} />
          <path d="M915,676 L1012,640 L1110,676 Z" fill="#1d2a58" stroke={C.muted} strokeWidth={3} strokeLinejoin="round" />
          <Glow x={TURB.x} y={TURB.y} r={90} color="cyan" opacity={0.6 * spin} />
          <g transform={`translate(${TURB.x} ${TURB.y}) rotate(${rot})`}>
            <circle r={38} fill="#0c1430" stroke={C.cyan} strokeWidth={3} />
            <circle r={30} fill={C.cyan} opacity={0.12 * spin} />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path key={a} d="M0,0 Q14,-14 6,-34" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" transform={`rotate(${a})`} />
            ))}
            <path d="M-36,-10 A38,38 0 0 1 -10,-36" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.75} />
            <circle r={7} fill={C.cyan} />
          </g>
          {/* generator: kumparan berdenyut */}
          <rect x={1030} y={694} width={58} height={44} rx={8} fill="#0c1430" stroke={C.cyan} strokeWidth={3} />
          {[0, 1, 2].map((k) => (
            <line key={k} x1={1040 + k * 19} y1={702} x2={1040 + k * 19} y2={730} stroke={C.cyan} strokeWidth={4} strokeLinecap="round" opacity={0.3 + 0.7 * elecOn * (0.5 + 0.5 * Math.sin(t * 10 - k * 1.3))} />
          ))}
          <line x1={TURB.x} y1={TURB.y} x2={1059} y2={716} stroke={C.muted} strokeWidth={5} />
          <Label x={1012} y={830} size={22} color={C.muted}>
            turbin + generator
          </Label>
          {/* jaringan listrik */}
          {[1170, 1270].map((x) => (
            <g key={x}>
              <path d={`M${x - 22},800 L${x},560 L${x + 22},800 M${x - 30},590 H${x + 30} M${x - 16},680 L${x + 13},620 M${x + 16},680 L${x - 13},620`} fill="none" stroke={C.muted} strokeWidth={3} />
              <circle cx={x} cy={590} r={14} fill="url(#soft-cyan)" opacity={elecOn * (0.6 + 0.4 * Math.sin(t * 4 + x))} />
            </g>
          ))}
          <path d={lineD} fill="none" stroke={C.cyan} strokeOpacity={0.7} strokeWidth={2.5} />
          <Stream pts={LINE} color="cyan" n={9} speed={0.55} r={4.5} jitter={0} opacity={elecOn} />
          <Label x={1220} y={530} size={22} color={C.cyan} opacity={elecOn}>
            ke jaringan
          </Label>
          {/* buangan + semprotan */}
          <path d={`${tailWave} L1300,800 L1100,800 Z`} fill="url(#water)" opacity={0.6 * flowOn} />
          {spray.map((d, i) => (d.y < 800 ? <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#dff0ff" opacity={d.o * Math.min(1, (800 - d.y) / 14)} /> : null))}
          {/* tinggi jatuh h */}
          <g opacity={hBr}>
            <line x1={600} y1={SURF} x2={900} y2={SURF} stroke={C.pot} strokeWidth={2} strokeDasharray="8 8" />
            <line x1={880} y1={SURF + 4} x2={880} y2={TURB.y - 4} stroke={C.pot} strokeWidth={3 + 3 * hPulse} markerStart="url(#arrow-pot)" markerEnd="url(#arrow-pot)" />
            <circle cx={880} cy={mix(SURF + 10, TURB.y - 10, (((t * 0.5) % 1) + 1) % 1)} r={7} fill="url(#soft-pot)" opacity={0.9} />
            <Label x={858} y={(SURF + TURB.y) / 2 - 80} size={40} font="serif" italic color={C.pot} anchor="end" weight={600}>
              h
            </Label>
          </g>
          <Ripple x={880} y={(SURF + TURB.y) / 2} p={(t - cue(5) - 0.2) / 1.4} r={140} color="pot" />
          {/* massa air per detik */}
          <g opacity={slab}>
            <rect x={470} y={SURF + 2} width={120} height={46} rx={6} fill={C.gold} opacity={0.2 + 0.1 * Math.sin(t * 4)} stroke={C.gold} strokeWidth={3} />
            <Stream
              pts={[
                [530, SURF + 26],
                [580, SURF + 40],
                [P0.x, P0.y],
                [mix(P0.x, P1.x, 0.4), mix(P0.y, P1.y, 0.4)],
              ]}
              color="gold"
              n={6}
              speed={0.6}
              r={4}
              jitter={2}
            />
            <Label x={530} y={SURF - 30} size={26} color={C.gold} weight={600}>
              <tspan fontStyle="italic">ρ Q</tspan> kg tiap detik
            </Label>
          </g>
          {/* paket air yang dilacak */}
          <Spark x={px} y={py} r={10} color="gold" trail={parcelTrail} opacity={parcelOn} />
          <circle cx={px} cy={py} r={11} fill="#fff" stroke={C.gold} strokeWidth={3} opacity={parcelOn} />
          <Label x={px + 30} y={py - 38} size={22} color={C.gold} anchor="start" opacity={parcelOn * ramp(t, tStart, tStart + 0.6) * (1 - ramp(t, tTurb - 0.7, tTurb - 0.1))}>
            1 kg air
          </Label>
          <Ripple x={TURB.x} y={TURB.y} p={(t - tTurb) / 1.3} r={130} color="cyan" />
        </g>

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
        <Glow x={1560} y={300} r={260} color="gold" opacity={0.4 * cardC} />
        <Twinkles x={1560} y={300} rx={240} ry={90} n={6} color="gold" opacity={cardC * (1 - ramp(t, tC + 4, tC + 6))} seed={8} />
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
