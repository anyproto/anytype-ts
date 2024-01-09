import { I, UtilCommon } from 'Lib';
import { commonStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

const SPACE_KEYS = [
	'toggle',
	'lastOpened',
	'scroll',
	'defaultType',
	'pinnedTypes',
];

class Storage {
	
	storage: any = null;
	
	constructor () {
		this.storage = localStorage;
	};

	get (key: string): any {
		const o = String(this.storage[key] || '');

		if (this.isSpaceKey(key)) {
			if (o) {
				delete(this.storage[key]);
				this.set(key, this.parse(o), true);
			};

			return this.getSpaceKey(key);
		} else {
			return this.parse(o);
		};
	};

	set (key: string, obj: any, del?: boolean): void {
		if (!key) {
			console.log('[Storage].set: key not specified');
			return;
		};

		if (del) {
			this.delete(key);
		};
		
		let o = this.get(key);
		if (typeof o === 'object') {
			for (const i in obj) {
				o[i] = obj[i];
			};
		} else {
			o = obj;
		};

		if (this.isSpaceKey(key)) {
			this.setSpaceKey(key, o);
		} else {
			this.storage[key] = JSON.stringify(o);
		};
	};
	
	delete (key: string) {
		if (this.isSpaceKey(key)) {
			const obj = this.getSpace();

			delete(obj[commonStore.space][key]);

			this.setSpace(obj);
		} else {
			delete(this.storage[key]);
		};
	};

	isSpaceKey (key: string): boolean {
		return SPACE_KEYS.includes(key);
	};

	setSpaceKey (key: string, value: any) {
		const obj = this.getSpace();

		obj[commonStore.space][key] = value;

		this.setSpace(obj);
	};

	getSpaceKey (key: string) {
		const obj = this.getSpace();
		return obj[commonStore.space][key];
	};

	getSpace () {
		const obj = this.get('space') || {};

		obj[commonStore.space] = obj[commonStore.space] || {};

		return obj;
	};

	setSpace (obj: any) {
		this.set('space', obj, true);
	};

	deleteSpace (id: string) {
		const obj = this.getSpace();

		delete(obj[id]);

		this.setSpace(obj);
	};

	setToggle (rootId: string, id: string, value: boolean) {
		let obj = this.get('toggle');
		if (!obj || UtilCommon.hasProperty(obj, 'length')) {
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
		this.set('toggle', obj, true);
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
		this.set('toggle', obj, true);
	};

	setScroll (key: string, rootId: string, scroll: number) {
		const obj = this.get('scroll') || {};
		try {
			obj[key] = obj[key] || {};
			obj[key][rootId] = Number(scroll) || 0;
			this.set('scroll', obj, true);
		} catch (e) { /**/ };
		return obj;
	};

	getScroll (key: string, rootId: string) {
		const obj = this.get('scroll') || {};
		return Number((obj[key] || {})[rootId]) || 0;
	};

	setOnboarding (key: string) {
		const keys = this.get('onboarding') || [];
		
		if (!this.getOnboarding(key)) {
			keys.push(key);
		};

		this.set('onboarding', keys, true);
		return keys;
	};

	getOnboarding (key: string) {
		return (this.get('onboarding') || []).includes(key);
	};

	getHighlight (key: string) {
		const highlights = this.get('highlights') || {};

		return highlights[key] || false;
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
		this.set('survey', obj, true);
	};

	initPinnedTypes () {
		const list = this.getPinnedTypes();

		if (list.length) {
			return;
		};

		const keys = [
			Constant.typeKey.note,
			Constant.typeKey.page,
			Constant.typeKey.task,
		];

		for (const key of keys) {
			const type = dbStore.getTypeByKey(key);
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
		list = list.slice(0, 50);

		this.set('pinnedTypes', this.checkArray([ ...new Set(list) ]), true);
	};

	getPinnedTypes () {
		return this.checkArray(this.get('pinnedTypes') || []);
	};

	checkArray (a) {
		if (('object' != typeof(a)) || !UtilCommon.hasProperty(a, 'length')) {
			return [];
		};
		return a;
	};

	logout () {
		const keys = [ 
			'accountId',
			'spaceId',
			'tabStore', 
			'graph',
			'pin',
		];

		keys.forEach(key => this.delete(key));
	};

	parse (s: string) {
		if (!s) {
			return;
		};

		let ret = '';
		try { ret = JSON.parse(s); } catch (e) { /**/ };
		return ret;
	};
	
};

export default new Storage();
