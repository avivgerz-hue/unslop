import anthropicWarmEditorialJson from "./anthropic-warm-editorial.json" with { type: "json" };
import bloombergTerminalDenseJson from "./bloomberg-terminal-dense.json" with { type: "json" };
import fintechInstitutionalJson from "./fintech-institutional.json" with { type: "json" };
import linearPrecisionJson from "./linear-precision.json" with { type: "json" };
import neoBrutalistCraftJson from "./neo-brutalist-craft.json" with { type: "json" };
import raycastCommandJson from "./raycast-command.json" with { type: "json" };
import stripeAtmosphericJson from "./stripe-atmospheric.json" with { type: "json" };
import swissEditorialJson from "./swiss-editorial.json" with { type: "json" };
import teenageEngineeringJson from "./teenage-engineering.json" with { type: "json" };
import vercelMonochromeJson from "./vercel-monochrome.json" with { type: "json" };
import appleGlassJson from "./apple-glass.json" with { type: "json" };
import linearDarkJson from "./linear-dark.json" with { type: "json" };
import neoBrutalistJson from "./neo-brutalist.json" with { type: "json" };
import stripeMinimalJson from "./stripe-minimal.json" with { type: "json" };
import swissGridJson from "./swiss-grid.json" with { type: "json" };
export const PRESET_NAMES = [
    "swiss-editorial",
    "linear-precision",
    "stripe-atmospheric",
    "vercel-monochrome",
    "teenage-engineering",
    "anthropic-warm-editorial",
    "bloomberg-terminal-dense",
    "raycast-command",
    "fintech-institutional",
    "neo-brutalist-craft",
];
/** v1 preset IDs remain loadable without appearing in the canonical v2 gallery. */
export const LEGACY_PRESET_NAMES = [
    "linear-dark",
    "swiss-grid",
    "stripe-minimal",
    "apple-glass",
    "neo-brutalist",
];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requireRecord(value, path) {
    if (!isRecord(value)) {
        throw new Error(`Invalid design preset: ${path} must be an object.`);
    }
    return value;
}
function requireString(value, path) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Invalid design preset: ${path} must be a non-empty string.`);
    }
    return value;
}
function requireNumber(value, path) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Invalid design preset: ${path} must be a finite number.`);
    }
    return value;
}
function validateStringRecord(value, path) {
    const record = requireRecord(value, path);
    if (Object.keys(record).length === 0) {
        throw new Error(`Invalid design preset: ${path} must not be empty.`);
    }
    for (const [key, entry] of Object.entries(record)) {
        requireString(entry, `${path}.${key}`);
    }
}
/**
 * Validates untrusted preset JSON at runtime. The returned object retains its
 * original values; no defaults are silently injected into malformed presets.
 */
export function validatePreset(value) {
    const root = requireRecord(value, "preset");
    if (root.schemaVersion !== 1) {
        throw new Error("Invalid design preset: schemaVersion must be 1.");
    }
    requireString(root.name, "name");
    requireString(root.title, "title");
    requireString(root.description, "description");
    const tokens = requireRecord(root.tokens, "tokens");
    if (tokens.colorScheme !== "light" && tokens.colorScheme !== "dark") {
        throw new Error("Invalid design preset: tokens.colorScheme must be light or dark.");
    }
    const colors = requireRecord(tokens.colors, "tokens.colors");
    for (const key of [
        "background",
        "surface",
        "surfaceElevated",
        "text",
        "textMuted",
        "border",
        "accent",
        "accentText",
    ]) {
        requireString(colors[key], `tokens.colors.${key}`);
    }
    validateStringRecord(colors, "tokens.colors");
    if (tokens.darkColors !== undefined) {
        const darkColors = requireRecord(tokens.darkColors, "tokens.darkColors");
        for (const key of [
            "background", "surface", "surfaceElevated", "text", "textMuted",
            "border", "accent", "accentText",
        ]) {
            requireString(darkColors[key], `tokens.darkColors.${key}`);
        }
        validateStringRecord(darkColors, "tokens.darkColors");
    }
    const typography = requireRecord(tokens.typography, "tokens.typography");
    requireString(typography.fontFamily, "tokens.typography.fontFamily");
    if (typography.displayFamily !== undefined)
        requireString(typography.displayFamily, "tokens.typography.displayFamily");
    if (typography.bodyFamily !== undefined)
        requireString(typography.bodyFamily, "tokens.typography.bodyFamily");
    requireString(typography.monospaceFamily, "tokens.typography.monospaceFamily");
    requireString(typography.displayTracking, "tokens.typography.displayTracking");
    requireString(typography.bodyTracking, "tokens.typography.bodyTracking");
    requireString(typography.numericVariant, "tokens.typography.numericVariant");
    validateStringRecord(typography.scale, "tokens.typography.scale");
    const weights = requireRecord(typography.weights, "tokens.typography.weights");
    if (Object.keys(weights).length === 0) {
        throw new Error("Invalid design preset: tokens.typography.weights must not be empty.");
    }
    for (const [key, weight] of Object.entries(weights)) {
        requireNumber(weight, `tokens.typography.weights.${key}`);
    }
    validateStringRecord(tokens.radii, "tokens.radii");
    validateStringRecord(tokens.shadows, "tokens.shadows");
    const spacing = requireRecord(tokens.spacing, "tokens.spacing");
    const base = requireNumber(spacing.base, "tokens.spacing.base");
    if (base <= 0) {
        throw new Error("Invalid design preset: tokens.spacing.base must be positive.");
    }
    if (!Array.isArray(spacing.scale) || spacing.scale.length === 0) {
        throw new Error("Invalid design preset: tokens.spacing.scale must be a non-empty array.");
    }
    for (const [index, stop] of spacing.scale.entries()) {
        requireNumber(stop, `tokens.spacing.scale[${index}]`);
    }
    const motion = requireRecord(tokens.motion, "tokens.motion");
    requireString(motion.duration, "tokens.motion.duration");
    requireString(motion.easing, "tokens.motion.easing");
    if (motion.spring !== undefined) {
        const spring = requireRecord(motion.spring, "tokens.motion.spring");
        requireNumber(spring.mass, "tokens.motion.spring.mass");
        requireNumber(spring.stiffness, "tokens.motion.spring.stiffness");
        requireNumber(spring.damping, "tokens.motion.spring.damping");
    }
    const layout = requireRecord(tokens.layout, "tokens.layout");
    requireString(layout.maxWidth, "tokens.layout.maxWidth");
    requireString(layout.borderWidth, "tokens.layout.borderWidth");
    requireString(layout.gridGap, "tokens.layout.gridGap");
    requireString(layout.contentInset, "tokens.layout.contentInset");
    const columns = requireNumber(layout.columns, "tokens.layout.columns");
    if (!Number.isInteger(columns) || columns < 1) {
        throw new Error("Invalid design preset: tokens.layout.columns must be a positive integer.");
    }
    if (tokens.effects !== undefined) {
        const effects = requireRecord(tokens.effects, "tokens.effects");
        if (effects.backdropBlur !== undefined) {
            requireString(effects.backdropBlur, "tokens.effects.backdropBlur");
        }
        if (effects.backdropSaturation !== undefined) {
            requireString(effects.backdropSaturation, "tokens.effects.backdropSaturation");
        }
    }
    if (!Array.isArray(root.rules) || root.rules.length === 0) {
        throw new Error("Invalid design preset: rules must be a non-empty array.");
    }
    for (const [index, rule] of root.rules.entries()) {
        requireString(rule, `rules[${index}]`);
    }
    return value;
}
const registry = Object.freeze({
    "swiss-editorial": validatePreset(swissEditorialJson),
    "linear-precision": validatePreset(linearPrecisionJson),
    "stripe-atmospheric": validatePreset(stripeAtmosphericJson),
    "vercel-monochrome": validatePreset(vercelMonochromeJson),
    "teenage-engineering": validatePreset(teenageEngineeringJson),
    "anthropic-warm-editorial": validatePreset(anthropicWarmEditorialJson),
    "bloomberg-terminal-dense": validatePreset(bloombergTerminalDenseJson),
    "raycast-command": validatePreset(raycastCommandJson),
    "fintech-institutional": validatePreset(fintechInstitutionalJson),
    "neo-brutalist-craft": validatePreset(neoBrutalistCraftJson),
    "linear-dark": validatePreset(linearDarkJson),
    "swiss-grid": validatePreset(swissGridJson),
    "stripe-minimal": validatePreset(stripeMinimalJson),
    "apple-glass": validatePreset(appleGlassJson),
    "neo-brutalist": validatePreset(neoBrutalistJson),
});
export function isBuiltInPresetName(name) {
    return PRESET_NAMES.includes(name.trim().toLowerCase());
}
export function loadPreset(name) {
    const normalized = name.trim().toLowerCase().replace(/\.json$/, "");
    if (!PRESET_NAMES.includes(normalized) &&
        !LEGACY_PRESET_NAMES.includes(normalized)) {
        throw new Error(`Unknown preset "${name}". Available presets: ${PRESET_NAMES.join(", ")}. Legacy IDs: ${LEGACY_PRESET_NAMES.join(", ")}.`);
    }
    const preset = registry[normalized];
    if (!preset)
        throw new Error(`Preset registry is missing "${normalized}".`);
    return structuredClone(preset);
}
export function listPresets() {
    return PRESET_NAMES.map((name) => structuredClone(registry[name]));
}
export function listPresetSummaries() {
    return PRESET_NAMES.map((name) => {
        const preset = registry[name];
        return {
            name: preset.name,
            title: preset.title,
            description: preset.description,
            colorScheme: preset.tokens.colorScheme,
            accent: preset.tokens.colors.accent,
        };
    });
}
//# sourceMappingURL=index.js.map