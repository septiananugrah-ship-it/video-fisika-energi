# Deteksi glitch: cari lonjakan beda antar-frame (pop / loncatan / sentakan) pada video QA resolusi rendah.
#   1) CHROME_PATH=... node scripts/qa-film.mjs out/qa-a.mp4 0 5999 0.25
#   2) python3 scripts/qa-glitch.py out/qa-a.mp4 0            (0 = frame awal video itu)
# Hasil: daftar frame mencurigakan (bukan keyframe encoder). Periksa dengan mengekstrak frame f-1 dan f.
# Batas adegan TIDAK dikecualikan: transisi yang halus memberi kurva lonceng, bukan satu lonjakan.
import json, re, statistics, subprocess, sys

video, base = sys.argv[1], int(sys.argv[2])
thr = float(sys.argv[3]) if len(sys.argv) > 3 else 2.5
cmd = ['ffmpeg', '-v', 'error', '-i', video, '-vf', 'format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-', '-f', 'null', '-']
vals = [float(v) for v in re.findall(r'YAVG=([\d.]+)', subprocess.run(cmd, capture_output=True, text=True).stdout)]
types = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=pict_type', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout.split()
keyframes = {base + i for i, p in enumerate(types) if p.startswith('I')}
fps = json.load(open('public/timeline.json'))['fps']
hits = []
for i, v in enumerate(vals):
    f = base + i + 1
    nb = vals[max(0, i - 3):i] + vals[i + 1:i + 4]
    near = max(nb) if nb else 0
    med = statistics.median(vals[max(0, i - 6):i] + vals[i + 1:i + 7] or [0])
    # lonjakan tunggal: jauh di atas median sekitar DAN di atas tetangga terdekat (bukan lereng transisi)
    if f not in keyframes and v > 0.6 and v > thr * max(med, 0.12) and v > 1.6 * near:
        hits.append((f, round(f / fps, 2), round(v, 2), round(med, 2)))
for h in hits:
    print('frame %d  t=%.2fs  beda=%.2f  median=%.2f' % h)
print(f'{len(hits)} lonjakan dari {len(vals)} frame')
