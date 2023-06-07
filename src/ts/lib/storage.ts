import { UtilCommon } from 'Lib';

class Storage {
	
	storage: any = null;
	
	constructor () {
		this.storage = localStorage;
	};

	get (key: string): any {
		let o = String(this.storage[key] || '');
		if (!o) {
			return;
		};
		let ret = '';
		try { ret = JSON.parse(o); } catch (e) { /**/ };
		return ret;
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
			for (let i in obj) {
				o[i] = obj[i];
			};
		} else {
			o = obj;
		};
		this.storage[key] = JSON.stringify(o);
	};
	
	delete (key: string) {
		delete(this.storage[key]);
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

	deleteToggleId (rootId: string, id: string) {
		this.set('toggle', this.getToggle(rootId).filter(it => it != id), true);
	};

	setScroll (key: string, rootId: string, scroll: number) {
		const obj = this.get('scroll') || {};
		obj[key] = obj[key] || {};
		obj[key][rootId] = Number(scroll) || 0;
		this.set('scroll', obj, true);
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

	logout () {
		const keys = [ 
			'accountId', 
			'scroll', 
			'toggle', 
			'crumbs', 
			'tabIndex', 
			'tabStore', 
			'linkSettings', 
			'graph',
			'gateway',
			'dataPath',
			'writing',
			'timezone',
		];

		keys.forEach(key => this.delete(key));
	};
	
};

export default new Storage();