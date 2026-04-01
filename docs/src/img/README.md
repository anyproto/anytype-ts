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

## Inline SVG Icon System

Icons are being migrated from CSS `background-image` SVG files to inline React SVG components registered in a central registry. This allows icons to be colorized via CSS `color` property using `currentColor`.

### Registry Location

- **Registry**: `src/ts/component/util/icons/registry.ts`
- **Icon components**: `src/ts/component/util/icons/<folder>/` (e.g., `header/`)
- **Barrel imports**: `src/ts/component/util/icons/index.ts`
- **Storybook gallery**: `src/ts/component/util/icons/gallery.stories.tsx`

### How to Use

Use the `name` prop on the `Icon` component instead of `className`:

```tsx
// Before (CSS background-image)
<Icon className="more" withBackground={true} />

// After (inline SVG from registry)
<Icon name="header/more" withBackground={true} />
```

When structural CSS is still needed (e.g., `display: none` toggling), keep `className` alongside `name`:

```tsx
<Icon name="header/expand" className="expand" withBackground={true} />
```

### How to Add a New Icon

1. **Create the component** in the appropriate folder (e.g., `src/ts/component/util/icons/header/myIcon.tsx`):

```tsx
import React from 'react';

const MyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="..." fill="currentColor" />
    </svg>
);

export default MyIcon;
```

2. **Register it** in the folder's `index.ts`:

```tsx
import { registerIcon } from '../registry';
import MyIcon from './myIcon';
registerIcon('header/myIcon', MyIcon);
```

3. **Remove** the old CSS `background-image` rule and the SVG file (if no other CSS references remain).

4. **Update usage** to use `name="header/myIcon"` instead of `className="myIcon"`.

### Icon Requirements

- **Size**: All icons must be exactly **20x20px** (`width="20" height="20" viewBox="0 0 20 20"`). Icons with non-standard sizes (e.g., 20x21) must have their viewBox normalized to 20x20.
- **Color**: Icons with the common icon color `#9B9B9B` (light mode) should use `currentColor` for fill/stroke — this enables CSS-driven colorization via `color` property and `var(--color-icon)` / `var(--color-icon-hover)`.
- **Non-standard colors**: Icons with different hardcoded colors (e.g., `#252525` for `anyName`) should be added to the registry but keep their original color values — do NOT convert to `currentColor`.
- **Dark mode**: Icons using `currentColor` automatically support dark mode through CSS variables. No separate dark theme SVG files are needed.

### Naming Convention

Registry names use the folder path: `<folder>/<iconName>` (e.g., `header/graph`, `header/settings`).

### CSS

The `.icon.hasSvg` class is automatically added when `name` is set. It provides:
- `color: var(--color-icon)` — default icon color
- `:hover, .hover` — switches to `var(--color-icon-hover)`
- Flexbox centering for the inline SVG

### Migrated Icons (Header)

| Registry Name | Original File | Color | Notes |
|--------------|---------------|-------|-------|
| `header/expand` | expand.svg | currentColor | viewBox normalized from 20x21 to 20x20 |
| `header/graph` | graph.svg | currentColor | |
| `header/invite` | invite.svg | currentColor | |
| `header/logout` | logout.svg | currentColor | |
| `header/more` | more.svg | currentColor | |
| `header/oneToOne` | oneToOne.svg | currentColor | |
| `header/pin` | pin.svg | currentColor | Uses stroke + fill |
| `header/relation` | relation.svg | currentColor | SVG file kept for menu CSS usage |
| `header/search` | search.svg | currentColor | |
| `header/settings` | settings.svg | currentColor | |
| `header/unpin` | unpin.svg | currentColor | |
| `header/widget` | widget.svg | currentColor | SVG file kept for popup CSS usage |
| `header/anyName` | anyName.svg | #252525 (hardcoded) | SVG file kept for menu CSS usage |

### Not Migrated (Non-standard size)

| File | Size | Reason |
|------|------|--------|
| info.svg | 16x16 | Not 20x20 |
| language.svg | 18x18 | Not 20x20 |
| logo.svg | 70x18 | Not 20x20 |
