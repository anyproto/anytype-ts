# sidebar/ - Left and Right Sidebars

Collapsible sidebars for navigation, object properties, and type configuration. **19 files**.

## Left Sidebar (`left.tsx`)

Main navigation sidebar with sub-pages:
- `page/widget.tsx` - Widget dashboard (default view)
- `page/vault.tsx` - Space/vault browser
- `page/type.tsx` - Type management
- `page/settings/` - Settings panels (index, library)
- `page/object/` - Object-specific panels (relation, tableOfContents)

## Right Sidebar (`right.tsx`)

Context-sensitive detail panel:
- `section/object/relation.tsx` - Object relation editing
- `section/object/tableOfContents.tsx` - Document TOC
- `section/type/` - Type configuration:
  - `relation.tsx` - Type relations management
  - `layout.tsx` - Type layout settings
  - `template.tsx` - Type templates
  - `title.tsx` - Type title config
  - `format/` - Format-specific pages (page.tsx, list.tsx)
- `preview.tsx` - Preview panel

## Patterns

- Resize handle with drag state tracking
- Component ID → camelCase mapping for dynamic rendering
- State persistence via `Storage`
- `sidebar` utility object for programmatic open/close
