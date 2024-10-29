import { H } from 'Lib';
import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';


interface Props {
	children: ReactNode;
	anchorEl: HTMLElement | null;
	anchorTo?: AnchorTo;
	offset?: {
		left?: number;
		top?: number;
	};
	isShown?: boolean;
}

export enum AnchorTo {
	Top = 'top',
	Bottom = 'bottom',
}

export const Floater: React.FC<Props> = ({ 
	children, 
	anchorEl, 
	anchorTo = AnchorTo.Bottom,
	offset = { top: 0, left: 0 },
	isShown = true,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [ position, setPosition ] = useState({ top: 0, left: 0 });

	const onMove = () => {
		if (anchorEl && ref.current) {
			const anchorElRect = anchorEl.getBoundingClientRect();
			const elRect = ref.current.getBoundingClientRect();

			const { top: at, left: al, width: aw, height: ah } = anchorElRect;

			const sh = document.body.scrollHeight;
			const scrollY = window.scrollY;

			const eh = elRect.height;
			const ew = elRect.width;

			const ot = Number(offset.top) || 0;
			const ol = Number(offset.left) || 0;

			let nt = 0;
			const nl = al + aw / 2 - ew / 2 + ol;

			switch (anchorTo) {
				case AnchorTo.Top:
					nt = -sh + at - eh + ot + scrollY;
					break;
				case AnchorTo.Bottom:
					nt = -sh + at + ah + ot + scrollY;
					break;
			};
			setPosition({ top: nt, left: nl });
		};
	};

	H.useElementMovement(anchorEl, onMove);
	useEffect(() => onMove(), [ anchorEl, ref.current, isShown ]);

	return ReactDOM.createPortal(
		<div className={`floater ${isShown ? 'show' : 'hide'}`}
			ref={ref}
			style={{ transform: `translate3d(${position.left}px, ${position.top}px, 0px)`}}
		>
			{children}
		</div>,
		document.body
	);
};
