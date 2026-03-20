# Migration Guide: rspack + npm → Vite + bun

This document covers the migration from rspack (webpack alternative) + npm to Vite + bun for the Anytype desktop client.

## What Changed

| Before | After |
|--------|-------|
| npm (package manager) | bun |
| rspack (bundler) | Vite (esbuild dev / Rollup production) |
| `package-lock.json` | `bun.lock` |
| `rspack.config.js` | `vite.config.ts` |
| `rspack.pixi.config.js` | `vite.worker.config.ts` |
| `rspack.node.config.js` + `save-node-deps.js` | `scripts/analyze-deps.js` (esbuild) |
| N/A | `vite.extension.config.ts` |
| N/A | `vite.web.config.ts` |

## Getting Started (New Setup)

### Prerequisites

1. **Install bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install Node.js** (still required for Electron and electron-builder):
   Node.js 25+ recommended.

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/anyproto/anytype-ts.git
cd anytype-ts

# 2. Install dependencies
bun install

# 3. Trust postinstall scripts (only needed on first install)
bun pm trust @sentry/cli @swc/core

# 4. Fetch middleware
./update.sh <platform> <arch>

# 5. Start development
bun run start:dev
```

### Existing Developers (Migrating)

```bash
# 1. Install bun
curl -fsSL https://bun.sh/install | bash

# 2. Pull latest changes
git pull

# 3. Remove old lockfile and node_modules (clean slate)
rm -rf node_modules package-lock.json

# 4. Install with bun
bun install

# 5. Trust postinstall scripts
bun pm trust @sentry/cli @swc/core

# 6. Verify everything works
bun run typecheck
bun run lint
bun run build
```

## Command Reference

All `npm run` commands are now `bun run`:

| Old Command | New Command | Description |
|-------------|-------------|-------------|
| `npm run start:dev` | `bun run start:dev` | Start dev server + Electron |
| `npm run build` | `bun run build` | Production build |
| `npm run build:dev` | `bun run build:dev` | Development build |
| `npm run typecheck` | `bun run typecheck` | TypeScript type checking |
| `npm run lint` | `bun run lint` | ESLint |
| `npm run dist:mac` | `bun run dist:mac` | Build macOS distribution |
| `npm run dist:win` | `bun run dist:win` | Build Windows distribution |
| `npm run dist:linux` | `bun run dist:linux` | Build Linux distribution |
| `npm run build:pixi` | `bun run build:pixi` | Build PixiJS worker bundle |
| `npm run build:deps` | `bun run build:deps` | Analyze runtime dependencies |
| `npm run start:web` | `bun run start:web` | Start web mode |
| N/A | `bun run build:ext` | Build browser extension |
| N/A | `bun run build:web` | Production build for web |
| N/A | `bun run generate:protos` | Regenerate TypeScript protobuf bindings |

### Protobuf TypeScript Bindings

TypeScript protobuf bindings are generated from `.proto` files using `ts-proto` and live in `middleware/`. To regenerate after a middleware update:

```bash
bun run generate:protos
```

**Prerequisites**: `protoc` (protobuf compiler) must be installed. The `.proto` source files come from `dist/lib/protos/` (fetched by `update.sh`).

**Import alias**: Use `Proto/` to import generated types:
```typescript
import { Rpc_Account_Create_Request } from 'Proto/pb/protos/commands';
import { Block } from 'Proto/pkg/lib/pb/model/protos/models';
```

### Testing a macOS build

```bash
ELECTRON_SKIP_NOTARIZE=1 bun run dist:mac
./dist/mac-arm64/Anytype.app/Contents/MacOS/Anytype
```

## Vite Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Main Electron renderer build (app target) |
| `vite.extension.config.ts` | Browser extension build (heavy deps stubbed) |
| `vite.web.config.ts` | Browser-only web mode build |
| `vite.worker.config.ts` | PixiJS worker bundle (IIFE for importScripts) |

## Key Differences from rspack

### SCSS Imports
SCSS files use `~` prefix for imports (webpack/rspack convention). Vite handles this via a custom sass importer configured in each Vite config file. No changes to SCSS files are needed.

### Asset Inlining
Vite inlines all images/fonts as base64 (via `assetsInlineLimit: 10000000`), matching the previous `asset/inline` behavior.

### Protobuf CJS Files
The large protobuf files in `dist/lib/pb/` are CommonJS. Vite's `commonjsOptions` is configured to transform these for the ESM build.

### `require.context` → `import.meta.glob`
Webpack/rspack `require.context()` calls have been replaced with Vite's `import.meta.glob()`:
- `src/ts/lib/relation.ts` — relation icon loading
- `src/ts/lib/util/object.ts` — type and default icon loading
- `src/ts/component/popup/graph/OnboardingGraphWorker.tsx` — type icons

### `require()` for images → ES imports
Static `require('img/...')` calls have been replaced with ES `import` statements in:
- `src/ts/component/util/marker.tsx`
- `src/ts/component/util/iconObject.tsx`
- `src/ts/lib/util/object.ts`
- `src/ts/lib/util/common.ts`

### Dynamic `require()` for JSON → `import.meta.glob`
- `src/ts/lib/translate.ts` — language file loading now uses `import.meta.glob`
- `src/ts/lib/util/menu.ts` — locale data now uses static import
- `src/ts/lib/util/common.ts` — text data now uses static import

### Dependency Analysis
The old pipeline (`rspack.node.config.js` → grep/sed → `save-node-deps.js`) is replaced by `scripts/analyze-deps.js` which uses esbuild's metafile to extract `node_modules` dependencies.

## CI/CD Changes

Both `build.yml` and `nightly.yml` workflows have been updated:

1. **bun setup**: Added `oven-sh/setup-bun@v2` step
2. **Node.js**: Still required (for Electron and electron-builder)
3. **`samuelmeuli/action-electron-builder@v1`**: Replaced with direct commands:
   - `bun install` (dependency installation)
   - `bun run build` (Vite production build)
   - macOS certificate import (manually scripted)
   - `bunx electron-builder` (packaging and publishing)
4. **Removed**: `npm install --save-dev webpack-cli` step (no longer needed)

## Troubleshooting

### `bun pm untrusted` — Blocked postinstall scripts
Some packages need their postinstall scripts to run:
```bash
bun pm trust @sentry/cli @swc/core
```

### Build fails with "Cannot find module"
Make sure `dist/lib/` exists (protobuf files). Run `./update.sh` if needed.

### SCSS compilation errors
If you see errors about `~` imports, ensure the sass importer is configured in the Vite config. The `api: 'legacy'` setting is required for the custom importer.

### HMR not working in dev mode
Vite's dev server runs on port 8080 by default (configurable via `SERVER_PORT` env var). Make sure no other process is using that port.

### Windows Development
Bun on Windows is production-ready since bun 1.1+. If issues arise, you can fallback to npm for dependency installation while still using Vite for builds:
```bash
npm install --legacy-peer-deps
bun run build
```
