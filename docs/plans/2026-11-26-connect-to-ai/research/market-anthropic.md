# Anthropic distribution for Anytype (VERIFIED, 2026-11-26)

Scope: Claude Connectors Directory, Desktop Extensions (MCPB), Claude Code plugin marketplaces, Skills.
Re-verified against live Anthropic docs, MCPB repo, local `claude` 2.1.332 CLI and local Claude.app 6.28899.6. Raw researcher report was largely accurate; corrections are marked CORRECTED in the log.

## 0. Headline findings

1. One catalog: https://claude.ai/directory (submit at https://claude.ai/directory/manage). Two submission kinds only: **MCP connector** (remote) and **Plugin bundle** (GitHub repo). Skills are not standalone; they ride in a plugin. There is no separate "Claude Marketplace" submission.
2. **MCPB directory listings are deprecated.** Verbatim (claude.com/docs/directory/publish and /connectors/building/mcpb): "the directory no longer accepts local MCP servers packaged as desktop extensions (MCPB). To distribute a local MCP server through the directory, include it in a plugin bundle." Users still install a .mcpb themselves. The support article 10949351 still mentions a "desktop extension submission form" and "Browse extensions"; stale for new intake.
3. A **local-only** server (127.0.0.1) cannot be a directory connector (cloud-originated, https/443 only). Only route: plugin bundle with a local stdio `command`. That loads in Claude Code and in Cowork on this computer, and is **Ignored in Chat** (claude.ai web, Desktop chat tab, mobile).
4. Zero-touch routes Anytype can drive itself: (a) generate a .mcpb and `shell.openPath` it (Claude Desktop chat; macOS handler registration now CONFIRMED, see log), (b) `claude mcp add --transport http ...` (Claude Code), (c) `claude plugin install ... --marketplace ... --config ...` against a self-hosted marketplace.
5. Directory listing: no fee; paid plan (Pro/Max/Ultra/Team/Enterprise) required; no review SLA.

## 1. Directories / marketplaces

| Name | URL | Lists | Who can add | Notes |
|---|---|---|---|---|
| Anthropic Directory | https://claude.ai/directory ; portal https://claude.ai/directory/manage | Remote connectors (Community/Verified), plugin bundles | Paid plans only; Free cannot submit | Shared by claude.ai, Desktop, mobile, Cowork; plugin added on claude.ai also reaches Claude Code as a synced plugin |
| Claude Marketplace (web) | https://claude.com/marketplace | Browse UI of the same catalog | n/a | "no separate Claude Marketplace submission" |
| `claude-plugins-official` | https://github.com/anthropics/claude-plugins-official | Anthropic + partner plugins (researcher counted 317; not re-counted) | Partners only | auto-added in Claude Code |
| `claude-community` | https://github.com/anthropics/claude-plugins-community | read-only mirror (researcher counted 2,280; not re-counted) | via directory portal | No "anytype" string found in community marketplace.json (re-checked) |
| Desktop in-app "Browse extensions" | Settings > Desktop app > Manage > Extensions | Anthropic-reviewed .mcpb | closed to new MCPB | grandfathered |
| Self-hosted plugin marketplace | any git repo with `.claude-plugin/marketplace.json` | anything | anyone, no review | Claude Code: any git repo/URL/path. claude.ai/Desktop Customize > Plugins: GitHub/GHE and public GitLab/Bitbucket only, max 25 marketplaces |

Plugin install surfaces: claude.ai **Customize > Plugins** (Discover, Add marketplace, Add > Upload plugin zip, up to 200 MB); Claude Code `/plugin`, `/plugin directory` (v2.1.287+), `claude plugin install`.

## 2. Submission, requirements

### 2.1 MCP connector (remote only)
- `https://` URL, port 443, reachable from Anthropic egress; OAuth 2.0 (DCR/CIMD) or no auth; static request headers = **beta, limited organizations** (max 4 headers; header names must be Anthropic-approved; cannot set `Authorization` when OAuth is used). Native Anytype `/mcp` has no OAuth/.well-known, no https: ineligible.
- Tools need titles + readOnlyHint/destructiveHint; privacy policy, docs, support contact. Review: automated scan, Community by default; may escalate to Verified; no SLA; no fee.
- Add-by-URL custom connector (user side): Settings > Connectors > Add custom connector; URL must be HTTPS; no way to pre-fill via deeplink (none documented).

### 2.2 Plugin bundle (https://claude.com/docs/plugins/pre-submission-checklist)
- Needs `.claude-plugin/plugin.json`, README >= 40 words, LICENSE or `license` field. Name must not be reserved (`claude`, `anthropic`, `official`, `plugin`, `mcp`, `test` as whole name); look-alike/brand names are held.
- Remote MCP entry: `type` http|sse|ws, `url` absolute https/wss, or `${user_config.KEY}`, or `""`. `http://127.0.0.1:31009/...` = **Blocks** ("MCP server URL is not https").
- Local server: `command`+`args` running a file in the plugin (`node ${CLAUDE_PLUGIN_ROOT}/server.js`), not via shell/npm run, else held.
- `npx`/`uvx` must be pinned to exact version (unpinned/@latest = Blocks); even pinned = always held for reviewer ("Runs a pinned npx or uvx package"). A `package.json` + lockfile in plugin root = held.
- A `.mcpb`/`.dxt` declared inside the plugin = held; fetched from URL = Blocks.
- Credentials: use `userConfig` with `sensitive: true`, `${user_config.KEY}`; credential in MCP headers = Blocks.
- Non-text/non-image binary (compiled executable, .zip) = held; non-image/font files >256 KiB held; >512 files held. No top-level `bin/` (Chat and Cowork refuse the whole plugin).
- Repo may be private while validating, public before live. New listing reviewed by a human; each version scanned.

### 2.3 Desktop extension (.mcpb)
- Listing deprecated (above). Install gestures per docs: double-click; drag into Claude Desktop window; Settings > Extensions > Advanced settings > Install Extension... (add-unlisted page says drag onto Settings > Extensions). All open an install UI (details, permissions, user_config).
- Signing: MCPB CLI has `mcpb sign/verify/unsign` (optional); no documented requirement to sign; unsigned prompt behaviour unconfirmed.
- Manifest: `manifest_version` "0.3" (0.4 adds `type: "uv"`); `user_config` with `sensitive: true` (masked, secure storage); `${user_config.KEY}`, `${HOME}`, `${__dirname}` substitution in `server.mcp_config.env/args`; `compatibility.platforms` values darwin/win32/linux.
- Platform: Anthropic docs say Claude Desktop runs on macOS and Windows; the MCPB spec allows linux, and the support article mentions Linux keychain; no official Claude Desktop Linux build documented in these pages. Treat Linux as unsupported/unconfirmed.

## 3. Can a local-only server be listed?

| Route | Listable? | Runs where | Verdict |
|---|---|---|---|
| Remote connector -> 127.0.0.1 | NO | cloud | Impossible. MCP tunnels = Enterprise research preview only |
| .mcpb | NO (deprecated) but user-installable | Claude Desktop (macOS/Windows), stdio, bundled Node | Best direct install |
| Plugin bundle + local stdio | YES (held for human review for npx/script) | Claude Code; Cowork-on-this-computer; Chat: Ignored | Listable, not for Chat |
| Plugin + remote http with `${user_config.KEY}` url | Validator allows | Code prompts; Chat ignored; Cowork ignored (no default => ignored, no prompt) | Only Claude Code; reviewer acceptance of loopback unconfirmed |

## 4. Connect mechanics

### 4.1 Plugin route (Claude Code)
`/plugin install` opens userConfig dialog (sensitive -> OS secure storage). CLI (verified via `--help` on 2.1.332):
```
claude plugin marketplace add <owner/repo|url|path> [--scope user|project|local] [--sparse ...] [--json]
claude plugin install <plugin[@marketplace]> [--marketplace <source>] [--config key=value ...] [--json] [--accept-command <sha256>]
```
`--config` sets plugin userConfig or `<server>.<key>=<value>` for a bundled .mcpb server. `--marketplace <source>` installs from a marketplace not yet added. Minimum Claude Code versions (2.1.285 / 2.1.292) are UNCONFIRMED (not in --help); the flags exist in 2.1.332, so require >= that or feature-detect via `claude plugin install --help`.

### 4.2 .mcpb route (Claude Desktop chat)
- Claude.app Info.plist (6.28899.6) declares CFBundleDocumentTypes extensions `dxt` and `mcpb` (Desktop Extension), so macOS Launch Services routes `open file.mcpb` / `shell.openPath` to Claude. Windows registration unconfirmed.
- Install dialog still requires the user to click Install. Embedding the minted key in the generated zip's `env` (or a `user_config` default) avoids typing; the key sits in a file in temp, so delete after install and note that Claude stores extension settings itself.
- Node is bundled with Claude Desktop (macOS/Windows), so a `type: "node"` proxy bundle needs no user Node.

### 4.3 claude_desktop_config.json (fallback)
- macOS `~/Library/Application Support/Claude/claude_desktop_config.json` exists on this machine (contents not read). Windows `%APPDATA%\Claude\claude_desktop_config.json`: widely cited, not confirmed in Anthropic docs read.
- File reliably accepts stdio entries. Remote `url`/`headers` entries are NOT officially supported (remote servers go through Customize > Connectors); some third-party guides claim `streamable-http` works, unverified. `mcp-remote` via npx is the community bridge (needs Node). Restart of Claude Desktop needed.
- Claude Code CLI can import Desktop servers: `claude mcp add-from-claude-desktop` (Mac and WSL only). Not needed by Anytype.

### 4.4 Claude Code CLI (verified `claude mcp add --help`, 2.1.332)
```
claude mcp add --transport http anytype http://127.0.0.1:31009/mcp/large --header "Authorization: Bearer <KEY>" --scope user
claude mcp add-json anytype '{"type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}' --scope user
```
Flags: `-t/--transport stdio|sse|http`, `-H/--header`, `-s/--scope local|user|project` (default local), `-e/--env`. Scopes store in `~/.claude.json` (local, user) or `.mcp.json` (project). JSON entries need an explicit `type` (a `url` without `type` is treated as stdio = error); `streamable-http` is an alias for `http`. Docs do not explicitly state loopback http is accepted for MCP servers (OAuth-token-endpoint note only), but plain `http` URLs are the documented syntax class; end-to-end test against a live Anytype MCP still recommended. Use `--scope user` so it works in every project. Re-adding an existing name errors: run `claude mcp remove anytype -s user` first. Running sessions need restart/`/mcp` reconnect (unconfirmed live reload).
Passing the key on a command line exposes it in process listings; prefer `add-json ... -` reading JSON from stdin (the help says `-` reads stdin).

### 4.5 Deep links
- `claude-cli://open?q=<enc>&cwd=<abs>|repo=owner/name` (Claude Code terminal): prefills prompt only (q max 5,000 chars); nothing runs until Enter; handler registered only after the user sent a prompt in an interactive `claude` session (macOS `~/Applications/Claude Code URL Handler.app`, Linux `.desktop` under `~/.local/share/applications`, Windows `HKCU\Software\Classes\claude-cli`). Cannot install an MCP server.
- `claude://` (Claude Desktop): scheme registered. Documented routes: `claude://code/new?ssh_host=...&ssh_port=&ssh_folder=&q=` (Desktop >= 2.110.0). Researcher also found `claude.ai/new`, `claude.ai/artifact/`, `code/continue`, `code/needs-input`, `cowork/shared-artifact` in app strings (not re-verified). **No route to add a connector, install a .mcpb or a plugin** found in docs. CONFIRMED absent.
- `vscode://anthropic.claude-code/open` opens a VS Code tab (not an installer).

## 5. Precedents
Figma, Notion, Slack, Linear, Stripe: remote connectors + plugins (cloud/OAuth). Desktop Commander, Serena, iMessage, Xcode, Unity: local-ish plugins in the official marketplace (local servers can pass review, researcher-sourced, not re-verified). Obsidian: not in directory. Anytype: not listed in either marketplace. Npm `@anyproto/anytype-mcp` exists.

## 6. Missed / new points
- `claude mcp add-json` with stdin (`-`) keeps the key off the argv.
- `claude plugin install --json` + `--accept-command <sha256>` give machine-readable results (good for the Electron app to parse success/failure).
- `claude plugin marketplace add --claudeai` adds the claude.ai-hosted marketplace.
- Plugins installed on claude.ai sync into Claude Code at next session start (as `<name>@synced`).
- Anthropic offers MCP Apps and Cowork "connectors" but none offers a local-server one-click deeplink.

## Verification log
| Claim | Status | Source |
|---|---|---|
| MCPB directory submissions deprecated | CONFIRMED | https://claude.com/docs/directory/publish ; https://claude.com/docs/connectors/building/mcpb |
| Support article still mentions desktop-extension submission form/Browse extensions | CONFIRMED (stale) | https://support.claude.com/en/articles/10949351 |
| Local server cannot be connector; connector needs https/443 | CONFIRMED | https://claude.com/docs/connectors/custom/add-unlisted ("HTTPS address") |
| Plugin remote url must be https; http://127.0.0.1 Blocks | CONFIRMED | https://claude.com/docs/plugins/pre-submission-checklist |
| Pinned npx always held; unpinned Blocks | CONFIRMED | same |
| Chat ignores local MCP; Cowork loads on-computer; Code loads | CONFIRMED | https://claude.com/docs/plugins/platform-support |
| userConfig URL: Chat ignored, Cowork ignored w/o default, Code prompts | CONFIRMED | same |
| Request headers (static auth) beta for limited orgs | CONFIRMED (+ max 4, header-name approval) | https://claude.com/docs/connectors/custom/add-unlisted |
| Directory: paid plan, no partner program, no review SLA | CONFIRMED | https://claude.com/docs/directory/publish |
| Skills not standalone | CONFIRMED | same |
| `claude mcp add --transport http ... --header ... --scope user` | CONFIRMED | local `claude mcp add --help` 2.1.332; https://code.claude.com/docs/en/mcp |
| `claude plugin install <p> --marketplace <src> --config k=v` | CONFIRMED | local `claude plugin install --help` |
| "--marketplace needs v2.1.292+", "bundled .mcpb v2.1.285+" | UNCONFIRMED (flags present in 2.1.332) | local help |
| `claude plugin configure --values-stdin` | UNCONFIRMED here (not re-run) | researcher |
| `claude-cli://open` prefills only, handler registered after interactive use | CONFIRMED | https://code.claude.com/docs/en/deep-links |
| claude-cli q limit 5,000 chars; params q, cwd, repo | CONFIRMED (new detail) | same |
| No `claude://` connector/mcpb/plugin install route | CONFIRMED (docs + Info.plist); app.asar strings not re-read | https://code.claude.com/docs/en/desktop |
| Claude.app handler for .mcpb on macOS: "unconfirmed" -> CORRECTED to CONFIRMED (CFBundleDocumentTypes dxt, mcpb in /Applications/Claude.app 6.28899.6) | CORRECTED | local Info.plist |
| MCPB: Claude Desktop macOS+Windows only | CONFIRMED for docs; spec allows `linux` platform value | https://claude.com/docs/connectors/building/mcpb ; https://github.com/modelcontextprotocol/mcpb/blob/main/MANIFEST.md |
| MCPB manifest_version 0.3/0.4, user_config sensitive | CONFIRMED | MANIFEST.md |
| Signing documented as required | CORRECTED: not required in docs; `mcpb sign` exists | https://github.com/modelcontextprotocol/mcpb/blob/main/CLI.md |
| MCPB latest release v2.1.2 (2025-12-04) | CONFIRMED | gh api releases |
| claude_desktop_config.json mac path exists | CONFIRMED (exists) | local ls |
| Config accepts remote url+headers | UNCONFIRMED/likely NOT supported officially | WebSearch summary of support article; third-party conflicting |
| Windows config path %APPDATA%\Claude\... | UNCONFIRMED (not in Anthropic pages read) | |
| Anytype not in community marketplace | CONFIRMED (0 matches) | gh api claude-plugins-community marketplace.json |
| 317 / 2,280 plugin counts | UNCONFIRMED (not re-counted) | |
| Browsers/directories "Claude.ai chat can use user_config plugin" | n/a | |

## Recommendation for Anytype

**Primary zero-touch route, by client**
1. **Claude Code (CLI / Desktop Code tab / VS Code):** user clicks "Connect Claude Code" in Anytype, picks spaces + read/read-write. Anytype mints the key via RPC, detects `claude` on PATH (`which`/`where`), runs `claude mcp remove anytype -s user` (ignore error) then `claude mcp add-json anytype - -s user` with `{"type":"http","url":"http://127.0.0.1:<port>/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}` on stdin (or the `--header` form). User sees "Connected. Start a new Claude Code session." No Node, no restart of the app, no proxy.
2. **Claude Desktop chat:** Anytype generates a per-user `Anytype.mcpb` (node stdio proxy -> `/mcp/large`, bundled deps, key and port in `server.mcp_config.env`), writes to temp, `shell.openPath`. Claude Desktop shows the install dialog; the user clicks **Install**. Two clicks total; no JSON editing; no Node install; delete the temp file afterward. Windows/macOS only.

**Fallbacks**
- Claude Desktop: merge a stdio `mcpServers.anytype` entry (npx @anyproto/anytype-mcp@2.0.3 with `OPENAPI_MCP_HEADERS`) into claude_desktop_config.json (back up first, never log contents), then ask the user to quit and reopen Claude Desktop. Needs Node.
- Claude Code without `claude` on PATH: show a copyable command with OS-specific shell quoting.
- Optional later: public plugin repo `anyproto/anytype-claude-plugins` (skills + `.mcp.json`) and `claude plugin install anytype --marketplace anyproto/anytype-claude-plugins --config api_key=<KEY>`; submit the plugin to the directory for discoverability/skills only (expect a human hold for pinned npx). Do NOT lead with a directory listing and do NOT pursue a Connectors-Directory listing or MCP tunnels unless Anytype ships a hosted https + OAuth endpoint.

**OS notes**
- macOS: `claude` may not be on PATH for a GUI-launched Electron app; resolve via login shell (`zsh -lc 'command -v claude'`) or check `~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin`. `.mcpb` handler confirmed in Claude.app.
- Windows: use `where claude` (npm/exe install); `.mcpb` association unconfirmed (fall back to telling the user to drag the file into Settings > Extensions and reveal it in Explorer). Config path `%APPDATA%\Claude`.
- Linux: no official Claude Desktop; support Claude Code only.

**Gotchas**
- The directory cannot list a loopback http server; plugin MCP URL must be https or `${user_config}`; a stdio-in-plugin listing is ignored in Chat.
- Port is user-configurable (31009 default, 31012 for anytype-cli): write the actual port into the URL.
- Key hygiene: avoid argv for secrets where possible; delete generated .mcpb after install; give keys a name like "Claude Code" and optional expiry so users can revoke in Anytype.
- `claude mcp add` of an existing name fails; remove first. Existing sessions need restart to pick up the server.
- Claude Code treats a JSON `url` entry without `type` as stdio: always set `"type":"http"`.
- Claude Desktop's .mcpb install requires a user click and may be blocked by Team/Enterprise policy (`isDesktopExtensionEnabled`), where Settings > Extensions is hidden.
- Open validations needed with real clients: Windows .mcpb double-click, Claude Desktop unsigned-extension prompt, whether `claude mcp add` accepts a loopback http URL with no warnings (expected yes), Claude Code live reload of new servers.
