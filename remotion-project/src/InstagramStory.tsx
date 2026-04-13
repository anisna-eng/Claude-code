import React from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Font loading ──────────────────────────────────────────────────────────────
// Load Rubik (Hebrew + Latin) from Google Fonts before the first frame renders.
const fontHandle =
  typeof document !== "undefined"
    ? (() => {
        const handle = delayRender("Loading Rubik font…");
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
          "https://fonts.googleapis.com/css2?family=Rubik:wght@400;700;900&display=swap&subset=hebrew,latin";
        document.head.appendChild(link);
        document.fonts.ready.then(() => continueRender(handle));
        return handle;
      })()
    : null;

void fontHandle; // suppress unused-var warning

// ── Timing constants ──────────────────────────────────────────────────────────
// 8 s × 30 fps = 240 frames
//  Line 1 enters at frame   0  (0.0 s)
//  Line 2 enters at frame  50  (1.67 s)
//  Line 3 enters at frame 100  (3.33 s)
//  0.5 s pause after line 3
//  Line 4 enters at frame 150  (5.0 s)

const LINE_CONFIG = [
  { text: "AI לא הולך לקחת לכם את העבודה", enterAt: 0 },
  { text: "אנשים שיודעים להשתמש ב-AI", enterAt: 50 },
  { text: "הולכים לקחת לכם את העבודה", enterAt: 100 },
  { text: "תהיו אלה שלוקחים", enterAt: 150 }, // 2× size, bold, centre pop
] as const;

// ── Burst ring: expands + fades as line 4 lands ───────────────────────────────
const BurstRing: React.FC<{ localFrame: number; delay: number; radius: number }> = ({
  localFrame,
  delay,
  radius,
}) => {
  const f = localFrame - delay;
  if (f < 0) return null;
  const scale = interpolate(f, [0, 25], [0.1, 1], {
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const opacity = interpolate(f, [0, 5, 25], [0, 0.7, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        width: radius * 2,
        height: radius * 2,
        borderRadius: "50%",
        border: "3px solid rgba(255,180,255,0.9)",
        transform: `scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ── Single text line (lines 1-3): slides in from right + decaying shake ───────
const SlideLine: React.FC<{
  text: string;
  enterAt: number;
  lineIndex: number; // 0, 1, 2
}> = ({ text, enterAt, lineIndex }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const localFrame = frame - enterAt;
  if (localFrame < 0) return null;

  // Slide: start off-screen right, land at 0
  const slide = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 200, mass: 0.9 },
  });
  const translateX = interpolate(slide, [0, 1], [width * 0.85, 0]);

  // Decaying shake: amplitude decays exponentially, starts after spring peak (~10 frames)
  const shakeDecay = Math.max(0, 10 * Math.exp(-0.07 * Math.max(0, localFrame - 10)));
  const shakeX = shakeDecay * Math.sin(localFrame * 1.6);
  const shakeY = shakeDecay * 0.35 * Math.sin(localFrame * 2.3 + 1);

  // Opacity: fade in over first 8 frames
  const opacity = interpolate(localFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Vertical spacing: stack lines in the upper-centre area
  const topPercent = 30 + lineIndex * 13;

  return (
    <div
      style={{
        position: "absolute",
        top: `${topPercent}%`,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "flex-end",
        paddingRight: "7%",
        transform: `translateX(${translateX + shakeX}px) translateY(${shakeY}px)`,
        opacity,
      }}
    >
      <span
        style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: 56,
          fontWeight: lineIndex === 2 ? 700 : 400,
          color: "#fff",
          textShadow: "0 3px 18px rgba(0,0,0,0.45)",
          direction: "rtl",
          textAlign: "right",
          lineHeight: 1.25,
          letterSpacing: "0.01em",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ── Big line 4: scales up from centre with explosion glow ─────────────────────
const BigLine: React.FC<{ text: string; enterAt: number }> = ({
  text,
  enterAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - enterAt;
  if (localFrame < 0) return null;

  // Snappy overshoot scale spring
  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 7, stiffness: 280, mass: 0.6 },
  });

  // Brief initial flash: white overlay that fades out
  const flashOpacity = interpolate(localFrame, [0, 4, 14], [0.55, 0.35, 0], {
    extrapolateRight: "clamp",
  });

  // Text glow: intense at entry, settles to subtle
  const glowRadius = interpolate(localFrame, [0, 6, 30], [80, 50, 24], {
    extrapolateRight: "clamp",
  });
  const glowAlpha = interpolate(localFrame, [0, 6, 40], [1, 0.75, 0.45], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* Burst rings */}
      <div
        style={{
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <BurstRing localFrame={localFrame} delay={0} radius={200} />
        <BurstRing localFrame={localFrame} delay={3} radius={310} />
        <BurstRing localFrame={localFrame} delay={6} radius={430} />
      </div>

      {/* Flash overlay */}
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 300,
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, transparent 70%)",
            opacity: flashOpacity,
            borderRadius: "50%",
          }}
        />
      )}

      {/* The text */}
      <span
        style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: 112,
          fontWeight: 900,
          color: "#fff",
          textShadow: `0 0 ${glowRadius}px rgba(255,140,255,${glowAlpha}), 0 0 ${
            glowRadius * 0.4
          }px rgba(255,80,220,${glowAlpha * 0.8}), 0 6px 30px rgba(0,0,0,0.55)`,
          direction: "rtl",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          position: "relative",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ── Main composition ──────────────────────────────────────────────────────────
export const InstagramStory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Breathing background: slow sine at ~0.3 Hz (full cycle ≈ 3.3 s)
  const breathe = (Math.sin((frame / fps) * Math.PI * 0.6) + 1) / 2; // 0–1
  const brightness = interpolate(breathe, [0, 1], [0.82, 1.18]);

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(155deg, #7b2ff7 0%, #c43bc0 35%, #e8458a 65%, #ff6eb4 85%, #a020f0 100%)",
        filter: `brightness(${brightness})`,
        overflow: "hidden",
      }}
    >
      {/* Lines 1–3: slide from right */}
      {LINE_CONFIG.slice(0, 3).map((line, i) => (
        <SlideLine
          key={i}
          text={line.text}
          enterAt={line.enterAt}
          lineIndex={i}
        />
      ))}

      {/* Line 4: big bold centre explosion */}
      <BigLine
        text={LINE_CONFIG[3].text}
        enterAt={LINE_CONFIG[3].enterAt}
      />
    </AbsoluteFill>
  );
};
