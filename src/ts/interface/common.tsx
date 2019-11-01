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

export enum DragItem {
	Block = 'Block',
};