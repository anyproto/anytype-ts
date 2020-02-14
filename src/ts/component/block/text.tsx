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
		const { text, marks, style, checked, number, color, bgColor } = content;
		
		let markers: any[] = [];
		let placeHolder = 'Type anything...';
		let ct: string[] = [ 'flex' ];
		let additional = null;
		
		if (color) {
			ct.push('textColor textColor-' + color);
		};

		let editor = (
			<div
				id="value"
				className="value"
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
					<Select initial="Language" id="lang" value={fields.lang} ref={(ref: any) => { this.refLang = ref; }} options={options} onChange={this.onLang} />
				);
				break;
				
			case I.TextStyle.Bulleted:
				markers.push({ type: I.TextStyle.Bulleted, className: 'bullet', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Numbered:
				markers.push({ type: I.TextStyle.Numbered, className: 'number', active: false, onClick: () => {} });
				break;
				
			case I.TextStyle.Toggle:
				ct = [];
				markers.push({ type: 0, className: 'toggle', active: false, onClick: this.onToggle });
				break;
				
			case I.TextStyle.Checkbox:
				ct = [];
				markers.push({ type: 0, className: 'check', active: checked, onClick: this.onCheck });
				break;
		};
		
		const Marker = (item: any) => (
			<div className={[ 'marker', item.className, (item.active ? 'active' : '') ].join(' ')} onClick={item.onClick}>
				<span className={ct.join(' ')}>{(item.type == I.TextStyle.Numbered) && number ? number + '.' : <Icon />}</span>
			</div>
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
					<span className="placeHolder">{placeHolder}</span>
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { content } = this.props;
		
		this.marks = Util.objectCopy(content.marks);
		this._isMounted = true;
		this.setValue();
	};
	
	componentDidUpdate () {
		const { content } = this.props;
		
		this.marks = Util.objectCopy(content.marks);
		this.setValue();
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
		
		let html = '';
		if (style == I.TextStyle.Code) {
			let { lang } = fields || {};
			let res = low.highlight(String(lang || 'js'), text);
			
			html = res.value ? rehype().stringify({ type: 'root', children: res.value }).toString() : text;
		} else {
			html = Mark.toHtml(text, this.marks);
			
			if (color) {
				html = '<span ' + Mark.paramToAttr(I.MarkType.TextColor, color) + '>' + html + '</span>';
			};
		};
		
		value.get(0).innerHTML = html;
		
		if (html != text) {
			value.find('a').unbind('click.link').on('click.link', function (e: any) {
				e.preventDefault();
				ipcRenderer.send('urlOpen', $(this).attr('href'));
			});
		};
	};
	
	getValue (): string {
		if (!this._isMounted) {
			return '';
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		return String(value.text() || '');
	};
	
	getMarksFromHtml (): I.Mark[] {
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('.value');
		
		return Mark.fromHtml(value.html());
	};
	
	onKeyDown (e: any) {
		e.persist();
		
		const { onKeyDown, onMenuAdd, id, parentId, rootId, content } = this.props;
		
		if (
			commonStore.menuIsOpen('blockStyle') ||
			commonStore.menuIsOpen('blockColor') ||
			commonStore.menuIsOpen('blockMore') 
		) {
			e.preventDefault();
			return;
		};
		
		const { blocks } = blockStore;
		const { style } = content;
		const range = this.getRange();
		const k = e.which;
		const value = this.getValue();
		
		// Indent block
		if (k == Key.tab) {
			e.preventDefault();
			
			const parent = blocks[rootId].find((it: any) => { return it.id == parentId; });
			const next = blockStore.getNextBlock(rootId, id, -1);
			
			let canTab = true;
			if (style == I.TextStyle.Title) {
				canTab = false;
			};
			if (parent && (parent.content.style == I.TextStyle.Title)) {
				canTab = false;
			};
			if (next && (next.content.style == I.TextStyle.Title)) {
				canTab = false;
			};

			if (canTab) {
				if (e.shiftKey) {
					C.BlockListMove(rootId, [ id ], parentId, I.BlockPosition.Bottom);
				} else {
					C.BlockListMove(rootId, [ id ], next.id, (parentId == next.parentId ? I.BlockPosition.Inner : I.BlockPosition.Bottom));
				};
			};
		};
		
		if ((k == Key.enter) && !e.shiftKey) {
			this.blockSetText(this.marks);
		};
		
		if ((value == '/') && (k == Key.backspace)) {
			commonStore.menuClose('blockAddSub');
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
		this.timeoutKeyUp = window.setTimeout(() => { this.blockSetText(this.marks); }, 500);
	};
	
	blockSetText (marks: I.Mark[]) {
		const { id, rootId, content } = this.props;
		const { blocks } = blockStore;
		const value = this.getValue();
		const text = String(content.text || '');
		
		if ((value == text) && (JSON.stringify(this.marks) == JSON.stringify(marks))) {
			return;
		};
		
		const block = blocks[rootId].find((it: any) => { return it.id == id; });
		DataUtil.blockSetText(rootId, block, value, marks);
	};
	
	blockSetMarks (marks: I.Mark[]) {
		const { id, rootId, content } = this.props;
		const { blocks } = blockStore;
		const text = String(content.text || '');
		const block = blocks[rootId].find((it: any) => { return it.id == id; });
		
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
		this.blockSetText(this.marks);
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
		
		focus.clear();
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
		
		if ((style == I.TextStyle.Title) && !currentTo || (currentFrom == currentTo) || (from == currentFrom && to == currentTo)) {
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
					this.blockSetMarks(marks);
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
	
	placeHolderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').show();
	};
	
	getRange (): I.TextRange {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('.value').get(0) as Element);
		
		return range ? { from: range.start, to: range.end } : { from: 0, to: 0 };
	};
	
};

export default BlockText;