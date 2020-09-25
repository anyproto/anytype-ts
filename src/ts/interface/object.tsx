export enum ObjectLayout {
	Page	 = 0,
	Contact	 = 1,
	Task	 = 2,
};

export interface ObjectType {
	url: string;
	name: string;
	layout: ObjectLayout;
	relations: Relation[];
};

export enum RelationType { 
	None		 = '',
	Title		 = 'title', 
	Description	 = 'description', 
	Number		 = 'number', 
	Date		 = 'date', 
	Select		 = 'select', 
	Link		 = 'link',
	File		 = 'file',
	Image		 = 'image',
	Checkbox	 = 'checkbox', 
	Icon		 = 'emoji',
	Url			 = 'url',
	Email		 = 'email',
	Phone		 = 'phone',
};

export interface Relation {
	id?: string; // TMP
	type?: RelationType;
	key: string;
	format: string;
	name: string;
	dataSource: string;
	isHidden: boolean;
	isReadOnly: boolean;
	isMultiple: boolean;
	objectType: string;
	options: any[];
};