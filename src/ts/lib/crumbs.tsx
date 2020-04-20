import { I, C, Util, Storage } from 'ts/lib';
import { blockStore } from 'ts/store';

const PREFIX = 'crumbs-';

class Crumbs {
	
	key (key: string) {
		return Util.toCamelCase(PREFIX + key);
	};
	
	init (key: I.CrumbsType): void {
		Storage.set(this.key(key), { ids: [] });
	};
	
	get (key: I.CrumbsType): any {
		let obj = Storage.get(this.key(key)) || {};
		obj.ids = obj.ids || [];
		return obj;
	};
	
	set (key: I.CrumbsType, id: string) {
		if (!id) {
			return;
		};
		
		let k = this.key(key);
		let obj: any = Storage.get(k) || {};
		
		obj.ids = obj.ids || [];
		obj.ids.push(id);
		
		Storage.delete(k);
		Storage.set(k, obj);

		return obj;
	};
	
	cut (key: I.CrumbsType, index: number) {
		if (!blockStore.breadcrumbs) {
			return;
		};
		
		let k = this.key(key);
		let obj: any = Storage.get(k) || {};
		
		obj.ids = obj.ids || [];
		obj.ids = obj.ids.slice(0, index);
		
		Storage.set(k, obj);
		C.BlockSetBreadcrumbs(blockStore.breadcrumbs, obj.ids);
		
		return obj;
	};
	
	delete (key: I.CrumbsType) {
		Storage.delete(this.key(key));
	};
		
};

export let crumbs: Crumbs = new Crumbs();