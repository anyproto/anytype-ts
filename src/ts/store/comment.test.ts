import { describe, expect, it, beforeEach } from 'vitest';
import { autorun } from 'mobx';
import * as I from 'Interface';
import { Comment } from './comment';

const SUB = 'comment-sub';

const msg = (id: string, orderId: string, replyToMessageId = '', extra: Partial<I.CommentMessage> = {}): I.CommentMessage => ({
	id,
	orderId,
	replyToMessageId,
	creator: 'alice',
	createdAt: 1,
	modifiedAt: 0,
	content: { text: '', style: I.TextStyle.Paragraph, marks: [], parts: [ { style: I.TextStyle.Paragraph, type: I.BlockType.Text, text: id, marks: [] } ] },
	attachments: [],
	reactions: [],
	isSynced: true,
	isReadMessage: false,
	isReadMention: false,
	isDeleted: false,
	...extra,
});

const ids = (list: I.CommentMessage[]) => list.map(it => it.id);

// Subscribes and loads in one go, as the section does once every page is fetched
const loaded = (list: I.CommentMessage[]) => Comment.load(SUB, list, Comment.startLoad(SUB));

describe('CommentStore', () => {

	beforeEach(() => {
		Comment.clearAll();
	});

	it('loads a discussion with replies to replies in their top-level post\'s thread', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1'), msg('p2', '04'), msg('r3', '05', 'r2') ]);

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2', 'r3' ]);
		expect(Comment.getReplies('r1')).toEqual([]);
	});

	it('looks up the same instance it renders', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r1', '02', 'p1') ]);

		expect(Comment.getById(SUB, 'p1')).toBe(Comment.getPosts(SUB)[0]);
		expect(Comment.getById(SUB, 'r1')).toBe(Comment.getReplies('p1')[0]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
	});

	it('inserts a live reply to a reply into the existing thread list', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1') ]);
		const before = Comment.getReplies('p1');

		Comment.insert(SUB, msg('r2', '03', 'r1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
		expect(Comment.getReplies('p1')).toBe(before);
	});

	it('inserts a late older message at its ordered position', () => {
		loaded([ msg('p1', '01'), msg('p3', '05') ]);

		Comment.insert(SUB, msg('p2', '03'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2', 'p3' ]);
	});

	it('puts an own message without an order id last, and moves it when its order id arrives', () => {
		// ChatAddMessage answers with the id only; the ChatAdd event carries the order id
		loaded([ msg('p1', '01'), msg('p3', '05') ]);

		Comment.insert(SUB, msg('mine', ''));
		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p3', 'mine' ]);

		Comment.insert(SUB, msg('mine', '03'));
		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'mine', 'p3' ]);
		expect(Comment.getById(SUB, 'mine').orderId).toBe('03');
	});

	it('takes the order id of an own reply from its ChatAdd event', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.insert(SUB, msg('mine', '', 'p1'));
		Comment.insert(SUB, msg('mine', '03', 'p1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'mine' ]);
		expect(Comment.getById(SUB, 'mine').orderId).toBe('03');
	});

	it('inserts into a discussion whose pages are still loading', () => {
		Comment.startLoad(SUB);

		Comment.insert(SUB, msg('p1', '01'));
		Comment.insert(SUB, msg('r1', '02', 'p1'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
	});

	it('ignores events for a discussion nobody is subscribed to', () => {
		Comment.insert(SUB, msg('p1', '01'));

		expect(Comment.getPosts(SUB)).toEqual([]);
		expect(Comment.getById(SUB, 'p1')).toBeUndefined();
	});

	it('ignores a message it already holds', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.insert(SUB, msg('r1', '02', 'p1'));
		Comment.insert(SUB, msg('p1', '01'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
	});

	it('shows a reply that arrived before its parent once the parent arrives', () => {
		loaded([ msg('p1', '01') ]);

		Comment.insert(SUB, msg('r2', '03', 'r1'));
		expect(Comment.getReplies('p1')).toEqual([]);
		Comment.insert(SUB, msg('r1', '02', 'p1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
	});

	it('updates a reply by id, whatever it replies to', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1') ]);
		const reactions = [ { icon: '👍', authors: [ 'bob' ] } ];

		Comment.update(SUB, { id: 'r2', reactions, modifiedAt: 7 });

		expect(Comment.getById(SUB, 'r2').reactions).toEqual(reactions);
		expect(Comment.getById(SUB, 'r2').modifiedAt).toBe(7);
	});

	it('marks a comment deleted in place, read, and keeps its replies', () => {
		loaded([
			msg('p1', '01', '', { modifiedAt: 5, attachments: [ { target: 'file1', type: I.AttachmentType.File } ], reactions: [ { icon: '👍', authors: [ 'bob' ] } ] }),
			msg('r1', '02', 'p1'),
		]);

		Comment.markDeleted(SUB, 'p1');

		const got = Comment.getById(SUB, 'p1');
		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
		expect(got.isDeleted).toBe(true);
		expect(got.isReadMessage).toBe(true);
		expect(got.isReadMention).toBe(true);
		expect(got.modifiedAt).toBe(0);
		expect(got.content.parts).toEqual([]);
		expect(got.attachments).toEqual([]);
		expect(got.reactions).toEqual([]);
	});

	it('removes a hard-deleted reply and keeps placing its later replies in the thread', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.remove(SUB, 'r1');
		Comment.insert(SUB, msg('r2', '03', 'r1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r2' ]);
		expect(Comment.getById(SUB, 'r1')).toBeUndefined();
	});

	it('removes a hard-deleted post', () => {
		loaded([ msg('p1', '01'), msg('p2', '02') ]);

		Comment.remove(SUB, 'p1');

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p2' ]);
	});

	it('removes a message still waiting for its parent', () => {
		loaded([ msg('p1', '01') ]);
		Comment.insert(SUB, msg('r2', '03', 'r1'));

		Comment.remove(SUB, 'r2');
		Comment.insert(SUB, msg('r1', '02', 'p1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
		expect(Comment.getById(SUB, 'r2')).toBeUndefined();
	});

	it('sets read status on posts and replies by id', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1') ]);

		Comment.setReadMessageStatus(SUB, [ 'p1', 'r2' ], true);

		expect(Comment.getById(SUB, 'p1').isReadMessage).toBe(true);
		expect(Comment.getById(SUB, 'r1').isReadMessage).toBe(false);
		expect(Comment.getById(SUB, 'r2').isReadMessage).toBe(true);
	});

	it('clears a discussion with its threads and index', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.clear(SUB);

		expect(Comment.getPosts(SUB)).toEqual([]);
		expect(Comment.getReplies('p1')).toEqual([]);
		expect(Comment.getById(SUB, 'p1')).toBeUndefined();
	});

	it('resolves a message to its thread root, and re-runs observers when the layout changes', () => {
		loaded([ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1') ]);

		const roots: (string | undefined)[] = [];
		const dispose = autorun(() => roots.push(Comment.getThreadRoot(SUB, 'r4')));

		expect(Comment.getThreadRoot(SUB, 'p1')).toBe('p1');
		expect(Comment.getThreadRoot(SUB, 'r2')).toBe('p1');
		expect(Comment.getThreadRoot(SUB, 'missing')).toBeUndefined();
		expect(Comment.getThreadRoot(SUB, '')).toBeUndefined();

		// A reply whose parent has not arrived yet is stored but not placed
		Comment.insert(SUB, msg('r4', '05', 'r3'));
		expect(roots[roots.length - 1]).toBeUndefined();
		Comment.insert(SUB, msg('r3', '04', 'r2'));
		expect(roots[roots.length - 1]).toBe('p1');

		Comment.remove(SUB, 'r4');
		expect(roots[roots.length - 1]).toBeUndefined();
		dispose();
	});

	describe('while the pages are loading', () => {

		it('keeps a live message that is missing from the pages', () => {
			const token = Comment.startLoad(SUB);
			Comment.insert(SUB, msg('r2', '03', 'r1'));

			Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ], token);

			expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
		});

		it('keeps an own message without an orderId last until its ChatAdd event', () => {
			const token = Comment.startLoad(SUB);
			Comment.insert(SUB, msg('mine', ''));

			Comment.load(SUB, [ msg('p1', '01'), msg('p2', '02') ], token);
			expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2', 'mine' ]);

			Comment.insert(SUB, msg('mine', '03'));
			expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2', 'mine' ]);
			expect(Comment.getById(SUB, 'mine').orderId).toBe('03');
		});

		it('applies a deletion of a message the pages hold in an older state', () => {
			const token = Comment.startLoad(SUB);
			Comment.update(SUB, { id: 'p1', isDeleted: true, content: { text: '', style: I.TextStyle.Paragraph, marks: [], parts: [] } });

			Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ], token);

			expect(Comment.getById(SUB, 'p1').isDeleted).toBe(true);
			expect(Comment.getById(SUB, 'p1').content.parts).toEqual([]);
		});

		it('applies an update made to a live message after the pages were fetched', () => {
			const token = Comment.startLoad(SUB);
			Comment.insert(SUB, msg('p1', '01'));
			const reactions = [ { icon: '👍', authors: [ 'bob' ] } ];
			Comment.update(SUB, { id: 'p1', reactions });

			Comment.load(SUB, [ msg('p1', '01') ], token);

			expect(Comment.getById(SUB, 'p1').reactions).toEqual(reactions);
		});

		it('applies read statuses and removals in the order they came', () => {
			const token = Comment.startLoad(SUB);
			Comment.setReadMessageStatus(SUB, [ 'p1' ], true);
			Comment.remove(SUB, 'p2');

			Comment.load(SUB, [ msg('p1', '01'), msg('p2', '02') ], token);

			expect(Comment.getById(SUB, 'p1').isReadMessage).toBe(true);
			expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		});

		it('stops recording once loaded', () => {
			loaded([ msg('p1', '01') ]);
			Comment.update(SUB, { id: 'p1', modifiedAt: 9 });

			expect(Comment.getById(SUB, 'p1').modifiedAt).toBe(9);
		});

	});

	describe('a load that finishes late', () => {

		it('does nothing after the discussion was closed', () => {
			const token = Comment.startLoad(SUB);
			Comment.clear(SUB);

			Comment.load(SUB, [ msg('p1', '01') ], token);

			expect(Comment.getPosts(SUB)).toEqual([]);
			expect(Comment.getById(SUB, 'p1')).toBeUndefined();
		});

		it('does nothing after the discussion was opened again', () => {
			const stale = Comment.startLoad(SUB);
			Comment.clear(SUB);
			const fresh = Comment.startLoad(SUB);

			Comment.load(SUB, [ msg('p2', '02') ], fresh);
			Comment.load(SUB, [ msg('p1', '01') ], stale);

			expect(ids(Comment.getPosts(SUB))).toEqual([ 'p2' ]);
			expect(Comment.getById(SUB, 'p1')).toBeUndefined();
		});

	});

});
