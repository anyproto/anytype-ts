const TTL = 300 * 1000;

class Cache {

	cache: any = {};
	
	set (key: string, value: any, ttl?: number): void {
		this.clear();
		this.cache[key] = {
			value: value,
			ttl: (new Date()).getTime() + (ttl || TTL)
		};
	};
	
	get (key: string): any {
		let item = this.cache[key];
		if (item && (item.ttl >= (new Date()).getTime())) {
			return item.value;
		} else {
			return '';
		};
	};
	
	clear (): void {
		for (let k in this.cache) {
			let item = this.cache[k];
			if (item.ttl < (new Date()).getTime()) {
				console.log('[Cache] clear', k);
				delete(this.cache[k]);
			};
		};
	};
	
};

export let cache: Cache = new Cache();