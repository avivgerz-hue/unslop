#!/usr/bin/env node
export declare const CLI_VERSION = "1.2.0";
export interface CLIContext {
    cwd?: string;
    stdout?: (message: string) => void;
    stderr?: (message: string) => void;
}
/** Execute the CLI without terminating the host process. */
export declare function runCli(argv?: string[], context?: CLIContext): Promise<number>;
//# sourceMappingURL=unslop.d.ts.map