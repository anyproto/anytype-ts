import { NotionWorkspace, NotionPage } from './types';

export class RelationResolver {
	async resolveRelations(workspace: NotionWorkspace, notionIdToAnytypeId: Map<string, string>): Promise<void> {
		for (const page of workspace.pages) {
			const properties = page.properties;
			let isUpdated = false;

			for (const propName in properties) {
				const prop = properties[propName];

				if (prop.type === 'relation') {
					const relatedIds = prop.relation.map((r: any) => r.id);
					const resolvedIds = relatedIds.map((id: string) => {
						const anytypeId = notionIdToAnytypeId.get(id);
						return anytypeId ? anytypeId : `_unresolved_notion_id:${id}`;
					});

					prop.relation = resolvedIds.map((id: string) => ({ id }));
					isUpdated = true;
				} else if (prop.type === 'rollup') {
					const functionType = prop.rollup.function;
					const normalizedArray = (prop.rollup.array || []).map((a: any) => ({
						id: a.id ? notionIdToAnytypeId.get(a.id) || `_unresolved_notion_id:${a.id}` : null,
						number: typeof a === 'number' ? a : (a.number ?? null)
					}));

					let result: string;
					switch (functionType) {
						case 'count':
							result = normalizedArray.length.toString();
							break;
						case 'sum':
							result = this.calculateSum(normalizedArray).toString();
							break;
						case 'average':
							result = this.calculateAverage(normalizedArray).toString();
							break;
						case 'min':
							result = this.calculateMin(normalizedArray).toString();
							break;
						case 'max':
							result = this.calculateMax(normalizedArray).toString();
							break;
						case 'show_original':
							result = normalizedArray.map((a: any) => a.id).filter(Boolean).join(', ');
							break;
						default:
							result = `_notion_rollup: [rollup: ${functionType}(${propName})]`;
					}

					prop.rollup.value = result;
					isUpdated = true;
				}
			}

			if (isUpdated) {
				// Save changes back to workspace or update backend
			}
		}
	}

	private calculateSum(array: any[]): number {
		return array.reduce((acc, curr) => acc + (typeof curr.number === 'number' ? curr.number : 0), 0);
	}

	private calculateAverage(array: any[]): number {
		const numbers = array.filter(v => typeof v.number === 'number').map(v => v.number);
		return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
	}

	private calculateMin(array: any[]): number {
		const numbers = array.filter(v => typeof v.number === 'number').map(v => v.number);
		return numbers.length ? Math.min(...numbers) : 0;
	}

	private calculateMax(array: any[]): number {
		const numbers = array.filter(v => typeof v.number === 'number').map(v => v.number);
		return numbers.length ? Math.max(...numbers) : 0;
	}
}
