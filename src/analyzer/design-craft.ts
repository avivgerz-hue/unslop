import { contrastRatio, parseColor, relativeLuminance, requiredContrastRatio } from "./wcag.js";
import type { DesignPillarId, SlopCategory, SlopSeverity, SlopViolation } from "./slop-detector.js";

export interface DesignPillarDefinition {
  id: DesignPillarId;
  code: string;
  name: string;
  description: string;
}

export const DESIGN_PILLARS: readonly DesignPillarDefinition[] = [
  { id: "color", code: "SLOP-COLOR", name: "Color & Contrast", description: "Atmospheric polarity, exact WCAG math, perceptual contrast, and semantic color." },
  { id: "typography", code: "SLOP-TYPE", name: "Typography & Hierarchy", description: "Fluid scales, readable measure, optical spacing, and numeric alignment." },
  { id: "layout", code: "SLOP-LAYOUT", name: "Layout & Spatial Rhythm", description: "Intentional composition, four-pixel rhythm, grid craft, and restrained geometry." },
  { id: "surface", code: "SLOP-SURFACE", name: "Surface & Elevation", description: "Restrained materials, hairline depth, and purposeful iconography." },
  { id: "copy", code: "SLOP-COPY", name: "Copy & Microcopy", description: "Concrete product language without generic AI marketing filler." },
  { id: "ux", code: "SLOP-UX", name: "Interaction & Motion", description: "Semantic controls, keyboard ergonomics, complete states, and efficient motion." },
  { id: "token", code: "SLOP-TOKEN", name: "Theme & Token Architecture", description: "Theme parity, elevation order, and typed semantic token contracts." },
] as const;

export interface DesignCraftRule {
  id: string;
  pillar: DesignPillarId;
  title: string;
  recommendation: string;
}

function rules(pillar: DesignPillarId, code: string, entries: Array<[string, string]>): DesignCraftRule[] {
  return entries.map(([title, recommendation], index) => ({
    id: `${code}-${String(index + 1).padStart(3, "0")}`,
    pillar,
    title,
    recommendation,
  }));
}

export const DESIGN_CRAFT_RULES: readonly DesignCraftRule[] = [
  ...rules("color", "SLOP-COLOR", [
    ["Generic AI gradient", "Replace cliché multi-hue gradients with a semantic surface or a subtle same-hue token transition."],
    ["Neon atmospheric glow", "Remove neon glow; use a semantic focus ring, hairline border, or restrained elevation token."],
    ["Harsh absolute polarity", "Replace pure black/white pairings with calibrated canvas and text tokens that preserve contrast without glare."],
    ["Muddy gray-on-gray text", "Separate foreground and canvas by luminance, not another arbitrary gray; verify the composited pair."],
    ["WCAG AA contrast failure", "Use semantic text and surface tokens that meet WCAG 2.1 AA after alpha compositing."],
    ["WCAG AAA headroom", "Increase contrast toward 7:1 for normal text or 4.5:1 for large text when AAA is required."],
    ["Low perceptual contrast", "Increase lightness separation and font weight; the APCA-inspired perceptual check needs stronger foreground polarity."],
    ["Hardcoded component color", "Replace component hex/RGB literals with typed semantic color tokens."],
    ["Low-opacity text", "Use a verified muted-text token rather than reducing text opacity until it becomes unreadable."],
    ["Gradient text treatment", "Restore solid semantic text color; decorative gradient text reduces readability and theme parity."],
    ["Uncontrolled accent palette", "Consolidate accents into semantic action, success, warning, danger, and information roles."],
    ["Unsoftened dark canvas", "Use the archetype canvas token instead of a pure-black product surface; retain true black only for intentional monochrome themes."],
  ]),
  ...rules("typography", "SLOP-TYPE", [
    ["Fixed display type", "Use a fluid preset scale with clamp() or responsive stops while protecting line breaks and measure."],
    ["Monotonous heading weight", "Differentiate heading levels through scale, measure, spacing, and at most three purposeful weights."],
    ["Unreadable reading measure", "Constrain paragraphs to max-w-prose or a deliberate measure near 45–75ch."],
    ["Unstable numeric glyphs", "Apply tabular-nums and right-align comparable prices, metrics, counters, and timestamps."],
    ["Cramped body line-height", "Use the preset body leading token, normally 1.45–1.75 for paragraph copy."],
    ["Loose display line-height", "Tighten display leading toward 0.95–1.2 and verify intentional wrapping."],
    ["Tiny functional text", "Raise functional copy to the preset’s readable minimum; density must not depend on illegible type."],
    ["Excessive font-weight mixing", "Collapse the tree to two or three weights and use size, color, and spacing for hierarchy."],
    ["Missing display tracking", "Apply the archetype’s negative display-tracking token and verify optical line breaks."],
    ["Untracked uppercase labels", "Add deliberate letter-spacing to uppercase labels or use normal case for longer copy."],
  ]),
  ...rules("layout", "SLOP-LAYOUT", [
    ["Generic three-card clone", "Replace the repeated centered cards with a content-led bento, editorial split, workflow, or dense data composition."],
    ["Nested card containers", "Flatten nested cards; communicate grouping with spacing, alignment, and one surface boundary."],
    ["Off-grid spacing", "Move arbitrary spacing to the nearest four-pixel semantic stop or document the optical exception."],
    ["Excessive container rounding", "Use the preset surface radius; reserve large and full radii for pills, avatars, and compact controls."],
    ["Centered-everything composition", "Use shared content edges and intentional alignment; reserve centered copy for genuinely ceremonial moments."],
    ["Arbitrary grid rhythm", "Use the archetype column contract and named spans instead of one-off grid templates."],
    ["Missing content container", "Give the main composition a max-width token, intentional inline padding, and a centered or editorial anchor."],
    ["Excessive column count", "Reduce simultaneous content columns and prioritize scanning order over dashboard-like fragmentation."],
    ["Conflicting spacing utilities", "Keep one spacing value per property and responsive variant."],
    ["Conflicting radius utilities", "Keep one radius per corner axis and derive nested radii from outer padding."],
  ]),
  ...rules("surface", "SLOP-SURFACE", [
    ["Glassmorphism overuse", "Limit backdrop blur to transient layered surfaces and provide an opaque semantic fallback."],
    ["Heavy shadow on dark surface", "Replace heavy dark-mode shadow with a one-pixel low-alpha luminance border and adjacent surface tokens."],
    ["Decorative blur blob", "Remove decorative blur blobs; invest in hierarchy, content, and intentional surface composition."],
    ["Icon badge clutter", "Use one consistent icon family and remove repeated decorative badge containers."],
    ["Unanchored raw elevation", "Use the preset elevation token with a subtle one-pixel border instead of raw shadow-xl or shadow-2xl."],
    ["Overweight surface border", "Use the preset border-width token; heavy borders belong to deliberate brutalist systems only."],
    ["Unstructured shadow stack", "Replace ad-hoc shadow stacks with the preset’s tested elevation tokens."],
    ["Removed focus outline", "Restore a high-contrast focus-visible ring rather than suppressing outlines without a replacement."],
  ]),
  ...rules("copy", "SLOP-COPY", [
    ["Hype-led call to action", "State the user task and measurable outcome in direct language."],
    ["Revolutionary product claim", "Replace revolution language with the concrete workflow or technical capability."],
    ["Workflow superlatives", "Name the time, step, error, or quality improvement instead of promising a supercharged workflow."],
    ["Seamlessness cliché", "Name the actual integration, protocol, or setup step and its limitations."],
    ["Next-generation filler", "Describe what is different now using a verifiable product fact."],
    ["Empowerment cliché", "Say who can complete which task and what the interface does for them."],
    ["Game-changing claim", "Replace the claim with a benchmark, customer outcome, or specific differentiator."],
    ["Elevate/dive-in filler", "Use a specific verb and object that explains the next action."],
    ["Emoji bullet spam", "Replace emoji decoration with meaningful icons, labels, or concise plain text."],
    ["Vague aesthetic benefit", "Replace vague beauty claims with a concrete usability, performance, or content outcome."],
    ["Unsupported superlative", "Remove the superlative or support it with verifiable evidence and scope."],
    ["Marketing throat-clearing", "Delete filler and begin with the product, user problem, or action."],
  ]),
  ...rules("ux", "SLOP-UX", [
    ["Non-semantic click target", "Use a native button or link with keyboard behavior instead of a clickable div."],
    ["Incomplete custom control semantics", "Add tabIndex={0}, Enter/Space keyboard handling, and appropriate semantics—or use a native button."],
    ["Missing focus-visible treatment", "Add a high-contrast focus-visible ring with sufficient offset and theme parity."],
    ["Missing hover state", "Add an intentional hover state using explicit color, border, or opacity tokens."],
    ["Missing active state", "Add pressed feedback without shifting layout; use transform or explicit surface tokens."],
    ["Missing disabled state", "Style disabled controls and set the native disabled or aria-disabled behavior with readable contrast."],
    ["transition-all performance trap", "Transition only colors, opacity, or transform properties needed by the interaction."],
    ["Missing reduced-motion behavior", "Add motion-reduce:transition-none or an equivalent reduced-motion rule without removing state feedback."],
    ["Unlabelled input", "Associate a persistent label, aria-label, or aria-labelledby with the input."],
    ["Unlabelled select", "Associate a persistent label, aria-label, or aria-labelledby with the select."],
    ["Undersized pointer target", "Provide an approximately 44px pointer target or a documented dense desktop exception with keyboard support."],
    ["Positive tabindex", "Remove positive tabindex and follow DOM order for predictable keyboard navigation."],
  ]),
  ...rules("token", "SLOP-TOKEN", [
    ["Semantic token bypass", "Route component values through the selected archetype’s typed semantic tokens."],
    ["Asymmetric dark override", "Pair every dark color override with an intentional light token and verify both computed themes."],
    ["Broken surface elevation order", "Order canvas, surface-1, surface-2, interactive, and border by a consistent luminance strategy in each theme."],
    ["Missing dark token companion", "Define and verify a .dark token companion or an explicit single-theme policy."],
    ["Off-grid spacing token", "Move spacing tokens onto the four/eight-pixel scale or document the optical exception."],
    ["Non-semantic token name", "Rename implementation-only variables to semantic roles such as surface-1, text-muted, or accent."],
    ["Token type mismatch", "Match token names and $type metadata to their CSS values: colors, dimensions, durations, or shadows."],
    ["Dark override contrast failure", "Replace the dark override pair with verified dark text and surface tokens."],
  ]),
] as const;

export const DESIGN_CRAFT_RULE_COUNT = DESIGN_CRAFT_RULES.length;
const RULE_BY_ID = new Map(DESIGN_CRAFT_RULES.map((rule) => [rule.id, rule]));

export function designCraftRule(id: string): DesignCraftRule | undefined {
  return RULE_BY_ID.get(id);
}

export function pillarForRule(ruleId: string): DesignPillarId {
  if (/^(?:SLOP-COLOR|slop\/(?:cliche-gradient|neon-glow|low-contrast))/.test(ruleId)) return "color";
  if (/^(?:SLOP-TYPE|slop\/(?:display-tracking|numeric-alignment|font-weight-mixing))/.test(ruleId)) return "typography";
  if (/^(?:SLOP-LAYOUT|slop\/(?:emoji-feature-grid|radius-scale|conflicting-radius))/.test(ruleId)) return "layout";
  if (/^(?:SLOP-SURFACE|slop\/raw-elevation)/.test(ruleId)) return "surface";
  if (ruleId.startsWith("SLOP-COPY")) return "copy";
  if (ruleId.startsWith("SLOP-UX")) return "ux";
  if (ruleId.startsWith("SLOP-TOKEN")) return "token";
  return "layout";
}

export function categoryForPillar(pillar: DesignPillarId): SlopCategory {
  if (pillar === "surface") return "elevation";
  return pillar;
}

export interface CopyCliche {
  phrase: string;
  ruleId: string;
  replacement: string;
}

const COPY_GROUPS: Array<[string, string, string[]]> = [
  ["SLOP-COPY-001", "Audit the interface, apply exact file:line fixes, and verify the result.", [
    "Unleash the power", "Unlock the power", "Unlock your potential", "Unleash your potential", "Unleash the full potential",
    "Take it to the next level", "Take your product to the next level", "Transform your workflow", "Transform the way you work",
    "Reimagine your workflow", "Reimagine the future", "The future is here", "Get started today", "Try it now", "Experience the magic",
  ]],
  ["SLOP-COPY-002", "Replace manual UI review with 72 deterministic checks across seven design pillars.", [
    "Revolutionize", "Revolutionize your", "Revolutionizing", "Revolutionary", "Disrupt the industry", "Disruptive innovation",
    "A paradigm shift", "Paradigm-shifting", "Redefine the future", "Redefining the way",
  ]],
  ["SLOP-COPY-003", "Find contrast, layout, and interaction defects before design review.", [
    "Supercharge your workflow", "Supercharge your productivity", "Supercharge your team", "Boost your productivity",
    "Turbocharge your workflow", "10x your productivity", "10x your workflow", "Work smarter, not harder", "Do more with less",
    "Streamline your workflow", "Accelerate your workflow", "Skyrocket your productivity",
  ]],
  ["SLOP-COPY-004", "Connect over MCP stdio or run the CLI with Node.js 20+; no runtime dependencies.", [
    "Seamless integration", "Seamlessly integrate", "Seamless experience", "Seamlessly connect", "Frictionless experience",
    "Frictionless workflow", "Effortless integration", "Effortlessly integrate", "Plug and play", "Out-of-the-box solution",
    "Works out of the box", "One-click solution",
  ]],
  ["SLOP-COPY-005", "Export versioned tokens and compare before/after scores across seven pillars.", [
    "Next-generation", "Next generation", "Next-gen", "Cutting-edge", "Cutting edge technology", "State-of-the-art",
    "State of the art", "Future-proof", "Future-proof your", "Innovative solution", "Innovative platform", "Advanced AI-powered",
  ]],
  ["SLOP-COPY-006", "Give coding agents exact source locations and semantic token replacements.", [
    "Empowering", "Empower your team", "Empowering teams", "Empower developers", "Empowering creators", "Enable your team to",
    "Helping you achieve", "Designed to empower", "Built to empower", "For modern teams", "Built for modern", "Made for creators",
  ]],
  ["SLOP-COPY-007", "Measure the transformation with a 0–100 score and a seven-pillar scorecard.", [
    "Game-changing", "Game changer", "A game changer", "Revolutionary platform", "World-changing", "Industry-leading",
    "Best-in-class", "Best in class", "Ultimate solution", "The ultimate", "Unparalleled", "Unmatched performance",
  ]],
  ["SLOP-COPY-008", "Generate UNSLOP-REPORT.md and apply its prioritized token translations.", [
    "Dive into", "Dive deep into", "Deep dive into", "Elevate your", "Elevate your workflow", "Elevate your experience",
    "Level up your", "Level up your workflow", "Discover the power", "Explore the possibilities", "Endless possibilities",
    "Limitless possibilities", "Journey into", "Embark on a journey", "Welcome to the future", "Welcome to a new era",
  ]],
];

export const AI_COPY_CLICHES: readonly CopyCliche[] = COPY_GROUPS.flatMap(([ruleId, replacement, phrases]) =>
  phrases.map((phrase) => ({ phrase, ruleId, replacement })),
);

interface PendingCraftViolation {
  ruleId: string;
  severity: SlopSeverity;
  offset: number;
  evidence: string;
  message?: string;
  recommendation?: string;
}

class SourceIndex {
  private readonly starts = [0];
  constructor(private readonly source: string) {
    for (let index = 0; index < source.length; index += 1) if (source[index] === "\n") this.starts.push(index + 1);
  }
  location(offset: number): { line: number; column: number } {
    const safe = Math.max(0, Math.min(offset, this.source.length));
    let line = 0;
    for (let index = 1; index < this.starts.length; index += 1) {
      if ((this.starts[index] ?? 0) > safe) break;
      line = index;
    }
    return { line: line + 1, column: safe - (this.starts[line] ?? 0) + 1 };
  }
}

function classes(attributes: string): string {
  return attributes.match(/\b(?:class|className)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/)?.slice(1).find((value) => value !== undefined) ?? "";
}

function style(attributes: string): string {
  return attributes.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/)?.slice(1).find((value) => value !== undefined) ?? "";
}

function compact(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cssColor(value: string | undefined) {
  if (!value) return undefined;
  const literal = value.match(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:black|white|gray|grey)\b/i)?.[0];
  return literal ? parseColor(literal) : undefined;
}

function apcaInspiredContrast(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const polarity = bg > fg;
  const contrast = polarity
    ? (bg ** 0.56 - fg ** 0.57) * 1.14
    : (bg ** 0.65 - fg ** 0.62) * 1.14;
  return Math.abs(contrast) * 100;
}

const LEGACY_RULE_MAP: Readonly<Record<string, string>> = {
  "slop/cliche-gradient": "SLOP-COLOR-001",
  "slop/neon-glow": "SLOP-COLOR-002",
  "slop/low-contrast": "SLOP-COLOR-005",
  "slop/display-tracking": "SLOP-TYPE-009",
  "slop/numeric-alignment": "SLOP-TYPE-004",
  "slop/font-weight-mixing": "SLOP-TYPE-008",
  "slop/emoji-feature-grid": "SLOP-LAYOUT-001",
  "slop/off-grid-spacing": "SLOP-LAYOUT-003",
  "slop/radius-scale": "SLOP-LAYOUT-004",
  "slop/conflicting-spacing": "SLOP-LAYOUT-009",
  "slop/conflicting-radius": "SLOP-LAYOUT-010",
  "slop/raw-elevation": "SLOP-SURFACE-005",
};

function modernizeLegacy(legacy: readonly SlopViolation[]): SlopViolation[] {
  return legacy.flatMap((violation) => {
    const id = LEGACY_RULE_MAP[violation.ruleId];
    const rule = id ? designCraftRule(id) : undefined;
    if (!id || !rule) return [];
    return [{
      ...violation,
      ruleId: id,
      pillar: rule.pillar,
      category: categoryForPillar(rule.pillar),
      message: `${rule.title}: ${violation.message}`,
      recommendation: rule.recommendation,
    }];
  });
}

/** Run the canonical v2 detectors and map legacy findings into the seven pillars. */
export function analyzeDesignCraft(
  source: string,
  filePath: string,
  legacy: readonly SlopViolation[],
): SlopViolation[] {
  const pending: PendingCraftViolation[] = [];
  const add = (violation: PendingCraftViolation): void => {
    if (designCraftRule(violation.ruleId)) pending.push(violation);
  };
  const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
  const tagPattern = /<([A-Za-z][\w:.-]*)(\s[^<>]*?)?>/g;
  const tags = [...uncommented.matchAll(tagPattern)];
  const globalFocus = /:focus-visible|focus-visible:/.test(uncommented);
  const globalHover = /:hover|hover:/.test(uncommented);
  const globalActive = /:active|active:/.test(uncommented);
  const globalDisabled = /:disabled|disabled:/.test(uncommented);
  const labelFors = new Set([...uncommented.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]));

  for (const match of tags) {
    const tag = (match[1] ?? "").toLowerCase();
    const attributes = match[2] ?? "";
    const classNames = classes(attributes);
    const inline = style(attributes);
    const offset = match.index;

    if (/^(?:h1|h2)$/.test(tag) && /(?:^|\s)(?:[\w-]+:)*text-(?:4xl|5xl|6xl|7xl|8xl|9xl|\[(?:3[2-9]|[4-9]\d|\d{3,})px\])(?:\s|$)/.test(classNames) && !/(?:clamp\(|sm:|md:|lg:)/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-001", severity: "warning", offset, evidence: classNames, message: "Display type is fixed rather than fluid across viewports." });
    }
    if (/^(?:h1|h2)$/.test(tag) && /(?:leading-loose|leading-relaxed)/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-006", severity: "warning", offset, evidence: classNames });
    }
    if (tag === "p" && /(?:leading-none|leading-tight)/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-005", severity: "warning", offset, evidence: classNames });
    }
    if (/(?:text-\[(?:[0-9](?:\.\d+)?|10(?:\.\d+)?|11(?:\.\d+)?)px\])/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-007", severity: "warning", offset, evidence: classNames });
    }
    if (/\buppercase\b/.test(classNames) && !/\btracking-(?:wide|wider|widest|\[[^\]]+\])\b/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-010", severity: "info", offset, evidence: classNames });
    }
    if (/^(?:div|section|article|main)$/.test(tag) && /(?:^|\s)(?:[\w-]+:)*rounded-3xl(?:\s|$)/.test(classNames)) {
      add({ ruleId: "SLOP-LAYOUT-004", severity: "warning", offset, evidence: classNames });
    }
    if (tag === "main" && classNames && !/(?:max-w-|container|mx-auto|max-width)/.test(`${classNames} ${inline}`)) {
      add({ ruleId: "SLOP-LAYOUT-007", severity: "warning", offset, evidence: classNames });
    }
    const columns = classNames.match(/(?:^|\s)grid-cols-([5-9]|1[3-9]|[2-9]\d)(?:\s|$)/)?.[1];
    if (columns) add({ ruleId: "SLOP-LAYOUT-008", severity: "info", offset, evidence: `grid-cols-${columns}` });
    if (/grid-cols-\[(?!(?:repeat\((?:8|12|16|24),|subgrid))/.test(classNames)) {
      add({ ruleId: "SLOP-LAYOUT-006", severity: "info", offset, evidence: classNames });
    }
    if (/bg-(?:black|(?:slate|gray|zinc|neutral)-(?:900|950))/.test(classNames) && /shadow-(?:xl|2xl)/.test(classNames) && !/border(?:-white\/(?:5|10|15|20)|-\[1px\])/.test(classNames)) {
      add({ ruleId: "SLOP-SURFACE-002", severity: "warning", offset, evidence: classNames });
    }
    if (/blur-3xl/.test(classNames) && /opacity-(?:[12345]0|\[[^\]]+\])/.test(classNames)) {
      add({ ruleId: "SLOP-SURFACE-003", severity: "warning", offset, evidence: classNames });
    }
    if (/border-(?:4|8)(?:\s|$)/.test(classNames)) {
      add({ ruleId: "SLOP-SURFACE-006", severity: "info", offset, evidence: classNames });
    }
    const arbitraryShadow = classNames.match(/shadow-\[([^\]]+)\]/)?.[1];
    if (arbitraryShadow && arbitraryShadow.split("_,").length > 2) {
      add({ ruleId: "SLOP-SURFACE-007", severity: "info", offset, evidence: arbitraryShadow });
    }
    if (/outline-none/.test(classNames) && !/(?:focus-visible:|focus:ring|focus-visible\s*\{)/.test(`${classNames} ${uncommented}`)) {
      add({ ruleId: "SLOP-SURFACE-008", severity: "error", offset, evidence: classNames });
    }
    if (/text-(?:white|black|(?:slate|gray|zinc|neutral)-\d{3})\/(?:[1-4]0|50)\b/.test(classNames)) {
      add({ ruleId: "SLOP-COLOR-009", severity: "warning", offset, evidence: classNames });
    }
    if (/bg-clip-text/.test(classNames) && /text-transparent/.test(classNames)) {
      add({ ruleId: "SLOP-COLOR-010", severity: "warning", offset, evidence: classNames });
    }
    const tailwindForeground = classNames.match(/(?:^|\s)text-(black|white)(?:\s|$)/)?.[1];
    const tailwindBackground = classNames.match(/(?:^|\s)bg-(black|white)(?:\s|$)/)?.[1];
    if (tailwindForeground && tailwindBackground && tailwindForeground !== tailwindBackground) {
      add({ ruleId: "SLOP-COLOR-003", severity: "info", offset, evidence: `text-${tailwindForeground} bg-${tailwindBackground}` });
    }
    const grayPair = classNames.match(/text-(gray|slate|zinc|neutral)-(300|400|500|600)\s+[^"']*bg-\1-(50|100|200|700|800|900)/);
    if (grayPair) {
      add({ ruleId: "SLOP-COLOR-004", severity: "warning", offset, evidence: grayPair[0] });
    }
    if (/bg-black(?:\s|$)/.test(classNames) && /^(?:main|body|section)$/.test(tag)) {
      add({ ruleId: "SLOP-COLOR-012", severity: "info", offset, evidence: classNames });
    }

    const foreground = cssColor(inline.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1]);
    const background = cssColor(inline.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i)?.[1]);
    if (foreground && background) {
      const fgHex = inline.match(/(?:^|;)\s*color\s*:\s*(#[\da-f]{3,8})/i)?.[1];
      const bgHex = inline.match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[\da-f]{3,8})/i)?.[1];
      if (fgHex && bgHex) {
        const pair = `${fgHex} on ${bgHex}`;
        const absolutePolarity = (value: string): boolean => /^#(?:000000|000|ffffff|fff)$/i.test(value);
        if (absolutePolarity(fgHex) && absolutePolarity(bgHex)) {
          add({ ruleId: "SLOP-COLOR-003", severity: "info", offset, evidence: pair });
        }
        const ratio = contrastRatio(fgHex, bgHex);
        const size = Number.parseFloat(inline.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ?? "16");
        const weight = Number.parseInt(inline.match(/font-weight\s*:\s*(\d{3})/i)?.[1] ?? "400", 10);
        const required = requiredContrastRatio(size, weight);
        if (ratio < required) add({ ruleId: "SLOP-COLOR-005", severity: "error", offset, evidence: pair, message: `Inline text contrast is ${ratio.toFixed(2)}:1; ${required}:1 is required.` });
        if (ratio >= required && ratio < (required === 3 ? 4.5 : 7)) add({ ruleId: "SLOP-COLOR-006", severity: "info", offset, evidence: pair });
        if (apcaInspiredContrast(fgHex, bgHex) < (required === 3 ? 45 : 60)) add({ ruleId: "SLOP-COLOR-007", severity: "warning", offset, evidence: pair, message: `APCA-inspired perceptual contrast is weak for ${pair}.` });
        if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(fgHex) && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(bgHex)) {
          const fg = parseColor(fgHex);
          const bg = parseColor(bgHex);
          if (fg && bg && fg.r === fg.g && fg.g === fg.b && bg.r === bg.g && bg.g === bg.b && ratio < 4.5) {
            add({ ruleId: "SLOP-COLOR-004", severity: "warning", offset, evidence: pair });
          }
        }
      }
    }

    const isButtonOrLink = tag === "button" || tag === "a";
    const isNativeControl = isButtonOrLink || tag === "input" || tag === "select";
    if (tag === "div" && /\bonClick\s*=/.test(attributes) && !/\brole\s*=/.test(attributes)) {
      add({ ruleId: "SLOP-UX-001", severity: "error", offset, evidence: compact(match[0]) });
    }
    if (/\brole\s*=\s*["']button["']/.test(attributes) && !/\btabIndex\s*=|\btabindex\s*=/.test(attributes)) {
      add({ ruleId: "SLOP-UX-002", severity: "error", offset, evidence: compact(match[0]) });
    }
    if (isNativeControl && !globalFocus && !/focus-visible:/.test(classNames)) {
      add({ ruleId: "SLOP-UX-003", severity: "error", offset, evidence: classNames || `<${tag}>` });
    }
    if (isNativeControl && !globalHover && !/hover:/.test(classNames)) {
      add({ ruleId: "SLOP-UX-004", severity: "warning", offset, evidence: classNames });
    }
    if (isNativeControl && !globalActive && !/active:/.test(classNames)) {
      add({ ruleId: "SLOP-UX-005", severity: "warning", offset, evidence: classNames });
    }
    if (isNativeControl && !globalDisabled && !/disabled:/.test(classNames)) {
      add({ ruleId: "SLOP-UX-006", severity: "warning", offset, evidence: classNames });
    }
    if (/transition-all\b/.test(classNames)) {
      add({ ruleId: "SLOP-UX-007", severity: "warning", offset, evidence: classNames });
    }
    if (/transition(?:-|\s|\[)/.test(classNames) && !/motion-reduce:(?:transition-none|transform-none)/.test(classNames) && !/prefers-reduced-motion/.test(uncommented)) {
      add({ ruleId: "SLOP-UX-008", severity: "warning", offset, evidence: classNames });
    }
    if ((tag === "input" || tag === "select") && !/\btype\s*=\s*["']hidden["']/.test(attributes) && !/\b(?:aria-label|aria-labelledby)\s*=/.test(attributes)) {
      const id = attributes.match(/\bid\s*=\s*["']([^"']+)["']/)?.[1];
      if (!id || !labelFors.has(id)) add({ ruleId: tag === "input" ? "SLOP-UX-009" : "SLOP-UX-010", severity: "error", offset, evidence: compact(match[0]) });
    }
    if (isButtonOrLink && /(?:^|\s)(?:p-1|h-4|w-4|size-4)(?:\s|$)/.test(classNames) && !/(?:min-h-11|min-w-11|h-11|w-11|p-3|p-4)/.test(classNames)) {
      add({ ruleId: "SLOP-UX-011", severity: "warning", offset, evidence: classNames });
    }
    if (/\btabIndex\s*=\s*\{?[1-9]|\btabindex\s*=\s*["']?[1-9]/.test(attributes)) {
      add({ ruleId: "SLOP-UX-012", severity: "error", offset, evidence: compact(match[0]) });
    }
    if (/\b(?:dark:)?(?:bg|text|border)-\[#|style=/.test(match[0])) {
      const literals = match[0].match(/#[\da-f]{3,8}\b|rgba?\([^)]*\)/gi) ?? [];
      for (const literal of literals) {
        add({ ruleId: "SLOP-COLOR-008", severity: "warning", offset, evidence: literal });
        add({ ruleId: "SLOP-TOKEN-001", severity: "warning", offset, evidence: literal });
      }
    }
  }

  const headingWeights = tags.filter((match) => /^h[1-3]$/i.test(match[1] ?? "")).map((match) => classes(match[2] ?? "").match(/\bfont-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/)?.[0]).filter((value): value is string => Boolean(value));
  if (headingWeights.length >= 2 && new Set(headingWeights).size === 1) {
    add({ ruleId: "SLOP-TYPE-002", severity: "info", offset: tags.find((match) => /^h[1-3]$/i.test(match[1] ?? ""))?.index ?? 0, evidence: headingWeights.join(", ") });
  }

  const paragraphPattern = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
  for (const match of uncommented.matchAll(paragraphPattern)) {
    const attributes = match[1] ?? "";
    const classNames = classes(attributes);
    const text = (match[2] ?? "").replace(/<[^>]+>/g, " ").trim();
    const declaredCh = Number.parseFloat((style(attributes).match(/max-width\s*:\s*(\d+(?:\.\d+)?)ch/i)?.[1]) ?? "0");
    if ((declaredCh > 75 || /(?:w-full|max-w-none)/.test(classNames) || (text.length > 320 && !/max-w-|max-width/.test(`${classNames} ${style(attributes)}`))) && !/max-w-prose|max-w-(?:xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)/.test(classNames)) {
      add({ ruleId: "SLOP-TYPE-003", severity: "warning", offset: match.index, evidence: compact(match[0]) });
    }
  }

  const gridPattern = /grid-cols-3|repeat\(\s*3\s*,/g;
  for (const match of uncommented.matchAll(gridPattern)) {
    const nearby = uncommented.slice(Math.max(0, match.index - 1200), Math.min(uncommented.length, match.index + 3000));
    if (/text-center|text-align\s*:\s*center/.test(nearby) && /rounded-2xl/.test(nearby) && /shadow-xl/.test(nearby)) {
      add({ ruleId: "SLOP-LAYOUT-001", severity: "warning", offset: match.index, evidence: compact(nearby) });
    }
  }
  const centered = [...uncommented.matchAll(/\btext-center\b/g)];
  if (centered.length >= 3) add({ ruleId: "SLOP-LAYOUT-005", severity: "info", offset: centered[2]?.index ?? 0, evidence: `${centered.length} centered regions` });

  let cardDepth = 0;
  const cardTag = /<(div|section|article)\b([^>]*)>|<\/(div|section|article)>/gi;
  for (const match of uncommented.matchAll(cardTag)) {
    if (match[3]) { cardDepth = Math.max(0, cardDepth - 1); continue; }
    const classNames = classes(match[2] ?? "");
    const isCard = /\bcard\b|(?:rounded-(?:xl|2xl|3xl).*shadow|shadow.*rounded-(?:xl|2xl|3xl))/.test(classNames);
    if (isCard) {
      cardDepth += 1;
      if (cardDepth >= 3) add({ ruleId: "SLOP-LAYOUT-002", severity: "warning", offset: match.index, evidence: classNames });
    }
  }

  const blurs = [...uncommented.matchAll(/backdrop-blur(?:-|\b)/g)];
  if (blurs.length >= 2) add({ ruleId: "SLOP-SURFACE-001", severity: "warning", offset: blurs[1]?.index ?? 0, evidence: `${blurs.length} backdrop blur surfaces` });
  const badges = [...uncommented.matchAll(/<(?:span|div)\b[^>]*(?:rounded-full|icon-badge)[^>]*>/gi)];
  if (badges.length >= 4) add({ ruleId: "SLOP-SURFACE-004", severity: "info", offset: badges[3]?.index ?? 0, evidence: `${badges.length} repeated icon badges` });

  const accents = new Set([...uncommented.matchAll(/\b(?:text|bg|border)-(red|orange|yellow|green|cyan|blue|indigo|purple|violet|fuchsia)-(?:400|500|600)\b/g)].map((match) => match[1]));
  if (accents.size >= 4) add({ ruleId: "SLOP-COLOR-011", severity: "info", offset: uncommented.search(/(?:text|bg|border)-(?:red|orange|yellow|green|cyan|blue|indigo|purple|violet|fuchsia)-/), evidence: [...accents].join(", ") });

  for (const cliche of AI_COPY_CLICHES) {
    const expression = new RegExp(`\\b${escapeRegExp(cliche.phrase)}\\b`, "gi");
    for (const match of uncommented.matchAll(expression)) {
      const rule = designCraftRule(cliche.ruleId);
      add({ ruleId: cliche.ruleId, severity: "warning", offset: match.index, evidence: match[0], message: `AI marketing cliché detected: “${match[0]}”.`, recommendation: `${rule?.recommendation ?? "Use concrete product language."} Suggested direction: “${cliche.replacement}”.` });
    }
  }
  const emoji = [...uncommented.matchAll(/[🚀✨⚡🔥💡]/gu)];
  if (emoji.length >= 3) add({ ruleId: "SLOP-COPY-009", severity: "warning", offset: emoji[2]?.index ?? 0, evidence: emoji.slice(0, 12).join(" ") });
  for (const match of uncommented.matchAll(/\b(?:beautiful|stunning|modern|delightful)\b/gi)) {
    add({ ruleId: "SLOP-COPY-010", severity: "info", offset: match.index, evidence: match[0] });
  }
  for (const match of uncommented.matchAll(/\b(?:world-class|perfect|ultimate|best-in-class)\b/gi)) {
    add({ ruleId: "SLOP-COPY-011", severity: "warning", offset: match.index, evidence: match[0] });
  }
  for (const match of uncommented.matchAll(/\b(?:in today's fast-paced world|in the ever-evolving|look no further|welcome to)\b/gi)) {
    add({ ruleId: "SLOP-COPY-012", severity: "info", offset: match.index, evidence: match[0] });
  }

  for (const match of uncommented.matchAll(/\bdark:(bg|text|border)-([\w[\]#/%.-]+)/g)) {
    const property = match[1] ?? "";
    const base = new RegExp(`(?<!dark:)\\b${property}-[\\w[\\]#/%.-]+`);
    if (!base.test(uncommented)) add({ ruleId: "SLOP-TOKEN-002", severity: "warning", offset: match.index, evidence: match[0] });
  }
  if (/:root\s*\{[^}]*--(?:color|surface|background|text)-/i.test(uncommented) && !/(?:\.dark\s*\{|prefers-color-scheme\s*:\s*dark)/i.test(uncommented)) {
    add({ ruleId: "SLOP-TOKEN-004", severity: "warning", offset: uncommented.search(/:root/), evidence: ":root color tokens without .dark" });
  }
  for (const match of uncommented.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)) {
    const name = match[1] ?? "";
    const value = (match[2] ?? "").trim();
    const pixels = Number.parseFloat(value.match(/^(\d+(?:\.\d+)?)px$/)?.[1] ?? "0");
    if (/(?:space|spacing|gap|inset)/.test(name) && pixels > 2 && pixels % 4 !== 0) {
      add({ ruleId: "SLOP-TOKEN-005", severity: "warning", offset: match.index, evidence: `${name}: ${value}` });
    }
    if (/^--(?:foo|bar|baz|color\d*|spacing\d*|value\d*)$/i.test(name)) {
      add({ ruleId: "SLOP-TOKEN-006", severity: "info", offset: match.index, evidence: name });
    }
    if ((/--color-/.test(name) && /^\d+(?:\.\d+)?(?:px|rem|em|ms|s)$/.test(value)) || (/--(?:space|spacing)-/.test(name) && parseColor(value))) {
      add({ ruleId: "SLOP-TOKEN-007", severity: "error", offset: match.index, evidence: `${name}: ${value}` });
    }
  }

  const cssBlocks = /([^{}]+)\{([^{}]*)\}/g;
  const themeSurfaces: Record<string, string> = {};
  for (const match of uncommented.matchAll(cssBlocks)) {
    const selector = (match[1] ?? "").trim();
    const body = match[2] ?? "";
    const offset = match.index + match[0].indexOf("{") + 1;
    for (const variable of body.matchAll(/(--(?:surface-0|surface-1|surface-elevated|color-background|color-surface|color-surface-elevated))\s*:\s*([^;]+)/gi)) {
      themeSurfaces[variable[1] ?? ""] = (variable[2] ?? "").trim();
    }
    const cssForeground = body.match(/(?:^|;)\s*color\s*:\s*(#[\da-f]{3,8})\b/i)?.[1];
    const cssBackground = body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[\da-f]{3,8})\b/i)?.[1];
    if (cssForeground && cssBackground) {
      const pair = `${cssForeground} on ${cssBackground}`;
      const size = Number.parseFloat(body.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ?? "16");
      const weight = Number.parseInt(body.match(/font-weight\s*:\s*(\d{3})/i)?.[1] ?? "400", 10);
      const required = requiredContrastRatio(size, weight);
      const ratio = contrastRatio(cssForeground, cssBackground);
      if (ratio < required) add({ ruleId: "SLOP-COLOR-005", severity: "error", offset, evidence: pair });
      if (ratio >= required && ratio < (required === 3 ? 4.5 : 7)) add({ ruleId: "SLOP-COLOR-006", severity: "info", offset, evidence: pair });
      if (apcaInspiredContrast(cssForeground, cssBackground) < (required === 3 ? 45 : 60)) {
        add({ ruleId: "SLOP-COLOR-007", severity: "warning", offset, evidence: pair });
      }
      if (/^#(?:000000|000|ffffff|fff)$/i.test(cssForeground) && /^#(?:000000|000|ffffff|fff)$/i.test(cssBackground)) {
        add({ ruleId: "SLOP-COLOR-003", severity: "info", offset, evidence: pair });
      }
    }
    if (/^(?:h1|h2)(?:$|[\s.#:[])/i.test(selector)) {
      const fixedSize = Number.parseFloat(body.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1] ?? "0");
      if (fixedSize >= 32 && !/clamp\(|var\(/.test(body)) add({ ruleId: "SLOP-TYPE-001", severity: "warning", offset, evidence: compact(`${selector} { ${body} }`) });
      const leading = Number.parseFloat(body.match(/line-height\s*:\s*(\d+(?:\.\d+)?)(?:\s|;|$)/i)?.[1] ?? "0");
      if (leading > 1.4) add({ ruleId: "SLOP-TYPE-006", severity: "warning", offset, evidence: compact(`${selector} { ${body} }`) });
    }
    if (/^(?:p|article|\.prose)(?:$|[\s.#:[])/i.test(selector)) {
      const leading = Number.parseFloat(body.match(/line-height\s*:\s*(\d+(?:\.\d+)?)(?:\s|;|$)/i)?.[1] ?? "0");
      if (leading > 0 && leading < 1.4) add({ ruleId: "SLOP-TYPE-005", severity: "warning", offset, evidence: compact(`${selector} { ${body} }`) });
      const measure = Number.parseFloat(body.match(/max-width\s*:\s*(\d+(?:\.\d+)?)ch/i)?.[1] ?? "0");
      if (measure > 75) add({ ruleId: "SLOP-TYPE-003", severity: "warning", offset, evidence: compact(`${selector} { ${body} }`) });
    }
    if (!/^(?::root|\.dark|html|body)$/.test(selector)) {
      for (const declaration of body.matchAll(/(?:^|;)\s*(color|background(?:-color)?|border-color)\s*:\s*(#[\da-f]{3,8}\b|rgba?\([^)]*\))/gi)) {
        add({ ruleId: "SLOP-COLOR-008", severity: "warning", offset, evidence: declaration[2] ?? "" });
        add({ ruleId: "SLOP-TOKEN-001", severity: "warning", offset, evidence: declaration[2] ?? "" });
      }
    }
    if (/\.dark\b/.test(selector)) {
      const fg = cssColor(body.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)?.[1]);
      const bg = cssColor(body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i)?.[1]);
      if (fg && bg && contrastRatio(fg, bg) < 4.5) add({ ruleId: "SLOP-TOKEN-008", severity: "error", offset, evidence: compact(`${selector} { ${body} }`) });
    }
  }
  const canvas = themeSurfaces["--surface-0"] ?? themeSurfaces["--color-background"];
  const surface = themeSurfaces["--surface-1"] ?? themeSurfaces["--color-surface"];
  const elevated = themeSurfaces["--surface-elevated"] ?? themeSurfaces["--color-surface-elevated"];
  if (canvas && surface && elevated && parseColor(canvas) && parseColor(surface) && parseColor(elevated)) {
    const first = relativeLuminance(surface) - relativeLuminance(canvas);
    const second = relativeLuminance(elevated) - relativeLuminance(surface);
    if (first !== 0 && second !== 0 && Math.sign(first) !== Math.sign(second)) {
      add({ ruleId: "SLOP-TOKEN-003", severity: "error", offset: uncommented.indexOf(canvas), evidence: `${canvas} → ${surface} → ${elevated}` });
    }
  }

  const index = new SourceIndex(source);
  const custom = pending.map((violation): SlopViolation => {
    const rule = designCraftRule(violation.ruleId);
    if (!rule) throw new Error(`Unknown design craft rule: ${violation.ruleId}`);
    const location = index.location(violation.offset);
    return {
      ruleId: rule.id,
      pillar: rule.pillar,
      category: categoryForPillar(rule.pillar),
      severity: violation.severity,
      file: filePath.split("\\").join("/"),
      line: location.line,
      column: location.column,
      message: violation.message ?? `${rule.title}.`,
      evidence: compact(violation.evidence),
      recommendation: violation.recommendation ?? rule.recommendation,
    };
  });
  return [...modernizeLegacy(legacy), ...custom];
}

export interface PillarScore {
  id: DesignPillarId;
  code: string;
  name: string;
  score: number;
  grade: string;
  violations: number;
}

function grade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function calculatePillarScores(violations: readonly SlopViolation[]): PillarScore[] {
  return DESIGN_PILLARS.map((pillar) => {
    const relevant = violations.filter((violation) => violation.ruleId.startsWith(pillar.code));
    const deduction = relevant.reduce((total, violation) => total + (violation.severity === "error" ? 12 : violation.severity === "warning" ? 6 : 2), 0);
    const score = Math.max(0, Math.min(100, Math.round(100 - deduction)));
    return { id: pillar.id, code: pillar.code, name: pillar.name, score, grade: grade(score), violations: relevant.length };
  });
}

export function calculateDesignCraftScore(violations: readonly SlopViolation[]): number {
  const scores = calculatePillarScores(violations);
  return Math.max(0, Math.min(100, Math.round(scores.reduce((total, pillar) => total + pillar.score, 0) / scores.length)));
}
