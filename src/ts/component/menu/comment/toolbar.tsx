import React, { forwardRef, useImperativeHandle } from 'react';
import { observer } from 'mobx-react';
import { Icon } from 'Component';
import { I, S, keyboard, translate } from 'Lib';

const MenuCommentToolbar = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, close } = props;
	const { data } = param;
	const { onToggleFormat, onBlockStyle, onLink, getActiveFormats, getBlockStyle } = data;

	useImperativeHandle(ref, () => ({}));

	const markActions = [
		{ type: 'bold', icon: 'bold', name: translate('commonBold'), caption: keyboard.getCaption('textBold') },
		{ type: 'italic', icon: 'italic', name: translate('commonItalic'), caption: keyboard.getCaption('textItalic') },
		{ type: 'strikethrough', icon: 'strike', name: translate('commonStrikethrough'), caption: keyboard.getCaption('textStrike') },
		{ type: 'underline', icon: 'underline', name: translate('commonUnderline'), caption: keyboard.getCaption('textUnderlined') },
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
			{ id: 'paragraph', icon: 'textParagraph', name: translate('blockNameParagraph'), textStyle: I.TextStyle.Paragraph },
			{ id: 'header1', icon: 'textHeader1', name: translate('blockNameHeader1'), textStyle: I.TextStyle.Header1 },
			{ id: 'header2', icon: 'textHeader2', name: translate('blockNameHeader2'), textStyle: I.TextStyle.Header2 },
			{ id: 'header3', icon: 'textHeader3', name: translate('blockNameHeader3'), textStyle: I.TextStyle.Header3 },
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
			{ id: 'bulleted', icon: 'textBulleted', name: translate('blockNameBulleted'), textStyle: I.TextStyle.Bulleted },
			{ id: 'numbered', icon: 'textNumbered', name: translate('blockNameNumbered'), textStyle: I.TextStyle.Numbered },
			{ id: 'checkbox', icon: 'textCheckbox', name: translate('blockNameCheckbox'), textStyle: I.TextStyle.Checkbox },
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
		{ id: 'link', icon: 'link', name: translate('commonLink'), caption: keyboard.getCaption('textLink'), isActive: activeFormats.link, onClick: onLinkClick },
		{ id: 'quote', icon: 'quote', name: translate('blockNameQuote'), isActive: blockStyle == 'quote', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(I.TextStyle.Quote); } },
		{ id: 'code', icon: 'codeSnippet', name: translate('blockNameCode'), isActive: blockStyle == 'code', onClick: (e: any) => { e.preventDefault(); e.stopPropagation(); onBlockStyle?.(I.TextStyle.Code); } },
	];

	const styleIcon = (() => {
		switch (blockStyle) {
			case 'header1': return 'header1';
			case 'header2': return 'header2';
			case 'header3': return 'header3';
			default: return 'text';
		};
	})();

	return (
		<div className="flex">
			<div className="section first">
				<Icon
					id="button-style"
					className={[ styleIcon, 'blockStyle', 'withBackground' ].join(' ')}
					arrow={true}
					tooltipParam={{ text: translate('menuBlockContextSwitchStyle') }}
					onMouseDown={onStyleClick}
				/>
			</div>

			<div className="section">
				{markActions.map((action) => {
					const cn = [ action.icon, 'withBackground' ];
					if (activeFormats[action.type]) {
						cn.push('active');
					};

					return (
						<Icon
							id={`button-${action.type}`}
							key={action.type}
							className={cn.join(' ')}
							tooltipParam={{ text: action.name, caption: action.caption }}
							onMouseDown={e => onMark(e, action.type)}
						/>
					);
				})}
			</div>

			<div className="section">
				{extraActions.map((action) => {
					const cn = [ action.icon, 'withBackground' ];
					if (action.isActive) {
						cn.push('active');
					};

					return (
						<Icon
							id={`button-${action.id}`}
							key={action.id}
							className={cn.join(' ')}
							tooltipParam={{ text: action.name, caption: action.caption }}
							onMouseDown={action.onClick}
						/>
					);
				})}
			</div>

			<div className="section last">
				<Icon
					id="button-list"
					className={[ 'list', 'blockStyle', 'withBackground' ].join(' ')}
					arrow={true}
					tooltipParam={{ text: translate('blockNameBulleted') }}
					onMouseDown={onListClick}
				/>
			</div>
		</div>
	);
}));

export default MenuCommentToolbar;
