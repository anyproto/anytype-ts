export interface PopupParam {
	data?: any;
	preventResize?: boolean;
	preventMenuClose?: boolean;
	onClose?(): void;
};

export interface Popup {
	id: string;
	param: PopupParam;
	position? (): void;
	close? (): void;
	storageGet?(): any;
	storageSet?(data: any): void;
	getId?(): string;
};