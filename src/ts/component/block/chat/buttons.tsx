import React, { forwardRef, useImperativeHandle, useState, useEffect, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { Action, analytics, I, J, keyboard, Mark, S, translate, U } from 'Lib';

interface Props extends I.BlockComponent {
	value: string;
	attachments: any[];
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
		rootId, block, attachments, hasSelection, caretMenuParam, onMention, onChatButtonSelect, onTextButtonToggle, getMarksAndRange, removeBookmark,
		addAttachments, getObjectFromPath, updateAttachments, onMenuClose,
	} = props;
	const [ buttons, setButtons ] = useState<any[]>([]);
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
						onSelect: (icon) => onChatButtonSelect(type, icon),
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
			{ type: I.ChatButton.Object, icon: 'plus', name: translate('blockChatButtonObject'), caption: `${cmd} + A` },
			{ type: I.ChatButton.Emoji, icon: 'emoji', name: translate('blockChatButtonEmoji'), caption: `${cmd} + E` },
			{ type: I.ChatButton.Mention, icon: 'mention', name: translate('blockChatButtonMention'), caption: `${cmd} + M` },
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

	const onAttachment = (menu?: string) => {
		const options: any[] = [
			{ id: 'object', icon: 'object', name: translate('commonObject') },
			{ id: 'media', icon: 'media', name: translate('commonMedia') },
			{ id: 'file', icon: 'file', name: translate('commonFile') },
			{ id: 'upload', icon: 'upload', name: translate('commonUpload') },
		];

		const upload = () => {
			Action.openFileDialog({ properties: [ 'multiSelections' ] }, paths => {
				if (paths.length) {
					addAttachments(paths.map(path => getObjectFromPath(path)));

					analytics.event('AttachItemChat', { type: 'Upload', count: paths.length });
				};
			});

			analytics.event('ClickChatAttach', { type: 'Upload' });
		};

		let menuId = '';
		let data: any = {};

		if (menu) {
			if (menu == 'upload') {
				upload();
				return;
			};

			const analyticsMenuName = U.Common.toUpperCamelCase(menu);

			menuId = 'searchObject';
			data = {
				canAdd: true,
				skipIds: attachments.map(it => it.id),
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
				],
				onSelect: (item: any, isNew: boolean) => {
					onChatButtonSelect(I.ChatButton.Object, item);

					if (isNew) {
						U.Object.openPopup(item, {
							onClose: () => {
								if (updateAttachments) {
									updateAttachments();
								};
							}
						});
					};

					analytics.event('AttachItemChat', { type: analyticsMenuName, count: 1 });
				},
			};

			if (menu == 'object') {
				data.filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getFileLayouts() });
			} else
			if ([ 'file', 'media' ].includes(menu)) {
				const layouts = {
					media: [ I.ObjectLayout.Image, I.ObjectLayout.Audio, I.ObjectLayout.Video ],
					file: [ I.ObjectLayout.File, I.ObjectLayout.Pdf ],
				};

				data.filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: layouts[menu] });
				data = Object.assign(data, {
					canAdd: true,
					addParam: {
						name: translate('commonUpload'),
						icon: 'upload',
						onClick: upload
					},
				});
			};

			analytics.event('ClickScreenChatAttach', { type: analyticsMenuName });
		} else {
			menuId = 'select';
			data = {
				options,
				noVirtualisation: true,
				noScroll: true,
				onSelect: (e: React.MouseEvent, option: any) => {
					onAttachment(option.id);
				}
			};

			analytics.event('ScreenChatAttach');
		};

		S.Menu.closeAll(null, () => {
			S.Menu.open(menuId, {
				element: `#block-${block.id} #button-${block.id}-${I.ChatButton.Object}`,
				className: 'chatAttachment fixed',
				offsetY: -8,
				vertical: I.MenuDirection.Top,
				noFlipX: true,
				noFlipY: true,
				onClose: () => {
					if (menu) {
						onMenuClose();
					};
				},
				data,
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