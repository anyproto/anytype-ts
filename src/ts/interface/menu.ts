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
	title?: string;
	menuKey?: string;
	element?: any;
	rect?: any;
	type?: MenuType;
	vertical?: MenuDirection;
	horizontal?: MenuDirection;
	stickToElementEdge?: MenuDirection;
	fixedX?: number;
	fixedY?: number;
	offsetX?: any;
	offsetY?: any;
	width?: number;
	height?: number;
	initialTab?: string;
	data?: any;
	isSub?: boolean;
	parentId?: string;
	subIds?: string[];
	passThrough?: boolean;
	commonFilter?: boolean;
	className?: string;
	classNameWrap?: string;
	withArrow?: boolean;
	withBack?: boolean;
	noAnimation?: boolean;
	noDimmer?: boolean;
	highlightElements?: string[];
	hiddenElements?: string[];
	noFlipX?: boolean;
	noFlipY?: boolean;
	noClose?: boolean;
	noAutoHover?: boolean;
	recalcRect?(): { width: number, height: number, x: number, y: number };
	onClose?(): void;
	onOpen?(component?: any): void;
	rebind?(): void;
	onBack?(id: string): void;
	getTabs?(): I.MenuTab[];
};

export interface Menu {
	id: string;
	param: MenuParam;
	setActive?(item?: any, scroll?: boolean): void;
	setHover?(item?: any, scroll?: boolean): void;
	onKeyDown?(e: any): void;
	storageGet?(): any;
	storageSet?(data: any): void;
	getId?(): string;
	getSize?(): { width: number; height: number; };
	getPosition?(): DOMRect;
	position? (): void;
	close? (callBack?: () => void): void;
};

export interface MenuRef {
	rebind: () => void,
	unbind: () => void,
	getItems: () => any[];
	getIndex: () => number,
	setIndex: (i: number) => void,
	onClick?: (e: any, item: any) => void,
	onOver?: (e: any, item: any) => void,
	getData?: () => any,
	getListRef?: () => any,
};

export interface MenuItem {
	id?: string;
	icon?: string;
	object?: any;
	name?: any;
	description?: string;
	caption?: any;
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
	options?: I.Option[];
	selectMenuParam?: any;
	isActive?: boolean;
	isDiv?: boolean;
	isSection?: boolean;
	index?: number;
	withDescription?: boolean;
	withSwitch?: boolean;
	withSelect?: boolean;
	withMore?: boolean;
	withPlural?: boolean;
	withPronoun?: boolean;
	subComponent?: string;
	note?: string;
	sortArrow?: I.SortType;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onSwitch?(e: any, v: boolean): void;
	onSelect?(id: string): void;
	onMore?(e: any): void;
};
