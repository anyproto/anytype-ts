import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Label, Icon } from 'Component';
import { I, C, S, U, J, keyboard, Mark, translate, Storage } from 'Lib';

import Buttons from './chat/buttons';
import Message from './chat/message';
import Attachment from './chat/attachment';

const LIMIT = 50;

interface State {
	threadId: string;
	attachments: any[];
	files: any[];
};

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent, State> {

	_isMounted = false;
	node = null;
	refList = null;
	refEditable = null;
	refButtons = null;
	marks: I.Mark[] = [];
	range: I.TextRange = { from: 0, to: 0 };
	deps: string[] = [];
	timeoutFilter = 0;
	messagesMap: any = {};
	lastMessageId: string = '';
	lastMessageOffset: number = 0;
	editingId: string = '';
	state = {
		threadId: '',
		attachments: [],
		files: [],
	};

	constructor (props: I.BlockComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onFocusInput = this.onFocusInput.bind(this);
		this.onBlurInput = this.onBlurInput.bind(this);
		this.onKeyUpInput = this.onKeyUpInput.bind(this);
		this.onKeyDownInput = this.onKeyDownInput.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onMention = this.onMention.bind(this);
		this.onChatButtonSelect = this.onChatButtonSelect.bind(this);
		this.onTextButtonToggle = this.onTextButtonToggle.bind(this);
		this.onMenuClose = this.onMenuClose.bind(this);
		this.onThread = this.onThread.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onContextMenu = this.onContextMenu.bind(this);
		this.onEditMessage = this.onEditMessage.bind(this);
		this.hasSelection = this.hasSelection.bind(this);
		this.caretMenuParam = this.caretMenuParam.bind(this);
		this.getMarksAndRange = this.getMarksAndRange.bind(this);
	};

	render () {
		const { readonly } = this.props;
		const { threadId, attachments, files } = this.state;
		const rootId = this.getRootId();
		const blockId = this.getBlockId();
		const value = this.getTextValue();
		const messages = this.getMessages();
		const sections = this.getSections();
		const attachmentList = attachments.concat(files);
		const subId = this.getSubId();
		const list = this.getDeps().map(id => S.Detail.get(subId, id));

		const Section = (item: any) => {
			const ds = U.Date.dayString(item.time);

			return (
				<div className="section">
					<div className="date">
						<Label text={ds || U.Date.date(U.Date.dateFormat(I.DateFormat.MonthAbbrAfterDay), item.time)} />
					</div>

					{(item.list || []).map(item => (
						<Message
							ref={ref => this.messagesMap[item.id] = ref}
							key={item.id}
							{...this.props}
							{...item}
							rootId={rootId}
							blockId={blockId}
							isThread={!!threadId}
							onThread={this.onThread}
							onContextMenu={e => this.onContextMenu(e, item)}
							isLast={item.id == this.lastMessageId}
						/>
					))}
				</div>
			);
		};

		return (
			<div 
				ref={ref => this.node = ref}
				className="wrap"
				onDragOver={this.onDragOver} 
				onDragLeave={this.onDragLeave} 
				onDrop={this.onDrop}
			>
				<div id="scrollWrapper" ref={ref => this.refList = ref} className="scrollWrapper">
					{!messages.length ? (
						<div className="emptyState">
							<div className="img"><Icon /></div>
							<Label text={translate('blockChatEmpty')} />
						</div>
					) : (
						<div className="scroll">
							{sections.map(section => <Section {...section} key={section.time} />)}
						</div>
					)}
				</div>

				<div id="formWrapper" className="formWrapper">
					<div className="form">
						<Editable 
							ref={ref => this.refEditable = ref}
							id="messageBox"
							readonly={readonly}
							placeholder={translate('blockChatPlaceholder')}
							onSelect={this.onSelect}
							onFocus={this.onFocusInput}
							onBlur={this.onBlurInput}
							onKeyUp={this.onKeyUpInput} 
							onKeyDown={this.onKeyDownInput}
							onInput={this.onChange}
							onPaste={this.onPaste}
							onMouseDown={this.onMouseDown}
							onMouseUp={this.onMouseUp}
						/>

						{attachmentList.length ? (
							<div className="attachments">
								{attachmentList.map((item: any, i: number) => (
									<Attachment key={i} object={item} onRemove={() => this.onAttachmentRemove(item.id)} />
								))}
							</div>
						) : ''}

						<Buttons
							ref={ref => this.refButtons = ref}
							rootId={rootId}
							blockId={blockId}
							value={value}
							hasSelection={this.hasSelection}
							getMarksAndRange={this.getMarksAndRange}
							attachments={attachments}
							caretMenuParam={this.caretMenuParam}
							onMention={this.onMention}
							onChatButtonSelect={this.onChatButtonSelect}
							onTextButtonToggle={this.onTextButtonToggle}
							onMenuClose={this.onMenuClose}
						/>

						<Icon id="send" className="send" onClick={this.onAddMessage} />
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const blockId = this.getBlockId();
		const lastId = Storage.getLastChatMessageId(rootId);
		const ns = blockId + U.Common.getEventNamespace(isPopup);
		const messages = this.getMessages();

		this._isMounted = true;
		this.checkSendButton();

		if (lastId && this.messagesMap[lastId]) {
			if (lastId == messages[messages.length - 1].id) {
				this.scrollToBottom();
				return;
			};

			const node = $(this.messagesMap[lastId].node);

			this.lastMessageId = lastId;
			this.lastMessageOffset = node.offset().top;

			raf(() => this.scrollToMessage(lastId));
		};

		U.Common.getScrollContainer(isPopup).on(`scroll.${ns}`, e => this.onScroll(e));

		this.loadMessages();
	};

	componentDidUpdate () {
		const deps = this.getDeps();

		if (!U.Common.compareJSON(deps, this.deps)) {
			this.deps = deps;
			this.loadDeps(() => this.forceUpdate());
		};

		this.checkSendButton();
	};

	componentWillUnmount () {
		const { isPopup } = this.props;
		const blockId = this.getBlockId();
		const ns = blockId + U.Common.getEventNamespace(isPopup);

		this._isMounted = false;
		U.Common.getScrollContainer(isPopup).off(`scroll.${ns}`);
		C.ObjectSearchUnsubscribe([ this.getSubId() ]);
	};

	loadMessages (callBack?: () => void) {
		const rootId = this.getRootId();

		C.ChatGetMessages(rootId, (message: any) => {
			if (!message.error.code) {
				S.Chat.set(rootId, message.messages);
				this.forceUpdate();
			};

			if (callBack) {
				callBack();
			};
		});
	};

	getMessages () {
		const rootId = this.getRootId();
		const list = S.Chat.getList(rootId);
		const length = list.length;
		const slice = length > LIMIT ? list.slice(length - LIMIT, length) : list;
		
		return slice;
	};

	getDeps () {
		const messages = this.getMessages();
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];
		const deps = U.Common.arrayUnique(messages.reduce((acc, it) => {
			const data = it.data || {};
			const marks = (data.marks || [].filter(it => markTypes.includes(it.types))).map(it => it.param);

			return acc.concat(data.attachments || []).concat(marks);
		}, []));

		return deps;
	};

	getSubId (): string {
		return S.Record.getSubId(this.getRootId(), this.getBlockId());
	};

	loadDeps (callBack?: () => void) {
		const rootId = this.getRootId();
		const deps = this.getDeps();

		if (!deps.length) {
			return;
		};

		U.Data.subscribeIds({
			subId: this.getSubId(),
			ids: deps,
			noDeps: true,
		}, (message: any) => {
			message.records.forEach(it => S.Detail.update(rootId, { id: it.id, details: it }, false));

			if (callBack) {
				callBack();
			};
		});
	};

	checkSendButton () {
		const node = $(this.node);
		const button = node.find('#send');

		this.canSend() ? button.removeClass('disabled') : button.addClass('disabled');	
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
		keyboard.disableSelection(false);
		this.refEditable?.placeholderCheck();
	};

	onKeyUpInput () {
		this.range = this.refEditable.getRange();

		const { filter } = S.Common;
		const value = this.getTextValue();
		const parsed = this.getMarksFromHtml();
		const oneSymbolBefore = this.range ? value[this.range.from - 1] : '';
		const menuOpenMention = S.Menu.isOpen('blockMention');
		const canOpenMenuMention = !menuOpenMention && (oneSymbolBefore == '@');

		this.marks = parsed.marks;

		if (value !== parsed.text) {
			this.refEditable.setValue(Mark.toHtml(parsed.text, this.marks));
			this.refEditable.setRange(this.range);
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
			return;
		};

		this.checkSendButton();
		this.updateButtons();
	};

	onKeyDownInput (e: any) {
		const { checkMarkOnBackspace } = this.props;
		const range = this.range;
		const cmd = keyboard.cmdKey();

		let value = this.refEditable.getTextValue();

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.onAddMessage();
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

				this.refEditable.setValue(Mark.toHtml(value, this.marks));
				this.refEditable.setRange({ from: value.length, to: value.length });

				this.renderMarkup();
			});
		};

		keyboard.shortcut(`${cmd}+t`, e, () => {
			if (!S.Menu.isOpen('searchObject')) {
				e.preventDefault();
				this.refButtons.onChatButton(e, I.ChatButton.Object);
			};
		});

		keyboard.shortcut(`${cmd}+e`, e, () => {
			if (!S.Menu.isOpen('smile')) {
				e.preventDefault();
				this.refButtons.onChatButton(e, I.ChatButton.Emoji);
			};
		});

		keyboard.shortcut(`${cmd}+m`, e, () => {
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

				this.refEditable.setValue('');
				this.refEditable.placeholderCheck();
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

	onChange () {
	};

	onPaste () {
	};

	canDrop (e: any): boolean {
		return this._isMounted && e.dataTransfer.files && e.dataTransfer.files.length && !this.props.readonly;
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

		const { files } = this.state;
		const node = $(this.node);
		const list = Array.from(e.dataTransfer.files).map((it: any) => ({
			id: sha1(it.path),
			name: it.name,
			layout: I.ObjectLayout.File,
			description: U.File.size(it.size),
			path: it.path,
		}));
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		this.setState({ files: files.concat(list) });
		keyboard.disableCommonDrop(false);
	};

	getRootId () {
		const { rootId } = this.props;
		const object = S.Detail.get(rootId, rootId, [ 'chatId' ]);

		return object.chatId || rootId;
	};

	getBlockId () {
		return this.state.threadId || this.props.block.id;
	};

	getSections () {
		const messages = this.getMessages();
		const sections = [];

		messages.forEach(item => {
			if (!item.data.time) {
				return;
			};

			const key = U.Date.date(U.Date.dateFormat(I.DateFormat.ShortUS), item.data.time);
			const section = sections.find(it => it.key == key);

			if (!section) {
				sections.push({ time: item.data.time, key, isSection: true, list: [ item ] });
			} else {
				section.list.push(item);
			};
		});

		sections.sort((c1, c2) => {
			if (c1.time > c2.time) return 1;
			if (c1.time < c2.time) return -1;
			return 0;
		});

		return sections;
	};

	onContextMenu (e: React.MouseEvent, item: any) {
		const { account } = S.Auth;

		if (item.author != account.id) {
			return;
		};

		const { rootId } = this.props;
		const blockId = this.getBlockId();

		S.Menu.open('select', {
			element: `#block-${blockId} #item-${item.id} .right`,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			data: {
				options: [
					{ id: 'edit', name: translate('commonEdit') },
					{ id: 'delete', name: translate('commonDelete'), color: 'red' }
				],
				onSelect: (e, option) => {
					switch (option.id) {
						case 'edit': {
							this.onEditMessage(item);
							break;
						};
						case 'delete': {
							C.BlockListDelete(rootId, [ item.id ]);
							break;
						};
					};
				}
			}
		});
	};

	onAddMessage = () => {
		if (!this.canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const rootId = this.getRootId();
		const { account } = S.Auth;
		const { attachments, files } = this.state;
		const fl = files.length;

		const data = {
			...this.getMarksFromHtml(),
			time: U.Date.now(),
			attachments: attachments.map(it => it.id),
			reactions: [],
			isEdited: false
		};

		const clear = () => {
			this.editingId = '';
			this.marks = [];
			this.range = { from: 0, to: 0 };

			this.refEditable.setValue('');
			this.refEditable.placeholderCheck();

			this.setState({ attachments: [], files: [] });
			this.loadMessages();
		};
		
		const callBack = () => {
			if (this.editingId) {
				const message = this.getMessages().find(it => it.id == this.editingId);
				if (message) {
					const { marks, text } = this.getMarksFromHtml();
					const update = U.Common.objectCopy(message.data);

					update.attachments = (update.attachments || []).concat(data.attachments || []);
					update.isEdited = true;
					update.text = text;
					update.marks = marks;

					C.ChatEditMessage(rootId, this.editingId, JSON.stringify(update), (message: any) => {
						if (message.error.code) {
							return;
						};

						this.scrollToMessage(this.editingId);
						clear();
					});
				};
			} else {
				C.ChatAddMessage(rootId, JSON.stringify(data), (message: any) => {
					if (message.error.code) {
						return;
					};

					Storage.setLastChatMessageId(rootId, message.messageId);

					this.scrollToBottom();
					this.lastMessageId = message.messageId;

					clear();
				});
			};
		};

		if (fl) {
			let n = 0;

			for (const file of files) {
				C.FileUpload(S.Common.space, '', file.path, I.FileType.None, {}, (message: any) => {
					n++;

					if (message.objectId) {
						data.attachments.push(message.objectId);
					};

					if (n == fl) {
						callBack();
					};
				});
			};
		} else {
			callBack();
		};
	};

	onEditMessage = (message) => {
		const { text, marks } = message.data;
		const l = text.length;

		this.marks = marks;
		this.range = { from: l, to: l };
		this.editingId = message.id;
		this.refEditable.setValue(Mark.toHtml(text, this.marks));
		this.renderMarkup();

		raf(() => this.refEditable.setRange(this.range));
	};

	onScroll (e: any) {
		const { isPopup } = this.props;
		const rootId = this.getRootId();
		const container = U.Common.getScrollContainer(isPopup);
		const top = container.scrollTop() - $('#scrollWrapper').offset().top;
		const form = $('#formWrapper');
		const formPadding = Number(form.css('padding-bottom').replace('px', ''));
		const viewport = container.outerHeight() - form.height() - formPadding;
		const messages = this.getMessages();

		const messagesIntoView = messages.filter(it => {
			if (!this.messagesMap[it.id]) {
				return false;
			};

			const node = $(this.messagesMap[it.id].node);
			if (!node.length) {
				return false;
			};

			const ot = node.offset().top + node.height();
			return (ot >= top) && (ot < top + viewport);
		});

		if (!messagesIntoView.length) {
			return;
		};

		const last = messagesIntoView[messagesIntoView.length - 1];
		const lastNode = this.messagesMap[last.id].node;

		if (lastNode.offsetTop > this.lastMessageOffset) {
			this.lastMessageId = last.id;
			this.lastMessageOffset = lastNode.offsetTop;

			Storage.setLastChatMessageId(rootId, last.id);
		};
	};

	scrollToMessage (id: string) {
		const el = this.messagesMap[id];
		if (!el) {
			return;
		};

		const node = $(this.messagesMap[id].node);
		if (!node.length) {
			return;
		};

		const { isPopup } = this.props;
		const pageContainer = U.Common.getPageContainer(isPopup);
		const scrollContainer = U.Common.getScrollContainer(isPopup);
		const hh = pageContainer.find('#header').height();
		const top = node.offset().top + node.outerHeight() + hh + 16;

		scrollContainer.scrollTop(top);
	};

	scrollToBottom () {
		raf(() => {
			const { isPopup } = this.props;
			const container = U.Common.getScrollContainer(isPopup);
			const height = isPopup ? container.get(0).scrollHeight : document.body.scrollHeight;

			container.scrollTop(height);
		});
	};

	getMarksAndRange (): any {
		return { marks: this.marks, range: this.range };
	};

	getTextValue (): string {
		return String(this.refEditable?.getTextValue() || '');
	};

	getHtmlValue (): string {
		return String(this.refEditable?.getHtmlValue() || '');
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		return Mark.fromHtml(this.getHtmlValue(), []);
	};

	onAttachmentRemove (id: string) {
		const { attachments } = this.state;

		this.setState({ attachments: attachments.filter(it => it.id != id) });
	};

	updateButtons () {
		this.refButtons.setButtons();
	};

	onChatButtonSelect (type: I.ChatButton, item: any) {
		const { attachments } = this.state;
		const range = this.range || { from: 0, to: 0 };

		switch (type) {
			case I.ChatButton.Object: {
				this.setState({ attachments: attachments.concat(item) });
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

				this.refEditable.setValue(Mark.toHtml(value, this.marks));
				this.refEditable.setRange({ from: to, to });

				this.renderMarkup();
				break;
			};
		}
	};

	onTextButtonToggle (type: I.MarkType, param: string) {
		const { from, to } = this.range;
		const value = this.getTextValue();

		this.marks = Mark.toggle(this.marks, { type, param, range: { from, to } });
		this.refEditable.setValue(Mark.toHtml(value, this.marks));
		this.refEditable.setRange({ from, to });

		this.updateButtons();
		this.renderMarkup();
	};

	onMention (fromKeyboard?: boolean) {
		if (!this.range) {
			return;
		};

		const rootId = this.getRootId();
		const blockId = this.getBlockId();

		let value = this.refEditable.getTextValue();

		if (fromKeyboard) {
			value = U.Common.stringCut(value, this.range.from - 1, this.range.from);
			S.Common.filterSet(this.range.from - 1, '');
		} else {
			S.Common.filterSet(this.range.from, '');
		};

		raf(() => {
			S.Menu.open('blockMention', {
				...this.caretMenuParam(),
				data: {
					rootId,
					blockId,
					marks: this.marks,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						S.Detail.update(rootId, { id: object.id, details: object }, false);

						value = U.Common.stringInsert(value, text, from, from);
						marks.forEach(mark => this.marks = Mark.toggle(this.marks, mark));

						this.refEditable.setValue(Mark.toHtml(value, this.marks));
						this.refEditable.setRange({ from: to, to });
						this.renderMarkup();
					}
				}
			})
		});
	};

	onMenuClose () {
		this.refEditable.setRange(this.range);
	};

	caretMenuParam () {
		const win = $(window);
		const blockId = this.getBlockId();
		const rect = U.Common.getSelectionRect();

		return {
			element: `#block-${blockId} #messageBox`,
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

	onThread (id: string) {
		this.setState({ threadId: id }, () => {
			this.scrollToBottom();
		});
	};

	canSend () {
		return this.getTextValue() || this.state.attachments.length;
	};

	hasSelection (): boolean {
		return this.range ? this.range.to - this.range.from > 0 : false;
	};

	renderMarkup () {
		const { renderLinks, renderMentions, renderObjects, renderEmoji } = this.props;
		const node = this.refEditable.node;
		const value = this.refEditable.getTextValue();

		renderLinks(node, this.marks, value);
		renderMentions(node, this.marks, value);
		renderObjects(node, this.marks, value);
		renderEmoji(node);
	};

});

export default BlockChat;