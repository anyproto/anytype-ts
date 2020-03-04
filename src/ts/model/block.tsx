import { I } from 'ts/lib';
import { observable, intercept } from 'mobx';

class Block implements I.Block {
	
	@observable type: I.BlockType = I.BlockType.Text;
	@observable align: I.BlockAlign = I.BlockAlign.Left;
	@observable bgColor: string = '';
	@observable fields: any = {};
	@observable content: any = {};
	@observable childrenIds: string[] = [];

	id: string = '';
	parentId: string = '';
	childBlocks: I.Block[] = [];
	
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
		self.childBlocks = props.childBlocks || [];

		const disposer = intercept(self as any, (change: any) => {
			console.log('Change block', change, 'old', self[name]);
			console.trace();
			return change;
		});
	};
	
	update (props: any) {
		let changes: any = {};
		let self = this as any;
		
		for (let p in props) {
			if (self[p] !== props[p]) {
				self[p] = props[p];
			};
		};
	};
	
	isPage () { 
		return this.type == I.BlockType.Page;
	};
	
	isLayout () {
		return this.type == I.BlockType.Layout;
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
};

export default Block;