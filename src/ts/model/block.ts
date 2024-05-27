import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

import BlockContentLayout from './content/layout';
import BlockContentLink from './content/link';
import BlockContentEmbed from './content/embed';
import BlockContentRelation from './content/relation';
import BlockContentDiv from './content/div';
import BlockContentBookmark from './content/bookmark';
import BlockContentText from './content/text';
import BlockContentFile from './content/file';
import BlockContentDataview from './content/dataview';
import { BlockContentTableRow } from './content/table';
import BlockContentWidget from './content/widget';

const ContentModel = {
	layout:		 BlockContentLayout,
	link:		 BlockContentLink,
	embed:		 BlockContentEmbed,
	relation:	 BlockContentRelation,
	div:		 BlockContentDiv,
	bookmark:	 BlockContentBookmark,
	text:		 BlockContentText,
	file:		 BlockContentFile,
	dataview:	 BlockContentDataview,
	tableRow:	 BlockContentTableRow,
	widget:		 BlockContentWidget,
};

class Block implements I.Block {
	
	id = '';
	layout: I.ObjectLayout = I.ObjectLayout.Page;
	parentId = '';
	type: I.BlockType = I.BlockType.Empty;
	childrenIds: string[] = [];
	hAlign: I.BlockHAlign = I.BlockHAlign.Left;
	vAlign: I.BlockVAlign = I.BlockVAlign.Top;
	bgColor = '';
	fields: any = {};
	content: any = {};
	
	constructor (props: I.Block) {
		this.id = String(props.id || '');
		this.parentId = String(props.parentId || '');
		this.layout = Number(props.layout) || I.ObjectLayout.Page;
		this.type = props.type;
		this.hAlign = Number(props.hAlign) || I.BlockHAlign.Left;
		this.vAlign = Number(props.vAlign) || I.BlockVAlign.Top;
		this.bgColor = String(props.bgColor || '');
		this.fields = props.fields || {};
		this.childrenIds = props.childrenIds || [];
		this.content = props.content || {};

		if (ContentModel[this.type]) {
			this.content = new ContentModel[this.type](this.content);
		};

		makeObservable(this, {
			layout: observable,
			//type: observable,
			hAlign: observable,
			vAlign: observable,
			bgColor: observable,
			fields: observable,
			content: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
		return this;
	};

	isLocked (): boolean {
		return this.fields.isLocked;
	};

	canHaveChildren (): boolean {
		return !this.isSystem() && (this.isTextParagraph() || this.isTextList() || this.isTextCallout() || this.isTextQuote());
	};

	canHaveAlign (): boolean {
		return (
			this.isTextParagraph() || 
			this.isTextQuote() || 
			this.isTextHeader() || 
			this.isFileImage() || 
			this.isFileVideo() || 
			this.isFilePdf() || 
			this.isEmbed() || 
			this.isTable()
		);
	};

	canHaveColor (): boolean {
		return !this.isSystem() && this.isText() && !this.isTextCode();
	};

	canHaveBackground (): boolean {
		return !this.isFilePdf();
	};

	canHaveMarks () {
		return this.isText() && !this.isTextTitle() && !this.isTextDescription() && !this.isTextCode();
	};

	canTurn (): boolean {
		return !this.isSystem() && ((this.isText() && !this.isTextTitle() && !this.isTextDescription()) || this.isDiv() || this.isLink());
	};

	canTurnText (): boolean {
		return !this.isSystem() && ((this.isText() && !this.isTextTitle() && !this.isTextDescription()) || this.isLink());
	};

	canTurnPage (): boolean {
		return !this.isSystem() && this.isText() && !this.isTextTitle() && !this.isTextDescription();
	};

	canTurnList (): boolean {
		return this.canTurnText();
	};

	canTurnObject (): boolean {
		return this.canTurnPage();
	};

	canCreateBlock (): boolean {
		return !this.isSystem() && !this.isTextTitle() && !this.isTextDescription() && !this.isFeatured() && !this.isType() && !this.isTableRow();
	};

	canBecomeWidget (): boolean {
		return this.isLink() || this.isBookmark() || this.isFile() || this.isText() || this.isDataview();
	};

	isSystem () {
		return this.isPage() || this.isLayout();
	};

	isIndentable (): boolean {
		return !this.isSystem() && !this.isTextTitle() && !this.isTextDescription() && !this.isDiv() && !this.isTextHeader() && !this.isTextCode() && !this.isType();
	};
	
	isFocusable (): boolean {
		return !this.isSystem() && !this.isFeatured() && !this.isTable() && !this.isTableRow() && !this.isTableColumn();
	};
	
	isSelectable (): boolean {
		return !this.isSystem() && !this.isIcon() && !this.isType();
	};
	
	isDraggable (): boolean {
		return !this.isSystem() && !this.isIcon() && !this.isTextTitle() && !this.isTextDescription() && !this.isFeatured() && !this.isType();
	};

	isDeletable (): boolean {
		return !this.isSystem() && !this.isTextTitle() && !this.isTextDescription() && !this.isFeatured() && !this.isType();
	};

	isPage (): boolean { 
		return (this.type == I.BlockType.Page);
	};

	isObjectPage (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Page);
	};

	isObjectHuman (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Human);
	};

	isObjectParticipant (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Participant);
	};

	isObjectTask (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Task);
	};

	isObjectNote (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Note);
	};

	isObjectSet (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Set);
	};

	isObjectCollection (): boolean {
		return this.isPage() && (this.layout == I.ObjectLayout.Collection);
	};

	isObjectDate (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Date);
	};

	isObjectFileKind (): boolean { 
		return this.isPage() && (this.isObjectFile() || this.isObjectImage() || this.isObjectVideo() || this.isObjectAudio() || this.isObjectPdf());
	};

	isObjectFile (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.File);
	};

	isObjectImage (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Image);
	};

	isObjectVideo (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Video);
	};

	isObjectAudio (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Audio);
	};

	isObjectPdf (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Pdf);
	};

	isObjectType (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Type);
	};

	isObjectRelation (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Relation);
	};

	isObjectBookmark (): boolean { 
		return this.isPage() && (this.layout == I.ObjectLayout.Bookmark);
	};

	isFeatured (): boolean {
		return this.type == I.BlockType.Featured;
	};

	isDataview (): boolean {
		return this.type == I.BlockType.Dataview;
	};

	isRelation (): boolean {
		return this.type == I.BlockType.Relation;
	};

	isType (): boolean {
		return this.type == I.BlockType.Type;
	};

	isWidget (): boolean {
		return this.type == I.BlockType.Widget;
	};

	isWidgetLink (): boolean {
		return this.isWidget() && (this.content.layout == I.WidgetLayout.Link);
	};

	isWidgetList (): boolean {
		return this.isWidget() && (this.content.layout == I.WidgetLayout.List);
	};

	isWidgetTree (): boolean {
		return this.isWidget() && (this.content.layout == I.WidgetLayout.Tree);
	};

	isWidgetCompact (): boolean {
		return this.isWidget() && (this.content.layout == I.WidgetLayout.Compact);
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

	isLayoutHeader (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.Header);
	};

	isLayoutFooter (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.Footer);
	};

	isLayoutTableRows (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.TableRows);
	};
	
	isLayoutTableColumns (): boolean {
		return this.isLayout() && (this.content.style == I.LayoutStyle.TableColumns);
	};
	
	isLink (): boolean {
		return this.type == I.BlockType.Link;
	};

	isTable (): boolean {
		return this.type == I.BlockType.Table;
	};

	isTableColumn (): boolean {
		return this.type == I.BlockType.TableColumn;
	};

	isTableRow (): boolean {
		return this.type == I.BlockType.TableRow;
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

	isFileFile (): boolean {
		return this.isFile() && (this.content.type == I.FileType.File) && this.isFileStyleLink();
	};

	isFileImage (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Image) && this.isFileStyleEmbed();
	};
	
	isFileVideo (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Video) && this.isFileStyleEmbed();
	};

	isFileAudio (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Audio) && this.isFileStyleEmbed();
	};
	
	isFilePdf (): boolean {
		return this.isFile() && (this.content.type == I.FileType.Pdf) && this.isFileStyleEmbed();
	};

	isFileStyleLink (): boolean {
		return this.isFile() && (this.content.style == I.FileStyle.Link);
	};

	isFileStyleEmbed (): boolean {
		return this.isFile() && (this.content.style != I.FileStyle.Link);
	};

	isBookmark (): boolean {
		return this.type == I.BlockType.Bookmark;
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

	isEmbed (): boolean {
		return this.type == I.BlockType.Embed;
	};

	isEmbedLatex (): boolean {
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.Latex);
	};

	isEmbedKroki (): boolean {
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.Kroki);
	};

	isEmbedTelegram (): boolean {
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.Telegram);
	};

	isEmbedGithubGist (): boolean { 
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.GithubGist);
	};

	isEmbedSketchfab (): boolean {
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.Sketchfab);
	};

	isEmbedBilibili (): boolean {
		return this.isEmbed() && (this.content.processor == I.EmbedProcessor.Bilibili);
	};
	
	isText (): boolean {
		return this.type == I.BlockType.Text;
	};

	isTextTitle (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Title);
	};

	isTextDescription (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Description);
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

	isTextCallout (): boolean {
		return this.isText() && (this.content.style == I.TextStyle.Callout);
	};

	getLength (): number {
		let l = 0;
		if (this.isText()) {
			const t = String(this.content.text || '');

			l = t.length;

			// Last line break doesn't expand range.to
			if (l && (t[l - 1] == '\n')) {
				l--;
			};
		};

		return l;
	};

	getTargetObjectId (): string {
		let ret = '';

		switch (this.type) {
			case I.BlockType.Link: {
				ret = this.content.targetBlockId;
				break;
			};

			default: {
				ret = this.content.targetObjectId;
				break;
			};
		};

		return String(ret || '');
	};

};

export default Block;