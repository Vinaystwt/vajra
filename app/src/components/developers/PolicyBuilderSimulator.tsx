import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ShieldCheck, ShieldX } from "lucide-react";
import { Button } from "../ui/Button";
import { CodeSnippet } from "../ui/CodeSnippet";
import { cn } from "../../lib/utils";

interface SimConfig {
  totalBudget: number;
  perTxCap: number;
  periodBudget: number;
  velocityLimit: number;
  expirySlots: number;
  destination: string;
}

interface SimResult {
  passed: boolean;
  rule?: string;
  message: string;
}

function simulate(config: SimConfig, testAmount: number, testDest: string): SimResult {
  if (testAmount <= 0) return { passed: false, rule: "AmountZero", message: "Amount must be > 0" };
  if (testAmount > config.perTxCap) return { passed: false, rule: "PerTxCapExceeded", message: `${testAmount} exceeds per-tx cap of ${config.perTxCap}` };
  if (testAmount > config.totalBudget) return { passed: false, rule: "TotalBudgetExceeded", message: "Amount exceeds total budget" };
  if (testAmount > config.periodBudget) return { passed: false, rule: "PeriodBudgetExceeded", message: "Amount exceeds period budget" };
  if (config.destination && testDest !== config.destination) return { passed: false, rule: "DestinationNotAllowed", message: "Destination not on allowlist" };
  return { passed: true, message: "All policy checks passed — transfer would be allowed" };
}

function buildSnippet(config: SimConfig): string {
  return `import { VajraClient } from "@vinaystwt/vajra-sdk";

const client = new VajraClient({ rpc: "https://api.devnet.solana.com" });

const policy = await client.createPolicy({
  totalBudget: ${config.totalBudget * 1_000_000},   // ${config.totalBudget} DemoUSD
  perTxCap: ${config.perTxCap * 1_000_000},         // ${config.perTxCap} DemoUSD
  periodBudget: ${config.periodBudget * 1_000_000}, // ${config.periodBudget} DemoUSD
  velocityLimit: ${config.velocityLimit},
  expirySlots: ${config.expirySlots},
  allowedMint: DEMO_USD_MINT,
  agentKey: agentPublicKey,
  signer: ownerWallet,
});

// Simulate before spending
const sim = await client.simulateSpend({
  policy: policy.address,
  amount: AMOUNT,
  destination: DEST_ATA,
});

if (sim.allowed) {
  await client.spend({ policy: policy.address, amount: AMOUNT, destination: DEST_ATA, signer: agentWallet });
}`;
}

export function PolicyBuilderSimulator() {
  const [config, setConfig] = useState<SimConfig>({
    totalBudget: 10000,
    perTxCap: 500,
    periodBudget: 2000,
    velocityLimit: 10,
    expirySlots: 216000,
    destination: "merchant_a",
  });
  const [testAmount, setTestAmount] = useState(100);
  const [testDest, setTestDest] = useState("merchant_a");
  const [result, setResult] = useState<SimResult | null>(null);

  const run = () => setResult(simulate(config, testAmount, testDest));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — config */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[rgba(237,237,237,0.8)]">Policy parameters</h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total budget", key: "totalBudget", unit: "DemoUSD" },
            { label: "Per-tx cap", key: "perTxCap", unit: "DemoUSD" },
            { label: "Period budget", key: "periodBudget", unit: "DemoUSD" },
            { label: "Velocity limit", key: "velocityLimit", unit: "/min" },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.35)]">
                {f.label}
              </label>
              <div className="flex items-center gap-1.5 panel rounded-lg px-3 py-2">
                <input
                  type="number"
                  value={(config as unknown as Record<string, number>)[f.key]}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, [f.key]: Number(e.target.value) }))
                  }
                  className="flex-1 bg-transparent text-sm font-mono text-[rgba(237,237,237,0.8)] outline-none w-0"
                />
                <span className="text-xs font-mono text-[rgba(237,237,237,0.3)] shrink-0">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Destination input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[rgba(237,237,237,0.35)]">
            Allowed destination
          </label>
          <input
            type="text"
            value={config.destination}
            onChange={(e) => setConfig((c) => ({ ...c, destination: e.target.value }))}
            placeholder="merchant_a"
            className="panel rounded-lg px-3 py-2 text-sm font-mono text-[rgba(237,237,237,0.8)] outline-none bg-transparent"
          />
        </div>

        {/* Test inputs */}
        <div className="border-t border-[rgba(255,255,255,0.07)] pt-4 flex flex-col gap-3">
          <span className="text-xs font-mono uppercase tracking-widest text-[rgba(237,237,237,0.3)]">
            Test spend
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[rgba(237,237,237,0.35)]">Amount</label>
              <input
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="panel rounded-lg px-3 py-2 text-sm font-mono text-[rgba(237,237,237,0.8)] outline-none bg-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[rgba(237,237,237,0.35)]">Destination</label>
              <input
                type="text"
                value={testDest}
                onChange={(e) => setTestDest(e.target.value)}
                className="panel rounded-lg px-3 py-2 text-sm font-mono text-[rgba(237,237,237,0.8)] outline-none bg-transparent"
              />
            </div>
          </div>

          <Button variant="primary" size="md" onClick={run}>
            <Play size={14} />
            Simulate
          </Button>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border",
                  result.passed
                    ? "bg-emerald/8 border-emerald/20"
                    : "bg-crimson/8 border-crimson/20"
                )}
              >
                {result.passed ? (
                  <ShieldCheck size={16} className="text-emerald mt-0.5 shrink-0" />
                ) : (
                  <ShieldX size={16} className="text-crimson mt-0.5 shrink-0" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className={cn("text-sm font-medium", result.passed ? "text-emerald" : "text-crimson")}>
                    {result.passed ? "Allowed" : "Blocked"}
                  </span>
                  <span className="text-xs text-[rgba(237,237,237,0.55)]">{result.message}</span>
                  {result.rule && (
                    <span className="text-[10px] font-mono text-[rgba(237,237,237,0.35)]">Rule: {result.rule}</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — generated code */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[rgba(237,237,237,0.8)]">Generated SDK code</h3>
        <CodeSnippet
          code={buildSnippet(config)}
          language="typescript"
          title="policy-setup.ts"
          maxHeight="420px"
        />
      </div>
    </div>
  );
}
