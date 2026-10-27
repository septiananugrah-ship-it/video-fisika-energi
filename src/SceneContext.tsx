import React, {createContext, useContext} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {type TScene} from './timeline.ts';

// Waktu pra-gulir sebelum scene dimulai (dipakai untuk crossfade antar-scene).
export const PRE = 0.8;
export const POST = 0.8;

const Ctx = createContext<{scene: TScene; pre: number} | null>(null);

export const SceneProvider: React.FC<{scene: TScene; pre: number; children: React.ReactNode}> = ({scene, pre, children}) => (
  <Ctx.Provider value={{scene, pre}}>{children}</Ctx.Provider>
);

/**
 * Waktu scene dalam detik (0 = awal scene; negatif saat crossfade masuk),
 * plus penanda waktu setiap baris narasi agar visual selalu sinkron dengan naskah.
 */
export const useScene = () => {
  const ctx = useContext(Ctx);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!ctx) throw new Error('useScene harus dipakai di dalam SceneProvider');
  const {scene, pre} = ctx;
  const t = frame / fps - pre;
  const n = scene.lineTimes.length;
  /** Detik saat baris ke-i mulai dibacakan. */
  const cue = (i: number) => (i >= n ? scene.duration : scene.lineTimes[Math.max(0, i)]?.start ?? 0);
  /** Detik saat baris ke-i selesai dibacakan. */
  const cueEnd = (i: number) => scene.lineTimes[Math.min(i, n - 1)]?.end ?? scene.duration;
  /** Detik saat kata ke-k (0-index) dari baris i diucapkan. */
  const word = (i: number, k: number) => {
    const w = scene.tLines[i]?.words[k];
    return w ? w.start - scene.start : cue(i);
  };
  /** Detik saat kata yang memuat `needle` pada baris i diucapkan (nth = kemunculan ke-n, mulai 0). */
  const wordOf = (i: number, needle: string, nth = 0) => {
    const words = scene.tLines[i]?.words ?? [];
    const w = words.filter((x) => x.text.toLowerCase().includes(needle.toLowerCase()))[nth];
    return w ? w.start - scene.start : cue(i);
  };
  return {t, fps, cue, cueEnd, word, wordOf, dur: scene.duration, scene};
};
