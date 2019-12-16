import { I } from 'ts/lib';

export enum ContentUploadState { Empty, Loading, Done };

export enum MediaStyle {
	File	 = 0,
	Image	 = 1,
	Video	 = 2,
};

export interface ContentMedia {
	type: MediaStyle;
	uploadState: ContentUploadState;
	localFilePath: string;
};

export interface BlockMedia extends I.Block {
	content: ContentMedia;
};