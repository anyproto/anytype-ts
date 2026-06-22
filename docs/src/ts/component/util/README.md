# util/ - Reusable Utility Components

~940 files (excluding stories). 33 top-level components plus subdirectories for icons, media, objects, menus, upsell, and share.

## Top-Level Components

### Icons
- `icon.tsx` - Generic icon component (renders from icon registry by `name` prop)
- `iconEmoji.tsx` - Emoji icon renderer
- `iconObject.tsx` - Object icon with type-aware rendering

### Status Indicators
- `dotIndicator.tsx` - Colored dot indicator
- `progressBar.tsx` - Progress bar
- `progressText.tsx` - Text-based progress
- `sync.tsx` - Sync status display with network/status icons
- `chatCounter.tsx` - Unread chat counter badge

### Display
- `tag.tsx` - Colored tag/chip
- `codeBlock.tsx` - Read-only code block with Prism highlighting + language label (shared by chat messages and discussions)
- `label.tsx` - Text label
- `title.tsx` - Section title
- `marker.tsx` - List markers (bullets, numbers, checkboxes)
- `banner.tsx` - Info banners
- `cover.tsx` - Cover image
- `frame.tsx` - Content frame

### State Components
- `emptyState.tsx` - Empty state placeholder
- `emptySearch.tsx` - No search results
- `emptyNodes.tsx` - No nodes state
- `error.tsx` - Error display
- `errorBoundary.tsx` - React error boundary with recovery UI
- `deleted.tsx` - Deleted object placeholder
- `loader.tsx` - Loading spinner
- `mediaState.tsx` - Media placeholder for archived or missing objects

### UI Helpers
- `toast.tsx` - Toast messages
- `updateBanner.tsx` - App update notification
- `dimmer.tsx` - Background dimmer
- `loadMore.tsx` - Load more button
- `pager.tsx` - Pagination controls
- `stickyScrollbar.tsx` - Sticky scrollbar
- `qr.tsx` - QR code generator
- `memberCnt.tsx` - Member count display
- `layoutPlug.tsx` - Layout placeholder

## Subdirectories

### `media/`
- `media/video.tsx` - Video player
- `media/audio.tsx` - Audio player
- `media/pdf.tsx` - PDF viewer
- `media/mermaid.tsx` - Mermaid diagram renderer
- `media/excalidraw.tsx` - Excalidraw whiteboard

### `object/`
- `object/name.tsx` - Object name display
- `object/type.tsx` - Object type badge
- `object/description.tsx` - Object description
- `object/cover.tsx` - Object cover image

### `menu/`
- `menu/calendarSelect.tsx` - Calendar date picker with month/year navigation
- `menu/optionSelect.tsx` - Virtualized option list with drag-and-drop reordering (dnd-kit), search filter, sections, and color tags

### `share/`
- `share/tooltip.tsx` - Share tooltip with icon and label

### `upsell/`
- `upsell/index.tsx` - Upsell container
- `upsell/members.tsx` - Members limit upsell
- `upsell/space.tsx` - Space limit upsell
- `upsell/storage.tsx` - Storage limit upsell

### `icons/` - SVG Icon Components (~900 files)

All icons are React components rendering inline SVGs, organized by category:

| Category | Count | Description |
|----------|-------|-------------|
| `type/` | ~390 | Object type icons (Ionicons-based: book, camera, globe, etc.) |
| `menu/` | ~175 | Menu action, block, embed, mark, help, widget, table, relation icons |
| `common/` | ~37 | Shared icons (back, close, search, sort, checkbox, expand, etc.) |
| `block/` | ~28 | Block-specific icons (embed provider icons, block menu) |
| `settings/` | ~23 | Settings page icons (storage, membership, language, etc.) |
| `chat/` | ~22 | Chat attachment, button, navigation, sync status icons |
| `arrow/` | ~22 | Directional arrows (chevrons, pager, nav, gallery, filter, etc.) |
| `widget/` | ~21 | Widget icons (options, collapse, lock, system, section, etc.) |
| `popup/` | ~21 | Popup header/preview/search icons |
| `control/` | ~19 | Editor, dataview, audio, and cover control icons |
| `comment/` | ~14 | Comment icons (discussion, mention, reaction, send, menu items) |
| `relation/` | ~13 | Relation type icons (date, email, number, select, etc.) |
| `header/` | ~11 | Header icons (graph, search, settings, invite, widget, etc.) |
| `default/` | ~11 | Default object layout icons (page, set, chat, graph, etc.) |
| `plus/` | ~10 | Add/create icons (block, comment, space, template, etc.) |
| `layout/` | ~10 | Layout type icons (page, note, task, bookmark, etc.) |
| `emoji/` | ~10 | Emoji category icons (people, nature, foods, etc.) |
| `import/` | ~7 | Import source icons (notion, markdown, csv, etc.) |
| `dataview/` | ~6 | View type icons (grid, gallery, kanban, list, calendar, graph) |
| `tier/` | ~5 | Membership tier color icons |
| `preview/` | ~5 | Preview content icons (bullet, checkbox, toggle, highlight) |
| Others | ~20 | object, vault, sync, state, table, marker, membership, banner, counter, filterTemplate, notification, publish, migration |
