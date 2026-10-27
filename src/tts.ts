// Teks khusus mesin suara (TTS). Subtitle tetap memakai `text` (dengan simbol),
// sedangkan ElevenLabs menerima versi yang ejaannya dibuat ramah pengucapan Indonesia:
// huruf tunggal dibaca sebagai nama hurufnya (J → "je", B → "be"), nama huruf Yunani
// dieja seperti di kelas (phi → "fi", theta → "teta"). Baris boleh memberi `tts` sendiri.
import type {Line} from './script.ts';

const LETTER: Record<string, string> = {
  B: 'be',
  C: 'ce',
  D: 'de',
  E: 'e',
  F: 'ef',
  I: 'i',
  J: 'je',
  L: 'el',
  M: 'em',
  P: 'pe',
  R: 'er',
  T: 'te',
  Y: 'ye',
  q: 'ki',
  r: 'er',
  m: 'em',
  h: 'ha',
  c: 'ce',
  k: 'ka',
  x: 'eks',
  z: 'zet',
  s: 'es',
  p: 'pe',
  d: 'de',
};

const WORD: Record<string, string> = {
  phi: 'fi',
  theta: 'teta',
  'Schrödinger': 'Syrodinger',
};

export const ttsText = (line: Line) => {
  if (line.tts) return line.tts;
  return line.text
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^([A-Za-zÀ-ž]+)([.,;:!?]*)$/);
      if (!m) return tok;
      const [, core, punct] = m;
      if (core.length === 1 && LETTER[core]) return LETTER[core] + punct;
      if (WORD[core]) return WORD[core] + punct;
      return tok;
    })
    .join('');
};
