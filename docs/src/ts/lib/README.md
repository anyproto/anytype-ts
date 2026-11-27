# lib/ - Core Libraries

Application infrastructure: API communication, constants, services, utilities, and web mode support.

## Directories

| Directory | Purpose |
|-----------|---------|
| `aiConnect/` | Connect to AI apps, renderer side: `flow.ts` (every IPC and key RPC; the key lives only in its operation), `controller.ts` (the popup's state machine), `catalog.ts`, `gallery.ts`, `steps.ts`, `deeplink.ts` (canonical AI routes in any spelling, shared with main), `link.ts` (an incoming link waits as its catalog id until an app page shows), `entry.ts` (the AI apps page's one-shot target, API Keys backlink), `startup.ts` (self-heal reaction and the discovery nudge, started in `app.tsx`), `events.ts` (AiConnect* analytics), `icons.ts` (the card → bundled mark map, themed via `S.Common.getThemePath()`), `session.ts`; `testHarness.ts` fakes heart and main |
| `api/` | gRPC communication layer (commands, dispatcher, mapper, service client, struct encoding) |
| `constant/` | Application constants (spark onboarding configuration) |
| `service/` | Singleton services (spark onboarding event bus) |
| `util/` | ~17 utility classes (common, data, object, router, space, menu, dom, etc.) |
| `web/` | Browser-only mode support (Electron mock, route sync) |

## Key Singleton Files (lib root)

| File | Export | Purpose |
|------|--------|---------|
| `keyboard.ts` | `keyboard`, `Key` | Keyboard shortcut system and input handling |
| `storage.ts` | `Storage` | LocalStorage abstraction |
| `renderer.ts` | `Renderer` | Electron IPC communication |
| `sidebar.ts` | `sidebar` | Sidebar state management |
| `analytics.ts` | `analytics` | Event tracking; an `AiConnect*` event's payload is exactly its allow-listed fields, each required and from its finite domain (`AI_CONNECT_EVENTS`), else dropped: no space, participant or context data |
| `notificationReply.ts` | `notificationReplyClose` | Replies Close to heart for its notifications (its `isLocal` imports/exports too); only the renderer's AI nudge is skipped |
| `focus.ts` | `focus` | Focus/cursor management |
| `mark.ts` | `Mark` | Rich text mark handling (bold, italic, links, etc.) |
| `action.ts` | `Action` | Common user actions (delete, archive, duplicate, etc.) |
| `download.ts` | `Download` | Client-owned gateway file downloads: the bytes bypass the RPC layer, so no `Event.Process.*` arrives and the renderer owns the progress. One sidebar row per user action, combining its files; each file keeps its own name, bytes and state for the row's hover detail. `open()` is "Open file": `J.Constant.fileExtension.autoOpen` decides what happens, since opening an archive extracts it. A viewable type is fetched as a `temporary` copy — main gives it a folder of its own, the same one every time, so a second open moves no bytes and leaves no duplicate — and handed to the system handler. Anything else goes to the user's download folder and is revealed in the file manager. Before transferring, it fetches each file's `fileVariantChecksums`/`sizeInBytes` (a hidden relation, asked for on demand rather than widening subscriptions) so the main process can recognise a copy already on disk |
| `relation.ts` | `Relation` | Relation formatting and utilities |
| `translate.ts` | `translate` | i18n translation function |
| `preview.ts` | `Preview` | Preview tooltip management |
| `dataview.ts` | `Dataview` | Dataview relation/view helpers |
| `history.ts` | `history` | Navigation history stack (push, back, forward) |
| `highlight.ts` | `Highlight` | UI highlight indicators (help menu, create space) |
| `animation.ts` | `Animation` | Element show/hide animations with scaling and opacity |
| `onboarding.ts` | `Onboarding` | User onboarding flow management |
| `survey.ts` | `Survey` | Survey/feedback triggers (register, object, PMF) |
| `sound.ts` | `Sound`, `SYSTEM_SOUND_ID` | Audio playback (bongo, clave, chimes) |
| `scrollOnMove.ts` | `scrollOnMove` | Auto-scroll when dragging near viewport edges |
| `reactionScheduler.ts` | `scheduleReaction`, `setReactionsPaused` | Pauses MobX observer re-renders in inactive Electron tabs |
| `linkApproval.ts` | `approvalName`, `approvalLabel`, `approvalSpaces` | Caller identity and active user-space catalog for local-link approval; excludes the technical space |
| `linkApprovalGrant.ts` | `linkApprovalGrant`, `isValidLinkGrant` | Explicit space IDs or dynamic all-spaces access, with read/edit permission; shared with Electron main |

## Index Exports

The `index.ts` re-exports everything above plus:
- `I` (interfaces), `C` (commands), `M` (models), `S` (stores), `U` (utilities), `J` (JSON), `H` (hooks)
- `dispatcher`, `Mapper`, `Encode`, `Decode` from `api/`
- `getSparkOnboardingService` from `service/sparkOnboarding`

## Test Files

- `history.test.ts` - History navigation tests
- `mark.test.ts` - Mark parsing/serialization tests
- `reactionScheduler.test.ts` - Reaction scheduler pause/resume tests
- `linkApproval.test.ts` - Local-link caller identity and space-catalog filtering tests
- `api/linkApproval.test.ts` - Approval RPC grant payloads and grant validation
- `analytics.aiConnect.test.ts` - Exact AiConnect* payloads with an active space and context
