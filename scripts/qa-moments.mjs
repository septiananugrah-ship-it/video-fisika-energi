// Still pada momen tertentu: "adegan:baris:offset" (offset detik dari awal baris; 'end' = akhir baris).
// Pemakaian: CHROME_PATH=... node scripts/qa-moments.mjs <out-dir> hook:6:1.5 series:6:1.4 ...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out/moments');
const specs = process.argv.slice(3);
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const browserExecutable = process.env.CHROME_PATH ?? null;
const comp = await selectComposition({serveUrl, id: 'UsahaEnergi', inputProps, browserExecutable});
const {TIMELINE, FPS} = await import('../src/timeline.ts');
for (const spec of specs) {
  const [id, li, off] = spec.split(':');
  const s = TIMELINE.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`adegan ${id} tidak ada`);
  const l = s.tLines[Number(li)];
  const sec = off === 'end' ? l.end - 0.1 : (l ? l.start : s.start) + Number(off);
  const frame = Math.max(0, Math.min(comp.durationInFrames - 1, Math.round(sec * FPS)));
  const file = path.join(outDir, `${String(s.index).padStart(2, '0')}-${id}-L${li}-${off}.jpg`);
  await renderStill({serveUrl, composition: comp, frame, output: file, inputProps, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable, scale: 0.5});
  console.log(file);
}
