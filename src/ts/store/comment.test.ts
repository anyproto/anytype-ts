import { describe, expect, it, beforeEach } from 'vitest';
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

describe('CommentStore', () => {

	beforeEach(() => {
		Comment.clearAll();
	});

	it('loads a discussion with replies to replies in their top-level post\'s thread', () => {
		Comment.load(SUB, [
			msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1'), msg('p2', '04'), msg('r3', '05', 'r2'),
		]);

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2', 'r3' ]);
		expect(Comment.getReplies('r1')).toEqual([]);
	});

	it('inserts a live reply to a reply into the existing thread list', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);
		const before = Comment.getReplies('p1');

		Comment.insert(SUB, msg('r2', '03', 'r1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
		expect(Comment.getReplies('p1')).toBe(before);
	});

	it('inserts a late older message at its ordered position', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('p3', '05') ]);

		Comment.insert(SUB, msg('p2', '03'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1', 'p2', 'p3' ]);
	});

	it('inserts into a discussion that was not loaded yet', () => {
		Comment.insert(SUB, msg('p1', '01'));
		Comment.insert(SUB, msg('r1', '02', 'p1'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
	});

	it('ignores a message it already holds', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.insert(SUB, msg('r1', '02', 'p1'));
		Comment.insert(SUB, msg('p1', '01'));

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
	});

	it('shows a reply that arrived before its parent once the parent arrives', () => {
		Comment.load(SUB, [ msg('p1', '01') ]);

		Comment.insert(SUB, msg('r2', '03', 'r1'));
		expect(Comment.getReplies('p1')).toEqual([]);
		Comment.insert(SUB, msg('r1', '02', 'p1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
	});

	it('updates a reply by id, whatever it replies to', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1') ]);
		const reactions = [ { icon: '👍', authors: [ 'bob' ] } ];

		Comment.update(SUB, { id: 'r2', reactions, modifiedAt: 7 });

		expect(Comment.getById(SUB, 'r2').reactions).toEqual(reactions);
		expect(Comment.getById(SUB, 'r2').modifiedAt).toBe(7);
	});

	it('marks a comment deleted in place and keeps its replies', () => {
		Comment.load(SUB, [
			msg('p1', '01', '', { modifiedAt: 5, attachments: [ { target: 'file1', type: I.AttachmentType.File } ], reactions: [ { icon: '👍', authors: [ 'bob' ] } ] }),
			msg('r1', '02', 'p1'),
		]);

		Comment.markDeleted(SUB, 'p1');

		const got = Comment.getById(SUB, 'p1');
		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p1' ]);
		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1' ]);
		expect(got.isDeleted).toBe(true);
		expect(got.modifiedAt).toBe(0);
		expect(got.content.parts).toEqual([]);
		expect(got.attachments).toEqual([]);
		expect(got.reactions).toEqual([]);
	});

	it('removes a hard-deleted reply and keeps placing its later replies in the thread', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.remove(SUB, 'r1');
		Comment.insert(SUB, msg('r2', '03', 'r1'));

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r2' ]);
		expect(Comment.getById(SUB, 'r1')).toBeUndefined();
	});

	it('removes a hard-deleted post', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('p2', '02') ]);

		Comment.remove(SUB, 'p1');

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p2' ]);
	});

	it('sets read status on posts and replies by id', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1'), msg('r2', '03', 'r1') ]);

		Comment.setReadMessageStatus(SUB, [ 'p1', 'r2' ], true);

		expect(Comment.getById(SUB, 'p1').isReadMessage).toBe(true);
		expect(Comment.getById(SUB, 'r1').isReadMessage).toBe(false);
		expect(Comment.getById(SUB, 'r2').isReadMessage).toBe(true);
	});

	it('clears a discussion with its threads and index', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.clear(SUB);

		expect(Comment.getPosts(SUB)).toEqual([]);
		expect(Comment.getReplies('p1')).toEqual([]);
		expect(Comment.getById(SUB, 'p1')).toBeUndefined();
	});

	it('keeps a live message that arrived while the discussion was loading', () => {
		Comment.insert(SUB, msg('r2', '03', 'r1'));

		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		expect(ids(Comment.getReplies('p1'))).toEqual([ 'r1', 'r2' ]);
	});

	it('takes the loaded copy of a message it already held', () => {
		Comment.insert(SUB, msg('p1', '01'));

		Comment.load(SUB, [ msg('p1', '01', '', { isDeleted: true }) ]);

		expect(Comment.getById(SUB, 'p1').isDeleted).toBe(true);
	});

	it('starts from scratch when a discussion is loaded again after unsubscribing', () => {
		Comment.load(SUB, [ msg('p1', '01'), msg('r1', '02', 'p1') ]);

		Comment.clear(SUB);
		Comment.load(SUB, [ msg('p2', '03') ]);

		expect(ids(Comment.getPosts(SUB))).toEqual([ 'p2' ]);
		expect(Comment.getReplies('p1')).toEqual([]);
		expect(Comment.getById(SUB, 'r1')).toBeUndefined();
	});

});
