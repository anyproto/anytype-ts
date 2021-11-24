import { I } from 'ts/lib';

export enum FileStyle {
	Auto = 0,
	Link = 1,
	Embed = 2,
};

export enum FileType {
	None	 = 0,
	File	 = 1,
	Image	 = 2,
	Video	 = 3,
	Audio	 = 4,
	PDF      = 5,
};

export enum FileState {
	Empty		 = 0,
	Uploading	 = 1,
	Done		 = 2,
	Error		 = 3,
};

export interface ContentFile {
	hash: string;
	name: string;
	mime: string;
	size: number;
	state: FileState;
	type: FileType;
};

export interface BlockFile extends I.Block {
	content: ContentFile;
};