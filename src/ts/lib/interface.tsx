export enum ImageSize { LARGE, SMALL, THUMB };
export enum MenuType { Vertical = 1, Horizontal };
export enum MenuDirection { Top = 1, Bottom, Left, Right };

export interface ImageInterface {
	id: string;
	sizes: ImageSize[];
};

export interface AccountInterface {
	id: string;
	name: string;
	color?: string;
	avatar?: ImageInterface;
};

export interface DocumentInterface {
	id: string;	
};

export interface PopupParam {
	onClose?(): void;
};

export interface PopupInterface {
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

export interface MenuInterface {
	id: string;
	param: MenuParam;
};

export interface MenuItemInterface {
	icon: string;
	name: string;
};