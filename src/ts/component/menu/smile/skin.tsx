import React, { forwardRef, useRef, useEffect } from 'react';
import { IconObject } from 'Component';
import { I, U, keyboard } from 'Lib';
import $ from 'jquery';

const SKINS = [ 1, 2, 3, 4, 5, 6 ];

const MenuSmileSkin = forwardRef<{}, I.Menu>((props, ref) => {

	const nodeRef = useRef(null);
	const n = useRef(0);
	const { param, close } = props;
	const { data } = param;
	const { smileId, onSelect } = data;

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
			n.current = SKINS.indexOf(id);
			setActive();
		};
	};

	const onKeyDown = (e) => {
		keyboard.shortcut('arrowleft, arrowright, arrowup, arrowdown', e, (pressed) => {
			e.preventDefault();

			const dir = [ 'arrowleft', 'arrowup' ].includes(pressed) ? -1 : 1;

			n.current += dir;
			if (n.current < 0) {
				n.current = SKINS.length - 1;
			} else
			if (n.current >= SKINS.length) {
				n.current = 0;
			};

			setActive();
		});

		keyboard.shortcut('enter, space, tab', e, () => {
			e.preventDefault();
			e.stopPropagation();

			if (SKINS[n.current]) {
				onSelect(SKINS[n.current]);
				close();
			};
		});
	};

	const setActive = () => {
		const node = $(nodeRef.current);

		node.find('.active').removeClass('active');
		node.find(`#skin-${SKINS[n.current]}`).addClass('active');
	};
	
	const Item = (item: any) => (
		<div 
			id={`skin-${item.skin}`} 
			className="item" 
			onMouseDown={e => onClick(e, item.skin)}
			onMouseEnter={e => onMouseEnter(e, item.skin)}
		>
			<IconObject size={32} object={{ iconEmoji: U.Smile.nativeById(smileId, item.skin) }} />
		</div>
	);

	useEffect(() => {
		rebind();
		setActive();

		return () => {
			unbind();

			if (data.rebind) {
				data.rebind();
			};
		};
	}, []);

	return (
		<div ref={nodeRef}>
			{SKINS.map((skin: any, i: number) => (
				<Item key={i} skin={skin} />
			))}
		</div>
	);

});

export default MenuSmileSkin;
