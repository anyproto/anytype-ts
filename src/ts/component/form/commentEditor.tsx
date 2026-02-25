import React, { forwardRef, useRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
	$getRoot,
	$createParagraphNode,
	$createTextNode,
	$isElementNode,
	$isTextNode,
	FORMAT_TEXT_COMMAND,
	FOCUS_COMMAND,
	BLUR_COMMAND,
	COMMAND_PRIORITY_HIGH,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	EditorState,
	LexicalEditor,
	TextFormatType,
} from 'lexical';
import { I, keyboard } from 'Lib';

interface Props {
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[]) => void;
	onCancel?: () => void;
	onEmpty?: (isEmpty: boolean) => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
	getParts: () => I.CommentContentPart[];
	setParts: (parts: I.CommentContentPart[]) => void;
	isEmpty: () => boolean;
};

const theme = {
	paragraph: 'commentEditor-paragraph',
	text: {
		bold: 'commentEditor-bold',
		italic: 'commentEditor-italic',
		underline: 'commentEditor-underline',
		strikethrough: 'commentEditor-strikethrough',
		code: 'commentEditor-code',
	},
};

/**
 * Converts Lexical EditorState to CommentContentPart array.
 */
const editorStateToParts = (editor: LexicalEditor): I.CommentContentPart[] => {
	const parts: I.CommentContentPart[] = [];

	editor.getEditorState().read(() => {
		const root = $getRoot();
		const paragraphs = root.getChildren();

		for (const paragraph of paragraphs) {
			let text = '';
			const marks: I.Mark[] = [];

			if (!$isElementNode(paragraph)) {
				continue;
			};

			const children = paragraph.getChildren();

			for (const child of children) {
				const childText = child.getTextContent();
				const start = text.length;
				const end = start + childText.length;

				if ($isTextNode(child)) {
					if (child.hasFormat('bold')) {
						marks.push({ type: I.MarkType.Bold, range: { from: start, to: end }, param: '' });
					};
					if (child.hasFormat('italic')) {
						marks.push({ type: I.MarkType.Italic, range: { from: start, to: end }, param: '' });
					};
					if (child.hasFormat('strikethrough')) {
						marks.push({ type: I.MarkType.Strike, range: { from: start, to: end }, param: '' });
					};
					if (child.hasFormat('underline')) {
						marks.push({ type: I.MarkType.Underline, range: { from: start, to: end }, param: '' });
					};
					if (child.hasFormat('code')) {
						marks.push({ type: I.MarkType.Code, range: { from: start, to: end }, param: '' });
					};
				};

				text += childText;
			};

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
 * Populates a Lexical editor with CommentContentPart array content.
 */
const partsToEditor = (editor: LexicalEditor, parts: I.CommentContentPart[]) => {
	editor.update(() => {
		const root = $getRoot();
		root.clear();

		if (!parts || !parts.length) {
			const p = $createParagraphNode();
			p.append($createTextNode(''));
			root.append(p);
			return;
		};

		for (const part of parts) {
			const p = $createParagraphNode();
			const text = part.text || '';

			if (!part.marks || !part.marks.length) {
				p.append($createTextNode(text));
			} else {
				// Build segments based on mark boundaries
				const boundaries = new Set<number>();
				boundaries.add(0);
				boundaries.add(text.length);

				for (const mark of part.marks) {
					boundaries.add(mark.range.from);
					boundaries.add(mark.range.to);
				};

				const sorted = [...boundaries].sort((a, b) => a - b);

				for (let i = 0; i < sorted.length - 1; i++) {
					const from = sorted[i];
					const to = sorted[i + 1];
					const segment = text.slice(from, to);

					if (!segment) {
						continue;
					};

					const node = $createTextNode(segment);

					for (const mark of part.marks) {
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

					p.append(node);
				};
			};

			root.append(p);
		};
	});
};

/**
 * Plugin to handle Enter to submit and Shift+Enter for newline.
 */
const SubmitPlugin = ({ onSubmit }: { onSubmit?: () => void }) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(e: KeyboardEvent) => {
				if (e && e.shiftKey) {
					return false;
				};

				e?.preventDefault();
				onSubmit?.();
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [ editor, onSubmit ]);

	return null;
};

/**
 * Plugin to handle Escape to cancel.
 */
const EscapePlugin = ({ onCancel }: { onCancel?: () => void }) => {
	const [editor] = useLexicalComposerContext();

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

/**
 * Plugin to handle keyboard shortcuts for formatting.
 */
const FormattingPlugin = () => {
	const [editor] = useLexicalComposerContext();

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

/**
 * Plugin to manage keyboard focus state so editor shortcuts don't conflict.
 */
const FocusPlugin = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterFocus = editor.registerCommand(
			FOCUS_COMMAND,
			() => {
				keyboard.setFocus(true);
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const unregisterBlur = editor.registerCommand(
			BLUR_COMMAND,
			() => {
				keyboard.setFocus(false);
				return false;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			unregisterFocus();
			unregisterBlur();
		};
	}, [ editor ]);

	return null;
};

/**
 * Bridge plugin to expose editor ref.
 */
const EditorRefPlugin = ({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditor | null> }) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editorRef.current = editor;
	}, [ editor ]);

	return null;
};

const CommentEditor = forwardRef<RefProps, Props>((props, ref) => {

	const { placeholder, initialParts, readonly, onSubmit, onCancel, onEmpty } = props;
	const editorRef = useRef<LexicalEditor | null>(null);
	const isEmptyRef = useRef(true);

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
	}, [ onEmpty ]);

	const handleSubmit = useCallback(() => {
		if (checkEmpty()) {
			return;
		};

		const parts = editorStateToParts(editorRef.current);
		onSubmit?.(parts);
	}, [ onSubmit ]);

	useImperativeHandle(ref, () => ({
		focus: () => {
			const editor = editorRef.current;
			if (editor) {
				editor.focus();
			};
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
			if (!editorRef.current) {
				return [];
			};
			return editorStateToParts(editorRef.current);
		},

		setParts: (parts: I.CommentContentPart[]) => {
			if (editorRef.current) {
				partsToEditor(editorRef.current, parts);
			};
		},

		isEmpty: () => checkEmpty(),
	}));

	const initialConfig = {
		namespace: 'CommentEditor',
		theme,
		onError: (error: Error) => {
			console.error('[CommentEditor]', error);
		},
		editable: !readonly,
		editorState: () => {
			if (initialParts && initialParts.length) {
				partsToEditor(editorRef.current, initialParts);
			};
		},
	};

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="commentEditorWrap">
				<RichTextPlugin
					contentEditable={<ContentEditable className="commentEditorInput" />}
					placeholder={<div className="commentEditorPlaceholder">{placeholder || ''}</div>}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<HistoryPlugin />
				<OnChangePlugin onChange={handleChange} />
				<SubmitPlugin onSubmit={handleSubmit} />
				<EscapePlugin onCancel={onCancel} />
				<FormattingPlugin />
				<FocusPlugin />
				<EditorRefPlugin editorRef={editorRef} />
			</div>
		</LexicalComposer>
	);
});

export default CommentEditor;
