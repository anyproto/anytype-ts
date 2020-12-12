import { I } from 'ts/lib';

export enum PageType {
	Page		 = 0,
	Home		 = 1,
	Profile		 = 2,
	Archive		 = 3,
	Breadcrumbs	 = 4,
	Set			 = 5,
	ObjectType	 = 6,
	File		 = 7,
};

export interface BlockPage extends I.Block {};