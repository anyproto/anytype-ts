import { observable, action, computed, set, intercept, toJS } from 'mobx';
import { I, Util } from 'ts/lib';

const Constant = require('json/constant.json');

class DetailStore {

	public map: Map<string, Map<string, any>> = new Map();

	@action
	set (rootId: string, details: any[]) {
		let map = this.map.get(rootId);

		if (!map) {
			map = observable.map(new Map());
			intercept(map as any, (change: any) => {
				const item = map.get(change.name);
				return Util.objectCompare(change.newValue, item) ? null :change;
			});
		};

		for (let item of details) {
			const object = observable.object(toJS(Object.assign(map.get(item.id) || {}, item.details)));
			intercept(object as any, (change: any) => { return Util.intercept(object, change); });
			map.set(item.id, object);
		};

		this.map.set(rootId, map);
	};

	@action
	update (rootId: string, item: any, clear: boolean) {
		if (!item.id || !item.details) {
			return;
		};

		let map = this.map.get(rootId);
		let create = false;

		if (!map) {
			map = observable.map(new Map());
			create = true;
		} else 
		if (clear) {
			map.delete(item.id);
		};

		const object = observable.object(toJS(Object.assign(map.get(item.id) || {}, item.details)));
		intercept(object as any, (change: any) => { return Util.intercept(object, change); });
		map.set(item.id, object);

		if (create) {
			intercept(map as any, (change: any) => {
				const item = map.get(change.name);
				return Util.objectCompare(change.newValue, item) ? null :change;
			});
			this.map.set(rootId, map);
		};
	};

	get (rootId: string, id: string): any {
		const map = this.map.get(rootId) || new Map();
		const item = map.get(id) || { _objectEmpty_: true };
		return {
			...item,
			id: id,
			name: String(item.name || Constant.default.name || ''),
			layout: Number(item.layout) || I.ObjectLayout.Page,
			layoutAlign: Number(item.layoutAlign) || I.BlockAlign.Left,
		};
	};

	clear (rootId: string) {
		this.map.delete(rootId);
	};

	clearAll () {
		this.map = new Map();
	};

};

export let detailStore: DetailStore = new DetailStore();
