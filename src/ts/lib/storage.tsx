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
		let ret = ''
		try { ret = JSON.parse(o); } catch (e) {};
		return ret;
	};
	
	set (key: string, obj: any, del?: boolean): void {
		if (del) {
			this.delete(key);
		};
		
		let o = this.get(key);
		if ('object' == typeof(o)) {
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
		const obj = this.get('toggle') || {};
		
		obj[rootId] = obj[rootId] || [];
		if (value) {
			obj[rootId].push(id);
		} else {
			obj[rootId] = obj[rootId].filter((it: string) => { return it != id; });
		};
		obj[rootId] = [ ...new Set(obj[rootId]) ];

		this.set('toggle', obj, true);
	};

	checkToggle (rootId: string, id: string): boolean {
		const map = this.get('toggle') || {};
		const list = map[rootId] || [];
		return list.indexOf(id) >= 0;
	};

	logout () {
		this.delete('accountId');
		this.delete('toggle');
		this.delete('pageId');
		this.delete('hello');
		this.delete('popupNewBlock');
	};
	
};

export default new Storage();