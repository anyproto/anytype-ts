import { I } from 'Lib';

export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { None, Top, Bottom, Left, Right, Center };

export interface MenuTab {
	id: string;
	name: string;
	component: string;
};

export interface MenuParam {
	component?: string;
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
	initialTab?: string;
	data?: any;
	isSub?: boolean;
	subIds?: string[];
	passThrough?: boolean;
	className?: string;
	classNameWrap?: string;
	withArrow?: boolean;
	commonFilter?: boolean;
	noAnimation?: boolean;
	noDimmer?: boolean;
	noFlipX?: boolean;
	noFlipY?: boolean;
	noClose?: boolean;
	recalcRect?(): { width: number, height: number, x: number, y: number };
	onClose?(): void;
	onOpen?(component?: any): void;
	getTabs?(): I.MenuTab[];
	force?: boolean;
};

export interface Menu {
	id: string;
	param: MenuParam;
	dataset?: I.Dataset;
	history?: any;
	setActive?(item?: any, scroll?: boolean): void;
	setHover?(item?: any, scroll?: boolean): void;
	onKeyDown?(e: any): void;
	storageGet?(): any;
	storageSet?(data: any): void;
	getId?(): string;
	getSize?(): { width: number; height: number; };
	getPosition?(): DOMRect;
	position? (): void;
	close? (): void;
};

export interface MenuItem {
	id?: string;
	icon?: string;
	object?: any;
	name?: any;
	description?: string;
	caption?: string;
	inner?: any;
	color?: string;
	arrow?: boolean;
	checkbox?: boolean;
	className?: string;
	switchValue?: boolean;
	selectValue?: any;
	readonly?: boolean;
	style?: any;
	iconSize?: number;
	forceLetter?: boolean;
	options?: I.Option[];
	selectMenuParam?: any;
	isActive?: boolean;
	withDescription?: boolean;
	withSwitch?: boolean;
	withSelect?: boolean;
	withMore?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onSwitch?(e: any, v: boolean): void;
	onSelect?(id: string): void;
	onMore?(e: any): void;
};
