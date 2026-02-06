# lib/ - Core Libraries

Application infrastructure: API communication, constants, services, utilities, and web mode support.

## Directories

| Directory | Purpose |
|-----------|---------|
| `api/` | gRPC communication layer (commands, dispatcher, mapper, response handling) |
| `constant/` | Application constants and configuration values |
| `service/` | Singleton services (sidebar, keyboard, focus, analytics, storage, etc.) |
| `util/` | ~20 utility classes (common, data, object, router, space, menu, etc.) |
| `web/` | Browser-only mode support (runs without Electron) |

## Key Singleton Files (lib root)

- `keyboard.ts` - Keyboard shortcut system and input handling
- `storage.ts` - LocalStorage abstraction
- `renderer.ts` - Electron IPC communication
- `sidebar.ts` - Sidebar state management
- `analytics.ts` - Event tracking
- `focus.ts` - Focus/cursor management
- `mark.ts` - Rich text mark handling
- `action.ts` - Common user actions (delete, archive, duplicate, etc.)
- `relation.ts` - Relation formatting and utilities
- `translate.ts` - i18n translation function
- `preview.ts` - Preview tooltip management
