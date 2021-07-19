export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right, Center };

export interface MenuTab {
	id: string;
	name: string;
	component: string;
};

export interface MenuParam {
	menuKey?: string;
	element?: any;
	rect?: any;
	type?: MenuType;
	vertical?: MenuDirection;
	horizontal?: MenuDirection;
	fixedX?: number;
	fixedY?: number;
	offsetX?: any;
	offsetY?: any;
	width?: number;
	height?: number;
	tabs?: MenuTab[];
	data?: any;
	isSub?: boolean;
	subIds?: string[];
	passThrough?: boolean;
	className?: string;
	classNameWrap?: string;
	noAnimation?: boolean;
	noDimmer?: boolean;
	noFlipX?: boolean;
	noFlipY?: boolean;
	onClose?(): void;
	onOpen?(component?: any): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	setHover? (id?: any, scroll?: boolean): void;
	getId?(): string;
	getSize?(): any;
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
	checkbox?: boolean;
	className?: string;
	isActive?: boolean;
	withDescription?: boolean;
	withCaption?: boolean;
	style?: any;
	iconSize?: number;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
};