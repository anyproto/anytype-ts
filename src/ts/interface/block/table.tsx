import { I } from 'ts/lib';

export interface BlockComponentTable extends I.BlockComponent {
	getData: () => any;
	onOptions: (e: any, id: string) => void;
	onHandleClick: (e: any, id: string) => void;
	onCellClick: (e: any, id: string) => void;
	onCellFocus: (e: any, id: string) => void;
	onCellBlur: (e: any, id: string) => void;
	onCellEnter: (e: any, rowIdx: number, columnIdx: number, id: string) => void;
	onCellLeave: (e: any, rowIdx: number, columnIdx: number, id: string) => void;
	onResizeStart: (e: any, id: string) => void;
	onDragStartRow: (e: any, id: string) => void;
	onDragStartColumn: (e: any, id: string) => void;
};

export interface ContentTable {
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};