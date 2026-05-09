import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { VajraClient, policyTemplates } from "../src/index.js";

async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC ?? "http://127.0.0.1:8899",
    "confirmed",
  );
  const owner = Keypair.generate();
  const delegatedSigner = Keypair.generate().publicKey;
  const allowedMint = new PublicKey(
    "So11111111111111111111111111111111111111112",
  );
  const slot = await connection.getSlot();
  const template = policyTemplates.x402ApiBuyer;

  const client = new VajraClient({
    connection,
    wallet: owner,
    cluster: "localnet",
  });

  console.log("Example policy input", {
    delegatedSigner: delegatedSigner.toBase58(),
    allowedMint: allowedMint.toBase58(),
    expirySlot: slot + 100_000,
    ...template.fields,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
