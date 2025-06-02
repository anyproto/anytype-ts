/**
 * @fileoverview Contains the interface "ContentRelation" and related definitions.
 */
import { I } from 'Lib';

export interface ContentRelation {
	key: string;
};

export interface BlockRelation extends I.Block {
	content: ContentRelation;
};