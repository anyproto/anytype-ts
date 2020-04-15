import { I } from 'ts/lib';

export enum PageType {
	Dashboard	 = 0,
	Page		 = 1,
	Archive		 = 2,
	Breadcrumbs	 = 3,
	Dataview	 = 4,
}

export interface BlockPage extends I.Block {};