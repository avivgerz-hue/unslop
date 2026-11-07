export interface RGBAColor {
    /** Red channel, 0–255. */
    r: number;
    /** Green channel, 0–255. */
    g: number;
    /** Blue channel, 0–255. */
    b: number;
    /** Alpha channel, 0–1. */
    a: number;
}
export type ColorInput = string | RGBAColor;
/** Parse hexadecimal, RGB(A), HSL(A), and standard named CSS colors. */
export declare function parseColor(input: ColorInput): RGBAColor | undefined;
/**
 * Calculate WCAG 2.1 relative luminance. Alpha is intentionally ignored here;
 * contrastRatio composites translucent colors before calculating luminance.
 */
export declare function relativeLuminance(input: ColorInput): number;
/** Calculate the WCAG 2.1 contrast ratio, including alpha compositing. */
export declare function contrastRatio(foregroundInput: ColorInput, backgroundInput: ColorInput): number;
/** WCAG large text is at least 24px, or 18.66px at bold weight (700+). */
export declare function requiredContrastRatio(fontSizePx: number, fontWeight?: number): 3 | 4.5;
//# sourceMappingURL=wcag.d.ts.map