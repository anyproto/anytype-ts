export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right, Center };

export interface MenuParam {
	element: string;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	forceX?: number;
	forceY?: number;
	offsetX: number;
	offsetY: number;
	data?: any;
	isSub?: boolean;
	passThrough?: boolean;
	className?: string;
	onClose?(): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	setActiveItem? (item?: any, scroll?: boolean): void;
};

export interface MenuItem {
	id?: string;
	icon?: string;
	hash?: string;
	name?: string;
	description?: string;
	inner?: any;
	color?: string;
	arrow?: boolean;
	className?: string;
	isActive?: boolean;
	withSmile?: boolean;
	withDescription?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};