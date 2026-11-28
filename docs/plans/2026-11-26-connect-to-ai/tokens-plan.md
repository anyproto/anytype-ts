# Tokens: the key lives in the AI app, not in Anytype

Rev 5.2 (final), 2026-11-28. Plan only; no code. It changes `anytype-mcp-plan.md` (rev 4 + §13) where the two disagree; everything not named here stays. It folds in two review rounds (`.review-tok-r1-adjudication.md`, 42 findings; `.review-tok-r2-adjudication.md`, 31 findings) and the product owner's decisions (§6). There is no further plan review; implementation starts from this text.

**Decision (Roma, 2026-11-28).** The desktop and the forwarder keep no copy of an AI app's key: no item file, no keychain. HTTP apps are unchanged. Claude Desktop's `.mcpb` gets the key through a required, sensitive `user_config` field the user pastes once. The Claude config route and "Other app" stdio carry it in the entry's `env`. The forwarder reads `ANYTYPE_API_KEY`.

**Where things are**

| | Path |
|---|---|
| heart forwarder | `/Users/roman/anytype/anytype-heart-mcp`, branch `go-7620-anytype-mcp`, `cmd/anytype-mcp`, draft PR anyproto/anytype-heart#3353 |
| desktop | `/Users/roman/anytype/anytype-ts-connect-ai`, branch `feature/connect-to-ai-poc`: main `electron/ts/lib/aiConnect/`, renderer `src/ts/lib/aiConnect/` and `src/ts/component/popup/aiConnect/`, build `scripts/build-mcp.js`, `scripts/prepare-forwarder.js`, `electron/hook/verify-forwarder.js` |

**Facts this rests on (checked in code)**

- heart's `AppInfo.isActive` is true once a session was minted from that key in the current heart run, and stays true until heart restarts or the key is revoked (`core/application/sessions.go:487`). It is per `appHash`. The desktop mapper already carries it.
- heart itself keeps every key, sealed in the account (`core/wallet/applink.go:312`), and `ListApps` returns `appKey`. `ListApps` silently skips a grant file it can't read (`applink.go:570`).
- The tier is not in the grant. It is only the URL segment `/mcp/<tier>`.
- Main already knows whether the Local API listens: `liveApiListening(port, localApi, localApiBind)` in `validate.ts` (the configured port, the enabled flag, and heart's last bind result). heart sends no event when the API is switched off; the window that switches it off writes `localApi` first.
- The forwarder dials `127.0.0.1` only (`forward/upstream.go:34`).
- MCPB 2.1.2: an optional field left out yields the literal `${user_config.files_dir}`; an empty one yields `""`; a missing required field yields no launch at all. The resolver is `node_modules/@anthropic-ai/mcpb/dist/shared/config.js`.

## 1. Threat model (replaces §0.2)

**In scope**

- **Anytype's desktop and forwarder write the key to no file of their own.** Registry, candidates, IPC list results, logs, backups and leftover temp files hold `appHash`, a key fingerprint and an entry digest, never the key or an entry that contains it.
- **The renderer keeps no key after main has it** (no state, no store, no module variable). Clearing JavaScript memory is not attempted.
- **No key in argv**, in the endpoint file or in logs. Env only for stdio.
- **The bearer goes only to `127.0.0.1:<port>`**, the port comes from a file other OS users can't change, and nothing is sent while that file can't be read (§2.2).
- **No lost revocations:** on the Claude routes and manual records a hash is queued durably before anything outside Anytype changes, and leaves the queue only when heart answers success or "not found".
- **A config file Anytype writes a key into is created `0600`**, temp file included, with no backup copy, on every adapter.

**Residuals, stated once**

| | Residual |
|---|---|
| heart's issuer copy | heart keeps each key sealed in the account and returns it through `ListApps`. Unchanged; not part of this decision |
| Same user | Any program of the user can read the app's config, ask Claude for its stored value, read the forwarder's environment, or start the forwarder with a key it has |
| Clipboard | The key, or a snippet with it, is on the clipboard for up to 5 minutes. Clipboard history, cloud clipboard and Universal Clipboard may keep it. Clearing is best effort and does not survive a crash of Anytype |
| App configs | Another tool may rewrite the file `0644`, the app's folder may carry a wider ACL, and backups may copy it. Same as the HTTP routes today. Disconnect revokes |
| Files folder | The file tools refuse a file that contains this connection's key. A file with another connection's key in a folder the user chose can be uploaded, as in rev 4 |
| Claude's storage | The OS store is Claude's normal path; it falls back to plaintext in its settings file when the store is unavailable. Measured once on the alpha (§5 D2) |
| Port squatting | Smaller than before: the endpoint file is removed when the API stops and at start, so only a crashed Anytype leaves a port to squat until its next start. Still a follow-up |
| Replaced account | After another account's key replaces this one in Claude, this account's row stays "Connected" until heart restarts |

## 2. Heart (`cmd/anytype-mcp`)

### 2.1 CLI

```
anytype-mcp serve [--tier small|large|full] [--files-dir DIR]
anytype-mcp endpoint                 # read-only: would serve find Anytype safely?
anytype-mcp version [--json]
```

| Input | Rule |
|---|---|
| `ANYTYPE_API_KEY` (env) | Read once at start, then unset in the process. Valid: 1–1024 visible ASCII characters (the check moves out of `store/item.go`). Missing, empty, or exactly `${user_config.api_key}` → not connected until restart. Starts with `__encrypted__:` → not connected until restart, fixed text "the app passed an encrypted value instead of the key", one stderr line without the value. Nothing is sent upstream in either case |
| `--tier` | Default `full`. Fixed for the life of the process. Unknown value: exit 2 |
| `--files-dir` | Unchanged: empty or relative is exit 2; an absolute folder that can't be used is exit 6 |
| `ANYTYPE_MCP_FILES_DIR` (env) | Same folder, for the bundle's optional field. The flag wins. Empty or exactly `${user_config.files_dir}` = not set. Anything else follows the flag's rules and exit codes |
| Home, system temp | As today |

- Nothing else is read from the environment; `guard_test.go` holds the allow-list.
- **`endpoint`** prints one JSON line: `{"ok":true,"port":N}` (exit 0) or `{"ok":false,"reason":"missing|invalid|denied|unreachable","path":"…","rule":"…"}` (exit 1); `path` and `rule` are left out when empty (`missing` has no rule; `unreachable` carries the OS error as its rule). It runs the same read as `serve`, bounded by the same 5 s. It also judges the program an AI app would give the key to: the path it was started by, exactly as the caller spelled it (`argv[0]`; a bare name leaves `os.Executable`), which must be clean and absolute (no `..`, `.` or doubled separator). When that path starts with `<home>/.anytype/` as the home is spelled, the folder rule of §2.2 applies to every folder from `.anytype` down to it and the file rule to the file, none of them followed, and it must be the running file (`os.Executable`, same file identity). A path spelled otherwise is refused when any folder it passes is `.anytype` by identity (another case, an 8.3 name, a link), checked folder by folder as spelled, and when the running file really lies in `.anytype` (its final path asked of its handle on Windows). Folders above `.anytype` fall under the home rule. Every failure of this check is `denied`. The desktop runs it on the exact file it is about to name in a config.
- No `--port`, no `--connection`, no `key` verbs. Exit codes in use: `0, 1, 2, 6`.
- `version --json` keeps its shape. `Rev` becomes `6`. New: the binary contains the plain string `anytype-mcp-rev:<Rev>` next to the namespace marker, so the revision of any slice or architecture can be read with `grep -a` without running it.
- Redaction of §13/§13.1 stays. New: the `keyGuard` that withholds a download containing this connection's key also reads the upload body, and such an upload is aborted with a tool error.

### 2.2 The endpoint file

- **Path:** `<home>/.anytype/ai-connect/endpoint.json` (release namespace), `endpoint-dev.json` (development). The link-time namespace stays and picks the file.
- **Format:** `{"v":1,"port":31009}`. At most 256 bytes, one object, `port` 1–65535, any other `v` is invalid.
- **Writer:** the desktop (§3.2). heart's server writes nothing. The forwarder reads with every sharing flag (Windows: read, write, delete), so a POSIX-semantics replace and a removal never wait for it. A classic Windows replace (`MoveFileEx`, which Node's `fs.rename` uses) fails with `EPERM` during the microseconds a forwarder holds the file open, so the desktop retries the rename briefly.

**One rule per path component, judged only by the forwarder:**

| Component | Unix | macOS in addition | Windows |
|---|---|---|---|
| home | real directory, owned by the user; mode not judged (existing rule) | deny ACL entries only | no reparse point; owned by the user, SYSTEM or Administrators; nobody else may delete or rename children (existing rule) |
| `.anytype`, `ai-connect` (and `bin`, `bin-dev` for the `endpoint` verb) | real directory, owned by the user, no group/other write | no ACL | no reparse point; grants only to the user, SYSTEM, Administrators; inherited entries are fine |
| endpoint file (and the executable for the `endpoint` verb) | regular, one link, owned by the user, no group/other write; opened no-follow and checked through the handle | no ACL | regular, one link, not a reparse point; owner and grants as the folders, read through the handle |

The Darwin ACL helper and its assembly trampoline stay (the file tools use them too).

**One gate before every authenticated send.** `conn.gate(ctx)` is called immediately before each request that carries the bearer: every MCP exchange, each REST request of a file transfer (a download makes two), and session cleanup. It passes only when the endpoint was read successfully within the last 5 s (`contract.RefreshAfter`), re-reading first when the last good read is older. A caller that pinned a port (each REST request of a transfer, a session's follow-ups) reads the endpoint afresh first, so a withdrawal between two of its requests stops the second, and aborts when the port is no longer the one it pinned. A read that comes back after its timeout is dropped; the next attempt reads anew. Each authenticated request is one attempt on a new connection (no keep-alive), so the HTTP library never replays one past the gate. A curated session is used only on the port that opened it, on every attempt (a refused-dial retry, a notification, a client response): on another port it counts as expired (one renewal; a `tools/call` gets the reset warning and does not run), a notification is dropped, and a client `initialize` that replaces such a session sets the reset warning too.

**One outcome when the gate does not pass** (missing, invalid, denied, I/O error, the 5 s read timeout):

- `-32001` "Anytype can't be reached: open Anytype"; the request does not leave.
- Not final: the next request reads again (at most one read outstanding, at most one per second, refusals included). A read's result counts from the moment the read started; one taken only after the read timeout is dropped.
- The same at start and after a good read. No "keep the last port", no fallback to 31009.
- Only a bad `ANYTYPE_API_KEY` is final until restart.
- The file tools are set up at start from `--tier`, so they are listed as soon as the endpoint is back.

**Port change while running:** a refused connection re-reads at once and retries the request once. Kept exceptions: a 401 is never replayed; a file transfer is never replayed and fails when the port moved under it; a curated-tier session that gets 404 on the new port is renewed once, the first `tools/call` after it returns the reset warning without running, and no cleanup `DELETE` goes to the old port.

**Two Anytypes of one flavour** (alpha and stable): the last writer wins; the other one's keys get 401 with the "key rejected" text. Accepted.

### 2.3 Deleted, changed, kept

| | Files |
|---|---|
| Deleted | `key.go`; `internal/store/item.go`, `mem.go`; write, delete and lock in `file.go`, `file_unix.go`, `file_windows.go`; `Store.Write/Delete/Lock`, `UnconfirmedError`; the `gofrs/flock` import; tests `round3_test.go`, `store/item_test.go`, the write cases of `store/file*_test.go`, the key-verb cases of `cli_test.go` |
| Changed | `main.go` (flags, env, `endpoint`, usage); `forward/conn.go` (snapshot = env key + `--tier` + endpoint port; `gate`; no `gone` for endpoint failures); `forward/serve.go` (gate before every send, at each call site; `upstream.go` is unchanged); `forward/localtools.go` (gate in `request`, upload `keyGuard`, the 401 text "Anytype no longer accepts this key: reconnect in Anytype and give the app the new key"); `contract` (`StoreReadTimeout` → `EndpointReadTimeout`); `version.go` (`Rev` 6, rev marker, `rev.lock`); `store/file*.go` (read-only endpoint rules, `CheckExecutable`, a test-only `OwnerRule`); `guard_test.go` (env allow-list, no `flock` assertion); `refresh_test.go`, `files_cli_test.go`, `harness_test.go`, `integration/integration_test.go` |
| Kept | Framing, limits, protocol versions, dispatch, sessions, shutdown (§2.2–§2.6); file tools (§13.1); both namespace builds, both packers, `check-server-archives.sh` (one addition: every `anytype-mcp` in a release carries exactly one rev marker, the same in all, and on the host `version --json` reports it); `core/api/server/mcp_forwarder_contract_test.go` |
| CI (`test.yml`) | Job `anytype-mcp` (Windows, Linux; `-race` on Linux only) and the "against heart" step stay as they are |

## 3. Desktop

### 3.1 Deleted

- `keyStore.ts`, `item.ts`, `forwarder.itemLabel`, and their tests (`keyStore.test.ts`; the item cases of `bookkeeping.test.ts`, `review1.test.ts`, `review2.test.ts`). A test that also protects a surviving behaviour (HTTP healing, orphan recovery, revocation, T2, T3, the refused HTTP Disconnect of `flow.test.ts:608`) is rewritten, not dropped.
- Record fields `itemRev`, `retarget`, `itemDelete`, `itemFps`, `itemUntil`, **and `configEntry`** (on records, candidates, journal inputs, check results and the IPC view). `Ctx.journal`'s retarget and delete parts. `Adapter` answers `itemLeft`, `item`. The "replace a foreign item" consent.
- Method `'command'` as a record method (§3.2 "Other app").
- `entryShared` and the cross-channel command repair (`claudeDesktop.ts:493`, `:939`): an entry that isn't the one recorded is "Needs attention ▸ Reconnect".
- In-place tier edit of Claude's config entry: a tier change on the config route is a Reconnect.
- The `backup` option of `writeFileSafe` for secret writes (§3.2).
- Text that says the key stays in a private file in the Anytype folder: `aiConnectPlanCommand`, `aiConnectManualPrepare`, `aiConnectManualCommandPrepare|Add|Created`, `aiConnectSetupCommandHint`, `aiConnectPlanKeyfile`, `aiConnectErrorStoreUnconfirmed`.

**Not deleted:** the desktop record id (`other-<8 hex>` and `connectionId` in IPC) and the record's `ns`.

### 3.2 Changed

**Endpoint (`endpoint.ts`, new, main process).** One function `syncEndpoint()` makes the file match the state; it is the only writer.

- State "listening on P" = `liveApiListening(P, …)` is true **and** the host of heart's last `ListenAddr` is `127.0.0.1` or `0.0.0.0` (the whole address is parsed; today's `portOf` drops the host). Then: write `{"v":1,"port":P}` (temp created `0600`, fsync, rename) after `ensureStoreDir`.
- Any other state (API off, a failed bind, an IPv6-only bind, no account): delete the file if it names the port this instance last published.
- Called when `localApi` or `localApiBind` changes, on account stop, on quit, and at the start of every aiConnect check. **At app start, before any account is selected, the file is deleted unconditionally.**
- **Preflight** for a stdio method: (1) `syncEndpoint()`; (2) run `anytype-mcp endpoint` **on the file that will be named in the config**: the stable copy for the config route and Other Command (after `ensureInstalled`), the in-app binary for the bundle route; (3) require `ok` with our port. It runs in `aiConnectPlan` (the renderer mints only after the plan, so nothing is minted on failure) and again in `aiConnectApply`. Failure → `storeDenied` with the forwarder's `rule` and `path`; text: "Anytype's folder in your home folder isn't private, so apps can't find Anytype safely." HTTP routes don't depend on it.
- **The desktop's own probe** (`aiConnectProbe`, any route) refuses to send unless `liveApiListening(port)` is true in main at that moment.

**Command and build compatibility.**

- `forwarder.serveCommand(env, { tier, filesDir? })` → `{ command, args: ['serve','--tier',t,…], env: { ANYTYPE_API_KEY: key } }`.
- `MIN_FORWARDER_REV = 6`, one constant used by `prepare-forwarder.js` and by main (`buildMeta().forwarder.rev`).
- `prepare-forwarder.js` reads the rev marker and the namespace marker with a byte search from **every file it ships** (each macOS slice before `lipo`, each Linux architecture, the Windows exe). All must agree and be ≥ 6; otherwise a release build fails and a dev build switches the stdio routes off.
- **Stable copy:** whenever `ensureInstalled` keeps a file whose sha256 differs from the in-app binary (the higher-`.rev` branch at `forwarder.ts:486`, the blocked Windows rename at `:504`), it must, after the signature check, answer `version --json` with rev ≥ 6 and this build's namespace; otherwise `installFailed`.
- `verify-forwarder.js` adds, on the packaged app:
  - the packed manifest equals §3.3 exactly in `server.entry_point`, `mcp_config.command`, `mcp_config.args` (`["serve","--tier","full"]`), both env mappings and both field declarations;
  - **the smoke runs the manifest's own launch:** unpack the bundle, resolve `mcp_config` with the pinned MCPB resolver (`getMcpConfigForManifest`, `user_config = { api_key: <a synthetic valid key> }`, `files_dir` left out), start that command with that env and stdin closed, expect exit 0;
  - the rev marker of every slice inside the bundle and the app is ≥ 6.

**Secret-bearing file writes (every adapter, HTTP port heals included).**

- `writeFileSafe` with `secret: true` never writes a `.anytype-backup`. The option to ask for one is removed for secret writes.
- Temp files are created `0600` in the target's folder under the existing name pattern `.<basename>.<tag>-<time>-<rand>.tmp` (`fsSafe.tempName`).
- **Sweep:** before a secret write, and once at start for every record's target path, delete siblings that match that pattern for that basename, are regular files owned by the user, and are older than 60 s. No journal of temp names.

**Registry.**

- A record or candidate for a config delivery holds `configPath`, `entryDigest` (digest of the complete entry) and `keyFp`. Promotion copies the digest on its own.
- The registry save fsyncs the containing folder after the rename on POSIX (`registry.ts:247`); a save that fails is "not saved" and the next outside step does not run.
- `ns` stays on stdio records; a record of the other flavour is `conflict` and is never checked, healed or rewritten (T3), for bundle and config records alike.
- **Mint intents:** an intent that matches no key is kept until it is 24 hours old, then dropped (today it is dropped at once, `flow.ts:777`, and a grant heart could not read for a moment is lost).

**Revocation order.**

| Record | Order |
|---|---|
| Claude bundle, manual (Other) | save the hashes in `revokePending` → nothing outside to change → revoke |
| Claude config | under `claude-desktop.lock`: read the entry; not ours → `conflict`, nothing queued, as today; ours → save the hashes in `revokePending` → delete the entry → revoke |
| HTTP adapters | unchanged from today (a refused Disconnect queues nothing) |

The row shows "Revocation pending" until heart confirms.

**Renderer holds no key after hand-over.**

- `flow.commit()` keeps `appHash` only; `heldKey()` returns no key once committed (`flow.ts:325`).
- An unidentified mint remembers the key's fingerprint, not the key (`flow.ts:518`); recovery compares fingerprints of `ListApps` rows.
- Opening a manual or Manage view performs no key lookup (`controller.ts:1250`). A Copy action fetches the key by `appHash` from `ListApps` into a local variable, passes the text to `aiConnectCopySecret` (§3.4) and drops it.

**Claude: one guard for both routes.** `claudeRoutes(env)` returns whether `mcpServers.anytype` exists and whether an Anytype extension is installed and not switched off (unreadable counts as present). Both routes call it in plan and in apply; every check calls it.

- Plan or apply of one route while the other is present → refused before mint with "remove one of the two" and which one.
- Both present at a check → status `conflict`, same text. Anytype removes nothing by itself.

**Claude config route.** Entry = the command above with `env`. One write under `claude-desktop.lock`; the candidate (digest and fingerprint) is saved first. Check: digest equal → ok; else Needs attention. Reconnect follows the existing HTTP order (new key delivered, then the old one revoked).

**Other app and manual setup.**

- Both setups are manual records: **`method` stays `'manual'`** and a new field `setup: 'url' | 'command'` says which (check, probe and reconnect select manual behaviour by `method == 'manual'`: `index.ts:1255`, `:1409`, `flow.ts:1389`). `aiConnectRecordManual` gains `setup` and may reconnect either kind by `connectionId`. `isCommand(rec)` becomes `rec.setup == 'command'`.
- Plans carry `needsKey: boolean`; `manualUsable` and `commandPlan` use it instead of text keys. Steps hold the `<KEY>` placeholder only; the screen masks it. This also covers Claude's "Set up manually" on a build without a bundle, which now shows a config snippet.
- The sheet says: "Keep this in a settings file only you can read."
- Command still installs the stable copy and runs the preflight first.

```json
{ "mcpServers": { "anytype": {
  "command": "<home>/.anytype/bin/anytype-mcp", "args": ["serve", "--tier", "full"],
  "env": { "ANYTYPE_API_KEY": "<KEY>" } } } }
```

**Kept:** `aiConnectMintIntent`, `aiConnectOrphan`, the `unconfirmed` candidates for file deliveries, the transport mark (S1), `installedSomewhere` (T2) reading config targets by fingerprint.

### 3.3 The `.mcpb` route

**Manifest** (per OS, version `2.<rev>.0`, extension ids unchanged):

```json
"server": { "type": "binary", "entry_point": "server/anytype-mcp",
  "mcp_config": { "command": "${__dirname}/server/anytype-mcp", "args": ["serve", "--tier", "full"],
    "env": { "ANYTYPE_API_KEY": "${user_config.api_key}", "ANYTYPE_MCP_FILES_DIR": "${user_config.files_dir}" } } },
"user_config": {
  "api_key":   { "type": "string", "title": "Anytype key", "description": "Anytype copied it for you. Paste it here.", "sensitive": true, "required": true },
  "files_dir": { "type": "directory", "title": "Folder for files (optional)", "description": "The only folder Claude may upload from and download to. Leave it empty to use a temporary folder. Your home folder can't be used.", "required": false }
}
```

(On Windows the entry point and command end in `.exe`, as today.)

**Always Full.** Main forces `tier: 'full'` in plan, apply and update for method `package` and refuses any other value. The form shows "Tool set: Full" (with the file-tools hint) and, under Advanced, "Use Claude's settings file instead", so the route is chosen **before** a key is minted. The config route keeps the tier choice.

**Bundle copy.** `copyBundle` writes `~/.anytype/ai-connect/Anytype[-dev]-<first 12 hex of sha256>.mcpb` and removes older copies of its own flavour. Claude is handed that path.

**Configure instead of opening the bundle** only when the installed extension has our id, a version ≥ ours and, on a signed build, both the pinned fingerprint and Claude's "signed" status in `signatureInfo.status` (the literal is read off a signed install on the alpha; until then a signed build always opens the bundle).

**Connect (a new connection)**

1. Plan (guards: preflight, `claudeRoutes`, Full).
2. Renderer: mint intent, `CreateApp`.
3. `aiConnectApply`: main saves the record `waiting` with `appHash` and `keyFp`. **This save is the commit.** Then it copies the key (§3.4) and opens the bundle or names Configure.
4. The result is `ok` once the record is saved. A failed copy or open is a flag on it (`copyFailed`, `openFailed`) with "Copy key" and "Open again" in the Finish view; the key is never released for it. A lost reply: the renderer lists the record by `appHash` before it releases anything.
5. **No bearer probe on this route**, at apply or on Retry.

**Reconnect (bundle route only): the old key goes first.**

1. The user confirms; the dialog says Claude stops working until the new key is pasted.
2. New IPC `aiConnectRetire { accountId, connectionId, expectedHash }`: main moves the record's `appHash` and candidates to `revokePending`, clears `appHash` and the confirmation latch, sets the record `disconnected`, and saves. Grant and expiry stay on the record for the new key.
3. The renderer calls `RevokeApp`; a failure leaves the hash queued ("Revocation pending") and does not stop the flow.
4. Then steps 1–5 of Connect on the same record id.
5. A failed mint, or a crash anywhere after step 2, leaves the row "Disconnected · Reconnect" with the old key queued or revoked. It is never live without a queue entry.

**Status**

| Evidence | Row and Finish view |
|---|---|
| no verified extension | "Finish in Claude" · Open again |
| verified, switched off | "Turn Anytype on in Claude" |
| verified, `isEnabled === true`, not confirmed | "Installed in Claude · key not confirmed" · Copy key, how to open Configure |
| confirmed | "Connected" |

**Confirmed** is a latch on the record: `confirmed: { appHash, version, installedAt }`, where `version` and `installedAt` are the extension's fields in Claude's `extensions-installations.json`.

- It is set when `isActive` is true for this `appHash` **and** Anytype has seen `isActive` false for this `appHash` since the current install identity (`version` + `installedAt`) first appeared. A new key starts false, so a fresh connect or Reconnect confirms on first use.
- It is dropped when the install identity changes or the `appHash` changes.
- Consequence: after an extension update with the same key and heart still running, the row shows "Updated in Claude · key not reconfirmed" until heart restarts and Claude uses the key again, or the user reconnects. This is deliberate: `isActive` can't tell old use from new.
- `isActive` is read with `ListApps` every 5 s while the Finish view is open, for at most 10 minutes, and on every ordinary check.

Anytype reads only `isEnabled` from Claude's settings file and never keeps the parsed object.

**Leaving the Finish view.** "Finish later" (close) keeps the `waiting` record. "Cancel setup" is Disconnect.

**Disconnect.** Queue, revoke, remove the record, clear the clipboard. The extension stays; the text says "You can remove Anytype in Claude ▸ Settings ▸ Extensions".

**Outdated extension.** Opening the bundle again is an update, not a new key.

### 3.4 Clipboard: one guarded copy

- New IPC `aiConnectCopySecret { accountId, connectionId | appHash, text }`, the only way a key or a snippet with a key reaches the clipboard (bundle key, Copy key, manual and Other snippets; `manual.tsx` and `index.tsx:398` stop using the plain copy for these).
- Main writes the text and keeps `{ sha256 of the exact text, generation, deadline = now + 5 min }` in memory. A new copy replaces it.
- Clear when the first happens: "Connected" for that record, the deadline, Cancel setup or Disconnect, account switch, quit. Clear only if the clipboard's text still has that hash and the generation is the latest.
- The Finish view says the key is removed from the clipboard after 5 minutes.
- Spike D-S2: write the "concealed" markers (macOS `org.nspasteboard.ConcealedType`, Windows `ExcludeClipboardContentFromMonitorProcessing`) together with the text if Electron can; otherwise the residual in §1 stands.

### 3.5 D1 as built (2026-11-28), where it differs from or adds to §3.1–§3.4

- **Preflight answers.** `denied` → `storeDenied` with the forwarder's `rule` and `path`; every other verdict (`missing`, `invalid`, `unreachable`, a port that isn't the API's) → `{ stage: 'verify', category: 'unreachable' }`. The verb runs with `HOME` (`USERPROFILE` on Windows) set to the home the desktop writes the endpoint file into, whatever Anytype inherited; `version --json` of a kept stable copy likewise.
- **`serveCommand(env, { tier, key })`**: no `filesDir` (nothing passes one; `guard.test.ts` still forbids `--files-dir` in main).
- **Endpoint writer** (`electron/ts/lib/aiConnect/endpoint.ts`): "no account" = from `Api.logout` until heart reports its next successful bind; called from `storeSet`/`storeDelete` of `localApi`/`localApiBind` (main.ts), logout, `will-quit`, every `aiConnectCheck` and every stdio preflight; deleted unconditionally at start (`aiConnect.startup()`, which also sweeps every record's settings-file temps). Windows: the rename is retried on `EPERM`/`EBUSY` up to 10 times, 50 ms apart; then the write fails and is logged (`aiConnectEndpoint <code>`).
- **Extension rows.** Status `ok` only when confirmed; otherwise `pending` with `bundleState: 'finish' | 'off' | 'notConfirmed' | 'updated'`. New status `disconnected` (a retired record, `appHash: ''`; apply/remove of it take `expectedHash: null`). The record's `targetPath` is `''`.
- **Latch fields:** `confirmed: { appHash, version, installedAt }`, plus `armed` (same shape: "not active" seen under this identity, or the key is new) and `reconfirm` (a confirmation was dropped by an identity change → `updated`). A key that was never confirmed carries `armed` over to a new identity, so a fresh connect over an outdated extension (opening the bundle is an update) confirms on first use. `active` comes from the renderer's ListApps (`aiConnectCheck` `keys[].active`); an unknown lookup learns nothing. `installedAt` is read as `installedAt` (or `installed_at`): UNVERIFIED like the other field names.
- **Configure** needs `CLAUDE_SIGNED_STATUS` (`claudeDesktop.ts`), which is `null` until read off the alpha: a signed build always opens the bundle.
- **Open again** = `aiConnectOpenApp { appId: 'claude-desktop', bundle: true }` (copy, then open; no key).
- **`aiConnectCopySecret`** takes exactly one of `connectionId` / `appHash`. Account switch = an aiConnect call for another account (plus logout). The concealed markers of D-S2 are not written (the §1 residual stands).
- **Two-server guard** counts either flavour's extension id. Claude's "Set up manually" is always the config-route plan's steps (`needsKey`), recorded with `aiConnectRecordManual { setup: 'command' }`; the extension plan has no manual steps.
- **`needsKey`** is set by main on every plan whose steps hold the placeholder, automatic ones included (the manual view uses the card's normal plan).
- **No migration of the item-store POC** (it never shipped; product owner, 2026-11-28): a registry with its `keyfile` / `command` records is wrong-shape and quarantined like any other; its items and `.anytype-backup` files are not touched.
- **Registry undo** (`aiConnect.json.txn`, D1R2): a save that adds a hash to a record's `revokePending` first writes those records as they were, with the digest of the new version, and removes the undo once the save is durable. While it is there and the file still holds that version, loading restores the earlier record, so a save reported as failed never revokes later.
- **Session** (D1R2): logout and quit end it synchronously: the endpoint file is withdrawn, in-flight probes are aborted, and a probe, copy, bind or endpoint write that started earlier sends, copies, reopens or renames nothing. The endpoint writer asks before every rename (each Windows retry too). A start-up removal that fails (retried like a rename) keeps the file as this run's, so the next lifecycle call finishes it. A helper crash runs the same cleanup before its dialog (`Server.onCrash`).
- **Windows trust** (D1R2): `privateOnWindows(env, paths)` checks the home (nobody else may replace its children) and every path from `.anytype` down to the exe, on every use (no cache), before a stable copy is run or handed out.
- **Temp sweep** (D1R2): a temp left because it was younger than 60 s is looked at again once it is old enough.
- **`MIN_FORWARDER_REV`** lives in `electron/json/aiConnect.forwarder.json` (`minRev`), read by `forwarder.ts` and `scripts/prepare-forwarder.js`; metadata naming an older forwarder leaves the build without stdio routes.
- **Mint intents**: name, access, expiry and main's save time (renewed before CreateApp when its window ran out). The intent goes in the same registry save as the record that holds its key. Recovery revokes only the one unowned key of that name, access and expiry in the window, and only when no managed key shares the window; anything else revokes nothing and waits up to 24 hours. A key made outside the window is kept.
- **Integration test helper**: `testdata/testheart` gained `mint <name>` (a key as CreateApp makes it) and `active <hash>` (heart's `isActive`), so the real-forwarder test shows `isActive` turning true after one request.
- **The extension replaces a settings-file entry** (2026-11-28 follow-up; changes "one guard for both routes" in §3.2 for this direction only). An Anytype entry in `claude_desktop_config.json` no longer refuses the extension: the plan stays applicable with `replace` (path + `canonicalDigest` of the entry; never its args or env), `existing` `ours`/`foreign`, note `aiConnectClaudeReplaceConfig`, and `preflight` when Claude runs (it rewrites its file). Apply refuses (`validate/conflict`) without a consent that matches the entry under `claude-desktop.lock`. Order: checks → record saved `waiting` (the commit) → `removeEntry` (quit Claude if allowed, re-check the consent under the lock, remove only `mcpServers.anytype` with the config route's secret writer) → key copied → bundle opened (which starts Claude; otherwise Claude is relaunched). When the removal fails (entry edited, Claude didn't quit, lock, write) the commit is undone in one save (the previous record and the key's mint intent back), nothing is copied or opened, and the renderer gets the error (re-plans on `conflict`) with its key still pending; if that undo can't be saved the commit stands with `copyFailed`/`openFailed`. A failure after the removal (copy or open) keeps the record `waiting` with Open again, which now works. This account's own record at the target (an earlier config-route or manual setup) is rotated by that commit: its hash goes to `revokePending` and is revoked after the delivery (the renderer no longer calls `aiConnectRetire` for non-extension records); the record drops `entryDigest`/`configPath`. Another account's entry counts as foreign (as on the config route). An unreadable/protected config is refused as before; the reverse direction (extension there, settings-file route) is unchanged.
- **Replace, review round 1** (`.review-rep-r1-adjudication.md`, R1–R17). Every extension delivery is saved twice: first `staged` (the record `waiting`, its `staged: { before, intent }`, none of the earlier record's hashes queued), then `settleEntry`, the last check under the lock (always: no entry → go on; the agreed one → removed with Claude closed, quit only with quit consent, Claude's state re-checked before every rename incl. Windows retries; anything else → refused), then the commit (old hashes queued), then copy and open. A refused check undoes the first save (record + intent); an undo that can't be saved answers `unsaved`. Every queued call first puts back any staged record it finds: this run's (its flow holds the key) with the intent, an earlier run's with the new hash as an orphan; the commit's `.txn` leftover lands on the staged record and is undone the same way. Plan and apply dry-run the removal (`aiConnectClaudeReplaceCantRemove`). Package records never keep `entryDigest`/`configPath`. Views carry `keyCopied` only for the record's own raw key (fingerprint match) plus `keyCopiedUntil`; the Finish sheet follows it both ways and arms its timer for the remaining time; texts say the key *was* copied. Manage of a Claude config/manual record offers "Use Claude's extension" (needs `aiConnectBundleInfo`, now null for an unusable bundle). A conflict from apply on Claude's package route always re-plans. Configure reports a failed relaunch. `off` points to Configure. `devBuild` only for `signed: false` metadata; the text names `./update.sh <platform> <arch>` and `bun run build:electron`. R17: a signed build proves its installed extension from `Claude Extensions/<id>/` (manifest start command and the forwarder's sha256 = the metadata's), since current Claude records every bundle `unsigned`; a reported different signer stays outdated; unreadable files are `unreadable`.
- **Final review** (`.review-rep-r2-adjudication.md`, F1–F7, main process). F1: the installed manifest's `server` (`platform_overrides` included) and `user_config` must equal those of the manifest read out of this build's own digest-checked bundle (`bundle.ts` `zipEntry`, `bundleManifest`), else outdated. F2: `writeFileSafe` runs `beforeRename` first, then synchronously re-checks the folder and the snapshot right before the rename, so an edit during the process lookup survives. F3: every locked read of Claude's settings compares the resolved file with the one apply pinned (absent-entry branch included). F4: Claude's settings writes are `durable` (folder fsync after the rename; a failure is an error) before the commit queues the old key. F5: a bundle copy that can't be written fails apply before anything is saved, quit or edited. F6: while a staged record can't be put back, records read as their last committed version (`staged.before`), and Copy key / Open again refuse a staged one. F7: an intent put back after a refused delivery carries the key's `appHash`; a later run's list orphans that exact hash and drops the intent.
- **No usable bundle** (none in the build, or damaged) is `verify/bundleMissing` (plus `devBuild` only when the metadata says `signed: false`), never `unsupportedPackage`, which is the Linux package only.
- **Clipboard wording.** Views carry `keyCopied` while main's latest guarded copy is that record's and uncleared (the clipboard itself is never read). The Finish view says "Your key is copied to the clipboard…" only then (a renderer timer of `clipboardTtl` covers the time after the watch stops) and "The key is no longer on the clipboard. Use Copy key again…" after the clear.

## 4. Kept as is

- Forwarder signing before the frontend build, `mac.signIgnore`, the `sign.js` early return, `verify-forwarder.js` in `afterSign` and as workflow steps, `.mcpb` signing and the in-memory hash check before delivery.
- The stable copy's `.rev` rule, lock, Windows ACL query and the Linux exception (C2), with the one addition in §3.2.
- `aiConnect.build.json`, `signed == (namespace == 'release')`, `bin` vs `bin-dev`, the `anytype-dev` extension.
- **Pending, unchanged:** `WIN_PUBLISHER_SUBJECT` in `verify-forwarder.js` is empty, so a signed Windows build fails that check until Roma fills it in. Nightly `.mcpb` signing (`NIGHTLY_MCPB_SIGN_REQUIRED`).
- **Caller binding (parked) still fits.** heart's peer on a stdio route is still `anytype-mcp`; C1 and C2 are untouched. To edit when it is unparked: its decision row "one `0600` key file per connection", and §4.1/§5 where they name the item.

## 5. Phases and acceptance

Order: H1 → a heart build with H1 → D1 → D2. H1 needs nothing from the desktop.

### H1, heart forwarder (branch `go-7620-anytype-mcp`)

Run: `go test ./cmd/anytype-mcp/...` on macOS, Linux and Windows; `go test -race ./cmd/anytype-mcp/...` on Linux (CI) and on macOS (by hand, result in the PR); `go test -tags integration ./cmd/anytype-mcp/integration`.

| # | Case | Expect |
|---|---|---|
| 1 | Key missing, empty, `${user_config.api_key}`, 1025 characters, a control character | `-32001`, zero upstream requests, still so after the endpoint appears |
| 2 | Key `__encrypted__:AAAA…` | the fixed text; the value in neither stdout, stderr nor any request |
| 3 | Endpoint missing at start, then written | first request `-32001`; a request after the write succeeds without a restart; Full `tools/list` includes both file tools |
| 4 | Good endpoint, then deleted / made a symlink / owned by another user / group-writable / given a macOS ACL / given a Windows grant to Users | zero upstream requests while it lasts (MCP, upload, download, session `DELETE`); recovery after repair |
| 5 | Unsafe pre-existing `.anytype` or `ai-connect`; a stock macOS home with `everyone deny delete`; a normal Windows profile | first denied with rule and path on stderr; the other two accepted |
| 6 | `anytype-mcp endpoint` | the same verdict as `serve` in cases 3–5, as one JSON line |
| 7 | `endpoint` run from `<home>/.anytype/bin/` when `bin` has a macOS ACL that grants another user write, or is group-writable, or the executable has two links | `denied` naming `bin` or the executable, although the endpoint file is fine; run from outside `.anytype` the executable is not judged |
| 8 | Port move, Full, old port closed | the next request succeeds on the new port (one retry) |
| 9 | Port move, old port still answering | new port used after at most 5 s |
| 10 | Port move, `small` | one renewal, the first `tools/call` gets the reset warning and does not run, no `DELETE` to the old port |
| 11 | Endpoint withdrawn between a download's metadata request and its content request; endpoint withdrawn while an upload waits to open its file | the second request, and the upload's only request, never leave; tool error; nothing replayed |
| 12 | 401 | the request fails, is not replayed |
| 13 | `--files-dir ""`, relative, unusable absolute; env empty, env `${user_config.files_dir}`, env a folder, flag and env together | exit 2, 2, 6; unset, unset, used, flag wins |
| 14 | Upload of a file that contains the connection's key (also split across read boundaries) | tool error, no file stored in heart |
| 15 | Guard | only the allowed env names; `key …` and `--connection` are exit 2; module list has no `gofrs/flock`; `grep -a anytype-mcp-rev:6` finds the marker in the built file and it equals `version --json` |
| 16 | The key | never in stdout, stderr, or a saved file, in every case above |

### D1, desktop (after a heart build with H1; local: `ANYTYPE_MCP_BIN=<built file>`)

Run: `bunx vitest run electron/ts/lib/aiConnect src/ts/lib/aiConnect src/ts/component/popup/aiConnect`, `bun run typecheck`, `bun run lint`. Then `/qa-engineer`, `/update-docs`, `/dark-mode-check`.

| # | Case | Expect |
|---|---|---|
| 1 | A sentinel key through every flow (bundle, Claude config, Other URL, Other Command, Cursor): after the candidate save, a failed write, promotion, reload, **an HTTP port heal**, Disconnect | the sentinel is in no registry write, no IPC list result, no log; `scripts/ai-connect-keycheck.js` passes on userData and `~/.anytype`; in each target app's folder only the live config file contains it (no `.anytype-backup`, no `.tmp`) |
| 2 | Kill the process between a secret temp's fsync and its rename (Claude config and Cursor); restart | the temp is gone after start and before the next write; a temp younger than 60 s or not matching the pattern is left |
| 3 | Any adapter's command | the key only under `env`, never in `command` or `args` |
| 4 | Endpoint file | written only when `liveApiListening` and the bind host is `127.0.0.1`/`0.0.0.0`; absent after API off, a failed bind, a `[::1]` bind, quit, and right after app start; an old bind result for another port publishes nothing; another instance's port is not deleted |
| 5 | Preflight with an unsafe existing folder (fake `endpoint` verdict); with the real forwarder on macOS and in the Windows CI step "Check the forwarder's store folders Windows" | stdio plan refused, `CreateApp` not called; HTTP plan unaffected; the real forwarder accepts what the desktop wrote; for the config route the verb was run on the stable copy's path |
| 6 | `aiConnectProbe` with the API off or another port live in main | no request is sent (transport spy), on apply and on Retry, any route |
| 7 | Forwarder fixtures: rev 5; a universal file with one rev 5 slice; `.rev` = 7 beside a signed rev 5 stable copy; a blocked Windows rename over a rev 5 copy | release build fails in `prepare-forwarder.js`; dev build has the stdio routes off; both stable-copy cases → `installFailed` |
| 8 | Packed manifest fixtures: the old args `serve --connection claude-desktop`; a tier field; the key in args; a wrong env name | `verify-forwarder.js` fails each; the good bundle passes the resolved-launch smoke |
| 9 | Bundle connect with a real minted key and no request from Claude | stays "key not confirmed"; no probe request; the clipboard still holds the key; `heldKey()` returns no key while Finish is open |
| 10 | Then one authenticated request with that key | "Connected", latch saved with the install identity, clipboard cleared |
| 11 | Latch: the registry record's `version` or `installedAt` changes while `isActive` stays true; then `isActive` false, then true | "Updated in Claude · key not reconfirmed"; then "Connected" |
| 12 | Bundle Reconnect: `CreateApp` fails after confirmation; crash after `aiConnectRetire`; `RevokeApp` fails | old hash is in `revokePending` in all three; row "Disconnected · Reconnect"; revoked on a later check |
| 13 | Copy or open fails after the save; the apply reply is lost; crash before the save, after the save, after the copy | the record survives with its retry action and its key is not revoked; a key with no record is revoked through the mint intent |
| 14 | Mint intent with no matching key on the first check, the key listed on the second; an unmatched intent 25 hours old | kept, then the key is queued and revoked; dropped |
| 15 | Disconnect on the Claude config route when the entry is no longer ours; refused HTTP Disconnect (`flow.test.ts:608`) | `conflict`, nothing queued, the key still works after the next check |
| 16 | Registry save fails or its folder fsync fails before a Disconnect's cleanup | the entry is not removed and no revoke is sent |
| 17 | Both Claude routes: config present then bundle plan; bundle present then config plan; both appear after setup | refused before mint in both orders; `conflict` at the check |
| 18 | Direct IPC `aiConnectApply` with `method: 'package'`, `tier: 'small'` | validation error |
| 19 | Extension record with our fingerprint and an unsigned status, signed build | the bundle is opened, Configure is not offered |
| 20 | Release then dev build on one profile | the release record is `conflict` in the dev build, nothing rewritten; two bundle copies with different names |
| 21 | One Other URL row and two Other Command rows, through the real renderer-to-main path: check, Retry, reconnect and disconnect **each kind**; restart | every row stays `method: 'manual'` with its `setup`; no `stale` or `notInstalled`; the other rows' hashes, ids and snippets unchanged |
| 22 | Manual and Manage views (Other, Claude without a bundle) | no key lookup on open; screen masked; Copy puts the real key on the clipboard; component state holds no key afterwards |
| 23 | Clipboard: copy again before and after the deadline, two sheets, account switch, unrelated text on the clipboard | only the latest generation is cleared; unrelated text untouched |
| 24 | Regressions kept | HTTP port healing, T2 orphan recovery, S1 transport mark |

### D2, signed alpha (macOS, Windows classic installer, Windows MSIX)

Prerequisite: a heart release that contains H1, `middleware.version` bumped to it, `WIN_PUBLISHER_SUBJECT` filled in. Record for each OS the Claude version and the forwarder's `version --json`.

1. **Install.** Connect from Anytype. Claude asks for the key before it enables the extension. After the paste the row turns "Connected" and the clipboard is empty.
2. **Windows: plaintext reaches the server.** A tool call succeeds. Claude's MCP log for the extension has no "encrypted value" line (claude-code #78296).
3. **Canary scan.** With a disposable key: `<command that prints the key> | node scripts/ai-connect-keycheck.js <dir>` over Claude's whole data folder and its logs folder, after the paste, after a Claude restart, after a failed authentication and after an extension update. Record file names only. Expected: no file. A hit in `Claude Extensions Settings` is the plaintext fallback: report it, it does not block.
4. **Revoke the canary** while Claude runs: the next tool call says "key rejected".
5. **Recovery.** Cancel Claude's install dialog → Open again works. Paste a wrong key → "key not confirmed", then Copy key and Configure fix it. Pick the home folder as `files_dir` → the server doesn't start; clearing the field fixes it.
6. **Update.** Install a bundle with a higher version over a working one: the row says "Updated in Claude · key not reconfirmed". Note whether Claude kept the value (D-S1), which registry fields changed, and the literal in `signatureInfo.status`.
7. **Reconnect:** Claude says "key rejected" at once; after pasting the new key in Configure the row is "Connected".
8. **Blank and chosen `files_dir`:** temp folder; uploads and downloads use the chosen one.
9. **Port change with Claude running:** tools work again within 5 s. **Quit Anytype:** "open Anytype" text, and the endpoint file is gone.
10. **Config route and Other Command:** connect, call a tool, Disconnect → "key rejected"; `claude_desktop_config.json` is `0600` on macOS and has no backup or temp sibling.
11. **D-S2:** Windows clipboard history and a macOS clipboard manager after Copy.

## 6. Decisions (product owner, 2026-11-28)

- **"Connected" on the bundle route is heart's existing `AppInfo.isActive`**, latched on the record (§3.3). `lastUsedAt` is not part of this work; it stays a later UI idea (showing key usage, for example on the Local API page). There is no heart phase besides H1.
- **Reconnect:** the old key is revoked at once; Claude stays disconnected until the new key is pasted.
- **Bundle tier:** always Full, no tier field. The Claude config route keeps the choice.
