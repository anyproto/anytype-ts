# Gap 5: auth/origin compatibility + uncovered apps (researched 2026-11-27)

No live end-to-end test was possible: Anytype heart not running on 127.0.0.1:31009 on this machine (curl returned nothing), no key. Everything below is doc/issue-derived; "unconfirmed" = no primary evidence.

## Origin check
- MCP spec (2025-11-25 transports): server MUST validate Origin; present+invalid -> 403. Non-browser clients send NO Origin (ref TS/Python SDKs send none) - https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Only found client that sent a wrong Origin: ruby_llm-mcp (fixed, PR #154). Not in our list. No reports of Claude Code/Codex/Cursor/VS Code/LM Studio/Cline/Gemini CLI/Open WebUI failing on Origin: searched, none found (absence of evidence, not a test).
- Risk spots: (a) Electron-renderer-based clients (LM Studio, Cursor?) if MCP client runs in a renderer -> would send Origin; unconfirmed, must live-test. (b) IPv6 literal [::1] origin bug class (agentmemoir/clio #19) - tell users 127.0.0.1 only. (c) Open WebUI calls MCP from its server process (not browser) - fine; but Docker Open WebUI needs host.docker.internal (and Anytype binds loopback only -> unreachable from container; unconfirmed whether heart bind can be widened).

## 401 -> OAuth discovery
- Claude Code: if Authorization header configured, no OAuth fallback (docs; issue claude-code#82534). Cursor: skips OAuth when Authorization header present (forum). Zed: OAuth only when no Authorization header (docs). Codex: bearer_token_env_var / http_headers; OAuth only via `codex mcp login` (developers.openai.com/codex/mcp). Gemini CLI: auto-OAuth on 401 (earlier raw report). Open WebUI: auth type None/Bearer/OAuth2.1 selectable; empty Bearer key is rejected.
- Conclusion: always ship header on first request; with a valid key no client should hit 401. Wrong/revoked key -> 401 w/o WWW-Authenticate -> clients show error or try failed OAuth discovery; recommend Anytype return a clear 401 body. Antigravity: OAuth order manual -> CIMD -> DCR, only when no header (assumed; unconfirmed).

## Protocol revision
- Latest spec 2026-07-28 (stateless, no initialize). Claude Code/Desktop reportedly send header 2025-11-25 (claudeissues #93290); Cursor forum 172536: client can't talk to modern-ONLY servers -> i.e. clients are still legacy-initialize; our 2025-06-18/2025-11-25 server is the compatible side. Claude Code #17319: failed against a server that only knew 2025-06-18 w/ older client sending other version - ensure Anytype negotiates down per spec (return its supported version in initialize result, don't 400). Unconfirmed: any client already defaulting to 2026-07-28 first; track.

## Antigravity CLI (coverage hole - CONFIRMED real)
- Gemini CLI consumer cutover 2026-06-18 (announced 2026-05-19); enterprise/API-key still work. https://github.com/google-gemini/gemini-cli/discussions/27274 . This machine still has gemini 0.32.1.
- Antigravity docs https://antigravity.google/docs/mcp (fetched 2026-11-27): global config ~/.gemini/config/mcp_config.json ; workspace <ws>/.agents/mcp_config.json ; remote = Streamable HTTP only, key `serverUrl` (`url` also ok; `httpUrl` and SSE NOT supported), `headers` object for Authorization. Reload via `/mcp` manager overlay. No documented `mcp add` command (third-party claims `agy mcp add`: unconfirmed). No generic MCP-install deeplink (only antigravity://customizations/marketplaces/... for plugins). OAuth tokens ~/.gemini/antigravity/mcp_oauth_tokens.json. Binary `agy` (not installed here). => Route: Anytype writes the JSON entry (merge) with serverUrl+headers. Distinct from Gemini CLI (`httpUrl`, ~/.gemini/settings.json) - need both routes.

## Other apps
- Claude.ai web/mobile: custom connectors now have a "Request headers" section for fixed credentials (support.claude.com/en/articles/11175166; older issues anthropics/claude-ai-mcp #112/#693 said OAuth-only). But claude.ai fetches from Anthropic cloud, so a public tunnel URL is required (loopback unreachable) -> exposing a user's notes + key to internet; NOT recommended for v1. Mobile uses the same account-level connectors (unconfirmed plan limits).
- Microsoft Copilot Studio: cloud; localhost unreachable, needs dev tunnel; Streamable HTTP only (SSE dropped Aug 2025). Skip. (GitHub Copilot in VS Code is covered by VS Code route.)
- Perplexity: Mac app supports custom REMOTE connectors (Plugins -> Add custom -> Connector, help center article 11502712); no local command MCP in Mac app per that article; localhost reachability unaddressed (unconfirmed); third parties say local connector via PerplexityXPC helper (unconfirmed). Comet: no custom connectors (third-party, June 2026). Skip/low priority.
- Mistral Le Chat (renamed Vibe 2026-08-12 per one source): custom MCP connectors on all plans, hosted -> cloud-reachable URL only. Skip.
- Zed: remote servers `context_servers.NAME {url, headers}` in settings.json; header present => no OAuth. Supported via file edit (docs). Warp: auto-discovers ~/.claude.json, .mcp.json, .codex/config.toml, so configuring Claude Code/Codex covers Warp (docs.warp.dev, unverified detail).
- Cline: cline_mcp_settings.json, type MUST be "streamableHttp" (camelCase) else falls back SSE/stdio; headers supported (third-party guides, no official doc fetched). CLI stores ~/.cline/mcp.json (unconfirmed).
- LM Studio: mcp.json with {url, headers} (docs lmstudio.ai/docs/app/mcp); Streamable HTTP vs SSE for remote disputed in sources - live test required; "Add to LM Studio" deeplink exists but format not retrievable here (earlier raw report may have it).
- Open WebUI: native MCP = Streamable HTTP only, v0.6.31+, Admin External Tools, Bearer supported; server-side call so Docker networking caveat.

## Recommendations
1. Add Antigravity CLI/IDE as its own target (serverUrl+headers into ~/.gemini/config/mcp_config.json), keep Gemini CLI as legacy.
2. Before release run a smoke matrix against real heart: initialize w/ each client (Claude Code, Codex, Cursor, VS Code, LM Studio, Antigravity, Cline, Open WebUI) and with curl: no-Origin OK, Origin http://localhost:3000 -> 403, protocolVersion 2026-07-28 request -> returns 2025-11-25 (not error), no/invalid key -> 401 JSON body.
3. Cloud apps (Claude.ai, ChatGPT, Copilot Studio, Le Chat, Perplexity web) = out of v1 (need public tunnel).
