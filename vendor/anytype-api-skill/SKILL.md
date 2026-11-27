---
name: anytype-api
description: Call Anytype's local HTTP API v2 directly — search, read, create and edit objects, queries, collections and chats over REST. Use when writing scripts, SDK code or curl against the API. For interactive note/task work prefer the `anytype` CLI and its skill (cmd/anytype/SKILL.md); this guide is the raw-HTTP layer beneath it.
---

# Anytype API v2 — HTTP guide for agents

Anytype Desktop serves the local REST API at `http://127.0.0.1:31009` by
default. In **Settings → Local API**, you can enable the API and check its port.
Bodies are compact JSON, and every name this API owns is `snake_case` — params,
fields and op names alike. (Inside an object's `blocks` and `properties`
you are reading the AnyBlock format's content; property and type keys
there are served as slugs by default, as display names under
`?keys=name` — see the properties bullet below.) Every list takes
`?offset=&limit=` (default 25, max 1000) and returns
`{data, total, offset, limit, has_more}`.

## Pair and make a first read

If the user has already configured an API key, use it. Otherwise, with the
user signed in to Anytype Desktop, make the two pairing requests without a
bearer token. Send `Content-Type: application/json` on both.

1. `POST /v2/auth/challenges` with `{"app_name":"<your integration name>"}`.
   Replace the placeholder with a distinct name for your integration and reuse
   the exact name when pairing again. Anytype uses it to identify the integration
   that created an object. Keep the returned `challenge_id` for this pairing.
2. Ask the user to review the app, choose spaces and permissions in Desktop,
   and approve. Have the user enter the displayed four-digit code in the
   integration's local setup prompt and keep the code and key out of chat and logs.
3. `POST /v2/auth/api_keys` with `{"challenge_id":"<id>","code":"<four digits>"}`.
   Keep the code as a string to preserve leading zeros. The response contains
   `api_key` and the approved `grant`.

Use `Authorization: Bearer <key>` on `GET /v2/auth/whoami` to check the key.
A scoped key reports its permission and whether it covers all spaces. For
selected spaces, `grant.spaces` lists them. A legacy key with `grant.scoped:
false` gives account-wide access. Confirm the integration works by calling
`GET /v2/spaces` through the intended client with that same key.

Pairing errors include a `code` and recovery `message`. For
`challenge_not_approved`, wait for the user and keep the same challenge ID.
For `incorrect_answer`, ask the user to check the displayed code. For
`invalid_challenge_id`, start a fresh challenge only if the user still wants
to pair. Stop automatic retries on `pairing_rate_limited`. For
`account_not_running`, ask the user to open Desktop and sign in. Older
versions may return a generic 500 for these conditions. Check Desktop for the
prompt with the user, or use a key the user created in **Settings → Local API**.

## The data model in six ideas

- **Spaces** contain everything; nearly every route is
  `/v2/spaces/{space_id}/…`. `GET /v2/spaces` lists them.
- An **object** = `properties` (typed key-values) + `blocks` (document
  content). `type` is served as a type **key** (`page`, `task`) — never an
  id; on input a type NAME (`"Meeting note"`) resolves too.
- **Properties** are addressed by key — a snake_case slug minted once at
  creation and frozen, so it survives renames (`due_date`, `icon_emoji`,
  `manual_property`). `GET …/properties` spells them that way, and served
  documents spell them that way **by default**; `?keys=name` on a read
  serves the display-name vocabulary instead (`"Due date"`) — pick slugs
  for anything long-lived, names for showing a user their own words.
  Input is forgiving everywhere and accepts BOTH: `dueDate`, `DueDate`,
  `due-date`, the display name `Due date` and even `Дата выполнения` all
  resolve to the one property they name; an input matching two properties
  is a 400 listing both, and an unknown one never silently creates
  anything. (One exception: the compact `filter` STRING validates before
  folding — spell a multi-word name with underscores there, `Due_date`.)
  Select/multi_select values are option **names** (`"In progress"`,
  case-sensitive) — never option ids. A name the property does not already
  hold is **refused** — check it against `GET …/properties/{key}/options`,
  or resend with **`?create_missing_options=true`** to create it (a PATCH caps that
  at 64). Unknown property keys are rejected with a did-you-mean.
- **Blocks** are a FLAT array in pre-order with an integer `indent`
  (absent = 0) — no `children` key. Inline formatting is markdown inside
  `text`. Use block ids exactly as a read served them.
- Title and description are **not blocks** — they live in `properties`
  (`name`, `description`). A fresh object has zero blocks.
- A **query** is a live query over a type (its type key is still `set`, the
  name it carries internally); a **collection** is a hand-curated
  list (edited via `add_items`/`remove_items`). **Chats** store messages
  outside blocks, paged by order-id cursors.

## Which operation

| Intent | Call |
|---|---|
| find objects | `POST …/{space_id}/search` (or `POST /v2/search` across spaces — rows then carry `space_id`). Search with filters; don't enumerate `GET …/objects` |
| watch a search live (new objects, unread mentions) | `POST …/{space_id}/search/stream` — SSE, same body without `query`; see Query |
| notice a new, renamed or removed space without polling | `GET /v2/spaces/stream` — SSE, the spaces list held open; see Spaces stream |
| read one object | `GET …/objects/{id}` — start with `?outline=true` |
| change property values | PATCH op `set_properties` — `add`/`remove` for list values, `set` for scalars |
| complete a task object | `set_properties` (`"set":{"done":true}` or the status option) — a property, not a block edit |
| change a word/phrase | op `replace_text` `{find, replace}` — `id` optional; never retype the block |
| toggle a checkbox block | op `update_block` `{"match":"Draft timeline","set":{"checked":true}}` — merge; text untouched. `match` or `id`, never both |
| add content | op `insert_blocks` with a `markdown` payload — write markdown, the server parses it |
| restructure | ops `move_block` / `replace_subtree` / `delete_block` (`delete_block` takes `match` too) |
| one table cell | op `set_cell` — never rewrite the table |
| show/hide a view column, edit a view | op `update_view` — works on queries, collections and a type's default view (PATCH the type OBJECT id from `GET …/types/{key}`) |
| add / reorder / remove a view | ops `insert_view` (`copy_from` duplicates one) · `move_view` (`position:"first"` = default tab) · `delete_view` |
| create an object | `POST …/objects` — shortcut `{type, name, properties, markdown}` covers most cases |
| archive / restore an object | `DELETE …/objects/{id}` moves it to the Bin — any user content you can write; system objects 403. `POST …/objects/{id}/restore` brings it back (an object in the Bin refuses edits with 409 `object_archived` until then). The receipt's warning says whether THIS key may also delete it for good |
| delete an object for good | `DELETE …/objects/{id}?permanent=true` — archived first or not, only objects THIS key created (app name matched EXACTLY, byte-for-byte), with no other member's changes and no discussion, and for a file, that no other object uses (409 `file_in_use` names them; chat attachments are not checked). Afterwards every route on it answers 410 `object_deleted` — drop the id; searching can only find a different object. Anything else → 403, permanently — archive instead. Probe with `?dry_run=true`; there is no `skip_bin` |
| curate a collection | PATCH ops `add_items` / `remove_items` on the collection object |
| read a query / collection | `GET …/queries/{id}/objects` · `…/collections/{id}/objects` (`?view=`, `?fields=`) |
| new type / property | `POST …/types` · `POST …/properties`; select options ride the property, or `?create_missing_options=true` mints them from values |
| upload a file | `POST …/files` (multipart or `{"url":…}`) → the id file blocks and chat attachments need |
| download a file or icon | `GET …/files/{file_id}/content`; use a file id or a space/member's `icon_image`. Optional `?width=` selects an image size. Supports ranges, conditional reads, and `HEAD`. |
| chat | `GET/POST …/chats/{id}/messages`, `POST …/read` — see Chats |
| put an object in the sidebar | `POST …/widgets` `{target, scope}` — `scope:"personal"` is this account's own sidebar (any writer); `scope:"space"` is the shared one (owner/admin; not offered in one-to-one spaces). `GET …/widgets` lists both; `PATCH`/`DELETE …/widgets/{id-or-target}` change or remove one. Not `is_favorite` |
| comment on an object | `POST …/objects/{id}/discussion` → `{id}`, then the chat routes with that id — see Chats |

## Read cheaply

- `GET …/objects/{id}?outline=true` → every block's `{indent, id, type}`
  plus its text truncated to 80 runes — structure + addressable ids at a
  fraction of the tokens. Follow up with `?block={id}` for one subtree, or
  PATCH directly: **editing needs no prior full read once you know the
  ids** (but copy exact text from a full read — outline text may be cut).
- When the request already quotes the text to change, skip the read
  entirely: `replace_text {find, replace}` locates the block itself, and
  `update_block`/`delete_block` take `match` for the same job (one match, or
  a refusal listing the candidates).
- `?include=properties` or `?include=blocks` reads half the object.
  `?format=md` is a read-only markdown rendering.
- Echo block ids back exactly as a read served them; if one is rejected as
  unknown, re-read and use the fresh ids. `?ids=full` is the backup/export
  shape — the read to archive or clone from, not needed for editing.
- List/search rows are minimal `{id, name, type}`; add columns with
  `fields=` (property keys) instead of GETting each object. Search rows also
  carry `discussion` (the object's comment-thread chat id) when it has one.
- Every object read returns an `etag` (envelope + `ETag` header).

## Edit: PATCH ops

`PATCH …/objects/{id}` body `{"ops":[…]}` — one atomic batch (≤512 ops,
≤256 blocks per op): any invalid op rejects the whole PATCH with
`ops[i]`-addressed issues. Fourteen ops:

```json
{ "ops": [
  { "op": "set_properties", "set": {"status": ["Done"]}, "unset": ["oldKey"],
    "add": {"tags": ["urgent"]}, "remove": {"assignee": ["bafy…"]} },
  { "op": "update_block",  "match": "Draft timeline", "set": {"checked": true} },
  { "op": "replace_text",  "find": "Q3 report", "replace": "Q4 report" },
  { "op": "insert_blocks", "after": "b3", "markdown": "## Notes\n- first\n- second" },
  { "op": "move_block",    "id": "b9", "inside": "b2", "position": "last" },
  { "op": "delete_block",  "id": "b4", "recursive": true },
  { "op": "set_cell",      "table_id": "t1", "row": "r2", "col": "c1", "value": "done" },
  { "op": "update_view",   "columns": {"status": {"hidden": false}} },
  { "op": "insert_view",   "name": "Board", "copy_from": "viewAll1",
    "set": {"type": "kanban", "groupBy": "status"} }
] }
```

- **`set_properties`**: a key appears in at most one of
  `set`/`unset`/`add`/`remove`. `add`/`remove` are per-entry list edits
  (select/multiSelect/objects/files) — appending one tag never rewrites
  the array. `remove` never creates the option it names. `set: {"k": []}`
  = present-but-empty; `unset` removes presence.
- **`update_block`** is THE block-field op (merge; explicit `null` clears a
  field) — checkbox, color, language, retype, or full text rewrite.
- **`match` addresses the block by its TEXT** on `update_block` and
  `delete_block` — the `id` alternative: give one or the other, **never
  both** (and never neither). The text must appear in exactly ONE block or
  the op refuses: zero → read the outline, several → the error lists
  candidate ids to retry with. Repeats inside the one matched block are
  fine — `match` names a block, not an occurrence. It reads the document as
  the ops before it in the batch left it.
- **`replace_text`**: `id` is optional — omitted, `find` locates the block
  and must appear in exactly ONE block (zero or several matching blocks
  refuse; the ambiguity error lists candidate ids to retry with). Within
  the matched block `find` must match exactly once ("found 2 matches —
  provide more context"); `replace_all: true` is the escape, within that
  one block only. Preferred over `update_block` for word-level edits.
  `replace_subtree {id, blocks}` swaps a block plus descendants.
- **`insert_blocks`**: `blocks` (flat array) or `markdown` — mutually
  exclusive, same targeting. Target with one of `after`/`before`/`inside`
  (+`position: first|last` inside that container); omit all three and
  `position` picks an end of the DOCUMENT — `last` (or absent) appends,
  `first` inserts at the start, both on an empty object too. Payload
  `indent: 0` = the anchor's level (`after`/`before`) or the container's
  child level (`inside`). `move_block` targets the same way, so
  `{"op":"move_block","id":"b9","position":"first"}` moves a block to the top
  of the document.
- **Author new content without ids** — an `id` names an EXISTING block, so
  `insert_blocks` takes none anywhere in its payload (rows and columns
  included); the server mints them and returns them in `created_blocks`,
  keyed by the payload path that produced each — `ops[0].blocks[0]`,
  `ops[0].blocks[0].rows[1]`, `ops[0].blocks[0].columns[0]`. The same holds
  wherever you leave an id out of an existing-content payload (a new row in
  `update_block set.rows`, a block inside a `set_cell` array), so you never
  have to re-read to learn an id you just created.
- **`update_view`** edits ONE dataview view — never resend the views array.
  `block`/`view` are optional when the object has one dataview and it one
  view (types, queries, collections usually do). `set` merges view fields
  (`name`, `type`, `groupBy`, `sorts`, `filters` — arrays replace whole;
  `filter` takes the compact string; null clears a field); `columns` merges
  per property key: `{"hidden": false}` shows a column, `null` removes it,
  a new key appends one. Works on Blocks-restricted objects — view config
  is not a block edit.
- **`insert_view`/`move_view`/`delete_view`** complete the family (same
  addressing, same channels; insert_view's name is its own required field —
  not in `set`). insert_view needs only `name` — bare default: every listed
  property visible, newest first; `copy_from` duplicates a view (then
  `set`/`columns` override); the minted id returns in `created_views`,
  keyed `ops[i]`. move_view REQUIRES one of `after`/`before`/`position`
  (`"first"` = default tab). delete_view refuses the last view — insert the
  replacement first (one atomic batch swaps a bad default view).
- Response: new `etag`, `created_blocks` (payload position → real id;
  nested row/column/cell slots included), `created_views` (same, for minted
  view ids), `created` (options minted under `?create_missing_options=true`),
  `diff_stats {blocks_added, blocks_removed, blocks_changed, blocks_moved,
  properties_changed}`, `warnings` (advisory, e.g. an unguarded date filter).
- **There is no whole-document replace** — never read a document,
  regenerate it and write it back. Replace a section with
  `replace_subtree`; start over by batching `delete_block`s with the new
  `insert_blocks`.

## Query

`POST …/search` body: `{query?, type?, filter?|filters?, sorts?, fields?}`.
Pagination is the query params — a body `limit` is rejected. Search is a
read: no `Idempotency-Key`, `dry_run` ignored.

```json
{ "query": "report", "type": "task",
  "filter": "done = false AND (due_date < currentWeek() OR due_date IS EMPTY)",
  "sorts": [ { "property": "due_date", "direction": "asc" } ],
  "fields": ["name", "due_date", "status"] }
```

- **Prefer the compact `filter` string** (≤4096 chars):
  `status IN ("In progress", "Blocked")` · `name CONTAINS "report"` ·
  `last_modified_date > daysAgo(7)` · `tags HAS ALL ("urgent", "q3") AND
  assignee IS NOT EMPTY`. Dates are RFC 3339 or preset functions
  (`today()`, `currentWeek()`, `daysAgo(n)`). Parse errors are
  offset-addressed with did-you-mean.
- The structured `filters` array: leaf =
  `{"property","condition","value"}`, group =
  `{"operator":"and|or","filters":[…]}` (non-empty). Date values there are
  **unix seconds**, not RFC 3339 (the string form converts for you).
  `filter` and `filters` together → 400 `ambiguous_input`.
- `type` is also a filter pseudo-key for multi-type: `type IN ("task",
  "bug")`. **File rows appear only when a file type is named** in the type
  channel (`type = "image"`, `type IN (… "file")`) — `size > 5` alone
  matches nothing; compose `type = "image" AND size > 5`. `mimeType` and
  `size` work in fields/filters/sorts.
- An unguarded `due_date < …` also matches objects with **no** date — the
  response warns; add `AND due_date IS NOT EMPTY` unless intended.
- Full-text `total` is a lower bound while `has_more` is true — walk
  pages, don't plan on the number.
- Sorts: any property key, `{"property", "direction": "asc|desc"}`;
  default is `last_modified_date desc`.
- `unread_mention_count` / `unread_message_count` are unread counters for
  this account only: a chat (the space chat and every other chat) keeps its
  own, and an object's discussion keeps its counters on the object. Filter,
  sort or list them in `fields` (numbers); `GET …/properties` does not show
  them. So `unread_mention_count > 0` in a search or the search stream finds
  space chats and other chats as well as objects whose discussion mentions
  you. An object that is neither a chat nor has a discussion has neither
  counter, so it never matches `> 0`.
- **Watch a search live**: `POST …/search/stream` (SSE), body = the search
  body without `query` (refused: full text is not followed live), no paging.
  Read `object_added` until `snapshot_complete`: that is the whole matching
  set (`snapshot_complete.warnings` = the search's warnings). Then
  `object_added` (entered the set), `object_updated` (a requested field, the
  name, the type or `discussion` changed; carries the whole row) and
  `object_removed` (`object_id` left the set; it may still exist). Rows are
  search rows, `fields` applied. One stream per space.
  - Mentions inbox: `{"filter":"unread_mention_count > 0","fields":["name","discussion"]}`.
    A hit with `discussion` is an object: read it through
    `GET …/chats/{discussion}/messages`. A hit without one is a chat: its row
    `id` is the chat id. Marking it with `POST …/chats/{id}/read`
    `scope:"mentions"` emits `object_removed`. A new mention elsewhere arrives
    as `object_added`, once sync has loaded that chat or discussion (no
    promised latency).
  - Objects you created and their discussions: take your member `id` from
    `GET …/members/me`, then `{"filter":"creator = \"<member id>\"","fields":["discussion"]}`.
    An object gaining its first discussion arrives as `object_updated` with
    `discussion` set; follow that chat with the chat stream. Comments are chat
    events, not search events.
  - No event ids, `Last-Event-ID` ignored. After any reconnect you get a fresh
    snapshot: diff it against what you hold, and anything absent left the set.
  - At most 16 search streams per process (429 `too_many_streams`, close
    one), separate from the chat stream caps. The stream never disconnects
    you on its own.

## Chats

- `POST …/chats/{id}/status` publishes ephemeral activity. An empty body or
  `{}` signals typing; the server omits empty `text` so clients can localize
  the label. Agents can send `{"text":"Searching documentation","data":{"tool_call":"web_search"}}`.
  `data` accepts any JSON value. The encoded payload is limited to 65,508 bytes.
  The pubsub topic is `status/<chat_id>`; `Event.Pubsub.Message` carries the
  verified sender identity. These updates are not stored messages or SSE
  message events. Refresh while active (two seconds recommended), stop when
  finished, and let receivers expire status (ten seconds recommended).
  `?dry_run=true` does not publish; use a fresh `Idempotency-Key` per refresh.

- `GET …/chats` rows carry `kind`, `is_main`, `unread_messages` and
  `unread_mentions`. `is_main` is true for the space's main chat (the space
  chat every member shares) and false for every other chat and discussion.
  `?include=discussions` adds object discussions (row id = the discussion id,
  usable on every chat route; `parent_id` = the object) and
  `?unread=messages|mentions` keeps only rows with unread state. That is the
  inbox: one call per space finds every chat and discussion with an unread
  mention. Read a hit with `…/messages`, clear it with `POST …/read`
  `scope:"mentions"`.
- `GET …/chats/{id}/messages` returns `{messages, state, message_count,
  has_more, next_before?, next_after?}`. `state` carries `unread_messages`,
  `unread_mentions`, `last_state_id` — so "anything new?" is a `?limit=1`
  read. Cursors only (`?after=` walks forward; otherwise newest-first via
  `next_before`); `?offset=` is rejected.
- Message `text` is markdown both ways (mentions as
  `<mention object_id="…">`). In a space chat a `#` heading line posts as a
  bold line and a ``` fence as code (language dropped; several lines show as
  a code block and read back as a fence, one line as inline code); other
  block syntax stays literal. Reads escape literal block syntax (`\#`), so
  echoing `text` back keeps the message. ≤8000 UTF-16 units; `attachments` = up to 32 object
  ids from `POST …/files`. `?reactions=full` adds who reacted.
- Mark read: `POST …/chats/{id}/read` with `{"up_to": <order>,
  "last_state_id": <id>}` — **both** from the same GET, else nothing marks.
- `PATCH …/messages/{id}` `{"text"}` edits text only (attachments kept; in a
  discussion the text replaces the message's blocks, with a warning naming
  dropped quotes/links);
  editing/deleting another member's message → 403. DELETE permanently
  removes orphaned attachments — the response warns with their ids.
- No etag/If-Match on chats; order ids are the concurrency vocabulary.
- An object's **discussion** (its comment thread) is a chat. An object read
  carries `discussion: "<id>"` when one exists; `POST …/objects/{id}/discussion`
  mints one (201, `created: true`) or returns the existing id (200). Use
  that id as the chat id on every route above; `reply_to` makes a threaded
  reply. Same message body; a discussion stores the markdown as blocks:
  headings, list items, checkboxes, quotes and fenced code keep their style,
  other lines become one paragraph each (blank lines dropped, a `---` line is
  a divider, a table one line per row with a warning), nesting is flattened,
  and a read returns the same markdown as `text`. Discussions are not in
  `GET …/chats` unless you pass `?include=discussions`.
- **Watch a whole space on one connection**: `GET …/chats/stream` (SSE;
  discussions included by default, `?include=none` for chats only). Read
  `chat_added` events until `snapshot_complete`: that is the space's chat set
  (each `chat` is a `GET …/chats` row, `is_main` included, plus
  `last_state_id`), and a chat you were watching that is not in it is gone. Then live
  `chat_added`/`chat_updated`/`chat_removed`, `state_updated` and
  `message_*`/`reactions_updated`/`pinned_updated` events, each with
  `space_id` and `chat_id` (message events also `kind`, `parent_id`). A chat
  that appears later is followed by its newest messages.
  - No event ids, no replay. Keep one checkpoint per chat: the highest
    `message.state_id` you processed (never from `state_updated` or
    `last_state_id`). After any reconnect, for each chat whose
    `chat_added.last_state_id` is ahead of its checkpoint, catch up once with
    `GET …/chats/{id}/messages/stream` and `Last-Event-ID: <checkpoint>`,
    drain the replayed `message_added`, close; one at a time (those count
    against the per-chat cap). The replay covers the newest `limit` messages of
    the chat (pass `limit=1000`); an older-order message that synced late and
    fell outside that window is not recovered. `resync_required` there →
    re-read the chat.
  - Dedupe on message id: an event can repeat, and rarely describe a change
    that rolled back; confirm a message you did not hold with a read. Still
    apply `message_updated`/`message_deleted` for messages you already hold.
  - Edits, deletions and reactions during a gap are not recovered; re-read a
    chat's recent messages after a gap if that matters.
  - At most 16 space streams per process (429 `too_many_streams`, close one).
    A 500 naming a chat means that chat's state failed to load; the space's
    stream stays refused until the app restarts.

- **Spaces stream** — `GET /v2/spaces/stream` (SSE) is `GET /v2/spaces` held
  open; not the per-space chat stream above.
  - Opens with `space_added` per space (the list row, **full ids always**;
    `ids=compact` is a 400), then `snapshot_complete` carrying
    `has_not_granted_spaces`.
  - Live: `space_added`, `space_updated` (whole row), `space_removed`
    `{space_id, reason}`, `not_granted_updated`. Reasons: `access_removed`
    (the key's grant was edited), `gone` (deleted or left), `unavailable`
    (did not load here, or still joining — may come back as `space_added`, or
    get a second `space_removed` with its final reason).
  - A grant edit changes the stream in place, no reconnect. `stream_closed`
    `{reason: key_revoked | key_expired}` is the last event before the server
    ends it: the key now answers 401, do not reconnect. An end with no
    `stream_closed` (server restart) can be reopened.
  - No ids, no replay: a reconnect is a fresh snapshot; a space you hold that
    is absent from it has left.
  - At most 16 spaces streams per process (429 `too_many_streams`, close one).

## Authenticated API conventions

- **Errors** are `{status, code, message, issues:[{path, message,
  hint}]}` — built to be repaired in ONE retry: fix the named path per the
  hint, resend once. Never loop blindly; 403s and validation failures do
  not improve with repetition.
- `warnings` on success responses are advisory — no retry needed.
- **`Idempotency-Key`** (all mutations incl. DELETE): mint a fresh random
  key per logical mutation; reuse the SAME key only to retry the identical
  request — a replay answers `Idempotency-Replayed: true`. The same key
  with a different body/path/query → 409 `idempotency_conflict`.
- **`?dry_run=true`** on any mutation: full validation, identical verdicts,
  nothing committed (response echoes `dry_run: true`).
- **`?create_missing_options=true`** on any write that sets a select value: consent
  to MINT option names the property does not hold yet. Default off, and off
  refuses — an unmatched name is usually a typo or a stale label, and a
  minted option joins the property's vocabulary for the whole space with no
  delete surface. `created` on the response lists what a consented write
  actually minted.
- **`If-Match`** (objects only): send an etag back verbatim when a
  concurrent overwrite would matter; mismatch → 409 `etag_mismatch`
  carrying the current etag. Omit it by default — sync also moves the
  etag, so habitual If-Match 409s on noise.
- `POST /v2/validate` pre-flights an AnyBlock document: 200 with
  `{issues, warnings}` even for an invalid one.

## Look it up at runtime — don't guess

- `GET /v2/schemas` — index. `GET /v2/schemas/{kind}` — strict JSON Schema
  + worked example per request kind (`object`, `shortcut`, `type`,
  `type_document`, `template`, `document`, `property`, `query`,
  `collection`, `file`, `search`, `space`, `filters`, `chat`,
  `chatMessage`, `chatMessageEdit`, `chatReaction`, `chatRead`). The
  three document kinds are narrowed to what their endpoint accepts;
  `document` is the full format, what `POST /v2/validate` checks. The `filters` kind also serves the filter-string grammar
  (EBNF + examples). `GET /v2/schemas/ops/{op}` — per-op schema + example.
- Live vocabulary: `GET …/types` and `GET …/types/{key}` (the type
  document, incl. its property keys); `GET …/properties`;
  `GET …/properties/{key}/options?prefix=` (check before writing select
  values); `GET …/members` and `…/members/me` (participant ids for
  `assignee`/`creator`; `/me` is your own).
- Full reference: `GET /v2/docs/openapi.json` (or `.yaml`).

## Mistakes that actually happen

- RFC 3339 dates in the **structured** `filters` array (unix seconds
  there — or use the filter string, which converts).
- Rewriting a whole multiSelect array to add one entry — use
  `set_properties.add`.
- Option **ids**, or wrong-case option names, as values — names are the
  identity; check `…/options` first.
- Reusing one `Idempotency-Key` across different requests → 409. Keys are
  per logical mutation, not per session.
- `replace_text`/`edit` text is markup SOURCE: `*`, `[`, `~~` in a
  replacement become real formatting — escape with `\`.
- Deleting a parent block without `recursive: true`, or moving a block
  into its own subtree — rejected with the reason; read the error.
- Filtering on file metadata without naming a file type — zero rows.

## Not in v2 (yet)

- **Permanent DELETE is own-output-only** — `?permanent=true` removes only
  objects THIS key created (recorded at creation, immutably). Objects
  created before that shipped, in the app, by import or by other members
  can be archived and restored, never deleted for good through the API.
  Types/properties use their own DELETE routes and have no API restore.
- No file content extraction ("read this PDF") in the API. Download its
  bytes with `GET …/files/{file_id}/content` and process them in the client.
- No per-chat message full-text search under /v2 (v1 for now).
- `GET …/types/{key}/schema` is a 501 stub — compose from
  `GET …/types/{key}` + `…/properties/{key}/options`.
- No option rename/recolor/delete under /v2 (v1 tags admin, Phase 8).
