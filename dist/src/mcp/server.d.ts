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
export declare const MCP_TOOL_DEFINITIONS: readonly MCPToolDefinition[];
/** Stateful only for transport configuration; every tool call is deterministic. */
export declare class UnslopMCPServer {
    readonly cwd: string;
    readonly version: string;
    private readonly fetchImpl?;
    constructor(options?: MCPServerOptions);
    handleMessage(message: unknown): Promise<JSONRPCResponse | null>;
    handlePayload(payload: unknown): Promise<JSONRPCResponse | JSONRPCResponse[] | null>;
    private handleMethod;
    private callTool;
}
/** Serve newline-delimited JSON-RPC 2.0 over MCP stdio until input closes. */
export declare function startMcpServer(options?: MCPStdioOptions): Promise<void>;
export {};
//# sourceMappingURL=server.d.ts.map