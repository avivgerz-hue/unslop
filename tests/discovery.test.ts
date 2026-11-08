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
    expect(manifest.name).toBe("unslop-mcp");
    expect(manifest.version).toBe(UNSLOP_VERSION);
    expect(lockfile.name).toBe(manifest.name);
    expect(lockfile.packages[""].name).toBe(manifest.name);
    expect(lockfile.packages[""].bin).toEqual(manifest.bin);
    expect(lockfile.version).toBe(UNSLOP_VERSION);
    expect(lockfile.packages[""].version).toBe(UNSLOP_VERSION);
    expect(glama.version).toBe(UNSLOP_VERSION);
    expect(registry.version).toBe(UNSLOP_VERSION);
    expect(registry.packages[0].version).toBe(UNSLOP_VERSION);
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
    expect(glama.args).toEqual(["-y", "unslop-mcp", "--mcp"]);
    expect(glama.tools).toEqual(MCP_TOOL_DEFINITIONS);
  });

  it("uses official MCP Registry metadata with the published npm startup", async () => {
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
      registryBaseUrl: "https://registry.npmjs.org",
      identifier: "unslop-mcp",
      version: UNSLOP_VERSION,
      transport: { type: "stdio" },
      runtimeHint: "npx",
      runtimeArguments: [{ type: "positional", value: "-y" }],
      packageArguments: [{ type: "positional", value: "--mcp" }],
    }]);
    expect(publisher["com.vibefoundry"].startup).toEqual({
      command: "npx",
      args: ["-y", "unslop-mcp", "--mcp"],
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
    expect(command).toEqual({ command: "npx", args: ["-y", "unslop-mcp", "--mcp"] });
    expect(smithery).toContain("type: stdio\n");
    expect(smithery).toContain("configSchema: {}\n");

    expect(citation).toContain("cff-version: 1.2.0\n");
    expect(citation).toContain("  - name: VibeFoundry\n");
    expect(citation).toContain("license: MIT\n");
    expect(citation).toContain("repository-code: https://github.com/avivgerz-hue/unslop\n");
    expect(citation).toContain("url: https://github.com/avivgerz-hue/unslop\n");
    expect(citation).toContain('date-released: "2026-11-07"\n');
  });

  it("uses npm commands primarily and retains only explicit GitHub alternatives", async () => {
    const filenames = [
      "README.md",
      "SKILL.md",
      "bin/unslop.ts",
      "src/sync/rule-writer.ts",
      "src/extractor/extract-dna.ts",
      "src/analyzer/slop-detector.ts",
    ];
    const gitHubAlternative = ["npx", "-y", "github:avivgerz-hue/unslop"].join(" ");
    for (const filename of filenames) {
      const content = await readText(filename);
      expect(content, filename).toContain("npx -y unslop-mcp");
      expect(content, filename).not.toMatch(/npx\s+(?:-y\s+)?unslop(?=@|\s)/);
      if (filename === "README.md" || filename === "SKILL.md") {
        expect(content, filename).toContain(gitHubAlternative);
      } else {
        expect(content, filename).not.toContain(gitHubAlternative);
      }
    }
  });

  it("ships a minimal production container and an embedded vector preview", async () => {
    const [dockerfile, dockerignore, preview, readme] = await Promise.all([
      readText("Dockerfile"),
      readText(".dockerignore"),
      readText("assets/hero-preview.svg"),
      readText("README.md"),
    ]);

    expect(dockerfile).toContain("FROM node:22-alpine\n");
    expect(dockerfile).toContain("RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force\n");
    expect(dockerfile).toContain("COPY dist ./dist\n");
    expect(dockerfile).toContain('ENTRYPOINT ["node", "dist/bin/unslop.js", "mcp"]\n');
    expect(dockerfile).not.toContain("COPY src");
    expect(dockerignore).toContain("**\n");
    expect(dockerignore).toContain("!dist/\n");
    expect(dockerignore).toContain("!dist/**\n");

    expect(preview).toContain('viewBox="0 0 1600 1000"');
    expect(preview).toContain("Generic AI Slop UI");
    expect(preview).toContain("Unslop Studio Design DNA");
    expect(preview).toContain("Design Integrity Score");
    expect(preview).toContain("100/100 (A+)");
    expect(preview).not.toMatch(/<script|onload=|TODO|PLACEHOLDER/i);
    expect(readme).toContain("[![npm version](https://img.shields.io/npm/v/unslop-mcp.svg)](https://www.npmjs.com/package/unslop-mcp)");
    expect(readme).toContain("[![npm downloads](https://img.shields.io/npm/dm/unslop-mcp.svg)](https://www.npmjs.com/package/unslop-mcp)");
    expect(readme).toContain("![unslop preview](./assets/hero-preview.svg)");
    expect(readme).toContain("docs/assets/before-after-unslop.png");
    expect(readme.indexOf("![unslop preview](./assets/hero-preview.svg)"))
      .toBeLessThan(readme.indexOf("`unslop` is a zero-runtime-dependency CLI"));
  });

  it("keeps GitHub installation independent of a local TypeScript compiler", async () => {
    const [manifest, buildWrapper, ignoreRules] = await Promise.all([
      readJSON("package.json"),
      readText("scripts/build.mjs"),
      readText(".gitignore"),
    ]);
    expect(manifest.scripts.prepare).toBe("npm run build --if-present");
    expect(manifest.name).toBe("unslop-mcp");
    expect(manifest.bin).toEqual({
      unslop: "dist/bin/unslop.js",
      "unslop-mcp": "dist/bin/unslop.js",
    });
    expect(manifest.dependencies).toBeUndefined();
    expect(ignoreRules.split("\n")).not.toContain("dist/");
    expect(buildWrapper).toContain("TypeScript is not installed; using committed dist/.");
    expect(buildWrapper).toContain("requiredArtifacts.every");
  });
});
