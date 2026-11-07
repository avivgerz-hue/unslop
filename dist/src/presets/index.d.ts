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
export declare const PRESET_NAMES: readonly ["linear-dark", "swiss-grid", "stripe-minimal", "apple-glass", "neo-brutalist"];
export type BuiltInPresetName = (typeof PRESET_NAMES)[number];
/**
 * Validates untrusted preset JSON at runtime. The returned object retains its
 * original values; no defaults are silently injected into malformed presets.
 */
export declare function validatePreset(value: unknown): DesignPreset;
export declare function isBuiltInPresetName(name: string): name is BuiltInPresetName;
export declare function loadPreset(name: string): DesignPreset;
export declare function listPresets(): DesignPreset[];
export declare function listPresetSummaries(): PresetSummary[];
//# sourceMappingURL=index.d.ts.map