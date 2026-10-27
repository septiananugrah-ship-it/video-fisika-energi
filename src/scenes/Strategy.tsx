import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Crate, ELabel, EnergyBars, SpringV} from '../components/physics';
import {Arrow, Card, Frac, Label, Note, Stage, Sup, Tint, V} from '../components/primitives';
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

/** Posisi alas benda di bawah ujung pegas alami (m); negatif = di atas. */
const posAt = (s: number) => {
  if (s <= S1) return -(H0 - 0.5 * G * s * s);
  const tau = s - S1;
  // setelah lepas kembali dari pegas: naik ke 1,2 m lalu jatuh lagi (periodik); cukup bagian kontak + naik
  const u = XEQ + AMP * Math.sin(W * tau - ALPHA);
  if (u >= 0) return u;
  // sudah lepas dari pegas ke atas
  const tOff = (2 * (Math.PI / 2 + ALPHA)) / W; // durasi kontak
  const s3 = s - S1 - tOff;
  return -(V1 * s3 - 0.5 * G * s3 * s3);
};

const SC = 250; // px per meter
const YT = 600; // ujung pegas alami
const YG = 840; // lantai
const BX = 430;

export const Strategy: React.FC = () => {
  const {t, cue, cueEnd, dur} = useScene();

  // ---------- daftar langkah ----------
  const listOut = 1 - ramp(t, cue(6) - 0.6, cue(6) + 0.2, EASE_IN_OUT);
  const head = ramp(t, cue(0) + 0.2, cue(0) + 1.0);
  const noMemo = win(t, cue(0) + 2.2, cue(1) - 0.2, 0.5, 0.5);

  // ---------- soal pegas ----------
  const probIn = ramp(t, cue(6) - 0.1, cue(6) + 0.8);
  const tDrop = cue(7) + 0.8;
  const tRes = Math.max(cue(11) + 4.5, cueEnd(11) - 1.6);
  const SLOW = 0.25;
  const simS = t < tDrop ? 0 : t < tRes ? Math.min(S2, (t - tDrop) * SLOW) : S2 + (t - tRes) * SLOW;
  const S_TOP = S1 + (2 * (Math.PI / 2 + ALPHA)) / W + V1 / G; // kembali ke puncak 1,2 m
  const x = posAt(Math.min(simS, S_TOP));
  const blockY = YT + x * SC;
  const springTop = YT + Math.max(0, x) * SC;
  const dropped = ramp(t, tDrop, tDrop + 0.5);
  const slowTag = win(t, tDrop - 0.2, tDrop + S2 / SLOW + 0.6, 0.4, 0.6) + win(t, tRes - 0.2, dur, 0.4, 0.6);
  const bracket = ramp(t, tDrop + S2 / SLOW + 0.4, tDrop + S2 / SLOW + 1.2);
  const zero = ramp(t, cue(8) + 0.3, cue(8) + 1.1);
  const bars = ramp(t, cue(8) + 2.5, cue(8) + 3.5);
  const eq = [ramp(t, cue(9) + 0.2, cue(9) + 1.0), ramp(t, cue(10) + 0.2, cue(10) + 1.0), ramp(t, cue(10) + 3.0, cue(10) + 3.8), ramp(t, cue(10) + 5.6, cue(10) + 6.4)];
  const check = ramp(t, cue(11) + 0.4, cue(11) + 1.2);
  const forces = win(t, cue(11) + 0.6, tRes - 0.1, 0.6, 0.3);
  const yLow = YT + 0.4 * SC;

  return (
    <AbsoluteFill>
      {/* ===== daftar langkah ===== */}
      <AbsoluteFill style={{opacity: listOut}}>
        <div style={{position: 'absolute', left: 960, top: 200, transform: 'translateX(-50%)', textAlign: 'center', opacity: head}}>
          <div style={{fontFamily: FONT.head, fontSize: 26, letterSpacing: 6, color: C.gold, fontWeight: 600}}>URUTAN BERPIKIR</div>
          <div style={{fontFamily: FONT.head, fontSize: 26, color: C.muted, marginTop: 8, opacity: noMemo / Math.max(head, 0.001)}}>
            <span style={{textDecoration: 'line-through', textDecorationColor: C.heat, textDecorationThickness: 3}}>menghafal rumus</span>
          </div>
        </div>
        {STEPS.map((s, i) => {
          const p = ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.6);
          const tick = ramp(t, cueEnd(i + 1) - 0.4, cueEnd(i + 1) + 0.3);
          return (
            <div
              key={s}
              style={{
                position: 'absolute',
                left: 470,
                top: 300 + i * 100,
                width: 980,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                opacity: p,
                translate: `${(1 - p) * 30}px 0px`,
                fontFamily: FONT.head,
                fontSize: 36,
                fontWeight: 500,
                color: C.ink,
                padding: '0 26px',
                borderRadius: 16,
                background: 'rgba(16,26,56,0.85)',
                border: `1.5px solid ${C.line}`,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: `2.5px solid ${C.work}`,
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
          {/* lantai */}
          <rect x={300} y={YG} width={260} height={18} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <SpringV x={BX} ya={springTop} yb={YG} coils={9} amp={36} />
          <rect x={BX - 55} y={springTop - 8} width={110} height={10} rx={4} fill={C.spr} />
          {/* bayangan posisi awal */}
          <g opacity={dropped * 0.32}>
            <Crate x={BX} y={YT - H0 * SC} w={130} h={80} label="1 kg" color={C.pot} />
          </g>
          <Crate x={BX} y={blockY - 9} w={130} h={80} label="1 kg" color={C.pot} />
          <Label x={BX + 110} y={300} size={24} color={C.cyan} anchor="start" opacity={slowTag}>
            gerak lambat ×¼
          </Label>
          {/* ukuran h dan x */}
          <g opacity={bracket}>
            <line x1={590} y1={YT - H0 * SC - 9} x2={590} y2={YT - 9} stroke={C.pot} strokeWidth={3} />
            <line x1={578} y1={YT - H0 * SC - 9} x2={602} y2={YT - H0 * SC - 9} stroke={C.pot} strokeWidth={3} />
            <line x1={578} y1={YT - 9} x2={602} y2={YT - 9} stroke={C.pot} strokeWidth={3} />
            <Label x={612} y={(YT - H0 * SC + YT) / 2 - 9} size={28} color={C.pot} anchor="start" weight={600}>
              h = 1,2 m
            </Label>
            <line x1={590} y1={YT - 9} x2={590} y2={yLow - 9} stroke={C.spr} strokeWidth={3} />
            <line x1={578} y1={yLow - 9} x2={602} y2={yLow - 9} stroke={C.spr} strokeWidth={3} />
            <Label x={612} y={(YT + yLow) / 2 - 9} size={28} color={C.spr} anchor="start" weight={600}>
              x
            </Label>
            <line x1={760} y1={YT - H0 * SC - 9} x2={760} y2={yLow - 9} stroke={C.gold} strokeWidth={2} strokeDasharray="6 6" />
            <Label x={774} y={(YT - H0 * SC + yLow) / 2 + 40} size={30} color={C.gold} anchor="start" weight={700}>
              h + x
            </Label>
          </g>
          {/* titik nol */}
          <g opacity={zero}>
            <line x1={260} y1={yLow - 9} x2={560} y2={yLow - 9} stroke={C.gold} strokeWidth={3} strokeDasharray="12 9" />
            <Label x={250} y={yLow - 9} size={26} color={C.gold} anchor="end" weight={600}>
              y = 0
            </Label>
            <Label x={350} y={YT - H0 * SC - 50} size={24} color={C.muted} anchor="end">
              awal: v = 0
            </Label>
            <Label x={350} y={yLow + 40} size={24} color={C.muted} anchor="end">
              terendah: v = 0
            </Label>
          </g>
          {/* gaya di titik terendah */}
          <g opacity={forces}>
            <Arrow x1={BX} y1={yLow - 60} x2={BX} y2={yLow - 60 - 240} color="force" width={7} />
            <Label x={BX - 30} y={yLow - 240} size={26} color={C.force} anchor="end" weight={600}>
              kx = 80 N
            </Label>
            <Arrow x1={BX + 40} y1={yLow - 40} x2={BX + 40} y2={yLow - 10 + 30} color="heat" width={6} />
            <Label x={BX + 72} y={yLow + 10} size={24} color={C.heat} anchor="start" weight={600}>
              mg = 10 N
            </Label>
          </g>
          <EnergyBars
            x={890}
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
            <div style={{opacity: eq[3], color: C.gold, fontWeight: 600}}>
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
