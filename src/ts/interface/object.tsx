import { I } from 'ts/lib';

export enum SmartBlockType {
    Breadcrumbs		 = 0,

    Page				 = 0x10,
    ProfilePage			 = 0x11,
    Home				 = 0x20,
    Archive				 = 0x30,
    Database			 = 0x40,
    Set					 = 0x41,
    ObjectType			 = 0x60,

    File				 = 0x100,
    Template			 = 0x120,

    MarketplaceType		 = 0x110,
    MarketplaceRelation	 = 0x111,
    MarketplaceTemplate	 = 0x112,

    BundledRelation		 = 0x200,
    IndexedRelation		 = 0x201,
    BundledObjectType	 = 0x202,
    AnytypeProfile		 = 0x203,
};

export enum ObjectLayout {
	Page		 = 0,
	Human		 = 1,
	Task		 = 2,
	Set			 = 3,
	ObjectType	 = 4,
	Relation	 = 5,
	File		 = 6,
	Dashboard	 = 7,
	Image		 = 8,
	Video		 = 9,
	Database	 = 20,

	Store		 = 100,
};

export enum RelationType { 
	LongText	 = 0, 
	ShortText	 = 1, 
	Number		 = 2, 
	Status		 = 3, 
	Date		 = 4, 
	File		 = 5,
	Checkbox	 = 6, 
	Url			 = 7,
	Email		 = 8,
	Phone		 = 9,
	Icon		 = 10,
	Tag			 = 11,
	Object		 = 100,
	Relations	 = 101,
};

export enum RelationScope {
	Object				 = 0,
	Type				 = 1,
	SetOfTheSameType	 = 2,
	ObjectsOfTheSameType = 3,
	Library				 = 4,
};

export enum OptionScope {
    Local	 = 0,
	Relation = 1,
	Format	 = 2,
};

export interface ObjectType {
	id: string;
	name: string;
	description?: string;
	layout: ObjectLayout;
	iconEmoji: string;
	isHidden: boolean;
	isArchived: boolean;
	relations: Relation[];
	types: SmartBlockType[];
};

export interface Relation {
	objectId: string;
	relationKey: string;
	format: RelationType;
	name: string;
	dataSource: number;
	isHidden: boolean;
	isReadOnly: boolean;
	objectTypes: string[];
	selectDict: any[];
	maxCount: number;
	scope: RelationScope;
	includeTime?: boolean;
	dateFormat?: I.DateFormat;
	timeFormat?: I.TimeFormat;
};

export interface SelectOption {
	id: string;
	text: string;
	color: string;
	scope: I.OptionScope;
};