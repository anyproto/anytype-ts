# sidebar/ - Left and Right Sidebars

Collapsible sidebars for navigation, object properties, and type configuration. **21 files**.

## Left Sidebar (`left.tsx`)

Main navigation sidebar with sub-pages:
- `page/widget.tsx` - Widget dashboard (default view)
- `page/vault.tsx` - Space/vault browser
- `page/settings/index.tsx` - Settings panel
- `page/settings/library.tsx` - Library panel (types, relations)
- `page/type.tsx` - Type management page (used in right sidebar routing)
- `page/object/relation.tsx` - Object relation panel
- `page/object/tableOfContents.tsx` - Document TOC panel

Registered components: `widget`, `vault`, `settings`, `settingsSpace`, `settingsTypes`, `settingsRelations`.

## Right Sidebar (`right.tsx`)

Context-sensitive detail panel with animation (motion/react):
- `page/type.tsx` - Type configuration
- `page/object/relation.tsx` - Object relation editing
- `page/object/tableOfContents.tsx` - Document TOC
- `page/widget.tsx` - Widget preview

Registered components: `type`, `objectRelation`, `objectTableOfContents`, `widget`.

## Sections (`section/`)

`section/index.tsx` - Generic section dispatcher. Maps component strings to section implementations:

- `section/type/title.tsx` - Type title config
- `section/type/layout.tsx` - Type layout settings
- `section/type/relation.tsx` - Type relations management
- `section/type/template.tsx` - Type templates
- `section/type/format/page.tsx` - Page format settings
- `section/type/format/list.tsx` - List format settings
- `section/object/relation.tsx` - Object relation editing
- `section/object/tableOfContents.tsx` - Object TOC

## Preview (`preview.tsx`)

Layout preview panel for type configuration. Shows a live preview of type layout settings (alignment, width, featured relations, format). Used when right sidebar has `withPreview` enabled for the `type` page.

## Progress (`progress.tsx`, `progress.stories.tsx`)

Progress indicator for long-running operations (import, export, update, etc.). Displays in the left sidebar footer. Auto-expands when new processes appear, collapsible via header click. Exports `ProgressItem` component for individual progress entries and `SidebarProgress` as the container. Has Storybook stories.

## Patterns

- Resize handle with drag state tracking via refs and `raf`
- Component ID to camelCase mapping for dynamic rendering
- State persistence via `Storage`
- `sidebar` utility object for programmatic open/close
- Uses `motion/react` for page transition animations (right sidebar)
- `forwardRef` + `useImperativeHandle` throughout for parent access
