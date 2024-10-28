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
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [ position, setPosition ] = useState({ top: 0, left: 0 });

	const onMove = () => {
		if (anchorEl && ref.current) {
			const anchorElRect = anchorEl.getBoundingClientRect();
			const elRect = ref.current.getBoundingClientRect();

			const { top: at, left: al, bottom: ab, width: aw } = anchorElRect;
			const eh = elRect.height;
			const ew = elRect.width;

			const ot = Number(offset.top) || 0;
			const ol = Number(offset.left) || 0;

			let nt = 0;
			let nl = 0;

			switch (anchorTo) {
				case AnchorTo.Top:
					nt = at - eh + ot;
					nl = al + aw / 2 - ew / 2 + ol;
					break;
				case AnchorTo.Bottom:
					nt = ab + ot;
					nl = al + aw / 2 - ew / 2 + ol;
					break;
			};

			setPosition({ top: nt, left: nl });
		};
	};

	H.useElementMovement(anchorEl, onMove);
	useEffect(() => onMove(), [ anchorEl, ref.current ]);

	return ReactDOM.createPortal(
		<div className="floater"
			ref={ref}
			style={{ transform: `translate3d(${position.top}px, ${-position.left}px, 0px)`}}
		>
			{children}
		</div>,
		document.body
	);
};
