import { I, Util, DataUtil } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class ObjectType implements I.ObjectType {

	id: string = '';
	name: string = '';
	description: string = '';
	layout: I.ObjectLayout = I.ObjectLayout.Page;
	iconEmoji: string = '';
	isArchived: boolean = false;
	isHidden: boolean = false;
	isReadonly: boolean = false;
	types: I.SmartBlockType[] = [];

	constructor (props: I.ObjectType) {
		let self = this;

		self.id = String(props.id || '');
		self.name = String(props.name || DataUtil.defaultName('page'));
		self.description = String(props.description || '');
		self.iconEmoji = String(props.iconEmoji || '');
		self.layout = props.layout || I.ObjectLayout.Page;
		self.isArchived = Boolean(props.isArchived);
		self.isHidden = Boolean(props.isHidden);
		self.isReadonly = Boolean(props.isReadonly);
		self.types = props.types || [];

		makeObservable(self, {
			name: observable,
			description: observable,
			layout: observable,
			types: observable,
			isArchived: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default ObjectType;