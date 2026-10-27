#!/usr/bin/env python3
"""Lembar kontak QA: gabungkan still (jpg) menjadi grid 2 kolom berlabel.
Pemakaian: python3 scripts/contact.py <folder-still> <folder-keluaran> [per-lembar=6]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
per = int(sys.argv[3]) if len(sys.argv) > 3 else 6
dst.mkdir(parents=True, exist_ok=True)
files = sorted(src.glob('*.jpg'))
for k in range(0, len(files), per):
    group = files[k:k + per]
    ims = [Image.open(f) for f in group]
    w, h = ims[0].size
    cols = 2
    rows = (len(ims) + 1) // 2
    sheet = Image.new('RGB', (cols * w, rows * (h + 28)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for i, (f, im) in enumerate(zip(group, ims)):
        x, y = (i % cols) * w, (i // cols) * (h + 28)
        sheet.paste(im, (x, y + 28))
        d.text((x + 8, y + 6), f.stem, fill=(255, 255, 0))
    out = dst / f'sheet-{k // per:02d}.jpg'
    sheet.save(out, quality=82)
    print(out)
