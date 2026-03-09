import { NotionWorkspace, NotionPage, NotionDatabase, NotionBlock, NotionBlockType, NOTION_PROPERTY_TYPE_MAP, NOTION_BLOCK_TYPE_MAP } from './types';

export class JsonParser {
	async parseNotionApiJson(folderPath: string, fileContentsMap: Map<string, string>): Promise<NotionWorkspace> {
		const workspace: NotionWorkspace = {
			pages: [],
			databases: []
		};

		const pageMap = new Map<string, NotionPage>();
		const blockMap = new Map<string, NotionBlock[]>();
		const dbMap = new Map<string, NotionDatabase>();

		for (const [filename, content] of fileContentsMap.entries()) {
			if (!filename.endsWith('.json')) continue;

			try {
				const json = JSON.parse(content);

				if (json.object === 'page') {
					pageMap.set(json.id, json as NotionPage);
					workspace.pages.push(this.convertPage(json));
				} else if (json.object === 'database') {
					dbMap.set(json.id, json as NotionDatabase);
					workspace.databases.push(this.convertDatabase(json));
				} else if (json.object === 'block') {
					const block = json as NotionBlock;
					const parentId = block.parent?.block_id || block.parent?.page_id || 'root';
					if (!blockMap.has(parentId)) {
						blockMap.set(parentId, []);
					}
					blockMap.get(parentId)!.push(block);
				}
			} catch (e) {
				console.error(`Error parsing JSON file ${filename}:`, e);
			}
		}

		// Attach blocks to pages
		workspace.pages.forEach(page => {
			(page as any)._parsedBlocks = this.buildBlockTree(page.id, blockMap);
		});

		return workspace;
	}

	private convertPage(json: any): NotionPage {
		const page = { ...json };
		// Map properties
		const mappedProperties: Record<string, any> = {};
		for (const key in page.properties) {
			const prop = page.properties[key];
			const mappedType = NOTION_PROPERTY_TYPE_MAP[prop.type as keyof typeof NOTION_PROPERTY_TYPE_MAP];
			mappedProperties[key] = { ...prop, _mappedType: mappedType };
		}
		page.properties = mappedProperties;
		return page;
	}

	private convertDatabase(json: any): NotionDatabase {
		return json as NotionDatabase; // Mapping logic can be expanded
	}

	private buildBlockTree(parentId: string, blockMap: Map<string, NotionBlock[]>): any[] {
		const blocks = blockMap.get(parentId) || [];
		return blocks.map(block => {
			const mappedType = NOTION_BLOCK_TYPE_MAP[block.type as NotionBlockType] || 'text';
			return {
				...block,
				_mappedType: mappedType,
				children: block.has_children ? this.buildBlockTree(block.id, blockMap) : []
			};
		});
	}
}
