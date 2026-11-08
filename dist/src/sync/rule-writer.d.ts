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
export interface RuleTarget {
    path: string;
    format?: "skill" | "cursor-rule";
}
/** Canonical skills, agent rules, and retained v1 compatibility paths. */
export declare const RULE_TARGETS: readonly RuleTarget[];
/** Render a drop-in CSS token contract for the selected design system. */
export declare function renderTokenCSS(preset: DesignPreset): string;
/** Compile a preset into framework-agnostic instructions for any coding agent. */
export declare function renderRuleDocument(preset: DesignPreset): string;
export declare function managedBlock(content: string): string;
/** Render a standalone Claude-compatible SKILL.md document. */
export declare function renderAgentSkill(preset: DesignPreset): string;
/**
 * Write skills and instructions for Claude Code, OpenCode, Codex, Cursor,
 * Windsurf, Copilot, Cline/Roo, and universal agents. Existing user content is
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
export declare const AGENT_CONFIG_PATHS: readonly [".mcp.json", "opencode.json", ".cursor/mcp.json", ".vscode/mcp.json", ".zed/settings.json", ".claude-plugin/plugin.json"];
/**
 * Merge native MCP/plugin configuration for every supported coding agent.
 * Unrelated servers, settings, inputs, and custom fields are preserved.
 */
export declare function syncAgentConfigurations(options?: MCPSyncOptions): Promise<SyncedRuleFile[]>;
/** Install agent skills, rules, native MCP configuration, and plugin metadata. */
export declare function installUnslop(options: RuleSyncOptions & MCPSyncOptions): Promise<RuleSyncResult>;
export declare function portableRulePath(path: string): string;
export declare function relativeRulePath(cwd: string, path: string): string;
//# sourceMappingURL=rule-writer.d.ts.map