# VS Code + GitHub Copilot (VS Code, Insiders, Visual Studio 2026, Copilot CLI): connecting Anytype

Research date: 2026-11-26. Method: live docs pulled from the `microsoft/vscode-docs`, `github/docs`, `MicrosoftDocs/visualstudio-docs` and `github/copilot-cli` repos via `gh api` (these are the sources of the published docs), plus `vscode.d.ts` at tag 1.148.0, the Copilot CLI `changelog.md`, and the live MCP registry API. Nothing was installed or modified. None of the clients is installed on this machine: `code`, `code-insiders` and `copilot` are not on PATH, and there is no `~/.copilot`. Local VS Code user data exists (`~/Library/Application Support/Code/User`) but has no `mcp.json`. No config contents were read.

Anything marked **unconfirmed** was not verified from a live source.

---

## 0. The big finding (changed since 2025): there are now TWO MCP config worlds in VS Code

The Nov 2026 VS Code docs (DateApproved 11/25/2026, VS Code 1.148.0 is current) split VS Code agent sessions into **harnesses**:

| Harness | Status | MCP config it reads | Format |
|---|---|---|---|
| **Copilot harness** (shared Copilot SDK runtime; same one used by Copilot CLI and the GitHub Copilot app) | Current and preferred. Sessions auto-route here by default (`chat.defaultToCopilotHarness`). | **`~/.copilot/mcp-config.json`** (or `$COPILOT_HOME/mcp-config.json`) for user scope; **`.mcp.json`** at the workspace root | `{"mcpServers": {...}}` |
| **Local harness** (the old in-editor agent) | **Deprecated, removal "by February 2027"** (docs: agent-harnesses.md). Hidden unless `chat.editor.localAgent.enabled` is true and `chat.defaultToCopilotHarness` is false. | Profile `mcp.json` (user) and `.vscode/mcp.json` (workspace) | `{"servers": {...}, "inputs": [...]}` |

Consequences for Anytype:
- **`~/.copilot/mcp-config.json` is read by VS Code (Copilot harness) AND by Copilot CLI** (and the GitHub Copilot app). One write covers both. The docs say "Copilot Global ... is shared across your workspaces and compatible Copilot experiences on the same host, including Copilot CLI".
- The VS Code docs (mcp-configuration.md) explicitly say: "For new Copilot configurations, use these native destinations, not `.vscode/mcp.json` or profile `mcp.json`."
- `vscode:mcp/install` is documented (api/extension-guides/ai/mcp.md); `code --add-mcp` existence is NOT re-confirmed in the 2026 docs fetched here (see Verification log). Both, if present,  target the **editor-managed (Local/profile) configuration**, not the native Copilot file. Profile and `.vscode/mcp.json` definitions can be *forwarded* to the Copilot harness, but only if they contain no `${input:...}` or `${command:...}` variables. With `inputs`, they are rejected.
- **There is no way to pass a prompted secret (`inputs` with `password: true`) to an HTTP server in the Copilot harness.** The docs have an FAQ for exactly this (migrate-customizations.md, "Can Copilot pass a prompted secret..."): there is no built-in option, and `password: true` does not change that. The only supported static-bearer paths are `${ENV_VAR}` references or a literal in the file. The `password: true` input prompt (VS Code secret storage) therefore only works in the deprecated Local harness. Tracked in microsoft/vscode#334271, #337311 and #339960 (open per docs).

Current versions seen:
- VS Code stable **1.148.0** (2026-11-25); 1.147.0 on 2026-11-18. Weekly cadence.
- Copilot CLI latest stable **v1.0.116** (2026-11-25); pre-release 1.0.117-3 on 2026-11-26.
- Visual Studio 2026 (MCP trust dialog needs 18.7+). The VS MCP doc is dated 05/26/2026. The exact current VS 2026 build is unconfirmed.

---

## 1. Surfaces & platforms

| Surface | Platforms | Notes |
|---|---|---|
| VS Code (stable) | macOS, Windows, Linux (deb/rpm/snap/tar; Flatpak is community) | Desktop. Also vscode.dev / github.dev (web), Remote/Dev Containers/Codespaces. |
| VS Code Insiders | same | Separate install; scheme `vscode-insiders:`; separate user-data dir (`Code - Insiders`). |
| VS Code Agents window | same | New window in the same app. `vscode://agents/new?prompt=...&workspace=...` opens it. Uses Copilot harness. |
| Visual Studio 2026 (and 2022 17.14) | Windows only | Own MCP client and own config files. |
| GitHub Copilot CLI (`copilot`) | macOS, Linux, Windows | Install: `npm i -g @github/copilot`, `brew install --cask copilot-cli`, `winget install GitHub.Copilot`, `curl -fsSL https://gh.io/copilot-install \| bash`, or a GitHub release binary. |
| GitHub Copilot app | desktop | Reads the same Copilot runtime MCP config (per VS Code docs link). Details unconfirmed. |
| Copilot cloud agent (github.com) | cloud | Cannot reach 127.0.0.1. Out of scope. |

Plan requirement: a Copilot subscription (CLI docs). Orgs can disable the CLI and MCP (see section 8).

---

## 2. MCP support

### VS Code, Copilot harness (native config)
- Transports: `stdio`, `http` (Streamable HTTP), `sse` (legacy). Docs say "Prefer HTTP when the server supports it". In the CLI the form accepts `local`, `stdio`, `http`, `sse`; `streamable-http` is an alias for `http`.
- **Static headers: yes.** `headers` on http/sse entries. Docs warn "Don't store literal credentials in shared files", and "A personal configuration file is not a secret store." A literal works technically.
- **Env-var-sourced headers: yes.** `${NAME}` and `${NAME:-default}` in `command`, `args`, `env` and **header values**. Bare `$NAME` is treated as literal by the VS Code MCP client. The CLI additionally accepts `$VAR` in `env`. Variables come from the environment of the host running the harness. A GUI-launched VS Code on macOS or Linux will NOT see variables from `~/.zshrc`. Unconfirmed in detail, but it is the known behaviour of GUI apps.
- No `inputs`, `envFile` or SecretStorage bridge in the native format. "Don't copy editor-only fields such as `inputs`, `envFile`, `dev`, or `sandboxEnabled` into a portable file."
- OAuth: yes (MCP authorization spec, DCR or pre-registered `oauthClientId`; flat fields `oauthClientId`, `oauthScopes`, `oauthPublicClient`, `oauthGrantType`). Redirects `http://127.0.0.1:33418` and `https://vscode.dev/redirect`. Anytype has no OAuth today, so the bearer header is the only route.
- 127.0.0.1: the docs use `http://localhost:3000` as an HTTP example (Local format table). Visual Studio's docs ship a Figma one-click link to `http://127.0.0.1:3845/mcp`. No HTTPS requirement found. The Copilot CLI sandbox "local-network allowlists now include localhost and loopback hosts" (CLI 1.0.9x changelog). Everything runs client-side, so the vendor cloud never executes the connector.
- Anytype's `Origin` check is not a problem: these are not browser clients.

### VS Code, Local harness (deprecated, until Feb 2027)
- `servers` format, `type: "http"|"sse"|"stdio"`. The client tries Streamable HTTP and falls back to SSE.
- `headers` with `${input:id}` and `inputs: [{type:"promptString", id, description, password:true}]`. The secret is prompted once and stored in VS Code secret storage. Also `${env:NAME}`, `envFile`, `oauth.clientId`, and `unix://` or `pipe://` socket URLs.

### Visual Studio 2026
- `servers` top-level key (Microsoft docs example): `{"servers": {"github": {"url": "https://api.githubcopilot.com/mcp/"}}}`.
- Supports remote (url) and local (command) servers and any-OAuth. The docs say the format "must include ... `name`, `command` or `url`, and `transport`", which is loosely worded.
- Static `headers` and `inputs` are supported in the `.mcp.json` format by a third-party vendor page (support.sqai-suite.com: `"headers": {"Authorization": "Bearer ${input:...}"}`). **Not shown in Microsoft's VS doc. Unconfirmed from first-party sources.** The VS one-click link supports `inputs` (the DuckDB example has `promptString` with `password:false`).
- "integration with the Visual Studio keychain" is mentioned for auth (details unconfirmed).

### Copilot CLI
- stdio (`local`/`stdio`), `http`, `sse`. `headers` support variable expansion. Header example from the CLI docs: `copilot mcp add --transport http --header "Authorization: Bearer YOUR-TOKEN" stripe https://mcp.stripe.com`.
- OAuth: yes (`/mcp auth`, `oauthClientId`, `oauthGrantType: client_credentials`).
- Folder trust gates workspace-level servers. Remote servers are listed as "Low" trust ("Always" review).
- Server names and tool names are sanitised: `[A-Za-z0-9_-]` only, combined name capped at 64 characters.

---

## 3. Every way to add the server (ranked by effort for the Anytype app)

Worked example everywhere: server name `anytype`, `http://127.0.0.1:31009/mcp/large`, header `Authorization: Bearer <KEY>`.

### 3.1 Write `~/.copilot/mcp-config.json` (best: one file for VS Code Copilot harness + CLI + Copilot app)

Path: `$COPILOT_HOME/mcp-config.json`, else `~/.copilot/mcp-config.json`.
- macOS and Linux: `~/.copilot/mcp-config.json`.
- Windows: `%USERPROFILE%\.copilot\mcp-config.json`. The docs only say `~/.copilot`. The Windows expansion is **unconfirmed**, but the CLI docs use `$HOME/.copilot` as the default.
- `COPILOT_HOME` overrides. VS Code does not check both locations.

```json
{
  "mcpServers": {
    "anytype": {
      "type": "http",
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <KEY>" },
      "tools": ["*"]
    }
  }
}
```

Env-var variant (no secret in the file, but the user must export the variable into whatever process launches VS Code or the CLI):

```json
"headers": { "Authorization": "Bearer ${ANYTYPE_API_KEY}" }
```

Fields: the VS Code and CLI docs examples always include `type`, `url` and `tools`; whether `tools` is strictly required is unconfirmed (docs only say `["*"]` makes all tools available). Always include `tools: ["*"]`. Note: the CLI docs example uses `type: "local"` for stdio and `type: "http"` for remote; both `http` and `stdio` are accepted by the VS Code doc.

### 3.2 CLI, no file editing (CLI + VS Code Copilot harness, because the same file is written)

```bash
copilot mcp add --transport http \
  --header "Authorization: Bearer <KEY>" \
  anytype http://127.0.0.1:31009/mcp/large
```
- Writes `~/.copilot/mcp-config.json`. Other flags: `--tools "*"`, `--timeout MS`, `--env`, `--json`, `--show-secrets`.
- Removal: `copilot mcp remove anytype`. Inspect: `copilot mcp list --json`, `copilot mcp get anytype --json`.
- Downsides: the token appears in the process argv (visible to `ps` for milliseconds), and it requires the `copilot` CLI to be installed. Writing the JSON directly (3.1) avoids both.
- Session-only alternative: `copilot --additional-mcp-config '{"mcpServers":{"anytype":{...}}}'` (or `@file`) is the highest priority and is not persisted.

### 3.3 Interactive in-app forms (fallback, manual)
- VS Code: Command Palette > **Chat: Open Customizations** > **MCP Servers** > **Add Server** > **HTTP** > URL > server ID > **Global > Copilot Global**. The form has an HTTP headers field. Docs: "Both native destinations have a configuration form" (user file: stdio, HTTP, SSE; workspace `.mcp.json`: stdio and HTTP). The workspace form rejects `${...}`.
- **MCP: Add Server** also works (guided flow).
- CLI: `/mcp add` (Ctrl+S saves, "available immediately without restarting"), with HTTP Headers entered as JSON, e.g. `{"Authorization":"Bearer KEY"}`.

### 3.4 One-click deeplinks (editor-managed / Local config, NOT the native Copilot file)

`vscode:mcp/install?<urlencoded JSON>` (Insiders: `vscode-insiders:mcp/install?...`). Documented in `api/extension-guides/ai/mcp.md` ("Create an MCP installation or lookup URL"):

```ts
const obj = { name: "anytype", type: "http", url: "http://127.0.0.1:31009/mcp/large",
              headers: { Authorization: "Bearer <KEY>" } };
const link = `vscode:mcp/install?${encodeURIComponent(JSON.stringify(obj))}`;
```
- It opens an **MCP server details editor so the user can review the configuration and click Install**. That is 1 extra click. It does not install silently.
- Web wrapper (documented): `https://vscode.dev/redirect?url=<urlencoded vscode: URL>`. The older badge form `https://insiders.vscode.dev/redirect/mcp/install?name=..&config=..` (Insiders, `&quality=insiders` for stable variants) appears in community READMEs. **Not documented in the current docs, so treat as legacy and unconfirmed**; I could not find an official spec for it.
- Gallery lookups, not install: `vscode:mcp/by-name/<registry-name>` (e.g. `vscode:mcp/by-name/io.github.github/github-mcp-server`) and `vscode:mcp/<https-url-without-scheme>`.
- **Caveat:** the install lands in the profile `mcp.json` (editor-managed `servers` format). The docs' wording is only "Eligible definitions can be forwarded", and a literal-header http entry with no inputs should be eligible, but I did **not** confirm end to end that a deeplink-installed server shows up in a Copilot-harness session. **Unconfirmed**; test on 1.148.
- The deeplink needs the token in the URL, which is logged by the OS URL handler and the browser. Do not put the real key in a vscode.dev web link. A locally fired `open vscode:...` from Electron is the lesser evil.
- The deeplink also accepts `inputs` with `promptString`/`password:true` (so no token in the URL). That works only in the Local harness and is rejected by forwarding. Not recommended past Feb 2027.

### 3.5 `code --add-mcp` (editor-managed, Local config)

```bash
code --add-mcp '{"name":"anytype","type":"http","url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <KEY>"}}'
# Insiders:
code-insiders --add-mcp '{...}'
```
- Documented: "adds a server to the VS Code user-profile configuration... uses the VS Code format, not the portable Copilot user file". Same forwarding caveat as 3.4.
- The `code` shell command is not necessarily on PATH on macOS (user must run "Shell Command: Install 'code' command in PATH"). On this machine `code` is not on PATH. On macOS the binary is at `/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code`. Unconfirmed on this machine, from memory.

### 3.6 Extension API (VS Code extension for Anytype)

```jsonc
// package.json
"contributes": { "mcpServerDefinitionProviders": [ { "id": "anytype.mcp", "label": "Anytype" } ] }
```
```ts
vscode.lm.registerMcpServerDefinitionProvider('anytype.mcp', {
  onDidChangeMcpServerDefinitions: emitter.event,
  provideMcpServerDefinitions: async () => [
    new vscode.McpHttpServerDefinition(
      'Anytype', vscode.Uri.parse('http://127.0.0.1:31009/mcp/large'),
      { Authorization: `Bearer ${key}` }, '1')
  ],
  // resolveMcpServerDefinition?: optional, editor-managed launch only
});
```
Exact signature from `vscode.d.ts` @ 1.148.0: `new McpHttpServerDefinition(label, uri, headers?, version?)`. Headers "are not sent to a different origin, including across redirects". Changing `version` makes the editor prompt to refresh tools. `provideMcpServerDefinitions` must be non-interactive.
- Docs: "Eligible extension-provided definitions can be forwarded to Copilot sessions. The extension isn't available in a standalone runtime" (so CLI is not covered). Whether a definition with literal headers is "eligible" is not spelled out. **Unconfirmed**.
- The extension can store the key in `SecretStorage`, but "an extension's SecretStorage value isn't automatically forwarded to a native server". The extension must put the key into the definition itself.
- It would need a Marketplace publication (or a VSIX) plus a way to receive the key (e.g. a `registerUriHandler` deeplink `vscode://anytype.<ext>/connect?...`). That is heavy and puts a token in a URL. Not recommended as primary.

### 3.7 Agent plugin (skill + MCP bundled; cross-client)

- VS Code and Copilot CLI both install "Agent Plugins 1.0" (`plugin.json` + `skills/` + `mcp.json`; Claude-format `.claude-plugin/plugin.json` also accepted).
- VS Code deeplink to install a plugin (documented in agent-plugins.md):
  `vscode://chat-plugin/install?source=<owner%2Frepo>&plugin=<name>`
  and `vscode://chat-plugin/add-marketplace?ref=<source>`. It prompts the user to confirm.
- CLI: `copilot plugin install anyproto/anytype-plugin` (spec forms `OWNER/REPO`, `OWNER/REPO:PATH`, URL, local path, `plugin@marketplace`), `copilot plugin marketplace add OWNER/REPO`.
- **A plugin cannot carry the minted key.** Its `mcp.json` can only reference `${ENV}` or ship a literal. Use a plugin for the *skill* part (SKILL.md, instructions on how to use Anytype tools) plus an MCP entry with an env reference, and use 3.1 for the actual credential.
- Note the CLI MCP precedence: plugin-provided servers outrank `~/.copilot/mcp-config.json` for the same name (last-wins). Avoid duplicate names.

### 3.8 Visual Studio

- Web one-click: `https://vs-open.link/mcp-install?<urlencoded JSON>` with the same JSON as VS Code (example from MS docs: `{"name":"figma","gallery":true,"url":"http://127.0.0.1:3845/mcp"}` and `{"name":"Azure DevOps","type":"http","url":"..."}`). It supports `inputs` with `promptString`. Whether `headers` is accepted in the link: **unconfirmed**.
- In-IDE: Copilot Chat tool picker `+` > Add MCP server (name plus URL, optional headers: the dialog fields are unconfirmed). Also Extensions > MCP Registries.
- Config files, first one wins in listed order, from the MS docs:
  1. `%USERPROFILE%\.mcp.json` (global)
  2. `<SOLUTIONDIR>\.vs\mcp.json`
  3. `<SOLUTIONDIR>\.mcp.json`
  4. `<SOLUTIONDIR>\.vscode\mcp.json`
  5. `<SOLUTIONDIR>\.cursor\mcp.json`
  Format uses `"servers"` (not `mcpServers`):

```json
{
  "servers": {
    "anytype": {
      "type": "http",
      "url": "http://127.0.0.1:31009/mcp/large",
      "headers": { "Authorization": "Bearer <KEY>" }
    }
  }
}
```
  Writing literal `headers` is expected to work (VS reads the shared `servers`/`headers` MCP schema and consumes `.vscode/mcp.json` files), but I found no first-party VS example, so **unconfirmed**. Test on a real VS 2026.
- "When you save the file with valid syntax, the GitHub Copilot agent restarts and reloads the configured servers." Editing a definition makes VS terminate and restart the server.

---

## 4. Can Anytype safely write or merge config? Reload behaviour

| Target | Merge safety | Live reload |
|---|---|---|
| `~/.copilot/mcp-config.json` | The CLI itself writes this file (`copilot mcp add`, `/mcp add`), which keeps unknown properties. CLI changelog shows it tolerates symlinks and reports invalid JSON by file name. Parse, set `mcpServers.anytype`, write atomically (temp file + rename), keep other keys. **Comments / trailing commas: the changelog hints the CLI parser tolerates them ("a syntax error in a file with comments or trailing commas points at the real mistake"; workspace `.mcp.json` "support comments and trailing commas").** So treat the file as JSONC: if the parse fails with a strict parser, fall back to a JSONC parser, or refuse and show the user a copy-paste snippet. Rewriting loses comments. | CLI: "MCP server configuration changes apply between turns without restarting the session" (changelog v1.0.93, 2026-10-07). `/mcp reload` exists. VS Code Copilot harness: reload behaviour on file edit is **unconfirmed**; per the docs, use **Restart Server** in Chat: Open Customizations > MCP Servers or start a new chat session. |
| Profile `mcp.json` (VS Code, Local) | VS Code rewrites it when the user installs servers; it is JSONC (comments allowed). | VS Code watches it and shows CodeLens Start/Stop. **Unconfirmed in the 2026 docs**, but long-standing behaviour. |
| `%USERPROFILE%\.mcp.json` (VS) | Hand-edited JSON. | Saved file reloads the agent (MS docs). |

Risks:
- **Scope:** user-level (`~/.copilot/mcp-config.json`) is right. Workspace `.mcp.json` / `.vscode/mcp.json` would leak the token into repos. Never write the key there. Trust: workspace servers need Workspace Trust. User-config servers have no extra prompt.
- **Remote / Dev Containers / WSL / SSH:** the native user file refers to the host where the harness runs ("isn't forwarded to another host"). From inside a container, `127.0.0.1:31009` is NOT the host's Anytype. Out of scope for the zero-touch route; mention it.
- **Multiple profiles:** native `~/.copilot` ignores VS Code profiles (good). The `COPILOT_HOME` env var changes the path: honour it if set in Anytype's environment, but a GUI app usually won't see it. Detect via the CLI (`copilot` not needed): check both.
- **Token at rest:** plaintext. Create the file with mode 0600 (macOS/Linux) and restrict ACLs on Windows if the file did not exist. Mint a dedicated, scoped, preferably read-only or expiring key labelled "VS Code / Copilot".
- **Secrets in logs:** `copilot mcp list` masks values and `--show-secrets` unmasks them. VS Code docs say "Do not commit tokens". Warn the user not to commit `.copilot`.
- Org policy can block the server (section 8).
- Enterprise `ChatStrictPluginOnlyCustomization` blocks standalone user MCP servers entirely.

---

## 5. Detection

All from official docs unless marked. Bundle ids and AUMIDs below are **from memory, unconfirmed against 1.148 stable `product.json`** (the repo's `product.json` is the OSS build: `com.visualstudio.code.oss`, `urlProtocol: code-oss`).

| App | macOS | Windows | Linux |
|---|---|---|---|
| VS Code stable | bundle id `com.microsoft.VSCode` (unconfirmed); `/Applications/Visual Studio Code.app`; scheme `vscode://` | `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe` (user install) or `C:\Program Files\Microsoft VS Code` (system); registry `HKCU\Software\Classes\vscode` URL protocol; `code.cmd` on PATH | `code` on PATH (`/usr/bin/code`, `/snap/bin/code`); `xdg-mime query default x-scheme-handler/vscode`; Flatpak `com.visualstudio.code` (community, unconfirmed) |
| VS Code Insiders | `com.microsoft.VSCodeInsiders` (unconfirmed); `Visual Studio Code - Insiders.app`; `vscode-insiders://` | `...\Microsoft VS Code Insiders`; `code-insiders.cmd` | `code-insiders` |
| User data dir (for profile `mcp.json`) | `~/Library/Application Support/Code/User/` (confirmed to exist on this machine) | `%APPDATA%\Code\User\` | `~/.config/Code/User/` |
| Copilot CLI | `copilot` on PATH (Homebrew: `/opt/homebrew/bin/copilot`; install script: `~/.local/bin/copilot`); `~/.copilot/` dir exists after first run | `copilot.exe` (winget) / npm shim; `%USERPROFILE%\.copilot` | `copilot` on PATH; `~/.copilot` |
| Visual Studio 2026 | n/a | `vswhere.exe -latest -products * -property installationPath` (unconfirmed), `devenv.exe`; `%USERPROFILE%\.mcp.json` | n/a |

Practical detection rule for Anytype: "VS Code installed" = app bundle or exe found OR `vscode:` scheme handler registered. "Copilot CLI installed" = `copilot --version` succeeds from a login-shell PATH (Electron GUI apps have a minimal PATH on macOS; use the user's shell PATH or probe the known directories). Note: the CLI existence is not required to write `~/.copilot/mcp-config.json`, but VS Code Copilot harness needs the user to be signed in to Copilot (cannot be detected from outside). Anytype cannot tell whether Copilot is enabled or whether the account is org-managed with MCP disabled.

Version checks: `code --version`, `copilot --version` (or `copilot version`, which "checks for updates"). Native Copilot-harness config requires a VS Code with the Copilot harness (the docs mention `1.142` for the Local-default policy and `1.145` for allowlist precedence; the exact first version with native `mcp-config.json` read is **unconfirmed**; assume >= 1.142 and say "update VS Code" otherwise).

---

## 6. Skills / plugins

- **Agent Skills (SKILL.md): yes.** Locations (docs, agent-skills.md): Copilot harness project `.github/skills/`, personal `~/.copilot/skills/`; Claude `.claude/skills`, `~/.claude/skills`; Codex `.agents/skills`, `~/.agents/skills`. Local harness reads `.github`, `.claude` and `.agents` project skills and `~/.copilot`, `~/.claude`, `~/.agents` personal skills.
- Install by dropping `~/.copilot/skills/anytype/SKILL.md`. CLI: `copilot skill add <file|url|dir>` (user scope default; `--project` for `.github/skills`), `/skills reload` or `copilot skill list`.
- **Plugins:** Agent Plugins 1.0 standard (`plugin.json` with `$schema: https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, `skills/`, `mcp.json`). A plugin bundles skills + MCP servers + agents + hooks. Install: VS Code Agent Customizations editor > Browse, or deeplink `vscode://chat-plugin/install?source=...&plugin=...`, **Chat: Install Plugin from Source** (Git URL or folder), `/plugin install <source>`; CLI `copilot plugin install OWNER/REPO`. The CLI ships the `awesome-copilot` marketplace by default. Anytype could publish its own marketplace repo (`copilot plugin marketplace add anyproto/<repo>`).
- Credentials cannot be injected into a plugin by Anytype (see 3.7), so the recommended split is: Anytype writes the server entry with the key (3.1) and also drops the skill file (or points to a plugin repo).

---

## 7. Marketplace / directory

- **VS Code:** (a) Extensions-view MCP gallery and "MCP: Browse MCP Servers" backed by the **GitHub MCP Registry** (`product.json`: `mcpRegistryDataUrl: https://api.github.com/copilot/mcp_registry`), which ingests the official MCP Registry. (b) The Customization Marketplace (Preview): Chat: Open Customizations > Browse > "GitHub Feed" (Experimental), searches `@type:mcp`. (c) Plugin marketplaces (`chat.plugins.marketplaces`, `awesome-copilot`).
- **Copilot CLI:** `/mcp search [query]` against the GitHub MCP Registry (or the org's private registry); the selected entry opens a pre-filled form where the user fills in required fields such as API keys.
- **Visual Studio:** Extensions > MCP Registries; "Add MCP server directly from the web" button badges.
- **Submission:** publish to the official MCP Registry (`registry.modelcontextprotocol.io`) with `mcp-publisher login github` then `mcp-publisher publish` of a `server.json`. Reported requirements (secondary sources, 2026): namespace auth `io.github.<user>/...` or a DNS-verified domain; npm/PyPI/OCI packages are verified by ownership; version unique per publish. GitHub's registry then lists it.
- **Anytype is already listed:** `io.github.anyproto/anytype-mcp` **v1.0.7** (published 2025-09-17, npm, stdio, env `OPENAPI_MCP_HEADERS` marked `isSecret`) in the official registry, queried live 2026-11-26. It is **stale**: npm is at 2.0.3. A third-party `io.github.ohneben/anytype-mcp` (Docker HTTP) also exists. Action item: republish a 2.0.x `server.json` (the secret env var gets a prompt in the CLI `/mcp search` form).
- **Can a localhost-only server be listed?** The registry's `remotes` entries must be publicly reachable (official docs: remote servers "MUST be publicly accessible"), so the native `127.0.0.1:31009` endpoint cannot be a `remotes` entry. Anytype can list only the **stdio npm package** (`packages[]` with `isSecret` env var) which the clients run locally. The package then proxies to localhost. Hence the registry listing helps discovery only; it is not a zero-touch install, because the user still pastes a key.

---

## 8. Enterprise / policy restrictions

- GitHub org/enterprise Copilot policies: MCP allowlist ("MCP server allow list" / registry-only). VS Code managed settings (`manage-ai-settings.md`): `allowedMcpServers` and `deniedMcpServers` (match on `serverUrl` wildcards; deny wins; empty allowlist blocks all); device policies `ChatMCP` (any source / registry-only / none), `McpGalleryServiceUrl`, `ChatAllowedMcpServers`, `ChatDeniedMcpServers`, `ChatAllowManagedMcpServersOnly`, `ChatStrictPluginOnlyCustomization` (blocks standalone user/workspace MCP servers, skills, etc.). Setting `chat.mcp.access` = `none` disables MCP.
- Since 1.145, an enterprise allowlist match is permitted even when the server is not in the registry.
- Copilot CLI honours the org registry URL and allowlist ("only servers permitted by the allowlist policy can run").
- Visual Studio: org allow list "RegistryOnly"; trust dialog on config change (18.7+).
- Effect for Anytype: a managed user may not be able to run `http://127.0.0.1:31009/...` at all. Detect failure only by the server showing as blocked or disabled in the client UI. Anytype cannot detect this from outside; show "if the server doesn't appear, your organization may block custom MCP servers".
- Sandbox: Copilot harness MCP sandbox (`chat.agent.sandbox.mcpServers`) and CLI `/sandbox` restrict **local stdio** servers; remote HTTP servers aren't sandboxed locally but "their connections from the CLI can be restricted by the sandbox's network policy" (loopback allowed by default as of 1.0.9x). If a user turns on a strict network policy, 127.0.0.1 may need allowing: unconfirmed.

---

## 9. Recommendation for Anytype

### Zero-touch route (VS Code Copilot harness + Copilot CLI + GitHub Copilot app, one action)

**What Anytype does** (after the user clicks "Connect to VS Code / Copilot" in Settings > AI):
1. Mint a dedicated API key through the internal RPC (name "VS Code / Copilot", chosen spaces, read or read-write, optional expiry). No 4-digit code.
2. Resolve the target file: `$COPILOT_HOME` if known, else `~/.copilot/mcp-config.json` (`%USERPROFILE%\.copilot\mcp-config.json` on Windows). Create `~/.copilot` (mode 0700) if needed. Read the file. Parse as JSONC; if unparseable, do not touch it and show the snippet with a "Copy" button instead.
3. Back up to `mcp-config.json.anytype-bak`, merge `mcpServers.anytype` (`type: "http"`, `url: http://127.0.0.1:<port>/mcp/large`, `headers.Authorization: Bearer <key>`, `tools: ["*"]`), write atomically with mode 0600. Use the app's configured port (default 31009; the headless CLI uses 31012).
4. Optionally also write `~/.copilot/skills/anytype/SKILL.md` (a "how to use Anytype tools well" skill) via the same step (no consent beyond the one click, shown in the confirm dialog).
5. Verify: HTTP `POST /mcp/large` `initialize` from Anytype itself with the new key (proves the endpoint and key), then show "Open VS Code" (`open vscode:` or `code .`) and "Restart server" instructions.

**What the user sees:** one dialog "Connect Anytype to GitHub Copilot": space picker, read/read-write toggle, a preview "Anytype will add a server entry to ~/.copilot/mcp-config.json (VS Code, Copilot CLI)", and a Connect button. Then a result card with a green check and a "Verify in VS Code: ask Copilot 'search my Anytype for X'" hint.

**Clicks:** 2 (open "Connect", Connect) after choosing spaces. Plus, in VS Code, the first tool call asks for the usual tool approval. If the server is not visible immediately, open **Chat: Open Customizations > MCP Servers** and press Restart Server, or start a new chat. (Reload on file edit for the VS Code Copilot harness is unconfirmed; the CLI picks up changes between turns.)

Treat "VS Code" and "Copilot CLI" as one card ("GitHub Copilot: VS Code and CLI") since they share the file, but show detection hints for each. Under the product constraint of separate cards (as with ChatGPT vs Codex), keep VS Code Insiders under the same card (same file).

### Fallbacks, in order
1. **CLI present, user prefers no file writes:** Anytype shells out `copilot mcp add --transport http --header "Authorization: Bearer <key>" anytype <url>` using `execFile` with an argument array (never a shell string). The key is briefly in argv. Prefer 3.1 where possible.
2. **VS Code legacy (Local harness, before Feb 2027) or the user lacks the Copilot harness:** fire `vscode:mcp/install?<json with headers>` (Insiders: `vscode-insiders:`) via `shell.openExternal`. The user reviews and clicks **Install**. Keep it as a fallback because the forwarding behaviour to the Copilot harness is unconfirmed and the Local harness is going away.
3. **Visual Studio 2026 (Windows):** write `%USERPROFILE%\.mcp.json` with the `servers` format (3.8), or fire `https://vs-open.link/mcp-install?<json>`; warn that header support is unconfirmed first-party and verify on a real VS before shipping.
4. **Manual:** a copy-paste snippet for 3.1 with an OS-specific path line, plus "Chat: Open Customizations > MCP Servers > Add Server > HTTP".
5. **No-secret-in-file variant:** use `Authorization: Bearer ${ANYTYPE_API_KEY}` and have Anytype set the user environment variable (Windows: `setx`; macOS: `launchctl setenv` is not persistent across reboots; Linux: `~/.config/environment.d/`). Too brittle; only for security-conscious users.

### Gotchas
- Token is stored in plaintext in the user's `.copilot` directory. GitHub's docs call this "not a secret store". Use scoped, labelled, expirable keys, 0600 permission, and tell the user how to revoke the key from Anytype (and remove the entry: `copilot mcp remove anytype`).
- Do not put the key in a web `vscode.dev/redirect` link; use a locally fired scheme URL if a deeplink is used at all.
- `password:true` inputs do not work with the Copilot harness. Do not design around them. `inputs` are Local-only and the Local harness is removed by Feb 2027.
- Copilot harness is default: older VS Code builds (before ~1.142) and VS Code with Copilot disabled do not read `~/.copilot/mcp-config.json`; ask the user to update. Minimum exact version unconfirmed.
- Org policy may block (section 8). Remote / Dev Container / WSL windows run on another host: `127.0.0.1` isn't the user's desktop Anytype there.
- Server name `anytype` is fine (`[A-Za-z0-9_-]`). Avoid collisions with a plugin that ships a server of the same name (plugin wins).
- Tier choice: `/mcp/large` for Copilot (tool count matters; VS Code allows 128 tools per request in the picker: unconfirmed, from memory). Mention `small` for small models and `full` for power users.
- If Anytype later adds OAuth/`.well-known`, switch to the OAuth route (no token in files; VS Code and the CLI both support DCR).
- Publish a refreshed `io.github.anyproto/anytype-mcp` 2.0.x entry in the MCP Registry so the VS Code gallery and CLI `/mcp search` listing is not stale at 1.0.7.

---

## Sources (all fetched 2026-11-26)

- VS Code docs: Add and manage MCP servers (`docs/agent-customization/mcp-servers.md`, main) https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/mcp-servers.md (published at https://code.visualstudio.com/docs/agent-customization/mcp-servers)
- VS Code docs: MCP configuration reference (`docs/agents/reference/mcp-configuration.md`, DateApproved 11/25/2026) https://code.visualstudio.com/docs/agents/reference/mcp-configuration
- VS Code docs: MCP developer guide, URL handlers, extension API (`api/extension-guides/ai/mcp.md`, DateApproved 11/25/2026) https://code.visualstudio.com/api/extension-guides/ai/mcp
- VS Code docs: Migrate customizations incl. FAQ on prompted secrets (`docs/agent-customization/migrate-customizations.md`) https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/migrate-customizations.md
- VS Code docs: Agent harnesses (Local removal Feb 2027) https://github.com/microsoft/vscode-docs/blob/main/docs/agents/run/agent-harnesses.md
- VS Code docs: Manage and troubleshoot MCP servers https://github.com/microsoft/vscode-docs/blob/main/docs/agents/run/manage-mcp-servers.md
- VS Code docs: Agent plugins (`vscode://chat-plugin/install`) and plugin reference https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/agent-plugins.md , https://github.com/microsoft/vscode-docs/blob/main/docs/agents/reference/agent-plugin-reference.md
- VS Code docs: Agent skills https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/agent-skills.md
- VS Code docs: Enterprise AI settings and policies https://github.com/microsoft/vscode-docs/blob/main/docs/enterprise/manage-ai-settings.md
- VS Code docs: Command line and URL handling https://github.com/microsoft/vscode-docs/blob/main/docs/configure/command-line.md
- `vscode.d.ts` @ tag 1.148.0 (`McpHttpServerDefinition`, `McpServerDefinitionProvider`) and `product.json` (`mcpRegistryDataUrl`) https://github.com/microsoft/vscode/tree/1.148.0
- VS Code release list (1.148.0 on 2026-11-25) via `gh release list -R microsoft/vscode`
- GitHub Docs: Adding MCP servers for Copilot CLI https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers (source `github/docs` main)
- GitHub Docs: Copilot CLI command reference (MCP config fields, trust levels, loading priority, env vars) https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference
- GitHub Docs: Copilot CLI plugin reference, finding/installing plugins, install CLI, add skills (`github/docs` main)
- Copilot CLI changelog (v1.0.116 on 2026-11-25; "MCP server configuration changes apply between turns" in 1.0.93) https://github.com/github/copilot-cli/blob/main/changelog.md ; releases: `gh release list -R github/copilot-cli`
- Visual Studio docs: Use MCP servers in Visual Studio (`ms.date: 05/26/2026`) https://learn.microsoft.com/visualstudio/ide/mcp-servers (source `MicrosoftDocs/visualstudio-docs` main)
- Third-party VS example with headers and inputs (secondary, not first-party): https://support.sqai-suite.com/en/articles/github-copilot-in-visual-studio-mcp
- Official MCP Registry live API: `https://registry.modelcontextprotocol.io/v0/servers?search=anytype` (anyproto entry v1.0.7, 2025-09-17)
- MCP Registry publishing docs (secondary summaries): https://modelcontextprotocol.io/registry/quickstart , https://modelcontextprotocol.io/registry/remote-servers
- `insiders.vscode.dev/redirect/mcp/install` legacy form seen only in community READMEs (e.g. glama.ai mirror of mcp-vsc-button-gen): unconfirmed.


---

## Verification log (2026-11-26, verifier pass)

Sources: raw docs from microsoft/vscode-docs main via `gh api` (mcp-configuration.md, mcp-servers.md, migrate-customizations.md, agent-harnesses.md, api/extension-guides/ai/mcp.md, agent-plugins.md, manage-mcp-servers.md), github/docs add-mcp-servers.md, github/copilot-cli changelog.md, MicrosoftDocs/visualstudio-docs ide/mcp-servers.md, registry.modelcontextprotocol.io live API. `code` and `copilot` are not installed here, so no `--help` could be run.

| Claim | Verdict | Source |
|---|---|---|
| VS Code stable 1.148.0 on 2026-11-25 | CONFIRMED | `gh release list -R microsoft/vscode` |
| Copilot CLI latest stable v1.0.116 (2026-11-25) | UNCONFIRMED / drifting: only pre-releases 1.0.117-2/-3/-4 (up to 2026-11-26 22:51Z) seen in the first 3 listed rows; stable number not re-checked | `gh release list -R github/copilot-cli` |
| Copilot harness reads `$COPILOT_HOME/mcp-config.json` else `~/.copilot/mcp-config.json`; workspace `.mcp.json`; format `mcpServers` | CONFIRMED | https://code.visualstudio.com/docs/agents/reference/mcp-configuration (lines on "Copilot user mcp-config.json") |
| Same file shared by VS Code Copilot harness, Copilot CLI and GitHub Copilot app; VS Code does not check both locations | CONFIRMED | same doc + docs/agent-customization/ mcp.md line 14 |
| Local harness deprecated, removed by February 2027; profile `mcp.json` / `.vscode/mcp.json` use `servers` format | CONFIRMED | https://github.com/microsoft/vscode-docs/blob/main/docs/agents/run/agent-harnesses.md |
| Windows path is `%USERPROFILE%\.copilot\mcp-config.json` | UNCONFIRMED (docs only say `~/.copilot`; very likely `%USERPROFILE%`) | cli.md |
| HTTP headers supported; literal allowed technically but discouraged; `${NAME}` and `${NAME:-default}` expand in header values; bare `$NAME` literal in VS Code | CONFIRMED | mcp-configuration.md "Environment-variable references" |
| No `inputs`/`password:true`/SecretStorage bridge for HTTP in the Copilot harness; `${input:}` configs rejected for forwarding | CONFIRMED | mcp-configuration.md "Authentication and secrets" and input-variables section; migrate-customizations.md FAQ; issues microsoft/vscode#334271, #337311 |
| OAuth fields `oauthClientId` etc., redirects `http://127.0.0.1:33418` and `https://vscode.dev/redirect` | CONFIRMED (oauthClientId; redirects in mcp.md line 118). Other flat fields (`oauthScopes`, `oauthPublicClient`, `oauthGrantType`) UNCONFIRMED here | mcp-configuration.md, mcp.md |
| Loopback http URL allowed (no HTTPS requirement) | CONFIRMED indirectly: Visual Studio docs ship Figma link to `http://127.0.0.1:3845/mcp`; CLI changelog treats loopback specially in sandbox. No VS Code statement of a block found | vs.md; copilot-cli changelog |
| `vscode:mcp/install?<urlencoded JSON>` and `vscode-insiders:` form; opens details editor for review, user must click install; by-name and gallery-URL lookups; `https://vscode.dev/redirect?url=` wrapper | CONFIRMED | https://code.visualstudio.com/api/extension-guides/ai/mcp (section "Create an MCP installation or lookup URL"). The doc's example has `name`/`command` shape; `type:http`+`headers` in the link JSON is not shown in the doc: UNCONFIRMED |
| Deeplink-installed server reaches Copilot harness sessions | UNCONFIRMED. Docs say profile configs "can be forwarded" if eligible (no input/command vars); not stated for deeplink installs specifically | mcp-configuration.md "Editor forwarding" |
| `code --add-mcp` | UNCONFIRMED: not found in the fetched current docs (grep of mcp docs); it existed in 2025. Do not rely on it | n/a |
| Extension API `McpHttpServerDefinition(label, uri, headers?, version?)` and `mcpServerDefinitionProviders` | NOT re-checked (researcher read vscode.d.ts at 1.148.0; plausible). Forwarding of extension-provided definitions CONFIRMED as "eligible ... can be forwarded", extension needed | mcp-configuration.md |
| `copilot mcp add --transport http --header "Authorization: Bearer X" NAME URL` writes `~/.copilot/mcp-config.json` | CONFIRMED (flags `--header`, `--transport stdio|http|sse`, default stdio). Positional order: the doc example puts options first then name then URL | https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers |
| `/mcp add` form: available immediately without restart, Ctrl+S saves | CONFIRMED | same |
| CLI: config changes apply between turns without restart | CONFIRMED (v1.0.93, 2026-10-07 changelog) | github/copilot-cli changelog.md |
| VS Code Copilot harness reload on file edit | UNCONFIRMED. Docs: "Restart Server" restarts Copilot runtime servers (stop then start) | manage-mcp-servers.md |
| CLI tolerates comments/trailing commas in mcp-config.json | PARTIAL: changelog confirms comments/trailing commas for workspace `.mcp.json`/`.github/mcp.json` loading; for user `mcp-config.json` only error-message wording hints. Treat as strict JSON when writing; preserve unknown keys; fail safe on parse errors | changelog.md |
| Plugin deeplinks `vscode://chat-plugin/install?source=owner%2Frepo&plugin=name` and `chat-plugin/add-marketplace?ref=` | CONFIRMED | agent-plugins.md |
| Visual Studio config files and order (`%USERPROFILE%\.mcp.json` first), `servers` key, save reloads agent | CONFIRMED | https://learn.microsoft.com/visualstudio/ide/mcp-servers |
| Visual Studio `headers` in .mcp.json / vs-open.link accepting headers | UNCONFIRMED first-party (vs-open.link `mcp-install?<json>` itself is CONFIRMED with name/url/type/inputs/gallery) | vs.md |
| Registry listing `io.github.anyproto/anytype-mcp` v1.0.7 is the latest; stale vs npm 2.0.3 | CONFIRMED live | https://registry.modelcontextprotocol.io/v0/servers?search=anytype |
| Registry `remotes` must be publicly reachable so localhost cannot be listed | UNCONFIRMED here (secondary docs); consistent with the registry's remote-server guidance | modelcontextprotocol.io/registry/remote-servers |
| Env-var-from-GUI caveat (macOS GUI VS Code does not see shell exports) | UNCONFIRMED but well-known | n/a |

New findings the report missed or under-stated:
- Local-harness-only status of the deeplink and `.vscode/mcp.json` is explicit in the docs: section is titled "Editor-managed configuration for Local harness compatibility". By Feb 2027 only the native file route is durable.
- No newer one-click install route exists for the native Copilot file in the docs (no `vscode:` URL writes `mcp-config.json`). Plugin deeplink is the only new one-click route, and it cannot carry a secret.
- Documented header caveat: for static bearer tokens in the Copilot harness the only supported ways are env var or file literal (docs say a personal config file "is not a secret store").

## Recommendation for Anytype

**Primary (zero-touch): write `~/.copilot/mcp-config.json`** (Windows `%USERPROFILE%\.copilot\mcp-config.json`, honor `COPILOT_HOME` if present). One card "GitHub Copilot (VS Code, Insiders, Copilot CLI)".
1. Anytype mints a dedicated key via RPC (name "GitHub Copilot", chosen spaces, read or read-write, optional expiry).
2. Read the file if it exists; parse as strict JSON (if it fails, do not write: show a copy-paste snippet). Back it up, set only `mcpServers.anytype = {"type":"http","url":"http://127.0.0.1:<port>/mcp/large","headers":{"Authorization":"Bearer <key>"},"tools":["*"]}`, preserve all other keys, write atomically, mode 0600 (dir 0700).
3. Self-test: POST `initialize` to the endpoint with the key; show success.
4. User sees: one dialog (spaces, read/write, preview of the file path and entry, Connect), then a success card with "In VS Code open Chat: Open Customizations > MCP Servers (or start a new chat); Copilot CLI picks it up on the next turn".

**Fallbacks**
1. `copilot mcp add --transport http --header "Authorization: Bearer <key>" anytype <url>` via execFile arg array when the CLI is on PATH (key visible in argv briefly).
2. Local-harness / older VS Code: open `vscode:mcp/install?<encoded JSON>` (Insiders `vscode-insiders:`), user clicks Install. Verify whether `type:http` + `headers` is honored in the link before shipping; expires with the Local harness in Feb 2027.
3. Visual Studio 2026 (Windows): write `%USERPROFILE%\.mcp.json` with `servers.anytype` (`type:http`, `url`, `headers`); header support unconfirmed first-party, test on a real VS; the file reloads on save.
4. Manual snippet with OS-specific path, or in-app form (Chat: Open Customizations > MCP Servers > Add Server > HTTP > Copilot Global).
5. Optional: drop `~/.copilot/skills/anytype/SKILL.md`; publish a plugin repo for the skill only (plugin cannot carry the key).

**OS notes:** macOS/Linux `~/.copilot/mcp-config.json` chmod 600. Windows `%USERPROFILE%\.copilot\mcp-config.json` (unconfirmed expansion), restrict ACL. GUI apps do not inherit shell env vars, so avoid the `${ANYTYPE_API_KEY}` variant.

**Gotchas:** plaintext key at rest (use scoped, labeled, expiring key and tell the user how to revoke); remote/WSL/Dev Container windows cannot reach the desktop's 127.0.0.1; org policy (`ChatMCP`, allowlists, `ChatStrictPluginOnlyCustomization`) may block custom servers silently; plugin-provided server named `anytype` would shadow the file entry in the CLI; VS Code reload-on-edit unconfirmed, tell the user to Restart Server or start a new chat; update the MCP Registry entry (1.0.7 is stale) so gallery and `/mcp search` listings stay accurate; switch to OAuth if Anytype later adds it. Minimum VS Code version for native file reading is unconfirmed (assume current 1.14x).
