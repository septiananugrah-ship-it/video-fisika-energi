// Teks khusus mesin suara (TTS). Subtitle tetap memakai `text` (dengan simbol),
// sedangkan ElevenLabs menerima versi yang ejaannya dibuat ramah pengucapan Indonesia:
// huruf tunggal dibaca sebagai nama hurufnya (J → "je", B → "be"), nama huruf Yunani
// dieja seperti di kelas (theta → "teta", rho → "ro"), nama tokoh dieja seperti diucapkan. Baris boleh memberi `tts` sendiri.
import type {Line} from './script.ts';

const LETTER: Record<string, string> = {
  F: 'ef',
  W: 'we',
  K: 'ka',
  U: 'u',
  T: 'te',
  Q: 'ki',
  H: 'ha',
  P: 'pe',
  g: 'ge',
  v: 'fe',
  m: 'em',
  h: 'ha',
  k: 'ka',
  x: 'eks',
  y: 'ye',
  s: 'es',
  d: 'de',
};

const WORD: Record<string, string> = {
  theta: 'teta',
  rho: 'ro',
  Feynman: 'Fainmen',
  Joule: 'Jul',
  joule: 'jul',
  James: 'Jems',
  Boltzmann: 'Boltsman',
  Hooke: 'Huk',
  watt: 'wat',
  kilojoule: 'kilojul',
  roller: 'roler',
  coaster: 'koster',
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
