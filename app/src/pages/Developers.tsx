import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Package, Terminal, Layers, Code2, Cpu, FileCode2, Check } from "lucide-react";
import { PageShell } from "../components/layout/PageShell";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Button } from "../components/ui/Button";
import { CodeSnippet } from "../components/ui/CodeSnippet";
import { DeveloperTabs } from "../components/developers/DeveloperTabs";
import { McpToolCard } from "../components/developers/McpToolCard";
import { TemplateCard } from "../components/developers/TemplateCard";
import { PolicyBuilderSimulator } from "../components/developers/PolicyBuilderSimulator";
import { loadPolicyTemplates, loadSdkSnippets } from "../lib/data";
import type { PolicyTemplate } from "../lib/types";

const BUILTIN_TEMPLATES: PolicyTemplate[] = [
  { id: "x402ApiBuyer", name: "x402 API Buyer", description: "Agent pays protected APIs through policy vaults", totalBudget: 100000000, perTxCap: 5000000, periodBudget: 25000000 },
  { id: "daoOpsBot", name: "DAO Ops Bot", description: "Recurring payments within destination, budget, and velocity limits", totalBudget: 1000000000, perTxCap: 25000000, periodBudget: 100000000 },
  { id: "marketMaker", name: "Market Maker", description: "High-frequency trading within per-tx and velocity bounds", totalBudget: 5000000000, perTxCap: 100000000, periodBudget: 1000000000 },
  { id: "researchAgent", name: "Research Agent", description: "Pays for data APIs with conservative per-tx limits", totalBudget: 50000000, perTxCap: 2000000, periodBudget: 10000000 },
  { id: "payrollAgent", name: "Payroll Automation", description: "Scheduled payouts with strict destination allowlists", totalBudget: 500000000, perTxCap: 50000000, periodBudget: 200000000 },
  { id: "protocolOpsBot", name: "Protocol Ops Bot", description: "Protocol maintenance operations with owner oversight", totalBudget: 2000000000, perTxCap: 200000000, periodBudget: 500000000 },
];

const SDK_SNIPPETS: Record<string, string> = {
  createPolicy: `import { VajraClient } from "@vinaystwt/vajra-sdk";

const client = new VajraClient({
  rpc: "https://api.devnet.solana.com",
});

const policy = await client.createPolicy({
  totalBudget: 10_000_000_000,   // 10,000 DemoUSD
  perTxCap: 500_000_000,          // 500 DemoUSD per tx
  periodBudget: 2_500_000_000,    // 2,500 DemoUSD per period
  velocityLimit: 10,               // max 10 tx per interval
  expirySlots: 216_000,            // ~1 day
  allowedMint: DEMO_USD_MINT,
  agentKey: agentPublicKey,
  signer: ownerWallet,
});

console.log("PolicyPDA:", policy.address.toBase58());`,

  simulateSpend: `// Always simulate before spending
const sim = await client.simulateSpend({
  policy: policyAddress,
  amount: 50_000_000,   // 50 DemoUSD
  destination: merchantAta,
});

if (sim.allowed) {
  console.log("All guards pass — transfer allowed");
} else {
  console.log("Blocked:", sim.reason);
  // sim.ruleTriggered: "perTxCap" | "destination" | etc.
}`,

  executeSpend: `// Agent executes guarded transfer
const result = await client.spend({
  policy: policyAddress,
  amount: 50_000_000,
  destination: merchantAta,
  signer: agentWallet,
});

// Blocked spends return the rule that triggered
if (!result.success) {
  console.log("Blocked by:", result.ruleTriggered);
  console.log("Vault delta:", result.vaultDelta); // 0
}`,

  exportProof: `// Export proof packet after demo
const proof = await client.exportProof({
  policy: policyAddress,
  attempts: attemptSignatures,
});

// proof.blocked[0].vaultDelta === 0
// proof.blocked[0].innerTransfers === 0
fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));`,
};

const MCP_TOOLS = [
  { name: "vajra_create_policy", description: "Create a PolicyPDA with budget, cap, period, velocity, expiry, agent key", input: "VajraCreatePolicyArgs", output: "PolicyAccount" },
  { name: "vajra_get_policy", description: "Fetch current policy state including spent amount and revoke status", input: "policyAddress: string", output: "PolicyAccount" },
  { name: "vajra_simulate_spend", description: "Dry-run a transfer against all 12 guards without submitting", input: "SpendArgs", output: "SimulateResult" },
  { name: "vajra_execute_spend", description: "Execute a guarded transfer from vault to allowlisted destination", input: "SpendArgs", output: "TransactionSignature" },
  { name: "vajra_revoke_policy", description: "Owner-only: permanently disable all future transfers on this policy", input: "policyAddress: string", output: "void" },
  { name: "vajra_get_audit_trail", description: "Retrieve structured transfer history with guard outcomes", input: "policyAddress: string", output: "AuditRecord[]" },
  { name: "vajra_withdraw_funds", description: "Owner-only: recover remaining vault funds to owner token account", input: "policyAddress, destination", output: "TransactionSignature" },
  { name: "vajra_export_proof", description: "Export a signed proof packet of blocked and allowed attempts", input: "policyAddress: string", output: "ProofPacket" },
];

const X402_FLOW = `// x402-style reference flow: agent pays for protected API through Vajra

// 1. Agent requests protected API
const response = await fetch("https://api.example.com/data");

// 2. API returns 402 Payment Required
if (response.status === 402) {
  const paymentReq = await response.json();
  // { amount: 1_000_000, destination: "merchant_ata", mint: "..." }

  // 3. Agent simulates spend before paying
  const sim = await vajra.simulateSpend({
    policy: agentPolicyAddress,
    amount: paymentReq.amount,
    destination: paymentReq.destination,
  });

  if (!sim.allowed) {
    throw new Error(\`Vajra blocked: \${sim.reason}\`);
  }

  // 4. Execute through PolicyPDA vault
  const sig = await vajra.spend({
    policy: agentPolicyAddress,
    amount: paymentReq.amount,
    destination: paymentReq.destination,
    signer: agentWallet,
  });

  // 5. Retry with payment proof
  const data = await fetch("https://api.example.com/data", {
    headers: { "X-Payment-Signature": sig },
  });
}`;

// ── Animated vertical flow diagram ───────────────────────────────────────────
const MCP_FLOW_STEPS = [
  { label: "Agent Runner", icon: <Cpu size={12} />, color: "cyan" },
  { label: "MCP Server", icon: <Terminal size={12} />, color: "cyan" },
  { label: "Vajra SDK", icon: <Package size={12} />, color: "cyan" },
  { label: "Solana Program", icon: <Layers size={12} />, color: "cyan" },
  { label: "PolicyPDA Vault", icon: <Code2 size={12} />, color: "emerald" },
];

function McpFlowDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [activeStep, setActiveStep] = useState<number>(-1);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      setActiveStep(i);
      i++;
      if (i >= MCP_FLOW_STEPS.length) clearInterval(interval);
    }, 280);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col gap-0">
      {MCP_FLOW_STEPS.map((step, i) => {
        const isActive = i <= activeStep;
        const isLast = i === MCP_FLOW_STEPS.length - 1;
        const color = step.color === "emerald" ? "rgba(16,185,129,1)" : "rgba(0,229,255,1)";
        const borderColor = step.color === "emerald" ? "rgba(16,185,129,0.3)" : "rgba(0,229,255,0.25)";
        const bgColor = step.color === "emerald" ? "rgba(16,185,129,0.06)" : "rgba(0,229,255,0.05)";

        return (
          <div key={step.label} className="flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0.2, x: -6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border w-full"
              style={{
                borderColor: isActive ? borderColor : "rgba(255,255,255,0.07)",
                background: isActive ? bgColor : "rgba(14,14,14,0.5)",
              }}
            >
              <motion.span
                animate={isActive ? { color } : { color: "rgba(237,237,237,0.3)" }}
                transition={{ duration: 0.2 }}
              >
                {step.icon}
              </motion.span>
              <span
                className="text-xs font-mono"
                style={{ color: isActive ? "rgba(237,237,237,0.85)" : "rgba(237,237,237,0.4)" }}
              >
                {step.label}
              </span>
              {isActive && i === activeStep && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
              )}
            </motion.div>
            {!isLast && (
              <div className="ml-5 flex flex-col items-center gap-0 py-0.5">
                {/* Animated connector line */}
                <motion.div
                  className="w-px"
                  initial={{ height: 0, backgroundColor: "rgba(255,255,255,0.05)" }}
                  animate={
                    i < activeStep
                      ? { height: 16, backgroundColor: "rgba(0,229,255,0.35)" }
                      : { height: 16, backgroundColor: "rgba(255,255,255,0.06)" }
                  }
                  transition={{ duration: 0.25, delay: 0.1 }}
                />
                {/* Arrow */}
                <motion.svg
                  width="8" height="5" viewBox="0 0 8 5"
                  animate={i < activeStep ? { opacity: 0.5 } : { opacity: 0.15 }}
                >
                  <path d="M4 5L0 0H8L4 5Z" fill="rgba(0,229,255,0.8)" />
                </motion.svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── x402 animated step flow ───────────────────────────────────────────────────
const X402_STEPS = [
  { step: "1", label: "Agent requests paid API", active: true },
  { step: "2", label: "Service returns HTTP 402 Payment Required", active: false },
  { step: "3", label: "Agent checks Vajra policy", active: false },
  { step: "4", label: "Vajra simulation: allowed or blocked", active: false },
  { step: "5", label: "Allowed: payment executes from PolicyPDA vault", active: false },
  { step: "6", label: "Agent retries API request with payment proof", active: false },
];

function X402FlowSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const t = setInterval(() => {
      setActiveStep(i++);
      if (i >= X402_STEPS.length) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="flex flex-col gap-1">
      {X402_STEPS.map((s, i) => {
        const isActive = i <= activeStep;
        const isCurrent = i === activeStep;
        return (
          <motion.div
            key={s.step}
            className="flex gap-3"
            initial={{ opacity: 0, x: -8 }}
            animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0.25 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col items-center">
              <motion.div
                className="flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-mono shrink-0"
                animate={
                  isActive
                    ? { borderColor: "rgba(0,229,255,0.4)", color: "rgba(0,229,255,0.9)", backgroundColor: "rgba(0,229,255,0.08)" }
                    : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(237,237,237,0.3)", backgroundColor: "transparent" }
                }
                transition={{ duration: 0.2 }}
              >
                {s.step}
              </motion.div>
              {i < X402_STEPS.length - 1 && (
                <motion.div
                  className="w-px flex-1 my-0.5"
                  animate={isActive ? { backgroundColor: "rgba(0,229,255,0.2)" } : { backgroundColor: "rgba(255,255,255,0.05)" }}
                  transition={{ duration: 0.2 }}
                  style={{ minHeight: 12 }}
                />
              )}
            </div>
            <div className="flex items-start gap-2 pt-1 pb-2">
              <p className="text-sm leading-snug" style={{ color: isActive ? "rgba(237,237,237,0.8)" : "rgba(237,237,237,0.35)" }}>
                {s.label}
              </p>
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan"
                  style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function Developers() {
  const [templates, setTemplates] = useState<PolicyTemplate[]>(BUILTIN_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("x402ApiBuyer");
  const [snippets, setSnippets] = useState<Record<string, string>>(SDK_SNIPPETS);

  useEffect(() => {
    loadPolicyTemplates().then((t) => { if (t.length > 0) setTemplates(t); });
    loadSdkSnippets().then((s) => { if (Object.keys(s).length > 0) setSnippets(s); });
  }, []);

  const tabs = [
    { id: "sdk", label: "SDK", content: <SdkTab snippets={snippets} /> },
    { id: "mcp", label: "MCP", content: <McpTab /> },
    { id: "x402", label: "x402-style", content: <X402Tab /> },
    { id: "simulator", label: "Policy Builder", content: <PolicyBuilderSimulator /> },
    {
      id: "templates",
      label: "Templates",
      content: (
        <TemplatesTab templates={templates} selected={selectedTemplate} onSelect={setSelectedTemplate} />
      ),
    },
    { id: "receipts", label: "Receipts", content: <ReceiptsTab /> },
    { id: "verifier", label: "Verifier", content: <VerifierTab /> },
    { id: "mandates", label: "Agent Mandates", content: <AgentMandatesTab /> },
  ];

  return (
    <PageShell>
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col gap-5 max-w-2xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-mono uppercase tracking-[0.2em] text-cyan"
          >
            Developer Platform
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-[#EDEDED]"
          >
            Integrate guarded agent spend{" "}
            <span className="text-[rgba(237,237,237,0.38)]">in minutes.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[rgba(237,237,237,0.55)] leading-relaxed"
          >
            SDK, MCP server, x402-style reference integration, Policy Builder, and ready-to-use templates.
          </motion.p>

          {/* package status pill */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <code className="text-sm font-mono text-cyan bg-cyan/8 border border-cyan/15 px-2.5 py-1 rounded-lg">
              @vinaystwt/vajra-sdk
            </code>
            <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded border bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.1)] text-[rgba(237,237,237,0.45)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0" />
              published · v0.1.0
            </span>
          </motion.div>

          {/* Quick stat pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {[
              { icon: <FileCode2 size={10} />, label: "TypeScript-first" },
              { icon: <Package size={10} />, label: "Zero wallet adapter" },
              { icon: <Terminal size={10} />, label: "MCP-native" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-[10px] font-mono text-[rgba(237,237,237,0.5)]"
              >
                <span className="text-cyan">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Tabs ─────────────────────────────────────────────────────── */}
      <section className="pb-16">
        <DeveloperTabs tabs={tabs} />
      </section>

      {/* ─── Agent Payment Rails ──────────────────────────────────────── */}
      <section className="py-16 border-t border-[rgba(255,255,255,0.05)]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan">
              Integration Surfaces
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#EDEDED]">
              Built for agent payment rails.
            </h2>
            <p className="text-[rgba(237,237,237,0.55)] max-w-xl leading-relaxed">
              Vajra ships three integration surfaces for automated onchain agents. Each is backed by
              a devnet-verified proof and a published SDK.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                eyebrow: "Stablecoin-style Agent Spend",
                title: "DemoUSD policy vault",
                body: "Agents pay for APIs, data, and compute from a policy-governed SPL token vault. Per-tx cap, period budget, destination allowlist, and velocity limit enforced on-chain. Uses DemoUSD — a test SPL mint.",
                tag: "SDK · mandates · receipts",
                color: "cyan",
              },
              {
                eyebrow: "Autonomous Onchain Agent",
                title: "Request. Program decides.",
                body: "Agent key requests a spend. The PolicyPDA program enforces the mandate. The agent key never holds vault authority. Blocked attempts leave vault delta 0 and inner transfers 0 — verified on devnet.",
                tag: "Solana program · verifier",
                color: "emerald",
              },
              {
                eyebrow: "MCP-Native Policy Tools",
                title: "MCP server, local-ready",
                body: "Vajra MCP server exposes tools for policy simulation, mandate inspection, receipt export, and verifier calls. Runs locally. Designed for agent tooling and AI-assisted development workflows.",
                tag: "MCP · tools · local server",
                color: "cyan",
              },
            ].map((card, i) => (
              <motion.div
                key={card.eyebrow}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex flex-col gap-3 p-5 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)] transition-colors"
              >
                <span className={`text-[10px] font-mono uppercase tracking-widest ${card.color === "emerald" ? "text-emerald" : "text-cyan"}`}>
                  {card.eyebrow}
                </span>
                <h3 className="text-base font-semibold text-[rgba(237,237,237,0.9)]">{card.title}</h3>
                <p className="text-sm text-[rgba(237,237,237,0.5)] leading-relaxed flex-1">{card.body}</p>
                <span className="text-[10px] font-mono text-[rgba(237,237,237,0.3)] border border-[rgba(255,255,255,0.06)] px-2 py-1 rounded w-fit">
                  {card.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </PageShell>
  );
}

// ── Tab: SDK ──────────────────────────────────────────────────────────────────

function SdkTab({ snippets }: { snippets: Record<string, string> }) {
  const [active, setActive] = useState("createPolicy");

  const snipEntries = [
    { id: "createPolicy", label: "Create policy" },
    { id: "simulateSpend", label: "Simulate spend" },
    { id: "executeSpend", label: "Execute spend" },
    { id: "exportProof", label: "Export proof" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <SectionHeader eyebrow="SDK" title="Integrate guarded agent spend in minutes." />
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { icon: <Package size={14} />, label: "@vinaystwt/vajra-sdk · v0.1.0" },
            { icon: <ArrowRight size={12} />, label: "Zero wallet adapter needed" },
            { icon: <ArrowRight size={12} />, label: "TypeScript-first" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 text-xs text-[rgba(237,237,237,0.5)]">
              <span className="text-cyan">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-4">
        {/* Snippet nav */}
        <div className="flex flex-col gap-1">
          {snipEntries.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`relative text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer overflow-hidden ${
                active === s.id
                  ? "bg-cyan/8 border border-cyan/15 text-cyan"
                  : "text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.8)] hover:bg-white/4"
              }`}
            >
              {active === s.id && (
                <motion.div
                  layoutId="sdk-snippet-active"
                  className="absolute inset-0 bg-cyan/8 border border-cyan/15 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Snippet with animated swap */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <CodeSnippet
              code={snippets[active] ?? SDK_SNIPPETS[active] ?? "// snippet not found"}
              language="typescript"
              title={`${active}.ts`}
              maxHeight="400px"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Method reference */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          All methods
        </span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "createPolicy", "fundVault", "addDestination", "spend", "simulateSpend",
            "revokePolicy", "withdrawFunds", "getPolicy", "getAuditTrail",
            "explainError", "getExplorerUrl", "getPolicyRiskScore",
          ].map((m, i) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ borderColor: "rgba(0,229,255,0.2)", color: "rgba(0,229,255,0.8)" }}
              className="px-3 py-2 rounded-lg bg-[#0e0e0e] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[rgba(237,237,237,0.6)] transition-colors cursor-default"
            >
              {m}()
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: MCP ──────────────────────────────────────────────────────────────────

const MCP_CONVERSATION = [
  { role: "agent", text: "Can I pay this API 50 DemoUSD?" },
  { role: "mcp", lines: [
    "Checking mandate...",
    "Result: Allowed under mandate.",
    "Receipt will be generated on execution.",
  ]},
  { role: "agent", text: "Can I send 5,000 DemoUSD to an unknown wallet?" },
  { role: "mcp", lines: [
    "Blocked by policy.",
    "Rule: perTxCap (max 5 DemoUSD per transaction).",
    "Vault delta: 0. Inner transfers: 0.",
  ]},
];

function McpTab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-5">
          <SectionHeader
            eyebrow="MCP Server"
            title="An agent should simulate before it spends."
          />
          <p className="text-sm text-[rgba(237,237,237,0.55)] leading-relaxed">
            Vajra MCP server exposes SDK operations as tools. Agents using any MCP-compatible
            runtime can simulate, execute, and audit guarded transfers without writing SDK boilerplate.
          </p>

          {/* Animated flow diagram */}
          <McpFlowDiagram />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
            Available tools
          </span>
          <div className="flex flex-col gap-2">
            {MCP_TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.05, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <McpToolCard
                  name={tool.name}
                  description={tool.description}
                  input={tool.input}
                  output={tool.output}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* MCP Conversation Demo */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
      >
        <div className="px-4 py-3 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>
          <span className="text-[10px] font-mono text-[rgba(237,237,237,0.3)]">MCP Conversation Demo</span>
        </div>
        <div className="p-5 bg-[#080808] flex flex-col gap-4 font-mono text-sm">
          {MCP_CONVERSATION.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === "agent" ? -8 : 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex flex-col gap-1"
            >
              {msg.role === "agent" ? (
                <div className="flex items-start gap-2">
                  <span className="text-[rgba(237,237,237,0.35)] text-[10px] shrink-0 mt-0.5">Agent:</span>
                  <span className="text-cyan">{msg.text}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-[rgba(237,237,237,0.35)] text-[10px] shrink-0 mt-0.5">Vajra MCP:</span>
                  <div className="flex flex-col gap-0.5">
                    {msg.lines?.map((line, j) => (
                      <span
                        key={j}
                        className={
                          line.startsWith("Blocked") || line.startsWith("Rule:")
                            ? "text-[#E11D48]"
                            : line.startsWith("Result: Allowed") || line.startsWith("Receipt")
                            ? "text-[#10B981]"
                            : "text-[rgba(237,237,237,0.72)]"
                        }
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── Tab: x402-style ───────────────────────────────────────────────────────────

function X402Tab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-5">
          <SectionHeader
            eyebrow="x402-style Reference Flow"
            title="Machine-to-machine payments with spending boundaries."
          />
          <p className="text-sm text-[rgba(237,237,237,0.55)] leading-relaxed">
            Reference flow showing an API-buying agent paying through Vajra instead of receiving
            raw wallet access. Local and deterministic — does not claim production integration
            with an external x402 service.
          </p>

          {/* Animated step flow */}
          <X402FlowSteps />

          <div className="panel p-4 border-cyan/15 bg-cyan/3">
            <p className="text-xs text-[rgba(237,237,237,0.55)] leading-relaxed">
              Local reference flow. Demo runs deterministically without devnet deployment
              or real funds. See{" "}
              <code className="text-cyan font-mono text-[10px]">examples/x402-vajra</code>{" "}
              for full implementation.
            </p>
          </div>
        </div>

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <CodeSnippet
              code={X402_FLOW}
              language="typescript"
              title="x402-style-agent.ts"
              maxHeight="500px"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Tab: Receipts ─────────────────────────────────────────────────────────────

function ReceiptsTab() {
  const BLOCKED_RECEIPT = {
    receipt_id: "devnet:5yWAEdt…EqEf8",
    status: "blocked",
    rule_triggered: "perTxCap",
    vault_delta: 0,
    inner_token_transfers: 0,
    receipt_hash: "86061c55…cfb8ec",
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Receipts"
          title="Execution Receipts"
          sub="Every Vajra transfer attempt generates a receipt. Blocked receipts prove vault_delta 0."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Receipt preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-3"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
            Blocked receipt · devnet
          </span>
          <div className="rounded-2xl border border-[rgba(225,29,72,0.2)] bg-[rgba(225,29,72,0.03)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" style={{ boxShadow: "0 0 6px rgba(225,29,72,0.6)" }} />
              <span className="text-[10px] font-mono text-[rgba(237,237,237,0.3)]">receipt.json</span>
            </div>
            <div className="p-5 flex flex-col gap-3 font-mono text-sm">
              {Object.entries(BLOCKED_RECEIPT).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-[rgba(237,237,237,0.38)] text-xs">{key}</span>
                  <span className={
                    key === "status" ? "text-[#E11D48] font-semibold" :
                    key === "rule_triggered" ? "text-[#00E5FF]" :
                    key === "vault_delta" || key === "inner_token_transfers" ? "text-[#10B981] font-semibold" :
                    "text-[rgba(237,237,237,0.72)]"
                  }>
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-[rgba(237,237,237,0.4)] leading-relaxed">
            Full receipt JSON includes program logs, guard error code, vault balance before/after.
          </p>
        </motion.div>

        {/* CLI commands */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
            CLI commands
          </span>
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[rgba(255,255,255,0.1)]" />
              </div>
              <span className="text-[10px] font-mono text-[rgba(237,237,237,0.28)]">shell</span>
            </div>
            <div className="p-4 bg-[#0a0a0a] font-mono text-sm flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="text-[rgba(237,237,237,0.3)]">$</span>
                <span className="text-cyan">npm run receipt:tx -- &lt;signature&gt;</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[rgba(237,237,237,0.3)]">$</span>
                <span className="text-cyan">npm run verify:tx -- &lt;signature&gt;</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Tab: Verifier ─────────────────────────────────────────────────────────────

const VERIFIER_RESULTS = [
  {
    sig: "382Mj4Ag…DYXvAo",
    classification: "vajra_allowed",
    verified: true,
    vault_delta: "-5 DemoUSD",
    inner_transfers: 1,
    rule: null,
    note: null,
    color: "emerald" as const,
  },
  {
    sig: "5yWAEdt…EqEf8",
    classification: "vajra_blocked",
    verified: true,
    vault_delta: "0",
    inner_transfers: 0,
    rule: "perTxCap",
    note: null,
    color: "crimson" as const,
  },
  {
    sig: "wTo4fAN…ye95p3",
    classification: "not_vajra (Raw Wallet)",
    verified: true,
    vault_delta: null,
    inner_transfers: null,
    rule: null,
    note: "Expected — this is the raw wallet drain path, not Vajra-governed.",
    color: "default" as const,
  },
];

function CopyCommandPill({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-xs font-mono text-[rgba(237,237,237,0.5)] hover:text-[rgba(237,237,237,0.75)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
    >
      {copied ? <Check size={11} className="text-emerald" /> : <Terminal size={11} />}
      {copied ? "Copied" : cmd}
    </button>
  );
}

function VerifierTab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Verifier"
          title="Receipt Verifier"
          sub="Classify any Solana transaction as Vajra-governed or raw-wallet, and verify receipt integrity."
        />
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          Demo results · devnet red-team proof
        </span>
        {VERIFIER_RESULTS.map((result, i) => {
          const borderColor = result.color === "emerald"
            ? "rgba(16,185,129,0.2)"
            : result.color === "crimson"
            ? "rgba(225,29,72,0.2)"
            : "rgba(255,255,255,0.08)";
          const bgColor = result.color === "emerald"
            ? "rgba(16,185,129,0.03)"
            : result.color === "crimson"
            ? "rgba(225,29,72,0.03)"
            : "transparent";
          const classColor = result.color === "emerald"
            ? "text-[#10B981]"
            : result.color === "crimson"
            ? "text-[#E11D48]"
            : "text-[rgba(237,237,237,0.55)]";

          return (
            <motion.div
              key={result.sig}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ borderColor, backgroundColor: bgColor }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-mono text-sm text-[rgba(237,237,237,0.72)]">{result.sig}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-semibold ${classColor}`}>
                    {result.classification}
                  </span>
                  {result.verified && (
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] text-[#10B981]">
                      verified
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono">
                {result.vault_delta !== null && (
                  <span className="text-[rgba(237,237,237,0.5)]">
                    vault_delta: <span className={result.vault_delta === "0" ? "text-[#10B981]" : "text-[rgba(237,237,237,0.8)]"}>{result.vault_delta}</span>
                  </span>
                )}
                {result.inner_transfers !== null && (
                  <span className="text-[rgba(237,237,237,0.5)]">
                    inner_transfers: <span className={result.inner_transfers === 0 ? "text-[#10B981]" : "text-[rgba(237,237,237,0.8)]"}>{result.inner_transfers}</span>
                  </span>
                )}
                {result.rule && (
                  <span className="text-[rgba(237,237,237,0.5)]">
                    rule: <span className="text-[#00E5FF]">{result.rule}</span>
                  </span>
                )}
              </div>
              {result.note && (
                <p className="text-xs text-[rgba(237,237,237,0.4)] italic">{result.note}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* CLI commands */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          CLI
        </span>
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#0d0d0d] border-b border-[rgba(255,255,255,0.06)]">
            <span className="text-[10px] font-mono text-[rgba(237,237,237,0.28)]">shell</span>
          </div>
          <div className="p-4 bg-[#0a0a0a] font-mono text-sm flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="text-[rgba(237,237,237,0.3)]">$</span>
              <span className="text-cyan">npm run verify:tx -- &lt;signature&gt;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[rgba(237,237,237,0.3)]">$</span>
              <span className="text-cyan">npm run verify:red-team</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-[rgba(237,237,237,0.4)] leading-relaxed">
          Demo verifier uses committed devnet proof artifacts. Full CLI/RPC verifier in SDK.
        </p>
      </div>

      {/* Regenerate proof command */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
          Regenerate
        </span>
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]">
          <span className="text-xs font-mono text-[rgba(237,237,237,0.5)] flex-1">
            Want to regenerate this proof?
          </span>
          <CopyCommandPill cmd="npm run devnet:red-team" />
        </div>
        <p className="text-[10px] font-mono text-[rgba(237,237,237,0.3)] leading-relaxed">
          Runs devnet-red-team.mjs — deploys fresh policy, runs allowed + blocked attempts, exports proof artifacts.
          Requires funded devnet wallet.
        </p>
      </div>
    </div>
  );
}

// ── Tab: Agent Mandates ───────────────────────────────────────────────────────

const AGENT_MANDATES = [
  {
    name: "Stablecoin Agent Mandate",
    target_user: "Operators giving bots a bounded DemoUSD allowance",
    per_tx_cap: "5 DemoUSD",
    use_case: "General-purpose agent with conservative spend limits",
  },
  {
    name: "API Buyer Mandate",
    target_user: "Agents buying protected API access",
    per_tx_cap: "2 DemoUSD",
    use_case: "Fine-grained micro-payments for data and compute APIs",
  },
  {
    name: "DeFi Bot Mandate",
    target_user: "Automated treasury bots",
    per_tx_cap: "50 DemoUSD",
    use_case: "Treasury operations with per-tx enforcement",
  },
  {
    name: "DAO Ops Mandate",
    target_user: "DAO recurring payouts",
    per_tx_cap: "25 DemoUSD",
    use_case: "Scheduled disbursements with destination allowlists",
  },
  {
    name: "Market Maker Mandate",
    target_user: "High-frequency signers",
    per_tx_cap: "100 DemoUSD",
    use_case: "High-frequency trading within velocity and cap bounds",
  },
  {
    name: "Payroll/Ops Mandate",
    target_user: "Scheduled payout ops",
    per_tx_cap: "250 DemoUSD",
    use_case: "Large periodic payments with strict destination allowlisting",
  },
];

function AgentMandatesTab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SectionHeader
          eyebrow="Agent Mandates"
          title="Agent Mandates"
          sub="Pre-built policy configurations for common autonomous agent use cases."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {AGENT_MANDATES.map((mandate, i) => (
          <motion.div
            key={mandate.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="panel p-4 flex flex-col gap-3 hover:border-cyan/15 transition-colors duration-300 cursor-default"
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[rgba(237,237,237,0.9)]">{mandate.name}</span>
              <span className="text-[11px] text-[rgba(237,237,237,0.42)] leading-snug">{mandate.target_user}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[rgba(237,237,237,0.3)]">per-tx cap</span>
                <span className="text-lg font-mono font-semibold text-cyan">{mandate.per_tx_cap}</span>
              </div>
            </div>
            <p className="text-[11px] text-[rgba(237,237,237,0.45)] leading-snug truncate">{mandate.use_case}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Templates ────────────────────────────────────────────────────────────

function TemplatesTab({
  templates,
  selected,
  onSelect,
}: {
  templates: PolicyTemplate[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const selectedTemplate = templates.find((t) => t.id === selected) ?? templates[0];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        eyebrow="Policy Templates"
        title="Start from a proven configuration."
        sub="Pick a template as a starting point for the Policy Builder simulator."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {templates.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <TemplateCard
              template={t}
              selected={selected === t.id}
              onSelect={() => onSelect(t.id)}
            />
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedTemplate && (
          <motion.div
            key={selectedTemplate.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 mt-2"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
              Selected: {selectedTemplate.name}
            </span>
            <CodeSnippet
              code={`// ${selectedTemplate.name}
import { templates } from "@vinaystwt/vajra-sdk";

const policy = await client.createPolicy({
  ...templates.${selectedTemplate.id},
  agentKey: agentPublicKey,
  signer: ownerWallet,
});`}
              language="typescript"
            />
            <Link to="/attack-lab">
              <Button variant="outline" size="sm">
                Try in Attack Lab
                <ArrowRight size={13} />
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
