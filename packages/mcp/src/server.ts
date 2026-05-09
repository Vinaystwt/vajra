#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { runTool } from "./tools.js";

const server = new McpServer({
  name: "vajra-mcp",
  version: "0.1.0",
});

function content(result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

server.tool(
  "vajra_create_policy",
  "Create a Vajra policy account.",
  async (args) => content(await runTool("vajra_create_policy", args)),
);
server.tool("vajra_get_policy", "Fetch a Vajra policy account.", async (args) =>
  content(await runTool("vajra_get_policy", args)),
);
server.tool("vajra_simulate_spend", "Simulate a guarded spend.", async (args) =>
  content(await runTool("vajra_simulate_spend", args)),
);
server.tool("vajra_execute_spend", "Execute a guarded spend.", async (args) =>
  content(await runTool("vajra_execute_spend", args)),
);
server.tool("vajra_revoke_policy", "Revoke a Vajra policy.", async (args) =>
  content(await runTool("vajra_revoke_policy", args)),
);
server.tool(
  "vajra_get_audit_trail",
  "Fetch recent signatures for a policy.",
  async (args) => content(await runTool("vajra_get_audit_trail", args)),
);
server.tool(
  "vajra_withdraw_funds",
  "Withdraw funds to the policy owner token account.",
  async (args) => content(await runTool("vajra_withdraw_funds", args)),
);
server.tool(
  "vajra_export_proof",
  "Export audit data for proof tooling.",
  async (args) => content(await runTool("vajra_export_proof", args)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
