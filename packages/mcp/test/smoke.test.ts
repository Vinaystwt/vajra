import { toolNames, toolSchemas } from "../src/tools.js";

for (const name of [
  "vajra_get_policy",
  "vajra_simulate_spend",
  "vajra_execute_spend",
  "vajra_execute_guarded_spend",
  "vajra_revoke_policy",
  "vajra_get_audit_trail",
  "vajra_list_mandates",
  "vajra_get_mandate",
  "vajra_verify_payment",
  "vajra_export_receipt",
  "vajra_run_red_team_fixture",
]) {
  if (!toolNames.includes(name as any)) {
    throw new Error(`Missing required tool ${name}`);
  }
}

for (const name of toolNames) {
  if (!(name in toolSchemas)) {
    throw new Error(`Missing schema for ${name}`);
  }
}

const { runTool } = await import("../src/tools.js");
const mandates = await runTool("vajra_list_mandates", {});
if (!(mandates as any).mandates?.length) {
  throw new Error("Expected mandate list tool to return mandates.");
}
const stablecoin = await runTool("vajra_get_mandate", {
  id: "stablecoin-agent",
});
if (!(stablecoin as any).mandate) {
  throw new Error("Expected stablecoin-agent mandate.");
}
const redTeam = await runTool("vajra_run_red_team_fixture", {});
if (!(redTeam as any).blocked) {
  throw new Error("Expected red team fixture receipt.");
}
const verified = await runTool("vajra_verify_payment", {
  signature: "ignored",
  fixture: "blocked",
});
if ((verified as any).classification !== "vajra_blocked") {
  throw new Error(
    "Expected fixture verifier to classify blocked Vajra payment.",
  );
}
const exported = await runTool("vajra_export_receipt", {
  signature: "ignored",
  fixture: "allowed",
});
if (!(exported as any).markdown?.includes("Vajra Execution Receipt")) {
  throw new Error("Expected receipt export markdown.");
}

console.log(`MCP smoke test passed with ${toolNames.length} tools.`);
