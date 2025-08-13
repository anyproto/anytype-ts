import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MenuItemVertical, Button, ShareTooltip } from 'Component';
import { I, S, U, J, keyboard, analytics, Action, Highlight, translate } from 'Lib';

const MenuHelp = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { setActive, close, getId, onKeyDown, param, getSize } = props;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const optionMapper = (it: any) => ({ ...it, name: it.name || translate(U.Common.toCamelCase(`menuHelp-${it.id}`)) });

	const getItems = () => {
		return [
			{ 
				id: 'whatsNew', icon: 'help-star', document: 'whatsNew', 
				caption: <Button className="c16" text={U.Common.getElectron().version.app} /> 
			},
			{ id: 'shortcut', icon: 'help-keyboard', caption: keyboard.getCaption('shortcut') },
			{ isDiv: true },
			//{ id: 'gallery' },
			{ id: 'share' },
			{ id: 'community' },
			{ id: 'tutorial' },
			{ id: 'contact' },
			{ isDiv: true },
			{ 
				id: 'developer', arrow: true, children: [
					{ id: 'developerPortal' },
					{ id: 'mcp' },
				],
			},
			{ 
				id: 'more', arrow: true, children: [
					{ id: 'terms' },
					{ id: 'privacy' },
					{ id: 'tech' },
				],
			},
		].map(it => {
			it.children = (it.children || []).map(optionMapper);
			return optionMapper(it);
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
			onOver(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
		if (!item.arrow) {
			S.Menu.closeAll([ 'select' ]);
			return;
		};

		const menuId = 'select';
		const menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			rebind,
			data: {
				options: item.children,
				onSelect: onClick,
			}
		};

		if (menuId && !S.Menu.isOpen(menuId, item.id)) {
			S.Menu.closeAll([ 'select' ], () => {
				S.Menu.open(menuId, menuParam);
			});
		};
	};

	const onClick = (e: any, item: any) => {
		close();
		analytics.event(U.Common.toUpperCamelCase([ getId(), item.id ].join('-')), { route: analytics.route.menuHelp });

		Highlight.hide(item.id);

		switch (item.id) {
			default: {
				Action.openUrl(J.Url[item.id]);
				break;
			};

			case 'whatsNew': {
				U.Common.showWhatsNew();
				break;
			};

			case 'shortcut': {
				keyboard.onShortcut();
				break;
			};

			case 'contact': {
				keyboard.onContactUrl();
				break;
			};

			case 'tech': {
				keyboard.onTechInfo();
				break;
			};

			case 'share': {
				S.Popup.open('share', {});
				break;
			};

		};

	};

	const items = getItems();

	useEffect(() => {
		rebind();
		Highlight.showAll();
		return () => unbind();
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<>
			<div className="items">
				{items.map((item: any, i: number) => (
					<MenuItemVertical
						key={i}
						{...item}
						onMouseEnter={e => onMouseEnter(e, item)}
						onClick={e => onClick(e, item)}
					/>
				))}
			</div>

			<ShareTooltip
				text={translate('shareTooltipLabel')}
				onClick={() => U.Router.go('/main/settings/membership', {})}
			/>
		</>
	);

});

export default MenuHelp;