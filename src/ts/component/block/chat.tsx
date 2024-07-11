import * as React from 'react';
import $ from 'jquery';
import sha1 from 'sha1';
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
};

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent, State> {

	_isMounted = false;
	node = null;
	refList = null;
	refEditable = null;
	refButtons = null;
	marks: I.Mark[] = [];
	range: I.TextRange = { from: 0, to: 0 };
	state = {
		threadId: '',
		attachments: [],
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
	};

	render () {
		const { readonly } = this.props;
		const { threadId, attachments } = this.state;
		const blockId = this.getBlockId();
		const messages = this.getMessages();
		const canSend = this.canSend();

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

						{attachments.length ? (
							<div className="attachments">
								{attachments.map((item: any, i: number) => (
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
		this.refEditable?.setRange({ from: 0, to: 0 });
	};

	componentDidUpdate () {
		this.checkSendButton();
	};

	componentWillUnmount () {
		this._isMounted = false;
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

		const value = this.getTextValue();
		const parsed = this.getMarksFromHtml();

		this.marks = parsed.marks;

		if (value !== parsed.text) {
			this.refEditable.setValue(Mark.toHtml(parsed.text, this.marks));
			this.refEditable.setRange(this.range);
		};

		this.checkSendButton();
		this.updateButtons();
	};

	onKeyDownInput (e: any) {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onAddMessage();
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

		const { attachments } = this.state;
		const node = $(this.node);
		const files = Array.from(e.dataTransfer.files).map((it: any) => ({
			id: sha1(it.path),
			name: it.name,
			layout: I.ObjectLayout.File,
			description: U.File.size(it.size),
			path: it.path,
		}));
		
		node.removeClass('isDraggingOver');
		keyboard.disableCommonDrop(true);

		this.setState({ attachments: attachments.concat(files) });
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
		if (!this.canSend()){
			return;
		};

		const { rootId } = this.props;
		const { account } = S.Auth;
		const { attachments } = this.state;
		const blockId = this.getBlockId();
		const childrenIds = S.Block.getChildrenIds(rootId, blockId);
		const length = childrenIds.length;
		const target = length ? childrenIds[length - 1] : blockId;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.InnerFirst;

		const data = {
			...this.getMarksFromHtml(),
			identity: account.id,
			time: U.Date.now(),
			attachments,
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

		if (attachments.length) {
			const files = attachments.filter(it => it.layout == I.ObjectLayout.File);
			const length = files.length;

			let n = 0;

			console.log(files, files.length);

			if (length) {
				for (const file of files) {
					C.FileUpload(S.Common.space, '', file.path, I.FileType.None, {}, (message: any) => {
						n++;

						data.attachments.push(message.objectId);

						if (n == length) {
							create();
						};
					});
				};
			} else {
				create();
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
		const win = $(window);
		const blockId = this.getBlockId();
		const range = this.range || { from: 0, to: 0 };

		let value = this.getTextValue();

		switch (type) {
			case I.ChatButton.Plus: {
				S.Menu.open('searchObject', {
					element: `#button-${blockId}-${type}`,
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
				S.Menu.open('smile', {
					element: `#block-${blockId} #messageBox`,
					recalcRect: () => {
						const rect = U.Common.getSelectionRect();
						return rect ? { ...rect, y: rect.y + win.scrollTop() } : null;
					},
					horizontal: I.MenuDirection.Center,
					vertical: I.MenuDirection.Top,
					noFlipX: true,
					noFlipY: true,
					data: {
						noHead: true,
						noUpload: true,
						value: '',
						onSelect: (icon) => {
							value = U.Common.stringInsert(value, icon, range.from, range.from);

							this.refEditable.setValue(value);
							this.refEditable.setRange({ from: value.length, to: value.length});
						},
					}
				});
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
		const win = $(window);
		const { rootId } = this.props;
		const blockId = this.getBlockId();
		const value = this.getTextValue();
		const { from, to } = this.range;
		const mark = Mark.getInRange(this.marks, type, { from, to });

		let menuId = '';
		let menuParam: any = {
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

});

export default BlockChat;
