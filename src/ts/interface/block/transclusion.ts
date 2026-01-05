import { I } from 'Lib';

export interface BlockReference {
	rootId: string;
	blockId: string;
}

export interface ContentTransclusion {
	source: BlockReference;
}

export interface BlockTransclusion extends I.Block {
	content: ContentTransclusion;
}
