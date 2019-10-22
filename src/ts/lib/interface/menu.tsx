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