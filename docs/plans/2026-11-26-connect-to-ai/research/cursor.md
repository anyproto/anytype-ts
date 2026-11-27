# Cursor (editor + Cursor CLI/agent) - Anytype connection research
Researched 2026-11-26. Method: live fetch of cursor.com docs (fetched via summarizing WebFetch, so exact strings should be re-verified before shipping), forum threads, one security blog. Cursor is NOT installed on the research machine (no /Applications/Cursor.app, no `cursor`/`agent` on PATH), so nothing was tested hands-on. ~/.cursor exists on this machine (mcp.json top-level key: `mcpServers`; skills/ dir) - consistent with the docs. Contents not read.

## 1. Surfaces & platforms
- Desktop IDE (macOS, Windows, Linux) - the main surface. Current version: unconfirmed (changelog page shows dates only; latest entry Nov 6 2026 "Voice Chat with Agents"). Forum reports mention "Cursor 2.6.21" (Mar 2026) and "v3" (Apr 2026).
- Cursor CLI: binary is `agent` per current docs (older docs/forum: `cursor-agent`). Install: macOS/Linux/WSL `curl https://cursor.com/install -fsS | bash`; Windows `irm 'https://cursor.com/install?win32=true' | iex`. Version unconfirmed.
- Cloud Agents / web (cursor.com/agents): do NOT read ~/.cursor/mcp.json; use servers configured at cursor.com/agents. Cannot reach user's 127.0.0.1. Out of scope.
- IDE "extension" surface: Cursor is a VS Code fork; an extension API exists for registering MCP servers, but a forum thread says headers for RemoteServerConfig are not sent via that API (unconfirmed fix). Not useful.
- Agent SDK (Oct 20 2026) has an `mcp-connections/` folder - irrelevant to desktop connect.

## 2. MCP support
- Transports (docs): stdio, SSE, Streamable HTTP. Remote entries take `url`; local stdio takes `command/args/env/envFile`.
- Static headers: yes, `"headers": {"Authorization": "Bearer ..."}` on remote entries.
- Env interpolation (docs): `${env:NAME}`, `${userHome}`, `${workspaceFolder}`, `${workspaceFolderBasename}`, `${pathSeparator}`, `${/}` in `command,args,env,url,headers`. Example from docs: `"Authorization": "Bearer ${env:MY_SERVICE_TOKEN}"`.
  - CAVEAT: forum bug (Mar 27 2026, Cursor 2.6.21, Linux): literal `${env:X}` sent in remote header; closed unresolved; staff hint: GUI-launched Cursor does not inherit shell rc vars. => Do NOT rely on env interpolation for Anytype; write the literal token. 
- No keychain / prompted-secret inputs for user-level mcp.json (unconfirmed any). Plugins have `variables` configured in dashboard (team-oriented). Feature request open for a headersHelper-like command.
- OAuth: supported (PKCE, dynamic registration; static `auth: {CLIENT_ID, CLIENT_SECRET, scopes}`; desktop callback http://localhost:8787/callback). Anytype has no OAuth - irrelevant, but see bug below.
- BUG RISK: "headers ignored when server has OAuth discovery" (forum, Mar-Apr 2026, staff Apr 15: not fixed, no workaround). Anytype serves no .well-known, so should not trigger. IMPORTANT: if Anytype later adds OAuth discovery metadata, Cursor would ignore the Bearer header. Keep it absent.
- Localhost: docs' own remote example is `http://localhost:3000/mcp`; local HTTP works from the desktop app (it executes locally). No HTTPS requirement found. Use `127.0.0.1` vs `localhost`: both should work; unconfirmed edge differences.
- Misleading-OAuth-error on expired bearer (forum) - cosmetic. Use non-expiring or long-lived key.
- Streamable HTTP forum report (Aug 2026): extra headers dropped on tools/call for project .cursor/mcp.json (closed). Prefer user-level ~/.cursor/mcp.json and a single Authorization header; verify tool call works in QA.
- Anytype specifics: native endpoint returns JSON only (no SSE) - fine for Streamable HTTP clients. Origin check refuses browser origins - Cursor desktop MCP client is not a browser (Node), unconfirmed Origin header absence; test.

## 3. Ways to add a server, by effort
### A. Deeplink (one click, with confirmation dialog) - lowest effort
Format (docs https://cursor.com/docs/mcp/install-links):
```
cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG
```
config = base64(JSON.stringify(server object)). The docs' sample decodes to the INNER server object (`{"command":"npx","args":[...]}`) without the name wrapper, name passed separately (the docs' prose example shows the wrapped JSON - ambiguity; secondary sources agree inner object only).
Worked example for Anytype (inner object):
```
JSON: {"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}
Link: cursor://anysphere.cursor-deeplink/mcp/install?name=anytype&config=<base64 of above>
Node: Buffer.from(JSON.stringify(cfg)).toString('base64')   (standard base64; URL-encode +,/,= when building the URL: encodeURIComponent)
```
- Headers inside deeplink config: docs say nothing; secondary source says unverified. Treat as "likely works since config = mcp.json entry", UNCONFIRMED. Must test.
- Is the header stored as-is? Static headers sit in plaintext in mcp.json (TrueFoundry blog, secondary). Deeplink install then writes the entry to ~/.cursor/mcp.json (unconfirmed exact path used by deeplink; presumably user-level).
- Install dialog shows server name + config preview and a generic warning; Proofpoint "CursorJack" (Jan 2026) documented abuse; Cursor classed it out of scope. Whether headers are visible in dialog: unconfirmed.
- Web (https) install link: cursor.com/en/install-mcp is mentioned in older sources, but docs show NO https form (only cursor:// text link/button). Unconfirmed -> not needed since Anytype is native app that can call shell.openExternal("cursor://...").
- Deeplink triggers Cursor to open/launch if URL scheme registered; user must click Install in Cursor.

### B. Direct write of config file (zero click, silent)
- User: `~/.cursor/mcp.json`  (docs). Windows: `%USERPROFILE%\.cursor\mcp.json`; Linux: `~/.cursor/mcp.json` (docs only show `~/`; Windows/Linux expansion is by convention - unconfirmed in docs, no known Flatpak/Snap variant for Cursor which ships AppImage/deb/rpm).
- Project: `<project>/.cursor/mcp.json`.
- Format:
```json
{
  "mcpServers": {
    "anytype": {
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <ANYTYPE_API_KEY>" }
    }
  }
}
```
(`type` optional; transport inferred from `url`. Docs fields for stdio: type, command, args, env, envFile.)
- Fallback stdio entry (needs Node): `{"command":"npx","args":["-y","@anyproto/anytype-mcp"],"env":{"OPENAPI_MCP_HEADERS":"{\"Authorization\":\"Bearer <KEY>\",\"Anytype-Version\":\"2025-11-08\"}"}}` - header JSON format per existing npm server; not Cursor-verified. Avoid: needs Node.
### C. In-app UI: CORRECTED - current docs say open **Customize** in the sidebar (older builds: Settings > Tools & MCP / MCP). Use wording "Cursor > Customize (or Settings > MCP)" in Anytype UI; do not hard-code a path.
### D. CLI: no `agent mcp add` command (docs list only list, list-tools, login, enable, disable). CLI reads same mcp.json (project -> global -> nested precedence, searches parent dirs). New servers need approval: `agent mcp enable anytype` or `--approve-mcps`. Forum (Sep-Oct 2025) said CLI ignored remote servers/headers; later partially resolved (unconfirmed current state). => After writing mcp.json, Anytype can run `agent mcp enable anytype` (if `agent` on PATH) and `agent mcp list-tools anytype` as a self-test.
### E. Plugin (see 6/7).

## 4. Safe merge / reload
- Safe to merge: read JSON, set `mcpServers.anytype`, write back atomically, preserve other keys; keep a timestamped backup. Real file has top-level `mcpServers` with other servers (e.g. stdio w/ env secrets) - never log it. File is plain JSON (JSONC comments tolerated? unconfirmed) - if parse fails, fall back to deeplink and do not overwrite.
- Live reload: docs do not say. Observed in practice (community) that Cursor watches mcp.json and shows the server in Settings > MCP, toggle needed; UNCONFIRMED here. Docs only say for custom servers "update local files and restart Cursor". Plan: after write, tell user "Open Customize/Settings > MCP in Cursor, toggle anytype on, or restart Cursor"; CLI picks up on next run.
- Cursor itself may rewrite mcp.json when user edits via UI; scopes: global vs project (project overrides). Don't write to project scope unless chosen. Cloud agents ignore the file.
- Sandbox: Cursor is not sandboxed on mac/Win/Linux (no Flatpak/Snap official) - writing ~/.cursor is fine. macOS TCC doesn't guard dotfolders in home.

## 5. Detection
- macOS: app `/Applications/Cursor.app` (also `~/Applications`); bundle id `com.todesktop.230313mzl4w4u92` (commonly cited, unconfirmed live); URL scheme `cursor://` (check via LSCopyDefaultApplicationURLForURL / `open -Ra Cursor`). Config dir `~/.cursor` (exists once run; it existed on machine even w/o app -> weak signal).
- Windows: `%LOCALAPPDATA%\Programs\cursor\Cursor.exe`; registry HKCU\Software\Classes\cursor (URL protocol); shell command `cursor` on PATH (`...\cursor\resources\app\bin`). Unconfirmed live.
- Linux: `/usr/bin/cursor`, `/opt/Cursor`, AppImage in ~/Applications or ~/Downloads; `xdg-mime query default x-scheme-handler/cursor` -> cursor.desktop. Unconfirmed live.
- CLI: `agent` (or legacy `cursor-agent`) on PATH, typically ~/.local/bin; `agent --version`.
- Caveat: `~/.cursor` alone does not prove installation.

## 6. Skills / plugins
- Agent Skills (SKILL.md, agentskills.io) supported. Locations: project `.agents/skills/`, `.cursor/skills/`; user `~/.agents/skills/`, `~/.cursor/skills/`; compat `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, `~/.codex/skills/`. Front matter: `name` (must match folder), `description`; optional paths, disable-model-invocation, icon, color, metadata; dirs scripts/ references/ assets/. Loaded at startup (restart/reload may be needed). => Anytype can drop `~/.agents/skills/anytype/SKILL.md` (shared with Codex etc.) - one write serves several apps.
- Plugins: two formats - Agent Plugin (root `plugin.json` with $schema https://agent-plugins.org/schemas/1.0.0/plugin.schema.json; skills + mcp.json) and Cursor Plugin (`.cursor-plugin/plugin.json`, `name` only required; adds rules/*.mdc, agents, commands, hooks, variables). MCP servers in plugin appear as `plugin-<plugin>-<server>`. Plugin secrets via `variables` + dashboard (`${VAR}`, not `${env:}`), a team-admin flow; for individual local keys awkward.
- Install: Marketplace UI (Customize > Install, project/user scope); local plugins: copy to `~/.cursor/plugins/local/<name>` then restart or "Developer: Reload Window" (Enterprise needs "Allow Local Plugin Imports"). No documented CLI/deeplink for plugin install. Local plugin mcp.json could carry the key, but plain mcp.json write is simpler.

## 7. Marketplace
- Cursor Marketplace for plugins: submit repo at https://cursor.com/marketplace/publish; manual review, must be open source, each update reviewed; checklist: valid manifest, kebab-case unique name, description, README, relative paths, declare ${VARS}. Also an MCP Directory exists (cursor.com/docs/context/mcp/directory referenced) - submission process unconfirmed.
- Localhost-only server listing: docs silent; a plugin can ship an mcp.json with `url: http://127.0.0.1:31009/mcp/large` and a `variables` entry for the API key (plugin var in header `Bearer ${ANYTYPE_API_KEY}`), but the user would still need to mint/paste the key in dashboard -> defeats zero-touch. Listing is useful for discovery/skill distribution, not for key provisioning. Eligibility of localhost plugin: unconfirmed.

## 8. Recommendation
Zero-touch route (Anytype desktop, "Connect to Cursor"):
1. User clicks Connect to Cursor, picks spaces + read/read-write (+ optional expiry), clicks Create. Anytype mints key via internal RPC (no pairing code).
2. Anytype reads ~/.cursor/mcp.json (create if missing), merges `mcpServers.anytype = {url:"http://127.0.0.1:<port>/mcp/large", headers:{Authorization:"Bearer <key>"}}`, atomic write + backup. Use actual configured port.
3. Optionally writes `~/.agents/skills/anytype/SKILL.md`.
4. If `agent` on PATH: run `agent mcp enable anytype`. 
5. UI says: "Open Cursor > Settings > MCP and switch anytype on (restart Cursor if not listed)". Clicks: 2-3 in Anytype + 1 toggle in Cursor.
Fallback: "Add to Cursor" button -> shell.openExternal of the cursor:// deeplink with name=anytype and base64 config (token inside the link; user confirms Install dialog in Cursor): 2 clicks, no file access, works if file parse fails. Final fallback: show JSON snippet with Copy button + OS-specific path (~/.cursor/mcp.json, %USERPROFILE%\.cursor\mcp.json).
Gotchas:
- Token is plaintext in mcp.json (and in deeplink, shell history/URL handler logs). Mint a dedicated per-app key named "Cursor", scope to chosen spaces, default read-only or let user choose, offer expiry; show revoke in Anytype. Prefer file write over deeplink for secrecy (deeplink value can leak via OS URL logs; Proofpoint-type spoof warning).
- Do not use ${env:} for the key (GUI launch doesn't inherit env; interpolation bug in remote headers).
- Never add OAuth discovery metadata to the endpoint without testing: Cursor ignores configured headers when OAuth discovery exists (open bug, Apr 2026).
- Project-level .cursor/mcp.json had header-drop reports; use user scope.
- Cloud Agents/web can't reach localhost.
- Tool count: `large` tier should be fine; Cursor warns/limits at many tools (commonly ~40 tool cap, unconfirmed) - another reason to default to `large` not `full`.
- Test items before release (unconfirmed): deeplink with headers; live reload behaviour; Origin header/origin check vs Cursor MCP client; `agent mcp enable` success with remote header server.

## Sources (fetched 2026-11-26)
- https://cursor.com/docs/mcp/install-links (deeplink format)
- https://cursor.com/docs/mcp (config, interpolation, OAuth, transports)
- https://cursor.com/docs/cli/mcp (CLI commands)
- https://cursor.com/docs/cli/overview (install, `agent` binary)
- https://cursor.com/docs/plugins ; https://cursor.com/docs/reference/plugins (plugin formats, submission)
- https://cursor.com/docs/skills (skills dirs)
- https://cursor.com/changelog (latest entry Nov 6 2026)
- https://www.proofpoint.com/us/blog/threat-insight/cursorjack-weaponizing-deeplinks-exploit-cursor-ide (Jan 2026)
- https://forum.cursor.com/t/config-interpolation-env-name-not-working-in-headers-for-remote-mcp-servers/156069 (Mar-Apr 2026)
- https://forum.cursor.com/t/mcp-headers-config-ignored-when-server-has-oauth-discovery/156054 (Mar-Apr 2026)
- https://forum.cursor.com/t/cursor-cli-cant-use-remote-mcp-servers-or-local-with-auth-requirements/134112 (Sep-Oct 2025)
- Secondary: truefoundry.com MCP auth in Cursor blog; danywalls.com / aiengineerguide.com deeplink tutorials (config = inner server object)


## Verification log (2026-11-26, verifier)
Machine: Cursor.app and `cursor`/`agent`/`cursor-agent` NOT installed; ~/.cursor/mcp.json exists, only top-level key `mcpServers` (contents not read). No hands-on test possible.
- Deeplink template `cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG`, config = base64(JSON.stringify(config)): CONFIRMED - https://cursor.com/docs/mcp/install-links
- Config is the INNER server object (no name wrapper): CONFIRMED-with-caveat - docs prose example shows the wrapped `{"postgres":{...}}` but the sample link base64 `eyJjb21tYW5kIjoibnB4Ii...` decodes to `{"command":"npx"...` (inner); secondary tutorials agree (danywalls.com, pypi cursor-deeplink). Use inner.
- `headers` / `url` inside deeplink config: UNCONFIRMED (docs only show a command example; says config is "same format as mcp.json"). Must test before shipping.
- https install link: UNCONFIRMED / not documented (only cursor:// shown).
- User config `~/.cursor/mcp.json`, project `.cursor/mcp.json`: CONFIRMED - https://cursor.com/docs/mcp ("tools in every project you open in the editor or CLI" - CLI shares it). Windows/Linux paths by convention: UNCONFIRMED.
- Remote entries use `url` + `headers`: CONFIRMED (docs). `type` table lists type as required for stdio only: CONFIRMED.
- Interpolation `${env:NAME}`, `${userHome}`, `${workspaceFolder}`, `${workspaceFolderBasename}`, `${pathSeparator}`/`${/}` in command,args,env,url,headers: CONFIRMED. Forum bug about literal `${env:}` in headers: not re-fetched (researcher's source); advice to write literal key stands.
- OAuth supported, optional `auth` {CLIENT_ID, CLIENT_SECRET, scopes}: CONFIRMED. Headers-ignored-with-OAuth-discovery bug: UNCONFIRMED by me (forum, researcher only) - keep .well-known absent.
- Live reload: UNCONFIRMED (docs silent). Treat as needing toggle/restart.
- Tool-count cap (~40): UNCONFIRMED (docs give no numeric limit).
- Settings UI path: CORRECTED ("Tools & MCP" -> "Customize" sidebar) - https://cursor.com/docs/mcp
- CLI binary `agent`; commands `agent mcp list | list-tools <id> | login <id> | enable <id> | disable <id>`; flag `--approve-mcps`; no `mcp add`; precedence project -> global -> nested, parent dirs searched: CONFIRMED - https://cursor.com/docs/cli/mcp. `agent --version` unrun (not installed).
- Remote servers with headers from CLI: UNCONFIRMED currently (2025 forum report of failure).
- Marketplace publish page https://cursor.com/marketplace/publish: exists; requirements text not retrievable by me (page fetch returned only title). Open-source/manual-review claims UNCONFIRMED by me; localhost eligibility UNCONFIRMED.
- Bundle id, Windows/Linux detection paths, skills dirs, plugin formats: not re-verified (UNCONFIRMED).
- Missed: nothing newer found; no official extension API/OAuth-less one-click better than deeplink/file write.

## Recommendation for Anytype
Primary (zero-touch): user clicks "Connect to Cursor", picks spaces + read/read-write (+expiry); Anytype mints a dedicated key named "Cursor" via RPC, merges `mcpServers.anytype = {url:"http://127.0.0.1:<configured port>/mcp/large", headers:{Authorization:"Bearer <key>"}}` into ~/.cursor/mcp.json (parse, atomic write, backup, preserve other servers; literal key, no ${env:}). Optionally run `agent mcp enable anytype` if `agent` exists. Then show: "Open Cursor, go to Customize/Settings > MCP, switch anytype on (restart if not listed)". Anytype may offer a "Verify" step via `agent mcp list-tools anytype` when CLI present.
Fallback 1: "Add to Cursor" button opening the cursor:// deeplink with inner config (url+headers) - confirm headers survive in QA; user clicks Install in Cursor's dialog. Fallback 2: copyable JSON snippet plus OS path (~/.cursor/mcp.json; %USERPROFILE%\.cursor\mcp.json).
Notes: use user scope, not project scope (header-drop reports); keep `large` tier; Cloud Agents cannot reach localhost; do not add OAuth discovery to the endpoint; token is plaintext on disk (and in the URL for deeplink) so prefer file write, default read-only, offer expiry/revoke. Cursor is not a browser so the origin check should not trigger (test).
