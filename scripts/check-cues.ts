// Memeriksa bahwa setiap wordOf(i, 'kata') di adegan menemukan kata itu di baris i naskah
// (bila tidak, animasi diam-diam jatuh ke awal baris → tidak sinkron dengan narasi).
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {SCRIPT} from '../src/script.ts';
import {SCENES_FILE} from './scene-files.ts';

let bad = 0;
for (const [id, file] of Object.entries(SCENES_FILE)) {
  const src = existsSync(`src/scenes/${file}.tsx`) ? readFileSync(`src/scenes/${file}.tsx`, 'utf8') : '';
  const scene = SCRIPT.find((s) => s.id === id);
  if (!scene) continue;
  for (const m of src.matchAll(/wordOf\((\d+),\s*'([^']+)'(?:,\s*(\d+))?\)/g)) {
    const i = Number(m[1]);
    const line = scene.lines[i]?.text ?? '';
    const words = line.split(/\s+/);
    const hits = words.filter((w) => w.toLowerCase().includes(m[2].toLowerCase()));
    if (!hits.length) {
      console.log(`✗ ${id}: wordOf(${i}, '${m[2]}') tidak ada di "${line}"`);
      bad++;
    } else if (m[3] !== undefined && Number(m[3]) >= hits.length) {
      console.log(`✗ ${id}: wordOf(${i}, '${m[2]}', ${m[3]}) hanya ada ${hits.length}×`);
      bad++;
    } else if (hits.length > 1 && m[3] === undefined) {
      console.log(`? ${id}: wordOf(${i}, '${m[2]}') cocok ${hits.length}× (dipakai yang pertama): ${hits.join(' | ')}`);
    }
  }
  const maxCue = Math.max(-1, ...[...src.matchAll(/cue\((\d+)\)/g)].map((m) => Number(m[1])));
  if (maxCue > scene.lines.length) console.log(`✗ ${id}: cue(${maxCue}) melebihi ${scene.lines.length} baris`);
}
void readdirSync;
console.log(bad ? `${bad} penanda kata tidak cocok` : 'Semua penanda kata cocok.');
