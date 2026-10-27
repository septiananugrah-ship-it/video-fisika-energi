#!/usr/bin/env python3
"""Lembar kontak per adegan dari keluaran qa-audit (awal/tengah/akhir + transisi).
Pemakaian: python3 scripts/contact-scenes.py out/audit out/asheets
"""
import sys
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageDraw

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
groups = defaultdict(list)
for f in sorted(src.glob('*.jpg')):
    groups['-'.join(f.stem.split('-')[:2])].append(f)
for key, files in groups.items():
    ims = [Image.open(f) for f in files]
    w, h = ims[0].size
    cols = 2
    rows = (len(ims) + 1) // 2
    sheet = Image.new('RGB', (cols * w, rows * (h + 26)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for i, (f, im) in enumerate(zip(files, ims)):
        x, y = (i % cols) * w, (i // cols) * (h + 26)
        sheet.paste(im, (x, y + 26))
        d.text((x + 8, y + 6), f.stem, fill=(255, 255, 0))
    sheet.save(dst / f'{key}.jpg', quality=80)
print(len(groups))
