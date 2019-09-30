const TTL = 300 * 1000;

class Cache {

	cache: any = {};
	
	set (key: string, value: string): void {
		this.clear();
		this.cache[key] = {
			value: value,
			time: (new Date()).getTime()
		};
	};
	
	get (key: string): string {
		let item = this.cache[key];
		if (item && (item.time >= (new Date()).getTime() - TTL)) {
			return String(item.value || '');
		} else {
			return '';	
		};
	};
	
	clear () {
		for (let k in this.cache) {
			let item = this.cache[k];
			if (item.time < (new Date()).getTime() - TTL) {
				console.log('[Cache] clear', k);
				delete(this.cache[k]);
			};
		};
	};
	
};

export let cache: Cache = new Cache();