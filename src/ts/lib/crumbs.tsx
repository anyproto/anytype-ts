import { I, C, Util, Storage } from 'ts/lib';
import { blockStore } from 'ts/store';

interface CrumbsObject {
	ids: string[];
};

const PREFIX = 'crumbs-';

class Crumbs {
	
	key (key: string): string {
		return Util.toCamelCase(PREFIX + key);
	};
	
	init (): void {
		if (!blockStore.breadcrumbs) {
			C.BlockOpenBreadcrumbs((message: any) => {
				blockStore.breadcrumbsSet(message.blockId);
			});
		};
	};
	
	get (key: I.CrumbsType): CrumbsObject {
		let obj = (Storage.get(this.key(key)) || { ids: [] }) as CrumbsObject;
		obj.ids = obj.ids || [];
		return obj;
	};
	
	add (key: I.CrumbsType, id: string, callBack?: () => void): CrumbsObject {
		if (!id) {
			return;
		};
		
		let k = this.key(key);
		let obj = this.get(key);
		
		obj.ids = obj.ids || [];
		obj.ids.push(id);
		
		this.save(key, obj, callBack);
		return obj;
	};
	
	cut (key: I.CrumbsType, index: number, callBack?: () => void): CrumbsObject {
		let k = this.key(key);
		let obj = this.get(key);
		
		Storage.set(k + '-prev', obj, true);
		
		obj.ids = obj.ids || [];
		obj.ids = obj.ids.slice(0, index);
		
		this.save(key, obj, callBack);
		return obj;
	};
	
	restore (key: I.CrumbsType, callBack?: () => void): CrumbsObject {
		let k = this.key(key);
		let obj = this.get(key);
		let prev: CrumbsObject = (Storage.get(k + '-prev') || { ids: [] }) as CrumbsObject;
		
		Storage.set(k + '-prev', obj, true);
		this.save(key, obj, callBack);
		return obj;
	};
	
	save (key: I.CrumbsType, obj: CrumbsObject, callBack?: () => void) {
		Storage.set(this.key(key), obj, true);
		
		if (blockStore.breadcrumbs) {
			C.BlockSetBreadcrumbs(blockStore.breadcrumbs, obj.ids, (message: any) => {
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
		Storage.delete(this.key(key));
	};
		
};

export let crumbs: Crumbs = new Crumbs();