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
		show: () => {
			onMove();
			$(nodeRef.current).addClass('show');
		},
		hide: () => $(nodeRef.current).removeClass('show'),
	}));

	const onMove = () => {
		if (!anchorEl || !nodeRef.current) {
			return;
		};

		const anchorRect = anchorEl.getBoundingClientRect();
		const elementRect = nodeRef.current.getBoundingClientRect();
		const { top: at, left: al, width: aw, height: ah } = anchorRect;
		const { height: eh, width: ew } = elementRect;
		const x = al + aw / 2 - ew / 2;

		let y = at - eh - offset;
		if (y < 0) {
			y = at + ah + offset;
		} else {
			y = at - eh - offset;
		};

		setPosition({ left: x, top: y });
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