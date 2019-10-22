export interface PopupParam {
	onClose?(): void;
};

export interface Popup {
	id: string;
	param: PopupParam;
};