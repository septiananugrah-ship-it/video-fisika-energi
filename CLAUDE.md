# Konteks repo (untuk asisten AI)

- Video **"Mata Uang Semesta" — Usaha dan Energi** (Fisika Umum, S1 Kimia UNESA) milik **Yayan** (Septian Anugrah Dwi Putra), seri video Fisika Umum pertama. Aturan umum & pelajaran teknis: repo `septiananugrah-ship-it/science-intro` → `CLAUDE.md`.
- Seri berikutnya (repo terpisah, satu materi satu video): **Fluida Statis**, **Fluida Dinamis**, **Momentum**. Modul PDF ada di unggahan pengguna (tidak disimpan di repo); ringkasan angka yang dipakai ada di `naskah/AUDIT.md`.
- Branding: intro SCIENTIAN "Explore Science with Yayan" (dirender otomatis dari repo `science-intro` di workflow dan ditempel di depan), outro menampilkan SCIENTIAN + "Disusun oleh Septian Anugrah Dwi Putra" (diminta pengguna untuk seri fisika).
- Gaya **"Lab Energi"** (beda dari video Kimia Kuantum): malam biru tinta + kisi cetak biru, font Space Grotesk (judul/subtitle) + Inter + JetBrains Mono + Source Serif 4 (rumus). **Kode warna energi tetap di seluruh video**: K kinetik = jingga `C.kin`, Ug = biru `C.pot`, Us pegas = ungu `C.spr`, termal = merah `C.heat`, usaha W = hijau `C.work`, gaya F = kuning `C.force`, kata kunci subtitle = emas.
- Visual inti: benda yang bergerak sesuai fisika (dihitung analitik per frame) + **batang energi** (`EnergyBars`) yang berubah bersamaan. Komponen di `src/components/physics.tsx` & `primitives.tsx`.
- **Claude tidak menjalankan workflow GitHub Actions.** Setelah merge ke `main`, berhenti dan minta pengguna menekan *Run workflow* sendiri; beri link & isian.
- Narasi: menyusul (pengguna memilih ElevenLabs suara klon; Edge TTS gratis tersedia sebagai cadangan di workflow). Selalu sediakan versi tanpa narasi.

- **Poles animasi (v2):** semua adegan harus terus bergerak — lihat `naskah/POLISH.md`. Komponen hiasan bersama: `Stream` (aliran energi), `Ripple`, `Motes`, `Twinkles`, `Spark trail`; `Glow` bernapas, `Arrow` berdenyut, `Card` berkilau, `EnergyBars` cair — otomatis.

## Aturan konten & tata letak

- Rumus utama ≥ 56 px (`Formula`), satu kartu per momen; zona subtitle (bawah 180 px) selalu bebas; margin ≥ 80 px. Komponen HTML (`Formula`, `Card`, `Note`, `Badge`) di luar `<Stage>`.
- g = 10 m/s² seperti modul (kecuali disebut lain). "≈" untuk perkiraan. Koma desimal.
- Teks TTS terpisah dari subtitle (`src/tts.ts`, `tts:` per baris di `src/script.ts`).
- Kemulusan: `EASE` lembut (dari v2), fade keluar pakai `EASE_IN_OUT`; jangan ganti teks/warna berdasarkan ambang — silang-pudar; tanpa CSS blur pada lapisan adegan; jangan beri filter pada garis lurus.

## QA

- `CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/qa-moments.mjs out/x adegan:baris:offset ...` lalu `python3 scripts/contact.py out/x out/x-sheets 6` dan baca lembar kontaknya.
- `scripts/qa-lines.mjs` = still di akhir setiap baris narasi (audit menyeluruh).
