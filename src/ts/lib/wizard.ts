import { I, Storage, Util } from 'Lib';
import * as Docs from 'Docs';
import { menuStore } from 'Store';

class Wizard {
	
	start (key: string, force?: boolean, options?: any) {
		options = options || {};

		const section = Docs.Help.Wizard[key];
		if (!section || !section.items || !section.items.length || (!force && Storage.getOnboarding(key))) {
			return;
		};

		menuStore.closeAll(['onboarding', 'wizard'], () => {
			menuStore.open('wizard', {
				element: '#button-help',
				classNameWrap: 'fixed',
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Right,
				offsetY: -4,
				noAnimation: true,
				noFlipY: true,
				noFlipX: true,
				onClose: () => {
					// this.start(this.getReminderKey(key), isPopup, force);

					// Storage.setOnboarding(key);
				},
				data: {
					options,
					key,
					current: 0,
				},
			});
		});
	};

	getReminderKey (key: string) {
		return Util.toCamelCase([ key, 'reminder' ].join('-'));
	};
	
};

export default new Wizard();