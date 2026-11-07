import { once } from "node:events";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { auditTarget, formatAuditReport } from "../analyzer/slop-detector.js";
import { createPresetFromDNA, extractDesignDNA } from "../extractor/extract-dna.js";
import { loadPreset, PRESET_NAMES } from "../presets/index.js";
import { installUnslop, renderAgentSkill } from "../sync/rule-writer.js";
import { UNSLOP_VERSION } from "../version.js";
const LATEST_PROTOCOL_VERSION = "2025-06-18";
const DEFAULT_MAX_MESSAGE_BYTES = 2 * 1024 * 1024;
export const MCP_TOOL_DEFINITIONS = [
    {
        name: "unslop_audit",
        description: "Audit a frontend file or directory for AI slop. Returns the Design Integrity Score, exact diagnostics, and refactoring instructions.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "File or directory to scan, relative to the server project root." },
                ignore: {
                    type: "array",
                    items: { type: "string" },
                    description: "Additional directory base names to skip.",
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: "unslop_extract_dna",
        description: "Extract Design DNA from a CSS file or HTTP(S) URL and compile it into a complete design preset and Agent Skill.",
        inputSchema: {
            type: "object",
            properties: {
                source: { type: "string", description: "CSS path or HTTP(S) URL." },
                name: { type: "string", description: "Human-readable name for the compiled preset." },
                timeoutMs: { type: "number", minimum: 1, description: "Per-request timeout in milliseconds." },
                maxStylesheets: { type: "number", minimum: 0, description: "Maximum external stylesheets to fetch." },
            },
            required: ["source"],
            additionalProperties: false,
        },
    },
    {
        name: "unslop_apply_preset",
        description: "Apply a built-in studio preset to project agent rules and merge unslop into .mcp.json without replacing other MCP servers.",
        inputSchema: {
            type: "object",
            properties: {
                preset: { type: "string", enum: [...PRESET_NAMES] },
                projectDir: { type: "string", description: "Project directory, relative to the server project root." },
            },
            required: ["preset"],
            additionalProperties: false,
        },
    },
];
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function response(id, result) {
    return { jsonrpc: "2.0", id, result };
}
function errorResponse(id, code, message, data) {
    return {
        jsonrpc: "2.0",
        id,
        error: data === undefined ? { code, message } : { code, message, data },
    };
}
function textContent(text) {
    return [{ type: "text", text }];
}
function toolError(error) {
    return {
        content: textContent(`unslop: ${error instanceof Error ? error.message : String(error)}`),
        isError: true,
    };
}
function stringArgument(args, name, required = false) {
    const value = args[name];
    if (value === undefined && !required)
        return undefined;
    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`${name} must be ${required ? "a" : "an optional"} non-empty string.`);
    }
    return value;
}
/** Stateful only for transport configuration; every tool call is deterministic. */
export class UnslopMCPServer {
    cwd;
    version;
    fetchImpl;
    constructor(options = {}) {
        this.cwd = resolve(options.cwd ?? process.cwd());
        this.version = options.version ?? UNSLOP_VERSION;
        if (options.fetchImpl)
            this.fetchImpl = options.fetchImpl;
    }
    async handleMessage(message) {
        if (!isObject(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
            return errorResponse(null, -32600, "Invalid Request");
        }
        const rawID = message.id;
        const hasID = rawID !== undefined;
        if (hasID && typeof rawID !== "string" && typeof rawID !== "number") {
            return errorResponse(null, -32600, "Invalid Request", "id must be a string or number.");
        }
        const id = hasID ? rawID : null;
        try {
            const result = await this.handleMethod(message.method, message.params);
            return hasID ? response(id, result) : null;
        }
        catch (error) {
            if (!hasID)
                return null;
            if (error instanceof MCPMethodError) {
                return errorResponse(id, error.code, error.message, error.data);
            }
            return errorResponse(id, -32603, "Internal error", error instanceof Error ? error.message : String(error));
        }
    }
    async handlePayload(payload) {
        if (!Array.isArray(payload))
            return this.handleMessage(payload);
        if (payload.length === 0)
            return errorResponse(null, -32600, "Invalid Request");
        const responses = await Promise.all(payload.map((message) => this.handleMessage(message)));
        const filtered = responses.filter((entry) => entry !== null);
        return filtered.length > 0 ? filtered : null;
    }
    async handleMethod(method, params) {
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
                instructions: "Use unslop_audit before and after frontend work, unslop_extract_dna to clone visual tokens, and unslop_apply_preset to install a complete design system.",
            };
        }
        if (method === "notifications/initialized" || method === "notifications/cancelled")
            return null;
        if (method === "ping")
            return {};
        if (method === "tools/list")
            return { tools: MCP_TOOL_DEFINITIONS };
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
            }
            catch (error) {
                return toolError(error);
            }
        }
        throw new MCPMethodError(-32601, "Method not found", method);
    }
    async callTool(name, args) {
        if (name === "unslop_audit") {
            const target = stringArgument(args, "path") ?? ".";
            const ignore = args.ignore;
            if (ignore !== undefined && (!Array.isArray(ignore) || ignore.some((entry) => typeof entry !== "string"))) {
                throw new Error("ignore must be an array of directory names.");
            }
            const report = await auditTarget(resolve(this.cwd, target), {
                cwd: this.cwd,
                ignore: ignore ?? [],
            });
            return {
                content: textContent(formatAuditReport(report)),
                structuredContent: report,
            };
        }
        if (name === "unslop_extract_dna") {
            const source = stringArgument(args, "source", true) ?? "";
            const timeoutMs = args.timeoutMs;
            const maxStylesheets = args.maxStylesheets;
            if (timeoutMs !== undefined && (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0)) {
                throw new Error("timeoutMs must be a positive number.");
            }
            if (maxStylesheets !== undefined && (!Number.isInteger(maxStylesheets) || maxStylesheets < 0)) {
                throw new Error("maxStylesheets must be a non-negative integer.");
            }
            const input = /^https?:\/\//i.test(source) ? source : resolve(this.cwd, source);
            const dna = await extractDesignDNA(input, {
                ...(timeoutMs === undefined ? {} : { timeoutMs: timeoutMs }),
                ...(maxStylesheets === undefined ? {} : { maxStylesheets: maxStylesheets }),
                ...(this.fetchImpl ? { fetchImpl: this.fetchImpl } : {}),
            });
            const preset = createPresetFromDNA(dna, stringArgument(args, "name") ?? "extracted-dna");
            const skill = renderAgentSkill(preset);
            return {
                content: textContent(`Compiled ${preset.title} from ${source}.\n\n${JSON.stringify(preset, null, 2)}`),
                structuredContent: { dna, preset, skill },
            };
        }
        if (name === "unslop_apply_preset") {
            const preset = stringArgument(args, "preset", true) ?? "";
            loadPreset(preset);
            const projectDir = stringArgument(args, "projectDir") ?? ".";
            const result = await installUnslop({
                cwd: resolve(this.cwd, projectDir),
                preset,
            });
            return {
                content: textContent(`Installed ${result.preset}.\n${result.files.map((file) => `${file.status}: ${file.path}`).join("\n")}`),
                structuredContent: result,
            };
        }
        throw new Error(`Unsupported tool: ${name}`);
    }
}
class MCPMethodError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = "MCPMethodError";
    }
}
/** Serve newline-delimited JSON-RPC 2.0 over MCP stdio until input closes. */
export async function startMcpServer(options = {}) {
    const input = options.input ?? process.stdin;
    const output = options.output ?? process.stdout;
    const maxMessageBytes = options.maxMessageBytes ?? DEFAULT_MAX_MESSAGE_BYTES;
    if (!Number.isInteger(maxMessageBytes) || maxMessageBytes <= 0) {
        throw new Error("maxMessageBytes must be a positive integer.");
    }
    const server = new UnslopMCPServer(options);
    const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
    for await (const line of lines) {
        let payload;
        let parsed = true;
        if (Buffer.byteLength(line, "utf8") > maxMessageBytes) {
            payload = undefined;
            parsed = false;
        }
        else {
            try {
                payload = JSON.parse(line);
            }
            catch {
                parsed = false;
            }
        }
        const result = parsed
            ? await server.handlePayload(payload)
            : errorResponse(null, -32700, "Parse error", "Expected one JSON-RPC message per line within the configured size limit.");
        if (result === null)
            continue;
        const serialized = `${JSON.stringify(result)}\n`;
        if (!output.write(serialized, "utf8"))
            await once(output, "drain");
    }
}
//# sourceMappingURL=server.js.map