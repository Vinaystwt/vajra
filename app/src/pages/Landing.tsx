import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, ExternalLink, Lock, Zap, Database, CheckCircle2, FlaskConical } from "lucide-react";
import { WarRoom } from "../components/war-room/WarRoom";
import { MetricCard } from "../components/ui/MetricCard";
import { Button } from "../components/ui/Button";
import { SectionHeader } from "../components/ui/SectionHeader";
import { useDevnetProofs } from "../hooks/useDevnetProofs";
import { PROGRAM_EXPLORER, PROGRAM_ID, shortKey } from "../lib/constants";
import { NetworkField } from "../components/effects/NetworkField";
import { ScanLine } from "../components/effects/ScanLine";

const GUARD_CHECKS = [
  { n: 1, label: "Policy revoked", rule: "PolicyRevoked" },
  { n: 2, label: "Policy expired", rule: "PolicyExpired" },
  { n: 3, label: "Invalid delegate signer", rule: "InvalidDelegateSigner" },
  { n: 4, label: "Amount zero", rule: "AmountZero" },
  { n: 5, label: "Per-tx cap exceeded", rule: "PerTxCapExceeded" },
  { n: 6, label: "Total budget exceeded", rule: "TotalBudgetExceeded" },
  { n: "6B", label: "Period budget exceeded", rule: "PeriodBudgetExceeded" },
  { n: "6C", label: "Velocity limit exceeded", rule: "VelocityLimitExceeded" },
  { n: 7, label: "Destination not allowed", rule: "DestinationNotAllowed" },
  { n: 8, label: "Mint mismatch", rule: "MintMismatch" },
  { n: 9, label: "Vault mint mismatch", rule: "VaultMintMismatch" },
  { n: 10, label: "Invalid vault authority", rule: "InvalidVaultAuthority" },
  { n: 11, label: "Vault insufficient balance", rule: "VaultInsufficientBalance" },
  { n: 12, label: "All clear — CPI transfer", rule: "AllClear" },
];

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

/** Animated stat counter */
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1200;
        const start = performance.now();
        function tick(now: number) {
          const t = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setCount(Math.floor(ease * target));
          if (t < 1) requestAnimationFrame(tick);
          else setCount(target);
        }
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export function Landing() {
  const { summary } = useDevnetProofs();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 overflow-hidden min-h-[85vh] flex items-center">
        {/* Network field — primary atmospheric layer */}
        <NetworkField
          className="absolute inset-0"
          density={0.5}
          opacity={0.6}
        />

        {/* Grid bg */}
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        {/* Scan line */}
        <ScanLine />

        {/* Radial glow at top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top center, rgba(0,229,255,0.05) 0%, transparent 65%)",
          }}
        />

        {/* Bottom vignette */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 mb-8"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan/20 bg-cyan/5 text-xs font-mono text-cyan">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-cyan"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                Non-custodial Allowance Vault · Solana Devnet
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.04] text-[#EDEDED] mb-6"
            >
              Give agents{" "}
              <span className="font-bold text-[#EDEDED]">an allowance,</span>{" "}
              <span className="text-[rgba(237,237,237,0.38)]">not the keys.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-lg text-[rgba(237,237,237,0.58)] leading-relaxed max-w-xl mb-10"
            >
              A compromised agent key should not drain your treasury.{" "}
              <span className="text-[rgba(237,237,237,0.8)]">
                Vajra changes the authority model: the PolicyPDA owns the SPL vault, the agent
                only requests, and the program enforces policy before tokens move.
              </span>
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link to="/attack-lab">
                <Button
                  variant="primary"
                  size="lg"
                  className="group"
                >
                  <FlaskConical size={16} />
                  Run the Attack Lab
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link to="/proofs">
                <Button variant="ghost" size="lg">
                  Verify the receipts
                </Button>
              </Link>
            </motion.div>

            {/* Program ID badge */}
            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              href={PROGRAM_EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-mono text-[rgba(237,237,237,0.3)] hover:text-[rgba(237,237,237,0.6)] transition-colors border border-[rgba(255,255,255,0.07)] px-3 py-2 rounded-lg hover:border-[rgba(255,255,255,0.12)]"
            >
              <Shield size={12} />
              Program: {shortKey(PROGRAM_ID, 8, 8)}
              <ExternalLink size={10} />
            </motion.a>
          </div>
        </div>
      </section>

      {/* ─── Proof Strip ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#0a0a0a] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#E11D48]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[rgba(237,237,237,0.3)]">
                  Fresh devnet red-team proof · Raw key drains. Vajra survives. Anyone can verify it.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-[rgba(255,255,255,0.05)]">
                {/* Cell 1: Raw wallet drain */}
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">Raw wallet drained</span>
                  <span className="text-xl font-mono font-semibold text-[#E11D48]" style={{ textShadow: "0 0 20px rgba(225,29,72,0.3)" }}>
                    50.00
                  </span>
                  <span className="text-[10px] font-mono text-[rgba(237,237,237,0.4)]">DemoUSD test SPL</span>
                  <a
                    href="https://explorer.solana.com/tx/wTo4fANWAG6P3azWJ4W3MQVYn5rYpZp6s3ZijsKsN4xGP2ACCGieZgtYKXZ6wiFNW3WTek9Paeco9bozGye95p3?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-mono text-[rgba(237,237,237,0.3)] hover:text-[#E11D48] transition-colors mt-0.5"
                  >
                    wTo4fAN…e95p3
                    <ExternalLink size={8} />
                  </a>
                </div>
                {/* Cell 2: Vajra vault loss */}
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">Vajra vault loss</span>
                  <span className="text-xl font-mono font-semibold text-[#10B981]" style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}>
                    0.00
                  </span>
                  <span className="text-[10px] font-mono text-[rgba(237,237,237,0.4)]">vault delta = 0</span>
                </div>
                {/* Cell 3: Blocked rule */}
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">Blocked rule</span>
                  <span className="text-xl font-mono font-semibold text-[#00E5FF]">
                    perTxCap
                  </span>
                  <span className="text-[10px] font-mono text-[rgba(237,237,237,0.4)]">inner transfers: 0</span>
                </div>
                {/* Cell 4: Blocked tx */}
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">Blocked Vajra tx</span>
                  <span className="text-sm font-mono font-semibold text-[#10B981] leading-tight mt-0.5">
                    Failed on-chain
                  </span>
                  <a
                    href="https://explorer.solana.com/tx/5yWAEdtjihJjGWk9phXLvAG831r9yqvT7qrPgbmaFXoS5whsFSLLuuLLFGnUmKpAE22RWvFxPk3NDn1oCqfEqEf8?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-mono text-[rgba(237,237,237,0.3)] hover:text-[#10B981] transition-colors mt-0.5"
                  >
                    5yWAEdt…EqEf8
                    <ExternalLink size={8} />
                  </a>
                </div>
                {/* Cell 5: Allowed tx */}
                <div className="flex flex-col gap-1 px-5 py-4">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">Allowed Vajra tx</span>
                  <span className="text-sm font-mono font-semibold text-cyan leading-tight mt-0.5">
                    Passed on-chain
                  </span>
                  <a
                    href="https://explorer.solana.com/tx/382Mj4AgfWcMcmzaMZebrbmbBBGTDezghXWssJnFBy6y33ZkpT48uFHs7toerSFmPmGuAVtefM1CWvG2miDYXvAo?cluster=devnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-mono text-[rgba(237,237,237,0.3)] hover:text-cyan transition-colors mt-0.5"
                  >
                    382Mj4A…vAo
                    <ExternalLink size={8} />
                  </a>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Metrics strip ───────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-4">
            <SectionHeader
              eyebrow="The Proof Is On-Chain"
              title="Fresh devnet red-team run."
              sub="Blocked transaction is on Solana Explorer."
            />
          </FadeIn>
          <FadeIn delay={0.06}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard
                label="Blocked attempts"
                value={<AnimatedCount target={summary.blockedCount || 6} />}
                sub="Devnet proof artifacts"
                accent="crimson"
                icon={<Shield size={14} />}
              />
              <MetricCard
                label="Vault delta on blocked"
                value="0.00 DemoUSD"
                sub="Funds never moved"
                accent="emerald"
                icon={<Database size={14} />}
              />
              <MetricCard
                label="Inner token transfers"
                value={<AnimatedCount target={summary.innerTransfersOnBlocked} />}
                sub="On blocked transactions"
                accent="cyan"
                icon={<Zap size={14} />}
              />
              <MetricCard
                label="Guard checks"
                value={<AnimatedCount target={12} />}
                sub="Enforced in order"
                accent="default"
                icon={<Lock size={14} />}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── War Room ────────────────────────────────────────────────────── */}
      <section id="war-room" className="px-4 sm:px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-6">
            <SectionHeader
              eyebrow="Interactive Replay"
              title="See both outcomes side by side."
              sub="Toggle compromised mode. Launch an attack. The vault balance stays unchanged. The program rejected the transfer."
            />
          </FadeIn>
          <FadeIn delay={0.08}>
            <WarRoom />
          </FadeIn>
        </div>
      </section>

      {/* ─── How Vajra works ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24 bg-[#080808] border-y border-[rgba(255,255,255,0.04)] relative overflow-hidden">
        <div className="absolute inset-0 grid-bg-fine opacity-30 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <FadeIn className="mb-14">
            <SectionHeader
              eyebrow="How it works"
              title="The policy is not advice."
              sub="The policy is the transfer authority."
              align="center"
            />
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Steps */}
            <FadeIn>
              <div className="flex flex-col gap-0">
                {[
                  { icon: <Shield size={15} />, label: "Owner funds vault", sub: "Tokens move to an SPL ATA owned by PolicyPDA, not by the owner or agent." },
                  { icon: <Lock size={15} />, label: "Vault authority = PolicyPDA", sub: "The program-derived address is the only valid signer for SPL transfers from the vault." },
                  { icon: <Zap size={15} />, label: "Agent requests spend", sub: "The delegated signer calls executeGuardedTransfer with amount and destination." },
                  { icon: <CheckCircle2 size={15} />, label: "12 guard checks run", sub: "The Solana program enforces revoke, expiry, cap, budget, velocity, destination, and vault ownership." },
                  { icon: <ArrowRight size={15} />, label: "Only valid transfers move", sub: "Any failed check aborts the instruction. No tokens leave the vault." },
                ].map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div
                        className="flex items-center justify-center w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-cyan shrink-0 mt-0.5"
                        whileInView={{ borderColor: "rgba(0,229,255,0.2)", backgroundColor: "rgba(0,229,255,0.06)" }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 + 0.2, duration: 0.4 }}
                      >
                        {step.icon}
                      </motion.div>
                      {i < 4 && (
                        <motion.div
                          className="w-px bg-gradient-to-b from-cyan/15 to-transparent mt-1 mb-1"
                          style={{ height: 0 }}
                          whileInView={{ height: 28 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.08 + 0.3, duration: 0.3 }}
                        />
                      )}
                    </div>
                    <div className="pb-6 flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[rgba(237,237,237,0.9)]">{step.label}</span>
                      <span className="text-sm text-[rgba(237,237,237,0.48)] leading-relaxed">{step.sub}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            {/* Guard check list */}
            <FadeIn delay={0.12}>
              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                <div className="px-4 py-3 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)]">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[rgba(237,237,237,0.28)]">
                    Guard check sequence
                  </span>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.03)]">
                  {GUARD_CHECKS.map((g, i) => (
                    <motion.div
                      key={g.n}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.015] transition-colors"
                    >
                      <span className="text-[9px] font-mono text-[rgba(237,237,237,0.25)] w-5 shrink-0 text-right">
                        {g.n}
                      </span>
                      <motion.div
                        className={`w-1 h-1 rounded-full shrink-0 ${g.rule === "AllClear" ? "bg-emerald" : "bg-[rgba(255,255,255,0.15)]"}`}
                        animate={g.rule === "AllClear" ? { scale: [1, 1.3, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span
                        className={`text-[11px] font-mono flex-1 ${
                          g.rule === "AllClear" ? "text-emerald" : "text-[rgba(237,237,237,0.62)]"
                        }`}
                      >
                        {g.label}
                      </span>
                      {g.rule === "AllClear" && (
                        <CheckCircle2 size={11} className="text-emerald ml-auto" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Why Solana + SDK teaser ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Why Solana */}
            <FadeIn>
              <div className="flex flex-col gap-6">
                <SectionHeader
                  eyebrow="Why Solana"
                  title="Built for sub-second agent payments"
                />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { metric: "~400ms", label: "Block time" },
                    { metric: "<$0.001", label: "Per transaction" },
                    { metric: "65,000", label: "Theoretical TPS" },
                    { metric: "Sub-second", label: "Finality" },
                  ].map((m, i) => (
                    <motion.div
                      key={m.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      className="panel p-4 flex flex-col gap-1 hover:border-cyan/15 transition-colors"
                    >
                      <span className="text-xl font-mono font-semibold text-cyan">{m.metric}</span>
                      <span className="text-xs text-[rgba(237,237,237,0.42)]">{m.label}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-[rgba(237,237,237,0.5)] leading-relaxed">
                  SPL-native vaults, PDA authority model, CPI composability, and Explorer-verifiable
                  failed transactions — Solana's architecture makes Vajra's enforcement model clean and auditable.
                </p>
              </div>
            </FadeIn>

            {/* SDK teaser */}
            <FadeIn delay={0.1}>
              <div className="flex flex-col gap-6">
                <SectionHeader
                  eyebrow="Integration surfaces"
                  title="Integrate in minutes"
                />
                <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
                    </div>
                    <span className="text-[10px] font-mono text-[rgba(237,237,237,0.28)]">typescript</span>
                    <span className="ml-auto flex items-center gap-1 text-[9px] font-mono text-emerald-400/70 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                      <span className="w-1 h-1 rounded-full bg-emerald-400/70 shrink-0" />
                      npm · v0.1.0
                    </span>
                  </div>
                  <div className="p-4 bg-[#0a0a0a] overflow-x-auto">
                    <pre className="text-[11px] font-mono text-[rgba(237,237,237,0.72)] leading-relaxed whitespace-pre">{`// npm install @vinaystwt/vajra-sdk

const policy = await client.createPolicy({
  totalBudget: 10_000_000_000,
  perTxCap: 500_000_000,
  agentKey: agentPublicKey,
  signer: ownerWallet,
});

// Agent spends within policy
await client.spend({
  policy: policy.address,
  amount: 50_000_000,   // 50 DemoUSD
  destination: merchantAta,
  signer: agentWallet,
});`}</pre>
                  </div>
                </div>
                <Link to="/developers">
                  <Button variant="outline" size="md">
                    View full SDK docs
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24 bg-[#080808] border-t border-[rgba(255,255,255,0.04)] relative overflow-hidden">
        <NetworkField className="absolute inset-0" density={0.2} opacity={0.4} />
        <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row items-center justify-between gap-8">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#EDEDED]">
              The failed transaction is the proof.
            </h2>
            <p className="text-[rgba(237,237,237,0.5)] max-w-lg leading-relaxed mt-3">
              The vault balance staying unchanged is the product.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="flex flex-wrap gap-3 shrink-0">
            <Link to="/proofs">
              <Button variant="primary" size="lg">
                View devnet proof artifacts
              </Button>
            </Link>
            <Link to="/why">
              <Button variant="ghost" size="lg">
                Why program-owned vaults?
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
