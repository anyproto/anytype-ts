import { H } from 'Lib';
import $ from 'jquery';
import React, { forwardRef, useState, useEffect, ReactNode, useRef, useImperativeHandle } from 'react';
import ReactDOM from 'react-dom';

interface Props {
	children: ReactNode;
	anchorEl: HTMLElement | null;
	offset?: number;
	isShown?: boolean;
};

interface FloaterRefProps {
	show(): void;
	hide(): void;
};

const Floater = forwardRef<FloaterRefProps, Props>(({ 
	children, 
	anchorEl, 
	offset = 0,
}, ref) => {

	const nodeRef = useRef<HTMLDivElement>(null);
	const [ position, setPosition ] = useState({ top: 0, left: 0 });
	const cn = [ 'floater' ];

	useImperativeHandle(ref, () => ({
		show: () => $(nodeRef.current).addClass('show'),
		hide: () => $(nodeRef.current).removeClass('show'),
	}));

	const onMove = () => {
		if (!anchorEl || !nodeRef.current) {
			return;
		};

		const anchorElRect = anchorEl.getBoundingClientRect();
		const elRect = nodeRef.current.getBoundingClientRect();

		const { top: at, left: al, width: aw, height: ah } = anchorElRect;
		const { height: eh, width: ew } = elRect;
		const sy = window.scrollY;
		const nl = al + aw / 2 - ew / 2;

		let nt = at - eh - offset + sy;
		if (nt < 0) {
			nt = at + ah + offset + sy;
		} else {
			nt = at - eh - offset + sy;
		};

		setPosition({ top: nt, left: nl });
	};

	H.useElementMovement(anchorEl, onMove);
	useEffect(() => onMove(), []);
	useEffect(() => onMove(), [ anchorEl, nodeRef.current ]);

	return ReactDOM.createPortal(
		(
			<div
				className={cn.join(' ')}
				ref={nodeRef}
				style={{ transform: `translate3d(${position.left}px, ${position.top}px, 0px)`}}
			>
				{children}
			</div>
		),
		document.getElementById('floaterContainer')
	);
});

export default Floater;