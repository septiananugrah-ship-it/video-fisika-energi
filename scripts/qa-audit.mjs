// Audit visual: 3 still per adegan (awal, tengah, akhir) + 3 still di setiap transisi (−0,3 / 0 / +0,3 dtk).
// Pemakaian: CHROME_PATH=... node scripts/qa-audit.mjs [out-dir] [sceneId ...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out/audit');
const only = process.argv.slice(3);
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const browserExecutable = process.env.CHROME_PATH ?? null;
const comp = await selectComposition({serveUrl, id: 'UsahaEnergi', inputProps, browserExecutable});
const {TIMELINE, FPS} = await import('../src/timeline.ts');
const shot = async (sec, name) => {
  const frame = Math.max(0, Math.min(comp.durationInFrames - 1, Math.round(sec * FPS)));
  await renderStill({serveUrl, composition: comp, frame, output: path.join(outDir, name), inputProps, imageFormat: 'jpeg', jpegQuality: 78, browserExecutable, scale: 0.5});
};
for (const s of TIMELINE.scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const tag = `${String(s.index).padStart(2, '0')}-${s.id}`;
  await shot(s.start + Math.min(1.6, s.duration * 0.15), `${tag}-a-awal.jpg`);
  await shot(s.start + s.duration * 0.5, `${tag}-b-tengah.jpg`);
  await shot(s.end - 1.0, `${tag}-c-akhir.jpg`);
  if (s.index > 0) for (const [k, dt] of [-0.3, 0, 0.3].entries()) await shot(s.start + dt, `${tag}-t${k}.jpg`);
  console.log(tag);
}
