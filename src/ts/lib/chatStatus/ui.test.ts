import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatStatusJournal, decodeStatus } from './model';
import { ChatStatus } from '../../store/chatStatus';
import { StatusFooter, StatusGroup } from '../../component/block/chat/status';

vi.mock('Component', () => ({
	Icon: () => null,
	IconObject: ({ size }: { size: number }) => React.createElement('span', { className: 'iconObject', 'data-size': size }),
}));
vi.mock('Lib/chatStatus', () => ({ chatStatus: { expand: vi.fn() } }));
vi.mock('Lib', () => ({
	translate: (key: string) => key,
	U: {
		Space: {
			getParticipantId: (_space: string, identity: string) => identity,
			getParticipant: (identity: string) => ({ name: identity == 'attacker' ? '<img src=x onerror=alert(1)>' : 'Agent' }),
		},
		String: { sprintf: (text: string, value: unknown) => `${text}:${value}` },
	},
}));

const scope = { accountId: 'ui', spaceId: 'space', chatId: 'chat' };
const render = (groupId: string, props: Partial<React.ComponentProps<typeof StatusGroup>> = {}) =>
	renderToStaticMarkup(React.createElement(StatusGroup, { scope, groupId, now: 100, ...props }));

describe('tool result disclosure', () => {
	beforeEach(() => ChatStatus.clear(scope.accountId));
	it('shows the participant avatar only at the end of an incoming author run', () => {
		const journal = new ChatStatusJournal(scope);
		journal.status('agent', decodeStatus('{"data":{"tool_call_id":"call","status":"in_progress"}}'), 100);
		const group = Array.from(journal.groups.values())[0];
		ChatStatus.get(scope).apply(journal.delta(true));
		expect(render(group.id, { isLast: true })).toContain('class="iconObject" data-size="32"');
		expect(render(group.id, { isLast: false })).not.toContain('class="iconObject"');
		expect(render(group.id, { isLast: false })).toContain('class="statusAvatarLane"');
	});
	it('aligns same-account activity with outgoing messages, without an avatar lane', () => {
		const journal = new ChatStatusJournal(scope);
		journal.status(scope.accountId, decodeStatus('{"data":{"tool_call_id":"call"}}'), 100);
		const group = Array.from(journal.groups.values())[0];
		ChatStatus.get(scope).apply(journal.delta(true));
		expect(render(group.id)).toContain('isSelf');
		expect(render(group.id)).not.toContain('class="statusAvatarLane"');
	});
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

describe('untrusted status content', () => {
	beforeEach(() => ChatStatus.clear(scope.accountId));
	const attack = '<img src=x onerror=alert(1)><svg onload=alert(2)></svg><script>alert(3)</script>';
	const attributeAttack = '\" autofocus onfocus=\"alert(4)';
	const assertNoExecutableMarkup = (html: string) => {
		expect(html).not.toMatch(/<(img|svg|script|iframe|a)\b/i);
		expect(html).not.toContain('\" autofocus onfocus=\"');
		expect(html).toContain('&lt;img');
	};
	it('escapes summary, publisher, tool name, metadata keys/values, call ID and expanded results', () => {
		const journal = new ChatStatusJournal(scope);
		journal.status('attacker', decodeStatus(JSON.stringify({
			text: attack,
			data: {
				tool_call_id: attributeAttack,
				tool_name: attack,
				status: 'complete',
				[attack]: attack,
				[attributeAttack]: 'javascript:alert(5)',
				result: { html: `</pre>${attack}` },
			},
		})), 100);
		const group = Array.from(journal.groups.values())[0];
		ChatStatus.get(scope).apply(journal.delta(true));
		assertNoExecutableMarkup(render(group.id));
		journal.expand('group', group.id, true);
		ChatStatus.get(scope).apply(journal.delta());
		const expandedGroup = render(group.id);
		assertNoExecutableMarkup(expandedGroup);
		expect(expandedGroup).toContain('data-call-id="&quot; autofocus onfocus=&quot;alert(4)"');
		expect(expandedGroup).not.toContain('class="statusResult"');
		journal.expand('item', group.itemIds[0], true);
		ChatStatus.get(scope).apply(journal.delta());
		const expandedItem = render(group.id);
		assertNoExecutableMarkup(expandedItem);
		expect(expandedItem).toContain('&lt;/pre&gt;&lt;img');
	});
	it('escapes transient status text and participant names above the composer', () => {
		const html = renderToStaticMarkup(React.createElement(StatusFooter, {
			scope, now: 100, live: [ { publisherIdentity: 'attacker', text: attack, lastSeenAt: 100 } ],
		}));
		assertNoExecutableMarkup(html);
	});
	it('does not interpret a publisher-supplied lifecycle as CSS classes or attributes', () => {
		const journal = new ChatStatusJournal(scope);
		journal.status('attacker', decodeStatus(JSON.stringify({ data: { tool_call_id: 'call', status: attributeAttack } })), 100);
		const group = Array.from(journal.groups.values())[0];
		journal.expand('group', group.id, true);
		ChatStatus.get(scope).apply(journal.delta(true));
		expect(render(group.id)).not.toContain('statusBadge');
		expect(render(group.id)).not.toContain(attributeAttack);
	});
});
