import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Editable, Label, Icon } from 'Component';
import { I, C, S, U, J, keyboard, Mark, translate } from 'Lib';

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
		this.onTextButton = this.onTextButton.bind(this);
		this.onChatButton = this.onChatButton.bind(this);
		this.onThread = this.onThread.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.renderEmojiAndMentions = this.renderEmojiAndMentions.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const { threadId, attachments, files } = this.state;
		const blockId = this.getBlockId();
		const messages = this.getMessages();
		const canSend = this.canSend();
		const attachmentList = attachments.concat(files);
		const subId = S.Record.getSubId(rootId, block.id);
		const list = this.getDeps().map(id => S.Detail.get(subId, id));

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
							{messages.map((item: any) => (
								<Message 
									key={item.id} 
									{...this.props} 
									{...item} 
									isThread={!!threadId}
									onThread={this.onThread}
								/>
							))}
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
							blockId={blockId}
							buttons={this.getButtons()}
							onButton={(e, type) => this.hasSelection() ? this.onTextButton(e, type) : this.onChatButton(e, type)}
						/>

						<Icon id="send" className="send" onClick={this.onAddMessage} />
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.scrollToBottom();
		this.checkSendButton();

		this.loadDeps(() => {
			this.forceUpdate(() => {
				this.refEditable?.setRange({ from: 0, to: 0 });
			});
		});
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
		this._isMounted = false;

		const { rootId, block } = this.props;

		C.ObjectSearchUnsubscribe([ S.Record.getSubId(rootId, block.id) ]);
	};

	getDeps () {
		const messages = this.getMessages();
		const markTypes = [ I.MarkType.Object, I.MarkType.Mention ];

		return U.Common.arrayUnique(messages.reduce((acc, it) => {
			const data = it.data || {};
			const marks = (data.marks || [].filter(it => markTypes.includes(it.types))).map(it => it.param);

			return acc.concat(data.attachments || []).concat(marks);
		}, []));
	};

	loadDeps (callBack?: () => void) {
		const { rootId, block } = this.props;
		const deps = this.getDeps();

		if (!deps.length) {
			return;
		};

		U.Data.subscribeIds({
			subId: S.Record.getSubId(rootId, block.id),
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

		let value = this.refEditable.getTextValue();

		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onAddMessage();
		});

		keyboard.shortcut('backspace', e, () => {
			if (range && range.to) {
				const parsed = checkMarkOnBackspace(value, range, this.marks);

				if (parsed.save) {
					e.preventDefault();

					value = parsed.value;
					this.marks = parsed.marks;

					this.refEditable.setValue(Mark.toHtml(value, this.marks));
					this.refEditable.setRange({ from: value.length, to: value.length });
					this.renderEmojiAndMentions(this.refEditable.node);
				};
			}
		});
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

	getBlockId () {
		return this.state.threadId || this.props.block.id;
	};

	getMessages () {
		const { rootId } = this.props;
		const blockId = this.getBlockId();
		const childrenIds = S.Block.getChildrenIds(rootId, blockId);
		const children = S.Block.unwrapTree([ S.Block.wrapTree(rootId, blockId) ]).filter(it => it.isText());
		const length = children.length;
		const slice = length > LIMIT ? children.slice(length - LIMIT, length) : children;

		return slice.map(it => {
			it.data = {};
			try { it.data = JSON.parse(it.content.text); } catch (e) { /**/ };
			return it;
		});
	};

	onAddMessage = () => {
		if (!this.canSend() || S.Menu.isOpen('blockMention')){
			return;
		};

		const { rootId } = this.props;
		const { account } = S.Auth;
		const { attachments, files } = this.state;
		const blockId = this.getBlockId();
		const childrenIds = S.Block.getChildrenIds(rootId, blockId);
		const length = childrenIds.length;
		const target = length ? childrenIds[length - 1] : blockId;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.InnerFirst;

		const data = {
			...this.getMarksFromHtml(),
			identity: account.id,
			time: U.Date.now(),
			attachments: attachments.map(it => it.id),
			reactions: [],
		};
		
		const create = () => {
			const param = {
				type: I.BlockType.Text,
				style: I.TextStyle.Paragraph,
				content: {
					text: JSON.stringify(data),
				}
			};

			C.BlockCreate(rootId, target, position, param, () => {
				this.scrollToBottom();
				this.refEditable.setRange({ from: 0, to: 0 });
			});
		};

		if (files.length) {
			let n = 0;

			for (const file of files) {
				C.FileUpload(S.Common.space, '', file.path, I.FileType.None, {}, (message: any) => {
					n++;

					if (message.objectId) {
						data.attachments.push(message.objectId);
					};

					if (n == length) {
						create();
					};
				});
			};
		} else {
			create();
		};

		this.marks = [];
		this.range = { from: 0, to: 0 };

		this.refEditable.setValue('');
		this.refEditable.placeholderCheck();

		this.setState({ attachments: [] });
	};

	scrollToBottom () {
		window.setTimeout(() => {
			const { isPopup } = this.props;
			const container = U.Common.getScrollContainer(isPopup);
			const height = isPopup ? container.get(0).scrollHeight : document.body.scrollHeight;

			container.scrollTop(height);
		}, 10);
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
		this.refButtons.setButtons(this.getButtons());
	};

	getButtons () {
		return this.hasSelection() ? this.getTextButtons() : this.getChatButtons();
	};

	getChatButtons () {
		return [
			{ type: I.ChatButton.Plus, icon: 'plus' },
			{ type: I.ChatButton.Emoji, icon: 'emoji' },
			{ type: I.ChatButton.Mention, icon: 'mention' },
		];
	};

	onChatButton (e: any, type: I.ChatButton) {
		const { attachments } = this.state;
		const blockId = this.getBlockId();
		const range = this.range || { from: 0, to: 0 };
		const rect = U.Common.getSelectionRect();

		switch (type) {
			case I.ChatButton.Plus: {
				S.Menu.open('searchObject', {
					element: `#block-${blockId} #button-${blockId}-${type}`,
					horizontal: I.MenuDirection.Left,
					vertical: I.MenuDirection.Top,
					noFlipX: true,
					noFlipY: true,
					data: {
						skipIds: attachments.map(it => it.id),
						filters: [
							{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
						],
						onSelect: (item: any) => {
							this.setState({ attachments: attachments.concat(item) });
						}
					}
				});
				break;
			};

			case I.ChatButton.Emoji: {
				let value = this.getTextValue();

				S.Menu.open('smile', {
					...this.caretMenuParam(),
					data: {
						noHead: true,
						noUpload: true,
						value: '',
						onSelect: (icon) => {
							const to = range.from + 1;

							this.marks = Mark.adjust(this.marks, range.from, 1);
							this.marks = Mark.toggle(this.marks, {
								type: I.MarkType.Emoji,
								param: icon,
								range: { from: range.from, to },
							});

							value = U.Common.stringInsert(value, ' ', range.from, range.from);

							this.refEditable.setValue(Mark.toHtml(value, this.marks));
							this.refEditable.setRange({ from: to, to });

							this.renderEmojiAndMentions(this.refEditable.node);
						},
					}
				});
				break;
			};
			case I.ChatButton.Mention: {
				this.onMention();
				break;
			};
		};
	};

	getTextButtons () {
		const cmd = keyboard.cmdSymbol();
		const colorMark = Mark.getInRange(this.marks, I.MarkType.Color, this.range) || {};
		const bgMark = Mark.getInRange(this.marks, I.MarkType.BgColor, this.range) || {};

		const color = (
			<div className={[ 'inner', 'textColor', `textColor-${colorMark.param || 'default'}` ].join(' ')} />
		);
		const background = (
			<div className={[ 'inner', 'bgColor', `bgColor-${bgMark.param || 'default'}` ].join(' ')} />
		);

		return [
			{ type: I.MarkType.Bold, icon: 'bold', name: translate('commonBold'), caption: `${cmd} + B` },
			{ type: I.MarkType.Italic, icon: 'italic', name: translate('commonItalic'), caption: `${cmd} + I` },
			{ type: I.MarkType.Strike, icon: 'strike', name: translate('commonStrikethrough'), caption: `${cmd} + Shift + S` },
			{ type: I.MarkType.Underline, icon: 'underline', name: translate('commonUnderline'), caption: `${cmd} + U` },
			{ type: I.MarkType.Link, icon: 'link', name: translate('commonLink'), caption: `${cmd} + K` },
			{ type: I.MarkType.Code, icon: 'kbd', name: translate('commonCode'), caption: `${cmd} + L` },
			{ type: I.MarkType.Color, icon: 'color', name: translate('commonColor'), caption: `${cmd} + Shift + C`, inner: color },
			{ type: I.MarkType.BgColor, icon: 'color', name: translate('commonBackground'), caption: `${cmd} + Shift + H`, inner: background },
		].map((it: any) => {
			it.isActive = false;
			if (it.type == I.MarkType.Link) {
				const inRange = Mark.getInRange(this.marks, I.MarkType.Link, this.range) || Mark.getInRange(this.marks, I.MarkType.Object, this.range);
				it.isActive = !!(inRange && inRange.param);
			} else {
				it.isActive = !!Mark.getInRange(this.marks, it.type, this.range);
			};
			return it;
		});
	};

	onTextButton (e: any, type: I.MarkType) {
		const { rootId } = this.props;
		const blockId = this.getBlockId();
		const value = this.getTextValue();
		const { from, to } = this.range;
		const mark = Mark.getInRange(this.marks, type, { from, to });

		const menuParam: any = {
			element: `#button-${blockId}-${type}`,
			recalcRect: () => {
				const rect = U.Common.getSelectionRect();
				return rect ? { ...rect, y: rect.y + $(window).scrollTop() } : null; 
			},
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {} as any,
		};

		const toggle = (type: I.MarkType, param: string) => {
			this.marks = Mark.toggle(this.marks, { type, param, range: { from, to } });
			this.refEditable.setValue(Mark.toHtml(value, this.marks));
			this.updateButtons();
		};

		let menuId = '';

		switch (type) {
			
			default: {
				toggle(type, '');
				break;
			};

			case I.MarkType.Link: {
				menuParam.data = Object.assign(menuParam.data, {
					filter: mark?.param,
					type: mark?.type,
					skipIds: [ rootId ],
					onChange: toggle,
				});

				menuId = 'blockLink';
				break;
			};

			case I.MarkType.BgColor:
			case I.MarkType.Color: {
				switch (type) {
					case I.MarkType.Color: {
						menuId = 'blockColor';
						break;
					};

					case I.MarkType.BgColor: {
						menuId = 'blockBackground';
						break;
					};
				};

				menuParam.data = Object.assign(menuParam.data, {
					value: mark?.param,
					onChange: (param: string) => toggle(type, param),
				});
				break;
			};
		};

		if (menuId && !S.Menu.isOpen(menuId)) {
			S.Menu.closeAll(J.Menu.context, () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	onMention (fromKeyboard?: boolean) {
		if (!this.range) {
			return;
		};

		const { rootId, block } = this.props;

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
					blockId: block.id,
					marks: this.marks,
					skipIds: [ S.Auth.account.id ],
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant }
					],
					onChange: (text: string, marks: I.Mark[], from: number, to: number) => {
						value = U.Common.stringInsert(value, text, from, from);

						marks.forEach((mark) => {
							this.marks = Mark.toggle(this.marks, mark);
						});

						this.refEditable.setValue(Mark.toHtml(value, this.marks));
						this.refEditable.setRange({ from: to, to });

						this.renderEmojiAndMentions(this.refEditable.node);
					}
				}
			})
		});
	};

	caretMenuParam () {
		const win = $(window);
		const blockId = this.getBlockId();
		const rect = U.Common.getSelectionRect();

		return {
			element: `#block-${blockId} #messageBox`,
			recalcRect: () => {
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
			},
			horizontal: rect ? I.MenuDirection.Center : I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			noFlipX: true,
			noFlipY: true,
			offsetY: -4,
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

	hasSelection () {
		return this.range ? this.range.to - this.range.from > 0 : false;
	};

	renderEmojiAndMentions (node: any) {
		const { renderEmoji, renderMentions } = this.props;
		const value = this.refEditable.getTextValue();

		renderEmoji(node);
		renderMentions(node, this.marks, value);
	};

});

export default BlockChat;