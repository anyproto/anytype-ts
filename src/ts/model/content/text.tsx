import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Mark implements I.Mark {
	
	type: I.MarkType = I.MarkType.Strike;
	param: string = '';
	range: I.TextRange = { from: 0, to: 0 };

	constructor (props: I.Mark) {
		let self = this;
		
		self.type = Number(props.type) || I.MarkType.Strike;
		self.param = String(props.param || '');
		self.range = props.range || { from: 0, to: 0 };

		makeObservable(self, {
			type: observable,
			param: observable,
			range: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

class BlockContentText implements I.ContentText {
	
	text: string = '';
	style: I.TextStyle = I.TextStyle.Paragraph;
	checked: boolean = false;
	color: string = '';
	iconEmoji: string = '';
	iconImage: string = '';
	marks: I.Mark[] = [];

	constructor (props: I.ContentText) {
		let self = this;
		
		self.text = String(props.text || '');
		self.style = Number(props.style) || I.TextStyle.Paragraph;
		self.checked = Boolean(props.checked);
		self.color = String(props.color || '');
		self.iconEmoji = String(props.iconEmoji || '');
		self.iconImage = String(props.iconImage || '');
		self.marks = (props.marks || []).map((it: I.Mark) => { return new Mark(it); });

		makeObservable(self, {
			text: observable,
			style: observable,
			checked: observable,
			color: observable,
			iconEmoji: observable,
			iconImage: observable,
			marks: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentText;