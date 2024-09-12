import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Icon, Loader } from 'Component';
import { I, C, S, U, J, keyboard, Mark, translate, Storage } from 'Lib';

import Attachment from './attachment';
import Buttons from './buttons';

interface Props extends I.BlockComponent {
	blockId: string;
	subId: string;
	scrollToBottom: () => void;
	scrollToMessage: (id: string) => void;
	getMessages: () => I.ChatMessage[];
};

interface State {
	attachments: any[];
	files: any[];
};

const ChatForm = observer(class ChatForm extends React.Component<Props, State> {

	_isMounted = false;
	node = null;
	refEditable = null;
	refButtons = null;
	marks: I.Mark[] = [];
	range: I.TextRange = { from: 0, to: 0 };
	timeoutFilter = 0;
	editingId: string = '';
	state = {
		attachments: [],
		files: [],
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
		this.onAttachmentRemove = this.onAttachmentRemove.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);
		this.hasSelection = this.hasSelection.bind(this);
		this.caretMenuParam = this.caretMenuParam.bind(this);
		this.removeBookmark = this.removeBookmark.bind(this);
		this.getMarksAndRange = this.getMarksAndRange.bind(this);
	};

	render () {
		const { readonly } = this.props;
		const { attachments, files } = this.state;
		const value = this.getTextValue();

		return (
			<div 
				ref={ref => this.node = ref}
				id="formWrapper" 
				className="formWrapper"
			>
				<div className="form">
					<Loader id="form-loader" />

					<Editable 
						ref={ref => this.refEditable = ref}
						id="messageBox"
						readonly={readonly}
						maxLength={J.Constant.limit.chat.text}
						placeholder={translate('blockChatPlaceholder')}
						onSelect={this.onSelect}
						onFocus={this.onFocusInput}
						onBlur={this.onBlurInput}
						onKeyUp={this.onKeyUpInput} 
						onKeyDown={this.onKeyDownInput}
						onPaste={this.onPaste}
						onMouseDown={this.onMouseDown}
						onMouseUp={this.onMouseUp}
					/>

					{attachments.length || files.length ? (
						<div className="attachments">
							{attachments.map(item => (
								<Attachment key={item.id} object={item} onRemove={this.onAttachmentRemove} />
							))}
							{files.map(item => (
								<Attachment key={item.id} object={item} onRemove={this.onFileRemove} />
							))}
						</div>
					) : ''}

					{!readonly ? (
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
							onMenuClose={this.onMenuClose}
							removeBookmark={this.removeBookmark}
						/>
					) : ''}

					<Icon id="send" className="send" onClick={this.onSend} />
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.renderMarkup();
		this.checkSendButton();
	};

	componentDidUpdate () {
		this.renderMarkup();
		this.checkSendButton();
	};

	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutFilter);
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
		keyboard.disableSelection(false);
		this.refEditable?.placeholderCheck();
	};

	onKeyDownInput (e: any) {
		const { checkMarkOnBackspace } = this.props;
		const range = this.range;
		const cmd = keyboard.cmdKey();
		const menuOpenMention = S.Menu.isOpen('blockMention');

		let value = this.refEditable.getTextValue();

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();
			this.onSend();
		});

		if (range && range.to) {
			keyboard.shortcut('backspace', e, () => {
				const parsed = checkMarkOnBackspace(value, range, this.marks);

				if (!parsed.save) {
					return;
					e.preventDefault();

					value = parsed.value;
					this.marks = parsed.marks;

					const l = value.length;
					this.updateMarkup(value, l, l);
				};
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

	onKeyUpInput (e: any) {
		this.range = this.refEditable.getRange();

		const { attachments, files } = this.state;
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

		if (!value && !attachments.length && !files.length && this.editingId) {
			this.onDelete(this.editingId);
		};

		if (adjustMarks) {
			this.updateMarkup(value, to, to);
		};

		this.checkSendButton();
		this.updateButtons();
		this.removeBookmarks();
	};

	onPaste (e: any) {
		const { from } = this.range;
		const cb = e.clipboardData || e.originalEvent.clipboardData;
		const text = U.Common.normalizeLineEndings(String(cb.getData('text/plain') || ''));

		let value = this.getTextValue();
		let url = U.Common.matchUrl(text);
		let isLocal = false;
		let to = this.range.to;

		if (!url) {
			url = U.Common.matchLocalPath(text);
			isLocal = true;
		};

		if (!url) {
			return;
		};

		e.preventDefault();

		const param = isLocal ? `file://${url}` : url;
		
		if (from == to) {
			value = U.Common.stringInsert(value, url + ' ', from, from);
			to = from + url.length;
		};

		this.marks = Mark.adjust(this.marks, from - 1, url.length + 1);
		this.marks.push({ type: I.MarkType.Link, range: { from, to }, param});
		this.updateMarkup(value, to + 1, to + 1);
		this.addBookmark(param);
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
		const { files } = this.state;
		const node = $(this.node);
		const electron = U.Common.getElectron();
		const list = Array.from(e.dataTransfer.files).map((it: File) => {
			const path = electron.webFilePath(it);

			return {
				id: sha1(path),
				name: it.name,
				layout: I.ObjectLayout.File,
				description: U.File.size(it.size),
				mime: it.type,
				path,
				isTmp: true,
				file: it,
			};
		});
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		this.setState({ files: files.concat(list) }, () => scrollToBottom());
		keyboard.disableCommonDrop(false);
	};

	onSend () {
		if (!this.canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const { rootId, scrollToMessage } = this.props;
		const node = $(this.node);
		const loader = node.find('#form-loader');
		const list = this.state.files || [];
		const files = list.filter(it => it.layout == I.ObjectLayout.File);
		const bookmarks = list.filter(it => it.layout == I.ObjectLayout.Bookmark);
		const fl = files.length;
		const bl = bookmarks.length;
		const attachments = (this.state.attachments || []).map(it => ({ target: it.id, type: I.ChatAttachmentType.Link }));

		loader.addClass('active');

		const clear = () => {
			this.onEditClear();
			loader.removeClass('active');
		};
		
		const callBack = () => {
			if (this.editingId) {
				const message = S.Chat.getMessage(rootId, this.editingId);
				if (message) {
					const { marks, text } = this.getMarksFromHtml();
					const update = U.Common.objectCopy(message);

					update.attachments = attachments;
					update.content.text = text;
					update.content.marks = marks;

					C.ChatEditMessageContent(rootId, this.editingId, update, (message: any) => {
						if (message.error.code) {
							return;
						};

						scrollToMessage(this.editingId);
						clear();
					});
				};
			} else {
				const message = {
					content: {
						...this.getMarksFromHtml(),
						style: I.TextStyle.Paragraph,
					},
					attachments,
					reactions: [],
				};

				C.ChatAddMessage(rootId, message, (message: any) => {
					if (message.error.code) {
						return;
					};

					Storage.setLastChatMessageId(rootId, message.messageId);
					scrollToMessage(message.messageId);
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
						attachments.push({ target: message.objectId, type: I.ChatAttachmentType.File });
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
				C.ObjectCreateFromUrl({ source: item.source }, S.Common.space, J.Constant.typeKey.bookmark, item.source, true, (message: any) => {
					n++;

					if (message.objectId) {
						attachments.push({ target: message.objectId, type: I.ChatAttachmentType.Link });
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
		this.range = { from: l, to: l };
		this.editingId = message.id;
		this.refEditable.setValue(Mark.toHtml(text, this.marks));
		this.renderMarkup();

		this.setState({ attachments }, () => {
			this.refEditable.setRange(this.range);
		});
	};

	onEditClear () {
		this.editingId = '';
		this.marks = [];
		this.range = { from: 0, to: 0 };

		this.refEditable.setValue('');
		this.refEditable.placeholderCheck();

		this.setState({ attachments: [], files: [] });
	};

	onDelete (id: string) {
		const { rootId, getMessages, scrollToMessage, scrollToBottom } = this.props;
		const messages = getMessages();
		const idx = messages.findIndex(it => it.id == id);
		const next = messages[idx + 1];

		S.Popup.open('confirm', {
			data: {
				icon: 'confirm',
				bgColor: 'red',
				title: translate('popupConfirmChatDeleteMessageTitle'),
				text: translate('popupConfirmChatDeleteMessageText'),
				onConfirm: () => {
					C.ChatDeleteMessage(rootId, id, () => {
						if (this.editingId == id) {
							this.onEditClear();
						};

						if (next) {
							scrollToMessage(next.id);
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
		return String(this.refEditable?.getTextValue() || '');
	};

	getHtmlValue (): string {
		return String(this.refEditable?.getHtmlValue() || '');
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		return Mark.fromHtml(this.getHtmlValue(), []);
	};

	onAttachmentRemove (id: string) {
		this.setState({ attachments: this.state.attachments.filter(it => it.id != id) });
	};

	onFileRemove (id: string) {
		this.setState({ files: this.state.files.filter(it => it.id != id) });
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
				this.setState({ attachments: attachments.concat(item) }, () => scrollToBottom());
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
		}
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
				U.Object.getById(param, (object: any) => {
					object.isTmp = true;

					attachments.unshift(object);
					this.setState({ attachments	});
				});
				break;
			};
		};

		this.updateButtons();
		this.renderMarkup();
	};

	addBookmark (url: string) {
		const { files } = this.state;
		const id = sha1(url);

		if (files.find(it => it.id == id)) {
			return;
		};

		const add = (param: any) => {
			const { title, description, url } = param;

			files.unshift({
				id,
				name: title,
				description,
				layout: I.ObjectLayout.Bookmark,
				source: url,
				isTmp: true,
			});

			this.setState({ files });
		};

		C.LinkPreview(url, (message: any) => {
			if (message.error.code) {
				add({ title: url, url });
			} else {
				add({ ...message.previewLink, url });
			};
		});
	};

	removeBookmarks () {
		const files = this.state.files || [];
		const bookmarks = files.filter(it => it.layout == I.ObjectLayout.Bookmark);
		
		let filtered = files;
		bookmarks.forEach(it => {
			const marks = this.marks.filter(mark => mark.param == it.source);
			if (!marks.length) {
				filtered = filtered.filter(file => file.id != it.id);
			};
		});

		if (files.length != filtered.length) {
			this.setState({ files: filtered });
		};
	};

	removeBookmark (url: string) {
		const files = this.state.files || [];
		const filtered = files.filter(it => U.Object.isBookmarkLayout(it.layout) && (it.source != url));

		if (files.length != filtered.length) {
			this.setState({ files: filtered });
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
				...this.caretMenuParam(),
				data: {
					rootId,
					blockId,
					marks: this.marks,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (object: any, text: string, marks: I.Mark[], from: number, to: number) => {
						S.Detail.update(rootId, { id: object.id, details: object }, false);

						value = U.Common.stringInsert(value, text, from, from);
						marks.forEach(mark => this.marks = Mark.toggle(this.marks, mark));

						this.updateMarkup(value, to, to);
					}
				}
			})
		});
	};

	onMenuClose () {
		this.refEditable.setRange(this.range);
	};

	caretMenuParam () {
		const { blockId } = this.props;
		const win = $(window);
		const rect = U.Common.getSelectionRect();

		return {
			element: `#block-${blockId} #messageBox`,
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

	canSend () {
		const { attachments, files } = this.state;

		// You can send blank message when editing to delete it
		if (this.editingId) {
			return true;
		};

		return this.getTextValue() || attachments.length || files.length;
	};

	hasSelection (): boolean {
		return this.range ? this.range.to - this.range.from > 0 : false;
	};

	updateMarkup (value: string, from: number, to: number) {
		this.range = { from, to };
		this.refEditable.setValue(Mark.toHtml(value, this.marks));
		this.refEditable.setRange({ from, to });
		this.refEditable.placeholderCheck();
		this.renderMarkup();
	};

	renderMarkup () {
		const { rootId, renderLinks, renderMentions, renderObjects, renderEmoji } = this.props;
		const node = this.refEditable.node;
		const value = this.refEditable.getTextValue();

		renderMentions(rootId, node, this.marks, value);
		renderObjects(rootId, node, this.marks, value, this.props);
		renderLinks(node, this.marks, value, this.props);
		renderEmoji(node);
	};

});

export default ChatForm;