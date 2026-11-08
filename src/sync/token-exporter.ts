import { validatePreset, type DesignPreset } from "../presets/index.js";

interface ColorTokens {
  surface0: string;
  surface1: string;
  surfaceElevated: string;
  textPrimary: string;
  textMuted: string;
  borderSubtle: string;
  accent: string;
  accentForeground: string;
  interactive?: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  focus?: string;
}

function kebabCase(value: string): string {
  return value.replace(/([a-z\d])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
}

function selectedColors(preset: DesignPreset): ColorTokens {
  const colors = preset.tokens.colors;
  return {
    surface0: colors.background,
    surface1: colors.surface,
    surfaceElevated: colors.surfaceElevated,
    textPrimary: colors.text,
    textMuted: colors.textMuted,
    borderSubtle: colors.border,
    accent: colors.accent,
    accentForeground: colors.accentText,
    ...(colors.interactive ? { interactive: colors.interactive } : {}),
    ...(colors.success ? { success: colors.success } : {}),
    ...(colors.warning ? { warning: colors.warning } : {}),
    ...(colors.danger ? { danger: colors.danger } : {}),
    ...(colors.info ? { info: colors.info } : {}),
    ...(colors.focus ? { focus: colors.focus } : {}),
  };
}

function darkColors(preset: DesignPreset): ColorTokens {
  const selected = selectedColors(preset);
  if (preset.tokens.colorScheme === "dark") return selected;
  const explicit = preset.tokens.darkColors;
  if (explicit) {
    return {
      surface0: explicit.background,
      surface1: explicit.surface,
      surfaceElevated: explicit.surfaceElevated,
      textPrimary: explicit.text,
      textMuted: explicit.textMuted,
      borderSubtle: explicit.border,
      accent: explicit.accent,
      accentForeground: explicit.accentText,
      ...(explicit.interactive ? { interactive: explicit.interactive } : {}),
      ...(explicit.success ? { success: explicit.success } : {}),
      ...(explicit.warning ? { warning: explicit.warning } : {}),
      ...(explicit.danger ? { danger: explicit.danger } : {}),
      ...(explicit.info ? { info: explicit.info } : {}),
      ...(explicit.focus ? { focus: explicit.focus } : {}),
    };
  }
  // A deterministic dark companion for light-only legacy presets. The original dark
  // text becomes the canvas, the light canvas becomes text, and intermediate
  // surfaces/muted copy are mixed from those verified source colors.
  return {
    surface0: selected.textPrimary,
    surface1: `color-mix(in srgb, ${selected.textPrimary} 94%, ${selected.surface0})`,
    surfaceElevated: `color-mix(in srgb, ${selected.textPrimary} 88%, ${selected.surface0})`,
    textPrimary: selected.surface0,
    textMuted: `color-mix(in srgb, ${selected.surface0} 72%, ${selected.textMuted})`,
    borderSubtle: "rgba(255, 255, 255, 0.14)",
    accent: selected.accent,
    accentForeground: selected.accentForeground,
  };
}

function colorEntries(colors: ColorTokens): Array<[string, string]> {
  const entries: Array<[string, string | undefined]> = [
    ["surface-0", colors.surface0],
    ["surface-1", colors.surface1],
    ["surface-elevated", colors.surfaceElevated],
    ["interactive", colors.interactive],
    ["text-primary", colors.textPrimary],
    ["text-muted", colors.textMuted],
    ["border-subtle", colors.borderSubtle],
    ["accent", colors.accent],
    ["accent-foreground", colors.accentForeground],
    ["focus", colors.focus],
    ["success", colors.success],
    ["warning", colors.warning],
    ["danger", colors.danger],
    ["info", colors.info],
  ];
  return entries.filter((entry): entry is [string, string] => typeof entry[1] === "string");
}

function renderTheme(preset: DesignPreset): string {
  const { tokens } = preset;
  const lines = [
    "@theme {",
    ...colorEntries(selectedColors(preset)).map(([name, value]) => `  --color-${name}: ${value};`),
    `  --font-display: ${tokens.typography.displayFamily ?? tokens.typography.fontFamily};`,
    `  --font-body: ${tokens.typography.bodyFamily ?? tokens.typography.fontFamily};`,
    `  --font-mono: ${tokens.typography.monospaceFamily};`,
    ...Object.entries(tokens.typography.scale).map(
      ([name, value]) => `  --text-${kebabCase(name)}: ${value};`,
    ),
    `  --tracking-display: ${tokens.typography.displayTracking};`,
    `  --tracking-body: ${tokens.typography.bodyTracking};`,
    ...Object.entries(tokens.typography.weights).map(
      ([name, value]) => `  --font-weight-${kebabCase(name)}: ${value};`,
    ),
    ...Object.entries(tokens.radii).map(
      ([name, value]) => `  --radius-${kebabCase(name)}: ${value};`,
    ),
    ...Object.entries(tokens.shadows).map(
      ([name, value]) => `  --shadow-${kebabCase(name)}: ${value};`,
    ),
    `  --spacing: ${tokens.spacing.base}px;`,
    ...tokens.spacing.scale.map(
      (value) => `  --spacing-${String(value).replace(/\./g, "-")}: ${value}px;`,
    ),
    `  --ease-default: ${tokens.motion.easing};`,
    `  --duration-default: ${tokens.motion.duration};`,
    `  --container-content: ${tokens.layout.maxWidth};`,
  ];
  if (tokens.effects?.backdropBlur) {
    lines.push(`  --blur-glass: ${tokens.effects.backdropBlur};`);
  }
  lines.push("}");
  return lines.join("\n");
}

function renderRoot(preset: DesignPreset): string {
  const { tokens } = preset;
  const lines = [
    ":root {",
    `  color-scheme: ${tokens.colorScheme};`,
    ...colorEntries(selectedColors(preset)).map(([name, value]) => `  --${name}: ${value};`),
    `  --font-display: ${tokens.typography.displayFamily ?? tokens.typography.fontFamily};`,
    `  --font-body: ${tokens.typography.bodyFamily ?? tokens.typography.fontFamily};`,
    `  --font-mono: ${tokens.typography.monospaceFamily};`,
    `  --font-numeric: ${tokens.typography.numericVariant};`,
    ...Object.entries(tokens.typography.scale).map(
      ([name, value]) => `  --text-${kebabCase(name)}: ${value};`,
    ),
    `  --tracking-display: ${tokens.typography.displayTracking};`,
    `  --tracking-body: ${tokens.typography.bodyTracking};`,
    ...Object.entries(tokens.typography.weights).map(
      ([name, value]) => `  --font-weight-${kebabCase(name)}: ${value};`,
    ),
    ...Object.entries(tokens.radii).map(
      ([name, value]) => `  --radius-${kebabCase(name)}: ${value};`,
    ),
    ...Object.entries(tokens.shadows).map(
      ([name, value]) => `  --shadow-${kebabCase(name)}: ${value};`,
    ),
    `  --spacing-base: ${tokens.spacing.base}px;`,
    ...tokens.spacing.scale.map(
      (value) => `  --spacing-${String(value).replace(/\./g, "-")}: ${value}px;`,
    ),
    `  --ease-default: ${tokens.motion.easing};`,
    `  --duration-default: ${tokens.motion.duration};`,
    `  --content-max: ${tokens.layout.maxWidth};`,
    `  --layout-columns: ${tokens.layout.columns};`,
    `  --grid-gap: ${tokens.layout.gridGap};`,
    `  --content-inset: ${tokens.layout.contentInset};`,
    `  --border-width: ${tokens.layout.borderWidth};`,
  ];
  if (tokens.effects?.backdropBlur) {
    lines.push(`  --backdrop-blur: ${tokens.effects.backdropBlur};`);
  }
  if (tokens.effects?.backdropSaturation) {
    lines.push(`  --backdrop-saturation: ${tokens.effects.backdropSaturation};`);
  }
  if (tokens.motion.spring) {
    lines.push(
      `  --spring-mass: ${tokens.motion.spring.mass};`,
      `  --spring-stiffness: ${tokens.motion.spring.stiffness};`,
      `  --spring-damping: ${tokens.motion.spring.damping};`,
    );
  }
  lines.push("}");
  return lines.join("\n");
}

function renderDark(preset: DesignPreset): string {
  return [
    ".dark {",
    "  color-scheme: dark;",
    ...colorEntries(darkColors(preset)).flatMap(([name, value]) => [
      `  --${name}: ${value};`,
      `  --color-${name}: ${value};`,
    ]),
    "}",
  ].join("\n");
}

/**
 * Generate a deterministic Tailwind v4 theme plus standalone semantic CSS
 * variables. No Tailwind installation or build plugin is required.
 */
export function renderTokenStylesheet(input: DesignPreset): string {
  const preset = validatePreset(input);
  return [
    "/**",
    ` * unslop · ${preset.title}`,
    " * Tailwind v4 theme and framework-agnostic semantic tokens.",
    " * Generated deterministically; edit the preset source rather than this file.",
    " */",
    "",
    renderTheme(preset),
    "",
    renderRoot(preset),
    "",
    renderDark(preset),
    "",
  ].join("\n");
}

export const exportTokens = renderTokenStylesheet;

export const TOKEN_EXPORT_FORMATS = ["tailwind-v4", "tailwind-v3", "css", "w3c-json"] as const;
export type TokenExportFormat = (typeof TOKEN_EXPORT_FORMATS)[number];

export function normalizeTokenExportFormat(value: string): TokenExportFormat {
  const normalized = value.trim().toLowerCase();
  if (["tailwind-v4", "tailwind4", "v4", "theme"].includes(normalized)) return "tailwind-v4";
  if (["tailwind-v3", "tailwind3", "v3", "config"].includes(normalized)) return "tailwind-v3";
  if (["css", "tokens.css", "custom-properties", "variables"].includes(normalized)) return "css";
  if (["w3c-json", "w3c", "json", "tokens.json"].includes(normalized)) return "w3c-json";
  throw new Error(`Unknown token format "${value}". Available formats: ${TOKEN_EXPORT_FORMATS.join(", ")}.`);
}

/** Tailwind v4 @theme only; use renderTokenStylesheet for theme plus root/dark CSS. */
export function renderTailwindV4Theme(input: DesignPreset): string {
  return `${renderTheme(validatePreset(input))}\n`;
}

/** Standalone CSS custom properties with explicit theme companions. */
export function renderCSSCustomProperties(input: DesignPreset): string {
  const preset = validatePreset(input);
  return [
    "/** unslop semantic CSS custom properties · generated deterministically. */",
    "",
    renderRoot(preset),
    "",
    renderDark(preset),
    "",
  ].join("\n");
}

function fontFamily(value: string): string[] {
  return value.split(",").map((family) => family.trim().replace(/^['"]|['"]$/g, ""));
}

/** Tailwind v3 configuration fragment using semantic utilities. */
export function renderTailwindV3Config(input: DesignPreset): string {
  const preset = validatePreset(input);
  const { tokens } = preset;
  const fragment = {
    theme: {
      extend: {
        colors: Object.fromEntries(colorEntries(selectedColors(preset))),
        fontFamily: {
          display: fontFamily(tokens.typography.displayFamily ?? tokens.typography.fontFamily),
          body: fontFamily(tokens.typography.bodyFamily ?? tokens.typography.fontFamily),
          mono: fontFamily(tokens.typography.monospaceFamily),
        },
        fontSize: Object.fromEntries(Object.entries(tokens.typography.scale).map(([name, value]) => [kebabCase(name), value])),
        fontWeight: tokens.typography.weights,
        letterSpacing: {
          display: tokens.typography.displayTracking,
          body: tokens.typography.bodyTracking,
        },
        borderRadius: tokens.radii,
        boxShadow: tokens.shadows,
        spacing: {
          ...Object.fromEntries(tokens.spacing.scale.map((value) => [String(value).replace(/\./g, "-"), `${value}px`])),
          base: `${tokens.spacing.base}px`,
        },
        transitionDuration: { default: tokens.motion.duration },
        transitionTimingFunction: { default: tokens.motion.easing },
        maxWidth: { content: tokens.layout.maxWidth, prose: "70ch" },
      },
    },
  };
  return [
    "/** unslop Tailwind v3 config fragment. Merge theme.extend into tailwind.config.js. */",
    `export default ${JSON.stringify(fragment, null, 2)};`,
    "",
  ].join("\n");
}

interface W3CToken {
  $type: string;
  $value: unknown;
  $description?: string;
}

function token($type: string, $value: unknown, $description?: string): W3CToken {
  return { $type, $value, ...($description ? { $description } : {}) };
}

function tokenRecord(entries: Iterable<[string, unknown]>, type: string): Record<string, W3CToken> {
  return Object.fromEntries([...entries].map(([name, value]) => [name, token(type, value)]));
}

/** W3C Design Tokens Community Group JSON with typed semantic groups. */
export function renderW3CDesignTokens(input: DesignPreset): string {
  const preset = validatePreset(input);
  const { tokens } = preset;
  const document = {
    $description: `unslop · ${preset.title} (${preset.name}) · W3C Design Tokens`,
    color: {
      light: tokenRecord(colorEntries(selectedColors(preset)), "color"),
      dark: tokenRecord(colorEntries(darkColors(preset)), "color"),
    },
    typography: {
      fontFamily: token("fontFamily", fontFamily(tokens.typography.fontFamily)),
      displayFamily: token("fontFamily", fontFamily(tokens.typography.displayFamily ?? tokens.typography.fontFamily)),
      bodyFamily: token("fontFamily", fontFamily(tokens.typography.bodyFamily ?? tokens.typography.fontFamily)),
      monospaceFamily: token("fontFamily", fontFamily(tokens.typography.monospaceFamily)),
      scale: Object.fromEntries(Object.entries(tokens.typography.scale).map(([name, value]) => [
        name,
        token(/^(?:clamp|calc|var)\(/.test(value) ? "string" : "dimension", value),
      ])),
      tracking: {
        display: token("number", Number.parseFloat(tokens.typography.displayTracking), `${tokens.typography.displayTracking} in CSS em units`),
        body: token("number", Number.parseFloat(tokens.typography.bodyTracking), `${tokens.typography.bodyTracking} in CSS em units`),
      },
      weights: tokenRecord(Object.entries(tokens.typography.weights), "fontWeight"),
      numericVariant: token("string", tokens.typography.numericVariant),
    },
    radius: tokenRecord(Object.entries(tokens.radii), "dimension"),
    spacing: {
      base: token("dimension", `${tokens.spacing.base}px`),
      scale: tokenRecord(tokens.spacing.scale.map((value) => [String(value), `${value}px`]), "dimension"),
    },
    shadow: Object.fromEntries(Object.entries(tokens.shadows).map(
      ([name, value]) => [name, token("string", value, "CSS shadow token; preserve all layers verbatim.")],
    )),
    motion: {
      duration: token("duration", tokens.motion.duration),
      easing: token("string", tokens.motion.easing, "CSS cubic-bezier or keyword easing curve"),
      ...(tokens.motion.spring ? {
        spring: {
          mass: token("number", tokens.motion.spring.mass),
          stiffness: token("number", tokens.motion.spring.stiffness),
          damping: token("number", tokens.motion.spring.damping),
        },
      } : {}),
    },
    layout: {
      maxWidth: token("dimension", tokens.layout.maxWidth),
      columns: token("number", tokens.layout.columns),
      borderWidth: token("dimension", tokens.layout.borderWidth),
      gridGap: token("dimension", tokens.layout.gridGap),
      contentInset: token("dimension", tokens.layout.contentInset),
    },
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export function exportDesignTokens(input: DesignPreset, format: TokenExportFormat | string): string {
  const normalized = normalizeTokenExportFormat(format);
  if (normalized === "tailwind-v4") return renderTokenStylesheet(input);
  if (normalized === "tailwind-v3") return renderTailwindV3Config(input);
  if (normalized === "css") return renderCSSCustomProperties(input);
  return renderW3CDesignTokens(input);
}
