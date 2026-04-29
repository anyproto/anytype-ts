# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `bun run start:dev` - Start development with hot reload (macOS/Linux)
- `bun run start:dev-win` - Start development with hot reload (Windows)
- `bun run build` - Production build (Vite)
- `bun run build:dev` - Development build (Vite)
- `bun run build:ext` - Extension build (Vite)
- `bun run build:pixi` - Build PixiJS worker bundle (Vite)
- `bun run typecheck` - Run TypeScript type checking
- `bun run lint` - Run ESLint

### Testing and Quality
- `bun run precommit` - Run pre-commit checks (lint-staged)
- Always run `bun run typecheck` and `bun run lint` after making changes

### Distribution
- `bun run dist:mac` - Build macOS distribution
- `bun run dist:win` - Build Windows distribution
- `bun run dist:linux` - Build Linux distribution

### Testing Builds
To test a build on macOS without code signing:
```bash
ELECTRON_SKIP_NOTARIZE=1 bun run dist:mac
```

The build output is in `dist/mac-arm64` (or `dist/mac` for x64). You can run the app directly from terminal:
```bash
./dist/mac-arm64/Anytype.app/Contents/MacOS/Anytype
```

### Build Dependencies
Dependencies included in the packaged app are whitelisted. The `bun run build:deps` script (using esbuild) auto-detects required dependencies, but if some are missing at runtime, explicitly add them to `package.deps.json`.

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
- `dist/workers/graph.js` - Web Worker with D3 force simulation + PixiJS WebGL rendering
- `dist/workers/lib/pixi.min.js` - Bundled PixiJS for worker (built from `vite.worker.config.ts`)

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
bun run build:pixi
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
- **Build**: Vite configuration in `vite.config.ts` (app), `vite.extension.config.ts` (extension), `vite.web.config.ts` (web), `vite.worker.config.ts` (PixiJS worker)

### Key Development Notes
- Uses Vite for bundling (esbuild dev, Rollup production) with bun as package manager
- TypeScript with React 18
- MobX for state management
- Custom block-based editor system
- gRPC for backend communication
- Electron for desktop app packaging
- CSS supports native nesting - use nested selectors instead of flat/inline selectors
- Do not use `cursor: pointer` in CSS - the app does not use custom cursors
- **Do not change any style or design properties (colors, spacing, sizes, etc.) unless explicitly asked.** Design decisions are intentional — never "fix" or "improve" visual values on your own
- **Never change colors on your own.** Colors (CSS variables, hardcoded values, theme overrides) are only changed through design tasks with explicit design specs. Even if a color looks wrong or inconsistent, do not fix it unless a design task specifically asks for it
- For CSS and UI styling changes, match exact pixel values, border-radius, padding, and colors from the user's specifications on the first attempt. Do not guess or approximate visual values

### Code Style
- **The project uses tabs for indentation, not spaces.** All TypeScript, TSX, and SCSS files use tab characters.
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
- Collect CSS class lists into a separate `cn` variable before the return statement:
  ```typescript
  // Good
  const cn = [ 'commentPost', (isEditing ? 'isEditing' : '') ];
  return <div className={cn.join(' ')} />;

  // Bad — inline class list arrays hurt readability
  return <div className={[ 'commentPost', (isEditing ? 'isEditing' : '') ].join(' ')} />;
  ```
- Never combine a selector's own properties and its nested children in the same braces. Instead, write two separate blocks: a one-liner for the selector's own properties, then a second block with the same selector containing only nested children. Leaf selectors (no nested children) can be one-liners.
  ```scss
  // Good
  .mediaState { display: flex; gap: 12px 0px; align-items: center; }
  .mediaState {
      .icon.ghost { width: 48px; height: 48px; }
      .name { text-align: center; }
  }

  // Bad — mixing own properties and children in one block
  .mediaState {
      display: flex; gap: 12px 0px; align-items: center;

      .icon.ghost { width: 48px; height: 48px; }
      .name { text-align: center; }
  }
  ```

### Storybook
- All new components should be added to Storybook automatically
- Component variations should be implemented as separate props, not as className strings. For example, use `withBackground` as a boolean prop instead of passing `'withBackground'` via className — this makes components work properly with Storybook controls

### Important Patterns
- All UI text should use `translate()` function for i18n
- Translation keys are defined in `src/json/text.json` (source of truth). Files in `dist/lib/json/lang/` are generated — do not edit them directly
- Block operations should go through the command system
- Use existing utility functions in `lib/util/` before creating new ones
- Follow existing component patterns in `component/` directory
- Store updates should trigger UI re-renders automatically via MobX

### DOM Helpers
- **Never use raw `document.getElementById()` or `element.querySelector()`** — use `U.Dom` helpers instead:
  - `U.Dom.get(id)` — wraps `document.getElementById(id)`
  - `U.Dom.select(selector, root?)` — wraps `root.querySelector(selector)` with error handling
  - `U.Dom.selectAll(selector, root?)` — wraps `root.querySelectorAll(selector)`
  - `U.Dom.addClass(el, cn)`, `U.Dom.removeClass(el, cn)`, `U.Dom.hasClass(el, cn)` — class manipulation
- jQuery (`$`) has been removed from the project. Never use `$()` or import jQuery

## Directory Documentation

Detailed documentation is available in `docs/` for deeper context on each module:

### Source Root
- [`docs/src/ts/README.md`](docs/src/ts/README.md) - TypeScript source overview, entry points, import aliases, key patterns

### Components
- [`docs/src/ts/component/README.md`](docs/src/ts/component/README.md) - All 18 component subdirectories overview
- [`docs/src/ts/component/block/README.md`](docs/src/ts/component/block/README.md) - Block system: 19 block types (text, media, dataview, table, chat, embed, etc.)
- [`docs/src/ts/component/page/README.md`](docs/src/ts/component/page/README.md) - Page routing: auth flow, main pages, settings hierarchy
- [`docs/src/ts/component/menu/README.md`](docs/src/ts/component/menu/README.md) - Menu system: ~50 context menu types with positioning and keyboard nav
- [`docs/src/ts/component/popup/README.md`](docs/src/ts/component/popup/README.md) - Popup system: ~27 modal dialog types
- [`docs/src/ts/component/editor/README.md`](docs/src/ts/component/editor/README.md) - Block-based document editor (page.tsx ~2600 lines)
- [`docs/src/ts/component/graph/README.md`](docs/src/ts/component/graph/README.md) - Graph visualization: D3 + PixiJS WebGL via Web Worker
- [`docs/src/ts/component/sidebar/README.md`](docs/src/ts/component/sidebar/README.md) - Left/right sidebars with tree navigation and object views
- [`docs/src/ts/component/widget/README.md`](docs/src/ts/component/widget/README.md) - Dashboard widgets: list, gallery, board, calendar, graph views
- [`docs/src/ts/component/cell/README.md`](docs/src/ts/component/cell/README.md) - Data cells for dataview grid/board rendering
- [`docs/src/ts/component/drag/README.md`](docs/src/ts/component/drag/README.md) - Drag-and-drop system for blocks and lists
- [`docs/src/ts/component/form/README.md`](docs/src/ts/component/form/README.md) - Form controls: inputs, selects, phrases, pins
- [`docs/src/ts/component/header/README.md`](docs/src/ts/component/header/README.md) - Page headers by context (editor, set, settings, auth)
- [`docs/src/ts/component/footer/README.md`](docs/src/ts/component/footer/README.md) - Page footers (auth, main editor)
- [`docs/src/ts/component/list/README.md`](docs/src/ts/component/list/README.md) - Object list components with virtual scrolling
- [`docs/src/ts/component/notification/README.md`](docs/src/ts/component/notification/README.md) - Toast notification system
- [`docs/src/ts/component/preview/README.md`](docs/src/ts/component/preview/README.md) - Preview cards and tooltips
- [`docs/src/ts/component/selection/README.md`](docs/src/ts/component/selection/README.md) - Block and text selection handling
- [`docs/src/ts/component/util/README.md`](docs/src/ts/component/util/README.md) - ~48 reusable utility components
- [`docs/src/ts/component/comment/README.md`](docs/src/ts/component/comment/README.md) - Comment system: threaded discussions with Lexical editor, rich content parts, reactions

### Libraries
- [`docs/src/ts/lib/README.md`](docs/src/ts/lib/README.md) - Core libraries overview (api, util, services, keyboard, storage)
- [`docs/src/ts/lib/api/README.md`](docs/src/ts/lib/api/README.md) - gRPC communication: dispatcher, 100+ commands, protobuf mapping
- [`docs/src/ts/lib/util/README.md`](docs/src/ts/lib/util/README.md) - ~20 utility modules (common, data, menu, object, router, string, etc.)
- [`docs/src/ts/lib/constant/README.md`](docs/src/ts/lib/constant/README.md) - Application constants and static configuration
- [`docs/src/ts/lib/service/README.md`](docs/src/ts/lib/service/README.md) - Singleton services (sidebar, analytics, focus, translation)

### State & Data
- [`docs/src/ts/store/README.md`](docs/src/ts/store/README.md) - MobX stores: 13 domain stores (auth, block, common, detail, record, menu, popup, chat, etc.)
- [`docs/src/ts/model/README.md`](docs/src/ts/model/README.md) - Data models: Block, Content classes, View, Filter, Sort
- [`docs/src/ts/interface/README.md`](docs/src/ts/interface/README.md) - TypeScript interfaces and enums for all domain types

### Other
- [`docs/src/ts/hook/README.md`](docs/src/ts/hook/README.md) - Custom React hooks
- [`docs/src/ts/docs/README.md`](docs/src/ts/docs/README.md) - In-app documentation and help content
- [`docs/src/ts/workers/README.md`](docs/src/ts/workers/README.md) - Web Workers (graph PixiJS worker)
- [`docs/electron/README.md`](docs/electron/README.md) - Electron main process: window management, IPC, updates, menus
- [`docs/src/scss/README.md`](docs/src/scss/README.md) - SCSS stylesheets organized to mirror component structure
- [`docs/src/img/README.md`](docs/src/img/README.md) - Images, icons (SVG), and static assets
- [`docs/src/json/README.md`](docs/src/json/README.md) - JSON data: translations, constants, colors, keyboard shortcuts

### Code Reviews
- [`docs/REVIEW-v0.54.11-to-HEAD.md`](docs/REVIEW-v0.54.11-to-HEAD.md) - Review of changes since v0.54.11 stable release

## Web Mode Development

Run in browser without Electron: `bun run start:web` (starts anytypeHelper + Vite dev server). Use `ANYTYPE_USE_SIDE_SERVER=http://...` to skip helper start. See `docs/src/ts/lib/web/README.md` for details.

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

### Linear Workflow

**When starting work on an issue:**
- **Move the issue** to **"In development"** state before beginning implementation.

**After pushing a fix for an issue:**

1. **Comment on the issue** with a brief description of the fix (what was changed and why).
2. **Move the issue** to the appropriate state based on its labels:
   - If the issue has a **"Design"** label → move to **"Design review"**
   - Otherwise → move to **"Waiting for testing"**

**Comment on an issue:**
```bash
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"mutation{commentCreate(input:{issueId:\"<ISSUE_UUID>\",body:\"<comment text>\"}){success}}"}' | jq .
```

**Move issue to "Waiting for testing":**
```bash
# First, find the state ID (one-time per project):
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"query{workflowStates(filter:{name:{eq:\"Waiting for testing\"}}){nodes{id name}}}"}' | jq .

# Then update the issue:
curl -s -X POST "https://api.linear.app/graphql" \
  --header "Content-Type: application/json" \
  --header "Authorization: $(printenv LINEAR_API_KEY)" \
  --data '{"query":"mutation{issueUpdate(id:\"<ISSUE_UUID>\",input:{stateId:\"<STATE_UUID>\"}){success}}"}' | jq .
```

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
- Example: `https://www.figma.com/design/uWka9aJ7IOdvHch60rIRlb/MyFile?node-id=12769-19003` → `fileKey`: `uWka9aJ7IOdvHch60rIRlb`, `nodeId`: `12769:19003`

**Important - Icons and Images:**
- All icons and images must be stored locally in `src/img/` - do NOT use remote Figma asset URLs
- When implementing designs from Figma, recreate icons as SVG files in the appropriate `src/img/icon/` subdirectory
- Follow existing icon patterns (e.g., `src/img/icon/add/` for editor control button icons)
- Icons use semantic naming (e.g., `arrow.svg`, `swiper.svg`); hover color is handled via CSS, not separate SVG files

## Update Docs

After completing any task that adds, removes, or significantly modifies files in a component/abstraction folder, run the `/update-docs` skill to update the corresponding README.md in `docs/`. Documentation is kept lean and delta-driven — only sections affected by the change are updated. Skip for trivial changes (typo fixes, minor logic tweaks).

## Dark Mode Check

After completing any task that edits SCSS files (`src/scss/`), SVG/image files (`src/img/`), or adds new UI components, run the `/dark-mode-check` skill to audit for dark mode issues. This catches:
- Hardcoded colors that should use CSS variables (`--color-text-*`, `--color-bg-*`, `--color-shape-*`, etc.)
- Missing dark icon variants in `src/img/theme/dark/`
- Inline `html.themeDark` overrides that belong in `src/scss/theme/dark/`
- Dynamic icon paths missing `S.Common.getThemePath()`
- **Never duplicate unchanged values from light theme into dark theme** — only override CSS vars when the value actually differs

## QA Engineer

After completing any task that modifies user-facing behavior — especially in the editor (`component/editor/`, `component/block/`), menus (`component/menu/`), popups (`component/popup/`), sidebar (`component/sidebar/`), or widgets (`component/widget/`) — run the `/qa-engineer` skill to generate E2E test coverage.

The QA Engineer skill:
1. Analyzes the git diff to identify user-facing changes
2. Checks existing test coverage in `../anytype-desktop-suite/`
3. Creates a test plan in `../anytype-desktop-suite/specs/`
4. Generates Playwright test files in `../anytype-desktop-suite/tests/`
5. Creates page objects if needed in `../anytype-desktop-suite/src/pages/`

**Skip** for changes that have no user-facing impact (type refactors, internal utilities, CSS-only tweaks, build config).

**Test suite repo:** `../anytype-desktop-suite` — Playwright E2E tests with Page Object Model, translation-aware selectors, and gRPC server lifecycle management. See its `CLAUDE.md` for test architecture details.

