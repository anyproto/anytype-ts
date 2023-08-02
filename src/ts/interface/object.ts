export enum ObjectLayout {
	Page		 = 0,
	Human		 = 1,
	Task		 = 2,
	Set			 = 3,
	Type		 = 4,
	Relation	 = 5,
	File		 = 6,
	Dashboard	 = 7,
	Image		 = 8,
	Note		 = 9,
	Space		 = 10,
	Bookmark	 = 11,
	OptionList	 = 12,
	Option		 = 13,
	Collection   = 14,
	Audio		 = 15,
	Video		 = 16,
	Date		 = 17,
	
	Database	 = 20,

	Empty		 = 100,
	Navigation	 = 101,
	Graph		 = 102,
	Store		 = 103,
	History		 = 104,
	Archive		 = 105,
	Block		 = 106,
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
};

export enum ObjectFlag {
	DeleteEmpty		 = 0,
	SelectType		 = 1,
    SelectTemplate	 = 2,
};
