import React, { forwardRef, useRef, useState, useImperativeHandle, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, U, translate } from 'Lib';
import CommentEditor from 'Component/form/commentEditor';

interface Props {
	rootId: string;
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	isEdit?: boolean;
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[]) => void;
	onCancel?: () => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
};

const CommentForm = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { placeholder, initialParts, isEdit, readonly, onSubmit, onCancel } = props;
	const editorRef = useRef<any>(null);
	const [ isEmpty, setIsEmpty ] = useState(true);
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isMultiline, setIsMultiline ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);

	useImperativeHandle(ref, () => ({
		focus: () => editorRef.current?.focus(),
		clear: () => {
			editorRef.current?.clear();
			setIsEmpty(true);
			setIsLoading(false);
			setIsMultiline(false);
		},
	}));

	const handleSubmit = useCallback((parts: I.CommentContentPart[]) => {
		if (isLoading) {
			return;
		};

		setIsLoading(true);
		onSubmit?.(parts);

		if (!isEdit) {
			editorRef.current?.clear();
			setIsEmpty(true);
			setIsLoading(false);
			setIsMultiline(false);
		};
	}, [ onSubmit, isEdit, isLoading ]);

	const handleEmpty = useCallback((v: boolean) => {
		setIsEmpty(v);
		checkMultiline();
	}, []);

	const handleFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
		// Delay blur to allow button clicks to register
		window.setTimeout(() => setIsFocused(false), 200);
	}, []);

	const handleSelectionChange = useCallback((hasSelection: boolean, rect: DOMRect | null) => {
		if (hasSelection && rect) {
			openToolbar(rect);
		} else {
			S.Menu.close('commentToolbar');
		};
	}, []);

	const openToolbar = useCallback((rect: DOMRect) => {
		if (S.Menu.isOpen('commentToolbar')) {
			return;
		};

		const win = $(window);

		S.Menu.open('commentToolbar', {
			rect: { ...rect, y: rect.y + win.scrollTop(), width: rect.width, height: 0 },
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Center,
			offsetY: -8,
			noAnimation: true,
			noDimmer: true,
			passThrough: true,
			data: {
				editorRef,
				onToggleFormat: (format: string) => {
					editorRef.current?.toggleFormat(format);
				},
				onSetBlockStyle: (style: I.TextStyle) => {
					editorRef.current?.setBlockStyle(style);
					S.Menu.close('commentToolbar');
				},
				getCurrentBlockStyle: () => {
					return editorRef.current?.getCurrentBlockStyle() || I.TextStyle.Paragraph;
				},
				getActiveFormats: () => {
					return {};
				},
			},
		});
	}, []);

	const checkMultiline = useCallback(() => {
		const lineCount = editorRef.current?.getLineCount() || 0;
		setIsMultiline(lineCount >= 2);
	}, []);

	const onPlusClick = useCallback(() => {
		const editor = editorRef.current?.getEditor();
		if (!editor) {
			return;
		};

		const rootEl = editor.getRootElement();
		if (!rootEl) {
			return;
		};

		const rect = rootEl.getBoundingClientRect();
		const win = $(window);

		S.Menu.open('commentAdd', {
			rect: { x: rect.right, y: rect.bottom + win.scrollTop(), width: 0, height: 0 },
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			noAnimation: true,
			data: {
				editor,
				onSelect: (item: any) => {
					if (item.type === I.BlockType.Div) {
						editorRef.current?.insertDivider();
					} else
					if (item.style !== undefined) {
						editorRef.current?.setBlockStyle(item.style);
					};

					editorRef.current?.focus();
				},
			},
		});
	}, []);

	const onSlashClick = useCallback(() => {
		// Focus editor and simulate typing /
		const editor = editorRef.current?.getEditor();
		if (!editor) {
			return;
		};

		editor.focus();
		onPlusClick();
	}, []);

	if (readonly) {
		return null;
	};

	const isDisabled = isEmpty || isLoading;
	const showButtons = isFocused || !isEmpty || isEdit;

	const cn = [ 'commentForm' ];
	if (isEdit) cn.push('isEdit');
	if (isFocused) cn.push('isFocused');
	if (!isEmpty) cn.push('hasContent');
	if (isMultiline) cn.push('isMultiline');

	return (
		<div className={cn.join(' ')}>
			<div className="editorRow">
				<div className="editorWrap">
					<CommentEditor
						ref={editorRef}
						placeholder={placeholder || translate('commentPlaceholder')}
						initialParts={initialParts}
						onSubmit={handleSubmit}
						onCancel={onCancel}
						onEmpty={handleEmpty}
						onFocus={handleFocus}
						onBlur={handleBlur}
						onSelectionChange={handleSelectionChange}
					/>
				</div>

				{showButtons ? (
					<div className="sideButtons">
						{(isFocused || !isEmpty) ? (
							<div className="btn plus" onClick={onPlusClick}>
								<Icon className="plus" />
							</div>
						) : ''}

						{!isEmpty ? (
							<div
								className={[ 'btn', 'send', (isDisabled ? 'disabled' : '') ].join(' ')}
								onClick={() => {
									if (isDisabled) {
										return;
									};

									const parts = editorRef.current?.getParts();
									if (parts) {
										handleSubmit(parts);
									};
								}}
							>
								<Icon className="send" />
							</div>
						) : ''}
					</div>
				) : ''}
			</div>

			{isMultiline && isFocused ? (
				<div className="bottomToolbar">
					<div className="toolbarLeft">
						<div className="toolbarBtn" onClick={onSlashClick}>
							<Icon className="slash" />
						</div>
					</div>

					<div className="toolbarRight">
						{isEdit && onCancel ? (
							<div className="btn cancel" onClick={onCancel}>
								{translate('commonCancel')}
							</div>
						) : ''}
					</div>
				</div>
			) : ''}

			{isEdit && !isMultiline ? (
				<div className="editButtons">
					{onCancel ? (
						<div className="btn cancel" onClick={onCancel}>
							{translate('commonCancel')}
						</div>
					) : ''}
				</div>
			) : ''}
		</div>
	);
}));

export default CommentForm;
