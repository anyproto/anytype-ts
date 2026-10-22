import { describe, expect, it } from 'vitest';
import { ChatStatusJournal, decodeStatus, STATUS_TTL } from './model';
import { jsonField, jsonMetadata, jsonStringify, parseJson } from './json';

const scope = { accountId: 'account', spaceId: 'space', chatId: 'chat' };
const status = (journal: ChatStatusJournal, data: unknown, text: unknown = 'Working', now = 100, identity = 'agent') => {
	return journal.status(identity, decodeStatus(JSON.stringify({ text, data })), now);
};
const call = (id: string, phase = 'in_progress', extra = {}) => ({ tool_call_id: id, tool_name: 'web_search', status: phase, ...extra });

describe('chat activity journal', () => {
	it('updates the original item across messages, with stable count, position and disclosure', () => {
		const journal = new ChatStatusJournal(scope);
		journal.setTail({ id: 'm1', orderId: '001' });
		status(journal, call('a', 'in_progress', { query: 'trains' }));
		status(journal, call('b'));
		const first = Array.from(journal.items.values())[0];
		journal.expand('group', first.groupId, true);
		journal.expand('item', first.id, true);
		journal.message({ id: 'm2', orderId: '002' }, 'agent');
		status(journal, call('a', 'complete', { result: { matches: 3 } }), 'Found 3', 200);
		status(journal, call('c'), 'Next', 300);
		expect(journal.items.size).toBe(3);
		expect(journal.groups.size).toBe(2);
		expect(first).toMatchObject({ lifecycle: 'complete', text: 'Found 3', firstSeenAt: 100, expanded: true });
		expect(journal.groups.get(first.groupId)).toMatchObject({ sealed: true, expanded: true, after: { id: 'm2' } });
		expect(journal.groups.get(first.groupId).itemIds).toHaveLength(2);
		expect(jsonStringify(first.data)).toContain('"query":"trains"');
	});

	it('retains only structured updates and coalesces generic heartbeats without promoting text', () => {
		const journal = new ChatStatusJournal(scope);
		status(journal, undefined, 'A');
		status(journal, { query: 'B', cached: false }, 'B');
		status(journal, { cached: false, query: 'B' }, 'B', 101);
		expect(journal.items.size).toBe(1);
		status(journal, {}, 'C', 102);
		status(journal, { query: 'B', cached: false }, 'B', 103);
		expect(journal.items.size).toBe(2);
		expect(journal.groups.size).toBe(1);
		status(journal, { query: 'B', cached: false }, 'B', 104 + STATUS_TTL);
		expect(journal.items.size).toBe(3);
	});

	it('accepts terminal-first events and atomically replaces present results, including falsy values', () => {
		const journal = new ChatStatusJournal(scope);
		status(journal, call('a', 'complete', { result: { a: 1, b: 2 } }));
		const item = Array.from(journal.items.values())[0];
		for (const result of [ { b: 3 }, null, false, 0, '', [] ]) {
			status(journal, { tool_call_id: 'a', result });
			expect(jsonStringify(jsonField(item.data, 'result'))).toBe(JSON.stringify(result));
		};
		journal.status('agent', decodeStatus('{"data":{"tool_call_id":"a"}}'), 200);
		expect(item.text).toBeNull();
		expect(item.lifecycle).toBe('complete');
		expect(jsonStringify(jsonField(item.data, 'result'))).toBe('[]');
		expect(journal.items.size).toBe(1);
	});

	it('keeps explicit outcomes distinct from TTL, messages, results and late running events', () => {
		const journal = new ChatStatusJournal(scope);
		status(journal, call('a', 'in_progress', { result: 'partial' }));
		const item = Array.from(journal.items.values())[0];
		journal.message({ id: 'm1', orderId: '001' }, 'agent');
		journal.disconnect();
		expect(item).toMatchObject({ lifecycle: 'in_progress', fresh: false });
		status(journal, call('a', 'error'), 'Failed');
		expect(status(journal, call('a'), 'Old progress')).toBe(false);
		expect(status(journal, call('a', 'complete'), 'Conflicting final')).toBe(false);
		expect(item).toMatchObject({ lifecycle: 'error', text: 'Failed' });
		status(journal, { tool_call_id: 'a', result: { reason: 'timeout' } }, 'Failed');
		expect(jsonStringify(item.data)).toContain('timeout');
	});

	it('isolates publishers and does not infer lifecycle from generic fields', () => {
		const journal = new ChatStatusJournal(scope);
		status(journal, call('a'), 'A', 100, 'one');
		status(journal, call('a'), 'A', 100, 'two');
		status(journal, { status: 'complete', result: 1 });
		expect(journal.items.size).toBe(3);
		expect(Array.from(journal.items.values())[2].lifecycle).toBeUndefined();
	});

	it('ignores duplicate and historical message boundaries and keeps new calls apart after an observation gap', () => {
		const journal = new ChatStatusJournal(scope);
		journal.setTail({ id: 'm2', orderId: '002' });
		status(journal, call('a'));
		expect(journal.message({ id: 'm1', orderId: '001' }, 'agent')).toBe(false);
		expect(journal.message({ id: 'm2', orderId: '002' }, 'agent')).toBe(false);
		status(journal, call('b'));
		expect(journal.groups.size).toBe(1);
		journal.disconnect();
		status(journal, call('a', 'complete'));
		status(journal, call('c'));
		expect(journal.groups.size).toBe(2);
	});
});

describe('discussion activity journal', () => {
	const discussion = () => new ChatStatusJournal(scope, 'discussion');
	const reply = (journal: ChatStatusJournal, data: unknown, replyTo?: string, identity = 'agent', text = 'Working', now = 100) => {
		return journal.status(identity, decodeStatus(JSON.stringify({ text, data, reply_to: replyTo })), now);
	};
	const groupOf = (journal: ChatStatusJournal, id: string) => {
		const item = Array.from(journal.items.values()).find(it => it.toolCallId == id);
		return journal.groups.get(item.groupId);
	};

	it('decodes reply_to only as a non-empty string', () => {
		expect(decodeStatus('{"reply_to":"m1"}').replyTo).toBe('m1');
		expect(decodeStatus('{"reply_to":""}')).not.toHaveProperty('replyTo');
		expect(decodeStatus('{"reply_to":1}')).not.toHaveProperty('replyTo');
	});

	it('keeps one open group per publisher, sealed only by that publisher\'s comment', () => {
		const journal = discussion();
		reply(journal, call('a'), 'm1');
		reply(journal, call('x'), undefined, 'other');
		journal.message({ id: 'm2', orderId: '002' }, 'person');
		reply(journal, call('b'), 'm1');
		expect(groupOf(journal, 'a')).toBe(groupOf(journal, 'b'));
		expect(groupOf(journal, 'a')).toMatchObject({ sealed: false, publisherIdentity: 'agent', replyTo: 'm1' });
		expect(groupOf(journal, 'x')).toMatchObject({ publisherIdentity: 'other' });
		expect(groupOf(journal, 'x')).not.toHaveProperty('replyTo');

		journal.message({ id: 'm3', orderId: '003' }, 'agent');
		expect(groupOf(journal, 'a')).toMatchObject({ sealed: true, after: { id: 'm3' } });
		expect(groupOf(journal, 'x')).toMatchObject({ sealed: false });

		reply(journal, call('c'), 'm1');
		expect(groupOf(journal, 'c')).not.toBe(groupOf(journal, 'a'));
	});

	it('seals a run that moves to another thread without an anchor, and updates known calls in place', () => {
		const journal = discussion();
		reply(journal, call('a'), 'm1');
		reply(journal, call('b'), 'm9');
		expect(groupOf(journal, 'a')).toMatchObject({ sealed: true, replyTo: 'm1' });
		expect(groupOf(journal, 'a').after).toBeUndefined();
		expect(groupOf(journal, 'b')).toMatchObject({ sealed: false, replyTo: 'm9' });
		reply(journal, call('a', 'complete'), 'm9');
		expect(groupOf(journal, 'a').itemIds).toHaveLength(1);
		expect(groupOf(journal, 'b').itemIds).toHaveLength(1);
	});

	it('keeps generic snapshots apart per thread and coalesces their heartbeats', () => {
		const journal = discussion();
		reply(journal, { step: 1 }, 'm1');
		reply(journal, { step: 1 }, 'm9');
		reply(journal, { step: 1 }, 'm9', 'agent', 'Working', 101);
		expect(journal.items.size).toBe(2);
		expect(journal.groups.size).toBe(2);
	});

	it('places live text by reply_to', () => {
		const journal = discussion();
		reply(journal, undefined, 'm1');
		expect(journal.live.get('agent')).toMatchObject({ text: 'Working', replyTo: 'm1' });
		reply(journal, undefined);
		expect(journal.live.get('agent')).not.toHaveProperty('replyTo');
	});

	it('ignores reply_to in a chat', () => {
		const journal = new ChatStatusJournal(scope);
		reply(journal, call('a'), 'm1');
		reply(journal, call('b'), 'm9', 'other');
		expect(groupOf(journal, 'a')).toBe(groupOf(journal, 'b'));
		expect(groupOf(journal, 'a')).not.toHaveProperty('replyTo');
		expect(journal.live.size).toBe(0);
		journal.message({ id: 'm2', orderId: '002' }, 'person');
		expect(groupOf(journal, 'a')).toMatchObject({ sealed: true, after: { id: 'm2' } });
	});

	it('seals every open run on disconnect', () => {
		const journal = discussion();
		reply(journal, call('a'));
		reply(journal, call('b'), undefined, 'other');
		journal.disconnect();
		expect(groupOf(journal, 'a').sealed).toBe(true);
		expect(groupOf(journal, 'b').sealed).toBe(true);
	});
});

describe('lossless status JSON', () => {
	it('preserves nested numeric tokens and string contents during merge, inspect and copy', () => {
		const source = '{"text":"Found", "data":{"tool_call_id":"a","result":{"large":9007199254740993123,"decimal":1.0000000000000001,"exponent":1e400,"text":"line\\nzero\u200bwidth"}}}';
		const payload = decodeStatus(source);
		const journal = new ChatStatusJournal(scope);
		journal.status('agent', payload, 100);
		status(journal, { tool_call_id: 'a', status: 'complete' });
		const data = Array.from(journal.items.values())[0].data;
		const copied = jsonStringify(data, true);
		expect(copied).toContain('9007199254740993123');
		expect(copied).toContain('1.0000000000000001');
		expect(copied).toContain('1e400');
		expect(copied).toContain('line\\nzero\u200bwidth');
		expect(jsonStringify(jsonMetadata(data))).not.toContain('result');
	});

	it.each([ 'null', '[]', 'true', '{', '{"data":NaN}', '{"data":1,}' ])('rejects invalid envelopes: %s', source => {
		expect(decodeStatus(source)).toBeNull();
	});

	it('accepts empty envelopes, normalizes missing text and handles special object keys without prototypes', () => {
		expect(decodeStatus('{}')).toEqual({ text: null, data: undefined });
		expect(decodeStatus('{"text":"  "}').text).toBeNull();
		const value = parseJson('{"__proto__":{"polluted":true},"constructor":1,"x":1,"x":2}');
		expect(jsonStringify(value)).toBe('{"__proto__":{"polluted":true},"constructor":1,"x":2}');
		expect(({} as any).polluted).toBeUndefined();
	});
});
