import { loadProofPacket, writeProofPacket } from "./proof-utils";

async function main() {
  const input = process.argv[2];
  const basename = process.argv[3] ?? "exported-proof";
  const packet = loadProofPacket(input);
  const paths = writeProofPacket(packet, basename);
  console.log("Exported proof artifacts:");
  console.log(paths);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
