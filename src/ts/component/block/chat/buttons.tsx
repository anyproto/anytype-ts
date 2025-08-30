import React, { forwardRef, useImperativeHandle, useState, useEffect, MouseEvent, useRef } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { Action, analytics, I, J, keyboard, Mark, S, translate, U } from 'Lib';

interface Props extends I.BlockComponent {
	value: string;
	hasSelection: () => boolean;
	getMarksAndRange: () => any;
	caretMenuParam: () => any;
	onChatButtonSelect: (type, item: any) => void;
	onTextButtonToggle: (type: I.MarkType, param: string) => void;
	onMenuClose: () => void;
	onMention: () => void;
	getObjectFromPath: (path: string) => void;
	addAttachments: (attachments: any[]) => void;
	updateAttachments?: () => void;
	getAttachments: () => any[];
	removeBookmark: (url: string) => void;
};

interface RefProps {
	getButtons: () => any[];
	setButtons: () => void;
	onChatButton: (e: MouseEvent, type: I.ChatButton) => void;
	onTextButton: (e: MouseEvent, type: I.MarkType, param: string) => void;
};

const ChatButtons = observer(forwardRef<RefProps, Props>((props, ref) => {

	const { 
		rootId, block, hasSelection, caretMenuParam, onMention, onChatButtonSelect, onTextButtonToggle, getMarksAndRange, removeBookmark,
		addAttachments, getObjectFromPath, updateAttachments, getAttachments,
	} = props;
	const [ buttons, setButtons ] = useState<any[]>([]);
	const menuContext = useRef(null);
	const cmd = keyboard.cmdSymbol();

	const onButton = (e: MouseEvent, item: any) => {
		hasSelection() ? onTextButton(e, item.type, '') : onChatButton(e, item.type);
	};

	const onChatButton = (e: MouseEvent, type: I.ChatButton) => {
		switch (type) {
			case I.ChatButton.Object: {
				onAttachment();
				break;
			};

			case I.ChatButton.Emoji: {
				S.Menu.open('smile', {
					element: `#button-${block.id}-${type}`,
					...caretMenuParam(),
					data: {
						noHead: true,
						noUpload: true,
						value: '',
						onSelect: icon => onChatButtonSelect(type, icon),
						route: analytics.route.message,
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

	const onTextButton = (e: MouseEvent, type: I.MarkType, param: string) => {
		const { marks, range } = getMarksAndRange();
		const { from, to } = range;
		const mark = Mark.getInRange(marks, type, { from, to });
		const rect = U.Common.getSelectionRect();
		const win = $(window);

		const menuParam: any = {
			element: `#button-${block.id}-${type}`,
			rect: rect ? { ...rect, y: rect.y + win.scrollTop() } : null,
			className: 'fixed',
			offsetY: -8,
			vertical: I.MenuDirection.Top,
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
					onClear: before => removeBookmark(before),
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

	const getButtons = () => {
		return hasSelection() ? getTextButtons() : getChatButtons();
	};

	const getChatButtons = () => {
		return [
			{ type: I.ChatButton.Object, icon: 'plus', name: translate('blockChatButtonObject') },
			{ type: I.ChatButton.Emoji, icon: 'emoji', name: translate('blockChatButtonEmoji'), caption: `${cmd} + E` },
			{ type: I.ChatButton.Mention, icon: 'mention', name: translate('blockChatButtonMention') },
		];
	};

	const getTextButtons = () => {
		const { marks, range } = getMarksAndRange();
		const colorMark = Mark.getInRange(marks, I.MarkType.Color, range) || {};
		const bgMark = Mark.getInRange(marks, I.MarkType.BgColor, range) || {};

		const color = (
			<div className={[ 'inner', 'textColor', `textColor-${colorMark.param || 'default'}` ].join(' ')} />
		);
		const background = (
			<div className={[ 'inner', 'bgColor', `bgColor-${bgMark.param || 'default'}` ].join(' ')} />
		);

		return [
			{ type: I.MarkType.Bold, icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
			{ type: I.MarkType.Italic, icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
			{ type: I.MarkType.Strike, icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
			{ type: I.MarkType.Underline, icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
			{ type: I.MarkType.Link, icon: 'link', name: translate('commonLink'), caption: keyboard.getCaption('textLink') },
			{ type: I.MarkType.Code, icon: 'kbd', name: translate('commonCode'), caption: keyboard.getCaption('textCode') },
			//{ type: I.MarkType.Color, icon: 'color', name: translate('commonColor'), caption: keyboard.getCaption('textColor'), inner: color },
			//{ type: I.MarkType.BgColor, icon: 'color', name: translate('commonBackground'), caption: keyboard.getCaption('textBackground'), inner: background },
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

	const onAttachmentOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll(J.Menu.chatForm);
			return;
		};

		const context = menuContext.current;
		if (!context) {
			return;
		};

		switch (item.id) {
			case 'create': {
				U.Menu.typeSuggest({ 
					element: `#${context.getId()} #item-${item.id}`,
					className: 'fixed',
					classNameWrap: 'fromSidebar',
					offsetX: context.getSize().width,
					vertical: I.MenuDirection.Center,
					isSub: true,
					data: {
						onAdd: () => context?.close(),
					},
				}, {}, { noButtons: true }, analytics.route.message, object => {
					onChatButtonSelect(I.ChatButton.Object, object);

					U.Object.openPopup(object, { onClose: updateAttachments });

					analytics.event('AttachItemChat', { type: 'Create', count: 1 });
					context?.close();
				});
				break;
			};
		};
	};

	const onAttachment = () => {
		const options: any[] = [
			{ id: 'create', icon: 'createObject', name: translate('commonNewObject'), arrow: true },
			{ id: 'search', icon: 'plus', name: translate('spaceExisting') },
			{ id: 'upload', icon: 'uploadComputer', name: translate('commonUploadComputer') },
		];

		S.Menu.closeAll(null, () => {
			S.Menu.open('select', {
				element: `#block-${block.id} #button-${block.id}-${I.ChatButton.Object}`,
				className: 'chatAttachment fixed fromBlock',
				offsetY: -8,
				vertical: I.MenuDirection.Top,
				noFlipX: true,
				noFlipY: true,
				subIds: J.Menu.chatForm,
				onOpen: context => menuContext.current = context,
				data: {
					options,
					noVirtualisation: true,
					noScroll: true,
					onOver: onAttachmentOver,
					onSelect: (e: MouseEvent, option: any) => {
						switch (option.id) {
							case 'search': {
								keyboard.onSearchPopup(analytics.route.message, {
									data: {
										skipIds: getAttachments().map(it => it.id),
										onObjectSelect: item => {
											addAttachments([ item ]);
											analytics.event('AttachItemChat', { type: 'Existing', count: 1 });
										},
									},
								});
								break;
							};

							case 'upload': {
								Action.openFileDialog({ properties: [ 'multiSelections' ] }, paths => {
									addAttachments(paths.map(path => getObjectFromPath(path)));

									analytics.event('AttachItemChat', { type: 'Upload', count: paths.length });
								});

								analytics.event('ClickChatAttach', { type: 'Upload' });
								break;
							};
						};
					},
				},
			});
		});
	};

	useEffect(() => {
		setButtons(getButtons());
	}, []);

	useImperativeHandle(ref, () => ({
		setButtons: () => setButtons(getButtons()),
		getButtons,
		onChatButton,
		onTextButton,
	}));

	return (
		<div className="buttons">
			{buttons.map((item: any, i: number) => {
				const cn = [ item.icon, 'withBackground' ];

				if (item.isActive) {
					cn.push('isActive');
				};

				return (
					<Icon 
						id={`button-${block.id}-${item.type}`} 
						key={i} 
						className={cn.join(' ')} 
						inner={item.inner}
						onMouseDown={e => onButton(e, item)}
						tooltipParam={{
							text: item.name,
							caption: item.caption,
							typeY: I.MenuDirection.Top,
						}}
					/>
				);
			})}
		</div>
	);

}));

export default ChatButtons;