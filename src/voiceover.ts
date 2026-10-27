// File ini ditulis ulang otomatis oleh scripts/generate-voiceover.ts.
// Berisi durasi rekaman per baris narasi (detik). Kosong = memakai estimasi suku kata.
export const VOICEOVER_DURATIONS: Record<string, number> = {};

// Jeda hening di dalam setiap rekaman [mulai, selesai] (detik), untuk sinkron kata subtitle.
export const VOICEOVER_SILENCES: Record<string, [number, number][]> = {};
