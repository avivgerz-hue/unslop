import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  AGENT_CONFIG_PATHS,
  installUnslop,
  RULE_TARGETS,
} from "../src/sync/rule-writer.js";
import { UNSLOP_VERSION } from "../src/version.js";
import { TRANSFORMATION_RULES } from "../src/sync/transformation-rules.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "unslop-integrations-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function readJSON(cwd: string, path: string): Promise<any> {
  return JSON.parse(await readFile(join(cwd, path), "utf8"));
}

async function writeJSON(cwd: string, path: string, value: unknown): Promise<void> {
  await mkdir(dirname(join(cwd, path)), { recursive: true });
  await writeFile(join(cwd, path), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("universal coding-agent integration", () => {
  it("generates native skills, instructions, MCP configuration, and Claude plugin metadata", async () => {
    const cwd = await temporaryDirectory();
    const result = await installUnslop({ cwd, preset: "linear-precision" });
    expect(result.files).toHaveLength(RULE_TARGETS.length + AGENT_CONFIG_PATHS.length);
    expect(result.files.map((file) => file.path)).toEqual([
      ...RULE_TARGETS.map((target) => target.path),
      ...AGENT_CONFIG_PATHS,
    ]);

    for (const target of RULE_TARGETS) {
      const content = await readFile(join(cwd, target.path), "utf8");
      expect(content, target.path).toContain("<!-- unslop:start -->");
      expect(content, target.path).toContain("Design Craft Score");
    }
    for (const path of [".claude/skills/unslop/SKILL.md", ".agents/skills/unslop/SKILL.md"]) {
      const skill = await readFile(join(cwd, path), "utf8");
      expect(skill).toMatch(/^---\nname: unslop\n/);
      expect(skill).toContain(TRANSFORMATION_RULES);
    }
    expect(await readFile(join(cwd, ".cursor/rules/unslop.mdc"), "utf8")).toContain("alwaysApply: true");

    const mcp = await readJSON(cwd, ".mcp.json");
    expect(mcp.mcpServers.unslop).toEqual({ command: "npx", args: ["-y", "unslop-mcp", "--mcp"] });
    const opencode = await readJSON(cwd, "opencode.json");
    expect(opencode.$schema).toBe("https://opencode.ai/config.json");
    expect(opencode.mcp["unslop-mcp"]).toEqual({
      type: "local",
      command: ["npx", "-y", "unslop-mcp", "--mcp"],
      enabled: true,
    });
    const cursor = await readJSON(cwd, ".cursor/mcp.json");
    expect(cursor.mcpServers.unslop.command).toBe("npx");
    const vscode = await readJSON(cwd, ".vscode/mcp.json");
    expect(vscode.servers.unslop).toEqual({
      type: "stdio",
      command: "npx",
      args: ["-y", "unslop-mcp", "--mcp"],
    });
    const zed = await readJSON(cwd, ".zed/settings.json");
    expect(zed.context_servers.unslop.command).toEqual({
      path: "npx",
      args: ["-y", "unslop-mcp", "--mcp"],
    });
    const plugin = await readJSON(cwd, ".claude-plugin/plugin.json");
    expect(plugin).toMatchObject({
      name: "unslop",
      version: UNSLOP_VERSION,
      license: "MIT",
      repository: "https://github.com/avivgerz-hue/unslop",
    });
    expect(plugin.skills).toContain("./.claude/skills/unslop");
  });

  it("preserves unrelated configuration and user instructions and remains idempotent", async () => {
    const cwd = await temporaryDirectory();
    await writeJSON(cwd, "opencode.json", {
      theme: "system",
      mcp: {
        other: { type: "local", command: ["other-server"] },
        "unslop-mcp": { timeout: 5000 },
      },
    });
    await writeJSON(cwd, ".cursor/mcp.json", {
      custom: true,
      mcpServers: { other: { command: "other-server" } },
    });
    await writeJSON(cwd, ".vscode/mcp.json", {
      inputs: [{ id: "workspace", type: "promptString" }],
      servers: { other: { type: "stdio", command: "other-server" } },
    });
    await writeJSON(cwd, ".zed/settings.json", {
      theme: "One Dark",
      context_servers: {
        other: { command: { path: "other-server" } },
        unslop: { settings: { region: "eu" }, command: { env: { CUSTOM: "kept" } } },
      },
    });
    await writeJSON(cwd, ".claude-plugin/plugin.json", {
      name: "unslop",
      custom: true,
      skills: ["./skills/custom"],
      author: { url: "https://example.com" },
    });
    await mkdir(join(cwd, ".github"), { recursive: true });
    await writeFile(join(cwd, ".github/copilot-instructions.md"), "# Team-owned instructions\n", "utf8");

    await installUnslop({ cwd, preset: "swiss-editorial" });
    const opencode = await readJSON(cwd, "opencode.json");
    expect(opencode.theme).toBe("system");
    expect(opencode.mcp.other.command).toEqual(["other-server"]);
    expect(opencode.mcp["unslop-mcp"].timeout).toBe(5000);
    expect((await readJSON(cwd, ".cursor/mcp.json")).custom).toBe(true);
    expect((await readJSON(cwd, ".cursor/mcp.json")).mcpServers.other).toBeDefined();
    expect((await readJSON(cwd, ".vscode/mcp.json")).inputs).toHaveLength(1);
    expect((await readJSON(cwd, ".vscode/mcp.json")).servers.other).toBeDefined();
    const zed = await readJSON(cwd, ".zed/settings.json");
    expect(zed.theme).toBe("One Dark");
    expect(zed.context_servers.other).toBeDefined();
    expect(zed.context_servers.unslop.settings).toEqual({ region: "eu" });
    expect(zed.context_servers.unslop.command.env).toEqual({ CUSTOM: "kept" });
    const plugin = await readJSON(cwd, ".claude-plugin/plugin.json");
    expect(plugin.custom).toBe(true);
    expect(plugin.skills).toEqual(["./skills/custom", "./.claude/skills/unslop"]);
    expect(plugin.author.url).toBe("https://example.com");
    expect(await readFile(join(cwd, ".github/copilot-instructions.md"), "utf8")).toContain("# Team-owned instructions");

    const second = await installUnslop({ cwd, preset: "swiss-editorial" });
    expect(second.files.every((file) => file.status === "unchanged")).toBe(true);
  });

  it("ships root auto-discovery files and documents the complete agent matrix", async () => {
    const [agents, claude, opencode, plugin, claudeSkill, codexSkill, readme] = await Promise.all([
      readFile(join(root, "AGENTS.md"), "utf8"),
      readFile(join(root, "CLAUDE.md"), "utf8"),
      readJSON(root, "opencode.json"),
      readJSON(root, ".claude-plugin/plugin.json"),
      readFile(join(root, ".claude/skills/unslop/SKILL.md"), "utf8"),
      readFile(join(root, ".agents/skills/unslop/SKILL.md"), "utf8"),
      readFile(join(root, "README.md"), "utf8"),
    ]);
    expect(agents).toContain("<!-- unslop:start -->");
    expect(claude).toContain("<!-- unslop:start -->");
    expect(opencode.mcp["unslop-mcp"].enabled).toBe(true);
    expect(plugin.version).toBe("2.1.0");
    expect(claudeSkill).toContain("name: unslop");
    expect(codexSkill).toContain("name: unslop");
    const rootSkill = await readFile(join(root, "SKILL.md"), "utf8");
    for (const content of [rootSkill, claudeSkill, codexSkill]) {
      expect(content).toContain(TRANSFORMATION_RULES);
      for (const required of ["from-purple-500 to-indigo-500", "md:col-span-7", "md:col-span-5", "md:col-span-12", "tabular-nums", "max-w-prose", "60ch–70ch", "4.5:1", "7:1", "both themes"]) {
        expect(content).toContain(required);
      }
    }
    expect(readme).toContain("## Supported Coding Agents (Claude Code, OpenCode, Codex, Cursor, Windsurf, Copilot, Cline, Zed)");
  });
});
