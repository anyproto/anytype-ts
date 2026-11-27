# Gap 3: deeplink installs carrying Authorization headers (checked 2026-11-27)

## VS Code (strongest evidence: source read)
- Source: microsoft/vscode main, src/vs/workbench/contrib/mcp/browser/mcpWorkbenchService.ts (gh api, 2026-11-27).
- handleURL: path `mcp/install` -> parseMcpInstallUriPayload(query) = JSON.parse(decodeURIComponent(query)); needs string `name`.
- sanitizeMcpServerConfiguration: no `command` -> type remote; requires `url`; copies `headers` via sanitizeStringRecord (header kept) plus `oauth`. => `{"name":"anytype","type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer KEY"}}` is CONFIRMED accepted by code. No host restriction on URL seen (127.0.0.1 fine). Rejected only if command variables are present.
- Flow: opens the server's detail editor (McpWorkbenchServer) where the user clicks Install (docs: code.visualstudio.com/api/extension-guides/ai/mcp). Exact dialog text not verified; headers presumably visible in the editor view. UNCONFIRMED visually.
- `code --add-mcp '<json>'`: CONFIRMED present in current source (argv.ts "Adds a Model Context Protocol server definition to the user profile"; mcpManagementCli.ts validateConfiguration requires name + (command|url), passes rest of config, incl. headers, to mcpManagementService.install). No confirm dialog; writes the user-profile mcp.json. Needs `code` on PATH (fallback: app bundle `Contents/Resources/app/bin/code`). Earlier report (vscode-copilot.md) marked it unconfirmed: that is now resolved as existing.
- Caveat stays: lands in editor-managed profile config, forwarding to the Copilot harness unconfirmed.
- Origin header: not applicable from source reading; unverified. Extension host MCP client is Node (no Origin by default).

## Cursor
- Docs https://cursor.com/docs/mcp/install-links (fetched 2026-11-27): `cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG`; config "same format as mcp.json"; only example is a stdio command; no mention of url/headers; says "Cursor prompts to install the server" (no dialog contents given).
- Headers via deeplink: still UNCONFIRMED by primary sources (Cursor is closed source). Plausible because config = mcp.json entry, and Cursor mcp.json supports url+headers. Needs a 5-minute manual test. Known security write-up: Proofpoint "CursorJack" (Jan 2026) shows the dialog is the only guard.
- Origin: unverified.

## LM Studio
- Docs https://lmstudio.ai/docs/app/mcp/deeplink (also /docs/app/plugins/mcp/deeplink), fetched 2026-11-27: `lmstudio://add_mcp?name=<name>&config=<base64 JSON>` (underscore; one third-party article's `add-mcp` is wrong). The docs' OWN example is a remote entry `{"url":"https://huggingface.co/mcp","headers":{"Authorization":"Bearer <YOUR_HF_TOKEN>"}}` (base64 of INNER entry, URL-encoded `=` as %3D). => url + headers.Authorization is CONFIRMED as the documented use case.
- Docs warn not to install from untrusted sources; no dialog text documented. http://127.0.0.1: not specifically documented (LM Studio's own mcp.json notes allow remote url; unconfirmed for loopback http, expected to work).
- Origin: unverified. Verdict vs file write: deeplink is officially supported with headers, so it is a valid primary route (file write to ~/.lmstudio/mcp.json remains an alternative; see lmstudio.md).

## Raycast
- Official docs (manual.raycast.com/ai/model-context-protocol, developers.raycast.com deeplinks page; fetched 2026-11-27): NO documented `raycast://mcp/install`. Docs describe only the "Install MCP Server" command / "Install New Server" form with an HTTP Headers key/value field (sent with every request), HTTP+OAuth sign-in, stdio. Raycast does not confirm per tool call for connected apps.
- Only secondary blogs (DEV Community "Raycast Review 2026", Effloow) claim `raycast://mcp/install?<percent-encoded config JSON>` using the mcpServers layout with command/args; no url/headers example. Treat as UNCONFIRMED/undocumented.
- Local check: Raycast 1.104.38 installed here; binary strings show MCPServersImportViewController / MCPImportServersCommand / "mcpServers" => Raycast has an in-app JSON import (clipboard/paste of mcp.json style) that is a better target than a deeplink. Also StreamableHTTPClientTransport exists, so remote HTTP works (contradicting a Pieces doc claiming stdio only). No "mcp/install" URL string was found in the binary (inconclusive, strings may be obfuscated).
- Recommendation: do NOT rely on a Raycast deeplink; use copy-to-clipboard of the mcpServers JSON + open the "Import MCP Servers" command (`raycast://extensions/raycast/raycast-ai/import-mcp-servers`-style command link, exact path UNCONFIRMED), or guide the manual form (URL + Authorization header). Raycast MCP is Pro-gated per docs.

## Decision summary
| App | Deeplink with url+Authorization | Silent route | Primary |
|---|---|---|---|
| VS Code | CONFIRMED (source) | `code --add-mcp` CONFIRMED | `code --add-mcp` if on PATH, else vscode:mcp/install |
| Cursor | UNCONFIRMED (test) | write ~/.cursor/mcp.json | file write, deeplink fallback |
| LM Studio | CONFIRMED (official docs example) | write mcp.json | deeplink (user confirms in app), file as alt |
| Raycast | no official deeplink | none | clipboard + import command/manual form |
Origin header: no client was shown to send Origin; Anytype's origin check is expected to not trigger for these non-browser clients (VS Code/Cursor/LM Studio/Raycast are native Node/Swift transports), but test once per app.
Secrecy: a deeplink puts the key in a URL (OS handler logs); a locally fired `open` is the lesser evil, never via a web redirect page.
