# Web Mode

Run anytype-ts in a browser without Electron for development and testing.

## Quick Start

```bash
# Start web mode (automatically starts anytypeHelper and opens browser)
npm run start:web
```

That's it! The script will:
1. Start `anytypeHelper` with gRPC-web proxy (auto-assigned ports)
2. Start the webpack dev server on port 9090
3. Open your browser with the correct URL

## Using External Server

If you're running `anytypeHelper` separately (e.g., for debugging):

```bash
# Use an external gRPC-web server
ANYTYPE_USE_SIDE_SERVER=http://127.0.0.1:31008 npm run start:web
```

## Environment Variables

| Variable                   | Description                        | Default                           |
|----------------------------|------------------------------------|-----------------------------------|
| `ANYTYPE_USE_SIDE_SERVER`  | External gRPC-web server URL       | (starts anytypeHelper)            |
| `WEB_PORT`                 | Dev server port                    | `9090`                            |
| `WEB_DATA_PATH`            | Data storage path for backend      | OS app data (see below)           |

**Default data paths by OS:**
- **macOS**: `~/Library/Application Support/anytype/data`
- **Windows**: `%APPDATA%/anytype/data`
- **Linux**: `~/.config/anytype/data`

## URL Parameters

The browser URL accepts these parameters (auto-configured by start script):

| Parameter   | Description                          |
|-------------|--------------------------------------|
| `server`    | gRPC-web proxy address               |
| `dataPath`  | Data storage path for backend        |

## Architecture

```
Browser (localhost:9090)
    │
    ├─► React App (entry.web.tsx)
    │       │
    │       └─► electronMock.ts (mocks Electron API)
    │
    └─► gRPC-web ──► anytypeHelper (auto-assigned port)
```

## Key Files

- `scripts/start-web.js` - Startup script (starts helper, rspack, opens browser)
- `src/ts/entry.web.tsx` - Web entry point with dynamic imports
- `src/ts/lib/web/electronMock.ts` - Mock implementation of Electron API
- `rspack.config.js` - Web build configuration (webConfig section)
- `dist/index.web.html` - HTML template for web mode

## File Uploads

In web mode, file uploads work via the dev server middleware:

1. Browser selects file via `showOpenDialog`
2. File content is read as base64
3. POST to `/api/web-upload` endpoint
4. Dev server writes file to temp directory
5. Real filesystem path returned to app
6. Backend reads file from that path

## Limitations

- Some Electron-specific features are mocked/no-op
- File system operations go through temp directory proxy
- No native OS integrations (tray, menu bar, etc.)

## npm Scripts

| Command                | Description                                    |
|------------------------|------------------------------------------------|
| `npm run start:web`    | Start anytypeHelper + dev server               |
| `npm run start:dev-web`| Same as above + auto-open browser              |
| `npm run build:web`    | Production build to dist-web/                  |
