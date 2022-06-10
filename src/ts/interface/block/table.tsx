import { I } from 'ts/lib';

export interface BlockComponentTable extends I.BlockComponent {
	getData: () => any;
	onOptions: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onHandleClick: (e: any, id: string) => void;
	onCellClick: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellFocus: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellBlur: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellEnter: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellLeave: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onResizeStart: (e: any, id: string) => void;
	onDragStartRow: (e: any, id: string) => void;
	onDragStartColumn: (e: any, id: string) => void;
};

export interface ContentTable {
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};