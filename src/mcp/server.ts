import { once } from "node:events";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { auditTarget, formatAuditReport } from "../analyzer/slop-detector.js";
import {
  createRefactorPlan,
  DEFAULT_REFACTOR_REPORT,
  writeRefactorReport,
} from "../analyzer/refactor-plan.js";
import { createPresetFromDNA, extractDesignDNA, type DesignDNA } from "../extractor/extract-dna.js";
import { loadPreset, PRESET_NAMES, type DesignPreset } from "../presets/index.js";
import { installUnslop, renderAgentSkill, type RuleSyncResult } from "../sync/rule-writer.js";
import { UNSLOP_VERSION } from "../version.js";

const LATEST_PROTOCOL_VERSION = "2025-06-18";
const DEFAULT_MAX_MESSAGE_BYTES = 2 * 1024 * 1024;

type RequestID = string | number;
type JSONObject = Record<string, unknown>;

interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: RequestID | null;
  result?: unknown;
  error?: JSONRPCError;
}

interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: JSONObject;
}

export interface MCPServerOptions {
  cwd?: string;
  version?: string;
  fetchImpl?: typeof fetch;
}

export interface MCPStdioOptions extends MCPServerOptions {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  maxMessageBytes?: number;
}

export const MCP_TOOL_DEFINITIONS: readonly MCPToolDefinition[] = [
  {
    name: "unslop_audit",
    description:
      "Read-only static UI audit across 72 rules and 7 design craft pillars (Color & WCAG 2.1 AA/AAA + APCA Contrast, Typography, Layout, Surface, Copy, Motion, and Tokens) for JSX, TSX, HTML, Vue, Svelte, CSS, and Tailwind files. Use this tool first to baseline a project's Design Craft Score (0-100), inspect pillar-by-pillar breakdowns, and get exact file:line diagnostics with remediation guidance without modifying any files.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "File or directory path to audit, relative to the server project root (defaults to '.').",
        },
        ignore: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of additional directory base names (e.g. ['storybook-static', 'legacy']) to skip during scanning.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "unslop_list_presets",
    description:
      "Read-only catalog lookup for all 10 built-in studio design archetypes (such as 'linear-precision', 'anthropic-warm-editorial', 'swiss-grid-editorial', and 'vercel-mono'). Use this tool before calling unslop_apply_preset or unslop_refactor_plan to inspect available preset IDs, color polarities, typography pairings, surface tokens, and layout rules without modifying any files.",
    inputSchema: {
      type: "object",
      properties: {
        preset: {
          type: "string",
          enum: [...PRESET_NAMES],
          description: "Optional preset identifier to inspect in full detail. Omit to list summaries for all built-in studio presets.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "unslop_extract_dna",
    description:
      "Read-only Design DNA extractor that parses a local CSS/stylesheet file or fetches a live HTTP(S) webpage URL to extract color palettes, font stacks, spacing scales, border radii, and shadow tokens. Compiles and returns a reusable DesignPreset object and Agent Skill markdown in memory without writing files to disk.",
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "Local CSS file path (relative to project root) or full HTTP(S) URL to extract design tokens from.",
        },
        name: {
          type: "string",
          description: "Optional human-readable identifier for the compiled design preset (defaults to 'extracted-dna').",
        },
        timeoutMs: {
          type: "number",
          minimum: 1,
          description: "Optional network timeout in milliseconds per HTTP(S) stylesheet request (defaults to 8000).",
        },
        maxStylesheets: {
          type: "number",
          minimum: 0,
          description: "Optional maximum number of linked external stylesheets to fetch when source is an HTML URL (defaults to 5).",
        },
      },
      required: ["source"],
      additionalProperties: false,
    },
  },
  {
    name: "unslop_apply_preset",
    description:
      "Install a built-in studio design preset across coding-agent ecosystems in the target project directory. Writes agent instruction rules, SKILL.md, design token files, and native MCP/plugin configuration files to disk, returning the list of created or updated file paths.",
    inputSchema: {
      type: "object",
      properties: {
        preset: {
          type: "string",
          enum: [...PRESET_NAMES],
          description: "Studio design archetype identifier to install (for example 'linear-precision', 'anthropic-warm-editorial', or 'swiss-grid-editorial').",
        },
        projectDir: {
          type: "string",
          description: "Target project directory where preset rules and token files will be written, relative to the server project root (defaults to '.').",
        },
      },
      required: ["preset"],
      additionalProperties: false,
    },
  },
  {
    name: "unslop_refactor_plan",
    description:
      "Analyze a component or directory and generate a step-by-step Design Transformation Blueprint tailored to a studio preset. Writes a Markdown refactor report (default 'UNSLOP-REPORT.md') to disk and returns the 7-pillar scorecard, exact before/after class and token replacements, and prioritized file:line refactoring tasks.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Component file or directory path to analyze, relative to the server project root (defaults to '.').",
        },
        preset: {
          type: "string",
          enum: [...PRESET_NAMES],
          description: "Target studio design archetype used to compute exact replacement classes and CSS tokens (defaults to 'linear-precision').",
        },
        report: {
          type: "string",
          description: "Output file path for the generated Markdown transformation blueprint, relative to project root (defaults to 'UNSLOP-REPORT.md').",
        },
        ignore: {
          type: "array",
          items: { type: "string" },
          description: "Optional list of additional directory base names to exclude from analysis.",
        },
      },
      additionalProperties: false,
    },
  },
] as const;

function isObject(value: unknown): value is JSONObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function response(id: RequestID | null, result: unknown): JSONRPCResponse {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(
  id: RequestID | null,
  code: number,
  message: string,
  data?: unknown,
): JSONRPCResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function textContent(text: string): Array<{ type: "text"; text: string }> {
  return [{ type: "text", text }];
}

function toolError(error: unknown): JSONObject {
  return {
    content: textContent(`unslop: ${error instanceof Error ? error.message : String(error)}`),
    isError: true,
  };
}

function stringArgument(
  args: JSONObject,
  name: string,
  required = false,
): string | undefined {
  const value = args[name];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be ${required ? "a" : "an optional"} non-empty string.`);
  }
  return value;
}

/** Stateful only for transport configuration; every tool call is deterministic. */
export class UnslopMCPServer {
  readonly cwd: string;
  readonly version: string;
  private readonly fetchImpl?: typeof fetch;

  constructor(options: MCPServerOptions = {}) {
    this.cwd = resolve(options.cwd ?? process.cwd());
    this.version = options.version ?? UNSLOP_VERSION;
    if (options.fetchImpl) this.fetchImpl = options.fetchImpl;
  }

  async handleMessage(message: unknown): Promise<JSONRPCResponse | null> {
    if (!isObject(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
      return errorResponse(null, -32600, "Invalid Request");
    }
    const rawID = message.id;
    const hasID = rawID !== undefined;
    if (hasID && typeof rawID !== "string" && typeof rawID !== "number") {
      return errorResponse(null, -32600, "Invalid Request", "id must be a string or number.");
    }
    const id = hasID ? rawID as RequestID : null;
    try {
      const result = await this.handleMethod(message.method, message.params);
      return hasID ? response(id, result) : null;
    } catch (error) {
      if (!hasID) return null;
      if (error instanceof MCPMethodError) {
        return errorResponse(id, error.code, error.message, error.data);
      }
      return errorResponse(
        id,
        -32603,
        "Internal error",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async handlePayload(payload: unknown): Promise<JSONRPCResponse | JSONRPCResponse[] | null> {
    if (!Array.isArray(payload)) return this.handleMessage(payload);
    if (payload.length === 0) return errorResponse(null, -32600, "Invalid Request");
    const responses = await Promise.all(payload.map((message) => this.handleMessage(message)));
    const filtered = responses.filter((entry): entry is JSONRPCResponse => entry !== null);
    return filtered.length > 0 ? filtered : null;
  }

  private async handleMethod(method: string, params: unknown): Promise<unknown> {
    if (method === "initialize") {
      const requested = isObject(params) && typeof params.protocolVersion === "string"
        ? params.protocolVersion
        : LATEST_PROTOCOL_VERSION;
      const protocolVersion = ["2024-11-05", "2025-03-26", "2025-06-18"].includes(requested)
        ? requested
        : LATEST_PROTOCOL_VERSION;
      return {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "unslop", version: this.version },
        instructions:
          "Use unslop_audit to baseline all seven pillars, unslop_list_presets to inspect built-in archetypes, unslop_extract_dna or unslop_apply_preset for tokens, then unslop_refactor_plan to generate an exact transformation blueprint.",
      };
    }
    if (method === "notifications/initialized" || method === "notifications/cancelled") return null;
    if (method === "ping") return {};
    if (method === "tools/list") return { tools: MCP_TOOL_DEFINITIONS };
    if (method === "tools/call") {
      if (!isObject(params) || typeof params.name !== "string") {
        throw new MCPMethodError(-32602, "Invalid params", "tools/call requires a tool name.");
      }
      const args = params.arguments === undefined ? {} : params.arguments;
      if (!isObject(args)) {
        throw new MCPMethodError(-32602, "Invalid params", "Tool arguments must be an object.");
      }
      if (!MCP_TOOL_DEFINITIONS.some((tool) => tool.name === params.name)) {
        throw new MCPMethodError(-32602, "Unknown tool", params.name);
      }
      try {
        return await this.callTool(params.name, args);
      } catch (error) {
        return toolError(error);
      }
    }
    throw new MCPMethodError(-32601, "Method not found", method);
  }

  private async callTool(name: string, args: JSONObject): Promise<JSONObject> {
    if (name === "unslop_audit") {
      const target = stringArgument(args, "path") ?? ".";
      const ignore = args.ignore;
      if (ignore !== undefined && (!Array.isArray(ignore) || ignore.some((entry) => typeof entry !== "string"))) {
        throw new Error("ignore must be an array of directory names.");
      }
      const report = await auditTarget(resolve(this.cwd, target), {
        cwd: this.cwd,
        ignore: (ignore as string[] | undefined) ?? [],
      });
      return {
        content: textContent(formatAuditReport(report)),
        structuredContent: report as unknown as JSONObject,
      };
    }
    if (name === "unslop_list_presets") {
      const requested = stringArgument(args, "preset");
      if (requested) {
        const preset = loadPreset(requested);
        return {
          content: textContent(`${preset.title} (${preset.name})\n\n${JSON.stringify(preset, null, 2)}`),
          structuredContent: { presets: [preset] } as unknown as JSONObject,
        };
      }
      const presets = PRESET_NAMES.map((id) => loadPreset(id));
      const lines = presets.map((p) => `- ${p.name}: ${p.title}`);
      return {
        content: textContent(`Available studio design presets (${presets.length}):\n${lines.join("\n")}`),
        structuredContent: { presets } as unknown as JSONObject,
      };
    }
    if (name === "unslop_extract_dna") {
      const source = stringArgument(args, "source", true) ?? "";
      const timeoutMs = args.timeoutMs;
      const maxStylesheets = args.maxStylesheets;
      if (timeoutMs !== undefined && (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
        throw new Error("timeoutMs must be a positive number.");
      }
      if (maxStylesheets !== undefined && (!Number.isInteger(maxStylesheets) || (maxStylesheets as number) < 0)) {
        throw new Error("maxStylesheets must be a non-negative integer.");
      }
      const input = /^https?:\/\//i.test(source) ? source : resolve(this.cwd, source);
      const dna: DesignDNA = await extractDesignDNA(input, {
        ...(timeoutMs === undefined ? {} : { timeoutMs: timeoutMs as number }),
        ...(maxStylesheets === undefined ? {} : { maxStylesheets: maxStylesheets as number }),
        ...(this.fetchImpl ? { fetchImpl: this.fetchImpl } : {}),
      });
      const preset: DesignPreset = createPresetFromDNA(dna, stringArgument(args, "name") ?? "extracted-dna");
      const skill = renderAgentSkill(preset);
      return {
        content: textContent(`Compiled ${preset.title} from ${source}.\n\n${JSON.stringify(preset, null, 2)}`),
        structuredContent: { dna, preset, skill } as unknown as JSONObject,
      };
    }
    if (name === "unslop_apply_preset") {
      const preset = stringArgument(args, "preset", true) ?? "";
      loadPreset(preset);
      const projectDir = stringArgument(args, "projectDir") ?? ".";
      const result: RuleSyncResult = await installUnslop({
        cwd: resolve(this.cwd, projectDir),
        preset,
      });
      return {
        content: textContent(`Installed ${result.preset}.\n${result.files.map((file) => `${file.status}: ${file.path}`).join("\n")}`),
        structuredContent: result as unknown as JSONObject,
      };
    }
    if (name === "unslop_refactor_plan") {
      const target = stringArgument(args, "path") ?? ".";
      const preset = stringArgument(args, "preset") ?? "linear-precision";
      const report = stringArgument(args, "report") ?? DEFAULT_REFACTOR_REPORT;
      const ignore = args.ignore;
      if (ignore !== undefined && (!Array.isArray(ignore) || ignore.some((entry) => typeof entry !== "string"))) {
        throw new Error("ignore must be an array of directory names.");
      }
      const plan = await createRefactorPlan(resolve(this.cwd, target), {
        cwd: this.cwd,
        preset,
        ignore: (ignore as string[] | undefined) ?? [],
      });
      await writeRefactorReport(plan, report, this.cwd);
      return {
        content: textContent(`${plan.markdown}\n\nReport written to ${report}.`),
        structuredContent: { ...plan, report } as unknown as JSONObject,
      };
    }
    throw new Error(`Unsupported tool: ${name}`);
  }
}

class MCPMethodError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "MCPMethodError";
  }
}

/** Serve newline-delimited JSON-RPC 2.0 over MCP stdio until input closes. */
export async function startMcpServer(options: MCPStdioOptions = {}): Promise<void> {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const maxMessageBytes = options.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES;
  if (!Number.isInteger(maxMessageBytes) || maxMessageBytes <= 0) {
    throw new Error("maxMessageBytes must be a positive integer.");
  }
  const server = new UnslopMCPServer(options);
  const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
  for await (const line of lines) {
    let payload: unknown;
    let parsed = true;
    if (Buffer.byteLength(line, "utf8") > maxMessageBytes) {
      payload = undefined;
      parsed = false;
    } else {
      try {
        payload = JSON.parse(line);
      } catch {
        parsed = false;
      }
    }
    const result = parsed
      ? await server.handlePayload(payload)
      : errorResponse(null, -32700, "Parse error", "Expected one JSON-RPC message per line within the configured size limit.");
    if (result === null) continue;
    const serialized = `${JSON.stringify(result)}\n`;
    if (!output.write(serialized, "utf8")) await once(output, "drain");
  }
}
