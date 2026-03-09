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
				this.processItem(json, workspace, pageMap, dbMap, blockMap);
			} catch (e) {
				throw new Error(`Error parsing JSON file ${filename}: ${e}`);
			}
		}

		// Attach blocks to pages
		workspace.pages.forEach(page => {
			page._parsedBlocks = this.buildBlockTree(page.id, blockMap);
		});

		return workspace;
	}

	private processItem(json: any, workspace: NotionWorkspace, pageMap: Map<string, NotionPage>, dbMap: Map<string, NotionDatabase>, blockMap: Map<string, NotionBlock[]>) {
		if (json.object === 'list' && Array.isArray(json.results)) {
			for (const item of json.results) {
				this.processItem(item, workspace, pageMap, dbMap, blockMap);
			}
		} else if (json.object === 'page') {
			if (!pageMap.has(json.id)) {
				const page = this.convertPage(json);
				pageMap.set(json.id, page);
				workspace.pages.push(page);
			}
		} else if (json.object === 'database') {
			if (!dbMap.has(json.id)) {
				const db = this.convertDatabase(json);
				dbMap.set(json.id, db);
				workspace.databases.push(db);
			}
		} else if (json.object === 'block') {
			const block = json as NotionBlock;
			const parentId = block.parent?.block_id || block.parent?.page_id || 'root';
			if (!blockMap.has(parentId)) {
				blockMap.set(parentId, []);
			}
			blockMap.get(parentId)!.push(block);
		}
	}

	private convertPage(json: any): NotionPage {
		const page = { ...json };
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
		const db = { ...json };
		const mappedProperties: Record<string, any> = {};
		for (const key in db.properties) {
			const prop = db.properties[key];
			const mappedType = NOTION_PROPERTY_TYPE_MAP[prop.type as keyof typeof NOTION_PROPERTY_TYPE_MAP];
			mappedProperties[key] = { ...prop, _mappedType: mappedType };
		}
		db.properties = mappedProperties;
		return db;
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
