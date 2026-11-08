import type { DesignPillarId, SlopCategory, SlopViolation } from "./slop-detector.js";
export interface DesignPillarDefinition {
    id: DesignPillarId;
    code: string;
    name: string;
    description: string;
}
export declare const DESIGN_PILLARS: readonly DesignPillarDefinition[];
export interface DesignCraftRule {
    id: string;
    pillar: DesignPillarId;
    title: string;
    recommendation: string;
}
export declare const DESIGN_CRAFT_RULES: readonly DesignCraftRule[];
export declare const DESIGN_CRAFT_RULE_COUNT: number;
export declare function designCraftRule(id: string): DesignCraftRule | undefined;
export declare function pillarForRule(ruleId: string): DesignPillarId;
export declare function categoryForPillar(pillar: DesignPillarId): SlopCategory;
export interface CopyCliche {
    phrase: string;
    ruleId: string;
    replacement: string;
}
export declare const AI_COPY_CLICHES: readonly CopyCliche[];
/** Run the canonical v2 detectors and map legacy findings into the seven pillars. */
export declare function analyzeDesignCraft(source: string, filePath: string, legacy: readonly SlopViolation[]): SlopViolation[];
export interface PillarScore {
    id: DesignPillarId;
    code: string;
    name: string;
    score: number;
    grade: string;
    violations: number;
}
export declare function calculatePillarScores(violations: readonly SlopViolation[]): PillarScore[];
export declare function calculateDesignCraftScore(violations: readonly SlopViolation[]): number;
//# sourceMappingURL=design-craft.d.ts.map