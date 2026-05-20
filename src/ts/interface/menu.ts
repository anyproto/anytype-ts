import * as I from 'Interface';

export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { None, Top, Bottom, Left, Right, Center };

export interface MenuTab {
	id: string;
	name: string;
	component: string;
};

export interface MenuPosition {
	x: number;
	y: number;
	width: number;
	height: number;
};

export interface MenuParam<D = any> {
	component?: string;
	title?: string;
	menuKey?: string;
	element?: string | HTMLElement;
	rect?: MenuPosition;
	type?: MenuType;
	vertical?: MenuDirection;
	horizontal?: MenuDirection;
	stickToElementEdge?: MenuDirection;
	fixedX?: number;
	fixedY?: number;
	offsetX?: number | (() => number);
	offsetY?: number | (() => number);
	width?: number;
	height?: number;
	initialTab?: string;
	data?: D;
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
	visibleDimmer?: boolean;
	highlightElements?: string[];
	hiddenElements?: string[];
	noFlipX?: boolean;
	noFlipY?: boolean;
	noClose?: boolean;
	noAutoHover?: boolean;
	noBorderX?: boolean;
	noBorderY?: boolean;
	recalcRect?(): MenuPosition;
	onClose?(): void;
	onOpen?(component?: any): void;
	rebind?(): void;
	onBack?(id: string): void;
	getTabs?(): I.MenuTab[];
};

export interface Menu {
	id: string;
	param: MenuParam;
	setActive?(item?: MenuItem, scroll?: boolean): void;
	setHover?(item?: MenuItem, scroll?: boolean): void;
	onKeyDown?(e: any): void;
	storageGet?(): Record<string, any>;
	storageSet?(data: Record<string, any>): void;
	getId?(): string;
	getContainer?(): HTMLElement | null;
	getSize?(): { width: number; height: number; };
	getPosition?(): DOMRect;
	getMaxHeight?(isPopup: boolean): number;
	position? (): void;
	close? (callBack?: () => void): void;
};

export interface MenuRef {
	rebind?: () => void;
	unbind?: () => void;
	getItems?: () => MenuItem[];
	getIndex?: () => number;
	setIndex?: (i: number) => void;
	onClick?: (e: React.MouseEvent | MouseEvent, item: MenuItem) => void;
	onOver?: (e: React.MouseEvent | MouseEvent, item: MenuItem) => void;
	getData?: () => Record<string, any>;
	getFilterRef?: () => unknown;
	getListRef?: () => unknown;
	beforePosition?: () => void;
	updateOptions?: (options: I.Option[]) => void;
	onSwitch?: (e: React.MouseEvent | MouseEvent, item: any, v: boolean) => void;
	onSortEnd?: (result: { oldIndex: number; newIndex: number }) => void;
};

export interface IconParam {
	name: string;
	color?: string;
	size?: number;
	width?: number;
	height?: number;
	className?: string;
};

export interface MenuItem {
	id?: string;
	iconParam?: IconParam;
	object?: Record<string, unknown>;
	name?: string | React.ReactNode;
	description?: string;
	caption?: string | React.ReactNode;
	inner?: string | React.ReactNode;
	color?: string;
	arrow?: boolean;
	checkbox?: boolean;
	className?: string;
	switchValue?: boolean;
	selectValue?: string | number | string[];
	readonly?: boolean;
	style?: React.CSSProperties;
	iconSize?: number;
	options?: I.Option[];
	selectMenuParam?: Record<string, any>;
	isActive?: boolean;
	isDiv?: boolean;
	isSection?: boolean;
	index?: number;
	withDescription?: boolean;
	withSwitch?: boolean;
	withSelect?: boolean;
	withMore?: boolean;
	withCopy?: boolean;
	withPlural?: boolean;
	withPronoun?: boolean;
	subComponent?: string;
	note?: string;
	sortArrow?: I.SortType;
	onClick?(e: React.MouseEvent): void;
	onMouseEnter?(e: React.MouseEvent): void;
	onMouseLeave?(e: React.MouseEvent): void;
	onSwitch?(e: React.MouseEvent, v: boolean): void;
	onSelect?(id: string): void;
	onMore?(e: React.MouseEvent): void;
	onContextMenu?(e: React.MouseEvent): void;
	tooltipParam?: I.TooltipParam;
};
