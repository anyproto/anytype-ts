import { I } from 'Lib';

export enum PreviewType {
	Link	 = 0,
	Object	 = 1,
	Graph	 = 2,
};

export interface PreviewLink {
	type: string;
	title: string;
	description: string;
	faviconUrl: string;
	imageUrl: string;
};

export interface Preview {
	type: PreviewType,
	target: string; /** object ID or URL */
	element: JQuery<HTMLElement>;
	range?: I.TextRange;
	marks?: I.Mark[];
	noUnlink?: boolean;
	onChange?(marks: I.Mark[]): void;
};