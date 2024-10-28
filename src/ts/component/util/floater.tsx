import React, { useState, useEffect, ReactNode, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useElementMovement } from './useMovementObserver';

interface Props {
	children: ReactNode;
	anchorEl: HTMLElement | null;
	anchorTo?: 'top' | 'bottom';
	offset?: {
		x?: number;
		y?: number;
	};
}

export const Floater: React.FC<Props> = ({ 
	children, 
	anchorEl, 
	anchorTo = 'bottom',
	offset = { x: 0, y: 0 },
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [ position, setPosition ] = useState({ top: 0, left: 0 });

	const onMove = () => {
		if (anchorEl && ref.current) {
			const anchorElRect = anchorEl.getBoundingClientRect();
			const floaterElRect = ref.current.getBoundingClientRect();

			const { top, left, bottom, width } = anchorElRect;
			const fh = floaterElRect.height;
			const fw = floaterElRect.width;

			const x = Number(offset.x) || 0;
			const y = Number(offset.y) || 0;

			let pt = 0;
			let pl = 0;

			if (anchorTo == 'top') {
				pt = top - fh + y;
				pl = left + width / 2 - fw / 2 + x;
			} else {
				pt = bottom + y;
				pl = left + width / 2 - fw / 2 + x;
			};

			setPosition({ top: pt, left: pl });
		};
	};

	useElementMovement(anchorEl, onMove);
	useEffect(() => onMove(), [ anchorEl, ref.current ]);

	return ReactDOM.createPortal(
		<div 
			ref={ref}
			style={{
				position: 'absolute',
				pointerEvents: 'none',
				// This is hopefully the highest z-index in the app
				zIndex: 200,
				top: `${position.top}px`,
				left: `${position.left}px`,
			}}>
			{children}
		</div>,
		document.body
	);
};
