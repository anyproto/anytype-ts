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

### Important Patterns
- All UI text should use `translate()` function for i18n
- Block operations should go through the command system
- Use existing utility functions in `lib/util/` before creating new ones
- Follow existing component patterns in `component/` directory
- Store updates should trigger UI re-renders automatically via MobX

## Tab System Architecture

### Overview
The application uses a multi-tab architecture where each tab is a separate `WebContentsView` in Electron.

### Key Files
- `electron/js/window.js` - Tab management (createTab, setActiveTab, removeTab, reorderTabs)
- `dist/js/tabs.js` - Tab bar UI rendering and drag/drop with Sortable.js
- `dist/css/tabs.css` - Tab bar styling
- `electron/js/api.js` - Tab-related API methods (getTabs, getTab, updateTab)

### Tab Communication
- **Main → Tab Bar**: `Util.send(win, 'event-name', ...)` - sends to tabs.html
- **Main → Specific Tab**: `Util.sendToTab(win, tabId, 'event-name', ...)` - sends to specific view
- **Main → All Tabs**: `Util.sendToAllTabs(win, 'event-name', ...)` - broadcasts to all views
- **Tab → Main**: `Renderer.send('command', ...)` via IPC

### Tab State
- Each tab stores data in `view.data` object (title, icon, route, isHomeTab, etc.)
- Renderer accesses tab state via `S.Common.tabId`, `S.Common.isHomeTab`, `S.Common.singleTab`
- Tab bar visibility controlled by `config.alwaysShowTabs` and tab count

### Home Tab
- First tab (index 0) is the "home tab" with special behavior:
  - Marked with `isHomeTab: true` in `view.data`
  - Displays home icon instead of object icon/name
  - Cannot be dragged or closed
  - Other tabs cannot be dropped at position 0
  - Only tab where vault toggle is visible and vault can be opened
- Non-home tabs have vault panel closed with no toggle button

### Adding Tab Features
1. Add data to `view.data` in `window.js` createTab()
2. Include in API responses (`api.js` getInitData/getTab)
3. Add IPC handler in `app.tsx` registerIpcEvents()
4. Add state to `store/common.ts` (observable, getter, action)
5. Update UI components to use the new state