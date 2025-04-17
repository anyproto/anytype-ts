import { I } from 'Lib';

export enum PreviewType {
	None	 = 0,
	Default	 = 1,
	Link	 = 2,
	Object	 = 3,
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
	target?: string; /** object ID or URL */
	object?: any;
	element?: JQuery<HTMLElement>;
	rect?: any;
	range?: I.TextRange;
	marks?: I.Mark[];
	noUnlink?: boolean;
	noEdit?: boolean;
	passThrough?: boolean;
	noAnimation?: boolean;
	withPlural?: boolean;
	delay?: number;
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	onChange?(marks: I.Mark[]): void;
};
