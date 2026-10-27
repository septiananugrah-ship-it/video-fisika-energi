// Render satu potongan (chunk) video tanpa audio, untuk dirender paralel di GitHub Actions.
//   CHUNK=0 CHUNKS=12 node --experimental-strip-types scripts/render-chunk.ts
// Hasil: out/chunks/chunk-XX.mp4 (frame ke-a s.d. b dari komposisi 2K 2560×1440).
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {TOTAL_FRAMES} from '../src/timeline.ts';

const chunk = Number(process.env.CHUNK ?? 0);
const chunks = Number(process.env.CHUNKS ?? 1);
const composition = process.env.COMPOSITION ?? 'UsahaEnergi2K';
const props = process.env.PROPS || '{}';
const concurrency = process.env.RENDER_CONCURRENCY ?? '4';

const per = Math.ceil(TOTAL_FRAMES / chunks);
const a = chunk * per;
const b = Math.min(TOTAL_FRAMES - 1, a + per - 1);
if (a > b) {
  console.log(`Chunk ${chunk} kosong, dilewati.`);
  process.exit(0);
}
mkdirSync('out/chunks', {recursive: true});
const out = `out/chunks/chunk-${String(chunk).padStart(2, '0')}.mp4`;
console.log(`Chunk ${chunk + 1}/${chunks}: frame ${a}–${b} (${b - a + 1} frame) → ${out}`);

const args = [
  'remotion', 'render', 'src/index.ts', composition, out,
  `--frames=${a}-${b}`, '--codec=h264', '--crf=16', '--x264-preset=slow',
  '--pixel-format=yuv420p', '--muted', `--concurrency=${concurrency}`, `--props=${props}`,
];
for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    execFileSync('npx', args, {stdio: 'inherit'});
    break;
  } catch (e) {
    if (attempt === 2) throw e;
    console.log('Render gagal, mencoba sekali lagi…');
  }
}
const probe = JSON.parse(
  execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets,width,height', '-of', 'json', out]).toString(),
).streams[0];
console.log(`Verifikasi: ${probe.width}×${probe.height}, ${probe.nb_read_packets} frame`);
if (Number(probe.nb_read_packets) !== b - a + 1) throw new Error(`Jumlah frame tidak cocok: ${probe.nb_read_packets}, harusnya ${b - a + 1}`);
