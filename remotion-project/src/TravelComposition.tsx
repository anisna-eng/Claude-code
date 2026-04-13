import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { EIFFEL_DURATION, MAP_DURATION, TRANSITION_DURATION } from "./constants";
import { EiffelTowerScene } from "./EiffelTowerScene";
import { MapScene } from "./MapScene";

export const TravelComposition: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={MAP_DURATION}>
        <MapScene />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      />

      <TransitionSeries.Sequence durationInFrames={EIFFEL_DURATION}>
        <EiffelTowerScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
