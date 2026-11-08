#!/usr/bin/env node
export declare const CLI_VERSION: string;
export interface CLIContext {
    cwd?: string;
    stdout?: (message: string) => void;
    stderr?: (message: string) => void;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
}
/** Execute the CLI without terminating the host process. */
export declare function runCli(argv?: string[], context?: CLIContext): Promise<number>;
//# sourceMappingURL=unslop.d.ts.map