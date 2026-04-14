# electron/ - Electron Main Process

Electron main process files for desktop app integration. TypeScript source in `ts/` is bundled into `electron.js` at the project root via `scripts/build-electron.js`.

## TypeScript Source (`ts/`)

- `main.ts` - Main entry point: app lifecycle, window creation, IPC handlers, signal handling
- `api.ts` - IPC API handlers for renderer-to-main communication
- `config.ts` - App configuration management
- `menu.ts` - Native application menu (File, Edit, View, etc.)
- `server.ts` - Local gRPC server management (anytypeHelper)
- `update.ts` - Auto-update logic
- `util.ts` - Utility functions (paths, platform detection, logging)
- `window.ts` - Window management (create, close, focus, tabs)
- `safeStorage.ts` - Electron safe storage wrapper
- `types.ts` - TypeScript type definitions

### Libraries (`ts/lib/`)
- `installNativeMessagingHost.ts` - Installs native messaging host manifest for the Chrome/Firefox Web Clipper extension. Registers `com.anytype.desktop` on macOS, Linux, and Windows.

## JavaScript (`js/`)
- `preload.cjs` - Preload script for renderer process security

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
