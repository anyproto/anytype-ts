import { I } from 'Lib';

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

export interface PopupSettings extends Popup {
	prevPage: string;
	onPage: (id: string) => void;
	setConfirmPin: (v: () => void) => void;
	setPinConfirmed: (v: boolean) => void;
	onConfirmPin: () => void;
	onImport: (type: I.ImportType, param: any, callBack?: (message: any) => void) => void;
	onExport: (format: I.ExportType, param: any) => void;
};