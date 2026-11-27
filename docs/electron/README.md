# electron/ - Electron Main Process

Electron main process files for desktop app integration. TypeScript source in `ts/` is bundled into `electron.js` at the project root via `scripts/build-electron.js`.

## TypeScript Source (`ts/`)

- `main.ts` - Main entry point: app lifecycle, window creation, IPC handlers, signal handling, publishes `global.serverAddress` and `global.localApiSecret` for renderers
- `api.ts` - IPC API handlers for renderer-to-main communication; the `aiConnect*` methods go to `lib/aiConnect` (validated, sender-gated in `main.ts`: the active tab's top frame of a normal window; the nudge claim also needs a focused window). a check heals only while, inside its queued operation, the shared `localApi` setting and heart's last bind outcome (`localApiBind`) say the API listens on that port
- `config.ts` - App configuration management
- `menu.ts` - Native application menu (File, Edit, View, etc.); Help ▸ Connect to AI… sends `commandGlobal` `aiConnect`
- `server.ts` - Local gRPC server management (anytypeHelper): spawn, stdin parent lifeline (`secret <base64url>` first, then `shutdown`), graceful stop
- `update.ts` - Auto-update logic (electron-updater, generic provider). When the update on the user's channel declares a `minimumSystemVersion` above this OS (compared with `os.release()`, the Darwin version on macOS: macOS 13 is `22.0.0`), the check falls back to the `legacy` feed (`legacy-mac.yml` for both architectures, `legacy.yml` on Windows, `legacy-linux.yml` on Linux x64 and `legacy-linux-<arch>.yml` on other Linux architectures) without allowing downgrades, so builds for dropped OS versions can still ship there. The two lookups run as one check: a manual check or a channel change while it runs never switches the updater's channel under it. A missing legacy feed (404, or the 403 the release bucket returns for an absent key) reads as "no update"; Retry after an update error runs a fresh check rather than downloading what an earlier check found
- `util.ts` - Utility functions (paths, platform detection, logging); deep links: AI links are reduced to their canonical form before main keeps or forwards them (`canonicalDeepLink`, `getRouteFromUrl`)
- `window.ts` - Window management (create, close, focus, tabs, local-link approval window)
- `download.ts` - Gateway file downloads: queues transfers one at a time (electron-dl reports concurrent ones over each other), broadcasts per-file progress and one terminal event, cancels a running or queued transfer by id, and reuses a copy already on disk instead of transferring again. A `temporary` request — a file being opened rather than saved — is given a folder of its own under `openedRoot()` (`<temp>/anytype/open/<objectId>`) and overwritten there, so its path is the same on every open; `prune()` sweeps folders untouched for a week and runs on app ready
- `checksum.ts` - Reproduces the middleware's file checksum (`sha256` + an encrypted/plain marker byte, base32 hex-alphabet, unpadded) so a local file can be proven to be an object's own content
- `downloadLedger.ts` - Remembers where each object was last downloaded (`electron-json-storage`, bounded to 500 entries), so recognising an untouched copy costs a `stat` rather than a hash
- `linkApproval.ts` - Local-link pairing prompts: deduplicates requests, queues prompts, validates user-chosen space grants, updates the space catalog, and keeps BAD_INPUT responses open for correction
- `safeStorage.ts` - Electron safe storage wrapper
- `types.ts` - TypeScript type definitions

### Libraries (`ts/lib/`)
- `installNativeMessagingHost.ts` - Installs native messaging host manifest for the Chrome/Firefox Web Clipper extension. Registers `com.anytype.desktop` on macOS, Linux, and Windows.
- `aiConnect/` - Connect to AI apps: `index.ts` (`AiConnectService`, one queue behind every `aiConnect*` IPC call), `validate.ts` (exact-shape params, sender gate), `detect.ts` (installed apps, config homes), `adapters/` (one per app: plan, apply, heal, remove; Gemini CLI, Antigravity and OpenCode are `jsonEntry` file merges, OpenCode picking its v1/v2 layout from the file or `opencode --version`; Hermes writes the key into its default profile's `.env` first (`envFile.ts`), then `mcp_servers.anytype` into `config.yaml` with a comment-keeping YAML edit (`yamlFile.ts`), and never touches an `anytype` entry it didn't write), `fsSafe.ts` / `jsonFile.ts` / `tomlFile.ts` (atomic, ownership-checked config writes), `forwarder.ts` (`anytype-mcp`, heart's Go stdio forwarder: the in-app binary checked against the build's metadata, the stable copy `~/.anytype/bin[-dev]/anytype-mcp` other apps start, its install rule), `keyStore.ts` (the forwarder's `key set / retarget / delete / check` verbs; the key only on stdin), `item.ts` (a connection's item: ownership and the three changes with their bookkeeping), `bundle.ts` (the Claude Desktop bundle and its copy in `~/.anytype/ai-connect`), `registry.ts` (`aiConnect.json` in userData: records with key hashes and fingerprints only, orphans, mint intents, the once-per-profile nudge claim), `probe.ts`, `restart.ts`, `skill.ts`, `exec.ts`. Keys are never logged or stored outside the target app's config and the forwarder's item (one private file per connection, written only by the forwarder; anytype-ts never reads it). Nothing starts Electron in Node mode

## Bundled MCP files (`mcp/`)
`build:electron` runs `scripts/prepare-forwarder.js` first: it puts `anytype-mcp` at `dist/anytype-mcp[.exe]` (from the middleware archive: `update.sh` takes `anytype-mcp-dev`, `update-ci.sh` `anytype-mcp-release`; `ANYTYPE_MCP_BIN=<file>` uses a locally built one) and signs a release-namespace binary before the frontend build (macOS `codesign`, hardened runtime, identifier `com.anytype.mcp`, no entitlements; Windows the existing `electron/hook/sign.js`). `scripts/build-mcp.js` then builds `dist/mcp/` — the skill files and `Anytype.mcpb` (a `binary` bundle per OS with that forwarder inside, version `2.<forwarder rev>.0`, no key) — and writes the build's one metadata file `electron/json/aiConnect.build.json` (packed into `app.asar`): the forwarder's and the bundle's sha256, the bundle's signer, `signed`. `dist/anytype-mcp` and `dist/mcp/` are unpacked from the asar; `mac.signIgnore` and the sign hook's early return keep the pre-signed forwarder as it is. `electron/hook/verify-forwarder.js` (the `afterSign` hook, and a step of both workflows on the finished packages) fails the build when the packaged forwarder isn't the one the metadata and the bundle describe, or isn't validly signed.

**Release signing.** Tag builds (`.github/workflows/build.yml`) and nightlies (`nightly.yml`) sign `Anytype.mcpb` and fail without a valid signature (`MCPB_SIGN_REQUIRED=1`); local builds stay unsigned (`signed: false`: the stable copy goes to `~/.anytype/bin-dev`, the bundle is named `anytype-dev`, the items to `items-dev`). Repository secrets:

| Secret | Value |
|---|---|
| `MCPB_SIGN_CERT` | Signing certificate, PEM text (written to a 0600 temp file for the build step) |
| `MCPB_SIGN_KEY` | Its private key, PEM text (same; removed after the build) |
| `MCPB_SIGN_FINGERPRINT` | SHA-256 fingerprint of that certificate (hex, colons allowed); the build verifies the signer against it with `openssl cms` |

Each OS job signs its own copy with the same certificate.

## JavaScript (`js/`)
- `preload.cjs` - Preload script for renderer process security
- `storageProbe.cjs` - Vault location classifier (cloud/network, shared by the synchronous check and the diagnostics) and `Electron.storageInfo` (drive type, filesystem, bus of the data location, asynchronous bounded I/O only; Windows via one cached PowerShell run per drive letter). Required by the preload, so it is in `asarUnpack` too

## JSON Configuration (`json/`)
- `constant.json` - Enabled languages list (26 locales)
- `cors.json` - CORS whitelist for allowed domains

## Images (`img/`)
- `icon.icns` - macOS app icon bundle
- `icons/` - App icons at multiple resolutions (16x16 through 1024x1024 PNG, 256x256 ICO)
- `iconTrayBlack.png` - Black tray icon
- `iconTrayWhite.png` - White tray icon
- `iconTrayTemplate.png` - macOS template tray icon (1x)
- `iconTrayTemplate@2x.png` - macOS template tray icon (2x)

## Build Hooks (`hook/`)
- `afterpack.js` - Post-packaging hook
- `aftersign.js` - Post-signing hook
- `beforebuild.js` - Pre-build hook
- `locale.js` - Locale generation
- `sign.js` - Code signing
- `switch-manifest.js` - Switch extension manifest between Firefox and Chromium
- `util.js` - Shared hook utilities

## macOS
- `entitlements.mac.plist` - macOS code signing entitlements (JIT, unsigned memory, dyld, library validation)

## Important: `__dirname` in Bundled Code

Since all `ts/` files are bundled into `electron.js` at the project root, `__dirname` resolves to the project root at runtime -- not to the original source file location. All path references must account for this (e.g., `path.join(__dirname, 'dist', ...)` not `path.join(__dirname, '..', '..', 'dist', ...)`).
