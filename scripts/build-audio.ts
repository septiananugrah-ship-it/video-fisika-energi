// Bangun trek audio final dengan ffmpeg (jauh lebih cepat daripada render audio Remotion).
// Sama dengan Composition.tsx: musik × musicVolume, fade-in 1 dtk, fade-out 2 dtk,
// dan (jika voiceover:true) setiap baris public/voiceover/<kode>.mp3 diletakkan pada timecode-nya.
//   PROPS='{"musicVolume":0.9,"voiceover":false}' node --experimental-strip-types scripts/build-audio.ts out/audio.m4a
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {defaultVideoProps} from '../src/defaults.ts';
import {FPS, TIMELINE, TOTAL_FRAMES, lineKey} from '../src/timeline.ts';

const out = process.argv[2] ?? 'out/audio.m4a';
const props = {...defaultVideoProps, ...JSON.parse(process.env.PROPS || '{}')};
const total = TOTAL_FRAMES / FPS;

const inputs: string[] = ['-f', 'lavfi', '-t', total.toFixed(3), '-i', 'anullsrc=r=48000:cl=stereo'];
const filters: string[] = [];
const mixes: string[] = ['[0:a]'];
let n = 1;
if (props.musicVolume > 0) {
  inputs.push('-i', 'public/music.mp3');
  filters.push(
    `[${n}:a]aresample=48000,atrim=0:${total.toFixed(3)},volume=${props.musicVolume},afade=t=in:d=1,afade=t=out:st=${(total - 2).toFixed(3)}:d=2[m]`,
  );
  mixes.push('[m]');
  n++;
}
if (props.voiceover) {
  for (const s of TIMELINE.scenes) {
    for (const l of s.tLines) {
      const f = `public/voiceover/${lineKey(s.id, l.index)}.mp3`;
      if (!existsSync(f)) throw new Error(`Rekaman tidak ditemukan: ${f}`);
      inputs.push('-i', f);
      const ms = Math.round((Math.round(l.start * FPS) / FPS) * 1000);
      filters.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${n}]`);
      mixes.push(`[v${n}]`);
      n++;
    }
  }
}
filters.push(`${mixes.join('')}amix=inputs=${mixes.length}:normalize=0:duration=first[out]`);
execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-c:a', 'aac', '-b:a', '256k', out], {
  stdio: 'inherit',
});
console.log(`Audio ${total.toFixed(2)} dtk → ${out}`);
