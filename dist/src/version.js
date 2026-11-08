import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = require("unslop-mcp/package.json");
/** Runtime version is always read from the npm manifest; never duplicate it. */
export const UNSLOP_VERSION = manifest.version;
//# sourceMappingURL=version.js.map