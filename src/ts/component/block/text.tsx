import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Select, Marker, Smile } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, Mark, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { commonStore, blockStore } from 'ts/store';
import 'highlight.js/styles/github.css';

interface Props extends RouteComponentProps<any> {
	rootId: string;
	dataset?: any;
	block: I.Block;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onMenuAdd? (id: string, text: string, range: I.TextRange): void;
	onPaste? (e: any): void;
};

const { ipcRenderer } = window.require('electron');
const low = window.require('lowlight');
const rehype = require('rehype');
const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refLang: any = null;
	timeoutKeyUp: number = 0;
	timeoutContext: number = 0;
	timeoutClick: number = 0;
	marks: I.Mark[] = [];
	clicks: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCheck = this.onCheck.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onLang = this.onLang.bind(this);
		this.onPaste = this.onPaste.bind(this);
	};

	render () {
		const { rootId, block } = this.props;
		const { id, fields, content } = block;
		const { text, marks, style, checked, color } = content;
		
		let marker: any = null;
		let placeHolder = Constant.placeHolder.default;
		let ct = color ? 'textColor textColor-' + color : '';
		let cv: string[] = [ 'value', 'focusable', 'c' + id, ct ];
		let additional = null;

		for (let mark of marks) {
			if (mark.type == I.MarkType.Mention) {
				const details = blockStore.getDetails(rootId, mark.param);
			};
		};
		
		switch (style) {
			case I.TextStyle.Quote:
				additional = (
					<div className="line" />
				);
				break;
				
			case I.TextStyle.Code:
				let options = [];
				for (let i in Constant.codeLang) {
					options.push({ id: i, name: Constant.codeLang[i] });
				};
				
				additional = (
					<Select initial="Language" id={'lang-' + id} value={fields.lang} ref={(ref: any) => { this.refLang = ref; }} options={options} onChange={this.onLang} />
				);
				break;
				
			case I.TextStyle.Bulleted:
				marker = { type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} };
				break;
				
			case I.TextStyle.Numbered:
				marker = { type: I.TextStyle.Numbered, className: 'number', active: false, onClick: () => {} };
				break;
				
			case I.TextStyle.Toggle:
				marker = { type: I.TextStyle.Toggle, className: 'toggle', active: false, onClick: this.onToggle };
				break;
				
			case I.TextStyle.Checkbox:
				marker = { type: I.TextStyle.Checkbox, className: 'check', active: checked, onClick: this.onCheck };
				break;
		};
		
		const editor = (
			<div
				id="value"
				className={cv.join(' ')}
				contentEditable={true}
				suppressContentEditableWarning={true}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onSelect={this.onSelect}
				onPaste={this.onPaste}
				onMouseDown={this.onMouseDown}
				onMouseUp={this.onMouseUp}
				onDragStart={(e: any) => { e.preventDefault(); }}
			/>
		);
		
		return (
			<div className="flex">
				<div className="markers">
					{marker ? <Marker {...marker} id={id} color={color} /> : ''}
				</div>
				{additional}
				<div className="wrap">
					<span className={[ 'placeHolder', 'c' + id ].join(' ')}>{placeHolder}</span>
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { block } = this.props;
		const { content } = block
		
		this.marks = Util.objectCopy(content.marks || []);
		this._isMounted = true;
		this.setValue(content.text);
	};
	
	componentDidUpdate () {
		const { block } = this.props;
		const { id, content } = block
		const { focused } = focus;

		this.marks = Util.objectCopy(content.marks || []);
		this.setValue(content.text);
		
		if (focused == id) {
			focus.apply();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutKeyUp);
	};
	
	setValue (v: string) {
		const { rootId, block } = this.props;
		const { id, fields, content } = block
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		
		let { style, color, bgColor, number } = content;
		let text = String(v || '');
		let html = text;
		
		if (style == I.TextStyle.Code) {
			let { lang } = fields || {};
			let res = low.highlight(String(lang || 'js'), html);
			
			if (res.value) {
				html = rehype().stringify({ type: 'root', children: res.value }).toString();
			};
		} else {
			html = Mark.toHtml(html, this.marks);
			html = html.replace(/\n/g, '<br/>');
		};
		
		value.get(0).innerHTML = html;
		
		if (html != text) {
			this.renderLinks();
			this.renderMentions();
			this.renderEmoji();
		};
	};
	
	renderLinks () {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('lnk');
		const self = this;
		
		if (!items.length) {
			return;
		};
		
		items.each((i: number, item: any) => {
			this.parseElement($(item));
		});
		
		items.unbind('click.link mouseenter.link');
			
		items.on('click.link', function (e: any) {
			e.preventDefault();
			ipcRenderer.send('urlOpen', $(this).attr('href'));
		});
			
		items.on('mouseenter.link', function (e: any) {
			let range = $(this).data('range').split('-');
			let url = $(this).attr('href');
			
			Util.linkPreviewShow(url, $(this), {
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: self.marks,
				onChange: (marks: I.Mark[]) => {
					self.setMarks(marks);
				}
			});
		});
	};

	renderMentions () {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('mention');
		const self = this;
		
		if (!items.length) {
			return;
		};

		const { rootId, block } = this.props;
		const param = this.emojiParam(block.content.style);
		
		items.each((i: number, item: any) => {
			item = $(item);
			this.parseElement(item);

			const data = item.data();
			if (!data.param) {
				return;
			};

			const details = blockStore.getDetails(rootId, data.param);
			const smile = item.find('smile');

			item.addClass(param.class);
			if (smile && smile.length) {
				ReactDOM.render(<Smile className={param.class} size={param.size} native={false} asImage={true} icon={details.iconEmoji} hash={details.iconImage} />, smile.get(0));
			};
		});
		
		items.unbind('click.mention').on('click.mention', function (e: any) {
			e.preventDefault();
			DataUtil.pageOpen (e, self.props, $(this).data('param'));
		});
	};

	renderEmoji () {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('emoji');
		
		if (!items.length) {
			return;
		};

		const { block } = this.props;
		const { content } = block;
		const { style } = content;
		const param = this.emojiParam(style);

		items.each((i: number, item: any) => {
			item = $(item);

			const data = item.data();
			if (!data.param) {
				return;
			};

			const smile = item.find('smile');
			
			item.addClass(param.class);
			if (smile && smile.length) {
				ReactDOM.render(<Smile className={param.class} size={param.size} native={false} asImage={true} icon={data.param} />, smile.get(0));
			};
		});
	};

	emojiParam (style: I.TextStyle) {
		let cn = 'c24';
		let size = 20;
		switch (style) {
			case I.TextStyle.Header1:
				cn = 'c32';
				size = 28;
				break;
			
			case I.TextStyle.Header2:
				cn = 'c28';
				size = 22;
				break;

			case I.TextStyle.Header3:
			case I.TextStyle.Quote:
				cn = 'c26';
				break;
		};
		return { class: cn, size: size };
	};

	parseElement (item: any) {
		let text = item.text();
		let html = item.html();
		
		text = text.replace(/\s/g, '&nbsp;');
		text = text.replace(/\-/g, '&#8209;');
		text = text.replace(/‐/g, '&#8209;');
		
		html = html.replace(/>([^<]+)</, () => { return '>' + text + '<'; });
		item.html(html);
	};
	
	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		const obj = Mark.cleanHtml(value.html());

		return String(obj.get(0).innerText || '');
	};
	
	getMarksFromHtml (): I.Mark[] {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		return Mark.fromHtml(value.html());
	};
	
	onKeyDown (e: any) {
		e.persist();
		
		const { onKeyDown, onMenuAdd, block } = this.props;
		const { id } = block;
		const { filter } = commonStore;
		
		if (
			commonStore.menuIsOpen('blockStyle') ||
			commonStore.menuIsOpen('blockColor') ||
			commonStore.menuIsOpen('blockBackground') ||
			commonStore.menuIsOpen('blockMore') 
		) {
			e.preventDefault();
			return;
		};

		const k = e.which;		
		const range = this.getRange();
		const value = this.getValue().replace(/\n$/, '');
		
		if (!e.metaKey) {
			keyboard.setPressed(k);
		};
		
		if ((k == Key.enter) && !e.shiftKey && !block.isCode()) {
			e.preventDefault();
			this.setText(this.marks, (message: any) => {
				onKeyDown(e, value, this.marks);
			});
			return;
		};

		if (k == Key.tab) {
			e.preventDefault();
			this.setText(this.marks, (message: any) => {
				onKeyDown(e, value, this.marks);
			});
			return;
		};
		
		if (k == Key.backspace) {
			if (range && !range.from && !range.to) {
				this.setText(this.marks, (message: any) => {
					onKeyDown(e, value, this.marks);
				});
				return;
			};
			
			if (commonStore.menuIsOpen('blockAdd') && (range.from - 1 == filter.from)) {
				commonStore.menuClose('blockAdd');
			};

			if (commonStore.menuIsOpen('blockMention') && (range.from - 1 == filter.from)) {
				commonStore.menuClose('blockMention');
			};
		};
		
		if ((k == Key.slash) && !(e.ctrlKey || e.metaKey)) {
			onMenuAdd(id, value, range);
		};

		if ((e.key == '@') && !commonStore.menuIsOpen('blockMention') && !block.isCode()) {
			this.onMention();
		};

		if ((e.key == 'e') && (e.ctrlKey || e.metaKey) && !commonStore.menuIsOpen('smile') && !block.isCode()) {
			e.preventDefault();
			this.onSmile();
		};

		focus.set(id, range);
		if (!keyboard.isSpecial(k)) {
			this.placeHolderHide();
		};
		
		onKeyDown(e, value, this.marks);
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		const { rootId, block } = this.props;
		const { filter } = commonStore;
		const { id } = block;
		const value = this.getValue();
		const k = e.which;
		
		keyboard.unsetPressed(k);
		
		let cmdParsed = false;
		let cb = (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		};
		
		if (commonStore.menuIsOpen('blockAdd')) {
			if (k == Key.space) {
				commonStore.filterSet(0, '');
				commonStore.menuClose('blockAdd');
			} else {
				const part = value.substr(filter.from, value.length).match(/^\/([^\s\/]*)/);
				commonStore.filterSetText(part ? part[1] : '');
			};
		};

		if (commonStore.menuIsOpen('blockMention')) {
			if (k == Key.space) {
				commonStore.filterSet(0, '');
				commonStore.menuClose('blockMention');
			} else {
				const part = value.substr(filter.from, value.length).match(/^@([^\s\/]*)/);
				commonStore.filterSetText(part ? part[1] : '');
			};
		};
		
		// Make div
		if (value == '---') {
			C.BlockCreate({ type: I.BlockType.Div }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make file
		if (value == '/file') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.File } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make image
		if (value == '/image') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Image } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make video
		if (value == '/video') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Video } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make video
		if (value == '/video') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Video } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make list
		if (([ '* ', '- ', '+ ' ].indexOf(value) >= 0) && !block.isBulleted()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Bulleted } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make checkbox
		if ((value == '[]') && !block.isCheckbox()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Checkbox } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make numbered
		if ((value == '1. ') && !block.isNumbered()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Numbered } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h1
		if ((value == '# ') && !block.isHeader1()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header1 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h2
		if ((value == '## ') && !block.isHeader2()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header2 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h3
		if ((value == '### ') && !block.isHeader3()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header3 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make toggle
		if ((value == '> ') && !block.isToggle()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Toggle } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make quote
		if ((value == '" ') && !block.isQuote()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Quote } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make code
		if ((value == '/code') && !block.isCode()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Code } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Move to
		if (value == '/move') {
			commonStore.popupOpen('navigation', { 
				data: { 
					type: I.NavigationType.Move, 
					rootId: rootId,
				}, 
			});
			cmdParsed = true;
		};
		
		// Delete
		if (value == '/delete') {
			const next = blockStore.getNextBlock(rootId, id, -1);
			if (next) {
				const length = String(next.content.text || '').length;
				focus.set(next.id, { from: length, to: length });
				focus.apply();
			};
			
			C.BlockUnlink(rootId, [ id ]);
			cmdParsed = true;
		};
		
		if (cmdParsed) {
			commonStore.menuClose('blockAdd');
			window.clearTimeout(this.timeoutKeyUp);
			return;
		};
		
		if (k == Key.backspace) {
			commonStore.menuClose('blockContext');
		};
		
		this.marks = this.getMarksFromHtml();
		this.placeHolderCheck();
		
		window.clearTimeout(this.timeoutKeyUp);
		this.timeoutKeyUp = window.setTimeout(() => { this.setText(this.marks); }, 500);
	};

	onMention () {
		const { rootId, block } = this.props;
		const range = this.getRange();
		const el = $('#block-' + block.id);
		const offset = el.offset();
		const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
		
		let value = this.getValue();
		let x = rect.x - offset.left;
		let y = -el.outerHeight() + (rect.y - (offset.top - $(window).scrollTop())) + rect.height + 8;

		if (!rect.x && !rect.y) {
			x = Constant.size.blockMenu;
			y = -4;
		};

		commonStore.filterSet(range.from, '');
		commonStore.menuOpen('blockMention', {
			element: el,
			type: I.MenuType.Vertical,
			offsetX: x,
			offsetY: -y,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				rootId: rootId,
				blockId: block.id,
				onChange: (text: string, marks: I.Mark[], range: I.TextRange) => {
					const to = range.from + text.length;

					this.marks = Util.objectCopy(marks);
					value = Util.stringInsert(value, text, range.from, range.to);

					DataUtil.blockSetText(rootId, block, value, this.marks, () => {
						focus.set(block.id, { from: to, to: to });
						focus.apply();
					});
				},
			},
		});
	};

	onSmile () {
		const { rootId, block } = this.props;
		const range = this.getRange();
		const el = $('#block-' + block.id);
		const offset = el.offset();
		const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
		
		let value = this.getValue();
		let x = rect.x - offset.left;
		let y = -el.outerHeight() + (rect.y - (offset.top - $(window).scrollTop())) + rect.height + 8;

		if (!rect.x && !rect.y) {
			x = Constant.size.blockMenu;
			y = 4;
		};

		commonStore.menuOpen('smile', {
			element: el,
			type: I.MenuType.Vertical,
			offsetX: x,
			offsetY: -y,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				noHead: true,
				rootId: rootId,
				blockId: block.id,
				onSelect: (icon: string) => {
					this.marks = Mark.toggle(this.marks, { 
						type: I.MarkType.Smile, 
						param: icon, 
						range: { from: range.from, to: range.from + 1 },
					});
					value = Util.stringInsert(value, ' ', range.from, range.from);

					DataUtil.blockSetText(rootId, block, value, this.marks, () => {
						focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
						focus.apply();
					});
				},
			},
		});
	};
	
	setText (marks: I.Mark[], callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const value = this.getValue();
		const text = String(content.text || '');
		
		if ((value == text) && (JSON.stringify(this.marks) == JSON.stringify(marks))) {
			if (callBack) {
				callBack(null);
			};
			return;
		};
		
		if (content.style == I.TextStyle.Code) {
			marks = [];
		};
		
		DataUtil.blockSetText(rootId, block, value, marks, callBack);
	};
	
	setMarks (marks: I.Mark[]) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const text = String(content.text || '');
		
		if (content.style == I.TextStyle.Code) {
			marks = [];
		};
		
		DataUtil.blockSetText(rootId, block, text, marks);
	};
	
	onFocus (e: any) {
		e.persist();

		const { onFocus } = this.props;
		
		this.placeHolderCheck();
		keyboard.setFocus(true);

		onFocus(e);
	};
	
	onBlur (e: any) {
		const { onBlur } = this.props;
	
		window.clearTimeout(this.timeoutKeyUp);
		this.placeHolderHide();
		keyboard.setFocus(false);
		onBlur(e);
	};
	
	onPaste (e: any) {
		e.persist();

		this.setText(this.marks);
		this.props.onPaste(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const { checked } = content;
		
		focus.clear(true);
		C.BlockSetTextChecked(rootId, id, !checked);
	};
	
	onLang (v: string) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const l = String(content.text || '').length;
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { lang: v } },
		], (message: any) => {
			focus.set(id, { from: l, to: l });
			focus.apply();
		});
	};
	
	onSelect (e: any) {
		const { rootId, dataset, block } = this.props;
		const { id, content } = block;
		const { from, to } = focus.range;
		const { style } = content;

		focus.set(id, this.getRange());
		keyboard.setFocus(true);
		
		const { range } = focus;
		const currentFrom = range.from;
		const currentTo = range.to;
		
		if (!currentTo || (currentFrom == currentTo)) {
			commonStore.menuClose('blockContext');
		};
		
		if (!currentTo || (currentFrom == currentTo) || (from == currentFrom && to == currentTo)) {
			return;
		};
		
		const el = $('#block-' + id);
		const offset = el.offset();
		const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
		const size = Number(Constant.size.menuBlockContext[DataUtil.styleClassText(style)] || Constant.size.menuBlockContext.default) || 0;
		const x = rect.x - offset.left - size / 2 + rect.width / 2;
		const y = rect.y - (offset.top - $(window).scrollTop()) - 8;

		window.clearTimeout(this.timeoutContext);
		this.timeoutContext = window.setTimeout(() => {
			commonStore.menuClose('blockAdd');
			commonStore.menuOpen('blockContext', {
				element: el,
				type: I.MenuType.Horizontal,
				offsetX: x,
				offsetY: -y,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Left,
				passThrough: true,
				data: {
					blockId: id,
					blockIds: [ id ],
					rootId: rootId,
					dataset: dataset,
					onChange: (marks: I.Mark[]) => {
						this.marks = Util.objectCopy(marks);
						focus.set(id, { from: currentFrom, to: currentTo });
						this.setMarks(marks);
					},
				},
			});
		}, 150);
	};
	
	onMouseDown (e: any) {
		const { dataset, block } = this.props;
		const { selection } = dataset || {};
		const { id } = block;
		
		window.clearTimeout(this.timeoutClick);

		this.clicks++;
		if (this.clicks == 3) {
			e.preventDefault();
			e.stopPropagation();
			
			this.clicks = 0;
			selection.set([ id ]);
			commonStore.menuClose('blockContext');
			window.clearTimeout(this.timeoutContext);
		};
	};
	
	onMouseUp (e: any) {
		window.clearTimeout(this.timeoutClick);
		this.timeoutClick = window.setTimeout(() => { this.clicks = 0; }, 300);
	};
	
	placeHolderCheck () {
		const value = this.getValue();
		value.length ? this.placeHolderHide() : this.placeHolderShow();			
	};
	
	placeHolderHide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').hide();
	};
	
	placeHolderSet (v: string) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').text(v);
	};
	
	placeHolderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').show();
	};
	
	getRange () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element);
		
		return range ? { from: range.start, to: range.end } : null;
	};
	
};

export default BlockText;