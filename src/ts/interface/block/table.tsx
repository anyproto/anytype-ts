import { I } from 'Lib';

export interface BlockComponentTable extends I.BlockComponent {
	getData: () => any;
	onEnterHandle: (e: any, type: I.BlockType, rowId: string, columnId: string) => void;
	onLeaveHandle: (e: any) => void;
	onHandleRow: (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => void;
	onHandleColumn: (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => void;
	onOptions: (e: any, type: I.BlockType, rowId: string, columnId: string, cellId: string) => void;
	onCellClick: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellFocus: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellBlur: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellEnter: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellLeave: (e: any, rowId: string, columnId: string, cellId: string) => void;
	onCellUpdate: (cellId: string) => void;
	onCellKeyDown: (e: any, rowId: string, columnId: string, cellId: string, text: string, marks: I.Mark[], range: I.TextRange, props: any) => void;
	onCellKeyUp: (e: any, rowId: string, columnId: string, cellId: string, text: string, marks: I.Mark[], range: I.TextRange, props: any) => void;
	onResizeStart: (e: any, id: string) => void;
	onDragStartRow: (e: any, id: string) => void;
	onDragStartColumn: (e: any, id: string) => void;
};

export interface ContentTableRow {
	isHeader: boolean;
};