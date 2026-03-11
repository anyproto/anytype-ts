import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, J, S, U, translate } from 'Lib';
import CommentEditor from 'Component/form/commentEditor';
import Attachment from 'Component/block/chat/attachment';

interface Props {
	rootId: string;
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	isEdit?: boolean;
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[], attachments?: I.ChatMessageAttachment[]) => void;
	onCancel?: () => void;
	onResize?: () => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
};

const CommentForm = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, placeholder, initialParts, isEdit, readonly, onSubmit, onCancel, onResize } = props;
	const editorRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLDivElement>(null);
	const [ isEmpty, setIsEmpty ] = useState(true);
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isMultiline, setIsMultiline ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const [ attachments, setAttachments ] = useState<any[]>([]);
	const electron = U.Common.getElectron();

	useImperativeHandle(ref, () => ({
		focus: () => editorRef.current?.focus(),
		clear: () => {
			editorRef.current?.clear();
			setIsEmpty(true);
			setIsLoading(false);
			setIsMultiline(false);
			setAttachments([]);
		},
	}));

	const getAttachmentType = useCallback((layout: I.ObjectLayout): I.AttachmentType => {
		switch (layout) {
			case I.ObjectLayout.Bookmark: return I.AttachmentType.Link;
			case I.ObjectLayout.Image: return I.AttachmentType.Image;
			default: return I.AttachmentType.File;
		};
	}, []);

	const uploadFiles = useCallback((list: any[], callBack: (uploaded: I.ChatMessageAttachment[]) => void) => {
		const files = list.filter(it => it.isTmp);
		const existing = list.filter(it => !it.isTmp).map(it => ({
			target: it.id,
			type: getAttachmentType(it.layout),
		}));

		if (!files.length) {
			callBack(existing);
			return;
		};

		let n = 0;
		const uploaded: I.ChatMessageAttachment[] = [ ...existing ];

		for (const item of files) {
			C.FileUpload(
				S.Common.space,
				'',
				item.path,
				I.FileType.None,
				{},
				false,
				'',
				0,
				rootId,
				'',
				(message: any) => {
					n++;

					if (message.objectId) {
						uploaded.push({
							target: message.objectId,
							type: getAttachmentType(item.layout),
						});
					};

					if (n === files.length) {
						callBack(uploaded);
					};
				},
			);
		};
	}, [ rootId ]);

	const handleSubmit = useCallback((parts: I.CommentContentPart[]) => {
		if (isLoading) {
			return;
		};

		setIsLoading(true);

		if (attachments.length) {
			uploadFiles(attachments, (uploaded) => {
				onSubmit?.(parts, uploaded);

				if (!isEdit) {
					editorRef.current?.clear();
					setIsEmpty(true);
					setIsLoading(false);
					setIsMultiline(false);
					setAttachments([]);
				};
			});
		} else {
			onSubmit?.(parts);

			if (!isEdit) {
				editorRef.current?.clear();
				setIsEmpty(true);
				setIsLoading(false);
				setIsMultiline(false);
			};
		};
	}, [ onSubmit, isEdit, isLoading, attachments ]);

	const handleEmpty = useCallback((v: boolean) => {
		setIsEmpty(v);
		checkMultiline();
	}, []);

	const handleFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
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
				onToggleFormat: (format: string) => {
					editorRef.current?.toggleFormat(format);
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

	const addAttachmentFiles = useCallback((files: File[]) => {
		const limit = J.Constant.limit.chat.attachments;
		const list: any[] = [];

		for (const file of files) {
			const path = electron.webFilePath ? electron.webFilePath(file) : '';
			const mime = file.type || '';
			const ext = path ? (electron.fileExt ? electron.fileExt(path) : '') : '';

			let layout = I.ObjectLayout.File;

			if (mime) {
				const [ t1, t2 ] = mime.split('/');
				if ((t1 === 'image') && J.Constant.fileExtension.image.includes(t2)) {
					layout = I.ObjectLayout.Image;
				};
			};

			list.push({
				id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				name: file.name,
				layout,
				sizeInBytes: file.size,
				fileExt: ext,
				isTmp: true,
				mime,
				path,
				file,
			});
		};

		const newList = [ ...attachments, ...list ].slice(0, limit);
		setAttachments(newList);
	}, [ attachments ]);

	const onAttachmentRemove = useCallback((id: string) => {
		setAttachments(attachments.filter(it => it.id !== id));
	}, [ attachments ]);

	const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (files.length) {
			addAttachmentFiles(files);
		};

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		};
	}, [ addAttachmentFiles ]);

	const openFilePicker = useCallback((accept?: string) => {
		if (fileInputRef.current) {
			fileInputRef.current.accept = accept || '';
			fileInputRef.current.click();
		};
	}, []);

	const handleSlashAction = useCallback((item: any) => {
		if (item.action) {
			switch (item.action) {
				case 'image': {
					openFilePicker('image/*');
					break;
				};

				case 'file': {
					openFilePicker();
					break;
				};

				case 'object':
				case 'latex':
				case 'mermaid': {
					break;
				};
			};
		} else
		if (item.type === I.BlockType.Div) {
			editorRef.current?.insertDivider();
		} else
		if (item.style !== undefined) {
			editorRef.current?.setBlockStyle(item.style);
		};

		editorRef.current?.focus();
	}, [ openFilePicker ]);

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
				onSelect: handleSlashAction,
			},
		});
	}, [ handleSlashAction ]);

	const onSendClick = useCallback(() => {
		if ((isEmpty && !attachments.length) || isLoading) {
			return;
		};

		const parts = editorRef.current?.getParts();
		if (parts) {
			handleSubmit(parts);
		};
	}, [ isEmpty, attachments, isLoading, handleSubmit ]);

	// Keep page scrolled to bottom when form resizes (new lines, attachments, toolbar)
	useEffect(() => {
		const node = formRef.current;
		if (!node || !onResize) {
			return;
		};

		const observer = new ResizeObserver(() => onResize());

		observer.observe(node);
		return () => observer.disconnect();
	}, [ onResize ]);

	// Listen for slash menu action events from the editor's inline slash menu
	useEffect(() => {
		const editor = editorRef.current?.getEditor();
		if (!editor) {
			return;
		};

		const root = editor.getRootElement();
		if (!root) {
			return;
		};

		const wrap = root.closest('.commentEditorWrap');
		if (!wrap) {
			return;
		};

		const onAction = (e: Event) => {
			const item = (e as CustomEvent).detail;
			if (item?.action) {
				handleSlashAction(item);
			};
		};

		wrap.addEventListener('commentSlashAction', onAction);
		return () => wrap.removeEventListener('commentSlashAction', onAction);
	}, [ handleSlashAction ]);

	if (readonly) {
		return null;
	};

	const hasAttachments = attachments.length > 0;
	const isDisabled = (isEmpty && !hasAttachments) || isLoading;
	const showToolbar = isFocused || !isEmpty || hasAttachments || isEdit;

	const cn = [ 'commentForm' ];
	if (isEdit) cn.push('isEdit');
	if (isFocused) cn.push('isFocused');
	if (!isEmpty) cn.push('hasContent');
	if (isMultiline) cn.push('isMultiline');

	return (
		<div ref={formRef} className={cn.join(' ')}>
			<div className="contentArea">
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

				{hasAttachments ? (
					<div className="attachmentList">
						{attachments.map(item => (
							<Attachment
								key={item.id}
								object={item}
								showAsFile={item.layout !== I.ObjectLayout.Image}
								onRemove={() => onAttachmentRemove(item.id)}
							/>
						))}
					</div>
				) : ''}
			</div>

			{showToolbar ? (
				<div className="formToolbar">
					<div className="toolbarLeft">
						<div className="toolbarBtn" onClick={onPlusClick}>
							<Icon className="plus" />
						</div>

						<div className="toolbarDivider" />

						<div className="toolbarBtn" onClick={onTextClick}>
							<Icon className="text" />
						</div>
						<div className="toolbarBtn" onClick={onEmojiClick}>
							<Icon className="emoji" />
						</div>
						<div className="toolbarBtn" onClick={onMentionClick}>
							<Icon className="mention" />
						</div>
					</div>

					<div className="toolbarRight">
						{isEdit && onCancel ? (
							<div className="btn cancel" onClick={onCancel}>
								{translate('commonCancel')}
							</div>
						) : ''}

						{!isDisabled ? (
							<div className="btn send" onClick={onSendClick}>
								<Icon className="send" />
							</div>
						) : ''}
					</div>
				</div>
			) : ''}

			<input
				ref={fileInputRef}
				type="file"
				multiple={true}
				className="dn"
				onChange={onFileInputChange}
			/>
		</div>
	);
}));

export default CommentForm;
