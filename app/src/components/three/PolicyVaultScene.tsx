/**
 * PolicyVaultScene — 3D hero scene for Vajra.
 *
 * Visual story:
 *   Agent node (outside ring) → Policy Ring → Vault Core
 *   Allowed packet: cyan sphere passes through ring
 *   Blocked packet: red sphere hits ring → shatters
 *   Vault core remains stable regardless of attack
 *
 * Connects to WarRoom state via `warState` prop.
 */
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { ThreeCanvasShell } from "./ThreeCanvasShell";

type WarRoomState =
  | "idle"
  | "normal_animating"
  | "normal_success"
  | "compromised_idle"
  | "attack_animating"
  | "blocked"
  | "proof_revealed"
  | "revoked"
  | "reset";

interface Props {
  warState?: WarRoomState;
  mode?: "normal" | "compromised";
  className?: string;
}

// ─── Colors ──────────────────────────────────────────────────────────────────
const CYAN_HEX = "#00E5FF";
const CRIMSON_HEX = "#E11D48";
const EMERALD_HEX = "#10B981";
const SURFACE = "#171717";

// ─── Sub-components ──────────────────────────────────────────────────────────

function VaultCore({ isBlocked, isAllowed, isCompromised }: { isBlocked: boolean; isAllowed: boolean; isCompromised: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.15;
    meshRef.current.rotation.x += delta * 0.05;

    const target = isBlocked ? CRIMSON_HEX : isAllowed ? EMERALD_HEX : isCompromised ? "#8B0000" : CYAN_HEX;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetColor = new THREE.Color(target);
    mat.emissive.lerp(targetColor, 0.06);

    if (glowRef.current) {
      const targetIntensity = isBlocked ? 1.5 : isAllowed ? 1.2 : 0.6;
      glowRef.current.intensity += (targetIntensity - glowRef.current.intensity) * 0.05;
      const lightColor = new THREE.Color(target);
      glowRef.current.color.lerp(lightColor, 0.05);
    }
  });

  return (
    <group>
      {/* Core icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color={SURFACE}
          emissive={CYAN_HEX}
          emissiveIntensity={0.4}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh scale={0.5}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial
          color={CYAN_HEX}
          emissive={CYAN_HEX}
          emissiveIntensity={0.8}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Point light at core */}
      <pointLight ref={glowRef} color={CYAN_HEX} intensity={0.6} distance={6} />
    </group>
  );
}

function PolicyRing({ isBlocked, isCompromised }: { isBlocked: boolean; isCompromised: boolean }) {
  const ringRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const impactRef = useRef<THREE.Mesh>(null);
  const [impacting, setImpacting] = useState(false);

  useEffect(() => {
    if (isBlocked) {
      setImpacting(true);
      const t = setTimeout(() => setImpacting(false), 800);
      return () => clearTimeout(t);
    }
  }, [isBlocked]);

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.y += delta * 0.3;
    ringRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.1;

    if (ring1Ref.current) {
      const mat = ring1Ref.current.material as THREE.MeshStandardMaterial;
      const targetColor = new THREE.Color(isCompromised ? "#FF4400" : CYAN_HEX);
      mat.color.lerp(targetColor, 0.05);
      mat.emissive.lerp(targetColor, 0.04);
    }

    if (impactRef.current) {
      const mat = impactRef.current.material as THREE.MeshStandardMaterial;
      if (impacting) {
        mat.opacity = Math.min(mat.opacity + 0.1, 0.6);
        impactRef.current.scale.setScalar(Math.min(impactRef.current.scale.x + 0.05, 1.8));
      } else {
        mat.opacity = Math.max(mat.opacity - 0.04, 0);
        impactRef.current.scale.setScalar(Math.max(impactRef.current.scale.x - 0.02, 1.0));
      }
    }
  });

  return (
    <group ref={ringRef}>
      {/* Main policy ring */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.55, 0.04, 12, 80]} />
        <meshStandardMaterial
          color={CYAN_HEX}
          emissive={CYAN_HEX}
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Secondary ring (tilted) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[1.55, 0.025, 8, 60]} />
        <meshStandardMaterial
          color={CYAN_HEX}
          emissive={CYAN_HEX}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Impact flash ring */}
      <mesh ref={impactRef} scale={1}>
        <torusGeometry args={[1.55, 0.12, 8, 60]} />
        <meshStandardMaterial
          color={CRIMSON_HEX}
          emissive={CRIMSON_HEX}
          emissiveIntensity={1}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

function TransactionPacket({
  active,
  blocked,
  mode,
}: {
  active: boolean;
  blocked: boolean;
  mode: "allowed" | "attack";
}) {
  const packetRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const shardRefs = useRef<THREE.Mesh[]>([]);
  const [shattered, setShattered] = useState(false);

  useEffect(() => {
    if (active) {
      progressRef.current = 0;
      setVisible(true);
      setShattered(false);
    }
  }, [active]);

  useEffect(() => {
    if (blocked) {
      setShattered(true);
      const t = setTimeout(() => {
        setVisible(false);
        setShattered(false);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [blocked]);

  useFrame((_, delta) => {
    if (!packetRef.current || !visible) return;

    if (!shattered) {
      progressRef.current += delta * 1.2;
      // Travel from agent (-2.8) to gate (0), or gate to vault for allowed
      const t = Math.min(progressRef.current, 1);
      const startX = mode === "attack" ? -2.8 : -2.8;
      const targetX = blocked ? -1.55 : 1.55; // Stop at ring or pass through
      packetRef.current.position.x = startX + (targetX - startX) * t;
      packetRef.current.rotation.y += delta * 4;

      if (t >= 1 && !blocked) {
        setVisible(false);
      }
    } else {
      // Shard animations
      shardRefs.current.forEach((shard, i) => {
        if (!shard) return;
        const angle = (i / shardRefs.current.length) * Math.PI * 2;
        const radius = 0.3 + progressRef.current * 1.5;
        shard.position.x = -1.55 + Math.cos(angle) * radius * 0.5;
        shard.position.y = Math.sin(angle) * radius;
        shard.position.z = Math.sin(angle * 2) * radius * 0.3;
        const mat = shard.material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, 1 - progressRef.current * 1.5);
        shard.scale.setScalar(Math.max(0.01, 1 - progressRef.current));
      });
      progressRef.current += delta * 0.8;
    }
  });

  const color = mode === "attack" ? CRIMSON_HEX : CYAN_HEX;

  if (!visible) return null;

  return (
    <group>
      {/* Packet */}
      <mesh ref={packetRef} position={[-2.8, 0, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Shards on block */}
      {shattered &&
        Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={i}
            ref={(el) => { if (el) shardRefs.current[i] = el; }}
            position={[-1.55, 0, 0]}
          >
            <tetrahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial
              color={CRIMSON_HEX}
              emissive={CRIMSON_HEX}
              emissiveIntensity={1}
              transparent
              opacity={1}
            />
          </mesh>
        ))}
    </group>
  );
}

function AgentNode({ isCompromised }: { isCompromised: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.6;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    const target = new THREE.Color(isCompromised ? CRIMSON_HEX : "#AAAAAA");
    mat.emissive.lerp(target, 0.05);
  });

  return (
    <mesh ref={ref} position={[-2.8, 0, 0]}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial
        color={SURFACE}
        emissive={isCompromised ? CRIMSON_HEX : "#888888"}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.2}
      />
    </mesh>
  );
}

function RuleShards() {
  const shards = useRef<THREE.Mesh[]>([]);
  const rules = ["CAP", "PERIOD", "DEST", "REVOKE", "VELOCITY"];

  useFrame((_, delta) => {
    shards.current.forEach((s, i) => {
      if (!s) return;
      s.rotation.y += delta * (0.3 + i * 0.1);
      s.rotation.x += delta * 0.15;
      s.position.y = Math.sin(Date.now() * 0.001 + i) * 0.05;
    });
  });

  return (
    <group>
      {rules.map((_, i) => {
        const angle = (i / rules.length) * Math.PI * 2;
        const r = 1.1;
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) shards.current[i] = el; }}
            position={[
              Math.cos(angle) * r,
              Math.sin(angle) * r * 0.4,
              Math.sin(angle) * r * 0.3,
            ]}
          >
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial
              color={CYAN_HEX}
              emissive={CYAN_HEX}
              emissiveIntensity={0.6}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 5, 5]} intensity={0.3} color="#ffffff" />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color={CYAN_HEX} distance={8} />
      <pointLight position={[2, -2, -2]} intensity={0.2} color="#0044ff" distance={6} />
    </>
  );
}

// ─── Main scene ──────────────────────────────────────────────────────────────

function Scene({ warState = "idle", mode = "normal" }: { warState: WarRoomState; mode: "normal" | "compromised" }) {
  const isCompromised = mode === "compromised";
  const isAnimating = warState === "normal_animating" || warState === "attack_animating";
  const isBlocked = warState === "blocked" || warState === "proof_revealed";
  const isAllowed = warState === "normal_success";
  const attackMode = warState === "attack_animating" || isBlocked;

  useFrame(({ camera }) => {
    // Subtle camera drift
    camera.position.x += (Math.sin(Date.now() * 0.0003) * 0.3 - camera.position.x) * 0.01;
    camera.position.y += (Math.cos(Date.now() * 0.0002) * 0.15 - camera.position.y) * 0.01;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <SceneLights />

      <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.15}>
        <VaultCore isBlocked={isBlocked} isAllowed={isAllowed} isCompromised={isCompromised} />
      </Float>

      <PolicyRing isBlocked={isBlocked} isCompromised={isCompromised} />
      <RuleShards />
      <AgentNode isCompromised={isCompromised} />

      {isAnimating && (
        <TransactionPacket
          active={isAnimating}
          blocked={isBlocked}
          mode={attackMode ? "attack" : "allowed"}
        />
      )}
    </>
  );
}

// ─── Static fallback ─────────────────────────────────────────────────────────

function StaticFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="relative flex items-center justify-center">
        {/* Vault */}
        <div className="w-20 h-20 rounded-2xl border-2 border-cyan/40 bg-cyan/5 flex items-center justify-center glow-cyan">
          <div className="w-8 h-8 rounded-lg bg-cyan/20 border border-cyan/30" />
        </div>
        {/* Ring */}
        <div className="absolute w-32 h-32 rounded-full border border-cyan/20" />
        <div className="absolute w-40 h-40 rounded-full border border-cyan/10" />
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export function PolicyVaultScene({ warState = "idle", mode = "normal", className = "" }: Props) {
  return (
    <ThreeCanvasShell
      className={className}
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      fallback={<StaticFallback />}
    >
      <Scene warState={warState} mode={mode} />
    </ThreeCanvasShell>
  );
}
