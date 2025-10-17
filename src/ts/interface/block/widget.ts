import { I } from 'Lib';

export enum WidgetSection {
	Pin			 = 0,
	Type		 = 1,
	Button		 = 2,
};

export enum WidgetLayout { 
	Link	 	 = 0,
	Tree	 	 = 1,
	List		 = 2,
	Compact		 = 3,
	View		 = 4,

	Space	 	 = 100,
};

export interface WidgetComponent {
	parent?: I.Block;
	block?: I.Block;
	isPreview?: boolean;
	canCreate?: boolean;
	canEdit?: boolean;
	canRemove?: boolean;
	isSystemTarget?: boolean;
	sidebarDirection?: I.SidebarDirection;
	setPreview?: (id: string) => void;
	getData?: (subId: string, callBack?: () => void) => void;
	getLimit?: () => number;
	getTraceId?: () => string;
	addGroupLabels?: (records: any[], widgetId: string) => any[];
	checkShowAllButton?: (subId: string) => void;
	onContext?: (param: any) => void;
	onCreate?: (param: any) => void;
	getObject?: (id: string) => any;
	getContentParam?: () => { layout: WidgetLayout; limit: number; viewId: string; };
};

export interface WidgetViewComponent extends I.WidgetComponent {
	rootId: string;
	subId: string;
	parent?: I.Block;
	getRecordIds: () => any[];
	getView: () => I.View;
	getViewType: () => I.ViewType;
	getObject: () => any;
	getViewLimit: () => number;
	reload: () => void;
};

export interface WidgetTreeItem extends I.WidgetComponent {
	id: string;
	rootId: string; // the id of the root node (root node)
	parentId: string; // the id of the parent node
	depth: number; // the depth of the node in the tree
	numChildren: number; // the number of children of the node
	isSection?: boolean;
	branch: string;
};

export interface WidgetTreeDetails { 
	id: string; 
	type: string; 
	links: string[];
	isSection?: boolean;
};

export interface ContentWidget {
	layout: I.WidgetLayout;
	limit: number;
	viewId: string;
	autoAdded: boolean;
	section?: I.WidgetSection;
};

export interface BlockWidget extends I.Block {
	content: ContentWidget;
};
