import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Lock, Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Button } from "../components/ui/Button";
import { NetworkField } from "../components/effects/NetworkField";

const ArchitectureScene = lazy(() =>
  import("../components/three/ArchitectureScene").then((m) => ({ default: m.ArchitectureScene }))
);

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated comparison approach cards
const APPROACHES = [
  {
    label: "Raw wallet",
    sub: "Agent holds funds directly",
    risk: "critical",
    detail: "Agent compromise = full treasury drain. No enforcement boundary.",
    icon: <XCircle size={14} />,
  },
  {
    label: "Backend allowlist",
    sub: "Server-side transfer approval",
    risk: "high",
    detail: "Backend is not the fund authority. A compromised key can bypass it.",
    icon: <AlertTriangle size={14} />,
  },
  {
    label: "Session keys",
    sub: "Scoped signing keys",
    risk: "medium",
    detail: "Scoped signing but agent key may still have direct fund access.",
    icon: <AlertTriangle size={14} />,
  },
  {
    label: "Multisig",
    sub: "Human approval required",
    risk: "medium",
    detail: "Human-in-the-loop bottleneck — incompatible with autonomous agents.",
    icon: <AlertTriangle size={14} />,
  },
  {
    label: "Audit logs",
    sub: "After-the-fact visibility",
    risk: "high",
    detail: "Logs do not prevent transfers. They record what already happened.",
    icon: <AlertTriangle size={14} />,
  },
  {
    label: "Vajra",
    sub: "Program-owned vault + PolicyPDA",
    risk: "enforced",
    detail: "Program IS the vault authority. Agent cannot bypass policy — ever.",
    icon: <CheckCircle2 size={14} />,
  },
];

function ApproachCard({ item, index }: { item: typeof APPROACHES[0]; index: number }) {
  const isVajra = item.risk === "enforced";
  const isHigh = item.risk === "critical" || item.risk === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
      className={`panel p-5 flex flex-col gap-3 cursor-default ${
        isVajra ? "panel-cyan" : isHigh ? "panel-crimson" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
            isVajra
              ? "bg-emerald/15 border border-emerald/20 text-emerald"
              : isHigh
              ? "bg-crimson/12 border border-crimson/18 text-crimson"
              : "bg-amber/10 border border-amber/18 text-amber"
          }`}
        >
          {item.icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span
            className={`text-sm font-semibold ${
              isVajra ? "text-emerald" : "text-[rgba(237,237,237,0.88)]"
            }`}
          >
            {item.label}
          </span>
          <span className="text-[11px] text-[rgba(237,237,237,0.45)]">{item.sub}</span>
        </div>
        <div className={`ml-auto text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          isVajra
            ? "border-emerald/30 bg-emerald/8 text-emerald"
            : isHigh
            ? "border-crimson/25 bg-crimson/8 text-crimson"
            : "border-amber/20 bg-amber/6 text-amber"
        }`}>
          {item.risk}
        </div>
      </div>
      <p className="text-xs text-[rgba(237,237,237,0.48)] leading-relaxed">{item.detail}</p>
    </motion.div>
  );
}

// Animated mechanism step
function MechanismStep({ icon, title, body, index }: { icon: React.ReactNode; title: string; body: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-4"
    >
      <motion.div
        className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan/8 border border-cyan/15 text-cyan shrink-0"
        whileInView={{ backgroundColor: "rgba(0,229,255,0.08)", borderColor: "rgba(0,229,255,0.2)" }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
      >
        {icon}
      </motion.div>
      <div className="flex flex-col gap-1 pb-6">
        <span className="text-sm font-semibold text-[rgba(237,237,237,0.9)]">{title}</span>
        <p className="text-sm text-[rgba(237,237,237,0.5)] leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

export function WhyVajra() {
  return (
    <PageShell>
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
        <div className="relative flex flex-col gap-6 max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-mono uppercase tracking-[0.2em] text-cyan"
          >
            Why Vajra
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight text-[#EDEDED]"
          >
            Bots need budgets,{" "}
            <span className="text-[rgba(237,237,237,0.38)]">not treasuries.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-lg text-[rgba(237,237,237,0.55)] leading-relaxed max-w-xl"
          >
            Automated signers need to pay for APIs, data, compute, and services. Raw keys make
            every automation script a treasury risk.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 flex-wrap"
          >
            <Link to="/attack-lab">
              <Button variant="primary" size="md">
                Run the Attack Lab
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Link to="/proofs">
              <Button variant="ghost" size="md">
                View devnet proof artifacts
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Proof callout ───────────────────────────────────────────────── */}
      <section className="pb-8 border-t border-[rgba(255,255,255,0.05)] pt-10">
        <FadeIn>
          <div className="rounded-2xl border border-[rgba(225,29,72,0.25)] bg-[rgba(225,29,72,0.04)] p-5 flex flex-col gap-3 max-w-xl">
            <div className="flex items-center gap-2">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[rgba(237,237,237,0.4)]">
                Fresh devnet red-team result
              </span>
            </div>
            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[rgba(237,237,237,0.35)]">·</span>
                <span className="text-[rgba(237,237,237,0.5)]">Raw wallet drained</span>
                <span className="text-[#E11D48] font-semibold ml-auto">50 DemoUSD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[rgba(237,237,237,0.35)]">·</span>
                <span className="text-[rgba(237,237,237,0.5)]">Vajra blocked equivalent drain</span>
                <span className="text-[#10B981] font-semibold ml-auto">blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[rgba(237,237,237,0.35)]">·</span>
                <span className="text-[rgba(237,237,237,0.5)]">Vault delta</span>
                <span className="text-[#10B981] font-semibold ml-auto">0 · Inner transfers: 0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[rgba(237,237,237,0.35)]">·</span>
                <span className="text-[rgba(237,237,237,0.5)]">Blocked tx sig</span>
                <a
                  href="https://explorer.solana.com/tx/5yWAEdt?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00E5FF] hover:underline ml-auto font-mono"
                >
                  5yWAEdt…EqEf8 ↗
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── Comparison grid ─────────────────────────────────────────────── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
        <FadeIn className="mb-10">
          <SectionHeader
            eyebrow="Failure modes"
            title="Why other approaches fall short"
            sub="Each category addresses a different part of the problem. Vajra makes the program the enforcement boundary."
          />
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPROACHES.map((item, i) => (
            <ApproachCard key={item.label} item={item} index={i} />
          ))}
        </div>
      </section>

      {/* ─── Mechanism + 3D Architecture ─────────────────────────────────── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: mechanism steps */}
          <div className="flex flex-col gap-6">
            <FadeIn>
              <SectionHeader
                eyebrow="The mechanism"
                title="The policy is not advice."
                sub="The policy is the transfer authority."
              />
            </FadeIn>
            <div className="flex flex-col gap-0 mt-2">
              {[
                {
                  icon: <Shield size={15} />,
                  title: "Vault authority is the PolicyPDA",
                  body: "The SPL token vault's authority is the Vajra PolicyPDA — a program-derived address. The agent key is registered as a delegated signer, not as the authority.",
                },
                {
                  icon: <Lock size={15} />,
                  title: "Agent cannot bypass the program",
                  body: "A raw SPL transfer signed by the agent fails because the SPL token program checks the authority. The agent is not the vault authority.",
                },
                {
                  icon: <Zap size={15} />,
                  title: "Program enforces before funds move",
                  body: "executeGuardedTransfer checks all 12 guards in sequence. Any failure aborts the instruction. The CPI transfer to the destination only runs after all guards pass.",
                },
                {
                  icon: <CheckCircle2 size={15} />,
                  title: "Blocked transaction is the proof",
                  body: "Failed transactions land on-chain with program logs. The guard check, error code, and zero vault delta are all on the public ledger.",
                },
              ].map((item, i) => (
                <MechanismStep key={item.title} {...item} index={i} />
              ))}
            </div>
          </div>

          {/* Right: 3D scene */}
          <FadeIn delay={0.1} className="sticky top-20">
            <div
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] overflow-hidden bg-[#090909] relative"
              style={{ height: 380 }}
            >
              <NetworkField density={0.25} opacity={0.5} className="rounded-2xl" />
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border border-cyan/30 border-t-cyan animate-spin" />
                </div>
              }>
                <ArchitectureScene className="absolute inset-0 w-full h-full" />
              </Suspense>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#090909] to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-3 text-[9px] font-mono text-[rgba(237,237,237,0.3)] uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-cyan glow-cyan" />
                  PolicyPDA — central enforcement node
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Why Solana ──────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
        <FadeIn className="mb-10">
          <SectionHeader
            eyebrow="Why Solana"
            title="Infrastructure for autonomous payments"
            sub="Solana's architecture is uniquely suited for agent-grade payment infrastructure."
          />
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Low-cost frequent payments",
              body: "At less than $0.001 per transaction, agents can make fine-grained payments without operational friction.",
            },
            {
              title: "SPL-native vaults",
              body: "SPL token accounts have a single authority field. By making that authority a PDA, the program becomes the gatekeeper at the protocol level.",
            },
            {
              title: "PDA authority model",
              body: "Program-derived addresses let a program act as a signer for CPIs. No multisig or governance delay — the program signs on behalf of the PolicyPDA.",
            },
            {
              title: "CPI composability",
              body: "executeGuardedTransfer ends with a CPI to the SPL token program. The policy enforces, then the standard token program transfers. Clean separation.",
            },
            {
              title: "Explorer-verifiable failures",
              body: "Failed transactions land on-chain with full program logs. The guard check that fired, the error code, and the zero vault delta are all on the public ledger.",
            },
            {
              title: "Sub-second finality",
              body: "Agent payments that need to unlock an API or confirm a data purchase happen in the same heartbeat as the request. No waiting.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="panel p-5 flex flex-col gap-2 hover:border-cyan/12 transition-colors duration-300"
            >
              <span className="text-sm font-semibold text-[rgba(237,237,237,0.88)]">{item.title}</span>
              <p className="text-sm text-[rgba(237,237,237,0.48)] leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CTAs ────────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
        <FadeIn>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link to="/attack-lab">
              <Button variant="primary" size="lg">
                Run the Attack Lab
                <ArrowRight size={15} />
              </Button>
            </Link>
            <Link to="/proofs">
              <Button variant="ghost" size="lg">
                View devnet proof artifacts
              </Button>
            </Link>
            <Link to="/developers">
              <Button variant="ghost" size="lg">
                Install the SDK
              </Button>
            </Link>
          </div>
        </FadeIn>
      </section>
    </PageShell>
  );
}
