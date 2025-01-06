import React, { forwardRef, useEffect } from 'react';
import { MenuItemVertical, Title, Label } from 'Component';
import { I, S, keyboard, Renderer } from 'Lib';

const MenuSyncStatusInfo = forwardRef<{}, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive } = props;
	const { data } = param;
	const { title, message, buttons } = data;
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const onClick = (e, item) => {
		S.Menu.closeAll();

		switch (item.id) {
			case 'updateApp': {
				Renderer.send('updateCheck');
				break;
			};

			case 'upgradeMembership': {
				S.Popup.open('membership', { data: { tier: I.TierType.Builder } });
				break;
			};
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const getItems = () => {
		return buttons || [];
	};

	const items = getItems();

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	return (
		<>
			<div className="data">
				<Title text={title} />
				<Label text={message} />
			</div>

			{items.length ? (
				<div className="items">
					{items.map((item: any, i: number) => (
						<MenuItemVertical
							key={i}
							{...item}
							onClick={e => onClick(e, item)}
							onMouseEnter={e => onMouseEnter(e, item)}
						/>
					))}
				</div>
			) : ''}
		</>
	);

});

export default MenuSyncStatusInfo;