# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run start:dev` - Start development with hot reload (macOS/Linux)
- `npm run start:dev-win` - Start development with hot reload (Windows)
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

### Testing and Quality
- `npm run precommit` - Run pre-commit checks (lint-staged)
- Always run `npm run typecheck` and `npm run lint` after making changes

### Distribution
- `npm run dist:mac` - Build macOS distribution
- `npm run dist:win` - Build Windows distribution
- `npm run dist:linux` - Build Linux distribution

### Testing Builds
To test a build on macOS without code signing:
```bash
ELECTRON_SKIP_NOTARIZE=1 npm run dist:mac
```

The build output is in `dist/mac-arm64` (or `dist/mac` for x64). You can run the app directly from terminal:
```bash
./dist/mac-arm64/Anytype.app/Contents/MacOS/Anytype
```

### Build Dependencies
Dependencies included in the packaged app are whitelisted. The `npm run build:deps` script auto-detects required dependencies, but if some are missing at runtime, explicitly add them to `package.deps.json`.

### Development Setup
Before development, you need the anytype-heart middleware:
1. Run `./update.sh <platform> <arch>` to fetch middleware
2. Start anytypeHelper binary in background
3. Use `SERVER_PORT` env var to specify gRPC port

## Architecture Overview

### High-Level Structure
Anytype is an Electron-based desktop application with TypeScript/React frontend communicating with a Go-based middleware (anytype-heart) via gRPC.

**Key Components:**
- **Electron Main Process** (`electron.js`) - Window management, IPC, system integration
- **React Frontend** (`src/ts/`) - UI components and business logic
- **gRPC Middleware** - Backend logic (separate anytype-heart repository)
- **Block-based Editor** - Document editing with composable blocks

### Frontend Architecture (src/ts/)

**Entry Points:**
- `entry.tsx` - Application entry point
- `app.tsx` - Main React application component

**Core Libraries (`lib/`):**
- `api/` - gRPC communication (dispatcher, commands, mapper)
- `keyboard.ts` - Keyboard shortcuts and input handling
- `storage.ts` - Local storage management
- `renderer.ts` - Electron IPC communication
- `util/` - Utility functions (common, data, router, etc.)

**State Management (`store/`):**
- MobX-based stores for different domains:
- `common.ts` - Global application state
- `auth.ts` - Authentication state
- `block.ts` - Document block state
- `detail.ts` - Object detail state
- `menu.ts`, `popup.ts` - UI state

**Component Structure (`component/`):**
- `block/` - Document block components (text, dataview, media, etc.)
- `page/` - Page-level components (auth, main, settings)
- `menu/` - Context menus and dropdowns
- `popup/` - Modal dialogs
- `sidebar/` - Left/right sidebars
- `util/` - Reusable UI utilities

### Key Architectural Patterns

**Block-Based Documents:**
- Documents are composed of blocks (text, images, databases, etc.)
- Each block type has corresponding model, content, and component
- Block operations handled via gRPC commands

**MobX State Management:**
- Reactive state with MobX stores
- Components observe store changes automatically
- Stores organized by domain (auth, blocks, UI, etc.)

**gRPC Communication:**
- Frontend communicates with middleware via gRPC
- Commands in `lib/api/command.ts`
- Response mapping in `lib/api/mapper.ts`
- Real-time updates via gRPC streaming

**Electron Integration:**
- Main process handles system integration
- Renderer process handles UI
- IPC communication for file operations, updates, etc.

### Graph Visualization Architecture

The graph view uses a Web Worker with PixiJS WebGL rendering for performance:

**Files:**
- `src/ts/component/graph/provider.tsx` - React component, D3 zoom/drag, image loading
- `dist/workers/graph.pixi.js` - Web Worker with D3 force simulation + PixiJS WebGL rendering
- `dist/workers/lib/pixi.min.js` - Bundled PixiJS for worker (built from `rspack.pixi.config.js`)
- `dist/workers/lib/util.js` - Canvas drawing utilities (legacy, still used for some helpers)

**Architecture:**
- OffscreenCanvas transferred to worker for off-main-thread rendering
- PixiJS 8 with WebWorkerAdapter for GPU-accelerated WebGL rendering
- D3.js force simulation for physics (center, charge, link, collision, cluster forces)
- Communication via postMessage between provider and worker

**Rendering Structure (PixiJS):**
- Stage → edgesGraphics (PIXI.Graphics for all edges)
- Stage → nodesContainer (PIXI.Container with Sprites for nodes)
- Stage → labelsContainer (PIXI.Container with Text for labels)
- Stage → selectBoxGraphics (PIXI.Graphics for drag selection)

**GraphProvider API:**
- Props: `id`, `rootId`, `data: { nodes, edges }`, `storageKey`, `load`
- Ref methods: `init()`, `resize()`, `addNewNode()`, `forceUpdate()`
- Window events: `updateGraphSettings.{id}`, `updateGraphRoot.{id}`, `updateGraphData.{id}`

**Usage locations:**
- `src/ts/component/page/main/graph.tsx` - Global graph page
- `src/ts/component/block/dataview/view/graph.tsx` - Dataview graph
- `src/ts/component/widget/view/graph/index.tsx` - Widget graph

**Worker message protocol:**
- Provider → Worker: `init`, `updateSettings`, `image`, `onZoom`, `onClick`, `onSelect`, `onMouseMove`, `onDragStart/Move/End`, `setRootId`, `resize`, `updateTheme`
- Worker → Provider: `onClick`, `onSelect`, `onMouseMove`, `onContextMenu`, `onTransform`, `setRootId`

**Building the PixiJS worker bundle:**
```bash
npx rspack --config rspack.pixi.config.js
```

## Development Workflow

### Making Changes
1. Identify the relevant component in `src/ts/component/`
2. Check corresponding interfaces in `src/ts/interface/`
3. Look for related stores in `src/ts/store/`
4. Update models in `src/ts/model/` if needed
5. Add gRPC commands in `src/ts/lib/api/` if backend changes needed

### File Organization
- **Components**: UI components in `src/ts/component/`
- **Styles**: SCSS files in `src/scss/` (organized to match components)
- **Assets**: Images and icons in `src/img/`
- **Configuration**: Electron config in `electron/`
- **Build**: Rspack configuration in `rspack.config.js`

### Key Development Notes
- Uses Rspack for bundling (faster Webpack alternative)
- TypeScript with React 17
- MobX for state management
- Custom block-based editor system
- gRPC for backend communication
- Electron for desktop app packaging
- CSS supports native nesting - use nested selectors instead of flat/inline selectors
- Do not use `cursor: pointer` in CSS - the app does not use custom cursors

### Code Style
- Write `else if` with a linebreak before `if`:
  ```typescript
  if (condition) {
      // ...
  } else
  if (anotherCondition) {
      // ...
  }
  ```
- Wrap logical parts of compound conditions in parentheses for readability:
  ```typescript
  // Good
  const isValid = (x > 0) && (y > 0) && (x < maxWidth);
  if ((a > b) && (c < d)) { ... }

  // Bad
  const isValid = x > 0 && y > 0 && x < maxWidth;
  if (a > b && c < d) { ... }
  ```

### Important Patterns
- All UI text should use `translate()` function for i18n
- Translation keys are defined in `src/json/text.json` (source of truth). Files in `dist/lib/json/lang/` are generated — do not edit them directly
- Block operations should go through the command system
- Use existing utility functions in `lib/util/` before creating new ones
- Follow existing component patterns in `component/` directory
- Store updates should trigger UI re-renders automatically via MobX

## Web Mode Development

Run in browser without Electron: `npm run start:web` (starts anytypeHelper + dev server). Use `ANYTYPE_USE_SIDE_SERVER=http://...` to skip helper start. See `src/ts/lib/web/README.md` for details.

## Linear API Integration

Use the `LINEAR_API_KEY` environment variable to fetch issue details from Linear.

**Fetch issue by ID:**
```bash
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"query{issue(id:\"JS-1234\"){title description state{name}priority labels{nodes{name}}comments{nodes{body createdAt}}}}"}' | jq .
```

**Important:** Use `$(printenv LINEAR_API_KEY)` instead of `$LINEAR_API_KEY` directly in curl commands to avoid shell expansion issues.

## Figma MCP Integration

Use the Figma MCP tools to fetch design context and screenshots from Figma files.

**Available tools:**
- `mcp__figma__get_design_context` - Get UI code/design context for a Figma node (preferred)
- `mcp__figma__get_screenshot` - Get a screenshot of a Figma node
- `mcp__figma__get_metadata` - Get metadata/structure of a Figma node

**Extract parameters from Figma URLs:**
- URL format: `https://www.figma.com/design/:fileKey/:fileName?node-id=:nodeId`
- `fileKey` is the ID after `/design/`
- `nodeId` is in the `node-id` query parameter (convert `-` to `:` for the API)

**Extract parameters from Figma URLs:**
For URL `https://www.figma.com/design/uWka9aJ7IOdvHch60rIRlb/MyFile?node-id=12769-19003`:
- `fileKey`: `uWka9aJ7IOdvHch60rIRlb`
- `nodeId`: `12769:19003`

**Important - Icons and Images:**
- All icons and images must be stored locally in `src/img/` - do NOT use remote Figma asset URLs
- When implementing designs from Figma, recreate icons as SVG files in the appropriate `src/img/icon/` subdirectory
- Follow existing icon patterns (e.g., `src/img/icon/add/` for editor control button icons)
- Icons typically have two variants: `name0.svg` (default state, #B6B6B6) and `name1.svg` (hover state, #252525)