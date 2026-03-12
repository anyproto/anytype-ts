import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, C, J, S, U, keyboard, translate, Storage } from 'Lib';
import CommentEditor from 'Component/form/commentEditor';

interface Props {
	rootId: string;
	placeholder?: string;
	initialParts?: I.CommentContentPart[];
	isEdit?: boolean;
	isReply?: boolean;
	readonly?: boolean;
	onSubmit?: (parts: I.CommentContentPart[], attachments?: I.ChatMessageAttachment[], attachmentObjects?: any[]) => void;
	onCancel?: () => void;
	onResize?: () => void;
};

interface RefProps {
	focus: () => void;
	clear: () => void;
};

const CommentForm = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, placeholder, initialParts, isEdit, isReply, readonly, onSubmit, onCancel, onResize } = props;
	const editorRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLDivElement>(null);
	const [ isEmpty, setIsEmpty ] = useState(true);
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isMultiline, setIsMultiline ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const draftLoadedRef = useRef(false);
	const electron = U.Common.getElectron();
	const isDraft = !isEdit && !isReply;

	const saveDraft = useCallback(() => {
		if (!isDraft) {
			return;
		};

		const parts = editorRef.current?.getParts() || [];
		const att = editorRef.current?.getAttachments() || [];
		Storage.setComment(rootId, {
			parts,
			attachments: att.filter(it => !it.isTmp),
		});
	}, [ isDraft, rootId ]);

	const clearDraft = useCallback(() => {
		if (isDraft) {
			Storage.deleteComment(rootId);
		};
	}, [ isDraft, rootId ]);

	useImperativeHandle(ref, () => ({
		focus: () => editorRef.current?.focus(),
		clear: () => {
			editorRef.current?.clear();
			setIsEmpty(true);
			setIsLoading(false);
			setIsMultiline(false);
			clearDraft();
		},
	}));

	const getLinkType = useCallback((layout: I.ObjectLayout): I.ChatMessageBlockLinkType => {
		switch (layout) {
			case I.ObjectLayout.Bookmark: return I.ChatMessageBlockLinkType.Bookmark;
			case I.ObjectLayout.Image: return I.ChatMessageBlockLinkType.Image;
			case I.ObjectLayout.File:
			case I.ObjectLayout.Pdf:
			case I.ObjectLayout.Audio:
			case I.ObjectLayout.Video: return I.ChatMessageBlockLinkType.File;
			default: return I.ChatMessageBlockLinkType.Object;
		};
	}, []);

	const uploadTmpFiles = useCallback((tmpFiles: any[], callBack: (uploadMap: Map<string, string>) => void) => {
		if (!tmpFiles.length) {
			callBack(new Map());
			return;
		};

		let n = 0;
		const uploadMap = new Map<string, string>();

		for (const item of tmpFiles) {
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
						uploadMap.set(item.id, message.objectId);
					};

					if (n === tmpFiles.length) {
						callBack(uploadMap);
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

		// Collect tmp files that need uploading
		const tmpFiles = parts
			.filter(p => p.attachmentData?.isTmp)
			.map(p => p.attachmentData);

		const finalize = (uploadMap: Map<string, string>) => {
			// Resolve attachment parts into link parts
			const resolvedParts = parts.map(part => {
				if (!part.attachmentData) {
					return part;
				};

				const data = part.attachmentData;
				let targetId = data.id;

				if (data.isTmp) {
					targetId = uploadMap.get(data.id) || '';
					if (!targetId) {
						return null;
					};
				};

				return {
					...part,
					link: {
						targetObjectId: targetId,
						type: getLinkType(data.layout),
					},
					attachmentData: undefined,
				};
			}).filter(Boolean);

			// Collect non-tmp attachment objects for optimistic rendering
			const attachmentObjects = parts
				.filter(p => (p.attachmentData && !p.attachmentData.isTmp))
				.map(p => p.attachmentData);

			onSubmit?.(resolvedParts, undefined, attachmentObjects);

			if (!isEdit) {
				editorRef.current?.clear();
				setIsEmpty(true);
				setIsLoading(false);
				setIsMultiline(false);
				clearDraft();
			};
		};

		if (tmpFiles.length) {
			uploadTmpFiles(tmpFiles, finalize);
		} else {
			finalize(new Map());
		};
	}, [ onSubmit, isEdit, isLoading, clearDraft, getLinkType, uploadTmpFiles ]);

	const handleEmpty = useCallback((v: boolean) => {
		setIsEmpty(v);
		checkMultiline();
	}, []);

	const handleChange = useCallback(() => {
		saveDraft();
		onResize?.();
	}, [ saveDraft, onResize ]);

	const handleFocus = useCallback(() => {
		setIsFocused(true);

		window.setTimeout(() => {
			if (formRef.current) {
				formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			};
		}, 300);
	}, []);

	const handleBlur = useCallback(() => {
		saveDraft();

		window.setTimeout(() => {
			if (S.Menu.isOpen()) {
				return;
			};
			setIsFocused(false);
		}, 200);
	}, [ saveDraft ]);

	const checkMultiline = useCallback(() => {
		const lineCount = editorRef.current?.getLineCount() || 0;
		setIsMultiline(lineCount >= 2);
	}, []);

	const addAttachmentFiles = useCallback((files: File[]) => {
		const limit = J.Constant.limit.chat.attachments;
		const currentCount = editorRef.current?.getAttachments().length || 0;
		let remaining = limit - currentCount;

		for (const file of files) {
			if (remaining <= 0) {
				break;
			};

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

			editorRef.current?.insertAttachment({
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

			remaining--;
		};
	}, []);

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
				case 'file': {
					openFilePicker();
					break;
				};

				case 'object': {
					const currentAtt = editorRef.current?.getAttachments() || [];
					keyboard.onSearchPopup('', {
						data: {
							skipIds: currentAtt.map(it => it.id),
							onObjectSelect: (obj: any) => {
								editorRef.current?.insertAttachment(obj);
							},
						},
					});
					break;
				};

				case 'create':
				case 'embed': {
					// Handled by submenu onOver
					break;
				};
			};
		} else
		if ((item.blockType === I.BlockType.Div) || (item.type === I.BlockType.Div)) {
			editorRef.current?.insertDivider();
		} else
		if (item.textStyle !== undefined) {
			editorRef.current?.setBlockStyle(item.textStyle);
		} else
		if (item.style !== undefined) {
			editorRef.current?.setBlockStyle(item.style);
		};

		editorRef.current?.focus();
	}, [ openFilePicker ]);

	const menuContextRef = useRef<any>(null);

	const openCommentAddMenu = useCallback((element: any) => {
		S.Menu.open('commentAdd', {
			component: 'select',
			element,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			noAnimation: true,
			subIds: [ 'typeSuggest', 'select' ],
			onOpen: (context: any) => { menuContextRef.current = context; },
			data: {
				sections: U.Menu.getCommentAddSections(),
				noFilter: true,
				noVirtualisation: true,
				noScroll: true,
				onOver: (_e: any, item: any) => {
					if (!item.arrow) {
						S.Menu.closeAll([ 'typeSuggest', 'select' ]);
						return;
					};

					const context = menuContextRef.current;
					if (!context) {
						return;
					};

					if (item.id === 'create') {
						U.Menu.typeSuggest({
							element: `#${context.getId()} #item-create`,
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							offsetX: context.getSize().width,
							vertical: I.MenuDirection.Center,
							isSub: true,
							data: {
								onAdd: () => context?.close(),
							},
						}, {}, { noButtons: true }, '', (object: any) => {
							editorRef.current?.insertAttachment(object);
							U.Object.openPopup(object);
							context?.close();
						});
					};

					if (item.id === 'embed') {
						const embedOptions = U.Menu.getBlockEmbed().map(it => ({
							...it,
							action: 'embed',
							embedProcessor: it.id,
						}));

						S.Menu.open('select', {
							element: `#${context.getId()} #item-embed`,
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							offsetX: context.getSize().width,
							vertical: I.MenuDirection.Center,
							isSub: true,
							data: {
								options: embedOptions,
								noVirtualisation: true,
								noScroll: true,
								onSelect: (_e: any, embedItem: any) => {
									handleSlashAction(embedItem);
									context?.close();
								},
							},
						});
					};
				},
				onSelect: (_e: any, item: any) => {
					handleSlashAction(item);
				},
			},
		});
	}, [ handleSlashAction, openFilePicker ]);

	const onPlusClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		openCommentAddMenu($(e.currentTarget));
	}, [ openCommentAddMenu ]);

	const onSlashClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		openCommentAddMenu($(e.currentTarget));
	}, [ openCommentAddMenu ]);

	const onEmojiClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('smile', {
			element: $(e.currentTarget),
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			offsetY: -4,
			noAnimation: true,
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: (icon: string) => {
					editorRef.current?.insertText(icon);
					editorRef.current?.focus();
				},
			},
		});
	}, []);

	const onMentionClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const { space } = S.Common;
		const participantId = U.Space.getParticipantId(space, S.Auth.account?.id);

		S.Common.filterSet(0, '');

		S.Menu.open('blockMention', {
			element: $(e.currentTarget),
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			noAnimation: true,
			data: {
				pronounId: participantId,
				marks: [],
				skipIds: [ S.Auth.account?.id ],
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				],
				onChange: (object: any, name: string) => {
					editorRef.current?.insertMention(object.id, name.trim());
					editorRef.current?.focus();
				},
			},
		});
	}, []);

	const onSendClick = useCallback(() => {
		const hasAttachments = (editorRef.current?.getAttachments().length || 0) > 0;
		if ((isEmpty && !hasAttachments) || isLoading) {
			return;
		};

		const parts = editorRef.current?.getParts();
		if (parts) {
			handleSubmit(parts);
		};
	}, [ isEmpty, isLoading, handleSubmit ]);

	// Keep page scrolled to bottom when form resizes (new lines, attachments, toolbar)
	useEffect(() => {
		const node = formRef.current;
		if (!node) {
			return;
		};

		const observer = new ResizeObserver(() => onResize?.());

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
			if (!item) {
				return;
			};

			if ((item.action === 'createCallback') && item.object) {
				editorRef.current?.insertAttachment(item.object);
				U.Object.openPopup(item.object);
				editorRef.current?.focus();
				return;
			};

			handleSlashAction(item);
		};

		wrap.addEventListener('commentSlashAction', onAction);
		return () => wrap.removeEventListener('commentSlashAction', onAction);
	}, [ handleSlashAction ]);

	// Load draft on mount (only for main posting form)
	useEffect(() => {
		if (!isDraft || draftLoadedRef.current) {
			return;
		};

		draftLoadedRef.current = true;

		const draft = Storage.getComment(rootId);
		const hasParts = draft?.parts && draft.parts.length;
		const hasAtt = draft?.attachments && draft.attachments.length;

		if (!hasParts && !hasAtt) {
			return;
		};

		if (hasParts) {
			window.setTimeout(() => {
				editorRef.current?.setParts(draft.parts);

				const hasText = draft.parts.some((p: I.CommentContentPart) => p.text || (p.type === I.BlockType.Div));
				if (hasText) {
					setIsEmpty(false);
				};
			}, 50);
		};

		if (hasAtt) {
			window.setTimeout(() => {
				for (const att of draft.attachments) {
					editorRef.current?.insertAttachment(att);
				};
			}, 100);
		};
	}, [ isDraft, rootId ]);

	if (readonly) {
		return null;
	};

	const isDisabled = isEmpty || isLoading;
	const showToolbar = isFocused || !isEmpty || isEdit;

	const cn = [ 'commentForm' ];
	if (isEdit) cn.push('isEdit');
	if (isReply) cn.push('isReply');
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
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
				/>
			</div>

			{showToolbar ? (
				<div className="formToolbar">
					<div className="side left" onMouseDown={e => e.preventDefault()}>
						<Icon className="plus withBackground" onClick={onPlusClick} />
						<div className="div" />
						<Icon className="slash withBackground" onClick={onSlashClick} />
						<Icon className="emoji withBackground" onClick={onEmojiClick} />
						<Icon className="mention withBackground" onClick={onMentionClick} />
					</div>

					<div className="side right">
						{isEdit ? (
						<>
							{onCancel ? (
								<div className="btn cancel" onClick={onCancel}>
									{translate('commonCancel')}
								</div>
							) : ''}
							<div
								className={[ 'btn', 'save', (isDisabled ? 'isDisabled' : '') ].join(' ')}
								onClick={onSendClick}
							>
								{translate('commonSave')}
							</div>
						</>
					) : (
						<div
							className={[ 'btn', 'send', (isDisabled ? 'isDisabled' : '') ].join(' ')}
							onClick={onSendClick}
						>
							<Icon className="send" />
						</div>
					)}
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
