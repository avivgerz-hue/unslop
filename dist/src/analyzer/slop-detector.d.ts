export { contrastRatio, parseColor, relativeLuminance, requiredContrastRatio } from "./wcag.js";
export type { ColorInput, RGBAColor } from "./wcag.js";
export declare const SUPPORTED_EXTENSIONS: readonly [".tsx", ".jsx", ".vue", ".svelte", ".html", ".css"];
export type SlopCategory = "color" | "layout" | "elevation" | "typography" | "spacing";
export type SlopSeverity = "error" | "warning" | "info";
export interface SlopViolation {
    ruleId: string;
    category: SlopCategory;
    severity: SlopSeverity;
    file: string;
    line: number;
    column: number;
    message: string;
    evidence: string;
    recommendation: string;
}
export interface AuditSummary {
    errors: number;
    warnings: number;
    infos: number;
    byRule: Record<string, number>;
    byCategory: Record<SlopCategory, number>;
}
export interface AuditReport {
    target: string;
    filesScanned: number;
    files: string[];
    violations: SlopViolation[];
    score: number;
    grade: string;
    summary: AuditSummary;
    refactoringPrompt: string;
}
export interface AuditOptions {
    /** Used to produce portable relative paths. Defaults to process.cwd(). */
    cwd?: string;
    /** Additional directory base names to skip. */
    ignore?: string[];
}
/** Analyze one supported source file without touching the filesystem. */
export declare function analyzeSource(source: string, filePath?: string): SlopViolation[];
export declare const detectSlop: typeof analyzeSource;
export declare function calculateDesignIntegrityScore(violations: readonly SlopViolation[]): number;
export declare function designGrade(score: number): string;
export declare function summarizeViolations(violations: readonly SlopViolation[]): AuditSummary;
export declare function generateRefactoringPrompt(violations: readonly SlopViolation[], score?: number): string;
/** Recursively audit a file or directory in stable path order. */
export declare function auditTarget(target?: string, options?: AuditOptions): Promise<AuditReport>;
export declare const audit: typeof auditTarget;
export declare function formatAuditReport(report: AuditReport): string;
//# sourceMappingURL=slop-detector.d.ts.map