import { NotionApiClient, NotionApiError } from './apiClient';
import { NotionWorkspace, NotionPage } from './types';

export class ApiImporter {
	private readonly apiClient: NotionApiClient;
	private workspace: NotionWorkspace = { pages: [], databases: [] };
	private selectedIds: string[];
	private progressCallback: (progress: number, total: number) => void;

	constructor(apiClient: NotionApiClient, selectedIds: string[], progressCallback: (progress: number, total: number) => void) {
		this.apiClient = apiClient;
		this.selectedIds = selectedIds;
		this.progressCallback = progressCallback;
	}

	async importFromApi(): Promise<NotionWorkspace> {
		const total = this.selectedIds.length;
		let progress = 0;

		for (const id of this.selectedIds) {
			let typeResult: any;

			try {
				typeResult = await this.apiClient.getPage(id);
			} catch (error: any) {
				if (error instanceof NotionApiError && (error.status === 404 || error.code === 'object_not_found')) {
					typeResult = await this.apiClient.getDatabase(id);
				} else {
					throw error;
				}
			}

			if (typeResult.object === 'page') {
				const page = await this.fetchPageWithBlocks(typeResult as NotionPage);
				this.workspace.pages.push(page);
			} else if (typeResult.object === 'database') {
				this.workspace.databases.push(typeResult);
				await this.fetchDatabasePages(id); // Fetch rows for database
			}

			progress++;
			this.progressCallback(progress, total);
		}

		return this.workspace;
	}

	private async fetchDatabasePages(databaseId: string) {
		let hasMore = true;
		let cursor: string | undefined;

		while (hasMore) {
			const queryResult = await this.apiClient.queryDatabase(databaseId, cursor);
			for (const page of queryResult.results || []) {
				if (page.object === 'page' && page.parent?.database_id === databaseId) {
					const pageWithBlocks = await this.fetchPageWithBlocks(page as NotionPage);
					this.workspace.pages.push(pageWithBlocks);
				}
			}
			hasMore = queryResult.has_more;
			cursor = queryResult.next_cursor;
		}
	}

	private async fetchPageWithBlocks(page: NotionPage): Promise<NotionPage> {
		const blocks = await this.fetchBlocksRecursively(page.id);
		page._parsedBlocks = blocks;
		return page;
	}

	private async fetchBlocksRecursively(parentId: string): Promise<any[]> {
		let hasMore = true;
		let cursor: string | undefined;
		const blocks: any[] = [];

		while (hasMore) {
			const children = await this.apiClient.getBlockChildren(parentId, cursor);

			if (!children || !Array.isArray(children.results)) {
				console.warn(`getBlockChildren returned malformed results for parentId ${parentId}`);
				break;
			}

			for (const block of children.results) {
				if (block.has_children) {
					block.children = await this.fetchBlocksRecursively(block.id);
				}
				blocks.push(block);
			}

			hasMore = children.has_more;
			cursor = children.next_cursor;
		}

		return blocks;
	}
}
