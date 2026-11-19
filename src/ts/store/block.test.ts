import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Block as BlockStore } from 'Store/block';
import { Detail as DetailStore } from 'Store/detail';
import Block from 'Model/block';
import Mark from 'Lib/mark';
import * as I from 'Interface';

const ROOT = 'root';

// Mirrors a real document: the middleware wraps top-level blocks into layout Div blocks and sends
// blocks in breadth-first order, so nested list items arrive long after their parents.
const STRUCTURE: [ string, string[] ][] = [
	[ ROOT, [ 'header', 'divA', 'divB', 'divC' ] ],
	[ 'header', [ 'title', 'featuredRelations' ] ],
	[ 'divA', [ 'a1', 'a2' ] ],
	[ 'divB', [ 'collections', 'views', 'queries', 'general', 'search' ] ],
	[ 'divC', [ 'c1' ] ],
	[ 'title', [] ],
	[ 'featuredRelations', [] ],
	[ 'a1', [] ],
	[ 'a2', [] ],
	[ 'collections', [] ],
	[ 'views', [ 'sorts', 'filters', 'layouts' ] ],
	[ 'queries', [ 'autocollect' ] ],
	[ 'general', [] ],
	[ 'search', [] ],
	[ 'c1', [] ],
	[ 'sorts', [] ],
	[ 'filters', [] ],
	[ 'layouts', [ 'grid', 'board' ] ],
	[ 'autocollect', [] ],
	[ 'grid', [] ],
	[ 'board', [] ],
];

const DOCUMENT_ORDER = [
	'header', 'title', 'featuredRelations',
	'divA', 'a1', 'a2',
	'divB', 'collections', 'views', 'sorts', 'filters', 'layouts', 'grid', 'board', 'queries', 'autocollect', 'general', 'search',
	'divC', 'c1',
];

const makeBlock = (id: string, childrenIds: string[]): Block => {
	const isLayout = (id == 'header') || id.startsWith('div');

	return new Block({
		id,
		parentId: '',
		type: (id == ROOT) ? I.BlockType.Page : (isLayout ? I.BlockType.Layout : I.BlockType.Text),
		childrenIds,
		hAlign: I.BlockHAlign.Left,
		vAlign: I.BlockVAlign.Top,
		bgColor: '',
		fields: {},
		content: isLayout ? { style: I.LayoutStyle.Div } : { style: I.TextStyle.Paragraph, text: id },
	});
};

describe('BlockStore tree helpers', () => {

	beforeAll(() => {
		// U is an auto-import global in the app bundle; the store only needs objectCopy here
		(globalThis as any).J = {
			Constant: {
				missingObjectId: '_missing_object',
				limit: { string: { mention: 128 } },
			},
		};
		(globalThis as any).translate = () => 'Untitled';
		(globalThis as any).Relation = {
			getStringValue: (v: any) => String(v || ''),
		};
		(globalThis as any).Mark = Mark;
		(globalThis as any).S = { Detail: DetailStore, Block: BlockStore };
		(globalThis as any).U = {
			Common: {
				objectCopy: (o: any) => JSON.parse(JSON.stringify(typeof o === 'undefined' ? {} : o)),
			},
			Object: {
				name: (obj: any) => String(obj?.name || obj?.snippet || 'Untitled'),
				defaultName: () => 'Untitled',
				isRelationLayout: () => false,
				isTypeLayout: () => false,
				isSpaceViewLayout: () => false,
				isInFileLayouts: () => false,
			},
			String: {
				insert: (s: string, ins: string, from: number, to: number) => s.substring(0, from) + ins + s.substring(to),
				shorten: (s: string) => String(s || ''),
			},
		};
	});

	beforeEach(() => {
		BlockStore.clear(ROOT);
		BlockStore.set(ROOT, STRUCTURE.map(([ id, childrenIds ]) => makeBlock(id, childrenIds)));
		BlockStore.setStructure(ROOT, STRUCTURE.map(([ id, childrenIds ]) => ({ id, childrenIds })));
		BlockStore.updateStructureParents(ROOT);
	});

	describe('getTree', () => {
		it('builds the full depth of nested children', () => {
			const tree = BlockStore.getTree(ROOT, BlockStore.getChildren(ROOT, ROOT));
			const divB = tree.find(it => it.id == 'divB');
			const views = divB.childBlocks.find(it => it.id == 'views');
			const layouts = views.childBlocks.find(it => it.id == 'layouts');

			expect(views.childBlocks.map(it => it.id)).toEqual([ 'sorts', 'filters', 'layouts' ]);
			expect(layouts.childBlocks.map(it => it.id)).toEqual([ 'grid', 'board' ]);
		});

		it('does not mutate the store blocks', () => {
			BlockStore.getTree(ROOT, BlockStore.getChildren(ROOT, ROOT));

			expect((BlockStore.getLeaf(ROOT, 'views') as any).childBlocks).toBeUndefined();
		});
	});

	describe('getTreeList', () => {
		it('returns every block once, in document order, without the root', () => {
			const ids = BlockStore.getTreeList(ROOT).map(it => it.id);

			expect(ids).toEqual(DOCUMENT_ORDER);
		});

		it('slices a range of top-level blocks together with their nested children', () => {
			const ids = BlockStore.getTreeList(ROOT).map(it => it.id);
			const slice = ids.slice(ids.indexOf('collections'), ids.indexOf('search') + 1);

			expect(slice).toEqual([ 'collections', 'views', 'sorts', 'filters', 'layouts', 'grid', 'board', 'queries', 'autocollect', 'general', 'search' ]);
		});

		it('slices from a top-level block to a nested block without leaking unrelated blocks', () => {
			const ids = BlockStore.getTreeList(ROOT).map(it => it.id);
			const slice = ids.slice(ids.indexOf('collections'), ids.indexOf('autocollect') + 1);

			expect(slice).toEqual([ 'collections', 'views', 'sorts', 'filters', 'layouts', 'grid', 'board', 'queries', 'autocollect' ]);
			expect(slice).not.toContain('header');
			expect(slice).not.toContain('featuredRelations');
			expect(slice).not.toContain('divA');
		});
	});

	describe('updateMarkup mention alias preservation', () => {
		it('preserves custom mention display text (alias) when object details arrive', () => {
			DetailStore.clear(ROOT);
			DetailStore.update(ROOT, { id: 'obj-victor', details: { id: 'obj-victor', name: 'Victor' } }, false);

			BlockStore.updateContent(ROOT, 'a1', {
				style: I.TextStyle.Paragraph,
				text: 'Hello Vic today',
				marks: [
					{ type: I.MarkType.Mention, param: 'obj-victor', range: { from: 6, to: 9 } },
				],
			});
			BlockStore.updateMarkup(ROOT);

			const updated = BlockStore.getLeaf(ROOT, 'a1');
			expect(updated.getText()).toBe('Hello Vic today');
			expect(updated.content.marks[0].range).toEqual({ from: 6, to: 9 });
		});

		it('still updates standard mentions when the target object is renamed', () => {
			DetailStore.clear(ROOT);
			DetailStore.update(ROOT, { id: 'obj-victor', details: { id: 'obj-victor', name: 'Victor' } }, false);

			BlockStore.updateContent(ROOT, 'a1', {
				style: I.TextStyle.Paragraph,
				text: 'Hello Victor today',
				marks: [
					{ type: I.MarkType.Mention, param: 'obj-victor', range: { from: 6, to: 12 } },
				],
			});

			// Rename Victor -> Victor Hugo
			DetailStore.update(ROOT, { id: 'obj-victor', details: { id: 'obj-victor', name: 'Victor Hugo' } }, false);
			BlockStore.updateMarkup(ROOT);

			const updated = BlockStore.getLeaf(ROOT, 'a1');
			expect(updated.getText()).toBe('Hello Victor Hugo today');
			expect(updated.content.marks[0].range).toEqual({ from: 6, to: 17 });
		});
	});

});
