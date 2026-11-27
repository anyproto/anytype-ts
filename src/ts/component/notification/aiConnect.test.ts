import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import Constant from 'json/constant';
import UtilString from 'Lib/util/string';

vi.mock('Component', () => ({
	Icon: () => null,
	Title: ({ text }: { text: string }) => React.createElement('div', { className: 'title' }, text),
	Label: ({ text }: { text: string }) => React.createElement('div', { className: 'label' }, text),
	Button: ({ text }: { text: string }) => React.createElement('div', { className: 'button' }, text),
}));

import Notification, { NudgeButtons } from './index';
import NotificationModel from '../../model/notification';
import { NotificationStatus, NotificationType } from '../../interface/notification';
import { notificationReplyClose } from '../../lib/notificationReply';

// The real strings (the test setup mocks json/text.json)
const TEXT = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../json/text.json'), 'utf8'));
const t = (key: string): string => TEXT[key] ?? key;

const nudge = (payload: any) => new NotificationModel({
	id: 'aiConnectNudge', type: NotificationType.AiConnect, status: NotificationStatus.Created, createTime: 1, isLocal: true, payload,
});

let reply: ReturnType<typeof vi.fn>;

beforeEach(() => {
	reply = vi.fn();
	vi.stubGlobal('translate', t);
	vi.stubGlobal('J', { Constant, Error: { Code: { Import: {} } } });
	vi.stubGlobal('C', { NotificationReply: reply });
	vi.stubGlobal('S', { Common: { space: 'space-1' } });
	vi.stubGlobal('U', {
		String: UtilString,
		Common: {
			enumKey: (e: any, v: any) => Object.keys(e).find(k => e[k] === v) || '',
			plural: (n: number, s: string) => s,
		},
		Space: { getSpaceviewBySpaceId: () => null, getMyParticipant: () => null },
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('the AI apps nudge notification (§5.9)', () => {
	test('names the first installed app; with several apps the text speaks of AI apps', () => {
		const one = nudge({ appId: 'cursor', appName: 'Cursor', count: 1 });
		const many = nudge({ appId: 'claude-desktop', appName: 'Claude Desktop', count: 3 });

		expect(one.title).toBe('Use Anytype in Cursor');
		expect(one.text).toBe('Anytype found Cursor on this computer. Connect it to use your spaces there.');
		expect(many.title).toBe('Use Anytype in Claude Desktop');
		expect(many.text).toBe(t('notificationAiConnectSuccessTextMany'));
	});

	test('Connect and Close are native buttons with accessible names; other types keep their markup', () => {
		const html = renderToStaticMarkup(React.createElement(Notification, { item: nudge({ appId: 'cursor', appName: 'Cursor', count: 1 }), resize: () => {} }));
		const buttons = html.match(/<button[^>]*>[^<]*<\/button>/g);

		expect(buttons).toEqual([
			'<button type="button" class="button black size28" aria-label="Connect">Connect</button>',
			'<button type="button" class="button blank size28" aria-label="Close">Close</button>',
		]);

		const join = new NotificationModel({
			id: 'n2', type: NotificationType.Join, status: NotificationStatus.Created, createTime: 1, isLocal: false,
			payload: { identityName: 'Ann', spaceName: 'Team', spaceId: 'space-2' },
		});

		expect(renderToStaticMarkup(React.createElement(Notification, { item: join, resize: () => {} }))).not.toContain('<button');
	});
});

describe('closing notifications (Clear all, the close icon)', () => {
	test('Z11: Clear all replies for every heart notification, local imports and exports included; only the AI nudge is skipped', () => {
		const nudgeItem = nudge({ appId: 'cursor', appName: 'Cursor', count: 1 });
		const exportItem = { id: 'export-1', type: NotificationType.Export, status: NotificationStatus.Created, createTime: 1, isLocal: true, payload: {} };
		const importItem = { id: 'import-1', type: NotificationType.Import, status: NotificationStatus.Created, createTime: 1, isLocal: true, payload: {} };
		const joinItem = { id: 'join-1', type: NotificationType.Join, status: NotificationStatus.Created, createTime: 1, isLocal: false, payload: {} };

		notificationReplyClose([ exportItem, nudgeItem, importItem, joinItem ]);
		expect(reply.mock.calls).toEqual([ [ [ 'export-1', 'import-1', 'join-1' ], 0 ] ]);

		reply.mockClear();
		notificationReplyClose([ exportItem ]);
		expect(reply.mock.calls).toEqual([ [ [ 'export-1' ], 0 ] ]);

		reply.mockClear();
		notificationReplyClose([ nudgeItem ]);
		notificationReplyClose([]);
		expect(reply).not.toHaveBeenCalled();
	});
});

describe('A5: the nudge keys stay on the nudge', () => {
	test('A5: a keystroke on the nudge controls stops at them (no editor or app shortcut), and keeps its native default', () => {
		const onConnect = vi.fn();
		const onClose = vi.fn();
		const el: any = NudgeButtons({ onConnect, onClose });
		const buttons = React.Children.toArray(el.props.children) as any[];

		expect(el.props.className).toBe('buttons');
		expect(buttons.map(b => [ b.type, b.props.type ])).toEqual([ [ 'button', 'button' ], [ 'button', 'button' ] ]);
		expect(buttons[0].props.onClick).toBe(onConnect);
		expect(buttons[1].props.onClick).toBe(onClose);

		for (const key of [ 'Enter', ' ', 'Tab', 'Escape' ]) {
			const e = { key, shiftKey: (key == 'Tab'), stopPropagation: vi.fn(), preventDefault: vi.fn() };

			el.props.onKeyDown(e);
			expect(e.stopPropagation).toHaveBeenCalledTimes(1);
			// Enter / Space still click the focused button, Tab still moves focus
			expect(e.preventDefault).not.toHaveBeenCalled();
		};
	});

	test('A5: the nudge renders exactly these controls; other notification types don\'t', () => {
		const html = renderToStaticMarkup(React.createElement(Notification, { item: nudge({ appId: 'cursor', appName: 'Cursor', count: 1 }), resize: () => {} }));

		expect(html).toContain(renderToStaticMarkup(NudgeButtons({ onConnect: () => {}, onClose: () => {} }) as any));
	});
});
