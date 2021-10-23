import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class TableColumn implements I.TableColumn {
	
	value: string = '';
	
	constructor (props: I.TableColumn) {
		let self = this;
		
		self.value = String(props.value || '');
	};

};

class TableRowData implements I.TableRowData {
	
	value: string = '';
	
	constructor (props: I.TableRowData) {
		let self = this;
		
		self.value = String(props.value || '');
	};

};

class TableRow implements I.TableRow {
	
	data: TableRowData[] = [];
	
	constructor (props: I.TableRow) {
		let self = this;
		
		self.data = (props.data || []).map((it: I.TableRowData) => { return new TableRowData(it); });
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