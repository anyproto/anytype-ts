import { I, S, U, keyboard } from 'Lib';

const electron = U.Common.getElectron();

const ACCOUNT_KEYS = [
	'spaceId',
];

const SPACE_KEYS = [
	'toggle',
	'lastOpenedSimple',
	'scroll',
	'defaultType',
	'chat',
	'popupSearch',
	'focus',
	'openUrl',
	'graphData',
	'recentEditMode',
	'widgetSections',
];

const LOCAL_KEYS = [
	'toggle',
	'scroll',
	'focus',
	'graphData',
	'progress',
	'updateBanner',
	'lastOpenedSimple',
	'sidebarData',
];

const Api = {
	get: (key: string, isLocal: boolean) => {
		let ret = {};
		if (electron.storeGet && !isLocal) {
			ret = electron.storeGet(key);
		} else {
			ret = Api.parse(localStorage.getItem(key));
		};
		return ret;
	},

	set: (key: string, obj: any, isLocal: boolean) => {
		if (electron.storeSet && !isLocal) {
			electron.storeSet(key, obj);
		} else {
			localStorage.setItem(key, JSON.stringify(obj));
		};
	},

	delete: (key: string, isLocal: boolean) => {
		if (electron.storeDelete && !isLocal) {
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
		try { 
			ret = JSON.parse(s); 
		} catch (e) { 
			console.error(e); 
		};
		return ret;
	},
};

class Storage {

	/**
	 * Checks if a key is a local key.
	 * @param {string} key - The key to check.
	 * @returns {boolean} True if the key is a local key.
	 */
	isLocal (key: string): boolean {
		return LOCAL_KEYS.includes(key);
	};
	
	/**
	 * Gets a value from storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 * @param {boolean} isLocal - Whether to get from local storage.
	 * @returns {any} The stored value.
	 */
	get (key: string, isLocal?: boolean): any {
		if (!key) {
			console.log('[Storage].get: key not specified');
			return;
		};

		let o = Api.get(key, isLocal);
		if (undefined === o) {
			o = Api.parse(String(localStorage.getItem(key) || ''));
		};

		if (this.isSpaceKey(key)) {
			if (o) {
				localStorage.removeItem(key);
				Api.delete(key, isLocal);
				this.set(key, o, isLocal);
			};

			return this.getSpaceKey(key, isLocal);
		} else 
		if (this.isAccountKey(key)) {
			if (o) {
				localStorage.removeItem(key);
				this.set(key, o, isLocal);
			};

			return this.getAccountKey(key, isLocal);
		} else {
			return o;
		};
	};

	/**
	 * Sets a value in storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 * @param {any} obj - The value to store.
	 * @param {boolean} isLocal - Whether to store locally.
	 */
	set (key: string, obj: any, isLocal?: boolean): void {
		obj = U.Common.objectCopy(obj);

		if (!key) {
			console.log('[Storage].set: key not specified');
			return;
		};

		if (this.isSpaceKey(key)) {
			this.setSpaceKey(key, obj, isLocal);
		} else 
		if (this.isAccountKey(key)) {
			this.setAccountKey(key, obj, isLocal);
		} else {
			Api.set(key, obj, isLocal);
		};
	};
	
	/**
	 * Deletes a value from storage by key, handling space and account keys.
	 * @param {string} key - The storage key.
	 * @param {boolean} isLocal - Whether to delete from local storage.
	 */
	delete (key: string, isLocal?: boolean): void {
		if (this.isSpaceKey(key)) {
			this.deleteSpaceKey(key, isLocal);
		} else 
		if (this.isAccountKey(key)) {
			this.deleteAccountKey(key, isLocal);
		} else {
			Api.delete(key, isLocal);
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
	 * @param {boolean} isLocal - Whether to set in local storage.
	 * @param {string} [spaceId] - The space ID (optional).
	 */
	setSpaceKey (key: string, value: any, isLocal: boolean, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(isLocal, spaceId);

		if (spaceId) {
			obj[spaceId][key] = value;
		};

		this.setSpace(obj, isLocal);
	};

	/**
	 * Gets a space key value for a specific space.
	 * @param {string} key - The space key.
	 * @param {boolean} isLocal - Whether to get from local storage.
	 * @param {string} [spaceId] - The space ID (optional).
	 * @returns {any} The value for the space key.
	 */
	getSpaceKey (key: string, isLocal: boolean, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(isLocal, spaceId);

		return obj[spaceId][key];
	};

	/**
	 * Deletes a space key value for a specific space.
	 * @param {string} key - The space key.
	 * @param {string} [spaceId] - The space ID (optional).
	 */
	deleteSpaceKey (key: string, isLocal: boolean, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(isLocal, spaceId);

		delete(obj[spaceId][key]);
		this.setSpace(obj, isLocal);
	};

	/**
	 * Gets the space object for a given space ID.
	 * @param {boolean} isLocal - Whether to get from local storage.
	 * @param {string} [spaceId] - The space ID (optional).
	 * @returns {any} The space object.
	 */
	getSpace (isLocal: boolean, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.get('space', isLocal) || {};

		obj[spaceId] = obj[spaceId] || {};

		return obj;
	};

	/**
	 * Sets the space object in storage.
	 * @param {any} obj - The space object to set.
	 * @param {boolean} isLocal - Whether to set in local storage.
	 */
	setSpace (obj: any, isLocal: boolean) {
		this.set('space', obj, isLocal);
	};

	/**
	 * Deletes a space by ID from storage.
	 * @param {string} id - The space ID to delete.
	 */
	deleteSpace (id: string, isLocal: boolean) {
		const obj = this.getSpace(isLocal);

		delete(obj[id]);

		this.setSpace(obj, isLocal);
	};

	/**
	 * Clears all deleted spaces from storage.
	 */
	clearDeletedSpaces (isLocal: boolean) {
		const keys = Object.keys(this.getSpace(isLocal));
		keys.forEach(key => {
			const spaceview = U.Space.getSpaceviewBySpaceId(key);
			if (spaceview?.isAccountDeleted) {
				this.deleteSpace(key, isLocal);
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
	setAccountKey (key: string, value: any, isLocal: boolean) {
		const obj = this.getAccount(isLocal);
		const accountId = this.getAccountId();

		if (accountId) {
			obj[accountId][key] = value;
		};

		this.setAccount(obj, isLocal);
	};

	/**
	 * Gets an account key value for the current account.
	 * @param {string} key - The account key.
	 * @returns {any} The value for the account key.
	 */
	getAccountKey (key: string, isLocal: boolean) {
		const obj = this.getAccount(isLocal);
		const accountId = this.getAccountId();

		return obj[accountId][key];
	};

	/**
	 * Gets the account object from storage.
	 * @returns {any} The account object.
	 */
	getAccount (isLocal: boolean) {
		const obj = this.get('account', isLocal) || {};
		const accountId = this.getAccountId();

		obj[accountId] = obj[accountId] || {};

		return obj;
	};

	/**
	 * Sets the account object in storage.
	 * @param {any} obj - The account object to set.
	 */
	setAccount (obj: any, isLocal: boolean) {
		this.set('account', obj, isLocal);
	};

	/**
	 * Deletes an account by ID from storage.
	 * @param {string} id - The account ID to delete.
	 */
	deleteAccount (id: string, isLocal: boolean) {
		const obj = this.getAccount(isLocal);

		delete(obj[id]);

		this.setAccount(obj, isLocal);
	};

	/**
	 * Deletes an account key for the current account.
	 * @param {string} key - The account key to delete.
	 */
	deleteAccountKey (key: string, isLocal: boolean) {
		const obj = this.getAccount(isLocal);
		const accountId = this.getAccountId();

		delete(obj[accountId][key]);

		this.setAccount(obj, isLocal);
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
	 * Gets the last opened objects from storage.
	 * @returns {any} The last opened objects.
	 */
	getLastOpened () {
		return this.get('lastOpenedSimple', this.isLocal('lastOpenedSimple')) || {};
	};

	/**
	 * Sets the last opened object for a window.
	 * @param {any} param - The parameters to set.
	 */
	setLastOpened (param: any) {
		this.set('lastOpenedSimple', param, this.isLocal('lastOpenedSimple'));
	};

	/**
	 * Sets a toggle value for a block in a root object.
	 * @param {string} rootId - The root object ID.
	 * @param {string} id - The block ID.
	 * @param {boolean} value - The toggle value.
	 */
	setToggle (rootId: string, id: string, value: boolean) {
		let obj = this.get('toggle', this.isLocal('toggle')) || {};
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

		this.set('toggle', obj, this.isLocal('toggle'));
		return obj;
	};

	/**
	 * Gets the toggle values for a root object.
	 * @param {string} rootId - The root object ID.
	 * @returns {any} The toggle values.
	 */
	getToggle (rootId: string) {
		const obj = this.get('toggle', this.isLocal('toggle')) || {};
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
		const obj = this.get('toggle', this.isLocal('toggle')) || {};

		delete(obj[rootId]);
		this.set('toggle', obj, this.isLocal('toggle'));
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

		const obj = this.get('scroll', this.isLocal('scroll')) || {};
		try {
			obj[key] = obj[key] || {};
			obj[key][rootId] = Number(scroll) || 0;

			this.set('scroll', obj, this.isLocal('scroll'));
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

		const obj = this.get('scroll', this.isLocal('scroll')) || {};
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
		const obj = this.get('focus', this.isLocal('focus')) || {};

		obj[rootId] = state;
		this.set('focus', obj, this.isLocal('focus'));
		return obj;
	};

	/**
	 * Gets the focus state for a root object.
	 * @param {string} rootId - The root object ID.
	 * @returns {I.FocusState} The focus state.
	 */
	getFocus (rootId: string): I.FocusState {
		const obj = this.get('focus', this.isLocal('focus')) || {};
		return obj[rootId];
	};

	/**
	 * Sets onboarding state for a key.
	 * @param {string} key - The onboarding key.
	 */
	setOnboarding (key: string) {
		const keys = this.get('onboarding', this.isLocal('onboarding')) || [];

		if (!this.getOnboarding(key)) {
			keys.push(key);
		};

		this.set('onboarding', keys, this.isLocal('onboarding'));
		return keys;
	};

	/**
	 * Resets onboarding
	 */
	clearOnboarding () {
		this.set('onboarding', [], this.isLocal('onboarding'));
	};

	/**
	 * Gets onboarding state for a key.
	 * @param {string} key - The onboarding key.
	 * @returns {any} The onboarding state.
	 */
	getOnboarding (key: string) {
		return (this.get('onboarding', this.isLocal('onboarding')) || []).includes(key);
	};

	/**
	 * Gets the highlight state for a key.
	 * @param {string} key - The highlight key.
	 * @returns {boolean} The highlight state.
	 */
	getHighlight (key: string): boolean {
		const highlights = this.get('highlights', this.isLocal('highlights')) || {};

		return Boolean(highlights[key]) || false;
	};

	/**
	 * Sets the highlight state for a key.
	 * @param {string} key - The highlight key.
	 * @param {boolean} value - The highlight value.
	 */
	setHighlight (key: string, value: boolean) {
		const highlights = this.get('highlights', this.isLocal('highlights')) || {};

		highlights[key] = value;

		this.set('highlights', highlights, this.isLocal('highlights'));
	};

	/**
	 * Gets the survey state for a survey type.
	 * @param {I.SurveyType} type - The survey type.
	 * @returns {any} The survey state.
	 */
	getSurvey (type: I.SurveyType) {
		const obj = this.get('survey', this.isLocal('survey')) || {};
		return obj[type] || {};
	};

	/**
	 * Sets the survey state for a survey type.
	 * @param {I.SurveyType} type - The survey type.
	 * @param {any} param - The survey parameters.
	 */
	setSurvey (type: I.SurveyType, param: any) {
		const obj = this.get('survey', this.isLocal('survey')) || {};
		obj[type] = Object.assign(obj[type] || {}, param);
		this.set('survey', obj, this.isLocal('survey'));
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

		keys.forEach(key => this.delete(key, this.isLocal(key)));
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

		const map = this.get('chat', this.isLocal('chat')) || {};

		map[id] = Object.assign(map[id] || {}, obj);
		this.set('chat', map, false);
	};

	/**
	 * Gets chat data for a chat ID.
	 * @param {string} id - The chat ID.
	 * @returns {any} The chat data.
	 */
	getChat (id: string) {
		const map = this.get('chat', this.isLocal('chat')) || {};
		return map[id] || {};
	};

	/**
	 * Gets the list of keyboard shortcuts from storage.
	 * @returns {any} The shortcuts data.
	 */
	getShortcuts () {
		return this.get('shortcuts', this.isLocal('shortcuts')) || {};
	};

	/**
	 * Sets the list of keyboard shortcuts in storage.
	 * @param {any} data - The shortcuts data to set.
	 */
	setShortcuts (data: any) {
		this.set('shortcuts', data, this.isLocal('shortcuts'));
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
		this.delete('shortcuts', this.isLocal('shortcuts'));
		keyboard.initShortcuts();
	};

	setGraphData (data: any) {
		const isLocal = this.isLocal('graphData');
		const obj = this.get('graphData', isLocal) || {};

		this.set('graphData', Object.assign(obj, data), isLocal);
	};

	getGraphData () {
		const obj = this.get('graphData', this.isLocal('graphData')) || {};

		obj.zoom = obj.zoom || {};
		obj.zoom.k = Number(obj.zoom.k) || 1;
		obj.zoom.x = Number(obj.zoom.x) || 0;
		obj.zoom.y = Number(obj.zoom.y) || 0;

		return obj;
	};

	clearOldKeys () {
		const spaces = U.Space.getList();

		spaces.forEach(space => {
			this.deleteSpaceKey('lastOpenedObject', false, space.targetSpaceId);
		});
	};
	
};

export default new Storage();
