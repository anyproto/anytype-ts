import { I } from 'Lib';

export enum PreviewType {
	None	 = 0,
	Default	 = 1,
	Link	 = 2,
	Object	 = 3,
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
	target?: string; /** object ID or URL */
	object?: any;
	element?: JQuery<HTMLElement>;
	rect?: any;
	range?: I.TextRange;
	marks?: I.Mark[];
	noUnlink?: boolean;
	passThrough?: boolean;
	onChange?(marks: I.Mark[]): void;
};