const NAMED_COLORS = {
    transparent: "#00000000",
    black: "#000000",
    silver: "#c0c0c0",
    gray: "#808080",
    grey: "#808080",
    white: "#ffffff",
    maroon: "#800000",
    red: "#ff0000",
    purple: "#800080",
    fuchsia: "#ff00ff",
    magenta: "#ff00ff",
    green: "#008000",
    lime: "#00ff00",
    olive: "#808000",
    yellow: "#ffff00",
    navy: "#000080",
    blue: "#0000ff",
    teal: "#008080",
    aqua: "#00ffff",
    cyan: "#00ffff",
    orange: "#ffa500",
    indigo: "#4b0082",
    violet: "#ee82ee",
    pink: "#ffc0cb",
    rebeccapurple: "#663399",
};
function clamp(value, minimum = 0, maximum = 1) {
    return Math.min(maximum, Math.max(minimum, value));
}
function parseAlpha(value) {
    if (value === undefined)
        return 1;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric))
        return Number.NaN;
    return clamp(value.trim().endsWith("%") ? numeric / 100 : numeric);
}
function parseRGBChannel(value) {
    if (value === undefined)
        return Number.NaN;
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric))
        return Number.NaN;
    return clamp(value.trim().endsWith("%") ? (numeric / 100) * 255 : numeric, 0, 255);
}
function functionalParts(value) {
    const normalized = value.trim().replace(/,/g, " ").replace(/\//g, " / ");
    const parts = normalized.split(/\s+/).filter(Boolean);
    const slash = parts.indexOf("/");
    if (slash >= 0) {
        return { values: parts.slice(0, slash), alpha: parts[slash + 1] };
    }
    if (parts.length === 4)
        return { values: parts.slice(0, 3), alpha: parts[3] };
    return { values: parts, alpha: undefined };
}
function parseRGB(value) {
    const body = value.match(/^rgba?\((.*)\)$/i)?.[1];
    if (body === undefined)
        return undefined;
    const { values, alpha } = functionalParts(body);
    if (values.length !== 3)
        return undefined;
    const r = parseRGBChannel(values[0]);
    const g = parseRGBChannel(values[1]);
    const b = parseRGBChannel(values[2]);
    const a = parseAlpha(alpha);
    if (![r, g, b, a].every(Number.isFinite))
        return undefined;
    return { r, g, b, a };
}
function hueChannel(p, q, input) {
    let hue = input;
    if (hue < 0)
        hue += 1;
    if (hue > 1)
        hue -= 1;
    if (hue < 1 / 6)
        return p + (q - p) * 6 * hue;
    if (hue < 1 / 2)
        return q;
    if (hue < 2 / 3)
        return p + (q - p) * (2 / 3 - hue) * 6;
    return p;
}
function parseHSL(value) {
    const body = value.match(/^hsla?\((.*)\)$/i)?.[1];
    if (body === undefined)
        return undefined;
    const { values, alpha } = functionalParts(body);
    if (values.length !== 3)
        return undefined;
    const hue = Number.parseFloat(values[0] ?? "");
    const saturation = Number.parseFloat(values[1] ?? "");
    const lightness = Number.parseFloat(values[2] ?? "");
    const a = parseAlpha(alpha);
    if (![hue, saturation, lightness, a].every(Number.isFinite))
        return undefined;
    const h = (((hue % 360) + 360) % 360) / 360;
    const s = clamp(saturation / 100);
    const l = clamp(lightness / 100);
    if (s === 0) {
        const channel = l * 255;
        return { r: channel, g: channel, b: channel, a };
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
        r: hueChannel(p, q, h + 1 / 3) * 255,
        g: hueChannel(p, q, h) * 255,
        b: hueChannel(p, q, h - 1 / 3) * 255,
        a,
    };
}
/** Parse hexadecimal, RGB(A), HSL(A), and standard named CSS colors. */
export function parseColor(input) {
    if (typeof input !== "string") {
        return [input.r, input.g, input.b, input.a].every(Number.isFinite)
            ? {
                r: clamp(input.r, 0, 255),
                g: clamp(input.g, 0, 255),
                b: clamp(input.b, 0, 255),
                a: clamp(input.a),
            }
            : undefined;
    }
    const value = input.trim().toLowerCase();
    const named = NAMED_COLORS[value];
    const hex = (named ?? value).match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1];
    if (hex) {
        const expanded = hex.length <= 4 ? [...hex].map((channel) => channel + channel).join("") : hex;
        return {
            r: Number.parseInt(expanded.slice(0, 2), 16),
            g: Number.parseInt(expanded.slice(2, 4), 16),
            b: Number.parseInt(expanded.slice(4, 6), 16),
            a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
        };
    }
    return parseRGB(value) ?? parseHSL(value);
}
function linearChannel(channel) {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}
/**
 * Calculate WCAG 2.1 relative luminance. Alpha is intentionally ignored here;
 * contrastRatio composites translucent colors before calculating luminance.
 */
export function relativeLuminance(input) {
    const color = parseColor(input);
    if (!color)
        throw new Error(`Unsupported CSS color: ${String(input)}`);
    return (linearChannel(color.r) * 0.2126 +
        linearChannel(color.g) * 0.7152 +
        linearChannel(color.b) * 0.0722);
}
function composite(foreground, background) {
    const alpha = foreground.a + background.a * (1 - foreground.a);
    if (alpha === 0)
        return { r: 255, g: 255, b: 255, a: 1 };
    const channel = (fg, bg) => (fg * foreground.a + bg * background.a * (1 - foreground.a)) / alpha;
    return {
        r: channel(foreground.r, background.r),
        g: channel(foreground.g, background.g),
        b: channel(foreground.b, background.b),
        a: alpha,
    };
}
/** Calculate the WCAG 2.1 contrast ratio, including alpha compositing. */
export function contrastRatio(foregroundInput, backgroundInput) {
    const foreground = parseColor(foregroundInput);
    const background = parseColor(backgroundInput);
    if (!foreground || !background) {
        throw new Error(`Unsupported CSS color pair: ${String(foregroundInput)} on ${String(backgroundInput)}`);
    }
    const opaqueBackground = composite(background, { r: 255, g: 255, b: 255, a: 1 });
    const opaqueForeground = composite(foreground, opaqueBackground);
    const foregroundLuminance = relativeLuminance(opaqueForeground);
    const backgroundLuminance = relativeLuminance(opaqueBackground);
    const lighter = Math.max(foregroundLuminance, backgroundLuminance);
    const darker = Math.min(foregroundLuminance, backgroundLuminance);
    return (lighter + 0.05) / (darker + 0.05);
}
/** WCAG large text is at least 24px, or 18.66px at bold weight (700+). */
export function requiredContrastRatio(fontSizePx, fontWeight = 400) {
    if (!Number.isFinite(fontSizePx) || fontSizePx <= 0) {
        throw new Error("fontSizePx must be a positive finite number.");
    }
    return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700) ? 3 : 4.5;
}
//# sourceMappingURL=wcag.js.map