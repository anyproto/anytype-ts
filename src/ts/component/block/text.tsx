import * as React from 'react';
import * as Prism from 'prismjs';
import $ from 'jquery';
import raf from 'raf';
import { observer, } from 'mobx-react';
import { Select, Marker, IconObject, Icon, Editable } from 'Component';
import { I, C, S, U, J, keyboard, Key, Preview, Mark, focus, Storage, translate, analytics, Action } from 'Lib';

interface Props extends I.BlockComponent {
	onToggle?(e: any): void;
};

for (const lang of U.Prism.components) {
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
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { id, fields, content } = block;
		const { text, marks, style, checked, color, iconEmoji, iconImage } = content;
		const { theme } = S.Common;
		const root = S.Block.getLeaf(rootId, rootId);
		const cn = [ 'flex' ];
		const cv = [ 'value', 'focusable', 'c' + id ];
		const checkRtl = keyboard.isRtl || U.Common.checkRtl(text);

		let marker: any = null;
		let markerIcon = null;
		let placeholder = translate('placeholderBlock');
		let additional = null;
		let spellcheck = true;

		if (color) {
			cv.push('textColor textColor-' + color);
		};

		if (checkRtl) {
			cn.push('isRtl');
		};

		// Subscriptions
		for (const mark of marks) {
			if ([ I.MarkType.Mention, I.MarkType.Object ].includes(mark.type)) {
				const object = S.Detail.get(rootId, mark.param, []);
			};
		};

		switch (style) {
			case I.TextStyle.Title: {
				placeholder = translate('defaultNamePage');

				if (root && U.Object.isTaskLayout(root.layout)) {
					markerIcon = (
						<IconObject 
							object={{ id: rootId, layout: root.layout, done: checked }} 
							size={30} 
							iconSize={30}
							canEdit={!readonly}
							onCheckbox={this.onCheckbox}
						/>
					);
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
				const options = U.Menu.codeLangOptions();

				spellcheck = false;
				
				additional = (
					<>
						<Select 
							id={'lang-' + id} 
							arrowClassName="light" 
							value={fields.lang || J.Constant.default.codeLang} 
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
					</>
				);
				break;
			};
				
			case I.TextStyle.Bulleted: {
				marker = { type: I.MarkerType.Bulleted, className: 'bullet' };
				break;
			};
				
			case I.TextStyle.Numbered: {
				marker = { type: I.MarkerType.Numbered, className: 'number' };
				break;
			};
				
			case I.TextStyle.Toggle: {
				marker = { type: I.MarkerType.Toggle, className: 'toggle', onClick: this.onToggle };
				break;
			};
				
			case I.TextStyle.Checkbox: {
				marker = { type: I.MarkerType.Checkbox, className: 'check', active: checked, onClick: this.onCheckbox };
				break;
			};
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
			>
				<div className="markers">
					{marker ? <Marker {...marker} id={id} color={color} readonly={readonly} /> : ''}
					{markerIcon}
				</div>

				{additional ? <div className="additional">{additional}</div> : ''}

				<Editable 
					ref={ref => this.refEditable = ref}
					id="value"
					classNameEditor={cv.join(' ')}
					classNamePlaceholder={'c' + id}
					readonly={readonly}
					spellcheck={spellcheck}
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
					onDragStart={e => e.preventDefault()}
					onCompositionEnd={this.onKeyUp}
				/>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		const { block } = this.props;
		const { content } = block;
		const { marks, text } = content;

		this.marks = U.Common.objectCopy(marks || []);
		this.setValue(text);
		this.renderLatex();
	};
	
	componentDidUpdate () {
		const { block, onUpdate } = this.props;
		const { content } = block;
		const { marks, text } = content;
		const { focused } = focus.state;

		this.marks = U.Common.objectCopy(marks || []);
		this.setValue(text);

		if (text) {
			this.placeholderHide();
		};

		if (focused == block.id) {
			focus.apply();
		} else {
			this.renderLatex();
		};

		if (onUpdate) {
			onUpdate();
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	setValue (v: string) {
		const { rootId, block, renderLinks, renderObjects, renderMentions, renderEmoji } = this.props;
		const fields = block.fields || {};
		
		let text = String(v || '');
		if (text === '\n') {
			text = '';
		};

		this.text = text;

		let html = text;
		if (block.isTextCode()) {
			const lang = U.Prism.aliasMap[fields.lang] || 'plain';fields.lang;
			const grammar = Prism.languages[lang] || {};

			html = Prism.highlight(html, grammar, lang);
			this.refLang?.setValue(lang);
		} else {
			const parsed = Mark.fromUnicode(html, this.marks);

			html = parsed.text;
			this.marks = parsed.marks;

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
				renderMentions(rootId, this.node, this.marks, () => this.getValue());
				renderObjects(rootId, this.node, this.marks, () => this.getValue(), this.props);
				renderLinks(this.node, this.marks, () => this.getValue(), this.props);
				renderEmoji(this.node);
			});
		};

		if (block.isTextTitle() || block.isTextDescription()) {
			this.placeholderCheck();
		};
	};
	
	renderLatex () {
		if (!this._isMounted) {
			return;
		};

		const { block } = this.props;
		const ref = this.refEditable;

		if (block.isTextCode() || !ref) {
			return;
		};

		const value = this.refEditable.getHtmlValue();
		const html = U.Common.getLatex(value);

		if (html !== value) {
			ref.setValue(html);
		};
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

		const { onKeyDown, rootId, block, isInsideTable, checkMarkOnBackspace } = this.props;
		const { id } = block;

		if (S.Menu.isOpenList([ 'blockStyle', 'blockColor', 'blockBackground', 'object' ])) {
			e.preventDefault();
			return;
		};

		const key = e.key.toLowerCase();
		const range = this.getRange();

		if (!range) {
			return;
		};

		let value = this.getValue();
		let ret = false;

		const symbolBefore = range ? value[range.from - 1] : '';
		const cmd = keyboard.cmdKey();

		const menuOpen = S.Menu.isOpen('', '', [ 'onboarding' ]);
		const menuOpenAdd = S.Menu.isOpen('blockAdd');
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const menuOpenSmile = S.Menu.isOpen('smile');
		const saveKeys: any[] = [
			{ key: 'moveSelectionUp', preventDefault: true },
			{ key: 'moveSelectionDown', preventDefault: true },
			{ key: 'relation' },
			{ key: 'duplicate', preventDefault: true },
			{ key: 'selectAll', preventDefault: true },
			{ key: 'back' },
			{ key: 'forward' },
			{ key: 'zoomIn' },
			{ key: 'zoomOut' },
			{ key: 'zoomReset' },
			{ key: 'turnBlock0' },
			{ key: 'turnBlock1' },
			{ key: 'turnBlock2' },
			{ key: 'turnBlock3' },
			{ key: 'turnBlock4' },
			{ key: 'turnBlock5' },
			{ key: 'turnBlock6' },
			{ key: 'turnBlock7' },
			{ key: 'turnBlock8' },
			{ key: 'turnBlock9' },
			{ key: 'undo', preventDefault: true },
			{ key: 'redo', preventDefault: true },
			{ key: 'menuAction' },
			{ key: 'indent', preventDefault: true },
			{ key: 'outdent', preventDefault: true },
			{ key: 'pageLock' },
			{ key: `${cmd}+shift+arrowleft` },
			{ key: `${cmd}+shift+arrowright` },
			{ key: `${cmd}+c`, preventDefault: true },
			{ key: `${cmd}+x`, preventDefault: true },
			{ key: `shift+space` },
			{ key: `shift+arrowleft` },
			{ key: `shift+arrowright` },
			{ key: `ctrl+shift+/` },
		];
		const twinePairs = {
			'{': '}',
			'(': ')',
			'`':'`',
			'\'':'\'',
			'\"':'\"',
			'【': '】',
			'「': '」',
			'（': '）',
			'“': '”',
			'‘': '’',
			'$': '$',
		};

		if (isInsideTable) {
			if (!range.to) {
				saveKeys.push({ key: `arrowleft, arrowup` });
			};

			if (range.to == value.length) {
				saveKeys.push({ key: `arrowright, arrowdown` });
			};
		};

		// Make div
		const newBlock: any = { 
			bgColor: block.bgColor,
			content: {},
		};

		keyboard.shortcut('enter, space', e, () => {
			if ([ '---', '—-', '***' ].includes(value)) {
				newBlock.type = I.BlockType.Div;
				newBlock.content.style = value == '***' ? I.DivStyle.Dot : I.DivStyle.Line;
			};
		});

		if (newBlock.type && (!isInsideTable && !block.isTextCode())) {
			C.BlockCreate(rootId, id, I.BlockPosition.Top, newBlock, () => {
				this.setValue('');
				
				focus.set(block.id, { from: 0, to: 0 });
				focus.apply();
			});
			return;
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
			if (block.isTextCallout() || block.isTextQuote()) {
				pd = true;
			};

			if (pd) {
				e.preventDefault();
			};
			
			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
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

				U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => { 
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			});
		});

		keyboard.shortcut('indent', e, () => {
			e.preventDefault();

			if (block.isTextCode()) {
				value = U.Common.stringInsert(value, '\t', range.from, range.from);

				U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
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
			if (range.to) {
				const parsed = checkMarkOnBackspace(value, range, this.marks);

				if (parsed.save) {
					e.preventDefault();

					value = parsed.value;
					this.marks = parsed.marks;
					U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
						onKeyDown(e, value, this.marks, range, this.props);
					});
					ret = true;
				};
			} else 
			if (!menuOpenAdd && !menuOpenMention && !range.to) {
				if (block.canHaveMarks()) {
					const { marks } = this.getMarksFromHtml();
					this.marks = marks;
				};

				U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			};

			if (menuOpenAdd && (symbolBefore == '/')) {
				S.Menu.close('blockAdd');
			};

			if (menuOpenMention && (symbolBefore == '@')) {
				S.Menu.close('blockMention');
			};
		});

		keyboard.shortcut('delete', e, () => {
			if ((range.from == range.to) && (range.to == value.length)) {
				U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
					onKeyDown(e, value, this.marks, range, this.props);
				});
				ret = true;
			};
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (menuOpenSmile || !block.canHaveMarks()) {
				return;
			};

			e.preventDefault();
			this.onSmile();
		});

		if (range && ((range.from != range.to) || block.isTextCode()) && Object.keys(twinePairs).includes(key)) {
			e.preventDefault();

			const length = key.length;
			const cut = value.slice(range.from, range.to);
			const closing = twinePairs[key] || key;

			value = U.Common.stringInsert(value, `${key}${cut}${closing}`, range.from, range.to);

			this.marks = Mark.adjust(this.marks, range.from, length + closing.length);

			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
				focus.set(block.id, { from: range.from + length, to: range.to + length });
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

			if (S.Menu.isOpen('selectPasteUrl')) {
				S.Menu.close('selectPasteUrl');
			};
		};

		onKeyDown(e, value, this.marks, range, this.props);
	};
	
	onKeyUp (e: any) {
		e.persist();

		const { rootId, block, onMenuAdd, isInsideTable, onKeyUp } = this.props;
		const { filter } = S.Common;
		const { id, content } = block;
		const range = this.getRange();
		const langCodes = Object.keys(Prism.languages).join('|');
		const langKey = '```(' + langCodes + ')?';

		const Markdown = {
			'[\\*\\-\\+]':	 I.TextStyle.Bulleted,
			'\\[\\]':		 I.TextStyle.Checkbox,
			'#':			 I.TextStyle.Header1,
			'##':			 I.TextStyle.Header2,
			'###':			 I.TextStyle.Header3,
			'"':			 I.TextStyle.Quote,
			'\\>':			 I.TextStyle.Toggle,
			'1\\.':			 I.TextStyle.Numbered,
		};
		Markdown[langKey] = I.TextStyle.Code;

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

		let value = this.getValue();
		let cmdParsed = false;
		let isAllowedMenu = !this.preventMenu && !keyboard.isSpecial(e) && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();

		const menuOpenAdd = S.Menu.isOpen('blockAdd');
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const menuOpenLink = S.Menu.isOpen('searchObject', 'link');
		const oneSymbolBefore = range ? value[range.from - 1] : '';
		const twoSymbolBefore = range ? value[range.from - 2] : '';
		const isRtl = U.Common.checkRtl(value);

		keyboard.setRtl(isRtl);

		if (isRtl) {
			U.Data.setRtl(rootId, block.id);
		};

		if (range) {
			isAllowedMenu = isAllowedMenu && (!range.from || (range.from == 1) || [ ' ', '\n', '(', '[', '"', '\'' ].includes(twoSymbolBefore));
		};

		const canOpenMenuAdd = !menuOpenAdd && (oneSymbolBefore == '/') && isAllowedMenu;
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@') && isAllowedMenu;
		const canOpenMenuLink = !menuOpenLink && (oneSymbolBefore == '[') && (twoSymbolBefore == '[') && isAllowedMenu;

		this.preventMenu = false;

		let parsed: any = {};
		let adjustMarks = false;

		if (block.canHaveMarks()) {
			parsed = this.getMarksFromHtml();
			adjustMarks = parsed.adjustMarks;
			this.marks = parsed.marks;
		};

		if (menuOpenAdd || menuOpenMention) {
			window.clearTimeout(this.timeoutFilter);
			this.timeoutFilter = window.setTimeout(() => {
				if (!range) {
					return;
				};

				const d = range.from - filter.from;

				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\//, '');
					S.Common.filterSetText(part);
				};
			}, 30);
			return;
		};

		// Open add menu
		if (canOpenMenuAdd && (!isInsideTable && !block.isTextCode())) { 
			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
				onMenuAdd(id, U.Common.stringCut(value, range.from - 1, range.from), range, this.marks);
			});
			return;
		};

		// Open mention menu
		if (canOpenMenuMention) {
			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => this.onMention());
			return;
		};

		// Open link menu
		if (canOpenMenuLink) {
			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => this.onLink());
			return;
		};

		// Parse markdown commands
		if (block.canHaveMarks() && (!isInsideTable && !block.isTextCode())) {
			for (const k in Markdown) {
				const newStyle = Markdown[k];

				if (newStyle == content.style) {
					continue;
				};

				if (block.isTextHeader() && (newStyle == I.TextStyle.Numbered)) {
					continue;
				};

				let space = '\\s';
				if (newStyle == I.TextStyle.Code) {
					space = '';
				};

				const reg = new RegExp(`^(${k}${space})`);
				const match = value.match(reg);

				if (!match) {
					continue;
				};

				// If emoji markup is first do not count one space character in mark adjustment
				const isFirstEmoji = Mark.getInRange(this.marks, I.MarkType.Emoji, { from: Length[newStyle], to: Length[newStyle] + 1 });
				if (isFirstEmoji) {
					continue;
				};

				value = value.replace(reg, (s: string, p: string) => s.replace(p, ''));

				this.marks = (newStyle == I.TextStyle.Code) ? [] : Mark.adjust(this.marks, 0, -(Length[newStyle] + 1));
				this.setValue(value);

				U.Data.blockSetText(rootId, id, value, this.marks, true, () => {
					C.BlockListTurnInto(rootId, [ id ], newStyle, () => {
						focus.set(block.id, { from: 0, to: 0 });
						focus.apply();
					});

					if (newStyle == I.TextStyle.Toggle) {
						S.Block.toggle(rootId, id, true);
					};

					if (newStyle == I.TextStyle.Code) {
						const lang = match[2] || Storage.get('codeLang') || J.Constant.default.codeLang;

						C.BlockListSetFields(rootId, [ 
							{ blockId: block.id, fields: { ...block.fields, lang } } 
						]);
					};
				});

				cmdParsed = true;
				break;
			};
		};
		
		if (cmdParsed) {
			S.Menu.close('blockAdd');
			return;
		};

		let ret = false;
		let diff = 0;

		keyboard.shortcut('backspace, delete', e, () => { 
			S.Menu.close('blockContext'); 
			ret = true;
		});

		keyboard.shortcut('alt+backspace', e, () => { 
			diff += this.text.length - value.length;
		});

		this.placeholderCheck();

		const text = block.canHaveMarks() ? parsed.text : value;

		// When typing space adjust several markups to break it
		keyboard.shortcut('space', e, () => {
			const d = text.length - this.text.length;

			if (d > 0) {
				for (let i = 0; i < this.marks.length; ++i) {
					const mark = this.marks[i];

					if (Mark.needsBreak(mark.type) && (mark.range.to == range.to)) {
						const adjusted = Mark.adjust([ mark ], mark.range.to - d, -d);

						this.marks[i] = adjusted[0];
						adjustMarks = true;
					};
				};
			};
		});

		if (!ret && (adjustMarks || (value != text))) {
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
		const range = this.getRange();

		if (!range) {
			return;
		};

		const { rootId, block } = this.props;
		const win = $(window);
		const element = $(`#block-${block.id}`);

		let value = this.getValue();
		value = U.Common.stringCut(value, range.from - 1, range.from);

		S.Common.filterSet(range.from - 1, '');

		raf(() => {
			S.Menu.open('blockMention', {
				element,
				recalcRect: () => {
					const rect = U.Common.getSelectionRect();
					return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
				},
				offsetX: () => {
					const rect = U.Common.getSelectionRect();
					return rect ? 0 : J.Size.blockMenu;
				},
				noFlipX: false,
				noFlipY: false,
				data: {
					rootId,
					blockId: block.id,
					marks: this.marks,
					skipIds: [ rootId ],
					canAdd: true,
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						value = U.Common.stringInsert(value, text, from, from);

						U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
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
		const { rootId, block } = this.props;
		const { iconEmoji, iconImage } = block.content;
		const win = $(window);
		const range = this.getRange();

		let value = this.getValue();

		S.Menu.open('smile', {
			element: `#block-${block.id}`,
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? 0 : J.Size.blockMenu;
			},
			data: {
				value: (iconEmoji || iconImage || ''),
				noHead: true,
				rootId,
				blockId: block.id,
				onSelect: (icon: string) => {
					const to = range.from + 1;

					this.marks = Mark.adjust(this.marks, range.from, 1);
					this.marks = Mark.toggle(this.marks, { 
						type: I.MarkType.Emoji, 
						param: icon, 
						range: { from: range.from, to },
					});

					value = U.Common.stringInsert(value, ' ', range.from, range.from);

					U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
						focus.set(block.id, { from: to, to });
						focus.apply();
					});
				},
			},
		});
	};

	onLink () {
		const { rootId, block } = this.props;
		const win = $(window);
		const range = this.getRange();

		if (!range) {
			return;
		};

		const from = range.from - 2;

		let value = this.getValue();
		value = U.Common.stringCut(value, from, range.from);

		const position = value.length ? I.BlockPosition.Bottom : I.BlockPosition.Replace;
		const cb = () => {
			U.Data.blockSetText(rootId, block.id, value, this.marks, true, () => {
				window.setTimeout(() => {
					focus.set(block.id, { from, to: from });
					focus.apply();
				}, 15);
			});
		};

		S.Menu.open('searchObject', {
			menuKey: 'link',
			element: `#block-${block.id}`,
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			offsetX: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? 0 : J.Size.blockMenu;
			},
			onClose: () => {
				focus.set(block.id, range);
				focus.apply();
			},
			data: {
				rootId,
				blockId: block.id,
				canAdd: true,
				type: I.NavigationType.Link,
				position,
				onBackspaceClose: () => cb(),
				onSelect: () => {
					if (position == I.BlockPosition.Bottom) {
						cb();
					};
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
		U.Data.blockSetText(rootId, block.id, value, marks, update, callBack);
	};
	
	onFocus (e: any) {
		const { onFocus, block } = this.props;

		e.persist();

		this.placeholderCheck();
		this.setValue(block.getText());

		keyboard.setFocus(true);

		if (onFocus) {
			onFocus(e);
		};
	};
	
	onBlur (e: any) {
		const { block, onBlur } = this.props;

		if (block.isTextTitle() || block.isTextDescription()) {
			this.placeholderCheck();
		} else {
			this.placeholderHide();
		};

		focus.clear(true);
		this.setText(this.marks, true);

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

		this.renderLatex();
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

		if (readonly) {
			return;
		};

		const { id, content } = block;
		const { checked } = content;
		
		focus.clear(true);
		C.BlockTextSetChecked(rootId, id, !checked);
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
		const length = block.getLength();

		C.BlockCopy(rootId, [ block ], { from: 0, to: length }, (message: any) => {
			U.Common.clipboardCopy({
				text: message.textSlot,
				html: message.htmlSlot,
				anytype: {
					range: { from: 0, to: length },
					blocks: [ block ],
				},
			});

			Preview.toastShow({ text: translate('toastCopyBlock') });
		});
	};
	
	onSelect () {
		if (keyboard.isContextDisabled || keyboard.isComposition) {
			return;
		};

		const { rootId, block, isPopup, isInsideTable, readonly } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.getForClick('', false, true);
		const range = this.getRange();
		const value = this.getValue();

		focus.set(block.id, range);

		if (readonly || S.Menu.isOpen('selectPasteUrl')) {
			return;
		};

		const currentFrom = focus.state.range.from;
		const currentTo = focus.state.range.to;
		const win = $(window);
		const el = $(`#block-${block.id}`);

		if (!currentTo || (currentFrom == currentTo) || !block.canHaveMarks() || ids.length) {
			if (S.Menu.isOpen('blockContext') && !keyboard.isContextCloseDisabled) {
				S.Menu.close('blockContext');
			};
			return;
		};

		keyboard.setFocus(true);
		window.clearTimeout(this.timeoutContext);
		S.Menu.closeAll([ 'blockAdd', 'blockMention' ]);

		this.timeoutContext = window.setTimeout(() => {
			const onChange = (marks: I.Mark[]) => {
				this.setValue(value);
				this.marks = marks;

				U.Data.blockSetText(rootId, block.id, this.getValue(), this.marks, true, () => {
					focus.set(block.id, { from: currentFrom, to: currentTo });
					focus.apply();
				});
			};

			if (S.Menu.isOpen('blockContext')) {
				S.Menu.updateData('blockContext', { 
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
				S.Menu.open('blockContext', {
					element: el,
					recalcRect: () => { 
						const rect = U.Common.getSelectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
					},
					type: I.MenuType.Horizontal,
					offsetY: 4,
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Center,
					passThrough: true,
					onClose: () => keyboard.disableContextClose(false),
					data: {
						blockId: block.id,
						blockIds: [ block.id ],
						rootId,
						range: { from: currentFrom, to: currentTo },
						marks: this.marks,
						isInsideTable,
						onChange,
					},
				});

				window.setTimeout(() => {
					const pageContainer = U.Common.getPageFlexContainer(isPopup);

					pageContainer.off('mousedown.context').on('mousedown.context', () => { 
						pageContainer.off('mousedown.context');
						S.Menu.close('blockContext'); 
					});
				}, S.Menu.getTimeout());
			});
		}, 150);
	};
	
	onMouseDown (e: any) {
		const { block } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		window.clearTimeout(this.timeoutClick);

		this.clicks++;
		if (selection && (this.clicks == 3)) {
			e.preventDefault();
			e.stopPropagation();

			S.Menu.closeAll([ 'blockContext' ], () => {
				this.clicks = 0;

				focus.set(block.id, { from: 0, to: block.getLength() });
				focus.apply();

				this.onSelect();
			});
		};
	};
	
	onMouseUp () {
		window.clearTimeout(this.timeoutClick);
		this.timeoutClick = window.setTimeout(() => this.clicks = 0, 300);
	};

	onSelectIcon (icon: string) {
		const { rootId, block } = this.props;
		
		C.BlockTextSetIcon(rootId, block.id, icon, '');
	};

	onUploadIcon (objectId: string) {
		const { rootId, block } = this.props;

		C.BlockTextSetIcon(rootId, block.id, '', objectId);
	};
	
	placeholderCheck () {
		if (this.refEditable && !this.props.readonly) {
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
	
});

export default BlockText;
