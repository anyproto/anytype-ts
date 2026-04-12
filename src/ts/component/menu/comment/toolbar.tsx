import React, { forwardRef, useImperativeHandle } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

const MenuCommentToolbar = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, close } = props;
	const { data } = param;
	const { onToggleFormat, onBlockStyle, onLink, getActiveFormats, getBlockStyle } = data;

	useImperativeHandle(ref, () => ({}));

	const markActions = [
		{ type: 'bold', icon: 'menu/mark/bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic', icon: 'menu/mark/italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough', icon: 'menu/mark/strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline', icon: 'menu/mark/underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: 'code', icon: 'menu/mark/code', name: translate('commonInlineCode'), caption: keyboard.getCaption('textCode') },
	];

	const activeFormats = getActiveFormats?.() || {};
	const blockStyle = data.blockStyle || getBlockStyle?.() || 'text';

	const onMark = (e: any, type: string) => {
		e.preventDefault();
		e.stopPropagation();
		onToggleFormat?.(type);
	};

	const onLinkClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const isObjectLink = activeFormats.linkMarkType === I.MarkType.Object;
		const linkData: any = {
			filter: isObjectLink ? (activeFormats.selectedText || '') : (activeFormats.linkParam || ''),
			type: isObjectLink ? I.MarkType.Object : null,
			onChange: (type: I.MarkType, param: string) => {
				onLink?.(param, type);
				close();
			},
		};

		S.Menu.open('blockLink', {
			element: `#${getId()} #button-link`,
			classNameWrap: 'fromBlock',
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: linkData,
		});
	};

	const onStyleClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const options = [
			{ id: 'paragraph', iconParam: { name: 'menu/block/text/paragraph' }, name: translate('blockNameParagraph'), textStyle: I.TextStyle.Paragraph },
			{ id: 'header1', iconParam: { name: 'menu/block/text/header' }, name: translate('blockNameHeader1'), textStyle: I.TextStyle.Header1 },
			{ id: 'header2', iconParam: { name: 'menu/block/text/header' }, name: translate('blockNameHeader2'), textStyle: I.TextStyle.Header2 },
			{ id: 'header3', iconParam: { name: 'menu/block/text/header' }, name: translate('blockNameHeader3'), textStyle: I.TextStyle.Header3 },
		];

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			element: `#${getId()} #button-style`,
			offsetY: 6,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			noAnimation: true,
			data: {
				noClose: true,
				options: U.Menu.prepareForSelect(options),
				onSelect: (_e: any, item: any) => {
					onBlockStyle?.(item.textStyle);
				},
			},
		});
	};


	const extraActions = [
		{ id: 'link', icon: 'menu/mark/link', name: translate('commonLink'), caption: keyboard.getCaption('textLink'), isActive: activeFormats.link, onClick: onLinkClick },
		{ id: 'quote', icon: 'comment/menu/quote', name: translate('blockNameQuote'), isActive: blockStyle == 'quote', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(I.TextStyle.Quote); } },
	];

	const styleIcon = (() => {
		switch (blockStyle) {
			case 'header1':
			case 'header2':
			case 'header3': return 'menu/block/text/header';
			default: return 'menu/block/text/paragraph';
		};
	})();


	return (
		<div className="flex">
			<div className="section first">
				<Icon
					id="button-style"
					name={styleIcon}
					className="blockStyle" withBackground={true}
					arrow={true}
					tooltipParam={{ text: translate('menuBlockContextSwitchStyle') }}
					onMouseDown={onStyleClick}
				/>
			</div>

			<div className="section">
				{markActions.map((action) => {
					const isActive = activeFormats[action.type];

					return (
						<Icon
							id={`button-${action.type}`}
							key={action.type}
							name={action.icon}
							color={isActive ? 'default' : ''}
							className={isActive ? 'active' : ''} withBackground={true}
							tooltipParam={{ text: action.name, caption: action.caption }}
							onMouseDown={e => onMark(e, action.type)}
						/>
					);
				})}
				{extraActions.map((action) => (
					<Icon
						id={`button-${action.id}`}
						key={action.id}
						name={action.icon}
						color={action.isActive ? 'default' : ''}
						className={action.isActive ? 'active' : ''} withBackground={true}
						tooltipParam={{ text: action.name, caption: action.caption }}
						onMouseDown={action.onClick}
					/>
				))}
			</div>

		</div>
	);
});

export default MenuCommentToolbar;
