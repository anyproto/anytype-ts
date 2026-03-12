import React, { forwardRef, useRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode, registerCodeHighlighting, PrismTokenizer } from '@lexical/code';
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import { $isListNode, $isListItemNode, $createListNode, $createListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND } from '@lexical/list';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	$createParagraphNode,
	$createTextNode,
	$isElementNode,
	$isTextNode,
	FORMAT_TEXT_COMMAND,
	FOCUS_COMMAND,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	createCommand,
	EditorState,
	LexicalEditor,
	LexicalNode,
	TextFormatType,
	ElementNode,
	DecoratorNode,
	TextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import $ from 'jquery';
import { I, J, S, U, keyboard } from 'Lib';

// Custom HorizontalRuleNode since @lexical/react/HorizontalRuleNode may not be available
class HorizontalRuleNode extends DecoratorNode<JSX.Element> {

	static getType (): string {
		return 'horizontalrule';
	};

	static clone (node: HorizontalRuleNode): HorizontalRuleNode {
		return new HorizontalRuleNode(node.__key);
	};

	createDOM (): HTMLElement {
		const el = document.createElement('div');
		el.className = 'commentEditor-divider';
		return el;
	};

	updateDOM (): boolean {
		return false;
	};

	decorate (): JSX.Element {
		return <hr className="commentEditor-hr" />;
	};

	isIsolated (): boolean {
		return true;
	};

	exportJSON () {
		return {
			type: 'horizontalrule',
			version: 1,
		};
	};

	static importJSON (): HorizontalRuleNode {
		return new HorizontalRuleNode();
	};

};

export const INSERT_HORIZONTAL_RULE_COMMAND = createCommand<void>('INSERT_HORIZONTAL_RULE_COMMAND');

class MentionNode extends TextNode {

	__mentionId: string;

	static getType (): string {
		return 'mention';
	};

	static clone (node: MentionNode): MentionNode {
		return new MentionNode(node.__mentionId, node.__text, node.__key);
	};

	constructor (mentionId: string, text: string, key?: string) {
		super(text, key);
		this.__mentionId = mentionId;
	};

	createDOM (config: any): HTMLElement {
		const el = super.createDOM(config);
		el.className = 'commentEditor-mention';
		return el;
	};

	updateDOM (prevNode: MentionNode, dom: HTMLElement, config: any): boolean {
		return false;
	};

	isToken (): boolean {
		return true;
	};

	exportJSON () {
		return {
			...super.exportJSON(),
			type: 'mention',
			mentionId: this.__mentionId,
		};
	};

	static importJSON (json: any): MentionNode {
		return new MentionNode(json.mentionId, json.text);
	};

	getMentionId (): string {
		return this.__mentionId;
	};

};

function $createMentionNode (mentionId: string, text: string): MentionNode {
	return new MentionNode(mentionId, text).setMode('token');
};

function $isMentionNode (node: LexicalNode | null | undefined): node is MentionNode {
	return node instanceof MentionNode;
};

interface Props {
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[]) => void;
	onCancel?: () => void;
	onEmpty?: (isEmpty: boolean) => void;
	onChange?: () => void;
	onFocus?: () => void;
	onBlur?: () => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
	getParts: () => I.CommentContentPart[];
	setParts: (parts: I.CommentContentPart[]) => void;
	isEmpty: () => boolean;
	getEditor: () => LexicalEditor | null;
	getLineCount: () => number;
	insertBlock: (style: I.TextStyle) => void;
	insertDivider: () => void;
	insertText: (text: string) => void;
	insertMention: (id: string, name: string) => void;
	toggleFormat: (format: TextFormatType) => void;
	setBlockStyle: (style: I.TextStyle) => void;
	getCurrentBlockStyle: () => I.TextStyle;
};

const theme = {
	paragraph: 'commentEditor-paragraph',
	heading: {
		h1: 'commentEditor-h1',
		h2: 'commentEditor-h2',
		h3: 'commentEditor-h3',
	},
	quote: 'commentEditor-quote',
	code: 'commentEditor-codeBlock',
	codeHighlight: {
		atrule: 'codeToken-atrule',
		attr: 'codeToken-attr',
		boolean: 'codeToken-boolean',
		builtin: 'codeToken-builtin',
		cdata: 'codeToken-cdata',
		char: 'codeToken-char',
		class: 'codeToken-class',
		'class-name': 'codeToken-class',
		comment: 'codeToken-comment',
		constant: 'codeToken-constant',
		deleted: 'codeToken-deleted',
		doctype: 'codeToken-doctype',
		entity: 'codeToken-entity',
		function: 'codeToken-function',
		important: 'codeToken-important',
		inserted: 'codeToken-inserted',
		keyword: 'codeToken-keyword',
		namespace: 'codeToken-namespace',
		number: 'codeToken-number',
		operator: 'codeToken-operator',
		prolog: 'codeToken-prolog',
		property: 'codeToken-property',
		punctuation: 'codeToken-punctuation',
		regex: 'codeToken-regex',
		selector: 'codeToken-selector',
		string: 'codeToken-string',
		symbol: 'codeToken-symbol',
		tag: 'codeToken-tag',
		url: 'codeToken-url',
		variable: 'codeToken-variable',
	},
	list: {
		ul: 'commentEditor-ul',
		ol: 'commentEditor-ol',
		listitem: 'commentEditor-li',
		listitemChecked: 'commentEditor-li-checked',
		listitemUnchecked: 'commentEditor-li-unchecked',
		nested: {
			listitem: 'commentEditor-li-nested',
		},
	},
	text: {
		bold: 'commentEditor-bold',
		italic: 'commentEditor-italic',
		underline: 'commentEditor-underline',
		strikethrough: 'commentEditor-strikethrough',
		code: 'commentEditor-code',
	},
};

/**
 * Maps a Lexical heading tag to I.TextStyle
 */
const headingTagToStyle = (tag: string): I.TextStyle => {
	switch (tag) {
		case 'h1': return I.TextStyle.Header1;
		case 'h2': return I.TextStyle.Header2;
		case 'h3': return I.TextStyle.Header3;
		default: return I.TextStyle.Paragraph;
	};
};

/**
 * Maps I.TextStyle to Lexical heading tag
 */
const styleToHeadingTag = (style: I.TextStyle): string => {
	switch (style) {
		case I.TextStyle.Header1: return 'h1';
		case I.TextStyle.Header2: return 'h2';
		case I.TextStyle.Header3: return 'h3';
		default: return '';
	};
};

/**
 * Extract marks from a Lexical TextNode
 */
const extractMarks = (child: TextNode, start: number, end: number): I.Mark[] => {
	const marks: I.Mark[] = [];
	const range = { from: start, to: end };

	if (child.hasFormat('bold')) {
		marks.push({ type: I.MarkType.Bold, range: { ...range }, param: '' });
	};
	if (child.hasFormat('italic')) {
		marks.push({ type: I.MarkType.Italic, range: { ...range }, param: '' });
	};
	if (child.hasFormat('strikethrough')) {
		marks.push({ type: I.MarkType.Strike, range: { ...range }, param: '' });
	};
	if (child.hasFormat('underline')) {
		marks.push({ type: I.MarkType.Underline, range: { ...range }, param: '' });
	};
	if (child.hasFormat('code')) {
		marks.push({ type: I.MarkType.Code, range: { ...range }, param: '' });
	};

	return marks;
};

/**
 * Extract text and marks from an element node's children
 */
const extractTextAndMarks = (element: ElementNode): { text: string; marks: I.Mark[] } => {
	let text = '';
	const marks: I.Mark[] = [];
	const children = element.getChildren();

	for (const child of children) {
		const childText = child.getTextContent();
		const start = text.length;
		const end = start + childText.length;

		if ($isMentionNode(child)) {
			marks.push({
				type: I.MarkType.Mention,
				range: { from: start, to: end },
				param: child.getMentionId(),
			});
		} else
		if ($isTextNode(child)) {
			marks.push(...extractMarks(child, start, end));
		};

		text += childText;
	};

	return { text, marks };
};

/**
 * Serialize Lexical editor state to CommentContentPart[]
 */
const editorStateToParts = (editor: LexicalEditor): I.CommentContentPart[] => {
	if (!editor) {
		return [];
	};

	const parts: I.CommentContentPart[] = [];

	editor.getEditorState().read(() => {
		const root = $getRoot();
		const children = root.getChildren();

		for (const node of children) {
			// Horizontal rule (decorator)
			if (node instanceof HorizontalRuleNode) {
				parts.push({
					style: I.TextStyle.Paragraph,
					type: I.BlockType.Div,
					text: '',
					marks: [],
				});
				continue;
			};

			if (!$isElementNode(node)) {
				continue;
			};

			// Heading
			if ($isHeadingNode(node)) {
				const tag = node.getTag();
				const { text, marks } = extractTextAndMarks(node);

				parts.push({
					style: headingTagToStyle(tag),
					type: I.BlockType.Text,
					text,
					marks,
				});
				continue;
			};

			// Quote
			if (node.getType() === 'quote') {
				const { text, marks } = extractTextAndMarks(node);

				parts.push({
					style: I.TextStyle.Quote,
					type: I.BlockType.Text,
					text,
					marks,
				});
				continue;
			};

			// Code block
			if ($isCodeNode(node)) {
				const text = node.getTextContent();
				const lang = node.getLanguage() || '';

				parts.push({
					style: I.TextStyle.Code,
					type: I.BlockType.Text,
					text,
					marks: [],
					lang: lang || undefined,
				});
				continue;
			};

			// Lists
			if ($isListNode(node)) {
				const listType = node.getListType();
				const items = node.getChildren();

				for (const item of items) {
					if (!$isListItemNode(item)) {
						continue;
					};

					const { text, marks } = extractTextAndMarks(item);
					let style = I.TextStyle.Bulleted;
					let checked: boolean | undefined;

					if (listType === 'number') {
						style = I.TextStyle.Numbered;
					} else
					if (listType === 'check') {
						style = I.TextStyle.Checkbox;
						checked = item.getChecked();
					};

					parts.push({
						style,
						type: I.BlockType.Text,
						text,
						marks,
						checked,
					});
				};
				continue;
			};

			// Paragraph (default)
			const { text, marks } = extractTextAndMarks(node);

			parts.push({
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text,
				marks,
			});
		};
	});

	return parts;
};

/**
 * Create text nodes with formatting from marks
 */
const createFormattedNodes = (text: string, marks: I.Mark[]): LexicalNode[] => {
	if (!marks || !marks.length) {
		return [ $createTextNode(text) ];
	};

	const boundaries = new Set<number>();
	boundaries.add(0);
	boundaries.add(text.length);

	for (const mark of marks) {
		boundaries.add(mark.range.from);
		boundaries.add(mark.range.to);
	};

	const sorted = [ ...boundaries ].sort((a, b) => a - b);
	const nodes: LexicalNode[] = [];

	for (let i = 0; i < sorted.length - 1; i++) {
		const from = sorted[i];
		const to = sorted[i + 1];
		const segment = text.slice(from, to);

		if (!segment) {
			continue;
		};

		// Check if this segment is a mention
		const mentionMark = marks.find(m =>
			(m.type === I.MarkType.Mention) && (m.range.from <= from) && (m.range.to >= to)
		);

		if (mentionMark) {
			nodes.push($createMentionNode(mentionMark.param || '', segment));
			continue;
		};

		const node = $createTextNode(segment);

		for (const mark of marks) {
			if ((mark.range.from <= from) && (mark.range.to >= to)) {
				switch (mark.type) {
					case I.MarkType.Bold: node.toggleFormat('bold'); break;
					case I.MarkType.Italic: node.toggleFormat('italic'); break;
					case I.MarkType.Strike: node.toggleFormat('strikethrough'); break;
					case I.MarkType.Underline: node.toggleFormat('underline'); break;
					case I.MarkType.Code: node.toggleFormat('code'); break;
				};
			};
		};

		nodes.push(node);
	};

	return nodes.length ? nodes : [ $createTextNode(text) ];
};

/**
 * Deserialize CommentContentPart[] into Lexical editor state
 */
const partsToEditor = (editor: LexicalEditor, parts: I.CommentContentPart[]) => {
	if (!editor) {
		return;
	};

	editor.update(() => {
		const root = $getRoot();
		root.clear();

		if (!parts || !parts.length) {
			const p = $createParagraphNode();
			p.append($createTextNode(''));
			root.append(p);
			return;
		};

		// Group consecutive list items of the same style into list nodes
		let i = 0;
		while (i < parts.length) {
			const part = parts[i];

			// Divider
			if (part.type === I.BlockType.Div) {
				root.append(new HorizontalRuleNode());
				i++;
				continue;
			};

			// Heading
			const headingTag = styleToHeadingTag(part.style);
			if (headingTag) {
				const heading = $createHeadingNode(headingTag as 'h1' | 'h2' | 'h3');
				heading.append(...createFormattedNodes(part.text || '', part.marks));
				root.append(heading);
				i++;
				continue;
			};

			// Quote
			if (part.style === I.TextStyle.Quote) {
				const quote = new QuoteNode();
				quote.append(...createFormattedNodes(part.text || '', part.marks));
				root.append(quote);
				i++;
				continue;
			};

			// Code block
			if (part.style === I.TextStyle.Code) {
				const code = $createCodeNode(part.lang || undefined);
				code.append($createTextNode(part.text || ''));
				root.append(code);
				i++;
				continue;
			};

			// Lists — group consecutive items of the same list style
			if ([ I.TextStyle.Bulleted, I.TextStyle.Numbered, I.TextStyle.Checkbox ].includes(part.style)) {
				const listStyle = part.style;
				let listType: 'bullet' | 'number' | 'check' = 'bullet';

				if (listStyle === I.TextStyle.Numbered) {
					listType = 'number';
				} else
				if (listStyle === I.TextStyle.Checkbox) {
					listType = 'check';
				};

				const list = $createListNode(listType);

				while ((i < parts.length) && (parts[i].style === listStyle) && (parts[i].type !== I.BlockType.Div)) {
					const itemPart = parts[i];
					const item = $createListItemNode(listType === 'check' ? itemPart.checked || false : undefined);
					item.append(...createFormattedNodes(itemPart.text || '', itemPart.marks));
					list.append(item);
					i++;
				};

				root.append(list);
				continue;
			};

			// Paragraph (default)
			const p = $createParagraphNode();
			p.append(...createFormattedNodes(part.text || '', part.marks));
			root.append(p);
			i++;
		};
	});
};

// ---- Lexical Plugins ----

const SubmitPlugin = ({ onSubmit }: { onSubmit?: () => void }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.key === 'Enter') && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				onSubmit?.();
			};
		};

		const root = editor.getRootElement();
		if (root) {
			root.addEventListener('keydown', onKeyDown);
			return () => root.removeEventListener('keydown', onKeyDown);
		};
	}, [ editor, onSubmit ]);

	return null;
};

const EscapePlugin = ({ onCancel }: { onCancel?: () => void }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		if (!onCancel) {
			return;
		};

		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			(e: KeyboardEvent) => {
				e?.preventDefault();
				onCancel();
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor, onCancel ]);

	return null;
};

const FormattingPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey)) {
				return;
			};

			const formatMap: Record<string, TextFormatType> = {
				b: 'bold',
				i: 'italic',
				u: 'underline',
			};

			const format = formatMap[e.key.toLowerCase()];
			if (format) {
				e.preventDefault();
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
			};
		};

		const root = editor.getRootElement();
		if (root) {
			root.addEventListener('keydown', onKeyDown);
			return () => root.removeEventListener('keydown', onKeyDown);
		};
	}, [ editor ]);

	return null;
};

const SelectionToolbarPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const removeListener = editor.registerUpdateListener(() => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();

				if (!$isRangeSelection(selection) || selection.isCollapsed()) {
					if (S.Menu.isOpen('commentToolbar')) {
						S.Menu.close('commentToolbar');
					};
					return;
				};

				const root = editor.getRootElement();
				if (!root) {
					return;
				};

				const win = $(window);

				const getActiveFormats = () => {
					let formats: any = {};
					editor.getEditorState().read(() => {
						const sel = $getSelection();
						if ($isRangeSelection(sel)) {
							formats = {
								bold: sel.hasFormat('bold'),
								italic: sel.hasFormat('italic'),
								strikethrough: sel.hasFormat('strikethrough'),
								underline: sel.hasFormat('underline'),
								code: sel.hasFormat('code'),
							};
						};
					});
					return formats;
				};

				const onToggleFormat = (type: string) => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, type as TextFormatType);
				};

				if (S.Menu.isOpen('commentToolbar')) {
					S.Menu.updateData('commentToolbar', { getActiveFormats });
					return;
				};

				const wrap = root.closest('.commentEditorWrap');

				S.Menu.open('commentToolbar', {
					element: wrap ? $(wrap) : $(root),
					recalcRect: () => {
						const rect = U.Common.getSelectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
					},
					type: I.MenuType.Horizontal,
					offsetY: -8,
					horizontal: I.MenuDirection.Center,
					vertical: I.MenuDirection.Top,
					passThrough: true,
					noAnimation: true,
					data: {
						getActiveFormats,
						onToggleFormat,
					},
				});
			});
		});

		return () => {
			removeListener();
			S.Menu.close('commentToolbar');
		};
	}, [ editor ]);

	return null;
};

const FocusPlugin = ({ onFocus, onBlur }: { onFocus?: () => void; onBlur?: () => void }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterFocus = editor.registerCommand(
			FOCUS_COMMAND,
			() => {
				keyboard.setFocus(true);
				keyboard.disableSelection(true);
				onFocus?.();
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const unregisterBlur = editor.registerCommand(
			BLUR_COMMAND,
			() => {
				keyboard.setFocus(false);
				keyboard.disableSelection(false);
				onBlur?.();
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			unregisterFocus();
			unregisterBlur();
		};
	}, [ editor, onFocus, onBlur ]);

	return null;
};

const InitialPartsPlugin = ({ parts }: { parts?: I.CommentContentPart[] }) => {
	const [ editor ] = useLexicalComposerContext();
	const loaded = useRef(false);

	useEffect(() => {
		if (!loaded.current && parts && parts.length) {
			loaded.current = true;
			partsToEditor(editor, parts);
		};
	}, [ editor ]);

	return null;
};

const EditorRefPlugin = ({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		editorRef.current = editor;
	}, [ editor ]);

	return null;
};

const HorizontalRulePlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			INSERT_HORIZONTAL_RULE_COMMAND,
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return false;
				};

				const focus = selection.focus;
				const focusNode = focus.getNode();
				const topLevelNode = focusNode.getTopLevelElementOrThrow();

				const hrNode = new HorizontalRuleNode();
				const newParagraph = $createParagraphNode();

				topLevelNode.insertAfter(hrNode);
				hrNode.insertAfter(newParagraph);
				newParagraph.select();

				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [ editor ]);

	return null;
};

const SlashMenuPlugin = ({ editorId }: { editorId: string }) => {
	const [ editor ] = useLexicalComposerContext();
	const slashOffset = useRef(-1);
	const prevText = useRef('');

	// Block Enter/Escape in editor when slash menu is open — let the menu handle them
	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(e: KeyboardEvent | null) => {
				if (S.Menu.isOpen('commentAdd')) {
					e?.preventDefault();
					return true;
				};
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor ]);

	useEffect(() => {
		const removeListener = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node)) {
					prevText.current = '';
					if (S.Menu.isOpen('commentAdd')) {
						S.Menu.close('commentAdd');
						slashOffset.current = -1;
					};
					return;
				};

				const text = node.getTextContent();
				const offset = anchor.offset;
				const menuOpen = S.Menu.isOpen('commentAdd');

				// Only trigger when new text was added (not on deletions or cursor moves)
				if ((offset > 0) && (text[offset - 1] === '/') && (text !== prevText.current) && !menuOpen) {
					const charBefore = offset > 1 ? text[offset - 2] : '';
					if (!charBefore || (charBefore === ' ') || (charBefore === '\n')) {
						slashOffset.current = offset - 1;
						openSlashMenu(editor, editorId, slashOffset);
					};
				};

				// Update filter text while slash menu is open
				if (menuOpen && (slashOffset.current >= 0)) {
					const filterStart = slashOffset.current + 1;
					const filterText = text.slice(filterStart, offset);

					const menu = S.Menu.get('commentAdd');
					if (menu) {
						menu.param.data.filter = filterText;

						if (filterText) {
							const s = filterText.toLowerCase();
							const allSections = U.Menu.getCommentAddSections();
							menu.param.data.sections = allSections
								.map(section => ({
									...section,
									children: section.children.filter((it: any) =>
										(it.name || '').toLowerCase().includes(s) ||
										(it.description || '').toLowerCase().includes(s)
									),
								}))
								.filter(section => section.children.length > 0);
						} else {
							menu.param.data.sections = U.Menu.getCommentAddSections();
						};
					};

					// Close if / was deleted or no items match
					if ((offset <= slashOffset.current) || (text[slashOffset.current] !== '/')) {
						S.Menu.close('commentAdd');
						slashOffset.current = -1;
					};
				};

				prevText.current = text;
			});
		});

		return removeListener;
	}, [ editor, editorId ]);

	return null;
};

const openSlashMenu = (editor: LexicalEditor, editorId: string, slashOffset: React.MutableRefObject<number>) => {
	const rect = U.Common.getSelectionRect();
	if (!rect) {
		return;
	};

	const win = $(window);

	S.Menu.open('commentAdd', {
		component: 'select',
		rect: { ...rect, y: rect.y + win.scrollTop() + 4, x: rect.x, width: 0, height: rect.height },
		vertical: I.MenuDirection.Bottom,
		horizontal: I.MenuDirection.Left,
		offsetY: 4,
		noAnimation: true,
		commonFilter: true,
		data: {
			sections: U.Menu.getCommentAddSections(),
			noFilter: true,
			filter: '',
			noClose: true,
			onSelect: (_e: any, item: any) => {
				const menu = S.Menu.get('commentAdd');
				const filterLen = menu ? String(menu.param.data.filter || '').length : 0;

				S.Menu.close('commentAdd');

				// Remove the slash character and any filter text after it
				editor.update(() => {
					const root = $getRoot();
					const children = root.getChildren();

					for (const child of children) {
						if (!$isElementNode(child)) {
							continue;
						};

						for (const textChild of child.getChildren()) {
							if (!$isTextNode(textChild)) {
								continue;
							};

							const text = textChild.getTextContent();
							const offset = slashOffset.current;

							if ((offset >= 0) && (offset < text.length) && (text[offset] === '/')) {
								const before = text.slice(0, offset);
								const after = text.slice(offset + 1 + filterLen);
								textChild.setTextContent(before + after);
								textChild.select(before.length, before.length);
								slashOffset.current = -1;
								return;
							};
						};
					};
				});

				// Handle block transforms and action items
				if (item.action) {
					const el = document.getElementById(editorId);
					if (el) {
						el.dispatchEvent(new CustomEvent('commentSlashAction', { detail: { action: item.action, embedProcessor: item.embedProcessor } }));
					};
				} else
				if (item.blockType === I.BlockType.Div) {
					const el = document.getElementById(editorId);
					if (el) {
						el.dispatchEvent(new CustomEvent('commentSlashAction', { detail: { type: item.blockType } }));
					};
				} else
				if (item.textStyle !== undefined) {
					applyBlockTransform(editor, { style: item.textStyle, type: item.blockType });
				};
			},
		},
	});
};

const applyBlockTransform = (editor: LexicalEditor, item: any) => {
	if (!item) {
		return;
	};

	editor.update(() => {
		const selection = $getSelection();
		if (!$isRangeSelection(selection)) {
			return;
		};

		switch (item.style) {
			case I.TextStyle.Header1:
			case I.TextStyle.Header2:
			case I.TextStyle.Header3: {
				const tag = styleToHeadingTag(item.style) as 'h1' | 'h2' | 'h3';
				$setBlocksType(selection, () => $createHeadingNode(tag));
				break;
			};

			case I.TextStyle.Quote: {
				$setBlocksType(selection, () => new QuoteNode());
				break;
			};

			case I.TextStyle.Code: {
				$setBlocksType(selection, () => $createCodeNode());
				break;
			};

			case I.TextStyle.Bulleted: {
				editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
				break;
			};

			case I.TextStyle.Numbered: {
				editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
				break;
			};

			case I.TextStyle.Checkbox: {
				editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
				break;
			};

			case I.TextStyle.Paragraph: {
				if (item.type === I.BlockType.Div) {
					editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
				} else {
					$setBlocksType(selection, () => $createParagraphNode());
				};
				break;
			};
		};
	});

	editor.focus();
};


const MentionPlugin = ({ editorId }: { editorId: string }) => {
	const [ editor ] = useLexicalComposerContext();
	const prevText = useRef('');
	const mentionOffset = useRef(-1);

	useEffect(() => {
		const removeListener = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isMentionNode(node)) {
					prevText.current = '';
					return;
				};

				const text = node.getTextContent();
				const offset = anchor.offset;
				const menuOpen = S.Menu.isOpen('blockMention');

				// Trigger mention menu on @ character
				if ((offset > 0) && (text[offset - 1] === '@') && (text !== prevText.current) && !menuOpen) {
					const charBefore = offset > 1 ? text[offset - 2] : '';
					if (!charBefore || [ ' ', '\n', '(', '[', '"', '\'' ].includes(charBefore)) {
						mentionOffset.current = offset - 1;
						openMentionMenu(editor, editorId, mentionOffset);
					};
				};

				// Update filter text while mention menu is open
				if (menuOpen && (mentionOffset.current >= 0)) {
					const filterStart = mentionOffset.current + 1;
					const filterText = text.slice(filterStart, offset);
					S.Common.filterSetText(filterText);

					// Close if @ was deleted
					if ((offset <= mentionOffset.current) || (text[mentionOffset.current] !== '@')) {
						S.Menu.close('blockMention');
						mentionOffset.current = -1;
					};
				};

				prevText.current = text;
			});
		});

		return removeListener;
	}, [ editor, editorId ]);

	return null;
};

const openMentionMenu = (editor: LexicalEditor, editorId: string, mentionOffset: React.MutableRefObject<number>) => {
	const rect = U.Common.getSelectionRect();
	if (!rect) {
		return;
	};

	const win = $(window);
	const space = S.Common.space;
	const participantId = U.Space.getParticipantId(space, S.Auth.account?.id);

	S.Common.filterSet(0, '');

	S.Menu.open('blockMention', {
		rect: { ...rect, y: rect.y + win.scrollTop(), x: rect.x, width: 0, height: rect.height },
		vertical: I.MenuDirection.Top,
		horizontal: I.MenuDirection.Left,
		offsetY: -4,
		commonFilter: true,
		noAnimation: true,
		data: {
			pronounId: participantId,
			marks: [],
			skipIds: [ S.Auth.account?.id ],
			filters: [
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
			],
			onChange: (object: any, name: string) => {
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) {
						return;
					};

					const anchor = selection.anchor;
					const node = anchor.getNode();

					if ($isTextNode(node)) {
						const text = node.getTextContent();
						const atOffset = mentionOffset.current;
						const cursorOffset = anchor.offset;

						// Remove @ and filter text
						const before = text.slice(0, atOffset);
						const after = text.slice(cursorOffset);

						if (before || after) {
							node.setTextContent(before + after);
							node.select(before.length, before.length);
						};

						// Get selection again after text change
						const newSelection = $getSelection();
						if ($isRangeSelection(newSelection)) {
							const trimmedName = name.trim();
							const mentionNode = $createMentionNode(object.id, trimmedName);
							newSelection.insertNodes([ mentionNode ]);

							const spaceNode = $createTextNode(' ');
							mentionNode.insertAfter(spaceNode);
							spaceNode.select();
						};
					};
				});

				mentionOffset.current = -1;
				editor.focus();
			},
		},
	});
};

const EmojiPlugin = ({ editorId }: { editorId: string }) => {
	const [ editor ] = useLexicalComposerContext();
	const prevText = useRef('');
	const colonOffset = useRef(-1);

	useEffect(() => {
		const removeListener = editor.registerUpdateListener(({ editorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isMentionNode(node)) {
					prevText.current = '';
					return;
				};

				const text = node.getTextContent();
				const offset = anchor.offset;
				const menuOpen = S.Menu.isOpen('smile');

				if ((offset > 0) && (text[offset - 1] === ':') && (text !== prevText.current) && !menuOpen) {
					const charBefore = offset > 1 ? text[offset - 2] : '';
					if (!charBefore || [ ' ', '\n', '(', '[', '"', '\'' ].includes(charBefore)) {
						colonOffset.current = offset - 1;
						openEmojiMenu(editor, editorId, colonOffset);
					};
				};

				prevText.current = text;
			});
		});

		return removeListener;
	}, [ editor, editorId ]);

	return null;
};

const openEmojiMenu = (editor: LexicalEditor, editorId: string, colonOffset: React.MutableRefObject<number>) => {
	const rect = U.Common.getSelectionRect();
	if (!rect) {
		return;
	};

	const win = $(window);

	S.Menu.open('smile', {
		rect: { ...rect, y: rect.y + win.scrollTop(), x: rect.x, width: 0, height: rect.height },
		vertical: I.MenuDirection.Top,
		horizontal: I.MenuDirection.Left,
		offsetY: -4,
		noAnimation: true,
		data: {
			noHead: true,
			noUpload: true,
			value: '',
			onSelect: (icon: string) => {
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) {
						return;
					};

					const anchor = selection.anchor;
					const node = anchor.getNode();

					if ($isTextNode(node)) {
						const text = node.getTextContent();
						const offset = colonOffset.current;

						if ((offset >= 0) && (text[offset] === ':')) {
							const before = text.slice(0, offset);
							const after = text.slice(offset + 1);
							node.setTextContent(before + icon + after);
							node.select(before.length + icon.length, before.length + icon.length);
						};
					};
				});

				colonOffset.current = -1;
				editor.focus();
			},
		},
	});
};

const CodeHighlightPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return registerCodeHighlighting(editor, PrismTokenizer);
	}, [ editor ]);

	return null;
};

const CodeExitPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(e: KeyboardEvent | null) => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return false;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				const codeNode = node.getTopLevelElementOrThrow();

				if (!$isCodeNode(codeNode)) {
					return false;
				};

				const text = codeNode.getTextContent();
				const offset = anchor.offset;

				// Check if cursor is at the end and last line is empty
				const isAtEnd = (anchor.getNode() === codeNode.getLastChild()) && (offset === anchor.getNode().getTextContentSize());

				if (!isAtEnd) {
					return false;
				};

				// Check if the text ends with a newline (empty last line)
				if (!text.endsWith('\n')) {
					return false;
				};

				e?.preventDefault();

				// Remove the trailing newline
				const lastChild = codeNode.getLastChild();
				if ($isTextNode(lastChild)) {
					const childText = lastChild.getTextContent();
					if (childText.endsWith('\n')) {
						lastChild.setTextContent(childText.slice(0, -1));
					};
				};

				// Create a new paragraph after the code block
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(''));
				codeNode.insertAfter(paragraph);
				paragraph.select();

				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor ]);

	return null;
};

const CodeBlockPlugin = () => {
	const [ editor ] = useLexicalComposerContext();
	const [ codeBlocks, setCodeBlocks ] = React.useState<{ key: string; lang: string }[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const update = () => {
			editor.getEditorState().read(() => {
				const blocks: { key: string; lang: string }[] = [];

				for (const node of $getRoot().getChildren()) {
					if ($isCodeNode(node)) {
						blocks.push({
							key: node.getKey(),
							lang: node.getLanguage() || J.Constant.default.codeLang,
						});
					};
				};

				setCodeBlocks(prev => {
					if ((prev.length === blocks.length) && prev.every((b, i) => (b.key === blocks[i].key) && (b.lang === blocks[i].lang))) {
						return prev;
					};
					return blocks;
				});
			});
		};

		const removeListener = editor.registerUpdateListener(() => update());
		update();
		return removeListener;
	}, [ editor ]);

	const onLangClick = useCallback((e: React.MouseEvent, nodeKey: string) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('select', {
			element: $(e.currentTarget),
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			noAnimation: true,
			width: 200,
			data: {
				options: U.Menu.codeLangOptions(),
				noFilter: false,
				onSelect: (_e: any, item: any) => {
					editor.update(() => {
						const node = $getRoot().getChildren().find(n => n.getKey() === nodeKey);
						if ($isCodeNode(node)) {
							node.setLanguage(item.id === 'plain' ? null : item.id);
						};
					});
				},
			},
		});
	}, [ editor ]);

	const renderButtons = () => {
		const container = containerRef.current;
		if (!container) {
			return null;
		};

		const wrapRect = container.parentElement?.getBoundingClientRect();
		if (!wrapRect) {
			return null;
		};

		return codeBlocks.map(block => {
			const element = editor.getElementByKey(block.key);
			if (!element) {
				return null;
			};

			const rect = element.getBoundingClientRect();
			const titles = U.Prism.getTitles();
			const match = titles.find((t: any) => t.id === block.lang);
			const label = match ? match.name : block.lang;

			return (
				<div
					key={block.key}
					className="codeLangBtn"
					onMouseDown={e => onLangClick(e, block.key)}
					style={{
						position: 'absolute',
						top: rect.top - wrapRect.top + 4,
						right: 4,
					}}
				>
					{label}
				</div>
			);
		});
	};

	return <div ref={containerRef} className="codeLangOverlay">{renderButtons()}</div>;
};

// ---- Main Component ----

const CommentEditor = forwardRef<RefProps, Props>((props, ref) => {

	const { placeholder, initialParts, readonly, onSubmit, onCancel, onEmpty, onChange, onFocus, onBlur } = props;
	const editorRef = useRef<LexicalEditor | null>(null);
	const isEmptyRef = useRef(true);
	const editorId = useRef(`commentEditor-${Math.random().toString(36).slice(2, 10)}`).current;

	const checkEmpty = useCallback(() => {
		const editor = editorRef.current;
		if (!editor) {
			return true;
		};

		let empty = true;
		editor.getEditorState().read(() => {
			const root = $getRoot();
			const text = root.getTextContent().trim();
			empty = !text;
		});

		return empty;
	}, []);

	const handleChange = useCallback((editorState: EditorState) => {
		const empty = checkEmpty();
		if (empty !== isEmptyRef.current) {
			isEmptyRef.current = empty;
			onEmpty?.(empty);
		};
		onChange?.();
	}, [ onEmpty, onChange ]);

	const handleSubmit = useCallback(() => {
		if (checkEmpty()) {
			return;
		};

		const parts = editorStateToParts(editorRef.current);
		onSubmit?.(parts);
	}, [ onSubmit ]);

	const getLineCount = useCallback(() => {
		const editor = editorRef.current;
		if (!editor) {
			return 0;
		};

		let count = 0;
		editor.getEditorState().read(() => {
			count = $getRoot().getChildrenSize();
		});

		return count;
	}, []);

	const getCurrentBlockStyle = useCallback((): I.TextStyle => {
		const editor = editorRef.current;
		if (!editor) {
			return I.TextStyle.Paragraph;
		};

		let style = I.TextStyle.Paragraph;
		editor.getEditorState().read(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			};

			const anchorNode = selection.anchor.getNode();
			const element = anchorNode.getTopLevelElementOrThrow();

			if ($isHeadingNode(element)) {
				style = headingTagToStyle(element.getTag());
			} else
			if (element.getType() === 'quote') {
				style = I.TextStyle.Quote;
			} else
			if ($isCodeNode(element)) {
				style = I.TextStyle.Code;
			} else
			if ($isListNode(element)) {
				const listType = element.getListType();
				if (listType === 'number') {
					style = I.TextStyle.Numbered;
				} else
				if (listType === 'check') {
					style = I.TextStyle.Checkbox;
				} else {
					style = I.TextStyle.Bulleted;
				};
			};
		});

		return style;
	}, []);

	const setBlockStyle = useCallback((style: I.TextStyle) => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		};

		applyBlockTransform(editor, { style, type: I.BlockType.Text });
	}, []);

	const insertDivider = useCallback(() => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		};

		editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
	}, []);

	const toggleFormat = useCallback((format: TextFormatType) => {
		const editor = editorRef.current;
		if (!editor) {
			return;
		};

		editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
	}, []);

	useImperativeHandle(ref, () => ({
		focus: () => {
			editorRef.current?.focus();
		},

		clear: () => {
			const editor = editorRef.current;
			if (editor) {
				editor.update(() => {
					const root = $getRoot();
					root.clear();
					const p = $createParagraphNode();
					p.append($createTextNode(''));
					root.append(p);
				});
				isEmptyRef.current = true;
				onEmpty?.(true);
			};
		},

		getParts: () => {
			return editorStateToParts(editorRef.current);
		},

		setParts: (parts: I.CommentContentPart[]) => {
			partsToEditor(editorRef.current, parts);
		},

		isEmpty: () => checkEmpty(),

		getEditor: () => editorRef.current,

		getLineCount,

		insertBlock: (style: I.TextStyle) => {
			setBlockStyle(style);
		},

		insertDivider,

		insertText: (text: string) => {
			const editor = editorRef.current;
			if (editor) {
				editor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						selection.insertText(text);
					};
				});
			};
		},

		insertMention: (id: string, name: string) => {
			const editor = editorRef.current;
			if (editor) {
				editor.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						const mentionNode = $createMentionNode(id, name);
						selection.insertNodes([ mentionNode ]);

						const spaceNode = $createTextNode(' ');
						mentionNode.insertAfter(spaceNode);
						spaceNode.select();
					};
				});
			};
		},

		toggleFormat,
		setBlockStyle,
		getCurrentBlockStyle,
	}));

	const initialConfig = {
		namespace: 'CommentEditor',
		theme,
		nodes: [ HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, HorizontalRuleNode, MentionNode ],
		onError: (error: Error) => {
			console.error('[CommentEditor]', error);
		},
		editable: !readonly,
	};

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="commentEditorWrap" id={editorId}>
				<RichTextPlugin
					contentEditable={<ContentEditable className="commentEditorInput" />}
					placeholder={<div className="commentEditorPlaceholder">{placeholder || ''}</div>}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<HistoryPlugin />
				<ListPlugin />
				<CheckListPlugin />
				<OnChangePlugin onChange={handleChange} />
				<SubmitPlugin onSubmit={handleSubmit} />
				<EscapePlugin onCancel={onCancel} />
				<FormattingPlugin />
				<SelectionToolbarPlugin />
				<FocusPlugin onFocus={onFocus} onBlur={onBlur} />
				<InitialPartsPlugin parts={initialParts} />
				<EditorRefPlugin editorRef={editorRef} />
				<HorizontalRulePlugin />
				<SlashMenuPlugin editorId={editorId} />
				<MentionPlugin editorId={editorId} />
				<EmojiPlugin editorId={editorId} />
				<CodeHighlightPlugin />
				<CodeExitPlugin />
				<CodeBlockPlugin />
			</div>
		</LexicalComposer>
	);
});

export default CommentEditor;
