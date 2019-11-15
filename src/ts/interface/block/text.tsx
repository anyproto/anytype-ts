import { I } from 'ts/lib';

export enum TextStyle {
	p		 = 0,
	h1		 = 1,
	h2		 = 2,
	h3		 = 3,
	h4		 = 4,
	quote	 = 5,
	code	 = 6,
	title	 = 7,
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