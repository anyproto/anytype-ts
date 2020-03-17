import { I, Util } from 'ts/lib';
import { observable, intercept } from 'mobx';

class Block implements I.Block {
	
	id: string = '';
	parentId: string = '';
	
	@observable childrenIds: string[] = [];
	@observable type: I.BlockType = I.BlockType.Text;
	@observable align: I.BlockAlign = I.BlockAlign.Left;
	@observable bgColor: string = '';
	@observable fields: any = {};
	@observable content: any = {};
	
	constructor (props: I.Block) {
		let self = this;
		
		self.id = String(props.id || '');
		self.parentId = String(props.parentId || '');
		self.type = props.type;
		self.align = Number(props.align) || I.BlockAlign.Left;
		self.bgColor = String(props.bgColor || '');
		self.fields = props.fields || {};
		self.content = props.content || {};
		self.childrenIds = props.childrenIds || [];
		
		intercept(self as any, (change: any) => {
			if (change.newValue === self[change.name]) {
				return null;
			};
			console.log('Block change', change, self[change.name]);
			return change;
		});
	};
	
	isFocusable () {
		return !this.isLayout();
	};
	
	isPage () { 
		return this.type == I.BlockType.Page;
	};
	
	isLayout () {
		return this.type == I.BlockType.Layout;
	};
	
	isRow () {
		return (this.type == I.BlockType.Layout) && (this.content.style == I.LayoutStyle.Row);
	};
	
	isColumn () {
		return (this.type == I.BlockType.Layout) && (this.content.style == I.LayoutStyle.Column);
	};
	
	isLink () {
		return this.type == I.BlockType.Link;
	};
	
	isIcon () {
		return this.type == I.BlockType.Icon;
	};
	
	isText () {
		return this.type == I.BlockType.Text;
	};
	
	isTitle () {
		return this.isText() && (this.content.style == I.TextStyle.Title);
	};
	
	isToggle () {
		return this.isText() && (this.content.style == I.TextStyle.Toggle);
	};
	
	isNumbered () {
		return this.isText() && (this.content.style == I.TextStyle.Numbered);
	};
};

export default Block;