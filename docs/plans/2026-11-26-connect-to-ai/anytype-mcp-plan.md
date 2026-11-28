# `anytype-mcp`: Go stdio forwarder with its own item file

**2026-11-27: no OS keychain on any OS (Roma).** One private file per connection replaces the keychain item everywhere; §0.1, §0.2, §3 and §13 are rewritten for it, and the passages that follow from it are changed in place.

Rev 4 (final), 2026-11-27. Design and implementation plan for the step after the POC. No code yet.

Rev 4 folds in Roma's last answers and the third, capped Codex review (18 findings; §12.3). Earlier rounds: §12.1 (38 findings) and §12.2 (41).

**Nothing was ever released.** The Go forwarder replaces the Node connector and the key files on this branch, before the first release. There are no existing connections, so there is no migration and no handling of old commands.

Sources read: this worktree (`feature/connect-to-ai-poc`, staged, not committed), heart `origin/develop` @ `0fcf5d1d7`, `anyproto/anytype-mcp` `main` and [PR #168](https://github.com/anyproto/anytype-mcp/pull/168) (open, on hold), Linear JS-9889, `research/go-proxy-keychain.md` ("research" below).

## 0. Decisions, threat model, changes

### 0.1 Decided by Roma

| | Decision |
|---|---|
| D1 | The binary lives in heart: `cmd/anytype-mcp`, in the middleware archive |
| D3 | File tools are ported to Go, as the second heart PR |
| D4 | The desktop switch waits for the file tools |
| D5 | One `0600` file per connection |
| D6 | Other apps run a stable copy on every OS |
| D7 | JS-9889 ships in the same release, right after the connector switch is on develop |
| N1 | One file holds key + account + port + tier + rev. No locator file |
| N2 | "Other app" gets a "Command" setup as a managed connection |
| N4 | No new signing mechanism: anytype-ts CI signs `anytype-mcp` with the tools and credentials it already uses for the app and `anytypeHelper` |
| N5 | No digest pinning of middleware archives |
| N3 | Nothing was shipped: no migration, no v1 key-file handling, no tombstone for old commands |
| N6 | The release workflow is unchanged. The gate is an alpha, repeated on the published release |
| N7 | The forwarder is signed earlier in the job, with the same tools and credentials |
| D8 | The npm `@anyproto/anytype-mcp` package stays as it is for now |

### 0.2 Threat model (applies to every section)

**In scope**

- The key at rest is one file per connection: mode `0600`, in a `0700` folder owned by the user (on Windows, an owner and DACL limited to the user). It is read and written only through the forwarder's verbs. Other OS users can't read, plant or replace it.
- No key in argv, the environment, logs, AI-app configs, or any file except its own item.
- No use of one account's key by a conversation started under another account.
- No lost revocations.
- The bearer is sent only to `127.0.0.1`.

**Out of scope: one residual, stated once.**

- A program running as the same user can read the item, redirect the bearer (the loopback port, a user-writable binary, the forwarder's own verbs), or run `serve --connection <id>`.
- The forwarder runs as its caller and inside its caller's sandbox, so it reads only what its caller could read and grants no extra access. That is why there is no keychain: an item only the forwarder could read would make it a confused deputy.
- Backups and file sync may copy the item. Disconnect revokes the key, and the grant bounds what it can do.
- The planned protection is heart-side caller binding (next phase, `caller-binding-plan.md`). Port squatting and app binding are follow-ups. JS-9889 is the hardening track for same-user attacks on Anytype itself.

### 0.3 Main changes in rev 4

1. **Migration and cutover machinery removed** (N3): the start-up pass, the v1 reader, the tombstone, the merge-order rules.
2. **A `serve` that starts without a readable item stays not connected** for its whole life. Restart is the recovery (§2.4).
3. **Durable bookkeeping from mint to revoke:** a mint intent before `CreateApp`, a recorded verb for every item change, revocation queued before `key delete`, and a pending revocation is dropped only when heart confirms it (§2.9).
4. **Two forwarder builds.** Development namespace by default; the production namespace only in the member that release and nightly CI pick (§1.1, §3).
5. **The folder names and the extension id never change** (§3, §5).
6. **Stable copy: the `.rev` file is written before the binary** (§4.3).
7. **The alpha gate fits the existing tag workflow** (§8.4).

## 1. Where it lives: heart `cmd/anytype-mcp`

Why heart (D1): the forwarder mirrors server rules that change with heart: session idle and caps (`core/api/server/mcp.go:41-56`), accepted protocol versions (`mcp.go:62`), the 404-on-expired-session contract (`mcp.go:386-391`). Developers get the binary from `update.sh` with no Go toolchain.

### 1.1 heart build and both packers

Today the matrix job tars only `$target` (`heart .github/workflows/build.yml:160-164`), the release job packs elsewhere (`.github/scripts/pack-release.sh:27-43`), and nightlies use another packer (`nightly.yml:191,203` → `makefiles/ci-pack-server.mk`).

| Step | Change |
|---|---|
| Build | New make targets `cross-compile-mcp-<os-arch>` for the 5 targets, each built twice: the default build (development namespace) and one with `-ldflags -X …=release` (production namespace). All five build with `CGO_ENABLED=0`; darwin needs no macOS host |
| Hand-off | `server-<target>.tar` holds three members: `<target>`, `<target>-mcp-dev`, `<target>-mcp-release` |
| Release packer | `pack-release.sh` adds `anytype-mcp-dev[.exe]` and `anytype-mcp-release[.exe]` to `js_<ver>_<os-arch>` |
| Nightly packer | `ci-pack-server.mk` copies each input **by exact name** into a fresh per-target folder (today's `cp ./$$OSARCH*` glob would match all three files) and stops on the first failed copy |
| Validation | Both packers: open the five final archives and assert member names, architecture, execute bit, static Linux linkage, each member's digest against its build output, and the namespace each forwarder reports |
| Tests | `go test ./cmd/anytype-mcp/...` runs natively on macOS, Windows and Linux |

### 1.2 Rules

- **No heavy imports.** A test fails when `go list -deps ./cmd/anytype-mcp` exceeds a set count (it must not pull `core/api/wrapper`: 447 packages, research §2).
- **`rev`.** One integer constant in the forwarder's source. It is bumped by hand in any PR that changes the forwarder's code, its dependencies or its Go toolchain. `version --json` prints `{version, commit, rev, namespace, impl: "go"}`. `rev` drives the never-downgrade rule (§4.2) and the bundle version (§5).
- **Item namespace** is a link-time constant (§3).
- **Naming.** heart already has `cmd/anytype` with an `mcp` verb (a server: research §2); the npm bin is also `anytype-mcp`. Desktop uses absolute paths only.

## 2. CLI and behaviour

```
anytype-mcp serve    --connection <id> [--files-dir DIR]
anytype-mcp key set      --connection <id> --expect absent|<fp>@<rev>     # one JSON payload on stdin
anytype-mcp key retarget --connection <id> --expect <fp>@<rev> --account <id> --port N --tier T
anytype-mcp key delete   --connection <id> --expect <fp>@<rev> --account <id>
anytype-mcp key check    --connection <id>                                 # one JSON line, never the key
anytype-mcp version [--json]
```

- `<id>` matches `^[a-z0-9-]{1,64}$` (`connect.mjs:29`, `keyFile.ts:23`).
- **No `--port`, `--tier` or directory override on any verb, and no test build.** Tests point `HOME` (`USERPROFILE` on Windows) at a scratch folder.
- **Environment.** The binary reads the home directory (`os.UserHomeDir`) and nothing else.
- No `header` verb: it would hand the raw key to any caller.

### 2.1 The item is the connection

`{"v":1,"rev":7,"key":"…","account":"<accountId>","port":31009,"tier":"full"}`

- `serve` sends the bearer only to `http://127.0.0.1:<item.port>/mcp/<item.tier>`.
- `rev` increases by one on every write. A precondition names both the key fingerprint and the revision, so two heals that started from the same state can't both win.
- A port change is `key retarget`: the forwarder rewrites its own item; main never needs the key again.

### 2.2 Framing, envelope and limits

| | Rule |
|---|---|
| Input | One JSON-RPC message per line, read with a `bufio.Reader`. Limit 8 MiB (heart's `MCPMaxMessageBytes`, `core/api/wrapper/mcp.go:57-61`). An oversized line is skipped to its newline and answered with `-32600`; the next line is served |
| Envelope | Checked before anything else (cancellation, initialize, local tools, forwarding). The reserved members are exactly `jsonrpc`, `id`, `method`, `params`, `result`, `error`. A member that differs from one of them only by letter case (`ID`, `Method`) makes the frame invalid: `-32600`, nothing forwarded, nothing run. heart decodes into a Go struct, which matches names case-insensitively (`wrapper/mcp.go:300-336`) |
| Batches | A JSON array → one `-32600` with `id: null` |
| Output | Complete lines only, one writer. A reply is validated before it is written |
| IDs | Kept as raw bytes |
| Reply body | Success up to 128 MiB, error bodies up to 64 KiB |
| Headers | `Content-Type: application/json`, `Accept: application/json, text/event-stream`. heart answers JSON only (`mcp.go:433`); an event-stream reply is an upstream failure. A contract test pins this |
| Network | Literal `127.0.0.1`, no redirects, `Transport.Proxy = nil` |
| Deadlines | 120 s per exchange including the body; 10 min for file transfers |

### 2.3 Protocol versions

heart's HTTP delivery accepts the header only for 2025-06-18 and 2025-11-25 (`mcp.go:62,278-281`) and refuses batches.

- Known client versions: 2024-11-05, 2025-06-18, 2025-11-25 (the vendored proxy's list: `vendor/anytype-mcp/cli.mjs`, `Pe`).
- The client sees its requested version if known; else the newest known one below it; else heart's. A 2025-03-26 client gets 2024-11-05, which has no batches.
- The HTTP header carries the version heart answered.

### 2.4 Start, pinning, live recovery

- **Start.** One read of the item.
  - Read ok: pin `account` and `tier` for the life of the process.
  - **Anything else (no item, a §3 check failed, unreadable):** not connected **until the process is restarted**. There is no owner to pin, so this process never adopts an item later. After connecting, the AI app is restarted (the POC's `nextStep: 'restart'` already says so).
- **Not connected:** every request gets `-32001` with "Open Anytype ▸ Settings ▸ AI apps and reconnect" (as `connect.mjs:55-72`).
- **Refresh.** Before a request, if the last read is older than 5 s, read the item again. The same rule runs after a connection refusal and after a 401. The whole new snapshot is compared:
  - other account, other tier, no item or an invalid item → not connected until restart;
  - the item can't be read right now (a §3 check failed, an I/O error) → the last snapshot stays: that proves nothing, and heart still refuses a revoked key;
  - same account and tier → its port and key are used from now on. A changed key on a curated tier opens a new session with the reset warning (§2.5).
- A request that got a 401 fails and is never replayed. A refused request (nothing was sent) is retried once.
- The 5 s window is part of the residual in §0.2: a client may still use the old port for up to 5 s after a port change.

### 2.5 Dispatch, bounds, cancellation, sessions, shutdown

- **Reader never blocks.** It validates and classifies each line.
- **Bounds.** 4 workers (heart refuses the ninth call in flight per key: `mcp.go:53-55`) and a queue of 32 requests. A request arriving at a full queue is answered at once with `-32000` "busy". At most 32 replies wait for stdout; if stdout makes no progress for 30 s (measured per 64 KiB piece, not per line) it is treated as broken.
- **Gate.** Before a successful `initialize`, only `initialize` and `ping` run. This covers the full tier and the local file tools.
- **`notifications/cancelled`** is handled by the reader even when the queue is full: it cancels the queued or running request and suppresses its reply, up to the moment the writer turns to that reply. A cancelled queued request never starts. Ids are matched by value, whatever their JSON spelling.
- **Other notifications and client responses** are forwarded; heart answers 202 (`mcp.go:362-372`); nothing is written.
- **Sessions (small, large).** On a 404 for a known session (`mcp.go:386-391`):
  - one shared renewal: `initialize` with the saved params and no session id, then `notifications/initialized`, both awaited;
  - a reset flag stays set until the warning line ("session expired, re-read your targets") has been written to stdout; every `tools/call` received before that write returned gets the error and does not run, and a call that was admitted on the old session never runs on the new one;
  - the renewal is installed only if the stale session is still the current one, and its own replies are checked like any other;
  - every session is owned by the snapshot that opened it. Every authenticated follow-up on a session (the renewal's notification, any `DELETE`) is sent only while the item still names the port and key that opened it; otherwise it is skipped and heart's idle timeout ends the session;
  - only the written warning clears the gate. A client `initialize` does not;
  - a failed or replaced `initialize` ends any session id it received.
- **Full** is stateless (`mcp.go:378-384`).
- **Shutdown.** One hard deadline of 10 s from the trigger to exit, whatever is still blocked: the drain, stdout, the session `DELETE`s and stderr (the logger never blocks).
  - stdin EOF: stop reading, finish accepted requests within the deadline, exit 0; exit 1 if replies were lost.
  - Workers hand off any session id they already hold before cleanup closes, and the first read of the item never delays a signal.
  - SIGINT, SIGTERM or broken stdout: cancel everything, attempt the `DELETE`, exit. `SIGPIPE` is ignored so a closed stdout reaches this path.

### 2.6 One answer for every live request

Rule: every request that was not cancelled gets exactly one reply carrying its own id. Notifications and client responses get none.

| Upstream result | `tools/call` | Other requests |
|---|---|---|
| 200, JSON-RPC message with this request's id | relayed | relayed |
| 200 whose body contains this connection's key in its bytes, in any decoded string or in a member name | `result.isError`: withheld | `-32603` |
| 200 with another id, 202 for a request, an unreadable body | `result.isError`: outcome unconfirmed | `-32603` |
| 400 with a JSON-RPC error, whatever its id (`mcp.go:359-361`) | error with this request's id and heart's code and message; upstream `data` dropped | same |
| 400 / 408 / 413 in heart's REST shape (`mcp.go:263-266`) | `-32600` with heart's message | same |
| 401 after the refresh | `-32001`, "reconnect in Anytype" | `-32001` |
| 403 | `result.isError`: the key's access doesn't allow this | `-32001` |
| 404 unknown session | renewal (§2.5) | renewal, then retried once |
| 404 no `/mcp` route | `-32601`: this Anytype is too old | same |
| 429 | `result.isError`: busy, try again | `-32603` |
| 5xx | `result.isError` with the redacted message | `-32603` |
| Refused before sending | retried once after the refresh; then `-32001`, "start Anytype" | same |
| Lost after sending, truncated body, deadline | `result.isError`: **outcome unconfirmed, check before retrying**; never replayed | `-32603` |

### 2.7 Key verbs

- **Lock.** Every mutating verb holds an exclusive lock on `<items folder>/<id>.lock` (§3) across read, compare, write and read-back. It serialises cooperating Anytype profiles only (§0.2).
- **Precondition is mandatory:** `absent` or `<fp>@<rev>`; `retarget` and `delete` also need the owning `--account`. A mismatch is exit 5 and changes nothing.
- **`key set`** reads exactly one JSON object `{"key","account","port","tier"}` from stdin (at most 16 KiB, nothing after it), writes, reads back, prints `{"ok":true,"fingerprint","rev"}`. The fingerprint is the registry's (`digest.ts:8-9`).
- **`key check`** prints `{"present","fingerprint","rev","account","port","tier","store"}`, or the store's state when there is no item.
- **A write the store took but could not confirm** is exit 1 with `{"ok":false,"unconfirmed":true}`, never exit 7: the desktop reconciles with `key check` (§2.9) before it releases or revokes anything.

### 2.8 Exit codes and logging

| Code | Meaning |
|---|---|
| 0 | ok |
| 1 | internal error; after a write, `unconfirmed` (§2.7) |
| 2 | usage |
| 3 | no item for this connection |
| 4 | reserved, never returned |
| 5 | precondition failed |
| 6 | invalid input |
| 7 | nothing was read or written, try again: `denied` (a folder or the item failed a §3 check) or `unreachable` |

stdout: JSON-RPC or one JSON line. stderr: one line per event, control characters replaced, at most 512 bytes; lines are dropped rather than block. Never the key, a header, a body or the environment.

### 2.9 Bookkeeping from mint to revoke

The registry is saved before the outside world changes. This extends the POC's existing rules for unconfirmed deliveries and revocation (T5, U2, V10, W9 in the earlier adjudications); it adds no second mechanism.

**Before a key exists.** The renderer asks main to save a **mint intent** `{accountId, key name, time}` before it calls `CreateApp`. Main clears it when `aiConnectApply` commits or when the renderer releases the pending key. If Anytype dies in between, the next successful check of that account finds a key with that name, created at or after that time (`AppInfo.createdAt`), that no record manages, and queues it as an orphan (`orphanHashes`) for revocation.

**Every item change records its verb and what it should leave behind:**

| Verb | Saved first | Reconciled by `key check` after a lost receipt |
|---|---|---|
| `key set` | a candidate: the new key's `appHash` and fingerprint (the record's `unconfirmed` list: `.phase1-handoff.md:65`) | item has the new fingerprint → promote; the old key goes to `revokePending`. Item has the old one → drop the candidate; the new key goes to `revokePending` |
| `key retarget` | the intended port, tier and `rev` | same key either way: **nothing is revoked**. The record takes whatever port, tier and `rev` the item has |
| `key delete` | every hash of the record into `revokePending`, and the record marked removed | no item → done. An item of another account → left alone. The revocation stays queued either way |

- A lost receipt is `unconfirmed`, as for CLI deliveries today (`.phase1-handoff.md:52`): the renderer neither releases the new key nor revokes the old one until main settles it.
- A new "Command" record is saved with its id and candidate before `key set`.
- **A queued revocation is dropped only when `RevokeApp` returns success or "not found".** A key list that merely lacks the hash proves nothing (heart skips grant files it can't read). Today the renderer skips the call for a missing row (`flow.ts:738`) and main prunes by absence (`index.ts:825`); both change.
- Nothing is settled while a delivery may still be running (U2).

## 3. Item store

One store on every OS (D5): one private file per connection and OS user, under the user's home. No OS keychain anywhere (§0.2).

**Layout.** `<home>/.anytype/ai-connect/items/<id>.item` for the release namespace, `…/items-dev/<id>.item` for the development one; `<id>.lock` sits beside the item. Home comes from `os.UserHomeDir()` and nothing else.

**Namespace is fixed when the binary is built, and development is the default.** The folder name is a link-time constant and never changes:

- `anytype-mcp-dev` (the default build): `items-dev`. `update.sh` installs this one, so a local desktop build can never create or read a production item.
- `anytype-mcp-release`: `items`. Only `update-ci.sh` in the release and nightly workflows picks it.
- `prepare-forwarder.js` checks `version --json`: a signed build must carry the release namespace and an unsigned one the development namespace; otherwise the stdio routes are disabled in that build.
- There is no flag, so main, the stable command and Claude's bundle can't disagree.

**Folder rule**, checked before anything else on every verb and every `serve` read. No other OS user may be able to read, rename or replace a folder on the item path. A check that fails reads, writes and deletes nothing (exit 7, `denied`, one stderr line naming the rule and the path).

- The chain starts at home: home, `.anytype`, `ai-connect` and the items folder must each be a real directory, not a link.
- A missing Anytype folder is created private and synced in its parent; reading creates nothing, and home is never created.

**Item rule.** The item must be a regular file with one link; the file actually opened is checked through its handle. At most 4 KiB is read; anything longer is not an item.

**Write**, under the lock: this connection's stale temp files are removed; the item is encoded without HTML escaping and must decode back to itself before anything is written; a new private temp file is written and synced, then renamed over the item and made durable. A failure before the rename removes the temp file and is exit 7: nothing was written. A failure after it is `unconfirmed` (§2.7).

**Delete**, under the lock: the connection's temp files are removed first, then the item, then the folder is synced. A leftover that can't be removed is exit 7 with the item untouched; a failed sync after the unlink is `unconfirmed`.

**A receipt means** the change is durable and the item is the only file that holds this connection's key, or no file at all after a delete.

**Errors.** No file is `absent`. A failed rule is `denied`. Everything else is `unreachable`. Both are exit 7 and never end a running connection (§2.4).

**Per OS**

- Unix: home is owned by the user; its mode is not judged (a home its group can write is a normal setup, and whoever can write a home can already replace the user's shell files). `.anytype`, `ai-connect` and the items folder are owned by the user and not writable by group or others; the items folder is exactly `0700` and the item exactly `0600`. Access goes through an `os.Root` on the items folder.
- macOS, in addition: no ACL at all on the three Anytype folders, the item or a new temp file (macOS evaluates ACL entries before the mode bits; Finder's sharing writes inheritable allow entries). Home may carry deny entries only: every Mac home has `everyone deny delete`. The ACL is read without cgo.
- Windows: no component is a reparse point. Home must not let anybody but the user, SYSTEM and Administrators delete or rename its children or take it over. `.anytype` and `ai-connect` grant access only to the user, SYSTEM and Administrators (inherited entries are fine, so a standard profile passes). The items folder and the item carry exactly one protected DACL entry, full access for the user, who is also the owner. The replacement is a POSIX-semantics rename, so an open reader never blocks it; a handle that denies delete sharing is retried for 2 s; the item is flushed before the receipt.

There are no prompts anywhere, and no `--interactive` flag.

## 4. Path, verification and signing

### 4.1 Locations

| Location | Used by |
|---|---|
| In-app `<appRoot>/dist/anytype-mcp[.exe]` (asar-unpacked) | main: key verbs, source of the copy |
| Stable copy `~/.anytype/bin/anytype-mcp[.exe]` (D6) | every command Anytype writes into another app's config |
| Inside `Anytype.mcpb` | Claude's extension (§5) |

- **Support check first.** `ensureInstalled` and key writes run only where stdio is supported: not Snap, not Flatpak (`proxy.ts:95-101`), not an AppImage in portable-home mode. Those keep the URL routes. A normal AppImage becomes supported.
- **A build whose metadata says `signed: false`** (local builds) installs to `~/.anytype/bin-dev/`, never replaces the production copy, and names its Claude bundle `anytype-dev`, so its extension is a separate one.

### 4.2 One metadata file, one rule

**Metadata.** `build-mcp.js` writes `electron/json/aiConnect.build.json` after the forwarder is signed and after the bundle is packed and signed. It is the only writer and it runs before electron-builder packs `app.asar`:

```json
{ "signed": true,
  "forwarder": { "rev": 3, "sha256": { "darwin": "…", "win32-x64": "…", "linux-x64": "…", "linux-arm64": "…" } },
  "mcpb": { "sha256": "…", "signerFingerprint": "…", "version": "2.3.0" } }
```

- Only the entries for the build's OS are present; Linux has one per architecture.
- Main reads it from inside `app.asar` (not from `env.appRoot`, which points at the unpacked folder: `index.ts:1211`).
- A signed build with missing metadata refuses the stdio routes.
- It replaces `dist/mcp/mcpb.json` (`proxy.ts:42-77`).

**Rule, the same on every OS:**

| Binary | Rule |
|---|---|
| In-app | its sha256 equals the metadata, checked before main pipes a key to it or copies it |
| Stable copy | equal to the in-app hash → use. Otherwise read the number in `~/.anytype/bin/anytype-mcp.rev` (written by the installer): higher than ours → leave it (never downgrade); anything else → replace. **Linux exception (Roma, C2 of `caller-binding-plan.md`):** once caller binding ships, a Linux key is bound to the digest of the running forwarder, so on Linux the running Anytype always installs its own forwarder as the stable copy (an older Anytype installs its older forwarder); never-downgrade holds on macOS and Windows only |
| `.mcpb` | the bytes main delivers are the bytes it hashed, in memory, against the metadata |

- macOS and Windows add one check before leaving a higher-`rev` copy alone: its code signature must be ours. Linux has no signature to check.
- The `.rev` file and the copy are user-writable. Tampering with them is the §0.2 residual.

### 4.3 Stable-copy update

- One installer at a time: an exclusive lock on `~/.anytype/bin/.lock`, shared by all channels.
- Folder `0700`, file `0755`, no links on the path.
- **The `.rev` file is written first, the binary second.** If the update dies in between, `.rev` names the new revision while the old binary is still there: an older Anytype leaves it alone, and the newer one sees a different hash and finishes the job. The reverse order could let an older Anytype overwrite a newer binary.
- **POSIX:** write `.rev`; temp file in the folder, fsync, rename over.
- **Windows:** write `.rev`; write the temp file; rename the current exe aside; rename the temp in.
  - First rename blocked: keep the current file **only if it passed the §4.2 rule before**; otherwise the stdio routes are unavailable until the next start succeeds.
  - Death between the renames: the next start restores the set-aside file or installs afresh.

### 4.4 Signing: the existing tools, earlier in the job (N4)

The forwarder must be signed before `bun run build`, because `build-mcp.js` packs the signed bytes into the `.mcpb`. `scripts/prepare-forwarder.js` runs first in `build:electron`, so CI, nightlies and local `dist:*` all go through it.

| Where | What it does |
|---|---|
| macOS CI (tag and nightly) | `lipo` heart's `darwin-arm` and `darwin-amd` release-namespace binaries into one universal file. Sign with `codesign` and the Developer ID identity the job already imports for the app; that import step moves before the frontend build (`build.yml:216,234`, `nightly.yml:383,390`). Flags: `--options runtime --timestamp --identifier com.anytype.mcp`, **no entitlements** |
| Windows CI | Call the existing hook `electron/hook/sign.js` on `dist/anytype-mcp.exe`, unchanged: same AzureSignTool command, same secrets, same RFC 3161 timestamp (`sign.js:8-21`). The step gets the env the packaging step already has (`build.yml:265-269`) |
| Linux | Nothing to sign; per-arch files stay in `linux-amd/` and `linux-arm/` |
| Local build | Uses the development-namespace binary `update.sh` put in `dist/` as it is; metadata says `signed: false` |

Why no entitlements on macOS: the forwarder is signed with the hardened runtime and no entitlements of its own (it is excluded from electron-builder's `entitlementsInherit` by pre-signing it and listing it in `signIgnore`); it never needs any.

**So the signed bytes survive packaging:**

- macOS: the exact path goes into `mac.signIgnore` (`package.json:1045-1052`). `electron/hook/beforebuild.js` copies the forwarder per arch on Linux only.
- Windows: electron-builder signs every `.exe` under `app.asar.unpacked` (`node_modules/app-builder-lib/out/winPackager.js:253-262`). `sign.js` gets one early return for `anytype-mcp.exe`, which is already signed.
- `afterSign` **only verifies**, before it notarizes: the packaged forwarder's hash equals the metadata and the one inside the packaged `.mcpb`; on macOS also the DR, the runtime flag and empty entitlements. Nothing is signed or rebuilt after the app is sealed.
- **If spike S2 shows `signIgnore` can't keep the signature:** the app ships the forwarder only inside the `.mcpb`, and main extracts it.

**Checks on the finished packages:**

- macOS: `codesign --verify --deep --strict` on the app; then the forwarder, copied out and given a quarantine attribute, must run on a clean Mac (this proves notarization covers it without reading notary logs).
- Windows: Authenticode `Valid`, expected publisher, **a trusted timestamp**, and equal hashes for the app's and the bundle's forwarder.
- "Cleanup artifacts Windows" also removes `dist/anytype-mcp.exe` (`build.yml:289-294`).

**The Claude bundle (`Anytype.mcpb`), 2026-11-28.** Signed with the Windows code-signing certificate in Azure Key Vault (the one AzureSignTool uses: `E=association@anytype.io, CN=Any Association, O=Any Association, L=Zug, S=Zug, C=CH`, issued by GlobalSign GCC R45 CodeSigning CA 2020, RSA 4096, valid to 2027-07-03), remotely: the key never leaves the vault. No `MCPB_SIGN_*` secret exists or is needed.

- **Who.** `scripts/build-mcp.js` with `MCPB_SIGN_REQUIRED=1` calls `scripts/sign-mcpb-azure.js`; without the switch the bundle stays unsigned. Inputs: the five `AZURE_*` secrets of `sign.js` (service principal: `certificates/get`, `keys/sign`, as AzureSignTool) and the repository variable `WIN_PUBLISHER_SUBJECT`.
- **How.** Client-credentials token (`login.microsoftonline.com/<tenant>/oauth2/v2.0/token`, scope `https://vault.azure.net/.default`) → `GET <vault>/certificates/<name>?api-version=7.4` (`cer` = the leaf, `kid` = the versioned key, which must be in the same vault) → the SignedData `mcpb sign` builds (node-forge, detached, SHA-256, rsaEncryption, leaf then chain) but with the authenticated attributes in DER order (contentType, signingTime, messageDigest; review F8: mcpb keeps the given order, which Bouncy Castle rejects), in two passes with one fixed signingTime: the first captures the SHA-256 of the DER of the authenticated attributes, `POST <kid>/sign` (`RS256`) signs it, the second pass takes that signature. A test proves the result is mcpb's own `signMcpbFile` output with the same key, certificates and second except for that order, and that a verifier which re-encodes the attributes accepts ours and rejects mcpb's. A non-RSA key is refused. Requests: 30 s per attempt, three attempts for network errors, 408, 429 (Retry-After) and 5xx, no redirects; errors name the request, the HTTP status and Azure's error code only, and every input value, the token and the key id are redacted.
- **Chain.** `scripts/certs/globalsign-codesign-chain.pem`, pinned by SHA-256 in the signer: GlobalSign GCC R45 CodeSigning CA 2020 (from the leaf's AIA URL, equal to the copy in the released Authenticode signature) and GlobalSign Code Signing Root R45 cross-signed by GlobalSign Root CA - R3. The cross certificate is needed on macOS: the self-signed R45 root is not in its trust store, R3 is (`security verify-cert -p codeSign` with leaf + intermediate fails, with the cross certificate it passes, offline too). A leaf the intermediate didn't sign fails with "renewed under another CA".
- **Checks before the bundle is kept.** The signer's subject, formatted as Windows prints it (RDNs reversed, labels `E`, `S`), must equal `WIN_PUBLISHER_SUBJECT` — a repository variable (Roma, 2026-11-28: from CI configuration, not a constant in the code), read by one function in `verify-forwarder.js` for both checks and passed to "Build frontend", "Package and publish Other" and "Verify the packaged forwarder Windows"; empty fails closed. Value for the certificate in use: `E=association@anytype.io, CN=Any Association, O=Any Association, L=Zug, S=Zug, C=CH`; Code Signing EKU; valid now. After signing, the signer's own `verify`: one block at the end and mcpb's `extractSignatureBlock` agrees; node-forge parses it as mcpb does and its fingerprint of the signer is the SHA-256 of the DER; one SignerInfo for the first certificate, messageDigest = the archive's SHA-256, the RSA signature over the attributes; the chain against the OS trust store for code signing (macOS `security verify-cert` with one `-c` per certificate, Windows mcpb's own `verifyCertificateChain`, three attempts) must be `signed`. Linux builds no bundle; on any other host only the signature is checked.
- **Metadata.** `mcpb.signerFingerprint` = SHA-256 of the leaf's DER, lowercase hex, the value mcpb's verifier reports as `fingerprint`, which `claudeDesktop.ts` compares with the installed extension's `signatureInfo`.
- **Workflows (review F9/F10, 2026-11-28).** The Azure secrets reach only two steps before packaging: "Sign the forwarder Windows" (`node scripts/prepare-forwarder.js`: checks, the existing `sign.js` hook, signature check) and "Sign the Claude Desktop bundle" (`node scripts/build-mcp.js --sign`, tags on macOS and Windows; in `nightly.yml` behind `NIGHTLY_MCPB_SIGN_REQUIRED`). "Build frontend" gets none: `MCPB_SIGN_DEFERRED=1` keeps the release bundle unsigned for the signing step, `prepare-forwarder.js` keeps a Windows exe already signed by our publisher instead of calling the hook, and the forwarder's `version --json` probe runs with a minimal environment. The signing step requires the bundle to be the one the metadata describes, signs and verifies it, and rewrites `mcpb.sha256` / `mcpb.signerFingerprint` (`signed`, the forwarder's flavour, stays; a release-namespace build whose bundle has no signer fails `verify-forwarder.js` at packaging). "Package and publish Other" gets the Azure values on Windows only. The steps that wrote and removed PEM files are gone.
- **What Claude Desktop does with it (found 2026-11-28).** Claude Desktop 6.28899.6 bundles mcpb 2.1.2's `verifyMcpbFile` verbatim, which can't return `signed` for any file: node-forge 1.x has no PKCS#7 verify (`p7.verify()` throws "not yet implemented" and the catch returns `unsigned`), and on macOS it writes the chain to one file and passes one `-c`, from which `security` reads the leaf only. Until Anthropic fixes that, every signed bundle shows as unsigned in Claude and records `signatureInfo.status: "unsigned"` with no fingerprint, so `claudeDesktop.ts`'s signer check (`signerOf(record) === bundle.signerFingerprint`) never passes on a signed build and the extension reads `outdated`. Needs a decision before the first signed release (open).

### 4.5 Packaging lists, nightlies

- Add the binary to `package.deps.json`, `build.files` and `asarUnpack` (every `dist:*` script regenerates `build.files`: `package.json:32-40`). A test asserts the packaged app contains it through the CI and the local path.
- `update.sh` takes `anytype-mcp-dev`; `update-ci.sh` takes `anytype-mcp-release`. Both store it as `anytype-mcp[.exe]`.
- **PENDING (Roma, review Q12):** rev 4 said nightlies use the same signing inputs as a release (`MCPB_SIGN_REQUIRED=1`). As built, the default is the opposite: a nightly ships no `.mcpb` (Claude uses the config route there), and the repository variable `NIGHTLY_MCPB_SIGN_REQUIRED=1` flips it: the nightly then signs through Azure Key Vault as a release does (§4.4) and fails without a valid signature.
- Each build resolves its heart archives once and uses that set for every architecture.

### 4.6 How adapters find it

`forwarder.ts` replaces the command builders (`proxy.ts:103-126`): `bundled(env)`, `stable(env)`, `ensureInstalled(env)`, and `serveCommand(env, id)` → `{ command: stable(env), args: ['serve','--connection',id] }`. No `env` field: preview, install, digest and heal use this one shape.

## 5. Claude Desktop

Today's `.mcpb` is a `node` bundle (`electron/mcp/manifest.json:9-13`) that Claude runs in its own process (research §1).

**Primary (macOS, Windows): a `binary` bundle with the forwarder inside.**

```json
"server": {
  "type": "binary",
  "entry_point": "server/anytype-mcp",
  "mcp_config": { "command": "${__dirname}/server/anytype-mcp", "args": ["serve", "--connection", "claude-desktop"] }
}
```

- The manifest is generated per OS build from the real payload name; `compatibility.platforms` names that OS only. Linux builds no bundle.
- `build-mcp.js` empties `dist/mcp` first, stores the binary with mode `0755`, and refuses an unsigned binary on a signed build.
- **Version = `2.<rev>.0`.** A forwarder fix raises `rev`, so the bundle version rises and the existing `outdated` flow replaces the installed extension. The desktop accepts only an extension at its own version or higher.
- Size: about 12 MB on macOS, 6 MB on Windows (estimates from research §6), under `MAX_BUNDLE_BYTES` (`proxy.ts:34`).

**Config route** (`mcpServers.anytype = serveCommand(env, 'claude-desktop')`): the only route on Linux; on macOS and Windows the route when the bundle can't be used or the user picks it under Advanced.

- It needs no extension. Today it calls `keyFileRefusal`, which demands a verified extension on signed builds (`claudeDesktop.ts:178-197,643`); that guarded a key file and is dropped for this route.
- An Anytype extension that is installed and enabled as well → the plan is refused with "remove one of the two".
- Written only while Claude is closed.

**Primary-route eligibility** stays: a verified extension (id, version, signer) before `key set`.

**If spike S1 fails on an OS,** that OS uses the config route. No launcher, no command outside the bundle.

**When a forwarder version must be withdrawn** (a security fix): raise `rev`. Old copies can still read items, so the release that carries the fix also marks every stdio connection `reconnect`, which revokes its key and mints a new one.

**The identifier `com.anytype.mcp`, the item folder name and the extension id never change.** An installed extension and a desktop from different channels can then never disagree about which item a connection means. A change of identity would be a new connection scheme with its own extension id; it is not part of this plan.

## 6. Full-tier file tools (D3, D4)

`upload_local_file` and `download_file` are ported in the second heart PR; the desktop switch waits for them.

- Acceptance: PR #168's file tests and the lifecycle tests that cover them.
- heart wins a name collision, in the listing and in dispatch.
- **A transfer runs to its end on the connection snapshot it started with.**
  - A valid receipt from heart is honoured even if the key was rotated meanwhile.
  - A receipt lost after the upload was sent is "outcome unconfirmed"; an upload is never replayed.
  - A 401 or refusal on a `/v2` file request triggers the §2.4 refresh for the next transfer.
- **Default folder is per connection:** `~/.anytype-mcp/files/<connectionId>`, so one connection can't upload another connection's download by name. `--files-dir` is the user's explicit choice of a shared folder.
- Full tier only. `ANYTYPE_MCP_FILES_DIR` is not read.
- Kept: root confinement, no-follow open, no overwrite, `dry_run`, cleanup of an unfinished download, the 10-minute deadline, cancellation.

## 7. Replacing the Node connector on this branch

Nothing was released (N3), so this is a replacement inside the feature branch, not a cutover. No file, command or connection from the Node connector needs to keep working.

### 7.1 Removed

- `electron/mcp/connect.mjs`, `vendor/anytype-mcp/`.
- `keyFile.ts` as a key store: the v1 file format, its reader and writer, the key-file gate (`keyFileRefusal`, `claudeDesktop.ts:178-197`). What stays is the folder `~/.anytype/ai-connect/` for the delivered bundle copy. It also holds `items/` and `items-dev/`, written only by the forwarder; anytype-ts never reads or writes them.
- `wrapperCommand`, `plainProxyCommand` (`proxy.ts:103-126`); `wrapperReady` and the wrapper-path heal (`claudeDesktop.ts:201-208,952-970`): the stable command never moves.
- The `cli` / `connect` sources in `scripts/build-mcp.js`; `electronAsNode` (`testEnv.ts:50-68`); `connect.test.ts`; `dist/mcp/mcpb.json`.
- Guards: a test greps `electron/`, `src/`, `scripts/` for `ELECTRON_RUN_AS_NODE`; a packaging test asserts no `.mjs` under the packaged `dist/mcp`.

### 7.2 "Other app": Command as a managed connection (N2)

- The sheet offers two setups:
  - **URL and key** (unchanged): a manual record, key shown once, no item file.
  - **Command** ("the key stays in a private file in your Anytype folder, not in the app's settings"): `aiConnectApply` with `method: 'command'`, which already carries the key (`validate.ts:120-126`).
- **Identity.** Main allocates `other-<8 hex>` once, on creation. `aiConnectApply` gains an optional `connectionId`: a reconnect names the existing record, and main checks it against the account and `expectedHash`. Two Command records never affect each other.
- **Routing.** Records with `method: 'command'` are handled by their own id in apply, update, check and remove, **before** any app detection. Today those paths need a detected target (`index.ts:423,715,913`) and "Other app" has none (`detect.ts:716`).
- **Adapter:** `check` = `key check`, `update` = `key retarget`, `remove` = `key delete`.
- **Snippet.** `AiApplyResult` ok carries `steps`; the renderer keeps them (today it drops them: `flow.ts:1193`), and Manage rebuilds the snippet from the record at any time:

```json
{ "mcpServers": { "anytype": { "command": "<home>/.anytype/bin/anytype-mcp", "args": ["serve", "--connection", "other-1a2b3c4d"] } } }
```

- Not offered where stdio is unsupported. Option C reuses this record type.

## 8. Tests and release gates

### 8.1 heart (Go)

- **Against a fake heart**, everything in §2.2–2.6. In particular:
  - envelope: `ID`, `Method`, `Params` variants → `-32600`, zero upstream requests, zero local side effects;
  - an oversized line followed by `ping`; a large integer id; a batch;
  - a 202 for a request, a 200 with another id, a 400 with `id: null` → one reply with the right id;
  - expiry discovered by `ping`, then a `tools/call`; concurrent 404s open one session;
  - 33rd queued request → busy; a cancel arriving at a full queue;
  - stdout stalled, then closed, with stdin open → exit within the deadline, one `DELETE` attempt;
  - a dropped write receipt; a 401 whose body stalls.
- **Refresh and pinning:**
  - a port move with the old port still answering 401 → the new port is used;
  - another account in the item → not connected;
  - a start with no item (and one with a store that fails a check), then another account connects → the same process sends no request to heart.
- **Key verbs:** two real processes on one connection (set/set, set/delete, two retargets from the same `rev`); every exit code; each binary reports its namespace, and the dev and release builds use different folders; exit 7 always means nothing was written.
- **Store**, on the macOS, Windows and Linux runners, always under a scratch home: a round trip; created modes (`0700`, `0600`; on Windows the exact descriptor); every refusal (an item or folder link, an ancestor link, wrong modes, a second hard link, a FIFO or a directory at the item path, an extra Windows DACL entry, a wrong owner); a failed rename leaves the old item and no temp file; a stale temp file is removed and never read; an unreadable folder is exit 7 for every verb and keeps a running `serve` on its snapshot.
- **Secrets:** the canary key appears in no stdout, stderr, argv or environment.
- **File tools:** §6, including rotation before and after heart commits an upload, and two connections' folders.
- **Integration, in CI** (a job that builds `grpcserver`): the built child over real pipes with an MCP client against `heartboot`: initialize → `notifications/initialized` → `tools/list` → a read and a write per tier → file round trip → revoke the key → the 401 reply.
- **Guards:** dependency count; protocol constants; `tools/list` parity.

### 8.2 anytype-ts (vitest)

- `forwarder.test.ts`: the §4.2 rule per OS (equal hash, higher `.rev`, lower, missing, Linux per arch), the §4.3 swap including a stop right after `.rev` is written and right after the binary rename, followed by an older build starting; unsupported packages do nothing; metadata read from the asar path; namespace and `signed` must agree.
- `keyStore.test.ts`: stdin payload, no key in argv, exit codes, exit 7 never deletes.
- **Bookkeeping (§2.9):** for `set`, `retarget` and `delete`: the helper dies right after the store write, and main dies before the registry save. Afterwards heart still accepts a retargeted key, rejects a disconnected one, and no live key is revoked. Anytype dies right after `CreateApp` → the next check revokes that key. A key list that omits a pending hash doesn't clear it.
- Claude Desktop: bundle version from `rev`; config route with no extension on a signed build; refusal with both; one command shape.
- Other: **two** Command records through the real renderer-to-main flow; reconnect, port change and disconnect touch only the chosen one; Manage rebuilds the snippet.
- Build: clean and incremental builds produce metadata that verifies their own package, including Linux arm64.

### 8.3 Packaged smoke, signed builds

| OS | Checks |
|---|---|
| macOS (arm64, x64) | connect, after an update, from Claude's unpacked copy and from the stable copy; move Anytype.app; a local build and the installed release connect the same app in either order without touching each other's item |
| Windows (NSIS; Claude classic and MSIX) | sleep and resume; update Anytype while a config-route client runs the stable copy |
| Linux (deb, AppImage, portable-home AppImage) | stable copy; a nightly then a stable build on one home (no downgrade) |
| all | the key is in no file under `~/.anytype` except its own `0600` item, no AI-app config, no `ps` output, no log |

### 8.4 Release gates

The release workflow is unchanged (N6). It builds on a tag and requires the tag to equal the `package.json` version (`build.yml:103-119`), so the gate uses two commits, as the alpha process already does:

1. **Alpha commit:** version `X.Y.Z-alpha`, the **released** middleware (no nightly), tagged `vX.Y.Z-alpha`. The gates run on this build.
2. **Release commit:** changes only the `version` line of `package.json`, tagged `vX.Y.Z`. Before tagging, `git diff <alpha>..<release>` must show that one line.
3. The same gates are repeated on the published release before it is announced.

Routes that must pass, per OS:

| OS | Claude bundle | Claude config | Other "Command" |
|---|---|---|---|
| macOS | yes (config instead, if S1 failed there) | yes | yes |
| Windows | yes (same) | yes | yes |
| Linux deb / rpm / AppImage | not built | yes | yes |
| Snap, Flatpak, portable-home AppImage | — | **expected refusal, and no item created** | same |

For every "yes":

1. initialize → `notifications/initialized` → `tools/list` → **one real tool call**, using the command the product's own flow produced; again after a port change and after updating from the previous alpha.
2. `ELECTRON_RUN_AS_NODE=1 Anytype -e 0` doesn't run as Node.

## 9. Phases

| Phase | Repo | Work | Depends on |
|---|---|---|---|
| 0. Spikes | throwaway binary, signed by hand | **S1** Claude runs a `binary` `.mcpb`: a real initialize and tool call on macOS, Windows classic and MSIX. **S2** `signIgnore` keeps the pre-signed, entitlement-free binary; a quarantined copy runs on a clean Mac. **S4** the `sign.js` early return leaves the forwarder's bytes unchanged. | — |
| 1. Forwarder | heart | `serve`, key verbs, the item store, both namespaces, tests, both packers; heart release | — |
| 2. File tools | heart | §6; heart release | 1 |
| 3. Desktop switch | anytype-ts, **this branch** | middleware bump, `prepare-forwarder.js`, both workflows, packaging lists, `forwarder.ts`, `keyStore.ts`, bookkeeping (§2.9), adapters, bundle, `command` method, removals (§7.1). The branch then merges to develop | 1, 2, S1, S2, S4 |
| 4. JS-9889 | anytype-ts | fuses, entitlements; right after 3 is on develop, same release (D7) | 3 |
| 5. Alpha, gates, release | anytype-ts | §8.3, §8.4 | 3, 4 |
| 6. Option C | anytype-ts | HTTP apps switch to `method: 'command'` records | 5 |

- The forwarder doesn't use Electron, and after Phase 3 nothing in the feature starts Electron in Node mode. A build made between Phases 3 and 4 works the same as one made after.
- Shared files: the forwarder work owns `prepare-forwarder.js`, one `signIgnore` line, the early return in `sign.js` and the verify block in `aftersign.js`; JS-9889 owns `afterpack.js` and the entitlements plist.

## 10. Risks

| Risk | Handling |
|---|---|
| Claude doesn't run `binary` bundles | S1; config route on that OS |
| electron-builder re-signs the binary | S2; ship it inside the `.mcpb` only |
| A local build with the release-namespace binary | `prepare-forwarder.js` disables stdio when namespace and `signed` disagree |
| `rev` is not bumped with a change | PR checklist in heart; a test compares `rev` with a hash of the forwarder's sources |
| heart cadence slows a forwarder fix | rides routine middleware bumps |
| Antivirus or AppLocker blocks `~\.anytype\bin` | signed binary; smoke test |
| An AI app whose sandbox can't read `~/.anytype` | not connected; S1 and the smoke tests cover Claude MSIX |
| Same-user redirection | the §0.2 residual |

## 11. Open decisions

None. D1–D8 and N1–N7 are answered (§0.1). The three spikes in Phase 0 (S1, S2, S4) can still change the Claude route per OS (bundle or config) and the place the forwarder ships in (next to the app or inside the bundle); both outcomes are already described.

## 12. Review response

ACCEPT = the design changed as described. PART = the simple part is taken, the rest refused. REJECT = not taken.

The keychain and Secret Service entries below are history: superseded on 2026-11-27 by the item store (§3).

### 12.1 Round 1 (38 findings: 24 accepted, 7 in part, 1 rejected, 1 superseded, 5 moot after N3)

Section numbers are rev 4's.

| Id | Verdict | What changed, or why not |
|---|---|---|
| SEC-01 | ACCEPT | No port from `serve`'s caller or from disk (§2, §2.1); residual in §0.2 |
| SEC-02 | PART | One verification rule and metadata in the asar (§4.2). Refused: Windows DACL checks, a protected path |
| SEC-03 | ACCEPT | Account pinning (§2.4) |
| SEC-04 | ACCEPT | Lock, mandatory precondition (§2.7) |
| SEC-05 | Moot | No migration (N3) |
| SEC-06 | Moot | No migration (N3) |
| SEC-07 | PART | Delivery hashes the bytes it writes (§4.2). Refused: re-verifying Claude's unpacked files |
| SEC-08 | REJECT | Predates this plan; N5 confirms |
| SEC-09 | ACCEPT | Managed Command record (§7.2) |
| SEC-10 | ACCEPT | No background prompts (§3.4) |
| SEC-11 | PART | Linux guarantee worded exactly (§3.3). Refused: detecting keyring configurations |
| SEC-12 | ACCEPT | `afterSign` verifies only (§4.4) |
| SEC-13 | Superseded | N4: the existing hook is reused as it is (§4.4) |
| BR-01 | ACCEPT | Both packers, validation (§1.1) |
| BR-02 | ACCEPT | Sign once; no mac per-arch copy (§4.4) |
| BR-03 | ACCEPT | No signing after sealing (§4.4) |
| BR-04 | ACCEPT | One script for tags and nightlies (§4.4, §4.5) |
| BR-05 | Moot | No old commands exist (N3); gates in §8.4 |
| BR-06 | Moot | As SEC-05 |
| BR-07 | PART | Lock, `rev`, Windows swap (§4.2, §4.3). Refused: a versioned-payload launcher |
| BR-08 | ACCEPT | Packaging lists (§4.5) |
| BR-09 | ACCEPT | `sign.js` early return; checks on packaged files (§4.4) |
| BR-10 | ACCEPT | Config route needs no extension (§5) |
| BR-11 | PART | Support check first; portable-home unsupported (§4.1) |
| MCP-01 | ACCEPT | 2025-03-26 not advertised (§2.3) |
| MCP-02 | ACCEPT | Single renewal, sticky warning (§2.5) |
| MCP-03 | ACCEPT | Pinning and start rules (§2.4) |
| MCP-04 | ACCEPT | Overrides only in the test build (§2) |
| MCP-05 | ACCEPT | Dispatch contract (§2.5) |
| MCP-06 | ACCEPT | Failure table (§2.6) |
| MCP-07 | PART | Limits, reader, raw ids (§2.2). Refused: parsing event-stream replies |
| MCP-08 | ACCEPT | File-tool rules (§6) |
| MCP-09 | ACCEPT | As SEC-09 |
| MCP-10 | ACCEPT | One store (§2.1) |
| MCP-11 | Moot | As SEC-05 |
| MCP-12 | ACCEPT | As BR-10; one command shape (§4.6) |
| MCP-13 | PART | `dist/mcp` emptied, guards (§5, §7.1). The rest is moot (N3) |
| MCP-14 | ACCEPT | CI integration, release gates (§8.1, §8.4) |

### 12.2 Round 2 (41 findings: 28 accepted, 4 in part, 4 rejected, 5 moot after N3)

Moot: R2-SEC-06, BR2-04, BR2-05, MCP-R2-10, MCP-R2-11.

**Security**

| Id | Verdict | What changed, or why not |
|---|---|---|
| R2-SEC-01 | REJECT | A same-user caller of `key retarget` is the §0.2 residual; closing it needs an authenticated loopback server |
| R2-SEC-02 | ACCEPT | Item `rev`, `fp@rev` preconditions, 5 s refresh before requests (§2.1, §2.4, §2.7) |
| R2-SEC-03 | REJECT | Replacing the in-app binary between hash and launch needs same-user write access to Anytype's install: §0.2, JS-9889's track |
| R2-SEC-04 | ACCEPT | Registry saved first; reconcile by `key check` (§2.9). The migration part is moot (N3) |
| R2-SEC-05 | REJECT | N5: no digest pinning; signing stays as today |
| R2-SEC-06 | Moot | No migration (N3) |
| R2-SEC-07 | ACCEPT | A locked or denied start is final for that process (§2.4) |
| R2-SEC-08 | PART | Linux never-downgrade by `.rev` (§4.2). Refused: a signed Linux manifest; forged metadata is the §0.2 residual |
| R2-SEC-09 | ACCEPT | Withdrawal procedure; Windows keeps only a copy that passed the rule (§4.3, §5) |
| R2-SEC-10 | ACCEPT | N4: the new Azure step and its fallback are removed (§4.4) |
| R2-SEC-11 | ACCEPT | `connectionId` on apply; routing by record id (§7.2) |
| R2-SEC-12 | ACCEPT | Namespace is a link-time constant, development by default (§3) |
| R2-SEC-13 | ACCEPT | Per-connection default files folder (§6) |
| R2-SEC-14 | ACCEPT | Queue of 32, reply bound, busy answer (§2.5) |

**Build and release**

| Id | Verdict | What changed, or why not |
|---|---|---|
| BR2-01 | PART | Alpha with released middleware, a one-line release commit, repeat on the published release; gates per shipped route (§8.4). Refused: staged publishing (N6). The old-command part is moot (N3) |
| BR2-02 | ACCEPT | `build-mcp.js` writes the one metadata file after signing; Linux per arch; read from the asar (§4.2) |
| BR2-03 | PART | Hash plus `.rev` on Linux; `signed: false` alone selects `bin-dev` (§4.1, §4.2). Refused: a signed manifest |
| BR2-04 | Moot | No migration (N3) |
| BR2-05 | Moot | As R2-SEC-06 |
| BR2-06 | ACCEPT | Nightly packer copies by exact name (§1.1) |
| BR2-07 | ACCEPT | Namespace at link time; `prepare-forwarder.js` runs inside `build:electron` and handles the local single binary (§3, §4.4) |
| BR2-08 | ACCEPT | Hand-bumped `rev`; bundle version `2.<rev>.0` (§1.2, §5) |
| BR2-09 | ACCEPT | N4, as R2-SEC-10 |
| BR2-10 | ACCEPT | The reused hook timestamps; the packaged check requires a trusted timestamp (§4.4) |
| BR2-11 | PART | A quarantined copy must run on a clean Mac (§4.4). Refused: capturing notary submission logs |
| BR2-12 | ACCEPT | Session variables allowed; unreachable bus is exit 7; Claude Desktop gets the keyring text before minting (§2, §2.8, §3.3) |
| BR2-13 | ACCEPT | As R2-SEC-11; the smoke test runs the product's own snippet (§8.4) |

**Protocol and behaviour**

| Id | Verdict | What changed, or why not |
|---|---|---|
| MCP-R2-01 | REJECT | As R2-SEC-01 |
| MCP-R2-02 | ACCEPT | A missing receipt is `unconfirmed`; reconcile before retry or revoke; the new id is saved first (§2.9) |
| MCP-R2-03 | ACCEPT | As R2-SEC-11; steps kept by the renderer; Manage rebuilds the snippet (§7.2) |
| MCP-R2-04 | ACCEPT | Reserved-member validation before anything else (§2.2) |
| MCP-R2-05 | ACCEPT | As BR2-02 |
| MCP-R2-06 | ACCEPT | Transfers finish on their snapshot; receipts honoured; never replayed (§6) |
| MCP-R2-07 | ACCEPT | As R2-SEC-02; a 401 adopts the whole new snapshot (§2.4) |
| MCP-R2-08 | ACCEPT | One correlated answer per live request (§2.6) |
| MCP-R2-09 | ACCEPT | Fixed queue, 10 s shutdown deadline, `SIGPIPE` ignored (§2.5) |
| MCP-R2-10 | Moot | Migration only (N3) |
| MCP-R2-11 | Moot | As R2-SEC-06 |
| MCP-R2-12 | ACCEPT | As R2-SEC-12 |
| MCP-R2-13 | ACCEPT | As BR2-12 |
| MCP-R2-14 | ACCEPT | Route table per OS; refusals must create no item (§8.4) |

### 12.3 Round 3 (18 findings, highs only: 14 accepted, 2 in part, 2 moot after N3)

| Id | Verdict | What changed, or why not |
|---|---|---|
| R3-SEC-01 | ACCEPT | Any start without a readable item is final for that process (§2.4) |
| R3-SEC-02 | PART | A mint intent is saved before `CreateApp` and settled through the orphan list by name and creation time (§2.9). Refused: an issuance id stored by heart |
| R3-SEC-03 | ACCEPT | Revocation is queued before `key delete`; an absent item completes it (§2.9) |
| R3-SEC-04 | ACCEPT | A pending revocation is dropped only on `RevokeApp` success or "not found" (§2.9) |
| R3-SEC-05 | Moot | No migration (N3) |
| R3-SEC-06 | ACCEPT | Two builds; `update.sh` gets the development namespace (§1.1, §3) |
| R3-SEC-07 | ACCEPT | Activation-capable probe; "not ready" is exit 7 and changes nothing (§2.8, §3.3). The migration part is moot |
| BR3-01 | ACCEPT | Identifier, service name and extension id never change; the identity-rotation procedure is removed (§5) |
| BR3-02 | ACCEPT | As R3-SEC-06; namespace must agree with `signed`; the dev bundle is a separate extension (§3, §4.1). The migration part is moot |
| BR3-03 | ACCEPT | As R3-SEC-07 |
| BR3-04 | ACCEPT | `.rev` is written before the binary (§4.3) |
| BR3-05 | Moot | No old commands exist, so a build between the two merges breaks nothing (§9) |
| BR3-06 | ACCEPT | Alpha commit and a one-line release commit, each with its own tag (§8.4) |
| MCP-R3-01 | ACCEPT | As R3-SEC-01; real-pipe test (§8.1) |
| MCP-R3-02 | PART | As R3-SEC-02 |
| MCP-R3-03 | ACCEPT | Each verb records its intended result; a retarget never revokes; a delete keeps its revocation (§2.9) |
| MCP-R3-04 | ACCEPT | As R3-SEC-07; the retirement part is moot |
| MCP-R3-05 | ACCEPT | As R3-SEC-06; local-first and release-first orders are both in the smoke table (§8.3) |

## 13. Phase 1 notes (heart branch `go-0000-anytype-mcp`, 2026-11-27)

What Phase 3 can rely on, and what to watch. Source of truth: `cmd/anytype-mcp` in heart; the numbers shared with heart's server are in `cmd/anytype-mcp/contract` and pinned by `core/api/server/mcp_forwarder_contract_test.go`.

**Archive.** Every `js_<ver>_<os-arch>` (release and nightly) holds `anytype-mcp-dev[.exe]` and `anytype-mcp-release[.exe]` next to `grpc-server[.exe]`. Unsigned, stripped, and all five are static (`CGO_ENABLED=0`); darwin is one file per arch.

**Namespace** is linked in as one marker string, `anytype-mcp-namespace:release` (dev builds don't contain it), so it can be read off any OS's file with `grep -a`, without running it. `version --json` prints exactly `{"version","commit","rev","namespace","impl":"go"}`. There is no test build and no `testBuild` field: end-to-end tests point `HOME`/`USERPROFILE` at a scratch folder. `rev` is `Rev` in `cmd/anytype-mcp/version.go`, now `4`; `rev.lock` fails the tests when the sources or a dependency version (go.mod replaces included) change without a bump, and can't be regenerated without one.

**Verbs: one JSON line on stdout, always.**

| Verb | Success | Failure |
|---|---|---|
| `key set`, `key retarget` | `{"ok":true,"fingerprint":"<16 hex>","rev":N}` | `{"ok":false,"reason":"…","store":"…"}`; after a write, `{"ok":false,"unconfirmed":true,"reason":"…"}` |
| `key delete` | `{"ok":true}` | same |
| `key check` | `{"present":true,"fingerprint","rev","account","port","tier","store":"ok","kind":"file","namespace"}` | `present` is `false` (no item, exit 3) or `null` (the store couldn't say, exit 7 only); `store` is `ok`, `denied` or `unreachable` |

- `key set` payload: exactly one JSON object `{"key","account","port","tier"}` on stdin, at most 16 KiB, nothing but white space after it; unknown fields are refused (exit 6). Key: at most 1024 visible ASCII characters. Fingerprint: the first 16 hex of sha256(key), as `digest.ts`.
- Exit codes are §2.8. `key check`: 0 present, 3 absent with a usable store, 7. Exit 4 never occurs. `key delete` on an absent item is 3 (§2.9: done). A lock held by another Anytype for 10 s is 7.
- **Receipts.** Exit 7 always means nothing was written. `unconfirmed` (exit 1) is a lost receipt: the item may hold the new state, so reconcile with `key check` (§2.9) before releasing or revoking anything.
- A stored value that is not a valid item (not one JSON item, or longer than 4 KiB) counts as **absent**: `key check` says `"present":false,"invalid":true`, `serve` is not connected, and `key set --expect absent` replaces it with a new private file.
- `key retarget` may change the tier; a running `serve` pinned to the old tier then stays not connected until restart.
- Lock path: `<home>/.anytype/ai-connect/items[-dev]/<id>.lock`. anytype-ts never reads or writes anything in `items/` or `items-dev/`.
- `serve` accepts `--files-dir` since Phase 2 (below); any unknown flag is exit 2. There are no `--port`, `--tier`, `--store-dir`, `--lock-dir` or `--interactive` flags.

**`serve` errors the sheet texts should match:** `-32001` not connected / key rejected / Anytype not running (three texts); `-32002` before `initialize` (`ping` is answered locally until then); `-32000` queue full; `-32601` Anytype too old (404 with no session); `tools/call` failures the model should read come back as `result.isError`. Exit 0 on stdin EOF and on SIGINT/SIGTERM; 1 on a broken stdout or when replies were lost at the deadline.

**Gotchas**

- **File rules (Unix).** Home must be a real directory owned by the user (any mode). `~/.anytype` and `ai-connect` must be real directories owned by the user and not writable by group or others; the items folder must be exactly `0700` and an item exactly `0600` with one link. A home where `~/.anytype` is a symlink (dot-folders moved to another disk), or a home that is itself a symlink, is `denied`: the stdio routes don't work there. Every refusal names the rule and the path on stderr.
- **macOS ACLs (L3).** A home shared in Finder ("Sharing & Permissions") carries allow entries and is `denied`, and so is any ACL on an Anytype folder or an item. The stock `everyone deny delete` on a home is fine.
- **File rules (Windows).** `.anytype` and `ai-connect` may grant access to the user, SYSTEM and Administrators only; the items folder and each item carry one protected DACL entry (full access for the user, who is the owner). Anything else is `denied`.
- **Windows replacement (L7).** The item is replaced with a POSIX-semantics rename, so a running `serve` or a scanner that shares delete never blocks `key set`; a handle that denies delete sharing delays it by up to 2 s, then it is exit 7 with the old item intact.
- **The Windows store code has not run yet** (no Windows machine in these rounds): it compiles and vets, and its tests run first on the CI Windows job.
- **Session follow-ups stay home (L1).** A `DELETE` or a renewal's second leg is skipped once the item names another port or key; the old session expires on heart's idle timeout.
- **A client `initialize` does not clear the reset warning (L2).** A `tools/call` right after a client's own re-initialize may get the warning once; it says the call did not run.
- **`key delete` can be `unconfirmed` too**, and after a successful delete no file holds the key, crashed temp files included.
- **Deadlines (round 3).** A key verb ends within 30 s whatever blocks (stdin, the lock, the disk): exit 7 if nothing was changed, `unconfirmed` if it was caught while replacing the item. `serve` waits at most 5 s for a read of the item and never for a stuck one again. Exit 7 is given only when the item provably did not change; an error after the rename or the unlink is settled by reading the item (in place is `ok`).
- **A refresh that can't read the store keeps the last snapshot**; only "no item", an invalid item, another account or another tier ends the connection.
- **A 401 fails that one request** even when the item has already moved on; the next request uses the new snapshot.
- **The reset warning clears only after its line is written.** A `tools/call` the client sends in the same instant may get the warning once more; it says the call did not run.
- **The shutdown deadline is hard** (10 s from the trigger, then exit whatever is blocked), and the logger never blocks: with stderr not drained, log lines are dropped and counted.
- **Cleanup `DELETE`s go only to the session's own snapshot.** After a port move or a key rotation the old session is left to heart's 30-minute idle timeout.
- **A 200 reply that contains the connection's key is withheld**, with a fixed text.
- If 32 replies are waiting for stdout the reader waits too, so a cancel is then served only once stdout moves (or the stall ends the process).
- End to end against heart: `go test -tags integration ./cmd/anytype-mcp/integration` (not on Windows).

**Phase 1 accepted (2026-11-27)** after three review rounds (K1–K12, L1–L11, M1–M6). Branch `go-0000-anytype-mcp` in the heart worktree `anytype-heart-mcp`, on `origin/develop` @ `0fcf5d1d7`, local only:

- `a593f29e1` key store (superseded by `3cb61bf53`)
- `d4e573aba` stdio transport
- `507ae686b` command: `serve`, key verbs, `version`
- `9c7819fd1` build and both packers
- `554ed73a0` CI test jobs
- `3cb61bf53` one hardened item file per connection, no keychain; round 1 fixes
- `59e0bbd49` integration test: scratch home, real retarget
- `552f92877` build without cgo
- `090571ae9` round 2 fixes
- `a207aa0cd` round 3 fixes

Still open: the Windows-only code and tests are verified by the first `windows-latest` CI run.

### 13.1 Phase 2 notes: full-tier file tools (heart branch `go-7620-anytype-mcp`, 2026-11-27)

Source of truth: `cmd/anytype-mcp/internal/files` (the folder) and `internal/forward/localtools.go` (the tools). `Rev` is now `5`. Local commits `6000ef776` (folder), `2a465977f` (tools, flag, rev), `6752308c6` (integration), on top of `a207aa0cd`.

**This replaces §6's folder rule.** There is no `~/.anytype-mcp/files/<connectionId>` and no persistent default (Roma's rule): an agent steered by a prompt can upload only what somebody put into one folder on purpose.

**CLI.** `anytype-mcp serve --connection <id> [--files-dir <absolute path>]`. The flag is in both namespaces (release too: it is a local path, not a network target), and on `serve` only.

| Case | Result |
|---|---|
| no flag, full tier | a new private folder per process, `<system temp>/anytype-mcp-files-<random>` (`0700`). It is never removed: downloads stay until the OS cleans up |
| no flag, small/large tier, or no item | no folder is made |
| `--files-dir` not absolute (or empty) | exit 2, usage on stderr |
| `--files-dir` can't be used (not a directory, can't be created, contains `..`, overlaps `~/.anytype`) | exit 6 before anything is read from stdin; stderr is `anytype-mcp: --files-dir: <reason>` |
| temp folder can't be made | `serve` runs without the file tools; stderr says `file tools are off: …` |

- **`--files-dir` is any directory the user chooses** (Roma, 2026-11-27). Missing: created, the folder itself private (`0700`; on Windows a protected list for the user, SYSTEM and Administrators), parents as the system makes them. Existing: taken as it is, whoever owns it and whatever its mode or access list (`0775` is fine), and never changed. The path may be spelled through links or a junction (macOS `/tmp`): it is resolved once at start, and the resolved directory is pinned with `os.OpenRoot` and is the path the descriptions, the receipts and stderr show.
- **Two refusals only:** a path with `..` in it, and a folder that is `~/.anytype`, inside it, or around it (so the home folder itself is refused): the key store must never be uploadable.
- **Confinement is `os.Root`'s:** every access of both tools stays inside the pinned directory. Renaming it or putting a link at its path later changes nothing for the running `serve`.
- **What counts as "in the folder"** (Roma): whatever somebody with file-system access put there, a copy, a hard link or a file system mounted inside it alike. Those are uploaded. A symlink is not followed out of the folder, and a file whose own name is a symlink is never uploaded.
- **The temp default** is checked after creation (the folder opened is the one just made, owned by the user, no access for others).
- stderr has `file tools: folder <path>` on a full-tier start.
- **Environment.** `serve` now also reads the system temp location (`TMPDIR`; `TMP`/`TEMP` on Windows) when it makes the default folder. Nothing else changed. `ANYTYPE_MCP_FILES_DIR` is not read.

**Listing.** On the full tier only, `tools/list` gets `download_file` and `upload_local_file` appended after heart's tools (on the last page of a paged listing). A name heart lists itself is heart's, in the listing and in dispatch. Both descriptions contain the folder's absolute path (`… into <dir> on the computer running this MCP server …`, `Upload a file from <dir> on the computer running …`); with the temp default the download description also says the folder is temporary. Curated tiers list and serve nothing local.

**`download_file {space_id, file_id, width?}`** → `{path, filename, media_type, size}`, as JSON text and as `structuredContent`.

- `GET /v2/spaces/{s}/objects/{f}` for the name (best effort), then `GET /v2/spaces/{s}/files/{f}/content[?width=N]`; only a whole-file 200 is saved.
- Name: Content-Disposition (`filename*` first), else the object's `name` + `file_ext`, else name or id + the media type's usual extension. Sanitized for every OS (control and reserved characters, bidi overrides, leading dots, Windows device names → `download`, 120 UTF-16 units / 245 bytes).
- Never overwrites: `name (2).ext` … `name (100).ext`, then `name-<8 hex>.ext`. The bytes go to `.anytype-mcp-<random>.part` in the folder, mode `0600`, and are published by hard link only (a step that can't replace anything). Without hard links (FAT, exFAT) the download fails with a text that says so, as in the Node proxy.
- The part file is removed on any failure, cancellation and shutdown. A part file of a killed process stays (nothing sweeps the folder: two processes may share it).

**`upload_local_file {space_id, path, dry_run?}`** → heart's receipt, as text and `structuredContent`.

- `path` is relative to the folder (`/` separators; `\` too on Windows). Refused before any request to heart: absolute, drive, UNC and `~` paths, `..`, a missing file, a file whose own name is a link (inside or outside), a folder on the way that links out, anything that is not a regular file (directory, FIFO, device), and a name swapped for something else during the call. Every refusal names the folder.
- Multipart `POST /v2/spaces/{s}/files[?dry_run=true]`, streamed, one `file` part, a fresh `Idempotency-Key` per call, never sent twice.
- Success is exactly `201` + a non-empty `id`, or for a dry run `200` + `dry_run: true` (heart answers `{"dry_run":true,"id":""}`).

**Texts the sheets may match** (all are `result.isError`, never a JSON-RPC error, except not connected `-32001` and before initialize `-32002`):

- `the upload outcome is unconfirmed: the connection to Anytype closed before it answered. Check the space for the file before uploading it again.`
- `the upload outcome is unconfirmed: Anytype did not answer within 10 minutes after the whole file was sent. Check …`
- `the upload outcome is unconfirmed: Anytype answered HTTP <n> without its upload receipt. Check …`
- `the transfer did not finish within 10 minutes` (the deadline covers the whole transfer, body included)
- `expected the whole file (HTTP 200), got HTTP <n>; nothing was saved`
- `Anytype answered HTTP <n> with a redirect, which is not followed`
- heart's own error as `{"status","code","message","issues"?}` JSON, bounded and with the key redacted; any other body is only `Anytype answered HTTP <n>`
- a 401 is the Phase 1 "no longer accepts this connection's key" text, a refused connection the "Anytype is not running" text
- `the file could not be transferred` (a disk or network error; the cause is on stderr)

**Gotchas**

- A transfer runs on the snapshot it started with: a receipt is honoured after a key rotation; a 401 or a refused connection fails that transfer, re-reads the item, and the next one uses it. A refused connection is not retried within the call (unlike an MCP request in Phase 1).
- A transfer holds one of the four workers for up to 10 minutes.
- A canceled transfer writes no reply; the id rules, the one-reply rule and the shutdown deadline are Phase 1's.
- An upload receipt, a file name or a media type that contains the key is withheld or redacted.
- Tests that start a full-tier `serve` without the flag must set `TMPDIR` (`TMP`/`TEMP`) to a scratch folder, or they leave `anytype-mcp-files-*` in the real temp folder.
- **Not yet run on Windows:** the owner check, the junction refusals, hard-link publishing and the Windows path spellings (`internal/files/*_windows*.go`); the first `windows-latest` CI run verifies them.

**Review round 1 (N1–N10, 2026-11-27).** What changed for Phase 3:

- **`--files-dir` refusals** are the two above (`..`, overlap with `~/.anytype`), both exit 6. The owner, mode, ACL and link checks of the first version are gone (Roma's decision).
- **What the forwarder creates is private by construction.** A missing `--files-dir` and the temp default get `0700` on Unix and, on Windows, a protected list (user, SYSTEM, Administrators). Files it writes are `0600`; on Windows they inherit the folder's list, so in an existing folder with a wider list a download is as visible as the user made that folder. Existing folders and ancestors are never changed.
- **Uploads also refuse** any `..` in `path`. Hard links and mounts inside the folder are not refused (above).
- **Downloads:** a body that contains the connection's key is not saved (`The file contains this connection's key and was not saved.`); a transfer canceled or past its deadline before publication publishes nothing; if the folder was moved or replaced after start, the reply is an error that names the saved file but gives no path.
- **Arguments:** `dry_run` must be absent, `true` or `false` (`null` is an error, never an upload); `width` is any JSON spelling of a whole number from 0 to 2^31−1, `null` is an error.
- **Receipts** are matched by exact member names (`id` a non-empty string; `dry_run` the literal `true`) and have the rest of the 10 minutes to arrive.
- **heart's error JSON arrives whole** (message ≤ 400 characters, ≤ 20 issues, each bounded).
- **Shutdown:** on stdin EOF a file transfer still running at 80 % of the shutdown deadline is stopped then (exit 1), so its part file is removed in time.
- **Windows store (N9):** `.anytype` and `ai-connect`, when the forwarder creates them, get a protected list (user, SYSTEM, Administrators), so a home that Users may read no longer makes a fresh store `denied`. A `.anytype` made by anything else that inherited such an entry is still `denied`, with the rule on stderr: if the desktop app creates `.anytype` first on such a machine, the stdio routes fail there.

**Review round 2 (O1–O6, final, 2026-11-27).**

- **Argument names are exact, in both tools.** `params` may hold `name`, `arguments` and `_meta` only; a member in another case (`Arguments`), an unknown member, or any name that occurs twice (in `params` or in `arguments`) is a tool error and nothing is sent to heart.
- **Overlap with `~/.anytype`** is judged where the folders really lie, with links above the home folder resolved too.
- **The key check on a download** also reads through JSON escapes (`\uXXXX`, `\/`, …), across read boundaries.
- **A failed download leaves nothing under the final name**, and removes only its own part file.
- **A file system that stops answering** can't hold a worker past the transfer deadline (plus 1 s): the call answers `the transfer did not finish within 10 minutes`. Once four transfers are stuck, further file calls answer at once that the folder does not answer.
- **On stdin EOF, no file transfer starts after 80 % of the shutdown deadline**; one turned away then gets no reply and the exit code is 1.


### 13.2 Phase 3 notes: the desktop switch (anytype-ts `feature/connect-to-ai-poc`, 2026-11-27)

> **Superseded in part by tokens-plan D1 (2026-11-28, forwarder Rev 6, heart `abb7bfe25`).** Where the notes below talk about the item store they are history. Current code map:
>
> - **Gone:** `keyStore.ts`, `item.ts`, `keyStore.test.ts`, `forwarder.itemLabel`; `Ctx.journal.retarget`, `Adapter` `itemLeft` / `item`; record fields `itemRev`, `retarget`, `itemDelete`, `itemFps`, `itemUntil`, `configEntry`; methods `keyfile` and `command`; apply's `manual` and `connectionId`; `needs: 'installExtension'`; the item cases of `bookkeeping`, `review1/2/3` (main and renderer) and `claudeDesktop.test.ts`.
> - **New (main):** `endpoint.ts` (`syncEndpoint`, `preflight`, the only writer of `endpoint[-dev].json`), `clipboard.ts` (`SecretClipboard`), `forwarder.endpointVerdict`, `MIN_FORWARDER_REV` (`electron/json/aiConnect.forwarder.json`), `fsSafe.sweepTemps`, `Env.fsyncDir` / `clipboardRead` / `clipboardWrite` / `setTimer`; service `retire`, `copySecret`, `startup`, `apiChanged`, `accountStopped`, `shutdown` and the latch (`index.ts latch`); hooks in `main.ts` (storeSet / storeDelete, start, will-quit) and `api.ts` (logout, the two IPC methods).
> - **Claude (`adapters/claudeDesktop.ts`):** extension = checks, then the service saves the `waiting` record, copies the key and runs `deliver` (open the bundle copy `Anytype[-dev]-<12 hex>.mcpb`, or Configure); always Full. Config route = stable copy + preflight, candidate (digest, fingerprint) saved, then the entry with the key in `env` written under `claude-desktop.lock` (secret write: 0600, no backup); check by digest (else `reconnect`); Disconnect reads the entry under the lock, queues (`ctx.queue`), deletes. `claudeRoutes` is the one two-server guard.
> - **Other (`adapters/other.ts`):** both setups manual (`method: 'manual'`, `setup: 'url' | 'command'`); the Command plan installs the stable copy and runs the preflight; recorded by `aiConnectRecordManual`.
> - **Renderer:** `flow.ts` keeps `appHash` only after commit, fingerprints for unidentified mints, `copySecret` / `retire` / bundle reconnect, the Finish view's 5 s check loop; `controller.ts` and `popup/aiConnect/*` hold no key (masked snippets, Copy through main). Text keys in `src/json/text.json`.
> - **Build:** `scripts/build-mcp.js` writes the §3.3 manifest; `scripts/prepare-forwarder.js` reads the rev and namespace markers of every shipped file (`verify-forwarder.js forwarderMarkers`, Mach-O fat headers parsed in JS); `verify-forwarder.js` checks the packed manifest and runs the resolved-launch smoke (`smoke()`, pinned `@anthropic-ai/mcpb` resolver).
> - **Tests per D1 case:** `d1.test.ts` (02, 03, 05, 06, 09–13, 15–19, 23, 24), `service.test.ts` (01), `endpoint.test.ts` (04, Windows rename retry), `forwarder.test.ts` + `packaging.test.ts` (07), `packaging.test.ts` (08), `review3.test.ts` (20), `src/…/command.test.ts` (21), `src/…/tokens.test.ts` (renderer parts of 09, 10, 12, 13, 14, 22); the real forwarder: `forwarder.integration.test.ts` (D1-05 / D1-10 with `TESTHEART_BIN` built from `testdata/testheart` — now with `mint` and `active` — and `HEART_BIN`), `forwarder.windows.integration.test.ts` (D1-05 on Windows CI). Review rounds: `review-d1r1.test.ts` and `review-d1r2.test.ts` (main and renderer, `.review-d1r1-adjudication.md`, `.review-d1r2-adjudication.md`); round 2 added the registry undo `aiConnect.json.txn`, the service session (`endSession`) and `withdrawEndpoint`, and removed the POC migration.

Unstaged on top of the staged POC baseline. Built against heart `go-7620-anytype-mcp` @ `d1b6783bf` (`Rev` 5), not released yet.

**New modules (main).** `forwarder.ts` (metadata, in-app binary, stable copy, install rule), `keyStore.ts` (the four key verbs), `item.ts` (ownership + the three changes with their journal), `bundle.ts` (the `.mcpb` and its copy). Gone: `proxy.ts`, `keyFile.ts`, `electron/mcp/connect.mjs`, `vendor/anytype-mcp/`, every run-as-Node command builder, `electronAsNode`.

**Metadata** `electron/json/aiConnect.build.json` (git-ignored, written only by `scripts/build-mcp.js`, read by main from `app.getAppPath()`, i.e. inside `app.asar`). Two fields more than §4.2 shows: `forwarder.namespace` (main refuses the stdio routes unless `signed == (namespace == 'release')`) and `forwarder.teamId` (macOS: the Team ID of the signature, for the "is this higher-rev copy ours" check). No forwarder in the build → `forwarder: null`, no bundle, stdio routes off, URL routes unchanged.

**`signed` means "release build":** the release-namespace forwarder, code-signed on macOS and Windows; on Linux the release namespace alone. A release forwarder also requires a signed `.mcpb` (the build fails otherwise). An unsigned build uses `~/.anytype/bin-dev`, `items-dev` (the forwarder's own choice) and the extension `local.mcpb.anytype.anytype-dev`.

**Where the binary comes from.** `update.sh` → `anytype-mcp-dev` (a note, not an error, when the archive has none); `update-ci.sh` → `anytype-mcp-release` (**exit 1** when missing). `ANYTYPE_MCP_BIN=<file>` makes `prepare-forwarder.js` use a locally built one (`go build -o <file> ./cmd/anytype-mcp`). **`middleware.version` is NOT bumped**: no heart release carries the forwarder yet, so the archive path of both scripts is untested, and release / nightly CI of this branch fails at `update-ci.sh` until the bump.

**Signing (N7).** `prepare-forwarder.js` runs first in `build:electron`: macOS `lipo` of `darwin-arm` + `darwin-amd`, then `codesign --force --options runtime --timestamp --identifier com.anytype.mcp --sign <build.mac.identity>` (override: `ANYTYPE_MCP_SIGN_IDENTITY`), then its own check (identifier, runtime flag, Team ID, empty entitlements); Windows the existing `sign.js` with `forwarder: true`, then `Get-AuthenticodeSignature` must be `Valid`. In CI (`CI` or `FORWARDER_SIGN_REQUIRED=1`) a release binary that can't be signed fails the build; locally the build goes on without a forwarder. `mac.signIgnore` has `.*/dist/anytype-mcp$`; `sign.js` returns early for `anytype-mcp.exe` unless called with `forwarder: true`. Both workflows import the macOS certificate and get the Azure secrets before "Build frontend"; nightly signs the `.mcpb` only when the repository variable `NIGHTLY_MCPB_SIGN_REQUIRED` is `1` (then a missing secret is an error); with it unset the nightly ships no bundle and a macOS nightly gets no Azure secret (PENDING, Q12; S11; see §4.5). The `.mcpb` is signed through Azure Key Vault with the Windows certificate (§4.4, 2026-11-28): no `.mcpb` key exists, and on macOS the Azure secrets reach "Build frontend" only. `sign.js` exports the `CustomWindowsSign` shape `(configuration, packager)`; tests replace `exports.runner` (S4).

**Verification (S2, S4 automated).** `electron/hook/verify-forwarder.js`: packaged forwarder sha256 == metadata == the copy inside `Anytype.mcpb`; manifest `binary` + version `2.<rev>.0`; no script under `dist/mcp`; signed build: macOS `codesign --verify --strict`, identifier, DR names it, runtime flag, no entitlements; Windows Authenticode `Valid` + a timestamp. It runs in `afterSign` (before notarization) and as steps "Verify the packaged forwarder Mac OS / Windows / Linux" after electron-builder in `build.yml` and `nightly.yml` (`--require-signed`, no `continue-on-error`). The macOS and Windows steps also run the raw `codesign` / `Get-AuthenticodeSignature` commands.

**IPC and contract changes.**

- `aiConnectApply`: `method` may be `'command'` (Other app, route `stdio` only); new optional `connectionId` (only with `command`: reconnects that record; checked against the account and `expectedHash`) and `intentId`. Ok result may carry `steps` (the setup text).
- `aiConnectPlan`: `method: 'command'` (+ `connectionId` for a record: Manage rebuilds the snippet). Other app's plans carry `setups: ('url' | 'command')[]`.
- New `aiConnectMintIntent`: `{ accountId, name, time }` → `{ ok, id }` before CreateApp; `{ accountId, id, done: true }` once the key was revoked or handed to the orphan list. `aiConnectRecordManual` also takes `intentId`. `aiConnectList` ok adds `mintIntents` (only those an earlier run left).
- `AiMethod` + `'command'`; `AiErrorCategory` + `'storeDenied'`, `'installFailed'`; `AiRecord` + `itemRev`, `retarget`, `itemDelete`; registry file + `mintIntents` (absent while empty; version stays 1).
- `Env` + `arch`, `buildMeta()`; `Ctx` + `accountId`, `journal`; `Adapter.remove` may say `itemLeft`, `update` `unconfirmed`, `check` `item`.

**Bookkeeping as built (§2.9).**

- `key set`: the service saves the new key as a candidate (`unconfirmed`) when the adapter calls `ctx.journal.set`, right before the verb. Receipt → the POC's commit path; exit 5/6/7 → the candidate is removed again; `unconfirmed` (exit 1, a timeout, any output not understood, a receipt for another fingerprint) → the POC's existing settle path, with `installedFp` = `key check`'s fingerprint.
- `key retarget`: `retarget: { port, tier, rev, until }` on the record before the verb (`until` = now + verb timeout + 5 s). Every check that reads the record's own key in the item copies the item's port, tier and rev onto the record; the intent is cleared only when the item is at `rev` or later, or `until` has passed (S6) — an item still at the old revision inside the deadline settles nothing. With an intent pending the item's tier is not healed back.
- `key delete`: the record is saved `removed` with all hashes in `revokePending` (and `itemDelete`) before the verb. `itemDelete` stays when the verb gave no receipt or the store couldn't be used; every later check tries again while the record exists. A disconnect while a candidate's `key set` may still commit also keeps `itemDelete`, `itemFps` and `itemUntil` (the latest candidate deadline): until then "no item" is not final, so a key the helper writes afterwards is deleted by a later check (S6). An item that isn't this record's is never deleted (so the old "conflict → nothing changes" answer of Disconnect is gone for these records).
- **Both POC rules changed:** main no longer prunes `revokePending`, orphans or anything else by absence from the key list (`index.ts` check); the renderer calls `RevokeApp` for every queued hash whatever the list says and drops it only on success or "not found" (`flow.ts`) — heart's own decoded answer: the dispatcher marks a transport error `error.transport: true` (grpc-web maps HTTP 400 to code 3, the number of heart's NOT_FOUND), and `revokeApp` reads that as failed (S1). A key list never retires a candidate either: only `settleUnconfirmed`, which reads the candidate's own target (`key check`), does (Q1).
- Mint intent: `flow.mintKey` saves it before `CreateApp` (no intent → no key, error `write/unsaved`); cleared by a committed or unconfirmed apply / recordManual once its record is on disk, a successful release, or a release that reached the orphan list. A failed `CreateApp` keeps it (a lost reply may still have minted the key); the next run's check clears an intent no key matches. A 65th unresolved intent is refused (Q6). Main reports only intents not made in its current run; the renderer's check matches `name` + `createdAt >= time` + unmanaged and asks main to queue those hashes (`aiConnectOrphan { accountId, hash, intentId }`), then clears the intent. Main is the authority (S3): it refuses a recovery hash that is the `appHash` of a record or candidate of the account now, or while an intent of the same account and name is in `liveIntents` (a mint of this run whose CreateApp answer or delivery may still be on the way); a refused intent is kept and the next check decides again. A released key (no `intentId`) is queued as before. Residual: a key of the same name the user made by hand after that time would be revoked too.

**Claude Desktop.** The item replaces the key file; the record's `targetPath` on the bundle route is the item's path as a label only (nothing in anytype-ts opens it). Replace consent for a foreign item is bound to `sha256(fingerprint@rev)`. The config route no longer has the key-file gate; it refuses while the Anytype extension is installed and enabled (`aiConnectClaudeBothRoutes`), installs the stable copy before the config edit, and its check re-installs a missing or changed copy. A damaged bundle now leaves the config route available by hand (it needs no extension) — with the same two-server guard in that preview (S9); an installation registry that exists but can't be read counts as an enabled extension, a missing one as none. Config-route apply (the pre-read when Claude was not quit, the merge, `key set`), manual Create key's `key set`, and removal (`key delete` through the config edit) hold one cross-process lock, `~/.anytype/ai-connect/claude-desktop.lock` (`withLock` of the stable copy: 10 s wait, stale after 60 s); not acquired → apply answers `write/changed` before any item write, removal deletes nothing and reports `itemLeft` (+ `left: 'entry'` for a config record) (S8). Waiting for Claude to quit stays outside the lock. A config-route candidate keeps the `configEntry` / `entryDigest` / `configPath` it journaled whatever the verb's outcome carries (S7).

**Stable copy.** As §4.2/§4.3, with the lock as an exclusive `.lock` file (stale after 60 s, waited for 10 s). "Passed the rule before" on a blocked Windows rename is implemented as "carries our signature now". Linux always installs its own (C2). S5: on Windows a `bin` Anytype creates gets the protected list (`protectNewDir`, as `.anytype`), and before `ensureInstalled` returns a path — on every path — one PowerShell query (`privateOnWindows`) reads the owner and the allow entries of `bin` and of the exe: every SID must be the user, `S-1-5-18` or `S-1-5-32-544`, else `installFailed` (no repair; a pass is cached for the run). On POSIX the copy must also pass `env.canExecute` (`access(X_OK)`: a `noexec` home fails the install before any `key set`). Unsupported: Snap, Flatpak, an AppImage with `<AppImage>.home` next to it.

**Not done / to watch.**

- Windows code paths (`signedByUs` PowerShell query, the rename-aside swap, the sign hook's early call) ran only against the fake env; first real run is the Windows CI job and the alpha. The store-folder rule and the S5 ACL query do get a real run in CI: `forwarder.windows.integration.test.ts` (opt-in: win32 + `ANYTYPE_MCP_BIN`; step "Check the forwarder's store folders Windows" in both workflows, before packaging, S12 / T4) — written on macOS, so its first execution is that job.
- `.mcpb` entries carry Unix mode `0755` for the binary; whether Claude keeps it when unpacking is part of S1 on the alpha.
- A local macOS `dist:*` build ships the Go linker's ad-hoc signature on the forwarder (verified: electron-builder's signing leaves the bytes alone); such a build can't be notarized, which only CI does.
- The proxy-bypass probe test now needs Node 24+ for `NODE_USE_ENV_PROXY` (it ran in Electron's Node before, which the guard forbids): skipped on older Node.
- The integration test ran against the middleware in this worktree's `dist/` (not a `grpcserver` built from the heart PR) and is opt-in (`ANYTYPE_MCP_BIN`, `EVALHEART_BIN`, `HEART_BIN`).
- No E2E tests were added to `anytype-desktop-suite`; `/qa-engineer` is still to run for the Other-app sheet.

**Review round 1 (Q1–Q21, `.review-mcp3-r1-adjudication.md`), what changed for the next reader.**

- **Candidates (Q1–Q3, Q15).** Only `key check` settles a candidate. A writer that spawned and died is unconfirmed (`RunResult.notStarted` marks the one case where nothing ran). `journal.set` saves the candidate as `running` with `until = now + verb timeout + 5 s`; the settle path treats it as in flight until then. A config-route candidate carries `configEntry` / `entryDigest` / `configPath`, which the record takes over on promotion.
- **Disconnect (Q4, Q5).** A removed record stays (hidden, status `removed`) while `itemDelete` is set, with `itemFps` so a retry recognises a candidate's key in the item; `deleteItem` answers `owner: deleted | none | foreign`. Claude's config entry is removed only for `deleted` / `none`; with another account's item it is theirs.
- **Stable copy (Q7, Q17, Q18).** The lock is stale by mtime, only `EEXIST` is contention, every retry sleeps. On Windows a `.anytype` / `ai-connect` that Anytype creates gets the protected list through `icacls` at once. On POSIX `.anytype` must not be group- or other-writable (never chmod-ed), and the copy must be ours with mode `0755` (repaired under the lock).
- **Build flavour (Q8).** `FORWARDER_SIGN_REQUIRED=1` is the release flavour: update-ci.sh's inputs, release namespace, must sign, `ANYTYPE_MCP_BIN` refused. Everything else is the development flavour: `ANYTYPE_MCP_BIN` or `dist/`, dev namespace only, never `signed`; per-arch leftovers are ignored and `beforebuild.js` copies no forwarder.
- **CI (Q9–Q13).** Linux is verified in `afterPack` (one call at the top of `afterpack.js`) and the workflow step checks only `dist/linux-unpacked`; the macOS verifier also runs `lipo -verify_arch`; the `grep -q` pipe is gone; `sign.js` runs AzureSignTool through `execFile` with redacted output and the Azure secrets reach "Build frontend" on Windows (and, since the `.mcpb` is signed through Key Vault, on macOS when it signs the bundle); `--require-bundle` on release. `WIN_PUBLISHER_SUBJECT` is the repository variable of that name (2026-11-28), set to the subject of the released Anytype.exe's signer (.NET format derived from the certificate, not yet read with `Get-AuthenticodeSignature` on Windows: the first signed Windows CI run confirms it). It must exist before the next tag, or the release fails.
- **Claude and Other (Q14, Q16, Q19).** The config route refuses while any Anytype extension record is not switched off, also in manual setup. A manual Create key whose receipt was lost puts the sheet into `waiting` (no second Create) until a check promotes or retires the candidate. A tier change recovered from a lost receipt sets `nextStep: 'restart'`.
- **Integration test (Q20).** Now started with `TESTHEART_BIN` (`electron/ts/lib/aiConnect/testdata/testheart/main.go`, built inside a heart checkout with `go build -overlay`, no file added there): it uses the grant's real hash, calls `RevokeApp`, and asserts heart answers 401 to the former key.

**Review round 2 (S1–S14, `.review-mcp3-r2-adjudication.md`), where each fix and its test live.**

- **S1** `dispatcher.ts` (`transport: true`), `flow.ts revokeApp` — `dispatcher.sentinel.test.ts`, `flow.test.ts`.
- **S2** `controller.ts prefillReconnect` (a Command record sets `this.method = 'command'`) — `command.test.ts`.
- **S3** `index.ts orphan` / `recoverable`, `validate.ts` (`intentId`), `flow.ts` — `flow.test.ts` (both races), `electron/…/review2.test.ts`.
- **S4** `electron/hook/sign.js` — `guard.test.ts`.
- **S5** `forwarder.ts` (`privateOnWindows`, `ownDir`, `startable`), `Env.canExecute` — `review2.test.ts`; the fake env answers the ACL query (`FakeSpec.acl`, `noexec`).
- **S6** `index.ts` (`remove`, `check`, `retargetJournal`, `take`), registry validator — `review2.test.ts`; `bookkeeping.test.ts` follows the new deadline.
- **S7** `index.ts withCandidate` — `review2.test.ts`.
- **S8** `claudeDesktop.ts` (`configLock`, `removeLocked`, `baseline` in `fallback.apply`), `bundle.ts ensureStoreDir` — `review2.test.ts`.
- **S9** `claudeDesktop.ts` (`extensionEnabled`, `primary.plan`) — `review2.test.ts`, `flow.test.ts`.
- **S10** `scripts/prepare-forwarder.js`; **S14** `electron/hook/verify-forwarder.js` — `packaging.test.ts`.
- **S11**, **S12** both workflows — `guard.test.ts`; S12's test is `forwarder.windows.integration.test.ts`.
- **S13** `other.ts commandPlan` (`instructions.restart`) — `command.test.ts`.
- One existing assertion outside the feature changed with S1: `membershipResponse.test.ts` expects the transport mark.

**Review round 3 (T1–T4, `.review-mcp3-r3-adjudication.md`; final).**

- **T1** A candidate carried into a confirmed record (a commit in `freshRecord`, a promotion in `settleUnconfirmed`) loses `created`: when it expires it retires only its own hash, never the record — `electron/…/review3.test.ts`.
- **T2** Recovery sends the key too: `aiConnectOrphan { accountId, hash, intentId, key }` (`key` is required with `intentId`). After `recoverable`, main's `installedSomewhere` reads every own-namespace, non-manual record's target (`adapter.installedFp`): the key there → it is saved as that record's candidate (`created: false`, not running) and the next check's settle path promotes it; a target that can't be read → refused as well. Only a key found nowhere is queued — `review3.test.ts`; `flow.test.ts` asserts the parameter.
- **T3** Item-backed records (`holdsItem`) carry `ns: 'release' | 'dev'`, set in `freshRecord` from the build's forwarder namespace (a record without it counts as this build's). For a record of the other flavour (`otherBuild`): the check reads, settles, heals and rewrites nothing and reports status `conflict`; apply, update and Disconnect answer `validate/conflict`; Forget still works (the record goes once its revocations are confirmed); `installedSomewhere` skips it. No new UI text: the existing conflict handling is what the user sees — `review3.test.ts`.
- **T4** "Check the forwarder's store folders Windows" now runs before both packaging steps in `build.yml` and `nightly.yml` (electron-builder publishes as it packages), on `dist/anytype-mcp.exe` as "Build frontend" signed it; `afterSign` and the later verify step still prove the package holds those bytes — `guard.test.ts`.
