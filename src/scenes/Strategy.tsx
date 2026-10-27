import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Crate, ELabel, EnergyBars, SpringV} from '../components/physics';
import {Arrow, Card, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Cara berpikir: daftar 5 langkah, lalu soal benda 1 kg jatuh 1,2 m ke pegas tegak k = 200 N/m.
// Gerak dihitung nyata (gerak lambat ×¼): jatuh bebas, lalu osilasi harmonik di sekitar x_eq = 0,05 m
// dengan amplitudo 0,35 m → titik terendah tepat 0,40 m di bawah ujung pegas.

const STEPS = [
  'Gambar keadaan awal & keadaan akhir',
  'Tentukan sistem & titik nol energi potensial',
  'Daftar energi, coret yang nol karena alasan fisik',
  'Tulis neraca dengan simbol dulu, baru angka',
  'Periksa: apakah jawabannya masuk akal?',
];

const G = 10;
const H0 = 1.2;
const K = 200;
const M = 1;
const W = Math.sqrt(K / M);
const XEQ = (M * G) / K; // 0,05 m
const V1 = Math.sqrt(2 * G * H0);
const AMP = Math.sqrt(XEQ * XEQ + (V1 / W) ** 2); // 0,35 m
const ALPHA = Math.asin(XEQ / AMP);
const S1 = Math.sqrt((2 * H0) / G); // waktu sampai menyentuh pegas
const S2 = S1 + (Math.PI / 2 + ALPHA) / W; // waktu sampai titik terendah
const T_OFF = (2 * (Math.PI / 2 + ALPHA)) / W; // durasi kontak
const S_TOP = S1 + T_OFF + V1 / G; // kembali ke puncak 1,2 m

/** Posisi alas benda di bawah ujung pegas alami (m); negatif = di atas. */
const posAt = (s: number) => {
  if (s <= S1) return -(H0 - 0.5 * G * s * s);
  const tau = s - S1;
  const u = XEQ + AMP * Math.sin(W * tau - ALPHA);
  if (tau <= T_OFF) return u;
  // sudah lepas dari pegas ke atas
  const s3 = s - S1 - T_OFF;
  return -(V1 * s3 - 0.5 * G * s3 * s3);
};

const SC = 280; // px per meter
const YT = 610; // ujung pegas alami
const YG = 850; // lantai
const BX = 470;
const BW = 140;
const BH = 84;
const ROW0 = 300;
const RAIL_X = 430;

export const Strategy: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();

  // ---------- daftar langkah ----------
  const listOut = 1 - ramp(t, cue(6) - 0.6, cue(6) + 0.2, EASE_IN_OUT);
  const head = ramp(t, cue(0) + 0.2, cue(0) + 1.0);
  const noMemo = win(t, cue(0) + 2.2, cue(1) - 0.2, 0.5, 0.5);
  const rows = STEPS.map((_, i) => ({
    p: ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.6),
    tick: ramp(t, cueEnd(i + 1) - 0.4, cueEnd(i + 1) + 0.3),
    act: win(t, cue(i + 1) - 0.1, cueEnd(i + 1) + 0.3, 0.4, 0.6),
    y: ROW0 + i * 100 + 40,
  }));
  const ticks = rows.reduce((s, r) => s + r.tick, 0);
  const railPos = [1, 2, 3, 4].reduce((s, i) => s + ramp(t, cue(i + 1) - 0.3, cue(i + 1) + 0.5, EASE_IN_OUT), 0);
  const railY = ROW0 + 40 + railPos * 100;
  const railPrev = [1, 2, 3, 4].reduce((s, i) => s + ramp(t - 0.05, cue(i + 1) - 0.3, cue(i + 1) + 0.5, EASE_IN_OUT), 0);
  const railVel = Math.min(1, (railPos - railPrev) / 0.05 / 1.5);
  const bulbBurst = ramp(t, cueEnd(5) + 0.2, cueEnd(5) + 1.6, (x) => x);

  // ---------- soal pegas ----------
  const probIn = ramp(t, cue(6) - 0.1, cue(6) + 0.8);
  const tDrop = cue(7) + 0.8;
  const tRes = Math.max(cue(11) + 4.5, cueEnd(11) - 1.6);
  const SLOW = 0.25;
  const simAt = (tt: number) => (tt < tDrop ? 0 : tt < tRes ? Math.min(S2, (tt - tDrop) * SLOW) : S2 + (tt - tRes) * SLOW);
  const posT = (tt: number) => posAt(Math.min(simAt(tt), S_TOP));
  const x = posT(t);
  const blockY = YT + x * SC;
  const springTop = YT + Math.max(0, x) * SC;
  const speed = Math.min(1, Math.abs(posT(t + 0.04) - x) / 0.04 / (V1 * SLOW));
  const comp = Math.max(0, x) / 0.4; // 0..1 tekanan pegas
  const dropped = ramp(t, tDrop, tDrop + 0.5);
  const tLow = tDrop + S2 / SLOW;
  const slowTag = win(t, tDrop - 0.2, tLow + 0.6, 0.4, 0.6) + win(t, tRes - 0.2, dur, 0.4, 0.6);
  const bracket = ramp(t, tLow + 0.4, tLow + 1.2);
  const zero = ramp(t, cue(8) + 0.3, cue(8) + 1.1);
  const bars = ramp(t, cue(8) + 2.5, cue(8) + 3.5);
  const eq = [ramp(t, cue(9) + 0.2, cue(9) + 1.0), ramp(t, cue(10) + 0.2, cue(10) + 1.0), ramp(t, cue(10) + 3.0, cue(10) + 3.8), ramp(t, cue(10) + 5.6, cue(10) + 6.4)];
  const check = ramp(t, cue(11) + 0.4, cue(11) + 1.2);
  const forces = win(t, cue(11) + 0.6, tRes - 0.1, 0.6, 0.3);
  const yLow = YT + 0.4 * SC;
  const flowEq = win(t, cue(9) + 0.4, cue(10) + 3.0, 0.8, 0.8);
  const cam = ramp(t, cue(8) - 0.2, cue(8) + 2.5, EASE_IN_OUT) * (1 - ramp(t, cue(10) + 1.0, cue(10) + 3.5, EASE_IN_OUT));
  const zS = 1 + 0.05 * cam;
  const springCol = interpolateColors(comp, [0, 1], [C.spr, '#e2c8ff']);
  const TRY = YT - H0 * SC; // alas benda di posisi awal

  return (
    <AbsoluteFill>
      {/* ===== daftar langkah ===== */}
      <AbsoluteFill style={{opacity: listOut}}>
        <Stage>
          {/* rel kemajuan di kiri daftar */}
          <g opacity={rows[0].p}>
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={ROW0 + 440} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={railY} stroke={C.work} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
            {rows.map((r, i) => (
              <g key={i} opacity={Math.max(0.3, r.p)}>
                <circle cx={RAIL_X} cy={r.y} r={11} fill={C.bg} stroke={C.work} strokeWidth={3} />
                <circle cx={RAIL_X} cy={r.y} r={6 * r.tick} fill={C.work} />
                <Ripple x={520} y={r.y} p={ramp(t, cueEnd(i + 1) - 0.1, cueEnd(i + 1) + 1.1, (q) => q)} r={70} color="work" rings={2} />
                <Twinkles x={1120} y={r.y} rx={260} ry={20} n={2} opacity={win(t, cueEnd(i + 1) - 0.1, cueEnd(i + 1) + 1.4, 0.2, 0.6)} seed={i + 2} />
              </g>
            ))}
            <Spark x={RAIL_X} y={railY} r={7} color="gold" trail={[1, 2, 3, 4, 5].map((k) => [RAIL_X, railY - k * 9 * railVel] as [number, number])} />
          </g>
          {/* lampu ide: makin terang tiap langkah dicentang */}
          <g opacity={head}>
            {(() => {
              const cx = 1655;
              const cy = 500;
              const lit = ticks / 5;
              return (
                <g>
                  <Glow x={cx} y={cy} r={240} color="gold" opacity={0.15 + 0.85 * lit} />
                  {Array.from({length: 12}, (_, k) => {
                    const a = (k / 12) * 2 * Math.PI + t * 0.25;
                    const len = 22 + 10 * Math.sin(t * 2 + k);
                    return <line key={k} x1={cx + 104 * Math.cos(a)} y1={cy + 104 * Math.sin(a)} x2={cx + (104 + len) * Math.cos(a)} y2={cy + (104 + len) * Math.sin(a)} stroke={C.gold} strokeWidth={4} strokeLinecap="round" opacity={lit * 0.8} />;
                  })}
                  <path d={`M${cx - 44},${cy + 58} Q${cx - 82},${cy + 20} ${cx - 82},${cy - 22} A82,82 0 1 1 ${cx + 82},${cy - 22} Q${cx + 82},${cy + 20} ${cx + 44},${cy + 58} Z`} fill={interpolateColors(lit, [0, 1], ['#141d3e', '#5a4a1c'])} stroke={interpolateColors(lit, [0, 1], [C.muted, C.gold])} strokeWidth={4} strokeLinejoin="round" />
                  <path d={`M${cx - 52},${cy - 52} A60,60 0 0 1 ${cx - 6},${cy - 82}`} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={6} strokeLinecap="round" />
                  {/* filamen: 5 ruas = 5 langkah */}
                  {[0, 1, 2, 3, 4].map((k) => (
                    <path key={k} d={`M${cx - 40 + k * 16},${cy + 6} q8,-26 16,0`} fill="none" stroke={C.gold} strokeWidth={4} strokeLinecap="round" opacity={0.15 + 0.85 * rows[k].tick} />
                  ))}
                  <line x1={cx - 40} y1={cy + 6} x2={cx - 30} y2={cy + 58} stroke={C.muted} strokeWidth={2.5} />
                  <line x1={cx + 40} y1={cy + 6} x2={cx + 30} y2={cy + 58} stroke={C.muted} strokeWidth={2.5} />
                  {[0, 1, 2].map((k) => (
                    <rect key={k} x={cx - 44 + k * 4} y={cy + 62 + k * 18} width={88 - k * 8} height={14} rx={5} fill="#22305a" stroke={C.muted} strokeWidth={2} />
                  ))}
                  <Ripple x={cx} y={cy} p={bulbBurst} r={230} color="gold" />
                  <Twinkles x={cx} y={cy} rx={150} ry={150} n={6} opacity={ramp(t, cueEnd(5), cueEnd(5) + 0.6)} seed={9} />
                </g>
              );
            })()}
          </g>
          <Motes x={960} y={540} rx={820} ry={320} n={26} color="work" opacity={0.35} seed={3} />
        </Stage>
        <div style={{position: 'absolute', left: 960, top: 200, transform: 'translateX(-50%)', textAlign: 'center', opacity: head}}>
          <div style={{fontFamily: FONT.head, fontSize: 26, letterSpacing: 6, color: C.gold, fontWeight: 600}}>URUTAN BERPIKIR</div>
          <div style={{fontFamily: FONT.head, fontSize: 26, color: C.muted, marginTop: 8, opacity: noMemo / Math.max(head, 0.001)}}>
            <span style={{textDecoration: 'line-through', textDecorationColor: C.heat, textDecorationThickness: 3}}>menghafal rumus</span>
          </div>
        </div>
        {STEPS.map((s, i) => {
          const {p, tick, act} = rows[i];
          return (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: 470,
                top: ROW0 + i * 100,
                width: 980,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                opacity: p,
                translate: `${(1 - p) * 30}px 0px`,
                scale: String(1 + 0.015 * act),
                fontFamily: FONT.head,
                fontSize: 36,
                fontWeight: 500,
                color: C.ink,
                padding: '0 26px',
                borderRadius: 16,
                background: `linear-gradient(90deg, rgba(20,34,72,${0.85 + 0.1 * act}), rgba(14,22,50,0.85))`,
                border: `1.5px solid ${interpolateColors(act, [0, 1], [C.line, C.gold])}`,
                boxShadow: `0 0 ${28 * act}px rgba(255,201,74,${0.28 * act})`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: `2.5px solid ${C.work}`,
                  background: `rgba(79,227,160,${0.15 * tick})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 24,
                  color: C.work,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span style={{opacity: 1 - tick}}>{i + 1}</span>
                <svg width={48} height={48} viewBox="0 0 48 48" style={{position: 'absolute', left: -2.5, top: -2.5}}>
                  <path d="M12,25 L21,34 L37,15" fill="none" stroke={C.work} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - tick)} />
                </svg>
              </div>
              {s}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* ===== soal pegas tegak ===== */}
      <AbsoluteFill style={{opacity: probIn}}>
        <Stage>
          <g transform={`translate(${BX} 520) scale(${zS}) translate(${-BX} -520)`}>
            {/* lantai & dudukan */}
            <ellipse cx={BX} cy={YG + 4} rx={170} ry={12} fill="#000" opacity={0.4} />
            <rect x={BX - 130} y={YG} width={260} height={18} rx={4} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            <rect x={BX - 122} y={YG + 3} width={244} height={4} rx={2} fill="#fff" opacity={0.12} />
            {/* pegas: makin terang & berpendar saat menyimpan Us */}
            <Glow x={BX} y={(springTop + YG) / 2} r={120 + 60 * comp} color="spr" opacity={0.15 + 0.85 * comp * (0.85 + 0.15 * Math.sin(t * 3))} />
            <SpringV x={BX} ya={springTop} yb={YG} coils={9} amp={40} color={springCol} width={5 + 2 * comp} />
            <Motes x={BX} y={(springTop + YG) / 2} rx={90} ry={70} n={12} color="spr" opacity={0.6 * comp} seed={4} />
            <rect x={BX - 60} y={springTop - 8} width={120} height={10} rx={4} fill={C.spr} />
            <Ripple x={BX} y={springTop} p={ramp(t, tDrop + S1 / SLOW, tDrop + S1 / SLOW + 1.2, (q) => q)} r={110} color="spr" rings={2} />
            <Ripple x={BX} y={springTop} p={ramp(t, tRes, tRes + 1.3, (q) => q)} r={150} color="force" />
            {/* bayangan posisi awal */}
            <g opacity={dropped * 0.32}>
              <Crate x={BX} y={TRY} w={BW} h={BH} label="1 kg" color={C.pot} />
            </g>
            {/* jejak jatuh */}
            {[5, 4, 3, 2, 1].map((k) => {
              const yk = YT + posT(t - k * 0.09) * SC;
              return <rect key={k} x={BX - BW / 2} y={yk - 9 - BH} width={BW} height={BH} rx={12} fill={C.pot} opacity={0.07 * (1 - k / 6) * speed * 2} />;
            })}
            {[-40, 0, 40].map((dx, k) => (
              <line key={k} x1={BX + dx} y1={blockY - 9 - BH - 14} x2={BX + dx} y2={blockY - 9 - BH - 14 - 70 * speed} stroke={C.ink} strokeOpacity={0.5 * speed} strokeWidth={3} strokeLinecap="round" />
            ))}
            <Glow x={BX} y={blockY - 50} r={110} color="kin" opacity={0.7 * speed} />
            <Crate x={BX} y={blockY - 9} w={BW} h={BH} label="1 kg" color={C.pot} />
            <Label x={BX + 120} y={300} size={24} color={C.cyan} anchor="start" opacity={slowTag}>
              gerak lambat ×¼
            </Label>
            {/* ukuran h dan x */}
            <g opacity={bracket}>
              <line x1={BX + 160} y1={TRY - 9} x2={BX + 160} y2={YT - 9} stroke={C.pot} strokeWidth={3} />
              <line x1={BX + 148} y1={TRY - 9} x2={BX + 172} y2={TRY - 9} stroke={C.pot} strokeWidth={3} />
              <line x1={BX + 148} y1={YT - 9} x2={BX + 172} y2={YT - 9} stroke={C.pot} strokeWidth={3} />
              <Label x={BX + 182} y={(TRY + YT) / 2 - 9} size={28} color={C.pot} anchor="start" weight={600}>
                h = 1,2 m
              </Label>
              <line x1={BX + 160} y1={YT - 9} x2={BX + 160} y2={yLow - 9} stroke={C.spr} strokeWidth={3} />
              <line x1={BX + 148} y1={yLow - 9} x2={BX + 172} y2={yLow - 9} stroke={C.spr} strokeWidth={3} />
              <Label x={BX + 182} y={(YT + yLow) / 2 - 9} size={28} color={C.spr} anchor="start" weight={600}>
                x
              </Label>
              <line x1={BX + 310} y1={TRY - 9} x2={BX + 310} y2={yLow - 9} stroke={C.gold} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-t * 10} />
              <Label x={BX + 322} y={(TRY + yLow) / 2 + 40} size={30} color={C.gold} anchor="start" weight={700}>
                h + x
              </Label>
              <Twinkles x={BX + 200} y={(YT + yLow) / 2 - 9} rx={40} ry={40} n={3} opacity={eq[3]} seed={6} />
            </g>
            {/* Ug di awal mengalir menjadi Us di titik terendah */}
            <Stream
              pts={[
                [BX + 70, TRY - 50],
                [BX + 310, TRY + 20],
                [BX + 310, yLow - 80],
                [BX + 60, (springTop + YG) / 2],
              ]}
              color="spr"
              n={12}
              speed={0.32}
              r={5}
              jitter={3}
              opacity={flowEq * 0.9}
              seed={3}
            />
            {/* titik nol */}
            <g opacity={zero}>
              <line x1={BX - 170} y1={yLow - 9} x2={BX + 130} y2={yLow - 9} stroke={C.gold} strokeWidth={3} strokeDasharray="12 9" strokeDashoffset={-t * 14} />
              <Label x={BX - 180} y={yLow - 9} size={26} color={C.gold} anchor="end" weight={600}>
                y = 0
              </Label>
              <Label x={BX - 90} y={TRY - 9 - BH / 2} size={24} color={C.muted} anchor="end">
                awal: v = 0
              </Label>
              <Label x={BX - 100} y={yLow + 40} size={24} color={C.muted} anchor="end">
                terendah: v = 0
              </Label>
            </g>
            {/* gaya di titik terendah */}
            <g opacity={forces}>
              <Arrow x1={BX} y1={yLow - 60} x2={BX} y2={yLow - 60 - 240} color="force" width={7} />
              <Label x={BX - 30} y={yLow - 250} size={26} color={C.force} anchor="end" weight={600}>
                kx = 80 N
              </Label>
              <Arrow x1={BX + 40} y1={yLow - 40} x2={BX + 40} y2={yLow - 10 + 30} color="heat" width={6} />
              <Label x={BX + 72} y={yLow + 14} size={24} color={C.heat} anchor="start" weight={600}>
                mg = 10 N
              </Label>
            </g>
          </g>
          <EnergyBars
            x={930}
            y={800}
            height={270}
            barW={64}
            gap={56}
            max={18}
            total={false}
            title="AWAL → TERENDAH"
            opacity={bars}
            bars={[
              {key: 'Ug', label: ELabel.Ug, value: 16 * bars, color: 'pot'},
              {key: 'Us', label: ELabel.Us, value: 16 * bars, color: 'spr'},
            ]}
          />
          <Stream pts={[[962, 800 - 240 * bars - 34], [1022, 800 - 240 * bars - 60], [1082, 800 - 240 * bars - 34]]} color="spr" n={6} speed={0.7} r={4.5} jitter={2} opacity={bars * Math.max(flowEq, 0.35)} seed={7} />
          <Twinkles x={1470} y={648} rx={150} ry={26} n={5} opacity={eq[3] * probIn} seed={2} />
        </Stage>
        <Note x={1440} y={250} p={ramp(t, cue(6) + 0.6, cue(6) + 1.4)} color={C.cyan} size={28}>
          <span style={{color: C.muted}}>Diketahui:</span> m = 1 kg · h = 1,2 m · k = 200 N/m · <Tint c={C.gold}>x maks = ?</Tint>
        </Note>
        <Card x={1470} y={520} opacity={Math.min(1, eq[0] * 1.4)} accent={C.spr} style={{padding: '20px 44px'}}>
          <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.45, textAlign: 'center'}}>
            <div style={{opacity: eq[0]}}>
              <V>m</V>
              <V>g</V>(<V>h</V> + <V>x</V>) = <Frac n="1" d="2" />
              <V>k</V>
              <V>x</V>
              <Sup>2</Sup>
            </div>
            <div style={{opacity: eq[1]}}>
              10(1,2 + <V>x</V>) = 100 <V>x</V>
              <Sup>2</Sup>
            </div>
            <div style={{opacity: eq[2]}}>
              100 <V>x</V>
              <Sup>2</Sup> − 10 <V>x</V> − 12 = 0
            </div>
            <div style={{opacity: eq[3], color: C.gold, fontWeight: 600, textShadow: `0 0 ${18 * eq[3]}px rgba(255,201,74,0.5)`}}>
              <V>x</V> = 0,40 m
            </div>
          </div>
        </Card>
        <Note x={1470} y={800} p={check} color={C.force} size={28}>
          <Tint c={C.force}>kx = 80 N</Tint> ≫ <Tint c={C.heat}>mg = 10 N</Tint> → terpantul ke atas ✓
        </Note>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
