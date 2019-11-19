import { I } from 'ts/lib';

export enum ContentUploadState { Empty, Loading, Done };

export interface ContentMedia {
	uploadState: ContentUploadState;
	localFilePath: string;
};

export interface BlockMedia extends I.Block {
	content: ContentMedia;
};