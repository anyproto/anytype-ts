export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right, Center };

export interface MenuParam {
	element: string;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	offsetX: number;
	offsetY: number;
	data?: any;
	isSub?: boolean;
	passThrough?: boolean;
	onClose?(): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	setActiveItem? (item?: any, scroll?: boolean): void;
};

export interface MenuItem {
	id?: string;
	icon: string;
	name: string;
	inner?: any;
	color?: string;
	arrow?: boolean;
	className?: string;
	isActive?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};