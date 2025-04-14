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

	isSpaceKey (key: string): boolean {
		return SPACE_KEYS.includes(key);
	};

	setSpaceKey (key: string, value: any, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);

		if (spaceId) {
			obj[spaceId][key] = value;
		};

		this.setSpace(obj);
	};

	getSpaceKey (key: string, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);
		return obj[spaceId][key];
	};

	deleteSpaceKey (key: string, spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.getSpace(spaceId);

		delete(obj[spaceId][key]);

		this.setSpace(obj);
	};

	getSpace (spaceId?: string) {
		spaceId = spaceId || S.Common.space;

		const obj = this.get('space') || {};

		obj[spaceId] = obj[spaceId] || {};

		return obj;
	};

	setSpace (obj: any) {
		this.set('space', obj);
	};

	deleteSpace (id: string) {
		const obj = this.getSpace();

		delete(obj[id]);

		this.setSpace(obj);
	};

	clearDeletedSpaces () {
		const keys = Object.keys(this.getSpace());

		keys.forEach(key => {
			const spaceview = U.Space.getSpaceviewBySpaceId(key);
			if (!spaceview) {
				this.deleteSpace(key);
			};
		});
	};

	isAccountKey (key: string): boolean {
		return ACCOUNT_KEYS.includes(key);
	};

	setAccountKey (key: string, value: any) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		if (accountId) {
			obj[accountId][key] = value;
		};

		this.setAccount(obj);
	};

	getAccountKey (key: string) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		return obj[accountId][key];
	};

	getAccount () {
		const obj = this.get('account') || {};
		const accountId = this.getAccountId();

		obj[accountId] = obj[accountId] || {};

		return obj;
	};

	setAccount (obj: any) {
		this.set('account', obj);
	};

	deleteAccount (id: string) {
		const obj = this.getAccount();

		delete(obj[id]);

		this.setAccount(obj);
	};

	deleteAccountKey (key: string) {
		const obj = this.getAccount();
		const accountId = this.getAccountId();

		delete(obj[accountId][key]);

		this.setAccount(obj);
	};

	getAccountId (): string {
		const { account } = S.Auth;
		return account ? account.id : '';
	};

	getPin () {
		return this.get('pin');
	};

	setLastOpened (windowId: string, param: any) {
		const obj = this.get('lastOpenedObject') || {};

		obj[windowId] = Object.assign(obj[windowId] || {}, param);
		this.set('lastOpenedObject', obj);
	};

	deleteLastOpenedByObjectId (objectIds: string[]) {
		objectIds = objectIds || [];

		const obj = this.get('lastOpenedObject') || {};
		const windowIds = [];

		for (const windowId in obj) {
			if (!obj[windowId] || objectIds.includes(obj[windowId].id)) {
				windowIds.push(windowId);
			};
		};

		this.deleteLastOpenedByWindowId(windowIds);
	};

	deleteLastOpenedByWindowId (windowIds: string[]) {
		windowIds = windowIds.filter(id => id != '1');

		if (!windowIds.length) {
			return;
		};

		const obj = this.get('lastOpenedObject') || {};

		windowIds.forEach(windowId => delete(obj[windowId]));
		this.set('lastOpenedObject', obj);
	};

	getLastOpened (windowId: string) {
		const obj = this.get('lastOpenedObject') || {};
		return obj[windowId] || obj[1] || null;
	};

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

	getToggle (rootId: string) {
		const obj = this.get('toggle') || {};
		return obj[rootId] || [];
	};

	checkToggle (rootId: string, id: string): boolean {
		return this.getToggle(rootId).includes(id);
	};

	deleteToggle (rootId: string) {
		const obj = this.get('toggle') || {};

		delete(obj[rootId]);
		this.set('toggle', obj);
	};

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

	getScroll (key: string, rootId: string, isPopup: boolean) {
		key = this.getScrollKey(key, isPopup);

		const obj = this.get('scroll') || {};
		return Number((obj[key] || {})[rootId]) || 0;
	};

	getScrollKey (key: string, isPopup: boolean) {
		return isPopup ? `${key}Popup` : key;
	};

	setFocus (rootId: string, state: I.FocusState) {
		const obj = this.get('focus') || {};

		obj[rootId] = state;
		this.set('focus', obj);
		return obj;
	};

	getFocus (rootId: string): I.FocusState {
		const obj = this.get('focus') || {};
		return obj[rootId];
	};

	setOnboarding (key: string) {
		const keys = this.get('onboarding') || [];
		
		if (!this.getOnboarding(key)) {
			keys.push(key);
		};

		this.set('onboarding', keys);
		return keys;
	};

	getOnboarding (key: string) {
		return (this.get('onboarding') || []).includes(key);
	};

	getHighlight (key: string): boolean {
		const highlights = this.get('highlights') || {};

		return Boolean(highlights[key]) || false;
	};

	setHighlight (key: string, value: boolean) {
		const highlights = this.get('highlights') || {};

		highlights[key] = value;

		this.set('highlights', highlights);
	};

	getSurvey (type: I.SurveyType) {
		const obj = this.get('survey') || {};
		return obj[type] || {};
	};

	setSurvey (type: I.SurveyType, param: any) {
		const obj = this.get('survey') || {};
		obj[type] = Object.assign(obj[type] || {}, param);
		this.set('survey', obj);
	};

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

	addPinnedType (id: string) {
		const list = this.getPinnedTypes();

		if (!id) {
			return list;
		};

		list.unshift(id);
		this.setPinnedTypes(list);
		return list;
	};

	removePinnedType (id: string) {
		const list = this.getPinnedTypes();

		if (!id) {
			return list;
		};

		this.setPinnedTypes(list.filter(it => it != id));
		return list;
	};

	setPinnedTypes (list: string[]) {
		this.set('pinnedTypes', this.checkArray([ ...new Set(list) ]));
	};

	getPinnedTypes () {
		return this.checkArray(this.get('pinnedTypes') || []);
	};

	checkArray (a) {
		if (('object' != typeof(a)) || !U.Common.hasProperty(a, 'length')) {
			return [];
		};
		return a;
	};

	logout () {
		const keys = [ 
			'accountId',
			'pin',
		];

		keys.forEach(key => this.delete(key));
	};

	setChat (id: string, obj: any) {
		if (!id) {
			return;
		};

		const map = this.get('chat') || {};

		map[id] = Object.assign(map[id] || {}, obj);
		this.set('chat', map);
	};

	getChat (id: string) {
		const map = this.get('chat') || {};
		return map[id] || {};
	};

	getShortcuts () {
		return this.get('shortcuts') || {};
	};

	setShortcuts (data: any) {
		this.set('shortcuts', data);
		keyboard.initShortcuts();
	};

	updateShortcuts (id: string, keys: string[]) {
		const list = this.getShortcuts();
		this.setShortcuts({ ...list, [id]: keys });
	};

	resetShortcut (id: string) {
		const list = this.getShortcuts();

		delete(list[id]);
		this.setShortcuts(list);
	};

	removeShortcut (id: string) {
		this.updateShortcuts(id, []);
	};

	resetShortcuts () {
		this.delete('shortcuts');
		keyboard.initShortcuts();
	};
	
};

export default new Storage();