import React from "react";
import { Composition } from "remotion";
import { TravelComposition } from "./TravelComposition";
import { InstagramStory } from "./InstagramStory";
import { COMP_HEIGHT, COMP_WIDTH, FPS, TOTAL_DURATION } from "./constants";

// Instagram Story constants
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const STORY_DURATION = 240; // 8 s × 30 fps

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TravelMap"
        component={TravelComposition}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={COMP_WIDTH}
        height={COMP_HEIGHT}
      />
      <Composition
        id="InstagramStory"
        component={InstagramStory}
        durationInFrames={STORY_DURATION}
        fps={FPS}
        width={STORY_WIDTH}
        height={STORY_HEIGHT}
      />
    </>
  );
};
