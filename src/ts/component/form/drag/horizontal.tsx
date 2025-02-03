import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';

interface Props {
	id?: string;
	className?: string;
	value?: number;
	snaps?: number[];
	strictSnap?: boolean;
	iconIsOutside?: boolean;
	readonly?: boolean;
	onStart?(e: any, v: number): void;
	onMove?(e: any, v: number): void;
	onEnd?(e: any, v: number): void;
};

interface DragHorizontalRefProps {
	getValue(): number;
	setValue(v: number): void;
	resize(): void;
};

const SNAP = 0.025;

const DragHorizontal = forwardRef<DragHorizontalRefProps, Props>(({
	id = '',
	className = '',
	value: initalValue = 0,
	snaps = [],
	strictSnap = false,
	iconIsOutside = false,
	readonly = false,
	onStart,
	onMove,
	onEnd,
}, ref) => {
	let value = initalValue;

	const nodeRef = useRef(null);
	const iconRef = useRef(null);
	const backRef = useRef(null);
	const fillRef = useRef(null);
	const cn = [ 'input-drag-horizontal', className ];

	if (readonly) {
		cn.push('isReadonly');
	};

	const checkValue = (v: number): number => {
		v = Number(v) || 0;
		v = Math.max(0, v);
		v = Math.min(1, v);
		return v;
	};

	const maxWidth = (): number => {
		return $(nodeRef.current).width() - $(iconRef.current).width();
	};

	const setValue = (v: number) => {
		move(checkValue(v) * maxWidth());
	};

	const getValue = () => {
		return checkValue(value);
	};

	const resize = () => {
		setValue(value);
	};

	const start = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (readonly) {
			return;
		};
		
		const win = $(window);
		const node = $(nodeRef.current);
		const icon = $(iconRef.current);
		const iw = icon.outerWidth();
		const ox = node.offset().left;
		
		move(e.pageX - ox - iw / 2);
		node.addClass('isDragging');
		
		if (onStart) {
			onStart(e, value);
		};

		win.off('mousemove.drag touchmove.drag').on('mousemove.drag touchmove.drag', (e: any) => {
			move(e.pageX - ox - iw / 2);

			if (onMove) {
				onMove(e, value);
			};
		});
		
		win.off('mouseup.drag touchend.drag').on('mouseup.drag touchend.drag', (e: any) => {
			end(e);

			if (onEnd) {
				onEnd(e, value);
			};
		});
	};

	const move = (x: number) => {
		const node = $(nodeRef.current);
		const icon = $(iconRef.current);
		const back = $(backRef.current);
		const fill = $(fillRef.current);
		const nw = node.outerWidth();
		const iw = icon.outerWidth() / 2;
		const ib = parseInt(icon.css('border-width'));
		const mw = maxWidth();

		x = Math.max(0, x);
		x = Math.min(mw, x);

		value = checkValue(x / mw);

		// Snap
		if (strictSnap && snaps.length && (value < snaps[0] / 2)) {
			value = 0;
		} else {
			const step = 1 / snaps.length;
			for (const snap of snaps) {
				const d = strictSnap ? step / 2 : SNAP;

				if ((value >= snap - d) && (value < snap + d)) {
					value = snap;
					break;
				};
			};
		};

		x = value * mw;

		const w = Math.min(nw, x + (iconIsOutside ? iw : 0));

		icon.css({ left: x });
		back.css({ left: (w + iw + ib * 2), width: (nw - w - iw - ib * 2) });
		fill.css({ width: (w + (iconIsOutside ? 0 : iw) - ib * 2) });
	};

	const end = (e) => {
		e.preventDefault();
		e.stopPropagation();

		$(window).off('mousemove.drag touchmove.drag mouseup.drag touchend.drag');
		$(nodeRef.current).removeClass('isDragging');
	};

	useEffect(() => setValue(initalValue), []);

	useImperativeHandle(ref, () => ({
		getValue,
		setValue,
		resize,
	}));

	return (
		<div 
			ref={nodeRef}
			id={id} 
			className={cn.join(' ')} 
			onMouseDown={start}
			onClick={e => e.stopPropagation()}
		>
			<div ref={backRef} className="back" />
			<div ref={fillRef} className="fill" />
			<div ref={iconRef} className="icon">
				<div className="bullet" />
			</div>
		</div>
	);

});

export default DragHorizontal;