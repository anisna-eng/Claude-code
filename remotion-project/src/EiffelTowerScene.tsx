import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CatmullRomCurve3, Vector3 } from "three";
import { EIFFEL_DURATION } from "./constants";

// ── Palette ───────────────────────────────────────────────────
const IRON = "#A07840";        // warm Eiffel-tower brown
const IRON_DARK = "#7A5C28";
const GROUND = "#1E3A14";      // dark Paris lawn

// ── Reusable material props ───────────────────────────────────
const ironMat = (
  <meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} />
);

// ── Curved leg using TubeGeometry ────────────────────────────
type Pt3 = [number, number, number];

const Leg: React.FC<{ pts: Pt3[] }> = ({ pts }) => {
  const curve = useMemo(
    () => new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <mesh>
      <tubeGeometry args={[curve, 24, 0.1, 8, false]} />
      {ironMat}
    </mesh>
  );
};

// ── Horizontal cross-brace ring at height y ──────────────────
const Ring: React.FC<{ y: number; r: number }> = ({ y, r }) => (
  <>
    {/* x-axis beam */}
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[r * 2, 0.07, 0.07]} />
      {ironMat}
    </mesh>
    {/* z-axis beam */}
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[0.07, 0.07, r * 2]} />
      {ironMat}
    </mesh>
  </>
);

// ── Platform floor slab ───────────────────────────────────────
const Platform: React.FC<{ y: number; w: number }> = ({ y, w }) => (
  <mesh position={[0, y, 0]}>
    <boxGeometry args={[w, 0.12, w]} />
    <meshStandardMaterial color={IRON_DARK} metalness={0.4} roughness={0.6} />
  </mesh>
);

// ── The full tower ────────────────────────────────────────────
const EiffelTower: React.FC = () => {
  // Symmetric leg definitions: 4 mirrored copies, each a
  // CatmullRom curve from ground-corner inward to first floor.
  const legPts: Pt3[][] = [
    // front-right
    [[2.3, 0, 2.3], [1.8, 1.5, 1.8], [1.1, 2.9, 1.1], [0.6, 3.8, 0.6]],
    // front-left
    [[-2.3, 0, 2.3], [-1.8, 1.5, 1.8], [-1.1, 2.9, 1.1], [-0.6, 3.8, 0.6]],
    // back-left
    [[-2.3, 0, -2.3], [-1.8, 1.5, -1.8], [-1.1, 2.9, -1.1], [-0.6, 3.8, -0.6]],
    // back-right
    [[2.3, 0, -2.3], [1.8, 1.5, -1.8], [1.1, 2.9, -1.1], [0.6, 3.8, -0.6]],
  ];

  // Second-section legs: first floor → second floor
  const midPts: Pt3[][] = [
    [[0.6, 3.8, 0.6], [0.45, 4.6, 0.45], [0.28, 5.8, 0.28], [0.18, 6.2, 0.18]],
    [[-0.6, 3.8, 0.6], [-0.45, 4.6, 0.45], [-0.28, 5.8, 0.28], [-0.18, 6.2, 0.18]],
    [[-0.6, 3.8, -0.6], [-0.45, 4.6, -0.45], [-0.28, 5.8, -0.28], [-0.18, 6.2, -0.18]],
    [[0.6, 3.8, -0.6], [0.45, 4.6, -0.45], [0.28, 5.8, -0.28], [0.18, 6.2, -0.18]],
  ];

  return (
    <group>
      {/* ── Lower section (ground → first floor, 0–3.8) ──── */}
      {legPts.map((pts, i) => (
        <Leg key={i} pts={pts} />
      ))}
      <Ring y={1.1} r={1.75} />
      <Ring y={2.3} r={1.05} />
      <Platform y={3.8} w={1.4} />

      {/* ── Middle section (first → second floor, 3.8–6.2) ── */}
      {midPts.map((pts, i) => (
        <Leg key={`mid-${i}`} pts={pts} />
      ))}
      <Ring y={5.0} r={0.38} />
      <Platform y={6.2} w={0.48} />

      {/* ── Spire (second floor → tip, 6.2–10.0) ───────────── */}
      <mesh position={[0, 8.1, 0]}>
        {/* top-radius, bottom-radius, height, segments */}
        <cylinderGeometry args={[0.025, 0.22, 3.8, 8]} />
        {ironMat}
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 10.5, 0]}>
        <cylinderGeometry args={[0.01, 0.025, 1.0, 6]} />
        <meshStandardMaterial
          color="#CCCCCC"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* Red aviation light at the very tip */}
      <mesh position={[0, 11.05, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color="#FF2222"
          emissive="#FF0000"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
};

// ── Camera: orbit + slow pull-back driven by useCurrentFrame ─
const CameraController: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();

  const t = frame / fps;

  // Slow orbit (0.25 rad / s) combined with a gentle pull-back
  const angle = t * 0.25;
  const radius = interpolate(t, [0, EIFFEL_DURATION / fps], [11, 17], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camHeight = interpolate(t, [0, EIFFEL_DURATION / fps], [6, 4.5], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  camera.position.set(
    Math.sin(angle) * radius,
    camHeight,
    Math.cos(angle) * radius,
  );
  camera.lookAt(0, 5, 0);

  return null;
};

// ── Full scene ────────────────────────────────────────────────
export const EiffelTowerScene: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #080820 0%, #12124a 35%, #2b1866 65%, #5c2240 85%, #8b3018 100%)",
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraController />

        {/* Lighting */}
        <ambientLight intensity={0.35} color="#7070cc" />
        {/* Warm key light (sun / street lamps from upper-right) */}
        <directionalLight
          position={[10, 14, 8]}
          intensity={1.4}
          color="#ffcc88"
        />
        {/* Cool fill from the left */}
        <directionalLight
          position={[-8, 6, -5]}
          intensity={0.35}
          color="#8899ff"
        />
        {/* Warm point light inside the tower structure */}
        <pointLight
          position={[0, 5, 0]}
          intensity={1.2}
          color="#ffaa44"
          distance={22}
        />

        {/* Ground plane (Paris lawn / esplanade) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color={GROUND} roughness={0.95} />
        </mesh>

        {/* The tower, centred on the origin */}
        <EiffelTower />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
