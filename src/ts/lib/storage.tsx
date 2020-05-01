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
		return JSON.parse(o);
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
	};
	
};

export default new Storage();