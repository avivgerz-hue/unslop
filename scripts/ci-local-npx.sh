#!/usr/bin/env bash
# CI-only stand-in for npx: run the exact packed, unpublished candidate.
set -euo pipefail
[[ "${1:-}" == "--prefix" && -n "${2:-}" ]] || { echo 'Unexpected npx prefix' >&2; exit 2; }
shift 2
[[ "${1:-}" == "-y" && "${2:-}" == "unslop-mcp@2.1.0" ]] || { echo 'Unexpected npx package' >&2; exit 2; }
shift 2
exec node "${UNSLOP_CI_PACKAGE:?}/dist/bin/unslop.js" "$@"
