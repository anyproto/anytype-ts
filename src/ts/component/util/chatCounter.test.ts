import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as I from 'Interface';

vi.mock('Component', () => ({
	Icon: (props: any) => React.createElement('i', { className: props.className }, props.inner),
}));

import ChatCounter from './chatCounter';

/**
 * Mute writes NotificationMode.Nothing in a one-to-one space, and Nothing ("Mute and hide")
 * hides the counter. A muted one-to-one chat lost its unread counter, while the mobile
 * clients keep it there: hiding does not apply to one-to-one spaces.
 */

const SPACE_ID = 'space';
const CHAT_ID = 'chat';

const render = (spaceview: any, state: any, chatId?: string) => {
	const counters = { messageCounter: 0, mentionCounter: 0, reactionCounter: 0, ...state };

	vi.stubGlobal('S', {
		Common: { space: SPACE_ID },
		Chat: {
			stateMap: new Map([ [ SPACE_ID, new Map([ [ CHAT_ID, counters ] ]) ] ]),
			discussionParentMap: new Map(),
			isStateEntryArchived: () => false,
			isActiveReadChat: () => false,
			getChatCounters: () => counters,
			counterString: (c: number) => String(c),
		},
	});
	vi.stubGlobal('U', {
		Space: { getSpaceviewBySpaceId: () => spaceview },
		Object: { getChatNotificationMode: () => spaceview.notificationMode },
	});

	return renderToStaticMarkup(React.createElement(ChatCounter, { spaceId: SPACE_ID, chatId }));
};

const MESSAGES = { messageCounter: 3 };
const REACTIONS = { reactionCounter: 1 };

describe('ChatCounter of a space', () => {

	it('should show a muted message counter for a muted one-to-one space', () => {
		const html = render({ isOneToOne: true, notificationMode: I.NotificationMode.Nothing }, MESSAGES);

		expect(html).toContain('<i class="message isMuted">3</i>');
	});

	it('should show a muted reaction counter for a muted one-to-one space', () => {
		const html = render({ isOneToOne: true, notificationMode: I.NotificationMode.Nothing }, REACTIONS);

		expect(html).toContain('<i class="reaction isMuted"></i>');
	});

	it('should hide the counters in mode Nothing for other spaces', () => {
		expect(render({ isOneToOne: false, notificationMode: I.NotificationMode.Nothing }, MESSAGES)).toBe('');
		expect(render({ isOneToOne: false, notificationMode: I.NotificationMode.Nothing }, REACTIONS)).toBe('');
	});

	it('should show a muted message counter in mode Mentions for other spaces', () => {
		const html = render({ isOneToOne: false, notificationMode: I.NotificationMode.Mentions }, MESSAGES);

		expect(html).toContain('<i class="message isMuted">3</i>');
	});

	it('should show a regular message counter in mode All', () => {
		const html = render({ isOneToOne: true, notificationMode: I.NotificationMode.All }, MESSAGES);

		expect(html).toContain('<i class="message">3</i>');
	});

});

describe('ChatCounter of a chat', () => {

	it('should show a muted message counter for a muted chat of a one-to-one space', () => {
		const html = render({ isOneToOne: true, notificationMode: I.NotificationMode.Nothing }, MESSAGES, CHAT_ID);

		expect(html).toContain('<i class="message isMuted">3</i>');
	});

	it('should hide the message counter in mode Nothing for other spaces', () => {
		const html = render({ isOneToOne: false, notificationMode: I.NotificationMode.Nothing }, MESSAGES, CHAT_ID);

		expect(html).toBe('');
	});

});
