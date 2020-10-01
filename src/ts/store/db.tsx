import { observable, action, computed, set, intercept, decorate } from 'mobx';

class DbStore {
	public dataMap: Map<string, any> = observable.map(new Map());
	public metaMap: Map<string, any> = new Map();

	@action
	setData (blockId: string, list: any[]) {
		list = list.map((it: any) => {
			it = observable(it);
			intercept(it as any, (change: any) => {
				if (change.newValue === it[change.name]) {
					return null;
				};
				return change;
			});
			return it;
		});
		this.dataMap.set(blockId, observable.array(list));
	};

	@action
	setMeta (blockId: string, meta: any) {
		const data = this.metaMap.get(blockId);

		if (data) {
			set(data, meta);
		} else {
			meta.offset = 0;
			meta = observable(meta);

			intercept(meta as any, (change: any) => {
				if (change.newValue === meta[change.name]) {
					return null;
				};
				return change;
			});

			this.metaMap.set(blockId, meta);
		};
	};

	@action
	addRecord (blockId: string, obj: any) {
		const data = this.getData(blockId);
		data.push(obj);
	};

	@action
	updateRecord (blockId: string, obj: any) {
		const data = this.getData(blockId);
		const record = data.find((it: any) => { return it.id == obj.id; });
		if (!record) {
			return;
		};

		set(record, obj);
	};

	getMeta (blockId: string) {
		return this.metaMap.get(blockId) || {};
	};

	getData (blockId: string) {
		return this.dataMap.get(blockId) || [];
	};

};

export let dbStore: DbStore = new DbStore();