# scss/ - Stylesheets

SCSS stylesheets organized to mirror the component structure. Uses native CSS nesting.

## Structure

| Directory/File | Purpose |
|----------------|---------|
| `_mixins.scss` | Shared SCSS mixins |
| `_vars.scss` | CSS custom properties and theme variables |
| `common/` | Global styles (typography, layout, animations) |
| `block/` | Styles per block type (text, media, dataview, table, chat, embed) |
| `page/` | Page-level styles (auth.scss, main.scss, settings.scss) |
| `menu/` | Menu component styles |
| `popup/` | Popup component styles |
| `component/` | Misc component styles (sidebar, preview, editor, media) |
| `widget/` | Widget styles |
| `form/` | Form control styles |
| `header/` | Header styles |
| `footer/` | Footer styles |
| `notification/` | Notification styles |
| `list/` | List styles |
| `theme/` | Theme-specific overrides (dark mode) |

## Conventions

- CSS supports native nesting (no need for SCSS `&` in most cases)
- Do NOT use `cursor: pointer` - the app does not use custom cursors
- Theme colors via CSS custom properties (`var(--color-bg-primary)`, etc.)
