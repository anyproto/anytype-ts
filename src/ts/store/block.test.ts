import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Block as BlockStore } from 'Store/block';
import Block from 'Model/block';
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
		(globalThis as any).U = {
			Common: {
				objectCopy: (o: any) => JSON.parse(JSON.stringify(typeof o === 'undefined' ? {} : o)),
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

});
