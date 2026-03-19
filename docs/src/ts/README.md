# src/ts/ - TypeScript Source

Root of the frontend TypeScript/React codebase for Anytype desktop.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `component/` | React UI components (blocks, pages, menus, popups, sidebars, widgets, etc.) |
| `lib/` | Core libraries: API layer, constants, services, utilities, web mode |
| `store/` | MobX state management stores (auth, blocks, details, menus, popups, etc.) |
| `model/` | Data model classes for blocks, views, filters, notifications |
| `interface/` | TypeScript interfaces and enums for the entire app |
| `hook/` | Custom React hooks |
| `docs/` | In-app documentation (What's New content) |
| `workers/` | Web Worker entry points |

## Entry Points

- `entry.tsx` - Application bootstrap
- `app.tsx` - Main React component

## Key Patterns

- **MobX** for reactive state management (`observer()` HOC on components)
- **gRPC** communication with middleware via `C.*` commands
- **Block-based** document model (all content is composed of blocks)
- **`translate()`** for all UI text (i18n via `src/json/text.json`)

## Import Aliases

- `I` - Interfaces (`src/ts/interface/`)
- `C` - gRPC Commands (`src/ts/lib/api/command.ts`)
- `S` - Stores (`src/ts/store/`)
- `U` - Utilities (`src/ts/lib/util/`)
- `J` - JSON constants (`src/json/`)
