export enum ImageSize { Large, Small, Thumb };

export interface Avatar {
	image: Image;
};

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

export enum DragItem {
	Block = 'block',
	Menu = 'menu',
};

export interface Progress {
	status: string;
	current?: number;
	total?: number;
};