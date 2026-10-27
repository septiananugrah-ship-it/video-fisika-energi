#!/usr/bin/env python3
"""Cek pengucapan narasi dengan Whisper (faster-whisper).

Membandingkan transkripsi tiap public/voiceover/<kode>.mp3 dengan teks yang dikirim ke TTS
(naskah/naskah-tts.txt, dibuat oleh `npm run timeline`). Kata (≥ 5 huruf) yang tidak
ditemukan padanannya di transkripsi ditandai. Hasil: naskah/CEK_PENGUCAPAN.md.

Pemakaian:
  pip install faster-whisper numpy
  python3 scripts/cek-pengucapan.py               # model small
  WHISPER_MODEL=medium python3 scripts/cek-pengucapan.py
  python3 scripts/cek-pengucapan.py --selftest    # uji logika tanpa model

Catatan: Whisper small sering memberi alarm palsu; cek ulang baris mencurigakan dengan medium.
Audio didekode dengan ffmpeg ke numpy (PyAV versi baru bermasalah).
"""
import difflib
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SATUAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']


def terbilang(n: int) -> str:
    if n < 12:
        return SATUAN[n]
    if n < 20:
        return f'{SATUAN[n - 10]} belas'
    if n < 100:
        return f'{SATUAN[n // 10]} puluh' + (f' {SATUAN[n % 10]}' if n % 10 else '')
    if n < 200:
        return 'seratus' + (f' {terbilang(n - 100)}' if n > 100 else '')
    if n < 1000:
        return f'{SATUAN[n // 100]} ratus' + (f' {terbilang(n % 100)}' if n % 100 else '')
    if n < 2000:
        return 'seribu' + (f' {terbilang(n - 1000)}' if n > 1000 else '')
    if n < 1_000_000:
        return f'{terbilang(n // 1000)} ribu' + (f' {terbilang(n % 1000)}' if n % 1000 else '')
    return str(n)


def angka_ke_kata(text: str) -> str:
    """'115,27' / '115.27' → 'seratus lima belas koma dua tujuh' (digit desimal dibaca satu per satu)."""

    def rep(m):
        whole, frac = m.group(1), m.group(3)
        out = terbilang(int(whole.replace('.', ''))) if whole else ''
        if frac:
            out += ' koma ' + ' '.join(SATUAN[int(d)] for d in frac)
        return f' {out} '

    text = re.sub(r'(\d+)([.,](\d+))?', rep, text)
    return text.replace('%', ' persen ')


def norm_words(text: str):
    text = angka_ke_kata(text.lower())
    text = re.sub(r'[^a-zà-ž\s-]', ' ', text)
    return [w for w in re.split(r'[\s-]+', text) if w]


def flagged(expected: str, heard: str, min_len=5, cutoff=0.72):
    exp = norm_words(expected)
    got = norm_words(heard)
    miss = []
    for w in exp:
        if len(w) < min_len:
            continue
        best = max((difflib.SequenceMatcher(None, w, g).ratio() for g in got), default=0)
        if best < cutoff:
            miss.append((w, round(best, 2)))
    score = difflib.SequenceMatcher(None, exp, got).ratio()
    return miss, score


def decode(path: Path):
    import numpy as np

    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0


def main():
    if '--selftest' in sys.argv:
        miss, score = flagged('Garis pertama terukur pada seratus lima belas koma dua tujuh gigahertz.', 'garis pertama terukur pada 115,27 gigahertz')
        assert not miss and score > 0.9, (miss, score)
        miss, _ = flagged('Dari persamaan Syrodinger, energinya terkuantisasi.', 'dari persamaan sroding, energinya terkuantasi')
        print('selftest ok · contoh tanda:', miss)
        return
    from faster_whisper import WhisperModel

    model_name = os.environ.get('WHISPER_MODEL', 'small')
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    lines = [l.split('\t', 1) for l in (ROOT / 'naskah/naskah-tts.txt').read_text().splitlines() if '\t' in l]
    rows = []
    for key, expected in lines:
        f = ROOT / 'public/voiceover' / f'{key}.mp3'
        if not f.exists():
            continue
        segs, _ = model.transcribe(decode(f), language='id', beam_size=5, vad_filter=False)
        heard = ' '.join(s.text.strip() for s in segs)
        miss, score = flagged(expected, heard)
        rows.append((key, expected, heard, miss, score))
        print(f'{key}: {score:.2f} {"⚠ " + ", ".join(w for w, _ in miss) if miss else "ok"}', flush=True)
    bad = [r for r in rows if r[3]]
    md = [f'# Cek pengucapan (Whisper {model_name})', '', f'{len(rows)} baris diperiksa · {len(bad)} baris ditandai.', '']
    md.append('Kata bertanda bisa alarm palsu (ejaan Whisper berbeda). Dengarkan barisnya; rekam ulang hanya bila memang salah ucap: hapus `public/voiceover/<kode>.mp3`, lalu jalankan lagi workflow voice-over.')
    md.append('')
    if bad:
        md += ['| Kode | Kata ditandai | Kemiripan baris | Terdengar |', '|---|---|---|---|']
        for key, expected, heard, miss, score in sorted(bad, key=lambda r: r[4]):
            md.append(f'| `{key}` | {", ".join(f"{w} ({r})" for w, r in miss)} | {score:.2f} | {heard} |')
    else:
        md.append('Tidak ada kata yang ditandai.')
    out = ROOT / 'naskah/CEK_PENGUCAPAN.md'
    out.write_text('\n'.join(md) + '\n')
    print(f'→ {out}')


if __name__ == '__main__':
    main()
