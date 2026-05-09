import { listMandates } from "../packages/sdk/dist/src/mandates.js";

console.log(JSON.stringify(listMandates(), null, 2));
