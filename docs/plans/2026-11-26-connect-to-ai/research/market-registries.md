# Cross-client MCP registries and marketplaces: what they mean for Anytype (as of 2026-11-26)

Scope: official MCP Registry, GitHub MCP Registry / VS Code gallery, Docker MCP Catalog, Cursor marketplace, Windsurf (now "Devin Desktop"?) / Cline marketplaces, Gemini CLI extensions gallery, Smithery / Glama. Claude Desktop extensions directory, ChatGPT app directory, LM Studio, Ollama are NOT covered here (other research tracks). Anything not confirmed from a live source is marked "unconfirmed".

## 0. Key findings (read this first)

1. **Anytype is already in the official registry, but with a stale entry.** `io.github.anyproto/anytype-mcp` is live at version **1.0.7** (published 2025-09-17, `isLatest: true`, status active). The npm package is at **2.0.3** (GitHub release v2.0.3, 2026-11-18). The repo's `server.json` says 2.0.3 but the registry was never updated. The repo's `release.yml` has no mcp-publisher step (it only does npm and Docker/GHCR), so nobody has republished. Anyone browsing the registry sees an old v1 entry that tells them to hand-craft `OPENAPI_MCP_HEADERS` JSON.
2. **A localhost remote CANNOT be published to the official registry.** The registry validator rejects localhost for `remotes` (`internal/validators/utils.go`: "stricter than packages - no localhost allowed"; `validators.go`: "no templates allowed for remotes, no localhost"). The docs say the registry "does not support private servers" and a remote "MUST be publicly accessible". Localhost is allowed only inside a package's `transport.url` (the doc example `http://localhost:{--port}/mcp`), where the package is something the client launches.
3. **The registry is metadata only and is not consumed directly by most apps.** The MCP docs say it "is not intended to be directly consumed by host applications"; downstream aggregators consume it. Confirmed consumer: GitHub's MCP Registry, which feeds VS Code's gallery. Cursor and Windsurf consuming it directly: unconfirmed (no source found). So one publication reliably reaches GitHub/VS Code (and aggregators), not "many apps" automatically.
4. **The registry gives no way to hand off to the Anytype app to mint a key.** It can only prompt the user for a secret env var or header. The only good "mint key" experience is to ship through a channel where Anytype desktop itself does the install (deeplink / config write). Listings are discovery; the Anytype desktop "Connect" button is the product.
5. **Smithery's hosted layer is dead (shutdown 2026-10-31).** Directory remains. Docker catalog is container-only and poor fit for a host-local app. Cursor marketplace requires a public-repo plugin and Cursor-team review. Gemini gallery needs no submission, only a repo + topic.

## 1. Directories and marketplaces

| Name | URL | What it lists | Status / notes |
|---|---|---|---|
| Official MCP Registry | https://registry.modelcontextprotocol.io (API `/v0.1/servers`) | Metadata (`server.json`) for public servers: packages (npm/PyPI/NuGet/Cargo/OCI/MCPB) and public remotes | Preview. Backed by Anthropic, GitHub, PulseMCP, Microsoft. Maintainer release v1.8.16 (2026-11-23). |
| GitHub MCP Registry | https://github.com/mcp | Curated downstream of official registry; "Install in VS Code" buttons | Article dated 2025-10-24 says publishing to the official registry makes GitHub pick it up, and requests to be featured went via partnerships@github.com. Self-publish to GitHub "in the next couple months" (unconfirmed whether shipped). |
| VS Code MCP gallery | `vscode:mcp/by-name/<name>`; Command Palette "MCP: Browse MCP Servers"; "Chat: Open Customizations > Browse > GitHub Feed" (`@type:mcp`) | Servers from the active registry/gallery | Backed by GitHub registry (third-party source says `api.mcp.github.com`; unconfirmed from first-party docs). GitHub Feed is marked Experimental and depends on org policy. |
| Docker MCP Catalog | https://hub.docker.com/mcp (973 servers seen), Docker Desktop MCP Toolkit | Containerised local servers (Docker-built, signed) and remote servers | PR to https://github.com/docker/mcp-registry |
| Cursor Marketplace | https://cursor.com/marketplace, submit at https://cursor.com/marketplace/publish | Plugins (bundle MCP servers, rules, skills, etc.) | Public Git repo required (docs reference page does not say "open source"; the publish page said so per the researcher: unverified), reviewed by Cursor team |
| Windsurf / Devin Desktop | in-app MCP Marketplace / "Windsurf MCP Plugin Store" | Built-in marketplace | CORRECTED: rename to Devin Desktop confirmed by docs.devin.ai (multiple sources, June 2026). Current user-level config is `~/.config/devin/mcp_config.json` (macOS/Linux, honours XDG_CONFIG_HOME) or `%AppData%\devin\mcp_config.json` (Windows); project `.devin/mcp_config.json`. Legacy `~/.codeium/windsurf/mcp_config.json` is only an editor-discovery file; one FAQ page contradicts with `~/.codeium/mcp_config.json`. No public submission process found. |
| Cline MCP Marketplace | https://github.com/cline/mcp-marketplace | GitHub-repo-based servers | Submit via GitHub issue (repo URL + 400x400 PNG logo + reason); Cline's AI installs using README or optional `llms-install.md`. Review by Cline team. (Secondary sources; template not verified.) |
| Gemini CLI extensions gallery | https://geminicli.com/extensions | Extensions with `gemini-extension.json` (can include `mcpServers`) | Auto-indexed, no submission |
| Smithery | https://www.smithery.ai | Public directory only | Hosted connections shut down 2026-10-31; acquired by Arcade.dev (announced 2026-08-05). |
| Glama | https://glama.ai/mcp/servers | Auto-indexed GitHub MCP servers + connectors | Free listing; claim via `glama.json`. 2026 claim flow unverified. |

Other aggregators (PulseMCP, mcp.so, LobeHub, mcpservers.org) appear in search results and are fed by the official registry or crawling. Not researched further.

## 2. Submission processes

### 2.1 Official MCP Registry (primary source: modelcontextprotocol/registry docs)
No PR; publish from the server's project with `mcp-publisher`. Free (no fee mentioned). Review: automated (namespace auth, package ownership, OSV.dev malware check); no human wait; moderators can take down spam.
```bash
mcp-publisher init                 # writes server.json
mcp-publisher login github         # or github-oidc in Actions, or dns / http for com.example/* namespaces
mcp-publisher publish
```
- Namespace: `io.github.<user-or-org>/name` requires GitHub login as that account/org member; `com.anytype/...` style requires DNS TXT or HTTP challenge.
- npm ownership: `package.json` must contain `"mcpName": "io.github.anyproto/anytype-mcp"` (already present in v2.0.3).
- Versions are immutable; publish a new unique version string to update. `mcp-publisher status --status deleted ...` to withdraw.
- Allowed package registries: npm.org, PyPI, NuGet, crates.io, OCI (docker.io, ghcr.io, quay.io, *.pkg.dev, *.azurecr.io, mcr.microsoft.com), MCPB (GitHub/GitLab releases only; URL must contain "mcp"; needs `fileSha256`).
- GitHub Actions: `mcp-publisher login github-oidc` then `mcp-publisher publish`, docs page `github-actions.mdx`.

### 2.2 GitHub MCP Registry / VS Code
Publish to the official registry first. GitHub picks it up automatically (per GitHub blog 2025-10-24); a request to partnerships@github.com was needed for inclusion then (current state unconfirmed). Install: user clicks "Install in VS Code" on the github.com/mcp page.

### 2.3 Docker MCP Catalog (https://github.com/docker/mcp-registry CONTRIBUTING)
1. Fork, add `servers/<name>/server.yaml`, open PR, CI must pass, Docker team review of every PR (share test credentials through a form). Listed within 24 h of approval. Licence must be permissive (MIT/Apache recommended, GPL not accepted).
2. Local server: Dockerfile in source repo; Docker builds and signs the image (`mcp/<name>`).
3. Remote server: public endpoint, transport `streamable-http` or `sse`, doc URL, OAuth details if auth is needed. `task remote-wizard` generates `server.yaml`, `tools.json` (`[]`), `readme.md`.
```yaml
name: my-orgdb-mcp
image: mcp/my-orgdb-mcp
type: server
config:
  secrets:
    - name: my-orgdb-mcp.api_token
      env: API_TOKEN
      example: <API_TOKEN>
```
```yaml
name: linear
type: remote
dynamic: { tools: true }
remote: { transport_type: streamable-http, url: https://mcp.linear.app/mcp }
oauth:
  - provider: linear
    secret: linear.personal_access_token
    env: LINEAR_PERSONAL_ACCESS_TOKEN
```

### 2.4 Cursor Marketplace (https://cursor.com/docs/plugins, /docs/reference/plugins)
Test in `~/.cursor/plugins/local`, submit at https://cursor.com/marketplace/publish. "All plugins must be open source, and we review each update before publishing." Checklist: valid `.cursor-plugin/plugin.json` (only `name` required; kebab-case unique), description, README, relative paths only, every `${VAR}` in `mcp.json` declared in `plugin.json` `variables` (JSON-schema object). Review time and criteria: not published (third-party guides say no confirmation or status page; unconfirmed). Fees: none found.
```
my-plugin/
  .cursor-plugin/plugin.json
  mcp.json          # Cursor infers transport from command or url; supports args, env, headers
  README.md
```
```json
{ "mcpServers": { "anytype": { "url": "http://127.0.0.1:31009/mcp/large",
  "headers": { "Authorization": "Bearer ${ANYTYPE_API_KEY}" } } } }
```
(The mcp.json above is my composition from the documented fields; the `variables` placement is per docs, exact key name `variables` confirmed, the combination untested.)

### 2.5 Gemini CLI (https://geminicli.com/docs/extensions/releasing/)
No submission. Public GitHub repo + topic `gemini-cli-extension` + `gemini-extension.json` at repo/archive root (version should match release tag). Crawler indexes it; the `description` is shown on the gallery. Daily cadence: unconfirmed.

### 2.6 Cline
GitHub issue in cline/mcp-marketplace with repo URL, 400x400 PNG logo; optional `llms-install.md` for AI-driven setup. Source: secondary (mcp.so mirrors, cline blog); template unverified.

### 2.7 Smithery / Glama
Smithery: nothing to submit to; hosted publishing ended (PRs across GitHub dropped the publish step Oct 2026). Glama: auto-indexes; claim with `glama.json` in repo root; free, boosted listings ~$49/month (single third-party source).

## 3. Can a LOCAL-ONLY server (127.0.0.1) be listed?

| Channel | Verdict |
|---|---|
| Official registry, `remotes` with localhost | **No.** Validator rejects it; policy says remotes must be publicly accessible. |
| Official registry, `packages` (npm stdio) | **Yes, exactly what exists now** (`@anyproto/anytype-mcp`). Client launches the process via npx; needs Node. |
| Official registry, `packages` with `transport: streamable-http, url: http://localhost:{--port}/mcp` | Schema-legal ("Local Server with URL Templating" example), but it describes a package the client runs which then listens on that port. Anytype's endpoint is served by the desktop app, not a package, so it doesn't fit. Whether clients honour this shape: unconfirmed. |
| Official registry, MCPB package (`registryType: mcpb`) | Legal (GitHub release asset, `fileSha256`). Registry stores it; which clients install MCPB from the registry is unconfirmed (Claude Desktop uses .mcpb files directly; other track). |
| GitHub/VS Code | Same constraints as the official registry (it is downstream). Local packages must be stdio via npm/PyPI/NuGet/Docker. |
| Docker catalog | Local servers must be containers. A container reaches the host only via `host.docker.internal`. A third-party Anytype Docker wrapper already documents: "Anytype rejects non-loopback hosts with 403" and needs `ANYTYPE_API_HOST_HEADER` override (io.github.ohneben/anytype-mcp, in the official registry). So a catalog image would need either a heart Host-header allowance or a proxy that rewrites Host. Poor fit. |
| Cursor plugin | Yes in principle: plugin `mcp.json` can use `url` + `headers`, or stdio `command`. No rule against localhost found (page does not say). Requires open-source and review. |
| Gemini extension | Yes: `mcpServers` in `gemini-extension.json` accepts the same format as settings.json, localhost HTTP allowed (inferred, format not tested). |
| Cline | Yes: repo-based, Cline installs locally. |
| Tunnel/hosted endpoint | Not mandatory for the channels above; only mandatory for web-based AI apps (ChatGPT, claude.ai) per other tracks. Not recommended: leaks a personal local-first endpoint. |

## 4. End-user install experience

- **Official registry listing itself:** nothing to click for the end user. Third-party apps render it. In VS Code (from GitHub registry or `vscode:mcp/by-name/io.github.anyproto/anytype-mcp`): details page, review tools/permissions, click Install. For a package with a required secret env var, VS Code prompts for the value (secret input). So the user must paste an API key; no hook to open Anytype. (Prompt behaviour is from the GitHub blog, "pre-filled configuration"; exact secret-prompt UI for registry installs: unconfirmed.)
- **VS Code deeplink formats (confirmed, VS Code API doc):**
```
vscode:mcp/install?<urlencoded JSON.stringify({name, ...config})>
vscode-insiders:mcp/install?...
vscode:mcp/by-name/io.github.anyproto/anytype-mcp
https://vscode.dev/redirect?url=<urlencoded vscode: URL>
```
  The install-from-JSON link opens the review page, never silently installs. Anytype desktop can fire this with the minted key embedded in the JSON: user sees one VS Code confirmation. This is a better flow than the registry.
- **Cursor:** marketplace "Add to Cursor" on a plugin; plugin variables are filled by team admin (dashboard) or "Configure". Cursor config supports `${env:NAME}` interpolation in `url` and `headers` (confirmed) but `envFile` is stdio-only. CORRECTED: the deeplink IS confirmed at https://cursor.com/docs/context/mcp/install-links: `cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG`, where config is base64 of the INNER server object (e.g. `{"url":...,"headers":{...}}`), name passed separately. The page has no url/headers example, so a url+headers config is expected to work (same format as mcp.json) but untested.
- **Docker:** checkbox in MCP Toolkit, secrets entered in Docker Desktop UI.
- **Gemini:** `gemini extensions install https://github.com/<org>/<repo>`; secrets would need extension settings (unconfirmed).
- **Hand-off to Anytype for key minting:** not offered by any listing. The reverse direction (Anytype app launches `vscode:mcp/install?...`, writes `.cursor`/`mcp.json`, runs `gemini extensions install`, etc.) is the way.

## 5. Precedents (local-first apps)

- **Obsidian:** community plugins ("MCP Server", "Semantic Vault MCP" which ships a `.mcpb` for drag-install into Claude Desktop, "Local REST API" extension) run a local server inside the app; all are community, none is an official Obsidian listing in the results; not seen in the official registry from my search (unchecked via API).
- **Anytype itself:** third-party `io.github.ohneben/anytype-mcp` is in the official registry as an OCI package with `streamable-http` `http://localhost:{PORT}/mcp` and `ANYTYPE_API_KEY` secret + `runtimeArguments` (`-p`, `--add-host host.docker.internal:host-gateway`) (v1.0.4-1.0.6, Sept 2026). That is the best in-registry precedent for a localhost-pointing entry: a runnable package that a client starts, not a bare remote.
- Notion, Figma desktop, JetBrains, Zotero listings: not researched (unconfirmed). Notion/Figma are hosted-remote OAuth models and do not apply to a 127.0.0.1 server.

## 6. Recommendation for Anytype

**Worth doing, but as discovery plumbing, not as the primary connect path.** Rank by value per effort:

1. **(Now, ~1 hour) Republish the official registry entry at 2.0.x.** Add `mcp-publisher login github-oidc` + `publish` to `anyproto/anytype-mcp/.github/workflows/release.yml`, refresh `server.json` to the 2025-12-11 schema (camelCase `registryType`, `environmentVariables`, `isRequired`, `isSecret`; the current repo file uses the old 2025-07-09 snake_case), simplify the env var. Outcome: GitHub registry and VS Code gallery and aggregators show current data. Keep it stdio npm; when the package becomes a thin proxy, make the key a single secret env var (`ANYTYPE_API_KEY`) plus optional `ANYTYPE_MCP_URL` instead of the JSON-in-env `OPENAPI_MCP_HEADERS`. Add `description` text pointing to "Create the key in Anytype: Settings > API".
2. **(Primary) Build in-app "Connect to X" in Anytype desktop** that mints the key and uses each client's native route: `vscode:mcp/install?...` deeplink for VS Code, writing `mcp.json`/`mcp_config.json`, `gemini extensions install` or settings write, etc. This is where the "no manual key" requirement is actually satisfied; registries cannot do it.
3. **(Optional, small) Gemini CLI extension repo** (`gemini-cli-extension` topic + `gemini-extension.json`): zero submission, free gallery presence. Only worthwhile if the desktop connect flow also uses the extension install path.
4. **(Later, only if the native /mcp endpoint gets an official public package) Cursor plugin submission.** Requires open-source plugin, manual review; presence in the marketplace is mostly discovery, and variables prompts still need a pasted key.
5. **Skip:** Docker catalog (container + Host-header 403 mismatch, needs heart changes), Smithery (hosted layer shut down), localhost-remote registry entry (rejected by validator), tunnels. Claim Glama only if it is free and automatic (low priority).

Release proposal: step 1 in the next anytype-mcp patch (independent of desktop release); step 2 in the desktop release that ships "Connect" UI; steps 3-4 after the native `/mcp` endpoint is in a stable heart release and the stdio proxy is final.

## Sources (seen 2026-11-26)

- Official registry API query, anytype: https://registry.modelcontextprotocol.io/v0/servers?search=anytype (returns `io.github.anyproto/anytype-mcp` 1.0.7 published 2025-09-17; `io.github.ohneben/anytype-mcp` 1.0.4-1.0.6, Sept 2026)
- https://github.com/modelcontextprotocol/registry (release v1.8.16, 2026-11-23); docs `docs/modelcontextprotocol-io/{about,remote-servers,quickstart,package-types,faq,registry-aggregators}.mdx`, `docs/reference/server-json/{generic-server-json,official-registry-requirements}.md`; validators `internal/validators/utils.go`, `validators.go` (localhost rejection) via `gh search code`
- https://modelcontextprotocol.io/registry/about
- https://github.com/anyproto/anytype-mcp (package.json 2.0.3, server.json, releases v2.0.1-v2.0.3, workflows ci.yml/release.yml)
- https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/ (2025-10-24)
- https://github.com/mcp (page content only partially described)
- https://code.visualstudio.com/api/extension-guides/ai/mcp and https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- https://docs.docker.com/ai/mcp-catalog-and-toolkit/catalog/ and https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md; https://hub.docker.com/mcp
- https://cursor.com/docs/plugins, https://cursor.com/docs/reference/plugins, https://cursor.com/docs/mcp
- https://geminicli.com/docs/extensions/releasing/ and https://geminicli.com/docs/extensions/reference/ (via search summary)
- https://www.smithery.ai/future and PRs formio/ai#116, alxspiker/mcp-server-ftp#24 (Oct 2026), https://o11.ai/blog/smithery-connect-migration (search summaries)
- Glama: https://glama.ai/blog/2025-07-08-what-is-glamajson, https://glama.ai/mcp/servers (search summaries; 2026 flow unverified)
- Cline: https://github.com/cline/mcp-marketplace, https://cline.bot/blog/introducing-the-mcp-marketplace-clines-new-app-store (search summaries)
- Windsurf/Devin Desktop: third-party only (fast.io, olostep.com guides, 2026); no first-party docs fetched.
- Obsidian MCP plugins: https://community.obsidian.md/plugins/mcp-server, https://community.obsidian.md/plugins/semantic-vault-mcp (search summaries)

## Verification log

| Claim | Verdict | Source |
|---|---|---|
| Registry has io.github.anyproto/anytype-mcp 1.0.7, published 2025-09-17, isLatest, active | CONFIRMED (live API) | https://registry.modelcontextprotocol.io/v0/servers?search=anytype |
| ohneben/anytype-mcp 1.0.4-1.0.6, Sept 2026 | CONFIRMED | same API |
| npm/GitHub release v2.0.3 on 2026-11-18; registry stale | CONFIRMED (releases v2.0.3 2026-11-18, v2.0.2 2026-11-07, v2.0.1 2026-09-19) | gh api repos/anyproto/anytype-mcp/releases |
| release.yml has no mcp-publisher step | CONFIRMED (grep for publisher/mcp found nothing) | gh api repos/anyproto/anytype-mcp/contents/.github/workflows/release.yml |
| Registry validator rejects localhost for remotes | CONFIRMED; also rejects non-https and templates (IsValidRemoteURL: hostname localhost/127.0.0.1/*.localhost -> false; scheme must be https) | https://github.com/modelcontextprotocol/registry internal/validators/utils.go, validators.go |
| Registry release v1.8.16 2026-11-23 | CONFIRMED | gh api releases/latest |
| VS Code `vscode:mcp/install?<urlencoded JSON>`, `vscode-insiders:`, `vscode:mcp/by-name/<name>`, vscode.dev/redirect wrapper; opens review page | CONFIRMED | https://code.visualstudio.com/api/extension-guides/ai/mcp |
| VS Code install JSON accepts http+headers | UNCONFIRMED on install-link page. Config reference confirms `{"type":"http","url":...,"headers":{...}}` in mcp.json and localhost http example; install-link JSON is documented only with name+command. Test before relying. | https://code.visualstudio.com/docs/agents/reference/mcp-configuration |
| `code --add-mcp '{"name":..,"type":..,...}'` | CONFIRMED (new: a CLI route, writes user profile mcp.json). Needs `code` on PATH (not on this machine). | same |
| VS Code mcp.json uses top-level `servers`; inputs promptString password:true; headers `Bearer ${input:id}` | CONFIRMED. New Copilot-native files `~/.copilot/mcp-config.json` / `.mcp.json` use `mcpServers`. | same |
| Cursor deeplink format | CORRECTED (unconfirmed -> confirmed, see section 4) | https://cursor.com/docs/context/mcp/install-links |
| Cursor `~/.cursor/mcp.json` global, `.cursor/mcp.json` project; headers + `${env:NAME}` interpolation in url/headers; envFile stdio-only; OAuth `auth` object; extension API `vscode.cursor.mcp.registerServer()` | CONFIRMED (extension API is new/missed by researcher; signature not documented) | https://cursor.com/docs/mcp |
| Cursor plugin: `.cursor-plugin/plugin.json`, only `name` required, `variables` JSON-schema, no secrets in repo, values set by team admin in dashboard | CONFIRMED | https://cursor.com/docs/reference/plugins |
| Cursor marketplace requires "open source" | CORRECTED: reference page says "public Git repository", reviewed by Cursor team; "open source" not stated there | same |
| Gemini: no submission; repo + topic; gemini-extension.json with mcpServers (all options except `trust`) and `settings` (name, description, envVar, sensitive->keychain) | CONFIRMED; the `settings` block is NEW (researcher said unconfirmed) and gives a keychain-backed secret prompt on `gemini extensions install` | https://geminicli.com/docs/extensions/reference/ |
| Gemini CLI local: `gemini mcp add [-s user|project] [-t stdio|sse|http] [-H "Header: v"] [-e K=V] <name> <commandOrUrl>`; default scope is PROJECT | CONFIRMED via `gemini --help` on v0.32.1 (this machine). Use `-s user`. | local CLI |
| Gemini: `httpUrl` = streamable HTTP, `url` = SSE, `headers` supported | CONFIRMED | https://geminicli.com/docs/tools/mcp-server/ |
| Gemini CLI replaced by Antigravity CLI for unpaid/Google One users on 2026-06-18 | NEW (missed): reach for free-tier users shifts to Antigravity; its MCP config unresearched | https://geminicli.com/docs/extensions/reference/ |
| Gemini `extensions install` also supports `--consent`, `--auto-update` | CONFIRMED local help | local CLI |
| Windsurf renamed Devin Desktop (June 2026) | CORRECTED from "unconfirmed" to confirmed (docs.devin.ai redirects) | https://docs.devin.ai/windsurf/plugins/cascade/mcp, https://docs.devin.ai/desktop/changelog (via search) |
| Windsurf config path `~/.codeium/windsurf/mcp_config.json` | CORRECTED: current = `~/.config/devin/mcp_config.json` / `%AppData%\devin\mcp_config.json`; remote key `serverUrl` or `url`, `headers`, `${env:VAR}` interpolation incl. headers; docs contradictory on legacy path (FAQ says `~/.codeium/mcp_config.json`) | https://docs.devin.ai/windsurf/plugins/cascade/mcp |
| Windsurf live reload | PARTLY: changelog says editing mcp_config.json refreshes only the affected server; the Cascade page says press refresh after adding a plugin. Treat as "refresh button may be needed". | docs.devin.ai (search summary) |
| Windsurf one-click deeplink | UNCONFIRMED | - |
| Smithery hosted layer shut down 2026-10-31, directory remains, now part of Arcade | CONFIRMED | https://smithery.ai/future (search excerpt) |
| Cline marketplace: submit GitHub issue with repo URL, 400x400 PNG, reason; approval criteria are community adoption, developer credibility, maturity, security; `llms-install.md` | CONFIRMED (primary README now read). Note: criteria favour established projects; AI installs from README, so no secret-handling hook. | https://github.com/cline/mcp-marketplace README |
| Docker catalog: containers only; PR to docker/mcp-registry; Host-header 403 issue | NOT re-verified in this pass (researcher sources are primary docs); keep as lower-confidence. | - |
| GitHub registry self-publish shipped | UNCONFIRMED: only 2025 posts found (launch curated; self-publication planned). Practical route remains official-registry publish. | https://github.blog/changelog/2025-09-16-github-mcp-registry-the-fastest-way-to-discover-ai-tools/ |
| Glama free claim via glama.json | UNCONFIRMED (not re-checked) | - |

## Recommendation for Anytype

**Primary zero-touch route: the Anytype desktop "Connect" button, not a registry.** No registry can mint the key or point at 127.0.0.1 (official registry rejects localhost remotes; others need a public repo and a pasted secret). Per client, once the user picks spaces and Anytype mints the key:

- Cursor: open `cursor://anysphere.cursor-deeplink/mcp/install?name=anytype&config=<base64 of {"url":"http://127.0.0.1:31009/mcp/large","headers":{"Authorization":"Bearer <key>"}}>`. User sees Cursor's install confirmation, clicks Install. Fallback: merge into `~/.cursor/mcp.json` (exists on this machine). The key lands in plaintext in the link and config, so avoid logging it.
- VS Code: `vscode:mcp/install?<urlencoded {"name":"anytype","type":"http","url":...,"headers":{...}}>` (test that http+headers is accepted; VS Code shows a review page, one click), or silently via `code --add-mcp '{"name":"anytype","type":"http","url":...,"headers":{"Authorization":"Bearer ..."}}'` if `code` is on PATH.
- Gemini CLI: run `gemini mcp add -s user -t http -H "Authorization: Bearer <key>" anytype http://127.0.0.1:31009/mcp/large` (no clicks; verified flags on v0.32.1). No marketplace needed.
- Windsurf / Devin Desktop: write `anytype` entry with `serverUrl`/`url` + `headers` into `~/.config/devin/mcp_config.json` (or `%AppData%\devin\mcp_config.json`); tell user to press refresh in the MCP panel.
- Cline: write its own MCP settings file or let its AI install from README; per-client details are outside this track.

**Fallback:** the published npm stdio package (`@anyproto/anytype-mcp`) for clients that cannot do HTTP + headers; user pastes a key from Settings. Also the manual config snippet shown in-app with a Copy button.

**Registry work (cheap, discovery only):** republish `io.github.anyproto/anytype-mcp` at 2.x via `mcp-publisher login github-oidc` in release.yml (current entry is a stale 1.0.7), switching to a single secret env var. Optionally a Gemini extension repo (gemini-extension.json with `settings` envVar sensitive for keychain prompt). Skip Docker catalog, Smithery; Cursor/Cline listings are optional and need public repos plus review.

**OS notes:** config paths differ on Windows (`%AppData%\devin`); deeplinks require the target app to have registered its scheme (check installed first); `gemini` and `code` must be on PATH, otherwise fall back to file write.

**Gotchas:** secrets in deeplinks and plaintext JSON; Gemini `mcp add` defaults to project scope; Cursor deeplink config is the inner object only; Gemini CLI free-tier users moved to Antigravity (config unresearched); Windsurf docs contradict on paths, so detect which file exists; heart's browser-origin refusal does not affect these desktop clients.
