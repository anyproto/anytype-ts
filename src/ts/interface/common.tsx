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

export enum ProgressType {
	File = 0,
};

export enum ProgressState {
	None	 = 0,
	Running	 = 1,
	Done	 = 2,
	Canceled = 3,
	Error	 = 4,
}

export interface Progress {
	id?: string;
	type?: ProgressType;
	status?: string;
	current?: number;
	total?: number;
	isUnlocked?: boolean;
	canCancel?: boolean;
};