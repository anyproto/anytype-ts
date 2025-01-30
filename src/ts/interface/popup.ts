import { I } from 'Lib';

export interface PopupParam {
	data?: any;
	className?: string;
	preventResize?: boolean;
	preventMenuClose?: boolean;
	preventCloseByClick?: boolean;
	preventCloseByEscape?: boolean;
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

export interface PopupUsecase extends Popup {
	onPage(page: string, data: any): void;
	getAuthor(author: string): string;
	onAuthor(author: string): void;
};
