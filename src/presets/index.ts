import appleGlassJson from "./apple-glass.json" with { type: "json" };
import linearDarkJson from "./linear-dark.json" with { type: "json" };
import neoBrutalistJson from "./neo-brutalist.json" with { type: "json" };
import stripeMinimalJson from "./stripe-minimal.json" with { type: "json" };
import swissGridJson from "./swiss-grid.json" with { type: "json" };

export interface SpringToken {
  mass: number;
  stiffness: number;
  damping: number;
}

export interface DesignPreset {
  schemaVersion: 1;
  name: string;
  title: string;
  description: string;
  tokens: {
    colorScheme: "light" | "dark";
    colors: {
      background: string;
      surface: string;
      surfaceElevated: string;
      text: string;
      textMuted: string;
      border: string;
      accent: string;
      accentText: string;
      [key: string]: string;
    };
    typography: {
      fontFamily: string;
      monospaceFamily: string;
      scale: Record<string, string>;
      displayTracking: string;
      bodyTracking: string;
      numericVariant: string;
      weights: Record<string, number>;
    };
    radii: Record<string, string>;
    shadows: Record<string, string>;
    spacing: {
      /** Base grid in CSS pixels. */
      base: number;
      /** Spacing stops in CSS pixels. */
      scale: number[];
    };
    motion: {
      duration: string;
      easing: string;
      spring?: SpringToken;
    };
    layout: {
      maxWidth: string;
      columns: number;
      borderWidth: string;
      gridGap: string;
      contentInset: string;
    };
    effects?: {
      backdropBlur?: string;
      backdropSaturation?: string;
    };
  };
  rules: string[];
}

export interface PresetSummary {
  name: string;
  title: string;
  description: string;
  colorScheme: "light" | "dark";
  accent: string;
}

export const PRESET_NAMES = [
  "linear-dark",
  "swiss-grid",
  "stripe-minimal",
  "apple-glass",
  "neo-brutalist",
] as const;

export type BuiltInPresetName = (typeof PRESET_NAMES)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Invalid design preset: ${path} must be an object.`);
  }
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid design preset: ${path} must be a non-empty string.`);
  }
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid design preset: ${path} must be a finite number.`);
  }
  return value;
}

function validateStringRecord(value: unknown, path: string): void {
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
export function validatePreset(value: unknown): DesignPreset {
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

  const typography = requireRecord(tokens.typography, "tokens.typography");
  requireString(typography.fontFamily, "tokens.typography.fontFamily");
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

  return value as DesignPreset;
}

const registry: Readonly<Record<BuiltInPresetName, DesignPreset>> = Object.freeze({
  "linear-dark": validatePreset(linearDarkJson),
  "swiss-grid": validatePreset(swissGridJson),
  "stripe-minimal": validatePreset(stripeMinimalJson),
  "apple-glass": validatePreset(appleGlassJson),
  "neo-brutalist": validatePreset(neoBrutalistJson),
});

export function isBuiltInPresetName(name: string): name is BuiltInPresetName {
  return (PRESET_NAMES as readonly string[]).includes(name.trim().toLowerCase());
}

export function loadPreset(name: string): DesignPreset {
  const normalized = name.trim().toLowerCase().replace(/\.json$/, "");
  if (!isBuiltInPresetName(normalized)) {
    throw new Error(
      `Unknown preset "${name}". Available presets: ${PRESET_NAMES.join(", ")}.`,
    );
  }
  return structuredClone(registry[normalized]);
}

export function listPresets(): DesignPreset[] {
  return PRESET_NAMES.map((name) => structuredClone(registry[name]));
}

export function listPresetSummaries(): PresetSummary[] {
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
