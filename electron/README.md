# electron/ - Electron Main Process

Electron main process files for desktop app integration.

## Files

- `electron.js` - Main entry point: app lifecycle, window creation, IPC handlers
- `preload.js` - Preload script for renderer process security

### JavaScript Modules (`js/`)
- `window.js` - Window management (create, close, focus, tabs)
- `menu.js` - Native application menu (File, Edit, View, etc.)
- `api.js` - IPC API handlers for renderer-to-main communication
- `config.js` - App configuration management
- `server.js` - Local gRPC server management (anytypeHelper)
- `update.js` - Auto-update logic
- `util.js` - Utility functions (paths, platform detection)

### JSON Configuration (`json/`)
- `constant.json` - Enabled languages list (25 locales)
- `cors.json` - CORS whitelist for allowed domains

### macOS
- `entitlements.mac.plist` - macOS code signing entitlements (JIT, unsigned memory, dyld, library validation)
