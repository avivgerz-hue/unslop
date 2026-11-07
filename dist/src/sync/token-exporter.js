import { validatePreset } from "../presets/index.js";
function kebabCase(value) {
    return value.replace(/([a-z\d])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
}
function selectedColors(preset) {
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
    };
}
function darkColors(preset) {
    const selected = selectedColors(preset);
    if (preset.tokens.colorScheme === "dark")
        return selected;
    // A deterministic dark companion for light-only presets. The original dark
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
function colorEntries(colors) {
    return [
        ["surface-0", colors.surface0],
        ["surface-1", colors.surface1],
        ["surface-elevated", colors.surfaceElevated],
        ["text-primary", colors.textPrimary],
        ["text-muted", colors.textMuted],
        ["border-subtle", colors.borderSubtle],
        ["accent", colors.accent],
        ["accent-foreground", colors.accentForeground],
    ];
}
function renderTheme(preset) {
    const { tokens } = preset;
    const lines = [
        "@theme {",
        ...colorEntries(selectedColors(preset)).map(([name, value]) => `  --color-${name}: ${value};`),
        `  --font-display: ${tokens.typography.fontFamily};`,
        `  --font-body: ${tokens.typography.fontFamily};`,
        `  --font-mono: ${tokens.typography.monospaceFamily};`,
        ...Object.entries(tokens.typography.scale).map(([name, value]) => `  --text-${kebabCase(name)}: ${value};`),
        `  --tracking-display: ${tokens.typography.displayTracking};`,
        `  --tracking-body: ${tokens.typography.bodyTracking};`,
        ...Object.entries(tokens.typography.weights).map(([name, value]) => `  --font-weight-${kebabCase(name)}: ${value};`),
        ...Object.entries(tokens.radii).map(([name, value]) => `  --radius-${kebabCase(name)}: ${value};`),
        ...Object.entries(tokens.shadows).map(([name, value]) => `  --shadow-${kebabCase(name)}: ${value};`),
        `  --spacing: ${tokens.spacing.base}px;`,
        ...tokens.spacing.scale.map((value) => `  --spacing-${String(value).replace(/\./g, "-")}: ${value}px;`),
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
function renderRoot(preset) {
    const { tokens } = preset;
    const lines = [
        ":root {",
        `  color-scheme: ${tokens.colorScheme};`,
        ...colorEntries(selectedColors(preset)).map(([name, value]) => `  --${name}: ${value};`),
        `  --font-display: ${tokens.typography.fontFamily};`,
        `  --font-body: ${tokens.typography.fontFamily};`,
        `  --font-mono: ${tokens.typography.monospaceFamily};`,
        `  --font-numeric: ${tokens.typography.numericVariant};`,
        ...Object.entries(tokens.typography.scale).map(([name, value]) => `  --text-${kebabCase(name)}: ${value};`),
        `  --tracking-display: ${tokens.typography.displayTracking};`,
        `  --tracking-body: ${tokens.typography.bodyTracking};`,
        ...Object.entries(tokens.typography.weights).map(([name, value]) => `  --font-weight-${kebabCase(name)}: ${value};`),
        ...Object.entries(tokens.radii).map(([name, value]) => `  --radius-${kebabCase(name)}: ${value};`),
        ...Object.entries(tokens.shadows).map(([name, value]) => `  --shadow-${kebabCase(name)}: ${value};`),
        `  --spacing-base: ${tokens.spacing.base}px;`,
        ...tokens.spacing.scale.map((value) => `  --spacing-${String(value).replace(/\./g, "-")}: ${value}px;`),
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
        lines.push(`  --spring-mass: ${tokens.motion.spring.mass};`, `  --spring-stiffness: ${tokens.motion.spring.stiffness};`, `  --spring-damping: ${tokens.motion.spring.damping};`);
    }
    lines.push("}");
    return lines.join("\n");
}
function renderDark(preset) {
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
export function renderTokenStylesheet(input) {
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
//# sourceMappingURL=token-exporter.js.map