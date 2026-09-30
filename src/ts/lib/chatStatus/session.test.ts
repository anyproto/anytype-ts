import { describe, expect, it } from 'vitest';
import { ChatStatusSession } from './session';
import { StatusDelta } from './model';

const scope = { accountId: 'a', spaceId: 's', chatId: 'c' };
const update = { type: 'status' as const, publisherIdentity: 'p', payload: '{"data":{"tool_call_id":"call","status":"in_progress"}}' };

describe('application-memory status session', () => {
	it('elects one ingestion owner and transfers it while retaining history and expansion', () => {
		const sent: [number, StatusDelta][] = [];
		const session = new ChatStatusSession((id, delta) => sent.push([ id, structuredClone(delta) ]));
		const latest = (id: number) => sent.filter(([ client ]) => client == id).at(-1)[1];
		session.receive(1, scope, { type: 'attach' });
		session.receive(2, scope, { type: 'attach' });
		expect(latest(1).owner).toBe(true);
		expect(latest(2).owner).toBe(false);
		session.receive(1, scope, update);
		const item = latest(2).items[0];
		session.receive(2, scope, { type: 'expand', kind: 'item', id: item.id, expanded: true });
		const length = sent.length;
		session.receive(2, scope, update);
		expect(sent).toHaveLength(length);
		session.removeClient(1);
		expect(latest(2)).toMatchObject({ owner: true, reset: true });
		expect(latest(2).items[0]).toMatchObject({ id: item.id, fresh: false, expanded: true });
		session.receive(2, scope, { ...update, payload: '{"data":{"tool_call_id":"call","status":"complete"}}' });
		expect(latest(2).items[0]).toMatchObject({ id: item.id, lifecycle: 'complete' });
		session.removeClient(2);
		session.receive(3, scope, { type: 'attach' });
		expect(latest(3).items).toHaveLength(1);
		expect(latest(3).items[0].expanded).toBe(true);
	});

	it('clears the requested account/space without clearing another session', () => {
		const sent: StatusDelta[] = [];
		const session = new ChatStatusSession((_id, delta) => sent.push(structuredClone(delta)));
		session.receive(1, scope, { type: 'attach' });
		session.receive(1, scope, update);
		const other = { ...scope, spaceId: 'other' };
		session.receive(1, other, { type: 'attach' });
		session.receive(1, other, update);
		session.receive(1, scope, { type: 'clearSpace' });
		expect(sent.at(-1)).toMatchObject({ reset: true, items: [], owner: false });
		session.receive(2, other, { type: 'attach' });
		expect(sent.at(-1).items).toHaveLength(1);
		session.receive(2, scope, { type: 'attach' });
		expect(sent.at(-1).items).toHaveLength(0);
	});
});
