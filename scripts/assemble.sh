#!/usr/bin/env bash
# Gabungkan semua chunk video + render audio penuh → out/usaha-energi-2k.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
PROPS="${PROPS:-{\}}"
OUT="${OUT:-out/usaha-energi-2k.mp4}"

ls out/chunks/chunk-*.mp4 | sort > /tmp/chunks.txt
sed "s|^|file '$PWD/|; s|$|'|" /tmp/chunks.txt > out/chunks/list.txt
cat out/chunks/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/video-only.mp4
EXPECTED=$(node --experimental-strip-types -e "import('./src/timeline.ts').then(m=>console.log(m.TOTAL_FRAMES))" 2>/dev/null)
VFRAMES=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 out/video-only.mp4)
echo "Frame video gabungan: $VFRAMES / $EXPECTED"
if [ "$VFRAMES" != "$EXPECTED" ]; then echo "Potongan video tidak lengkap!"; exit 1; fi
DUR=$(awk "BEGIN{printf \"%.3f\", $EXPECTED/30}")

# Audio: musik (+ voice-over bila voiceover:true) dirakit langsung dengan ffmpeg.
PROPS="$PROPS" node --experimental-strip-types scripts/build-audio.ts out/audio.m4a

# Audio dipanjangkan dengan hening bila perlu lalu dipotong tepat sepanjang video, agar tidak ada frame yang hilang.
ffmpeg -v error -y -i out/video-only.mp4 -i out/audio.m4a -map 0:v:0 -map 1:a:0 -c:v copy -af "apad,atrim=0:$DUR" -c:a aac -b:a 256k -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate:format=duration,size -of compact "$OUT"

# Verifikasi jumlah frame hasil akhir
ACTUAL=$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$OUT")
echo "Frame: $ACTUAL / $EXPECTED"
if [ "$ACTUAL" != "$EXPECTED" ]; then echo "Jumlah frame tidak lengkap!"; exit 1; fi
