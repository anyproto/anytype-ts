# popup/ - Modal Dialogs

Modal popup system with **~27 popup types**. Managed by the `PopupStore` in `src/ts/store/popup.ts`.

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
- `search` - Object search with virtualized results, filters, import (most complex, 902 lines)
- `confirm` - Confirmation dialog with optional checkbox/input
- `preview` - Image/video gallery with Swiper carousel, zoom, thumbnails
- `export` - Export options (Markdown, Protobuf, PDF, HTML)
- `help` - What's New / documentation viewer
- `shortcut` - Keyboard shortcuts reference

### Pages & Objects
- `page` - Full-page object viewer/editor in modal
- `objectManager` - Object management interface
- `relation` - Batch relation editor for multiple objects

### Auth & Security
- `pin` - PIN entry verification
- `phrase` - Recovery phrase information
- `logout` - Logout confirmation

### Spaces & Collaboration
- `spaceCreate` - Space creation with icon selection
- `spaceJoinByLink` - Join space via link
- `inviteRequest` - Space join request display
- `inviteConfirm` - Invitation confirmation
- `inviteQr` - QR code invitation

### Membership
- `membershipActivation` - Activation flow
- `membershipFinalization` - Finalization flow

### Onboarding
- `onboarding` - Tutorial with Swiper carousel
- `settingsOnboarding` - Settings onboarding
- `usecase` - Use case selection
- `aiOnboarding` - AI features introduction
- `introduceChats` - Chat features intro

### Other
- `about` - About/info popup
- `share` - App sharing link
- `apiCreate` - API token management
