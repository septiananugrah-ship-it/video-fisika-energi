// Props bawaan film (tanpa dependensi Remotion, dipakai juga oleh scripts/build-audio.ts).
export type VideoProps = {
  showCaptions: boolean;
  musicVolume: number;
  /** true = putar public/voiceover/<scene>-<baris>.mp3 (hasil scripts/generate-voiceover.ts) */
  voiceover: boolean;
};

export const defaultVideoProps: VideoProps = {
  showCaptions: true,
  musicVolume: 0.9,
  voiceover: false,
};
