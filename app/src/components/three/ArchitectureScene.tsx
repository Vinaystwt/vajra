/**
 * ArchitectureScene — 3D mini scene for /why page.
 * Shows: Owner → PolicyPDA Vault → Agent → Guards → Destination
 * Camera drifts slowly. PolicyPDA node is central and brighter.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { ThreeCanvasShell } from "./ThreeCanvasShell";

const CYAN = "#00E5FF";
const EMERALD = "#10B981";
const DIM = "#555555";

interface ArchNode {
  pos: [number, number, number];
  color: string;
  size: number;
  label: string;
  emissive?: number;
}

const NODES: ArchNode[] = [
  { pos: [-3, 1, -1], color: DIM, size: 0.18, label: "Owner", emissive: 0.2 },
  { pos: [0, 0, 0], color: CYAN, size: 0.38, label: "PolicyPDA", emissive: 1.2 },
  { pos: [-1.8, -0.5, 0.5], color: DIM, size: 0.15, label: "Agent", emissive: 0.2 },
  { pos: [1.5, 0.8, 0.5], color: EMERALD, size: 0.22, label: "Guards", emissive: 0.7 },
  { pos: [3, -0.2, -0.5], color: DIM, size: 0.15, label: "Destination", emissive: 0.2 },
];

const EDGES: [number, number][] = [
  [0, 1], // Owner → PolicyPDA
  [1, 2], // PolicyPDA → Agent (delegated)
  [2, 1], // Agent → PolicyPDA (request)
  [1, 3], // PolicyPDA → Guards
  [3, 4], // Guards → Destination
];

function NodeSphere({ node, index }: { node: ArchNode; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * (index === 1 ? 0.4 : 0.2);
    if (lightRef.current) {
      lightRef.current.intensity = 0.3 + Math.sin(Date.now() * 0.002 + index) * 0.1;
    }
  });

  return (
    <group position={node.pos}>
      <Float speed={1 + index * 0.3} floatIntensity={0.08} rotationIntensity={0.05}>
        <mesh ref={ref}>
          <icosahedronGeometry args={[node.size, 1]} />
          <meshStandardMaterial
            color="#111111"
            emissive={node.color}
            emissiveIntensity={node.emissive ?? 0.4}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        {index === 1 && (
          <pointLight
            ref={lightRef}
            color={CYAN}
            intensity={0.5}
            distance={4}
          />
        )}
      </Float>
    </group>
  );
}

function EdgeBeam({ from, to, index }: { from: [number, number, number]; to: [number, number, number]; index: number }) {
  const ref = useRef<THREE.Mesh>(null);

  const mid: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2,
    (from[2] + to[2]) / 2,
  ];

  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const direction = new THREE.Vector3(dx, dy, dz).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.2 + Math.sin(Date.now() * 0.003 + index * 0.8) * 0.15;
  });

  return (
    <mesh
      ref={ref}
      position={mid}
      quaternion={quaternion}
    >
      <cylinderGeometry args={[0.008, 0.008, length, 4]} />
      <meshStandardMaterial
        color={CYAN}
        emissive={CYAN}
        emissiveIntensity={0.3}
        transparent
        opacity={0.35}
        metalness={0.5}
      />
    </mesh>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 3, 3]} intensity={0.3} color="#ffffff" />
      <pointLight position={[0, 0, 0]} color={CYAN} intensity={0.6} distance={7} />
    </>
  );
}

function ArchScene() {
  useFrame(({ camera }) => {
    camera.position.x = Math.sin(Date.now() * 0.0002) * 0.8;
    camera.position.y = Math.cos(Date.now() * 0.00015) * 0.3 + 0.5;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <SceneLights />
      {NODES.map((node, i) => (
        <NodeSphere key={node.label} node={node} index={i} />
      ))}
      {EDGES.map(([from, to], i) => (
        <EdgeBeam
          key={i}
          from={NODES[from].pos}
          to={NODES[to].pos}
          index={i}
        />
      ))}
    </>
  );
}

function StaticFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-3">
        {["Owner", "PolicyPDA", "Agent", "Guards", "Dest"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${i === 1 ? "bg-cyan glow-cyan" : i === 3 ? "bg-emerald" : "bg-[rgba(255,255,255,0.2)]"}`}
            />
            {i < 4 && <div className="w-4 h-px bg-[rgba(255,255,255,0.1)]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArchitectureScene({ className = "" }: { className?: string }) {
  return (
    <ThreeCanvasShell
      className={className}
      camera={{ position: [0, 1, 8], fov: 40 }}
      dpr={[1, 1.5]}
      fallback={<StaticFallback />}
    >
      <ArchScene />
    </ThreeCanvasShell>
  );
}
