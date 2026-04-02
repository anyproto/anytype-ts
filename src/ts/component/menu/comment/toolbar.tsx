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
	];

	const activeFormats = getActiveFormats?.() || {};
	const blockStyle = getBlockStyle?.() || 'text';

	const onMark = (e: any, type: string) => {
		e.preventDefault();
		e.stopPropagation();
		onToggleFormat?.(type);
	};

	const onLinkClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('blockLink', {
			element: `#${getId()} #button-link`,
			classNameWrap: 'fromBlock',
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
			data: {
				filter: activeFormats.linkParam || '',
				onChange: (type: I.MarkType, param: string) => {
					onLink?.(param, type);
					close();
				},
			},
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
				options,
				onSelect: (_e: any, item: any) => {
					onBlockStyle?.(item.textStyle);
				},
			},
		});
	};

	const onListClick = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		const options = [
			{ id: 'bulleted', iconParam: { name: 'menu/block/text/bulleted' }, name: translate('blockNameBulleted'), textStyle: I.TextStyle.Bulleted },
			{ id: 'numbered', iconParam: { name: 'menu/block/text/numbered' }, name: translate('blockNameNumbered'), textStyle: I.TextStyle.Numbered },
			{ id: 'checkbox', iconParam: { name: 'menu/block/text/checkbox', color: 'accent100' }, name: translate('blockNameCheckbox'), textStyle: I.TextStyle.Checkbox },
		];

		S.Menu.open('select', {
			classNameWrap: 'fromBlock',
			element: `#${getId()} #button-list`,
			offsetY: 6,
			horizontal: I.MenuDirection.Center,
			vertical: I.MenuDirection.Top,
			noAnimation: true,
			data: {
				noClose: true,
				options,
				onSelect: (_e: any, item: any) => {
					onBlockStyle?.(item.textStyle);
				},
			},
		});
	};

	const extraActions = [
		{ id: 'link', icon: 'menu/mark/link', name: translate('commonLink'), caption: keyboard.getCaption('textLink'), isActive: activeFormats.link, onClick: onLinkClick },
		{ id: 'quote', icon: 'comment/menu/quote', name: translate('blockNameQuote'), isActive: blockStyle == 'quote', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(I.TextStyle.Quote); } },
		{ id: 'code', icon: 'comment/menu/code', name: translate('blockNameCode'), isActive: blockStyle == 'code', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(I.TextStyle.Code); } },
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
			</div>

			<div className="section">
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

			<div className="section last">
				<Icon
					id="button-list"
					name="menu/block/text/bulleted"
					className="blockStyle" withBackground={true}
					arrow={true}
					tooltipParam={{ text: translate('blockNameBulleted') }}
					onMouseDown={onListClick}
				/>
			</div>
		</div>
	);
});

export default MenuCommentToolbar;
