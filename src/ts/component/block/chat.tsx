import React, { useRef, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Label, Icon, Button, EmptyState } from 'Component';
import { I, C, S, U, J, keyboard, translate, Preview, Mark, analytics } from 'Lib';

import Message from './chat/message';
import Form from './chat/form';

const GROUP_TIME = 300;

const BlockChat = observer((props: I.BlockComponent) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const refListRef = useRef<HTMLDivElement>(null);
	const refFormRef = useRef<any>(null);
	const isLoadedRef = useRef(false);
	const isLoadingRef = useRef(false);
	const isBottomRef = useRef(false);
	const isAutoLoadDisabledRef = useRef(false);
	const messageRefsRef = useRef<any>({});
	const timeoutInterfaceRef = useRef(0);
	const timeoutScrollRef = useRef(0);
	const timeoutScrollStopRef = useRef(0);
	const topRef = useRef(0);
	const firstUnreadOrderIdRef = useRef('');
	const scrolledItemsRef = useRef(new Set());

	const getRootId = () => {
		const { rootId } = props;
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);
		return object.chatId;
	};

	const getSubId = (): string => {
		return [ '', S.Common.space, `${getRootId()}:${props.block.id}`, U.Common.getWindowId() ].join('-');
	};

	const getMessages = () => {
		return S.Chat.getList(getSubId());
	};

	const hasScroll = () => {
		const { isPopup } = props;
		const container = U.Common.getScrollContainer(isPopup);

		if (isPopup && container.length) {
			const el = container.get(0);
			return el.scrollHeight > el.clientHeight;
		}

		return document.documentElement.scrollHeight > window.innerHeight;
	};

	const getSections = () => {
		const messages = getMessages();
		const sections = [];

		messages.forEach(item => {
			const key = U.Date.dateWithFormat(I.DateFormat.ShortUS, item.createdAt);
			const section = sections.find(it => it.key == key);

			if (!section) {
				sections.push({ createdAt: item.createdAt, key, isSection: true, list: [ item ] });
			} else {
				section.list.push(item);
			}
		});

		// Message groups by author/time
		sections.forEach(section => {
			const length = section.list.length;

			for (let i = 0; i < length; ++i) {
				const prev = section.list[i - 1];
				const item = section.list[i];

				item.isFirst = false;
				item.isLast = false;

				if (prev && ((item.creator != prev.creator) || (item.createdAt - prev.createdAt >= GROUP_TIME) || item.replyToMessageId)) {
					item.isFirst = true;

					if (prev) {
						prev.isLast = true;
					}
				}
			}

			section.list[0].isFirst = true;
			section.list[length - 1].isLast = true;
		});

		sections.sort((c1, c2) => {
			if (c1.createdAt > c2.createdAt) return 1;
			if (c1.createdAt < c2.createdAt) return -1;
			return 0;
		});

		return sections;
	};

	const getMessageMenuOptions = (message, noControls) => {
		const { config } = S.Common;

		let options: any[] = [];

		if (message.content.text) {
			options.push({ id: 'copy', icon: 'copy', name: translate('blockChatCopyText') });
		}

		if (message.creator == S.Auth.account.id) {
			options = options.concat([
				{ id: 'edit', icon: 'pencil', name: translate('commonEdit') },
				{ id: 'delete', icon: 'remove', name: translate('commonDelete') },
			]);
		}

		if (!noControls) {
			options = ([
				{ id: 'reaction', icon: 'reaction', name: translate('blockChatReactionAdd') },
				{ id: 'reply', icon: 'reply', name: translate('blockChatReply') },
				options.length ? { isDiv: true } : null,
			].filter(it => it)).concat(options);
		}

		if (config.experimental) {
			options = options.concat([
				{ isDiv: true },
				{ id: 'link', icon: 'link', name: translate('commonCopyLink') },
				{ id: 'unread', name: translate('blockChatMarkAsUnread') },
			]);
		}

		return options;
	};

	const setIsBottom = (v: boolean) => {
		isBottomRef.current = v;

		const node = $(refFormRef.current?.node);
		const btn = node.find(`#navigation-${I.ChatReadType.Message}`);

		btn.toggleClass('active', !v);
	};

	const setAutoLoadDisabled = (v: boolean) => {
		isAutoLoadDisabledRef.current = v;
	};

	const highlightMessage = (id: string, orderId?: string) => {
		const messages = getMessages();
		const target = messages.find(it => orderId ? it.orderId == orderId : it.id == id);

		if (!target) {
			return;
		}

		messageRefsRef.current[target.id]?.highlight();
	};

	const scrollToBottomCheck = () => {
		if (isBottomRef.current) {
			window.clearTimeout(timeoutScrollRef.current);
			timeoutScrollRef.current = window.setTimeout(() => scrollToBottom(false), 50);
		}
	};

	const scrollToBottom = (animate?: boolean) => {
		if (!hasScroll()) {
			readScrolledMessages();
			setIsBottom(true);
			return;
		}

		const { isPopup } = props;
		const container = U.Common.getScrollContainer(isPopup);
		const node = $(nodeRef.current);
		const wrapper = node.find('#scrollWrapper');
		const y = wrapper.outerHeight();

		setAutoLoadDisabled(true);

		const cb = () => {
			readScrolledMessages();
			setAutoLoadDisabled(false);
			setIsBottom(true);
		};

		if (animate) {
			const animContainer = isPopup ? U.Common.getScrollContainer(isPopup) : $('html, body');
			animContainer.stop(true, true).animate({ scrollTop: y }, 300, cb);
		} else {
			container.scrollTop(y);
			cb();
		}
	};

	const readScrolledMessages = () => {
		const viewport = getMessagesInViewport();

		scrolledItemsRef.current = new Set(viewport.map(it => it.id));
		onReadStop();
	};

	const getMessagesInViewport = () => {
		const { isPopup } = props;
		const messages = getMessages();
		const container = U.Common.getScrollContainer(isPopup);
		const formHeight = refFormRef.current ? $(refFormRef.current.node).outerHeight() : 120;
		const ch = isPopup ? container.outerHeight() : $(window).height();
		const min = container.scrollTop();
		const max = min + ch - formHeight;
		const ret = [];

		messages.forEach((it: any) => {
			const st = getMessageScrollOffset(it.id);

			if ((st >= min) && (st <= max)) {
				ret.push(it);
			}
		});

		return ret;
	};

	const getMessageScrollOffset = (id: string): number => {
		const ref = messageRefsRef.current[id];
		if (!ref) {
			return 0;
		}

		const node = $(ref.node);
		return node.length ? node.offset().top + node.outerHeight() : 0;
	};

	const scrollToMessage = (id: string, animate?: boolean, highlight?: boolean) => {
		if (!id) {
			return;
		}

		if (!hasScroll()) {
			readScrolledMessages();
			return;
		}

		const { isPopup } = props;
		const container = U.Common.getScrollContainer(isPopup);
		const top = getMessageScrollOffset(id);
		const y = Math.max(0, top - container.height() / 2 - J.Size.header);

		setIsBottom(false);
		setAutoLoadDisabled(true);

		const cb = () => {
			readScrolledMessages();
			setAutoLoadDisabled(false);

			if (highlight) {
				highlightMessage(id);
			}
		};

		if (animate) {
			const animContainer = isPopup ? U.Common.getScrollContainer(isPopup) : $('html, body');
			animContainer.stop(true, true).animate({ scrollTop: y }, 300, cb);
		} else {
			container.scrollTop(y);
			cb();
		}
	};

	const onReadStop = () => {
		if (!scrolledItemsRef.current.size) {
			return;
		}

		const subId = getSubId();
		const ids: string[] = [ ...scrolledItemsRef.current ] as string[];
		const first = S.Chat.getMessage(subId, ids[0]);
		const last = S.Chat.getMessage(subId, ids[ids.length - 1]);
		const rootId = getRootId();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;
		const isFocused = U.Common.getElectron().isFocused();

		if (isFocused) {
			if (first && last) {
				C.ChatReadMessages(rootId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Message);
				C.ChatReadMessages(rootId, first.orderId, last.orderId, lastStateId, I.ChatReadType.Mention);
			}

			S.Chat.setReadMessageStatus(subId, ids, true);
			S.Chat.setReadMentionStatus(subId, ids, true);
		}

		scrolledItemsRef.current.clear();
	};

	const loadDepsAndReplies = (list: I.ChatMessage[], callBack?: () => void) => {
		loadReplies(getReplyIds(list), () => {
			loadDeps(getDepsIds(list), () => {
				if (callBack) {
					callBack();
				}
			});
		});
	};

	const getReplyIds = (list: any[]) => {
		return (list || []).filter(it => it.replyToMessageId).map(it => it.replyToMessageId);
	};

	const getDepsIds = (list: any[]) => {
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];
		const subId = getSubId();

		let attachments = [];
		let marks = [];

		if (refFormRef.current) {
			attachments = attachments.concat((refFormRef.current.state.attachments || []).filter(it => !it.isTmp).map(it => it.id));
			marks = marks.concat(refFormRef.current.marks || []);

			const replyingId = refFormRef.current.getReplyingId();

			if (replyingId) {
				const message = S.Chat.getMessage(subId, replyingId);
				if (message) {
					list.push(message);
				}
			}
		}

		list.forEach(it => {
			attachments = attachments.concat((it.attachments || []).map(it => it.target));
			marks = marks.concat(it.content.marks || []);
		});

		marks = marks.filter(it => markTypes.includes(it.type) && it.param).map(it => it.param);

		return attachments.concat(marks).filter(it => it);
	};

	const loadDeps = (ids: string[], callBack?: () => void) => {
		if (!ids.length) {
			if (callBack) {
				callBack();
			}
			return;
		}

		U.Subscription.subscribeIds({
			subId: getSubId(),
			ids,
			noDeps: true,
			keys: U.Subscription.chatRelationKeys(),
			updateDetails: true,
		}, () => {
			if (callBack) {
				callBack();
			}
		});
	};

	const loadReplies = (ids: string[], callBack?: () => void) => {
		if (!ids.length) {
			if (callBack) {
				callBack();
			}
			return;
		}

		const rootId = getRootId();
		const subId = getSubId();

		C.ChatGetMessagesByIds(rootId, ids, (message: any) => {
			if (!message.error.code) {
				message.messages.forEach(it => S.Chat.setReply(subId, it));
			}

			if (callBack) {
				callBack();
			}
		});
	};

	const loadMessages = (dir: number, clear: boolean, callBack?: () => void) => {
		const rootId = getRootId();
		const subId = getSubId();

		if (!rootId || isLoadingRef.current) {
			return;
		}

		if (!clear && (dir > 0) && isLoadedRef.current) {
			setIsBottom(true);
			return;
		}

		isLoadingRef.current = true;

		if (clear) {
			subscribeMessages(clear, () => {
				isLoadingRef.current = false;
				setIsBottom(true);

				if (callBack) {
					callBack();
				}
			});
		} else {
			const list = getMessages();
			if (!list.length) {
				isLoadingRef.current = false;
				return;
			}

			const first = list[0];
			const before = dir < 0 ? list[0].orderId : '';
			const after = dir > 0 ? list[list.length - 1].orderId : '';

			if (!before && !after) {
				isLoadingRef.current = false;
				return;
			}

			C.ChatGetMessages(rootId, before, after, J.Constant.limit.chat.messages, false, (message: any) => {
				isLoadingRef.current = false;

				if (message.error.code) {
					isLoadedRef.current = true;

					if (callBack) {
						callBack();
					}
					return;
				}

				const messages = message.messages || [];

				if (dir > 0) {
					if (messages.length < J.Constant.limit.chat.messages) {
						isLoadedRef.current = true;
						setIsBottom(true);
						subscribeMessages(false);
					} else {
						setIsBottom(false);
					}
				} else {
					setIsBottom(false);
				}

				loadDepsAndReplies(messages, () => {
					if (messages.length) {
						S.Chat[(dir < 0 ? 'prepend' : 'append')](subId, messages);

						if (first && (dir < 0)) {
							scrollToMessage(first.id);
						}
					}

					if (callBack) {
						callBack();
					}
				});
			});
		}
	};

	const subscribeMessages = (clear: boolean, callBack?: () => void) => {
		const rootId = getRootId();
		const subId = getSubId();

		if (!rootId) {
			return;
		}

		C.ChatSubscribeLastMessages(rootId, J.Constant.limit.chat.messages, subId, (message: any) => {
			if (message.error.code) {
				if (callBack) {
					callBack();
				}
				return;
			}

			if (message.state) {
				S.Chat.setState(subId, message.state);
			}

			const messages = message.messages || [];

			loadDepsAndReplies(messages, () => {
				if (messages.length && clear) {
					S.Chat.set(subId, messages);
				}

				if (callBack) {
					callBack();
				}
			});
		});
	};

	const loadMessagesByOrderId = (orderId: string, callBack?: () => void) => {
		const rootId = getRootId();
		const subId = getSubId();
		const limit = Math.ceil(J.Constant.limit.chat.messages / 2);

		let list = [];

		C.ChatGetMessages(rootId, orderId, '', limit, true, (message: any) => {
			if (!message.error.code && message.messages.length) {
				list = list.concat(message.messages);
			}

			C.ChatGetMessages(rootId, '', orderId, limit, false, (message: any) => {
				if (!message.error.code && message.messages.length) {
					list = list.concat(message.messages);
				}

				loadDepsAndReplies(list, () => {
					S.Chat.set(subId, list);

					if (callBack) {
						callBack();
					}
				});
			});
		});
	};

	const getReplyContent = (message: any): any => {
		const { creator, content } = message;
		const author = U.Space.getParticipant(U.Space.getParticipantId(S.Common.space, creator));
		const title = U.Common.sprintf(translate('blockChatReplying'), author?.name);
		const layouts = U.Object.getFileLayouts().concat(I.ObjectLayout.Bookmark);
		const subId = getSubId();
		const attachments = (message.attachments || []).map(it => S.Detail.get(subId, it.target)).filter(it => !it._empty_ && !it.isDeleted);
		const l = attachments.length;

		let text: string = '';
		let attachmentText: string = '';
		let attachment: any = null;
		let isMultiple: boolean = false;

		if (content.text) {
			text = U.Common.sanitize(Mark.toHtml(content.text, content.marks));
			text = text.replace(/\n\r?/g, ' ');
		}

		if (!l) {
			return { title, text };
		}

		const first = attachments[0];

		if (l == 1) {
			attachmentText = first.name || U.Common.plural(1, translate('pluralAttachment'));
			attachment = first;
		} else {
			let attachmentLayout = I.ObjectLayout[first.layout];

			attachment = null;
			attachments.forEach((el) => {
				if ((I.ObjectLayout[el.layout] != attachmentLayout) || !layouts.includes(el.layout)) {
					isMultiple = true;
					attachment = first;
					attachmentLayout = 'Attachment';
				}
			});
			attachmentText = text.length ? `${U.Common.plural(l, translate(`plural${attachmentLayout}`))} (${l})` : `${l} ${U.Common.plural(l, translate(`plural${attachmentLayout}`)).toLowerCase()}`;
		}

		if (!text) {
			text = attachmentText;
			attachment = first;
		}

		return { title, text, attachment, isMultiple };
	};

	const onScrollToBottomClick = () => {
		loadMessages(1, true, () => scrollToBottom(true));
	};

	const onContextMenu = (e: React.MouseEvent, item: any, onMore?: boolean) => {
		const { readonly } = props;
		if (readonly) {
			return;
		}

		const { rootId } = props;
		const { space } = S.Common;
		const { isPopup, block } = props;
		const message = `#block-${block.id} #item-${item.id}`;
		const container = isPopup ? U.Common.getScrollContainer(isPopup) : $('body');
		const object = S.Detail.get(rootId, rootId, []);

		const menuParam: Partial<I.MenuParam> = {
			className: 'chatMessage',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			onOpen: () => {
				$(message).addClass('hover');
				container.addClass('over');
			},
			onClose: () => {
				$(message).removeClass('hover');
				container.removeClass('over');
			},
			data: {
				options: getMessageMenuOptions(item, onMore),
				onSelect: (e, option) => {
					switch (option.id) {
						case 'reaction': {
							messageRefsRef.current[item.id].onReactionAdd();
							break;
						}

						case 'copy': {
							U.Common.clipboardCopy({ text: item.content.text });
							analytics.event('ClickMessageMenuCopy');
							break;
						}

						case 'link': {
							U.Object.copyLink(object, space, 'deeplink', '', `&messageOrder=${encodeURIComponent(item.orderId)}`);
							analytics.event('ClickMessageMenuLink');
							break;
						}

						case 'reply': {
							refFormRef.current.onReply(item);
							break;
						}

						case 'edit': {
							refFormRef.current.onEdit(item);
							break;
						}

						case 'delete': {
							refFormRef.current.onDelete(item.id);
							break;
						}

						case 'unread': {
							C.ChatUnreadMessages(rootId, item.orderId);
							break;
						}
					}
				},
			},
		};

		if (onMore) {
			menuParam.element = `${message} .icon.more`;
		} else {
			menuParam.recalcRect = () => ({ x: keyboard.mouse.page.x, y: keyboard.mouse.page.y, width: 0, height: 0 });
		}

		S.Menu.open('select', menuParam);
	};

	const onReplyEdit = (e: React.MouseEvent, message: any) => {
		refFormRef.current.onReply(message);
		scrollToBottomCheck();
	};

	const onReplyClick = (e: React.MouseEvent, item: any) => {
		isLoadedRef.current = false;
		setIsBottom(false);

		const rootId = getRootId();
		const subId = getSubId();
		const message = S.Chat.getMessage(subId, item.replyToMessageId);

		analytics.event('ClickScrollToReply');

		if (message) {
			scrollToMessage(message.id, true, true);
			return;
		}

		C.ChatGetMessagesByIds(rootId, [ item.replyToMessageId ], (message: any) => {
			if (message.error.code || !message.messages.length) {
				return;
			}

			const reply = message.messages[0];
			if (!reply) {
				return;
			}

			S.Chat.clear(subId);
			loadMessagesByOrderId(reply.orderId, () => scrollToMessage(reply.id, true, true));
		});
	};

	const onScroll = (e: any) => {
		const rootId = getRootId();
		const { isPopup } = props;
		const subId = getSubId();
		const node = $(nodeRef.current);
		const scrollWrapper = node.find('#scrollWrapper');
		const formWrapper = node.find('#formWrapper');
		const container = U.Common.getScrollContainer(isPopup);
		const st = container.scrollTop();
		const dates = node.find('.section > .date');
		const fh = formWrapper.outerHeight();
		const ch = container.outerHeight();
		const hh = J.Size.header;
		const list = getMessagesInViewport();
		const state = S.Chat.getState(subId);
		const { lastStateId } = state;
		const isFocused = U.Common.getElectron().isFocused();

		setIsBottom(false);

		if (!isAutoLoadDisabledRef.current) {
			if (st <= 0) {
				loadMessages(-1, false);
			}

			if (st - fh >= scrollWrapper.outerHeight() - ch) {
				loadMessages(1, false);
			}
		}

		dates.each((i, item: any) => {
			item = $(item);

			const y = item.offset().top - st;

			item.removeClass('hide');

			if (y == hh + 8) {
				window.clearTimeout(timeoutInterfaceRef.current);
				timeoutInterfaceRef.current = window.setTimeout(() => item.addClass('hide'), 1000);
			}
		});

		if (!isFocused) {
			list.forEach(it => {
				scrolledItemsRef.current.add(it.id);

				if (!it.isReadMessage) {
					S.Chat.setReadMessageStatus(subId, [ it.id ], true);
					C.ChatReadMessages(rootId, it.orderId, it.orderId, lastStateId, I.ChatReadType.Message);
				}
				if (!it.isReadMention) {
					S.Chat.setReadMentionStatus(subId, [ it.id ], true);
					C.ChatReadMessages(rootId, it.orderId, it.orderId, lastStateId, I.ChatReadType.Mention);
				}
			});
		}

		window.clearTimeout(timeoutScrollStopRef.current);
		timeoutScrollStopRef.current = window.setTimeout(() => onReadStop(), 300);

		topRef.current = st;

		Preview.tooltipHide(true);
		Preview.previewHide(true);
	};

	const onMessageAdd = (message: I.ChatMessage, subIds: string[]) => {
		const subId = getSubId();
		if (subIds.includes(subId)) {
			loadDepsAndReplies([ message ], () => scrollToBottomCheck());
		}
	};

	const onDragOver = (e: React.DragEvent) => {
		refFormRef.current?.onDragOver(e);
	};

	const onDragLeave = (e: React.DragEvent) => {
		refFormRef.current?.onDragLeave(e);
	};

	const onDrop = (e: React.DragEvent) => {
		refFormRef.current?.onDrop(e);
	};

	const loadState = (callBack?: () => void) => {
		const rootId = getRootId();
		const subId = getSubId();

		if (!rootId) {
			return;
		}

		C.ChatSubscribeLastMessages(rootId, 0, subId, (message: any) => {
			if (message.state) {
				S.Chat.setState(subId, message.state);
			}

			if (callBack) {
				callBack();
			}
		});
	};

	const unbind = () => {
		const { isPopup, block } = props;
		const events = [ 'messageAdd', 'messageUpdate', 'reactionUpdate' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
	};

	const rebind = () => {
		const { isPopup, block } = props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		unbind();

		win.on(`messageAdd.${ns}`, (e, message, subIds) => onMessageAdd(message, subIds));
		win.on(`messageUpdate.${ns}`, (e, message, subIds) => onMessageAdd(message, subIds));
		win.on(`reactionUpdate.${ns}`, () => scrollToBottomCheck());

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => onScroll(e));
	};

	useEffect(() => {
		rebind();

		const { isPopup } = props;
		const match = keyboard.getMatch(isPopup);

		loadState(() => {
			const { messageOrderId } = S.Chat.getState(getSubId());
			const orderId = match.params.messageOrder || messageOrderId;

			if (orderId) {
				firstUnreadOrderIdRef.current = orderId;

				loadMessagesByOrderId(orderId, () => {
					const target = getMessages().find(it => it.orderId == orderId);

					if (target) {
						scrollToMessage(target.id);
					} else {
						loadMessages(1, true, scrollToBottom);
					}
				});
			} else {
				loadMessages(1, true, scrollToBottom);
			}

			analytics.event('ScreenChat');
		});

		return () => {
			unbind();

			window.clearTimeout(timeoutInterfaceRef.current);
			window.clearTimeout(timeoutScrollRef.current);
			window.clearTimeout(timeoutScrollStopRef.current);
		};
	}, []);

	const { showRelativeDates, dateFormat } = S.Common;
	const { block } = props;
	const rootId = getRootId();
	const messages = getMessages();
	const sections = getSections();
	const subId = getSubId();
	const hasScrollValue = hasScroll();
	const space = U.Space.getSpaceview();

	const Section = (item: any) => {
		const day = showRelativeDates ? U.Date.dayString(item.createdAt) : null;
		const date = day ? day : U.Date.dateWithFormat(dateFormat, item.createdAt);

		return (
			<div className="section">
				<div className="date">
					<Label text={date} />
				</div>

				{(item.list || []).map(item => {
					const hasMore = !!getMessageMenuOptions(item, true).length;

					return (
						<Message
							ref={ref => messageRefsRef.current[item.id] = ref}
							key={item.id}
							{...props}
							id={item.id}
							rootId={rootId}
							blockId={block.id}
							subId={subId}
							isNew={item.orderId == firstUnreadOrderIdRef.current}
							hasMore={hasMore}
							scrollToBottom={scrollToBottomCheck}
							onContextMenu={e => onContextMenu(e, item)}
							onMore={e => onContextMenu(e, item, true)}
							onReplyEdit={e => onReplyEdit(e, item)}
							onReplyClick={e => onReplyClick(e, item)}
							getReplyContent={getReplyContent}
						/>
					);
				})}
			</div>
		);
	};

	return (
		<div 
			ref={nodeRef}
			className="wrap"
			onDragOver={onDragOver} 
			onDragLeave={onDragLeave} 
			onDrop={onDrop}
		>
			<div id="scrollWrapper" ref={refListRef} className="scrollWrapper">
				{!messages.length ? (
					<EmptyState
						text={translate('blockChatEmpty')}
						buttonText={space.isChat ? translate('blockChatEmptyShareInviteLink') : ''}
						onButton={() => U.Object.openAuto({ id: 'spaceShare', layout: I.ObjectLayout.Settings })}
					/>
				) : (
					<div className="scroll">
						{sections.map(section => <Section {...section} key={section.createdAt} />)}
					</div>
				)}
			</div>

			<Form 
				ref={refFormRef}
				{...props}
				rootId={rootId}
				blockId={block.id}
				subId={subId}
				onScrollToBottomClick={onScrollToBottomClick}
				scrollToBottom={scrollToBottom}
				scrollToMessage={scrollToMessage}
				loadMessagesByOrderId={loadMessagesByOrderId}
				getMessages={getMessages}
				getMessagesInViewport={getMessagesInViewport}
				getIsBottom={() => hasScrollValue ? isBottomRef.current : true}
				getReplyContent={getReplyContent}
				highlightMessage={highlightMessage}
				loadDepsAndReplies={loadDepsAndReplies}
			/>
		</div>
	);

});

export default BlockChat;