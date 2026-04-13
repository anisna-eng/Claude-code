import { Composition } from "remotion";
import { TravelComposition } from "./TravelComposition";
import { COMP_HEIGHT, COMP_WIDTH, FPS, TOTAL_DURATION } from "./constants";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TravelMap"
      component={TravelComposition}
      durationInFrames={TOTAL_DURATION}
      fps={FPS}
      width={COMP_WIDTH}
      height={COMP_HEIGHT}
    />
  );
};
