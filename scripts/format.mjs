import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";

const mode = process.argv.includes("--check") ? "check" : "write";
const root = process.cwd();
const roots = [
  ".",
  "scripts",
  "packages/sdk/src",
  "packages/sdk/test",
  "packages/mcp/src",
  "packages/mcp/test",
  "examples",
  "app/public",
  "proofs/latest",
  "mandates",
];
const skip = new Set([
  ".git",
  "node_modules",
  "dist",
  "target",
  "app",
  "demo-keypairs",
  "proofs/devnet-proof.json",
]);
const exts = new Set([".js", ".mjs", ".ts", ".json", ".md", ".csv"]);

function walk(dir, out = []) {
  const base = path.basename(dir);
  if (skip.has(base)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const relative = path.relative(root, full);
    if (relative.includes("node_modules") || relative.includes("/dist/"))
      continue;
    const stats = statSync(full);
    if (skip.has(path.basename(full))) continue;
    if (stats.isDirectory()) {
      walk(full, out);
    } else if (exts.has(path.extname(full))) {
      out.push(full);
    }
  }
  return out;
}

const files = [
  ...new Set(roots.flatMap((item) => walk(path.join(root, item)))),
];
const config = (await resolveConfig(root)) ?? {};
const changed = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const ext = path.extname(file);
  const parser =
    ext === ".md"
      ? "markdown"
      : ext === ".json"
        ? "json"
        : ext === ".csv"
          ? undefined
          : ext === ".ts"
            ? "typescript"
            : "babel";
  if (!parser) continue;
  const formatted = await format(text, { ...config, filepath: file, parser });
  if (formatted !== text) {
    changed.push(path.relative(root, file));
    if (mode === "write") writeFileSync(file, formatted);
  }
}

if (changed.length) {
  console.log(changed.join("\n"));
  if (mode === "check") process.exit(1);
}
