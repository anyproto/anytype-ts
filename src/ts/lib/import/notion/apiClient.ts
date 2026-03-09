import { NotionPage, NotionDatabase } from './types';

interface QueueItem {
	requestFn: () => Promise<any>;
	resolve: (value: any) => void;
	reject: (reason?: any) => void;
	attempts: number;
}

export class NotionApiError extends Error {
	status: number;
	code?: string;

	constructor(message: string, status: number, code?: string) {
		super(message);
		this.name = 'NotionApiError';
		this.status = status;
		this.code = code;
	}
}

export class NotionApiClient {
	private readonly token: string;
	private requestQueue: Array<QueueItem> = [];
	private isProcessingQueue = false;
	private readonly MAX_ATTEMPTS = 5;

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

	async queryDatabase(databaseId: string, cursor?: string): Promise<any> {
		const url = `databases/${databaseId}/query`;
		const body = cursor ? JSON.stringify({ start_cursor: cursor }) : undefined;
		return this.enqueueRequest(() => this.fetchNotionAPI(url, { method: "POST", body }));
	}

	async getWorkspaceTree(): Promise<any> {
		let hasMore = true;
		let cursor: string | undefined = undefined;
		const results: any[] = [];

		while (hasMore) {
			const body: any = { query: '', sort: { direction: 'ascending', timestamp: 'last_edited_time' } };
			if (cursor) body.start_cursor = cursor;

			const response = await this.enqueueRequest(() => this.fetchNotionAPI('search', { method: 'POST', body: JSON.stringify(body) }));

			results.push(...(response.results || []));
			hasMore = response.has_more;
			cursor = response.next_cursor;
		}
		return { results, has_more: false, next_cursor: null, object: 'list' };
	}

	async downloadFile(url: string): Promise<ArrayBuffer> {
		const response = await fetch(url);
		if (!response.ok) {
			const redactedUrl = new URL(url);
			redactedUrl.search = "REDACTED";
			throw new Error(`Failed to download file from ${redactedUrl.toString()}`);
		}
		return response.arrayBuffer();
	}

	private async enqueueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.requestQueue.push({ requestFn, resolve, reject, attempts: 0 });
			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.isProcessingQueue) return;
		this.isProcessingQueue = true;

		while (this.requestQueue.length > 0) {
			const requestItem = this.requestQueue.shift();
			if (requestItem) {
				try {
					const result = await requestItem.requestFn();
					requestItem.resolve(result);
					await new Promise(resolve => setTimeout(resolve, 333)); // Rate limit to 3 requests/sec
				} catch (error) {
					if (error instanceof NotionApiError && error.status === 429) {
						requestItem.attempts++;
						if (requestItem.attempts >= this.MAX_ATTEMPTS) {
							console.error("Max retries reached for API request.");
							requestItem.reject(error);
							continue;
						}

						// Match retry-after if available in message (we append it below)
						const retryAfterMatch = error.message.match(/Retry-After: (\d+)/);
						const waitTime = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) * 1000 : this.calculateBackoff(requestItem.attempts);

						console.log(`Rate limited, waiting for ${waitTime}ms... (Attempt ${requestItem.attempts})`);
						await new Promise(resolve => setTimeout(resolve, waitTime));
						this.requestQueue.unshift(requestItem); // Re-queue failed request
					} else {
						console.error("API request failed:", error);
						requestItem.reject(error);
					}
				}
			}
		}

		this.isProcessingQueue = false;
	}

	private calculateBackoff(attempts: number): number {
		const baseDelay = 2000;
		const maxDelay = 64000;
		const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
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
			let errorText = await response.text();
			let code = undefined;
			try {
				const jsonBody = JSON.parse(errorText);
				if (jsonBody.code) code = jsonBody.code;
			} catch (e) {
				// Ignore parse error
			}

			let errorMessage = `HTTP Error ${response.status} on ${url}: ${errorText}`;
			if (response.status === 429) {
				const retryAfter = response.headers.get('Retry-After');
				if (retryAfter) {
					errorMessage += ` | Retry-After: ${retryAfter}`;
				}
			}
			throw new NotionApiError(errorMessage, response.status, code);
		}

		return response.json();
	}
}
