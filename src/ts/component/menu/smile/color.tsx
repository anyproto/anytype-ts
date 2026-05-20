import React, { forwardRef, useRef, useEffect } from 'react';
import { IconObject } from 'Component';
import * as I from 'Interface';

const MenuSmileColor = forwardRef<{}, I.Menu>((props, ref) => {

	const nodeRef = useRef(null);
	const n = useRef(0);
	const { param, close } = props;
	const { data } = param;
	const { itemId, isEmoji, onSelect } = data;
	const colors = isEmoji ? [ 1, 2, 3, 4, 5, 6 ] : [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'keydown', onKeyDown);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};

	const onClick = (e: any, id: number) => {
		e.preventDefault();
		e.stopPropagation();

		onSelect(id);
		close();
	};

	const onMouseEnter = (e: any, id: number) => {
		if (!keyboard.isMouseDisabled) {
			n.current = colors.indexOf(id);
			setActive();
		};
	};

	const onKeyDown = (e) => {
		keyboard.shortcut('arrowleft, arrowright, arrowup, arrowdown', e, (pressed) => {
			e.preventDefault();

			const dir = [ 'arrowleft', 'arrowup' ].includes(pressed) ? -1 : 1;

			n.current += dir;
			if (n.current < 0) {
				n.current = colors.length - 1;
			} else
			if (n.current >= colors.length) {
				n.current = 0;
			};

			setActive();
		});

		keyboard.shortcut('enter, space, tab', e, () => {
			e.preventDefault();
			e.stopPropagation();

			if (colors[n.current]) {
				onSelect(colors[n.current]);
				close();
			};
		});
	};

	const setActive = () => {
		const node = nodeRef.current;
		if (!node) return;

		const prev = U.Dom.select('.active', node);
		if (prev) U.Dom.removeClass(prev, 'active');
		const next = U.Dom.select(`#color-${colors[n.current]}`, node);
		if (next) U.Dom.addClass(next, 'active');
	};
	
	const Item = (item: any) => {
		const iconObject: any = {};
		const iconSize = isEmoji ? undefined : 32;

		if (isEmoji) {
			iconObject.iconEmoji = U.Smile.nativeById(itemId, item.color);
		} else {
			iconObject.iconName = itemId;
			iconObject.iconOption = item.color;
			iconObject.layout = I.ObjectLayout.Type;
		};

		return (
			<div 
				id={`color-${item.color}`}
				className="item" 
				onMouseDown={e => onClick(e, item.color)}
				onMouseEnter={e => onMouseEnter(e, item.color)}
			>
				<IconObject size={32} iconSize={iconSize} object={iconObject} />
			</div>
		);
	};

	useEffect(() => {
		rebind();
		setActive();
		return () => unbind();
	}, []);

	return (
		<div ref={nodeRef}>
			{colors.map((color: any, i: number) => (
				<Item key={i} color={color} />
			))}
		</div>
	);

});

export default MenuSmileColor;
