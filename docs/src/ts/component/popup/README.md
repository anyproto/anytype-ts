# popup/ - Modal Dialogs

Modal popup system with **33 TSX files** (plus 10 Storybook story files). Managed by the `PopupStore` in `src/ts/store/popup.ts`.

## Architecture

`index.tsx` is the popup container that:
- Maps popup IDs to React components via a registry
- Handles positioning (centered with sidebar awareness)
- Manages dimmer overlay (configurable per popup)
- Provides lifecycle: `close()`, `position()`, `storageGet/Set()`, `getId()`
- Supports animation with configurable timeouts

Open a popup: `S.Popup.open('confirm', { data: { ... } })`

## Popup Types

### Core
- `search.tsx` - Object search with virtualized results, filters, import (~967 lines)
- `confirm.tsx` - Confirmation dialog with optional checkbox/input
- `preview.tsx` - Image/video gallery with Swiper carousel, zoom, thumbnails
- `export.tsx` - Export options (Markdown, Protobuf, PDF, HTML)
- `help.tsx` - What's New / documentation viewer
- `shortcut.tsx` - Keyboard shortcuts reference
- `upload.tsx` - File upload dialog

### Pages & Objects
- `page.tsx` - Full-page object viewer/editor in modal
- `objectManager.tsx` - Object management interface
- `relation.tsx` - Batch relation editor for multiple objects

### Auth & Security
- `pin.tsx` - PIN entry verification
- `phrase.tsx` - Recovery phrase information
- `logout.tsx` - Logout confirmation

### Spaces & Collaboration
- `space/create.tsx` - Space creation with icon selection
- `invite/request.tsx` - Space join request display
- `invite/confirm.tsx` - Invitation confirmation
- `invite/qr.tsx` - QR code invitation

### Membership
- `membership/activation.tsx` - Activation flow
- `membership/finalization.tsx` - Finalization flow

### Onboarding
- `onboarding.tsx` - Tutorial with Swiper carousel
- `settings/onboarding.tsx` - Settings onboarding
- `usecase.tsx` - Use case selection (with `page/usecase/list.tsx`, `page/usecase/item.tsx`)
- `aiOnboarding.tsx` - AI features introduction (with `page/aiOnboarding/statusMessage.tsx`)
- `introduceChats.tsx` - Chat features intro

### Graph
- `graph/OnboardingGraphWorker.tsx` - Graph onboarding worker
- `dimmerWithGraph.tsx` - Dimmer overlay with graph visualization

### Other
- `about.tsx` - About/info popup
- `share.tsx` - App sharing link
- `api/create.tsx` - API token management
