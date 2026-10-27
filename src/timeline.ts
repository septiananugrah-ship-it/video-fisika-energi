// Mengubah naskah menjadi timeline: kapan setiap scene, baris, dan kata dibacakan.
// File ini tidak bergantung pada Remotion, sehingga bisa dipakai juga oleh
// scripts/export-timeline.ts (naskah teleprompter, SRT, dan peta musik).
import {SCRIPT, type SceneScript} from './script.ts';
import {VOICEOVER_DURATIONS, VOICEOVER_SILENCES} from './voiceover.ts';

// Durasi rekaman per baris (detik), diisi otomatis oleh scripts/generate-voiceover.ts.
// Jika ada, durasi rekaman menggantikan estimasi suku kata.
const MEASURED = VOICEOVER_DURATIONS;
const SILENCES: Record<string, [number, number][]> = VOICEOVER_SILENCES;
export const lineKey = (sceneId: string, index: number) => `${sceneId}-${String(index).padStart(2, '0')}`;

export const FPS = 30;

// Kecepatan baca narator edukasi yang tenang: ~5,3 suku kata per detik
// (sekitar 115-125 kata per menit untuk bahasa Indonesia).
export const SYLLABLES_PER_SECOND = 5.3;
const DEFAULT_PAUSE = 0.6;
const DEFAULT_LEAD = 1.0;
const DEFAULT_TAIL = 1.4;

export type TWord = {
  text: string;
  start: number; // detik, absolut
  end: number;
  hl: boolean;
};

export type TLine = {
  scene: string;
  index: number;
  text: string;
  start: number;
  end: number; // akhir ucapan (tanpa jeda)
  pauseEnd: number; // akhir jeda setelah baris
  words: TWord[];
};

export type TScene = SceneScript & {
  index: number;
  start: number;
  end: number;
  duration: number;
  lineTimes: {start: number; end: number}[]; // relatif terhadap awal scene
  tLines: TLine[];
};

const VOWELS = /[aiueoéèöü]/g;
const DIPHTHONG = /(ai|au|oi|ei)(?![aiueo])/g;

const spelledLetters = (token: string) => {
  // Singkatan (PET, FTIR, C-H) dibaca per huruf.
  const letters = token.replace(/[^A-Z]/g, '');
  return letters.length;
};

export const syllables = (raw: string): number => {
  const token = raw.replace(/[.,;:!?"“”()]/g, '');
  if (!token) return 0;
  if (/^[A-Z]{1,5}$/.test(token) || /^[A-Z]-[A-Z]$/.test(token)) {
    return Math.max(1, spelledLetters(token));
  }
  // Kata ulang (sama-sama, atom-atom) dihitung kedua bagiannya.
  return token
    .toLowerCase()
    .split('-')
    .reduce((sum, part) => {
      const v = (part.match(VOWELS) ?? []).length;
      const d = (part.match(DIPHTHONG) ?? []).length;
      return sum + Math.max(1, v - d);
    }, 0);
};

const punctuationPause = (word: string, isLast: boolean) => {
  if (isLast) return 0; // jeda akhir baris diatur oleh `pause`
  if (/[.!?]$/.test(word)) return 0.4;
  if (/[:;]$/.test(word)) return 0.32;
  if (/,$/.test(word)) return 0.2;
  return 0;
};

const normalize = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, '');

const markHighlights = (tokens: string[], hl: string[] = []) => {
  const flags = tokens.map(() => false);
  const norm = tokens.map(normalize);
  for (const phrase of hl) {
    const p = phrase.split(/\s+/).map(normalize);
    for (let i = 0; i + p.length <= norm.length; i++) {
      if (p.every((w, j) => norm[i + j] === w || norm[i + j].startsWith(w))) {
        for (let j = 0; j < p.length; j++) flags[i + j] = true;
        break;
      }
    }
  }
  return flags;
};

export const lineDuration = (text: string) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.reduce(
    (sum, w, i) => sum + Math.max(0.16, syllables(w) / SYLLABLES_PER_SECOND) + punctuationPause(w, i === tokens.length - 1),
    0,
  );
};

/**
 * Menempatkan kata-kata di dalam rekaman sungguhan: jeda hening yang terdeteksi dipakai
 * sebagai batas frasa (setelah koma/titik dua/titik), dan kata di dalam frasa dibagi
 * menurut jumlah suku kata. Hasil: posisi relatif {start, end} per kata (detik).
 */
const alignWords = (tokens: string[], dur: number, sil: [number, number][]) => {
  let v0 = 0;
  let v1 = dur;
  for (const [a, b] of sil) {
    if (a <= 0.03) v0 = Math.max(v0, b);
    if (b >= dur - 0.03) v1 = Math.min(v1, a);
  }
  if (v1 - v0 < 0.3) {
    v0 = 0;
    v1 = dur;
  }
  // kelompokkan kata menjadi frasa berdasarkan tanda baca
  const phrases: number[][] = [[]];
  tokens.forEach((w, i) => {
    phrases[phrases.length - 1].push(i);
    if (/[,;:.!?]$/.test(w) && i < tokens.length - 1) phrases.push([]);
  });
  const need = phrases.length - 1;
  const inner = sil
    .filter(([a, b]) => a > v0 + 0.05 && b < v1 - 0.05)
    .sort((x, y) => y[1] - y[0] - (x[1] - x[0]))
    .slice(0, need)
    .sort((x, y) => x[0] - y[0]);
  const segs: [number, number][] = [];
  if (need > 0 && inner.length === need) {
    let a = v0;
    for (const [s0, s1] of inner) {
      segs.push([a, s0]);
      a = s1;
    }
    segs.push([a, v1]);
  }
  const groups = segs.length ? phrases : [tokens.map((_, i) => i)];
  const ranges = segs.length ? segs : [[v0, v1] as [number, number]];
  const out: {start: number; end: number}[] = new Array(tokens.length);
  groups.forEach((g, gi) => {
    const [a, b] = ranges[gi];
    const w = g.map((i) => Math.max(0.85, syllables(tokens[i])));
    // tanpa jeda nyata: sisipkan perkiraan jeda tanda baca di dalam frasa
    const gap = g.map((i, k) => (segs.length || k === g.length - 1 ? 0 : punctuationPause(tokens[i], false) * SYLLABLES_PER_SECOND));
    const units = w.reduce((x, y) => x + y, 0) + gap.reduce((x, y) => x + y, 0);
    const per = (b - a) / units;
    let c = a;
    g.forEach((i, k) => {
      out[i] = {start: c, end: c + w[k] * per};
      c += (w[k] + gap[k]) * per;
    });
  });
  return out;
};

const buildTimeline = () => {
  let cursor = 0;
  const scenes: TScene[] = [];
  SCRIPT.forEach((s, index) => {
    const start = cursor;
    const lineTimes: {start: number; end: number}[] = [];
    const tLines: TLine[] = [];
    if (s.fixed) {
      cursor += s.fixed;
    } else {
      cursor += s.lead ?? DEFAULT_LEAD;
      s.lines.forEach((line, li) => {
        const tokens = line.text.split(/\s+/).filter(Boolean);
        const flags = markHighlights(tokens, line.hl);
        const lineStart = cursor;
        const key = lineKey(s.id, li);
        const measured = MEASURED[key];
        let words: TWord[];
        if (measured) {
          // rekaman ada: kata diselaraskan dengan jeda nyata di dalam rekaman
          const pos = alignWords(tokens, measured, SILENCES[key] ?? []);
          words = tokens.map((w, i) => ({text: w, start: lineStart + pos[i].start, end: lineStart + pos[i].end, hl: flags[i]}));
          cursor = lineStart + measured;
        } else {
          words = tokens.map((w, i) => {
            const d = Math.max(0.16, syllables(w) / SYLLABLES_PER_SECOND);
            const word = {text: w, start: cursor, end: cursor + d, hl: flags[i]};
            cursor += d + punctuationPause(w, i === tokens.length - 1);
            return word;
          });
        }
        const lineEnd = cursor;
        cursor += line.pause ?? DEFAULT_PAUSE;
        lineTimes.push({start: lineStart - start, end: lineEnd - start});
        tLines.push({scene: s.id, index: li, text: line.text, start: lineStart, end: lineEnd, pauseEnd: cursor, words});
      });
      cursor += s.tail ?? DEFAULT_TAIL;
    }
    // Bulatkan ke frame agar batas scene tepat.
    cursor = Math.round(cursor * FPS) / FPS;
    scenes.push({...s, index, start, end: cursor, duration: cursor - start, lineTimes, tLines});
  });
  return {scenes, total: cursor};
};

export const TIMELINE = buildTimeline();
export const TOTAL_SECONDS = TIMELINE.total;
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);
export const ALL_LINES: TLine[] = TIMELINE.scenes.flatMap((s) => s.tLines);

export const sceneById = (id: string) => {
  const s = TIMELINE.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Scene ${id} tidak ditemukan`);
  return s;
};

export const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
