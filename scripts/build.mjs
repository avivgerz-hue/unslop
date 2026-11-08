import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const entrypoint = resolve(dist, "bin/unslop.js");
const requiredArtifacts = [
  entrypoint,
  resolve(dist, "src/version.js"),
  resolve(dist, "src/mcp/server.js"),
  resolve(dist, "src/presets/index.js"),
  resolve(dist, "src/analyzer/design-craft.js"),
  resolve(dist, "src/analyzer/refactor-plan.js"),
];
const requiredPresets = [
  "swiss-editorial",
  "linear-precision",
  "stripe-atmospheric",
  "vercel-monochrome",
  "teenage-engineering",
  "anthropic-warm-editorial",
  "bloomberg-terminal-dense",
  "raycast-command",
  "fintech-institutional",
  "neo-brutalist-craft",
  // v1 compatibility IDs remain part of the production artifact.
  "linear-dark",
  "swiss-grid",
  "stripe-minimal",
  "apple-glass",
  "neo-brutalist",
];
const localTypeScript = resolve(root, "node_modules/typescript/bin/tsc");

function hasCommittedBuild() {
  return requiredArtifacts.every((artifact) => existsSync(artifact)) &&
    requiredPresets.every((name) => existsSync(resolve(dist, `src/presets/${name}.json`)));
}

function fail(message) {
  console.error(`unslop build: ${message}`);
  process.exit(1);
}

// GitHub installs run `prepare` with devDependencies omitted. In that case the
// committed distribution is the product, not an invitation to download a compiler.
if (!existsSync(localTypeScript)) {
  if (hasCommittedBuild()) {
    console.log("unslop build: TypeScript is not installed; using committed dist/.");
    process.exit(0);
  }
  fail("TypeScript is unavailable and the committed dist/ artifacts are incomplete. Run npm install, then npm run build.");
}

rmSync(dist, { recursive: true, force: true });
const compilation = spawnSync(process.execPath, [localTypeScript, "-p", "tsconfig.json"], {
  cwd: root,
  stdio: "inherit",
});
if (compilation.error) fail(compilation.error.message);
if (compilation.status !== 0) process.exit(compilation.status ?? 1);

const presetSource = resolve(root, "src/presets");
const presetDestination = resolve(dist, "src/presets");
mkdirSync(presetDestination, { recursive: true });
for (const filename of readdirSync(presetSource)) {
  if (filename.endsWith(".json")) {
    copyFileSync(resolve(presetSource, filename), resolve(presetDestination, filename));
  }
}
chmodSync(entrypoint, 0o755);

if (!hasCommittedBuild()) {
  fail("the compiler completed without producing every required runtime artifact.");
}
