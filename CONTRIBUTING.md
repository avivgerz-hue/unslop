# Contributing to unslop

Thank you for improving the anti-slop engine. The project favors deterministic analysis, small dependency surfaces, readable diagnostics, and design rules that can be enforced rather than merely discussed.

## Development setup

Requirements: Node.js 20.19 or newer and npm.

```bash
git clone https://github.com/avivgerz-hue/unslop.git
cd unslop
npm ci
npm run build
npm test
```

Useful commands:

```bash
npm run typecheck       # Strict TypeScript without emitting files
npm test                # Vitest, single run
npm run test:watch      # Vitest watch mode
node dist/bin/unslop.js presets
node dist/bin/unslop.js audit src
```

The CLI has no runtime dependencies. Build artifacts in `dist/` and installed dependencies are intentionally ignored by Git.

## Change workflow

1. Open an issue for a new analyzer rule, breaking CLI change, or preset. Small documentation and bug fixes can go straight to a pull request.
2. Create a focused branch from `main`.
3. Implement the change with strict TypeScript and regression tests.
4. Run `npm run build`, `npm test`, and a relevant CLI smoke test.
5. Update README or SKILL.md when behavior, commands, rule IDs, or preset contracts change.
6. Submit a pull request explaining the user problem, implementation, and verification. Include before/after diagnostics for analyzer changes.

## Analyzer rules

Analyzer code lives in `src/analyzer/slop-detector.ts`.

- Prefer several strong signals over a vague pattern. For example, the feature-grid rule requires a three-column grid, centered content, and an emoji in the same source region.
- Report the exact file, 1-based line and column, evidence, rationale, and actionable fix.
- Keep output stable: sort paths and findings, avoid timestamps, and do not depend on network or editor state.
- Preserve offsets when stripping comments.
- Add both positive and negative fixtures. Demonstrate what the rule catches and what intentional pattern it must not flag.
- Document scoring consequences. Current penalties are 12 for errors, 7 for warnings, and 3 for informational findings.

The analyzer is intentionally static. Do not claim to prove contrast, visual quality, or runtime behavior from source text alone.

## Design DNA extraction

Extractor code lives in `src/extractor/extract-dna.ts`.

- Keep parsing deterministic and preserve original CSS values after harmless normalization.
- Handle parentheses, quoted strings, CSS variables, shorthand declarations, and malformed input without crashing the entire extraction.
- Network support must remain limited to HTTP(S), bounded by request timeouts, response-size limits, and stylesheet-count limits.
- Use injected `fetch` implementations in tests; never depend on a live third-party site in the test suite.
- Ensure extracted output passes `validatePreset` before it reaches the rule writer.

## Presets

A preset is a complete versioned token contract, not a collection of adjectives. It must define color roles, light/dark scheme, type stacks and scale, tracking, numeric figures, font weights, radii, shadows, spacing, motion, layout geometry, and concrete rules.

When adding a preset:

1. Add its JSON document under `src/presets/`.
2. Register it in `src/presets/index.ts` and `PRESET_NAMES`.
3. Validate every field and add registry tests.
4. Explain the intended product context and visual constraints in the README gallery.
5. Avoid renaming an existing preset; that breaks installed projects.

## Rule synchronization

Managed output is delimited by `<!-- unslop:start -->` and `<!-- unslop:end -->`. Never overwrite content outside those markers unless the user explicitly passes `--force`. Writes must remain atomic and repeated syncs must be byte-for-byte idempotent.

Test new behavior against existing unmanaged files, existing managed blocks, malformed markers, and empty projects.

## Commit and review standards

- Use clear commits; Conventional Commits such as `feat:`, `fix:`, `test:`, and `docs:` are encouraged.
- Keep pull requests focused and avoid unrelated formatting churn.
- No placeholder implementations, commented-out tests, or ignored TypeScript errors.
- Do not commit generated `dist/`, coverage output, secrets, or large scraped datasets.

By contributing, you agree that your contributions are licensed under the repository’s MIT License.
