import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  AI_COPY_CLICHES,
  analyzeSource,
  DESIGN_CRAFT_RULE_COUNT,
  DESIGN_CRAFT_RULES,
  DESIGN_PILLARS,
  calculateDesignCraftScore,
  calculatePillarScores,
  contrastRatio,
  relativeLuminance,
} from "../src/analyzer/slop-detector.js";
import {
  createRefactorPlan,
  DEFAULT_REFACTOR_REPORT,
  writeRefactorReport,
} from "../src/analyzer/refactor-plan.js";
import { createPresetFromDNA, extractDesignDNA } from "../src/extractor/extract-dna.js";
import { UnslopMCPServer } from "../src/mcp/server.js";
import {
  LEGACY_PRESET_NAMES,
  listPresets,
  loadPreset,
  PRESET_NAMES,
  validatePreset,
} from "../src/presets/index.js";
import {
  exportDesignTokens,
  renderCSSCustomProperties,
  renderTailwindV3Config,
  renderTailwindV4Theme,
  renderW3CDesignTokens,
} from "../src/sync/token-exporter.js";
import { installUnslop } from "../src/sync/rule-writer.js";
import { UNSLOP_VERSION } from "../src/version.js";
import { CLI_VERSION, runCli } from "../bin/unslop.js";
import manifest from "../package.json" with { type: "json" };

const temporaryDirectories: string[] = [];
async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "unslop-v2-test-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function ids(source: string, file = "fixture.tsx"): string[] {
  return analyzeSource(source, file).map((violation) => violation.ruleId);
}

function expectRules(source: string, expected: string[]): void {
  expect(ids(source)).toEqual(expect.arrayContaining(expected));
}

async function invoke(args: string[], cwd?: string) {
  let stdout = "";
  let stderr = "";
  const code = await runCli(args, {
    ...(cwd ? { cwd } : {}),
    stdout: (message) => { stdout += `${message}\n`; },
    stderr: (message) => { stderr += `${message}\n`; },
  });
  return { code, stdout, stderr };
}

describe("v2 runtime and 7-pillar rule catalog", () => {
  it("reads CLI and MCP versions from package.json without drift", async () => {
    expect(manifest.version).toBe("2.1.0");
    expect(UNSLOP_VERSION).toBe(manifest.version);
    expect(CLI_VERSION).toBe(manifest.version);
    expect((await invoke(["--version"])).stdout.trim()).toBe("2.1.0");
    expect(manifest.bin).toEqual({
      unslop: "dist/bin/unslop.js",
      "unslop-mcp": "dist/bin/unslop.js",
    });
    const server = new UnslopMCPServer();
    const initialized = await server.handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    expect(initialized?.result).toMatchObject({ serverInfo: { version: manifest.version } });
  });

  it("registers 72 unique rules across exactly seven pillars and 50+ copy clichés", () => {
    expect(DESIGN_CRAFT_RULE_COUNT).toBeGreaterThanOrEqual(60);
    expect(DESIGN_CRAFT_RULE_COUNT).toBe(72);
    expect(DESIGN_PILLARS).toHaveLength(7);
    expect(new Set(DESIGN_CRAFT_RULES.map((rule) => rule.id)).size).toBe(DESIGN_CRAFT_RULE_COUNT);
    for (const pillar of DESIGN_PILLARS) {
      expect(DESIGN_CRAFT_RULES.some((rule) => rule.id.startsWith(pillar.code))).toBe(true);
    }
    expect(AI_COPY_CLICHES.length).toBeGreaterThanOrEqual(50);
  });

  it("scores every pillar independently and returns an overall 0–100 craft score", () => {
    const violations = analyzeSource(`<button className="transition-all p-1">Go</button>`);
    const pillars = calculatePillarScores(violations);
    expect(pillars).toHaveLength(7);
    expect(pillars.find((pillar) => pillar.id === "ux")?.score).toBeLessThan(100);
    expect(pillars.find((pillar) => pillar.id === "copy")?.score).toBe(100);
    const score = calculateDesignCraftScore(violations);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(100);
  });
});

describe("Pillar 1 · color, polarity, and contrast", () => {
  it("detects cliché gradients, hardcoded values, harsh polarity, and gradient text", () => {
    expectRules(`
      <section className="from-purple-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
        <span style="color:#000000;background:#ffffff">Absolute</span>
      </section>`, ["SLOP-COLOR-001", "SLOP-COLOR-003", "SLOP-COLOR-008", "SLOP-COLOR-010", "SLOP-TOKEN-001"]);
  });

  it("performs WCAG AA/AAA, muddy-gray, and APCA-inspired perceptual checks", () => {
    expectRules(`<p style="color:#999999;background:#ffffff;font-size:16px">Muted body copy</p>`, [
      "SLOP-COLOR-004", "SLOP-COLOR-005", "SLOP-COLOR-007",
    ]);
    expectRules(`<p style="color:#666666;background:#ffffff;font-size:16px">AA but not AAA</p>`, [
      "SLOP-COLOR-006",
    ]);
    expectRules(`<p className="text-black bg-white">Absolute utility polarity</p>`, ["SLOP-COLOR-003"]);
    expectRules(`p { color: #999999; background: #ffffff; font-size: 16px; }`, ["SLOP-COLOR-007"]);
  });
});

describe("Pillar 2 · typography and scannable hierarchy", () => {
  it("detects fixed display type, monotonous weights, measure, leading, numeric, and label issues", () => {
    expectRules(`<main className="mx-auto max-w-6xl">
      <h1 className="text-6xl font-bold leading-loose">Fixed display</h1>
      <h2 className="text-3xl font-bold">Same weight</h2>
      <p className="w-full leading-none">A long reading column without a deliberate measure.</p>
      <span>42,001</span><label className="uppercase">Status</label>
    </main>`, [
      "SLOP-TYPE-001", "SLOP-TYPE-002", "SLOP-TYPE-003", "SLOP-TYPE-004",
      "SLOP-TYPE-005", "SLOP-TYPE-006", "SLOP-TYPE-010",
    ]);
  });
});

describe("Pillar 3 · layout, rhythm, and grid craft", () => {
  it("detects the canonical three-card AI clone, off-grid spacing, and excessive rounding", () => {
    expectRules(`<main className="grid grid-cols-3 gap-[13px] text-center">
      <article className="rounded-2xl shadow-xl text-center"><h3>One</h3></article>
      <article className="rounded-2xl shadow-xl text-center"><h3>Two</h3></article>
      <article className="rounded-2xl shadow-xl text-center"><h3>Three</h3></article>
      <section className="rounded-3xl">Bubble</section>
    </main>`, ["SLOP-LAYOUT-001", "SLOP-LAYOUT-003", "SLOP-LAYOUT-004", "SLOP-LAYOUT-005", "SLOP-LAYOUT-007"]);
  });

  it("detects three nested card boundaries", () => {
    expectRules(`<div className="card rounded-xl shadow-xl"><div className="card rounded-xl shadow-xl"><div className="card rounded-xl shadow-xl">Deep</div></div></div>`, [
      "SLOP-LAYOUT-002",
    ]);
  });
});

describe("Pillar 4 · visual restraint and elevation", () => {
  it("detects glass overuse, dark heavy shadows, decorative blobs, and badge clutter", () => {
    expectRules(`<main className="mx-auto max-w-6xl bg-slate-950 shadow-2xl">
      <div className="backdrop-blur-xl">One</div><div className="backdrop-blur-md">Two</div>
      <div className="blur-3xl opacity-30"></div>
      <span className="rounded-full">A</span><span className="rounded-full">B</span>
      <span className="rounded-full">C</span><span className="rounded-full">D</span>
    </main>`, ["SLOP-SURFACE-001", "SLOP-SURFACE-002", "SLOP-SURFACE-003", "SLOP-SURFACE-004"]);
  });
});

describe("Pillar 5 · copywriting and microcopy", () => {
  it("detects cliché families, emoji spam, superlatives, and filler with concrete replacements", () => {
    const violations = analyzeSource(`<section>
      <h1>Unleash the power of our next-generation, game-changing platform</h1>
      <p>Supercharge your workflow with seamless integration. Dive into limitless possibilities.</p>
      <p>Welcome to the world-class future 🚀 ✨ ⚡ 🔥 💡</p>
    </section>`);
    const rules = violations.map((violation) => violation.ruleId);
    expect(rules).toEqual(expect.arrayContaining([
      "SLOP-COPY-001", "SLOP-COPY-003", "SLOP-COPY-004", "SLOP-COPY-005",
      "SLOP-COPY-007", "SLOP-COPY-008", "SLOP-COPY-009", "SLOP-COPY-011", "SLOP-COPY-012",
    ]));
    expect(violations.find((violation) => violation.ruleId === "SLOP-COPY-001")?.recommendation).toContain("Suggested direction");
  });
});

describe("Pillar 6 · interaction, motion, and states", () => {
  it("audits semantics, keyboard behavior, every visual state, motion, labels, targets, and tabindex", () => {
    expectRules(`<main className="mx-auto max-w-6xl">
      <div onClick={save}>Save</div><div role="button" onClick={save}>Custom</div>
      <button className="transition-all p-1">Go</button>
      <input type="text" /><select><option>One</option></select>
      <a href="/" tabIndex={2}>Link</a>
    </main>`, [
      "SLOP-UX-001", "SLOP-UX-002", "SLOP-UX-003", "SLOP-UX-004", "SLOP-UX-005",
      "SLOP-UX-006", "SLOP-UX-007", "SLOP-UX-008", "SLOP-UX-009", "SLOP-UX-010",
      "SLOP-UX-011", "SLOP-UX-012",
    ]);
  });
});

describe("Pillar 7 · theme parity and token architecture", () => {
  it("detects asymmetric dark overrides, broken elevation, missing companions, and malformed tokens", () => {
    expectRules(`:root {
      --surface-0: #ffffff;
      --surface-1: #111111;
      --surface-elevated: #eeeeee;
      --space-card: 13px;
      --foo: 4px;
      --color-gap: 12px;
    }
    .card { color: #777777; background: #eeeeee; }
    .dark .card { color: #777777; background: #111111; }
    <div className="dark:bg-[#111111]">Dark only</div>`, [
      "SLOP-TOKEN-001", "SLOP-TOKEN-002", "SLOP-TOKEN-003", "SLOP-TOKEN-004",
      "SLOP-TOKEN-005", "SLOP-TOKEN-006", "SLOP-TOKEN-007", "SLOP-TOKEN-008",
    ], );
  });
});

describe("10 studio archetypes and multi-format exports", () => {
  it("loads ten complete canonical systems and keeps all five legacy IDs compatible", async () => {
    expect(PRESET_NAMES).toHaveLength(10);
    expect(LEGACY_PRESET_NAMES).toHaveLength(5);
    for (const preset of listPresets()) {
      expect(validatePreset(preset)).toEqual(preset);
      expect(preset.rules.length).toBeGreaterThanOrEqual(10);
      expect(preset.tokens.colors.interactive).toBeTruthy();
      expect(preset.tokens.typography.scale).toBeDefined();
      if (preset.tokens.colorScheme === "light") expect(preset.tokens.darkColors).toBeDefined();
      const themes = [preset.tokens.colors, ...(preset.tokens.darkColors ? [preset.tokens.darkColors] : [])];
      for (const colors of themes) {
        expect(contrastRatio(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors.textMuted, colors.background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(colors.accentText, colors.accent)).toBeGreaterThanOrEqual(4.5);
        const firstStep = relativeLuminance(colors.surface) - relativeLuminance(colors.background);
        const secondStep = relativeLuminance(colors.surfaceElevated) - relativeLuminance(colors.surface);
        expect(Math.sign(firstStep)).toBe(Math.sign(secondStep));
      }
      const result = await installUnslop({ cwd: await temporaryDirectory(), preset: preset.name });
      expect(result.preset).toBe(preset.name);
      expect(result.files).toHaveLength(15);
    }
    for (const legacy of LEGACY_PRESET_NAMES) expect(loadPreset(legacy).name).toBe(legacy);
  });

  it("exports every preset as Tailwind v4, Tailwind v3, pure CSS, and typed W3C JSON", () => {
    for (const preset of listPresets()) {
      const v4 = exportDesignTokens(preset, "tailwind-v4");
      const v3 = exportDesignTokens(preset, "tailwind-v3");
      const css = exportDesignTokens(preset, "css");
      const w3c = exportDesignTokens(preset, "w3c-json");
      expect(v4).toContain("@theme {");
      expect(v4).toContain(":root {");
      expect(v4).toContain("--color-interactive:");
      expect(v4).toContain("--color-focus:");
      expect(v3).toContain("theme");
      expect(v3).toContain("extend");
      expect(v3).toContain("fontFamily");
      expect(css).toContain(":root {");
      expect(css).toContain(".dark {");
      expect(css).not.toContain("@theme");
      const tokens = JSON.parse(w3c);
      expect(tokens.color.light["surface-0"].$type).toBe("color");
      expect(tokens.color.dark["surface-0"].$value).toBeTruthy();
      expect(tokens.spacing.base).toMatchObject({ $type: "dimension", $value: "4px" });
      expect(tokens.motion.duration.$type).toBe("duration");
    }
  });

  it("exports extracted DNA through the same four renderers", async () => {
    const directory = await temporaryDirectory();
    const source = join(directory, "reference.css");
    await writeFile(source, `:root { --color-bg:#f5f1e8; --color-surface:#ffffff; --color-text:#292724; --color-accent:#a54d2e; --color-border:#d8cfc1; --font-sans:Georgia,serif; --space-4:16px; --radius-card:8px; }`);
    const dna = await extractDesignDNA(source);
    const preset = createPresetFromDNA(dna, "reference-dna");
    expect(renderTailwindV4Theme(preset)).toContain("@theme");
    expect(renderTailwindV3Config(preset)).toContain("export default");
    expect(renderCSSCustomProperties(preset)).toContain("--surface-0");
    expect(JSON.parse(renderW3CDesignTokens(preset)).$description).toContain("reference-dna");
  });
});

describe("Design Transformation Blueprint", () => {
  it("creates a rich scorecard, exact translations, and prioritized file:line steps", async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, "Hero.tsx"), `<section className="from-purple-500 shadow-xl rounded-3xl p-[13px]">
      <h1>Unleash the power</h1><button className="transition-all">Go</button>
    </section>`);
    const plan = await createRefactorPlan("Hero.tsx", { cwd: directory, preset: "linear-precision" });
    expect(plan.designCraftScore).toBeLessThan(100);
    expect(plan.pillarScores).toHaveLength(7);
    expect(plan.translations.length).toBeGreaterThanOrEqual(5);
    expect(plan.translations.some((entry) => entry.after.includes("var(--surface-1)"))).toBe(true);
    expect(plan.translations.some((entry) => entry.after.includes("var(--spacing-12)"))).toBe(true);
    expect(plan.translations.some((entry) => entry.after.includes("transition-colors"))).toBe(true);
    expect(plan.steps.some((entry) => entry.priority === "P0" && entry.file === "Hero.tsx")).toBe(true);
    expect(plan.markdown).toContain("# Design Transformation Blueprint");
    expect(plan.markdown).toContain("## 7-Pillar Scorecard");
    expect(plan.markdown).toContain("## Before → After Class & Token Translation");
    expect(plan.markdown).toContain("## Prioritized Transformation Steps");
    await writeRefactorReport(plan, DEFAULT_REFACTOR_REPORT, directory);
    expect(await readFile(join(directory, DEFAULT_REFACTOR_REPORT), "utf8")).toBe(plan.markdown);
  });

  it("writes UNSLOP-REPORT.md through the CLI and supports JSON output", async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, "Card.tsx"), `<div className="shadow-xl">Unleash the power</div>`);
    const result = await invoke(["refactor-plan", "Card.tsx", "--preset", "swiss-editorial", "--json"], directory);
    expect(result.code).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.report).toBe(DEFAULT_REFACTOR_REPORT);
    expect(output.preset.name).toBe("swiss-editorial");
    expect(output.steps.length).toBeGreaterThan(0);
    expect(await readFile(join(directory, DEFAULT_REFACTOR_REPORT), "utf8")).toContain("Design Craft Score");
  });

  it("serves unslop_refactor_plan over MCP and writes the requested report", async () => {
    const directory = await temporaryDirectory();
    await writeFile(join(directory, "Dashboard.tsx"), `<div className="bg-slate-950 shadow-2xl">$42,001</div>`);
    const server = new UnslopMCPServer({ cwd: directory });
    const response = await server.handleMessage({
      jsonrpc: "2.0", id: 1, method: "tools/call",
      params: { name: "unslop_refactor_plan", arguments: { path: "Dashboard.tsx", preset: "fintech-institutional", report: "reports/BLUEPRINT.md" } },
    });
    expect(response?.error).toBeUndefined();
    const result = response?.result as { structuredContent: { report: string; preset: { name: string }; pillarScores: unknown[] } };
    expect(result.structuredContent.report).toBe("reports/BLUEPRINT.md");
    expect(result.structuredContent.preset.name).toBe("fintech-institutional");
    expect(result.structuredContent.pillarScores).toHaveLength(7);
    expect(await readFile(join(directory, "reports/BLUEPRINT.md"), "utf8")).toContain("Prioritized Transformation Steps");
  });
});

describe("v2 CLI token workflows", () => {
  it("infers W3C JSON from .json and writes explicit Tailwind v3 and CSS formats", async () => {
    const directory = await temporaryDirectory();
    const json = await invoke(["export-tokens", "--preset", "raycast-command", "--out", "tokens.json"], directory);
    expect(json.code).toBe(0);
    expect(JSON.parse(await readFile(join(directory, "tokens.json"), "utf8")).color.dark).toBeDefined();
    const config = await invoke(["export-tokens", "--preset", "vercel-monochrome", "--format", "tailwind-v3", "--out", "tailwind.config.js"], directory);
    expect(config.code).toBe(0);
    expect(await readFile(join(directory, "tailwind.config.js"), "utf8")).toContain("theme");
    const css = await invoke(["export-tokens", "--preset", "teenage-engineering", "--format", "css", "--out", "tokens.css"], directory);
    expect(css.code).toBe(0);
    expect(await readFile(join(directory, "tokens.css"), "utf8")).not.toContain("@theme");
  });
});
