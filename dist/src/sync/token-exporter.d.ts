import { type DesignPreset } from "../presets/index.js";
/**
 * Generate a deterministic Tailwind v4 theme plus standalone semantic CSS
 * variables. No Tailwind installation or build plugin is required.
 */
export declare function renderTokenStylesheet(input: DesignPreset): string;
export declare const exportTokens: typeof renderTokenStylesheet;
export declare const TOKEN_EXPORT_FORMATS: readonly ["tailwind-v4", "tailwind-v3", "css", "w3c-json"];
export type TokenExportFormat = (typeof TOKEN_EXPORT_FORMATS)[number];
export declare function normalizeTokenExportFormat(value: string): TokenExportFormat;
/** Tailwind v4 @theme only; use renderTokenStylesheet for theme plus root/dark CSS. */
export declare function renderTailwindV4Theme(input: DesignPreset): string;
/** Standalone CSS custom properties with explicit theme companions. */
export declare function renderCSSCustomProperties(input: DesignPreset): string;
/** Tailwind v3 configuration fragment using semantic utilities. */
export declare function renderTailwindV3Config(input: DesignPreset): string;
/** W3C Design Tokens Community Group JSON with typed semantic groups. */
export declare function renderW3CDesignTokens(input: DesignPreset): string;
export declare function exportDesignTokens(input: DesignPreset, format: TokenExportFormat | string): string;
//# sourceMappingURL=token-exporter.d.ts.map