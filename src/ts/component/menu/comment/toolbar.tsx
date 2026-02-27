import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, keyboard, translate } from 'Lib';

const MenuCommentToolbar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, close } = props;
	const { data } = param;
	const { editorRef, onToggleFormat, onSetBlockStyle, getCurrentBlockStyle, getActiveFormats } = data;
	const [ showStyleMenu, setShowStyleMenu ] = useState(false);

	useImperativeHandle(ref, () => ({}));

	const formatButtons = [
		{ type: 'bold' as const, icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic' as const, icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough' as const, icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline' as const, icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: 'code' as const, icon: 'kbd', name: translate('commonCode'), caption: keyboard.getCaption('textCode') },
	];

	const styleOptions = [
		{ id: 'paragraph', style: I.TextStyle.Paragraph, name: translate('commentToolbarRegular') },
		{ id: 'h1', style: I.TextStyle.Header1, name: translate('commentToolbarTitle') },
		{ id: 'h2', style: I.TextStyle.Header2, name: translate('commentToolbarHeading') },
		{ id: 'h3', style: I.TextStyle.Header3, name: translate('commentToolbarSubheading') },
	];

	const activeFormats = getActiveFormats?.() || {};
	const currentStyle = getCurrentBlockStyle?.() || I.TextStyle.Paragraph;
	const currentStyleOption = styleOptions.find(it => it.style === currentStyle) || styleOptions[0];

	const onFormatClick = (e: any, type: string) => {
		e.preventDefault();
		e.stopPropagation();
		onToggleFormat?.(type);
	};

	const onStyleClick = (e: any, style: I.TextStyle) => {
		e.preventDefault();
		e.stopPropagation();
		setShowStyleMenu(false);
		onSetBlockStyle?.(style);
	};

	const onStyleDropdownClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();
		setShowStyleMenu(!showStyleMenu);
	};

	return (
		<div className="commentToolbar">
			<div className="toolbarInner">
				<div className="styleDropdown" onMouseDown={onStyleDropdownClick}>
					<span className="styleLabel">{currentStyleOption.name}</span>
					<Icon className="arrow" />
				</div>

				<div className="separator" />

				{formatButtons.map((btn) => {
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

			{showStyleMenu ? (
				<div className="styleMenu">
					{styleOptions.map((option) => {
						const cn = [ 'styleItem' ];
						if (option.style === currentStyle) {
							cn.push('active');
						};

						return (
							<div
								key={option.id}
								className={cn.join(' ')}
								onMouseDown={e => onStyleClick(e, option.style)}
							>
								{option.name}
							</div>
						);
					})}
				</div>
			) : ''}
		</div>
	);
}));

export default MenuCommentToolbar;
