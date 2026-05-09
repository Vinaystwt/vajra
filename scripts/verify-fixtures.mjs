import { verifyVajraPaymentFixture } from "../packages/sdk/dist/src/verify.js";
import { fixtures } from "./proof-fixtures.mjs";

const checks = [
  ["allowed", verifyVajraPaymentFixture(fixtures.allowed)],
  ["blocked", verifyVajraPaymentFixture(fixtures.blocked)],
  ["rawDrain", verifyVajraPaymentFixture(fixtures.rawDrain)],
  ["not_vajra", verifyVajraPaymentFixture(fixtures.nonVajra)],
  [
    "wrong_destination",
    verifyVajraPaymentFixture(fixtures.allowed, {
      expectedDestination: "WrongDestination111111111111111111111111111",
    }),
  ],
];

for (const [name, result] of checks) {
  console.log(`${name}: ${result.classification} verified=${result.verified}`);
}

if (checks[0][1].classification !== "vajra_allowed") {
  throw new Error("Allowed fixture was not classified as vajra_allowed.");
}
if (checks[1][1].classification !== "vajra_blocked") {
  throw new Error("Blocked fixture was not classified as vajra_blocked.");
}
if (checks[2][1].classification !== "not_vajra") {
  throw new Error("Raw drain fixture must not be classified as Vajra.");
}
if (checks[3][1].classification !== "not_vajra") {
  throw new Error("Non-Vajra fixture was not classified as not_vajra.");
}
if (checks[4][1].verified !== false) {
  throw new Error("Wrong expected destination should fail verification.");
}

console.log("Fixture verification passed.");
