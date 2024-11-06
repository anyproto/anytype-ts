import { H } from 'Lib';
import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';

interface Props {
	children: ReactNode;
	anchorEl: HTMLElement | null;
	gap?: number;
	isShown?: boolean;
};

export const Floater: React.FC<Props> = ({ 
	children, 
	anchorEl, 
	gap: offset = 0,
	isShown = true,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [ position, setPosition ] = useState({ top: 0, left: 0 });
	const cn = [ 'floater' ];

	if (isShown) {
		cn.push('show');
	};

	const onMove = () => {
		if (!anchorEl || !ref.current) {
			return;
		};

		const anchorElRect = anchorEl.getBoundingClientRect();
		const elRect = ref.current.getBoundingClientRect();

		const { top: at, left: al, width: aw, height: ah } = anchorElRect;
		const sy = window.scrollY;

		const eh = elRect.height;
		const ew = elRect.width;
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
	useEffect(() => onMove(), [ anchorEl, ref.current, isShown ]);

	return ReactDOM.createPortal(
		(
			<div
				className={cn.join(' ')}
				ref={ref}
				style={{ transform: `translate3d(${position.left}px, ${position.top}px, 0px)`}}
			>
				{children}
			</div>
		),
		document.getElementById('floaterContainer')
	);
};