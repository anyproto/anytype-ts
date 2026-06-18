# block/ - Document Block Components

Block-based content system. Every piece of content in Anytype (text, images, databases, etc.) is a block. Contains **62 TSX files**. Most blocks (and their subcomponents) have co-located `.stories.tsx` files for Storybook coverage.

## Architecture

`index.tsx` is the master router that renders the correct block component based on `block.type`. It also handles drag/drop targets, column resizing, toggle collapse, and context menus.

## Block Types

### Text (`text.tsx` — ~1,659 lines)
Paragraphs, headings (H1-H3), bulleted/numbered/checkbox lists, toggle headers, code blocks, quotes, callouts. Supports rich text marks (bold, italic, links, mentions), LaTeX, emoji.

### Media (`media/`)
- `image.tsx` - Image display with resizing
- `video.tsx` - Video playback
- `audio.tsx` - Audio player
- `pdf.tsx` - PDF viewer with page navigation
- `file.tsx` - Generic file download card
- `loader.tsx` - Upload placeholder

Each media type (except loader) has a co-located `.stories.tsx` file.

### Dataview (`dataview/` — main file ~1,909 lines)
Database-like component with multiple views. Supports filtering, sorting, grouping, and record CRUD.

**Top-level files:** `controls.tsx`, `empty.tsx`, `filters.tsx`, `head.tsx`, `selection.tsx`

**Filters (`filters/`):** `advanced.tsx`, `group.tsx`, `item.tsx`, `rule.tsx`

**Views (`view/`):**
- `grid.tsx` — Spreadsheet grid with `grid/head/`, `grid/body/`, `grid/foot/` (each containing `cell.tsx` and `row.tsx`, body also has `add.tsx`)
- `board.tsx` — Kanban with `board/card.tsx`, `board/column.tsx`
- `gallery.tsx` — Gallery with `gallery/card.tsx`
- `calendar.tsx` — Calendar with `calendar/item.tsx`
- `list.tsx` — List with `list/row.tsx`
- `graph.tsx` — Graph view (uses GraphProvider)
- `timeline.tsx` — Timeline view

### Table (`table/` — main file ~1,990 lines)
Spreadsheet-style tables with `cell.tsx` and `row.tsx`.

### Chat (`chat/`)
Messaging interface:
- `form.tsx` - Message input form (authors multiline code blocks via triple-backtick fences)
- `empty.tsx` - Empty state
- `attachment/index.tsx` - File attachments
- `message/index.tsx` - Message display (renders `message.blocks`; code blocks via the shared `util/codeBlock` with syntax highlighting + language label, same as discussions)
- `message/date.tsx` - Date separator
- `message/reaction.tsx` - Message reactions
- `message/reply.tsx` - Reply threading

Top-level `chat.tsx` is the main chat block wrapper.

### Embed (`embed.tsx` — ~1,121 lines)
Rich content embeds: LaTeX, Kroki diagrams, GitHub Gist, Sketchfab, Bilibili, DrawIO, Excalidraw, Mermaid.

### Help (`help/`)
In-editor help blocks:
- `index.tsx` - Help block container
- `icon.tsx` - Help icon
- `link.tsx` - Help link
- `text.tsx` - Help text

### Other Blocks
- `link.tsx` - Internal object references with card styles
- `bookmark.tsx` - Web URL bookmarks with metadata
- `cover.tsx` - Page header cover image with drag positioning
- `featured.tsx` - Featured objects section
- `relation.tsx` - Object relation properties
- `div.tsx` - Visual dividers (line/dot)
- `tableOfContents.tsx` - Auto-generated document outline
- `iconPage.tsx`, `iconUser.tsx` - Icon display blocks

## Common Pattern

```typescript
const BlockType = observer(forwardRef<I.BlockRef, I.BlockComponent>((props, ref) => {
	const { rootId, block, readonly } = props;
	// ... component logic
}));
```

All blocks receive `rootId`, `block`, `readonly`, event handlers, and context flags (`isPopup`, `isInsideTable`).
