export interface Account {
	id: string;
};

export enum DragItem {
	Block = 'block',
	Menu = 'menu',
};

export enum CoverType {
	None	 = 0,
	Image	 = 1,
	Color	 = 2,
	Gradient = 3,
	Upload	 = 4, 
	BgImage  = 5, 
};

export enum CrumbsType {
	Page	 = 'page',
	Popup	 = 'popup',
};

export enum NavigationType {
	Go		 = 'go',
	Move	 = 'move',
	Create	 = 'create',
};