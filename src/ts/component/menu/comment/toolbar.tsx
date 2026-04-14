import React, { forwardRef, useImperativeHandle } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

const STYLE_MAP: Record<string, number> = {
	paragraph: I.TextStyle.Paragraph,
	header1: I.TextStyle.Header1,
	header2: I.TextStyle.Header2,
	header3: I.TextStyle.Header3,
	checkbox: I.TextStyle.Checkbox,
	bulleted: I.TextStyle.Bulleted,
	numbered: I.TextStyle.Numbered,
};

const LIST_STYLES = [ 'checkbox', 'bulleted', 'numbered' ];

const MenuCommentToolbar = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, close } = props;
	const { data } = param;
	const { onToggleFormat, onBlockStyle, onLink, getActiveFormats, getBlockStyle } = data;

	useImperativeHandle(ref, () => ({}));

	let markActions = [
		{ type: 'bold', icon: 'menu/mark/bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic', icon: 'menu/mark/italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough', icon: 'menu/mark/strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline', icon: 'menu/mark/underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
		{ type: 'code', icon: 'menu/mark/code', name: translate('commonInlineCode'), caption: keyboard.getCaption('textCode') },
	];

	const activeFormats = getActiveFormats?.() || {};
	const blockStyle = getBlockStyle?.() || data.blockStyle || 'text';
	const isHeader = [ 'header1', 'header2', 'header3' ].includes(blockStyle);

	if (isHeader) {
		markActions = markActions.filter(it => it.type !== 'bold');
	};

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
			offsetY: -6,
			horizontal: I.MenuDirection.Center,
			vertical: I.MenuDirection.Top,
			noAnimation: true,
			data: linkData,
		});
	};

	const onStyleClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('blockStyle', {
			classNameWrap: 'fromBlock',
			element: `#${getId()} #button-style`,
			offsetY: 6,
			horizontal: I.MenuDirection.Left,
			vertical: I.MenuDirection.Top,
			noAnimation: true,
			data: {
				rootId: '',
				blockId: '',
				blockIds: [],
				allowedSections: [ 'turnText', 'turnList' ],
				allowedItems: [
					I.TextStyle.Paragraph, I.TextStyle.Header1, I.TextStyle.Header2, I.TextStyle.Header3,
					I.TextStyle.Checkbox, I.TextStyle.Bulleted, I.TextStyle.Numbered,
				],
				activeStyle: STYLE_MAP[blockStyle] ?? I.TextStyle.Paragraph,
				onSelect: (item: any) => {
					onBlockStyle?.(item.itemId);
				},
			},
		});
	};


	const extraActions = [
		{ id: 'link', icon: 'menu/mark/link', name: translate('commonLink'), caption: keyboard.getCaption('textLink'), isActive: activeFormats.link, onClick: onLinkClick },
		{ id: 'quote', icon: 'comment/menu/quote', name: translate('blockNameQuote'), isActive: blockStyle == 'quote', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(blockStyle == 'quote' ? I.TextStyle.Paragraph : I.TextStyle.Quote); } },
	];

	const styleIcon = LIST_STYLES.includes(blockStyle)
		? U.Data.blockTextIcon(STYLE_MAP[blockStyle])
		: 'menu/block/text/paragraph';


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
