export interface NotionFilter {
	property: string;
	condition: string;
	value?: unknown;
}

export interface NotionSort {
	property: string;
	direction: string;
}

export interface NotionViewFormat {
	table_properties?: Array<{ property: string; visible: boolean }>;
	board_groups?: { property: string };
	board_groups2?: { group_by_property: string };
	calendar_properties?: { property: string };
	timeline_properties?: { start_property: string; end_property: string };
	gallery_properties?: { cover_property: string };
}

export interface NotionView {
	type: string;
	filters?: NotionFilter[];
	sorts?: NotionSort[];
	format?: NotionViewFormat;
}

export interface AnytypeViewFilter {
	property: string;
	condition: string;
	value?: unknown;
}

export interface AnytypeViewSort {
	property: string;
	direction: 'asc' | 'desc';
}

export interface AnytypeViewConfig {
	type: string;
	filters: AnytypeViewFilter[];
	sorts: AnytypeViewSort[];
	hiddenProperties: string[];
	groupBy?: string;
	dateProperty?: string;
	startDateProperty?: string;
	endDateProperty?: string;
	coverProperty?: string;
}

export class ViewImporter {
	importView(notionView: NotionView): AnytypeViewConfig {
		const anytypeViewType = this.mapViewType(notionView.type);

		const viewConfig: AnytypeViewConfig = {
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

	private mapFilters(notionFilters?: NotionFilter[]): AnytypeViewFilter[] {
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

		if (condition in map) {
			return map[condition];
		}

		// Preserve unknown conditions instead of silently coercing to 'eq'
		return condition;
	}

	private mapSorts(notionSorts?: NotionSort[]): AnytypeViewSort[] {
		if (!notionSorts) return [];
		return notionSorts.map(sort => {
			let direction: 'asc' | 'desc' = 'asc';
			if (sort.direction === 'descending') direction = 'desc';

			return {
				property: sort.property,
				direction
			};
		});
	}

	private mapHiddenProperties(notionProperties?: Array<{ property: string; visible: boolean }>): string[] {
		if (!notionProperties) return [];
		return notionProperties.filter(prop => !prop.visible).map(prop => prop.property);
	}
}
