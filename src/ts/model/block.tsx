import { I, Util } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observable, intercept } from 'mobx';

class Block implements I.Block {
	
	id: string = '';
	parentId: string = '';
	pageType: any = null;
	type: I.BlockType = I.BlockType.Empty;
	
	@observable childrenIds: string[] = [];
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
		self.pageType = props.pageType;
		
		intercept(self as any, (change: any) => {
			if (change.newValue === self[change.name]) {
				return null;
			};
			return change;
		});
	};

	isSystem () {
		return this.isPage() || this.isLayout();
	};

	canHaveTitle (): boolean {
		return this.isPagePage() || this.isPageProfile() || this.isPageSet();
	};

	canHaveChildren (): boolean {
		return !this.isSystem() && (this.isTextParagraph() || this.isTextList());
	};

	canHaveAlign (): boolean {
		return !this.isSystem() && (this.isTextParagraph() || this.isTextHeader() || this.isImage() || this.isVideo());
	};

	canHaveColor (): boolean {
		return !this.isSystem() && this.isText() && !this.isTextCode();
	};

	canHaveBackground (): boolean {
		return !this.isSystem() && !this.isBookmark();
	};

	canTurn (): boolean {
		return !this.isSystem() && (this.isText() || this.isDiv());
	};
	
	isIndentable (): boolean {
		return !this.isSystem() && !this.isTitle() && !this.isDiv() && !this.isTextHeader() && !this.isTextCode();
	};
	
	isFocusable (): boolean {
		return !this.isSystem();
	};
	
	isSelectable (): boolean {
		return !this.isSystem() && !this.isIcon() && !this.isTitle();
	};
	
	isDraggable (): boolean {
		return !this.isSystem() && !this.isIcon() && !this.isTitle();
	};

	isPage (): boolean { 
		return (this.type == I.BlockType.Page);
	};
	
	isPagePage (): boolean { 
		return this.isPage() && (this.pageType == I.PageType.Page);
	};

	isPageProfile (): boolean { 
		return this.isPage() && (this.pageType == I.PageType.Profile);
	};

	isPageSet (): boolean { 
		return this.isPage() && (this.pageType == I.PageType.Set);
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

	isLinkPage (): boolean {
		return this.isLink() && (this.content.style == I.LinkStyle.Page);
	};
	
	isLinkArchive (): boolean {
		return this.isLink() && (this.content.style == I.LinkStyle.Archive);
	};
	
	isIcon (): boolean {
		return this.isIconPage() || this.isIconUser();
	};
	
	isIconPage (): boolean {
		return this.type == I.BlockType.IconPage;
	};
	
	isIconUser (): boolean {
		return this.type == I.BlockType.IconUser;
	};
	
	isFile (): boolean {
		return this.type == I.BlockType.File;
	};

	isBookmark (): boolean {
		return this.type == I.BlockType.Bookmark;
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

	isDivLine (): boolean {
		return this.isDiv() && (this.content.type == I.DivStyle.Line);
	};

	isDivDot (): boolean {
		return this.isDiv() && (this.content.type == I.DivStyle.Dot);
	};
	
	isTitle (): boolean {
		return this.type == I.BlockType.Title;
	};

	isText (): boolean {
		return this.type == I.BlockType.Text;
	};

	isTextParagraph (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Paragraph);
	}; 
	
	isTextHeader (): boolean {
		return this.isText() && (this.isTextHeader1() || this.isTextHeader2() || this.isTextHeader3());
	};
	
	isTextHeader1 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header1);
	};
	
	isTextHeader2 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header2);
	};
	
	isTextHeader3 (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Header3);
	};

	isTextList (): boolean {
		return this.isTextToggle() || this.isTextNumbered() || this.isTextBulleted() || this.isTextCheckbox();
	};
	
	isTextToggle (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Toggle);
	};
	
	isTextNumbered (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Numbered);
	};
	
	isTextBulleted (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Bulleted);
	};
	
	isTextCheckbox (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Checkbox);
	};
	
	isTextCode (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Code);
	};
	
	isTextQuote (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Quote);
	};
	
	getLength (): number {
		let t = '';
		if (this.isTitle()) {
			const details = blockStore.getDetails(this.parentId, this.parentId);
			t = details.name;
		} else {
			t = this.content.text;
		};

		return String(t || '').length;
	};
};

export default Block;