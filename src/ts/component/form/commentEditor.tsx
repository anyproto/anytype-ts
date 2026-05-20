import React, { forwardRef, useRef, useImperativeHandle, useCallback, useEffect, createContext, useContext } from 'react';
import raf from 'raf';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $trimTextContentFromAnchor } from '@lexical/selection';
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
	$getNodeByKey,
	$isRangeSelection,
	$createParagraphNode,
	$createTextNode,
	$createRangeSelection,
	$setSelection,
	$isElementNode,
	$isTextNode,
	FORMAT_TEXT_COMMAND,
	FOCUS_COMMAND,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	COMMAND_PRIORITY_LOW,
	COMMAND_PRIORITY_NORMAL,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
	PASTE_COMMAND,
	createCommand,
	EditorState,
	LexicalEditor,
	LexicalNode,
	TextFormatType,
	ElementNode,
	DecoratorNode,
	TextNode,
	$splitNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';

import { IconObject } from 'Component';
import Attachment from 'Component/block/chat/attachment';
import EmbedPreview from 'Component/comment/embedPreview';
import * as I from 'Interface';
import * as M from 'Model';
import Storage from 'Lib/storage';

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

// Inline emoji node — renders as cross-platform IconObject image
class EmojiNode extends DecoratorNode<JSX.Element> {

	__emoji: string;
	__code: string;

	static getType (): string {
		return 'emoji';
	};

	static clone (node: EmojiNode): EmojiNode {
		return new EmojiNode(node.__emoji, node.__code, node.__key);
	};

	constructor (emoji: string, code: string, key?: string) {
		super(key);
		this.__emoji = emoji;
		this.__code = code;
	};

	createDOM (): HTMLElement {
		const span = document.createElement('span');
		span.className = 'commentEditor-emoji';
		return span;
	};

	updateDOM (): boolean {
		return false;
	};

	isInline (): boolean {
		return true;
	};

	getTextContent (): string {
		return this.__emoji;
	};

	getEmoji (): string {
		return this.__emoji;
	};

	getCode (): string {
		return this.__code;
	};

	decorate (): JSX.Element {
		return <IconObject size={20} iconSize={20} object={{ iconEmoji: this.__code }} />;
	};

	exportJSON () {
		return {
			type: 'emoji',
			version: 1,
			emoji: this.__emoji,
			code: this.__code,
		};
	};

	static importJSON (json: any): EmojiNode {
		return new EmojiNode(json.emoji, json.code);
	};

};

const INSERT_EMOJI_COMMAND = createCommand<{ emoji: string; code: string }>('INSERT_EMOJI_COMMAND');

// Link URL storage — maps Lexical node keys to link URLs
const linkUrlMap = new Map<string, string>();

class LinkTextNode extends TextNode {

	__linkUrl: string;
	__markType: I.MarkType;

	static getType (): string {
		return 'linkText';
	};

	static clone (node: LinkTextNode): LinkTextNode {
		const n = new LinkTextNode(node.__linkUrl, node.__markType, node.__text, node.__key);
		n.__format = node.__format;
		return n;
	};

	constructor (linkUrl: string, markType: I.MarkType, text: string, key?: string) {
		super(text, key);
		this.__linkUrl = linkUrl;
		this.__markType = markType;
	};

	createDOM (config: any): HTMLElement {
		const el = super.createDOM(config);
		U.Dom.addClass(el, 'commentEditor-link');
		return el;
	};

	updateDOM (prevNode: LinkTextNode, dom: HTMLElement, config: any): boolean {
		return super.updateDOM(prevNode as any, dom, config);
	};

	canInsertTextAfter (): boolean {
		return false;
	};

	exportJSON () {
		return {
			...super.exportJSON(),
			type: 'linkText',
			linkUrl: this.__linkUrl,
			markType: this.__markType,
		};
	};

	static importJSON (json: any): LinkTextNode {
		const node = new LinkTextNode(json.linkUrl, json.markType, json.text);
		node.setFormat(json.format);
		return node;
	};

	getLinkUrl (): string {
		return this.__linkUrl;
	};

	getMarkType (): I.MarkType {
		return this.__markType;
	};

};

function $createLinkTextNode (linkUrl: string, markType: I.MarkType, text: string): LinkTextNode {
	return new LinkTextNode(linkUrl, markType, text);
};

function $isLinkTextNode (node: LexicalNode | null | undefined): node is LinkTextNode {
	return node instanceof LinkTextNode;
};

// Context for passing the discussion deps subId to decorator nodes
export const CommentSubIdContext = createContext<string>('');

// Module-level drag state for decorator node reordering
let dragState: { sourceKey: string; sourceEl: HTMLElement; editorEl: HTMLElement; startX: number; startY: number; ghost: HTMLElement | null; active: boolean } | null = null;
const DRAG_THRESHOLD = 5;
const DROP_INDICATOR_CLASS = 'decoratorDropIndicator';

// Get all root-level block elements in the editor (paragraphs, headings, lists, decorators, etc.)
const getDropTargets = (): HTMLElement[] => {
	if (!dragState?.editorEl) {
		return [];
	};

	const input = dragState.editorEl.querySelector('.commentEditorInput');
	if (!input) {
		return [];
	};

	return Array.from(input.children) as HTMLElement[];
};

const removeDropIndicator = () => {
	const existing = document.querySelector(`.${DROP_INDICATOR_CLASS}`);
	if (existing) {
		existing.remove();
	};
};

const cleanupDrag = () => {
	if (!dragState) {
		return;
	};

	if (dragState.ghost) {
		dragState.ghost.remove();
	};

	U.Dom.removeClass(dragState.sourceEl, 'isDragging');
	removeDropIndicator();

	dragState = null;
};

const DraggableDecorator = ({ nodeKey, children }: { nodeKey: string; children: React.ReactNode }) => {
	const [ editor ] = useLexicalComposerContext();
	const nodeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = nodeRef.current;
		if (!el) {
			return;
		};

		// Prevent native image/element drag inside contentEditable
		const onDragStart = (e: DragEvent) => {
			e.preventDefault();
		};

		// Find the outer Lexical DOM element for this decorator node
		const getOuterElement = (): HTMLElement | null => {
			return editor.getElementByKey(nodeKey);
		};

		// Find the closest drop target element and position from mouse coordinates
		const findDropTarget = (clientY: number): { element: HTMLElement; position: 'before' | 'after' } | null => {
			const targets = getDropTargets();
			const outerEl = getOuterElement();
			let closest: { element: HTMLElement; distance: number; position: 'before' | 'after' } | null = null;

			for (const target of targets) {
				// Skip the source element's outer container
				if (target === outerEl) {
					continue;
				};

				const rect = target.getBoundingClientRect();
				const midY = rect.top + rect.height / 2;
				const position: 'before' | 'after' = clientY < midY ? 'before' : 'after';
				const edgeY = position === 'before' ? rect.top : rect.bottom;
				const distance = Math.abs(clientY - edgeY);

				if (!closest || (distance < closest.distance)) {
					closest = { element: target, distance, position };
				};
			};

			return closest;
		};

		// Show a drop indicator line at the given element edge
		const showDropIndicator = (target: HTMLElement, position: 'before' | 'after') => {
			removeDropIndicator();

			const contentArea = el.closest('.contentArea');
			if (!contentArea) {
				return;
			};

			const rect = target.getBoundingClientRect();
			const containerRect = contentArea.getBoundingClientRect();
			const indicator = document.createElement('div');

			U.Dom.addClass(indicator, DROP_INDICATOR_CLASS);
			U.Dom.css(indicator, {
				left: '12px',
				position: 'absolute',
				top: `${(position === 'before' ? rect.top : rect.bottom) - containerRect.top + contentArea.scrollTop}px`,
			});

			U.Dom.css(contentArea as HTMLElement, { position: 'relative' });
			contentArea.appendChild(indicator);
		};

		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) {
				return;
			};

			// Skip drag when interacting with content that owns its own pointer behavior (e.g. Excalidraw canvas).
			if ((e.target as HTMLElement).closest('.mediaExcalidraw')) {
				return;
			};

			e.preventDefault();

			const editorEl = el.closest('.commentEditorWrap') as HTMLElement;
			if (!editorEl) {
				return;
			};

			dragState = {
				sourceKey: nodeKey,
				sourceEl: el,
				editorEl,
				startX: e.clientX,
				startY: e.clientY,
				ghost: null,
				active: false,
			};

			const onMouseMove = (me: MouseEvent) => {
				if (!dragState) {
					return;
				};

				if (!dragState.active) {
					const dx = Math.abs(me.clientX - dragState.startX);
					const dy = Math.abs(me.clientY - dragState.startY);

					if ((dx < DRAG_THRESHOLD) && (dy < DRAG_THRESHOLD)) {
						return;
					};

					dragState.active = true;
					U.Dom.addClass(dragState.sourceEl, 'isDragging');

					const outerEl = getOuterElement();
					if (outerEl) {
						U.Dom.addClass(outerEl, 'isDragging');
					};

					const ghost = dragState.sourceEl.cloneNode(true) as HTMLElement;
					U.Dom.removeClass(ghost, 'isDragging');
					U.Dom.addClass(ghost, 'dragGhost');
					U.Dom.css(ghost, { width: `${dragState.sourceEl.offsetWidth}px` });
					document.body.appendChild(ghost);
					dragState.ghost = ghost;
				};

				if (dragState.ghost) {
					U.Dom.css(dragState.ghost, {
						left: `${me.clientX + 12}px`,
						top: `${me.clientY + 12}px`,
					});
				};

				const dropTarget = findDropTarget(me.clientY);
				if (dropTarget) {
					showDropIndicator(dropTarget.element, dropTarget.position);
				} else {
					removeDropIndicator();
				};
			};

			const onMouseUp = (me: MouseEvent) => {
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);

				if (!dragState?.active) {
					dragState = null;
					return;
				};

				const dropTarget = findDropTarget(me.clientY);
				const sourceKey = dragState.sourceKey;

				// Also remove isDragging from the outer Lexical element
				const outerEl = getOuterElement();
				if (outerEl) {
					U.Dom.removeClass(outerEl, 'isDragging');
				};

				cleanupDrag();

				if (dropTarget) {
					// Get the Lexical node key from the target DOM element
					const targetLexicalKey = editor.getEditorState().read(() => {
						const root = $getRoot();
						for (const child of root.getChildren()) {
							const childEl = editor.getElementByKey(child.getKey());
							if (childEl === dropTarget.element) {
								return child.getKey();
							};
						};
						return null;
					});

					if (targetLexicalKey && (sourceKey !== targetLexicalKey)) {
						editor.update(() => {
							const sourceNode = $getNodeByKey(sourceKey);
							const targetNode = $getNodeByKey(targetLexicalKey);

							if (!sourceNode || !targetNode) {
								return;
							};

							sourceNode.remove();

							if (dropTarget.position === 'before') {
								targetNode.insertBefore(sourceNode);
							} else {
								targetNode.insertAfter(sourceNode);
							};
						});
					};
				};

				// Prevent the subsequent click from firing
				const preventClick = (ce: MouseEvent) => {
					ce.stopPropagation();
					ce.preventDefault();
				};

				window.addEventListener('click', preventClick, true);
				window.setTimeout(() => window.removeEventListener('click', preventClick, true), 0);
			};

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		};

		el.addEventListener('mousedown', onMouseDown);
		el.addEventListener('dragstart', onDragStart);
		return () => {
			el.removeEventListener('mousedown', onMouseDown);
			el.removeEventListener('dragstart', onDragStart);
		};
	}, [ nodeKey, editor ]);

	return (
		<div
			ref={nodeRef}
			className="draggableDecorator"
			data-decorator-key={nodeKey}
		>
			{children}
		</div>
	);
};

// Attachment node — renders ChatAttachment inline in the editor
export const INSERT_ATTACHMENT_COMMAND = createCommand<any>('INSERT_ATTACHMENT_COMMAND');
export const REMOVE_ATTACHMENT_COMMAND = createCommand<string>('REMOVE_ATTACHMENT_COMMAND');
export const UPDATE_ATTACHMENT_COMMAND = createCommand<{ id: string; data: any }>('UPDATE_ATTACHMENT_COMMAND');

class AttachmentNode extends DecoratorNode<JSX.Element> {

	__attachmentData: any;

	static getType (): string {
		return 'attachment';
	};

	static clone (node: AttachmentNode): AttachmentNode {
		return new AttachmentNode(node.__attachmentData, node.__key);
	};

	constructor (data: any, key?: string) {
		super(key);
		this.__attachmentData = data;
	};

	createDOM (): HTMLElement {
		const el = document.createElement('div');
		el.className = 'commentEditor-attachment';
		el.draggable = false;
		return el;
	};

	updateDOM (): boolean {
		return false;
	};

	isIsolated (): boolean {
		return true;
	};

	decorate (): JSX.Element {
		return <AttachmentDecorator nodeKey={this.__key} data={this.__attachmentData} />;
	};

	exportJSON () {
		return {
			type: 'attachment',
			version: 1,
			attachmentData: this.__attachmentData,
		};
	};

	static importJSON (json: any): AttachmentNode {
		return new AttachmentNode(json.attachmentData);
	};

	getAttachmentData (): any {
		return this.__attachmentData;
	};

	setAttachmentData (data: any): void {
		const writable = this.getWritable();
		writable.__attachmentData = data;
	};

};

const AttachmentDecorator = ({ nodeKey, data }: { nodeKey: string; data: any }) => {
	const [ editor ] = useLexicalComposerContext();
	const subId = useContext(CommentSubIdContext);

	// For real objects (non-tmp), read fresh details from the discussion deps subscription
	let object = { syncStatus: I.SyncStatusObject.Synced, ...data };
	if (data.id && !data.isTmp && subId) {
		const details = S.Detail.get(subId, data.id, []);
		if (!details._empty_) {
			object = { syncStatus: I.SyncStatusObject.Synced, ...details };
		};
	};

	return (
		<DraggableDecorator nodeKey={nodeKey}>
			<Attachment
				object={object}
				withInlineSize={false}
				onRemove={() => {
					editor.dispatchCommand(REMOVE_ATTACHMENT_COMMAND, nodeKey);
				}}
			/>
		</DraggableDecorator>
	);
};

function $createAttachmentNode (data: any): AttachmentNode {
	return new AttachmentNode(data);
};

function $isAttachmentNode (node: LexicalNode | null | undefined): node is AttachmentNode {
	return node instanceof AttachmentNode;
};

// Embed node — renders an embed block inline in the editor
export const INSERT_EMBED_COMMAND = createCommand<{ processor: I.EmbedProcessor; text: string }>('INSERT_EMBED_COMMAND');
export const UPDATE_EMBED_COMMAND = createCommand<{ nodeKey: string; text: string }>('UPDATE_EMBED_COMMAND');

class EmbedNode extends DecoratorNode<JSX.Element> {

	__processor: I.EmbedProcessor;
	__embedText: string;

	static getType (): string {
		return 'embed';
	};

	static clone (node: EmbedNode): EmbedNode {
		return new EmbedNode(node.__processor, node.__embedText, node.__key);
	};

	constructor (processor: I.EmbedProcessor, text: string, key?: string) {
		super(key);
		this.__processor = processor;
		this.__embedText = text;
	};

	createDOM (): HTMLElement {
		const el = document.createElement('div');
		el.className = 'commentEditor-embed';
		el.draggable = false;
		return el;
	};

	updateDOM (): boolean {
		return false;
	};

	isIsolated (): boolean {
		return true;
	};

	decorate (): JSX.Element {
		return <EmbedDecorator nodeKey={this.__key} processor={this.__processor} text={this.__embedText} />;
	};

	exportJSON () {
		return {
			type: 'embed',
			version: 1,
			processor: this.__processor,
			embedText: this.__embedText,
		};
	};

	static importJSON (json: any): EmbedNode {
		return new EmbedNode(json.processor, json.embedText);
	};

	getProcessor (): I.EmbedProcessor {
		return this.__processor;
	};

	getEmbedText (): string {
		return this.__embedText;
	};

	setEmbedText (text: string): void {
		const writable = this.getWritable();
		writable.__embedText = text;
	};

};

const EmbedDecorator = ({ nodeKey, processor, text }: { nodeKey: string; processor: I.EmbedProcessor; text: string }) => {
	const [ editor ] = useLexicalComposerContext();
	const processorName = I.EmbedProcessor[processor] || 'Embed';

	const onEdit = useCallback(() => {
		const el = editor.getElementByKey(nodeKey);
		if (!el) {
			return;
		};

		const rect = el.getBoundingClientRect();
		const isKroki = processor === I.EmbedProcessor.Kroki;
		const menuId = isKroki ? 'blockEmbedKroki' : 'dataviewText';

		S.Menu.open(menuId, {
			classNameWrap: 'fromBlock',
			rect: { x: rect.x, y: rect.y + rect.height, width: rect.width, height: 0 },
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			width: Math.max(rect.width, 360),
			data: {
				value: text,
				placeholder: U.String.sprintf(translate('blockEmbedPlaceholder'), processorName),
				canEdit: true,
				noResize: true,
				relationKey: 'url',
				onChange: (v: string) => {
					editor.dispatchCommand(UPDATE_EMBED_COMMAND, { nodeKey, text: v });
				},
			},
		});
	}, [ editor, nodeKey, text, processor ]);

	const onRemove = useCallback(() => {
		editor.update(() => {
			const node = $getNodeByKey(nodeKey);
			if (node) {
				node.remove();
			};
		});
	}, [ editor, nodeKey ]);

	const onChange = useCallback((v: string) => {
		editor.dispatchCommand(UPDATE_EMBED_COMMAND, { nodeKey, text: v });
	}, [ editor, nodeKey ]);

	return (
		<DraggableDecorator nodeKey={nodeKey}>
			<EmbedPreview
				processor={processor}
				text={text}
				onEdit={onEdit}
				onRemove={onRemove}
				onChange={onChange}
			/>
		</DraggableDecorator>
	);
};

function $createEmbedNode (processor: I.EmbedProcessor, text: string): EmbedNode {
	return new EmbedNode(processor, text);
};

function $isEmbedNode (node: LexicalNode | null | undefined): node is EmbedNode {
	return node instanceof EmbedNode;
};

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

// SourceQuoteNode is a QuoteNode that carries a back-reference to the
// originating editor block or comment message. It renders identically to
// a stock QuoteNode (same `commentEditor-quote` class via the theme), but
// editorStateToParts emits it as a part with `editorQuote` / `messageQuote`
// metadata so the rendered post can be clicked back to the source.
class SourceQuoteNode extends QuoteNode {

	__sourceBlockId: string;
	__sourceMessageId: string;

	static getType (): string {
		return 'sourceQuote';
	};

	static clone (node: SourceQuoteNode): SourceQuoteNode {
		const cloned = new SourceQuoteNode(node.__sourceBlockId, node.__sourceMessageId, node.__key);
		return cloned;
	};

	constructor (sourceBlockId: string, sourceMessageId: string, key?: string) {
		super(key);
		this.__sourceBlockId = sourceBlockId || '';
		this.__sourceMessageId = sourceMessageId || '';
	};

	getSourceBlockId (): string {
		return this.__sourceBlockId;
	};

	getSourceMessageId (): string {
		return this.__sourceMessageId;
	};

	exportJSON () {
		return {
			...super.exportJSON(),
			type: 'sourceQuote',
			sourceBlockId: this.__sourceBlockId,
			sourceMessageId: this.__sourceMessageId,
		};
	};

	static importJSON (json: any): SourceQuoteNode {
		return new SourceQuoteNode(json.sourceBlockId || '', json.sourceMessageId || '');
	};

};

function $createSourceQuoteNode (sourceBlockId: string, sourceMessageId: string): SourceQuoteNode {
	return new SourceQuoteNode(sourceBlockId, sourceMessageId);
};

function $isSourceQuoteNode (node: LexicalNode | null | undefined): node is SourceQuoteNode {
	return node instanceof SourceQuoteNode;
};

interface Props {
	rootId?: string;
	subId?: string;
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	readonly?: boolean;
	maxLength?: number;
	onSubmit?: (parts: I.CommentContentPart[]) => void;
	onCancel?: () => void;
	onEmpty?: (isEmpty: boolean) => void;
	onChange?: () => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onSlashAction?: (item: any) => void;
	onPasteFiles?: (files: File[]) => void;
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
	insertEmoji: (icon: string) => void;
	insertEmbed: (processor: I.EmbedProcessor, text: string) => void;
	insertAttachment: (data: any) => void;
	removeAttachment: (key: string) => void;
	getAttachments: () => any[];
	clearAttachments: () => void;
	insertSourceQuote: (part: I.CommentContentPart) => void;
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
		atrule: 'token atrule',
		attr: 'token attr-name',
		boolean: 'token boolean',
		builtin: 'token builtin',
		cdata: 'token cdata',
		char: 'token char',
		class: 'token class-name',
		'class-name': 'token class-name',
		comment: 'token comment',
		constant: 'token constant',
		deleted: 'token deleted',
		doctype: 'token doctype',
		entity: 'token entity',
		function: 'token function',
		important: 'token important',
		inserted: 'token inserted',
		keyword: 'token keyword',
		namespace: 'token namespace',
		number: 'token number',
		operator: 'token operator',
		prolog: 'token prolog',
		property: 'token property',
		punctuation: 'token punctuation',
		regex: 'token regex',
		selector: 'token selector',
		string: 'token string',
		symbol: 'token symbol',
		tag: 'token tag',
		url: 'token url',
		variable: 'token variable',
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

	const style = child.getStyle();
	if (style) {
		const colorMatch = style.match(/--anytype-color:\s*([^;]+)/);
		if (colorMatch) {
			marks.push({ type: I.MarkType.Color, range: { ...range }, param: colorMatch[1].trim() });
		};

		const bgColorMatch = style.match(/--anytype-bgcolor:\s*([^;]+)/);
		if (bgColorMatch) {
			marks.push({ type: I.MarkType.BgColor, range: { ...range }, param: bgColorMatch[1].trim() });
		};
	};

	return marks;
};

/**
 * Detect emoji characters in text and add I.MarkType.Emoji marks with shortcodes.
 * Uses Unicode property escapes to match emoji sequences (ZWJ, skin tones, flags).
 */
const addEmojiMarks = (text: string, marks: I.Mark[]) => {
	// Match emoji: base emoji optionally followed by variation selectors, ZWJ sequences, skin tones, flags
	const re = /\p{Extended_Pictographic}(?:\u{FE0F}|\u{200D}\p{Extended_Pictographic}|\u{1F3FB}|\u{1F3FC}|\u{1F3FD}|\u{1F3FE}|\u{1F3FF})*/gu;
	let match: RegExpExecArray | null;

	while ((match = re.exec(text)) !== null) {
		const code = U.Smile.getCode(match[0]);
		if (!code) {
			continue;
		};

		const from = match.index;
		const to = from + match[0].length;

		// Skip if already covered by another mark (mention, etc.)
		const overlaps = marks.some(m =>
			(m.type === I.MarkType.Emoji) &&
			(m.range.from < to) && (m.range.to > from)
		);

		if (!overlaps) {
			marks.push({
				type: I.MarkType.Emoji,
				range: { from, to },
				param: code,
			});
		};
	};
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

		if (child instanceof EmojiNode) {
			marks.push({
				type: I.MarkType.Emoji,
				range: { from: start, to: end },
				param: child.getCode(),
			});
		} else
		if ($isMentionNode(child)) {
			marks.push({
				type: I.MarkType.Mention,
				range: { from: start, to: end },
				param: child.getMentionId(),
			});
		} else
		if ($isLinkTextNode(child)) {
			marks.push(...extractMarks(child, start, end));
			marks.push({
				type: child.getMarkType(),
				range: { from: start, to: end },
				param: child.getLinkUrl(),
			});
		} else
		if ($isTextNode(child)) {
			marks.push(...extractMarks(child, start, end));

			// Check for manually-assigned link URLs
			const linkData = linkUrlMap.get(child.getKey());
			if (linkData) {
				try {
					const { url: linkUrl, type: linkType } = JSON.parse(linkData);
					marks.push({
						type: linkType || I.MarkType.Link,
						range: { from: start, to: end },
						param: linkUrl,
					});
				} catch (e) {
					marks.push({
						type: I.MarkType.Link,
						range: { from: start, to: end },
						param: linkData,
					});
				};
			};
		};

		text += childText;
	};

	// Auto-detect URLs in text and add Link marks
	const urls = U.String.getUrlsFromText(text);
	for (const url of urls) {
		const hasOverlap = marks.some(m =>
			((m.type === I.MarkType.Mention) || (m.type === I.MarkType.Link)) &&
			(m.range.from < url.to) && (m.range.to > url.from)
		);

		if (!hasOverlap) {
			marks.push({
				type: I.MarkType.Link,
				range: { from: url.from, to: url.to },
				param: url.value,
			});
		};
	};

	// Auto-detect emoji in text and add Emoji marks for cross-platform rendering
	addEmojiMarks(text, marks);

	return { text, marks };
};

/**
 * Split a text part on newline boundaries into multiple parts, adjusting mark ranges
 */
const splitPartOnNewlines = (part: I.CommentContentPart): I.CommentContentPart[] => {
	const { text, marks, style, type } = part;

	if (!text || !text.includes('\n')) {
		return [ part ];
	};

	const lines = text.split('\n');
	const result: I.CommentContentPart[] = [];
	let offset = 0;

	for (const line of lines) {
		const lineEnd = offset + line.length;
		const lineMarks: I.Mark[] = [];

		for (const mark of (marks || [])) {
			const mFrom = mark.range.from;
			const mTo = mark.range.to;

			// Skip marks that don't overlap this line
			if ((mTo <= offset) || (mFrom >= lineEnd)) {
				continue;
			};

			lineMarks.push({
				type: mark.type,
				range: {
					from: Math.max(0, mFrom - offset),
					to: Math.min(line.length, mTo - offset),
				},
				param: mark.param,
			});
		};

		result.push({
			style,
			type,
			text: line,
			marks: lineMarks,
		});

		// +1 for the \n character
		offset = lineEnd + 1;
	};

	return result;
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
			// Attachment node — include as a link part
			if (node instanceof AttachmentNode) {
				const data = node.getAttachmentData();
				parts.push({
					style: I.TextStyle.Paragraph,
					type: I.BlockType.Link,
					text: '',
					marks: [],
					attachmentData: data,
				});
				continue;
			};

			// Embed node
			if (node instanceof EmbedNode) {
				parts.push({
					style: I.TextStyle.Paragraph,
					type: I.BlockType.Embed,
					text: '',
					marks: [],
					embed: {
						text: node.getEmbedText(),
						processor: node.getProcessor(),
					},
				});
				continue;
			};

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

				parts.push(...splitPartOnNewlines({
					style: headingTagToStyle(tag),
					type: I.BlockType.Text,
					text,
					marks,
				}));
				continue;
			};

			// Source-bearing quote (carries blockId or messageId back to origin)
			if ($isSourceQuoteNode(node)) {
				const { text, marks } = extractTextAndMarks(node);
				const blockId = node.getSourceBlockId();
				const messageId = node.getSourceMessageId();
				const part: I.CommentContentPart = {
					style: I.TextStyle.Quote,
					type: I.BlockType.Text,
					text,
					marks,
				};

				if (blockId) {
					part.editorQuote = { blockId };
				} else
				if (messageId) {
					part.messageQuote = { messageId };
				};

				parts.push(part);
				continue;
			};

			// Quote
			if (node.getType() === 'quote') {
				const { text, marks } = extractTextAndMarks(node);

				parts.push(...splitPartOnNewlines({
					style: I.TextStyle.Quote,
					type: I.BlockType.Text,
					text,
					marks,
				}));
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

			parts.push(...splitPartOnNewlines({
				style: I.TextStyle.Paragraph,
				type: I.BlockType.Text,
				text,
				marks,
			}));
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

		// Check if this segment is an emoji
		const emojiMark = marks.find(m =>
			(m.type === I.MarkType.Emoji) && (m.range.from <= from) && (m.range.to >= to)
		);

		if (emojiMark) {
			nodes.push(new EmojiNode(segment, emojiMark.param || ''));
			continue;
		};

		// Check if this segment is a link
		const linkMark = marks.find(m =>
			((m.type === I.MarkType.Link) || (m.type === I.MarkType.Object)) &&
			(m.range.from <= from) && (m.range.to >= to)
		);

		const node = linkMark
			? $createLinkTextNode(linkMark.param || '', linkMark.type, segment)
			: $createTextNode(segment);

		const styles: string[] = [];

		for (const mark of marks) {
			if ((mark.range.from <= from) && (mark.range.to >= to)) {
				switch (mark.type) {
					case I.MarkType.Bold: node.toggleFormat('bold'); break;
					case I.MarkType.Italic: node.toggleFormat('italic'); break;
					case I.MarkType.Strike: node.toggleFormat('strikethrough'); break;
					case I.MarkType.Underline: node.toggleFormat('underline'); break;
					case I.MarkType.Code: node.toggleFormat('code'); break;
					case I.MarkType.Color: {
						if (mark.param) {
							styles.push(`color: var(--color-dark-${mark.param})`);
							styles.push(`--anytype-color: ${mark.param}`);
						};
						break;
					};
					case I.MarkType.BgColor: {
						if (mark.param) {
							styles.push(`background-color: var(--color-light-${mark.param})`);
							styles.push(`--anytype-bgcolor: ${mark.param}`);
						};
						break;
					};
				};
			};
		};

		if (styles.length) {
			node.setStyle(styles.join('; '));
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

			// Embed
			if ((part.type === I.BlockType.Embed) && part.embed) {
				root.append($createEmbedNode(part.embed.processor, part.embed.text));
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
				const sourceBlockId = part.editorQuote?.blockId || '';
				const sourceMessageId = part.messageQuote?.messageId || '';
				const quote = (sourceBlockId || sourceMessageId)
					? $createSourceQuoteNode(sourceBlockId, sourceMessageId)
					: new QuoteNode();
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

			// Link (attachment)
			if ((part.type === I.BlockType.Link) && part.attachmentData) {
				root.append($createAttachmentNode(part.attachmentData));
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

		// Ensure there's always a trailing paragraph for the caret
		const lastChild = root.getLastChild();
		if (!$isElementNode(lastChild) || (lastChild.getType() !== 'paragraph')) {
			const p = $createParagraphNode();
			p.append($createTextNode(''));
			root.append(p);
		};
	});
};

// ---- Lexical Plugins ----

const SubmitPlugin = ({ onSubmit }: { onSubmit?: () => void }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Enter') {
				return;
			};

			// Don't submit when menus are open — let the menu handle Enter
			if (S.Menu.isOpen('commentAdd') || S.Menu.isOpen('blockEmoji') || S.Menu.isOpen('blockMention') || S.Menu.isOpen('selectPasteUrl')) {
				return;
			};

			const hasCmd = e.metaKey || e.ctrlKey;
			const cmdSend = S.Common.commentCmdSend;

			if (cmdSend && hasCmd) {
				// Cmd+Enter to send
				e.preventDefault();
				onSubmit?.();
			} else
			if (!cmdSend && !hasCmd && !e.shiftKey) {
				// Enter to send (Shift+Enter for newline)
				e.preventDefault();
				onSubmit?.();
			};
		};

		const root = editor.getRootElement();
		if (root) {
			U.Dom.addEvent(root, 'keydown', onKeyDown);
			return () => U.Dom.removeEvent(root, 'keydown', onKeyDown);
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

const FormattingPlugin = ({ editorId }: { editorId: string }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!(e.metaKey || e.ctrlKey)) {
				return;
			};

			const key = e.key.toLowerCase();

			// Shift+key shortcuts
			if (e.shiftKey) {
				if (key === 's') {
					e.preventDefault();
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
					return;
				};

				if (key === 'k') {
					e.preventDefault();
					openLinkMenu(editor, editorId);
					return;
				};
			};

			// Cmd/Ctrl+E — emoji picker
			if (key === 'e') {
				e.preventDefault();
				openEmojiPicker(editor, editorId);
				return;
			};

			// Cmd/Ctrl+L — inline code (not handled by Lexical natively)
			if (key === 'l') {
				e.preventDefault();
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
				return;
			};

			// Note: Cmd+B (bold), Cmd+I (italic), Cmd+U (underline) are handled
			// natively by Lexical's RichTextPlugin — do NOT dispatch here to avoid double-toggle
		};

		const root = editor.getRootElement();
		if (root) {
			U.Dom.addEvent(root, 'keydown', onKeyDown);
			return () => U.Dom.removeEvent(root, 'keydown', onKeyDown);
		};
	}, [ editor, editorId ]);

	return null;
};

const openLinkMenu = (editor: LexicalEditor, editorId: string) => {
	let hasLink = false;
	let linkParam = '';
	let linkMarkType: I.MarkType | undefined;
	let selectedText = '';

	editor.getEditorState().read(() => {
		const selection = $getSelection();
		if (!$isRangeSelection(selection) || selection.isCollapsed()) {
			return;
		};

		selectedText = selection.getTextContent();

		const nodes = selection.getNodes();
		for (const node of nodes) {
			if (node instanceof LinkTextNode) {
				hasLink = true;
				linkParam = node.getLinkUrl();
				linkMarkType = node.getMarkType();
				break;
			};
		};
	});

	const wrap = U.Dom.get(editorId);
	if (!wrap) {
		return;
	};

	const rect = U.Dom.getSelectionRect();
	if (!rect) {
		return;
	};

	const isObjectLink = linkMarkType === I.MarkType.Object;

	S.Menu.open('blockLink', {
		classNameWrap: 'fromBlock',
		rect: { ...rect, y: rect.y + window.scrollY, x: rect.x, width: 0, height: rect.height },
		horizontal: I.MenuDirection.Center,
		offsetY: -8,
		noAnimation: true,
		data: {
			filter: isObjectLink ? selectedText : linkParam,
			type: isObjectLink ? I.MarkType.Object : null,
			onChange: (type: I.MarkType, param: string) => {
				if (!param) {
					return;
				};

				editor.update(() => {
					const sel = $getSelection();
					if (!$isRangeSelection(sel)) {
						return;
					};

					const nodes = sel.getNodes();
					const anchor = sel.anchor;
					const focus = sel.focus;
					const isBackward = sel.isBackward();
					const startOffset = isBackward ? focus.offset : anchor.offset;
					const endOffset = isBackward ? anchor.offset : focus.offset;
					const startNode = isBackward ? focus.getNode() : anchor.getNode();
					const endNode = isBackward ? anchor.getNode() : focus.getNode();

					for (const node of nodes) {
						if (!$isTextNode(node)) {
							continue;
						};

						let from = 0;
						let to = node.getTextContentSize();

						if (node.is(startNode)) {
							from = startOffset;
						};

						if (node.is(endNode)) {
							to = endOffset;
						};

						const text = node.getTextContent();
						const before = text.slice(0, from);
						const linkText = text.slice(from, to);
						const after = text.slice(to);

						if (!linkText) {
							continue;
						};

						const parts: (TextNode | LinkTextNode)[] = [];

						if (before) {
							const beforeNode = $createTextNode(before);
							beforeNode.setFormat(node.getFormat());
							parts.push(beforeNode);
						};

						const linkNode = new LinkTextNode(param, type, linkText);
						linkNode.setFormat(node.getFormat());
						parts.push(linkNode);

						if (after) {
							const afterNode = $createTextNode(after);
							afterNode.setFormat(node.getFormat());
							parts.push(afterNode);
						};

						for (const [ i, part ] of parts.entries()) {
							if (i === 0) {
								node.replace(part);
							} else {
								parts[i - 1].insertAfter(part);
							};
						};
					};
				});

				editor.focus();
			},
		},
	});
};

const openEmojiPicker = (editor: LexicalEditor, editorId: string) => {
	const rect = U.Dom.getSelectionRect();
	const root = editor.getRootElement();
	const wrap = root?.closest('.commentEditorWrap') as HTMLElement;

	const menuParam: any = {
		classNameWrap: 'fromBlock',
		vertical: I.MenuDirection.Top,
		horizontal: I.MenuDirection.Left,
		offsetY: -4,
		noAnimation: true,
		data: {
			noHead: true,
			noUpload: true,
			value: '',
			onSelect: (icon: string) => {
				const code = U.Smile.getCode(icon);
				if (code) {
					editor.dispatchCommand(INSERT_EMOJI_COMMAND, { emoji: icon, code });
				} else {
					editor.update(() => {
						const selection = $getSelection();
						if ($isRangeSelection(selection)) {
							selection.insertText(icon);
						};
					});
				};
				editor.focus();
			},
		},
	};

	if (rect) {
		menuParam.rect = { ...rect, y: rect.y + window.scrollY, x: rect.x, width: 0, height: rect.height };
	} else {
		menuParam.element = wrap || root;
	};

	S.Menu.open('smile', menuParam);
};

const SelectionToolbarPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		let isMouseDown = false;
		let pendingOpen = false;
		let openTimer = 0;

		const root = editor.getRootElement();

		const openToolbar = () => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();

				if (!$isRangeSelection(selection) || selection.isCollapsed()) {
					if (S.Menu.isOpen('commentToolbar') && !S.Menu.isOpen('select') && !S.Menu.isOpen('blockLink')) {
						S.Menu.close('commentToolbar');
					};
					return;
				};

				if (!root) {
					return;
				};

				const getActiveFormats = () => {
					let formats: any = {};
					editor.getEditorState().read(() => {
						const sel = $getSelection();
						if ($isRangeSelection(sel)) {
							let link = false;
							let linkParam = '';
							let linkMarkType: I.MarkType | undefined;

							const nodes = sel.getNodes();
							for (const node of nodes) {
								if (node instanceof LinkTextNode) {
									link = true;
									linkParam = node.getLinkUrl();
									linkMarkType = node.getMarkType();
									break;
								};
							};

							formats = {
								bold: sel.hasFormat('bold'),
								italic: sel.hasFormat('italic'),
								strikethrough: sel.hasFormat('strikethrough'),
								underline: sel.hasFormat('underline'),
								code: sel.hasFormat('code'),
								link,
								linkParam,
								linkMarkType,
								selectedText: sel.getTextContent(),
							};
						};
					});
					return formats;
				};

				const getBlockStyle = () => {
					let style = 'text';
					editor.getEditorState().read(() => {
						const sel = $getSelection();
						if (!$isRangeSelection(sel)) {
							return;
						};

						const anchor = sel.anchor.getNode();
						const parent = anchor.getParent();
						const topLevel = $isElementNode(parent) ? parent : anchor;

						if ($isHeadingNode(topLevel)) {
							const tag = topLevel.getTag();
							switch (tag) {
								case 'h1': style = 'header1'; break;
								case 'h2': style = 'header2'; break;
								case 'h3': style = 'header3'; break;
							};
						} else
						if (topLevel instanceof QuoteNode) {
							style = 'quote';
						} else
						if ($isCodeNode(topLevel)) {
							style = 'code';
						} else
						if ($isListNode(topLevel) || $isListItemNode(topLevel)) {
							const listNode = $isListNode(topLevel) ? topLevel : topLevel.getParent();
							if ($isListNode(listNode)) {
								const listType = listNode.getListType();
								switch (listType) {
									case 'bullet': style = 'bulleted'; break;
									case 'number': style = 'numbered'; break;
									case 'check': style = 'checkbox'; break;
								};
							};
						};
					});
					return style;
				};

				// Save focus (end of selection) so sub-menus can restore cursor position
				const focusNode = selection.focus.getNode();
				const savedFocusKey = focusNode.getKey();
				const savedFocusOffset = selection.focus.offset;

				const onToggleFormat = (type: string) => {
					editor.dispatchCommand(FORMAT_TEXT_COMMAND, type as TextFormatType);
				};

				const onBlockStyle = (textStyle: I.TextStyle) => {
					const isListStyle = [ I.TextStyle.Bulleted, I.TextStyle.Numbered, I.TextStyle.Checkbox ].includes(textStyle);

					if (isListStyle) {
						// List commands handle cursor positioning internally — dispatch outside update()
						switch (textStyle) {
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
						};
					} else {
						editor.update(() => {
							const node = $getNodeByKey(savedFocusKey);
							if (node && $isTextNode(node)) {
								const offset = Math.min(savedFocusOffset, node.getTextContentSize());
								node.select(offset, offset);
							} else
							if (node && $isElementNode(node)) {
								node.selectEnd();
							};

							const sel = $getSelection();
							if (!$isRangeSelection(sel)) {
								return;
							};

							switch (textStyle) {
								case I.TextStyle.Header1:
								case I.TextStyle.Header2:
								case I.TextStyle.Header3: {
									const tag = styleToHeadingTag(textStyle) as 'h1' | 'h2' | 'h3';
									$setBlocksType(sel, () => $createHeadingNode(tag));
									break;
								};

								case I.TextStyle.Quote: {
									$setBlocksType(sel, () => new QuoteNode());
									break;
								};

								case I.TextStyle.Code: {
									$setBlocksType(sel, () => $createCodeNode());
									break;
								};

								case I.TextStyle.Paragraph: {
									$setBlocksType(sel, () => $createParagraphNode());
									break;
								};
							};
						});
					};

					S.Menu.closeAll([ 'blockStyle', 'commentToolbar' ]);
					editor.focus();
				};

				const onLink = (url: string, markType?: I.MarkType) => {
					if (!url) {
						return;
					};

					const type = markType || I.MarkType.Link;

					editor.update(() => {
						const sel = $getSelection();
						if (!$isRangeSelection(sel)) {
							return;
						};

						const nodes = sel.getNodes();
						const anchor = sel.anchor;
						const focus = sel.focus;

						const isBackward = sel.isBackward();
						const startOffset = isBackward ? focus.offset : anchor.offset;
						const endOffset = isBackward ? anchor.offset : focus.offset;
						const startNode = isBackward ? focus.getNode() : anchor.getNode();
						const endNode = isBackward ? anchor.getNode() : focus.getNode();

						for (const node of nodes) {
							if (!$isTextNode(node)) {
								continue;
							};

							let from = 0;
							let to = node.getTextContentSize();

							if (node.is(startNode)) {
								from = startOffset;
							};

							if (node.is(endNode)) {
								to = endOffset;
							};

							const text = node.getTextContent();
							const before = text.slice(0, from);
							const linkText = text.slice(from, to);
							const after = text.slice(to);

							if (!linkText) {
								continue;
							};

							const parts: (TextNode | LinkTextNode)[] = [];

							if (before) {
								parts.push($createTextNode(before));
							};

							const linkNode = $createLinkTextNode(url, type, linkText);
							linkNode.setFormat(node.getFormat());
							parts.push(linkNode);

							if (after) {
								parts.push($createTextNode(after));
							};

							const parent = node.getParent();
							if (parent) {
								for (const part of parts) {
									node.insertBefore(part);
								};
								node.remove();
							};
						};
					});
				};

				if (S.Menu.isOpen('commentToolbar')) {
					S.Menu.updateData('commentToolbar', { getActiveFormats, getBlockStyle, blockStyle: getBlockStyle() });
					S.Menu.resizeAll();
					return;
				};

				const wrap = root.closest('.commentEditorWrap') as HTMLElement;

				S.Menu.open('commentToolbar', {
					element: wrap || root,
					classNameWrap: 'fromBlock',
					recalcRect: () => {
						const rect = U.Dom.getSelectionRect();
						return rect ? { ...rect, y: rect.y + window.scrollY } : null;
					},
					type: I.MenuType.Horizontal,
					offsetY: -8,
					horizontal: I.MenuDirection.Center,
					vertical: I.MenuDirection.Top,
					passThrough: true,
					noAnimation: true,
					noBorderY: true,
					data: {
						getActiveFormats,
						getBlockStyle,
						blockStyle: getBlockStyle(),
						onToggleFormat,
						onBlockStyle,
						onLink,
					},
				});
			});
		};

		const onMouseDown = () => {
			isMouseDown = true;
			pendingOpen = false;
		};

		const onMouseUp = () => {
			isMouseDown = false;

			if (pendingOpen) {
				pendingOpen = false;
				openTimer = window.setTimeout(() => openToolbar(), 50);
			};
		};

		if (root) {
			root.addEventListener('mousedown', onMouseDown);
			document.addEventListener('mouseup', onMouseUp);
		};

		const removeListener = editor.registerUpdateListener(() => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();

				if (!$isRangeSelection(selection) || selection.isCollapsed()) {
					pendingOpen = false;
					if (S.Menu.isOpen('commentToolbar') && !S.Menu.isOpen('select') && !S.Menu.isOpen('blockLink')) {
						S.Menu.close('commentToolbar');
					};
					return;
				};

				if (isMouseDown) {
					pendingOpen = true;
					return;
				};

				openToolbar();
			});
		});

		return () => {
			removeListener();
			window.clearTimeout(openTimer);

			if (root) {
				root.removeEventListener('mousedown', onMouseDown);
			};
			document.removeEventListener('mouseup', onMouseUp);

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
				const root = $getRoot();
				let selection = $getSelection();

				if (!$isRangeSelection(selection)) {
					const lastChild = root.getLastChild();
					if (lastChild) {
						lastChild.selectEnd();
						selection = $getSelection();
					};

					if (!$isRangeSelection(selection)) {
						return false;
					};
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

	// Delete HR node on backspace when cursor is at start of next paragraph
	useEffect(() => {
		const unregisterBackspace = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return false;
				};

				const anchor = selection.anchor;
				if (anchor.offset !== 0) {
					return false;
				};

				const node = anchor.getNode();
				const topLevel = node.getTopLevelElementOrThrow();
				const prev = topLevel.getPreviousSibling();

				if (prev instanceof HorizontalRuleNode) {
					prev.remove();
					return true;
				};

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterDelete = editor.registerCommand(
			KEY_DELETE_COMMAND,
			() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return false;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				const topLevel = node.getTopLevelElementOrThrow();

				if (anchor.offset !== topLevel.getTextContentSize()) {
					return false;
				};

				const next = topLevel.getNextSibling();

				if (next instanceof HorizontalRuleNode) {
					next.remove();
					return true;
				};

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			unregisterBackspace();
			unregisterDelete();
		};
	}, [ editor ]);

	return null;
};

const AttachmentPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterInsert = editor.registerCommand(
			INSERT_ATTACHMENT_COMMAND,
			(data: any) => {
				editor.update(() => {
					const root = $getRoot();
					const attachmentNode = $createAttachmentNode(data);
					const lastChild = root.getLastChild();

					// Insert before the last paragraph if it's empty, otherwise append
					if ($isElementNode(lastChild) && (lastChild.getType() === 'paragraph') && !lastChild.getTextContent()) {
						lastChild.insertBefore(attachmentNode);
					} else {
						root.append(attachmentNode);
						const p = $createParagraphNode();
						root.append(p);
					};
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterRemove = editor.registerCommand(
			REMOVE_ATTACHMENT_COMMAND,
			(nodeKey: string) => {
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if ($isAttachmentNode(node)) {
						node.remove();
					};
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterUpdate = editor.registerCommand(
			UPDATE_ATTACHMENT_COMMAND,
			(payload: { id: string; data: any }) => {
				editor.update(() => {
					const root = $getRoot();
					for (const child of root.getChildren()) {
						if ($isAttachmentNode(child) && child.getAttachmentData()?.id === payload.id) {
							child.setAttachmentData({ ...child.getAttachmentData(), ...payload.data });
						};
					};
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			unregisterInsert();
			unregisterRemove();
			unregisterUpdate();
		};
	}, [ editor ]);

	return null;
};

const EmbedPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterInsert = editor.registerCommand(
			INSERT_EMBED_COMMAND,
			(data: { processor: I.EmbedProcessor; text: string }) => {
				editor.update(() => {
					const root = $getRoot();
					const embedNode = $createEmbedNode(data.processor, data.text);
					const lastChild = root.getLastChild();

					if ($isElementNode(lastChild) && (lastChild.getType() === 'paragraph') && !lastChild.getTextContent()) {
						lastChild.insertBefore(embedNode);
					} else {
						root.append(embedNode);
						const p = $createParagraphNode();
						root.append(p);
					};
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		const unregisterUpdate = editor.registerCommand(
			UPDATE_EMBED_COMMAND,
			(data: { nodeKey: string; text: string }) => {
				editor.update(() => {
					const node = $getNodeByKey(data.nodeKey);
					if ($isEmbedNode(node)) {
						node.setEmbedText(data.text);
					};
				});
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			unregisterInsert();
			unregisterUpdate();
		};
	}, [ editor ]);

	return null;
};

const PasteUrlPlugin = ({ rootId }: { rootId?: string }) => {
	const [ editor ] = useLexicalComposerContext();

	const insertParts = useCallback((parts: I.CommentContentPart[]) => {
		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			};

			const nodes: LexicalNode[] = [];

			for (const part of parts) {
				if (part.type === I.BlockType.Div) {
					nodes.push(new HorizontalRuleNode());
					continue;
				};

				const headingTag = styleToHeadingTag(part.style);
				if (headingTag) {
					const heading = $createHeadingNode(headingTag as 'h1' | 'h2' | 'h3');
					heading.append(...createFormattedNodes(part.text || '', part.marks || []));
					nodes.push(heading);
					continue;
				};

				if (part.style === I.TextStyle.Quote) {
					const sourceBlockId = part.editorQuote?.blockId || '';
					const sourceMessageId = part.messageQuote?.messageId || '';
					const quote = (sourceBlockId || sourceMessageId)
						? $createSourceQuoteNode(sourceBlockId, sourceMessageId)
						: new QuoteNode();
					quote.append(...createFormattedNodes(part.text || '', part.marks || []));
					nodes.push(quote);
					continue;
				};

				if (part.style === I.TextStyle.Code) {
					const code = $createCodeNode(part.lang || undefined);
					code.append($createTextNode(part.text || ''));
					nodes.push(code);
					continue;
				};

				if ([ I.TextStyle.Bulleted, I.TextStyle.Numbered, I.TextStyle.Checkbox ].includes(part.style)) {
					let listType: 'bullet' | 'number' | 'check' = 'bullet';
					if (part.style === I.TextStyle.Numbered) {
						listType = 'number';
					} else
					if (part.style === I.TextStyle.Checkbox) {
						listType = 'check';
					};

					const list = $createListNode(listType);
					const item = $createListItemNode(listType === 'check' ? part.checked || false : undefined);
					item.append(...createFormattedNodes(part.text || '', part.marks || []));
					list.append(item);
					nodes.push(list);
					continue;
				};

				const p = $createParagraphNode();
				p.append(...createFormattedNodes(part.text || '', part.marks || []));
				nodes.push(p);
			};

			if (nodes.length) {
				selection.insertNodes(nodes);
			};
		});
	}, [ editor ]);

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(event: ClipboardEvent) => {
				const clipboardData = event.clipboardData;
				if (!clipboardData) {
					return false;
				};

				// Handle anytype block data from internal copy (chat messages, comments, editor)
				const jsonStr = clipboardData.getData('application/json') || '';

				if (jsonStr) {
					try {
						const json = JSON.parse(jsonStr);

						if (json.blocks && json.blocks.length) {
							const parts: I.CommentContentPart[] = json.blocks
								.filter((b: any) => (b.type == I.BlockType.Text) && b.content && b.content.text)
								.map((b: any) => {
									const text = b.content.text || '';
									const marks = (b.content.marks || []).slice();
									const length = text.length;

									if (b.content.color && length) {
										marks.push({ type: I.MarkType.Color, param: b.content.color, range: { from: 0, to: length } });
									};

									if (b.bgColor && length) {
										marks.push({ type: I.MarkType.BgColor, param: b.bgColor, range: { from: 0, to: length } });
									};

									return {
										text,
										style: b.content.style || I.TextStyle.Paragraph,
										type: I.BlockType.Text,
										marks,
										checked: b.content.checked,
									};
								});

							if (parts.length) {
								event.preventDefault();
								insertParts(parts);
								return true;
							};
						};
					} catch (e) {
						// Invalid JSON, fall through
					};
				};

				// HTML without anytype blocks: use BlockPreview to parse into blocks
				const html = clipboardData.getData('text/html') || '';
				if (html) {
					event.preventDefault();

					C.BlockPreview(html, '', (message: any) => {
						if (!message.error.code && message.blocks && message.blocks.length) {
							const parts = U.Comment.docBlocksToParts(message.blocks.map((it: any) => new M.Block(it)));

							if (parts.length) {
								insertParts(parts);
								return;
							};
						};

						// Fallback: insert plain text
						const text = clipboardData.getData('text/plain') || '';
						if (text) {
							editor.update(() => {
								const selection = $getSelection();
								if ($isRangeSelection(selection)) {
									selection.insertText(text);
								};
							});
						};
					});

					return true;
				};

				const text = clipboardData.getData('text/plain') || '';
				if (!text) {
					return false;
				};

				const urls = U.String.getUrlsFromText(text);
				if (!urls.length) {
					return false;
				};

				// Check that the entire pasted text is only URLs (with whitespace between)
				const urlText = urls.map(u => u.value).join('');
				const stripped = text.replace(/[\s\r\n]+/g, '');
				if (urlText !== stripped) {
					return false;
				};

				// Check if any URL is embed-compatible
				const hasEmbed = urls.some(u => U.Embed.getProcessorByUrl(u.value) !== null);

				const options: any[] = [
					{ name: translate('editorPagePasteAsHeader'), isSection: true },
				];

				if (hasEmbed) {
					options.push({ id: 'embed', name: translate('editorPagePasteEmbed') });
				};

				options.push({ id: 'link', name: translate('editorPagePasteLink') });
				options.push({ id: 'cancel', name: translate('editorPagePasteText') });

				const pasteOrder = Storage.get('pasteOptionOrder') || [];
				if (pasteOrder.length) {
					const section = options[0];
					const cancel = options[options.length - 1];
					const sortable = options.slice(1, -1);
					const orderMap = new Map<string, number>(pasteOrder.map((id: string, i: number) => [ id, i ]));

					sortable.sort((a: any, b: any) => {
						const ai = orderMap.get(a.id) ?? sortable.length;
						const bi = orderMap.get(b.id) ?? sortable.length;
						return ai - bi;
					});

					options.length = 0;
					options.push(section, ...sortable, cancel);
				};

				event.preventDefault();

				const root = editor.getRootElement();
				const wrap = root?.closest('.commentEditorWrap') as HTMLElement;

				S.Menu.open('selectPasteUrl', {
					classNameWrap: 'fromBlock',
					component: 'select',
					element: wrap || root,
					recalcRect: () => {
						const rect = U.Dom.getSelectionRect();
						return rect ? { ...rect, y: rect.y + window.scrollY } : null;
					},
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Left,
					offsetY: 4,
					noAnimation: true,
					data: {
						value: '',
						options,
						noFilter: true,
						onSelect: (_e: any, selected: any) => {
							const order = (Storage.get('pasteOptionOrder') || []).filter((it: string) => it != selected.id);
							order.unshift(selected.id);
							Storage.set('pasteOptionOrder', order);

							switch (selected.id) {
								case 'embed': {
									for (const u of urls) {
										const p = U.Embed.getProcessorByUrl(u.value);
										if (p !== null) {
											editor.dispatchCommand(INSERT_EMBED_COMMAND, { processor: p, text: u.value });
										} else {
											// Non-embed URLs fall back to text
											editor.update(() => {
												const selection = $getSelection();
												if ($isRangeSelection(selection)) {
													selection.insertRawText(u.value);
												};
											});
										};
									};
									break;
								};

								case 'link': {
									editor.update(() => {
										const selection = $getSelection();
										if (!$isRangeSelection(selection)) {
											return;
										};

										for (const u of urls) {
											const textNode = $createTextNode(u.value);
											selection.insertNodes([ textNode ]);

											const space = $createTextNode(' ');
											selection.insertNodes([ space ]);
										};
									});
									break;
								};

								case 'cancel': {
									editor.update(() => {
										const selection = $getSelection();
										if ($isRangeSelection(selection)) {
											selection.insertRawText(text);
										};
									});
									break;
								};
							};

							editor.focus();
						},
					},
				});

				return true;
			},
			COMMAND_PRIORITY_NORMAL,
		);
	}, [ editor ]);

	return null;
};

const PasteImagePlugin = ({ onPasteFiles }: { onPasteFiles?: (files: File[]) => void }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		if (!onPasteFiles) {
			return;
		};

		return editor.registerCommand(
			PASTE_COMMAND,
			(event: ClipboardEvent) => {
				const clipboardData = event.clipboardData;
				if (!clipboardData) {
					return false;
				};

				const files = U.Common.getDataTransferFiles(Array.from(clipboardData.items));
				const imageFiles = files.filter((f: File) => f.type && f.type.startsWith('image/'));

				if (!imageFiles.length) {
					return false;
				};

				event.preventDefault();
				onPasteFiles(imageFiles);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor, onPasteFiles ]);

	return null;
};

const SlashMenuPlugin = ({ editorId, onSlashAction }: { editorId: string; onSlashAction?: (item: any) => void }) => {
	const [ editor ] = useLexicalComposerContext();
	const slashOffset = useRef(-1);
	const slashMenuContextRef = useRef<any>(null);
	const prevText = useRef('');
	const onSlashActionRef = useRef(onSlashAction);
	onSlashActionRef.current = onSlashAction;

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

				// Don't trigger slash menu inside code blocks
				const topLevel = node.getTopLevelElementOrThrow();
				if ($isCodeNode(topLevel)) {
					prevText.current = node.getTextContent();
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

						// Close selection toolbar before opening slash menu to prevent overlap
						if (S.Menu.isOpen('commentToolbar')) {
							S.Menu.close('commentToolbar');
						};

						openSlashMenu(editor, editorId, slashOffset, onSlashActionRef, slashMenuContextRef);
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
							const embedOptions = U.Menu.getBlockEmbed().map((it: any) => ({
								...it,
								action: 'embed',
								embedProcessor: it.id,
							}));
							const filtered: any[] = [];

							for (const section of allSections) {
								const matched = section.children.filter((it: any) => {
									if (it.arrow) {
										return false;
									};
									return (it.name || '').toLowerCase().includes(s) ||
										(it.description || '').toLowerCase().includes(s);
								});

								// Also match embed sub-options
								if (section.id === 'attachments') {
									const matchedEmbeds = embedOptions.filter((it: any) =>
										(it.name || '').toLowerCase().includes(s)
									);
									matched.push(...matchedEmbeds);
								};

								if (matched.length) {
									filtered.push({ ...section, children: matched });
								};
							};

							// Match type names for "create object" suggestions
							if (s.length >= 2) {
								const types = S.Record.checkHiddenObjects(
									S.Record.getTypes().filter((t: any) =>
										(t.name || '').toLowerCase().includes(s) &&
										!U.Object.isInFileOrSystemLayouts(t.recommendedLayout) &&
										!U.Object.isInSetLayouts(t.recommendedLayout) &&
										!U.Object.isParticipantLayout(t.recommendedLayout) &&
										!U.Object.isTemplateType(t.id)
									)
								).slice(0, 5);

								if (types.length) {
									const typeItems = types.map((t: any) => ({
										id: `createType-${t.id}`,
										action: 'createType',
										typeId: t.id,
										object: t,
										name: U.String.sprintf(translate('commentSlashMenuNewObject'), t.name),
										description: t.description || '',
									}));

									filtered.push({
										id: 'objects',
										name: translate('commonObjects'),
										children: typeItems,
									});
								};
							};

							menu.param.data.sections = U.Menu.sectionsMap(filtered);
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

const openSlashMenu = (editor: LexicalEditor, editorId: string, slashOffset: React.MutableRefObject<number>, onSlashActionRef: React.MutableRefObject<((item: any) => void) | undefined>, slashMenuContextRef: { current: any }) => {
	const rect = U.Dom.getSelectionRect();
	if (!rect) {
		return;
	};

	const removeSlashText = (filterLen: number) => {
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
	};

	const { param, data } = U.Menu.getCommentAddMenuParam(slashMenuContextRef);

	const closeAndHandle = (cb: () => void) => {
		const menu = S.Menu.get('commentAdd');
		const filterLen = menu ? String(menu.param.data.filter || '').length : 0;

		S.Menu.close('commentAdd');
		removeSlashText(filterLen);
		cb();
	};

	S.Menu.open('commentAdd', {
		...param,
		rect: { ...rect, y: rect.y + window.scrollY + 4, x: rect.x, width: 0, height: rect.height },
		vertical: I.MenuDirection.Bottom,
		horizontal: I.MenuDirection.Left,
		offsetY: 4,
		commonFilter: true,
		data: {
			...data,
			filter: '',
			noClose: true,
			onOver: (_e: any, item: any) => {
				if (!item.arrow) {
					S.Menu.closeAll([ 'typeSuggest', 'select' ]);
					return;
				};

				const context = slashMenuContextRef.current;
				if (context && item.itemId === 'embed') {
					U.Menu.openCommentEmbedMenu(context, (_e: any, embedItem: any) => {
						closeAndHandle(() => {
							onSlashActionRef.current?.({ action: embedItem.action, embedProcessor: embedItem.embedProcessor });
						});
					});
				};
			},
			onSelect: (_e: any, item: any) => {
				if (item.arrow) {
					return;
				};

				closeAndHandle(() => {
					if (item.action) {
						onSlashActionRef.current?.({ action: item.action, embedProcessor: item.embedProcessor, typeId: item.typeId });
					} else
					if (item.blockType === I.BlockType.Div) {
						onSlashActionRef.current?.({ type: item.blockType });
					} else
					if (item.textStyle !== undefined) {
						applyBlockTransform(editor, { style: item.textStyle, type: item.blockType });
					};
				});
			},
		},
	});
};

/**
 * Splits a paragraph at selection boundaries so that a block transform
 * only affects the selected portion, not the entire paragraph.
 */
const splitSelectionFromParagraph = (selection: any) => {
	if (!$isRangeSelection(selection) || selection.isCollapsed()) {
		return;
	};

	const anchor = selection.anchor;
	const focus = selection.focus;
	const anchorNode = anchor.getNode();
	const focusNode = focus.getNode();
	const anchorTopLevel = anchorNode.getTopLevelElementOrThrow();
	const focusTopLevel = focusNode.getTopLevelElementOrThrow();

	// Only split when selection is within a single paragraph
	if (anchorTopLevel !== focusTopLevel) {
		return;
	};

	if (anchorTopLevel.getType() !== 'paragraph') {
		return;
	};

	const paragraph = anchorTopLevel;
	const children = paragraph.getChildren();

	if (children.length <= 1) {
		return;
	};

	// Find child indices for anchor and focus
	const anchorChild = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParent();
	const focusChild = $isElementNode(focusNode) ? focusNode : focusNode.getParent();

	if (!anchorChild || !focusChild) {
		return;
	};

	const anchorIdx = children.indexOf(anchorChild === paragraph ? anchorNode : anchorChild);
	const focusIdx = children.indexOf(focusChild === paragraph ? focusNode : focusChild);

	if (anchorIdx === -1 || focusIdx === -1) {
		return;
	};

	const startIdx = Math.min(anchorIdx, focusIdx);
	const endIdx = Math.max(anchorIdx, focusIdx);

	// Don't split if the entire paragraph is selected
	if ((startIdx === 0) && (endIdx === children.length - 1)) {
		return;
	};

	// Split after the end of selection (if not at the last child)
	if (endIdx < children.length - 1) {
		$splitNode(paragraph, endIdx + 1);
	};

	// Split before the start of selection (if not at the first child)
	if (startIdx > 0) {
		const [ , afterNode ] = $splitNode(paragraph, startIdx);
		// Move selection into the new split node
		afterNode.selectStart();
		const sel = $getSelection();
		if ($isRangeSelection(sel)) {
			const lastChild = afterNode.getLastChild();
			if (lastChild) {
				if ($isTextNode(lastChild)) {
					sel.focus.set(lastChild.getKey(), lastChild.getTextContentSize(), 'text');
				} else {
					sel.focus.set(afterNode.getKey(), afterNode.getChildrenSize(), 'element');
				};
			};
		};
	};
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

		// Split paragraph at selection boundaries so transform only affects selected text
		if (item.style !== I.TextStyle.Paragraph) {
			splitSelectionFromParagraph(selection);
		};

		// Re-read selection after potential split
		const sel = $getSelection();
		if (!$isRangeSelection(sel)) {
			return;
		};

		switch (item.style) {
			case I.TextStyle.Header1:
			case I.TextStyle.Header2:
			case I.TextStyle.Header3: {
				const tag = styleToHeadingTag(item.style) as 'h1' | 'h2' | 'h3';
				$setBlocksType(sel, () => $createHeadingNode(tag));
				break;
			};

			case I.TextStyle.Quote: {
				$setBlocksType(sel, () => new QuoteNode());
				break;
			};

			case I.TextStyle.Code: {
				$setBlocksType(sel, () => $createCodeNode());
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
					$setBlocksType(sel, () => $createParagraphNode());
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
	const rect = U.Dom.getSelectionRect();
	if (!rect) {
		return;
	};

	const space = S.Common.space;
	const participantId = U.Space.getParticipantId(space, S.Auth.account?.id);

	S.Common.filterSet(0, '');

	S.Menu.open('blockMention', {
		classNameWrap: 'fromBlock',
		rect: { ...rect, y: rect.y + window.scrollY, x: rect.x, width: 0, height: rect.height },
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
				const filterText = String(S.Common.filter.text || '');
				const filterLen = filterText.length;

				editor.update(() => {
					const root = $getRoot();
					const children = root.getChildren();
					let found = false;

					// Find and remove @ + filter text
					for (const child of children) {
						if (!$isElementNode(child) || found) {
							continue;
						};

						for (const textChild of child.getChildren()) {
							if (!$isTextNode(textChild) || $isMentionNode(textChild)) {
								continue;
							};

							const text = textChild.getTextContent();
							const offset = mentionOffset.current;

							if ((offset >= 0) && (offset < text.length) && (text[offset] === '@')) {
								const before = text.slice(0, offset);
								const after = text.slice(offset + 1 + filterLen);
								textChild.setTextContent(before + after);
								textChild.select(before.length, before.length);
								found = true;
								break;
							};
						};
					};

					// Insert mention node
					const newSelection = $getSelection();
					if ($isRangeSelection(newSelection)) {
						const trimmedName = name.trim();
						const mentionNode = $createMentionNode(object.id, trimmedName);
						newSelection.insertNodes([ mentionNode ]);

						const spaceNode = $createTextNode(' ');
						mentionNode.insertAfter(spaceNode);
						spaceNode.select();
					};
				});

				mentionOffset.current = -1;
				editor.focus();
			},
		},
	});
};

const EmojiCommandPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			INSERT_EMOJI_COMMAND,
			({ emoji, code }) => {
				const selection = $getSelection();
				if ($isRangeSelection(selection)) {
					const emojiNode = new EmojiNode(emoji, code);
					selection.insertNodes([ emojiNode ]);
				};
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor ]);

	return null;
};

const ColonEmojiPlugin = ({ editorId }: { editorId: string }) => {
	const [ editor ] = useLexicalComposerContext();
	const prevText = useRef('');
	const colonOffset = useRef(-1);

	const closeEmojiMenu = useCallback(() => {
		if (S.Menu.isOpen('blockEmoji')) {
			S.Menu.close('blockEmoji');
		};
		colonOffset.current = -1;
	}, []);

	// Block Enter/Escape when blockEmoji menu is open
	// DOM preventDefault stops the browser beforeinput (no line break);
	// Lexical command handler stops Lexical's own paragraph insertion;
	// Event still bubbles to window where the menu's keydown handler selects the emoji.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (!S.Menu.isOpen('blockEmoji')) {
				return;
			};

			if ((e.key === 'Enter') || (e.key === 'Escape')) {
				e.preventDefault();
			};
		};

		const root = editor.getRootElement();
		if (root) {
			U.Dom.addEvent(root, 'keydown', onKeyDown, true);
			return () => U.Dom.removeEvent(root, 'keydown', onKeyDown, true);
		};
	}, [ editor ]);

	useEffect(() => {
		const unregisterEnter = editor.registerCommand(
			KEY_ENTER_COMMAND,
			() => {
				if (S.Menu.isOpen('blockEmoji')) {
					return true;
				};
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const unregisterEscape = editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				if (S.Menu.isOpen('blockEmoji')) {
					closeEmojiMenu();
					return true;
				};
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			unregisterEnter();
			unregisterEscape();
		};
	}, [ editor, closeEmojiMenu ]);

	useEffect(() => {
		const onKeyUp = (e: KeyboardEvent) => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node)) {
					prevText.current = '';
					closeEmojiMenu();
					return;
				};

				const text = node.getTextContent();
				const offset = anchor.offset;
				const menuOpen = S.Menu.isOpen('blockEmoji');

				// Trigger emoji menu on : character
				if ((offset > 0) && (text[offset - 1] === ':') && (text !== prevText.current) && !menuOpen) {
					const charBefore = offset > 1 ? text[offset - 2] : '';
					if (!charBefore || [ ' ', '\n', '(', '[', '"', '\'' ].includes(charBefore)) {
						colonOffset.current = offset - 1;
						openColonEmojiMenu(editor, editorId, colonOffset);
					};
				};

				// Update filter text while emoji menu is open
				if (menuOpen && (colonOffset.current >= 0)) {
					// Close if : was deleted
					if ((offset <= colonOffset.current) || (text[colonOffset.current] !== ':')) {
						closeEmojiMenu();
					} else {
						const filterStart = colonOffset.current + 1;
						const filterText = text.slice(filterStart, offset);

						if (filterText.includes(' ')) {
							closeEmojiMenu();
						} else {
							S.Common.filterSetText(filterText);
						};
					};
				};

				prevText.current = text;
			});
		};

		const root = editor.getRootElement();
		if (root) {
			U.Dom.addEvent(root, 'keyup', onKeyUp);
			return () => U.Dom.removeEvent(root, 'keyup', onKeyUp);
		};
	}, [ editor, editorId, closeEmojiMenu ]);

	return null;
};

const openColonEmojiMenu = (editor: LexicalEditor, editorId: string, colonOffset: React.MutableRefObject<number>) => {
	const rect = U.Dom.getSelectionRect();
	if (!rect) {
		return;
	};

	S.Common.filterSet(0, '');

	S.Menu.open('blockEmoji', {
		classNameWrap: 'fromBlock',
		rect: { ...rect, y: rect.y + window.scrollY, x: rect.x, width: 0, height: rect.height },
		vertical: I.MenuDirection.Top,
		horizontal: I.MenuDirection.Left,
		offsetY: -4,
		commonFilter: true,
		noAnimation: true,
		data: {
			marks: [],
			onChange: (native: string) => {
				const filterText = String(S.Common.filter.text || '');
				const filterLen = filterText.length;

				editor.update(() => {
					const root = $getRoot();
					const children = root.getChildren();
					let found = false;

					// Find and remove : + filter text
					for (const child of children) {
						if (!$isElementNode(child) || found) {
							continue;
						};

						for (const textChild of child.getChildren()) {
							if (!$isTextNode(textChild)) {
								continue;
							};

							const text = textChild.getTextContent();
							const offset = colonOffset.current;

							if ((offset >= 0) && (offset < text.length) && (text[offset] === ':')) {
								const before = text.slice(0, offset);
								const after = text.slice(offset + 1 + filterLen);
								textChild.setTextContent(before + after);
								textChild.select(before.length, before.length);
								found = true;
								break;
							};
						};
					};

					// Insert emoji node
					const newSelection = $getSelection();
					if ($isRangeSelection(newSelection)) {
						const code = U.Smile.getCode(native);
						if (code) {
							const emojiNode = new EmojiNode(native, code);
							newSelection.insertNodes([ emojiNode ]);

							const spaceNode = $createTextNode(' ');
							emojiNode.insertAfter(spaceNode);
							spaceNode.select();
						} else {
							newSelection.insertText(native + ' ');
						};
					};
				});

				colonOffset.current = -1;
				editor.focus();
			},
		},
	});
};

const MarkdownSequences: { pattern: RegExp; style: I.TextStyle }[] = [
	{ pattern: /^\[]\s/,		style: I.TextStyle.Checkbox },
	{ pattern: /^###\s/,		style: I.TextStyle.Header3 },
	{ pattern: /^##\s/,		style: I.TextStyle.Header2 },
	{ pattern: /^#\s/,			style: I.TextStyle.Header1 },
	{ pattern: /^[*\-+]\s/,	style: I.TextStyle.Bulleted },
	{ pattern: /^1\.\s/,		style: I.TextStyle.Numbered },
	{ pattern: /^"\s/,			style: I.TextStyle.Quote },
	{ pattern: /^>\s/,			style: I.TextStyle.Quote },
	{ pattern: /^```/,			style: I.TextStyle.Code },
];

const MarkdownPlugin = () => {
	const [ editor ] = useLexicalComposerContext();
	const prevText = useRef('');

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
					return;
				};

				const topLevel = node.getTopLevelElementOrThrow();

				// Only apply to plain paragraph nodes
				if (!($isElementNode(topLevel) && topLevel.getType() === 'paragraph')) {
					prevText.current = node.getTextContent();
					return;
				};

				const text = node.getTextContent();

				// Only trigger when new text was added
				if (text === prevText.current) {
					prevText.current = text;
					return;
				};

				for (const { pattern, style } of MarkdownSequences) {
					if (!pattern.test(text)) {
						continue;
					};

					const remaining = text.replace(pattern, '');
					const nodeKey = node.getKey();

					editor.update(() => {
						const current = $getNodeByKey(nodeKey);

						if ($isTextNode(current)) {
							current.setTextContent(remaining);
							current.select(0, 0);
						};
					}, { onUpdate: () => {
						applyBlockTransform(editor, { style });
					}});

					prevText.current = '';
					return;
				};

				prevText.current = text;
			});
		});

		return removeListener;
	}, [ editor ]);

	return null;
};

const InlineMarkdownPatterns: { reg: RegExp; format?: TextFormatType; isLink?: boolean }[] = [
	{ reg: /(?:^|[\s(\[{])(`[^`]+`)$/, format: 'code' },
	{ reg: /(?:^|[\s(\[{])(\*\*[^*]+\*\*)$/, format: 'bold' },
	{ reg: /(?:^|[\s(\[{])(__[^_]+__)$/, format: 'bold' },
	{ reg: /(?:^|[\s(\[{])(~~[^~]+~~)$/, format: 'strikethrough' },
	{ reg: /(?:^|[\s(\[{])(\*[^*]+\*)$/, format: 'italic' },
	{ reg: /(?:^|[\s(\[{])(_[^_]+_)$/, format: 'italic' },
	{ reg: /(?:^|[\s(\[{])(\[[^\]]+\]\([^)]+\))$/, isLink: true },
];

const InlineMarkdownPlugin = () => {
	const [ editor ] = useLexicalComposerContext();
	const prevText = useRef('');

	useEffect(() => {
		const removeListener = editor.registerUpdateListener(({ editorState, prevEditorState }) => {
			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				if (!$isTextNode(node) || $isMentionNode(node) || (node instanceof LinkTextNode)) {
					prevText.current = '';
					return;
				};

				// Don't apply inside code blocks
				const topLevel = node.getTopLevelElementOrThrow();
				if ($isCodeNode(topLevel)) {
					prevText.current = node.getTextContent();
					return;
				};

				const text = node.getTextContent();
				const offset = anchor.offset;

				if (text === prevText.current) {
					prevText.current = text;
					return;
				};

				// Only check the text up to cursor
				const textToCursor = text.slice(0, offset);

				for (const { reg, format, isLink } of InlineMarkdownPatterns) {
					const match = textToCursor.match(reg);
					if (!match) {
						continue;
					};

					const fullMatch = match[1];
					const matchStart = textToCursor.lastIndexOf(fullMatch);

					if (isLink) {
						// Parse [text](url)
						const linkMatch = fullMatch.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
						if (!linkMatch) {
							continue;
						};

						const linkText = linkMatch[1];
						const linkUrl = linkMatch[2];

						editor.update(() => {
							const before = text.slice(0, matchStart);
							const after = text.slice(matchStart + fullMatch.length);

							node.setTextContent(before + after);

							const linkNode = new LinkTextNode(linkUrl, I.MarkType.Link, linkText);
							linkNode.setFormat(node.getFormat());

							if (before) {
								const beforeNode = $createTextNode(before);
								beforeNode.setFormat(node.getFormat());
								node.replace(beforeNode);
								beforeNode.insertAfter(linkNode);

								if (after) {
									const afterNode = $createTextNode(after);
									afterNode.setFormat(node.getFormat());
									linkNode.insertAfter(afterNode);
									afterNode.select(0, 0);
								} else {
									const spaceNode = $createTextNode(' ');
									linkNode.insertAfter(spaceNode);
									spaceNode.select(1, 1);
								};
							} else {
								node.replace(linkNode);

								if (after) {
									const afterNode = $createTextNode(after);
									afterNode.setFormat(node.getFormat());
									linkNode.insertAfter(afterNode);
									afterNode.select(0, 0);
								} else {
									const spaceNode = $createTextNode(' ');
									linkNode.insertAfter(spaceNode);
									spaceNode.select(1, 1);
								};
							};
						});

						prevText.current = '';
						return;
					};

					// Inline formatting (bold, italic, code, strikethrough)
					const delimLen = (fullMatch.startsWith('**') || fullMatch.startsWith('__') || fullMatch.startsWith('~~')) ? 2 : 1;
					const inner = fullMatch.slice(delimLen, -delimLen);

					if (!inner || !inner.trim()) {
						continue;
					};

					editor.update(() => {
						const before = text.slice(0, matchStart);
						const after = text.slice(matchStart + fullMatch.length);
						const newText = before + inner + after;

						node.setTextContent(newText);

						// Split into: before (plain) + inner (formatted) + after (plain)
						const parts: TextNode[] = [];
						let cursorNode: TextNode = node;

						if (before) {
							const beforeNode = $createTextNode(before);
							beforeNode.setFormat(node.getFormat());
							parts.push(beforeNode);
						};

						const formattedNode = $createTextNode(inner);
						formattedNode.setFormat(node.getFormat());
						formattedNode.toggleFormat(format);
						parts.push(formattedNode);
						cursorNode = formattedNode;

						if (after) {
							const afterNode = $createTextNode(after);
							afterNode.setFormat(node.getFormat());
							parts.push(afterNode);
							cursorNode = afterNode;
						};

						if (parts.length > 0) {
							const first = parts[0];
							node.replace(first);

							let prev = first;
							for (let i = 1; i < parts.length; i++) {
								prev.insertAfter(parts[i]);
								prev = parts[i];
							};

							if (after) {
								cursorNode.select(0, 0);
							} else {
								// Place cursor at end of formatted node, add trailing space
								const spaceNode = $createTextNode(' ');
								cursorNode.insertAfter(spaceNode);
								spaceNode.select(1, 1);
							};
						};
					});

					prevText.current = '';
					return;
				};

				prevText.current = text;
			});
		});

		return removeListener;
	}, [ editor ]);

	return null;
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

const HeadingExitPlugin = () => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(e: KeyboardEvent | null) => {
				if (e?.shiftKey) {
					return false;
				};

				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					return false;
				};

				const anchor = selection.anchor;
				const node = anchor.getNode();
				const topLevel = node.getTopLevelElementOrThrow();

				if (!$isHeadingNode(topLevel)) {
					return false;
				};

				e?.preventDefault();

				const atEnd = (node === topLevel.getLastChild()) && (anchor.offset === node.getTextContentSize());

				if (atEnd) {
					const paragraph = $createParagraphNode();
					paragraph.append($createTextNode(''));
					topLevel.insertAfter(paragraph);
					paragraph.select();
				} else {
					selection.insertParagraph();

					const newSelection = $getSelection();
					if ($isRangeSelection(newSelection)) {
						const newNode = newSelection.anchor.getNode();
						const newTopLevel = newNode.getTopLevelElementOrThrow();

						if ($isHeadingNode(newTopLevel)) {
							const paragraph = $createParagraphNode();
							newTopLevel.getChildren().forEach((child) => paragraph.append(child));
							newTopLevel.replace(paragraph);
							paragraph.selectStart();
						};
					};
				};

				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor ]);

	return null;
};

const MaxLengthPlugin = ({ maxLength }: { maxLength: number }) => {
	const [ editor ] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerNodeTransform(TextNode, () => {
			const root = $getRoot();
			const text = root.getTextContent();
			const length = text.length;

			if (length <= maxLength) {
				return;
			};

			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			};

			const overflow = length - maxLength;
			const { anchor } = selection;

			$trimTextContentFromAnchor(editor, anchor, overflow);
		});
	}, [ editor, maxLength ]);

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
			classNameWrap: 'fromBlock',
			element: e.currentTarget as HTMLElement,
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

	const { rootId, subId, placeholder, initialParts, readonly, maxLength, onSubmit, onCancel, onEmpty, onChange, onFocus, onBlur, onSlashAction, onPasteFiles } = props;
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
			const hasAttachments = root.getChildren().some(n => (n instanceof AttachmentNode) || (n instanceof EmbedNode));
			empty = !text && !hasAttachments;
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
					const text = $createTextNode('');
					p.append(text);
					root.append(p);
					text.select(0, 0);

					// Reset any active text formats
					const sel = $getSelection();
					if ($isRangeSelection(sel)) {
						sel.format = 0;
					};
				});
				linkUrlMap.clear();
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

		insertEmoji: (icon: string) => {
			const code = U.Smile.getCode(icon);
			if (code) {
				editorRef.current?.dispatchCommand(INSERT_EMOJI_COMMAND, { emoji: icon, code });
			} else {
				editorRef.current?.update(() => {
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						selection.insertText(icon);
					};
				});
			};
		},

		insertEmbed: (processor: I.EmbedProcessor, text: string) => {
			editorRef.current?.dispatchCommand(INSERT_EMBED_COMMAND, { processor, text });
		},

		insertAttachment: (data: any) => {
			editorRef.current?.dispatchCommand(INSERT_ATTACHMENT_COMMAND, data);
		},

		insertSourceQuote: (part: I.CommentContentPart) => {
			const editor = editorRef.current;
			if (!editor || !part) {
				return;
			};

			const sourceBlockId = part.editorQuote?.blockId || '';
			const sourceMessageId = part.messageQuote?.messageId || '';
			// Clamp text length to the form's maxLength so the MaxLengthPlugin's
			// transform doesn't fire mid-insert and trim our own quote text.
			const limit = (maxLength && maxLength > 0) ? maxLength : Number.MAX_SAFE_INTEGER;
			const rawText = String(part.text || '');
			const text = rawText.length > limit ? rawText.slice(0, limit) : rawText;
			const length = text.length;
			// Filter marks defensively: must have a valid range strictly inside
			// the (clamped) quoted text — Lexical's createFormattedNodes uses
			// mark boundaries as segmentation points and gets confused by
			// negative, zero-width, or out-of-range ranges.
			const marks = (part.marks || []).filter(m => {
				if (!m || !m.range) {
					return false;
				};
				const { from, to } = m.range;
				return (from >= 0) && (to > from) && (from < length);
			}).map(m => ({
				...m,
				range: { from: m.range.from, to: Math.min(length, m.range.to) },
			}));

			editor.update(() => {
				const root = $getRoot();
				const quote = $createSourceQuoteNode(sourceBlockId, sourceMessageId);
				quote.append(...createFormattedNodes(text, marks));

				// Prepend the quote at the top of the document.
				const first = root.getFirstChild();
				if (first) {
					first.insertBefore(quote);
				} else {
					root.append(quote);
				};

				// Always create a fresh empty paragraph right after the quote
				// and put the caret in it. This guarantees the user starts
				// typing in a new text block, never inside the quote at offset 0.
				const p = $createParagraphNode();
				const t = $createTextNode('');
				p.append(t);
				quote.insertAfter(p);

				const sel = $createRangeSelection();
				sel.anchor.set(t.getKey(), 0, 'text');
				sel.focus.set(t.getKey(), 0, 'text');
				$setSelection(sel);
			});

			// Wait for the DOM to commit before focusing — otherwise focus()
			// can fire before the new paragraph exists in the contenteditable
			// and the cursor lands at the previous (now-stale) selection.
			raf(() => editor.focus());
		},

		removeAttachment: (key: string) => {
			editorRef.current?.dispatchCommand(REMOVE_ATTACHMENT_COMMAND, key);
		},

		updateAttachment: (id: string, data: any) => {
			editorRef.current?.dispatchCommand(UPDATE_ATTACHMENT_COMMAND, { id, data });
		},

		getAttachments: () => {
			const editor = editorRef.current;
			if (!editor) {
				return [];
			};

			const result: any[] = [];
			editor.getEditorState().read(() => {
				const root = $getRoot();
				for (const node of root.getChildren()) {
					if (node instanceof AttachmentNode) {
						result.push(node.getAttachmentData());
					};
				};
			});
			return result;
		},

		clearAttachments: () => {
			const editor = editorRef.current;
			if (editor) {
				editor.update(() => {
					const root = $getRoot();
					for (const node of root.getChildren()) {
						if (node instanceof AttachmentNode) {
							node.remove();
						};
					};
				});
			};
		},
	}));

	const initialConfig = {
		namespace: 'CommentEditor',
		theme,
		nodes: [ HeadingNode, QuoteNode, SourceQuoteNode, ListNode, ListItemNode, CodeNode, CodeHighlightNode, HorizontalRuleNode, MentionNode, LinkTextNode, AttachmentNode, EmbedNode, EmojiNode ],
		onError: (error: Error) => {
			console.error('[CommentEditor]', error);
		},
		editable: !readonly,
	};

	return (
		<CommentSubIdContext.Provider value={subId || ''}>
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
				<FormattingPlugin editorId={editorId} />
				<SelectionToolbarPlugin />
				<FocusPlugin onFocus={onFocus} onBlur={onBlur} />
				<InitialPartsPlugin parts={initialParts} />
				<EditorRefPlugin editorRef={editorRef} />
				<HorizontalRulePlugin />
				<AttachmentPlugin />
				<EmbedPlugin />
				<PasteUrlPlugin rootId={rootId} />
				<PasteImagePlugin onPasteFiles={onPasteFiles} />
				<SlashMenuPlugin editorId={editorId} onSlashAction={onSlashAction} />
				<MentionPlugin editorId={editorId} />
				<EmojiCommandPlugin />
				<ColonEmojiPlugin editorId={editorId} />
				<MarkdownPlugin />
				<InlineMarkdownPlugin />
				<CodeHighlightPlugin />
				<CodeExitPlugin />
				<HeadingExitPlugin />
				<CodeBlockPlugin />
				{maxLength ? <MaxLengthPlugin maxLength={maxLength} /> : null}
			</div>
		</LexicalComposer>
		</CommentSubIdContext.Provider>
	);
});

export default CommentEditor;
