import { NotionPage, NotionDatabase } from './types';

export class NotionApiClient {
	private readonly token: string;
	private requestQueue: Array<() => Promise<void>> = [];
	private isProcessingQueue = false;

	constructor(token: string) {
		this.token = token;
	}

	async getPage(pageId: string): Promise<NotionPage> {
		return this.enqueueRequest(() => this.fetchNotionAPI(`pages/${pageId}`));
	}

	async getDatabase(databaseId: string): Promise<NotionDatabase> {
		return this.enqueueRequest(() => this.fetchNotionAPI(`databases/${databaseId}`));
	}

	async getBlockChildren(blockId: string, cursor?: string): Promise<any> {
		const url = `blocks/${blockId}/children${cursor ? `?start_cursor=${cursor}` : ''}`;
		return this.enqueueRequest(() => this.fetchNotionAPI(url));
	}

	async getWorkspaceTree(): Promise<any> {
		return this.enqueueRequest(() => this.fetchNotionAPI('search', { method: 'POST', body: JSON.stringify({ query: '', sort: { direction: 'ascending', timestamp: 'last_edited_time' } }) }));
	}

	async downloadFile(url: string): Promise<ArrayBuffer> {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Failed to download file from ${url}`);
		return response.arrayBuffer();
	}

	private async enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.requestQueue.push(async () => {
				try {
					const result = await requestFn();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});

			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.isProcessingQueue) return;
		this.isProcessingQueue = true;

		while (this.requestQueue.length > 0) {
			const request = this.requestQueue.shift();
			if (request) {
				try {
					await request();
					await new Promise(resolve => setTimeout(resolve, 333)); // Rate limit to 3 requests/sec
				} catch (error) {
					if (error instanceof Error && error.message.includes('429')) {
						const retryAfterMatch = error.message.match(/Retry-After: (\d+)/);
						const waitTime = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) * 1000 : this.calculateBackoff();
						console.log(`Rate limited, waiting for ${waitTime}ms...`);
						await new Promise(resolve => setTimeout(resolve, waitTime));
						this.requestQueue.unshift(request); // Re-queue failed request
					} else {
						console.error("API request failed:", error);
					}
				}
			}
		}

		this.isProcessingQueue = false;
	}

	private calculateBackoff(): number {
		const baseDelay = 2000;
		const maxDelay = 64000;
		const delay = Math.min(baseDelay * Math.pow(2, Math.floor(Math.random() * 5)), maxDelay); // max 5 retries backoff range
		const jitter = delay * 0.2 * (Math.random() * 2 - 1);
		return delay + jitter;
	}

	private async fetchNotionAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
		const url = `https://api.notion.com/v1/${endpoint}`;
		const headers = {
			'Authorization': `Bearer ${this.token}`,
			'Notion-Version': '2022-06-28',
			'Content-Type': 'application/json',
			...options.headers
		};

		const response = await fetch(url, { ...options, headers });

		if (!response.ok) {
			const errorText = await response.text();
			const errorMessage = `HTTP Error ${response.status} on ${url}: ${errorText}`;
			const error = new Error(errorMessage);
			if (response.status === 429) {
				const retryAfter = response.headers.get('Retry-After');
				if (retryAfter) {
					error.message += ` | Retry-After: ${retryAfter}`;
				}
			}
			throw error;
		}

		return response.json();
	}
}
