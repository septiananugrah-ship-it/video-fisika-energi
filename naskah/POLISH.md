# Panduan poles animasi (untuk agen yang memoles adegan)

Tujuan pengguna: "upgrade segalanya kaya repo ku yang lain, polish, naikin visual, fokus ke animasi — banyakan geraknya, visual animasi hiasan yang terus bergerak". Acuan gaya: repo `video-sidik-jari-v2` (animasi jauh lebih banyak & terus bergerak, ilustrasi vektor kaya), tetapi tetap tema **Lab Energi** repo ini (lihat `CLAUDE.md`).

## Sasaran per adegan
1. **Tidak ada momen diam.** Setiap saat (termasuk jeda antar-baris) harus ada sesuatu yang bergerak di area fokus: objek bernapas/bergoyang halus, partikel, aliran energi, kilau, roda berputar, air beriak, molekul bergetar. Jangan hanya menunggu kartu muncul.
2. **Energi terlihat mengalir.** Setiap kali narasi bilang energi berpindah (usaha masuk, K → U, gesekan → panas, motor → beban, air → turbin → kabel), tampilkan `Stream` (butir cahaya mengalir) dari sumber ke tujuan, dengan warna bentuk energinya. Batang energi (`EnergyBars`) sudah "cair" otomatis; hubungkan dengan objeknya lewat `Stream` bila cocok.
3. **Momen penting diberi aksen**: `Ripple` pada tumbukan/titik balik/hasil akhir, `Twinkles` di sekitar angka jawaban, kilatan pendar (`Glow`) saat kartu rumus utama muncul.
4. **Ilustrasi vektor lebih kaya**: tambahkan kedalaman (gradien, bayangan lantai elips lembut di bawah benda, sorotan tepi, garis gerak/motion lines di belakang benda cepat, jejak `Spark trail`), detail lingkungan yang relevan (mis. dinding/lantai bertekstur, langit-langit, tiang listrik, awan uap), tetapi tetap rapi dan terbaca.
5. **Kamera hidup**: dorongan zoom/geser halus ke objek yang sedang dibahas (transform pada grup SVG, dengan `EASE_IN_OUT`, tanpa CSS blur), mis. zoom ke balok saat "berhenti sesaat", lalu kembali.
6. **Isi ruang kosong**: bila separuh layar kosong lama, isi dengan visual pendukung yang bergerak (bukan teks tambahan), atau seimbangkan ulang tata letak.
7. **Debu cahaya** (`Motes`) di sekitar objek fokus dengan opasitas rendah (0.3–0.6).

## Komponen yang tersedia (`src/components/primitives.tsx`, `physics.tsx`)
- `Glow` (bernapas otomatis; `still` untuk mematikan), `Arrow` (denyut energi merambat otomatis untuk panah ≥ 70 px; `pulse={false}` untuk mematikan), `Card/Formula/Note` (kilau sapuan otomatis), `Spark` (prop `trail`), `Ripple(p 0..1)`, `Motes`, `Stream(pts, color, n, speed)`, `Twinkles`, `pointAlong`, `DrawPath`, `Label`, `TSub/TSup`, `Frac/Sub/Sup/Sqrt/V/Tint`.
- `EnergyBars` (isi cair + gelembung + garis total berjalan otomatis), `Crate`, `Spring`, `SpringV`, `Ball`, `Car`, `Person`, `Ground`, `HeatShimmer`, `Plot/px/py`, `fmt`, `ELabel`.
- `anim.ts`: `ramp`, `win`, `mix`, `cyc` (opasitas siklus tanpa pop), `osc`, `rand`, `smoothPath`, `EASE`, `EASE_IN_OUT`, `BACK`.
- `useScene()`: `t` (detik adegan), `cue(i)`, `cueEnd(i)`, `wordOf(i, kata, n)`, `dur`.

## Aturan wajib (jangan dilanggar)
- **Hanya edit berkas adegan milik Anda** (`src/scenes/<Nama>.tsx`). Jangan edit komponen bersama, `script.ts`, `timeline.ts`, atau adegan lain (agen lain bekerja paralel). Helper tambahan didefinisikan lokal di berkas adegan. Tulis setiap berkas dalam satu kali Write.
- Narasi tidak berubah. Semua animasi tetap sinkron dengan baris (`cue`), angka & fisika tetap benar (lihat `naskah/AUDIT.md`), kode warna energi tetap.
- Tata letak: konten di y ≈ 170–880; heading bab kiri atas (x 80–950, y 50–145) dan meter kemajuan kanan atas harus bebas; zona subtitle y > 900 bebas; margin ≥ 80 px; tidak ada teks yang bertabrakan. Rumus utama ≥ 56 px, satu kartu per momen.
- Kemulusan: tidak ada ganti teks/warna/elemen berdasarkan ambang (silang-pudar), siklus berulang pakai `cyc`, fade keluar `EASE_IN_OUT`, tanpa CSS `filter: blur`, tanpa filter SVG pada garis lurus, tanpa gerak gigi gergaji yang terlihat meloncat.
- Performa: jaga < ±1000 elemen SVG per frame per adegan; tanpa filter SVG mahal (noise/turbulence).
- Hiasan tidak boleh mengalahkan isi: opasitas hiasan latar rendah, objek utama tetap paling terang.

## QA (wajib sebelum selesai)
```
npx tsc --noEmit
CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell \
  node scripts/qa-moments.mjs out/qa-<grup> <adegan:baris:offset> ...
python3 scripts/contact.py out/qa-<grup> out/qa-<grup>-s 6
```
Ambil still di akhir setiap baris (`adegan:i:end`) dan di tengah jeda; baca lembar kontak; perbaiki tabrakan/keterbacaan; ulangi. Untuk mengecek gerak, ambil 2 still berjarak 0,3 dtk di momen jeda dan pastikan ada yang berubah. Jangan commit/push (sesi utama yang commit).
