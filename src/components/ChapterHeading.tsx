import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BACK, EASE_IN_OUT, ramp} from '../anim';
import {C, FONT} from '../theme';
import {TIMELINE} from '../timeline.ts';

const CHAPTERS = TIMELINE.scenes.filter((s) => s.chapter);

export const PARTS: Record<number, {label: string; color: string}> = {
  1: {label: 'Bagian 1 · Konsep & cara berpikir', color: C.cyan},
  2: {label: 'Bagian 2 · Energi dalam kimia', color: C.spr},
  3: {label: 'Bagian 3 · Penerapan', color: C.work},
};

/** Heading bab: nomor dalam lencana berbingkai + pil bagian + judul; kanan atas = meter kemajuan bersegmen. */
export const ChapterHeading: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const scene = TIMELINE.scenes.find((s) => t >= s.start && t < s.end);
  if (!scene || !scene.chapter) return null;
  const lt = t - scene.start;
  const out = 1 - ramp(lt, scene.duration - 0.9, scene.duration - 0.2, EASE_IN_OUT);
  const part = scene.part ? PARTS[scene.part] : {label: 'Penutup', color: C.gold};
  const pin = ramp(lt, 0, 0.7, BACK);
  const idx = CHAPTERS.findIndex((s) => s.id === scene.id);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: out * ramp(lt, 0, 0.3)}}>
      <div style={{position: 'absolute', left: 80, top: 54, display: 'flex', alignItems: 'center', gap: 20}}>
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: 18,
            background: 'rgba(10,16,36,0.9)',
            border: `2.5px solid ${part.color}`,
            boxShadow: `0 0 26px ${part.color}55, inset 0 0 18px ${part.color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.mono,
            fontWeight: 600,
            fontSize: 28,
            color: part.color,
            scale: String(0.6 + 0.4 * pin),
            rotate: `${(1 - pin) * 45}deg`,
          }}
        >
          {scene.chapter}
        </div>
        <div style={{opacity: ramp(lt, 0.2, 0.8)}}>
          <div style={{fontFamily: FONT.head, fontSize: 19, fontWeight: 600, letterSpacing: 2.5, color: part.color, textTransform: 'uppercase'}}>{part.label}</div>
          <div style={{fontFamily: FONT.head, fontSize: 34, fontWeight: 700, color: C.ink, display: 'flex', letterSpacing: -0.4, marginTop: 2}}>
            {scene.title.split('').map((ch, i) => {
              const p = ramp(lt, 0.25 + i * 0.016, 0.65 + i * 0.016);
              return (
                <span key={i} style={{opacity: p, translate: `0px ${(1 - p) * 10}px`, whiteSpace: 'pre', display: 'inline-block'}}>
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      {/* meter kemajuan bersegmen di kanan atas */}
      <div style={{position: 'absolute', right: 84, top: 82, display: 'flex', gap: 5, opacity: ramp(lt, 0.3, 0.9)}}>
        {CHAPTERS.map((s, i) => {
          const c = s.part ? PARTS[s.part].color : C.gold;
          const on = i < idx ? 1 : i === idx ? ramp(lt, 0.4, 1.2) : 0;
          return <div key={s.id} style={{width: 12, height: 22, borderRadius: 3, background: c, opacity: 0.16 + 0.84 * on, boxShadow: on > 0.5 && i === idx ? `0 0 12px ${c}` : undefined}} />;
        })}
      </div>
    </AbsoluteFill>
  );
};
