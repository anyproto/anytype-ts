import { I, C, Util, Storage } from 'ts/lib';
import { blockStore } from 'ts/store';

interface CrumbsObject {
	ids: string[];
};

const LIMIT_PAGE = 10;
const LIMIT_RECENT = 100;
const ID = 'crumbs';

class Crumbs {
	
	init (): void {
		if (!blockStore.breadcrumbs) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.breadcrumbsSet(message.blockId);
			});
		};

		if (!blockStore.recent) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.recentSet(message.blockId);
				this.save(I.CrumbsType.Recent, this.get(I.CrumbsType.Recent));
			});
		};
	};

	getKey (key: I.CrumbsType, suffix?: string): string {
		suffix = String(suffix || '');
		return Util.toCamelCase(key + (suffix ? '-' + suffix : ''));
	};

	getObj () {
		return Storage.get(ID) || {};
	};
	
	get (key: I.CrumbsType, suffix?: string): CrumbsObject {
		const obj = this.getObj();
		const item = (obj[this.getKey(key, suffix)] || {}) as CrumbsObject;

		item.ids = item.ids || [];
		return item;
	};
	
	add (key: I.CrumbsType, item: CrumbsObject, id: string, callBack?: () => void): CrumbsObject {
		if (!id) {
			return item;
		};
		
		this.savePrev(key, item);
		
		item.ids.push(id);
		this.save(key, item, callBack);

		return item;
	};
	
	cut (key: I.CrumbsType, index: number, callBack?: () => void): CrumbsObject {
		const item = this.get(key);
		
		this.savePrev(key, item);
		
		item.ids = item.ids.slice(0, index);
		this.save(key, item, callBack);

		return item;
	};
	
	restore (key: I.CrumbsType, callBack?: () => void): CrumbsObject {
		const item = this.get(key);
		const prev = this.get(key, 'prev');

		this.savePrev(key, item);
		this.save(key, prev, callBack);
		return item;
	};

	savePrev (key: I.CrumbsType, item: any) {
		const obj = this.getObj();

		obj[this.getKey(key, 'prev')] = item;
		Storage.set(ID, obj, true);
	};

	save (key: I.CrumbsType, item: CrumbsObject, callBack?: () => void) {
		if (!item) {
			return;
		};

		const obj = this.getObj();
		obj[this.getKey(key)] = item;
		Storage.set(ID, obj, true);

		let blockId = '';
		if (key == I.CrumbsType.Page) {
			blockId = blockStore.breadcrumbs;
		};
		if (key == I.CrumbsType.Recent) {
			blockId = blockStore.recent;
		};

		if (!blockId) {
			return;
		};

		C.BlockSetBreadcrumbs(blockId, item.ids, (message: any) => {
			if (message.error.code) {
				this.delete(key);
			};
			
			if (callBack) {
				callBack();
			};
		});
	};
	
	delete (key: I.CrumbsType) {
		const obj = this.getObj();
		delete(obj[this.getKey(key)]);
		Storage.set(ID, obj, true);
	};

	addPage (id: string) {
		let item = this.get(I.CrumbsType.Page);
		let lastTargetId = '';
		
		if (item.ids.length) {
			lastTargetId = item.ids[item.ids.length - 1];
		};
		if (!lastTargetId || (lastTargetId != id)) {
			item = this.add(I.CrumbsType.Page, item, id);
		};
		if (item.ids.length > LIMIT_PAGE) {
			item.ids = item.ids.slice(item.ids.length - LIMIT_PAGE, item.ids.length);
		};

		this.save(I.CrumbsType.Page, item);
	};

	addRecent (id: string) {
		if (!id) {
			return;
		};

		let item = this.get(I.CrumbsType.Recent);
		item.ids = item.ids.filter((it: string) => { return it != id; });
		item = this.add(I.CrumbsType.Recent, item, id);

		if (item.ids.length > LIMIT_RECENT) {
			item.ids = item.ids.slice(item.ids.length - LIMIT_RECENT, item.ids.length);
		};

		item.ids = Util.arrayUnique(item.ids);

		this.save(I.CrumbsType.Recent, item);
	};

	removeItems (key: I.CrumbsType, ids: string[]) {
		if (!ids || !ids.length) {
			return;
		};

		let item = this.get(key);
		item.ids = item.ids.filter((it: string) => { return ids.indexOf(it) < 0; });
		this.save(key, item);
	};
		
};

export let crumbs: Crumbs = new Crumbs();