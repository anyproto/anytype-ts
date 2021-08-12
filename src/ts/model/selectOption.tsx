import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class SelectOption implements I.SelectOption {
	
	id: string = '';
	text: string = '';
	color: string = '';
	scope: I.OptionScope = I.OptionScope.Local;

	constructor (props: I.SelectOption) {
		let self = this;

		self.id = String(props.id || '');
		self.text = String(props.text || '');
		self.color = String(props.color || '');
		self.scope = Number(props.scope) || I.OptionScope.Local;

		makeObservable(self, {
			text: observable,
			color: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};
};

export default SelectOption;