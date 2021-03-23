import { I, C, Util, Storage } from 'ts/lib';
import { blockStore } from 'ts/store';

interface CrumbsObject {
	ids: string[];
};

const LIMIT_RECENT = 100;
const ID = 'crumbs';

class Crumbs {
	
	init (): void {
		if (!blockStore.breadcrumbs) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.breadcrumbsSet(message.blockId);
			});
		};
	};

	getKey (key: I.CrumbsType): string {
		return Util.toCamelCase(key);
	};

	getObj () {
		return Storage.get(ID) || {};
	};
	
	get (key: I.CrumbsType, suffix?: string): CrumbsObject {
		const obj = this.getObj();
		const item = (obj[this.getKey(key) + (suffix || '')] || {}) as CrumbsObject;

		item.ids = item.ids || [];
		return item;
	};
	
	add (key: I.CrumbsType, id: string, callBack?: () => void): CrumbsObject {
		if (!id) {
			return;
		};
		
		const item = this.get(key);

		this.savePrev(key, item);
		
		item.ids.push(id);
		this.save(key, item, callBack);

		return item;
	};
	
	cut (key: I.CrumbsType, index: number, callBack?: () => void): CrumbsObject {
		let item = this.get(key);
		
		this.savePrev(key, item);
		
		item.ids = item.ids.slice(0, index);
		this.save(key, item, callBack);

		return item;
	};
	
	restore (key: I.CrumbsType, callBack?: () => void): CrumbsObject {
		const item = this.get(key);
		const prev = this.get(key, 'Prev');

		this.savePrev(key, item);
		this.save(key, prev, callBack);
		return item;
	};

	savePrev (key: I.CrumbsType, item: any) {
		const obj = this.getObj();

		obj[this.getKey(key) + 'Prev'] = item;
		Storage.set(ID, obj, true);
	};

	save (key: I.CrumbsType, item: CrumbsObject, callBack?: () => void) {
		if (!item) {
			return;
		};

		const obj = this.getObj();
		obj[this.getKey(key)] = item;
		Storage.set(ID, obj, true);

		let id = '';
		if (key == I.CrumbsType.Page) {
			id = blockStore.breadcrumbs;
		};

		if (id) {
			C.BlockSetBreadcrumbs(id, item.ids, (message: any) => {
				if (message.error.code) {
					this.delete(key);
				};
				
				if (callBack) {
					callBack();
				};
			});
		};
	};
	
	delete (key: I.CrumbsType) {
		const obj = this.getObj();
		delete(obj[this.getKey(key)]);
		Storage.set(ID, obj, true);
	};

	addCrumbs (id: string) {
		let cr = this.get(I.CrumbsType.Page);
		let lastTargetId = '';
		
		if (cr.ids.length) {
			lastTargetId = cr.ids[cr.ids.length - 1];
		};
		if (!lastTargetId || (lastTargetId != id)) {
			cr = this.add(I.CrumbsType.Page, id);
		};
		this.save(I.CrumbsType.Page, cr);
	};

	addRecent (id: string) {
		if (!id) {
			return;
		};

		let item = this.get(I.CrumbsType.Recent);

		item = this.add(I.CrumbsType.Recent, id);
		item.ids = Util.arrayUnique(item.ids);

		if (item.ids.length > LIMIT_RECENT) {
			item.ids = item.ids.slice(item.ids.length - LIMIT_RECENT, item.ids.length);
		};

		this.save(I.CrumbsType.Recent, item);
	};
		
};

export let crumbs: Crumbs = new Crumbs();