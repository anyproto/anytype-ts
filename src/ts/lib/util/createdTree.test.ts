import { describe, it, expect } from 'vitest';
import { buildCreatedForest, isSameForest, CreatedForest, CreatedTreeNode } from './createdTree';

const node = (id: string, contextId = '', links: string[] = [], canParent = true): CreatedTreeNode => ({ id, contextId, links, canParent });
const children = (forest: CreatedForest, id: string) => forest.childrenOf.get(id) || [];

describe('buildCreatedForest', () => {

	it('nests a child under the object it was created in and still linked from', () => {
		const forest = buildCreatedForest([
			node('A', '', [ 'B' ]),
			node('B', 'A'),
		]);

		expect(forest.roots).toEqual([ 'A' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
	});

	it('builds multi-level chains with only the top node as root', () => {
		const forest = buildCreatedForest([
			node('A', '', [ 'B' ]),
			node('B', 'A', [ 'C' ]),
			node('C', 'B'),
		]);

		expect(forest.roots).toEqual([ 'A' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
	});

	it('does not show a standalone object without children as a root', () => {
		const forest = buildCreatedForest([
			node('A', '', [ 'X' ]),
		]);

		expect(forest.roots).toEqual([]);
	});

	it('drops a child whose parent no longer links to it', () => {
		const forest = buildCreatedForest([
			node('A', '', [ 'C' ]),
			node('B', 'A'),
			node('C', 'A'),
		]);

		expect(children(forest, 'A')).toEqual([ 'C' ]);
		expect(forest.roots).toEqual([ 'A' ]);
	});

	it('promotes an unlinked child to root when it has children of its own', () => {
		const forest = buildCreatedForest([
			node('A', '', []),
			node('B', 'A', [ 'C' ]),
			node('C', 'B'),
		]);

		expect(forest.roots).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
		expect(forest.childrenOf.has('A')).toBe(false);
	});

	it('treats a parent missing from the input (archived, deleted, other space) as no parent', () => {
		const forest = buildCreatedForest([
			node('B', 'GONE', [ 'C' ]),
			node('C', 'B'),
			node('D', 'GONE'),
		]);

		expect(forest.roots).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
		expect(forest.roots).not.toContain('D');
	});

	it('never uses an object that cannot parent (chat, discussion, excluded layout) as a parent', () => {
		const forest = buildCreatedForest([
			node('CHAT', '', [ 'B' ], false),
			node('B', 'CHAT', [ 'C' ]),
			node('C', 'B'),
			node('D', 'CHAT'),
		]);

		expect(forest.childrenOf.has('CHAT')).toBe(false);
		expect(forest.roots).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
	});

	it('ignores a self-reference', () => {
		const forest = buildCreatedForest([
			node('A', 'A', [ 'A', 'B' ]),
			node('B', 'A'),
		]);

		expect(forest.roots).toEqual([ 'A' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
	});

	it('breaks a 2-cycle at the lowest id without losing nodes', () => {
		const forest = buildCreatedForest([
			node('B', 'A', [ 'A' ]),
			node('A', 'B', [ 'B' ]),
		]);

		expect(forest.roots).toEqual([ 'A' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([]);
	});

	it('breaks a 3-cycle reached from a node outside it', () => {
		const forest = buildCreatedForest([
			node('X', 'C'),
			node('C', 'B', [ 'A', 'X' ]),
			node('B', 'A', [ 'C' ]),
			node('A', 'C', [ 'B' ]),
		]);

		expect(forest.roots).toEqual([ 'A' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
		expect(children(forest, 'C')).toEqual([ 'X' ]);
	});

	it('breaks a cycle at its own lowest id even when the chain leading into it has a lower id', () => {
		const forest = buildCreatedForest([
			node('A', 'C'),
			node('B', 'C', [ 'C' ]),
			node('C', 'B', [ 'A', 'B' ]),
		]);

		expect(forest.roots).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'C' ]);
		expect(children(forest, 'C')).toEqual([ 'A' ]);
	});

	it('breaks every cycle when there are several', () => {
		const forest = buildCreatedForest([
			node('A', 'B', [ 'B' ]),
			node('B', 'A', [ 'A' ]),
			node('C', 'D', [ 'D' ]),
			node('D', 'C', [ 'C' ]),
		]);

		expect(forest.roots).toEqual([ 'A', 'C' ]);
		expect(children(forest, 'A')).toEqual([ 'B' ]);
		expect(children(forest, 'C')).toEqual([ 'D' ]);
	});

	it('detects cycles after the link rule, so a cycle the links break keeps both nodes', () => {
		const forest = buildCreatedForest([
			node('A', 'B', []),
			node('B', 'A', [ 'A' ]),
		]);

		expect(forest.roots).toEqual([ 'B' ]);
		expect(children(forest, 'B')).toEqual([ 'A' ]);
	});

	it('handles empty input, empty entries and missing links', () => {
		expect(buildCreatedForest([]).roots).toEqual([]);

		const forest = buildCreatedForest([
			null,
			{ id: 'A', contextId: '', links: undefined, canParent: true },
			{ id: '', contextId: 'A', links: [], canParent: true },
			node('B', 'A'),
		]);

		expect(forest.roots).toEqual([]);
		expect(forest.childrenOf.size).toBe(0);
	});

	it('walks a very deep chain without recursion', () => {
		const depth = 100000;
		const nodes = [];

		for (let i = 0; i < depth; i++) {
			const id = `n${i}`;
			const next = `n${i + 1}`;

			nodes.push(node(id, i ? `n${i - 1}` : '', (i < depth - 1) ? [ next ] : []));
		};

		const forest = buildCreatedForest(nodes);

		expect(forest.roots).toEqual([ 'n0' ]);
		expect(children(forest, `n${depth - 2}`)).toEqual([ `n${depth - 1}` ]);
	});

	it('orders children by the parent links, skipping links to non-children and duplicates', () => {
		const forest = buildCreatedForest([
			node('A', '', [ 'L1', 'C3', 'C1', 'L2', 'C3', 'C2' ]),
			node('C1', 'A'),
			node('C2', 'A'),
			node('C3', 'A'),
		]);

		expect(children(forest, 'A')).toEqual([ 'C3', 'C1', 'C2' ]);
	});

	it('treats collection membership in links like any other link', () => {
		const forest = buildCreatedForest([
			node('COLLECTION', '', [ 'R2', 'R1' ]),
			node('R1', 'COLLECTION'),
			node('R2', 'COLLECTION'),
			node('R3', 'COLLECTION'),
		]);

		expect(children(forest, 'COLLECTION')).toEqual([ 'R2', 'R1' ]);
	});

	it('keeps roots in input order and ignores duplicate input nodes', () => {
		const forest = buildCreatedForest([
			node('P2', '', [ 'B' ]),
			node('P1', '', [ 'A' ]),
			node('A', 'P1'),
			node('B', 'P2'),
			node('A', 'P2'),
		]);

		expect(forest.roots).toEqual([ 'P2', 'P1' ]);
		expect(children(forest, 'P1')).toEqual([ 'A' ]);
	});

});

describe('isSameForest', () => {

	const build = (links: string[]) => buildCreatedForest([
		node('A', '', links),
		node('B', 'A'),
		node('C', 'A'),
	]);

	it('treats equal structure as the same forest', () => {
		expect(isSameForest(build([ 'B', 'C' ]), build([ 'B', 'C' ]))).toBe(true);
	});

	it('sees a change in child order', () => {
		expect(isSameForest(build([ 'B', 'C' ]), build([ 'C', 'B' ]))).toBe(false);
	});

	it('sees a removed child and a changed root list', () => {
		expect(isSameForest(build([ 'B', 'C' ]), build([ 'B' ]))).toBe(false);
		expect(isSameForest(build([ 'B' ]), build([]))).toBe(false);
	});

});
