import { NotionDatabase } from './types';

export class ViewImporter {
	importView(notionView: any, database: NotionDatabase): any {
		const anytypeViewType = this.mapViewType(notionView.type);

		const viewConfig: any = {
			type: anytypeViewType,
			filters: this.mapFilters(notionView.filters),
			sorts: this.mapSorts(notionView.sorts),
			hiddenProperties: this.mapHiddenProperties(notionView.format?.table_properties),
		};

		if (anytypeViewType === 'board') {
			viewConfig.groupBy = notionView.format?.board_groups2?.group_by_property || notionView.format?.board_groups?.property;
		} else if (anytypeViewType === 'calendar') {
			viewConfig.dateProperty = notionView.format?.calendar_properties?.property;
		} else if (anytypeViewType === 'timeline') {
			viewConfig.startDateProperty = notionView.format?.timeline_properties?.start_property;
			viewConfig.endDateProperty = notionView.format?.timeline_properties?.end_property;
		} else if (anytypeViewType === 'gallery') {
			viewConfig.coverProperty = notionView.format?.gallery_properties?.cover_property;
		}

		return viewConfig;
	}

	private mapViewType(notionType: string): string {
		const map: Record<string, string> = {
			table: 'grid',
			board: 'board',
			gallery: 'gallery',
			list: 'list',
			calendar: 'calendar',
			timeline: 'timeline'
		};
		return map[notionType] || 'list';
	}

	private mapFilters(notionFilters: any[]): any[] {
		if (!notionFilters) return [];
		return notionFilters.map(filter => {
			const mappedCondition = this.mapFilterCondition(filter.condition);
			return { property: filter.property, condition: mappedCondition, value: filter.value };
		});
	}

	private mapFilterCondition(condition: string): string {
		const map: Record<string, string> = {
			equals: 'eq',
			does_not_equal: 'neq',
			contains: 'contains',
			does_not_contain: 'not_contains',
			is_empty: 'empty',
			is_not_empty: 'not_empty',
			greater_than: 'gt',
			less_than: 'lt'
		};
		return map[condition] || 'eq';
	}

	private mapSorts(notionSorts: any[]): any[] {
		if (!notionSorts) return [];
		return notionSorts.map(sort => ({
			property: sort.property,
			direction: sort.direction === 'ascending' ? 'asc' : 'desc'
		}));
	}

	private mapHiddenProperties(notionProperties: any[]): string[] {
		if (!notionProperties) return [];
		return notionProperties.filter(prop => !prop.visible).map(prop => prop.property);
	}
}
