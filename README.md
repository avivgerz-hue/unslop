# unslop

**Your agent can write the code. Stop letting it ship the same AI interface.**

[![CI](https://github.com/avivgerz-hue/unslop/actions/workflows/ci.yml/badge.svg)](https://github.com/avivgerz-hue/unslop/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/unslop.svg)](https://www.npmjs.com/package/unslop)
[![Node.js 20.19+](https://img.shields.io/badge/node-%3E%3D20.19-3c873a)](https://nodejs.org/)
[![MIT license](https://img.shields.io/badge/license-MIT-111111)](LICENSE)

`unslop` is a zero-runtime-dependency CLI and installable Agent Skill that gives coding agents a real design system, audits frontend source for generic AI patterns, and turns live interfaces into enforceable Design DNA.

Works with **Claude Code, OpenAI Codex, Cursor, Windsurf, Cline**, and any agent that reads project instructions.

```bash
npx unslop init
```

That one command installs the `linear-dark` design contract into `.claude/skills/unslop/SKILL.md`, `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.windsurfrules`, and `.clinerules`. Existing instructions are preserved.

## The difference

```text
BEFORE: probabilistic taste                 AFTER: enforceable design physics
──────────────────────────────────────      ──────────────────────────────────────
“Make it modern and beautiful.”             4px grid · semantic surface hierarchy
        ↓                                              ↓
 centered purple-gradient hero             12-column content-driven composition
        ↓                                              ↓
 three centered emoji cards                tight display type · 45–75ch body measure
        ↓                                              ↓
 shadow-xl + rounded-2xl everywhere        hairline borders · intentional elevation
        ↓                                              ↓
 another interchangeable AI page           auditable tokens + complete UI states
```

`unslop` does not ask a model to be more creative. It constrains the implementation with explicit typography, geometry, color roles, elevation, motion, and verification loops.

## Why teams install it

- **Installable taste, not a prompt snippet.** Five complete, versioned presets compile to CSS variables and strict agent laws.
- **Deterministic anti-slop audit.** Scan TSX, JSX, Vue, Svelte, HTML, and CSS with exact `file:line:column` diagnostics.
- **A score your agent can act on.** Every audit includes a structured refactoring brief and acceptance criteria.
- **Extract real Design DNA.** Read local CSS or a live URL, including inline styles, linked stylesheets, and `@import` graphs.
- **No runtime dependency footprint.** Node.js built-ins do the analysis, extraction, synchronization, and CLI work.
- **Safe to re-run.** Managed blocks are idempotent; your existing agent instructions remain intact.

## Quickstart

### 1. Choose a design system

```bash
npx unslop init --preset linear-dark
```

```text
Installed the linear-dark design system:
  created   .claude/skills/unslop/SKILL.md
  created   CLAUDE.md
  created   AGENTS.md
  created   .cursorrules
  created   .windsurfrules
  created   .clinerules

Next: run npx unslop audit . before your agent writes more UI.
```

Then ask your agent:

> Build the settings page using the unslop contract. Reuse the semantic tokens, implement every interaction state, run the audit, and resolve each finding.

### 2. Audit the interface

```bash
npx unslop audit src
```

```text
src/components/Hero.tsx:4:7  WARNING  slop/cliche-gradient
  Cliché purple/indigo AI gradient stop detected.
  Fix: Replace the gradient with a deliberate solid accent ...

src/components/Metric.tsx:8:5  WARNING  slop/numeric-alignment
  Numeric UI is missing tabular figures, causing unstable alignment.

Design Integrity Score: 86/100 (B)
```

The full output also contains a copy-ready refactoring prompt. Machine-readable output is one flag away:

```bash
npx unslop audit . --json
npx unslop audit . --prompt
npx unslop audit . --fail-under 90
npx unslop audit . --no-fail
```

By default, an audit exits `1` when it finds violations and `0` when clean. Invalid usage exits `2`. Unsupported or empty directories still produce a valid report with zero scanned files.

### 3. Extract a visual language

From a local stylesheet:

```bash
npx unslop extract ./tokens.css --name acme -o .claude/skills/unslop/SKILL.md
```

From a live URL:

```bash
npx unslop extract https://example.com --name example --json -o design-dna.json
```

The extractor inventories:

- surface, text, muted-text, border, accent, and on-accent colors;
- CSS custom properties and font stacks;
- font sizes, line heights, weights, and tracking;
- radius and spacing scales;
- complete layered elevation tokens and their individual shadow layers;
- durations and easing functions.

Markdown output is a complete Claude-compatible `SKILL.md`. `--json` emits both the raw token inventory and its validated, compiled preset. Network requests use timeouts, response-size limits, a bounded stylesheet queue, and HTTP(S)-only URLs; page JavaScript is never executed.

## Preset gallery

| Preset | Mode | Visual thesis | Best suited for |
| --- | --- | --- | --- |
| `linear-dark` | Dark | Quiet neutral layers, hairline borders, compact type, restrained indigo | Developer tools, operational dashboards, engineering products |
| `swiss-grid` | Light | Editorial scale, exposed grid, black rules, one signal-red accent | Publications, portfolios, cultural and typographic sites |
| `stripe-minimal` | Light | Cool atmospheric canvas, crisp white surfaces, layered soft elevation | SaaS, financial products, marketing with dense product UI |
| `apple-glass` | Light | Optical hierarchy, sparse translucent materials, continuous corners, springs | Consumer products, media experiences, spatial interfaces |
| `neo-brutalist` | Light | Opaque surfaces, stark ink borders, hard offset shadows, one loud accent | Experiments, communities, campaigns, playful tools |

Inspect every token and law before choosing:

```bash
npx unslop presets
npx unslop presets swiss-grid
npx unslop presets apple-glass --json
```

## What the audit detects

| Rule ID | Detection |
| --- | --- |
| `slop/cliche-gradient` | Purple, indigo, violet, and fuchsia gradient utility stops and matching CSS gradients |
| `slop/neon-glow` | Cyan, magenta, and fuchsia cyber-glow box shadows |
| `slop/emoji-feature-grid` | Three-column grids combined with centered content and emoji in the same component region |
| `slop/raw-elevation` | `shadow-xl`/`shadow-2xl` without a subtle border token, or a single heavy CSS shadow without support |
| `slop/display-tracking` | Large `h1`/`h2` typography without tight or negative tracking |
| `slop/numeric-alignment` | Static numeric UI and marked dynamic metrics without `tabular-nums` |
| `slop/font-weight-mixing` | Four or more distinct weights in one component source tree |
| `slop/conflicting-spacing` | Different values for the same spacing property and responsive variant on one element |
| `slop/off-grid-spacing` | Arbitrary pixel/rem spacing outside the 4px grid, excluding deliberate 1px and 2px optical stops |
| `slop/conflicting-radius` | Competing radius utilities for one element and corner axis |
| `slop/radius-scale` | Four or more unrelated non-pill surface radii in a component tree |

**Design Integrity Score:** start at 100; subtract 12 per error, 7 per warning, and 3 per informational finding, clamped to `0–100`. The score is comparable and deterministic, not a claim that static analysis can replace rendered design review.

## CLI reference

```text
unslop init [--preset <name>] [--dir <path>] [--force] [--json]
unslop audit [dir] [--json | --prompt] [--fail-under <0-100>]
                 [--ignore <directory>] [--no-fail]
unslop extract <url-or-css-path> [--name <preset-name>] [--json]
                 [--output <path>] [--timeout <ms>] [--max-stylesheets <n>]
unslop presets [name] [--json]
unslop help
unslop --version
```

### Safe rule synchronization

Each generated file contains an `unslop` managed block. Running `init` again updates only that block. Existing content is preserved byte-for-byte. `--force` intentionally replaces whole rule files, including unmanaged content—use it only when that is what you want.

## Agent Skill usage

### Claude Code

`init` writes `.claude/skills/unslop/SKILL.md` with valid frontmatter and the selected design contract. `CLAUDE.md` points to the same managed rules so the constraints remain visible in project context.

### OpenAI Codex

Codex reads `AGENTS.md`. Keep the generated file at the repository root and ask Codex to run `npx unslop audit .` after implementing UI.

### Cursor, Windsurf, and Cline

The same contract is compiled into `.cursorrules`, `.windsurfrules`, and `.clinerules`. No plugin, MCP server, or additional runtime is required.

### Manual installation

Copy this repository’s root `SKILL.md` into `.claude/skills/unslop/SKILL.md` for the preset-agnostic anti-slop contract, or run `init` to include a complete preset. The compiled rules are plain Markdown and can be adapted to other agents without changing the CLI.

## Programmatic API

```ts
import { auditTarget } from "unslop/analyzer";
import { extractDesignDNA, createPresetFromDNA } from "unslop/extractor";
import { loadPreset } from "unslop/presets";
import { renderAgentSkill, syncRuleFiles } from "unslop/sync";

const report = await auditTarget("./src");
const dna = await extractDesignDNA("./tokens.css");
const extractedPreset = createPresetFromDNA(dna, "acme");
const skill = renderAgentSkill(extractedPreset);

await syncRuleFiles({ cwd: process.cwd(), preset: loadPreset("linear-dark") });
console.log(report.score, skill);
```

The analyzer also exposes `analyzeSource` for in-memory fixtures and editor integrations.

## Development

```bash
git clone https://github.com/avivgerz-hue/unslop.git
cd unslop
npm ci
npm run build
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for analyzer-rule design, extraction safety, preset requirements, and pull-request guidelines.

## License

MIT © 2026 VibeFoundry. See [LICENSE](LICENSE).

## Part of the VibeFoundry Agent Suite

| Tool | Purpose |
| --- | --- |
| 🎨 [unslop](https://github.com/avivgerz-hue/unslop) | Studio-grade UI design systems & Anti-Slop engine for coding agents. |
| 🛡️ [vibe-shield](https://github.com/avivgerz-hue/vibe-shield) | Automated security scanner & MCP guard for AI-generated codebases. |
| 👻 [ghost-qa](https://github.com/avivgerz-hue/ghost-qa) | Autonomous headless browser QA & self-healing verification loop. |
