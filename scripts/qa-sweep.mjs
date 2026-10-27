// Sapuan QA cepat: render tiap N frame (skala kecil) untuk menangkap error runtime & frame kosong.
// Pemakaian: CHROME_PATH=... node scripts/qa-sweep.mjs <out-dir> [setiapNFrame=30]
import {bundle} from '@remotion/bundler';
import {renderFrames, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.argv[2] ?? 'out/sweep');
const nth = Number(process.argv[3] ?? 30);
mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const browserExecutable = process.env.CHROME_PATH ?? null;
const comp = await selectComposition({serveUrl, id: 'UsahaEnergi', inputProps, browserExecutable});
const errors = [];
await renderFrames({
  serveUrl,
  composition: comp,
  inputProps,
  outputDir: outDir,
  imageFormat: 'jpeg',
  jpegQuality: 70,
  scale: 0.25,
  everyNthFrame: nth,
  browserExecutable,
  concurrency: 2,
  onBrowserLog: (log) => {
    if (log.type === 'error' || log.type === 'warning') errors.push(log.text);
  },
  onStart: ({frameCount}) => console.log(`render ${frameCount} frame`),
});
console.log(`selesai; ${errors.length} log error/peringatan`);
for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ' + e.slice(0, 300));
