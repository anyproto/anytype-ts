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
	recalcRect?(): { width: number, height: number, x: number, y: number };
	type?: MenuType;
	vertical?: MenuDirection;
	horizontal?: MenuDirection;
	fixedX?: number;
	fixedY?: number;
	offsetX?: any;
	offsetY?: any;
	width?: number;
	height?: number;
	getTabs?(): I.MenuTab[];
	initialTab?: string;
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
	withArrow?: boolean;
	commonFilter?: boolean;
	onClose?(): void;
	onOpen?(component?: any): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
	dataset?: any;
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
	isActive?: boolean;
	withDescription?: boolean;
	withCaption?: boolean;
	withSwitch?: boolean;
	switchValue?: boolean;
	readonly?: boolean;
	style?: any;
	iconSize?: number;
	forceLetter?: boolean;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onSwitch?(e: any, v: boolean): void;
};