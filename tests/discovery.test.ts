import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { MCP_TOOL_DEFINITIONS } from "../src/mcp/server.js";
import { UNSLOP_VERSION } from "../src/version.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

async function readJSON(filename: string): Promise<any> {
  return JSON.parse(await readFile(resolve(root, filename), "utf8"));
}

async function readText(filename: string): Promise<string> {
  return readFile(resolve(root, filename), "utf8");
}

describe("release and discovery metadata", () => {
  it("keeps package, runtime, lockfile, registry, and citation versions synchronized", async () => {
    const [manifest, lockfile, glama, registry, citation] = await Promise.all([
      readJSON("package.json"),
      readJSON("package-lock.json"),
      readJSON("glama.json"),
      readJSON("server.json"),
      readText("CITATION.cff"),
    ]);

    expect(UNSLOP_VERSION).toBe("1.2.0");
    expect(manifest.version).toBe(UNSLOP_VERSION);
    expect(lockfile.version).toBe(UNSLOP_VERSION);
    expect(lockfile.packages[""].version).toBe(UNSLOP_VERSION);
    expect(glama.version).toBe(UNSLOP_VERSION);
    expect(registry.version).toBe(UNSLOP_VERSION);
    expect(registry.packages[0].version).toBeUndefined();
    expect(citation).toContain(`version: ${UNSLOP_VERSION}\n`);
  });

  it("publishes a unique, high-intent keyword set without dropping existing terms", async () => {
    const manifest = await readJSON("package.json");
    expect(manifest.keywords.length).toBeGreaterThanOrEqual(30);
    expect(new Set(manifest.keywords).size).toBe(manifest.keywords.length);
    expect(manifest.keywords).toEqual(expect.arrayContaining([
      "mcp",
      "mcp-server",
      "model-context-protocol",
      "claude-code",
      "claude-skills",
      "codex",
      "cursor",
      "windsurf",
      "design-system",
      "tailwind",
      "tailwindcss",
      "tailwindcss-v4",
      "wcag",
      "accessibility",
      "ai-slop",
      "anti-slop",
      "frontend",
      "design-tokens",
      "css",
      "cli",
    ]));
  });

  it("mirrors the canonical MCP tool definitions in Glama without schema drift", async () => {
    const glama = await readJSON("glama.json");
    expect(glama.$schema).toBe("https://glama.ai/mcp/schemas/server.json");
    expect(glama.maintainers).toEqual(["avivgerz-hue"]);
    expect(glama.license).toBe("MIT");
    expect(glama.command).toBe("npx");
    expect(glama.args).toEqual(["github:avivgerz-hue/unslop", "mcp"]);
    expect(glama.tools).toEqual(MCP_TOOL_DEFINITIONS);
  });

  it("uses official MCP Registry metadata with the standardized GitHub startup", async () => {
    const [manifest, registry] = await Promise.all([
      readJSON("package.json"),
      readJSON("server.json"),
    ]);
    const publisher = registry._meta["io.modelcontextprotocol.registry/publisher-provided"];

    expect(registry.$schema).toBe("https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json");
    expect(registry.name).toBe("io.github.avivgerz-hue/unslop");
    expect(manifest.mcpName).toBe(registry.name);
    expect(registry.repository).toEqual({
      url: "https://github.com/avivgerz-hue/unslop",
      source: "github",
    });
    expect(registry.packages).toEqual([{
      registryType: "npm",
      identifier: "github:avivgerz-hue/unslop",
      transport: { type: "stdio" },
      runtimeHint: "npx",
      packageArguments: [{ type: "positional", value: "mcp" }],
    }]);
    expect(publisher["com.vibefoundry"].startup).toEqual({
      command: "npx",
      args: ["github:avivgerz-hue/unslop", "mcp"],
    });
    expect(publisher["com.vibefoundry"].tools.map((tool: { name: string }) => tool.name))
      .toEqual(MCP_TOOL_DEFINITIONS.map((tool) => tool.name));
    expect(Buffer.byteLength(JSON.stringify(publisher), "utf8")).toBeLessThanOrEqual(4096);
  });

  it("provides Smithery stdio startup and complete GitHub citation metadata", async () => {
    const [smithery, citation] = await Promise.all([
      readText("smithery.yaml"),
      readText("CITATION.cff"),
    ]);
    const functionBody = smithery.match(/commandFunction: \|-\n([\s\S]*?)\n?$/)?.[1];
    expect(functionBody).toBeDefined();
    const command = new Function(`return (${functionBody})`)()();
    expect(command).toEqual({ command: "npx", args: ["github:avivgerz-hue/unslop", "mcp"] });
    expect(smithery).toContain("type: stdio\n");
    expect(smithery).toContain("configSchema: {}\n");

    expect(citation).toContain("cff-version: 1.2.0\n");
    expect(citation).toContain("  - name: VibeFoundry\n");
    expect(citation).toContain("license: MIT\n");
    expect(citation).toContain("repository-code: https://github.com/avivgerz-hue/unslop\n");
    expect(citation).toContain("url: https://github.com/avivgerz-hue/unslop\n");
    expect(citation).toContain('date-released: "2026-11-07"\n');
  });

  it("rejects legacy npm commands and flagged GitHub commands in user-facing content", async () => {
    const filenames = [
      "README.md",
      "SKILL.md",
      "bin/unslop.ts",
      "src/sync/rule-writer.ts",
      "src/extractor/extract-dna.ts",
      "src/analyzer/slop-detector.ts",
    ];
    const flaggedGitHubCommand = ["npx", "-y", "github:avivgerz-hue/unslop"].join(" ");
    for (const filename of filenames) {
      const content = await readText(filename);
      expect(content, filename).not.toMatch(/npx\s+(?:-y\s+)?unslop(?=@|\s)/);
      expect(content, filename).not.toContain(flaggedGitHubCommand);
    }
  });

  it("keeps GitHub installation independent of a local TypeScript compiler", async () => {
    const [manifest, buildWrapper, ignoreRules] = await Promise.all([
      readJSON("package.json"),
      readText("scripts/build.mjs"),
      readText(".gitignore"),
    ]);
    expect(manifest.scripts.prepare).toBe("npm run build --if-present");
    expect(manifest.bin.unslop).toBe("./dist/bin/unslop.js");
    expect(manifest.dependencies).toBeUndefined();
    expect(ignoreRules.split("\n")).not.toContain("dist/");
    expect(buildWrapper).toContain("TypeScript is not installed; using committed dist/.");
    expect(buildWrapper).toContain("requiredArtifacts.every");
  });
});
