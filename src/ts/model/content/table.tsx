import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentTable implements I.ContentTable {
	
	constructor (props: I.ContentTable) {
		let self = this;
		
	};

	/*
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
			if (c1.isHead && !c2.isHead) return -1;
			if (!c1.isHead && c2.isHead) return 1;

			const v1 = this.calcCellValue(c1.cells[this.sortIndex].value);
			const v2 = this.calcCellValue(c2.cells[this.sortIndex].value);

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

	setCellProperty (row: number, column: number, k: string, v: any) {
		return this.rows[row].cells[column][k] = v;
	};

	getCellProperty (row: number, column: number, k: string): any {
		return this.rows[row]?.cells[column][k];
	};

	calcCellValue (value: string) {
		value = String(value || '');

		let ret = value;
		let match = value.match(/^=([A-Z]+)\(([^\)]+)\)/i);

		if (match) {
			let f = match[1];
			let a = match[2];

			if (formulajs[f] && a) {
				let arr = a.split(',').map((it: string) => { return it.trim(); });
				let args = [];

				arr.forEach((arg: string) => {
					const m = arg.match(/^c([\d\.]+)/i);
					if (m) {
						const [ r, c ] = m[1].split('.').map((it: string) => { return Number(it) || 0; });
						const v = Number(this.getCellProperty(r - 1, c - 1, 'value')) || 0;

						args.push(v);
					} else {
						args.push(arg);
					};
				});

				ret = formulajs[f].call(this, args);
			};
		};

		return ret;
	};

	*/

};

export default BlockContentTable;