// Render seluruh film resolusi rendah tanpa audio untuk deteksi glitch (lonjakan beda antar-frame).
//   CHROME_PATH=... node scripts/qa-film.mjs <out.mp4> [frameAwal] [frameAkhir] [scale]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [out, a, b, sc = '0.25'] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH ?? null;
const inputProps = {showCaptions: true, musicVolume: 0, voiceover: false};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'UsahaEnergi', inputProps, browserExecutable});
const A = Number(a ?? 0);
const B = Math.min(composition.durationInFrames - 1, Number(b ?? composition.durationInFrames - 1));
const t0 = Date.now();
await renderMedia({serveUrl, composition, codec: 'h264', crf: 28, outputLocation: out, inputProps, browserExecutable, scale: Number(sc), concurrency: 2, muted: true, frameRange: [A, B], imageFormat: 'jpeg', jpegQuality: 70});
console.log(out, ((Date.now() - t0) / 1000).toFixed(0) + 's', B - A + 1, 'frames');
