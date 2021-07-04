import { I, M, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

const Constant = require('json/constant.json');

class ObjectType implements I.ObjectType {

	id: string = '';
	name: string = '';
	description: string = '';
	layout: I.ObjectLayout = I.ObjectLayout.Page;
	iconEmoji: string = '';
	isHidden: boolean = false;
	relations: I.Relation[] = [];
	types: I.SmartBlockType[] = [];

	constructor (props: I.ObjectType) {
		let self = this;

		self.id = String(props.id || '');
		self.name = String(props.name || Constant.default.name);
		self.description = String(props.description || '');
		self.iconEmoji = String(props.iconEmoji || '');
		self.layout = props.layout || I.ObjectLayout.Page;
		self.isHidden = Boolean(props.isHidden);
		self.relations = (props.relations || []).map((it: any) => { return new M.Relation(it); });
		self.types = props.types || [];

		makeObservable(self, {
			name: observable,
			description: observable,
			layout: observable,
			relations: observable,
			types: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default ObjectType;