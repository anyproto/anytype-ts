/**
 * High-performance background image caching and prefetching engine.
 * Combines in-memory object URL caching, CacheStorage API, and idle pre-decoding
 * to eliminate image loading lag, flickering, and network latency across Anytype.
 */

const CACHE_NAME = 'anytype-image-cache-v1';
const ACCESS_KEY = 'anytype-image-cache-access-v1';
const MAX_MEMORY_ITEMS = 250;
const MAX_ACCESS_RECORDS = 2000;

// Entries not viewed for this long are removed from CacheStorage
const TTL_MS = 12 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const PERSIST_DEBOUNCE_MS = 2000;

class UtilImageCache {
	private memoryCache: Map<string, string> = new Map();
	private inFlightPromises: Map<string, Promise<string>> = new Map();
	private idleQueue: Set<string> = new Set();
	private isProcessingIdle = false;
	private lastAccess: Map<string, number> = new Map();
	private isPersistScheduled = false;

	constructor() {
		if (typeof window === 'undefined') {
			return;
		};

		this.loadAccessTimes();

		// Delay the first sweep so it never competes with app startup
		window.setTimeout(() => this.cleanupExpired(), 10000);
		window.setInterval(() => this.cleanupExpired(), CLEANUP_INTERVAL_MS);
	}

	/**
	 * Preloads and warms up an image URL in the high-speed cache.
	 * Returns a ready-to-use in-memory URL. Actual views (isBackground = false)
	 * refresh the last-access time used by the TTL cleanup.
	 */
	async preload(url: string, isBackground = false): Promise<string> {
		if (!url || typeof url !== 'string' || !url.startsWith('http')) {
			return url || '';
		}

		if (this.memoryCache.has(url)) {
			if (!isBackground) {
				this.markAccessed(url);
			};
			return this.memoryCache.get(url)!;
		}

		if (this.inFlightPromises.has(url)) {
			return this.inFlightPromises.get(url)!;
		}

		const promise = this.fetchAndCache(url, isBackground).finally(() => {
			this.inFlightPromises.delete(url);
		});

		this.inFlightPromises.set(url, promise);
		return promise;
	}

	/**
	 * Internal fetch, CacheStorage write, and DOM image pre-decoding
	 */
	private async fetchAndCache(url: string, isBackground: boolean): Promise<string> {
		try {
			// 1. Try Browser CacheStorage first for offline/disk persistence
			if (typeof window !== 'undefined' && 'caches' in window) {
				try {
					const cache = await window.caches.open(CACHE_NAME);
					const cachedResponse = await cache.match(url);
					if (cachedResponse && cachedResponse.ok) {
						// Only a real view extends the lifetime of the entry
						if (!isBackground || !this.lastAccess.has(url)) {
							this.markAccessed(url);
						};
						const blob = await cachedResponse.blob();
						const blobUrl = URL.createObjectURL(blob);
						this.setMemoryCache(url, blobUrl);
						this.predecode(blobUrl);
						return blobUrl;
					}
				} catch (e) {}
			}

			// 2. Fetch from local Gateway / network
			const response = await fetch(url, { cache: 'default' });
			if (!response.ok) {
				// Don't cache failed response; return direct url for retry
				return url;
			}

			// 3. Store in CacheStorage
			if (typeof window !== 'undefined' && 'caches' in window) {
				try {
					const cache = await window.caches.open(CACHE_NAME);
					await cache.put(url, response.clone());
					if (!isBackground || !this.lastAccess.has(url)) {
						this.markAccessed(url);
					};
				} catch (e) {}
			}

			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			this.setMemoryCache(url, blobUrl);
			this.predecode(blobUrl);
			return blobUrl;
		} catch (err) {
			// Fallback to direct URL if fetch failed
			return url;
		}
	}

	/**
	 * Pre-decodes the image in GPU/memory before rendering to prevent UI stutters
	 */
	private predecode(url: string): void {
		if (typeof Image === 'undefined') return;
		try {
			const img = new Image();
			img.src = url;
			if ('decode' in img && typeof img.decode === 'function') {
				img.decode().catch(() => {});
			}
		} catch (e) {}
	}

	/**
	 * LRU eviction for in-memory object URLs
	 */
	private setMemoryCache(key: string, value: string): void {
		if (this.memoryCache.size >= MAX_MEMORY_ITEMS) {
			const firstKey = this.memoryCache.keys().next().value;
			if (firstKey) {
				const oldUrl = this.memoryCache.get(firstKey);
				if (oldUrl && oldUrl.startsWith('blob:')) {
					try {
						URL.revokeObjectURL(oldUrl);
					} catch (e) {}
				}
				this.memoryCache.delete(firstKey);
			}
		}
		this.memoryCache.set(key, value);
	}

	/**
	 * Removes an image URL from memory and browser cache (e.g. on error or retry)
	 */
	async invalidate(url: string): Promise<void> {
		if (!url) return;
		if (this.memoryCache.has(url)) {
			const blobUrl = this.memoryCache.get(url);
			if (blobUrl && blobUrl.startsWith('blob:')) {
				try {
					URL.revokeObjectURL(blobUrl);
				} catch (e) {}
			}
			this.memoryCache.delete(url);
		}
		this.lastAccess.delete(url);
		if (typeof window !== 'undefined' && 'caches' in window) {
			try {
				const cache = await window.caches.open(CACHE_NAME);
				await cache.delete(url);
			} catch (e) {}
		}
	}

	/**
	 * Enqueues URLs to be preloaded during browser idle time in the background
	 */
	prefetchBackground(urls: string[]): void {
		if (!urls || !Array.isArray(urls)) return;
		urls.forEach(u => {
			if (u && typeof u === 'string' && u.startsWith('http') && !this.memoryCache.has(u)) {
				this.idleQueue.add(u);
			}
		});

		this.scheduleIdleProcessing();
	}

	/**
	 * Automatically inspects an Anytype object and prefetches all attached photos/covers
	 */
	prefetchFromObject(obj: any, SCommon: any): void {
		if (!obj || typeof obj !== 'object' || !SCommon || typeof SCommon.imageUrl !== 'function') return;

		const ids: string[] = [];

		if (obj.iconImage) ids.push(obj.iconImage);
		if (obj.coverId) ids.push(obj.coverId);
		if (obj.picture) ids.push(obj.picture);
		if (obj.fileId) ids.push(obj.fileId);

		const urls: string[] = [];
		ids.forEach(id => {
			if (id) {
				urls.push(SCommon.imageUrl(id, 240));
				urls.push(SCommon.imageUrl(id, 640));
				urls.push(SCommon.imageUrl(id, 1200));
			}
		});

		this.prefetchBackground(urls);
	}

	private scheduleIdleProcessing(): void {
		if (this.isProcessingIdle || this.idleQueue.size === 0) return;
		this.isProcessingIdle = true;

		const processChunk = () => {
			const iterator = this.idleQueue.values();
			let count = 0;
			const maxPerChunk = 4;

			while (count < maxPerChunk) {
				const next = iterator.next();
				if (next.done) break;
				const url = next.value;
				this.idleQueue.delete(url);
				this.preload(url, true);
				count++;
			}

			if (this.idleQueue.size > 0) {
				if (typeof (window as any).requestIdleCallback === 'function') {
					(window as any).requestIdleCallback(processChunk, { timeout: 1000 });
				} else {
					setTimeout(processChunk, 60);
				}
			} else {
				this.isProcessingIdle = false;
			}
		};

		if (typeof (window as any).requestIdleCallback === 'function') {
			(window as any).requestIdleCallback(processChunk, { timeout: 1000 });
		} else {
			setTimeout(processChunk, 60);
		}
	}

	/**
	 * Records a view/access of a cached URL to keep it alive for another TTL period
	 */
	private markAccessed(url: string): void {
		this.lastAccess.set(url, Date.now());
		this.schedulePersist();
	}

	/**
	 * Loads persisted last-access timestamps (survives app restarts)
	 */
	private loadAccessTimes(): void {
		try {
			const raw = localStorage.getItem(ACCESS_KEY);
			if (!raw) {
				return;
			};
			const parsed = JSON.parse(raw);
			if (parsed && (typeof parsed === 'object')) {
				Object.entries(parsed).forEach(([ k, v ]) => {
					if (typeof v === 'number') {
						this.lastAccess.set(k, v);
					};
				});
			};
		} catch (e) {}
	}

	/**
	 * Persists last-access timestamps, debounced to avoid excessive writes
	 */
	private schedulePersist(): void {
		if (this.isPersistScheduled || (typeof window === 'undefined')) {
			return;
		};
		this.isPersistScheduled = true;
		window.setTimeout(() => {
			this.isPersistScheduled = false;
			this.persistAccessTimes();
		}, PERSIST_DEBOUNCE_MS);
	}

	private persistAccessTimes(): void {
		try {
			if (this.lastAccess.size > MAX_ACCESS_RECORDS) {
				const sorted = [ ...this.lastAccess.entries() ].sort((a, b) => a[1] - b[1]);
				sorted.slice(0, this.lastAccess.size - MAX_ACCESS_RECORDS).forEach(([ k ]) => this.lastAccess.delete(k));
			};
			localStorage.setItem(ACCESS_KEY, JSON.stringify(Object.fromEntries(this.lastAccess)));
		} catch (e) {}
	}

	/**
	 * Removes CacheStorage entries that were not viewed within the TTL (12h).
	 * Runs shortly after startup and then hourly.
	 */
	async cleanupExpired(): Promise<void> {
		if (typeof window === 'undefined' || !('caches' in window)) {
			return;
		};

		try {
			const cache = await window.caches.open(CACHE_NAME);
			const keys = await cache.keys();
			const now = Date.now();
			let removed = 0;

			for (const req of keys) {
				const accessed = this.lastAccess.get(req.url) || 0;
				if ((now - accessed) > TTL_MS) {
					await cache.delete(req);
					this.lastAccess.delete(req.url);
					removed++;
				};
			};

			// Drop tracking records that expired, with or without a cache entry
			this.lastAccess.forEach((ts, url) => {
				if ((now - ts) > TTL_MS) {
					this.lastAccess.delete(url);
				};
			});

			if (removed) {
				this.persistAccessTimes();
			};
		} catch (e) {}
	}

	/**
	 * Clears memory cache
	 */
	clear(): void {
		this.memoryCache.forEach(url => {
			if (url && url.startsWith('blob:')) {
				try {
					URL.revokeObjectURL(url);
				} catch (e) {}
			}
		});
		this.memoryCache.clear();
		this.inFlightPromises.clear();
		this.idleQueue.clear();
	}
}

export default new UtilImageCache();
