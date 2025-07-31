import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
	onScrollToBottomClick: () => void;
	scrollToBottom: () => void;
	scrollToMessage: (id: string, animate?: boolean, highlight?: boolean) => void;
	loadMessagesByOrderId: (orderId: string, callBack?: () => void) => void;
	getMessages: () => I.ChatMessage[];
	getMessagesInViewport: () => any[];
	getIsBottom: () => boolean;
	getReplyContent: (message: any) => any;
	highlightMessage: (id: string, orderId?: string) => void;
	loadDepsAndReplies: (list: I.ChatMessage[], callBack?: () => void) => void;
}

const ChatForm = observer(forwardRef<any, Props>((props, ref) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const refEditableRef = useRef<any>(null);
	const refButtonsRef = useRef<any>(null);
	const refCounterRef = useRef<HTMLDivElement>(null);
	const refDummyRef = useRef<HTMLDivElement>(null);
	const isLoadingRef = useRef<string[]>([]);
	const isSendingRef = useRef(false);
	const marksRef = useRef<I.Mark[]>([]);
	const rangeRef = useRef<I.TextRange>({ from: 0, to: 0 });
	const timeoutFilterRef = useRef(0);
	const timeoutDragRef = useRef(0);
	const editingIdRef = useRef<string>('');
	const speedLimitRef = useRef({ last: 0, counter: 0 });
	
	const [ attachments, setAttachments ] = useState<any[]>([]);
	const [ replyingId, setReplyingId ] = useState<string>('');

	const onSelect = () => {
		rangeRef.current = refEditableRef.current.getRange();
		updateButtons();
	};

	const onMouseDown = () => {
		onSelect();
	};

	const onMouseUp = () => {
		onSelect();
	};

	const onFocusInput = () => {
		keyboard.disableSelection(true);
		refEditableRef.current?.placeholderCheck();
	};

	const onBlurInput = () => {
		const { rootId } = props;

		keyboard.disableSelection(false);
		refEditableRef.current?.placeholderCheck();

		Storage.setChat(rootId, {
			text: getTextValue(),
			marks: marksRef.current,
			attachments,
		});
	};

	const onKeyDownInput = (e: any) => {
		const { account } = S.Auth;
		const { checkMarkOnBackspace, getMessages, scrollToBottom } = props;
		const range = rangeRef.current;
		const cmd = keyboard.cmdKey();

		let value = refEditableRef.current.getTextValue();

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			e.preventDefault();
			onSend();
		});

		keyboard.shortcut('arrowup', e, () => {
			if (rangeRef.current.to || value || attachments.length || editingIdRef.current) {
				return;
			}

			e.preventDefault();

			const list = getMessages().filter(it => it.creator == account.id);

			if (list.length) {
				onEdit(list[list.length - 1]);
			}
		});

		keyboard.shortcut('backspace', e, () => {
			const parsed = checkMarkOnBackspace(value, range, marksRef.current);

			if (!parsed.save) {
				return;
			}

			e.preventDefault();

			value = parsed.value;
			marksRef.current = parsed.marks;

			const l = value.length;
			updateMarkup(value, { from: l, to: l });
			scrollToBottom();
		});

		keyboard.shortcut('chatObject', e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();
				refButtonsRef.current.onChatButton(e, I.ChatButton.Object);
			}
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (!S.Menu.isOpen('smile')) {
				e.preventDefault();
				refButtonsRef.current.onChatButton(e, I.ChatButton.Emoji);
			}
		});

		keyboard.shortcut('chatMention', e, () => {
			if (!S.Menu.isOpen('mention')) {
				e.preventDefault();
				refButtonsRef.current.onChatButton(e, I.ChatButton.Mention);
			}
		});

		if (editingIdRef.current) {
			keyboard.shortcut('escape', e, () => {
				editingIdRef.current = '';
				marksRef.current = [];
				rangeRef.current = { from: 0, to: 0 };
				updateValue('');
			});
		}

		// Mark-up
		if (range && range.to && (range.from != range.to)) {
			let type = null;

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => type = item.type);
			}

			if (type !== null) {
				refButtonsRef.current.onTextButton(e, type, '');
			}
		}
	};

	const onKeyUpInput = (e: any) => {
		rangeRef.current = refEditableRef.current.getRange() || { from: 0, to: 0 };

		const { to } = rangeRef.current;
		const { filter } = S.Common;
		const value = getTextValue();
		const parsed = getMarksFromHtml();
		const oneSymbolBefore = rangeRef.current ? value[rangeRef.current.from - 1] : '';
		const twoSymbolBefore = rangeRef.current ? value[rangeRef.current.from - 2] : '';
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@') && (!twoSymbolBefore || (twoSymbolBefore == ' '));

		marksRef.current = parsed.marks;

		let adjustMarks = false;

		if ((value !== parsed.text) || parsed.updatedValue) {
			updateValue(parsed.text);
		}

		if (canOpenMenuMention) {
			onMention(true);
		}

		if (menuOpenMention) {
			window.clearTimeout(timeoutFilterRef.current);
			timeoutFilterRef.current = window.setTimeout(() => {
				if (!rangeRef.current) {
					return;
				}

				const d = rangeRef.current.from - filter.from;

				if (d >= 0) {
					const part = value.substring(filter.from, filter.from + d).replace(/^\//, '');
					S.Common.filterSetText(part);
				}
			}, 30);

			keyboard.shortcut('backspace', e, () => {
				if (!value.match('@')) {
					S.Menu.close('blockMention');
				}
			});

			return;
		}

		if (!keyboard.isSpecial(e)) {
			for (let i = 0; i < marksRef.current.length; ++i) {
				const mark = marksRef.current[i];

				if (Mark.needsBreak(mark.type) && (mark.range.to == to)) {
					const adjusted = Mark.adjust([ mark ], mark.range.to - 1, -1);

					marksRef.current[i] = adjusted[0];
					adjustMarks = true;
				}
			}
		}

		if (!value && !attachments.length && editingIdRef.current) {
			onDelete(editingIdRef.current);
		}

		if (adjustMarks) {
			updateMarkup(value, { from: to, to });
		}

		checkSendButton();
		updateButtons();
		removeBookmarks();
		updateCounter();
	};

	const onInput = () => {
		const value = getTextValue();
		const checkRtl = U.Common.checkRtl(value);

		$(refEditableRef.current?.getNode()).toggleClass('isRtl', checkRtl);
	};

	const onPaste = (e: any) => {
		e.preventDefault();

		const { space } = S.Common;
		const { from, to } = rangeRef.current;
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
					}
					marks = Mark.adjust(marks, 0, newText.length);

					newText += text + '\n';
					newMarks = newMarks.concat(marks);
				} else {
					const targetId = block.getTargetObjectId();

					if (targetId) {
						targetIds.push(targetId);
					}
				}
			});

			if (targetIds.length) {
				U.Object.getByIds(targetIds, { spaceId: space }, addAttachments);
			}
		};

		const parseText = () => {
			if (!newText) {
				return;
			}

			if (newText.length >= limit) {
				newText = newText.substring(0, limit);
			}

			newText = U.Common.stringInsert(current, newText, from, to);
			marksRef.current = Mark.adjust(marksRef.current, from, newText.length);
			marksRef.current = marksRef.current.concat(newMarks);

			const rt = to + newText.length;
			rangeRef.current = { from: rt, to: rt };
			updateMarkup(newText, rangeRef.current);
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
				}
				parseText();
			});
		} else 
		if (text) {
			newText = text;
			parseText();
		}

		if (list.length) {
			U.Common.saveClipboardFiles(list, {}, data => addAttachments(data.files));
		}

		checkUrls();
		updateCounter();
	};

	const checkUrls = () => {
		const text = getTextValue();
		const urls = U.Common.getUrlsFromText(text);
		if (!urls.length) {
			return;
		}

		removeBookmarks();

		for (const url of urls) {
			const { from, to, isLocal, isUrl, value } = url;

			if (isLocal) {
				continue;
			}

			if (Mark.getInRange(marksRef.current, I.MarkType.Link, { from, to })) {
				continue;
			}

			marksRef.current = Mark.adjust(marksRef.current, from - 1, value.length + 1);
			marksRef.current.push({ type: I.MarkType.Link, range: { from, to }, param: U.Common.urlFix(value) });
			
			if (isUrl) {
				addBookmark(value, true);
			}
		}

		updateMarkup(text, { from: rangeRef.current.to + 1, to: rangeRef.current.to + 1 });
	};

	const canDrop = (e: any): boolean => {
		return !props.readonly && U.File.checkDropFiles(e);
	};

	const onDragOver = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDragRef.current);
		$(nodeRef.current).addClass('isDraggingOver');
	};
	
	const onDragLeave = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		window.clearTimeout(timeoutDragRef.current);
		timeoutDragRef.current = window.setTimeout(() => {
			$(nodeRef.current).removeClass('isDraggingOver');
		}, 100);
	};
	
	const onDrop = (e: any) => {
		if (!canDrop(e)) {
			onDragLeave(e);
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		const { scrollToBottom } = props;
		const node = $(nodeRef.current);
		const electron = U.Common.getElectron();
		const list = Array.from(e.dataTransfer.files).map((it: File) => getObjectFromFile(it)).filter(it => {
			return !electron.isDirectory(it.path);
		});

		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		addAttachments(list, scrollToBottom);
		keyboard.disableCommonDrop(false);
	};

	const addAttachments = (list: any[], callBack?: () => void) => {
		const limit = J.Constant.limit.chat.attachments;

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
		}

		setAttachments(list.concat(attachments));
		if (callBack) {
			callBack();
		}
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
			}

			U.Object.getById(target, { spaceId }, object => {
				if (object) {
					addAttachments([ object ]);
				}
			});
		} else {
			isLoadingRef.current.push(url);

			C.LinkPreview(url, (message: any) => {
				isLoadingRef.current = isLoadingRef.current.filter(it => it != url);

				if (!message.error.code) {
					add({ ...message.previewLink, url });
				}
			});
		}
	};

	const removeBookmarks = () => {
		const bookmarks = attachments.filter(it => (it.layout == I.ObjectLayout.Bookmark) && it.fromText);
		
		let filtered = attachments;
		bookmarks.forEach(it => {
			const marks = marksRef.current.filter(mark => mark.param == it.source);
			if (!marks.length) {
				filtered = filtered.filter(file => file.id != it.id);
			}
		});

		if (attachments.length != filtered.length) {
			setAttachments(filtered);
		}
	};

	const removeBookmark = (url: string) => {
		onAttachmentRemove(sha1(url));
	};

	const onSend = () => {
		if (isSendingRef.current || !canSend() || S.Menu.isOpen('blockMention')){
			return;
		}

		const { rootId, subId, scrollToBottom, scrollToMessage } = props;
		const node = $(nodeRef.current);
		const send = node.find('#send');
		const loader = node.find('#form-loader');
		const list = attachments || [];
		const files = list.filter(it => it.isTmp && U.Object.isFileLayout(it.layout));
		const bookmarks = list.filter(it => it.isTmp && U.Object.isBookmarkLayout(it.layout));
		const fl = files.length;
		const bl = bookmarks.length;
		const bookmark = S.Record.getBookmarkType();
		const attachmentItems = attachments.filter(it => !it.isTmp).map(it => ({ target: it.id, type: I.AttachmentType.Link }));

		send.addClass('isLoading');
		loader.addClass('active');
		isSendingRef.current = true;

		const clear = () => {
			onEditClear(() => {
				isSendingRef.current = false;
				checkSendButton();
			});
			onReplyClear();
			clearCounter();
			checkSpeedLimit();

			send.removeClass('isLoading');
			loader.removeClass('active');
		};
		
		const callBack = () => {
			// Marks should be adjusted to remove leading new lines

			const parsed = getMarksFromHtml();
			const text = trim(parsed.text);
			const match = parsed.text.match(/^\r?\n+/);
			const diff = match ? match[0].length : 0;
			const marks = Mark.checkRanges(text, Mark.adjust(parsed.marks, 0, -diff));

			if (editingIdRef.current) {
				const message = S.Chat.getMessage(subId, editingIdRef.current);
				if (message) {
					const update = U.Common.objectCopy(message);

					update.attachments = attachmentItems;
					update.content.text = text;
					update.content.marks = marks;

					C.ChatEditMessageContent(rootId, editingIdRef.current, update, () => {
						scrollToMessage(editingIdRef.current, true, true);
						clear();
					});
				}
			} else {
				const message = {
					replyToMessageId: replyingId,
					content: {
						marks,
						text,
						style: I.TextStyle.Paragraph,
					},
					attachments: attachmentItems,
					reactions: [],
				};

				let messageType = 'Text';
				if (attachmentItems.length && message.content?.text.length) {
					messageType = 'Mixed';
				} else
				if (attachmentItems.length) {
					messageType = 'Attachment';
				}

				C.ChatAddMessage(rootId, message, (message: any) => {
					scrollToBottom();
					clear();

					analytics.event('SentMessage', { type: messageType });
				});
			}
		};

		const uploadFiles = (callBack: () => void) => {
			if (!fl) {
				callBack();
				return;
			}

			let n = 0;
			for (const item of files) {
				C.FileUpload(S.Common.space, '', item.path, I.FileType.None, {}, (message: any) => {
					n++;

					if (message.objectId) {
						attachmentItems.push({ target: message.objectId, type: I.AttachmentType.File });
					}

					if (n == fl) {
						callBack();
					}
				});
			}
		};

		const fetchBookmarks = (callBack: () => void) => {
			if (!bl) {
				callBack();
				return;
			}

			let n = 0;
			for (const item of bookmarks) {
				C.ObjectCreateFromUrl({ source: item.source }, S.Common.space, J.Constant.typeKey.bookmark, item.source, true, bookmark.defaultTemplateId, (message: any) => {
					n++;

					if (message.objectId) {
						attachmentItems.push({ target: message.objectId, type: I.AttachmentType.Link });
					}

					if (n == bl) {
						callBack();
					}
				});
			}
		};

		uploadFiles(() => fetchBookmarks(callBack));
	};

	const onEdit = (message: I.ChatMessage) => {
		const { subId } = props;
		const { text, marks } = message.content;
		const l = text.length;
		const attachmentItems = (message.attachments || []).map(it => it.target).map(id => S.Detail.get(subId, id));

		marksRef.current = marks;
		editingIdRef.current = message.id;

		setReplyingId('');
		updateMarkup(text, { from: l, to: l });
		updateCounter();

		setAttachments(attachmentItems);
		refEditableRef.current.setRange(rangeRef.current);

		analytics.event('ClickMessageMenuEdit');
	};

	const onEditClear = (callBack?: () => void) => {
		editingIdRef.current = '';
		marksRef.current = [];
		updateMarkup('', { from: 0, to: 0 });
		clearCounter();
		checkSendButton();
		refButtonsRef.current.setButtons();

		setAttachments([]);
		refEditableRef.current.setRange(rangeRef.current);

		if (callBack) {
			callBack();
		}
	};

	const onReply = (message: I.ChatMessage) => {
		const { readonly } = props;
		if (readonly) {
			return;
		}

		const text = getTextValue();
		const length = text.length;

		rangeRef.current = { from: length, to: length };
		refEditableRef.current?.setRange(rangeRef.current);
		setReplyingId(message.id);

		analytics.event('ClickMessageMenuReply');
	};

	const onReplyClear = () => {
		setReplyingId('');
		props.scrollToBottom();
	};

	const onDelete = (id: string) => {
		const { rootId, getMessages, scrollToMessage, scrollToBottom } = props;
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
						if (editingIdRef.current == id) {
							onEditClear();
						}

						if (next) {
							scrollToMessage(next.id, true);
						} else {
							scrollToBottom();
						}

						analytics.event('DeleteMessage');
					});
				},
				onCancel: () => {
					if (editingIdRef.current == id) {
						onEditClear();
					}
				},
			}
		});

		analytics.event('ClickMessageMenuDelete');
	};

	const getMarksAndRange = (): any => {
		return { marks: marksRef.current, range: rangeRef.current };
	};

	const getTextValue = (): string => {
		return String(refEditableRef.current?.getTextValue() || '');
	};

	const getHtmlValue = (): string => {
		return String(refEditableRef.current?.getHtmlValue() || '');
	};

	const trim = (value: string): string => {
		return String(value || '').replace(/^(\r?\n+)/g, '').replace(/(\r?\n+)$/g, '');
	};
	
	const getMarksFromHtml = (): I.FromHtmlResult => {
		return Mark.fromHtml(getHtmlValue(), []);
	};

	const onAttachmentRemove = (id: string) => {
		const value = getTextValue();
		const filteredAttachments = attachments.filter(it => it.id != id);

		if (editingIdRef.current && !value && !filteredAttachments.length) {
			onDelete(editingIdRef.current);
		} else {
			setAttachments(filteredAttachments);
			analytics.event('DetachItemChat');
		}
	};

	const onNavigationClick = (type: I.ChatReadType) => {
		switch (type) {
			case I.ChatReadType.Message: {
				props.onScrollToBottomClick();

				analytics.event('ClickScrollToBottom');
				break;
			}

			case I.ChatReadType.Mention: {
				const { subId, getMessages, scrollToMessage, loadMessagesByOrderId, highlightMessage } = props;
				const { mentionOrderId } = S.Chat.getState(subId);
				const messages = getMessages();
				const target = messages.find(it => it.orderId == mentionOrderId);

				if (target) {
					scrollToMessage(target.id, true, true);
				} else {
					loadMessagesByOrderId(mentionOrderId, () => {
						highlightMessage('', mentionOrderId);
					});
				}

				analytics.event('ClickScrollToMention');
				break;
			}
		}
	};

	const updateButtons = () => {
		refButtonsRef.current?.setButtons();
	};

	const onChatButtonSelect = (type: I.ChatButton, item: any) => {
		const { scrollToBottom } = props;

		switch (type) {
			case I.ChatButton.Object: {
				setAttachments([ item ].concat(attachments));
				scrollToBottom();
				break;
			}

			case I.ChatButton.Emoji: {
				const range = rangeRef.current || { from: 0, to: 0 };
				const to = range.from + 1;

				let value = getTextValue();

				marksRef.current = Mark.adjust(marksRef.current, range.from, 1);
				marksRef.current = Mark.toggle(marksRef.current, {
					type: I.MarkType.Emoji,
					param: item,
					range: { from: range.from, to },
				});

				value = U.Common.stringInsert(value, ' ', range.from, range.from);

				updateMarkup(value, { from: to, to });
				break;
			}
		}
	};

	const onTextButtonToggle = (type: I.MarkType, param: string) => {
		const { from, to } = rangeRef.current;
		const value = getTextValue();

		marksRef.current = Mark.toggle(marksRef.current, { type, param, range: { from, to } });
		updateMarkup(value, { from, to });

		switch (type) {
			case I.MarkType.Link: {
				if (param) {
					addBookmark(param);
				}
				break;
			}

			case I.MarkType.Object: {
				U.Object.getById(param, {}, (object: any) => {
					object.isTmp = true;
					object.timestamp = U.Date.now();

					setAttachments([ object ].concat(attachments));
				});
				break;
			}
		}

		updateButtons();
		renderMarkup();
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
		if (!rangeRef.current) {
			return;
		}

		const { rootId, blockId, subId } = props;

		let value = refEditableRef.current.getTextValue();
		let from = rangeRef.current.from;

		if (fromKeyboard) {
			value = U.Common.stringCut(value, from - 1, from);
			from--;
		}

		S.Common.filterSet(from, '');

		raf(() => {
			S.Menu.open('blockMention', {
				element: `#button-${blockId}-${I.ChatButton.Mention}`,
				...caretMenuParam(),
				data: {
					rootId,
					blockId,
					pronounId: U.Space.getMyParticipant()?.id,
					marks: marksRef.current,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						if (S.Menu.isAnimating('blockMention')) {
							return;
						}

						S.Detail.update(subId, { id: object.id, details: object }, false);

						marksRef.current = marks;
						value = U.Common.stringInsert(value, text, from, from);

						updateMarkup(value, { from: to, to });
						analytics.event('Mention');
					},
				},
			});
		});
	};

	const onMenuClose = () => {
		refEditableRef.current.setRange(rangeRef.current);
	};

	const caretMenuParam = () => {
		const win = $(window);
		const rect = U.Common.getSelectionRect();

		return {
			className: 'fixed',
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			horizontal: rect ? I.MenuDirection.Center : I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			onClose: () => refEditableRef.current.setRange(rangeRef.current),
			noFlipX: true,
			noFlipY: true,
			offsetY: -8,
		};
	};

	const canSend = (): boolean => {
		return !isLoadingRef.current.length && Boolean(editingIdRef.current || getTextValue().trim().length || attachments.length || marksRef.current.length);
	};

	const hasSelection = (): boolean => {
		return rangeRef.current ? rangeRef.current.to != rangeRef.current.from : false;
	};

	const updateMarkup = (value: string, range: I.TextRange) => {
		rangeRef.current = range;
		updateValue(value);
		renderMarkup();
		checkSendButton();
	};

	const updateValue = (value: string) => {
		if (!refEditableRef.current) {
			return;
		}

		refEditableRef.current.setValue(Mark.toHtml(value, marksRef.current));
		refEditableRef.current.setRange(rangeRef.current);
		refEditableRef.current.placeholderCheck();
		onInput();
	};

	const renderMarkup = () => {
		if (!refEditableRef.current) {
			return;
		}

		const { rootId, subId, renderLinks, renderMentions, renderObjects, renderEmoji } = props;
		const node = refEditableRef.current.getNode();
		const value = refEditableRef.current.getTextValue();
		const onChange = (text: string, marks: I.Mark[]) => {
			marksRef.current = marks;
			updateValue(text);
			updateMarkup(text, rangeRef.current);
		};
		const getValue = () => value;
		const param = { onChange, subId };

		renderMentions(rootId, node, marksRef.current, getValue, param);
		renderObjects(rootId, node, marksRef.current, getValue, props, param);
		renderLinks(rootId, node, marksRef.current, getValue, props, param);
		renderEmoji(node);
	};

	const renderReply = () => {
		if (!replyingId) {
			return;
		}

		const { rootId, subId, renderLinks, renderMentions, renderObjects, renderEmoji, getReplyContent } = props;
		const message = S.Chat.getMessage(subId, replyingId);

		if (!message) {
			return;
		}

		const marks = message.content.marks || [];
		const getValue = () => String(message.content.text || '');
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

		const el = $(refCounterRef.current);
		const l = v.length;
		const limit = J.Constant.limit.chat.text;

		if (l >= limit - 50) {
			el.addClass('show').text(`${l} / ${limit}`);
		} else {
			el.removeClass('show');
		}
	};

	const clearCounter = () => {
		$(refCounterRef.current).text('').removeClass('show');
	};

	const checkSpeedLimit = () => {
		const { last, counter } = speedLimitRef.current;
		const now = U.Date.now();

		if (now - last >= 5 ) {
			speedLimitRef.current = { last: now, counter: 1 };
			return;
		}

		speedLimitRef.current = { last: now, counter: counter + 1 };

		if (counter >= 5) {
			speedLimitRef.current = { last: now, counter: 1 };

			S.Popup.open('confirm', {
				onClose: () => {
					refEditableRef.current.setRange(rangeRef.current);
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
		}
	};

	const getReplyingId = () => {
		return replyingId;
	};

	const resize = () => {
		const { isPopup } = props;
		if (isPopup) {
			return;
		}

		const node = $(nodeRef.current);
		const dummy = $(refDummyRef.current);
		const padding = 16;

		if (!dummy.length) {
			return;
		}

		raf(() => {
			dummy.css({ height: node.outerHeight(true) });
			node.css({ left: dummy.offset().left - padding, width: dummy.width() + padding * 2 });
		});
	};

	const checkSendButton = () => {
		const node = $(nodeRef.current);
		const button = node.find('#send');

		canSend() || isSendingRef.current ? button.show() : button.hide();
	};

	const unbind = () => {
		const { isPopup, block } = props;
		const events = [ 'resize', 'sidebarResize' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	const rebind = () => {
		const { isPopup, block } = props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		unbind();
		win.on(`resize.${ns} sidebarResize.${ns}`, () => resize());
	};

	useImperativeHandle(ref, () => ({
		node: nodeRef.current,
		state: { attachments, replyingId },
		marks: marksRef.current,
		onReply,
		onEdit,
		onDelete,
		getReplyingId,
		onDragOver,
		onDragLeave,
		onDrop
	}));

	useEffect(() => {
		checkSendButton();

		const { rootId, readonly } = props;
		const storage = Storage.getChat(rootId);

		if (!readonly && storage) {
			const text = String(storage.text || '');
			const marks = storage.marks || [];
			const attachmentItems = (storage.attachments || []).filter(it => !it.isTmp);
			const length = text.length;

			marksRef.current = marks;
			updateMarkup(text, { from: length, to: length });
			updateCounter(text);

			if (attachmentItems.length) {
				setAttachments(attachmentItems);
			}
		}

		resize();
		rebind();

		return () => {
			unbind();
			window.clearTimeout(timeoutFilterRef.current);
			keyboard.disableSelection(false);
		};
	}, []);

	useEffect(() => {
		props.loadDepsAndReplies([], () => {
			renderMarkup();
			renderReply();
		});
		checkSendButton();
		resize();
	});

	const { subId, readonly, getReplyContent } = props;
	const value = getTextValue();
	const { messageCounter, mentionCounter } = S.Chat.getState(subId);
	const mc = messageCounter > 999 ? '999+' : messageCounter;

	let form = null;
	let title = '';
	let text = '';
	let icon: any = null;
	let onClear = () => {};

	if (editingIdRef.current) {
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

				let iconSize = null;
				if (U.Object.getFileLayouts().concat(U.Object.getHumanLayouts()).includes(object.layout)) {
					iconSize = 32;
				}

				icon = <IconObject className={iconSize ? 'noBg' : ''} object={object} size={32} iconSize={iconSize} />;
			}
			if (reply.isMultiple && !reply.attachment) {
				icon = <Icon className="isMultiple" />;
			}
			onClear = onReplyClear;
		}
	}

	const Button = (item: any) => (
		<div id={`navigation-${item.type}`} className={`btn ${item.className || ''}`} onClick={() => onNavigationClick(item.type)}>
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
					ref={refEditableRef}
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
									/>
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				) : ''}

				<Buttons
					ref={refButtonsRef}
					{...props}
					value={value}
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
				/>

				<div ref={refCounterRef} className="charCounter" />

				<Icon id="send" className="send" onClick={onSend} />
			</div>
		);
	}

	return (
		<>
			<div ref={refDummyRef} className="formDummy" />
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

				<div className="navigation">
					{mentionCounter ? <Button type={I.ChatReadType.Mention} icon="mention" className="active" cnt={mentionCounter} /> : ''}
					<Button type={I.ChatReadType.Message} icon="arrow" className={messageCounter ? 'active' : ''} cnt={mc} />
				</div>

				{form}

				<div className="bottom" />
			</div>
		</>
	);
}));

export default ChatForm;