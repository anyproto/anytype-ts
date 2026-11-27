# Caller binding in heart: addendum to the `anytype-mcp` plan

Rev 2, 2026-11-27. Design only; no code. It adds to `anytype-mcp-plan.md` (rev 4 + §13) and doesn't replace it.

Rev 2 folds in Roma's answers (B1–B5) and the Codex review (3 lenses, 33 findings; §11). The design is narrower than rev 1.

Sources: heart `origin/develop` @ `02c2237af` (`core/api/server`, `core/wallet/applink.go`, `core/application/sessions.go`, `util/grpcprocess`, `pb/protos`), this worktree's adapters, the plan above.

> **Status (2026-11-27):** rev 2, parked until the `anytype-mcp` phases are done; a capped Codex review runs right before implementation. Roma's answers: B1–B5 as in §11; **C1** Claude Desktop is "Limited to this app" on macOS only (forwarder accepts only a hardened, verified Claude parent), "Needs the Anytype connector" on Windows and Linux; **C2** on Linux the running Anytype installs its own forwarder as the stable copy (folded into `anytype-mcp-plan.md` §4.2).

## 0. What this is, and what it isn't

**Purpose.** Caller binding is a **filter against replay of a copied key from another program**. heart looks up which program opened a loopback connection and refuses a bound key from the wrong one.

**It is not** a guarantee that a copied key is useless, and it does not isolate apps of the same user from each other in general:

- The lookup is **per connection, at lookup time**. heart doesn't know who writes each later request on that connection.
- On a forwarder route heart identifies `anytype-mcp`, not the AI app. Any program of the same user can start the forwarder.

**Decisions this builds on (Roma)**

| | Decision |
|---|---|
| — | No keychain on any OS. One `0600` key file per connection, read by the forwarder |
| — | Only keys made by the AI apps Connect flow are bound. Keys the user makes (Local API page, pairing `/v2/auth/challenges`, "Copy prompt", scripts) stay unbound |
| B1 | CLI clients on URL + header stay unbound in the first release and move to the forwarder next. The Claude Code skill route (`curl`) can never be bound |
| B2 | Editors are bound to their vendor if they pass the hardening check; extensions inside them are an accepted residual |
| B3 | Codex's shared `config.toml` entry runs the forwarder for both the ChatGPT app and the CLI |
| B4 | The inherited-socket gap is accepted for now |
| B5 | Superseded by rev 2: Linux binds by the running executable's digest only (§3.2), so there are no path rules |

**Three levels the product names, before a key is minted and in Manage**

| Label | Meaning | First release |
|---|---|---|
| **Limited to this app** | heart verified the app itself | Claude Desktop on macOS (§4.2), if it qualifies |
| **Needs the Anytype connector** | heart verified the forwarder; any program of this user can start it | Claude Desktop elsewhere, "Other app" Command |
| **Usable by any app that has the key** | unbound | URL + header routes, the Claude Code skill, "Other app" URL and key |

## 1. Binding data and API

### 1.1 Model

```proto
// model.Account.Auth
message AppBinding {
  uint32 version = 1;
  repeated Caller callers = 2;      // at least one; any one may match
  message Caller {
    string os = 1;                  // "darwin" | "windows" | "linux"
    oneof kind {
      MacCode  mac    = 2;          // teamId + identifier, both required
      WinCode  win    = 3;          // Authenticode subject + the signed OriginalFilename, both required
      ExeHash  digest = 4;          // sha256 of the running executable (Linux; unsigned dev builds on any OS)
    }
    MacCode launchedBy = 10;        // optional, macOS only (§4.2): an ancestor that must be this app, hardened
  }
}
```

- **Present means bound.** A binding that is empty, malformed, of an unknown version, or has no caller for this OS **refuses every request**. It is never read as "unbound". heart validates it when written and when read.
- Rev 1's generic `root` and Linux path kinds are gone.

### 1.2 One new RPC

`AccountLocalLinkSetAppBinding(appHash, binding)` → the stored, normalized binding.

- **It changes only the binding.** The grant is read and re-written unchanged under the wallet lock. `UpdateApp` is not used for bindings: it clears the grant when the grant field is omitted (`commands.proto:1533-1537`, `core/application/sessions.go:435`).
- **Mint is `CreateApp`, then `SetAppBinding`, then deliver.** An older heart doesn't have the RPC, the call fails, and the desktop revokes the key and fails the Connect. A key is delivered only after the reply equals the binding that was asked for. Nothing depends on an older heart ignoring a new field.
- The key exists unbound between the two calls, only in the renderer's memory, covered by the mint intent (plan §2.9).
- On every binding change heart evicts the key's cached session **and ends the key's open streams** (the spaces and search streams keep running otherwise: `core/api/server/keywatch.go:60`, `core/api/v2/handler/search_stream.go:61`). Clients reconnect and are checked again.

### 1.3 Storage

- `AppLinkInfo` gains `Binding` in the sealed, signed payload (`core/wallet/applink.go:107-119`).
- A bound key is written with a new envelope version (`applink.go:337,452`), so an older heart refuses the file.

### 1.4 Who may change it

- **Any Full-scope gRPC session is the administrator.** That is the desktop, which holds the parent secret (`core/auth.go:172`). JSON-API-scope sessions and every HTTP route can't call the RPC. This is stated as it is; no extra "desktop capability" is added.
- **A bound key can't be exchanged for a session over external gRPC.** Today `WalletCreateSession(appKey)` is open to any caller (`sessions.go:47`). For a bound key only heart's own API server may make that exchange, after the caller check. The binding is never in an external reply.
- `whoami` may say `"bound": true`.

### 1.5 ListApps

Each `AppInfo` returns its binding and a usage block:

| Field | Meaning |
|---|---|
| `lastUsedAt`, `lastCaller` | last accepted caller (display name), recorded after authentication |
| `lastLaunchedBy` | the launching app's name when heart could establish it (macOS) |
| `lastRefusedAt`, `lastRefusedReason`, `lastRefusedCaller` | the last refusal; a file name or bundle id, never a path or arguments |

Calls heart makes inside itself and the desktop's own probe are not recorded as client use.

## 2. The check

- `http.Server.ConnContext` (server built at `core/api/service.go:265-268`) gives each connection a slot.
- `ensureAuthenticated` (`core/api/server/middleware.go:164-262`) serves `/v2` and `/mcp`. After the key resolves:
  - no binding → continue; nothing is looked up;
  - binding → the connection's peer is looked up **once** and cached on the connection. **Every request compares that cached peer with the binding of the key it carries**, so a changed binding or a second key on the same connection is handled.
- The peer must run as the same OS user as heart.
- Calls inside heart (`/mcp` tools calling `/v2` through the in-process transport, `core/api/server/mcp.go:222-229`) carry a marker tied to the outer request and its key.
- Non-loopback peers never match.
- Refusal: `401`, code `caller_not_allowed`, reason `mismatch`, `unidentified` or `unsupported`. `WWW-Authenticate` stays `invalid_token`.

## 3. Identifying the peer

### 3.1 What each OS can attest

"The program that held this socket when heart looked." Nothing more is claimed.

| OS | Socket → process | Process → identity |
|---|---|---|
| macOS | libproc: find the pid whose fd has the reversed 4-tuple; take that pid's audit token; **read the pid's fds again and confirm it still holds the tuple** | `SecCodeCopyGuestWithAttributes` by audit token → `SecCodeCheckValidity` against the requirement (Apple anchor, Team ID, identifier). For `launchedBy`: also hardened runtime on, and no `allow-dyld-environment-variables`, `disable-library-validation`, `get-task-allow` |
| Windows | `GetExtendedTcpTable` (owner pid and creation time) → pid; hold a process handle; the process must be older than the connection | The image is found through the process's **mapped image** (`GetMappedFileName`), not its path string, so a renamed-and-replaced file doesn't match. Then `WinVerifyTrust`, the signer subject, and the `OriginalFilename` from the signed version resource. heart's build adds that resource to the forwarder |
| Linux | `inet_diag` netlink → socket inode and uid; `/proc/<pid>/fd` of that user's processes → the holder | `/proc/<pid>/exe`, opened once, hashed. The digest is cached per process (pid + start time), never per file |

- **Tuple matching** uses the accepted socket's full reversed tuple, with IPv4-mapped IPv6 normalized; tests cover `127.0.0.1`, `::1` and mapped.
- **Ambiguity is refused:** more than one holder found, a process heart may not inspect, a pid that disappears.
- **Linux binds by digest only.** The digests come from trusted release metadata; a file the desktop can't vouch for is never authorized, whatever its `.rev` says.

### 3.2 Where it is supported

| heart runs as | Bound routes |
|---|---|
| macOS app, Windows NSIS, Linux deb / rpm / tar / AppImage | offered, after the spike confirms the lookup works from the **packaged, signed** heart under a standard user |
| Linux Snap or Flatpak | not offered (the stdio route is already unsupported there) |
| iOS, Android | no lookup code. `peerident` is behind desktop-only build tags, like `util/grpcprocess` (`//go:build !gomobile`); the mobile stub refuses bound keys and leaves unbound keys as they are. Phase 1 must build all five desktop targets, the iOS framework and the Android AAR |

Containers, WSL and VMs: whatever heart observes decides. A relay process or an unknown peer doesn't match; a host-network container running the genuine binary does. The plan no longer claims a categorical exclusion.

### 3.3 Cost

- Unbound keys: nothing.
- Lookups run **one at a time** (a semaphore); verdicts are cached per process, so the forwarder's four parallel connections cost one signature or hash check.
- No fixed number yet. The spike measures cold and warm p50 / p95 / p99 per OS with parallel connections, reconnects after idle and a workstation with thousands of open descriptors; the release threshold is set from that.

## 4. Who is bound to what

Binding is decided **per config target and per program that really opens the connection**, not per gallery tile. A target read by several programs is bound only if one binding covers all of them; otherwise it uses the forwarder or stays unbound.

### 4.1 The forwarder

| OS | Binding | Source |
|---|---|---|
| macOS | Team ID `J3NXTX3T5S` + identifier `com.anytype.mcp` | constants in the desktop's build metadata (`aiConnect.build.json`), written by `prepare-forwarder.js` from the binary it signed |
| Windows | Anytype's Authenticode subject + `OriginalFilename` `anytype-mcp.exe` | same |
| Linux | sha256 of the release forwarder for this architecture | same |
| Unsigned development builds | sha256 | same |

- The desktop sends the binding; heart needs no knowledge of anytype-ts signing.
- **The probe runs the exact command written to the client's config** (the stable copy), not the in-app binary.
- **Linux consequence for `anytype-mcp-plan.md` §4.2:** heart accepts only the running desktop's own digest, so on Linux the running desktop installs its own forwarder as the stable copy; "never downgrade" can hold only on macOS and Windows. The plan's owner should fold this in.
- **Key file on Windows:** the folder and file get an owner-only ACL with inheritance removed, also after a replace; tested with a second ordinary user.

### 4.2 Claude Desktop

| OS | Route | Binding | Label |
|---|---|---|---|
| macOS | bundle or config, through the forwarder | forwarder + `launchedBy` Claude (`com.anthropic.claudefordesktop`, Anthropic's Team ID): heart walks up from the forwarder, every ancestor must carry that Team ID until the app itself is found, and the app must pass the hardened check | **Limited to this app**, if the qualification run passes |
| Windows, Linux | through the forwarder | forwarder only (a Windows parent can be chosen by the creator; Linux has no signatures) | Needs the Anytype connector |

- Claude Desktop is verified hardened on macOS: the three Node fuses are off and both ASAR integrity fuses are on (installed `6.28899.6`).
- **Re-check.** heart checks the signature properties on every lookup. The desktop reads the fuses at connect and again whenever Claude's version changes. If they no longer pass, the card drops to "Needs the Anytype connector" and says why; the binding itself is left as it is.

### 4.3 Other routes

| Target | Programs that read it | First release | Next |
|---|---|---|---|
| "Other app" Command | unknown | forwarder | — |
| "Other app" URL and key | unknown | unbound | — |
| Codex `config.toml` (ChatGPT app + Codex CLI) | both | unbound | forwarder command for both (B3) |
| Claude Code MCP, Gemini CLI, OpenCode, Hermes | CLIs | unbound | forwarder (B1) |
| Claude Code skill | `curl` | unbound | never |
| Cursor, VS Code + Copilot (the Copilot CLI reads the same file), Antigravity, LM Studio | GUI helpers, sometimes a CLI too | unbound | qualified one by one (B2): bound to the exact helper that opens the connection and to the assessed build; re-assessed when the app updates. A target a CLI also reads uses the forwarder |

A direct GUI binding is switched on only after a real run of that app: install → connect → `initialize` and one tool call → relaunch → app update.

## 5. Desktop behaviour

- **The binding is part of the plan.** Main's fresh plan names the protection level and the exact binding. It travels through consent, mint, retry and apply; a pending key is reused only for the same binding. If the route or the level changes after the preview, the sheet shows the new one before a key is issued or shown. This holds for Connect, Reconnect and manual setup.
- **States on a card:** Added → Connector verified (the probe passed) → Client observed (`lastUsedAt` from a real client; on macOS with `lastLaunchedBy`) → and, separately, Last refusal.
- **Refusal copy.** For a forwarder route: "Another program tried to use this connection's key." For an app-limited route: "Set up for <app>; <caller> was refused." No app name is claimed that heart didn't establish.
- **Repair** re-derives the binding from the expected product and the verified installation (never from the refused caller's name) and calls `SetAppBinding`. The grant is untouched.
- **Forwarder update:** bindings are reconciled at account open, before the API is of use. A crash in between is retried at the next open.
- **Logging:** key id (hash), reason, caller display name, pid. Never the key, a header, a path, a command line or the environment. Rate-limited per connection.

## 6. Threat model

**What it does**

- A key copied from a config file, a backup, a log or a screenshot is refused when another program sends it directly (`curl`, a script, another app).
- On macOS, for Claude Desktop, the forwarder is accepted only when Claude started it.

**What it doesn't**

| Gap | Why |
|---|---|
| Any same-user program can start the forwarder and use the connection, replies included | the forwarder serves whoever starts it. Forwarder routes give **no isolation between apps of one user** |
| A connection can change hands after the lookup (inherited or shared sockets, `exec` after connect), on every OS | the lookup is one observation. Authenticating each request needs a channel only cooperating clients could use; not planned (B4) |
| Code inside the bound app: injection on Windows and Linux, unhardened apps, editor extensions | it runs with the bound identity (B2) |
| A restored wallet on another machine with the same binary | a binding names a program, not a device |
| Port squatting | separate follow-up |
| User-made keys, and every route labelled "Usable by any app that has the key" | unbound by decision |

## 7. Phases and dependencies

| # | Repo | Work | Needs |
|---|---|---|---|
| 0 | heart | **Spike:** the lookup from a packaged, signed heart under a standard user on a clean machine, per OS. Timing (§3.3). Claude's real process tree on macOS; MSIX Claude and its forwarder on Windows; an AppContainer client; Docker (bridge and host network) and WSL outcomes recorded | — |
| 1 | heart | `SetAppBinding`, storage and envelope, the check, stream ending, usage fields, the external-exchange rule, `peerident` with the mobile stub; the forwarder's version resource (Windows) | 0; plan Phases 1–2 (file-backed forwarder, file tools) |
| 2 | anytype-ts | generated protos; identity in build metadata; binding in plan, mint and apply; labels; probe through the installed command; states; Repair; reconcile at account open | 1; plan Phase 3 (desktop switch, signed artifacts) |
| 3 | anytype-ts | **Qualify the first-release routes** on packaged builds: install → connect → tool call → relaunch → update from the previous alpha, for Claude bundle and config on macOS, Windows classic and MSIX, Linux stable copy; "Other app" Command | 2 |
| 4 | anytype-ts | JS-9889, then alpha gate and release (plan §8.4) | 3 |
| 5 | anytype-ts | CLI targets to the forwarder (B1, B3); GUI apps one by one (B2) | 4 |

Phase 1 can ship in heart before the desktop uses it: with no binding set, nothing changes. A route that fails Phase 3 ships with the next lower label, never with the higher one.

## 8. Tests

- **heart, unit:**
  - `SetAppBinding` keeps the grant, also against a concurrent grant edit;
  - malformed, empty, unknown-version and wrong-OS bindings refuse;
  - an old reader refuses a bound key file;
  - no HTTP route and no JSON-API session can change a binding;
  - external `WalletCreateSession` with a bound key is refused;
  - in-process calls pass only under their outer request.
- **heart, streams:** an open spaces stream and a kept-alive connection across a rebind both end; two keys with different bindings on one connection are judged separately.
- **Real processes, per OS** (test binaries built in the job):
  - the bound binary passes; `curl` with the same key gets `caller_not_allowed`;
  - Windows: a second binary signed by Anytype and named `anytype-mcp.exe` on disk is refused; a renamed-and-replaced image is refused;
  - Linux: two byte-identical copies at different paths both pass; a changed file is refused, also with its mtime restored;
  - macOS: a wrong identifier, a missing runtime flag or `get-task-allow` fails; a forwarder started by something other than Claude fails `launchedBy`;
  - a peer of another OS user is refused;
  - the socket-handover cases are run and their observed result recorded as the documented residual.
- **Mobile:** iOS framework and Android AAR build; a bound key is refused there, an unbound one works.
- **Cost:** the measured thresholds from the spike; an unbound key triggers no lookup.
- **Desktop (vitest):**
  - mint fails closed when `SetAppBinding` is missing or returns something else, and the key is revoked;
  - a pending key is not reused across a binding change;
  - the label shown equals the binding sent;
  - Repair keeps the grant;
  - the probe uses the installed command;
  - the states of §5, including "probe only" and "success, then an unrelated refusal";
  - a refused direct client that starts OAuth discovery still leaves the diagnostic in Manage.
- **Packaged:** Phase 3's runs.

## 9. Risks

| Risk | Handling |
|---|---|
| The lookup doesn't work from the packaged heart on some OS (permissions, TCC, antivirus) | the spike decides; that OS ships with unbound routes, labelled |
| The lookup is too slow under connection churn | one at a time, per-process cache, thresholds from the spike |
| A Claude update changes its process tree or hardening | heart re-checks signatures every lookup; the desktop re-checks fuses on version change; the label drops |
| Two Anytype channels on Linux install different forwarders | the running desktop installs its own (§4.1) |
| Users on WSL, containers or remote editors | they use a key from the Local API page |

## 10. Open decisions for Roma

- **C1. Claude Desktop on macOS as "Limited to this app"** through the `launchedBy` rule (§4.2). I read "the Claude Desktop direct route" in the first-release scope as this. The alternative is to ship Claude as "Needs the Anytype connector" on every OS and add `launchedBy` later.
- **C2. Linux stable copy.** With digest binding the running desktop must install its own forwarder, so "never downgrade" doesn't hold on Linux (§4.1). The alternative is to let a key carry several digests, which needs a trusted list of other channels' builds.

## 11. Review response

ACCEPT = the design changed. PART = the simple part is taken. REJECT = not taken.

| Id | Verdict | What changed, or why not |
|---|---|---|
| SEC-01 | ACCEPT | Forwarder routes are described as giving no isolation between same-user apps; three labels; the off-machine claim is dropped (§0, §6) |
| SEC-02 | PART | Lookup-time, connection-level evidence only; ambiguity refused; the key's binding compared on every request (§2, §3.1, §6). Refused: a per-request authenticated channel (XPC or similar) |
| SEC-03 | ACCEPT | `SetAppBinding` never touches the grant (§1.2) |
| SEC-04 | ACCEPT | Mint needs the new RPC and an exact reply; an older heart fails the mint; present-but-invalid bindings refuse (§1.1, §1.2) |
| SEC-05 | PART | Direct GUI bindings name the exact helper and assessed build and are qualified one by one; Claude's hardening is re-checked (§4.2, §4.3). Refused: auditing every launch switch of third-party apps |
| SEC-06 | ACCEPT | Windows: mapped image, signer and signed `OriginalFilename` (§3.1) |
| SEC-07 | ACCEPT | Only digests from release metadata; cache per process, not per file (§3.1) |
| SEC-08 | PART | Same OS user required; typed `launchedBy` on macOS only; owner-only ACL on Windows (§2, §4.1, §4.2). Refused: mount-namespace object comparison (Linux path binding is gone) |
| SEC-09 | ACCEPT | A binding change ends the key's streams; in-process marker tied to the outer request (§1.2, §2) |
| SEC-10 | PART | Full-scope sessions named as the administrators; bound keys can't be exchanged over external gRPC (§1.4). Refused: a separate registered desktop capability |
| OS-01 | ACCEPT | As SEC-02; the all-holders rule is replaced by "refuse if more than one" |
| OS-02 | ACCEPT | Token, then re-read of the fds; gated on the packaged signed heart under a standard user (§3.1, §7) |
| OS-03 | ACCEPT | As SEC-06; the same-name test (§8) |
| OS-04 | PART | Supported heart packagings listed; Linux by digest of the running file (§3.1, §3.2). Refused: a matrix of every heart and client package pair |
| OS-05 | ACCEPT | Digest only, and the probe runs the installed command (§4.1) |
| OS-06 | ACCEPT | MSIX, AppContainer and the Claude-launched forwarder are spike items (§7) |
| OS-07 | ACCEPT | Ancestry only for `launchedBy` on macOS; GUI routes need a real run first (§4.2, §4.3) |
| OS-08 | ACCEPT | Full reversed tuple, mapped addresses; virtual networks are recorded, not asserted (§3.1, §3.2) |
| OS-09 | ACCEPT | One lookup at a time, per-process cache, thresholds from measurement (§3.3) |
| OS-10 | ACCEPT | Desktop-only build tags, a refusing stub, mobile builds in Phase 1 (§3.2) |
| INT-01 | ACCEPT | As SEC-03 |
| INT-02 | ACCEPT | As SEC-04 |
| INT-03 | ACCEPT | As SEC-09; per-request comparison of the cached peer (§2) |
| INT-04 | ACCEPT | The binding travels with the plan; a change is shown before a key is issued (§5) |
| INT-05 | ACCEPT | As OS-05; the Linux stable-copy consequence is stated (§4.1, C2) |
| INT-06 | ACCEPT | Per config target and real caller; shared targets use the forwarder or stay unbound (§4, §4.3) |
| INT-07 | ACCEPT | Re-check on version change; Repair derives from the installation (§4.2, §5) |
| INT-08 | ACCEPT | Four states; probes and internal calls are not client use (§1.5, §5) |
| INT-09 | ACCEPT | Labels before mint and in Manage; exceptions listed (§0, §4.3) |
| INT-10 | Moot | No Linux path binding; AppImage GUI apps aren't bound directly |
| INT-11 | ACCEPT | Owner-only ACL contract and test (§4.1) |
| INT-12 | ACCEPT | One dependency table; routes qualified before they ship (§7) |
| INT-13 | PART | Refusal tested per direct client; diagnostics in Manage (§8). The categorical container claim is dropped instead of enforced (§3.2) |
