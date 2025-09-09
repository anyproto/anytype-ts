import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, DragEvent, MouseEvent } from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Icon, IconObject, Label, Loader } from 'Component';
import { I, C, S, U, J, M, keyboard, Mark, translate, Storage, Preview, analytics, sidebar, Action } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';

import Attachment from './attachment';

interface Props extends I.BlockComponent {
	blockId: string;
	subId: string;
	isEmpty?: boolean;
	onScrollToBottomClick: () => void;
	scrollToBottom: () => void;
	scrollToMessage: (id: string, animate?: boolean, highlight?: boolean) => void;
	loadMessagesByOrderId: (orderId: string, callBack?: () => void) => void;
	getMessages: () => I.ChatMessage[];
	getReplyContent: (message: any) => any;
	highlightMessage: (id: string, orderId?: string) => void;
	loadDepsAndReplies: (list: I.ChatMessage[], callBack?: () => void) => void;
};

interface RefProps {
	onReply: (message: I.ChatMessage) => void;
	getReplyingId: () => string;
	onEdit: (message: I.ChatMessage) => void;
	onDelete: (id: string) => void;
	getNode: () => HTMLDivElement;
	onDragOver: (e: DragEvent) => void;
	onDragLeave: (e: DragEvent) => void;
	onDrop: (e: DragEvent) => void;
	getAttachments: () => any[];
	getMarks: () => I.Mark[];
};

const ChatForm = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { account } = S.Auth;
	const { space } = S.Common;
	const { 
		rootId, isPopup, block, subId, readonly, isEmpty, getReplyContent, loadDepsAndReplies, checkMarkOnBackspace, getMessages, 
		scrollToBottom, scrollToMessage, renderMentions, renderObjects, renderLinks, renderEmoji, onScrollToBottomClick, loadMessagesByOrderId, 
		highlightMessage,
	} = props;
	const [ replyingId, setReplyingId ] = useState<string>('');
	const [ preloading, setPreloading ] = useState(new Map<string, string>());
	const nodeRef = useRef(null);
	const dummyRef = useRef(null);
	const editableRef = useRef(null);
	const counterRef = useRef(null);
	const sendRef = useRef(null);
	const loaderRef = useRef(null);
	const timeoutFilter = useRef(0);
	const timeoutDrag = useRef(0);
	const timeoutHistory = useRef(0);
	const isLoading = useRef<string[]>([]);
	const isSending = useRef(false);
	const range = useRef<I.TextRange>({ from: 0, to: 0 });
	const marks = useRef<I.Mark[]>([]);
	const editingId = useRef<string>('');
	const speedLimit = useRef({ last: 0, counter: 0 });
	const counters = S.Chat.getState(subId);
	const mentionCounter = counters.mentionCounter;
	const messageCounter = S.Chat.counterString(counters.messageCounter);
	const history = useRef({ position: -1, states: [] });
	const menuContext = useRef(null);

	let { attachments } = S.Chat;

	const unbind = () => {
		const events = [ 'resize', 'sidebarResize' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	const rebind = () => {
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		unbind();
		$(window).on(`resize.${ns} sidebarResize.${ns}`, () => resize());
	};

	const setAttachments = (list: any[]) => {
		S.Chat.setAttachments(list);
	};

	const checkSendButton = () => {
		const button = $(sendRef.current);

		canSend() || isSending.current ? button.show() : button.hide();
	};

	const onSelect = () => {
		range.current = getRange();
		checkTextMenu();
	};

	const checkTextMenu = () => {
		if (!hasSelection()) {
			if (S.Menu.isOpen('chatText')) {
				S.Menu.close('chatText');
			};
			return;
		};

		const win = $(window);

		S.Common.setTimeout('chatText', 150, () => {
			S.Menu.open('chatText', {
				classNameWrap: 'fromBlock',
				element: '#messageBox',
				recalcRect: () => {
					const rect = U.Common.getSelectionRect();
					return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
				},
				horizontal: I.MenuDirection.Left,
				offsetY: 4,
				offsetX: -8,
				passThrough: true,
				data: {
					rootId,
					blockId: block.id,
					range: range.current,
					marks: marks.current,
					onTextButtonToggle: onTextButtonToggle,
					removeBookmark: removeBookmark
				}
			});
		});
	};

	const updateTextMenu = () => {
		if (S.Menu.isOpen('chatText')) {
			S.Menu.updateData('chatText', {
				range: range.current,
				marks: marks.current,
			});
		};
	};

	const onMouseDown = () => {
		onSelect();
	};

	const onMouseUp = () => {
		onSelect();
	};

	const onFocusInput = () =>	 {
		keyboard.disableSelection(true);
		editableRef.current?.placeholderCheck();
	};

	const onBlurInput = () => {
		keyboard.disableSelection(false);
		editableRef.current?.placeholderCheck();

		saveState(attachments);
	};

	const onKeyDownInput = (e: any) => {
		const cmd = keyboard.cmdKey();

		let value = editableRef.current?.getTextValue();

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			e.preventDefault();
			onSend();
		});

		keyboard.shortcut('arrowup', e, () => {
			if (range.current.to || value || attachments.length || editingId.current) {
				return;
			};

			e.preventDefault();

			const list = getMessages().filter(it => it.creator == account.id);

			if (list.length) {
				onEdit(list[list.length - 1]);
			};
		});

		keyboard.shortcut('backspace', e, () => {
			const parsed = checkMarkOnBackspace(value, range.current, marks.current);

			if (!parsed.save) {
				return;
			};

			e.preventDefault();

			value = parsed.value;
			setMarks(parsed.marks);

			const l = value.length;
			updateMarkup(value, { from: l, to: l });
		});

		keyboard.shortcut('chatObject', e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();
				onAttachment();
			};
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (!S.Menu.isOpen('smile')) {
				e.preventDefault();
				onEmoji();
			};
		});

		if (editingId.current) {
			keyboard.shortcut('escape', e, () => {
				editingId.current = '';
				range.current = { from: 0, to: 0 };

				setMarks([]);
				updateValue('');
			});
		};

		keyboard.shortcut(`${cmd}+c`, e, () => {
			e.preventDefault();
			onCopy();
		});

		keyboard.shortcut(`shift+enter`, e, () => {
			resize();
			scrollToBottom();
		});

		// Mark-up
		if (range.current && range.current.to && (range.current.from != range.current.to)) {
			let type = null;

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => type = item.type);
			};

			if (type !== null) {
				e.preventDefault();
				onTextButtonToggle(type, '');
			};
		};

		// UnDo, ReDo
		keyboard.shortcut('undo', e, () => onHistory(e, -1));
		keyboard.shortcut('redo', e, () => onHistory(e, 1));

	};

	const onKeyUpInput = (e: any) => {
		range.current = getRange();

		const { to } = range.current;
		const { filter } = S.Common;
		const value = getTextValue();
		const parsed = getMarksFromHtml();
		const oneSymbolBefore = range.current ? value[range.current.from - 1] : '';
		const twoSymbolBefore = range.current ? value[range.current.from - 2] : '';
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@') && (!twoSymbolBefore || (twoSymbolBefore == ' '));

		resize();
		setMarks(parsed.marks);

		let adjustMarks = false;

		if (value !== parsed.text) {
			updateMarkup(parsed.text, { from: to, to });
		};

		if (canOpenMenuMention) {
			onMention(true);
		};

		if (menuOpenMention) {
			window.clearTimeout(timeoutFilter.current);
			timeoutFilter.current = window.setTimeout(() => {
				if (!range.current) {
					return;
				};

				const d = range.current.from - filter.from;

				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\//, '');
					S.Common.filterSetText(part);
				};
			}, 30);

			keyboard.shortcut('backspace', e, () => {
				if (!value.match('@')) {
					S.Menu.close('blockMention');
				};
			});

			return;
		};

		keyboard.shortcut('backspace', e, () => {
			scrollToBottom();
		});

		if (!keyboard.isSpecial(e)) {
			for (let i = 0; i < marks.current.length; ++i) {
				const mark = marks.current[i];

				if (Mark.needsBreak(mark.type) && (mark.range.to == to)) {
					const adjusted = Mark.adjust([ mark ], mark.range.to - 1, -1);

					marks.current[i] = adjusted[0];
					adjustMarks = true;
				};
			};
		};

		if (!value && !attachments.length && editingId.current) {
			onDelete(editingId.current);
		};

		if (adjustMarks) {
			updateMarkup(value, { from: to, to });
		};

		/*
		keyboard.shortcut('space', e, () => checkUrls());
		*/

		checkSendButton();
		removeBookmarks();
		updateCounter();

		window.clearTimeout(timeoutHistory.current);
		timeoutHistory.current = window.setTimeout(() => {
			historySaveState();
		}, J.Constant.delay.chatHistory);
	};

	const onInput = () => {
		const value = getTextValue();
		const checkRtl = U.Common.checkRtl(value);

		$(editableRef.current?.getNode()).toggleClass('isRtl', checkRtl);
	};

	const onCopy = () => {
		const text = getTextValue();
		const range = getRange();
		const str = text.substring(range.from, range.to);
		const res = Mark.getPartOfString(text, range, marks.current);
		const block = new M.Block({
			type: I.BlockType.Text,
			content: res,
		});

		U.Common.clipboardCopy({ 
			text: str, 
			anytype: {
				range,
				blocks: [ block ],
			},
		});
	};

	const onPaste = (e: any) => {
		e.preventDefault();

		const { from, to } = range.current;
		const limit = J.Constant.limit.chat.text;
		const current = getTextValue();
		const clipboard = e.clipboardData || e.originalEvent.clipboardData;
		const electron = U.Common.getElectron();
		const list = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items).map((it: File) => getObjectFromFile(it)).filter(it => {
			return !electron.isDirectory(it.path);
		});

		const json = JSON.parse(String(clipboard.getData('application/json') || '{}'));
		const html = String(clipboard.getData('text/html') || '');
		const text = U.Common.normalizeLineEndings(String(clipboard.getData('text/plain') || ''));

		let newText = '';
		let newMarks: I.Mark[] = [];

		const parseBlocks = (blocks: I.Block[]) => {
			const targetIds = [];

			blocks.forEach((block: I.Block, index: number) => {
				if (block.isText()) {
					const text = block.getText();
			
					let marks = block.content.marks || [];
					if (block.isTextHeader()) {
						marks.push({ type: I.MarkType.Bold, range: { from: 0, to: text.length } });
					};
					marks = Mark.adjust(marks, 0, newText.length);

					newText += text;

					if (index < blocks.length - 1) {
						newText += '\n';
					};

					newMarks = newMarks.concat(marks);
				} else {
					const targetId = block.getTargetObjectId();

					if (targetId) {
						targetIds.push(targetId);
					};
				};
			});

			if (targetIds.length) {
				U.Object.getByIds(targetIds, { spaceId: space }, addAttachments);
			};
		};

		const parseText = () => {
			if (!newText) {
				return;
			};

			if (newText.length >= limit) {
				newText = newText.substring(0, limit);
			};

			newText = U.Common.stringInsert(current, newText, from, to);
			marks.current = Mark.adjust(marks.current, from, newText.length);
			marks.current = marks.current.concat(newMarks);

			setMarks(marks.current);

			const rt = to + newText.length;
			range.current = { from: rt, to: rt };
			updateMarkup(newText, range.current);
		};

		if (json && json.blocks && json.blocks.length) {
			parseBlocks(json.blocks.map(it => new M.Block(it)));
			newMarks = Mark.adjust(newMarks, 0, current.length);
			parseText();
		} else 
		if (html) {
			C.BlockPreview(html, '', (message: any) => {
				if (message.error.code || !message.blocks || !message.blocks.length) {
					newText = text;
				} else {
					parseBlocks(message.blocks.map(it => new M.Block(it)));
				};
				parseText();
			});
		} else 
		if (text) {
			newText = text;
			parseText();
		};

		if (list.length) {
			U.Common.saveClipboardFiles(list, {}, data => addAttachments(data.files));
		};

		checkUrls();
		updateCounter();
	};

	const checkUrls = () => {
		const text = getTextValue();
		const urls = U.Common.getUrlsFromText(text);
		if (!urls.length) {
			return;
		};

		removeBookmarks();

		for (const url of urls) {
			const { from, to, isLocal, isUrl, value } = url;

			if (isLocal) {
				continue;
			};

			if (Mark.getInRange(marks.current, I.MarkType.Link, { from, to })) {
				continue;
			};

			marks.current = Mark.adjust(marks.current, from - 1, value.length + 1);
			marks.current.push({ 
				type: I.MarkType.Link, 
				range: { from, to }, 
				param: U.Common.urlFix(value),
			});

			setMarks(marks.current);
			
			if (isUrl) {
				addBookmark(value, true);
			};
		};

		updateMarkup(text, { from: range.current.to + 1, to: range.current.to + 1 });
	};

	const canDrop = (e: any): boolean => {
		return !readonly && U.File.checkDropFiles(e);
	};

	const onDragOver = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDrag.current);
		$(nodeRef.current).addClass('isDraggingOver');
	};
	
	const onDragLeave = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDrag.current);
		timeoutDrag.current = window.setTimeout(() => {
			$(nodeRef.current).removeClass('isDraggingOver');
		}, 100);
	};

	const onDrop = (e: any) => {
		if (!canDrop(e)) {
			onDragLeave(e);
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const node = $(nodeRef.current);
		const electron = U.Common.getElectron();
		const list = Array.from(e.dataTransfer.files).map((it: File) => getObjectFromFile(it)).filter(it => {
			return !electron.isDirectory(it.path);
		});

		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		addAttachments(list);
		keyboard.disableCommonDrop(false);
	};

	const onEmoji = () => {
		S.Menu.open('smile', {
			element: `#button-${block.id}-emoji`,
			horizontal: I.MenuDirection.Right,
			...caretMenuParam(),
			data: {
				noHead: true,
				noUpload: true,
				value: '',
				onSelect: icon => onChatButtonSelect(I.ChatButton.Emoji, icon),
				route: analytics.route.message,
			}
		});
	};

	const onAttachmentOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.chatForm);
			return;
		};

		const context = menuContext.current;
		if (!context) {
			return;
		};

		switch (item.id) {
			case 'create': {
				U.Menu.typeSuggest({
					element: `#${context.getId()} #item-${item.id}`,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					offsetX: context.getSize().width,
					vertical: I.MenuDirection.Center,
					isSub: true,
					data: {
						onAdd: () => context?.close(),
					},
				}, {}, { noButtons: true }, analytics.route.message, object => {
					onChatButtonSelect(I.ChatButton.Object, object);

					U.Object.openPopup(object, { onClose: () => updateAttachments(S.Chat.attachments) });

					analytics.event('AttachItemChat', { type: 'Create', count: 1 });
					context?.close();
				});
				break;
			};
		};
	};

	const onAttachment = () => {
		const options: any[] = [
			{ id: 'create', icon: 'createObject', name: translate('commonNewObject'), arrow: true },
			{ id: 'search', icon: 'plus', name: translate('spaceExisting') },
			{ id: 'upload', icon: 'uploadComputer', name: translate('commonUploadComputer') },
		];

		S.Menu.closeAll(null, () => {
			S.Menu.open('select', {
				element: `#block-${block.id} #button-${block.id}-attachment`,
				className: 'chatAttachment fixed fromBlock',
				offsetY: -8,
				vertical: I.MenuDirection.Top,
				noFlipX: true,
				noFlipY: true,
				subIds: J.Menu.chatForm,
				onOpen: context => menuContext.current = context,
				data: {
					options,
					noVirtualisation: true,
					noScroll: true,
					onOver: onAttachmentOver,
					onSelect: (e: MouseEvent, option: any) => {
						switch (option.id) {
							case 'search': {
								keyboard.onSearchPopup(analytics.route.message, {
									data: {
										skipIds: attachments.map(it => it.id),
										onObjectSelect: item => {
											addAttachments([ item ]);
											analytics.event('AttachItemChat', { type: 'Existing', count: 1 });
										},
									},
								});
								break;
							};

							case 'upload': {
								Action.openFileDialog({ properties: [ 'multiSelections' ] }, paths => {
									addAttachments(paths.map(path => getObjectFromPath(path)));

									analytics.event('AttachItemChat', { type: 'Upload', count: paths.length });
								});

								analytics.event('ClickChatAttach', { type: 'Upload' });
								break;
							};
						};
					},
				},
			});
		});
	};

	const addAttachments = (list: any[]) => {
		const limit = J.Constant.limit.chat.attachments;
		const ids = attachments.map(it => it.id);

		list = list.filter(it => !ids.includes(it.id));
		list = list.map(it => ({ ...it, timestamp: U.Date.now() }));

		if (list.length + attachments.length > limit) {
			Preview.toastShow({
				icon: 'notice',
				text: U.Common.sprintf(translate('toastChatAttachmentsLimitReached'), limit, U.Common.plural(limit, translate('pluralFile')).toLowerCase())
			});
			return;
		};

		list.forEach(item => {
			if (item.isTmp && U.Object.isFileLayout(item.layout) && item.path) {
				preloadFile(item);
			};
		});

		saveState([ ...list, ...attachments ]);
		historySaveState();
	};

	const preloadFile = (item: any) => {
		if (preloading.has(item.id)) {
			return;
		};

		C.FileUpload(S.Common.space, '', item.path, I.FileType.None, {}, true, '', (message: any) => {
			if (message.error.code) {
				return;
			};

			if (message.preloadFileId) {
				preloading.set(item.id, message.preloadFileId);
				setPreloading(preloading);
			};
		});
	};

	const addBookmark = (url: string, fromText?: boolean) => {
		const add = (param: any) => {
			const { title, description, url } = param;
			const item = {
				id: sha1(url),
				name: title,
				description,
				layout: I.ObjectLayout.Bookmark,
				source: url,
				isTmp: true,
				timestamp: U.Date.now(),
				fromText
			};
			addAttachments([ item ]);
		};

		const scheme = U.Common.getScheme(url);
		const isInside = scheme == J.Constant.protocol;

		if (isInside) {
			const route = '/' + url.split('://')[1];
			const search = url.split('?')[1];

			let target = '';
			let spaceId = '';

			if (search) {
				const searchParam = U.Common.searchParam(search);

				target = searchParam.objectId;
				spaceId = searchParam.spaceId;
			} else {
				const routeParam = U.Router.getParam(route);

				target = routeParam.id;
				spaceId = routeParam.spaceId;
			};

			U.Object.getById(target, { spaceId }, object => {
				if (object) {
					addAttachments([ object ]);
				};
			});
		} else {
			isLoading.current.push(url);

			C.LinkPreview(url, (message: any) => {
				isLoading.current = isLoading.current.filter(it => it != url);

				if (!message.error.code) {
					add({ ...message.previewLink, url });
				};
			});
		};
	};

	const removeBookmarks = () => {
		const bookmarks = attachments.filter(it => (it.layout == I.ObjectLayout.Bookmark) && it.fromText);
		
		let filtered = attachments;
		bookmarks.forEach(it => {
			const current = marks.current.filter(mark => mark.param == it.source);
			if (!current.length) {
				filtered = filtered.filter(file => file.id != it.id);
			};
		});

		if (attachments.length != filtered.length) {
			saveState(filtered);
		};
	};

	const removeBookmark = (url: string) => {
		onAttachmentRemove(sha1(url));
	};

	const onSend = () => {
		if (isSending.current || !canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const send = $(sendRef.current);
		const loader = $(loaderRef.current);
		const files = attachments.filter(it => it.isTmp && U.Object.isFileLayout(it.layout));
		const bookmarks = attachments.filter(it => it.isTmp && U.Object.isBookmarkLayout(it.layout));
		const fl = files.length;
		const bl = bookmarks.length;
		const bookmark = S.Record.getBookmarkType();

		send.addClass('isLoading');
		loader.addClass('active');
		isSending.current = true;
		
		const callBack = () => {
			const newAttachments = attachments.filter(it => !it.isTmp).map(it => ({ target: it.id, type: I.AttachmentType.Link }));
			const parsed = getMarksFromHtml();
			const text = trim(parsed.text);
			const match = parsed.text.match(/^\r?\n+/);
			const diff = match ? match[0].length : 0;
			const marks = Mark.checkRanges(text, Mark.adjust(parsed.marks, 0, -diff));

			if (editingId.current) {
				const message = S.Chat.getMessageById(subId, editingId.current);
				if (message) {
					const update = U.Common.objectCopy(message);

					update.attachments = newAttachments;
					update.content.text = text;
					update.content.marks = marks;

					C.ChatEditMessageContent(rootId, editingId.current, update, () => {
						scrollToMessage(editingId.current, true, true);
						clear();
					});
				};
			} else {
				if (replyingId) {
					const reply = S.Chat.getMessageById(subId, replyingId);
					if (reply) {
						S.Chat.setReply(subId, reply);
					};
				};

				const message = {
					replyToMessageId: replyingId,
					content: {
						marks,
						text,
						style: I.TextStyle.Paragraph,
					},
					attachments: newAttachments,
					reactions: [],
				};

				let messageType = 'Text';
				if (newAttachments.length) {
					messageType = message.content?.text.length ? 'Mixed' : 'Attachment';
				};

				C.ChatAddMessage(rootId, message, () => {
					scrollToBottom();
					clear();

					analytics.event('SentMessage', { type: messageType });
				});
			};
		};

		const uploadFiles = (callBack: () => void) => {
			if (!fl) {
				callBack();
				return;
			};

			let n = 0;
			for (const item of files) {
				C.FileUpload(S.Common.space, '', item.path, I.FileType.None, {}, false, preloading.get(item.id), (message: any) => {
					n++;

					if (message.objectId) {
						attachments = attachments.filter(it => it.id != item.id);
						attachments.push({ id: message.objectId, type: I.AttachmentType.File });
					};

					if (n == fl) {
						callBack();
					};
				});
			};
		};

		const fetchBookmarks = (callBack: () => void) => {
			if (!bl) {
				callBack();
				return;
			};

			let n = 0;
			for (const item of bookmarks) {
				C.ObjectCreateBookmark({ source: item.source }, S.Common.space, bookmark.defaultTemplateId, (message: any) => {
					n++;

					if (message.objectId) {
						attachments = attachments.filter(it => it.id != item.id);
						attachments.push({ id: message.objectId, type: I.AttachmentType.Link });
					};

					if (n == bl) {
						callBack();
					};
				});
			};
		};

		uploadFiles(() => fetchBookmarks(callBack));
	};

	const onEdit = (message: I.ChatMessage) => {
		const { text } = message.content;
		const l = text.length;
		const attachments = (message.attachments || []).map(it => it.target).map(id => S.Detail.get(subId, id));

		editingId.current = message.id;

		setMarks(message.content.marks);
		setReplyingId('');
		updateMarkup(text, { from: l, to: l });
		updateCounter();
		setAttachments(attachments);
		historySaveState();

		analytics.event('ClickMessageMenuEdit');
	};

	const clear = () => {
		const send = $(sendRef.current);
		const loader = $(loaderRef.current);

		isSending.current = false;
		send.removeClass('isLoading');
		loader.removeClass('active');

		onEditClear();
		onReplyClear();
		checkSpeedLimit();
		historyClearState();
	};

	const onEditClear = () => {
		editingId.current = '';

		setRange({ from: 0, to: 0 });
		setMarks([]);
		updateMarkup('', { from: 0, to: 0 });
		clearCounter();
		checkSendButton();
		saveState([]);
		setPreloading(new Map());
		checkTextMenu();
	};

	const onReply = (message: I.ChatMessage) => {
		if (readonly) {
			return;
		};

		const text = getTextValue();
		const length = text.length;

		range.current = { from: length, to: length };

		setRange(range.current);
		setReplyingId(message.id);
		resize();

		analytics.event('ClickMessageMenuReply');
	};

	const onReplyClear = () => {
		setReplyingId('');
		scrollToBottom();
	};

	const onDelete = (id: string) => {
		const messages = getMessages();
		const idx = messages.findIndex(it => it.id == id);
		const next = messages[idx + 1];

		S.Popup.open('confirm', {
			data: {
				icon: 'confirm',
				title: translate('popupConfirmChatDeleteMessageTitle'),
				text: translate('popupConfirmChatDeleteMessageText'),
				textConfirm: translate('commonDelete'),
				onConfirm: () => {
					C.ChatDeleteMessage(rootId, id, () => {
						if (editingId.current == id) {
							onEditClear();
						};

						if (next) {
							scrollToMessage(next.id, true);
						} else {
							scrollToBottom();
						};

						analytics.event('DeleteMessage');
					});
				},
				onCancel: () => {
					if (editingId.current == id) {
						onEditClear();
					};
				},
			}
		});

		analytics.event('ClickMessageMenuDelete');
	};

	const onHistory = (e, dir) => {
		e.preventDefault();
		e.stopPropagation();

		const { position, states } = history.current;
		const targetIdx = position + dir;

		if (targetIdx < 0) {
			clear();
		};

		if (states[targetIdx]) {
			historyLoadState(targetIdx);
		};
	};

	const historySaveState = () => {
		const parsed = getMarksFromHtml();
		const text = trim(parsed.text);
		const match = parsed.text.match(/^\r?\n+/);
		const diff = match ? match[0].length : 0;
		const marks = Mark.checkRanges(text, Mark.adjust(parsed.marks, 0, -diff));
		const item = {
			text,
			marks,
			replyingId,
			attachments: U.Common.objectCopy(attachments),
		};
		const { position, states } = history.current;

		if (U.Common.compareJSON(states[position], item)) {
			return;
		};

		if (position < states.length - 1) {
			history.current.states = states.slice(0, position + 1);
		};

		history.current.position += 1;
		history.current.states.push(item);
	};

	const historyLoadState = (idx: number) => {
		const { text, marks, attachments, replyingId } = history.current.states[idx];
		const l = text.length;

		history.current.position = idx;
		setMarks(marks);
		setReplyingId(replyingId);
		updateMarkup(text, { from: l, to: l });
		updateCounter();
		setAttachments(attachments);
	};

	const historyClearState = () => {
		window.clearTimeout(timeoutHistory.current);
		history.current = { position: -1, states: [] };
	};

	const getMarksAndRange = (): { marks: I.Mark[], range: I.TextRange } => {
		return { marks: marks.current, range: range.current };
	};

	const getTextValue = (): string => {
		return String(editableRef.current?.getTextValue() || '');
	};

	const getHtmlValue = (): string => {
		return String(editableRef.current?.getHtmlValue() || '');
	};

	const trim = (value: string): string => {
		return String(value || '').replace(/^(\r?\n+)/g, '').replace(/(\r?\n+)$/g, '');
	};

	const getMarksFromHtml = (): I.FromHtmlResult => {
		return Mark.fromHtml(getHtmlValue(), []);
	};

	const onAttachmentRemove = (id: string) => {
		const value = getTextValue();
		const list = (attachments || []).filter(it => it.id != id);

		if (preloading.has(id)) {
			C.FileDiscardPreload(preloading.get(id));
			preloading.delete(id);
		};

		if (editingId.current && !value && !attachments.length) {
			onDelete(editingId.current);
		} else {
			saveState(list);
			analytics.event('DetachItemChat');
		};
	};

	const onNavigationClick = (type: I.ChatReadType) => {
		switch (type) {
			case I.ChatReadType.Message: {
				onScrollToBottomClick();

				analytics.event('ClickScrollToBottom');
				break;
			};

			case I.ChatReadType.Mention: {
				const { mentionOrderId } = S.Chat.getState(subId);
				const target = S.Chat.getMessageByOrderId(subId, mentionOrderId);

				if (target) {
					scrollToMessage(target.id, true, true);
				} else {
					loadMessagesByOrderId(mentionOrderId, () => {
						highlightMessage('', mentionOrderId);
					});
				};

				analytics.event('ClickScrollToMention');
				break;
			};
		};
	};

	const onChatButtonSelect = (type: I.ChatButton, item: any) => {
		switch (type) {
			case I.ChatButton.Object: {
				addAttachments([ item ]);
				break;
			};

			case I.ChatButton.Emoji: {
				const to = range.current.from + 1;

				let value = getTextValue();

				marks.current = Mark.adjust(marks.current, range.current.from, 1);
				marks.current = Mark.toggle(marks.current, {
					type: I.MarkType.Emoji,
					param: item,
					range: { from: range.current.from, to },
				});

				value = U.Common.stringInsert(value, ' ', range.current.from, range.current.from);

				updateMarkup(value, { from: to, to });
				break;
			};
		};
	};

	const onTextButtonToggle = (type: I.MarkType, param: string) => {
		const { from, to } = range.current;
		const value = getTextValue();

		setMarks(Mark.toggle(marks.current, { type, param, range: { from, to } }));
		updateMarkup(value, { from, to });
		updateTextMenu();

		switch (type) {
			case I.MarkType.Link: {
				if (param) {
					addBookmark(param);
				};
				break;
			};

			case I.MarkType.Object: {
				U.Object.getById(param, {}, (object: any) => {
					object.isTmp = true;
					object.timestamp = U.Date.now();

					saveState([ object ]);
				});
				break;
			};
		};

		renderMarkup();
	};

	const getRange = (): I.TextRange => {
		return editableRef.current?.getRange() || { from: 0, to: 0 };
	};

	const setRange = (newRange: I.TextRange) => {
		editableRef.current?.setRange(newRange);
	};

	const getObjectFromFile = (file: File) => {
		const electron = U.Common.getElectron();
		const path = electron.webFilePath(file);
		const mime = electron.fileMime(path);
		const ext = electron.fileExt(path);
		const type = S.Record.getFileType();

		return {
			id: sha1(path),
			name: file.name,
			layout: I.ObjectLayout.File,
			type: type?.id,
			sizeInBytes: file.size,
			fileExt: ext,
			isTmp: true,
			mime,
			path,
			file,
		};
	};

	const getObjectFromPath = (path: string) => {
		const electron = U.Common.getElectron();
		const name = electron.fileName(path);
		const mime = electron.fileMime(path);
		const ext = electron.fileExt(path);
		const size = electron.fileSize(path);
		const type = S.Record.getFileType();

		return {
			id: sha1(path),
			name,
			path,
			fileExt: ext,
			sizeInBytes: size,
			mime,
			layout: I.ObjectLayout.File,
			type: type?.id,
			isTmp: true,
		};
	};

	const onMention = (fromKeyboard?: boolean) => {
		if (!range) {
			return;
		};

		let value = editableRef.current?.getTextValue();
		let from = range.current.from;

		if (fromKeyboard) {
			value = U.Common.stringCut(value, from - 1, from);
			from--;
		};

		S.Common.filterSet(from, '');

		raf(() => {
			S.Menu.open('blockMention', {
				element: `#button-${block.id}-${I.ChatButton.Mention}`,
				...caretMenuParam(),
				data: {
					rootId,
					blockId: block.id,
					pronounId: U.Space.getMyParticipant()?.id,
					marks: marks.current,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (object: any, text: string, newMarks: I.Mark[], from: number, to: number) => {
						if (S.Menu.isAnimating('blockMention')) {
							return;
						};

						S.Detail.update(subId, { id: object.id, details: object }, false);

						setMarks(newMarks);
						value = U.Common.stringInsert(value, text, from, from);

						updateMarkup(value, { from: to, to });
						analytics.event('Mention');
					},
				},
			});
		});
	};

	const onMenuClose = () => {
		setRange(range.current);
	};

	const updateAttachments = (attachments: any[]) => {
		const list = U.Common.objectCopy(attachments);
		const ids = list.filter(it => !it.isTmp).map(it => it.id).filter(it => it);

		U.Object.getByIds(ids, {}, (objects: any[]) => {
			objects.forEach(item => {	
				const idx = list.findIndex(it => it.id == item.id);

				if (idx >= 0) {
					list[idx] = item;
				};
			});

			saveState(list);
		});
	};

	const caretMenuParam = () => {
		const win = $(window);
		const rect = U.Common.getSelectionRect();
		const param: any = {
			classNameWrap: 'fromChat',
			className: 'fixed',
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			vertical: I.MenuDirection.Top,
			onClose: () => setRange(range.current),
			noFlipX: true,
			noFlipY: true,
			offsetY: -8,
		};

		if (rect) {
			param.horizontal = I.MenuDirection.Center;
		};

		return param;
	};

	const canSend = (): boolean => {
		const v = getTextValue();
		const isLimit = v.length > J.Constant.limit.chat.text;

		return !isLoading.current.length && !isLimit &&
		!!(
			editingId.current ||
			v.trim().length ||
			attachments.length || 
			marks.current.length
		);
	};

	const hasSelection = (): boolean => {
		return range.current ? range.current.to != range.current.from : false;
	};

	const updateMarkup = (value: string, newRange: I.TextRange) => {
		range.current = newRange;
		updateValue(value);
		renderMarkup();
		checkSendButton();
	};

	const updateValue = (value: string) => {
		if (!editableRef.current) {
			return;
		};

		editableRef.current.setValue(Mark.toHtml(value, marks.current));
		editableRef.current.placeholderCheck();
		setRange(range.current);
		onInput();
	};

	const renderMarkup = () => {
		if (!editableRef.current) {
			return;
		};

		const node = editableRef.current?.getNode();
		const value = editableRef.current?.getTextValue();
		const onChange = (newText: string, newMarks: I.Mark[]) => {
			setMarks(newMarks);
			updateMarkup(newText, range.current);
		};
		const getValue = () => value;
		const param = { onChange, subId };

		renderMentions(rootId, node, marks.current, getValue, param);
		renderObjects(rootId, node, marks.current, getValue, props, param);
		renderLinks(rootId, node, marks.current, getValue, props, param);
		renderEmoji(node);
	};

	const renderReply = () => {
		if (!replyingId) {
			return;
		};

		const message = S.Chat.getMessageById(subId, replyingId);
		if (!message) {
			return;
		};

		const getValue = () => String(message.content.text || '');
		const marks = message.content.marks || [];
		const node = $(nodeRef.current);
		const head = node.find('.head');
		const param = { subId, iconSize: 16 };

		renderMentions(rootId, head, marks, getValue, param);
		renderObjects(rootId, head, marks, getValue, props, param);
		renderLinks(rootId, head, marks, getValue, props, param);
		renderEmoji(head, param);
	};

	const updateCounter = (v?: string) => {
		v = v || getTextValue();

		const el = $(counterRef.current);
		const l = v.length;
		const limit = J.Constant.limit.chat.text;

		el.toggleClass('red', l > limit);

		if (l > limit - 50) {
			el.addClass('show').text(limit - l);
		} else {
			el.removeClass('show');
		};
	};

	const clearCounter = () => {
		$(counterRef.current).text('').removeClass('show').removeClass('red');
	};

	const checkSpeedLimit = () => {
		const { last, counter } = speedLimit.current;
		const now = U.Date.now();

		if (now - last >= 5 ) {
			speedLimit.current = { last: now, counter: 1 };
			return;
		};

		speedLimit.current = { last: now, counter: counter + 1 };

		if (counter >= 5) {
			speedLimit.current = { last: now, counter: 1 };

			S.Popup.open('confirm', {
				onClose: () => {
					setRange(range.current);
				},
				data: {
					icon: 'warning',
					title: translate('popupConfirmSpeedLimitTitle'),
					text: translate('popupConfirmSpeedLimitText'),
					textConfirm: translate('commonOkay'),
					colorConfirm: 'blank',
					canCancel: false,
				}
			});
		};
	};

	const setMarks = (newMarks: I.Mark[]) => {
		marks.current = newMarks;
	};

	const saveState = (attachments?: any[]) => {
		setAttachments(attachments);
		Storage.setChat(rootId, {
			text: getTextValue(),
			marks: marks.current,
			attachments,
		});
	};

	const resize = () => {
		if (isPopup) {
			return;
		};

		const container = U.Common.getScrollContainer(isPopup);
		const node = $(nodeRef.current);
		const dummy = $(dummyRef.current);
		const cw = container.width();
		const { isClosed, width } = sidebar.data;
		const left = isClosed ? 0 : width;
		const margin = 32;

		node.css({ width: cw - margin * 2, left: left + margin });
		dummy.css({ height: node.outerHeight() });
	};

	let form = null;
	let title = '';
	let text = '';
	let icon: any = null;
	let onClear = () => {};

	if (editingId.current) {
		title = translate('blockChatEditing');
		onClear = () => onEditClear();
	} else
	if (replyingId) {
		const message = S.Chat.getMessageById(subId, replyingId);

		if (message) {
			const reply = getReplyContent(message);

			title = reply.title;
			text = reply.text;
			if (reply.attachment) {
				const object = reply.attachment;
				const iconSize = U.Object.getFileLayouts().concat(U.Object.getHumanLayouts()).includes(object.layout) ? 32 : null;

				icon = <IconObject className={iconSize ? 'noBg' : ''} object={object} size={32} iconSize={iconSize} />;
			};
			if (reply.isMultiple && !reply.attachment) {
				icon = <Icon className="isMultiple" />;
			};

			onClear = onReplyClear;
		};
	};

	const Button = (item: any) => (
		<div 
			id={`navigation-${item.type}`} 
			className={`btn ${item.className || ''}`} 
			onClick={() => onNavigationClick(item.type)}
		>
			<div className="bg" />
			<Icon className={item.icon} />

			{item.cnt ? (
				<div className="counter">
					<Label text={String(item.cnt)} />
				</div>
			) : ''}
		</div>
	);

	if (readonly) {
		form = <div className="readonly">{translate('blockChatFormReadonly')}</div>;
	} else {
		form = (
			<>
				<Icon
					id={`button-${block.id}-attachment`}
					className="plus"
					onClick={onAttachment}
				/>

				<div className="form customScrollbar">
					<Loader id="form-loader" ref={loaderRef} />

					{title ? (
						<div className="head">
							<div className="side left">
								{icon}
								<div className="textWrapper">
									<div className="name">{title}</div>
									<div className="descr" dangerouslySetInnerHTML={{ __html: text }} />
								</div>
							</div>
							<div className="side right">
								<Icon className="clear" onClick={onClear} />
							</div>
						</div>
					) : ''}

					{attachments.length ? (
						<div className="attachments">
							<Swiper
								slidesPerView={'auto'}
								spaceBetween={8}
								navigation={true}
								mousewheel={true}
								modules={[ Navigation, Mousewheel ]}
							>
								{attachments.map(item => (
									<SwiperSlide key={item.id}>
										<Attachment
											object={item}
											onRemove={onAttachmentRemove}
											bookmarkAsDefault={true}
											updateAttachments={() => updateAttachments(S.Chat.attachments)}
										/>
									</SwiperSlide>
								))}
							</Swiper>
						</div>
					) : ''}

					<Editable
						ref={editableRef}
						id="messageBox"
						maxLength={J.Constant.limit.chat.text}
						placeholder={translate('blockChatPlaceholder')}
						onSelect={onSelect}
						onFocus={onFocusInput}
						onBlur={onBlurInput}
						onKeyUp={onKeyUpInput}
						onKeyDown={onKeyDownInput}
						onInput={onInput}
						onPaste={onPaste}
						onMouseDown={onMouseDown}
						onMouseUp={onMouseUp}
					/>

					<div ref={counterRef} className="charCounter" />
					<Icon ref={sendRef} className="send" onClick={onSend} />
				</div>

				<Icon
					id={`button-${block.id}-emoji`}
					className="emoji"
					onClick={onEmoji}
				/>
			</>
		);
	};

	useEffect(() => {
		checkSendButton();

		const storage = Storage.getChat(rootId);

		if (!readonly && storage) {
			const text = String(storage.text || '');
			const attachments = (storage.attachments || []).filter(it => !it.isTmp);
			const length = text.length;

			setMarks(storage.marks || []);
			updateMarkup(text, { from: length, to: length });
			updateCounter(text);

			if (attachments.length) {
				setAttachments(attachments);
			};

			historySaveState();
		};

		resize();
		rebind();

		return () => {
			unbind();

			window.clearTimeout(timeoutFilter.current);
			keyboard.disableSelection(false);
		};
	}, []);

	useEffect(() => {
		loadDepsAndReplies([], () => {
			renderMarkup();
			renderReply();
		});

		checkSendButton();
		resize();
		scrollToBottom();
	});

	useEffect(() => {
		scrollToBottom();
		setRange(range.current);
	}, [ attachments ]);

	useImperativeHandle(ref, () => ({
		getReplyingId: () => replyingId,
		onReply,
		onEdit,
		onEditClear,
		onDelete,
		getNode: () => nodeRef.current,
		onDragOver,
		onDragLeave,
		onDrop,
		getAttachments: () => attachments,
		getMarks: () => marks.current,
	}));

	return (
		<>
			<div ref={dummyRef} />
			<div 
				ref={nodeRef}
				id="formWrapper" 
				className="formWrapper"
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
			>
				<div className="grad" />
				<div className="bg" />

				<div className="dragOverlay">
					<div className="inner">
						<Icon />
						<Label text={translate('commonDropFiles')} />
					</div>
				</div>

				<div className="inner">
					{!isEmpty ? (
						<div className="navigation">
							{mentionCounter ? <Button type={I.ChatReadType.Mention} icon="mention" className="active" cnt={mentionCounter} /> : ''}
							<Button type={I.ChatReadType.Message} icon="arrow" className={messageCounter ? 'active' : ''} cnt={messageCounter} />
						</div>
					) : ''}

					{form}
				</div>
			</div>
		</>
	);

}));

export default ChatForm;