// Common

export enum ImageSize { Large, Small, Thumb };

export interface Image {
	id: string;
	sizes: ImageSize[];
};

export interface Account {
	id: string;
	name: string;
	color?: string;
	avatar?: Image;
};

// Blocks

export enum ViewType { Grid };
export enum PropertyType { Title, Text, Number };

export interface Property {
	id: string;
	name: string;
	type: PropertyType;
};

export interface View {
	id: string;
	name: string;
	type: ViewType;
};

export interface Block {
	id: string;
	parentId?: string;
	name: string;
	icon: string;
};

export interface BlockDb extends Block {
	view: string;
	properties: Property[];
	views: View[];
	data: any[];
};

// Popups

export interface PopupParam {
	onClose?(): void;
};

export interface Popup {
	id: string;
	param: PopupParam;
};

// Menu

export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right };

export interface MenuParam {
	element: string;
	type: MenuType;
	vertical: MenuDirection;
	horizontal: MenuDirection;
	offsetX: number;
	offsetY: number;
	onClose?(): void;
};

export interface Menu {
	id: string;
	param: MenuParam;
};

export interface MenuItem {
	icon: string;
	name: string;
};