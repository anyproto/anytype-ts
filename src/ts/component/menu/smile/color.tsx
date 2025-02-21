import React, { forwardRef, useRef, useEffect } from 'react';
import { IconObject } from 'Component';
import { I, U, keyboard, J } from 'Lib';
import $ from 'jquery';

const MenuSmileColor = forwardRef<{}, I.Menu>((props, ref) => {

	const nodeRef = useRef(null);
	const n = useRef(0);
	const { param, close } = props;
	const { data } = param;
	const { itemId, isEmoji, onSelect } = data;
	const colors = isEmoji ? [ 1, 2, 3, 4, 5, 6 ] : [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
	};

	const unbind = () => {
		$(window).off('keydown.menu');
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
		const node = $(nodeRef.current);

		node.find('.active').removeClass('active');
		node.find(`#color-${colors[n.current]}`).addClass('active');
	};
	
	const Item = (item: any) => (
		<div 
			id={`color-${item.color}`}
			className="item" 
			onMouseDown={e => onClick(e, item.color)}
			onMouseEnter={e => onMouseEnter(e, item.color)}
		>
			{isEmoji ? (
				<IconObject size={32} object={{ iconEmoji: U.Smile.nativeById(itemId, item.color) }} />
			) : (
				<IconObject iconSize={30} object={{ iconName: itemId, iconOption: item.color, layout: I.ObjectLayout.Type }} />
			)}
		</div>
	);

	useEffect(() => {
		rebind();
		setActive();
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
