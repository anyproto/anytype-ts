export enum SidebarDirection {
	Left	 = 'left',
	Right	 = 'right',
};

export enum SidebarPanel {
	Left = 'left',
	SubLeft = 'subLeft',
	Right = 'right',
};

export interface SidebarPageComponent {
	page?: string;
	rootId?: string;
	isPopup?: boolean;
	readonly?: boolean;
	details?: any;
	noPreview?: boolean;
	previous?: any;
	blockId?: string;
	sidebarDirection: SidebarDirection;
	getId?(): string;
};

export interface SidebarSectionComponent extends SidebarPageComponent {
	id: string;
	object: any;
	item?: any;
	readonly?: boolean;
	onChange?(update: any): void;
	disableButton?(v: boolean): void;
	onDragStart?: (e: React.DragEvent) => void;
};

export interface SidebarSectionRef {
	forceUpdate(): void;
};

export enum SidebarRelationList {
	Featured 		= 1,
	Recommended 	= 2,
	Hidden 			= 3,
	Local 			= 4,
};