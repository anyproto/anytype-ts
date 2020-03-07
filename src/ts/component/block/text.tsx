import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Select } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, Mark, focus } from 'ts/lib';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { commonStore, blockStore } from 'ts/store';
import 'highlight.js/styles/github.css';

interface Props extends I.BlockText {
	rootId: string;
	dataset?: any;
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
	onKeyDown?(e: any, text?: string, marks?: I.Mark[]): void;
	onKeyUp?(e: any, text?: string, marks?: I.Mark[]): void;
	onMenuAdd? (id: string): void;
	onPaste? (e: any): void;
};

const com = require('proto/commands.js');
const { ipcRenderer } = window.require('electron');
const low = window.require('lowlight');
const rehype = require('rehype');
const Constant = require('json/constant.json');
const $ = require('jquery');

@observer
class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refLang: any = null;
	range: any = null;
	timeoutKeyUp: number = 0;
	from: any = null;
	marks: I.Mark[] = [];

	constructor (props: any) {
		super(props);
		
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
		const { id, rootId, fields, content } = this.props;
		const { text, marks, style, checked, color, bgColor } = content;
		
		let markers: any[] = [];
		let placeHolder = Constant.placeHolder.default;
		let ct: string[] = [];
		let additional = null;
		
		if (color) {
			ct.push('textColor textColor-' + color);
		};

		switch (style) {
			case I.TextStyle.Title:
				placeHolder = Constant.default.name;
				break;
				
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
				markers.push({ type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Numbered:
				markers.push({ type: I.TextStyle.Numbered, className: 'number', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Toggle:
				markers.push({ type: I.TextStyle.Toggle, className: 'toggle', active: false, onClick: this.onToggle });
				break;
				
			case I.TextStyle.Checkbox:
				markers.push({ type: I.TextStyle.Checkbox, className: 'check', active: checked, onClick: this.onCheck });
				break;
		};
		
		const Marker = (item: any) => {
			let cm = [ 'marker', item.className, (item.active ? 'active' : '') ].join(' ');
			let ci = [ 'markerInner', 'c' + id ].concat(ct).join(' ');
			let inner: any = item.type == I.TextStyle.Numbered ? '' : <Icon />;
			
			return (
				<div className={cm} onClick={item.onClick}>
					<span className={ci}>{inner}</span>
				</div>
			);
		};
		
		const editor = (
			<div
				id="value"
				className={[ 'value' ].concat(ct).join(' ')}
				contentEditable={true}
				suppressContentEditableWarning={true}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onSelect={this.onSelect}
				onPaste={this.onPaste}
			/>
		);
		
		return (
			<div className="flex">
				<div className="markers">
					{markers.map((item: any, i: number) => (
						<Marker key={i} {...item} />
					))}
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
		const { content } = this.props;
		
		this.marks = Util.objectCopy(content.marks || []);
		this._isMounted = true;
		this.setValue();
	};
	
	componentDidUpdate () {
		const { id, content } = this.props;
		const { focused } = focus;
		
		this.marks = Util.objectCopy(content.marks || []);
		this.setValue();
		
		if (focused == id) {
			focus.apply();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutKeyUp);
	};
	
	setValue (v?: string) {
		const { id, rootId, fields, content } = this.props;
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		
		let { text, style, color, bgColor, number } = content;
		
		text = String(v || text || '');
		if ((style == I.TextStyle.Title) && (text == Constant.default.name)) {
			text = '';
		};
		
		let html = text;
		
		if (style == I.TextStyle.Code) {
			html = html.replace(/\n/g, '__break__');
			html = html.replace(/&nbsp;/g, ' ');
			
			let { lang } = fields || {};
			let res = low.highlight(String(lang || 'js'), html);
			
			if (res.value) {
				html = rehype().stringify({ type: 'root', children: res.value }).toString();
			};
			
			html = html.replace(/__break__/g, '<br/>');
		} else {
			html = Mark.toHtml(html, this.marks);
			html = html.replace(/\n/g, '<br/>');
		};

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
			let t = item.text();
			t = t.replace(/\s/g, '&nbsp;');
			t = t.replace(/\-/g, '&#8209;');
			t = t.replace(/‐/g, '&#8209;');
			item.html(t);
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
		
		const { onKeyDown, onMenuAdd, rootId, id, parentId, content } = this.props;
		
		if (
			commonStore.menuIsOpen('blockStyle') ||
			commonStore.menuIsOpen('blockColor') ||
			commonStore.menuIsOpen('blockMore') 
		) {
			e.preventDefault();
			return;
		};
		
		const { style } = content;
		const range = this.getRange();
		const k = e.which;
		const value = this.getValue();
		const isTitle = style == I.TextStyle.Title;
		
		if ((k == Key.enter) && !e.shiftKey && (style != I.TextStyle.Code)) {
			e.preventDefault();
			
			this.setValue(value.replace(/\n$/, ''));
			this.setText(this.marks);
		};
		
		if ((k == Key.backspace) && range && (range.from == 0) && (range.to == 0)) {
			this.setText(this.marks);
		};
		
		if ((value == '/') && (k == Key.backspace)) {
			commonStore.menuClose('blockAddSub');
			commonStore.menuClose('blockAdd');
		};
		
		if (!value && !isTitle && (k == Key.slash)) {
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
		
		const { onKeyUp, id, rootId, content } = this.props;
		const { root } = blockStore;
		const { style } = content;
		const value = this.getValue();
		const k = e.which;
		
		let cmdParsed = false;
		
		if (commonStore.menuIsOpen('blockAdd')) {
			commonStore.filterSet(value);
		};
		
		// Make div
		if (value == '---') {
			C.BlockCreate({ type: I.BlockType.Div }, rootId, id, I.BlockPosition.Replace);
			cmdParsed = true;
		};
		
		// Make file
		if (value == '/file') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.File } }, rootId, id, I.BlockPosition.Replace);
			cmdParsed = true;
		};
		
		// Make image
		if (value == '/image') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Image } }, rootId, id, I.BlockPosition.Replace);
			cmdParsed = true;
		};
		
		// Make video
		if (value == '/video') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Video } }, rootId, id, I.BlockPosition.Replace);
			cmdParsed = true;
		};
		
		// Make video
		if (value == '/video') {
			C.BlockCreate({ type: I.BlockType.File, content: { type: I.FileType.Video } }, rootId, id, I.BlockPosition.Replace);
			cmdParsed = true;
		};
		
		// Make list
		if (([ '* ', '- ', '+ ' ].indexOf(value) >= 0) && (style != I.TextStyle.Bulleted)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Bulleted);
			cmdParsed = true;
		};
		
		// Make checkbox
		if ((value == '[]') && (style != I.TextStyle.Checkbox)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Checkbox);
			cmdParsed = true;
		};
		
		// Make numbered
		if ((value == '1. ') && (style != I.TextStyle.Numbered)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Numbered);
			cmdParsed = true;
		};
		
		// Make h1
		if ((value == '# ') && (style != I.TextStyle.Header1)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Header1);
			cmdParsed = true;
		};
		
		// Make h2
		if ((value == '## ') && (style != I.TextStyle.Header2)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Header2);
			cmdParsed = true;
		};
		
		// Make h3
		if ((value == '### ') && (style != I.TextStyle.Header3)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Header3);
			cmdParsed = true;
		};
		
		// Make toggle
		if ((value == '> ') && (style != I.TextStyle.Toggle)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Toggle);
			cmdParsed = true;
		};
		
		// Make quote
		if ((value == '" ') && (style != I.TextStyle.Quote)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Quote);
			cmdParsed = true;
		};
		
		// Make code
		if ((value == '/code') && (style != I.TextStyle.Code)) {
			C.BlockListSetTextStyle(rootId, [ id ], I.TextStyle.Code);
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
			
			C.BlockUnlink(rootId, [ id ]);
			cmdParsed = true;
			
			if (next) {
				const length = String(next.content.text || '').length;
				focus.set(next.id, { from: length, to: length });
				focus.apply();
			};
		};
		
		if (cmdParsed) {
			commonStore.menuClose('blockAdd');
			this.setValue('');
			return;
		};
		
		if (k == Key.backspace) {
			commonStore.menuClose('blockContext');
		};
		
		this.marks = this.getMarksFromHtml();
		
		this.placeHolderCheck();
		onKeyUp(e, value, this.marks);
		
		window.clearTimeout(this.timeoutKeyUp);
		this.timeoutKeyUp = window.setTimeout(() => { this.setText(this.marks); }, 500);
	};
	
	setText (marks: I.Mark[]) {
		const { id, rootId, content } = this.props;
		const value = this.getValue();
		const text = String(content.text || '');
		
		if ((value == text) && (JSON.stringify(this.marks) == JSON.stringify(marks))) {
			return;
		};
		
		if (content.style == I.TextStyle.Code) {
			marks = [];
		};
		
		const block = blockStore.getLeaf(rootId, id);
		DataUtil.blockSetText(rootId, block, value, marks);
	};
	
	setMarks (marks: I.Mark[]) {
		const { id, rootId, content } = this.props;
		const text = String(content.text || '');
		const block = blockStore.getLeaf(rootId, id);
		
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
		const { onBlur, content } = this.props;
		
		window.clearTimeout(this.timeoutKeyUp);
		this.setText(this.marks);
		this.placeHolderHide();
		keyboard.setFocus(false);
		onBlur(e);
	};
	
	onPaste (e: any) {
		const { onPaste } = this.props;

		onPaste(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		const { id, rootId, content } = this.props;
		const { checked } = content;
		
		focus.clear(true);
		C.BlockSetTextChecked(rootId, id, !checked);
	};
	
	onLang (v: string) {
		const { id, rootId, content } = this.props;
		const l = String(content.text || '').length;
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { lang: v } },
		], (message: any) => {
			focus.set(id, { from: l, to: l });
			focus.apply();
		});
	};
	
	onSelect (e: any) {
		const { id, rootId, content, dataset } = this.props;
		const { from, to } = focus.range;
		const { style } = content;
		
		focus.set(id, this.getRange());
		
		const { range } = focus;
		const currentFrom = range.from;
		const currentTo = range.to;
		
		if (style == I.TextStyle.Title) {
			return;
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
		
		commonStore.menuClose('blockAdd');
		commonStore.menuOpen('blockContext', {
			element: '#block-' + id,
			type: I.MenuType.Horizontal,
			offsetX: x,
			offsetY: -y,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
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