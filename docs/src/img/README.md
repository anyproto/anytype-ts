# img/ - Images and Icons

All static image assets used in the app. Icons are SVG files.

## Structure

| Directory | Purpose |
|-----------|---------|
| `icon/` | SVG icons organized by feature (~98 subdirectories): sidebar, settings, popup, widget, chat, notification, block, menu, etc. |
| `arrow/` | Arrow icons for navigation, paging, galleries |
| `theme/` | Theme-specific icon variants (e.g., `theme/dark/icon/` for dark mode overrides) |
| `auth/` | Authentication flow images |
| `cover/` | Cover image assets |

## Icon Naming Convention

Icons typically have two variants:
- `name0.svg` - Default state (usually `#B6B6B6`)
- `name1.svg` - Hover/active state (usually `#252525`)

## Important

- All icons must be stored locally - never use remote URLs
- When implementing Figma designs, recreate icons as SVGs in the appropriate subdirectory
- Follow the `name0.svg`/`name1.svg` pattern for interactive icons
