export enum KeyboardZoneType {
	Global		 = 'global',
	Page		 = 'page',
	Sidebar		 = 'sidebar',
	Popup		 = 'popup',
	Menu		 = 'menu',
	DataviewGrid = 'dataviewGrid',
	Cell		 = 'cell',
};

export interface KeyboardZone {
	id: string;
	type: KeyboardZoneType;
	onKeyDown: (e: KeyboardEvent) => boolean;
	onActivate?: () => void;
	onDeactivate?: () => void;
};
