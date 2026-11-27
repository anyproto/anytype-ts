# Marketplaces and directories

**Question:** can Anytype be listed in ChatGPT's, Claude's, LM Studio's or Ollama's marketplace, so that users find it there and install it?

**Short answer:**

- **Discovery: partly.** Some directories can list a local app.
- **Setup: no.** No directory in these four ecosystems can both install a local-only server and hand it a per-user key. The Connect button in Anytype stays the setup path.
- **The two biggest directories need a hosted server.** Anthropic's connectors directory and OpenAI's plugin directory accept only remote servers on public HTTPS with OAuth (or no auth). A server on `127.0.0.1` can never qualify.

Sources and the full verification logs are in [research/](research/):
- [market-openai.md](research/market-openai.md)
- [market-anthropic.md](research/market-anthropic.md)
- [market-local-llm.md](research/market-local-llm.md)
- [market-registries.md](research/market-registries.md)

## Verdict per ecosystem

### OpenAI: ChatGPT and Codex

| Channel | What it lists | Can local Anytype be in it? | What to do |
|---|---|---|---|
| **Plugin Directory** (formerly the ChatGPT Apps directory; shared by ChatGPT and Codex) | remote MCP servers | **No.** Needs public HTTPS, and auth may only be none / OAuth / mixed: "ChatGPT can't present custom API keys". | Only with a hosted Anytype connector (strategic, see below) |
| **Desktop-only plugins** (same directory, local stdio servers) | plugins that launch a local process | **Only as an approved partner.** "Local MCP submissions are limited to approved partners": the org is allowlisted by an OpenAI contact, then identity verification and a clean install test. The docs say nothing about how a local plugin gets a per-user secret. | **Start a business conversation.** The engineering side would be small: a stdio plugin that runs the bundled proxy and reads the key Anytype wrote. |
| **Self-hosted Codex plugin marketplace** (`codex plugin marketplace add anyproto/<repo>`; also `codex://plugins/<name>?marketplacePath=<path>`) | plugins: skills, MCP definitions | **Yes**, no review. A plugin's HTTP server can't carry a static header (docs only cover OAuth fields), so it would carry the **skill** only | v2: publish the `anytype-api` skill this way. The key still comes from Anytype's Connect |
| Secure MCP Tunnels | private servers for an OpenAI Platform org | Technically yes. In practice it needs a Platform org and a tunnel client, which is too heavy for consumers | Skip |

### Anthropic: Claude

| Channel | What it lists | Can local Anytype be in it? | What to do |
|---|---|---|---|
| **Anthropic Directory: connectors** (claude.ai/directory) | remote MCP servers (HTTPS, port 443, OAuth or none) | **No.** Calls come from Anthropic's cloud | Only with a hosted connector |
| Directory: desktop extensions (`.mcpb`) | — | **Closed.** "The directory no longer accepts local MCP servers packaged as desktop extensions." Users can still install a `.mcpb` themselves, which is exactly what Anytype's Connect does | — |
| **Directory: plugin bundles** (GitHub repo) | plugins with skills, commands, MCP definitions (stdio allowed) | **Yes**, with conditions: a paid plan to submit, a public repo, an automated scan and human review. A plugin with a local stdio server loads in Claude Code and in Cowork on this computer, but is **ignored in Claude Desktop chat**. Pinned `npx` packages are always held for review. | v2: publish an **Anytype plugin** = the `anytype-api` skill + a `/anytype-connect` command that opens `anytype://ai/connect?app=claude-code` (Anytype mints the key). No npx, no key in the plugin. |
| **Self-hosted plugin marketplace** (`/plugin marketplace add anyproto/<repo>`; Claude Desktop ▸ Customize ▸ Plugins ▸ Add marketplace) | anything | **Yes**, no review | Same plugin as above, available before review |
| `claude-plugins-official` | Anthropic and partner plugins | partners only | Ask once the plugin exists |

### LM Studio

| Channel | Can local Anytype be in it? | What to do |
|---|---|---|
| LM Studio Hub (lmstudio.ai/hub) | No. It lists models, presets and plugins, with no MCP category | — |
| **"Add to LM Studio" link** (`lmstudio://add_mcp`, or the `lmstudio.ai/install-mcp` web page) | This *is* LM Studio's distribution channel, and it needs no submission | Anytype generates the link locally with the key inside (apps.md §1.7). Our README and developer portal still point to the web page with the old `npx` entry. **Update them**: the portal's button opens `anytype://ai/connect?app=lmstudio` |

### Ollama

| Channel | Can local Anytype be in it? | What to do |
|---|---|---|
| ollama.com/library | No: models only | — |
| `ollama launch` integrations | No: this lists agent apps (Claude Code, Codex, OpenCode, …), and Ollama itself has no MCP client | Anytype's Ollama card routes to those apps (README §5) |

### Cross-client registries (discovery inside VS Code, Copilot CLI, Devin Desktop, aggregators)

| Channel | State | What to do |
|---|---|---|
| **Official MCP Registry** (registry.modelcontextprotocol.io) → feeds the GitHub MCP Registry, the VS Code MCP gallery, Copilot CLI `/mcp` search and Devin Desktop's "Available" list | `io.github.anyproto/anytype-mcp` is listed but **stale at 1.0.7** (npm is at 2.0.3). A localhost URL can't be a listed "remote" (the validator rejects it) | **Now:** republish from anytype-mcp CI (`mcp-publisher` with GitHub OIDC), move `server.json` to the current schema (camelCase fields). In the description, say: "Connect from Anytype ▸ Settings ▸ AI apps". **With 3.0.0:** prefer a single secret `ANYTYPE_API_KEY` env var over JSON in `OPENAPI_MCP_HEADERS` |
| Cursor Marketplace (plugins) | open-source plugin, manual review; can't carry a per-user key | Later, discovery only |
| Cline MCP Marketplace / Kilo marketplace | catalog entries via issue/PR; no per-user key | Later, discovery only |
| Gemini CLI extension gallery / Antigravity plugins | repo topic, no submission | Optional |
| Goose extension directory, Kiro registry | stdio/npm-style entries | Optional |
| Docker MCP Catalog | container image; can't reach a host-loopback server without heart changes | Skip |
| Smithery | hosted layer shut down | Skip |

## What would unlock ChatGPT and Claude directory listings

Both main directories require a **remote, public HTTPS MCP server with OAuth**. For Anytype that means a hosted connector, something like `mcp.anytype.io`. It would:

- authenticate the Anytype user with OAuth, with a consent screen that has the same space picker as the desktop approval window;
- reach that user's data through a path Anytype controls: a relay to the user's running desktop app or a headless node, or server-side access to spaces the user chose to sync to it.

This changes Anytype's privacy and architecture model: content passes through a server to reach the AI vendor's cloud. It's the only way into ChatGPT web/mobile, Claude web/mobile and both main directories, so it's worth a separate decision. It doesn't block anything in this proposal.

## Recommended order

1. **Now, in anytype-mcp:** republish the registry entry and fix `server.json`. Update the README and developer-portal buttons to point to `anytype://ai/connect?app=…`.
2. **With the desktop release:** Connect in Anytype is the setup path for every app.
3. **v2:**
   - an Anytype plugin (skill + connect command) in a self-hosted Claude Code / Codex marketplace;
   - submit it to the Anthropic Directory as a plugin bundle;
   - open the OpenAI desktop-only partner conversation.
4. **Separate decision:** a hosted OAuth connector.
