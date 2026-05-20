import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MenuItemVertical, Button, ShareTooltip } from 'Component';
import * as I from 'Interface';
import Highlight from 'Lib/highlight';


const MenuHelp = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { id, param, setActive, close, getId, onKeyDown, getSize } = props;
	const n = useRef(-1);
	const showIncentive = U.Data.isFreeMember();

	const keydownHandler = useRef(null);

	const rebind = () => {
		unbind();
		keydownHandler.current = (e: any) => onKeyDown(e);
		U.Dom.addEvent(window, 'keydown', keydownHandler.current);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		if (keydownHandler.current) {
			U.Dom.removeEvent(window, 'keydown', keydownHandler.current);
			keydownHandler.current = null;
		};
	};

	const optionMapper = (it: any) => ({ 
		...it, 
		children: (it.children || []).map(optionMapper),
		name: it.name || translate(U.String.toCamelCase(`menuHelp-${it.id}`)) 
	});

	const getItems = () => {
		return [
			{ id: 'shortcut', iconParam: { name: 'menu/help/keyboard' }, caption: keyboard.getCaption('shortcut') },
			{ isDiv: true },
			{ id: 'share' },
			{ id: 'community' },
			{ id: 'tutorial' },
			{ id: 'contact' },
			{ isDiv: true },
			{
				id: 'whatsNew', iconParam: { name: 'menu/help/bell' }, document: 'whatsNew',
				caption: <Button size={16} text={U.Common.getElectron().version.app} />
			},
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
		].map((it: any) => {
			it.iconParam = it.iconParam || { name: `menu/help/${it.icon || it.id}` };
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
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			className: param.className,
			classNameWrap: param.classNameWrap,
			rebind,
			parentId: id,
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
		analytics.event(U.String.toUpperCamelCase([ getId(), item.id ].join('-')), { route: analytics.route.menuHelp });

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
		onOver,
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

			{showIncentive ? (
				<ShareTooltip
					text={translate('shareTooltipLabel')}
					onMouseEnter={() => {
						n.current = -1;
						S.Menu.closeAll([ 'select' ]);
					}}
					onClick={() => {
						Action.membershipUpgrade({ type: 'help' });
					}}
				/>
			) : ''}
		</>
	);

});

export default MenuHelp;