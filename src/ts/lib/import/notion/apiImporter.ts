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
			const typeResult = await this.apiClient.getPage(id).catch(() => this.apiClient.getDatabase(id));
			if (typeResult.object === 'page') {
				const page = await this.fetchPageWithBlocks(id);
				this.workspace.pages.push(page);
			} else if (typeResult.object === 'database') {
				this.workspace.databases.push(typeResult);
			}

			progress++;
			this.progressCallback(progress, total);
		}

		return this.workspace;
	}

	private async fetchPageWithBlocks(pageId: string): Promise<any> {
		const page = await this.apiClient.getPage(pageId);
		let hasMore = true;
		let cursor: string | undefined;
		const blocks: any[] = [];

		while (hasMore) {
			const children = await this.apiClient.getBlockChildren(pageId, cursor);
			blocks.push(...children.results);
			hasMore = children.has_more;
			cursor = children.next_cursor;
		}

		(page as any)._parsedBlocks = blocks;
		return page;
	}
}
