# img/ - Images and Icons

All static image assets used in the app.

## Structure

| Path | Purpose |
|------|---------|
| `space.svg` | Space icon |
| `logo/` | App logo variants (`black.svg`, `white.svg`, `header.svg`, `preview.svg`, `progress.svg`, `symbol.png`) |
| `icon/` | SVG/PNG icons organized by feature (10 subdirectories) |
| `theme/` | Theme-specific asset overrides (`dark/icon/`, `dark/logo/`) |

## icon/ Subdirectories

| Directory | Contents |
|-----------|----------|
| `arrow/` | Gallery/pager swiper arrows (`swiper.svg`, `swiper-hover.svg`) |
| `migration/` | Migration flow illustrations (`init.svg`, `process.svg`, `data.svg`, `error.svg`) |
| `onboarding/` | Onboarding images: `chats/` (feed, header, intro, oneToOne, sidebar PNGs), `options/` (use-case PNGs: artist, developer, writer, etc.), `primitives/` (arrow, close SVGs), plus standalone assets (`copy.svg`, `tick.svg`, `productHunt.png`) |
| `popup/` | Popup illustrations: `phrase/` (gameDie, safetyBox, scan PNGs), `share/` (header SVG) |
| `settings/` | Settings icons: `theme/` (dark, light, system PNGs), standalone SVGs (`chat.svg`, `collection.svg`, `empty.svg`, `page.svg`) |
| `table/` | Table handles: `handle/` (`cell.svg`, `common.svg`) |
| `window/` | Window control icons (`arrow.svg`, `close.svg`, `max.svg`, `min.svg`, `menu.svg`) |
| (root) | `camera.svg`, `loader.svg`, `tex.svg` |

## theme/dark/ Overrides

Dark mode asset variants, mirroring the light icon structure:

| Directory | Contents |
|-----------|----------|
| `icon/arrow/` | `swiper.svg` |
| `icon/menu/` | Various menu icons (`checkbox0/1.svg`, `chk.svg`, `sortArrow.svg`, plus subdirs: `dataview/`, `inviteLink/`, `onboarding/`, `spaceCreate/`, `syncStatus/`) |
| `icon/onboarding/` | `chats/`, `primitives/` |
| `icon/payment/` | Payment slide illustrations |
| `icon/popup/` | `share/` |
| `icon/store/` | Store icons (`check0/1.svg`, `lock.svg`) |
| `icon/window/` | Window control icons (same set as light) |
| `logo/` | `header.svg` |

## Inline SVG Icon System

Icons are migrated from CSS `background-image` SVG files to inline React SVG components registered in a central registry. This allows icons to be colorized via CSS `color` property using `currentColor`.

### Registry Location

- **Registry**: `src/ts/component/util/icons/registry.ts`
- **Icon components**: `src/ts/component/util/icons/<folder>/`
- **Barrel imports**: `src/ts/component/util/icons/index.ts`
- **Storybook gallery**: `src/ts/component/util/icons/gallery.stories.tsx`

### Icon Folders (31 categories)

`arrow`, `banner`, `block`, `chat`, `comment`, `common`, `counter`, `default`, `emoji`, `filterTemplate`, `header`, `import`, `layout`, `marker`, `membership`, `migration`, `notification`, `object`, `plus`, `preview`, `publish`, `relation`, `settings`, `state`, `sync`, `table`, `tier`, `type`, `vault`, `widget`

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

- **Size**: All icons must be exactly **20x20px** (`width="20" height="20" viewBox="0 0 20 20"`).
- **Color**: Icons with the common icon color `#9B9B9B` (light mode) should use `currentColor` for fill/stroke -- this enables CSS-driven colorization via `color` property and `var(--color-icon)` / `var(--color-icon-hover)`.
- **Non-standard colors**: Icons with different hardcoded colors should keep their original color values -- do NOT convert to `currentColor`.
- **Dark mode**: Icons using `currentColor` automatically support dark mode through CSS variables. No separate dark theme SVG files are needed.

### Naming Convention

Registry names use the folder path: `<folder>/<iconName>` (e.g., `header/graph`, `header/settings`).

### CSS

The `.icon.hasSvg` class is automatically added when `name` is set. It provides:
- `color: var(--color-icon)` -- default icon color
- `:hover, .hover` -- switches to `var(--color-icon-hover)`
- Flexbox centering for the inline SVG
