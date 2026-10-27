// Menulis naskah voice-over bertimecode, subtitle SRT, dan peta scene untuk musik.
// Jalankan: npm run timeline
import {mkdirSync, writeFileSync} from 'node:fs';
import {FPS, SYLLABLES_PER_SECOND, TIMELINE, formatTime, lineKey} from '../src/timeline.ts';
import {SCRIPT} from '../src/script.ts';
import {ttsText} from '../src/tts.ts';

mkdirSync('naskah', {recursive: true});
mkdirSync('public', {recursive: true});

const ts = (sec: number) => {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};
const precise = (sec: number) => `${formatTime(sec)}.${String(Math.floor((sec % 1) * 10))}`;

// ---------- Naskah voice-over (teleprompter) ----------
const md: string[] = [];
const words = TIMELINE.scenes.reduce((n, s) => n + s.tLines.reduce((m, l) => m + l.words.length, 0), 0);
md.push('# Naskah Voice-Over — *Mata Uang Semesta* (Fisika Umum: Usaha dan Energi)');
md.push('');
md.push(`Durasi total **${formatTime(TIMELINE.total)}** (${TIMELINE.total.toFixed(1)} dtk) · ${words} kata · tempo baca ±${SYLLABLES_PER_SECOND} suku kata/detik (±${Math.round((words / TIMELINE.scenes.reduce((n, s) => n + s.tLines.reduce((m, l) => m + (l.end - l.start), 0), 0)) * 60)} kata/menit saat berbicara).`);
md.push('');
md.push('Cara memakai: baca setiap baris tepat pada timecode-nya. Tanda **[jeda x dtk]** adalah ruang hening agar animasi sempat "bernapas". ');
md.push('Kata **tebal** adalah kata kunci yang disorot di layar — beri sedikit penekanan. ');
md.push('Bila ingin merekam per baris, beri nama file sesuai kode baris (mis. `hook-00.mp3`) lalu jalankan `npm run voiceover -- --measure` agar timeline menyesuaikan durasi rekaman.');
md.push('');
for (const s of TIMELINE.scenes) {
  md.push(`## ${formatTime(s.start)} — ${s.chapter ? `Bab ${s.chapter} · ` : ''}${s.title}`);
  md.push('');
  if (!s.tLines.length) {
    md.push(`*(tanpa narasi · ${s.duration.toFixed(1)} dtk · musik saja)*`);
    md.push('');
    continue;
  }
  md.push(`*(buka dengan hening ${(s.tLines[0].start - s.start).toFixed(1)} dtk)*`);
  md.push('');
  for (const l of s.tLines) {
    // gabungkan kata kunci yang berurutan menjadi satu frasa tebal
    const text = l.words
      .map((w, i) => {
        const open = w.hl && !l.words[i - 1]?.hl ? '**' : '';
        const close = w.hl && !l.words[i + 1]?.hl ? '**' : '';
        return `${open}${w.text}${close}`;
      })
      .join(' ');
    const pause = l.pauseEnd - l.end;
    md.push(`\`${precise(l.start)}\` \`${lineKey(s.id, l.index)}\` ${text} *[${(l.end - l.start).toFixed(1)} dtk]* **[jeda ${pause.toFixed(1)} dtk]**`);
    md.push('');
  }
}
writeFileSync('naskah/NASKAH_VOICEOVER.md', md.join('\n'));

// ---------- Naskah polos untuk TTS / dibaca ----------
writeFileSync(
  'naskah/naskah-polos.txt',
  TIMELINE.scenes
    .filter((s) => s.tLines.length)
    .map((s) => `[${formatTime(s.start)}] ${s.chapter ? `Bab ${s.chapter} — ` : ''}${s.title}\n\n${s.tLines.map((l) => l.text).join('\n')}`)
    .join('\n\n'),
);

// ---------- Teks yang dikirim ke mesin suara (untuk dicek pengucapannya) ----------
writeFileSync(
  'naskah/naskah-tts.txt',
  SCRIPT.filter((s) => s.lines.length)
    .flatMap((s) => s.lines.map((l, i) => `${lineKey(s.id, i)}\t${ttsText(l)}`))
    .join('\n') + '\n',
);

// ---------- Daftar bab untuk deskripsi YouTube / LMS ----------
const PART_NAMES: Record<number, string> = {1: 'Prinsip & teori dasar', 2: 'Implementasi dalam kimia', 3: 'Penerapan di industri'};
const chapters: string[] = ['Mata Uang Semesta — Usaha dan Energi (Fisika Umum) · SCIENTIAN', ''];
let lastPart = 0;
for (const s of TIMELINE.scenes) {
  if (s.id === 'title' || s.id === 'outro') continue;
  if (s.part && s.part !== lastPart) {
    chapters.push('', `BAGIAN ${s.part} · ${PART_NAMES[s.part]}`);
    lastPart = s.part;
  }
  if (!s.part && lastPart && s.chapter) chapters.push('');
  chapters.push(`${formatTime(s.start)} ${s.chapter ? `Bab ${s.chapter} · ` : ''}${s.id === 'hook' ? 'Pembuka: oven microwave & teleskop radio' : s.title}`);
}
writeFileSync('naskah/BAB_YOUTUBE.txt', chapters.join('\n') + '\n');

// ---------- SRT ----------
let n = 1;
const srt: string[] = [];
for (const s of TIMELINE.scenes) {
  for (const l of s.tLines) {
    srt.push(String(n++), `${ts(l.start)} --> ${ts(Math.min(l.pauseEnd, l.end + 1.2))}`, l.text, '');
  }
}
writeFileSync('naskah/narasi.srt', srt.join('\n'));

// ---------- Peta untuk musik ----------
writeFileSync(
  'public/timeline.json',
  JSON.stringify(
    {
      fps: FPS,
      total: TIMELINE.total,
      scenes: TIMELINE.scenes.map((s) => ({
        id: s.id,
        mood: s.mood,
        start: s.start,
        end: s.end,
        lines: s.tLines.map((l) => ({start: l.start, end: l.end, hl: l.words.filter((w) => w.hl).map((w) => w.start)})),
      })),
    },
    null,
    1,
  ),
);

console.log(`Timeline ${formatTime(TIMELINE.total)} · ${TIMELINE.scenes.length} scene · ${words} kata`);
for (const s of TIMELINE.scenes) console.log(`  ${formatTime(s.start)}  ${s.id.padEnd(10)} ${s.duration.toFixed(1)} dtk`);
