import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Select, Marker, Loader, IconObject } from 'ts/component';
import { I, C, keyboard, Key, Util, DataUtil, Mark, focus, Storage } from 'ts/lib';
import { observer } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { commonStore, blockStore } from 'ts/store';
import * as Prism from 'prismjs';
import 'prismjs/themes/prism.css';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
	onToggle?(e: any): void;
	onFocus?(e: any): void;
	onBlur?(e: any): void;
};

const { ipcRenderer } = window.require('electron');
const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');

// Prism languages
const langs = [
	'clike', 'c', 'cpp', 'csharp', 'abap', 'arduino', 'bash', 'basic', 'clojure', 'coffeescript', 'dart', 'diff', 'docker', 'elixir',
	'elm', 'erlang', 'flow', 'fortran', 'fsharp', 'gherkin', 'graphql', 'groovy', 'go', 'haskell', 'json', 'latex', 'less', 'lisp',
	'livescript', 'lua', 'markdown', 'makefile', 'matlab', 'nginx', 'objectivec', 'ocaml', 'pascal', 'perl', 'php', 'powershell', 'prolog',
	'python', 'reason', 'ruby', 'rust', 'sass', 'java', 'scala', 'scheme', 'scss', 'sql', 'swift', 'typescript', 'vbnet', 'verilog',
	'vhdl', 'visual-basic', 'wasm', 'yaml', 'javascript', 'css', 'markup', 'markup-templating', 'csharp', 'php', 'go', 'swift', 'kotlin',
];
for (let lang of langs) {
	require(`prismjs/components/prism-${lang}.js`);
};

@observer
class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refLang: any = null;
	timeoutContext: number = 0;
	timeoutClick: number = 0;
	marks: I.Mark[] = [];
	clicks: number = 0;
	composition: boolean = false;
	preventSaveOnBlur: boolean = false;

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
		this.onInput = this.onInput.bind(this);

		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionUpdate = this.onCompositionUpdate.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { rootId, block, readOnly } = this.props;
		const { id, fields, content } = block;
		const { text, marks, style, checked, color } = content;
		const root = blockStore.getLeaf(rootId, rootId);

		let marker: any = null;
		let placeHolder = Constant.placeHolder.default;
		let ct = color ? 'textColor textColor-' + color : '';
		let cv: string[] = [ 'value', 'focusable', 'c' + id, ct, (readOnly ? 'readOnly' : '') ];
		let additional = null;

		for (let mark of marks) {
			if (mark.type == I.MarkType.Mention) {
				const details = blockStore.getDetails(rootId, mark.param);
			};
		};
		
		switch (style) {
			case I.TextStyle.Title:
				placeHolder = Constant.default.name;
				
				if (root.isObjectTask()) {
					marker = { type: 'checkboxTask', className: 'check', active: checked, onClick: this.onCheck };
				};
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
					<Select id={'lang-' + id} arrowClassName="light" value={fields.lang} ref={(ref: any) => { this.refLang = ref; }} options={options} onChange={this.onLang} />
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
				contentEditable={!readOnly}
				suppressContentEditableWarning={true}
				onKeyDown={this.onKeyDown}
				onKeyUp={this.onKeyUp}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onSelect={this.onSelect}
				onPaste={this.onPaste}
				onMouseDown={this.onMouseDown}
				onMouseUp={this.onMouseUp}
				onInput={this.onInput}
				onCompositionStart={this.onCompositionStart}
				onCompositionUpdate={this.onCompositionUpdate}
				onCompositionEnd={this.onCompositionEnd}
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
		const { content } = block;

		this.marks = Util.objectCopy(content.marks || []);
		this._isMounted = true;
		this.setValue(content.text);
	};
	
	componentDidUpdate () {
		const { block } = this.props;
		const { content } = block

		this.marks = Util.objectCopy(content.marks || []);
		this.setValue(content.text);
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onCompositionStart (e: any) {
		this.composition = true;
	};

	onCompositionUpdate (e: any) {
	};

	onCompositionEnd (e: any) {
		this.composition = false;
	};
	
	setValue (v: string) {
		const { block } = this.props;
		const { content } = block;
		const fields = block.fields || {};
		const { style } = content;
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const text = String(v || '');

		let html = text;
		if (style == I.TextStyle.Code) {
			let lang = fields.lang;
			let grammar = Prism.languages[lang];

			if (!grammar) {
				lang = Constant.default.codeLang;
				grammar = Prism.languages[lang];
			};

			if (this.refLang) {
				this.refLang.setValue(lang);
			};

			html = Prism.highlight(html, grammar, lang);
		} else {
			html = Mark.toHtml(html, this.marks);
			html = html.replace(/\n/g, '<br/>');
		};
		
		value.get(0).innerHTML = html;
		
		if (!block.isTextCode() && (html != text)) {
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
		
		if (!items.length) {
			return;
		};

		const { rootId, block } = this.props;
		const size = this.emojiParam(block.content.style);
		
		items.each((i: number, item: any) => {
			item = $(item);
			const data = item.data();
			if (!data.param) {
				return;
			};

			const object = blockStore.getDetails(rootId, data.param);
			const smile = item.find('smile');
			const { _objectEmpty_, iconEmoji, iconImage } = object;
			const cn = [];

			if (smile && smile.length) {
				let icon = null;
				if (_objectEmpty_) {
					item.addClass('dis');
					icon = <Loader className={[ 'c' + size, 'inline' ].join(' ')} />;
				} else {
					icon = <IconObject size={size} object={object} />;
				};

				if (icon) {
					ReactDOM.render(icon, smile.get(0));
					smile.after('<img src="./img/space.svg" class="space" />');
					cn.push('withImage');
				};
			};

			item.addClass(cn.join(' '));
		});
		
		items.unbind('click.mention').on('click.mention', function (e: any) {
			e.preventDefault();
			const el = $(this);
			if (!el.hasClass('dis')) {
				const object = blockStore.getDetails(rootId, el.data('param'));
				DataUtil.objectOpenEvent(e, object);
			};
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
		const size = this.emojiParam(block.content.style);

		items.each((i: number, item: any) => {
			item = $(item);

			const data = item.data();
			if (!data.param) {
				return;
			};

			const smile = item.find('smile');
			
			if (smile && smile.length) {
				ReactDOM.render(<IconObject size={size} object={{ iconEmoji: data.param }} />, smile.get(0));
			};
		});
	};

	emojiParam (style: I.TextStyle) {
		let size = 24;
		switch (style) {
			case I.TextStyle.Header1:
				size = 32;
				break;
			
			case I.TextStyle.Header2:
				size = 28;
				break;

			case I.TextStyle.Header3:
			case I.TextStyle.Quote:
				size = 26;
				break;
		};
		return size;
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

	onInput (e: any) {
		this.placeHolderCheck();
	};
	
	onKeyDown (e: any) {
		e.persist();

		// Chinese IME is open
		if (this.composition) {
			return;
		};

		const { onKeyDown, rootId, block } = this.props;
		const { id } = block;
		
		if (commonStore.menuIsOpenList([ 'blockStyle', 'blockColor', 'blockBackground', 'blockMore' ])) {
			e.preventDefault();
			return;
		};

		let value = this.getValue();
		let ret = false;

		const k = e.key.toLowerCase();	
		const range = this.getRange();
		const isSpaceBefore = range ? (!range.from || (value[range.from - 1] == ' ') || (value[range.from - 1] == '\n')) : false;
		const symbolBefore = range ? value[range.from - 1] : '';
		
		const menuOpen = commonStore.menuIsOpen();
		const menuOpenAdd = commonStore.menuIsOpen('blockAdd');
		const menuOpenMention = commonStore.menuIsOpen('blockMention');
		const menuOpenSmile = commonStore.menuIsOpen('smile');

		keyboard.shortcut('enter, enter+backspace', e, (pressed: string) => {
			if (block.isTextCode() || menuOpen) {
				return;
			};

			e.preventDefault();
			DataUtil.blockSetText(rootId, block, value, this.marks, true, () => {
				onKeyDown(e, value, this.marks, range);
			});

			ret = true;
		});

		keyboard.shortcut('tab', e, (pressed: string) => {
			e.preventDefault();

			if (!range) {
				return;
			};
			
			if (block.isTextCode()) {
				value = Util.stringInsert(value, '\t', range.from, range.from);
				this.marks = Mark.checkRanges(value, this.marks);

				DataUtil.blockSetText(rootId, block, value, this.marks, true, () => {
					focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
					focus.apply();
				});
			} else {
				this.setText(this.marks, true, (message: any) => {
					onKeyDown(e, value, this.marks, range);
				});
			};

			ret = true;
		});

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (!menuOpenAdd && !menuOpenMention) {
				if (range.to) {
					return;
				};
				
				this.marks = Mark.checkRanges(value, this.marks);
				DataUtil.blockSetText(rootId, block, value, this.marks, true, () => {
					onKeyDown(e, value, this.marks, range);
				});
				ret = true;
			};

			if (menuOpenAdd && (symbolBefore == '/')) {
				commonStore.menuClose('blockAdd');
			};

			if (menuOpenMention && (symbolBefore == '@')) {
				commonStore.menuClose('blockMention');
			};
		});

		keyboard.shortcut('delete', e, (pressed: string) => {
			if (range.to && ((range.from != range.to) || (range.to != value.length))) {
				ret = true;
			};
		});

		keyboard.shortcut('ctrl+e, cmd+e', e, (pressed: string) => {
			if (menuOpenSmile || !block.canHaveMarks()) {
				return;
			};

			e.preventDefault();
			this.onSmile();
		});

		keyboard.shortcut('@, shift+@', e, (pressed: string) => {
			if (!isSpaceBefore || menuOpenMention || !block.canHaveMarks()) {
				return;
			};

			this.onMention();
		});

		if (ret) {
			return;
		};
		
		focus.set(id, range);
		if (!keyboard.isSpecial(k)) {
			this.placeHolderHide();
		};
		
		onKeyDown(e, value, this.marks, range);
	};
	
	onKeyUp (e: any) {
		e.persist();
		
		const { rootId, block, onMenuAdd } = this.props;
		const { filter } = commonStore;
		const { id } = block;
		const range = this.getRange();
		const k = e.key.toLowerCase();

		const menuOpenAdd = commonStore.menuIsOpen('blockAdd');
		const menuOpenMention = commonStore.menuIsOpen('blockMention');
		
		let value = this.getValue();
		let cmdParsed = false;
		let cb = (message: any) => {
			focus.set(message.blockId, { from: 0, to: 0 });
			focus.apply();
		};
		let symbolBefore = range ? value[range.from - 1] : '';
		
		if (menuOpenAdd) {
			if (k == Key.space) {
				commonStore.filterSet(0, '');
				commonStore.menuClose('blockAdd');
			} else {
				const d = range.from - filter.from;
				if (d >= 0) {
					const part = value.substr(filter.from, d).replace(/^\//, '');
					commonStore.filterSetText(part);
				};
			};
			return;
		};

		if (menuOpenMention) {
			if (k == Key.space) {
				commonStore.filterSet(0, '');
				commonStore.menuClose('blockMention');
			} else {
				const d = range.from - filter.from;
				if (d >= 0) {
					const part = value.substr(filter.from, d).replace(/^@/, '');
					commonStore.filterSetText(part);
				};
			};
			return;
		};

		// Open add menu
		if ((symbolBefore == '/') && ([ Key.backspace, Key.escape ].indexOf(k) < 0) && !menuOpenAdd) {
			value = Util.stringCut(value, range.from - 1, range.from);
			onMenuAdd(id, value, range);
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
		
		// Make list
		if (([ '* ', '- ', '+ ' ].indexOf(value) >= 0) && !block.isTextBulleted()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Bulleted } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make checkbox
		if ((value == '[]') && !block.isTextCheckbox()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Checkbox } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make numbered
		if ((value == '1. ') && !block.isTextNumbered()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Numbered } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h1
		if ((value == '# ') && !block.isTextHeader1()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header1 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h2
		if ((value == '## ') && !block.isTextHeader2()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header2 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make h3
		if ((value == '### ') && !block.isTextHeader3()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Header3 } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make toggle
		if ((value == '> ') && !block.isTextToggle()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Toggle } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make quote
		if ((value == '" ') && !block.isTextQuote()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Quote } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};
		
		// Make code
		if ((value == '/code' || value == '```') && !block.isTextCode()) {
			C.BlockCreate({ type: I.BlockType.Text, content: { style: I.TextStyle.Code } }, rootId, id, I.BlockPosition.Replace, cb);
			cmdParsed = true;
		};

		if (cmdParsed) {
			commonStore.menuClose('blockAdd');
			return;
		};

		keyboard.shortcut('backspace', e, (pressed: string) => {
			commonStore.menuClose('blockContext');
		});
		
		this.marks = this.getMarksFromHtml();
		this.placeHolderCheck();
		this.setText(this.marks, false);
	};

	onMention () {
		const { rootId, block } = this.props;
		const win = $(window);
		const range = this.getRange();
		const el = $('#block-' + block.id);
		const offset = el.offset();

		let rect = Util.selectionRect();
		let value = this.getValue();

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		this.preventSaveOnBlur = true;

		commonStore.filterSet(range.from, '');
		commonStore.menuOpen('blockMention', {
			element: el,
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			type: I.MenuType.Vertical,
			offsetX: rect ? 0 : Constant.size.blockMenu,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onClose: () => {
				this.preventSaveOnBlur = false;
			},
			data: {
				rootId: rootId,
				blockId: block.id,
				marks: this.marks,
				onChange: (text: string, marks: I.Mark[], from: number, to: number) => {
					value = Util.stringInsert(value, text, from, from);
					this.marks = Mark.checkRanges(value, marks);

					DataUtil.blockSetText(rootId, block, value, this.marks, true, () => {
						focus.set(block.id, { from: to, to: to });
						focus.apply();

						// Try to fix async detailsUpdate event
						window.setTimeout(() => {
							focus.set(block.id, { from: to, to: to });
							focus.apply();
						}, 50);
					});
				},
			},
		});
	};

	onSmile () {
		const { rootId, block } = this.props;
		const win = $(window);
		const range = this.getRange();
		
		let rect = Util.selectionRect();
		let value = this.getValue();

		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		commonStore.menuOpen('smile', {
			element: '#block-' + block.id,
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			type: I.MenuType.Vertical,
			offsetX: rect ? 0 : Constant.size.blockMenu,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				noHead: true,
				rootId: rootId,
				blockId: block.id,
				onSelect: (icon: string) => {
					this.marks = Mark.adjust(this.marks, range.from, 1);
					this.marks = Mark.toggle(this.marks, { 
						type: I.MarkType.Smile, 
						param: icon, 
						range: { from: range.from, to: range.from + 1 },
					});
					value = Util.stringInsert(value, ' ', range.from, range.from);

					DataUtil.blockSetText(rootId, block, value, this.marks, true, () => {
						focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
						focus.apply();
					});
				},
			},
		});
	};
	
	setText (marks: I.Mark[], update: boolean, callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const { content } = block;
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

		DataUtil.blockSetText(rootId, block, value, marks, update, (message: any) => {
			if (callBack) {
				callBack(message);
			};
		});
	};
	
	setMarks (marks: I.Mark[]) {
		const { rootId, block } = this.props;
		const value = this.getValue();
		
		if (block.isTextCode()) {
			marks = [];
		};
		
		DataUtil.blockSetText(rootId, block, value, marks, true);
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

		this.placeHolderHide();
		focus.clearRange(true);
		keyboard.setFocus(false);

		if (!this.preventSaveOnBlur) {
			this.setText(this.marks, true);
		};

		onBlur(e);
	};
	
	onPaste (e: any) {
		e.persist();
		e.preventDefault();

		this.setText(this.marks, true);
		this.props.onPaste(e);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheck (e: any) {
		const { rootId, block, readOnly } = this.props;
		const { id, content } = block;
		const { checked } = content;

		if (readOnly) {
			return;
		};
		
		focus.clear(true);
		DataUtil.blockSetText(rootId, block, this.getValue(), this.marks, true, () => {
			C.BlockSetTextChecked(rootId, id, !checked);
		});
	};
	
	onLang (v: string) {
		const { rootId, block, readOnly } = this.props;
		const { id, content } = block;
		const l = String(content.text || '').length;

		if (readOnly) {
			return;
		};
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { lang: v } },
		], (message: any) => {
			Storage.set('codeLang', v);

			focus.set(id, { from: l, to: l });
			focus.apply();
		});
	};
	
	onSelect (e: any) {
		const { rootId, dataset, block } = this.props;
		const { id, content } = block;
		const { focused } = focus;
		const { from, to } = focus.range;
		const { style } = content;

		if ((focused != block.id) && keyboard.isShiftPressed) {
			e.preventDefault();
			return;
		};

		focus.set(id, this.getRange());
		keyboard.setFocus(true);
		
		const { range } = focus;
		const currentFrom = range.from;
		const currentTo = range.to;

		if (!currentTo || (currentFrom == currentTo) || (from == currentFrom && to == currentTo) || block.isTextTitle()) {
			if (!keyboard.isContextDisabled) {
				commonStore.menuClose('blockContext');
			};
			return;
		};

		const win = $(window);
		const el = $('#block-' + id);

		let rect = Util.selectionRect();
		if (!rect.x && !rect.y && !rect.width && !rect.height) {
			rect = null;
		};

		commonStore.menuCloseAll([ 'blockAdd', 'blockMention' ]);

		window.clearTimeout(this.timeoutContext);
		this.timeoutContext = window.setTimeout(() => {
			commonStore.menuOpen('blockContext', {
				element: el,
				rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
				type: I.MenuType.Horizontal,
				offsetX: 0,
				offsetY: -4,
				vertical: I.MenuDirection.Top,
				horizontal: I.MenuDirection.Center,
				passThrough: true,
				data: {
					blockId: id,
					blockIds: [ id ],
					rootId: rootId,
					dataset: dataset,
					range: { from: currentFrom, to: currentTo },
					onChange: (marks: I.Mark[]) => {
						this.marks = marks;
						this.setMarks(marks);

						raf(() => {
							focus.set(id, { from: currentFrom, to: currentTo });
							focus.apply();
						});
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
		if (selection && (this.clicks == 3)) {
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

	placeHolderSet (v: string) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.placeHolder').text(v);
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