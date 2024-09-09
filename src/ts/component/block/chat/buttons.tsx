import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, J, keyboard, Mark, S, translate, U } from 'Lib';
import $ from 'jquery';

interface Props {
	rootId: string;
	blockId: string;
	value: string;
	hasSelection: () => boolean;
	getMarksAndRange: () => any;
	attachments: any[];
	caretMenuParam: () => any;
	onChatButtonSelect: (type, item: any) => void;
	onTextButtonToggle: (type: I.MarkType, param: string) => void;
	onMenuClose: () => void;
	onMention: () => void;
};

interface State {
	buttons: any[];
};

const ChatButtons = observer(class ChatButtons extends React.Component<Props, State> {

	state = {
		buttons: [],
	};

	constructor (props: Props) {
		super(props);

		this.onButton = this.onButton.bind(this);
		this.onTextButton = this.onTextButton.bind(this);
		this.onChatButton = this.onChatButton.bind(this);
	};

	render () {
		const { blockId } = this.props;
		const { buttons } = this.state;

		return (
			<div className="buttons">
				{buttons.map((item: any, i: number) => {
					const cn = [ item.icon ];
					if (item.isActive) {
						cn.push('isActive');
					};

					return (
						<Icon 
							id={`button-${blockId}-${item.type}`} 
							key={i} 
							className={cn.join(' ')} 
							tooltip={item.name}
							tooltipCaption={item.caption}
							tooltipY={I.MenuDirection.Top}
							inner={item.inner}
							onMouseDown={e => this.onButton(e, item)}
						/>
					);
				})}
			</div>
		);
	};

	componentDidMount(): void {
		this.setButtons();
	};

	setButtons () {
		this.setState({ buttons: this.getButtons() });
	};

	onButton (e: React.MouseEvent, item: any) {
		const { hasSelection } = this.props;

		hasSelection() ? this.onTextButton(e, item.type, '') : this.onChatButton(e, item.type);
	};

	onChatButton (e: React.MouseEvent, type: I.ChatButton) {
		const { blockId, attachments, caretMenuParam, onMention, onMenuClose, onChatButtonSelect } = this.props;

		switch (type) {
			case I.ChatButton.Object: {
				S.Menu.open('searchObject', {
					element: `#block-${blockId} #button-${blockId}-${type}`,
					className: 'fixed',
					vertical: I.MenuDirection.Top,
					noFlipX: true,
					noFlipY: true,
					onClose: onMenuClose,
					data: {
						skipIds: attachments.map(it => it.id),
						filters: [
							{ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
						],
						onSelect: (item: any) => onChatButtonSelect(type, item)
					}
				});
				break;
			};

			case I.ChatButton.Emoji: {
				S.Menu.open('smile', {
					...caretMenuParam(),
					data: {
						noHead: true,
						noUpload: true,
						value: '',
						onSelect: (icon) => onChatButtonSelect(type, icon),
					}
				});
				break;
			};

			case I.ChatButton.Mention: {
				onMention();
				break;
			};
		};
	};

	onTextButton (e: React.MouseEvent, type: I.MarkType, param: string) {
		const { rootId, blockId, onTextButtonToggle, getMarksAndRange } = this.props;
		const { marks, range } = getMarksAndRange();
		const { from, to } = range;
		const mark = Mark.getInRange(marks, type, { from, to });

		const menuParam: any = {
			element: `#button-${blockId}-${type}`,
			className: 'fixed',
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {} as any,
		};

		let menuId = '';

		switch (type) {

			default: {
				onTextButtonToggle(type, '');
				break;
			};

			case I.MarkType.Link: {
				menuId = 'blockLink';

				menuParam.data = Object.assign(menuParam.data, {
					value: mark?.param,
					filter: mark?.param,
					type: mark?.type,
					skipIds: [ rootId ],
					onChange: onTextButtonToggle,
				});
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
					value: param || mark?.param,
					onChange: param => onTextButtonToggle(type, param),
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

	getButtons () {
		const { hasSelection } = this.props;
		return hasSelection() ? this.getTextButtons() : this.getChatButtons();
	};

	getChatButtons () {
		const cmd = keyboard.cmdSymbol();

		return [
			{ type: I.ChatButton.Object, icon: 'plus', name: translate('blockChatButtonObject'), caption: `${cmd} + A` },
			{ type: I.ChatButton.Emoji, icon: 'emoji', name: translate('blockChatButtonEmoji'), caption: `${cmd} + E` },
			{ type: I.ChatButton.Mention, icon: 'mention', name: translate('blockChatButtonMention'), caption: `${cmd} + M` },
		];
	};

	getTextButtons () {
		const { getMarksAndRange } = this.props;
		const { marks, range } = getMarksAndRange();
		const cmd = keyboard.cmdSymbol();
		const colorMark = Mark.getInRange(marks, I.MarkType.Color, range) || {};
		const bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};

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
				const inRange = Mark.getInRange(marks, I.MarkType.Link, range) || Mark.getInRange(marks, I.MarkType.Object, range);
				it.isActive = !!(inRange && inRange.param);
			} else {
				it.isActive = !!Mark.getInRange(marks, it.type, range);
			};
			return it;
		});
	};

});

export default ChatButtons;