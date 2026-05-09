/**
 * ThreeCanvasShell — React Three Fiber canvas wrapper.
 * Handles Suspense, WebGL failure fallback, reduced-motion.
 */
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
  dpr?: [number, number];
  camera?: { position: [number, number, number]; fov?: number };
}

export function ThreeCanvasShell({
  children,
  className = "",
  fallback = null,
  dpr = [1, 1.5],
  camera = { position: [0, 0, 5], fov: 50 },
}: Props) {
  const reduced = useReducedMotionSafe();

  if (reduced) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={className}>
      <Canvas
        dpr={dpr}
        camera={camera}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
