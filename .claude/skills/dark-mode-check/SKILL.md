---
name: dark-mode-check
description: Audit SCSS and TSX files for dark mode issues — missing variable usage, hardcoded colors, icon gaps, selector misuse, and inline dark overrides outside the theme folder
---

# Dark Mode Check Skill

Audit styles and components for dark mode correctness in the Anytype-TS codebase. Catches hardcoded colors, missing icon variants, inline dark overrides, and CSS variable gaps.

## When to Use

Activate this skill when the user:
- Asks to check dark mode styles for a component or file
- Wants to verify a new component works correctly in dark mode
- Asks to audit dark mode across the codebase or a folder
- Adds new styles and wants to ensure they follow theming patterns
- Reports a visual bug that only appears in dark mode

## Architecture Reference

### Theme Selector

Dark mode is activated by the class `themeDark` on the `<html>` element:

```scss
html.themeDark { ... }
```

- Set via `S.Common.setThemeClass()` in `src/ts/store/common.ts`
- Applied by `U.Common.addBodyClass('theme', 'dark')` in `src/ts/lib/util/common.ts`
- Values: `'dark'`, `'light'`, `'system'` (system defers to `nativeThemeIsDark`)

### CSS Variable System

**Light mode defaults:** `src/scss/_vars.scss`
**Dark mode overrides:** `src/scss/theme/dark/common.scss` (lines 5-82)

Core variable families:

| Family | Examples | Purpose |
|--------|----------|---------|
| `--color-text-*` | `primary`, `secondary`, `tertiary`, `inversion` | Text colors |
| `--color-shape-*` | `primary`, `secondary`, `tertiary`, `highlight-dark/medium/light` | Borders, dividers |
| `--color-bg-*` | `primary`, `secondary`, `loader`, `grey` | Backgrounds |
| `--color-control-*` | `accent`, `active`, `inactive`, `bg` | Interactive elements |
| `--color-system-*` | `accent-125`, `accent-50`, `accent-25`, `selection` | System accents |
| `--color-light-*` | `grey`, `yellow`, `orange`, `red`, `pink`, `purple`, `blue`, `ice`, `teal`, `lime` | Tag/highlight colors (light variants) |
| `--color-very-light-*` | Same set as above | Even lighter tag/highlight variants |
| `--color-dark-*` | Same set as above | Dark tag/highlight variants |

### Dark Mode File Organization

```
src/scss/theme/dark/
├── common.scss    (~485 lines) - CSS variables + shared overrides + icon paths
├── page.scss      (~236 lines) - Page-specific dark styles
├── block.scss     (~250 lines) - Block component dark styles
├── menu.scss      (~315 lines) - Menu dark styles
├── popup.scss     (~116 lines) - Popup/modal dark styles
└── widget.scss    (~87 lines)  - Widget dark styles
```

All are imported via `src/scss/common.scss`.

### Icon Theming

Dark mode icons live in `src/img/theme/dark/` mirroring `src/img/icon/`:

```scss
$themePath: '~img/theme/dark';

html.themeDark {
    .icon.buttonAdd { background-image: url('#{$themePath}/icon/block/add0.svg'); }
    .icon.buttonAdd:hover { background-image: url('#{$themePath}/icon/block/add1.svg'); }
}
```

Convention: `name0.svg` = default, `name1.svg` = hover/active.

In TypeScript, dynamic icon paths use `S.Common.getThemePath()`:
```typescript
// Returns 'theme/dark/' or ''
const path = `./img/${S.Common.getThemePath()}icon/file/${type}.svg`;
```

### Dark Shadow Mixin

```scss
// In dark/common.scss
@mixin shadow {
    box-shadow: 0px 4px 16px rgb(0 0 0 / 20%), 0px 0px 0px 1px #393933 inset;
}
```

## Review Checklist

When auditing a file or component for dark mode correctness, check every item below.

### 1. Hardcoded Colors

**Rule:** No raw hex (`#xxx`), `rgb()`, or `rgba()` values should appear in dark mode blocks unless they are truly one-off (e.g., a specific gradient stop with no variable equivalent).

**Search pattern:**
```
grep -E '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(' src/scss/theme/dark/*.scss
```

**Known violations (for reference):**
- `src/scss/theme/dark/block.scss` — `.label { color: #464646; }`, bgColor-* classes with hardcoded hex
- `src/scss/theme/dark/common.scss` — shadow mixin `#393933`, vault `#393939`, iconWrap `#4f4f4f`/`#000000`, markup highlight `#044062`
- `src/scss/theme/dark/menu.scss` — bgColor-* palette, `.connected::before #294b0e`, `.error::before #581f0c`
- `src/scss/theme/dark/page.scss` — `.btn.light .bg { background-color: #fff; }`

**Action:** Flag each hardcoded color. Suggest the closest CSS variable or recommend creating a new one.

### 2. Inline Dark Overrides Outside Theme Folder

**Rule:** Dark mode style overrides belong in `src/scss/theme/dark/`. They should NOT be placed inline in component SCSS files using `html.themeDark &` or `html.themeDark .component`.

**Search pattern:**
```
grep -rn 'html\.themeDark\|\.themeDark' src/scss/ --include='*.scss' | grep -v 'src/scss/theme/dark/'
```

**Known violations:**
- `src/scss/popup/aiOnboarding.scss` — Lines 69-91, inline `html.themeDark &` block with hardcoded `rgba()` colors
- `src/scss/form/button.scss` — Dark mode button overrides
- `src/scss/page/main/settings.scss` — Dark mode settings overrides

**Action:** Flag inline dark overrides. Recommend moving them to the appropriate file in `src/scss/theme/dark/`.

### 3. Missing Icon Dark Variants

**Rule:** Every icon that appears in the UI must have a dark variant in `src/img/theme/dark/` if its default color doesn't work on dark backgrounds.

**Check process:**
1. Find all `.icon.*` classes that set `background-image` in light mode SCSS
2. Verify each has a corresponding entry in `src/scss/theme/dark/common.scss` or other dark theme files
3. Verify the SVG file exists in `src/img/theme/dark/icon/`

**Search patterns:**
```
# Find icon background-image declarations in light mode
grep -rn 'background-image.*icon/' src/scss/ --include='*.scss' | grep -v 'theme/dark'

# Find dark mode icon overrides
grep -rn 'background-image.*themePath' src/scss/theme/dark/
```

**Action:** For each icon missing a dark variant, flag it and check whether the default icon color (typically #B6B6B6 or #252525) needs adjustment for dark backgrounds.

### 4. Dynamic Icon Paths in TypeScript

**Rule:** Any TypeScript code building icon paths must use `S.Common.getThemePath()` for theme awareness.

**Search pattern:**
```
grep -rn "img/icon/" src/ts/ --include='*.tsx' --include='*.ts' | grep -v 'getThemePath'
```

**Action:** Flag any hardcoded icon paths that bypass theme detection.

### 5. New CSS Properties Without Variable Usage

**Rule:** When adding new color/background/border properties, always use CSS variables from `_vars.scss` (which get overridden in dark mode). Never introduce raw color values.

**Colors that MUST use variables:**
- `color` -> use `--color-text-*`
- `background` / `background-color` -> use `--color-bg-*` or `--color-shape-*`
- `border-color` -> use `--color-shape-*`
- `box-shadow` -> use variables or the `@include shadow` mixin in dark mode

### 6. `!important` Overuse

**Rule:** Avoid `!important` in dark mode overrides. If needed, it usually signals a specificity problem that should be fixed by adjusting selectors.

**Search pattern:**
```
grep -cn '!important' src/scss/theme/dark/*.scss
```

**Action:** Flag excessive `!important` usage. Suggest selector specificity fixes.

### 7. Missing Dark Mode Handling for New Components

When reviewing a new component, verify:
1. All color properties use CSS variables (auto-handled by dark mode)
2. Any custom colors have corresponding overrides in `src/scss/theme/dark/`
3. Icons have dark variants if needed
4. Shadows use the dark mode mixin or variables
5. No `opacity` hacks that look wrong on dark backgrounds
6. Borders use `--color-shape-*` variables
7. Hover/active states work visually on dark backgrounds

## Output Format

Structure findings as:

```markdown
## Dark Mode Audit: [file/component name]

### Critical Issues
[Issues that cause visible problems in dark mode]

### Hardcoded Colors
| File:Line | Value | Suggested Variable |
|-----------|-------|--------------------|
| ... | ... | ... |

### Missing Icon Variants
| Icon Class | Light Path | Dark Path (missing) |
|------------|------------|---------------------|
| ... | ... | ... |

### Inline Dark Overrides (should be in theme/dark/)
| File:Line | Selector |
|-----------|----------|
| ... | ... |

### Variable Usage Gaps
[Properties that should use CSS variables but don't]

### Recommendations
[Specific actions to fix each issue]
```

## Quick Reference: Available Dark Mode Variables

### Text
`--color-text-primary` `--color-text-secondary` `--color-text-tertiary` `--color-text-inversion`

### Backgrounds
`--color-bg-primary` `--color-bg-primary-90` `--color-bg-secondary` `--color-bg-loader` `--color-bg-grey`

### Shapes / Borders
`--color-shape-primary` `--color-shape-secondary` `--color-shape-tertiary`
`--color-shape-highlight-dark` `--color-shape-highlight-medium` `--color-shape-highlight-light` `--color-shape-highlight-light-solid`

### Controls
`--color-control-accent` `--color-control-active` `--color-control-inactive` `--color-control-bg`

### System
`--color-system-accent-125` `--color-system-accent-50` `--color-system-accent-25` `--color-system-selection`

### Color Palette (tags/highlights)
Each available in `--color-light-*`, `--color-very-light-*`, and `--color-dark-*` variants:
`grey` `yellow` `orange` `red` `pink` `purple` `blue` `ice` `teal` `lime`
