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
			return change;
		});
	};
	
	isFocusable (): boolean {
		return !this.isPage() && !this.isLayout();
	};
	
	isSelectable (): boolean {
		return !this.isPage() && !this.isLayout() && !this.isIcon() && !this.isTitle();
	};
	
	isDraggable (): boolean {
		return !this.isPage() && !this.isLayout() && !this.isIcon() && !this.isTitle();
	};
	
	isPage (): boolean { 
		return this.type == I.BlockType.Page;
	};
	
	isLayout (): boolean {
		return this.type == I.BlockType.Layout;
	};
	
	isLayoutRow (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.Row);
	};
	
	isLayoutColumn (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.Column);
	};
	
	isLayoutDiv (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.Div);
	};
	
	isLink (): boolean {
		return this.type == I.BlockType.Link;
	};
	
	isIcon (): boolean {
		return this.type == I.BlockType.Icon;
	};
	
	isText (): boolean {
		return this.type == I.BlockType.Text;
	};
	
	isFile (): boolean {
		return this.type == I.BlockType.File;
	};
	
	isImage (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Image);
	};
	
	isVideo (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Video);
	};
	
	isDiv (): boolean {
		return this.type == I.BlockType.Div;
	};
	
	isTitle (): boolean {
		return this.type == I.BlockType.Title;
	};
	
	isHeader (): boolean {
		return this.isText() && (this.isHeader1() || this.isHeader2() || this.isHeader3());
	};
	
	isHeader1 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header1);
	};
	
	isHeader2 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header2);
	};
	
	isHeader3 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header3);
	};
	
	isToggle (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Toggle);
	};
	
	isNumbered (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Numbered);
	};
	
	isBulleted (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Bulleted);
	};
	
	isCheckbox (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Checkbox);
	};
	
	isCode (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Code);
	};
	
	isQuote (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Quote);
	};
	
	getLength (): number {
		return String(this.content.text || '').length;
	};
};

export default Block;