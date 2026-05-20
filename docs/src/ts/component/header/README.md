# header/ - Page Header Components

Dynamic header content based on current page context. **12 files** (excluding stories).

## Files

- `index.tsx` - Header dispatcher (selects component by page type via `Components` map). Provides shared helpers: `renderLeftIcons()`, `renderTabs()`, `menuOpen()`, tooltip handlers, and resize observer
- `banner.tsx` - Info/warning banners

### Auth Headers (`auth/`)
- `auth/index.tsx` - Auth page header
- `auth/logout.tsx` - Logout header with logo and logout button

### Main Headers (`main/`)
- `main/object.tsx` - Object page header with title and actions
- `main/empty.tsx` - Empty/minimal header
- `main/graph.tsx` - Graph page header
- `main/history.tsx` - Version history header
- `main/settings.tsx` - Settings page header
- `main/navigation.tsx` - Navigation page header
- `main/chat.tsx` - Chat page header
- `main/archive.tsx` - Archive/bin header with "Empty Bin" action

## Component Registry

The dispatcher maps component keys to implementations:
```
authIndex, authLogout, mainObject, mainChat, mainHistory,
mainGraph, mainNavigation, mainEmpty, mainArchive, mainSettings
```

## Key Patterns

- All headers receive shared props: `renderLeftIcons`, `renderTabs`, `onSearch`, `onTooltipShow`, `onTooltipHide`, `menuOpen`
- `renderLeftIcons(withNavigation?, withGraph?, onOpen?)` renders vault toggle, widget button, expand icon, and optional back/forward navigation and graph button
- Header auto-detects small width via `ResizeObserver` and adds `isSmall` class
- Imperative handle exposes `setVersion()` and `forceUpdate()` to parent
