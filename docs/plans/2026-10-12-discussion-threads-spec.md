# Discussion threads: reply chains and deleted comments

GO-7584. Desktop side of GO-7167 (heart soft delete, merged to heart develop on 2026-10-12,
PR #3324), plus the reply-chain bug that hides replies to replies.

## Problem

1. **Replies to replies are invisible.** A discussion renders one level: a top-level post
   and the replies whose `replyToMessageId` is that post (`section.tsx` `buildTree`,
   `dispatcher.ts` `ChatAdd`). A message whose `replyToMessageId` names another reply is
   filed under that reply's id in `replyMap`, which nothing renders. Android's composer
   replies to the tapped message, and API agents reply to the message they answer, so
   these exist in real discussions. They also count as unread and, when they answer the
   reader's own comment, as unread mentions — badges nobody can clear from the desktop.
2. **Deleted comments are now tombstones.** With GO-7167 heart keeps a deleted discussion
   comment in place: `model.ChatMessage.deleted = true`, empty content, attachments,
   blocks and reactions, `modifiedAt = 0`, `read`/`mentionRead` true; `id`, `orderId`,
   `creator`, `createdAt` and `replyToMessageId` are kept. It arrives as
   `Event.Chat.Update` (or as `Event.Chat.Add` when the add and delete were coalesced).
   Heart refuses edit, reaction, pin and reply-to on a tombstone. The desktop today:
   - renders a tombstone as a comment with author, date and no body, and still offers
     react, reply and edit on it;
   - routes `ChatUpdate` by `replyToMessageId` and copies only content, attachments and
     reactions, so it never learns `deleted` (and never learns `modifiedAt` from another
     device either);
   - removes the deleter's own comment from the store right after `ChatDeleteMessage`
     (`post.tsx` `onDelete` → `deletePost`, `reply.tsx` `onDelete` → `deleteReply`), so the
     deleter sees the post and its whole thread vanish until a reload while everyone else
     sees the tombstone.

The spec for discussions (GO-6807) displays one level of nesting. That is a display rule:
`replyToMessageId` may name any message in the thread, and the reply is shown in its
thread's top-level post.

## Decisions (2026-10-12)

- **Thread placement:** a reply belongs to the thread of the top-level post reached by
  following `replyToMessageId`. Replies in a thread stay flat, ordered by `orderId`.
- **The desktop composer keeps replying to the top-level post.** Replying to a specific
  reply would hide the reply on desktops without this change.
- **A deleted top-level post closes its thread.** Heart refuses a reply to a tombstone and
  the desktop only replies to the top-level post, so the thread shows no reply input and
  no reply action.
- **Every tombstone shows a placeholder**, post or reply: the same head (avatar, author,
  date) and the body "Comment deleted", with no actions, reactions or attachments.
- **Comments hard-deleted before GO-7167 stay hidden**, with any replies under them
  (their thread is unreachable). Their unread counts are not fixed here.
- **The desktop loads the whole discussion on open**, as it does today
  (`fetchAllMessages`). Everything in this spec relies on that; paging inside a
  discussion is out of scope.

## Design

### 1. Data

`I.CommentMessage` and `M.CommentMessage` gain `isDeleted: boolean` (observable).
`Mapper.From.ChatMessage` maps `isDeleted: Boolean(obj.deleted)`; `I.ChatMessage` gains
the same optional field (space chats never set it). `replyCount` is removed from the
interface, the model and every writer: the count is the length of the thread's reply list.

The generated bindings come from the heart protos (`bun run generate:protos`). The mapper
reads `obj.deleted` from the decoded object, so the code builds and runs against an older
middleware (the field is absent and reads as false). A middleware bump that includes
GO-7167 is needed before release, not before merge.

### 2. Thread resolver (pure)

A new module `src/ts/lib/util/commentThread.ts` holds the threading rules with no MobX and
no store access, so it is unit-testable:

- `rootOf(message, roots: Map<id, rootId>)`: `''` replyTo → the message's own id; else
  `roots.get(replyToMessageId)` or `undefined` when the parent is unknown.
- `buildThreads(messages)` → `{ posts, replies: Map<rootId, msg[]>, roots: Map<id, rootId>,
  pending: Map<parentId, msg[]> }`. One pass in `orderId` order: a reply is always created
  after its target, so its parent is already resolved; a message whose parent has not been
  seen waits in `pending` under that parent's id and is resolved, with everything waiting
  on it, when the parent arrives. After the pass, whatever is still in `pending` has no
  reachable parent (a pre-GO-7167 hard delete) and stays hidden. A visited set stops a
  malformed `replyToMessageId` cycle.
- `insertByOrder(list, item)`: inserts a live message at its position, appending when its
  `orderId` is the largest (the usual case) or empty (an own message before its `ChatAdd`
  event) and binary-searching otherwise (a late message from a peer that was offline). It
  reuses `liveAddIndex` from the chat window helpers.

### 3. Store (`store/comment.ts`)

The store keeps its shape — `postMap: subId → posts`, `replyMap: rootId → replies` — so
`list.tsx`, `post.tsx` and `reply.tsx` keep reading it the same way. New non-observable
indices, per discussion subscription:

- `byId: Map<id, M.CommentMessage>` for every stored message;
- `roots: Map<id, rootId>`;
- `pending: Map<parentId, msg[]>`.

Methods:

- `startLoad(subId)` opens the discussion when the section subscribes, before the pages are
  fetched, and returns a load token. Until `clear` (on unsubscribe) the store keeps the
  discussion's live events; events for a discussion that is not open are dropped.
- `load(subId, messages, token)` replaces `setPosts` + `setReplies` + `buildTree`: runs
  `buildThreads`, then sets the posts array once and each thread's reply array once.
  - A load whose token is not the discussion's current one (closed, or opened again, since
    its `startLoad`) is dropped, so a slow load never resurrects a closed discussion.
  - A message inserted live while the pages were being fetched, and missing from them, is
    kept; one instance per id is stored, the loaded copy first.
  - Updates and removals made while loading are journaled and replayed over the loaded
    copies, so a comment deleted or edited while the discussion opens is not shown in its
    older page state.
- `insert(subId, message)` replaces `addPost` / `addReply` for every live path (dispatcher
  `ChatAdd`, own post, own reply). It resolves the root, splices into the existing
  observable array at `insertIndex` (never replaces the array, so one new comment
  re-renders one list, not the whole discussion), indexes the message and releases any
  messages pending on it. For a message already in `byId` only a missing `orderId` is taken
  and the message moved to its place: the `ChatAddMessage` response carries no `orderId`, so
  an own message is inserted without one (last in its list) and gets it from its `ChatAdd`
  event, which can arrive before or after the response.
- `update(subId, param)` looks the message up in `byId` and `set`s it. Used by `ChatUpdate`,
  own edits, reactions, read / mention / sync status.
- `remove(subId, id)` for `ChatDelete` (a hard delete still arrives from space chats and
  from an older heart): drops the message from its list and the indices. The replies of a
  removed post stay indexed but are not rendered, as today.
- `getById(subId, id)` replaces the post-then-every-reply-list scans in `section.tsx`
  `findMessage`, `updateInPostOrReply` and the dispatcher's reaction and delete handlers.
- `clear(subId)` also drops the subscription's indices.
- `getHasMorePosts`, `getHasMoreReplies`, `getHasOlderReplies` and their maps are removed
  (section 5).

### 4. Events (`dispatcher.ts`)

- `ChatAdd` (comment subscriptions): `S.Comment.insert(subId, commentMsg)`. No desktop
  notification for a message that arrives already deleted.
- `ChatUpdate`: `S.Comment.update(subId, { id, content, attachments, reactions,
  modifiedAt, isDeleted })` — no routing by `replyToMessageId`. A tombstone also sets
  `isReadMessage` / `isReadMention` (heart marks it read without a read-status event).
- `ChatDelete`, `ChatUpdateReactions`, read / mention / sync status: through `getById` /
  `update` / `remove`.

### 5. Components

- `section.tsx`
  - `fetchAllMessages` appends pages into one array (`push`, not a copy per page), then
    `loadDeps` and `S.Comment.load`.
  - `buildTree`, `onLoadMore`, `loadPostsAroundMessage` and `loadRepliesAroundMessage`
    are removed: everything is loaded before `handleMessageId` runs, so a deep link is a
    `getById` and a scroll (nothing to do if the message is not there).
  - `findMessage` becomes `S.Comment.getById`.
  - Scroll-stop no longer sends an `orderId` range read: every visible message is already
    read by itself, and threads are laid out by post, so a range between seen messages
    also covers unseen replies of other threads (and an own message without an `orderId`
    made the range start at the beginning of the discussion).
  - `onSubmitPost` inserts the optimistic post with `S.Comment.insert`.
  - The counter label counts live (not deleted) top-level posts.
- `list.tsx`: the "Load more comments" control goes away, with its text keys and styles.
- `post.tsx`
  - `loadReplies`, `loadOlderReplies`, the `replyCount` effect and the load-more /
    load-previous controls are removed; replies are `S.Comment.getReplies(id)`.
  - `onSubmitReply` inserts with `S.Comment.insert`.
  - `onDelete` no longer removes the post; it marks it deleted in place
    (`S.Comment.update` with the tombstone fields) and the `ChatUpdate` that follows
    confirms it.
  - A deleted post renders the placeholder (section 6), hides its hover actions and
    context menu, and closes its thread: no reply input, no reply form, and the
    `onReply` passed to its replies is `undefined`.
- `reply.tsx`
  - `onDelete` marks the reply deleted in place instead of removing it.
  - A deleted reply renders the placeholder with no actions or context menu.
  - The context menu's Reply item is offered only when `onReply` is set (the hover icon
    already checks it).

### 6. Placeholder

Head as today (avatar, author, date; the date has no "(edited)", since `modifiedAt` is 0).
Body: the text "Comment deleted" (new key `commentDeleted`), muted. No attachments,
reactions, hover actions or context menu. It keeps `data-message-id`, so scroll-to-message
and read marking work unchanged (heart already marks a tombstone read).

## Out of scope

- Showing which reply a reply answers ("replying to X").
- Replying to a specific reply from the desktop composer.
- Paging inside a discussion; heart storing a derived thread root id.
- Pre-GO-7167 orphans and their unread counts.
- Quotes of a comment that is later deleted: a quote carries its own copy of the text
  (`messageQuote.content`) and keeps showing it, as in chats.

## Testing

Unit (vitest, `src/ts/lib/util/commentThread.test.ts`):

- posts and direct replies in order;
- a reply to a reply, and a chain three levels deep, all land in the top-level post's
  thread, in `orderId` order;
- a child arriving before its parent (out of `orderId` order) resolves when the parent
  arrives, together with its own waiting children;
- a reply whose parent never arrives stays pending and is not placed;
- a `replyToMessageId` cycle terminates and places nothing;
- `insertIndex`: append fast path, insertion in the middle, empty list, equal `orderId`.

Store (vitest; if the store module does not load under the vitest setup, these move to manual checks and the store stays a thin wrapper over the tested resolver): `load` then `insert` of a
reply-to-reply; `update` with tombstone fields on a post and on a reply; `remove`; `clear`
drops the indices.

Manual, against a heart built from develop (with GO-7167):

- the discussion that showed the bug: the three agent replies appear in the
  "Fill the properties" thread and the unread and mention badges clear once they scroll
  into view;
- delete own post with replies: placeholder in place, replies stay, thread closed, on
  this device and on a second one;
- delete own reply: placeholder in its place;
- delete through API v2 (`delete_chat_message`): the same placeholder appears live;
- reply to a reply through API v2 or Android: appears at the end of the thread live;
- deep link to a reply-to-reply (`messageId=`) scrolls and highlights it.
