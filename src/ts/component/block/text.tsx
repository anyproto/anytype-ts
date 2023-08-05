import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Prism from 'prismjs';
import $ from 'jquery';
import raf from 'raf';
import { observer, } from 'mobx-react';
import { Select, Marker, Loader, IconObject, Icon, Editable } from 'Component';
import { I, C, keyboard, Key, UtilCommon, UtilData, UtilObject, Preview, Mark, focus, Storage, translate, analytics, Renderer } from 'Lib';
import { commonStore, blockStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.BlockComponent {
	onToggle?(e: any): void;
};

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

const BlockText = observer(class BlockText extends React.Component<Props> {

	public static defaultProps = {
		onKeyDown: (e: any, text: string, marks: I.Mark[], range: I.TextRange) => {},
	};

	_isMounted = false;
	node: any = null;
	refLang: any = null;
	refEditable: any = null;
	timeoutContext = 0;
	timeoutClick = 0;
	timeoutFilter = 0;
	marks: I.Mark[] = [];
	text = '';
	clicks = 0;
	preventSaveOnBlur = false;
	preventMenu = false;
	frame = 0;

	constructor (props: Props) {
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
		this.setMarks = this.setMarks.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
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
			case I.TextStyle.Title: {
				placeholder = UtilObject.defaultName('Page');

				if (root && root.isObjectTask()) {
					marker = { type: 'checkboxTask', className: 'check', active: checked, onClick: this.onCheckbox };
				};
				break;
			};

			case I.TextStyle.Description: {
				placeholder = translate('placeholderBlockDescription');
				break;
			};

			case I.TextStyle.Callout: {
				additional = (
					<IconObject 
						id={`block-${id}-icon`}
						object={{ iconEmoji: (iconImage ? '' : (iconEmoji || ':bulb:')), iconImage, layout: I.ObjectLayout.Page }} 
						canEdit={!readonly}
						iconSize={20}
						onSelect={this.onSelectIcon} 
						onUpload={this.onUploadIcon}
						noRemove={true}
					/>
				);
				break;
			};
				
			case I.TextStyle.Code: {
				const options: I.Option[] = [];
				for (let i in Constant.codeLang) {
					options.push({ id: i, name: Constant.codeLang[i] });
				};
				
				additional = (
					<React.Fragment>
						<Select 
							id={'lang-' + id} 
							arrowClassName="light" 
							value={fields.lang} 
							ref={ref => this.refLang = ref} 
							options={options} 
							onChange={this.onLang}
							noFilter={false} 
							readonly={readonly}
						/>
						<div className="buttons">
							<div className="btn" onClick={this.onToggleWrap}>
								<Icon className="codeWrap" />
								<div className="txt">{fields.isUnwrapped ? translate('blockTextWrap') : translate('blockTextUnwrap')}</div>
							</div>

							<div className="btn" onClick={this.onCopy}>
								<Icon className="copy" />
								<div className="txt">{translate('commonCopy')}</div>
							</div>
						</div>
					</React.Fragment>
				);
				break;
			};
				
			case I.TextStyle.Bulleted: {
				marker = { type: I.TextStyle.Bulleted, className: 'bullet' };
				break;
			};
				
			case I.TextStyle.Numbered: {
				marker = { type: I.TextStyle.Numbered, className: 'number' };
				break;
			};
				
			case I.TextStyle.Toggle: {
				marker = { type: I.TextStyle.Toggle, className: 'toggle', onClick: this.onToggle };
				break;
			};
				
			case I.TextStyle.Checkbox: {
				marker = { type: I.TextStyle.Checkbox, className: 'check', active: checked, onClick: this.onCheckbox };
				break;
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className="flex"
			>
				<div className="markers">
					{marker ? <Marker {...marker} id={id} color={color} /> : ''}
				</div>
				{additional ? (
					<div className="additional">
						{additional}
					</div>
				) : ''}

				<Editable 
					ref={ref => this.refEditable = ref}
					id="value"
					classNameEditor={cv.join(' ')}
					classNamePlaceholder={'c' + id}
					readonly={readonly}
					placeholder={placeholder}
					onKeyDown={this.onKeyDown}
					onKeyUp={this.onKeyUp}
					onFocus={this.onFocus}
					onBlur={this.onBlur}
					onSelect={this.onSelect}
					onPaste={this.onPaste}
					onMouseDown={this.onMouseDown}
					onMouseUp={this.onMouseUp}
					onInput={this.onInput}
					onDragStart={(e: any) => { e.preventDefault(); }}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { block } = this.props;
		const { content } = block;
		const { marks, text } = content;

		this.marks = UtilCommon.objectCopy(marks || []);
		this.setValue(text);
	};
	
	componentDidUpdate () {
		const { block, onUpdate } = this.props;
		const { content } = block;
		const { marks, text } = content;
		const { focused } = focus.state;

		this.marks = UtilCommon.objectCopy(marks || []);
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

	setValue (v: string) {
		const { block } = this.props;
		const fields = block.fields || {};
		
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
			html = Mark.fromUnicode(html, this.marks);
			html = Mark.toHtml(html, this.marks);
		};

		html = html.replace(/\n/g, '<br/>');

		if (this.refEditable) {
			this.refEditable.setValue(html);
		};

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
		const node = $(this.node);
		const items = node.find('lnk');

		if (!items.length) {
			return;
		};

		items.each((i: number, item) => {
			this.textStyle($(item));
		});

		items.off('mouseenter.link');
		items.on('mouseenter.link', e => {
			const sr = UtilCommon.getSelectionRange();
			if (sr && !sr.collapsed) {
				return;
			};

			const element = $(e.currentTarget);
			const range = String(element.attr('data-range') || '').split('-');
			const url = String(element.attr('href') || '');
			const scheme = UtilCommon.getScheme(url);
			const isInside = scheme == Constant.protocol;

			let route = '';
			let target;
			let type;

			if (isInside) {
				route = '/' + url.split('://')[1];

				const routeParam = UtilCommon.getRoute(route);
				const object = detailStore.get(rootId, routeParam.id, []);

				target = object.id;
			} else {
				target = UtilCommon.urlFix(url);
				type = I.PreviewType.Link;
			};

			Preview.previewShow({
				target,
				type,
				element,
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: this.marks,
				onChange: this.setMarks,
			});

			element.off('click.link').on('click.link', e => {
				e.preventDefault();
				if (isInside) {
					UtilCommon.route(route, {});
				} else {
					Renderer.send('urlOpen', target);
				};
			});
		});
	};

	renderObjects () {
		if (!this._isMounted) {
			return;
		};

		const { rootId } = this.props;
		const node = $(this.node);
		const items = node.find('obj');

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
		items.on('mouseleave.object', () => Preview.tooltipHide(false));
		items.on('mouseenter.object', e => {
			const sr = UtilCommon.getSelectionRange();
			if (sr && !sr.collapsed) {
				return;
			};

			const element = $(e.currentTarget);
			const range = String(element.attr('data-range') || '').split('-');
			const param = String(element.attr('data-param') || '');
			const object = detailStore.get(rootId, param, []);
			
			let tt = '';
			if (object.isArchived) {
				tt = translate('commonArchived');
			};
			if (object.isDeleted) {
				tt = translate('commonDeletedObject');
			};

			if (tt) {
				Preview.tooltipShow({ text: tt, element });
				return;
			};

			if (!param || element.hasClass('disabled')) {
				return;
			};

			element.off('click.object').on('click.object', e => {
				e.preventDefault();
				UtilObject.openEvent(e, object);
			});

			Preview.previewShow({
				target: object.id,
				element,
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: this.marks,
				onChange: this.setMarks,
			});
		});
	};

	renderMentions () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const items = node.find('mention');
		
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

			const smile = item.find('smile');
			if (!smile.length) {
				return;
			};

			const object = detailStore.get(rootId, data.param, []);
			const { _empty_, layout, done, isArchived, isDeleted } = object;

			let icon = null;
			if (_empty_) {
				icon = <Loader type="loader" className={[ 'c' + size, 'inline' ].join(' ')} />;
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

			this.textStyle(item);
		});
		
		items.off('mouseenter.mention');
		items.on('mouseenter.mention', e => {
			const sr = UtilCommon.getSelectionRange();
			if (sr && !sr.collapsed) {
				return;
			};

			const element = $(e.currentTarget);
			const range = String(element.attr('data-range') || '').split('-');
			const param = String(element.attr('data-param') || '');

			if (!param || element.hasClass('disabled')) {
				return;
			};

			const object = detailStore.get(rootId, param, []);

			element.off('click.mention').on('click.mention', e => {
				e.preventDefault();
				UtilObject.openEvent(e, object);
			});

			Preview.previewShow({
				target: object.id,
				element,
				range: { 
					from: Number(range[0]) || 0,
					to: Number(range[1]) || 0, 
				},
				marks: this.marks,
				noUnlink: true,
				onChange: this.setMarks,
			});
		});
	};

	renderEmoji () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const items = node.find('emoji');
		
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
			if (smile.length) {
				ReactDOM.render(<IconObject size={size} object={{ iconEmoji: data.param }} />, smile.get(0));
			};
		});
	};

	textStyle (obj: any) {
		UtilCommon.textStyle(obj, { border: 0.4 });
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
		return this.refEditable ? this.refEditable.getTextValue() : '';
	};

	getRange (): I.TextRange {
		return this.refEditable ? this.refEditable.getRange() : null;
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		const { block } = this.props;
		const value = this.refEditable ? this.refEditable.getHtmlValue() : '';
		const restricted: I.MarkType[] = [];

		if (block.isTextHeader()) {
			restricted.push(I.MarkType.Bold);
		};
		
		return Mark.fromHtml(value, restricted);
	};

	onInput () {
		const { onUpdate } = this.props;

		if (onUpdate) {
			onUpdate();
		};
	};
	
	onKeyDown (e: any) {
		e.persist();

		const { onKeyDown, rootId, block } = this.props;
		const { id } = block;

		if (menuStore.isOpenList([ 'blockStyle', 'blockColor', 'blockBackground', 'blockMore' ])) {
			e.preventDefault();
			return;
		};

		let value = this.getValue();
		let ret = false;

		const key = e.key.toLowerCase();
		const range = this.getRange();
		const symbolBefore = range ? value[range.from - 1] : '';
		const cmd = keyboard.cmdKey();

		const menuOpen = menuStore.isOpen('', '', [ 'onboarding' ]);
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
			{ key: `${cmd}+z`, preventDefault: true },
			{ key: `${cmd}+shift+z`, preventDefault: true },
			{ key: `tab`, preventDefault: true },
			{ key: `shift+tab`, preventDefault: true },
			{ key: `shift+space`, preventDefault: false },
			{ key: `ctrl+shift+l`, preventDefault: false },
		];
		const twineOpen = [ '[', '{', '\'', '\"', '(' ];
		const twineClose = {
			'[': ']',
			'{': '}',
			'(': ')'
		};

		for (let i = 0; i < 9; ++i) {
			saveKeys.push({ key: `${cmd}+${i}`, preventDefault: false });
		};

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
			
			UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
				onKeyDown(e, value, this.marks, range, this.props);
			});

			ret = true;
		});

		keyboard.shortcut('arrowleft, arrowright, arrowdown, arrowup', e, () => {
			keyboard.disableContextClose(false);
		});

		saveKeys.forEach((item: any) => {
			keyboard.shortcut(item.key, e, () => {
				if (item.preventDefault) {
					e.preventDefault();
				};

				UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => { 
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			});
		});

		keyboard.shortcut('tab', e, () => {
			e.preventDefault();

			if (!range) {
				return;
			};
			
			if (block.isTextCode()) {
				value = UtilCommon.stringInsert(value, '\t', range.from, range.from);

				UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
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

		keyboard.shortcut('backspace', e, () => {
			if (keyboard.pressed.includes(Key.enter)) {
				ret = true;
				return;
			};

			if (!range) {
				return;
			};

			if (!menuOpenAdd && !menuOpenMention && !range.to) {
				const parsed = this.getMarksFromHtml();

				this.marks = Mark.checkRanges(value, parsed.marks);
				UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
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

		keyboard.shortcut('delete', e, () => {
			if (!range) {
				return;
			};

			if (range.to && ((range.from != range.to) || (range.to == value.length))) {
				UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			};
		});

		keyboard.shortcut(`${cmd}+e, ${cmd}+dot`, e, () => {
			if (menuOpenSmile || !block.canHaveMarks()) {
				return;
			};

			e.preventDefault();
			this.onSmile();
		});

		if (range && (range.from != range.to) && twineOpen.includes(key)) {
			e.preventDefault();

			const l = e.key.length;
			const cut = value.slice(range.from, range.to);
			const closingSymbol = twineClose[key] || key;

			value = UtilCommon.stringInsert(value, `${key}${cut}${closingSymbol}`, range.from, range.to);
			this.marks = Mark.adjust(this.marks, range.from, l);

			UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
				focus.set(block.id, { from: range.from + l, to: range.to + l });
				focus.apply();
			});

			ret = true;
		};
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

		const oneSymbolBefore = range ? value[range.from - 1] : '';
		const twoSymbolBefore = range ? value[range.from - 2] : '';
		const isAllowedMention = range ? (!range.from || [ ' ', '\n', '(', '[', '"', '\'' ].includes(twoSymbolBefore)) : false;
		const canOpenMenuAdd = (oneSymbolBefore == '/') && !this.preventMenu && !keyboard.isSpecial(e) && !menuOpenAdd && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();
		const canOpenMentionMenu = (oneSymbolBefore == '@') && !this.preventMenu && (isAllowedMention || (range.from == 1)) && !keyboard.isSpecial(e) && !menuOpenMention && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();
		const newBlock: any = { 
			bgColor: block.bgColor,
			content: {},
		};
		
		this.preventMenu = false;

		let parsed: any = {};
		let marksChanged = false;

		if (block.canHaveMarks()) {
			parsed = this.getMarksFromHtml();
			marksChanged = parsed.marksChanged;
			this.marks = parsed.marks;
		};

		if (menuOpenAdd || menuOpenMention) {
			window.clearTimeout(this.timeoutFilter);
			this.timeoutFilter = window.setTimeout(() => {
				let ret = false;

				keyboard.shortcut('space', e, () => {
					commonStore.filterSet(0, '');
					if (menuOpenAdd) {
						menuStore.close('blockAdd');
					};
					if (menuOpenMention) {
						menuStore.close('blockMention');
					};
					ret = true;
				});

				if (!ret && range) {
					const d = range.from - filter.from;
					if (d >= 0) {
						const part = value.substring(filter.from, filter.from + d).replace(/^\//, '');
						commonStore.filterSetText(part);
					};
				};
			}, 30);
			return;
		};

		// Open add menu
		if (canOpenMenuAdd && !isInsideTable) { 
			UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
				onMenuAdd(id, UtilCommon.stringCut(value, range.from - 1, range.from), range, this.marks);
			});
			return;
		};

		// Open mention menu
		if (canOpenMentionMenu) {
			UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
				this.onMention();
			});
			return;
		};

		// Make div
		const divReg = new RegExp('^(---|—-|\\*\\*\\*)');
		const match = value.match(divReg);

		if (match) {
			newBlock.type = I.BlockType.Div;
			newBlock.content.style = match[1] == '***' ? I.DivStyle.Dot : I.DivStyle.Line;
			cmdParsed = true;
		};

		if (newBlock.type && !isInsideTable) {
			C.BlockCreate(rootId, id, I.BlockPosition.Top, newBlock, () => {
				this.setValue(value.replace(divReg, ''));
				
				focus.set(block.id, { from: 0, to: 0 });
				focus.apply();
			});
		};

		// Parse markdown commands
		if (block.canHaveMarks() && !isInsideTable) {
			for (let k in Markdown) {
				const reg = new RegExp(`^(${k}\\s)`);
				const newStyle = Markdown[k];

				if ((newStyle == content.style) || !value.match(reg) || ((newStyle == I.TextStyle.Numbered) && block.isTextHeader())) {
					continue;
				};

				// If emoji markup is first do not count one space character in mark adjustment
				const isFirstEmoji = Mark.getInRange(this.marks, I.MarkType.Emoji, { from: 1, to: 2 });
				const offset = isFirstEmoji ? 0 : 1;

				value = value.replace(reg, (s: string, p: string) => {
					if (isFirstEmoji) {
						p = p.trim();
					};
					return s.replace(p, '');
				});

				this.marks = newStyle == I.TextStyle.Code ? [] : Mark.adjust(this.marks, 0, -(Length[newStyle] + offset));
				this.setValue(value);

				UtilData.blockSetText(rootId, id, value, this.marks, true, () => {
					C.BlockListTurnInto(rootId, [ id ], newStyle, () => {
						focus.set(block.id, { from: 0, to: 0 });
						focus.apply();
					});

					if (newStyle == I.TextStyle.Toggle) {
						blockStore.toggle(rootId, id, true);
					};
				});

				cmdParsed = true;
				break;
			};
		};
		
		if (cmdParsed) {
			menuStore.close('blockAdd');
			return;
		};

		let ret = false;
		let diff = 0;

		keyboard.shortcut('backspace, delete', e, () => { 
			menuStore.close('blockContext'); 
			ret = true;
		});

		keyboard.shortcut('alt+backspace', e, () => { 
			diff += this.text.length - value.length;
		});

		this.placeholderCheck();

		const text = block.canHaveMarks() ? parsed.text : value;

		if (!ret && (marksChanged || (value != text))) {
			this.setValue(text);
			const { focused, range } = focus.state;

			diff += value.length - text.length;

			focus.set(focused, { from: range.from - diff, to: range.to - diff });
			focus.apply();
		};

		this.setText(this.marks, false);
		onKeyUp(e, value, this.marks, range, this.props);
	};

	onMention () {
		const { rootId, block } = this.props;
		const win = $(window);
		const range = this.getRange();
		const el = $(`#block-${block.id}`);

		let value = this.getValue();
		value = UtilCommon.stringCut(value, range.from - 1, range.from);

		this.preventSaveOnBlur = true;
		commonStore.filterSet(range.from - 1, '');

		raf(() => {
			menuStore.open('blockMention', {
				element: el,
				recalcRect: () => {
					const rect = UtilCommon.getSelectionRect();
					return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
				},
				offsetX: () => {
					const rect = UtilCommon.getSelectionRect();
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
						value = UtilCommon.stringInsert(value, text, from, from);
						this.marks = Mark.checkRanges(value, marks);

						UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
							focus.set(block.id, { from: to, to: to });
							focus.apply();

							// Try to fix async detailsUpdate event
							window.setTimeout(() => {
								focus.set(block.id, { from: to, to });
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
				const rect = UtilCommon.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = UtilCommon.getSelectionRect();
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
					value = UtilCommon.stringInsert(value, ' ', range.from, range.from);

					UtilData.blockSetText(rootId, block.id, value, this.marks, true, () => {
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

		if (menuStore.isOpen('', '', [ 'onboarding', 'smile' ])) {
			return;
		};

		UtilData.blockSetText(rootId, block.id, value, marks, update, () => {
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

		UtilData.blockSetText(rootId, block.id, value, marks, true);
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
	
	onCheckbox () {
		const { rootId, block, readonly } = this.props;
		const { id, content } = block;
		const { checked } = content;

		if (readonly) {
			return;
		};
		
		focus.clear(true);
		UtilData.blockSetText(rootId, block.id, this.getValue(), this.marks, true, () => {
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
		], () => {
			Storage.set('codeLang', v);

			focus.set(id, { from: l, to: l });
			focus.apply();
		});
	};

	onToggleWrap () {
		const { rootId, block } = this.props;
		const { id, fields } = block;

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, isUnwrapped: !fields.isUnwrapped } },
		]);
	};

	onCopy () {
		const { rootId, block } = this.props;

		C.BlockCopy(rootId, [ block ], { from: 0, to: 0 }, (message: any) => {
			UtilCommon.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: { from: 0, to: 0 },
					blocks: [ block ],
				},
			});

			Preview.toastShow({ text: translate('toastCopyBlock') });
		});
	};
	
	onSelect () {
		const { rootId, dataset, block, isPopup, isInsideTable } = this.props;
		const ids = UtilData.selectionGet('', false, true, this.props);

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
			const onChange = (marks: I.Mark[]) => {
				this.marks = marks;
				this.setMarks(marks);

				raf(() => {
					focus.set(block.id, { from: currentFrom, to: currentTo });
					focus.apply();
				});
			};

			if (menuStore.isOpen('blockContext')) {
				menuStore.updateData('blockContext', { 
					range: { from: currentFrom, to: currentTo },
					marks: this.marks,
					onChange,
				});
				return;
			};

			if (keyboard.isContextOpenDisabled) {
				return;
			};

			this.setText(this.marks, true, () => {
				menuStore.open('blockContext', {
					element: el,
					recalcRect: () => { 
						const rect = UtilCommon.getSelectionRect();
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
						rootId,
						dataset,
						range: { from: currentFrom, to: currentTo },
						marks: this.marks,
						isInsideTable,
						onChange,
					},
				});

				window.setTimeout(() => {
					const pageContainer = UtilCommon.getPageContainer(isPopup);

					pageContainer.off('mousedown.context').on('mousedown.context', () => { 
						pageContainer.off('mousedown.context');
						menuStore.close('blockContext'); 
					});
				}, Constant.delay.menu);
			});
		}, 150);
	};
	
	onMouseDown (e: any) {
		const { dataset, block } = this.props;
		const { selection } = dataset || {};

		window.clearTimeout(this.timeoutClick);

		this.clicks++;
		if (selection && (this.clicks == 3)) {
			e.preventDefault();
			e.stopPropagation();

			menuStore.closeAll([ 'blockContext' ], () => {
				this.clicks = 0;

				focus.set(block.id, { from: 0, to: block.getLength() });
				focus.apply();

				this.onSelect();
			});
		};
	};
	
	onMouseUp () {
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
		if (this.refEditable) {
			this.refEditable.placeholderCheck();
		};			
	};

	placeholderSet (v: string) {
		if (this.refEditable) {
			this.refEditable.placeholderSet(v);
		};
	};
	
	placeholderHide () {
		if (this.refEditable) {
			this.refEditable.placeholderHide();
		};
	};
	
	placeholderShow () {
		if (this.refEditable) {
			this.refEditable.placeholderShow();
		};
	};
	
});

export default BlockText;