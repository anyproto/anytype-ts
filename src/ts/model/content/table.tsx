import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

const Constant = require('json/constant.json');

class TableCell implements I.TableCell {
	
	value: string = '';
	horizontal: I.TableAlign = I.TableAlign.Left;
	vertical: I.TableAlign = I.TableAlign.Top;
	color: string = '';
	background: string = '';
	width: number = 0;
	
	constructor (props: I.TableCell) {
		let self = this;
		
		self.value = String(props.value || '');
		self.horizontal = Number(props.horizontal) || I.TableAlign.Left;
		self.vertical = Number(props.vertical) || I.TableAlign.Top;
		self.color = String(props.color || '');
		self.background = String(props.background || '');
		self.width = Number(props.width) || 0;
	};

};

class TableRow implements I.TableRow {
	
	cells: TableCell[] = [];
	isHeader: boolean = false;
	
	constructor (props: I.TableRow) {
		let self = this;
		
		self.cells = (props.cells || []).map((it: I.TableCell) => { return new TableCell(it); });
	};

	fill (columnCount: number) {
		for (let i = 0; i < columnCount; ++i) {
			this.cells[i] = Object.assign({
				value: '', 
				horizontal: I.TableAlign.Left,
				vertical: I.TableAlign.Top,
				color: '',
				background: '',
				width: Constant.size.table.cell,
			}, this.cells[i] || {});
		};
		return this;
	};

};

class BlockContentTable implements I.ContentTable {
	
	columnCount: number = 0;
	sortIndex: number = 0;
	sortType: I.SortType = I.SortType.Asc;
	rows: I.TableRow[] = [];
	
	constructor (props: I.ContentTable) {
		let self = this;
		
		self.columnCount = Number(props.columnCount) || 0;
		self.sortIndex = Number(props.sortIndex) || 0;
		self.sortType = Number(props.sortType) || I.SortType.Asc;

		self.rows = (props.rows || []).map((it: I.TableRow) => { return new TableRow(it); });

		this.sort();

		makeObservable(self, {
			columnCount: observable,
			rows: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

	sort () {
		if (!this.rows.length) {
			return;
		};

		this.rows[0].isHead = true;
		this.rows.sort((c1: any, c2: any) => {
			const v1 = c1.cells[this.sortIndex].value;
			const v2 = c2.cells[this.sortIndex].value;

			if (c1.isHead && !c2.isHead) return -1;
			if (!c1.isHead && c2.isHead) return 1;
			
			if (this.sortType == I.SortType.Asc) {
				if (v1 < v2) return -1;
				if (v1 > v2) return 1;
			} else {
				if (v1 < v2) return 1;
				if (v1 > v2) return -1;
			};
			return 0;
		});

	};

};

export {
	TableRow,
	TableCell,
	BlockContentTable,
};