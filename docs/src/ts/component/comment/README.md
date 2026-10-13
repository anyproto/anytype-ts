# Comment System

Object-level discussion system with threaded posts, replies, rich text editing, and reactions.

## Architecture

### Data Flow
1. **Init**: `CommentSection` mounts on object page, subscribes via `ChatSubscribeLastMessages`
2. **Load**: Messages parsed into `CommentMessage` models, split into posts/replies in MobX store
3. **Submit**: Lexical editor state -> `CommentContentPart[]` -> `ChatMessageBlock[]` -> gRPC `ChatAddMessage`
4. **Receive**: Server blocks -> `blocksToParts()` -> parts stored in `CommentMessage.content.parts`
5. **Render**: `renderParts()` converts parts array into JSX elements

### Components

| File | Purpose |
|------|---------|
| `index.tsx` | Re-exports `CommentSection` from `section.tsx` |
| `section.tsx` | Orchestrator: subscription lifecycle, message loading, pagination, deep-linking, visibility tracking |
| `post.tsx` | Top-level comment: author info, content, reactions, context menu, inline edit |
| `reply.tsx` | Reply to a post: similar to post but simpler |
| `list.tsx` | Container mapping posts with load-more |
| `form.tsx` | Submission form: draft persistence, file uploads, toolbar, slash/emoji/mention menus, typing publish |
| `activity.tsx` | Typing and agent activity: `CommentActivity` at a thread's end or the discussion level, `CommentActivityAttached` under the comment a run produced |
| `render.tsx` | Converts `CommentContentPart[]` -> JSX (paragraphs, headings, lists, code, embeds) |
| `embedPreview.tsx` | Embed previews: LaTeX, YouTube, Vimeo, Figma, etc. |

### Typing and agent activity

While the section is open, it subscribes `typing/<discussionId>` (`Lib/presence`) and `status/<discussionId>` (`chatStatus.retain(space, discussionId, 'discussion')`), the same pubsub channels as chats.

- A reply form publishes typing with `replyTo` = its post; the main composer without it
- Settings → Personal → Messaging "Show others when I'm typing" (`S.Common.sendTyping`, broadcast to all tabs) turns off publishing typing in chats and comments; editor carets are not affected
- Agents send `reply_to` with their status; in discussion mode the journal keeps one open run per publisher, sealed by that publisher's comment
- `discussionActivity()` (`Lib/chatStatus/timeline`) places everything: a finished run on its comment, the rest at the end of the thread its reply target resolves to (`S.Comment.getThreadRoot`), else at the discussion level
- Rendering reuses the chat's `StatusGroup` (`isCompact`: one typing-row line until expanded) and `TypingIndicator` from `block/chat/status.tsx`

### Editor (`src/ts/component/form/commentEditor.tsx`)

Lexical-based rich text editor with custom nodes and plugins:

**Custom Nodes**: `MentionNode`, `LinkTextNode`, `AttachmentNode`, `EmbedNode`, `HorizontalRuleNode`

**Plugins**: SubmitPlugin (Ctrl+Enter), EscapePlugin, FormattingPlugin (Ctrl+B/I/U/S), SlashMenuPlugin, MentionPlugin (@), EmojiPlugin (:), PasteUrlPlugin, CodeHighlightPlugin, CodeExitPlugin, CodeBlockPlugin

**Key functions**:
- `editorStateToParts()` -- Serializes Lexical tree -> `CommentContentPart[]`
- `partsToEditor()` -- Deserializes parts back into Lexical nodes
- `extractTextAndMarks()` -- Extracts inline text + formatting marks from an element node
- `splitPartOnNewlines()` -- Splits a text part containing `\n` into multiple parts with adjusted mark ranges

### State (`src/ts/store/comment.ts`)

MobX store with:
- `postMap`: subscription ID -> posts
- `replyMap`: post ID -> replies
- `getThreadRoot(subId, id)`: thread root of a placed message, observable
- Pagination flags: `hasMorePostsMap`, `hasMoreRepliesMap`, `hasOlderRepliesMap`

### Utilities (`src/ts/lib/util/comment.ts`)

- `partsToBlocks()` -- Parts -> `ChatMessageBlock[]` for gRPC
- `blocksToParts()` -- Blocks -> parts (with legacy JSON fallback)
- `getDepsIds()` -- Extracts attachment/mention IDs for subscription
- `getSubId()` / `getReplySubId()` -- Subscription ID generators

### Model (`src/ts/model/commentMessage.ts`)

- `CommentMessage` -- id, orderId, creator, timestamps, content (with parts), attachments, reactions

### Interfaces (`src/ts/interface/block/comment.ts`)

- `CommentTargetType` -- Object (0) or Block (1)
- `CommentContentPart` -- style, type, text, marks, checked, lang, link, embed, attachmentData
- `CommentSectionProps` -- rootId, targetId, targetType, readonly, isPopup, messageId

### API Commands

| Command | Purpose |
|---------|---------|
| `ObjectAddDiscussion` | Create discussion for an object |
| `ChatAddMessage` | Post new comment |
| `ChatEditMessageContent` | Edit existing comment |
| `ChatDeleteMessage` | Delete comment |
| `ChatToggleMessageReaction` | Add/remove reaction |
| `ChatGetMessages` | Fetch messages with pagination |
| `ChatSubscribeLastMessages` | Subscribe to latest messages |
| `ChatGetMessagesByIds` | Get specific messages |

### Toolbar (`src/ts/component/menu/comment/toolbar.tsx`)

Formatting toolbar with text styles (paragraph, h1-h3, quote, code), text marks (bold, italic, underline, strikethrough), link, and list style selector.

### Styles (`src/scss/component/comment.scss`)

SCSS organized as: `.commentSection` -> `.commentPost` / `.commentReply` / `.commentForm` with editor block styles, rendered content styles, attachments, embeds, and dividers.

## Content Part Types

| `type` | `style` | Description |
|--------|---------|-------------|
| Text | Paragraph | Plain paragraph |
| Text | Header1/2/3 | Headings |
| Text | Quote | Block quote |
| Text | Code | Code block (with `lang`) |
| Text | Bulleted/Numbered | List items (grouped in render) |
| Text | Checkbox | Checklist items (with `checked`) |
| Link | -- | Attachment (file, image, bookmark) |
| Embed | -- | Embed (LaTeX, video, iframe) |
| Div | -- | Horizontal divider |

## Integration

Rendered at bottom of object pages in `src/ts/component/editor/page.tsx`:
```tsx
<CommentSection
	rootId={rootId}
	targetId={rootId}
	targetType={I.CommentTargetType.Object}
	readonly={readonly}
	messageId={keyboard.getMatch(isPopup)?.params?.messageId}
/>
```

Supports deep-linking to specific messages via `messageId` URL parameter.

## Draft Persistence

Drafts auto-saved to `Storage.setComment(rootId, { parts })` on every editor change. Restored on mount via `initialParts` prop.

## Pagination

- Posts: `POST_LIMIT=20`, load older via `beforeOrderId`
- Replies: `REPLY_LIMIT=10`, load older/newer via `beforeOrderId`/`afterOrderId`
