# popup/ - Modal Dialogs

Modal popup system with **36 TSX files** (plus 10 Storybook story files). Managed by the `PopupStore` in `src/ts/store/popup.ts`.

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
- `search.tsx` - Space & global search with virtualized results (~3000 lines): removable filter tokens inside the input (`tokensRef`, exclusivity groups what/who/relation; Backspace at 0 pops the rightmost, row-added tokens carry Back-restore snapshots), chips as token setters (All/My objects/Messages/Media/People + types in-space; layout buckets + Types cross-space via `isGlobal`), People person-picker chip, `/by` `/type` typed completions, cross-chat message search (`ChatSearch`), per-token create actions, Tab cycles the what group
- `confirm.tsx` - Confirmation dialog with optional checkbox/input
- `preview.tsx` - Image/video gallery with Swiper carousel, zoom, thumbnails
- `export.tsx` - Export options (Markdown, Protobuf, PDF, HTML)
- `help.tsx` - What's New / documentation viewer
- `shortcut.tsx` - Keyboard shortcuts reference
- `upload.tsx` - File upload dialog

### Pages & Objects
- `page.tsx` - Full-page object viewer/editor in modal
- `objectManager.tsx` - Object management interface
- `cleanup.tsx` - Cascade-deletion confirmation: checkbox tree of orphan candidates (objects and files, nested by `createdInContext`) offered for archival. Opened from the `CleanupSuggestion` toast's "Review" action (`I.ToastAction.Cleanup`); confirms with `skipCascade=true`
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
- `invite/manage.tsx` - Manage the space invite: auto-approval, permissions, share-within-space, reset (owner only)
- `invite/add.tsx` - Add members directly by picking people you already share a space with

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
