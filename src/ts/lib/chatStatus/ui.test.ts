import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatStatusJournal, decodeStatus } from './model';
import { ChatStatus } from '../../store/chatStatus';
import { StatusGroup } from '../../component/block/chat/status';

vi.mock('Component', () => ({ Icon: () => null }));
vi.mock('Lib/chatStatus', () => ({ chatStatus: { expand: vi.fn() } }));
vi.mock('Lib', () => ({
	translate: (key: string) => key,
	U: {
		Space: { getParticipantId: () => 'agent', getParticipant: () => ({ name: 'Agent' }) },
		String: { sprintf: (text: string, value: unknown) => `${text}:${value}` },
	},
}));

const scope = { accountId: 'ui', spaceId: 'space', chatId: 'chat' };
const render = (groupId: string) => renderToStaticMarkup(React.createElement(StatusGroup, { scope, groupId, now: 100 }));

describe('tool result disclosure', () => {
	beforeEach(() => ChatStatus.clear(scope.accountId));
	it('reveals no results when the group opens, and reveals only the individually expanded result', () => {
		const journal = new ChatStatusJournal(scope);
		for (const id of [ 'first', 'second' ]) {
			journal.status('agent', decodeStatus(JSON.stringify({
				text: 'Found documents', data: { tool_call_id: id, tool_name: 'web_search', status: id == 'first' ? 'complete' : 'error', query: 'trains', result: { secret: `result-${id}` } },
			})), 100);
		};
		const group = Array.from(journal.groups.values())[0];
		ChatStatus.get(scope).apply(journal.delta(true));
		expect(render(group.id)).not.toContain('result-first');
		journal.expand('group', group.id, true);
		ChatStatus.get(scope).apply(journal.delta());
		const expanded = render(group.id);
		expect(expanded).toContain('query: trains');
		expect(expanded).toContain('blockChatStatusError');
		expect(expanded).not.toContain('result-first');
		expect(expanded).not.toContain('result-second');
		journal.expand('item', group.itemIds[0], true);
		ChatStatus.get(scope).apply(journal.delta());
		expect(render(group.id)).toContain('result-first');
		expect(render(group.id)).not.toContain('result-second');
	});
});
