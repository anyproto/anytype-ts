import { I, S, U, J, keyboard } from 'Lib';

const electron = U.Common.getElectron();

const ACCOUNT_KEYS = [
	'spaceId',
	'spaceOrder',
];

const SPACE_KEYS = [
	'toggle',
	'lastOpenedObject',
	'scroll',
	'defaultType',
	'pinnedTypes',
	'chat',
	'popupSearch',
	'focus',
	'openUrl',
	'redirectInvite',
];

const Api = {
	get: (key: string) => {
		if (electron.storeGet) {
			return electron.storeGet(key);
		} else {
			return Api.parse(localStorage.getItem(key));
		};
	},

	set: (key: string, obj: any) => {
		if (electron.storeSet) {
			electron.storeSet(key, obj);
		} else {
			localStorage.setItem(key, JSON.stringify(obj));
		};
	},

	delete: (key: string) => {
		if (electron.storeDelete) {
			electron.storeDelete(key);
		} else {
			localStorage.removeItem(key);
		};
	},

	parse: (s: string) => {
		if (!s) {
			return;
		};

		let ret = '';
		try { ret = JSON.parse(s); } catch (e) { /**/ };
		return ret;
	},
};

class Storage {
	
	/**
	 * Gets a value from storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 * @returns {any} The stored value.
	 */
	get (key: string): any {
		if (!key) {
			console.log('[Storage].get: key not specified');
			return;
		};

		let o = Api.get(key);
		if (undefined === o) {
			o = Api.parse(String(localStorage.getItem(key) || ''));
		};

		if (this.isSpaceKey(key)) {
			if (o) {
				localStorage.removeItem(key);
				this.set(key, o);
			};

			return this.getSpaceKey(key);
		} else 
		if (this.isAccountKey(key)) {
			if (o) {
				localStorage.removeItem(key);
				this.set(key, o);
			};

			return this.getAccountKey(key);
		} else {
			return o;
		};
	};

	/**
	 * Sets a value in storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 * @param {any} obj - The value to store.
	 */
	set (key: string, obj: any): void {
		obj = U.Common.objectCopy(obj);

		if (!key) {
			console.log('[Storage].set: key not specified');
			return;
		};

		if (this.isSpaceKey(key)) {
			this.setSpaceKey(key, obj);
		} else 
		if (this.isAccountKey(key)) {
			this.setAccountKey(key, obj);
		} else {
			Api.set(key, obj);
			//localStorage.removeItem(key);
		};
	};
	
	/**
	 * Deletes a value from storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 */
	delete (key: string) {
		if (this.isSpaceKey(key)) {
			this.deleteSpaceKey(key);
		} else 
		if (this.isAccountKey(key)) {
			this.deleteAccountKey(key);
		} else {
			Api.delete(key);
			localStorage.removeItem(key);
		};
	};

	/**
	 * Checks if a key is a space key.
	 * @param {string} key - The key to check.
	 * @returns {boolean} True if the key is a space key.
	 */
	isSpaceKey (key: string): boolean {
		return SPACE_KEYS.includes(key);
	};

	/**
	 * Sets a space key value for a specific space.
	 * @param {string} key - The space key.
	 * @param {any} value - The value to set.
	 * @param {string} [spaceId] - The space ID (optional).
	 */
	setSpaceKey (key: string, value: any, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);

		if (spaceId) {
			obj[spaceId][key] = value;
		};

		this.setSpace(obj);
	};

	/**
	 * Gets a space key value for a specific space.
	 * @param {string} key - The space key.
	 * @param {string} [spaceId] - The space ID (optional).
	 * @returns {any} The value for the space key.
	 */
	getSpaceKey (key: string, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);
		return obj[spaceId][key];
	};

	/**
	 * Deletes a space key value for a specific space.
	 * @param {string} key - The space key.
	 * @param {string} [spaceId] - The space ID (optional).
	 */
	deleteSpaceKey (key: string, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);

		delete(obj[spaceId][key]);

		this.setSpace(obj);
	};

	/**
	 * Gets the space object for a given space ID.
	 * @param {string} [spaceId] - The space ID (optional).
	 * @returns {any} The space object.
	 */
	getSpace (spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.get('space') || {};

		obj[spaceId] = obj[spaceId] || {};

		return obj;
	};

	/**
	 * Sets the space object in storage.
	 * @param {any} obj - The space object to set.
	 */
	setSpace (obj: any) {
		this.set('space', obj);
	};

	/**
	 * Deletes a space by ID from storage.
	 * @param {string} id - The space ID to delete.
	 */
	deleteSpace (id: string) {
		const obj = this.getSpace();

		delete(obj[id]);

		this.setSpace(obj);
	};

	/**
	 * Clears all deleted spaces from storage.
	 */
	clearDeletedSpaces () {
		const keys = Object.keys(this.getSpace());

		keys.forEach(key => {
			const spaceview = U.Space.getSpaceviewBySpaceId(key);
			if (!spaceview) {
				this.deleteSpace(key);
			};
		});
	};

	/**
	 * Checks if a key is an account key.
	 * @param {string} key - The key to check.
	 * @returns {boolean} True if the key is an account key.
	 */
	isAccountKey (key: string): boolean {
		return ACCOUNT_KEYS.includes(key);
	};

	/**
	 * Sets an account key value for the current account.
	 * @param {string} key - The account key.
	 * @param {any} value - The value to set.
	 */
	setAccountKey (key: string, value: any) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		if (accountId) {
			obj[accountId][key] = value;
		};

		this.setAccount(obj);
	};

	/**
	 * Gets an account key value for the current account.
	 * @param {string} key - The account key.
	 * @returns {any} The value for the account key.
	 */
	getAccountKey (key: string) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		return obj[accountId][key];
	};

	/**
	 * Gets the account object from storage.
	 * @returns {any} The account object.
	 */
	getAccount () {
		const obj = this.get('account') || {};
		const accountId = this.getAccountId();

		obj[accountId] = obj[accountId] || {};

		return obj;
	};

	/**
	 * Sets the account object in storage.
	 * @param {any} obj - The account object to set.
	 */
	setAccount (obj: any) {
		this.set('account', obj);
	};

	/**
	 * Deletes an account by ID from storage.
	 * @param {string} id - The account ID to delete.
	 */
	deleteAccount (id: string) {
		const obj = this.getAccount();

		delete(obj[id]);

		this.setAccount(obj);
	};

	/**
	 * Deletes an account key for the current account.
	 * @param {string} key - The account key to delete.
	 */
	deleteAccountKey (key: string) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		delete(obj[accountId][key]);

		this.setAccount(obj);
	};

	/**
	 * Gets the current account ID.
	 * @returns {string} The account ID.
	 */
	getAccountId (): string {
		const { account } = S.Auth;
		return account ? account.id : '';
	};

	/**
	 * Gets the pin value from storage.
	 * @returns {any} The pin value.
	 */
	getPin () {
		return this.get('pin');
	};

	/**
	 * Gets the last opened objects from storage.
	 * @returns {any} The last opened objects.
	 */
	getLastOpened () {
		return this.get('lastOpenedObject') || {};
	};

	/**
	 * Sets the last opened object for a window.
	 * @param {string} windowId - The window ID.
	 * @param {any} param - The parameters to set.
	 */
	setLastOpened (windowId: string, param: any) {
		const obj = this.getLastOpened();

		obj[windowId] = Object.assign(obj[windowId] || {}, param);
		this.set('lastOpenedObject', obj);
	};

	/**
	 * Deletes last opened objects by object IDs.
	 * @param {string[]} ids - The object IDs to delete.
	 */
	deleteLastOpenedByObjectId (ids: string[]) {
		ids = ids || [];

		const obj = this.getLastOpened();
		const windowIds = [];

		for (const windowId in obj) {
			if (!obj[windowId] || ids.includes(obj[windowId].id)) {
				windowIds.push(windowId);
			};
		};

		this.deleteLastOpenedByWindowId(windowIds);
	};

	/**
	 * Deletes last opened objects by window IDs.
	 * @param {string[]} ids - The window IDs to delete.
	 */
	deleteLastOpenedByWindowId (ids: string[]) {
		if (!ids.length) {
			return;
		};

		const obj = this.getLastOpened();

		ids.forEach(ids => delete(obj[ids]));
		this.set('lastOpenedObject', obj);
	};

	/**
	 * Gets the last opened object by window ID.
	 * @param {string} id - The window ID.
	 * @returns {any} The last opened object.
	 */
	getLastOpenedByWindowId (id: string) {
		const obj = this.getLastOpened();
		return obj[id] || obj[1] || null;
	};

	/**
	 * Sets a toggle value for a block in a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {string} id - The block ID.
	 * @param {boolean} value - The toggle value.
	 */
	setToggle (rootId: string, id: string, value: boolean) {
		let obj = this.get('toggle');
		if (!obj || U.Common.hasProperty(obj, 'length')) {
			obj = {};
		};
		
		let list = obj[rootId] || [];
		if (value) {
			list = list.concat([ id ]);
		} else {
			list = list.filter(it => it != id);
		};
		list = [ ...new Set(list) ];

		obj[rootId] = list;
		this.set('toggle', obj);
		return obj;
	};

	/**
	 * Gets the toggle values for a root object.
	 * @param {string} rootId - The root object ID.
	 * @returns {any} The toggle values.
	 */
	getToggle (rootId: string) {
		const obj = this.get('toggle') || {};
		return obj[rootId] || [];
	};

	/**
	 * Checks if a block is toggled in a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {string} id - The block ID.
	 * @returns {boolean} True if toggled.
	 */
	checkToggle (rootId: string, id: string): boolean {
		return this.getToggle(rootId).includes(id);
	};

	/**
	 * Deletes toggle values for a root object.
	 * @param {string} rootId - The root object ID.
	 */
	deleteToggle (rootId: string) {
		const obj = this.get('toggle') || {};

		delete(obj[rootId]);
		this.set('toggle', obj);
	};

	/**
	 * Sets the scroll position for a block in a root object.
	 * @param {string} key - The scroll key.
	 * @param {string} rootId - The root object ID.
	 * @param {number} scroll - The scroll position.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 */
	setScroll (key: string, rootId: string, scroll: number, isPopup: boolean) {
		key = this.getScrollKey(key, isPopup);

		const obj = this.get('scroll') || {};
		try {
			obj[key] = obj[key] || {};
			obj[key][rootId] = Number(scroll) || 0;

			this.set('scroll', obj);
		} catch (e) { /**/ };
		return obj;
	};

	/**
	 * Gets the scroll position for a block in a root object.
	 * @param {string} key - The scroll key.
	 * @param {string} rootId - The root object ID.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {number} The scroll position.
	 */
	getScroll (key: string, rootId: string, isPopup: boolean) {
		key = this.getScrollKey(key, isPopup);

		const obj = this.get('scroll') || {};
		return Number((obj[key] || {})[rootId]) || 0;
	};

	/**
	 * Gets the scroll key for a block in a given context.
	 * @param {string} key - The scroll key.
	 * @param {boolean} isPopup - Whether the context is a popup.
	 * @returns {string} The scroll key.
	 */
	getScrollKey (key: string, isPopup: boolean) {
		return isPopup ? `${key}Popup` : key;
	};

	/**
	 * Sets the focus state for a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {I.FocusState} state - The focus state to set.
	 */
	setFocus (rootId: string, state: I.FocusState) {
		const obj = this.get('focus') || {};

		obj[rootId] = state;
		this.set('focus', obj);
		return obj;
	};

	/**
	 * Gets the focus state for a root object.
	 * @param {string} rootId - The root object ID.
	 * @returns {I.FocusState} The focus state.
	 */
	getFocus (rootId: string): I.FocusState {
		const obj = this.get('focus') || {};
		return obj[rootId];
	};

	/**
	 * Sets onboarding state for a key.
	 * @param {string} key - The onboarding key.
	 */
	setOnboarding (key: string) {
		const keys = this.get('onboarding') || [];
		
		if (!this.getOnboarding(key)) {
			keys.push(key);
		};

		this.set('onboarding', keys);
		return keys;
	};

	/**
	 * Gets onboarding state for a key.
	 * @param {string} key - The onboarding key.
	 * @returns {any} The onboarding state.
	 */
	getOnboarding (key: string) {
		return (this.get('onboarding') || []).includes(key);
	};

	/**
	 * Gets the highlight state for a key.
	 * @param {string} key - The highlight key.
	 * @returns {boolean} The highlight state.
	 */
	getHighlight (key: string): boolean {
		const highlights = this.get('highlights') || {};

		return Boolean(highlights[key]) || false;
	};

	/**
	 * Sets the highlight state for a key.
	 * @param {string} key - The highlight key.
	 * @param {boolean} value - The highlight value.
	 */
	setHighlight (key: string, value: boolean) {
		const highlights = this.get('highlights') || {};

		highlights[key] = value;

		this.set('highlights', highlights);
	};

	/**
	 * Gets the survey state for a survey type.
	 * @param {I.SurveyType} type - The survey type.
	 * @returns {any} The survey state.
	 */
	getSurvey (type: I.SurveyType) {
		const obj = this.get('survey') || {};
		return obj[type] || {};
	};

	/**
	 * Sets the survey state for a survey type.
	 * @param {I.SurveyType} type - The survey type.
	 * @param {any} param - The survey parameters.
	 */
	setSurvey (type: I.SurveyType, param: any) {
		const obj = this.get('survey') || {};
		obj[type] = Object.assign(obj[type] || {}, param);
		this.set('survey', obj);
	};

	/**
	 * Initializes pinned types in storage.
	 */
	initPinnedTypes () {
		const list = this.getPinnedTypes();

		if (list.length) {
			return;
		};

		const keys = [
			J.Constant.typeKey.page,
			J.Constant.typeKey.task,
			J.Constant.typeKey.collection,
			J.Constant.typeKey.set,
			J.Constant.typeKey.bookmark,
			J.Constant.typeKey.note,
			J.Constant.typeKey.project,
			J.Constant.typeKey.human,
		];

		for (const key of keys) {
			const type = S.Record.getTypeByKey(key);
			if (type) {
				list.push(type.id);
			};
		};

		this.setPinnedTypes(list);
	};

	/**
	 * Adds a pinned type by ID.
	 * @param {string} id - The type ID to pin.
	 */
	addPinnedType (id: string) {
		const list = this.getPinnedTypes();

		if (!id) {
			return list;
		};

		list.unshift(id);
		this.setPinnedTypes(list);
		return list;
	};

	/**
	 * Removes a pinned type by ID.
	 * @param {string} id - The type ID to remove.
	 */
	removePinnedType (id: string) {
		const list = this.getPinnedTypes();

		if (!id) {
			return list;
		};

		this.setPinnedTypes(list.filter(it => it != id));
		return list;
	};

	/**
	 * Sets the list of pinned types.
	 * @param {string[]} list - The list of type IDs to pin.
	 */
	setPinnedTypes (list: string[]) {
		this.set('pinnedTypes', this.checkArray([ ...new Set(list) ]));
	};

	/**
	 * Gets the list of pinned types.
	 * @returns {string[]} The list of pinned type IDs.
	 */
	getPinnedTypes () {
		return this.checkArray(this.get('pinnedTypes') || []);
	};

	/**
	 * Checks if an array is valid (non-empty).
	 * @param {any} a - The array to check.
	 * @returns {boolean} True if valid.
	 */
	checkArray (a) {
		if (('object' != typeof(a)) || !U.Common.hasProperty(a, 'length')) {
			return [];
		};
		return a;
	};

	/**
	 * Logs out the current user and clears storage.
	 */
	logout () {
		const keys = [ 
			'accountId',
			'pin',
		];

		keys.forEach(key => this.delete(key));
	};

	/**
	 * Sets chat data for a chat ID.
	 * @param {string} id - The chat ID.
	 * @param {any} obj - The chat data to set.
	 */
	setChat (id: string, obj: any) {
		if (!id) {
			return;
		};

		const map = this.get('chat') || {};

		map[id] = Object.assign(map[id] || {}, obj);
		this.set('chat', map);
	};

	/**
	 * Gets chat data for a chat ID.
	 * @param {string} id - The chat ID.
	 * @returns {any} The chat data.
	 */
	getChat (id: string) {
		const map = this.get('chat') || {};
		return map[id] || {};
	};

	/**
	 * Gets the list of keyboard shortcuts from storage.
	 * @returns {any} The shortcuts data.
	 */
	getShortcuts () {
		return this.get('shortcuts') || {};
	};

	/**
	 * Sets the list of keyboard shortcuts in storage.
	 * @param {any} data - The shortcuts data to set.
	 */
	setShortcuts (data: any) {
		this.set('shortcuts', data);
		keyboard.initShortcuts();
	};

	/**
	 * Updates a keyboard shortcut by ID.
	 * @param {string} id - The shortcut ID.
	 * @param {string[]} keys - The new keys for the shortcut.
	 */
	updateShortcuts (id: string, keys: string[]) {
		const list = this.getShortcuts();
		this.setShortcuts({ ...list, [id]: keys });
	};

	/**
	 * Resets a keyboard shortcut by ID to default.
	 * @param {string} id - The shortcut ID.
	 */
	resetShortcut (id: string) {
		const list = this.getShortcuts();

		delete(list[id]);
		this.setShortcuts(list);
	};

	/**
	 * Removes a keyboard shortcut by ID.
	 * @param {string} id - The shortcut ID.
	 */
	removeShortcut (id: string) {
		this.updateShortcuts(id, []);
	};

	/**
	 * Resets all keyboard shortcuts to default.
	 */
	resetShortcuts () {
		this.delete('shortcuts');
		keyboard.initShortcuts();
	};
	
};

export default new Storage();