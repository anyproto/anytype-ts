# Multiline Code Block in Chat — Design Spec

**Date:** 2026-06-17
**Branch / worktree:** `worktree-chat-multiline-codeblock` (`.claude/worktrees/chat-multiline-codeblock`)
**Status:** Awaiting maintainer review

---

## 1. Goal

Let users author and read **multiline code blocks** in chat / discussion messages — both in the
composer (the message input) and in the rendered message bubble. A code block is a
whitespace-preserving, monospace region visually distinct from normal text.

## 2. Settled decisions (from brainstorming)

| # | Decision | Choice |
|---|----------|--------|
| Backend | Where code blocks live on the wire | **Frontend-only.** anytype-heart already persists `ChatMessageBlockText` with `style=Code` + `lang`; the gRPC mapper already round-trips it. No heart change. |
| Authoring | How the user creates a code block | **Triple-backtick + Enter** (markdown fences), Discord-style. No toolbar button, no paste-to-codeblock in v1. |
| Richness | Rendered appearance | ~~Plain monospace only.~~ **REVISED 2026-06-18 → parity with object discussions:** Prism **syntax highlighting + language label** on render, via a shared `Component/util/codeBlock` component reused by chat *and* the discussion renderer (`comment/render.tsx`). Language is set via the ` ```lang ` fence (no separate picker; the flat-fence composer has no per-block UI). Reason: discussions already shipped rich code blocks (Lexical `commentEditor` + `comment/render`) over the same `ChatMessageBlock` model; a plainer parallel version was inconsistent. |
| Scope | Message shapes | **Mixed** — one message may interleave paragraphs and code blocks. |
| Composer model | Behaviour while typing | **Raw fences in a single contenteditable.** The fence markers stay as literal text while typing; the message is split into blocks only on send. Lowest risk — the existing flat text+marks model is untouched. |

## 3. Core architecture

### 3.1 Data model — `content` is the source of truth, `blocks` is derived

A `ChatMessage` on the wire carries **both** `message` (= `content`: flat `text` + `marks`) and
`blocks` (`Mapper.To.ChatMessage`, `mapper.ts:1197` and `:1202`; `blocks` is only sent when
non-empty). We exploit this:

- **`content.text`** = the **raw authored text including the literal fence markers**, plus
  `content.marks` for the inline formatting. This stays the single source of truth for authoring
  and editing.
- **`blocks`** = a **derived, ordered list** of `ChatMessageBlock` (`{ text: ChatMessageBlockText }`)
  produced by parsing the fences. Sent alongside `content`, used only for rendering.

Why this split:

- **Edit round-trips for free.** `onEdit` (`form.tsx:1103`) already loads `content.text` + `marks`
  into the composer. Because the fences live in `content.text`, editing a message with a code
  block Just Works with no reconstruction step. On re-send we simply re-derive `blocks`.
- **Lossless fallback.** Any consumer that still reads `content.text` (reply preview, chat-list
  last-message preview, notifications, search) shows readable text with `` ``` `` markers.
- A code block is **NOT** a mark — `MarkType.Code` stays inline-code-only and untouched.

> **D1 — RESOLVED (maintainer approved 2026-06-18):** keep the `` ``` `` markers inside
> `content.text` (lower risk, free edit round-trip). Trade-off accepted: non-block-aware previews
> (reply head, chat list) display the raw fence markers. An optional `stripFences()` helper for
> preview surfaces may be added as polish but is **not** required for v1.

### 3.2 Fence syntax (line-based, GitHub-style)

- An **opening fence** is a line whose trimmed content matches `` ```<lang?> `` while not already
  inside a code block. The remainder of the line (trimmed) is the optional `lang` token.
- A **closing fence** is a line whose trimmed content is exactly `` ``` `` while inside a code block.
- An unclosed code block runs to the **end of the message** (Discord/Slack behaviour).
- Fence marker lines are **not** part of the code content.
- v1 supports **line-delimited fences only** — a one-line `` ```x``` `` is not treated as a block
  (inline code remains the single-backtick `MarkType.Code` mark, applied via the toolbar).

Example raw `content.text` (shown indented to avoid nested fences):

    Hey, try this:
    ```ts
    const x: number = 1;
    foo(x);
    ```
    let me know!

→ parsed into 3 blocks: `[paragraph "Hey, try this:", code "const x: number = 1;\nfoo(x);" lang=ts, paragraph "let me know!"]`.

### 3.3 New pure util: `fenceToBlocks` + `isInOpenCodeFence`

A new, unit-tested pure module: `src/ts/lib/util/chat.ts` (default-exported class, registered as
`Chat` in `src/ts/lib/util/index.ts` → `U.Chat`). This follows the exact precedent of `U.Comment`
(`src/ts/lib/util/comment.ts` + `comment.test.ts`). Note `U.Chat` (util) is a distinct namespace
from `S.Chat` (store).

```ts
// Returns derived blocks, or hasCode=false when no fence is present.
fenceToBlocks(text: string, marks: I.Mark[]): { blocks: I.ChatMessageBlock[]; hasCode: boolean };

// True when the caret offset sits on an opening-fence line or inside an unclosed code body.
isInOpenCodeFence(text: string, caret: number): boolean;
```

`fenceToBlocks` algorithm:

1. Split `text` into lines, tracking each line's `[start, end)` char range in the original string.
2. Walk lines, toggling `inCode` on fence lines, accumulating alternating **paragraph** and
   **code** segments with their original char ranges.
3. If no fence was ever opened → return `{ blocks: [], hasCode: false }` (caller keeps the
   current content-only path — **zero behaviour change for normal messages**).
4. For each **paragraph** segment `[a, b)`: `Mark.getPartOfString(text, { from: a, to: b }, marks)`
   already returns `{ text, marks }` in local coordinates (same helper used by `onCopy`,
   `form.tsx:479`) → `{ text: { text, style: Paragraph, marks } }`.
5. For each **code** segment: take the substring (fence lines excluded) → `{ text: { text, style: Code, lang, marks: [] } }`. Marks inside code are **dropped** (sealed code blocks, matching the editor where `canHaveMarks()` excludes code).
6. Omit empty paragraph segments (the blank line between text and a fence).

`isInOpenCodeFence` shares the same line scanner (single source of truth), stopping at the caret.

### 3.4 Composer (`form.tsx`) changes

**The Editable component needs NO changes** — fences are literal text.

1. **Enter handling** (`onKeyDownInput`, `form.tsx:176`): in the default send-on-Enter mode
   (`!chatCmdSend`, line 190), before sending, check `U.Chat.isInOpenCodeFence(value, range.current.from)`:
   - inside an open fence → insert a newline (reuse the exact newline-insert logic from the
     existing `cmd+enter` branch, lines 195–204; factor into an `insertNewline()` helper) and
     **do not send**.
   - otherwise → `onSend()` (unchanged).
   - In `chatCmdSend` mode, plain Enter already inserts a newline, so no fence special-casing is
     needed there.
   - **To send while the caret is inside an open fence:** type the closing `` ``` `` line (then
     Enter sends) or click the send button. Documented behaviour, matches Discord.
2. **Send** (`onSend` → `callBack`, `form.tsx:987`):
   - After computing `text` + `marks` (existing lines 990–993), call
     `const { blocks, hasCode } = U.Chat.fenceToBlocks(text, marks)`.
   - **Add branch** (else, line 1017): build the message as today; if `hasCode`, set
     `message.blocks = blocks`. `content.text`/`content.marks` keep the raw fenced text (unchanged).
   - **Edit branch** (line 995): set `update.content.text`/`marks` as today **and** set
     `update.blocks = hasCode ? blocks : []` so removing a fence clears stale blocks (see Risk R1).
3. **Edit load** (`onEdit`, `form.tsx:1103`): **unchanged** — loads `content.text` (fences and all)
   + marks.

### 3.5 Render (`message/index.tsx`) changes

Currently the bubble renders a single `.text` element from `content` (`:242`, `:368–372`) and
post-processes it in `init()` (`:75–100`).

1. **Branch on `message.blocks`:** if `message.blocks?.length`, render the ordered block list
   inside `.textWrapper` (before `.time`); otherwise keep the current single-`.text` path
   unchanged.
2. **Paragraph block** → `<div className="text" dangerouslySetInnerHTML={ sanitize(lbBr(Mark.toHtml(b.text.text, b.text.marks))) } />` (same pipeline as today).
3. **Code block** → `<pre className="codeBlock">{ b.text.text }</pre>` — React escapes the text;
   CSS `white-space: pre-wrap` preserves whitespace. **No** `lbBr`, **no** `Mark.toHtml`, **no**
   mention/link/emoji post-processing.
4. **`init()` post-processing:** iterate over all `.bubbleOuter .text` elements (paragraph blocks
   in order) and run `renderMentions/renderObjects/renderLinks/renderEmoji` per element using that
   paragraph block's marks. Zip `U.Dom.selectAll('.text')` with `blocks.filter(b => b.text?.style == Paragraph)`. When no blocks, keep current single-element behaviour.
5. **Empty/RTL checks** (`:245`, `:296`): compute a combined display text from blocks when present.

### 3.6 Styling (`src/scss/block/chat.scss`)

Reuse the existing code-block visual treatment (values from `markup.scss` and `text.scss:239–300`):

```scss
.codeBlock {
    font-family: 'Plex'; white-space: pre-wrap; tab-size: 4; overflow-wrap: anywhere;
    border-radius: 8px; background: var(--color-shape-highlight-light); padding: 8px 12px; margin: 4px 0px;
}
```

- All colors via CSS variables → dark mode is automatic. Run `/dark-mode-check` after SCSS edits.
- Exact padding/margin to be finalized against the chat bubble during implementation (no guessing —
  reuse the editor's `var(--color-shape-highlight-light)` background and `'Plex'`/`tab-size: 4`).

## 4. Files to change

| File | Change |
|------|--------|
| `src/ts/lib/util/chat.ts` (new) | `fenceToBlocks`, `isInOpenCodeFence`; register as `U.Chat` |
| `src/ts/lib/util/chat.test.ts` (new) | Unit tests for the parser |
| `src/ts/component/block/chat/form.tsx` | Enter fence handling; `onSend` derive+attach `blocks` (add + edit) |
| `src/ts/component/block/chat/message/index.tsx` | Render `message.blocks`; per-paragraph `init()` post-processing |
| `src/scss/block/chat.scss` | `.codeBlock` styling |

No changes expected to: `editable.tsx`, `mapper.ts`, `command.ts`, interfaces/model (all already
support blocks). The only possible exception is a small `mapper.ts` tweak **if** Risk R1
materializes (clearing blocks on edit).

## 5. Non-goals (v1)

Syntax highlighting · language picker / label · copy button · toolbar / `+`-menu insert button ·
paste-a-codeblock detection (pasted code still degrades to plain text as today) · in-composer
WYSIWYG styled block · single-line `` ```x``` `` blocks · per-codeblock character limit.

(Most are easy follow-ups: `lang` is already captured and stored, so highlighting/label can be
added later without a data change.)

## 6. Edge cases & rules

- **Sealed code:** marks inside a code segment are dropped on send. Toolbar may still apply a mark
  visually in the composer, but it won't persist (acceptable v1; disabling toolbar inside fences is
  a future polish).
- **Char limit:** code counts toward the existing `J.Constant.limit.chat.text` (no separate limit).
- **Unclosed fence:** renders as code through end of message.
- **Inline single/double backticks:** unaffected; not block fences.
- **Reply / chat-list previews:** show raw `` ``` `` markers (see D1; optional `stripFences()`).

## 7. Testing

### 7.1 Unit (`src/ts/lib/util/chat.test.ts`)
no fence → `hasCode=false` · single code block · mixed text+code+text · unclosed fence · `lang`
capture (`` ```ts ``) and no-lang (`` ``` ``) · paragraph marks sliced & re-offset · marks dropped
in code · empty paragraph segments omitted · `isInOpenCodeFence` at: plain text, on opening-fence
line, inside body, after closing fence.

### 7.2 E2E (`../anytype-desktop-suite`, Playwright + POM)
- **Spec:** `specs/chat/code-blocks.md` (IDs `CB-001…`).
- **Tests:** `tests/chat/code-blocks.spec.ts` using `import { chatTest as test, expect } from './helpers'`.
- **Page object:** extend `src/pages/main/chat.page.ts` with a `typeCodeBlock(code, lang?)` helper
  and a `codeBlock` locator. **Render selector to assert:** `.message .bubbleOuter .codeBlock`
  (defined here so tests can target it).
- **Cases:** CB-001 send single code block → `.codeBlock` visible, text preserved incl. newlines ·
  CB-002 mixed text+code+text → `.text` + `.codeBlock` + `.text` in order · CB-003 multiline code
  preserves newlines/whitespace · CB-004 edit a message with a code block round-trips (fences
  reload into composer, re-send keeps the block) · CB-005 unclosed fence renders as code to end ·
  CB-006 inline single backticks do **not** create a block.
- Follows existing patterns: `restartGrpcServer()` in `beforeAll`, `test.step('CB-00x: …')`,
  reference `tests/editor/blocks/code-block.spec.ts` for code assertions.

## 8. Risks & assumptions

- **A1 (assumption):** heart treats `content.text` as opaque and `blocks` as the rich structure;
  sending both does not double-render server-side. (User confirmed heart supports chat blocks.)
- **R1 (risk):** on edit that **removes** a code block we send `update.blocks = []`, but
  `Mapper.To.ChatMessage` only emits `blocks` when non-empty — so heart receives no `blocks` field.
  If heart does not clear previously-stored blocks when the field is absent on edit, stale blocks
  could persist. **Verify during implementation** (send an explicit clear or a tiny mapper tweak if
  needed). Covered by E2E CB-004 variant.
- **R2:** caret/offset accuracy of `isInOpenCodeFence` with ZWS marks — use model offsets
  (`range.current`, already ZWS-free) and unit-test boundaries.

## 9. Project-checklist follow-ups (per CLAUDE.md)
`bun run typecheck` + `bun run lint` · `/dark-mode-check` (SCSS edited) · `/qa-engineer` (chat
user-facing change) · `/update-docs` (chat component README) after implementation.
