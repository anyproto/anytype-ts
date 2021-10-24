import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class TableColumn implements I.TableColumn {
	
	value: string = '';
	width: number = 0;
	horizontal: I.TableAlign = I.TableAlign.Left;
	vertical: I.TableAlign = I.TableAlign.Top;
	
	constructor (props: I.TableColumn) {
		let self = this;
		
		self.value = String(props.value || '');
		self.width = Number(props.width) || 0;
		self.horizontal = Number(props.horizontal) || 0;
		self.vertical = Number(props.vertical) || 0;
	};

};

class TableCell implements I.TableCell {
	
	value: string = '';
	horizontal: I.TableAlign = I.TableAlign.Left;
	vertical: I.TableAlign = I.TableAlign.Top;
	
	constructor (props: I.TableCell) {
		let self = this;
		
		self.value = String(props.value || '');
		self.horizontal = Number(props.horizontal) || 0;
		self.vertical = Number(props.vertical) || 0;
	};

};

class TableRow implements I.TableRow {
	
	cells: TableCell[] = [];
	horizontal: I.TableAlign = I.TableAlign.Left;
	vertical: I.TableAlign = I.TableAlign.Top;
	
	constructor (props: I.TableRow) {
		let self = this;
		
		self.cells = (props.cells || []).map((it: I.TableCell) => { return new TableCell(it); });
		self.horizontal = Number(props.horizontal) || 0;
		self.vertical = Number(props.vertical) || 0;
	};

};

class BlockContentTable implements I.ContentTable {
	
	columns: I.TableColumn[] = [];
	rows: I.TableRow[] = [];
	
	constructor (props: I.ContentTable) {
		let self = this;
		
		self.columns = (props.columns || []).map((it: I.TableColumn) => { return new TableColumn(it); });
		self.rows = (props.rows || []).map((it: I.TableRow) => { return new TableRow(it); });

		makeObservable(self, {
			columns: observable,
			rows: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentTable;