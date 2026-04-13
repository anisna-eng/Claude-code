export const FPS = 30;
export const COMP_WIDTH = 1920;
export const COMP_HEIGHT = 1080;

// ── Map scene phases ──────────────────────────────────────────
// Phase 1: zoom out of LA           (0 – 90  frames, 3 s)
// Phase 2: animate line LA → NY     (90 – 330 frames, 8 s)
// Phase 3: animate line NY → Paris  (330 – 540 frames, 7 s)

export const PHASE1_DURATION = 90;
export const PHASE2_DURATION = 240;
export const PHASE3_DURATION = 210;

export const MAP_DURATION =
  PHASE1_DURATION + PHASE2_DURATION + PHASE3_DURATION; // 540

export const PHASE1_START = 0;
export const PHASE1_END = PHASE1_DURATION; // 90

export const PHASE2_START = PHASE1_END; // 90
export const PHASE2_END = PHASE2_START + PHASE2_DURATION; // 330

export const PHASE3_START = PHASE2_END; // 330
export const PHASE3_END = PHASE3_START + PHASE3_DURATION; // 540

// ── Eiffel Tower 3-D scene ────────────────────────────────────
export const EIFFEL_DURATION = 300; // 10 s

// ── Transition ────────────────────────────────────────────────
export const TRANSITION_DURATION = 30; // 1 s fade

// ── Total ─────────────────────────────────────────────────────
export const TOTAL_DURATION =
  MAP_DURATION + EIFFEL_DURATION - TRANSITION_DURATION; // 810 frames  (27 s)
