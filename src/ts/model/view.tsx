import { I } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observable, intercept } from 'mobx';

const Constant = require('json/constant.json');

class View implements I.View {
	
	@observable id: string = '';
	@observable name: string = '';
	@observable type: I.ViewType = I.ViewType.Grid;
	@observable sorts: I.Sort[] = [];
	@observable filters: I.Filter[] = [];
	@observable relations: any[] = [];
	
	constructor (props: I.View) {
		let self = this;
		
		self.id = String(props.id || '');
		self.name = String(props.name || Constant.default.name);
		self.type = Number(props.type) || I.ViewType.Grid;
		self.sorts = props.sorts || [];
		self.filters = props.filters || [];
		self.relations = props.relations || [];
	};

};

export default View;