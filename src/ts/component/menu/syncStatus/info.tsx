import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { MenuItemVertical, Title, Label } from 'Component';
import { I, S, U, keyboard, Renderer, Action } from 'Lib';

const MenuSyncStatusInfo = forwardRef<{}, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive } = props;
	const { data } = param;
	const { title, message } = data;
	const buttons = data.buttons || [];
	const n = useRef(-1);
	
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
				Action.membershipUpgrade();
				break;
			};
		};
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	useEffect(() => {
		rebind();
		return () => unbind();
	}, []);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => buttons,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	return (
		<>
			<div className="data">
				<Title text={title} />
				<Label text={message} />
			</div>

			{buttons.length ? (
				<div className="items">
					{buttons.map((item: any, i: number) => (
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
