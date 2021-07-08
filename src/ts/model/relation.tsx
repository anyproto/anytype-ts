import { I, M, Util } from 'ts/lib';
import { decorate, observable, intercept } from 'mobx';

class Relation implements I.Relation {

	objectId: string = '';
	relationKey: string = '';
	name: string = '';
	dataSource: number = 0;
	objectTypes: string[] = [];
	format: I.RelationType = I.RelationType.LongText;
	isHidden: boolean = false;
	isReadonly: boolean = false;
	maxCount: number = 0;
	scope: I.RelationScope = I.RelationScope.Object;
	selectDict: any[] = [] as any[];

	constructor (props: I.Relation) {
		let self = this;

		self.objectId = String(props.objectId || '');
		self.relationKey = String(props.relationKey || '');
		self.name = String(props.name || '');
		self.dataSource = Number(props.dataSource) || 0;
		self.objectTypes = props.objectTypes || [];
		self.format = props.format || I.RelationType.LongText;
		self.isHidden = Boolean(props.isHidden);
		self.isReadonly = Boolean(props.isReadonly);
		self.maxCount = Number(props.maxCount) || 0;
		self.scope = props.scope || I.RelationScope.Object;
		self.selectDict = (props.selectDict || []).map((it: any) => { return new M.SelectOption(it); });

		decorate(self, {
			name: observable,
			format: observable,
			objectTypes: observable,
			selectDict: observable,
			scope: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default Relation;