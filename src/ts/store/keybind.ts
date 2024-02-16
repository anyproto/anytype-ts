import { makeObservable, observable, action, computed } from 'mobx';
import {UserKeyboardShortcut} from 'Lib';

class KeybindStore {
	public createdObject = null;
	public challengeId = '';
	public serverPort = '';
	public gatewayPort = '';
	public tabUrlValue = '';

	// Used to detect new shortcuts
	public shortcutsDisabled= false;
	public userShortcuts: Map<string, UserKeyboardShortcut> = new Map();

	constructor() {
        makeObservable(this, {
			shortcutsDisabled: observable,
			userShortcuts: observable,
		});
	};

	setShortcutsDisabled(v: boolean) {
		this.shortcutsDisabled = v;
	}

	setUserShortcuts(action: string, userShortcut: UserKeyboardShortcut) {
		const existingShortcut = this.userShortcuts.get(action);
		if (existingShortcut) {
			if (existingShortcut.disabled) {
				return;
			}
			this.userShortcuts.set(action, userShortcut)
		} else {
			this.userShortcuts.set(action, userShortcut)
		}

		for (const [key, value] of this.userShortcuts.entries()) {
			console.log("VALUES: ", key, value.userSetShortcuts, value.disabled);
		}
	}
};

export const keybindStore: KeybindStore = new KeybindStore();
