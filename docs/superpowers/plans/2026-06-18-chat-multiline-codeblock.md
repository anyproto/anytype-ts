# Chat Multiline Code Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users author (triple-backtick fences) and read multiline code blocks in chat / discussion messages.

**Architecture:** The composer stays a single flat contenteditable; `` ``` `` fences are literal text kept in `content.text` (the source of truth, so edits round-trip for free). On send, a new pure util `U.Chat.fenceToBlocks` derives an ordered `message.blocks` list (paragraph + `style=Code`) sent alongside `content`. The message renderer gains a `blocks` branch that renders code as an escaped `<pre className="codeBlock">`.

**Tech Stack:** TypeScript, React 18, MobX, Vitest (unit), Playwright (E2E in `../anytype-desktop-suite`), SCSS. Package manager: `bun`.

## Global Constraints

- Indentation: **tabs**, not spaces (TS/TSX/SCSS).
- `else if` on a new line; wrap compound condition parts in parentheses.
- Collect className lists into a `cn` variable before `return`.
- SCSS: never mix a selector's own properties and nested children in one block; leaf selectors may be one-liners. Colors via CSS variables only; never hardcode.
- All UI text via `translate()`; keys in `src/json/text.json` (v1 needs **no** new keys).
- DOM access via `U.Dom.*` only; never `document.getElementById`/`querySelector`; no jQuery.
- Reuse exact pixel/color values from the precedent `.commentEditor-codeBlock` (`src/scss/component/comment.scss:296`) — do not invent visual values.
- Verification gates per task: `bun run typecheck` and `bun run lint` must pass.
- Commits: husky pre-commit is currently broken in this worktree (`.npmrc min-release-age=7d` → `npx lint-staged` throws `Invalid time value`). Use `git commit --no-verify`. Do **not** modify `.npmrc`.

---

### Task 1: `U.Chat` util — `fenceToBlocks` + `isInOpenCodeFence` (pure, TDD)

**Files:**
- Create: `src/ts/lib/util/chat.ts`
- Create: `src/ts/lib/util/chat.test.ts`
- Modify: `src/ts/lib/util/index.ts` (register `Chat`)

**Interfaces:**
- Consumes: `Mark.getPartOfString(text, range, marks) → { text, marks }` (`src/ts/lib/mark.ts:900`); `I.TextStyle.Code`, `I.TextStyle.Paragraph`; `I.ChatMessageBlock` (`{ text: { text, style, marks, lang? } }`).
- Produces:
  - `U.Chat.fenceToBlocks(text: string, marks: I.Mark[]): { blocks: I.ChatMessageBlock[]; hasCode: boolean }` — `hasCode` is true iff at least one code block was produced.
  - `U.Chat.isInOpenCodeFence(text: string, caret: number): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/ts/lib/util/chat.test.ts` (note 4-backtick fences because the data contains literal triple-backticks):

````ts
import { describe, it, expect } from 'vitest';
import Chat from './chat';
import * as I from 'Interface';

const F = '```';

describe('Chat', () => {

	describe('fenceToBlocks', () => {
		it('returns hasCode=false and no blocks for plain text', () => {
			const res = Chat.fenceToBlocks('hello world', []);
			expect(res.hasCode).toBe(false);
			expect(res.blocks).toHaveLength(0);
		});

		it('parses a single code block with language', () => {
			const text = [ `${F}ts`, 'const x = 1;', 'foo(x);', F ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.hasCode).toBe(true);
			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[0].text.lang).toBe('ts');
			expect(res.blocks[0].text.text).toBe('const x = 1;\nfoo(x);');
			expect(res.blocks[0].text.marks).toHaveLength(0);
		});

		it('parses mixed text + code + text in order', () => {
			const text = [ 'Hey, try this:', `${F}js`, 'foo(bar)', F, 'let me know!' ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.blocks).toHaveLength(3);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Paragraph);
			expect(res.blocks[0].text.text).toBe('Hey, try this:');
			expect(res.blocks[1].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[1].text.text).toBe('foo(bar)');
			expect(res.blocks[2].text.style).toBe(I.TextStyle.Paragraph);
			expect(res.blocks[2].text.text).toBe('let me know!');
		});

		it('treats an unclosed fence as code to end of message', () => {
			const text = [ 'before', `${F}`, 'a', 'b' ].join('\n');
			const res = Chat.fenceToBlocks(text, []);

			expect(res.blocks).toHaveLength(2);
			expect(res.blocks[1].text.style).toBe(I.TextStyle.Code);
			expect(res.blocks[1].text.text).toBe('a\nb');
			expect(res.blocks[1].text.lang).toBeUndefined();
		});

		it('slices and re-offsets marks into the correct paragraph block', () => {
			// "Hi" bold (0..2), then code, then "bye" bold-less. Mark on "bye": range over "bye".
			const text = [ 'Hi', `${F}`, 'x', F, 'bye' ].join('\n');
			// offsets: H=0 i=1 \n=2 ```=3.. \n  x \n ``` \n b y e
			const byeFrom = text.indexOf('bye');
			const marks: I.Mark[] = [
				{ type: I.MarkType.Bold, range: { from: 0, to: 2 } },
				{ type: I.MarkType.Italic, range: { from: byeFrom, to: byeFrom + 3 } },
			];
			const res = Chat.fenceToBlocks(text, marks);

			expect(res.blocks[0].text.text).toBe('Hi');
			expect(res.blocks[0].text.marks).toEqual([{ type: I.MarkType.Bold, range: { from: 0, to: 2 } }]);
			expect(res.blocks[2].text.text).toBe('bye');
			expect(res.blocks[2].text.marks).toEqual([{ type: I.MarkType.Italic, range: { from: 0, to: 3 } }]);
		});

		it('drops marks that fall inside a code block', () => {
			const text = [ `${F}`, 'secret', F ].join('\n');
			const codeFrom = text.indexOf('secret');
			const marks: I.Mark[] = [{ type: I.MarkType.Bold, range: { from: codeFrom, to: codeFrom + 6 } }];
			const res = Chat.fenceToBlocks(text, marks);

			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.marks).toHaveLength(0);
		});

		it('omits empty paragraph segments around fences', () => {
			const text = [ `${F}`, 'code', F ].join('\n');
			const res = Chat.fenceToBlocks(text, []);
			expect(res.blocks).toHaveLength(1);
			expect(res.blocks[0].text.style).toBe(I.TextStyle.Code);
		});
	});

	describe('isInOpenCodeFence', () => {
		it('is false in plain text', () => {
			expect(Chat.isInOpenCodeFence('hello', 3)).toBe(false);
		});

		it('is true on an opening fence line', () => {
			const text = `${F}ts`;
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(true);
		});

		it('is true inside an open code body', () => {
			const text = [ `${F}ts`, 'co' ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(true);
		});

		it('is false right after a closing fence', () => {
			const text = [ `${F}ts`, 'code', F ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(false);
		});

		it('is false in trailing text after a closed block', () => {
			const text = [ `${F}`, 'code', F, 'after' ].join('\n');
			expect(Chat.isInOpenCodeFence(text, text.length)).toBe(false);
		});
	});
});
````

- [ ] **Step 2: Run tests to verify they fail**

Run: `bunx vitest run src/ts/lib/util/chat.test.ts`
Expected: FAIL — `Cannot find module './chat'`.

- [ ] **Step 3: Implement `src/ts/lib/util/chat.ts`**

````ts
import * as I from 'Interface';

const FENCE = '```';

interface Segment {
	type: 'text' | 'code';
	from: number;
	to: number;
	text: string;
	lang?: string;
};

class UtilChat {

	/** Split a message into ordered text/code segments with original char ranges. */
	getSegments (value: string): Segment[] {
		const text = String(value || '');
		const lines = text.split('\n');
		const lineStart: number[] = [];

		let acc = 0;
		for (let i = 0; i < lines.length; i++) {
			lineStart[i] = acc;
			acc += lines[i].length + 1; // + '\n'
		};

		const segments: Segment[] = [];

		let inCode = false;
		let lang = '';
		let textStart = -1;
		let textEnd = -1;
		let codeStart = -1;
		let codeEnd = -1;
		let codeOpenLine = -1;

		const flushText = () => {
			if (textStart < 0) {
				return;
			};
			const from = lineStart[textStart];
			const to = lineStart[textEnd] + lines[textEnd].length;
			segments.push({ type: 'text', from, to, text: lines.slice(textStart, textEnd + 1).join('\n') });
			textStart = -1;
			textEnd = -1;
		};

		const flushCode = () => {
			if (codeStart >= 0) {
				const from = lineStart[codeStart];
				const to = lineStart[codeEnd] + lines[codeEnd].length;
				segments.push({ type: 'code', from, to, text: lines.slice(codeStart, codeEnd + 1).join('\n'), lang });
			} else {
				const pos = (codeOpenLine >= 0) ? (lineStart[codeOpenLine] + lines[codeOpenLine].length) : text.length;
				segments.push({ type: 'code', from: pos, to: pos, text: '', lang });
			};
			codeStart = -1;
			codeEnd = -1;
			codeOpenLine = -1;
			lang = '';
		};

		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim();

			if (!inCode && (trimmed.indexOf(FENCE) == 0)) {
				flushText();
				inCode = true;
				lang = trimmed.substring(FENCE.length).trim();
				codeOpenLine = i;
				continue;
			};

			if (inCode && (trimmed == FENCE)) {
				flushCode();
				inCode = false;
				continue;
			};

			if (inCode) {
				if (codeStart < 0) {
					codeStart = i;
				};
				codeEnd = i;
			} else {
				if (textStart < 0) {
					textStart = i;
				};
				textEnd = i;
			};
		};

		if (inCode) {
			flushCode();
		} else {
			flushText();
		};

		return segments;
	};

	/** Derive ChatMessageBlocks from fenced text. hasCode is true iff a code block was produced. */
	fenceToBlocks (value: string, marks: I.Mark[]): { blocks: I.ChatMessageBlock[]; hasCode: boolean } {
		const text = String(value || '');
		const segments = this.getSegments(text);
		const blocks: I.ChatMessageBlock[] = [];

		let hasCode = false;

		for (const seg of segments) {
			if (seg.type == 'code') {
				hasCode = true;

				const block: I.ChatMessageBlock = {
					text: { text: seg.text, style: I.TextStyle.Code, marks: [] },
				};

				if (seg.lang) {
					block.text.lang = seg.lang;
				};

				blocks.push(block);
			} else {
				if (!seg.text.length) {
					continue;
				};

				const part = Mark.getPartOfString(text, { from: seg.from, to: seg.to }, marks || []);

				blocks.push({
					text: { text: part.text, style: I.TextStyle.Paragraph, marks: part.marks || [] },
				});
			};
		};

		return { blocks, hasCode };
	};

	/** True when the caret sits on an opening-fence line or inside an unclosed code body. */
	isInOpenCodeFence (value: string, caret: number): boolean {
		const text = String(value || '');
		const c = Math.max(0, Math.min(Number(caret) || 0, text.length));
		const lines = text.substring(0, c).split('\n');

		let inCode = false;

		for (let i = 0; i < lines.length; i++) {
			const trimmed = lines[i].trim();
			const isCaretLine = (i == lines.length - 1);

			if (isCaretLine) {
				if (inCode) {
					return trimmed != FENCE;
				};
				return trimmed.indexOf(FENCE) == 0;
			};

			if (!inCode && (trimmed.indexOf(FENCE) == 0)) {
				inCode = true;
			} else
			if (inCode && (trimmed == FENCE)) {
				inCode = false;
			};
		};

		return inCode;
	};

};

export default new UtilChat();
````

Note: `Mark` is a global alias (same usage as `src/ts/lib/util/comment.ts`). Confirm the import style of a sibling util (`comment.ts`) and match it — if `Mark` is not globally available there, add `import { Mark } from 'Lib/mark';` or the matching alias.

- [ ] **Step 4: Register the util** in `src/ts/lib/util/index.ts`

Add `import Chat from './chat';` with the other imports, and add `Chat,` to the export block (alphabetical-ish, near `Common`).

- [ ] **Step 5: Run tests to verify they pass**

Run: `bunx vitest run src/ts/lib/util/chat.test.ts`
Expected: PASS (all cases). Iterate the implementation if any fail — the tests are the source of truth.

- [ ] **Step 6: Typecheck + commit**

Run: `bun run typecheck`
Expected: no errors.

```bash
git add src/ts/lib/util/chat.ts src/ts/lib/util/chat.test.ts src/ts/lib/util/index.ts
git commit --no-verify -m "feat(chat): add U.Chat fenceToBlocks + isInOpenCodeFence util"
```

---

### Task 2: Composer — Enter inside an open fence inserts a newline (does not send)

**Files:**
- Modify: `src/ts/component/block/chat/form.tsx` (`onKeyDownInput`, default-mode branch around `:189-205`; add an `insertNewLine` helper near `insert` at `:167`)

**Interfaces:**
- Consumes: `U.Chat.isInOpenCodeFence` (Task 1); existing `insert(text, value)` (`:167`), `getTextValue()` (`:1261`), `range.current`, `scrollToBottom`.
- Produces: no new exports.

- [ ] **Step 1: Add the `insertNewLine` helper**

After the `insert` function (ends `:174`), add:

```tsx
	const insertNewLine = () => {
		let value = getTextValue();

		if (!value.match(/\r?\n$/)) {
			value += '\n';
		};

		insert('\n', value);
		scrollToBottom();
	};
```

- [ ] **Step 2: Use the open-fence check in the default-mode Enter handler**

Replace the `else` branch body inside `onKeyDownInput` (currently `:189-205`) with:

```tsx
			} else {
				keyboard.shortcut(`enter`, e, () => {
					e.preventDefault();

					if (U.Chat.isInOpenCodeFence(value, range.current.from)) {
						insertNewLine();
					} else {
						onSend();
					};
				});

				keyboard.shortcut(`${cmd}+enter`, e, () => {
					e.preventDefault();
					insertNewLine();
				});
			};
```

(The `if (chatCmdSend) { ... }` branch above is unchanged — there plain Enter already inserts a newline natively, so fences already work.)

- [ ] **Step 3: Typecheck + lint**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/ts/component/block/chat/form.tsx
git commit --no-verify -m "feat(chat): Enter inside an open code fence inserts a newline"
```

---

### Task 3: Send path — derive and attach `message.blocks` on add and edit

**Files:**
- Modify: `src/ts/component/block/chat/form.tsx` (`onSend` → `callBack`, `:987-1040`)

**Interfaces:**
- Consumes: `U.Chat.fenceToBlocks` (Task 1); existing `text`, `marks` computed at `:990-993`.
- Produces: the wire message now carries `blocks` (a `I.ChatMessageBlock[]`) when code is present. Task 4 (render) relies on `message.blocks`.

- [ ] **Step 1: Derive blocks once, after `marks` is computed**

In `callBack`, immediately after the line `const marks = Mark.checkRanges(...)` (`:993`), add:

```tsx
			const { blocks, hasCode } = U.Chat.fenceToBlocks(text, marks);
```

- [ ] **Step 2: Attach blocks on the edit branch**

In the `if (editingId.current)` branch, after `update.content.marks = marks;` (`:1002`), add:

```tsx
						update.blocks = hasCode ? blocks : [];
```

- [ ] **Step 3: Attach blocks on the add branch**

In the `message` object literal (`:1017-1026`), add a `blocks` field:

```tsx
					const message = {
						replyToMessageId: replyingId,
						content: {
							marks,
							text,
							style: I.TextStyle.Paragraph,
						},
						attachments: newAttachments,
						reactions: [],
						blocks: hasCode ? blocks : [],
					};
```

(`Mapper.To.ChatMessage` only serializes `blocks` when non-empty, so `[]` is a no-op for normal messages — zero behaviour change.)

- [ ] **Step 4: Typecheck + lint**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/ts/component/block/chat/form.tsx
git commit --no-verify -m "feat(chat): derive and send message.blocks for code fences"
```

---

### Task 4: Render path — message renders `blocks`; code as `<pre className="codeBlock">`

**Files:**
- Modify: `src/ts/component/block/chat/message/index.tsx` (`init()` `:75-100`; content JSX `:367-377`)
- Modify: `src/scss/block/chat/message.scss` (add `.codeBlock` inside the `.bubble { … }` block near `:44`)

**Interfaces:**
- Consumes: `message.blocks` (Task 3); `Mark.toHtml`, `U.String.lbBr`, `U.String.sanitize`; `renderMentions/renderObjects/renderLinks/renderEmoji`.
- Produces: rendered DOM with selector `.message .bubbleOuter .codeBlock` (Task 5 asserts it).

- [ ] **Step 1: Add a content renderer and branch the JSX**

In `message/index.tsx`, just before the `return (` of the component (after the `text` const at `:242` is in scope — place this near the other `const` declarations, e.g. after `:243`), add:

```tsx
	const textBlocks = (message.blocks || []).filter(it => it.text);
	const hasBlocks = textBlocks.length > 0;

	const renderBlocks = () => textBlocks.map((b, i) => {
		const bt = b.text;

		if (bt.style == I.TextStyle.Code) {
			return <pre key={i} className="codeBlock">{bt.text}</pre>;
		};

		const html = U.String.sanitize(U.String.lbBr(Mark.toHtml(bt.text, bt.marks))).replace(/​/g, '');
		return <div key={i} className="text" dangerouslySetInnerHTML={{ __html: html }} />;
	});
```

Then replace the single text div (`:368-372`) with the branch:

```tsx
										{hasBlocks ? renderBlocks() : (
											<div
												ref={textRef}
												className="text"
												dangerouslySetInnerHTML={{ __html: text }}
											/>
										)}
```

- [ ] **Step 2: Make `init()` post-process each paragraph element with its own marks**

Replace the body of `init()` after `const er = U.Dom.select('.reply .text', node);` (`:89`) so the bubble branch handles blocks. The reply branch (`:96-99`) stays unchanged. New bubble handling:

```tsx
		const textBlocks = (message.blocks || []).filter(it => it.text && (it.text.style != I.TextStyle.Code));

		if (textBlocks.length) {
			const els = U.Dom.selectAll('.bubbleOuter .text', node);

			els.forEach((el: HTMLElement, i: number) => {
				const bt = textBlocks[i]?.text;
				if (!bt) {
					return;
				};

				renderMentions(rootId, el, bt.marks, () => bt.text, { subId, withPreview: false });
				renderObjects(rootId, el, bt.marks, () => bt.text, { readonly: isReadonly }, { subId });
				renderLinks(rootId, el, bt.marks, () => bt.text, { readonly: isReadonly }, { subId });
				renderEmoji(el);
			});
		} else {
			const et = U.Dom.select('.bubbleOuter .text', node);

			renderMentions(rootId, et, marks, () => text, { subId, withPreview: false });
			renderObjects(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
			renderLinks(rootId, et, marks, () => text, { readonly: isReadonly }, { subId });
			renderEmoji(et);
		};
```

(Keep the existing `const { marks, text } = content;` and `isReadonly` declarations at the top of `init()`.)

- [ ] **Step 3: Add `.codeBlock` styling**

In `src/scss/block/chat/message.scss`, inside the `.bubble { … }` block that contains `.text` and `.time` (near `:44-46`), add the leaf rule (mirrors `.commentEditor-codeBlock`, `src/scss/component/comment.scss:296`):

```scss
		.codeBlock {
			display: block; padding: 16px 12px; margin: 8px 0px; border-radius: 8px;
			background: var(--color-shape-highlight-light); font-family: 'Plex Mono', monospace;
			font-size: 13px; line-height: 18px; white-space: pre-wrap; tab-size: 4; overflow-wrap: anywhere;
		}
```

- [ ] **Step 4: Typecheck + lint**

Run: `bun run typecheck && bun run lint`
Expected: no errors.

- [ ] **Step 5: Dark-mode audit**

Run the `/dark-mode-check` skill (SCSS was edited). The only color used is `var(--color-shape-highlight-light)`, which resolves per-theme — confirm no dark override is needed (do not duplicate the light value into the dark theme).

- [ ] **Step 6: Commit**

```bash
git add src/ts/component/block/chat/message/index.tsx src/scss/block/chat/message.scss
git commit --no-verify -m "feat(chat): render code blocks in messages"
```

---

### Task 5: E2E tests in `../anytype-desktop-suite`

**Files:**
- Create: `../anytype-desktop-suite/specs/chat/code-blocks.md`
- Create: `../anytype-desktop-suite/tests/chat/code-blocks.spec.ts`
- Modify: `../anytype-desktop-suite/src/pages/main/chat.page.ts` (add a `codeBlock` locator + `typeCodeBlock` helper)

**Interfaces:**
- Consumes: `chatTest` fixture + helpers (`tests/chat/helpers.ts`); `ChatPage` (`#messageBox`, send button, `lastMessage()`, `messageByText`).
- Produces: render assertions against `.message .bubbleOuter .codeBlock`.

- [ ] **Step 1: Write the spec** `specs/chat/code-blocks.md`

```markdown
# Chat: Code Blocks @regress

## CB-001: Send a single code block
- Type ```ts, Enter, type code lines, type closing ```, press Enter to send
- **Expected:** message shows a `.codeBlock` whose text preserves the code and newlines

## CB-002: Mixed text + code + text
- Send a message with a paragraph, a fenced code block, and a trailing paragraph
- **Expected:** bubble renders text, then `.codeBlock`, then text, in order

## CB-003: Multiline code preserves whitespace
- Send a code block with indentation and blank lines
- **Expected:** rendered `.codeBlock` preserves leading whitespace and newlines

## CB-004: Edit a message with a code block round-trips
- Send a code block, edit it (ArrowUp / edit action), change a line, re-send
- **Expected:** the edited message still renders a `.codeBlock` with the new content

## CB-005: Unclosed fence renders as code to end
- Type ``` then code lines without a closing fence; send via the send button
- **Expected:** everything after the fence renders inside a single `.codeBlock`

## CB-006: Single backticks do not create a block
- Send a message containing inline `single backtick` code
- **Expected:** no `.codeBlock` element; inline markup only
```

- [ ] **Step 2: Add page-object helpers** to `src/pages/main/chat.page.ts`

```ts
	readonly codeBlock: Locator = this.page.locator('.message .bubbleOuter .codeBlock');

	// Types an opening fence, the code (newlines via Shift+Enter), then a closing fence.
	async typeCodeBlock (code: string, lang = '') {
		await this.messageBox.click();
		await this.page.keyboard.type('```' + lang);
		await this.page.keyboard.press('Enter'); // inside open fence → newline
		const lines = code.split('\n');
		for (let i = 0; i < lines.length; i++) {
			await this.page.keyboard.type(lines[i]);
			await this.page.keyboard.press('Enter');
		}
		await this.page.keyboard.type('```'); // closing fence
	}
```

(Match the file's existing locator/typing conventions — adjust `Locator` import and `this.page` access to the established pattern.)

- [ ] **Step 3: Write the tests** `tests/chat/code-blocks.spec.ts`

````ts
import { chatTest as test, expect } from './helpers';

test.describe('Chat code blocks @regress', () => {

	test.beforeAll(async () => { await restartGrpcServer(); });

	test('CB-001 / CB-003: send a single multiline code block', async ({ chatUser: user }) => {
		const code = 'const x = 1;\n\tfoo(x);';

		await test.step('CB-001: author and send', async () => {
			await user.chat.typeCodeBlock(code, 'ts');
			await user.page.keyboard.press('Enter'); // after closing fence → send
		});

		await test.step('CB-003: rendered code preserves content + whitespace', async () => {
			await expect(user.chat.codeBlock).toBeVisible();
			const txt = await user.chat.codeBlock.first().innerText();
			expect(txt).toContain('const x = 1;');
			expect(txt).toContain('\tfoo(x);');
		});
	});

	test('CB-006: single backticks do not create a block', async ({ chatUser: user }) => {
		await user.chat.sendMessage('inline `code` here');
		expect(await user.chat.codeBlock.count()).toBe(0);
	});
});
````

(Reference `tests/editor/blocks/code-block.spec.ts` for code assertions and `tests/chat/send-messages.spec.ts` for the `chatUser` pattern. Add CB-002/004/005 following the same structure once CB-001 is green.)

- [ ] **Step 4: Run the new tests**

Run (from `../anytype-desktop-suite`): `npx playwright test tests/chat/code-blocks.spec.ts`
Expected: PASS. Iterate selectors/timing against the real app if needed.

- [ ] **Step 5: Commit (in the suite repo)**

```bash
cd ../anytype-desktop-suite
git add specs/chat/code-blocks.md tests/chat/code-blocks.spec.ts src/pages/main/chat.page.ts
git commit -m "test(chat): e2e coverage for multiline code blocks"
```

---

## Final verification (after all tasks)

- [ ] `bun run typecheck` and `bun run lint` clean.
- [ ] `bunx vitest run src/ts/lib/util/chat.test.ts` green.
- [ ] Manual smoke (per `CLAUDE.md`): build/run the app, open a chat, send a mixed text+code+text message, confirm rendering and edit round-trip.
- [ ] `/dark-mode-check` (SCSS), `/qa-engineer` (chat user-facing change), `/update-docs` (chat component README).
- [ ] Deep multi-agent review (requested by maintainer).

## Self-review (plan vs spec)

- **Spec coverage:** §3.3 util → Task 1; §3.4 Enter handling → Task 2; §3.4 send/blocks → Task 3; §3.5 render + §3.6 styling → Task 4; §7.1 unit tests → Task 1 Step 1; §7.2 E2E → Task 5. D1 (fences in `content.text`) → Task 3 keeps `content.text`/`content.marks` unchanged; edit round-trip → no `onEdit` change (relies on content.text). All covered.
- **Risk R1 (clear blocks on edit):** Task 3 Step 2 sets `update.blocks = []` when no code; verify heart clears stale blocks (covered by CB-004 + manual). If heart keeps stale blocks, a follow-up `mapper.ts` tweak to always emit `blocks` on edit is the contingency.
- **Type consistency:** `fenceToBlocks`/`isInOpenCodeFence` signatures and the `{ text: { text, style, marks, lang? } }` block shape match across Tasks 1, 3, 4 and the `partsToChatBlocks` precedent.
- **Placeholders:** none — CB-002/004/005 are explicitly deferred-with-structure in Task 5 Step 3, not silent gaps.
