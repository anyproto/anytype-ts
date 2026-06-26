# Chat message windowing — design spec

**Date:** 2026-06-26
**Status:** Draft for review (revised after 5-agent review)
**Area:** `src/ts/component/block/chat.tsx`, `src/ts/store/chat.ts`; touches `src/ts/lib/api/dispatcher.ts` indirectly via `S.Chat.add`

## Problem

When scrolling a chat up into history, messages disappear: after an older batch loads, messages *newer* than the current scroll position vanish from the view, and the chat appears truncated.

### Root cause (evidence-backed)

The in-memory chat list `S.Chat` is capped at `MAX_MESSAGES = 500` (`store/chat.ts:5`). `prepend` (loading older) does `list.unshift(...add); if (list.length > 500) list.splice(500)` — it keeps the 500 **lowest-orderId** entries and **deletes the highest-orderId (newest) ones** (`store/chat.ts:48-60`).

A forward re-fetch path already exists (`loadMessages(1)` → `ChatGetMessages(chatId, '', after, …)`, `chat.tsx` dir>0 branch), **but it is disabled by a conflated guard**: `if (!clear && (dir > 0) && isLoaded) { setIsBottom(true); return; }` (`chat.tsx:251`). `isLoaded` becomes `true` the first time the user reaches the live bottom and never resets during scroll-up, so after eviction the guard short-circuits and the evicted newest messages are never re-fetched. Only the jump-to-bottom button (re-subscribe) recovers them.

Confirmed from a live gRPC trace: in one scroll session the in-memory list grew 50 → 550 over ten `prepend`s, then `splice(500)` evicted the 50 newest (createdAt 2026-05-02 … 2026-06-24).

**Not the cause:** an earlier hypothesis blamed a `createdAt`/`orderId` ordering mismatch. Direct inspection of the store (via `any-store-cli`) refuted this for the affected chat: **0 `createdAt`/`orderId` inversions**, every calendar day a contiguous block. Across the space (63 chats ≥30 msgs), 45 are fully clean; only 1 has notable date-interleaving. Ordering is a separate, minor concern, out of scope here.

**Aggravating factor:** the affected chat has a 486-message burst within a single minute (a bulk relay) — alone it nearly fills the 500-message window, so scrolling into it evicts almost the entire rest of the chat.

**Rendering constraint:** the chat has **no virtualization** — every loaded message is a DOM node (`chat.tsx` maps `items` directly), and `onScroll` is unthrottled and calls `getBoundingClientRect` per message via `getMessagesInViewport`. So the window size bounds memory, DOM, **and** per-scroll layout cost; it cannot simply be removed or raised without addressing scroll cost.

## Goals

- Scrolling up never silently loses newer messages; scrolling back down transparently restores them.
- The in-memory window and per-scroll cost stay bounded.
- A large single-day burst does not evict the rest of the visible chat.
- New live messages arriving while scrolled up never appear out of order, and are signalled.

## Non-goals

- `orderId`-canonical display ordering (separate, minor; the one interleaved chat has only a visual wrinkle — see §9).
- Full render virtualization — the proper generalization (removes the memory bound, the O(n) scroll cost, and the burst thrash at once), but a large rewrite. Tracked as the explicit follow-up if windowing + scroll-cost hardening prove insufficient (§7).
- Backend `createdAt` semantics (import/relay timestamps are a middleware concern).
- Comment lists (`S.Comment`) are a separate, also-uncapped store; the same class of bug exists there but is out of scope.

## Current state

The working tree already contains the scroll-**up** half of this work (uncommitted): `isLoadingPrev`/`isLoadedPrev` refs, a one-viewport load-older prefetch threshold, in-flight guarding, and a switch from `scrollToMessage(first.id)` to native `overflow-anchor` + a `setDummy` re-render on `prepend`. **None of `atChatEnd`, the guard fix, the `MAX_MESSAGES` bump, the `add`/dispatcher changes, or the scroll-down recovery exist yet** — so the reported bug is still reachable. This spec covers completing the bidirectional half.

## Design

Treat the in-memory `S.Chat` list as a **sliding window** over the full chat. Track which window edges sit at the chat's true boundaries; re-fetch when scrolling toward a non-boundary edge; never misplace or silently drop messages.

### 1. Edge state — single store-owned source of truth

Two flags, **owned by the store, keyed by `subId`, default `true`** (a not-yet-windowed subId — e.g. the vault/space `lastMessage` preview — must behave as "append-allowed"):

- **`atChatStart(subId)`** — the window's first message is the chat's oldest. (Replaces the working-tree `isLoadedPrev` ref; `isLoadedPrev` is removed, not mirrored.)
- **`atChatEnd(subId)`** — the window's last message is the chat's newest.

Strict definition: a flag is `true` **iff the corresponding window edge equals the chat's true boundary** — not "we subscribed" or "we loaded something." The store is the single owner because three parties interact with it: the eviction that flips a flag happens *in the store* (`prepend`/`append`), the dir>0/dir<0 guards that *read* it run *in the component*, and the live-add path that reads it runs in `S.Chat.add` (driven by the dispatcher). Duplicating it in a component ref would drift.

Reads from the component's scroll handlers go through a store getter. (Using the store getter instead of the `isLoaded` React state also **fixes a latent stale-closure bug**: `onScroll`/`loadMessages` are bound once at `rebind` and capture a stale `isLoaded`.)

`isLoaded`/`setLoaded` React state is **kept** — it still drives `isEmpty = isLoaded && !messages.length` and the `<Empty/>` render. Only the dir>0 *guard* switches from `isLoaded` to `atChatEnd`.

### 2. Where the flags are set/reset (exhaustive)

| Event | `atChatStart` | `atChatEnd` |
|---|---|---|
| `subscribeMessages(clear)` returns the last page | `= (page < limit)` | **`= true`** (window anchored at the newest) |
| `loadMessages(1, true)` (jump-to-bottom / reload) | from page len | `= true` |
| `loadMessagesByOrderId(orderId)` (deeplink / unread-divider / reply / pinned) | `= (beforeFetch.length < limit)` | **`= (afterFetch.length < limit)`** — computed from the actual before/after page lengths it already fetches; **not** forced `false` |
| `loadState` (bare, no message load) | unchanged | **unchanged — must NOT set `true`** |
| `prepend` evicts ≥1 (loading older) | — | `= false` |
| `append` evicts ≥1 (loading newer) | `= false` | — |
| dir>0 fetch returns `< limit` (reached newest) | — | `= true` |
| dir<0 fetch returns `< limit` (reached oldest) | `= true` | — |
| dir>0 / dir<0 fetch error | unchanged | **unchanged** (a transient error must not mark an edge reached) |
| `S.Chat.clear` / chat unmount | reset (delete key → default `true`) | reset |

The critical rule (and the bug-reintroducing trap): **`atChatEnd` is set `true` only when the window is genuinely anchored at the chat's newest** — the clear-to-last-page path and the dir>0 short page. `init` routes unread/deeplink opens through `loadMessagesByOrderId`, which lands mid-history; those must derive `atChatEnd` from the after-page length, leaving it `false` so forward re-fetch stays enabled.

### 3. Reversible eviction + scroll-down recovery

Keep the bounded window and eviction directions (`prepend` drops the newest tail; `append` drops the oldest head). `prepend`/`append` **return whether they evicted**; the caller flips the matching flag (§2).

Scroll-down recovery (dir>0), mirroring the existing dir<0 path:
- **Guard fix:** the short-circuit `if (!clear && (dir > 0) && isLoaded)` becomes `… && atChatEnd(subId)` (read from store).
- **In-flight guard:** add `isLoadingNext` (symmetric to `isLoadingPrev`) — set before `ChatGetMessages`, cleared in the callback **and** the error path. dir>0 currently has *no* guard, so without this the bottom-trigger spawns overlapping fetches.
- **Prefetch threshold:** trigger the dir>0 load one viewport before the exact bottom (mirror the existing dir<0 threshold). This is **required**, not optional: it removes the "false-bottom" dead-stop where the user waits a full round-trip at a bottom that isn't the real bottom, and (by firing at `isBottom=false`) avoids the auto-stick interaction in §6.
- **Force re-render on append:** `BlockChat` is not a MobX `observer`; the dir<0 path already calls `setDummy` after `prepend`, but the dir>0 append has none — so the recovered page would be invisible. Add `if ((dir > 0) && grew) setDummy(v => v + 1)`.
- No jump: appending below the viewport doesn't shift content above; the simultaneous head-eviction (above the viewport) is absorbed by `overflow-anchor` (§8).

### 4. Window size and the `add` path

- Raise `MAX_MESSAGES` `500 → 1000` (20 × the 50-message page). 500 cannot hold even the 486-burst plus context. **1000 is a heuristic, not a hard bound:** a single day > 1000 messages still thrashes (re-fetch handles it correctly, just with churn); the real generalization is virtualization (non-goal §). Raising the window is **gated on the scroll-cost hardening in §7** — without it, 1000 doubles per-scroll reflows.
- **Do not add a length cap inside `S.Chat.add`.** `add` has two opposite-end callers — the dispatcher's new-message tail insert (`idx = list.length`, `dispatcher.ts:1141`) and the preview/space head insert (`idx = 0`, `data.ts:425-426`). A single trim rule corrupts one of them. Instead, **route the dispatcher's tail insert through `append()`** (which trims the head and reports eviction); leave the preview head-insert untrimmed (it is one entry per chat, not a window).

### 5. Live messages while scrolled up

The dispatcher (`dispatcher.ts:1133-1142`) calls `S.Chat.add(subId, idx, message)` for **all** subscribed chat subIds, including the open chat and the vault/space `lastMessage` + `chatPreview` subIds. The suppression must be precisely scoped:

- **Suppress** the insert **only when**: the subId is the open chat's message subId **and** `!atChatEnd(subId)` **and** `message.orderId > lastWindowOrderId` (a genuinely-newer message). Keying on `orderId`, **not** `idx == list.length`, avoids dropping a backfilled message whose `orderId` falls *between* in-window messages (which `findIndex` also resolves to `idx = list.length`).
- **Never suppress** for preview/space subIds (default `atChatEnd = true` protects them) or for in-window/edit inserts.
- A suppressed message is loaded later by the scroll-down recovery (§3) or jump-to-bottom (`onScrollToBottomClick` → `loadMessages(1, true)` re-subscribe). Unread/“new messages” state is server-counter-driven (`form.tsx` `messageCounter` from `S.Chat.getState`), so suppression does not break the counter or notifications.

### 6. "New messages" affordance + the `isBottom × atChatEnd` quadrant

The `#navigation-{ChatReadType.Message}` button (`form.tsx`) is toggled active on `!isBottom`. There is a dead zone: `isBottom = true` (user at the *window* bottom) with `atChatEnd = false` (window bottom ≠ chat end) — a suppressed live message shows no indicator. Reachable after a jump/unread-divider open that lands at the window bottom mid-history.

Fix: drive the affordance on **`(!isBottom || !atChatEnd)`**, and ensure a recovery fetch is triggered when a live add is suppressed while `isBottom` (so the window converges to the end rather than stalling).

### 7. Scroll-cost hardening (prerequisite for the window bump)

`onScroll` is unthrottled and `getMessagesInViewport` calls `getBoundingClientRect` + `offsetHeight` per message every tick (~1 forced reflow/message/tick). At 1000 that is ~2× today's per-scroll layout thrash on an un-virtualized list. Before/with the `MAX_MESSAGES` bump:
- Throttle/`requestAnimationFrame`-coalesce `onScroll`.
- Replace the per-message `getBoundingClientRect` viewport scan with cached offsets or an `IntersectionObserver`.

If profiling shows this is still inadequate at 1000, that is the trigger to escalate to virtualization (non-goal) rather than living with jank.

### 8. Scroll anchoring

The prepend path (working tree) and the §3 append head-eviction both rely on native `overflow-anchor`, which is **not set in SCSS** (relies on the Chromium `auto` default). Add an explicit `overflow-anchor: auto` on the scroll container, and **verify on the real Electron build** that (a) insertion-above (prepend) and removal-above (append evict) hold the viewport, and (b) it survives the `focus` handler / `messages.length` `useLayoutEffect` that also write `scrollTop`. If anchoring proves unreliable under fling-scroll, fall back to an explicit measured `scrollTop` adjustment.

### 9. Known limitations (documented, not fixed here)

- **Shared `subId` across popup + main:** `getChatSubId` has no `isPopup` discriminator, so the same chat open in both views shares one `messageMap` **and** one store-level `atChatEnd`. If either view is scrolled up, live-add suppression applies to both (the bottom-pinned twin gets the message on its next scroll/refetch). Pre-existing shared-list behavior; accepted.
- **Detail/reply caches grow on deep scroll:** eviction prunes only `messageMap`; `replyMap` and `S.Detail` attachment entries (via `loadDeps`, which calls `destroyList(clearState=false)`) accumulate during a long session. The dep *subscription* itself is batch-scoped (replaced each `loadDeps`), so no live-subscription leak. Optional follow-up to prune on eviction.
- **Interleaved chat (`createdAt`≠`orderId`):** `getSections` orders sections by `createdAt` while `atChatEnd`/pagination track `orderId`; for the one interleaved chat, the visual bottom may not equal the `orderId`-newest. Visual wrinkle only (no loss), tied to the out-of-scope ordering work.

## Components touched

- **`src/ts/store/chat.ts`** — `MAX_MESSAGES` `500 → 1000`; `prepend`/`append` return an `evicted` boolean; per-`subId` `atChatStart`/`atChatEnd` map (default `true`) with getters/setters; reset in `clear`; the dispatcher's tail insert routed through `append()` with the §5 suppression check (decided in the store, reading the flag map).
- **`src/ts/component/block/chat.tsx`** — set/reset the edge flags per §2 (replacing `isLoadedPrev`); dir>0 guard → `atChatEnd`; `isLoadingNext` + dir>0 prefetch threshold; `setDummy` on dir>0 append; `loadMessagesByOrderId` sets both edges from page lengths; "new messages" affordance on `(!isBottom || !atChatEnd)`; `onScroll` throttling + viewport-scan replacement (§7); preserve `setIsBottom(false)`-before-append ordering (§6).
- **`src/scss/...` chat scroll container** — explicit `overflow-anchor: auto` (§8).
- **`src/ts/lib/api/dispatcher.ts`** — ideally **unchanged** (suppression lives in the store). If the store can't cleanly know the open subId, the minimal seam is here; prefer the store.

## Data flow (scroll-down recovery)

1. Earlier `prepend`s evicted the newest tail → `atChatEnd(subId) = false`.
2. User scrolls down; `onScroll` fires the dir>0 load one viewport before the window bottom; `isLoadingNext` guards re-entry.
3. Guard passes because `!atChatEnd`; `loadMessages(1)` fetches the page after the window's last `orderId`.
4. `append` adds it (dedup by id), trims the oldest head if over `MAX_MESSAGES` (→ `atChatStart = false`); `setDummy` forces the render.
5. If the page is `< limit` (reached the newest), `atChatEnd = true` and re-subscribe to live.

## Edge cases

- **Empty / short chat (≤ window):** clear-subscribe returns `< limit` → both edges `true`; eviction never fires; behavior identical to today.
- **Jump near a boundary:** `loadMessagesByOrderId` sets the edges from the real before/after page lengths (§2), so a jump close to the end correctly yields `atChatEnd = true` and doesn't suppress live messages.
- **Direction-reversal thrash:** bounded by `isLoadingPrev`/`isLoadedNext` (one in-flight per direction) and the 1000-window; the prefetch thresholds fire only when an edge actually nears the viewport.
- **Burst > window:** the window slides through via §3 re-fetch; nothing lost, only not all held at once.
- **Transient fetch error mid-chat:** clears the in-flight guard but leaves edges unchanged (must not mark "reached"), so recovery still works.

## Testing

- **Pure-logic unit tests** (extract helpers so the decision logic isn't trapped in `chat.tsx`): `nextEdgeState(op, evicted, pageLen, limit)` and `shouldRefetchForward(atChatEnd, isBottom)` / `shouldSuppressLiveAdd(subId, atChatEnd, msgOrderId, lastOrderId)`.
- **Store unit tests:** `prepend`/`append` report eviction and flip flags; tail-insert-via-`append` trims the head; `clear` resets flags; preview head-insert is untrimmed and never suppressed.
- **Manual / E2E** (scroll behavior needs real layout): in a >1000-msg chat **and** the 486-burst chat — (1) scroll up past the window → nothing vanishes; (2) scroll back down → window re-populates correctly, no jump, no false-bottom stall; (3) jump-to-bottom → live newest; (4) open via unread badge / `&messageId=` deeplink mid-history → forward scroll re-fetches (regression guard for the `atChatEnd`-on-subscribe trap); (5) live message while scrolled up → not out of order, indicator shows, present after jump-to-bottom.

## References

- gRPC trace: in-memory list 50→550 then `splice(500)` evicting the 50 newest.
- `any-store-cli` inspection of the affected chat: 751 messages, 0 `createdAt`/`orderId` inversions, 54 contiguous day-sections, one 486-message single-minute burst.
- Space-wide scan (63 chats ≥30 msgs): 45 fully clean ordering, 1 with notable interleaving — confirming ordering is not the cause.
- 5-agent review (correctness, edge-cases/races, integration, UX, adversarial), 2026-06-26 — findings folded into §1–§9.
