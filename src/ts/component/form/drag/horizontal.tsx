import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
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
	value: initialValue = 0,
	snaps = [],
	strictSnap = false,
	iconIsOutside = false,
	readonly = false,
	onStart,
	onMove,
	onEnd,
}, ref) => {
	let value = initialValue;

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
		return U.Dom.contentWidth(nodeRef.current) - U.Dom.contentWidth(iconRef.current);
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

	const moveHandler = useRef<((e: any) => void) | null>(null);
	const upHandler = useRef<((e: any) => void) | null>(null);

	const start = (e: any) => {
		e.preventDefault();
		e.stopPropagation();

		if (readonly) {
			return;
		};

		const node = nodeRef.current;
		const icon = iconRef.current;
		if (!node || !icon) {
			return;
		};

		const iw = icon.offsetWidth;
		const ox = node.getBoundingClientRect().left + window.scrollX;

		move(e.pageX - ox - iw / 2);
		U.Dom.addClass(node, 'isDragging');

		onStart?.(e, value);

		if (moveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', moveHandler.current);
			U.Dom.removeEvent(window, 'touchmove', moveHandler.current);
		};
		if (upHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', upHandler.current);
			U.Dom.removeEvent(window, 'touchend', upHandler.current);
		};

		moveHandler.current = (e: any) => {
			move(e.pageX - ox - iw / 2);
			onMove?.(e, value);
		};
		upHandler.current = (e: any) => {
			end(e);
			onEnd?.(e, value);
		};

		U.Dom.addEvents(window, [
			['mousemove', moveHandler.current],
			['touchmove', moveHandler.current],
			['mouseup', upHandler.current],
			['touchend', upHandler.current],
		]);
	};

	const move = (x: number) => {
		const node = nodeRef.current;
		const icon = iconRef.current;
		const back = backRef.current;
		const fill = fillRef.current;
		if (!node || !icon || !back || !fill) {
			return;
		};

		const nw = node.offsetWidth;
		const iw = icon.offsetWidth / 2;
		const ib = parseInt(getComputedStyle(icon).borderWidth) || 0;
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
		const bw = Math.max(0, nw - w - iw - ib * 2);

		U.Dom.css(icon, { left: `${x}px` });
		U.Dom.css(back, { left: `${w + iw + ib * 2}px`, width: `${bw}px` });
		U.Dom.css(fill, { width: `${w + (iconIsOutside ? 0 : iw) - ib * 2}px` });
	};

	const end = (e) => {
		e.preventDefault();
		e.stopPropagation();

		if (moveHandler.current) {
			U.Dom.removeEvent(window, 'mousemove', moveHandler.current);
			U.Dom.removeEvent(window, 'touchmove', moveHandler.current);
			moveHandler.current = null;
		};
		if (upHandler.current) {
			U.Dom.removeEvent(window, 'mouseup', upHandler.current);
			U.Dom.removeEvent(window, 'touchend', upHandler.current);
			upHandler.current = null;
		};

		U.Dom.removeClass(nodeRef.current, 'isDragging');
	};

	useEffect(() => setValue(initialValue), []);

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