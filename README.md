# Mata Uang Semesta — Usaha dan Energi (Fisika Umum)

Video edukasi **≈ 26 menit** (2K, 30 FPS) · **SCIENTIAN — Explore Science with Yayan** · disusun oleh **Septian Anugrah Dwi Putra**. Seri Fisika Umum #1 (berikutnya: Fluida Statis, Fluida Dinamis, Momentum). Dibuat dengan [Remotion](https://remotion.dev).

Gaya visual **"Lab Energi"**: malam biru tinta dengan kisi cetak biru, benda yang bergerak sesuai fisika, dan **batang energi** berkode warna (K jingga · Ug biru · Us ungu · termal merah · usaha hijau · gaya kuning) yang selalu menunjukkan ke mana energi pergi. Intro SCIENTIAN dirender otomatis dari repo `science-intro` dan ditempel di depan.

## Isi

| Bagian | Bab |
|---|---|
| Pembuka | Bola boling di ujung hidung · judul · peta video |
| 1 · Konsep & cara berpikir | 01 Energi: angka yang selalu tetap (balok Feynman) · 02 Usaha (F s cos θ, tanda +/0/−) · 03 Contoh usaha setiap gaya · 04 Gaya berubah: usaha = luas · 05 Energi kinetik & teorema usaha–energi (mengapa kuadrat, jarak pengereman) · 06 Gaya konservatif & energi potensial · 07 Energi potensial gravitasi · 08 Pegas ½kx² · 09 Kekekalan energi mekanik · 10 Gesekan: energi tidak hilang · 11 Daya & efisiensi · 12 Cara berpikir memecahkan soal |
| 2 · Energi dalam kimia | 13 Ikatan sebagai pegas & sumur energi · 14 Panas = gerak molekul (Joule, 3/2 kT) · 15 Bukit energi reaksi |
| 3 · Penerapan | 16 PLTA · 17 Rem, jalan raya & mobil listrik · 18 Energi di rumah & tubuh |
| Penutup | 19 Rangkuman · rujukan |

Daftar bab bertimecode ada di `naskah/BAB_YOUTUBE.txt`, naskah teleprompter di `naskah/NASKAH_VOICEOVER.md` (cocok juga untuk merekam suara sendiri), audit angka di `naskah/AUDIT.md`.

## Render (tombol ditekan sendiri, tab **Actions**)

- **Belum ada suara?** Jalankan **Render Usaha & Energi 2K 30FPS → Run workflow** dengan isian bawaan → versi musik + subtitle (`usaha-energi-tanpa-narasi-2k-30fps`).
- **Dengan narasi:** **Buat voice-over + render 2K → Run workflow**, pilih `mesin`:
  - `elevenlabs` — suara klon. Isi secret `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` (Settings → Secrets and variables → Actions), atau isi voice ID di form. ±19 ribu karakter untuk seluruh naskah (muat dalam kuota Starter 30 ribu/bulan).
  - `edge` — gratis, tanpa kunci (suara Microsoft `id-ID-ArdiNeural` laki-laki / `id-ID-GadisNeural` perempuan).
  Workflow membuat suara per baris, menyesuaikan timeline/subtitle/musik dengan durasi suara asli, menyimpannya ke repo, lalu merender versi **dengan narasi** dan **tanpa narasi**.
- Setelah suara jadi, disarankan **Cek pengucapan narasi (Whisper)**.
- Unduh artefak di halaman run (iPad: tekan lama nama artefak → *Unduh Tautan Tertaut*).

Baris yang teksnya diubah: hapus `public/voiceover/<kode>.mp3` agar dibuat ulang (workflow hanya membuat baris yang belum ada). Rekaman suara sendiri: simpan per baris dengan kode di `naskah/NASKAH_VOICEOVER.md`, lalu `npm run voiceover -- --measure`.

## Menjalankan sendiri

```bash
npm ci
npm run dev                # Remotion Studio: "UsahaEnergi", "UsahaEnergi2K", atau folder "Adegan"
npm run timeline           # perbarui naskah VO, SRT, BAB_YOUTUBE, peta musik
npm run music              # sintesis ulang musik (python3 + numpy + ffmpeg)
npm run lint               # cek tipe TypeScript
```

## Struktur

```
src/script.ts           naskah per adegan (teks, kata kunci, jeda, ejaan TTS opsional)
src/tts.ts              teks ramah-TTS (ejaan huruf & simbol)
src/timeline.ts         waktu baris & kata (estimasi suku kata, atau durasi rekaman asli)
src/components/         latar cetak biru, subtitle, heading bab, primitif rumus, komponen fisika (batang energi, pegas, balok, grafik)
src/scenes/             23 adegan
scripts/                voice-over (ElevenLabs/Edge), musik orisinal (numpy), cek pengucapan, render potongan & gabung + intro, QA still
```
