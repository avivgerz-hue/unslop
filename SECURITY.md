# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 2.1.x | Yes |
| < 2.1 | No |

## Reporting a vulnerability

**Do not open a public issue for a security problem.**

Email **security@vibefoundry.dev** with:

- a description of the issue and its impact
- the affected version of `unslop-mcp`
- a minimal reproduction (a snippet, a repository, or a failing test)
- whether you intend to publish, and any deadline you are working to

You get an acknowledgement within **48 hours** and a triage decision within
**5 business days**. If the report is valid we will:

1. confirm the severity using the CVSS v3.1 vector,
2. ship a fix in a patch release,
3. publish a GitHub Security Advisory crediting you (unless you prefer to stay
   anonymous),
4. request a CVE if the impact warrants one.

## Scope

unslop is a static UI and CSS design linter that also runs as an MCP server. It
reads the files you point it at and reports findings. Reports about path
handling, unexpected file writes, unsafe processing of untrusted project files,
and the MCP server interface are all in scope.
