// Voice-over per baris narasi.
//
//   ELEVENLABS_API_KEY=xxx npm run voiceover            → buat MP3 per baris via ElevenLabs, lalu ukur durasinya
//   npm run voiceover -- --measure                       → hanya ukur rekaman yang sudah ada (mis. rekaman suara sendiri)
//
// File disimpan di public/voiceover/<kode-baris>.mp3 (kode lihat naskah/NASKAH_VOICEOVER.md).
// Durasi hasil ukur ditulis ke src/voiceover.ts sehingga timeline, subtitle, dan animasi
// menyesuaikan dengan suara sebenarnya. Setelah itu jalankan `npm run timeline && npm run music`
// lalu render dengan props {"voiceover": true}.
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {SCRIPT} from '../src/script.ts';
import {lineKey} from '../src/timeline.ts';
import {ttsText} from '../src/tts.ts';

const measureOnly = process.argv.includes('--measure');
const apiKey = process.env.ELEVENLABS_API_KEY;
// Voice ID suara klon (dari akun ElevenLabs pemilik suara). Sengaja tanpa nilai bawaan.
const voiceId = process.env.ELEVENLABS_VOICE_ID || '';
const modelId = process.env.ELEVENLABS_MODEL || 'eleven_v4';

mkdirSync('public/voiceover', {recursive: true});

if (!measureOnly && !apiKey) {
  console.error('ELEVENLABS_API_KEY belum diisi. Gunakan --measure untuk mengukur rekaman sendiri.');
  process.exit(1);
}
if (!measureOnly && !voiceId) {
  console.error('ELEVENLABS_VOICE_ID belum diisi: isi voice ID suara klon (input workflow atau secret ELEVENLABS_VOICE_ID).');
  process.exit(1);
}

const durations: Record<string, number> = {};
const silences: Record<string, [number, number][]> = {};

/** Jeda hening di dalam rekaman (detik) — dipakai untuk menyelaraskan kata subtitle dengan suara. */
const detectSilences = (file: string, dur: number): [number, number][] => {
  // silencedetect menulis hasilnya ke stderr
  const log = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-38dB:d=0.12', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
  const res: [number, number][] = [];
  let open: number | null = null;
  for (const m of log.matchAll(/silence_(start|end): ([\d.]+)/g)) {
    const v = Number(m[2]);
    if (m[1] === 'start') open = v;
    else if (open !== null) {
      res.push([Math.round(open * 1000) / 1000, Math.round(Math.min(v, dur) * 1000) / 1000]);
      open = null;
    }
  }
  if (open !== null) res.push([Math.round(open * 1000) / 1000, dur]);
  return res;
};
for (const scene of SCRIPT) {
  for (const [i, line] of scene.lines.entries()) {
    const key = lineKey(scene.id, i);
    const file = `public/voiceover/${key}.mp3`;
    if (!measureOnly && !existsSync(file)) {
      const prev = scene.lines[i - 1] ? ttsText(scene.lines[i - 1]) : undefined;
      const next = scene.lines[i + 1] ? ttsText(scene.lines[i + 1]) : undefined;
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {'xi-api-key': apiKey!, 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
        body: JSON.stringify({
          text: ttsText(line),
          model_id: modelId,
          // language_code tidak didukung model multilingual_v2
          ...(modelId.includes('multilingual_v2') ? {} : {language_code: 'id'}),
          previous_text: prev,
          next_text: next,
          voice_settings: {stability: 0.55, similarity_boost: 0.75, style: 0, speed: 0.95},
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        const hint =
          res.status === 401
            ? 'API key salah atau belum disimpan.'
            : res.status === 402 || /quota|credit/i.test(body)
              ? 'Kredit ElevenLabs habis atau suara ini butuh paket berbayar.'
              : '';
        throw new Error(`${key}: ${res.status} ${body} ${hint}`);
      }
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log(`✓ ${key}`);
    }
    if (existsSync(file)) {
      const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString();
      const dur = Math.round(Number(out) * 1000) / 1000;
      durations[key] = dur;
      silences[key] = detectSilences(file, dur);
    }
  }
}

writeFileSync(
  'src/voiceover.ts',
  `// File ini ditulis ulang otomatis oleh scripts/generate-voiceover.ts.\n// Berisi durasi rekaman per baris narasi (detik). Kosong = memakai estimasi suku kata.\nexport const VOICEOVER_DURATIONS: Record<string, number> = ${JSON.stringify(durations, null, 2)};\n\n// Jeda hening di dalam setiap rekaman [mulai, selesai] (detik), untuk sinkron kata subtitle.\nexport const VOICEOVER_SILENCES: Record<string, [number, number][]> = ${JSON.stringify(silences)};\n`,
);
console.log(`${Object.keys(durations).length} baris diukur → src/voiceover.ts`);
console.log('Lanjutkan: npm run timeline && npm run music, lalu render dengan --props=\'{"voiceover":true}\'');
