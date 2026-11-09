import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadPreset } from "../presets/index.js";
import { AI_COPY_CLICHES, } from "./design-craft.js";
import { auditTarget, designGrade, } from "./slop-detector.js";
export const DEFAULT_REFACTOR_REPORT = "UNSLOP-REPORT.md";
function copyReplacement(evidence) {
    const match = AI_COPY_CLICHES.find((entry) => evidence.toLowerCase().includes(entry.phrase.toLowerCase()));
    return match?.replacement ?? "State the user task, product capability, and measurable result in direct language.";
}
function nearestGridSpacing(evidence) {
    const match = evidence.match(/([pm][xytrblse]?|gap(?:-[xy])?)-\[(\d+(?:\.\d+)?)(px|rem|em)\]/);
    if (!match)
        return undefined;
    const numeric = Number.parseFloat(match[2] ?? "0") * (match[3] === "px" ? 1 : 16);
    const rounded = Math.max(0, Math.round(numeric / 4) * 4);
    return `${match[1]}-[var(--spacing-${rounded})]`;
}
/** Translate each finding into an executable preset-aware replacement. */
export function translateViolation(violation, preset) {
    const id = violation.ruleId;
    const before = violation.evidence;
    const base = {
        file: violation.file,
        line: violation.line,
        column: violation.column,
        ruleId: id,
        before,
        rationale: violation.recommendation,
    };
    if (id.startsWith("SLOP-COPY") || (!id.startsWith("SLOP-") && /(?:Unleash|Supercharge|Seamless|Revolution)/i.test(before))) {
        return { ...base, kind: "copy", after: copyReplacement(before) };
    }
    const spacing = nearestGridSpacing(before);
    if (spacing && (id === "SLOP-LAYOUT-003" || !id.startsWith("SLOP-")))
        return { ...base, kind: "class", after: spacing };
    if (/SLOP-COLOR-001/.test(id) || (!id.startsWith("SLOP-") && /gradient/i.test(before))) {
        return { ...base, kind: "color", after: "bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)]" };
    }
    if (/SLOP-COLOR-002/.test(id) || (!id.startsWith("SLOP-") && /neon/i.test(before))) {
        return { ...base, kind: "color", after: "focus-visible:ring-2 focus-visible:ring-[var(--accent)]" };
    }
    if (/SLOP-COLOR-(?:003|004|005|006|007|009)/.test(id) || /low-contrast/.test(id)) {
        return { ...base, kind: "color", after: "text-[var(--text-primary)] bg-[var(--surface-0)]" };
    }
    if (/SLOP-COLOR-(?:008|010)|SLOP-TOKEN-001/.test(id) || (!id.startsWith("SLOP-") && /#[\da-f]{3,8}\b|rgba?\(/i.test(before))) {
        return { ...base, kind: "color", after: "var(--text-primary)" };
    }
    if (/SLOP-TYPE-001/.test(id)) {
        return { ...base, kind: "class", after: "text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] tracking-[var(--tracking-display)]" };
    }
    if (/SLOP-TYPE-003/.test(id))
        return { ...base, kind: "class", after: "max-w-[65ch] leading-[var(--leading-body,1.65)]" };
    if (/SLOP-TYPE-004|numeric-alignment/.test(id))
        return { ...base, kind: "class", after: "tabular-nums text-right" };
    if (/SLOP-TYPE-005/.test(id))
        return { ...base, kind: "class", after: "leading-[var(--leading-body,1.65)]" };
    if (/SLOP-TYPE-006/.test(id))
        return { ...base, kind: "class", after: "leading-[1.05] tracking-[var(--tracking-display)]" };
    if (/SLOP-TYPE-007/.test(id))
        return { ...base, kind: "class", after: "text-[var(--text-sm)]" };
    if (/SLOP-TYPE-009|display-tracking/.test(id))
        return { ...base, kind: "class", after: "tracking-[var(--tracking-display)] leading-[1.05]" };
    if (/SLOP-TYPE-010/.test(id))
        return { ...base, kind: "class", after: "uppercase tracking-[var(--tracking-label,0.08em)]" };
    if (/SLOP-LAYOUT-001|emoji-feature-grid/.test(id)) {
        return { ...base, kind: "layout", after: "grid grid-cols-1 gap-[var(--spacing-16)] md:grid-cols-12 md:[&>article:nth-child(1)]:col-span-7 md:[&>article:nth-child(2)]:col-span-5 md:[&>article:nth-child(3)]:col-span-12" };
    }
    if (/SLOP-LAYOUT-002/.test(id))
        return { ...base, kind: "layout", after: "grid gap-[var(--spacing-24)] border-t border-[var(--border-subtle)] pt-[var(--spacing-24)]" };
    if (/SLOP-LAYOUT-004|radius-scale/.test(id) || (!id.startsWith("SLOP-") && /rounded-(?:2xl|3xl)/.test(before))) {
        return { ...base, kind: "class", after: "rounded-[var(--radius-lg)]" };
    }
    if (/SLOP-LAYOUT-005/.test(id))
        return { ...base, kind: "layout", after: "text-left items-start justify-start" };
    if (/SLOP-LAYOUT-006/.test(id))
        return { ...base, kind: "layout", after: `grid-cols-${preset.tokens.layout.columns}` };
    if (/SLOP-LAYOUT-007/.test(id))
        return { ...base, kind: "layout", after: "mx-auto max-w-[var(--container-content)] px-[var(--content-inset,24px)]" };
    if (/SLOP-LAYOUT-008/.test(id))
        return { ...base, kind: "layout", after: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" };
    if (/SLOP-SURFACE-001/.test(id) || (!id.startsWith("SLOP-") && /backdrop-blur/.test(before)))
        return { ...base, kind: "class", after: "bg-[var(--surface-1)]" };
    if (/SLOP-SURFACE-002|raw-elevation|SLOP-SURFACE-005/.test(id) || (!id.startsWith("SLOP-") && /shadow-(?:xl|2xl)/.test(before))) {
        return { ...base, kind: "class", after: "border border-[var(--border-subtle)] shadow-[var(--shadow-md)]" };
    }
    if (/SLOP-SURFACE-003/.test(id) || (!id.startsWith("SLOP-") && /blur-3xl/.test(before)))
        return { ...base, kind: "layout", after: "Remove the decorative blob element; retain meaningful content and interactions." };
    if (/SLOP-SURFACE-004/.test(id))
        return { ...base, kind: "class", after: "inline-flex size-5 shrink-0 items-center justify-center text-[var(--text-muted)]" };
    if (/SLOP-SURFACE-006/.test(id))
        return { ...base, kind: "class", after: "border border-[var(--border-subtle)]" };
    if (/SLOP-SURFACE-007/.test(id))
        return { ...base, kind: "class", after: "shadow-[var(--shadow-md)]" };
    if (/SLOP-SURFACE-008|SLOP-UX-003/.test(id)) {
        return { ...base, kind: "interaction", after: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2" };
    }
    if (/SLOP-UX-001/.test(id))
        return { ...base, kind: "interaction", after: "<button type=\"button\">" };
    if (/SLOP-UX-002/.test(id))
        return { ...base, kind: "interaction", after: "tabIndex={0} onKeyDown={handleEnterAndSpace}" };
    if (/SLOP-UX-004/.test(id))
        return { ...base, kind: "interaction", after: "hover:bg-[var(--interactive)]" };
    if (/SLOP-UX-005/.test(id))
        return { ...base, kind: "interaction", after: "active:translate-y-px motion-reduce:transform-none" };
    if (/SLOP-UX-006/.test(id))
        return { ...base, kind: "interaction", after: "disabled:cursor-not-allowed disabled:opacity-60" };
    if (/SLOP-UX-007/.test(id) || (!id.startsWith("SLOP-") && /transition-all/.test(before)))
        return { ...base, kind: "interaction", after: "transition-colors motion-reduce:transition-none" };
    if (/SLOP-UX-008/.test(id))
        return { ...base, kind: "interaction", after: "motion-reduce:transition-none motion-reduce:transform-none" };
    if (/SLOP-UX-(?:009|010)/.test(id))
        return { ...base, kind: "interaction", after: "aria-label=\"Describe the field purpose\"" };
    if (/SLOP-UX-011/.test(id))
        return { ...base, kind: "interaction", after: "min-h-11 min-w-11" };
    if (/SLOP-UX-012/.test(id))
        return { ...base, kind: "interaction", after: "tabIndex={0}" };
    if (/SLOP-TOKEN-002/.test(id))
        return { ...base, kind: "token", after: "bg-[var(--surface-1)] text-[var(--text-primary)]" };
    if (/SLOP-TOKEN-003/.test(id))
        return { ...base, kind: "token", after: "var(--surface-0) → var(--surface-1) → var(--surface-elevated)" };
    if (/SLOP-TOKEN-004/.test(id))
        return { ...base, kind: "token", after: ".dark { --surface-0: …; --surface-1: …; --surface-elevated: …; }" };
    if (/SLOP-TOKEN-005/.test(id))
        return { ...base, kind: "token", after: "--spacing-16: 16px;" };
    if (/SLOP-TOKEN-006/.test(id))
        return { ...base, kind: "token", after: "--surface-1" };
    if (/SLOP-TOKEN-(?:007|008)/.test(id))
        return { ...base, kind: "token", after: "--text-primary: var(--color-text-primary);" };
    if (violation.pillar === "color")
        return { ...base, kind: "color", after: "var(--accent)" };
    if (violation.pillar === "typography")
        return { ...base, kind: "class", after: "text-[var(--text-base)] font-[var(--font-body)]" };
    if (violation.pillar === "layout")
        return { ...base, kind: "layout", after: "gap-[var(--spacing-16)]" };
    if (violation.pillar === "surface")
        return { ...base, kind: "class", after: "border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]" };
    if (violation.pillar === "ux")
        return { ...base, kind: "interaction", after: "focus-visible:ring-2 motion-reduce:transition-none" };
    return { ...base, kind: "token", after: "var(--surface-1)" };
}
function cell(value) {
    return value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ").replace(/`/g, "\\`");
}
function renderMarkdown(audit, preset, translations, steps) {
    const lines = [
        "# Design Transformation Blueprint",
        "",
        `Generated by unslop v2 · Archetype: **${preset.title}** (\`${preset.name}\`).`,
        "",
        `## Design Craft Score: ${audit.designCraftScore}/100 (${designGrade(audit.designCraftScore)})`,
        "",
        `${audit.filesScanned} files scanned · ${audit.violations.length} findings including compatibility IDs · ${translations.length} exact translations.`,
        "",
        "## 7-Pillar Scorecard",
        "",
        "| Pillar | Score | Grade | Findings |",
        "| --- | ---: | :---: | ---: |",
        ...audit.pillarScores.map((pillar) => `| ${pillar.name} | ${pillar.score}/100 | ${pillar.grade} | ${pillar.violations} |`),
        "",
        "## Before → After Class & Token Translation",
        "",
        "| Location | Rule | Before | Exact replacement |",
        "| --- | --- | --- | --- |",
    ];
    if (translations.length === 0) {
        lines.push("| — | — | No slop translations required | Preserve the existing semantic token contract |");
    }
    else {
        lines.push(...translations.map((translation) => `| ${cell(`${translation.file}:${translation.line}:${translation.column}`)} | ${translation.ruleId} | \`${cell(translation.before)}\` | \`${cell(translation.after)}\` |`));
    }
    lines.push("", "## Prioritized Transformation Steps", "", "Apply P0 correctness fixes first, then P1 craft and interaction fixes, then P2 refinements. Preserve product behavior and re-run the audit after each coherent pass.", "");
    if (steps.length === 0) {
        lines.push("1. **Verify:** manually test responsive composition, keyboard states, contrast, reduced motion, and theme parity before release.");
    }
    else {
        steps.forEach((step, index) => {
            lines.push(`${index + 1}. **${step.priority} · ${step.file}:${step.line}:${step.column} · ${step.ruleId}**`, `   - Action: ${step.action}`, `   - Before: \`${cell(step.before)}\``, `   - After: \`${cell(step.after)}\``);
        });
    }
    lines.push("", "## Acceptance Criteria", "", "- Reach 95–100/100 (A+) without suppressing rules or deleting accessible states.", "- Keep body copy at 60–70ch, apply tabular numbers to every metric, price, and counter, and keep spacing on the four-pixel grid.", "- Verify WCAG AA/AAA after compositing and test both theme companions.", "- Exercise keyboard focus, hover, active, disabled, loading, empty, error, and reduced-motion states.", "- Re-run `npx -y unslop-mcp audit .` and inspect the rendered interface at narrow and wide viewports.", "");
    return lines.join("\n");
}
export async function createRefactorPlan(target = ".", options = {}) {
    const preset = typeof options.preset === "string"
        ? loadPreset(options.preset)
        : options.preset ?? loadPreset("linear-precision");
    const audit = await auditTarget(target, {
        ...(options.cwd ? { cwd: options.cwd } : {}),
        ignore: options.ignore ?? [],
    });
    const translations = audit.violations
        .filter((violation) => violation.ruleId.startsWith("SLOP-"))
        .map((violation) => translateViolation(violation, preset));
    const priority = { error: "P0", warning: "P1", info: "P2" };
    const steps = translations.map((translation) => {
        const violation = audit.violations.find((entry) => entry.ruleId === translation.ruleId && entry.file === translation.file &&
            entry.line === translation.line && entry.column === translation.column && entry.evidence === translation.before);
        return {
            priority: violation ? priority[violation.severity] : "P1",
            file: translation.file,
            line: translation.line,
            column: translation.column,
            ruleId: translation.ruleId,
            action: violation?.recommendation ?? translation.rationale,
            before: translation.before,
            after: translation.after,
        };
    }).sort((left, right) => left.priority.localeCompare(right.priority) || left.file.localeCompare(right.file) || left.line - right.line || left.column - right.column || left.ruleId.localeCompare(right.ruleId));
    return {
        target: audit.target,
        preset: { name: preset.name, title: preset.title },
        score: audit.designCraftScore,
        designCraftScore: audit.designCraftScore,
        grade: designGrade(audit.designCraftScore),
        pillarScores: audit.pillarScores,
        translations,
        steps,
        markdown: renderMarkdown(audit, preset, translations, steps),
        audit,
    };
}
export async function writeRefactorReport(plan, outputPath, cwd = process.cwd()) {
    const absolute = resolve(cwd, outputPath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, plan.markdown, "utf8");
    return absolute;
}
//# sourceMappingURL=refactor-plan.js.map