# util/ - Reusable Utility Components

~48 small, reusable components used throughout the app.

## Categories

### Icons
- `icon.tsx` - Generic icon component
- `iconEmoji.tsx` - Emoji icon renderer
- `iconObject.tsx` - Object icon with type-aware rendering

### Status Indicators
- `dotIndicator.tsx` - Colored dot indicator
- `progressBar.tsx` - Progress bar
- `progressText.tsx` - Text-based progress
- `progress.tsx` - Progress overlay
- `syncStatus.tsx` - Sync status display
- `chatCounter.tsx` - Unread chat counter badge

### Display
- `tag.tsx` - Colored tag/chip
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
- `deleted.tsx` - Deleted object placeholder
- `loader.tsx` - Loading spinner

### Media
- `media/video.tsx` - Video player
- `media/audio.tsx` - Audio player
- `media/pdf.tsx` - PDF viewer
- `media/mermaid.tsx` - Mermaid diagram renderer
- `media/excalidraw.tsx` - Excalidraw whiteboard

### Object Components
- `object/name.tsx` - Object name display
- `object/type.tsx` - Object type badge
- `object/description.tsx` - Object description
- `object/cover.tsx` - Object cover image

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

### Upsell
- `upsell/index.tsx` - Upsell container
- `upsell/members.tsx` - Members limit upsell
- `upsell/space.tsx` - Space limit upsell
- `upsell/storage.tsx` - Storage limit upsell
