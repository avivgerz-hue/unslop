import { type DesignPreset } from "../presets/index.js";
export declare const MANAGED_START = "<!-- unslop:start -->";
export declare const MANAGED_END = "<!-- unslop:end -->";
export interface RuleSyncOptions {
    cwd?: string;
    preset: DesignPreset | string;
    /** Replace whole files instead of preserving content outside managed blocks. */
    force?: boolean;
}
export type RuleFileStatus = "created" | "updated" | "unchanged";
export interface SyncedRuleFile {
    path: string;
    status: RuleFileStatus;
}
export interface RuleSyncResult {
    preset: string;
    files: SyncedRuleFile[];
}
/** Render a drop-in CSS token contract for the selected design system. */
export declare function renderTokenCSS(preset: DesignPreset): string;
/** Compile a preset into framework-agnostic instructions for any coding agent. */
export declare function renderRuleDocument(preset: DesignPreset): string;
export declare function managedBlock(content: string): string;
/** Render a standalone Claude-compatible SKILL.md document. */
export declare function renderAgentSkill(preset: DesignPreset): string;
/**
 * Write Claude Code, Codex, Cursor, and Windsurf rules. Existing user content is
 * preserved and repeated runs replace only the unslop managed block.
 */
export declare function syncRuleFiles(options: RuleSyncOptions): Promise<RuleSyncResult>;
export declare const writeAgentRules: typeof syncRuleFiles;
export interface MCPSyncOptions {
    cwd?: string;
    /** Package specifier used by npx. Defaults to the published npm package. */
    packageSpec?: string;
}
/** Merge unslop into a project's .mcp.json without disturbing other servers. */
export declare function syncMcpConfig(options?: MCPSyncOptions): Promise<SyncedRuleFile>;
/** Install agent rules and the native MCP configuration as one CLI operation. */
export declare function installUnslop(options: RuleSyncOptions & MCPSyncOptions): Promise<RuleSyncResult>;
export declare function portableRulePath(path: string): string;
export declare function relativeRulePath(cwd: string, path: string): string;
//# sourceMappingURL=rule-writer.d.ts.map