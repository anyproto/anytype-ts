import { I } from 'ts/lib';

export enum PageType {
	Page		 = 0,
	Home		 = 1,
	Profile		 = 3,
	Archive		 = 4,
	Breadcrumbs	 = 5,
}

export interface BlockPage extends I.Block {};