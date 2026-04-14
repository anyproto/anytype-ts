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
| `form.tsx` | Submission form: draft persistence, file uploads, toolbar, slash/emoji/mention menus |
| `render.tsx` | Converts `CommentContentPart[]` -> JSX (paragraphs, headings, lists, code, embeds) |
| `embedPreview.tsx` | Embed previews: LaTeX, YouTube, Vimeo, Figma, etc. |

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
