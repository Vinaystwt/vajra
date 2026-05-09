/**
 * TransactionBeam — cinematic transaction visualization.
 *
 * Normal mode: cyan beam with leading particle and trail.
 * Attack mode: red beam, hits gate, fragments SHATTER outward.
 * Blocked: crimson ripple + particle explosion at impact point.
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  state: "idle" | "animating" | "blocked" | "success";
  mode: "allowed" | "attack";
  direction?: "ltr" | "rtl"; // left-to-right or right-to-left
}

const CYAN = "#00E5FF";
const CRIMSON = "#E11D48";
const EMERALD = "#10B981";

interface Particle {
  id: number;
  angle: number;
  speed: number;
  size: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360 + Math.random() * (360 / count),
    speed: 0.6 + Math.random() * 0.8,
    size: 1.5 + Math.random() * 2.5,
  }));
}

export function TransactionBeam({ state, mode, direction = "ltr" }: Props) {
  const reduced = useReducedMotionSafe();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripple, setRipple] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef(state);

  stateRef.current = state;

  const color = mode === "allowed" ? CYAN : CRIMSON;
  const successColor = EMERALD;

  // Trigger shatter particles on block
  useEffect(() => {
    if (state === "blocked" && !reduced) {
      setParticles(generateParticles(22));
      setRipple(true);
      const t1 = setTimeout(() => setParticles([]), 900);
      const t2 = setTimeout(() => setRipple(false), 600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [state, reduced]);

  // Canvas beam animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth * Math.min(window.devicePixelRatio, 2);
    const H = canvas.height = canvas.offsetHeight * Math.min(window.devicePixelRatio, 2);
    const CY = H / 2;

    let progress = 0;
    let fadeOut = 1;

    function drawBeam(_t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const cur = stateRef.current;
      if (cur !== "animating" && cur !== "success") {
        animRef.current = requestAnimationFrame(drawBeam);
        return;
      }

      progress = Math.min(progress + 0.025, 1);

      if (cur === "success") {
        fadeOut = Math.max(fadeOut - 0.04, 0);
      }

      const col = cur === "success" ? successColor : color;
      const endX = direction === "ltr" ? W * progress : W * (1 - progress);
      const startX = direction === "ltr" ? 0 : W;

      // Glow underlay
      const glowGrad = ctx.createLinearGradient(startX, CY, endX, CY);
      glowGrad.addColorStop(0, col + "00");
      glowGrad.addColorStop(0.5, col + "18");
      glowGrad.addColorStop(1, col + "00");
      ctx.beginPath();
      ctx.strokeStyle = glowGrad;
      ctx.lineWidth = 10;
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.moveTo(startX, CY);
      ctx.lineTo(endX, CY);
      ctx.stroke();

      // Main beam
      const beamGrad = ctx.createLinearGradient(startX, CY, endX, CY);
      beamGrad.addColorStop(0, col + "00");
      beamGrad.addColorStop(0.3, col + "88");
      beamGrad.addColorStop(0.9, col + "cc");
      beamGrad.addColorStop(1, col + "ff");
      ctx.beginPath();
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur = 8;
      ctx.moveTo(startX, CY);
      ctx.lineTo(endX, CY);
      ctx.stroke();

      // Leading orb
      const orbX = endX;
      const orbGrad = ctx.createRadialGradient(orbX, CY, 0, orbX, CY, 10);
      orbGrad.addColorStop(0, col + "ff");
      orbGrad.addColorStop(0.4, col + "88");
      orbGrad.addColorStop(1, col + "00");
      ctx.beginPath();
      ctx.fillStyle = orbGrad;
      ctx.arc(orbX, CY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Trailing dots
      for (let i = 1; i <= 5; i++) {
        const trailX = orbX - (direction === "ltr" ? 1 : -1) * i * 18;
        if (trailX < 0 || trailX > W) continue;
        const trailAlpha = Math.max(0, 1 - i * 0.2);
        ctx.beginPath();
        ctx.fillStyle = col + Math.floor(trailAlpha * 100).toString(16).padStart(2, "0");
        ctx.arc(trailX, CY, 2.5 - i * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // Reset when done
      if (progress >= 1 && stateRef.current !== "blocked") {
        progress = 0;
        fadeOut = 1;
      }

      animRef.current = requestAnimationFrame(drawBeam);
    }

    // Reset progress on new animation
    if (state === "animating") progress = 0;

    animRef.current = requestAnimationFrame(drawBeam);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, mode, color, direction, reduced, successColor]);

  if (reduced) {
    return (
      <div className="relative flex items-center justify-center h-6 w-full my-1">
        {state === "animating" && (
          <div className="h-0.5 w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
        )}
        {state === "blocked" && (
          <div className="h-0.5 w-1/2 rounded-full opacity-40" style={{ backgroundColor: CRIMSON }} />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-full overflow-visible" style={{ height: 32 }}>
      {/* Canvas beam */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Shatter particles at impact (50% mark = gate center) */}
      <AnimatePresence>
        {particles.map((p) => {
          const radians = (p.angle * Math.PI) / 180;
          const dist = 28 + p.speed * 22;
          return (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: CRIMSON,
                boxShadow: `0 0 ${p.size * 2}px ${CRIMSON}`,
                left: "50%",
                top: "50%",
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(radians) * dist,
                y: Math.sin(radians) * dist * 0.5,
                opacity: 0,
                scale: 0.1,
              }}
              transition={{
                duration: p.speed * 0.55,
                ease: [0.0, 0.0, 0.2, 1],
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* Impact ripple */}
      <AnimatePresence>
        {ripple && (
          <>
            <motion.div
              className="absolute rounded-full border"
              style={{
                borderColor: CRIMSON,
                width: 8,
                height: 8,
                left: "50%",
                top: "50%",
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 7, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
            <motion.div
              className="absolute rounded-full border"
              style={{
                borderColor: CRIMSON,
                width: 8,
                height: 8,
                left: "50%",
                top: "50%",
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
