import { I } from 'Lib';

export enum WidgetLayout { 
	Link	 	 = 0,
	Tree	 	 = 1,
	List		 = 2,
	Compact		 = 3,

	Space	 	 = 100,
};

export interface WidgetComponent {
	dataset?: any;
	parent?: I.Block;
	block: I.Block;
	isEditing?: boolean;
	isPreview?: boolean;
	isCollection?: (blockId: string) => boolean;
	setPreview?: (id: string) => void;
	setEditing?: (v: boolean) => void;
	getData?: (subId: string, callBack?: () => void) => void;
	getLimit?: (content: ContentWidget) => number;
	sortFavorite?: (records: string[]) => string[];
	addGroupLabels?: (records: any[], widgetId: string) => any[];
};

export interface WidgetTreeItem {
	id: string;
	rootId: string; // the id of the root node (root node)
	parentId: string; // the id of the parent node
	depth: number; // the depth of the node in the tree
	numChildren: number; // the number of children of the node
	isSection?: boolean;
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
};

export interface BlockWidget extends I.Block {
	content: ContentWidget;
};
