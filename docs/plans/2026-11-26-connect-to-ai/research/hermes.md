# Hermes Agent card + anytype-hermes gateway (local and remote) - Anytype connection (RESEARCHED, not run)

Researched 2026-11-27. Nothing was installed or run; Hermes is not on this machine (`~/.hermes` and `~/.local/bin/hermes` absent). The local clone `/Users/roman/anytype/hermes-agent` is stale (origin/main 4fdfdf674, 2026-05-13), so everything below comes from upstream via `gh api` at main `28ef6e4e7` (2026-11-27), latest release **v0.23.4** (2026-11-24). Extends [agent-harnesses.md](agent-harnesses.md) (section 1) - only new or corrected facts are marked NEW.

Doc paths are `website/docs/...` in NousResearch/hermes-agent (abbrev. `HD:`). Raw URLs: `https://github.com/NousResearch/hermes-agent/blob/main/<path>`.

## 1. Hermes MCP client

### 1.1 Files and paths
- Data dir `HERMES_HOME`: `~/.hermes/` (macOS/Linux/WSL2/Termux), `%LOCALAPPDATA%\hermes\` (Windows native). Code is in `~/.hermes/hermes-agent/`, CLI wrapper at `~/.local/bin/hermes` (HD:getting-started/installation.md "Install layout" table). Desktop bundle writes the same layout ("the same layout a CLI install uses", HD:user-guide/desktop.md ~line 639).
- Global config `$HERMES_HOME/config.yaml`; secrets `$HERMES_HOME/.env` (HD:user-guide/profiles.md:302-303). `hermes config path` and `hermes config env-path` print them (HD:reference/cli-commands.md ~1415) - read-only, safe for detection.
- Profiles: `~/.hermes/profiles/<name>/` with its own `config.yaml`, `.env`, skills, sessions (profiles.md:11, 271-278). `hermes -p <name> ...` selects one; sticky default via `hermes profile use <name>` (cli-commands.md:28, 2117). A profile alias is created at `~/.local/bin/<name>`. One gateway serves all profiles unless a profile sets `gateway.standalone: true` (desktop.md ~639).
- Windows: native install exists (`install.ps1`, `%LOCALAPPDATA%\hermes\bin\`), desktop MSIX needs Windows 11 22H2+. The anytype-hermes plugin says the complete Windows path "has not been validated" and CLI native service automation is macOS/Linux only (INSTALL.md last line; SETUP_REFERENCE.md "Native CLI setup").

### 1.2 `mcp_servers` schema (HD:reference/mcp-config-reference.md)
- Remote Streamable HTTP is supported: `url` + `headers` map (static values OK). Default transport for `url` is Streamable HTTP; `transport: sse` opts into SSE. Other keys: `enabled`, `timeout` (300), `connect_timeout` (60), `tools: {include, exclude, resources, prompts}`, `trust: full|untrusted`, `lazy`, `keepalive_interval`, `auth: oauth`, `ssl_verify`, `client_cert`, `protocol`.
- `auth` unset means no OAuth: a static `Authorization` header is just sent. Matches the Anytype no-OAuth design.
- Env expansion: `${VAR}` and `${env:VAR}` in any string (`url`, `headers`, `args`, `env`). Resolved from the active profile's secret scope (= that profile's `.env`) then process env. In a remote `url`/`headers` an unset variable fails closed with a named error rather than sending the literal (mcp-config-reference.md "Environment variable references"). So a header `Bearer ${MCP_ANYTYPE_API_KEY}` plus the key in `.env` is the supported pattern.
- Tool names become `mcp__anytype__<tool>` (server name sanitized to `[A-Za-z0-9_]`).
- Hermes rewrites config.yaml itself (`_save_mcp_server`), so comments are not guaranteed to survive Hermes' own writes; Anytype should use a comment-preserving YAML edit and keep a backup.

### 1.3 CLI to add a server
- `hermes mcp add <name> [--url URL] [--command CMD] [--auth oauth|header] [--preset X] [--connect-timeout S] [--env K=V] [--args ...]` (cli-commands.md:1686ff; `hermes_cli/mcp_config.py:638 cmd_mcp_add`). Also `list`, `test <name>`, `remove`, `configure`, `login`.
- No `--header`/`--token` flag. For `--url` it asks "Does this server require authentication?" then a masked prompt "API key / Bearer token"; it stores the token in `.env` as `MCP_<NAME>_API_KEY` (name upper-cased, non `[A-Za-z0-9_]` to `_`) and writes `headers: {Authorization: "Bearer ${MCP_<NAME>_API_KEY}"}` (mcp_config.py:305-342, 576-587). It also probes the server and asks which tools to enable. So it is interactive and not scriptable; fine for a "copy this command" fallback, not for Anytype to run.
- `hermes mcp test anytype` (read-only probe) is a good verify step to show the user.
- NEW: Hermes Desktop registers `hermes://mcp/install?name=NAME&config=BASE64URL(JSON)`; shows a confirm dialog with the full config; never overwrites an existing name; the decoded config is saved verbatim (so a literal token would land in config.yaml and also be displayed in the dialog and sit in the URL/shell history) (mcp-config-reference.md "Add to Hermes link"; `apps/desktop/src/lib/mcp-deeplink.ts`, `.../mcp-install-deeplink-dialog.tsx`). The parser has existed since 2026-08-16. It cannot write `.env`.

### 1.4 Reload
- Interactive CLI/TUI session: `/reload-mcp`, or `/new`, or restart `hermes` (mcp.md "Reloading", line ~779-790).
- Running gateway (`hermes gateway run`/service): watches config.yaml; a newly added entry is connected within about a minute, no restart (mcp.md:789). A failed first connect retries on a 30 s doubling cooldown up to 10 min. Hermes Desktop uses the gateway, so the same applies; verify in practice (see risks).
- Writing config.yaml while a session is open triggers the CLI auto-reload with a 30 s timeout (only a problem for OAuth, mcp.md:424).

## 2. Skills
- Supported (agentskills.io compatible). Primary dir `~/.hermes/skills/` (per profile); extra dirs via `skills.external_dirs` in config.yaml; project dirs after `hermes skills trust` (HD:user-guide/features/skills.md:9-12, 411-427).
- Install from URL is documented: `hermes skills install https://example.com/SKILL.md [--name X]` (cli-commands.md:1498-1516). A `SKILL.md` can declare `required_environment_variables`; declared vars are auto-passed to the terminal/`execute_code` sandboxes, and `terminal.env_passthrough` handles other vars (skills.md:300-316).
- Could `https://developers.anytype.io/skill.md` replace MCP? Technically installable (`hermes skills install https://developers.anytype.io/skill.md`; fetched today: name `anytype-api`, hardcodes `http://127.0.0.1:31009`, says "Every call sends Authorization: Bearer <key>", no env var name declared). Drawbacks for Hermes: the key would have to be exposed to the shell via `terminal.env_passthrough` or an edited skill (the model sees and echoes it more easily than an MCP header), the port is hardcoded, tools are less structured, and Hermes has no sandbox on by default. Recommendation: MCP is the primary route for Hermes; the skill is an optional "also teach it the raw API" extra, not needed. Same conclusion as api-skill-route.md.

## 3. Detection (macOS/Linux)
| Probe | Value | Source |
|---|---|---|
| CLI binary | `~/.local/bin/hermes` (wrapper), also on PATH. Probe via PATH plus that dir (a GUI-launched Electron has a short PATH) | installation.md layout table |
| Data dir / config | `~/.hermes/config.yaml` (default profile); `$HERMES_HOME` overrides; `~/.hermes/profiles/*/config.yaml` | installation.md, profiles.md |
| Version | `hermes --version` (cli-commands.md:114); `hermes-agent --version` also exists | |
| Desktop app macOS | `Hermes Agent.app` (bundled variant, what the DMG ships; installation.md "Desktop packages") or `Hermes.app` (full variant). appId pattern `com.nousresearch.<kebab>` -> `com.nousresearch.hermes-bundled`, `com.nousresearch.hermes`, `com.nousresearch.hermes-light` (`apps/desktop/product-identity.cjs:12-21,76`; docs reference `com.nousresearch.hermes` for tccutil). Needs macOS 13+ Apple Silicon | desktop.md, source |
| URL scheme | `hermes://` registered by the desktop app only (`electron-builder.config.cjs:78-81`); `hermes://launch` just opens the app | desktop.md:457 |
| Windows | `%LOCALAPPDATA%\hermes\` and `...\bin\`; MSIX identity per agent-harnesses.md | installation.md |
| Linux desktop | no bundle; `hermes desktop` from a source install; entry `~/.local/share/applications/hermes.desktop` after first launch | desktop.md:27, 616 |
- NEW: the full-variant macOS app path (`/Applications/Hermes.app`) and bundle ids were derived from source, not from an installed app. UNVERIFIED on a real install.
- The desktop bundle may ship a private Python runtime and no `hermes` on PATH ("Packaged launchers"); treat the data dir with a `config.yaml` as "Hermes is set up" even without a binary.

## 4. anytype-hermes gateway (https://github.com/anyproto/anytype-hermes)
State: repo is public (`private:false`; README and INSTALL still say "private" - stale). `plugin.yaml`: `anytype-platform` **0.7.0**, last push 2026-11-26. docs/VALIDATION.md certifies 0.6.0 against one pinned stock Hermes commit and says main/v0.23.x are not certified without separate checks. Requires macOS/Linux, Git, a Hermes with a configured model, API v2 chat+search streams.

### 4.1 What the user needs
- A **separate bot account** (not the human one) with **editor or higher** in each selected space; the human account must be in the same space(s) and is the allowed sender. "The gateway ignores its own account's messages" (README, SETUP.md).
- Three modes (INSTALL.md table, SETUP.md):
  - **CLI**: Anytype CLI v0.5.0+ as a background service; the wizard can create the bot, install the service, join a space and wire HTTP MCP. Works headless. Recommended.
  - **Desktop**: bot account signed in to the desktop app, Settings > Local API enabled, read/write key created by hand, bot invited. Default API `http://127.0.0.1:31009`.
  - **External**: any reachable API address plus key.
- Why Desktop mode is impractical for Anytype's own users: the Desktop API key belongs to the account the app is signed in to, which is the user's human account. The gateway would act as the human and ignore the human's own mentions; a second signed-in account is impossible in one Desktop instance. The CLI instance is separate and can run side by side (CLI ports 31010-31012 vs desktop 31007-31009, anytype-cli README "Network Configuration"), so even on one laptop the CLI mode is the right one. NEW: the bot's chats, MCP and key stay separate from the human's data, as anytype-cli README line 32 says ("only has access to spaces it explicitly joins").

### 4.2 Exact commands (INSTALL.md, README)
```sh
# 1. Hermes (skip if installed). Official one-liner; anytype-hermes pins a commit for tested stock, see risks
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup                                   # model/provider; keep the gateway stopped
# 2. Anytype CLI (headless; macOS launchd / Linux systemd user service)
curl -fsSL https://raw.githubusercontent.com/anyproto/anytype-cli/HEAD/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"
anytype version && anytype capabilities --json     # expects state: ready, embedded_http_mcp
# 3. Plugin (scanner prints CAUTION and asks for source review; --enable does not skip it)
hermes plugins install anyproto/anytype-hermes --enable
# 4. Wizard
cat > anytype-setup.json <<'JSON'
{"schema_version": 1, "cli": {"credential_backend": "private_file"}}
JSON
hermes anytype setup --mode cli --input anytype-setup.json
hermes anytype doctor --json
hermes gateway run        # foreground test; then: hermes gateway install && hermes gateway start
```
- Wizard answers for a fresh bot (INSTALL.md step 4 table): Native service `install`; Native account `create`; display name e.g. `Hermes`; network `default`; Join a space `yes` + invitation link; Discovery `all`; Sender access `operator` and pick the human account from the member list; Home chat `create`; MCP `http`; Publication `save_stopped`; Gateway coordination `already_stopped`. If the invite needs approval, approve it in Anytype, then `hermes anytype setup --resume`.
- Named profile (recommended when the same Hermes also has a personal MCP entry): `hermes profile create anytype --no-alias`, `hermes -p anytype setup`, `hermes -p anytype plugins install anyproto/anytype-hermes --enable`, `hermes -p anytype anytype setup --mode cli --input anytype-setup.json`.
- NEW: `anytype-cli` `install.sh` always resolves `releases/latest` regardless of which tag the script was fetched from, so it installs **v0.5.4** (2026-11-17) today, to `~/.local/bin/anytype` plus an `any` symlink. anytype-hermes was validated on 0.5.0. v0.5.1-0.5.4 only changed docs, invite-link help, a prefer-tcp setting and Heart 0.51.9 (GitHub releases).
- CLI facts: JSON API `http://127.0.0.1:31012`; built-in Streamable HTTP MCP at `/mcp/full` (also `/mcp/small`, `/mcp/large`) on the same origin, bearer is the same API key (`core/automation/types.go`, `engine.go`, `docs/AUTOMATION.md`). Default bind is loopback only; `anytype space join "<invite-link>"`.

### 4.3 Agent-assisted prompt (verbatim from the README)
```text
Help me install and set up https://github.com/anyproto/anytype-hermes.
Read docs/INSTALL.md and follow its agent-assisted setup instructions.
Use my current Hermes profile unless I choose another. Guide me through
the Anytype client, bot account/name, space invitation and sender access.
Preserve existing settings, follow installer review prompts, and keep
credentials out of chat and logs. Verify the saved connection with doctor
and guide me through a real mention test.
```
INSTALL.md "Agent-assisted setup": if the agent runs inside the profile being configured, choose Publication `defer`, close the agent, then run `hermes anytype setup --resume` from a separate terminal; do not confirm exclusive access while that agent is still using the profile.

### 4.4 Invitation: what Anytype Desktop can do
- The wizard asks for an invitation link to join a space; if the invite needs approval, the human approves from their account.
- Desktop already generates links (`C.SpaceInviteGenerate(spaceId, inviteType, permissions, shareWithinSpace)`, `src/ts/lib/api/command.ts:1862`; `U.Space.getInviteLink(cid, key)` in `src/ts/lib/util/space.ts:770`; invite types `WithApprove`, `Guest`, `WithoutApprove`; permissions `Reader`, `Writer`, `Admin`). Only the space **owner** can create or see the link (`U.Space.canManageInvite`, space.ts ~815).
- Proposal: a "Create invitation for Hermes" action inside the card: pick a space the user owns, reuse the current invite if there is one (`U.Space.getInvite`), otherwise generate with `WithApprove` (approval needed, safest), show the copyable link and the next steps, and when the join request arrives point to Members to approve and set the role to Editor. The bot should end up Editor, not Reader. `WithoutApprove`+`Writer` is easier but lets anyone holding the link in as an editor; offer it only behind an explicit confirm and tell the user to revoke afterwards. UNVERIFIED: whether regenerating with a different type replaces the space's single existing invite (the code comment says the same type republishes the same link), so a different type would break links already handed out.
- Optional: embed the link in the copyable agent prompt (see 5c) as "Invitation link: ...". It is a shared secret; show a warning.

## 5. Design proposal: the Hermes card

One card, "Hermes", three sections. Section A is the product feature (MCP into the user's own account). Sections B/C are optional and collapsed by default.

### 5a. Hermes on this machine: connect MCP (primary)
Tier default `large`, URL `http://127.0.0.1:<port>/mcp/<tier>` per the plan placeholders.
1. Mint a key (per architecture.md), choose the target profile (default `~/.hermes`, plus any `~/.hermes/profiles/<name>` if more than one).
2. Write `<HERMES_HOME>/.env`: `MCP_ANYTYPE_API_KEY=<KEY>` (append/replace that one line, keep mode 0600; never log).
3. Merge into `<HERMES_HOME>/config.yaml` (comment-preserving, backup first):
```yaml
mcp_servers:
  anytype:
    url: "http://127.0.0.1:<port>/mcp/<tier>"
    headers:
      Authorization: "Bearer ${MCP_ANYTYPE_API_KEY}"
```
- Use `MCP_ANYTYPE_API_KEY`, which is exactly what `hermes mcp add anytype` generates (mcp_config.py:305-342), not `ANYTYPE_API_KEY` as in apps.md:341. NEW: the anytype-hermes plugin reads `ANYTYPE_API_KEY` from the profile `.env` for the **bot's** key (`hermes.example.yaml`: `api_key_env: "ANYTYPE_API_KEY"`), so reusing that name would put the human key under the bot's variable name. Also keep the server named `anytype` only for the human entry in a profile without the gateway; see risk 3.
- No `command`, no Node; loopback is reachable because Hermes runs on the same machine. No `enabled`/`trust` needed; optional `trust: untrusted` makes Hermes ask before every write-capable Anytype tool (mcp-config-reference.md `trust`) - offer as a toggle "Ask before changing my objects", default off.
4. Reload: "Tell Hermes to reload: type `/reload-mcp` in your chat, or start a new session. If the Hermes gateway or app is running it picks the change up within about a minute." Verify with `hermes mcp test anytype` (copy button).
5. Remove: delete the `mcp_servers.anytype` block and the `MCP_ANYTYPE_API_KEY` line, revoke the key.
Alternatives, in order: (i) Hermes Desktop installed: a secondary button "Add via Hermes app" opening `hermes://mcp/install?name=anytype&config=<b64url({"url":...,"headers":{"Authorization":"Bearer ${MCP_ANYTYPE_API_KEY}"}})>` after Anytype has written `.env` (the dialog then shows only the placeholder, not the key; still a manual confirm, so keep it as a fallback, not the default); (ii) copyable `hermes mcp add anytype --url http://127.0.0.1:<port>/mcp/<tier>` and paste the key at the prompt, for users who prefer the Hermes CLI to do the write. Skill route: skip (section 2).

### 5b. "Chat with Hermes in Anytype" (optional, same machine)
Short explainer plus a checklist, not a Connect button: it needs a second account, an invite, a running gateway process. Same-machine path uses the CLI mode, with the commands in 4.2 and the "Create invitation" helper in 4.4. Show the "Copy setup prompt" button (4.3) and a link to https://github.com/anyproto/anytype-hermes. Recommend a dedicated Hermes profile (`hermes profile create anytype`) so the bot's agent is not given the user's personal MCP entry: the plugin docs state allowlists do not isolate MCP tools or memory from other chat participants (README "Chats and spaces").

### 5c. Hermes on another machine (server)
The user's local MCP cannot be reached from a server (loopback only), and exposing it would be wrong. Offer the headless path instead: a bot account on the server through the Anytype CLI. Copy blocks:
1. "On the server, install Anytype CLI and Hermes plugin" - the 4.2 script (steps 1-4), with step 1 and `hermes setup` shown as "skip if installed". On a Linux server with no keyring the JSON file (`private_file`) is required.
2. "Then invite the bot" - Create invitation (4.4); the wizard prompts for the link; user approves and gives Editor access.
3. "Or let an agent do it" - the 4.3 prompt, with an optional appended line `Invitation link: <link>` when the user created one.
4. Verify: `hermes anytype doctor --json`, then mention the bot from the human account in a chat using the account picker (typing the name as text does not trigger).
Nothing is written locally and no key leaves this machine in this path. Do not offer an SSH reverse tunnel of the user's desktop API (exposes the human account to the server).

### 5d. UI texts (short, plain)
- Card title: Hermes. Subtitle: "Agent by Nous Research".
- Not installed: "Hermes isn't on this computer. Install it to let it use your Anytype, or set it up on a server." Buttons: "Get Hermes" (link to https://hermes-agent.nousresearch.com/), "Hermes is on another machine".
- Installed, not connected: "Let Hermes search and edit your Anytype objects." Button "Connect". Note under it: "Anytype adds a connection to your Hermes settings. Hermes can then read and change what you allow."
- Connected: "Connected to profile <name>. In a running Hermes chat type /reload-mcp, or start a new chat." Actions: "Copy test command" (`hermes mcp test anytype`), "Disconnect".
- Needs refresh (port or key changed): "The connection is out of date." Button "Repair".
- Profile picker: "Hermes profile" with the default pre-selected.
- Section B title: "Chat with Hermes inside Anytype". Body: "Mention Hermes in a chat and it answers there. It uses its own Anytype account, so it only sees spaces you invite it to." Button "Show setup steps". Tag "Advanced".
- Invite: "Create invitation" / "Copy link" / "After Hermes asks to join, open Members, approve it and make it an Editor."
- Section C: "Hermes runs on another computer?" Body: "Run these commands on that computer. It gets its own Anytype account, so your account stays private." Buttons "Copy commands", "Copy prompt for an AI agent". Warning near the invite link: "Anyone with this link can ask to join this space."
- Errors: "Couldn't update Hermes settings. Nothing was changed." / "Hermes config looks unusual. Open it in your editor?" (reveal file).

### 5e. Detection rules
- `installed` = any of: `hermes` resolved on PATH or at `~/.local/bin/hermes`; `<HERMES_HOME>/config.yaml` exists; an app bundle with id `com.nousresearch.hermes`, `...hermes-bundled` or `...hermes-light` (macOS: `/Applications/Hermes Agent.app`, `/Applications/Hermes.app`, via LaunchServices / `mdfind`); Windows `%LOCALAPPDATA%\hermes\`. Show version only if the binary is found (`hermes --version`, timeout 3 s).
- `not installed` = none of the above; the card still offers "Hermes is on another machine" (section C) and the gateway section, because the remote host is not detectable.
- `connected` = config.yaml has `mcp_servers.anytype` whose `url` matches the live port and tier, and our own record says we wrote the key (do not read `.env` values; compare a hash we stored). A different entry named `anytype` (stdio or other URL) = "Another Anytype connection exists. Replace it?" - never overwrite silently (also true for the stdio example in anytype-hermes `hermes-mcp.example.yaml`).
- Profiles: default `~/.hermes`; list directories under `~/.hermes/profiles/` that contain `config.yaml`; honor `HERMES_HOME` only if the app process has it (GUI apps usually do not).
- Hermes Desktop connected to a **remote** backend keeps its config on the server (HD:user-guide/desktop.md "Connecting to a remote backend"); local `~/.hermes` can then be unused. Cannot be detected; mention it in help text.

### 5f. Risks and unverified items
1. Local clone stale; all upstream facts read from `main` via `gh api` on 2026-11-27 (v0.23.4). Docs and code move quickly (main changed within the day).
2. UNVERIFIED on a real install: macOS app name and bundle id of the full variant, desktop bundle's `HERMES_HOME` on macOS, whether the bundle puts `hermes` on PATH, Hermes' file mode for `.env`, whether the gateway watcher re-resolves `${MCP_ANYTYPE_API_KEY}` after only `.env` changes (ordering: write `.env` first, then config.yaml), `hermes mcp test` exit behavior.
3. Name clash with the gateway: anytype-hermes' wizard owns the logical MCP name `anytype` and demands that MCP match the bot's account and grant (SETUP_REFERENCE.md "MCP"); it will offer `replace`/`keep`/`remove`. A human-account entry named `anytype` in the same profile conflicts. Mitigation: gateway in its own profile (5b), or, if the user wants both in one profile, write the human entry as `anytype_me` and warn. Also `ANYTYPE_API_KEY` is the bot's variable name (4.4/5a).
4. Security: Hermes has no sandbox by default and its agent can run shell commands; an Anytype key with `large`/`full` tiers gives it read/write on the whole account. Allowlists in the gateway do not limit MCP tools for invited participants (README). Offer `trust: untrusted` and a read-only key option if the key model supports it.
5. Config writes: YAML comment preservation, Hermes rewriting the same file, symlinked/readonly config (profiles.md:175 mentions symlinked config), concurrent writes by a running Hermes. Back up, write atomically, re-read before write.
6. The deeplink saves the literal config; with a `${VAR}` placeholder the secret never enters the URL. Never put the real key in a `hermes://` URL.
7. anytype-hermes maturity: 0.7.0 pushed yesterday, validated for 0.6.0 on a pinned Hermes commit (`ec3249919a...`, INSTALL.md step 1), not certified against v0.23.x or CLI v0.5.4; the plugin scanner reports CAUTION and requires review; not in the Hermes plugin catalog (agent-harnesses.md 1.7). Its docs still call the repo private, and the wizard needs Heart with API v2 chat/search streams. Label the section "Advanced" and link to the repo docs rather than reimplement the wizard. Confirm with the plugin owners which Hermes version to recommend and whether a one-line install command exists.
8. Anytype CLI `install.sh` pipes a script from raw.githubusercontent via bash; the plugin docs recommend downloading to a file first (`-o /tmp/...`), then `bash` it. Prefer that form in the copyable block if we want reviewability; the 4.2 block above shows the short form for readability.
9. Desktop invite details (single link per space, owner-only, replacement semantics) are inferred from `src/ts` and not exercised.
10. Remote path: server needs Git, curl, tar; Windows servers unsupported for the CLI service path; internet access to GitHub; the CLI's listening address stays loopback unless the user changes it (do not advise `--listen-address 0.0.0.0`).
11. The `hermes://mcp/install` handler is only in the desktop build with that code (since Aug 2026); an older app silently ignores or fails. UNVERIFIED which minimum desktop version.

## Verification log
| Claim | Status | Source |
|---|---|---|
| `mcp_servers.<n>.url` + `headers`, `${VAR}`/`${env:VAR}` resolved from profile `.env`, fail closed when unset in url/headers | CONFIRMED | HD:reference/mcp-config-reference.md |
| `hermes mcp add` has no header flag; stores token as `MCP_<NAME>_API_KEY` in `.env` and `Bearer ${...}` in config | CONFIRMED | `hermes_cli/mcp_config.py:305-342, 576-587`; cli-commands.md:1686 |
| Reload: `/reload-mcp`; running gateway auto-connects new entries within about a minute | CONFIRMED in docs, UNTESTED live | mcp.md ~779-790 |
| Config at `~/.hermes/config.yaml`, `.env`, profiles at `~/.hermes/profiles/<name>/`, `-p` | CONFIRMED | profiles.md, installation.md |
| Windows native `%LOCALAPPDATA%\hermes\` | CONFIRMED (docs) | installation.md layout table |
| `hermes://mcp/install` deeplink, verbatim save, confirm dialog | CONFIRMED | mcp-config-reference.md, apps/desktop sources |
| macOS app name `Hermes Agent.app`; bundle ids | DOCS + SOURCE (derived), not seen on an install | installation.md; `product-identity.cjs` |
| `hermes skills install <https URL>/SKILL.md` | CONFIRMED in docs | cli-commands.md:1498 |
| anytype-hermes plugin 0.7.0, repo public, wizard modes, commands, prompt | CONFIRMED | gh api anyproto/anytype-hermes (README, docs/INSTALL.md, SETUP.md, SETUP_REFERENCE.md, plugin.yaml, hermes.example.yaml) |
| anytype-cli v0.5.0 baseline, latest v0.5.4, install.sh uses releases/latest, `~/.local/bin/anytype`, API 31012, MCP `/mcp/full` | CONFIRMED | gh api anyproto/anytype-cli (README, install.sh, releases, `core/automation`) |
| Desktop can generate invite links; owner-only | CONFIRMED in code | `src/ts/lib/api/command.ts:1862`, `src/ts/lib/util/space.ts:770-815` |
| Replacement semantics of regenerating an invite with another type | UNVERIFIED | |
