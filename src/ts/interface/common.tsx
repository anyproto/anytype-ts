export enum ImageSize { Large, Small, Thumb };

export interface Avatar {
	image?: Image;
};

export interface Image {
	hash: string;
	sizes: ImageSize[];
};

export interface Account {
	id: string;
	name: string;
	color?: string;
	avatar?: Avatar;
};

export enum DragItem {
	Block = 'block',
	Menu = 'menu',
};

export enum CoverType {
	None	 = 0,
	Image	 = 1,
	Color	 = 2,
	Gradient = 3,
};