import { NotionApiClient } from './apiClient';
import { NotionWorkspace } from './types';

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
				if (error.message.includes('404') || error.message.includes('object_not_found')) {
					typeResult = await this.apiClient.getDatabase(id);
				} else {
					throw error;
				}
			}

			if (typeResult.object === 'page') {
				const page = await this.fetchPageWithBlocks(id);
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
		const pages = await this.apiClient.getWorkspaceTree(); // Ideally use queryDatabase, mocking here
		for (const page of pages.results || []) {
			if (page.object === 'page' && page.parent?.database_id === databaseId) {
				const pageWithBlocks = await this.fetchPageWithBlocks(page.id);
				this.workspace.pages.push(pageWithBlocks);
			}
		}
	}

	private async fetchPageWithBlocks(pageId: string): Promise<any> {
		const page = await this.apiClient.getPage(pageId);
		const blocks = await this.fetchBlocksRecursively(pageId);
		(page as any)._parsedBlocks = blocks;
		return page;
	}

	private async fetchBlocksRecursively(parentId: string): Promise<any[]> {
		let hasMore = true;
		let cursor: string | undefined;
		const blocks: any[] = [];

		while (hasMore) {
			const children = await this.apiClient.getBlockChildren(parentId, cursor);

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
