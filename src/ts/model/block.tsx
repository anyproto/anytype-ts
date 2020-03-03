import { I } from 'ts/lib';
import { observable } from 'mobx';

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
		this.id = String(props.id || '');
		this.parentId = String(props.parentId || '');
		this.type = props.type;
		this.align = Number(props.align) || I.BlockAlign.Left;
		this.bgColor = String(props.bgColor || '');
		this.fields = props.fields || {};
		this.content = props.content || {};
		this.childrenIds = props.childrenIds || [];
		this.childBlocks = props.childBlocks || [];
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