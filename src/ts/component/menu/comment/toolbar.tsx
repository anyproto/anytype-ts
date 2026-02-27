import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, translate } from 'Lib';

const MenuCommentToolbar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
	const { data } = param;
	const { onToggleFormat, getActiveFormats } = data;

	useImperativeHandle(ref, () => ({}));

	const buttons = [
		{ type: 'bold' as const, icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic' as const, icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough' as const, icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline' as const, icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: 'code' as const, icon: 'kbd', name: translate('commonCode'), caption: keyboard.getCaption('textCode') },
	];

	const activeFormats = getActiveFormats?.() || {};

	const onFormatClick = (e: any, type: string) => {
		e.preventDefault();
		e.stopPropagation();
		onToggleFormat?.(type);
	};

	return (
		<div className="buttons">
			{buttons.map((btn) => {
				const cn = [ btn.icon ];
				if (activeFormats[btn.type]) {
					cn.push('active');
				};

				return (
					<Icon
						key={btn.type}
						className={cn.join(' ')}
						tooltipParam={{ text: btn.name, caption: btn.caption }}
						onMouseDown={e => onFormatClick(e, btn.type)}
					/>
				);
			})}
		</div>
	);
}));

export default MenuCommentToolbar;
