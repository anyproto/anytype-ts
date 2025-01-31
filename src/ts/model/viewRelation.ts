import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class ViewRelation implements I.ViewRelation {

	relationKey = '';
	width = 0;
	isVisible = false;
	includeTime = false;
	formulaType: I.FormulaType = I.FormulaType.None;
	align = I.BlockHAlign.Left;

	constructor (props: I.ViewRelation) {
		this.relationKey = String(props.relationKey || '');
		this.width = Number(props.width) || 0;
		this.isVisible = Boolean(props.isVisible);
		this.includeTime = Boolean(props.includeTime);
		this.formulaType = Number(props.formulaType) || I.FormulaType.None;
		this.align = Number(props.align) || I.BlockHAlign.Left;

		makeObservable(this, {
			width: observable,
			isVisible: observable,
			includeTime: observable, 
			formulaType: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default ViewRelation;