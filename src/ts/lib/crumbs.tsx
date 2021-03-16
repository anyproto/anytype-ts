import { I, C, Util, Storage } from 'ts/lib';
import { blockStore } from 'ts/store';

interface CrumbsObject {
	ids: string[];
};

const PREFIX = 'crumbs-';
const LIMIT_RECENT = 100;

class Crumbs {
	
	getKey (key: string): string {
		return Util.toCamelCase(PREFIX + key);
	};
	
	init (): void {
		if (!blockStore.breadcrumbs) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.breadcrumbsSet(message.blockId);
			});
		};

		if (!blockStore.recent) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.recentSet(message.blockId);
			});
		};
	};
	
	get (key: I.CrumbsType): CrumbsObject {
		let obj = (Storage.get(this.getKey(key)) || { ids: [] }) as CrumbsObject;
		obj.ids = obj.ids || [];
		return obj;
	};
	
	add (key: I.CrumbsType, id: string, callBack?: () => void): CrumbsObject {
		if (!id) {
			return;
		};
		
		let k = this.getKey(key);
		let obj = this.get(key);

		Storage.set(k + 'Prev', obj, true);
		
		obj.ids = obj.ids || [];
		obj.ids.push(id);
		
		this.save(key, obj, callBack);
		return obj;
	};
	
	cut (key: I.CrumbsType, index: number, callBack?: () => void): CrumbsObject {
		let k = this.getKey(key);
		let obj = this.get(key);
		
		Storage.set(k + 'Prev', obj, true);
		
		obj.ids = obj.ids || [];
		obj.ids = obj.ids.slice(0, index);
		
		this.save(key, obj, callBack);
		return obj;
	};
	
	restore (key: I.CrumbsType, callBack?: () => void): CrumbsObject {
		let k = this.getKey(key);
		let obj = this.get(key);
		let prev: CrumbsObject = (Storage.get(k + 'Prev') || { ids: [] }) as CrumbsObject;
		
		Storage.set(k + 'Prev', obj, true);
		this.save(key, prev, callBack);
		return obj;
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

		let recent = this.get(I.CrumbsType.Recent);
		recent = this.add(I.CrumbsType.Recent, id);

		recent.ids = Util.arrayUnique(recent.ids);
		if (recent.ids.length > LIMIT_RECENT) {
			recent.ids = recent.ids.slice(recent.ids.length - LIMIT_RECENT, recent.ids.length);
		};
		this.save(I.CrumbsType.Recent, recent);
	};
	
	save (key: I.CrumbsType, obj: CrumbsObject, callBack?: () => void) {
		if (!obj) {
			return;
		};

		Storage.set(this.getKey(key), obj, true);

		let id = blockStore.breadcrumbs;
		if (key == I.CrumbsType.Recent) {
			id = blockStore.recent;
		};
		
		if (id) {
			C.BlockSetBreadcrumbs(id, obj.ids, (message: any) => {
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
		Storage.delete(this.getKey(key));
	};
		
};

export let crumbs: Crumbs = new Crumbs();