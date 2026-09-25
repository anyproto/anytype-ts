import { describe, expect, it } from 'vitest';
import { activityGaps } from './timeline';
import { ActivityGroup } from './model';

const messages = [ { id: 'm2', orderId: '002' }, { id: 'm4', orderId: '004' } ];
const group = (id: string, before?: string, after?: string): ActivityGroup => ({
	id, before: before ? { id: `m${Number(before)}`, orderId: before } : undefined,
	after: after ? { id: `m${Number(after)}`, orderId: after } : undefined,
	sealed: !!after, itemIds: [], createdAt: 100, expanded: false,
});

describe('activity timeline gaps', () => {
	it('places activities between loaded anchors and at the live tail', () => {
		const gaps = activityGaps([ group('a', '002', '004'), group('b', '004') ], messages, false, true);
		expect(gaps.get('m4').map(it => it.id)).toEqual([ 'a' ]);
		expect(gaps.get('').map(it => it.id)).toEqual([ 'b' ]);
	});
	it('keeps off-window history out of the current page', () => {
		const gaps = activityGaps([ group('old', '001'), group('new', '005') ], messages, false, false);
		expect(gaps.size).toBe(0);
	});
	it('preserves separated groups after deleted anchors and renders activity in an empty chat', () => {
		const groups = [ group('a', '002', '003'), group('b', '003', '004') ];
		expect(activityGaps(groups, messages, true, true).get('m4').map(it => it.id)).toEqual([ 'a', 'b' ]);
		expect(activityGaps(groups, [], true, true).get('')).toHaveLength(2);
	});
	it('shows the gap before a loaded following anchor even if the preceding message is paged out', () => {
		expect(activityGaps([ group('a', '001', '002') ], messages, false, false).get('m2')).toHaveLength(1);
	});
});
