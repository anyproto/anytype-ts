class Storage {
	
	storage: any = null;
	
	constructor () {
		this.storage = localStorage;
	};
	
	get (key: string): any {
		let o = String(this.storage[key] || '');
		if (!o) {
			return false;
		};
		return JSON.parse(o);
	};
	
	set (key: string, obj: any): void {
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
	
};

export default new Storage();