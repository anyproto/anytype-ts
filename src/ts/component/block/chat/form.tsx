import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Icon, IconObject, Label, Loader } from 'Component';
import { I, C, S, U, J, keyboard, Mark, translate, Storage, Preview } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';

import Attachment from './attachment';
import Buttons from './buttons';

interface Props extends I.BlockComponent {
	blockId: string;
	subId: string;
	onScrollToBottomClick: () => void;
	scrollToBottom: () => void;
	scrollToMessage: (id: string, animate?: boolean) => void;
	loadMessagesByOrderId: (orderId: string, callBack?: () => void) => void;
	getMessages: () => I.ChatMessage[];
	getMessagesInViewport: () => any[];
	getIsBottom: () => boolean;
	getReplyContent: (message: any) => any;
	highlightMessage: (id: string, orderId?: string) => void;
};

interface State {
	attachments: any[];
	charCounter: number;
};

const ChatForm = observer(class ChatForm extends React.Component<Props, State> {

	_isMounted = false;
	node = null;
	refEditable = null;
	refButtons = null;
	refCounter = null;
	refDummy = null;
	isLoading = [];
	marks: I.Mark[] = [];
	range: I.TextRange = { from: 0, to: 0 };
	timeoutFilter = 0;
	editingId: string = '';
	replyingId: string = '';
	swiper = null;
	speedLimit = { last: 0, counter: 0 };
	state = {
		attachments: [],
		charCounter: 0,
	};

	constructor (props: Props) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onFocusInput = this.onFocusInput.bind(this);
		this.onBlurInput = this.onBlurInput.bind(this);
		this.onKeyUpInput = this.onKeyUpInput.bind(this);
		this.onKeyDownInput = this.onKeyDownInput.bind(this);
		this.onInput = this.onInput.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onMention = this.onMention.bind(this);
		this.onChatButtonSelect = this.onChatButtonSelect.bind(this);
		this.onTextButtonToggle = this.onTextButtonToggle.bind(this);
		this.onMenuClose = this.onMenuClose.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onSend = this.onSend.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onEditClear = this.onEditClear.bind(this);
		this.onReply = this.onReply.bind(this);
		this.onReplyClear = this.onReplyClear.bind(this);
		this.onAttachmentRemove = this.onAttachmentRemove.bind(this);
		this.onSwiper = this.onSwiper.bind(this);
		this.onNavigationClick = this.onNavigationClick.bind(this);
		this.addAttachments = this.addAttachments.bind(this);
		this.hasSelection = this.hasSelection.bind(this);
		this.caretMenuParam = this.caretMenuParam.bind(this);
		this.removeBookmark = this.removeBookmark.bind(this);
		this.getMarksAndRange = this.getMarksAndRange.bind(this);
		this.getObjectFromPath = this.getObjectFromPath.bind(this);
	};

	render () {
		const { subId, readonly, getReplyContent } = this.props;
		const { attachments, charCounter } = this.state;
		const value = this.getTextValue();
		const { messageCounter, mentionCounter } = S.Chat.getState(subId);
		const mc = messageCounter > 999 ? '999+' : messageCounter;

		if (readonly) {
			return (
				<>
					<div ref={ref => this.refDummy = ref} className="formDummy" />
					<div 
						ref={ref => this.node = ref} 
						id="formWrapper" 
						className="formWrapper"
					>
						<div className="readonly">{translate('blockChatFormReadonly')}</div>
					</div>
				</>
			);
		};

		let title = '';
		let text = '';
		let icon: any = null;
		let onClear = () => {};

		if (this.editingId) {
			title = translate('blockChatEditing');
			onClear = this.onEditClear;
		} else
		if (this.replyingId) {
			const message = S.Chat.getMessage(subId, this.replyingId);

			if (message) {
				const reply = getReplyContent(message);

				title = reply.title;
				text = reply.text;
				if (reply.attachment) {
					const object = reply.attachment;

					let iconSize = null;
					if (U.Object.getFileLayouts().concat([ I.ObjectLayout.Human, I.ObjectLayout.Participant ]).includes(object.layout)) {
						iconSize = 32;
					};

					icon = <IconObject className={iconSize ? 'noBg' : ''} object={object} size={32} iconSize={iconSize} />;
				};
				if (reply.isMultiple && !reply.attachment) {
					icon = <Icon className="isMultiple" />;
				};
				onClear = this.onReplyClear;
			};
		};

		const Button = (item: any) => (
			<div id={`navigation-${item.type}`} className={`btn ${item.className || ''}`} onClick={() => this.onNavigationClick(item.type)}>
				<div className="bg" />
				<Icon className={item.icon} />

				{item.cnt ? (
					<div className="counter">
						<Label text={String(item.cnt)} />
					</div>
				) : ''}
			</div>
		);

		return (
			<>
				<div ref={ref => this.refDummy = ref} className="formDummy" />
				<div 
					ref={ref => this.node = ref}
					id="formWrapper" 
					className="formWrapper"
				>
					<div className="navigation">
						{mentionCounter ? <Button type={I.ChatReadType.Mention} icon="mention" className="active" cnt={mentionCounter} /> : ''}
						<Button type={I.ChatReadType.Message} icon="arrow" className={messageCounter ? 'active' : ''} cnt={mc} />
					</div>

					<div className="form">
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
							ref={ref => this.refEditable = ref}
							id="messageBox"
							classNameWrap="customScrollbar"
							maxLength={J.Constant.limit.chat.text}
							placeholder={translate('blockChatPlaceholder')}
							onSelect={this.onSelect}
							onFocus={this.onFocusInput}
							onBlur={this.onBlurInput}
							onKeyUp={this.onKeyUpInput} 
							onKeyDown={this.onKeyDownInput}
							onInput={this.onInput}
							onPaste={this.onPaste}
							onMouseDown={this.onMouseDown}
							onMouseUp={this.onMouseUp}
						/>

						{attachments.length ? (
							<div className="attachments">
								<Swiper
									slidesPerView={'auto'}
									spaceBetween={8}
									onSwiper={swiper => this.swiper = swiper}
									navigation={true}
									mousewheel={true}
									modules={[ Navigation, Mousewheel ]}
								>
									{attachments.map(item => (
										<SwiperSlide key={item.id}>
											<Attachment
												object={item}
												onRemove={this.onAttachmentRemove}
												bookmarkAsDefault={true}
											/>
										</SwiperSlide>
									))}
								</Swiper>
							</div>
						) : ''}

						<Buttons
							ref={ref => this.refButtons = ref}
							{...this.props}
							value={value}
							hasSelection={this.hasSelection}
							getMarksAndRange={this.getMarksAndRange}
							attachments={attachments}
							caretMenuParam={this.caretMenuParam}
							onMention={this.onMention}
							onChatButtonSelect={this.onChatButtonSelect}
							onTextButtonToggle={this.onTextButtonToggle}
							getObjectFromPath={this.getObjectFromPath}
							addAttachments={this.addAttachments}
							onMenuClose={this.onMenuClose}
							removeBookmark={this.removeBookmark}
						/>

						<div ref={ref => this.refCounter = ref} className="charCounter">{charCounter} / {J.Constant.limit.chat.text}</div>

						<Icon id="send" className="send" onClick={this.onSend} />
					</div>
				</div>
			</>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.checkSendButton();

		const { rootId, readonly } = this.props;
		const storage = Storage.getChat(rootId);

		if (!readonly && storage) {
			const text = String(storage.text || '');
			const marks = storage.marks || [];
			const attachments = storage.attachments || [];
			const length = text.length;

			this.marks = marks;
			this.updateMarkup(text, length, length);
			this.updateCounter(text);

			if (attachments.length) {
				this.setAttachments(attachments);
			};
		};

		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		this.renderMarkup();
		this.checkSendButton();
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
		window.clearTimeout(this.timeoutFilter);
		keyboard.disableSelection(false);
	};

	unbind () {
		const { isPopup, block } = this.props;
		const events = [ 'resize' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	rebind () {
		const { isPopup, block } = this.props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		this.unbind();
		win.on(`resize.${ns}`, () => this.resize());
	};

	checkSendButton () {
		const node = $(this.node);
		const button = node.find('#send');

		this.canSend() ? button.show() : button.hide();
	};

	onSelect () {
		this.range = this.refEditable.getRange();
	};

	onMouseDown () {
		this.onSelect();
		this.updateButtons();
	};

	onMouseUp () {
		this.onSelect();
		this.updateButtons();
	};

	onFocusInput () {
		keyboard.disableSelection(true);
		this.refEditable?.placeholderCheck();
	};

	onBlurInput () {
		const { rootId } = this.props;
		const { attachments } = this.state;

		keyboard.disableSelection(false);
		this.refEditable?.placeholderCheck();

		Storage.setChat(rootId, {
			text: this.getTextValue(),
			marks: this.marks,
			attachments,
		});
	};

	onKeyDownInput (e: any) {
		const { checkMarkOnBackspace } = this.props;
		const range = this.range;
		const cmd = keyboard.cmdKey();

		let value = this.refEditable.getTextValue();

		keyboard.shortcut(`enter, ${cmd}+enter`, e, () => {
			e.preventDefault();
			this.onSend();
		});

		if (range && range.to) {
			keyboard.shortcut('backspace', e, () => {
				const parsed = checkMarkOnBackspace(value, range, this.marks);

				if (!parsed.save) {
					return;
				};

				e.preventDefault();

				value = parsed.value;
				this.marks = parsed.marks;

				const l = value.length;
				this.updateMarkup(value, l, l);
			});
		};

		keyboard.shortcut('chatObject', e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();
				this.refButtons.onChatButton(e, I.ChatButton.Object);
			};
		});

		keyboard.shortcut('menuSmile', e, () => {
			if (!S.Menu.isOpen('smile')) {
				e.preventDefault();
				this.refButtons.onChatButton(e, I.ChatButton.Emoji);
			};
		});

		keyboard.shortcut('chatMention', e, () => {
			if (!S.Menu.isOpen('mention')) {
				e.preventDefault();
				this.refButtons.onChatButton(e, I.ChatButton.Mention);
			};
		});

		if (this.editingId) {
			keyboard.shortcut('escape', e, () => {
				this.editingId = '';
				this.marks = [];
				this.range = { from: 0, to: 0 };
				this.updateValue('');
			});
		};

		// Mark-up
		if (range && range.to && (range.from != range.to)) {
			let type = null;
			let param = '';

			for (const item of keyboard.getMarkParam()) {
				keyboard.shortcut(item.key, e, () => {
					type = item.type;
					param = item.param;
				});
			};

			if (type !== null) {
				this.refButtons.onTextButton(e, type, param);
			};
		};
	};

	onKeyUpInput (e: any) {
		this.range = this.refEditable.getRange() || { from: 0, to: 0 };

		const { attachments } = this.state;
		const { to } = this.range;
		const { filter } = S.Common;
		const value = this.getTextValue();
		const parsed = this.getMarksFromHtml();
		const oneSymbolBefore = this.range ? value[this.range.from - 1] : '';
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@');

		this.marks = parsed.marks;

		let adjustMarks = false;

		if (value !== parsed.text) {
			this.updateValue(parsed.text);
		};

		if (canOpenMenuMention) {
			this.onMention(true);
		};

		if (menuOpenMention) {
			window.clearTimeout(this.timeoutFilter);
			this.timeoutFilter = window.setTimeout(() => {
				if (!this.range) {
					return;
				};

				const d = this.range.from - filter.from;

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
			for (let i = 0; i < this.marks.length; ++i) {
				const mark = this.marks[i];

				if (Mark.needsBreak(mark.type) && (mark.range.to == to)) {
					const adjusted = Mark.adjust([ mark ], mark.range.to - 1, -1);

					this.marks[i] = adjusted[0];
					adjustMarks = true;
				};
			};
		};

		if (!value && !attachments.length && this.editingId) {
			this.onDelete(this.editingId);
		};

		if (adjustMarks) {
			this.updateMarkup(value, to, to);
		};

		this.checkSendButton();
		this.updateButtons();
		this.removeBookmarks();
		this.updateCounter();
	};

	onInput () {
		const value = this.getTextValue();
		const checkRtl = U.Common.checkRtl(value);

		$(this.refEditable?.getNode()).toggleClass('isRtl', checkRtl);
	};

	onPaste (e: any) {
		e.preventDefault();

		const { from, to } = this.range;
		const limit = J.Constant.limit.chat.text;
		const current = this.getTextValue();
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const electron = U.Common.getElectron();
		const list = U.Common.getDataTransferFiles((e.clipboardData || e.originalEvent.clipboardData).items).map((it: File) => this.getObjectFromFile(it)).filter(it => {
			return !electron.isDirectory(it.path);
		});

		let text = U.Common.normalizeLineEndings(String(cb.getData('text/plain') || ''));
		let value = U.Common.stringInsert(current, text, from, to);
		if (value.length >= limit) {
			const excess = value.length - limit;
			const keep = text.length - excess;

			text = text.substring(0, keep);
			value = U.Common.stringInsert(current, text, from, to);
		};

		this.range = { from: to, to: to + text.length };
		this.updateMarkup(value, this.range.from, this.range.to);

		if (list.length) {
			U.Common.saveClipboardFiles(list, {}, data => {
				this.addAttachments(data.files);
			});
		};

		this.checkUrls();
		this.updateCounter();
	};

	checkUrls () {
		const text = this.getTextValue();
		const urls = U.Common.getUrlsFromText(text);
		if (!urls.length) {
			return;
		};

		this.removeBookmarks();

		for (const url of urls) {
			const { from, to, isLocal, value } = url;
			const param = isLocal ? `file://${value}` : value;

			this.marks = Mark.adjust(this.marks, from - 1, value.length + 1);
			this.marks.push({ type: I.MarkType.Link, range: { from, to }, param});
			this.addBookmark(param, true);
		};

		this.updateMarkup(text, this.range.to + 1, this.range.to + 1);
	};

	canDrop (e: any): boolean {
		return this._isMounted && !this.props.readonly && U.File.checkDropFiles(e);
	};

	onDragOver (e: any) {
		e.preventDefault();
		e.stopPropagation();

		$(this.node).addClass('isDraggingOver');
	};
	
	onDragLeave (e: any) {
		e.preventDefault();
		e.stopPropagation();

		$(this.node).removeClass('isDraggingOver');
	};
	
	onDrop (e: any) {
		if (!this.canDrop(e)) {
			$(this.node).removeClass('isDraggingOver');
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const { scrollToBottom } = this.props;
		const node = $(this.node);
		const electron = U.Common.getElectron();
		const list = Array.from(e.dataTransfer.files).map((it: File) => this.getObjectFromFile(it)).filter(it => {
			return !electron.isDirectory(it.path);
		});

		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		this.addAttachments(list, scrollToBottom);
		keyboard.disableCommonDrop(false);
	};

	addAttachments (list: any[], callBack?: () => void) {
		const { attachments } = this.state;
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
		};

		this.setAttachments(list.concat(attachments), callBack);
	};

	setAttachments (list: any[], callBack?: () => void) {
		this.setState({ attachments: list }, callBack);
	};

	addBookmark (url: string, fromText?: boolean) {
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
			this.addAttachments([ item ]);
		};

		this.isLoading.push(url);

		C.LinkPreview(url, (message: any) => {
			this.isLoading = this.isLoading.filter(it => it != url);

			if (message.error.code) {
				add({ title: url, url });
			} else {
				add({ ...message.previewLink, url });
			};
		});
	};

	removeBookmarks () {
		const attachments = this.state.attachments || [];
		const bookmarks = attachments.filter(it => (it.layout == I.ObjectLayout.Bookmark) && it.fromText);
		
		let filtered = attachments;
		bookmarks.forEach(it => {
			const marks = this.marks.filter(mark => mark.param == it.source);
			if (!marks.length) {
				filtered = filtered.filter(file => file.id != it.id);
			};
		});

		if (attachments.length != filtered.length) {
			this.setAttachments(filtered);
		};
	};

	removeBookmark (url: string) {
		this.onAttachmentRemove(sha1(url));
	};

	onSend () {
		if (!this.canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const { rootId, subId, scrollToBottom, scrollToMessage } = this.props;
		const node = $(this.node);
		const loader = node.find('#form-loader');
		const list = this.state.attachments || [];
		const files = list.filter(it => it.isTmp && U.Object.isFileLayout(it.layout));
		const bookmarks = list.filter(it => it.isTmp && U.Object.isBookmarkLayout(it.layout));
		const fl = files.length;
		const bl = bookmarks.length;
		const bookmark = S.Record.getBookmarkType();
		const attachments = (this.state.attachments || []).filter(it => !it.isTmp).map(it => ({ target: it.id, type: I.AttachmentType.Link }));

		loader.addClass('active');

		const clear = () => {
			this.onEditClear();
			this.onReplyClear();
			this.clearCounter();
			this.checkSpeedLimit();
			loader.removeClass('active');
		};
		
		const callBack = () => {
			if (this.editingId) {
				const message = S.Chat.getMessage(subId, this.editingId);
				if (message) {
					const { marks, text } = this.getMarksFromHtml();
					const update = U.Common.objectCopy(message);

					update.attachments = attachments;
					update.content.text = text;
					update.content.marks = marks;

					C.ChatEditMessageContent(rootId, this.editingId, update, () => {
						scrollToMessage(this.editingId, true);
						clear();
					});
				};
			} else {
				const message = {
					replyToMessageId: this.replyingId,
					content: {
						...this.getMarksFromHtml(),
						style: I.TextStyle.Paragraph,
					},
					attachments,
					reactions: [],
				};

				C.ChatAddMessage(rootId, message, (message: any) => {
					scrollToBottom();
					clear();
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
						attachments.push({ target: message.objectId, type: I.AttachmentType.File });
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
				C.ObjectCreateFromUrl({ source: item.source }, S.Common.space, J.Constant.typeKey.bookmark, item.source, true, bookmark.defaultTemplateId, (message: any) => {
					n++;

					if (message.objectId) {
						attachments.push({ target: message.objectId, type: I.AttachmentType.Link });
					};

					if (n == bl) {
						callBack();
					};
				});
			};
		};

		uploadFiles(() => fetchBookmarks(callBack));
	};

	onEdit (message: I.ChatMessage) {
		const { subId } = this.props;
		const { text, marks } = message.content;
		const l = text.length;
		const attachments = (message.attachments || []).map(it => it.target).map(id => S.Detail.get(subId, id));

		this.marks = marks;
		this.editingId = message.id;
		this.replyingId = '';
		this.updateMarkup(text, l, l);
		this.updateCounter();

		this.setAttachments(attachments, () => {
			this.refEditable.setRange(this.range);
		});
	};

	onEditClear () {
		this.editingId = '';
		this.marks = [];
		this.updateMarkup('', 0, 0);
		this.setState({ attachments: [] }, () => this.refEditable.setRange(this.range));
		this.clearCounter();
		this.refButtons.setButtons();
	};

	onReply (message: I.ChatMessage) {
		const text = this.getTextValue();
		const length = text.length;

		this.replyingId = message.id;
		this.range = { from: length, to: length };
		this.refEditable.setRange(this.range);
		this.forceUpdate();
	};

	onReplyClear () {
		this.replyingId = '';
		this.forceUpdate();
		this.props.scrollToBottom();
	};

	onDelete (id: string) {
		const { rootId, getMessages, scrollToMessage, scrollToBottom } = this.props;
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
						if (this.editingId == id) {
							this.onEditClear();
						};

						if (next) {
							scrollToMessage(next.id, true);
						} else {
							scrollToBottom();
						};
					});
				},
			}
		});
	};

	getMarksAndRange (): any {
		return { marks: this.marks, range: this.range };
	};

	getTextValue (): string {
		return this.trim(String(this.refEditable?.getTextValue() || '').replace(/^\r?\n/gm, ''));
	};

	getHtmlValue (): string {
		return this.trim(String(this.refEditable?.getHtmlValue() || ''));
	};

	trim (value: string): string {
		return String(value || '').replace(/^(\r?\n)/gm, '').replace(/(\r?\n)$/gm, '');
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		return Mark.fromHtml(this.getHtmlValue(), []);
	};

	onAttachmentRemove (id: string) {
		this.setState({ attachments: this.state.attachments.filter(it => it.id != id) });
	};

	onSwiper (swiper) {
		this.swiper = swiper;
	};

	onNavigationClick (type: I.ChatReadType) {
		switch (type) {
			case I.ChatReadType.Message: {
				this.props.onScrollToBottomClick();
				break;
			};

			case I.ChatReadType.Mention: {
				const { subId, getMessages, scrollToMessage, loadMessagesByOrderId, highlightMessage } = this.props;
				const { mentionOrderId } = S.Chat.getState(subId);
				const messages = getMessages();
				const target = messages.find(it => it.orderId == mentionOrderId);

				if (target) {
					scrollToMessage(target.id, true);
				} else {
					loadMessagesByOrderId(mentionOrderId, () => {
						highlightMessage('', mentionOrderId);
					});
				};
				break;
			};
		};

	};

	updateButtons () {
		this.refButtons?.setButtons();
	};

	onChatButtonSelect (type: I.ChatButton, item: any) {
		const { scrollToBottom } = this.props;
		const { attachments } = this.state;
		const range = this.range || { from: 0, to: 0 };

		switch (type) {
			case I.ChatButton.Object: {
				this.setAttachments([ item ].concat(attachments), () => scrollToBottom());
				break;
			};

			case I.ChatButton.Emoji: {
				const to = range.from + 1;

				let value = this.getTextValue();

				this.marks = Mark.adjust(this.marks, range.from, 1);
				this.marks = Mark.toggle(this.marks, {
					type: I.MarkType.Emoji,
					param: item,
					range: { from: range.from, to },
				});

				value = U.Common.stringInsert(value, ' ', range.from, range.from);

				this.updateMarkup(value, to, to);
				break;
			};
		};
	};

	onTextButtonToggle (type: I.MarkType, param: string) {
		const { from, to } = this.range;
		const { attachments } = this.state;
		const value = this.getTextValue();

		this.marks = Mark.toggle(this.marks, { type, param, range: { from, to } });
		this.updateMarkup(value, from, to);

		switch (type) {
			case I.MarkType.Link: {
				if (param) {
					this.addBookmark(param);
				};
				break;
			};

			case I.MarkType.Object: {
				U.Object.getById(param, {}, (object: any) => {
					object.isTmp = true;
					object.timestamp = U.Date.now();

					attachments.unshift(object);
					this.setAttachments(attachments);
				});
				break;
			};
		};

		this.updateButtons();
		this.renderMarkup();
	};

	getObjectFromFile (file: File) {
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

	getObjectFromPath (path: string) {
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

	onMention (fromKeyboard?: boolean) {
		if (!this.range) {
			return;
		};

		const { rootId, blockId } = this.props;

		let value = this.refEditable.getTextValue();
		let from = this.range.from;

		if (fromKeyboard) {
			value = U.Common.stringCut(value, from - 1, from);
			from--;
		};

		S.Common.filterSet(from, '');

		raf(() => {
			S.Menu.open('blockMention', {
				element: `#button-${blockId}-${I.ChatButton.Mention}`,
				...this.caretMenuParam(),
				data: {
					rootId,
					blockId,
					pronounId: U.Space.getMyParticipant()?.id,
					marks: this.marks,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						S.Detail.update(rootId, { id: object.id, details: object }, false);

						value = U.Common.stringInsert(value, text, from, from);
						marks.forEach(mark => this.marks = Mark.toggle(this.marks, mark));

						this.updateMarkup(value, to, to);
					},
				},
			});
		});
	};

	onMenuClose () {
		this.refEditable.setRange(this.range);
	};

	caretMenuParam () {
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
			onClose: () => this.refEditable.setRange(this.range),
			noFlipX: true,
			noFlipY: true,
			offsetY: -8,
		};
	};

	canSend (): boolean {
		return !this.isLoading.length && Boolean(this.editingId || this.getTextValue().trim().length || this.state.attachments.length || this.marks.length);
	};

	hasSelection (): boolean {
		return this.range ? this.range.to - this.range.from > 0 : false;
	};

	updateMarkup (value: string, from: number, to: number) {
		this.range = { from, to };
		this.updateValue(value);
		this.renderMarkup();
		this.checkSendButton();
	};

	updateValue (value: string) {
		if (!this.refEditable) {
			return;
		};

		this.refEditable.setValue(Mark.toHtml(value, this.marks));
		this.refEditable.setRange(this.range);
		this.refEditable.placeholderCheck();
		this.onInput();
	};

	renderMarkup () {
		if (!this.refEditable) {
			return;
		};

		const { rootId, renderLinks, renderMentions, renderObjects, renderEmoji } = this.props;
		const node = this.refEditable.getNode();
		const value = this.refEditable.getTextValue();
		const onChange = (text: string, marks: I.Mark[]) => {
			this.marks = marks;
			this.updateValue(text);
			this.updateMarkup(text, this.range.from, this.range.to);
		};

		const param = { onChange };

		renderMentions(rootId, node, this.marks, () => value, param);
		renderObjects(rootId, node, this.marks, () => value, this.props, param);
		renderLinks(node, this.marks, () => value, this.props, param);
		renderEmoji(node);
	};

	updateCounter (v?: string) {
		const value = v || this.getTextValue();
		const l = value.length;

		this.setState({ charCounter: l });
		$(this.refCounter).toggleClass('show', l >= J.Constant.limit.chat.text - 50);
	};

	clearCounter () {
		this.setState({ charCounter: 0 });
		$(this.refCounter).removeClass('show');
	};

	checkSpeedLimit () {
		const { last, counter } = this.speedLimit;
		const now = U.Date.now();

		if (now - last >= 5 ) {
			this.speedLimit = {
				last: now,
				counter: 1
			};
			return;
		};

		this.speedLimit = {
			last: now,
			counter: counter + 1,
		};

		if (counter >= 5) {
			this.speedLimit = {
				last: now,
				counter: 1
			};

			S.Popup.open('confirm', {
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

	resize () {
		const { isPopup } = this.props;
		if (isPopup) {
			return;
		};

		const node = $(this.node);
		const dummy = $(this.refDummy);

		if (!dummy.length) {
			return;
		};

		raf(() => {
			dummy.css({ width: node.outerWidth(true), height: node.outerHeight(true) });
			node.css({ left: dummy.offset().left });
		});
	};

});

export default ChatForm;
