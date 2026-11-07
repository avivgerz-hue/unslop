import { type DesignPreset } from "../presets/index.js";
export interface TokenFrequency {
    value: string;
    count: number;
}
export interface DesignDNA {
    source: string;
    colors: {
        surface: TokenFrequency[];
        text: TokenFrequency[];
        mutedText: TokenFrequency[];
        border: TokenFrequency[];
        accent: TokenFrequency[];
        accentText: TokenFrequency[];
    };
    typography: {
        fontStacks: TokenFrequency[];
        fontSizes: TokenFrequency[];
        lineHeights: TokenFrequency[];
        fontWeights: TokenFrequency[];
        letterSpacings: TokenFrequency[];
    };
    radii: TokenFrequency[];
    /** Individual shadow layers, useful for inspecting elevation construction. */
    shadows: TokenFrequency[];
    /** Complete box-shadow declarations retained as reusable elevation tokens. */
    shadowCompositions?: TokenFrequency[];
    spacing: TokenFrequency[];
    motion: {
        durations: TokenFrequency[];
        easings: TokenFrequency[];
    };
    cssVariables: Record<string, string>;
    warnings: string[];
}
export interface ExtractOptions {
    /** Injectable for tests or applications with a custom network stack. */
    fetchImpl?: typeof fetch;
    /** Per-request timeout. Defaults to 10 seconds. */
    timeoutMs?: number;
    /** Maximum linked/imported stylesheets fetched from a document. */
    maxStylesheets?: number;
    /** Maximum response size in bytes. Defaults to 2 MiB. */
    maxBytes?: number;
}
/** Extract a deterministic token inventory from any CSS text. */
export declare function extractTokensFromCSS(css: string, source?: string): DesignDNA;
export declare const extractDesignTokens: typeof extractTokensFromCSS;
/** Extract design DNA from a live URL, an HTML document URL, or a local CSS file. */
export declare function extractDesignDNA(input: string, options?: ExtractOptions): Promise<DesignDNA>;
export declare const extractDNA: typeof extractDesignDNA;
/** Compile extracted DNA into the same complete schema used by built-in presets. */
export declare function createPresetFromDNA(dna: DesignDNA, requestedName?: string): DesignPreset;
//# sourceMappingURL=extract-dna.d.ts.map