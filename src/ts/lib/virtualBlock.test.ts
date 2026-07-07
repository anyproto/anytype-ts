import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-dom', () => ({
	flushSync: (fn: any) => fn(),
}));

import * as I from 'Interface';
import * as M from 'Model';
import { virtualBlock } from './virtualBlock';
import { focus } from './focus';

/**
 * State-machine coverage for the trailing virtual placeholder ("click to type").
 *
 * The invariants under test mirror the data-loss fix acceptance criteria:
 * - Clicking (activate + focus) produces ZERO middleware calls.
 * - The first real input produces exactly one BlockCreate whose block model
 *   already carries the content.
 * - Nothing is ever created from an empty placeholder (blur, Enter chains, etc.
 *   route through setText with empty text).
 * - Writes and callbacks issued against the virtual id while the create is in
 *   flight are queued and land on the real block id.
 */

const g = globalThis as any;

const ROOT_ID = 'root';
const VIRTUAL_ID = 'virtualLastBlock';

let createCalls: any[];
let replaceCalls: any[];
let compositionListeners: any[];
let storeBlocks: Map<string, any>;
let storeChildren: Map<string, string[]>;
let insideTable: Set<string>;

const completeCreate = (blockId: string, error?: number) => {
	const call = createCalls[createCalls.length - 1];
	call.cb({ blockId, middleTime: 1, error: { code: error || 0 } });
};

const makeBlock = (id: string, param?: any) => {
	const block = new M.Block({
		id,
		type: I.BlockType.Text,
		childrenIds: [],
		fields: {},
		...param,
		content: { style: I.TextStyle.Paragraph, text: '', marks: [], ...(param?.content || {}) },
	});

	storeBlocks.set(id, block);
	return block;
};

// Simulates the middleware response: events remove the old block and add the
// new one (carrying the sent content) before the callback runs
const completeReplace = (newId: string, error?: number) => {
	const call = replaceCalls[replaceCalls.length - 1];

	if (!error) {
		storeBlocks.delete(call.blockId);
		makeBlock(newId, { content: { text: call.param.content.text, marks: call.param.content.marks } });
	};

	call.cb({ blockId: error ? '' : newId, middleTime: 1, error: { code: error || 0 } });
};

beforeEach(() => {
	createCalls = [];
	replaceCalls = [];
	compositionListeners = [];
	storeBlocks = new Map();
	storeChildren = new Map();
	insideTable = new Set();

	g.J = { Constant: { blockId: { virtualLast: VIRTUAL_ID } } };

	g.S = {
		Block: {
			getLeaf: (rootId: string, id: string) => storeBlocks.get(id) || null,
			getChildrenIds: (rootId: string, id: string) => storeChildren.get(id) || [],
			checkIsInsideTable: (rootId: string, id: string) => insideTable.has(id),
			addSessionCreated: vi.fn(),
			updateContent: vi.fn(),
		},
	};

	g.U = {
		Common: {
			compareJSON: (o1: any, o2: any) => JSON.stringify(o1) === JSON.stringify(o2),
			objectCopy: (o: any) => JSON.parse(JSON.stringify(o ?? {})),
			esc: (s: string) => String(s || ''),
		},
		Data: {
			blockSetText: vi.fn((rootId: string, blockId: string, text: string, marks: any[], update: boolean, cb?: any) => {
				cb?.({ error: { code: 0 } });
			}),
		},
		Dom: {
			select: () => null,
			selectAll: () => [],
			get: () => null,
			hasClass: () => false,
			addClass: () => {},
			removeClass: () => {},
			clearSelection: () => {},
		},
	};

	g.C = {
		BlockCreate: vi.fn((rootId: string, targetId: string, position: number, param: any, cb: any) => {
			createCalls.push({ rootId, targetId, position, param, cb });
		}),
		BlockReplace: vi.fn((rootId: string, blockId: string, param: any, cb: any) => {
			replaceCalls.push({ rootId, blockId, param, cb });
		}),
		BlockSetCarriage: vi.fn(),
	};

	g.keyboard = {
		isComposition: false,
		getRootId: () => ROOT_ID,
		setFocus: () => {},
	};

	g.analytics = { event: vi.fn() };

	g.window.addEventListener = (type: string, handler: any) => {
		if (type == 'compositionend') {
			compositionListeners.push(handler);
		};
	};
	g.window.removeEventListener = () => {};
	g.window.setTimeout = (fn: any) => {
		fn();
		return 0;
	};

	focus.state = { focused: '', range: { from: 0, to: 0 } };
	virtualBlock.deactivate();
});

describe('virtualBlock', () => {

	it('activating and focusing the placeholder produces zero middleware calls', () => {
		virtualBlock.activate(ROOT_ID, false);
		focus.set(VIRTUAL_ID, { from: 0, to: 0 });

		expect(focus.state.focused).toBe(VIRTUAL_ID);
		expect(g.C.BlockSetCarriage).not.toHaveBeenCalled();
		expect(g.C.BlockCreate).not.toHaveBeenCalled();
	});

	it('renders a text block for the active editor only', () => {
		virtualBlock.activate(ROOT_ID, false);

		expect(virtualBlock.isRendered(ROOT_ID, false)).toBe(true);
		expect(virtualBlock.isRendered(ROOT_ID, true)).toBe(false);
		expect(virtualBlock.isRendered('other', false)).toBe(false);

		const block = virtualBlock.getBlock();

		expect(block.id).toBe(VIRTUAL_ID);
		expect(block.isText()).toBe(true);
	});

	it('empty text writes on a virgin placeholder create nothing', () => {
		const cb = vi.fn();

		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, '', [], true, cb);

		expect(g.C.BlockCreate).not.toHaveBeenCalled();
		expect(cb).toHaveBeenCalled();
	});

	it('first input creates exactly one block already carrying the content', () => {
		virtualBlock.activate(ROOT_ID, false);
		focus.set(VIRTUAL_ID, { from: 0, to: 0 });

		virtualBlock.setText(ROOT_ID, 'h', [], true);

		expect(createCalls.length).toBe(1);
		expect(createCalls[0].rootId).toBe(ROOT_ID);
		expect(createCalls[0].targetId).toBe('');
		expect(createCalls[0].param.content.text).toBe('h');

		completeCreate('real1');

		expect(virtualBlock.realId).toBe('real1');
		expect(virtualBlock.resolve(VIRTUAL_ID)).toBe('real1');
		expect(virtualBlock.isActive).toBe(false);
		expect(virtualBlock.isSwapped).toBe(true);
		expect(focus.state.focused).toBe('real1');
		expect(focus.state.range).toEqual({ from: 1, to: 1 });
		expect(g.analytics.event).toHaveBeenCalledWith('CreateBlock', expect.anything());

		// No BlockTextSetText was needed — the create carried the content
		expect(g.U.Data.blockSetText).not.toHaveBeenCalled();
	});

	it('echoes of already-sent content are not re-sent after materialization', () => {
		const cb = vi.fn();

		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true);
		completeCreate('real1');

		// The debounced keyup save re-sends exactly what BlockCreate carried
		virtualBlock.setText(ROOT_ID, 'h', [], false, cb);

		expect(g.U.Data.blockSetText).not.toHaveBeenCalled();
		expect(cb).toHaveBeenCalled();

		// New content goes through as a regular redirected write
		virtualBlock.setText(ROOT_ID, 'hi', [], true);

		expect(g.U.Data.blockSetText).toHaveBeenCalledWith(ROOT_ID, 'real1', 'hi', [], true, undefined);
		expect(createCalls.length).toBe(1);
	});

	it('writes and callbacks issued while the create is in flight land on the real block', () => {
		const cb1 = vi.fn();
		const cb2 = vi.fn();

		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true, cb1);
		virtualBlock.setText(ROOT_ID, 'he', [], true, cb2);

		expect(createCalls.length).toBe(1);
		expect(cb1).not.toHaveBeenCalled();
		expect(cb2).not.toHaveBeenCalled();

		completeCreate('real1');

		expect(g.U.Data.blockSetText).toHaveBeenCalledWith(ROOT_ID, 'real1', 'he', [], true);
		expect(cb1).toHaveBeenCalledWith(expect.objectContaining({ blockId: 'real1' }));
		expect(cb2).toHaveBeenCalledWith(expect.objectContaining({ blockId: 'real1' }));
	});

	it('defers the visual swap while an IME composition is active', () => {
		g.keyboard.isComposition = true;

		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'か', [], true);
		completeCreate('real1');

		// Created but still rendered by the placeholder slot: Children must skip it
		expect(virtualBlock.realId).toBe('real1');
		expect(virtualBlock.isSwapped).toBe(false);
		expect(virtualBlock.isActive).toBe(true);
		expect(virtualBlock.getHoldId(ROOT_ID)).toBe('real1');
		expect(compositionListeners.length).toBe(1);

		g.keyboard.isComposition = false;
		compositionListeners[0]();

		expect(virtualBlock.isSwapped).toBe(true);
		expect(virtualBlock.getHoldId(ROOT_ID)).toBe('');
	});

	it('a failed create keeps the placeholder alive and retries on the next write', () => {
		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true);
		completeCreate('', 1);

		expect(virtualBlock.realId).toBe('');
		expect(virtualBlock.isActive).toBe(true);

		virtualBlock.setText(ROOT_ID, 'he', [], true);

		expect(createCalls.length).toBe(2);
		expect(createCalls[1].param.content.text).toBe('he');
	});

	it('re-activation while a create is in flight persists the orphaned text', () => {
		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true);
		virtualBlock.setText(ROOT_ID, 'hel', [], true);

		virtualBlock.activate(ROOT_ID, false);
		completeCreate('real1');

		// The stale create must not attach to the new placeholder…
		expect(virtualBlock.realId).toBe('');
		// …but the text typed after the create was sent is not lost
		expect(g.U.Data.blockSetText).toHaveBeenCalledWith(ROOT_ID, 'real1', 'hel', [], true);
	});

	it('stale focus calls against the virtual id resolve to the real block', () => {
		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true);
		completeCreate('real1');

		g.C.BlockSetCarriage.mockClear();
		focus.set(VIRTUAL_ID, { from: 1, to: 1 });

		expect(focus.state.focused).toBe('real1');
		expect(g.C.BlockSetCarriage).toHaveBeenCalledWith(ROOT_ID, 'real1', { from: 1, to: 1 });
	});

	it('deactivation fully resets the placeholder state', () => {
		virtualBlock.activate(ROOT_ID, false);
		virtualBlock.setText(ROOT_ID, 'h', [], true);
		completeCreate('real1');

		virtualBlock.deactivate();

		expect(virtualBlock.isActive).toBe(false);
		expect(virtualBlock.realId).toBe('');
		expect(virtualBlock.resolve(VIRTUAL_ID)).toBe(VIRTUAL_ID);
		expect(virtualBlock.getBlock()).toBe(null);
	});

});

describe('virtualBlock: empty-block identity fork (BlockReplace)', () => {

	it('only empty, childless, non-system text blocks outside tables are eligible', () => {
		const empty = makeBlock('f-empty');
		const filled = makeBlock('f-filled', { content: { text: 'hi' } });
		const title = makeBlock('f-title', { content: { style: I.TextStyle.Title } });
		const description = makeBlock('f-desc', { content: { style: I.TextStyle.Description } });
		const parent = makeBlock('f-parent', { content: { style: I.TextStyle.Toggle } });
		const cell = makeBlock('f-cell');

		storeChildren.set('f-parent', [ 'f-child' ]);
		insideTable.add('f-cell');

		expect(virtualBlock.shouldFork(ROOT_ID, empty, 'h')).toBe(true);
		expect(virtualBlock.shouldFork(ROOT_ID, empty, '')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, filled, 'h')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, title, 'h')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, description, 'h')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, parent, 'h')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, cell, 'h')).toBe(false);
	});

	it('first content sends exactly one BlockReplace carrying the content and the prior properties', () => {
		const block = makeBlock('f-old1', {
			bgColor: 'red',
			content: { style: I.TextStyle.Checkbox, checked: true, color: 'blue' },
		});

		focus.state = { focused: 'f-old1', range: { from: 0, to: 0 } };
		virtualBlock.fork(ROOT_ID, block, 'h', [], undefined);

		expect(replaceCalls.length).toBe(1);
		expect(replaceCalls[0].rootId).toBe(ROOT_ID);
		expect(replaceCalls[0].blockId).toBe('f-old1');
		expect(replaceCalls[0].param.content.text).toBe('h');
		expect(replaceCalls[0].param.content.style).toBe(I.TextStyle.Checkbox);
		expect(replaceCalls[0].param.content.checked).toBe(true);
		expect(replaceCalls[0].param.content.color).toBe('blue');
		expect(replaceCalls[0].param.bgColor).toBe('red');

		completeReplace('f-new1');

		// No BlockTextSetText was needed — the replace carried the content
		expect(g.U.Data.blockSetText).not.toHaveBeenCalled();
		expect(virtualBlock.isForkPending('f-old1')).toBe(false);
		expect(virtualBlock.resolve('f-old1')).toBe('f-new1');
		expect(focus.state.focused).toBe('f-new1');
		expect(focus.state.range).toEqual({ from: 1, to: 1 });
	});

	it('writes and callbacks issued while the fork is in flight land on the new id', () => {
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		const block = makeBlock('f-old2');

		virtualBlock.fork(ROOT_ID, block, 'h', [], cb1);

		expect(virtualBlock.isForkPending('f-old2')).toBe(true);

		virtualBlock.forkSetText('f-old2', 'he', [], cb2);
		completeReplace('f-new2');

		expect(replaceCalls.length).toBe(1);
		expect(g.U.Data.blockSetText).toHaveBeenCalledWith(ROOT_ID, 'f-new2', 'he', [], true);
		expect(cb1).toHaveBeenCalledWith(expect.objectContaining({ blockId: 'f-new2' }));
		expect(cb2).toHaveBeenCalledWith(expect.objectContaining({ blockId: 'f-new2' }));
	});

	it('undo restores the old identity: the fork mapping stops resolving', () => {
		const block = makeBlock('f-old3');

		virtualBlock.fork(ROOT_ID, block, 'h', [], undefined);
		completeReplace('f-new3');

		expect(virtualBlock.resolve('f-old3')).toBe('f-new3');

		// Undo: old block comes back, new one is removed
		storeBlocks.delete('f-new3');
		makeBlock('f-old3');

		expect(virtualBlock.resolve('f-old3')).toBe('f-old3');
	});

	it('a rejected replace falls back to a plain write and disables forking for the block', () => {
		const cb = vi.fn();
		const block = makeBlock('f-old4');

		virtualBlock.fork(ROOT_ID, block, 'h', [], cb);
		completeReplace('', 1);

		expect(g.U.Data.blockSetText).toHaveBeenCalledWith(ROOT_ID, 'f-old4', 'h', [], true, expect.any(Function));
		expect(cb).toHaveBeenCalled();
		expect(virtualBlock.isForkPending('f-old4')).toBe(false);
		expect(virtualBlock.shouldFork(ROOT_ID, block, 'x')).toBe(false);
	});

	it('holds the fork during IME composition and sends the final text after it ends', () => {
		g.keyboard.isComposition = true;

		const block = makeBlock('f-old5');

		virtualBlock.fork(ROOT_ID, block, 'か', [], undefined);

		expect(replaceCalls.length).toBe(0);
		expect(compositionListeners.length).toBe(1);

		virtualBlock.forkSetText('f-old5', 'かき', []);

		g.keyboard.isComposition = false;
		compositionListeners[0]();

		expect(replaceCalls.length).toBe(1);
		expect(replaceCalls[0].param.content.text).toBe('かき');
	});

	it('a fork emptied while held sends nothing', () => {
		g.keyboard.isComposition = true;

		const cb = vi.fn();
		const block = makeBlock('f-old6');

		virtualBlock.fork(ROOT_ID, block, 'か', [], cb);
		virtualBlock.forkSetText('f-old6', '', []);

		g.keyboard.isComposition = false;
		compositionListeners[0]();

		expect(replaceCalls.length).toBe(0);
		expect(virtualBlock.isForkPending('f-old6')).toBe(false);
		expect(cb).toHaveBeenCalled();
	});

});
