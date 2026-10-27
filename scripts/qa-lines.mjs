// Still di akhir setiap baris narasi (+ tengah baris panjang) — momen layar paling penuh.
// Pemakaian: CHROME_PATH=... node scripts/qa-lines.mjs <out-dir> [sceneId ...]
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out/lines');
const only = process.argv.slice(3);
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const browserExecutable = process.env.CHROME_PATH ?? null;
const puppeteerInstance = await openBrowser('chrome', {browserExecutable});
const comp = await selectComposition({serveUrl, id: 'UsahaEnergi', inputProps, browserExecutable, puppeteerInstance});
const {TIMELINE, FPS} = await import('../src/timeline.ts');
for (const s of TIMELINE.scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const lines = s.lineTimes.length
    ? s.lineTimes.map((l) => ({start: s.start + l.start, end: s.start + l.end}))
    : [0.3, 0.6, 0.95].map((f) => ({start: s.start, end: s.start + s.duration * f + 0.35}));
  for (const [i, l] of lines.entries()) {
    const marks = [l.end - 0.35];
    if (l.end - l.start > 6) marks.unshift((l.start + l.end) / 2);
    for (const [k, sec] of marks.entries()) {
      const frame = Math.max(0, Math.min(comp.durationInFrames - 1, Math.round(sec * FPS)));
      const file = path.join(outDir, `${String(s.index).padStart(2, '0')}-${s.id}-L${String(i).padStart(2, '0')}${marks.length > 1 ? 'ab'[k] : ''}.jpg`);
      await renderStill({serveUrl, composition: comp, frame, output: file, inputProps, imageFormat: 'jpeg', jpegQuality: 72, browserExecutable, puppeteerInstance, scale: 0.4});
    }
  }
  console.log('ok', s.id);
}
await puppeteerInstance.close({silent: true});
