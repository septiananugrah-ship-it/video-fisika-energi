import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/600-italic.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';

export const W = 1920;
export const H = 1080;

// Palet "Lab Energi": malam biru tinta dengan kisi cetak biru.
// Setiap bentuk energi punya warna tetap di seluruh video (kode warna = alat berpikir):
//   K kinetik = jingga · Ug potensial gravitasi = biru · Us pegas = ungu ·
//   termal = merah · usaha W = hijau · gaya F = kuning.
export const C = {
  bg: '#070b18',
  bg2: '#0d1430',
  ink: '#eef3ff',
  muted: '#93a0c4',
  faint: '#3a4770',
  line: '#22305a',
  grid: '#1a2850',
  card: '#101a38',
  // bentuk energi
  kin: '#ff8a3d',
  pot: '#4da8ff',
  spr: '#b77dff',
  heat: '#ff4f64',
  work: '#4fe3a0',
  force: '#ffd24a',
  // aksen umum
  gold: '#ffc94a',
  cyan: '#4fd6ff',
  white: '#ffffff',
};

export type Hue = 'kin' | 'pot' | 'spr' | 'heat' | 'work' | 'force' | 'gold' | 'cyan' | 'ink' | 'muted' | 'white';
export const HUES: Hue[] = ['kin', 'pot', 'spr', 'heat', 'work', 'force', 'gold', 'cyan', 'ink', 'muted', 'white'];

export const FONT = {
  head: '"Space Grotesk", system-ui, sans-serif',
  sans: '"Inter", "Space Grotesk", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  serif: '"Source Serif 4", Georgia, serif',
};

// Warna atom (CPK) untuk bagian kimia.
export const ATOM: Record<string, {fill: string; r: number}> = {
  H: {fill: '#f2f5ff', r: 30},
  Cl: {fill: '#5fdc7a', r: 44},
  C: {fill: '#5b6585', r: 40},
  O: {fill: '#ff5a6e', r: 40},
  N: {fill: '#4d7dff', r: 40},
};

// Warna rona latar per suasana adegan.
export const MOOD_TINT: Record<string, string> = {
  mystery: '#1b1440',
  title: '#2a1a12',
  wonder: '#0f2a44',
  build: '#132046',
  tension: '#2e1220',
  bright: '#0f3036',
  resolve: '#122c2a',
  outro: '#1d1838',
};
