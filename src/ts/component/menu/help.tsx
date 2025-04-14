import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { MenuItemVertical, Button, ShareTooltip } from 'Component';
import { I, S, U, J, keyboard, analytics, Action, Highlight, translate } from 'Lib';

const MenuHelp = forwardRef<I.MenuRef, I.Menu>((props, ref) => {
	const { setActive, close, getId, onKeyDown } = props;
	const n = useRef(-1);

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		const btn = <Button className="c16" text={U.Common.getElectron().version.app} />;

		return [
			{ id: 'whatsNew', document: 'whatsNew', caption: btn },
			{ id: 'shortcut', caption: keyboard.getCaption('shortcut') },
			{ isDiv: true },
			{ id: 'gallery' },
			{ id: 'community' },
			{ id: 'tutorial' },
			{ id: 'contact' },
			{ id: 'tech' },
			{ isDiv: true },
			{ id: 'terms' },
			{ id: 'privacy' },
		].map(it => ({ ...it, name: translate(U.Common.toCamelCase(`menuHelp-${it.id}`)) }));
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const onClick = (e: any, item: any) => {
		close();
		analytics.event(U.Common.toUpperCamelCase([ getId(), item.id ].join('-')), { route: analytics.route.menuHelp });

		Highlight.hide(item.id);

		switch (item.id) {
			case 'whatsNew': {
				U.Common.showWhatsNew();
				break;
			};

			case 'shortcut': {
				keyboard.onShortcut();
				break;
			};

			case 'gallery':
			case 'terms':
			case 'tutorial':
			case 'privacy':
			case 'community': {
				Action.openUrl(J.Url[item.id]);
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

			<ShareTooltip route={analytics.route.menuHelp} />
		</>
	);

});

export default MenuHelp;