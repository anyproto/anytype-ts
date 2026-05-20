import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle, useCallback } from 'react';
import { Icon, Button, Label, IconObject } from 'Component';
import CommentEditor from 'Component/form/commentEditor';
import * as I from 'Interface';
import Storage from 'Lib/storage';

interface Props {
	rootId: string;
	subId?: string;
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
	insertQuote: (part: I.CommentContentPart) => void;
};

const CommentForm = forwardRef<RefProps, Props>((props, ref) => {

	const { rootId, subId, placeholder, initialParts, isEdit, isReply, readonly, onSubmit, onCancel, onResize } = props;
	const editorRef = useRef<any>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLDivElement>(null);
	const [ isEmpty, setIsEmpty ] = useState(true);
	const [ hasAttachments, setHasAttachments ] = useState(false);
	const [ isFocused, setIsFocused ] = useState(false);
	const [ isMultiline, setIsMultiline ] = useState(false);
	const [ isLoading, setIsLoading ] = useState(false);
	const isSubmittingRef = useRef(false);
	const draftLoadedRef = useRef(false);
	const electron = U.Common.getElectron();
	const isDraft = !isEdit && !isReply;

	const saveDraft = useCallback(() => {
		if (!isDraft) {
			return;
		};

		const parts = (editorRef.current?.getParts() || []).filter(p => !p.attachmentData?.isTmp);
		Storage.setComment(rootId, { parts });
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
			setHasAttachments(false);
			isSubmittingRef.current = false;
			setIsLoading(false);
			setIsMultiline(false);
			clearDraft();
		},
		insertQuote: (part: I.CommentContentPart) => {
			if (!part) {
				return;
			};
			editorRef.current?.insertSourceQuote(part);
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

	const getAttachmentType = useCallback((layout: I.ObjectLayout): I.AttachmentType => {
		switch (layout) {
			case I.ObjectLayout.Bookmark: return I.AttachmentType.Link;
			case I.ObjectLayout.Image: return I.AttachmentType.Image;
			default: return I.AttachmentType.File;
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

					if (!message.error.code && message.objectId) {
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
		if (isSubmittingRef.current) {
			return;
		};

		isSubmittingRef.current = true;
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

			// Build message attachments and collect attachment objects for optimistic rendering
			const messageAttachments: I.ChatMessageAttachment[] = [];
			const attachmentObjects: any[] = [];

			for (const p of parts) {
				if (!p.attachmentData) {
					continue;
				};

				const data = p.attachmentData;

				if (data.isTmp) {
					const uploadedId = uploadMap.get(data.id);
					if (uploadedId) {
						messageAttachments.push({ target: uploadedId, type: getAttachmentType(data.layout) });
						attachmentObjects.push({
							id: uploadedId,
							name: data.name,
							layout: data.layout,
							sizeInBytes: data.sizeInBytes,
							fileExt: data.fileExt,
							syncStatus: I.SyncStatusObject.Synced,
						});
					};
				} else {
					messageAttachments.push({ target: data.id, type: getAttachmentType(data.layout) });
					const fresh = subId ? S.Detail.get(subId, data.id) : null;
					attachmentObjects.push((fresh && !fresh._empty_) ? fresh : data);
				};
			};

			onSubmit?.(resolvedParts, messageAttachments, attachmentObjects);

			if (!isEdit) {
				editorRef.current?.clear();
				setIsEmpty(true);
				setHasAttachments(false);
				setIsMultiline(false);
				clearDraft();
			};

			isSubmittingRef.current = false;
			setIsLoading(false);
		};

		if (tmpFiles.length) {
			uploadTmpFiles(tmpFiles, finalize);
		} else {
			finalize(new Map());
		};
	}, [ onSubmit, isEdit, clearDraft, getLinkType, getAttachmentType, uploadTmpFiles ]);

	const handleEmpty = useCallback((v: boolean) => {
		setIsEmpty(v);
		checkMultiline();
	}, []);

	const handleChange = useCallback(() => {
		setHasAttachments((editorRef.current?.getAttachments().length || 0) > 0);
		saveDraft();
	}, [ saveDraft ]);

	const handleFocus = useCallback(() => {
		setIsFocused(true);
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
		const remaining = limit - currentCount;

		if (remaining <= 0) {
			return;
		};

		const items = files.slice(0, remaining).map(file => {
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

			return {
				id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				name: file.name,
				layout,
				sizeInBytes: file.size,
				fileExt: ext,
				isTmp: true,
				mime,
				path,
				file,
			};
		});

		// Clipboard images arrive as synthetic File objects with no filesystem path —
		// persist them to disk first so the subsequent C.FileUpload has a real path.
		U.Common.saveClipboardFiles(items, {}, (data: any) => {
			for (const item of (data.files || [])) {
				if (!item.path) {
					continue;
				};

				const fileExt = item.fileExt || (electron.fileExt ? electron.fileExt(item.path) : '');
				editorRef.current?.insertAttachment({ ...item, fileExt });
			};

			setHasAttachments((editorRef.current?.getAttachments().length || 0) > 0);
		});
	}, []);

	const timeoutDrag = useRef<number>(0);
	const [ isDraggingOver, setIsDraggingOver ] = useState(false);

	const canDrop = useCallback((e: any): boolean => {
		return !readonly && U.File.checkDropFiles(e);
	}, [ readonly ]);

	const clearDragState = useCallback(() => {
		setIsDraggingOver(false);
		keyboard.disableCommonDrop(false);
	}, []);

	const onDragOver = useCallback((e: any) => {
		if (!canDrop(e)) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDrag.current);
		keyboard.disableCommonDrop(true);
		setIsDraggingOver(true);
	}, [ canDrop ]);

	const onDragLeave = useCallback((e: any) => {
		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDrag.current);
		timeoutDrag.current = window.setTimeout(clearDragState, 100);
	}, [ clearDragState ]);

	const onDrop = useCallback((e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (canDrop(e)) {
			const files = Array.from(e.dataTransfer.files) as File[];
			addAttachmentFiles(files);
		};

		clearDragState();
	}, [ canDrop, addAttachmentFiles, clearDragState ]);

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

	const openObjectPopup = useCallback((object: any) => {
		U.Object.openPopup(object, {
			onClose: () => {
				const details = S.Detail.get(object.id, object.id);
				
				if (!details._empty_) {
					if (subId) {
						S.Detail.update(subId, { id: object.id, details }, false);
					};

					// Update the Lexical node data so the decorator re-renders with fresh details
					editorRef.current?.updateAttachment(object.id, details);
				};
			},
		});
	}, [ subId ]);

	const openEmbedInput = useCallback((processor: I.EmbedProcessor, existingText?: string) => {
		const processorName = I.EmbedProcessor[processor] || 'Embed';

		if (U.Embed.allowEmptyContent(processor)) {
			editorRef.current?.insertEmbed(processor, '');
			editorRef.current?.focus();
			return;
		};

		const el = formRef.current;
		if (!el) {
			return;
		};

		const rect = el.getBoundingClientRect();
		const isKroki = processor === I.EmbedProcessor.Kroki;
		const menuId = isKroki ? 'blockEmbedKroki' : 'dataviewText';

		S.Menu.open(menuId, {
			classNameWrap: 'fromBlock',
			rect: { x: rect.x, y: rect.y, width: rect.width, height: 0 },
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			width: Math.max(rect.width, 360),
			data: {
				value: existingText || '',
				placeholder: U.String.sprintf(translate('blockEmbedPlaceholder'), processorName),
				canEdit: true,
				noResize: true,
				relationKey: 'url',
				onChange: (v: string) => {
					if (v) {
						editorRef.current?.insertEmbed(processor, v);
						editorRef.current?.focus();
					};
				},
			},
		});
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

				case 'create': {
					// Handled by submenu onOver
					break;
				};

				case 'embed': {
					if (item.embedProcessor !== undefined) {
						openEmbedInput(item.embedProcessor);
					};
					break;
				};

				case 'createType': {
					if (!item.typeId) {
						break;
					};

					const type = S.Record.getTypeById(item.typeId);
					if (!type) {
						break;
					};
					
					C.ObjectCreate({}, [ I.ObjectFlag.DeleteEmpty ], '', type.uniqueKey, S.Common.space, (message: any) => {
						if (message.error.code || !message.details) {
							return;
						};

						const object = message.details;
						editorRef.current?.insertAttachment(object);
						openObjectPopup(object);
					});
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
	}, [ openFilePicker, openEmbedInput, openObjectPopup ]);

	const menuContextRef = useRef<any>(null);

	const openCommentAddMenu = useCallback((element: any) => {
		const { param, data } = U.Menu.getCommentAddMenuParam(menuContextRef);

		S.Menu.open('commentAdd', {
			...param,
			element,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			data: {
				...data,
				onOver: (_e: any, item: any) => {
					if (!item.arrow) {
						S.Menu.closeAll([ 'typeSuggest', 'select' ]);
						return;
					};

					const context = menuContextRef.current;
					if (context && item.itemId === 'embed') {
						U.Menu.openCommentEmbedMenu(context, (_e: any, embedItem: any) => {
							handleSlashAction(embedItem);
							context?.close();
						});
					};
				},
				onSelect: (_e: any, item: any) => {
					handleSlashAction(item);
				},
			},
		});
	}, [ handleSlashAction ]);

	const openPlusMenu = useCallback((element: any) => {
		const children = [
			{ id: 'create', action: 'create', iconParam: { name: 'comment/menu/createObject' }, name: translate('commonNewObject'), arrow: true },
			{ id: 'object', action: 'object', iconParam: { name: 'comment/menu/plus' }, name: translate('spaceExisting') },
			{ id: 'file', action: 'file', iconParam: { name: 'comment/menu/uploadComputer' }, name: translate('commonUploadComputer') },
		];

		S.Menu.open('commentAdd', {
			classNameWrap: 'fromBlock',
			component: 'select',
			element,
			vertical: I.MenuDirection.Top,
			horizontal: I.MenuDirection.Left,
			offsetY: -4,
			noAnimation: true,
			subIds: [ 'typeSuggest' ],
			onOpen: (ctx: any) => { menuContextRef.current = ctx; },
			data: {
				options: children,
				noFilter: true,
				noVirtualisation: true,
				noScroll: true,
				onOver: (_e: any, item: any) => {
					if (!item.arrow) {
						S.Menu.closeAll([ 'typeSuggest' ]);
						return;
					};

					const ctx = menuContextRef.current;
					if (!ctx) {
						return;
					};

					if (item.id === 'create') {
						U.Menu.typeSuggest({
							element: `#${ctx.getId()} #item-create`,
							className: 'fixed',
							classNameWrap: 'fromSidebar',
							offsetX: ctx.getSize().width,
							vertical: I.MenuDirection.Center,
							isSub: true,
							data: {
								onAdd: () => ctx?.close(),
							},
						}, {}, { noButtons: true }, '', (object: any) => {
							editorRef.current?.insertAttachment(object);
							openObjectPopup(object);
							ctx?.close();
						});
					};
				},
				onSelect: (_e: any, item: any) => {
					if (item.arrow) {
						return;
					};
					handleSlashAction(item);
				},
			},
		});
	}, [ handleSlashAction, openObjectPopup ]);

	const onPlusClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		openPlusMenu(e.currentTarget as HTMLElement);
	}, [ openPlusMenu ]);

	const onSlashClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		openCommentAddMenu(e.currentTarget as HTMLElement);
	}, [ openCommentAddMenu ]);

	const onEmojiClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('smile', {
			classNameWrap: 'fromBlock',
			element: e.currentTarget as HTMLElement,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			offsetY: -4,
			noAnimation: true,
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: (icon: string) => {
					editorRef.current?.insertEmoji(icon);
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
			classNameWrap: 'fromBlock',
			element: e.currentTarget as HTMLElement,
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
		if ((isEmpty && !hasAttachments) || isLoading) {
			return;
		};

		const parts = editorRef.current?.getParts();
		if (parts) {
			handleSubmit(parts);
		};
	}, [ isEmpty, hasAttachments, isLoading, handleSubmit ]);

	// Reset common drop flag on unmount
	useEffect(() => {
		return () => keyboard.disableCommonDrop(false);
	}, []);

	// Auto-focus editor when entering edit or reply mode
	useEffect(() => {
		if (isEdit || isReply) {
			window.setTimeout(() => editorRef.current?.focus(), 50);
		};
	}, [ isEdit, isReply ]);

	// Catch Escape at the form level so it doesn't bubble to the global handler
	// which would close the object. This handles the case where focus is on an
	// attachment (image) rather than the Lexical editor.
	useEffect(() => {
		if (!onCancel) {
			return;
		};

		const node = formRef.current;
		if (!node) {
			return;
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				e.preventDefault();
				onCancel();
			};
		};

		node.addEventListener('keydown', onKeyDown);
		return () => node.removeEventListener('keydown', onKeyDown);
	}, [ onCancel ]);

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

	// Handle slash menu action events from the editor's inline slash menu
	const onSlashAction = useCallback((item: any) => {
		if (!item) {
			return;
		};

		if ((item.action === 'createCallback') && item.object) {
			editorRef.current?.insertAttachment(item.object);
			openObjectPopup(item.object);
			editorRef.current?.focus();
			return;
		};

		handleSlashAction(item);
	}, [ handleSlashAction, openObjectPopup ]);

	// Load draft on mount (only for main posting form)
	useEffect(() => {
		if (!isDraft || draftLoadedRef.current) {
			return;
		};

		draftLoadedRef.current = true;

		const draft = Storage.getComment(rootId);
		const hasParts = draft?.parts && draft.parts.length;

		if (!hasParts) {
			return;
		};

		window.setTimeout(() => {
			editorRef.current?.setParts(draft.parts);

			const hasContent = draft.parts.some((p: I.CommentContentPart) =>
				p.text || (p.type === I.BlockType.Div) || (p.type === I.BlockType.Link) || (p.type === I.BlockType.Embed)
			);

			if (hasContent) {
				setIsEmpty(false);
			};
		}, 50);
	}, [ isDraft, rootId ]);

	if (readonly) {
		return null;
	};

	const isDisabled = (isEmpty && !hasAttachments) || isLoading;
	const showToolbar = true;

	const cn = [ 'commentForm' ];
	if (isEdit) cn.push('isEdit');
	if (isReply) cn.push('isReply');
	if (isFocused) cn.push('isFocused');
	if (!isEmpty) cn.push('hasContent');
	if (isMultiline) cn.push('isMultiline');
	if (isDraggingOver) cn.push('isDraggingOver');

	const withAvatar = isReply || isEdit;
	const { space } = S.Common;
	const author = withAvatar ? U.Space.getParticipant(U.Space.getParticipantId(space, S.Auth.account?.id)) : null;

	return (
		<div
			ref={formRef}
			className={cn.join(' ')}
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			<div className="dragOverlay">
				<div className="inner">
					<Label text={translate('commonDropFiles')} />
				</div>
			</div>

			<div className="contentArea">
				{withAvatar ? (
					<IconObject object={{ ...author, layout: I.ObjectLayout.Participant }} size={20} />
				) : null}
				<CommentEditor
					ref={editorRef}
					rootId={rootId}
					subId={subId}
					placeholder={placeholder || translate('commentPlaceholder')}
					initialParts={initialParts}
					maxLength={J.Constant.limit.comment.text}
					onSubmit={handleSubmit}
					onCancel={onCancel}
					onEmpty={handleEmpty}
					onChange={handleChange}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onSlashAction={onSlashAction}
					onPasteFiles={addAttachmentFiles}
				/>
			</div>

			{showToolbar ? (
				<div className="formToolbar">
					<div className="side left" onMouseDown={e => e.preventDefault()}>
						<Icon name="plus/comment" className="plus" withBackground={true} onClick={onPlusClick} />
						<div className="div" />
						<Icon name="comment/slash" className="slash" withBackground={true} onClick={onSlashClick} />
						<Icon name="chat/buttons/emoji" className="emoji" withBackground={true} onClick={onEmojiClick} />
						<Icon name="common/mention" className="mention" withBackground={true} onClick={onMentionClick} />
					</div>

					<div className="side right">
						{isEdit ? (
						<>
							{onCancel ? (
								<Button 
									size={28} 
									color="blank" 
									onClick={onCancel} 
									text={translate('commonCancel')} 
								/>
							) : ''}
							<Button
								className={[ (isDisabled ? 'disabled' : '') ].join(' ')}
								color="accent"
								size={28}
								text={translate('commonSave')}
								onClick={onSendClick}
							/>
						</>
					) : (
						<Icon 
							name="comment/send" 
							className={[ 'send', (isDisabled ? 'disabled' : '') ].join(' ')} 
							color="white" 
							onClick={onSendClick}
						/>
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
});

export default CommentForm;
