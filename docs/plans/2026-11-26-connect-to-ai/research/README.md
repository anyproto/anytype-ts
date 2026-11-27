# Research reports (2026-11-26)

These reports were produced by a multi-agent research sweep for the [Connect to AI proposal](../README.md). It was documentation and source research only: no app was tested hands-on. Home-directory paths are redacted to `~`.

| Kind | How it was made | Files |
|---|---|---|
| App reports, verified | one researcher, then a skeptical verifier who re-checked each critical claim against live sources. See each file's **Verification log** (CONFIRMED / CORRECTED / UNCONFIRMED) | `claude-desktop.md`, `claude-code.md`, `chatgpt-app.md`, `codex.md`, `cursor.md`, `vscode-copilot.md`, `ide-others.md` (Zed, Devin Desktop/Windsurf, JetBrains), `cli-agents.md` (Gemini CLI, OpenCode, Goose, Amp, Kiro, Warp, Pi, Droid), `vscode-agent-ext.md` (Cline, Kilo, Roo), `lmstudio.md`, `ollama.md` (+ Open WebUI), `local-chat-apps.md` (Jan, AnythingLLM, Msty, Raycast, Perplexity, BoltAI), `agent-harnesses.md` (Hermes, OpenClaw) |
| Marketplace reports, verified | same | `market-openai.md`, `market-anthropic.md`, `market-local-llm.md`, `market-registries.md` |
| API v2 + skill route, self-verified | one agent with its own verification pass | `api-skill-route.md` |
| Technical topics, research only (not separately verified) | one researcher | `tech-auth-loopback.md` (OAuth vs static keys, secrets in links and files), `tech-zero-config-precedents.md` (JetBrains, Docker, Figma, Obsidian, Raycast, Unity, Joplin, Zotero) |
| Follow-ups on gaps a completeness critic found | one researcher per gap | `followup-chatgpt-chat-mode.md`, `followup-claude-desktop-mcpb.md`, `followup-deeplink-headers.md`, `followup-config-reload.md`, `followup-auth-origin-coverage.md` |

Where reports disagree, the proposal follows the later and narrower source:

- the verifier over the researcher;
- a follow-up over the original report.

Examples:

- **LM Studio:** the deeplink is primary, because the documented `mcp.json` path doesn't match real installs.
- **Gemini CLI:** retired for consumer accounts. Antigravity is its own target.
- **Cursor:** a file merge plus a restart. Its deeplink's handling of headers is unconfirmed.
