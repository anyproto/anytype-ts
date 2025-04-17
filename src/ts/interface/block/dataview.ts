import { I } from 'Lib';

export enum CardSize {
	Small			 = 0,
	Medium			 = 1,
	Large			 = 2,
};

export enum DateFormat {
	MonthAbbrBeforeDay	 = 0, // Jul 30, 2020
	MonthAbbrAfterDay	 = 1, // 30 Jul 2020
	Short				 = 2, // 30/07/2020
	ShortUS				 = 3, // 07/30/2020
	ISO					 = 4, // 2020-07-30
	Long				 = 5, // July 15, 2020 
	Nordic				 = 6, // 15. Jul 2020  
	European			 = 7, // 15.07.2020,
	Default				 = 8, // Sat, Dec 14, 2024
};

export enum TimeFormat {
	H12				 = 0,
	H24				 = 1,
};

export enum ViewType {
	Grid			 = 0,
	List			 = 1,
	Gallery			 = 2,
	Board			 = 3,
	Calendar		 = 4,
	Graph			 = 5,
};

export enum SortType { 
	Asc				 = 0, 
	Desc			 = 1,
	Custom			 = 2,
};

export enum EmptyType {
	None			 = 0,
	Start			 = 1,
	End				 = 2,
};

export enum FilterOperator { 
	None			 = 0,
	And				 = 1,
	Or				 = 2,
};

export enum FilterCondition { 
	None			 = 0,
	Equal			 = 1,
	NotEqual		 = 2,
	Greater			 = 3,
	Less			 = 4,
	GreaterOrEqual	 = 5,
	LessOrEqual		 = 6,
	Like			 = 7,
	NotLike			 = 8,
	In				 = 9,
	NotIn			 = 10,
	Empty			 = 11,
	NotEmpty		 = 12,
	AllIn			 = 13,
	NotAllIn		 = 14,
	ExactIn			 = 15,
	NotExactIn		 = 16,
};

export enum FilterQuickOption {
	ExactDate		 = 0,
	Yesterday		 = 1,
	Today			 = 2,
	Tomorrow		 = 3,
	LastWeek		 = 4,
	CurrentWeek		 = 5,
	NextWeek		 = 6,
	LastMonth		 = 7,
	CurrentMonth	 = 8,
	NextMonth		 = 9,
	NumberOfDaysAgo	 = 10,
	NumberOfDaysNow	 = 11,
};

export enum FormulaType {
	None				 = 0,
	Count				 = 1,
	CountValue 			 = 2,
	CountDistinct		 = 3,
	CountEmpty			 = 4,
	CountNotEmpty		 = 5,
	PercentEmpty		 = 6,
	PercentNotEmpty		 = 7,
	MathSum				 = 8,
	MathAverage			 = 9,
	MathMedian			 = 10,
	MathMin				 = 11,
	MathMax				 = 12,
	Range				 = 13,
};

export enum FormulaSection {
	None				 = 0,
	Count				 = 1,
	Percent				 = 2,
	Math				 = 3,
	Date				 = 4,
};

export interface Sort {
	id?: string;
	relationKey: string;
	type: SortType;
	includeTime?: boolean;
	customOrder?: any[];
	empty?: EmptyType;
};

export interface Filter {
	id?: string;
	relationKey: string;
	condition: FilterCondition;
	value: any;
	operator?: FilterOperator;
	format?: I.RelationType;
	quickOption?: FilterQuickOption;
	nestedFilters?: Filter[];
};

export interface ViewRelation {
	relationKey: string;
	isVisible?: boolean;
	width?: number;
	includeTime?: boolean;
	formulaType?: I.FormulaType;
	align?: I.BlockHAlign;
};

export interface ViewComponent {
	rootId?: string;
	block?: I.Block;
	readonly: boolean;
	pageContainer?: string;
	isPopup?: boolean;
	isInline?: boolean;
	isCollection?: boolean;
	className?: string;
	refCells?: any;
	recordId?: string;
	recordIdx?: number;
	getRecord?(id: string): any;
	getRecords?(): string[];
	onRef?(ref: any, id: string): void;
	loadData(viewId: string, offset: number, clear: boolean, callBack?: (message: any) => void): void;
	getCoverObject?(id: string): any;
	getView?(): View;
	getSources?(): string[];
	getTarget?(): any;
	getKeys?(viewId: string): string[];
	getIdPrefix?(): string;
	getLimit?(): number;
	getVisibleRelations?(): I.ViewRelation[];
	getTypeId?(): string;
	getTemplateId?(): string;
	getEmpty?(type: string): any;
	getSubId?(): string;
	onRecordAdd?: (e: any, dir: number, groupId?: string) => void;
	onTemplateAdd?: () => void;
	onSortAdd?: (item: any, callBack?: () => void) => void;
	onFilterAdd?: (item: any, callBack?: () => void) => void;
	onTemplateMenu?: (e: any, dur: number) => void;
	onCellClick?(e: any, key: string, id?: string, record?: any): void;
	onContext?(e: any, id: string, subId?: string): void;
	onCellChange?: (id: string, key: string, value: any, callBack?: (message: any) => void) => void;
	onDragRecordStart?: (e: any, id?: string) => void;
	onSelectToggle?: (e: React.MouseEvent, id: string) => void;
	onSelectEnd?: () => void;
	isAllowedObject?: () => boolean;
	isAllowedDefaultType?: () => boolean;
	objectOrderUpdate?: (orders: any[], records: any[], callBack?: (message: any) => void) => void;
	applyObjectOrder?: (groupId: string, records: any[]) => any[];
	onSourceSelect?(element: any, param: Partial<I.MenuParam>): void;
	onSourceTypeSelect?(element: any): void;
	onViewSettings?(): void;
	getSearchIds?(): string[];
	canCellEdit?(relation: any, record: any): boolean;
};

export interface ViewEmpty {
	rootId?: string;
	block?: I.Block;
	title: string;
	description: string;
	button: string;
	withButton: boolean;
	className?: string;
	onClick: (e: any) => void;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
	coverRelationKey: string;
	groupRelationKey: string;
	groupBackgroundColors: boolean;
	coverFit: boolean;
	cardSize: I.CardSize;
	hideIcon: boolean;
	pageLimit: number;
	sorts: Sort[];
	filters: Filter[];
	relations: any[];
	defaultTemplateId: string;
	defaultTypeId: string;
	getVisibleRelations?: () => I.ViewRelation[];
	getRelations?: () => I.ViewRelation[];
	getRelation?: (relationKey: string) => I.ViewRelation;
	isGrid?(): boolean;
	isList?(): boolean;
	isGallery?(): boolean;
	isBoard?(): boolean;
};

export interface Cell {
	rootId?: string;
	subId: string;
	block?: I.Block;
	id?: string;
	idPrefix?: string;
	relation?: any;
	relationKey?: string;
	viewType: I.ViewType;
	readonly?: boolean;
	canOpen?: boolean;
	canEdit?: boolean;
	pageContainer?: string;
	isInline?: boolean;
	size?: number;
	iconSize?: number;
	placeholder?: string;
	withLabel?: boolean;
	withName?: boolean;
	textLimit?: number;
	arrayLimit?: number;
	shortUrl?: boolean;
	menuClassName?: string;
	menuClassNameWrap?: string;
	recordId?: string;
	recordIdx?: number;
	groupId?: string;
	getRecord?(id: string): any;
	getRecords?(): string[];
	getView?(): View;
	onChange?(value: any, callBack?: (message: any) => void): void;
	onClick?(e: any): void;
	onMouseEnter?(e: any): void;
	onMouseLeave?(e: any): void;
	onCellChange?(id: string, key: string, value: any, callBack?: (message: any) => void): void;
	onRecordAdd?(e: any, dir: number, groupId?: string, menuParam?: any, idx?: number): void;
	cellPosition?(cellId: string): void;
	elementMapper?(relation: any, item: any): any;
};

export interface CellRef {
	onClick?(e: any): void;
	onBlur?(): void;
	setEditing?(v: boolean): void;
	isEditing?(): boolean;
	onChange?(value: any): void;
	getValue?(): any;
	canEdit?(): boolean;
};

export interface BoardGroup {
	id: string;
	value: any;
};

export interface ContentDataview {
	sources: string[];
	viewId: string;
	views: View[];
	relationLinks: any[];
	groupOrder: any[];
	objectOrder: any[];
	targetObjectId: string;
	isCollection: boolean;
};

export interface BlockDataview extends I.Block {
	content: ContentDataview;
};
