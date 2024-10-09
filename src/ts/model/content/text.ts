import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

export class Mark implements I.Mark {
	
	type: I.MarkType = I.MarkType.Strike;
	param = '';
	range: I.TextRange = { from: 0, to: 0 };

	constructor (props: I.Mark) {
		this.type = Number(props.type) || I.MarkType.Strike;
		this.param = String(props.param || '');
		this.range = props.range || { from: 0, to: 0 };

		makeObservable(this, {
			type: observable,
			param: observable,
			range: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export class BlockContentText implements I.ContentText {
	
	text = '';
	style: I.TextStyle = I.TextStyle.Paragraph;
	checked = false;
	color = '';
	iconEmoji = '';
	iconImage = '';
	marks: I.Mark[] = [];

	constructor (props: I.ContentText) {
		this.text = String(props.text || '');
		this.style = Number(props.style) || I.TextStyle.Paragraph;
		this.checked = Boolean(props.checked);
		this.color = String(props.color || '');
		this.iconEmoji = String(props.iconEmoji || '');
		this.iconImage = String(props.iconImage || '');
		this.marks = (props.marks || []).map(it => new Mark(it));

		makeObservable(this, {
			text: observable,
			style: observable,
			checked: observable,
			color: observable,
			iconEmoji: observable,
			iconImage: observable,
			marks: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};