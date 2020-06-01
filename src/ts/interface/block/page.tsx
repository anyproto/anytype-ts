import { I } from 'ts/lib';

export enum PageType {
	Page		 = 0,
	Home		 = 1,
	Profile		 = 2,
	Archive		 = 3,
	Breadcrumbs	 = 4,
	Dataview	 = 5,
};

export interface BlockPage extends I.Block {};