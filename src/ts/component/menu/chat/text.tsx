import React, { forwardRef } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

const MenuChatText = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { rootId, blockId, marks, range, onTextButtonToggle, removeBookmark } = data;

	const getButtons = () => {
		return [
			{ type: I.MarkType.Bold, icon: 'menu/mark/bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
			{ type: I.MarkType.Italic, icon: 'menu/mark/italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
			{ type: I.MarkType.Strike, icon: 'menu/mark/strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
			{ type: I.MarkType.Underline, icon: 'menu/mark/underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
			{ type: I.MarkType.Link, icon: 'menu/mark/link', name: translate('commonLink'), caption: keyboard.getCaption('textLink') },
			{ type: I.MarkType.Code, icon: 'menu/mark/code', name: translate('commonInlineCode'), caption: keyboard.getCaption('textCode') },
		];
	};

	const onButton = (e: any, type: I.MarkType) => {
		const { from, to } = range;
		const mark = Mark.getInRange(marks, type, { from, to });
		const rect = U.Dom.getSelectionRect();

		const menuParam: any = {
			element: `#button-${U.Common.esc(blockId)}-${type}`,
			rect: rect ? { ...rect, y: rect.y + window.scrollY } : null,
			className: 'fixed',
			classNameWrap: 'fromBlock',
			offsetY: -4,
			offsetX: -8,
			vertical: I.MenuDirection.Top,
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
					onClear: (before) => {
						if (before) {
							removeBookmark(before);
						};
					},
				});
				break;
			};

		};

		if (menuId && !S.Menu.isOpen(menuId)) {
			S.Menu.close('chatText', () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const buttons = getButtons();

	return (
		<div className="buttons">
			{buttons.map((action: any, i: number) => {
				let isSet = false;
				if (action.type == I.MarkType.Link) {
					const inRange = Mark.getInRange(marks, I.MarkType.Link, range) || Mark.getInRange(marks, I.MarkType.Object, range);
					isSet = inRange && inRange.param ? true : false;
				} else {
					isSet = !!Mark.getInRange(marks, action.type, range);
				};

				return (
					<Icon
						id={`button-${blockId}-${action.type}`}
						key={i}
						name={action.icon}
						color={isSet ? 'default' : ''}
						className={isSet ? 'active' : ''}
						tooltipParam={{ text: action.name, caption: action.caption }}
						onMouseDown={e => onButton(e, action.type)}
					/>
				);
			})}
		</div>
	);
});

export default MenuChatText;