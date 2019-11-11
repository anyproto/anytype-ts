import { I } from 'ts/lib';

export enum TextStyle {
	title	 = 0,
	p		 = 1,
	h1		 = 2,
	h2		 = 3,
	h3		 = 4,
	h4		 = 5,
	quote	 = 6,
	code	 = 7,
};

export enum MarkerType {
	None	 = 0,
	Number	 = 1,
	Bullet	 = 2
};

export enum MarkType {
	Strike	 = 0,
	Code	 = 1,
	Italic	 = 2,
	Bold	 = 3,
	Link	 = 4,
};

export interface TextRange {
	from: number;
	to: number;
};

export interface Mark {
	range: TextRange;
	type: MarkType;
};

export interface ContentText {
	text: string;
	style: TextStyle;
	marks: Mark[];
	marker: MarkerType;
	toggleable: boolean;
	checkable: boolean;
	checked: boolean;
};

export interface BlockText extends I.Block {
	content: ContentText;
};