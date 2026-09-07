# util/ - Utility Classes

18 utility classes providing helper functions across the app. Accessed via `U.*` import alias.

## Utility Classes

| File | Alias | Purpose |
|------|-------|---------|
| `common.ts` | `U.Common` | Window dimensions, random, plural, date formatting, clipboard, deep copy |
| `data.ts` | `U.Data` | Data loading, auth flow, subscription management, onboarding |
| `object.ts` | `U.Object` | Object CRUD, opening, routing, layout detection, type helpers |
| `router.ts` | `U.Router` | URL navigation, space switching (on the boot paths a "space is not ready" `WorkspaceOpen` falls through to the first ready channel), history management |
| `space.ts` | `U.Space` | Dashboard, space list (`isReady` = the start-up run's per-space state, else the spaceview's local status), participants, sharing, publishing |
| `menu.ts` | `U.Menu` | Menu item builders, vault items, color lists, turnTo options |
| `embed.ts` | `U.Embed` | Embed HTML generators (YouTube, Vimeo, Google Maps, Figma, etc.) |
| `subscription.ts` | `U.Subscription` | Data subscription management for real-time updates; exports pure `applySubscriptionPosition` (record reorder reducer for SubscriptionAdd/Position events, unit-tested in `subscription.test.ts`) |
| `date.ts` | `U.Date` | Date formatting, calendar helpers |
| `string.ts` | `U.String` | String manipulation (camelCase, truncate, URL parsing) |
| `file.ts` | `U.File` | File upload, download, type detection |
| `graph.ts` | `U.Graph` | Graph data preparation and filtering |
| `smile.ts` | `U.Smile` | Emoji utilities and search |
| `dom.ts` | `U.Dom` | DOM helpers: `get()`, `select()`, `selectAll()`, `addClass()`, `removeClass()`, `hasClass()`, `waitForElement()` — replaces raw `document.getElementById` / `querySelector` |
| `prism.ts` | `U.Prism` | PrismJS language map, alias resolution, dependency loading |
| `stickyScrollbar.ts` | `U.StickyScrollbar` | Sticky horizontal scrollbar sync for dataview grid/board views |
| `comment.ts` | `U.Comment` | Comment content part conversion (parts to/from chat message blocks) |
| `chat.ts` | `U.Chat` | Chat message fence parsing: triple-backtick code blocks ↔ `ChatMessageBlock`, open-fence caret detection; `getSearchResultHtml` builds sanitized highlight HTML for `ChatSearch` results |

## Non-exported Utility Files

These files are not in the `index.ts` barrel export but live in the `util/` directory:

| File | Purpose |
|------|---------|
| `sparkOnboardingKeyboard.ts` | Enhanced keyboard event handler with IME composition support |
| `sparkOnboardingWorker.ts` | Worker message type enums for spark onboarding graph visualization |

## Test Files

| File | Tests |
|------|-------|
| `common.test.ts` | Common utility tests |
| `comment.test.ts` | Comment part conversion tests |
| `commentPaste.test.ts` | Comment paste/clipboard handling tests |
| `date.test.ts` | Date formatting tests |
| `embed.test.ts` | Embed HTML generation tests |
| `file.test.ts` | File utility tests |
| `object.test.ts` | Object utility tests |
| `prism.test.ts` | Prism language resolution tests |
| `router.test.ts` | Router navigation tests |
| `string.test.ts` | String manipulation tests |

## Import Pattern

```typescript
import { U } from 'Lib';

U.Common.copyToast('Label', value);
U.Object.openConfig(object);
U.Router.go('/main/graph', {});
U.Dom.select('.myClass', container);
```
