import React, { forwardRef, useRef, useEffect } from 'react';
import * as Prism from 'prismjs';
import $ from 'jquery';
import raf from 'raf';
import { trace } from 'mobx';
import { observer } from 'mobx-react';
import { Select, Marker, IconObject, Icon, Editable } from 'Component';
import { I, C, S, U, J, keyboard, Preview, Mark, focus, Storage, translate, analytics } from 'Lib';

interface Props extends I.BlockComponent {
	onToggle?(e: any): void;
};

for (const lang of U.Prism.components) {
	require(`prismjs/components/prism-${lang}.js`);
};

const TWIN_PAIRS = {
	'{': '}',
	'(': ')',
	'[': ']',
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

const BlockText = observer(forwardRef<I.BlockRef, Props>((props, ref) => {

	const {
		rootId, block, readonly, isPopup, isInsideTable,
		onUpdate, onMenuAdd, onToggle, onFocus, onBlur, onPaste, onKeyDown, onKeyUp,
		renderLinks, renderObjects, renderMentions, renderEmoji,
	} = props;
	const { id, content } = block;
	const fields = block.fields || {};
	const { text, marks, style, checked, color, iconEmoji, iconImage } = content;
	const { theme } = S.Common;
	const { focused } = focus.state;
	const root = S.Block.getLeaf(rootId, rootId);
	const cn = [ 'flex' ];
	const cv = [ 'value', 'focusable', `c${id}` ];
	const checkRtl = U.String.checkRtl(text) || fields.isRtlDetected;
	const nodeRef = useRef(null);
	const langRef = useRef(null);
	const editableRef = useRef(null);
	const textRef = useRef('');
	const marksRef = useRef<I.Mark[]>(marks || []);
	const prevTextRef = useRef(text);
	const prevMarksRef = useRef<I.Mark[]>(marks || []);
	const timeoutFilter = useRef(0);
	const timeoutClick = useRef(0);
	const preventMenu = useRef(false);
	const clickCnt = useRef(0);

	useEffect(() => {
		setValue(text);
		renderLatex();

		return () => {
			S.Common.clearTimeout('blockContext');
			window.clearTimeout(timeoutFilter.current);
			window.clearTimeout(timeoutClick.current);

			if (focused == block.id) {
				focus.clear(true);
			};
		};
	}, []);

	useEffect(() => {
		const textChanged = prevTextRef.current !== text;
		const marksChanged = !U.Common.compareJSON(prevMarksRef.current, marks || []);

		if (textChanged || marksChanged) {
			marksRef.current = marks || [];
			setValue(text);

			prevTextRef.current = text;
			prevMarksRef.current = marks || [];
		} else
		if (marksRef.current.length) {
			// Render markup even when text/marks haven't changed, to pick up
			// newly loaded details for mentions/objects
			renderMarkup();
		};

		setValue(text);

		if (text) {
			placeholderHide();
		};

		if (focused == block.id) {
			focus.apply();
		} else {
			renderLatex();
		};

		onUpdate?.();
	});

	const setValue = (v: string, restoreRange?: I.TextRange) => {
		let text = String(v || '');
		if (text == '\n') {
			text = '';
		};

		textRef.current = text;
		let html = text;

		if (block.isTextCode()) {
			const lang = U.Prism.aliasMap[fields.lang] || 'plain';
			const grammar = Prism.languages[lang] || {};

			html = Prism.highlight(html, grammar, lang);
			langRef.current?.setValue(lang);
		} else {
			if (!keyboard.isComposition) {
				const parsed = Mark.fromUnicode(html, marksRef.current, false);

				html = parsed.text;
				marksRef.current = parsed.marks;
			};

			html = Mark.toHtml(html, marksRef.current);
		};

		html = html.replace(/\n/g, '<br/>');

		// Add extra <br/> at end for code blocks to ensure trailing newlines are visible
		// (contenteditable collapses a single trailing <br/>)
		// Only add when focused to avoid extra line when blurred
		if (block.isTextCode() && text.endsWith('\n') && (focused == block.id)) {
			html += '<br/>';
		};

		editableRef.current?.setValue(html);

		// Restore cursor position if provided
		if (restoreRange) {
			editableRef.current?.setRange(restoreRange);
		};

		if (!block.isTextCode() && (html != text) && marksRef.current.length) {
			renderMarkup();
		};

		if (block.isTextTitle() || block.isTextDescription()) {
			placeholderCheck();
		};
	};

	const renderMarkup = () => {
		renderMentions(rootId, nodeRef.current, marksRef.current, () => text);
		renderObjects(rootId, nodeRef.current, marksRef.current, () => text, props);
		renderLinks(rootId, nodeRef.current, marksRef.current, () => text, props);
		renderEmoji(nodeRef.current);
	};
	
	const renderLatex = () => {
		if (block.isTextCode() || block.isTextTitle()) {
			return;
		};

		const value = getHtmlValue();

		// Skip if already contains rendered LaTeX to prevent double-processing
		if (value.includes('<markuplatex')) {
			return;
		};

		const html = U.Common.getLatex(value);

		if (html !== value) {
			editableRef.current.setValue(html);
			renderMarkup();
		};
	};

	const getTextValue = (): string => {
		return String(editableRef.current?.getTextValue() || '');
	};

	const getHtmlValue = (): string => {
		return String(editableRef.current?.getHtmlValue() || '');
	};

	const getRange = (): I.TextRange => {
		return editableRef.current?.getRange();
	};
	
	const getMarksFromHtml = (): { marks: I.Mark[], text: string } => {
		const value = getHtmlValue();
		const restricted: I.MarkType[] = block.isTextHeader() ? [ I.MarkType.Bold ] : [];
		
		return Mark.fromHtml(value, restricted);
	};

	const onInput = () => {
		onUpdate?.();
	};
	
	const onKeyDownHandler = (e: any) => {
		e.persist();

		if (S.Menu.isOpenList([ 'blockStyle', 'blockColor', 'blockBackground', 'object' ])) {
			e.preventDefault();
			return;
		};

		const key = e.key.toLowerCase();
		const range = getRange();

		if (!range) {
			return;
		};

		let value = getTextValue();
		let ret = false;

		const oneSymbolBefore = range ? value[range.from - 1] : '';
		const cmd = keyboard.cmdKey();

		const menuOpen = S.Menu.isOpen('', '', [ 'onboarding', 'searchText' ]);
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
			{ key: 'menuAction' },
			{ key: 'indent', preventDefault: true },
			{ key: 'outdent', preventDefault: true },
			{ key: 'pageLock' },
			{ key: `${cmd}+shift+arrowleft` },
			{ key: `${cmd}+shift+arrowright` },
			{ key: `${cmd}+v` },
			{ key: `${cmd}+c`, preventDefault: true },
			{ key: `${cmd}+x`, preventDefault: true },
			{ key: `shift+space` },
			{ key: `shift+arrowleft` },
			{ key: `shift+arrowright` },
			{ key: `ctrl+shift+/` },
			{ key: 'theme' },
		];

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
				setValue('');
				
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

			// Handle enter manually in the code blocks to keep caret and new lines in sync
			if (block.isTextCode() && (pressed == 'enter')) {
				e.preventDefault();

				const insert = '\n';
				const caret = range.from + insert.length;
				const newValue = U.String.insert(value, insert, range.from, range.to);
				const caretRange = { from: caret, to: caret };

				// Set focus range before blockSetText to avoid race condition with useEffect
				focus.set(block.id, caretRange);

				U.Data.blockSetText(rootId, block.id, newValue, marksRef.current, true, () => {
					focus.apply();
					onKeyDown(e, newValue, marksRef.current, caretRange, props);
				});

				ret = true;
				return;
			};

			let pd = true;
			if (block.isText() && !block.isTextCode() && pressed.match('shift')) {
				pd = false;
			};
			if (block.isTextCallout() || block.isTextQuote()) {
				pd = true;
			};

			if (pd) {
				e.preventDefault();
			};
			
			U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
				onKeyDown(e, value, marksRef.current, range, props);
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

				U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => { 
					onKeyDown(e, value, marksRef.current, range, props);
				});
				ret = true;
			});
		});

		keyboard.shortcut('indent', e, () => {
			e.preventDefault();

			if (block.isTextCode()) {
				value = U.String.insert(value, '\t', range.from, range.from);

				U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
					focus.set(block.id, { from: range.from + 1, to: range.from + 1 });
					focus.apply();
				});
			} else {
				setText(marksRef.current, true, () => {
					focus.apply();
					onKeyDown(e, value, marksRef.current, range, props);
				});
			};

			ret = true;
		});

		keyboard.shortcut('backspace', e, () => {
			if (range.to) {
				const parsed = Mark.checkMarkOnBackspace(value, range, marksRef.current);

				if (parsed.save) {
					e.preventDefault();

					value = parsed.text;
					marksRef.current = parsed.marks;

					U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
						focus.set(block.id, parsed.range);
						focus.apply();

						onKeyDown(e, value, marksRef.current, range, props);
					});
					ret = true;
				};
			} else 
			if (!menuOpenAdd && !menuOpenMention && !range.to) {
				if (block.canHaveMarks()) {
					const parsed = getMarksFromHtml();

					marksRef.current = parsed.marks;
				};

				U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
					onKeyDown(e, value, marksRef.current, range, props);
				});
				ret = true;
			};

			if (menuOpenAdd && (oneSymbolBefore == '/')) {
				S.Menu.close('blockAdd');
			};

			if (menuOpenMention && ((oneSymbolBefore == '@') || (oneSymbolBefore == '['))) {
				S.Menu.close('blockMention');
			};
		});

		keyboard.shortcut('delete', e, () => {
			if ((range.from == range.to) && (range.to == value.length)) {
				U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
					onKeyDown(e, value, marksRef.current, range, props);
				});
				ret = true;
			};
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (menuOpenSmile || !block.canHaveMarks()) {
				return;
			};

			e.preventDefault();
			onSmile();
		});

		if (
			range && 
			(
				(range.from != range.to) || 
				block.isTextCode()
			) && 
			Object.keys(TWIN_PAIRS).includes(key)
		) {
			const count = value.split(key).length - 1;
			const skipTwinPairs = [ '$' ].includes(key) && block.isTextCode();

			if ((count % 2 === 0) && !skipTwinPairs) {
				e.preventDefault();

				let length = 0;

				if ((key == '`') && !block.isTextCode()) {
					marksRef.current.push({ type: I.MarkType.Code, range: { from: range.from, to: range.to } });
				} else {
					length = key.length;

					const cut = value.slice(range.from, range.to);
					const closing = TWIN_PAIRS[key] || key;

					value = U.String.insert(value, `${key}${cut}${closing}`, range.from, range.to);
					marksRef.current = Mark.adjust(marksRef.current, range.from - length, closing.length);
				};

				setValue(value);

				focus.set(block.id, { from: range.from + length, to: range.to + length });
				focus.apply();

				ret = true;
			};
		};

		if (ret) {
			return;
		};

		focus.set(id, range);

		if (!keyboard.isSpecial(e)) {
			placeholderHide();

			if (S.Menu.isOpen('selectPasteUrl')) {
				S.Menu.close('selectPasteUrl');
			};
		};

		onKeyDown(e, value, marksRef.current, range, props);
	};
	
	const onKeyUpHandler = (e: any) => {
		e.persist();

		const { filter } = S.Common;
		const range = getRange();
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

		let value = getTextValue();
		let cmdParsed = false;
		let isAllowedMenu = !preventMenu.current && !keyboard.isSpecial(e) && !block.isTextCode() && !block.isTextTitle() && !block.isTextDescription();

		const menuOpenAdd = S.Menu.isOpen('blockAdd');
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const oneSymbolBefore = range ? value[range.from - 1] : '';
		const twoSymbolBefore = range ? value[range.from - 2] : '';

		if (range) {
			isAllowedMenu = isAllowedMenu && (!range.from || (range.from == 1) || [ ' ', '\n', '(', '[', '"', '\'' ].includes(twoSymbolBefore));
		};

		const canOpenMenuAdd = !menuOpenAdd && (oneSymbolBefore == '/') && isAllowedMenu;
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@') && isAllowedMenu;
		const canOpenMenuLink = !menuOpenMention && (oneSymbolBefore == '[') && (twoSymbolBefore == '[') && isAllowedMenu;

		preventMenu.current = false;

		let parsed: any = {};
		let adjustMarks = false;

		if (block.canHaveMarks()) {
			parsed = getMarksFromHtml();
			adjustMarks = parsed.adjustMarks;
			marksRef.current = parsed.marks;
		};

		if (menuOpenAdd || menuOpenMention) {
			window.clearTimeout(timeoutFilter.current);
			timeoutFilter.current = window.setTimeout(() => {
				if (!range) {
					return;
				};

				const d = range.from - filter.from;

				if (d >= 0) {
					// Get text from filter.from to cursor
					let part = value.substring(filter.from, filter.from + d);

					// Also include the word after cursor (for when @ is typed before existing text)
					const textAfterCursor = value.substring(filter.from + d);
					const wordMatch = textAfterCursor.match(/^([^\s\n]*)/);
					if (wordMatch) {
						part += wordMatch[1];
					};

					part = part.replace(/^\//, '');
					S.Common.filterSetText(part);
				};
			}, 30);
			return;
		};

		// Open add menu
		if (canOpenMenuAdd && (!isInsideTable && !block.isTextCode())) { 
			U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
				onMenuAdd(id, U.String.cut(value, range.from - 1, range.from), range, marksRef.current);
			});
			return;
		};

		// Open mention menu
		if (canOpenMenuMention) {
			U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => onMention(1));
			return;
		};

		// Open link menu
		if (canOpenMenuLink) {
			U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => onMention(2));
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

				const reg = new RegExp(`^(${k}\\s)`);
				const match = value.match(reg);

				if (!match) {
					continue;
				};

				// If emoji markup is first do not count one space character in mark adjustment
				const isFirstEmoji = Mark.getInRange(marksRef.current, I.MarkType.Emoji, { from: Length[newStyle], to: Length[newStyle] + 1 });
				if (isFirstEmoji) {
					continue;
				};

				value = value.replace(reg, (s: string, p: string) => s.replace(p, ''));

				marksRef.current = (newStyle == I.TextStyle.Code) ? [] : Mark.adjust(marksRef.current, 0, -(Length[newStyle] + 1));
				setValue(value);

				U.Data.blockSetText(rootId, id, value, marksRef.current, true, () => {
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
			diff += textRef.current.length - value.length;
		});

		placeholderCheck();

		const text = block.canHaveMarks() ? parsed.text : value;

		// When typing space adjust several markups to break it
		keyboard.shortcut('space', e, () => {
			const d = text.length - textRef.current.length;

			if (d > 0) {
				for (let i = 0; i < marksRef.current.length; ++i) {
					const mark = marksRef.current[i];

					if (Mark.needsBreak(mark.type) && (mark.range.to == range.to)) {
						const adjusted = Mark.adjust([ mark ], mark.range.to - d, -d);

						marksRef.current[i] = adjusted[0];
						adjustMarks = true;
					};
				};
			};
		});

		if (!ret && (adjustMarks || (value != text))) {
			setValue(text);

			const { focused, range } = focus.state;

			diff += value.length - text.length;

			focus.set(focused, { from: range.from - diff, to: range.to - diff });
			focus.apply();
		};

		setText(marksRef.current, false);
		onKeyUp(e, value, marksRef.current, range, props);

		if (!keyboard.isSpecial(e) && !keyboard.withCommand(e)) {
			focus.scroll(isPopup, id);
		};
	};

	const onMention = (d: number) => {
		const range = getRange();
		if (!range) {
			return;
		};

		const win = $(window);
		const element = $(`#block-${block.id}`);

		let value = getTextValue();

		// Extract the word after the cursor to use as initial filter (for when @ is typed before existing text)
		const textAfterCursor = value.substring(range.from);
		const wordMatch = textAfterCursor.match(/^([^\s\n]*)/);
		const nextWord = wordMatch ? wordMatch[1] : '';

		value = U.String.cut(value, range.from - d, range.from);

		S.Common.filterSet(range.from - d, nextWord);

		raf(() => {
			S.Menu.open('blockMention', {
				classNameWrap: 'fromBlock',
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
					marks: marksRef.current,
					skipIds: [ rootId ],
					canAdd: true,
					withCaption: true,
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						if (S.Menu.isAnimating('blockMention')) {
							return;
						};

						value = U.String.insert(value, text, from, from);

						U.Data.blockSetText(rootId, block.id, value, marks, true, () => {
							// Try to fix async detailsUpdate event
							focus.setWithTimeout(block.id, { from: to, to }, 500);
						});
					},
				},
			});
		});
	};

	const onSmile = () => {
		const win = $(window);
		const range = getRange();

		let value = getTextValue();

		S.Menu.open('smile', {
			element: `#block-${block.id}`,
			classNameWrap: 'fromBlock',
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

					marksRef.current = Mark.adjust(marksRef.current, range.from, 1);
					marksRef.current = Mark.toggle(marksRef.current, { 
						type: I.MarkType.Emoji, 
						param: icon, 
						range: { from: range.from, to },
					});

					value = U.String.insert(value, ' ', range.from, range.from);

					U.Data.blockSetText(rootId, block.id, value, marksRef.current, true, () => {
						focus.setWithTimeout(block.id, { from: to, to }, 30);
					});
				},
				route: analytics.route.editor,
			},
		});
	};

	const setText = (marks: I.Mark[], update: boolean, callBack?: () => void) => {
		const value = getTextValue();

		if (content.style == I.TextStyle.Code) {
			marks = [];
		};

		if ((textRef.current === value) && !update) {
			callBack?.();
			return;
		};

		textRef.current = value;

		const isRtl = U.String.checkRtl(value);
		const cb = () => {
			U.Data.blockSetText(rootId, block.id, value, marks, update, callBack);
		};

		if (isRtl != checkRtl) {
			U.Data.setRtl(rootId, block, isRtl, cb);
		} else {
			cb();
		};
	};
	
	const onFocusHandler = (e: any) => {
		e.persist();

		placeholderCheck();
		keyboard.setFocus(true);
		onFocus?.(e);

		// Calculate correct caret position accounting for rendered LaTeX elements
		window.setTimeout(() => {
			const selection = window.getSelection();

			let range = getRange();

			if (selection && selection.rangeCount > 0) {
				const selRange = selection.getRangeAt(0);
				const editable = editableRef.current?.getNode()?.find('.editable').get(0);

				if (editable && editable.contains(selRange.startContainer)) {
					const from = U.Common.getSelectionOffsetWithLatex(editable, selRange.startContainer, selRange.startOffset);
					const to = selRange.collapsed ? from : U.Common.getSelectionOffsetWithLatex(editable, selRange.endContainer, selRange.endOffset);

					range = { from, to };
				};
			};

			// Only restore source text if there's rendered LaTeX that needs converting back for editing
			const html = getHtmlValue();
			if (html.includes('<markuplatex')) {
				const currentBlock = S.Block.getLeaf(rootId, id);
				if (currentBlock) {
					setValue(currentBlock.getText());
				};
			};

			focus.set(block.id, range);
			focus.apply();
		}, 0);
	};
	
	const onBlurHandler = (e: any) => {
		if (block.isTextTitle() || block.isTextDescription()) {
			placeholderCheck();
		} else {
			placeholderHide();
		};

		setText(marksRef.current, true);
		focus.clear(true);
		onBlur?.(e);

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

		renderLatex();
	};
	
	const onPasteHandler = (e: any) => {
		e.persist();
		e.preventDefault();

		preventMenu.current = true;
		setText(marksRef.current, true);
		onPaste(e, props);
	};
	
	const onCheckbox = () => {
		if (readonly) {
			return;
		};

		focus.clear(true);
		C.BlockTextSetChecked(rootId, id, !checked);
	};
	
	const onLang = (v: string) => {
		if (readonly) {
			return;
		};

		const length = block.getLength();

		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, lang: v } },
		], () => {
			Storage.set('codeLang', v);
			focus.setWithTimeout(block.id, { from: length, to: length }, 30);
		});
	};

	const onToggleWrap = () => {
		C.BlockListSetFields(rootId, [
			{ blockId: id, fields: { ...fields, isUnwrapped: !fields.isUnwrapped } },
		]);
	};

	const onCopy = () => {
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
	
	const onSelect = () => {
		if (keyboard.isContextDisabled || keyboard.isComposition) {
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const ids = selection?.getForClick('', false, true);
		const range = getRange();
		const value = getTextValue();

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
		S.Menu.closeAll([ 'blockAdd', 'blockMention' ]);

		S.Common.setTimeout('blockContext', 150, () => {
			const onChange = (marks: I.Mark[]) => {
				setValue(value);
				marksRef.current = marks;

				U.Data.blockSetText(rootId, block.id, getTextValue(), marksRef.current, true, () => {
					focus.set(block.id, { from: currentFrom, to: currentTo });
					focus.apply();
				});
			};

			if (S.Menu.isOpen('blockContext')) {
				S.Menu.updateData('blockContext', { 
					range: { from: currentFrom, to: currentTo },
					marks: marksRef.current,
					onChange,
				});
				return;
			};

			if (keyboard.isContextOpenDisabled) {
				return;
			};

			setText(marksRef.current, true, () => {
				S.Menu.open('blockContext', {
					classNameWrap: 'fromBlock',
					element: el,
					recalcRect: () => { 
						const rect = U.Common.getSelectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
					},
					type: I.MenuType.Horizontal,
					offsetY: -8,
					horizontal: I.MenuDirection.Center,
					vertical: I.MenuDirection.Top,
					passThrough: true,
					onClose: () => keyboard.disableContextClose(false),
					data: {
						blockId: block.id,
						blockIds: [ block.id ],
						rootId,
						range: { from: currentFrom, to: currentTo },
						marks: marksRef.current,
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
		});
	};
	
	const onMouseDown = (e: any) => {
		window.clearTimeout(timeoutClick.current);

		clickCnt.current++;
		if (clickCnt.current == 3) {
			e.preventDefault();
			e.stopPropagation();

			S.Menu.closeAll([ 'blockContext' ], () => {
				clickCnt.current = 0;

				focus.set(block.id, { from: 0, to: block.getLength() });
				focus.apply();
			});
		};
	};
	
	const onMouseUp = () => {
		window.clearTimeout(timeoutClick.current);
		timeoutClick.current = window.setTimeout(() => clickCnt.current = 0, 300);
	};

	const onSelectIcon = (icon: string) => {
		C.BlockTextSetIcon(rootId, block.id, icon, '');
		Storage.set('calloutIcon', icon);
	};

	const onUploadIcon = (objectId: string) => {
		C.BlockTextSetIcon(rootId, block.id, '', objectId);
	};
	
	const placeholderCheck = () => {
		if (!readonly) {
			editableRef.current?.placeholderCheck();
		};
	};

	const placeholderHide = () => {
		editableRef.current?.placeholderHide();
	};

	const onCompositionEnd = (e: any, value: string, range: I.TextRange) => {
		// Use provided value and range if available, fallback to current
		const v = value !== undefined ? value : getTextValue();
		const r = range !== undefined ? range : getRange();
		
		// Populate marks before setValue to prevent formatting issue
		marksRef.current = getMarksFromHtml().marks;
		setValue(v, r);
	};

	const onBeforeInput = (e: any) => {
		if (block.isTextCode()) {
			return;
		};

		const range = getRange();

		let html = getHtmlValue();

		if (!/<(font|span)/.test(html)) {
			return;
		};

		raf(() => {
			html = html.replace(/<\/?font[^>]*>/g, '');
			html = html.replace(/<span[^>]*>(.*?)<\/span>/g, '$1');

			editableRef.current?.setValue(html);
			editableRef.current?.setRange(range);
		});
	};

	let marker: any = null;
	let markerIcon = null;
	let placeholder = translate('placeholderBlock');
	let additional = null;
	let spellcheck = true;

	if (color) {
		cv.push(`textColor textColor-${color}`);
	};

	if (checkRtl) {
		cn.push('isRtl');
	};

	// Subscriptions
	for (const mark of marks) {
		if ([ I.MarkType.Mention ].includes(mark.type)) {
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
						onCheckbox={onCheckbox}
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
					onSelect={onSelectIcon} 
					onUpload={onUploadIcon}
					noRemove={true}
				/>
			);
			break;
		};
			
		case I.TextStyle.Code: {
			spellcheck = false;
			
			additional = (
				<>
					<Select 
						id={`lang-${id}`} 
						arrowClassName="light" 
						value={fields.lang || J.Constant.default.codeLang} 
						ref={langRef}
						options={U.Menu.codeLangOptions()} 
						onChange={onLang}
						noFilter={false} 
						readonly={readonly}
					/>

					<div className="buttons">
						<div className="btn" onClick={onToggleWrap}>
							<Icon className="codeWrap" />
							<div className="txt">{fields.isUnwrapped ? translate('blockTextWrap') : translate('blockTextUnwrap')}</div>
						</div>

						<div className="btn" onClick={onCopy}>
							<Icon className="copy" />
							<div className="txt">{translate('commonCopy')}</div>
						</div>
					</div>
				</>
			);
			break;
		};
			
		case I.TextStyle.Bulleted: {
			marker = { type: I.MarkerType.Bulleted };
			break;
		};
			
		case I.TextStyle.Numbered: {
			marker = { type: I.MarkerType.Numbered };
			break;
		};
			
		case I.TextStyle.Toggle: {
			marker = { type: I.MarkerType.Toggle, onClick: onToggle };
			break;
		};

		case I.TextStyle.Checkbox: {
			marker = { type: I.MarkerType.Checkbox, active: checked, onClick: onCheckbox };
			break;
		};

	};

	return (
		<div 
			ref={nodeRef}
			className={cn.join(' ')}
		>
			<div className="markers">
				{marker ? <Marker {...marker} id={id} color={color} readonly={readonly} /> : ''}
				{markerIcon}
			</div>

			{additional ? <div className="additional">{additional}</div> : ''}

			<Editable 
				ref={editableRef}
				id="value"
				classNameEditor={cv.join(' ')}
				classNamePlaceholder={`c${id}`}
				readonly={readonly}
				spellcheck={spellcheck}
				placeholder={placeholder}
				onKeyDown={onKeyDownHandler}
				onKeyUp={onKeyUpHandler}
				onFocus={onFocusHandler}
				onBlur={onBlurHandler}
				onSelect={onSelect}
				onPaste={onPasteHandler}
				onMouseDown={onMouseDown}
				onMouseUp={onMouseUp}
				onInput={onInput}
				onDragStart={e => e.preventDefault()}
				onCompositionEnd={onCompositionEnd}
				onBeforeInput={onBeforeInput}
			/>
		</div>
	);

}));

export default BlockText;