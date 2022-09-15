import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Select, Marker, Loader, IconObject, Icon } from 'Component';
import { I, C, keyboard, Key, Util, DataUtil, Mark, focus, Storage, translate, analytics, Renderer } from 'Lib';
import { observer, } from 'mobx-react';
import { getRange } from 'selection-ranges';
import { commonStore, blockStore, detailStore, menuStore, dbStore } from 'Store';
import * as Prism from 'prismjs';

interface Props extends I.BlockComponent, RouteComponentProps<any> {
	index?: any;
	onToggle?(e: any): void;
};

const Constant = require('json/constant.json');
const $ = require('jquery');
const raf = require('raf');

// Prism languages
const langs = [
	'clike', 'c', 'cpp', 'csharp', 'abap', 'arduino', 'bash', 'basic', 'clojure', 'coffeescript', 'dart', 'diff', 'docker', 'elixir',
	'elm', 'erlang', 'flow', 'fortran', 'fsharp', 'gherkin', 'graphql', 'groovy', 'go', 'haskell', 'json', 'latex', 'less', 'lisp',
	'livescript', 'lua', 'markdown', 'makefile', 'matlab', 'nginx', 'objectivec', 'ocaml', 'pascal', 'perl', 'php', 'powershell', 'prolog',
	'python', 'r', 'reason', 'ruby', 'rust', 'sass', 'java', 'scala', 'scheme', 'scss', 'sql', 'swift', 'typescript', 'vbnet', 'verilog',
	'vhdl', 'visual-basic', 'wasm', 'yaml', 'javascript', 'css', 'markup', 'markup-templating', 'csharp', 'php', 'go', 'swift', 'kotlin',
	'wolfram',
];
for (let lang of langs) {
	require(`prismjs/components/prism-${lang}.js`);
};

const BlockText = observer(class BlockText extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	refLang: any = null;
	timeoutContext: number = 0;
	timeoutClick: number = 0;
	marks: I.Mark[] = [];
	text: string = '';
	clicks: number = 0;
	composition: boolean = false;
	preventSaveOnBlur: boolean = false;
	preventMenu: boolean = false;
	frame: number = 0;

	public static defaultProps = {
		onKeyDown: (e: any, text: string, marks: I.Mark[], range: I.TextRange) => {},
	};

	constructor (props: any) {
		super(props);
		
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onToggle = this.onToggle.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onLang = this.onLang.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onToggleWrap = this.onToggleWrap.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onSelectIcon = this.onSelectIcon.bind(this);
		this.onUploadIcon = this.onUploadIcon.bind(this);

		this.onCompositionStart = this.onCompositionStart.bind(this);
		this.onCompositionEnd = this.onCompositionEnd.bind(this);
	};

	render () {
		const { rootId, block, readonly, index } = this.props;
		const { id, fields, content } = block;
		const { text, marks, style, checked, color, iconEmoji, iconImage } = content;
		const { theme } = commonStore;
		const root = blockStore.getLeaf(rootId, rootId);

		let marker: any = null;
		let placeholder = translate('placeholderBlock');
		let cv: string[] = [ 'value', 'focusable', 'c' + id ];
		let additional = null;

		if (color) {
			cv.push('textColor textColor-' + color);
		};
		if (readonly) {
			cv.push('isReadonly');
		};

		// Subscriptions
		for (let mark of marks) {
			if ([ I.MarkType.Mention, I.MarkType.Object ].includes(mark.type)) {
				const object = detailStore.get(rootId, mark.param, []);
			};
		};

		switch (style) {
			case I.TextStyle.Title:
				placeholder = DataUtil.defaultName('page');

				if (root && root.isObjectTask()) {
					marker = { type: 'checkboxTask', className: 'check', active: checked, onClick: this.onCheckbox };
				};
				break;

			case I.TextStyle.Description:
				placeholder = 'Add a description';
				break;

			case I.TextStyle.Callout:
				additional = (
					<IconObject 
						id={`block-${id}-icon`}
						object={{ iconEmoji: (iconImage ? '' : (iconEmoji || ':bulb:')), iconImage }} 
						canEdit={!readonly} 
						onSelect={this.onSelectIcon} 
						onUpload={this.onUploadIcon}
						noRemove={true}
					/>
				);
				break;
				
			case I.TextStyle.Code:
				let options = [];
				for (let i in Constant.codeLang) {
					options.push({ id: i, name: Constant.codeLang[i] });
				};
				
				additional = (
					<React.Fragment>
						<Select 
							id={'lang-' + id} 
							arrowClassName="light" 
							value={fields.lang} 
							ref={(ref: any) => { this.refLang = ref; }} 
							options={options} 
							onChange={this.onLang}
							noFilter={false} 
						/>
						<div className="buttons">
							<div className="btn" onClick={this.onToggleWrap}>
								<Icon className="codeWrap" />
								<div className="txt">{fields.isUnwrapped ? 'Wrap' : 'Unwrap'}</div>
							</div>
							<div className="btn" onClick={this.onCopy}>
								<Icon className="copy" />
								<div className="txt">Copy</div>
							</div>
						</div>
					</React.Fragment>
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
				marker = { type: I.TextStyle.Checkbox, className: 'check', active: checked, onClick: this.onCheckbox };
				break;
		};

		let editor = null;

		if (readonly) {
			editor = <div id="value" className={cv.join(' ')} />;
		} else {
			editor = (
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
					onInput={this.onInput}
					onCompositionStart={this.onCompositionStart}
					onCompositionEnd={this.onCompositionEnd}
					onDragStart={(e: any) => { e.preventDefault(); }}
				/>
			);
		};
		
		return (
			<div className="flex">
				<div className="markers">
					{marker ? <Marker {...marker} id={id} color={color} /> : ''}
				</div>
				{additional ? (
					<div className="additional">
						{additional}
					</div>
				) : ''}
				<div className="wrap">
					<span id="placeholder" className={[ 'placeholder', 'c' + id ].join(' ')}>{placeholder}</span>
					{editor}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { block } = this.props;
		const { content } = block;
		const { marks, text } = content;

		this.marks = Util.objectCopy(marks || []);
		this.setValue(text);
	};
	
	componentDidUpdate () {
		const { block, onUpdate } = this.props;
		const { content } = block;
		const { marks, text } = content;
		const { focused } = focus.state;

		this.marks = Util.objectCopy(marks || []);
		this.setValue(text);

		if (text) {
			this.placeholderHide();
		};

		if (focused == block.id) {
			focus.apply();
		};

		if (onUpdate) {
			onUpdate();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onCompositionStart (e: any) {
		this.composition = true;
	};

	onCompositionEnd (e: any) {
		this.composition = false;
	};
	
	setValue (v: string) {
		const { block } = this.props;
		const fields = block.fields || {};
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		
		let text = String(v || '');
		if (text === '\n') {
			text = '';
		};

		this.text = text;

		let html = text;
		if (block.isTextCode()) {
			let lang = fields.lang;
			let grammar = Prism.languages[lang];

			if (!grammar && (lang != 'plain')) {
				lang = Constant.default.codeLang;
				grammar = Prism.languages[lang];
			};

			if (this.refLang) {
				this.refLang.setValue(lang);
			};

			if (grammar) {
				html = Prism.highlight(html, grammar, lang);
			};
		} else {
			html = Mark.fromUnicode(html);
			html = Mark.toHtml(html, this.marks);
			html = html.replace(/\n/g, '<br/>');
		};

		value.get(0).innerHTML = html;

		if (!block.isTextCode() && (html != text) && this.marks.length) {
			if (this.frame) {
				raf.cancel(this.frame);
			};

			this.frame = raf(() => {
				this.renderLinks();
				this.renderObjects();
				this.renderMentions();
				this.renderEmoji();
			});
		};

		if (block.isTextTitle() || block.isTextDescription()) {
			this.placeholderCheck();
		};
	};
	
	renderLinks () {
		if (!this._isMounted) {
			return;
		};

		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('lnk');
		const self = this;

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			this.textStyle($(item));
		});

		items.off('mouseenter.link');
		items.on('mouseenter.link', function (e: any) {
			let el = $(this);
			let range = el.data('range').split('-');
			let url = String(el.attr('href') || '');
			let scheme = Util.getScheme(url);
			let isInside = scheme == Constant.protocol;
			let route = '';
			let param: any = {
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: self.marks,
				onChange: (marks: I.Mark[]) => { self.setMarks(marks); },
			};

			if (isInside) {
				route = '/' + url.split('://')[1];

				const routeParam = Util.getRoute(route);
				const object = detailStore.get(rootId, routeParam.id, []);

				param = Object.assign(param, {
					param: object.id,
					type: I.MarkType.Object,
				});
			} else {
				url = Util.urlFix(url);
				param = Object.assign(param, {
					param: url,
					type: I.MarkType.Link,
				});
			};

			Util.previewShow(el, param);

			el.off('click.link').on('click.link', (e: any) => {
				e.preventDefault();
				if (isInside) {
					Util.route(route);
				} else {
					Renderer.send('urlOpen', url);
				};
			});
		});
	};

	renderObjects () {
		if (!this._isMounted) {
			return;
		};

		const { rootId } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('obj');
		const self = this;

		if (!items.length) {
			return;
		};

		items.each((i: number, item: any) => {
			item = $(item);
			
			const data = item.data();
			if (!data.param) {
				return;
			};

			const object = detailStore.get(rootId, data.param, []);
			const { _empty_, isArchived, isDeleted } = object;

			if (_empty_ || isArchived || isDeleted) {
				item.addClass('disabled');
			};

			this.textStyle(item);
		});

		items.off('mouseenter.object mouseleave.object');
		items.on('mouseleave.object', function (e: any) { Util.tooltipHide(false); });
		items.on('mouseenter.object', function (e: any) {
			const el = $(this);
			const data = el.data();
			const range = data.range.split('-');
			const object = detailStore.get(rootId, data.param, []);
			
			let tt = '';
			if (object.isArchived) {
				tt = translate('commonArchived');
			};
			if (object.isDeleted) {
				tt = translate('commonDeletedObject');
			};

			if (tt) {
				Util.tooltipShow(tt, el, I.MenuDirection.Center, I.MenuDirection.Top);
				return;
			};

			if (!data.param || el.hasClass('disabled')) {
				return;
			};

			el.off('click.object').on('click.object', function (e: any) {
				e.preventDefault();
				DataUtil.objectOpenEvent(e, object);
			});

			Util.previewShow($(this), {
				param: object.id,
				type: I.MarkType.Object,
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
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const items = value.find('mention');
		
		if (!items.length) {
			return;
		};

		const { rootId, block } = this.props;
		const size = this.emojiParam(block.content.style);
		const self = this;

		items.each((i: number, item: any) => {
			item = $(item);
			
			const data = item.data();
			if (!data.param) {
				return;
			};

			const smile = item.find('smile');
			if (!smile.length) {
				return;
			};

			const object = detailStore.get(rootId, data.param, []);
			const { _empty_, layout, done, isArchived, isDeleted } = object;

			let icon = null;
			if (_empty_) {
				icon = <Loader className={[ 'c' + size, 'inline' ].join(' ')} />;
			} else {
				icon = <IconObject size={size} object={object} />;
			};

			if (_empty_ || isArchived || isDeleted) {
				item.addClass('disabled');
			};

			if ((layout == I.ObjectLayout.Task) && done) {
				item.addClass('isDone');
			};

			ReactDOM.render(icon, smile.get(0), () => {
				if (smile.html()) {
					item.addClass('withImage c' + size);
				};
			});
		});
		
		items.off('mouseenter.mention');

		items.on('mouseenter.mention', function (e: any) {
			const el = $(this);
			const data = el.data();
			const range = data.range.split('-');

			if (!data.param || el.hasClass('disabled')) {
				return;
			};

			const object = detailStore.get(rootId, data.param, []);

			el.off('click.mention').on('click.mention', function (e: any) {
				e.preventDefault();
				DataUtil.objectOpenEvent(e, object);
			});

			Util.previewShow($(this), {
				param: object.id,
				object: object,
				type: I.MarkType.Object,
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: self.marks,
				noUnlink: true,
				onChange: (marks: I.Mark[]) => {
					self.setMarks(marks);
				}
			});
		});
	};

	renderEmoji () {
		if (!this._isMounted) {
			return;
		};

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
			if (!smile.length) {
				return;
			};

			ReactDOM.render(<IconObject size={size} object={{ iconEmoji: data.param }} />, smile.get(0));
		});
	};

	textStyle (obj: any) {
		Util.textStyle(obj, { textOpacity: 0.65, borderOpacity: 0.35 });
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
		const value = node.find('#value');
		const obj = Mark.cleanHtml(value.html());

		return String(obj.get(0).innerText || '');
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		const { block } = this.props;
		const node = $(ReactDOM.findDOMNode(this));
		const value = node.find('#value');
		const restricted: I.MarkType[] = [];

		if (block.isTextHeader()) {
			restricted.push(I.MarkType.Bold);
		};
		
		return Mark.fromHtml(value.html(), restricted);
	};

	onInput (e: any) {
		const { onUpdate } = this.props;
		
		this.placeholderCheck();

		if (onUpdate) {
			onUpdate();
		};
	};
	
	onKeyDown (e: any) {
		e.persist();

		// Chinese IME is open
		if (this.composition) {
			return;
		};

		const { onKeyDown, rootId, block } = this.props;
		const { id } = block;
		
		if (menuStore.isOpenList([ 'blockStyle', 'blockColor', 'blockBackground', 'blockMore' ])) {
			e.preventDefault();
			return;
		};

		let value = this.getValue();
		let ret = false;

		const range = this.getRange();
		const symbolBefore = range ? value[range.from - 1] : '';
		const cmd = keyboard.ctrlKey();
		
		const menuOpen = menuStore.isOpen();
		const menuOpenAdd = menuStore.isOpen('blockAdd');
		const menuOpenMention = menuStore.isOpen('blockMention');
		const menuOpenSmile = menuStore.isOpen('smile');
		const saveKeys: any[] = [
			{ key: `${cmd}+shift+arrowup`, preventDefault: true },
			{ key: `${cmd}+shift+arrowdown`, preventDefault: true },
			{ key: `${cmd}+c`, preventDefault: true },
			{ key: `${cmd}+x`, preventDefault: true },
			{ key: `${cmd}+d`, preventDefault: true },
			{ key: `${cmd}+a`, preventDefault: true },
			{ key: `${cmd}+[`, preventDefault: false },
			{ key: `${cmd}+]`, preventDefault: false },
			{ key: `shift+tab`, preventDefault: true },
			{ key: `shift+space`, preventDefault: false },
		];

		keyboard.shortcut('enter, shift+enter', e, (pressed: string) => {
			if (menuOpen) {
				e.preventDefault();
				return;
			};

			let pd = true;
			if (block.isTextCode() && (pressed == 'enter')) {
				pd = false;
			};
			if (block.isText() && !block.isTextCode() && pressed.match('shift')) {
				pd = false;
			};
			if (pd) {
				e.preventDefault();
			};
			
			DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
				onKeyDown(e, value, this.marks, range, this.props);
			});

			ret = true;
		});

		keyboard.shortcut('arrowleft, arrowright, arrowdown, arrowup', e, (pressed: string) => {
			keyboard.disableContextClose(false);
		});

		saveKeys.forEach((item: any) => {
			keyboard.shortcut(item.key, e, (pressed: string) => {
				if (item.preventDefault) {
					e.preventDefault();
				};

				DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => { 
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			});
		});

		keyboard.shortcut('tab', e, (pressed: string) => {
			e.preventDefault();

			if (!range) {
				return;
			};
			
			if (block.isTextCode()) {
				value = Util.stringInsert(value, '\t', range.from, range.from);

				DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
					focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
					focus.apply();
				});
			} else {
				this.setText(this.marks, true, () => {
					focus.apply();
					onKeyDown(e, value, this.marks, range, this.props);
				});
			};

			ret = true;
		});

		keyboard.shortcut('backspace', e, (pressed: string) => {
			if (keyboard.pressed.indexOf(Key.enter) >= 0) {
				ret = true;
				return;
			};

			if (!menuOpenAdd && !menuOpenMention && !range.to) {
				const parsed = this.getMarksFromHtml();

				this.marks = Mark.checkRanges(value, parsed.marks);
				DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			};

			if (menuOpenAdd && (symbolBefore == '/')) {
				menuStore.close('blockAdd');
			};

			if (menuOpenMention && (symbolBefore == '@')) {
				menuStore.close('blockMention');
			};
		});

		keyboard.shortcut('delete', e, (pressed: string) => {
			if (!range) {
				return;
			};
			if (range.to && ((range.from != range.to) || (range.to != value.length))) {
				ret = true;
			};
		});

		keyboard.shortcut(`${cmd}+e`, e, (pressed: string) => {
			if (menuOpenSmile || !block.canHaveMarks()) {
				return;
			};

			e.preventDefault();
			this.onSmile();
		});

		if (ret) {
			return;
		};
		
		focus.set(id, range);

		if (!keyboard.isSpecial(e)) {
			this.placeholderHide();
		};
		
		onKeyDown(e, value, this.marks, range, this.props);
	};
	
	onKeyUp (e: any) {
		e.persist();

		const { rootId, block, onMenuAdd, isInsideTable, onKeyUp } = this.props;
		const { filter } = commonStore;
		const { id, content } = block;
		const range = this.getRange();
		const k = keyboard.eventKey(e);
		const Markdown = {
			'[\\*\\-\\+]':	 I.TextStyle.Bulleted,
			'\\[\\]':		 I.TextStyle.Checkbox,
			'#':			 I.TextStyle.Header1,
			'##':			 I.TextStyle.Header2,
			'###':			 I.TextStyle.Header3,
			'"':			 I.TextStyle.Quote,
			'```':			 I.TextStyle.Code,
			'\\>':			 I.TextStyle.Toggle,
			'1\\.':			 I.TextStyle.Numbered,
		};
		const Length: any = {};

		Length[I.TextStyle.Bulleted] = 1;
		Length[I.TextStyle.Checkbox] = 2;
		Length[I.TextStyle.Numbered] = 2;
		Length[I.TextStyle.Header1] = 1;
		Length[I.TextStyle.Header2] = 2;
		Length[I.TextStyle.Header3] = 3;
		Length[I.TextStyle.Toggle] = 1;
		Length[I.TextStyle.Quote] = 1;
		Length[I.TextStyle.Code] = 3;

		const menuOpenAdd = menuStore.isOpen('blockAdd');
		const menuOpenMention = menuStore.isOpen('blockMention');
		
		let value = this.getValue();
		let cmdParsed = false;
		let newBlock: any = { 
			bgColor: block.bgColor,
			content: {},
		};

		const symbolBefore = range ? value[range.from - 1] : '';
		const isSpaceBefore = range ? (!range.from || (value[range.from - 2] == ' ') || (value[range.from - 2] == '\n')) : false;
		const canOpenMenuAdd = (symbolBefore == '/') && !this.preventMenu && !keyboard.isSpecial(e) && !menuOpenAdd && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();
		const canOpenMentionMenu = (symbolBefore == '@') && !this.preventMenu && (isSpaceBefore || (range.from == 1)) && !keyboard.isSpecial(e) && !menuOpenMention && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();
		const parsed = this.getMarksFromHtml();

		this.preventMenu = false;
		this.marks = parsed.marks;

		if (menuOpenAdd) {
			if (k == Key.space) {
				commonStore.filterSet(0, '');
				menuStore.close('blockAdd');
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
				menuStore.close('blockMention');
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
		if (canOpenMenuAdd && !isInsideTable) { 
			DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
				onMenuAdd(id, Util.stringCut(value, range.from - 1, range.from), range, this.marks);
			});
			return;
		};

		// Open mention menu
		if (canOpenMentionMenu) {
			DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
				this.onMention();
			});
			return;
		};

		// Make div
		if ([ '---', '***' ].includes(value)) {
			newBlock.type = I.BlockType.Div;
			newBlock.content.style = value == '---' ? I.DivStyle.Line : I.DivStyle.Dot;
			cmdParsed = true;
		};
		
		if (newBlock.type && !isInsideTable) {
			C.BlockCreate(rootId, id, I.BlockPosition.Top, newBlock, () => {
				this.setValue('');
				
				focus.set(block.id, { from: 0, to: 0 });
				focus.apply();
			});
		};

		if (block.canHaveMarks() && !isInsideTable) {
			// Parse markdown commands
			for (let k in Markdown) {
				const reg = new RegExp(`^(${k} )`);
				const style = Markdown[k];

				if ((style == I.TextStyle.Numbered) && block.isTextHeader()) {
					continue;
				};

				if (value.match(reg)) {
					value = value.replace(reg, (s: string, p: string) => { return s.replace(p, ''); });

					if (style == I.TextStyle.Code) {
						this.marks = [];
					} else {
						this.marks = Mark.adjust(this.marks, 0, -(Length[style] + 1));
					};

					this.setValue(value);

					DataUtil.blockSetText(rootId, id, value, this.marks, true, () => {
						C.BlockListTurnInto(rootId, [ id ], style);

						if (style == I.TextStyle.Toggle) {
							blockStore.toggle(rootId, id, true);
						};
					});

					cmdParsed = true;
					break;
				};
			};
		};
		
		if (cmdParsed) {
			menuStore.close('blockAdd');
			return;
		};

		keyboard.shortcut('backspace, delete', e, (pressed: string) => { menuStore.close('blockContext'); });

		this.placeholderCheck();

		let text = value;
		if (block.canHaveMarks()) {
			text = parsed.text;
		} else 
		if (!block.isTextCode()) {
			text = Mark.fromUnicode(value);
		};

		if (value != text) {
			this.setValue(text);

			const diff = value.length - text.length;
			focus.set(focus.state.focused, { from: focus.state.range.from - diff, to: focus.state.range.to - diff });
			focus.apply();
		};

		this.setText(this.marks, false);
		onKeyUp(e, value, this.marks, range, this.props);
	};

	onMention () {
		const { rootId, block } = this.props;
		const win = $(window);
		const range = this.getRange();
		const el = $('#block-' + block.id);

		let value = this.getValue();
		value = Util.stringCut(value, range.from - 1, range.from);

		this.preventSaveOnBlur = true;
		commonStore.filterSet(range.from - 1, '');

		raf(() => {
			menuStore.open('blockMention', {
				element: el,
				recalcRect: () => {
					const rect = Util.selectionRect();
					return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
				},
				offsetX: () => {
					const rect = Util.selectionRect();
					return rect ? 0 : Constant.size.blockMenu;
				},
				noFlipX: false,
				noFlipY: false,
				onClose: () => {
					this.preventSaveOnBlur = false;
				},
				data: {
					rootId,
					blockId: block.id,
					marks: this.marks,
					skipIds: [ rootId ],
					onChange: (text: string, marks: I.Mark[], from: number, to: number) => {
						value = Util.stringInsert(value, text, from, from);
						this.marks = Mark.checkRanges(value, marks);

						DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
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
		});
	};

	onSmile () {
		let { rootId, block } = this.props;
		let win = $(window);
		let range = this.getRange();
		let value = this.getValue();

		menuStore.open('smile', {
			element: `#block-${block.id}`,
			recalcRect: () => {
				const rect = Util.selectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = Util.selectionRect();
				return rect ? 0 : Constant.size.blockMenu;
			},
			data: {
				noHead: true,
				rootId: rootId,
				blockId: block.id,
				onSelect: (icon: string) => {
					this.marks = Mark.adjust(this.marks, range.from, 1);
					this.marks = Mark.toggle(this.marks, { 
						type: I.MarkType.Emoji, 
						param: icon, 
						range: { from: range.from, to: range.from + 1 },
					});
					value = Util.stringInsert(value, ' ', range.from, range.from);

					DataUtil.blockSetText(rootId, block.id, value, this.marks, true, () => {
						focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
						focus.apply();
					});
				},
			},
		});
	};
	
	setText (marks: I.Mark[], update: boolean, callBack?: () => void) {
		const { rootId, block } = this.props;
		const { content } = block;
		const value = this.getValue();

		if (content.style == I.TextStyle.Code) {
			marks = [];
		};

		if ((this.text === value) && !update) {
			if (callBack) {
				callBack();
			};
			return;
		};

		this.text = value;

		DataUtil.blockSetText(rootId, block.id, value, marks, update, (message: any) => {
			if (callBack) {
				callBack();
			};
		});
	};
	
	setMarks (marks: I.Mark[]) {
		const { rootId, block } = this.props;
		const value = this.getValue();
		
		if (block.isTextCode()) {
			marks = [];
		};

		DataUtil.blockSetText(rootId, block.id, value, marks, true);
	};
	
	onFocus (e: any) {
		const { onFocus } = this.props;

		e.persist();

		this.placeholderCheck();
		keyboard.setFocus(true);

		if (onFocus) {
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { block, onBlur } = this.props;

		if (!block.isTextTitle() && !block.isTextDescription()) {
			this.placeholderHide();
		};

		focus.clear(true);
		keyboard.setFocus(false);

		if (!this.preventSaveOnBlur) {
			this.setText(this.marks, true);
		};

		if (onBlur) {
			onBlur(e);
		};

		let key = '';
		if (block.isTextTitle()) {
			key = 'SetObjectTitle';
		};
		if (block.isTextDescription()) {
			key = 'SetObjectDescription';
		};
		if (key) {
			analytics.event(key);
		};
	};
	
	onPaste (e: any) {
		e.persist();
		e.preventDefault();

		this.preventMenu = true;

		this.setText(this.marks, true);
		this.props.onPaste(e, this.props);
	};
	
	onToggle (e: any) {
		this.props.onToggle(e);
	};
	
	onCheckbox (e: any) {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { checked } = content;

		if (readonly) {
			return;
		};
		
		focus.clear(true);
		DataUtil.blockSetText(rootId, block.id, this.getValue(), this.marks, true, () => {
			C.BlockTextSetChecked(rootId, id, !checked);
		});
	};
	
	onLang (v: string) {
		const { rootId, block, readonly } = this.props;
		const { id, fields, content } = block;
		const l = String(content.text || '').length;

		if (readonly) {
			return;
		};
		
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, lang: v } },
		], (message: any) => {
			Storage.set('codeLang', v);

			focus.set(id, { from: l, to: l });
			focus.apply();
		});
	};

	onToggleWrap (e: any) {
		const { rootId, block } = this.props;
		const { id, fields } = block;

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, isUnwrapped: !fields.isUnwrapped } },
		]);
	};

	onCopy (e: any) {
		const { rootId, block } = this.props;

		C.BlockCopy(rootId, [ block ], { from: 0, to: 0 }, (message: any) => {
			Util.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: { from: 0, to: 0 },
					blocks: [ block ],
				},
			});
		});
	};
	
	onSelect (e: any) {
		const { rootId, dataset, block, isPopup, isInsideTable } = this.props;
		const ids = DataUtil.selectionGet('', false, this.props);

		focus.set(block.id, this.getRange());
		keyboard.setFocus(true);
		
		const currentFrom = focus.state.range.from;
		const currentTo = focus.state.range.to;

		window.clearTimeout(this.timeoutContext);

		if (!currentTo || (currentFrom == currentTo) || !block.canHaveMarks() || ids.length) {
			if (!keyboard.isContextCloseDisabled) {
				menuStore.close('blockContext');
			};
			return;
		};

		const win = $(window);
		const el = $('#block-' + block.id);

		menuStore.closeAll([ 'blockAdd', 'blockMention' ]);

		this.timeoutContext = window.setTimeout(() => {
			if (keyboard.isContextOpenDisabled) {
				return;
			};

			const pageContainer = Util.getPageContainer(isPopup);

			pageContainer.off('click.context').on('click.context', () => { 
				pageContainer.off('click.context');
				menuStore.close('blockContext'); 
			});

			menuStore.open('blockContext', {
				element: el,
				recalcRect: () => { 
					const rect = Util.selectionRect();
					return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
				},
				type: I.MenuType.Horizontal,
				offsetY: 4,
				vertical: I.MenuDirection.Bottom,
				horizontal: I.MenuDirection.Center,
				passThrough: true,
				onClose: () => {
					keyboard.disableContextClose(false);
				},
				data: {
					blockId: block.id,
					blockIds: [ block.id ],
					rootId: rootId,
					dataset: dataset,
					range: { from: currentFrom, to: currentTo },
					marks: this.marks,
					isInsideTable,
					onChange: (marks: I.Mark[]) => {
						this.marks = marks;
						this.setMarks(marks);

						raf(() => {
							focus.set(block.id, { from: currentFrom, to: currentTo });
							focus.apply();
						});
					},
				},
			});
		}, 150);
	};
	
	onMouseDown (e: any) {
		const { dataset, block, isInsideTable } = this.props;
		const { selection } = dataset || {};

		window.clearTimeout(this.timeoutClick);

		this.clicks++;
		if (selection && (this.clicks == 3)) {
			e.preventDefault();
			e.stopPropagation();
			
			this.clicks = 0;

			if (isInsideTable) {
				focus.set(block.id, { from: 0, to: block.getLength() });
				focus.apply();
			} else {
				selection.set(I.SelectType.Block, [ block.id ]);
				focus.clear(true);
				menuStore.close('blockContext');
				window.clearTimeout(this.timeoutContext);
			};
		};
	};
	
	onMouseUp (e: any) {
		window.clearTimeout(this.timeoutClick);
		this.timeoutClick = window.setTimeout(() => { this.clicks = 0; }, 300);
	};

	onSelectIcon (icon: string) {
		const { rootId, block } = this.props;
		
		C.BlockTextSetIcon(rootId, block.id, icon, '');
	};

	onUploadIcon (hash: string) {
		const { rootId, block } = this.props;

		C.BlockTextSetIcon(rootId, block.id, '', hash);
	};
	
	placeholderCheck () {
		this.getValue() ? this.placeholderHide() : this.placeholderShow();			
	};

	placeholderSet (v: string) {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').text(v);
	};
	
	placeholderHide () {
		if (!this._isMounted) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').hide();
	};
	
	placeholderShow () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find('#placeholder').show();
	};
	
	getRange () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		const range = getRange(node.find('#value').get(0) as Element);

		return range ? { from: range.start, to: range.end } : null;
	};

});

export default BlockText;