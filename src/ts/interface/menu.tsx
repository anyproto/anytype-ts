export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right, Center };

export interface MenuParam {
	element: any;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	fixedX?: number;
	fixedY?: number;
	offsetX: number;
	offsetY: number;
	width?: number;
	data?: any;
	isSub?: boolean;
	passThrough?: boolean;
	className?: string;
	noAnimation?: boolean;
	noFlip?: boolean;
	onClose?(): void;
	onOpen?(): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	setHover? (item?: any, scroll?: boolean): void;
	getId?(): string;
	position? (): void;
	close? (): void;
};

export interface MenuItem {
	id?: string;
	icon?: string;
	object?: any;
	name?: string;
	description?: string;
	caption?: string;
	inner?: any;
	color?: string;
	arrow?: boolean;
	className?: string;
	isActive?: boolean;
	menuId?: string;
	withDescription?: boolean;
	withCaption?: boolean;
	style?: any;
	iconSize?: number;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};