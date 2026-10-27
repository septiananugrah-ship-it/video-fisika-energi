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

# Intro SCIENTIAN di depan bila intro/intro.mp4 ada (dirender workflow dari repo science-intro).
if [ -f intro/intro.mp4 ]; then
  WH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$OUT")
  ffmpeg -v error -y -i intro/intro.mp4 -f lavfi -i anullsrc=r=48000:cl=stereo \
    -filter_complex "[0:v]scale=${WH/x/:}:flags=lanczos,fps=30,format=yuv420p[v]" \
    -map "[v]" -map 0:a? -map 1:a -shortest -c:v libx264 -preset slow -crf 16 -c:a aac -ar 48000 -ac 2 -b:a 256k out/intro-norm.mp4
  # hanya satu trek audio: audio intro bila ada, selain itu hening
  ffmpeg -v error -y -i out/intro-norm.mp4 -map 0:v:0 -map 0:a:0 -c copy out/intro-1a.mp4
  ffmpeg -v error -y -i "$OUT" -c:v copy -c:a aac -ar 48000 -ac 2 -b:a 256k out/main-48k.mp4
  printf "file '%s'\nfile '%s'\n" "$PWD/out/intro-1a.mp4" "$PWD/out/main-48k.mp4" > out/with-intro.txt
  ffmpeg -v error -y -f concat -safe 0 -i out/with-intro.txt -c copy -movflags +faststart out/with-intro.mp4
  mv out/with-intro.mp4 "$OUT"
  echo "Intro SCIENTIAN ditempel di depan: $OUT"
  ffprobe -v error -show_entries format=duration,size -of compact "$OUT"
else
  echo "Tanpa intro (intro/intro.mp4 tidak ada)."
fi
