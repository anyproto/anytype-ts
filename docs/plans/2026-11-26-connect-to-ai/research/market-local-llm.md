# Local-model ecosystems: LM Studio, Ollama, Jan, AnythingLLM (verified 2026-11-26)

Verified by: live docs fetches, GitHub source (janhq/jan, Mintplex-Labs/anything-llm), local `lms`/`ollama --help`. No config contents read. GitHub API rate limit was hit late; remaining gaps are marked unconfirmed.

## 1. Directories / marketplaces
| Ecosystem | Directory | MCP servers listable? |
|---|---|---|
| LM Studio | LM Studio Hub (https://lmstudio.ai/hub, login-gated; plugins, presets, models). `lms push` is "Develop & Publish (Beta)". | No MCP category found. Docs only mention an "Add to LM Studio" deeplink *button* that MCP server authors put on their own pages ("when available") - this is the real "listing" mechanism, no review. |
| Ollama | None. | Ollama has no MCP client in the app (issue #7865 still open per 2026 sources; no official doc found). Nothing to list. |
| Jan | No hub found. | n/a |
| AnythingLLM | Community Hub (agent skills, system prompts, slash commands). | MCP is not a hub item type. |

Ollama: `ollama --version` = 0.40.14 here; `ollama launch` integrations (claude, codex, chatgpt app etc.) connect those apps TO Ollama models - not the reverse, so irrelevant to Anytype.

## 2. Submission
- LM Studio Hub: plugins only (`lms login`, `lms push`). No MCP manifest. Review/fees unconfirmed.
- Ollama: no process (PR/partnership into Go code). AnythingLLM hub: `@mintplex-labs/anythingllm-hub-cli` for agent skills only (unverified this round).
- Jan: nothing.
Conclusion unchanged: no marketplace worth pursuing; the deeplink IS the one-click install.

## 3. Local-only server
All four run on the user's machine, so a loopback server works with no tunnel. Nothing needs to be "listed".

## 4. Install experience
### LM Studio (best route)
- MCP host since 0.3.17 (b10). Config follows Cursor `mcp.json` notation (`mcpServers` wrapper in the file).
- Deeplink (CONFIRMED): `lmstudio://add_mcp?name=<server-name>&config=<base64(JSON)>`. The JSON is the entry WITHOUT name wrapper, e.g. decoded official example: `{"url":"https://huggingface.co/mcp","headers":{"Authorization":"Bearer <TOKEN>"}}`. Base64 is the standard alphabet with padding; `=` percent-encoded as `%3D` (so use encodeURIComponent on the base64 string, which also handles `+` and `/`). Docs do not state std vs url-safe: example is consistent with std; test.
- Static Authorization header supported (official example). Loopback `http://127.0.0.1` URL: NOT documented, UNCONFIRMED (needs a real LM Studio test). OAuth, env-var interpolation, live reload: not documented.
- Entry for Anytype: `{"url":"http://127.0.0.1:31009/mcp/small","headers":{"Authorization":"Bearer <KEY>"}}` with name `anytype`.
- Confirmation dialog: not documented; expect an install-confirm UI.
- mcp.json path: docs say `~/.lmstudio/mcp.json` (macOS/Linux) and `%USERPROFILE%\.lmstudio\mcp.json` (Windows); a bug report (lmstudio-bug-tracker #1371, LM Studio 0.3.33, macOS 26.2) says the dir did not exist and a copy lived at `~/.cache/lm-studio/mcp.json`. On this machine `~/.lmstudio` is absent (LM Studio data is in ~/Library/Application Support/LM Studio). So: do NOT rely on file writing; prefer the deeplink. In-app route: Program tab > Install > Edit mcp.json.
- Related: LM Studio's own server API (0.4.0+) supports `ephemeral_mcp` integrations with `headers` and requires "Allow per-request MCPs" / "Allow calling servers from mcp.json" in Server Settings - relevant only for API users; chat UI use of mcp.json servers is the normal path.
- Note LM Studio `lms` CLI has no `mcp` subcommand (checked `lms --help`).

### Jan (v0.8.8, 2026-10-28)
- Transports STDIO / HTTP (Streamable) / SSE (docs). Config file `mcp_config.json` in the Jan data folder (CONFIRMED in source: `<jan_data>/mcp_config.json`, overridable by `JAN_DATA_FOLDER`). macOS data folder `~/Library/Application Support/Jan/data` (from Jan autoqa source comment); Windows/Linux exact path UNCONFIRMED (Tauri roaming appdata / `$XDG_DATA_HOME` or `~/.local/share` + `Jan/data`).
- CORRECTION: file does have a top-level `mcpServers` object (plus `mcpSettings`); the "don't wrap in mcpServers" third-party claim is wrong for the file (it is right for UI paste forms, unconfirmed). Entry schema from source (`extract_command_args`): `{"type":"http","url":"...","headers":{...},"active":true}`; `type` must be `http` or `sse` for URL servers (stdio otherwise needs `command`+`args`); `active` bool.
- Auth: if you set an Authorization header it is used as-is (OAuth skipped) - CONFIRMED in docs. Jan also supports OAuth with dynamic registration (not usable for Anytype: no OAuth).
- CLI (CONFIRMED in source jan-cli): `jan cli mcp add <name> --type http --url <URL> --header "Authorization=Bearer <KEY>" --active` (also `list [--show-secrets]`, `get`, `remove`, `enable`, `disable`). Header syntax is KEY=VALUE. Requires `jan` CLI on PATH (bundled with Jan? unconfirmed); the CLI edits the same mcp_config.json. Whether a running Jan Desktop picks up file edits live: UNCONFIRMED (assume restart or toggle).
- Deeplink: Jan registers `jan://` via tauri deep-link plugin, but no MCP-install route found: UNCONFIRMED/none.

### AnythingLLM Desktop
- File `plugins/anythingllm_mcp_servers.json` inside the AnythingLLM storage dir (per-OS dir not in the page; storage dir guide). CONFIRMED in source: the server creates the file if missing; schema `{"mcpServers":{name:{...}}}`; for URL servers `type` is optional and one of `sse`/`streamable`/`http`, omitted => SSE assumed (so set `"type":"streamable"`); `url` must parse as URL; headers key assumed (client code uses headers - not re-confirmed this round).
- Entry: `{"mcpServers":{"anytype":{"type":"streamable","url":"http://127.0.0.1:31009/mcp/small","headers":{"Authorization":"Bearer <KEY>"}}}}`
- Reload: Agent Skills page > Refresh, NO app restart (CONFIRMED docs).
- Deeplinks documented: open-chat, pull-hf, set-provider (Desktop 1.18.0+, confirmation screens). No MCP deeplink.
- Per-OS storage dir: UNCONFIRMED here (commonly ~/Library/Application Support/anythingllm-desktop/storage, %APPDATA%\anythingllm-desktop\storage, ~/.config/anythingllm-desktop/storage).

### Ollama
No client; nothing to install. Show "use via LM Studio / Jan / AnythingLLM".

## 5. Precedents
None verified.

## Verification log
| Claim | Status | Source |
|---|---|---|
| lmstudio://add_mcp?name=&config=base64 | CONFIRMED | https://lmstudio.ai/docs/app/mcp/deeplink |
| config JSON has no name wrapper (entry only) | CONFIRMED by decoding official example | same |
| config is std Base64 + %3D | PARTIAL: padding %3D confirmed; alphabet unstated | same |
| LM Studio supports static Authorization header | CONFIRMED | https://lmstudio.ai/docs/app/mcp |
| loopback http URL accepted | UNCONFIRMED | not documented |
| LM Studio since 0.3.17 | CONFIRMED | docs/app/mcp |
| mcp.json at ~/.lmstudio/mcp.json | CORRECTED: documented but disputed (absent here; issue says ~/.cache/lm-studio) | https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/1371 |
| LM Studio Hub has no MCP category | CONFIRMED (hub page unreadable; docs mention only plugins) | https://lmstudio.ai/hub |
| Ollama has no MCP client | CONFIRMED (secondary sources; no official doc) | web search 2026-11 |
| Jan mcp_config.json no mcpServers wrapper | CORRECTED -> file has `mcpServers` + `mcpSettings` | janhq/jan src-tauri/src/core/cli/mcp.rs |
| Jan HTTP entry schema | CORRECTED/NEW: `type: http|sse`, `url`, `headers`, `active` | janhq/jan core/mcp/models.rs |
| `jan cli mcp add` syntax | CONFIRMED/NEW: `--type http --url --header K=V --active` | janhq/jan jan-cli/src/main.rs |
| Jan Authorization header used as-is | CONFIRMED | https://docs.jan.ai/desktop/integrations/mcp-servers |
| Jan jan:// MCP deeplink | UNCONFIRMED (none found) | - |
| AnythingLLM type values | CORRECTED: sse, streamable, http all valid; default sse | Mintplex-Labs/anything-llm server/utils/MCP/hypervisor/index.js |
| AnythingLLM Refresh needs no restart | CONFIRMED | https://docs.anythingllm.com/mcp-compatibility/desktop |
| AnythingLLM has no MCP deeplink | CONFIRMED | https://docs.anythingllm.com/installation-desktop/deep-links |
| Anything-LLM file auto-created | CORRECTED: server creates it with blank options if missing (researcher said user must open page) | same source |
| `lms` has mcp subcommand | CONFIRMED absent | local `lms --help` |

## Recommendation for Anytype
Primary (LM Studio): user clicks "Connect to LM Studio" > picks spaces and read/write > Anytype mints key via RPC, builds the base64 entry for `http://127.0.0.1:<port>/mcp/small` (port from settings; consider `large` for capable models), opens `lmstudio://add_mcp?...` with shell.openExternal; user confirms in LM Studio. Must be tested against a real LM Studio for loopback acceptance.
Fallback: show the JSON with "Copy" and instruct Program > Install > Edit mcp.json (paste only the inner entry under mcpServers); do not write `~/.lmstudio/mcp.json` blindly.
Jan: if Jan is installed, run `jan cli mcp add anytype --type http --url ... --header "Authorization=Bearer KEY" --active` (verify CLI exists) or merge into `<Jan data>/mcp_config.json` atomically, then tell user to restart/toggle in Settings > MCP Servers. Fallback: guided paste into the + Add MCP Server form.
AnythingLLM: merge entry into `plugins/anythingllm_mcp_servers.json` in its storage dir (create if absent), tell user to click Refresh on Agent Skills; no restart.
Ollama: no flow; link to LM Studio/Jan/AnythingLLM.
Gotchas: tier `small` for local models; Anytype's origin check is irrelevant (these are desktop clients); keep the key scoped; merge not overwrite existing configs; back up file before writing; no OAuth anywhere so static header is mandatory; Jan docs claim OAuth auto-attempt is skipped when header is set.
