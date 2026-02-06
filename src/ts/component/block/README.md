# block/ - Document Block Components

Block-based content system. Every piece of content in Anytype (text, images, databases, etc.) is a block. Contains **62 TSX files**.

## Architecture

`index.tsx` is the master router that renders the correct block component based on `block.type`. It also handles drag/drop targets, column resizing, toggle collapse, and context menus.

## Block Types

### Text (`text.tsx` - 33KB)
Paragraphs, headings (H1-H3), bulleted/numbered/checkbox lists, toggle headers, code blocks, quotes, callouts. Supports rich text marks (bold, italic, links, mentions), LaTeX, emoji.

### Media (`media/`)
- `image.tsx` - Image display with resizing
- `video.tsx` - Video playback
- `audio.tsx` - Audio player
- `pdf.tsx` - PDF viewer with page navigation
- `file.tsx` - Generic file download card
- `loader.tsx` - Upload placeholder

### Dataview (`dataview/` - 40KB main file)
Database-like component with multiple views: Grid, Board (kanban), Gallery, Calendar, List, Graph, Timeline. Supports filtering, sorting, grouping, and record CRUD.

### Table (`table/` - 38KB)
Spreadsheet-style tables with rows, columns, cells, resizing, and context menus.

### Chat (`chat/`)
Messaging interface with threaded messages, attachments, reactions, replies, and forms.

### Embed (`embed.tsx` - 22KB)
Rich content embeds: LaTeX, Kroki diagrams, GitHub Gist, Sketchfab, Bilibili, DrawIO, Excalidraw, Mermaid.

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
