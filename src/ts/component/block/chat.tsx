import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Editable } from 'Component';
import { I, C, keyboard, UtilDate, UtilCommon, Mark, translate } from 'Lib';
import { authStore, blockStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

import ChatButtons from './chat/buttons';
import ChatMessage from './chat/message';

const LIMIT = 50;

const BlockChat = observer(class BlockChat extends React.Component<I.BlockComponent> {

	_isMounted = false;
	refList = null;
	refEditable = null;
	refButtons = null;
	marks: I.Mark[] = [];
	range: I.TextRange = { from: 0, to: 0 };

	constructor (props: I.BlockComponent) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onFocusInput = this.onFocusInput.bind(this);
		this.onBlurInput = this.onBlurInput.bind(this);
		this.onKeyUpInput = this.onKeyUpInput.bind(this);
		this.onKeyDownInput = this.onKeyDownInput.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onPaste = this.onPaste.bind(this);
		this.onButton = this.onButton.bind(this);
	};

	render () {
		const { rootId, block, readonly } = this.props;
		const buttons = this.getButtons();
		const messages = this.getMessages();

		return (
			<div>
				<div ref={ref => this.refList = ref} className="list">
					{messages.map((item: any, index: number) => (
						<ChatMessage key={item.id} {...item} />
					))}
				</div>

				<div className="bottom">
					<ChatButtons 
						ref={ref => this.refButtons = ref}
						block={block} 
						buttons={buttons}
						onButton={this.onButton}
					/>

					<Editable 
						ref={ref => this.refEditable = ref}
						id="input"
						readonly={readonly}
						placeholder={'Enter your message'}
						onSelect={this.onSelect}
						onFocus={this.onFocusInput}
						onBlur={this.onBlurInput}
						onKeyUp={this.onKeyUpInput} 
						onKeyDown={this.onKeyDownInput}
						onInput={this.onChange}
						onPaste={this.onPaste}
						onMouseDown={this.onSelect}
					/>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.scrollToBottom();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	onSelect = (e: any) => {
		this.range = this.refEditable.getRange();
		this.refButtons.setButtons(this.getButtons());
	};

	onFocusInput = (e: any) => {
		this.refEditable?.placeholderCheck();
	};

	onBlurInput = (e: any) => {
		this.refEditable?.placeholderCheck();
	};

	onKeyUpInput = (e: any) => {
		this.range = this.refEditable.getRange();

		const value = this.getTextValue();
		const parsed = this.getMarksFromHtml();

		if (value !== parsed.text) {
			this.marks = parsed.marks;
			this.refEditable.setValue(Mark.toHtml(parsed.text, this.marks));
			this.refEditable.setRange(this.range);
		};
	};

	onKeyDownInput = (e: any) => {
		keyboard.shortcut('enter', e, () => {
			e.preventDefault();

			this.onAddMessage();
		});
	};

	onChange = (e: any) => {
	};

	onPaste = (e: any) => {
	};

	getMessages () {
		const { rootId, block } = this.props;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const children = blockStore.unwrapTree([ blockStore.wrapTree(rootId, block.id) ]).filter(it => it.isText());
		const length = children.length;
		const slice = length > LIMIT ? children.slice(length - LIMIT, length) : children;

		return slice.map(it => {
			it.data = JSON.parse(it.content.text);
			return it;
		});
	};

	onAddMessage = () => {
		const value = this.getTextValue().trim();

		if (!value) {
			return;
		};

		const { rootId, block } = this.props;
		const { account } = authStore;
		const childrenIds = blockStore.getChildrenIds(rootId, block.id);
		const length = childrenIds.length;
		const target = length ? childrenIds[length - 1] : block.id;
		const position = length ? I.BlockPosition.Bottom : I.BlockPosition.InnerFirst;

		const data = {
			...this.getMarksFromHtml(),
			identity: account.id,
			time: UtilDate.now(),
		};
		
		const param = {
			type: I.BlockType.Text,
			style: I.TextStyle.Paragraph,
			content: {
				text: JSON.stringify(data),
			}
		};
		
		C.BlockCreate(rootId, target, position, param, (message: any) => {
			this.scrollToBottom();
		});

		this.marks = [];
		this.range = null;

		this.refEditable.setValue('');
		this.refEditable.placeholderCheck();
	};

	scrollToBottom () {
		$(this.refList).scrollTop(this.refList.scrollHeight);
	};

	getTextValue (): string {
		return String(this.refEditable?.getTextValue() || '');
	};

	getHtmlValue (): string {
		return String(this.refEditable?.getHtmlValue() || '');
	};
	
	getMarksFromHtml (): { marks: I.Mark[], text: string } {
		const { block } = this.props;
		const value = this.getHtmlValue();
		const restricted: I.MarkType[] = [];

		if (block.isTextHeader()) {
			restricted.push(I.MarkType.Bold);
		};
		
		return Mark.fromHtml(value, restricted);
	};

	getButtons () {
		const cmd = keyboard.cmdKey();
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
				it.isActive = inRange && inRange.param;
			} else {
				it.isActive = Mark.getInRange(this.marks, it.type, this.range);
			};
			return it;
		});
	};

	onButton (e: any, type: any) {
		const { rootId, block } = this.props;
		const value = this.getTextValue();
		const { from, to } = this.range;
		const mark = Mark.getInRange(this.marks, type, { from, to });

		let menuId = '';
		let menuParam: any = {
			element: `#button-${block.id}-${type}`,
			recalcRect: () => { 
				const rect = UtilCommon.getSelectionRect();
				return rect ? { ...rect, y: rect.y + $(window).scrollTop() } : null; 
			},
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {} as any,
		};

		switch (type) {
			
			default: {
				this.marks = Mark.toggle(this.marks, { type, param: '', range: { from, to } });
				this.refEditable.setValue(Mark.toHtml(value, this.marks));
				break;
			};

			case I.MarkType.Link: {
				menuParam.data = Object.assign(menuParam.data, {
					filter: mark?.param,
					type: mark?.type,
					skipIds: [ rootId ],
					onChange: (newType: I.MarkType, param: string) => {
						this.marks = Mark.toggleLink({ type: newType, param, range: { from, to } }, this.marks);
						this.refEditable.setValue(Mark.toHtml(value, this.marks));
					}
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
					onChange: (param: string) => {
						this.marks = Mark.toggleLink({ type, param, range: { from, to } }, this.marks);
						this.refEditable.setValue(Mark.toHtml(value, this.marks));
					},
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId)) {
			menuStore.closeAll(Constant.menuIds.context, () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};

});

export default BlockChat;