# Discussion activity: typing and agent tool calls

Desktop and heart. Extends chat activity (GO-7368,
[chat status spec](2026-09-25-chat-status-spec.md)) to object discussions, on top of
discussion threads (GO-7584, [threads spec](2026-10-12-discussion-threads-spec.md)).

## Problem

A discussion is a chat object (`object.discussionId`), and heart already accepts
`POST /v2/spaces/{space_id}/chats/{discussion_id}/status`, publishing `status/<discussionId>`.
The desktop never subscribes to it, nor to `typing/<discussionId>`, and the comment composer
publishes no typing. An agent answering in a discussion is silent until its comment lands,
and so is a person typing a reply.

Chat activity does not transfer as is:

- Chat anchors an activity group in the gap between two messages of one linear timeline. A
  discussion is posts with flat threads; the last message of the discussion can be in any
  thread, so the gap says nothing about where the work is happening.
- In chat a message from any author seals the open group. In a discussion a person commenting
  elsewhere would cut an agent's run in two.
- Neither the status payload nor the typing payload says which thread it belongs to. The
  status request body is strict (`DisallowUnknownFields`), so a client cannot add one today.

## Decisions (2026-10-12)

- **Thread anchor:** the status payload gains an optional top-level `reply_to`, the id of the
  message being answered. Like `replyToMessageId` it may name any message of a thread; the
  activity is shown in the thread of the top-level post it resolves to. Missing, unknown or not
  yet loaded → the root level of the discussion (above the main composer). Chats ignore it.
- **Typing** gains an optional `replyTo` with the same meaning. The desktop reply form sets the
  thread's post id (it always replies to the post); the main composer leaves it out.
- **Typing reuses the chat typing row** (avatars, "X is typing", dots, `.typingIndicator`
  styles). The compact collapsed tool-call group uses the same row, so no new design values.
- **A finished run stays attached to the comment it produced**, as one collapsed line under
  that comment's head. Expanding it shows the chat's tool-call items unchanged.

## Design

### 1. Wire contract (heart)

`v2model.ChatStatusRequest` gains `ReplyTo string \`json:"reply_to,omitempty"\``, published as
is in the pubsub payload:

```json
{"text":"Reading the timetable","reply_to":"bafy…msg","data":{"tool_call_id":"call_2","tool_name":"read_document","status":"in_progress"}}
```

- A plain string, at most 256 bytes, not looked up: status refreshes every ~2 s and a lookup
  per refresh buys nothing, since receivers fall back to the root level for an unknown id.
- Accepted for chats and discussions alike; chat clients may use it later.
- Counted in the 65,508-byte encoded payload limit like every other field.
- Updated with it: the handler's swag annotation, the `chatStatus` request schema and example
  (`service/schemas.go`), the regenerated `openapi.{json,yaml}`, the API markdown and
  `docs/pubsub/CLIENTS.md`. The Anytype MCP tool `publish-chat-status` is generated from
  OpenAPI and picks it up.

`CLIENTS.md` also documents the typing payload's optional `replyTo` (§3), so mobile clients
can adopt it; a client that ignores it shows the typing at the discussion level.

### 2. Status model (`lib/chatStatus/model.ts`, `session.ts`, `chatStatus.ts`)

- `decodeStatus` reads `reply_to` (non-empty string, else absent) into `StatusPayload.replyTo`.
- A scope gets `mode: 'chat' | 'discussion'`, sent with `attach`
  (`chatStatus.retain(spaceId, chatId, mode)`, default `'chat'`). Chat behaviour is unchanged.
- In discussion mode the journal keeps one open group per publisher instead of one per chat:
  - `ActivityGroup` gains `publisherIdentity` and `replyTo` (taken from the event that opened it).
  - A message from publisher P seals only P's open group, with `after` = that message. Other
    authors' messages do not seal it.
  - A new item from P whose `reply_to` differs from P's open group seals that group without an
    `after` and opens a new one. Text-only status and updates of known calls never seal.
  - Generic-snapshot deduplication intervals are per publisher, following the groups, and the
    fingerprint includes `reply_to`.
  - A known `tool_call_id` still updates its original item wherever it is, as in chat.
- `LiveStatus` gains `replyTo`, so a text-only status lands in its thread too.
- None of this needs the thread resolver: the journal runs in the Electron main process, which
  has no comment store. Resolution to a thread happens in the renderer (section 4).

### 3. Typing (`lib/presence.ts`, `store/presence.ts`)

- `TypingPayload` gains optional `replyTo` (additive; `blockId` keeps its editor meaning).
- `presence.typing(objectId, blockId, replyTo?)` publishes immediately when `replyTo` changes,
  as it already does for a `blockId` change.
- `PresenceTyping` gains `replyTo`; the receiver keeps it as received.
- Settings → Personal → Messaging gains "Show others when I'm typing" (on by default,
  `S.Common.sendTyping`). Off, `presence.typing` publishes nothing, so chats and comments stay
  silent; a stop already owed still goes out. The switch is broadcast to all tabs, since each
  publishes its own typing. Receiving others' typing and editor carets are unaffected.

### 4. Placement (renderer)

`S.Comment` exposes `getThreadRoot(subId, id)` (from its thread index) and an observable
per-discussion revision bumped on `load`, `insert` and `remove`, so a placement that depends on
a late message re-resolves when the message arrives.

A pure helper in `lib/chatStatus/timeline.ts`,
`discussionActivity(groups, live, typers, lookup)` → `{ attached, threads, root }`:

1. A sealed group whose `after` comment is placed → `attached[after.id]`.
2. Any other group (open, sealed without `after`, `after` not loaded), live status and typing
   entry → `threads[rootId]` when `lookup.threadOf(replyTo)` finds a thread, else `root`.

A group attached to a deleted comment (tombstone) is not rendered.

### 5. Components

- **Shared typing row** (`block/chat/status.tsx`): the typing indicator moves out of
  `chat.tsx` into a component taking typers and live statuses, including the rule that a
  publisher with fresh rich activity gets no plain typing row and the 1 / 2 / many labels.
  Chat renders it with no visual change.
- **`StatusGroup` `isCompact` prop**: collapsed, it renders in the typing row — avatars,
  "Agent · 3 tool calls · 1 running", dots while running, ✓ / ! once finished. No bubble, no
  avatar lane. Expanded, the existing `StatusItem` list. Storybook stories for running and
  finished compact groups.
- **`comment/activity.tsx`** (observer): renders one placement bucket — typing row, live
  status text and compact open groups — for a thread or the root level.
- **`section.tsx`**: while the section is open and `discussionId` is set,
  `presence.subscribe(space, discussionId)` and `chatStatus.retain(space, discussionId,
  'discussion')`, released on close and unmount. Renders the root-level `CommentActivity`
  above `commentFormWrap`. Activity height changes run the section's scroll-to-bottom check.
- **`post.tsx`**: the thread's `CommentActivity` after the reply list, before the reply form or
  input; the compact group of `attached[id]` under the head.
- **`reply.tsx`**: the compact group of `attached[id]` under the head.
- **`comment/form.tsx`**: props `discussionId` and `replyTo`. Change → `presence.typing`;
  blur, submit and unmount → `presence.stop`. No typing in edit mode, when read-only, or before
  the discussion exists (the first comment creates it).

Subscription cost: an open page with its discussion uses three pubsub patterns
(`typing/<page>`, `typing/<discussion>`, `status/<discussion>`) of the 100 per space.

## Out of scope

- `reply_to` in space chats.
- Activity in the collapsed discussion counter (a typing dot on "N comments").
- Publishing typing before the discussion object exists.
- Persisting activity: it stays in application memory, as in chat.

## Testing

Heart (go test): `reply_to` is published as given and omitted when empty; it counts toward
the payload limit; over-long `reply_to` is refused; the HTTP body accepts it; OpenAPI examples
validate against the schema.

Desktop unit (vitest):

- discussion mode: per-publisher open groups; another author's message does not seal; the
  publisher's own message seals with `after`; a `reply_to` change seals and reopens; chat mode
  unchanged (existing tests);
- `decodeStatus` with and without `reply_to`, and non-string values;
- `discussionActivity`: attached, thread, root fallback, late resolution, tombstone;
- typing `replyTo` round trip and immediate publish on change.

Manual, against a heart with the `reply_to` change:

- `publish-chat-status` on a discussion without `reply_to`: running row at the root level,
  then the agent's comment with the collapsed group under its head;
- the same with `reply_to` naming a reply deep in a thread: row at that thread's end;
- `reply_to` naming a message the desktop has not loaded: root level, moving into the thread
  when the message arrives;
- a person typing a reply on a second device: typing row at that thread's end; in the main
  composer: at the root level;
- a person commenting while the agent runs does not split the agent's group;
- chat behaviour unchanged.
