import * as I from 'Interface';

export enum PreviewType {
	None	 = 0,
	Default	 = 1,
	Link	 = 2,
	Object	 = 3,
	Tab 	 = 4,
};

export enum PreviewSize {
	Small 	= 0,
	Medium 	= 1,
	Large 	= 2,
};

export interface PreviewLink {
	type: string;
	title: string;
	description: string;
	faviconUrl: string;
	imageUrl: string;
};

export interface Preview {
	type?: PreviewType,
	markType?: I.MarkType;
	classNameWrap?: string;
	target?: string; /** object ID or URL */
	object?: any;
	element?: HTMLElement | string;
	rect?: any;
	range?: I.TextRange;
	marks?: I.Mark[];
	noUnlink?: boolean;
	noEdit?: boolean;
	passThrough?: boolean;
	noAnimation?: boolean;
	withPlural?: boolean;
	typeX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	noOffset?: boolean;
	relatedData?: any;
	delay?: number;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	onChange?(marks: I.Mark[]): void;
};
