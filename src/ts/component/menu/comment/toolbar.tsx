import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, keyboard, translate } from 'Lib';

const MenuCommentToolbar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param } = props;
	const { data } = param;
	const { onToggleFormat, getActiveFormats } = data;

	useImperativeHandle(ref, () => ({}));

	const markActions = [
		{ type: 'bold', icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic', icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough', icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline', icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: 'code', icon: 'kbd', name: translate('commonInlineCode'), caption: keyboard.getCaption('textCode') },
	];

	const activeFormats = getActiveFormats?.() || {};

	const onMark = (e: any, type: string) => {
		e.preventDefault();
		e.stopPropagation();
		onToggleFormat?.(type);
	};

	return (
		<div className="flex">
			<div className="section">
				{markActions.map((action) => {
					const cn = [ action.icon ];
					if (activeFormats[action.type]) {
						cn.push('active');
					};

					return (
						<Icon
							key={action.type}
							className={cn.join(' ')}
							tooltipParam={{ text: action.name, caption: action.caption }}
							onMouseDown={e => onMark(e, action.type)}
						/>
					);
				})}
			</div>
		</div>
	);
}));

export default MenuCommentToolbar;
