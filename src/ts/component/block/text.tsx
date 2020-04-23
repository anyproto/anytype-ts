import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Select, Marker } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, Mark, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { commonStore, blockStore } from 'ts/store';
import 'highlight.js/styles/github.css';

interface Props {
	rootId: string;
	dataset?: any;
	block: I.Block;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onMenuAdd? (id: string): void;
	onPaste? (e: any): void;
};

const com = require('proto/commands.js');
const { ipcRenderer } = window.require('electron');
const low = window.require('lowlight');
const rehype = require('rehype');
const Constant = require('json/constant.json');
const $ = require('jquery');
const EmojiData = require('emoji-mart/data/apple.json');

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
		const { text, marks, style, checked, color, bgColor } = content;
		
		let marker: any = null;
		let placeHolder = Constant.placeHolder.default;
		let ct = color ? 'textColor textColor-' + color : '';
		let cv: string[] = [ 'value', 'focusable', 'c' + id, ct ];
		let additional = null;
		
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
		
		/*
		html = html.replace(/:([0-9a-z+_-]+):/g, (s: string, p: string) => {
			if (EmojiData.emojis[p]) {
				return String.fromCodePoint(parseInt(EmojiData.emojis[p].b, 16));
			};
			return s;
		});
		*/

		value.get(0).innerHTML = html;
		
		if (html != text) {
			this.renderLinks();
		};
	};
	
	renderLinks () {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const links = value.find('a');
		const self = this;
		
		if (!links.length) {
			return;
		};
		
		links.each((i: number, item: any) => {
			item = $(item);
			let text = item.text();
			let html = item.html();
			
			text = text.replace(/\s/g, '&nbsp;');
			text = text.replace(/\-/g, '&#8209;');
			text = text.replace(/‐/g, '&#8209;');
			
			html = html.replace(/>([^<]+)</, function (s, p1) {
				return '>' + text + '<';
			});
			
			item.html(html);
		});
		
		links.unbind('click.link mouseenter.link');
			
		links.on('click.link', function (e: any) {
			e.preventDefault();
			ipcRenderer.send('urlOpen', $(this).attr('href'));
		});
			
		links.on('mouseenter.link', function (e: any) {
			let range = $(this).data('range').split('-');
			let url = $(this).attr('href');
			
			if (!url.match(/^https?:\/\//)) {
				return;
			};
			
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
	
	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		return String(value.get(0).innerText || '');
	};
	
	getMarksFromHtml (): I.Mark[] {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		return Mark.fromHtml(value.html());
	};
	
	onKeyDown (e: any) {
		e.persist();
		
		const { onKeyDown, onMenuAdd, rootId, block } = this.props;
		const { id } = block;
		
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
			
			this.setText(this.marks);
		};
		
		if ((k == Key.backspace) && range && !range.from && !range.to) {
			this.setText(this.marks);
		};
		
		if ((value == '/') && (k == Key.backspace)) {
			commonStore.menuClose('blockAdd');
		};
		
		if (!value && (k == Key.slash)) {
			onMenuAdd(id);
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
		const { id, content } = block;
		const { root } = blockStore;
		const { style } = content;
		const value = this.getValue();
		const k = e.which;
		
		keyboard.unsetPressed(k);
		
		let cmdParsed = false;
		let cb = (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		};
		
		if (commonStore.menuIsOpen('blockAdd')) {
			commonStore.filterSet(value);
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
		if ((value == '## ') && block.isHeader2()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header2 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h3
		if ((value == '### ') && block.isHeader3()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header3 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make toggle
		if ((value == '> ') && block.isToggle()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Toggle } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make quote
		if ((value == '" ') && block.isQuote()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Quote } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make code
		if ((value == '/code') && block.isCode()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Code } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Move to
		if (value == '/move') {
			commonStore.popupOpen('tree', { 
				data: { 
					type: 'move', 
					rootId: root,
					onConfirm: (blockId: string) => {
						console.log('Move', blockId);
					},
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
	
	setText (marks: I.Mark[]) {
		const { rootId, block } = this.props;
		const { id, content } = block;
		const value = this.getValue();
		const text = String(content.text || '');
		
		if ((value == text) && (JSON.stringify(this.marks) == JSON.stringify(marks))) {
			return;
		};
		
		if (content.style == I.TextStyle.Code) {
			marks = [];
		};
		
		DataUtil.blockSetText(rootId, block, value, marks);
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
		const { onFocus } = this.props;
		const value = this.getValue();
		
		if (value.match(/^\//)) {
			commonStore.filterSet(value);
		};
		
		this.placeHolderCheck();
		keyboard.setFocus(true);
		onFocus(e);
	};
	
	onBlur (e: any) {
		const { onBlur } = this.props;
	
		window.clearTimeout(this.timeoutKeyUp);
		this.setText(this.marks);
		this.placeHolderHide();
		keyboard.setFocus(false);
		onBlur(e);
	};
	
	onPaste (e: any) {
		e.preventDefault();
		
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
		
		const { range } = focus;
		const currentFrom = range.from;
		const currentTo = range.to;
		
		if (!currentTo || (currentFrom == currentTo)) {
			commonStore.menuClose('blockContext');
		};
		
		if (!currentTo || (currentFrom == currentTo) || (from == currentFrom && to == currentTo)) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const offset = node.offset();
		const rect = window.getSelection().getRangeAt(0).getBoundingClientRect() as DOMRect;
		const size = Number(Constant.size.menuBlockContext[DataUtil.styleClassText(style)] || Constant.size.menuBlockContext.default) || 0;
		const x = rect.x - offset.left + Constant.size.blockMenu - size / 2 + rect.width / 2;
		const y = rect.y - (offset.top - $(window).scrollTop()) - 4;
		
		window.clearTimeout(this.timeoutContext);
		this.timeoutContext = window.setTimeout(() => {
			commonStore.menuClose('blockAdd');
			commonStore.menuOpen('blockContext', {
				element: '#block-' + id,
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