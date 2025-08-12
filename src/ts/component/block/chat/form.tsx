import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, DragEvent } from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Icon, IconObject, Label, Loader } from 'Component';
import { I, C, S, U, J, M, keyboard, Mark, translate, Storage, Preview, analytics } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';

import Attachment from './attachment';
import Buttons from './buttons';

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
	const [ attachments, setAttachments ] = useState<any[]>([]);
	const [ replyingId, setReplyingId ] = useState<string>('');
	const { messageCounter, mentionCounter } = S.Chat.getState(subId);
	const nodeRef = useRef(null);
	const dummyRef = useRef(null);
	const editableRef = useRef(null);
	const buttonsRef = useRef(null);
	const counterRef = useRef(null);
	const sendRef = useRef(null);
	const timeoutFilter = useRef(0);
	const timeoutDrag = useRef(0);
	const isLoading = useRef<string[]>([]);
	const isSending = useRef(false);
	const range = useRef<I.TextRange>({ from: 0, to: 0 });
	const marks = useRef<I.Mark[]>([]);
	const editingId = useRef<string>('');
	const speedLimit = useRef({ last: 0, counter: 0 });
	const mc = messageCounter > 999 ? '999+' : messageCounter;

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

	const checkSendButton = () => {
		const button = $(sendRef.current);

		canSend() || isSending.current ? button.show() : button.hide();
	};

	const onSelect = () => {
		range.current = getRange();
		updateButtons();
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
			scrollToBottom();
		});

		keyboard.shortcut('chatObject', e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();
				buttonsRef.current?.onChatButton(e, I.ChatButton.Object);
			};
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (!S.Menu.isOpen('smile')) {
				e.preventDefault();
				buttonsRef.current?.onChatButton(e, I.ChatButton.Emoji);
			};
		});

		keyboard.shortcut('chatMention', e, () => {
			if (!S.Menu.isOpen('mention')) {
				e.preventDefault();
				buttonsRef.current?.onChatButton(e, I.ChatButton.Mention);
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

		// Mark-up
		if (range.current && range.current.to && (range.current.from != range.current.to)) {
			let type = null;

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => type = item.type);
			};

			if (type !== null) {
				e.preventDefault();
				buttonsRef.current?.onTextButton(e, type, '');
			};
		};
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
		updateButtons();
		removeBookmarks();
		updateCounter();
	};

	const onInput = () => {
		const value = getTextValue();
		const checkRtl = U.Common.checkRtl(value);

		$(editableRef.current?.getNode()).toggleClass('isRtl', checkRtl);
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

			blocks.forEach((block: I.Block) => {
				if (block.isText()) {
					const text = block.getText();
			
					let marks = block.content.marks || [];
					if (block.isTextHeader()) {
						marks.push({ type: I.MarkType.Bold, range: { from: 0, to: text.length } });
					};
					marks = Mark.adjust(marks, 0, newText.length);

					newText += text + '\n';
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

	const addAttachments = (list: any[]) => {
		const limit = J.Constant.limit.chat.attachments;
		const ids = attachments.map(it => it.id);

		list = list.filter(it => !ids.includes(it.id));
		list = list.map(it => {
			it.timestamp = U.Date.now();
			return it;
		});

		if (list.length + attachments.length > limit) {
			Preview.toastShow({
				icon: 'notice',
				text: U.Common.sprintf(translate('toastChatAttachmentsLimitReached'), limit, U.Common.plural(limit, translate('pluralFile')).toLowerCase())
			});
			return;
		};

		setAttachments(list.concat(attachments));
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
			setAttachments(filtered);
		};
	};

	const removeBookmark = (url: string) => {
		onAttachmentRemove(sha1(url));
	};

	const onSend = () => {
		if (isSending.current || !canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const node = $(nodeRef.current);
		const send = node.find('#send');
		const loader = node.find('#form-loader');
		const files = attachments.filter(it => it.isTmp && U.Object.isFileLayout(it.layout));
		const bookmarks = attachments.filter(it => it.isTmp && U.Object.isBookmarkLayout(it.layout));
		const fl = files.length;
		const bl = bookmarks.length;
		const bookmark = S.Record.getBookmarkType();

		send.addClass('isLoading');
		loader.addClass('active');
		isSending.current = true;

		const clear = () => {
			isSending.current = false;
			checkSendButton();

			onEditClear();
			onReplyClear();
			clearCounter();
			checkSpeedLimit();

			send.removeClass('isLoading');
			loader.removeClass('active');
		};
		
		const callBack = () => {
			const newAttachments = attachments.filter(it => !it.isTmp).map(it => ({ target: it.id, type: I.AttachmentType.Link }));
			const parsed = getMarksFromHtml();
			const text = trim(parsed.text);
			const match = parsed.text.match(/^\r?\n+/);
			const diff = match ? match[0].length : 0;
			const marks = Mark.checkRanges(text, Mark.adjust(parsed.marks, 0, -diff));

			if (editingId.current) {
				const message = S.Chat.getMessage(subId, editingId.current	);
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
				C.FileUpload(S.Common.space, '', item.path, I.FileType.None, {}, (message: any) => {
					n++;

					if (message.objectId) {
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

		analytics.event('ClickMessageMenuEdit');
	};

	const onEditClear = () => {
		editingId.current = '';
		buttonsRef.current?.setButtons();

		setRange({ from: 0, to: 0 });
		setMarks([]);
		updateMarkup('', { from: 0, to: 0 });
		clearCounter();
		checkSendButton();
		setAttachments([]);
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

		if (editingId.current && !value && !attachments.length) {
			onDelete(editingId.current);
		} else {
			setAttachments(list);
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
				const messages = getMessages();
				const target = messages.find(it => it.orderId == mentionOrderId);

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

	const updateButtons = () => {
		buttonsRef.current?.setButtons();
	};

	const onChatButtonSelect = (type: I.ChatButton, item: any) => {
		switch (type) {
			case I.ChatButton.Object: {
				setAttachments([ item ].concat(attachments));
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

					attachments.unshift(object);
					setAttachments(attachments);
				});
				break;
			};
		};

		updateButtons();
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

	const updateAttachments = () => {
		const ids = attachments.filter(it => !it.isTmp).map(it => it.id).filter(it => it);

		U.Object.getByIds(ids, {}, (objects: any[]) => {
			objects.forEach(item => {	
				const idx = attachments.findIndex(it => it.id == item.id);

				if (idx >= 0) {
					attachments[idx] = item;
				};
			});

			setAttachments(attachments);
			saveState(attachments);
		});
	};

	const caretMenuParam = () => {
		const win = $(window);
		const rect = U.Common.getSelectionRect();

		return {
			classNameWrap: 'fromChat',
			className: 'fixed',
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			horizontal: rect ? I.MenuDirection.Center : I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			onClose: () => setRange(range.current),
			noFlipX: true,
			noFlipY: true,
			offsetY: -8,
		};
	};

	const canSend = (): boolean => {
		return !isLoading.current.length && 
		!!(
			editingId.current || 
			getTextValue().trim().length || 
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

		const message = S.Chat.getMessage(subId, replyingId);
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

		if (l >= limit - 50) {
			el.addClass('show').text(`${l} / ${limit}`);
		} else {
			el.removeClass('show');
		};
	};

	const clearCounter = () => {
		$(counterRef.current).text('').removeClass('show');
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

		const node = $(nodeRef.current);
		const dummy = $(dummyRef.current);
		const padding = 16;

		if (!dummy.length) {
			return;
		};

		raf(() => {
			dummy.css({ height: node.outerHeight(true) });
			node.css({ left: dummy.offset().left - padding, width: dummy.width() + padding * 2 });
		});
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
		const message = S.Chat.getMessage(subId, replyingId);

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
			<div className="form customScrollbar">
				<Loader id="form-loader" />

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
										updateAttachments={updateAttachments}
									/>
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				) : ''}

				<Buttons
					ref={buttonsRef}
					{...props}
					value={getTextValue()}
					hasSelection={hasSelection}
					getMarksAndRange={getMarksAndRange}
					attachments={attachments}
					caretMenuParam={caretMenuParam}
					onMention={onMention}
					onChatButtonSelect={onChatButtonSelect}
					onTextButtonToggle={onTextButtonToggle}
					getObjectFromPath={getObjectFromPath}
					addAttachments={addAttachments}
					onMenuClose={onMenuClose}
					removeBookmark={removeBookmark}
					updateAttachments={updateAttachments}
				/>

				<div ref={counterRef} className="charCounter" />
				<Icon ref={sendRef} className="send" onClick={onSend} />
			</div>
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
			<div ref={dummyRef} className="formDummy" />
			<div 
				ref={nodeRef}
				id="formWrapper" 
				className="formWrapper"
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
			>
				<div className="dragOverlay">
					<div className="inner">
						<Icon />
						<Label text={translate('commonDropFiles')} />
					</div>
				</div>

				{!isEmpty ? (
					<div className="navigation">
						{mentionCounter ? <Button type={I.ChatReadType.Mention} icon="mention" className="active" cnt={mentionCounter} /> : ''}
						<Button type={I.ChatReadType.Message} icon="arrow" className={messageCounter ? 'active' : ''} cnt={mc} />
					</div>
				) : ''}

				{form}

				<div className="bottom" />
			</div>
		</>
	);

}));

export default ChatForm;