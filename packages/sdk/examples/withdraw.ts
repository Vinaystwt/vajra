import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { VajraClient } from "../src/index.js";

async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC ?? "http://127.0.0.1:8899",
    "confirmed",
  );
  const owner = Keypair.generate();
  const client = new VajraClient({
    connection,
    wallet: owner,
    cluster: "localnet",
  });

  const withdrawal = await client.withdrawFunds({
    policy: new PublicKey(
      process.env.VAJRA_POLICY ?? PublicKey.default.toBase58(),
    ),
    mint: new PublicKey(process.env.VAJRA_MINT ?? PublicKey.default.toBase58()),
    destinationTokenAccount: new PublicKey(
      process.env.VAJRA_OWNER_TOKEN_ACCOUNT ?? PublicKey.default.toBase58(),
    ),
    amount: process.env.VAJRA_AMOUNT ?? "1000000",
  });

  console.log(withdrawal);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
