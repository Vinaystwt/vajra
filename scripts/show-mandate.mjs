import {
  getMandate,
  mandateToPolicyConfig,
} from "../packages/sdk/dist/src/mandates.js";

const id = process.argv[2] ?? "stablecoin-agent";
const mandate = getMandate(id);
if (!mandate) {
  console.error(`Unknown mandate: ${id}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      mandate,
      policy_config: mandateToPolicyConfig(mandate),
    },
    null,
    2,
  ),
);
