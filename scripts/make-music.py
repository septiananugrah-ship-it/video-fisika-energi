#!/usr/bin/env python3
"""Backsound orisinal untuk "Mata Uang Semesta" (D minor / F Lidia, 88 BPM; mesin sintesis sama dengan video sebelumnya, ditransposisi).

Disintesis sepenuhnya dengan numpy (tanpa sampel berlisensi) dan diselaraskan
dengan peta scene dari `npm run timeline` (public/timeline.json):
- setiap bab punya suasana (mood) sendiri: progresi akor, pad, bass, arpeggio/bel,
- transisi antar-bab diberi "whoosh" lembut,
- judul mendapat riser + dentuman rendah.

Pemakaian: python3 scripts/make-music.py  →  public/music.mp3
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(23)


TRANSPOSE = -2  # nada dasar berbeda dari video lain


def midi(n):
    return 440.0 * 2 ** ((n + TRANSPOSE - 69) / 12)


# Akor dalam nomor MIDI (E minor / G mayor dengan warna Lidia).
CH = {
    'Em9': [40, 47, 52, 55, 59, 66],
    'Cmaj7#11': [36, 43, 48, 52, 55, 66],
    'Gmaj7': [43, 50, 55, 59, 62, 66],
    'D6': [38, 45, 50, 54, 57, 59],
    'Am9': [45, 52, 57, 60, 64, 71],
    'Bsus': [47, 54, 59, 64, 66, 71],
    'Fmaj7#11': [41, 48, 53, 57, 59, 64],
    'Esus': [40, 47, 52, 57, 59, 64],
    'Cadd9': [36, 43, 48, 50, 55, 62],
    'Dadd9': [38, 45, 50, 52, 57, 64],
}

MOODS = {
    #            progresi                                       dtk/akor pad   bass  arp   arp_div bel   pulse  bright
    'mystery': (['Em9', 'Cmaj7#11', 'Am9', 'Bsus'], 6.86, 0.55, 0.30, 0.00, 0, 0.18, 0.10, 0.35),
    'title': (['Gmaj7', 'Dadd9'], 2.86, 0.70, 0.35, 0.00, 0, 0.25, 0.00, 0.85),
    'wonder': (['Gmaj7', 'Cmaj7#11', 'Em9', 'Dadd9'], 5.71, 0.50, 0.26, 0.20, 3, 0.10, 0.00, 0.60),
    'build': (['Em9', 'Cadd9', 'Gmaj7', 'D6'], 5.71, 0.45, 0.32, 0.22, 4, 0.00, 0.14, 0.55),
    'quantum': (['Cmaj7#11', 'Am9', 'Fmaj7#11', 'Esus'], 6.86, 0.50, 0.22, 0.12, 3, 0.30, 0.00, 0.75),
    'tension': (['Em9', 'Fmaj7#11', 'Em9', 'Bsus'], 6.86, 0.50, 0.34, 0.00, 0, 0.12, 0.16, 0.30),
    'bright': (['Gmaj7', 'D6', 'Am9', 'Cadd9'], 5.71, 0.45, 0.30, 0.24, 4, 0.06, 0.10, 0.80),
    'resolve': (['Cmaj7#11', 'Gmaj7', 'Dadd9', 'Em9'], 5.71, 0.50, 0.30, 0.20, 3, 0.10, 0.06, 0.65),
    'outro': (['Gmaj7', 'Cmaj7#11', 'Gmaj7'], 4.29, 0.60, 0.25, 0.00, 0, 0.18, 0.00, 0.60),
}
BEAT = 60 / 88  # 88 BPM


def env_adsr(n, a, r, sustain=1.0):
    e = np.full(n, sustain, dtype=np.float32)
    na = min(n, int(a * SR))
    nr = min(n - na, int(r * SR))
    if na:
        e[:na] = np.linspace(0, sustain, na) ** 1.5
    if nr:
        e[n - nr :] *= np.linspace(1, 0, nr) ** 1.5
    return e


def pad_voice(freq, n, bright, detune):
    t = np.arange(n) / SR
    out = np.zeros(n, dtype=np.float32)
    for h in range(1, 7):
        amp = (1 / h ** (2.4 - bright)) * (0.5 + 0.5 * np.cos(h * 0.9))
        vib = 0.0015 * np.sin(2 * np.pi * (0.13 + 0.05 * h) * t + h)
        out += amp * np.sin(2 * np.pi * freq * h * (1 + detune + vib) * t + h * 1.7)
    return out


def pluck(freq, dur, bright):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t * 5.5)
    s += 0.35 * bright * np.sin(2 * np.pi * 2 * freq * t) * np.exp(-t * 9)
    s += 0.12 * np.sin(2 * np.pi * 3 * freq * t) * np.exp(-t * 14)
    s *= np.minimum(1, t / 0.004)
    return s.astype(np.float32)


def bell(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 1.4), (2.76, 0.45, 2.6), (5.4, 0.25, 4.0), (8.93, 0.1, 6.0)]:
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t * dec)
    s *= np.minimum(1, t / 0.003)
    return s.astype(np.float32)


def thump(dur=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 45 + 50 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7)).astype(np.float32)


def add(buf, sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    j = min(buf.shape[1], i + len(sig))
    seg = sig[: j - i] * gain
    buf[0, i:j] += seg * np.sqrt(0.5 * (1 - pan))
    buf[1, i:j] += seg * np.sqrt(0.5 * (1 + pan))


def render_section(mood, dur, seed):
    prog, clen, pad_g, bass_g, arp_g, div, bell_g, pulse_g, bright = MOODS[mood]
    n = int(dur * SR)
    dry = np.zeros((2, n), dtype=np.float32)
    wet = np.zeros((2, n), dtype=np.float32)
    r = np.random.default_rng(seed)
    k = 0
    t0 = 0.0
    while t0 < dur:
        chord = CH[prog[k % len(prog)]]
        L = clen + 1.6  # overlap untuk legato
        m = int(L * SR)
        e = env_adsr(m, 1.2, 1.8)
        for vi, note in enumerate(chord[1:5]):
            f = midi(note)
            add(dry, pad_voice(f, m, bright, +0.0012) * e, t0, pan=-0.5 + vi * 0.33, gain=pad_g * 0.075)
            add(wet, pad_voice(f, m, bright, -0.0012) * e, t0, pan=0.5 - vi * 0.33, gain=pad_g * 0.05)
        # bass
        tb = np.arange(m) / SR
        fb = midi(chord[0] - 12 if chord[0] > 45 else chord[0])
        bass = (np.sin(2 * np.pi * fb * tb) + 0.25 * np.sin(4 * np.pi * fb * tb)) * env_adsr(m, 0.6, 1.6)
        add(dry, bass.astype(np.float32), t0, gain=bass_g * 0.22)
        # arpeggio
        if arp_g > 0 and div:
            step = BEAT / div * 2
            tones = [x + 12 for x in chord[2:]]
            pattern = [0, 1, 2, 3, 2, 1]
            tt = t0
            idx = 0
            while tt < t0 + clen and tt < dur:
                note = tones[pattern[idx % len(pattern)] % len(tones)]
                vel = 0.6 + 0.4 * r.random()
                add(wet, pluck(midi(note), 1.4, bright), tt, pan=0.4 * np.sin(idx * 1.3), gain=arp_g * 0.09 * vel)
                add(dry, pluck(midi(note), 1.4, bright), tt, pan=0.4 * np.sin(idx * 1.3), gain=arp_g * 0.05 * vel)
                tt += step
                idx += 1
        # bel
        if bell_g > 0:
            tt = t0 + BEAT * r.integers(0, 3)
            while tt < t0 + clen and tt < dur:
                if r.random() < 0.55:
                    note = r.choice(chord[3:]) + 12
                    add(wet, bell(midi(note), 4.0), tt, pan=r.uniform(-0.7, 0.7), gain=bell_g * 0.07)
                tt += BEAT * 2
        # denyut lembut
        if pulse_g > 0:
            tt = t0
            while tt < t0 + clen and tt < dur:
                add(dry, thump(), tt, gain=pulse_g * 0.35)
                tt += BEAT * 2
        t0 += clen
        k += 1
    return dry, wet


def whoosh(dur, rising=True):
    n = int(dur * SR)
    noise = rng.standard_normal(n).astype(np.float32)
    # filter low-pass bergerak (rata-rata bergulir dengan panjang berubah, via kumulatif)
    t = np.linspace(0, 1, n)
    out = np.zeros(n, dtype=np.float32)
    c = np.concatenate([[0], np.cumsum(noise)])
    widths = (160 - 140 * (t if rising else 1 - t)).astype(int) + 4
    idx = np.arange(n)
    lo = np.maximum(0, idx - widths)
    out = (c[idx + 1] - c[lo]) / widths
    e = (t ** 2.2) if rising else (1 - t) ** 2
    return (out * e / (np.abs(out).max() + 1e-6)).astype(np.float32)


def reverb(x, seconds=3.2):
    m = int(seconds * SR)
    t = np.arange(m) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(m) * np.exp(-t * 2.4)
        ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        # sedikit low-pass pada ekor
        ir = np.convolve(ir, np.ones(6) / 6, mode='same')
        ir /= np.sqrt(np.sum(ir ** 2))
        block = 1 << 18
        nfft = 1 << int(np.ceil(np.log2(block + m)))
        H = np.fft.rfft(ir, nfft)
        sig = x[ch]
        for s in range(0, len(sig), block):
            seg = sig[s : s + block]
            y = np.fft.irfft(np.fft.rfft(seg, nfft) * H, nfft)[: len(seg) + m - 1]
            e = min(len(out[ch]), s + len(y))
            out[ch, s:e] += y[: e - s].astype(np.float32)
    return out


def main():
    tl = json.loads((ROOT / 'public/timeline.json').read_text())
    total = tl['total'] + 2.0
    N = int(total * SR)
    dry = np.zeros((2, N), dtype=np.float32)
    wet = np.zeros((2, N), dtype=np.float32)
    XF = 2.5
    scenes = tl['scenes']
    for i, s in enumerate(scenes):
        start = s['start']
        end = s['end']
        seg_len = end - start + XF
        d, w = render_section(s['mood'], seg_len, seed=100 + i)
        nseg = d.shape[1]
        fade = np.ones(nseg, dtype=np.float32)
        nin = int((XF if i else 0.01) * SR)
        nout = int(XF * SR)
        fade[:nin] = np.sin(np.linspace(0, np.pi / 2, nin)) ** 2
        fade[-nout:] *= np.cos(np.linspace(0, np.pi / 2, nout)) ** 2
        a = int(max(0, start - (XF / 2 if i else 0)) * SR)
        b = min(N, a + nseg)
        dry[:, a:b] += d[:, : b - a] * fade[: b - a]
        wet[:, a:b] += w[:, : b - a] * fade[: b - a]
        # whoosh menuju setiap bab baru
        if i > 0:
            wh = whoosh(1.6)
            add(wet, wh, start - 1.5, pan=-0.3, gain=0.10)
            add(wet, wh[::-1] * 0.6, start + 0.05, pan=0.3, gain=0.05)
        if s['mood'] == 'title':
            add(wet, whoosh(3.0), start - 2.9, gain=0.16)
            add(dry, thump(1.8) * 1.0, start, gain=0.55)
            add(wet, thump(1.8), start, gain=0.4)

    print('reverb…')
    mix = dry + reverb(wet) * 0.9 + wet * 0.25
    # master: kompresi lembut + normalisasi
    mix = np.tanh(mix * 1.3) / 1.3
    peak = np.abs(mix).max()
    rms = np.sqrt(np.mean(mix ** 2))
    target_rms = 10 ** (-20 / 20)
    g = min(target_rms / (rms + 1e-9), 0.89 / peak)
    mix *= g
    n_fade = int(3 * SR)
    mix[:, -n_fade:] *= np.linspace(1, 0, n_fade)
    print(f'peak {20*np.log10(np.abs(mix).max()):.1f} dBFS · rms {20*np.log10(np.sqrt(np.mean(mix**2))):.1f} dBFS')

    wav = ROOT / 'out' / 'music.wav'
    wav.parent.mkdir(exist_ok=True)
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
    with wave.open(str(wav), 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    mp3 = ROOT / 'public' / 'music.mp3'
    subprocess.run(
        [
            'ffmpeg', '-v', 'error', '-y', '-i', str(wav),
            # buang frekuensi subsonik, lembutkan puncak, samakan kenyaringan (±-21 LUFS: aman di bawah narasi)
            '-af', 'highpass=f=38,equalizer=f=90:t=q:w=1:g=-3,loudnorm=I=-21:TP=-2:LRA=9',
            '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '160k', str(mp3),
        ],
        check=True,
    )
    print(f'→ {mp3}')


if __name__ == '__main__':
    main()
