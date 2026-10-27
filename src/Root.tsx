import React from 'react';
import {Composition, Folder, Still} from 'remotion';
import {UsahaEnergi, UsahaEnergi2K, SingleScene, defaultVideoProps} from './Composition';
import {Thumbnail} from './Thumbnail';
import {FPS, TIMELINE, TOTAL_FRAMES} from './timeline.ts';
import './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="UsahaEnergi" component={UsahaEnergi} width={1920} height={1080} fps={FPS} durationInFrames={TOTAL_FRAMES} defaultProps={defaultVideoProps} />
    <Composition id="UsahaEnergi2K" component={UsahaEnergi2K} width={2560} height={1440} fps={FPS} durationInFrames={TOTAL_FRAMES} defaultProps={defaultVideoProps} />
    <Still id="Thumbnail" component={Thumbnail} width={2560} height={1440} />
    <Folder name="Adegan">
      {TIMELINE.scenes.map((s) => (
        <Composition
          key={s.id}
          id={`Adegan-${String(s.index).padStart(2, '0')}-${s.id}`}
          component={SingleScene}
          width={1920}
          height={1080}
          fps={FPS}
          durationInFrames={Math.round(s.duration * FPS)}
          defaultProps={{sceneId: s.id}}
        />
      ))}
    </Folder>
  </>
);
