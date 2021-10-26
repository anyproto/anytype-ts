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
			this.cells[i] = this.cells[i] || new TableCell({
				value: '', 
				width: Constant.size.table.cell,
			});
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

		self.fill();
		self.sort(self.sortIndex, self.sortType);

		makeObservable(self, {
			columnCount: observable,
			rows: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

	fill () {
		this.rows.forEach((row: I.TableRow) => { row.fill(this.columnCount); });
	};

	sort (column: number, sort: I.SortType) {
		this.sortIndex = column;
		this.sortType = sort;

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

	columnAdd (index: number, dir: number) {
		const idx = index + (dir > 0 ? 1 : 0);

		for (let row of this.rows) {
			const cell = new TableCell({ 
				...row.cells[index],
				value: '', 
				width: Constant.size.table.cell,
			});
			row.cells.splice(idx, 0, cell);
		};

		this.columnCount++;
	};

	columnRemove (index: number) {
		for (let row of this.rows) {
			row.cells.splice(index, 1);
		};
		this.columnCount--;
	};

	rowAdd (index: number, dir: number) {
		index = Math.max(0, index);

		const idx = index + (dir > 0 ? 1 : 0);
		const row: I.TableRow = new TableRow(this.rows[index] || { cells: [] }).fill(this.columnCount);
		
		row.cells.map((it: I.TableCell) => {
			it.value = '';
			return it;
		});
		this.rows.splice(idx, 0, row);
	};

	rowRemove (index: number) {
		this.rows.splice(index, 1);
	};

};

export {
	TableRow,
	TableCell,
	BlockContentTable,
};