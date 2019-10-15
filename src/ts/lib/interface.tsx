export enum ImageSize { LARGE, SMALL, THUMB };
export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right };

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

export interface Property {
	id: string;
	name: string;
};

export interface View {
	id: string;
	name: string;
};

export interface Unit {};

export interface UnitDb extends Unit {
	properties: Property[];
	views: View[];
	data: any[];
}; 

export interface Document {
	id: string;
	name: string;
	icon: string;
};

export interface Block {
	id: string;
	parentId: string;
};

export interface PopupParam {
	onClose?(): void;
};

export interface Popup {
	id: string;
	param: PopupParam;
};

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