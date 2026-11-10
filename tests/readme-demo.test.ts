import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { auditTarget } from "../src/analyzer/slop-detector.js";

const root = resolve(import.meta.dirname, "..");

describe("README first impression", () => {
  it("places the star CTA, suite links and demo before a one-line quickstart", async () => {
    const readme = await readFile(resolve(root, "README.md"), "utf8");
    const top = readme.split("## Supported Coding Agents")[0]!;
    expect(top).toContain("> ⭐ **If this tool helps your AI coding workflow, please give this repository a Star!** It helps more developers discover the project.");
    for (const [name, command] of [
      ["unslop", "npx -y unslop-mcp@latest init"],
      ["vibe-shield", "npx -y @vibefoundry/vibe-shield@latest scan ."],
      ["ghost-qa", "npx -y ghost-qa@latest test http://localhost:3000"],
    ]) {
      expect(top).toContain(`**[${name}](https://github.com/avivgerz-hue/${name})**`);
      expect(top).toContain(`\`${command}\``);
    }
    expect(top).toContain("**VibeFoundry Agent Suite:");
    expect(top).toMatch(/!\[Live Terminal Demo\]\(assets\/demo\.svg\)\s*```bash\nnpx -y unslop-mcp@latest init\n```/);
    expect(top.indexOf("![Live Terminal Demo]")).toBeLessThan(top.indexOf("![unslop preview]"));
    await expect(access(resolve(root, "docs/index.html"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(resolve(root, "action.yml"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("loops with self-contained CSS and represents real before/after fixture results", async () => {
    const svg = await readFile(resolve(root, "assets/demo.svg"), "utf8");
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("@keyframes");
    expect(svg).toContain("infinite");
    expect(svg).toContain("prefers-reduced-motion: reduce");
    expect(svg).not.toMatch(/<script\b|<image\b|\bon\w+=|(?:href|src)=/i);
    expect(svg).toContain("After manual edits, rerun the same audit");
    expect(svg).toContain("audit excerpt");
    expect(svg).toContain("verify the rendered UI and contrast");

    const beforeCwd = resolve(root, "tests/fixtures/demo/before");
    const afterCwd = resolve(root, "tests/fixtures/demo/after");
    const before = await auditTarget("Hero.tsx", { cwd: beforeCwd });
    const after = await auditTarget("Hero.tsx", { cwd: afterCwd });
    expect([before.designCraftScore, before.grade]).toEqual([91, "A"]);
    expect([after.designCraftScore, after.grade]).toEqual([100, "A+"]);
    expect(after.violations).toHaveLength(0);
    for (const [id, line, column, severity] of [
      ["SLOP-COLOR-001", 1, 21, "warning"],
      ["SLOP-COPY-001", 1, 52, "warning"],
      ["SLOP-UX-003", 1, 74, "error"],
    ] as const) {
      expect(before.violations).toContainEqual(expect.objectContaining({ ruleId: id, line, column, severity }));
      expect(svg).toContain(`Hero.tsx:${line}:${column}`);
      expect(svg).toContain(id);
    }
    expect(svg).toContain(`${before.designCraftScore}/100 (${before.grade})`);
    expect(svg).toContain(`${after.designCraftScore}/100 (${after.grade})`);
  });
});
