import { describe, it, expect, vi } from 'vitest';
import * as I from 'Interface';

vi.mock('Component', () => ({ Icon: () => null }));
vi.mock('Model', () => ({}));

import UtilMenu from './menu';

/**
 * A one-to-one space had only two modes, All and Nothing, and Nothing also hides the unread
 * counter. Mentions is the mode that mutes notifications and keeps the counter, so it has to be
 * offered in a one-to-one space as well, under the name "Mute".
 */

const options = (spaceview: any) => {
	vi.stubGlobal('translate', (key: string) => key);
	vi.stubGlobal('U', { Space: { getSpaceview: () => spaceview } });

	return UtilMenu.notificationModeOptions();
};

describe('UtilMenu.notificationModeOptions', () => {

	it('should offer all three modes in a one-to-one space', () => {
		const ids = options({ isOneToOne: true }).map(it => it.id);

		expect(ids).toEqual([ I.NotificationMode.All, I.NotificationMode.Mentions, I.NotificationMode.Nothing ]);
	});

	it('should name the Mentions mode "Mute" in a one-to-one space', () => {
		const option = options({ isOneToOne: true }).find(it => it.id == I.NotificationMode.Mentions);

		expect(option.name).toBe('commonMute');
	});

	it('should keep the "Mentions only" name in other spaces', () => {
		const option = options({ isOneToOne: false }).find(it => it.id == I.NotificationMode.Mentions);

		expect(option.name).toBe(`notificationMode${I.NotificationMode.Mentions}`);
	});

});
