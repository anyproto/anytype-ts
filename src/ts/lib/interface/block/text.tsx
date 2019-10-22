import { I } from 'ts/lib';

export enum TextStyle {
	p		 = 0,
	h1		 = 1,
	h2		 = 2,
	h3		 = 3,
	h4		 = 4,
	quote	 = 5
};

export enum MarkerType {
	None	 = 0,
	Number	 = 1,
	Bullet	 = 2
};

export enum MarkType {
	S		 = 0,
	KBD		 = 1,
	I		 = 2,
	B		 = 3,
	A		 = 4,
};

export interface Range {
	from: number;
	to: number;
};

export interface Mark {
	range: Range;
	type: MarkType;
};

export interface ContentText {
	text: string;
	style: TextStyle;
	marks: Mark[];
	toggleable: boolean;
	markerType: MarkerType;
	checkable: boolean;
	checked: boolean;
};

export interface BlockText extends I.Block {
	content: ContentText;
};