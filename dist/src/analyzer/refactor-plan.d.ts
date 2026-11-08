import { type DesignPreset } from "../presets/index.js";
import { type PillarScore } from "./design-craft.js";
import { type AuditReport, type SlopViolation } from "./slop-detector.js";
export declare const DEFAULT_REFACTOR_REPORT = "UNSLOP-REPORT.md";
export interface TokenTranslation {
    file: string;
    line: number;
    column: number;
    ruleId: string;
    kind: "class" | "color" | "copy" | "layout" | "token" | "interaction";
    before: string;
    after: string;
    rationale: string;
}
export interface RefactorStep {
    priority: "P0" | "P1" | "P2";
    file: string;
    line: number;
    column: number;
    ruleId: string;
    action: string;
    before: string;
    after: string;
}
export interface RefactorPlanOptions {
    cwd?: string;
    preset?: DesignPreset | string;
    ignore?: string[];
}
export interface DesignTransformationBlueprint {
    target: string;
    preset: {
        name: string;
        title: string;
    };
    score: number;
    designCraftScore: number;
    grade: string;
    pillarScores: PillarScore[];
    translations: TokenTranslation[];
    steps: RefactorStep[];
    markdown: string;
    audit: AuditReport;
}
/** Translate each finding into an executable preset-aware replacement. */
export declare function translateViolation(violation: SlopViolation, preset: DesignPreset): TokenTranslation;
export declare function createRefactorPlan(target?: string, options?: RefactorPlanOptions): Promise<DesignTransformationBlueprint>;
export declare function writeRefactorReport(plan: DesignTransformationBlueprint, outputPath: string, cwd?: string): Promise<string>;
//# sourceMappingURL=refactor-plan.d.ts.map