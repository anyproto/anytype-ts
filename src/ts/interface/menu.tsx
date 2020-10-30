export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right, Center };

export interface MenuParam {
	element: any;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	forceX?: number;
	forceY?: number;
	offsetX: number;
	offsetY: number;
	width?: number;
	data?: any;
	isSub?: boolean;
	passThrough?: boolean;
	className?: string;
	onClose?(): void;
	onOpen?(): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	setActiveItem? (item?: any, scroll?: boolean): void;
	position? (): void;
	close? (): void;
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
	menuId?: string;
	withSmile?: boolean;
	withDescription?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};