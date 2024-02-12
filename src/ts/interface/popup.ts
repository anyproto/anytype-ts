import { I } from 'Lib';

export interface PopupParam {
	data?: any;
	className?: string;
	preventResize?: boolean;
	preventMenuClose?: boolean;
	onClose?(): void;
};

export interface Popup {
	id: string;
	param: PopupParam;
	position? (): void;
	close? (callBack?: () => void): void;
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
	onExport: (format: I.ExportType, param: any) => void;
	onSpaceTypeTooltip: (e: any) => void;
};

export interface PopupUsecase extends Popup {
	onPage(page: string, data: any): void;
	getAuthor(author: string): string;
	onAuthor(author: string): void;
};