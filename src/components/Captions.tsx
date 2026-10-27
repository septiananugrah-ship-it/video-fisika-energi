import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {EASE_IN_OUT, ramp} from '../anim';
import {C, FONT} from '../theme';
import {ALL_LINES, type TWord} from '../timeline.ts';

type Page = {words: TWord[]; start: number; end: number; contIn?: boolean; contOut?: boolean};

const MAX_WORDS = 8;
const MAX_CHARS = 48;

// Pecah setiap baris narasi menjadi "halaman" subtitle (satu–dua baris layar).
const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  for (const line of ALL_LINES) {
    let cur: TWord[] = [];
    const flush = () => {
      if (cur.length) pages.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
      cur = [];
    };
    line.words.forEach((w, i) => {
      cur.push(w);
      const chars = cur.reduce((s, x) => s + x.text.length + 1, 0);
      const remaining = line.words.length - i - 1;
      const punct = /[,;:.]$/.test(w.text);
      if (remaining === 0) return;
      if (cur.length >= MAX_WORDS || chars >= MAX_CHARS || (punct && cur.length >= 3 && remaining >= 3)) flush();
    });
    flush();
  }
  const out: Page[] = pages.map((p, i) => {
    const next = pages[i + 1];
    const hold = p.end + 1.2;
    // halaman berikutnya langsung menyambung → kapsul tidak berkedip
    const contOut = !!next && next.start - p.end < 0.5;
    return {...p, start: p.start - 0.12, end: next ? Math.min(hold, next.start - 0.12) : hold, contOut};
  });
  out.forEach((p, i) => {
    if (i > 0) p.contIn = out[i - 1].contOut;
  });
  return out;
})();

/** Subtitle kata-per-kata dalam kapsul kaca gelap; kata kunci menyala emas. */
export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const page = PAGES.find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  const pin = page.contIn ? 1 : ramp(t, page.start, page.start + 0.25);
  const pout = page.contOut ? 1 : 1 - ramp(t, page.end - 0.25, page.end, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64, pointerEvents: 'none'}}>
      <div
        style={{
          maxWidth: 1500,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 44,
          fontWeight: 500,
          lineHeight: 1.34,
          letterSpacing: -0.2,
          opacity: pin * pout,
          translate: `0px ${(1 - pin) * 10}px`,
          padding: '10px 30px 12px',
          borderRadius: 22,
          background: 'rgba(6,10,24,0.78)',
          border: `1.5px solid ${C.line}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        {page.words.map((w, i) => {
          const spoken = ramp(t, w.start - 0.04, w.start + 0.14);
          const active = Math.min(ramp(t, w.start - 0.06, w.start + 0.08), 1 - ramp(t, w.end, w.end + 0.18, EASE_IN_OUT));
          const appear = ramp(t, page.start + i * 0.02, page.start + i * 0.02 + 0.3);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                position: 'relative',
                marginRight: '0.26em',
                opacity: appear * (0.45 + 0.55 * spoken),
                translate: `0px ${(1 - appear) * 8}px`,
                color: w.hl ? interpolateColors(spoken, [0, 1], [C.ink, C.gold]) : C.ink,
                fontWeight: w.hl ? 700 : 500,
                textShadow: w.hl ? `0 0 ${18 * spoken}px rgba(255,201,74,0.55)` : undefined,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '-0.04em',
                  right: '-0.04em',
                  bottom: '0.02em',
                  height: 4,
                  borderRadius: 3,
                  background: w.hl ? C.gold : C.cyan,
                  opacity: w.hl ? 0.55 * spoken : active * 0.9,
                }}
              />
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
