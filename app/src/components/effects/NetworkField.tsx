/**
 * NetworkField — animated canvas particle grid.
 * Solana-like network of nodes and connections.
 * Responds to compromised mode (cyan → red contamination pulse).
 */
import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "../../hooks/useReducedMotionSafe";

interface Props {
  compromised?: boolean;
  className?: string;
  density?: number; // nodes per 10k px²
  opacity?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pulse: number;
  pulseSpeed: number;
  size: number;
}

const CYAN = [0, 229, 255] as const;
const CRIMSON = [225, 29, 72] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function NetworkField({ compromised = false, className = "", density = 0.3, opacity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const compromisedRef = useRef(compromised);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    compromisedRef.current = compromised;
  }, [compromised]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0, height = 0;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width * Math.min(window.devicePixelRatio, 1.5);
      height = canvas.height = rect.height * Math.min(window.devicePixelRatio, 1.5);
      initNodes();
    }

    function initNodes() {
      const area = (width * height) / 10000;
      const count = Math.floor(area * density * (window.innerWidth < 768 ? 0.5 : 1));
      nodesRef.current = Array.from({ length: Math.min(count, 80) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
        size: 1 + Math.random() * 1.5,
      }));
    }

    // Contamination progress 0→1 when compromised toggles
    let contamination = 0;

    function draw(_time: number) {
      if (!ctx || !canvas) return;

      // Animate contamination
      const targetContam = compromisedRef.current ? 1 : 0;
      contamination += (targetContam - contamination) * 0.025;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const maxDist = Math.min(width, height) * 0.22;

      // Interpolate color
      const r = lerp(CYAN[0], CRIMSON[0], contamination);
      const g = lerp(CYAN[1], CRIMSON[1], contamination);
      const b = lerp(CYAN[2], CRIMSON[2], contamination);

      // Update and draw nodes
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        // Wrap
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Draw edges to nearby nodes
        for (const other of nodes) {
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist && dist > 0) {
            const alpha = (1 - dist / maxDist) * 0.12 * opacity;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw node
        const nodePulse = (Math.sin(node.pulse) + 1) / 2;
        const nodeAlpha = (0.25 + nodePulse * 0.45) * opacity;
        const nodeR = node.size * (1 + nodePulse * 0.4);

        ctx.beginPath();
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeR * 3);
        grad.addColorStop(0, `rgba(${r},${g},${b},${nodeAlpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.arc(node.x, node.y, nodeR * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    if (!reduced) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      // Static render for reduced motion
      ctx.clearRect(0, 0, width, height);
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [density, opacity, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
    />
  );
}
